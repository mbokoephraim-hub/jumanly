-- CreateEnum
CREATE TYPE "AudienceKind" AS ENUM ('profile_visit', 'post_view', 'post_impression');

-- CreateTable
CREATE TABLE "AudienceEvent" (
    "kind" "AudienceKind" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "day" DATE NOT NULL,

    CONSTRAINT "AudienceEvent_pkey" PRIMARY KEY ("kind","targetId","viewerId","day")
);

-- CreateIndex
CREATE INDEX "AudienceEvent_ownerId_kind_day_idx" ON "AudienceEvent"("ownerId", "kind", "day");

-- AddForeignKey
ALTER TABLE "AudienceEvent" ADD CONSTRAINT "AudienceEvent_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
