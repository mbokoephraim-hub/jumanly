-- CreateEnum
CREATE TYPE "CourseDocumentKind" AS ENUM ('support', 'exercises', 'reading', 'template', 'answer_key', 'other');

-- CreateEnum
CREATE TYPE "CourseDocumentVisibility" AS ENUM ('public', 'enrolled', 'team');

-- CreateTable
CREATE TABLE "CourseDocument" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT,
    "title" TEXT NOT NULL,
    "kind" "CourseDocumentKind" NOT NULL,
    "visibility" "CourseDocumentVisibility" NOT NULL DEFAULT 'enrolled',
    "specialized" BOOLEAN NOT NULL DEFAULT false,
    "storageKey" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "pages" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseDocument_storageKey_key" ON "CourseDocument"("storageKey");

-- CreateIndex
CREATE INDEX "CourseDocument_courseId_order_idx" ON "CourseDocument"("courseId", "order");

-- AddForeignKey
ALTER TABLE "CourseDocument" ADD CONSTRAINT "CourseDocument_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseDocument" ADD CONSTRAINT "CourseDocument_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
