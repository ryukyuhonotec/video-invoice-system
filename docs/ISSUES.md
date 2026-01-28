# 既知の課題とロードマップ (Issues & Roadmap)

現在のシステムにおける既知の課題、制限事項、および将来的な改善計画をまとめます。

## 重要: 開発時の注意点 (High Priority)

### 1. Prismaスキーマ変更時の反映
- **現象**: `schema.prisma` を変更して `prisma generate` を実行しても、開発サーバー (`npm run dev`) がキャッシュされた古いクライアント情報を使い続けるため、エラーが発生することがあります（例: `Cannot read properties of undefined`）。
- **対策**: スキーマ変更後は、必ず開発サーバーを **再起動** してください。

## 既知の課題 (Known Issues)

### 請求書 (Bill) 機能の成熟度
- **現状**:
    - `BillingDashboard` で選択した案件をまとめて `Bill` を作成する機能はありますが、作成後の編集や詳細なPDFレイアウト調整機能が不足しています。
    - キャンセル/削除フローが未実装です（間違って作成した場合の取り消し）。
- **影響**: 運用ミスが発生した際のリカバリにDB操作が必要になる可能性があります。

### 権限管理の粒度
- **現状**:
    - `User` モデルに `role` (OWNER/STAFF) がありますが、実際のコード上のアクセス制御（Guard）は部分的にしか実装されていません。
    - 「自分の案件しか編集できない」等のロジックは実装済みですが、管理者が全案件を強制編集する機能などが明示的ではありません。

## ロードマップ (Future Roadmap)

### Phase 4: 高度な分析機能
- クライアント別、パートナー別の予実管理チャートの強化。
- 利益率の推移グラフ。

### Phase 5: 権限管理の強化 (RBAC)
- Admin, Manager, Member などの詳細なロール定義。
- NextAuthとMiddlewareを用いた厳密なページアクセス制御。

### Phase 6: PDF出力エンジンの刷新
- 現在の簡易的な請求書ビューから、よりプロフェッショナルなPDF生成ライブラリ（`react-pdf` 等）への移行。

## Refactoring & Quality Improvements (Code Review 2026-01-28)

These items were identified during a comprehensive code review to improve code quality from 70/100 to 100/100.

- [ ] **1. [Performance/Bug] Fix New Invoice Page**: Apply server-side options fetching to `src/app/invoices/new/page.tsx` (same fix as Edit page). Currently causes slow initial load and potential errors.
- [ ] **2. [Quality] Strict Typing**: Remove `any` from `InvoiceForm.tsx` components and Server Actions. Define proper interfaces for `masterData` and form state to prevent regression.
- [ ] **3. [Maintainability] Component Splitting**: Break down `InvoiceForm.tsx` (>800 lines) into smaller sub-components:
    - `InvoiceItemRow`
    - `OutsourceTaskRow`
    - `DeliveryInfoSection`
- [ ] **4. [Robustness] Status Enums**: Replace hardcoded status strings (`"受注前"`, `"納品済"`) with TypeScript Enums or Const Objects to prevent typo bugs.
- [ ] **5. [Integrity] Database Transactions**: Use `prisma.$transaction` in `upsertInvoice` to ensure that Invoice, Items, and AuditLogs are saved atomically.
- [ ] **6. [Performance] Memoization**: Wrap event handlers in `useCallback` to prevent unnecessary re-renders of the form on every keystroke.
- [ ] **7. [UX] Form Validation**: Replace `alert()` with proper inline validation (React Hook Form or Zod) to show errors before submission attempts.
- [ ] **8. [Design] Unified Error Handling**: Standardize Server Action responses to a `Result` type `{ success: boolean, data?: T, error?: string }` instead of throwing errors or returning null.
- [ ] **9. [Config] Magic Numbers**: Move constants like Tax Rate (`0.1`) and default strings to a configuration file (`src/config/constants.ts`).


## ストレステスト結果と改善案 (2026-01-29)

50件以上のデータを用いたストレステストおよびUI監査で特定された改善点を、優先度順に記載します。

### 🚨 クリティカル (安定性・操作性のために必須)

- [ ] **1. [UX/Perf] クライアント/パートナー一覧のページネーション**:
    - **課題**: 全レコード(50件以上)を一度に読み込んでいる。1000件を超えるとブラウザがクラッシュする恐れがある。
    - **修正**: サーバーサイドページネーション(1ページ10〜20件)を実装する。
- [ ] **2. [UX] 登録時のバリデーションフィードバック (重要)**:
    - **課題**: 必須項目が空のまま送信しても、エラーメッセージが表示されず無反応に見える。
    - **修正**: 画面上部にエラーサマリーを表示し、エラー箇所へ自動スクロールさせる。
- [ ] **3. [Bug] パートナー役割フィルタ**:
    - **課題**: フィルタのプルダウンが「ALL」しか表示されず、役割ごとの絞り込みができない。
    - **修正**: `PartnerList` コンポーネントのフィルタロジックを修正する。
- [ ] **4. [Safety] 料金ルールの削除安全性**:
    - **課題**: 削除ボタンを押すと確認なしで即座に削除される。誤操作によるデータ消失リスクが高い。
    - **修正**: `AlertDialog` による削除確認を追加する。
- [ ] **5. [UX] 請求書フォームのネイティブ選択肢**:
    - **課題**: ブラウザ標準の `<select>` では50件以上のリストから探すのが困難。
    - **修正**: 全ての選択肢を検索機能付きの `SearchableMultiSelect` (コンボボックス) に置き換える。
- [ ] **6. [Bug] 請求書タスクのパートナー選択**:
    - **課題**: 新しいタスク行を追加した際、パートナー選択のプルダウンが空になる。
    - **修正**: 新規行に対して適切に `partners` データが渡されるよう修正する。

### ⚠️ 高優先度 (UXと効率化)

- [ ] **7. [UX] 階段式料金UIの分かりにくさ**:
    - **課題**: 金額入力欄にラベルがなく、「〜分迄」というロジックも硬直的で分かりにくい。
    - **修正**: ヘッダーラベルを追加し、「〜以上」などの柔軟なロジックを検討する。
- [ ] **8. [UX] パートナー役割作成フロー**:
    - **課題**: 新しい役割を追加しても自動で選択状態にならず、再度クリックする必要がある。
    - **修正**: 作成と同時にチェックボックスがオンになるようにする。
- [ ] **9. [UX] バリデーション時のスクロール**:
    - **課題**: 保存失敗時に、エラーが発生している入力欄へスクロールされない。
    - **修正**: `scrollToError` (エラー箇所へのスクロール) を実装する。
- [ ] **10. [UI] ボタンのフィードバック**:
    - **課題**: 「追加」「保存」ボタンを押した際、ローディング表示(スピナー等)がなく処理中か分からない。
    - **修正**: `disabled` および `loading` ステートを追加する。
- [ ] **11. [L10n] 日本語化不足**:
    - **課題**: "PAID", "Fixed", "Revenue" など、画面の一部が英語のままになっている。
    - **修正**: UI上の用語を全て日本語に統一する。
- [ ] **12. [UI] 合計金額の視認性**:
    - **課題**: 請求書が長くなると、最下部の合計金額が見えなくなる。
    - **修正**: 画面下部(または上部)に合計金額を固定表示する。

### ℹ️ 中・低優先度 (ブラッシュアップ)

- [ ] **13. [UI] メールリンクの有効化**: メールアドレスをクリック可能(`mailto:`)にする。
- [ ] **14. [UI] ボタンの色分け**: 「追加」(青/グレー)と「保存」(緑/メイン色)を明確に区別する。
- [ ] **15. [UI] 空の状態表示**: データがない場合、真っ白ではなく「データが見つかりません」等を表示する。
- [ ] **16. [UI] アクティブなサイドバー**: 現在のページがサイドバー上で明確に分かるようにする。
- [ ] **17. [UI] 赤字のコンテキスト表示**: 利益がマイナスの場合、ツールチップ等で内訳(売上-原価)を表示する。
