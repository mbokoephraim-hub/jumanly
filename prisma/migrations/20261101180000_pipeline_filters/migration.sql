-- Filtres enregistrés du pipeline et tri à l'aveugle (logique du recrutement, étape 5)
ALTER TABLE "Job" ADD COLUMN "pipelineFilters" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "blindSort" BOOLEAN NOT NULL DEFAULT false;
