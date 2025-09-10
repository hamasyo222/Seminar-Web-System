import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SessionForm from '@/components/admin/SessionForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

async function getSeminar(id: string) {
  const seminar = await prisma.seminar.findUnique({
    where: { id }
  })

  return seminar
}

export default async function NewSessionPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const seminar = await getSeminar(id)

  if (!seminar) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/seminars/${id}/sessions`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          開催回一覧に戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">新規開催回作成</h1>
      <p className="text-gray-600 mb-8">{seminar.title}</p>

      <SessionForm seminarId={id} />
    </div>
  )
}
