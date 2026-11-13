# Hire v3, lot V3-6 : équipe, aide, formule, écarts avec le prototype

Date : 14/11/2026.

- **Équipe** : membres et places de la formule (`org.seats`), charge de la semaine comptée en choses à faire (entretiens de la semaine et tâches ouvertes par type), pas en heures : on ne mesure pas le temps passé. « Qui suit quelle offre » montre le responsable (attribution de l'offre, sinon la personne qui l'a créée) ; il n'existe pas de rôle « évaluateur » par offre en base. Les suggestions d'Orbi pour rééquilibrer la semaine ne sont pas affichées, faute de calcul réel. « Inviter un membre » et « Attribuer » ouvrent les formulaires existants de l'équipe de l'entreprise. Le journal des consultations (réservé aux administrateurs) lit `profile.view` ; la « raison » est la candidature ou la recherche de talents.
- **Aide** : la recherche est un formulaire simple. Seules les questions vraies aujourd'hui sont gardées (pas de tests, pas d'agenda Google / Outlook, pas de suivi automatique). « Nous écrire » ouvre la messagerie de l'utilisateur vers assistant@jumanly.io, sans numéro de téléphone ; il n'y a pas d'historique des demandes en base.
- **Formule** : lue depuis la facturation de l'entreprise (`orgBillingScreen`), réservée aux administrateurs. Les factures PDF viennent de la facturation existante.
- **Profil, Réglages et Page entreprise** : les écrans actuels restent en place. La page entreprise a été validée par Ephraïm (« très bien ici ») ; le profil sera aligné sur le prototype dans un lot de finition.
