import { prisma } from './prisma'
import { logger } from './logger'
import type { ZoomTokens, ZoomRegistrant, ZoomRegistrationResponse } from '@/types'

const ZOOM_AUTH_BASE = 'https://zoom.us/oauth'
const ZOOM_API_BASE = 'https://api.zoom.us/v2'

// 暗号化キー（実際は環境変数から取得）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-development-only'

// 簡易的な暗号化/復号化（本番環境では適切な暗号化ライブラリを使用）
function encrypt(text: string): string {
  // 実装省略: 本番環境では jose や crypto を使用
  return Buffer.from(text).toString('base64')
}

function decrypt(text: string): string {
  // 実装省略: 本番環境では jose や crypto を使用
  return Buffer.from(text, 'base64').toString('utf-8')
}

// OAuth認証URL生成
export function getZoomAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ZOOM_CLIENT_ID!,
    redirect_uri: process.env.ZOOM_REDIRECT_URI!,
    state,
  })

  return `${ZOOM_AUTH_BASE}/authorize?${params.toString()}`
}

// アクセストークン取得
export async function exchangeCodeForTokens(code: string): Promise<ZoomTokens> {
  const response = await fetch(`${ZOOM_AUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(
        `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.ZOOM_REDIRECT_URI!,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    logger.error('Failed to exchange Zoom code for tokens', { error })
    throw new Error('Failed to get Zoom tokens')
  }

  return response.json()
}

// リフレッシュトークンでアクセストークンを更新
export async function refreshZoomTokens(refreshToken: string): Promise<ZoomTokens> {
  const response = await fetch(`${ZOOM_AUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(
        `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    logger.error('Failed to refresh Zoom tokens', { error })
    throw new Error('Failed to refresh Zoom tokens')
  }

  return response.json()
}

// トークン保存
export async function saveZoomTokens(accountEmail: string, tokens: ZoomTokens) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

  await prisma.zoomToken.upsert({
    where: { accountEmail },
    update: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiresAt,
    },
    create: {
      accountEmail,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiresAt,
    },
  })

  logger.info('Zoom tokens saved', { accountEmail })
}

// 有効なアクセストークン取得（必要に応じてリフレッシュ）
export async function getValidAccessToken(): Promise<string> {
  const accountEmail = process.env.ZOOM_ACCOUNT_EMAIL!
  
  const tokenRecord = await prisma.zoomToken.findUnique({
    where: { accountEmail },
  })

  if (!tokenRecord) {
    throw new Error('No Zoom tokens found. Please complete OAuth flow first.')
  }

  // トークンの有効期限をチェック
  const now = new Date()
  const expiresAt = new Date(tokenRecord.expiresAt)
  
  if (expiresAt > now) {
    // まだ有効
    return decrypt(tokenRecord.accessToken)
  }

  // トークンをリフレッシュ
  logger.info('Refreshing Zoom tokens', { accountEmail })
  
  const refreshToken = decrypt(tokenRecord.refreshToken)
  const newTokens = await refreshZoomTokens(refreshToken)
  
  await saveZoomTokens(accountEmail, newTokens)
  
  return newTokens.access_token
}

// ウェビナー参加者登録
export async function registerWebinarParticipant(
  webinarId: string,
  registrant: ZoomRegistrant
): Promise<ZoomRegistrationResponse> {
  const accessToken = await getValidAccessToken()

  const response = await fetch(
    `${ZOOM_API_BASE}/webinars/${webinarId}/registrants`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrant),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    logger.error('Failed to register webinar participant', { 
      webinarId, 
      email: registrant.email,
      error 
    })
    throw new Error('Failed to register webinar participant')
  }

  const data = await response.json()
  
  logger.info('Webinar participant registered', { 
    webinarId, 
    email: registrant.email,
    registrantId: data.registrant_id 
  })

  return data
}

// ミーティング参加者登録
export async function registerMeetingParticipant(
  meetingId: string,
  registrant: ZoomRegistrant
): Promise<ZoomRegistrationResponse> {
  const accessToken = await getValidAccessToken()

  const response = await fetch(
    `${ZOOM_API_BASE}/meetings/${meetingId}/registrants`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrant),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    logger.error('Failed to register meeting participant', { 
      meetingId, 
      email: registrant.email,
      error 
    })
    throw new Error('Failed to register meeting participant')
  }

  const data = await response.json()
  
  logger.info('Meeting participant registered', { 
    meetingId, 
    email: registrant.email,
    registrantId: data.registrant_id 
  })

  return data
}

// 参加者の自動登録
export async function autoRegisterParticipant(
  participantId: string,
  sessionId: string
): Promise<void> {
  try {
    // セッション情報を取得
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        seminar: true,
      },
    })

    if (!session || !session.zoomType || !session.zoomId) {
      logger.info('Session does not have Zoom configuration', { sessionId })
      return
    }

    // 参加者情報を取得
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    })

    if (!participant) {
      logger.error('Participant not found', { participantId })
      return
    }

    // 既に登録済みかチェック
    const existing = await prisma.zoomRegistration.findFirst({
      where: {
        participantId,
        zoomId: session.zoomId,
      },
    })

    if (existing && existing.status === 'REGISTERED') {
      logger.info('Participant already registered for Zoom', { 
        participantId, 
        zoomId: session.zoomId 
      })
      return
    }

    // Zoom登録データ作成
    const [firstName, ...lastNameParts] = participant.name.split(' ')
    const registrant: ZoomRegistrant = {
      email: participant.email,
      first_name: firstName,
      last_name: lastNameParts.join(' ') || firstName,
    }

    // カスタム質問（会社名など）
    if (participant.company) {
      registrant.custom_questions = [{
        title: '会社名',
        value: participant.company,
      }]
    }

    // Zoom APIを呼び出して登録
    let registrationResponse: ZoomRegistrationResponse

    if (session.zoomType === 'WEBINAR') {
      registrationResponse = await registerWebinarParticipant(
        session.zoomId,
        registrant
      )
    } else {
      registrationResponse = await registerMeetingParticipant(
        session.zoomId,
        registrant
      )
    }

    // 登録結果を保存
    await prisma.zoomRegistration.upsert({
      where: {
        participantId_zoomId: {
          participantId,
          zoomId: session.zoomId,
        },
      },
      update: {
        registrantId: registrationResponse.registrant_id,
        joinUrl: registrationResponse.join_url,
        status: 'REGISTERED',
        registeredAt: new Date(),
        error: null,
      },
      create: {
        participantId,
        zoomType: session.zoomType,
        zoomId: session.zoomId,
        registrantId: registrationResponse.registrant_id,
        joinUrl: registrationResponse.join_url,
        status: 'REGISTERED',
      },
    })

    logger.info('Participant registered for Zoom successfully', {
      participantId,
      sessionId,
      zoomId: session.zoomId,
      joinUrl: registrationResponse.join_url,
    })
  } catch (error) {
    logger.error('Failed to auto-register participant for Zoom', error, {
      participantId,
      sessionId,
    })

    // エラーを記録
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    })

    if (session?.zoomId) {
      await prisma.zoomRegistration.upsert({
        where: {
          participantId_zoomId: {
            participantId,
            zoomId: session.zoomId,
          },
        },
        update: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : String(error),
        },
        create: {
          participantId,
          zoomType: session.zoomType!,
          zoomId: session.zoomId,
          registrantId: '',
          joinUrl: '',
          status: 'FAILED',
          error: error instanceof Error ? error.message : String(error),
        },
      })
    }

    throw error
  }
}
