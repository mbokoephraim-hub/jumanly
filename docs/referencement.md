# Référencement de Jumanly (Google, Bing, assistants IA)

Ce guide explique ce que le site fait déjà pour être trouvé, et les quelques gestes que seul le
propriétaire du domaine peut faire. Durée : environ 20 minutes, une seule fois.

## Ce que le site fait tout seul

- **Pages publiques indexables** : accueil, Talents, Recruteurs, Entreprises, Partenaires,
  formations, offres d'emploi, pages entreprises, tarifs, FAQ, matching expliqué, contact, pages
  légales. Chacune a un titre, une description, une adresse de référence (canonique) et une image de
  partage (Open Graph).
- **Plan du site** : `https://jumanly.io/sitemap.xml`, mis à jour automatiquement avec chaque
  formation publiée, chaque offre ouverte et chaque page entreprise.
- **`robots.txt`** : `https://jumanly.io/robots.txt` ouvre les pages publiques à tous les moteurs
  (Google, Bing, Apple, DuckDuckGo…) et aux assistants IA (ChatGPT, Claude, Perplexity, Gemini,
  Mistral…), et ferme l'espace connecté.
- **`llms.txt`** : `https://jumanly.io/llms.txt`, un résumé du site en texte simple pour les
  assistants IA : ce qu'est Jumanly, les règles clés (candidature gratuite, IA explicable, Mobile
  Money), les pages principales, les formations et les offres ouvertes.
- **Données structurées** (schema.org) : `Organization` et `WebSite` sur l'accueil, `Course` sur
  chaque formation, `JobPosting` sur chaque offre (pour apparaître dans Google pour l'emploi),
  `FAQPage` sur la FAQ.

## Ce qui reste privé, volontairement

L'espace connecté (`/app`), l'administration, les profils et les portfolios ne sont jamais indexés.
Ce sont des données personnelles (règle d'or 5, partie 10) : un talent ne doit pas retrouver son
profil dans Google sans l'avoir décidé. Un portfolio publié reste partageable par son lien.

## Étape 0 · Vérifier que la production est bien ouverte aux moteurs

Ouvrir `https://jumanly.io/robots.txt`. On doit lire `Allow: /` et une ligne `Sitemap:`.
Si on lit seulement `Disallow: /`, la variable `APP_ENV` de Vercel n'est pas `production` :
Vercel → projet jumanly → Settings → Environment Variables → `APP_ENV` = `production`
(environnement Production), puis Deployments → dernier déploiement → Redeploy.

## Étape 1 · Google Search Console (Google, Google pour l'emploi, Gemini)

1. Aller sur <https://search.google.com/search-console> avec un compte Google.
2. « Ajouter une propriété » → choisir **Domaine** → saisir `jumanly.io` → Continuer.
3. Google affiche un code qui commence par `google-site-verification=`. Le copier.
4. Dans Hostinger (hPanel) : Domaines → `jumanly.io` → **DNS / Serveurs de noms** → ajouter un
   enregistrement : Type **TXT**, Nom **@**, Valeur **le code copié**, TTL par défaut → Ajouter.
   Ne pas toucher aux enregistrements A et CNAME existants (ils font marcher le site).
5. Revenir dans Search Console → **Valider**. Si Google répond « non trouvé », réessayer une heure
   plus tard (le DNS peut mettre jusqu'à 48 heures).
6. Menu **Sitemaps** → saisir `sitemap.xml` → Envoyer.
7. Menu **Inspection de l'URL** → coller `https://jumanly.io` → **Demander une indexation**.
   Faire de même pour `/formations`, `/offres` et `/tarifs`.

## Étape 2 · Bing Webmaster Tools (Bing, Copilot, DuckDuckGo, Yahoo, Ecosia, ChatGPT)

Bing alimente aussi DuckDuckGo, Yahoo, Ecosia, Copilot et une partie des recherches de ChatGPT.

1. Aller sur <https://www.bing.com/webmasters> et se connecter (compte Google accepté).
2. Choisir **Importer depuis Google Search Console** → autoriser. Le site et son plan sont repris
   automatiquement, sans nouveau code DNS.

## Étape 3 · Assistants IA (ChatGPT, Claude, Perplexity…)

Rien à faire de plus : ils lisent `robots.txt` et `llms.txt`, et s'appuient sur les index de Bing
et de Google. Il faut en général **quelques semaines** pour qu'un nouveau site apparaisse dans
leurs réponses.

## Ce qui aide le plus ensuite

- **Du vrai contenu** : formations publiées et offres réelles. Chaque formation et chaque offre est
  une page de plus dans Google.
- **Des liens vers jumanly.io** depuis vos pages LinkedIn, Facebook, le site de The Growth Lab et
  ceux de vos partenaires. Donnez-nous ces adresses : on les ajoutera aux données structurées
  (`sameAs`) pour que Google relie ces pages à Jumanly.
- **Suivre Search Console une fois par mois** : pages indexées, requêtes qui amènent des visiteurs,
  erreurs signalées.
