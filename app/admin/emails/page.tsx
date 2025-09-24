'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { formatJST } from '@/lib/date'
import { 
  Mail, 
  Edit2, 
  Save, 
  X, 
  Plus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { EmailTemplate, EmailLog } from '@prisma/client'

interface EmailTemplateForm {
  code: string
  name: string
  subject: string
  bodyHtml: string
  bodyText: string
  variables: string[]
  isActive: boolean
}

export default function EmailsPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates')
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [formData, setFormData] = useState<EmailTemplateForm>({
    code: '',
    name: '',
    subject: '',
    bodyHtml: '',
    bodyText: '',
    variables: [],
    isActive: true
  })

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates()
    } else {
      fetchLogs()
    }
  }, [activeTab])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/emails/templates')
      if (!res.ok) throw new Error('テンプレートの取得に失敗しました')
      
      const data = await res.json()
      setTemplates(data)
    } catch (error) {
      toast.error('テンプレートの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/emails/logs')
      if (!res.ok) throw new Error('送信ログの取得に失敗しました')
      
      const data = await res.json()
      setLogs(data)
    } catch (error) {
      toast.error('送信ログの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId 
        ? `/api/admin/emails/templates/${editingId}`
        : '/api/admin/emails/templates'
      
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variables: JSON.stringify(formData.variables)
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'エラーが発生しました')
      }

      toast.success(editingId ? 'テンプレートを更新しました' : 'テンプレートを作成しました')
      
      resetForm()
      fetchTemplates()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'エラーが発生しました')
    }
  }

  const handleEdit = (template: EmailTemplate) => {
    setEditingId(template.id)
    setShowNewForm(false)
    setFormData({
      code: template.code,
      name: template.name,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      bodyText: template.bodyText,
      variables: JSON.parse(template.variables),
      isActive: template.isActive
    })
  }

  const handleTestSend = async (templateId: string) => {
    const email = prompt('テスト送信先のメールアドレスを入力してください')
    if (!email) return

    try {
      const res = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, email })
      })

      if (!res.ok) throw new Error('テスト送信に失敗しました')

      toast.success('テストメールを送信しました')
    } catch (error) {
      toast.error('テスト送信に失敗しました')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setShowNewForm(false)
    setFormData({
      code: '',
      name: '',
      subject: '',
      bodyHtml: '',
      bodyText: '',
      variables: [],
      isActive: true
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'BOUNCED':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">読み込み中...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">メール管理</h1>

      {/* タブ */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            メールテンプレート
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            送信ログ
          </button>
        </nav>
      </div>

      {activeTab === 'templates' ? (
        <>
          {/* テンプレート管理 */}
          <div className="flex justify-end mb-4">
            {!showNewForm && !editingId && (
              <button
                onClick={() => setShowNewForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                テンプレートを追加
              </button>
            )}
          </div>

          {/* フォーム */}
          {(showNewForm || editingId) && (
            <div className="bg-white rounded-lg shadow mb-8 p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingId ? 'テンプレートを編集' : '新規テンプレート'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      コード <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                      disabled={!!editingId}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      テンプレート名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    件名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HTML本文 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.bodyHtml}
                    onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={10}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    テキスト本文 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.bodyText}
                    onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={10}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    変数（カンマ区切り）
                  </label>
                  <input
                    type="text"
                    value={formData.variables.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      variables: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="name, email, seminarTitle"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">有効</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 inline mr-1" />
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 inline mr-1" />
                    保存
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* テンプレート一覧 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    テンプレート
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    件名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    変数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      テンプレートが登録されていません
                    </td>
                  </tr>
                ) : (
                  templates.map((template) => (
                    <tr key={template.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-500">{template.code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {template.subject}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {JSON.parse(template.variables).join(', ') || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.isActive ? '有効' : '無効'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(template)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTestSend(template.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* 送信ログ */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    送信日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    宛先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    件名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      送信ログがありません
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatJST(log.sentAt || log.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {JSON.parse(log.to).join(', ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(log.status)}
                          <span className="ml-2 text-sm text-gray-600">
                            {log.status}
                          </span>
                        </div>
                        {log.error && (
                          <div className="text-xs text-red-600 mt-1">
                            {log.error}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
