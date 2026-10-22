# Plein écran au téléphone (22 octobre 2026)

Demande d'Ephraïm : sur le téléphone, le fond de l'application doit couvrir tout l'écran, en haut comme en bas.

## Ce qui laissait des bandes

- La page s'arrêtait sous la barre d'état et au-dessus de la barre d'accueil, faute de `viewport-fit=cover`. Les marges `env(safe-area-inset-*)` du Modèle B valaient donc 0.
- La barre du navigateur prenait le vert Sapin (`theme-color` #0F3F37), pas la nuit du Modèle B.
- L'appli installée démarrait sur le crème (manifeste) et avait une barre d'état claire.

## Ce qui change

- `viewportFit: "cover"` dans le layout racine. La page passe sous les deux barres ; les têtes et les barres du Modèle B s'en écartent déjà avec `--nb-haut` et `--nb-bas`.
- Au téléphone (espace talent et pages d'accès), un script fixe `theme-color` à la nuit `#0b1a1f` avant le premier affichage (`src/lib/phone-theme.ts`).
- Le manifeste passe à la nuit pour le fond de démarrage et la couleur de thème.
- Sur iPhone, l'appli installée affiche la barre d'état par-dessus son fond (`apple-mobile-web-app-status-bar-style: black-translucent`).
- Les pages qui ne sont pas du Modèle B (site public, recruteur, admin) commencent sous la barre d'état grâce à `padding-top: env(safe-area-inset-top)` sur `body`. Elles ne changent pas ailleurs.

Test : `tests/e2e/modele-b-plein-ecran.spec.ts`. Chromium ne simule pas les encoches, donc le test vérifie les réglages et la couleur de fond de la page. Le rendu sous l'encoche est à voir sur un vrai téléphone.
