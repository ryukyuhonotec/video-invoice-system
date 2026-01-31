import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const prismaClientSingleton = () => {
    // Check for Turso specific variables or a combined DATABASE_URL
    const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
    let authToken = process.env.TURSO_AUTH_TOKEN;

    // If the URL looks like a Turso URL (libsql: or https: with authToken), use adapter
    const isTurso = url?.startsWith("libsql:") || url?.startsWith("https:");

    if (isTurso && url) {
        // Try to extract authToken from URL if not provided explicitly
        if (!authToken && url.includes("authToken=")) {
            const urlObj = new URL(url.replace("libsql:", "https:")); // URL constructor needs valid protocol
            authToken = urlObj.searchParams.get("authToken") || undefined;
        }

        if (authToken) {
            console.log("Using Turso (LibSQL) Adapter");
            const libsql = createClient({
                url: url!,
                authToken,
            });
            const adapter = new PrismaLibSQL(libsql as any);
            return new PrismaClient({ adapter } as any);
        }
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
