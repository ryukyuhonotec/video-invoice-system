
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    console.log("Verifying data access...");

    // 1. Check Clients with Partners
    const clients = await prisma.client.findMany({
        include: { partners: true }
    });
    console.log(`Found ${clients.length} clients.`);
    clients.forEach(c => {
        console.log(`Client ${c.name} has ${c.partners.length} partners.`);
    });

    // 2. Check Partners with Clients
    const partners = await prisma.partner.findMany({
        include: { clients: true }
    });
    console.log(`Found ${partners.length} partners.`);
    partners.forEach(p => {
        console.log(`Partner ${p.name} (Role: ${p.role}) is linked to ${p.clients.length} clients.`);
    });

    // 3. Check PricingRules with targetRole
    const rules = await prisma.pricingRule.findMany({
        where: { targetRole: { not: null } }
    });
    console.log(`Found ${rules.length} rules with targetRole.`);
    rules.forEach(r => {
        console.log(`Rule ${r.name} targets role: ${r.targetRole}`);
    });

    // 4. Verify Pricing Actions logic (Test getClients equivalent)
    try {
        const testGetClients = await prisma.client.findMany({
            include: {
                pricingRules: {
                    include: {
                        partners: true
                    }
                },
                billingContact: true,
                operationsLead: true,
                accountant: true,
                partners: true, // This was the line causing lint error before
            },
            take: 1
        });
        console.log("testGetClients query successful.");
    } catch (e) {
        console.error("testGetClients query FAILED:", e);
    }
}

verify()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
