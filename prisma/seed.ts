import { PrismaClient } from '@prisma/client';
import { MOCK_CLIENTS, MOCK_PARTNERS, MOCK_SUPERVISORS } from '../src/data/mock';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // Seed Partners
    for (const p of MOCK_PARTNERS) {
        const partner = await prisma.partner.upsert({
            where: { id: p.id },
            update: {},
            create: {
                id: p.id,
                name: p.name,
                role: p.role,
                email: p.email,
                chatworkGroup: p.chatworkGroup,
            },
        });
        console.log(`Created/Updated partner: ${partner.name}`);
    }

    // Seed Supervisors
    for (const s of MOCK_SUPERVISORS) {
        const supervisor = await prisma.supervisor.upsert({
            where: { id: s.id },
            update: {},
            create: {
                id: s.id,
                name: s.name,
                email: s.email,
            },
        });
        console.log(`Created/Updated supervisor: ${supervisor.name}`);
    }

    // Seed Clients
    for (const c of MOCK_CLIENTS) {
        // Attempt to lookup billing contact by name if possible, or skip
        // Mock data has names like "High Bridge Acc" or similar.
        // We will just create client without relation for now.

        const client = await prisma.client.upsert({
            where: { id: c.id },
            update: {},
            create: {
                id: c.id,
                name: c.name,
                code: c.code,
                email: c.email,
                website: c.website,
                contactPerson: c.contactPerson,
                chatworkGroup: c.chatworkGroup,
                sns1: c.sns1,
                sns2: c.sns2,
                sns3: c.sns3,
                billingContactId: undefined
            },
        });
        console.log(`Created/Updated client: ${client.name}`);
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
