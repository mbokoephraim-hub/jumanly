# Modèles de refus et d'acceptation en trois tons (prompt 5 bis)

Date : 17 octobre 2026.

## Contexte

Le cahier des charges V7 demande des modèles de refus et d'acceptation bien écrits, en tons
Chaleureux, Formel et Court, avec des champs qui se remplissent seuls (prénom, poste, point fort),
toujours proposés et envoyés seulement après le clic du recruteur (écrans 55 et 80).

## Décisions

- Les trois tons sont des textes Jumanly dans `textes/textes-application.md`, pas des modèles en
  base : ils se traduisent avec l'interface et ne coûtent rien à l'organisation. Le modèle propre à
  l'organisation (ou le texte de refus de l'offre) reste prioritaire et apparaît comme « Notre
  modèle ».
- Le point fort est calculé, jamais inventé : la compétence de l'offre que le candidat couvre
  entièrement, d'après l'explication de matching figée à la candidature (vérifiées puis
  obligatoires d'abord). Il n'est proposé que si l'organisation a accès au matching
  (`hire.matching.level` différent de `none`). Sans point fort, la phrase est retirée.
- « Plus chaleureux » (écran 55) change de ton ; ce n'est pas un appel au modèle d'IA. La
  personnalisation par Orbi reste un emplacement inactif jusqu'au prompt 8.
- « Ajouter un créneau » (écran 80) réutilise les entretiens : un appel audio de 30 minutes avec un à
  trois créneaux, envoyé juste après la carte de décision, que le talent confirme ou déplace comme
  tout entretien. `scheduleInterview` accepte donc une candidature retenue (`hired`) en plus des
  candidatures actives. Les créneaux sont vérifiés avant d'enregistrer la décision : s'ils sont
  passés, rien ne part.
- Sur téléphone, la navigation Hire en pilule couvrait la barre d'actions (la page est dans un
  contexte d'empilement à cause de son animation d'entrée). Un petit composant client marque le
  corps de page tant que l'écran est affiché ; la navigation s'efface alors.

## Écarts avec la maquette

- Le refus garde le motif interne (obligatoire) et le rappel sur l'IA, absents de l'écran 55.
- « Modifier le texte » existe aussi sous l'acceptation, pour corriger le texte à la main.
