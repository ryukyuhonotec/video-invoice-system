import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const prismaClientSingleton = () => {
    // Check if we are using Turso (Env vars present)
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (url && authToken) {
        console.log("Using Turso (LibSQL) Adapter");
        const libsql = createClient({
            url,
            authToken,
        });
        const adapter = new PrismaLibSQL(libsql as any);
        // Cast to 'any' or specific options type if adapter is not in default types yet
        return new PrismaClient({ adapter } as any);
    }

    // Default to local SQLite (Standard) or standard provider usage
    return new PrismaClient();
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
