'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { 
  TrendingUp, Calendar, Users, CreditCard, Star, 
  Download, Filter, FileText, Eye, XCircle, CheckCircle, RefreshCw
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { Select, Input } from '@/components/ui/Input'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Loading'
import { toast } from 'react-hot-toast'

interface ReportData {
  revenue: {
    monthly: Array<{ month: string; amount: number }>
    byPaymentMethod: Array<{ method: string; amount: number; count: number }>
    topSeminars: Array<{ title: string; revenue: number; participants: number }>
  }
  participants: {
    monthly: Array<{ month: string; count: number }>
    bySeminar: Array<{ seminar: string; count: number }>
    retention: { firstTime: number; repeat: number }
  }
  satisfaction: {
    average: number
    distribution: Array<{ rating: number; count: number }>
    bySession: Array<{ session: string; average: number; count: number }>
    recommendations: number
  }
  operational: {
    checkInRate: number
    cancellationRate: number
    refundRate: number
    averageOrderValue: number
  }
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().setMonth(new Date().getMonth() - 3)), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })
  const [activeTab, setActiveTab] = useState('revenue')

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end
      })
      
      const response = await fetch(`/api/admin/reports?${params}`)
      const data = await response.json()

      if (data.success) {
        setReportData(data.data)
      } else {
        toast.error('レポートデータの取得に失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: string) => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
        type
      })
      
      const response = await fetch(`/api/admin/reports/export?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${type}-${format(new Date(), 'yyyyMMdd')}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('エクスポートが完了しました')
      }
    } catch (error) {
      toast.error('エクスポートに失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!reportData) {
    return null
  }

  const tabs = [
    {
      id: 'revenue',
      label: '売上分析',
      icon: <CreditCard className="w-4 h-4" />,
      content: <RevenueReport data={reportData.revenue} onExport={() => handleExport('revenue')} />
    },
    {
      id: 'participants',
      label: '参加者分析',
      icon: <Users className="w-4 h-4" />,
      content: <ParticipantsReport data={reportData.participants} onExport={() => handleExport('participants')} />
    },
    {
      id: 'satisfaction',
      label: '満足度分析',
      icon: <Star className="w-4 h-4" />,
      content: <SatisfactionReport data={reportData.satisfaction} onExport={() => handleExport('satisfaction')} />
    },
    {
      id: 'operational',
      label: '運営指標',
      icon: <TrendingUp className="w-4 h-4" />,
      content: <OperationalReport data={reportData.operational} />
    }
  ]

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">レポート・分析</h1>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="w-40"
          />
          <span className="text-gray-500">〜</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-40"
          />
          <Button variant="secondary" onClick={fetchReportData}>
            <Filter className="w-4 h-4 mr-2" />
            更新
          </Button>
        </div>
      </div>

      <Tabs
        tabs={tabs}
        defaultTab={activeTab}
        onTabChange={setActiveTab}
        variant="pills"
      />
    </div>
  )
}

// 売上レポートコンポーネント
function RevenueReport({ data, onExport }: { data: ReportData['revenue'], onExport: () => void }) {
  const totalRevenue = data.monthly.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">期間売上合計</p>
              <p className="text-2xl font-bold text-gray-900">
                ¥{totalRevenue.toLocaleString()}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">月平均売上</p>
              <p className="text-2xl font-bold text-gray-900">
                ¥{Math.round(totalRevenue / data.monthly.length).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Button onClick={onExport} fullWidth>
            <Download className="w-4 h-4 mr-2" />
            売上データをエクスポート
          </Button>
        </div>
      </div>

      {/* 月別売上グラフ */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">月別売上推移</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 支払方法別・トップセミナー */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">支払方法別売上</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.byPaymentMethod}
                dataKey="amount"
                nameKey="method"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry: any) => `${entry.method}: ¥${entry.amount.toLocaleString()}`}
              >
                {data.byPaymentMethod.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">売上上位セミナー</h3>
          <div className="space-y-3">
            {data.topSeminars.map((seminar, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {seminar.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {seminar.participants}名参加
                  </p>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  ¥{seminar.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 参加者レポートコンポーネント
function ParticipantsReport({ data, onExport }: { data: ReportData['participants'], onExport: () => void }) {
  const totalParticipants = data.monthly.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="space-y-6">
      {/* サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総参加者数</p>
              <p className="text-2xl font-bold text-gray-900">{totalParticipants}名</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">リピート率</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((data.retention.repeat / (data.retention.firstTime + data.retention.repeat)) * 100)}%
              </p>
            </div>
            <Eye className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Button onClick={onExport} fullWidth>
            <Download className="w-4 h-4 mr-2" />
            参加者データをエクスポート
          </Button>
        </div>
      </div>

      {/* 月別参加者数 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">月別参加者数推移</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* セミナー別参加者・リテンション */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">セミナー別参加者数</h3>
          <div className="space-y-3">
            {data.bySeminar.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <p className="text-sm text-gray-900 truncate flex-1">{item.seminar}</p>
                <Badge variant="primary">{item.count}名</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">参加者属性</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: '初回参加', value: data.retention.firstTime },
                  { name: 'リピーター', value: data.retention.repeat }
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                <Cell fill="#3B82F6" />
                <Cell fill="#10B981" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// 満足度レポートコンポーネント
function SatisfactionReport({ data, onExport }: { data: ReportData['satisfaction'], onExport: () => void }) {
  return (
    <div className="space-y-6">
      {/* サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">平均満足度</p>
              <div className="flex items-center mt-1">
                <span className="text-2xl font-bold text-gray-900">{data.average.toFixed(1)}</span>
                <div className="flex ml-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(data.average)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">推奨率</p>
              <p className="text-2xl font-bold text-gray-900">{data.recommendations}%</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Button onClick={onExport} fullWidth>
            <Download className="w-4 h-4 mr-2" />
            アンケートデータをエクスポート
          </Button>
        </div>
      </div>

      {/* 満足度分布 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">満足度分布</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.distribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rating" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* セッション別満足度 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">セッション別満足度</h3>
        <div className="space-y-3">
          {data.bySession.map((session, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{session.session}</p>
                <p className="text-xs text-gray-500">{session.count}件の回答</p>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-gray-900 mr-2">
                  {session.average.toFixed(1)}
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(session.average)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 運営指標レポートコンポーネント
function OperationalReport({ data }: { data: ReportData['operational'] }) {
  const metrics = [
    {
      label: 'チェックイン率',
      value: `${data.checkInRate}%`,
      icon: Users,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      label: 'キャンセル率',
      value: `${data.cancellationRate}%`,
      icon: XCircle,
      color: 'bg-red-100 text-red-800'
    },
    {
      label: '返金率',
      value: `${data.refundRate}%`,
      icon: CreditCard,
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      label: '平均注文額',
      value: `¥${data.averageOrderValue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-green-100 text-green-800'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
              </div>
              <div className={`p-3 rounded-full ${metric.color}`}>
                <Icon className="h-8 w-8" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
