-- CreateTable
CREATE TABLE "TeamThread" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberAId" TEXT NOT NULL,
    "memberBId" TEXT NOT NULL,
    "aReadAt" TIMESTAMP(3),
    "bReadAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamThread_organizationId_lastMessageAt_idx" ON "TeamThread"("organizationId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamThread_organizationId_memberAId_memberBId_key" ON "TeamThread"("organizationId", "memberAId", "memberBId");

-- CreateIndex
CREATE INDEX "TeamMessage_threadId_createdAt_idx" ON "TeamMessage"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "TeamThread" ADD CONSTRAINT "TeamThread_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamThread" ADD CONSTRAINT "TeamThread_memberAId_fkey" FOREIGN KEY ("memberAId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamThread" ADD CONSTRAINT "TeamThread_memberBId_fkey" FOREIGN KEY ("memberBId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMessage" ADD CONSTRAINT "TeamMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "TeamThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMessage" ADD CONSTRAINT "TeamMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
