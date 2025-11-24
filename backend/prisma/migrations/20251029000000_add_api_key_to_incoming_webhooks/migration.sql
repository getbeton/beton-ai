-- Add apiKey column to incoming_webhooks table
-- This field is required for authenticating incoming webhook requests
-- Each webhook gets a unique API key that must be sent in the request headers

-- Enable pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add the apiKey column (nullable first to allow existing rows)
ALTER TABLE "incoming_webhooks" ADD COLUMN "apiKey" TEXT;

-- Generate unique API keys for existing webhooks (if any)
-- Format: whk_live_<random_32_chars>
UPDATE "incoming_webhooks" 
SET "apiKey" = 'whk_live_' || encode(gen_random_bytes(16), 'hex')
WHERE "apiKey" IS NULL;

-- Make apiKey required and unique
ALTER TABLE "incoming_webhooks" ALTER COLUMN "apiKey" SET NOT NULL;
CREATE UNIQUE INDEX "incoming_webhooks_apiKey_key" ON "incoming_webhooks"("apiKey");
CREATE INDEX "incoming_webhooks_apiKey_idx" ON "incoming_webhooks"("apiKey");

