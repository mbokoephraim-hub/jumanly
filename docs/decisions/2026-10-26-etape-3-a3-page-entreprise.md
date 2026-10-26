# Étape 3 · A3 : Page entreprise (26 octobre 2026)

Captures 081 (modifier) et 082 (vue publique) de `docs/modele-b-recruteur/web/`.

1. **Adresses.** `/app/organisation` est l'écran « modifier » ; la vue publique est
   `/app/organisation/apercu` (onglets `?onglet=apropos|membres|offres`). `/app/organisation/modifier`
   mène à `/app/organisation`. Réservé au propriétaire et aux administrateurs, comme Équipe.
2. **Bannière et logo.** La maquette ne montre que les boutons. La fenêtre sombre choisit une image,
   la montre, puis l'enregistre : le serveur la recadre au centre (3:1 ou carré). Le cadrage à la main
   de l'ancien éditeur clair n'est pas repris, pour rester sur le Modèle B ; il reste dans l'éditeur
   d'offre. Sans image, la bannière garde la couleur choisie à l'inscription (A1).
3. **Badge « Recrute en ce moment ».** Nouveau champ `Organization.hiringNow` (migration additive
   `company_page_hiring_now`). Il s'affiche sur la vue publique, sur la page publique
   `/entreprises/[slug]`, et fait passer l'entreprise en tête dans Explorer (entreprises qui recrutent).
4. **Champs.** Ceux de la maquette : nom, secteur, taille, ville, site, à propos. Le site s'écrit
   sans `https://` (« baobabfintech.cd »), il est complété à l'enregistrement. La raison sociale, le
   type, le pays et l'e-mail de contact ne sont plus affichés mais restent en base, inchangés. Les
   tailles sont celles de l'inscription (A1) ; une taille écrite par un ancien écran reste proposée.
5. **Membres de la vue publique.** L'équipe active est « Confirmé par {entreprise} ». Les personnes
   qui indiquent travailler dans l'entreprise apparaissent avec « Indiqué par la personne » tant que
   personne n'a répondu, « Confirmé par » une fois confirmées, et disparaissent avec « Ne travaille
   pas ici ». Les profils privés n'y sont jamais. La page Entreprise du téléphone (côté talent) garde
   pour l'instant la seule équipe active : la reprendre est noté pour A6.
6. **Vérification.** Une carte à droite donne l'état. Si l'entreprise n'est pas vérifiée, le bouton
   mène à la demande existante (`/app/organisation/verification`), qui sera passée au Modèle B ou
   remplacée en A6 avec la structure (équipes, départements).
7. **Transfert de propriété.** Absent de la maquette, promis en A2 : une carte « Propriété de la
   page » pour le seul propriétaire, avec une fenêtre de confirmation. L'ancien propriétaire devient
   administrateur (recruteur sous le niveau de permissions « basic »).
8. **Journal.** Chaque publication de la page est notée au journal d'audit (`org.page.update`).
