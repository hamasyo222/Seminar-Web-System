import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { seminarSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await requireAuth()
    
    if (user.role === 'VIEWER') {
      return NextResponse.json(
        { success: false, error: '権限がありません' },
        { status: 403 }
      )
    }

    const body = await req.json()
    
    // バリデーション
    const validationResult = seminarSchema.safeParse(body)
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

    // スラッグの重複チェック
    const existing = await prisma.seminar.findUnique({
      where: { slug: data.slug }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'このURLスラッグは既に使用されています' },
        { status: 400 }
      )
    }

    // セミナー作成
    const seminar = await prisma.seminar.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        category: data.category,
        tags: JSON.stringify(data.tags),
        imageUrl: data.imageUrl,
        status: data.status
      }
    })

    logger.audit('SEMINAR_CREATED', user.id, { seminarId: seminar.id })

    return NextResponse.json({
      success: true,
      data: seminar
    })
  } catch (error) {
    logger.error('Error creating seminar', error)
    return NextResponse.json(
      { success: false, error: 'セミナーの作成に失敗しました' },
      { status: 500 }
    )
  }
}
