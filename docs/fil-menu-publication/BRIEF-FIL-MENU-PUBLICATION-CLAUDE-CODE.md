# Brief · Menu en pilule, publication du Fil et Explorer (Modèle B)

Validé par Ephraïm le 26/10/2026. Ce brief **complète** `docs/modele-b/` (talent) et `docs/modele-b-recruteur/` (recruteur) sur trois points, et les remplace là où ils se contredisent :

1. la barre du bas devient un **menu en pilule** (talent et recruteur) ;
2. chaque publication du Fil a un **titre, un texte et une image à encoche** ;
3. l'**Explorer** talent garde l'écran du Modèle B, avec une nouvelle barre de recherche, un bouton **Filtres** et des pastilles plus discrètes.

Tout le reste du Modèle B (couleurs, Orbi flottant, transitions sans écran noir, préchargement, écrans non cités ici) reste tel quel. Mobile d'abord (390 px) ; sur tablette et ordinateur, appliquer le même modèle de publication dans le Fil web.

## Fichiers

| Fichier | Contenu |
|---|---|
| `maquette/Main.dc.html` | Planche des règles (mesures, limites de caractères) |
| `maquette/Fil-talent.dc.html` | Fil talent avec le menu en pilule et les nouvelles publications |
| `maquette/Publier.dc.html` | Écran « Nouvelle publication » talent (compteurs, aperçu) |
| `maquette/Fil-recruteur.dc.html` | Fil recruteur, même modèle |
| `maquette/Publier-recruteur.dc.html` | Publication recruteur |
| `maquette/Explorer.dc.html` | Explorer talent final (remplace `docs/modele-b/maquette/Offres.dc.html` pour la liste) |
| `maquette/img/` | Images de démonstration (fictives) |
| `maquette/gen.py` | Générateur des planches du Fil (référence, ne pas exécuter en CI) |
| `captures/` | Captures 390 × 844 de chaque planche (liste plus bas) |

Les liens de `Explorer.dc.html` vers d'autres écrans (Carrière, Entreprise, Formation…) pointent vers les planches de `docs/modele-b/maquette/`.

## 1. Menu en pilule

- Barre flottante en bas : 64 px de haut, à 12 px des bords et 22 px du bas, coins 32 px, fond `rgba(19,40,44,.9)` flouté (18 px), fin contour et ombre douce.
- Onglets **inactifs** : ronds 48 px, fond `#203F42`, icône crème `#F2EDE5`.
- Onglet **actif** : pilule Lime `#A6F26B` qui contient l'icône **et** le nom de l'onglet, en Sapin `#0F3F37` (jamais de blanc sur Lime).
- Passage d'un onglet à l'autre : la pilule s'élargit et l'ancienne se referme (largeur, marges intérieures et fond animés, environ 0,32 à 0,34 s, `cubic-bezier(.3,.7,.2,1)`). Les éléments du menu restent dans le DOM pour que la transition joue ; sans animation si `prefers-reduced-motion`.
- Pastilles de compteur (messages, notifications) conservées sur l'icône.
- **Libellés renommés** :
  - talent : Fil · Explorer · Carrière · **Hub** (ex-Formation) · **Chat** (ex-Messages) ;
  - recruteur : Fil · Offres · Candidatures · Talents · **Chat** (ex-Messages).
  Ajouter ou modifier les textes dans `textes/textes-application.md`, puis `pnpm messages` (règle d'or 7). Les routes ne changent pas.
- Orbi reste flottant au-dessus du menu, à droite.

## 2. Publication du Fil

Ordre de haut en bas :

1. **Auteur** : avatar 44 px (anneau Lime pour les comptes vérifiés), nom, puis une ligne secondaire (métier ou entreprise, ville, heure). Menu « … » à droite.
2. **Titre** : phrase d'accroche, **2 lignes maximum, 60 caractères maximum** (conseillé 30 à 50), 20 px, gras, coupé à 2 lignes.
3. **Texte** : environ 120 caractères, **160 maximum**, 14,5 px, `#DCE6E3`.
4. **Image** : hauteur 280 px, coins 30 px, **encoche en bas à gauche** (184 × 62 px, couleur du fond `#0B1A1F`, avec deux coins concaves) qui contient les actions J'aime · Commenter · Envoyer · Enregistrer. Réactions (deux avatars + nombre) en bas à droite de l'image. **Rien d'autre sur l'image** (ni nom, ni avatar).

Titre, texte et image sont **alignés sur la ligne du nom** (retrait de 54 px depuis le bord gauche du bloc), pas sur l'avatar.

Sans image : titre et texte seuls, les actions passent sous le texte. Les réponses gardent le format actuel (texte seul, sans titre).

### Données et limites

- Ajouter `title String?` à `FeedPost` (migration nommée clairement). Obligatoire pour une nouvelle publication principale, absent pour une réponse ; les anciennes publications sans titre s'affichent sans titre.
- Limites dans `src/server/services/feed-limits.ts` : `FEED_TITLE_MAX = 60`, `FEED_BODY_MAX = 160` pour une publication avec titre. 60 + 160 = 220, la limite recruteur déjà décidée (`FEED_POST_MAX`). Validation Zod partagée client/serveur.
- Écran **Publier** : champ Titre avec compteur `49/60`, champ Texte avec compteur `129/160` et aide « Encore un peu » sous 90 caractères, « Bonne longueur » de 90 à 150, « Presque au maximum » au-delà, choix de l'image, **aperçu dans le Fil** sous le formulaire, bouton Publier en Lime.
- Le recadrage de l'image suit la forme du Fil (280 px de haut, coins 30 px).

## 3. Explorer (talent)

On **garde** l'Explorer du Modèle B : en-tête (avatar, titre, enregistrées), rangées horizontales « Offres pour vous », « Entreprises qui recrutent », « Nouvelles cette semaine », « Personnes à connaître », cartes d'offres, recherche en deux temps. Changements :

- **Barre de recherche** compacte : 44 px de haut, fond Sapin `#0F3F37`, liseré `rgba(166,242,107,.28)`, loupe Lime, texte 14 px, indication « Rechercher ».
- **Bouton Filtres** Lime sur la même ligne, texte Sapin, pastille avec le nombre de filtres actifs. Il est remplacé par « Annuler » pendant une recherche.
- **Rangée Tout / Offres / Entreprises / Personnes supprimée** sous la recherche. La page affiche directement les offres, puis les entreprises, puis les personnes.
- **Pastilles** (domaines sous « Offres pour vous », secteurs sous « Entreprises qui recrutent », types dans la recherche) : 32 px de haut, texte 12,5 px. Active : Lime, texte Sapin. Inactive : fond transparent, texte `#C9D6D2`, contour `rgba(255,255,255,.16)`. Plus de pastille blanche.
- **Feuille de filtres** qui monte du bas (0,42 s), voile sombre derrière, poignée, « Effacer » en haut, bouton « Voir N résultats » en bas :
  - Chercher dans : Tout · Offres · Entreprises · Personnes ;
  - Type de contrat (offres) : CDI · CDD · Stage, choix multiple ;
  - Salaire mensuel (offres) : moins de 300 $ · 300 à 800 $ · 800 à 1 500 $ · plus de 1 500 $, avec une barre qui montre la tranche ;
  - Secteur (entreprises) : Tech · Télécom · Banque · Énergie · Mines · Santé · Cabinet · RH ;
  - Résidence (personnes) : RDC · Autre pays · Partout.
  Les groupes qui ne concernent pas la portée choisie se replient avec une transition (hauteur, opacité, léger glissement) et réapparaissent de la même façon.
- **Aucun filtre par genre**, ni âge, ni nationalité (règle d'or 4, décision d'Ephraïm du 26/10/2026). Les filtres trient l'affichage et ne bloquent jamais une candidature (règle d'or 1).
- Le menu en pilule (section 1) s'applique aussi à l'Explorer : la barre à icônes seules de la maquette Explorer est à remplacer.

## Captures

| Capture | Écran |
|---|---|
| `00-regles.png` | Règles : menu, titre, texte, image |
| `01-fil-talent.jpg` | Fil talent, menu en pilule (Fil actif) |
| `02-publier-talent.jpg` | Nouvelle publication talent |
| `03-fil-recruteur.jpg` | Fil recruteur |
| `04-publier-recruteur.jpg` | Publication recruteur |
| `05-explorer.jpg` | Explorer, liste |
| `06-explorer-filtres.jpg` | Explorer, feuille de filtres ouverte |
| `07-explorer-recherche.jpg` | Explorer, recherche en cours |

## Définition de fini

- Menu en pilule sur tous les onglets talent et recruteur, avec l'animation et les nouveaux libellés.
- Publication titre + texte + image à encoche dans le Fil talent et recruteur ; écran Publier avec compteurs et aperçu ; migration `title`.
- Explorer conforme à la section 3, filtres fonctionnels côté serveur (contrat, salaire, secteur, résidence).
- Contraste WCAG 2.2 AA, cibles tactiles de 44 px, `prefers-reduced-motion` respecté.
- Tests : unitaires sur les limites (titre, texte) et les filtres ; e2e Playwright : publier avec titre, ouvrir et appliquer les filtres de l'Explorer, changer d'onglet dans le menu.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` passent ; `docs/journal.md` à jour.
