'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { sessionSchema } from '@/lib/validations'
import { toast } from 'react-hot-toast'
import { Save } from 'lucide-react'
import type { Session } from '@prisma/client'

type SessionFormData = z.infer<typeof sessionSchema>

interface SessionFormProps {
  seminarId: string
  session?: Session
}

export default function SessionForm({ seminarId, session }: SessionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isEdit = !!session

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      seminarId,
      title: session?.title || '',
      startAt: session ? new Date(session.startAt).toISOString().slice(0, 16) : '',
      endAt: session ? new Date(session.endAt).toISOString().slice(0, 16) : '',
      format: session?.format || 'OFFLINE',
      venue: session?.venue || '',
      venueAddress: session?.venueAddress || '',
      onlineUrl: session?.onlineUrl || '',
      zoomType: session?.zoomType || undefined,
      zoomId: session?.zoomId || '',
      zoomPasscode: session?.zoomPasscode || '',
      capacity: session?.capacity || 50,
      status: session?.status || 'SCHEDULED'
    },
  })

  const watchFormat = watch('format')
  const watchZoomType = watch('zoomType')

  const onSubmit = async (data: SessionFormData) => {
    setLoading(true)

    try {
      // 日時をISO形式に変換
      const formData = {
        ...data,
        startAt: new Date(data.startAt).toISOString(),
        endAt: new Date(data.endAt).toISOString(),
      }

      const response = await fetch(
        isEdit 
          ? `/api/admin/seminars/${seminarId}/sessions/${session.id}`
          : `/api/admin/seminars/${seminarId}/sessions`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      )

      const result = await response.json()

      if (result.success) {
        toast.success(isEdit ? '開催回を更新しました' : '開催回を作成しました')
        router.push(`/admin/seminars/${seminarId}/sessions`)
        router.refresh()
      } else {
        toast.error(result.error || '保存に失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">基本情報</h2>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              セッションタイトル（任意）
            </label>
            <input
              type="text"
              {...register('title')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="第1回 土曜日開催"
            />
            <p className="mt-1 text-sm text-gray-500">
              未入力の場合は日時が表示されます
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                開始日時 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                {...register('startAt')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.startAt && (
                <p className="mt-1 text-sm text-red-600">{errors.startAt.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                終了日時 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                {...register('endAt')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.endAt && (
                <p className="mt-1 text-sm text-red-600">{errors.endAt.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              開催形式 <span className="text-red-500">*</span>
            </label>
            <select
              {...register('format')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="OFFLINE">オフライン</option>
              <option value="ONLINE">オンライン</option>
              <option value="HYBRID">ハイブリッド</option>
            </select>
          </div>

          {(watchFormat === 'OFFLINE' || watchFormat === 'HYBRID') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  会場名
                </label>
                <input
                  type="text"
                  {...register('venue')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  会場住所
                </label>
                <input
                  type="text"
                  {...register('venueAddress')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </>
          )}

          {(watchFormat === 'ONLINE' || watchFormat === 'HYBRID') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  オンラインURL
                </label>
                <input
                  type="url"
                  {...register('onlineUrl')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://zoom.us/j/123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Zoom連携
                </label>
                <select
                  {...register('zoomType')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">使用しない</option>
                  <option value="MEETING">ミーティング</option>
                  <option value="WEBINAR">ウェビナー</option>
                </select>
              </div>

              {watchZoomType && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Zoom ID
                    </label>
                    <input
                      type="text"
                      {...register('zoomId')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Zoomパスコード
                    </label>
                    <input
                      type="text"
                      {...register('zoomPasscode')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                定員 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register('capacity', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                ステータス
              </label>
              <select
                {...register('status')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="SCHEDULED">開催予定</option>
                <option value="ONGOING">開催中</option>
                <option value="COMPLETED">終了</option>
                <option value="CANCELLED">中止</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}
