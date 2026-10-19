# Refonte mobile · lot 2 : connexion, inscription, premiers pas

Date : 19 octobre 2026

## Décisions

1. **Une seule case à cocher** (conditions et confidentialité) à l'inscription, comme sur la
   planche. L'âge minimal et le fonctionnement d'Orbi sont rappelés juste en dessous ; le
   consentement IA (`aiConsentAt`) reste enregistré à l'inscription et se retire dans Compte.
2. **« Prénom et nom » dans un seul champ**, découpé au premier espace (`splitFullName`).
3. **Pays et ville des talents demandés aux premiers pas** (étape 3 sur 4), pas à l'inscription.
   Les recruteurs les donnent toujours à l'inscription (organisation). Un talent qui passe l'étape
   choisit son pays plus tard dans Compte.
4. **Mot de passe oublié par code à 6 chiffres** (better-auth emailOTP), limité à 5 demandes par
   quart d'heure. Les liens de réinitialisation déjà envoyés restent valables.
5. **Durée de validité du code : 15 minutes** (la planche dit 10) pour garder la même règle que la
   vérification d'e-mail ; à ajuster dans un seul endroit si besoin.
6. **Formule payante choisie sur /tarifs** : le talent répond d'abord aux questions, puis règle à
   l'étape 4 (« Continuer vers le paiement ») ou commence gratuitement.
7. **Inscription Google/LinkedIn/Apple d'un talent** : passage par `/inscription/continuer`, qui
   prépare le compte puis ouvre les premiers pas.
8. **Indicatif téléphonique des pays** (`Country.dialCode`) reporté au lot 7 : seul le numéro Mobile
   Money l'utilise.
