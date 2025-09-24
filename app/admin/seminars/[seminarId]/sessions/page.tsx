import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatJST, formatDateRange } from '@/lib/date'
import { getSessionFormat } from '@/utils'
import Link from 'next/link'
import { ChevronLeft, Plus, Edit, Trash2, Users, Ticket } from 'lucide-react'

async function getSeminarWithSessions(seminarId: string) {
  const seminar = await prisma.seminar.findUnique({
    where: { id: seminarId },
    include: {
      sessions: {
        include: {
          ticketTypes: {
            orderBy: {
              sortOrder: 'asc'
            }
          },
          orders: {
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: {
          startAt: 'desc'
        }
      }
    }
  })

  if (!seminar) {
    return null
  }

  return {
    ...seminar,
    sessions: seminar.sessions.map((session) => ({
      ...session,
      confirmedOrdersCount: session.orders?.filter(order => order.status === 'PAID').length || 0,
    }))
  }
}

export default async function SessionsPage({
  params
}: {
  params: Promise<{ seminarId: string }>
}) {
  const { seminarId } = await params
  const seminar = await getSeminarWithSessions(seminarId)

  if (!seminar) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/seminars"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          セミナー一覧に戻る
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">開催回管理</h1>
          <p className="mt-2 text-gray-600">{seminar.title}</p>
        </div>
        <Link
          href={`/admin/seminars/${seminarId}/sessions/new`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          開催回を追加
        </Link>
      </div>

      {seminar.sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">開催回が登録されていません</p>
        </div>
      ) : (
        <div className="space-y-6">
          {seminar.sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {session.title || formatDateRange(session.startAt, session.endAt)}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>
                        開催日時: {formatDateRange(session.startAt, session.endAt)}
                      </p>
                      <p>
                        形式: {getSessionFormat(session.format)}
                        {session.venue && ` • 会場: ${session.venue}`}
                      </p>
                      <p>
                        定員: {session.capacity}名（決済完了: {session.confirmedOrdersCount ?? 0}件 / 申込: {session._count.orders}件）
                      </p>
                      {session.zoomType && (
                        <p>
                          Zoom: {session.zoomType === 'WEBINAR' ? 'ウェビナー' : 'ミーティング'}
                          （ID: {session.zoomId}）
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/seminars/${seminarId}/sessions/${session.id}/edit`}
                      className="p-2 text-gray-600 hover:text-gray-900"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <Link
                      href={`/admin/checkin?session_id=${session.id}`}
                      className="p-2 text-blue-600 hover:text-blue-900"
                    >
                      <Users className="w-5 h-5" />
                    </Link>
                    <button
                      className="p-2 text-red-600 hover:text-red-900"
                      onClick={() => {
                        // TODO: 削除処理
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* チケット種別 */}
                {session.ticketTypes.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Ticket className="w-4 h-4 mr-2" />
                        チケット種別
                      </h4>
                      <Link
                        href={`/admin/seminars/${seminarId}/sessions/${session.id}/tickets`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        管理
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {session.ticketTypes.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex justify-between items-center text-sm"
                        >
                          <div>
                            <span className="font-medium">{ticket.name}</span>
                            {ticket.description && (
                              <span className="text-gray-500 ml-2">
                                ({ticket.description})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span>¥{ticket.price.toLocaleString()}</span>
                            <span className="text-gray-500">
                              在庫: {ticket.stock}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              ticket.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {ticket.isActive ? '販売中' : '停止'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
