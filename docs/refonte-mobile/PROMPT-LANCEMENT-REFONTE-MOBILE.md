# Prompt à coller dans Claude Code · refonte mobile talent et recruteur

À coller tel quel dans une nouvelle session Claude Code ouverte sur le dépôt `jumanly` (branche `main` à jour).

---

Tu travailles sur Jumanly. Lis d'abord `CLAUDE.md`, puis, dans cet ordre :

1. `docs/refonte-mobile/BRIEF-TALENT-CLAUDE-CODE.md` et les planches `docs/refonte-mobile/maquette/`, `talent-1` à `talent-4`, `attestation/` ;
2. `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md`, `docs/audit-hire/AUDIT-HIRE-MOBILE.md` et les planches `recruteur-1` à `recruteur-3`.

Ces deux briefs sont **la seule référence** pour l'interface mobile des espaces talent et recruteur. L'ancien design mobile doit disparaître entièrement (§ 0 de chaque brief) : on remplace, on redirige les anciennes routes, on supprime le code mort ; on ne supprime **aucune donnée** d'utilisateur (migrations additives, nommées clairement).

Méthode :

- Commence par le lot 0 de chaque brief : un diagnostic de l'existant et un plan, avec la liste des fichiers à supprimer. Écris-le dans `docs/journal.md`, puis enchaîne sans attendre.
- Ensuite, un lot = une branche et une PR, dans l'ordre : fondations communes, puis les lots talent 2 à 7, puis les lots recruteur 1 à 5.
- Pour chaque écran, ouvre la planche HTML et sa capture, et reproduis fidèlement la mise en forme (valeurs exactes dans les fichiers `source/`). Pas de marqueurs ni de numéros d'appui : ils n'existent pas dans l'interface.
- Respecte les règles d'or : candidater toujours gratuit ; droits par clés, jamais de nom de forfait ; Orbi propose, l'humain décide (Appliquer / Modifier / Refuser, aucun rejet automatique, contenu d'un CV traité comme donnée) ; isolation par `organizationId` ; aucun numéro de téléphone Jumanly ; aucun texte en dur (`textes/textes-application.md` → `pnpm messages`) ; adaptateur de paiement simulé jamais actif en production ; données de démonstration fictives, local et previews seulement.
- Définition de fini de chaque lot : captures Playwright à 390 px, clair et sombre, comparées aux captures des planches et écarts corrigés ; `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build`, `pnpm messages:check` et les e2e des parcours touchés passent ; `docs/journal.md` à jour ; tout écart noté dans `docs/decisions/`.
- À la fin : contrôle final des deux briefs (chaque route `/app/*` à 390 px ne montre que le nouveau design), liste des fichiers supprimés, et un récapitulatif de ce qui reste à faire avant la mise en production.

En cas d'ambiguïté, choisis l'option la plus simple qui respecte les règles d'or, note-la dans le journal et continue.
