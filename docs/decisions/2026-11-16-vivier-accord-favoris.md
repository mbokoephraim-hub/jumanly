# Vivier Hire v3 : favoris, relances et date d'accord

Date : 2026-11-16

Le prototype v3 (`V.vivier`) montre des favoris, des talents « relancés » et une date d'accord
(« Accord Mars 2027 », « à renouveler »). Aucune de ces données n'existait.

- **Favoris** : champ `favoriteAt` sur `TalentPoolEntry`. Un talent peut être dans plusieurs
  viviers ; le cœur marque toutes ses entrées dans les viviers que le membre voit, pour que la carte
  (une par talent) reste cohérente.
- **Relancés** : on n'invente pas de nouvel historique. Un talent est « relancé » quand
  l'organisation lui a envoyé une proposition de contact encore en attente ; le nombre de jours
  part de la dernière relance, sinon de l'envoi.
- **Date d'accord** : le brief MVP (M8) fixe une conservation de 24 mois puis une demande de
  renouvellement. On affiche donc la fin de l'accord : entrée dans le vivier (ou acceptation d'une
  proposition, si elle est plus récente) + 24 mois. « À renouveler » : moins de 3 mois restants,
  comme le critère « À renouveler sous 3 mois » du prototype. La demande de renouvellement
  elle-même (e-mail, retrait automatique) relève du lot M8 et n'est pas faite ici.
- **Ville** : la ville du compte, seulement quand le nom du talent est visible.
- « Écrire » n'apparaît que si une conversation existe déjà (candidature ou proposition acceptée) :
  sans accord, aucun message ne part.
