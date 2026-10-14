# Journal du projet

Une entrée par étape : ce qui a été fait, les décisions prises, les dettes à rembourser.

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
