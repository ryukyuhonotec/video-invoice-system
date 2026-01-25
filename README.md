# 動画制作案件管理システム (Video Production Invoice System)

動画制作会社向けの案件管理・見積・請求書作成システムです。クライアント管理、パートナー管理、料金ルール設定、複数外注先への発注管理を一元化し、利益計算を自動化します。

## 🎯 主要機能

### ✅ 実装済み機能

- **クライアント管理**: 取引先企業の情報管理（連絡先、SNS、Chatworkグループ等）
- **パートナー管理**: 外注先（エディター、ディレクター、経理等）の管理
- **料金ルール管理**: 
  - 固定料金・段階料金・増分料金の3パターンに対応
  - **多対多（M:N）関係**: 1つのルールを複数のクライアント・パートナーに適用可能
- **案件作成・編集**:
  - 品目ごとに複数の外注先をアサイン可能
  - リアルタイムで売上・原価・利益を自動計算
  - 制作ステータス管理（発注前・制作中・レビュー中・納品済み）
- **ダッシュボード**: 進行中案件の一覧表示とフィルタリング（クライアント・統括・担当者別）
- **データベース統合**: Prisma + SQLite による永続化

### 🚧 今後の実装予定

- エンドツーエンドのブラウザテスト自動化
- 請求書PDF出力機能
- 売上・利益レポート機能
- ユーザー認証・権限管理

## 🛠 技術スタック

- **フレームワーク**: [Next.js 16](https://nextjs.org/) (App Router)
- **言語**: TypeScript
- **データベース**: SQLite (開発環境) / Prisma ORM
- **UI**: React + Tailwind CSS
- **状態管理**: React Hooks (useState, useEffect)
- **バリデーション**: クライアントサイドバリデーション

## 📦 セットアップ

### 前提条件

- Node.js 18.x 以上
- npm または yarn

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/ryukyuhonotec/video-invoice-system.git
cd video-invoice-system

# 依存関係のインストール
npm install

# 環境変数の設定
echo 'DATABASE_URL="file:/absolute/path/to/video-invoice-system/prisma/dev.db"' > .env

# データベースのマイグレーション
npx prisma db push
npx prisma generate

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 📁 プロジェクト構成

```
video-invoice-system/
├── prisma/
│   ├── schema.prisma          # データベーススキーマ定義
│   └── dev.db                 # SQLiteデータベース（開発用）
├── src/
│   ├── actions/
│   │   └── pricing-actions.ts # Server Actions（CRUD操作）
│   ├── app/
│   │   ├── page.tsx           # ダッシュボード
│   │   ├── clients/           # クライアント管理ページ
│   │   ├── partners/          # パートナー管理ページ
│   │   ├── pricing-rules/     # 料金ルール管理ページ
│   │   └── invoices/
│   │       ├── new/           # 新規案件作成
│   │       └── [id]/          # 案件編集
│   ├── components/
│   │   ├── InvoiceForm.tsx    # 案件作成・編集フォーム
│   │   └── ui/                # 共通UIコンポーネント
│   ├── lib/
│   │   ├── db.ts              # Prismaクライアント
│   │   └── pricing.ts         # 料金計算ロジック
│   ├── types/
│   │   └── index.ts           # TypeScript型定義
│   └── data/
│       └── mock.ts            # モックデータ（開発用）
├── .env                       # 環境変数
└── package.json
```

## 🗄 データモデル

### 主要エンティティ

- **Client**: クライアント企業
- **Partner**: 外注パートナー
- **PricingRule**: 料金ルール（M:N で Client/Partner と関連）
- **Invoice**: 案件（請求書）
- **InvoiceItem**: 案件の品目
- **Outsource**: 品目ごとの外注先アサイン（複数可）

### リレーション図（概要）

```
Client ←──M:N──→ PricingRule ←──M:N──→ Partner
   ↓                                        ↓
Invoice                                  Outsource
   ↓                                        ↑
InvoiceItem ─────────────────────────────┘
```

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクション起動
npm start

# Prismaスキーマの同期
npx prisma db push

# Prisma Clientの再生成
npx prisma generate

# データベースのリセット（注意: 全データ削除）
rm prisma/dev.db && npx prisma db push
```

## 🐛 既知の問題

- ブラウザテストでタイムアウトが発生する場合があります（開発サーバーの再起動で解決）
- 大量データでのパフォーマンス最適化が未実施

## 📝 ライセンス

MIT License

## 👥 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずIssueで議論してください。

---

**開発者**: Ryukyu Hono Tec  
**リポジトリ**: https://github.com/ryukyuhonotec/video-invoice-system
