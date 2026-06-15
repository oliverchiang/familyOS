-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARENT', 'KID');

-- CreateEnum
CREATE TYPE "TaskDisplay" AS ENUM ('TALLY', 'BAR');

-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('EARN', 'REDEEM', 'ADJUST');

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "avatarKey" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "weeklyCapMins" INTEGER NOT NULL DEFAULT 120,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "display" "TaskDisplay" NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "rewardMins" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kidId" TEXT NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Completion" (
    "id" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "status" "CompletionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "taskId" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,

    CONSTRAINT "Completion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "minutes" INTEGER NOT NULL,
    "note" TEXT,
    "celebrated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kidId" TEXT NOT NULL,
    "taskId" TEXT,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Task_kidId_idx" ON "Task"("kidId");

-- CreateIndex
CREATE INDEX "Completion_kidId_weekStart_idx" ON "Completion"("kidId", "weekStart");

-- CreateIndex
CREATE INDEX "Completion_taskId_weekStart_status_idx" ON "Completion"("taskId", "weekStart", "status");

-- CreateIndex
CREATE INDEX "LedgerEntry_kidId_weekStart_idx" ON "LedgerEntry"("kidId", "weekStart");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
