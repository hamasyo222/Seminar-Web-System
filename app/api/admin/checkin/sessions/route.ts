import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import type { ApiResponse, SessionWithDetails } from '@/types'

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SessionWithDetails[]>>> {
  try {
    await requireAuth()

    // 本日開催のセッションを取得
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const sessions = await prisma.session.findMany({
      where: {
        status: 'SCHEDULED',
        startAt: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        seminar: true,
        ticketTypes: {
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: {
        startAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: sessions as SessionWithDetails[]
    })
  } catch (error) {
    console.error('Error fetching today sessions:', error)
    return NextResponse.json(
      { success: false, error: '本日のセッション取得に失敗しました' },
      { status: 500 }
    )
  }
}




