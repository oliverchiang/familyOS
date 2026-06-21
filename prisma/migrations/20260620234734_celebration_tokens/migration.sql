-- CreateEnum
CREATE TYPE "CelebrationTokenEvent" AS ENUM ('GRANT', 'REVOKE', 'REDEEM');

-- CreateTable
CREATE TABLE "CelebrationToken" (
    "id" TEXT NOT NULL,
    "event" "CelebrationTokenEvent" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kidId" TEXT NOT NULL,

    CONSTRAINT "CelebrationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CelebrationToken_kidId_idx" ON "CelebrationToken"("kidId");

-- AddForeignKey
ALTER TABLE "CelebrationToken" ADD CONSTRAINT "CelebrationToken_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
