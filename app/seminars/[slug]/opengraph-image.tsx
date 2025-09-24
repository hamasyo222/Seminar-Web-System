import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'
import { formatJST } from '@/lib/date'

export const runtime = 'edge'

export const alt = 'セミナー詳細'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
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
        orderBy: {
          startAt: 'asc',
        },
        take: 1,
      },
    },
  })

  if (!seminar) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: 'linear-gradient(to bottom right, #2563eb, #1e40af)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          セミナーが見つかりません
        </div>
      ),
      {
        ...size,
      }
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 60,
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
            color: '#2563eb',
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ marginLeft: 20, fontSize: 24, fontWeight: 'bold' }}>
            セミナー管理システム
          </span>
        </div>

        {/* カテゴリ */}
        <div
          style={{
            display: 'flex',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              background: '#dbeafe',
              color: '#1e40af',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 20,
            }}
          >
            {seminar.category}
          </span>
        </div>

        {/* タイトル */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: 30,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {seminar.title}
        </div>

        {/* 説明 */}
        <div
          style={{
            fontSize: 24,
            color: '#6b7280',
            marginBottom: 'auto',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {seminar.description}
        </div>

        {/* 開催情報 */}
        {seminar.sessions[0] && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 40,
              fontSize: 24,
              color: '#374151',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="4"
                width="18"
                height="18"
                rx="2"
                ry="2"
                stroke="#374151"
                strokeWidth="2"
              />
              <line
                x1="16"
                y1="2"
                x2="16"
                y2="6"
                stroke="#374151"
                strokeWidth="2"
              />
              <line
                x1="8"
                y1="2"
                x2="8"
                y2="6"
                stroke="#374151"
                strokeWidth="2"
              />
              <line
                x1="3"
                y1="10"
                x2="21"
                y2="10"
                stroke="#374151"
                strokeWidth="2"
              />
            </svg>
            <span style={{ marginLeft: 10 }}>
              {formatJST(seminar.sessions[0].startAt, 'yyyy年MM月dd日 HH:mm')}〜
            </span>
          </div>
        )}
      </div>
    ),
    {
      ...size,
    }
  )
}

