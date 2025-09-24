'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatJST } from '@/lib/date'
import { getAttendanceStatus } from '@/utils'
import { Search, Download, Mail, User, CheckCircle, XCircle } from 'lucide-react'
import { ParticipantWithDetails } from '@/types'

export default function ParticipantsPage() {
  const searchParams = useSearchParams()
  const [participants, setParticipants] = useState<ParticipantWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSession, setFilterSession] = useState(searchParams.get('session_id') || '')
  const [filterStatus, setFilterStatus] = useState('')
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    fetchSessions()
    fetchParticipants()
  }, [filterSession, filterStatus])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions')
      if (!res.ok) throw new Error('セッション情報の取得に失敗しました')
      
      const json = await res.json()
      const sessionList = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : []
      setSessions(sessionList)
    } catch (error) {
      toast.error('セッション情報の取得に失敗しました')
    }
  }

  const fetchParticipants = async () => {
    try {
      const params = new URLSearchParams()
      if (filterSession) params.append('session_id', filterSession)
      if (filterStatus) params.append('status', filterStatus)
      
      const res = await fetch(`/api/admin/participants?${params}`)
      if (!res.ok) throw new Error('参加者情報の取得に失敗しました')
      
      const data = await res.json()
      setParticipants(data)
    } catch (error) {
      toast.error('参加者情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (filterSession) params.append('session_id', filterSession)
      if (filterStatus) params.append('status', filterStatus)
      
      const res = await fetch(`/api/admin/export/participants?${params}`)
      if (!res.ok) throw new Error('エクスポートに失敗しました')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `participants_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('参加者リストをエクスポートしました')
    } catch (error) {
      toast.error('エクスポートに失敗しました')
    }
  }

  const handleSendEmail = async (participantId: string) => {
    // TODO: メール送信機能の実装
    toast('メール送信機能は実装中です', {
      icon: 'ℹ️',
    })
  }

  const filteredParticipants = participants.filter(participant => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      participant.name.toLowerCase().includes(searchLower) ||
      participant.email.toLowerCase().includes(searchLower) ||
      (participant.company && participant.company.toLowerCase().includes(searchLower))
    )
  })

  if (loading) {
    return <div className="flex justify-center items-center h-64">読み込み中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">参加者管理</h1>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Download className="w-4 h-4 mr-2" />
          CSVエクスポート
        </button>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              検索
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="名前、メール、会社名で検索"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              セッション
            </label>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">すべて</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.seminar.title} - {formatJST(session.startAt)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              受付状態
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">すべて</option>
              <option value="NOT_CHECKED_IN">未受付</option>
              <option value="CHECKED_IN">受付済み</option>
              <option value="NO_SHOW">欠席</option>
            </select>
          </div>
        </div>
      </div>

      {/* 参加者一覧 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                参加者情報
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                セミナー情報
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                注文番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                受付状態
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredParticipants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  参加者が見つかりません
                </td>
              </tr>
            ) : (
              filteredParticipants.map((participant) => (
                <tr key={participant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <User className="w-10 h-10 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {participant.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {participant.email}
                        </div>
                        {participant.company && (
                          <div className="text-sm text-gray-500">
                            {participant.company}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {participant.order.session.seminar.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatJST(participant.order.session.startAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {participant.order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      participant.attendanceStatus === 'CHECKED_IN' 
                        ? 'bg-green-100 text-green-800'
                        : participant.attendanceStatus === 'NO_SHOW'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {participant.attendanceStatus === 'CHECKED_IN' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {participant.attendanceStatus === 'NO_SHOW' && <XCircle className="w-3 h-3 mr-1" />}
                      {getAttendanceStatus(participant.attendanceStatus)}
                    </span>
                    {participant.checkedInAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formatJST(participant.checkedInAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleSendEmail(participant.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Mail className="w-5 h-5" />
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
