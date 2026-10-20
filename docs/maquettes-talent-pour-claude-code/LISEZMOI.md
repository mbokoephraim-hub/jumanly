# Maquettes de l'espace talent · à reproduire à l'identique

Ce dossier contient **les maquettes finales validées par Ephraïm** pour l'espace talent de Jumanly, sur téléphone (dossiers 01 à 06) et sur ordinateur et tablette (dossiers 07 à 11). Elles sont aussi dans le dépôt : `docs/refonte-mobile/` et `docs/refonte-web/`.

## Ce que contient chaque dossier

- `*.html` : la planche complète, à ouvrir dans un navigateur. C'est la référence exacte : inspecter les éléments pour lire les tailles, marges, couleurs, ombres et rayons.
- `captures/*.jpg` : une image par section de la planche, dans l'ordre.
- `source/` et `00-source-commune/` : les fichiers qui génèrent les planches (`fondations.css` = jetons et surfaces, `icones.py` = les icônes en SVG, `web.py` = cadre ordinateur et tablette). Les valeurs y sont exactes.

## Pourquoi ce dossier

L'application en ligne s'écarte des maquettes. Exemple relevé le 20/10/2026 sur « Pour moi » (téléphone, mode sombre) :

1. Une grande carte « Bienvenue sur Jumanly » en 3 étapes a été ajoutée en haut : elle n'existe pas dans la maquette.
2. La barre de recherche « Rechercher une offre, une formation… » manque sous le titre.
3. Les 3 tuiles Apprendre · Profil et CV · Offres, avec leur barre de progression, manquent.
4. L'avatar est un rond orange avec un logo au lieu des initiales sur fond lime.
5. Le titre dit « Bonjour » sans le prénom.
6. Les offres n'ont pas leur pourcentage de correspondance.
7. Le texte du bas passe sous la barre du bas, trop transparente ; il manque l'espace en bas de page.

## Consigne

Pour **chaque écran** de l'espace talent :

1. Ouvrir la planche HTML et la capture correspondantes.
2. Faire une capture Playwright de l'écran codé à la même largeur (390 px pour le téléphone ; 1024 et 1440 px pour la tablette et l'ordinateur), en clair et en sombre, **avec le compte de démonstration rempli** et **avec un compte neuf**.
3. Mettre les deux côte à côte et corriger **tout** écart : ordre des blocs, blocs manquants ou ajoutés, tailles, couleurs, icônes, textes, espacements, barre du bas, en-tête.
4. Ne rien ajouter qui ne soit pas dans la maquette. Un compte vide garde la même structure, avec les états vides prévus par les planches.

Chaque PR joint les images côte à côte (maquette à gauche, écran codé à droite) et la liste des écarts corrigés.
