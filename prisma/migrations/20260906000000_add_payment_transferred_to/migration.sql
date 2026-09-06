-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "transferredToId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_transferredToId_idx" ON "Payment"("transferredToId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transferredToId_fkey" FOREIGN KEY ("transferredToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
