# Recruteur lot 3 · candidats, dossier et décision (20/10/2026)

Étape 2 de `docs/PLAN-REFONTE-EN-3-ETAPES.md`, brief `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md` § 4, point 3, planches recruteur-2 (§ 1 à 3) et planches v2 (`r2plus.py` l'emporte en cas d'écart).

## Ce qui change

- **Candidats** (`/app/hire/candidats`) : segments Candidatures et Rechercher des talents (lien vers le lot 4), choix de l'offre dans une feuille, ligne d'Orbi sur les candidatures non vues avec « Examiner », étapes en puces avec leurs effectifs (Retenue et Non retenue seulement s'il y en a), tri et filtres dans une feuille (correspondance, date ou étape ; seuil de correspondance ; dossier complet, avec lettre, non lues), qui masquent sans rejeter (« Tout afficher »), lignes avec initiales, « Nouveau », date, documents, étape et score. Sans `offre`, la page prend la plus récente offre publiée qui a des candidatures ; une offre d'une autre organisation donne une page introuvable.
- **Dossier** (`/app/hire/candidats/[id]`) : carte du haut (ligne, années, ville, score en anneau, frise des étapes), carte d'Orbi, documents (CV, lettre), compétences avec leur preuve et leur niveau, pièces jointes, réponses aux questions, notes modifiables et supprimables par leur auteur, historique, évaluation. Barre du bas : « Changer d'étape », entretien, message.
- **« Pourquoi X % ? »** : feuille avec les critères (`WhyCriteria` en mode recruteur), les données exclues et la règle « l'IA recommande, l'humain décide ».
- **Analyse d'Orbi** (`hire.cv_analysis`, 1 crédit, compté sur l'organisation) : points forts et points à vérifier, « Ajouter aux notes », « Signaler ». Le dossier est envoyé au modèle comme une donnée entre balises neutralisées, sans bloc d'identité ; chaque point renvoyé passe par `safePoint`, qui écarte tout ce qui décide, note, classe, contient un contact ou une donnée exclue, ou obéit à une consigne cachée. Sans modèle (fournisseur `fake` ou réponse vide), l'analyse est calculée du dossier seul (`templateAnalysis`, `source: "template"`).
- **Décision finale** (`/app/hire/candidats/[id]/decision`) : rappel des évaluations, issue choisie par le recruteur (Retenue, Non retenue, Retrait), message à relire et modifier avant l'envoi, tons Chaleureux, Formel, Court, plus « Notre modèle » si l'organisation en a un, motif facultatif, ajout à un vivier (droit `hire.shortlist`), « Plus tard » et « Confirmer et envoyer ». Écran « Décision enregistrée » avec ce qui a été fait, le compte à rebours d'annulation et les candidats restant à décider.

## Écarts assumés

- **Annulation pendant 10 minutes** : les effets dans Jumanly (étape, message au talent, vivier, historique) sont immédiats ; l'e-mail au talent part après 10 minutes (`claimDueDecisionMails`, livré par `/api/jobs/billing` et par un passage `after()`). « Annuler » remet l'étape d'avant, retire le message (le fil affiche « Message retiré par le recruteur »), retire l'ajout au vivier et n'envoie pas l'e-mail. Après envoi de l'e-mail, l'annulation est refusée.
- **Retrait** : la candidature garde son étape ; seul le statut change.
- **« Décision finale » dans « Changer d'étape »** ouvre l'écran de décision ; « Plus tard » range le candidat dans l'étape « Décision finale » de l'offre (si elle existe), sinon revient au dossier.
- **Aucune issue présélectionnée** : le recruteur choisit toujours ; « Confirmer » reste inactif tant qu'il n'a pas choisi.
- **RH Free sans score** : la planche dit « Toujours inclus », mais la partie 05 réserve le score (`matching.score`) ; la partie 05 fait foi. Le dossier montre un cadenas et la formule la moins chère qui l'ouvre. Même chose pour l'analyse d'Orbi.
- **Ligne d'Orbi de la liste** : « Analyser tout » de la planche (lecture en masse, coûteuse en crédits) est remplacée par « Examiner » la plus ancienne candidature non vue. L'analyse reste au dossier, une candidature à la fois.
- **Acceptation** : le créneau d'appel proposé dans le message n'est pas construit (entretiens au lot 4) ; l'ajout à un vivier depuis le dossier attend aussi le lot 4 (il reste possible à la décision).
- **Évaluation** (`#evaluation`) gardée dans l'ancien style jusqu'au lot 4 (entretiens et grilles).
- **Initiales seulement**, pas de photo (règle d'or n° 4 pour le matching ; aucune photo affichée dans la liste).
- **Personas** : « Nadia » de la planche n'est pas créée ; la démo utilise la recruteuse fictive de Baobab et quatre talents fictifs (`*.ux@jumanly.test`) sur l'offre d'analyste junior.
- **« Pourquoi ? » côté recruteur** : seules les phrases des critères compétences et expérience (et lieu s'il est rempli) sont montrées ; les autres phrases, écrites pour le talent (« votre profil »), sont masquées.
- **Attribution et grille d'une offre** (`#attribution`, `#grille`) déplacées de l'ancien tableau vers le détail de l'offre, dans l'ancien style.
- **Page Message** (`/app/hire/candidats/[id]/message`) reste dans l'ancien design ; ses anciennes entrées « refus » et « acceptation » renvoient vers l'écran de décision.
- **Noms** : la liste montre le nom complet du candidat (la planche abrège en « Amani M. ») ; le recruteur ne voit le dossier que si le talent a candidaté ou s'est rendu visible.
- **Étape sans candidature** : le filtre d'une étape vide affiche « Aucune candidature ne correspond à ces filtres. » ; l'état « Pas encore de candidature » de la planche est réservé à une offre qui n'en a aucune.
- **Parcours e2e** : il fait postuler `jeanpierre.ux@jumanly.test` (talent fictif de la démo, avec des compétences) ; le compte `talent.free` n'a pas de compétences, donc pas de score.

## Code supprimé

- `src/components/hire/pipeline-board.tsx` (ancien tableau à colonnes et glisser-déposer)
- `src/components/matching/recruiter-why.tsx` (ancien « Pourquoi ? » recruteur)
- `getPipeline`, `candidateSelect` (`src/server/services/hire.ts`) ; `moveApplicationAction`, `moveCardAction`, `back`, `decisionHref` (`src/server/actions/hire.ts`) ; `sendDecisionAction`, `decisionSchema` (`src/server/actions/hire-messages.ts`) ; la branche « décision » de la page Message.
