"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

// --- Clients ---
export async function getClients() {
    console.log("API: getClients starting...");
    try {
        const clients = await prisma.client.findMany({
            include: {
                pricingRules: true,
                billingContact: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
        console.log(`API: getClients success, found ${clients.length}`);
        return clients;
    } catch (error) {
        console.error("API: getClients FAILED:", error);
        throw error;
    }
}

export async function upsertClient(data: any) {
    const { id, pricingRules, billingContact, ...rest } = data;
    const result = await prisma.client.upsert({
        where: { id: id || 'new' },
        update: rest,
        create: {
            ...rest,
            id: id && !id.startsWith('new-') ? id : undefined,
        },
    });
    revalidatePath('/clients');
    return result;
}

// --- Partners ---
export async function getPartners() {
    console.log("API: getPartners starting...");
    try {
        const partners = await prisma.partner.findMany({
            include: {
                pricingRules: {
                    include: {
                        clients: true
                    }
                },
            } as any,
            orderBy: { updatedAt: 'desc' },
        });
        return partners;
    } catch (error) {
        console.error("API: getPartners FAILED:", error);
        throw error;
    }
}

export async function upsertPartner(data: any) {
    const { id, pricingRules, assignedItems, billingClients, ...rest } = data;
    const result = await prisma.partner.upsert({
        where: { id: id || 'new' },
        update: rest,
        create: {
            ...rest,
            id: id && !id.startsWith('p-new-') ? id : undefined,
        },
    });
    revalidatePath('/partners');
    return result;
}

// --- Pricing Rules ---
export async function getPricingRules() {
    return await prisma.pricingRule.findMany({
        include: {
            clients: true,
            partners: true,
        },
        orderBy: { updatedAt: 'desc' },
    });
}

export async function upsertPricingRule(data: any) {
    const { id, clientIds, partnerIds, ...rest } = data;

    // Convert steps objects to JSON strings
    if (rest.steps && typeof rest.steps !== 'string') {
        rest.steps = JSON.stringify(rest.steps);
    }
    if (rest.costSteps && typeof rest.costSteps !== 'string') {
        rest.costSteps = JSON.stringify(rest.costSteps);
    }

    // Relations formatting
    const clientConnect = clientIds?.map((id: string) => ({ id })) || [];
    const partnerConnect = partnerIds?.map((id: string) => ({ id })) || [];

    const result = await prisma.pricingRule.upsert({
        where: { id: id || 'new' },
        update: {
            ...rest,
            clients: { set: clientConnect },
            partners: { set: partnerConnect }
        },
        create: {
            ...rest,
            id: id && !id.startsWith('rule-') ? id : undefined,
            clients: { connect: clientConnect },
            partners: { connect: partnerConnect }
        },
    });

    revalidatePath('/pricing-rules');
    revalidatePath('/clients');
    revalidatePath('/partners');
    return result;
}

export async function deletePricingRule(id: string) {
    await prisma.pricingRule.delete({ where: { id } });
    revalidatePath('/pricing-rules');
}

// --- Supervisors ---
export async function getSupervisors() {
    return await prisma.supervisor.findMany({
        orderBy: { name: 'asc' },
    });
}

export async function upsertSupervisor(data: any) {
    const { id, ...rest } = data;
    const result = await prisma.supervisor.upsert({
        where: { id: id || 'new' },
        update: rest,
        create: {
            ...rest,
            id: id && !id.startsWith('sup-') ? id : undefined,
        },
    });
    revalidatePath('/supervisors');
    revalidatePath('/');
    return result;
}

export async function deleteSupervisor(id: string) {
    await prisma.supervisor.delete({ where: { id } });
    revalidatePath('/supervisors');
    revalidatePath('/');
}

// --- Invoices ---
export async function upsertInvoice(data: any) {
    const { id, items, ...rest } = data;

    // Format items for Prisma
    const itemsToCreate = items.map((item: any) => ({
        name: item.name || "名称未設定",
        duration: Number(item.duration) || 0,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        amount: Number(item.amount) || 0,
        pricingRuleId: item.pricingRuleId,
        productionStatus: item.productionStatus || "Pre-Order",
        deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : null,
        deliveryUrl: item.deliveryUrl,
        outsources: {
            create: (item.outsources || []).map((o: any) => ({
                partnerId: o.partnerId,
                amount: Number(o.amount) || 0,
                description: o.description,
                status: o.status || "Pending",
                deliveryUrl: o.deliveryUrl
            }))
        }
    }));

    const result = await prisma.invoice.upsert({
        where: { id: id || 'new' },
        update: {
            ...rest,
            issueDate: rest.issueDate ? new Date(rest.issueDate) : undefined,
            dueDate: rest.dueDate ? new Date(rest.dueDate) : undefined,
            items: {
                deleteMany: {},
                create: itemsToCreate
            }
        },
        create: {
            ...rest,
            id: id && !id.startsWith('inv-') ? id : undefined,
            issueDate: rest.issueDate ? new Date(rest.issueDate) : undefined,
            dueDate: rest.dueDate ? new Date(rest.dueDate) : undefined,
            items: {
                create: itemsToCreate
            }
        },
    });

    revalidatePath('/');
    revalidatePath('/invoices/[id]', 'page');
    return result;
}

export async function getInvoices() {
    return await prisma.invoice.findMany({
        include: {
            client: true,
            supervisor: true,
            items: {
                include: {
                    outsources: {
                        include: {
                            partner: true
                        }
                    }
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });
}
