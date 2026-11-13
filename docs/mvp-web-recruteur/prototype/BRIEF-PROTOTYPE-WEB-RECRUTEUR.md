# Prototype de référence · MVP web recruteur (Jumanly Hire)

Validé par Ephraïm le 12/11/2026, page par page. Déposé le 13/11/2026 pour lancer la mise en ligne.

**Ce prototype est la seule référence visuelle et d'interaction de l'application web recruteur du MVP.**
Il remplace, pour l'espace recruteur sur ordinateur et tablette, les planches de `docs/modele-b-recruteur/web/`
et de `docs/refonte-web/`. Le contenu des formules reste piloté par `docs/specifications.md` (partie 05) et
le calcul du score par la partie 08 : les chiffres du prototype sont des exemples, jamais des règles.

## Fichiers

| Fichier | Rôle |
|---|---|
| `jumanly-hire.html` | Prototype cliquable autonome (ouvrir dans un navigateur, sans serveur). Navigation par `#route`. |
| `rapport-offres-modele.pdf` | Modèle du rapport PDF « toutes les offres » (4 pages A4), route `#rapportoffres`. |
| `captures/` | Captures de référence : `NN-ordi-*` à 1440 × 900, `NN-tel-*` à 390 × 844, détails flottants 26 à 29. |

Avant de coder un écran : ouvrir sa route dans `jumanly-hire.html`, la capture correspondante, et reproduire
fidèlement mise en page, espacements, couleurs, états et interactions. Le code du prototype est une maquette
(données en dur, rendu en chaînes) : on reprend le rendu, pas l'architecture.

## Identité (à porter dans les jetons CSS de `ressources/`)

- Fond de page vert très clair `#EDF2E1` à grille fine ; cartes blanches, bordure `#E1E7D4`, rayon 20 à 24 px.
- Texte encre `#0E1B17`, Sapin `#0F3F37`, gris `#56665F`. Lime `#A6F26B`, toujours avec texte Sapin (jamais blanc).
- **Boutons plats** : aucun reflet, aucun volume, aucune ombre. Un seul bouton lime principal par zone.
- **Section particulière** (bandeau Orbi, synthèse) : dégradé radial Sapin `#2F6B4A → #1B5040 → #0F3F37`,
  texte blanc, accents lime, petit point lime qui pulse (rappel du point du J).
- Cartes d'accent : dégradés clairs par famille (lime, bleu, lavande, pêche, jaune), motif de points discret.
- Couleurs d'étape : Nouvelles `#4C8DF6`, Présélection `#8B6CF0`, Entretien `#F2994A`, Évaluation `#E9B824`/`#D9A514`,
  Offre `#3FAE3A`. Classes Orbi : Fort potentiel (≥ 75), À considérer (50 à 74), Limité (< 50).
- Icônes au trait, minimalistes. Typo : titres en display (Sora), texte en sans-serif.
- Cadre : barre du haut flottante (logo en pilule, modules au centre, option active noire, icônes rondes à droite),
  colonne de pilules d'icônes à gauche, 24 px entre les blocs. Barre de défilement de page personnalisée (fine, point lime).
- Listes longues dans un bloc : défilement interne avec fondu, rail fin et pastille « N de plus ».
- Détails flottants : panneau centré sur fond flouté (flou 8 px), fermeture au clic dehors et sur ×.
- Pas de carte sombre pleine (sauf la section Sapin ci-dessus), pas de personnage dans l'interface.

## Pages et lots du brief

| Route du prototype | Écran | Lot |
|---|---|---|
| `#accueil` | Accueil en un écran : candidatures par offre, indicateurs, graphique, « Choisir qui rencontrer », À faire, notifications ; sous la ligne de flottaison « Où en sont vos candidats » (entonnoir) et « Cette semaine » | M9 |
| `#offres` (+ onglet Statistiques) | Cartes d'offre à couverture dégradée, anneau d'objectif, étapes sur une ligne, « fort potentiel » + jours restants ; statistiques cachées dans un onglet, tuiles cliquables, détail flottant avec période, rapport | M3, M9 |
| `#rapportoffres` | Rapport de toutes les offres, 4 pages A4 imprimables (PDF) | M9 |
| `#offre` | Détail d'une offre, partage | M3 |
| `#candidats` (Pipeline, Liste, Comparer) | Bandeau de l'offre mise en avant, filtres par classe, colonnes longues qui montrent tous les candidats sans « voir plus », cartes à jauge 10 segments, test, étape suivante | M4 |
| `#candidat` | Fiche : bandeau, anneau de score, frise d'étapes, « Pourquoi ? » à facteurs, compétences avec niveau attendu, test, questions d'entretien, avis de l'équipe ; onglets Parcours, Test, Documents | M4, M5 |
| `#agenda` (Jour, Semaine, Mois) | Bandeau du jour + prochain entretien, semaine à rendez-vous colorés par étape, ligne de l'heure, créneaux libres cliquables pour proposer à un candidat, détail flottant, lien de réservation | M6 |
| `#vivier` | Bandeau Orbi Sapin (talents proches d'une offre), carte « Votre vivier » cliquable (anneau par domaine, favoris, relancés, à renouveler), recherche instantanée, onglets de critères combinables, cartes talents | M8 |
| `#messages` | Liste (Orbi résume les non-lus, en ligne, écrit…, étiquette d'étape), conversation à contexte épinglé, suggestions Orbi, panneau candidat | M7 |
| `#tests` | Tests de compétences | M5 |
| `#suivi` | Suivi automatique | M7 |
| `#rapports` | Synthèse Orbi, 4 indicateurs cliquables à détail flottant, courbe, sources, entonnoir, délai par étape + objectif, équipe, par offre | M9 |
| `#equipe`, `#formule` | Équipe et journal des consultations ; formule annuelle | M1, M9 |

## Règles qui restent non négociables

- Tous les textes passent par `textes/textes-application.md` puis `pnpm messages` (aucun texte en dur).
- Aucun nom de forfait dans le code : clés de droits.
- Orbi recommande, l'humain décide : aucun refus automatique, chaque score a son « Pourquoi ? ».
- Nom, âge, genre, photo, nationalité… exclus du score (la mention figure dans le vivier et la fiche).
- Chaque consultation de profil est journalisée ; filtres Hire par `organizationId`.
- Contact par e-mail uniquement (assistant@jumanly.io), aucun numéro de téléphone.
- Données de démo manifestement fictives (Baobab Fintech, Nadia Kalala), jamais en production.
- WCAG 2.2 AA, `prefers-reduced-motion` respecté (les pulsations et apparitions s'arrêtent).

## Mise en ligne

Chaque lot M0 à M9 applique ce design sur ses écrans (l'ancien design de ces écrans est effacé, jamais les données).
Le lot M9 se termine par la vérification de bout en bout et la préparation du déploiement de production
(`pnpm db:deploy`, variables d'environnement de la partie 02, sauvegarde `pnpm db:backup`).
**Le passage en production attend le feu vert explicite d'Ephraïm.**
