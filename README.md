# Video Invoice System (制作進行・請求管理システム)

動画制作事業に特化した、案件進行管理と請求書作成を統合したシステムです。
Next.js (App Router) と Prisma (SQLite/Postgres) を使用して構築されており、高速なパフォーマンスと直感的なUIを提供します。

**現在のステータス**: Active Development - Performance Optimization Completed

## <span class="emoji">🛠️</span> 使用技術 (Tech Stack)

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

## <span class="emoji">📚</span> 目次 (Table of Contents)
1. [プロジェクトについて](#-プロジェクトについて-about)
2. [機能一覧](#-機能一覧-features)
3. [ドキュメント](#-ドキュメント-documentation)
4. [環境](#-環境-environment)
5. [ディレクトリ構成](#-ディレクトリ構成-structure)
6. [環境構築](#-環境構築-setup)
7. [トラブルシューティング](#-トラブルシューティング-troubleshooting)

## <span class="emoji">📖</span> プロジェクトについて (About)

本システムは、動画制作会社の業務フローに特化した管理ツールです。
複雑な料金計算（従量課金、成果報酬、階段式料金など）を自動化し、案件の進行状況と連動した請求管理を実現します。

## <span class="emoji">✨</span> 機能一覧 (Features)

### 1. 案件・請求管理
- **案件一覧**: ステータス管理、検索、フィルタリング。
- **請求書作成 (Client Invoice)**: 複数の案件をまとめた「締め請求」に対応。PDF自動生成。
- **自動計算**: 消費税（10%）、源泉徴収税（10.21%）の自動計算と端数処理（切り捨て）。

### 2. 料金ルールエンジン (Pricing Engine)
- **柔軟な料金設定**:
    - **固定料金**: シンプルな単価設定。
    - **階段式料金**: 再生時間や工数に応じた段階的な料金変動。
    - **成果報酬**: 成果（例: 広告運用額）に対するパーセンテージ報酬。
    - **従量課金**: 単位時間（分）ごとのリニアな料金計算。
- **適用範囲**: 「全社共通ルール」と「特定クライアント/パートナー専用ルール」を設定可能。

### 3. スタッフ・パートナー管理
- **スタッフダッシュボード**: 自分の担当案件、今月の売上見込み、ToDoを一元管理。
- **パートナー管理**: 外部パートナー（カメラマン、エディター）の情報とスキル、原価ルールの管理。
- **招待システム**: 招待リンクによるスタッフ登録フロー。
- **権限管理**:
    - **Owner/Operations**: 全機能へのアクセス。
    - **Accounting**: 請求・支払管理のみ。
    - **Staff**: 自身の担当案件のみ。

### 4. パフォーマンス最適化
- **Server Components**: データ取得をサーバーサイドで並列実行し、初期表示を高速化。
- **Loading UI**: ページ遷移時の即時フィードバック（スケルトン表示）。
- **Client Logic Separation**: インタラクティブな操作のみをクライアントサイドで処理し、バンドルサイズを削減。

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

## <span class="emoji">💻</span> 環境 (Environment)

| 言語・フレームワーク | バージョン |
| --------------------- | ---------- |
| Node.js | v18.17.0+ |
| Next.js | 15+ (App Router) |
| React | 19+ (RC) |
| Prisma | 5+ |

## <span class="emoji">📂</span> ディレクトリ構成 (Structure)

```
.
├── src
│   ├── app         # Next.js App Router Pages (Server Components)
│   ├── components  # UI Components
│   │   ├── ui      # shadcn/ui generic components
│   │   ├── forms   # Application forms
│   │   └── ...     
│   ├── lib         # Utilities (PDF generation, Formatters)
│   ├── actions     # Server Actions (Backend Logic)
│   └── types       # TypeScript Types
├── docs            # Project Documentation
├── prisma          # Database Schema & Migrations
├── scripts         # Database Seeding Scripts
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
DATABASE_URL="file:./dev.db" # Or Postgres URL
AUTH_SECRET="[random-string]" # Use `openssl rand -base64 32`
# Google Auth (Dev: Optional, Prod: Required)
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
```

### 3. データベースのセットアップ
```bash
npx prisma generate
npx prisma db push
```

### 4. 初期データの投入 (Seeding)
開発用のダミーデータ（スタッフ、クライアント、案件など）を投入します。
```bash
npm run seed:bulk
```

### 5. 開発サーバーの起動
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
**A:** `.env` の `AUTH_SECRET` が設定されているか確認してください。開発環境ではダミーログインが有効になっている場合があります（要確認）。
