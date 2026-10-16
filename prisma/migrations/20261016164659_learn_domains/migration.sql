-- CreateEnum
CREATE TYPE "EditorialLine" AS ENUM ('originals', 'expert_series', 'partner_programs');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "domainId" TEXT,
ADD COLUMN     "editorialLine" "EditorialLine" NOT NULL DEFAULT 'originals';

-- CreateTable
CREATE TABLE "LearningDomain" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT 'learn',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningDomain_slug_key" ON "LearningDomain"("slug");

-- CreateIndex
CREATE INDEX "LearningDomain_order_idx" ON "LearningDomain"("order");

-- CreateIndex
CREATE INDEX "Course_domainId_idx" ON "Course"("domainId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "LearningDomain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Learn v2, étape 1 : les 7 domaines du catalogue (modifiables ensuite dans /admin/formations/domaines).
INSERT INTO "LearningDomain" ("id", "slug", "name", "description", "icon", "order", "updatedAt") VALUES
  ('dom_career_employability', 'career-employability', 'Career & Employability', 'Préparer sa recherche d''emploi, son CV, ses entretiens et son projet professionnel.', 'career', 1, CURRENT_TIMESTAMP),
  ('dom_digital_productivity', 'digital-productivity', 'Digital & Productivity Skills', 'Maîtriser les outils numériques et bureautiques du quotidien professionnel.', 'grid', 2, CURRENT_TIMESTAMP),
  ('dom_design_creative', 'design-creative', 'Design & Creative Skills', 'Créer des visuels, des supports et des contenus soignés.', 'edit', 3, CURRENT_TIMESTAMP),
  ('dom_business_management', 'business-management', 'Business & Management', 'Gérer un projet, une équipe, un budget ou une activité.', 'entreprise', 4, CURRENT_TIMESTAMP),
  ('dom_professional_communication', 'professional-communication', 'Professional Communication', 'Écrire, présenter, convaincre et servir un client avec aisance.', 'message', 5, CURRENT_TIMESTAMP),
  ('dom_ai_digital_tools', 'ai-digital-tools', 'AI & Digital Tools', 'Utiliser l''intelligence artificielle et les outils numériques avec méthode.', 'intelligence', 6, CURRENT_TIMESTAMP),
  ('dom_skills_monetisation', 'skills-monetisation-freelancing', 'Skills Monetisation & Freelancing', 'Vendre ses compétences, trouver des clients et travailler en indépendant.', 'mobile-money', 7, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- Les formations existantes rejoignent le domaine qui correspond à leur thème actuel ; les autres
-- restent sans domaine jusqu'à ce que l'équipe les range dans le studio.
UPDATE "Course" SET "domainId" = 'dom_career_employability'
  WHERE "domainId" IS NULL AND lower("category") IN ('carrière', 'employabilité', 'compétences de vie', 'compétences comportementales', 'career & employability');
UPDATE "Course" SET "domainId" = 'dom_digital_productivity'
  WHERE "domainId" IS NULL AND lower("category") IN ('bureautique', 'compétences numériques', 'digital & productivity skills');
UPDATE "Course" SET "domainId" = 'dom_professional_communication'
  WHERE "domainId" IS NULL AND lower("category") IN ('communication', 'relation client', 'professional communication');
UPDATE "Course" SET "domainId" = 'dom_business_management'
  WHERE "domainId" IS NULL AND lower("category") IN ('gestion de projet', 'management', 'business & management');
UPDATE "Course" SET "domainId" = 'dom_ai_digital_tools'
  WHERE "domainId" IS NULL AND lower("category") IN ('intelligence artificielle', 'ia', 'ai & digital tools');
