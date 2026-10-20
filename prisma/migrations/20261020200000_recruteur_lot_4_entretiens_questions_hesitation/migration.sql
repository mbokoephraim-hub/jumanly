-- Recruteur lot 4 (additive): the team's own questions to prepare an interview, and the
-- « Hésitation » suggestion of an evaluation. No data is removed or changed.
ALTER TYPE "ScorecardRecommendation" ADD VALUE 'maybe';

ALTER TABLE "Interview" ADD COLUMN "questions" JSONB NOT NULL DEFAULT '[]';
