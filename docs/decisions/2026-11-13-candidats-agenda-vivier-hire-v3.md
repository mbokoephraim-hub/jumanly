# Hire v3, lots V3-3 et V3-4 : écarts avec le prototype

Date : 13/11/2026. Lots V3-3 (Candidats) et V3-4 (Agenda, Messages, Vivier, Suivi automatique) du prototype v3.

## Ce qui est fait, à l'identique du prototype
- Candidats : pipeline par glisser-déposer et « Étape suivante », liste, comparer (radar), fiche candidat avec les onglets Résumé, Parcours, Test, Documents. Chaque ouverture de fiche est journalisée.
- Agenda : vues jour, semaine, mois, prochain entretien avec compte à rebours, heures libres de la semaine, fenêtres d'un rendez-vous et d'un créneau libre.
- Vivier : talents de tous les viviers (une fois chacun), donut par vivier (un clic filtre), recherche, onglets Tous, Disponibles, Proches de l'offre.

## Écarts
- **Tests de compétences** : aucune base n'existe encore pour les tests (lot M5 du MVP). L'onglet Test de la fiche et les écrans « Tests » affichent un état vide ; la pastille « À tester » des cartes est indicative.
- **Proximité du vivier** : part des compétences obligatoires de la dernière offre publiée que le talent possède (calcul déterministe, sans nom, âge, genre ni photo). Ce n'est pas le score de matching complet, qui exige une candidature.
- **Favoris et relances du vivier** : pas de modèle « favori » ni de relance de vivier en base. Les onglets Favoris et Relancés deviennent Disponibles et Proches de l'offre ; « À renouveler » (accord qui expire) devient le nombre de viviers.
- **Agenda** : pas de synchronisation Google / Outlook ni de lien de réservation (lot M6) ; ces pastilles ne sont pas affichées.
- **Messages** : l'écran de messagerie existant (`/app/messages`) reste en place dans le cadre v3 ; sa refonte à l'identique du prototype viendra avec le lot de finition.
- **Suivi automatique** : aucun moteur de règles n'existe encore (lot M7). L'écran n'est pas affiché ; l'accusé de réception automatique existant continue de fonctionner.
