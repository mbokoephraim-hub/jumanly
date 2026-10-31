-- Diplômes et certificats : logo de l'école et « Ce que j'ai appris » (demande d'Ephraïm du 31/10/2026).
ALTER TABLE "Education" ADD COLUMN "schoolLogo" TEXT;
ALTER TABLE "Education" ADD COLUMN "learnings" TEXT NOT NULL DEFAULT '';
