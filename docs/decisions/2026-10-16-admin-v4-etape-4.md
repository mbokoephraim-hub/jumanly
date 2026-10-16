# Admin v4, étape 4 : jetons de la palette épurée posés sur la coque connectée

Date : 16 octobre 2026.

Le plan demandait de changer les jetons dans `src/styles/tokens.css`. Ce fichier sert aussi aux
pages publiques (accueil immersif, tarifs, formations), dont l'identité a été validée lot par lot.
Les nouvelles valeurs (Crème plus clair, semi-gras à la place du gras, espacement un cran plus
serré sur ordinateur, ombres légères) sont donc redéfinies sur `.jm-admin-bg`, la classe de la
coque commune à l'admin et aux espaces connectés (`src/styles/admin.css`). Un seul endroit à
modifier, et les pages publiques ne bougent pas.
