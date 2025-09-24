import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { orderFormSchema } from '@/lib/validations'
import { generateOrderNumber } from '@/utils'
import { logger } from '@/lib/logger'
import { createKomojuSession, toKomojuPaymentMethod } from '@/lib/komoju'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json()
    
    // バリデーション
    const validationResult = orderFormSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'バリデーションエラー',
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // セッション情報を取得
    const session = await prisma.session.findUnique({
      where: { id: data.sessionId },
      include: {
        ticketTypes: true,
        seminar: true,
      },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 在庫チェック
    let totalQuantity = 0
    let totalAmount = 0
    const ticketDetails: any[] = []

    for (const ticket of data.tickets) {
      const ticketType = session.ticketTypes.find(t => t.id === ticket.ticketTypeId)
      if (!ticketType) {
        return NextResponse.json(
          { success: false, error: 'チケット種別が見つかりません' },
          { status: 400 }
        )
      }

      const orderedCount = await prisma.orderItem.aggregate({
        where: {
          ticketTypeId: ticket.ticketTypeId,
          order: {
            sessionId: data.sessionId,
            status: { in: ['PENDING', 'PAID'] },
          },
        },
        _sum: {
          quantity: true,
        },
      })

      const usedStock = orderedCount._sum.quantity || 0
      const availableStock = ticketType.stock - usedStock

      if (ticket.quantity > availableStock) {
        return NextResponse.json(
          { success: false, error: `${ticketType.name}の在庫が不足しています` },
          { status: 400 }
        )
      }

      totalQuantity += ticket.quantity
      totalAmount += ticketType.price * ticket.quantity
      ticketDetails.push({
        ticketType,
        quantity: ticket.quantity,
        subtotal: ticketType.price * ticket.quantity,
      })
    }

    // 参加者数とチケット数の整合性チェック
    if (data.participants.length !== totalQuantity) {
      return NextResponse.json(
        { success: false, error: '参加者数とチケット数が一致しません' },
        { status: 400 }
      )
    }

    // 重複チェック（同一セッション・同一メールアドレス）
    for (const participant of data.participants) {
      const existing = await prisma.participant.findFirst({
        where: {
          email: participant.email,
          order: {
            sessionId: data.sessionId,
            status: { in: ['PENDING', 'PAID'] },
          },
        },
      })

      if (existing) {
        return NextResponse.json(
          { 
            success: false, 
            error: `${participant.email} は既にこのセミナーに申し込まれています` 
          },
          { status: 400 }
        )
      }
    }

    // トランザクションで注文を作成
    const order = await prisma.$transaction(async (tx) => {
      // 注文作成
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          sessionId: data.sessionId,
          email: data.email,
          name: data.name,
          nameKana: data.nameKana || null,
          phone: data.phone || null,
          company: data.company || null,
          subtotal: totalAmount,
          tax: 0, // 税込価格のため0
          total: totalAmount,
          paymentMethod: data.paymentMethod,
          status: 'PENDING',
          // 領収書名義情報
          invoiceRecipientType: data.invoiceRecipientType || null,
          invoiceCompanyName: data.invoiceCompanyName || null,
          invoiceDepartment: data.invoiceDepartment || null,
          invoiceTitle: data.invoiceTitle || null,
          invoiceHonorific: data.invoiceHonorific || null,
          invoiceNote: data.invoiceNote || null,
          notes: data.notes || null,
        },
      })

      // 注文明細作成
      for (const detail of ticketDetails) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            ticketTypeId: detail.ticketType.id,
            quantity: detail.quantity,
            unitPrice: detail.ticketType.price,
            subtotal: detail.subtotal,
          },
        })
      }

      // 参加者作成
      for (const participant of data.participants) {
        await tx.participant.create({
          data: {
            orderId: newOrder.id,
            email: participant.email,
            name: participant.name,
            nameKana: participant.nameKana || null,
            company: participant.company || null,
          },
        })
      }

      return newOrder
    })

    logger.info('Order created', { orderId: order.id, orderNumber: order.orderNumber })

    // KOMOJU決済セッション作成
    try {
      const paymentMethod = order.paymentMethod ?? data.paymentMethod

      const komojuSession = await createKomojuSession({
        amount: order.total,
        paymentMethods: [toKomojuPaymentMethod(paymentMethod)],
        externalOrderNum: order.orderNumber,
        metadata: {
          orderId: order.id,
          seminarTitle: session.seminar?.title,
          sessionId: order.sessionId,
        },
      })

      await prisma.order.update({
        where: { id: order.id },
        data: { komojuSessionId: komojuSession.id },
      })

      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          paymentUrl: komojuSession.session_url,
        },
      })
    } catch (error) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      })

      logger.error('Failed to create KOMOJU session', error, { orderId: order.id })

      return NextResponse.json(
        { success: false, error: '決済処理の開始に失敗しました' },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('Error creating order', error)
    return NextResponse.json(
      { success: false, error: '注文の作成に失敗しました' },
      { status: 500 }
    )
  }
}
