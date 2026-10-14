-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "style" JSONB,
ALTER COLUMN "templateId" SET DEFAULT 'classique';

-- Template ids of the October 2026 catalogue (docs/modeles-cv): the content does not change.
UPDATE "Document" SET "templateId" = 'classique' WHERE "templateId" = 'classic';
UPDATE "Document" SET "templateId" = 'moderne' WHERE "templateId" = 'modern';
