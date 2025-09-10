import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getZoomAuthUrl } from '@/lib/zoom'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    
    // 管理者のみ
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    // ランダムなstateを生成（CSRF対策）
    const state = Math.random().toString(36).substring(2, 15)
    
    // セッションに保存（本番環境では暗号化推奨）
    const response = NextResponse.redirect(getZoomAuthUrl(state))
    response.cookies.set('zoom_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10分
      path: '/'
    })

    logger.info('Zoom OAuth initiated', { userId: user.id })

    return response
  } catch (error) {
    logger.error('Error initiating Zoom OAuth', error)
    return NextResponse.redirect('/admin/settings?error=oauth_failed')
  }
}
