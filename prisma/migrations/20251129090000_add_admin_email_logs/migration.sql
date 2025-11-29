-- CreateEnum
CREATE TYPE "AdminEmailSendType" AS ENUM ('SINGLE', 'MULTI', 'ALL');

-- CreateEnum
CREATE TYPE "AdminEmailStatus" AS ENUM ('PENDING', 'SENDING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "admin_email_logs" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "htmlContent" TEXT,
    "complianceInfo" JSONB,
    "sendType" "AdminEmailSendType" NOT NULL,
    "status" "AdminEmailStatus" NOT NULL DEFAULT 'PENDING',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "failureReason" TEXT,
    "recipients" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_email_logs_createdAt_idx" ON "admin_email_logs"("createdAt");

-- CreateIndex
CREATE INDEX "admin_email_logs_status_idx" ON "admin_email_logs"("status");

-- AddForeignKey
ALTER TABLE "admin_email_logs" ADD CONSTRAINT "admin_email_logs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

