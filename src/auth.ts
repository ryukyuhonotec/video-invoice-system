
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [Google],
    // Use JWT strategy if needed, but Adapter defaults to database sessions usually. 
    // NextAuth v5 default with adapter is database strategy (if adapter is present).
    // However, for Middleware to work on Edge, we might need 'jwt' session strategy depending on setup, 
    // but let's stick to default for now as we are on Node environment mostly (except Middleware).
    // Note: Prisma Adapter + Middleware often requires 'strategy: jwt' because Middleware runs on Edge and can't use Prisma Client directly easily.
    // But let's start simple. NextAuth v5 middleware is auth() wrapper.
    session: { strategy: "jwt" },
    events: {
        createUser: async ({ user }) => {
            if (!user.email) return;
            try {
                const existingStaff = await prisma.staff.findFirst({
                    where: { email: user.email }
                });

                if (existingStaff) {
                    await prisma.staff.update({
                        where: { id: existingStaff.id },
                        data: { userId: user.id }
                    });
                } else {
                    await prisma.staff.create({
                        data: {
                            name: user.name || "Unknown",
                            email: user.email,
                            role: "OPERATIONS",
                            userId: user.id
                        }
                    });
                }
            } catch (e) {
                console.error("Error linking staff on createUser:", e);
            }
        },
        signIn: async ({ user }) => {
            // Ensure link exists even for existing users
            if (!user.email || !user.id) return;
            try {
                const staff = await prisma.staff.findUnique({
                    where: { userId: user.id }
                });
                if (!staff) {
                    // Check by email
                    const existingStaff = await prisma.staff.findFirst({
                        where: { email: user.email }
                    });
                    if (existingStaff) {
                        await prisma.staff.update({
                            where: { id: existingStaff.id },
                            data: { userId: user.id }
                        });
                    } else {
                        // Create
                        await prisma.staff.create({
                            data: {
                                name: user.name || "Unknown",
                                email: user.email,
                                role: "OPERATIONS",
                                userId: user.id
                            }
                        });
                    }
                }
            } catch (e) {
                console.error("Error linking staff on signIn:", e);
            }
        }
    }
})
