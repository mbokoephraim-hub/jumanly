-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "domain" TEXT,
ADD COLUMN     "keyId" TEXT,
ADD COLUMN     "modules" INTEGER,
ADD COLUMN     "onProfile" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "score" INTEGER,
ADD COLUMN     "signature" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3),
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "ExerciseSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "storageKey" TEXT,
    "fileName" TEXT,
    "size" INTEGER,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseSubmission_storageKey_key" ON "ExerciseSubmission"("storageKey");

-- CreateIndex
CREATE INDEX "ExerciseSubmission_userId_lessonId_idx" ON "ExerciseSubmission"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "ExerciseSubmission" ADD CONSTRAINT "ExerciseSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSubmission" ADD CONSTRAINT "ExerciseSubmission_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
