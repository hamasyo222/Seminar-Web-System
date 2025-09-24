import { z } from 'zod'

// 注文フォームのバリデーション
export const orderFormSchema = z.object({
  sessionId: z.string().min(1, 'セッションIDは必須です'),
  
  // 申込者情報
  name: z.string().min(1, '名前は必須です').max(50, '名前は50文字以内で入力してください'),
  nameKana: z.string()
    .regex(/^[\u30A0-\u30FF\u3040-\u309F\s]*$/, 'カナは全角カタカナまたはひらがなで入力してください')
    .optional()
    .or(z.literal('')),
  email: z.string().email('有効なメールアドレスを入力してください'),
  phone: z.string()
    .regex(/^(0\d{1,4}-?\d{1,4}-?\d{3,4})?$/, '有効な電話番号を入力してください')
    .optional()
    .or(z.literal('')),
  company: z.string().max(100, '会社名は100文字以内で入力してください').optional().or(z.literal('')),
  
  // チケット情報
  tickets: z.array(z.object({
    ticketTypeId: z.string(),
    quantity: z.number().int().min(1)
  })).min(1, 'チケットを選択してください'),
  
  // 参加者情報（代理申込）
  participants: z.array(z.object({
    name: z.string().min(1, '名前は必須です').max(50),
    nameKana: z.string()
      .regex(/^[\u30A0-\u30FF\u3040-\u309F\s]*$/, 'カナは全角カタカナまたはひらがなで入力してください')
      .optional()
      .or(z.literal('')),
    email: z.string().email('有効なメールアドレスを入力してください'),
    company: z.string().max(100).optional().or(z.literal(''))
  })).optional().default([]),
  
  // 領収書情報
  invoiceRecipientType: z.enum(['INDIVIDUAL', 'COMPANY']).optional().or(z.literal('')),
  invoiceCompanyName: z.string().max(100).optional().or(z.literal('')),
  invoiceDepartment: z.string().max(50).optional().or(z.literal('')),
  invoiceTitle: z.string().max(50).optional().or(z.literal('')),
  invoiceHonorific: z.string().max(10).optional().or(z.literal('')),
  invoiceNote: z.string().max(100).optional().or(z.literal('')),
  
  // 支払方法
  paymentMethod: z.enum(['CREDIT_CARD', 'KONBINI', 'PAYPAY', 'BANK_TRANSFER']),
  
  // 備考
  notes: z.string().max(500, '備考は500文字以内で入力してください').optional().or(z.literal('')),
  
  // 同意事項
  agreeToTerms: z.boolean().refine((val) => val === true, '利用規約への同意が必要です'),
  agreeToCancellationPolicy: z.boolean().refine((val) => val === true, 'キャンセルポリシーへの同意が必要です')
})

// クーポンコード検証
export const couponCodeSchema = z.object({
  code: z.string()
    .min(1, 'クーポンコードを入力してください')
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,12}$/, '有効なクーポンコードを入力してください')
})

// お問い合わせフォーム
export const contactFormSchema = z.object({
  name: z.string().min(1, 'お名前は必須です').max(50),
  email: z.string().email('有効なメールアドレスを入力してください'),
  subject: z.string().min(1, '件名は必須です').max(100),
  message: z.string().min(10, 'お問い合わせ内容は10文字以上で入力してください').max(1000),
  category: z.enum(['general', 'payment', 'technical', 'other']).default('general')
})

// パスワードリセット
export const passwordResetSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください')
})

// 新しいパスワード設定
export const newPasswordSchema = z.object({
  password: z.string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードは大文字、小文字、数字を含む必要があります'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword']
})

// 管理者ログイン
export const adminLoginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
  mfaCode: z.string().length(6, '6桁のコードを入力してください').optional()
})

// 二要素認証設定
export const mfaSetupSchema = z.object({
  secret: z.string(),
  code: z.string().length(6, '6桁のコードを入力してください')
})

// アカウント情報更新
export const accountUpdateSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(50),
  email: z.string().email('有効なメールアドレスを入力してください'),
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードは大文字、小文字、数字を含む必要があります')
    .optional()
    .or(z.literal('')),
  confirmNewPassword: z.string().optional().or(z.literal(''))
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false
  }
  if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
    return false
  }
  return true
}, {
  message: 'パスワードを変更する場合は現在のパスワードが必要です',
  path: ['currentPassword']
})

// Re-export schemas from other files
export { seminarSchema } from './validations/seminar'