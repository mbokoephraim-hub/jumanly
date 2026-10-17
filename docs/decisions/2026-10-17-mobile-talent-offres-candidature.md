# Mobile Talent v5 · offres, candidature en étapes et Apprendre (prompt 4)

Date : 17 octobre 2026.

## Décision

- **Brouillon de candidature en base.** Nouvelle table `ApplicationDraft` (clé `userId` + `jobId`,
  étape, CV choisi ou « profil seul », lettre). Elle est écrite à chaque « Continuer » ou
  « Quitter » (`saveApplicationStepAction`) et supprimée quand la candidature est envoyée. Migration
  additive `20261017000222_application_drafts` ; retour arrière :
  `docs/ux-mobile-talent/retour-arriere/prompt-4-brouillons.sql` (aucune autre table touchée).
- **Trois étapes, pas quatre.** CV, Lettre, Vérification sur `/app/jobs/[slug]?postuler=1&etape=…`.
  L'étape « Questions » de la maquette est sautée : le modèle n'a pas de questions recruteur (le
  prompt prévoit de la sauter quand il n'y en a pas). La mention « offre externe » n'est pas posée :
  aucune offre externe n'existe en base.
- **Consentement explicite.** La case « J'accepte que l'entreprise consulte ma candidature » est
  obligatoire et jamais pré-cochée ; l'action refuse un envoi par étapes sans elle. Candidater reste
  gratuit : aucun droit ni quota n'est vérifié.
- **« Candidature envoyée » seulement après le serveur.** L'écran de succès vient de la redirection
  de l'action. Si la requête n'arrive pas (réseau), l'écran dit « Votre candidature n'est pas encore
  envoyée », montre l'état « Brouillon, non envoyé » et l'heure du dernier enregistrement, et
  propose « Réessayer ». Le formulaire est envoyé à la main (pas en action de formulaire React) pour
  que la case de consentement ne soit pas remise à zéro avant « Réessayer ».
- **Offres.** Onglets Pour vous / Récentes / Enregistrées (lien vers la page existante). « Pour
  vous » classe les offres filtrées par score de matching (calcul limité aux 120 premières offres
  du filtre, les autres suivent) ; sans aucun score, c'est une « Sélection générale, non
  personnalisée » avec un lien pour personnaliser. Les anciennes vues `tous` et `recommandees`
  restent acceptées.
- **Enregistrer avec « Annuler ».** L'état change tout de suite et un toast propose « Annuler » ;
  sans JavaScript, l'ancien formulaire fonctionne toujours.
- **Non affichés** (pas d'interface fictive) : le bloc IA de l'écran 31 (prompt 8) et les
  recherches récentes (prompt 6, avec le consentement préférences).
- **Apprendre.** La page suit l'écran 13 (formation en cours, recommandées avec « Pourquoi ? »,
  domaines, exercices et certificats). La fiche formation et la Learning Room restent celles de
  Learn v2 ; seule une barre fixe Enregistrer / Commencer est ajoutée sur téléphone.
