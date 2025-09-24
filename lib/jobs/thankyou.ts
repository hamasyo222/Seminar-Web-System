import { prisma } from '../prisma'
import { sendEmail } from '../mail'
import { formatJST } from '../date'
import { logger } from '../logger'
import { buildAbsoluteUrl, getBaseUrl } from '../url'

// セミナー終了後のサンクスメール送信
export async function sendThankYouEmails() {
  const startTime = logger.startTimer('thank_you_emails')

  try {
    // 昨日終了したセッションを取得
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    yesterday.setHours(0, 0, 0, 0)

    const sessions = await prisma.session.findMany({
      where: {
        status: 'SCHEDULED',
        endAt: {
          gte: yesterday,
          lt: today
        }
      },
      include: {
        seminar: true
      }
    })

    logger.info(`Found ${sessions.length} completed sessions for thank you emails`)

    let processedCount = 0
    let errorCount = 0
    const baseUrl = getBaseUrl()

    for (const session of sessions) {
      // 実際に参加した人を取得
      const participants = await prisma.participant.findMany({
        where: {
          order: {
            sessionId: session.id,
            status: 'PAID'
          },
          attendanceStatus: 'CHECKED_IN'
        },
        include: {
          order: true
        }
      })

      logger.info(`Processing ${participants.length} participants for session ${session.id}`)

      for (const participant of participants) {
        try {
          const surveyUrl = buildAbsoluteUrl(`/survey?order=${participant.order.orderNumber}`, baseUrl)
          const seminarsUrl = buildAbsoluteUrl('/seminars', baseUrl)

          // サンクスメール送信
          await sendEmail({
            to: [participant.email],
            subject: `【御礼】${session.seminar.title}へのご参加ありがとうございました`,
            htmlContent: `
<p>${participant.name} 様</p>

<p>昨日は「${session.seminar.title}」にご参加いただき、誠にありがとうございました。</p>

<p>セミナーはいかがでしたでしょうか。<br>
ご質問やご不明な点がございましたら、お気軽にお問い合わせください。</p>

<h3>■ アンケートのお願い</h3>
<p>今後のセミナー運営の参考にさせていただきたく、アンケートにご協力をお願いいたします。</p>
<p><a href="${surveyUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">アンケートに回答する</a></p>

<h3>■ 次回開催のご案内</h3>
<p>今後も様々なセミナーを企画しております。<br>
ぜひ次回もご参加いただけますと幸いです。</p>
<p><a href="${seminarsUrl}">開催予定のセミナーを見る</a></p>

<p>またお会いできることを楽しみにしております。</p>

<p>どうぞよろしくお願いいたします。</p>
            `,
            textContent: `
${participant.name} 様

昨日は「${session.seminar.title}」にご参加いただき、誠にありがとうございました。

セミナーはいかがでしたでしょうか。
ご質問やご不明な点がございましたら、お気軽にお問い合わせください。

■ アンケートのお願い
今後のセミナー運営の参考にさせていただきたく、アンケートにご協力をお願いいたします。
${surveyUrl}

■ 次回開催のご案内
今後も様々なセミナーを企画しております。
ぜひ次回もご参加いただけますと幸いです。
${seminarsUrl}

またお会いできることを楽しみにしております。

どうぞよろしくお願いいたします。
            `
          })

          processedCount++
        } catch (error) {
          logger.error('Failed to send thank you email', error, {
            participantId: participant.id,
            sessionId: session.id
          })
          errorCount++
        }
      }

      // セッションのステータスを完了に更新
      try {
        await prisma.session.update({
          where: { id: session.id },
          data: { status: 'COMPLETED' }
        })
      } catch (error) {
        logger.error('Failed to update session status', error, { sessionId: session.id })
      }
    }

    // ジョブログ記録
    await prisma.jobLog.create({
      data: {
        jobName: 'thank_you_emails',
        status: 'COMPLETED',
        completedAt: new Date(),
        processedCount,
        errorCount,
        details: {
          sessionsFound: sessions.length,
          emailsSent: processedCount,
          errors: errorCount
        }
      }
    })

    startTime()
    
    return {
      success: true,
      processedCount,
      errorCount
    }
  } catch (error) {
    await prisma.jobLog.create({
      data: {
        jobName: 'thank_you_emails',
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : String(error)
      }
    })

    throw error
  }
}
