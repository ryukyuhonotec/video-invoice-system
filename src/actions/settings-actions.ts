"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getCompanyProfile() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    return await prisma.companyProfile.findUnique({
        where: { id: "master" }
    });
}

export async function updateCompanyProfile(data: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    registrationNumber?: string;
    bankName?: string;
    bankBranch?: string;
    bankAccountType?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
}) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    await prisma.companyProfile.upsert({
        where: { id: "master" },
        update: data,
        create: {
            id: "master",
            ...data
        }
    });

    revalidatePath("/settings/company");
    revalidatePath("/bills"); // Might affect bills display
}

export async function getCompanyStats() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const invoices = await prisma.invoice.findMany({
        where: {
            status: { not: 'DRAFT' } // Exclude drafts from stats? Or include? Typically exclude.
            // Let's include everything except probably purely deleted ones, but Prisma doesn't have soft delete here.
            // Actually, including drafts might be misleading. Let's exclude DRAFT.
        },
        orderBy: { issueDate: 'asc' } // Ascending for graph
    });

    const now = new Date();
    const currentYear = now.getFullYear();

    let totalRevenue = 0;
    let totalProfit = 0;

    let thisYearRevenue = 0;
    let thisYearProfit = 0;

    // Monthly Data Initialization (Last 12 months)
    const monthlyDataMap = new Map<string, { name: string, revenue: number, profit: number }>();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyDataMap.set(key, { name: key, revenue: 0, profit: 0 });
    }

    invoices.forEach(inv => {
        if (!inv.issueDate) return;

        const amount = inv.totalAmount || 0;
        const profit = inv.profit || 0;

        // Total Stats
        totalRevenue += amount;
        totalProfit += profit;

        // Year Stats
        if (inv.issueDate.getFullYear() === currentYear) {
            thisYearRevenue += amount;
            thisYearProfit += profit;
        }

        // Monthly Graph Data
        const key = `${inv.issueDate.getFullYear()}-${String(inv.issueDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyDataMap.has(key)) {
            const data = monthlyDataMap.get(key)!;
            data.revenue += amount;
            data.profit += profit;
        }
    });

    const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const thisYearMargin = thisYearRevenue > 0 ? (thisYearProfit / thisYearRevenue) * 100 : 0;

    // Convert Map to Array and Sort by Date
    const monthlyStats = Array.from(monthlyDataMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return {
        totalRevenue,
        totalProfit,
        totalMargin,
        thisYearRevenue,
        thisYearProfit,
        thisYearMargin,
        monthlyStats
    };
}
