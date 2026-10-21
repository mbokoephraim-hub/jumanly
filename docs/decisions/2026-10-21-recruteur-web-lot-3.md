# Recruteur web lot 3 : choix et écarts (21 octobre 2026)

Planche `docs/refonte-web/recruteur-3`. Le téléphone ne change pas (comparaison au pixel près).

1. **« Demander à Orbi » (`Ctrl K`) ouvre le panneau Orbi à droite** (`?orbi=1`), comme chez le
   talent, au lieu de la page `/app/orbi`. Le lien « Orbi » de la barre latérale mène toujours à
   la page, avec l'historique à gauche. Le panneau du recruteur parle au nom de l'organisation :
   crédits de l'organisation, conversation rangée dans l'organisation, actions du recruteur
   (`orbiPanelAction` choisit selon l'espace actif). L'appel passe par les mêmes contrôles
   (consentement, droit, quota, `AiUsage`).
2. **Le résumé du jour sous la cloche** est rendu par le cadre (`hireToday`, filtré par
   organisation) : il se met à jour à chaque navigation, pas en direct.
3. **L'avatar ouvre un menu sur ordinateur et tablette** ; sur téléphone il mène toujours à la
   page Compte RH. « Passer à mon espace talent » et « Se déconnecter » sont des formulaires.
4. **Messagerie** : sur un grand écran, `/app/messages` ouvre la première conversation (comme le
   talent, `AutoSelect`), sauf filtre, recherche ou message de confirmation. La liste est rendue
   aussi (cachée) dans la page d'une conversation sur téléphone : un doublon caché, comme au lot 2.
   La colonne « Candidature » ne montre que des données déjà visibles par l'organisation
   (candidature filtrée par `organizationId`) ; ouvrir le dossier enregistre la consultation comme
   avant. « En ligne · répond en… » et le fil « écrit… » de la planche ne sont pas ajoutés : pas
   de donnée de présence côté recruteur dans cette vue.
5. **Organisation** : les « Sites » et les « Photos des bureaux » de la planche n'existent pas dans
   le modèle ; ni ajoutés, ni inventés. Le délai de réponse de la planche est remplacé par les
   chiffres existants (offres, candidatures, recrutés, membres).
6. **Équipe** : la colonne « Offres » compte les offres publiées confiées au membre
   (`Job.assignedToId`). La matrice « Qui peut faire quoi » vient toujours de `hirePermissions`.
7. **Paramètres** : les rubriques sont celles qui existent (Notifications, Messagerie et rappels,
   Apparence et Orbi, Sécurité, Journal des consultations, Confidentialité, Mes données). « Fuseau
   horaire » et « Signature des messages » de la planche ne sont pas construits (décision du lot
   5 : pas de réglage en base). Les rubriques du talent sont inchangées ; la page « Messagerie et
   rappels » prend le cadre des paramètres web pour les deux espaces.
8. **Formules RH** : pas de bascule Mensuel/Annuel, absente de l'écran du téléphone (lot 5) ;
   elle viendra avec lui. Les prix viennent de la base.
9. **Rapports** : les cartes se rangent en deux colonnes qui se remplissent l'une après l'autre
   (CSS `columns`), l'ordre de lecture reste celui du téléphone.
10. **Premiers pas** : « Hire » à côté du logo et l'accueil en bandeau n'apparaissent qu'à partir
    de 768 px. L'aperçu « sur une offre » de l'étape 2 n'est pas ajouté.
11. **Notifications** : la mise en page en deux colonnes ne vaut que pour l'espace recruteur ; la
    page du talent garde la sienne (enveloppes neutres `t-rw3-nw`).
