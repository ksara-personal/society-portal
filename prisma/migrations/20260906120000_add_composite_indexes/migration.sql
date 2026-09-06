-- Composite indexes matching how the app actually filters.
--
-- The dropped indexes are strictly leftmost prefixes of the new composites, so
-- Postgres can serve the single-column lookups from those instead. Keeping both
-- would only cost write amplification and storage.

-- DropIndex
DROP INDEX "Issue_issueType_idx";

-- DropIndex
DROP INDEX "Payment_quarterId_idx";

-- DropIndex
DROP INDEX "Payment_status_idx";

-- CreateIndex
CREATE INDEX "Issue_issueType_status_idx" ON "Issue"("issueType", "status");

-- CreateIndex
CREATE INDEX "Issue_issueType_createdAt_idx" ON "Issue"("issueType", "createdAt");

-- CreateIndex
CREATE INDEX "Issue_issueType_createdById_idx" ON "Issue"("issueType", "createdById");

-- CreateIndex
CREATE INDEX "Payment_quarterId_wing_flatNo_idx" ON "Payment"("quarterId", "wing", "flatNo");

-- CreateIndex
CREATE INDEX "Payment_status_collectedById_idx" ON "Payment"("status", "collectedById");

-- CreateIndex
CREATE INDEX "User_wing_flatNo_idx" ON "User"("wing", "flatNo");
