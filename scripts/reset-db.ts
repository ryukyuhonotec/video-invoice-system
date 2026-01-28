
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Starting database reset...');

    // Delete in order of dependency (Leaf nodes first)

    // 1. Transactional Data
    await tryDelete('AuditLog', () => prisma.auditLog.deleteMany());
    await tryDelete('Outsource', () => prisma.outsource.deleteMany());
    await tryDelete('InvoiceItem', () => prisma.invoiceItem.deleteMany());
    await tryDelete('Invoice', () => prisma.invoice.deleteMany());
    await tryDelete('Bill', () => prisma.bill.deleteMany());
    await tryDelete('ClientContact', () => prisma.clientContact.deleteMany());

    // 2. Master Data Links (M:N relations handled by cascading deletes usually, but manual clear is safer if constraints exist)
    // Prisma handles implicit M:N tables automatically when deleting the entities.

    // 3. Master Data
    await tryDelete('PricingRule', () => prisma.pricingRule.deleteMany());
    await tryDelete('Partner', () => prisma.partner.deleteMany());
    await tryDelete('PartnerRole', () => prisma.partnerRole.deleteMany());
    await tryDelete('Client', () => prisma.client.deleteMany());

    // Optional: Staff (Keep if you want to preserve staff settings, but deleting ensuring clean state)
    await tryDelete('Staff', () => prisma.staff.deleteMany());

    console.log('✅ Database reset complete.');
}

async function tryDelete(name: string, deleteFn: () => Promise<any>) {
    try {
        const { count } = await deleteFn();
        console.log(` - Deleted ${count} records from ${name}`);
    } catch (error) {
        console.error(`❌ Failed to delete ${name}:`, error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
