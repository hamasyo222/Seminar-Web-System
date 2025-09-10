import { prisma } from '@/lib/prisma'
import { formatCurrency, getOrderStatus, getPaymentMethod } from '@/utils'
import { formatJST } from '@/lib/date'
import Link from 'next/link'
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Calendar,
  CreditCard,
  AlertCircle
} from 'lucide-react'

async function getDashboardStats() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // 基本統計
  const [
    totalSeminars,
    totalSessions,
    totalOrders,
    totalRevenue,
    todayOrders,
    todayRevenue
  ] = await Promise.all([
    prisma.seminar.count({ where: { status: 'PUBLISHED' } }),
    prisma.session.count({ where: { status: 'SCHEDULED' } }),
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.order.aggregate({
      where: { status: 'PAID' },
      _sum: { total: true }
    }),
    prisma.order.count({
      where: {
        status: 'PAID',
        paidAt: { gte: todayStart }
      }
    }),
    prisma.order.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: todayStart }
      },
      _sum: { total: true }
    })
  ])

  // 直近のセッション
  const upcomingSessions = await prisma.session.findMany({
    where: {
      status: 'SCHEDULED',
      startAt: { gte: now }
    },
    include: {
      seminar: true,
      _count: {
        select: { orders: true }
      }
    },
    orderBy: { startAt: 'asc' },
    take: 5
  })

  // 最近の注文
  const recentOrders = await prisma.order.findMany({
    where: { status: { in: ['PENDING', 'PAID'] } },
    include: {
      session: {
        include: { seminar: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  // 支払方法別の内訳
  const paymentMethodStats = await prisma.order.groupBy({
    by: ['paymentMethod'],
    where: { status: 'PAID' },
    _count: { _all: true },
    _sum: { total: true }
  })

  return {
    totalSeminars,
    totalSessions,
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    todayOrders,
    todayRevenue: todayRevenue._sum.total || 0,
    upcomingSessions,
    recentOrders,
    paymentMethodBreakdown: paymentMethodStats.map(stat => ({
      method: stat.paymentMethod || 'UNKNOWN',
      count: stat._count._all,
      amount: stat._sum.total || 0
    }))
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">ダッシュボード</h1>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">累計</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalSeminars}</p>
          <p className="text-sm text-gray-600 mt-1">公開中のセミナー</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">累計</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          <p className="text-sm text-gray-600 mt-1">支払済み注文</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">累計</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <p className="text-sm text-gray-600 mt-1">総売上</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">本日</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.todayRevenue)}
          </p>
          <p className="text-sm text-gray-600 mt-1">本日の売上（{stats.todayOrders}件）</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 直近のセッション */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">開催予定のセッション</h2>
          </div>
          <div className="p-6">
            {stats.upcomingSessions.length === 0 ? (
              <p className="text-gray-500">開催予定のセッションはありません</p>
            ) : (
              <div className="space-y-4">
                {stats.upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {session.seminar.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatJST(session.startAt)} • {session._count.orders}件の申込
                      </p>
                    </div>
                    <Link
                      href={`/admin/sessions/${session.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      詳細
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 最近の注文 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">最近の注文</h2>
          </div>
          <div className="p-6">
            {stats.recentOrders.length === 0 ? (
              <p className="text-gray-500">注文はありません</p>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.session.seminar.title} • {formatCurrency(order.total)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatJST(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'PAID' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getOrderStatus(order.status)}
                      </span>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        詳細
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 支払方法別統計 */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">支払方法別統計</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.paymentMethodBreakdown.map((stat) => (
              <div key={stat.method} className="text-center">
                <p className="text-sm text-gray-600">{getPaymentMethod(stat.method)}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.count}件
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatCurrency(stat.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
