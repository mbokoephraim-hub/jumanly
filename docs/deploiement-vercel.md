# Déploiement sur Vercel (production actuelle)

Depuis le 14 octobre 2026, la production tourne sur Vercel (projet `jumanly`, offre Pro). Hostinger
garde le domaine `jumanly.io` et sa zone DNS. Le guide Hostinger (`docs/deploiement-hostinger.md`)
reste valable si l'on y revient.

## Réglages (dans `vercel.json`)

- Commande de build : `pnpm run build:hostinger` (migrations, seed sans démo, puis `next build` ;
  le build lit la base).
- Région des fonctions : `fra1` (Francfort), à côté de la base Neon.
- Tâche d'abonnement : Vercel Cron appelle `GET /api/jobs/billing` toutes les heures, avec
  l'en-tête `Authorization: Bearer <CRON_SECRET>`.

## Variables d'environnement (Vercel → Paramètres → Variables d'environnement)

Celles de `docs/deploiement-hostinger.md` (§ 3), plus `CRON_SECRET` (32 caractères aléatoires ou
plus ; sans elle, la route refuse l'appel du cron).

## Domaine

- Vercel : `jumanly.io` sur Production, `www.jumanly.io` redirigé (308) vers `jumanly.io`.
- Hostinger (zone DNS de `jumanly.io`) : `A @ 216.198.79.1` et `CNAME www` vers la valeur donnée
  par Vercel. Aucun enregistrement MX pour l'instant : le domaine ne reçoit pas d'e-mails.
