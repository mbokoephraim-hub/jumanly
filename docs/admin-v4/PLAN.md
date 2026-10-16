# Admin v4 et espaces connectés : synchronisation immédiate et nouvelle coque

Date : 16 octobre 2026. Prompt validé par le propriétaire le 16 octobre 2026 (« Tu enchaînes les
étapes en fusionnant chaque PR quand les modifications sont vertes »).

---

> **Contexte.** Admin v3 est terminé (`docs/admin-v3/PLAN.md`, PR #60 à #65) : l'administration a
> déjà sa colonne flottante d'icônes, arrondie en haut et en bas, en dégradé (`--jm-degrade-rail`),
> avec libellés en infobulle et pilule flottante sur téléphone. On **part de cette colonne** sans la
> refaire. Les espaces connectés (`/app` : talent, recruteur/Hire, partenaire) gardent encore leur
> ancienne coque (`src/components/layout/app-shell.tsx`).
>
> **Objectif.** Trois choses :
> 1. tout ce qu'on ajoute ou modifie dans l'admin apparaît **tout de suite** dans les pages des
>    utilisateurs ;
> 2. les espaces utilisateurs prennent la **même identité** que l'admin : menu principal vertical
>    en icônes seules, et un **second menu horizontal** en haut de l'écran ;
> 3. l'ensemble devient **plus épuré, plus léger et entièrement responsive**, en s'inspirant de
>    l'organisation du tableau de bord créateur de **Patreon** (titres, barre de recherche,
>    organisation du profil).
>
> Commence par écrire le plan dans `docs/admin-v4/PLAN.md` (étapes ci-dessous, une PR par étape),
> puis réalise les étapes l'une après l'autre : chaque PR est fusionnée dès que la CI est verte et
> l'étape suivante démarre aussitôt.

## Étape 1 · Ce qui change dans l'admin se voit tout de suite

- Dresse la liste de **chaque élément modifiable dans l'admin** (forfaits et droits, formations,
  leçons et PDF, offres, organisations, contenus et FAQ, bandeaux, conseils, réglages IA,
  partenaires et licences, comptes et rôles, abonnements) et, pour chacun, **toutes les pages
  utilisateurs et publiques** qui l'affichent.
- Pour chaque paire, vérifie le cache (`"use cache"`, `cacheTag`, `cacheLife` dans
  `src/server/queries/`) et que l'action admin appelle bien `updateTag(...)` sur la bonne étiquette
  (ou `refresh()`). Corrige les trous : étiquette manquante, étiquette trop large ou trop étroite,
  page qui lit une donnée en cache sans étiquette.
- Un ajout doit apparaître aussi : nouvelle formation publiée dans le catalogue et dans Learn,
  nouveau forfait sur `/tarifs` et `/app/abonnement`, nouveau contenu ou bandeau là où il est prévu.
- Les droits et quotas modifiés pour un forfait ou un utilisateur s'appliquent dès la requête
  suivante (pas de valeur gardée en mémoire).
- Livrable : un tableau « élément admin → pages concernées → étiquette de cache → vérifié » dans
  `docs/admin-v4/synchronisation.md`, et un test e2e par famille : modifier dans l'admin, ouvrir
  la page utilisateur, voir la nouvelle valeur sans attendre ni recharger le serveur.

## Étape 2 · Nouvelle coque des espaces utilisateurs

Une seule coque pour tous les espaces connectés et **tous les forfaits** : le forfait ne change pas
le design, il change seulement les rubriques visibles, via les droits (`can()`), jamais par nom de
forfait.

- **Menu principal vertical** : même colonne que l'admin (72 px, icônes seules, hauteur selon le
  contenu, arrondie en haut et en bas, dégradé, flottante à gauche, libellé en infobulle au survol
  et au focus, `aria-label` sur chaque lien). Factorise-la en un composant partagé entre l'admin et
  `/app` plutôt que de la copier. Rubriques par espace : talent (Accueil, Learn, Career, Jobs,
  Messages), recruteur (Hire, offres, viviers, entretiens, Messages), partenaire (tableau de bord,
  licences, rapports). En bas : changement d'espace et compte.
- **Menu secondaire horizontal**, collé en haut de la zone de contenu, au-dessus de l'application :
  - à gauche, les **sous-rubriques de la rubrique active** (par ex. dans Career : Accueil, Mes CV,
    Diagnostic, Simulations, Portfolio) en onglets fins, l'actif souligné ;
  - à droite, la **barre de recherche**, la cloche des notifications, l'aide et l'avatar ;
  - il remplace les rails d'onglets actuels (`TabRail`) au lieu de s'y ajouter.
- Même logique dans l'admin : les sous-écrans (par ex. Formations : Studio, Liste, Documents ;
  Contenus : FAQ, Conseils, Bandeaux) passent dans ce menu horizontal.

## Étape 3 · Organisation inspirée de Patreon

S'inspirer de la structure, sans copier ni logo, ni couleurs, ni textes de Patreon :

- **Titres** : un grand titre de page simple, à gauche, sur fond clair, avec une phrase courte en
  dessous et l'action principale à droite. Fin des gros bandeaux en dégradé qui prennent la moitié
  de l'écran.
- **Recherche** : une barre de recherche large et arrondie, toujours au même endroit dans le menu
  horizontal, avec raccourci clavier `/` et résultats groupés par type.
- **Profil** : un bloc compte en bas de la colonne (avatar, nom, forfait en petite pastille) qui
  ouvre un menu : profil, abonnement, paramètres, changer d'espace, se déconnecter. La page profil
  suit le même modèle : couverture fine, avatar, nom, ligne d'informations, onglets horizontaux
  (À propos, Compétences, Expériences, Documents, Visibilité).
- Le même modèle (titre, recherche, bloc profil) s'applique à l'admin.

## Étape 4 · Palette épurée et éléments plus légers

- Fond blanc cassé ou Crème très clair ; cartes blanches avec bordure fine plutôt qu'ombres
  lourdes ; le dégradé est réservé à la colonne d'icônes, aux boutons importants et à quelques
  accents (pas de grands aplats colorés).
- Alléger la typographie : titres en semi-gras au lieu de gras épais, tailles réduites d'un cran,
  chiffres clés plus petits ; moins de majuscules et de surtitres.
- Densité : réduire marges et hauteurs des cartes, bandeaux et en-têtes pour que **l'essentiel
  d'une page tienne sans défiler** sur un écran 1440 × 900 (tableau de bord, listes, fiches).
  Mesurer avant et après sur les pages principales et noter le résultat.
- Garder la lisibilité : contraste AA, texte Sapin sur Lime, jamais blanc sur Lime.
- Les jetons changent dans `src/styles/tokens.css` (nouveaux jetons de surface, bordure et densité),
  pas page par page.

## Étape 5 · Application à tous les écrans

Appliquer coque, titres, palette et densité à chaque écran de `/app` (talent, recruteur,
partenaire) puis à chaque écran de `/admin`, en gardant les fonctions et les textes existants.
Une PR par espace si le volume l'impose (talent, recruteur, partenaire, admin).

## Étape 6 · Responsive et passe finale

- **Téléphone** (390 px) : la colonne devient la pilule flottante du bas (icônes seules) ; le
  menu horizontal devient une ligne d'onglets qui défile au doigt, recherche dans une icône qui
  s'ouvre. **Tablette** (768 px) : colonne conservée, onglets qui défilent. **Ordinateur** :
  1280, 1440 et 1920 px.
- Aucun défilement horizontal de page, aucun élément caché sous la pilule ou sous la barre du bas.
- Passe de cohérence, accessibilité (axe dans l'e2e), mouvement réduit, guide admin et guide
  utilisateur mis à jour.

## Règles communes (à rappeler à chaque étape)

Lire `CLAUDE.md`, `docs/specifications.md` (parties 05, 07, 10, 11) et la maquette de chaque page
dans `docs/maquettes/` (la mise en page sert de base ; ce plan l'emporte pour la coque, la palette
et la densité). Textes uniquement dans `textes/textes-application.md` puis `pnpm messages`. Aucun
nom de forfait dans le code. Aucune donnée inventée. WCAG 2.2 AA, chaque icône seule a un nom
accessible, focus visible, `prefers-reduced-motion` respecté, budget de 200 Ko de JS sur les pages
publiques. Avant chaque PR : `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db` (complet),
`pnpm build`, e2e des écrans touchés ; captures 390, 768 et 1440 px dans
`/mnt/project-files/captures/admin-v4/etape-N/` ; entrée dans `docs/journal.md` ; écarts dans
`docs/decisions/2026-MM-JJ-admin-v4-etape-N.md`. Une PR par étape, fusionnée dès que la CI est
verte, puis étape suivante.
