# 開発ガイドライン (Development Guidelines)

本ドキュメントは、`video-invoice-system` の開発における**絶対的なルールと定義**をまとめたものです。
開発者は本ドキュメントの内容を遵守し、一貫性のある高品質なコードベースを維持してください。

## 1. 基本方針 (Core Principles)

### 言語設定 (Language)
- **UI (ユーザーインターフェース)**: **完全日本語**。
    - ユーザー向けのメッセージ、ボタン、ラベル等はすべて自然な日本語で記述すること。
- **コードコメント**: **日本語指定（必須）**。
    - ロジックの説明、TODO、JSDocなどは日本語で記述する。
    - 英語のコメントは、外部ライブラリの型定義など避けられない場合を除き禁止とする。
- **変数名・関数名**: 英語 (CamelCase / PascalCase)。
    - 意味が明確で、推測しやすい命名を行うこと。

### デザイン・UX (Design Aesthetics)
- **"Rich & Premium"**: 管理画面であっても、無機質なデザインは避ける。
    - **shadcn/ui** + **Tailwind CSS** をベースに、洗練された配色と余白を使用する。
    - アニメーション（`framer-motion` や `tailwindcss-animate`）を適度に取り入れ、操作に対するフィードバックを豊かにする。
- **直感的な操作性**:
    - 処理中 (`Loading...`)、成功、エラーの状態をユーザーに明確に伝える。
    - 空の状態 (Empty State) には、単なる「データなし」ではなく、次に行うべきアクションを提示する。

## 2. 実装ルール (Implementation Rules)

### 技術スタック (Tech Stack)
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **UI Component**: shadcn/ui (Radix UI base)
- **Icon**: Lucide React
- **Database**: SQLite (Prisma ORM)

### ディレクトリ構成 (Structure)
- `src/app`: ページコンポーネント (Next.js App Router)
- `src/components`: 再利用可能なUIコンポーネント
    - `src/components/ui`: shadcn/ui の基本コンポーネント (ボタン、入力フォーム等)
    - `src/components/[feature]`: 機能特化のコンポーネント (例: `invoice-form`)
- `src/lib`: ユーティリティ、ヘルパー関数
- `src/actions`: Server Actions (DB操作などのバックエンドロジック)
- `src/types`: TypeScript型定義

### エラーハンドリング (Error Handling)
- ユーザー向けの操作でエラーが発生した場合、`toast` (Sonner) 等を用いて、「何が起きたか」と「どうすればよいか」を通知する。
- フォームのバリデーションエラーは、該当箇所の近くに表示し、かつ自動スクロール等でユーザーを誘導する。

## 3. ワークフロー (Workflow)

### ブランチ運用
- `main`: プロダクション用ブランチ。常にデプロイ可能な状態を保つ。
- `feature/[feature-name]`: 新機能開発・改修用。
- Pull Request を経由してマージする。

### コミットメッセージ
- Conventional Commits に準拠する。
    - `feat`: 新機能
    - `fix`: バグ修正
    - `docs`: ドキュメントのみの変更
    - `style`: コードの意味に影響しない変更 (空白、フォーマット等)
    - `refactor`: バグ修正も機能追加も行わないコード変更

## 4. 定義・用語集 (Definitions)

- **案件 (Invoice/Job)**: 1つの制作単位。見積もり〜納品〜請求待ちの状態までを管理。
- **請求書 (Bill)**: クライアントごとの月次請求書。複数の「案件」をまとめて1つの「請求書」にする。
- **パートナー (Partner)**: 外部委託先（カメラマン、エディター等）。
- **料金ルール (Pricing Rule)**: クライアントへの請求単価や、パートナーへの発注単価の計算ロジック。
