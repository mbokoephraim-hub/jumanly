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

## E-mails (codes de connexion, liens, reçus)

Sans `RESEND_API_KEY` ni `SMTP_HOST`, aucun e-mail ne part : codes et liens s'affichent seulement dans
les journaux Vercel (« e-mail factice »), avec le lien « Confirmer mon adresse » de l'inscription.
Deux façons de les envoyer vraiment.

### Solution simple : la boîte Gmail infojumanly@gmail.com (SMTP)

Rien à changer chez Hostinger. Limite d'environ 500 e-mails par jour ; l'expéditeur affiché est
infojumanly@gmail.com.

1. Se connecter au compte Google infojumanly@gmail.com → [myaccount.google.com/security](https://myaccount.google.com/security)
   → activer la **validation en deux étapes** (obligatoire pour l'étape suivante).
2. [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) → nom « Jumanly »
   → **Créer**. Google affiche un mot de passe de 16 lettres : le copier (sans les espaces).
3. Vercel → Paramètres → Variables d'environnement (Production) : `SMTP_HOST` = `smtp.gmail.com`,
   `SMTP_PORT` = `465`, `SMTP_USER` = `infojumanly@gmail.com`, `SMTP_PASSWORD` = le mot de passe
   de 16 lettres. Supprimer `EMAIL_FROM` s'il existe. Puis Deployments → **Redeploy**.
4. Tester une inscription ou une connexion par code.

### Solution pour plus tard : Resend (envoi depuis assistant@jumanly.io)

Prioritaire sur SMTP si `RESEND_API_KEY` est renseignée.

1. Créer un compte sur [resend.com](https://resend.com) → Domains → **Add Domain** → `jumanly.io`,
   région **eu-west-1 (Irlande)**.
2. Resend affiche 3 ou 4 enregistrements DNS (un `TXT` `resend._domainkey`, un `MX` et un `TXT`
   sur `send`, parfois un `TXT` `_dmarc`). Les recopier un par un chez Hostinger → Domaines →
   `jumanly.io` → **DNS / Serveurs de noms** (nom, type, valeur, priorité 10 pour le `MX`).
   Ces enregistrements portent sur le sous-domaine `send` : ils ne touchent ni au site ni à une
   future boîte de réception.
3. Revenir dans Resend → **Verify DNS Records** jusqu'à « Verified » (quelques minutes à quelques
   heures).
4. Resend → API Keys → **Create API Key** (permission « Sending access », domaine `jumanly.io`).
   Copier la clé (`re_…`), elle ne s'affiche qu'une fois.
5. Vercel → Paramètres → Variables d'environnement : `RESEND_API_KEY` = la clé, et
   `EMAIL_FROM` = `Jumanly <assistant@jumanly.io>` (environnement Production). Puis
   Deployments → dernier déploiement → **Redeploy**.
6. Tester : se connecter avec un code sur jumanly.io ; l'e-mail arrive (regarder aussi les
   indésirables la première fois). En cas d'échec, Vercel → Logs affiche la raison donnée par
   Resend (« Resend a répondu 403 … »).

L'offre gratuite de Resend couvre 3 000 e-mails par mois (100 par jour).

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
