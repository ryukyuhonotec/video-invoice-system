
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Functional Audit Data (Edge Cases & Compelx Rules)...");

    // 1. Long Text Data (Edge Case for Layout)
    const longNameClient = await prisma.client.create({
        data: {
            name: "株式会社長い名前のクライアント名５０文字以上テスト株式会社長い名前のクライアント名５０文字以上テスト",
            description: "これは非常に長い説明文のテストです。改行が含まれている場合や、長い文字列がどのように表示されるかを確認するためのデータです。レイアウト崩れがないかチェックしてください。",
        }
    });
    console.log("Created Long Text Client:", longNameClient.id);

    const longNamePartner = await prisma.partner.create({
        data: {
            name: "山田 太郎（長い肩書きテスト５０文字以上テスト５０文字以上テスト）",
            email: "longname@test.com",
            role: "ディレクター兼カメラマン兼エディター兼アシスタント",
        }
    });
    console.log("Created Long Text Partner:", longNamePartner.id);

    // 2. Performance Pricing Rule (Scenario A)
    // Revenue: 20%, Cost: 10%
    // Note: Attempting to save `percentage` and `costPercentage`. 
    // If schema is missing these, this will fail, confirming the bug.
    try {
        const perfRule = await prisma.pricingRule.create({
            data: {
                name: "YouTube Revenue Share (20%)",
                type: "PERFORMANCE",
                description: "売上の20%を報酬とする",
                percentage: 20,       // Requires schema update
                costPercentage: 10,   // Requires schema update
            }
        });
        console.log("Created Performance Rule:", perfRule.name);
    } catch (e: any) {
        console.error("Failed to create Performance Rule (Schema mismatch?):", e.message);
    }

    // 3. Step Pricing Rule (Scenario B)
    // 0-10min: 5000, 10-20min: 10000
    const stepRule = await prisma.pricingRule.create({
        data: {
            name: "Volume Editing (Step)",
            type: "STEPPED",
            description: "10分まで5000円、以降10分ごとに+5000円",
            steps: JSON.stringify([
                { upTo: 10, price: 5000 },
                { upTo: 20, price: 10000 }
            ]),
            costSteps: JSON.stringify([
                { upTo: 10, price: 3000 },
                { upTo: 20, price: 6000 }
            ])
        }
    });
    console.log("Created Step Rule:", stepRule.name);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
