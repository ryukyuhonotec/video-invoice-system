# Video Invoice System (制作進行・請求管理システム)

動画制作事業に特化した、案件進行管理と請求書作成を統合したシステムです。
Next.js (App Router) と Prisma (SQLite) を使用して構築されています。

## <span class="emoji">📚</span> ドキュメント (Documentation)

詳細な設計情報は `docs/` ディレクトリにあります。

- **[概念設計 (Conceptual Design)](docs/CONCEPT.md)**
    - **必読**: 「案件 (Project/Invoice)」と「請求書 (Monthly Bill)」の違い、業務フローについて解説しています。
- **[データベース設計 (Database Schema)](docs/DB_SCHEMA.md)**
    - 各モデルの役割とリレーションの定義。
- **[既知の課題とロードマップ (Issues)](docs/ISSUES.md)**
    - 現在の制限事項、開発時の注意点、将来の計画。

## <span class="emoji">🚀</span> 機能概要

### 1. 案件・制作進行管理 (Project Management)
- **案件 (Invoice/Job)**: 1つの制作案件単位での管理。
- **ダッシュボード**: 進行中の案件、納期、担当者を一覧表示。
- **ステータス管理**: 受注前, 進行中, 納品済, 請求書作成済 などのステータス遷移。
- **見積・原価管理**: 品目とタスクごとの予算作成と原価管理。

### 2. 請求業務 (Billing)
- **月次請求**: クライアントごとの「締め請求」に対応。納品済みの案件をまとめて1枚の請求書 (`Bill`) を発行。
- **入金管理**: 請求書ごとの入金ステータス管理。

### 3. マスター管理
- **クライアント・パートナー管理**: 取引先情報の管理。
- **料金ルール (Pricing Rules)**: クライアント/パートナーごとの自動計算ロジック。

## <span class="emoji">🛠️</span> 技術スタック

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma ORM)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS
- **Auth**: NextAuth.js (v5)

## <span class="emoji">⚙️</span> 環境構築 (Setup)

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env` ファイルを作成し、必要な変数を設定してください。
```bash
# .env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="[random-string]"
# Google Auth (Optional for Dev, Required for Prod)
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
```

### 3. データベースのセットアップ
```bash
npx prisma generate
npx prisma db push
```

> [!IMPORTANT]
> **開発時の注意**: `schema.prisma` を変更して `prisma generate` を実行した後は、**必ず開発サーバーを再起動** (`Ctrl+C` -> `npm run dev`) してください。
> 再起動しない場合、Prismaクライアントが更新されずエラーになることがあります。

### 4. 開発サーバーの起動
```bash
npm run dev
```
http://localhost:3000 にアクセスして確認してください。

## <span class="emoji">📝</span> 現在のフェーズ
**Phase 35 (Completed): Invoice Workflow & Bug Fixes**
- スタッフ招待機能の修正
- 請求書作成・送付フローの改善
- UI/UXの改善（金額表示、バリデーション等）
