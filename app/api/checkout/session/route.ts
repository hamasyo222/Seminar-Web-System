import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createKomojuSession, toKomojuPaymentMethod } from '@/lib/komoju'
import { logger } from '@/lib/logger'
import type { ApiResponse } from '@/types'

const createSessionSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CREDIT_CARD', 'KONBINI', 'PAYPAY', 'BANK_TRANSFER']),
})

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json()
    
    // バリデーション
    const validationResult = createSessionSchema.safeParse(body)
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

    const { orderId, amount, paymentMethod } = validationResult.data

    // 注文情報を取得
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        session: {
          include: {
            seminar: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: '注文が見つかりません' },
        { status: 404 }
      )
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'この注文は既に処理されています' },
        { status: 400 }
      )
    }

    if (order.total !== amount) {
      return NextResponse.json(
        { success: false, error: '金額が一致しません' },
        { status: 400 }
      )
    }

    // KOMOJUセッション作成
    const komojuSession = await createKomojuSession({
      amount,
      paymentMethods: [toKomojuPaymentMethod(paymentMethod)],
      externalOrderNum: order.orderNumber,
      metadata: {
        orderId: order.id,
        seminarTitle: order.session.seminar.title,
        sessionId: order.sessionId,
      },
    })

    // KOMOJUセッションIDを注文に保存
    await prisma.order.update({
      where: { id: orderId },
      data: {
        komojuSessionId: komojuSession.id,
        paymentMethod,
      },
    })

    logger.info('Checkout session created', {
      orderId,
      komojuSessionId: komojuSession.id,
      paymentMethod,
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId: komojuSession.id,
        sessionUrl: komojuSession.session_url,
      },
    })
  } catch (error) {
    logger.error('Error creating checkout session', error)
    return NextResponse.json(
      { success: false, error: '決済セッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}
