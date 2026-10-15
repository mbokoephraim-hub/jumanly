# Refonte lot 12 (partie B) : abonnement et paiement, choix et écarts

Date : 15 octobre 2026

## Choix

- **Routes gardées** : les maquettes nomment `/app/abonnement/paiement` et `/paiement/resultat`.
  On garde `/app/abonnement/payer?forfait=…&paiement=…` : l'URL de retour donnée au prestataire,
  l'attente (polling), les tests e2e et les liens existants en dépendent. Le résultat s'affiche sur
  la même adresse, le bandeau indique « Résultat du paiement ».
- **Résiliation** : panneau affiché par `?resilier=talent` (ou `rh`), rendu serveur, sans
  JavaScript. « Garder ma formule » et la croix ramènent à `/app/abonnement`.
- **« Vous êtes revenu à Free »** : affiché quand aucune formule n'est en cours et que la dernière
  formule payante (hors licence et essai) a expiré il y a moins de 30 jours (`BACK_TO_FREE_DAYS`).
- **Moyen de paiement** de la carte actuelle : celui du dernier paiement réussi (opérateur et
  numéro masqué) ; pour une carte, « Carte bancaire » (marque et 4 derniers chiffres non stockés).
- **Tuiles d'opérateurs** : initiales sur des couleurs neutres en alternance, en attendant les
  logos fournis par le prestataire.
- **Montant de l'attente** : en USD (aucun taux de conversion en monnaie locale n'est disponible).

## Non construits (rien derrière dans l'application)

- Abonnement : raisons et commentaire de résiliation (non enregistrés par `cancelSubscription`),
  ligne « Modèles de CV » des quotas, variantes « Licence sponsorisée » dans la carte (la carte de
  licence existante reste affichée à part).
- Mobile Money : choix du pays du compte (le pays du profil est utilisé), « Mémoriser ce numéro »,
  équivalent en monnaie locale, code USSD de secours, « Annuler le paiement » et « Utiliser un autre
  numéro » pendant l'attente (un paiement en attente bloque un nouveau paiement 15 minutes).
- Carte : champs hébergés du prestataire (numéro, date, code, nom, « Enregistrer cette carte ») et
  leurs erreurs au fil de la saisie ; le prestataire factice accepte la carte directement.
- Résultat : état « Paiement annulé » (aucun statut correspondant) ; la raison précise d'un échec
  ne s'affiche que si le prestataire la renseigne (`failureReason`).
