# 2026-10-14 · Hire, Connect et modération (E4)

Statut : accepté.

1. **Espace actif dans un cookie** (`jm_space`) : « personal » ou l'identifiant d'une
   organisation. Il est revérifié contre les adhésions actives à chaque requête ; sans cookie, un
   membre d'organisation arrive dans son organisation. Une conversation ouverte depuis le mauvais
   espace propose de changer d'espace au lieu d'afficher son contenu.
2. **Modération légère** : une offre est publiée tout de suite, sauf si la vérification
   automatique trouve un paiement demandé, un critère protégé ou un contact hors plateforme. Elle
   passe alors « En vérification » et occupe déjà une place d'offre active. Une offre en ligne
   modifiée repasse les mêmes contrôles.
3. **Rejet toujours humain** : « Non retenu » passe par un formulaire dédié (motif interne,
   message modifiable, envoi ou non). Le déplacement simple ne peut pas aller vers « Non retenu ».
   Les critères éliminatoires sont affichés comme « à vérifier », jamais calculés ni bloquants.
4. **Pipeline sans JavaScript** : chaque carte a un petit formulaire « Déplacer », utilisable au
   clavier et sur réseau lent. Le glisser-déposer viendra en complément, pas en remplacement.
5. **Demandes de document** : la réponse est un des CV du talent, copié dans le message comme pour
   une candidature. Le dépôt de fichiers (diplômes, pièces) attend le stockage de fichiers.
6. **Notes d'équipe** : des événements de l'historique de la candidature, filtrés côté talent
   (seuls « envoyée », « consultée », « étape », « décision » et « retirée » lui sont montrés).
7. **Reportés** : entretiens et agenda, grilles d'évaluation, viviers et recherche de talents
   (E8), poids des critères et score (E6), étapes personnalisées et attribution des offres aux
   responsables, équipes, départements et entités, vérification de l'organisation.
8. **Sur les pages en flux continu**, une offre ou une candidature d'une autre organisation
   affiche la page « introuvable » avec un statut 200 (le statut est déjà envoyé) ; aucune donnée
   n'est rendue, ce que vérifient les tests.
