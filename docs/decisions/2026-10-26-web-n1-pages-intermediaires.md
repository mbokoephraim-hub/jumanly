# Recruteur sur ordinateur · N1 : pages pas encore refaites

**Contexte.** Le lot N1 pose le cadre sombre du Modèle B (barre latérale, barre du haut, Orbi) sur
toutes les pages du recruteur, alors que leurs contenus sont refaits aux lots N2 à N7.

**Décision (option la plus simple).**
- Les pages pas encore refaites gardent leur contenu ; leurs couleurs claires prennent les valeurs
  sombres déjà utilisées au téléphone (`recruiter-b.css`, contrastes WCAG AA).
- « Fil » mène à `/app/hire/fil` et « Talents » affiche la recherche de talents dans le cadre (plus
  de renvoi vers Candidatures) : la colonne du téléphone, centrée, jusqu'à N2 et N5.
- Le menu de l'avatar disparaît : « Espace talent » et « Se déconnecter » restent dans Compte
  (`/app/hire/compte`), refait au lot N7. Les specs `web-recruteur-1`, `-3` et `web-admin-nettoyage`
  vérifient désormais la barre latérale.
