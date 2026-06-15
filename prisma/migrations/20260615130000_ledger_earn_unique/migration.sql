-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_kidId_weekStart_taskId_key" ON "LedgerEntry"("kidId", "weekStart", "taskId");
