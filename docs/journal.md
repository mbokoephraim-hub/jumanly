# Journal du projet

Une entrée par étape : ce qui a été fait, les décisions prises, les dettes à rembourser.

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
