# CLAUDE.md · Jumanly

Ce fichier est lu par Claude Code à chaque session. Il contient les règles permanentes du projet. Le détail est dans `docs/`.

## Le projet

Jumanly est une plateforme web africaine qui relie **se former (Learn), enrichir son profil (Career), candidater (Jobs) et être recruté (Hire + Connect)**, avec une couche d'IA explicable (Intelligence) et une administration (Admin). Publics : talents, professionnels RH, entreprises, institutions partenaires. Slogan : « Learn. Grow. Connect. ». Une plateforme développée par The Growth Lab.

Langue de l'interface : **français** (anglais prévu plus tard). Prix en **USD**. Paiement par **Mobile Money** et carte.

## Documents de référence (à lire avant de coder une fonctionnalité)

| Fichier | Contenu |
|---|---|
| `docs/specifications.md`, partie 01 | Vision, publics, modules, principes non négociables |
| `docs/specifications.md`, partie 02 | Stack, arborescence, variables d'environnement |
| `docs/specifications.md`, partie 03 | Couches, moteur de droits, tâches de fond, audit |
| `docs/specifications.md`, partie 04 | Tables et relations |
| `docs/specifications.md`, partie 05 | **Source de vérité** des forfaits, droits, quotas et rôles |
| `docs/specifications.md`, partie 06 | Parcours (inscription avec forfait, candidature, paiement…) |
| `docs/specifications.md`, partie 07 | Toutes les routes et écrans, critères transverses |
| `docs/specifications.md`, partie 08 | Calcul du score, explication, garde-fous de l'IA |
| `docs/specifications.md`, partie 09 | Paiements, abonnements prépayés, webhooks |
| `docs/specifications.md`, partie 10 | Sécurité, données personnelles, modération |
| `docs/specifications.md`, partie 11 | Couleurs, typo, composants, IA dans l'interface |
| `docs/specifications.md`, partie 12 | Étapes E0 à E11, définition de fini, prompts |
| `textes/textes-application.md` | Tous les textes de l'interface (clé → texte) |
| `ressources/` | Jetons CSS, logos, icônes, personnages illustrés, motifs, fonds (voir `ressources/LISEZMOI.md`) |
| `docs/refonte-mobile/` | **Espace talent (mobile) : seule référence depuis le 19/10/2026.** Brief `BRIEF-TALENT-CLAUDE-CODE.md` et planches des lots 1 à 4. Remplace l'ancien design talent, qui doit disparaître. |
| `docs/maquettes/` | Maquettes de référence page par page (hors espace talent, voir ligne précédente) (PDF + HTML). Avant de coder ou de retoucher un écran, ouvrir le PDF et le HTML de sa route et reproduire fidèlement la mise en forme. |

En cas de contradiction : `docs/specifications.md (partie 05)` l'emporte pour les forfaits, `docs/specifications.md (partie 08)` pour le matching, `textes/` pour la formulation. Les maquettes (écran 09 « formules » en particulier) ne font pas foi pour le contenu des forfaits.

## Règles d'or

1. **Candidater est toujours gratuit.** Aucun forfait, quota ou option ne bloque une candidature. Les profils Free sont traités comme les autres.
2. **Jamais de nom de forfait dans le code.** On teste des clés de droits : `can(subject, "career.linkedin")`, `consume(subject, "ai.credits.monthly")`. Forfaits et droits vivent en base et se modifient dans l'admin.
3. **L'IA recommande, l'humain décide.** Aucun rejet automatique. Tout score ou suggestion a un « Pourquoi ? ». Le score de matching est calculé de façon déterministe (doc 08) ; le modèle d'IA ne fait que reformuler ou assister.
4. **Données exclues du matching** : nom, genre, âge, photo, nationalité, origine, religion, situation familiale, santé, handicap, adresse précise.
5. **Confidentialité** : un recruteur ne voit un profil que si le talent a candidaté ou l'a rendu visible ; les partenaires ne voient que des agrégats (seuil de 10 personnes) ; chaque consultation de profil est journalisée.
6. **Isolation des organisations** : toute requête Hire est filtrée par `organizationId`.
7. **Aucun texte en dur.** Tous les textes viennent de `messages/fr.json`, généré depuis `textes/textes-application.md` (`pnpm messages`). Pour un nouveau texte : l'ajouter dans `textes/textes-application.md`, dans la bonne partie, puis régénérer.
8. **Contact uniquement par e-mail** : assistant@jumanly.io, infojumanly@gmail.com. **Aucun numéro de téléphone** nulle part (site, e-mails, factures, pages légales).
9. **Mobile d'abord et réseau lent** : rendu serveur pour le public, 200 Ko de JS max par page publique, images optimisées, vidéo adaptative.
10. **Accessibilité WCAG 2.2 AA.** Texte Sapin sur Lime, jamais blanc sur Lime.
11. **Pas de données inventées en production.** Le seed de démonstration est manifestement fictif et réservé au local et aux previews. N'invente ni statistiques, ni témoignages, ni logos de clients.
12. **Les modèles d'IA sont configurés par variables d'environnement** (`AI_MODEL_DEFAULT`, `AI_MODEL_FAST`), jamais écrits en dur. Chaque appel vérifie consentement, droit et quota, et est journalisé dans `AiUsage`.

## Conventions de code

- TypeScript strict, pas de `any` non justifié. Validation des entrées avec Zod, schémas partagés client/serveur.
- Composants serveur par défaut ; `"use client"` seulement si nécessaire.
- Écritures via Server Actions ou routes API qui suivent l'ordre : valider → session → rôle → droit → quota → service.
- Logique métier dans `src/server/services/`, testable sans Next.js. Services externes derrière une interface avec une implémentation `fake`.
- Noms de code et de base en anglais ; textes et documentation en français ; routes publiques en français (`/formations`, `/offres`, `/tarifs`), espace connecté sous `/app`.
- Montants en centimes USD (entiers). Dates en UTC, affichées dans le fuseau de l'utilisateur.
- Migrations Prisma nommées clairement ; jamais de modification manuelle de la base.
- Tests : unitaires pour les règles (droits, matching, paiements), e2e Playwright pour chaque parcours du doc 06.

## Commandes

```bash
pnpm dev            # serveur local
pnpm lint           # ESLint
pnpm format         # Prettier
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest (règles sans base)
pnpm test:db        # Vitest, règles en base (droits, abonnements)
pnpm test:e2e       # Playwright
pnpm test:e2e:reduced # Playwright, animations réduites (prefers-reduced-motion)
pnpm build          # build de production
pnpm db:migrate     # prisma migrate dev
pnpm db:deploy      # applique les migrations (CI, production)
pnpm db:seed        # forfaits + référentiel + démo (local)
pnpm admin:promote  # donne le rôle administrateur à un compte (e-mail en argument)
pnpm jobs:billing   # tâches d'abonnement : rappels, délai de grâce, retour au gratuit
pnpm db:backup      # sauvegarde de la base (pg_dump, conservation 30 jours)
pnpm db:restore-check <fichier>  # restaure une sauvegarde dans une base de test et la vérifie
pnpm messages       # textes/textes-application.md → messages/fr.json
pnpm messages:check # vérifie que messages/fr.json est à jour
pnpm brand          # ressources/ → icônes et images servies (public/)
pnpm email:dev      # aperçu des e-mails
```

(Créées à l'étape E0 ; garder cette liste à jour. Husky lance ESLint, Prettier, `messages:check` et `brand:check` avant chaque commit.)

## Façon de travailler

- Travailler **étape par étape** selon `docs/specifications.md (partie 12)`. Ne pas anticiper une étape suivante, sauf pour préparer un emplacement.
- Au début d'une tâche : lire les documents cités, proposer un plan court, puis exécuter.
- Avant de terminer : lint, types, tests et build doivent passer ; vérifier la « définition de fini » ; mettre à jour `docs/journal.md`.
- Toute décision technique qui s'écarte des documents : une note courte dans `docs/decisions/AAAA-MM-JJ-sujet.md`.
- En cas d'ambiguïté métier : choisir l'option la plus simple qui respecte les règles d'or, la noter dans le journal, et la signaler.
