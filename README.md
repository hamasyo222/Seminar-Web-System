# セミナー管理システム

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-green)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-38B2AC)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

本番運用可能なフル機能のセミナー管理システムです。Next.js 14、TypeScript、Prisma、PostgreSQLを使用して構築されています。

🔗 **GitHub Repository**: [https://github.com/hamasyo222/Seminar-Web-System](https://github.com/hamasyo222/Seminar-Web-System)

## 🎯 主な機能

### 公開機能
- **セミナー一覧・詳細表示**: カテゴリ/タグ/開催形式での絞り込み検索
- **オンライン申込**: 代理申込対応、複数チケット種別選択
- **決済機能**: KOMOJU統合（クレジットカード/コンビニ/PayPay）
- **領収書**: 適格請求書形式のPDF自動生成、再発行対応
- **カレンダー連携**: ICSファイル生成・ダウンロード

### 管理機能
- **セミナー管理**: 開催回、チケット種別、在庫管理
- **申込管理**: 注文一覧、ステータス管理、CSVエクスポート
- **受付チェック**: 手動チェックイン、監査ログ
- **返金処理**: カード返金、銀行振込対応
- **メール管理**: テンプレート管理、自動送信
- **クーポン管理**: 割引設定、使用制限

### 自動化機能
- **Zoom連携**: ウェビナー自動登録（OAuth2）
- **リマインダー**: 24時間前/1時間前自動送信
- **未入金管理**: 期限切れ自動処理
- **Webhook処理**: KOMOJU決済状態同期

## 🛠 技術スタック

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (開発時はSQLite)
- **ORM**: Prisma
- **Authentication**: カスタム実装（JWT）
- **Payment**: KOMOJU Session API
- **Email**: SendGrid
- **PDF**: @react-pdf/renderer
- **Calendar**: ics
- **Validation**: Zod
- **Job Scheduler**: node-cron

## 📋 必要な環境

- Node.js 18.x以上
- npm または yarn
- PostgreSQL（本番環境）またはSQLite（開発環境）

## 🚀 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd seminar-web-system
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、必要な値を設定します：

```bash
cp .env.example .env
```

必須の環境変数：

```env
# Database（開発時はSQLiteを使用）
DATABASE_URL="file:./dev.db"

# App
NEXTAUTH_SECRET="your-secret-key-here"
BASE_URL="http://localhost:3000"
TIMEZONE="Asia/Tokyo"

# KOMOJU（テスト環境）
KOMOJU_API_KEY="sk_test_xxx"
KOMOJU_WEBHOOK_SECRET="whsec_xxx"
KOMOJU_RETURN_URL="http://localhost:3000/thank-you"

# SendGrid
SENDGRID_API_KEY="SG.xxx"
MAIL_FROM="セミナー運営 <noreply@your-domain.example>"

# Zoom（任意）
ZOOM_CLIENT_ID="your-zoom-client-id"
ZOOM_CLIENT_SECRET="your-zoom-client-secret"
ZOOM_REDIRECT_URI="http://localhost:3000/api/zoom/callback"
ZOOM_ACCOUNT_EMAIL="ops@example.com"

# 領収書発行者情報
INVOICE_ISSUER_NAME="株式会社サンプル"
INVOICE_ISSUER_TAX_ID="T1234567890123"
INVOICE_ISSUER_ADDRESS="東京都渋谷区〇〇1-2-3"
INVOICE_ISSUER_TEL="03-1234-5678"

# 管理者認証
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123456"

# 暗号化キー
ENCRYPTION_KEY="your-32-byte-encryption-key-here"
```

### 4. データベースのセットアップ

```bash
# マイグレーション実行
npm run db:migrate

# 初期データ投入
npm run db:seed
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

## 🧪 KOMOJUテスト環境での動作確認

### 1. KOMOJUアカウントの準備

1. [KOMOJU](https://komoju.com/)でテストアカウントを作成
2. ダッシュボードから以下を取得：
   - APIキー（`sk_test_`で始まる）
   - Webhook Secret（Webhook設定画面から）

### 2. Webhook設定

KOMOJUダッシュボードでWebhookエンドポイントを設定：

```
https://your-domain.example/api/webhooks/komoju
```

イベントタイプ：
- payment.captured
- payment.authorized
- payment.failed
- payment.expired
- payment.refunded

### 3. テスト決済

テストカード番号：
- 成功: 4242 4242 4242 4242
- 失敗: 4000 0000 0000 0002

コンビニ決済：テスト環境では即座に「captured」状態になります。

## 🔗 Zoom OAuth連携手順

### 1. Zoom App作成

1. [Zoom App Marketplace](https://marketplace.zoom.us/)でアプリ作成
2. OAuth タイプを選択
3. Redirect URL に `http://localhost:3000/api/zoom/callback` を設定

### 2. 必要なスコープ

- webinar:write
- webinar:read
- user:read

### 3. 認証フロー

1. 管理画面から「Zoom連携」をクリック
2. Zoomにログインして認可
3. トークンが自動保存される

## 📱 主要な画面と動線

### 利用者側

1. **セミナー一覧** (`/seminars`)
   - カテゴリ・タグで絞り込み
   - 開催日順に表示

2. **セミナー詳細** (`/seminars/[slug]`)
   - 開催回選択
   - チケット種別確認
   - 申込ボタン

3. **申込フォーム** (`/checkout`)
   - チケット選択
   - 参加者情報入力
   - 支払方法選択
   - 領収書名義設定

4. **支払完了** (`/thank-you`)
   - 注文内容確認
   - 次のステップ案内

### 管理者側

1. **ログイン**
   - Email: admin@example.com
   - Password: admin123456

2. **ダッシュボード** (`/admin`)
   - 売上統計
   - 直近の申込
   - 開催予定

3. **セミナー管理** (`/admin/seminars`)
   - CRUD操作
   - 開催回設定
   - チケット管理

4. **受付モード** (`/admin/checkin`)
   - QRコード読取（実装予定）
   - 手動チェックイン
   - 参加者検索

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# Lintチェック
npm run lint

# データベース関連
npm run db:migrate    # マイグレーション実行
npm run db:seed       # シードデータ投入
npm run db:studio     # Prisma Studio起動
npm run db:reset      # データベースリセット
```

## 🏗 プロジェクト構造

```
/app                    # Next.js App Router
  /(public)            # 公開ページレイアウト
  /seminars            # セミナー関連ページ
  /checkout            # 申込ページ
  /admin               # 管理画面
  /api                 # APIルート
    /checkout          # 決済API
    /webhooks          # Webhook受信
    /zoom              # Zoom連携
    /cron              # 定期ジョブ
/components            # 共通コンポーネント
/lib                   # ユーティリティ
  auth.ts             # 認証
  komoju.ts           # KOMOJU統合
  mail.ts             # メール送信
  pdf.ts              # PDF生成
  ics.ts              # カレンダー
  zoom.ts             # Zoom API
/prisma
  schema.prisma       # データベーススキーマ
  seed.ts             # 初期データ
/public               # 静的ファイル
/types                # TypeScript型定義
/utils                # 汎用ユーティリティ
```

## ⚡ パフォーマンス最適化

- Server Componentsを活用
- 画像の最適化（next/image）
- データベースクエリの最適化
- キャッシュ戦略（revalidate）

## 🔒 セキュリティ対策

- CSRF対策
- XSS対策（React自動エスケープ）
- SQLインジェクション対策（Prisma）
- Webhook署名検証
- 環境変数での機密情報管理

## 📈 監視・ログ

- 構造化ログ（order_id, session_id等で追跡可能）
- エラートラッキング
- パフォーマンス監視
- Webhook処理の監査ログ

## 🚢 デプロイ

### GitHub Actions CI/CD

このプロジェクトは、GitHub Actionsを使用した自動CI/CDパイプラインが設定されています。

- **CI**: プッシュ時に自動でテスト、Lint、ビルドを実行
- **CD**: mainブランチへのプッシュ時にVercelへ自動デプロイ

必要なGitHub Secrets:
- `VERCEL_TOKEN`: Vercelのアクセストークン
- `VERCEL_ORG_ID`: VercelのOrganization ID
- `VERCEL_PROJECT_ID`: VercelのProject ID
- `DATABASE_URL`: 本番データベースのURL
- `NEXTAUTH_SECRET`: NextAuthのシークレット

### Vercel

```bash
# 1. Vercelプロジェクトを作成
vercel

# 2. 環境変数を設定（Vercel Dashboard）
# DATABASE_URL, NEXTAUTH_SECRET, KOMOJU_API_KEY, etc.

# 3. デプロイ
vercel --prod
```

### Docker

```bash
# Dockerイメージをビルド
docker build -t seminar-system .

# ローカルで実行
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  seminar-system
```

### 本番環境の環境変数

本番環境では、以下の環境変数を設定してください：

```env
# データベース
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# 認証
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"

# 決済（KOMOJU）
KOMOJU_API_KEY="your-komoju-api-key"
KOMOJU_WEBHOOK_SECRET="your-webhook-secret"

# メール（SendGrid）
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@your-domain.com"
SENDGRID_FROM_NAME="セミナー事務局"

# Zoom
ZOOM_CLIENT_ID="your-zoom-client-id"
ZOOM_CLIENT_SECRET="your-zoom-client-secret"
ZOOM_REDIRECT_URI="https://your-domain.com/api/zoom/callback"

# その他
BASE_URL="https://your-domain.com"
TIMEZONE="Asia/Tokyo"
```

## 🤝 コントリビューション

1. Forkする
2. Feature branchを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. Branchにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## 📝 ライセンス

This project is licensed under the MIT License.

## 🙏 謝辞

- Next.js team
- Vercel
- KOMOJU
- SendGrid
- その他すべてのOSSコントリビューター