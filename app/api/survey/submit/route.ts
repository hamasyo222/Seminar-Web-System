import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const surveySchema = z.object({
  orderId: z.string().min(1),
  sessionId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  satisfactionLevel: z.string().optional(),
  content: z.string().optional(),
  presentation: z.string().optional(),
  organization: z.string().optional(),
  wouldRecommend: z.boolean(),
  improvements: z.string().optional(),
  futureTopics: z.string().optional(),
  otherComments: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = surveySchema.parse(body)

    // 注文の確認
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        session: {
          include: {
            seminar: true
          }
        }
      }
    })

    if (!order || order.status !== 'PAID') {
      return NextResponse.json(
        { success: false, error: '無効な注文です' },
        { status: 400 }
      )
    }

    // セミナーが終了しているか確認
    if (order.session.endAt > new Date()) {
      return NextResponse.json(
        { success: false, error: 'セミナーがまだ終了していません' },
        { status: 400 }
      )
    }

    // 既存のアンケートチェック
    const existingSurvey = await prisma.$queryRaw`
      SELECT id FROM surveys 
      WHERE order_id = ${data.orderId}
      LIMIT 1
    `

    if (Array.isArray(existingSurvey) && existingSurvey.length > 0) {
      return NextResponse.json(
        { success: false, error: '既にアンケートに回答済みです' },
        { status: 400 }
      )
    }

    // アンケート保存
    await prisma.$executeRaw`
      INSERT INTO surveys (
        id, order_id, session_id, rating, satisfaction_level,
        content_rating, presentation_rating, organization_rating,
        would_recommend, improvements, future_topics, other_comments,
        submitted_at
      ) VALUES (
        ${crypto.randomUUID()},
        ${data.orderId},
        ${data.sessionId},
        ${data.rating},
        ${data.satisfactionLevel || null},
        ${data.content ? parseInt(data.content) : null},
        ${data.presentation ? parseInt(data.presentation) : null},
        ${data.organization ? parseInt(data.organization) : null},
        ${data.wouldRecommend},
        ${data.improvements || null},
        ${data.futureTopics || null},
        ${data.otherComments || null},
        ${new Date()}
      )
    `

    logger.info('Survey submitted', {
      orderId: data.orderId,
      sessionId: data.sessionId,
      rating: data.rating
    })

    // サンクスメール送信（必要に応じて）
    try {
      const { sendEmail } = await import('@/lib/mail')
      await sendEmail({
        to: [order.email],
        subject: 'アンケートへのご協力ありがとうございました',
        htmlContent: `
          <p>${order.name} 様</p>
          
          <p>この度は「${order.session.seminar.title}」のアンケートにご協力いただき、誠にありがとうございました。</p>
          
          <p>いただいたご意見は、今後のセミナー運営の参考にさせていただきます。</p>
          
          <p>またのご参加を心よりお待ちしております。</p>
          
          <p>よろしくお願いいたします。</p>
        `,
        textContent: `
${order.name} 様

この度は「${order.session.seminar.title}」のアンケートにご協力いただき、誠にありがとうございました。

いただいたご意見は、今後のセミナー運営の参考にさせていただきます。

またのご参加を心よりお待ちしております。

よろしくお願いいたします。
        `
      })
    } catch (error) {
      logger.error('Failed to send survey thank you email', error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'バリデーションエラー', errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    logger.error('Survey submission error:', error)
    return NextResponse.json(
      { success: false, error: 'アンケートの送信に失敗しました' },
      { status: 500 }
    )
  }
}
