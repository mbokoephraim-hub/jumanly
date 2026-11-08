# Recruteur sur ordinateur = recruteur au téléphone (Modèle B) + outils du grand écran

Date : 08/11/2026. Demande d'Ephraïm : « faire de même dans la partie recruteur sur ordinateur, tout
en développant ici une interface approfondie avec d'autres outils ».

## Choix

- `isModelB()` (`src/server/phone-routes.ts`) vaut vrai partout sauf pour un partenaire : les pages
  recruteur (`/app/hire/*`) montrent leurs écrans du téléphone sur ordinateur aussi.
- Le layout donne au recruteur sur ordinateur le cadre du téléphone (`PhoneShell set="recruteur" wide`) :
  Fil · Offres · Agenda · Talents · Chat dans le menu debout à gauche.
- Sous les onglets, deux groupes propres au grand écran (`RecruiterToolsNav`) :
  - **Outils** : Rapports, Modèles de messages ;
  - **Entreprise** (propriétaire et administrateurs seulement) : Équipe, Page entreprise, Formule et
    facturation, Journal, Réglages. Ces pages restent réservées à l'ordinateur.
- Restent propres à l'ordinateur : `/app/hire/rapports` (le téléphone garde « Mes statistiques »),
  `/app/organisation/*`, et le journal d'équipe (l'ancienne adresse `/app/parametres/consultations`
  y mène encore pour un administrateur).
- Le générique d'entrée n'est plus joué que pour un partenaire.
- Fonction manquante ajoutée au téléphone : l'avis « La modération demande une correction » en tête
  de l'offre, avec « Corriger l'offre » (dernière étape).

## Étapes suivantes (une PR chacune)

2 Fil et « À traiter » · 3 Offres (tableau à glisser, comparer) · 4 Fiche candidat · 5 Agenda ·
6 Talents et viviers · 7 Chat côte à côte · 8 Compte, rapports, nettoyage, bilan.

## Tests

- Tests de l'ancien écran recruteur d'ordinateur retirés : `web-recruteur-1..4`, `mobile-recruteur`,
  `mobile-recruteur-candidats`, `mobile-recruteur-entretiens` (couverts par `modele-b-recruteur-*`).
- Les parcours communs (`hire`, `hire-advanced`, `mobile-recruteur-ats|gerer|offres`, `moderation`)
  suivent maintenant le chemin du téléphone sur ordinateur aussi.
