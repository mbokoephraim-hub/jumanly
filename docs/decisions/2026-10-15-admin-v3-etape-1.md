# Admin v3 · étape 1 : écarts avec la maquette 07-01

- La maquette 07-01 dessine une barre Nuit de 256 px sur toute la hauteur, avec les libellés. À la
  demande du propriétaire (15 octobre 2026), elle est remplacée par une colonne flottante d'icônes
  en dégradé, arrondie en haut et en bas ; les libellés passent en infobulle.
- Le panneau principal Crème à coins de 32 px disparaît sur ordinateur : la page entière prend le
  fond clair à halos du site, et chaque page s'ouvre sur un bandeau vert profond.
- Le dégradé de la colonne (`--jm-degrade-rail`) est un jeton de l'admin (`src/styles/admin.css`),
  pas de la charte : il reprend les teintes de `--jm-degrade-ia` en vertical, sans le Menthe vif en
  bas (adouci en `#1fa98a`) pour que les icônes blanches gardent leur contraste.
