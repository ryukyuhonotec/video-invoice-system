import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const prismaClientSingleton = () => {
    // Check for Turso specific variables or a combined DATABASE_URL
    const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    // If the URL looks like a Turso URL (libsql: or https: with authToken), use adapter
    const isTurso = url?.startsWith("libsql:") || url?.startsWith("https:");

    if (isTurso && authToken) {
        console.log("Using Turso (LibSQL) Adapter");
        const libsql = createClient({
            url: url!,
            authToken,
        });
        const adapter = new PrismaLibSQL(libsql as any);
        return new PrismaClient({ adapter } as any);
    }

    // Default to local SQLite
    console.log("Using Standard Prisma Client (SQLite)");
    return new PrismaClient();
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
