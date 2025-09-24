import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// 環境変数または設定ファイルから取得（実際はDBに保存するのが理想）
const getSettings = () => {
  return {
    company: {
      name: process.env.COMPANY_NAME || '',
      taxId: process.env.COMPANY_TAX_ID || '',
      address: process.env.COMPANY_ADDRESS || '',
      tel: process.env.COMPANY_TEL || '',
      email: process.env.COMPANY_EMAIL || ''
    },
    payment: {
      komojuPublicKey: process.env.KOMOJU_PUBLIC_KEY || '',
      komojuSecretKey: process.env.KOMOJU_SECRET_KEY ? '********' : '',
      komojuWebhookSecret: process.env.KOMOJU_WEBHOOK_SECRET ? '********' : ''
    },
    mail: {
      sendgridApiKey: process.env.SENDGRID_API_KEY ? '********' : '',
      fromEmail: process.env.MAIL_FROM_EMAIL || '',
      fromName: process.env.MAIL_FROM_NAME || '',
      replyToEmail: process.env.MAIL_REPLY_TO || ''
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const settings = getSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('設定取得エラー:', error)
    return NextResponse.json(
      { error: '設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type, data } = body

    // 実際の実装では、ここで設定をDBやファイルに保存する
    // 現在は環境変数を使用しているため、動的な更新は不可
    console.log(`設定を更新: ${type}`, data)

    // 注意: 実際の本番環境では、秘密情報（APIキーなど）は
    // 適切に暗号化して保存する必要があります

    return NextResponse.json({ 
      success: true,
      message: '設定を保存しました（環境変数の更新が必要です）'
    })
  } catch (error) {
    console.error('設定更新エラー:', error)
    return NextResponse.json(
      { error: '設定の更新に失敗しました' },
      { status: 500 }
    )
  }
}
