-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "deliveryNote" TEXT;

-- AlterTable
ALTER TABLE "Outsource" ADD COLUMN "deliveryNote" TEXT;

-- AlterTable
ALTER TABLE "PricingRule" ADD COLUMN "targetRole" TEXT;

-- CreateTable
CREATE TABLE "_ClientPartners" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ClientPartners_A_fkey" FOREIGN KEY ("A") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ClientPartners_B_fkey" FOREIGN KEY ("B") REFERENCES "Partner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_ClientPartners_AB_unique" ON "_ClientPartners"("A", "B");

-- CreateIndex
CREATE INDEX "_ClientPartners_B_index" ON "_ClientPartners"("B");
