import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse, OrderWithDetails } from '@/types'

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<OrderWithDetails[]>>> {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスが必要です' },
        { status: 400 }
      )
    }

    // メールアドレスで注文を検索
    const orders = await prisma.order.findMany({
      where: {
        email: email.toLowerCase(),
      },
      include: {
        session: {
          include: {
            seminar: {
              include: {
                cancellationPolicy: true
              }
            },
            ticketTypes: true
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
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        invoices: {
          orderBy: { issuedAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: orders as any
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: '注文情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}