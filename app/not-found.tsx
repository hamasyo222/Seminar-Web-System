"use client"

import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            ページが見つかりません
          </h2>
          <p className="mt-4 text-base text-gray-600">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
        </div>

        <div className="mt-10 space-y-3">
          <Link
            href="/"
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            <Home className="w-5 h-5 mr-2" />
            ホームに戻る
          </Link>
          
          <Link
            href="/seminars"
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            <Search className="w-5 h-5 mr-2" />
            セミナーを探す
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center px-4 py-3 text-base font-medium text-blue-600 hover:text-blue-800 transition duration-150 ease-in-out"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            前のページに戻る
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            問題が解決しない場合は、
            <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-800">
              サポート
            </a>
            までご連絡ください。
          </p>
        </div>
      </div>
    </div>
  )
}
