// 環境変数の設定とバリデーション
import { z } from 'zod'

// 環境変数のスキーマ定義
const envSchema = z.object({
  // アプリケーション設定
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  
  // データベース
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // KOMOJU（決済）
  KOMOJU_CLIENT_ID: z.string().min(1, 'KOMOJU_CLIENT_ID is required'),
  KOMOJU_PUBLIC_KEY: z.string().min(1, 'KOMOJU_PUBLIC_KEY is required'),
  KOMOJU_SECRET_KEY: z.string().min(1, 'KOMOJU_SECRET_KEY is required'),
  KOMOJU_WEBHOOK_SECRET: z.string().min(1, 'KOMOJU_WEBHOOK_SECRET is required'),
  KOMOJU_API_URL: z.string().url().default('https://komoju.com/api/v1'),
  
  // SendGrid（メール）
  SENDGRID_API_KEY: z.string().min(1, 'SENDGRID_API_KEY is required'),
  MAIL_FROM_EMAIL: z.string().email().default('noreply@example.com'),
  MAIL_FROM_NAME: z.string().default('セミナー事務局'),
  MAIL_REPLY_TO: z.string().email().optional(),
  
  // Zoom（オプション）
  ZOOM_CLIENT_ID: z.string().optional(),
  ZOOM_CLIENT_SECRET: z.string().optional(),
  ZOOM_REDIRECT_URI: z.string().url().optional(),
  
  // 会社情報
  COMPANY_NAME: z.string().default('株式会社サンプル'),
  COMPANY_TAX_ID: z.string().default('1234567890123'),
  COMPANY_ADDRESS: z.string().default('東京都千代田区〇〇1-2-3'),
  COMPANY_TEL: z.string().default('03-1234-5678'),
  COMPANY_EMAIL: z.string().email().default('info@example.com'),
  
  // セキュリティ
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,https://example.com'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
  
  // その他
  BASE_URL: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
})

// 環境変数の検証とエクスポート
export const env = envSchema.parse(process.env)

// 型定義のエクスポート
export type Env = z.infer<typeof envSchema>

// 開発環境用のデフォルト値（.env.exampleの内容）
export const defaultEnv = {
  NODE_ENV: 'development',
  NEXTAUTH_SECRET: 'your-secret-key-at-least-32-characters',
  NEXTAUTH_URL: 'http://localhost:3000',
  
  DATABASE_URL: 'file:./prisma/dev.db',
  
  KOMOJU_CLIENT_ID: 'your_komoju_client_id_here',
  KOMOJU_PUBLIC_KEY: 'pk_test_your_komoju_public_key_here',
  KOMOJU_SECRET_KEY: 'sk_test_your_komoju_secret_key_here',
  KOMOJU_WEBHOOK_SECRET: 'your-webhook-secret',
  KOMOJU_API_URL: 'https://komoju.com/api/v1',
  
  SENDGRID_API_KEY: 'SG.xxxxx',
  MAIL_FROM_EMAIL: 'noreply@example.com',
  MAIL_FROM_NAME: 'セミナー事務局',
  MAIL_REPLY_TO: 'support@example.com',
  
  ZOOM_CLIENT_ID: 'your-zoom-client-id',
  ZOOM_CLIENT_SECRET: 'your-zoom-client-secret',
  ZOOM_REDIRECT_URI: 'http://localhost:3000/api/zoom/callback',
  
  COMPANY_NAME: '株式会社サンプル',
  COMPANY_TAX_ID: '1234567890123',
  COMPANY_ADDRESS: '東京都千代田区〇〇1-2-3',
  COMPANY_TEL: '03-1234-5678',
  COMPANY_EMAIL: 'info@example.com',
  
  ALLOWED_ORIGINS: 'http://localhost:3000,https://example.com',
  ENCRYPTION_KEY: 'your-encryption-key-at-least-32-characters',
  
  BASE_URL: 'http://localhost:3000',
  LOG_LEVEL: 'info',
} as const