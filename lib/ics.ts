import { createEvent, EventAttributes } from 'ics'
import { toJST } from './date'
import { logger } from './logger'
import type { SessionWithDetails } from '@/types'

export interface ICSData {
  session: SessionWithDetails
  participantName: string
  participantEmail: string
  orderNumber: string
  joinUrl?: string
}

export async function generateICS(data: ICSData): Promise<string> {
  const { session, participantName, participantEmail, orderNumber, joinUrl } = data

  // 日時をJSTで処理してからUTC配列に変換
  const startJST = toJST(session.startAt)!
  const endJST = toJST(session.endAt)!

  // icsライブラリ用の配列形式（UTC）
  const start: [number, number, number, number, number] = [
    startJST.year(),
    startJST.month() + 1, // month is 0-indexed in dayjs
    startJST.date(),
    startJST.hour(),
    startJST.minute()
  ]

  const end: [number, number, number, number, number] = [
    endJST.year(),
    endJST.month() + 1,
    endJST.date(),
    endJST.hour(),
    endJST.minute()
  ]

  // 場所の設定
  let location = ''
  if (session.format === 'ONLINE') {
    location = joinUrl || session.onlineUrl || 'オンライン'
  } else if (session.venue) {
    location = session.venue
    if (session.venueAddress) {
      location += `, ${session.venueAddress}`
    }
  }

  // 説明文の作成
  const description = [
    `セミナー: ${session.seminar.title}`,
    session.title ? `セッション: ${session.title}` : '',
    `注文番号: ${orderNumber}`,
    `参加者: ${participantName}`,
    '',
    session.seminar.description.substring(0, 200) + '...',
    '',
    joinUrl ? `参加URL: ${joinUrl}` : '',
    session.format !== 'ONLINE' && session.venue ? `会場: ${session.venue}` : '',
    session.venueAddress ? `住所: ${session.venueAddress}` : '',
  ].filter(Boolean).join('\n')

  const event: EventAttributes = {
    start,
    startInputType: 'local',
    startOutputType: 'local',
    end,
    endInputType: 'local',
    endOutputType: 'local',
    title: session.seminar.title,
    description,
    location,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: {
      name: process.env.INVOICE_ISSUER_NAME || 'セミナー運営',
      email: process.env.MAIL_FROM?.match(/<(.+)>/)?.[1] || 'noreply@example.com'
    },
    attendees: [{
      name: participantName,
      email: participantEmail,
      rsvp: true,
      partstat: 'ACCEPTED',
      role: 'REQ-PARTICIPANT'
    }],
    categories: [session.seminar.category],
    productId: 'seminar-system/ics',
    calName: 'セミナー予定',
    // リマインダー設定（24時間前と1時間前）
    alarms: [
      {
        action: 'display',
        description: `明日「${session.seminar.title}」が開催されます`,
        trigger: { hours: 24, minutes: 0, before: true }
      },
      {
        action: 'display',
        description: `まもなく「${session.seminar.title}」が開催されます`,
        trigger: { hours: 1, minutes: 0, before: true }
      }
    ]
  }

  return new Promise((resolve, reject) => {
    createEvent(event, (error, value) => {
      if (error) {
        logger.error('Failed to generate ICS', error, { 
          sessionId: session.id,
          orderNumber 
        })
        reject(error)
      } else {
        logger.debug('ICS generated', { 
          sessionId: session.id,
          orderNumber 
        })
        resolve(value)
      }
    })
  })
}

// ICSファイルをBase64エンコード（メール添付用）
export function encodeICSToBase64(icsContent: string): string {
  return Buffer.from(icsContent).toString('base64')
}

// ファイル名の生成
export function generateICSFileName(seminarTitle: string, date: Date | string): string {
  const dateStr = toJST(date)!.format('YYYYMMDD')
  // ファイル名に使えない文字を除去
  const safeName = seminarTitle
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)
  
  return `seminar_${safeName}_${dateStr}.ics`
}
