# Étape 3 · A6 : nettoyage (26 octobre 2026)

1. **Vérification et structure gardées, sur le Modèle B.** La maquette n'a pas d'écran pour elles,
   mais leurs données et leurs droits existent (`org.verified_profile`, `org.teams`,
   `org.entities`). Plutôt que de les effacer, `/app/organisation/verification` (depuis la carte
   « Vérification » de Page entreprise) et `/app/organisation/structure` (depuis « Équipes et
   départements » sur Équipe) passent au Modèle B, sans script, réservées au propriétaire et aux
   administrateurs. `src/components/org/structure-tabs.tsx` (ancien design clair) est supprimé.
2. **Anciennes adresses.** Sur ordinateur, le propriétaire et les administrateurs d'une entreprise
   (formule de la famille Company) qui ouvrent `/app/abonnement`, `/app/abonnement/formules` ou
   `/app/abonnement/factures` arrivent sur « Formule et facturation » ; un retour du prestataire de
   paiement (`?paiement=`) reste sur l'ancienne page pour finir le paiement. Les autres membres, les
   organisations RH et le téléphone gardent les écrans validés à l'étape 2.
   `/app/parametres/consultations` mène les administrateurs au Journal des consultations sur
   ordinateur ; un autre membre y garde ses propres consultations. `/app/organisation/modifier` mène
   à Page entreprise (depuis A3). `/app/hire/modeles` reste l'écran des recruteurs ; les mêmes modèles
   se règlent aussi dans Réglages.
3. **Aucun lien mort.** Les liens « Organisation » et « Équipe » du menu du compte et des tuiles de
   Compte ne s'affichent qu'au propriétaire et aux administrateurs ; un autre membre qui ouvre
   `/app/hire/compte/equipe` ou `/app/hire/entreprise` sur ordinateur revient à son Compte.
4. **Page entreprise du talent au téléphone.** Elle montre l'équipe, puis les personnes qui disent
   travailler dans l'entreprise, avec « Indiqué par la personne » tant que l'entreprise n'a pas
   répondu (comme la vue publique de A3). Une personne écartée (« Ne travaille pas ici ») n'y est pas.
5. **Profils anonymes.** Une personne en mode anonyme n'apparaît plus parmi les membres déclarés, ni
   pour l'administrateur ni sur les pages : son nom resterait visible, ce que le mode anonyme interdit
   (règle d'or 5). Seuls les profils visibles des recruteurs sont proposés.
6. **Textes orphelins retirés** : `rhTeam.*` (ancienne Équipe) et `rhOrg.*` sauf `rhOrg.structure`.
   Les espaces `accountPage`, `notif` et `validation`, sans usage repéré mais antérieurs à
   l'étape 3, sont laissés : leur sort ne relève pas de ce lot.
