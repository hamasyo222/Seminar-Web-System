import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatJST, formatDateRange } from '@/lib/date'
import { formatCurrency, getSessionFormat, parseJsonSafe } from '@/utils'
import Link from 'next/link'
import { Calendar, MapPin, Users, Clock, Tag, AlertCircle } from 'lucide-react'
import type { SeminarWithDetails, CancellationRule } from '@/types'

async function getSeminar(slug: string): Promise<SeminarWithDetails | null> {
  const seminar = await prisma.seminar.findUnique({
    where: { slug },
    include: {
      sessions: {
        where: {
          status: 'SCHEDULED',
          startAt: {
            gte: new Date(),
          },
        },
        include: {
          ticketTypes: {
            where: {
              isActive: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: {
          startAt: 'asc',
        },
      },
      cancellationPolicy: true,
    },
  })

  return seminar
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const seminar = await getSeminar(slug)
  
  if (!seminar) {
    return {
      title: 'セミナーが見つかりません',
    }
  }

  return {
    title: `${seminar.title} | セミナー管理システム`,
    description: seminar.description.substring(0, 160),
    openGraph: {
      title: seminar.title,
      description: seminar.description.substring(0, 160),
      images: seminar.imageUrl ? [seminar.imageUrl] : [],
    },
  }
}

export default async function SeminarDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const seminar = await getSeminar(slug)

  if (!seminar || seminar.status !== 'PUBLISHED') {
    notFound()
  }

  const tags = parseJsonSafe<string[]>(seminar.tags, [])
  const cancellationRules = seminar.cancellationPolicy
    ? parseJsonSafe<CancellationRule[]>(seminar.cancellationPolicy.rulesJson, [])
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {seminar.imageUrl && (
          <img
            src={seminar.imageUrl}
            alt={seminar.title}
            className="w-full h-64 md:h-96 object-cover"
          />
        )}
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {seminar.category}
            </span>
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
              >
                <Tag className="w-4 h-4 mr-1" />
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{seminar.title}</h1>
          
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{seminar.description}</p>
          </div>
        </div>
      </div>

      {/* 開催回一覧 */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">開催スケジュール</h2>
        
        {seminar.sessions.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">現在、開催予定はありません。</p>
          </div>
        ) : (
          <div className="space-y-6">
            {seminar.sessions.map((session) => {
              const remainingSeats = session.capacity - (session._count?.orders || 0)
              const isAlmostFull = remainingSeats <= 5
              
              return (
                <div key={session.id} className="bg-white rounded-lg shadow p-6">
                  <div className="md:flex md:items-start md:justify-between">
                    <div className="flex-1">
                      {session.title && (
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {session.title}
                        </h3>
                      )}
                      
                      <div className="space-y-2 text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                          {formatDateRange(session.startAt, session.endAt)}
                        </div>
                        
                        <div className="flex items-center">
                          <MapPin className="w-5 h-5 mr-2 text-gray-400" />
                          <span>{getSessionFormat(session.format)}</span>
                          {session.format !== 'ONLINE' && session.venue && (
                            <span className="ml-2">{session.venue}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center">
                          <Users className="w-5 h-5 mr-2 text-gray-400" />
                          <span>
                            定員 {session.capacity}名
                            {remainingSeats > 0 ? (
                              <span className={`ml-2 font-medium ${isAlmostFull ? 'text-orange-600' : 'text-green-600'}`}>
                                （残り{remainingSeats}席）
                              </span>
                            ) : (
                              <span className="ml-2 font-medium text-red-600">（満席）</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* チケット種別 */}
                      {session.ticketTypes.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-medium text-gray-900">チケット種別</h4>
                          {session.ticketTypes.map((ticket) => (
                            <div key={ticket.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                {ticket.name}
                                {ticket.description && (
                                  <span className="text-gray-500 ml-2">({ticket.description})</span>
                                )}
                              </span>
                              <span className="font-medium">{formatCurrency(ticket.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 md:mt-0 md:ml-6">
                      {remainingSeats > 0 ? (
                        <Link
                          href={`/checkout?session=${session.id}`}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          申し込む
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed"
                        >
                          満席
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* キャンセルポリシー */}
      {seminar.cancellationPolicy && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            キャンセルポリシー
          </h2>
          
          {seminar.cancellationPolicy.description && (
            <p className="text-gray-700 mb-4">{seminar.cancellationPolicy.description}</p>
          )}
          
          <div className="space-y-2">
            {cancellationRules.map((rule, index) => (
              <div key={index} className="flex items-center text-gray-700">
                <span className="w-24 font-medium">
                  {rule.daysBefore === 0 ? '当日' : `${rule.daysBefore}日前まで`}
                </span>
                <span>
                  {rule.refundRate === 0 
                    ? 'キャンセル不可' 
                    : `受講料の${rule.refundRate}%を返金`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: seminar.title,
            description: seminar.description,
            image: seminar.imageUrl,
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: seminar.sessions[0]?.format === 'ONLINE' 
              ? 'https://schema.org/OnlineEventAttendanceMode'
              : seminar.sessions[0]?.format === 'HYBRID'
              ? 'https://schema.org/MixedEventAttendanceMode'
              : 'https://schema.org/OfflineEventAttendanceMode',
            startDate: seminar.sessions[0]?.startAt,
            endDate: seminar.sessions[0]?.endAt,
            location: seminar.sessions[0]?.format !== 'ONLINE' && seminar.sessions[0]?.venue
              ? {
                  '@type': 'Place',
                  name: seminar.sessions[0].venue,
                  address: seminar.sessions[0].venueAddress || '',
                }
              : {
                  '@type': 'VirtualLocation',
                  url: seminar.sessions[0]?.onlineUrl || '',
                },
            offers: seminar.sessions[0]?.ticketTypes.map((ticket) => ({
              '@type': 'Offer',
              name: ticket.name,
              price: ticket.price,
              priceCurrency: 'JPY',
              availability: ticket.stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/SoldOut',
            })),
          }),
        }}
      />
    </div>
  )
}
