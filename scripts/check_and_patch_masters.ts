
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const clientCount = await prisma.client.count();
        const partnerCount = await prisma.partner.count();
        const ruleCount = await prisma.pricingRule.count();

        console.log(`Clients: ${clientCount} / 15`);
        console.log(`Partners: ${partnerCount} / 20`);
        console.log(`Rules: ${ruleCount} / 30`);

        // Patch Rules if missing
        if (ruleCount < 10) { // If very few, seed them
            console.log("Seeding missing rules via Prisma...");
            for (let i = ruleCount + 1; i <= 30; i++) {
                await prisma.pricingRule.create({
                    data: {
                        name: `Fallback Rule ${i}`,
                        type: "FIXED",
                        fixedPrice: 20000,
                        fixedCost: 10000
                    }
                });
            }
            console.log("Rules patched.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
