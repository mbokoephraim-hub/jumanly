# Page d'accueil immersive (14 octobre 2026)

Demande du propriétaire : une page d'accueil plus vivante, fondée sur les dégradés de la marque,
où l'on « entre dans un autre univers ». Prompt validé : `/mnt/project-files/prompts/accueil-immersive.md`
(dossier partagé du projet). La page s'écarte donc volontairement de la maquette 01-01 sur les
fonds et le mouvement ; la mise en page et les textes restent ceux de la maquette et de `textes/`.

- **Fonds** : le blanc disparaît de l'accueil. Héros et forfaits sur le dégradé Profondeur,
  parcours sur Sapin, formations sur le dégradé IA, offres et engagements sur Lime clair, le reste
  sur Crème, avec des halos flous qui dérivent.
- **Dégradé Signature clair** (`signatureLight`, `marketing.tsx`) : variante sans l'extrémité
  #1E9A64, pour les surfaces qui portent du texte Sapin (contraste AA sur tout le dégradé).
- **Animations sans librairie** : CSS (`src/styles/motion.css`) et un seul petit composant client
  (`src/components/site/motion.tsx`, observateur d'apparition, compteurs, lumière du pointeur).
  Sans JavaScript ou avec `prefers-reduced-motion`, tout est visible et immobile ; hors écran, les
  animations sont en pause.
- **Personnages** : les illustrations sont des dessins fixes ; ils « respirent » et alternent deux
  poses en fondu, ils ne marchent pas.
- **Chiffres animés** : uniquement ceux des aperçus fictifs (« 87 % compatible ») et les prix lus
  en base. Aucune statistique de plateforme inventée.
- **Aperçu Hire** : `public/apercus/accueil-module-hire.webp`, capture de la maquette 04-01.
