import { prisma } from '@/lib/prisma'
import { formatJST } from '@/lib/date'
import { formatCurrency, getOrderStatus, getPaymentMethod } from '@/utils'
import Link from 'next/link'
import { Eye, RefreshCw, FileText, Download } from 'lucide-react'

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string
    sessionId?: string
    keyword?: string
    page?: string
  }>
}

async function getOrders(params: {
  status?: string
  sessionId?: string
  keyword?: string
  page?: number
}) {
  const { status, sessionId, keyword, page = 1 } = params
  const limit = 20
  const skip = (page - 1) * limit

  const where: any = {}

  if (status) {
    where.status = status
  }

  if (sessionId) {
    where.sessionId = sessionId
  }

  if (keyword) {
    where.OR = [
      { orderNumber: { contains: keyword } },
      { email: { contains: keyword } },
      { name: { contains: keyword } },
      { company: { contains: keyword } }
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        session: {
          include: {
            seminar: true
          }
        },
        participants: true,
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip
    }),
    prisma.order.count({ where })
  ])

  return {
    orders,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams
  const { orders, total, page, totalPages } = await getOrders({
    ...params,
    page: params.page ? parseInt(params.page) : 1
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">注文管理</h1>
        <form action="/api/admin/export/orders" method="GET">
          {params.status && <input type="hidden" name="status" value={params.status} />}
          {params.sessionId && <input type="hidden" name="sessionId" value={params.sessionId} />}
          {params.keyword && <input type="hidden" name="keyword" value={params.keyword} />}
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            CSVエクスポート
          </button>
        </form>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              name="status"
              defaultValue={params.status || ''}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">すべて</option>
              <option value="PENDING">支払待ち</option>
              <option value="PAID">支払済み</option>
              <option value="CANCELLED">キャンセル</option>
              <option value="REFUNDED">返金済み</option>
              <option value="EXPIRED">期限切れ</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              検索
            </label>
            <input
              type="text"
              name="keyword"
              defaultValue={params.keyword || ''}
              placeholder="注文番号、名前、メールアドレス"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              検索
            </button>
          </div>
        </form>
      </div>

      {/* 注文一覧 */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">注文が見つかりません</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注文番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  セミナー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申込者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  支払方法
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申込日時
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.participants.length}名
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.session.seminar.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatJST(order.session.startAt, 'MM/DD HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.name}</div>
                    <div className="text-sm text-gray-500">{order.email}</div>
                    {order.company && (
                      <div className="text-sm text-gray-500">{order.company}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.paymentMethod ? getPaymentMethod(order.paymentMethod) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatJST(order.createdAt, 'MM/DD HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {order.status === 'PAID' && (
                        <>
                          <button
                            className="text-purple-600 hover:text-purple-900"
                            title="返金"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900"
                            title="領収書"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                {page > 1 && (
                  <Link
                    href={`?page=${page - 1}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    前へ
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`?page=${page + 1}`}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    次へ
                  </Link>
                )}
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    全{total}件中 {(page - 1) * 20 + 1} から{' '}
                    {Math.min(page * 20, total)} 件を表示
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Link
                        key={p}
                        href={`?page=${p}`}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          p === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
