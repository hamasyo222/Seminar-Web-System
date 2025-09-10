import { NextRequest, NextResponse } from 'next/server'
import { adminLoginSchema } from '@/lib/validations'
import { login } from '@/lib/auth'
import { logger } from '@/lib/logger'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json()
    
    // バリデーション
    const validationResult = adminLoginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'バリデーションエラー',
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data

    // ログイン処理
    const token = await login(email, password)

    if (!token) {
      logger.warn('Failed login attempt', { email })
      return NextResponse.json(
        { success: false, error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    logger.info('Admin user logged in', { email })

    // レスポンスにCookieを設定
    const response = NextResponse.json({ success: true })
    
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24時間
      path: '/',
    })

    return response
  } catch (error) {
    logger.error('Login error', error)
    return NextResponse.json(
      { success: false, error: 'ログイン処理に失敗しました' },
      { status: 500 }
    )
  }
}
