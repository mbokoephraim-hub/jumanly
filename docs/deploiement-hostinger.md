# Déploiement sur Hostinger (offre Unlimited Web Hosting)

L'offre « Unlimited Web Hosting » accepte les applications Node.js (Next.js) importées depuis
GitHub. Hostinger installe avec **npm** (pas pnpm) : le projet doit donc s'installer et se construire
avec npm, ce que vérifie ce guide.

## 1. Base de données (Neon)

Hostinger ne fournit pas PostgreSQL. Créer un projet sur Neon (offre gratuite), région **AWS Europe
Central 1 (Frankfurt)**, service « Base de données Postgres » seul. Copier l'adresse de connexion
(`postgresql://…?sslmode=require`). L'extension pgvector est activée par la première migration.

## 2. Réglages de l'application sur Hostinger

| Réglage | Valeur |
|---|---|
| Dépôt / branche | `mbokoephraim-hub/jumanly` · `main` |
| Framework | Next.js |
| Version de Node | 22.x |
| Commande de build | `npm run build:hostinger` |
| Dossier de sortie | `.next` |
| Commande de démarrage | `npm start` |

`build:hostinger` applique les migrations, charge les forfaits et le référentiel (`prisma db seed` ;
la démo est ignorée hors local et preview, et les forfaits déjà modifiés dans l'admin ne sont pas
écrasés), puis construit le site. Le build lit la base : les variables doivent être saisies
**avant** le premier déploiement.

## 3. Variables d'environnement minimales

| Variable | Valeur |
|---|---|
| `APP_ENV` | `production` |
| `NEXT_PUBLIC_SITE_URL` | `https://jumanly.io` |
| `BETTER_AUTH_URL` | `https://jumanly.io` |
| `BETTER_AUTH_SECRET` | 32 caractères aléatoires ou plus |
| `DATABASE_URL` | adresse Neon |
| `JOBS_SECRET` | 32 caractères aléatoires ou plus |
| `AI_MODEL_DEFAULT`, `AI_MODEL_FAST` | comme dans `.env.example` |
| `EMAIL_FROM`, `CONTACT_EMAIL_PRO`, `CONTACT_EMAIL_GENERAL` | comme dans `.env.example` |

Les autres services (Resend, S3, Bunny, API Claude, paiements) gardent leur adaptateur factice tant
que leur clé est vide. Sans `RESEND_API_KEY`, aucun e-mail ne part réellement (vérification de
compte comprise) : à brancher avant l'ouverture au public.

## 4. Après le premier déploiement

- Relier le domaine `jumanly.io` à l'application dans Hostinger.
- Créer son compte sur le site, puis lui donner le rôle administrateur : `pnpm admin:promote <e-mail>`
  lancé depuis un poste qui a `DATABASE_URL` de production.
- Tâches d'abonnement : un planificateur (cron) doit appeler `POST https://jumanly.io/api/jobs/billing`
  toutes les heures avec l’en-tête `Authorization: Bearer <JOBS_SECRET>`.
