# Jumanly

Plateforme web qui réunit formation, carrière, emploi et recrutement pour les talents africains.
Portée par The Growth Lab · « Learn. Grow. Connect. »

## Démarrer en local

Prérequis : Node.js 22, pnpm 10, Docker.

```bash
pnpm install
cp .env.example .env
docker compose up -d      # base PostgreSQL + pgvector
pnpm db:migrate           # applique les migrations
pnpm dev                  # http://localhost:3000
```

Pages utiles : `/` (site public), `/app` (espace connecté), `/dev/composants` (composants, en local et en preview seulement : `APP_ENV`).

Avant chaque commit, Husky vérifie les fichiers modifiés (ESLint, Prettier, textes à jour).

## Commandes

| Commande                       | Rôle                                                   |
| ------------------------------ | ------------------------------------------------------ |
| `pnpm dev`                     | Lance le site en développement (régénère les textes)   |
| `pnpm build`                   | Version de production                                  |
| `pnpm lint` / `pnpm typecheck` | Qualité du code et types                               |
| `pnpm test`                    | Tests unitaires (Vitest)                               |
| `pnpm test:e2e`                | Tests de bout en bout (Playwright, après `pnpm build`) |
| `pnpm messages`                | Convertit les textes en `messages/fr.json`             |
| `pnpm brand`                   | Convertit `ressources/` en icônes et images du site    |
| `pnpm format`                  | Met en forme le code (Prettier)                        |

## Textes de l'interface

Aucun texte n'est écrit dans le code. Ajoutez une ligne `| clé | texte |` dans la bonne partie de
`textes/textes-application.md`, lancez `pnpm messages`, puis utilisez la clé avec `useTranslations`.

## Documentation

- `CLAUDE.md` : les règles permanentes du projet
- `docs/specifications.md` : le cahier des charges (partie 12 : les étapes E0 à E11)
- `ressources/` : les fichiers de la marque, tels que fournis (voir `ressources/LISEZMOI.md`)
- `docs/journal.md` : ce qui a été fait à chaque étape
- `docs/decisions/` : les choix techniques
