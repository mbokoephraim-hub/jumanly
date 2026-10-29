# Onglets instantanés et appli gardée sur le téléphone (29/10/2026)

Demande d'Ephraïm : « passer du Fil à Explorer, d'Explorer à Carrière prend quelques secondes », « que
l'appli télécharge toutes les pages pendant le logo, les mette à jour en arrière-plan et marche sans
connexion, comme WhatsApp ».

**Cause.** Les cinq onglets du talent sont dessinés par le layout `/app` et restent montés ; la page de
chaque onglet (`/app`, `/app/jobs`, `/app/career/cv`, `/app/learn`, `/app/messages`) renvoie `null` au
téléphone. Pourtant chaque passage d'onglet était une navigation Next : un aller-retour au serveur
(session, base, puis rien à afficher). La copie chargée d'avance ne vit que 30 s (`staleTimes.static`) :
après un moment sur le Fil, chaque toucher attendait le serveur.

**Choix.**
- Onglets du talent : le menu change l'adresse sur le téléphone (`history.pushState`, que Next suit :
  `usePathname` change, l'onglet déjà monté s'affiche). Aucun appel au serveur, même hors ligne. Le titre
  de l'onglet du navigateur est repris. Le recruteur garde la navigation habituelle (ses onglets sont de
  vraies pages). Depuis une page d'entreprise ou de personne (menu au-dessus), navigation habituelle.
- `src/components/phone/fresh.tsx` : un `router.refresh()` relit tout le layout, donc les cinq onglets
  d'un coup : au retour dans l'appli après 1 min, au retour du réseau, toutes les 10 min sur le premier
  écran d'un onglet (pas pendant une saisie, une feuille ouverte, ni plus bas que 200 px dans une liste).
  Le préchargement (`preload.tsx`) recommence ensuite, et démarre dès 300 ms, pendant le logo.
- Stockage : `navigator.storage.persist()` (le navigateur ne vide plus le stockage de l'appli pour faire
  de la place) ; `public/sw.js` garde 150 pages au lieu de 60, garde les images du site et de l'espace
  (300 au plus, vidées à la déconnexion), et montre la copie d'une page gardée si le réseau ne répond
  pas en 3,5 s, puis prévient l'écran, qui se relit quand la version fraîche arrive.

**Limites.** Les données des pages hors onglets (détail d'une offre, d'une formation) restent celles du
préchargement ou de la copie gardée ; hors ligne, une page jamais ouverte montre la page « hors ligne ».
