'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatJST } from '@/lib/date'
import { toast } from 'react-hot-toast'
import { Search, CheckCircle, XCircle, Users, QrCode } from 'lucide-react'
import type { SessionWithDetails, ParticipantWithDetails } from '@/types'

interface CheckInPageProps {
  sessionId?: string
}

function CheckInContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [session, setSession] = useState<SessionWithDetails | null>(null)
  const [participants, setParticipants] = useState<ParticipantWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'not_checked' | 'checked'>('all')

  // セッション情報と参加者リストを取得
  useEffect(() => {
    if (!sessionId) return

    fetchSessionData()
  }, [sessionId])

  const fetchSessionData = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`/api/admin/checkin?session_id=${sessionId}`)
      const data = await response.json()

      if (data.success) {
        setSession(data.data.session)
        setParticipants(data.data.participants)
      } else {
        toast.error('データの取得に失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // チェックイン処理
  const handleCheckIn = async (participantId: string, isCheckedIn: boolean) => {
    try {
      const response = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          action: isCheckedIn ? 'undo' : 'checkin'
        })
      })

      const data = await response.json()

      if (data.success) {
        // ローカル状態を更新
        setParticipants(prev =>
          prev.map(p =>
            p.id === participantId
              ? {
                  ...p,
                  attendanceStatus: isCheckedIn ? 'NOT_CHECKED_IN' : 'CHECKED_IN',
                  checkedInAt: isCheckedIn ? null : new Date()
                }
              : p
          )
        )

        // 音を鳴らす
        if (!isCheckedIn) {
          const audio = new Audio('/sounds/checkin.mp3')
          audio.play().catch(() => {})
        }

        toast.success(isCheckedIn ? 'チェックインを取り消しました' : 'チェックインしました')
      } else {
        toast.error(data.error || '処理に失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    }
  }

  // フィルタリング
  const filteredParticipants = participants.filter(p => {
    // ステータスフィルター
    if (selectedFilter === 'checked' && p.attendanceStatus !== 'CHECKED_IN') return false
    if (selectedFilter === 'not_checked' && p.attendanceStatus === 'CHECKED_IN') return false

    // キーワード検索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      return (
        p.name.toLowerCase().includes(keyword) ||
        p.email.toLowerCase().includes(keyword) ||
        (p.company && p.company.toLowerCase().includes(keyword)) ||
        p.order.orderNumber.toLowerCase().includes(keyword)
      )
    }

    return true
  })

  // 統計情報
  const stats = {
    total: participants.length,
    checkedIn: participants.filter(p => p.attendanceStatus === 'CHECKED_IN').length,
    notCheckedIn: participants.filter(p => p.attendanceStatus === 'NOT_CHECKED_IN').length
  }

  if (!sessionId) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">受付チェック</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">セッションを選択してください</p>
          <a
            href="/admin/sessions"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            セッション一覧へ
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="bg-white rounded-lg shadow p-8">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">セッション情報が見つかりません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">受付チェック</h1>
        <div className="mt-2">
          <p className="text-lg text-gray-700">{session.seminar.title}</p>
          <p className="text-sm text-gray-500">
            {formatJST(session.startAt)} • {session.venue || 'オンライン'}
          </p>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総参加者数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">受付済み</p>
              <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">未受付</p>
              <p className="text-2xl font-bold text-gray-600">{stats.notCheckedIn}</p>
            </div>
            <XCircle className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="名前、メール、会社名、注文番号で検索"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setSelectedFilter('not_checked')}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedFilter === 'not_checked'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              未受付
            </button>
            <button
              onClick={() => setSelectedFilter('checked')}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedFilter === 'checked'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              受付済み
            </button>
          </div>
        </div>
      </div>

      {/* 参加者リスト */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredParticipants.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">該当する参加者が見つかりません</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredParticipants.map((participant) => {
              const isCheckedIn = participant.attendanceStatus === 'CHECKED_IN'

              return (
                <div
                  key={participant.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    isCheckedIn ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {participant.name}
                        </h3>
                        {participant.nameKana && (
                          <span className="ml-2 text-sm text-gray-500">
                            ({participant.nameKana})
                          </span>
                        )}
                        {isCheckedIn && (
                          <CheckCircle className="ml-2 w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <span>{participant.email}</span>
                        {participant.company && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{participant.company}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        注文番号: {participant.order.orderNumber}
                        {participant.checkedInAt && (
                          <>
                            <span className="mx-2">•</span>
                            <span>
                              受付: {formatJST(participant.checkedInAt, 'HH:mm')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handleCheckIn(participant.id, isCheckedIn)}
                        className={`px-6 py-3 rounded-md font-medium transition-colors ${
                          isCheckedIn
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isCheckedIn ? 'チェックイン取消' : 'チェックイン'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckInPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="bg-white rounded-lg shadow p-8">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <CheckInContent />
    </Suspense>
  )
}
