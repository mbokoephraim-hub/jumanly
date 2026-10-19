-- Refonte mobile lot 4: the offer a CV was adapted to, so the application proposes it first.
ALTER TABLE "Document" ADD COLUMN "adaptedForJobId" TEXT;
