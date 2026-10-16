# Mobile Talent v5 · navigation (prompt 2)

Date : 16 octobre 2026.

## Décision

- **Destinations.** Le Talent a quatre destinations : Pour moi (`/app`), Offres (`/app/jobs`),
  Apprendre (`/app/learn`), Suivi (`/app/suivi`, nouvelle page). Sur ordinateur, la colonne d'icônes
  ajoute Career. Messages quitte la navigation principale : il est dans le menu de l'avatar, dans
  Suivi et dans Mon espace. Hire et Partenaire gardent leur navigation (pilule, colonne).
- **Barre du bas** (`TabBar`) seulement sous 768 px, comme l'ancienne pilule : à partir de 768 px la
  colonne d'icônes la remplace. Le plan (écart 3) proposait de la garder jusqu'à `lg` ; on ne l'a pas
  fait, car deux navigations à l'écran entre 768 et 1024 px se contredisent. Le « trou » des barres
  d'action fixes est réglé autrement : la barre du bas se retire sur les écrans qui ont leur barre
  d'action (détail d'offre et candidature, Learning Room, conversation, éditeur de CV, Mon espace),
  et ces barres se posent à 12 px du bas au lieu de 72 px au-dessus de la pilule.
- **Pastille de Suivi** = nombre réel d'actions à traiter (`followUpActions`,
  `src/server/services/follow-up.ts`) : entretiens proposés sans réponse avec un créneau à venir,
  documents demandés non envoyés, conversations non lues qui ne sont ni l'un ni l'autre. Une action
  n'est jamais comptée deux fois.
- **Menu de l'avatar** (écran 34) : une petite carte ancrée sous l'avatar, pas une page. Sans
  JavaScript, l'avatar est un lien vers `/app/espace`. La ligne Jumanly AI en tête arrive au
  prompt 7 avec l'assistant : on n'affiche pas d'entrée qui ne fonctionne pas encore.
- **Sélecteur d'espace** : sur téléphone, il passe en tête de Mon espace pour le Talent ; sur
  ordinateur il reste dans la barre du haut.
- **Tableau de bord** : déplacé tel quel à `/app/tableau-de-bord`. `/app` l'affiche encore jusqu'au
  prompt 3, qui en fait « Pour moi » ; aucune adresse ne disparaît, donc aucune redirection n'est
  nécessaire.
- **Sous-onglets** : plus de `SectionNav` sur Pour moi, Offres et Suivi. Les pages « Mes
  candidatures » et « Offres enregistrées » gardent leurs onglets.

## Raison

Suivre le cahier des charges mobile (quatre destinations, menu du haut, Mon espace) sans perdre
aucun écran ni aucun lien, et sans montrer de fonction fictive.
