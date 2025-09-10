import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse, SessionWithDetails } from '@/types'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<SessionWithDetails>>> {
  try {
    const { id } = await context.params

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        seminar: {
          include: {
            cancellationPolicy: true,
          },
        },
        ticketTypes: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'セッションが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: session as SessionWithDetails,
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { success: false, error: 'セッション情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
