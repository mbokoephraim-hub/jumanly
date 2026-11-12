# MVP web recruteur · état des lieux (lot M-00)

Relevé du 12/11/2026, sur `main` après la PR #410 et le brief (commit `d6e708e`). Méthode : lecture du
code et du schéma, puis parcours de l'application avec le seed de démo (`entreprise@jumanly.test`,
ordinateur 1440 px ; page d'offre et page entreprise au téléphone 390 px, déconnecté).

Légende : **Fait** (rien à faire, sinon vérifier), **À ajuster** (la base existe, il faut la
compléter), **À construire** (rien d'utilisable dans le dépôt). Cette liste pilote les lots M0 à M9 ;
chaque lot la met à jour.

## Constats qui changent le plan

1. **Personne ne peut postuler depuis le site public aujourd'hui.** Tant que
   `NEXT_PUBLIC_SIGNUP_OPEN` n'est pas à `1`, « Postuler gratuitement » sur `/offres/[slug]` mène à la
   liste d'attente (`joinHref`, `src/lib/signup.ts`). Vérifié au téléphone sur
   `/offres/ux-conseiller-clientele-kinshasa`. La candidature express (M2) devra passer outre la
   liste d'attente, et l'inscription entreprise aussi (M1/M3), sinon le MVP ne peut pas vendre.
2. **La durée d'abonnement est toujours d'un mois.** `Plan.interval` existe (texte, défaut `month`)
   et l'admin affiche déjà « année », mais le devis et le paiement calculent `addMonths(start, 1)`
   quel que soit l'intervalle (`src/server/services/subscriptions.ts`). Les rappels de facturation
   sont à J-7, J-3, J-0 (`reminderStep`, `billing-jobs.ts`), pas J-30, J-7, J-1. À traiter en M1.
3. **Le glisser-déposer en colonnes sur ordinateur n'existe plus.** L'ancien tableau
   (`src/components/hire/pipeline-board.tsx`, lot 11) a été retiré avec le passage au Modèle B. Sur
   ordinateur il reste la vue tableau triable (`/app/hire/offres/[id]/tableau`) et, comme au
   téléphone, le rangement des cartes par appui long (`candidats-ordre.tsx`) et le balayage
   Retenir / En attente (`tri-client.tsx`). La vue colonnes (avec clavier) est donc à construire en M4.
4. **Il n'y a qu'un seul cron.** `vercel.json` appelle `/api/jobs/billing` toutes les heures ; toutes
   les tâches de fond y sont regroupées (facturation, e-mails de décision, `runHireJobs`). M7 ajoute
   `/api/jobs/hire-automation` toutes les 15 minutes, comme prévu.
5. **Le délai d'annulation d'une décision est de 10 minutes**, pas 24 h
   (`deliverDueDecisionMails`, `src/server/application-events.ts`). M7 le porte à 24 h pour le refus.

## Briques du MVP (tableau du § 2 corrigé)

| # | Brique | État réel | Fichiers |
|---|---|---|---|
| 1 | Espace entreprise et équipe | Fait | `src/app/(auth)/(entreprise)/inscription/entreprise`, `admin-signup.ts`, `org-team.ts`, `org-join.ts`, `/app/organisation/*` |
| 2 | Offres, page carrière, partage | À ajuster : copier le lien, Fil et WhatsApp existent dans le menu de l'offre ; pas de LinkedIn, pas de source, QR seulement dans la fiche PDF | `offre-actions.tsx`, `job-sheet.ts`, `/entreprises/[slug]`, `/offres/[slug]` |
| 3 | Candidature express | À construire ; aujourd'hui « Postuler » mène à la liste d'attente (constat 1) ou à l'inscription talent | `/offres/[slug]/page.tsx`, `src/lib/signup.ts` |
| 4 | Short-list Orbi expliquée | Fait ; les trois familles existent dans les données (`criteria`, `knockouts`, `missingSkills`) mais pas sous les libellés « Correspond / À vérifier / Manque » partout | `hire-classes.ts`, `hire-scores.ts`, `hire-tri.ts`, `matching/types.ts` |
| 5 | Pipeline ATS | À ajuster : étapes, notes, évaluations, vue tableau faites ; colonnes glisser-déposer à refaire (constat 3) | `hire-ats.ts`, `hire-candidates.ts`, `hire-evaluation.ts`, `offres/[id]/tableau` |
| 6 | Tests de compétences | À construire (seuls `Quiz` / `QuizAttempt` de Learn) ; l'étape `test` existe déjà dans `StageKind` | `prisma/schema.prisma` |
| 7 | Agenda connecté et réservation | À ajuster / construire : le recruteur propose 1 à 3 créneaux, le candidat en choisit un ou en propose d'autres, l'occupation de l'équipe est lue dans les entretiens Jumanly, `.ics` ; aucune connexion Google / Outlook | `interviews.ts`, `hire-interviews.ts` (`plannerData`), `suivi.ts` (`.ics`) |
| 8 | Suivi automatique | À ajuster : déjà accusé de réception automatique, e-mails de décision différés, relances des pièces (5 jours, 2 relances), rappel d'entretien J-1 (notification), résumé quotidien, rappels de fin d'offre ; pas de règles réglables par l'entreprise | `application-events.ts`, `hire-jobs.ts`, `hire-verification.ts`, `interview-reminders.ts`, `application-digest.ts`, `job-reminders.ts` |
| 9 | Vivier automatique | À ajuster : viviers manuels (`TalentPool`, onglet Vivier de Talents) ; pas d'entrée automatique, pas de consentement | `talent-search.ts`, `/app/hire/talents?onglet=vivier` |
| 10 | Tableau de bord et rapports PDF | À ajuster : entonnoir, taux de passage, délai jusqu'à l'embauche, sources (direct, invitation, recherche) et PDF existent ; manquent tests, entretiens tenus, e-mails automatiques, sources de partage | `hire-reports.ts`, `hire-report-pdf.ts`, `/app/hire/rapports` |

## Critères d'acceptation, lot par lot

### M0 · Mode MVP

| Critère | État | Où |
|---|---|---|
| `PRODUCT_SCOPE` lu par une seule fonction `productScope()` | À construire | rien dans `src/` ni `.env.example` |
| Menu ordinateur Accueil · Offres · Candidats · Agenda · Vivier · Chat, puis Outils et Entreprise | À ajuster : menu actuel Fil · Offres · Agenda · Talents · Chat, Outils (Rapports, Modèles de messages), Entreprise (Équipe, Page entreprise, Formule et facturation, Journal, Réglages) | `src/components/phone/nav.tsx`, `outils-nav.tsx`, `src/app/app/layout.tsx` |
| Fil caché, accueil « À traiter » pleine largeur | À ajuster : `/app/hire` affiche déjà « À traiter » (`RhTodayRail`) à côté du Fil | `a-traiter.tsx` |
| Talents → Vivier (Découvrir, Propositions cachés) | À ajuster : onglets Découvrir · Vivier · Propositions · Réseau | `talents.tsx`, `/app/hire/viviers` redirige vers `?onglet=vivier` |
| Routes en veille : 307, retirées des menus, pied de page, plan du site, `llms.txt` | À construire | `src/proxy.ts`, `sitemap.ts`, `llms.txt/route.ts`, en-tête et pied publics |
| Site public recentré entreprises (accueil = recruteurs, `/tarifs` = formule annuelle) | À construire : l'accueil est « Learn. Grow. Connect. », `/tarifs` montre les formules talent et RH | `src/app/[locale]/(public)/page.tsx`, `tarifs`, `recruteurs` |
| Compte talent existant garde candidatures, messages, profil | À vérifier en M0 (pages `/app/jobs/candidatures`, `/app/suivi`, `/app/messages`, profil) | |
| `full` : rien ne change | Fait par défaut (aucun code de mode) | |

### M1 · Formule annuelle

| Critère | État | Où |
|---|---|---|
| `Plan.interval = year` pris en compte | À ajuster : champ et libellé admin existent, durée calculée sur 1 mois (constat 2) | `subscriptions.ts`, `forfaits-table.tsx` |
| Formule `hire_business` 490 000 centimes, publique, achetable | À construire | `prisma/seed/plans.ts` (Company 79,90, Company Plus 179,90, Company Premium sur devis) |
| Droits `hire.assessments`, `hire.calendar.sync`, `hire.automation`, `hire.pool.auto` | À construire | `prisma/seed/plans.ts` (droits `hire.*` actuels : ats.filters, collaboration, cv_analysis, matching, pipeline, scorecards, shortlist, talent_search, verification, workflows.custom…) |
| 5 sièges inclus, réglables dans l'admin | À ajuster : droit `org.seats` existe (1, 2, 3, 5, 15, contrat selon formule) | `plans.ts`, `org-team.ts`, `org-join.ts` |
| Paiement prépayé Mobile Money / carte, facture | Fait pour le mensuel | `subscriptions.ts`, `invoices.ts`, `org-billing.ts` |
| Rappels J-30, J-7, J-1 | À ajuster (J-7, J-3, J-0 aujourd'hui) | `billing-jobs.ts` |
| Délai de grâce puis droits gratuits, données gardées | Fait (`GRACE_DAYS`) | `billing-jobs.ts`, `entitlements/periods.ts` |
| « 4 900 USD / an, soit 408 USD par mois » | À construire | `/tarifs`, `/app/hire/compte/formule`, `/app/organisation/formule` |
| « Demander une facture pour virement » (e-mail à assistant@jumanly.io) | À construire | |
| Company, Company Plus, RH cachées du public en mode `hire` | À construire (`isPublic` existe) | |

### M2 · Candidature express

| Critère | État | Où |
|---|---|---|
| Formulaire sur la page d'offre (prénom, nom, e-mail, CV 5 Mo, 3 questions, case vivier, confidentialité) | À construire | `/offres/[slug]/page.tsx` (`directApply: false`) |
| Questions de l'offre (3 au plus) | À ajuster : `Job.screeningQuestions` et réponses existent ; vérifier la limite à 3 | `screening.ts` |
| E-mail avec lien qui crée un compte léger et valide la candidature | À ajuster : confirmation par lien et import de CV existent, pas reliés à une candidature | `signup-confirmation.ts`, `cv-import.ts`, `cv-to-profile.ts` |
| Non confirmée : relance à 48 h, invisible à 7 jours, effacée à 30 jours | À construire (pas de statut « non confirmée » dans `ApplicationStatus`) | `prisma/schema.prisma` |
| Personne connectée : un clic avec son CV Jumanly | Fait (parcours Postuler de `/app/jobs/[slug]?postuler=1`) | `src/app/app/jobs/[slug]` |
| Page de suivi candidat (statut, test, créneau, pièces, messages) | À ajuster : `/app/suivi` montre statut, entretiens, pièces ; pas de test | `suivi.ts`, `src/app/app/suivi` |
| Source `utm_source` enregistrée | À construire : `ApplicationSource` = direct, invitation, talent_search | `prisma/schema.prisma` |
| Moins de 2 min à 390 px en 3G, 200 Ko de JS | À mesurer en M2 | |

### M3 · Offres, page carrière et partage

| Critère | État | Où |
|---|---|---|
| Création par modèle | À construire : pas de modèles d'offre ; « Dupliquer » existe | `offre-actions.tsx`, `hire.ts` |
| Création par texte collé mis en forme par Orbi | À ajuster : « Rédiger avec Orbi » et « Orbi a lu la fiche » (missions) existent | `job-writer.ts`, `job-wizard.ts` |
| Panneau Partager : lien court, LinkedIn, WhatsApp, QR, source par lien | À ajuster : lien copié, Fil, WhatsApp ; pas de LinkedIn, pas de lien court, QR seulement dans la fiche PDF | `offre-actions.tsx`, `job-sheet.ts` (paquet `qrcode`) |
| Page carrière : logo, bannière, présentation, offres ouvertes | Fait | `/entreprises/[slug]/page.tsx` |
| Bouton « Rejoindre notre vivier » | À construire | idem |

### M4 · Short-list Orbi et pipeline

| Critère | État | Où |
|---|---|---|
| Étapes Reçue → Embauché / Refusé et 4 classes | Fait | `applications.ts` (`defaultStages`), `hire-classes.ts` |
| Étape facultative Test | À ajuster : `StageKind.test` existe, pas branché sur un test | |
| 3 familles de raisons « Correspond / À vérifier / Manque » | À ajuster (constat dans le tableau, brique 4) | `matching/types.ts`, `phoneRhFiche.eval.*` |
| Test et entretien évalué alimentent la note Confiance | À ajuster : Confiance lit preuves et vérification, pas encore test ni entretien | `hire-scores.ts` |
| Colonnes glisser-déposer avec clavier + vue tableau | Vue tableau faite ; colonnes à construire (constat 3) | `offres/[id]/tableau` |
| « Refusé » demande une confirmation humaine | Fait (décision confirmée, envoi différé) | `fiche-decision.tsx`, `application-events.ts` |
| Personne écarté ni caché par Orbi, « Pourquoi ? » partout | Fait | `hire-ats.ts`, textes `hireAts.why.*` |

### M5 · Tests de compétences

| Critère | État |
|---|---|
| Tables `SkillTest`, `SkillTestQuestion`, `SkillTestInvite`, `SkillTestAttempt` | À construire |
| Bibliothèque (Outils → Tests), Orbi propose les questions | À construire (journal `AiUsage` et `runAi` existent) |
| Rattacher à une offre (automatique, par étape, à la main) | À construire |
| Passage au téléphone sans compte, une tentative, chrono, reprise, temps supplémentaire | À construire |
| Correction automatique et manuelle, note proposée par Orbi | À construire |
| Résultat sur la fiche et la short-list, note Confiance, non passé = « À vérifier » | À construire |
| Isolation `organizationId` | À construire (même schéma que les autres services Hire) |

### M6 · Agenda connecté

| Critère | État | Où |
|---|---|---|
| Connexion Google Agenda et Outlook par membre, jetons chiffrés, interface `CalendarProvider` + `fake` | À construire ; seule la connexion Google / LinkedIn / Apple (identité) existe | `.env.example` (`GOOGLE_CLIENT_ID` de connexion) |
| Variables `GOOGLE_CALENDAR_*`, `MICROSOFT_*`, `CALENDAR_TOKEN_KEY` | À construire | |
| Créneaux libres communs à tous les participants | À ajuster : calculés aujourd'hui à partir des seuls entretiens Jumanly | `hire-interviews.ts` (`plannerData`, `busyByDay`) |
| Le candidat réserve lui-même, fuseau affiché, demande d'un autre moment | À ajuster : il choisit parmi 1 à 3 créneaux ou en propose (`proposedSlots`) | `interviews.ts` (`answerInterview`), `/app/suivi/entretiens` |
| Événement dans chaque agenda, Meet / Teams, `.ics`, rappels J-1 et H-1 | À ajuster : `.ics` fait ; rappel J-1 par notification ; ni H-1, ni agenda externe | `suivi.ts`, `interview-reminders.ts` |
| Sans agenda connecté, le fonctionnement actuel reste | Fait | |
| `AGENDA-VALIDATION.md` pour les consoles Google et Microsoft | À construire (à écrire tôt : validation de plusieurs semaines) | |

### M7 · Suivi automatique

| Critère | État | Où |
|---|---|---|
| Écran Outils → Suivi automatique, règles réglables, variables | À construire ; les modèles de messages existent (convocation, document, relance, acceptation, refus) | `message-templates.ts`, `/app/hire/modeles` |
| Accusé de réception immédiat | Fait (conversation + e-mail) | `onApplicationCreated` |
| Invitation et relances test J+2, J+4 | À construire (dépend de M5) | |
| Invitation et relance de réservation J+2 | À construire | |
| Rappels d'entretien J-1, H-1 | À ajuster (J-1 en notification seulement) | `interview-reminders.ts` |
| Relance des pièces 5 jours, 2 relances | Fait | `hire-verification.ts` |
| Refus seulement après geste humain, 24 h annulable | À ajuster (10 minutes aujourd'hui) | `application-events.ts` |
| Candidature non confirmée | À construire (M2) | |
| Équipe : sans action 3 jours, évaluation à H+24, offre sans candidature 7 jours | À ajuster : déjà rappel « À revoir » d'un candidat mis en attente, entretiens à évaluer listés dans « À traiter », rappels de fin d'offre ; les trois règles demandées sont à construire | `hire-review.ts`, `hire-interviews.ts` (`interviewsToEvaluate`), `job-reminders.ts` |
| Résumé quotidien à 8 h dans le fuseau du membre | À ajuster : un résumé à 7 h UTC pour tous | `application-digest.ts` |
| Cron 15 min `/api/jobs/hire-automation`, envoi réclamé une fois, `ApplicationEvent`, visible sur la fiche | À ajuster : mécanisme `once` / `JobRun` existe ; route et cron à créer | `billing-jobs.ts` (`once`), `vercel.json` |
| E-mails au nom de l'entreprise, réponse vers le Chat, sans téléphone | À vérifier sur les e-mails existants | `emails/` |

### M8 · Vivier automatique

| Critère | État |
|---|---|
| « Vivier de l'entreprise » par organisation | À construire (viviers manuels seulement) |
| Entrée automatique avec consentement, étiquettes | À construire (`TalentPoolEntry` n'a ni consentement, ni étiquettes, ni date d'expiration) |
| Correspondances à la publication, invitation groupée | À construire (le calcul déterministe `matching/` est réutilisable) |
| Recherche et filtres du Vivier | À ajuster (filtres de Talents réutilisables) |
| Retrait par la personne, 24 mois puis renouvellement | À construire |

### M9 · Tableau de bord, premiers pas, bilan

| Critère | État | Où |
|---|---|---|
| Candidatures par offre et par source, délai d'embauche, taux de passage | À ajuster : faits sauf sources de partage | `hire-reports.ts` |
| Tests, entretiens planifiés / tenus, e-mails automatiques | À construire | |
| Export PDF enrichi | À ajuster | `hire-report-pdf.ts` |
| Premiers pas (logo → collègue → agenda → offre → partage → test) | À construire (l'inscription recruteur et l'onboarding existent) | `recruiter-onboarding.ts` |
| e2e `mvp-recruteur.spec.ts` de bout en bout | À construire | `tests/e2e/` |

## Critères transverses

- Règles d'or : respectées dans l'existant parcouru (droits par clés, isolation par `organizationId`,
  aucun rejet par Orbi, textes dans `textes/`). La règle 1 est aujourd'hui contrariée en production
  par la liste d'attente (constat 1).
- Tests à 1440 et 1024 px pour le recruteur : les e2e recruteur actuels tournent surtout au format
  téléphone (`modele-b-recruteur-*`) ; les lots M0 à M9 ajoutent des tests ordinateur.
- Design : Modèle B recruteur en place sur ordinateur (PR #403 à #410).
