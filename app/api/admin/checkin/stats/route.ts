import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import type { ApiResponse } from '@/types'

interface CheckInStats {
  total: number
  checkedIn: number
  byTicketType: Array<{
    ticketTypeName: string
    total: number
    checkedIn: number
  }>
  recentCheckIns: Array<{
    participantName: string
    ticketType: string
    checkedInAt: Date
  }>
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CheckInStats>>> {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'セッションIDが必要です' },
        { status: 400 }
      )
    }

    // 全参加者数とチェックイン済み数を取得
    const [total, checkedIn] = await Promise.all([
      prisma.participant.count({
        where: {
          order: {
            sessionId,
            status: 'PAID'
          }
        }
      }),
      prisma.participant.count({
        where: {
          order: {
            sessionId,
            status: 'PAID'
          },
          attendanceStatus: 'CHECKED_IN'
        }
      })
    ])

    // チケット種別ごとの統計
    const ticketStats = await prisma.$queryRaw<Array<{
      ticketTypeName: string
      total: bigint
      checkedIn: bigint
    }>>`
      SELECT 
        tt.name as ticketTypeName,
        COUNT(DISTINCT p.id) as total,
        COUNT(DISTINCT CASE WHEN p.attendance_status = 'CHECKED_IN' THEN p.id END) as checkedIn
      FROM participants p
      JOIN orders o ON p.order_id = o.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN ticket_types tt ON oi.ticket_type_id = tt.id
      WHERE o.session_id = ${sessionId}
        AND o.status = 'PAID'
      GROUP BY tt.name
    `

    // 最近のチェックイン（最新10件）
    const recentCheckIns = await prisma.checkInLog.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // participantIdを収集
    const participantIds = recentCheckIns.map(log => log.participantId)
    
    // 参加者情報を一括取得
    const participants = await prisma.participant.findMany({
      where: { id: { in: participantIds } },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                ticketType: true
              }
            }
          }
        }
      }
    })

    // participantIdでマップ作成
    const participantMap = new Map(participants.map(p => [p.id, p]))

    const stats: CheckInStats = {
      total,
      checkedIn,
      byTicketType: ticketStats.map(stat => ({
        ticketTypeName: stat.ticketTypeName,
        total: Number(stat.total),
        checkedIn: Number(stat.checkedIn)
      })),
      recentCheckIns: recentCheckIns.map(log => {
        const participant = participantMap.get(log.participantId)
        return {
          participantName: participant?.name || 'Unknown',
          ticketType: participant?.order.orderItems[0]?.ticketType.name || 'Unknown',
          checkedInAt: log.createdAt
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching check-in stats:', error)
    return NextResponse.json(
      { success: false, error: 'チェックイン統計の取得に失敗しました' },
      { status: 500 }
    )
  }
}
