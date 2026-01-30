
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const clients = await prisma.client.count();
    const partners = await prisma.partner.count();
    const rules = await prisma.pricingRule.count();
    const invoices = await prisma.invoice.count();

    console.log("Current Counts:");
    console.log(`Clients: ${clients}`);
    console.log(`Partners: ${partners}`);
    console.log(`Rules: ${rules}`);
    console.log(`Invoices: ${invoices}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
