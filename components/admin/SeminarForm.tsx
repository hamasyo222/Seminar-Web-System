'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { seminarSchema } from '@/lib/validations'
import { toast } from 'react-hot-toast'
import { Save, X } from 'lucide-react'
import type { Seminar } from '@prisma/client'

type SeminarFormData = z.infer<typeof seminarSchema>

interface SeminarFormProps {
  seminar?: Seminar
}

export default function SeminarForm({ seminar }: SeminarFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isEdit = !!seminar

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<SeminarFormData>({
    resolver: zodResolver(seminarSchema) as any,
    defaultValues: {
      slug: seminar?.slug || '',
      title: seminar?.title || '',
      description: seminar?.description || '',
      category: seminar?.category || '',
      tags: seminar ? JSON.parse(seminar.tags) : [],
      imageUrl: seminar?.imageUrl || '',
      status: seminar?.status || 'DRAFT'
    }
  })

  const watchTags = watch('tags') || []

  const addTag = (tag: string) => {
    if (tag && !watchTags.includes(tag)) {
      setValue('tags', [...watchTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setValue('tags', watchTags.filter(t => t !== tag))
  }

  const onSubmit = async (data: SeminarFormData) => {
    setLoading(true)

    try {
      const response = await fetch(
        isEdit ? `/api/admin/seminars/${seminar.id}` : '/api/admin/seminars',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )

      const result = await response.json()

      if (result.success) {
        toast.success(isEdit ? 'セミナーを更新しました' : 'セミナーを作成しました')
        router.push('/admin/seminars')
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
              URLスラッグ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('slug')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="web-development-basics"
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              説明 <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description')}
              rows={8}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                カテゴリ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('category')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
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
                <option value="DRAFT">下書き</option>
                <option value="PUBLISHED">公開</option>
                <option value="ARCHIVED">アーカイブ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              タグ
            </label>
            <div className="mt-1">
              <input
                type="text"
                placeholder="タグを入力してEnterキーを押してください"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const input = e.target as HTMLInputElement
                    addTag(input.value.trim())
                    input.value = ''
                  }
                }}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {watchTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              画像URL
            </label>
            <input
              type="url"
              {...register('imageUrl')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="https://example.com/image.jpg"
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl.message}</p>
            )}
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
