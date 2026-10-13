# Prompt de démarrage pour Claude Code

À coller **tel quel** dans Claude Code, une fois le contenu de ce dossier déposé à la racine d'un dépôt vide (voir `LISEZMOI.md`).

---

Tu es le développeur principal de **Jumanly**, une plateforme web africaine qui réunit formation (Learn), carrière (Career), offres d'emploi (Jobs), recrutement (Hire), échanges (Connect), avec une IA explicable (Intelligence) et une administration (Admin). Elle est portée par The Growth Lab. Slogan : « Learn. Grow. Connect. ».

**Ce dépôt contient déjà le cahier des charges complet :**

- `CLAUDE.md` : les règles permanentes du projet (lis-le en premier et respecte-le toujours) ;
- `docs/01` à `docs/12` : vision, stack, architecture, données, forfaits et droits, parcours, écrans, matching IA explicable, paiements Mobile Money, sécurité, design system, feuille de route ;
- `textes/` : tous les textes de l'interface, en français, sous forme de tableaux « Clé | Texte » ;
- `ressources/` : jetons de design (`jumanly-tokens.css`), logos SVG, favicon et icônes de la marque.

**Ce que je veux obtenir au final :**

1. Un **site public** accessible sans connexion, qui présente Jumanly et montre les formations, les offres d'emploi, les forfaits et les pages pour chaque public (talents, recruteurs, entreprises, partenaires). Le visiteur peut tout explorer, puis **créer un compte** ou **se connecter**.
2. Une **inscription en étapes** où l'on choisit son profil (talent, recruteur RH, entreprise), puis **son forfait** : Free présélectionné, forfaits payants visibles (prix en USD par mois), paiement par Mobile Money ou carte, avec la possibilité de commencer en Free et de payer plus tard.
3. Un **espace connecté** pour les talents (tableau de bord, profil, Learn, Career, Jobs, messagerie) et pour les recruteurs et entreprises (offres, pipeline ATS, matching explicable, messagerie, rapports), un **espace partenaire** (licences sponsorisées, rapports agrégés) et une **administration** où l'on modifie forfaits, droits et quotas sans redéployer.

**Contraintes essentielles** (détaillées dans CLAUDE.md) : candidater est toujours gratuit ; jamais de nom de forfait testé dans le code, uniquement des clés de droits ; l'IA recommande, l'humain décide, et chaque score a un « Pourquoi ? » ; confidentialité des talents ; contact uniquement par e-mail (assistant@jumanly.io, infojumanly@gmail.com), aucun téléphone ; mobile d'abord, pages légères pour les réseaux lents ; identité visuelle Jumanly (Vert Sapin #0F3F37, Lime #A6F26B, Crème #F2EDE5, police Sora, formes arrondies).

**Stack** : Next.js (App Router) + TypeScript strict, Tailwind CSS, PostgreSQL + Prisma + pgvector, Better Auth, next-intl, Resend, stockage S3, Inngest, API Claude pour l'IA (modèles en variables d'environnement), paiements derrière une interface avec adaptateurs (factice d'abord, Mobile Money et carte ensuite). Détails dans `docs/02-stack-technique.md`.

**Méthode** : on avance **étape par étape** selon `docs/12-feuille-de-route.md` (E0 à E11). Chaque étape a une définition de fini. Ne passe pas à l'étape suivante sans mon accord.

**Maintenant :**

1. Lis `CLAUDE.md`, puis parcours tous les fichiers de `docs/` et la liste des fichiers de `textes/`.
2. Fais-moi un résumé de ce que tu as compris en 15 lignes maximum, et liste les questions bloquantes éventuelles (s'il n'y en a pas, dis-le).
3. Propose ton plan détaillé pour l'**étape E0 · Socle technique**, puis réalise-la.
4. Termine par la vérification de la définition de fini de E0 et la mise à jour de `docs/journal.md`.

---

Pour chaque étape suivante, utilise le prompt fourni dans `docs/12-feuille-de-route.md` à la section de l'étape.
