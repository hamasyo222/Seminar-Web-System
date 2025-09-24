import { prisma } from './prisma'
import { logger } from './logger'
import type { AdminUser } from '@prisma/client'

export enum AuditAction {
  // 認証関連
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  
  // セミナー管理
  SEMINAR_CREATE = 'SEMINAR_CREATE',
  SEMINAR_UPDATE = 'SEMINAR_UPDATE',
  SEMINAR_DELETE = 'SEMINAR_DELETE',
  SEMINAR_PUBLISH = 'SEMINAR_PUBLISH',
  SEMINAR_UNPUBLISH = 'SEMINAR_UNPUBLISH',
  
  // セッション管理
  SESSION_CREATE = 'SESSION_CREATE',
  SESSION_UPDATE = 'SESSION_UPDATE',
  SESSION_DELETE = 'SESSION_DELETE',
  SESSION_CANCEL = 'SESSION_CANCEL',
  
  // チケット管理
  TICKET_CREATE = 'TICKET_CREATE',
  TICKET_UPDATE = 'TICKET_UPDATE',
  TICKET_DELETE = 'TICKET_DELETE',
  
  // 注文管理
  ORDER_CREATE = 'ORDER_CREATE',
  ORDER_UPDATE = 'ORDER_UPDATE',
  ORDER_CANCEL = 'ORDER_CANCEL',
  ORDER_REFUND = 'ORDER_REFUND',
  
  // 参加者管理
  PARTICIPANT_UPDATE = 'PARTICIPANT_UPDATE',
  PARTICIPANT_CHECKIN = 'PARTICIPANT_CHECKIN',
  PARTICIPANT_CHECKOUT = 'PARTICIPANT_CHECKOUT',
  
  // メール管理
  EMAIL_SEND = 'EMAIL_SEND',
  EMAIL_TEMPLATE_CREATE = 'EMAIL_TEMPLATE_CREATE',
  EMAIL_TEMPLATE_UPDATE = 'EMAIL_TEMPLATE_UPDATE',
  EMAIL_TEMPLATE_DELETE = 'EMAIL_TEMPLATE_DELETE',
  
  // クーポン管理
  COUPON_CREATE = 'COUPON_CREATE',
  COUPON_UPDATE = 'COUPON_UPDATE',
  COUPON_DELETE = 'COUPON_DELETE',
  
  // ユーザー管理
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_ACTIVATE = 'USER_ACTIVATE',
  USER_DEACTIVATE = 'USER_DEACTIVATE',
  
  // システム設定
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
  
  // データエクスポート
  DATA_EXPORT = 'DATA_EXPORT',
}

export interface AuditLogContext {
  user?: AdminUser
  ipAddress?: string
  userAgent?: string
  requestId?: string
  sessionId?: string
}

export interface AuditLogData {
  action: AuditAction
  entityType?: string
  entityId?: string
  oldValue?: any
  newValue?: any
  metadata?: Record<string, any>
  description?: string
}

export async function createAuditLog(
  data: AuditLogData,
  context: AuditLogContext
): Promise<void> {
  try {
    const auditLog = {
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: context.user?.id,
      userName: context.user?.name,
      userEmail: context.user?.email,
      userRole: context.user?.role,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      sessionId: context.sessionId,
      oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
      newValue: data.newValue ? JSON.stringify(data.newValue) : null,
      metadata: data.metadata || {},
      description: data.description,
      createdAt: new Date(),
    }

    // データベースに保存
    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        action, entity_type, entity_id, user_id, user_name, user_email,
        user_role, ip_address, user_agent, request_id, session_id,
        old_value, new_value, metadata, description, created_at
      ) VALUES (
        ${auditLog.action}, ${auditLog.entityType}, ${auditLog.entityId},
        ${auditLog.userId}, ${auditLog.userName}, ${auditLog.userEmail},
        ${auditLog.userRole}, ${auditLog.ipAddress}, ${auditLog.userAgent},
        ${auditLog.requestId}, ${auditLog.sessionId}, ${auditLog.oldValue},
        ${auditLog.newValue}, ${JSON.stringify(auditLog.metadata)},
        ${auditLog.description}, ${auditLog.createdAt}
      )
    `

    // 重要なアクションはログにも出力
    if (isImportantAction(data.action)) {
      logger.info('Audit log created', {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: context.user?.id,
        userName: context.user?.name,
      })
    }
  } catch (error) {
    // 監査ログの作成に失敗してもメイン処理は継続
    logger.error('Failed to create audit log', error, {
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
    })
  }
}

function isImportantAction(action: AuditAction): boolean {
  const importantActions = [
    AuditAction.LOGIN_FAILED,
    AuditAction.PASSWORD_CHANGE,
    AuditAction.USER_CREATE,
    AuditAction.USER_DELETE,
    AuditAction.ORDER_REFUND,
    AuditAction.SETTINGS_UPDATE,
    AuditAction.DATA_EXPORT,
  ]
  
  return importantActions.includes(action)
}

export async function getAuditLogs(options: {
  userId?: string
  action?: AuditAction
  entityType?: string
  entityId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const conditions: string[] = []
  const params: any[] = []
  
  if (options.userId) {
    conditions.push('user_id = ?')
    params.push(options.userId)
  }
  
  if (options.action) {
    conditions.push('action = ?')
    params.push(options.action)
  }
  
  if (options.entityType) {
    conditions.push('entity_type = ?')
    params.push(options.entityType)
  }
  
  if (options.entityId) {
    conditions.push('entity_id = ?')
    params.push(options.entityId)
  }
  
  if (options.startDate) {
    conditions.push('created_at >= ?')
    params.push(options.startDate)
  }
  
  if (options.endDate) {
    conditions.push('created_at <= ?')
    params.push(options.endDate)
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = options.limit || 100
  const offset = options.offset || 0
  
  const query = `
    SELECT * FROM audit_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  
  return await prisma.$queryRawUnsafe(query, ...params)
}

export async function getActivitySummary(userId: string, days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const activities = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      action,
      COUNT(*) as count
    FROM audit_logs
    WHERE user_id = ${userId}
      AND created_at >= ${startDate}
    GROUP BY DATE(created_at), action
    ORDER BY date DESC
  `
  
  return activities
}

export async function getSystemActivityReport(days: number = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const report = await prisma.$queryRaw`
    SELECT 
      action,
      COUNT(*) as total_count,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT entity_id) as unique_entities,
      MIN(created_at) as first_occurrence,
      MAX(created_at) as last_occurrence
    FROM audit_logs
    WHERE created_at >= ${startDate}
    GROUP BY action
    ORDER BY total_count DESC
  `
  
  return report
}

// リクエストコンテキストを取得するヘルパー
export function getAuditContext(request: Request, user?: AdminUser): AuditLogContext {
  const headers = request.headers
  
  return {
    user,
    ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
    requestId: headers.get('x-request-id') || undefined,
    sessionId: headers.get('x-session-id') || undefined,
  }
}

