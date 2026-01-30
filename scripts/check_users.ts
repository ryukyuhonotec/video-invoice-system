
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const staff = await prisma.staff.findMany();
    console.log("Staff available:", staff.length);
    staff.forEach(s => console.log(`- ${s.name} (${s.email}) Role: ${s.role}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
