import { z } from 'zod'

export const seminarSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内です'),
  slug: z.string()
    .min(1, 'スラッグは必須です')
    .max(255, 'スラッグは255文字以内です')
    .regex(/^[a-z0-9-]+$/, 'スラッグは小文字英数字とハイフンのみ使用可能です'),
  description: z.string().max(5000, '説明は5000文字以内です').optional().nullable(),
  content: z.string().optional().nullable(),
  imageUrl: z.string().url('有効なURLを入力してください').max(2048, 'URLは2048文字以内です').optional().nullable(),
  category: z.string().max(50, 'カテゴリーは50文字以内です').optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  instructorName: z.string().max(100, '講師名は100文字以内です').optional().nullable(),
  instructorBio: z.string().max(1000, '講師プロフィールは1000文字以内です').optional().nullable(),
  instructorImageUrl: z.string().url('有効なURLを入力してください').max(2048, 'URLは2048文字以内です').optional().nullable(),
  prerequisites: z.string().max(1000, '前提条件は1000文字以内です').optional().nullable(),
  targetAudience: z.string().max(1000, '対象者は1000文字以内です').optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  publishedAt: z.string().datetime('有効な日時を入力してください').optional().nullable(),
  metaTitle: z.string().max(255, 'メタタイトルは255文字以内です').optional().nullable(),
  metaDescription: z.string().max(500, 'メタディスクリプションは500文字以内です').optional().nullable(),
  ogImageUrl: z.string().url('有効なURLを入力してください').max(2048, 'URLは2048文字以内です').optional().nullable(),
})




