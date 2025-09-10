import { prisma } from '../prisma'
import { sendEmail, EMAIL_TEMPLATES } from '../mail'
import { generateICS, encodeICSToBase64, generateICSFileName } from '../ics'
import { formatJST, isWithinHours, getHoursUntil } from '../date'
import { logger } from '../logger'

// 24時間前リマインダー送信
export async function sendReminder24h() {
  const startTime = logger.startTimer('reminder_24h')

  try {
    // 24〜25時間後に開催されるセッションを取得
    const now = new Date()
    const start24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const start25h = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    const sessions = await prisma.session.findMany({
      where: {
        status: 'SCHEDULED',
        startAt: {
          gte: start24h,
          lt: start25h
        }
      },
      include: {
        seminar: true
      }
    })

    logger.info(`Found ${sessions.length} sessions for 24h reminder`)

    let processedCount = 0
    let errorCount = 0

    for (const session of sessions) {
      // 支払済みの参加者を取得
      const participants = await prisma.participant.findMany({
        where: {
          order: {
            sessionId: session.id,
            status: 'PAID'
          }
        },
        include: {
          order: true,
          zoomRegistrations: true
        }
      })

      logger.info(`Processing ${participants.length} participants for session ${session.id}`)

      for (const participant of participants) {
        try {
          // ICSファイルを生成
          const icsContent = await generateICS({
            session: {
              ...session,
              seminar: session.seminar,
              ticketTypes: [],
              _count: undefined
            },
            participantName: participant.name,
            participantEmail: participant.email,
            orderNumber: participant.order.orderNumber,
            joinUrl: participant.zoomRegistrations.find(
              zr => zr.zoomId === session.zoomId && zr.status === 'REGISTERED'
            )?.joinUrl
          })

          // メール送信
          await sendEmail({
            to: [participant.email],
            templateCode: EMAIL_TEMPLATES.REMINDER_24H,
            variables: {
              participant_name: participant.name,
              seminar_title: session.seminar.title,
              session_date: formatJST(session.startAt),
              venue: session.venue || 'オンライン',
              venue_address: session.venueAddress || '',
              zoom_join_url: participant.zoomRegistrations.find(
                zr => zr.zoomId === session.zoomId && zr.status === 'REGISTERED'
              )?.joinUrl || '',
              online_requirements: session.format === 'ONLINE' ? 'インターネット接続環境、カメラ、マイク' : ''
            },
            attachments: [{
              filename: generateICSFileName(session.seminar.title, session.startAt),
              content: encodeICSToBase64(icsContent),
              type: 'text/calendar'
            }]
          })

          processedCount++
        } catch (error) {
          logger.error('Failed to send 24h reminder', error, {
            participantId: participant.id,
            sessionId: session.id
          })
          errorCount++
        }
      }
    }

    // ジョブログ記録
    await prisma.jobLog.create({
      data: {
        jobName: 'reminder_24h',
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
        jobName: 'reminder_24h',
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : String(error)
      }
    })

    throw error
  }
}

// 1時間前リマインダー送信
export async function sendReminder1h() {
  const startTime = logger.startTimer('reminder_1h')

  try {
    // 1〜2時間後に開催されるセッションを取得
    const now = new Date()
    const start1h = new Date(now.getTime() + 1 * 60 * 60 * 1000)
    const start2h = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    const sessions = await prisma.session.findMany({
      where: {
        status: 'SCHEDULED',
        startAt: {
          gte: start1h,
          lt: start2h
        }
      },
      include: {
        seminar: true
      }
    })

    logger.info(`Found ${sessions.length} sessions for 1h reminder`)

    let processedCount = 0
    let errorCount = 0

    for (const session of sessions) {
      // 支払済みの参加者を取得
      const participants = await prisma.participant.findMany({
        where: {
          order: {
            sessionId: session.id,
            status: 'PAID'
          }
        },
        include: {
          order: true,
          zoomRegistrations: true
        }
      })

      logger.info(`Processing ${participants.length} participants for session ${session.id}`)

      for (const participant of participants) {
        try {
          // メール送信
          await sendEmail({
            to: [participant.email],
            templateCode: EMAIL_TEMPLATES.REMINDER_1H,
            variables: {
              participant_name: participant.name,
              seminar_title: session.seminar.title,
              session_time: formatJST(session.startAt, 'HH:mm'),
              venue: session.venue || 'オンライン',
              zoom_join_url: participant.zoomRegistrations.find(
                zr => zr.zoomId === session.zoomId && zr.status === 'REGISTERED'
              )?.joinUrl || ''
            }
          })

          processedCount++
        } catch (error) {
          logger.error('Failed to send 1h reminder', error, {
            participantId: participant.id,
            sessionId: session.id
          })
          errorCount++
        }
      }
    }

    // ジョブログ記録
    await prisma.jobLog.create({
      data: {
        jobName: 'reminder_1h',
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
        jobName: 'reminder_1h',
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : String(error)
      }
    })

    throw error
  }
}
