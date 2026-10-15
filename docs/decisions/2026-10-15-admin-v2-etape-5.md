# Admin v2 · étape 5 : écarts et choix

- **Changement de forfait « à l'échéance »** : il s'appuie sur `pendingPlanId`, comme la baisse de
  forfait choisie par le client. Le renouvellement suivant se paie avec ce forfait ; aucune tâche de
  fond ne bascule seule un abonnement offert ou sponsorisé.
- **Paiement manuel** : enregistré avec le prestataire `manual` et la référence saisie
  (`manuel:<référence>`, unique). Il passe par `applyPaymentStatus` pour garder une seule règle
  d'activation, de facture et de reçu. Le montant est libre (geste commercial, devis).
- **Suppression d'un forfait** : seulement s'il n'a jamais servi (abonnement, paiement, licence,
  changement prévu). Sinon « Retirer de la vente » le masque et le rend non achetable ; les abonnés
  le gardent jusqu'à leur échéance.
- **Nouveau forfait** : prix « sur devis » au départ pour ne jamais devenir le forfait gratuit de
  sa famille (`freePlan` prend le premier forfait à 0 USD).
- Les licences de partenaires restent gérées depuis l'espace partenaire : leur fiche ne propose
  pas d'action.
