# JUMANLY · Maquettes page par page pour Claude Code

Version 1.0 · octobre 2026 · 91 pages. Une plateforme développée par The Growth Lab.

Ce dossier donne à Claude Code ce qui lui manquait : **l'identité visuelle exacte de chaque écran**. Les textes, les règles métier et les routes restent dans le cahier des charges (`textes/textes-application.md`, `docs/specifications.md`). Les maquettes, elles, font foi pour **la mise en forme** : couleurs, dégradés, icônes, rayons, cartes, gabarits, hiérarchie.

## Contenu

- `00-design-system/` : 5 planches à lire en premier (fondations, composants, cartes et IA, navigation, icônes et illustrations).
- `01-…` à `08-…` : un PDF par route. Chaque PDF contient 3 pages :
  1. **la fiche** : route, objectif, section des textes à utiliser, composants, états à prévoir, règles de comportement, icônes utilisées ;
  2. **la maquette desktop** (1440 px de large, pleine hauteur, texte sélectionnable) ;
  3. **la maquette mobile** (390 px de large).
- `*/apercus/` : les mêmes vues en PNG (desktop, mobile, fiche).
- `*/html/` : **le code HTML/CSS autonome de chaque maquette** (police Sora en ligne, images intégrées). C'est la référence la plus précise : Claude Code peut l'ouvrir pour lire les valeurs exactes (tailles, espacements, couleurs).
- `ressources/jumanly-ui.css` : toute la feuille de style des maquettes (jetons + composants + gabarits), à traduire en Tailwind.
- `ressources/icones-complementaires/` : 23 icônes d'interface (chevrons, cadenas, œil, envoyer…) dessinées dans la grammaire de la marque, en complément des 41 icônes de `ressources/icones/`.
- `index-pages.json` : la liste machine des pages (id, route, fichiers, composants, icônes, notes).

## Comment l'utiliser avec Claude Code

1. Copier ce dossier dans le dépôt, par exemple `docs/maquettes/` (le zip `jumanly-maquettes-pages.zip` contient tout).
2. Ajouter dans `CLAUDE.md`, section « Documents de référence » :

   > `docs/maquettes/` : maquettes de référence page par page (PDF + HTML). Avant de coder ou de retoucher un écran, ouvrir le PDF et le HTML de sa route et reproduire fidèlement la mise en forme. Commencer par `docs/maquettes/00-design-system/`. Les maquettes font foi pour le visuel ; les textes viennent de `textes/` et les forfaits de la partie 05.

3. Prompt de mise en conformité à donner à Claude Code :

   > Lis `docs/maquettes/LISEZMOI.md` puis les 5 planches de `docs/maquettes/00-design-system/`. Mets d'abord à jour `src/styles/tokens.css`, la config Tailwind et les composants de `src/components/ui` pour qu'ils correspondent exactement à `docs/maquettes/ressources/jumanly-ui.css` (couleurs, dégradés, rayons, boutons en pilule, champs, badges, cartes, carte IA avec orbe et « Pourquoi ? »). Remplace toute bibliothèque d'icônes par les icônes de `ressources/icones/` et `docs/maquettes/ressources/icones-complementaires/`. Refais ensuite les gabarits (site public, espace connecté desktop et mobile, admin) d'après `00-04-navigation-gabarits`. Puis reprends les écrans un par un, dans l'ordre de l'index, en comparant chaque page à son PDF et à son HTML (`docs/maquettes/<partie>/html/<id>-desktop.html` et `-mobile.html`). Fais une capture Playwright de ta page à 1440 et à 390 px et compare-la à l'aperçu PNG avant de passer à la suivante. Ne change aucun texte : ils viennent de `messages/fr.json`.

## Règles visuelles à ne jamais oublier

- Police unique **Sora**. Fond Crème `#F2EDE5`, cartes blanches rayon 24–28, boutons et badges **en pilule**.
- **Lime `#A6F26B` = action principale**, toujours avec du texte Sapin `#0F3F37`, jamais blanc.
- Espace connecté : barre latérale **Sapin** 92 px, élément actif **Lime**, panneau principal **Crème arrondi 32 px**. Mobile : en-tête Sapin, feuille Crème, **navigation flottante en pilule**.
- IA : **dégradé IA** + **orbe** + lien **« Pourquoi ? »** (icône œil) + boutons **Appliquer / Ignorer**. Le score de compatibilité utilise le dégradé IA, jamais le Corail.
- Teintes de modules : Learn Lime, Career Néon, Jobs Menthe claire, Hire Brume, Connect Blanc, Intelligence dégradé IA.
- Personnages illustrés de `ressources/illustrations/`, jamais de photos. Avatars à initiales.
- Aucun numéro de téléphone, nulle part.

## À savoir

- Les **données affichées sont fictives** (Grâce Mbuyi, Baobab Fintech, Fondation Horizon…) : seule la mise en forme fait foi.
- Les anciennes maquettes (`maquettes-ui/jumanly-maquettes-ui.pdf`, écran 09 surtout) ne font pas foi pour le contenu des forfaits ; ces nouvelles pages suivent la partie 05 des spécifications.
- Quelques libellés de décor (surtitres, annotations « État vide », « Après l'envoi ») n'existent pas encore dans `textes-application.md` : ce sont des repères de maquette, ou des textes à ajouter.
- Régénérer : `cd maquettes-ui/source && python3 pages.py [module ou préfixe d'id]` (modules `p_ds`, `p_public`, `p_catalogue`, `p_auth`, `p_talent`, `p_talent2`, `p_hire`, `p_paiement`, `p_partenaire`, `p_admin`, `p_systeme`).

## Index des pages

### 00 · Design system

| Fichier | Route | Page |
|---|---|---|
| `00-design-system/00-01-fondations.pdf` | `tokens.css · tailwind.config` | Fondations |
| `00-design-system/00-02-composants.pdf` | `src/components/ui` | Composants |
| `00-design-system/00-03-cartes-modules-ia.pdf` | `src/components/cards · src/components/ai` | Cartes, modules et IA |
| `00-design-system/00-04-navigation-gabarits.pdf` | `src/app/(app)/layout · src/app/(public)/layout` | Navigation et gabarits |
| `00-design-system/00-05-icones-illustrations.pdf` | `ressources/icones · ressources/illustrations` | Icônes et illustrations |

### 01 · Site public

| Fichier | Route | Page |
|---|---|---|
| `01-site-public/01-01-accueil.pdf` | `/` | Accueil |
| `01-site-public/01-02-a-propos.pdf` | `/a-propos` | À propos |
| `01-site-public/01-03-talents.pdf` | `/talents` | Pour les talents |
| `01-site-public/01-04-recruteurs.pdf` | `/recruteurs` | Pour les recruteurs |
| `01-site-public/01-05-entreprises.pdf` | `/entreprises` | Pour les entreprises |
| `01-site-public/01-06-partenaires.pdf` | `/partenaires` | Jumanly Partners |
| `01-site-public/01-07-faq.pdf` | `/faq` | Questions fréquentes |
| `01-site-public/01-08-contact.pdf` | `/contact` | Contact |
| `01-site-public/01-09-comment-fonctionne-le-matching.pdf` | `/comment-fonctionne-le-matching` | Comment fonctionne le matching |
| `01-site-public/01-10-formations.pdf` | `/formations` | Catalogue public des formations |
| `01-site-public/01-11-formation-detail.pdf` | `/formations/[slug]` | Fiche formation publique |
| `01-site-public/01-12-offres.pdf` | `/offres` | Offres publiques |
| `01-site-public/01-13-offre-detail.pdf` | `/offres/[slug]` | Détail d'offre public |
| `01-site-public/01-14-entreprise-publique.pdf` | `/entreprises/[slug]` | Page entreprise publique |
| `01-site-public/01-15-attestation-verification.pdf` | `/attestations/[code]` | Vérification publique d'une attestation |
| `01-site-public/01-16-portfolio-public.pdf` | `/portfolio/[slug]` | Portfolio public |
| `01-site-public/01-17-page-legale.pdf` | `/confidentialite` | Gabarit des pages légales (Confidentialité) |

### 02 · Connexion et inscription

| Fichier | Route | Page |
|---|---|---|
| `02-connexion-inscription/02-01-connexion.pdf` | `/connexion` | Connexion |
| `02-connexion-inscription/02-02-mot-de-passe-oublie.pdf` | `/mot-de-passe-oublie` | Mot de passe oublié |
| `02-connexion-inscription/02-03-reinitialiser.pdf` | `/reinitialiser` | Réinitialiser le mot de passe |
| `02-connexion-inscription/02-04-inscription-profil.pdf` | `/inscription` | Inscription · étape 1 · Vous êtes… |
| `02-connexion-inscription/02-05-inscription-forfait.pdf` | `/inscription/forfait` | Inscription · étape 2 · Forfait |
| `02-connexion-inscription/02-06-inscription-compte.pdf` | `/inscription/compte` | Inscription · étape 3 · Compte |
| `02-connexion-inscription/02-07-inscription-verification.pdf` | `/inscription/verification` | Inscription · étape 4 · Vérification |
| `02-connexion-inscription/02-08-inscription-paiement.pdf` | `/inscription/paiement` | Inscription · étape 5 · Paiement |
| `02-connexion-inscription/02-09-bienvenue.pdf` | `/app/bienvenue` | Bienvenue · premiers pas |
| `02-connexion-inscription/02-10-activer-licence.pdf` | `/activer` | Activer une licence Partners |

### 03 · Espace talent

| Fichier | Route | Page |
|---|---|---|
| `03-espace-talent/03-01-tableau-de-bord.pdf` | `/app` | Tableau de bord talent |
| `03-espace-talent/03-02-profil.pdf` | `/app/profil` | Profil professionnel |
| `03-espace-talent/03-03-learn-catalogue.pdf` | `/app/learn` | Catalogue Learn |
| `03-espace-talent/03-04-learn-fiche.pdf` | `/app/learn/[slug]` | Fiche formation (avant de commencer) |
| `03-espace-talent/03-05-learn-lecteur.pdf` | `/app/learn/[slug]` | Lecteur de formation |
| `03-espace-talent/03-06-learn-quiz.pdf` | `/app/learn/[slug]` | Quiz et résultats |
| `03-espace-talent/03-07-attestations.pdf` | `/app/learn/attestations` | Attestations |
| `03-espace-talent/03-08-career.pdf` | `/app/career` | Accueil Career |
| `03-espace-talent/03-09-career-diagnostic.pdf` | `/app/career/diagnostic` | Diagnostic de carrière |
| `03-espace-talent/03-10-career-cv.pdf` | `/app/career/cv` | Éditeur de CV et coach IA |
| `03-espace-talent/03-11-career-documents.pdf` | `/app/career/documents` | Lettres, biographie et correction |
| `03-espace-talent/03-12-career-linkedin.pdf` | `/app/career/linkedin` | Préparation LinkedIn |
| `03-espace-talent/03-13-career-entretiens.pdf` | `/app/career/entretiens` | Simulations d'entretien |
| `03-espace-talent/03-14-career-plan.pdf` | `/app/career/plan` | Plan de progression |
| `03-espace-talent/03-15-career-portfolio.pdf` | `/app/career/portfolio` | Portfolio |
| `03-espace-talent/03-16-jobs-recherche.pdf` | `/app/jobs` | Jobs · Recherche d'offres |
| `03-espace-talent/03-17-jobs-offre.pdf` | `/app/jobs/[slug]` | Jobs · Détail de l'offre |
| `03-espace-talent/03-18-jobs-postuler.pdf` | `/app/jobs/[slug]` | Jobs · Postuler (1 ou 2 étapes) |
| `03-espace-talent/03-19-candidatures.pdf` | `/app/jobs/candidatures` | Jobs · Mes candidatures |
| `03-espace-talent/03-20-enregistrees.pdf` | `/app/jobs/enregistrees` | Jobs · Offres enregistrées |
| `03-espace-talent/03-21-messages.pdf` | `/app/messages` | Messagerie Connect |
| `03-espace-talent/03-22-notifications.pdf` | `/app/notifications` | Centre de notifications |
| `03-espace-talent/03-23-parametres.pdf` | `/app/parametres` | Paramètres |

### 04 · Espace recruteur et entreprise

| Fichier | Route | Page |
|---|---|---|
| `04-espace-recruteur-entreprise/04-01-hire-accueil.pdf` | `/app/hire` | Tableau de bord recrutement |
| `04-espace-recruteur-entreprise/04-02-offres.pdf` | `/app/hire/offres` | Mes offres |
| `04-espace-recruteur-entreprise/04-03-offre-nouvelle.pdf` | `/app/hire/offres/nouvelle` | Création guidée d'une offre |
| `04-espace-recruteur-entreprise/04-04-pipeline.pdf` | `/app/hire/offres/[id]` | Pipeline |
| `04-espace-recruteur-entreprise/04-05-fiche-candidature.pdf` | `/app/hire/candidats/[applicationId]` | Fiche candidature |
| `04-espace-recruteur-entreprise/04-06-talents.pdf` | `/app/hire/talents` | Recherche dans le vivier |
| `04-espace-recruteur-entreprise/04-07-viviers.pdf` | `/app/hire/viviers` | Viviers et listes |
| `04-espace-recruteur-entreprise/04-08-entretiens.pdf` | `/app/hire/entretiens` | Entretiens et agenda |
| `04-espace-recruteur-entreprise/04-09-rapports.pdf` | `/app/hire/rapports` | Statistiques et rapports |
| `04-espace-recruteur-entreprise/04-10-organisation.pdf` | `/app/organisation` | Organisation |

### 05 · Forfaits et paiement

| Fichier | Route | Page |
|---|---|---|
| `05-forfaits-paiement/05-01-tarifs.pdf` | `/tarifs` | Tarifs et forfaits |
| `05-forfaits-paiement/05-02-abonnement.pdf` | `/app/abonnement` | Mon abonnement |
| `05-forfaits-paiement/05-03-paiement-mobile-money.pdf` | `/app/abonnement/paiement (Mobile Money)` | Paiement Mobile Money |
| `05-forfaits-paiement/05-04-paiement-carte.pdf` | `/app/abonnement/paiement (carte)` | Paiement par carte bancaire |
| `05-forfaits-paiement/05-05-paiement-resultat.pdf` | `/app/abonnement/paiement/resultat` | Résultat du paiement |
| `05-forfaits-paiement/05-06-devis-company-premium.pdf` | `Fenêtre « Demander un devis » · /contact?sujet=devis` | Demande de devis Company Premium |

### 06 · Espace partenaire

| Fichier | Route | Page |
|---|---|---|
| `06-espace-partenaire/06-01-partenaire-accueil.pdf` | `/app/partenaire` | Tableau de bord partenaire |
| `06-espace-partenaire/06-02-licences.pdf` | `/app/partenaire/licences` | Lots, codes et invitations |
| `06-espace-partenaire/06-03-rapports.pdf` | `/app/partenaire/rapports` | Rapports d'impact agrégés |

### 07 · Jumanly Admin

| Fichier | Route | Page |
|---|---|---|
| `07-jumanly-admin/07-01-admin-indicateurs.pdf` | `/admin` | Indicateurs |
| `07-jumanly-admin/07-02-admin-utilisateurs.pdf` | `/admin/utilisateurs` | Utilisateurs |
| `07-jumanly-admin/07-03-admin-organisations.pdf` | `/admin/organisations` | Organisations et vérification |
| `07-jumanly-admin/07-04-admin-forfaits.pdf` | `/admin/forfaits` | Forfaits et droits |
| `07-jumanly-admin/07-05-admin-abonnements.pdf` | `/admin/abonnements` | Abonnements et paiements |
| `07-jumanly-admin/07-06-admin-formations.pdf` | `/admin/formations` | Formations (Learn) |
| `07-jumanly-admin/07-07-admin-offres.pdf` | `/admin/offres` | Modération des offres |
| `07-jumanly-admin/07-08-admin-partenaires.pdf` | `/admin/partenaires` | Partenaires et lots de licences |
| `07-jumanly-admin/07-09-admin-ia.pdf` | `/admin/ia` | IA et poids du matching |
| `07-jumanly-admin/07-10-admin-contenus.pdf` | `/admin/contenus` | Contenus éditables |
| `07-jumanly-admin/07-11-admin-signalements.pdf` | `/admin/signalements` | Signalements |

### 08 · Pages système et e-mails

| Fichier | Route | Page |
|---|---|---|
| `08-pages-systeme/08-01-404.pdf` | `not-found.tsx` | Page introuvable (404) |
| `08-pages-systeme/08-02-403.pdf` | `403 (espace connecté)` | Accès refusé (403) |
| `08-pages-systeme/08-03-500.pdf` | `error.tsx · global-error.tsx` | Erreur serveur (500) |
| `08-pages-systeme/08-04-maintenance.pdf` | `page de maintenance` | Maintenance |
| `08-pages-systeme/08-05-hors-ligne.pdf` | `état hors ligne (toutes pages)` | Hors ligne et connexion lente |
| `08-pages-systeme/08-06-emails.pdf` | `emails/ (React Email)` | Gabarit des e-mails |
