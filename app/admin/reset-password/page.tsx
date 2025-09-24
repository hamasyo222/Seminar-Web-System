'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { toast } from 'react-hot-toast'

const resetRequestSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください')
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'トークンが必要です'),
  password: z.string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードは大文字、小文字、数字を含む必要があります'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword']
})

type ResetRequestForm = z.infer<typeof resetRequestSchema>
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'request' | 'reset'>('request')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const requestForm = useForm<ResetRequestForm>({
    resolver: zodResolver(resetRequestSchema)
  })

  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') || '' : ''
    }
  })

  const handleResetRequest = async (data: ResetRequestForm) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
      } else {
        toast.error(result.error || 'リセットリクエストに失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (data: ResetPasswordForm) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('パスワードがリセットされました')
        router.push('/login')
      } else {
        toast.error(result.error || 'パスワードリセットに失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // URLにトークンがある場合はリセットモードに
  if (typeof window !== 'undefined' && window.location.search.includes('token=') && mode === 'request') {
    setMode('reset')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          パスワードリセット
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {success ? (
            <Alert variant="success">
              <h3 className="text-sm font-medium text-green-800 mb-2">
                リセットメールを送信しました
              </h3>
              <p className="text-sm text-green-700">
                パスワードリセットの手順をメールでお送りしました。
                メールボックスをご確認ください。
              </p>
              <div className="mt-4">
                <Link
                  href="/login"
                  className="text-sm text-green-600 hover:text-green-800 font-medium"
                >
                  ログインページに戻る
                </Link>
              </div>
            </Alert>
          ) : mode === 'request' ? (
            <form onSubmit={requestForm.handleSubmit(handleResetRequest)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...requestForm.register('email')}
                    type="email"
                    autoComplete="email"
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="admin@example.com"
                  />
                </div>
                {requestForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {requestForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  リセットメールを送信
                </Button>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  ログインに戻る
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-6">
              <input type="hidden" {...resetForm.register('token')} />

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  新しいパスワード
                </label>
                <div className="mt-1">
                  <input
                    {...resetForm.register('password')}
                    type="password"
                    autoComplete="new-password"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                {resetForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {resetForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  パスワード確認
                </label>
                <div className="mt-1">
                  <input
                    {...resetForm.register('confirmPassword')}
                    type="password"
                    autoComplete="new-password"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                {resetForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {resetForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  パスワードをリセット
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}




