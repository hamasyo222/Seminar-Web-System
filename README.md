# セミナー管理システム

セミナーの申込・決済・受付を一元管理するWebシステムです。

## 機能概要

### 公開側機能
- セミナー一覧・詳細表示
- オンライン申込・決済（KOMOJU連携）
- 申込確認・領収書発行
- メール通知（申込確認、リマインダー等）

### 管理側機能
- **セミナー管理**: セミナーの作成・編集・公開設定
- **セッション管理**: 開催回の管理、チケット種別設定
- **注文管理**: 申込状況確認、決済管理、返金処理
- **参加者管理**: 参加者一覧、受付チェック
- **メール管理**: テンプレート編集、送信ログ確認
- **クーポン管理**: 割引クーポンの作成・管理
- **設定管理**: 管理者ユーザー、会社情報、決済・メール設定

## 技術スタック

- **フレームワーク**: Next.js 15.5.2 (App Router)
- **言語**: TypeScript
- **UI**: React 19.1.0 + Tailwind CSS
- **データベース**: SQLite + Prisma ORM
- **認証**: JWT (jose)
- **決済**: KOMOJU
- **メール**: SendGrid
- **その他**: 
  - React Hook Form (フォーム管理)
  - Zod (バリデーション)
  - React PDF (PDF生成)
  - node-cron (定期処理)

## セットアップ

### 1. 環境準備

```bash
# リポジトリのクローン
git clone <repository-url>
cd Seminar-Web-System

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な値を設定
```

### 2. データベース準備

```bash
# マイグレーション実行
npm run db:migrate

# 初期データ投入（開発用）
npm run db:seed
```

### 3. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス可能

## 環境変数

主要な環境変数（詳細は `.env.example` 参照）:

- `DATABASE_URL`: データベース接続URL
- `NEXTAUTH_SECRET`: JWT署名用シークレット
- `KOMOJU_PUBLIC_KEY/SECRET_KEY`: KOMOJU API認証情報
- `SENDGRID_API_KEY`: SendGrid API Key
- `MAIL_FROM_EMAIL`: 送信元メールアドレス

## ディレクトリ構造

```
├── app/                    # Next.js App Router
│   ├── (public)/          # 公開ページレイアウト
│   ├── admin/             # 管理画面
│   ├── api/               # APIエンドポイント
│   └── ...
├── components/            # 共通コンポーネント
├── lib/                   # ユーティリティ・ヘルパー
│   ├── api/              # API関連ヘルパー
│   ├── auth.ts           # 認証関連
│   ├── mail.ts           # メール送信
│   ├── komoju.ts         # 決済連携
│   └── ...
├── prisma/               # データベース定義
│   ├── schema.prisma     # スキーマ定義
│   └── seed.ts          # シードデータ
├── types/                # TypeScript型定義
└── utils/                # 汎用ユーティリティ
```

## 主要なAPI

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト

### セミナー・セッション
- `GET /api/seminars` - セミナー一覧
- `GET /api/sessions/:id` - セッション詳細
- `POST /api/admin/seminars` - セミナー作成（管理者）
- `PUT /api/admin/seminars/:id` - セミナー更新（管理者）

### 注文・決済
- `POST /api/orders` - 注文作成
- `POST /api/checkout/session` - 決済セッション作成
- `POST /api/webhooks/komoju` - KOMOJU Webhook

### 管理機能
- `/api/admin/*` - 管理者向けAPI（認証必須）

## セキュリティ

- JWT認証によるアクセス制御
- ロールベースの権限管理（SUPER_ADMIN, ADMIN, ACCOUNTANT, VIEWER）
- CSRF対策
- XSS対策（React自動エスケープ + 追加対策）
- レート制限
- 入力値バリデーション（Zod）

## 開発コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 本番サーバー
npm start

# リント
npm run lint

# データベース操作
npm run db:push      # スキーマ反映
npm run db:migrate   # マイグレーション
npm run db:seed      # シード実行
npm run db:studio    # Prisma Studio起動
npm run db:reset     # リセット
```

## デプロイ

### Vercel

1. Vercelにプロジェクトをインポート
2. 環境変数を設定
3. デプロイ

### Docker

```bash
# イメージビルド
docker build -t seminar-system .

# コンテナ起動
docker run -p 3000:3000 --env-file .env seminar-system
```

## トラブルシューティング

### データベース接続エラー
- `DATABASE_URL`が正しく設定されているか確認
- SQLiteファイルの権限を確認

### メール送信エラー
- SendGrid APIキーの確認
- 送信元メールアドレスの認証状態確認

### 決済エラー
- KOMOJU APIキーの確認
- Webhook URLの設定確認

## ライセンス

MIT License

## 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成