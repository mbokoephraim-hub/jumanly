# 2026-10-13 · Textes du socle dans un fichier à part

Statut : proposé, à confirmer par le propriétaire.

`CLAUDE.md` (règle 7) demande d'ajouter tout nouveau texte dans `textes/textes-application.md`,
dans la bonne partie. Les textes créés à l'étape E0 (page interne `/dev/composants`, écrans
provisoires, textes alternatifs des personnages, quelques textes de composants) n'appartiennent à
aucune des 10 parties.

Choix : ils restent dans `textes/00-socle.md`. `pnpm messages` lit les deux fichiers et refuse
toute clé en double. Raison : `textes-application.md` reste identique à la version fournie et peut
être remplacé tel quel à chaque mise à jour du cahier des charges.

Si le propriétaire préfère un seul fichier, ces lignes seront déplacées à la fin de
`textes-application.md`, dans une partie « Socle technique ».
