# Expérience mobile Talent · prompt amélioré pour Claude Code

Version améliorée du cahier des charges du propriétaire (`CAHIER-DES-CHARGES-UX-MOBILE.md`, qui reste la
référence d’intention), complétée le 16 octobre 2026 avec ce que l’on sait du projet et ses retours sur la
première série de maquettes. En cas de doute entre les deux textes, celui-ci précise, il ne contredit pas.

## 1. Mission

Réorganiser l’expérience **mobile** de l’espace Talent (`/app`, Next.js App Router) pour que l’utilisateur
trouve tout de suite ses offres, ses formations et ses actions utiles, et non un tableau de statistiques.
On réorganise la navigation, la hiérarchie et les interactions ; **on ne reconstruit pas** Learn, Jobs,
Career ou Connect, et on ne change pas l’identité visuelle.

Références obligatoires, dans cet ordre :

1. `docs/ux-mobile-talent/maquette/mobile-talent.html` et `maquette/ecrans/01.jpg` à `56.jpg` : les 56 écrans
   à reproduire fidèlement, plus les planches « Boutons », « Cartes » et « États d’interaction ». Les écrans 34 à 49
   (menu du haut, Jumanly AI, simulations) sont détaillés dans `docs/jumanly-ai/`.
2. `docs/ux-mobile-talent/BRIEF-MOBILE-TALENT.md` : routes, choix par défaut, données existantes.
3. `CLAUDE.md` (règles d’or), `docs/specifications.md` parties 05, 07, 08 et 11.
4. Briefs déjà livrés, à respecter : `docs/interactions-relief/` (ombres douces v2.1), `docs/experience-animee/`
   (`motion.css`, animations réduites), `docs/refonte-career/` (Career v2, éditeur de CV v2),
   `docs/modeles-cv/` (15 modèles, rendu PDF), `docs/learn-v2/PLAN.md` (Learning Room, progression).

## 2. Identité (ne pas changer)

Sora ; Vert Sapin `#0F3F37`, Lime `#A6F26B`, Crème `#F2EDE5` ; fond Crème sans bande verte en haut (v6), thème Vert
immersif au choix ; cartes blanches à ombre douce (rayon 24), pas de relief ; texte Sapin sur Lime, jamais blanc ;
icônes de `ressources/icones` (nouvelles : « Suivi », presse-papiers avec liste, et « Retour », même trait) ;
personnages et Orbi existants.

**Gamme de boutons (planche « Boutons », version 3).** Un seul composant `<Button variant size>` :
- `principal` : dégradé Sapin → Émeraude (`--g-principal`), texte blanc, rond Lime avec flèche à droite pour
  les actions qui avancent (Postuler, Envoyer, Section suivante). Une seule par écran.
- `accent` : dégradé Lime (`--g-accent`), texte Sapin. Pour une offre ou un passage de formule.
- `secondaire` (blanc, ombre douce), `contour`, `lien`, `icone` (rond 44 px), `danger` (texte rouge) et
  `danger-plein` (seulement dans une confirmation de suppression).
- Tailles L (56 px, barres d’action), M (48 px), S (36 px, puces et cartes).
- États : repos, appui (échelle 0,97, dégradé assombri), en cours (indicateur, désactivé), fait (coche,
  après réponse du serveur), désactivé (opacité 0,45, jamais le seul indice).

**L’IA a sa propre identité**, jamais prêtée à un bouton ordinaire : fond nuit aurore (`--g-aurore`), contour
irisé (`--g-irise`), orbe Lime avec étincelle, marque « Jumanly » + pastille « AI ». Composants `AiChip`
(puce dans les pages), `AiFab` (bouton flottant), `AiPanel`. Les jetons sont dans `source/style3.css` de la
maquette ; les reporter dans les jetons CSS du projet, sans nouvelle couleur.

**Cartes et sobriété (v5)** : planche « Cartes » et `BRIEF-MOBILE-TALENT.md` § 5. Une carte = un titre et une
ligne au plus, avec une scène visuelle ; objectif en `GoalCard` ; messages en cartes (fichier, créneau,
décision à l’en-tête de l’entreprise).

## 3. Navigation (version 6, voir `CAHIER-DES-CHARGES-V6.md`)

- **Barre du bas, 5 onglets** : Offres (`/app/jobs`), Apprendre (`/app/learn`), **Pour moi** (`/app`, au
  centre, rond surélevé, onglet principal), Suivi (`/app/suivi`), Compte (`/app/compte`, avatar). Actif en
  pastille Lime, texte Sapin ; zones de 56 px ; pastille de Suivi réelle. Masquée sur les écrans qui ont
  une barre d’action fixe en bas.
- **En-tête sans bande verte** : Menu + logo ou titre ; Rechercher, +, Notifications, Messages.
- **Menu du haut** (bouton Menu) : Jumanly AI, Mes CV, Tableau de bord, Mes candidatures, Simulations
  d’entretien, Attestations, « Tout Mon espace ». Fermeture au toucher dehors, Échap, focus piégé.
- **Bouton +** : feuille « Créer » (écran 60). **Retour** en tête de toute page qui n’est pas un onglet.
- **Compte** : une page de blocs (écrans 61-62). **Thèmes Clair et Vert** au choix dans Compte.
- **Bouton flottant Jumanly AI** au-dessus de la barre du bas (écran 35).
- Chaque onglet garde son état. Retour ramène à l’écran précédent, jamais à l’accueil par surprise.
- Espaces Hire et Partenaire : inchangés, sauf la bannière d’organisation (écran 66).

## 4. Écrans et comportements

**Première connexion (01-02)** : une seule question obligatoire, l’objectif (emploi, compétences,
évolution), rangée dans `TalentProfile.goal` via `homeFocus()` ; précisions facultatives ; « Plus tard »
possible. Les informations manquantes sont demandées quand elles servent.

**Pour moi (03-05)** : ordre des sections selon l’objectif, exactement comme le cahier des charges § 6.
Offres de `recommendedJobs` ou, sans préférences, offres récentes ouvertes marquées « non personnalisée ».
Jamais d’offre clôturée, jamais deux fois la même offre, aucun score inventé.

**Offres (06-08, 31)** : recherche, filtres en puces + feuille de filtres, onglets Pour vous / Récentes /
Enregistrées, cartes courtes (poste, entreprise, lieu, contrat, date, enregistrer, « Candidature
envoyée »). Détail : sections repliables, Enregistrer + Postuler fixes, « Adapter mon CV à cette offre » si
un CV existe.

**Candidature (09-12)** : étapes CV, lettre, questions (sautée s’il n’y en a pas), vérification, envoi,
confirmation, sur `/app/jobs/[slug]?postuler=1&etape=…`. La **vérification (10)** montre ce que le
recruteur recevra, bloc par bloc (CV avec miniature, lettre, profil partagé, contact), chaque bloc marqué
« Vérifié » et muni d’un bouton « Modifier » qui ouvre son étape et revient ici sans rien perdre.
Brouillon enregistré côté serveur à chaque étape et affiché (« Brouillon enregistré à 20 h 14 »).
« Candidature envoyée » seulement après la réponse du serveur ; sinon l’écran 12. Candidater reste gratuit.

**Apprendre (13, 32, 33, 14)** : formation en cours et Reprendre d’abord ; catalogue (recherche, domaines
Learn v2, niveau, filtres simples, cadenas + nom de formule via `talentPlanFor` si payant) ; fiche
formation (objectifs, modules, prérequis, évaluation, attestation, Commencer/Reprendre fixe) ; Learning
Room en onglets (Learn v2 étapes 3-4).

**Suivi (15, 16, 20-24)** :
- Filtres Tout / Candidatures / Entretiens / Messages / À reprendre ; urgent d’abord ; états vides utiles.
- **Confirmer un entretien (20)** : feuille du bas avec qui, mode, durée, puis les créneaux proposés
  (`Interview.slots`, 1 à 3) en choix ; le bouton reprend le créneau choisi ; statut `confirmed`.
- **Proposer un autre moment (21)** : jours et heures, jusqu’à 3 propositions (`Interview.proposedSlots`,
  statut `reschedule`), mot facultatif ; le recruteur est notifié.
- **Après confirmation (22)** : toast après la réponse du serveur, « Rejoindre » actif 10 min avant,
  « Ajouter à mon agenda » (.ics) ; une proposition en attente reste modifiable.
- **Messages (23-24)** : liste des conversations (« Réponse attendue »), conversation en bulles,
  événements (entretien proposé), demande de document (`MessageKind` document_request) avec bouton
  Envoyer, zone d’écriture fixe (joindre, écrire, envoyer), réponses rapides. Réutiliser Connect.

**Mon espace (17)** : carte profil (photo, titre, formule, progression réelle de `completeness` et ce qui
manque) ; raccourcis Tableau de bord (ancien `/app`, déplacé à `/app/tableau-de-bord`) et Abonnement ;
Profil professionnel en **lignes cliquables** ; Outils carrière en **tuiles** (CV Builder, Mes CV,
Lettres et documents, LinkedIn, Coach carrière, Simulations) avec cadenas si verrouillé ; Acquis ; Mon
compte ; Se déconnecter. Les outils Career restent aussi accessibles là où ils servent (offre, candidature).

**Profil (25-26)** : changer la photo (prendre, choisir, retirer, recadrage rond ; rappel : la photo n’entre
jamais dans le matching), titre, bio avec compteur et « M’aider à l’écrire », liste « Construire mon
profil » (fait / à faire avec Ajouter), sections Expériences, Formation, Langues, Préférences.
Enregistrement visible.

**CV (27-29)** : créer à partir du profil (recommandé), importer (`cv-import`) ou page vierge ; éditeur
une section à la fois avec rail de sections cochées, suggestions de l’assistant en place ; mise en forme
avec aperçu A4 réel, modèles (verrous selon `career.cv.templates.access`), couleur, police, densité ;
Télécharger le PDF. Le CV exporté ne porte ni logo ni mention Jumanly. Réutiliser `docs/modeles-cv` et
BRIEF-CV-V2, ne pas réécrire le rendu.

**Assistant IA (30-31, et 34 à 43 pour Jumanly AI, voir `docs/jumanly-ai/`)** : on lui écrit ; il propose des **modifications concrètes** (CV, profil, lettre,
filtres de recherche) en avant / après, appliquées **seulement si l’utilisateur touche Appliquer**, chacune
avec « Pourquoi ? » (règle d’or 3). L’utilisateur choisit ce que l’assistant voit (CV, recherches,
candidatures). L’assistant n’invente aucun chiffre : il laisse des valeurs à remplir entre crochets.
Chaque appel vérifie consentement, droit et quota, est journalisé dans `AiUsage` ; crédits restants
affichés. Réutiliser `cv-coach` (suggestions et `decideSuggestion`) et `learn-coach`. Entrées : Mon
espace (Coach carrière), éditeur de CV, bio, Offres (« peu de résultats »), détail d’offre.

**Recherche et notifications (18-19)** : résultats groupés Offres / Formations ; recherches récentes
seulement avec le consentement « préférences » ; notifications Important (recruteur, entretien,
candidature) puis Pour vous puis Jumanly ; préférences de notification.

## 5. États d’interaction (exigence du propriétaire)

« Ce qui se clique doit se voir, et on doit voir que ça a cliqué. » Planche « États d’interaction » :

- **Repos** : fond blanc, ombre douce, flèche dans un rond à droite (ou en bas à droite d’une tuile),
  hauteur ≥ 56 px.
- **Appui** (`:active` + `data-pressed` au toucher) : fond Lime clair, contour Lime 2 px, échelle 0,98,
  flèche passée en Sapin, 120 ms. Avec animations réduites : couleur seulement.
- **Ouverture** : si la navigation dépasse 300 ms, l’élément garde son état et la flèche devient un
  indicateur de chargement (`useLinkStatus` ou transition).
- **Boutons d’action** : repos, appui, en cours (« Envoi… », désactivé), fait (seulement après réponse
  du serveur). Enregistrer une offre : icône remplie Lime + toast « Offre enregistrée · Annuler ».
- **Retour** : la dernière ligne ouverte reste repérée un instant.
- Un seul composant `Pressable` (ou une classe utilitaire) pour tout l’espace Talent, pas de variantes
  par page.

## 6. Réseau lent, données, accessibilité, mesure

- Chargement progressif (squelettes), images optimisées, brouillons serveur, reprise après coupure,
  erreurs réseau compréhensibles, aucune action affichée réussie sans confirmation du serveur.
- Aucun texte en dur (`textes/textes-application.md` puis `pnpm messages`), aucune donnée inventée,
  aucun numéro de téléphone.
- WCAG 2.2 AA, libellés sur toutes les icônes, taille de texte de l’utilisateur respectée, sous-titres.
- `track(event, props)` unique, derrière le consentement « analytics », sans contenu de CV, message ou
  document ; branché sur un fournisseur seulement quand le propriétaire en choisit un.

## 7. Manière de travailler

1. **Première réponse : diagnostic et plan, sans code.** Routes et composants concernés (AppShell,
   IconRail, AccountMenu, SectionNav, `config/navigation.ts`), droits et espaces à préserver, services
   réutilisés, données manquantes (questions du recruteur, offres externes, brouillons de candidature,
   analytics) et ta proposition, fichiers par phase, écarts au brief avec leur raison. Attendre la
   validation.
2. Phases : (1) barres du bas et du haut, Mon espace, états d’interaction, tableau de bord déplacé ;
   (2) objectif et Pour moi ; (3) Offres, candidature, Apprendre, Suivi, entretiens, messages ;
   (4) profil, CV mobile, assistant IA, recherche, notifications, `track()`, optimisations.
3. Chaque phase : 360, 390, 430 px et ordinateur ; `pnpm lint`, `typecheck`, `test`, `build`, e2e du
   parcours (et `test:e2e:reduced`) ; `docs/journal.md` ; une note dans `docs/decisions/` pour tout écart.
4. Ne supprimer aucune route sans redirection ; ne rien recréer qui existe.
