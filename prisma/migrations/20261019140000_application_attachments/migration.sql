-- Refonte mobile lot 4: documents joined to an application (additive).
ALTER TABLE "ApplicationDraft" ADD COLUMN "attachments" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Application" ADD COLUMN "attachments" JSONB NOT NULL DEFAULT '[]';
