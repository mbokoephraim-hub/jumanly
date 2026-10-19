# Audit de l'espace recruteur mobile face au cahier « Jumanly Hire — application mobile RH »

19 octobre 2026. Livrables 1 à 4 du cahier (audit, navigation, carte des pages, plan d'intégration). **Aucun code modifié.** Vérifié dans le dépôt : `prisma/schema.prisma`, `src/app/app/hire/`, `src/server/services/hire.ts` et voisins, `src/config/navigation.ts`, `docs/specifications.md` partie 05.

## 1. En bref

- **Le moteur existe déjà presque entièrement** : offres avec brouillon, modération, duplication et clôture ; étapes de recrutement par offre ; dossier avec historique et notes ; entretiens avec créneaux et réponse du candidat ; évaluations ; viviers ; recherche de talents avec quotas ; messages et modèles ; équipe et rapports ; rédaction d'offre par l'IA. Le travail est surtout **d'interface mobile**, pas de backend.
- **Ce qui manque vraiment** : la synthèse IA d'une candidature (le droit `hire.cv_analysis` existe mais aucun service ne l'utilise), la mise en pause manuelle d'une offre, les documents demandés et les questions de présélection à la création, la modification de ses propres notes, et l'écran « À traiter » tel que le cahier le décrit (l'actuel tableau de bord mélange actions, chiffres et quotas).
- **La navigation mobile actuelle** reprend 4 entrées sur 9 et renvoie le reste vers des raccourcis du tableau de bord : c'est elle qu'il faut refaire.
- **Les formules du cahier sont exactes** : RH Free 1 siège, 1 offre active ; Pro 2 et 5 ; Premium 3 et 15 (partie 05, `org.seats`, `jobs.active.max`). Rien à changer.
- **5 points du cahier se heurtent à des décisions déjà prises** (§ 3). Ils sont à trancher avant les maquettes.

## 2. État de chaque fonctionnalité

| Fonction du cahier | État | Où dans le code |
|---|---|---|
| Authentification, organisation, sélecteur d'espace | Fait | Better Auth, `Membership`, `space-switcher.tsx` |
| Onboarding RH | Partiel | inscription avec organisation ; pas de premiers pas guidés pour le recruteur |
| À traiter | Partiel | `/app/hire` : actions du jour, offres, entretiens **et** chiffres, quotas, raccourcis |
| Mes offres, filtres | Fait | `/app/hire/offres` ; statuts brouillon, en validation, publiée, clôturée, archivée, refusée |
| Expirée | Partiel | `closesAt` existe ; pas de filtre « expirées » |
| Mettre en pause | **Absent** | seulement la pause automatique liée à l'abonnement (`pausedByBillingAt`) |
| Créer une offre en étapes, brouillon, reprise | Fait | `job-wizard.tsx`, `job-steps.ts`, `saveJob` |
| Rédiger avec l'IA | Fait | `services/job-writer.ts` |
| Documents demandés, questions de présélection | **Absent** | seuls des critères éliminatoires (`knockoutCriteria`) existent |
| Nombre de postes | **Absent** | à ajouter seulement si utile |
| Candidature externe | Volontairement absent | décision du 18/10 : pas d'offres externes au lancement |
| Détail d'une offre, lien, historique | Fait / partiel | `/app/hire/offres/[id]` ; historique des changements partiel |
| Candidatures, filtres | Fait | `getPipeline`, `pipeline-board.tsx` (tableau large, à refaire en liste mobile) |
| Dossier candidat, CV, lettre, historique | Fait | `/app/hire/candidats/[applicationId]`, `recordView` journalise la consultation |
| Notes internes | Partiel | notes en `ApplicationEvent` ; modification de ses notes absente |
| Synthèse IA de la candidature | **Absent** | droit `hire.cv_analysis` déclaré, aucun service |
| Changer d'étape, refuser, embaucher | Fait | `moveApplication`, `rejectApplication`, `hireApplication`, historisés |
| Statuts internes ≠ statuts candidat | Fait | étapes internes ; le talent voit des situations simplifiées (Suivi) |
| Évaluations (grilles) | Fait | `Scorecard`, `scorecard-panel.tsx` (droit `hire.scorecards`) |
| Rechercher des talents, viviers, demandes de contact | Fait | `/app/hire/talents`, `/app/hire/viviers`, `ContactRequest`, quotas |
| Recherche assistée par l'IA | Absent | prévu après le MVP par le cahier |
| Planifier un entretien, réponse du candidat | Fait | `Interview` (1 à 3 créneaux, contre-proposition, fuseau, lien ou adresse) |
| Préparer l'entretien avec l'IA | Partiel | grille d'évaluation par offre ; pas de questions générées |
| Messages, pièces jointes, modèles | Fait | `/app/messages`, `MessageTemplate`, `/app/hire/modeles` |
| Brouillon de message par l'IA | Absent | |
| Notifications | Fait | `/app/notifications` (commune aux espaces) |
| Équipe, invitations, permissions | Fait | `Membership`, `Team`, `org.permissions.level` |
| Rapports | Fait | `/app/hire/rapports` (niveau selon `reports.level`) |
| Abonnement, sièges, quotas, factures | Fait | `/app/abonnement`, `seatUsage`, jauges |

## 3. Points du cahier à trancher

1. **La barre du bas.** Le cahier veut 4 onglets et un bouton IA flottant. Le talent a validé Orbi au centre de la barre. Je recommande **À traiter · Offres · Orbi (centre) · Candidats · Messages** : quatre onglets de travail comme le cahier, et Orbi au même endroit que pour le talent, sans bouton flottant qui masquerait les champs ou le clavier. L'agenda des entretiens va dans À traiter.
2. **Le nom de l'assistant.** Le cahier dit « Jumanly AI Recruiter ». Décision du 18/10 : **Orbi**, pour tous.
3. **Candidature externe** à la création d'offre : à **retirer** du MVP (décision du 18/10).
4. **Mise en pause d'une offre** : à **ajouter** (statut `paused`, l'offre disparaît des résultats et garde ses candidatures). Le quota d'offres actives compte-t-il une offre en pause ? Je recommande **non**.
5. **Les 7 étapes du cahier** (Reçue, En examen, Présélectionnée, Évaluation, Entretien, Décision, Clôturée) contre les étapes actuelles (nouvelle, présélection, test, entretien, offre, embauché, refusé), que chaque offre peut renommer. Je recommande de **garder le modèle actuel** et de proposer les 7 étapes comme modèle par défaut, avec une clôture « retenue, non retenue ou retrait ».

## 4. Navigation mobile proposée

- **Barre du bas** : À traiter · Offres · Orbi · Candidats · Messages.
- **En-tête** : titre de la page, organisation active (appui = changer d'organisation), recherche, notifications, avatar.
- **Avatar → Compte RH** : mon profil RH, mon organisation, mon équipe, rapports, modèles de messages, viviers, abonnement, paramètres, aide, passer à l'espace talent.
- **Bouton principal** : « Publier une offre » dans À traiter et dans Offres (pas de bouton + global).
- **Écrans de travail** (création d'offre, conversation, planification) : barre du bas masquée, retour en haut.

## 5. Carte des pages (14 routes)

| # | Page | Route | Contenu | Remplace |
|---|---|---|---|---|
| 1 | Connexion, inscription, onboarding RH | routes d'inscription existantes + `/app/hire/bienvenue` | organisation, vérification, première offre | — |
| 2 | À traiter | `/app/hire` | nouvelles candidatures, entretiens à venir, actions, offres actives | tableau de bord actuel |
| 3 | Mes offres | `/app/hire/offres` | Actives, Brouillons, En pause, Clôturées, Expirées | — |
| 4 | Créer / modifier une offre | `/app/hire/offres/nouvelle`, `/[id]/modifier` | 4 étapes, Orbi, brouillon automatique | — |
| 5 | Détail d'une offre | `/app/hire/offres/[id]` | essentiel en haut, sections repliables, « Voir les candidatures » fixe | — |
| 6 | Candidats | `/app/hire/candidats` | Candidatures (filtre par étape = ATS mobile) · Rechercher des talents | pipeline en tableau, `talents` |
| 7 | Dossier candidat | `/app/hire/candidats/[applicationId]` | profil, documents, historique, notes, évaluation, actions | — |
| 8 | Profil d'un talent (recherche) | `/app/hire/talents/[profileId]` | ce que le talent autorise, vivier, contact | — |
| 9 | Planifier un entretien | `/app/hire/candidats/[applicationId]/entretien` | créneaux, mode, consignes, préparation Orbi | `/app/hire/entretiens` (liste → À traiter) |
| 10 | Messages, conversation | `/app/messages`, `/app/messages/[id]` | communs aux espaces, actions rapides recruteur | — |
| 11 | Notifications | `/app/notifications` | communes | — |
| 12 | Compte RH | `/app/hire/compte` | menu secondaire du § 4 | entrées hors barre |
| 13 | Organisation et équipe | `/app/organisation` | profil, vérification, collaborateurs, invitations | — |
| 14 | Abonnement, paramètres | `/app/abonnement`, `/app/parametres` | communs, avec sièges et offres actives | — |

Restent hors navigation, ouverts depuis le Compte RH : viviers, modèles de messages, rapports (version mobile simplifiée).

## 6. Les cinq parcours

- **A. Examiner** : À traiter → carte « Examiner » → dossier → CV → changer d'étape (confirmation) → historique mis à jour.
- **B. Publier** : Offres → Publier une offre → 4 étapes (Orbi facultatif, suggestions à accepter) → vérification et quota → Publier ou Soumettre pour validation.
- **C. Entretien** : Candidats → dossier → Inviter à un entretien → créneaux → aperçu → Envoyer → la réponse arrive dans À traiter ; le talent la voit dans Suivi.
- **D. Contacter** : dossier → Message → brouillon Orbi facultatif → relire → Envoyer.
- **E. Rechercher** : Candidats → Rechercher des talents → filtres → profil autorisé → vivier ou demande de contact (quota).

## 7. MVP et après

**MVP mobile** : barre et Compte RH ; À traiter ; offres avec pause ; création en 4 étapes avec Orbi ; candidats et ATS en liste ; dossier avec notes ; entretiens ; messages avec brouillon Orbi ; notifications ; synthèse Orbi d'une candidature (**fondée seulement sur le dossier, jamais un avis de rejet**, et protégée contre les instructions cachées dans un CV).

**Après validation** : recherche de talents assistée par Orbi, viviers enrichis, rapports détaillés sur mobile, actions groupées, fonctions de cabinet.

## 8. Plan

1. Ephraïm tranche les 5 points du § 3.
2. Maquettes recruteur dans le même générateur que le talent, en 3 lots : (1) barre, À traiter, offres, création, détail ; (2) candidats, dossier, ATS, entretien, recherche ; (3) messages, notifications, Compte RH, organisation, équipe, abonnement, onboarding, sombre.
3. Brief `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md` et prompt, comme pour le talent.

Aucune modification du backend n'est prévue sauf : statut `paused`, documents demandés et questions de présélection, édition de ses notes, service de synthèse `hire.cv_analysis`, brouillons de message Orbi.
