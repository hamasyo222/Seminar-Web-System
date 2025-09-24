import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateTicketSchema = z.object({
  name: z.string().min(1, 'チケット名は必須です').optional(),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0).optional(),
  taxRate: z.number().int().min(0).max(100).optional(),
  stock: z.number().int().min(0).optional(),
  maxPerOrder: z.number().int().min(1).optional(),
  salesStartAt: z.string().datetime().optional().nullable(),
  salesEndAt: z.string().datetime().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional()
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ seminarId: string; sessionId: string; ticketId: string }> }
) {
  try {
    const user = await requireAuth()
    if (user.role === 'VIEWER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const { ticketId } = await context.params
    const body = await request.json()
    const validatedData = updateTicketSchema.parse(body)

    // チケットの存在確認
    const existingTicket = await prisma.ticketType.findUnique({
      where: { id: ticketId }
    })

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'チケット種別が見つかりません' },
        { status: 404 }
      )
    }

    const updateData: any = { ...validatedData }
    if (validatedData.salesStartAt !== undefined) {
      updateData.salesStartAt = validatedData.salesStartAt ? new Date(validatedData.salesStartAt) : null
    }
    if (validatedData.salesEndAt !== undefined) {
      updateData.salesEndAt = validatedData.salesEndAt ? new Date(validatedData.salesEndAt) : null
    }

    const ticket = await prisma.ticketType.update({
      where: { id: ticketId },
      data: updateData
    })

    return NextResponse.json(ticket)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.error('チケット更新エラー:', error)
    return NextResponse.json(
      { error: 'チケットの更新に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ seminarId: string; sessionId: string; ticketId: string }> }
) {
  try {
    const user = await requireAuth()
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const { ticketId } = await context.params

    // 既に注文があるかチェック
    const orderItemsCount = await prisma.orderItem.count({
      where: { ticketTypeId: ticketId }
    })

    if (orderItemsCount > 0) {
      return NextResponse.json(
        { error: 'このチケット種別には既に注文があるため削除できません' },
        { status: 400 }
      )
    }

    await prisma.ticketType.delete({
      where: { id: ticketId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('チケット削除エラー:', error)
    return NextResponse.json(
      { error: 'チケットの削除に失敗しました' },
      { status: 500 }
    )
  }
}
