'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Star, Send, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import { toast } from 'react-hot-toast'
import type { OrderWithDetails } from '@/types'

interface SurveyFormData {
  rating: number
  satisfactionLevel: string
  content: string
  presentation: string
  organization: string
  wouldRecommend: boolean
  improvements: string
  futureTopics: string
  otherComments: string
}

const ratingLabels = ['非常に不満', '不満', '普通', '満足', '非常に満足']
const aspectLabels = ['非常に悪い', '悪い', '普通', '良い', '非常に良い']

function SurveyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [hoveredRating, setHoveredRating] = useState(0)
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SurveyFormData>({
    defaultValues: {
      rating: 0,
      satisfactionLevel: '',
      content: '',
      presentation: '',
      organization: '',
      wouldRecommend: false,
      improvements: '',
      futureTopics: '',
      otherComments: ''
    }
  })

  const watchRating = watch('rating')

  useEffect(() => {
    if (!orderNumber) {
      toast.error('注文番号が指定されていません')
      router.push('/')
      return
    }
    fetchOrder()
  }, [orderNumber])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/survey/order?orderNumber=${orderNumber}`)
      const data = await response.json()

      if (data.success) {
        setOrder(data.data)
      } else {
        toast.error('注文情報が見つかりません')
        router.push('/')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: SurveyFormData) => {
    if (!order) return

    try {
      const response = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          sessionId: order.sessionId,
          ...data
        })
      })

      const result = await response.json()

      if (result.success) {
        setSubmitted(true)
        toast.success('アンケートを送信しました')
      } else {
        toast.error('送信に失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ありがとうございました！
          </h2>
          <p className="text-gray-600 mb-6">
            貴重なご意見をいただき、誠にありがとうございます。
            今後のセミナー運営の参考にさせていただきます。
          </p>
          <Button onClick={() => router.push('/seminars')}>
            セミナー一覧へ
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            セミナーアンケート
          </h1>
          <p className="text-gray-600 mb-6">
            「{order.session.seminar.title}」にご参加いただきありがとうございました。
            今後のセミナー運営の参考にさせていただきたく、アンケートにご協力をお願いいたします。
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 総合評価 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                1. セミナーの総合評価をお聞かせください <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('rating', value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        value <= (hoveredRating || watchRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm text-gray-600">
                  {watchRating > 0 && ratingLabels[watchRating - 1]}
                </span>
              </div>
              <input type="hidden" {...register('rating', { required: '評価を選択してください' })} />
              {errors.rating && (
                <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
              )}
            </div>

            {/* 満足度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                2. セミナーのどの点に満足されましたか？
              </label>
              <select
                {...register('satisfactionLevel')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                <option value="content">内容の充実度</option>
                <option value="speaker">講師の説明</option>
                <option value="materials">資料の分かりやすさ</option>
                <option value="interaction">質疑応答・交流</option>
                <option value="overall">全体的な構成</option>
              </select>
            </div>

            {/* 各項目の評価 */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">
                3. 以下の項目について評価をお聞かせください
              </p>
              
              {[
                { key: 'content', label: '内容の充実度' },
                { key: 'presentation', label: '講師のプレゼンテーション' },
                { key: 'organization', label: '運営・進行' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{label}</span>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label key={value} className="flex items-center">
                        <input
                          type="radio"
                          value={value}
                          {...register(key as keyof SurveyFormData)}
                          className="sr-only"
                        />
                        <span
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                            watch(key as keyof SurveyFormData) === value.toString()
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {value}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 推薦意向 */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('wouldRecommend')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  このセミナーを他の方にお勧めしたいと思いますか？
                </span>
              </label>
            </div>

            {/* 改善点 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                4. 改善してほしい点があればお聞かせください
              </label>
              <Textarea
                {...register('improvements')}
                rows={4}
                placeholder="例：時間配分、資料の内容、会場の環境など"
              />
            </div>

            {/* 今後のテーマ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                5. 今後開催してほしいセミナーのテーマがあればお聞かせください
              </label>
              <Textarea
                {...register('futureTopics')}
                rows={3}
                placeholder="興味のあるテーマや分野をお書きください"
              />
            </div>

            {/* その他コメント */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                6. その他、ご意見・ご感想をお聞かせください
              </label>
              <Textarea
                {...register('otherComments')}
                rows={4}
                placeholder="自由にご記入ください"
              />
            </div>

            {/* 送信ボタン */}
            <div className="pt-6">
              <Button type="submit" fullWidth size="lg">
                <Send className="w-5 h-5 mr-2" />
                アンケートを送信
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function SurveyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}

export default function SurveyPage() {
  return (
    <Suspense fallback={<SurveyFallback />}>
      <SurveyContent />
    </Suspense>
  )
}



