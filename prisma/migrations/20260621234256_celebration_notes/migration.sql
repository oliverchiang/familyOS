/*
  Warnings:

  - You are about to drop the column `event` on the `CelebrationToken` table. All the data in the column will be lost.
  - Made the column `note` on table `CelebrationToken` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "CelebrationState" AS ENUM ('AVAILABLE', 'USED');

-- DropIndex
DROP INDEX "CelebrationToken_kidId_idx";

-- AlterTable
ALTER TABLE "CelebrationToken" DROP COLUMN "event",
ADD COLUMN     "state" "CelebrationState" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "usedAt" TIMESTAMP(3),
ALTER COLUMN "note" SET NOT NULL;

-- DropEnum
DROP TYPE "CelebrationTokenEvent";

-- CreateIndex
CREATE INDEX "CelebrationToken_kidId_state_idx" ON "CelebrationToken"("kidId", "state");
