import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, hashPassword } from '@/lib/auth'
import { z } from 'zod'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'VIEWER']).optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional()
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth()
    if (currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // ユーザーの存在確認
    const targetUser = await prisma.adminUser.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // 自分自身の権限を下げることはできない
    if (currentUser.id === id && validatedData.role && validatedData.role !== currentUser.role) {
      return NextResponse.json(
        { error: '自分の権限を変更することはできません' },
        { status: 400 }
      )
    }

    // メールアドレスの重複チェック
    if (validatedData.email && validatedData.email !== targetUser.email) {
      const existing = await prisma.adminUser.findUnique({
        where: { email: validatedData.email }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        )
      }
    }

    const updateData: any = { ...validatedData }
    delete updateData.password

    // パスワードが指定されている場合はハッシュ化
    if (validatedData.password) {
      updateData.passwordHash = await hashPassword(validatedData.password)
    }

    const updatedUser = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.error('ユーザー更新エラー:', error)
    return NextResponse.json(
      { error: 'ユーザーの更新に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth()
    if (currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    // 自分自身は削除できない
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: '自分自身を削除することはできません' },
        { status: 400 }
      )
    }

    // 最後のスーパー管理者は削除できない
    const targetUser = await prisma.adminUser.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.adminUser.count({
        where: { role: 'SUPER_ADMIN' }
      })

      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: '最後のスーパー管理者は削除できません' },
          { status: 400 }
        )
      }
    }

    await prisma.adminUser.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ユーザー削除エラー:', error)
    return NextResponse.json(
      { error: 'ユーザーの削除に失敗しました' },
      { status: 500 }
    )
  }
}
