# Alignement Hire v3, lot 4 (suivi automatique) : choix et écarts restants

Date : 14/11/2026.

- **Pas de droit `hire.automation` pour l'instant** : l'accusé de réception et les rappels existaient
  déjà pour toutes les organisations ; les fermer à la formule gratuite serait un recul. Le droit
  pourra être ajouté avec la formule annuelle (lot M1) si Ephraïm le souhaite.
- **Taux d'ouverture** : Jumanly ne suit pas l'ouverture des e-mails (pas de pixel espion). La tuile
  est remplacée par « Créneaux choisis après relance », et l'historique donne ce qui a suivi
  l'envoi (test rendu, créneau choisi) au lieu de « Ouvert ».
- **Temps gagné** : estimation affichée comme telle (2 minutes par message écrit à la main).
- **Rythme** : les relances partent avec les tâches horaires existantes (`/api/jobs/billing`), pas
  toutes les 15 minutes comme le prévoit M7 ; une relance peut donc partir jusqu'à une heure après
  son échéance.
- **Rappel d'entretien** : la veille seulement (le rappel une heure avant viendra avec l'agenda
  connecté, M6). **Pièces manquantes** : le rythme existant (2 jours avant la date limite, puis la
  veille) est gardé.
- **Réponse aux non retenus** : délai d'annulation de 10 minutes (existant), pas 24 h ; interrupteur
  verrouillé, car la réponse ne part jamais sans décision humaine.
- **Modifier le texte d'une règle** : pas encore ; « Modèles d'e-mails » ouvre les modèles existants.
- Règles « Équipe » de M7 (candidature sans action depuis 3 jours, évaluation non rédigée, offre
  sans candidature depuis 7 jours) : pas encore.
