
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const partners = await prisma.partner.findMany();
    console.log("Partners:");
    partners.forEach((p: any) => {
        console.log(`ID: ${p.id}, Name: ${p.name}, Role: ${p.role}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
