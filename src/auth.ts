
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/db"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google,
        Credentials({
            name: "Development Login",
            credentials: {
                email: { label: "Email", type: "email" }
            },
            async authorize(credentials) {
                console.log("Authorize called with:", credentials);
                // if (process.env.NODE_ENV === 'production') return null;

                const email = credentials?.email as string;
                if (!email) {
                    console.log("No email provided");
                    return null;
                }

                // Find user by email
                const user = await prisma.user.findFirst({
                    where: { email }
                });
                console.log("Authorize found user:", user);
                return user;
            }
        })
    ],
    // Use JWT strategy if needed, but Adapter defaults to database sessions usually. 
    // NextAuth v5 default with adapter is database strategy (if adapter is present).
    // However, for Middleware to work on Edge, we might need 'jwt' session strategy depending on setup, 
    // but let's stick to default for now as we are on Node environment mostly (except Middleware).
    // Note: Prisma Adapter + Middleware often requires 'strategy: jwt' because Middleware runs on Edge and can't use Prisma Client directly easily.
    // But let's start simple. NextAuth v5 middleware is auth() wrapper.
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string
            }
            return session
        }
    },
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
