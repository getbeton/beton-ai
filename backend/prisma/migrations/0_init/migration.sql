-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastHealthCheck" TIMESTAMP(3),
    "healthStatus" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "keySource" TEXT NOT NULL DEFAULT 'personal',
    "platformKeyId" TEXT,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "keyType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_api_keys" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "rateLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tables" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "sourceId" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isProcessing" BOOLEAN NOT NULL DEFAULT false,
    "processingJobId" TEXT,

    CONSTRAINT "user_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_columns" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "defaultValue" TEXT,
    "order" INTEGER NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_rows" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "sourceRowId" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_cells" (
    "id" TEXT NOT NULL,
    "rowId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_cells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_download_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL DEFAULT 'apollo_people_search',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "searchQuery" JSONB NOT NULL,
    "totalEstimated" INTEGER,
    "totalProcessed" INTEGER NOT NULL DEFAULT 0,
    "currentPage" INTEGER NOT NULL DEFAULT 1,
    "totalPages" INTEGER,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "bullJobId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_download_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_download_progress" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulk_download_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integrations_userId_serviceName_name_key" ON "integrations"("userId", "serviceName", "name");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_integrationId_keyType_key" ON "api_keys"("integrationId", "keyType");

-- CreateIndex
CREATE UNIQUE INDEX "platform_api_keys_serviceName_key" ON "platform_api_keys"("serviceName");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_tables_userId_name_key" ON "user_tables"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "table_columns_tableId_name_key" ON "table_columns"("tableId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "table_cells_rowId_columnId_key" ON "table_cells"("rowId", "columnId");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_download_progress_jobId_page_key" ON "bulk_download_progress"("jobId", "page");

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_platformKeyId_fkey" FOREIGN KEY ("platformKeyId") REFERENCES "platform_api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_columns" ADD CONSTRAINT "table_columns_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "user_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_rows" ADD CONSTRAINT "table_rows_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "user_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_cells" ADD CONSTRAINT "table_cells_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "table_columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_cells" ADD CONSTRAINT "table_cells_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "table_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_download_jobs" ADD CONSTRAINT "bulk_download_jobs_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "user_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_download_progress" ADD CONSTRAINT "bulk_download_progress_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "bulk_download_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

