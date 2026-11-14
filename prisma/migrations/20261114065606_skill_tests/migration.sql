-- CreateTable
CREATE TABLE "SkillTest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "jobId" TEXT,
    "title" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'intermediate',
    "minutes" INTEGER NOT NULL DEFAULT 30,
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "templateKey" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTestQuestion" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'choice',
    "prompt" TEXT NOT NULL,
    "choices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "answer" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SkillTestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTestInvite" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "sentById" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "answers" JSONB NOT NULL DEFAULT '{}',
    "grades" JSONB NOT NULL DEFAULT '{}',
    "score" INTEGER,
    "remindedAt" TIMESTAMP(3),
    "reminders" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SkillTestInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillTest_organizationId_status_idx" ON "SkillTest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "SkillTest_jobId_idx" ON "SkillTest"("jobId");

-- CreateIndex
CREATE INDEX "SkillTestQuestion_testId_order_idx" ON "SkillTestQuestion"("testId", "order");

-- CreateIndex
CREATE INDEX "SkillTestInvite_applicationId_idx" ON "SkillTestInvite"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTestInvite_testId_applicationId_key" ON "SkillTestInvite"("testId", "applicationId");

-- AddForeignKey
ALTER TABLE "SkillTest" ADD CONSTRAINT "SkillTest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTest" ADD CONSTRAINT "SkillTest_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTestQuestion" ADD CONSTRAINT "SkillTestQuestion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "SkillTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTestInvite" ADD CONSTRAINT "SkillTestInvite_testId_fkey" FOREIGN KEY ("testId") REFERENCES "SkillTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTestInvite" ADD CONSTRAINT "SkillTestInvite_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Droit « hire.assessments » (tests de compétences) : ouvert aux formules payantes recruteur et
-- entreprise, fermé à la formule gratuite. Une valeur déjà réglée dans l'admin reste.
INSERT INTO "PlanEntitlement" ("id", "planId", "key", "type", "value")
SELECT 'pe_assess_' || p."code", p."id", 'hire.assessments', 'boolean',
       CASE WHEN p."code" = 'rh_free' THEN 'false' ELSE 'true' END
FROM "Plan" AS p
WHERE p."family" IN ('rh', 'company')
ON CONFLICT ("planId", "key") DO NOTHING;
