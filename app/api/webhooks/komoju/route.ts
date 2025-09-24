import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/komoju'
import { logger } from '@/lib/logger'
import type { KomojuWebhookPayload } from '@/types'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // リクエストボディを取得
    const rawBody = await req.text()
    
    // 署名検証
    const signature = req.headers.get('X-Komoju-Signature')
    if (!signature) {
      logger.warn('Missing webhook signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      logger.warn('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // イベントをパース
    const event: KomojuWebhookPayload = JSON.parse(rawBody)
    
    logger.info('Webhook received', { 
      eventId: event.id, 
      eventType: event.type 
    })

    // 冪等性チェック
    const existingEvent = await prisma.komojuEvent.findUnique({
      where: { eventId: event.id }
    })

    if (existingEvent) {
      if (existingEvent.processed) {
        logger.info('Event already processed', { eventId: event.id })
        return NextResponse.json({ success: true, message: 'Already processed' })
      }
      
      // 処理失敗したイベントの再試行
      await prisma.komojuEvent.update({
        where: { eventId: event.id },
        data: { retries: { increment: 1 } }
      })
    } else {
      // イベントを記録
      await prisma.komojuEvent.create({
        data: {
          eventId: event.id,
          eventType: event.type,
          payload: JSON.parse(JSON.stringify(event)),
          signature,
        }
      })
    }

    // イベントタイプに応じて処理
    try {
      switch (event.type) {
        case 'payment.captured':
          await handlePaymentCaptured(event)
          break
        case 'payment.authorized':
          await handlePaymentAuthorized(event)
          break
        case 'payment.failed':
          await handlePaymentFailed(event)
          break
        case 'payment.expired':
          await handlePaymentExpired(event)
          break
        case 'payment.refunded':
          await handlePaymentRefunded(event)
          break
        default:
          logger.info('Unhandled event type', { eventType: event.type })
      }

      // 処理完了を記録
      await prisma.komojuEvent.update({
        where: { eventId: event.id },
        data: { 
          processed: true, 
          processedAt: new Date() 
        }
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      // エラーを記録
      await prisma.komojuEvent.update({
        where: { eventId: event.id },
        data: { 
          error: error instanceof Error ? error.message : String(error)
        }
      })
      throw error
    }
  } catch (error) {
    logger.error('Webhook processing error', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// 支払確定処理
async function handlePaymentCaptured(event: KomojuWebhookPayload) {
  const payment = event.data
  const externalOrderNum = payment.external_order_num
  
  logger.info('Processing payment captured', { 
    paymentId: payment.id,
    externalOrderNum 
  })

  // 注文を取得
  const order = await prisma.order.findFirst({
    where: { orderNumber: externalOrderNum },
    include: {
      participants: {
        include: {
          zoomRegistrations: true
        }
      },
      session: {
        include: {
          seminar: true,
          ticketTypes: true
        }
      },
      orderItems: {
        include: {
          ticketType: true
        }
      },
      payments: true,
      refunds: true,
      invoices: true
    }
  })

  if (!order) {
    logger.error('Order not found', { externalOrderNum })
    throw new Error(`Order not found: ${externalOrderNum}`)
  }

  // トランザクションで更新
  await prisma.$transaction(async (tx) => {
    // 注文を支払済みに更新
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paidAt: new Date(payment.captured_at),
      }
    })

    // 支払記録を作成
    await tx.payment.create({
      data: {
        orderId: order.id,
        komojuPaymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: 'CAPTURED',
        method: order.paymentMethod!,
        capturedAt: new Date(payment.captured_at),
        metadata: payment,
      }
    })

    logger.info('Order marked as paid', { 
      orderId: order.id,
      orderNumber: order.orderNumber 
    })
  })

  // 支払完了通知メール送信
  try {
    const { sendPaymentCompletedEmail } = await import('@/lib/mail/notifications')
    await sendPaymentCompletedEmail(order)
  } catch (error) {
    logger.error('Failed to send payment completed email', error, { orderId: order.id })
  }

  // Zoom自動登録（ウェビナーの場合）
  if (order.session.zoomType && order.session.zoomId) {
    try {
      const { autoRegisterParticipant } = await import('@/lib/zoom')
      for (const participant of order.participants) {
        await autoRegisterParticipant(participant.id, order.sessionId)
      }
    } catch (error) {
      logger.error('Failed to auto-register Zoom participants', error, { orderId: order.id })
    }
  }
}

// 支払承認処理（コンビニ等）
async function handlePaymentAuthorized(event: KomojuWebhookPayload) {
  const payment = event.data
  const externalOrderNum = payment.external_order_num
  
  logger.info('Processing payment authorized', { 
    paymentId: payment.id,
    externalOrderNum 
  })

  const order = await prisma.order.findFirst({
    where: { orderNumber: externalOrderNum },
    include: {
      participants: {
        include: {
          zoomRegistrations: true
        }
      },
      session: {
        include: {
          seminar: true,
          ticketTypes: true
        }
      },
      orderItems: {
        include: {
          ticketType: true
        }
      },
      payments: true,
      refunds: true,
      invoices: true
    }
  })

  if (!order) {
    logger.error('Order not found', { externalOrderNum })
    throw new Error(`Order not found: ${externalOrderNum}`)
  }

  // 支払記録を作成
  await prisma.payment.create({
    data: {
      orderId: order.id,
      komojuPaymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: 'AUTHORIZED',
      method: order.paymentMethod!,
      metadata: payment,
    }
  })

  // 支払方法案内メール送信（コンビニ番号等）
  try {
    const { sendPaymentInstructionEmail } = await import('@/lib/mail/notifications')
    await sendPaymentInstructionEmail(order, payment)
  } catch (error) {
    logger.error('Failed to send payment instruction email', error, { orderId: order.id })
  }
}

// 支払失敗処理
async function handlePaymentFailed(event: KomojuWebhookPayload) {
  const payment = event.data
  const externalOrderNum = payment.external_order_num
  
  logger.info('Processing payment failed', { 
    paymentId: payment.id,
    externalOrderNum 
  })

  const order = await prisma.order.findFirst({
    where: { orderNumber: externalOrderNum },
    include: {
      participants: {
        include: {
          zoomRegistrations: true
        }
      },
      session: {
        include: {
          seminar: true,
          ticketTypes: true
        }
      },
      orderItems: {
        include: {
          ticketType: true
        }
      },
      payments: true,
      refunds: true,
      invoices: true
    }
  })

  if (!order) {
    logger.error('Order not found', { externalOrderNum })
    return
  }

  // 支払記録を作成
  await prisma.payment.create({
    data: {
      orderId: order.id,
      komojuPaymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: 'FAILED',
      method: order.paymentMethod!,
      failedAt: new Date(),
      metadata: payment,
    }
  })

  // 一定回数失敗したら注文をキャンセル
  const failedCount = await prisma.payment.count({
    where: {
      orderId: order.id,
      status: 'FAILED'
    }
  })

  if (failedCount >= 3) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    })
    
    logger.info('Order cancelled due to payment failures', { 
      orderId: order.id,
      failedCount 
    })
  }
}

// 支払期限切れ処理
async function handlePaymentExpired(event: KomojuWebhookPayload) {
  const payment = event.data
  const externalOrderNum = payment.external_order_num
  
  logger.info('Processing payment expired', { 
    paymentId: payment.id,
    externalOrderNum 
  })

  const order = await prisma.order.findFirst({
    where: { orderNumber: externalOrderNum },
    include: {
      participants: {
        include: {
          zoomRegistrations: true
        }
      },
      session: {
        include: {
          seminar: true,
          ticketTypes: true
        }
      },
      orderItems: {
        include: {
          ticketType: true
        }
      },
      payments: true,
      refunds: true,
      invoices: true
    }
  })

  if (!order) {
    logger.error('Order not found', { externalOrderNum })
    return
  }

  // 注文を期限切れに更新
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'EXPIRED',
      cancelledAt: new Date()
    }
  })

  // TODO: 在庫を戻す処理
  
  logger.info('Order expired', { 
    orderId: order.id,
    orderNumber: order.orderNumber 
  })
}

// 返金処理
async function handlePaymentRefunded(event: KomojuWebhookPayload) {
  const payment = event.data
  const externalOrderNum = payment.external_order_num
  
  logger.info('Processing payment refunded', { 
    paymentId: payment.id,
    externalOrderNum,
    refundedAmount: payment.refunded_amount 
  })

  const order = await prisma.order.findFirst({
    where: { orderNumber: externalOrderNum },
    include: {
      participants: {
        include: {
          zoomRegistrations: true
        }
      },
      session: {
        include: {
          seminar: true,
          ticketTypes: true
        }
      },
      orderItems: {
        include: {
          ticketType: true
        }
      },
      payments: true,
      refunds: true,
      invoices: true
    }
  })

  if (!order) {
    logger.error('Order not found', { externalOrderNum })
    return
  }

  // 支払記録を更新
  await prisma.payment.updateMany({
    where: {
      orderId: order.id,
      komojuPaymentId: payment.id,
    },
    data: {
      status: 'REFUNDED',
    }
  })

  // 全額返金の場合は注文ステータスも更新
  if (payment.refunded_amount >= payment.amount) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'REFUNDED',
      }
    })
  }

  // 返金完了通知メール送信
  try {
    const { sendRefundCompletedEmail } = await import('@/lib/mail/notifications')
    await sendRefundCompletedEmail(order, payment.refunded_amount)
  } catch (error) {
    logger.error('Failed to send refund completed email', error, { orderId: order.id })
  }
  
  logger.info('Refund processed', { 
    orderId: order.id,
    orderNumber: order.orderNumber,
    refundedAmount: payment.refunded_amount
  })
}
