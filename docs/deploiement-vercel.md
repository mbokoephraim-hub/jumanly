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

## Connexion par Google, Apple et LinkedIn

Chaque bouton de `/connexion` et `/inscription` n'apparaît que si les clés de son service sont
remplies dans Vercel (Production). Après l'ajout des clés : redéployer. L'adresse de retour à
déclarer chez chaque service est `https://jumanly.io/api/auth/callback/<service>` (`google`,
`apple` ou `linkedin`).

### Google

1. [console.cloud.google.com](https://console.cloud.google.com) → API et services → Identifiants →
   Créer un « ID client OAuth » de type « Application Web ».
2. Origine autorisée : `https://jumanly.io`. URI de redirection :
   `https://jumanly.io/api/auth/callback/google`.
3. Copier l'ID client et le code secret dans `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`.

### Apple (compte Apple Developer payant nécessaire)

1. [developer.apple.com](https://developer.apple.com/account) → Certificates, Identifiers & Profiles
   → Identifiers : créer un **App ID** avec la capacité « Sign In with Apple ».
2. Créer un **Services ID** (par exemple `io.jumanly.web`) et activer « Sign In with Apple » :
   domaine `jumanly.io`, adresse de retour `https://jumanly.io/api/auth/callback/apple`. Apple
   vérifie le domaine.
3. Keys → créer une **clé** « Sign In with Apple » liée à l'App ID ; télécharger le fichier `.p8`
   (une seule fois) et noter le Key ID et le Team ID.
4. Générer le **secret client** : un jeton JWT signé avec la clé `.p8` (Team ID, Key ID, Services
   ID), valable 6 mois au plus. La documentation de Better Auth (fournisseur Apple) donne un
   générateur. **À renouveler avant son expiration** (noter la date dans l'agenda).
5. Remplir `APPLE_CLIENT_ID` (le Services ID) et `APPLE_CLIENT_SECRET` (le jeton).
   `APPLE_APP_BUNDLE_IDENTIFIER` reste vide tant qu'il n'y a pas d'appli iOS.

Apple peut masquer l'adresse de la personne derrière son relais (`…@privaterelay.appleid.com`) :
le compte se crée normalement et les e-mails passent par ce relais, à condition de déclarer chez
Apple (Services → Sign In with Apple for Email Communication) le domaine d'envoi des e-mails.

### LinkedIn

1. [linkedin.com/developers](https://www.linkedin.com/developers/apps) → créer une appli rattachée à
   la page LinkedIn de Jumanly (ou de The Growth Lab).
2. Onglet Products : ajouter **« Sign In with LinkedIn using OpenID Connect »**.
3. Onglet Auth : ajouter l'URL de redirection `https://jumanly.io/api/auth/callback/linkedin`,
   puis copier le Client ID et le Client Secret dans `LINKEDIN_CLIENT_ID` et
   `LINKEDIN_CLIENT_SECRET`.

## Domaine

- Vercel : `jumanly.io` sur Production, `www.jumanly.io` redirigé (308) vers `jumanly.io`.
- Hostinger (zone DNS de `jumanly.io`) : `A @ 216.198.79.1` et `CNAME www` vers la valeur donnée
  par Vercel. Aucun enregistrement MX pour l'instant : le domaine ne reçoit pas d'e-mails.
