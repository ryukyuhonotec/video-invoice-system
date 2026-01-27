
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log("Checking PartnerRoles...");
    try {
        const count = await prisma.partnerRole.count();
        console.log(`Total PartnerRoles: ${count}`);
        const roles = await prisma.partnerRole.findMany();
        console.log("Roles:", JSON.stringify(roles, null, 2));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
