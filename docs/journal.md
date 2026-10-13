# Journal du projet

Une entrée par étape : ce qui a été fait, les décisions prises, les dettes à rembourser.

## E0 · Socle technique (13 octobre 2026)

### Contexte

Fournis : `CLAUDE.md`, `docs/12-feuille-de-route.md`, `ressources/jumanly-tokens.css`, les textes
officiels (`textes/textes-jumanly.md`, parties 01 à 10, environ 5 900 textes), la charte graphique,
le LISEZMOI des maquettes et les logos.
**Encore absents : `docs/01` à `docs/11`.**
La liste des composants (doc 11 § 11.5) et la stack détaillée (doc 02) ont donc été déduites de
CLAUDE.md, de la feuille de route et de la charte.

### Fait

- Next.js 16 (App Router, Turbopack), TypeScript strict, React 19.
- Tailwind CSS 4 branché sur les jetons officiels : `bg-sapin`, `text-lime`, `rounded-card`,
  `text-h1`, `bg-gradient-ai`, `bg-ai-orb`…
- Police Sora auto-hébergée (voir la décision du jour).
- ESLint (règles Next + **aucun texte en dur dans le JSX**), Prettier (les `.md` ne sont pas reformatés).
- Textes officiels branchés : gabarits, composants et e-mail utilisent les clés officielles
  (`nav.*`, `appNav.*`, `footer.*`, `common.*`, `a11y.*`, `billing.quotas.*`, `ai.*`, `mail.*`).
  `textes/00-socle.md` ne garde que la page `/dev/composants` et deux écrans provisoires.
- next-intl, langue `fr`, clés typées. Aucun texte n'est envoyé au navigateur par défaut : un
  composant client qui en a besoin reçoit seulement ses espaces de noms (`pickMessages`). `scripts/build-messages.ts` lit les tableaux `| Clé | Texte |` de
  `textes/*.md` et génère `messages/fr.json` ; il signale doublons, clés invalides, textes vides et
  conflits. Les segments numériques sont acceptés (`system.404.title`). `pnpm messages` régénère, `pnpm messages:check` vérifie (CI et `pnpm build`).
- Prisma 7 + PostgreSQL 16 avec pgvector (Docker Compose), migration `enable_pgvector`,
  `pnpm db:seed` prêt (vide jusqu'à E1).
- Bibliothèque de composants (`src/components/ui`) : Button, ButtonLink, TextField, TextArea, Select,
  Checkbox, RadioGroup, Switch, Badge, Card, Alert, Avatar, Tabs, ProgressBar, ProgressRing,
  QuotaGauge, Skeleton, Spinner, EmptyState, Modal, AiOrb, ExplainedScore (score + « Pourquoi ? »), Logo.
- Page `/dev/composants` : couleurs, dégradés, typographie et tous les composants avec leurs états.
- Gabarits : site public (en-tête, menu mobile sans JavaScript, pied de page avec les deux adresses
  e-mail) ; espace connecté (barre latérale desktop, barre basse mobile, lien « Aller au contenu »).
- E-mails : gabarit commun React Email (pied de page officiel avec les deux adresses) et e-mail de
  bienvenue talent ; `pnpm email:dev` (aperçu sur le port 3001).
- Tests : Vitest (script des textes, composants, e-mail), Playwright desktop + mobile (pages,
  modale au clavier, navigation adaptée à l'écran, aucun lien `tel:`, moins de 200 Ko de JS sur `/`).
- GitHub Actions : textes, format, lint, types, tests, migrations sur pgvector, build, e2e.
- `.env.example` avec les variables prévues (dont `AI_MODEL_DEFAULT`, `AI_MODEL_FAST`).

### Définition de fini

| Critère | État |
|---|---|
| `pnpm dev` démarre | ✓ |
| `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` passent en CI | ✓ en local ; CI à l'ouverture de la PR |
| `/dev/composants` montre tous les composants avec leurs états | ✓ (liste à confronter au doc 11 § 11.5) |
| Aucun texte en dur | ✓ garanti par ESLint |

### Dettes et points ouverts

- À l'arrivée de `docs/02`, `docs/03` et `docs/11` : vérifier la stack, l'arborescence et la liste des
  composants, et compléter.
- Budget JavaScript : 179 Ko compressés sur `/` pour 200 Ko autorisés, dont environ 165 Ko pour
  React et Next.js eux-mêmes. Peu de marge : chaque composant client ajouté aux pages publiques doit
  être pesé. Les composants client (`Modal`, `Switch`, `Tabs`) sont importés depuis leur propre
  fichier, pas depuis `@/components/ui`. `lucide-react` coûte environ 9 Ko : à remplacer par les
  icônes SVG de la marque si la marge manque.
- Textes : les emplacements entre crochets `[...]` ne doivent jamais s'afficher en production (règle
  de la partie 01) ; à contrôler à partir de E1.
- Icônes : `lucide-react` en attendant les icônes de la marque dans `ressources/`.
- `/dev/composants` reste accessible en production (non indexée) : à protéger ou retirer en E11.
- Better Auth, Resend, S3, Inngest et l'API Claude ne sont pas installés : chacun arrive avec l'étape
  qui l'utilise (variables déjà dans `.env.example`).
- Le dépôt n'avait pas de branche `main` : création soumise à l'accord du propriétaire.
- Accueil et tableau de bord sont provisoires (bloc principal seulement) : complets en E1 et E3.
