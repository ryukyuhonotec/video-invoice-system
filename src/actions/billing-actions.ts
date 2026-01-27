"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createConsolidatedBill(clientId: string, invoiceIds: string[], issueDate: string, dueDate: string, subject: string, notes: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    // 1. Calculate totals from selected invoices
    const invoices = await prisma.invoice.findMany({
        where: {
            id: { in: invoiceIds },
            clientId: clientId
        }
    });

    if (invoices.length === 0) throw new Error("No invoices found");

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const tax = invoices.reduce((sum, inv) => sum + inv.tax, 0);

    try {
        // 2. Create Bill Record
        const bill = await prisma.bill.create({
            data: {
                clientId,
                subject,
                notes,
                issueDate: new Date(issueDate),
                paymentDueDate: dueDate ? new Date(dueDate) : null,
                totalAmount,
                tax,
                status: "ISSUED"
            }
        });

        // 3. Link Invoices to Bill and update their status
        await prisma.invoice.updateMany({
            where: { id: { in: invoiceIds } },
            data: {
                billId: bill.id,
                status: "請求済" // Mark project as Billed
            }
        });

        // 4. Update all Items AND related Tasks to Billed
        for (const inv of invoices) {
            // Update Items
            await prisma.invoiceItem.updateMany({
                where: { invoiceId: inv.id },
                data: { productionStatus: "請求済" }
            });

            // Update Tasks (Outsources)
            // First get item IDs to target outsources efficiently
            const items = await prisma.invoiceItem.findMany({
                where: { invoiceId: inv.id },
                select: { id: true }
            });
            const itemIds = items.map(i => i.id);

            if (itemIds.length > 0) {
                await prisma.outsource.updateMany({
                    where: { invoiceItemId: { in: itemIds } },
                    data: { status: "請求済" }
                });
            }
        }

        revalidatePath('/billing');
        revalidatePath('/dashboard');
        return bill;
    } catch (error) {
        console.error("Billing Creation Error:", error);
        throw error;
    }
}

export async function getUnbilledInvoices() {
    // Return clients who have delivered but unbilled projects
    // Logic: Find invoices where (status != Billed/Paid) AND (items have productionStatus '納品済')?
    // User said: "Delivered items can be billed"

    // Simpler: Find invoices where billId is NULL AND (status == 'Delivered' OR created with actualDeliveryDate)
    // Actually, status might be 'Review' but if items are Delivered...
    // Let's stick to: Invoices where billId is null.

    const invoices = await prisma.invoice.findMany({
        where: {
            billId: null,
            // We ideally want only "Delivered" ones, but user might want to bill "In Progress" ones exceptionally?
            // Requirement said "Status must be Delivered".
            // Let's filter in UI or query where items have '納品済'.
        },
        include: {
            client: true,
            items: {
                include: {
                    outsources: true
                }
            }
        },
        orderBy: { issueDate: 'desc' }
    });

    return invoices;
}

export async function getBills() {
    const bills = await prisma.bill.findMany({
        include: {
            client: true
        },
        orderBy: { issueDate: 'desc' }
    });
    return bills;
}

export async function updateBillStatus(id: string, status: string) {
    // 1. Update Bill Status
    await prisma.bill.update({
        where: { id },
        data: { status }
    });

    // 2. Propagate to Items/Tasks if necessary
    // If status is PAID, update items to '入金済み'
    if (status === 'PAID') {
        const bill = await prisma.bill.findUnique({
            where: { id },
            include: { invoices: true }
        });

        if (bill) {
            // Update Invoice status to '入金済み' (PAID)
            const invoiceIds = bill.invoices.map(inv => inv.id);
            await prisma.invoice.updateMany({
                where: { id: { in: invoiceIds } },
                data: { status: '入金済み' }
            });

            for (const inv of bill.invoices) {
                // Update Items
                await prisma.invoiceItem.updateMany({
                    where: { invoiceId: inv.id },
                    data: { productionStatus: '入金済み' }
                });

                // Update Outsources
                const items = await prisma.invoiceItem.findMany({
                    where: { invoiceId: inv.id },
                    select: { id: true }
                });
                const itemIds = items.map(i => i.id);

                if (itemIds.length > 0) {
                    await prisma.outsource.updateMany({
                        where: { invoiceItemId: { in: itemIds } },
                        data: { status: '入金済み' }
                    });
                }
            }
        }
    }

    revalidatePath('/bills');
    revalidatePath('/billing');
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true };
}
