'use client'

import { useState, useEffect } from 'react'
import { formatJST } from '@/lib/date'
import { formatCurrency, getOrderStatus } from '@/utils'
import { toast } from 'react-hot-toast'
import { FileText, Download, Calendar, MapPin } from 'lucide-react'
import type { OrderWithDetails } from '@/types'

export default function AccountPage() {
  const [email, setEmail] = useState('')
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('メールアドレスを入力してください')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/account/orders?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (data.success) {
        setOrders(data.data)
        setSearched(true)
        if (data.data.length === 0) {
          toast.error('申込履歴が見つかりませんでした')
        }
      } else {
        toast.error(data.error || '検索に失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
    try {
      const response = await fetch(`/api/account/invoice/${orderId}`)
      
      if (!response.ok) {
        throw new Error('領収書のダウンロードに失敗しました')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice_${orderNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('領収書をダウンロードしました')
    } catch (error) {
      toast.error('領収書のダウンロードに失敗しました')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">マイページ</h1>

      {/* メールアドレス入力 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">申込履歴の確認</h2>
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="登録したメールアドレスを入力"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '検索中...' : '検索'}
          </button>
        </form>
      </div>

      {/* 申込履歴 */}
      {searched && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">申込履歴が見つかりませんでした</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900">
                申込履歴（{orders.length}件）
              </h2>
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.session.seminar.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          注文番号: {order.orderNumber}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        order.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'CANCELLED'
                          ? 'bg-gray-100 text-gray-800'
                          : order.status === 'REFUNDED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getOrderStatus(order.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatJST(order.session.startAt)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {order.session.venue || 'オンライン'}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">参加者</span>
                        <span className="text-sm font-medium text-gray-900">
                          {order.participants.length}名
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">合計金額</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">申込日</span>
                        <span className="text-sm text-gray-900">
                          {formatJST(order.createdAt, 'YYYY/MM/DD')}
                        </span>
                      </div>
                    </div>

                    {/* 参加者リスト */}
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">参加者</h4>
                      <div className="space-y-1">
                        {order.participants.map((participant, index) => (
                          <div key={participant.id} className="text-sm text-gray-600">
                            {index + 1}. {participant.name}
                            {participant.email !== order.email && ` (${participant.email})`}
                            {participant.attendanceStatus === 'CHECKED_IN' && (
                              <span className="ml-2 text-green-600">✓ 受付済み</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* アクション */}
                    {order.status === 'PAID' && (
                      <div className="mt-6 flex justify-end space-x-4">
                        <button
                          onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          領収書
                        </button>
                        {order.session.format === 'ONLINE' && order.participants.some(p => 
                          p.zoomRegistrations?.some(zr => zr.status === 'REGISTERED')
                        ) && (
                          <button className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100">
                            <Download className="w-4 h-4 mr-2" />
                            参加URL確認
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* 注意事項 */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">ご注意事項</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 領収書は支払完了後にダウンロード可能です</li>
          <li>• キャンセルをご希望の場合は、各セミナーのキャンセルポリシーをご確認の上、お問い合わせください</li>
          <li>• オンライン参加URLは、開催前日と1時間前にメールでもお送りします</li>
          <li>• ご不明な点がございましたら、お気軽にお問い合わせください</li>
        </ul>
      </div>
    </div>
  )
}
