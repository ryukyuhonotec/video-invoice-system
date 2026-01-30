
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Adding dummy staff...");

    // Check if exists to avoid duplicates if run multiple times
    const existing = await prisma.staff.findFirst({
        where: { email: "accountant@example.com" }
    });

    if (existing) {
        console.log("Dummy staff already exists:", existing);
        return;
    }

    const dummy = await prisma.staff.create({
        data: {
            name: "田中 経理 (Dummy)",
            email: "accountant@example.com",
            role: "ACCOUNTING"
            // userId is omitted/null
        }
    });

    console.log("Created dummy staff:", dummy);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
