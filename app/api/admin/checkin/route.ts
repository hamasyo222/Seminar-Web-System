import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { logger } from '@/lib/logger'
import type { ApiResponse } from '@/types'

// 参加者リスト取得
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'セッションIDが指定されていません' },
        { status: 400 }
      )
    }

    // セッション情報を取得
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        seminar: true
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 参加者リストを取得
    const participants = await prisma.participant.findMany({
      where: {
        order: {
          sessionId,
          status: 'PAID'
        }
      },
      include: {
        order: true,
        zoomRegistrations: true
      },
      orderBy: [
        { attendanceStatus: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: {
        session,
        participants
      }
    })
  } catch (error) {
    logger.error('Error fetching check-in data', error)
    return NextResponse.json(
      { success: false, error: '参加者リストの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// チェックイン処理
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await requireAuth()
    const body = await req.json()
    
    const { participantId, action } = body

    if (!participantId || !action) {
      return NextResponse.json(
        { success: false, error: '必要なパラメータが不足しています' },
        { status: 400 }
      )
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        order: {
          include: {
            session: true
          }
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { success: false, error: '参加者が見つかりません' },
        { status: 404 }
      )
    }

    if (participant.order.status !== 'PAID') {
      return NextResponse.json(
        { success: false, error: '支払いが完了していない参加者です' },
        { status: 400 }
      )
    }

    let updatedParticipant

    if (action === 'checkin') {
      // チェックイン
      if (participant.attendanceStatus === 'CHECKED_IN') {
        return NextResponse.json(
          { success: false, error: '既にチェックイン済みです' },
          { status: 400 }
        )
      }

      updatedParticipant = await prisma.participant.update({
        where: { id: participantId },
        data: {
          attendanceStatus: 'CHECKED_IN',
          checkedInAt: new Date(),
          checkedInBy: user.id
        }
      })

      // 監査ログ記録
      await prisma.checkInLog.create({
        data: {
          participantId,
          orderId: participant.orderId,
          sessionId: participant.order.sessionId,
          action: 'CHECK_IN',
          checkedInBy: user.id,
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined
        }
      })

      logger.audit('PARTICIPANT_CHECKED_IN', user.id, {
        participantId,
        sessionId: participant.order.sessionId
      })
    } else if (action === 'undo') {
      // チェックイン取消
      if (participant.attendanceStatus !== 'CHECKED_IN') {
        return NextResponse.json(
          { success: false, error: 'チェックインされていません' },
          { status: 400 }
        )
      }

      updatedParticipant = await prisma.participant.update({
        where: { id: participantId },
        data: {
          attendanceStatus: 'NOT_CHECKED_IN',
          checkedInAt: null,
          checkedInBy: null
        }
      })

      // 監査ログ記録
      await prisma.checkInLog.create({
        data: {
          participantId,
          orderId: participant.orderId,
          sessionId: participant.order.sessionId,
          action: 'UNDO_CHECK_IN',
          checkedInBy: user.id,
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined
        }
      })

      logger.audit('PARTICIPANT_CHECK_IN_UNDONE', user.id, {
        participantId,
        sessionId: participant.order.sessionId
      })
    } else {
      return NextResponse.json(
        { success: false, error: '無効なアクションです' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedParticipant
    })
  } catch (error) {
    logger.error('Error processing check-in', error)
    return NextResponse.json(
      { success: false, error: 'チェックイン処理に失敗しました' },
      { status: 500 }
    )
  }
}
