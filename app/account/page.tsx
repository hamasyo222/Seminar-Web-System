'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar, Download, Mail, MapPin, QrCode, Tag, User, LogOut } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Alert from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Loading'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import { toast } from 'react-hot-toast'
import type { OrderWithDetails } from '@/types'

export default function AccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [email, setEmail] = useState('')
  const [showQRCode, setShowQRCode] = useState<string | null>(null)

  useEffect(() => {
    // メールアドレスをlocalStorageから取得（簡易的な実装）
    const storedEmail = localStorage.getItem('userEmail')
    if (!storedEmail) {
      router.push('/account/login')
      return
    }
    setEmail(storedEmail)
    fetchOrders(storedEmail)
  }, [router])

  const fetchOrders = async (userEmail: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/account/orders?email=${encodeURIComponent(userEmail)}`)
      const data = await response.json()

      if (data.success) {
        setOrders(data.data)
      } else {
        toast.error('注文情報の取得に失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const response = await fetch(`/api/account/invoice/${orderId}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${orderId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('領収書をダウンロードしました')
      } else {
        toast.error('領収書のダウンロードに失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    }
  }

  const handleShowQRCode = (participantId: string) => {
    setShowQRCode(participantId)
  }

  const handleLogout = () => {
    localStorage.removeItem('userEmail')
    router.push('/account/login')
  }

  const now = new Date()
  const upcomingOrders = orders.filter(order => 
    order.status === 'PAID' && new Date(order.session.startAt) >= now
  )
  const pastOrders = orders.filter(order => 
    order.status === 'PAID' && new Date(order.session.startAt) < now
  )

  const displayOrders = activeTab === 'upcoming' ? upcomingOrders : pastOrders

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: '支払待ち', variant: 'warning' as const },
      PAID: { label: '支払済み', variant: 'success' as const },
      CANCELLED: { label: 'キャンセル', variant: 'danger' as const },
      REFUNDED: { label: '返金済み', variant: 'info' as const },
      EXPIRED: { label: '期限切れ', variant: 'default' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">マイページ</h1>
              <p className="text-sm text-gray-600">{email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            ログアウト
          </Button>
        </div>
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            開催予定 ({upcomingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            過去の参加 ({pastOrders.length})
          </button>
        </nav>
      </div>

      {/* 注文一覧 */}
      {displayOrders.length === 0 ? (
        <Alert variant="info">
          {activeTab === 'upcoming' 
            ? '開催予定のセミナーはありません。' 
            : '過去に参加したセミナーはありません。'}
        </Alert>
      ) : (
        <div className="space-y-6">
          {displayOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.session.seminar.title}
                      </h3>
                      <span className="ml-3">{getStatusBadge(order.status)}</span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {format(new Date(order.session.startAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                        〜
                        {format(new Date(order.session.endAt), 'HH:mm', { locale: ja })}
                      </div>

                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {order.session.format === 'ONLINE' 
                          ? 'オンライン開催' 
                          : order.session.venue || '会場未定'}
                      </div>

                      <div className="flex items-center">
                        <Tag className="w-4 h-4 mr-2 text-gray-400" />
                        注文番号: {order.orderNumber}
                      </div>
                    </div>

                    {/* 参加者一覧 */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">参加者</h4>
                      <div className="space-y-2">
                        {order.participants.map((participant) => (
                          <div key={participant.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{participant.name}</span>
                              {participant.attendanceStatus === 'CHECKED_IN' && (
                                <Badge variant="success" size="sm" className="ml-2">
                                  チェックイン済み
                                </Badge>
                              )}
                            </div>
                            {activeTab === 'upcoming' && order.session.format !== 'ONLINE' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShowQRCode(participant.id)}
                              >
                                <QrCode className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* オンライン参加URL */}
                    {order.session.format === 'ONLINE' && order.session.onlineUrl && activeTab === 'upcoming' && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          オンライン参加URL
                        </p>
                        <a
                          href={order.session.onlineUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          {order.session.onlineUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadInvoice(order.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      領収書
                    </Button>
                  </div>
                </div>
              </div>

              {/* キャンセルポリシー */}
              {activeTab === 'upcoming' && (
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <p className="text-xs text-gray-600">
                    キャンセルポリシーについては、各セミナーページをご確認ください。
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* QRコードモーダル */}
      {showQRCode && (() => {
        const participant = orders
          .flatMap(o => o.participants)
          .find(p => p.id === showQRCode)
        const order = orders.find(o => 
          o.participants.some(p => p.id === showQRCode)
        )
        
        return participant && order ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4">チェックイン用QRコード</h3>
              <div className="flex justify-center mb-4">
                <QRCodeDisplay
                  participantId={participant.id}
                  sessionId={order.session.id}
                  participantName={participant.name}
                />
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                受付でこのQRコードをご提示ください
              </p>
              <Button
                variant="primary"
                fullWidth
                onClick={() => setShowQRCode(null)}
              >
                閉じる
              </Button>
            </div>
          </div>
        ) : null
      })()}
    </div>
  )
}