import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SessionForm from '@/components/admin/SessionForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

async function getSession(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      seminar: true
    }
  })

  return session
}

export default async function EditSessionPage({
  params
}: {
  params: Promise<{ seminarId: string; sessionId: string }>
}) {
  const { seminarId, sessionId } = await params
  const session = await getSession(sessionId)

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

      <h1 className="text-3xl font-bold text-gray-900 mb-2">開催回編集</h1>
      <p className="text-gray-600 mb-8">{session.seminar.title}</p>

      <SessionForm seminarId={seminarId} session={session} />
    </div>
  )
}
