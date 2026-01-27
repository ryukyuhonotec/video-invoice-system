/*
  Warnings:

  - You are about to drop the column `duration` on the `InvoiceItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bill" ADD COLUMN "notes" TEXT;
ALTER TABLE "Bill" ADD COLUMN "subject" TEXT;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "description" TEXT;
ALTER TABLE "Client" ADD COLUMN "lastContactDate" DATETIME;

-- AlterTable
ALTER TABLE "Outsource" ADD COLUMN "duration" TEXT;

-- CreateTable
CREATE TABLE "ClientContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "contactDate" DATETIME NOT NULL,
    "note" TEXT,
    "nextContactDate" DATETIME,
    "createTask" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientContact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PartnerRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "amount" REAL NOT NULL DEFAULT 0,
    "productionStatus" TEXT NOT NULL DEFAULT '受注前',
    "deliveryUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InvoiceItem" ("amount", "createdAt", "deliveryUrl", "id", "invoiceId", "name", "productionStatus", "quantity", "unitPrice", "updatedAt") SELECT "amount", "createdAt", "deliveryUrl", "id", "invoiceId", "name", "productionStatus", "quantity", "unitPrice", "updatedAt" FROM "InvoiceItem";
DROP TABLE "InvoiceItem";
ALTER TABLE "new_InvoiceItem" RENAME TO "InvoiceItem";
CREATE TABLE "new_Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "chatworkGroup" TEXT,
    "position" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Partner" ("chatworkGroup", "createdAt", "email", "id", "name", "role", "updatedAt") SELECT "chatworkGroup", "createdAt", "email", "id", "name", "role", "updatedAt" FROM "Partner";
DROP TABLE "Partner";
ALTER TABLE "new_Partner" RENAME TO "Partner";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PartnerRole_name_key" ON "PartnerRole"("name");
