export const InvoiceStatusEnum = {
    DRAFT: '受注前',
    IN_PROGRESS: '進行中',
    DELIVERED: '納品済',
    BILLED: '請求書作成済', // Not strictly "Billed" (Sent), but Created
    SENT: '送付済',
    COMPLETED: '完了', // 途中終了含む
    LOST: '失注',
    PAID: '入金済み'
} as const;

export const TaskStatusEnum = {
    PRE_ORDER: '受注前',
    IN_PROGRESS: '制作中',
    CORRECTION: '修正中', // Added
    REVIEW: '確認中',
    DELIVERED: '納品済',
    BILLED: '請求済',
    PAID: '入金済み',
    COMPLETED: '完了'
} as const;

export const TaxRate = 0.1;
