-- AlterTable
ALTER TABLE "OrgJoinRequest" ADD COLUMN     "message" TEXT;

-- CreateTable
CREATE TABLE "RecruiterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT,
    "jobTitle" TEXT,
    "workEmail" TEXT,
    "phone" TEXT,
    "phoneCountry" TEXT,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "linkedin" TEXT,
    "contactsFor" TEXT NOT NULL DEFAULT 'interview',
    "otherCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "levels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hiresPerYear" TEXT,
    "independent" BOOLEAN NOT NULL DEFAULT false,
    "personalOrganizationId" TEXT,
    "headline" TEXT,
    "hiringNow" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecruiterProfile_userId_key" ON "RecruiterProfile"("userId");

-- AddForeignKey
ALTER TABLE "RecruiterProfile" ADD CONSTRAINT "RecruiterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
