import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createCouponSchema = z.object({
  code: z.string().min(1, 'クーポンコードは必須です').toUpperCase(),
  name: z.string().min(1, 'クーポン名は必須です'),
  discountType: z.enum(['AMOUNT', 'PERCENTAGE']),
  discountValue: z.number().int().positive('割引値は正の数である必要があります'),
  usageLimit: z.number().int().positive().nullable(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  minAmount: z.number().int().min(0).nullable(),
  seminarIds: z.string(),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(coupons)
  } catch (error) {
    console.error('クーポン一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'クーポンの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createCouponSchema.parse(body)

    // コードの重複チェック
    const existing = await prisma.coupon.findUnique({
      where: { code: validatedData.code }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'このクーポンコードは既に使用されています' },
        { status: 400 }
      )
    }

    // 有効期間の検証
    const validFrom = new Date(validatedData.validFrom)
    const validUntil = new Date(validatedData.validUntil)

    if (validFrom >= validUntil) {
      return NextResponse.json(
        { error: '有効終了日時は開始日時より後である必要があります' },
        { status: 400 }
      )
    }

    // パーセント割引の場合、100%を超えないように検証
    if (validatedData.discountType === 'PERCENTAGE' && validatedData.discountValue > 100) {
      return NextResponse.json(
        { error: 'パーセント割引は100%を超えることはできません' },
        { status: 400 }
      )
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        discountType: validatedData.discountType,
        discountValue: validatedData.discountValue,
        usageLimit: validatedData.usageLimit,
        validFrom,
        validUntil,
        minAmount: validatedData.minAmount,
        seminarIds: validatedData.seminarIds,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json(coupon)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.error('クーポン作成エラー:', error)
    return NextResponse.json(
      { error: 'クーポンの作成に失敗しました' },
      { status: 500 }
    )
  }
}
