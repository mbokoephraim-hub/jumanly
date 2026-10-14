# Design system aligné sur les maquettes (lot 1)

Date : 14 octobre 2026

## Contexte

Le propriétaire a fourni `docs/maquettes/` : maquettes page par page qui font foi pour le visuel.
Le lot 1 aligne le socle (jetons, composants, icônes, gabarits) sur les cinq planches du design system.

## Écarts assumés par rapport aux maquettes

- **Bouton « Danger » et textes d'erreur** : le Corail `#E25C4B` avec du texte blanc n'atteint pas
  le contraste AA (règle d'or 10). Le bouton garde le Corail foncé `#A3301F` ; les messages d'erreur
  utilisent `#B23A2B`, la teinte des maquettes pour le texte.
- **Pastille « Entreprise vérifiée »** : contour et texte en Feuille foncé (`#22662F`) au lieu de
  Feuille, pour le contraste du texte de 11 px.
- **Icônes manquantes** : menu, œil barré, info, alerte et flèche retour n'existent ni dans les 41
  icônes de la marque ni dans les 23 complémentaires. Elles sont dessinées dans la même grammaire
  (24 px, trait 2, bouts ronds) dans `ressources/icones/interface/`.
- **En-tête public** : les sept rubriques ne tiennent sur une ligne qu'à partir de 1 280 px ; en
  dessous, menu déroulant (comme sur mobile). Le soulignement de la rubrique active est calculé
  dans le navigateur : les pages prérendues affichent d'abord la liste sans soulignement.
- **Menu du compte** : il suit la maquette (profil, abonnement, quotas, attestations, paramètres,
  matching, licence, déconnexion) ; « Aide et FAQ » en sort, la FAQ reste dans le pied de page.
- **Taille de l'orbe IA** : propriété `size` en pixels (24 par défaut, comme dans les maquettes).
