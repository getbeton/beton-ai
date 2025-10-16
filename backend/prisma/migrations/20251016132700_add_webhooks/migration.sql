-- CreateTable: Incoming Webhooks
-- Allows tables to receive data via HTTP POST from external services
CREATE TABLE "incoming_webhooks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fieldMapping" JSONB NOT NULL DEFAULT '{}',
    "receivedCount" INTEGER NOT NULL DEFAULT 0,
    "lastReceivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incoming_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Outbound Webhooks
-- Sends data to external URLs when table events occur
CREATE TABLE "outbound_webhooks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "secretKey" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 3,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "deliveryCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastDeliveryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbound_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Webhook Deliveries
-- Logs all outbound webhook delivery attempts
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "responseTime" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique webhook URL
CREATE UNIQUE INDEX "incoming_webhooks_url_key" ON "incoming_webhooks"("url");

-- CreateIndex: One incoming webhook per table
CREATE UNIQUE INDEX "incoming_webhooks_tableId_key" ON "incoming_webhooks"("tableId");

-- CreateIndex: User webhooks lookup
CREATE INDEX "incoming_webhooks_userId_idx" ON "incoming_webhooks"("userId");

-- CreateIndex: User webhooks lookup
CREATE INDEX "outbound_webhooks_userId_idx" ON "outbound_webhooks"("userId");

-- CreateIndex: Table webhooks lookup
CREATE INDEX "outbound_webhooks_tableId_idx" ON "outbound_webhooks"("tableId");

-- CreateIndex: Delivery history lookup
CREATE INDEX "webhook_deliveries_webhookId_idx" ON "webhook_deliveries"("webhookId");

-- CreateIndex: Recent deliveries lookup
CREATE INDEX "webhook_deliveries_createdAt_idx" ON "webhook_deliveries"("createdAt" DESC);

-- AddForeignKey: Incoming webhooks belong to tables
ALTER TABLE "incoming_webhooks" ADD CONSTRAINT "incoming_webhooks_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "user_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Outbound webhooks belong to tables
ALTER TABLE "outbound_webhooks" ADD CONSTRAINT "outbound_webhooks_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "user_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Deliveries belong to outbound webhooks
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "outbound_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;


