-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "previous" JSONB NOT NULL,
    "reason" TEXT,
    "action" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentVersion_item_locale_createdAt_idx" ON "ContentVersion"("item", "locale", "createdAt");
