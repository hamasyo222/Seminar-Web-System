import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getAuditLogs, createAuditLog, AuditAction, getAuditContext } from '@/lib/audit'
import { generateCSV } from '@/lib/csv'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // SUPER_ADMINとADMINのみ監査ログをエクスポート可能
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
      limit: 10000, // エクスポート時は上限を高く設定
      offset: 0,
    }

    const logs = await getAuditLogs(options)

    // CSVデータを生成
    const headers = [
      '日時',
      'アクション',
      'エンティティタイプ',
      'エンティティID',
      'ユーザー名',
      'メールアドレス',
      'ロール',
      'IPアドレス',
      '説明'
    ]
    
    const rows = (logs as any[]).map((log: any) => [
      new Date(log.createdAt).toLocaleString('ja-JP'),
      log.action,
      log.entityType,
      log.entityId || '',
      log.user?.name || '',
      log.user?.email || '',
      log.user?.role || '',
      log.ipAddress || '',
      log.description || ''
    ])
    
    const csvData = generateCSV(headers, rows)

    // エクスポートの監査ログを記録
    const context = getAuditContext(request, user)
    await createAuditLog(
      {
        action: AuditAction.DATA_EXPORT,
        entityType: 'AuditLog',
        metadata: {
          exportedCount: (logs as any[]).length,
          filters: options,
        },
        description: `監査ログをエクスポート (${(logs as any[]).length}件)`,
      },
      context
    )

    // CSVファイルとしてレスポンスを返す
    const encoder = new TextEncoder()
    const csvBuffer = encoder.encode(csvData)

    return new NextResponse(csvBuffer, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    return NextResponse.json(
      { error: '監査ログのエクスポートに失敗しました' },
      { status: 500 }
    )
  }
}
