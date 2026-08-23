-- Per-step awards: a task's reward is now split across its steps and paid as
-- each step is approved, instead of one lump sum when the target is met.
--
-- An EARN is therefore keyed to the approved Completion it pays for, not to the
-- task/week. That makes awards idempotent per step, lets undo claw back exactly
-- one step, and gives each step its own `celebrated` flag.

-- DropIndex (one EARN per task/week no longer holds)
DROP INDEX "LedgerEntry_kidId_weekStart_taskId_key";

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "completionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_completionId_key" ON "LedgerEntry"("completionId");

-- CreateIndex
CREATE INDEX "LedgerEntry_kidId_weekStart_taskId_idx" ON "LedgerEntry"("kidId", "weekStart", "taskId");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "Completion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rebuild every EARN from the approved steps that earned it. Balances are
-- computed from completions rather than from these rows, so replacing the old
-- lump-sum entries changes what the history feed shows, not what anyone is owed.
DELETE FROM "LedgerEntry" WHERE "type" = 'EARN';

WITH ranked AS (
  SELECT
    c."id",
    c."kidId",
    c."weekStart",
    c."taskId",
    COALESCE(c."approvedAt", c."createdAt") AS "awardedAt",
    t."targetCount",
    t."rewardMins",
    ROW_NUMBER() OVER (
      PARTITION BY c."kidId", c."weekStart", c."taskId"
      ORDER BY COALESCE(c."approvedAt", c."createdAt"), c."id"
    ) AS n
  FROM "Completion" c
  JOIN "Task" t ON t."id" = c."taskId"
  WHERE c."status" = 'APPROVED'
)
INSERT INTO "LedgerEntry" ("id", "weekStart", "type", "minutes", "note", "celebrated", "createdAt", "kidId", "taskId", "completionId")
SELECT
  gen_random_uuid()::text,
  r."weekStart",
  'EARN',
  -- Integer division on non-negative values, so this is the same floor-difference
  -- as stepAward() in src/lib/economy.ts: the remainder lands on the last step.
  ((r."rewardMins" * r.n) / r."targetCount") - ((r."rewardMins" * (r.n - 1)) / r."targetCount"),
  'Step done',
  -- Already-approved steps are back-filled as seen, so the kid's celebration
  -- modal doesn't replay for work that was approved before this change.
  TRUE,
  r."awardedAt",
  r."kidId",
  r."taskId",
  r."id"
FROM ranked r
WHERE r.n <= r."targetCount" AND r."targetCount" > 0;
