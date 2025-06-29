-- CreateTable
CREATE TABLE "mock_organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "linkedinUrl" TEXT,
    "industry" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "foundedYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_people" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "seniority" TEXT NOT NULL,
    "departments" TEXT[],
    "emailStatus" TEXT NOT NULL,
    "phoneStatus" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_config_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "breadcrumb_cache" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "filterKey" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "breadcrumb_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mock_organizations_domain_key" ON "mock_organizations"("domain");

-- CreateIndex
CREATE INDEX "mock_organizations_name_idx" ON "mock_organizations"("name");

-- CreateIndex
CREATE INDEX "mock_organizations_industry_idx" ON "mock_organizations"("industry");

-- CreateIndex
CREATE INDEX "mock_organizations_size_idx" ON "mock_organizations"("size");

-- CreateIndex
CREATE INDEX "mock_organizations_createdAt_idx" ON "mock_organizations"("createdAt");

-- CreateIndex
CREATE INDEX "mock_people_name_idx" ON "mock_people"("name");

-- CreateIndex
CREATE INDEX "mock_people_title_idx" ON "mock_people"("title");

-- CreateIndex
CREATE INDEX "mock_people_seniority_idx" ON "mock_people"("seniority");

-- CreateIndex
CREATE INDEX "mock_people_emailStatus_idx" ON "mock_people"("emailStatus");

-- CreateIndex
CREATE INDEX "mock_people_phoneStatus_idx" ON "mock_people"("phoneStatus");

-- CreateIndex
CREATE INDEX "mock_people_createdAt_idx" ON "mock_people"("createdAt");

-- CreateIndex
CREATE INDEX "mock_people_organizationId_idx" ON "mock_people"("organizationId");

-- CreateIndex
CREATE INDEX "mock_people_organizationId_createdAt_idx" ON "mock_people"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "mock_people_name_createdAt_idx" ON "mock_people"("name", "createdAt");

-- CreateIndex
CREATE INDEX "mock_locations_name_idx" ON "mock_locations"("name");

-- CreateIndex
CREATE INDEX "mock_locations_country_idx" ON "mock_locations"("country");

-- CreateIndex
CREATE INDEX "mock_locations_organizationId_idx" ON "mock_locations"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "breadcrumb_cache_category_filterKey_key" ON "breadcrumb_cache"("category", "filterKey");

-- AddForeignKey
ALTER TABLE "mock_people" ADD CONSTRAINT "mock_people_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mock_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_locations" ADD CONSTRAINT "mock_locations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mock_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

