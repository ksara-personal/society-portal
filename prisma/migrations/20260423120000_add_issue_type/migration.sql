-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('SOCIETY', 'VILLA');

-- AlterTable: add issueType and flatNo (flatNo already exists from previous migration, skip if exists)
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "flatNo" TEXT;
ALTER TABLE "Issue" ADD COLUMN "issueType" "IssueType" NOT NULL DEFAULT 'SOCIETY';

-- CreateIndex
CREATE INDEX "Issue_issueType_idx" ON "Issue"("issueType");
