# Diagnostic de carrière v2 : choix techniques

Date : 15 octobre 2026

- **Un barème pur, partagé.** `diagnostic-scoring.ts` n'utilise que Zod : le serveur recalcule
  toujours la note, le questionnaire l'utilise pour le radar en direct. Mêmes règles des deux côtés.
- **Brouillon en base.** `CareerDiagnosticDraft` (une ligne par talent) plutôt que le stockage du
  navigateur : on reprend sur un autre appareil, et la page d'accueil sait où l'on s'est arrêté.
- **Questionnaire côté client, formulaire de secours.** Une question par écran sans aller-retour
  serveur (réseau lent) ; toutes les questions restent dans le formulaire, affichées d'un bloc par
  `<noscript>` et envoyées à la même action serveur.
- **Scan honnête.** Chaque étape correspond à un vrai appel (lecture du profil, comptage des
  offres, enregistrement) ; une pause de 0,65 s par étape donne au moins 3 s au moment, jamais en
  animations réduites.
- **IA bornée à 25 s.** `runAi` accepte `timeoutMs` : au-delà, les crédits sont rendus et l'appel
  compte comme indisponible ; le bilan par règles est gardé et le talent est prévenu.
- **Compatibilité.** Le résultat v2 garde `readiness`, `priorities`, `steps` (plan de progression,
  page Career) ; les anciens bilans s'affichent avec la vue de la première version.
- **Rappel à 30 jours.** Colonnes `remindAt` et `remindedAt` ; la tâche horaire existante
  (`/api/jobs/billing`, `pnpm jobs:billing`) crée la notification.
