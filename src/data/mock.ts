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
        isDefault: true,
    },
    {
        id: "rule-shorts",
        name: "ショート動画 (Under 60s)",
        type: "FIXED",
        fixedPrice: 8000,
        description: "Fixed price for any video under 1 minute",
        isDefault: false,
    },
    {
        id: "rule-fixed-mng",
        name: "ディレクション費 (Fixed)",
        type: "FIXED",
        fixedPrice: 30000,
        isDefault: false,
    }
];

export const MOCK_CLIENTS: Client[] = [
    {
        id: "client-a",
        name: "株式会社ClientA",
        billingContact: "経理 佐藤様",
    },
    {
        id: "client-b",
        name: "合同会社ClientB",
    }
];

export const MOCK_PARTNERS: Partner[] = [
    {
        id: "p-001",
        name: "山田 太郎",
        role: "カメラマン",
        email: "yamada@example.com",
        chatworkGroup: "https://www.chatwork.com/g/example-group-1",
    },
    {
        id: "p-002",
        name: "鈴木 花子",
        role: "エディター",
        email: "suzuki@example.com",
        chatworkGroup: "https://www.chatwork.com/g/example-group-2",
    },
    { id: "p-003", name: "佐藤 次郎", role: "ディレクター", email: "sato@example.com" },
    { id: "p-004", name: "高橋 経理", role: "経理", email: "takahashi@example.com", chatworkGroup: "https://www.chatwork.com/g/accounting" },
];



export const MOCK_INVOICES: Invoice[] = [
    {
        id: "inv-001",
        clientId: "client-a",
        staffId: undefined,
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
                duration: "2.5", // changed to string as per schema
                quantity: 1,
                unitPrice: 0,
                amount: 0,
                productionStatus: "In Progress",
                outsources: [
                    {
                        id: "o-1",
                        invoiceItemId: "item-1",
                        pricingRuleId: "rule-standard-video",
                        partnerId: "p-001",
                        revenueAmount: 0,
                        costAmount: 15000,
                        deliveryDate: "2024-05-20",
                        status: "Ordered"
                    }
                ]
            }
        ]
    }
];
