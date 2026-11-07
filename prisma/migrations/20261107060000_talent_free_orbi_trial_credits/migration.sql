-- Évaluation de l'espace talent (Ephraïm, 07/11/2026) : la formule gratuite reçoit 5 crédits Orbi
-- par mois. Seule la valeur d'origine (0) est changée : une valeur déjà réglée dans l'admin reste.
UPDATE "PlanEntitlement"
SET "value" = '5'
WHERE "key" = 'ai.credits.monthly'
  AND "value" = '0'
  AND "planId" IN (SELECT "id" FROM "Plan" WHERE "code" = 'talent_free');
