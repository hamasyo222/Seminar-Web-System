import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse, OrderWithDetails } from '@/types'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse<ApiResponse<OrderWithDetails>>> {
  try {
    const { sessionId } = await context.params

    const order = await prisma.order.findFirst({
      where: { 
        komojuSessionId: sessionId 
      },
      include: {
        session: {
          include: {
            seminar: true,
          },
        },
        orderItems: {
          include: {
            ticketType: true,
          },
        },
        participants: true,
        payments: true,
        refunds: true,
        invoices: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: '注文が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order as OrderWithDetails,
    })
  } catch (error) {
    console.error('Error fetching order by session:', error)
    return NextResponse.json(
      { success: false, error: '注文情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
