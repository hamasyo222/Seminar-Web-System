import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createSessionSchema = z.object({
  seminarId: z.string(),
  title: z.string().optional().nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  format: z.enum(['OFFLINE', 'ONLINE', 'HYBRID']),
  venue: z.string().optional().nullable(),
  venueAddress: z.string().optional().nullable(),
  onlineUrl: z.string().url().optional().nullable(),
  zoomType: z.enum(['MEETING', 'WEBINAR']).optional().nullable(),
  zoomId: z.string().optional().nullable(),
  zoomPasscode: z.string().optional().nullable(),
  capacity: z.number().int().min(1),
  status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']).default('SCHEDULED')
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ seminarId: string }> }
) {
  try {
    await requireAuth()
    const { seminarId } = await context.params

    const sessions = await prisma.session.findMany({
      where: { seminarId },
      include: {
        ticketTypes: {
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { startAt: 'desc' }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('セッション一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'セッション情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ seminarId: string }> }
) {
  try {
    const user = await requireAuth()
    if (user.role === 'VIEWER' || user.role === 'ACCOUNTANT') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createSessionSchema.parse(body)

    // セミナーの存在確認
    const seminar = await prisma.seminar.findUnique({
      where: { id: validatedData.seminarId }
    })

    if (!seminar) {
      return NextResponse.json(
        { error: 'セミナーが見つかりません' },
        { status: 404 }
      )
    }

    // 開始時刻と終了時刻の検証
    const startAt = new Date(validatedData.startAt)
    const endAt = new Date(validatedData.endAt)

    if (startAt >= endAt) {
      return NextResponse.json(
        { error: '終了時刻は開始時刻より後である必要があります' },
        { status: 400 }
      )
    }

    // フォーマットに応じた必須項目の検証
    if (validatedData.format === 'OFFLINE' || validatedData.format === 'HYBRID') {
      if (!validatedData.venue) {
        return NextResponse.json(
          { error: 'オフライン開催の場合、会場は必須です' },
          { status: 400 }
        )
      }
    }

    if (validatedData.format === 'ONLINE' || validatedData.format === 'HYBRID') {
      if (!validatedData.onlineUrl && !validatedData.zoomId) {
        return NextResponse.json(
          { error: 'オンライン開催の場合、オンラインURLまたはZoom IDは必須です' },
          { status: 400 }
        )
      }
    }

    const session = await prisma.session.create({
      data: {
        seminarId: validatedData.seminarId,
        title: validatedData.title,
        startAt,
        endAt,
        format: validatedData.format,
        venue: validatedData.venue,
        venueAddress: validatedData.venueAddress,
        onlineUrl: validatedData.onlineUrl,
        zoomType: validatedData.zoomType,
        zoomId: validatedData.zoomId,
        zoomPasscode: validatedData.zoomPasscode,
        capacity: validatedData.capacity,
        status: validatedData.status
      }
    })

    return NextResponse.json(session)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.error('セッション作成エラー:', error)
    return NextResponse.json(
      { error: 'セッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}
