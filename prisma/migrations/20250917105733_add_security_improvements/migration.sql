-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN "lastPasswordChange" DATETIME;
ALTER TABLE "admin_users" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "admin_users" ADD COLUMN "resetTokenExpiry" DATETIME;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "orders" ADD COLUMN "referer" TEXT;
ALTER TABLE "orders" ADD COLUMN "userAgent" TEXT;

-- CreateTable
CREATE TABLE "blacklisted_ips" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ip_address" TEXT NOT NULL,
    "reason" TEXT,
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "blacklisted_ips_ip_address_key" ON "blacklisted_ips"("ip_address");

-- CreateIndex
CREATE INDEX "blacklisted_ips_ip_address_idx" ON "blacklisted_ips"("ip_address");
