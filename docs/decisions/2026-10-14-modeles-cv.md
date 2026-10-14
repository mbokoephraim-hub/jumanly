# Modèles de CV : choix techniques de l'étape A (14 octobre 2026)

Référence : `docs/modeles-cv/SPECIFICATION-MODELES-CV.md`. Écarts et précisions :

1. **Export PDF par Chromium** (puppeteer-core + @sparticuz/chromium) au lieu de react-pdf : le PDF
   est l'impression de la page `/impression/cv/[id]`, qui affiche le même composant `CvDocument`
   que l'aperçu. En local, `CHROMIUM_PATH` ; en CI, le Chromium de Playwright. Les métadonnées sont
   réécrites avec pdf-lib (titre « CV Prénom Nom », auteur = la personne, ni créateur ni producteur).
2. **Jeton d'impression** : la page d'impression n'a pas de session. Elle exige un jeton signé
   (HMAC avec `BETTER_AUTH_SECRET`), valable 60 secondes et à usage unique (une ligne `JobRun`
   `cv-print:<nonce>`). Le droit `career.cv.templates.access` est vérifié avant de créer le jeton.
3. **Contenu inchangé** : le contenu stocké (`CvContent`) n'est pas migré. Un adaptateur
   (`documentFromCv`) le transforme en document imprimable. Les réglages vivent dans
   `Document.style` ; l'ordre personnalisé des sections passe de `content.sections` à
   `style.sectionOrder` (l'ancien ordre est ignoré, la visibilité reste dans le contenu).
4. **CSS des modèles** : les 15 fichiers `modele-<id>.css` sont copiés tels quels. Dans
   `cv-base.css`, les règles qui visent tout le document (`@page`, `*`, `html, body`) passent dans
   `print.css`, chargé seulement par la page d'impression, pour ne pas toucher le reste du site ;
   la remise à zéro est limitée à `.cv`. `print.css` évite aussi la page blanche que Chromium
   ajoute après la dernière page.
5. **Gabarit de page** : un élément caché au lieu d'un `<template>` (React le rend comme les
   autres nœuds). L'algorithme de `pagination.js` est inchangé.
6. **Remis à plus tard** : export Word (étape C), envoi d'une photo (pas encore de stockage de
   fichiers : la photo du compte est utilisée si elle existe), réduction des marges dans « Faire
   tenir sur une page » (seule la densité compacte est appliquée), table d'accès modifiable dans
   l'admin (étape B), maximum de pages modifiable dans l'admin (fixé à 3).
7. **Copies envoyées** (candidature, message) : elles sont imprimées par le même chemin, avec le
   modèle et les réglages du moment de l'envoi, quel que soit le forfait actuel.
