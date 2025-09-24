import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createTicketSchema = z.object({
  sessionId: z.string(),
  name: z.string().min(1, 'チケット名は必須です'),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0, '価格は0以上である必要があります'),
  taxRate: z.number().int().min(0).max(100).default(10),
  stock: z.number().int().min(0),
  maxPerOrder: z.number().int().min(1).default(10),
  salesStartAt: z.string().datetime().optional().nullable(),
  salesEndAt: z.string().datetime().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true)
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ seminarId: string; sessionId: string }> }
) {
  try {
    await requireAuth()
    const { sessionId } = await context.params

    const tickets = await prisma.ticketType.findMany({
      where: { sessionId },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('チケット一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'チケット情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ seminarId: string; sessionId: string }> }
) {
  try {
    const user = await requireAuth()
    if (user.role === 'VIEWER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createTicketSchema.parse(body)

    // セッションの存在確認
    const session = await prisma.session.findUnique({
      where: { id: validatedData.sessionId }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      )
    }

    const ticket = await prisma.ticketType.create({
      data: {
        sessionId: validatedData.sessionId,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        taxRate: validatedData.taxRate,
        stock: validatedData.stock,
        maxPerOrder: validatedData.maxPerOrder,
        salesStartAt: validatedData.salesStartAt ? new Date(validatedData.salesStartAt) : null,
        salesEndAt: validatedData.salesEndAt ? new Date(validatedData.salesEndAt) : null,
        sortOrder: validatedData.sortOrder,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json(ticket)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.error('チケット作成エラー:', error)
    return NextResponse.json(
      { error: 'チケットの作成に失敗しました' },
      { status: 500 }
    )
  }
}
