
import { createClient } from "@libsql/client";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function main() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        console.error("Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set.");
        process.exit(1);
    }

    console.log("Generating SQL from Prisma schema...");

    // Use prisma migrate diff to get the full creation SQL
    const sqlPath = path.join(process.cwd(), "temp_schema.sql");
    try {
        execSync(`npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > ${sqlPath}`);
    } catch (e) {
        console.error("Failed to generate SQL:", e);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, "utf-8");
    fs.unlinkSync(sqlPath);

    console.log("Connecting to Turso...");
    const client = createClient({ url, authToken });

    console.log("Executing SQL on Turso...");
    // Split SQL into separate statements if necessary, or use executeMultiple
    // prisma migrate diff script can be long, so we use executeMultiple
    try {
        await client.executeMultiple(sql);
        console.log("✅ Schema successfully synced to Turso!");
    } catch (e) {
        console.error("❌ Failed to sync schema:", e);
        process.exit(1);
    }
}

main();
