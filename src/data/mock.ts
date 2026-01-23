import { Client, Invoice, PricingRule, Partner } from "@/types";

export const MOCK_PRICING_RULES: PricingRule[] = [
    {
        id: "rule-standard-video",
        name: "標準動画制作 (Standard)",
        type: "STEPPED",
        steps: [
            { upTo: 1, price: 10000 },
            { upTo: 2, price: 15000 },
            { upTo: 3, price: 20000 },
        ],
        // After 3 minutes, add 5000 per 1 minute
        incrementThreshold: 3,
        incrementalUnit: 1,
        incrementalUnitPrice: 5000,
    },
    {
        id: "rule-shorts",
        name: "ショート動画 (Under 60s)",
        type: "FIXED",
        fixedPrice: 8000,
        description: "Fixed price for any video under 1 minute",
    },
    {
        id: "rule-fixed-mng",
        name: "ディレクション費 (Fixed)",
        type: "FIXED",
        fixedPrice: 30000,
    }
];

export const MOCK_CLIENTS: Client[] = [
    {
        id: "client-a",
        name: "株式会社ClientA",
        defaultPricingRules: ["rule-standard-video", "rule-fixed-mng"],
    },
    {
        id: "client-b",
        name: "合同会社ClientB",
        defaultPricingRules: ["rule-shorts"],
    }
];

export const MOCK_PARTNERS: Partner[] = [
    {
        id: "p-001",
        name: "山田 太郎",
        role: "カメラマン",
        costRules: [
            {
                id: "cost-p001-std",
                partnerId: "p-001",
                name: "標準撮影費用",
                type: "FIXED",
                fixedPrice: 15000 // Base cost
            },
            {
                id: "cost-p001-clientA",
                partnerId: "p-001",
                clientId: "client-a", // Special rate for Client A
                name: "Client A 特別撮影費",
                type: "FIXED",
                fixedPrice: 12000
            }
        ]
    },
    {
        id: "p-002",
        name: "鈴木 花子",
        role: "エディター",
        costRules: [
            {
                id: "cost-p002-std",
                partnerId: "p-002",
                name: "標準編集費用",
                type: "STEPPED",
                steps: [
                    { upTo: 5, price: 5000 },
                    { upTo: 10, price: 8000 }
                ]
            }
        ]
    },
    { id: "p-003", name: "佐藤 次郎", role: "ディレクター" },
];

export const MOCK_INVOICES: Invoice[] = [
    {
        id: "inv-001",
        clientId: "client-a",
        issueDate: "2024-05-01",
        status: "Unbilled",
        subtotal: 0,
        tax: 0,
        totalAmount: 0,
        totalCost: 0,
        profit: 0,
        profitMargin: 0,
        items: [
            {
                id: "item-1",
                invoiceId: "inv-001",
                name: "社長インタビュー",
                pricingRuleId: "rule-standard-video",
                duration: 2.5,
                quantity: 1,
                unitPrice: 0,
                amount: 0,
                productionStatus: "In Progress",
                deliveryDate: "2024-05-20",
                assignedPartnerId: "p-001"
            }
        ]
    }
];
