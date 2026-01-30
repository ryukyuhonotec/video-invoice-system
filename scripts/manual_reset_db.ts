
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Cleaning up database...");

        // Transaction to ensure order doesn't matter as much or handled specifically
        // But simply deleting child to parent is safest

        // Delete Outsource first (dependency on Partner, PricingRule, InvoiceItem)
        await prisma.outsource.deleteMany({});

        // Delete InvoiceItem (dependency on Invoice)
        await prisma.invoiceItem.deleteMany({});

        // Delete Invoice (dependency on Client)
        await prisma.invoice.deleteMany({});

        // Delete Client (dependency on Staff - operationsLead, etc)
        await prisma.client.deleteMany({});

        // Delete Partner (dependency on PartnerRole - actually role is string, no FK strictness but logic exists)
        await prisma.partner.deleteMany({});

        // Delete PricingRule
        await prisma.pricingRule.deleteMany({});

        // Delete PartnerRole
        await prisma.partnerRole.deleteMany({});

        // Delete Staff
        await prisma.staff.deleteMany({});

        console.log("Database cleaned successfully.");
    } catch (e) {
        console.error("Cleanup failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
