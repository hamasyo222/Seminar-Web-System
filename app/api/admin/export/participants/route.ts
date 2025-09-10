import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { generateParticipantsCSV } from '@/lib/csv'
import { logger } from '@/lib/logger'
import type { ParticipantWithDetails } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    
    // VIEWERは除外
    if (user.role === 'VIEWER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const attendanceStatus = searchParams.get('attendanceStatus')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'セッションIDが必要です' },
        { status: 400 }
      )
    }

    // クエリ条件構築
    const where: any = {
      order: {
        sessionId,
        status: 'PAID'
      }
    }

    if (attendanceStatus) {
      where.attendanceStatus = attendanceStatus
    }

    // 参加者データ取得
    const participants = await prisma.participant.findMany({
      where,
      include: {
        order: {
          include: {
            session: {
              include: {
                seminar: true
              }
            }
          }
        },
        zoomRegistrations: true
      },
      orderBy: [
        { attendanceStatus: 'asc' },
        { name: 'asc' }
      ]
    })

    logger.audit('EXPORT_PARTICIPANTS', user.id, {
      count: participants.length,
      sessionId,
      attendanceStatus
    })

    // CSV生成
    const csv = generateParticipantsCSV(participants as ParticipantWithDetails[])
    const filename = `participants_${sessionId}_${new Date().toISOString().split('T')[0]}.csv`

    // レスポンス
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })
  } catch (error) {
    logger.error('Error exporting participants', error)
    return NextResponse.json(
      { error: 'エクスポートに失敗しました' },
      { status: 500 }
    )
  }
}
