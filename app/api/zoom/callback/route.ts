import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { exchangeCodeForTokens, saveZoomTokens } from '@/lib/zoom'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // エラーチェック
    if (error) {
      logger.error('Zoom OAuth error', { error })
      return NextResponse.redirect('/admin/settings?error=zoom_oauth_denied')
    }

    if (!code || !state) {
      logger.error('Missing code or state in Zoom callback')
      return NextResponse.redirect('/admin/settings?error=invalid_callback')
    }

    // CSRF検証
    const savedState = req.cookies.get('zoom_oauth_state')?.value
    if (!savedState || savedState !== state) {
      logger.error('Invalid state in Zoom callback')
      return NextResponse.redirect('/admin/settings?error=invalid_state')
    }

    // トークン取得
    const tokens = await exchangeCodeForTokens(code)
    
    // トークン保存
    const accountEmail = process.env.ZOOM_ACCOUNT_EMAIL || user.email
    await saveZoomTokens(accountEmail, tokens)

    logger.info('Zoom OAuth completed', { 
      userId: user.id,
      accountEmail 
    })

    // stateクッキーを削除
    const response = NextResponse.redirect('/admin/settings?success=zoom_connected')
    response.cookies.delete('zoom_oauth_state')

    return response
  } catch (error) {
    logger.error('Error in Zoom OAuth callback', error)
    return NextResponse.redirect('/admin/settings?error=token_exchange_failed')
  }
}
