# Expérience mobile Talent · brief d’intégration

Date : 16 octobre 2026. Demande du propriétaire : `CAHIER-DES-CHARGES-UX-MOBILE.md` (ce dossier), qui fait foi.
Ce brief ajoute ce qu’il faut pour l’intégrer au code existant : les maquettes, les choix par défaut,
les liens avec les autres briefs. Maquettes validées par Claude (validation déléguée par le propriétaire).

## 0. Maquettes

`maquette/mobile-talent.html` (ouvrir dans un navigateur), `maquette/mobile-talent-planche.jpg`
(toutes les maquettes) et `maquette/ecrans/NN.jpg` (chaque écran, 390 px ×2). Version 3 du 16 octobre
2026 : v2 (10 et 17 refaits, 20 à 33, planche « États d’interaction »), puis v3 (planche « Boutons » avec
boutons principaux en dégradé, appliqués partout ; menu du haut 34 ; Jumanly AI 35 à 43 ; v4 : toucher l’orbe 44 et simulations d’entretien 45 à 49 ; v5 : planche « Cartes », objectif en carte, moins de texte, messages et décisions 50 à 56, voir
`docs/jumanly-ai/`). La persona est en formule Starter, car Free n’a pas de crédit IA aujourd’hui. Le prompt complet est `PROMPT-AMELIORE.md`.

| N° | Écran | N° | Écran |
|---|---|---|---|
| 01 | Première connexion · objectif | 18 | Recherche |
| 02 | Première connexion · précisions | 19 | Notifications |
| 03 | Pour moi · emploi | 20 | Entretien · confirmer un créneau |
| 04 | Pour moi · compétences | 21 | Entretien · proposer un autre moment |
| 05 | Pour moi · évolution | 22 | Entretien confirmé |
| 06 | Offres | 23 | Messages · conversations |
| 07 | Offres · filtres | 24 | Conversation et écriture |
| 08 | Détail d’une offre | 25 | Mon profil · photo, bio, construction |
| 09 | Candidature · CV | 26 | Changer la photo |
| 10 | Candidature · vérification | 27 | Mes CV · créer un CV |
| 11 | Candidature · confirmation | 28 | Éditeur de CV · contenu et suggestion IA |
| 12 | Candidature · erreur réseau | 29 | Éditeur de CV · mise en forme |
| 13 | Apprendre | 30 | Assistant IA · conversation |
| 14 | Learning Room | 31 | Assistant IA dans Offres |
| 15 | Suivi | 32 | Catalogue des formations |
| 16 | Suivi · état vide | 33 | Fiche formation |
| 17 | Mon espace | 34 | Menu du haut |
| 35 | Bouton flottant Jumanly AI | 36 | Jumanly AI · offre |
| 37 | Jumanly AI · exigences et profil | 38 | Jumanly AI · CV Builder |
| 39 | Jumanly AI · Learning Room | 40 | Jumanly AI · relance (Suivi) |
| 41 | Jumanly AI · historique et crédits | 42 | Jumanly AI · crédits épuisés |
| 43 | Jumanly AI · ordinateur, Hire | 44 | Jumanly AI · toucher l’orbe |
| 45 | Simulation d’entretien · choix | 46 | Simulation écrite · retour |
| 47 | Test de connaissances | 48 | Simulation orale en direct |
| 49 | Simulation · bilan | 50 | Messages · options du + |
| 51 | Messages · pièces en cartes | 52 | Refus reçu |
| 53 | Candidature retenue | 54 | Recruteur · modèles de message |
| 55 | Recruteur · refus relu avant envoi | 56 | Mes CV · télécharger |

Les contenus sont des exemples (persona fictive Grâce Mbuyi, entreprises fictives). **En production, tout
vient des données réelles** (règle d’or 11) ; une section sans donnée affiche son état vide ou se masque.

## 1. Ce qui ne change pas

- L’identité : Sora, Vert Sapin, Lime, Crème, en-tête Sapin et feuille Crème sur mobile, ombres douces des
  cadres de `docs/interactions-relief/` (v2.1). Pas de relief, pas de nouveau style.
- Les modules Learn, Jobs, Career, Connect, leurs services (`src/server/services/`) et leurs routes. On
  réorganise l’accès, on ne réécrit pas les modules.
- Les droits (`can()`, clés de droits, aucun nom de forfait), le matching déterministe (partie 08), les
  espaces Hire et Partenaire (leur navigation mobile actuelle reste telle quelle : ce module ne concerne
  que l’espace Talent).
- Les textes passent par `textes/textes-application.md` puis `pnpm messages`.

## 2. Choix par défaut (le propriétaire peut les changer)

1. **Objectif principal sans migration.** `TalentProfile.goal` garde ses 6 valeurs (`src/lib/welcome.ts`).
   Une fonction `homeFocus(goal)` les range en trois accueils : `job` ← firstJob, newJob, freelance ;
   `skills` ← skills, reconversion ; `career` ← promotion. `goal` vide → `job`, non personnalisé.
   L’écran 01 enregistre newJob, skills ou promotion ; le choix fin à 6 valeurs reste dans les préférences
   du profil, où l’objectif se modifie.
2. **Routes.** `/app` devient « Pour moi » pour le Talent (mobile et ordinateur). Le tableau de bord actuel
   déménage tel quel à `/app/tableau-de-bord`, lien dans Mon espace. « Offres » = `/app/jobs`,
   « Apprendre » = `/app/learn` (mêmes routes, nouveaux libellés). « Suivi » = nouvelle page `/app/suivi`
   qui rassemble les données existantes (candidatures, entretiens `Interview`, conversations, brouillons) ;
   `/app/jobs/candidatures` et `/app/messages` restent et y renvoient. « Mon espace » = `/app/espace` sur
   téléphone (une page, donc Retour fonctionne) ; sur ordinateur, le menu de compte actuel prend les mêmes
   groupes.
3. **Ordinateur.** Le rail reprend Pour moi, Offres, Apprendre, Suivi, puis Career (la place le permet).
   Rien d’autre ne change sur ordinateur ; aucune régression des écrans existants.
4. **Barre du bas.** Remplace la pilule flottante du Talent : 4 destinations, icône + libellé, actif sur
   Lime, fond Sapin avec le dégradé du rail, posée à 12 px des bords au-dessus de la zone de sécurité
   (`env(safe-area-inset-bottom)`). Pastille sur Suivi = nombre réel d’actions à traiter. Masquée sur le
   détail d’offre, la candidature, la Learning Room et Mon espace, qui ont leur barre d’action fixe.
   Icônes : `accueil`, `jobs`, `diplome` ; « Suivi » demande une icône presse-papiers avec liste, au même
   trait que la marque : à ajouter au jeu d’icônes (dessin dans la maquette, symbole `jm-suivi`).
5. **Barre du haut** compacte (52 px) : logo sur Pour moi, titre de la section ailleurs ; Recherche,
   Notifications, avatar qui ouvre le menu du haut (écran 34), dont « Tout Mon espace » mène à la page. Le sélecteur d’espace (Hire, Partenaire) passe en tête de Mon
   espace. Les sous-onglets de section (`SectionNav`) ne s’affichent plus sur Pour moi, Offres et Suivi.
6. **Candidature en étapes** sur la route actuelle (`/app/jobs/[slug]?postuler=1&etape=…`) : CV, lettre,
   questions, vérification, envoi, confirmation. Le modèle n’a aujourd’hui ni questions du recruteur ni
   offre externe : l’étape « Questions » est sautée quand l’offre n’en a pas, et la mention « Sur le site
   de l’employeur » n’apparaît que si une offre externe existe. Ne pas créer ces deux fonctions dans ce
   module ; les signaler dans le diagnostic. Brouillon enregistré côté serveur à chaque étape (nouvelle
   table de brouillon si nécessaire) et repris depuis Pour moi et Suivi. « Candidature envoyée »
   s’affiche seulement après la réponse du serveur (écran 12 sinon).
7. **Personnalisation** : les offres « Pour vous » viennent de `recommendedJobs` (matching existant) ou,
   sans préférences, des offres récentes ouvertes, étiquetées « Sélection générale · non personnalisée »
   avec l’action pour compléter. Pas de nouveau score, pas d’offre clôturée, pas la même offre deux fois
   dans la page. Les compétences « à renforcer » (écran 05) viennent des offres consultées ou enregistrées
   absentes du profil, avec « Pourquoi ? ».
8. **Recherches récentes** seulement si le consentement « préférences » (`src/lib/consent.ts`) est donné.
9. **Mesure** : il n’existe pas d’outil d’analytics dans le dépôt. Prévoir une fonction `track(event,
   props)` unique, sans contenu privé (ni CV, ni message, ni document), soumise au consentement
   « analytics », et branchée sur un fournisseur seulement quand le propriétaire en choisit un.

## 3. Liens avec les autres briefs

- `docs/interactions-relief/` : ombres, zoom au toucher (pas de curseur Orbi sur écran tactile), en-têtes
  en îlots sur ordinateur. Inchangés.
- `docs/experience-animee/` : bandeau d’univers et `motion.css` restent ; sur téléphone le bandeau ne doit
  pas repousser les contenus de Pour moi sous la ligne de flottaison.
- `docs/refonte-career/` : la page Career v2 reste la page des outils ; Mon espace et les raccourcis de
  Pour moi y renvoient. L’éditeur de CV et « Adapter mon CV à cette offre » réutilisent BRIEF-CV-V2.
- `docs/learn-v2/PLAN.md` : la Learning Room mobile (onglets, reprise à la seconde près, sous-titres) est
  l’étape 4 de Learn v2 et la progression par leçon l’étape 3. Ce module s’aligne dessus et ne les
  réimplémente pas.
- `docs/refonte-connexion/` : l’écran d’objectif s’affiche après le générique d’entrée, une seule fois.

## 4. Phases (ordre du cahier des charges)

1. Barre du bas, barre du haut, Mon espace, déplacement du tableau de bord.
2. Écran d’objectif et Pour moi selon l’objectif.
3. Offres (onglets, filtres en feuille, détail), candidature en étapes, Apprendre, Suivi.
4. Notifications priorisées et préférences, recherche groupée, brouillons et reprise, `track()`,
   optimisations réseau (PWA déjà amorcée : `src/app/manifest.ts`, `public/sw.js`).

Chaque phase : tests à 360, 390 et 430 px et sur ordinateur, `pnpm lint`, `typecheck`, `test`, `build`,
e2e du parcours touché, `docs/journal.md` à jour.

## 5. Version 5 (16 octobre 2026) : cartes, messages, décisions

Demande du propriétaire : des cases visuelles, beaucoup moins de texte, un meilleur bloc objectif, des
options de message, des CV téléchargeables, des refus sobres à l’en-tête de l’entreprise.

1. **Moins de texte.** Une carte = un titre + une ligne au plus. Pas de sous-titre sous les titres de
   section. Les notes de confiance tiennent en une ligne (« Rien ne part sans vous. »). Les textes longs
   restent dans les aides et les pages légales.
2. **Planche « Cartes »** (composants dans `src/components/ui`) : `GoalCard` (carte objectif en dégradé
   principal avec motif d’orbites, 3 chiffres réels, bouton Lime pour changer), `ProfileCard` (bandeau,
   avatar, titre, 3 compétences, visibilité), `VisualTile` (zone d’illustration : scène en formes simples
   ou personnage de `ressources/`, puis titre et une ligne), `AiBento` (signature IA), `FileCard`,
   `SlotCard`, `DecisionCard`. Aucune image de stock : scènes en CSS/SVG et personnages existants.
3. **Objectif (03-05)** : `GoalCard` remplace la ligne « Objectif : … ». Chiffres réels selon l’objectif
   (emploi : candidatures actives, entretiens à venir, complétude ; compétences : formations en cours,
   attestations, complétude ; évolution : compétences à renforcer, formations, complétude). Un chiffre
   absent est masqué, jamais inventé.
4. **Options du + (50)** : créneau, mon CV, ma lettre, relance par l’IA (brouillon à relire, mode
   `follow` de Jumanly AI), document, lien. Un CV ou une lettre s’envoie en carte fichier téléchargeable
   (51) ; un créneau s’envoie en carte avec Accepter / Autre moment (réutilise `Interview.slots`).
   `MessageKind` gagne `file`, `slot` et `decision` (migration nommée) ; `invitation` et
   `document_request` restent.
5. **Décisions (52-53)** : quand l’équipe passe une candidature à `rejected` ou `hired`, le message est
   une `DecisionCard` : logo et nom de l’entreprise, poste, bandeau (« Candidature non retenue » en
   Sapin sobre, « Candidature retenue » en Lime), texte court, signataire et date ; pas une bulle de
   discussion. Sous un refus : « Pour rebondir » (offres proches réelles, simulation d’entretien).
6. **Recruteur (54-55)** : modèles de message Hire (convocation, demande de document, relance,
   acceptation, refus, écrire avec l’IA), modifiables par l’organisation (filtre `organizationId`).
   Le refus s’affiche en aperçu exact et part **seulement après le clic** du recruteur (règle d’or 3,
   aucun rejet automatique).
7. **Mes CV (56)** : vignettes A4 réelles, bouton PDF (état en cours, puis toast), PDF sans mention
   Jumanly, menu « … » (dupliquer, renommer, supprimer). Réutilise le rendu de `docs/modeles-cv`.
8. **Reprise de tous les écrans (01 à 33)** : textes raccourcis partout, outils de Mon espace en cartes
   visuelles, ancien « Assistant » renommé Jumanly AI avec sa signature (28, 30, 31, bio 25). Les écrans
   30 et 31 restent valables comme vue plein écran de Jumanly AI ; le panneau (36 à 44) fait foi pour le
   comportement.
