import sgMail from '@sendgrid/mail'
import { prisma } from './prisma'
import { logger } from './logger'
import type { EmailData } from '@/types'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_ENABLED = typeof SENDGRID_API_KEY === 'string' && SENDGRID_API_KEY.trim().length > 0

if (SENDGRID_ENABLED) {
  sgMail.setApiKey(SENDGRID_API_KEY)
} else {
  logger.warn('SENDGRID_API_KEY is not set. Emails will be logged as FAILED without being sent.')
}

const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com'
const FROM_NAME = process.env.MAIL_FROM_NAME || 'セミナー事務局'
const REPLY_TO_EMAIL = process.env.MAIL_REPLY_TO || FROM_EMAIL

const mapRecipients = (addresses?: string[]):
  | { email: string } 
  | Array<{ email: string }>
  | undefined => {
  if (!addresses || addresses.length === 0) {
    return undefined
  }

  if (addresses.length === 1) {
    return { email: addresses[0] }
  }

  return addresses.map((email) => ({ email }))
}

// メールテンプレートコード
export const EMAIL_TEMPLATES = {
  REGISTRATION_CONFIRMED: 'registration_confirmed',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_INSTRUCTION: 'payment_instruction', // コンビニ払込票等
  REMINDER_24H: 'reminder_24h',
  REMINDER_1H: 'reminder_1h',
  SESSION_CHANGED: 'session_changed',
  SESSION_CANCELLED: 'session_cancelled',
  REFUND_COMPLETED: 'refund_completed',
  INVOICE_REISSUED: 'invoice_reissued',
} as const

// メール送信
export async function sendEmail(data: EmailData): Promise<void> {
  let htmlContent = data.htmlContent || ''
  let textContent = data.textContent || ''
  let subject: string = data.subject ?? 'セミナー通知'

  try {

    // テンプレートを使用する場合
    if (data.templateCode) {
      const template = await prisma.emailTemplate.findUnique({
        where: { code: data.templateCode }
      })

      if (!template || !template.isActive) {
        throw new Error(`Template not found or inactive: ${data.templateCode}`)
      }

      // 変数置換
      htmlContent = replaceVariables(template.bodyHtml, data.variables || {})
      textContent = replaceVariables(template.bodyText, data.variables || {})
      subject = replaceVariables(template.subject, data.variables || {})
    }

    if (!subject || subject.trim().length === 0) {
      subject = data.subject || 'セミナー通知'
    }

    const toField = mapRecipients(data.to)
    if (!toField) {
      throw new Error('送信先が指定されていません')
    }

    if (!SENDGRID_ENABLED) {
      throw new Error('SENDGRID_API_KEY is not configured')
    }

    // SendGridメッセージ作成
    const msg: sgMail.MailDataRequired = {
      to: toField,
      cc: mapRecipients(data.cc),
      bcc: mapRecipients(data.bcc),
      from: { email: FROM_EMAIL, name: FROM_NAME },
      replyTo: { email: REPLY_TO_EMAIL, name: FROM_NAME },
      subject,
      text: textContent,
      html: htmlContent,
      attachments: data.attachments?.map(att => ({
        content: att.content,
        filename: att.filename,
        type: att.type,
        disposition: 'attachment',
      })),
    }

    // 送信
    const [response] = await sgMail.send(msg)
    
    // ログ記録
    await prisma.emailLog.create({
      data: {
        to: JSON.stringify(data.to),
        cc: JSON.stringify(data.cc || []),
        bcc: JSON.stringify(data.bcc || []),
        subject,
        templateCode: data.templateCode,
        status: 'SENT',
        sendgridId: response.headers['x-message-id'] as string,
        sentAt: new Date(),
      }
    })

    logger.info('Email sent successfully', {
      to: data.to,
      subject,
      templateCode: data.templateCode,
      messageId: response.headers['x-message-id']
    })
  } catch (error) {
    // エラーログ記録
    await prisma.emailLog.create({
      data: {
        to: JSON.stringify(data.to),
        cc: JSON.stringify(data.cc || []),
        bcc: JSON.stringify(data.bcc || []),
        subject,
        templateCode: data.templateCode,
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      }
    })

    logger.error('Failed to send email', error, {
      to: data.to,
      subject,
      templateCode: data.templateCode
    })

    throw error
  }
}

// 変数置換
function replaceVariables(template: string, variables: Record<string, any>): string {
  let result = template

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    result = result.replace(regex, String(value))
  })

  return result
}

// メールテンプレート初期化（シーダー用）
export const DEFAULT_EMAIL_TEMPLATES = [
  {
    code: EMAIL_TEMPLATES.REGISTRATION_CONFIRMED,
    name: '申込受付完了',
    subject: '【{{seminar_title}}】お申込みを受け付けました',
    bodyHtml: `
<p>{{participant_name}} 様</p>

<p>この度は「{{seminar_title}}」にお申込みいただき、誠にありがとうございます。</p>

<p>以下の内容でお申込みを受け付けました。</p>

<h3>■ お申込み内容</h3>
<ul>
  <li>注文番号: {{order_number}}</li>
  <li>セミナー名: {{seminar_title}}</li>
  <li>開催日時: {{session_date}}</li>
  <li>会場: {{venue}}</li>
  <li>参加人数: {{participant_count}}名</li>
  <li>合計金額: {{total_amount}}</li>
</ul>

<h3>■ お支払い状況</h3>
<p>{{payment_status}}</p>

{{#if zoom_join_url}}
<h3>■ オンライン参加URL</h3>
<p>以下のURLから参加いただけます。</p>
<p><a href="{{zoom_join_url}}">{{zoom_join_url}}</a></p>
{{/if}}

<p>開催前日と1時間前にリマインダーメールをお送りします。</p>

<p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>

<p>どうぞよろしくお願いいたします。</p>
    `,
    bodyText: `
{{participant_name}} 様

この度は「{{seminar_title}}」にお申込みいただき、誠にありがとうございます。

以下の内容でお申込みを受け付けました。

■ お申込み内容
・注文番号: {{order_number}}
・セミナー名: {{seminar_title}}
・開催日時: {{session_date}}
・会場: {{venue}}
・参加人数: {{participant_count}}名
・合計金額: {{total_amount}}

■ お支払い状況
{{payment_status}}

{{#if zoom_join_url}}
■ オンライン参加URL
{{zoom_join_url}}
{{/if}}

開催前日と1時間前にリマインダーメールをお送りします。

ご不明な点がございましたら、お気軽にお問い合わせください。

どうぞよろしくお願いいたします。
    `,
    variables: [
      'participant_name',
      'seminar_title',
      'order_number',
      'session_date',
      'venue',
      'participant_count',
      'total_amount',
      'payment_status',
      'zoom_join_url'
    ],
    isActive: true,
  },
  {
    code: EMAIL_TEMPLATES.PAYMENT_COMPLETED,
    name: '支払完了通知',
    subject: '【{{seminar_title}}】お支払いが完了しました',
    bodyHtml: `
<p>{{participant_name}} 様</p>

<p>「{{seminar_title}}」のお支払いが完了しました。</p>

<p>これにて、お申込み手続きがすべて完了いたしました。</p>

<h3>■ お支払い内容</h3>
<ul>
  <li>注文番号: {{order_number}}</li>
  <li>お支払い金額: {{payment_amount}}</li>
  <li>お支払い方法: {{payment_method}}</li>
  <li>お支払い日時: {{payment_date}}</li>
</ul>

<h3>■ セミナー情報</h3>
<ul>
  <li>セミナー名: {{seminar_title}}</li>
  <li>開催日時: {{session_date}}</li>
  <li>会場: {{venue}}</li>
</ul>

{{#if zoom_join_url}}
<h3>■ オンライン参加URL</h3>
<p><a href="{{zoom_join_url}}">{{zoom_join_url}}</a></p>
{{/if}}

<p>領収書はマイページからダウンロードいただけます。</p>

<p>当日お会いできることを楽しみにしております。</p>
    `,
    bodyText: `
{{participant_name}} 様

「{{seminar_title}}」のお支払いが完了しました。

これにて、お申込み手続きがすべて完了いたしました。

■ お支払い内容
・注文番号: {{order_number}}
・お支払い金額: {{payment_amount}}
・お支払い方法: {{payment_method}}
・お支払い日時: {{payment_date}}

■ セミナー情報
・セミナー名: {{seminar_title}}
・開催日時: {{session_date}}
・会場: {{venue}}

{{#if zoom_join_url}}
■ オンライン参加URL
{{zoom_join_url}}
{{/if}}

領収書はマイページからダウンロードいただけます。

当日お会いできることを楽しみにしております。
    `,
    variables: [
      'participant_name',
      'seminar_title',
      'order_number',
      'payment_amount',
      'payment_method',
      'payment_date',
      'session_date',
      'venue',
      'zoom_join_url'
    ],
    isActive: true,
  },
  {
    code: EMAIL_TEMPLATES.REMINDER_24H,
    name: '24時間前リマインダー',
    subject: '【リマインダー】明日「{{seminar_title}}」が開催されます',
    bodyHtml: `
<p>{{participant_name}} 様</p>

<p>明日「{{seminar_title}}」が開催されます。</p>

<h3>■ セミナー情報</h3>
<ul>
  <li>セミナー名: {{seminar_title}}</li>
  <li>開催日時: {{session_date}}</li>
  <li>会場: {{venue}}</li>
  {{#if venue_address}}
  <li>会場住所: {{venue_address}}</li>
  {{/if}}
</ul>

{{#if zoom_join_url}}
<h3>■ オンライン参加URL</h3>
<p><a href="{{zoom_join_url}}">{{zoom_join_url}}</a></p>
<p>※開始10分前から入室可能です</p>
{{/if}}

<h3>■ 持ち物・準備</h3>
<ul>
  <li>筆記用具</li>
  <li>名刺（交流会がある場合）</li>
  {{#if online_requirements}}
  <li>{{online_requirements}}</li>
  {{/if}}
</ul>

<p>お気をつけてお越しください。</p>
    `,
    bodyText: `
{{participant_name}} 様

明日「{{seminar_title}}」が開催されます。

■ セミナー情報
・セミナー名: {{seminar_title}}
・開催日時: {{session_date}}
・会場: {{venue}}
{{#if venue_address}}
・会場住所: {{venue_address}}
{{/if}}

{{#if zoom_join_url}}
■ オンライン参加URL
{{zoom_join_url}}
※開始10分前から入室可能です
{{/if}}

■ 持ち物・準備
・筆記用具
・名刺（交流会がある場合）
{{#if online_requirements}}
・{{online_requirements}}
{{/if}}

お気をつけてお越しください。
    `,
    variables: [
      'participant_name',
      'seminar_title',
      'session_date',
      'venue',
      'venue_address',
      'zoom_join_url',
      'online_requirements'
    ],
    isActive: true,
  },
  {
    code: EMAIL_TEMPLATES.REMINDER_1H,
    name: '1時間前リマインダー',
    subject: '【リマインダー】まもなく「{{seminar_title}}」が開催されます',
    bodyHtml: `
<p>{{participant_name}} 様</p>

<p>本日「{{seminar_title}}」が開催されます。</p>
<p><strong>開始まであと1時間です。</strong></p>

<h3>■ セミナー情報</h3>
<ul>
  <li>開催時間: {{session_time}}</li>
  <li>会場: {{venue}}</li>
</ul>

{{#if zoom_join_url}}
<h3>■ オンライン参加URL</h3>
<p><a href="{{zoom_join_url}}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">参加する</a></p>
{{/if}}

<p>お気をつけてお越しください。</p>
    `,
    bodyText: `
{{participant_name}} 様

本日「{{seminar_title}}」が開催されます。
開始まであと1時間です。

■ セミナー情報
・開催時間: {{session_time}}
・会場: {{venue}}

{{#if zoom_join_url}}
■ オンライン参加URL
{{zoom_join_url}}
{{/if}}

お気をつけてお越しください。
    `,
    variables: [
      'participant_name',
      'seminar_title',
      'session_time',
      'venue',
      'zoom_join_url'
    ],
    isActive: true,
  },
]
