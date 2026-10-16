# Mobile Talent v5 · socle visuel (prompt 1)

Date : 16 octobre 2026.

## Décision

- La gamme de boutons de la maquette (planche « Boutons ») étend le `Button` existant au lieu d'un
  nouveau composant : variantes `principal`, `accent`, `soft` (le « secondaire » blanc de la maquette),
  `outline`, `link`, `ai`, `dangerOutline`, tailles `L` (52 px), `M` (44 px), `S` (36 px), propriétés
  `arrow` (rond Lime et flèche) et `done` (fait, après la réponse du serveur).
- `primary` (Lime) et `secondary` (Sapin) gardent leur aspect : le prompt 1 ne change aucune page. Les
  écrans du Talent passent à `principal` au fil des prompts 2 à 6 ; quand plus aucun écran Talent
  n'utilise `primary`, on décidera s'il devient un alias de `principal`.
- Les dégradés de la maquette (`--g-principal`, `--g-accent`, `--g-aurore`, `--g-irise`) sont repris
  dans `src/styles/surfaces.css` sous les noms `--jm-degrade-principal`, `-accent`, `-aurore`, `-irise`,
  avec des couleurs déjà présentes dans la marque.
- L'appui visible est une seule classe, `.jm-pressable` (composant `Pressable`, flèche `PressArrow`) ;
  le passage de la flèche à l'indicateur après 300 ms s'appuie sur la marque `data-nav-pending` posée
  par `NavigationFeedback`, sans JavaScript de plus.
- `AiChip` porte l'identité de Jumanly AI (nuit aurore, contour irisé, étincelle Lime) ; aucun autre
  bouton ne l'emprunte. `AiFab` et `AiPanel` arrivent au prompt 7.

## Raison

Ne casser aucun écran existant et garder un seul composant de bouton dans le projet.
