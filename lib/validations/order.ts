import { z } from 'zod'
import { isIP } from 'node:net'

// 日本の電話番号パターン
const phoneRegex = /^(0[5-9]0[0-9]{8}|0[1-9][1-9][0-9]{7})$/
const phoneWithHyphenRegex = /^(0[5-9]0-[0-9]{4}-[0-9]{4}|0[1-9][1-9]-[0-9]{4}-[0-9]{4}|0[1-9][1-9][0-9]-[0-9]{3}-[0-9]{4}|0[1-9][1-9][0-9]{2}-[0-9]{2}-[0-9]{4})$/

// カタカナのみ（スペース許可）
const katakanaRegex = /^[\u30A0-\u30FF\s]+$/

// メールアドレスの詳細なバリデーション
const emailSchema = z.string()
  .email('有効なメールアドレスを入力してください')
  .min(5, 'メールアドレスが短すぎます')
  .max(254, 'メールアドレスが長すぎます')
  .refine((email) => {
    // より厳密なメールアドレスチェック
    const parts = email.split('@')
    if (parts.length !== 2) return false
    
    const [local, domain] = parts
    
    // ローカル部のチェック
    if (local.length === 0 || local.length > 64) return false
    if (local.startsWith('.') || local.endsWith('.')) return false
    if (local.includes('..')) return false
    
    // ドメイン部のチェック
    if (domain.length === 0 || domain.length > 253) return false
    if (!domain.includes('.')) return false
    if (domain.startsWith('.') || domain.endsWith('.')) return false
    
    return true
  }, '正しいメールアドレスの形式で入力してください')

// 参加者情報のバリデーション
const participantSchema = z.object({
  name: z.string()
    .min(1, '名前は必須です')
    .max(50, '名前は50文字以内で入力してください')
    .refine((name) => {
      // 名前に使用できない文字をチェック
      const invalidChars = /[<>\"\'&]/
      return !invalidChars.test(name)
    }, '使用できない文字が含まれています'),
  
  nameKana: z.string()
    .regex(katakanaRegex, 'カタカナで入力してください')
    .min(1, 'フリガナは必須です')
    .max(100, 'フリガナは100文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  
  email: emailSchema,
  
  company: z.string()
    .max(100, '会社名は100文字以内で入力してください')
    .optional()
    .or(z.literal(''))
    .refine((company) => {
      if (!company) return true
      const invalidChars = /[<>\"\'&]/
      return !invalidChars.test(company)
    }, '使用できない文字が含まれています')
})

// 申込フォームの完全なバリデーション
export const orderFormValidationSchema = z.object({
  sessionId: z.string()
    .uuid('不正なセッションIDです')
    .min(1, 'セッションIDは必須です'),
  
  // 申込者情報
  name: z.string()
    .min(1, '名前は必須です')
    .max(50, '名前は50文字以内で入力してください')
    .refine((name) => {
      const invalidChars = /[<>\"\'&]/
      return !invalidChars.test(name)
    }, '使用できない文字が含まれています'),
  
  nameKana: z.string()
    .regex(katakanaRegex, 'カタカナで入力してください')
    .min(1, 'フリガナは必須です')
    .max(100, 'フリガナは100文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  
  email: emailSchema,
  
  phone: z.string()
    .refine((phone) => {
      if (!phone) return true
      const cleaned = phone.replace(/-/g, '')
      return phoneRegex.test(cleaned) || phoneWithHyphenRegex.test(phone)
    }, '有効な電話番号を入力してください（例: 090-1234-5678）')
    .optional()
    .or(z.literal('')),
  
  company: z.string()
    .max(100, '会社名は100文字以内で入力してください')
    .optional()
    .or(z.literal(''))
    .refine((company) => {
      if (!company) return true
      const invalidChars = /[<>\"\'&]/
      return !invalidChars.test(company)
    }, '使用できない文字が含まれています'),
  
  // チケット情報
  tickets: z.array(z.object({
    ticketTypeId: z.string().uuid('不正なチケットIDです'),
    quantity: z.number()
      .int('整数を入力してください')
      .min(1, '数量は1以上である必要があります')
      .max(10, '一度に購入できるのは10枚までです')
  }))
    .min(1, 'チケットを選択してください')
    .max(5, '一度に選択できるチケット種別は5つまでです')
    .refine((tickets) => {
      // 合計枚数チェック
      const total = tickets.reduce((sum, t) => sum + t.quantity, 0)
      return total <= 20
    }, '合計枚数は20枚までです'),
  
  // 参加者情報（代理申込）
  participants: z.array(participantSchema)
    .optional()
    .default([])
    .refine((participants) => {
      // 重複メールアドレスチェック
      const emails = participants.map(p => p.email.toLowerCase())
      const uniqueEmails = new Set(emails)
      return emails.length === uniqueEmails.size
    }, '同じメールアドレスは使用できません'),
  
  // 領収書情報
  invoiceRecipientType: z.enum(['INDIVIDUAL', 'COMPANY'])
    .optional()
    .or(z.literal('')),
  
  invoiceCompanyName: z.string()
    .max(100, '会社名は100文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  
  invoiceDepartment: z.string()
    .max(50, '部署名は50文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  
  invoiceTitle: z.string()
    .max(50, '役職は50文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  
  invoiceHonorific: z.enum(['様', '御中', '殿'])
    .optional()
    .or(z.literal('')),
  
  invoiceNote: z.string()
    .max(100, '但し書きは100文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  
  // 支払方法
  paymentMethod: z.enum(['CREDIT_CARD', 'KONBINI', 'PAYPAY', 'BANK_TRANSFER']),
  
  // クーポンコード
  couponCode: z.string()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,12}$/, '有効なクーポンコードを入力してください')
    .optional()
    .or(z.literal('')),
  
  // 備考
  notes: z.string()
    .max(500, '備考は500文字以内で入力してください')
    .optional()
    .or(z.literal(''))
    .refine((notes) => {
      if (!notes) return true
      // SQLインジェクションやXSSを防ぐ
      const dangerousPatterns = /<script|<\/script|javascript:|on\w+=/i
      return !dangerousPatterns.test(notes)
    }, '使用できない文字列が含まれています'),
  
  // 同意事項
  agreeToTerms: z.boolean()
    .refine((val) => val === true, '利用規約への同意が必要です'),
  
  agreeToCancellationPolicy: z.boolean()
    .refine((val) => val === true, 'キャンセルポリシーへの同意が必要です'),
  
  // スパム対策（ハニーポット）
  website: z.string()
    .max(0, 'このフィールドは空である必要があります')
    .optional()
    .default(''),
})
  .refine((data) => {
    // 領収書宛名の整合性チェック
    if (data.invoiceRecipientType === 'COMPANY' && !data.invoiceCompanyName) {
      return false
    }
    return true
  }, {
    message: '法人の場合は会社名が必須です',
    path: ['invoiceCompanyName']
  })
  .refine((data) => {
    // 参加者数とチケット数の整合性チェック
    const totalTickets = data.tickets.reduce((sum, t) => sum + t.quantity, 0)
    const participantCount = data.participants.length
    
    // 申込者自身を含めて計算
    if (participantCount > 0 && participantCount !== totalTickets - 1) {
      return false
    }
    
    return true
  }, {
    message: '参加者数がチケット数と一致しません',
    path: ['participants']
  })

// サーバーサイド専用の追加バリデーション
export const serverSideOrderValidation = orderFormValidationSchema.extend({
  // IPアドレス
  ipAddress: z.string().optional().refine((value) => {
    if (!value) return true
    return isIP(value) !== 0
  }, '有効なIPアドレスを入力してください'),
  
  // User-Agent
  userAgent: z.string().max(500).optional(),
  
  // リファラー
  referer: z.string().url().optional().or(z.literal('')),
  
  // セッションの妥当性チェック（実際のDBデータと照合）
  sessionValid: z.boolean().refine((val) => val === true, 'セッションが無効です'),
  
  // 在庫チェック
  stockAvailable: z.boolean().refine((val) => val === true, '在庫が不足しています'),
  
  // 重複申込チェック
  noDuplicateOrder: z.boolean().refine((val) => val === true, '既に申込済みです'),
})

// メールアドレス変更時のバリデーション
export const emailChangeSchema = z.object({
  currentEmail: emailSchema,
  newEmail: emailSchema,
  confirmNewEmail: emailSchema,
})
  .refine((data) => data.newEmail === data.confirmNewEmail, {
    message: '新しいメールアドレスが一致しません',
    path: ['confirmNewEmail']
  })
  .refine((data) => data.currentEmail !== data.newEmail, {
    message: '現在のメールアドレスと同じです',
    path: ['newEmail']
  })

// 一括申込用のCSVアップロードバリデーション
export const bulkOrderCsvSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'ファイルサイズは5MB以下にしてください')
    .refine((file) => file.type === 'text/csv' || file.name.endsWith('.csv'), 'CSVファイルを選択してください'),
  
  sessionId: z.string().uuid('不正なセッションIDです'),
  
  skipDuplicates: z.boolean().default(false),
  
  sendEmails: z.boolean().default(true),
})
