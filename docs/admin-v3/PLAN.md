# Jumanly Admin v3 · Studio formations et nouvelle identité visuelle

Date : 15 octobre 2026. Demande du propriétaire : peaufiner l'ajout des formations dans
l'administration (écrans, fonctionnalités, textes, PDF à joindre et PDF générés pour chaque
formation) et donner à **toute** l'administration l'identité visuelle du site : un menu fait
**seulement d'icônes**, posé dans une **colonne flottante arrondie en haut et en bas, en dégradé**,
qui ne couvre pas toute la hauteur de l'écran ; un ensemble visuellement attrayant, dans le même
univers que le site public.

Le travail est découpé en 7 étapes. Chaque étape est une PR, vérifiée puis fusionnée dès que la CI
est verte ; l'étape suivante démarre aussitôt (règle du propriétaire du 14 octobre 2026).

## 1. Point de départ (au 15 octobre 2026)

- Admin v2 terminé (`docs/admin-v2/PLAN-ADMIN.md`, PR #50 à #58) : 15 écrans sous `/admin`, kit
  partagé `src/components/admin/kit.tsx`, coque dans `src/app/admin/layout.tsx` (barre Nuit de
  256 px sur toute la hauteur, libellés à côté des icônes ; pilule flottante sur téléphone).
- Formations : liste à gauche + éditeur sur une seule longue page (`/admin/formations/[id]`),
  jauge « Prête à publier », couverture et vidéo envoyées depuis l'ordinateur, aperçu « comme un
  talent », duplication, statistiques. Les **supports** d'une leçon sont des lignes « titre | adresse »
  saisies à la main (`Lesson.resources`, JSON) : aucun PDF n'est réellement envoyé ni stocké.
- PDF existants : attestation (`src/server/pdf/certificate-document.tsx`), factures, rapports,
  documents Career (`@react-pdf/renderer`). Aucun PDF propre à une formation (programme, support…).
- Stockage de fichiers : `src/server/storage/index.ts` (pilote `database` par défaut, `fake` en
  test), déjà utilisé pour les pièces des organisations et les couvertures.
- Identité du site : jetons `src/styles/tokens.css` (`--jm-degrade-signature`, `--jm-degrade-ia`,
  `--jm-degrade-profondeur`, `--jm-orbe-ia`), effets `src/styles/motion.css`, trame de points,
  héros vert profond avec points, Lime pour l'action. Règle du 14 octobre : effets immersifs
  complets sur le site public, **touches douces** dans les espaces connectés (l'admin en fait
  partie) : dégradés, apparitions légères, pas de mouvement lourd.

## 2. Les étapes

| # | Étape | Ce que le propriétaire verra |
|---|---|---|
| 1 | Coque et identité | Le menu en colonne flottante d'icônes, arrondie et en dégradé ; un fond et des en-têtes de page aux couleurs du site ; un kit (cartes, chiffres, pastilles, boutons) plus attrayant |
| 2 | Habillage de tous les écrans | Les 15 écrans harmonisés : tableau de bord en dégradé, listes et fiches aérées, états vides illustrés, téléphone soigné |
| 3 | Studio formations : liste et création | Une galerie de formations avec couvertures et chiffres, et une page « Nouvelle formation » qui part d'un modèle |
| 4 | Éditeur par étapes | L'éditeur découpé en 7 étapes claires, le programme construit module par module (déplacer, éditer une leçon dans un panneau) |
| 5 | PDF à joindre | Envoyer de vrais fichiers PDF (support, exercices, lectures, modèles, corrigés) à une formation ou à une leçon, avec qui peut les télécharger |
| 6 | PDF générés | Pour chaque formation : programme, support de cours complet, quiz et corrigé, aperçu de l'attestation, bilan chiffré |
| 7 | Passe finale | Cohérence, accessibilité, parcours automatique de tous les écrans, guide admin mis à jour |

## 3. Règles communes (rappelées à la fin de chaque prompt)

> **Règles** : lire `CLAUDE.md`, `docs/specifications.md` (parties 05, 07 § 6, 10, 11) et la
> maquette de la page dans `docs/maquettes/07-jumanly-admin/` (la mise en page sert de base ; la
> nouvelle identité de ce plan l'emporte pour la coque, les couleurs et les effets). Textes
> uniquement dans `textes/textes-application.md` (partie 09, sous-partie de la page), puis
> `pnpm messages`. Aucun nom de forfait dans le code : droits via `can()` et `consume()`. Écriture
> dans l'ordre valider → session → rôle → droit → quota → service ; logique dans
> `src/server/services/`. Toute action sensible écrit dans `AuditLog`. `support_agent` voit sans
> modifier, `content_editor` ne voit que Formations et Contenus, seul `platform_admin` révoque une
> attestation. Aucun bouton sans effet, aucune donnée inventée. Accessibilité WCAG 2.2 AA (texte
> Sapin sur Lime, jamais blanc sur Lime ; chaque icône seule a un nom accessible ; focus visible) ;
> `prefers-reduced-motion` respecté. Fonctionne sans JavaScript partout où c'est possible (liens et
> formulaires). Avant de terminer : `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`
> (complet), `pnpm build`, e2e des écrans touchés ; captures 1440 et 390 px dans
> `/mnt/project-files/captures/admin-v3/etape-N/` ; entrée dans `docs/journal.md` ; écarts dans
> `docs/decisions/2026-MM-JJ-admin-v3-etape-N.md`. Une PR, fusionnée dès que la CI est verte, puis
> étape suivante.

## 4. Les prompts

### Étape 1 · Coque et identité visuelle

> Réalise l'étape 1 de `docs/admin-v3/PLAN.md` : la coque de Jumanly Admin et son kit visuel.
>
> 1. **Menu en icônes, colonne flottante** (écrans `lg` et plus, `src/app/admin/layout.tsx`) :
>    - la colonne fait 72 px de large, **sa hauteur suit son contenu** (elle ne descend pas jusqu'en
>      bas de l'écran), elle est posée à 16 px du bord gauche et centrée verticalement dans la
>      fenêtre (`position: sticky`), avec des **extrémités entièrement arrondies en haut et en bas**
>      (rayon = moitié de la largeur) ;
>    - fond en **dégradé** vertical aux couleurs du site : Sapin `#0f3f37` en haut, `#14745f` au
>      milieu, Émeraude `#2fd3a6` adouci en bas (nouveau jeton `--jm-degrade-rail` dans
>      `tokens.css`), fine trame de points blanche à 7 %, ombre flottante douce ;
>    - en haut, la tuile du logo ; ensuite **une icône par rubrique** (22 px, cible de 48 px), les
>      rubriques groupées par thème (pilotage, comptes, offre, contenus, contrôle) avec un petit
>      point séparateur ; en bas, l'icône « Retour à l'application » ;
>    - rubrique active : pastille ronde Lime, icône Sapin, petit trait lumineux à gauche ;
>      survol : halo blanc à 10 % ;
>    - **libellé en infobulle** à droite de l'icône au survol et au focus clavier (bulle Nuit, texte
>      blanc, flèche), sans JavaScript (CSS `:hover` / `:focus-visible`) ; le lien porte le libellé
>      en nom accessible (`aria-label`), l'infobulle est décorative ;
>    - si la fenêtre est trop basse, la colonne défile à l'intérieur (barre de défilement masquée)
>      sans jamais déborder.
> 2. **Fond et page** : le grand panneau Crème laisse place à un fond clair immersif (Crème avec
>    deux halos doux, Lime en haut à droite et Émeraude en bas à gauche, et la trame de points du
>    site qui s'efface vers le bas), sur toute la page ; le contenu commence à droite de la colonne
>    (marge de 16 px) et garde une largeur de lecture confortable (max. 1360 px).
> 3. **En-tête de page** (`AdminPageHeader`) : un bandeau arrondi (28 px) en dégradé
>    `--jm-degrade-profondeur` avec la trame de points et un halo Lime, comme le héros du site :
>    surtitre Lime en petites capitales, titre blanc, sous-titre blanc à 75 %, et à droite la
>    recherche (champ translucide) et la pastille du compte. Prop facultative `stats` pour afficher
>    2 à 4 chiffres en pastilles translucides dans le bandeau. Le badge « Actions journalisées »
>    reste, en version translucide.
> 4. **Kit v3** (`src/components/admin/kit.tsx` et classes partagées) : cartes blanches avec ombre
>    douce et liseré qui s'éclaire au survol ; tuiles d'icônes en dégradé signature ; chiffres clés
>    (`AdminStats`) en cartes avec icône, valeur en grand et petite courbe ou variation colorée ;
>    pastilles de statut homogènes ; boutons principaux Lime avec léger relief, boutons secondaires
>    contour Sapin ; apparition douce des cartes au chargement (classe existante de `motion.css`,
>    coupée en mouvement réduit). Rien ne change dans le contenu des pages.
> 5. **Téléphone** : en-tête en dégradé profondeur ; pilule flottante du bas en dégradé `rail`,
>    icônes seules, active en Lime ; le menu « plus » reprend la grille d'icônes avec libellés.
> 6. Textes nouveaux (noms des groupes de rubriques, infobulles si besoin) dans la partie 09.
>    Tests : e2e qui vérifie que chaque rubrique a un nom accessible et que la colonne ne fait pas
>    toute la hauteur de la fenêtre à 1440 × 900.
>
> [Règles communes]

### Étape 2 · Habillage de tous les écrans

> Réalise l'étape 2 de `docs/admin-v3/PLAN.md` : appliquer la nouvelle identité aux 15 écrans.
>
> 1. **Tableau de bord** `/admin` : chiffres du bandeau (comptes actifs, revenus de la période,
>    éléments à traiter), graphiques en barres et courbes au dégradé signature, file « Ce qui demande
>    votre attention » en cartes avec tuile d'icône colorée par type, ancienneté et bouton.
> 2. **Listes** (utilisateurs, organisations, forfaits, abonnements, offres, signalements, journal,
>    partenaires, recherche) : barre de filtres en pilules translucides, tableaux aérés avec en-tête
>    collant, lignes survolées, pastilles homogènes ; sur téléphone, chaque ligne devient une carte.
> 3. **Fiches** (utilisateur, organisation, forfait, abonnement, formation) : en-tête de fiche avec
>    avatar ou tuile en dégradé, chiffres en pastilles, encadrés sensibles (`SensitivePanel`)
>    distingués par un liseré Corail, historique en frise.
> 4. **États vides** illustrés avec un personnage de `ressources/` (déjà servi par `pnpm brand`),
>    une phrase et l'action utile. **Confirmations** (`AdminDone`) en carte avec coche animée douce.
> 5. Contrôle visuel 1440 et 390 px de chaque écran, contraste AA vérifié (axe dans l'e2e).
>
> [Règles communes]

### Étape 3 · Studio formations : liste et création

> Réalise l'étape 3 de `docs/admin-v3/PLAN.md` : `/admin/formations` devient le Studio formations.
>
> 1. **Galerie** : chaque formation est une carte avec sa couverture (ou, sans image, une couverture
>    générée : dégradé selon le thème, icône Learn et titre), son statut (Brouillon, Publiée,
>    Archivée), son niveau de catalogue requis, sa durée, le nombre de modules et leçons, et ses
>    chiffres (inscrits, taux d'achèvement, note moyenne au quiz, attestations délivrées) ; un
>    anneau « prête à publier » pour les brouillons. Bascule « Galerie / Liste » (lien, `?vue=`).
>    Filtres existants (statut, thème, niveau, recherche) conservés. Chiffres d'ensemble dans le
>    bandeau : formations publiées, brouillons, inscrits sur 30 jours, attestations sur 30 jours.
> 2. **Nouvelle formation** : page `/admin/formations/nouvelle` (au lieu du simple champ titre).
>    Le formulaire demande le titre, le thème, le niveau, la langue, le niveau de catalogue requis
>    et un **modèle de départ** présenté en cartes illustrées :
>    - « Formation courte » : 1 module, 3 leçons (vidéo, texte, quiz de fin) ;
>    - « Parcours certifiant » : 3 modules de 2 leçons, quiz à la fin de chaque module, quiz final,
>      attestation activée ;
>    - « Atelier pratique » : 1 module avec une leçon vidéo et deux exercices ;
>    - « Partir de zéro » : aucune structure.
>    Les titres des modules et leçons créés sont des textes de `textes/` (« Module 1 », « Leçon
>    d'introduction »…), à renommer ensuite ; aucun contenu inventé. Un service
>    `createCourseFromTemplate` (testé en base) crée la formation en brouillon puis ouvre l'éditeur.
>    « Dupliquer une formation existante » reste proposé sur la même page.
> 3. Droits : `content_editor` et `platform_admin` créent ; `support_agent` voit la galerie sans le
>    bouton. Chaque création est journalisée.
>
> [Règles communes]

### Étape 4 · Éditeur par étapes

> Réalise l'étape 4 de `docs/admin-v3/PLAN.md` : l'éditeur `/admin/formations/[id]`.
>
> 1. **Étapes** (`?etape=`) au lieu d'une seule longue page, dans une colonne d'étapes à gauche
>    (pastilles numérotées, coche verte quand l'étape est complète, point Corail s'il manque
>    quelque chose) : 1 Informations (titre, adresse, résumé, thème, niveau, langue, formateur,
>    couverture) · 2 Public et objectifs (public visé, prérequis, objectifs, niveau de catalogue,
>    compétences validées, métiers des exercices) · 3 Programme · 4 Documents (étape 5 du plan ;
>    d'ici là, les supports actuels) · 5 Quiz · 6 Attestation · 7 Publication. Boutons « Étape
>    précédente » et « Enregistrer et continuer ».
> 2. **Colonne de droite collante** : anneau « prête à publier », liste de ce qui manque (chaque
>    élément mène à son étape), actions (aperçu comme un talent, dupliquer, voir la page publique).
> 3. **Programme** : modules en cartes repliables, leçons en lignes avec icône de type, durée,
>    pastilles (aperçu public, exercice métier, vidéo prête ou en encodage, nombre de documents) ;
>    **monter / descendre** un module ou une leçon (boutons, sans glisser-déposer obligatoire) ;
>    l'édition d'une leçon s'ouvre dans un panneau latéral (`?lecon=`) : titre, type, vidéo, texte,
>    transcription, aperçu public, exercice métier. Totaux en tête (modules, leçons, durée).
> 4. **Quiz** : vue d'ensemble de tous les quiz de la formation (questions, seuil, tentatives) et
>    éditeur de question plus lisible (bonnes réponses en vert, explication).
> 5. **Publication** : récapitulatif de la fiche telle qu'elle apparaîtra dans le catalogue, liste
>    de contrôle, choix du statut avec motif journalisé.
> 6. Aucune règle métier ne change : mêmes contrôles avant publication (`publishProblems`), mêmes
>    droits. Tests e2e : créer depuis un modèle, compléter chaque étape, publier.
>
> [Règles communes]

### Étape 5 · PDF à joindre

> Réalise l'étape 5 de `docs/admin-v3/PLAN.md` : de vrais fichiers PDF joints aux formations.
>
> 1. **Modèle** `CourseDocument` (migration nommée) : formation, leçon facultative, titre, type
>    (`support` support de cours, `exercises` fiche d'exercices, `reading` lecture
>    complémentaire, `template` modèle à remplir, `answer_key` corrigé, `other` autre),
>    **visibilité** (`public` visible sur la fiche publique, `enrolled` inscrits seulement, `team`
>    équipe Jumanly seulement — un corrigé est toujours `team`), `specialized` (réservé aux comptes
>    qui ont le droit `learn.resources.specialized`), clé de stockage, taille, nombre de pages (lu
>    avec `pdf-lib`), ordre, téléchargements, auteur, dates.
> 2. **Envoi** dans l'étape « Documents » de l'éditeur et dans le panneau d'une leçon : PDF
>    seulement, reconnu par ses premiers octets (`sniffDocumentType`), 10 Mo au plus, fichier
>    illisible ou chiffré refusé avec un message clair ; remplacer, renommer, changer la visibilité,
>    réordonner, supprimer (journalisé). Les liens externes saisis aujourd'hui restent possibles
>    (type « lien »), affichés à part.
> 3. **Téléchargement** par une route qui vérifie, dans l'ordre : document `public` ou leçon en
>    aperçu → tout le monde ; `enrolled` → talent inscrit et formation accessible à son niveau
>    (`learn.catalog.level`) ; `specialized` → `can(subject, "learn.resources.specialized")` ;
>    `team` → rôles admin. Nom de fichier propre, en-têtes `Content-Disposition`, compteur de
>    téléchargements. Rien n'est servi par `/medias/` (préfixe privé).
> 4. **Côté talent** : l'onglet « Supports » du lecteur et la fiche formation listent les documents
>    autorisés (titre, type, nombre de pages, taille) ; la fiche publique montre les documents
>    `public`.
> 5. Tests en base pour chaque règle d'accès (inscrit, non inscrit, niveau insuffisant, sans droit
>    spécialisé, équipe), e2e envoi puis téléchargement.
>
> [Règles communes]

### Étape 6 · PDF générés pour chaque formation

> Réalise l'étape 6 de `docs/admin-v3/PLAN.md` : les PDF que Jumanly fabrique pour chaque formation,
> avec `@react-pdf/renderer` et un gabarit commun aux couleurs du site
> (`src/server/pdf/course-kit.tsx` : bandeau en dégradé profondeur, logo, pied de page avec
> l'adresse jumanly.io et les e-mails de contact, jamais de téléphone ; tous les textes traduits).
>
> 1. **Programme de la formation** (public) : titre, résumé, public, prérequis, objectifs, niveau,
>    durée, modules et leçons avec durées, compétences validées, attestation oui/non, adresse de la
>    fiche. Bouton « Télécharger le programme » sur `/formations/[slug]`, `/app/learn/[slug]` et
>    dans l'éditeur.
> 2. **Support de cours complet** (inscrits, formation accessible) : toutes les leçons texte
>    module par module, la transcription des vidéos quand elle existe, la liste des documents
>    joints autorisés ; pour lire hors connexion sur réseau lent.
> 3. **Quiz et corrigé** (équipe seulement) : questions, choix, bonnes réponses, explications,
>    seuil de réussite et nombre de tentatives.
> 4. **Aperçu de l'attestation** (équipe) : l'attestation réelle avec un nom d'exemple et la
>    mention « Aperçu » en filigrane, pour vérifier la mise en page avant publication.
> 5. **Bilan de la formation** (équipe) : inscrits, achèvement, abandons par module, note moyenne
>    par quiz, attestations délivrées et révoquées, sur une période ; **aucun nom** de talent.
> 6. Un encart « PDF de la formation » dans l'éditeur (étape Publication et colonne de droite)
>    regroupe les liens. Chaque PDF est généré à la demande, mis en cache tant que la formation
>    n'a pas changé (`updatedAt`), et son téléchargement par l'équipe est journalisé. Tests : chaque
>    PDF se génère sur une formation de démonstration, texte vérifié (pdf-lib ou `pdftotext`), et
>    droits vérifiés route par route.
>
> [Règles communes]

### Étape 7 · Passe finale

> Réalise l'étape 7 de `docs/admin-v3/PLAN.md`.
>
> 1. Parcours automatique (`tests/e2e/admin-pass.spec.ts`) étendu au Studio formations, aux
>    documents et aux PDF, avec les trois rôles.
> 2. Cohérence visuelle des 15 écrans et du Studio à 1440, 1024 et 390 px ; mouvement réduit ;
>    clavier seul (ordre de tabulation, infobulles du menu au focus).
> 3. `docs/guide-admin.md` : section « Créer une formation de A à Z » (modèle, étapes, documents,
>    PDF, publication) et description du nouveau menu.
> 4. Bilan dans `docs/journal.md` et liste des écarts restants.
>
> [Règles communes]
