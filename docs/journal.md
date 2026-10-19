# Journal du projet

Une entrée par étape : ce qui a été fait, les décisions prises, les dettes à rembourser.

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
