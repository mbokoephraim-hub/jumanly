# Brief · Profil d'une personne (connexion, candidat)

Validé par Ephraïm le 26/10/2026. Remplace la page profil d'une personne du Modèle B (`docs/modele-b/maquette/Personne.dc.html`) côté talent, et la fiche profil d'un candidat côté recruteur (mobile d'abord, 390 px). Même identité sombre que le Modèle B, menu en pilule de `docs/fil-menu-publication/`.

Maquettes : `maquette/Profil.dc.html` (une seule page, réglages `qui`, `vue`, `onglet`, `pourquoi`) et les planches qui l'utilisent. Captures : `captures/01` à `07`.

## En-tête (compact)

1. Barre du haut : Retour, titre discret (« Profil » ou « Candidat »), Partager, « … ».
2. **Bannière au format LinkedIn (4:1)** : carte arrondie 350 × 88 px (coins 20 px), image choisie (`TalentProfile.banner`) ou motif dessiné, petite étiquette (domaine) en bas à droite.
3. **Photo réduite** : 76 px, qui chevauche la bannière, anneau aux couleurs de ses 5 premières compétences, point menthe si la personne est active maintenant.
4. **Réseaux** à droite de la photo, ronds de 32 px : LinkedIn, Instagram, e-mail, X, Facebook, site web. On n'affiche que ceux que la personne a remplis.
5. **Nom** (20 px) + badge vérifié Lime, ou « Non vérifié ». **Alias** `@…` en dessous.
6. **Ville, pays avec le drapeau du pays** (tous les pays, d'après le code ISO de `User.country`) + heure locale.
7. **Bio** (13 px, 3 lignes environ).
8. Pastilles : nombre de connexions, domaine, contrat cherché (`desiredContracts` : CDI, CDD…), activité (« Actif aujourd'hui »).
9. Connexions en commun (avatars superposés + phrase).
10. Actions, vue connexion : « Se connecter » (Lime) → « Demande envoyée » → « Connectés » ; « Chat » seulement une fois connectés (pas de message sans connexion acceptée).

## Onglets

Segment 36 px, texte 11,5 px : **Publications · À propos · Réalisations · Portfolio**. Pilule Lime qui glisse sous l'onglet actif (0,38 s), onglets collés en haut au défilement, contenu qui apparaît en glissant.

- **À propos**
  - **Compétences** : chaque compétence a sa propre couleur (lime, menthe, ambre, ciel, corail, lilas, sable, rose), pastille teintée + point de couleur + coche si vérifiée. Au-dessus, une barre qui montre la part de chaque famille de compétences.
  - **Expériences** : frise verticale, logo coloré, intitulé, « Actuel », entreprise, **type de contrat en couleur**, dates, durée, lieu, puis **les points qui précisent le rôle** (une ligne de `Experience.description` = un point). Deux points visibles, « Voir N de plus » pour le reste.
  - Formation, puis Langues (5 traits de niveau).
- **Publications** : ses publications au format du Fil (titre, texte, image à encoche).
- **Réalisations** : grille 2 colonnes, couverture, type (Projet, Événement, Certificat), compétences en couleur.
- **Portfolio** : liste de fichiers et de liens (PDF, CV, lien public, page Jumanly).

## Vue recruteur (candidat)

Le recruteur ne voit le profil que si la personne a candidaté ou l'a rendu visible (règle d'or 5, consultation journalisée). À la place des actions de connexion, une carte : anneau du score, offre, date, étape, boutons **« Pourquoi 86 % ? »**, **« Avancer »**, Chat. « Pourquoi ? » ouvre une feuille avec les critères (compétences, expérience, lieu, langues) et la mention : calculé sans nom, photo, âge, genre ni nationalité ; aucune candidature écartée automatiquement (règles d'or 3 et 4). Menu recruteur, onglet Candidatures actif.

## Données

- `TalentProfile.socialLinks Json @default("{}")` : `{ linkedin?, instagram?, x?, facebook?, website? }` (URL validées par Zod) ; l'e-mail public est un choix de la personne (désactivé par défaut).
- `TalentProfile.handle String? @unique` pour l'alias (lettres, chiffres, point, 3 à 30 caractères).
- Drapeau : composant à partir du code ISO de `User.country`, sans image externe.
- Couleur d'une compétence : stable, tirée du nom de la compétence dans la palette ci-dessus (même compétence, même couleur partout).
- Points d'expérience : `Experience.description` existe déjà (une réalisation par ligne).

## Définition de fini

Conforme aux captures ; textes dans `textes/textes-application.md` ; WCAG 2.2 AA, cibles 44 px sauf icônes de réseaux (32 px, espacées) ; `prefers-reduced-motion` ; tests unitaires (couleur stable, liens sociaux) et e2e (ouvrir un profil, changer d'onglet, se connecter, « Pourquoi ? » côté recruteur) ; lint, types, tests, build ; `docs/journal.md`.
