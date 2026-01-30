export type PricingType = 'FIXED' | 'STEPPED' | 'LINEAR' | 'PERFORMANCE';

export interface PricingStep {
    upTo: number; // Duration in minutes
    price: number;
}

export interface PricingRule {
    id: string;
    name: string;
    description?: string;
    type: PricingType;

    // Revenue
    fixedPrice?: number;
    steps?: string | PricingStep[];
    incrementalUnit?: number;
    incrementalUnitPrice?: number;
    incrementThreshold?: number;

    // Cost (NEW)
    fixedCost?: number;
    costSteps?: string | PricingStep[];
    incrementalCostUnit?: number;
    incrementalCostPrice?: number;
    incrementalCostThreshold?: number;

    // Performance (NEW)
    percentage?: number; // Revenue %
    costPercentage?: number; // Cost %

    clients?: Client[];
    partners?: Partner[];
    targetRole?: string; // NEW: Role based filtering (e.g. "EDITOR", "DESIGNER")
    isDefault: boolean;
}

export interface Client {
    id: string;
    name: string;
    code?: string;
    email?: string;
    chatworkGroup?: string;
    billingContactId?: string;
    billingContact?: Partner;
    website?: string;
    contactPerson?: string;
    description?: string;
    isArchived?: boolean;

    // Staff Roles
    operationsLeadId?: string;
    operationsLead?: Staff;
    accountantId?: string;
    accountant?: Staff;

    sns1?: string;
    sns2?: string;
    sns3?: string;
    pricingRules?: PricingRule[];
    partners?: Partner[]; // NEW: Direct Client-Partner links
    contractSigned?: boolean;
    contractUrl?: string;
}

export interface Partner {
    id: string;
    name: string;
    role: string;
    email?: string;
    chatworkGroup?: string;
    position?: string;
    description?: string;
    pricingRules?: PricingRule[];
    clients?: Client[]; // NEW: Direct Client-Partner links
    outsources?: Outsource[];
    isArchived?: boolean;
    contractSigned?: boolean;
    contractUrl?: string;
}

export interface PartnerRole {
    id: string;
    name: string;
}

// Outsource = TaskAssignment (タスク/担当領域)
export interface Outsource {
    id: string;
    invoiceItemId: string;

    // 料金ルール（担当領域）
    pricingRuleId?: string;
    pricingRule?: PricingRule;

    // パートナー
    partnerId?: string;
    partner?: Partner;

    // 金額
    revenueAmount: number;  // 請求額（このタスク分）
    costAmount: number;     // 原価（パートナーへの発注額）

    // 納期
    deliveryDate?: string;
    duration?: string; // 尺 (mm:ss)
    performanceTargetValue?: number; // 成果対象額 (売上/広告消化額)

    // ステータス
    status: string; // 受注前, 制作中, 確認中, 納品済, 請求済, 入金済み

    description?: string;
    deliveryUrl?: string;
    deliveryNote?: string;
}

export interface Staff {
    id: string;
    name: string;
    email?: string;
    role: 'OPERATIONS' | 'ACCOUNTING';
}

export type InvoiceStatus = 'DRAFT' | 'Unbilled' | 'Billed' | 'Paid' | '請求済' | '入金済み' | '受注前' | '進行中' | '制作中' | '修正中' | '確認中' | '納品済' | '請求書作成済' | '送付済' | '完了' | '失注';
export type ProductionStatus = '受注前' | '制作中' | '修正中' | '確認中' | '納品済' | '請求済' | '入金済み' | 'Pre-Order' | 'In Progress' | 'Review' | 'Delivered';

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    name: string;

    // pricingRuleId removed - now managed per task in outsources

    duration?: string;  // 全体の尺
    quantity: number;

    unitPrice: number;  // 合計請求額（全タスクの合計）
    amount: number;

    outsources: Outsource[];  // タスク（担当領域）のリスト

    productionStatus: ProductionStatus;  // Legacy
    deliveryUrl?: string;
}

export interface Invoice {
    id: string;
    clientId: string;
    client?: Client;
    staffId?: string;
    staff?: Staff;
    communicationChannel?: string;
    issueDate: string;
    dueDate?: string;
    actualDeliveryDate?: string;
    deliveryUrl?: string;
    requestUrl?: string;
    status: InvoiceStatus;
    items: InvoiceItem[];

    subtotal: number;
    tax: number;
    totalAmount: number;

    totalCost: number;
    profit: number;
    profitMargin: number;
}

export type ActionResponse<T = any> = {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
    details?: any; // Validation errors etc
};
