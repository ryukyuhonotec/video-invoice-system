"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT";
export type AuditTargetType = "INVOICE" | "CLIENT" | "PARTNER" | "STAFF" | "PRICING_RULE" | "BILL" | "SETTINGS";

interface LogActionParams {
    action: AuditAction;
    targetType: AuditTargetType;
    targetId: string;
    details?: Record<string, any>;
}

/**
 * Log an action to the audit trail
 */
export async function logAction({ action, targetType, targetId, details }: LogActionParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            console.warn("logAction called without authenticated user");
            return;
        }

        await prisma.auditLog.create({
            data: {
                action,
                targetType,
                targetId,
                details: details ? JSON.stringify(details) : null,
                userId: session.user.id
            }
        });
    } catch (error) {
        console.error("Failed to log action:", error);
        // Don't throw - audit logging should not break main operations
    }
}

/**
 * Get audit logs with pagination
 */
export async function getAuditLogs(options?: {
    targetType?: AuditTargetType;
    targetId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
}) {
    try {
        const where: any = {};
        if (options?.targetType) where.targetType = options.targetType;
        if (options?.targetId) where.targetId = options.targetId;
        if (options?.userId) where.userId = options.userId;

        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 50,
            skip: options?.offset || 0
        });

        return logs;
    } catch (error) {
        console.error("Failed to get audit logs:", error);
        return [];
    }
}

/**
 * Get current user info with role
 */
export async function getCurrentUser() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const user = await (prisma as any).user.findUnique({
            where: { id: session.user.id },
            include: {
                staff: true
            }
        });

        return user;
    } catch (error) {
        console.error("Failed to get current user:", error);
        return null;
    }
}

/**
 * Check if current user is owner
 */
export async function isOwner(): Promise<boolean> {
    const user = await getCurrentUser();
    return user?.role === "OWNER";
}

/**
 * Check if current user has specific staff role
 */
export async function hasStaffRole(role: "OPERATIONS" | "ACCOUNTING"): Promise<boolean> {
    const user = await getCurrentUser();
    return user?.staff?.role === role;
}
