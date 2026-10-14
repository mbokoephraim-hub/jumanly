# 2026-10-14 · Paiements : webhooks, renouvellement, factures (E7)

Statut : accepté.

1. **Fournisseur** : pas encore choisi par le propriétaire (réponse du 14 octobre : « Pas encore
   choisi »). E7 est livrée avec l'adaptateur factice, qui signe ses webhooks comme un vrai
   fournisseur. Hors local et previews, sans fournisseur configuré, les forfaits payants
   démarrent en essai (comportement d'E2, inchangé).
2. **Tâches de fond** : pas d'Inngest pour l'instant (un compte de plus pour le propriétaire). Les
   tâches d'abonnement sont une fonction idempotente appelée par une route protégée
   (`/api/jobs/billing`, `JOBS_SECRET`) ou par `pnpm jobs:billing`, à planifier toutes les heures
   chez l'hébergeur. Les webhooks sont traités tout de suite, de façon idempotente.
3. **Idempotence** : un paiement ne quitte l'état « en attente » qu'une fois ; seul celui qui le fait
   bouger déclenche la facture, l'e-mail et la notification. Chaque rappel, délai de grâce et
   retour au gratuit est inscrit dans `JobRun` avant d'être fait : au plus une fois.
4. **Prorata** : crédit = prix mensuel de l'ancien forfait × temps restant ÷ durée du dernier mois
   payé, plafonné pour qu'il reste au moins 1 USD à payer. Le nouveau forfait commence le jour
   même pour un mois. Le texte `billing.upgrade.prorataNote` est réécrit sans crochets ; la règle
   reste à valider dans les conditions générales de vente.
5. **Réduction de gamme** : jamais vendue en cours de période. Le renouvellement vers le forfait
   programmé crée un abonnement qui commence à la fin de la période payée ; le moteur de droits
   ignore un abonnement qui n'a pas commencé.
6. **Délai de grâce** : 3 jours (`GRACE_DAYS`), statut `past_due` écrit par la tâche, accès gardé.
   Fin du délai, de l'essai ou d'une résiliation : retour au forfait gratuit de la famille.
7. **Organisation au retour au gratuit** : les offres actives au-delà de la limite repassent en
   brouillon (les plus récentes restent en ligne) et les membres au-delà des sièges sont
   suspendus (propriétaires d'abord). Rien n'est supprimé ; tout revient au paiement suivant, dans
   les limites du nouveau forfait. Le choix par le recruteur est reporté.
8. **Factures** : numérotation `JMN-AAAA-000001`, une par paiement réussi, figée à l'émission
   (nom, adresse, forfait, montants). Les informations de facturation ne changent que les
   factures suivantes. Les mentions légales et fiscales restent à fournir.
9. **Remboursements** : manuels, faits chez le fournisseur puis enregistrés dans l'admin
   (référence obligatoire, journal d'audit). Le forfait n'est pas retiré automatiquement : la
   politique de remboursement relève des CGV.
10. **Montant contrôlé** : un webhook de succès dont le montant diffère du paiement n'active rien ;
    l'événement est gardé avec l'erreur pour l'administrateur.
11. **Monnaie locale** : le fournisseur factice ne convertit pas ; l'affichage du montant indicatif
    en monnaie locale viendra avec l'adaptateur réel s'il convertit.
