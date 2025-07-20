-- CreateTable
CREATE TABLE "ai_task_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "modelConfig" JSONB NOT NULL DEFAULT '{}',
    "executionScope" TEXT NOT NULL,
    "targetRowIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetCellId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "failedTasks" INTEGER NOT NULL DEFAULT 0,
    "bullJobId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_task_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_task_executions" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "cellId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "error" TEXT,
    "tokensUsed" INTEGER,
    "cost" DECIMAL(10,6),
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_task_executions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ai_task_jobs" ADD CONSTRAINT "ai_task_jobs_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "user_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_task_jobs" ADD CONSTRAINT "ai_task_jobs_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "table_columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_task_executions" ADD CONSTRAINT "ai_task_executions_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ai_task_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_task_executions" ADD CONSTRAINT "ai_task_executions_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "table_cells"("id") ON DELETE CASCADE ON UPDATE CASCADE;
