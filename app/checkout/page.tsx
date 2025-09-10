'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { orderFormSchema } from '@/lib/validations'
import { formatCurrency, getPaymentMethod } from '@/utils'
import { toast } from 'react-hot-toast'
import { AlertCircle, Plus, Trash2 } from 'lucide-react'
import type { SessionWithDetails, CancellationRule } from '@/types'

type OrderFormData = z.infer<typeof orderFormSchema>

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const [session, setSession] = useState<SessionWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      sessionId: sessionId || '',
      tickets: [],
      participants: [],
      paymentMethod: 'CREDIT_CARD',
      agreeToTerms: false,
      agreeToCancellationPolicy: false,
    },
  })

  const watchTickets = watch('tickets')
  const watchParticipants = watch('participants')
  const watchInvoiceType = watch('invoiceRecipientType')

  // セッション情報の取得
  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    fetch(`/api/sessions/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSession(data.data)
          setValue('sessionId', sessionId)
        } else {
          toast.error('セッション情報の取得に失敗しました')
        }
      })
      .catch(() => {
        toast.error('エラーが発生しました')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [sessionId, setValue])

  // 参加者数とチケット数の同期
  useEffect(() => {
    const totalTickets = watchTickets.reduce((sum, ticket) => sum + ticket.quantity, 0)
    const currentParticipants = watchParticipants.length

    if (totalTickets > currentParticipants) {
      // 参加者を追加
      const newParticipants = [...watchParticipants]
      for (let i = currentParticipants; i < totalTickets; i++) {
        newParticipants.push({
          email: '',
          name: '',
          nameKana: '',
          company: '',
        })
      }
      setValue('participants', newParticipants)
    } else if (totalTickets < currentParticipants) {
      // 参加者を削除
      setValue('participants', watchParticipants.slice(0, totalTickets))
    }
  }, [watchTickets, watchParticipants, setValue])

  const addTicket = (ticketTypeId: string) => {
    const existing = watchTickets.find((t) => t.ticketTypeId === ticketTypeId)
    if (existing) {
      setValue(
        'tickets',
        watchTickets.map((t) =>
          t.ticketTypeId === ticketTypeId
            ? { ...t, quantity: t.quantity + 1 }
            : t
        )
      )
    } else {
      setValue('tickets', [...watchTickets, { ticketTypeId, quantity: 1 }])
    }
  }

  const removeTicket = (ticketTypeId: string) => {
    const existing = watchTickets.find((t) => t.ticketTypeId === ticketTypeId)
    if (existing && existing.quantity > 1) {
      setValue(
        'tickets',
        watchTickets.map((t) =>
          t.ticketTypeId === ticketTypeId
            ? { ...t, quantity: t.quantity - 1 }
            : t
        )
      )
    } else {
      setValue(
        'tickets',
        watchTickets.filter((t) => t.ticketTypeId !== ticketTypeId)
      )
    }
  }

  const calculateTotal = () => {
    if (!session) return 0
    return watchTickets.reduce((sum, ticket) => {
      const ticketType = session.ticketTypes.find((t) => t.id === ticket.ticketTypeId)
      return sum + (ticketType?.price || 0) * ticket.quantity
    }, 0)
  }

  const onSubmit = async (data: OrderFormData) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        // KOMOJU決済ページへリダイレクト
        window.location.href = result.data.paymentUrl
      } else {
        toast.error(result.error || '申込処理に失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">セッション情報が見つかりません。</p>
        </div>
      </div>
    )
  }

  const cancellationRules: CancellationRule[] = session.seminar.cancellationPolicy
    ? JSON.parse(session.seminar.cancellationPolicy.rulesJson)
    : []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">申込フォーム</h1>

      {/* セッション情報 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">{session.seminar.title}</h2>
        <div className="text-gray-600 space-y-1">
          <p>開催日時: {new Date(session.startAt).toLocaleString('ja-JP')}</p>
          <p>会場: {session.venue || 'オンライン'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* チケット選択 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">チケット選択</h3>
          <div className="space-y-4">
            {session.ticketTypes.map((ticketType) => {
              const selected = watchTickets.find((t) => t.ticketTypeId === ticketType.id)
              return (
                <div
                  key={ticketType.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{ticketType.name}</h4>
                    {ticketType.description && (
                      <p className="text-sm text-gray-600">{ticketType.description}</p>
                    )}
                    <p className="text-lg font-semibold mt-1">
                      {formatCurrency(ticketType.price)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => removeTicket(ticketType.id)}
                      className="p-1 rounded-full hover:bg-gray-100"
                      disabled={!selected}
                    >
                      <Trash2 className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {selected?.quantity || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => addTicket(ticketType.id)}
                      className="p-1 rounded-full hover:bg-gray-100"
                      disabled={selected && selected.quantity >= ticketType.maxPerOrder}
                    >
                      <Plus className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {errors.tickets && (
            <p className="mt-2 text-sm text-red-600">{errors.tickets.message}</p>
          )}
        </div>

        {/* 申込者情報 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">申込者情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                フリガナ
              </label>
              <input
                type="text"
                {...register('nameKana')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.nameKana && (
                <p className="mt-1 text-sm text-red-600">{errors.nameKana.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話番号
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会社名
              </label>
              <input
                type="text"
                {...register('company')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 参加者情報 */}
        {watchParticipants.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">参加者情報</h3>
            <div className="space-y-6">
              {watchParticipants.map((_, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">参加者 {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        お名前 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register(`participants.${index}.name`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.participants?.[index]?.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.participants[index]?.name?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        フリガナ
                      </label>
                      <input
                        type="text"
                        {...register(`participants.${index}.nameKana`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        メールアドレス <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        {...register(`participants.${index}.email`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.participants?.[index]?.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.participants[index]?.email?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        会社名
                      </label>
                      <input
                        type="text"
                        {...register(`participants.${index}.company`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 領収書名義 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">領収書名義（任意）</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                宛名種別
              </label>
              <select
                {...register('invoiceRecipientType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                <option value="INDIVIDUAL">個人</option>
                <option value="COMPANY">法人</option>
              </select>
            </div>

            {watchInvoiceType === 'COMPANY' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会社名
                  </label>
                  <input
                    type="text"
                    {...register('invoiceCompanyName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      部署
                    </label>
                    <input
                      type="text"
                      {...register('invoiceDepartment')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      役職
                    </label>
                    <input
                      type="text"
                      {...register('invoiceTitle')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                敬称
              </label>
              <select
                {...register('invoiceHonorific')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                <option value="様">様</option>
                <option value="御中">御中</option>
                <option value="殿">殿</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                但し書き
              </label>
              <input
                type="text"
                {...register('invoiceNote')}
                placeholder="セミナー受講料として"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 支払方法 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">支払方法</h3>
          <div className="space-y-3">
            {['CREDIT_CARD', 'KONBINI', 'PAYPAY'].map((method) => (
              <label key={method} className="flex items-center">
                <input
                  type="radio"
                  value={method}
                  {...register('paymentMethod')}
                  className="mr-3"
                />
                <span>{getPaymentMethod(method)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 備考 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">備考</h3>
          <textarea
            {...register('notes')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ご要望などがございましたらご記入ください"
          />
        </div>

        {/* キャンセルポリシー */}
        {cancellationRules.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
              キャンセルポリシー
            </h3>
            <div className="space-y-2 text-sm">
              {cancellationRules.map((rule, index) => (
                <p key={index}>
                  ・{rule.daysBefore === 0 ? '当日' : `${rule.daysBefore}日前まで`}：
                  {rule.refundRate === 0
                    ? 'キャンセル不可'
                    : `受講料の${rule.refundRate}%を返金`}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* 合計金額 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex justify-between items-center text-xl font-semibold">
            <span>合計金額（税込）</span>
            <span>{formatCurrency(calculateTotal())}</span>
          </div>
        </div>

        {/* 同意事項 */}
        <div className="space-y-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              {...register('agreeToTerms')}
              className="mt-1 mr-3"
            />
            <span className="text-sm">
              <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                利用規約
              </a>
              に同意します
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
          )}

          <label className="flex items-start">
            <input
              type="checkbox"
              {...register('agreeToCancellationPolicy')}
              className="mt-1 mr-3"
            />
            <span className="text-sm">キャンセルポリシーに同意します</span>
          </label>
          {errors.agreeToCancellationPolicy && (
            <p className="text-sm text-red-600">
              {errors.agreeToCancellationPolicy.message}
            </p>
          )}
        </div>

        {/* 送信ボタン */}
        <div className="text-center">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '処理中...' : '決済へ進む'}
          </button>
        </div>
      </form>
    </div>
  )
}
