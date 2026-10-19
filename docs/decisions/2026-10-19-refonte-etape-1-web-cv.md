# Refonte étape 1 · Studio CV web : écarts au brief et à la planche

Date : 19 octobre 2026. Planche : `docs/refonte-web/studio-cv` (générateurs `webcv.py`, `web.py`).

## Routes

- **Les routes existantes sont gardées** : `/app/career/cv` (Mes CV et Lettres), `/app/career/cv/[id]`
  (studio), `/app/career/cv/modeles?cv=` (galerie), `/app/career/documents/[id]` (lettre),
  `/app/career/linkedin`. Les adresses `/app/cv/...` de la planche ne sont pas créées : les liens, les
  e-mails, les tests et les autres lots pointent déjà vers `/app/career/...`, et une seconde famille
  d'adresses aurait demandé des redirections sans rien apporter.
- **Un seul code par écran** : l'arbre téléphone (planche talent-4 § 6) est dans `.t-mob`, l'arbre web
  (`.t-sc-*`) n'apparaît qu'à partir de 768 px. Les feuilles et fenêtres sont rendues une fois, hors des
  deux arbres. L'éditeur téléphone a été déplacé tel quel dans
  `src/components/talent/cv/mobile-editor.tsx` ; ses options « … » sont partagées avec le studio
  (`cv-options.tsx`, ids préfixés `cv-` et `sc-`).
- **Import depuis Mes CV** : sur ordinateur, « Importer » ouvre une fenêtre sur la liste
  (`?importer=1`, actions avec `retour=cv`) ; sur téléphone, il garde sa page `/app/profil/import`.

## Studio

- **Sections** : le modèle de contenu des CV n'a que cinq sections (Résumé, Expériences, Études,
  Compétences, Langues). Projets, Certifications et Centres d'intérêt dessinés sur la planche n'existent
  pas dans `CvContent` ; pas de « + Ajouter » de section. À ouvrir dans une étape « contenu des CV ».
- **« Demander à Orbi »** au pied des panneaux : sans micro ; la question ouvre le panneau Orbi du
  cadre W0 (`openOrbiPanel`), le studio reste en place.
- **Bouton « Orbi »** de l'en-tête : revient à la carte « Orbi pour vos CV » de la colonne de droite
  (visible sur ordinateur ; sur tablette la carte est sous la page, comme sur la planche).
- **Bouton « … »** ajouté dans l'en-tête (non dessiné) : renommer, coordonnées, CV principal,
  rafraîchir depuis le profil, dupliquer, supprimer, comme sur téléphone.
- **« Tout accepter » / « Tout refuser »** ajoutés sous la liste des autres propositions : chaque
  proposition reste décidée par la personne, rien n'est appliqué sans clic.
- **Zoom** : la valeur affichée est l'échelle réelle de la page dans la colonne (calculée), pas un
  réglage.
- **Surlignage sur la page** : bloc entier (Profil, Expériences, titre) entouré, avec l'étiquette
  « Proposition » ; la planche entoure parfois une ligne précise.
- **Export Word** : implémenté (`/app/career/cv/[id]/word`, `src/features/cv/export/docx.ts`), une
  colonne, sans modèle (donc sans contrôle `career.cv.templates.access`), sans mention Jumanly.
- **Cadre du studio** : pas de barre du haut et rail de 84 px même sur ordinateur, comme sur la
  planche. Une classe sur `<html>` posée par un composant client (`StudioFrame`) plutôt que `:has()`,
  parce que le routeur garde les pages précédentes cachées dans le DOM.
- **Zone large** : la règle W0 `main.t-colonne:has(> .t-large)` ne s'applique jamais (le gabarit
  `src/app/app/template.tsx` intercale `.jm-page`). Les pages de ce lot posent `t-sc-wide` sur `<html>`
  (même composant) ; la règle W0 est laissée telle quelle pour les autres lots.

## Galerie

- Filtres web de la planche (Tous, Inclus dans ma formule, Avec photo, Une colonne, ATS excellente) ;
  le téléphone garde ses familles (Sobres, Avec colonne, Créatifs).
- **Tablette** : le détail devient une barre fixée en bas (nom, description, bouton) au lieu de la
  « feuille » de la planche ; l'aperçu grand format n'est montré que sur ordinateur.

## Lettres et LinkedIn

- Le détail d'une lettre (`/app/career/documents/[id]`) garde le format téléphone (760 px).
- « Préparer LinkedIn » : la ligne « Depuis « <CV> » » devient « Depuis votre profil » (la proposition
  est faite à partir du profil, pas d'un CV).
