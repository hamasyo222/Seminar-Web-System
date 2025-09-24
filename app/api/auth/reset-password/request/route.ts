import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/mail'
import { logger } from '@/lib/logger'
import { buildAbsoluteUrl } from '@/lib/url'
import crypto from 'crypto'
import { z } from 'zod'

const requestSchema = z.object({
  email: z.string().email()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = requestSchema.parse(body)

    // 管理者ユーザーの確認
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() }
    })

    // セキュリティのため、ユーザーが存在しない場合でも成功レスポンスを返す
    if (!admin) {
      logger.warn('Password reset requested for non-existent email', { email })
      return NextResponse.json({ success: true })
    }

    // リセットトークンの生成
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1時間有効

    // トークンをハッシュ化して保存
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry
      }
    })

    // リセットメールの送信
    const resetUrl = buildAbsoluteUrl(`/admin/reset-password?token=${resetToken}`, request)

    await sendEmail({
      to: [admin.email],
      subject: 'パスワードリセットのご案内',
      htmlContent: `
        <p>${admin.name} 様</p>
        
        <p>パスワードリセットのリクエストを受け付けました。</p>
        
        <p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
        
        <p><a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">パスワードをリセット</a></p>
        
        <p>または、以下のURLをブラウザにコピー＆ペーストしてください：</p>
        <p>${resetUrl}</p>
        
        <p>このリンクは1時間有効です。</p>
        
        <p>もしこのリクエストに心当たりがない場合は、このメールを無視してください。</p>
        
        <p>よろしくお願いいたします。</p>
      `,
      textContent: `
${admin.name} 様

パスワードリセットのリクエストを受け付けました。

以下のリンクをクリックして、新しいパスワードを設定してください：
${resetUrl}

このリンクは1時間有効です。

もしこのリクエストに心当たりがない場合は、このメールを無視してください。

よろしくお願いいたします。
      `
    })

    logger.info('Password reset requested', {
      adminId: admin.id,
      email: admin.email
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '無効なメールアドレスです' },
        { status: 400 }
      )
    }

    logger.error('Password reset request failed', error)
    return NextResponse.json(
      { success: false, error: 'パスワードリセットの処理に失敗しました' },
      { status: 500 }
    )
  }
}



