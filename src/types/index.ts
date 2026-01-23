export type PricingType = 'FIXED' | 'STEPPED' | 'LINEAR';

export interface PricingStep {
    upTo: number; // Duration in minutes
    price: number;
}

export interface PricingRule {
    id: string;
    name: string; // e.g., "Pattern A Fee"
    description?: string;
    type: PricingType;

    // For fixed items (e.g., "Base Management Fee")
    fixedPrice?: number;

    // For stepped (e.g., 0-1min: 10000, 1-2min: 20000)
    steps?: PricingStep[];

    // For incremental logic (e.g., After 3min, +5000 per 1min)
    // Can be combined with steps: Steps define 0-3min, then this applies
    incrementalUnit?: number; // per X minutes
    incrementalUnitPrice?: number;
    incrementThreshold?: number; // Applies after this duration
}

export interface Client {
    id: string;
    name: string;
    code?: string;
    email?: string;
    defaultPricingRules?: string[]; // IDs of PricingRules applicable to this client
}

export interface PartnerCostRule extends PricingRule {
    partnerId: string;
    clientId?: string; // If set, only applies to this client
}

export interface Partner {
    id: string;
    name: string;
    role: string; // Cameraman, Editor, etc.
    costRules?: PartnerCostRule[];
}

export type InvoiceStatus = 'DRAFT' | 'Unbilled' | 'Billed' | 'Paid';
export type ProductionStatus = 'Pre-Order' | 'In Progress' | 'Review' | 'Delivered';

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    name: string; // Item name, e.g. "Product Video - Pattern A"
    pricingRuleId?: string; // which rule determined the price

    duration?: number; // in minutes, user input
    quantity: number;

    unitPrice: number; // calculated or manual
    amount: number; // unitPrice * quantity

    assignedPartnerId?: string; // Partner doing the work
    cost?: number; // Associated cost (external)

    productionStatus: ProductionStatus;
    deliveryDate?: string; // ISO Date YYYY-MM-DD
}

export interface Invoice {
    id: string;
    clientId: string;
    issueDate: string; // YYYY-MM-DD
    dueDate?: string; // YYYY-MM-DD
    status: InvoiceStatus;
    items: InvoiceItem[];

    subtotal: number;
    tax: number;
    totalAmount: number;

    totalCost: number;
    profit: number;
    profitMargin: number;
}
