# Refonte complète de l'interface · plan en 3 étapes (décision d'Ephraïm, 19/10/2026)

Instruction permanente pour Claude Code. Elle prime sur l'ordre de travail des briefs (`docs/refonte-mobile/BRIEF-*.md` § 4, `docs/refonte-web/BRIEF-WEB-CLAUDE-CODE.md` § 5) ; le contenu de ces briefs reste la référence.

## Règle

1. **Les maquettes finales s'appliquent intégralement à l'application.** L'ancien design (mobile et ordinateur) est **effacé** : composants, styles, pages, routes en double et code mort supprimés ; les anciennes routes redirigent vers les nouvelles. Aucune bascule ancien/nouveau, aucun écran laissé à l'ancien style.
2. **Données intactes** : on efface le design, jamais les données d'utilisateur. Migrations additives, nommées clairement.
3. **Maquettes finales = la dernière version** de chaque planche dans le dépôt (planches v2 `r1plus` à `r3plus` pour le recruteur mobile, lot 4 talent avec « adapter à un texte collé », etc.). Ce qui a déjà été codé d'après une version antérieure est **remis à jour** sur la dernière version.
4. **Une étape à la fois.** On ne commence pas l'étape suivante avant que la précédente soit terminée (définition de fini ci-dessous) et validée par Ephraïm.

## Étape 1 · Interface Talent : application mobile et web sur ordinateur

- Mobile : `docs/refonte-mobile/BRIEF-TALENT-CLAUDE-CODE.md`, planches `docs/refonte-mobile/maquette/`, `talent-1` à `talent-4`, `attestation/`. Les lots 1 à 6 sont fusionnés (PR #97 à #103) : les **revoir** contre la dernière version des planches et corriger les écarts, puis faire le lot 7 (abonnement, paiement, factures, paramètres, aide, redirections, suppression du code mort).
- Ordinateur et tablette : `docs/refonte-web/BRIEF-WEB-CLAUDE-CODE.md` (W0 cadre commun, puis lots talent 1, 2, Studio CV, 3, 4) et planches `docs/refonte-web/talent-1` à `talent-4`, `studio-cv`.
- Fin de l'étape : toutes les routes talent (`/app/*` hors `/app/hire` et `/app/organisation`), publiques d'authentification et premiers pas, ne montrent que le nouveau design à 390, 1024 et 1440 px, en clair et en sombre.

> **Mise à jour du 22/10/2026** : pour les étapes 2 et 3, la référence est désormais `docs/modele-b-recruteur/BRIEF-MODELE-B-RECRUTEUR-CLAUDE-CODE.md`. L'étape 2 couvre le recruteur sur mobile, sur tablette et sur ordinateur (lots R0 à R8). L'étape 3 couvre l'administrateur et l'entreprise sur le web (lots A1 à A6). Les briefs et planches recruteur et admin de `docs/refonte-mobile/` et `docs/refonte-web/` cités ci-dessous sont remplacés.

## Étape 2 · Interface Recruteur : application mobile et web sur ordinateur

- Mobile : `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md`, `docs/audit-hire/AUDIT-HIRE-MOBILE.md`, planches `recruteur-1` à `recruteur-4` (v2 comprises).
- Ordinateur et tablette : `docs/refonte-web/BRIEF-WEB-CLAUDE-CODE.md`, lots recruteur 1 à 4, planches `docs/refonte-web/recruteur-1` à `recruteur-4`.
- Fin de l'étape : toutes les routes `/app/hire/*` et les écrans recruteur communs (messages, notifications, compte RH, abonnement RH) ne montrent que le nouveau design aux trois largeurs, clair et sombre.

## Étape 3 · Interface Entreprise et administrateur recruteur : web uniquement

- `docs/refonte-web/BRIEF-WEB-CLAUDE-CODE.md` § 4, planches `docs/refonte-web/admin-1` et `admin-2`.
- L'administrateur n'a pas d'espace talent : compte RH rattaché à l'organisation, bascule Administration ↔ Recrutement.
- Sous 768 px, `/app/organisation/*` affiche « À ouvrir sur un ordinateur » (sauf accepter une invitation et répondre à une demande de crédits).
- Fin de l'étape : l'ancien `/app/organisation` et tout reste d'ancien écran entreprise sont supprimés.

## Méthode, à chaque étape

- D'abord un diagnostic court dans `docs/journal.md` : écrans faits, écrans à refaire, fichiers de l'ancien design à supprimer.
- Un lot = une branche et une PR. Chaque PR liste les fichiers supprimés et la correspondance écran de maquette → écran codé.
- Définition de fini : captures Playwright de chaque écran (390 px pour le mobile ; 1024 et 1440 px pour le web), clair et sombre, comparées aux captures des planches, écarts corrigés ; `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build`, `pnpm messages:check` et les e2e touchés passent ; journal à jour ; écarts dans `docs/decisions/`.
- À la fin de l'étape : un rapport dans `docs/journal.md` (ce qui est fait, ce qui reste, captures dans `captures/etape-N/`), puis arrêt en attendant la validation d'Ephraïm.
