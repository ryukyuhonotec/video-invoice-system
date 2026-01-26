# Video Production Invoice System (制作進行・請求管理システム)

動画制作事業に特化した、案件進行管理と請求書作成を統合したシステムです。
Next.js (App Router) と Prisma (SQLite) を使用して構築されています。

## <span class="emoji">🚀</span> 機能概要

### 1. 案件・制作進行管理
- **ダッシュボード**: 進行中の案件、納期、担当者を一覧表示。
- **ステータス管理**: Pre-Order, InProgress, Review, Delivered, Paid などのステータスで進捗を可視化。
- **発注管理**: 1つの品目に対し、複数のパートナー（エディター、ナレーター、ディレクターなど）をアサインし、個別の発注金額を管理可能。

### 2. クライアント・パートナー管理
- **クライアント管理**: 会社情報、担当者、適用される料金ルールの管理。
- **パートナー管理**: クリエイター情報の管理、役割（Role）の設定。

### 3. 計算ロジック・料金ルール
- **料金ルール (Pricing Rules)**: クライアントごとに異なる単価設定や計算ロジック（固定、ステップ、増減）を定義し、適用可能。
- **自動計算**: ルールに基づいた売上、外注費、粗利のリアルタイム計算。

## <span class="emoji">🛠️</span> 技術スタック

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM) (Formerly SQLite)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS
- **Server Actions**: バックエンドロジックの統合

## <span class="emoji">⚙️</span> 環境構築 (Setup)

### 1. リポジトリのクローン
```bash
git clone https://github.com/ryukyuhonotec/video-invoice-system.git
cd video-invoice-system
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
`.env` ファイルを作成し、データベース(Postgres)の接続情報とGoogle認証情報を設定してください。
```bash
# .env
# Database (PostgreSQL connection string)
DATABASE_URL="postgresql://user:password@localhost:5432/video_invoice_db"

# Auth Secrets (Google OAuth)
AUTH_SECRET="[random-string]"
AUTH_GOOGLE_ID="[your-google-client-id]"
AUTH_GOOGLE_SECRET="[your-google-client-secret]"
```

### 4. データベースのセットアップ
```bash
npx prisma generate
npx prisma db push
```

### 5. 開発サーバーの起動
```bash
npm run dev
```
http://localhost:3000 にアクセスして確認してください。

## <span class="emoji">📂</span> ディレクトリ構成
- `src/app`: Next.js App Router ページ
- `src/components`: UIコンポーネント (shadcn/ui 含)
- `src/actions`: Server Actions (データ操作ロジック)
- `src/lib`: ユーティリティ、DBクライアント
- `prisma`: データベーススキーマ、シードデータ

## <span class="emoji">📝</span> 現在のフェーズ
**Phase 4: Multi-Relation & Detailed Outsource Management**
多対多のリレーション構造への移行と、詳細な外注費管理機能の実装・検証段階です。
