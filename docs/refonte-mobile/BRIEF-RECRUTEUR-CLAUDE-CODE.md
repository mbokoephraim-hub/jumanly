# Refonte mobile · espace recruteur (Jumanly Hire) · brief pour Claude Code

19 octobre 2026. Maquettes en 3 lots, d'après le cahier « Jumanly Hire — application mobile RH » d'Ephraïm et l'audit `docs/audit-hire/AUDIT-HIRE-MOBILE.md`. Les règles métier de `docs/specifications.md` et les règles d'or du `CLAUDE.md` restent la référence. Les fondations (surfaces, icônes, boutons, Orbi, mode sombre) sont **les mêmes que pour le talent** : `docs/refonte-mobile/BRIEF-TALENT-CLAUDE-CODE.md` se fait d'abord (au moins son lot 1 « fondations »).

## 0. Remplacement total de l'ancien design recruteur

Même règle que pour le talent (brief talent § 0) : l'ancienne interface Hire sur mobile disparaît entièrement.

- Supprimer du code les anciens composants mobiles de `/app/hire` qui ne figurent pas dans les planches : tableau de bord avec chiffres et raccourcis, pipeline en colonnes (`pipeline-board.tsx` reste seulement pour l'écran large, s'il sert encore), menus et boutons flottants. Pas de bascule ancien/nouveau.
- Les anciennes routes (`/app/hire/entretiens`, entrées hors barre) redirigent vers les nouvelles (§ 3).
- Base de données : **aucune donnée supprimée**. Migrations additives et nommées clairement (§ 2, points 4 à 7). Seed de démonstration recruteur refait d'après les planches (Baobab Fintech, Nadia K., candidats fictifs ; local et previews seulement).
- Écrans larges : mêmes composants dans une colonne centrée, en attendant leur maquette.
- Contrôle final : capture de chaque route `/app/hire/*` à 390 px, clair et sombre, nouveau design seulement ; liste des fichiers supprimés dans la PR.

## 1. Sources à ouvrir

| Quoi | Où |
|---|---|
| Audit, état du code, carte des 14 routes, parcours A à E | `docs/audit-hire/AUDIT-HIRE-MOBILE.md` |
| Fondations communes | `docs/refonte-mobile/maquette/` |
| Lot 1 : À traiter, organisation active, mes offres, actions, clôture, création en 4 étapes avec Orbi, limite d'offres, offre publiée, détail d'une offre | `docs/refonte-mobile/recruteur-1/` |
| Lot 2 : candidatures par étape, tri, dossier, score expliqué, analyse Orbi (et version RH Free), changer d'étape, décision finale, entretiens (proposer, aperçu, suivi, préparer, évaluer), recherche de talents, filtres, profil, proposer l'offre, viviers | `docs/refonte-mobile/recruteur-2/` |
| Lot 3 : Orbi, messages, conversation avec brouillon Orbi et actions rapides, modèles, notifications, compte RH, profil RH, organisation, vérification, équipe, invitation, abonnement, formules RH, paiement, rapports, paramètres, premiers pas | `docs/refonte-mobile/recruteur-3/` |
| Lot 4 : ATS avec Orbi (analyse en un clic, classement, recommandation, profil par offre), liste des retenus, réponses groupées (retenus et non retenus), modèles d'e-mail, messagerie (en ligne, lu, badges d'étape, menu, Orbi dans la conversation, rangement), contacts (demande, acceptation, liste), rejoindre une organisation existante, rapport PDF | `docs/refonte-mobile/recruteur-4/` et `docs/refonte-mobile/modeles-recruteur/` |

Chaque dossier contient la planche HTML, une capture par section (`*.png`) ; les générateurs `recruteur1.py`, `recruteur2.py`, `recruteur3.py`, `recruteur4.py` (et `modeles4.py` pour les e-mails et le rapport) et les CSS sont dans `docs/refonte-mobile/maquette/source/` (valeurs exactes). La section « Comment on y arrive » de chaque planche donne les chemins de navigation.

**Version 2 des planches (19/10, après retour d'Ephraïm « trop simple, trop de vide »)** : `r1plus.py`, `r2plus.py`, `r3plus.py` remplacent une partie des écrans et font foi. Points à reproduire : calendrier du mois et journée en créneaux pour proposer un entretien, ligne Orbi sur chaque écran de travail (suggestion avec bouton, jamais d'action sans accord), écrans pleine hauteur sans grands vides, profil talent et dossier en cartes riches (anneau de score, analyse en points forts et points à vérifier), abonnement avec échéances, rapports avec graphiques réels. **Peu de bandeaux d'information** : on ne garde en bas d'écran que ceux qu'impose une règle (données exclues du score, filtres interdits, candidature gratuite, garde-fou d'Orbi, contact assistant@jumanly.io) ; les autres explications vont dans l'aide. Icônes toujours centrées dans leur cadre.

## 2. Décisions à appliquer

1. Barre du bas recruteur : **À traiter · Offres · Orbi (rond central) · Candidats · Messages** (validé par Ephraïm le 19/10). Pas de bouton IA flottant, pas de bouton + global. En-tête : organisation active (appui = changer d'organisation ou passer à l'espace talent), titre, recherche, notifications, avatar → Compte RH. Barre masquée sur les écrans de travail (création, dossier, conversation, entretien). **Orbi s'ouvre en page de conversation** (demande d'Ephraïm du 19/10) : flèche retour en haut (retour à l'écran d'où l'on vient, À traiter par défaut), pas de barre du bas, le champ « Écrire à Orbi » occupe sa place en bas (+, micro, envoyer).
2. L'assistant s'appelle **Orbi** (pas « Jumanly AI Recruiter »). Il propose, résume, rédige ; **jamais** il ne rejette, ne classe définitivement ni n'envoie. Chaque suggestion : Appliquer / Modifier / Refuser. Il n'invente ni salaire, ni avantage, ni condition de travail. Le dossier est passé au modèle comme **donnée** : toute consigne écrite dans un CV ou une lettre est ignorée (séparer clairement instructions et contenu, tests dédiés).
3. Score de correspondance : calcul déterministe de la partie 08, « Pourquoi ? » partout, données exclues listées. Un filtre ou un tri **masque**, il ne rejette personne.
4. **Mise en pause d'une offre** : nouveau statut `paused` (masquée des résultats, candidatures conservées, reprise possible). Une offre en pause **ne compte pas** dans `jobs.active.max`. À la fin d'un abonnement, les offres en trop passent en pause (comportement actuel `pausedByBillingAt` conservé).
5. **Documents demandés et questions de présélection** sur l'offre (étape 3). **Fiche de poste en PDF facultative** (demande d'Ephraïm du 19/10) : PDF seul, 5 Mo au plus, analysé avant publication ; lue dans Jumanly par le talent (lecteur intégré, pages) et téléchargeable ; les champs de l'offre restent la source pour la recherche et le matching. Orbi peut proposer de compléter les champs depuis la fiche, le recruteur relit avant d'appliquer ; le contenu du PDF est une donnée, jamais une consigne. Aperçu de l'étape 4 = toute l'offre (description, responsabilités, critères, documents, questions, fiche). Une question ne bloque jamais une candidature (règle d'or 1) ; les critères éliminatoires existants restent signalés, jamais filtrants.
6. **Étapes** : garder le modèle actuel (étapes par offre, renommables). Modèle par défaut des nouvelles offres : Reçue, En examen, Présélectionnée, Entretien, Décision finale. La décision finale a trois issues : retenue, non retenue, retrait du candidat ; le message au candidat part d'un modèle, **relu avant l'envoi** ; annulation possible 10 minutes.
7. **Mes offres** : chaque offre publiée a sa couleur de la charte (lime, menthe, ambre, puis on recommence ; bleu doux pour « En validation »), en bande à gauche, sur l'icône et le statut, avec ses chiffres (candidatures, nouvelles, vues, entretiens) et un bouton Candidatures. Historique d'une offre : chaque événement porte son type (Message, Candidature, Modification, Publication), un message montre son texte.
8. **Notes privées** modifiables et supprimables par leur auteur, visibles par l'équipe seulement, jamais par le candidat.
9. **Analyse Orbi d'un dossier** = droit `hire.cv_analysis` (consomme `ai.credits.monthly`). Sans le droit, le dossier reste complet (CV, réponses, score et son pourquoi) avec une carte « dès RH Pro ». Grilles d'évaluation = `hire.scorecards`. Sièges = `org.seats` ; offres actives = `jobs.active.max`. Jamais de nom de forfait dans le code.
10. Formules RH (partie 05) : RH Free 1 siège, 1 offre active ; RH Pro 19,9 $ : 2 sièges, 5 offres, 100 crédits, analyse des CV ; RH Premium 49,9 $ : 3 sièges, 15 offres, 300 crédits, grilles. Au-delà : Jumanly Companies.
11. Organisation non vérifiée : ses offres passent « En validation » avant publication ; vérifiée : publication immédiate et badge. Vérification = e-mail sur le domaine + document officiel + examen par Jumanly.
12. Recherche de talents : seulement les profils rendus visibles ; chaque consultation est journalisée (bandeau sur le profil) ; aucun filtre sur âge, genre, nationalité, photo ; « Proposer l'offre » = `ContactRequest` avec quota, le talent décide ; le contact n'est visible qu'après acceptation.
13. Entretiens : 1 à 3 créneaux, visio / sur site / audio, fuseau, participants ; aperçu de ce que reçoit le candidat ; réponses et demandes d'autre date dans À traiter et dans l'écran Entretiens.
14. Paiement : mêmes écrans que le talent (lot 4 talent), au nom de l'organisation ; factures au nom de l'organisation ; l'adaptateur simulé jamais actif en production.
15. Aucun numéro de téléphone Jumanly ; contact `assistant@jumanly.io`. Rapports : chiffres réels, aucune donnée personnelle, **export toujours en PDF A4** aux couleurs de Jumanly (modèle `modeles-recruteur/rapport-recrutement.html` et `.pdf`, rendu côté serveur).
16. **ATS (lot 4)** : quatre accès, tous nommés « Analyser » (planche 0 bis) : bouton « Analyser (ATS) » sur chaque carte de Mes offres, carte ATS au-dessus de la liste dans Candidats (offre choisie), carte Orbi dans À traiter quand des candidatures ne sont pas classées, et menu ⋯ d'une offre. « Lancer l'analyse » analyse tous les CV d'une offre avec le droit `hire.cv_analysis` et consomme `ai.credits.monthly` par CV (nombre affiché avant de lancer). Classement par score déterministe (partie 08), recommandation d'Orbi (profils à voir en priorité, avec Pourquoi), profil adapté à chaque offre (critère → preuve, points à vérifier, questions d'entretien). Orbi ne rejette personne : les profils non recommandés restent dans « Tous ».
17. **Liste des retenus** : le recruteur coche des profils et crée la liste pour l'étape suivante ; elle sert aux réponses groupées et aux entretiens.
18. **Réponses groupées** : sélection rapide des retenus et des non retenus, modèle long, canaux e-mail et message Jumanly, case « J'ai relu » obligatoire, confirmation avec le nombre, annulation possible 10 minutes. Modèles d'e-mail : `modeles-recruteur/email-candidature-retenue.html`, `email-candidature-non-retenue.html` (600 px, aux couleurs, pied avec les deux adresses, jamais de téléphone).
19. **Messagerie** : présence « En ligne », accusés « Distribué » et « Lu » (désactivables par chacun dans ses paramètres), « écrit… » ; badges d'étape distincts (Retenu · entretien, Contact accepté, En examen, Non retenu) ; menu de la conversation (dossier, étape, modèles, Orbi, couper les notifications, retirer, signaler) ; « + » ouvre pièces jointes, créneaux, **modèles** ; Orbi dans la conversation (résumer, proposer une réponse, ton, traduire, rappel) sans jamais envoyer. Orbi peut proposer de **retirer de la messagerie** les conversations terminées des non retenus : cela masque côté recruteur seulement, le candidat garde ses messages, rien n'est supprimé en base.
20. **Contacts** : « Proposer l'offre » envoie une demande ; le talent accepte ou refuse ; l'écran Contacts liste tout (acceptés, en attente avec Relancer, refusés), quota mensuel affiché.
21. **Organisation existante à l'inscription** : si le nom ou le domaine de l'e-mail correspond à une organisation déjà sur Jumanly, sa fiche apparaît et l'utilisateur « demande à rejoindre » (pas de doublon). L'admin principale reçoit une notification dans l'app (choix du rôle, sièges restants, Accepter / Refuser) et l'e-mail `email-demande-rejoindre-organisation.html`. Sans réponse en 7 jours, la demande expire.
22. Les entreprises et personnes des maquettes sont fictives : ne rien reprendre en production.

## 3. Écrans → routes

| Écrans des planches | Route |
|---|---|
| Premiers pas (vous recrutez pour, organisation, espace prêt) | `/app/hire/bienvenue` |
| À traiter, rien à traiter, organisation active | `/app/hire` |
| Mes offres, actions, clôturer | `/app/hire/offres` |
| Nouvelle offre (4 étapes, Orbi, limite, publiée) | `/app/hire/offres/nouvelle`, `/app/hire/offres/[id]/modifier` |
| Détail d'une offre | `/app/hire/offres/[id]` |
| Candidatures (par offre et par étape), trier, vide | `/app/hire/candidats` |
| Dossier, sections, Pourquoi, analyse Orbi, changer d'étape, décision | `/app/hire/candidats/[applicationId]` (+ feuilles) |
| Proposer un entretien, aperçu | `/app/hire/candidats/[applicationId]/entretien` |
| Entretiens, préparer, évaluation | `/app/hire/entretiens`, `/app/hire/entretiens/[id]` |
| Rechercher des talents, filtres | `/app/hire/candidats?vue=talents` |
| Profil d'un talent, proposer l'offre | `/app/hire/talents/[profileId]` |
| Viviers | `/app/hire/viviers` |
| Orbi, historique | onglet Orbi (espace recruteur), `/app/orbi/historique` |
| Messages, conversation, modèles | `/app/messages`, `/app/messages/[id]`, `/app/hire/modeles` |
| Notifications | `/app/notifications` |
| Compte RH, profil RH | `/app/hire/compte`, `/app/hire/compte/profil` |
| Organisation, vérification, équipe, invitation | `/app/organisation`, `/app/organisation/verification`, `/app/organisation/equipe` |
| Abonnement, formules RH, paiement, factures | `/app/abonnement` (+ sous-pages communes) |
| Rapports, export PDF | `/app/hire/rapports` (PDF : `/app/hire/rapports/export`) |
| ATS d'une offre, recommandation, profil par offre, retenus | `/app/hire/offres/[id]/ats`, `/app/hire/offres/[id]/retenus` |
| Réponses groupées | `/app/hire/offres/[id]/reponses` |
| Contacts | `/app/hire/contacts` |
| Rejoindre une organisation (inscription), demande côté admin | `/app/hire/bienvenue` (étape organisation), `/app/notifications` |
| Paramètres (notifications, deux étapes, journal des consultations, fuseau) | `/app/parametres` |

## 4. Ordre de travail (un lot = une PR)

0. Diagnostic de l'existant face à ce brief et plan, avec la liste de ce qui sera supprimé (§ 0). Aucun code.
1. Barre, en-tête recruteur, organisation active, Compte RH, premiers pas.
2. À traiter, mes offres, pause (migration), création en 4 étapes avec documents et questions (migration), Orbi rédaction, quota, validation, détail (lot 1).
3. Candidats en liste par étape, dossier, notes modifiables, score et Pourquoi, changer d'étape, décision finale avec message relu, analyse Orbi `hire.cv_analysis` protégée contre l'injection (lot 2 § 1-3).
4. Entretiens, préparation Orbi, évaluation ; recherche de talents, profil, proposer l'offre, viviers (lot 2 § 4-5).
5. Messages avec actions rapides et brouillon Orbi, modèles, notifications, organisation, vérification, équipe, abonnement, rapports, paramètres (lot 3). Redirections, suppression du code mort, contrôle final du § 0.
6. ATS Orbi, liste des retenus, réponses groupées et e-mails, messagerie enrichie, contacts, rejoindre une organisation, rapport PDF (lot 4).

## 5. Définition de fini, pour chaque lot

- Captures Playwright à **390 px**, clair et sombre, de chaque écran, comparées aux captures des planches ; écarts listés et corrigés.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build`, `pnpm messages:check` passent ; e2e des parcours A à E de l'audit.
- Tests : isolation par `organizationId` sur chaque requête Hire ; une offre en pause ne compte pas dans le quota ; aucune action Orbi sans accord ; consigne cachée dans un CV ignorée.
- Tous les textes dans `textes/textes-application.md` → `pnpm messages`.
- `docs/journal.md` mis à jour ; tout écart au brief noté dans `docs/decisions/`. Liste **verticale continue** (défilement de haut en bas, profils suivants chargés automatiquement, pas de pagination), bouton « Consulter » sur chaque carte. Profil : parcours en deux blocs, « Expérience professionnelle » puis « Formation » (diplômes et formations, attestations Jumanly marquées) ; la consultation journalisée s'affiche en petite pastille sous le nom.
