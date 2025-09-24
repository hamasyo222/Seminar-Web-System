import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createTemplateSchema = z.object({
  code: z.string().min(1, 'コードは必須です'),
  name: z.string().min(1, 'テンプレート名は必須です'),
  subject: z.string().min(1, '件名は必須です'),
  bodyHtml: z.string().min(1, 'HTML本文は必須です'),
  bodyText: z.string().min(1, 'テキスト本文は必須です'),
  variables: z.string(),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('テンプレート一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'テンプレートの取得に失敗しました' },
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
    const validatedData = createTemplateSchema.parse(body)

    // コードの重複チェック
    const existing = await prisma.emailTemplate.findUnique({
      where: { code: validatedData.code }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'このコードは既に使用されています' },
        { status: 400 }
      )
    }

    const template = await prisma.emailTemplate.create({
      data: validatedData
    })

    return NextResponse.json(template)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.error('テンプレート作成エラー:', error)
    return NextResponse.json(
      { error: 'テンプレートの作成に失敗しました' },
      { status: 500 }
    )
  }
}
