-- CreateTable
CREATE TABLE "Flat" (
    "id" TEXT NOT NULL,
    "wing" TEXT NOT NULL,
    "flatNo" TEXT NOT NULL,
    "eligibleForMaintenance" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Flat_wing_flatNo_key" ON "Flat"("wing", "flatNo");

-- CreateIndex
CREATE INDEX "Flat_wing_idx" ON "Flat"("wing");

-- CreateIndex
CREATE INDEX "Flat_eligibleForMaintenance_idx" ON "Flat"("eligibleForMaintenance");

-- Seed the Flat master table with the previous default wing/flat ranges
-- (Wings A-E) so existing installs keep working after the static
-- NEXT_PUBLIC_WINGS_CONFIG based layout is replaced by this table.
-- Existing wing/flatNo values already in use (Users/Payments/Issues) are
-- included too, so nothing already in use silently disappears from dropdowns.
INSERT INTO "Flat" ("id", "wing", "flatNo", "eligibleForMaintenance", "createdAt", "updatedAt")
SELECT
    'flat_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20),
    wing,
    "flatNo",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT 'A' AS wing, lpad(n::text, 3, '0') AS "flatNo" FROM generate_series(1, 9) n
    UNION ALL
    SELECT 'B', lpad(n::text, 3, '0') FROM generate_series(10, 19) n
    UNION ALL
    SELECT 'C', lpad(n::text, 3, '0') FROM generate_series(20, 33) n
    UNION ALL
    SELECT 'D', lpad(n::text, 3, '0') FROM generate_series(34, 49) n
    UNION ALL
    SELECT 'E', lpad(n::text, 3, '0') FROM generate_series(50, 57) n
    UNION ALL
    SELECT wing, "flatNo" FROM "User" WHERE wing IS NOT NULL AND "flatNo" IS NOT NULL
    UNION ALL
    SELECT wing, "flatNo" FROM "Payment"
) AS defaults
GROUP BY wing, "flatNo"
ON CONFLICT ("wing", "flatNo") DO NOTHING;
