
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Resetting BUSINESS DATA ONLY (Keeping Users/Staff)...");

    // Order matters due to foreign keys

    // 1. Transactional Data
    console.log("Deleting Outsource tasks...");
    await prisma.outsource.deleteMany({});

    console.log("Deleting Invoice Items...");
    await prisma.invoiceItem.deleteMany({});

    console.log("Deleting Audit Logs...");
    await prisma.auditLog.deleteMany({});

    console.log("Deleting Invoices...");
    await prisma.invoice.deleteMany({});

    console.log("Deleting Bills...");
    await prisma.bill.deleteMany({});

    console.log("Deleting Client Contact History...");
    await prisma.clientContact.deleteMany({});

    // 2. Master Data Links (M:N) linkage handling?
    // Prisma deleteMany on models handles implicit M:N table cleanup usually, 
    // BUT explicit M:N relations might need care?
    // PricingRule <-> Client/Partner is implicit. 
    // Prisma usually handles implicit M:N cleanup when parent is deleted.

    // 3. Master Data
    console.log("Deleting Pricing Rules...");
    await prisma.pricingRule.deleteMany({});

    console.log("Deleting Clients...");
    await prisma.client.deleteMany({});

    console.log("Deleting Partners...");
    await prisma.partner.deleteMany({});

    console.log("Deleting Partner Roles...");
    await prisma.partnerRole.deleteMany({});

    console.log("Deleting Invitations (Optional, keeping creates cleanliness)...");
    await prisma.staffInvitation.deleteMany({});

    console.log(">>> BUSINESS DATA RESET COMPLETE <<<");
    console.log("Users and Staff records were PRESERVED.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
