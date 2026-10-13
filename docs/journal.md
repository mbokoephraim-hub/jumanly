# Journal du projet

Une entrée par étape : ce qui a été fait, les décisions prises, les dettes à rembourser.

## E0 · Socle technique (13 octobre 2026)

### Contexte

Le dépôt était vide. Seuls `PROMPT-DEMARRAGE.md` et `docs/12-feuille-de-route.md` ont été fournis :
**`CLAUDE.md`, `docs/01` à `docs/11`, `textes/` et `ressources/jumanly-tokens.css` sont absents.**
L'étape a été réalisée avec la feuille de route, la charte graphique v1.0, le LISEZMOI des maquettes
et les logos du projet. Tout ce qui dépend des fichiers manquants est marqué « provisoire » ci-dessous.

### Fait

- Next.js 16 (App Router, Turbopack, Cache Components), TypeScript strict, React 19.
- Tailwind CSS 4 branché sur `ressources/jumanly-tokens.css` (bloc `@theme` de `src/app/globals.css`) :
  classes `bg-sapin`, `text-lime`, `rounded-carte`, `text-h1`, `bg-degrade-intelligence`…
- Police Sora servie par le site (`@fontsource-variable/sora` + `next/font/local`), sans appel externe.
- ESLint (règles Next + règle `react/jsx-no-literals` : **aucun texte en dur dans le JSX**), Prettier.
- next-intl, langue unique `fr`, clés de traduction **typées** (une clé inexistante ne compile pas).
- `scripts/build-messages.ts` : lit les tableaux `| Clé | Texte |` de `textes/*.md` et génère
  `messages/fr.json` ; signale doublons, clés invalides, textes vides et conflits.
  `pnpm messages` régénère, `pnpm messages:check` vérifie (CI et `pnpm build`).
- Prisma 7 (adaptateur `pg`) + PostgreSQL 16 avec pgvector (Docker Compose), migration initiale
  qui active l'extension `vector`. Aucun modèle de données : ils viennent de `docs/04` à partir de E1.
- Bibliothèque de 20 composants (`src/components/ui`) : Bouton et BoutonLien, ChampTexte, ZoneTexte,
  ListeDeroulante, CaseACocher, GroupeRadio, Interrupteur, Pastille, Carte, Alerte, Avatar, Onglets,
  BarreProgression, ArcProgression, JaugeQuota, Squelette, Chargeur, EtatVide, Modale, OrbeIA,
  ScoreExplique (score + « Pourquoi ? »), Logo.
- Page `/dev/composants` : tous les composants et leurs états (normal, icône, chargement, désactivé,
  erreur, aide, quotas proche / atteint / illimité…). Non indexée.
- Gabarits : site public (en-tête, menu mobile sans JavaScript, pied de page avec les deux adresses
  e-mail) ; espace connecté (barre latérale desktop, barre de navigation basse sur mobile, lien
  d'évitement « Aller au contenu »).
- Tests : Vitest (script des textes, composants), Playwright (desktop + mobile).
- GitHub Actions : textes, format, lint, types, tests, migrations sur pgvector, build, e2e.
- `.env.example` avec toutes les variables prévues par la stack (modèles IA en variables).

### Définition de fini

| Critère                                                                | État                                       |
| ---------------------------------------------------------------------- | ------------------------------------------ |
| `pnpm dev` démarre                                                     | ✓                                          |
| `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` passent en CI | ✓ en local, CI sur la PR                   |
| `/dev/composants` montre tous les composants avec leurs états          | ✓ (liste provisoire, doc 11 § 11.5 absent) |
| Aucun texte en dur                                                     | ✓ garanti par ESLint                       |

### Décisions

Voir `docs/decisions/0001-socle-technique.md`.

### Dettes et points ouverts

- **Fichiers du cahier des charges à ajouter** : `CLAUDE.md`, `docs/01` à `docs/11`, `textes/01` et
  suivants, `ressources/jumanly-tokens.css`. À leur arrivée :
  - remplacer `ressources/jumanly-tokens.css` (provisoire) et ajuster le bloc `@theme` si les noms diffèrent ;
  - comparer la liste des composants avec le doc 11 § 11.5 et compléter ;
  - fusionner ou supprimer `textes/00-socle.md` si les textes officiels couvrent les mêmes clés
    (le script refusera tout doublon).
- Icônes : `lucide-react` (trait 2 px, extrémités rondes, comme la charte) en attendant les icônes
  de la marque prévues dans `ressources/`.
- Fuseau horaire d'affichage : `NEXT_PUBLIC_FUSEAU_HORAIRE`, `UTC` par défaut. À fixer.
- `/dev/composants` reste accessible en production (non indexée) : à protéger ou retirer en E11.
- Better Auth, Resend, S3, Inngest et l'API Claude ne sont pas encore installés : chacun arrive
  avec l'étape qui l'utilise (variables déjà prévues dans `.env.example`).
