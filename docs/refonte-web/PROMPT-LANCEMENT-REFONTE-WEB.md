# Prompt à coller dans Claude Code · refonte web (ordinateur et tablette)

À coller tel quel dans une nouvelle session Claude Code ouverte sur le dépôt `jumanly` (branche `main` à jour), une fois la refonte mobile terminée ou en parallèle si les fondations mobiles sont déjà fusionnées.

---

Tu travailles sur Jumanly. Lis d'abord `CLAUDE.md`, puis, dans cet ordre :

1. `docs/refonte-web/BRIEF-WEB-CLAUDE-CODE.md` ;
2. les deux briefs mobiles, qui restent la référence fonctionnelle : `docs/refonte-mobile/BRIEF-TALENT-CLAUDE-CODE.md` et `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md` ;
3. les planches web `docs/refonte-web/` : `talent-1` à `talent-4`, `studio-cv`, `recruteur-1` à `recruteur-4`, `admin-1` et `admin-2`, avec le cadre commun `docs/refonte-mobile/maquette/source/web.py`.

Le web reprend toutes les fonctions et l'identité du mobile ; seule la disposition change (barre latérale avec Orbi au centre et `Ctrl K` sur ordinateur, rail sur tablette, Orbi en panneau à droite, fenêtres centrées). Un seul code pour les trois largeurs, mêmes routes `/app/*`. L'administration d'entreprise (`/app/organisation/*`) est nouvelle et réservée au web : l'administrateur n'a pas d'espace talent, il a un compte RH rattaché à l'organisation et passe d'Administration à Recrutement par le nom de l'organisation.

Méthode :

- Commence par le lot 0 du brief : diagnostic de l'existant et plan, avec la liste des fichiers à supprimer. Écris-le dans `docs/journal.md`, puis enchaîne sans attendre.
- Ensuite, un lot = une branche et une PR, dans l'ordre : W0 cadre commun, talent (1, 2, Studio CV, 3, 4), recruteur (1 à 4), admin 1, admin 2.
- Pour chaque écran, ouvre la planche HTML et sa capture, et reproduis fidèlement la mise en forme (valeurs exactes dans les fichiers `source/`). Pas de marqueurs ni de numéros d'appui. Aucune fonction mobile ne doit manquer : coche dans chaque PR la correspondance écran mobile → écran web.
- Respecte les règles d'or : candidater toujours gratuit ; droits par clés (`org.seats`, `org.teams`, `org.permissions.level`…), jamais de nom de forfait ; Orbi propose, l'humain décide (Appliquer / Modifier / Refuser, aucun rejet automatique, aucun changement de rôle, siège ou crédit sans accord) ; isolation par `organizationId` et rôle vérifié côté serveur sur chaque action ; journal d'audit pour chaque action d'administration ; aucun numéro de téléphone Jumanly ; aucun texte en dur (`textes/textes-application.md` → `pnpm messages`) ; seed fictif (Mwinda Énergies) en local et previews seulement ; aucune donnée d'utilisateur supprimée (migrations additives, nommées clairement).
- La validation des offres avant publication et la limite de crédits Orbi par membre sont des réglages désactivés par défaut, en attente de confirmation : note-les dans `docs/decisions/`.
- Définition de fini de chaque lot : captures Playwright à 1440 px et 1024 px, clair et sombre, comparées aux captures des planches et écarts corrigés, sans régression à 390 px ; `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build`, `pnpm messages:check` et les e2e des parcours touchés passent ; `docs/journal.md` à jour ; tout écart noté dans `docs/decisions/`.
- À la fin : contrôle final (chaque route `/app/*` à 1440 et 1024 px ne montre que le nouveau design), liste des fichiers supprimés, et un récapitulatif de ce qui reste à faire avant la mise en production.

En cas d'ambiguïté, choisis l'option la plus simple qui respecte les règles d'or, note-la dans le journal et continue.
