"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateStaffProfile(userId: string, data: { name: string; email: string }) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    // Check permissions: Owner or Self
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { staff: true }
    });

    if (!currentUser) throw new Error("User not found");

    const isOwner = currentUser.role === 'OWNER';
    const isSelf = currentUser.id === userId;

    if (!isOwner && !isSelf) {
        throw new Error("Forbidden: You can only edit your own profile.");
    }

    try {
        // Update User
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                // Updating email on User might break Auth if strictly coupled, but let's allow it for now if requested.
                // However, usually email update requires verification.
                // For this request, we update both User and Staff email.
                email: data.email
            }
        });

        // Update Linked Staff if exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { staff: true }
        });

        if (targetUser?.staff) {
            await prisma.staff.update({
                where: { id: targetUser.staff.id },
                data: {
                    name: data.name,
                    email: data.email
                }
            });
        }

        revalidatePath("/staff");
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Profile update error:", error);
        throw new Error(error.message || "Failed to update profile");
    }
}
