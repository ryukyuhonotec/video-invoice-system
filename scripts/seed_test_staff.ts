import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding test staff...');

    const operations = [
        { name: '佐藤 統括 (テスト)', email: 'ops1@test.com' },
        { name: '鈴木 統括 (テスト)', email: 'ops2@test.com' },
        { name: '高橋 統括 (テスト)', email: 'ops3@test.com' },
    ];

    const accountants = [
        { name: '田中 経理 (テスト)', email: 'acc1@test.com' },
        { name: '伊藤 経理 (テスト)', email: 'acc2@test.com' },
        { name: '渡辺 経理 (テスト)', email: 'acc3@test.com' },
    ];

    // Create Operations Staff
    for (const op of operations) {
        const existing = await prisma.staff.findFirst({
            where: { email: op.email }
        });

        if (!existing) {
            await prisma.staff.create({
                data: {
                    name: op.name,
                    email: op.email,
                    role: 'OPERATIONS',
                },
            });
            console.log(`Created Operations Staff: ${op.name}`);
        } else {
            console.log(`Skipped existing Operations Staff: ${op.name}`);
        }
    }

    // Create Accountants
    for (const acc of accountants) {
        const existing = await prisma.staff.findFirst({
            where: { email: acc.email }
        });

        if (!existing) {
            await prisma.staff.create({
                data: {
                    name: acc.name,
                    email: acc.email,
                    role: 'ACCOUNTING',
                },
            });
            console.log(`Created Accountant: ${acc.name}`);
        } else {
            console.log(`Skipped existing Accountant: ${acc.name}`);
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
