import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { errorResponse } from './response'
import { AdminRole, AdminUser } from '@prisma/client'

// レート制限用のメモリストア（本番環境ではRedisなどを使用）
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// レート制限チェック
export async function checkRateLimit(
  request: NextRequest,
  limit = 60,
  windowMs = 60000 // 1分
): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const key = `${ip}:${request.nextUrl.pathname}`
  const now = Date.now()

  const record = rateLimitStore.get(key)
  
  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs
    })
    return null
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000)
    return errorResponse(
      'リクエスト数が制限を超えました',
      429,
      { retryAfter },
      'RATE_LIMIT_EXCEEDED'
    )
  }

  record.count++
  return null
}

// 認証チェック
export async function checkAuth(
  minRole?: AdminRole
): Promise<{ user: AdminUser | null; error?: NextResponse }> {
  try {
    const user = await getSession()
    
    if (!user) {
      return {
        user: null,
        error: errorResponse('認証が必要です', 401, undefined, 'UNAUTHORIZED')
      }
    }

    // 役割チェック
    if (minRole) {
      const roleHierarchy: Record<AdminRole, number> = {
        VIEWER: 1,
        ACCOUNTANT: 2,
        ADMIN: 3,
        SUPER_ADMIN: 4
      }

      if (roleHierarchy[user.role] < roleHierarchy[minRole]) {
        return {
          user,
          error: errorResponse('権限がありません', 403, undefined, 'FORBIDDEN')
        }
      }
    }

    return { user }
  } catch (error) {
    return {
      user: null,
      error: errorResponse('認証エラー', 500, undefined, 'AUTH_ERROR')
    }
  }
}

// CORS設定
export function setCorsHeaders(response: NextResponse, origin?: string) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

// APIルートラッパー
type ApiHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse>

interface ApiOptions {
  auth?: boolean
  minRole?: AdminRole
  rateLimit?: {
    limit: number
    window: number
  }
}

export function withApiMiddleware(
  handler: ApiHandler,
  options: ApiOptions = {}
): ApiHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      // レート制限チェック
      if (options.rateLimit) {
        const rateLimitError = await checkRateLimit(
          request,
          options.rateLimit.limit,
          options.rateLimit.window
        )
        if (rateLimitError) return rateLimitError
      }

      // 認証チェック
  if (options.auth) {
    const { user, error: authError } = await checkAuth(options.minRole)
    if (authError) return authError
    if (!user) {
      return errorResponse('認証が必要です', 401, undefined, 'UNAUTHORIZED')
    }
        
    // リクエストにユーザー情報を追加
    (request as any).user = user
  }

      // ハンドラー実行
      const response = await handler(request, context)
      
      // CORS設定
      const origin = request.headers.get('origin')
      if (origin) {
        setCorsHeaders(response, origin)
      }
      
      return response
    } catch (error) {
      return errorResponse(
        'サーバーエラーが発生しました',
        500,
        undefined,
        'INTERNAL_SERVER_ERROR'
      )
    }
  }
}
