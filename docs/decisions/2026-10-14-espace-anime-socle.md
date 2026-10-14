# Espace connecté animé : choix du socle (lot A)

Date : 14 octobre 2026. Brief : `docs/experience-animee/BRIEF-ESPACE-UTILISATEUR.md`.

- **Pas d'API View Transitions.** Next 16 garde les routes précédentes montées (cacheComponents),
  ce qui rend la capture de l'ancienne page peu fiable. On anime seulement l'entrée de la nouvelle
  page, en cascade, depuis `src/app/app/template.tsx`. C'est le repli que le brief autorise.
- **Interrupteur sur la coquille, pas sur `<html>`.** La préférence de la personne pose
  `data-reduce-motion` sur la racine de l'espace connecté (rendu serveur, donc sans clignotement) ;
  les règles CSS y coupent animations et transitions. `AppMotionRoot` n'ajoute alors aucun
  attribut ni écouteur.
- **Dégradés animés par une propriété enregistrée.** `@property --jm-pos` est animée et
  `background-position` en dépend, pour respecter la règle « transform, opacity, filter ou
  `@property` seulement ».
- **Pilules qui glissent en FLIP.** L'onglet actif est animé depuis la position de l'ancien
  (Web Animations API, `transform`), sans élément indicateur séparé : le liseré reste porté par
  l'onglet lui-même. Pour les rails, la position précédente est gardée dans `sessionStorage`.
- **Motifs clairs sur le fond Crème.** Les motifs `-clair` du module sont posés à 8 % en haut de la
  page et s'effacent vers le bas, jamais derrière un texte courant.
