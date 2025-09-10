import SeminarForm from '@/components/admin/SeminarForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function NewSeminarPage() {
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

      <h1 className="text-3xl font-bold text-gray-900 mb-8">新規セミナー作成</h1>

      <SeminarForm />
    </div>
  )
}
