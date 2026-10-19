# Refonte mobile, lot 3 : choix et écarts (19 octobre 2026)

1. **Domaine = secteur de l'entreprise.** Les offres n'ont pas de domaine ; le filtre « Domaine »
   propose les quatre secteurs qui ont le plus d'offres ouvertes. Pas de puce « Autre ».
2. **Lieu** : les deux villes qui ont le plus d'offres ouvertes, plus « À distance » (télétravail
   complet). **Expérience** : trois valeurs, comme la planche (sans expérience, junior, confirmé).
3. **Enregistrées devient un onglet d'Offres.** `/app/jobs/enregistrees` redirige. Les offres
   fermées restent listées après les ouvertes, atténuées ; plus de bouton « Retirer les offres
   fermées » (aucune donnée n'est supprimée sans geste de la personne sur l'offre).
4. **Blocs gardés en plus de la planche** sur le détail : « Le poste » (description), critères du
   recruteur (information, jamais bloquants), avantages, étapes du recrutement, salaire quand il
   est indiqué. **Retirés** : offres similaires, carte de l'entreprise, nom du recruteur, nombre
   de candidats. Le nom de l'entreprise mène à sa page publique.
5. **« Ajouter » une compétence manquante** ouvre la section Compétences du profil : le niveau est
   demandé à la personne, rien n'est ajouté à sa place. « Une réalisation chiffrée » de la planche
   n'est pas affichée : aucune donnée ne permet de la proposer honnêtement.
6. **Bannières et logos** : l'image de l'entreprise si elle en a une, sinon un des quatre motifs
   des planches, toujours le même pour une entreprise, et ses initiales.
7. **Pas de recherche sur Pour moi**, comme la planche ; la recherche reste sur Offres et Apprendre.
8. **Textes de l'ancien Pour moi et de l'ancienne liste d'offres** (`talent.forMe.*`,
   `talent.jobs.search.*`…) laissés dans `textes/` jusqu'au lot 7, où les textes morts seront
   retirés en une fois.
