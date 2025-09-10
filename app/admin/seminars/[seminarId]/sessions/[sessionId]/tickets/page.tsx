import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/utils'
import Link from 'next/link'
import { ChevronLeft, Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react'

async function getSessionWithTickets(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      seminar: true,
      ticketTypes: {
        orderBy: {
          sortOrder: 'asc'
        }
      },
      _count: {
        select: {
          orders: true
        }
      }
    }
  })

  return session
}

export default async function TicketsPage({
  params
}: {
  params: Promise<{ seminarId: string; sessionId: string }>
}) {
  const { seminarId, sessionId } = await params
  const session = await getSessionWithTickets(sessionId)

  if (!session || session.seminarId !== seminarId) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/seminars/${seminarId}/sessions`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          開催回一覧に戻る
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">チケット管理</h1>
          <p className="mt-2 text-gray-600">
            {session.seminar.title} - {session.title || '開催回'}
          </p>
        </div>
        <Link
          href={`/admin/seminars/${seminarId}/sessions/${sessionId}/tickets/new`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          チケット種別を追加
        </Link>
      </div>

      {session.ticketTypes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">チケット種別が登録されていません</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  チケット名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  価格（税込）
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  税率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  在庫
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  購入上限
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  販売期間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {session.ticketTypes.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.name}
                      </div>
                      {ticket.description && (
                        <div className="text-sm text-gray-500">
                          {ticket.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(ticket.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticket.taxRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticket.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticket.maxPerOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticket.salesStartAt || ticket.salesEndAt ? (
                      <div>
                        {ticket.salesStartAt && (
                          <div>開始: {new Date(ticket.salesStartAt).toLocaleDateString('ja-JP')}</div>
                        )}
                        {ticket.salesEndAt && (
                          <div>終了: {new Date(ticket.salesEndAt).toLocaleDateString('ja-JP')}</div>
                        )}
                      </div>
                    ) : (
                      '制限なし'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className={`inline-flex items-center ${
                        ticket.isActive ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {ticket.isActive ? (
                        <>
                          <ToggleRight className="w-8 h-8" />
                          <span className="ml-1 text-sm">販売中</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-8 h-8" />
                          <span className="ml-1 text-sm">停止</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/seminars/${seminarId}/sessions/${sessionId}/tickets/${ticket.id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 統計情報 */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">販売状況</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">総在庫数</p>
            <p className="text-2xl font-bold text-gray-900">
              {session.ticketTypes.reduce((sum, t) => sum + t.stock, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">申込数</p>
            <p className="text-2xl font-bold text-gray-900">
              {session._count.orders}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">残席数</p>
            <p className="text-2xl font-bold text-gray-900">
              {session.capacity - session._count.orders}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
