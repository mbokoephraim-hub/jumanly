# Admin v2 · étape 7 : écarts et choix

- **Contexte d'un message signalé** : le plan demande « les messages autour ». Pour rester au plus
  près de la règle de confidentialité, il s'agit de deux messages avant et deux après, affichés
  seulement quand le modérateur clique « Lire le contexte », et chaque lecture est écrite dans le
  journal (`report.context`). Le reste de la conversation n'est jamais lu.
- **Historique des échanges** d'une offre : tiré du journal d'audit (publication, correction
  demandée, renvoi, refus, approbation) plutôt que d'une nouvelle table.
- **Notes internes** : écrites dans le journal d'audit (`report.note`) ; elles font passer le
  signalement « En cours ».
- **Une offre renvoyée après correction** repasse toujours par un modérateur, même si le contrôle
  automatique ne trouve plus rien.
- **Clôture** : les autres signalements ouverts sur le même contenu sont clôturés avec la même
  décision et le même motif, et chaque personne qui a signalé est informée.
- « Suspendre l'auteur » ouvre la fiche utilisateur (étape 3), où la suspension demande son motif :
  pas de deuxième chemin de suspension.
