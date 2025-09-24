import { z } from 'zod'

// 共通のバリデーションルール
export const commonValidators = {
  // ID（CUID形式）
  id: z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid ID format'),
  
  // メールアドレス
  email: z.string().email('有効なメールアドレスを入力してください'),
  
  // 電話番号（日本）
  phone: z.string().regex(
    /^0\d{1,4}-?\d{1,4}-?\d{3,4}$/,
    '有効な電話番号を入力してください'
  ).optional(),
  
  // URL
  url: z.string().url('有効なURLを入力してください'),
  
  // 日時（ISO 8601形式）
  datetime: z.string().datetime('有効な日時を入力してください'),
  
  // 金額（正の整数）
  amount: z.number().int().min(0, '金額は0以上である必要があります'),
  
  // パーセント（0-100）
  percentage: z.number().int().min(0).max(100, 'パーセントは0〜100の範囲で入力してください'),
  
  // ページネーション
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  
  // ソート順
  order: z.enum(['asc', 'desc']).default('desc'),
  
  // 日本語テキスト（改行を含む）
  japaneseText: z.string().regex(
    /^[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf\s\r\n!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~0-9a-zA-Z]+$/,
    '使用できない文字が含まれています'
  )
}

// セミナー関連のバリデーション
export const seminarValidators = {
  createSeminar: z.object({
    slug: z.string()
      .regex(/^[a-z0-9-]+$/, 'スラッグは英数字とハイフンのみ使用できます')
      .min(3, 'スラッグは3文字以上である必要があります')
      .max(50, 'スラッグは50文字以内である必要があります'),
    title: z.string().min(1, 'タイトルは必須です').max(100),
    description: z.string().min(1, '説明は必須です').max(2000),
    category: z.string().min(1, 'カテゴリーは必須です'),
    tags: z.array(z.string()).default([]),
    imageUrl: z.string().url().optional().nullable(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT')
  }),

  updateSeminar: z.object({
    slug: z.string()
      .regex(/^[a-z0-9-]+$/)
      .min(3)
      .max(50)
      .optional(),
    title: z.string().min(1).max(100).optional(),
    description: z.string().min(1).max(2000).optional(),
    category: z.string().min(1).optional(),
    tags: z.array(z.string()).optional(),
    imageUrl: z.string().url().optional().nullable(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional()
  })
}

// セッション関連のバリデーション
export const sessionValidators = {
  createSession: z.object({
    seminarId: commonValidators.id,
    title: z.string().optional().nullable(),
    startAt: commonValidators.datetime,
    endAt: commonValidators.datetime,
    format: z.enum(['OFFLINE', 'ONLINE', 'HYBRID']),
    venue: z.string().optional().nullable(),
    venueAddress: z.string().optional().nullable(),
    onlineUrl: z.string().url().optional().nullable(),
    zoomType: z.enum(['MEETING', 'WEBINAR']).optional().nullable(),
    zoomId: z.string().optional().nullable(),
    zoomPasscode: z.string().optional().nullable(),
    capacity: z.number().int().min(1, '定員は1名以上である必要があります'),
    status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']).default('SCHEDULED')
  }).refine((data) => {
    const start = new Date(data.startAt)
    const end = new Date(data.endAt)
    return start < end
  }, {
    message: '終了時刻は開始時刻より後である必要があります',
    path: ['endAt']
  }).refine((data) => {
    if (data.format === 'OFFLINE' || data.format === 'HYBRID') {
      return !!data.venue
    }
    return true
  }, {
    message: 'オフライン開催の場合、会場は必須です',
    path: ['venue']
  }).refine((data) => {
    if (data.format === 'ONLINE' || data.format === 'HYBRID') {
      return !!data.onlineUrl || !!data.zoomId
    }
    return true
  }, {
    message: 'オンライン開催の場合、URLまたはZoom IDは必須です',
    path: ['onlineUrl']
  })
}

// 注文関連のバリデーション
export const orderValidators = {
  createOrder: z.object({
    sessionId: commonValidators.id,
    email: commonValidators.email,
    name: z.string().min(1, '名前は必須です').max(50),
    nameKana: z.string()
      .regex(/^[\u30A0-\u30FF\u3040-\u309F\s]+$/, 'カナは全角カタカナまたはひらがなで入力してください')
      .optional(),
    phone: commonValidators.phone,
    company: z.string().max(100).optional(),
    items: z.array(z.object({
      ticketTypeId: commonValidators.id,
      quantity: z.number().int().min(1)
    })).min(1, 'チケットを選択してください'),
    notes: z.string().max(500).optional()
  })
}

// 参加者関連のバリデーション
export const participantValidators = {
  updateAttendance: z.object({
    participantId: commonValidators.id,
    attendanceStatus: z.enum(['NOT_CHECKED_IN', 'CHECKED_IN', 'NO_SHOW'])
  })
}

// 共通のサニタイズ関数
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // HTMLタグを除去
    .replace(/\0/g, '') // NULL文字を除去
}

// 日付の検証とフォーマット
export function validateAndFormatDate(dateString: string): Date | null {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return null
    }
    return date
  } catch {
    return null
  }
}

// 価格計算の検証
export function calculatePriceWithTax(price: number, taxRate: number): {
  subtotal: number
  tax: number
  total: number
} {
  const subtotal = Math.floor(price)
  const tax = Math.floor(subtotal * taxRate / 100)
  const total = subtotal + tax
  
  return { subtotal, tax, total }
}
