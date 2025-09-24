import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, hashPassword } from '@/lib/auth'
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  name: z.string().min(1, '名前は必須です'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'VIEWER']),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります')
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // メールアドレスの重複チェック
    const existing = await prisma.adminUser.findUnique({
      where: { email: validatedData.email }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      )
    }

    // パスワードをハッシュ化
    const passwordHash = await hashPassword(validatedData.password)

    const newUser = await prisma.adminUser.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json(newUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.error('ユーザー作成エラー:', error)
    return NextResponse.json(
      { error: 'ユーザーの作成に失敗しました' },
      { status: 500 }
    )
  }
}
