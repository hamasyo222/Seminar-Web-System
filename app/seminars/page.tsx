import { prisma } from '@/lib/prisma'
import { formatJST } from '@/lib/date'
import Link from 'next/link'
import { MapPin, Calendar, Users, Tag } from 'lucide-react'
import { getSessionFormat } from '@/utils'
import type { SeminarWithDetails } from '@/types'

export const revalidate = 60 // 1分ごとに再検証

async function getSeminars(): Promise<SeminarWithDetails[]> {
  const seminars = await prisma.seminar.findMany({
    where: {
      status: 'PUBLISHED',
    },
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
    orderBy: {
      createdAt: 'desc',
    },
  })

  return seminars
}

export default async function SeminarsPage() {
  const seminars = await getSeminars()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">開催予定のセミナー</h1>
        <p className="mt-2 text-gray-600">
          興味のあるセミナーを見つけて、ぜひご参加ください。
        </p>
      </div>

      {seminars.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">現在、開催予定のセミナーはありません。</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {seminars.map((seminar) => (
            <Link
              key={seminar.id}
              href={`/seminars/${seminar.slug}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              {seminar.imageUrl && (
                <img
                  src={seminar.imageUrl}
                  alt={seminar.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {seminar.title}
                </h2>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {seminar.description}
                </p>

                {/* カテゴリとタグ */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {seminar.category}
                  </span>
                  {seminar.tags && JSON.parse(seminar.tags).slice(0, 2).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 次回開催情報 */}
                {seminar.sessions.length > 0 && (
                  <div className="border-t pt-4 space-y-2">
                    <div className="text-sm text-gray-600">
                      次回開催: {formatJST(seminar.sessions[0].startAt)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        {getSessionFormat(seminar.sessions[0].format)}
                      </span>
                      <span className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-1" />
                        残り{seminar.sessions[0].capacity - (seminar.sessions[0]._count?.orders || 0)}席
                      </span>
                    </div>
                    {seminar.sessions[0].ticketTypes.length > 0 && (
                      <div className="text-sm font-semibold text-blue-600">
                        ¥{seminar.sessions[0].ticketTypes[0].price.toLocaleString()}〜
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
