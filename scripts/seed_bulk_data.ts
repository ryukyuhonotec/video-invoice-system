
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding bulk data...");

    // 1. Create 10 Partners
    const partners = [];
    for (let i = 1; i <= 10; i++) {
        const p = await prisma.partner.create({
            data: {
                name: `Bulk Partner ${i}`,
                role: "カメラマン",
                email: `partner${i}@bulk.test`,
                chatworkGroup: `https://chatwork.com/g/partner${i}`
            }
        });
        partners.push(p);
        console.log(`Created Partner: ${p.name}`);
    }

    // 2. Create 20 Pricing Rules
    const rules = [];
    for (let i = 1; i <= 20; i++) {
        const r = await prisma.pricingRule.create({
            data: {
                name: `Bulk Rule ${i}`,
                type: "FIXED",
                fixedPrice: 10000 + (i * 1000),
                fixedCost: 5000 + (i * 500),
                description: "Bulk generated rule"
            }
        });
        rules.push(r);
        console.log(`Created Rule: ${r.name}`);
    }

    // 3. Create 50 Invoices
    const clients = await prisma.client.findMany();
    const staffList = await prisma.staff.findMany();

    if (clients.length === 0) {
        throw new Error("No clients found. Please run Playwright test for clients first or create manually.");
    }

    const staff = staffList[0]; // Assign first staff

    for (let i = 1; i <= 50; i++) {
        const client = clients[i % clients.length];
        const status = i % 5 === 0 ? "PAID" : "DRAFT"; // Mix statuses

        await prisma.invoice.create({
            data: {
                clientId: client.id,
                staffId: staff?.id,
                status: status,
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
                totalAmount: 15000 + (i * 100),
                items: {
                    create: [
                        {
                            name: `Bulk Item ${i}`,
                            quantity: 1,
                            unitPrice: 15000 + (i * 100),
                            amount: 15000 + (i * 100),
                            outsources: {
                                create: [
                                    {
                                        partnerId: partners[i % partners.length].id,
                                        pricingRuleId: rules[i % rules.length].id,
                                        status: "受注前",
                                        revenueAmount: 15000 + (i * 100),
                                        costAmount: 5000
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        });
        console.log(`Created Invoice ${i} for Client ${client.name}`);
    }

    console.log("Bulk seeding complete.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
