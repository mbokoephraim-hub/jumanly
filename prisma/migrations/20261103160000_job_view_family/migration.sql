-- Vues d'une offre par famille de compétences des talents connectés (03/11/2026) : un compteur, jamais la personne
CREATE TABLE "JobViewFamily" (
    "jobId" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JobViewFamily_pkey" PRIMARY KEY ("jobId","family")
);

ALTER TABLE "JobViewFamily" ADD CONSTRAINT "JobViewFamily_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
