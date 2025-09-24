import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getAuditLogs, AuditAction } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // SUPER_ADMINとADMINのみ監査ログを閲覧可能
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    const options = {
      action: searchParams.get('action') as AuditAction | undefined,
      userId: searchParams.get('userId') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const logs = await getAuditLogs(options)

    return NextResponse.json({
      success: true,
      data: logs,
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: '監査ログの取得に失敗しました' },
      { status: 500 }
    )
  }
}
