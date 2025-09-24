'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーをログサービスに送信
    console.error('Application error:', error)
    
    // 本番環境では外部のエラートラッキングサービスに送信
    if (process.env.NODE_ENV === 'production') {
      // TODO: Sentryなどのエラートラッキングサービスに送信
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            エラーが発生しました
          </h2>
          <p className="mt-4 text-base text-gray-600">
            申し訳ございません。予期しないエラーが発生しました。
            <br />
            問題が解決しない場合は、サポートまでご連絡ください。
          </p>
          
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md text-left">
              <p className="text-sm font-mono text-gray-700">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-10 space-y-3">
          <button
            onClick={reset}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            もう一度試す
          </button>
          
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
            エラーが続く場合は、
            <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-800">
              support@example.com
            </a>
            までご連絡ください。
          </p>
        </div>
      </div>
    </div>
  )
}

