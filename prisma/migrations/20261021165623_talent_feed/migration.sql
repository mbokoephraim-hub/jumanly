-- CreateEnum
CREATE TYPE "FeedPostKind" AS ENUM ('post', 'newRole', 'work', 'certificate', 'event');

-- CreateEnum
CREATE TYPE "FeedReplyPolicy" AS ENUM ('everyone', 'connections', 'nobody');

-- CreateTable
CREATE TABLE "FeedPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "organizationId" TEXT,
    "kind" "FeedPostKind" NOT NULL DEFAULT 'post',
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "jobId" TEXT,
    "attachment" JSONB,
    "quotedId" TEXT,
    "parentId" TEXT,
    "replyPolicy" "FeedReplyPolicy" NOT NULL DEFAULT 'everyone',
    "eventAt" TIMESTAMP(3),
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedLike" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedLike_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "FeedRepost" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedRepost_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "FeedSave" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedSave_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "FeedFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedHiddenType" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedHiddenType_pkey" PRIMARY KEY ("userId","type")
);

-- CreateTable
CREATE TABLE "FeedEventParticipant" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedEventParticipant_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "FeedImage" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "postId" TEXT,
    "contentType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedPost_parentId_createdAt_idx" ON "FeedPost"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedPost_createdAt_idx" ON "FeedPost"("createdAt");

-- CreateIndex
CREATE INDEX "FeedPost_authorId_createdAt_idx" ON "FeedPost"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedPost_organizationId_createdAt_idx" ON "FeedPost"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedLike_userId_idx" ON "FeedLike"("userId");

-- CreateIndex
CREATE INDEX "FeedRepost_userId_createdAt_idx" ON "FeedRepost"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedSave_userId_createdAt_idx" ON "FeedSave"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeedFollow_followerId_userId_key" ON "FeedFollow"("followerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedFollow_followerId_organizationId_key" ON "FeedFollow"("followerId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedImage_token_key" ON "FeedImage"("token");

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_quotedId_fkey" FOREIGN KEY ("quotedId") REFERENCES "FeedPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedRepost" ADD CONSTRAINT "FeedRepost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedRepost" ADD CONSTRAINT "FeedRepost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedSave" ADD CONSTRAINT "FeedSave_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedSave" ADD CONSTRAINT "FeedSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedFollow" ADD CONSTRAINT "FeedFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedFollow" ADD CONSTRAINT "FeedFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedFollow" ADD CONSTRAINT "FeedFollow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedHiddenType" ADD CONSTRAINT "FeedHiddenType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedEventParticipant" ADD CONSTRAINT "FeedEventParticipant_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedEventParticipant" ADD CONSTRAINT "FeedEventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedImage" ADD CONSTRAINT "FeedImage_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedImage" ADD CONSTRAINT "FeedImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
