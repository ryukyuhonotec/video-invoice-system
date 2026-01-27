"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Create a staff invitation link
 */
export async function createStaffInvitation(data: {
    email?: string;
    name?: string;
    staffRole: "OPERATIONS" | "ACCOUNTING";
    expiresInDays?: number;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Not authenticated");
    }

    // Set expiration (default 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7));

    const invitation = await (prisma as any).staffInvitation.create({
        data: {
            email: data.email || null,
            name: data.name || null,
            staffRole: data.staffRole,
            expiresAt,
            createdBy: session.user.id
        }
    });

    revalidatePath('/staff');
    return invitation;
}

/**
 * Get all invitations (for admin view)
 */
export async function getStaffInvitations() {
    try {
        const invitations = await (prisma as any).staffInvitation.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return invitations;
    } catch (error) {
        console.error("Failed to get invitations:", error);
        return [];
    }
}

/**
 * Validate and get invitation by token
 */
export async function getInvitationByToken(token: string) {
    try {
        const invitation = await (prisma as any).staffInvitation.findUnique({
            where: { token }
        });

        if (!invitation) return null;
        if (invitation.usedAt) return { ...invitation, status: 'used' };
        if (new Date() > invitation.expiresAt) return { ...invitation, status: 'expired' };

        return { ...invitation, status: 'valid' };
    } catch (error) {
        console.error("Failed to get invitation:", error);
        return null;
    }
}

/**
 * Mark invitation as used and create staff record
 */
export async function useInvitation(token: string, userId: string, userData: { name: string; email: string }) {
    try {
        const invitation = await getInvitationByToken(token);
        if (!invitation || invitation.status !== 'valid') {
            throw new Error("Invalid or expired invitation");
        }

        // Create staff record
        const staff = await prisma.staff.create({
            data: {
                name: userData.name,
                email: userData.email,
                role: invitation.staffRole,
                userId: userId
            }
        });

        // Mark invitation as used
        await (prisma as any).staffInvitation.update({
            where: { token },
            data: {
                usedAt: new Date(),
                usedBy: userId
            }
        });

        return staff;
    } catch (error) {
        console.error("Failed to use invitation:", error);
        throw error;
    }
}

/**
 * Delete an invitation
 */
export async function deleteInvitation(id: string) {
    try {
        await (prisma as any).staffInvitation.delete({
            where: { id }
        });
        revalidatePath('/staff');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete invitation:", error);
        return { success: false };
    }
}
