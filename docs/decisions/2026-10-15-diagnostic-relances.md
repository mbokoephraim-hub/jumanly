# Diagnostic : questions de relance et mini plan gratuit

- Les 2 questions de relance coûtent 1 crédit IA (fonction `diagnostic_followup`), en plus des
  2 crédits de la synthèse. Sans modèle, des questions choisies par règles les remplacent, sans
  crédit, pour que le parcours reste le même.
- Le mini plan est construit par règles à partir des 3 priorités (dimensions les plus basses).
  En Free, il n'y a pas d'appel à l'IA (partie 05 § 3.1) : les phrases sont fixes. Au niveau
  personnalisé, le modèle les réécrit, une par priorité retenue.
- Le mini plan n'est pas enregistré comme plan de progression (réservé à `career.progress_plan`) ;
  il est affiché dans le bilan, avec ses liens.
- Les options payantes listées sont des clés de droits (`upgradeOptions`), jamais des noms de
  forfait ; le forfait affiché est le moins cher qui ouvre la clé, lu en base.
