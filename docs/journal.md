# Journal du projet

Une entrée par étape : ce qui a été fait, les décisions prises, les dettes à rembourser.

## Modèle B · B0 : diagnostic de l'espace talent mobile (21 octobre 2026)

Référence : `docs/modele-b/BRIEF-MODELE-B-CLAUDE-CODE.md` (décision d'Ephraïm du 21/10/2026). Le Modèle B
remplace, à 390 px seulement, l'espace talent codé d'après `docs/refonte-mobile/` (lots 1 à 6, PR #97 à #103).
L'ordinateur et la tablette gardent `docs/refonte-web/`. Rien ne change pour le recruteur, l'organisation et
l'administration.

**Constat.** Aujourd'hui, un même code sert les trois largeurs (`TalentShell`, `src/components/talent/`,
feuille `src/styles/talent.css`, classes `t-`). Sous 768 px : grand titre (`header.tsx`), barre flottante
Pour moi · Offres · Orbi · Apprendre · Suivi (`bottom-bar.tsx`), clair, sombre ou auto. Les pages se
rechargent à chaque onglet (le routeur ne garde que 3 pages cachées), l'ouverture de l'appli installée est
le logo animé de 3,5 s (`src/lib/launch-splash.ts`).

**Écrans existants → Modèle B** (rangées de `docs/modele-b/captures/INDEX.md`) :

| Existant (route) | Modèle B | Sort |
|---|---|---|
| Connexion, inscription, code, mot de passe, oubli (`/connexion`, `/inscription`, `/activer`, `/mot-de-passe-oublie`, `/reinitialiser`) | 02 Accueil | à refaire (B2) |
| Premiers pas (`/inscription/...` étapes, `/app/bienvenue`) | 03 Profil en 6 étapes, notifications, profil prêt | à refaire (B2) |
| Ouverture `/demarrage` (logo 3,5 s) | 04 Application (logo seul 1,2 s, préchargement) | à refaire (B1) |
| Pour moi `/app`, `/app/tableau-de-bord`, `/app/espace` | 05-06 Fil (n'existe pas : publications, réponses, j'aime, republier) | nouveau (B3) ; l'ancien tableau de bord disparaît du téléphone |
| Notifications `/app/notifications` | 06 Fil · notifications | à refaire (B3) |
| Offres `/app/jobs`, détail, postuler, enregistrées, recherche `/app/recherche` | 07-08 Explorer | à refaire (B4) |
| (n'existe pas) page entreprise, page personne | 09-10 Profils | nouveau (B4) |
| Profil `/app/profil/*`, Career `/app/career`, CV `/app/career/cv*`, documents, portfolio, Suivi `/app/suivi*`, candidatures `/app/jobs/candidatures` | 11-15 Carrière (Profil · CV · Portfolio · Progression · Candidatures) | à refaire (B5) |
| Compte, abonnement, paiement, factures, paramètres, aide (`/app/compte*`, `/app/abonnement*`, `/app/parametres*`) | 12 Carrière · paramètres | à refaire (B5) |
| Diagnostic, plan, conseils, LinkedIn (`/app/career/diagnostic`, `plan`, `conseils`, `linkedin`) | 13 Carrière · Progression | à refaire (B5) |
| Simulations `/app/career/entretiens*`, `/app/suivi/entretiens/[id]` | 16 Entretien avec Orbi | à refaire (B6) |
| Apprendre `/app/learn/*` (cours, leçon, quiz, attestations, parcours, explorer, coach) | 17 Formation | à refaire (B7) |
| Messages `/app/messages*`, connexions `/app/compte/connexions` | 18-21 Messages | à refaire (B8) |
| Orbi `/app/orbi`, `/app/orbi/historique` | Orbi flottant et sa feuille, sur chaque onglet | à refaire (B1, puis chaque lot) |

**Ce qui manque dans les données** (migrations additives prévues) : publications du Fil, réponses, j'aime,
republications, abonnements aux entreprises et aux personnes, participation à un événement (B3) ; bannière et
présentation des entreprises et des personnes (B4) ; bannière du talent (B5) ; clé de droit de l'essai de
simulation (B6) ; réglages d'une discussion (silencieux, éphémères, blocage) côté talent (B8).

**Fichiers de l'ancien design talent mobile à supprimer (B9)**, une fois qu'aucune page ne les utilise au
téléphone : `src/components/talent/bottom-bar.tsx`, `header.tsx`, `top-bar-override.tsx`, `page-title.tsx`,
`cv/mobile-editor.tsx`, les règles `max-width: 767px` de `src/styles/talent.css` propres au talent, l'ouverture
de 3,5 s pour le talent, le thème clair et « Auto » de l'espace talent au téléphone. Les composants partagés
avec l'ordinateur (`web/`, `profile/`, `cv/studio/`, `learn/`, `billing/`) restent. Les anciennes routes du
téléphone (`/app/tableau-de-bord`, `/app/espace`, `/app/suivi`, `/app/orbi`…) redirigent vers leur écran du
Modèle B.

**Plan.** B1 fondations (coque sombre à 5 onglets montés, Orbi flottant, ouverture et préchargement,
transitions, recherche en deux temps, feuilles), puis B2 à B9 dans l'ordre du brief, une PR par lot.

## Plein écran au téléphone, suite (22 octobre 2026)

Les captures d'Ephraïm (Android, appli installée) montraient deux défauts.

- **Barre d'état restée verte.** L'appli s'ouvre sur `/demarrage`, puis va à `/app` sans recharger la page. À ce moment, Next réécrit le `theme-color` du layout racine, et le script de premier affichage ne repasse pas. Le nouveau composant `PhoneThemeColor` (`src/components/phone/theme-color.tsx`) remet la nuit chaque fois que la tête de page change. Le test `modele-b-plein-ecran` couvre ce passage ; il échouait avant la correction (#0F3F37 reçu).
- **Cadre vert dans les champs Message et Recherche.** Le halo du site (`globals.css`, `box-shadow` Lime) s'ajoutait à la pilule. Dans le Modèle B, les champs de texte n'ont plus ce halo : le focus est montré par la pilule (`:focus-within`), ou par le contour Lime quand le champ n'a pas de pilule.

La bande crème en bas venait de l'ancien manifeste gardé par l'appli installée. Elle disparaît une fois l'appli réinstallée.

## Plein écran au téléphone (22 octobre 2026)

Sur la demande d'Ephraïm, le fond sombre du Modèle B couvre maintenant tout l'écran du téléphone, sous la barre d'état et sous la barre d'accueil :

- `viewport-fit=cover` ;
- barre du navigateur et appli installée en `#0b1a1f` ;
- manifeste dans la même couleur ;
- barre d'état translucide sur iPhone.

Les autres pages commencent sous la barre d'état. Le détail est dans `docs/decisions/2026-10-22-plein-ecran-telephone.md`.

Vérifications : lint, types, 364 tests unitaires, messages:check et build passent. Les e2e du Modèle B (Fil, accueil, nettoyage, installer) et le nouveau `modele-b-plein-ecran.spec.ts` passent aussi. À voir sur un vrai téléphone à encoche, que Chromium ne simule pas.

## Modèle B · rapport final, lots B1 à B9 (22 octobre 2026)

Référence : `docs/modele-b/BRIEF-MODELE-B-CLAUDE-CODE.md` (décision d'Ephraïm du 21/10/2026). L'espace
talent au téléphone est entièrement passé au Modèle B : sombre seulement, cinq onglets gardés montés
(Fil · Explorer · Carrière · Formation · Messages, en icônes seules), Orbi flottant sur chaque onglet,
ouverture de 1,2 s avec préchargement, pages empilées au-dessus des onglets, aucun passage par un écran
noir. L'ordinateur et la tablette gardent `docs/refonte-web/`. Rien n'a changé pour le recruteur,
l'organisation, l'administration ni les règles métier.

| Lot | Contenu | PR |
|---|---|---|
| B0 + B1 | Diagnostic, fondations (coque, barre, Orbi, ouverture, transitions, recherche en deux temps, feuilles) | #131 |
| B2 | Accueil, inscription, connexion, premier profil en 6 étapes | #132 |
| B3 | Le Fil : publications, réponses, j'aime, republications, notifications | #133 |
| B4 | Explorer, une offre, une entreprise, une personne | #134 |
| B5 | Carrière : profil, CV, portfolio, progression, candidatures, paramètres, formule | #135 |
| B6 | Simulation d'entretien avec Orbi | #136 |
| B7 | Formation : accueil, cours, leçon, quiz, attestations | #137 |
| B8 | Messages : rubriques, recherche, discussion, pièces jointes, demandes | #138 |
| B9 | Nettoyage : redirections, ancien design retiré, écrans sans planche aux couleurs du Modèle B | voir ci-dessous |

**Ce que fait B9.**
- Une ancienne adresse du talent ouverte sur un téléphone mène à son écran du Modèle B
  (`src/server/phone-routes.ts`) : compte et « Mon espace » → Paramètres, connexions → Messages, Suivi
  et candidatures → Carrière · Candidatures, profil et ses formulaires → Carrière, portfolio → onglet
  Portfolio, recherche → Explorer, Orbi → la feuille d'Orbi sur le Fil (`?orbi=1`).
- L'ancienne tête du téléphone (`legacy-head.tsx`, cadre `.nb-ancien`) et l'ancienne barre du bas
  (`talent/bottom-bar.tsx`, `hidesTalentTabBar`) sont supprimées.
- Les écrans sans planche (diagnostic, plan, LinkedIn, sécurité, factures, historique d'Orbi…)
  gardent leur contenu dans le cadre `.nb-cadre`, aux couleurs du Modèle B (nuit à plat, cartes sans
  verre, tête en barre). Liste et raisons : `docs/decisions/2026-10-22-modele-b-b9.md`.
- « Installer l'appli », qui n'était que dans l'ancien Compte, est repris dans Paramètres.
- Les anciens parcours de bout en bout qui passaient par ces adresses au téléphone (compte, profil,
  Suivi, Orbi, portfolio, recherche) suivent maintenant les écrans du Modèle B.

**Tests.** `tests/e2e/modele-b-nettoyage.spec.ts` : chaque ancienne adresse mène à son écran, l'ancienne
page Orbi ouvre la feuille, un écran sans planche garde sa tête, son « Retour » et les couleurs du
Modèle B, et le retour vers un onglet ne passe jamais par un écran vide. Chaque lot a son propre fichier
`tests/e2e/modele-b-*.spec.ts` (chaque bouton ouvre quelque chose, transitions).

**Captures.** `docs/modele-b/captures/etape-1/` : `b1-*` à `b8-*` au numéro des planches de
`captures/INDEX.md`, et `b9-01` à `b9-10` pour les redirections et les écrans sans planche après
nettoyage.

**Reste à décider ou à faire (hors Modèle B).**
- Les écrans sans planche gardent leur mise en page d'avant, recolorée. Des planches pour le
  diagnostic, LinkedIn, la sécurité, les factures et l'historique d'Orbi permettraient de les
  redessiner à leur tour.
- Le Modèle B est en français seulement, comme le reste de l'application (anglais prévu plus tard).
- Écarts propres à chaque lot (données que la plateforme n'a pas, textes ajustés pour rester vrais) :
  `docs/decisions/2026-10-21-modele-b-b1.md` à `2026-10-22-modele-b-b9.md`.

## Modèle B · B8 : Messages au téléphone (22 octobre 2026)

Planches Messages (`docs/modele-b/captures/INDEX.md`, rangées 147 à 183). Écarts et choix :
`docs/decisions/2026-10-22-modele-b-b8.md`.

**Fait.**
- Onglet Messages gardé monté (`src/components/phone/messages/`) : recherche (par type, recherches
  récentes, connexions, puis noms et messages), rubriques Connexions · Recruteurs · Entreprises,
  demandes de connexion avec leur mot, « Nouveau message » vers les connexions seulement.
- Discussion : bulles, photos, documents, contacts, organisations, rendez-vous, notes vocales,
  liens (une offre de Jumanly s'ouvre dans l'espace), « Lu », recherche dans la discussion,
  composeur avec Orbi, caméra et micro, cartes de décision de recrutement.
- Feuilles : joindre (documents du téléphone ou de Jumanly, CV, lettre, contact, agenda,
  organisation, photos en HD), menu « ··· », Plus (bloquer, effacer, exporter, raccourci),
  messages éphémères, Orbi pour écrire (répondre, plus pro, plus court, corriger, anglais).
- Pages Infos et Médias, liens et documents ; visionneuse avec Transférer et Enregistrer.
- Données : migration additive `20261022010000_modele_b_messages` (éphémère, effacement par
  personne, mot d'une demande, types photo, vocal, contact, organisation). Aucune donnée effacée.
- Services `messages-phone.ts`, `message-media.ts`, `message-help.ts` ; actions
  `src/server/actions/messages-phone.ts` ; routes média, agenda (.ics) et export.
- Caméra et micro permis au site dans l'espace connecté (en-tête `Permissions-Policy`).

**Captures → maquettes** (`captures/etape-1/`, 390 × 844) : `b8-147` à `b8-183`, au numéro de la
rangée.

**Remplacé au téléphone.** L'ancienne liste des messages et l'ancienne conversation du talent.
L'ordinateur et le recruteur gardent leurs pages.

**Tests.** `tests/e2e/modele-b-messages.spec.ts` (chaque bouton ouvre quelque chose, demandes,
onglet gardé monté) ; `tests/unit/message-help.test.ts` ; `tests/db/messages-phone.test.ts`
(silence, éphémère, effacement, rubriques, accès) ; `modele-b-fil` (la feuille « Envoyer à » se ferme par Échap avec plus de connexions), `hire`, `hire-advanced` et
`mobile-recruteur-ats` adaptés au téléphone ; `security-headers` mis à jour.

## Modèle B · B7 : Formation au téléphone (21 octobre 2026)

Planches Formation (`docs/modele-b/captures/INDEX.md`, rangées 134 à 146). Écarts et choix :
`docs/decisions/2026-10-21-modele-b-b7.md`.

**Fait.**
- Onglet Formation gardé monté (`src/components/phone/learn/`) : en-tête et recherche, rubriques
  Pour vous · Mes cours · Attestations, carte « Continuer », « Pourquoi ? » vers Orbi, cours pour vos
  offres par compétence, « Avant votre entretien » avec « Répéter avec Orbi ».
- Recherche en deux temps : où chercher (Tout, Cours, Leçons, Attestations), recherches récentes,
  compétences demandées ; puis résultats dès la première lettre, groupés ; rien trouvé → Orbi.
- Détail du cours : bandeau, étiquettes, progression, « Vous saurez », programme, Enregistrer,
  Commencer ou Reprendre, menu (partager, enregistrer, signaler) et feuille de la formule.
- Leçon : vidéo ou bande, « À retenir », question rapide (`content.check`, saisie dans l'admin),
  « Orbi explique autrement », quiz et exercice, Précédente et Leçon suivante ou Terminer le cours,
  réglages (vitesse, sous-titres, fichiers, signaler).
- Attestation : « Bravo » à la fin d'un cours, carte avec le lien de vérification, profil, Fil, PDF.
- Services `learn-phone.ts`, actions `src/server/actions/learn-phone.ts`, seed des leçons SQL et CV
  (à retenir, question rapide).

**Captures → maquettes** (`captures/etape-1/`, 390 × 844) : `b7-134` à `b7-146`, au numéro de la
rangée.

**Remplacé au téléphone.** L'ancien accueil Apprendre, l'ancien détail du cours, l'ancienne leçon,
l'ancienne attestation et les pages Mes formations, Attestations et Rechercher (redirigées vers les
rubriques de l'onglet). L'ordinateur garde ses pages.

**Tests.** `tests/e2e/modele-b-formation.spec.ts` (chaque bouton ouvre quelque chose, cours et leçon,
cours au-dessus de la formule, attestation, onglet gardé monté) ; `tests/unit/lesson-check.test.ts` ;
`learn`, `mobile-talent` et `admin-v4` adaptés au téléphone. Le test recruteur « fin d'offre » accepte
2 ou 3 jours quand minuit passe entre le seed et le test.

## Modèle B · B6 : simulation d'entretien avec Orbi (21 octobre 2026)

Planches Entretien (`docs/modele-b/captures/INDEX.md`, rangées 114 à 133). Écarts et choix :
`docs/decisions/2026-10-21-modele-b-b6.md`.

**Fait.**
- Réglages (`/app/career/entretiens/nouveau`, depuis une candidature, une offre ou Formation) :
  l'offre et le CV lus, écrit ou oral, durée 5 · 10 · 15 min, sept sujets, ton du recruteur, ce que la
  formule inclut, l'essai de 5 min, la feuille « formule » et « Garder l'essai ».
- Préparation : quatre étapes animées, « Voir les questions avant », Commencer, Annuler ou Modifier
  (l'unité revient).
- Micro (autorisation, test, sous-titres, « Je préfère par écrit »), question orale (Répéter, Indice,
  Son), réponse dictée ou tapée, « Orbi relance », pause, arrêt avec ou sans bilan ; mode écrit avec
  compteur de mots.
- Analyse puis bilan sur 100 (critères avec leur raison, ce qui marche, à travailler, question par
  question), détail d'une réponse, refaire les questions faibles, « Mes simulations ».
- Services `interview-score.ts` (note par règles), `interview-phone.ts` ; actions
  `src/server/actions/interview-phone.ts` ; écrans `src/components/phone/interview/`.
- Droit `career.interview.trial.monthly` ajouté au seed (aucune migration : les droits vivent en base).

**Captures → maquettes** (`captures/etape-1/`, 390 × 844) : `b6-114` à `b6-133`, au numéro de la
maquette ; variantes `b`/`c` pour un second état de la même planche (121b, 122b, 129b, 131b, 131c).

**Remplacé au téléphone.** L'ancienne liste, l'ancien « Nouvel entraînement » et l'ancienne séance
des simulations. L'ordinateur garde ses pages.

**Tests.** `tests/e2e/modele-b-entretien.spec.ts` (réglages et verrous, parcours oral complet,
parcours écrit, aller-retour depuis une candidature sans écran vide) ; `tests/unit/interview-score.test.ts` ;
`tests/db/career.test.ts` (essai, annulation, reprise).

## Modèle B · B5 : Carrière au téléphone (21 octobre 2026)

Planches Carrière (`docs/modele-b/captures/INDEX.md`, rangées 11 à 15). Écarts et choix :
`docs/decisions/2026-10-21-modele-b-b5.md`.

**Fait.**
- Onglet Carrière gardé monté (`src/components/phone/career/`) : en-tête (bannière, photo, Cap,
  disponibilité, profil complété), Partager, Modifier, recherche, paramètres ; rubriques Profil · CV ·
  Portfolio · Progression · Candidatures ; `?onglet=` rouvre une rubrique.
- Profil : formulaires « Modifier le profil » (photo : appareil, galerie, retirer), « À propos »,
  expérience, formation, avec Orbi qui réécrit ou corrige (rien n'est gardé sans « Utiliser » puis
  « Enregistrer ») ; feuilles « Ajouter des compétences » et « Langues et lieux ».
- Paramètres, confidentialité, notifications, aide (e-mail seulement), déconnexion confirmée ; « Ma
  formule » et paiement Mobile Money (attente, validation, réussite ou échec).
- CV : nouveau (modèle, import, Orbi), modèles, éditeur avec aperçu et couleurs, menu d'un CV
  (modifier, exporter PDF ou Word, adapter à une offre, dupliquer, par défaut, supprimer), import.
- Portfolio : détail d'une réalisation (photos, mise en avant, partager dans le Fil, supprimer),
  ajout et modification (3 photos réduites sur le téléphone, Orbi rédige, lien).
- Candidature : où elle en est, l'entretien (agenda, préparer avec Orbi), s'entraîner, CV envoyé,
  écrire au recruteur (brouillon d'Orbi modifiable), retrait confirmé.
- Actions `src/server/actions/career-phone.ts`, services `src/server/services/career-phone.ts`.
  Aucune migration (le lien d'une réalisation vit dans son contenu JSON).

**Captures → maquettes** (`captures/etape-1/`, 390 × 844) : `b5-073` à `b5-113`, un fichier par
planche, au numéro de la maquette (073 Carrière à 113 Carrière-cand-retirer). Planches sans capture
propre : 092 et 093 (attente et fin du paiement, mêmes gabarits que 091), 104 et 105 (lecture et
résultat de l'import).

**Remplacé au téléphone.** L'ancienne page Paramètres et ses sous-pages, l'ancien « Mon
abonnement » et son paiement, l'ancien éditeur et les anciens modèles de CV, l'ancien détail d'une
candidature (sauf invitation ou document à envoyer), l'ancienne page d'import. Les liens du
téléphone (Accueil, Fil) mènent aux nouveaux écrans. **Reste pour B9** : l'ancien `/app/profil` et
ses sous-pages, encore joignables par une ancienne adresse ; l'ordinateur garde ses pages.

**Tests.** `tests/e2e/modele-b-carriere.spec.ts` (chaque bouton de Carrière ouvre quelque chose,
l'onglet reste monté au retour des paramètres, une réalisation de bout en bout, une candidature,
le brouillon d'Orbi) ; `tests/db/career.test.ts` (lien d'une réalisation, couverture, Orbi sans
modèle). En local, `simulations d'entretien › sans simulation` échoue sur une matrice de forfaits
modifiée par d'anciens essais ; il passe sur une base neuve (CI). Les anciens tests du téléphone qui
visaient les écrans remplacés suivent les nouveaux écrans ; trois parcours de `cv-templates` et la
liste de `cv-documents` ne tournent plus qu'à l'ordinateur, le test « studio CV (téléphone) » est
retiré (écran disparu).

## Modèle B · B4 : Explorer, une offre, une entreprise, une personne (21 octobre 2026)

Planches Offres, Entreprise et Personne (`docs/modele-b/captures/INDEX.md`, rangées 07 à 10).
Écarts et choix : `docs/decisions/2026-10-21-modele-b-b4.md`.

**Fait.**
- Onglet Explorer (`src/components/phone/explorer/`), gardé monté et lu pendant le logo : avatar,
  enregistrées, recherche en deux temps (où chercher, puis résultats dès la première lettre, récentes
  et populaires, « Annuler »), puces Tout · Offres · Entreprises · Personnes, « Offres pour vous » avec
  le score, « Entreprises qui recrutent » par secteur, « Nouvelles cette semaine », « Personnes à
  connaître » (profils visibles seulement, connexions en commun d'abord), chaque « Tout voir » vers sa
  liste (`/app/explorer/[liste]`).
- Offres enregistrées au téléphone (`/app/jobs/enregistrees`).
- Une offre au téléphone : entreprise, puces, « Pourquoi, selon Orbi » avec l'écart et le cours qui
  le comble, missions, attentes, avantages, lien vers l'entreprise, « Postuler est gratuit,
  toujours. », barre « Enregistrer · Postuler » et feuille Postuler (CV, profil, un mot, envoi).
- Page d'une entreprise : bannière, Suivre / Abonné, chiffres, onglets Publications, À propos,
  Offres, Membres (recherche).
- Page d'une personne : Se connecter / Envoyée / Accepter / Message, À propos (compétences,
  expérience, formation), Publications, Réalisations, menu (partager, signaler).
- Services `src/server/services/explore.ts`, actions `src/server/actions/explore.ts`. Aucune
  migration ; la démo donne un domaine aux offres fictives.

**Captures → maquettes** (`captures/etape-1/`, 390 × 844) :

| Capture | Maquette |
|---|---|
| `b4-explorer.png`, `b4-explorer-bas.png` | 042 Offres, 043 Offres-secteur |
| `b4-offre.png`, `b4-offre-bas.png` | 044 Offres-detail |
| `b4-postuler.png` | 045 Offres-postuler |
| `b4-recherche.png` | 046 Offres-recherche |
| `b4-recherche-resultats.png` | 047 Offres-recherche-texte |
| `b4-tout-voir-offres.png` | 048 Offres-tout (049 entreprises : même gabarit) |
| `b4-personnes.png` | 050 Offres-personnes |
| `b4-enregistrees.png` | 051 Offres-enregistrees |
| `b4-entreprise.png`, `b4-entreprise-membres.png` | 053 Entreprise, 056 Entreprise-membres (054, 055 : onglets) |
| `b4-personne.png`, `b4-personne-realisations.png` | 057 Personne, 058 Personne-real (059 à 072 : même gabarit) |

052 Offres-orbi : la feuille d'Orbi du lot B1, ouverte depuis Explorer.

**Supprimé du téléphone.** L'ancienne liste `/app/jobs` (onglets « Pour vous · Enregistrées ·
Candidatures »), l'ancienne fiche d'offre et les pages minimales d'entreprise et de personne du lot
B3. L'ordinateur garde ses pages.

**Tests.** `tests/db/explore.test.ts` (personnes visibles seulement, connexions en commun d'abord,
profil privé, recherche, Suivre) ; `tests/e2e/modele-b-explorer.spec.ts` (chaque bouton d'Explorer
ouvre quelque chose, une offre jusqu'à l'entreprise, une personne, Explorer reste monté à l'aller et
au retour). Suivent le téléphone : `accounts`, `intelligence`, `talent`, `hire`, `mobile-talent`.
En local, deux tests en base (`career`, `entitlements`) échouent sur une matrice de forfaits
modifiée par d'anciens essais ; ils passent sur une base neuve (CI).

## Modèle B · B3 : le Fil au téléphone (21 octobre 2026)

Planche Fil (`docs/modele-b/captures/INDEX.md`, rangées 05 et 06). Écarts et choix :
`docs/decisions/2026-10-21-modele-b-b3.md`.

**Fait.**
- Onglet Fil (`src/components/phone/fil/`), gardé monté sous les autres onglets et lu pendant le
  logo : « Pour vous », « Abonnements », « Entreprises » sans rechargement, cloche avec le nombre de
  notifications non lues, « Quoi de neuf ? », publications avec offre et score, photo, réalisation,
  attestation, citation, événement (« Je participe »), aperçu de la première réponse, carte d'Orbi
  quand des offres du matin correspondent, « Vous êtes à jour ».
- Publication `/app/fil/[id]` : réponses, J'aime, « Répondre » (avec « @Prénom Nom »), barre de
  réponse fixe ou message quand les réponses sont fermées, retour vers le Fil ou les notifications.
- Feuilles : menu « ··· » (profil, enregistrer, copier le lien, ne plus voir ce type, signaler,
  supprimer pour ses publications), signalement (motif « Fausse information » ajouté, visible dans
  `/admin/signalements`), Republier / Citer / Envoyer à une connexion (dans Messages).
- Nouvelle publication `/app/fil/publier` : texte, photo réduite sur le téléphone, réalisation ou
  attestation, brouillon d'Orbi, « Qui peut répondre », retour au Fil.
- Notifications au téléphone : filtres Tout, Candidatures, Offres, Réseau, groupes Aujourd'hui /
  Cette semaine / Plus tôt, « Tout marquer comme lu ». Nouveaux types : réponse, mention, J'aime,
  republication, citation.
- Orbi depuis le Fil : quatre questions calculées sans modèle ni crédit, avec des fiches à ouvrir.
- Pages minimales d'une personne et d'une entreprise (dessinées en B4).
- Migration additive `20261021165623_talent_feed`. Démo : `prisma/seed/fil.ts` (quatre talents
  fictifs, publications de Baobab Fintech et Mwinda Énergie, photos dans `public/modele-b/`).

**Captures → maquettes** (`captures/etape-1/`, 390 × 844) :

| Capture | Maquette |
|---|---|
| `b3-fil.png` | 031 Fil |
| `b3-detail.png` | 032 Fil-detail |
| `b3-publier.png` | 033 Fil-publier |
| `b3-orbi.png`, `b3-orbi-reponse.png` | 034 Fil-orbi, 041 Fil-orbi-reponse |
| `b3-notifs.png` | 035 Fil-notifs |
| `b3-detail-baobab.png` | 036 Fil-detail-baobab |
| `b3-menu.png`, `b3-signaler.png` | 037 Fil-menu, 038 Fil-signaler |
| `b3-repub.png`, `b3-envoi.png` | 039 Fil-repub, 040 Fil-envoi |

**Tests.** `tests/db/feed.test.ts` (abonnements, publication vide, « Qui peut répondre », J'aime,
type masqué, suppression, signalement) ; `tests/e2e/modele-b-fil.spec.ts` (chaque bouton du Fil ouvre
quelque chose, Fil gardé monté à l'aller-retour).

**Fichiers supprimés.** Aucun (l'ancien tableau de bord sert encore l'ordinateur et la tablette).

## Modèle B · B2 : accueil, inscription et premier profil au téléphone (21 octobre 2026)

Planche Accueil (`docs/modele-b/captures/INDEX.md`, rangées 02 et 03). Écarts et choix :
`docs/decisions/2026-10-21-modele-b-b2.md`.

**Fait.**
- `/decouvrir` (nouveau) : ouverture longue (3,9 s) la première fois sur ce téléphone, courte (1,7 s)
  ensuite, puis « Bienvenue » en trois écrans (Learn, Grow, Connect), « Créer un compte » et
  « Se connecter ». « Bienvenue » est déjà dessiné sous l'ouverture : jamais d'écran vide. `/app` sans
  session, au téléphone, y mène. L'appli installée montre le logo seul au téléphone.
- Connexion, inscription (e-mail, mot de passe avec règles cochées en direct, code à 6 cases), mot de
  passe oublié et nouveau mot de passe : branches téléphone des routes existantes
  (`src/components/phone/accueil/`), mêmes services que le web.
- Premier profil `/app/bienvenue` au téléphone (`onboarding.tsx`) : nom, photo (réduite sur le
  téléphone), pays et ville, situation, Cap (suggestions, recherche, ou Orbi en une question),
  contrats, compétences du référentiel (au moins 3), notifications, « Profil prêt » avec la
  complétude réelle. Chaque étape s'enregistre en avançant (`src/server/actions/phone-onboarding.ts`).
- Migration additive `20261021151550_talent_profile_situation` (`TalentProfile.situation`).

**Captures → maquettes** (`captures/etape-1/`, 390 × 844) :

| Capture | Maquette |
|---|---|
| `b2-ouverture.png`, `b2-ouverture-courte.png` | 005, 006 |
| `b2-bienvenue-1/2/3.png` | 007, 008, 009 |
| `b2-inscription.png`, `b2-conditions.png` | 010, 012 |
| `b2-motdepasse.png`, `b2-code.png` | 014, 013 |
| `b2-connexion.png`, `b2-oubli.png` | 015, 016 |
| `b2-profil-nom.png` … `b2-profil-competences.png` | 017 à 025 |
| `b2-notifications.png`, `b2-pret.png` | 027, 029 |

Non reproduits : 011 (écran du fournisseur Google), 026 (fichiers de démonstration), 028 (fenêtre
système du téléphone).

**Tests.** `tests/e2e/modele-b-accueil.spec.ts` (ouvertures longue puis courte sans écran vide, chaque
bouton de l'accueil ouvre quelque chose avec un retour clair, inscription complète et six étapes,
connexion). Les aides `signUpWithEmail` et `finishOnboarding` suivent le parcours du téléphone ; les
tests de l'ancien parcours au téléphone sont réservés à l'ordinateur.

**Fichiers supprimés.** Aucun (l'ancien parcours sert encore l'ordinateur et la tablette).

## Modèle B · B1 : fondations de l'espace talent au téléphone (21 octobre 2026)

Brief `docs/modele-b/BRIEF-MODELE-B-CLAUDE-CODE.md` § 2 et § 3, planches Identité, Orbi-options,
Transitions et Application. Choix techniques : `docs/decisions/2026-10-21-modele-b-b1.md`.

**Fait.**
- Coque du téléphone `PhoneShell` (`src/components/phone/`), sombre seulement, choisie côté serveur
  (`src/server/view.ts` : navigateur de téléphone, ou cookie `jm_vue` posé par `ViewSync` sous 768 px).
  L'ordinateur et la tablette gardent `TalentShell`, inchangé.
- Barre du bas en icônes seules, Fil · Explorer · Carrière · Formation · Messages (`nav.tsx`,
  `src/lib/phone-tabs.ts`), point lime sous l'onglet actif ; toucher l'onglet affiché remonte en haut.
- Les cinq onglets restent montés (`stack.tsx`) : changer d'onglet ne recharge rien. Les autres pages
  s'ouvrent dans une pile au-dessus, avec « Retour » (`back.tsx`).
- Transitions par View Transitions (approche, carte, retour, Orbi, onglet gauche et droite), l'écran
  quitté reste dessous jusqu'à ce que le nouveau le couvre : jamais d'écran noir. Animations réduites :
  fondu court.
- Ouverture : le logo seul 1,2 s une fois par session (`opening-script.ts`, `opening.tsx`) pendant que
  les cinq onglets se chargent derrière ; jamais de roue d'attente.
- Orbi flottant sur chaque onglet, avec sa question du moment, et sa feuille (quatre questions par
  onglet, réponse par le service d'Orbi existant : consentement, droit et crédits vérifiés).
- Feuilles (`sheet.tsx`, `<dialog>`), recherche en deux temps (`search.tsx`), icônes de la planche
  Identité (`icon.tsx`), feuille de style `src/styles/phone.css` (classes `nb-`).
- Pages pas encore redessinées (lots B2 à B8) : affichées dans le cadre sombre provisoire `nb-ancien`
  avec l'ancien en-tête (titre, Retour, notifications, compte, recherche), pour que rien ne devienne
  inaccessible entre deux lots. Retiré en B9.

**Captures → maquettes** (`captures/etape-1/`, 390 × 844) : `b1-fil.png` → 004 et 030 (Application,
coque et barre), `b1-orbi.png` → 002 Orbi-options, `b1-explorer.png`, `b1-carriere.png`,
`b1-formation.png`, `b1-messages.png` → la coque sur chaque onglet (contenu redessiné aux lots B3 à B8).

**Tests.** `tests/e2e/modele-b-fondations.spec.ts` (ouverture, cinq onglets, aucun clic vide, transitions
terminées, Orbi, sombre, pas de défilement horizontal). Tests du téléphone adaptés : le générique
d'entrée et l'ancienne barre ne s'affichent plus au téléphone ; `skipIntro` saute le logo de 1,2 s.

**Reste.** Le contenu de chaque onglet (B3 à B8) ; suppression de l'ancien design talent au téléphone (B9).

## Étape 2, recruteur web lot 4 : ATS, retenus, réponses, propositions, fin d'offre, rapport (21 octobre 2026)

Planche `docs/refonte-web/recruteur-4` (w1 à w11), ordinateur (1440 px) et tablette (1024 px),
clair et sombre ; le téléphone (390 px) est inchangé (comparaison avant/après de 12 écrans, clair
et sombre : seules diffèrent les données de démonstration modifiées entre les prises).
Choix et écarts : `docs/decisions/2026-10-21-recruteur-web-lot-4.md`.

**Mise en place.** Une feuille `src/styles/recruiter-web-4.css`, mêmes règles que les lots 2 et 3
(`t-rw-web`, `t-rw-tel`, `t-rw-w`, `t-rw-m`, enveloppes en `display: contents` sous 768 px).
`src/components/recruiter/ats-web.tsx` porte la tête de l'offre (`OfferHead`), ses quatre
rubriques (`OfferTabs`) et les titres de section. Nouveau service
`hire-reply-preview.tsx` (l'e-mail d'une réponse groupée rendu tel qu'il part) et sa route
`/api/hire/reponses/apercu` ; `report-export.tsx` (fenêtre d'export) ; `desktop-notifications.tsx`
(notifications du navigateur).

**Écran mobile → équivalent web** :

| Téléphone (lot mobile) | Ordinateur et tablette |
|---|---|
| Offres : « Analyser (ATS) » sur la carte, « … » | « Analyser (ATS) » foncé à côté de « Candidatures », ligne d'Orbi sous la grille ; « Liste des retenus » dans le « … » |
| ATS : lancement, « Quand analyser ? », analyse programmée | Tête de l'offre et quatre rubriques ; lancement, répartition et règle à gauche, candidatures reçues à droite ; fenêtre centrée |
| ATS : analyse en cours | Progression à gauche, dossier par dossier à droite |
| ATS : recommandation, « Pourquoi ? », Recommandés · À vérifier · Tous | Recommandation à gauche (podium), liste à droite ; « Orbi recommande, vous décidez » à côté des boutons |
| ATS : sélection rapide, barre « Retenir » | Cases sur les cartes, barre de sélection en ligne (plus de barre du bas) |
| Profil pour cette offre | Synthèse et tableau des critères à gauche ; « Ajouter aux retenus », « Ouvrir le dossier complet », « Écrire à … », questions d'entretien à droite |
| Liste des retenus | Liste à gauche (titre avec l'étape, « Ajouter »), « Ensuite » et ligne d'Orbi à droite ; « Créneaux » et « Informer les N » dans la tête |
| Répondre aux candidats (groupe, canaux, modèle, aperçus, relu, envoi, annulation 10 min) | Modèle à gauche, aperçu personne par personne à droite (pastilles, Suivant) ; « Voir le message et l'e-mail » : fenêtre avec l'e-mail réel ; Annuler · Envoyer sous l'aperçu |
| Modèles d'e-mail (retenu, non retenu) | Montrés dans la fenêtre d'aperçu, rendus par le gabarit d'envoi |
| Conversation : « … » et « + » | Menus ancrés sous leur bouton (le reste de la messagerie : lot 3) |
| Proposer l'offre → confirmation | Fenêtre « Proposition envoyée » avec les trois étapes |
| Proposition acceptée (notification) | Fenêtre « … a accepté votre proposition » à l'ouverture de la conversation |
| Mes propositions, Relancer | Tableau du lot 2 (Relancer, Relancé) |
| Premiers pas : organisation trouvée, demande envoyée | Fiche en bandeau avec logo, trois étapes de la demande |
| Fin d'offre : prolonger, clôturer | Fenêtres de 640 px, durées en tuiles |
| Rapport PDF | Fenêtre « Exporter le rapport en PDF » (période, offres, contenu, Aperçu, Télécharger) ; le PDF peut sauter le détail par offre et la lecture d'Orbi |
| Rappels de fin d'offre (paramètres) | Réglage « Notifications de l'ordinateur » en plus, demandé au clic seulement |
| Détail de l'offre : Attribution, Modèle de grille | Cartes de la planche (ordinateur seulement) |

**Recouvrement avec le lot 3.** Messagerie (seulement les menus ancrés), notifications (seulement
les fenêtres de fin d'offre), rapports (seulement la fenêtre d'export et les sections du PDF),
premiers pas (seulement la fiche et les étapes de la demande), paramètres (seulement le réglage
des notifications de l'ordinateur). Le reste de ces écrans est celui du lot 3, inchangé.

**Tests.** e2e `tests/e2e/web-recruteur-4.spec.ts` : ATS (tête, rubriques, menu ancré, lancement,
classement), profil pour l'offre sans barre du bas, retenus, réponse groupée avec l'e-mail réel et
la route d'aperçu fermée aux autres organisations ; proposition envoyée puis acceptée, menus de la
conversation ; export du rapport (période, contenu, PDF), notifications de l'ordinateur, demande
pour rejoindre puis annulée ; aucun défilement horizontal à 1440, 1024 et 768 px.
`mobile-recruteur-ats.spec.ts` : la case « J'ai relu » existe pour les deux mises en page (celle
à l'écran) ; « Relancer » tolère la course entre les deux projets (relecture jusqu'à l'état
enregistré). `hire-advanced.spec.ts` : le justificatif de vérification porte un nom propre à
chaque passage (une base rejouée sans remise à zéro gardait celui d'avant). Base :
`tests/db/recruiter-lot6.test.ts` vérifie l'aperçu de l'e-mail (rendu tel qu'il part, rien
d'envoyé, adresse absente, refusé à une autre organisation).

**Captures.** `captures/refonte-recruteur-web-4/` du dossier du projet : 24 écrans et fenêtres
du lot à 1440 et 1024 px (et 390 px pour les écrans), clair et sombre.

**Reste.** « Offres · Choisir » dans l'export (pas de filtre par offre dans le rapport) ; l'écran
talent « Proposition reçue » ; le bloc Attribution sur téléphone en mode sombre. Étape 3
(administration de l'entreprise, web seulement).

## Étape 2, recruteur web lot 3 : Orbi, messages, compte, organisation, abonnement, paramètres (21 octobre 2026)

Planche `docs/refonte-web/recruteur-3` (w0 à w9), ordinateur (1440 px) et tablette (1024 px),
clair et sombre ; le téléphone (390 px) est identique au pixel près (comparaison avant/après de
24 écrans, clair et sombre). Choix et écarts : `docs/decisions/2026-10-21-recruteur-web-lot-3.md`.

**Mise en place.** Une feuille `src/styles/recruiter-web-3.css`, mêmes règles que le lot 2 : sous
768 px les enveloppes s'effacent, ce qui n'existe que sur ordinateur est masqué (`t-rw-web`,
`t-w4-web`), l'inverse au-delà (`t-w4-tel`). Les pages du compte reprennent la mise en page web du
talent (`t-w4` : titre à 32 px, tuiles, deux colonnes, rubriques des paramètres).

**Écran mobile → équivalent web** :

| Téléphone (lot mobile) | Ordinateur et tablette |
|---|---|
| Orbi (page) et son historique | Page avec l'historique à gauche (≥ 1200 px), aides et conversation ; panneau Orbi à droite depuis tout écran (`?orbi=1`, `Ctrl K` « Demander à Orbi ») |
| Messages (liste, filtres, ligne d'Orbi) | Trois colonnes : liste, conversation (la première s'ouvre seule), candidature ; règle de la messagerie en pastille dans la tête |
| Conversation (tête, carte de l'offre, fil, réponses d'Orbi, modèles, « … ») | Colonne du milieu ; la candidature (étapes, CV, entretien, « Ouvrir le dossier ») dans la colonne de droite à partir de 1200 px, la carte de l'offre au-dessus du fil sur tablette |
| Modèles de message | Page au titre web ; feuille en fenêtre centrée |
| Notifications avec « Votre journée en bref » | Résumé du jour en haut du panneau de la cloche ; page : résumé, demandes et fins d'offre à gauche, liste à droite |
| Compte RH (avatar) | Menu du compte sous l'avatar ; page Compte : identité avec « Espace talent » et « Mon profil RH », six tuiles, Aide et Se déconnecter |
| Mon profil RH | Formulaire en carte (nom et fonction côte à côte), « Ce que voient les candidats » à droite, boutons dans la carte |
| Organisation | Carte en bandeau avec « Voir la page comme un talent » et « Modifier », quatre chiffres, présentation à gauche, Orbi et gestion à droite |
| Vérifier l'organisation | Anneau en carte, trois étapes en cartes, documents et formulaire à gauche, « En attendant » à droite |
| Équipe, Inviter (feuille), un membre (feuille) | Tableau Membre · Offres · Rôle · Gérer, « Inviter » dans la tête ; droits et activité côte à côte ; feuilles en fenêtres |
| Abonnement | Bandeau de la formule avec « Prolonger » et « Changer de formule », quatre cartes de quotas, Échéances et « Paiement et factures » côte à côte |
| Formules RH | Trois formules côte à côte, comparaison en dessous |
| Paiement, Factures | Écrans web du talent (moyens à gauche, récapitulatif à droite ; tableau) |
| Rapports | Tête avec « Exporter en PDF », quatre chiffres, cartes sur deux colonnes |
| Paramètres, Journal des consultations, Messagerie et rappels, Sécurité, Confidentialité, Notifications | Rubriques à gauche (Notifications, Messagerie, Apparence et Orbi · Sécurité, Journal, Confidentialité · Mes données) ; journal en tableau Membre · Profil consulté · Contexte · Quand |
| Premiers pas (3 étapes) | Plein écran, « Hire » à côté du logo, accueil en bandeau à l'étape 1 |

**Tests.** e2e `tests/e2e/web-recruteur-3.spec.ts` (menu du compte, organisation, compte en
tuiles, profil RH sans barre du bas, équipe en tableau et fenêtre d'invitation, abonnement,
formules, rapports, rubriques des paramètres et journal ; messagerie en trois colonnes à 1440 et
1024 px, résumé sous la cloche, page et panneau Orbi). `web-recruteur-1.spec.ts` : « Demander à
Orbi » ouvre désormais le panneau.

**Captures.** `captures/refonte-recruteur-web-3/` du dossier du projet : 24 écrans à 1440, 1024
et 390 px, clair et sombre.

**Reste.** Étape 3 (administration de l'entreprise, web seulement). Sites et photos des bureaux,
fuseau horaire et signature des messages : pas de données ni de réglage aujourd'hui (voir la note
de décision).

## Étape 2, recruteur web lot 2 : candidats, dossier, décision, entretiens, talents (21 octobre 2026)

Planche `docs/refonte-web/recruteur-2` (w0 à w6), ordinateur (1440 px) et tablette (1024 px),
clair et sombre ; le téléphone (390 px) est identique au pixel près (comparaison avant/après de
15 écrans, clair et sombre). Choix et écarts : `docs/decisions/2026-10-21-recruteur-web-lot-2.md`.

**Mise en place.** Une feuille `src/styles/recruiter-web-2.css` : sous 768 px les enveloppes web
s'effacent (`display: contents`), ce qui n'existe que sur ordinateur est masqué (`t-rw-web`,
`t-rw-w`), l'inverse au-delà (`t-rw-tel`, `t-rw-m`). Le dossier ouvert à côté de la liste
(`CandidatePane`) partage ses morceaux avec le dossier complet (`file-parts.tsx`) ; il enregistre
la consultation comme lui (`recordView`, filtré par organisation).

**Écran mobile → équivalent web** :

| Téléphone (lot mobile) | Ordinateur et tablette |
|---|---|
| Candidats : offre, segments, ATS, ligne d'Orbi, puces d'étape, liste, Trier (feuille) | Tête + segments ; offre et « Trier et filtrer » (fenêtre ancrée) ; une ligne d'Orbi ; liste + dossier côte à côte (≥ 1200 px), liste en 2 colonnes (tablette) |
| Candidats vides (En attendant, rechercher des talents) | Carte vide + « En attendant » (recherche, viviers, offre) en 2 colonnes |
| Dossier (Orbi, documents, compétences, pièces, réponses, évaluation, notes, historique, barre du bas, menu « … ») | Fil, 2 colonnes, Actions en carte avec « Plus d'actions », « Candidature n sur N » |
| Pourquoi ? · Changer d'étape · Lettre (feuilles) | Mêmes fenêtres, depuis le dossier complet ou le dossier ouvert à côté |
| Analyse d'Orbi (feuille) | Panneau à droite avec « Demander à Orbi » |
| Décision (choix, message, ton, motif, appel, vivier, envoi) et confirmation | 2 colonnes ; confirmation en carte + « Ce que X a reçu » et « Vivier mis à jour » |
| Agenda semaine (bande des jours, groupes par jour, en attente) | Grille horaire de la semaine + colonne (en attente, À évaluer, Orbi) ; « Proposer un entretien » dans la barre |
| Agenda mois, À évaluer | Grilles |
| Proposer un entretien : jour, puis heures, puis aperçu | Jour et heures sur un écran, aperçu à côté du message |
| Préparer l'entretien, Évaluer | 2 colonnes, barre dans la page |
| Rechercher des talents, Filtres (feuille), Changer d'offre | Filtres ouverts à gauche (≥ 1200 px, feuille sur tablette), « Viviers », profils en 2 colonnes |
| Mes propositions (puces, lignes, Relancer, Écrire, jauge) | Tableau Talent · Offre · Réponse · action, jauge et règle au-dessus |
| Profil d'un talent (couverture, chiffres, Orbi, compétences, projets, parcours, barre du bas, menu « … ») | Carte de tête avec Vivier · Proposer l'offre · menu, 2 colonnes |
| Proposer l'offre | Carte centrée |
| Mes viviers, Créer un vivier, un vivier, son menu | Tête avec « Créer un vivier », cartes en grille ; vivier en grille, menu en tête |

**Tests.** e2e `tests/e2e/web-recruteur-2.spec.ts` (dossier ouvert à côté et enregistré, Changer
d'étape depuis la liste, dossier en 2 colonnes, décision, calendrier sans étape « Heures », agenda,
filtres à gauche, propositions en tableau, viviers ; tablette). Les parcours du téléphone passent
par `tests/e2e/hire-wide.ts` dans le projet « desktop » (dossier ouvert depuis le panneau,
calendrier sans « Heures ») : `hire.spec.ts`, `hire-advanced.spec.ts`,
`mobile-recruteur-candidats`, `-entretiens`, `-gerer`.

**Captures.** `captures/refonte-recruteur-web-2/` du dossier du projet : 16 écrans à 1440, 1024
et 390 px, clair et sombre.

**Reste.** Panneau Orbi depuis tout écran (lot web recruteur 3) ; administration de l'entreprise
(étape 3). Deux défauts du téléphone (boutons fins de la fenêtre d'analyse, champ d'avis de
l'évaluation) attendent leur lot mobile : corrigés seulement au-delà de 768 px.

## Étape 2, recruteur web lot 1 : cadre, À traiter, offres, création, détail (21 octobre 2026)

Planche `docs/refonte-web/recruteur-1`, ordinateur (1440 px) et tablette (1024 px), clair et
sombre ; le téléphone (390 px) est inchangé, à trois défauts corrigés près. Choix et écarts :
`docs/decisions/2026-10-21-recruteur-web-lot-1.md`.

**Cadre.** Le cadre web du talent sert au recruteur : barre latérale (organisation active avec son
menu sous le nom, À traiter · Offres · Orbi · Candidats · Messages, puis Agenda · Talents ·
Rapports, Paramètres, carte du compte), rail sur tablette, barre du haut avec `Ctrl K` (candidats
et offres de l'organisation, « Demander à Orbi »). La barre du bas disparaît dès 768 px.

**Écran mobile → équivalent web** :

| Téléphone (lot mobile) | Ordinateur et tablette |
|---|---|
| Tête : puce de l'organisation, recherche, cloche, avatar | Barre latérale (organisation sous le nom) et barre du haut (`Ctrl K`, cloche, messages, avatar) |
| Feuille « Organisation active » | Menu sous le nom (rond sous le logo sur tablette), même contenu + règle d'isolation |
| Barre du bas | Barre latérale / rail |
| À traiter (Orbi, Publier, ATS, quatre tuiles, nouvelles candidatures, entretiens, offres actives) | Bonjour en titre + Publier à droite ; 2 colonnes ; « Candidatures cette semaine » ; offres en grille |
| À traiter vide (cette semaine, Orbi, Pour avancer) | 2 colonnes |
| Mes offres (recherche, onglets, cartes) | Titre + « N offres actives sur M · formule », filtres sur une ligne, grille |
| Menu « … » d'une offre, Clôturer, Supprimer | Menu ancré sous son bouton ; confirmations en fenêtre centrée |
| Publier une offre, étapes 1 à 4, barre d'action | Étapes en tête, formulaire en carte, aperçu de l'annonce à droite, actions dans la carte |
| Rédiger avec Orbi (feuille) | Panneau à droite |
| Limite d'offres atteinte (feuille) | Fenêtre centrée |
| Offre publiée | Carte en deux colonnes |
| Détail d'une offre (Orbi, étapes, description, candidature, compétences, fiche, historique, performance, suivi, barre du bas) | Tête avec boutons ronds et « Voir les N candidatures », chiffres sur 4 colonnes, 2 colonnes ; Attribution et Modèle de grille dessous |

**Tests.** Unitaires `tests/unit/hire-web.test.ts` (semaine) ; en base, isolation de `Ctrl K` et
de la semaine par organisation (`tests/db/hire-offers.test.ts`) ; e2e
`tests/e2e/web-recruteur-1.spec.ts` (cadre, organisation, création avec aperçu, détail, menu
ancré, `Ctrl K`, Orbi ; téléphone : barre du bas gardée). `hire.spec.ts` et
`mobile-recruteur.spec.ts` suivent la navigation de l'ordinateur (barre latérale gardée sur
Compte, aperçu de l'annonce à droite).

**Captures.** `captures/refonte-recruteur-web-1/` du dossier du projet : 15 écrans à 1440, 1024
et 390 px, clair et sombre.

**Reste.** Panneau Orbi depuis tout écran (lot web recruteur 3) ; Attribution et Modèle de grille
au nouveau design (lot web recruteur 4).

## Refonte étape 1 · rapport de fin d'étape : interface talent (19 octobre 2026)

**Fait.** L'espace talent ne montre plus que le nouveau design, sur téléphone (390 px), tablette
(1024 px) et ordinateur (1440 px), en clair et en sombre. Lots fusionnés dans l'ordre du plan :

| PR | Lot |
|---|---|
| #104 | Revue des lots mobiles 1 à 6 contre la dernière version des planches |
| #105 | W0 · cadre web commun (barre latérale, rail tablette, barre du haut, panneau Orbi, fenêtres) |
| #106 | Lot mobile 7 · abonnement, Mobile Money, factures, paramètres, aide, redirections, code mort supprimé |
| #107 | Web talent 1 · Pour moi, Offres, détail d'une offre |
| #108 | Web talent 4a · connexion, mot de passe oublié, inscription, premiers pas |
| #109 | Web talent 2 · Postuler, Suivi, S'entraîner, Messages, Notifications |
| #110 | Web talent 3 · Apprendre, salle de cours, quiz, attestations |
| #111 | Studio CV web · Mes CV, galerie des modèles, studio en trois panneaux, LinkedIn |
| #112 | Web talent 4b · compte, profil en deux colonnes, abonnement, paramètres, aide |

**Contrôle final.** Captures de toutes les routes talent (`/app/*` hors `/app/hire`,
`/app/organisation`, `/app/partenaire`), des écrans d'accès et des premiers pas, aux trois
largeurs, en clair et en sombre : `captures/etape-1/` du dossier du projet (une image par route,
largeur et thème, plus des planches-contacts). Trois écarts trouvés et corrigés dans la PR de fin
d'étape : un trait parasite dans la barre du haut (la classe de l'espaceur avait été reprise par
l'indicateur d'attente du paiement), les deux mois de « Nouvelle expérience » qui débordaient à
390 px, et la conversation de la page Orbi trop étroite et collée à gauche sur ordinateur.

**Données.** Aucune donnée effacée : migrations additives seulement (`Country.dialCode`,
`User.notificationsMuted`, `User.notificationEmails`, lots mobiles 1 à 6).

**Écarts gardés.** Un fichier par lot dans `docs/decisions/2026-10-19-refonte-etape-1-*.md`
(revue, w0, lot-7, web-t1, web-t2, web-t3, web-t4a, web-t4b, web-cv).

**Questions pour Ephraïm.**

1. Écran de connexion sur ordinateur : la carte d'illustration « Analyste de données junior ·
   Baobab Fintech · 86 % » (fictive, masquée aux lecteurs d'écran) reprend la planche. À retirer
   si elle vous paraît contraire à la règle « aucune donnée inventée en production » ?
2. `/app/testeur` reste accessible en production aux seules adresses de `TESTER_EMAILS`
   (invisible pour tout autre compte). Est-ce bien ce que vous voulez ?
3. « Télécharger mes données » télécharge le fichier directement, alors que la planche dit « envoyé
   par e-mail ». On garde le téléchargement direct ?
4. Orange Money : orange assombri (#C25200) pour que la lettre blanche soit lisible (règle
   d'accessibilité). D'accord ?

**Reste.** Rien pour l'étape 1. L'étape 2 (recruteur, mobile puis web) attend votre validation.

## Refonte étape 1 · web talent 4b : compte, profil, abonnement, paramètres, aide (19 octobre 2026)

Planche `docs/refonte-web/talent-4` § 3 à 10, ordinateur et tablette ; le téléphone est inchangé
(non-régression à 390 px). Choix et écarts : `docs/decisions/2026-10-19-refonte-etape-1-web-t4b.md`.

**Écran mobile → équivalent web** : Compte → hub en deux colonnes, carte d'identité avec anneau de
complétude et tuiles de couleur (`/app/compte`) ; Connexions → cartes de personnes, demandes à droite,
recherche dans la tête (`/app/compte/connexions`) ; Mon profil → deux colonnes, sections ouvertes
(`/app/profil`) ; Modifier, Expérience, Compétence, Ce que je cherche, Projet → fenêtres centrées
(`/app/profil?fenetre=…`, sous-pages gardées) ; Vu par un recruteur, Faire le point → volets à
droite ; Diagnostic → résultat + « Mon plan de progression » à droite (`/app/career/diagnostic`) ;
Plan → deux colonnes (`/app/career/plan`) ; Abonnement → formule en grand, quatre quotas, moyen de
paiement et dernières factures (`/app/abonnement`) ; Formules → quatre cartes côte à côte
(`/app/abonnement/formules`) ; Paiement → moyens et numéro à gauche, récapitulatif à droite, attente et
reçu en carte centrée (`/app/abonnement/payer`) ; Factures → tableau à cinq colonnes
(`/app/abonnement/factures`) ; Paramètres, Sécurité, Confidentialité, Notifications → rubriques à
gauche (`/app/parametres/*`) ; Aide → grande recherche, thèmes en cartes, questions fréquentes et
« Nous écrire » (`/app/compte/aide`). Menu de l'avatar, Orbi et son historique (W0) : vérifiés,
inchangés.

**Composants** : `src/components/talent/profile/screens.tsx` (écrans du profil en page ou en
fenêtre), `panels.tsx` (Faire le point, Vu par un recruteur), `window.tsx` (liens larges, fermeture),
`plan-summary.tsx` ; `src/components/talent/billing/invoice-rows.tsx` (factures, liste ou tableau) ;
`src/components/talent/settings-nav.tsx` (rubriques). Textes : partie « Espace talent · Web lot 4b »
de `textes/textes-application.md` (`talentW4.*`). Aucune migration ; aucun fichier supprimé (les
sous-pages du profil deviennent des enveloppes des écrans partagés).

## Refonte étape 1 · Studio CV web (19 octobre 2026)

Planche `docs/refonte-web/studio-cv` (valeurs de `webcv.py` et `web.py`), à partir de 768 px ; le
téléphone garde les écrans de la planche talent-4 § 6. Un seul code par écran : arbre téléphone
`.t-mob`, arbre web `.t-sc-*`, feuilles et fenêtres partagées.

| Écran de la planche | Route | Composant |
|---|---|---|
| § 1 Mes CV (cartes avec aperçu réel, Nouveau CV, Importer, Orbi pour vos CV) | `/app/career/cv` | `src/app/app/career/cv/page.tsx`, `studio/orbi-card.tsx` |
| § 1 Importer un CV (fenêtre) | `/app/career/cv?importer=1` | même page, `CenteredDialog`, actions d'import avec `retour=cv` |
| § 2 Galerie des 15 modèles (filtres, détail avec votre contenu) | `/app/career/cv/modeles?cv=` | `src/app/app/career/cv/modeles/page.tsx` |
| § 3 Studio, mise en forme (modèle, couleurs, police, densité, photo, titres, pages, export PDF ou Word) | `/app/career/cv/[id]?vue=style` | `src/components/talent/cv/studio/studio.tsx`, `preview.tsx`, `/app/career/cv/[id]/word` |
| § 4 Studio, contenu et Orbi (sections, avant/après, Pourquoi, Accepter, Modifier, Refuser) | `/app/career/cv/[id]`, `?vue=ameliorer` | `studio.tsx` |
| § 4 et § 5 Adapter à une offre, à un texte collé | `?adapter=offre`, `?adapter=texte` | `studio.tsx`, `tailor.tsx` |
| § 6 Lettres | `/app/career/cv?vue=lettres` | `src/app/app/career/cv/page.tsx`, `letter-menu.tsx` |
| § 7 Préparer LinkedIn | `/app/career/linkedin` | `src/app/app/career/linkedin/page.tsx` |

- Fonctions du téléphone et leur équivalent web : menu « … » d'un CV (feuille, fenêtre centrée dès
  768 px) ; éditeur téléphone → studio en trois panneaux ; puces Couleur, Police, Densité → panneau
  « Mise en forme » ; « Améliorer » et avant/après → panneau d'Orbi à droite avec surlignage sur la
  page ; « Adapter » → panneaux offre et texte ; options du CV (renommer, coordonnées, principal,
  rafraîchir, dupliquer, supprimer) → fenêtre « … » du studio ; import (page) → fenêtre sur Mes CV ;
  galerie (familles, barre du bas) → filtres, grille de 4 colonnes et détail ; LinkedIn → cartes
  Titre, Infos, Compétences avec « Copier » et colonne Lettres.
- Ajouts : export Word (une colonne, sans mention Jumanly), « Tout accepter / Tout refuser »
  (`decideAllChangesAction`), studio sans barre du haut et avec rail sur ordinateur.
- Rien n'est appliqué sans accord ; droits par clés (`career.cv.tailor`, `career.cv.templates.access`,
  `career.linkedin`).
- Tests : e2e `cv-documents` (parcours web : liste, import, studio), `cv-templates`, `career`, aide
  `newCvFromList` ; unitaires de l'export Word. Écarts : `docs/decisions/2026-10-19-refonte-etape-1-web-cv.md`.
  Captures : `/mnt/project-files/captures/etape-1/web-studio-cv/`.

## Refonte étape 1 · web talent 3 (19 octobre 2026)

Apprendre sur tablette et ordinateur (planche `docs/refonte-web/talent-3`, valeurs de `web3.py`). Un seul
code par écran : sous 768 px, la mise en page du téléphone ne change pas ; au-delà, les colonnes de la
planche (`t-large`, classes `t-aw-*`, bloc « Lot web talent 3 » à la fin de `src/styles/talent.css`).

- **Accueil Apprendre** : titre, recherche, Reprendre en grand, domaines, recommandées ; à droite Mes
  formations, attestations, parcours, « À faire » et la suggestion d'Orbi (parcours non suivi le plus
  proche des formations suivies, `suggestedPath`).
- **Rechercher** : filtres toujours ouverts à gauche (domaine, niveau, durée, gratuites, avec
  attestation, nouveau filtre `attestation=1`), formations en grille. **Parcours** : étapes à gauche,
  carte « Attestations du parcours » à droite.
- **Détail d'une formation** : programme à gauche ; chiffres, Commencer et l'attestation à droite
  (aperçu de l'attestation, ou modèle au nom du talent `…/modele-attestation`, numéro JMN-XXXX-XXXX).
  Premier module toujours ouvert, la suite selon les droits.
- **Salle de cours** : vidéo en grand, plan de la formation à droite, « Expliquer cette notion » en volet
  à droite, support PDF ; **mode concentré** (rail à la place de la barre latérale, pas de barre du
  haut, `classroom()` dans `side-nav.tsx`).
- **Quiz** avec le plan des questions ; **résultat** sur deux lignes (réponses une à une, Orbi, essais) ;
  **exercice** en deux colonnes ; **formation terminée** avec l'attestation en grand ; **Mes
  attestations** en grille ; **détail d'une attestation** en deux colonnes ; **Mes formations** en
  deux colonnes.
- **Vérification publique** `/attestations/[code]` : sortie du site marketing, groupe `(verification)`
  au style de l'espace talent (clair ou sombre), liste et dessin côte à côte (`/attestations/[code]/apercu`,
  attestations authentiques et signées seulement).
- Fichiers supprimés : `src/app/(public)/attestations/[code]/page.tsx` (déplacé et réécrit dans
  `(verification)`). Écarts : `docs/decisions/2026-10-19-refonte-etape-1-web-t3.md`. Captures :
  `captures/etape-1/web-talent-3/`.

## Refonte étape 1 · web talent 2 (19 octobre 2026)

Postuler, Suivi, S'entraîner, Messages et Notifications sur tablette et ordinateur (planche
`docs/refonte-web/talent-2`, d1 à d5, valeurs de `web2.py`). Téléphone inchangé (390 px vérifié).

- **Postuler** (`/app/jobs/[slug]/postuler`) : les trois étapes à gauche avec l'offre et « Candidater
  est toujours gratuit », l'étape à droite ; CV en aperçu sur trois colonnes, lettre et pièces avec les
  suggestions d'Orbi, vérification avec le CV en grand et ce que verra le recruteur. Confirmation en
  fenêtre centrée au-dessus de l'offre (`ApplySentDialog`).
- **Suivi** (`/app/suivi`, `?id=`) : liste et détail côte à côte sur ordinateur, sous-titre (nombre en
  cours, actions à faire) ; détail partagé `components/talent/suivi/application-detail.tsx` (en-tête,
  5 étapes, invitation sur une ligne, messages et historique côte à côte, rebond avec trois offres et
  une formation pour une candidature non retenue). `/app/suivi/[id]` garde la page seule.
- **S'entraîner** (`/app/career/entretiens/nouveau`, `[id]`) : briefing en deux colonnes avec « Avec
  Orbi » ; simulation avec le temps restant et le plan des questions ; retour avec en-tête et actions,
  5 critères en colonnes (niveau en mots, jauge sans chiffre), points forts et à travailler côte à côte.
- **Messages** (`/app/messages`, `[id]`) : trois colonnes (liste, conversation, candidature liée et
  fichiers échangés) ; la conversation la plus récente s'ouvre seule en web.
- **Notifications** : panneau sous la cloche (8 dernières, groupées, « Tout marquer comme lu »,
  « Toutes les notifications ») ; le compteur se remet à jour. Page `/app/notifications` inchangée.
- Correctif du cadre W0 : `t-large` reconnu sous `.jm-page` (`cacheComponents`).
- L'offre derrière la fenêtre de confirmation est inerte (un seul « Suivre ma candidature »).
- e2e adaptés : `messages-live` (la cloche est un bouton en web), `career` (titre de la question).
  Écarts :
  `docs/decisions/2026-10-19-refonte-etape-1-web-t2.md`. Captures : `captures/etape-1/web-talent-2/`.

## Refonte étape 1 · web talent 4a (accès) (19 octobre 2026)

Version tablette (768 à 1199 px) et ordinateur (≥ 1200 px) des écrans d'accès, planche
`docs/refonte-web/talent-4` § 1, 2 et 10 (générateur `web4.py`). Mêmes pages et composants que le
mobile ; seule la disposition change. Captures 390, 1024 et 1440 px, clair et sombre :
`/mnt/project-files/captures/etape-1/web-talent-4a/`. Écarts : `docs/decisions/2026-10-19-refonte-etape-1-web-t4a.md`.

| Écran de la planche | Route | Rendu web |
|---|---|---|
| Se connecter (`W_CONNEX`, `T_CONNEX`, sombre) | `/connexion` | deux parties dès 1200 px (panneau de marque `AccessShowcase`, formulaire à droite) ; colonne de 460 px centrée sur tablette ; Google et LinkedIn côte à côte |
| Mot de passe oublié (`W_MDP1`) | `/mot-de-passe-oublie` | lien « Retour à la connexion », bouton avant l'avertissement |
| Code reçu, nouveau mot de passe (`W_MDP2`) | `/reinitialiser` | cases du code de 56 × 64 px alignées à gauche, barre d'action sous les champs |
| Mot de passe modifié (`T_MDP3`) | `/reinitialiser` (état final) | confirmation sans lien de retour |
| Créer un compte (`W_INS`) | `/inscription` | deux parties |
| Avec mon e-mail (`W_INS2`) | `/inscription/compte` | titre « Créer un compte » et « Avec votre adresse e-mail. » visibles en web |
| Code de vérification (`W_VERIF`) | `/inscription/verification` | deux parties, icône et titre à gauche |
| Compte validé (`T_VALIDE`) | `/app/bienvenue` | plein écran, colonne de 500 px centrée |
| Objectif, études, lieu et contrat, espace prêt (`W_OB1` à `W_OB4`, `T_OB1`) | `/app/bienvenue?etape=…` | plein écran au-dessus de l'espace : logo, progression, question sur 820 px, barre du bas pleine largeur ; objectifs en 4 cartes, études et lieu en 2 colonnes ; pays en fenêtre à 3 colonnes |
| Bienvenue sur Pour moi (`W_BIENV`) | `/app` | les trois premiers pas côte à côte (la page Pour moi elle-même : lot web talent 1) |

Nettoyage : textes morts de l'ancienne scène animée de connexion (`auth.stage.*`) retirés. Test e2e
ajouté : connexion en deux parties sur ordinateur, formulaire seul sur téléphone, retour depuis « Mot de
passe oublié ».

## Refonte étape 1 · web talent 1 (19 octobre 2026)

Pour moi, Offres et détail d'une offre sur tablette et ordinateur (`docs/refonte-web/talent-1`, captures
w1 à w5 ; valeurs de `web1.py` et `web.py`). Mêmes routes, mêmes composants qu'en mobile ; les pages
passent en colonnes (`t-large`) et le téléphone garde exactement son ordre (enveloppes en
`display: contents`).

- **Pour moi** (`/app`) : objectif « trouver un emploi » : prochaine étape en bandeau, offres en cartes
  côte à côte, « Continuer à apprendre », et à droite « Votre profil », « Orbi vous suggère », accès
  rapide. Objectif « développer mes compétences » : formation à reprendre et « Pour vos objectifs » en
  grille, les offres et Orbi à droite. Tablette : contenu puis deux cartes côte à côte.
- **Offres** (`/app/jobs`) : ordinateur, filtres ouverts à gauche (appliqués à chaque choix), recherche,
  onglets et nombre d'offres, grille de 3 colonnes ; tablette, filtres actifs en puces qui se retirent,
  grille de 2 colonnes, filtres en fenêtre.
- **Offre** (`/app/jobs/[slug]`) : bannière arrondie, logo de 92 px, colonne de droite fixe (score,
  « Pourquoi ? », Postuler toujours gratuit, Préparer ma candidature, formation pour progresser) ;
  tablette, Postuler en tête à gauche. « Pourquoi 86 % ? » en fenêtre centrée avec « Compris » ;
  « Préparer ma candidature » en panneau à droite avec « Pour combler l'écart » et « Demander à Orbi ».
- Données réelles : bandeau selon la vraie prochaine étape, suggestion d'Orbi calculée par le matching
  (`orbiFocus`), crédits restants.
- E2e `tests/e2e/web-talent-1.spec.ts`. Écarts : `docs/decisions/2026-10-19-refonte-etape-1-web-t1.md`.
  Captures : `captures/etape-1/web-talent-1/`.

## Refonte étape 1 · lot mobile 7 : abonnement, paiement, factures, paramètres, aide, fin de l'ancien design (19 octobre 2026)

Planche talent-4 § 7, 8 et 10. Choix et écarts : `docs/decisions/2026-10-19-refonte-etape-1-lot-7.md`.

**Écrans → routes** : Abonnement `/app/abonnement` ; Formules `/app/abonnement/formules` (nouvelle) ;
Paiement, numéro avec indicatif, attente de validation, « Je n'ai rien reçu », paiement reçu, échec
`/app/abonnement/payer` ; Factures `/app/abonnement/factures` (nouvelle, PDF par la route existante) ;
Paramètres `/app/parametres` (apparence Auto/Clair/Sombre, réduire les animations, économie de données,
langue, introduction, données, suppression en feuille) ; Sécurité `/app/parametres/securite`,
Confidentialité `/app/parametres/confidentialite`, Notifications `/app/parametres/notifications`
(nouvelles) ; Aide `/app/compte/aide` (nouvelle, contact par e-mail seulement) ; Rechercher
`/app/recherche` et Mode testeur `/app/testeur` aux composants talent ; Accès refusé et invitation
redessinés pour les talents ; historique Orbi vérifié contre la planche (inchangé).

**Base** : migrations additives `country_dial_code_and_notification_settings` (`Country.dialCode`,
`User.notificationsMuted`, `User.notificationEmails`) ; `remove_old_talent_theme` retire la colonne
`User.theme` et l'énumération `UserTheme` de l'ancien design. Le seed des pays remplit les indicatifs.

**Services** : `maskNumber` avec indicatif, `localMask` ; catégories de notifications
(`notificationCategories`, `categoryOf`), `notify()` ne crée plus une notification d'une catégorie
coupée ; rappels de fin de période par e-mail seulement si `notificationEmails`. Actions :
`updateNotifications`, retour des actions de facturation vers une page talent (liste fermée).

**Redirections permanentes** : `/app/tableau-de-bord` → `/app`, `/app/espace` → `/app/compte`,
`/app/career` → `/app/career/cv`, `/app/career/conseils` → `/app/learn` (les fiches s'ouvrent dans
« S'entraîner aux entretiens »).

**Fichiers supprimés (vérifiés par recherche d'imports, Hire, partenaire, admin et site public
compris)** :
- `src/app/app/tableau-de-bord/page.tsx`, `src/app/app/espace/page.tsx`, `src/app/app/career/page.tsx`,
  `src/app/app/career/conseils/page.tsx` (remplacés par des redirections de quelques lignes) ;
- `src/components/career/home/art.tsx`, `sections.tsx`, `tool-card.tsx` (ancien accueil Career) ;
- `src/components/motion/gauge.tsx`, `radar.tsx` ;
- `src/components/app/daily-welcome.tsx`, `for-me.tsx`, `skills-input.tsx` ;
- `src/components/account/account-controls.tsx` ;
- dans `src/lib/appearance.ts` : `REDRAWN`, `REDRAWN_EXACT`, `redrawn()` et la classe `t-ancien`
  (et sa règle dans `talent.css`) ;
- textes morts : `career.home.*`, `talent.espace.*`, `talent.forMe.*`, `welcome.talent.skills.*`,
  les clés de `talent.dashboard.*` plus utilisées, `talentShell.title.dashboard/space`,
  `settings.seo`, `billing.seo`, `compte.spaces.title` (306 clés).
- Déplacés en composants pour les espaces organisation (étapes 2 et 3) : ancienne page abonnement →
  `src/components/billing/hire-billing.tsx`, paramètres → `src/components/account/hire-settings.tsx`,
  recherche → `src/components/connect/hire-search.tsx`.
- Gardés car encore importés par l'ancien cadre (AppShell) ou Hire : `account-menu`, `space-switcher`,
  `recent-searches`, `slash-focus`, `nav-link-styles`, `tab-rail-client`, `subscription-section`,
  `sponsored-card`, `checkout-form`, `checkout-panel`, `components/career/kit`.

**Tests** : unitaires (masque avec indicatif, prestataire factice absent en production, catégories
de notifications, apparence sans liste, navigation) ; e2e mis à jour vers le nouveau design
(paiements, inscription avec forfait, paramètres, apparence, accessibilité, anciennes adresses,
fiches conseil, recherche, mise en relation). Le test « message du jour » est retiré avec la
fonctionnalité (le tableau de bord qui le portait n'existe plus).

**Captures** : `/mnt/project-files/captures/etape-1/lot-7/` (390 px, clair et sombre).

**Rebase sur le cadre web W0 (#105)** : la règle provisoire `html.t-ancien .t-cadre .t-colonne`
est retirée (plus d'ancien design) ; le menu de l'avatar mène l'aide à `/app/compte/aide` (et non
plus `/contact`) ; « Paramètres » (barre latérale) et « Abonnement » (menu) mènent déjà à
`/app/parametres` et `/app/abonnement`. Contrôle à 1440 px de l'abonnement et des paramètres.

**Reste à faire** : écrans ordinateur et tablette (lots web) ; les pages Hire, partenaire et
administration d'entreprise gardent l'ancien design jusqu'aux étapes 2 et 3.

## Refonte étape 1 · W0 cadre web (19 octobre 2026)

Cadre commun de l'espace talent sur tablette et ordinateur (`docs/refonte-web/BRIEF-WEB-CLAUDE-CODE.md`
§ 0, § 2, § 3 ; planches `talent-1` § 0, § 4, § 5 et `talent-4` § 3, § 9 ; valeurs de `web.py`).

- **Un seul code, trois largeurs** (`src/components/talent/shell.tsx`) : téléphone < 768 px inchangé
  (barre du bas) ; tablette 768 à 1199 px : rail d'icônes de 84 px ; ordinateur ≥ 1200 px : barre
  latérale de 232 px (logo, Pour moi · Offres · Orbi en carte avec `Ctrl K` · Apprendre · Suivi,
  séparateur, Messages, Mes CV, Connexions avec pastilles, Paramètres et la carte de l'avatar).
- **Barre du haut** : « Rechercher ou demander à Orbi » avec `Ctrl K`, cloche, messages, avatar qui ouvre
  le **menu de l'avatar** (planche talent-4 § 3).
- **Recherche `Ctrl K`** (fenêtre, sans route) : Orbi d'abord, puis offres et formations, puis tous les
  résultats ; destinations quand rien n'est écrit. Combobox au clavier.
- **Panneau Orbi** à droite par `?orbi=1` sur la route courante (puis `?orbi=<id>`), page complète
  `/app/orbi` avec l'historique à gauche sur ordinateur.
- **Composants génériques** `CenteredDialog` (fenêtre centrée) et `SidePanel` (volet latéral), feuilles
  du bas sur téléphone ; les `.t-sheet` existantes deviennent des fenêtres centrées dès 768 px.
- **Colonne centrée provisoire supprimée** : zone de contenu du cadre (pages au format téléphone à
  760 px de large, `t-large` pour les pages mises en colonnes par les lots suivants).
- Mode sombre du cadre ; e2e `tests/e2e/web-frame.spec.ts` ; tests adaptés : `foundation`, `orbi`,
  `mobile-talent`. Écarts : `docs/decisions/2026-10-19-refonte-etape-1-w0.md`. Captures :
  `captures/etape-1/w0/`.
## Refonte étape 1 · revue des lots mobiles 1 à 6 (19 octobre 2026)

Chaque écran talent des planches `talent-1` à `talent-4` (sections 1 à 6, 5 bis, 9 et 10, hors
abonnement et paramètres) a été capturé à 390 px, clair et sombre, avec le bon compte de démo
(`grace.ux@`, `talent.pro@` pour les écrans payants), puis comparé à la capture de la planche et à son
générateur. Les corrections portent surtout sur des règles CSS de lots successifs qui se marchaient
dessus ; elles sont réunies dans un bloc commenté en fin de `src/styles/talent.css`. Captures finales :
`/mnt/project-files/captures/etape-1/revue-mobile/`. Écarts gardés : `docs/decisions/2026-10-19-refonte-etape-1-revue.md`.

| Écran | Route | État |
|---|---|---|
| Connexion, mot de passe oublié | `/connexion`, `/mot-de-passe-oublie` | conforme (boutons Google et LinkedIn absents en local : fournisseurs non configurés) |
| Inscription, création du compte | `/inscription`, `/inscription/compte` | corrigé : cases à cocher (taille, coche visible, texte Sapin), double cadre de focus des champs |
| Pour moi | `/app` | corrigé : titres longs tronqués sur une ligne (lignes, objectifs), cartes « Recommandées » écrasées à 58 px |
| Offres | `/app/jobs` | corrigé : titre et entreprise sur deux lignes, sous-titre tronqué, pastilles insécables, score à la suite des pastilles ; texte d'aide de la recherche repris de la planche |
| Détail d'offre | `/app/jobs/[slug]` | corrigé : compétences en pastilles sur une ligne qui passe à la suivante |
| Pourquoi ce score | `/app/jobs/[slug]?pourquoi=1` | conforme |
| Postuler | `/app/jobs/[slug]/postuler` | conforme |
| Suivi | `/app/suivi` | corrigé : sous-titres tronqués, date relative « il y a 3 j » (au lieu de « -3 j ») |
| Détail de candidature | `/app/suivi/[id]` | corrigé : libellé « Ouvrir » (planche) pour la conversation |
| Messages, conversation | `/app/messages`, `/app/messages/[id]` | corrigé : lignes tronquées, heure non écrasée, texte des bulles à la bonne taille et couleur |
| Notifications | `/app/notifications` | conforme |
| Apprendre | `/app/learn` | corrigé : tuiles de domaine à 84 px, cartes « Recommandées » à leur hauteur |
| Rechercher une formation | `/app/learn/rechercher` | corrigé : bouton « Voir plus » secondaire centré |
| Mes formations, attestations | `/app/learn/mes-formations` | corrigé : texte et interrupteur de partage visibles sur les cartes d'attestation |
| Parcours | `/app/learn/parcours/[slug]` | corrigé : numéros d'étape lisibles (Sapin, Lime sur étape faite, clair et sombre) |
| Formation | `/app/learn/[slug]` | corrigé : chiffres au-dessus de leur libellé, hauteur du bouton principal |
| Leçon, quiz, exercice | `/app/learn/[slug]/[lecon]` | corrigé : bouton de fermeture × dans l'en-tête du quiz et de l'exercice |
| Attestation (talent et publique) | `/app/learn/attestations/[code]`, `/attestations/[code]` | corrigé : libellé au-dessus de la valeur |
| Compte | `/app/compte` | corrigé : taux de complétion calculé comme sur Pour moi et Mon profil (80 % au lieu de 70 %) |
| Connexions | `/app/compte/connexions` | corrigé : boutons Accepter et Ignorer sous le nom (débordaient) |
| Mon profil | `/app/profil` | corrigé : anneau de complétion centré et lisible, icônes de section visibles en sombre |
| Modifier, aperçu, Faire le point, import | `/app/profil/*` | conforme |
| Diagnostic, plan, entraînements | `/app/career/diagnostic`, `/plan`, `/entretiens*` | conforme |
| CV et documents, lettres, modèles, studio CV | `/app/career/cv*` | conforme |
| LinkedIn | `/app/career/linkedin` | conforme |
| Orbi | `/app/orbi` | conforme |

## Refonte complète · étape 1 (Talent) : diagnostic (19 octobre 2026)

Point de départ : `main` après le lot mobile 6 (PR #103). Ordre fixé par `docs/PLAN-REFONTE-EN-3-ETAPES.md`.

**Écrans talent déjà au nouveau design (mobile, lots 1 à 6, planches inchangées depuis leur code)** :
connexion, mot de passe oublié, inscription, code, premiers pas (`/app/bienvenue`) ; Pour moi (`/app`) ;
Offres, détail, Pourquoi, postuler (`/app/jobs/*`) ; Suivi et détail (`/app/suivi/*`) ; messages,
notifications ; Apprendre, rechercher, mes formations, parcours, formation, salle de cours, quiz,
attestations (`/app/learn/*`, `/attestations/[code]`) ; Compte, Connexions, Mon profil et ses écrans,
Faire le point, diagnostic, plan, entraînements d'entretien, CV et documents, lettres, LinkedIn, studio
CV mobile ; Orbi et son historique. Ils sont revus capture contre planche (390 px, clair et sombre) dans
un lot de revue ; les écarts trouvés y sont corrigés.

**Écrans talent encore à l'ancien design (mobile)** : abonnement, formules et paiement
(`/app/abonnement`, `/app/abonnement/payer`), paramètres (`/app/parametres`), recherche de l'en-tête
(`/app/recherche`), accueil Career (`/app/career`), conseils (`/app/career/conseils`), « Mon espace »
(`/app/espace`), ancien tableau de bord (`/app/tableau-de-bord`, encore 859 lignes derrière sa
redirection), outil testeur (`/app/testeur`), accès refusé. **Manquants** : factures
(`/app/abonnement/factures`), aide (`/app/compte/aide`). Tout cela est le lot mobile 7.

**Ordinateur et tablette** : aucune route talent n'a encore son écran web. Toutes affichent le
rendu provisoire « colonne centrée » des lots mobiles (et l'ancien design pour les pages du lot 7).
À faire : cadre W0 (barre latérale 232 px dès 1200 px, rail 84 px de 768 à 1199 px, barre du haut,
`Ctrl K`, panneau Orbi `?orbi=1`, fenêtres et volets), puis lots web talent 1, 2, Studio CV, 3, 4.

**Ancien design à supprimer (liste vérifiée par recherche d'imports dans chaque lot)** :
- liste provisoire `REDRAWN` et classe `t-ancien` (`src/lib/appearance.ts`), colonne User.theme ;
- ancien Career : `src/app/app/career/page.tsx` (accueil v2), `src/components/career/home/*`,
  `src/components/motion/gauge.tsx`, `radar.tsx` ; `src/app/app/career/conseils` ;
- `src/app/app/espace`, contenu de `src/app/app/tableau-de-bord`, `src/components/app/daily-welcome.tsx`,
  `for-me.tsx`, `skills-input.tsx`, `src/components/layout/account-menu.tsx`, `space-switcher.tsx`
  (si plus rien ne l'importe), `recent-searches.tsx`, `slash-focus.tsx`, `nav-link-styles.ts`,
  `src/components/motion/tab-rail-client.tsx` ;
- ancienne page abonnement et paramètres (`src/components/billing/subscription-section.tsx`,
  `sponsored-card.tsx`, `checkout-form.tsx`, `src/components/account/account-controls.tsx`) une fois
  remplacées ;
- composants talent laissés par le lot 4 dans `src/components/connect/` ;
- textes morts de l'ancien espace talent (`talent.forMe.*`, `talent.jobs.search.*`, etc.).
Hire, partenaire et admin gardent `AppShell` et leurs composants jusqu'aux étapes 2 et 3.

**Plan** : un lot = une branche et une PR. Revue des lots 1 à 6 ; lot mobile 7 ; W0 ; web talent 1,
2, Studio CV, 3, 4 ; rapport de fin d'étape, captures dans `captures/etape-1/`.

## Refonte mobile · lot 6a : Compte, Connexions, Mon profil (19 octobre 2026)

- Compte (`/app/compte`) refait d'après la planche talent-4 § 2 : profil, documents et réseau,
  abonnement et réglages, déconnexion. Connexions (`/app/compte/connexions`) : demandes reçues,
  mes connexions, recherche, écrire, retirer, signaler, bloquer (table `Connection`, conversation
  `peer`).
- Mon profil (`/app/profil`) en sept sections dépliables, avec ses écrans : modifier (photo,
  titre, résumé, pays, ville), expérience, compétence (avec preuve), ce que je cherche, projet
  (fichiers), vu par un recruteur.
- Supprimés : `src/components/profile/intro-form.tsx`, `src/components/profile/phone-overview.tsx`
  (l'éditeur de photo passe dans `src/components/talent/profile/`).
- Deux migrations additives ; aucune donnée retirée. Écarts : `docs/decisions/2026-10-19-refonte-mobile-lot-6a.md`.

## Refonte mobile · lot 6b : faire le point, diagnostic, plan, simulations d'entretien (19 octobre 2026)

- Faire le point (`/app/profil/point`, planche talent-4 § 5) : atouts, points à renforcer et
  prochaine action, calculés sans IA (`career-point.ts`, tests unitaires), avec « Pourquoi ces
  conseils ? ».
- Diagnostic (`/app/career/diagnostic`) redessiné : accueil, questions une à une, analyse, puis
  le résultat (anneau, six notes, « Pourquoi ces notes ? », Refaire, Mon plan). Services
  déterministes inchangés.
- Plan (`/app/career/plan`) : objectif en feuille, étapes numérotées que l'on modifie, coche ou
  retire (`updateStepAction`).
- Entraînements (`/app/career/entretiens`, planche § 5 bis) : quotas écrit et oral, entretien
  prévu, quatre façons de s'entraîner, dernières sessions ; nouveau formulaire (métier, niveau,
  types, format, durée) ; simulation écrite avec conseil d'Orbi, simulation orale (micro,
  transcription relue, aucun son gardé) ; retour sur cinq critères sans note ; version gratuite
  avec conseils et « Voir les formules ».
- Anciens composants supprimés : `career/diagnostic-flow`, `career/voice-answer`,
  `motion/radar-live`, `motion/scan`, `motion/stage-track`, `motion/step-trail`.
- Écarts : `docs/decisions/2026-10-19-refonte-mobile-lot-6b.md`. Specs e2e mises à jour (career,
  talent, accessibility), non lancées ici (base partagée).

## Refonte mobile de l'espace talent · lot 6c : CV et documents, LinkedIn, import et studio CV (19 octobre 2026)

- CV et documents (`/app/career/cv`, planche talent-4 § 6) : onglets CV, Lettres et LinkedIn ;
  chaque CV avec sa vignette, « Principal » et son menu « … » (ouvrir, PDF, CV principal, modèle,
  dupliquer, supprimer) ; « Nouveau CV » en feuille (depuis le profil ou page vierge) et
  « Importer ». Onglet Lettres (`?vue=lettres`) : les lettres et documents, la carte Orbi
  « Préparer mon LinkedIn », « Nouvelle lettre » et « Faire relire un texte » en feuilles.
  `/app/career/documents` redirige vers cet onglet ; une lettre (`/app/career/documents/[id]`) est
  redessinée (corrections à cocher, texte, copier, PDF).
- Préparer LinkedIn (`/app/career/linkedin`, droit `career.linkedin`) : titre et résumé proposés
  avec « Copier », 5 compétences à ajouter (✓ si prouvées sur Jumanly), rien n'est publié.
- Importer un CV (`/app/profil/import`) : PDF ou Word (4 Mo), lu sur le serveur sans être gardé
  (`src/server/services/cv-file.ts`, dépendances `unpdf` et `fflate`), « Depuis LinkedIn » (le PDF
  du profil), puis « Lu dans votre fichier · à vérifier » groupe par groupe et « Ajouter à mon
  profil ».
- Choisir un modèle (`/app/career/cv/modeles`) : familles Tous, Sobres, Colonne, Créatifs,
  vignettes réelles, « Inclus » ou la formule (droit `career.cv.templates.access`, nom lu en base),
  « Utiliser « X » ».
- Studio CV (`/app/career/cv/[id]`) : carte du modèle et « Aperçu », puces couleur, police et
  densité en feuilles, sections à glisser (ou flèches du clavier) avec « Améliorer » sur le
  résumé, barre du bas « Adapter » et « PDF », menu « … » (nom, coordonnées, CV principal, mise
  à jour depuis le profil, dupliquer, supprimer). Avant/après (« Améliorer le résumé ») :
  Refuser, Modifier, Accepter et « Pourquoi ces changements ? ». « Adapter à une offre » (écart
  avec le CV) et « Adapter à un texte » (5 000 caractères, lu comme une donnée) créent une copie
  dont les reformulations restent à valider une par une (droit `career.cv.tailor`).
- Services : `improveCvSummary`, `pendingSuggestions`, `decideSuggestion` avec texte modifié
  (`cv-coach.ts`) ; `tailorCvToText`, `tailorKeywords`, `tailorOffers`, `offerGap`
  (`career-documents.ts`) ; `orderBlocks` (`src/features/cv/style.ts`). Aucune migration.
- Mode sombre et colonne centrée pour ces pages (`src/lib/appearance.ts`) ; barre du bas masquée.
- Supprimés : `src/components/career/cv/` (editor, list, parts, phone-editor, phone-list,
  workbench, pdf-button), `src/components/career/cv-coach-panel.tsx`, `documents-kit.tsx`,
  `ai-gate.tsx`, `src/features/cv/ui/` (ExportPanel, PagesPanel, StylePanel),
  `src/styles/cv-v2.css`. `tests/e2e/cv-v2.spec.ts` devient `cv-documents.spec.ts`.
- Tests : `tests/unit/cv-file.test.ts`, `tests/unit/cv-documents.test.ts` ; e2e mis à jour (non
  lancés dans cette session, la base et le port 3100 servant à une autre) : `cv-documents`,
  `cv-templates`, `career`, `mobile-profil-cv`, `intelligence`, `talent`, `accessibility`,
  `session.ts`.
- Choix et écarts : `docs/decisions/2026-10-19-refonte-mobile-lot-6c.md`.

## Refonte mobile de l'espace talent · lot 5 : Apprendre, salle de cours, quiz, attestations (19 octobre 2026)

- Apprendre (`/app/learn`, planche talent-3 § 1) : la recherche sous le titre, l'accès à « Mes
  formations » et aux attestations, la formation à reprendre, les domaines, les formations
  recommandées. Rechercher (`/app/learn/rechercher`) : filtres rapides, filtres en feuille
  (accès, niveau, durée dont « Moins d'1 h », domaine) et le parcours qu'Orbi suggère.
- Mes formations (`/app/learn/mes-formations`) : en cours, terminées, enregistrées, « À faire »
  (quiz et exercices) ; `?vue=attestations` liste les attestations avec leur vignette.
- Une formation (`/app/learn/[slug]`) : chiffres, « Vous saurez », modules, verrou d'une
  formation au-dessus de la formule (nom de la formule lu en base, premier module gratuit), et
  « Formation terminée » (`?vue=terminee`) avec les compétences ajoutées et une offre.
- Salle de cours (`/app/learn/[slug]/[lecon]`) : vidéo avec la puce de qualité, onglets Leçon,
  Texte, Notes, Fichiers, Orbi en feuille pour expliquer une notion, réglages de la leçon
  (économie de données, lecture sans vidéo, support PDF). Quiz question par question, corrigé
  aussitôt, réponses gardées sur l'appareil hors connexion, résultat « Presque ! » avec les
  leçons à revoir. Exercice à rendre : fichier (PDF ou photo, 4 Mo) ou un de mes CV
  (`ExerciseSubmission`, migration additive).
- Attestation signée (Ed25519, `src/server/services/certificate-signature.ts`, migration
  additive : signature, clé, score, domaine, modules, compétences, « Visible sur mon profil »).
  Dessin d'après la planche attestation (`src/server/pdf/attestation-sheet.ts`) : vignette,
  PDF A4 paysage et image (`/app/learn/attestations/[id]/[apercu|pdf|image]`). Détail et partage
  (LinkedIn, WhatsApp, e-mail, image, lien). Vérification publique : authentique, modifiée,
  retirée ou inconnue. Une attestation masquée n'apparaît plus dans la fiche candidat.
- Parcours (`/app/learn/parcours/[parcours]`) redessiné. Redirigent : `/app/learn/explorer`,
  `/app/learn/parcours`, `/app/learn/evaluations`, `/app/learn/attestations`, `/app/learn/coach`
  (vers Orbi) et les anciennes adresses `?lecon=`.
- Mode sombre pour tout Apprendre. Démo fictive de Grâce : `prisma/seed/apprendre.ts`.
- Supprimés : `src/components/learn/lesson-tabs.tsx`, `lesson-notes.tsx`,
  `lesson-transcript.tsx`, `quiz-panel.tsx`, `course-overview.tsx`, `coach-chat.tsx`,
  `path-card.tsx`, `copy-link.tsx`, `src/app/app/learn/attestations/[id]/pdf/route.ts`
  (remplacée par `[format]`). Le lecteur vidéo reste partagé avec le site public et l'admin.
- Captures 390 px, clair et sombre : `/mnt/project-files/captures/refonte-mobile-lot-5/`.
- Choix et écarts : `docs/decisions/2026-10-19-refonte-mobile-lot-5.md`.

## Refonte mobile de l'espace talent · lot 4 : Postuler, Suivi, messages, notifications (19 octobre 2026)

- Postuler (`/app/jobs/[slug]/postuler`, planche talent-2 § 1) en trois étapes : CV, documents et
  lettre, vérification ; brouillon gardé hors connexion, envoi relancé avec « Réessayer », écran
  « Candidature envoyée ». Postuler reste gratuit, aucun droit ni quota n'est testé.
- Les pièces jointes (attestations, documents) sont figées au moment de l'envoi
  (`Application.attachments`, migration additive) ; un CV adapté à une offre garde son lien
  (`CareerDocument.adaptedForJobId`, migration additive).
- Suivi (`/app/suivi`) : « À faire », en cours, terminées ; une candidature (`/app/suivi/[id]`) :
  étapes, entretien avec créneaux, demandes de documents, messages, retrait.
- Préparer un entretien (`/app/career/entretiens/nouveau` et `[id]`) : brief de l'entretien,
  type et mode d'entraînement.
- Messages (`/app/messages`) et conversation (`/app/messages/[id]`) : recherche, demandes de mise
  en relation en feuille, nombre de messages non lus, invitation avec créneaux à confirmer dans le
  fil, demande de document, décision, envoi de CV, lettre, document, créneau ou lien par « + ».
- Notifications (`/app/notifications`) : aujourd'hui, cette semaine, plus tôt ; nouvelle
  notification « Votre profil a été consulté » (`profileViewed`).
- Mode sombre activé pour ces pages (`src/lib/appearance.ts`). Démo fictive de Grâce :
  `prisma/seed/suivi.ts`.
- Supprimés : `src/components/jobs/apply-flow.tsx`, `send-application.tsx`,
  `application-stats.tsx` ; `src/components/suivi/slot-picker.tsx` déplacé dans
  `src/components/talent/`. Les anciennes pages Messages et Notifications ne servent plus qu'aux
  équipes de recrutement et aux partenaires (`src/components/connect/hire-messages.tsx`,
  `hire-thread.tsx`, `team-notifications.tsx`) ; leurs restes talent partent au lot 7.
  `/app/jobs/candidatures` et `/app/suivi/entretiens/[id]` ne font plus que rediriger.
- Captures 390 px, clair et sombre : `/mnt/project-files/captures/refonte-mobile-lot-4/`.
- Choix et écarts : `docs/decisions/2026-10-19-refonte-mobile-lot-4.md`.

## Refonte mobile de l'espace talent · lot 3 : Pour moi, Offres, détail d'une offre (19 octobre 2026)

- Pour moi (`src/app/app/page.tsx`) d'après la planche talent-1 § 1 : ligne « Objectif »,
  une seule prochaine étape avec l'anneau du profil, groupe « 3 opportunités pour vous » avec le
  score et son « Pourquoi ? », formation en cours, accès rapide. Objectif « compétences » ou
  « reconversion » : la formation à reprendre et « Pour vos objectifs » passent devant les offres.
- Offres (`src/app/app/jobs/page.tsx`) : onglets Pour vous, Récentes, Enregistrées (l'ancienne
  page `/app/jobs/enregistrees` redirige vers `?vue=enregistrees`), cartes avec bannière, logo,
  contrat, mode de travail et score. Filtres en feuille (Domaine = secteur de l'entreprise, Lieu,
  À distance, Contrat, Expérience, entreprises vérifiées) avec « Voir N offres » compté en direct ;
  le bouton de filtres de la recherche affiche le nombre de filtres actifs. « Voir plus d'offres »
  allonge la liste.
- Détail d'une offre (`src/app/app/jobs/[slug]/page.tsx`) : bannière avec retour, partage et
  enregistrer, tête qui reste en haut au défilement, carte de score, « Préparer ma candidature »
  avec Orbi (ce qui correspond, ce qui manque, adapter le CV, rien n'est modifié sans accord),
  missions, compétences demandées (déjà dans le profil ou manquantes), « Pour progresser » (la
  formation qui comble l'écart), profil recherché, vérification, « Signaler cette offre », barre
  « Postuler » toujours visible et toujours gratuite. « Pourquoi 86 % ? », la contestation et le
  signalement s'ouvrent en feuilles au-dessus de l'offre (`?pourquoi=1` depuis une carte).
- Mode sombre activé pour ces pages (`REDRAWN_EXACT` dans `src/lib/appearance.ts`).
- Démo : trois offres fictives des planches (Baobab Fintech, Mwinda Énergie, Fleuve Banque) dans
  `prisma/seed/ux.ts`.
- Supprimés : `src/components/matching/dispute-panel.tsx`, `src/components/jobs/close-details.tsx`,
  la page « Offres enregistrées » (remplacée par une redirection), `TalentJobCard`,
  `FilterChipToggle`, `FilterMenu`, `CountLine`, `relativeLabel` de `talent-kit.tsx`, `TalentWhy`
  et `CriterionList` de `talent-why.tsx`, `skillsToStrengthen`, `hiringCompanies`,
  l'action `clearClosedSavedJobs`. Ne servent plus à Pour moi : `GoalCard`, `VisualTile`,
  `DailyWelcome` et `components/app/for-me.tsx`, encore utilisés par des pages des lots 5 à 7 ;
  supprimés avec elles.
- Captures 390 px clair et sombre : `/mnt/project-files/captures/refonte-mobile-lot-3/`.
- Décision : `docs/decisions/2026-10-19-refonte-mobile-lot-3.md`.

## Refonte mobile de l'espace talent · lot 2 : connexion, inscription, premiers pas (19 octobre 2026)

- Écrans d'accès redessinés d'après la planche talent-4 (`src/app/(auth)/(acces)/`, composants
  `src/components/access/`) : connexion (lien magique, Google, LinkedIn, Apple), double
  authentification, création de compte en un écran (« Prénom et nom », e-mail, mot de passe avec
  barres de solidité et règles), code à 6 chiffres, mot de passe oublié **par code** puis
  « Mot de passe modifié » (les anciens liens restent valables), apparence Auto/Clair/Sombre.
- Premiers pas en 4 étapes (`/app/bienvenue?etape=`) : objectif, études (niveau et domaine,
  migration additive `20261019120000_profile_studies`), lieux (pays dans une feuille avec drapeaux,
  RD Congo d'abord, ville, contrats, mode de travail), puis « Votre espace est prêt » (formule
  gratuite, ou paiement de la formule choisie). Carte « Bienvenue » et toast sur Pour moi les
  14 premiers jours tant que le profil n'est pas à 80 % ou qu'il n'y a pas de CV.
- Les recruteurs gardent l'étape forfait puis le formulaire avec organisation, pays et ville.
- Correctif : les barres fixes du bas n'étaient plus fixes pendant/après l'animation d'entrée
  (une animation de transform restée appliquée en faisait le repère) ; animation en `backwards`.
- Supprimés : `src/components/auth/{entry-screen,auth-entry,auth-stage,forms,password-field,social-buttons}.tsx`,
  `src/components/places/country-picker.tsx`, `src/lib/auth-entry.ts`, `tests/unit/auth-entry.test.ts`,
  le bloc `.jm-ae` de `src/styles/motion.css`, les actions `startSignup` et `requestPasswordReset`,
  `goalForFocus`. Tests de parcours adaptés (`signUpWithEmail`, `finishOnboarding`).
- Captures 390 px clair et sombre : `/mnt/project-files/captures/refonte-mobile-lot-2/`.
- Décision : `docs/decisions/2026-10-19-refonte-mobile-lot-2.md`.

## Refonte mobile de l'espace talent · lot 1 : fondations (19 octobre 2026)

- Nouveau brief (`docs/refonte-mobile/`) : il remplace entièrement l'ancien design talent. Les
  prompts 6 bis à 11 de l'ancien programme sont abandonnés.
- Jetons, surface « verre », barre du bas, en-têtes, recherche, options, boutons, cartes, Orbi
  et états repris de `fondations.css` dans `src/styles/talent.css`. Les 51 icônes de la refonte
  passent par `pnpm brand`.
- Nouvelle coquille talent (`src/components/talent/`) : barre du bas Pour moi · Offres · Orbi ·
  Apprendre · Suivi, grand titre avec cloche, messages et avatar, recherche avec filtres, colonne
  centrée sur ordinateur. Hire, partenaire et admin gardent leur coquille.
- Orbi plein écran (`/app/orbi`) : crédits du mois et quatre aides vers les fonctions existantes.
- Apparence Auto, Clair ou Sombre (page Compte), migration additive `20261019090000_user_appearance`.
- Demandes d'Ephraïm : animations au toucher et au défilement, réponse immédiate des onglets,
  sauvegarde des saisies hors connexion.
- Supprimés : `src/components/layout/{tab-bar,create-sheet,top-menu,phone-header,orbi-search,top-title,theme-root}.tsx`,
  `src/components/opening/opening.tsx`, `src/styles/talent-mobile.css` (thème Vert compris), le menu
  talent de l'avatar, les textes `appNav` de l'ancienne navigation (67 clés) et `opening.*`.
  Déplacés dans `src/components/talent/` : `back-button`, `top-bar-override`, `page-title`.
- Captures 390 px clair et sombre : `/mnt/project-files/captures/refonte-mobile-lot-1/`.
- Décision : `docs/decisions/2026-10-19-refonte-mobile-lot-1.md`.

## Mobile Talent et Jumanly AI · prompt 6 : profil, CV, recherche, notifications (17 octobre 2026)

- Profil sur téléphone (écrans 25-26) : photo (prendre, choisir, recadrer, retirer), « Construire
  mon profil » en 6 étapes, titre et bio enregistrés en quittant le champ (« Enregistré » après la
  réponse du serveur), une partie du profil à la fois. « M'aider à l'écrire » reste inactif
  jusqu'au prompt 8.
- CV (écrans 27-29, 56) : Mes CV en vignettes avec PDF (« PDF… » puis toast), « Créer un CV » (profil,
  import, page vierge, nom), éditeur Contenu / Mise en forme / Aperçu, une section à la fois et
  « Section suivante ».
- Recherche groupée (écran 18) avec onglets, récentes seulement avec le consentement
  « préférences » ; notifications rangées par priorité avec le lien vers les préférences (écran 19).
- `track()` derrière le consentement « analytics », sans fournisseur branché.
- Réseau lent : photo réduite à 512 px dans le navigateur, servie avec un cache long ; nouveaux
  composants client petits (feuille, bouton PDF) ; pages publiques inchangées (budget de 200 Ko
  vérifié par les e2e). Dette signalée : l'espace connecté charge environ 620 Ko de JavaScript
  (mesure locale, même valeur à 3 Ko près sur profil, Mes CV, recherche et notifications), surtout
  le cadre commun de l'application ; à réduire dans un lot dédié.
- Migration additive `20261017052929_profile_photos`, avec retour arrière.
- Tests : base (type de photo, taille, changement d'adresse, retrait), unitaires (`track`), e2e
  « compléter mon profil » et « télécharger mon CV » sur téléphone.
- Décision : `docs/decisions/2026-10-17-mobile-talent-profil-cv.md`.

## Mobile Talent et Jumanly AI · prompt 5 : Suivi, entretiens, messages, décisions (17 octobre 2026)

- Suivi (écran 15) : filtres Tout, Candidatures, Entretiens, Messages ; « À traiter » en tête
  (entretiens à confirmer, documents demandés, messages non lus), états vides avec un personnage.
- Entretiens (écrans 20-22) : confirmer un créneau, proposer jusqu'à trois autres moments,
  confirmation après la réponse du serveur, « Rejoindre » et fichier `.ics`.
- Messages (écrans 16, 23-24) : bouton + (créneau, CV, lettre, document, lien ; relance IA en
  emplacement), cartes de fichier, de créneau et de décision.
- Décisions (écrans 50-55) : refus et embauche passent par un aperçu exact, envoyé au clic du
  recruteur ; carte de décision et « Pour rebondir » côté talent. Modèles de message par
  organisation (`/app/hire/modeles`).
- Migration additive `20261017015124_message_kinds_and_templates`, avec retour arrière.
- Tests : base (isolation des modèles entre organisations, droits, pièces jointes, ordre du suivi,
  embauche), unitaires (repères, `.ics`), e2e refus côté recruteur puis talent, et entretien
  confirmé puis reporté depuis Suivi.
- Décision : `docs/decisions/2026-10-17-mobile-talent-suivi-messages.md`.

## Mobile Talent et Jumanly AI · prompt 4 : offres, candidature, Apprendre (17 octobre 2026)

- Offres (écrans 06-07) : onglets Pour vous (classées par score, ou sélection générale signalée),
  Récentes, Enregistrées ; enregistrement immédiat avec toast « Annuler ».
- Détail d'offre (écran 08) : sections repliables, compétences demandées avec celles du profil
  cochées, carte « Adapter mon CV », barre fixe Enregistrer + Postuler (ou « Reprendre ma
  candidature »).
- Candidature en trois étapes (écrans 09-12) : CV ou profil seul, lettre, vérification par blocs
  avec consentement obligatoire, envoi, confirmation après la réponse du serveur, écran d'erreur
  réseau avec « Réessayer ». Brouillon serveur `ApplicationDraft` à chaque étape, repris depuis
  l'offre, « Pour moi » (prochaines actions) et Suivi.
- Apprendre (écran 13) : formation en cours en tête, recommandées avec « Pourquoi ? », domaines,
  exercices et certificats ; barre fixe sur la fiche formation (téléphone).
- Tests : e2e « trouver une offre et postuler » (onglets, recherche, Annuler, Quitter, reprise,
  coupure réseau, Réessayer) et « reprendre une formation » ; parcours talent et recruteur adaptés
  aux étapes.
- Décision : `docs/decisions/2026-10-17-mobile-talent-offres-candidature.md` (étape Questions
  sautée faute de questions, bloc IA et recherches récentes non affichés, plafond de 120 offres
  pour le classement).

## Mobile Talent et Jumanly AI · prompt 3 : objectif et « Pour moi » (16 octobre 2026)

- Écran d'objectif à la première connexion (`/app/bienvenue`, écrans 01-02) : une question, trois
  réponses en cartes, « Plus tard » ; étape 2 facultative (métiers, compétences du référentiel,
  lieux, contrat, télétravail). Rangé dans `TalentProfile.goal`, sans migration ; `homeFocus(goal)`.
- « Pour moi » remplace le tableau de bord sur `/app` (resté à `/app/tableau-de-bord`) : carte
  objectif à chiffres réels, puis l'ordre de l'objectif (offres, formations, outils en cartes
  visuelles, prochaines actions ; ou reprise de formation, formations, offres liées, progression ;
  ou postes, « Me positionner », spécialisation, compétences à renforcer). Aucun sous-titre de
  section. Offres non personnalisées signalées comme telles.
- Pas de barre du bas sur l'écran d'objectif (il a sa barre d'action).
- Tests : unitaires `homeFocus`/`goalForFocus`, e2e inscription → objectif → Pour moi, puis
  changement d'objectif ; anciens tests passés de « Accéder à mon espace » à « Plus tard ».
- Décision : `docs/decisions/2026-10-16-mobile-talent-objectif.md` (domaines et niveau
  d'expérience de la maquette 02 non posés : aucun référentiel ni champ ; éléments sans donnée
  réelle non repris).

## Mobile Talent et Jumanly AI · prompt 2 : navigation (16 octobre 2026)

- Téléphone : barre du haut de 52 px (logo sur Pour moi, titre de la section ailleurs, recherche,
  notifications, avatar) et barre du bas à quatre destinations (Pour moi, Offres, Apprendre, Suivi),
  zones de 56 px, actif sur Lime, pastille réelle sur Suivi. Nouvelle icône `jm-suivi`.
- Menu de l'avatar (écran 34) : Messages (pastille des non-lus), Mon profil, Mes CV, Tableau de bord,
  Paramètres, « Tout Mon espace », Se déconnecter ; Échap, toucher dehors, focus piégé,
  `aria-expanded`. Sur ordinateur, le menu du compte reprend ces raccourcis.
- Nouvelles pages : `/app/espace` (écran 17 : profil et complétude, outils carrière en cartes
  visuelles avec cadenas selon la formule, acquis, compte, sélecteur d'espace) et `/app/suivi`
  (à traiter, candidatures, messages, offres enregistrées ; contenu complet au prompt 5).
- Tableau de bord déplacé tel quel à `/app/tableau-de-bord` ; `/app` l'affiche jusqu'au prompt 3.
- Ordinateur : colonne = quatre destinations + Career. Hire et Partenaire inchangés.
- Décision : `docs/decisions/2026-10-16-mobile-talent-navigation.md` (barre du bas sous 768 px et
  non jusqu'à `lg`, contrairement au plan).
- Reste : la ligne Jumanly AI du menu de l'avatar (prompt 7).

## Mobile Talent et Jumanly AI · prompt 1 : socle visuel (16 octobre 2026)

- Boutons de la planche « Boutons » ajoutés au `Button` existant : `principal` (dégradé Sapin →
  Émeraude, rond Lime et flèche), `accent` (dégradé Lime, texte Sapin), `soft`, `outline`, `link`,
  `ai`, `dangerOutline` ; tailles L, M, S ; états repos, appui, en cours, fait, désactivé (gris plat).
- Identité IA : `AiChip` (plein ou suggestion) et `AiSignature`, réservés à Jumanly AI.
- Cartes de la planche « Cartes » : `GoalCard`, `ProfileCard`, `VisualTile`, `AiBento`, `FileCard`,
  `SlotCard`, `DecisionCard` (`src/components/ui/visual-cards.tsx`). Textes et chiffres fournis par
  l'appelant ; un chiffre absent n'est pas affiché.
- Appui visible unique : `Pressable` et `.jm-pressable` (fond Lime clair, contour Lime, 0,98, 120 ms,
  couleur seule en animations réduites ; indicateur de chargement après 300 ms).
- Jetons dans `src/styles/surfaces.css`, sans nouvelle couleur. Tout est visible sur `/dev/composants`
  (trois nouvelles sections) ; aucune page n'a changé. Décision :
  `docs/decisions/2026-10-16-mobile-talent-socle.md`.
- Les maquettes HTML de `docs/ux-mobile-talent/maquette/` sont exclues de Prettier, comme les autres.

## Mobile Talent et Jumanly AI · prompt 0 : diagnostic et plan (16 octobre 2026)

- Diagnostic du code existant et plan des 9 prompts dans `docs/ux-mobile-talent/PLAN.md` :
  composants à créer et à réutiliser, migrations prévues (`application_drafts`,
  `message_kinds_file_slot_decision`, `hire_message_templates`, `assistant_conversations`,
  `interview_practice_notes`), risques, tests existants à adapter.
- Écarts proposés : étendre le `Button` existant au lieu d'un nouveau composant, réutiliser
  `/app/bienvenue` pour l'écran d'objectif, barre du bas visible jusqu'à `lg`, Hire et Partenaire
  inchangés.
- Aucun code modifié.

## Learn v2 · étape 3 : reprendre une vidéo à la seconde près (16 octobre 2026)

- Table `LessonProgress` (migration `learn_lesson_progress`, retour arrière
  `docs/learn-v2/retour-arriere/etape-3-reprise-video.sql`) : la position de lecture de chaque
  leçon vidéo, par apprenant. Les leçons terminées restent dans `Enrollment.completedLessons`.
- Le lecteur envoie la position toutes les 15 secondes de lecture, à la pause, à la fin et quand on
  quitte la page (`navigator.sendBeacon`) vers `POST /api/learn/position` (valider → session →
  inscription et formule → service ; même origine uniquement).
- En revenant sur la leçon, la vidéo repart à la seconde près, avec « Reprise là où vous vous étiez
  arrêté, à 03:12 » et « Reprendre au début ». Pas de reprise dans les 5 premières secondes ni dans
  les 10 dernières.
- Correction : une leçon avec une vraie vidéo plantait (la liste des vitesses était importée d'un
  fichier client par une page serveur). Elle vit maintenant dans `course-bits.ts`.
- Test e2e avec une petite vidéo fictive (`tests/e2e/assets/lecon-fictive.webm`, 8 Ko) servie par le
  test, et une formation fictive créée puis supprimée par `tests/e2e/make-video-course.ts`.

## Learn v2 · étape 2 : les parcours (16 octobre 2026)

- Un parcours enchaîne plusieurs formations dans un ordre conseillé (Domaine → Parcours →
  Formation). Tables `LearningPath`, `LearningPathCourse`, `LearningPathFollow` (migration
  `learn_paths`, retour arrière `docs/learn-v2/retour-arriere/etape-2-parcours.sql`). Aucune table
  existante modifiée.
- Un parcours n'ouvre aucun accès : chaque formation garde son niveau (`learn.catalog.level`).
  Une étape que la formule n'ouvre pas s'affiche « Disponible avec … ».
- Talent : section « Parcours » dans Explorer (et sur la page d'un domaine), page
  `/app/learn/parcours/[parcours]` avec les étapes, la progression et « Commencer » ou
  « Continuer » (inscrit à la formation suivante si elle est ouverte), « Parcours suivis » en
  haut de « Mes parcours », « Ne plus suivre » qui garde les inscriptions.
- Admin : `/admin/formations/parcours` (éditeur de contenu et administrateur) : créer, présenter,
  ranger dans un domaine et une collection, ajouter, déplacer et retirer des formations, publier
  (présentation et deux formations publiées au moins), repasser en brouillon, archiver. Chaque
  action est journalisée. Pas de suppression : on archive.
- Démo (local et previews) : parcours fictif « Décrocher son premier emploi (démo) ».
- La validation par Jumanly avant publication (statut « Validé ») viendra à l'étape 5, pour les
  formations comme pour les parcours.

## Learn v2 · étape 1 : domaines et lignes éditoriales (16 octobre 2026)

- Analyse du module Learn et plan en quatre phases : `docs/learn-v2/PLAN.md`.
- Les 7 domaines (Career & Employability … Skills Monetisation & Freelancing) sont créés par la
  migration `learn_domains` ; les formations existantes sont rangées d'après leur thème. Aucune
  table ni donnée supprimée. Décision : `docs/decisions/2026-10-16-learn-v2-domaines.md`.
- Explorer : rangée « Domaines » avec le nombre de formations, page de domaine, panneau
  « Filtres » (niveau, durée, langue, accès, compétence, ligne éditoriale).
- Cartes : nom du domaine et badge « Expert Series » ou « Partner Programs ».
- Admin : `/admin/formations/domaines` (éditeur de contenu et administrateur ; suppression par
  l'administrateur seulement, journalisée) ; domaine et ligne éditoriale dans la fiche formation.
- Tests : unitaires (filtres), en base (domaines, filtres, suppression sans perte de formation),
  e2e (catalogue par domaine, filtres, administration, accessibilité).

## Test utilisateur · étapes 4 et 5 : fin de module et finitions (16 octobre 2026)

- Lecteur : terminer la dernière leçon d'un module (ou réussir son quiz) affiche une petite
  célébration « Module N terminé, bravo » sur la première leçon du module suivant
  (`finishedModule`, paramètre `module=`). Les exercices métier facultatifs ne comptent pas.
- Tableau de bord talent : sur grand écran, « Votre parcours » passe en vertical à côté de la carte
  IA et se termine par « Votre prochaine étape » : plus de grand blanc.
- Partenaire : sous les données masquées, la règle des 10 bénéficiaires et le moyen d'y
  arriver (distribuer des codes depuis « Gérer les licences »).
- Hire : « À traiter » vide propose « Revoir les candidats » (ou « Publier une offre ») ; le
  scénario UX fige le score des candidatures comme le vrai parcours, la compatibilité moyenne
  s'affiche.
- Petits liens (« Pourquoi ? », « Tout voir », « Signaler cette offre ») : zone tactile invisible
  de 44 px sur écran tactile (`.jm-tap`), sans changer leur apparence.
- Captures : `/mnt/project-files/ux-test/captures/etape-4-5/`.

## Test utilisateur · étapes 2 et 3 : académie Learn et Coach IA (16 octobre 2026)

- Learn devient une académie en six espaces (onglets du haut) : Mon espace, Explorer, Mes parcours,
  Exercices et évaluations, Coach IA, Certifications. Décision :
  `docs/decisions/2026-10-16-academie-learn-coach.md`.
- Mon espace : prochaine leçon en un clic avec l'anneau de progression, chiffres (formations,
  leçons, évaluations réussies, attestations), « À faire maintenant », dernière attestation, autres
  formations en cours, recommandations de l'IA.
- Explorer ne met plus en avant une formation déjà suivie ou terminée.
- Coach IA (`learn_coach`) : sur sa page et sous chaque leçon ; expliquer, reformuler, exemple,
  question, exercice, erreur, révision ; réponses tirées du cours, « Pourquoi ? » avec les leçons
  utilisées ; jamais les réponses des évaluations.
- Lecteur : « Leçon terminée » n'a plus l'air d'un bouton.
- Les étapes 2 et 3 du plan sont livrées ensemble : la page Évaluations renvoie vers le Coach.

## Test utilisateur · étape 1 : le clic qui répond (16 octobre 2026)

- Test utilisateur complet (5 profils, ordinateur, téléphone, réseau lent) : prompt, rapport et
  plan dans `/mnt/project-files/ux-test/`. Constat principal : entre un clic et la page suivante,
  rien ne bougeait (jusqu'à 1,2 s sur réseau lent), d'où les clics répétés.
- Scénario de démonstration `prisma/seed/ux.ts` (local et previews seulement) : 5 talents,
  5 entreprises avec leur recruteur, 5 offres, 5 formations avec un vrai contenu de leçon, 5
  partenaires ; comptes `*.ux@jumanly.test`, mot de passe de démo habituel.
- Écrans de chargement `loading.tsx` pour `/app` et `/admin` : l'adresse change tout de suite et la
  page prend sa forme pendant que les données arrivent.
- `NavigationFeedback` (racine) : barre fine en haut de l'écran dès qu'un lien ou un formulaire de
  recherche ouvre une page, lien marqué `data-nav-pending` jusqu'à l'arrivée du contenu.
- `Button` de type envoi : roue et blocage du second clic pendant l'envoi (`PendingMark`,
  `useFormStatus`).
- Effet « enfoncé » sur tous les boutons, liens-boutons et onglets (`src/styles/feedback.css`),
  remplacé par un changement de teinte quand les animations sont réduites.
- Barre du haut : avec un sélecteur d'organisation, la grande recherche n'apparaît qu'à partir de
  1536 px (icône en dessous) ; elle ne s'écrase plus en un « / » sous le sélecteur.

## Jumanly Admin v4 · étape 8, lot D : admin (16 octobre 2026)

- `AdminTabs` (onglets de toutes les pages d'admin), les familles de forfaits et la vue
  galerie/liste des formations passent au sélecteur segmenté partagé ; plus d'onglets soulignés.
- `AdminPageHeader` accepte une action en haut à droite ; le tableau de bord l'utilise pour
  « Traiter : {premier élément à traiter} », seulement quand il y a quelque chose à traiter.
- Les filtres restaient déjà des boutons bordés à flèche (`FilterMenu`) ; la colonne d'icônes
  dense est conservée.
- Captures avant et après : `/mnt/project-files/captures/admin-v4/etape-8/`.

## Jumanly Admin v4 · étape 8, lot C : compte (16 octobre 2026)

- Sélecteur segmenté sur les filtres de Connect, les onglets de Notifications et ceux de
  Paramètres sur téléphone.
- Filtre « Demandes de mise en relation » de Connect raccourci en « Demandes », pour tenir en entier
  dans la colonne (demande du propriétaire).
- Connect : bouton « Reprendre avec {nom} » en haut à droite, vers la conversation non lue la plus
  récente (ou la dernière).
- Abonnement et Recherche inchangés : leur contenu suit déjà la méthode (pas d'index des factures
  vers lequel pointer).
- Captures avant et après : `/mnt/project-files/captures/admin-v4/etape-8/`.

## Jumanly Admin v4 · étape 8, lot B : recruteur et partenaire (16 octobre 2026)

- Sélecteur segmenté partagé sur les onglets d'Offres, d'Organisation, les vues d'Entretiens, les
  périodes des rapports Hire et les lots de licences.
- Tableau de bord Hire : bouton « Voir N nouveaux candidats · {offre} » en haut à droite, quand
  une offre a des candidatures non vues.
- Espace partenaire : bouton « Voir le rapport détaillé » en haut à droite.
- Captures avant et après : `/mnt/project-files/captures/admin-v4/etape-8/` (1440 et 390 px, sans
  défilement horizontal).

## Jumanly Admin v4 · étape 8, lot A : pages Talent à la manière du Diagnostic (16 octobre 2026)

Prompt : `/mnt/project-files/admin-v4/PROMPT-pages-partout.md` (lot A sur quatre).

- Nouveau sélecteur segmenté partagé (`src/components/ui/segmented.ts`) : onglets de Learn, de
  « Mes candidatures » et de Jobs ; il servira aux lots B à D.
- Nouveau bouton de titre `HeaderAction` (`src/components/app/header-action.tsx`) : « Reprendre ma
  formation » (tableau de bord, Learn), « Ouvrir mon CV principal », « Revoir mon dernier
  entretien », « Ouvrir mon dernier document », seulement quand l'élément existe.
- Profil : anneau de progression plus grand et bouton Lime « Compléter : {section} » vers la
  première section manquante.
- LinkedIn et Entretiens : l'encadré Jumanly Intelligence devient une phrase.
- Captures avant et après : `/mnt/project-files/captures/admin-v4/etape-8/` (1440 et 390 px, sans
  défilement horizontal).

## Jumanly Admin v4 · étape 7 : finitions visuelles (16 octobre 2026)

Prompt : `/mnt/project-files/admin-v4/PROMPT-finitions.md` (cinq captures du propriétaire).

- Colonne d'icônes plus haute et plus large (78 px, rubriques de 46 px, icônes de 22 px), dégradé
  plus contrasté avec un reflet sur le bord, rubrique active avec halo et trait plus long.
- Sous-menu du haut dans une barre-pilule blanche bordée ; chaque onglet a son icône ; l'onglet
  courant est plein (dégradé Sapin, texte blanc).
- Champs de saisie : bordure Sapin à 20 % (au lieu de Brume) dans `inputClasses`, `SearchField`,
  `TopSearch`, et par une règle de `admin.css` pour les champs écrits à la main dans les espaces
  connectés. La recherche de Jobs devient une barre blanche à deux cases nettes et bouton intégré.
- Filtres de Jobs en vrais boutons (bordure, flèche, coche quand actif) ; « Filtres » sur fond
  Brume ; « Tous / Recommandées / Récentes » en sélecteur segmenté ; « Trier » en bouton bordé.
- « Vos candidatures » (Jobs et Mes candidatures) : barres de progression de l'envoi à l'offre,
  quatre tuiles avec le chiffre en grand et la part atteinte (« 2 sur 5 »), état vide avec un lien
  vers les offres (`src/components/jobs/application-stats.tsx`).
- Captures dans `/mnt/project-files/captures/admin-v4/etape-7/`, aucun débordement à 390, 768 et
  1440 px.

## Compte passe-partout : le mode testeur (16 octobre 2026)

Demande du propriétaire : un compte unique pour essayer lui-même chaque forfait, de Free à Premium,
côté talent comme côté entreprise, plus l'administration. Décision :
`docs/decisions/2026-10-16-compte-passe-partout.md`.

- Variable `TESTER_EMAILS` : les adresses listées et vérifiées voient « Mode testeur » dans le menu
  du compte, qui ouvre `/app/testeur` (404 pour tous les autres).
- Sur cette page : choisir n'importe quel forfait talent pour soi, créer une organisation de test et
  lui donner n'importe quel forfait RH ou Entreprise, créer une institution partenaire de test,
  ouvrir l'administration. Aucun paiement : un abonnement « accordé par l'administration » d'un an.
- Choisir un forfait, même celui en cours, remet les quotas à zéro. Company Premium reçoit les
  limites d'un contrat d'essai (sinon tout vaut 0). Chaque changement est inscrit au journal d'audit
  (`subscription.tester`, `org.tester`).
- Tests : `tests/unit/tester.test.ts`, `tests/db/tester.test.ts`.
- Point ouvert : une licence Partners active plus chère que le forfait choisi garde la priorité
  (règle normale de résolution).

## Accueil du diagnostic de carrière, plus direct (16 octobre 2026)

Demande du propriétaire (trois captures de `/app/career/diagnostic`), prompt dans
`/mnt/project-files/admin-v4/PROMPT-diagnostic.md`.

- Celui qui a déjà un bilan le retrouve tout de suite : bouton « Revoir mon dernier bilan » en haut
  à droite, puis un premier bloc « Votre dernier bilan » (score sur 100 en grand, étape atteinte,
  date, évolution par rapport au bilan v2 précédent, « Voir mon bilan complet »). Les diagnostics
  précédents passent du bas de la page à côté de ce bloc.
- Carte de lancement raccourcie : une accroche (« Où en êtes-vous vraiment ? », ou « Refaites le
  point » pour un talent qui revient), une ligne durée et confidentialité, trois accroches avec
  icône, la case « profil et CV » avec une ligne d'aide, un seul bouton principal.
- Jumanly Intelligence en une phrase sous le bouton (l'orbe et la phrase), à la place du grand
  encadré vert ; le message de forfait devient une petite ligne avec « Voir les formules ».
- Données réelles seulement : score, dates et évolution viennent des diagnostics enregistrés.

## Jumanly Admin v4 · étape 6 : responsive et passe finale (16 octobre 2026)

- Tablette (à partir de 768 px) : la colonne d'icônes et le menu horizontal remplacent l'en-tête
  vert et la pilule du bas, dans l'espace connecté comme dans l'admin ; la recherche s'ouvre depuis
  une icône (page `/app/recherche`, qui porte désormais son propre champ).
- Téléphone (390 px) : icône loupe dans l'en-tête, pilule du bas inchangée.
- Grand écran (1920 px) : le menu du haut s'aligne sur la largeur du contenu (1400 px).
- Changement d'espace dans la barre du haut : logo seul sous 1280 px, pour laisser la place aux
  onglets (le nom reste lu par les lecteurs d'écran).
- Message du jour du tableau de bord : n'occupe plus de place une fois replié (plus de ligne vide
  sous le titre), style clair.
- Vérifié : aucun défilement horizontal à 390, 768, 1280, 1440 et 1920 px sur 12 pages (talent,
  recruteur, partenaire, admin) ; captures dans `/mnt/project-files/captures/admin-v4/etape-6/`.
- Guide admin mis à jour (colonne, menu du haut, recherche, tablette, espace des utilisateurs).
- Reste à faire (prompt des finitions, `/mnt/project-files/admin-v4/PROMPT-finitions.md`) : colonne
  plus haute, sous-menu plus visible, champs et filtres plus marqués, statistiques des candidatures.

## Jumanly Admin v4 · étape 5 : les grands bandeaux deviennent des cartes légères (16 octobre 2026)

- Les gros blocs sombres en tête de page sont remplacés par des cartes blanches à bordure fine,
  sans illustration ni motif : accueil Career (parcours en 4 étapes, score du CV, prochaine étape,
  boutons ; la phrase d'accroche passe sous le titre de page), Mes CV (chiffres et boutons),
  accueil du diagnostic (la scène animée reste à droite), formation mise en avant de Learn,
  objectif du plan de progression, formule actuelle dans Mon abonnement, « Votre prochaine étape »
  du tableau de bord.
- Studio formations (admin) : vignettes des cartes moins hautes (16/7).
- Menu horizontal : les onglets qui ne tiennent pas s'estompent à droite et défilent ; la
  recherche est un peu plus étroite entre 1024 et 1536 px pour laisser la place aux onglets.
- Espaces recruteur, partenaire et admin : déjà en cartes claires après les étapes 3 et 4,
  vérifiés à l'écran sans autre changement.
- Hauteur à 1440 × 900 (étape 4 → étape 5, en px) : `/app` 1238 → 1206, `/app/career`
  2292 → 1978, `/app/learn` 1610 → 1486, `/app/abonnement` 1344 → 1277, `/admin/formations`
  4793 → 4562. Mes CV 1784, diagnostic 1582, plan 900 (tient dans l'écran).
- Captures : `/mnt/project-files/captures/admin-v4/etape-5/`.

## Jumanly Admin v4 · étape 4 : palette épurée et éléments plus légers (16 octobre 2026)

- Espaces connectés et admin (`.jm-admin-bg`, `src/styles/admin.css`) : fond Crème plus clair
  (`#f7f5f0`), halos et motif de points atténués, cartes blanches à bordure fine et ombre très
  légère, barre du haut plus transparente.
- Typographie : le « gras » passe en semi-gras (600) dans ces espaces ; sur ordinateur, l'unité
  d'espacement du contenu baisse de 0,25 à 0,23 rem (marges et hauteurs un cran plus serrées).
- Grand fond animé sous les titres (`UniverseBackdrop`) retiré.
- Contraste : surtitre de l'accueil Hire et liens de retour (offre, candidat) passés en couleurs
  sombres, ils étaient prévus pour l'ancien bandeau foncé.
- Hauteur des pages à 1440 × 900 (avant → après, en px) : `/app` 1292 → 1238, `/app/career`
  2341 → 2292, `/app/jobs` 2020 → 1923, `/app/learn` 1671 → 1610, `/app/profil` 3432 → 3214,
  `/app/abonnement` 1424 → 1344, `/admin` 2175 → 2095, `/admin/utilisateurs` 3590 → 3439,
  `/admin/formations` 4954 → 4793. Le reste du gain viendra de l'étape 5 (gros blocs sombres
  encore présents dans certaines pages).
- Écart : jetons posés sur la coque connectée et non dans `tokens.css`, pour ne pas toucher les
  pages publiques (`docs/decisions/2026-10-16-admin-v4-etape-4.md`).

## Jumanly Admin v4 · étape 3 : titres, recherche et profil inspirés de Patreon (16 octobre 2026)

- Titres de page sans bandeau (`UniverseHeader`, `AdminPageHeader`) : petite tuile au dégradé de la
  colonne, surtitre, titre en semi-gras, une ligne de sous-titre, actions à droite ; chiffres clés
  de l'admin en petites pastilles blanches.
- Recherche large et arrondie dans la barre du haut (`TopSearch`), raccourci « / » : espace
  connecté → nouvelle page `/app/recherche` (formations, offres, conversations, groupées) ; admin
  → `/admin/recherche`.
- Compte en bas de la colonne : avatar, nom et forfait en infobulle, menu qui s'ouvre à côté
  (profil, abonnement, paramètres, administration, déconnexion). Dans l'admin, avatar et rôle.
- Page profil : couverture fine, avatar, nom, titre, ligne d'informations, puis les parties du
  profil en onglets horizontaux (ancres vers chaque partie : un seul formulaire par partie reste).
- Test `tests/e2e/admin-v4.spec.ts`.

## Jumanly Admin v4 · étape 2 : nouvelle coque des espaces connectés (16 octobre 2026)

- Colonne d'icônes partagée `src/components/layout/icon-rail.tsx` (celle de l'admin v3) : l'espace
  connecté la reprend pour tous les forfaits (talent, recruteur, partenaire), avec Paramètres et
  Se déconnecter en bas. Le forfait ne change pas le design, seulement les outils ouverts (droits).
- Menu secondaire horizontal `src/components/layout/section-nav.tsx`, collé en haut de la page :
  sous-rubriques de la rubrique active (Mon espace, Learn, Career, Jobs, Hire, Partenaire ; dans
  l'admin, les rubriques du même groupe et « Coûts et revenus »), onglet courant souligné du
  dégradé de la colonne ; à droite, espace, notifications et compte. Configuration
  `src/config/section-navigation.ts`.
- Les pastilles Career sous le titre (`CareerTabs`) sont retirées : le menu horizontal les remplace.
  Les outils que le forfait garde fermés portent un cadenas dans ce menu (lu dans les droits).
- Fond clair à halos de l'admin pour tout l'espace connecté ; pilule du téléphone en dégradé.

## Jumanly Admin v4 · étape 1 : l'admin se voit tout de suite (16 octobre 2026)

- Plan `docs/admin-v4/PLAN.md` (6 étapes : synchronisation, nouvelle coque des espaces connectés,
  titres et recherche inspirés de Patreon, palette épurée, application à tous les écrans,
  responsive).
- Inventaire `docs/admin-v4/synchronisation.md` : chaque élément de l'admin, les pages qui
  l'affichent et ce qui les rafraîchit.
- Corrigé : droits et quotas gardés 60 s dans la mémoire de chaque instance (un forfait ou un droit
  modifié pouvait tarder sur une autre instance) → gardés le temps d'une requête
  (`docs/decisions/2026-10-16-admin-v4-etape-1.md`) ; les poids du matching n'effaçaient pas le cache
  de la page publique ; les réglages et questions de quiz n'effaçaient pas celui des formations.
- Test : un droit accordé ailleurs s'applique à la requête suivante.

## Jumanly Admin v3 · étape 7 : passe finale et bilan (16 octobre 2026)

- Parcours automatique `tests/e2e/admin-pass.spec.ts` étendu : les 7 étapes de l'éditeur, les
  cinq PDF avec les trois rôles (administrateur et éditeur : oui ; support : page introuvable et
  404), le Studio et l'éditeur à 1024 px. Vérifié aussi en mouvement réduit
  (`pnpm test:e2e:reduced` sur admin-v3 et admin-pass).
- `docs/guide-admin.md` : description du nouveau menu (colonne flottante, pilule sur téléphone) et
  section « Créer une formation de A à Z » (modèles, 7 étapes, documents PDF, PDF générés,
  publication).

### Bilan Admin v3 (étapes 1 à 7)

Menu en colonne d'icônes arrondie et en dégradé, habillage de tous les écrans aux couleurs du site,
Studio formations avec modèles, éditeur par étapes, PDF à joindre, cinq PDF générés, guide à jour.

### Écarts restants

- Fichiers de 4 Mo au plus (limite d'hébergement) au lieu de 10 Mo : un envoi direct vers un
  stockage externe lèvera la limite.
- Le cache des PDF générés vit en mémoire : il repart de zéro à chaque redémarrage du serveur.
- Pas de date d'activité par inscrit : le bilan indique où les inscrits s'arrêtent, pas depuis
  quand.
- Une leçon ne change pas de module avec les flèches (on la recrée dans l'autre module).

## Jumanly Admin v3 · étape 6 : PDF générés pour chaque formation (16 octobre 2026)

- Gabarit commun `src/server/pdf/course-kit.tsx` : bandeau en dégradé profondeur avec le
  pictogramme Jumanly, filet dégradé en haut des pages suivantes, pied de page avec jumanly.io et
  les deux e-mails de contact (aucun téléphone), date de génération et numéro de page.
- Cinq PDF (`src/server/pdf/course-pdfs.tsx`, données dans `src/server/services/course-pdf.ts`) :
  programme (public), support de cours complet (inscrits dont le forfait ouvre la formation),
  quiz et corrigé, aperçu de l'attestation avec filigrane « Aperçu », bilan de la formation
  (30, 90, 365 jours ou depuis la création ; aucun nom).
- Routes : `/formations/[slug]/programme`, `/app/learn/[slug]/support`,
  `/admin/formations/[id]/pdf/[kind]` (équipe Learn, chaque téléchargement journalisé
  `course.pdf.download`).
- Encart « PDF de la formation » dans l'éditeur (colonne de droite et étape Publication), liens
  « Télécharger le programme » sur la fiche publique et la page de la formation, « Télécharger le
  support de cours » dans le lecteur.
- Tests : `tests/db/course-pdf.test.ts` (contenu, bilan sans nom, cache, texte lu avec `pdftotext`
  quand il est installé) et e2e « PDF générés » (droits route par route). Captures et exemples de
  PDF dans `captures/admin-v3/etape-6`.
- Décisions : `docs/decisions/2026-10-16-admin-v3-etape-6.md`.

## Jumanly Admin v3 · étape 5 : PDF à joindre aux formations (16 octobre 2026)

- Nouvelle étape **Documents** dans l'éditeur (7 étapes) : envoi d'un PDF avec titre, type
  (support, exercices, lecture, modèle, corrigé, autre), leçon de rattachement et visibilité
  (tout le monde, inscrits dont le forfait ouvre la formation, équipe). Option « ressources
  spécialisées » testée par le droit `learn.resources.specialized`, jamais par un nom de forfait.
- Contrôles du fichier : 4 Mo au plus, vrai PDF (signature), lisible, non protégé par mot de passe ;
  le nombre de pages est lu et affiché. Un corrigé reste toujours à l'équipe.
- Ordre, modification, remplacement du fichier et suppression, chaque action journalisée
  (`course.document.*`). Les documents d'une leçon se gèrent aussi dans le panneau de la leçon.
- Téléchargement par `/formations/documents/[id]` : stockage privé, règle `documentAccess`, compteur
  de téléchargements. Les documents visibles s'affichent sur la fiche publique, sur la page de la
  formation et dans le lecteur (par leçon et pour toute la formation).
- Nouvelle table `CourseDocument` (migration `20261016003017_admin_course_documents`).
- Tests : `tests/db/course-documents.test.ts` (fichiers, visibilités, accès en base) et e2e « documents
  PDF » dans `tests/e2e/admin-v3.spec.ts`. Captures dans `captures/admin-v3/etape-5`.
- Décisions : `docs/decisions/2026-10-16-admin-v3-etape-5.md`.

## Jumanly Admin v3 · étape 4 : éditeur de formation par étapes (16 octobre 2026)

- L'éditeur `/admin/formations/[id]` est découpé en **6 étapes** (`?etape=`) : Informations,
  Public et objectifs, Programme, Quiz, Attestation, Publication (Documents arrive à l'étape 5).
  Colonne des étapes à gauche (pastilles à faire défiler sur téléphone), chaque étape cochée quand
  elle est complète ; « Prête à publier ? » à droite (anneau, ce qui manque avec un lien vers
  l'étape, aperçu, dupliquer) ; boutons « Étape précédente / suivante ». Le bandeau montre le titre,
  le statut, les modules, les leçons et la durée.
- La fiche est répartie entre Informations et Public et objectifs ; chaque étape renvoie la fiche
  entière (les champs non affichés partent en champs cachés), rien n'est perdu.
- **Programme** : un bloc par module avec ses totaux, flèches pour monter ou descendre un module ou
  une leçon (`moveModule`, `moveLesson`, journalisés), ajout de leçon en pied de module, renommer et
  supprimer repliés ; la leçon s'ouvre dans un **panneau** à côté du programme (`?lecon=`).
- **Quiz** : la liste des quiz du programme, leurs questions et leur seuil, ceux à compléter ; les
  questions s'éditent dans le même panneau. **Attestation** : le réglage, ses conditions et un
  **aperçu** de l'attestation (nom et numéro fictifs). **Publication** : récapitulatif des étapes,
  « Publier », changement de statut avec un **motif facultatif** gardé dans le journal, historique.
- Correctif : la colonne des étapes ne provoque plus de défilement horizontal sur téléphone (les
  textes pour lecteurs d'écran sortaient du conteneur défilant).
- Tests : déplacements en base ; e2e « éditeur par étapes », parcours Learn adapté aux étapes, passe
  admin sur chaque étape.

## Jumanly Admin v3 · étape 3 : Studio formations, galerie et création (15 octobre 2026)

- `/admin/formations` devient le **Studio formations** : bandeau avec les formations publiées, les
  brouillons, les inscriptions et attestations des 30 derniers jours ; **galerie** de cartes
  (couverture, ou couverture générée dans un dégradé de la marque selon le thème ; statut ; niveau
  de catalogue ; durée ; modules et leçons ; inscrits, achèvement, quiz, attestations) avec
  l'anneau « prête à publier » des brouillons ; bascule **Galerie / Liste** (`?vue=liste`, la liste
  compacte d'avant) qui suit les filtres.
- **Nouvelle formation** : page `/admin/formations/nouvelle` (titre, thème avec suggestions,
  niveau, langue, niveau de catalogue) et **modèle de départ** dessiné en blocs : formation courte
  (1 module, vidéo, lecture, quiz), parcours certifiant (3 modules terminés par un quiz, évaluation
  finale, attestation), atelier pratique (vidéo et deux exercices), partir de zéro. Les modules et
  leçons créés ont des titres provisoires venant des textes ; rien n'est inventé ni publié.
  « Dupliquer une formation » sur la même page. Service `createCourseFromTemplate`, testé en base.
- Le simple champ « Titre » de l'ancienne liste est remplacé par cette page (e2e Learn adapté).
- Captures : `/mnt/project-files/captures/admin-v3/etape-3/`.

## Jumanly Admin v3 · étape 2 : habillage de tous les écrans (15 octobre 2026)

- **Tableau de bord** : bandeau avec une phrase de contexte et trois chiffres (éléments à traiter,
  utilisateurs actifs, revenu mensuel récurrent) ; premier chiffre clé sur le dégradé signature ;
  file « Ce qui demande votre attention » avec tuiles en dégradé ; barres des forfaits utilisés en
  dégradé de la couleur de chaque famille.
- **Cartes** : toutes les cartes blanches de l'admin prennent l'ombre douce `jm-admin-card` (les
  anneaux `ring-*` sont conservés : l'ombre passe par les variables de Tailwind). Lignes de tableau
  éclairées au survol.
- **Fiches** utilisateur et organisation : voile Lime en tête de carte (`jm-admin-fiche`).
  **Historique** et journal en frise (un trait relie chaque action). **Actions sensibles** : liseré
  Corail à gauche.
- **Confirmations** (`AdminDone`) : carte blanche à anneau Lime, coche qui se dessine (immobile en
  mouvement réduit), lien « Voir dans le journal » conservé.
- **États vides** (`AdminEmpty`) : un personnage de la marque (Amani par défaut) avec la tuile de
  l'icône.
- Captures : `/mnt/project-files/captures/admin-v3/etape-2/` (12 écrans, 1440 et 390 px).

## Jumanly Admin v3 · étape 1 : coque et identité visuelle (15 octobre 2026)

- **Plan** `docs/admin-v3/PLAN.md` : 7 étapes (coque, habillage, Studio formations, éditeur par
  étapes, PDF à joindre, PDF générés, passe finale), une PR chacune.
- **Menu en colonne flottante** (`src/app/admin/layout.tsx`) : 68 px de large, hauteur qui suit
  son contenu, centrée verticalement, extrémités entièrement arrondies, dégradé vertical Sapin →
  `#14745f` → Émeraude adouci (`--jm-degrade-rail`, `src/styles/admin.css`), trame de points. Icônes
  seules, groupées par thème (pilotage, comptes, offre, contenus, contrôle) avec un point
  séparateur ; libellé en infobulle au survol et au focus clavier (CSS, sans JavaScript), nom
  accessible sur chaque lien ; rubrique active en pastille Lime avec un trait lumineux. Fenêtre
  basse : icônes plus serrées, puis défilement dans la colonne.
- **Fond** clair aux halos Lime et Émeraude avec la trame de points du site ; contenu jusqu'à
  1400 px. **En-tête de page** en bandeau vert profond (dégradé profondeur, halo, points), titre
  blanc, surtitre Néon, recherche et compte translucides, chiffres facultatifs (`stats`).
- **Kit** : cartes à ombre douce (`jm-admin-card`), tuiles d'icônes en dégradé signature, chiffres
  clés plus grands, états vides avec tuile en dégradé ; entrée douce des blocs (coupée en
  mouvement réduit, sans effet une fois jouée pour ne pas gêner les menus déroulants).
- **Téléphone** : en-tête vert profond, pilule du bas en dégradé.
- Test e2e `tests/e2e/admin-v3.spec.ts` (noms accessibles, colonne plus courte que la fenêtre,
  infobulle au focus, menu réduit de l'éditeur de contenus). Captures :
  `/mnt/project-files/captures/admin-v3/etape-1/`.

## Jumanly Admin v2 · étape 9 : passe finale (15 octobre 2026)

- **Parcours automatique** `tests/e2e/admin-pass.spec.ts` : 27 écrans de l'admin (onglets et fiches
  compris) à 1440 px et 390 px. Chaque écran s'ouvre, a un seul titre, aucun défilement
  horizontal, aucune clé de texte brute, aucune erreur d'accessibilité WCAG 2.2 AA (axe), et la
  touche Tab atteint un élément visible.
- **Corrigé** : `/admin/recherche` débordait de 96 px sur téléphone (une colonne de grille sans
  largeur minimale autour des résultats tronqués).
- `tests/e2e/admin.spec.ts` complet et `pnpm test:e2e:reduced` relancés.
- `docs/decisions/2026-10-15-refonte-lot-13.md` à jour : ce que le lot 13 n'avait pas construit
  l'est maintenant, étape par étape ; restent hors de l'admin les textes de l'interface.
- **Guide du propriétaire** `docs/guide-admin.md` : vérifier un compte, offrir un forfait, ajouter
  une formation, modérer, traiter un signalement, partenaires, IA, contenus, journal.

## Jumanly Admin v2 · étape 8 : partenaires, IA et contenus (15 octobre 2026)

- **Partenaires** : « Modifier le partenaire » (nom, type) et motif obligatoire à la création d'un
  lot, gardés dans le journal. Chaque lot ouvre sa **fiche** : licences prévues, utilisées, en
  cours, codes distribués non utilisés, restantes, expirées, retirées, puis l'impact des
  bénéficiaires (personnes actives, formations terminées, attestations, candidatures, embauches),
  chaque chiffre masqué sous le seuil du lot (10 personnes au moins), comme dans l'espace partenaire.
  « Modifier le lot » (nom, référence, montant ; début seulement avant qu'il commence) et
  « Prolonger le lot » : les licences en cours arrêtées à l'ancienne fin vont jusqu'à leur durée,
  les codes non utilisés expirés avec le contrat redeviennent utilisables. Service
  `src/server/services/admin-partners.ts`.
- **IA** : crédits consommés et personnes par fonction et par forfait (à partir de `AiUsage`),
  lignes de même nom regroupées ; « Coût par forfait » : coût par personne sur 30 jours comparé au
  prix mensuel, alerte à partir de 30 % ; budget du mois facultatif (`AI_MONTHLY_BUDGET_USD`,
  alerte à 80 % et au-delà de 100 %) ; nombre de comptes qui ont épuisé leurs crédits ; modèles
  affichés en lecture seule depuis `AI_MODEL_DEFAULT` et `AI_MODEL_FAST`.
- **Contenus** : onglet « Conseils de préparation » : les six sujets prévus par `textes/` (et des
  fiches ajoutées), écrits ici, publiés ou en brouillon, avec motif. Les fiches publiées s'ouvrent
  pour tous les talents, gratuitement, sur `/app/career/conseils` ; la carte de l'accueil Career
  reste « Bientôt disponible » tant qu'aucune fiche n'est publiée. **Versions** : chaque
  enregistrement (FAQ, bannières, fiches) garde la version d'avant dans `ContentVersion`
  (migration `admin_content_versions`) ; « Restaurer » la remet en ligne avec un motif, journalisé,
  et garde aussi la version remplacée.
- Tests : unitaires (coût par forfait, sujets des fiches), en base (modifier un partenaire, début de
  lot figé, prolongation, fiche de lot, versions et restauration, fiche conseil), e2e (lot prolongé
  et partenaire renommé, fiche publiée puis restaurée, page IA). Captures dans
  `captures/admin-v2/etape-8`.

## Jumanly Admin v2 · étape 7 : modération (15 octobre 2026)

- **Correction demandée** : nouveau statut d'offre `changes_requested` (migration
  `admin_moderation_changes_requested`), distinct du refus. Le modérateur coche les points à
  corriger et écrit un motif ; le recruteur les voit sur son offre, la liste et le formulaire, puis
  la publie de nouveau : elle repart en vérification même sans signal. Notification
  `jobChangesRequested`. Onglet « Correction demandée » et historique des échanges (journal) sur la
  fiche. Refuser ou dépublier demande désormais un motif côté serveur.
- **Avis du contrôle automatique** avec son « Pourquoi ? » : la règle repérée, en clair, et le
  rappel que l'humain décide. File triée par gravité puis ancienneté, « Précédente / Suivante » et
  raccourcis J et K.
- **Signalements** : gravité en trois niveaux, compteurs par statut, file la plus grave et la plus
  ancienne d'abord. Contexte d'un message (deux avant, deux après) lu seulement sur demande et
  journalisé ; texte complet d'une offre ; auteur du contenu avec « Suspendre l'auteur » (fiche
  utilisateur de l'étape 3). Notes internes (le signalement passe « En cours »). Clôture toujours
  avec une décision (classer, avertir l'auteur, masquer le contenu) et un motif ; les doublons sur
  le même contenu sont clôturés ensemble ; l'auteur averti reçoit un e-mail, chaque personne qui a
  signalé une notification et un e-mail, sans détail sur l'auteur.
- Tests : unitaires (gravité, ordre), en base (correction puis renvoi, contexte, note, clôture),
  e2e (offre corrigée puis refusée, signalement de bout en bout, support en lecture seule).
  Captures dans `captures/admin-v2/etape-7`.

## Jumanly Admin v2 · étape 6 : formations (15 octobre 2026)

- **Parcours guidé** : carte « Prête à publier ? » en tête de l'éditeur, avec une jauge (part des
  contrôles remplis) et six étapes (informations, public et objectifs, programme, quiz,
  attestation, publication), chacune cochée ou avec ce qui manque et un lien vers l'endroit où le
  remplir. Le public et les objectifs sont conseillés, ils ne bloquent pas.
- **Contrôle avant publication** : titre, résumé et description, une leçon, le formateur, des
  questions dans chaque quiz, un quiz avec questions si l'attestation est activée, une image de
  couverture. Un message clair par manque.
- **Couverture** envoyée depuis l'ordinateur avec la fiche (PNG, JPEG, WebP, 4 Mo) : recadrée en
  16:9 et convertie en WebP en 480, 960 et 1440 px (`sharp`), servie par `/medias/…` avec un cache
  long. L'ancienne est supprimée.
- **Vidéo d'une leçon** : avec Bunny Stream configuré, le navigateur envoie le fichier directement
  (TUS signé par le serveur) puis la leçon affiche l'état de l'encodage. Sans hébergeur, une petite
  vidéo (4 Mo) passe par le site ; une adresse https reste possible. Sous-titres : la transcription.
- **Aperçu « comme un talent »** (`/admin/formations/[id]/apercu`), sans inscription ni progression.
- **Dupliquer** : copie en brouillon du programme et des quiz, sans apprenants ni couverture.
- **Chiffres** dans la liste : inscrits, part qui termine, moyenne au quiz, attestations.
- Seul un administrateur révoque une attestation (l'éditeur ne voit plus le bloc).
- Tests : unitaires (contrôles, jauge, type de vidéo), en base (4 : copie, chiffres, couverture,
  vidéo) et e2e (couverture avant publication, aperçu, copie, pas de révocation pour l'éditeur).
  Captures dans `captures/admin-v2/etape-6`.

## Jumanly Admin v2 · étape 5 : forfaits et abonnements (15 octobre 2026)

- **Forfaits** : « Nouveau forfait » (part des droits du premier forfait de la famille) et
  « Dupliquer » ; le forfait créé est masqué, non vendu, prix « sur devis » pour un nouveau, dernier
  de sa famille. Chaque modification demande un motif ; « Versions du forfait » liste qui a changé
  quoi (avant → après, champs et droits) et pourquoi. Nombre de comptes et lien « Voir les comptes ».
  Un forfait qui a déjà servi (abonnement, paiement, licence) ne se supprime pas : il se retire de
  la vente. Le forfait gratuit d'une famille n'est ni supprimé ni retiré.
- **Abonnements** : fiche (`?abonnement=`) en frise (créé, payé, renouvelé, échec, remboursé,
  actions de l'admin, en retard, résilié, terminé) ; prolonger (nouvelle date de fin, deux ans au
  plus, un abonnement en délai de grâce redevient actif), changer de forfait (tout de suite ou à
  l'échéance), résilier (à l'échéance ou tout de suite avec `returnedToFree`), paiement manuel
  (virement ou espèces, migration `admin_manual_payment_methods`) confirmé par
  `applyPaymentStatus` : période, facture, reçu et notification comme un paiement en ligne. Motif
  obligatoire, e-mail au client (`mail.subscriptionAdmin.*`), journal d'audit.
- **Indicateurs** en tête : actifs, en retard, à renouveler sous 7 jours, revenu du mois.
- Libellés des moyens de paiement centralisés (`src/lib/payment-method.ts`) ; le reçu n'écrit plus
  « Carte » en dur.
- Tests : unitaires (date de fin, versions), en base (6) et e2e (forfait, abonnement, support en
  lecture seule). Captures dans `captures/admin-v2/etape-5`.

## Jumanly Admin v2 · étape 4 : organisations (15 octobre 2026)

- **Justificatifs** : l'organisation joint des PDF ou images à sa demande de vérification (onglet
  Vérification, 4 Mo par envoi, 6 au plus), reconnus par leurs premiers octets. Stockage derrière
  l'interface `src/server/storage` (pilote `database` par défaut, `fake` pour les tests).
  L'administrateur les ouvre depuis la fiche ; chaque ouverture est journalisée.
- **Demander un complément** : nouveau statut « complément demandé » (onglet dédié), message à
  l'organisation par notification et e-mail ; sa réponse remet la demande « en attente ».
- **Suspension** (motif obligatoire) : offres en ligne fermées et mémorisées, espace recrutement
  fermé à ses membres (page 403 dédiée), candidats et membres prévenus ; les candidatures restent
  visibles des talents. **Réactivation** : les offres fermées par la suspension reviennent en ligne
  si leur date limite n'est pas passée.
- **Fiche** : membres et rôles (liens vers leurs fiches), forfait et quotas, offres en ligne avec
  leurs candidatures, liens vers les abonnements et la modération, historique.
- Tests : unitaires (type de fichier, nom), en base (justificatifs, complément, suspension) et e2e
  (parcours admin complet ; envoi d'un justificatif dans le parcours de vérification existant).

## Jumanly Admin v2 · étape 3 : utilisateurs (15 octobre 2026)

- **Vérifier un utilisateur** : la fiche montre l'état du compte (e-mail vérifié ou non, double
  authentification, moyens de connexion, dernière connexion, organisations, attestations obtenues).
  Actions : renvoyer le code de vérification, marquer l'e-mail comme vérifié à la main (motif
  obligatoire), envoyer un lien de réinitialisation du mot de passe.
- **Droits et quotas** : nouvelle carte qui liste chaque droit du compte, sa valeur, la
  consommation de la période et son origine (forfait payé, licence, forfait offert, forfait
  gratuit, ajout manuel). Les droits ont désormais des noms en français (`admin.entitlement.*`).
- **Forfait offert** jusqu'à une date (abonnement `sponsored`, source `admin`), retirable ;
  **crédits ajoutés** sur un quota de la période jusqu'à une date (`EntitlementOverride`),
  retirables.
- **Export des données** d'une personne en JSON (même contenu que « Télécharger mes données »,
  désormais dans `src/server/services/personal-data.ts`), journalisé.
- **Suppression du compte** en deux temps (motif, puis e-mail saisi) : anonymisation, candidatures
  et paiements conservés sans données personnelles. Impossible sur soi, sur le dernier
  administrateur et sur un propriétaire d'organisation. Nouveau statut `deleted`.
- **Corrigé** : les suppressions demandées depuis Paramètres n'étaient jamais exécutées après les
  30 jours de délai. La tâche horaire (`/api/jobs/billing`, `pnpm jobs:billing`) les exécute
  maintenant.
- **Liste** : colonne « Vérification », comptes supprimés à part (filtre « Supprimé »), export CSV
  de la sélection ou de la liste filtrée, journalisé.

## Jumanly Admin v2 · étape 2 : indicateurs intelligents (15 octobre 2026)

- **Tableau de bord `/admin`** : quatre chiffres clés en tête (utilisateurs actifs, revenu mensuel
  récurrent, conversion Free vers payant, dépenses IA), puis « Ce qui demande votre attention » :
  paiements en attente, signalements, contestations de score, vérifications, offres à modérer, pic
  de dépenses IA et abonnements qui expirent, classés du plus urgent au moins urgent, chacun avec
  son « Pourquoi ? » et un lien « Traiter ».
- **Forfaits utilisés** : nombre de comptes par forfait et par famille (Talents, RH, Companies,
  Partners), forfaits gratuits compris, part, variation sur la période et part offerte (licences) ;
  chaque forfait ouvre la liste de ses comptes.
- **Coûts et rentabilité** : nouvelle page `/admin/indicateurs/couts` où l'administrateur saisit ses
  coûts du mois (acquisition, hébergement, IA hors Jumanly, autres), journalisés. Le tableau de bord
  en déduit le coût d'acquisition client, le coût de fonctionnement par utilisateur actif et la
  marge brute. Table `PlatformCost` (migration `admin_platform_costs`).
- Export CSV des indicateurs complété (actifs, coûts, comptes par forfait).
- Tests : unitaires (priorité, pic IA, montants, prorata), en base (forfaits utilisés, ordre des
  urgences, coûts) et e2e (forfaits et saisie des coûts).

## Jumanly Admin v2 · étape 1 : socle et recette (15 octobre 2026)

- **Recette** : `tests/e2e/admin.spec.ts` ouvre les 14 écrans avec l'administrateur, le support et
  l'éditeur de contenus, puis suspend, réactive et change le rôle d'un compte fictif créé pour
  l'occasion (`tests/e2e/make-account.ts`), enregistre les poids du matching, cherche et exporte le
  journal. Les autres actions (forfait, remboursement, vérification, partenaire et lot, formation,
  FAQ et bannière) restent couvertes par leurs parcours, relancés sans régression.
- **Corrigé grâce à la recette** : le support voyait « Formations » et « Contenus » dans le menu
  mais tombait sur une page introuvable (liens retirés pour ce rôle) ; le motif des nouveaux poids
  du matching n'était pas enregistré dans le journal ; la liste des utilisateurs s'arrêtait aux 50
  premiers sans moyen d'aller plus loin (pagination ajoutée) ; les rôles s'affichaient en code
  (`org_owner`) au lieu de mots.
- **Kit v2** (`src/components/admin/kit.tsx`) : chiffres clés en tête de page (`AdminStats`),
  pagination (`AdminPager`), état vide avec action (`AdminEmpty`), confirmation avec lien « Voir
  dans le journal » (`AdminDone`, utilisée sur les pages qui confirment une action).
- **Journal d'audit** : `/admin/journal` (administrateur et support) avec filtres auteur, action,
  cible, période, export CSV journalisé ; encadré « Historique » sur les fiches utilisateur,
  organisation, forfait et formation (`src/components/admin/audit.tsx`).
- **Recherche globale** : `/admin/recherche`, branchée sur le champ de l'en-tête (ordinateur et
  téléphone) ; l'éditeur de contenus ne cherche que les formations, le support tout sauf elles.
- Compte de démonstration ajouté : `support@jumanly.test` (rôle Support, lecture seule).

## Jumanly Admin v2 · plan par étapes (15 octobre 2026)

- Inventaire page par page de `/admin` et plan en 9 étapes avec un prompt prêt à coller par étape :
  `docs/admin-v2/PLAN-ADMIN.md`. Aucun code modifié : le propriétaire envoie les étapes une par
  une.

## Refonte visuelle · passe de cohérence finale (15 octobre 2026)

- Parcours automatique de 70 pages (public, talent, recruteur, partenaire, admin) à 1440 et 390 px :
  aucun débordement horizontal, aucune image cassée, un seul titre h1 par page, aucun texte brut
  (clé) visible, aucun numéro de téléphone.
- Titres d'onglet : 36 pages (espace connecté, pages « introuvable », hors ligne, vérification
  d'attestation) n'affichaient pas « · Jumanly ». Elles passent par le modèle de titre commun.
  Nouveau texte : `certificate.verify.seo.title`.
- Forme décorative `forme-orbites-blanc` inexistante (404 sur le matching et les offres) : remplacée
  par la forme Lime passée en blanc par filtre CSS.
- `/app/career/cv/modeles` sans CV renvoyait une page introuvable : redirige vers « Mes CV ».
- Restent volontairement : les mentions entre crochets des pages légales (relecture juridique
  attendue) et la colonne « Clé » de l'admin des contenus.

## Refonte visuelle · lot 14 : pages système et e-mails (15 octobre 2026)

- 404 (maquette 08-01) : code en dégradé Signature, Fatou perplexe, recherche en pilule (envoyée
  vers `/offres`, ou `/formations` pour une formation retirée) ; variantes « offre retirée » et
  « formation retirée » (`not-found.tsx` sous `/offres/[slug]` et `/formations/[slug]`) ; dans
  l'espace connecté, la même page garde le gabarit de l'application (`src/app/app/not-found.tsx`).
- 403 (08-02) : nouvelle page `/app/acces-refuse`. Une page Hire ou partenaire ouverte depuis
  l'espace personnel y mène (avant : retour silencieux à l'accueil). « Changer d'espace » ouvre le
  sélecteur d'espace de l'en-tête. Un rôle insuffisant dans l'organisation reste une 404 (on ne
  révèle pas la page).
- 500 (08-03) : gabarit minimal sans dépendance au layout, aussi pour `global-error.tsx`. Ses textes
  viennent de `messages/fr.systeme.json`, généré par `pnpm messages` avec `fr.json`.
- Maintenance (08-04) : page `/maintenance` ; `MAINTENANCE_MODE=1` (avec `MAINTENANCE_UNTIL` et
  `MAINTENANCE_CITY`) au moment du build y renvoie toutes les pages.
- Hors ligne (08-05) : bandeau Nuit en haut du panneau principal avec « Réessayer », toast
  « Connexion rétablie. », avis unique « Connexion lente », page `/hors-ligne` en carte avec le mode
  économie de données (réglage de l'appareil : vidéos en qualité réduite).
- E-mails (08-06) : gabarit 600 px, en-tête Sapin, carte blanche, bouton Lime, pied « essentiel »
  ou lien vers les préférences, images en PNG (`public/marque/email/`). Bienvenue avec bandeau
  illustré, invitation à un entretien avec la carte du poste. Logique d'envoi inchangée.
- Textes ajoutés : `system.404.searchPlaceholder`, `system.404.pageTitle`,
  `system.403.pageTitle`, `system.500.footer`, `system.maintenance.badge`,
  `system.maintenance.timezone`, `system.offline.dataSaverOn`, `system.offline.dataSaverHint`,
  `foundation.sampleEmail`, `foundation.sampleMode`.
- Écarts restants : voir `docs/decisions/2026-10-15-refonte-lot-14.md`.

## Inscription bloquée en production (15 octobre 2026)

- Le propriétaire voyait « Un problème est survenu de notre côté » à la création du compte,
  pour tous les profils. Seule différence de la production : la vérification des mots de passe
  divulgués (Have I Been Pwned). Quand ce service ne répond pas, Better Auth lève une erreur
  interne que l'inscription transformait en ce message, sans rien écrire dans les journaux.
  Reproduit en local avec un build de production et le service injoignable.
- La vérification laisse passer le mot de passe si le service ne répond pas en 4 secondes ou
  échoue (un mot de passe divulgué reste refusé) et journalise l'incident ; toute autre erreur
  de l'inscription est journalisée. Note : `docs/decisions/2026-10-15-verification-mots-de-passe.md`.

## Envoi des e-mails par une boîte mail (17 octobre 2026)

- Le propriétaire trouve Resend trop lourd (compte, DNS). Ajout d'un adaptateur **SMTP**
  (`nodemailer`) : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`. Ordre de choix : Resend,
  puis SMTP, sinon factice. Solution recommandée pour démarrer : la boîte infojumanly@gmail.com
  avec un mot de passe d'application (marche à suivre dans `docs/deploiement-vercel.md`).

## Envoi réel des e-mails (15 octobre 2026)

- Le propriétaire ne recevait pas ses codes : `RESEND_API_KEY` n'était pas renseignée en
  production, donc l'adaptateur factice écrivait les e-mails dans les journaux. Le code d'envoi
  Resend existait déjà ; marche à suivre ajoutée dans `docs/deploiement-vercel.md`.
- L'erreur Resend garde désormais la raison du refus, et un message d'erreur apparaît dans les
  journaux Vercel si la clé manque en production.

## Refonte lot 13 : Jumanly Admin (15 octobre 2026)

- Les 11 pages de `/admin` refaites d'après les maquettes 07-01 à 07-11 : cadre (barre Nuit avec
  tuile Lime et tag « Administration », en-tête mobile Sapin, pilule flottante), puis Indicateurs,
  Utilisateurs, Organisations, Forfaits et droits, Abonnements, Formations, Modération des offres,
  Partenaires, IA et matching, Contenus, Signalements. Kit partagé `src/components/admin/kit.tsx`.
- Indicateurs : période, comparaison, activité mensuelle, « À traiter », familles et forfaits,
  dépenses IA par fonction, export CSV (`src/server/services/admin-dashboard.ts`).
- Motif obligatoire ajouté à la révocation d'attestation et à la publication de FAQ.
- Textes : `admin.header.*`, `admin.sensitive.*`, `admin.nav.more`, `admin.nav.mobile`, et des
  compléments dans chaque section admin.
- e2e mis à jour : `payments`, `partners`, `launch`, `hire-advanced`.
- Captures 1440 et 390 px : `/mnt/project-files/captures/refonte-lot-13/`.
- Écarts et éléments non construits : `docs/decisions/2026-10-15-refonte-lot-13.md`.

## Connexion v2 et générique d'entrée (15 octobre 2026)

- `/connexion` et `/inscription` refaits d'après `docs/refonte-connexion/` (remplace les maquettes
  02-01 et 02-04) : un seul écran d'entrée, scène animée à gauche (sélecteur Talent · RH ·
  Entreprise, orbite d'avatars, bulle, trois cartes, personnage du profil) et formulaire à droite
  avec onglets Connexion / Inscription. Le profil vient de `?profil=`, puis du dernier choix
  (stockage local), sinon Talent, et reste synchronisé entre la scène et le formulaire. Les
  autres étapes de l'inscription gardent l'ancien cadre (groupe de routes `(auth)/(etapes)`).
  `LoginForm`, `MagicLinkForm` et `PasswordField` sont seulement rhabillés.
- Fournisseurs **Apple** et **LinkedIn** à côté de Google, chacun affiché seulement si ses
  variables existent (`.env.example`, marche à suivre dans `docs/deploiement-vercel.md`). Une
  seule action `signInWithProvider` ; un nouveau compte social reprend l'inscription à l'étape
  forfait (nom de l'organisation demandé là pour RH et Entreprise).
- **Générique d'entrée** (`AppIntro`) après chaque connexion (`?arrivee=1`) : complet une fois
  par compte (`User.introSeenAt`, migration `user_intro_seen_at`), court ensuite, jamais en
  animations réduites (message d'accueil à la place). « Revoir la présentation » dans les
  paramètres. Chargé à la demande.
- Textes : `auth.entry.*`, `auth.stage.*`, `auth.social.*`, `signup.entry.*`, `intro.*`,
  `settings.display.replayIntro.*`.
- Tests : unitaires `auth-entry` et `app-intro` ; e2e `connexion-v2.spec.ts` (profil synchronisé,
  inscription jusqu'au forfait, générique complet puis court, « Passer », `Échap`, animations
  réduites). Les autres parcours passent le générique (`tests/e2e/fixtures.ts`, `skipIntro`).
  Captures 1440 et 390 px : `/mnt/project-files/captures/connexion-v2/`.
- Décisions : `docs/decisions/2026-10-15-connexion-v2.md` (LinkedIn, règles du générique, écarts).

## Mes CV et éditeur de CV v2 (15 octobre 2026)

- `/app/career/cv` refait d'après `docs/refonte-career/BRIEF-CV-V2.md` et les maquettes
  `mes-cv-v2` : hero Profondeur (CV créés « {count} sur 10 », score du CV principal, éventail des
  vignettes des modèles utilisés, Orbi, Amani « montre »), grande carte du CV principal (vignette,
  modèle, ATS, score et ses trois critères réels, « Pourquoi ce score ? »), grille des autres CV
  (vignette inclinée qui se redresse, score en pastille, menu « … »), carte « Nouveau CV » avec le
  nombre restant (masquée à la limite), bandeau des modèles (total, inclus selon les droits,
  polices). Composants dans `src/components/career/cv/`.
- `/app/career/cv/[id]` refait d'après `editeur-cv-v2` : barre d'atelier collante (sélecteur de
  CV, « Enregistré », Nouveau, Dupliquer, « … », Télécharger le PDF ; en mobile, barre d'action
  fixe au-dessus du menu bas), trois colonnes (Contenu / Mise en forme avec pilule glissante,
  plan de travail collant avec compteur de pages, zoom et plein écran, colonne coach / export /
  pages / adapter). Les sections affichent leur contenu réel ; la section ouverte est surlignée
  sur la feuille, jamais dans le PDF. `StylePanel`, `PagesPanel` et `ExportPanel` ne changent que
  d'habillage (densité dessinée, polices écrites dans leur police, pastilles de 30 px).
- 47 textes ajoutés (`career.cv.list.*`, `criteria.*`, `progress.*`, `preview.*`…).
- Tests : `tests/e2e/cv-v2.spec.ts` (liste, menu « … », limite de 10 avec `fill-cvs.ts` ;
  éditeur : vue dans l'adresse, surlignage, PDF sans surlignage, barre collante, mobile), aussi en
  animations réduites. Captures 1440 et 390 px : `/mnt/project-files/captures/cv-v2/`.
- Décisions et écarts : `docs/decisions/2026-10-15-refonte-mes-cv.md` (colonne de droite non
  collante, nombre de pages absent de la liste car non enregistré).

## Refonte visuelle · lot 12 A : Tarifs et demande de devis (15 octobre 2026)

- `/tarifs` refait d'après la maquette 05-01 : les quatre familles sont empilées (ancres `#talents`,
  `#rh`, `#companies`, `#partners`) et non plus en onglets ; les segments du hero suivent la famille
  visible et collent sous l'en-tête au défilement (`PricingFamilyNav`, petit composant client).
  Cartes Blanc, Sapin, Lime et Nuit (`src/components/site/tarifs.tsx`) : la couleur vient des
  données du forfait (recommandé → Sapin, sur devis → Nuit, dernier d'une famille de quatre →
  Lime), jamais de son nom. Comparatifs repliés, celui des Talents déplié sur grand écran.
  Connecté, la carte de sa formule (personnelle, ou de l'organisation possédée) affiche « Votre
  formule actuelle » (lecture de session dans un `Suspense`, la page reste prérendue).
- `/contact?sujet=devis` ouvre la demande de devis Company Premium (maquette 05-06) : formulaire en
  deux colonnes (`QuoteForm`, textes `quote.*`), besoins particuliers, carte Nuit du forfait lu en
  base, confirmation. Champs obligatoires : organisation, nom, fonction, e-mail, pays,
  utilisateurs, consentement ; nombres validés (`quoteSchema`). Envoi par e-mail à la boîte pro,
  comme avant ; préremplissage organisation, nom, e-mail et pays si l'utilisateur est connecté.
- Non repris (aucune fonction derrière, ou hors périmètre) : la fenêtre de devis dans
  l'application (en-tête d'espace de la maquette), l'icône dans la liste des pays.

## Refonte visuelle · lot 12, partie B : abonnement et paiement (15 octobre 2026)

Maquettes `docs/maquettes/05-forfaits-paiement/` (05-02 à 05-05). Présentation seulement : mêmes
routes, mêmes actions, même prestataire factice. Captures 1440 et 390 dans
`/mnt/project-files/captures/refonte-lot-12/`.

- **Mon abonnement** : bande « Candidater reste gratuit », carte Sapin de la formule actuelle
  (anneau des jours restants, période, échéance, moyen du dernier paiement réussi, « Votre formule
  comprend » tiré des textes du `contentKey`), quotas (Feuille, Ambre dès 80 % avec l'alerte
  `quota.warn`, Corail à 100 %), tuiles « Changer de formule », informations de facturation,
  historique en tableau (liste sur téléphone). « Résilier » ouvre le panneau de résiliation
  (`?resilier=<famille>`, sans JavaScript) ; « Passer à Free » y mène aussi. Carte « Vous êtes
  revenu à Free » pendant 30 jours après la fin d'une formule payante.
- **Paiement** (`/app/abonnement/payer`) : indicateur d'étapes, tuiles de moyen de paiement,
  tuiles d'opérateurs à initiales, récapitulatif à droite (à gauche en haut sur téléphone), attente
  Mobile Money avec minuteur et vérification, carte de résultat (personnage, pastille) pour succès,
  échec et délai dépassé, encadré « débité mais non activé ». L'inscription (étape 5) garde la mise
  en page en une colonne.
- 18 textes ajoutés (`billing.*`, `checkout.*`). Décisions et écarts :
  `docs/decisions/2026-10-15-refonte-lot-12-paiement.md`.

## Refonte lot 12 (partie C) · Espace partenaire (15 octobre 2026)

Maquettes 06-01 à 06-03. Captures 1440 et 390 dans `/mnt/project-files/captures/refonte-lot-12/`
(`partenaire-*.png`).

- **Tableau de bord** : bandeau de confidentialité, 4 cartes KPI (comptage animé), tuiles d'usage
  agrégé (hachurées quand masquées), bloc Sapin « Embauches déclarées », barres mensuelles
  (`MonthBars`), liste des lots avec barre d'activation, bloc « Données masquées », contact.
  Filtre « Tous les lots » (menu sans JavaScript) : `partnerDashboard` accepte un `batchId`
  pour l'usage et les mois ; les mois sont extraits dans `monthlyActive()` (même seuil).
- **Licences** : sélecteur de lot en puces, carte Sapin avec anneau d'activation, formulaire de
  codes, confirmation en ligne, tableau des codes (colonnes réduites sur mobile), lien
  d'invitation copiable, zone d'import CSV (`FileDrop`), bilan de vérification après envoi
  (l'action renvoie aussi le nombre d'adresses valides), totaux des invitations.
- **Rapports** : filtres période et lot en menus, carte « Ce que contiennent ces rapports »,
  quatre sections numérotées en tuiles, barres mensuelles, thèmes en barres (part des
  bénéficiaires), embauches déclarées par lot (un `impactReport` par lot, seuil appliqué à chaque
  ligne), pied de rapport.
- Écarts non comblés faute de fonction : tendance « +32 vs septembre », envoi mensuel du rapport
  par e-mail, vérification du fichier avant envoi, liste des erreurs à télécharger, compteur
  « Adresse injoignable ».

## Accueil Career v2 (15 octobre 2026)

Brief `docs/refonte-career/BRIEF-CAREER-V2.md` et maquette `docs/refonte-career/maquette/`
(remplace la 03-08 pour `/app/career`). Chargement des données de `page.tsx` gardé ; ajout du
résultat du dernier diagnostic (radar et stade) et du nombre de candidatures (parcours). Captures
1440 et 390 dans `/mnt/project-files/captures/career-v2/`.

- **Hero « parcours »** (`CareerHero`) : parcours en 4 étapes calculé par `careerJourney()`
  (testé), boutons « Continuer » et diagnostic, scène décorative (Amani « joie », Orbi, orbites,
  trois cartes : score du CV, diagnostic, prochaine étape), toutes les valeurs réelles.
- **Trois groupes** numérotés en grille bento : Faire le point (diagnostic sombre avec radar et
  stade, plan), Préparer mes candidatures (Mon CV, lettres, LinkedIn, portfolio), M'entraîner
  (simulations avec Kofi « téléphone », conseils « Bientôt disponible »).
- **Cartes d'outils** (`CareerToolCard`, `CareerArt`) : illustration CSS/SVG par outil, badges
  « Inclus », formule (Sapin ou Nuit) ou « Bientôt disponible » ; outil verrouillé : voile, prix
  « Avec {formule} · {prix} USD/mois » et « Débloquer » vers `/app/abonnement`.
- **Bandeau d'offre** (`CareerUpgradeBand`, Fatou « montre ») tant qu'un outil est verrouillé ;
  formule choisie par `upgradeOffer()` (testé), sans nom de forfait dans le code.
- Rail d'onglets : cadenas après les outils verrouillés. Mouvement : entrées en fondu, flottement,
  orbite, onde du micro, survols ; tout est immobile en animations réduites.
- 45 textes ajoutés (§ 8 du brief, plus `career.nav.locked`).
- Décisions : `docs/decisions/2026-10-15-career-v2.md` (seuil de 60, formule du bandeau).

## Diagnostic : questions de relance et mini plan gratuit (15 octobre 2026)

Décision du propriétaire après le lot C : ajouter les 2 questions de relance, puis faire proposer
par l'IA un mini plan gratuit et montrer que les autres possibilités demandent une offre.

- **Questions de relance** (niveau personnalisé, `career.diagnostic.level`) : après la dernière
  question, Jumanly Intelligence lit les réponses et pose 2 questions ouvertes, facultatives
  (`diagnostic_followup`, 1 crédit, consentement et droit vérifiés par `runAi`). Sans le modèle
  (refus, indisponible, plus de crédit), les règles choisissent 2 questions (`ruleFollowUps`) sans
  rien consommer. Les réponses sont gardées dans le brouillon et lues par la synthèse ; elles ne
  changent aucune note.
- **Mini plan gratuit** (tous les bilans v2) : une action gratuite par priorité (profil, CV,
  formations, candidatures, réseau), avec son lien. Au niveau personnalisé, le modèle réécrit les
  phrases (`miniPlan`) ; au niveau simplifié, elles sont fixes (pas d'appel à l'IA en Free, partie
  05 § 3.1).
- **Pour aller plus loin** : plan de progression, diagnostic personnalisé, simulations
  d'entretien, documents, formations recommandées ; seulement ceux que le talent n'a pas, avec le
  forfait le moins cher qui les ouvre (lu en base).
- 36 textes ajoutés (`career.diagnostic.followUp.*`, `miniPlan.*`, `upgrade.*`),
  `intro.personalized` mis à jour. Tests unitaires (5), e2e (parcours personnalisé). Captures dans
  `/mnt/project-files/captures/diagnostic-relances/`.

## Refonte visuelle · lot 11 : espace recruteur et entreprise (15 octobre 2026)

Maquettes `docs/maquettes/04-espace-recruteur-entreprise/` (04-01 à 04-10). Textes de
`messages/fr.json`, forfaits de la partie 05 ; mouvements des lots A, B et C gardés (bandeau
d'univers Hire, menu-torche, rail d'onglets, apparitions, compteurs et jauges, cloche, toasts,
cartes de réussite). Captures 1440 et 390 dans `/mnt/project-files/captures/refonte-lot-11/`.

- **Tableau de bord, Mes offres** : indicateurs, « À traiter », offres avec barre des étapes,
  tableau des offres avec onglets par statut, recherche et menu d'actions.
- **Nouvelle offre** : assistant en 6 étapes (bases, description, compétences, critères,
  processus, aperçu), brouillon IA, suggestions avec « Pourquoi ? », aperçu en direct, « Partir
  d'une offre existante ». La certification se coche à la publication.
- **Pipeline** : glisser-déposer fluide (la carte suit la souris ou le doigt après un appui long,
  la colonne d'arrivée s'éclaire, retour « Annuler » dans le toast), clavier (Espace, flèches,
  Échap). Déposer sur « Non retenu » ouvre la décision : aucun rejet automatique. Score sur le
  dégradé IA avec son « Pourquoi ? » en panneau.
- **Fiche candidature** : en-tête, onglets ancrés, profil, CV, réponses, critères, notes, grille,
  historique ; à droite le score (anneau, critères, « Pourquoi ? ») et « Votre décision ».
- **Talents** : barre de recherche, filtres en puces, résultats avec score et « Pourquoi ? »,
  demande de mise en relation à côté des résultats, quotas du mois.
- **Viviers** : cartes des viviers, vivier ouvert en tableau (origine, ajout, « Proposer pour une
  offre »), panneau « Nouveau vivier » avec visibilité. `/app/hire/viviers/[id]` redirige.
- **Entretiens** : agenda semaine (et jour, mois, liste), statuts en couleur, détail de
  l'entretien, « Préparer l'entretien » tiré du score (points à vérifier, compétences manquantes),
  « À confirmer », carte de réussite à l'envoi de l'invitation.
- **Rapports** : indicateurs, entonnoir, origine en anneau, tableaux par offre et par recruteur,
  motifs de décision, candidats informés, évaluations, rapports consolidés, niveaux verrouillés.
- **Organisation** : carte d'en-tête, rail d'onglets, membres en tableau avec changement de rôle
  dans un menu, invitations, et à droite vérification, rôles et équipes.
- 100 textes ajoutés (`hire.*`, `org.*`).

### Définition de fini

| Critère | État |
|---|---|
| Lint, types, tests unitaires (182) et base (130), build | ✓ |
| `pnpm test:e2e` et `pnpm test:e2e:reduced` | ✓ 223 et 223 |
| Aucun rejet automatique, score avec « Pourquoi ? » | ✓ |
| Aucun chiffre inventé : seuls les champs existants sont affichés | ✓ |

### Écarts restants

Voir `docs/decisions/2026-10-15-refonte-lot-11.md` : éléments des maquettes sans fonction
derrière (non construits plutôt qu'inventés).

## Espace connecté animé · lot C : le diagnostic de carrière (15 octobre 2026)

Brief `docs/experience-animee/BRIEF-ESPACE-UTILISATEUR.md` § 5. PR unique, captures 1440 et 390 dans
`/mnt/project-files/captures/experience-animee-lot-c/`.

- **Barème v2** (`diagnostic_scoring_v2`, partie 08 § 8.11) : six dimensions sur 100, note globale,
  quatre stades, priorités et constats, questions adaptatives. Testé (`tests/unit/diagnostic-scoring.test.ts`).
- **Questions** : 13 nouvelles (familiarité, entreprises, niveau et preuve de 5 compétences tirées
  des vraies offres, résultats chiffrés, lettre, profil en ligne, entretiens passés, présentation en
  2 minutes, mode de travail, contacts). Langues, outils numériques et réalisation passent dans le
  questionnaire de tous ; le personnalisé garde valeurs, style de travail, retours, horizon.
- **Accueil** : carte du talent qui flotte, Orbi en orbite, constellation des 6 dimensions,
  « Utiliser mon profil et mon CV » pré-remplit métier visé, secteurs, compétences, langues, études
  et état du CV (avec le score du CV Jumanly).
- **Questions** : une par écran, trajectoire des 6 étapes, glissé latéral, cartes à coche dessinée,
  radar en direct, enregistrement de chaque réponse (`CareerDiagnosticDraft`) et « Reprendre mon
  diagnostic, étape n sur 6 ». Sans JavaScript : toutes les questions sur une page.
- **Scan** : balayage de la carte, Orbi accélère, les compétences sont aspirées, les étapes réelles se
  cochent (avec le vrai nombre d'offres comparées), la constellation s'allume, la carte se retourne.
  Toast et notification « Votre diagnostic est prêt ». IA du personnalisé : au-delà de 25 s, retour
  aux règles sans crédit consommé (`runAi` reçoit un `timeoutMs`).
- **Résultat** : stade sur une trajectoire, note qui compte, radar (avec le précédent en
  pointillés) et tableau, détail par dimension avec « Pourquoi ? » et action, priorités, atouts,
  évolution, PDF, « Refaire dans 30 jours » (notification par la tâche horaire).

### Définition de fini

| Critère | État |
|---|---|
| Lint, types, tests unitaires (182) et base (130), build | ✓ |
| `pnpm test:e2e` et `pnpm test:e2e:reduced` | ✓ 221 et 221 |
| Barème couvert : 6 dimensions, 4 stades, questions adaptatives | ✓ |
| Aucun nombre inventé à l'écran | ✓ offres comptées en base, notes calculées |
| Textes dans `textes/textes-application.md` | ✓ |

### Écarts restants

- Les 2 questions de relance générées par l'IA (diagnostic personnalisé) ne sont pas faites : elles
  demandent un appel d'IA au milieu du questionnaire ; à décider avec le propriétaire.
- Le radar en direct est redessiné image par image pendant 0,5 s (points du polygone SVG) : ce n'est
  pas une propriété `transform`, mais rien n'est recalculé dans la mise en page.
- Mesure Lighthouse (Moto G4) non faite dans cet environnement.

## Refonte visuelle · lot 10 : Jobs, candidatures, messages, notifications, paramètres (15 octobre 2026)

Maquettes `docs/maquettes/03-espace-talent/` 03-16 à 03-23. Décisions :
`docs/decisions/2026-10-15-refonte-lot-10.md`. Captures 1440 et 390 px dans
`captures/refonte-lot-10/` (dossier du projet).

- `/app/jobs` : recherche en pilule, onglets Tous / Recommandées / Récentes, filtres en puces dans
  un rail (contrat, télétravail, expérience, salaire indiqué, date de publication, compatibilité
  minimale, entreprises vérifiées) et panneau « Filtres » complet, filtres actifs retirables.
  Cartes d'offre `TalentJobCard` (score sur le dégradé IA, « Pourquoi ? », enregistrement), colonne
  Intelligence, suivi des candidatures et entreprises qui recrutent.
- `/app/jobs/[slug]` : fiche détaillée (faits, missions, compétences cochées quand le talent les a,
  questions éliminatoires, étapes, recruteur, entreprise, offres proches) et panneau de
  compatibilité. « Postuler » ouvre `?postuler=1` : choix du CV en cartes, lettre, envoi.
- `/app/jobs/candidatures` : suivi par étapes définies par le recruteur (`applicationTracker`),
  historique et prochain entretien dépliables (un à la fois), messages, CV envoyé, retrait.
- `/app/jobs/enregistrees` : grille de cartes, tri par date limite, offres qui se clôturent bientôt.
- `/app/messages` : liste (recherche, filtres, demande de mise en relation en attente), conversation
  qui s'ouvre sur le dernier message, colonne de contexte (interlocuteur, candidature liée,
  fichiers partagés). Sur téléphone, la liste puis la conversation seule.
- `/app/notifications` : groupées par jour, filtrées par sorte, avec l'action principale.
- `/app/parametres` : navigation verticale, carte du forfait, interrupteurs (dont « Réduire les
  animations »), explication de Jumanly Intelligence, colonne données et sécurité.
- Textes ajoutés dans `textes/textes-application.md` (Jobs, candidatures, enregistrées, Connect,
  notifications).

### Écarts restants

- Sans fonction derrière, donc non affichés : alertes d'offres, suivre une entreprise, masquer une
  offre, rayon en km, filtres secteur et langue, questions du recruteur (étape 2) et lettre en
  fichier, date de début, délai de réponse du recruteur, score du CV choisi, préférences de
  notifications par canal (le lien mène à Confidentialité), onglets « Notifications » et « Langue
  et région » des paramètres, « Lu » sur les messages, compteur de messages non lus par
  conversation, statut « En ligne ».
- Le « Pourquoi ? » détaillé reste la carte claire `TalentWhy` (testée), pas un panneau sombre.

## Espace connecté animé · lot B : les messages (14 octobre 2026)

Brief : `docs/experience-animee/BRIEF-ESPACE-UTILISATEUR.md` § 4. Décisions :
`docs/decisions/2026-10-14-espace-anime-messages.md`. Captures 1440 et 390 px dans
`captures/experience-animee-lot-b/` (dossier du projet).

- Cloche (`NotificationBell`) : sans JavaScript, c'est un lien vers `/app/notifications` ; avec,
  elle ouvre un panneau des 6 dernières notifications (liseré Lime sur les non lues, « Tout
  marquer comme lu » sans quitter la page). Elle interroge `/api/notifications` toutes les minutes
  quand l'onglet est visible ; à l'arrivée d'une notification, elle oscille, la pastille rebondit
  et le nombre roule. Une notification importante (message, entretien, demande de contact ou de
  document, invitation, paiement) s'affiche aussi en toast.
- Toasts (`Toaster`, `showToast`) : en haut à droite sur ordinateur, en haut sur téléphone, barre
  de temps qui se vide et s'arrête au survol, `role="status"`.
- Cartes de réussite (`SuccessBurst`) : coche qui se dessine et formes de la marque qui s'écartent
  une fois, pour la candidature envoyée, le paiement confirmé, l'attestation obtenue et la licence
  activée.
- Message du jour sur le tableau de bord : une phrase tirée de l'état réel du compte (offres
  compatibles, leçons restantes ou profil), une fois par jour, repliée après 8 s ou d'un clic.
- Bienvenue : le personnage entre en glissant, le « j » se dessine, les étapes arrivent en cascade.
- CV (réponse du propriétaire, 14 octobre) : champ « Téléphone (facultatif) » propre à chaque CV,
  vide par défaut, imprimé seulement s'il est rempli. C'est le numéro du talent, sans lien avec la
  règle « aucun numéro de Jumanly » ; il n'entre ni dans le profil ni dans le matching.
- En-tête mobile : le sélecteur d'espace se raccourcit (texte tronqué) pour que logo, cloche et
  compte tiennent sur 390 px ; avant, la ligne débordait de quelques pixels.

### Écarts restants

- Pas de bannière « adresse e-mail non vérifiée » : la connexion exige déjà une adresse vérifiée.
- Pas de flux SSE : interrogation toutes les minutes (repli prévu par le brief).

## Espace connecté animé · lot A : le socle (14 octobre 2026)

Brief : `docs/experience-animee/BRIEF-ESPACE-UTILISATEUR.md`. Décisions :
`docs/decisions/2026-10-14-espace-anime-socle.md`. Captures avant et après, 1440 et 390 px, dans
`captures/experience-animee-lot-a/` (dossier du projet).

- `AppMotionRoot` : sens du défilement (`html[data-dir]`), apparition des blocs dans les deux sens
  (un bloc ne se recache qu'à plus d'un écran), dérive des formes, torche du menu, pilule qui
  glisse, onde au toucher, navigation mobile qui se cache en descendant.
- Préférence « Réduire les animations » (Paramètres › Compte › Affichage, colonne
  `User.reduceMotion`) ; `prefers-reduced-motion` du système arrête aussi tout. L'état final est
  l'état par défaut : sans JavaScript ni animation, la page est complète.
- `UniverseHeader` : bandeau propre à chaque module (fond, teinte qui coule, forme, icône), sur
  toutes les pages `/app` via `AppPageHeader` ; motif du module très léger en haut de la page.
- Menu : dégradé Signature qui circule sur l'onglet actif, anneau au survol, torche qui révèle le
  motif Orbites, pastille de notification qui pulse.
- Entrée des pages en cascade (`src/app/app/template.tsx`).
- `TabRail` : rail d'onglets (bords en fondu, flèches « verre », fil de progression Lime, molette
  horizontale, glisser à la souris, onglet actif ramené dans l'écran et qui glisse) sur Career,
  l'éditeur de CV, la galerie de modèles, Learn et Paramètres.
- `pnpm test:e2e:reduced` rejoue tous les parcours avec `prefers-reduced-motion: reduce`.

### Écarts restants

- La fiche d'une offre (`/app/jobs/[slug]`) garde son en-tête en carte : c'est l'offre elle-même.
  La page de bienvenue sera reprise au lot qui la traite.
- Pas d'API View Transitions : seule l'entrée de la nouvelle page est animée (repli prévu par le
  brief).
- La CI ne rejoue pas encore les parcours en mode réduit (le double de durée) ; à faire en local
  avant chaque lot.

## Modèles de CV · étape A : 5 modèles gratuits et pagination (14 octobre 2026)

Spécification : `docs/modeles-cv/SPECIFICATION-MODELES-CV.md`. Décisions :
`docs/decisions/2026-10-14-modeles-cv.md`. Captures dans `captures/modeles-cv/` (dossier du projet).

- 15 modèles enregistrés (`src/features/cv/templates/registry.ts`), styles et polices de
  `docs/modeles-cv/modeles/` repris tels quels. Accès par le droit `career.cv.templates.access`
  (free / starter / pro), vérifié sur le serveur quand on applique un modèle et à l'export.
- Un seul rendu (`CvDocument`) pour l'aperçu et le PDF, pagination portée en TypeScript
  (`paginate.ts`), polices chargées avant la mesure.
- Export PDF par Chromium, neutre : ni logo, ni couleur, ni mention Jumanly ; nom du fichier
  `CV-Prenom-Nom.pdf`. Au-delà de 3 pages, l'export est refusé.
- `/app/career/cv/modeles` : galerie « Choisir un modèle » (filtres, tri, aperçu avec le contenu
  de la personne, cadenas et forfaits). Éditeur : onglets « Contenu » et « Mise en forme »
  (16 couleurs, couleur personnalisée refusée sous 4,5:1 avec une proposition plus foncée,
  6 polices, 3 densités, photo, langue des titres), cartes « Pages » et « Exporter mon CV ».
- Page interne `/dev/cv/[modele]` (local et preview) pour les tests visuels.
- Tests : unitaires (catalogue, couleurs, réglages, document neutre), en base (droits, 15 modèles
  sans changer le contenu, couleur refusée), e2e (comparaison avec les PDF de référence, mêmes
  pages dans l'aperçu et le PDF pour 3 jeux × 3 densités, texte du PDF complet et dans l'ordre,
  PDF neutre, compte Free refusé même par l'API). La CI installe `poppler-utils`.
- Textes : partie 9 de la spécification, `cv.titles|levels|languageLevels|present|colors.*`,
  noms et descriptions des 15 modèles ; comparatif des forfaits « 5 / 10 / 15 modèles ».

### Écarts restants

- Les 10 modèles Starter et Pro sont déjà rendus, mais leur verrouillage complet (retour après
  abonnement, forfait rétrogradé dans la galerie, table d'accès dans l'admin) est l'étape B.
- Export Word : étape C. Envoi d'une photo : pas encore de stockage de fichiers.
- Nouvelles sections (projets, certificats…) : le modèle sait les afficher, l'éditeur ne les
  propose pas encore.
- Champ téléphone facultatif sur le CV : ajouté au lot B de l'espace animé (accord du propriétaire).

## Refonte visuelle · Lot 9 : espace talent, Career (14 octobre 2026)

Maquettes 03-08 à 03-15. Captures 1440 et 390 px dans `captures/refonte-lot-09/` (dossier du projet).

- Pièces communes dans `src/components/career/kit.tsx` : rubriques Career en pastilles (défilent
  sur téléphone), cartes, panneau dégradé « Jumanly Intelligence », « Pourquoi ? », anneau de score.
- `/app/career` : bandeau Sapin avec trois chiffres (score du CV, étapes du plan, simulations),
  cartes des outils avec cadenas de forfait, carte IA avant un entretien confirmé.
- Diagnostic : questions en cartes à cocher, bilan en deux colonnes avec panneau IA et historique.
- CV : trois colonnes (mes CV, sections, informations, modèle · aperçu A4 à bandeau · coach IA en
  dégradé avec anneau de score, suggestions et mots-clés). La liste des CV passe en cartes.
- Lettres et documents : liste à gauche, document au centre (copier, PDF, corrections cochées),
  formulaire « Rédiger avec l'IA » à droite, sur la liste comme sur un document.
- LinkedIn : un bloc par proposition avec « Proposition IA » et « Copier », panneau IA et liste de
  vérification à droite.
- Simulations : modes en cartes avec leur quota, choix en pastilles, tableau des séances, dernier
  retour dans le panneau IA (niveaux, jamais de note chiffrée). Séance restylée.
- Plan : bandeau objectif avec anneau d'avancement, étapes cochables, formations recommandées,
  rapport détaillé. Portfolio : projets en cartes à couverture, modification sous la grille, page
  publique et présentation à droite.
- `Table` : la zone de défilement est positionnée, pour qu'un texte réservé aux lecteurs d'écran
  ne fasse plus déborder la page sur téléphone.
- Textes ajoutés (`textes/textes-application.md`) : `career.nav.*`, `career.home.stats.*`,
  `career.home.ai.*` et compteurs de l'accueil, `career.diagnostic.eyebrow`,
  `career.diagnostic.result.questions`, `career.diagnostic.result.exploreJobs`,
  `career.documents.mine`, `.badge`, `.edit.cta`, `.aiNotice`, `.pick`,
  `career.linkedin.headline.count`, `career.interviews.history.session|date|mode|feedback|completed`,
  `career.interviews.feedback.latest|none`, `career.plan.steps`, `career.plan.updated`,
  `career.portfolio.count`, `.publicBadge`, `.privateBadge`.

### Écarts restants

- Pas de fonction derrière : recherche globale et sélecteur d'espace de la barre du haut, articles
  « Conseils de préparation » (affiché « Bientôt disponible »), PDF du bilan de diagnostic, boutons
  « Utile / Signaler une erreur », import de CV, partage du CV par lien, « Proposer une autre
  version » bloc par bloc sur LinkedIn (un seul bouton pour tout), langue de la simulation,
  suggestions IA de nouvelles étapes du plan, image de couverture et statistiques de vues du portfolio.
- Le score des simulations n'est pas chiffré (niveaux Solide · En progrès · À travailler), comme le
  veut la partie 08 ; la maquette montre des notes sur 100.
- La liste de vérification LinkedIn se coche mais n'est pas enregistrée.
- Questionnaire du diagnostic sur une seule page, y compris sur téléphone.

## Refonte visuelle · Lot 8 : espace talent, tableau de bord, profil et Learn (14 octobre 2026)

Maquettes 03-01 à 03-07. Captures 1440 et 390 px dans `captures/refonte-lot-08/` (dossier du projet).

- Gabarit de l'espace connecté : contenu en pleine largeur ; nouveau `AppPageHeader` (surtitre et
  titre remontés dans la barre du haut sur grand écran).
- `/app` : bandeau Sapin « prochaine étape » (entretien, formation en cours, offres compatibles ou
  profil), quatre indicateurs, parcours en étapes, carte des offres recommandées avec « Pourquoi ? »,
  formations en cours, entretiens à venir, candidatures et quotas.
- `/app/profil` : colonne latérale (complétude, aperçu côté recruteur, visibilité, import de CV),
  sections avec pictogramme, expériences et formations en tuiles, attestations Jumanly, compétences en
  tableau, langues, disponibilité en boutons segmentés.
- `/app/learn` : onglets, recherche, thèmes, formation mise en avant, « En cours », recommandations,
  grille « Populaires » (carte verrouillée grisée avec cadenas).
- `/app/learn/[slug]` : fiche (en-tête Sapin, carte de forfait, programme dépliable), lecteur
  (scène Sapin, navigation entre leçons, onglets d'ancrage, ressources, notes, sommaire avec
  progression, attestation, formateur) et quiz (résultat avec anneau de score, revue question par
  question avec la bonne réponse, grille de résultats, module suivant).
- `/app/learn/attestations` : bandeau « Nouvelle attestation » (30 jours), cartes, copie du lien de
  vérification, aperçu du PDF et lien public.
- Textes ajoutés : `talent.dashboard.nextStep.hint.*`, `talent.dashboard.ai.reason`,
  `talent.dashboard.ai.score`, `talent.profile.importCv.action`,
  `talent.profile.education.jumanlyCertificates.issued`, `talent.profile.skills.count`,
  `talent.profile.skills.table.skill`, `learn.course.eyebrow`, `learn.course.includedInPlan`,
  `learn.course.previewBadge`, `learn.quiz.eyebrow`, `learn.quiz.result.moduleBadge`,
  `learn.quiz.result.yourAnswer`, `learn.quiz.result.grid`, `learn.quiz.result.nextModule`,
  `learn.quiz.result.reviewCount`, `learn.certificates.eyebrow`, `learn.certificates.count`,
  `learn.certificates.preview`, `learn.certificates.publicLink.title`,
  `learn.certificates.publicLink.body`, `learn.certificates.congrats.eyebrow`.

### Écarts restants

- Pas de graphique du temps d'apprentissage par semaine ni de comparaison au mois précédent (pas de
  donnée hebdomadaire) ; pas d'évolution de la force du profil.
- Pas de recherche globale dans la barre du haut ni de sélecteur « Espace ».
- Pas de notes ni de nombre d'avis sur les formations, pas de pile d'avatars d'apprenants.
- Carte IA : pas de « Ignorer » ni « Ne plus me proposer » ; pas de carte « Comble une compétence
  manquante » sur la fiche formation.
- Pas de quiz ni de documents dans « À venir » ; pas d'envoi de photo ; pas de réécriture du résumé
  par l'IA ; niveau de compétence en lecture seule dans le tableau.
- Pas d'interrupteur « Afficher sur mon profil » ni « Ajouter à mon CV » sur les attestations ; pas de
  tri ; pas de bouton « Partager » par carte (copie du lien à la place).
- Lecteur : pas d'onglet « Questions » ni « Poser une question » (fonction absente) ; les notes sont
  datées, pas liées au moment de la vidéo ; les contrôles de la vidéo restent ceux du navigateur.
- Quiz : pas de lien « À revoir : leçon » (aucun lien entre question et leçon en base).
- Pas de barre d'action collante en bas sur téléphone (fiche et lecteur).
- La formation mise en avant du catalogue est une formation, pas un « parcours ».
- Pas de panneau de filtres ni de tri dans le catalogue connecté.

## Refonte visuelle · Lot 7 : connexion et inscription (14 octobre 2026)

Maquettes 02-01 à 02-10. Captures 1440 et 390 px dans `captures/refonte-lot-07/` (dossier du projet).

- Gabarit d'authentification refait : panneau Sapin à gauche (motif, personnage propre à chaque
  écran, accroche, trois engagements), formulaire sur Crème à droite, « Retour au site » et langue
  en haut, signature en bas. Sur téléphone, le panneau disparaît.
- `/connexion`, `/mot-de-passe-oublie` (avec l'état « e-mail envoyé » et un renvoi après 60 s),
  `/reinitialiser` (adresse rappelée, jauge de robustesse, lien expiré), `/inscription` (cartes de
  profil), `/inscription/forfait` (cartes de formules : la carte choisie passe en Sapin, en CSS
  seul), `/inscription/compte` (rappel de la formule, consentements avec liens),
  `/inscription/verification` (six cases pour le code, renvoi minuté), `/inscription/paiement`
  (méthode en cartes, opérateur en pastilles, récapitulatif), `/app/bienvenue` (étapes numérotées,
  « Vos premiers pas ») et `/activer` (déplacé dans le gabarit d'authentification, même adresse).
- Textes ajoutés : `auth.layout.eyebrow`, `auth.layout.languageShort`, `auth.layout.languageLabel`,
  `welcome.talent.skills.label`.
- Test e2e de paiement adapté : l'opérateur se choisit par bouton radio.
- Correctif du lot 6 : le bouton de pagination inactif n'utilise plus l'opacité (contraste AA).

### Écarts restants

- Pas d'import de CV sur `/app/bienvenue` (la fonction n'existe pas) ; seul « Créer mon CV » est proposé.
- Pas de case « Mémoriser ce numéro » au paiement (non prévu).
- Les encadrés d'exemple des maquettes (« Autres états », « Erreur de saisie (exemple) ») ne sont pas
  reproduits : ce sont des états réels, affichés quand ils se produisent.
- Le bouton Google n'apparaît que si Google est configuré.
- `/app/bienvenue` garde la barre latérale de l'espace connecté.
- « Déconnecter mes autres appareils » est une information : la déconnexion est toujours appliquée.
## Premier administrateur en production (14 octobre 2026)

- Nouvelle variable `ADMIN_BOOTSTRAP_EMAIL` : l'adresse listée devient administrateur à sa première
  connexion, une fois vérifiée (`src/server/services/admin-bootstrap.ts`, appelée à la création de
  session). Journalisé dans l'audit. Décision : `docs/decisions/2026-10-14-premier-administrateur.md`.
- Tests unitaires : `tests/unit/admin-bootstrap.test.ts`.
- Rappel : tant que Resend n'est pas branché, les codes (inscription, deux étapes) apparaissent dans les
  journaux Vercel (adaptateur e-mail factice).

## Refonte visuelle · Lot 6 : formations, offres, entreprise, attestation, portfolio, pages légales (14 octobre 2026)

- `/formations` refaite d'après `01-10` : héros Crème avec recherche en pilule et Amani, panneau de
  filtres (replié sur mobile), pastilles d'accès, tri en menu, nouvelles cartes de catalogue, pagination
  par pastilles numérotées, bandeau Sapin « Voir les forfaits ».
- `/formations/[slug]` d'après `01-11` : fil d'Ariane, écran d'aperçu Sapin, programme en accordéons
  par module, objectifs en deux colonnes, bandeau Lime avec un modèle d'attestation (sans nom),
  formateur, formations proches.
- `/offres` d'après `01-12` : formulaire de recherche en carte, encart IA « compatibilité », cartes
  d'offres (salaire quand il est publié), colonne recruteur, filtres et conseil de sécurité.
- `/offres/[slug]` d'après `01-13` : en-tête avec logo et faits en pastilles, « Postuler
  gratuitement », colonne IA, sécurité et entreprise ; `JobBody` restylé (aussi dans `/app/jobs`).
- `/entreprises/[slug]` d'après `01-14` : bandeau Profondeur, carte d'identité qui chevauche,
  offres ouvertes, état vide avec Fatou.
- `/attestations/[code]` d'après `01-15` : carte de vérification (valide, révoquée, introuvable),
  recherche d'un autre numéro, Kofi.
- `/portfolio/[slug]` d'après `01-16` : bandeau Lime, initiales, compétences mobilisées, premier
  projet en grand (mise en page « classique »), couvertures à motifs, nombre de fichiers.
- Modèle des pages légales d'après `01-17` (les quatre pages) : bandeau « à faire valider », bouton
  Imprimer, menu des pages avec icônes, sommaire, encadré « L'essentiel », section IA mise en avant,
  listes à libellé en gras, emplacements `[…]` surlignés (hors production), « Haut de page ».
- Textes ajoutés : `trainings.hero.eyebrow`, `training.preview.position`,
  `training.certificate.sample.{intro,text}`, `training.instructor.role`, `jobs.hero.eyebrow`,
  `jobs.search.filtersCount`, `career.portfolio.page.{eyebrow,projects,count,files,share,shareCopied}`,
  `legal.eyebrow`.
- Écarts assumés : filtre « contrat » à choix unique (le moteur de recherche n'en accepte qu'un) ;
  pas de cartes de démonstration « Autres états » sur l'attestation ; pas de bio ni de titre du
  formateur (absents du modèle de données) ; pas de lieu ni de badge « Projet mis en avant » sur le
  portfolio (la page publique ne montre que nom, titre, présentation et projets).
- Tests e2e mis à jour : le titre du portfolio est désormais le nom ; l'aperçu de leçon s'ouvre par
  « Lire l'aperçu ».

## Refonte visuelle · Lot 5 : Partenaires, FAQ, Contact, Matching (14 octobre 2026)

- `/partenaires` refaite d'après `docs/maquettes/01-site-public/01-06` : héros Crème avec un tableau
  de bord fictif (« Fondation Horizon », chiffres qui comptent, barres qui montent) sur panneau Sapin
  et Fatou ; six institutions ; « Comment ça marche » en Profondeur avec le chemin qui se dessine ;
  exemple chiffré sur bandeau Lime ; confidentialité ; formulaire (formule choisie par pastilles) ;
  bandeau « code de licence ».
- `/faq` refaite d'après `01-07` : recherche en grand dans le héros, menu des thèmes collant qui
  suit le défilement (rangée de pastilles sur mobile), questions en accordéon par thème, bandeau final.
- `/contact` refaite d'après `01-08` : héros Profondeur avec Kofi, formulaire qui chevauche le héros,
  adresses e-mail et encart FAQ.
- `/comment-fonctionne-le-matching` refaite d'après `01-09` : héros sur le dégradé IA avec l'anneau
  « 87 % », sommaire en pastilles ; échelle, huit critères, poids (lus dans la configuration active du
  matching) ; quatre niveaux ; exemple de « Pourquoi ? » fictif ; ce qui n'est jamais utilisé ;
  contrôle humain ; FAQ ; bandeau final.
- Textes ajoutés : `partners.hero.visual.*`, `partners.{who,how,privacy,contact}.eyebrow`,
  `partners.example.*.value/unit`, `faq.hero.eyebrow`, `contact.hero.eyebrow`,
  `matchingPage.{eyebrow,nav.*,hero.imageAlt,s3.example,s5.example,s5.imageAlt,example.*}`,
  `matchingPage.faq.eyebrow`, `matchingPage.finalCta.title`.
- Écart assumé : la liste des huit critères suit les textes (« le type de contrat et la disponibilité »,
  « la proximité entre votre profil et la description du poste ») et non la maquette.
- Vérifié : axe WCAG 2.2 AA sur les quatre pages (desktop et mobile), aucun débordement horizontal à 390 px.

## Refonte visuelle · Lot 4 : Recruteurs et Entreprises (14 octobre 2026)

- `/recruteurs` refaite d'après `docs/maquettes/01-site-public/01-04` : héros Profondeur avec la
  capture du pipeline Hire, Nadia et la pastille « 3 profils suggérés » ; quatre cartes Hire ;
  matching expliqué avec une fiche candidature d'exemple (score sur le dégradé IA, critères, « Pourquoi ? »,
  actions humaines) ; engagements ; formules RH ; bandeau Companies (prix lu en base) ; bandeau final.
- `/entreprises` refaite d'après `01-05` : héros avec le pipeline sur panneau Sapin, M. Diallo,
  carte « Entreprise vérifiée » et équipe ; quatre avantages (le premier en Sapin) ; rôles avec une
  liste de membres fictive dont l'étiquette de formule est le nom de la formule Company recommandée
  (lu en base) ; engagements ; formules Company ; bandeaux devis (Néon) et Partners ; bandeau final.
- Style immersif sur les deux pages (apparitions, flottement, dégradés qui glissent, barres qui se
  remplissent, score qui compte). Le héros de `/recruteurs` passe du Sapin au dégradé Profondeur ;
  celui d'`/entreprises` garde le Crème, éclairé de lumières de marque.
- `PublicPlanCards` affiche « Sur devis » pour une formule sur devis (non achetable, sans prix) ;
  un prix indisponible reste masqué.
- Aperçus : `public/apercus/recruteurs-pipeline.webp` (partagé par les deux pages) et
  `recruteurs-pipeline-mobile.webp`.
- Textes ajoutés : `recruiters.hero.visual.*`, `recruiters.{benefits,matching,guarantees,plans}.eyebrow`,
  `recruiters.matching.link`, `recruiters.example.*`, `recruiters.plans.payment`,
  `recruiters.upsell.initials`, `recruiters.upsell.more`, `companies.hero.visual.*`,
  `companies.{benefits,roles,guarantees,plans}.eyebrow`, `companies.roles.chip.*`,
  `companies.roles.example.*`, `companies.roles.imageAlt`, `companies.plans.payment`.
- Vérifié : axe WCAG 2.2 AA sur les deux pages (desktop et mobile, 4 passages chacune).

## Style immersif sur À propos et Talents (14 octobre 2026)

- Le propriétaire veut le style de l'accueil sur tout le site public (espace connecté : touches
  douces seulement). `/a-propos` et `/talents` passent en style immersif : héros sur le dégradé
  Profondeur, personnages en mouvement, cartes au dégradé qui glisse, apparitions au défilement,
  aperçus qui flottent, chemin du lancement qui se dessine, bandeau final animé.
- Blocs de l'accueil déplacés dans `src/components/site/marketing.tsx` pour être partagés.
- Les autres pages publiques recevront ce style avec leur lot de refonte.

## Page d'accueil immersive (14 octobre 2026)

- `/` retravaillée à la demande du propriétaire (décision `docs/decisions/2026-10-14-accueil-immersive.md`) :
  héros sombre au dégradé Profondeur, titre qui apparaît mot à mot, aperçu d'app qui défile, score
  qui compte et barre qui se remplit ; cartes « Pour qui » au dégradé qui glisse, personnages qui
  bougent ; parcours dont la ligne se dessine avec l'orbe IA qui avance ; six cartes de services
  avec icône et aperçu animé ; formations sur dégradé IA, forfaits en cartes « verre » avec bordure
  Signature qui tourne ; bandeau final au dégradé animé.
- `MarketingSection` gagne les tons `lime`, `profondeur`, `ia` et les options `scene`, `spotlight` ;
  `LimeCtaBand` gagne `animated`. Les autres pages ne changent pas.
- Vérifié : axe WCAG 2.2 AA et budget de 200 Ko de JavaScript sur `/` (e2e site public).

## Refonte visuelle · Lot 3 : page Talents (14 octobre 2026)

- `/talents` refaite d'après `docs/maquettes/01-site-public/01-03` (desktop 1440 px et mobile
  390 px) avec les blocs du lot 2 : héros avec deux écrans de téléphone et Kofi, rangées de modules
  en zigzag (panneau teinté Lime, Néon, Menthe claire, Brume), garanties et sélecteur de visibilité
  illustré sur Sapin, quatre cartes de formules, bandeau licence partenaire Néon, bandeau final Lime.
- Nouvelles cartes de formules `PublicPlanCards` (`src/components/site/pricing.tsx`), réutilisables
  pour `/tarifs` : nom, accroche et prix lus en base (Plan), formule recommandée en Sapin, encadré
  « Idéal pour ». Prix indisponible : montant masqué, bouton conservé. `talents.plans.note` n'est
  pas affichée.
- Aperçus des modules et du héros repris des maquettes, en WebP dans `public/apercus/` (26 à 56 Ko).
- Textes ajoutés : `talents.hero.visual.*`, `talents.intro.eyebrow`, `talents.career.decide`,
  `talents.guarantees.eyebrow`, `talents.plans.eyebrow`, `talents.plans.payment`.
- « Candidatures toujours gratuites » sous Jobs en Feuille foncé (contraste AA), comme aux lots 1 et 2.

### Dettes et points ouverts

- Aperçus fictifs (« Grâce ») à remplacer par de vraies captures après la refonte de l'espace talent.

## Refonte visuelle · Lot 2 : accueil et à propos (14 octobre 2026)

- `/` et `/a-propos` refaites d'après `docs/maquettes/01-site-public/01-01` et `01-02` (desktop
  1440 px et mobile 390 px) : sections alternées Crème, Blanc, Sapin dans un conteneur de 1200 px,
  titres centrés sur desktop et alignés à gauche sur mobile, cartes de 28 px, personnages illustrés.
- Nouveaux blocs réutilisables pour les pages publiques suivantes : `src/components/site/marketing.tsx`
  (section, tête de section, tuile d'icône, pastille numérotée, accordéon FAQ, bandeau final Lime,
  motifs et formes de la marque) et `src/components/site/public-cards.tsx` (carte de formation à
  couverture teintée, carte d'offre publique avec « Postuler gratuitement »).
- Accueil : 4 formations et 4 offres (2 de chaque sur mobile). La carte de formation affiche le
  formateur et le nombre de modules ; la carte d'offre affiche la fourchette de salaire quand le
  recruteur l'a donnée (`latestJobs` lit `salaryMin`/`salaryMax`). Prix des familles lus en base.
- Héros de l'accueil : aperçus du tableau de bord (desktop et téléphone) repris des maquettes,
  en WebP dans `public/apercus/` (90 Ko et 29 Ko).
- Textes ajoutés dans `textes/textes-application.md` (surtitres des sections, étiquettes du visuel
  du héros, étiquettes « Se former / Échanger / Recruter », étapes du lancement).
- Accessibilité : les surtitres et liens verts utilisent Feuille foncé (#22662F) au lieu de Feuille
  (#3DA14F), trop clair pour un texte de petite taille sur fond clair (même choix qu'au lot 1).

### Dettes et points ouverts

- Les aperçus du héros sont les images des maquettes (données fictives « Grâce »). À remplacer par
  de vraies captures de l'application quand l'espace talent aura été refait (lot correspondant).
- Les anciens blocs `src/components/site/sections.tsx` restent utilisés par les autres pages
  publiques jusqu'à leur lot.

## Refonte visuelle · Lot 1 : socle du design system (14 octobre 2026)

- Les maquettes `docs/maquettes/` font désormais foi pour le visuel ; `CLAUDE.md` le dit dans
  « Documents de référence ».
- Jetons (`src/styles/tokens.css`, `src/app/globals.css`) alignés sur
  `docs/maquettes/ressources/jumanly-ui.css` : Lime clair, rayons (carte 24, panneau 32, champ 14),
  ombre des éléments flottants, styles de titres de l'application (`text-app-h1`, `text-h3`,
  `text-big`, `text-lab`).
- Composants `src/components/ui` refaits d'après les planches 00-02 et 00-03 : boutons en pilule
  (40 px, variantes « sur teinte » et « sur fond sombre », icône après le libellé), champs blancs à
  bordure Brume, cases et radios dessinées, interrupteur 44 × 26, onglets soulignés, filtres en pilule,
  pastilles 24 px, score sur le dégradé IA, avatars à initiales colorées, logo d'entreprise, toast,
  modale, verrou de forfait, état vide (Kofi), tableau, carte de statistique avec icône, cartes de
  formation (catalogue et « en cours »), carte d'offre en ligne, carte IA, critère de score.
- Icônes : `lucide-react` retiré. Toutes les icônes viennent de `ressources/icones/trait`, des 23
  icônes complémentaires des maquettes et de 5 icônes dessinées dans la même grammaire
  (`ressources/icones/interface` : menu, œil barré, info, alerte, flèche retour).
- Gabarits (planche 00-04) : en-tête public blanc avec les sept rubriques et soulignement Lime,
  pied de page Sapin ; espace connecté avec barre Sapin 92 px (Paramètres et déconnexion en bas),
  panneau Crème, menu du compte et sélecteur d'espace en cartes flottantes, navigation mobile en
  pilule flottante ; Jumanly Admin sur fond Nuit avec barre large de 256 px.
- Correctif : la page Tarifs ne déborde plus horizontalement sur mobile (bouton du tableau comparatif).
- Décision : `docs/decisions/2026-10-14-design-system-maquettes.md`.

### Dettes et points ouverts

- Les écrans eux-mêmes gardent leur ancienne mise en page : ils seront repris lot par lot.
- Trois libellés internes ajoutés pour `/dev/composants` (partie 11 des textes) ; aucun texte
  d'interface n'a changé.

## Référencement : Google, Bing et assistants IA (14 octobre 2026)

- `robots.txt` ouvre explicitement les pages publiques aux moteurs et aux assistants IA (ChatGPT,
  Claude, Perplexity, Gemini…) ; l'espace connecté reste fermé.
- Nouveau `/llms.txt` : résumé du site pour les assistants IA (pages, formations, offres).
- Données structurées : `Organization` et `WebSite` sur l'accueil ; `JobPosting` enrichi (salaire,
  télétravail, page entreprise).
- Guide du propriétaire : `docs/referencement.md` (Search Console, Bing, DNS Hostinger).
  Décision : `docs/decisions/2026-10-14-referencement.md`.
- À faire par le propriétaire : vérifier le domaine dans Google Search Console et Bing Webmaster
  Tools, envoyer le plan du site.

## Mise en production sur Vercel (14 octobre 2026)

- Hostinger bloquait à l'import du dépôt : production déployée sur Vercel, base Neon (Francfort),
  domaine `jumanly.io` pointé depuis la zone DNS de Hostinger. Voir
  `docs/deploiement-vercel.md` et `docs/decisions/2026-10-14-hebergement-vercel.md`.
- `vercel.json` : commande de build, région `fra1`, cron horaire de `/api/jobs/billing`.
- La route des tâches d'abonnement accepte aussi `GET` et `CRON_SECRET` (format de Vercel Cron).
- À faire avant l'ouverture au public : remplacer `BETTER_AUTH_SECRET` et `JOBS_SECRET` (transmis
  dans une conversation), brancher Resend, créer le compte administrateur.

## Correctif · Build de production sur une base vide (14 octobre 2026)

- Constat : sur une base de production neuve (migrations + forfaits, sans démo), `pnpm build`
  échouait : avec Cache Components, `generateStaticParams` doit renvoyer au moins une valeur, or il
  n'y a encore ni formation, ni offre, ni entreprise. Le build ne passait jusqu'ici que grâce au seed
  de démonstration.
- Correctif : `staticSlugParams` (`src/server/queries/public.ts`) renvoie un slug factice « aucun »
  quand la liste est vide ; la page correspondante répond 404. Vérifié : build sur base vide, puis
  `/`, `/tarifs`, `/formations` en 200 et `/formations/aucun` en 404.
- Rappel : le build lit la base (forfaits, catalogue). `DATABASE_URL` doit donc être renseignée et
  les migrations appliquées avant le build sur l'hébergeur.
- Hostinger installe avec npm, qui refusait les dépendances (`@types/node@^20` incompatible avec
  vitest 5) : passage à `@types/node@^22` (Node 22 requis de toute façon). `prebuild` n'appelle plus
  `pnpm`, absent chez Hostinger. Nouveau script `build:hostinger` (migrations, seed sans démo, build).
  Vérifié sur une copie sans `.git` ni pnpm, base vide, deux builds de suite. Guide :
  `docs/deploiement-hostinger.md`.

## E11 · Qualité et lancement (14 octobre 2026)

### Fait

- Audit avant lancement (performance, accessibilité, référencement, sécurité selon la partie 10),
  partagé avec le propriétaire comme liste priorisée, puis corrections dans cet ordre.
- Sécurité : en-têtes sur toutes les réponses (politique de contenu, HSTS en production,
  `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` avec le
  micro autorisé seulement sur la simulation d'entretien) ; limites de débit par compte sur
  l'envoi de messages (30 en 5 minutes) et la recherche de talents (60 en 10 minutes).
- Dépendances : versions corrigées imposées aux paquets signalés (outils Prisma et aperçu des
  e-mails) ; nouvelle tâche CI « Dépendances et secrets » (`pnpm audit --prod`, gitleaks sur tout
  l'historique) ; Dependabot (une PR groupée par semaine).
- Observabilité : journaux en JSON en production, rapports d'erreurs du serveur vers Sentry par
  son API HTTP quand `SENTRY_DSN` est renseigné (aucun script dans le navigateur), page 500 avec
  référence d'incident. Procédure et alertes à créer : `docs/exploitation.md`.
- Application installable (PWA) : manifeste, icônes, service worker ; le profil et les leçons
  ouvertes restent lisibles hors ligne, page « Pas de connexion » pour le reste, bandeau hors
  ligne ; les pages gardées sont effacées à la déconnexion.
- Référencement : données structurées `Course` sur les pages de formation (`JobPosting` existait).
- Contenus éditables (`/admin/contenus`, éditeurs de contenus et administrateurs) : FAQ (page
  FAQ, FAQ courte de l'accueil, FAQ des tarifs) modifiable, masquable, avec ajout de questions et
  retour au texte d'origine ; bannières par public (tous, talents, recruteurs, partenaires) avec
  dates et style. Table `ContentBlock`, journal d'audit, cache public rafraîchi aussitôt.
- Sauvegardes : `pnpm db:backup` (conservation 30 jours, nombre de lignes noté) et
  `pnpm db:restore-check` (restauration dans une base de test et comparaison), testés en local.
- Tests : budget de 200 Ko de JavaScript sur toutes les pages publiques, offres et formations
  comprises ; accessibilité WCAG 2.2 AA étendue aux espaces talent, recruteur, partenaire et
  administration.
- Décisions : `docs/decisions/2026-10-14-e11.md`.

### Définition de fini

| Critère | État |
|---|---|
| Liste priorisée présentée avant les corrections | ✓ `audit-e11.md` partagé le 14 octobre |
| Budget de 200 Ko de JS par page publique vérifié en CI | ✓ 15 pages publiques + offre + formation (e2e) |
| Accessibilité WCAG 2.2 AA sur tous les espaces | ✓ e2e axe (public, talent, recruteur, partenaire, admin) |
| En-têtes de sécurité, micro limité à la simulation vocale | ✓ tests unitaires et e2e |
| Limites de débit : messages et recherche de talents | ✓ |
| PWA : installation, lecture hors ligne du profil et des leçons ouvertes | ✓ e2e (contenu gardé, effacé à la déconnexion) |
| Données structurées `JobPosting` et `Course` | ✓ e2e |
| Erreurs journalisées et envoyées à Sentry si configuré | ✓ tests unitaires |
| Sauvegardes testées (sauvegarde puis restauration vérifiée) | ✓ en local ; à programmer chez l'hébergeur |
| `/admin/contenus` (FAQ et bannières) | ✓ tests unitaires, en base et e2e |
| Traduction anglaise | non décidée, non faite |
| Relecture juridique | à faire par un juriste (pages légales marquées) |
| Lint, types, tests unitaires et en base, build, e2e | ✓ en local ; CI à l'ouverture de la PR |

### Dettes et points ouverts

- Propriétaire : relecture juridique des pages légales, décision sur l'anglais, fournisseur
  Mobile Money, compte Sentry (`SENTRY_DSN`) et alertes, sauvegardes chez l'hébergeur de la base.
- La politique de contenu autorise les scripts en ligne (voir la décision) ; un nonce par requête
  rendrait toutes les pages dynamiques.
- Erreurs du navigateur non envoyées à Sentry (seules celles du serveur le sont).
- `/admin/contenus` : onglets « Textes de l'interface » et « Conseils de préparation » et
  historique des versions non faits ; l'ancien texte reste dans le journal d'audit.
- Après une modification de la FAQ, un visiteur peut voir l'ancienne version une fois, le temps
  que la page soit reconstruite.
- `braces` (outil de lint, développement seulement) : faille signalée sans version corrigée.

## E10 · Career avancé (14 octobre 2026)

### Fait

- Simulations d'entretien (`/app/career/entretiens`) : poste visé (ou offre enregistrée ou
  candidature), type, exigence, durée ; une question à la fois ; retour structuré par critère
  (structure, pertinence, exemples, clarté, débit à l'oral), points forts, points à travailler et
  retour question par question. Jamais de note ni de prédiction. Une séance utilise une unité de
  `career.interview.text.monthly` ou `career.interview.voice.monthly`, sans crédit IA.
- Mode oral derrière un adaptateur (`src/lib/voice`, `NEXT_PUBLIC_VOICE_PROVIDER`) : la question
  est lue à voix haute, la réponse dictée dans un champ modifiable, sa durée sert au critère de
  débit ; sans dictée dans le navigateur, la réponse se tape.
- Lettres et documents (`/app/career/documents`, `career.documents`) : lettre de motivation,
  biographie, e-mail de candidature, remerciement ; ton, longueur, offre visée, points à mettre
  en avant ; édition, copie, PDF, suppression. Correction d'un texte avec corrections à cocher.
- Préparation LinkedIn (`/app/career/linkedin`, `career.linkedin`) : titre, résumé,
  compétences et expériences à copier, liste de vérification. Rien n'est publié.
- Adaptation du CV à une offre (éditeur de CV, `career.cv.tailor`) : une nouvelle version qui
  met en avant ce que l'offre demande, sans compétence ni chiffre ajoutés.
- Garde-fous communs : pas de chiffre absent du profil, pas de compétence de l'offre que le
  talent n'a pas, pas de question discriminatoire ; sinon le modèle déterministe (textes).
- Portfolio (`/app/career/portfolio`, `career.portfolio.level`) : projets (contexte, rôle,
  résultat, compétences, lien, médias en liens https), présentation, page publique
  `/portfolio/[slug]` (adresse non devinable, non indexée) ; le niveau enrichi ouvre la grille
  et la couleur d'accent.
- Rapport de progression détaillé en PDF (`reports.progress.detailed`) sur le plan de
  progression : plan, formations, profil, simulations, candidatures.
- Exercices métier (`learn.exercises.job_specific`) : case « Exercice métier » et métiers visés
  dans l'admin formations, verrou dans le lecteur, hors progression et hors attestation.
- Accueil Career : les quatre outils ouverts, avec verrou ou quota du mois.
- Correctif : deux premières consommations simultanées d'un quota ne lèvent plus d'erreur.
- Démo : portfolio publié de `talent.pro@jumanly.test` (`/portfolio/demo-portfolio-fictif`),
  exercice métier dans « Préparer un entretien d'embauche (démo) ».
- Décisions : `docs/decisions/2026-10-14-career-advanced.md`.

### Définition de fini

| Critère | État |
|---|---|
| Quotas texte et voix appliqués par droit, jamais par nom de forfait | ✓ tests en base |
| Retour d'entretien sans note, par critère et par question | ✓ tests unitaires, en base et e2e |
| Aucune compétence ni chiffre inventés (lettres, LinkedIn, CV adapté) | ✓ tests unitaires et en base |
| Consentement, droit et crédits vérifiés, appels journalisés dans `AiUsage` | ✓ tests en base |
| Portfolio : page publique seulement si publiée et droit actif | ✓ tests en base et e2e |
| Exercices métier verrouillés et hors progression | ✓ test en base |
| Lint, types, tests unitaires et en base, build, e2e | ✓ en local ; CI à l'ouverture de la PR |

### Dettes et points ouverts

- Voix : pas encore de fournisseur hébergé de transcription et de synthèse ; le navigateur suffit
  sur Chrome et Edge, la saisie prend le relais ailleurs.
- Médias du portfolio en liens : l'envoi de fichiers attend le stockage S3 (R2).
- `career.tools.extended` n'ouvre encore aucun outil précis ; les « Conseils de préparation »
  restent annoncés.

## E9 · Jumanly Partners (14 octobre 2026)

### Fait

- Données : lots de licences (`LicenseBatch`), licences (`License`) et liens d'invitation
  (`LicenseLink`), type d'institution sur l'organisation partenaire.
- Admin `/admin/partenaires` : création d'un partenaire et invitation de son responsable, lots
  (forfait Starter, Pro ou Premium, nombre, durée par bénéficiaire, contrat, montant, seuil
  d'anonymat), suivi des activations.
- Espace partenaire (sélecteur d'espace, rôle `partner_manager`) : tableau de bord (licences
  achetées, distribuées, activées, bénéficiaires actifs, usage agrégé, activité par mois),
  licences (codes, révocation, export CSV, lien d'invitation, import CSV ou saisie d'e-mails,
  relance), rapports d'impact par période et par lot, export PDF.
- `/activer` : code ou lien, aperçu de l'offre, connexion ou inscription en conservant le code,
  activation, licence en attente si le forfait payé est supérieur, erreurs de la partie 02.
- Talent : carte « Licence offerte par… » sur Mon abonnement (dates, jours restants, fin proche,
  accord pour compter une embauche), notifications et e-mails d'activation.
- Tâche de fond (`pnpm jobs:billing`) : avis 7 jours avant la fin, fin de licence, codes des lots
  terminés expirés.
- Moteur de droits : le forfait le plus élevé l'emporte, la licence à égalité (voir décisions).
- Démo : « Fondation Démo (partenaire fictif) », compte `partenaire@jumanly.test`, lot de 40
  licences Pro, 12 bénéficiaires fictifs, codes `JMLY-DEMO-AAAA`, `-BBBB`, `-CCCC`, lien
  `/activer?lien=demo-lien-fictif` ; compte `talent.licence@jumanly.test` pour essayer un code.
- Décisions : `docs/decisions/2026-10-14-partners.md`.

### Définition de fini

| Critère | État |
|---|---|
| Aucune donnée nominative dans l'espace partenaire | ✓ test en base dédié |
| Seuil de 10 personnes par cellule | ✓ tests unitaires et en base |
| Règles de priorité de l'abonnement `sponsored` | ✓ tests en base (inférieur, supérieur, fin de contrat) |
| Isolation entre partenaires | ✓ tests en base |
| Parcours 6.8 (lot, distribution, activation, rapports) | ✓ e2e |
| Lint, types, tests unitaires et en base, build, e2e | ✓ en local ; CI à l'ouverture de la PR |

### Dettes et points ouverts

- Règle commerciale pour un forfait payé inférieur pendant une licence (remboursement, report).
- Rapport mensuel par e-mail, page Paramètres du partenaire, suivi des adresses injoignables.
- Pas de déclaration d'embauche hors plateforme : seules les embauches marquées « recruté » sur
  Jumanly comptent, avec l'accord du bénéficiaire.

## E8 · Hire avancé et Companies (14 octobre 2026)

### Fait

- Structure : équipes et départements (`Team`), entités et filiales (`OrgEntity`), rattachement des
  membres et des invitations à une équipe, transfert de propriété. Profil d'organisation complété
  (raison sociale, type, e-mail de contact recrutement). Onglets Organisation : profil,
  vérification, membres, équipes, départements, entités, lien vers l'abonnement.
- Offres : responsable, équipe, département, entité et équipe de recrutement (`JobAssignment`),
  filtres de la liste, portée par rôle (`jobScope`) appliquée à toutes les lectures Hire.
- Évaluation : modèle de grille par offre, grille sur la fiche candidat (avis masqués avant le
  sien), notes d'équipe avec mentions (@Prénom) et notification, modification et suppression par
  l'auteur, export CSV de l'historique.
- Talents : recherche dans le vivier (filtres approfondis selon le forfait, quota par requête
  distincte, profils anonymes), fiche talent journalisée, demandes de mise en relation (accepter,
  décliner, bloquer), onglet « Demandes de mise en relation » côté talent, réglage de
  confidentialité « Recevoir des demandes ». Viviers privés, d'équipe ou d'organisation.
- Entretiens : invitation dans la conversation (1 à 3 créneaux, vidéo, sur place ou audio,
  participants), réponse du talent (choisir, proposer, décliner), reprogrammation, annulation,
  « terminé » ou « absent », e-mails d'invitation et de confirmation, rendez-vous à venir sur les
  deux tableaux de bord.
- Rapports par niveau (vue d'ensemble, statistiques, avancés, consolidés, par entité), périodes et
  dates personnalisées, export CSV et PDF.
- Vérification d'entreprise : demande, file `/admin/organisations` (approuver, refuser, retirer le
  badge), e-mail aux propriétaires, bandeau sur le tableau de bord Hire.
- Page publique `/entreprises/[slug]` (présentation, badge, offres ouvertes), liée depuis chaque
  offre et listée dans le sitemap.
- Tableau de bord Hire : entretiens de la semaine, évaluations à compléter, mises en relation
  acceptées, quotas (recherches, mises en relation, crédits IA), raccourcis mobiles vers Viviers,
  Entretiens et Rapports.
- Démo : « Groupe Démo (groupe fictif) » sur Company Premium (contrat fictif), comptes
  `groupe@` (propriétaire) et `manager@` (responsable du recrutement), talents `talent.visible@`
  (visible) et `talent.anonyme@` (anonyme), équipe, département, deux entités, un vivier partagé et
  un entretien à confirmer. Mot de passe inchangé.
- Décisions : `docs/decisions/2026-10-14-hire-avance.md`.

### Définition de fini

| Critère | État |
|---|---|
| Chaque fonction gouvernée par une clé de droits de la partie 05 | ✓ aucun nom de forfait dans le code |
| Isolation des nouvelles tables par organisation | ✓ tests en base (viviers, entretiens, grilles, demandes) |
| Consentement du talent avant tout échange | ✓ tests en base et parcours e2e |
| Parcours 6.5 (recherche et mise en relation), entretien, vérification | ✓ e2e desktop et mobile |
| Lint, types, tests unitaires et en base, build, e2e | ✓ en local ; CI à l'ouverture de la PR |

### Dettes et points ouverts

- Pas de téléversement de pièces ni de code envoyé au domaine pour la vérification ; pas de statut
  « à renouveler ».
- Pas d'export agenda (.ics) ni de rappel automatique avant un entretien (tâche de fond à venir).
- Fuseau horaire : celui de `DEFAULT_TIME_ZONE` pour tous ; un fuseau par utilisateur reste à faire.
- Tableaux de bord personnalisés : ventilation par entité seulement.

## E7 · Paiements : webhooks, renouvellement, factures (14 octobre 2026)

### Fait

- Fournisseur : le propriétaire n'a pas encore choisi de fournisseur Mobile Money ni de passerelle
  carte (décision du 14 octobre). Tout le parcours est construit sur l'interface `PaymentProvider`
  avec l'adaptateur factice ; un adaptateur réel s'ajoute dans `src/server/payments` sans
  toucher au reste.
- Tables : événements de paiement (`PaymentEvent`, unique par fournisseur et identifiant),
  factures (`Invoice`, numéro séquentiel JMN-AAAA-000001), informations de facturation
  (`BillingDetails`), clés d'idempotence des tâches (`JobRun`) ; paiement : type (nouveau,
  renouvellement, montée), crédit, payeur, remboursement ; offre mise en pause par la facturation ;
  membre suspendu.
- Webhooks `POST /api/webhooks/payments/[provider]` : corps brut, signature vérifiée (HMAC pour le
  fournisseur factice), événement enregistré avant traitement, rejeu sans effet, montant contrôlé.
  Le webhook et l'interrogation du fournisseur passent par la même fonction : un paiement ne
  quitte l'attente qu'une fois (activation, facture, e-mail et notification uniques).
- Devis de paiement : renouvellement prépayé à la fin de la période, renouvellement vers le
  forfait moins cher programmé (qui commence à la fin de la période), montée en gamme immédiate
  avec crédit du temps non utilisé, réduction de gamme refusée au paiement et programmée.
- Tâches `POST /api/jobs/billing` (secret `JOBS_SECRET`) et `pnpm jobs:billing` : paiements sans
  réponse expirés, rappels J-7, J-3, J-0 (notification et e-mail), délai de grâce de 3 jours,
  retour au gratuit sans perte de données ; pour une organisation, offres et membres au-delà des
  limites mis en pause, puis rétablis au paiement suivant.
- Factures PDF (`/app/abonnement/factures/[id]/pdf`), lien dans l'historique, sur l'écran de
  succès et dans le reçu ; informations de facturation modifiables dans « Mon abonnement » ;
  bandeaux d'échéance et de délai de grâce ; référence du paiement affichée pendant l'attente.
- Admin : `/admin/abonnements` (abonnements par statut, paiements, factures, remboursement manuel
  journalisé) ; `/admin` : encaissé sur 30 jours, conversion Free vers payant, taux de
  renouvellement, dépenses IA.
- Tests : unitaires (rappels, numéros, signature), base (webhook rejoué, signature fausse,
  montant différent, échec, factures séquentielles, crédit de montée, renouvellement vers un forfait
  moins cher, rappel unique, délai de grâce puis retour au gratuit et rétablissement), e2e (échec,
  attente confirmée par webhook rejoué, facture PDF, crédit affiché, remboursement par l'admin).

### Définition de fini

| Critère | État |
|---|---|
| Parcours testés : succès, échec, expiration, webhook rejoué | ✓ avec le fournisseur factice ; à rejouer dans le bac à sable du fournisseur retenu |
| Fin de délai de grâce : retour au gratuit sans perte de données | ✓ `tests/db/billing.test.ts` |
| Lint, types, tests, build | ✓ en local ; CI à l'ouverture de la PR |

### Dettes et points ouverts

- Voir `docs/decisions/2026-10-14-paiements.md`.
- Fournisseur Mobile Money et passerelle carte à choisir par le propriétaire, puis adaptateurs à
  écrire d'après leur documentation officielle et parcours à rejouer dans leur bac à sable.
- Mentions légales et fiscales des factures à fournir par l'équipe (partie 09).
- Planificateur à configurer chez l'hébergeur (appel horaire de `/api/jobs/billing`).
- Choix par le recruteur des offres et membres gardés actifs au retour au gratuit : automatique
  pour l'instant (offres les plus récentes, propriétaires d'abord).

## E6 · Intelligence v1 : matching explicable et IA (14 octobre 2026)

### Fait

- Tables : poids du matching versionnés, résultats de matching (score, bande, explication,
  version des poids), vecteurs pgvector, consommation IA (`AiUsage`), suggestions IA en attente,
  demandes de révision, plan de progression.
- Calcul déterministe (`src/server/matching`) : normalisation du profil sans nom, genre, âge,
  photo, nationalité, religion, situation familiale, santé ni adresse ; huit critères et poids du
  § 8.3 ; bandes 85, 70, 50 ; critère non applicable retiré du calcul ; information absente à
  0,5 ; critères éliminatoires signalés « à vérifier », jamais appliqués ; proximité sémantique
  par vecteurs quand un fournisseur est configuré.
- Talent : score et bande sur les listes d'offres, « Pourquoi ? » complet sur l'offre (critères
  remplis, partiels, compétences manquantes avec les formations Jumanly et le score obtenu après
  la formation, verrou de forfait), signalement d'erreur et révision humaine ; désactivation du
  calcul dans les paramètres ; score figé dans la candidature au moment de l'envoi.
- Recruteur : score sur les cartes du pipeline et tri par score ; « Pourquoi ? » sur la fiche
  candidat, réduit (trois raisons) ou complet selon `hire.matching.level` ; verrou sinon.
- Recommandations : offres compatibles et formations utiles sur le tableau de bord, formations sur
  `/app/learn`.
- Couche IA (`src/server/ai`) : consentement, droit, crédits `ai.credits.monthly` (rendus si
  l'appel échoue), sortie validée par Zod, journal `AiUsage` avec coût estimé ; modèles lus dans
  `AI_MODEL_DEFAULT` et `AI_MODEL_FAST` ; adaptateur factice sans clé `ANTHROPIC_API_KEY`.
- Coach CV : score du CV par règles (gratuit), suggestions IA avec « Pourquoi ? », Appliquer et
  Ignorer ; garde-fou qui refuse toute suggestion ajoutant un chiffre ou une compétence absente.
- Import de CV par texte collé : extraction par l'IA ou par règles, chaque élément validé par le
  talent avant d'entrer dans le profil.
- Diagnostic personnalisé (niveau `personalized` de `career.diagnostic.level`) ; plan de
  progression (`career.progress_plan`) créé depuis le diagnostic, modifiable par le talent.
- `/admin/ia` : consommation et coût par fonction et par forfait (modèles sans tarif signalés),
  répartition des scores, nouvelle version des poids (journalisée), révisions humaines.
- Page publique `/comment-fonctionne-le-matching`, ajoutée au plan du site.
- Tests : unitaires (bornes, monotonie, critères non applicables, score recalculé, garde-fou du
  coach, coût), base (contrefactuel nom et photo, désactivation, score figé, crédits et consentement,
  révision), e2e (import de CV, score et « Pourquoi ? », révision traitée par l'admin, accessibilité
  de la page publique et de l'admin IA).

### Définition de fini

| Critère | État |
|---|---|
| Tests de matching : contrefactuels, monotonie, bornes, critères non applicables | ✓ `tests/unit/matching.test.ts`, `tests/db/matching.test.ts` |
| Score affiché identique au score recalculé depuis l'explication | ✓ unitaire et base |
| Aucun appel IA sans consentement ni quota | ✓ `tests/db/ai.test.ts` |
| Coût IA visible par fonction et par forfait dans l'admin | ✓ `/admin/ia` |
| Lint, types, tests, build | ✓ en local ; CI à l'ouverture de la PR |

### Dettes et points ouverts

- Voir `docs/decisions/2026-10-14-intelligence.md`.
- Délai de réponse aux révisions affiché : 5 jours ouvrés, à confirmer par le propriétaire.
- Le texte de la page publique dit que le recruteur peut ajuster les poids de son offre : cet
  ajustement par offre est reporté ; les poids sont aujourd'hui ceux de l'admin.
- Import de CV en PDF ou Word, analyse de CV côté recruteur (`hire_cv_analysis`) et mesure du
  taux d'ouverture du « Pourquoi ? » : reportés.
- Les e-mails de réponse aux révisions passent par la notification dans l'application ; l'e-mail
  dédié viendra avec les gabarits d'E7 ou d'E10.

## E5 · Learn : formations, quiz et attestations (14 octobre 2026)

### Fait

- Tables : inscriptions (progression, leçons terminées, dernière leçon), quiz, questions,
  tentatives, attestations (numéro JMN-XXXX-XXXX, révocation), notes de leçon, formations
  enregistrées ; formateur, prérequis, ressources et transcription des leçons ; statuts « en
  relecture » et « archivée ».
- `/app/learn` : catalogue connecté (recherche, listes « Mes formations », « Enregistrées »,
  « Terminées »), verrou « Disponible avec {forfait} » calculé depuis `learn.catalog.level`.
- `/app/learn/[slug]` : fiche avant de commencer (programme, prérequis, formateur, verrou ou
  « Commencer », enregistrer), puis lecteur : vidéo HLS avec qualité « Économie de données » et
  vitesse (adaptateur vidéo, Bunny Stream si configuré), texte, exercice, ressources,
  transcription, « Marquer comme terminée », notes privées, sommaire avec progression, quiz avec
  correction expliquée et nombre de tentatives.
- Attestation à la fin (toutes les leçons faites, quiz réussis) : notification, e-mail, PDF
  (`/app/learn/attestations/[id]/pdf`), page publique `/attestations/[code]` (authentique,
  révoquée, introuvable) avec formulaire de vérification. Les compétences de la formation sont
  ajoutées au profil comme vérifiées (source « formation », preuve « attestation »).
- Leçon en aperçu jouée sur la fiche publique `/formations/[slug]` quand c'est une vidéo.
- Admin : rôle `content_editor` (ne voit que les formations), `/admin/formations` (liste,
  nouveau brouillon) et l'éditeur (fiche, compétences du référentiel, modules, leçons, quiz et
  questions, statut avec contrôles avant publication, révocation d'une attestation). Chaque
  écriture est journalisée et rafraîchit le catalogue public.
- Démo : comptes `talent.starter@` et `editeur@`, formateur et quiz fictifs sur les formations.
- Tests : unitaires (accès par niveau, correction des quiz, numéros, éditeur, e-mail), base
  (Free contre « fondamentaux », parcours jusqu'à l'attestation et compétences vérifiées,
  tentatives, notes, révocation), e2e (l'éditeur crée et publie, un talent Free suit jusqu'à
  l'attestation et la vérifie ; verrou Free et ouverture Starter ; accessibilité).

### Définition de fini

| Critère | État |
|---|---|
| Un éditeur crée une formation complète dans l'admin | ✓ `tests/e2e/learn.spec.ts` |
| Un talent Free suit une formation gratuite jusqu'à l'attestation | ✓ e2e et `tests/db/learn.test.ts` |
| Une formation « fondamentaux » est verrouillée en Free et ouverte en Starter | ✓ e2e et base |
| Lint, types, tests, build | ✓ en local ; CI à l'ouverture de la PR |

### Dettes et points ouverts

- Voir `docs/decisions/2026-10-14-learn.md` : questions entre apprenants, téléversement des
  vidéos, sous-titres, notes horodatées et reprise à la seconde près reportés.
- Les vidéos de démonstration n'existent pas : les leçons vidéo affichent « La vidéo de cette
  leçon n'est pas encore disponible » tant qu'aucun identifiant Bunny n'est saisi.
- Licences proposées par un partenaire (« attendez qu'une licence vous soit proposée ») : avec
  Partners (E9).

## E4 · Hire, Connect et modération légère (14 octobre 2026)

### Fait

- Tables : offres en vérification ou refusées (signaux et motif de modération, auteur, message de
  refus), invitations, conversations liées aux candidatures, messages (texte, demande de document),
  notifications, signalements.
- Espace organisation : sélecteur d'espace (cookie vérifié contre les adhésions à chaque requête),
  navigation Hire, cloche de notifications.
- `/app/hire` (à traiter, offres actives, quotas `org.seats` et `jobs.active.max`),
  `/app/hire/offres` (onglets, limite d'offres actives, fermer, supprimer un brouillon),
  formulaire d'offre sur une page (brouillon ou publication), pipeline par étapes avec un
  formulaire de déplacement par carte, fiche candidat (consultation journalisée, CV envoyé,
  lettre, critères éliminatoires signalés sans écarter, notes d'équipe, historique des décisions,
  décision « Ne pas retenir » avec motif interne et message, demande de document).
- Connect : `/app/messages` et la conversation (demande de document, réponse avec un CV,
  bloquer, signaler), `/app/notifications`.
- `/app/organisation` (profil, membres, rôles selon `org.permissions.level`, invitations dans la
  limite des sièges) et `/app/invitation/[token]`.
- Modération : vérification automatique à la publication (paiement demandé, critère protégé,
  contact hors plateforme), « Signaler cette offre » sur l'offre, `/admin/offres` (approuver,
  refuser, dépublier) et `/admin/signalements` (classer, masquer).
- E-mails Hire et Connect avec aperçu local (`pnpm email:dev`, fichiers `emails/hire-*`,
  `connect-*`, `organisation-*`).
- Tests : base (isolation complète entre deux organisations, rôles, limite d'offres RH Free,
  vérification, compétences inconnues, historique sans les notes côté talent, sièges, signalements,
  premier message d'un talent), unitaires (rendu des e-mails), e2e (parcours complet, isolation par
  l'URL, accès à Hire refusé à un talent, accessibilité des écrans Hire, Connect et admin).

### Définition de fini

| Critère | État |
|---|---|
| E2e « recruteur publie → talent postule → recruteur fait avancer → message → décision → talent voit le statut » | ✓ `tests/e2e/hire.spec.ts` |
| Test d'isolation entre deux organisations | ✓ `tests/db/hire.test.ts` et e2e par l'URL |
| E-mails visibles en local (aperçu React Email) | ✓ `pnpm email:dev` |
| Lint, types, tests, build | ✓ en local ; CI à l'ouverture de la PR |

### Dettes et points ouverts

- Voir `docs/decisions/2026-10-14-hire-connect.md` : entretiens, grilles d'évaluation, viviers et
  recherche de talents (E8), poids des critères (E6), étapes personnalisées, glisser-déposer et
  attribution des offres reportés.
- La réponse à une demande de document se limite aux CV : le dépôt de fichiers arrive avec le
  stockage (S3).
- La détection « contact hors plateforme » signale aussi les longues suites de chiffres ; l'offre
  passe alors en vérification, sans être refusée.

## E3 · Profil, Career, candidatures (14 octobre 2026)

### Fait

- Tables : profil enrichi (résumé, disponibilité, préférences, langues, complétude), expériences,
  formations, preuves de compétences, documents (CV), diagnostics, étapes de recrutement,
  candidatures avec historique, offres enregistrées.
- `/app/profil` : toutes les sections, enregistrées une par une, sans JavaScript ; jauge de
  complétude calculée par règles (`completeness`).
- `/app/career` et `/app/career/diagnostic` : diagnostic simplifié en 12 questions, bilan par
  règles fixes, historique.
- `/app/career/cv` : plusieurs CV, rempli depuis le profil, sections ordonnables et masquables,
  3 modèles (verrou de forfait au-delà du droit), aperçu, export PDF (`@react-pdf/renderer`).
- `/app/jobs` (recherche, enregistrement, « Candidature envoyée »), `/app/jobs/[slug]` (offre et
  formulaire de candidature : CV ou profil seul, lettre facultative), `/app/jobs/candidatures`
  (statut, historique, CV envoyé, retrait), `/app/jobs/enregistrees`.
- Tableau de bord `/app` : prochaine étape, indicateurs, parcours, candidatures en cours, quotas.
- « Mon profil » dans le menu du compte ; le corps d'une offre est partagé entre la page publique
  et l'espace connecté (`JobBody`).
- Tests : unitaires (complétude, diagnostic, CV, PDF), base (candidature gratuite pour chaque
  forfait et même sans droit ni quota, doublon, offre close, retrait, copie du CV), e2e (parcours
  complet d'un talent Free depuis une offre publique, diagnostic, accessibilité des nouvelles pages).

### Définition de fini

| Critère | État |
|---|---|
| Un talent Free crée son profil, génère un CV PDF, postule et suit sa candidature | ✓ e2e `talent.spec.ts` |
| La candidature n'est jamais bloquée par un quota ou un forfait (test dédié) | ✓ `tests/db/applications.test.ts` |
| Lint, types, tests, build | ✓ en local ; CI à l'ouverture de la PR |

### Dettes et points ouverts

- Voir `docs/decisions/2026-10-14-profil-career-jobs.md` : photo, import de CV, alertes, score et
  carte IA reportés ; fiches conseils sans contenu (à fournir).
- Les compteurs « Formations en cours » du tableau de bord restent à 0 jusqu'à Learn (E5).

## E2 · Comptes, inscription avec forfaits, moteur de droits (13 octobre 2026)

### Fait

- **Authentification** (Better Auth) : e-mail et mot de passe, code à 6 chiffres pour vérifier
  l'adresse, lien magique, réinitialisation, Google si configuré, vérification en deux étapes par
  e-mail (obligatoire pour les administrateurs), sessions de 30 jours, comptes suspendus bloqués.
- **Inscription en 6 étapes** depuis `/tarifs` : profil, forfait, compte, vérification, paiement,
  bienvenue. Organisation créée automatiquement pour un recruteur ou une entreprise.
  « Payer plus tard » laisse le compte en Free ; un bandeau « Finaliser mon forfait » le rappelle.
- **Moteur de droits** (`src/server/entitlements`) : `resolvePlan`, `can`, `level`, `limit`,
  `usage`, `consume` (atomique), dérogations, délai de grâce de 3 jours, quotas par mois glissant.
- **Paiement** : interface `PaymentProvider`, prestataire factice (local et preview) qui simule
  succès, échec, expiration et attente selon le numéro ; activation idempotente ; renouvellement,
  montée en gamme immédiate, descente programmée, résiliation en fin de période, essai de 14 jours.
- **Pages** : `/app/abonnement` (forfait, jauges de quotas, changement, historique),
  `/app/abonnement/payer`, `/app/parametres` (compte, sécurité, confidentialité, mes données, export
  JSON, suppression avec 30 jours pour changer d'avis), `/app/bienvenue`.
- **Admin minimale** (`/admin`) : indicateurs de base, utilisateurs (recherche, suspension, rôles),
  forfaits et droits modifiables sans redéploiement, journal d'audit. Support en lecture seule.
- **Comptes de démonstration** (local et preview, domaine réservé `.test`, mot de passe
  `Demo-Jumanly-2026`) : `talent.free@`, `talent.pro@`, `rh@`, `entreprise@` et `admin@jumanly.test`
  (l'admin reçoit son code de connexion dans la console ou le fichier `EMAIL_OUTBOX_FILE`).
- `pnpm admin:promote <e-mail>` donne le rôle d'administrateur au premier compte d'un environnement.
- Tests : règles pures (`pnpm test`), règles en base pour chaque forfait (`pnpm test:db`), parcours
  e2e (inscription Pro payée, payer plus tard, connexion, déconnexion, réinitialisation, paramètres,
  admin qui change un quota pris en compte sans redémarrage, accessibilité des nouvelles pages).

### Définition de fini

| Critère | État |
|---|---|
| Tests unitaires du moteur de droits pour chaque forfait | ✓ `tests/db/entitlements.test.ts` (11 forfaits) |
| E2e : visiteur → Pro sur /tarifs → inscription → paiement factice → tableau de bord avec Pro actif | ✓ |
| E2e : payer plus tard → compte en Free | ✓ |
| Changer un quota dans l'admin change le comportement sans redémarrage | ✓ e2e |

### Dettes et points ouverts

- Voir `docs/decisions/2026-10-13-comptes-droits.md` (cache en mémoire, essai sans prestataire,
  éléments reportés).
- La suppression définitive des comptes après 30 jours sera faite par une tâche de fond (E10).
- Les reçus de paiement partent par e-mail ; les factures PDF arrivent avec le vrai prestataire (E8).

## E1 · Site public (13 octobre 2026)

### Fait

- Base : formules et matrice complète des droits (`prisma/seed/plans.ts`, 11 formules), référentiel
  de 329 compétences, démonstration manifestement fictive (« Horizon Démo (entreprise fictive) »,
  10 offres, 6 formations) chargée seulement en local et en preview.
- Pages publiques rendues côté serveur : accueil, à propos, talents, recruteurs, entreprises,
  partenaires (avec formulaire), formations (recherche, filtres, fiche avec leçon en aperçu), offres
  (recherche, filtres, fiche avec données structurées `JobPosting`), tarifs (onglets, cartes,
  comparatifs calculés depuis les droits, FAQ facturation), FAQ (recherche, `FAQPage`), contact,
  quatre pages légales en gabarit, page 404.
- Formulaire de contact : validation Zod partagée, routage vers la bonne boîte (pro ou générale),
  enregistrement (`ContactMessage`), limite de 3 messages par adresse en 10 minutes, envoi par
  e-mail (adaptateur factice en local, Resend si `RESEND_API_KEY`).
- SEO : métadonnées et Open Graph par page, image Open Graph générée, `sitemap.xml`, `robots.txt`.
- Bandeau cookies (nécessaires / mesure d'audience / préférences), réouvrable depuis le pied de page.
- Tests : unitaires (liens d'inscription, textes des formules et des comparatifs, formulaire,
  filtres, consentement) et e2e (toutes les pages, boutons vers `/inscription`, formulaire,
  cookies, accessibilité axe, budget JavaScript). La CI charge maintenant les données (`pnpm db:seed`).

### Définition de fini

| Critère | État |
|---|---|
| Pages rendues côté serveur | ✓ (le contenu principal est dans le HTML, vérifié en e2e) |
| Lighthouse mobile ≥ 90 (perf., accessibilité, SEO) | ✓ `/` 99/100/100, `/formations` 93/98/100, `/offres` 96/98/100, `/tarifs` 98/100/100 (build `APP_ENV=production`) |
| « Postuler », « Commencer », « Choisir » mènent à `/inscription` avec les bons paramètres | ✓ testé en e2e et en unitaire pour chaque formule |
| Aucun numéro de téléphone | ✓ aucun lien `tel:` sur les pages publiques (e2e) |
| Budget de 200 Ko de JavaScript compressé | ✓ testé en e2e sur `/`, `/formations`, `/offres`, `/tarifs` |

### Dettes et points ouverts

- Pages légales : contenu à faire valider par un juriste (elles répondent 404 en production tant
  qu'elles contiennent des emplacements `[...]`).
- `/inscription`, `/connexion` et `/activer` sont des liens vers des écrans livrés en E2.
- Décisions détaillées : `docs/decisions/2026-10-13-site-public.md`.
- Déploiement Hostinger : en attente d'une base PostgreSQL externe (Neon proposé au propriétaire).

## E0 · Socle technique (13 octobre 2026)

### Contexte

Fournis : `CLAUDE.md`, la feuille de route (aujourd'hui partie 12 de `docs/specifications.md`), `ressources/jumanly-tokens.css`, les textes
officiels (`textes/textes-application.md`, parties 01 à 10, environ 5 900 textes), la charte graphique,
le LISEZMOI des maquettes et les logos.
Puis le cahier des charges complet `docs/specifications.md` (parties 01 à 12) : le socle a été
réaligné sur ses parties 02 (stack, arborescence, variables), 03 (environnements) et 11 (design
system). `CLAUDE.md` cite encore `docs/01` à `docs/11` comme fichiers séparés : ces parties sont
toutes dans `docs/specifications.md`.

### Fait

- Next.js 16 (App Router, Turbopack), TypeScript strict, React 19.
- Tailwind CSS 4 branché sur les jetons officiels : `bg-sapin`, `text-lime`, `rounded-card`,
  `text-h1`, `bg-gradient-ai`, `bg-ai-orb`…
- Police Sora auto-hébergée (voir la décision du jour).
- ESLint (règles Next + **aucun texte en dur dans le JSX**), Prettier (les `.md` ne sont pas reformatés).
- Textes officiels branchés : gabarits, composants et e-mail utilisent les clés officielles
  (`nav.*`, `appNav.*`, `footer.*`, `common.*`, `a11y.*`, `billing.quotas.*`, `ai.*`, `mail.*`).
  Les textes propres au socle (page `/dev/composants`, écrans provisoires, personnages) forment la
  partie 11 « Socle technique » de `textes/textes-application.md`.
- next-intl, langue `fr`, clés typées. Aucun texte n'est envoyé au navigateur par défaut : un
  composant client qui en a besoin reçoit seulement ses espaces de noms (`pickMessages`). `scripts/build-messages.ts` lit les tableaux `| Clé | Texte |` de
  `textes/*.md` et génère `messages/fr.json` ; il signale doublons, clés invalides, textes vides et
  conflits. Les segments numériques sont acceptés (`system.404.title`). `pnpm messages` régénère, `pnpm messages:check` vérifie (CI et `pnpm build`).
- Prisma 7 + PostgreSQL 16 avec pgvector (Docker Compose), migration `enable_pgvector`,
  `pnpm db:seed` prêt (vide jusqu'à E1).
- Bibliothèque de composants (`src/components/ui`) : Button, ButtonLink, TextField, TextArea, Select,
  Checkbox, RadioGroup, Switch, Badge, Card, Alert, Avatar, Tabs, ProgressBar, ProgressRing,
  QuotaGauge, Skeleton, Spinner, EmptyState, Modal, AiOrb, ExplainedScore (score + « Pourquoi ? »), Logo.
- Page `/dev/composants` : couleurs, dégradés, typographie et tous les composants avec leurs états.
- Gabarits : site public (en-tête, menu mobile sans JavaScript, pied de page avec les deux adresses
  e-mail) ; espace connecté (barre latérale desktop, barre basse mobile, lien « Aller au contenu »).
- E-mails : gabarit commun React Email (pied de page officiel avec les deux adresses) et e-mail de
  bienvenue talent ; `pnpm email:dev` (aperçu sur le port 3001).
- Tests : Vitest (script des textes, composants, e-mail), Playwright desktop + mobile (pages,
  modale au clavier, navigation adaptée à l'écran, aucun lien `tel:`, moins de 200 Ko de JS sur `/`).
- GitHub Actions : textes, format, lint, types, tests, migrations sur pgvector, build, e2e.
- `.env.example` avec les variables prévues (dont `AI_MODEL_DEFAULT`, `AI_MODEL_FAST`).

### Réalignement sur `docs/specifications.md`

- Arborescence de la partie 02 : `textes/textes-application.md`, `src/styles/tokens.css`,
  `src/components/brand/` (logo, orbe IA), `emails/` à la racine, `prisma/seed/`.
- Design system (§ 11) : bouton principal Lime, secondaire Sapin, tertiaire contour, bouton icône
  rond ; titres réduits sur mobile ; focus Sapin + halo Lime ; marges 16/32/48 px ; zones tactiles
  de 44 px ; hiérarchie par les fonds (plus d'ombres) ; teintes de carte par module.
- Espace connecté (§ 11.4) : barre latérale Sapin de 92 px, panneau Crème à coins de 32 px ;
  sur mobile, en-tête Sapin, feuille Crème et navigation flottante en pilule.
- Composants ajoutés (§ 11.5) : champ de recherche, filtres en pilule (sans JavaScript), pile
  d'avatars, badges score / « Nouveau » / module / « Vérifiée » / contrat / tendance, carte de
  statistique, carte de formation, carte d'offre, carte IA, étapes de pipeline, notification
  (toast Sapin), tiroir mobile, tableau, verrou de forfait, carte de formule, état vide illustré,
  onglets soulignés.
- `/dev/composants` n'existe qu'en local et en preview (`APP_ENV`), 404 ailleurs.
- Husky + lint-staged avant chaque commit ; tests d'accessibilité axe (WCAG 2.2 AA) sur toutes les
  pages ; `.env.example` aligné sur la partie 02.
- Les tests axe ont trouvé des contrastes insuffisants (texte Corail, bouton danger, texte Ardoise
  sur fond teinté) : corrigés avec des teintes foncées (Corail, Feuille, Ambre foncés).

### Ressources de la marque (reçues le 13 octobre)

- `ressources/` complété avec les archives reçues : 41 icônes en 3 styles, 5 personnages et Orbi
  (SVG et PNG, 6 poses), motifs, formes et fonds. Fichiers gardés tels quels.
- `pnpm brand` (`scripts/build-brand-assets.ts`) en tire ce que le site sert : composant `Icon`
  (un seul jeu, dessiné en `currentColor`, style duo en option) et copies SVG dans `public/`.
  Chaque SVG fourni contient un manifeste de provenance d'environ 7 Ko : il est retiré des copies
  servies, pas des originaux. `pnpm brand:check` tourne en CI, avant le build et avant chaque commit.
- Icônes de la marque dans la navigation, les cartes, les champs, les fenêtres et les badges ;
  `lucide-react` ne sert plus que pour ce que la marque n'a pas (menu, chevron, alertes, tendances).
- Personnages : composants `Character` et `Orbi` ; l'état vide affiche Amani au repos (usage des
  poses du § 11.7).
- Cahier des charges à jour installé tel quel : `CLAUDE.md` (avec la liste des commandes complétée),
  `PROMPT-DEMARRAGE.md`, `LISEZMOI.md`, `docs/specifications.md`, `textes/textes-application.md`,
  `ressources/logos/` (favicons inclus) et `ressources/LISEZMOI.md`. Les dessins des logos sont
  identiques aux précédents. `docs/12-feuille-de-route.md` est retiré : c'est la partie 12 du cahier.
- Textes du socle fusionnés dans `textes/textes-application.md` (partie 11), à la demande du
  propriétaire : un seul fichier de textes, comme le veut `CLAUDE.md`.

### Définition de fini

| Critère | État |
|---|---|
| `pnpm dev` démarre | ✓ |
| `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` passent en CI | ✓ en local ; CI à l'ouverture de la PR |
| `/dev/composants` montre tous les composants avec leurs états | ✓ liste complète de § 11.5 |
| Aucun texte en dur | ✓ garanti par ESLint |

### Dettes et points ouverts

- `CLAUDE.md` mis à jour (avec l'accord du propriétaire) pour renvoyer vers `docs/specifications.md`.
- Budget JavaScript : 179 Ko compressés sur `/` pour 200 Ko autorisés, dont environ 165 Ko pour
  React et Next.js eux-mêmes. Peu de marge : chaque composant client ajouté aux pages publiques doit
  être pesé. Les composants client (`Drawer`, `Modal`, `Switch`, `Tabs`, `Toast`) sont importés depuis leur propre
  fichier, pas depuis `@/components/ui`. `lucide-react` coûte environ 9 Ko : à remplacer par les
  icônes SVG de la marque si la marge manque.
- Textes : les emplacements entre crochets `[...]` ne doivent jamais s'afficher en production (règle
  de la partie 01) ; à contrôler à partir de E1.
- Better Auth, Resend, S3, Inngest et l'API Claude ne sont pas installés : chacun arrive avec l'étape
  qui l'utilise (variables déjà dans `.env.example`).
- Le dépôt n'avait pas de branche `main` : création soumise à l'accord du propriétaire.
- Accueil et tableau de bord sont provisoires (bloc principal seulement) : complets en E1 et E3.

## 2026-10-17 · Expérience mobile Talent, version 7 (maquettes et brief)

- Retours d'Ephraïm : `docs/ux-mobile-talent/CAHIER-DES-CHARGES-V7.md` (dictée + reformulation).
- En-tête sans logo, titre en grand, barre de recherche unique « Orbi » (nom de l'IA), barre du bas floutée et
  animée, leçon en blocs colorés, import de CV et expériences, mise en forme modernisée, modèles de refus et
  d'acceptation, réalisations mises en avant, connexions, badges Premium et Cap ; écrans 67 à 80.
- Brief § 7, prompt amélioré et prompts (prompt 10 ajouté) mis à jour. Quota de réalisations par forfait à
  confirmer dans la partie 05.

## 2026-10-17 · Expérience mobile, version 8 (maquettes et brief)

- `docs/ux-mobile-talent/CAHIER-DES-CHARGES-V8.md` : pays avec drapeaux (RD Congo puis Afrique centrale,
  Afrique de l'Ouest, reste de l'Afrique, hors d'Afrique, A à Z), villes par pays, ajout d'image et de PDF,
  profils suggérés (formules payantes), connexion avant tout message, recruteur sur mobile ; écrans 81 à 94.
- Brief § 8 et prompts (prompts 3 et 10 complétés, prompt 11 recruteur ajouté).

## 2026-10-17 · Expérience mobile, version 9 (maquettes et brief)

- `docs/ux-mobile-talent/CAHIER-DES-CHARGES-V9.md` : une à trois photos par réalisation, vues en carrousel
  dans le projet ; pour un nouveau poste, idées de photo (bureau, logo, carte de service) ; floutage des
  numéros et codes par Orbi, validé par la personne ; écrans 95 à 99, planche 0f.
- Brief § 9, prompt 10 complété. « C'est Irma » dans la dictée n'a pas été compris : noté dans le cahier.

## 2026-10-17 · Prompt 2 bis : navigation à cinq onglets, Compte, thème Vert, ouverture

- Rattrapage des ajouts V6-V8 au prompt 2 (choix d'Ephraïm « Rattraper d'abord »).
- Barre du bas : Offres, Apprendre, **Pour moi** au centre (rond surélevé avec le J), Suivi, **Compte**
  (photo ou initiales) ; pastille Lime qui glisse, petit rebond (couleur seule en mouvement réduit).
- En-tête téléphone : bouton Menu à gauche (Mes CV, tableau de bord, candidatures, entretiens,
  attestations, Mon espace ; Orbi « Bientôt disponible »), « + » qui ouvre « Créer », Messages avec son
  nombre, Notifications ; titre en grand ; recherche « Rechercher ou demander à Orbi » avec aperçu
  (offres et formations réelles) et bouton Filtres. Bouton Retour sur toutes les autres pages.
- Nouvelle page `/app/compte` (écrans 61, 62) et thème Vert enregistré par personne
  (`User.theme`, migration `20261017095528_user_theme`, retour arrière dans
  `docs/ux-mobile-talent/retour-arriere/prompt-2bis-theme.sql`).
- Ouverture de l'appli installée : `/ouverture` (écrans 57, 58), adresse de départ du manifeste.
- Choix et écarts : `docs/decisions/2026-10-17-mobile-talent-navigation-v6.md`.

## 2026-10-17 · Prompt 3 bis : pays avec drapeaux, villes et provinces (écrans 81 et 82)

- Référentiel en base : `Country` (249 pays ISO 3166, nom en français, région) et `Locality` (villes et
  provinces réelles, de la plus grande à la plus petite), migration `20261017115314_places`, données dans
  `prisma/seed/places-data.ts`, chargées partout par le seed. Retour arrière :
  `docs/ux-mobile-talent/retour-arriere/prompt-3bis-lieux.sql`.
- Drapeaux SVG libres (flag-icons 7.2.3, MIT) dans `public/drapeaux/`.
- Première connexion talent en trois écrans : pays (81, RD Congo en tête puis Afrique centrale, Afrique de
  l'Ouest, reste de l'Afrique, hors d'Afrique, recherche sans accents), objectif (01), où travailler (82 :
  plusieurs pays, « Tout le pays » ou villes et provinces, télétravail). Les précisions (métiers,
  compétences, contrats) restent facultatives, accessibles depuis l'écran 82.
- `TalentProfile.desiredCountries` (codes ISO) ; les lieux sont vérifiés contre le référentiel côté serveur.
- Offres : filtre « Mes lieux de travail » (`/app/jobs?lieux=1`), ouvert après « Voir mes offres ».
- La barre d'action fixe du téléphone restait dans le flux de la page (animation d'entrée gardant une
  transformation) : l'entrée des pages utilise désormais `backwards`.
- Choix et écarts : `docs/decisions/2026-10-17-mobile-talent-lieux.md`.

## 2026-10-17 · Prompt 4 bis : bannières d'entreprise, offres, leçon v7, Offres en Vert

- `Organization.banner` (migration `20261017125314_organization_banner`, retour arrière :
  `docs/ux-mobile-talent/retour-arriere/prompt-4bis-banniere.sql`). Bannière (3:1) et logo (carré)
  cadrés dans une fenêtre (glisser, flèches, zoom), envoyés en JPEG, enregistrés en WebP en plusieurs
  largeurs (`src/server/services/organization-brand.ts`), servis par `/medias/orgs/…`. Réservé aux
  administrateurs de l'organisation, depuis Organisation et depuis l'éditeur d'offre.
- Cartes d'offres de l'espace talent avec bannière (ou motif Jumanly), logo, marque vérifiée, faits et
  « Voir l'offre » (écrans 63, 66) ; même carte en aperçu dans l'éditeur d'offre. En-tête de l'offre
  refait (écran 64).
- Après l'envoi (écran 11) : quatre suites en cartes (Suivre, Préparer l'entretien, Adapter mon CV,
  Offres proches avec leur nombre réel), heure de réception, retour en icône. Connexion coupée (12) :
  valeurs alignées à droite, « Aujourd'hui, 20:14 ».
- Leçon v7 (écrans 14, 67 à 69) : onglets en cartes sans rechargement (la vidéo continue), blocs
  titrés « En bref », « Ce que vous allez faire », « La leçon », « À retenir », exercice en carte
  sombre, modules en cartes, transcription qui suit la vidéo et se cherche, ressources en fichiers.
  Le plan de la leçon (`content.brief`, `content.steps`, `content.takeaways`) s'écrit dans l'admin.
- Offres et détail d'une offre en Vert (écrans 65, 74).
- Choix et écarts : `docs/decisions/2026-10-17-mobile-talent-bannieres.md`.

## 2026-10-17 · Prompt 5 bis : modèles de refus et d'acceptation (écrans 55 et 80)

- Refus et acceptation proposés en trois tons, Chaleureux, Formel et Court (`hire.templates.tone.*`
  dans les textes), à côté du modèle de l'organisation ou de l'offre quand il existe (« Notre
  modèle »). Rien ne part sans le clic du recruteur.
- Champs remplis seuls et surlignés : prénom, poste, entreprise et point fort. Le point fort est la
  compétence de l'offre entièrement couverte par le candidat, prise dans l'explication figée à la
  candidature (`strongestSkill`), et seulement si l'organisation voit le matching ; sinon la phrase
  disparaît.
- Refus (écran 55) : aperçu exact, « Modifier le texte », bouton « Plus chaleureux / court / formel »
  qui change de ton. Acceptation (écran 80) : carte du candidat, puces de ton, modèle surligné,
  « Aperçu », « Ajouter un créneau » (avec le droit `connect.appointments`) : un appel de 30 minutes
  proposé sous la décision, que le talent confirme comme un entretien. Un candidat retenu peut donc
  recevoir une invitation ; un candidat refusé, jamais.
- « Personnaliser avec Orbi » reste un emplacement inactif jusqu'au prompt 8.
- Sur téléphone, la navigation Hire s'efface sur ces écrans pour ne plus couvrir la barre
  d'actions (`PhoneBarFlag`).
- Pas de migration.
- Tests : unitaires (point fort, surlignage, tons), base (appel proposé après une embauche, refusé
  après un refus), e2e acceptation en trois tons et refus « Plus court ».
- Choix et écarts : `docs/decisions/2026-10-17-mobile-talent-modeles-decision.md`.
- Au passage : dans Mes CV sur téléphone, la vignette d'un CV était un lien sans nom pour les
  lecteurs d'écran (relevé par le test d'accessibilité dès qu'un talent a plusieurs CV). Elle
  double maintenant le lien du titre sans être annoncée.

## 2026-10-17 · Refonte de l'expérience mobile, étape 1 : fondations

- Après le début des tests, Ephraïm demande de simplifier : une expérience par objectif (talent : se former,
  être accompagné, saisir l'opportunité ; recruteur : publier, trier, rassembler, décider, programmer).
- `docs/refonte-mobile/CAHIER-DES-CHARGES-REFONTE-MOBILE.md` : dictée telle quelle, diagnostic, objectifs
  mesurables, principes, architecture talent, recruteur et entreprise, étapes. Remplacera les cahiers mobiles
  v1 à v9 pour la forme dès validation ; leurs règles métier restent.
- Planche des fondations (`docs/refonte-mobile/maquette/`) : 51 icônes, barres du bas avec Orbi au centre,
  en-têtes, recherche, options, boutons, cartes, Orbi sans dégradé, états, trois écrans d'aperçu.
- À ne pas implémenter avant validation des étapes 2 à 4 (talent, recruteur, entreprise).

## 2026-10-18 · Refonte mobile, fondations v2

- Retours d'Ephraïm : identité de la barre de sa référence (pilule flottante, verre clair, rond central) appliquée
  aux cartes, bandeaux et options ; nouvelle icône Carrière (sommet et drapeau) ; offres et formations avec
  bannière, trois offres visibles par écran ; piliers en couleur (Lime, Menthe, Ambre) ; dégradés clairs
  seulement ; Postuler avec l'icône sur la ligne du texte ; profil (le mien, vu par un autre) ; modes clair et
  sombre (Nuit).

## 2026-10-18 · Audit de l'espace Talent (cahier « Jumanly Talent MVP 1.0 »)

- Audit sans développement : docs/audit-talent/AUDIT-TALENT.md. 16 fonctionnalités confrontées au code, doublons (tableau-de-bord, espace, explorer, jobs/candidatures, learn/coach, bouton +), navigation recommandée Pour moi · Offres · Orbi · Apprendre · Suivi, 20 pages au lieu de 44, 5 parcours, MVP / P2 / P3.
- En attente des décisions d'Ephraïm (§ 8) avant tout prompt d'implémentation.

## 2026-10-19 · Orbi : conversation libre et historique

- Ephraïm demande comment rendre Orbi opérationnel : le code d'IA était prêt (clé `ANTHROPIC_API_KEY` à ajouter dans
  Vercel), mais la zone « Écrire à Orbi » était inactive. Il choisit de la construire tout de suite.
- `/app/orbi` en page de conversation (retour en haut, crédits sous le nom, sans barre du bas, champ « Écrire à
  Orbi » avec nouvel échange, dictée et envoi) et `/app/orbi/historique` (recherche, effacer un échange ou tout).
- Service `src/server/services/orbi.ts`, fonction IA `orbi_chat`, migration `orbi_conversations`. Choix et
  garde-fous : `docs/decisions/2026-10-19-orbi-conversation.md`.
- Tests : unitaires (sujet, règles, titre), base (crédit pris, consentement, quota, réponses d'évaluation refusées,
  isolation des échanges), e2e Free sur téléphone et ordinateur. Captures 390 px dans le dossier du projet
  `captures/orbi/`.


## 2026-10-19 · Refonte complète en 3 étapes (décision d'Ephraïm)

- Les maquettes finales s'appliquent intégralement à l'application ; l'ancien design (mobile et ordinateur) est effacé, jamais les données.
- Ordre : 1. Talent (mobile + web) ; 2. Recruteur (mobile + web) ; 3. Entreprise et admin recruteur (web seulement). Une étape validée avant la suivante.
- Instruction : `docs/PLAN-REFONTE-EN-3-ETAPES.md` (citée dans `CLAUDE.md`) ; prompt : `docs/PROMPT-LANCEMENT-REFONTE-COMPLETE.md`.

## 2026-10-20 · Ouverture, fluidité et hors connexion (demande d'Ephraïm)

- Constat : l'appli installée s'ouvrait sur un écran noir (couleur de fond du manifeste Sapin foncé, puis rendu
  serveur de `/app` après un démarrage à froid), chaque onglet montrait un squelette de chargement
  (`src/app/app/loading.tsx`) et seuls le profil et les leçons restaient lisibles hors ligne.
- Ouverture : `/demarrage` (page de départ du manifeste, fond crème) ; le logo animé (carré, J tracé, point lime,
  nom, halo) est dessiné avant tout le reste par un petit script en ligne (`src/lib/launch-splash.ts`), dure
  3,5 s (1,2 s si les animations sont réduites) et reste par-dessus pendant que l'espace se charge dessous.
  Rejoué au premier lancement de chaque session de l'appli installée.
- Menus : plus d'écran de chargement dans l'espace connecté (l'onglet s'allume au toucher, la page précédente
  reste jusqu'à l'arrivée de la suivante, barre fine en haut) ; entrée d'une page réduite à un fondu de 0,14 s, sans décalage.
- Hors connexion (`public/sw.js` v2) : chaque page de l'espace ouverte est gardée sur l'appareil (60 au plus) et
  servie sans réseau ; les onglets principaux sont demandés une fois par session ; la page d'ouverture est servie
  à l'instant ; paiement et testeur jamais gardés ; tout est effacé à la déconnexion. Bandeau : « Vous êtes hors
  ligne. Vous voyez la dernière version enregistrée sur cet appareil. »
- Choix : `docs/decisions/2026-10-20-ouverture-fluidite-hors-ligne.md`.

## 2026-10-20 · Étape 2 recruteur · diagnostic

Diagnostic seul, aucun code modifié. Lu : `docs/PLAN-REFONTE-EN-3-ETAPES.md`, `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md`, `docs/refonte-web/BRIEF-WEB-CLAUDE-CODE.md` (W0 et recruteur 1 à 4), `docs/audit-hire/AUDIT-HIRE-MOBILE.md`, titres des planches `refonte-mobile/recruteur-1..4` (v2 `r1plus`, `r2plus`, `r3plus`), `modeles-recruteur/`, `refonte-web/recruteur-1..4`. Code lu sur l'état de `origin/main` (#113).

### 1. Ce qui existe aujourd'hui

**Cadre.** `src/app/app/layout.tsx` donne le `TalentShell` (nouveau design) à l'espace personnel, et l'ancien `AppShell` (`src/components/layout/app-shell.tsx`) au recruteur **et au partenaire**. L'`AppShell` a une colonne d'icônes à gauche, un menu de sous-rubriques en haut, un en-tête vert foncé et une pilule flottante sur téléphone (Accueil · Offres · Talents · Messages · Organisation, d'après `hireNavigation` dans `src/config/navigation.ts`). Les viviers, entretiens, rapports et modèles ne sont pas dans la barre : on y va par des raccourcis du tableau de bord (`hireShortcuts`). Le style vient de `src/styles/admin.css` (`jm-admin-bg`, `jm-topbar`) et des kits de l'ancien design (`components/hire/kit.tsx`, `career/kit.tsx`, `jobs/talent-kit.tsx`). Orbi n'existe pas pour le recruteur : `/app/orbi` et `/app/orbi/historique` le renvoient vers `/app/hire`.

| Route | État |
|---|---|
| `/app/hire` | ancien design (tableau de bord : actions, chiffres, quotas, raccourcis) |
| `/app/hire/bienvenue` | absent (pas de premiers pas recruteur) |
| `/app/hire/compte`, `/app/hire/compte/profil` | absent (`/app/compte` renvoie le recruteur vers `/app/hire`) |
| `/app/hire/offres` | ancien design (tableau sur ordinateur, cartes sur téléphone) |
| `/app/hire/offres/nouvelle`, `/[id]/modifier` | ancien design (`job-form.tsx` + `job-wizard.tsx`, rédaction IA déjà branchée) |
| `/app/hire/offres/[id]` | ancien design : c'est le **pipeline en colonnes** (`pipeline-board.tsx`) + réglages, pas le détail de la planche |
| `/app/hire/offres/[id]/ats`, `/retenus`, `/reponses` | absent |
| `/app/hire/candidats` (liste par étape) | absent (seul `/[applicationId]` existe) |
| `/app/hire/candidats/[applicationId]` | ancien design (dossier complet, notes modifiables, grille, Pourquoi) |
| `/app/hire/candidats/[applicationId]/message` | ancien design |
| `/app/hire/candidats/[applicationId]/entretien` | absent (on planifie depuis `/app/hire/entretiens`) |
| `/app/hire/entretiens` | ancien design (agenda semaine, jour, mois, 1333 lignes) |
| `/app/hire/entretiens/[id]` | absent |
| `/app/hire/talents`, `/talents/[profileId]` | ancien design (cible : `/app/hire/candidats?vue=talents`) |
| `/app/hire/viviers` (+ `/[id]` qui redirige déjà) | ancien design |
| `/app/hire/modeles` | ancien design |
| `/app/hire/rapports` (+ `/export` CSV ou PDF) | ancien design |
| `/app/messages`, `/app/messages/[id]` | ancien design pour le recruteur (`connect/hire-messages.tsx`, `hire-thread.tsx`), nouveau pour le talent |
| `/app/notifications` | ancien design pour le recruteur (`connect/team-notifications.tsx`) |
| `/app/abonnement` | ancien design pour le recruteur (`billing/hire-billing.tsx`) ; `formules`, `factures` renvoient vers `/app/abonnement` ; `payer` partiel |
| `/app/parametres` (+ `notifications`, `securite`) | ancien design pour le recruteur (`account/hire-settings.tsx`, 669 lignes) |
| `/app/recherche` | ancien design pour le recruteur (`connect/hire-search.tsx`) |
| `/app/organisation` | ancien design (une page de 937 lignes à onglets) ; `/verification`, `/equipe` absents |

### 2. Écrans des planches → route cible → état

**Lot mobile 1 · cadre** (planches recruteur-1 § 1 « organisation active », recruteur-3 § 3 et § 7)
- Barre À traiter · Offres · Orbi · Candidats · Messages, en-tête avec organisation active → tout `/app/hire/*` → à créer (l'`AppShell` est à remplacer).
- Compte RH, Mon profil RH → `/app/hire/compte`, `/compte/profil` → à créer.
- Premiers pas : vous recrutez pour…, votre organisation, espace prêt → `/app/hire/bienvenue` → à créer.

**Lot mobile 2 · traiter et publier** (recruteur-1 § 1 à 4, v2 `r1plus`)
- À traiter, rien à traiter → `/app/hire` → à refaire (garder les données de `hireDashboard`).
- Mes offres (couleur par offre, chiffres), actions, clôturer, filtre En pause et Expirées → `/app/hire/offres` → à refaire.
- Création en 4 étapes, Rédiger avec Orbi, limite atteinte, offre publiée, fiche PDF vue talent → `/offres/nouvelle`, `/[id]/modifier` → à refaire ; documents, questions et fiche PDF à créer.
- Détail d'une offre, historique par type → `/app/hire/offres/[id]` → à refaire (le pipeline part vers Candidats).

**Lot mobile 3 · candidatures** (recruteur-2 § 0 bis à 3, v2 `r2plus` « dossier enrichi », « décision finale »)
- Candidatures par offre et par étape, trier et filtrer, vide → `/app/hire/candidats` → à créer.
- Dossier, sections, Pourquoi 88 %, analyse Orbi, version RH Free → `/candidats/[applicationId]` → à refaire ; analyse Orbi à créer.
- Changer d'étape, décision finale (3 issues, message relu, annulation 10 min), décision enregistrée → feuilles du dossier → à refaire ; annulation à créer.

**Lot mobile 4 · entretiens et talents** (recruteur-2 § 4 et 5, v2 calendrier, créneaux, agenda, talents en liste continue)
- Proposer un entretien (mode, calendrier du mois, journée en créneaux), aperçu → `/candidats/[applicationId]/entretien` → à créer (le moteur `Interview` existe).
- Entretiens (agenda), préparer avec Orbi, évaluation → `/app/hire/entretiens`, `/entretiens/[id]` → à refaire et à créer ; questions Orbi à créer.
- Rechercher, filtres, profil d'un talent, proposer l'offre → `/app/hire/candidats?vue=talents`, `/app/hire/talents/[profileId]` → à refaire.
- Viviers → `/app/hire/viviers` → à refaire.

**Lot mobile 5 · communs** (recruteur-3 § 1 à 6, v2 `r3plus`)
- Orbi en page de conversation, historique → `/app/orbi`, `/app/orbi/historique` ouverts au recruteur → à créer (réutiliser `talent/orbi-chat.tsx`).
- Messages, conversation avec brouillon Orbi et actions rapides, modèles, notifications avec résumé du jour → `/app/messages`, `/[id]`, `/app/hire/modeles`, `/app/notifications` → à refaire.
- Organisation, vérification, équipe, inviter → `/app/organisation`, `/verification`, `/equipe` → à refaire et à créer (voir question 1).
- Abonnement avec échéances, formules RH, paiement → `/app/abonnement` (+ `formules`, `payer`, `factures`) → à refaire en réutilisant les écrans talent.
- Rapports avec graphiques, paramètres (journal des consultations, fuseau) → `/app/hire/rapports`, `/app/parametres` → à refaire.

**Lot mobile 6 · ATS et suite** (recruteur-4 § 0 bis à 8, `modeles-recruteur/`)
- Quatre accès « Analyser », candidatures de l'offre, analyse en cours, recommandation, profil pour cette offre → `/app/hire/offres/[id]/ats` → à créer.
- Quand lancer l'analyse, analyse programmée → `/ats` → à créer.
- Sélection rapide, liste des retenus → `/offres/[id]/retenus` → à créer.
- Répondre à tous, confirmer, messages retenu et non retenu → `/offres/[id]/reponses` + 4 modèles d'e-mail → à créer.
- Messagerie enrichie (en ligne, lu, badges, menu ⋯, bouton +, Orbi, alléger) → `/app/messages/[id]` → à créer.
- Propositions : envoyée, acceptée, Mes propositions → `/app/hire/candidats?vue=propositions` → à créer (`ContactRequest` existe).
- Rejoindre une organisation existante, demande envoyée, côté admin → `/app/hire/bienvenue`, `/app/notifications` → à créer.
- Fin d'offre J-3, prolonger, clôturer ou annuler, réglage des rappels → À traiter, `/app/notifications`, `/app/parametres/notifications` → à créer.
- Rapport PDF A4 → `/app/hire/rapports/export` → à refaire sur le modèle `rapport-recrutement.html`.

**Web (1024 et 1440 px)** : le cadre W0 talent existe (`src/components/talent/web/side-nav.tsx`, `top-bar.tsx`, `orbi-panel.tsx`, `command.tsx`, `dialog.tsx`) ; il faut sa version recruteur (organisation sous le nom, entrées + Agenda, Talents, Rapports).
- Web 1 : À traiter en 2 colonnes, menu d'organisation, offres en grille, création avec aperçu à droite, détail → à créer.
- Web 2 : candidats liste + dossier côte à côte (`?id=`), dossier en 2 colonnes, étapes et décision, agenda en semaine (`/entretiens?vue=semaine`), talents avec filtres à gauche, propositions en tableau → à créer.
- Web 3 : Orbi avec historique, messagerie 3 colonnes, notifications, compte, organisation, vérification, équipe en tableau, abonnement, rapports, paramètres, premiers pas → à créer.
- Web 4 : arriver à l'ATS, ATS, quand lancer, répondre à tous, messagerie, propositions, rejoindre, fin d'offre, notifications de l'ordinateur, rapport PDF → à créer.

### 3. Données et règles à ajouter (migrations additives)

| Besoin (point du brief recruteur § 2) | Dans `prisma/schema.prisma` aujourd'hui |
|---|---|
| Statut `paused` (4) | absent : `enum JobStatus` n'a que draft, pending_review, published, closed, archived, rejected, changes_requested ; `pausedByBillingAt` existe. `activeJobCount` (`src/server/services/hire.ts`) compte published et pending_review, donc une pause hors quota est simple. |
| Documents demandés, questions de présélection, réponses (5) | absent : seul `Job.knockoutCriteria` existe ; `Application.attachments` existe côté talent. Ajouter les questions sur `Job` et les réponses sur `Application`. |
| Fiche de poste PDF (5) | absent sur `Job` ; `StoredFile` et le stockage existent. Aucun contrôle de fichier (antivirus) trouvé dans `src/`. |
| Étapes par défaut Reçue, En examen, Présélectionnée, Entretien, Décision finale (6) | modèle `PipelineStage` gardé ; liste actuelle `defaultStages` dans `src/server/services/applications.ts` (6 étapes, noms écrits en dur) à changer pour les nouvelles offres seulement. Retrait du candidat : `ApplicationStatus.withdrawn` existe. Annulation 10 min : absente. |
| Couleur et historique typé d'une offre (7) | pas de journal des événements d'une offre ; couleur calculable sans base. |
| Notes privées modifiables (8) | **fait** : `editNote`, `deleteNote` dans `src/server/services/evaluation.ts`, réservés à l'auteur. |
| Analyse Orbi `hire.cv_analysis` (9, 16) | droit dans `prisma/seed/plans.ts` (Free non, Pro et plus oui) ; **aucun service** ne l'utilise. Résultat d'analyse à stocker (rien d'adapté : `AiSuggestion` est lié au talent). Analyse programmée, tâche `ats.scheduled` : absentes. |
| Grilles `hire.scorecards`, sièges `org.seats`, offres `jobs.active.max`, crédits `ai.credits.monthly` (9, 10) | présents dans `prisma/seed/plans.ts` avec les valeurs de la partie 05 (Pro : 2, 5, 100 ; Premium : 3, 15, 300). `Scorecard` existe. |
| Entretiens 1 à 3 créneaux, mode, fuseau, participants (13) | **fait** : `Interview` (slots, proposedSlots, timezone, participantIds, statuts). Questions de préparation Orbi : absentes. |
| Liste des retenus (17) | absente (pas de modèle de sélection par offre ; `TalentPool` ne convient pas tel quel). |
| Réponses groupées, « J'ai relu », annulation 10 min (18) | absent ; `MessageTemplate` existe (5 types : convocation, document, relance, acceptation, refus). |
| Messagerie : lu, en ligne, « écrit… », rangement (19) | partiel : `ConversationParticipant.lastReadAt` existe. Présence, réglage « accusés de lecture », masquage côté recruteur : absents. Aucun temps réel (ni WebSocket ni EventSource dans `src/`). |
| Propositions aux talents (20) | **fait** : `ContactRequest` (pending, accepted, declined, expired, jobId, quota `hire.contact_requests.monthly`). Relancer : absent. |
| Rejoindre une organisation existante (21) | absent : seule `Invitation` (de l'organisation vers une personne) existe ; aucune recherche par domaine dans `src/server/services/organization.ts` ni `accounts.ts`. Modèle de demande + expiration 7 jours à créer. |
| Rappels de fin d'offre (16 bis) | absent : pas de tâche `jobs.ending_reminders` (seul `pnpm jobs:billing` existe), pas de fuseau sur `Organization`, pas de notifications sur le téléphone (aucun abonnement push en base). |
| Seed démo Baobab Fintech, Nadia K. (§ 0) | partiel : `prisma/seed/ux.ts` a déjà « Baobab Fintech (entreprise fictive) » et une recruteuse Nadia ; à refaire d'après les planches. |

### 4. Ancien design à supprimer

À supprimer (servent seulement au recruteur) :
- `src/components/hire/pipeline-board.tsx` (seulement `/app/hire/offres/[id]`), `job-wizard.tsx`, `job-form.tsx`, `job-form-shell.tsx`, `job-steps.ts`, `job-settings.tsx`, `job-status.tsx`, `moderation-changes.tsx` (refaits dans le nouveau style).
- `src/components/connect/hire-messages.tsx`, `hire-thread.tsx`, `contact-requests.tsx`, `interview-card.tsx`, `report-form.tsx`, `team-notifications.tsx`, `hire-search.tsx`.
- `src/components/billing/hire-billing.tsx`, `src/components/account/hire-settings.tsx`.
- `src/components/layout/space-switcher.tsx`, `account-menu.tsx`, `phone-bar-flag.tsx` (utilisés seulement par `AppShell` et l'ancien écran message).
- `hireNavigation` et `hireShortcuts` dans `src/config/navigation.ts`, la section Hire de `appSections` dans `app-shell.tsx`.
- Pages : le contenu de chaque `page.tsx` sous `src/app/app/hire/` est réécrit.

Redirections : `/app/hire/talents` → `/app/hire/candidats?vue=talents` ; `/app/hire/viviers/[id]` → `/app/hire/viviers` (déjà) ; `/app/hire/candidats/[applicationId]/message` → la conversation `/app/messages/[id]` ; liens `href: "/app/hire/entretiens"` de `src/server/services/interviews.ts` à revoir.

À **garder** (servent aussi à d'autres espaces) :
- `AppShell` : il sert aussi à l'**espace partenaire** (`/app/partenaire`). On le retire du recruteur seulement (voir question 3).
- `layout/icon-rail.tsx`, `nav-link.tsx`, `section-nav.tsx`, `top-search.tsx` et `src/styles/admin.css` : utilisés par l'administration Jumanly (`src/app/admin/layout.tsx`).
- `components/hire/kit.tsx` : `Initials`, `OrgMark`, `initialsOf` servent à l'admin (`components/admin/kit.tsx`, `app/admin/offres`) et au partenaire ; à garder ou à déplacer.
- `components/app/page-header.tsx`, `header-action.tsx` : partenaire, admin, invitation.
- `components/jobs/talent-kit.tsx` (page offre talent), `components/career/kit.tsx` (partenaire), `conversationLabels` de `connect/conversation-list.tsx` (recherche talent).
- `components/hire/brand-identity.tsx`, `brand-image-editor.tsx`, `org/structure-tabs.tsx` : page organisation, refaite à l'étape 3 ; garder jusque-là ce que le recruteur RH n'utilise pas.

### 5. Plan des PR

1. **Lot R1 · cadre recruteur** : barre et en-tête mobile, organisation active, Compte RH, premiers pas ; `layout.tsx` donne au recruteur le nouveau cadre ; ouverture d'Orbi au recruteur.
2. **Lot R2 · traiter et publier** : À traiter, Mes offres, migration `paused`, création en 4 étapes avec documents, questions et fiche PDF (migration), Orbi, quota, validation, détail.
3. **Lot R3 · candidatures** : liste par étape, dossier, notes, Pourquoi, changer d'étape, décision finale relue avec annulation, service d'analyse `hire.cv_analysis` protégé contre les consignes cachées.
4. **Lot R4 · entretiens et talents** : proposer (calendrier et créneaux), agenda, préparer, évaluer ; talents en liste continue, profil, proposer l'offre, viviers.
5. **Lot R5 · communs** : messages et modèles, notifications, organisation, vérification, équipe, abonnement, rapports, paramètres ; redirections et suppression des fichiers du § 4.
6. **Lot R6 · ATS et suite** : ATS (maintenant ou à la fin, tâche `ats.scheduled`), retenus, réponses groupées et e-mails, messagerie enrichie, propositions, rejoindre une organisation, rappels de fin d'offre, rapport PDF.
7. **Web R1 à R4** (une PR chacun) : cadre web recruteur (barre latérale, rail tablette, panneau Orbi), puis les écrans des planches web 1 à 4 avec les mêmes composants ; suppression de la colonne centrée provisoire.

Étape 1 validée par Ephraïm le 20/10 à 03:59. Risques : le lot R6 demande du temps réel et des tâches de fond nouvelles ; `pipeline-board.tsx` disparaît avant que le web 2 existe (colonne centrée en attendant).

Questions pour Ephraïm :
1. Organisation, vérification et équipe du recruteur RH : le brief mobile les met sous `/app/organisation/*`, mais l'étape 3 rend `/app/organisation/*` « à ouvrir sur un ordinateur » sous 768 px. Je propose `/app/hire/compte/organisation` et `/app/hire/compte/equipe` pour le recruteur, et laisser `/app/organisation` à l'administration. D'accord ?
2. Export du rapport : le brief dit « toujours en PDF », mais le droit `reports.export` est désactivé pour RH Free, Pro et Premium (`prisma/seed/plans.ts`). Les formules RH peuvent-elles exporter, et retire-t-on le CSV ?
3. Espace partenaire : il utilise aussi l'ancien cadre. Le garde-t-on tel quel jusqu'à une maquette partenaire ?
4. « En ligne », « écrit… » et notifications sur le téléphone demandent un service de temps réel et des notifications push (clés à créer, rien n'existe). Acceptez-vous une première version avec mise à jour toutes les quelques secondes et la notification sur le téléphone plus tard ?
5. Fiche de poste PDF « analysée avant publication » : suffit-il de vérifier le type, la taille et l'absence de contenu actif, ou faut-il un antivirus externe (service payant) ?

## 2026-10-20 · Réponse au toucher et transitions (demande d'Ephraïm)

- Constat mesuré (téléphone ralenti 6×, réseau lent) : en touchant une offre, rien ne bougeait pendant près de 2 s,
  ni barre ni marque, et un deuxième toucher relançait la page. La barre fine de `NavigationFeedback` ne partait
  jamais pour les liens de Next.js (ils annulent eux-mêmes le clic, que la barre prenait pour « rien à charger »).
  Les boutons d'envoi des écrans talent n'avaient pas d'état « en cours » et pouvaient envoyer deux fois.
  Le hors connexion, lui, fonctionne sur la version en ligne (onglets et réouverture à froid servis sans réseau).
- `src/components/motion/navigation-feedback.tsx` réécrit : le lien touché est marqué en moins de 0,1 s, la barre
  part à 0,12 s et s'arrête quand la nouvelle page est là ; toucher à nouveau le même lien pendant ce temps ne fait
  rien ; un formulaire envoyé marque son bouton (atténué, plus de deuxième envoi) jusqu'à la réponse. Les débuts
  et fins sont lus sur `fetch` (en-têtes `RSC` et `Next-Action`).
- Transitions façon messagerie (espaces talent et recruteur) : la page suivante glisse de la droite (0,24 s), de
  la gauche au retour ; entre onglets, un fondu. Rien ne bouge avec « Réduire les animations ».
- Vérifié : 3 touchers rapides sur une offre = 1 seule page demandée ; 3 touchers sur « Enregistrer l'offre » =
  1 seul envoi, bouton marqué à 0,08 s puis libéré à la réponse.

## 2026-10-20 · Étape 2, recruteur lot 1 : cadre mobile

- L'espace recruteur passe au nouveau cadre (`src/components/recruiter/`) : barre du bas À traiter · Offres · Orbi · Candidats · Messages, en-tête avec la pastille de l'organisation active (feuille « Organisation active », retour à l'espace talent), recherche, cloche, avatar. Le partenaire garde l'ancien cadre.
- Nouveaux écrans : Compte RH (`/app/hire/compte`), Mon profil RH (`/app/hire/compte/profil`, nom affiché et fonction), premiers pas du recruteur en 3 écrans sur `/app/bienvenue` avec les vraies limites de la formule.
- Écarts et suites (Orbi recruteur, cadre web, pages Hire à refaire) : `docs/decisions/2026-10-20-recruteur-lot-1.md`. Captures : `/mnt/project-files/captures/refonte-recruteur-lot-1/`.

## 2026-10-20 · Installer l'appli sans Play Store

- Demande d'Ephraïm : pouvoir installer Jumanly sur un téléphone sans passer par le Play Store. Le site était
  déjà une PWA (manifeste, `public/sw.js`, ouverture sur `/demarrage`), mais rien ne proposait l'installation.
- Bouton « Installer l'appli » (`src/components/site/install-app.tsx`, composant client minuscule : le libellé
  et les étapes sont rendus par le serveur). Android, Chrome et Edge : le bouton ouvre l'installation du
  navigateur (`beforeinstallprompt`). iPhone et iPad : il ouvre un `<dialog>` avec les trois gestes de Safari
  (Partager → « Sur l'écran d'accueil » → Ajouter). Masqué quand l'appli est déjà installée
  (`display-mode: standalone`, `navigator.standalone`, `appinstalled`) ou quand le navigateur ne sait pas
  l'installer.
- L'offre du navigateur peut arriver avant React : un petit script en tête de chaque page la garde sur
  `window` (`src/lib/install-prompt.ts`, appelé dans `src/app/layout.tsx`).
- Placé dans le héros de l'accueil public (pilule claire sur fond sombre, sous les réassurances) et dans
  Compte, groupe « Abonnement et réglages », comme une ligne de plus (styles `t-`, feuille `t-sheet`).
- Textes : partie 08, section « Installer l'appli » (`system.install.*`).
- Tests : `tests/e2e/installer-appli.spec.ts` (iPhone simulé : dialogue de l'accueil et de Compte, Échap et
  retour du focus, axe ; appli installée : pas de bouton ; Chrome : offre captée avant React, `prompt()`
  appelé, bouton retiré ; navigateur sans installation : pas de bouton).
- Captures 390 px, clair et sombre : `captures/installer-appli/` du dossier du projet.
- À savoir : le test « Connexions : accepter une demande puis écrire » (`mobile-compte.spec.ts`) consomme la
  demande de démonstration ; un deuxième passage sur la même base échoue tant que `pnpm db:seed` n'est pas relancé.
- Le site public n'a pas de mode sombre : ses captures « sombre » sont identiques aux claires.

## 2026-10-20 · Étape 2, recruteur lot 2

**Fait.** À traiter (`/app/hire`) et son état vide, Mes offres (`/app/hire/offres`, bandes de
couleur, quatre chiffres par carte, menu ⋯ avec pause, reprise et clôture), la publication d'une
offre en 4 étapes avec Orbi (Appliquer, Modifier, Refuser ; ni salaire ni avantages inventés),
documents demandés et questions de présélection qui ne bloquent jamais une candidature, fiche de
poste PDF facultative contrôlée (type, taille, contenu actif), écran de limite `jobs.active.max`,
« En validation » pour une organisation pas encore vérifiée, écran publié et détail d'une offre
avec un historique typé (Message, Candidature, Modification, Publication). Une offre en pause ne
compte plus dans `jobs.active.max`. Étapes par défaut : Reçue, En examen, Présélectionnée,
Entretien, Décision finale.

**Données.** Migration additive `20261020120000_recruteur_lot_2_offres_pause_questions_fiche`.
Aucune donnée effacée.

**Ancien design.** Assistant d'offre et formulaire supprimés ; l'ancien tableau d'une offre
attend le lot 3 sur `/app/hire/candidats?offre=`.

**Tests.** Unitaires (`tests/unit/hire-offers.test.ts`) et en base (`tests/db/hire-offers.test.ts`) :
pause hors quota, isolation des organisations, questions jamais bloquantes, fiche PDF. Parcours
e2e `tests/e2e/mobile-recruteur-offres.spec.ts`, avec la vérification qu'aucun écran ne déborde à
390 et 412 px même avec des textes longs. Les parcours e2e Hire et modération suivent le nouveau
formulaire (`tests/e2e/offer-flow.ts`).

**Écarts.** `docs/decisions/2026-10-20-recruteur-lot-2.md` (fiche à 4 Mo, pas d'antivirus,
message aux non retenus au lot 4, lecture texte de la fiche, tableau provisoire, domaine, étapes
de la démo).

**Captures.** `captures/refonte-recruteur-lot-2/` du dossier du projet, 390 px, clair et sombre.

## 2026-10-20 · Étape 2, recruteur lot 4

**Fait.** Entretiens : proposer un entretien depuis le dossier
(`/app/hire/candidats/[id]/entretien`) avec format, durée, participants, calendrier du mois,
journée en demi-heures et suggestion d'Orbi, puis aperçu de l'invitation et message relu avant
l'envoi ; agenda (`/app/hire/entretiens`) en semaine, mois et « À évaluer », filtre Les miens /
L'équipe, « + » vers les candidatures en cours ; préparation (`/app/hire/entretiens/[id]`) avec
les points et questions d'Orbi tirés des compétences de l'offre, questions de l'équipe (refusées
si elles touchent à la vie privée), partage du lien et suivi (reprogrammer, terminé, absent,
annuler) ; évaluation (`/app/hire/candidats/[id]/evaluation`) de 1 à 4 par critère, avis, suite
proposée (avec « Hésitation »), brouillon sur l'appareil, avis de l'équipe après le sien.
Talents : recherche dans « Candidats › Talents » (`?vue=talents`) avec les seuls filtres permis,
comparaison avec une offre, « Mes propositions » (`?vue=propositions`), profil d'un talent
(`/app/hire/talents/[id]`, consultation journalisée), « Proposer l'offre »
(`/app/hire/talents/[id]/proposer`) et viviers (`/app/hire/viviers`, `/app/hire/viviers/[id]`).
Restes du lot 3 : appel d'arrivée dans le message d'acceptation (droit `connect.appointments`,
annulé avec la décision) et « Ajouter à un vivier » depuis le dossier. Le lot 5 (messages,
notifications, organisation, équipe, abonnement, rapports) n'est pas construit ; ses liens
restent valides.

**Données.** Migration `20261020200000_recruteur_lot_4_entretiens_questions_hesitation` :
colonne `Interview.questions` (questions de l'équipe pour préparer un entretien, `[]` par défaut) et recommandation `maybe`
(« Hésitation »). Aucune donnée effacée. Le seed ajoute trois talents fictifs visibles sans
candidature (`ruth.ux`, `kevin.ux`, `sarah.ux`), quatre entretiens, un vivier « Data junior
(démo) » et deux propositions pour Baobab Fintech (fictive).

**Ancien design supprimé.** Fichier `src/components/hire/scorecard-panel.tsx`. Écrans réécrits
(ancien contenu effacé) : `src/app/app/hire/entretiens/page.tsx`,
`src/app/app/hire/talents/page.tsx` (redirection vers `?vue=talents`),
`src/app/app/hire/talents/[profileId]/page.tsx`, `src/app/app/hire/viviers/page.tsx`,
`src/app/app/hire/viviers/[id]/page.tsx`. Fonctions : `QuotaLine`, `statusKey`
(`src/components/hire/kit.tsx`), `contactRequestAction` (`src/server/actions/hire-advanced.ts`).
Les liens des notifications d'entretien mènent à la préparation.

**Corrections trouvées par les tests.** Une feuille se ferme désormais quand on touche un de ses
liens : l'écran gardé derrière le suivant laissait la feuille modale et rendait le nouvel écran
inerte. Les demi-heures de la journée font 26 px de haut (cible tactile de 24 px au moins). Le
message d'acceptation se met à jour quand on ajoute l'appel d'arrivée. La suggestion d'Orbi écrit « 2e choix » (et non « #e »). Dans l'administration, les liens des membres de la fiche d'une organisation atteignent 24 px de haut (contrôle d'accessibilité de `admin-pass.spec.ts`, révélé quand la première organisation de la liste a deux membres).

**Tests.** Unitaires `tests/unit/interview-calendar.test.ts` (fuseaux, grille du mois,
occupation, matinées libres, suggestion, questions proposées, niveaux d'expérience, barre
d'onglets) ; en base `tests/db/hire-interviews.test.ts` (isolation et droits du planificateur,
créneau proposé par le talent, questions protégées, évaluations, recherche par compétences et
niveau, propositions et viviers par organisation, appel annulé avec la décision). Parcours e2e
`tests/e2e/mobile-recruteur-entretiens.spec.ts` (entretien de bout en bout, talents et viviers,
appel d'arrivée, aucun débordement à 390 et 412 px) ; `hire-advanced.spec.ts` et
`accessibility.spec.ts` suivent les nouveaux écrans.

**Écarts.** `docs/decisions/2026-10-20-recruteur-lot-4.md` (occupation lue dans Jumanly seulement,
notes de 1 à 4, évaluation par candidature, brouillon local, pas de rappel la veille, recherche
comparée par défaut à l'offre la plus récente, « Relancer » non construit, seconde consultation
journalisée par « Proposer l'offre », anciennes clés de texte gardées).

**Captures.** `captures/refonte-recruteur-lot-4/` du dossier du projet, 390 px, clair et sombre.

## 2026-10-20 · Étape 2, recruteur lot 3

**Fait.** Candidats d'une offre par étape (`/app/hire/candidats`), avec choix de l'offre, tri et
filtres qui masquent sans rejeter ; dossier d'un candidat (`/app/hire/candidats/[id]`) avec score
en anneau et « Pourquoi X % ? », frise des étapes, documents, compétences et preuves, réponses,
notes modifiables, historique et « Changer d'étape » ; analyse d'Orbi `hire.cv_analysis`
(points forts, points à vérifier, ajout aux notes), protégée contre les consignes cachées dans un
CV, une lettre ou un document ; décision finale (`/app/hire/candidats/[id]/decision`) avec un
message que le recruteur relit et modifie avant l'envoi, tons, motif facultatif, vivier, « Plus
tard », puis écran « Décision enregistrée » avec annulation pendant 10 minutes. Version RH Free :
cadenas sur le score et sur l'analyse, avec la formule la moins chère qui les ouvre. L'onglet
Candidats du cadre mène à la nouvelle liste ; entretiens, recherche de talents et viviers (lot 4)
restent joignables.

**Données.** Aucune migration. Le seed ajoute quatre candidatures fictives (`*.ux@jumanly.test`)
sur l'offre d'analyste junior de la démo. Aucune donnée effacée.

**Ancien design supprimé.** Fichiers : `src/components/hire/pipeline-board.tsx`,
`src/components/matching/recruiter-why.tsx`. Fonctions : `getPipeline`, `candidateSelect`
(`src/server/services/hire.ts`), `moveApplicationAction`, `moveCardAction`, `back`,
`decisionHref` (`src/server/actions/hire.ts`), `sendDecisionAction`, `decisionSchema`
(`src/server/actions/hire-messages.ts`), et la branche « décision » de la page Message. Attribution
et grille d'une offre passent sur le détail de l'offre.

**Correction trouvée par les tests.** Un filtre Prisma sur un chemin JSON absent ne correspond
jamais, même sous `NOT` : l'annulation d'une décision ne trouvait pas sa ligne. La charge utile
écrit désormais `undone: false`.

**Tests.** Unitaires `tests/unit/cv-analysis.test.ts` (balises neutralisées, texte piégé gardé
entre les balises, points qui décident ou obéissent écartés, analyse sans modèle) ; en base
`tests/db/hire-candidates.test.ts` (isolation des organisations, filtres qui masquent sans
rejeter, droit et consentement avant toute analyse, fournisseur « obéissant » à une injection dont la sortie
est écartée, décision, annulation, e-mail différé). Parcours e2e
`tests/e2e/mobile-recruteur-candidats.spec.ts` (parcours complet, version RH Free, aucun
débordement à 390 et 412 px) ; `hire.spec.ts` et `hire-advanced.spec.ts` suivent les nouveaux
écrans.

**Écarts.** `docs/decisions/2026-10-20-recruteur-lot-3.md` (annulation à 10 minutes et e-mail
différé, retrait, « Plus tard », pas d'issue par défaut, RH Free sans score, « Analyser tout »
remplacé par « Examiner », créneau d'appel et vivier depuis le dossier au lot 4, évaluation et
page Message dans l'ancien style).

**Captures.** `captures/refonte-recruteur-lot-3/` du dossier du projet, 390 px, clair et sombre.

## 2026-10-20 · Étape 2, recruteur lot 5

**Fait.** Échanger et gérer (brief recruteur § 4, point 5 ; planches recruteur-3 et `r3plus.py`).
Orbi recruteur sur la page de conversation commune, historique rangé par organisation, crédits de
l'organisation, jamais de nom de candidat envoyé au modèle. Messages (`/app/messages`) avec
recherche, filtres et badges d'étape ; conversation avec carte de contexte, chips d'Orbi
« Proposer une réponse », « Résumer », « Plus formel » (brouillon relu puis « Utiliser » : rien ne
part sans le recruteur), « + » (créneaux, document, modèles) et menu ⋯. Modèles
(`/app/hire/modeles`). Notifications avec « Votre journée en bref ». Profil RH avec « Ce que voient
les candidats ». Organisation (`/app/organisation` et `/modifier`, `/verification`, `/equipe`,
`/structure`) avec chiffres réels, tableau des droits et invitation en feuille. Abonnement avec
jours restants, quotas et échéances, formules RH avec tableau comparatif par clés de droits,
paiement et factures au nom de l'organisation (seul le propriétaire paie). Rapports avec
entonnoir, candidatures par semaine, sources et export PDF seulement. Paramètres recruteur avec
journal des consultations (`/app/parametres/consultations`).

**Données.** Migration additive `20261020210000_recruteur_lot_5_orbi_organisation`
(`OrbiConversation.organizationId` et son index). Aucune donnée effacée.

**Ancien design supprimé.** `src/components/connect/hire-messages.tsx`, `hire-thread.tsx`,
`contact-requests.tsx`, `interview-card.tsx`, `report-form.tsx` ; `conversation-list.tsx` devient
`conversation-labels.ts` ; `VerificationTab` ; `sendTemplateMessageAction` ; l'écran « Message » du
dossier mène à la conversation (`?modeles=1`). Les anciennes adresses (`/app/organisation?onglet=`,
`/app/parametres?onglet=`, `/app/hire/bienvenue`) redirigent.

**Corrections trouvées en route.** Formule « selon contrat » affichée « 0 $ » et « 0 siège » ; la
formule de repli affichée était Company Premium au lieu de RH Free (prix nul confondu avec
« sur devis ») ; textes clairs illisibles sur les tuiles teintées en mode sombre.

**Tests.** Unitaires 343, en base 246, e2e 375 réussis et 33 ignorés (inchangés), rejoués sur une base neuve. En base `tests/db/recruiter-lot5.test.ts` (brouillons : décisions, contacts, sommes et
consignes écartés, marqueurs que le candidat ne peut pas fermer, prénom jamais envoyé, crédit de
l'organisation, rien d'envoyé, isolation des organisations, lecteur sans brouillon ; messagerie
isolée ; Orbi rangé par organisation ; candidatures par semaine). E2e
`tests/e2e/mobile-recruteur-gerer.spec.ts` (conversation, brouillon, modèles, liste ; organisation,
équipe, invitation et équipe pleine ; abonnement, formules, rapports PDF, paramètres, journal,
anciennes adresses ; aucun débordement à 390 et 412 px). E2e existants mis à jour pour les
nouvelles adresses.

**Écarts.** Voir `docs/decisions/2026-10-20-recruteur-lot-5.md` (présence, accusés de lecture,
traduction, résumé du matin, langues d'échange, fuseau et signature non construits ; export CSV
retiré).

**Captures.** `captures/refonte-recruteur-lot-5/` du dossier du projet, 390 px, clair et sombre.

## 2026-10-20 · Étape 2, recruteur lot 6

**Fait.** Dernier lot mobile du recruteur (brief recruteur § 4, point 6, décisions § 2.16 à 2.21 ;
planches recruteur-4 et modeles-recruteur). ATS avec Orbi (`/app/hire/offres/[id]/ats`) : analyse
maintenant ou à la clôture, nouvelles candidatures ajoutées au classement, suivi avec « Arrêter »,
recommandation d'Orbi avec son « Pourquoi ? » (règle fixe, personne n'est rejeté), onglets
Recommandés / À vérifier / Tous, sélection ; profil pour l'offre (`/ats/[applicationId]`) ;
liste des retenus (`/retenus`) ; réponses groupées (`/reponses`) relues personne par personne,
confirmées, puis annulables 10 minutes ; quatre modèles d'e-mails. Messagerie : en ligne, lu,
épingler, couper les notifications, retirer, signaler, nettoyage proposé par Orbi, réglages
`/app/parametres/messagerie`. Rappels et carte de fin d'offre (prolonger, clôturer ou annuler).
« Relancer » une proposition. Rejoindre une organisation existante (demande, réponse de
l'administrateur avec rôle et sièges, expiration). Rapport PDF A4 aux couleurs de Jumanly.
Entrées vers l'ATS depuis À traiter, Candidatures, Mes offres et la fin d'offre.

**Données.** Migration additive `20261020220000_recruteur_lot_6_ats_retenus_messagerie_rejoindre`
(analyse de l'offre et programmation, retenus, conversation épinglée ou retirée, notifications
coupées, présence et accusés de lecture, relance, rappels de fin d'offre, `OrgJoinRequest`).
Aucune donnée effacée. Le seed ajoute pour Baobab Fintech (fictive) les dossiers lus par Orbi,
deux retenus, une offre « Chargé de clientèle (démo) » qui se termine dans 3 jours et une
demande pour rejoindre de « Josué Démo ».

**Ancien design supprimé.** Aucun fichier : le lot ajoute des écrans neufs et complète ceux du
lot 5 ; l'ancien rendu PDF du rapport recruteur n'est plus utilisé par Hire (il sert encore aux
rapports partenaire et carrière).

**Corrections trouvées en route.** Le client Prisma généré gardait l'ancien défaut des rappels
(J-3, J-1 et jour J) : régénéré. La zone de texte de la réponse groupée débordait (hauteur fixe
de `.t-saisie`). « Recommandés » affichait « aucun dossier » sous le podium. Le bouton
« Analyser (ATS) » écrasait les dates de la carte d'offre.

**Tests.** Unitaires 352 (50 fichiers) ; en base 258 (35 fichiers) sur une base neuve ; e2e complets lancés par la CI.

**Écarts.** Voir `docs/decisions/2026-10-20-recruteur-lot-6.md`.

**Captures.** `captures/refonte-recruteur-lot-6/` du dossier du projet, 390 px, clair et sombre,
et les deux pages du rapport PDF.

## Bannière du profil et préchargement des pages (22 octobre 2026)

- Demande d'Ephraïm : changer la bannière du profil, et des pages déjà chargées quand on les ouvre.
- Bannière : « Changer la bannière » dans « Modifier le profil » (photo, galerie, ou bannière Jumanly), image recadrée en 5 × 2 dans le téléphone, visible sur Carrière et sur la page de la personne. Migration additive `profile_banner`.
- Préchargement : `PhonePreload` charge en arrière-plan les pages des liens de l'écran (et des onglets montés), avec leurs données (`partialPrefetching: false`, copie gardée 30 s), sauf fichiers, conversations, notifications, messages, candidatures et espaces d'équipe ; rien avec l'économiseur de données ou en 2G.
- Note : `docs/decisions/2026-10-22-banniere-et-prechargement.md`. Tests : unitaire `phone-preload`, e2e `mobile-profil-cv` (bannière) et `modele-b-prechargement`.


## Compte recruteur, suppression immédiate, Fil professionnel (22 octobre 2026)

Quatre corrections d'Ephraïm, détail dans `docs/decisions/2026-10-22-compte-recruteur-suppression-fil.md`.

- Un talent passe en compte recruteur depuis Paramètres (téléphone) ou Compte (ordinateur).
- « Supprimer mon compte » efface tout immédiatement ; la même adresse repart de zéro. Paiements et
  factures gardés sans lien (comptabilité), confirmé par Ephraïm le 22/10/2026.
- Publications du Fil : 220 caractères au plus, compteur visible ; réponses inchangées.
- « Pour vous » classé par `feed-rank.ts` (offres, nouveaux postes, événements, auteurs actifs,
  commentateurs, bien connectés), plafonné et varié.
- Tests : `tests/unit/feed-rank.test.ts`, `tests/db/account-deletion.test.ts`, `tests/db/feed.test.ts`,
  `tests/e2e/corrections-compte.spec.ts`.

## Tailles réduites au téléphone : Fil et Carrière (22 octobre 2026)

Demande d'Ephraïm (deux captures) : la photo en haut du Fil passe à 28 px, la taille de la cloche.
Carrière : photo 64 px (au lieu de 96), boutons Partager et Modifier 34 px, puces Cap et disponibilité
28 px, onglets Profil · CV · Portfolio · Progression · Candidatures 44 px en 14 px. Le bloc d'identité
passe au-dessus de la bannière, que la photo plus petite ne dégage plus. Plus aucun cadre vert dans un
champ de texte quand on écrit (publication, recherche d'Explorer).

## Modèle B recruteur et administrateur déposé (22 octobre 2026)

- Ephraïm a validé l'espace recruteur sur mobile et sur ordinateur, ainsi que l'espace administrateur sur ordinateur.
- Ils sont déposés dans `docs/modele-b-recruteur/` : brief, prompt, captures avec index, sources `.dc.html`, rapports PDF et générateurs.
- Ce dépôt remplace les planches recruteur et admin de `docs/refonte-mobile/` et de `docs/refonte-web/`. `CLAUDE.md` et `docs/PLAN-REFONTE-EN-3-ETAPES.md` sont mis à jour.

## Modèle B recruteur mobile · M0, diagnostic (22 octobre 2026)

Demande d'Ephraïm du 22/10/2026 : refaire l'appli recruteur au téléphone (390 px) sur le Modèle B
(`docs/modele-b-recruteur/`, sections 01 à 11 de `mobile/captures/INDEX.md`). Tablette, ordinateur et
administration d'entreprise ne bougent pas. Lots M0 à M8, une branche et une PR par lot, puis arrêt
en attendant la validation.

**Aujourd'hui au téléphone.** Un recruteur (espace Hire actif) reçoit au téléphone la coque
`RecruiterShell` de l'ancienne refonte (`docs/refonte-mobile`, lots R1 à R6, PR #116 à #123) : en-tête
avec la pastille de l'organisation (`header.tsx`, `org-sheet.tsx`), barre flottante À traiter · Offres ·
Orbi · Candidats · Messages (`bottom-bar.tsx`), thème clair ou sombre. Une seule base de code pour les
trois largeurs : les écrans sont responsives, les règles téléphone vivent dans des `@media (max-width:
767px)` de `recruiter*.css`. Écrans existants :

| Section Modèle B | Écran existant au téléphone | À faire |
|---|---|---|
| 01 Ouverture, inscription | `/decouvrir` et `/inscription` (talent, B2), `/app/hire/bienvenue` et `/app/bienvenue` (premiers pas R, 3 étapes), `org-join.tsx` (demande pour rejoindre) | Refaire : rôle, entreprise, demande de rattachement et logo, pays et contacts, profil recruteur en 7 étapes, notifications, profil prêt |
| 02 Fil | aucun pour le recruteur (le Fil talent B3 n'est pas dans la coque RH) | Nouveau : Fil du recruteur, publier en son nom ou au nom de l'entreprise |
| 03 Offres | `/app/hire/offres`, `/app/hire/offres/[id]`, `/nouvelle` (4 étapes), `/modifier`, `/fiche`, fin d'offre (`ending.tsx`) | Refaire : indicateurs, détail et statistiques, menu, partage, clôture, rapport PDF, publication en 5 étapes |
| 04-05 Candidatures | `/app/hire` (À traiter), `/app/hire/candidats`, `/candidats/[id]` (+ `entretien`, `evaluation`, `decision`, `message`), `/offres/[id]/ats`, `/retenus`, `/reponses`, `/app/hire/entretiens` | Refaire : ATS en onglets (fort potentiel, toutes par étape, entretiens, décisions, non retenus), diagnostic de tous les CV, fiche candidat (résumé, pourquoi, CV, réponses, notes, historique, menu), planifier, évaluer, proposer, réponse groupée |
| 06 Talents | `/app/hire/talents`, `/talents/[id]`, `/proposer`, `/app/hire/viviers` | Refaire : recherche en deux temps, vivier, propositions, onglet Réseau, profil talent vu par le recruteur |
| 07 Messages | `/app/messages` et `/app/messages/[id]` (version RH, `thread.tsx`, `thread-composer.tsx`, `inbox.tsx`) | Refaire : catégories Candidats · Réseau · Équipe, nouveau message, modèles, joindre |
| 08 Compte | `/app/hire/compte`, `/compte/profil`, `/app/hire/modeles`, `/app/hire/rapports`, `/app/parametres`, `/app/abonnement` | Refaire : compte par l'avatar, profil avec logo, statistiques, enregistrées, équipe, formule en lecture seule, réglages, aide par e-mail |
| 09 Pages entreprise | `/app/entreprises/[slug]`, `/app/personnes/[id]` (talent B4) | Adapter au recruteur : onglets Offres et Membres, « Se connecter à tous », bandeau réseau |
| 10 Notifications, Orbi | `/app/notifications` (version RH), Orbi en panneau (`OrbiPanel`) | Refaire : notifications par catégorie, Orbi flottant menthe |
| 11 Changer de profil | feuille « Organisation active » (`org-sheet.tsx`), « Passer à mon espace talent » | Refaire : recruteur, profil talent discret, profil entreprise (administrateur) |

**Choix des adresses au téléphone** (le web garde les siennes) : Fil `/app/hire`, Offres
`/app/hire/offres`, Candidatures `/app/hire/candidats`, Talents `/app/hire/talents`, Messages
`/app/messages`. Les cinq onglets restent montés sous les pages, comme pour le talent.

**Ancien design recruteur mobile à supprimer (M8).** Ce qui ne sert qu'au téléphone dans la coque
`RecruiterShell` : `src/components/recruiter/bottom-bar.tsx`, `header.tsx` (en-tête téléphone),
la variante téléphone de `org-sheet.tsx`, `recruiterTabs` et `hidesRecruiterTabBar` de
`src/config/navigation.ts` s'ils ne servent plus, les règles `@media (max-width: 767px)` de
`src/styles/recruiter*.css`, les textes devenus orphelins, et les e2e `mobile-recruteur*.spec.ts` sur le
projet mobile (remplacés par les e2e `modele-b-recruteur-*`). Les composants partagés avec la tablette et
l'ordinateur restent. Les anciennes adresses téléphone (`/app/hire/viviers`, `/app/hire/entretiens`,
`/app/hire/modeles`…) redirigent au téléphone vers leur écran Modèle B.

**Données.** Rien n'est effacé ; les migrations éventuelles (publication au nom de l'entreprise,
réseau du recruteur, profil talent discret) sont additives.

## Modèle B recruteur mobile · M1, coque (22 octobre 2026)

Au téléphone, l'espace recruteur passe dans la coque du Modèle B, la même que le talent
(`PhoneShell`, avec `set="recruteur"`) : fond sombre, barre du bas Fil · Offres · Candidatures ·
Talents · Messages en icônes seules (compteur lime des nouvelles candidatures, point sur Messages),
Orbi flottant menthe avec une question par onglet, avatar en haut à droite (logo de l'entreprise
en badge, « ? » tant que le rattachement n'est pas accepté) qui ouvre le compte, recherche en deux
temps (options « Rechercher dans » et recherches récentes d'abord, résultats dès la première
lettre, groupés Offres · Candidats · Entreprises · Personnes, tous filtrés par l'organisation),
transitions et préchargement du talent (listes Hire préchargées, fiches journalisées jamais).

- `src/lib/phone-tabs.ts` : deux jeux d'onglets (talent, recruteur).
- `src/components/phone/recruteur/` : tête d'onglet (`RhTab`), recherche, avatar, cloche, « + ».
- `src/server/services/hire-phone.ts` et `/api/hire/recherche/telephone` : compteurs de la barre et
  recherche.
- Les écrans pas encore redessinés (M2 à M8) gardent leur contenu sous la nouvelle tête, rendu
  lisible dans le cadre sombre (contrastes AA vérifiés avec axe).
- `mobile-recruteur.spec.ts` (ancienne barre) ne tourne plus sur le projet mobile ; remplacé par
  `modele-b-recruteur-coque.spec.ts`. Test en base : `tests/db/modele-b-recruteur.test.ts`.
- Ordinateur et tablette inchangés. Une fenêtre d'ordinateur rétrécie garde pour l'instant l'interface web (bascule à revoir en M8, avec le nettoyage).

## Modèle B recruteur mobile · M2, ouverture et inscription (22 octobre 2026)

Section 01 des captures (001 à 030). Au téléphone, « Je recrute » mène à la bienvenue recruteur
(trois écrans Publier · Trier · Recruter), puis à l'inscription recruteur : e-mail, mot de passe,
code, conditions pour les recruteurs en trois points, connexion avec son propre sous-titre. Ensuite
le profil recruteur en sept étapes, chaque étape enregistrée en avançant :

1. Vous : prénom, nom, photo (feuille appareil photo ou galerie).
2. Où vous êtes : pays (feuille par régions, avec recherche), ville, autres villes où l'on recrute.
3. Vos contacts : e-mail professionnel obligatoire (le domaine sert à valider l'entreprise),
   téléphone facultatif avec indicatif (feuille), WhatsApp, LinkedIn, et qui les voit.
4. Votre rôle : six rôles, poste tel qu'il s'affichera, avec suggestions.
5. Votre entreprise : recherche dès la première lettre, fiche de l'entreprise, demande de
   rattachement avec un message (les administrateurs sont prévenus dans l'appli et par e-mail),
   demande en attente (annulable), création de la page (la personne l'administre) ou recrutement en
   indépendant·e. Le logo de l'entreprise ne s'affiche qu'après l'accord.
6. Ce que vous recrutez : domaines (au moins un), niveaux, recrutements par an.
7. Votre profil recruteur : aperçu, accroche (Orbi propose trois phrases), « Recrute en ce moment ».

Puis « Ne laissez aucun candidat sans réponse » (notifications) et « Profil prêt » (logo en attente
ou affiché, premiers pas), et « Entrer dans Jumanly » ouvre le Fil recruteur.

- Base : table `RecruiterProfile` et colonne `OrgJoinRequest.message`, migration additive
  `20261022153517_recruiter_profile_phone`.
- `src/server/services/recruiter-onboarding.ts`, `src/server/actions/phone-rh-onboarding.ts`,
  `src/components/phone/recruteur/onboarding.tsx`, styles dans `src/styles/phone-recruteur.css`.
- Textes : parties « Modèle B recruteur · ouverture et inscription au téléphone » de
  `textes/textes-application.md` (`phoneRhAccueil`, `phoneRhOnboarding`).
- Tests : `tests/db/modele-b-recruteur-inscription.test.ts` (recherche limitée aux entreprises que
  l'on peut rejoindre, demande, acceptation, annulation, création de page),
  `tests/e2e/modele-b-recruteur-inscription.spec.ts` (chaque bouton du lot). Captures 390 × 844 :
  `CAPTURE_DIR=… pnpm test:e2e tests/e2e/modele-b-recruteur-inscription.spec.ts --project=mobile`.
- Choix notés dans `docs/decisions/2026-10-22-modele-b-recruteur-inscription.md`.
- Ordinateur et tablette inchangés : l'inscription recruteur web (entreprise et forfait) reste la même.

## Modèle B recruteur mobile · M3, Fil (22 octobre 2026)

Section 02 des captures (031 à 040). Au téléphone, l'onglet Fil du recruteur (`/app/hire`) montre :
la ligne « Partager une nouvelle, une offre… » avec « Publier », le lien « Publier au nom de
l'entreprise » (seulement pour un membre qui gère les offres), puis « Pour vous · Abonnements ·
Entreprises » comme pour un talent. La fin de liste mène à Talents.

- « Nouvelle publication » du recruteur : publier en tant que soi ou que l'entreprise (avec qui la
  verra), type Texte, Photo, Une offre (une offre en ligne de l'organisation) ou Un événement (date
  et heure), compteur 220 caractères, « Orbi complète le texte ». Après publication, retour au Fil.
- Recherche du Fil : Tout, Publications, Personnes, Entreprises ; avec « Tout », « Personnes et
  entreprises » puis « Publications ». Jamais les offres ni les candidats dans le Fil.
- « À traiter » n'est plus le premier écran au téléphone ; il le reste sur ordinateur et tablette.
- Code : `src/components/phone/recruteur/fil.tsx` et `compose.tsx`, `publishingSpace()` dans
  `src/server/hire-context.ts`, `createPost()` et `searchPosts()` dans `src/server/services/feed.ts`.
- Textes : partie « Modèle B recruteur · Fil au téléphone » (`phoneRhFil`).
- Tests : `tests/db/modele-b-recruteur-fil.test.ts` (au nom de l'entreprise seulement si l'on gère
  les offres, offre d'une autre organisation ou non publiée refusée, événement passé refusé,
  recherche sans personne bloquée), `tests/e2e/modele-b-recruteur-fil.spec.ts`.
- Choix notés dans `docs/decisions/2026-10-22-modele-b-recruteur-fil.md`. Aucune migration.

## Modèle B recruteur mobile · M4, Offres (22 octobre 2026)

Section 03 des captures (041 à 056). Au téléphone, l'onglet Offres (`/app/hire/offres`) montre la
ligne « N offres en cours · X candidatures · Y nouvelles », « Toutes · En cours · Terminées » et une
carte par offre (statut, nouvelles, vues, jours en ligne, candidatures).

- Détail d'une offre : statut, dates, quatre chiffres, la ligne d'Orbi avec « Pourquoi ? », les
  candidatures par jour sur 7 ou 30 jours, les sources, « Voir les N candidats ».
- « ··· » : Modifier, Mettre en pause ou Remettre en ligne, Partager (lien, Fil, WhatsApp),
  Dupliquer, Rouvrir, Clôturer (confirmation) puis « Offre clôturée, rapport prêt » (PDF).
- « Nouvelle offre » en quatre étapes, puis « Votre offre est en ligne » (ou en vérification).
- Code : `src/components/phone/recruteur/offres.tsx`, `offre-actions.tsx`, `publier.tsx`,
  `src/server/actions/phone-rh-offres.ts` ; branches téléphone des pages `/app/hire/offres`,
  `/app/hire/offres/[id]`, `/nouvelle` et `/[id]/modifier`. Ordinateur et tablette inchangés.
- Textes : partie « Modèle B recruteur · Offres au téléphone » (`phoneRhOffres`).
- Tests : `tests/db/modele-b-recruteur-offres.test.ts` (offres d'une autre organisation jamais
  listées, ouvertes, modifiées, publiées, clôturées ni classées ; brouillon dans l'organisation),
  `tests/e2e/modele-b-recruteur-offres.spec.ts` ; `tests/e2e/offer-flow.ts` publie aussi par les
  étapes du téléphone.
- Choix notés dans `docs/decisions/2026-10-22-modele-b-recruteur-offres.md`. Aucune migration.

## Modèle B recruteur mobile · M5, Candidatures (22 octobre 2026)

Sections 04 et 05 des captures (057 à 100). Au téléphone, l'onglet Candidatures
(`/app/hire/candidats`) montre « N nouvelles · X candidatures · Y à fort potentiel », une puce par
offre, puis quatre vues :

- **Fort potentiel** : la carte d'Orbi vers le diagnostic des CV, puis les profils à 80 % et plus,
  classés par score, avec ce qu'Orbi a relevé, ce qui intéresse la personne et sa disponibilité.
  Personne n'est écarté : tout le monde reste dans « Toutes ».
- **Toutes** : six étapes (Reçue, Présélection, Entretien, Proposition, Recruté·e, Non retenu·e),
  tri par score ou par date, « Sélectionner » puis « Écrire à N candidats » (quatre modèles, aperçu
  avec le prénom, envoi à chacun).
- **Entretiens** : aujourd'hui, à venir, à documenter (Rejoindre, Voir, Documenter, Fiche).
- **Décisions** : propositions, recrutés, non retenus, et « Répondre aux N sans réponse ».
- Recherche en deux temps par nom, compétence ou ville, limitée aux candidats de l'entreprise.
- Diagnostic des CV (`/app/hire/candidats/diagnostic`) lu dans les scores expliqués.
- Fiche d'un candidat : score avec « Pourquoi ? », étape modifiable, onglets Résumé, CV, Réponses,
  Notes, Historique ; « ··· » : changer d'étape, répartir à un collègue, planifier, demander un
  document, télécharger le PDF, ne pas retenir (motif interne et message bienveillant) ; en bas,
  « Écrire » et l'étape suivante (planifier, documenter, proposer, recruter).
- Planifier un entretien (jour, créneau libre pour l'équipe choisie, visio, sur place ou appel,
  durée), « Invitation envoyée » avec le fichier d'agenda ; documenter l'entretien (étoiles par
  critère, points forts, suite proposée) ; faire une proposition (salaire, date, message).
- Code : `src/components/phone/recruteur/candidatures.tsx`, `candidatures-client.tsx`,
  `candidat.tsx`, `candidat-client.tsx`, `candidat-forms.tsx`, `proposition.tsx`, `entretien.tsx` ;
  `src/server/services/hire-phone-candidatures.ts`, `src/server/actions/phone-rh-candidatures.ts` ;
  routes `/app/hire/candidats/[id]/dossier` (PDF, journalisé `candidate.pdf`) et
  `/app/hire/entretiens/[id]/agenda` (.ics). Ordinateur et tablette inchangés.
- Migration additive `20261022191139_application_assignee` (dossier suivi par un membre).
- Textes : partie « Modèle B recruteur · Candidatures au téléphone » (`phoneRhCandidatures`).
- Tests : `tests/db/modele-b-recruteur-candidatures.test.ts` (isolation des candidatures, de la
  recherche et des entretiens, consultation journalisée, dossier confié à un membre de l'entreprise
  seulement, proposition sans décision automatique), `tests/e2e/modele-b-recruteur-candidatures.spec.ts`.
- La fiche garde aussi le résumé par Orbi sur demande, l'annulation d'une décision pendant son
  délai et la préparation de l'entretien de l'ordinateur ; « Écrire » ouvre la conversation.
- Les anciens tests téléphone des candidats et du planificateur (`mobile-recruteur-candidats`,
  test « entretien » de `mobile-recruteur-entretiens`) ne tournent plus que sur ordinateur ; leurs
  gestes sont repris dans la nouvelle spec. `hire.spec.ts` a une branche téléphone.
- Choix notés dans `docs/decisions/2026-10-22-modele-b-recruteur-candidatures.md`. La feuille Orbi
  de l'onglet (planche 083) vient avec Orbi en M7.

## Modèle B recruteur mobile · M6, Talents (25 octobre 2026)

Section 06 des captures (101 à 119). Au téléphone, l'onglet Talents (`/app/hire/talents`) a quatre
rubriques :

- **Découvrir** : une puce par offre, « N talents visibles », des cartes classées par le score de
  compatibilité (nom, métier, années, ville, score et offre, « Dans votre vivier » ou l'état de la
  proposition). Seuls les talents visibles ; jamais les membres de l'entreprise.
- **Vivier** : les listes, « Nouvelle liste », la note sur le vivier personnel ; une liste
  (`/app/hire/viviers/[id]`) montre ses talents avec leur score et « Retirer » ; ses options
  permettent de la renommer ou de la supprimer, comme à l'ordinateur.
- **Propositions** : chaque offre proposée avec son état (« Envoyée, pas encore vue », « Vue, sans
  réponse », acceptée…) et « Relancer ».
- **Réseau** : invitations reçues (Accepter, ×), « À connaître » (Se connecter), mes relations
  filtrées (Toutes, Talents, Recruteurs et RH).
- Recherche en deux temps par compétence, métier ou ville.
- Profil d'un talent (`/app/hire/talents/[id]`) : bannière, nom, métier, ville et dernière
  activité, mobilité, « Se connecter », score avec « Pourquoi ? », proposition en cours, onglets
  Profil, Parcours, Réalisations ; en bas, vivier et « Proposer une offre » ; « ··· » : partager à
  un collègue, PDF (journalisé), masquer de mes suggestions, signaler. Chaque ouverture est
  journalisée.
- Code : `src/components/phone/recruteur/talents.tsx`, `talents-client.tsx`, `talent.tsx`,
  `vivier.tsx` ; `src/server/services/hire-phone-talents.ts`, `src/server/actions/phone-rh-talents.ts` ;
  route `/app/hire/talents/[id]/pdf`. Ordinateur et tablette inchangés ; au téléphone,
  `/app/hire/candidats?vue=talents|propositions` et `/app/hire/viviers` mènent à Talents.
- Migration additive `20261025233814_talent_suggestions_and_proposal_seen`.
- Textes : partie « Modèle B recruteur · Talents au téléphone » (`phoneRhTalents`).
- Tests : `tests/db/modele-b-recruteur-talents.test.ts` (talents visibles seulement, jamais les
  membres de l'entreprise, suggestion masquée par membre, partage dans l'entreprise seulement,
  « Vue », consultation journalisée, signalement), `tests/e2e/modele-b-recruteur-talents.spec.ts` ;
  `hire-advanced.spec.ts` suit le nouveau parcours au téléphone, la partie téléphone de l'ancien
  test « talents » de `mobile-recruteur-entretiens.spec.ts` est réservée à l'ordinateur.
- Choix notés dans `docs/decisions/2026-10-25-modele-b-recruteur-talents.md`.

## Modèle B recruteur mobile · M7, Messages, notifications et Orbi (26 octobre 2026)

Sections 07 et 10 des captures (120 à 134, 180 à 184). Au téléphone :

- **Messages** (`/app/messages`) : recherche (« Annuler », « Chercher dans » Tout, Candidats,
  Réseau, Équipe, sans tenir compte des accents), onglets Candidats, Réseau, Équipe avec le nombre
  de non-lus, lignes avec initiales, heure, offre et étape en vert, aperçu et pastille ; « + »
  ouvre « Nouveau message » (un candidat ou un collègue).
- **Conversation** (`/app/messages/[id]`) : la personne et la ligne verte, la carte « Ouvrir »
  (fiche de la candidature, profil du talent ou de la relation), les bulles, la carte d'un
  entretien, puis « Orbi propose · Modèles · Joindre » (entretien, document, fichier) et le champ.
  « ··· » : fiche, couper les notifications, épingler, retirer de la messagerie de l'équipe.
- **Équipe** (`/app/messages/equipe/[id]`) : conversation entre deux membres, nouvelle table
  `TeamThread` / `TeamMessage` (migration additive `20261026004024_team_threads`), notification
  « … vous a écrit dans Équipe. ».
- **Notifications** (`/app/notifications`) : Retour, « Tout marquer comme lu », réglages ; Tout,
  Candidatures, Entretiens, Réseau ; Aujourd'hui, Hier, Cette semaine, Plus tôt ; les demandes
  pour rejoindre l'entreprise et les offres qui se terminent au-dessus.
- **Orbi** : la feuille de chaque onglet répond aux questions factuelles sans crédit (« Qui attend
  une réponse de ma part ? », « Résumer mes non-lus », « Qui recevoir en premier ? », « Qui
  proposer pour mes offres ? ») et mène à « Ouvrir la conversation complète » ; la page `/app/orbi`
  (planche 184) : crédits, « Effacer », réponses avec leurs boutons, « Vous pouvez aussi
  demander », champ.
- Code : `src/components/phone/recruteur/messages*.tsx`, `conversation*.tsx`,
  `notifications*.tsx`, `orbi*.tsx` ; `src/server/services/hire-phone-messages.ts` ;
  `src/server/actions/phone-rh-messages.ts`, `phone-rh-orbi.ts`. Ordinateur et tablette inchangés.
- Textes : partie « Modèle B recruteur · Messages, notifications et Orbi au téléphone »
  (`phoneRhMessages`, `phoneRhNotifs`, `phoneRhOrbi`).
- Tests : `tests/db/modele-b-recruteur-messages.test.ts` (listes filtrées par entreprise,
  conversation d'équipe lue et écrite par ses deux membres seulement, jamais par un talent, un
  autre collègue ou une autre entreprise, collègue parti), `tests/e2e/modele-b-recruteur-messages.spec.ts`
  (chaque bouton, captures dans `captures/etape-2-mobile/m7/`) ; branches téléphone ajoutées dans
  `mobile-recruteur-gerer.spec.ts` et `mobile-recruteur-ats.spec.ts`.
- Choix notés dans `docs/decisions/2026-10-26-modele-b-recruteur-messages.md`.

## Modèle B recruteur mobile · M8, compte, entreprise et changer de profil (26 octobre 2026)

Sections 08, 09 et 11 des captures (135 à 179, 185 à 192). Au téléphone, l'avatar ouvre Compte :

- **Compte** (`/app/hire/compte`) : retour au Fil, cloche, carte de la personne (poste,
  « Rattaché·e à … » avec le logo, seulement après l'accord), « Changer de profil », Mon activité
  (profil recruteur, statistiques, publications enregistrées), l'entreprise (page, équipe, formule
  et usage), Réglages (notifications, modèles, confidentialité, langue, aide), « Se déconnecter »
  après confirmation.
- **Mon profil recruteur** (`/compte/profil`) : l'aperçu que voient les talents (accroche, « Recrute
  en ce moment », domaines, offres en cours, contacts) ; **Modifier** (`/compte/profil/modifier`) :
  accroche (Orbi en propose une, relue avant d'enregistrer), badge, qui voit le téléphone,
  l'entreprise.
- **Mes statistiques** (`/compte/statistiques`) : 30 jours sur les offres que l'on voit : reçues,
  délai moyen de première réponse, part ayant reçu une réponse, entretiens, du dépôt à l'embauche,
  « Les N % sans réponse » vers Décisions.
- **Publications enregistrées** (`/compte/enregistrees`), le signet les retire.
- **Équipe** (`/compte/equipe`) : membres, rôles, dossiers suivis, « Qui peut faire quoi » ;
  « Proposer un collègue » (demande aux administrateurs) ou, pour un administrateur, « Inviter un
  collègue ».
- **Formule et usage** (`/compte/formule`) : lecture seule, usage du mois (utilisateurs, offres
  actives, recherches de talents, crédits Orbi), comparaison, « Demander … à l'administrateur ».
- **Modèles de messages** (`/app/hire/modeles` au téléphone), **Notifications**
  (`/compte/notifications`), **Confidentialité et données** (`/compte/confidentialite` : journal
  des consultations du mois, ce que l'on partage, copie des données, quitter l'entreprise),
  **Langue** (`/compte/langue`), **Aide et contact** (`/compte/aide`, par e-mail seulement).
- **Page de l'entreprise** : celle du talent (`/app/entreprises/[slug]`), avec, sur sa propre
  entreprise, « Votre entreprise · page administrée par … » et « Publier au nom de … ».
- **Changer de profil** : recruteur, talent (l'espace talent du Modèle B), entreprise ; un
  administrateur ouvre « Agir au nom de l'entreprise » (`/app/hire/entreprise` : demandes pour
  rejoindre, chiffres, messages, offres, « Publier au nom de … »).
- **Nettoyage** : barre du bas de l'ancienne coque supprimée (`bottom-bar.tsx`,
  `hidesRecruiterTabBar` et ses tests), partie téléphone de l'ancien Compte RH supprimée, textes
  orphelins retirés ; une fenêtre d'ordinateur rétrécie garde l'interface de l'ordinateur ; `/app/hire/entretiens`,
  `/app/hire/rapports` et `/app/organisation/equipe` mènent au téléphone vers leurs écrans
  Modèle B.
- Code : `src/components/phone/recruteur/compte.tsx`, `compte-client.tsx` ;
  `src/server/services/hire-phone-account.ts` ; `src/server/actions/phone-rh-compte.ts`. Deux
  notifications ajoutées (`colleagueProposed`, `planRequested`) et les interrupteurs du recruteur
  (`rh.*`). Pas de migration.
- Textes : partie « Modèle B recruteur · Compte, entreprise et changer de profil au téléphone »
  (`phoneRhCompte`).
- Tests : `tests/db/modele-b-recruteur-compte.test.ts` (statistiques, équipe et journal des
  consultations dans la seule organisation, demandes aux seuls administrateurs avec limite,
  formule jamais changée, quitter sans rien effacer, mode entreprise réservé, interrupteurs
  séparés), `tests/e2e/modele-b-recruteur-compte.spec.ts` (chaque bouton, captures dans
  `captures/etape-2-mobile/m8/`) ; `mobile-recruteur-gerer.spec.ts` suit les nouvelles adresses.
- Choix notés dans `docs/decisions/2026-10-26-modele-b-recruteur-compte.md`.

## Rapport final · étape 2, recruteur au téléphone (Modèle B, M0 à M8) (26 octobre 2026)

L'espace recruteur du téléphone suit maintenant le Modèle B (`docs/modele-b-recruteur/`, sections
01 à 11 de `mobile/captures/INDEX.md`). La tablette, l'ordinateur et l'administration d'entreprise
n'ont pas changé. Aucune donnée n'a été effacée et aucune migration n'a été ajoutée.

| Lot | Contenu | PR |
|---|---|---|
| M0 | Diagnostic des écrans recruteur au téléphone | #146 |
| M1 | Coque : barre à cinq, Orbi, avatar, recherche | #147 |
| M2 | Ouverture, inscription et profil recruteur | #148 |
| M3 | Fil du recruteur | #149 |
| M4 | Offres | #150 |
| M5 | Candidatures (pipeline, fiche, décisions, entretiens) | #152 |
| M6 | Talents (découverte, recherche, viviers) | #154 |
| M7 | Messages, notifications et Orbi | PR du lot M7 |
| M8 | Compte, entreprise, changer de profil, nettoyage | PR du lot M8 |

- **Captures** (390 × 844, prises par les e2e) : dossier partagé `captures/etape-2-mobile/`, un
  sous-dossier par lot (`m1` à `m8`). Les numéros des fichiers sont ceux de l'INDEX des planches.
- **Règles d'or vérifiées par les tests en base** : chaque lecture Hire est filtrée par
  l'organisation active ; chaque consultation de profil est journalisée ; candidater reste gratuit ;
  les droits sont testés par clés ; le profil discret n'est jamais montré à sa propre entreprise ;
  le logo de l'entreprise n'apparaît qu'après l'accord du rattachement ; la formule est en lecture
  seule pour le recruteur ; aucun numéro de téléphone de Jumanly.
- **Ancien design téléphone supprimé** : barre du bas de l'ancienne coque, `hidesRecruiterTabBar`,
  partie téléphone de l'ancien Compte RH et textes orphelins (M8). Les anciennes adresses mènent
  aux écrans Modèle B.
- **Sécurité** : Next.js est passé en 16.4.2 pendant l'étape (M3), pour corriger des failles
  signalées par `pnpm audit`.
- **Non construit**, faute de modèle de données ou d'événement (détails dans `docs/decisions/`) :
  - la confirmation des « nouveaux membres qui indiquent travailler chez … » (planche 191), où les
    demandes de rattachement s'affichent à la place ;
  - la notification « Profil à fort potentiel » ;
  - la création et la modification des modèles de messages, qui restent sur ordinateur.
- **À valider par Ephraïm** : l'ensemble de l'étape 2 au téléphone, avant l'étape 3 (entreprise et
  administration recruteur, web seulement).

## Étape 3 · espace administrateur d'entreprise (Modèle B, ordinateur) · A0, diagnostic (26 octobre 2026)

Référence : `docs/modele-b-recruteur/` (brief § 2 à 6, lots A1 à A6), sections 04 et 06 de
`web/captures/INDEX.md` (captures 020 à 029 et 074 à 091), sources `web/maquette/Web-Acces.dc.html`
(étapes `a-*`) et `Web-App.dc.html` (`qui="joseph"`). Elle remplace les planches `admin-1` et
`admin-2` de `docs/refonte-web/`.

**Le cadre existant.** L'administrateur utilise l'appli du recruteur sur ordinateur
(`RecruiterShell`, barre latérale `src/components/recruiter/side-nav.tsx`). Son mode sombre est déjà
proche du Modèle B (fond nuit, lime pour les actions). On y branche la partie ENTREPRISE, réservée
à `org_owner` et `org_admin`. Les écrans recruteur ne changent pas (voir
`docs/decisions/2026-10-26-etape-3-cadre.md`).

**Écrans entreprise existants, tous à refaire sur le Modèle B :**

| Existant | Devient | Lot |
|---|---|---|
| `/inscription` → `/inscription/forfait`, `/compte`, `/verification`, `/paiement`, puis `/app/bienvenue` (création de l'organisation) | Inscription de l'administrateur en 9 étapes, avec l'aperçu en direct de la page (020 à 029) | A1 |
| `/app/organisation/equipe` (sièges, tableau des membres, « Qui peut faire quoi ») | Équipe : membres et rôles, droits par membre, tâches, invitations et demandes, membres déclarés (076 à 078) | A2 |
| `/app/organisation` (carte, chiffres, présentation), `/app/organisation/modifier`, `/verification`, `/structure` | Page entreprise : modifier, aperçu public (081, 082) ; la vérification et la structure (équipes, départements) y sont reprises | A3 |
| `/app/abonnement`, `/abonnement/formules`, `/abonnement/factures`, `/abonnement/payer` (pour une organisation) | Formule et facturation : jauges, changement de formule, factures, fenêtre de paiement (083) | A4 |
| `/app/parametres/consultations` (journal de l'organisation ou du membre) | Journal des consultations (084) | A5 |
| `/app/hire/modeles` (modèles de l'organisation) ; étapes de l'ATS par offre seulement ; aucune grille d'entretien réglable | Réglages : étapes de l'ATS, modèles de messages, grille d'entretien (085 à 087) | A5 |

**Ce qui manque dans les données, avec des migrations additives :**
- droits ajustés par membre (A2) ;
- tâches confiées à un membre, avec leur état Attribuée → Acceptée → En cours → Terminée (A2) ;
- réponse de l'administrateur à un membre déclaré par son expérience (A2) ;
- étapes de l'ATS et grille d'entretien par défaut de l'organisation (A5).

**À supprimer en A6.** Les pages de l'ancien `/app/organisation` :
- `page.tsx`, `equipe`, `modifier`, `structure`, `verification` ;
- `src/components/org/structure-tabs.tsx` ;
- les parties organisation de `/app/abonnement` ;
- leurs textes devenus orphelins.

Les anciennes adresses mènent aux nouvelles. Environ 38 liens vers `/app/organisation` sont à
reprendre.

**Captures du Joseph de la maquette non reprises dans cette étape.** Ce sont des écrans du recruteur
vus par l'administrateur, qui gardent leurs écrans actuels :
- l'accueil (074, 075) ;
- le tableau de bord (079) et Mon espace (080) ;
- les candidatures (088), l'agenda (089) et les offres (090) de l'équipe ;
- « agir au nom de l'entreprise » (091).

L'accueil de l'administrateur pourra montrer les demandes en attente, reprises en A2.

### Étape 3 · A1, inscription de l'administrateur d'entreprise (26 octobre 2026)

L'administrateur crée l'espace de son entreprise sur ordinateur, en neuf étapes puis « prêt »,
sur `/inscription/entreprise?etape=…`. À gauche, la scène des maquettes pour la formule, le compte
et le code, puis l'aperçu en direct de la page entreprise : nom, secteur, ville, taille,
présentation, bannière, logo, état de la vérification, formule et invitations.

| Capture | Écran |
|---|---|
| 020 | Étape 1 · formule (RH Free, Company, Company Plus, Company Premium sur devis) |
| 021 | Étape 2 · compte de l'entreprise (Google, Apple, LinkedIn si configurés, ou e-mail) |
| 022 | Étape 3 · code à 6 chiffres, « Renvoyer le code » |
| 023 | Étape 4 · rôle de l'administrateur |
| 024 | Étape 5 · l'entreprise (secteur, taille, ville du siège, site, à propos) |
| 025 | Étape 6 · logo et bannière |
| 026 | Étape 7 · vérification (domaine de l'e-mail, registre du commerce) |
| 027 | Étape 8 · paiement prépayé (M-Pesa, Orange Money, Airtel Money, carte), attente, reçu, ou « RH Free et payer plus tard » |
| 028 | Étape 9 · invitation de l'équipe (Recruteur, Manager, Lecteur), dans les places de la formule |
| 029 | Prêt · « Entrer dans l'espace administrateur » |

- Données : migration additive `organization_banner_theme` (couleur de bannière).
- Sous 768 px ou sur un téléphone : « À ouvrir sur un ordinateur ».
- `/inscription?profil=company` et `/inscription/forfait?profil=company` mènent au nouveau parcours.
  L'ancien parcours d'organisation (`/inscription/forfait`, `/app/bienvenue`) ne sert plus qu'au
  recruteur seul ; ce qui en devient inutile part en A6.
- Choix simples notés dans `docs/decisions/2026-10-26-etape-3-a1-inscription.md`.
- Tests : `tests/e2e/web-admin-inscription.spec.ts` (chaque bouton, RH Free, paiement en attente,
  un manager renvoyé, le téléphone) et `tests/db/admin-entreprise-inscription.test.ts`
  (organisation seule, places de la formule, vérification).
- Captures à 1440 × 900 et 1024 × 900 : `/mnt/project-files/captures/etape-3/a1/`.

### Étape 3 · A2, Équipe (26 octobre 2026)

Écran Équipe de l'administrateur (`/app/organisation/equipe`), captures 076 à 078 du Modèle B :
- **Membres et rôles** : une carte par membre (rôle, droits, tâches terminées), le rôle à changer, six droits par membre dans la limite du rôle et de `org.permissions.level`, les tâches du membre, « Retirer de l'équipe » ;
- **Tâches** : tableau filtrable (Toutes, En cours, En retard, Terminées), « Fiche » et « Relancer » ;
- **Invitations et demandes** : demandes de rattachement, personnes qui indiquent travailler dans l'entreprise (« Confirmer » ou « Ne travaille pas ici »), invitations envoyées (« Relancer », « Annuler ») et places restantes ;
- « Inviter un membre » et « Attribuer une tâche » en fenêtres ; « Mes tâches » (`/app/hire/taches`) pour le membre.

Plomberie : partie ENTREPRISE de la barre latérale (propriétaire et administrateurs), espace recruteur sur ordinateur toujours sombre, « À ouvrir sur un ordinateur » pour `/app/organisation/*` sur téléphone, droits appliqués aux gestes du recruteur (`requireHire(…, droit)`). Migration additive `team_rights_tasks_declared` (`Membership.rights`, `OrgTask`, `OrgDeclaredMember`). Données de démonstration : `prisma/seed/entreprise.ts` (Baobab Fintech, entreprise fictive). Choix : `docs/decisions/2026-10-26-etape-3-a2-equipe.md`.

| Capture | Écran |
|---|---|
| 076 | Membres et rôles (`076-equipe`), fenêtre « Attribuer une tâche » (`076b-attribuer`) |
| 077 | Tâches (`077-equipe-taches`), « Mes tâches » du membre (`077b-mes-taches`) |
| 078 | Invitations et demandes (`078-equipe-invitations`) |

Captures 1440 et 1024 : `captures/etape-3/a2/` des fichiers du projet. Tests : `tests/db/entreprise-equipe.test.ts` (droits, isolation, tâches, places, membres déclarés), `tests/e2e/web-admin-equipe.spec.ts` (chaque bouton, droit retiré, manager refusé, téléphone). Mis à jour : `web-recruteur-3`, `mobile-recruteur-gerer`, `hire` (la page entreprise ne se modifie plus sur téléphone).

## Étape 3 · A3, Page entreprise (26 octobre 2026)

- `/app/organisation` devient la Page entreprise du Modèle B (capture 081) : bannière et logo
  (fenêtre sombre, image recadrée au centre par le serveur), nom, secteur, taille, ville, site,
  à propos, badge « Recrute en ce moment », « Voir la page publique » et « Publier les changements ».
  À droite : membres déclarés (Confirmer, Ne travaille pas ici), état de la vérification, membres
  confirmés, et pour le propriétaire seul le transfert de propriété.
- `/app/organisation/apercu` : la page vue par un talent (capture 082), onglets À propos, Membres
  (« Confirmé par … » ou « Indiqué par la personne ») et Offres ouvertes.
- `/app/organisation/modifier` mène à `/app/organisation`.
- Migration additive `company_page_hiring_now` (`Organization.hiringNow`) ; le badge s'affiche aussi
  sur `/entreprises/[slug]` et fait passer l'entreprise en tête dans Explorer.
- Tests : `tests/db/entreprise-page.test.ts` (enregistrement et journal, recruteur et lecteur refusés,
  isolation, transfert réservé au propriétaire, membres et offres de l'aperçu) ;
  `tests/e2e/web-admin-page.spec.ts` (chaque bouton, transfert aller-retour, manager refusé,
  téléphone). Parcours mis à jour : `hire.spec.ts` (bannière et logo), `mobile-recruteur-gerer`,
  `web-recruteur-3`.
- Choix : `docs/decisions/2026-10-26-etape-3-a3-page-entreprise.md`.

| Capture | Écran | Fichiers |
|---|---|---|
| 081 | Page entreprise · modifier | `/mnt/project-files/captures/etape-3/a3/081-page-entreprise-{1440,1024}.png` |
| 082 | Page entreprise · vue publique | `/mnt/project-files/captures/etape-3/a3/082-vue-publique-{1440,1024}.png` |

## Étape 3 · A4, Formule et facturation (26 octobre 2026)

- Nouvel écran `/app/organisation/facturation` (capture 083), réservé au propriétaire et aux
  administrateurs : formule actuelle (prix, période prépayée, moyen de paiement, rappels 7, 3 et
  0 jours puis 3 jours de grâce et retour à la formule gratuite), « Renouveler maintenant », jauges
  « Usage ce mois », « Changer de formule » (monter en gamme payé tout de suite avec le crédit des
  jours non utilisés, réduire programmé à l'échéance et annulable, devis pour la formule sans prix)
  et le tableau des factures avec leur PDF.
- Fenêtre de paiement sombre : M-Pesa, Orange Money, Airtel Money ou carte, attente de la
  confirmation (lue toutes les 3 secondes), « J'ai confirmé », « Réessayer », paiement reçu.
- Section ENTREPRISE : « Formule et facturation » mène au nouvel écran ; « Page entreprise » n'est
  plus allumée sur les pages des autres entrées.
- `reports.export` ouvert à toutes les formules Company (décision du 22/10/2026) : partie 05, seed et
  migration de données `company_reports_export`.
- Démo : Baobab Fintech prépaie Company depuis trois mois, avec ses factures et l'usage du mois.
- Tests : `tests/db/entreprise-facturation.test.ts` (écran et formules, recruteur et lecteur refusés,
  montée en gamme payée par un administrateur, baisse programmée et journal, isolation des paiements
  et factures) ; `tests/e2e/web-admin-facturation.spec.ts` (chaque bouton, paiement refusé puis par
  carte, attente sans réponse, baisse annulée puis programmée puis gardée, téléchargement du PDF,
  manager refusé y compris sur le PDF, téléphone).
- Choix : `docs/decisions/2026-10-26-etape-3-a4-formule-facturation.md`.

| Capture | Écran | Fichiers |
|---|---|---|
| 083 | Formule et facturation | `/mnt/project-files/captures/etape-3/a4/083-formule-facturation-{1440,1024}.png` |

## Étape 3 · A5, Journal des consultations et Réglages (26 octobre 2026)

- Nouvel écran `/app/organisation/journal` (capture 084), réservé au propriétaire et aux
  administrateurs : qui a consulté quoi (profil, CV, PDF, évaluation, rapport), filtre par membre,
  chaque ligne mène à la candidature, au talent ou aux rapports. Les profils anonymes restent anonymes.
- Nouvel écran `/app/organisation/reglages` (captures 085 à 087) : étapes des nouvelles offres
  (ajouter, retirer, étapes fixes), cinq modèles de messages de l'entreprise, grille d'entretien
  commune (10 critères au plus).
- Migration additive `org_recruiting_settings` (`Organization.pipelineTemplate`,
  `Organization.scorecardCriteria`). Les nouvelles offres prennent les étapes choisies ; l'évaluation
  prend la grille de l'offre, sinon celle de l'entreprise, sinon les compétences requises.
- Chaque évaluation enregistrée est notée au journal d'audit (`scorecard.save`).
- Démo : huit consultations fictives chez Baobab Fintech et une grille de cinq critères.
- Tests : `tests/db/entreprise-reglages.test.ts` (journal, isolation, anonymat, étapes, modèles,
  grille, recruteur et lecteur refusés) ; `tests/e2e/web-admin-reglages.spec.ts` (chaque bouton,
  manager refusé, téléphone).
- Choix : `docs/decisions/2026-10-26-etape-3-a5-journal-reglages.md`.

| Capture | Écran | Fichiers |
|---|---|---|
| 084 | Journal des consultations | `/mnt/project-files/captures/etape-3/a5/084-journal-{1440,1024}.png` |
| 085 | Réglages, étapes | `/mnt/project-files/captures/etape-3/a5/085-reglages-etapes-{1440,1024}.png` |
| 086 | Réglages, modèles de messages | `/mnt/project-files/captures/etape-3/a5/086-reglages-modeles-{1440,1024}.png` |
| 087 | Réglages, grille d'entretien | `/mnt/project-files/captures/etape-3/a5/087-reglages-grille-{1440,1024}.png` |

## Étape 3 · A6, nettoyage (26 octobre 2026)

- Vérification (`/app/organisation/verification`) et structure (`/app/organisation/structure`,
  équipes, départements, entités) passées au Modèle B, réservées au propriétaire et aux
  administrateurs ; « Équipes et départements » s'ouvre depuis Équipe, qui reste allumée dans la
  barre latérale. `src/components/org/structure-tabs.tsx` supprimé.
- Anciennes pages : l'abonnement d'une entreprise et le journal de l'équipe mènent, sur ordinateur,
  à « Formule et facturation » et au Journal des consultations.
- Aucun lien mort pour un membre qui n'administre pas (menu du compte, tuiles de Compte, anciennes
  adresses du téléphone ouvertes sur ordinateur).
- Page entreprise du talent au téléphone : les personnes qui disent y travailler, avec « Indiqué par
  la personne » ; jamais un profil anonyme, ni chez l'administrateur.
- Textes orphelins retirés (`rhTeam.*`, `rhOrg.*` sauf `structure`).
- Tests : `tests/e2e/web-admin-nettoyage.spec.ts` (structure verrouillée puis créée et supprimée par
  le groupe, vérification, anciennes adresses, manager refusé et sans lien mort, page entreprise du
  talent au téléphone) avec l'aide `tests/e2e/make-declared.ts` ; test en base ajouté à
  `tests/db/entreprise-page.test.ts`. Tests ajustés : `hire-advanced`, `mobile-recruteur-gerer`,
  `web-recruteur-3`.
- Choix : `docs/decisions/2026-10-26-etape-3-a6-nettoyage.md`.

| Capture | Écran | Fichiers |
|---|---|---|
| — | Structure, formule sans le droit | `/mnt/project-files/captures/etape-3/a6/a6-structure-verrou-{1440,1024}.png` |
| — | Structure, équipes du groupe | `/mnt/project-files/captures/etape-3/a6/a6-structure-equipes-{1440,1024}.png` |
| — | Vérification | `/mnt/project-files/captures/etape-3/a6/a6-verification-{1440,1024}.png` |

## Rapport final · étape 3, espace administrateur d'entreprise (Modèle B, ordinateur, A0 à A6) (26 octobre 2026)

L'espace de l'entreprise suit maintenant le Modèle B (`docs/modele-b-recruteur/`, sections 04 et 06
de `web/captures/INDEX.md`), sur ordinateur et tablette ; sous 768 px, « À ouvrir sur un
ordinateur ». La section ENTREPRISE de la barre latérale (Équipe, Page entreprise, Formule et
facturation, Journal, Réglages) n'apparaît qu'au propriétaire et aux administrateurs. Les écrans du
recruteur n'ont pas changé. Aucune donnée n'a été effacée ; les migrations sont additives.

| Lot | Contenu | Captures | PR |
|---|---|---|---|
| A0 | Diagnostic | — | #157 |
| A1 | Inscription de l'administrateur, aperçu en direct de la page | 020 à 029 | #158 |
| A2 | Équipe : rôles, droits par membre, tâches, invitations, membres déclarés | 076 à 078 | #159 |
| A3 | Page entreprise : modifier, vue publique, badge « Recrute en ce moment » | 081, 082 | #160 |
| A4 | Formule et facturation : jauges, changement de formule, paiement, factures | 083 | #161 |
| A5 | Journal des consultations ; Réglages (étapes, modèles, grille) | 084 à 087 | #162 |
| A6 | Nettoyage : vérification et structure, anciennes adresses, page entreprise du talent | — | PR du lot A6 |

- **Captures** à 1440 et 1024 px, prises par les e2e : dossier partagé `captures/etape-3/`, un
  sous-dossier par lot (`a1` à `a6`). Les numéros sont ceux de l'INDEX des planches.
- **Migrations additives** : `organization_banner_theme` (A1), `team_rights_tasks_declared` (A2),
  `company_page_hiring_now` (A3), `company_reports_export` (A4, données), `org_recruiting_settings`
  (A5).
- **Règles vérifiées par les tests en base** : chaque lecture est filtrée par l'organisation ;
  recruteur, manager et lecteur sont refusés ; les sièges sont comptés ; chaque consultation de
  profil est journalisée et lisible par les seuls administrateurs ; un profil anonyme reste anonyme ;
  les droits sont testés par clés ; `reports.export` est ouvert à toutes les formules Company ;
  paiement prépayé (M-Pesa, Orange Money, Airtel Money, carte), montée immédiate, baisse à
  l'échéance ; aucun numéro de téléphone.
- **Ancien design supprimé** : anciennes pages de `/app/organisation` (accueil, équipe, modifier,
  remplacées en A2 et A3), `structure-tabs.tsx`, textes orphelins. Les anciennes adresses mènent aux
  nouveaux écrans.
- **Captures du Joseph de la maquette non reprises** (écrans du recruteur vus par l'administrateur,
  qui gardent leurs écrans actuels) : 074, 075, 079, 080, 088 à 091.
- **Choix notés** dans `docs/decisions/2026-10-26-etape-3-*.md` (noms d'étapes, champs des modèles et
  échelle de notation existants plutôt que ceux de la maquette, entre autres).
- **À valider par Ephraïm** : l'ensemble de l'étape 3. Ensuite, comme convenu le 26/10 : les écrans
  du recruteur sur ordinateur au Modèle B (section 05, `Web-N-*`), en PR séparées.

## Recruteur sur ordinateur (Modèle B) · N0, diagnostic (26 octobre 2026)

Ephraïm a validé l'étape 3 le 26/10 (« Oui c'est bon »). Comme convenu le même jour, les écrans du
recruteur sur ordinateur passent au Modèle B : section 05 de `docs/modele-b-recruteur/web/captures/INDEX.md`
(captures 030 à 073, planches `Web-N-*`, prototype `Web-App.dc.html` avec `qui="nadia"`). Les écrans
de Joseph qui sont ceux du recruteur vus par l'administrateur (074, 075, 079, 080, 088 à 091),
laissés de côté à l'étape 3, sont repris ici avec eux.

**Le cadre existant.** Sur ordinateur, le recruteur a l'appli de la refonte web (`RecruiterShell`,
`src/components/recruiter/side-nav.tsx` et `header.tsx`) : barre latérale À traiter · Offres · Orbi
(carte `Ctrl K`) · Candidats · Messages, puis Agenda · Talents · Rapports, l'organisation active en
haut, la partie ENTREPRISE de l'étape 3 pour les administrateurs ; en-tête avec recherche, cloche,
messages et avatar. Le Modèle B demande : Accueil · Fil · Offres · Candidatures · Agenda · Talents ·
Messages avec leurs pastilles, une partie PILOTAGE (Tableau de bord, Mon espace), Compte et la carte
« Changer de profil » en bas ; en-tête avec le titre de la page, la recherche, la cloche et « Publier
une offre » ; Orbi en disque menthe flottant en bas à droite. Tous les écrans sont donc à refaire.

**Écrans des planches → route → lot :**

| Captures | Écran | Route | Lot |
|---|---|---|---|
| 030 | Cadre : barre latérale, en-tête, Orbi | toutes les pages recruteur | N1 |
| 031, 032, 074, 075 | Bienvenue (premier passage), Accueil du jour (rendez-vous, tâches, à traiter, offres) | `/app/hire` | N1 |
| 033 | Fil, publication de 220 caractères | `/app/fil` (recruteur) | N2 |
| 034 à 037, 090 | Offres : liste et indicateurs ; offre en onglets aperçu, annonce, équipe et réglages | `/app/hire/offres`, `/app/hire/offres/[id]` | N2 |
| 038 à 042 | Publier une offre en 5 étapes | `/app/hire/offres/nouvelle` | N2 |
| 043, 044, 088 | Candidatures en colonnes ou en liste | `/app/hire/candidats` | N3 |
| 045 à 051 | Fiche candidat en 7 onglets | `/app/hire/candidats/[applicationId]` | N3 |
| 052 | Évaluer un entretien (5 critères, recommandation) | `/app/hire/candidats/[applicationId]/evaluation` | N3 |
| 053 à 055, 089 | Agenda semaine, jour, mois, disponibilités | `/app/hire/entretiens` | N4 |
| 063, 064, 079, 080 | Tableau de bord ; Mon espace (rôle, tâches, rapport PDF) | `/app/hire/rapports`, `/app/hire/taches` | N4 |
| 056 à 059 | Talents : découvrir, vivier, propositions, réseau | `/app/hire/talents` (les viviers y deviennent un onglet) | N5 |
| 072, 073 | Page d'une autre entreprise, page de Baobab | `/app/entreprises/[slug]` | N5 |
| 060 à 062 | Messages, notifications, Orbi en page | `/app/messages`, `/app/notifications`, `/app/orbi` | N6 |
| 065 à 071, 091 | Compte : profil, changer de profil, formule en lecture, sécurité, notifications, aide, déconnexion | `/app/hire/compte/*` (aujourd'hui au téléphone seulement) | N7 |

**Données.** Les règles et les tables existent déjà (étapes 2 et 3) : tâches `OrgTask`, journal des
consultations, réglages de l'organisation, profil recruteur, conversations d'équipe, notifications
`rh.*`. Aucune migration n'est prévue ; s'il en faut une, elle sera additive.

**Ancien design à supprimer en N7** : les composants de la refonte web propres à l'ordinateur dans
`src/components/recruiter/` qui ne servent plus, les feuilles `recruiter-web*.css` et les parties de
`recruiter*.css` devenues mortes, les textes orphelins, et les specs `web-recruteur-1` à `4` et
`hire-wide` réécrites lot par lot. La tablette (768 à 1199 px) garde son rail d'icônes, habillé comme
l'ordinateur.

**Plan des PR** (une branche `claude/modele-b-web-nN` et une PR par lot, enchaînées et fusionnées
dès que la CI est verte) : N0 diagnostic, N1 cadre et accueil, N2 Fil et Offres, N3 Candidatures,
fiche et évaluation, N4 Agenda et pilotage, N5 Talents et pages entreprise, N6 Messages,
notifications et Orbi, N7 Compte, nettoyage et rapport final, puis arrêt pour la validation
d'Ephraïm. Chaque lot : captures à 1440 et 1024 dans `captures/etape-2-web/`, un e2e qui touche
chaque bouton, les tests en base touchés, et le journal.

## Fil, menu, publication · 1/3 : menu en pilule (26 octobre 2026)

Référence : `docs/fil-menu-publication/BRIEF-FIL-MENU-PUBLICATION-CLAUDE-CODE.md` § 1 (validé par Ephraïm le 26/10/2026).

- La barre du bas du téléphone (`src/components/phone/nav.tsx`, styles `src/styles/phone.css`) devient une
  pilule flottante (64 px, à 12 px des bords et 22 px du bas, fond flouté). Onglets inactifs : ronds 48 px
  `#203F42`, icône crème. Onglet actif : pilule Lime avec l'icône et le nom en Sapin. La pilule glisse d'un
  onglet à l'autre (largeur, marges et fond animés, 0,32 à 0,34 s) ; elle bouge dès le toucher, avant
  l'arrivée de la page. Aucune animation si le téléphone ou le réglage « Réduire les animations » le demande.
- Libellés du menu : talent Fil · Explorer · Carrière · **Hub** · **Chat** ; recruteur Fil · Offres ·
  Candidatures · Talents · **Chat**. Les titres des pages et les adresses ne changent pas (la page Messages
  garde son titre).
- Compteurs : Chat montre le nombre de conversations non lues (talent et recruteur ; le recruteur avait un
  simple point), Candidatures le nombre de nouvelles candidatures. Le compteur s'efface sur l'onglet actif.
- Orbi reste flottant au-dessus du menu, à droite (104 px du bas).

## Fil, menu, publication · 2/3 : publication titre + texte + image à encoche (26 octobre 2026)

Référence : brief `docs/fil-menu-publication/`, § 2.

- Base : `FeedPost.title` (migration `20261026180000_feed_post_title`), obligatoire pour une nouvelle
  publication, absent pour une réponse ; les anciennes publications s'affichent sans titre.
- Limites (`src/server/services/feed-limits.ts`) : `FEED_TITLE_MAX = 60`, `FEED_BODY_MAX = 160`
  (60 + 160 = 220, `FEED_POST_MAX`), schéma Zod `postTextSchema` partagé par le téléphone et le serveur.
  L'ancienne constante des réponses (2 000) s'appelle maintenant `FEED_REPLY_MAX`.
- Carte du Fil (`PostCard`) : auteur en haut (avatar 44 px, anneau Lime pour une entreprise vérifiée,
  ligne métier ou entreprise · ville · heure, « … »), puis titre (2 lignes), texte et image (280 px,
  coins 30 px) alignés sur le nom. Encoche en bas à gauche : J'aime · Commenter · Envoyer · Enregistrer ;
  réactions (deux visages + nombre) en bas à droite. Sans image, les actions passent sous le texte.
  « Envoyer » ouvre la feuille « Partager » (Republier · Citer · Envoyer à une connexion) : republier
  reste possible sans bouton dédié sur la carte. Le nombre de commentaires remplace l'aperçu de la
  première réponse.
- Écran Publier (talent et recruteur) : Titre avec compteur `n/60`, Texte avec compteur `n/160`, jauge et
  aide (« Encore un peu » sous 90, « Bonne longueur » jusqu'à 150, « Presque au maximum » au-delà),
  image en tuile (« + » pour en choisir une), aperçu dans le Fil, bouton Publier. Le recruteur garde
  « Publier en tant que » et « Joindre » une offre ou un événement ; la photo n'est plus un type à part.
- Démo : les six publications du seed ont un titre.
- Le Fil n'existe aujourd'hui que sur le téléphone : la carte servira telle quelle au Fil web du
  recruteur (lot N2 de `docs/decisions/2026-10-26-modele-b-web-recruteur.md`).

## Fil, menu, publication · 3/3 : Explorer, recherche compacte et filtres (26 octobre 2026)

Référence : brief `docs/fil-menu-publication/`, § 3, maquette `Explorer.dc.html`.

- Recherche compacte (44 px, Sapin, liseré et loupe Lime, « Rechercher ») et bouton **Filtres** Lime
  sur la même ligne, avec la pastille du nombre de filtres actifs ; « Annuler » le remplace pendant une
  recherche. La rangée Tout · Offres · Entreprises · Personnes sous la recherche est supprimée : la
  portée se choisit dans la feuille de filtres (« Chercher dans »).
- Pastilles d'Explorer (domaines, secteurs, types de la recherche) : 32 px, 12,5 px, Lime et texte
  Sapin quand actives, transparentes sinon ; plus de pastille blanche.
- Feuille de filtres (`src/components/phone/explorer/filters.tsx`) : monte en 0,42 s sur un voile
  sombre, poignée, « Effacer », groupes Contrat (CDI · CDD · Stage), Salaire mensuel (4 tranches et
  barre), Secteur (8), Résidence (RDC · Autre pays · Partout). Les groupes hors portée se replient
  (hauteur, opacité, glissement), sans animation si l'utilisateur réduit les animations.
- Filtres côté serveur (`src/server/services/explore-filters.ts`, `explorerHome(…, filters)`,
  `explorerCount`, action `exploreFilterAction`) : « Voir N résultats » compte les offres, entreprises
  et personnes de la portée ; « Voir » lit les listes filtrées. Une offre sans salaire n'entre dans
  aucune tranche. Le secteur des entreprises est un texte libre : il rejoint un secteur du filtre par
  mots (« Banque et microfinance » → Banque). La résidence est le pays du profil (`User.country`),
  jamais la nationalité.
- Aucun filtre par genre, âge ou nationalité (règle d'or 4) ; les filtres ne changent que l'affichage,
  jamais une candidature (règle d'or 1).
- Tests : `tests/unit/explore-filters.test.ts`, `tests/db/explore.test.ts` (filtres en base),
  e2e `modele-b-explorer` (ouvrir, choisir la portée, appliquer CDI, effacer).

## Profil d'une personne : connexion et vue recruteur (26 octobre 2026)

Référence : brief `docs/profil-personne/`, maquette `Profil.dc.html` (réglages `qui`, `vue`, `onglet`,
`pourquoi`), captures 01 à 07. Remplace la page Personne du Modèle B (l'ancien composant
`explorer/person.tsx` est supprimé).

- En-tête compact (`src/components/phone/profil/profile.tsx`) : barre Retour · « Profil » ou
  « Candidat » · Partager · « ··· », bannière 4:1 (image choisie ou motif dans la couleur du domaine,
  étiquette du domaine), photo 76 px avec l'anneau des 5 premières compétences et le point menthe
  « Actif maintenant », réseaux 32 px (seulement ceux remplis), nom + badge vérifié ou « Non vérifié »,
  alias, drapeau (code ISO de `User.country`, sans image externe) + ville + heure locale, bio,
  pastilles (connexions, domaine, contrat cherché, activité), connexions en commun.
- Vue connexion : « Se connecter » → « Demande envoyée » → « Connectés » ; « Chat » seulement une fois
  connectés.
- Onglets Publications · À propos · Réalisations · Portfolio : pilule Lime qui glisse (0,38 s), collés
  en haut, contenu qui glisse. Compétences en couleur (couleur stable tirée du nom,
  `src/lib/profile-colors.ts`), barre des familles (catégorie des compétences), frise des expériences
  (un point par ligne de `Experience.description`, deux visibles puis « Voir N de plus »),
  formation, langues (5 traits). Réalisations = projets visibles + attestations montrées sur le
  profil ; Portfolio = PDF et liens des projets, CV de la candidature (vue recruteur), page publique.
- Vue recruteur : le candidat s'ouvre sur son profil avec la carte (anneau du score, offre, date,
  étape, « Pourquoi N % ? », « Avancer », Chat). « Avancer » passe à l'étape suivante (geste du
  recruteur ; vers « Retenue », la feuille « Recruter » s'ouvre). La feuille « Pourquoi ? » reprend les
  critères du calcul fixe et la mention « Calculé sans le nom, la photo, l'âge, le genre ni la
  nationalité… aucune candidature n'est écartée automatiquement ». La consultation reste journalisée
  (`recordView`).
- Données : `TalentProfile.handle` (unique), `socialLinks` (validés par Zod, `src/lib/social-links.ts`),
  `showEmail` (désactivé par défaut) ; « Modifier le profil » permet de les remplir.
- Tests : `tests/unit/profil-personne.test.ts`, `tests/db/explore.test.ts`, e2e `modele-b-explorer`
  et `modele-b-recruteur-candidatures`. Décision : `docs/decisions/2026-10-26-profil-personne.md`.

## Carrière v3 : page Carrière et création d'un CV au téléphone (26 octobre 2026)

Référence : brief `docs/carriere-v3/BRIEF-CARRIERE-CLAUDE-CODE.md`, captures 01 à 15 et maquettes
(validées par Ephraïm le 26/10/2026). Remplace la page Carrière et les écrans CV du Modèle B au téléphone ;
l'ordinateur garde « CV et documents » et le studio.

- Page Carrière (`src/components/phone/career/home.tsx`, feuille `src/styles/phone-carriere.css`,
  classes `nb-cr-`) : en-tête Carrière avec recherche et réglages, bannière et photo avec crayons,
  réseaux, disponibilité (« À l'écoute des offres » / « Pas disponible », changée d'un geste),
  complétion avec la prochaine action, suggestion de compétence, Modifier · Partager · Voir comme les
  autres (`/app/personnes/[moi]?apercu=1`), identité repliée au-dessus des onglets, pilule Lime qui
  glisse sous Profil · CV · Portfolio · Progression · Candidatures. CV avec score, date et menu ;
  portfolio en grille ; progression en frise ; candidatures avec score, frise d'étapes et entretien.
- Créer un CV (`/app/career/cv/nouveau?etape=`, `src/components/phone/cv/`, feuille
  `src/styles/phone-cv.css`, classes `nb-cv-`) : départ (Orbi le prépare, un modèle, un import), choix
  du modèle (filtres, verrou avec le forfait lu en base, vue en grand), Orbi qui prépare (modèle
  Moderne, résumé proposé en attente de validation), import d'un PDF, d'un Word ou d'une photo (lue
  par l'IA seulement si l'IA est prête, consentement, droit et quota vérifiés, journalisée), « Voici
  ce qu'Orbi a trouvé » (rien n'entre dans le profil sans être coché).
- Les quatre étapes d'un CV (`/app/career/cv/[id]?etape=modele|contenu|style|apercu`) : contenu
  (sections glissées ou déplacées au clavier, affichées ou non, résumé écrit ou réécrit par Orbi,
  gardé ou refusé), mise en forme (le CV change en direct : couleur, police, densité, photo, langue
  des titres), aperçu (score à règles fixes avec « Pourquoi ? », huit vérifications dont
  « Corriger » qui reprend seulement ce qui est dans le profil, nom, CV principal, PDF, Word, adapter à
  une offre).
- Services : `cvChecks` (`cv-coach.ts`), langues et coordonnées lues à l'import (`cv-import.ts`),
  `importCvPhoto`, image dans le fournisseur d'IA. Actions : `src/server/actions/cv-flow.ts`.
- Anciennes adresses au téléphone : `/app/career/cv/modeles` et `/app/profil/import` mènent au nouveau
  parcours.
- Tests : `tests/unit/intelligence.test.ts` (vérifications), e2e `carriere-v3`, `mobile-profil-cv`,
  `intelligence`, `cv-documents`, `modele-b-carriere` mis à jour.
- Restent à faire : les éditeurs de section (`?partie=`) gardent l'ancien écran ; projets, bénévolat
  et certificats ne sont pas des sections du CV. Décision : `docs/decisions/2026-10-26-carriere-v3.md`.

## Chat du talent : liste, discussion, menu ··· et appel vidéo (27 octobre 2026)

Le Chat du talent au téléphone refait d'après `docs/chat-v2/` (captures 01 à 13, maquettes
`Chat*.dc.html`, validées par Ephraïm le 27/10/2026). Remplace l'apparence des écrans Messages du
Modèle B ; feuille `src/styles/phone-chat.css`, classes `nb-ch-`, textes `phoneChat.*`.

- Liste : « Chat », en ligne maintenant (anneau aux couleurs des compétences, point menthe), carte
  « Orbi résume » (fonction d'IA `chat_summary`), segment Tout · Connexions · Recruteurs · Entreprises
  avec pilule Lime glissante et compteurs, demandes de connexion, lignes avec étiquette de rôle,
  coche « lu », « écrit… » en temps réel, discussions épinglées en tête.
- Discussion : en-tête flouté (statut en ligne ou « écrit… », appel vidéo, ···), candidature épinglée
  (offre, étape, score, « Voir »), séparateurs de jour, bulles Lime texte Sapin, carte Entretien
  (agenda avec rappels, S’entraîner), réponses suggérées par Orbi (un toucher envoie), réactions,
  « + » Joindre (six tuiles, attestations des formations), Orbi rédige (quatre tons, Envoyer, Autre
  version), note vocale avec onde.
- Menu ··· : fiche de la personne, profil, candidature, recherche, médias, notifications,
  épingler, Signaler (raison, puis signalement à la modération) et Bloquer avec confirmation.
- Appel vidéo : confirmation, plein écran (chiffré de bout en bout, sa vignette, onde Lime, minuteur
  menthe, micro, caméra, haut-parleur, raccrocher), « Appel terminé · durée » ; fournisseur factice.
- Base : migration `20261027060000_chat_v2` (`MessageReaction`, `VideoCall`, `pinnedAt`, `typingAt`).
  Services `chat.ts`, `chat-summary.ts`, `video-call.ts` ; actions `src/server/actions/chat.ts` ;
  route `/app/messages/pouls`.
- Tests : `tests/unit/chat-v2.test.ts`, `tests/db/chat-v2.test.ts`, e2e `chat-v2.spec.ts` (ouvrir,
  réponse suggérée, réaction, appel) ; `modele-b-messages`, `hire`, `hire-advanced`,
  `modele-b-plein-ecran` mis à jour.
- Décisions : `docs/decisions/2026-10-27-chat-v2.md`. Reste à choisir : un vrai fournisseur d'appel
  vidéo.

## Explorer · corrections d'Ephraïm (27 octobre 2026)

- Avatar de l'en-tête à 28 px, comme dans le Fil et à la taille de l'icône Enregistrées.
- Rubriques gardées : « Offres pour vous », « Entreprises qui recrutent », « Personnes à connaître » ;
  « Nouvelles cette semaine » retirée de l'accueil d'Explorer (la page `/app/explorer/nouvelles`
  reste). Titres de rubrique à 16 px au lieu de 19 px.
- Fond de l'onglet Explorer : le même que Fil, Carrière et les autres onglets (`--nb-nuit`), au lieu
  du noir plus profond.

## Onglets du téléphone · un seul en-tête et un seul style d'onglets (27 octobre 2026)

Demande d'Ephraïm : chaque titre de page doit se ressembler (taille, position), les options et les
couleurs aussi.

- Nouvelle feuille `src/styles/phone-onglets.css` (importée en dernier) et classe `nb-tete-onglet`
  pour l'en-tête des cinq onglets (Fil, Explorer, Carrière, Hub, Chat) : titre à gauche, 28 px, même
  hauteur ; à droite, boutons ronds de 44 px (fond surface, liseré fin) et photo de 36 px.
- Explorer : le titre passe à gauche comme ailleurs ; Enregistrées et la photo sont à droite.
- Chat : le bouton « Nouveau message » prend la même couleur que les autres boutons ronds.
- Onglets : Fil et Hub passent des onglets soulignés aux pastilles (comme Carrière et Chat), même
  hauteur (40 px), même texte (13 px) et mêmes couleurs (Lime et texte Sapin quand choisi).
- Les anciennes règles d'en-tête propres à chaque écran sont retirées.

## Correctif : Chat sans mise en forme sur jumanly.io (27 octobre 2026)

Après la mise en ligne, un téléphone resté ouvert affichait le nouveau Chat avec l'ancienne
feuille de style globale (texte brut, onglets collés). Les styles du Chat sont maintenant chargés
avec ses composants (`parts.tsx`) et non plus par `globals.css`. Vérifié : lint, types, build,
e2e `chat-v2` et `modele-b-messages` (téléphone), feuille du Chat chargée à part sur
`/app/messages`.

## Espace recruteur au téléphone · même identité que l'espace talent (27 octobre 2026)

Demande d'Ephraïm : le Fil du recruteur identique à celui des talents, et Offres, Messages, son
profil et les candidats dans la même identité visuelle.

- En-tête des cinq onglets recruteur : la classe commune `nb-tete-onglet` (titre 28 px à gauche,
  boutons ronds identiques, « + » de la même couleur que les autres). L'onglet Messages s'intitule
  « Chat », comme dans la barre.
- Fil : même ordre et mêmes éléments que chez un talent (onglets en pastilles, puis la ligne
  « Publier » avec le nom) ; « Publier au nom de… » reste en dessous. La recherche du Fil est
  retirée, comme chez un talent.
- Offres, Candidatures, Talents : la loupe devient une barre de recherche visible, au style
  d'Explorer ; toucher la barre ouvre les mêmes options (« Rechercher dans », recherches récentes).
- Pastilles : vues de Candidatures et de Talents, onglets Candidats · Réseau · Équipe du Chat, filtres
  d'offres et choix de portée passent au Lime avec texte Sapin quand ils sont choisis.
- « Mon profil recruteur » prend la mise en page du profil d'une personne (`docs/profil-personne`) :
  barre, bannière, photo cerclée, nom, poste et entreprise, puces, sections ; pas de portfolio.
  La vue candidat (profil d'une personne) était déjà au nouveau style.
- Vérifié : lint, types, tests (413), tests en base (367), build, e2e recruteur au téléphone
  (18 sur 18). Captures : `/mnt/project-files/captures/recruteur-harmonise/`.
- Correctif : `phone-onglets.css` n'est plus importé par `globals.css` mais par les écrans qui
  l'utilisent (Fil, Explorer, Carrière, Hub, Chat, onglets recruteur, profil recruteur). Comme pour
  le Chat (#173), un téléphone resté ouvert pendant une mise en ligne gardait l'ancienne feuille
  globale et ne voyait pas les nouveaux en-têtes.

## Carrière v3 : fin de la création d'un CV (27 octobre 2026)

Demande d'Ephraïm : le PDF téléchargé ne contenait que le haut du CV, « juste le logo ».

- Cause : un CV encore vide (profil vide à sa création) montrait à l'aperçu un CV d'exemple rempli,
  mais le PDF imprimait le vrai CV, presque vide. Désormais l'aperçu le dit (« l'aperçu montre un
  exemple »), propose « Reprendre mon profil » ou « Écrire le contenu », et le téléchargement reste
  fermé tant que le CV est vide. Le PDF est récupéré par le navigateur puis enregistré, avec un
  message clair en cas d'échec.
- « Ajouter à mon profil » (Aperçu) : ce que le CV contient et que le profil n'a pas encore
  (titre, résumé, expériences datées, formations, compétences du référentiel, langues), après une
  feuille qui montre ce qui sera ajouté. Rien n'est remplacé (`src/server/services/cv-to-profile.ts`).
- « Terminer » ramène à Carrière (onglet CV). Créer un CV remplace l'adresse au lieu de l'empiler :
  « Retour » depuis Contenu ne repasse plus par le choix du modèle (qui recréait un CV).
- Import : « Garder seulement ce CV » garde le CV importé dans « Mes CV » tel qu'il a été lu, sans
  toucher au profil ; son nom est celui du fichier.
- « Adapter à une offre » vérifié au téléphone.
- Tests : `tests/unit/cv-to-profile.test.ts`, e2e `carriere-v3` (CV vide, PDF lu avec pdftotext,
  ajout au profil, Terminer, import gardé), `mobile-profil-cv`.
## Carrière · « À propos » et photo vue en grand (27 octobre 2026)

- Demande d'Ephraïm : une présentation (titre + texte de 400 caractères) avant les compétences, et la photo de profil qu'on touche pour l'agrandir devant un fond flouté, la modifier, la recadrer ou revenir aux initiales.
- Nouveau champ `TalentProfile.aboutTitle` (migration `20261027170000_profile_about_title`) ; le texte reste `summary`. La page « À propos » du téléphone limite le texte à 400 caractères (un texte plus ancien et plus long reste affiché, il faut le raccourcir pour enregistrer). « Modifier le profil » renvoie vers cette page au lieu de garder son propre champ « Bio ».
- La carte « À propos » s'affiche avant les compétences dans Carrière (onglet Profil) et dans l'onglet « À propos » du profil vu par les autres ; la ligne sous le nom montre désormais le titre professionnel.
- Photo : `src/components/phone/career/photo-viewer.tsx` (un `<dialog>` dont le fond est flouté), styles dans `src/styles/phone-apropos.css`, importés par les composants.
- Publié sans attendre la vérification complète, à la demande d'Ephraïm (seuls la compilation et ESLint ont tourné).


## Confirmation de l'e-mail par un lien, accueil Talent / Recruteur (27 octobre 2026)

Demande d'Ephraïm : le code à 6 chiffres rendait l'inscription lente ; l'accueil doit toujours
proposer le type d'utilisateur et « S'inscrire » / « Se connecter ».

- Inscription (talent, recruteur, administrateur d'entreprise) : un e-mail « Confirmer mon
  adresse » remplace le code. Le lien (valable 24 heures) confirme l'adresse et ouvre Jumanly
  connecté, sur le téléphone ou l'ordinateur où il est ouvert (`emailVerification` de Better Auth,
  `src/app/(auth)/(acces)/inscription/confirmee/route.ts`). La suite (premières questions,
  paiement d'un forfait d'organisation, rôle de l'administrateur) est lue sur le compte, pas sur
  le cookie d'inscription, pour marcher d'un appareil à l'autre. L'e-mail de bienvenue part une
  fois, à la confirmation (`src/server/services/signup-confirmation.ts`).
- Écran « Ouvrez votre boîte mail » : renvoyer le lien, changer d'adresse, « Déjà confirmé ? Se
  connecter ». Lien expiré : message et nouveau lien. Une connexion avec une adresse non confirmée
  renvoie un lien. L'administration renvoie aussi un lien.
- Les codes restent pour « Mot de passe oublié » et la vérification en deux étapes.
- Sans fournisseur d'e-mail, le journal « [e-mail factice] » affiche le lien en clair.
- Retouches le même jour (demande d'Ephraïm) : le site public garde ses boutons d'origine ; le
  choix Talent / Recruteur et « S'inscrire » / « Se connecter » sont sur la page de connexion
  (téléphone et ordinateur) et sur l'écran Bienvenue du téléphone. Bienvenue : l'image ne couvre
  plus le texte (colonne, illustration réduite sur les petits écrans) et les trois écrans défilent
  seuls toutes les 4,5 s, jusqu'à ce qu'on touche un point ou l'image (pas en animations réduites).
- Tests : `tests/unit/signup-confirmation.test.ts`, e2e d'inscription passés au lien
  (`openConfirmationLink`), accueil (`foundation`, `modele-b-accueil`).
## Carrière · importer un CV : trois choix, et lire ses CV dans l'appli (27 octobre 2026)

Demande d'Ephraïm : un CV importé doit pouvoir être gardé, servir à remplir le profil, ou servir à
créer un autre CV ; un CV de la bibliothèque se lit dans l'appli, se ferme pour revenir à la
bibliothèque, et se supprime.

- « Voici ce qu'Orbi a trouvé » propose trois choix : « Garder mon CV » (le fichier tel quel dans
  « Mes CV »), « Remplir mon profil avec ce CV » (Orbi range les groupes cochés dans le profil, le
  CV est aussi gardé) et « Créer un nouveau CV avec ces informations » (choix du modèle, puis
  Contenu, Mise en forme, Aperçu ; le PDF est ce CV).
- Le fichier d'origine est gardé (stockage privé) et sert aussi aux candidatures : le recruteur
  reçoit le fichier importé.
- Nouvel écran « Lire » (`/app/career/cv/[id]/lire`) : PDF dessiné page par page, photo, ou mise en
  page pour un fichier Word et un CV fait sur Jumanly ; Télécharger, Utiliser par défaut pour
  postuler, Modifier (ou « En faire un CV modifiable »), Supprimer. « Fermer » revient à « Mes CV ».
  Les cartes de la bibliothèque ouvrent cet écran.
- Tests e2e `carriere-v3` : les trois choix, lecture du PDF, téléchargement, fermeture, suppression,
  PDF du nouveau CV.

## Profil du recruteur à l'identité du profil talent, photo agrandie pour les visiteurs (27 octobre 2026)

- Demande d'Ephraïm : un visiteur touche la photo d'un profil et elle s'agrandit devant l'écran flouté, sans pouvoir la modifier. Le profil d'un recruteur reprend l'identité du profil talent, vu par les autres comme par lui-même.
- La photo agrandie est partagée (`src/components/phone/profil/photo-viewer.tsx`, option `editable`). On ne peut la modifier que sur son propre profil (Carrière, ou « Mon profil » du recruteur).
- Le profil d'un recruteur s'ouvre à tous les membres sur `/app/personnes/[id]`. Il montre la bannière, la photo à anneau, les réseaux, le nom, le poste chez l'organisation, la bio, le drapeau, les connexions, « Recrute en ce moment », le nombre d'offres en cours et les publications. L'onglet « À propos » contient le titre et le texte, le candidat recherché (nouveau champ `RecruiterProfile.seeking`), l'expérience, la formation et les langues. Il y a aussi un onglet « Réalisations », mais pas de portfolio.
- « Mon profil » du recruteur (`/app/hire/compte/profil`, téléphone) utilise le même composant `PersonProfile`, avec `own`. Chaque section a son crayon, et l'onglet « Suivi » sert de tableau de bord : offres en cours, candidatures reçues, nouvelles à lire, statistiques, offres et contacts.
- Décision : les sections personnelles du recruteur (À propos, expérience, formation, langues, réalisations, bannière, réseaux) sont rangées dans un `TalentProfile`, qui reste privé (`visibility = private`). Le recruteur n'apparaît donc jamais dans les recherches de talents, et on réutilise les formulaires de Carrière. « Modifier le profil » cache le titre et la disponibilité du talent pour un recruteur ; ces réglages sont dans « Recrutement ».
- Limite : ajouter une réalisation suit le droit `portfolio` du compte, comme pour un talent.
- Publié avec le contrôle rapide seulement (tsc, ESLint, tests en base de l'Explorer), à la demande d'Ephraïm.

## 27/10/2026 · Fil : publications réordonnées, commentaires visibles, modifier et supprimer

- Une publication du Fil (talent, recruteur, entreprise) montre maintenant : l'avatar carré arrondi, le nom, l'heure et la ville ; le titre et le texte sur toute la largeur ; la photo à son format, coins arrondis (comme Instagram, jusqu'au portrait 4:5) ; puis Commenter · J'aime à gauche et Enregistrer à droite. L'encoche sur la photo disparaît. « Partager » passe dans le menu « ··· ».
- Les deux derniers commentaires s'affichent sous chaque publication, avec « Voir les N commentaires ».
- L'auteur d'un commentaire peut le modifier ou le supprimer (« ··· » à côté de son nom). L'auteur d'une publication peut la modifier (titre et texte) ou la supprimer, y compris une publication faite au nom de son entreprise. Une publication ou un commentaire modifié affiche « modifié » (nouveau champ `FeedPost.editedAt`).
- La ville d'une personne vient de `User.city`.
- Publié avec le contrôle rapide seulement (tsc, ESLint), à la demande d'Ephraïm.

## 27/10/2026 · Page d'une entreprise au téléphone, dans l'identité du profil

- Demande d'Ephraïm : la page d'une entreprise (vue par tous et par ses administrateurs) reprend l'identité du profil talent ou recruteur au téléphone.
- Tête : bannière (image ou couleur choisie à l'inscription), logo carré à coins arrondis, réseaux sociaux (LinkedIn, Instagram, Facebook, X, site), nom et badge vérifié, @identifiant, siège avec son drapeau (« 🇨🇩 Kinshasa, RD Congo ») ou « International », première phrase de la présentation, puces abonnés · offres ouvertes · employés · « Recrute en ce moment ». Boutons : « Suivre » et « Partager » pour un visiteur ; « Modifier » et « Publier » pour un administrateur.
- Onglets : Publications (ouvert d'abord) · À propos (qui sommes-nous, puis en bref : création et années d'existence, employés, siège, sur Jumanly depuis ; domaines ; liens) · Offres · Membres.
- Membres : seulement les recruteurs de l'entreprise (responsable de la page, administrateurs, recruteurs), le responsable en premier, chacun cliquable vers son profil par n'importe qui. Les managers, lecteurs et personnes qui se déclarent employées n'y sont plus. Un recruteur sans profil recruteur rempli a quand même sa page (`recruiterBlock`).
- Nouveaux champs `Organization.foundedYear`, `international`, `socialLinks`, modifiés dans « Profil de l'entreprise » au téléphone avec le pays du siège. Le formulaire de l'ordinateur ne les envoie pas : ils restent tels quels quand il enregistre.
- Domaines : le champ Secteur, séparé par des virgules.
- Publié avec le contrôle rapide seulement (tsc, ESLint), à la demande d'Ephraïm.

## 27/10/2026 · Compétences libres, niveau des langues, diagnostic lié au métier

- Retours d'une utilisatrice transmis par Ephraïm, quatre points corrigés.
- Compétences : quand la liste n'a pas la compétence cherchée, on peut l'ajouter telle qu'elle est écrite (feuille « Ajouter des compétences » du téléphone et écran « Ajouter une compétence » de l'ordinateur). Elle est créée dans `Skill` avec la catégorie `custom` (`findOrCreateSkill`), réutilisée si une autre personne tape le même nom, mais jamais proposée dans les recherches des autres.
- Langues (téléphone) : chaque langue cochée demande son niveau (Débutant, Intermédiaire, Professionnel, Langue maternelle). Plus de « Professionnel » par défaut : on ne peut pas enregistrer sans niveau. « Notions » devient « Débutant » partout ; un ancien « Courant » reste affiché là où il avait été choisi.
- Diagnostic : nouvelle réponse « Aucun niveau · Je ne connais pas cette compétence » (niveau 0). Elle ne demande pas de preuve, compte 0 point comme « Notions » et n'amène pas la question de suivi « Pouvez-vous le prouver ? ».
- Diagnostic : les compétences évaluées sont d'abord les compétences clés du métier visé (familles de métiers, `src/server/services/job-families.ts` : social media, marketing digital, communication, data, finance, RH…), puis celles des offres proches. Les mots trop vagues d'un titre (« manager », « assistant », « chargé »…) ne servent plus à trouver les offres proches. Un métier qui ne correspond à rien ne reçoit plus les compétences de toutes les offres (Power BI, SQL…) : le diagnostic évalue les compétences que la personne a citées. Deux compétences ajoutées au référentiel : « Planification éditoriale », « Analyse des performances ».
- Publié avec le contrôle rapide seulement (tsc, ESLint, compilation), à la demande d'Ephraïm.

## 2026-10-27 · Tout le monde se retrouve dans Explorer

- Recherche d'Explorer (talent et recruteur) : on trouve désormais chaque membre dès son inscription, talents et recruteurs, par son nom, son titre ou son poste de recruteur. Avant, seuls les profils « Visible des recruteurs » apparaissaient, alors que tout nouveau compte est « Privé » par défaut.
- Choix respectés : un profil « Anonyme » n'apparaît jamais par son nom (le talent a choisi de masquer son nom) ; un compte suspendu ou supprimé n'apparaît pas ; une personne bloquée non plus. « Privé » garde le talent hors du vivier des recruteurs, pas hors d'Explorer : sa page s'ouvre avec seulement son nom, sa photo, son titre et sa ville tant que les deux ne sont pas en relation.
- Entreprises : la recherche trouve toutes les organisations par leur nom, qu'elles recrutent ou non (avant, seulement celles avec une offre ouverte). Celles qui recrutent passent en premier.
- « Personnes à connaître », le compteur des filtres et les demandes de mise en relation suivent la même règle.
- Publié avec le contrôle rapide seulement (tsc, ESLint), à la demande d'Ephraïm.
