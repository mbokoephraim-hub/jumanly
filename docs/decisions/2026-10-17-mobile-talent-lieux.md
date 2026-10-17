# Pays, villes et provinces (prompt 3 bis, écrans 81 et 82)

Date : 2026-10-17

## Choix

- **Référentiel en base** (`Country`, `Locality`) plutôt qu'un fichier côté navigateur : il se complète
  sans redéployer et sert aussi au recruteur (écran 91, prompt 11). Les noms viennent de `Intl` en
  français, sauf « RD Congo », « Congo » et « Centrafrique », écrits comme sur les maquettes.
- **Villes et provinces** : liste choisie à la main depuis GeoNames (villes principales de chaque pays
  d'Afrique et de sept pays hors d'Afrique ; les 26 provinces de la RD Congo, Kinshasa étant rangée avec les
  villes). Un pays sans lieu connu se choisit en entier. Pas de saisie libre (V8 § B1).
- **Drapeaux** : flag-icons 7.2.3 (licence MIT, jointe dans `public/drapeaux/LICENSE.txt`), chargés en
  différé, environ 1,7 Mo au total mais quelques Ko par écran.
- **« Plus tard » sur l'écran 81** : absent de la maquette, gardé en petit lien en haut à droite pour que
  personne ne soit bloqué à la première connexion (et pour la cohérence avec l'écran d'objectif).
- **« Télétravail accepté »** au lieu de « Ouverte au télétravail » : la formulation ne suppose pas le genre.
- **Filtre des offres** : les offres écrivent leur pays en texte libre (« RD Congo ») ; chaque écriture
  utilisée est rapprochée de son code ISO. Les offres n'indiquent qu'une ville : un pays où une province a
  été choisie est gardé en entier pour ne masquer aucune offre. Le filtre « Mes lieux de travail » est un
  choix de la personne (case dans les filtres, puce avec ×), jamais imposé.
- `Job.country` n'est pas modifié (pas de migration des offres existantes).
- **Ordre des écrans** : `/app/bienvenue` (pays), `?etape=objectif`, `?etape=lieux`, puis
  `?etape=precisions` (l'ancien `?etape=2` reste valable). « Modifier mon objectif » depuis Pour moi ouvre
  l'objectif seul et revient à Pour moi.
