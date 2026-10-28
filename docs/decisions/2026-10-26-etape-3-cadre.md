# Étape 3 : cadre de l'espace administrateur sur ordinateur

Date : 26 octobre 2026. Lot A0 de l'étape 3 (`docs/modele-b-recruteur/`, lots A1 à A6).

Constat : sur ordinateur, l'appli du recruteur (`RecruiterShell`) n'a pas été refaite sur le
Modèle B. L'étape 2 n'a refait que le téléphone, à la demande d'Ephraïm. Elle propose un mode
clair et un mode sombre.

Choix, au plus simple :

1. **Même appli.** L'administrateur garde l'appli du recruteur. La barre latérale reçoit une
   partie ENTREPRISE (Équipe, Page entreprise, Formule et facturation, Journal, Réglages), affichée
   seulement pour `org_owner` et `org_admin`. Ces pages vivent sous `/app/organisation/*`.
2. **Tout en sombre.** L'espace recruteur sur ordinateur s'affiche en sombre (« tout est en
   sombre »), quel que soit le réglage d'apparence. Son mode sombre existe déjà et suit les
   couleurs du Modèle B (fond nuit, lime réservé aux actions). Aucun écran recruteur n'est
   redessiné.
3. **Web uniquement.** Sous 768 px, `/app/organisation/*` affiche « À ouvrir sur un ordinateur ».
   Seules restent ouvertes l'acceptation d'une invitation (`/app/invitation/[token]`) et la réponse
   à une demande de rattachement (notifications du téléphone).
4. **Écrans recruteur de la maquette (accueil, tableau de bord, candidatures, agenda et offres de
   l'équipe) :** ils gardent leurs écrans actuels, qui ne sont pas dans les lots A1 à A6.
