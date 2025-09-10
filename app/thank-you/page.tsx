'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react'
import type { OrderWithDetails } from '@/types'

function ThankYouContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError('セッションIDが指定されていません')
      setLoading(false)
      return
    }

    // KOMOJUセッションIDから注文情報を取得
    fetch(`/api/orders/by-session/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrder(data.data)
        } else {
          setError(data.error || '注文情報の取得に失敗しました')
        }
      })
      .catch(() => {
        setError('エラーが発生しました')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [sessionId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">エラーが発生しました</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link
            href="/seminars"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            セミナー一覧へ戻る
          </Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">注文情報が見つかりません</h1>
          <p className="text-gray-600 mb-8">
            お申込み情報の確認ができませんでした。
            メールをご確認いただくか、お問い合わせください。
          </p>
          <Link
            href="/seminars"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            セミナー一覧へ戻る
          </Link>
        </div>
      </div>
    )
  }

  const getStatusIcon = () => {
    switch (order.status) {
      case 'PAID':
        return <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      case 'PENDING':
        return <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
      case 'CANCELLED':
      case 'EXPIRED':
        return <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      default:
        return <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
    }
  }

  const getStatusMessage = () => {
    switch (order.status) {
      case 'PAID':
        return {
          title: 'お申込みが完了しました',
          message: 'お支払いが確認されました。確認メールをお送りしましたのでご確認ください。',
        }
      case 'PENDING':
        return {
          title: 'お支払い待ちです',
          message: order.paymentMethod === 'KONBINI'
            ? 'コンビニでのお支払いをお待ちしております。支払い期限までにお支払いください。'
            : 'お支払いの確認中です。しばらくお待ちください。',
        }
      case 'CANCELLED':
        return {
          title: 'お申込みがキャンセルされました',
          message: 'お申込みはキャンセルされました。',
        }
      case 'EXPIRED':
        return {
          title: 'お支払い期限が切れました',
          message: 'お支払い期限が過ぎたため、お申込みは無効となりました。',
        }
      default:
        return {
          title: '状態を確認中です',
          message: 'お申込み状態を確認しています。',
        }
    }
  }

  const { title, message } = getStatusMessage()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        {getStatusIcon()}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-lg text-gray-600">{message}</p>
      </div>

      {/* 申込内容 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">お申込み内容</h2>
        </div>
        <div className="p-6">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">注文番号</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">セミナー名</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.session.seminar.title}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">開催日時</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(order.session.startAt).toLocaleString('ja-JP')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">参加者数</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.participants.length}名</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">合計金額</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                ¥{order.total.toLocaleString()}（税込）
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 次のステップ */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">次のステップ</h3>
        <ul className="space-y-2 text-blue-800">
          {order.status === 'PAID' && (
            <>
              <li>• 確認メールをお送りしました。迷惑メールフォルダもご確認ください。</li>
              <li>• 開催前日と1時間前にリマインダーメールをお送りします。</li>
              <li>• 領収書が必要な場合は、マイページからダウンロードできます。</li>
              {order.session.format === 'ONLINE' && (
                <li>• オンライン参加URLは確認メールに記載されています。</li>
              )}
            </>
          )}
          {order.status === 'PENDING' && order.paymentMethod === 'KONBINI' && (
            <>
              <li>• 払込票番号をメールでお送りしました。</li>
              <li>• 指定のコンビニエンスストアでお支払いください。</li>
              <li>• お支払い確認後、確認メールをお送りします。</li>
            </>
          )}
        </ul>
      </div>

      {/* アクションボタン */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/seminars"
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          セミナー一覧へ
        </Link>
        {order.status === 'PAID' && (
          <Link
            href="/account"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            マイページへ
          </Link>
        )}
      </div>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  )
}
