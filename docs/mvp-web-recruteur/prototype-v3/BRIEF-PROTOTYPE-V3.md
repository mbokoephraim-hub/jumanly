# Jumanly Hire v3 · brief de reproduction (application web recruteur)

Validé par Ephraïm le 13/11/2026 (« Parfait »). **Seule référence visuelle des écrans recruteur web du MVP.** Remplace `docs/mvp-web-recruteur/prototype/` (v1 et v2) et tout le design recruteur ordinateur existant dans l'application.

Règle n° 1 : **on ne change rien.** Couleurs, tailles, rayons, bordures, espacements, ordre des blocs, libellés, icônes, animations et mode sombre sont repris à l'identique. Si un écran de l'appli diffère de la capture, c'est l'appli qui a tort.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `jumanly-hire.html` | Le prototype complet, autonome. L'ouvrir dans un navigateur : chaque bouton fonctionne. |
| `code/hire-v3.css` | La feuille de style complète (clair + sombre sous `html[data-theme=dark]`). **À reprendre telle quelle.** |
| `code/hire-v3.js` | Toute la logique : données de démonstration, vues `V.<nom>`, fenêtres, téléchargements. Sert de référence pour le balisage exact de chaque écran (les gabarits sont dans les fonctions `r(tab)`). |
| `code/hire-v3-squelette.html` | Le squelette de page (barre du haut, rail, zone de contenu, calque des fenêtres). |
| `captures/clair/` et `captures/sombre/` | Une capture par écran et par onglet (1440 × 900), numérotées dans l'ordre du tableau ci-dessous. |
| `captures/fenetres/` | Fenêtres et parcours : nouvelle offre (8 étapes), menu profil, recherche, inviter un membre (4 écrans), attribuer une tâche, télécharger, modèles de documents, réglages. |
| `rapport-offres-modele.pdf` | Modèle du rapport des offres en PDF. |

## Comment reprendre le code sans rien changer

1. Copier `code/hire-v3.css` dans `src/styles/hire-v3.css` et le charger **uniquement** dans le layout recruteur web. Préfixer une seule fois tous les sélecteurs par `.hv3` (script ou `postcss-prefix-selector`), `:root` et `body` devenant `.hv3`, `html[data-theme=dark]` devenant `html[data-theme=dark] .hv3`. Aucune valeur ne change.
2. Garder **les mêmes noms de classes** que le prototype dans les composants React (`.top`, `.rail`, `.ph`, `.oc3`, `.rhero`, `.xpdoc`…). Le balisage de chaque écran se lit dans `hire-v3.js` (`V.offres.r`, `V.candidat.r`…) et se traduit en TSX ligne à ligne.
3. Icônes : reprendre les tracés SVG de la fonction `I()` et de l'objet des icônes dans `hire-v3.js` dans un composant `HireIcon`.
4. Mode sombre : bouton dans le menu profil, valeur `data-theme` sur `<html>`, mémorisée par utilisateur (préférence `appearance`).
5. Polices : Sora (titres) et Inter (texte), déjà dans l'appli.

## Écrans et routes

| N° | Vue du prototype | Onglets | Route de l'appli |
|---|---|---|---|
| 01-03 | `accueil` | Aujourd'hui · Semaine · Mois | `/app/hire` |
| 04 | `rapportoffres` | | `/app/hire/offres/rapport` (nouvelle) |
| 05-09 | `offres` | Toutes · En ligne · En pause · Brouillons · Statistiques | `/app/hire/offres` |
| 10-12 | `offre` | Aperçu · Annonce · Partage | `/app/hire/offres/[id]` |
| 13-15 | `candidats` | Pipeline · Liste · Comparer | `/app/hire/candidats` (les vues `offres/[id]/tableau` et `comparer` y renvoient) |
| 16-19 | `candidat` | Résumé · Parcours · Test · Documents | `/app/hire/candidats/[applicationId]` |
| 20-22 | `agenda` | Jour · Semaine · Mois | `/app/hire/entretiens` |
| 23-25 | `vivier` | Tous · Favoris · Relancés | `/app/hire/viviers` |
| 26-28 | `messages` | Tous · Candidats · Équipe | `/app/messages` (mode recruteur) |
| 29-31 | `tests` | Mes tests · Résultats · Bibliothèque | `/app/hire/tests` (nouvelle) |
| 32-33 | `suivi` | Règles · Historique | `/app/hire/suivi` (nouvelle) |
| 34-36 | `rapports` | 7 jours · 30 jours · Trimestre | `/app/hire/rapports` |
| 37-39 | `aide` | Centre d'aide · Guides · Nous écrire | `/app/hire/compte/aide` |
| 40 | `nouvelle` | 7 étapes + page publiée | `/app/hire/offres/nouvelle` |
| 41-42 | `profil` | Mon profil · Réglages | `/app/hire/compte/profil` et `/app/hire/compte` |
| 43-45 | `membre` | Activité · Tâches · Droits | `/app/hire/equipe/[memberId]` (nouvelle) |
| 46 | `modeles` | Talents · Candidats · Comparaison · Résultats de test · Équipe · Journal | `/app/hire/rapports/modeles` (nouvelle ; `/app/hire/modeles` reste celui des messages) |
| 47-49 | `entreprise` | Aperçu · Modifier · Membres | `/app/hire/entreprise` |
| 50-51 | `equipe` | Membres · Journal des consultations | `/app/hire/compte/equipe` |
| 52-53 | `formule` | Formule · Factures | `/app/hire/compte/formule` |

Si le numéro d'une capture ne tombe pas juste, le nom du fichier (`NN-vue-onglet.png`) fait foi.

## Cadre commun (tous les écrans)

- **Barre du haut flottante** : logo (tuile lime au rayon de 9 px, J Sapin, « jumanly » en Sora), menu en pilule (Accueil, Offres, Candidats, Agenda, Vivier, Messages, Rapports ; l'élément actif est noir, avec des pastilles de nombre), puis recherche, cloche, aide et profil (nom + entreprise).
- **Rail de gauche** en petites pilules d'icônes, avec une bulle au survol : Nouvelle offre (lime), Orbi, puis Page entreprise, Tests, Suivi automatique, Équipe et Formule. Plus de thème, d'aide ni de déconnexion dans le rail.
- **Menu profil** : carte d'identité, Mon profil, Réglages, interrupteur Mode sombre, Centre d'aide, Se déconnecter.
- **Recherche (Ctrl K)** : filtres Tout, Candidats, Offres et Pages, actions rapides, candidats avec leur %, « Demander à Orbi » et pied de clavier.
- **En-tête de page** `.ph` : titre et sous-titre à gauche, onglets en pilule à droite, bouton Télécharger quand la vue s'exporte, bouton de retour quand la vue a un parent.
- **Blocs** : cadres gris `#EEF0ED`, cartes blanches à fine bordure Sapin `#1E3D35`, une couleur par niveau, étape ou métier (`--s1` à `--s5`), dégradé radial Sapin réservé aux sections spéciales (Orbi, synthèses). Les blocs voisins ont la même hauteur.

## Fenêtres et parcours à reproduire

- **Nouvelle offre** : fenêtre de départ (Orbi, dupliquer, modèle, import), puis 7 étapes avec stepper, aperçu candidat en direct, curseurs de poids et pied flottant, puis la page publiée.
- **Inviter un membre** en 3 étapes et un écran de succès :
  - la personne et les sièges ;
  - le rôle (Administrateur, Recruteur, Évaluateur, Lecteur), la matrice des droits et les offres ;
  - le message, avec un lien valable 7 jours et l'aperçu de l'e-mail.

  Une fois l'invitation envoyée, la ligne « en attente » apparaît sur Équipe.
- **Attribuer une tâche** : choix du membre, type de tâche et durée, candidats, échéance. La barre de charge se met à jour en direct, Orbi propose le membre le moins chargé, et le membre doit accepter la tâche.
- **Télécharger** :
  - choix du format (PDF, Excel ou CSV), du contenu et de l'option « Masquer les noms » ;
  - aperçu du document et lien « Voir le modèle » ;
  - chaque téléchargement est noté dans le journal.
- **Modèles de documents A4** : bandeau Sapin avec logo et entreprise, titre, mentions « Confidentiel », et pied « Jumanly · entreprise · assistant@jumanly.io · Téléchargement noté dans le journal · n/total ». En mode sombre, les documents restent blancs.

## Règles métier (inchangées, rappel)

- Les données viennent des services (`src/server/services/hire-*.ts`). Les noms, chiffres et entreprises du prototype (Nadia Kalala, Baobab Fintech…) sont **fictifs** : seed de démonstration uniquement, jamais en production.
- Aucun texte en dur : chaque libellé du prototype entre dans `textes/textes-application.md` (partie Hire), puis `pnpm messages`.
- Droits par clés, jamais par nom de forfait : `hire.assessments`, `hire.automation`, `hire.pool.auto`, `hire.calendar.sync`, `hire.reports.export`, `hire.team`…
- Orbi recommande et l'humain décide. Aucun rejet automatique, et un « Pourquoi ? » sur chaque score. Nom, âge, genre et photo sont exclus du score.
- Requêtes filtrées par `organizationId`. Chaque consultation et chaque téléchargement est journalisé.
- Contact uniquement par e-mail (assistant@jumanly.io), aucun numéro de téléphone.
- Accessibilité WCAG 2.2 AA : focus visible, `aria-label` sur les boutons d'icône, `prefers-reduced-motion` respecté (déjà dans la CSS).

## Ce qui disparaît

L'ancien design recruteur **ordinateur et tablette** (Modèle B recruteur web, cadres `hire-frame`, anciennes cartes d'offres, ancienne barre et ancien rail) est retiré du code au fur et à mesure que chaque écran v3 le remplace. On ne touche jamais aux données : les migrations sont seulement additives. Le recruteur mobile reste en veille, sans être supprimé.
