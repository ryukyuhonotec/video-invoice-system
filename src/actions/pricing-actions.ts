"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { InvoiceStatus, ProductionStatus } from "@/types";
import { auth } from "@/auth";
import { logAction } from "./audit-actions";

// --- Partner Roles ---
export async function getPartnerRoles() {
    try {
        const roles = await prisma.partnerRole.findMany({
            orderBy: { name: 'asc' }
        });
        return roles;
    } catch (e) {
        console.error("Failed to get partner roles", e);
        return [];
    }
}

export async function addPartnerRole(name: string) {
    if (!name) return;
    try {
        await prisma.partnerRole.create({
            data: { name }
        });
        revalidatePath("/partners");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Failed to create role" };
    }
}

export async function deletePartnerRole(id: string) {
    try {
        // 1. Get the role name before deleting
        const roleToDelete = await prisma.partnerRole.findUnique({
            where: { id }
        });

        if (!roleToDelete) {
            return { success: false, error: "Role not found" };
        }

        // 2. Find partners who have this role
        // Since roles are stored as "Role A, Role B", we use contains
        // We will do precise filtering in JS to avoid partial matches (e.g. "Editor" vs "Chief Editor")
        const potentiallyAffectedPartners = await prisma.partner.findMany({
            where: {
                role: { contains: roleToDelete.name }
            }
        });

        // 3. Update each partner to remove the role
        for (const partner of potentiallyAffectedPartners) {
            if (!partner.role) continue;

            const currentRoles = partner.role.split(',').map(r => r.trim());

            // Only update if the exact role exists
            if (currentRoles.includes(roleToDelete.name)) {
                const newRoles = currentRoles.filter(r => r !== roleToDelete.name).join(',');
                await prisma.partner.update({
                    where: { id: partner.id },
                    data: { role: newRoles }
                });
            }
        }

        // 4. Delete the role
        await prisma.partnerRole.delete({ where: { id } });

        revalidatePath("/partners");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Failed to delete role" };
    }
}

// --- Clients ---

export async function getClients() {
    console.log("API: getClients starting...");
    try {
        const clients = await prisma.client.findMany({
            include: {
                pricingRules: {
                    include: {
                        partners: true
                    }
                },
                billingContact: true,
                operationsLead: true,
                accountant: true,
                partners: true, // NEW: Direct Client-Partner links
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
    const { id, pricingRules, billingContact, partnerIds, ...rest } = data;

    // Partners relation
    const partnerConnect = partnerIds?.map((pid: string) => ({ id: pid })) || [];

    // Convert empty strings to null for optional foreign key fields
    if (rest.operationsLeadId === "") rest.operationsLeadId = null;
    if (rest.accountantId === "") rest.accountantId = null;
    if (rest.billingContactId === "") rest.billingContactId = null;

    const isNew = !id || id.startsWith('new-');
    const result = await prisma.client.upsert({
        where: { id: id || 'new' },
        update: {
            ...rest,
            partners: { set: partnerConnect }
        },
        create: {
            ...rest,
            id: id && !id.startsWith('new-') ? id : undefined,
            partners: { connect: partnerConnect }
        },
    });

    // Audit logging
    await logAction({
        action: isNew ? "CREATE" : "UPDATE",
        targetType: "CLIENT",
        targetId: result.id,
        details: { name: result.name }
    });

    revalidatePath('/clients');
    return result;
}

// --- Client Contact History (掘り起こし連絡履歴) ---
export async function addClientContact(data: {
    clientId: string;
    contactDate: Date;
    note?: string;
    nextContactDate?: Date;
    createTask?: boolean;
    createdBy?: string;
}) {
    // 連絡履歴を追加
    const contact = await (prisma as any).clientContact.create({
        data: {
            clientId: data.clientId,
            contactDate: data.contactDate,
            note: data.note || null,
            nextContactDate: data.nextContactDate || null,
            createTask: data.createTask || false,
            createdBy: data.createdBy || null,
        },
    });

    // クライアントの最終連絡日も更新
    await (prisma as any).client.update({
        where: { id: data.clientId },
        data: { lastContactDate: data.contactDate },
    });

    // タスク作成が有効で次回連絡日が設定されている場合、案件を自動作成
    if (data.createTask && data.nextContactDate) {
        const client = await prisma.client.findUnique({
            where: { id: data.clientId },
        });
        if (client) {
            // 「掘り起こし連絡」案件を作成（InvoiceItemにタスク名を設定）
            await prisma.invoice.create({
                data: {
                    clientId: data.clientId,
                    status: '進行中',
                    issueDate: new Date(),
                    dueDate: data.nextContactDate,
                    totalAmount: 0,
                    items: {
                        create: [{
                            name: `掘り起こし連絡: ${client.name}${data.note ? ' - ' + data.note : ''}`,
                            quantity: 1,
                            unitPrice: 0,
                            amount: 0,
                        }]
                    }
                },
            });
        }
    }

    revalidatePath('/clients');
    revalidatePath('/staff-dashboard');
    return contact;
}

export async function getClientContactHistory(clientId: string) {
    return await (prisma as any).clientContact.findMany({
        where: { clientId },
        orderBy: { contactDate: 'desc' },
    });
}

export async function updateClientContactDate(clientId: string, date: Date) {
    const result = await (prisma as any).client.update({
        where: { id: clientId },
        data: { lastContactDate: date },
    });
    revalidatePath('/clients');
    revalidatePath('/staff-dashboard');
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
                        clients: {
                            include: {
                                invoices: {
                                    take: 1,
                                    orderBy: { issueDate: 'desc' },
                                    select: { issueDate: true }
                                }
                            }
                        }
                    }
                },
                clients: true,
            } as any,
            orderBy: { updatedAt: 'desc' },
        });
        return partners;
    } catch (error) {
        console.error("API: getPartners FAILED:", error);
        throw error;
    }
}

export async function getPaginatedPartners(
    page: number = 1,
    limit: number = 20,
    search: string = "",
    role: string = "ALL",
    showArchived: boolean = false
) {
    try {
        const skip = (page - 1) * limit;
        const where: any = {
            AND: [
                showArchived ? {} : { isArchived: false },
                search ? {
                    OR: [
                        { name: { contains: search } }, // Case insensitive usually requires mode: insensitive in Postgres, but SQLite/MySQL varies. Prisma default depends on provider.
                        { email: { contains: search } }
                    ]
                } : {},
                (role && role !== "ALL") ? {
                    role: { contains: role }
                } : {}
            ]
        };

        const [partners, total] = await prisma.$transaction([
            prisma.partner.findMany({
                where,
                skip,
                take: limit,
                include: {
                    pricingRules: {
                        include: {
                            clients: {
                                include: {
                                    invoices: {
                                        take: 1,
                                        orderBy: { issueDate: 'desc' },
                                        select: { issueDate: true }
                                    }
                                }
                            }
                        }
                    },
                    clients: true,
                } as any,
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.partner.count({ where })
        ]);

        return {
            partners,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error("API: getPaginatedPartners FAILED:", error);
        return { partners: [], total: 0, page: 1, totalPages: 0 };
    }
}

export async function upsertPartner(data: any) {
    const { id, pricingRules, assignedItems, billingClients, clientIds, ...rest } = data;

    // Clients relation
    const clientConnect = clientIds?.map((cid: string) => ({ id: cid })) || [];

    // Handle specific fields cleanup
    if (rest.email === "") rest.email = null;
    if (rest.chatworkGroup === "") rest.chatworkGroup = null;
    if (rest.position === "") rest.position = null;
    if (rest.description === "") rest.description = null;
    if (rest.contractUrl === "") rest.contractUrl = null;

    const result = await prisma.partner.upsert({
        where: { id: id || 'new' },
        update: {
            ...rest,
            clients: { set: clientConnect }
        },
        create: {
            ...rest,
            id: id && !id.startsWith('p-new-') ? id : undefined,
            clients: { connect: clientConnect }
        },
    });
    revalidatePath('/partners');
    return result;
}

export async function deletePartner(id: string) {
    await prisma.partner.delete({ where: { id } });
    revalidatePath('/partners');
}

export async function archivePartner(id: string) {
    // For now, we'll just delete - in future, could add an 'archived' field to Partner model
    await prisma.partner.delete({ where: { id } });
    revalidatePath('/partners');
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

// --- Staff (事業統括・経理) ---
export async function getStaff() {
    return await prisma.staff.findMany({
        orderBy: { name: 'asc' },
    });
}

export async function upsertStaff(data: any) {
    const { id, ...rest } = data;
    const result = await prisma.staff.upsert({
        where: { id: id || 'new' },
        update: rest,
        create: {
            ...rest,
            id: id && !id.startsWith('staff-') ? id : undefined,
        },
    });
    revalidatePath('/staff');
    revalidatePath('/');
    return result;
}

export async function deleteStaff(id: string) {
    await prisma.staff.delete({ where: { id } });
    revalidatePath('/staff');
    revalidatePath('/');
}

// --- Invoices ---

export async function upsertInvoice(data: any) {
    const session = await auth();
    let userId: string | null = session?.user?.id || null;

    // Development mode: Skip auth check, but only use real user if exists
    if (!userId && process.env.NODE_ENV !== 'production') {
        const devUser = await prisma.user.findFirst();
        userId = devUser?.id || null;
    }


    if (!userId && process.env.NODE_ENV === 'production') {
        throw new Error("Unauthorized - Please log in");
    }

    const { id, items, ...rest } = data;


    // Fetch existing invoice to check for status change and permission
    let existingInvoice = null;
    if (id && !id.startsWith('inv-')) {
        existingInvoice = await prisma.invoice.findUnique({ where: { id } });
    }

    // Permission Check: Only creator can edit (if creator is set)
    // NOTE: In a real app, we might allow Admins/Accounting to override.
    if (existingInvoice && existingInvoice.createdById && existingInvoice.createdById !== userId) {
        // Ideally we check if user is Admin, but for now strict "Registrant Only" as requested.
        throw new Error("Forbidden: You can only edit invoices you created.");
    }

    // Format items for Prisma - new schema with tasks (outsources)
    const itemsToCreate = items.map((item: any) => ({
        name: item.name || "名称未設定",
        // duration removed from InvoiceItem
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        amount: Number(item.amount) || 0,
        productionStatus: item.productionStatus || "受注前",
        deliveryUrl: item.deliveryUrl,
        outsources: {
            create: (item.outsources || []).map((task: any) => ({
                // Treat empty strings as null for foreign keys
                pricingRuleId: task.pricingRuleId && task.pricingRuleId !== "" ? task.pricingRuleId : null,
                partnerId: task.partnerId && task.partnerId !== "" ? task.partnerId : null,
                revenueAmount: Number(task.revenueAmount) || 0,
                costAmount: Number(task.costAmount) || 0,
                deliveryDate: task.deliveryDate ? new Date(task.deliveryDate) : null,
                duration: task.duration || null,
                status: task.status || "受注前",
                description: task.description,
                deliveryUrl: task.deliveryUrl,
                deliveryNote: task.deliveryNote // NEW
            }))
        }
    }));


    // Explicitly construct the data to avoid foreign key issues with empty strings
    const invoiceData = {
        clientId: rest.clientId,
        staffId: rest.staffId && rest.staffId !== "" ? rest.staffId : null,
        issueDate: rest.issueDate ? new Date(rest.issueDate) : null,
        dueDate: rest.dueDate ? new Date(rest.dueDate) : null,
        actualDeliveryDate: rest.actualDeliveryDate ? new Date(rest.actualDeliveryDate) : null,
        requestUrl: rest.requestUrl || null,
        deliveryUrl: rest.deliveryUrl || null,
        deliveryNote: rest.deliveryNote || null, // NEW
        subtotal: Number(rest.subtotal) || 0,
        tax: Number(rest.tax) || 0,
        totalAmount: Number(rest.totalAmount) || 0,
        totalCost: Number(rest.totalCost) || 0,
        profit: Number(rest.profit) || 0,
        profitMargin: Number(rest.profitMargin) || 0,
    };

    let result;
    try {
        result = await prisma.$transaction(async (tx) => {
            const savedInvoice = await tx.invoice.upsert({
                where: { id: id || 'new' },
                update: {
                    ...invoiceData,
                    items: {
                        deleteMany: {},
                        create: itemsToCreate
                    }
                },
                create: {
                    ...invoiceData,
                    id: id && !id.startsWith('inv-') ? id : undefined,
                    createdById: userId || undefined,
                    items: {
                        create: itemsToCreate
                    }
                },
            });

            // Audit Log logic
            if (userId) {
                if (existingInvoice) {
                    if (existingInvoice.status !== savedInvoice.status) {
                        await tx.auditLog.create({
                            data: {
                                action: "STATUS_CHANGE",
                                targetId: savedInvoice.id,
                                targetType: "INVOICE",
                                details: `${existingInvoice.status} -> ${savedInvoice.status}`,
                                userId: userId
                            }
                        });
                    } else {
                        // Log update action if not status change? Optional, but good for tracking edits.
                        await tx.auditLog.create({
                            data: {
                                action: "UPDATE",
                                targetId: savedInvoice.id,
                                targetType: "INVOICE",
                                details: "Updated Invoice details",
                                userId: userId
                            }
                        });
                    }
                } else {
                    await tx.auditLog.create({
                        data: {
                            action: "CREATE",
                            targetId: savedInvoice.id,
                            targetType: "INVOICE",
                            details: "Created Invoice",
                            userId: userId
                        }
                    });
                }
            }

            return savedInvoice;
        });
    } catch (error: any) {
        console.error("UPSERT ERROR DETAILS:", error.message);
        console.error("ERROR META:", JSON.stringify(error.meta, null, 2));
        return { success: false, error: error.message || "Failed to save invoice" };
    }

    revalidatePath('/');
    revalidatePath('/invoices/[id]', 'page');
    revalidatePath('/invoices/[id]', 'page');
    revalidatePath('/invoices/new', 'page');

    return { success: true, data: result };
}

export async function updateInvoiceStatus(id: string, status: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");

    // Map Invoice Status to Item Status
    let itemStatus = "";
    if (status === "Billed" || status === "請求済") {
        status = "請求済"; // Force Japanese
        itemStatus = "請求済";
    } else if (status === "Paid" || status === "完了") {
        status = "完了";   // Force Japanese
        itemStatus = "完了";
    }

    const result = await prisma.invoice.update({
        where: { id },
        data: {
            status,
            items: itemStatus ? {
                updateMany: {
                    where: {},
                    data: { productionStatus: itemStatus }
                }
            } : undefined
        }
    });

    // Audit Log
    await prisma.auditLog.create({
        data: {
            action: "STATUS_CHANGE",
            targetId: id,
            targetType: "INVOICE",
            details: `Status updated to ${status} (Cascade to items)`,
            userId
        }
    });

    revalidatePath(`/invoices/${id}`);
    revalidatePath(`/invoices/${id}/publish`);
    return result;
}

export async function getInvoices() {
    return await prisma.invoice.findMany({
        include: {
            client: true,
            staff: true,
            items: {
                include: {
                    outsources: {
                        include: {
                            partner: true,
                            pricingRule: true
                        }
                    }
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });
}

export async function getInvoice(id: string) {
    return await prisma.invoice.findUnique({
        where: { id },
        include: {
            client: true,
            staff: true,
            items: {
                include: {
                    outsources: {
                        include: {
                            partner: true,
                            pricingRule: true
                        }
                    }
                }
            }
        },
    });
}


// --- Stats Actions ---

export async function getClientStats(clientId: string) {
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
            pricingRules: true,
            partners: true
        }
    });

    if (!client) throw new Error("Client not found");

    const invoices = await prisma.invoice.findMany({
        where: { clientId },
        orderBy: { issueDate: 'desc' },
        include: {
            items: true
        }
    });

    const now = new Date();
    const currentYear = now.getFullYear();

    let totalRevenue = 0;
    let thisYearRevenue = 0;
    let unpaidAmount = 0;
    let totalProfit = 0;

    invoices.forEach(inv => {
        const amount = inv.totalAmount || 0;
        const profit = inv.profit || 0;

        // Revenue
        totalRevenue += amount;
        if (inv.issueDate && inv.issueDate.getFullYear() === currentYear) {
            thisYearRevenue += amount;
        }

        // Unpaid: Status is not PAID and not DRAFT (assuming only Issued/Billed counts as Unpaid receivable)
        // Also check Japanese status "入金済み"
        if (inv.status !== 'PAID' && inv.status !== '入金済み' && inv.status !== 'DRAFT') {
            unpaidAmount += amount;
        }

        // Profit
        totalProfit += profit;
    });

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
        client,
        invoices,
        stats: {
            totalRevenue,
            thisYearRevenue,
            unpaidAmount,
            totalProfit,
            profitMargin
        }
    };
}

export async function getPartnerStats(partnerId: string) {
    const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
            pricingRules: true
        }
    });

    if (!partner) throw new Error("Partner not found");

    const tasks = await prisma.outsource.findMany({
        where: { partnerId },
        orderBy: { deliveryDate: 'desc' },
        include: {
            invoiceItem: {
                include: {
                    invoice: {
                        include: {
                            client: true
                        }
                    }
                }
            },
            pricingRule: true
        }
    });

    const now = new Date();
    const currentYear = now.getFullYear();

    let totalCost = 0;
    let thisYearCost = 0;

    tasks.forEach(task => {
        const cost = task.costAmount || 0;
        totalCost += cost;
        if (task.deliveryDate && task.deliveryDate.getFullYear() === currentYear) {
            thisYearCost += cost;
        }
    });

    return {
        partner,
        tasks,
        stats: {
            totalCost,
            thisYearCost
        }
    };
}
