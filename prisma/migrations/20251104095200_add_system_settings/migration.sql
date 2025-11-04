-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "siteName" TEXT NOT NULL DEFAULT 'YoYo Mall',
    "siteDescription" TEXT,
    "siteUrl" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'zh-CN',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'CNY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
