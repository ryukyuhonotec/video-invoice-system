
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Owner Staff...");
    const email = "s.ono@honotec-movie.com";

    // Create Owner Staff
    await prisma.staff.upsert({
        where: { email: email }, // Assuming email is unique or we find by something else. Actually checking schema.
        // Schema: email String? (not unique). id is PK.
        // But logic usually relies on email mapping.
        // Let's check update criteria.
        // If exact email match doesn't exist, create.
        update: {
            role: 'OWNER'
        },
        create: {
            name: "Shogo Ono",
            email: email,
            role: 'OWNER'
        }
    });

    // Also create a test client so dashboard isn't empty? User said "Data nothing put in".
    // I will leave it clean except for the owner, so they can start fresh.
    console.log("Owner seeded.");
}

// Schema check: Staff.email is not @unique in the schema I viewed?
// Schema: email String?
// But I can findFirst.
// Actually upsert needs a unique field in 'where'. 
// Staff doesn't have unique email.
// I'll do findFirst then update/create.

async function mainSafe() {
    const email = "s.ono@honotec-movie.com";
    const existing = await prisma.staff.findFirst({ where: { email } });
    if (existing) {
        await prisma.staff.update({
            where: { id: existing.id },
            data: { role: 'OWNER' }
        });
        console.log("Updated existing staff to OWNER");
    } else {
        await prisma.staff.create({
            data: {
                name: "Shogo Ono",
                email: email,
                role: "OWNER"
            }
        });
        console.log("Created NEW Owner Staff");
    }
}

mainSafe()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
