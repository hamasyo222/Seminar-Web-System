import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createAuditLog, AuditAction, getAuditContext } from '@/lib/audit'
import { sendEmail } from '@/lib/mail'
import { generateInvoicePDF } from '@/lib/pdf'
import { generateCSV } from '@/lib/csv'
import { z } from 'zod'

const bulkActionSchema = z.object({
  action: z.enum(['export', 'send_email', 'generate_invoice', 'cancel', 'update_status']),
  orderIds: z.array(z.string()).min(1, '注文を選択してください'),
  params: z.any().optional()
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { action, orderIds, params } = bulkActionSchema.parse(body)

    // 権限チェック
    if (user.role === 'VIEWER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const context = getAuditContext(request, user)

    switch (action) {
      case 'export':
        return await handleExport(orderIds, user, context)
      
      case 'send_email':
        return await handleSendEmail(orderIds, params, user, context)
      
      case 'generate_invoice':
        return await handleGenerateInvoice(orderIds, user, context)
      
      case 'cancel':
        return await handleCancel(orderIds, user, context)
      
      case 'update_status':
        return await handleUpdateStatus(orderIds, params, user, context)
      
      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.error('Bulk action error:', error)
    return NextResponse.json(
      { error: '一括操作に失敗しました' },
      { status: 500 }
    )
  }
}

// CSVエクスポート
async function handleExport(orderIds: string[], user: any, context: any) {
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    include: {
      session: {
        include: { seminar: true }
      },
      participants: true,
      orderItems: {
        include: { ticketType: true }
      }
    }
  })

  const headers = [
    '注文番号',
    '注文日',
    'セミナー名',
    '開催日',
    '参加者名',
    'メールアドレス',
    '会社名',
    'チケット種別',
    '合計金額',
    '支払方法',
    'ステータス'
  ]

  const rows = orders.flatMap(order => 
    order.participants.map(participant => [
      order.orderNumber,
      order.createdAt.toISOString(),
      order.session.seminar.title,
      order.session.startAt.toISOString(),
      participant.name,
      participant.email,
      participant.company || '',
      order.orderItems.map(item => 
        `${item.ticketType.name}×${item.quantity}`
      ).join(', '),
      order.total,
      order.paymentMethod || '',
      order.status
    ])
  )

  const csvData = generateCSV(headers, rows)

  // 監査ログ
  await createAuditLog(
    {
      action: AuditAction.DATA_EXPORT,
      entityType: 'Order',
      metadata: {
        orderIds,
        count: orders.length
      },
      description: `注文データをエクスポート (${orders.length}件)`
    },
    context
  )

  const encoder = new TextEncoder()
  const csvBuffer = encoder.encode(csvData)

  return new NextResponse(csvBuffer, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}

// 一括メール送信
async function handleSendEmail(orderIds: string[], params: any, user: any, context: any) {
  const { emailType, templateId, subject, message } = params

  const orders = await prisma.order.findMany({
    where: { 
      id: { in: orderIds },
      status: 'PAID' // 支払済みのみ
    },
    include: {
      session: {
        include: { seminar: true }
      },
      participants: true
    }
  })

  let successCount = 0
  let errorCount = 0

  for (const order of orders) {
    for (const participant of order.participants) {
      try {
        if (templateId) {
          // テンプレート使用
          await sendEmail({
            to: [participant.email],
            subject: 'セミナー関連のお知らせ', // テンプレートから自動設定される
            templateCode: templateId,
            variables: {
              participant_name: participant.name,
              seminar_title: order.session.seminar.title,
              order_number: order.orderNumber
            }
          })
        } else {
          // カスタムメッセージ
          const processedMessage = message
            .replace(/{{name}}/g, participant.name)
            .replace(/{{seminar_title}}/g, order.session.seminar.title)
            .replace(/{{session_date}}/g, order.session.startAt.toLocaleString('ja-JP'))

          await sendEmail({
            to: [participant.email],
            subject: subject || `【お知らせ】${order.session.seminar.title}`,
            htmlContent: `<p>${processedMessage.replace(/\n/g, '<br>')}</p>`,
            textContent: processedMessage
          })
        }
        
        successCount++
      } catch (error) {
        console.error('Email send error:', error)
        errorCount++
      }
    }
  }

  // 監査ログ
  await createAuditLog(
    {
      action: AuditAction.EMAIL_SEND,
      entityType: 'Order',
      metadata: {
        orderIds,
        emailType,
        templateId,
        successCount,
        errorCount
      },
      description: `一括メール送信 (成功: ${successCount}件, 失敗: ${errorCount}件)`
    },
    context
  )

  return NextResponse.json({
    success: true,
    data: {
      sent: successCount,
      failed: errorCount
    }
  })
}

// 領収書一括発行
async function handleGenerateInvoice(orderIds: string[], user: any, context: any) {
  const orders = await prisma.order.findMany({
    where: { 
      id: { in: orderIds },
      status: 'PAID'
    },
    include: {
      session: {
        include: { seminar: true }
      },
      orderItems: {
        include: { ticketType: true }
      }
    }
  })

  const invoices = []
  
  for (const order of orders) {
    // 既存の領収書をチェック
    const existingInvoice = await prisma.invoice.findFirst({
      where: { orderId: order.id }
    })

    if (!existingInvoice) {
      // 新規作成
      const invoice = await prisma.invoice.create({
        data: {
          orderId: order.id,
          invoiceNumber: `INV-${Date.now()}-${order.id.slice(-6)}`,
          issuedAt: new Date()
        }
      })
      invoices.push(invoice)
    }
  }

  // 監査ログ
  await createAuditLog(
    {
      action: AuditAction.DATA_EXPORT,
      entityType: 'Order',
      metadata: {
        orderIds,
        generatedCount: invoices.length
      },
      description: `領収書を一括発行 (${invoices.length}件)`
    },
    context
  )

  return NextResponse.json({
    success: true,
    data: {
      generated: invoices.length,
      skipped: orders.length - invoices.length
    }
  })
}

// 一括キャンセル
async function handleCancel(orderIds: string[], user: any, context: any) {
  // SUPER_ADMINとADMINのみキャンセル可能
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'キャンセル権限がありません' },
      { status: 403 }
    )
  }

  const orders = await prisma.order.findMany({
    where: { 
      id: { in: orderIds },
      status: { in: ['PENDING', 'PAID'] }
    }
  })

  let cancelledCount = 0

  for (const order of orders) {
    try {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      })

      // TODO: 返金処理
      // TODO: 在庫復元

      cancelledCount++
    } catch (error) {
      console.error('Cancel error:', error)
    }
  }

  // 監査ログ
  await createAuditLog(
    {
      action: AuditAction.ORDER_CANCEL,
      entityType: 'Order',
      metadata: {
        orderIds,
        cancelledCount
      },
      description: `注文を一括キャンセル (${cancelledCount}件)`
    },
    context
  )

  return NextResponse.json({
    success: true,
    data: {
      cancelled: cancelledCount,
      failed: orders.length - cancelledCount
    }
  })
}

// ステータス一括更新
async function handleUpdateStatus(orderIds: string[], params: any, user: any, context: any) {
  const { status, reason } = params

  if (!['PENDING', 'PAID', 'CANCELLED', 'REFUNDED'].includes(status)) {
    return NextResponse.json(
      { error: '無効なステータスです' },
      { status: 400 }
    )
  }

  const updatedOrders = await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data: {
      status,
      notes: reason ? `ステータス変更: ${reason}` : undefined
    }
  })

  // 監査ログ
  await createAuditLog(
    {
      action: AuditAction.ORDER_UPDATE,
      entityType: 'Order',
      metadata: {
        orderIds,
        newStatus: status,
        reason,
        count: updatedOrders.count
      },
      description: `注文ステータスを一括更新 (${updatedOrders.count}件)`
    },
    context
  )

  return NextResponse.json({
    success: true,
    data: {
      updated: updatedOrders.count
    }
  })
}
