# Recruteur lot 2 · traiter et publier (20/10/2026)

Étape 2 de `docs/PLAN-REFONTE-EN-3-ETAPES.md`, brief `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md` § 2 et planches recruteur-1 (r1 à r4).

## Ce qui change

- **À traiter** (`/app/hire`) : la ligne d'Orbi, « Publier une offre », quatre tuiles (nouvelles candidatures, invitations, grilles à remplir, messages non lus), les nouvelles candidatures avec « Examiner », les prochains entretiens et deux offres actives. Sans rien à traiter : « Rien à traiter pour l'instant », les chiffres de la semaine, Orbi et « Pour avancer ». Chiffres réels uniquement (`src/server/services/hire-today.ts`).
- **Mes offres** (`/app/hire/offres`) : onglets Actives, Brouillons, En pause, Clôturées, Expirées ; bandes lime, menthe et ambre à tour de rôle dans l'ordre de publication, bleu doux pour « En validation » ; quatre chiffres par carte (candidatures, non vues, entretiens, vues) ; menu ⋯ avec candidatures, voir, modifier ou continuer, dupliquer, copier le lien, pause ou reprise, republier, clôturer (avec confirmation), supprimer un brouillon. Filtres équipe, département, entité et responsable si le droit `org.teams` est ouvert.
- **Publier une offre en 4 étapes** (`/app/hire/offres/nouvelle`, puis `/app/hire/offres/[id]/modifier?etape=1..4`), chaque étape enregistrée au « Continuer » :
  1. le poste (intitulé, domaine, expérience, ville, pays, mode de travail, contrat, nombre de postes, salaire) ;
  2. la description, avec Orbi qui rédige ou améliore et propose Refuser, Modifier ou Appliquer ; Orbi n'invente jamais ni salaire ni avantages (il ne reprend que ce que le recruteur a écrit) ;
  3. la candidature : date limite, documents demandés, questions de présélection, fiche de poste PDF facultative, consignes, critères éliminatoires. Documents et questions ne bloquent jamais une candidature (règle d'or n° 1) ;
  4. vérifier et publier : relecture d'Orbi (`moderationFlags`), aperçu, ce qui manque, place restante dans `jobs.active.max`, puis « Publier » ou « Envoyer en validation ».
- **Limite atteinte** : feuille « Limite d'offres actives atteinte » avec la formule la moins chère qui l'élève (`cheapestPlanWhere`), sans nom de forfait dans le code.
- **Écran publié** (`?publiee=1` ou `?publiee=verification`) et **détail d'une offre** (`/app/hire/offres/[id]`) : statut, chiffres, étapes avec leurs effectifs, description, candidature, compétences, fiche PDF, historique typé (Message, Candidature, Modification, Publication) et performance (vues par jour, taux).
- **Pause** : une offre en pause garde sa page publique, ne reçoit plus de candidatures et ne compte plus dans `jobs.active.max` ; la reprendre revérifie la limite.
- **Étapes par défaut** d'une nouvelle offre : Reçue, En examen, Présélectionnée, Entretien, Décision finale (plus Retenue et Non retenue, cachées du tableau).
- **Côté talent** : la page de l'offre montre les documents demandés, le nombre de questions et la fiche PDF ; l'étape 2 de « Postuler » propose les questions, facultatives. Le recruteur lit les réponses dans la fiche du candidat (« Réponses aux questions »).

## Données

Migration additive `20261020120000_recruteur_lot_2_offres_pause_questions_fiche` : statut `paused`, `Job.pausedAt`, `openings`, `domain`, `requestedDocuments`, `screeningQuestions`, `applicationInstructions`, champs de la fiche PDF, `Application.screeningAnswers`, `ApplicationDraft.screeningAnswers`, table `JobViewDay` (un compteur par offre et par jour, aucune personne enregistrée).

## Écarts assumés

- **Fiche PDF à 4 Mo, pas 5 Mo** : la limite des Server Actions (`bodySizeLimit` à 4,2 Mo) ne laisse pas passer 5 Mo. Le contrôle vérifie le type (signature `%PDF`), la taille, le chiffrement et le contenu actif (JavaScript, lancement d'application, fichiers joints, formulaires XFA). **Pas d'antivirus** (aucun service payant, comme demandé).
- **Lecture de la fiche** : la lecture dans Jumanly montre le texte extrait page par page (`unpdf`), avec le téléchargement du fichier d'origine ; pas de rendu image des pages.
- **Clôture** : l'interrupteur « Envoyer un message aux non retenus » de la planche est omis jusqu'au lot 4 (décisions) ; la confirmation dit que les candidats encore en cours ne sont prévenus qu'à la décision.
- **Tableau des candidats** : l'ancien tableau d'une offre (colonnes, glisser-déposer, attribution `#attribution`, grille `#grille`) est déplacé tel quel sur `/app/hire/candidats?offre=` jusqu'au lot 3 ; sans `offre`, la page renvoie vers Mes offres.
- **« Domaine »** reprend la liste des domaines d'études des premiers pas (`access.onboarding.studies.field.*`), faute de référentiel des métiers.
- **Étapes « En examen » et « Décision finale »** sont rangées dans les catégories existantes `new` et `interview` (pas de nouvelle valeur d'énumération).
- **Organisation vérifiée** = `Organization.verifiedAt` renseigné ; sinon l'offre passe par « En validation ». Les tests e2e qui publient directement vérifient l'organisation par un outil de test (`tests/e2e/verify-org.ts`, `tests/e2e/make-recruiter.ts`).
- **Écran publié** : l'étape « Résumé d'Orbi chaque matin » de la frise est omise (aucun envoi de ce genre n'existe encore).
- **Page publique d'une offre** : elle reçoit seulement le compteur de vues ; son nouveau design suivra le site public.
- **Seed** : les offres de démonstration gardent leurs anciennes étapes (Nouvelles candidatures, Présélection…) ; seules les nouvelles offres prennent les étapes par défaut.
- **Termes protégés** : la détection (`isProtectedCriterion`) ne voyait pas « âge » (le `\b` ne reconnaît pas les lettres accentuées) ; bornes de mots Unicode à la place. Elle sert aussi aux questions de présélection.
- **Grand écran** : la même colonne centrée de 560 px qu'au lot 1, en attendant les lots web recruteur.

## Fichiers supprimés

- `src/components/hire/job-wizard.tsx`
- `src/components/hire/job-form.tsx`
- `src/components/hire/job-form-shell.tsx`
- `src/components/hire/job-steps.ts`
- `src/components/hire/job-status.tsx`
- l'ancienne page `src/app/app/hire/offres/[id]/page.tsx` (tableau de l'offre), déplacée vers `src/app/app/hire/candidats/page.tsx`
- dans `src/server/actions/hire.ts` : `saveJobAction`, `publishJobAction` et `publishAndRedirect`, remplacés par `src/server/actions/hire-offers.ts`
