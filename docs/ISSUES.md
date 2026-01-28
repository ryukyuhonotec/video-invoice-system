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
- [ ] **10. [UX] Confirmation Dialogs**: Add confirmation dialogs for destructive actions like removing a Task or Item.
