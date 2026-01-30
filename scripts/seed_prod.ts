
import prisma from "../src/lib/db"; // Use the centralized instance with Adapter support

async function main() {
    console.log("Seeding Production Master Data...");

    // 1. Partner Roles (Essential)
    const roles = ["ディレクター", "カメラマン", "エディター", "運用者", "ライター", "デザイナー", "アニメーター", "ナレーター"];
    for (const role of roles) {
        await prisma.partnerRole.upsert({
            where: { name: role },
            update: {},
            create: { name: role }
        });
    }
    console.log("Partner Roles seeded.");

    // 2. Default Pricing Rules (Optional but helpful)
    // Basic Fixed Rule
    await prisma.pricingRule.upsert({
        where: { id: "rule-standard-default" }, // Fixed ID for checking availability
        update: {},
        create: {
            name: "標準制作パック (サンプル)",
            description: "基本料金プランのテンプレートです",
            type: "FIXED",
            fixedPrice: 150000,
            fixedCost: 80000,
            isDefault: true,
            targetRole: "ディレクター"
        }
    });

    // Basic Stepped Rule
    await prisma.pricingRule.upsert({
        where: { id: "rule-duration-default" },
        update: {},
        create: {
            name: "動画尺連動 (サンプル)",
            description: "動画の長さに応じて金額が変わる設定のサンプルです",
            type: "STEPPED",
            steps: JSON.stringify([{ upTo: 5, price: 50000 }, { upTo: 10, price: 90000 }, { upTo: 30, price: 200000 }]),
            costSteps: JSON.stringify([{ upTo: 5, price: 30000 }, { upTo: 10, price: 50000 }, { upTo: 30, price: 120000 }]),
            isDefault: false,
            targetRole: "エディター"
        }
    });
    console.log("Sample Pricing Rules seeded.");

    console.log("Production Seed Complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
