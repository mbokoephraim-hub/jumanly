-- CreateEnum
CREATE TYPE "PlatformCostCategory" AS ENUM ('acquisition', 'hosting', 'ai_external', 'other');

-- CreateTable
CREATE TABLE "PlatformCost" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "category" "PlatformCostCategory" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "note" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformCost_month_category_key" ON "PlatformCost"("month", "category");
