'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Search, Filter, Download, ChevronRight, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Loading'
import { toast } from 'react-hot-toast'

interface AuditLog {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  userId: string | null
  userName: string | null
  userEmail: string | null
  userRole: string | null
  ipAddress: string | null
  userAgent: string | null
  description: string | null
  createdAt: string
  metadata: any
  oldValue: string | null
  newValue: string | null
}

const actionLabels: Record<string, string> = {
  LOGIN: 'ログイン',
  LOGOUT: 'ログアウト',
  LOGIN_FAILED: 'ログイン失敗',
  PASSWORD_CHANGE: 'パスワード変更',
  SEMINAR_CREATE: 'セミナー作成',
  SEMINAR_UPDATE: 'セミナー更新',
  SEMINAR_DELETE: 'セミナー削除',
  SESSION_CREATE: 'セッション作成',
  SESSION_UPDATE: 'セッション更新',
  SESSION_DELETE: 'セッション削除',
  ORDER_CREATE: '注文作成',
  ORDER_UPDATE: '注文更新',
  ORDER_CANCEL: '注文キャンセル',
  ORDER_REFUND: '返金処理',
  PARTICIPANT_CHECKIN: 'チェックイン',
  EMAIL_SEND: 'メール送信',
  DATA_EXPORT: 'データエクスポート',
}

const actionColors: Record<string, 'danger' | 'warning' | 'success' | 'info' | 'default'> = {
  LOGIN_FAILED: 'danger',
  DELETE: 'danger',
  CANCEL: 'warning',
  REFUND: 'warning',
  CREATE: 'success',
  LOGIN: 'success',
  UPDATE: 'info',
  EXPORT: 'default',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    entityType: '',
    startDate: '',
    endDate: '',
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAuditLogs()
  }, [filters])

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.action) params.append('action', filters.action)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.entityType) params.append('entityType', filters.entityType)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.data)
      } else {
        toast.error('監査ログの取得に失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    for (const [key, color] of Object.entries(actionColors)) {
      if (action.includes(key)) return color
    }
    return 'default'
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.action) params.append('action', filters.action)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.entityType) params.append('entityType', filters.entityType)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      params.append('format', 'csv')

      const response = await fetch(`/api/admin/audit-logs/export?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('エクスポートが完了しました')
      } else {
        toast.error('エクスポートに失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    }
  }

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      log.userName?.toLowerCase().includes(searchLower) ||
      log.userEmail?.toLowerCase().includes(searchLower) ||
      log.description?.toLowerCase().includes(searchLower) ||
      log.ipAddress?.includes(searchTerm)
    )
  })

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">監査ログ</h1>
          <p className="mt-2 text-sm text-gray-700">
            システムのすべての操作履歴を確認できます
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            variant="secondary"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            エクスポート
          </Button>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="アクション"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          >
            <option value="">すべて</option>
            {Object.entries(actionLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          
          <Select
            label="エンティティタイプ"
            value={filters.entityType}
            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
          >
            <option value="">すべて</option>
            <option value="Seminar">セミナー</option>
            <option value="Session">セッション</option>
            <option value="Order">注文</option>
            <option value="Participant">参加者</option>
            <option value="AdminUser">管理者</option>
          </Select>
          
          <Input
            label="開始日"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          
          <Input
            label="終了日"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
          
          <div className="lg:col-span-2">
            <Input
              label="検索"
              placeholder="ユーザー名、メールアドレス、IPアドレスで検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* ログ一覧 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              監査ログがありません
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              条件に一致するログが見つかりません
            </p>
          </div>
        ) : (
          <div className="min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    詳細
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IPアドレス
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(log.createdAt), 'yyyy/MM/dd HH:mm:ss', {
                        locale: ja,
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getActionColor(log.action)}
                        size="sm"
                      >
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{log.userName || '—'}</div>
                        <div className="text-gray-500">{log.userEmail || '—'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.description || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 詳細モーダル */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="監査ログ詳細"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  日時
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(selectedLog.createdAt), 'yyyy/MM/dd HH:mm:ss', {
                    locale: ja,
                  })}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  アクション
                </label>
                <p className="mt-1">
                  <Badge
                    variant={getActionColor(selectedLog.action)}
                    size="sm"
                  >
                    {actionLabels[selectedLog.action] || selectedLog.action}
                  </Badge>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  ユーザー
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedLog.userName || '—'}
                  {selectedLog.userRole && (
                    <span className="text-gray-500 ml-2">
                      ({selectedLog.userRole})
                    </span>
                  )}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  メールアドレス
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedLog.userEmail || '—'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  エンティティ
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedLog.entityType || '—'}
                  {selectedLog.entityId && ` (${selectedLog.entityId})`}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  IPアドレス
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedLog.ipAddress || '—'}
                </p>
              </div>
            </div>
            
            {selectedLog.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  説明
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedLog.description}
                </p>
              </div>
            )}
            
            {selectedLog.userAgent && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  ユーザーエージェント
                </label>
                <p className="mt-1 text-sm text-gray-900 font-mono text-xs break-all">
                  {selectedLog.userAgent}
                </p>
              </div>
            )}
            
            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  メタデータ
                </label>
                <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded overflow-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
            
            {(selectedLog.oldValue || selectedLog.newValue) && (
              <div className="grid grid-cols-2 gap-4">
                {selectedLog.oldValue && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      変更前
                    </label>
                    <pre className="mt-1 text-sm text-gray-900 bg-red-50 p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(JSON.parse(selectedLog.oldValue), null, 2)}
                    </pre>
                  </div>
                )}
                
                {selectedLog.newValue && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      変更後
                    </label>
                    <pre className="mt-1 text-sm text-gray-900 bg-green-50 p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(JSON.parse(selectedLog.newValue), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
