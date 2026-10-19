# Refonte mobile, lot 6b : choix et écarts (19 octobre 2026)

- **Six dimensions du diagnostic.** Elles gardent les noms du service déterministe
  (`diagnostic_scoring_v2`) : Clarté du projet, Compétences, Expérience, Outils de candidature,
  Préparation aux entretiens, Recherche active et réseau. La maquette en montre d'autres ; changer
  les noms aurait changé le calcul, qui reste la source de vérité (partie 08).
- **Titre du niveau neutre.** « Prêt à candidater », « Les bases de votre projet »… plutôt
  qu'un adjectif accordé.
- **Écran du diagnostic allégé.** Le mini-plan, « Pour aller plus loin », l'historique et
  « Refaire dans 30 jours » quittent l'écran du résultat (le plan a son écran ; l'action de rappel
  `remindDiagnosticAction` reste dans le code, sans bouton). La date du bilan n'est plus lue que
  par les lecteurs d'écran. Le résultat s'ouvre seul à la fin de l'analyse, sauf quand Orbi n'a
  pas pu personnaliser : l'avis s'affiche alors avec « Voir mon diagnostic ».
- **Faire le point** (`/app/profil/point`) est calculé sans IA (`src/server/services/career-point.ts`)
  à partir du profil, du dernier diagnostic et des compétences demandées dans les offres du
  métier visé. Ajout d'un lien « Voir mon diagnostic ».
- **Plan.** Les formations recommandées et le bilan PDF restent en bas de l'écran. L'objectif n'a
  pas de date « d'ici » : le modèle n'en a pas, rien n'est ajouté en base.
- **Types de questions.** « Salaire » devient « Questions RH » (types du service : RH, technique,
  motivation, mise en situation) ; plusieurs types se cochent et leurs questions se mélangent.
- **Format « Mixte » retiré.** Le service ne connaît que l'écrit et l'oral.
- **Oral.** La transcription se fait dans le navigateur (Web Speech) ; aucun son n'est envoyé ni
  gardé. « Réécouter ma réponse » devient donc « Revoir ma réponse » (le texte transcrit).
- **Version gratuite.** Les conseils montrés viennent des conseils carrière publiés (trois au
  plus) ; « Voir les formules » mène aux tarifs. Candidater reste libre.
- **« Sur une offre »** propose les offres enregistrées et les candidatures dans une liste.
- **Pas de données de démonstration ajoutées.**
