import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SeminarForm from '@/components/admin/SeminarForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

async function getSeminar(id: string) {
  const seminar = await prisma.seminar.findUnique({
    where: { id }
  })

  return seminar
}

export default async function EditSeminarPage({
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
          href="/admin/seminars"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          セミナー一覧に戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">セミナー編集</h1>

      <SeminarForm seminar={seminar} />
    </div>
  )
}
