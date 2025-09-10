import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ApiResponse, OrderWithDetails } from '@/types'

const searchSchema = z.object({
  email: z.string().email()
})

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<OrderWithDetails[]>>> {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスが必要です' },
        { status: 400 }
      )
    }

    // バリデーション
    const validationResult = searchSchema.safeParse({ email })
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      )
    }

    // 注文履歴を取得
    const orders = await prisma.order.findMany({
      where: {
        email: validationResult.data.email
      },
      include: {
        session: {
          include: {
            seminar: true
          }
        },
        orderItems: {
          include: {
            ticketType: true
          }
        },
        participants: {
          include: {
            zoomRegistrations: true
          }
        },
        payments: true,
        refunds: true,
        invoices: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: orders as OrderWithDetails[]
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: '注文履歴の取得に失敗しました' },
      { status: 500 }
    )
  }
}
