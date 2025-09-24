import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { seminarSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'
import type { ApiResponse } from '@/types'

export async function PUT(
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

    // セミナーの存在確認
    const existing = await prisma.seminar.findUnique({
      where: { id: seminarId }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'セミナーが見つかりません' },
        { status: 404 }
      )
    }

    // スラッグの重複チェック（自分自身を除く）
    if (data.slug !== existing.slug) {
      const slugExists = await prisma.seminar.findFirst({
        where: {
          slug: data.slug,
          id: { not: seminarId }
        }
      })

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'このURLスラッグは既に使用されています' },
          { status: 400 }
        )
      }
    }

    // セミナー更新
    const seminar = await prisma.seminar.update({
      where: { id: seminarId },
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description || undefined,
        category: data.category || undefined,
        tags: JSON.stringify(data.tags),
        imageUrl: data.imageUrl || undefined,
        status: data.status
      }
    })

    logger.audit('SEMINAR_UPDATED', user.id, { seminarId: seminar.id })

    return NextResponse.json({
      success: true,
      data: seminar
    })
  } catch (error) {
    logger.error('Error updating seminar', error)
    return NextResponse.json(
      { success: false, error: 'セミナーの更新に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ seminarId: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await requireAuth()
    
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '権限がありません' },
        { status: 403 }
      )
    }

    const { seminarId } = await context.params

    // セミナーの存在確認と関連データチェック
    const seminar = await prisma.seminar.findUnique({
      where: { id: seminarId },
      include: {
        _count: {
          select: {
            sessions: true
          }
        }
      }
    })

    if (!seminar) {
      return NextResponse.json(
        { success: false, error: 'セミナーが見つかりません' },
        { status: 404 }
      )
    }

    if (seminar._count.sessions > 0) {
      return NextResponse.json(
        { success: false, error: '開催回が存在するセミナーは削除できません' },
        { status: 400 }
      )
    }

    // アーカイブ処理（実際には削除しない）
    await prisma.seminar.update({
      where: { id: seminarId },
      data: { status: 'ARCHIVED' }
    })

    logger.audit('SEMINAR_ARCHIVED', user.id, { seminarId })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error archiving seminar', error)
    return NextResponse.json(
      { success: false, error: 'セミナーのアーカイブに失敗しました' },
      { status: 500 }
    )
  }
}
