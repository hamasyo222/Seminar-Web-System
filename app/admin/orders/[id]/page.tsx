import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatJST } from '@/lib/date'
import { formatCurrency, getOrderStatus, getPaymentMethod, getAttendanceStatus } from '@/utils'
import Link from 'next/link'
import { ChevronLeft, RefreshCw, FileText, CheckCircle, XCircle } from 'lucide-react'
import type { OrderWithDetails } from '@/types'

async function getOrder(id: string): Promise<OrderWithDetails | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      session: {
        include: {
          seminar: true
        }
      },
      orderItems: {
        include: {
          ticketType: true
        }
      },
      participants: {
        include: {
          zoomRegistrations: true
        }
      },
      payments: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      refunds: {
        orderBy: {
          requestedAt: 'desc'
        }
      },
      invoices: {
        orderBy: {
          issuedAt: 'desc'
        }
      }
    }
  })

  return order as OrderWithDetails | null
}

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  const latestPayment = order.payments[0]

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          注文一覧に戻る
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">注文詳細</h1>
          <p className="mt-2 text-sm text-gray-600">注文番号: {order.orderNumber}</p>
        </div>
        
        <div className="flex space-x-4">
          {order.status === 'PAID' && (
            <>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <FileText className="w-4 h-4 mr-2" />
                領収書発行
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                返金処理
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左カラム：注文情報 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">基本情報</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                <dd className="mt-1">
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
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">支払方法</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.paymentMethod ? getPaymentMethod(order.paymentMethod) : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">申込日時</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatJST(order.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">支払完了日時</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.paidAt ? formatJST(order.paidAt) : '-'}
                </dd>
              </div>
            </dl>
          </div>

          {/* セミナー情報 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">セミナー情報</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">セミナー名</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.session.seminar.title}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">開催日時</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatJST(order.session.startAt)} 〜 {formatJST(order.session.endAt)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">会場</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.session.venue || 'オンライン'}
                </dd>
              </div>
            </dl>
          </div>

          {/* 申込内容 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">申込内容</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-gray-500">チケット種別</th>
                  <th className="text-right text-sm font-medium text-gray-500">数量</th>
                  <th className="text-right text-sm font-medium text-gray-500">単価</th>
                  <th className="text-right text-sm font-medium text-gray-500">小計</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.orderItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 text-sm text-gray-900">{item.ticketType.name}</td>
                    <td className="py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                    <td className="py-2 text-sm text-gray-900 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2 text-sm text-gray-900 text-right">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td colSpan={3} className="py-2 text-sm font-medium text-gray-900 text-right">
                    合計（税込）
                  </td>
                  <td className="py-2 text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(order.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 参加者情報 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">参加者情報</h2>
            <div className="space-y-4">
              {order.participants.map((participant, index) => (
                <div key={participant.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        参加者{index + 1}: {participant.name}
                        {participant.nameKana && (
                          <span className="ml-2 text-sm text-gray-500">
                            ({participant.nameKana})
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{participant.email}</p>
                      {participant.company && (
                        <p className="text-sm text-gray-600">{participant.company}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        participant.attendanceStatus === 'CHECKED_IN'
                          ? 'bg-green-100 text-green-800'
                          : participant.attendanceStatus === 'NO_SHOW'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {getAttendanceStatus(participant.attendanceStatus)}
                      </span>
                    </div>
                  </div>
                  {participant.checkedInAt && (
                    <p className="mt-2 text-xs text-gray-500">
                      受付: {formatJST(participant.checkedInAt)} by {participant.checkedInBy}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 決済履歴 */}
          {order.payments.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">決済履歴</h2>
              <div className="space-y-4">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {getPaymentMethod(payment.method)} - {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {payment.status} • {formatJST(payment.createdAt)}
                        </p>
                      </div>
                      {payment.status === 'CAPTURED' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {payment.status === 'FAILED' && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右カラム：申込者情報 */}
        <div className="space-y-6">
          {/* 申込者情報 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">申込者情報</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">名前</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.name}
                  {order.nameKana && (
                    <span className="ml-2 text-gray-500">({order.nameKana})</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.email}</dd>
              </div>
              {order.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.phone}</dd>
                </div>
              )}
              {order.company && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">会社名</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.company}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* 領収書情報 */}
          {order.invoiceRecipientType && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">領収書宛名</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">宛名種別</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {order.invoiceRecipientType === 'COMPANY' ? '法人' : '個人'}
                  </dd>
                </div>
                {order.invoiceCompanyName && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">会社名</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.invoiceCompanyName}</dd>
                  </div>
                )}
                {order.invoiceDepartment && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">部署</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.invoiceDepartment}</dd>
                  </div>
                )}
                {order.invoiceTitle && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">役職</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.invoiceTitle}</dd>
                  </div>
                )}
                {order.invoiceHonorific && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">敬称</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.invoiceHonorific}</dd>
                  </div>
                )}
                {order.invoiceNote && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">但し書き</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.invoiceNote}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* 備考 */}
          {order.notes && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">備考</h2>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
