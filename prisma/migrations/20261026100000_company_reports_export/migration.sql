-- Export des rapports ouvert à toutes les formules Company (décision d'Ephraïm du 22/10/2026,
-- docs/decisions/2026-10-26-etape-3-a4-formule-facturation.md). Données seulement : aucune colonne.
UPDATE "PlanEntitlement" AS pe
SET "value" = 'true'
FROM "Plan" AS p
WHERE pe."planId" = p."id"
  AND p."family" = 'company'
  AND pe."key" = 'reports.export';
