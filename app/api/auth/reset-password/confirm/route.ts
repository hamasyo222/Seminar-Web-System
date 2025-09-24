import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { auditPasswordChange } from '@/lib/api/audit-middleware'
import crypto from 'crypto'
import { z } from 'zod'

const confirmSchema = z.object({
  token: z.string().min(1),
  password: z.string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードは大文字、小文字、数字を含む必要があります')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = confirmSchema.parse(body)

    // トークンをハッシュ化
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    // トークンで管理者を検索
    const admin = await prisma.adminUser.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    })

    if (!admin) {
      return NextResponse.json(
        { success: false, error: '無効または期限切れのトークンです' },
        { status: 400 }
      )
    }

    // パスワードをハッシュ化
    const hashedPassword = await hashPassword(password)

    // パスワードを更新し、トークンをクリア
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        lastPasswordChange: new Date()
      }
    })

    // 監査ログ
    await auditPasswordChange(request, admin, true)

    // 確認メールの送信
    const { sendEmail } = await import('@/lib/mail')
    await sendEmail({
      to: [admin.email],
      subject: 'パスワード変更完了のお知らせ',
      htmlContent: `
        <p>${admin.name} 様</p>
        
        <p>パスワードの変更が完了しました。</p>
        
        <p>変更日時: ${new Date().toLocaleString('ja-JP')}</p>
        
        <p>もしこの変更に心当たりがない場合は、直ちにシステム管理者にご連絡ください。</p>
        
        <p>よろしくお願いいたします。</p>
      `,
      textContent: `
${admin.name} 様

パスワードの変更が完了しました。

変更日時: ${new Date().toLocaleString('ja-JP')}

もしこの変更に心当たりがない場合は、直ちにシステム管理者にご連絡ください。

よろしくお願いいたします。
      `
    })

    logger.info('Password reset completed', {
      adminId: admin.id,
      email: admin.email
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'パスワードが要件を満たしていません' },
        { status: 400 }
      )
    }

    logger.error('Password reset confirmation failed', error)
    return NextResponse.json(
      { success: false, error: 'パスワードリセットに失敗しました' },
      { status: 500 }
    )
  }
}
