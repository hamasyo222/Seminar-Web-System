import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse, OrderWithDetails } from '@/types'

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<OrderWithDetails>>> {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: '注文番号が必要です' },
        { status: 400 }
      )
    }

    // 注文情報を取得
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        status: 'PAID'
      },
      include: {
        session: {
          include: {
            seminar: true
          }
        },
        participants: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: '注文が見つかりません' },
        { status: 404 }
      )
    }

    // セミナーが終了しているかチェック
    const now = new Date()
    if (order.session.endAt > now) {
      return NextResponse.json(
        { success: false, error: 'セミナーがまだ終了していません' },
        { status: 400 }
      )
    }

    // 既にアンケートに回答済みかチェック
    const existingSurvey = await prisma.$queryRaw`
      SELECT 1 FROM surveys 
      WHERE order_id = ${order.id}
      LIMIT 1
    `

    if (Array.isArray(existingSurvey) && existingSurvey.length > 0) {
      return NextResponse.json(
        { success: false, error: '既にアンケートに回答済みです' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order as OrderWithDetails
    })
  } catch (error) {
    console.error('Error fetching order for survey:', error)
    return NextResponse.json(
      { success: false, error: '注文情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}




