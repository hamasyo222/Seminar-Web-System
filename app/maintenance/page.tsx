import { Wrench, Clock, Bell } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 animate-pulse">
            <Wrench className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="mt-6 text-4xl font-bold text-gray-900">
            メンテナンス中
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            現在、システムメンテナンスを実施しております。
            <br />
            ご不便をおかけして申し訳ございません。
          </p>
        </div>

        <div className="mt-10 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="flex items-start">
              <Clock className="flex-shrink-0 h-6 w-6 text-gray-400 mt-1" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">
                  メンテナンス予定時間
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  2025年1月1日 2:00 〜 5:00（予定）
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Bell className="flex-shrink-0 h-6 w-6 text-gray-400 mt-1" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">
                  メンテナンス内容
                </h3>
                <ul className="mt-1 text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>システムのアップデート</li>
                  <li>セキュリティの強化</li>
                  <li>パフォーマンスの改善</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                メンテナンス完了後、自動的にサービスをご利用いただけるようになります。
                ページを再読み込みしてアクセスをお試しください。
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            緊急のお問い合わせは
            <br />
            <a href="tel:0312345678" className="text-blue-600 hover:text-blue-800">
              03-1234-5678
            </a>
            {' '}までご連絡ください。
          </p>
        </div>
      </div>
    </div>
  )
}

