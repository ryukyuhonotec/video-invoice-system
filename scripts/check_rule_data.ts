
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Pricing Rules Data...");
    const rules = await prisma.pricingRule.findMany({
        where: { type: "PERFORMANCE" },
    });
    console.log("Found Performance Rules:", rules);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
