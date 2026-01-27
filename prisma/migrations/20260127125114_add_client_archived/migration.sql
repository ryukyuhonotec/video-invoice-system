-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "email" TEXT,
    "website" TEXT,
    "contactPerson" TEXT,
    "chatworkGroup" TEXT,
    "description" TEXT,
    "lastContactDate" DATETIME,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "billingContactId" TEXT,
    "operationsLeadId" TEXT,
    "accountantId" TEXT,
    "sns1" TEXT,
    "sns2" TEXT,
    "sns3" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_billingContactId_fkey" FOREIGN KEY ("billingContactId") REFERENCES "Partner" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Client_operationsLeadId_fkey" FOREIGN KEY ("operationsLeadId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Client_accountantId_fkey" FOREIGN KEY ("accountantId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("accountantId", "billingContactId", "chatworkGroup", "code", "contactPerson", "createdAt", "description", "email", "id", "lastContactDate", "name", "operationsLeadId", "sns1", "sns2", "sns3", "updatedAt", "website") SELECT "accountantId", "billingContactId", "chatworkGroup", "code", "contactPerson", "createdAt", "description", "email", "id", "lastContactDate", "name", "operationsLeadId", "sns1", "sns2", "sns3", "updatedAt", "website" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
