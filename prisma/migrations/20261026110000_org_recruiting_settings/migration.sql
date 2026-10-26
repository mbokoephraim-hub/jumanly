-- Réglages du recrutement de l'entreprise (étape 3, A5) : colonnes ajoutées, aucune donnée touchée.
ALTER TABLE "Organization" ADD COLUMN "pipelineTemplate" JSONB;
ALTER TABLE "Organization" ADD COLUMN "scorecardCriteria" JSONB;
