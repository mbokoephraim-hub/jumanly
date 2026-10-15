# Admin v2 · étape 2 : choix

Date : 15 octobre 2026

- **Coûts saisis à la main** : Jumanly ne connaît ni ses dépenses de publicité ni ses factures
  d'hébergement. L'administrateur les saisit par mois et par catégorie ; tant que rien n'est saisi,
  le tableau de bord affiche « Pas encore de données » plutôt qu'un chiffre inventé. Les dépenses
  d'IA de Jumanly, déjà mesurées dans `AiUsage`, s'ajoutent automatiquement.
- **Prorata** : pour une période de 7, 30 ou 90 jours, chaque mois saisi compte au prorata des jours
  qu'il partage avec la période.
- **Marge brute globale** : la marge est calculée pour l'ensemble de la plateforme, pas forfait par
  forfait, faute de savoir répartir les coûts entre forfaits.
- **Forfaits gratuits** : un compte sans abonnement en cours compte dans le forfait gratuit de sa
  famille (Free pour un talent, RH Free pour une entreprise, Partners pour un partenaire).
- **Utilisateurs actifs** : comptes avec une session ouverte ou prolongée sur la période.
- **Priorité des urgences** : un poids par type (paiement d'abord), plus 2 points par jour
  d'ancienneté (30 jours au plus), plus 25 si le délai est dépassé (contestation de plus de 7 jours).
