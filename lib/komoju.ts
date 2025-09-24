import { createHmac } from 'crypto'
import { logger } from './logger'
import type { KomojuSessionResponse, KomojuWebhookPayload } from '@/types'

const KOMOJU_API_BASE = process.env.KOMOJU_API_URL || 'https://komoju.com/api/v1'
const KOMOJU_SECRET_KEY = process.env.KOMOJU_SECRET_KEY || process.env.KOMOJU_API_KEY || ''
const KOMOJU_WEBHOOK_SECRET = process.env.KOMOJU_WEBHOOK_SECRET || ''

function assertSecretKey(action: string): void {
  if (!KOMOJU_SECRET_KEY) {
    throw new Error(`KOMOJU_SECRET_KEY is not configured. Unable to ${action}.`)
  }
}

// Basic認証用のヘッダーを生成
function getAuthHeader(): string {
  assertSecretKey('communicate with KOMOJU API')
  return `Basic ${Buffer.from(`${KOMOJU_SECRET_KEY}:`).toString('base64')}`
}

// KOMOJUセッション作成
export async function createKomojuSession(params: {
  amount: number
  currency?: string
  defaultLocale?: string
  paymentMethods: string[]
  externalOrderNum: string
  returnUrl?: string
  metadata?: Record<string, any>
}): Promise<KomojuSessionResponse> {
  const {
    amount,
    currency = 'JPY',
    defaultLocale = 'ja',
    paymentMethods,
    externalOrderNum,
    returnUrl = process.env.KOMOJU_RETURN_URL,
    metadata = {}
  } = params

  try {
    assertSecretKey('create a KOMOJU session')

    const response = await fetch(`${KOMOJU_API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        default_locale: defaultLocale,
        payment_methods: paymentMethods,
        external_order_num: externalOrderNum,
        return_url: returnUrl,
        metadata,
        mode: 'payment', // 決済モード
        payment_data: {
          capture: 'auto', // 自動キャプチャ
          tax: 0, // 税込価格のため0
        }
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('KOMOJU session creation failed', { 
        status: response.status, 
        error,
        externalOrderNum 
      })
      throw new Error(`KOMOJU API error: ${response.status}`)
    }

    const data = await response.json()
    logger.info('KOMOJU session created', { 
      sessionId: data.id, 
      externalOrderNum 
    })
    
    return data
  } catch (error) {
    logger.error('Error creating KOMOJU session', error, { externalOrderNum })
    throw error
  }
}

// KOMOJUセッション取得
export async function getKomojuSession(sessionId: string): Promise<KomojuSessionResponse> {
  try {
    assertSecretKey('retrieve KOMOJU session details')

    const response = await fetch(`${KOMOJU_API_BASE}/sessions/${sessionId}`, {
      headers: {
        'Authorization': getAuthHeader(),
      },
    })

    if (!response.ok) {
      throw new Error(`KOMOJU API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    logger.error('Error fetching KOMOJU session', error, { sessionId })
    throw error
  }
}

// 返金処理
export async function createKomojuRefund(params: {
  paymentId: string
  amount?: number // 部分返金の場合は金額を指定
  description?: string
}): Promise<any> {
  const { paymentId, amount, description } = params

  try {
    assertSecretKey('create a KOMOJU refund')

    const body: any = {}
    if (amount !== undefined) body.amount = amount
    if (description) body.description = description

    const response = await fetch(`${KOMOJU_API_BASE}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('KOMOJU refund failed', { 
        status: response.status, 
        error,
        paymentId 
      })
      throw new Error(`KOMOJU API error: ${response.status}`)
    }

    const data = await response.json()
    logger.info('KOMOJU refund created', { 
      refundId: data.id, 
      paymentId,
      amount 
    })
    
    return data
  } catch (error) {
    logger.error('Error creating KOMOJU refund', error, { paymentId })
    throw error
  }
}

// Webhook署名検証
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!KOMOJU_WEBHOOK_SECRET) {
    logger.warn('KOMOJU_WEBHOOK_SECRET is not configured. Webhook signature validation skipped.')
    return false
  }

  try {
    const expectedSignature = createHmac('sha256', KOMOJU_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex')
    
    return signature === expectedSignature
  } catch (error) {
    logger.error('Error verifying webhook signature', error)
    return false
  }
}

// 支払方法の表示名を取得
export function getPaymentMethodName(method: string): string {
  const methods: Record<string, string> = {
    'credit_card': 'クレジットカード',
    'konbini': 'コンビニ決済',
    'paypay': 'PayPay',
    'bank_transfer': '銀行振込',
  }
  return methods[method] || method
}

// KOMOJUの支払方法コードに変換
export function toKomojuPaymentMethod(method: string): string {
  const mapping: Record<string, string> = {
    'CREDIT_CARD': 'credit_card',
    'KONBINI': 'konbini',
    'PAYPAY': 'paypay',
    'BANK_TRANSFER': 'bank_transfer',
  }
  return mapping[method] || method.toLowerCase()
}
