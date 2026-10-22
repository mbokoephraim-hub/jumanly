-- AlterTable
ALTER TABLE "TalentProfile" ADD COLUMN     "banner" TEXT;

-- CreateTable
CREATE TABLE "ProfileBanner" (
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileBanner_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileBanner_token_key" ON "ProfileBanner"("token");

-- AddForeignKey
ALTER TABLE "ProfileBanner" ADD CONSTRAINT "ProfileBanner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
