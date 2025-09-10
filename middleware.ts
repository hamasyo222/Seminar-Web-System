import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from './lib/auth'

// 認証が必要なパス
const protectedPaths = ['/admin']

// CSRFトークン生成（簡易版）
function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // セキュリティヘッダーを設定
  const headers = new Headers(request.headers)
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )

  // 管理画面へのアクセスチェック
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    const token = request.cookies.get('admin-token')?.value

    if (!token) {
      // ログインページへリダイレクト
      const url = new URL('/login', request.url)
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }

    // トークン検証
    const payload = await verifyJWT(token)
    if (!payload) {
      // 無効なトークンの場合はログインページへ
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('admin-token')
      return response
    }
  }

  // CSRFトークンの処理（POST/PUT/DELETE リクエスト）
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    // APIルートはCSRFチェックをスキップ（Webhookなどのため）
    if (!pathname.startsWith('/api/')) {
      const csrfToken = request.headers.get('X-CSRF-Token')
      const cookieToken = request.cookies.get('csrf-token')?.value

      if (!csrfToken || !cookieToken || csrfToken !== cookieToken) {
        return new NextResponse('Invalid CSRF token', { status: 403 })
      }
    }
  }

  // レスポンスにCSRFトークンを設定
  const response = NextResponse.next({
    request: {
      headers,
    },
  })

  // CSRFトークンがない場合は生成
  if (!request.cookies.has('csrf-token')) {
    response.cookies.set('csrf-token', generateCSRFToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
