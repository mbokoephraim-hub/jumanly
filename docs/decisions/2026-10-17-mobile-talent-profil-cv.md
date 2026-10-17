# Mobile Talent · Profil, CV, recherche, notifications, mesure (prompt 6)

Date : 17 octobre 2026.

## Décision

- **Photo de profil à adresse secrète.** Nouvelle table `ProfilePhoto` (octets, type, jeton
  aléatoire de 18 octets). `User.image` devient `/api/photo/{jeton}` : l'avatar, l'aperçu du CV et
  le PDF (rendu par Chromium sans session) la lisent sans connexion, mais personne ne peut deviner
  l'adresse. Chaque nouvelle photo change le jeton ; « Retirer la photo » efface la ligne et
  l'ancienne adresse répond 404. Le type est lu dans les premiers octets (JPEG, PNG, WebP), 1 Mo au
  plus. La photo reste exclue du matching (règle d'or 4). Migration additive
  `20261017052929_profile_photos` ; retour arrière :
  `docs/ux-mobile-talent/retour-arriere/prompt-6-photos.sql`.
- **Recadrage dans le navigateur.** Glisser (ou flèches du clavier) et curseur de zoom, puis un
  carré JPEG de 512 px est envoyé : quelques dizaines de Ko au lieu des Mo d'une photo de
  téléphone (réseau lent). Sans JavaScript, le fichier choisi part tel quel.
- **Bio : 1 000 caractères, pas 600.** La maquette 25 affiche « / 600 ». La limite existante
  (`PROFILE_SUMMARY_MAX`, utilisée par le formulaire d'ordinateur et la validation) est gardée pour
  ne pas tronquer des résumés déjà saisis.
- **« Voir mon profil public » devient « Voir mon profil côté recruteur ».** Il n'existe pas de page
  de profil publique ; le bouton ouvre l'aperçu recruteur et la visibilité.
- **Une partie à la fois sur téléphone.** `/app/profil?partie=…` et `/app/career/cv/[id]?partie=…`
  ouvrent une seule section, avec la flèche de retour. Après un enregistrement, la partie reste
  ouverte. L'ordinateur garde toutes les sections sur une page.
- **Le contenu du CV vient du profil.** L'éditeur mobile montre les postes, diplômes, compétences
  et langues du CV, avec « Modifier dans mon profil » et « Mettre à jour depuis mon profil »,
  comme l'éditeur d'ordinateur. La suggestion « Jumanly AI » de l'écran 28 arrive avec le
  prompt 8 ; le coach CV existant est dans « Aperçu ».
- **Créer un CV : « Importer un CV existant ».** L'import actuel lit un texte collé, pas un PDF ni un
  Word : le sous-titre dit « Collez le texte de votre CV » et l'option mène à l'import du profil.
  « Page vierge » garde seulement le nom et le contact du compte.
- **PDF.** Le bouton montre « PDF… » pendant la préparation, puis le toast « CV téléchargé · sans
  mention Jumanly ». « Partager » passe le fichier à la feuille de partage du téléphone quand elle
  existe, sinon il le télécharge. Le rendu du CV (`docs/modeles-cv`) n'est pas modifié.
- **Mesure.** `track(event, props)` (`src/lib/track.ts`) : liste fermée d'événements, rien sans le
  consentement « analytics », clés pouvant porter un contenu privé retirées. Aucun fournisseur n'est
  branché : le propriétaire en choisira un (`setTrackSink`).

## Pourquoi

Les maquettes 18, 19, 25 à 29 et 56 font foi pour la mise en forme ; les règles d'or, les limites
existantes et les données réelles l'emportent sur le contenu d'exemple des maquettes.
