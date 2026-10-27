# Confirmation de l'adresse e-mail par un lien (27/10/2026)

Décision d'Ephraïm : à l'inscription, plus de code à 6 chiffres à recopier. Un e-mail contient un
bouton « Confirmer mon adresse » qui ouvre Jumanly connecté.

- Spec partie 10 § 10.1 prévoyait un code de 15 minutes. Le lien vaut 24 heures (jeton signé de
  Better Auth), pour laisser le temps d'ouvrir sa boîte sur un autre appareil.
- Le lien peut être ouvert sur un autre appareil que celui de l'inscription : la suite du parcours
  est déduite du compte (organisation, profil recruteur), le forfait choisi voyage dans le lien.
- Un lien ouvert une deuxième fois mène à la connexion (« adresse confirmée »).
- Codes conservés : mot de passe oublié, vérification en deux étapes.
