# Prompt à coller dans Claude Code · refonte complète en 3 étapes

À coller tel quel dans une nouvelle session Claude Code ouverte sur le dépôt `jumanly` (branche `main` à jour). Il remplace les prompts `docs/refonte-mobile/PROMPT-LANCEMENT-REFONTE-MOBILE.md` et `docs/refonte-web/PROMPT-LANCEMENT-REFONTE-WEB.md` pour l'ordre de travail.

---

Tu travailles sur Jumanly. Lis d'abord `CLAUDE.md`, puis `docs/PLAN-REFONTE-EN-3-ETAPES.md` : c'est l'instruction d'Ephraïm, elle fixe l'ordre de travail.

Objectif : appliquer **intégralement** les maquettes finales à l'application et **effacer l'ancien design** (mobile et ordinateur) : composants, styles, pages et routes en double supprimés, anciennes routes redirigées. On n'efface jamais les données d'utilisateur (migrations additives).

On avance étape par étape, sans commencer la suivante avant la validation d'Ephraïm :

1. **Interface Talent**, application mobile puis web sur ordinateur et tablette. Lis `docs/refonte-mobile/BRIEF-TALENT-CLAUDE-CODE.md` et `docs/refonte-web/BRIEF-WEB-CLAUDE-CODE.md`. Les lots mobiles 1 à 6 sont déjà fusionnés : revois-les contre la dernière version des planches et corrige les écarts, fais le lot 7, puis le cadre web commun (W0) et les lots web talent 1, 2, Studio CV, 3 et 4.
2. **Interface Recruteur**, application mobile puis web sur ordinateur et tablette. Lis `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md` (planches v2 comprises) et les lots recruteur du brief web.
3. **Interface Entreprise et administrateur recruteur**, web uniquement. Lis le § 4 du brief web et les planches `admin-1` et `admin-2`.

Commence maintenant par l'étape 1 :

- Écris d'abord dans `docs/journal.md` un diagnostic court : écrans talent déjà conformes, écrans à refaire, fichiers de l'ancien design à supprimer. Puis enchaîne sans attendre.
- Un lot = une branche et une PR. Pour chaque écran, ouvre la planche HTML et sa capture, et reproduis fidèlement la mise en forme (valeurs exactes dans `docs/refonte-mobile/maquette/source/`). Chaque PR liste les fichiers supprimés et la correspondance maquette → écran codé.
- Respecte les règles d'or : candidater toujours gratuit ; droits par clés, jamais de nom de forfait ; Orbi propose, l'humain décide (Appliquer / Modifier / Refuser) ; isolation par `organizationId` ; aucun numéro de téléphone Jumanly ; aucun texte en dur (`textes/textes-application.md` → `pnpm messages`) ; données de démonstration fictives, en local et previews seulement.
- Définition de fini de chaque lot : captures Playwright à 390 px (mobile), 1024 et 1440 px (web), clair et sombre, comparées aux captures des planches et écarts corrigés ; `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build`, `pnpm messages:check` et les e2e touchés passent ; journal à jour ; écarts dans `docs/decisions/`.
- Quand l'étape 1 est terminée (plus aucune route talent avec l'ancien design, aux trois largeurs, en clair et en sombre), écris le rapport de fin d'étape dans `docs/journal.md` avec les captures dans `captures/etape-1/`, et arrête-toi pour la validation d'Ephraïm.

En cas d'ambiguïté, choisis l'option la plus simple qui respecte les règles d'or, note-la dans le journal et continue.
