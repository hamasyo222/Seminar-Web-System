'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { formatJST } from '@/lib/date'
import { formatCurrency } from '@/utils'
import { 
  Ticket, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Copy,
  Calendar,
  Tag
} from 'lucide-react'
import { Coupon } from '@prisma/client'

interface CouponFormData {
  code: string
  name: string
  discountType: 'AMOUNT' | 'PERCENTAGE'
  discountValue: number
  usageLimit: number | null
  validFrom: string
  validUntil: string
  minAmount: number | null
  seminarIds: string[]
  isActive: boolean
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [seminars, setSeminars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    name: '',
    discountType: 'AMOUNT',
    discountValue: 0,
    usageLimit: null,
    validFrom: '',
    validUntil: '',
    minAmount: null,
    seminarIds: [],
    isActive: true
  })

  useEffect(() => {
    fetchCoupons()
    fetchSeminars()
  }, [])

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons')
      if (!res.ok) throw new Error('クーポンの取得に失敗しました')
      
      const data = await res.json()
      setCoupons(data)
    } catch (error) {
      toast.error('クーポンの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchSeminars = async () => {
    try {
      const res = await fetch('/api/admin/seminars')
      if (!res.ok) throw new Error('セミナーの取得に失敗しました')
      
      const data = await res.json()
      setSeminars(data)
    } catch (error) {
      toast.error('セミナーの取得に失敗しました')
    }
  }

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId 
        ? `/api/admin/coupons/${editingId}`
        : '/api/admin/coupons'
      
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          seminarIds: JSON.stringify(formData.seminarIds),
          validFrom: new Date(formData.validFrom).toISOString(),
          validUntil: new Date(formData.validUntil).toISOString()
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'エラーが発生しました')
      }

      toast.success(editingId ? 'クーポンを更新しました' : 'クーポンを作成しました')
      
      resetForm()
      fetchCoupons()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'エラーが発生しました')
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon.id)
    setShowNewForm(false)
    setFormData({
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      usageLimit: coupon.usageLimit,
      validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(coupon.validUntil).toISOString().slice(0, 16),
      minAmount: coupon.minAmount,
      seminarIds: JSON.parse(coupon.seminarIds),
      isActive: coupon.isActive
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このクーポンを削除してもよろしいですか？')) return

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('削除に失敗しました')

      toast.success('クーポンを削除しました')
      fetchCoupons()
    } catch (error) {
      toast.error('削除に失敗しました')
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('コピーしました')
  }

  const resetForm = () => {
    setEditingId(null)
    setShowNewForm(false)
    setFormData({
      code: '',
      name: '',
      discountType: 'AMOUNT',
      discountValue: 0,
      usageLimit: null,
      validFrom: '',
      validUntil: '',
      minAmount: null,
      seminarIds: [],
      isActive: true
    })
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">読み込み中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">クーポン管理</h1>
        {!showNewForm && !editingId && (
          <button
            onClick={() => setShowNewForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            クーポンを作成
          </button>
        )}
      </div>

      {/* フォーム */}
      {(showNewForm || editingId) && (
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'クーポンを編集' : '新規クーポン'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  クーポンコード <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCouponCode}
                    className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-50"
                  >
                    生成
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  クーポン名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  割引タイプ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'AMOUNT' | 'PERCENTAGE' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="AMOUNT">金額割引</option>
                  <option value="PERCENTAGE">パーセント割引</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  割引値 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                    required
                    min="0"
                    max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500">
                    {formData.discountType === 'AMOUNT' ? '円' : '%'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  使用回数上限
                </label>
                <input
                  type="number"
                  value={formData.usageLimit || ''}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="無制限"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最低購入金額
                </label>
                <input
                  type="number"
                  value={formData.minAmount || ''}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="制限なし"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  有効開始日時 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  有効終了日時 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                対象セミナー
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.seminarIds.length === 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, seminarIds: [] })
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">すべてのセミナー</span>
                </label>
                {seminars.map((seminar) => (
                  <label key={seminar.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.seminarIds.includes(seminar.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ 
                            ...formData, 
                            seminarIds: [...formData.seminarIds, seminar.id] 
                          })
                        } else {
                          setFormData({ 
                            ...formData, 
                            seminarIds: formData.seminarIds.filter(id => id !== seminar.id) 
                          })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{seminar.title}</span>
                  </label>
                ))}
              </div>
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

      {/* クーポン一覧 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                クーポン
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                割引
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                使用状況
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                有効期間
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
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  クーポンが登録されていません
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{coupon.name}</span>
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-sm text-gray-500 font-mono">{coupon.code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {coupon.discountType === 'AMOUNT' 
                      ? formatCurrency(coupon.discountValue) 
                      : `${coupon.discountValue}%`}
                    {coupon.minAmount && (
                      <div className="text-xs text-gray-500">
                        {formatCurrency(coupon.minAmount)}以上
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {coupon.usageCount} / {coupon.usageLimit || '∞'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>{formatJST(coupon.validFrom)}</span>
                      <span>〜 {formatJST(coupon.validUntil)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      coupon.isActive && new Date() >= new Date(coupon.validFrom) && new Date() <= new Date(coupon.validUntil)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {coupon.isActive ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
