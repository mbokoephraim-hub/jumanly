# Hire v3, lot V3-5 : rapports et téléchargements, écarts avec le prototype

Date : 13/11/2026.

- **Rapports** : chiffres réels de la période (7 jours, 30 jours, trimestre) comparés à la période précédente. Le « délai moyen » est le délai jusqu'au premier entretien ; on ne sait pas encore mesurer le délai jusqu'à l'embauche de façon fiable. « Délai par étape » devient une seule jauge (délai jusqu'au premier entretien). Les sources sont les trois sources de l'application (candidature directe, invitation, recherche de talents), pas LinkedIn ou WhatsApp. Il n'y a pas d'objectif de 21 jours en base : la jauge sert seulement de repère visuel.
- **Télécharger** : la fenêtre est une page (`/app/hire/telecharger`) avec un formulaire simple. Excel (.xlsx) et CSV sont produits sur le serveur. Le PDF ouvre le modèle A4 avec la fenêtre d'impression du navigateur, comme pour le rapport des offres. Chaque téléchargement est noté dans le journal (`report.export`, avec le document, le format et « Masquer les noms »).
- **Six modèles** (`/app/hire/rapports/modeles`) : talents, candidats, comparaison, résultats de test, équipe, journal. Le modèle « Résultats de test » reste vide tant que les tests de compétences n'existent pas (lot M5). Le journal des consultations est réservé aux administrateurs. Le modèle « Activité d'un membre » viendra avec la fiche membre (lot V3-6).
