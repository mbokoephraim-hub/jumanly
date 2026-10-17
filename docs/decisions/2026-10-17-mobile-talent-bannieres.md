# 2026-10-17 · Prompt 4 bis : bannières, offres, leçon v7

## Bannière et logo

- Format **3:1, 1500 × 500** (la maquette dit 1600 × 500) : un rapport simple, cadré à l'identique
  partout. Largeurs servies : 640, 1000 et 1500 px ; logo 128 et 256 px, en WebP.
- Le navigateur envoie la partie cadrée ; le serveur reconnaît le type par les premiers octets, refuse
  ce qui n'est pas un JPEG, PNG ou WebP de 4 Mo au plus, et recadre de toute façon au bon rapport.
- Seuls les **administrateurs** de l'organisation changent l'identité ; les autres rôles la voient
  avec une phrase qui l'explique.
- Sans bannière : le motif Jumanly (dégradé vert et anneaux Lime), pas une image inventée.
- L'éditeur d'offre ouvre la fenêtre de cadrage sur place : l'offre en cours de rédaction est gardée.

## Offres

- Les cartes de l'espace connecté passent à la bannière. Les pages publiques `/offres` gardent leurs
  cartes pour cette étape (périmètre : l'appli talent).
- La carte ne montre plus le salaire (maquettes 63, 66, 74) ; il reste dans le détail de l'offre.
- « Offres proches » après l'envoi compte les offres proches réellement trouvées (au plus trois), sans
  promettre de « nouvelles ».
- « Analyser avec Orbi » (écran 65) attend le prompt 8.

## Leçon v7

- « En bref », « Ce que vous allez faire » et « À retenir » sont écrits par l'équipe dans l'admin
  (champ JSON `content` de la leçon, sans migration). Une leçon qui ne les a pas ne montre pas ces
  blocs : rien n'est généré ni inventé. Le texte de la leçon reste dans le bloc « La leçon ».
- La transcription suit la vidéo quand ses lignes commencent par un moment (« 05:40 … »), sinon elle
  s'affiche comme un texte. Une ligne touchée relance la vidéo à ce moment.
- « Exercice de la leçon » ouvre le quiz qui suit la leçon dans le même module, s'il existe.
- La progression (Learn v2) n'est pas refaite : même action « Marquer comme terminée », même reprise
  de la vidéo.
- Sur grand écran, la table des matières de côté laisse sa place à l'onglet Modules ; l'attestation et
  le formateur restent à droite.
