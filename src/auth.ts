
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
})
