import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAuditLog, AuditAction, getAuditContext } from '@/lib/audit'

const auditRoutes: Record<string, { action: AuditAction; entityType?: string }> = {
  // セミナー管理
  'POST /api/admin/seminars': { action: AuditAction.SEMINAR_CREATE, entityType: 'Seminar' },
  'PUT /api/admin/seminars/[id]': { action: AuditAction.SEMINAR_UPDATE, entityType: 'Seminar' },
  'DELETE /api/admin/seminars/[id]': { action: AuditAction.SEMINAR_DELETE, entityType: 'Seminar' },
  
  // セッション管理
  'POST /api/admin/seminars/[seminarId]/sessions': { action: AuditAction.SESSION_CREATE, entityType: 'Session' },
  'PUT /api/admin/seminars/[seminarId]/sessions/[sessionId]': { action: AuditAction.SESSION_UPDATE, entityType: 'Session' },
  'DELETE /api/admin/seminars/[seminarId]/sessions/[sessionId]': { action: AuditAction.SESSION_DELETE, entityType: 'Session' },
  
  // チケット管理
  'POST /api/admin/seminars/[seminarId]/sessions/[sessionId]/tickets': { action: AuditAction.TICKET_CREATE, entityType: 'TicketType' },
  'PUT /api/admin/seminars/[seminarId]/sessions/[sessionId]/tickets/[ticketId]': { action: AuditAction.TICKET_UPDATE, entityType: 'TicketType' },
  'DELETE /api/admin/seminars/[seminarId]/sessions/[sessionId]/tickets/[ticketId]': { action: AuditAction.TICKET_DELETE, entityType: 'TicketType' },
  
  // 注文管理
  'POST /api/orders': { action: AuditAction.ORDER_CREATE, entityType: 'Order' },
  'PUT /api/admin/orders/[id]': { action: AuditAction.ORDER_UPDATE, entityType: 'Order' },
  'POST /api/admin/orders/[id]/cancel': { action: AuditAction.ORDER_CANCEL, entityType: 'Order' },
  'POST /api/admin/refund/process': { action: AuditAction.ORDER_REFUND, entityType: 'Order' },
  
  // 参加者管理
  'PUT /api/admin/participants/[id]': { action: AuditAction.PARTICIPANT_UPDATE, entityType: 'Participant' },
  'POST /api/admin/checkin': { action: AuditAction.PARTICIPANT_CHECKIN, entityType: 'Participant' },
  
  // メール管理
  'POST /api/admin/emails/send': { action: AuditAction.EMAIL_SEND, entityType: 'Email' },
  'POST /api/admin/emails/templates': { action: AuditAction.EMAIL_TEMPLATE_CREATE, entityType: 'EmailTemplate' },
  'PUT /api/admin/emails/templates/[id]': { action: AuditAction.EMAIL_TEMPLATE_UPDATE, entityType: 'EmailTemplate' },
  'DELETE /api/admin/emails/templates/[id]': { action: AuditAction.EMAIL_TEMPLATE_DELETE, entityType: 'EmailTemplate' },
  
  // クーポン管理
  'POST /api/admin/coupons': { action: AuditAction.COUPON_CREATE, entityType: 'Coupon' },
  'PUT /api/admin/coupons/[id]': { action: AuditAction.COUPON_UPDATE, entityType: 'Coupon' },
  'DELETE /api/admin/coupons/[id]': { action: AuditAction.COUPON_DELETE, entityType: 'Coupon' },
  
  // ユーザー管理
  'POST /api/admin/settings/users': { action: AuditAction.USER_CREATE, entityType: 'AdminUser' },
  'PUT /api/admin/settings/users/[id]': { action: AuditAction.USER_UPDATE, entityType: 'AdminUser' },
  'DELETE /api/admin/settings/users/[id]': { action: AuditAction.USER_DELETE, entityType: 'AdminUser' },
  
  // システム設定
  'PUT /api/admin/settings': { action: AuditAction.SETTINGS_UPDATE, entityType: 'Settings' },
  
  // データエクスポート
  'GET /api/admin/export/orders': { action: AuditAction.DATA_EXPORT, entityType: 'Order' },
  'GET /api/admin/export/participants': { action: AuditAction.DATA_EXPORT, entityType: 'Participant' },
}

export async function withAuditLog(
  request: NextRequest,
  handler: () => Promise<Response>
): Promise<Response> {
  const method = request.method
  const pathname = request.nextUrl.pathname
  const routeKey = `${method} ${pathname}`
  
  // パスパラメータを含むルートを正規化
  const normalizedRouteKey = Object.keys(auditRoutes).find(key => {
    const pattern = key.replace(/\[([^\]]+)\]/g, '([^/]+)')
    const regex = new RegExp(`^${pattern}$`)
    return regex.test(routeKey)
  })
  
  const auditConfig = normalizedRouteKey ? auditRoutes[normalizedRouteKey] : null
  
  // 監査対象でない場合はそのまま実行
  if (!auditConfig) {
    return handler()
  }
  
  const session = await getSession()
  const context = getAuditContext(request, session ?? undefined)
  
  // リクエストボディを取得（監査ログ用）
  let requestBody: any = null
  if (request.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      const clonedRequest = request.clone()
      requestBody = await clonedRequest.json()
    } catch (error) {
      // ボディの解析に失敗しても続行
    }
  }
  
  // ハンドラーを実行
  const response = await handler()
  
  // レスポンスが成功した場合のみ監査ログを記録
  if (response.ok) {
    // パスからエンティティIDを抽出
    const pathParts = pathname.split('/')
    const entityId = pathParts[pathParts.length - 1]
    
    // レスポンスボディを取得（可能な場合）
    let responseData: any = null
    try {
      const clonedResponse = response.clone()
      const responseBody = await clonedResponse.json()
      responseData = responseBody.data || responseBody
    } catch (error) {
      // レスポンスの解析に失敗しても続行
    }
    
    await createAuditLog(
      {
        action: auditConfig.action,
        entityType: auditConfig.entityType,
        entityId: entityId !== pathname ? entityId : undefined,
        oldValue: method === 'PUT' || method === 'PATCH' ? requestBody : undefined,
        newValue: responseData,
        metadata: {
          method,
          pathname,
          statusCode: response.status,
        },
      },
      context
    )
  }
  
  return response
}

// 認証関連の監査ログ
export async function auditLoginAttempt(
  email: string,
  success: boolean,
  request: Request,
  userId?: string
) {
  const context = getAuditContext(request)
  
  await createAuditLog(
    {
      action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
      entityType: 'AdminUser',
      entityId: userId,
      metadata: {
        email,
        timestamp: new Date().toISOString(),
      },
      description: success ? `ログイン成功: ${email}` : `ログイン失敗: ${email}`,
    },
    context
  )
}

export async function auditLogout(request: Request, user: any) {
  const context = getAuditContext(request, user)
  
  await createAuditLog(
    {
      action: AuditAction.LOGOUT,
      entityType: 'AdminUser',
      entityId: user.id,
      description: `ログアウト: ${user.email}`,
    },
    context
  )
}

export async function auditPasswordChange(
  request: Request,
  user: any,
  success: boolean
) {
  const context = getAuditContext(request, user)
  
  await createAuditLog(
    {
      action: AuditAction.PASSWORD_CHANGE,
      entityType: 'AdminUser',
      entityId: user.id,
      metadata: {
        success,
        timestamp: new Date().toISOString(),
      },
      description: success
        ? `パスワード変更成功: ${user.email}`
        : `パスワード変更失敗: ${user.email}`,
    },
    context
  )
}
