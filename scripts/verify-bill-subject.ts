
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBillSubject() {
    try {
        console.log("Attempting to create a Bill with subject...");
        const client = await prisma.client.findFirst();
        if (!client) {
            console.log("No client found");
            return;
        }

        const bill = await prisma.bill.create({
            data: {
                clientId: client.id,
                subject: "Subject Test",
                issueDate: new Date(),
                totalAmount: 1000,
                tax: 100,
                status: "ISSUED"
            }
        });
        console.log("Successfully created bill with subject:", bill);

        // Clean up
        await prisma.bill.delete({ where: { id: bill.id } });
    } catch (e) {
        console.error("Error creating bill:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkBillSubject();
