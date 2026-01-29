# Video Invoice System (制作進行・請求管理システム)

動画制作事業に特化した、案件進行管理と請求書作成を統合したシステムです。
Next.js (App Router) と Prisma (SQLite) を使用して構築されています。

**現在のステータス**: Phase 35 (Completed) - Invoice Workflow & Bug Fixes

## <span class="emoji">🛠️</span> 使用技術 (Tech Stack)

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

## <span class="emoji">📚</span> 目次 (Table of Contents)
1. [プロジェクトについて](#-プロジェクトについて-about)
2. [ドキュメント](#-ドキュメント-documentation)
3. [環境](#-環境-environment)
4. [ディレクトリ構成](#-ディレクトリ構成-structure)
5. [環境構築](#-環境構築-setup)
6. [トラブルシューティング](#-トラブルシューティング-troubleshooting)

## <span class="emoji">📖</span> プロジェクトについて (About)

本システムは、動画制作会社の業務フローに特化した管理ツールです。

### 主な機能
- **案件・制作進行管理**: 見積もり、発注、納品、請求までの一元管理。
- **請求業務 (Billing)**: クライアントごとの「締め請求」と自動集計。
- **利益管理**: 原価計算と粗利のリアルタイム可視化。
- **マスター管理**: クライアント、パートナー、料金ルールの管理。

## <span class="emoji">📚</span> ドキュメント (Documentation)

詳細な設計情報やガイドラインは `docs/` ディレクトリに管理されています。

- **[概念設計 (Conceptual Design)](docs/CONCEPT.md)**
    - 業務フロー、案件と請求書の関係性について。
- **[データベース設計 (Database Schema)](docs/DB_SCHEMA.md)**
    - ER図、テーブル定義。
- **[既知の課題とロードマップ (Issues)](docs/ISSUES.md)**
    - 制限事項、今後の開発計画。
- **[開発ガイドライン (Development Guidelines)](docs/DEVELOPMENT.md)**
    - **必読**: コーディング規約、言語設定（日本語指定）、UI/UXルール。
- **[README 作成ガイドライン](docs/README_GUIDELINES.md)**
    - 本ドキュメントの記述ルール。

## <span class="emoji">💻</span> 環境 (Environment)

| 言語・フレームワーク | バージョン |
| --------------------- | ---------- |
| Node.js | v18.17.0+ |
| Next.js | 15+ (App Router) |
| React | 18+ |
| Prisma | 5+ |

## <span class="emoji">📂</span> ディレクトリ構成 (Structure)

```
.
├── src
│   ├── app         # Next.js App Router Pages
│   ├── components  # UI Components
│   │   ├── ui      # shadcn/ui generic components
│   │   └── ...     # Feature specific components
│   ├── lib         # Utilities
│   ├── actions     # Server Actions (Backend Logic)
│   └── types       # TypeScript Types
├── docs            # Project Documentation
├── prisma          # Database Schema & Migrations
└── public          # Static Assets
```

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
AUTH_SECRET="[random-string]" # User: `openssl rand -base64 32` to generate
# Google Auth (Dev: Optional, Prod: Required)
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
```

### 3. データベースのセットアップ
```bash
npx prisma generate
npx prisma db push
```

### 4. 開発サーバーの起動
```bash
npm run dev
```
http://localhost:3000 にアクセスして確認してください。

## <span class="emoji">🔧</span> トラブルシューティング (Troubleshooting)

### Q: `Error: Prisma Client has not been initialized.`
**A:** `npx prisma generate` を実行し、**開発サーバーを再起動** (`Ctrl+C` -> `npm run dev`) してください。

### Q: データベースの変更が反映されない
**A:** `npx prisma db push` を実行してください。

### Q: ログインできない / 認証エラー
**A:** `.env` の `AUTH_SECRET` が設定されているか確認してください。
