
import prisma from "../src/lib/db";

// Wrapper to handle findFirst if upsert fails on non-unique
async function main() {
    const email = "s.ono@honotec-movie.com";
    console.log(`Promoting ${email} to OWNER...`);

    const existing = await prisma.staff.findFirst({ where: { email } });

    if (existing) {
        await prisma.staff.update({
            where: { id: existing.id },
            data: { role: "OWNER" }
        });
        console.log(`Updated existing staff ${existing.name} to OWNER`);
    } else {
        await prisma.staff.create({
            data: {
                name: "Shogo Ono",
                email,
                role: "OWNER"
            }
        });
        console.log(`Created new OWNER staff record`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
