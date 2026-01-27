
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedData() {
    console.log("Clearing existing data...");

    // Clear data in correct order (respecting foreign keys)
    await prisma.outsource.deleteMany({});
    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.bill.deleteMany({});
    await prisma.pricingRule.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.staff.deleteMany({});
    await prisma.partner.deleteMany({});
    await prisma.partnerRole.deleteMany({});

    console.log("Seeding data...");

    // 0. Seed Staff (for client assignment)
    const staffData = [
        { id: "staff-ops-1", name: "山田 太郎", email: "yamada@example.com", role: "OPERATIONS" },
        { id: "staff-ops-2", name: "佐々木 花子", email: "sasaki@example.com", role: "OPERATIONS" },
        { id: "staff-acc-1", name: "中村 経理", email: "nakamura@example.com", role: "ACCOUNTING" },
    ];

    for (const s of staffData) {
        await prisma.staff.upsert({ where: { id: s.id }, update: {}, create: s });
    }

    // 0.5. Seed Partner Roles
    const roles = ["ディレクター", "カメラマン", "エディター", "運用者", "ライター", "デザイナー", "アニメーター", "ナレーター"];
    for (const role of roles) {
        await prisma.partnerRole.upsert({
            where: { name: role },
            update: {},
            create: { name: role }
        });
    }

    // 1. Seed Partners

    const partnerData = [
        { id: "p1", name: "株式会社ビジョン制作", role: "ディレクター", email: "vision@example.com" },
        { id: "p2", name: "佐藤 健二", role: "カメラマン", email: "sato@example.com" },
        { id: "p3", name: "田中 美咲", role: "運用者", email: "tanaka@example.com" },
        { id: "p4", name: "鈴木 一郎", role: "エディター", email: "suzuki@example.com" },
        { id: "p5", name: "高橋 誠", role: "ディレクター", email: "taka@example.com" },
        { id: "p6", name: "伊藤 淳", role: "カメラマン", email: "ito@example.com" },
        { id: "p7", name: "渡辺 直美", role: "ディレクター", email: "naomi@example.com" },
        { id: "p8", name: "小林 茂", role: "エディター", email: "koba@example.com" },
    ];

    for (const p of partnerData) {
        await prisma.partner.upsert({ where: { id: p.id }, update: {}, create: p });
    }

    // 2. Seed Clients (with staff assignments)
    const clientData = [
        { id: "c1", name: "株式会社サンシャイン (小売)", email: "sun@example.com", operationsLeadId: "staff-ops-1", accountantId: "staff-acc-1" },
        { id: "c2", name: "テックフロンティア (IT)", email: "tech@example.com", operationsLeadId: "staff-ops-2" },
        { id: "c3", name: "未来教育アカデミー (教育)", email: "edu@example.com", operationsLeadId: "staff-ops-1" },
        { id: "c4", name: "グローバルヘルス (医療)", email: "med@example.com" },
        { id: "c5", name: "アーバン不動産", email: "urban@example.com" },
    ];

    for (const c of clientData) {
        await prisma.client.upsert({ where: { id: c.id }, update: {}, create: c });
    }

    // 3. Seed Pricing Rules (with client/partner connections)
    await prisma.pricingRule.upsert({
        where: { id: "rule-standard" },
        update: {},
        create: {
            id: "rule-standard",
            name: "標準制作パック",
            type: "FIXED",
            fixedPrice: 150000,
            fixedCost: 80000,
            isDefault: true,
            clients: { connect: [{ id: "c1" }, { id: "c2" }] },
            partners: { connect: [{ id: "p1" }] }
        }
    });

    await prisma.pricingRule.upsert({
        where: { id: "rule-stepped" },
        update: {},
        create: {
            id: "rule-stepped",
            name: "動画尺変動ルール",
            type: "STEPPED",
            steps: JSON.stringify([{ upTo: 5, price: 50000 }, { upTo: 10, price: 90000 }, { upTo: 30, price: 200000 }]),
            costSteps: JSON.stringify([{ upTo: 5, price: 30000 }, { upTo: 10, price: 50000 }, { upTo: 30, price: 120000 }]),
            isDefault: false,
            clients: { connect: [{ id: "c3" }] },
            partners: { connect: [{ id: "p2" }, { id: "p4" }] }
        }
    });

    await prisma.pricingRule.upsert({
        where: { id: "rule-premium" },
        update: {},
        create: {
            id: "rule-premium",
            name: "プレミアム撮影プラン",
            type: "FIXED",
            fixedPrice: 300000,
            fixedCost: 180000,
            isDefault: false,
            clients: { connect: [{ id: "c4" }, { id: "c5" }] }
        }
    });

    // 4. Seed Invoices (Many Delivered Items for Monthly Billing Test)
    const statuses = ["受注前", "制作中", "確認中", "納品済", "請求済", "入金済み"];

    // Create 30 invoices spread across clients
    for (let i = 0; i < 30; i++) {
        const client = clientData[i % 5]; // Rotate clients

        let status = statuses[i % statuses.length];

        // Ensure C1 and C2 have multiple "Unbilled Delivered" items
        if (i < 10) {
            status = "納品済";
        }

        const isDelivered = status === "納品済" || status === "請求済" || status === "入金済み";
        const now = new Date();
        const issueDate = new Date(now);
        issueDate.setDate(now.getDate() - (i * 2)); // Spread dates

        await prisma.invoice.create({
            data: {
                clientId: client.id,
                status: isDelivered ? (status === "請求済" || status === "入金済み" ? "Billed" : "Unbilled") : "DRAFT",
                issueDate: issueDate,
                // Invoice level delivery date
                actualDeliveryDate: isDelivered ? issueDate : null,
                requestUrl: `https://chatwork.com/#!rid${Date.now()}-${i}`,
                deliveryUrl: isDelivered ? `https://drive.google.com/drive/u/0/folders/${i}` : null,
                items: {
                    create: {
                        name: `案件 ${i + 1}: ${client.name} PR動画`,
                        productionStatus: status,
                        amount: 150000 + (i * 1000),
                        quantity: 1,
                        outsources: {
                            create: [
                                {
                                    pricingRule: { connect: { id: "rule-standard" } },
                                    partner: { connect: { id: "p1" } },
                                    revenueAmount: 150000 + (i * 1000),
                                    costAmount: 80000,
                                    deliveryDate: isDelivered ? issueDate : null,
                                    description: "編集作業",
                                    status: isDelivered ? "納品済" : "制作中"
                                }
                            ]
                        }
                    }
                },
                totalAmount: (150000 + (i * 1000)) * 1.1,
                tax: (150000 + (i * 1000)) * 0.1,
                subtotal: 150000 + (i * 1000)
            }
        });
    }

    console.log("Seeding complete.");
}

seedData()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
