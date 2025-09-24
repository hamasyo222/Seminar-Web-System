import Link from 'next/link'
import { ShieldOff, Home, LogIn } from 'lucide-react'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-orange-100">
            <ShieldOff className="h-10 w-10 text-orange-600" />
          </div>
          <h1 className="mt-6 text-6xl font-bold text-gray-300">403</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            アクセスが拒否されました
          </h2>
          <p className="mt-4 text-base text-gray-600">
            申し訳ございません。このページへのアクセス権限がありません。
            <br />
            適切な権限でログインしてください。
          </p>
        </div>

        <div className="mt-10 space-y-3">
          <Link
            href="/login"
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            <LogIn className="w-5 h-5 mr-2" />
            ログインページへ
          </Link>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            <Home className="w-5 h-5 mr-2" />
            ホームに戻る
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            アクセス権限に関するお問い合わせは、
            <br />
            システム管理者までご連絡ください。
          </p>
        </div>
      </div>
    </div>
  )
}

