# Expérience mobile Talent et Jumanly AI · diagnostic et plan (prompt 0)

Date : 16 octobre 2026. Références : `CAHIER-DES-CHARGES-UX-MOBILE.md` et
`docs/jumanly-ai/CAHIER-DES-CHARGES-JUMANLY-AI.md` (font foi), `BRIEF-MOBILE-TALENT.md`,
`PROMPT-AMELIORE.md`, `docs/jumanly-ai/BRIEF-JUMANLY-AI.md`, maquettes `maquette/ecrans/01` à `56`.
Programme d'ensemble (avec recruteur mobile et magasins d'applications) : document « Jumanly Mobile ».

## 1. L'existant concerné

| Sujet | Où | État |
|---|---|---|
| Coquille connectée | `src/components/layout/app-shell.tsx` | En-tête Sapin + feuille Crème sur téléphone, rail d'icônes et barre `jm-topbar` sur ordinateur, pilule flottante (`data-autohide`) sur téléphone. |
| Liens par espace | `src/config/navigation.ts` | Talent : Accueil, Learn, Career, Jobs, Messages (5 dans la pilule). Hire et Partenaire : inchangés dans ce programme. |
| Sous-rubriques | `SectionNav`, `appSections()` dans `app-shell.tsx`, `src/config/section-navigation.ts` | Onglets horizontaux en haut de chaque section. |
| Menu de compte | `src/components/layout/account-menu.tsx` | `<details>` natif, tons light/dark/rail. |
| Barres d'action fixes | `jobs/[slug]/page.tsx` (346, 966), `career/cv/editor.tsx` (197) | Posées 72 px au-dessus de la pilule ; masquées à `lg` alors que la pilule l'est à `md` (trou entre 768 et 1024 px). |
| Composants | `src/components/ui` | `Button` (primary, secondary, tertiary, white, inverse, danger · sm, md, lg), `IconButton`, `Card`, `Badge`, `Drawer`, `Tabs`, toasts (`motion/toaster.tsx`). |
| Vitrine | `/dev/composants` | Existe (local et previews seulement). |
| Jetons | `src/styles/tokens.css`, `admin.css` (`--jm-degrade-rail-h`), `feedback.css` (`.jm-press`, `.jm-tap`), `motion.css` | Les dégradés de la maquette (`--g-principal`, `--g-accent`, `--g-aurore`, `--g-irise`) n'existent pas encore sous ce nom ; leurs couleurs sont déjà des jetons. |
| Icônes | `pnpm brand` → `src/components/brand/icon-paths.ts` | `diplome` existe ; `suivi` manque (à ajouter dans `ressources/icones/interface/`). |
| Accueil Talent | `src/app/app/page.tsx` (tableau de bord, 859 lignes) | À déplacer tel quel à `/app/tableau-de-bord`. |
| Objectif | `TalentProfile.goal` (6 valeurs, `src/lib/welcome.ts`), `/app/bienvenue` | Écran d'objectif déjà présent après l'inscription ; `homeFocus(goal)` à ajouter, sans migration. |
| Générique d'entrée | `AppIntroGate`, `AppIntro`, `src/lib/app-intro.ts` | Inchangé ; l'objectif s'affiche après lui. |
| Offres | `recommendedJobs` (`src/server/matching/service.ts`), `SavedJob`, `/app/jobs`, `/app/jobs/enregistrees`, `?postuler=1` | Réutilisés. |
| Candidatures | `Application` + `talentStatus()` (`services/applications.ts`) | Réutilisés ; pas de brouillon aujourd'hui. |
| Entretiens | `Interview` (`slots`, `proposedSlots`, statuts pending, confirmed, reschedule…), `services/interviews.ts` | Réutilisés. |
| Messages | `Conversation`, `Message` (`MessageKind` text, document_request, invitation, system) | `file`, `slot`, `decision` à ajouter. |
| IA | `runAi`, `aiReadiness`, `aiFeatures`, `AiUsage`, `AiSuggestion` + `decideSuggestion`, `cv-coach`, `learn-coach`, `job-writer`, `diagnostic-ai` | Réutilisés ; nouvelle clé `assistant` dans `aiFeatures`. |
| Consentements | `src/lib/consent.ts` (cookie : analytics, preferences) ; IA : `User.aiConsentAt` | Réutilisés pour `track()` et les recherches récentes. |

## 2. Déjà fait par les briefs précédents

Retour au toucher (`feedback.css`, `.jm-tap`), univers animés et animations réduites, Career v2 et éditeur
de CV v2, 15 modèles de CV, reprise des vidéos à la seconde (Learn v2 étape 3), parcours et domaines Learn,
écran de bienvenue avec objectif, recherche `/app/recherche`, cloche de notifications, PWA amorcée.

## 3. Composants à créer et à réutiliser

- **Créer** : variantes `accent`, `outline`, `link`, `ai` de `Button` et tailles L/M/S (en gardant les
  noms actuels comme alias pour ne rien casser) ; `Pressable` ; `AiChip`, `AiFab`, `AiPanel` ; `GoalCard`,
  `ProfileCard`, `VisualTile`, `AiBento`, `FileCard`, `SlotCard`, `DecisionCard` ; `BottomNav` (4
  destinations) ; `TopMenu` (menu de l'avatar) ; `BottomSheet` pour les filtres et les créneaux.
- **Réutiliser** : `Drawer`, `Tabs`, `Badge`, `JobCard`, `CourseCard`, `ProgressBar`, `EmptyState`,
  `showToast`, `Icon`, `SpaceSwitcher`, `NotificationBell`.

## 4. Données manquantes et migrations prévues

| Prompt | Migration | Contenu |
|---|---|---|
| 4 | `application_drafts` | `ApplicationDraft` (userId, jobId, étape, cvId, lettre, réponses, updatedAt), unique par personne et offre. |
| 5 | `message_kinds_file_slot_decision` | `MessageKind` + `file`, `slot`, `decision`. |
| 5 | `hire_message_templates` | `MessageTemplate` (organizationId, kind, title, body), filtré par organisation. |
| 7 | `assistant_conversations` | `AiConversation`, `AiMessage` (brief Jumanly AI § 2.3). |
| 9 | `interview_practice_notes` | Formulations gardées pendant les simulations, privées. |

Signalés, non créés (brief § 2.6) : questions du recruteur sur une offre, offres externes. L'étape
« Questions » est sautée et la mention « Sur le site de l'employeur » n'apparaît pas.

## 5. Risques

- **Sécurité** : contexte de l'assistant construit côté serveur après contrôle d'appartenance ; contenu
  d'offre, de CV ou de message traité comme donnée, jamais comme consigne ; aucune action sans clic.
- **Isolation** : tout ce qui touche Hire (modèles de message, mode recruteur) filtré par `organizationId`.
- **Données personnelles** : champs exclus du matching jamais envoyés à l'IA ; `track()` sans contenu
  privé et derrière le consentement analytics ; conservation des conversations IA notée dans `docs/decisions/`.
- **Coûts IA** : quota vérifié avant l'appel, contexte borné, 1 message = 1 crédit.
- **Budget JS** : la barre du bas et le panneau IA sont des composants client légers ; le panneau est
  chargé à la demande.
- **Tests existants à adapter** : `foundation.spec` (navigation principale), `learn.spec` et `admin-v4.spec`
  (sous-rubriques), `career.spec` (cadenas dans la navigation), `cv-v2.spec` (barre fixe), `zz-ux-walk.spec`.

## 6. Écarts proposés

1. **Boutons** : on étend le `Button` existant (nouvelles variantes et tailles) au lieu d'un composant
   neuf, pour ne casser aucun écran ; `primary` prend le dégradé principal de la maquette.
2. **Écran d'objectif** : on réutilise `/app/bienvenue` (déjà affiché après l'inscription) en lui donnant
   la forme des écrans 01-02, au lieu d'un second écran.
3. **Barre du bas sur tablette** : elle reste visible jusqu'à `lg` pour que les barres d'action fixes
   aient toujours un repère (corrige le trou 768-1024 px).
4. **Hire et Partenaire** : leur pilule actuelle reste ; seul le Talent passe à la nouvelle barre.

## 7. Découpage confirmé

Les 9 prompts du propriétaire, dans l'ordre : 1 socle visuel, 2 navigation, 3 Pour moi, 4 Offres et
candidature et Apprendre, 5 Suivi et messages, 6 profil et CV et recherche, 7 à 9 Jumanly AI. Puis R
(recruteur mobile) et S (application installée, Play Store, App Store ; abonnements vendus uniquement
sur jumanly.io). Une PR par prompt, fusionnée quand la CI est verte, captures 360/390/430 px et
ordinateur dans `/mnt/project-files/captures/mobile-talent/`.
