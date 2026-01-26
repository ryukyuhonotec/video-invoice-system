export type PricingType = 'FIXED' | 'STEPPED' | 'LINEAR';

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

    clients?: Client[];
    partners?: Partner[];
    isDefault: boolean;
}

export interface Client {
    id: string;
    name: string;
    code?: string;
    email?: string;
    chatworkGroup?: string;
    billingContact?: string;
    website?: string;
    contactPerson?: string;
    sns1?: string;
    sns2?: string;
    sns3?: string;
    pricingRules?: PricingRule[];
}

export interface Partner {
    id: string;
    name: string;
    role: string;
    email?: string;
    chatworkGroup?: string;
    pricingRules?: PricingRule[];
    outsources?: Outsource[];
}

export interface Outsource {
    id: string;
    invoiceItemId: string;
    partnerId: string;
    partner?: Partner;
    amount: number;
    description?: string;
    status: string; // 未発注, 発注済, 完了, 支払済
    deliveryUrl?: string;
}

export interface Supervisor {
    id: string;
    name: string;
    email?: string;
}

export type InvoiceStatus = 'DRAFT' | 'Unbilled' | 'Billed' | 'Paid';
export type ProductionStatus = 'Pre-Order' | 'In Progress' | 'Review' | 'Delivered';

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    name: string;
    pricingRuleId?: string;
    pricingRule?: PricingRule;

    duration?: number;
    quantity: number;

    unitPrice: number;
    amount: number;

    outsources: Outsource[];

    productionStatus: ProductionStatus;
    deliveryDate?: string;
    deliveryUrl?: string;
}

export interface Invoice {
    id: string;
    clientId: string;
    supervisorId?: string;
    communicationChannel?: string;
    issueDate: string;
    dueDate?: string;
    status: InvoiceStatus;
    items: InvoiceItem[];

    subtotal: number;
    tax: number;
    totalAmount: number;

    totalCost: number;
    profit: number;
    profitMargin: number;
}
