
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Large Scale Seeding...');

    // 1. Create Partners (20+)
    const partners = [];
    const roles = ["Editor", "Cameraman", "Designer", "Director", "Sound Engineer"];

    for (let i = 1; i <= 20; i++) {
        partners.push(await prisma.partner.create({
            data: {
                name: `Partner ${i} (${roles[i % roles.length]})`,
                role: roles[i % roles.length],
                email: `partner${i}@example.com`,
                position: i % 3 === 0 ? "Senior" : "Junior",
                description: "Auto-generated partner for stress testing.",
            }
        }));
    }
    console.log(`✅ Created ${partners.length} Partners`);

    // 2. Create Pricing Rules (Mix of Generic and Individual)
    const rules = [];
    // Generic
    rules.push(await prisma.pricingRule.create({
        data: { name: "Generic Editing Basic", type: "FIXED", fixedPrice: 5000, fixedCost: 3000, clients: {}, partners: {} }
    }));
    rules.push(await prisma.pricingRule.create({
        data: { name: "Generic Editing Pro", type: "FIXED", fixedPrice: 15000, fixedCost: 8000, clients: {}, partners: {} }
    }));

    console.log(`✅ Created General Rules`);

    // 3. Create Clients (50+)
    for (let i = 1; i <= 50; i++) {
        const client = await prisma.client.create({
            data: {
                name: `Client Company ${i.toString().padStart(3, '0')}`,
                code: `CL${i.toString().padStart(3, '0')}`,
                email: `contact@client${i}.com`,
                contactPerson: `Manager ${i}`,
                description: i % 5 === 0 ? "IMPORTANT CLIENT" : "Regular client",
                // Randomly assign some partners (M:N)
                partners: {
                    connect: partners.slice(0, 3).map(p => ({ id: p.id })) // Connect first 3 partners to everyone for noise, or random
                }
            }
        });

        // Create Individual Rule for some clients
        if (i % 5 === 0) {
            await prisma.pricingRule.create({
                data: {
                    name: `Special Rate for Client ${i}`,
                    type: "FIXED",
                    fixedPrice: 20000,
                    fixedCost: 10000,
                    clients: { connect: { id: client.id } }
                }
            });
        }

        // Create Invoice History (Past Invoices)
        if (i <= 10) {
            // Create a few invoices for the first 10 clients to test list performance
            await prisma.invoice.create({
                data: {
                    clientId: client.id,
                    status: "PAID",
                    issueDate: new Date('2025-01-01'),
                    totalAmount: 50000,
                    items: {
                        create: {
                            name: "Past Project",
                            quantity: 1,
                            unitPrice: 50000,
                            amount: 50000,
                            outsources: {
                                create: {
                                    partnerId: partners[0].id,
                                    costAmount: 20000,
                                    status: "PAID"
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    console.log(`✅ Created 50 Clients (with relations and rules)`);

    console.log('🏁 Seeding Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
