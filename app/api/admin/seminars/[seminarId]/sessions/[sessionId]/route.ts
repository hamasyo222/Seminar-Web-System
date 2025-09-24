import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { sessionValidators } from '@/lib/api/validators'

const updateSessionSchema = sessionValidators.createSession.partial().omit({ seminarId: true })

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ seminarId: string; sessionId: string }> }
) {
  try {
    await requireAuth()
    const { sessionId } = await context.params

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        seminar: true,
        ticketTypes: {
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: { orders: true }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('セッション取得エラー:', error)
    return NextResponse.json(
      { error: 'セッション情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ seminarId: string; sessionId: string }> }
) {
  try {
    const user = await requireAuth()
    if (user.role === 'VIEWER' || user.role === 'ACCOUNTANT') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const { sessionId } = await context.params
    const body = await request.json()
    const validatedData = updateSessionSchema.parse(body)

    // セッションの存在確認
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 日時の検証
    if (validatedData.startAt && validatedData.endAt) {
      const startAt = new Date(validatedData.startAt)
      const endAt = new Date(validatedData.endAt)

      if (startAt >= endAt) {
        return NextResponse.json(
          { error: '終了時刻は開始時刻より後である必要があります' },
          { status: 400 }
        )
      }
    }

    // フォーマットに応じた必須項目の検証
    const format = validatedData.format || existingSession.format
    if ((format === 'OFFLINE' || format === 'HYBRID') && validatedData.venue === '') {
      return NextResponse.json(
        { error: 'オフライン開催の場合、会場は必須です' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.startAt !== undefined) updateData.startAt = new Date(validatedData.startAt)
    if (validatedData.endAt !== undefined) updateData.endAt = new Date(validatedData.endAt)
    if (validatedData.format !== undefined) updateData.format = validatedData.format
    if (validatedData.venue !== undefined) updateData.venue = validatedData.venue
    if (validatedData.venueAddress !== undefined) updateData.venueAddress = validatedData.venueAddress
    if (validatedData.onlineUrl !== undefined) updateData.onlineUrl = validatedData.onlineUrl
    if (validatedData.zoomType !== undefined) updateData.zoomType = validatedData.zoomType
    if (validatedData.zoomId !== undefined) updateData.zoomId = validatedData.zoomId
    if (validatedData.zoomPasscode !== undefined) updateData.zoomPasscode = validatedData.zoomPasscode
    if (validatedData.capacity !== undefined) updateData.capacity = validatedData.capacity
    if (validatedData.status !== undefined) updateData.status = validatedData.status

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: updateData
    })

    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.error('セッション更新エラー:', error)
    return NextResponse.json(
      { error: 'セッションの更新に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ seminarId: string; sessionId: string }> }
) {
  try {
    const user = await requireAuth()
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const { sessionId } = await context.params

    // 既に注文があるかチェック
    const ordersCount = await prisma.order.count({
      where: { sessionId }
    })

    if (ordersCount > 0) {
      return NextResponse.json(
        { error: 'このセッションには既に注文があるため削除できません' },
        { status: 400 }
      )
    }

    // 関連するチケット種別も削除
    await prisma.ticketType.deleteMany({
      where: { sessionId }
    })

    await prisma.session.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('セッション削除エラー:', error)
    return NextResponse.json(
      { error: 'セッションの削除に失敗しました' },
      { status: 500 }
    )
  }
}
