'use client'

import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300">500</h1>
              <h2 className="mt-4 text-3xl font-bold text-gray-900">
                システムエラー
              </h2>
              <p className="mt-4 text-base text-gray-600">
                申し訳ございません。システムに問題が発生しました。
                <br />
                しばらくしてから再度お試しください。
              </p>
            </div>

            <div className="mt-10">
              <button
                onClick={reset}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                再読み込み
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                問題が解決しない場合は、システム管理者にご連絡ください。
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

