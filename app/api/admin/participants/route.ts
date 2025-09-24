import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')
    const status = searchParams.get('status')
    const keyword = searchParams.get('keyword')

    const where: any = {}

    if (sessionId) {
      where.order = {
        sessionId
      }
    }

    if (status) {
      where.attendanceStatus = status
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { company: { contains: keyword, mode: 'insensitive' } }
      ]
    }

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
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(participants)
  } catch (error) {
    console.error('参加者一覧取得エラー:', error)
    return NextResponse.json(
      { error: '参加者情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user.role === 'VIEWER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { participantId, attendanceStatus } = body

    if (!participantId || !attendanceStatus) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      )
    }

    const participant = await prisma.participant.update({
      where: { id: participantId },
      data: {
        attendanceStatus,
        checkedInAt: attendanceStatus === 'CHECKED_IN' ? new Date() : null,
        checkedInBy: attendanceStatus === 'CHECKED_IN' ? user.id : null
      }
    })

    // 受付ログを記録
    if (attendanceStatus === 'CHECKED_IN' || attendanceStatus === 'NOT_CHECKED_IN') {
      const participantData = await prisma.participant.findUnique({
        where: { id: participantId },
        include: { order: true }
      })

      if (participantData) {
        await prisma.checkInLog.create({
          data: {
            participantId,
            orderId: participantData.order.id,
            sessionId: participantData.order.sessionId,
            action: attendanceStatus === 'CHECKED_IN' ? 'CHECK_IN' : 'UNDO_CHECK_IN',
            checkedInBy: user.id
          }
        })
      }
    }

    return NextResponse.json(participant)
  } catch (error) {
    console.error('参加者情報更新エラー:', error)
    return NextResponse.json(
      { error: '参加者情報の更新に失敗しました' },
      { status: 500 }
    )
  }
}
