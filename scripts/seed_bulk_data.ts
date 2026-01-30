
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get random item
const random = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
    try {
        console.log("Seeding 500 Invoices...");

        const clients = await prisma.client.findMany();
        const partners = await prisma.partner.findMany();
        const rules = await prisma.pricingRule.findMany();
        const staff = await prisma.staff.findMany();

        if (clients.length === 0 || partners.length === 0 || rules.length === 0) {
            throw new Error("Master data missing. Run master seed first.");
        }

        const statuses = ["DRAFT", "IN_PROGRESS", "DELIVERED", "PAID"];
        // Weighted: Draft(10%), InProgress(30%), Delivered(40%), Paid(20%)

        for (let i = 1; i <= 500; i++) {
            const client = random(clients);
            const opsStaff = staff.find(s => s.role === 'OPERATIONS') || staff[0];

            // Determine Status
            const r = Math.random();
            let status = "DRAFT";
            if (r > 0.1) status = "IN_PROGRESS";
            if (r > 0.4) status = "DELIVERED";
            if (r > 0.8) status = "PAID"; // Actually status string might be "請求済" or "入金済み" in UI/Logic, DB stores ENUM?
            // Schema says String @default("DRAFT").
            // Code uses constants: InvoiceStatusEnum.
            // Let's use the Values seen in InvoiceForm: "受注前", "制作中", "納品済", "請求済", "入金済み"?
            // Wait, InvoiceForm.tsx: status is passed as argument, constants likely map.
            // Let's stick to DRAFT, IN_PROGRESS etc if backend supports mapped or raw.
            // Schema default "DRAFT".
            // Let's assume standard values.

            // "受注前" = DRAFT?
            // "制作中" = IN_PROGRESS?
            // "納品済" = DELIVERED?
            // "請求済" = CLAIMED?
            // "入金済み" = PAID?

            // To be safe, I'll use the english codes if the app handles them (Prisma schema default is "DRAFT").

            const itemPrice = randomInt(5, 50) * 10000; // 50k to 500k

            // Dates
            const now = new Date();
            const issueDate = new Date(now.getFullYear(), now.getMonth(), randomInt(1, 28)); // This month

            const invoice = await prisma.invoice.create({
                data: {
                    clientId: client.id,
                    staffId: opsStaff?.id,
                    status: status, // Using English codes for now
                    issueDate: issueDate,
                    subtotal: itemPrice,
                    tax: itemPrice * 0.1,
                    totalAmount: itemPrice * 1.1,
                    totalCost: itemPrice * 0.6, // approx
                    profit: itemPrice * 0.4,
                    profitMargin: 40,
                    items: {
                        create: {
                            name: `Production Service #${i}`,
                            quantity: 1,
                            unitPrice: itemPrice,
                            amount: itemPrice,
                            outsources: {
                                create: {
                                    partnerId: random(partners).id,
                                    pricingRuleId: random(rules).id,
                                    revenueAmount: itemPrice,
                                    costAmount: itemPrice * 0.6,
                                    status: "PRE_ORDER" // Task status
                                }
                            }
                        }
                    }
                }
            });

            if (i % 50 === 0) console.log(`Created ${i} Invoices...`);
        }

        console.log("Seeding Complete.");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
