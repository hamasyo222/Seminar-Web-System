'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Camera, CheckCircle, XCircle, Users, QrCode } from 'lucide-react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { parseQRData } from '@/lib/qrcode'
import { toast } from 'react-hot-toast'
import type { SessionWithDetails } from '@/types'

// QRスキャナーコンポーネントの動的インポート（SSR回避）
const QrScanner = dynamic(() => import('react-qr-scanner'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 animate-pulse" />
})

interface CheckInResult {
  success: boolean
  participantName?: string
  ticketType?: string
  message?: string
}

export default function MobileCheckInPage() {
  const router = useRouter()
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [sessions, setSessions] = useState<SessionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0
  })

  useEffect(() => {
    fetchTodaySessions()
  }, [])

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionStats(selectedSessionId)
    }
  }, [selectedSessionId])

  const fetchTodaySessions = async () => {
    try {
      const response = await fetch('/api/admin/checkin/sessions')
      const data = await response.json()

      if (data.success) {
        setSessions(data.data)
        if (data.data.length > 0) {
          setSelectedSessionId(data.data[0].id)
        }
      }
    } catch (error) {
      toast.error('セッション情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchSessionStats = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/checkin/stats?sessionId=${sessionId}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Stats fetch error:', error)
    }
  }

  const handleScan = useCallback(async (data: any) => {
    if (!data || !selectedSessionId || scanning) return

    setScanning(true)
    setLastResult(null)

    try {
      // QRコードデータの解析
      const qrData = parseQRData(data.text || data)
      
      if (!qrData) {
        setLastResult({
          success: false,
          message: '無効なQRコードです'
        })
        return
      }

      // セッションIDの確認
      if (qrData.sessionId !== selectedSessionId) {
        setLastResult({
          success: false,
          message: '異なるセッションのQRコードです'
        })
        return
      }

      // チェックイン処理
      const response = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: qrData.id,
          sessionId: selectedSessionId,
          method: 'QR_CODE'
        })
      })

      const result = await response.json()

      if (result.success) {
        setLastResult({
          success: true,
          participantName: result.data.participantName,
          ticketType: result.data.ticketType,
          message: 'チェックイン完了'
        })
        
        // 統計を更新
        setStats(prev => ({
          ...prev,
          checkedIn: prev.checkedIn + 1
        }))
        
        toast.success(`${result.data.participantName}様のチェックインが完了しました`)
      } else {
        setLastResult({
          success: false,
          message: result.error || 'チェックインに失敗しました'
        })
        toast.error(result.error || 'チェックインに失敗しました')
      }
    } catch (error) {
      setLastResult({
        success: false,
        message: 'エラーが発生しました'
      })
      toast.error('エラーが発生しました')
    } finally {
      // 2秒後に次のスキャンを許可
      setTimeout(() => {
        setScanning(false)
      }, 2000)
    }
  }, [selectedSessionId, scanning])

  const handleError = (error: any) => {
    console.error('QR Scanner error:', error)
    toast.error('カメラへのアクセスに失敗しました')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  const selectedSession = sessions.find(s => s.id === selectedSessionId)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-gray-900">
              QRコードチェックイン
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/checkin')}
            >
              通常版
            </Button>
          </div>

          {/* セッション選択 */}
          {sessions.length > 0 && (
            <Select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              options={sessions.map(session => ({
                value: session.id,
                label: `${session.seminar.title} - ${new Date(session.startAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`
              }))}
            />
          )}
        </div>
      </div>

      {/* 統計情報 */}
      {selectedSession && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm text-blue-900">
                チェックイン済み: <strong>{stats.checkedIn}</strong> / {stats.total}
              </span>
            </div>
            <div className="text-sm text-blue-700">
              {Math.round((stats.checkedIn / stats.total) * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* QRスキャナー */}
      <div className="p-4">
        {sessions.length === 0 ? (
          <Alert variant="info">
            本日開催のセッションがありません
          </Alert>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-center justify-center">
                <QrCode className="w-6 h-6 text-gray-600 mr-2" />
                <span className="text-gray-700 font-medium">
                  参加者のQRコードをスキャン
                </span>
              </div>
            </div>

            <div className="relative">
              <QrScanner
                delay={300}
                onError={handleError}
                onScan={handleScan}
                style={{ width: '100%' }}
                constraints={{
                  video: {
                    facingMode: 'environment' // 背面カメラを使用
                  }
                }}
              />
              
              {scanning && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </div>
              )}
            </div>

            {/* スキャン結果 */}
            {lastResult && (
              <div className={`p-4 ${lastResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-start">
                  {lastResult.success ? (
                    <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${lastResult.success ? 'text-green-900' : 'text-red-900'}`}>
                      {lastResult.message}
                    </p>
                    {lastResult.participantName && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">{lastResult.participantName}</span>様
                        {lastResult.ticketType && (
                          <Badge variant="default" size="sm" className="ml-2">
                            {lastResult.ticketType}
                          </Badge>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 手動チェックイン */}
        <div className="mt-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => router.push('/admin/checkin')}
          >
            <Camera className="w-4 h-4 mr-2" />
            手動でチェックイン
          </Button>
        </div>
      </div>
    </div>
  )
}




