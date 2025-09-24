'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowRight, User } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import { toast } from 'react-hot-toast'

export default function AccountLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // メールアドレスのバリデーション
      if (!email || !email.includes('@')) {
        setError('有効なメールアドレスを入力してください')
        return
      }

      // 実際の実装では、メールアドレスの存在確認とワンタイムリンクの送信を行う
      // ここでは簡易的にlocalStorageに保存
      localStorage.setItem('userEmail', email.toLowerCase())
      
      toast.success('ログインしました')
      router.push('/account')
    } catch (error) {
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          マイページログイン
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          申込時のメールアドレスでログインしてください
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading || !email}
              >
                <span className="flex items-center justify-center">
                  ログイン
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Alert variant="info">
                <p className="text-sm">
                  セミナーお申込み時にご登録いただいたメールアドレスでログインできます。
                  初めての方は、まずセミナーにお申込みください。
                </p>
              </Alert>

              <div className="text-center">
                <Link
                  href="/seminars"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  セミナー一覧を見る
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <p className="text-xs text-gray-500 text-center">
              ※ セキュリティ保護のため、実際のシステムではメールアドレス確認後に
              ワンタイムURLをメールでお送りします。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

