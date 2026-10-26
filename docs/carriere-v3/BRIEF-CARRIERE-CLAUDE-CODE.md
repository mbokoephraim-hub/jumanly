# Brief · Carrière et création d'un CV

Validé par Ephraïm le 26/10/2026. Remplace la page Carrière du Modèle B (`docs/modele-b/maquette/Carriere*.dc.html`) et ses écrans CV (`Carriere-cv-*`). Mobile d'abord (390 px), même identité que le profil d'une personne (`docs/profil-personne/`), menu en pilule de `docs/fil-menu-publication/`.

Maquettes : `maquette/Carriere.dc.html` (réglages `onglet`, `replie`) et `maquette/Cv.dc.html` (réglage `etape`), plus les planches qui les utilisent. Captures : `captures/01` à `15`.

## Carrière (mon propre profil) · captures 01 à 05

Même en-tête que le profil d'une personne (bannière 4:1, photo 76 px à anneau de compétences, réseaux, nom, alias, drapeau, bio, pastilles), avec les différences de son propre espace :

1. Titre « Carrière » + Rechercher + Paramètres (pas de Retour).
2. Crayon sur la bannière, appareil photo sur la photo, rond « + » pour ajouter un réseau.
3. Disponibilité modifiable en un toucher (Disponible tout de suite · Ouverte aux offres · Pas disponible).
4. Carte « Profil complété 70 % » avec la prochaine suggestion d'Orbi et « Ajouter ».
5. Boutons Modifier (crème) · Partager · œil « Voir comme les autres ».
6. Onglets en segment, largeurs à la taille du texte : **Profil · CV · Portfolio · Progression · Candidatures**. Au défilement, l'en-tête se replie : mini-identité (avatar 36 px, nom, % du profil) + onglets collés en haut.

- **Profil** : compétences en couleur + « + Power BI » suggéré, barre des familles, expériences avec crayon et « + Ajouter un point », formation (étiquette « Jumanly » pour les attestations), langues.
- **CV** : carte Orbi « Adapter tel CV à telle offre ? », vignettes des CV (« Par défaut », score /100), bouton « + Nouveau CV » qui ouvre le parcours ci-dessous.
- **Portfolio** : grille 2 colonnes + tuile « Ajouter ».
- **Progression** : stade (Découverte → Construction → Prêt → Compétitif), 3 anneaux, 3 prochaines étapes.
- **Candidatures** : cartes avec score, frise Envoyée · Vue · Entretien · Réponse, note d'entretien.

## Créer un CV · captures 06 à 15

Plein écran, sans menu en pilule, bouton principal Lime collé en bas.

- **06 Départ** : trois choix, « Orbi le prépare » (le plus rapide, depuis le profil et le Cap), « Partir d'un modèle », « Importer mon CV ». Mention : le CV téléchargé ne porte ni logo ni couleur Jumanly.
- **4 étapes** avec une barre (Modèle · Contenu · Mise en forme · Aperçu), chaque segment cliquable :
  - **07 Modèle** : les **15 vrais modèles** de `docs/modeles-cv/` (vignettes réelles), filtres Tous · Gratuits · Starter · Pro, étiquette de niveau, cadenas « Avec Pro » selon le droit `career.cv.templates.access` (jamais de nom de forfait dans le code). Un toucher choisit, un second ouvre **08 Voir en grand** (photo, ATS) → « Utiliser ce modèle ».
  - **09 Contenu** : rempli depuis le profil ; résumé avec « Réécrire avec Orbi » ; sections activables et réordonnables (compétences en couleur, expériences avec leurs points) ; « + Section ».
  - **10 Mise en forme** : aperçu en direct, couleurs du catalogue (recommandées ATS en premier), police, densité, photo, langue des titres.
  - **11 Aperçu** : vrai rendu du CV, score Orbi /100 et vérifications (« Corriger » applique la suggestion, « Pourquoi ? »), nom du CV, « Utiliser par défaut », Word, Adapter à une offre, **Télécharger en PDF**.
- **12 Orbi le prépare** : progression lisible (profil lu, expériences rédigées, compétences classées, mise en page) → Contenu.
- **13 à 15 Importer** : choisir un PDF/Word (5 Mo) ou photographier un CV papier → Orbi lit → liste de ce qui a été trouvé, cases à décocher, « nouveau » / « déjà là » → « Ajouter à mon profil et créer le CV ». Rien n'entre dans le profil sans accord.

## Règles

- Rendu, pagination et PDF des modèles : réutiliser `docs/modeles-cv/` et `src/features/cv/templates/`, ne pas les réécrire.
- Orbi : consentement, droit et quota vérifiés, journalisé dans `AiUsage` (règle d'or 12) ; Orbi propose, la personne valide.
- Score du CV : déterministe, avec « Pourquoi ? ».

## Définition de fini

Conforme aux captures ; textes dans `textes/textes-application.md` ; WCAG 2.2 AA, cibles 44 px ; `prefers-reduced-motion` ; e2e : changer d'onglet, créer un CV depuis un modèle jusqu'au PDF, importer un CV ; lint, types, tests, build ; `docs/journal.md`.
