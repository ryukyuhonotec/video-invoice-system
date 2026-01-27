"use server";

import prisma from "@/lib/db";

export async function getBill(id: string) {
    return await prisma.bill.findUnique({
        where: { id },
        include: {
            client: true,
            invoices: {
                include: {
                    items: true
                }
            }
        }
    });
}
