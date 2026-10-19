-- CreateTable
CREATE TABLE "OrbiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL DEFAULT 'other',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrbiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrbiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "why" TEXT,
    "source" TEXT,
    "limit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrbiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrbiConversation_userId_updatedAt_idx" ON "OrbiConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "OrbiMessage_conversationId_createdAt_idx" ON "OrbiMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "OrbiConversation" ADD CONSTRAINT "OrbiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrbiMessage" ADD CONSTRAINT "OrbiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "OrbiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
