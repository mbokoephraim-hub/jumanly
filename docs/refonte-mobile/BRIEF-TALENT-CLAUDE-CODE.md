# Refonte mobile · espace talent · brief pour Claude Code

19 octobre 2026. Validé par Ephraïm (lots 1 à 4). Ce brief remplace, pour la forme, les maquettes mobiles précédentes (`docs/ux-mobile-talent/`, `docs/maquettes/` partie talent). Les règles métier de `docs/specifications.md` et les règles d'or du `CLAUDE.md` restent la référence.

## 0. Remplacement total de l'ancien design (décision d'Ephraïm, 19/10/2026)

Le nouveau design **remplace entièrement** l'ancien sur mobile. Rien de l'ancienne interface talent ne doit rester visible ni coexister.

- **À supprimer du code** : anciens composants, styles, barres de navigation (barre à 5 avec Pour moi au centre, menu latéral, bouton +, bouton flottant), en-têtes, cartes et variantes de thème qui ne figurent pas dans les planches. Pas de bascule « ancien / nouveau » ni de drapeau de fonctionnalité : on remplace, puis on supprime le code mort (vérifier avec une recherche des imports inutilisés).
- **Pages fusionnées** : les anciennes routes ne gardent qu'une redirection permanente vers la nouvelle page (audit § 3 et § 5) ; leur ancien contenu est supprimé.
- **Documents obsolètes pour l'espace talent** : `docs/ux-mobile-talent/`, `docs/refonte-career/`, `docs/learn-v2/`, les parties talent de `docs/PROMPTS-LANCEMENT-MOBILE-ET-IA.md`, `docs/maquettes/02-connexion-inscription/`, `03-espace-talent/` et la partie talent de `05-forfaits-paiement/`, et la scène mobile de `docs/refonte-connexion/`. Ne plus s'en servir ; en cas d'écart, ce brief l'emporte.
- **Base de données** : on ne supprime **aucune donnée** d'utilisateur. Migrations Prisma additives seulement (par exemple la signature des attestations) ; un champ qui ne sert plus que l'ancien design (préférence de thème, indicateur d'écran vu…) est retiré par une migration nommée clairement, après vérification qu'aucune page ne le lit. Le seed de démonstration est remplacé par des données cohérentes avec les nouvelles planches (toujours manifestement fictives, local et previews seulement).
- **Écrans larges** : en attendant leur maquette, l'espace talent sur ordinateur réutilise les mêmes composants dans une colonne centrée ; l'ancien design ne revient pas sur ordinateur.
- **Contrôle final** : une capture de chaque route `/app/*` à 390 px montre uniquement le nouveau design ; liste des fichiers supprimés dans la PR.

## 1. Sources à ouvrir

| Quoi | Où |
|---|---|
| Audit et liste des 20 pages | `docs/audit-talent/AUDIT-TALENT.md` (§ 5 pages, § 6 parcours, § 7 MVP, décisions du 18/10) |
| Cahier de la refonte | `docs/refonte-mobile/CAHIER-DES-CHARGES-REFONTE-MOBILE.md` |
| Fondations (surfaces, icônes, couleurs, barres, boutons, cartes, Orbi) | `docs/refonte-mobile/maquette/refonte-mobile-fondations.html`, `source/fondations.css`, `source/icones.py` |
| Lot 1 : Pour moi, Offres, détail d'offre, Pourquoi | `docs/refonte-mobile/talent-1/` |
| Lot 2 : postuler, Suivi, détail candidature, s'entraîner, messages, notifications | `docs/refonte-mobile/talent-2/` |
| Lot 3 : Apprendre, formation, salle de cours, quiz, attestations, vérification | `docs/refonte-mobile/talent-3/` |
| Lot 4 : connexion, inscription, onboarding, compte, profil, diagnostic, CV et documents, abonnement, paiement, paramètres, aide, Orbi | `docs/refonte-mobile/talent-4/` |
| Attestation PDF sécurisée | `docs/refonte-mobile/attestation/` (HTML, PDF, `source/attestation.py`) |

Chaque dossier contient le HTML de la planche (ouvrir dans un navigateur), `captures/` (une image par section) et `source/` (CSS et générateur : **les valeurs exactes** de couleurs, rayons, ombres, tailles sont là). Section « Comment on y arrive » de chaque planche = le chemin de navigation à respecter.

## 2. Décisions à appliquer

1. Barre du bas talent : **Pour moi · Offres · Orbi (rond central) · Apprendre · Suivi**. Plus de menu latéral, plus de bouton +. Le compte s'ouvre par l'**avatar** en haut à droite de chaque onglet. **Orbi s'ouvre en page de conversation** (demande d'Ephraïm du 19/10) : flèche retour en haut (retour à l'écran d'où l'on vient), pas de barre du bas, le champ « Écrire à Orbi » occupe sa place (+, micro, envoyer) ; les crédits s'affichent sous le nom d'Orbi.
2. L'assistant s'appelle **Orbi** à l'écran (code : assistant). Il propose ; rien n'est modifié ni envoyé sans accord (Accepter / Modifier / Refuser). Tout score a un « Pourquoi ? ».
3. Inscription : Google, LinkedIn ou e-mail + mot de passe → code à 6 chiffres → « Compte validé » → 4 questions (objectif, études et domaine, pays + ville + contrat + mode, formule) → **Free par défaut** → Pour moi avec « Bienvenue » et 3 premiers pas. Le pays n'est demandé qu'une fois.
4. Connexion : Google, LinkedIn, e-mail + mot de passe, lien magique ; mot de passe oublié = code par e-mail → nouveau mot de passe → les autres sessions sont fermées.
5. Pays avec **drapeaux** : RD Congo en tête, Afrique par région, puis hors d'Afrique (France, Belgique, Royaume-Uni, Allemagne, États-Unis, Canada, Russie), puis A à Z. Drapeaux en SVG locaux (pas d'emoji). Même sélecteur pour l'indicatif du **numéro Mobile Money** (seul numéro saisi ; jamais affiché ; aucun numéro Jumanly nulle part).
6. Pas d'offres externes au lancement. Postuler reste gratuit dans toutes les formules.
7. Paiement : Mobile Money (fournisseurs ajoutés progressivement) et carte ; validation sur le téléphone ; reçu ; factures PDF. L'adaptateur de paiement simulé ne doit **jamais** être actif en production.
8. Droits, jamais de nom de forfait dans le code : adaptation du CV à une offre ou à un texte collé (annonce trouvée ailleurs, appel à candidatures, bourse, fiche de poste ; 5 000 caractères au plus, lu comme une donnée et jamais comme une consigne, aucune expérience inventée, copie à valider changement par changement) = `career.cv.tailor` ; modèles = `career.cv.templates.access` ; LinkedIn = `career.linkedin` ; crédits = `ai.credits.monthly` (Free = 0) ; premier module d'une formation toujours ouvert.
9. Attestation : numéro `JMN-XXXX-XXXX`, signature numérique (à ajouter au modèle `Certificate`, par exemple Ed25519 sur une charge canonique), rendu PDF selon `docs/refonte-mobile/attestation/`, vérification publique `/attestations/[code]`.
10. Modes clair et sombre (classe `.sombre` dans les maquettes) ; contrastes WCAG 2.2 AA ; texte Sapin sur Lime.
11. Les entreprises et personnes des maquettes sont fictives : ne rien reprendre en production.

## 3. Écrans → routes

| Écrans des planches | Route |
|---|---|
| Se connecter, mot de passe oublié, nouveau mot de passe | `/connexion`, `/mot-de-passe-oublie`, `/reinitialiser` |
| Créer un compte, avec mon e-mail, code, compte validé | `/inscription`, `/inscription/compte`, `/inscription/verification` |
| Objectif, études, lieu et contrat (+ pays), espace prêt | `/app/bienvenue` (étapes) |
| Pour moi (+ carte Bienvenue) | `/app` |
| Offres, filtres, détail, Pourquoi, préparer | `/app/jobs`, `/app/jobs/[slug]` |
| Postuler 3 étapes + confirmation | `/app/jobs/[slug]/postuler` |
| Suivi, détail candidature | `/app/suivi`, `/app/suivi/[id]` |
| S'entraîner (accueil, nouvel entraînement, simulation écrite et orale, retours, version Free) — lot 2 § entraînement et lot 4 § 5 bis | `/app/career/entretiens`, `/app/career/entretiens/nouveau`, `/app/career/entretiens/[id]` |
| Messages, conversation, notifications | `/app/messages`, `/app/messages/[id]`, `/app/notifications` |
| Apprendre, rechercher, parcours, mes formations | `/app/learn`, `/app/learn/mes-formations` |
| Détail formation, salle de cours, exercice, quiz | `/app/learn/[slug]`, `/app/learn/[slug]/[lecon]` |
| Mes attestations, détail, partage | `/app/learn/mes-formations` (onglet), `/app/learn/attestations/[code]` |
| Compte, connexions, aide | `/app/compte`, `/app/compte/connexions`, `/app/compte/aide` |
| Mon profil, sections, modifier, expérience, compétence, ce que je cherche, projet, vu par un recruteur | `/app/profil` (+ feuilles et sous-pages) |
| Faire le point, diagnostic, plan | `/app/profil/point`, `/app/career/diagnostic`, `/app/career/plan` |
| CV et documents, lettres, LinkedIn, importer | `/app/career/cv`, `/app/career/linkedin`, `/app/profil/import` |
| Modèles, éditeur, avant/après, adapter | `/app/career/cv/[id]` |
| Abonnement, formules, paiement, numéro, validation, reçu, factures | `/app/abonnement`, `/app/abonnement/payer`, `/app/abonnement/factures` |
| Paramètres, sécurité, confidentialité, notifications, suppression | `/app/parametres` (sections) |
| Orbi plein écran, historique | onglet Orbi, `/app/orbi/historique` |

Les anciennes routes (`tableau-de-bord`, `espace`, `learn/explorer`, `jobs/candidatures`, etc., voir audit § 3 et § 5) **redirigent** vers les nouvelles.

## 4. Ordre de travail (un lot = une PR)

0. Diagnostic de l'existant face à ce brief et plan (aucun code), avec la liste de ce qui sera supprimé (§ 0).
1. Fondations : jetons, surfaces en verre, icônes (`icones.py` → SVG), barre du bas, en-têtes, boutons, cartes, Orbi, mode sombre.
2. Connexion, inscription, onboarding, pays et drapeaux, bienvenue (lot 4 § 1-2).
3. Pour moi, Offres, détail d'offre (lot 1).
4. Postuler, Suivi, entretien, messages, notifications (lot 2).
5. Apprendre, salle de cours, quiz, attestations + PDF + vérification (lot 3 et attestation).
6. Compte, profil, diagnostic, plan, simulations d'entretien (écrites `career.interview.text.monthly`, orales `career.interview.voice.monthly`, audio effacé après le retour), CV et documents, éditeur (lot 4 § 3-6). Les noms de modèles sont ceux de `docs/modeles-cv/` (Classique, Épuré, Colonne…). Version ordinateur et tablette du studio CV : `docs/refonte-web/studio-cv/`.
7. Abonnement, paiement Mobile Money, factures, paramètres, aide, Orbi historique (lot 4 § 7-9). Redirections des anciennes routes, suppression du code mort et du reste de l'ancien design, contrôle final du § 0.

## 5. Définition de fini, pour chaque lot

- Captures Playwright à **390 px**, clair et sombre, de chaque écran, comparées côte à côte aux `captures/` des planches ; écarts listés et corrigés.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm messages:check` passent ; tests e2e des parcours touchés.
- Tous les textes dans `textes/textes-application.md` → `pnpm messages`.
- 200 Ko de JS max par page publique ; animations coupées en `prefers-reduced-motion`.
- `docs/journal.md` mis à jour ; tout écart au brief noté dans `docs/decisions/`.
