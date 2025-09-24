import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateCouponSchema = z.object({
  name: z.string().min(1).optional(),
  discountType: z.enum(['AMOUNT', 'PERCENTAGE']).optional(),
  discountValue: z.number().int().positive().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  minAmount: z.number().int().min(0).nullable().optional(),
  seminarIds: z.string().optional(),
  isActive: z.boolean().optional()
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const validatedData = updateCouponSchema.parse(body)

    // クーポンの存在確認
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id }
    })

    if (!existingCoupon) {
      return NextResponse.json(
        { error: 'クーポンが見つかりません' },
        { status: 404 }
      )
    }

    // 有効期間の検証
    if (validatedData.validFrom && validatedData.validUntil) {
      const validFrom = new Date(validatedData.validFrom)
      const validUntil = new Date(validatedData.validUntil)

      if (validFrom >= validUntil) {
        return NextResponse.json(
          { error: '有効終了日時は開始日時より後である必要があります' },
          { status: 400 }
        )
      }
    }

    // パーセント割引の場合、100%を超えないように検証
    const discountType = validatedData.discountType || existingCoupon.discountType
    const discountValue = validatedData.discountValue || existingCoupon.discountValue
    
    if (discountType === 'PERCENTAGE' && discountValue > 100) {
      return NextResponse.json(
        { error: 'パーセント割引は100%を超えることはできません' },
        { status: 400 }
      )
    }

    const updateData: any = { ...validatedData }
    if (validatedData.validFrom) {
      updateData.validFrom = new Date(validatedData.validFrom)
    }
    if (validatedData.validUntil) {
      updateData.validUntil = new Date(validatedData.validUntil)
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(coupon)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.error('クーポン更新エラー:', error)
    return NextResponse.json(
      { error: 'クーポンの更新に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    // 使用済みかチェック
    const coupon = await prisma.coupon.findUnique({
      where: { id }
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'クーポンが見つかりません' },
        { status: 404 }
      )
    }

    if (coupon.usageCount > 0) {
      return NextResponse.json(
        { error: '使用済みのクーポンは削除できません' },
        { status: 400 }
      )
    }

    await prisma.coupon.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('クーポン削除エラー:', error)
    return NextResponse.json(
      { error: 'クーポンの削除に失敗しました' },
      { status: 500 }
    )
  }
}
