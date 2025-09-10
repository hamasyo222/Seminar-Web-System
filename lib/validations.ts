import { z } from 'zod'

// 共通バリデーション
export const emailSchema = z.string().email('正しいメールアドレスを入力してください')
export const phoneSchema = z.string().regex(/^[0-9-]+$/, '電話番号は半角数字とハイフンのみ使用できます').optional()
export const nameSchema = z.string().min(1, '名前を入力してください').max(100, '名前は100文字以内で入力してください')
export const nameKanaSchema = z.string().regex(/^[ァ-ヶー　]+$/, 'カナは全角カタカナで入力してください').optional()

// セミナー関連
export const seminarSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'URLスラッグは英数字とハイフンのみ使用できます'),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT')
})

// セッション関連
export const sessionSchema = z.object({
  seminarId: z.string(),
  title: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  format: z.enum(['OFFLINE', 'ONLINE', 'HYBRID']),
  venue: z.string().optional(),
  venueAddress: z.string().optional(),
  onlineUrl: z.string().url().optional(),
  zoomType: z.enum(['MEETING', 'WEBINAR']).optional(),
  zoomId: z.string().optional(),
  zoomPasscode: z.string().optional(),
  capacity: z.number().int().positive(),
  status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']).default('SCHEDULED')
})

// チケット種別
export const ticketTypeSchema = z.object({
  sessionId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().int().min(0),
  taxRate: z.number().int().min(0).max(100).default(10),
  stock: z.number().int().min(0),
  maxPerOrder: z.number().int().positive().default(10),
  salesStartAt: z.string().datetime().optional(),
  salesEndAt: z.string().datetime().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true)
})

// 申込フォーム
export const orderFormSchema = z.object({
  sessionId: z.string(),
  email: emailSchema,
  name: nameSchema,
  nameKana: nameKanaSchema,
  phone: phoneSchema,
  company: z.string().max(200).optional(),
  
  // チケット選択
  tickets: z.array(z.object({
    ticketTypeId: z.string(),
    quantity: z.number().int().positive()
  })).min(1, 'チケットを選択してください'),
  
  // 参加者情報（代理申込）
  participants: z.array(z.object({
    email: emailSchema,
    name: nameSchema,
    nameKana: nameKanaSchema,
    company: z.string().max(200).optional()
  })),
  
  // 領収書名義
  invoiceRecipientType: z.enum(['INDIVIDUAL', 'COMPANY']).optional(),
  invoiceCompanyName: z.string().max(200).optional(),
  invoiceDepartment: z.string().max(100).optional(),
  invoiceTitle: z.string().max(100).optional(),
  invoiceHonorific: z.string().max(20).optional(),
  invoiceNote: z.string().max(200).optional(),
  
  // 支払方法
  paymentMethod: z.enum(['CREDIT_CARD', 'KONBINI', 'PAYPAY', 'BANK_TRANSFER']),
  
  notes: z.string().max(1000).optional(),
  
  // 規約同意
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: '利用規約に同意してください'
  }),
  agreeToCancellationPolicy: z.boolean().refine((val) => val === true, {
    message: 'キャンセルポリシーに同意してください'
  })
})

// 管理者ログイン
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'パスワードは6文字以上で入力してください')
})

// 管理者作成
export const adminUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(100),
  name: nameSchema,
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'VIEWER']).default('VIEWER')
})

// キャンセルポリシー
export const cancellationPolicySchema = z.object({
  seminarId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  rules: z.array(z.object({
    daysBefore: z.number().int().min(0),
    refundRate: z.number().int().min(0).max(100)
  })).min(1)
})

// 返金リクエスト
export const refundRequestSchema = z.object({
  orderId: z.string(),
  amount: z.number().int().positive(),
  reason: z.string().min(1).max(500),
  method: z.enum(['CREDIT_CARD', 'BANK_TRANSFER']),
  
  // 銀行振込の場合
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  accountType: z.enum(['普通', '当座']).optional(),
  accountNumber: z.string().optional(),
  accountHolder: z.string().optional()
})

// メールテンプレート
export const emailTemplateSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(200),
  bodyHtml: z.string().min(1),
  bodyText: z.string().min(1),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
})

// クーポン
export const couponSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/, 'クーポンコードは大文字英数字とハイフンのみ使用できます'),
  name: z.string().min(1).max(100),
  discountType: z.enum(['AMOUNT', 'PERCENTAGE']),
  discountValue: z.number().int().positive(),
  usageLimit: z.number().int().positive().optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  minAmount: z.number().int().min(0).optional(),
  seminarIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
})
