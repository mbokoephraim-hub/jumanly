# Compte passe-partout (mode testeur)

**Contexte.** Le propriétaire veut tester lui-même, en production, chaque forfait (Free à Premium,
talent, RH, Entreprise) et l'administration, avec un seul compte. Payer chaque forfait n'a pas de
sens, et modifier la base à la main est interdit.

**Décision.** Variable `TESTER_EMAILS` (adresses séparées par des virgules). Un compte dont
l'adresse est listée **et vérifiée** a accès à `/app/testeur` :

- choisir un forfait talent pour lui-même ;
- créer une organisation de test (type entreprise, dont il est propriétaire) et lui donner un
  forfait RH ou Entreprise ;
- créer une institution partenaire de test (gestionnaire) ;
- un lien vers l'administration, si le compte est administrateur (via `ADMIN_BOOTSTRAP_EMAIL`).

Un forfait choisi devient un abonnement `source: admin`, actif un an ; les abonnements en cours (hors
licence) se terminent, les compteurs de quotas de la période repartent de zéro. Un forfait gratuit
revient simplement au forfait de repli. Les limites « sur contrat » de Company Premium reçoivent des
valeurs d'essai (`EntitlementOverride`, motif « Mode testeur : contrat d'essai »), retirées au
changement suivant.

**Garde-fous.** Le code ne teste toujours que des clés de droits : le testeur détient un abonnement
comme n'importe qui. Personne d'autre ne voit la page (404). Seuls son propre compte et ses propres
organisations de test sont modifiables. Chaque changement est inscrit au journal d'audit
(`subscription.tester`, `org.tester`, `via: TESTER_EMAILS`). Retirer l'adresse de la variable coupe
l'accès à la page ; les abonnements de test déjà accordés se gèrent ensuite depuis
`/admin/abonnements`.
