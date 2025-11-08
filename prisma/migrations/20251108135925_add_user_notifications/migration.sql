-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER', 'SYSTEM', 'PROMOTION', 'WISHLIST', 'CART', 'PRODUCT', 'ACCOUNT', 'SHIPPING', 'PAYMENT', 'REVIEW', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('ORDER_PLACED', 'ORDER_CONFIRMED', 'ORDER_PROCESSING', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELLED', 'ORDER_REFUNDED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'SHIPPING_UPDATE', 'PRODUCT_RESTOCKED', 'PRODUCT_PRICE_DROP', 'CART_ABANDONMENT', 'WISHLIST_PRICE_DROP', 'WISHLIST_RESTOCKED', 'ACCOUNT_WELCOME', 'ACCOUNT_SECURITY', 'PROMOTION_START', 'PROMOTION_ENDING', 'REVIEW_REMINDER', 'CUSTOM_MESSAGE');

-- CreateEnum
CREATE TYPE "UserTargetType" AS ENUM ('ALL_USERS', 'NEW_USERS', 'ACTIVE_USERS', 'INACTIVE_USERS', 'HAS_ORDERS', 'NO_ORDERS', 'HAS_CART', 'CART_ABANDONMENT', 'HAS_WISHLIST', 'HIGH_VALUE', 'SPECIFIC_USERS');

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "readOnClick" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "readOnClick" BOOLEAN NOT NULL DEFAULT true,
    "targetUserType" "UserTargetType"[],
    "targetUserIds" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_notifications_userId_idx" ON "user_notifications"("userId");

-- CreateIndex
CREATE INDEX "user_notifications_read_idx" ON "user_notifications"("read");

-- CreateIndex
CREATE INDEX "user_notifications_type_idx" ON "user_notifications"("type");

-- CreateIndex
CREATE INDEX "user_notifications_category_idx" ON "user_notifications"("category");

-- CreateIndex
CREATE INDEX "user_notifications_createdAt_idx" ON "user_notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notification_templates_isActive_idx" ON "notification_templates"("isActive");

-- CreateIndex
CREATE INDEX "notification_templates_scheduledAt_idx" ON "notification_templates"("scheduledAt");

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

