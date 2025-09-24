'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { 
  Settings, 
  Users, 
  Save, 
  Plus,
  Edit2,
  Trash2,
  Key,
  Shield,
  Building,
  Mail,
  CreditCard
} from 'lucide-react'
import { AdminUser } from '@prisma/client'

interface AdminUserFormData {
  email: string
  name: string
  role: string
  password?: string
}

interface CompanySettings {
  name: string
  taxId: string
  address: string
  tel: string
  email: string
}

interface PaymentSettings {
  komojuPublicKey: string
  komojuSecretKey: string
  komojuWebhookSecret: string
}

interface MailSettings {
  sendgridApiKey: string
  fromEmail: string
  fromName: string
  replyToEmail: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'company' | 'payment' | 'mail'>('users')
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: '',
    taxId: '',
    address: '',
    tel: '',
    email: ''
  })
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    komojuPublicKey: '',
    komojuSecretKey: '',
    komojuWebhookSecret: ''
  })
  const [mailSettings, setMailSettings] = useState<MailSettings>({
    sendgridApiKey: '',
    fromEmail: '',
    fromName: '',
    replyToEmail: ''
  })
  const [loading, setLoading] = useState(true)
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [userFormData, setUserFormData] = useState<AdminUserFormData>({
    email: '',
    name: '',
    role: 'VIEWER',
    password: ''
  })

  useEffect(() => {
    if (activeTab === 'users') {
      fetchAdminUsers()
    } else {
      fetchSettings()
    }
  }, [activeTab])

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/settings/users')
      if (!res.ok) throw new Error('管理者ユーザーの取得に失敗しました')
      
      const data = await res.json()
      setAdminUsers(data)
    } catch (error) {
      toast.error('管理者ユーザーの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('設定の取得に失敗しました')
      
      const data = await res.json()
      setCompanySettings(data.company || companySettings)
      setPaymentSettings(data.payment || paymentSettings)
      setMailSettings(data.mail || mailSettings)
    } catch (error) {
      toast.error('設定の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingUserId 
        ? `/api/admin/settings/users/${editingUserId}`
        : '/api/admin/settings/users'
      
      const method = editingUserId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'エラーが発生しました')
      }

      toast.success(editingUserId ? 'ユーザーを更新しました' : 'ユーザーを作成しました')
      
      resetUserForm()
      fetchAdminUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'エラーが発生しました')
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('このユーザーを削除してもよろしいですか？')) return

    try {
      const res = await fetch(`/api/admin/settings/users/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('削除に失敗しました')

      toast.success('ユーザーを削除しました')
      fetchAdminUsers()
    } catch (error) {
      toast.error('削除に失敗しました')
    }
  }

  const handleEditUser = (user: AdminUser) => {
    setEditingUserId(user.id)
    setShowUserForm(true)
    setUserFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      password: ''
    })
  }

  const resetUserForm = () => {
    setEditingUserId(null)
    setShowUserForm(false)
    setUserFormData({
      email: '',
      name: '',
      role: 'VIEWER',
      password: ''
    })
  }

  const handleSettingsSave = async (type: 'company' | 'payment' | 'mail') => {
    try {
      const data = type === 'company' ? companySettings : type === 'payment' ? paymentSettings : mailSettings
      
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data })
      })

      if (!res.ok) throw new Error('保存に失敗しました')

      toast.success('設定を保存しました')
    } catch (error) {
      toast.error('設定の保存に失敗しました')
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'スーパー管理者'
      case 'ADMIN': return '管理者'
      case 'ACCOUNTANT': return '経理担当'
      case 'VIEWER': return '閲覧者'
      default: return role
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">読み込み中...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">設定</h1>

      {/* タブ */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            管理者ユーザー
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'company'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building className="w-4 h-4 inline mr-2" />
            会社情報
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            決済設定
          </button>
          <button
            onClick={() => setActiveTab('mail')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'mail'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            メール設定
          </button>
        </nav>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="flex justify-end mb-4">
            {!showUserForm && (
              <button
                onClick={() => setShowUserForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                ユーザーを追加
              </button>
            )}
          </div>

          {showUserForm && (
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingUserId ? 'ユーザーを編集' : '新規ユーザー'}
              </h2>
              
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      役割 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="VIEWER">閲覧者</option>
                      <option value="ACCOUNTANT">経理担当</option>
                      <option value="ADMIN">管理者</option>
                      <option value="SUPER_ADMIN">スーパー管理者</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      パスワード {editingUserId ? '' : <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required={!editingUserId}
                      placeholder={editingUserId ? '変更する場合のみ入力' : ''}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetUserForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    役割
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
                {adminUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{getRoleLabel(user.role)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.isActive ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'company' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">会社情報</h2>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会社名
              </label>
              <input
                type="text"
                value={companySettings.name}
                onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                法人番号
              </label>
              <input
                type="text"
                value={companySettings.taxId}
                onChange={(e) => setCompanySettings({ ...companySettings, taxId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                住所
              </label>
              <textarea
                value={companySettings.address}
                onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={companySettings.tel}
                  onChange={(e) => setCompanySettings({ ...companySettings, tel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={companySettings.email}
                  onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSettingsSave('company')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save className="w-4 h-4 inline mr-1" />
                保存
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">決済設定（KOMOJU）</h2>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                公開鍵
              </label>
              <input
                type="text"
                value={paymentSettings.komojuPublicKey}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, komojuPublicKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="pk_live_..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                秘密鍵
              </label>
              <input
                type="password"
                value={paymentSettings.komojuSecretKey}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, komojuSecretKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="sk_live_..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook秘密鍵
              </label>
              <input
                type="password"
                value={paymentSettings.komojuWebhookSecret}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, komojuWebhookSecret: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSettingsSave('payment')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save className="w-4 h-4 inline mr-1" />
                保存
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'mail' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">メール設定（SendGrid）</h2>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                APIキー
              </label>
              <input
                type="password"
                value={mailSettings.sendgridApiKey}
                onChange={(e) => setMailSettings({ ...mailSettings, sendgridApiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="SG...."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  送信元メールアドレス
                </label>
                <input
                  type="email"
                  value={mailSettings.fromEmail}
                  onChange={(e) => setMailSettings({ ...mailSettings, fromEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  送信者名
                </label>
                <input
                  type="text"
                  value={mailSettings.fromName}
                  onChange={(e) => setMailSettings({ ...mailSettings, fromName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                返信先メールアドレス
              </label>
              <input
                type="email"
                value={mailSettings.replyToEmail}
                onChange={(e) => setMailSettings({ ...mailSettings, replyToEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSettingsSave('mail')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save className="w-4 h-4 inline mr-1" />
                保存
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
