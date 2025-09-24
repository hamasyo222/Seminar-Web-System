import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { sendEmail } from '@/lib/mail'
import { z } from 'zod'

const testEmailSchema = z.object({
  templateId: z.string(),
  email: z.string().email('有効なメールアドレスを入力してください')
})

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
    const { templateId, email } = testEmailSchema.parse(body)

    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'テンプレートが見つかりません' },
        { status: 404 }
      )
    }

    // テスト用の変数を生成
    const variables = JSON.parse(template.variables)
    const testVariables: Record<string, string> = {}
    
    variables.forEach((varName: string) => {
      switch (varName) {
        case 'name':
          testVariables[varName] = 'テスト 太郎'
          break
        case 'email':
          testVariables[varName] = email
          break
        case 'seminarTitle':
          testVariables[varName] = 'テストセミナー'
          break
        case 'sessionDate':
          testVariables[varName] = '2025年1月1日 10:00'
          break
        case 'orderNumber':
          testVariables[varName] = 'TEST-12345'
          break
        case 'totalAmount':
          testVariables[varName] = '¥10,000'
          break
        default:
          testVariables[varName] = `[${varName}]`
      }
    })

    // 変数を置換
    let subject = template.subject
    let bodyHtml = template.bodyHtml
    let bodyText = template.bodyText

    Object.entries(testVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, value)
      bodyHtml = bodyHtml.replace(regex, value)
      bodyText = bodyText.replace(regex, value)
    })

    await sendEmail({
      to: [email],
      subject: `[テスト] ${subject}`,
      htmlContent: bodyHtml,
      textContent: bodyText,
      templateCode: template.code
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.error('テストメール送信エラー:', error)
    return NextResponse.json(
      { error: 'テストメールの送信に失敗しました' },
      { status: 500 }
    )
  }
}
