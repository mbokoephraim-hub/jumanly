-- CreateEnum
CREATE TYPE "OrgTaskKind" AS ENUM ('follow', 'diagnostic', 'interview');

-- CreateEnum
CREATE TYPE "OrgTaskStatus" AS ENUM ('assigned', 'accepted', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "DeclaredMemberStatus" AS ENUM ('confirmed', 'rejected');

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "rights" JSONB;

-- CreateTable
CREATE TABLE "OrgTask" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "assignedById" TEXT,
    "kind" "OrgTaskKind" NOT NULL,
    "applicationId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "OrgTaskStatus" NOT NULL DEFAULT 'assigned',
    "remindedAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgDeclaredMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "status" "DeclaredMemberStatus" NOT NULL,
    "respondedById" TEXT,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgDeclaredMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgTask_organizationId_status_idx" ON "OrgTask"("organizationId", "status");

-- CreateIndex
CREATE INDEX "OrgTask_assigneeId_status_idx" ON "OrgTask"("assigneeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OrgDeclaredMember_organizationId_experienceId_key" ON "OrgDeclaredMember"("organizationId", "experienceId");

-- AddForeignKey
ALTER TABLE "OrgTask" ADD CONSTRAINT "OrgTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgTask" ADD CONSTRAINT "OrgTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgTask" ADD CONSTRAINT "OrgTask_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgTask" ADD CONSTRAINT "OrgTask_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgDeclaredMember" ADD CONSTRAINT "OrgDeclaredMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgDeclaredMember" ADD CONSTRAINT "OrgDeclaredMember_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
