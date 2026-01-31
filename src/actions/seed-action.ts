"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

// Helper to generate random item from array
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Japanese name generators
const lastNames = ["田中", "山田", "鈴木", "佐藤", "高橋", "渡辺", "伊藤", "中村", "小林", "加藤", "吉田", "山本", "松本", "井上", "木村", "林", "斎藤", "清水", "山口", "阿部"];
const firstNames = ["太郎", "花子", "一郎", "美咲", "健太", "さくら", "翔太", "愛", "大輔", "真由美", "拓也", "麻衣", "龍一", "彩", "誠", "優子", "圭", "舞", "隼人", "沙織"];

const companyTypes = ["株式会社", "合同会社", "有限会社", ""];
const companyNames = ["サンシャイン", "テックフロンティア", "未来教育", "グローバル", "アーバン", "スター", "ネクスト", "プライム", "クリエイト", "デジタルワークス", "フィールド", "ホープ", "ビジョン", "ソリューション", "イノベーション", "メディア", "クラウド", "アドバンス", "スマート", "エコシステム"];
const industries = ["IT", "不動産", "教育", "医療", "小売", "製造", "飲食", "美容", "建設", "金融", "広告", "旅行", "物流", "エネルギー", "農業"];

const partnerRoles = ["ディレクター", "カメラマン", "エディター", "運用者", "ライター", "デザイナー", "アニメーター", "ナレーター", "MA", "翻訳者"];

const taskCategories = ["PR動画", "採用動画", "商品紹介", "サービス紹介", "イベント撮影", "インタビュー", "チュートリアル", "SNS広告", "YouTube動画", "企業VP"];

export async function seedData() {
    console.log("Clearing existing data...");

    // Clear data in correct order (respecting foreign keys)
    await prisma.outsource.deleteMany({});
    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.bill.deleteMany({});
    await prisma.pricingRule.deleteMany({});
    await prisma.client.deleteMany({});  // Must delete clients before staff (FK from client to staff)
    await prisma.staff.deleteMany({});   // Added: clear staff for clean slate
    await prisma.partner.deleteMany({});

    console.log("Seeding comprehensive data...");

    // =====================
    // 1. Seed Staff (3 Operations + 3 Accounting = 6 total)
    // =====================
    const staffData = [
        { id: "staff-ops-1", name: "山田 太郎", email: "yamada@honotec.com", role: "OPERATIONS" },
        { id: "staff-ops-2", name: "佐藤 花子", email: "sato@honotec.com", role: "OPERATIONS" },
        { id: "staff-ops-3", name: "高橋 健太", email: "takahashi@honotec.com", role: "OPERATIONS" },
        { id: "staff-acc-1", name: "中村 経子", email: "nakamura@honotec.com", role: "ACCOUNTING" },
        { id: "staff-acc-2", name: "小林 美咲", email: "kobayashi@honotec.com", role: "ACCOUNTING" },
        { id: "staff-acc-3", name: "渡辺 一郎", email: "watanabe@honotec.com", role: "ACCOUNTING" },
    ];

    for (const s of staffData) {
        await prisma.staff.create({ data: s });
    }
    console.log(`Created ${staffData.length} staff members`);

    // =====================
    // 2. Seed Partners (50 total)
    // =====================
    const partnerIds: string[] = [];
    for (let i = 0; i < 50; i++) {
        const id = `partner-${i + 1}`;
        partnerIds.push(id);
        const name = `${pick(lastNames)} ${pick(firstNames)}`;
        await prisma.partner.create({
            data: {
                id,
                name: i % 5 === 0 ? `${pick(companyTypes)}${pick(companyNames)}制作` : name,
                role: pick(partnerRoles),
                email: `partner${i + 1}@example.com`,
                position: i % 3 === 0 ? "フリーランス" : (i % 5 === 0 ? "代表取締役" : null),
                chatworkGroup: i % 2 === 0 ? `https://www.chatwork.com/#!rid${100000 + i}` : null,
                description: i % 4 === 0 ? "ベテランクリエイター。納期厳守。" : null
            }
        });
    }
    console.log(`Created ${partnerIds.length} partners`);

    // =====================
    // 3. Seed Clients (50 total)
    // =====================
    const clientIds: string[] = [];
    for (let i = 0; i < 50; i++) {
        const id = `client-${i + 1}`;
        clientIds.push(id);
        const companyType = pick(companyTypes);
        const companyName = pick(companyNames);
        const industry = pick(industries);
        await prisma.client.create({
            data: {
                id,
                name: `${companyType}${companyName}${i > 25 ? industry : ""}`,
                code: `C${String(i + 1).padStart(4, '0')}`,
                email: `client${i + 1}@example.com`,
                website: i % 3 === 0 ? `https://${companyName.toLowerCase()}.co.jp` : null,
                contactPerson: `${pick(lastNames)} 様`,
                chatworkGroup: i % 2 === 0 ? `https://www.chatwork.com/#!rid${200000 + i}` : null,
                description: i % 5 === 0 ? `${industry}業界のリーディングカンパニー。` : null,
                operationsLeadId: pick(staffData.filter(s => s.role === "OPERATIONS")).id,
                accountantId: i % 2 === 0 ? pick(staffData.filter(s => s.role === "ACCOUNTING")).id : null,
                sns1: i % 4 === 0 ? `https://www.youtube.com/@${companyName.toLowerCase()}` : null,
                sns2: i % 6 === 0 ? `https://twitter.com/${companyName.toLowerCase()}` : null,
            }
        });
    }
    console.log(`Created ${clientIds.length} clients`);

    // =====================
    // 4. Seed Pricing Rules (50 total) with client/partner connections
    // =====================
    const ruleIds: string[] = [];
    const ruleTypes = ["FIXED", "STEPPED", "LINEAR"];

    for (let i = 0; i < 50; i++) {
        const id = `rule-${i + 1}`;
        ruleIds.push(id);
        const type = ruleTypes[i % 3];
        const baseName = pick(taskCategories);
        let data: any = {
            id,
            name: `${baseName}ルール${i + 1}`,
            type,
            isDefault: i === 0,
            description: `${baseName}の料金設定。`,
        };

        // Set pricing based on type
        if (type === "FIXED") {
            data.fixedPrice = randomInt(50, 500) * 1000;
            data.fixedCost = Math.floor(data.fixedPrice * (0.4 + Math.random() * 0.3));
        } else if (type === "STEPPED") {
            data.steps = JSON.stringify([
                { upTo: 5, price: randomInt(30, 80) * 1000 },
                { upTo: 10, price: randomInt(80, 150) * 1000 },
                { upTo: 30, price: randomInt(150, 300) * 1000 }
            ]);
            data.costSteps = JSON.stringify([
                { upTo: 5, price: randomInt(15, 40) * 1000 },
                { upTo: 10, price: randomInt(40, 80) * 1000 },
                { upTo: 30, price: randomInt(80, 160) * 1000 }
            ]);
        } else { // LINEAR
            data.incrementalUnit = 60;
            data.incrementalUnitPrice = randomInt(5, 20) * 1000;
            data.incrementThreshold = 60;
            data.incrementalCostUnit = 60;
            data.incrementalCostPrice = Math.floor(data.incrementalUnitPrice * 0.5);
            data.incrementalCostThreshold = 60;
        }

        // Connect to random clients (1-3)
        const connectedClients = [];
        const numClients = randomInt(1, 3);
        for (let j = 0; j < numClients; j++) {
            connectedClients.push({ id: clientIds[randomInt(0, clientIds.length - 1)] });
        }

        // Connect to random partners (1-2)
        const connectedPartners = [];
        const numPartners = randomInt(1, 2);
        for (let j = 0; j < numPartners; j++) {
            connectedPartners.push({ id: partnerIds[randomInt(0, partnerIds.length - 1)] });
        }

        await prisma.pricingRule.create({
            data: {
                ...data,
                clients: { connect: connectedClients },
                partners: { connect: connectedPartners }
            }
        });
    }
    console.log(`Created ${ruleIds.length} pricing rules`);

    // =====================
    // 5. Seed Invoices with Tasks (100 total)
    // =====================
    const statuses = ["受注前", "制作中", "確認中", "納品済", "請求済", "入金済み"];
    const now = new Date();

    for (let i = 0; i < 100; i++) {
        const clientId = clientIds[i % clientIds.length];

        // Distribute statuses (more delivered for billing tests)
        let status = statuses[i % statuses.length];
        if (i < 20) status = "納品済"; // First 20 are unbilled delivered
        if (i >= 80 && i < 90) status = "請求済";
        if (i >= 90) status = "入金済み";

        const isDelivered = ["納品済", "請求済", "入金済み"].includes(status);
        const isPaid = status === "入金済み";
        const isBilled = status === "請求済" || isPaid;

        // Spread dates across last 6 months
        const daysAgo = randomInt(1, 180);
        const issueDate = new Date(now);
        issueDate.setDate(now.getDate() - daysAgo);

        // Financial calculations
        const basePrice = randomInt(50, 300) * 1000;
        const costAmount = Math.floor(basePrice * (0.4 + Math.random() * 0.25));
        const subtotal = basePrice;
        const tax = Math.floor(subtotal * 0.1);
        const totalAmount = subtotal + tax;
        const profit = subtotal - costAmount;
        const profitMargin = (profit / subtotal) * 100;

        // Pick a random rule and partner for the task
        const ruleId = ruleIds[randomInt(0, ruleIds.length - 1)];
        const partnerId = partnerIds[randomInt(0, partnerIds.length - 1)];
        const category = pick(taskCategories);

        await prisma.invoice.create({
            data: {
                clientId,
                status: isPaid ? "入金済み" : (isBilled ? "請求済" : (isDelivered ? "納品済" : "DRAFT")),
                issueDate,
                actualDeliveryDate: isDelivered ? issueDate : null,
                requestUrl: `https://chatwork.com/#!rid${300000 + i}`,
                deliveryUrl: isDelivered ? `https://drive.google.com/drive/u/0/folders/invoice-${i + 1}` : null,
                staffId: pick(staffData.filter(s => s.role === "OPERATIONS")).id,
                items: {
                    create: {
                        name: `${category} - 案件${i + 1}`,
                        productionStatus: status,
                        amount: subtotal,
                        quantity: 1,
                        deliveryUrl: isDelivered ? `https://drive.google.com/file/d/item-${i + 1}` : null,
                        outsources: {
                            create: [{
                                pricingRuleId: ruleId,
                                partnerId: partnerId,
                                revenueAmount: subtotal,
                                costAmount: costAmount,
                                deliveryDate: isDelivered ? issueDate : null,
                                duration: `${randomInt(1, 15)}:${String(randomInt(0, 59)).padStart(2, '0')}`,
                                description: `${category}の${pick(["編集", "撮影", "制作", "ディレクション"])}作業`,
                                status: status,
                                deliveryUrl: isDelivered ? `https://drive.google.com/file/d/task-${i + 1}` : null
                            }]
                        }
                    }
                },
                totalAmount,
                tax,
                subtotal,
                totalCost: costAmount,
                profit,
                profitMargin
            }
        });
    }
    console.log("Created 100 invoices with tasks");

    revalidatePath('/');
    revalidatePath('/billing');
    revalidatePath('/clients');
    revalidatePath('/partners');
    revalidatePath('/pricing-rules');
    console.log("Seeding complete.");
}

export async function seedTestStaff() {
    console.log("Seeding test staff...");
    const operations = [
        { name: '佐藤 統括 (テスト)', email: 'ops1@test.com' },
        { name: '鈴木 統括 (テスト)', email: 'ops2@test.com' },
        { name: '高橋 統括 (テスト)', email: 'ops3@test.com' },
    ];

    const accountants = [
        { name: '田中 経理 (テスト)', email: 'acc1@test.com' },
        { name: '伊藤 経理 (テスト)', email: 'acc2@test.com' },
        { name: '渡辺 経理 (テスト)', email: 'acc3@test.com' },
    ];

    for (const op of operations) {
        const existing = await prisma.staff.findFirst({ where: { email: op.email } });
        if (!existing) {
            await prisma.staff.create({
                data: { name: op.name, email: op.email, role: 'OPERATIONS' }
            });
        }
    }

    for (const acc of accountants) {
        const existing = await prisma.staff.findFirst({ where: { email: acc.email } });
        if (!existing) {
            await prisma.staff.create({
                data: { name: acc.name, email: acc.email, role: 'ACCOUNTING' }
            });
        }
    }

    revalidatePath('/staff');
    console.log("Test staff seeding complete.");
}
