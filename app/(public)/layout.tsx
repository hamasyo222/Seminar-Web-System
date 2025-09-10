import Link from 'next/link'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/seminars" className="text-xl font-bold text-gray-900">
              セミナー管理システム
            </Link>
            <nav className="flex space-x-8">
              <Link
                href="/seminars"
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                セミナー一覧
              </Link>
              <Link
                href="/account"
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                マイページ
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">
        {children}
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">サービスについて</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-gray-300 hover:text-white">
                    利用規約
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-300 hover:text-white">
                    プライバシーポリシー
                  </Link>
                </li>
                <li>
                  <Link href="/law" className="text-gray-300 hover:text-white">
                    特定商取引法に基づく表記
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">お問い合わせ</h3>
              <p className="text-gray-300">
                Email: support@example.com<br />
                Tel: 03-1234-5678<br />
                営業時間: 平日 9:00-18:00
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">運営会社</h3>
              <p className="text-gray-300">
                株式会社サンプル<br />
                〒150-0001<br />
                東京都渋谷区〇〇1-2-3
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 セミナー管理システム. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
