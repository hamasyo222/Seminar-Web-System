'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ChevronLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { TicketType } from '@prisma/client'

interface TicketFormData {
  name: string
  description: string
  price: number
  taxRate: number
  stock: number
  maxPerOrder: number
  salesStartAt: string
  salesEndAt: string
  sortOrder: number
  isActive: boolean
}

export default function TicketsPage() {
  const params = useParams()
  const router = useRouter()
  const seminarId = params.seminarId as string
  const sessionId = params.sessionId as string
  
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [formData, setFormData] = useState<TicketFormData>({
    name: '',
    description: '',
    price: 0,
    taxRate: 10,
    stock: 100,
    maxPerOrder: 10,
    salesStartAt: '',
    salesEndAt: '',
    sortOrder: 0,
    isActive: true
  })

  useEffect(() => {
    fetchTickets()
  }, [sessionId])

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`)
      if (!res.ok) throw new Error('データの取得に失敗しました')
      
      const data = await res.json()
      setTickets(data.ticketTypes || [])
    } catch (error) {
      toast.error('チケット情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId 
        ? `/api/admin/seminars/${seminarId}/sessions/${sessionId}/tickets/${editingId}`
        : `/api/admin/seminars/${seminarId}/sessions/${sessionId}/tickets`
      
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sessionId,
          salesStartAt: formData.salesStartAt ? new Date(formData.salesStartAt).toISOString() : null,
          salesEndAt: formData.salesEndAt ? new Date(formData.salesEndAt).toISOString() : null
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'エラーが発生しました')
      }

      toast.success(editingId ? 'チケット種別を更新しました' : 'チケット種別を作成しました')
      
      resetForm()
      fetchTickets()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'エラーが発生しました')
    }
  }

  const handleEdit = (ticket: TicketType) => {
    setEditingId(ticket.id)
    setShowNewForm(false)
    setFormData({
      name: ticket.name,
      description: ticket.description || '',
      price: ticket.price,
      taxRate: ticket.taxRate,
      stock: ticket.stock,
      maxPerOrder: ticket.maxPerOrder,
      salesStartAt: ticket.salesStartAt ? new Date(ticket.salesStartAt).toISOString().slice(0, 16) : '',
      salesEndAt: ticket.salesEndAt ? new Date(ticket.salesEndAt).toISOString().slice(0, 16) : '',
      sortOrder: ticket.sortOrder,
      isActive: ticket.isActive
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このチケット種別を削除してもよろしいですか？')) return

    try {
      const res = await fetch(`/api/admin/seminars/${seminarId}/sessions/${sessionId}/tickets/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('削除に失敗しました')

      toast.success('チケット種別を削除しました')
      fetchTickets()
    } catch (error) {
      toast.error('削除に失敗しました')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setShowNewForm(false)
    setFormData({
      name: '',
      description: '',
      price: 0,
      taxRate: 10,
      stock: 100,
      maxPerOrder: 10,
      salesStartAt: '',
      salesEndAt: '',
      sortOrder: 0,
      isActive: true
    })
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">読み込み中...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/seminars/${seminarId}/sessions`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          セッション一覧に戻る
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8">
        <h1 className="text-3xl font-bold text-gray-900">チケット種別管理</h1>
        {!showNewForm && !editingId && (
          <button
            onClick={() => setShowNewForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            チケット種別を追加
          </button>
        )}
      </div>

      {/* フォーム */}
      {(showNewForm || editingId) && (
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'チケット種別を編集' : '新規チケット種別'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  チケット名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  価格（税込） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  税率（%）
                </label>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  在庫数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  1注文あたりの最大購入数
                </label>
                <input
                  type="number"
                  value={formData.maxPerOrder}
                  onChange={(e) => setFormData({ ...formData, maxPerOrder: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  販売開始日時
                </label>
                <input
                  type="datetime-local"
                  value={formData.salesStartAt}
                  onChange={(e) => setFormData({ ...formData, salesStartAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  販売終了日時
                </label>
                <input
                  type="datetime-local"
                  value={formData.salesEndAt}
                  onChange={(e) => setFormData({ ...formData, salesEndAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  表示順
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                  <span className="text-sm font-medium text-gray-700">販売中</span>
                </label>
              </div>
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

      {/* チケット一覧 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                チケット名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                価格
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                在庫
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                販売期間
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
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  チケット種別が登録されていません
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{ticket.name}</div>
                      {ticket.description && (
                        <div className="text-sm text-gray-500">{ticket.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{ticket.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticket.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.salesStartAt ? (
                      <div>
                        {new Date(ticket.salesStartAt).toLocaleDateString('ja-JP')}
                        {ticket.salesEndAt && (
                          <>
                            <br />〜 {new Date(ticket.salesEndAt).toLocaleDateString('ja-JP')}
                          </>
                        )}
                      </div>
                    ) : (
                      '制限なし'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      ticket.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.isActive ? '販売中' : '停止'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(ticket)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ticket.id)}
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
