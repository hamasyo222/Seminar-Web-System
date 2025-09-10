import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { sessionSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'
import type { ApiResponse } from '@/types'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ seminarId: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await requireAuth()
    
    if (user.role === 'VIEWER') {
      return NextResponse.json(
        { success: false, error: '権限がありません' },
        { status: 403 }
      )
    }

    const { seminarId } = await context.params
    const body = await req.json()
    
    // バリデーション
    const validationResult = sessionSchema.safeParse({ ...body, seminarId })
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'バリデーションエラー',
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // セミナーの存在確認
    const seminar = await prisma.seminar.findUnique({
      where: { id: seminarId }
    })

    if (!seminar) {
      return NextResponse.json(
        { success: false, error: 'セミナーが見つかりません' },
        { status: 404 }
      )
    }

    // 日時の妥当性チェック
    const startAt = new Date(data.startAt)
    const endAt = new Date(data.endAt)

    if (startAt >= endAt) {
      return NextResponse.json(
        { success: false, error: '終了日時は開始日時より後に設定してください' },
        { status: 400 }
      )
    }

    // セッション作成
    const session = await prisma.session.create({
      data: {
        seminarId,
        title: data.title || null,
        startAt,
        endAt,
        format: data.format,
        venue: data.venue || null,
        venueAddress: data.venueAddress || null,
        onlineUrl: data.onlineUrl || null,
        zoomType: data.zoomType || null,
        zoomId: data.zoomId || null,
        zoomPasscode: data.zoomPasscode || null,
        capacity: data.capacity,
        status: data.status
      }
    })

    logger.audit('SESSION_CREATED', user.id, { 
      sessionId: session.id,
      seminarId 
    })

    return NextResponse.json({
      success: true,
      data: session
    })
  } catch (error) {
    logger.error('Error creating session', error)
    return NextResponse.json(
      { success: false, error: 'セッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}
