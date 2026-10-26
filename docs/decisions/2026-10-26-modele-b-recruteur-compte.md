# Modèle B recruteur, M8 : compte, entreprise et changer de profil au téléphone

Date : 26 octobre 2026. Lot M8 de `docs/modele-b-recruteur/` (captures 135 à 179 et 185 à 192).
Choix faits sans attendre, au plus simple dans les règles d'or.

1. **Formule en lecture seule.** « Formule et usage » montre la formule, l'usage du mois et la
   comparaison des formules de la même famille (lues en base, jamais par leur nom). Un membre qui
   n'administre pas envoie « Demander {formule} à l'administrateur » : une notification
   `planRequested` aux administrateurs, rien d'autre. Un administrateur lit la même page et change
   de formule sur ordinateur.
2. **Proposer un collègue.** Un membre envoie une notification `colleagueProposed` aux
   administrateurs (personne n'est invité sans eux). Un administrateur invite tout de suite
   (invitation par e-mail, rôle Recruteur, sièges vérifiés). Cinq demandes au plus par jour et par
   membre, collègues et formules confondus.
3. **Réglage des notifications.** Les interrupteurs du recruteur sont rangés à côté de ceux du
   talent dans `notificationsMuted`, avec le préfixe `rh.` (`rh.applications`, `rh.interviews`,
   `rh.team`). « Nouveau message » reprend la catégorie `messages` du talent : une personne, une
   messagerie. Chaque écran enregistre ses interrupteurs sans toucher ceux de l'autre
   (`mutedAfter`). « Profil à fort potentiel » de la planche n'a pas d'événement : il n'est pas
   proposé. « Résumé par e-mail » devient « Par e-mail aussi » (le réglage e-mail existant).
4. **Qui voit votre téléphone.** Deux choix comme sur la planche : « Candidats en entretien » et
   « Équipe seulement » (valeur `nobody` : le téléphone n'est jamais montré aux talents). La
   valeur « Mes relations » choisie à l'inscription reste lisible et s'affiche comme « Candidats en
   entretien » dans le formulaire.
5. **Accroche proposée par Orbi.** Une phrase écrite à partir des domaines du profil, sans appel au
   modèle ni crédit ; la personne la relit avant d'enregistrer.
6. **Statistiques.** Calculées sur les offres que le membre peut lire (`jobScope`), sur 30 jours :
   délai de la première réponse écrite par un membre (changement d'étape, message, décision,
   demande de document, proposition), part des candidats qui ont reçu une réponse, entretiens
   confirmés ou faits. L'entonnoir compte, pour chaque étape, les candidatures qui l'ont atteinte ou
   dépassée ; un « Non retenu » ne compte que dans les reçues.
7. **Aide et contact.** Les questions fréquentes, puis un lien e-mail vers assistant@jumanly.io
   (pas de formulaire : les messages de contact partent par e-mail, aucun numéro de téléphone).
8. **Quitter l'entreprise.** Le rattachement passe à « removed », rien n'est effacé
   (candidatures, messages, profil), l'action est journalisée (`org.member.leave`) et la personne
   revient à son espace talent. Le propriétaire de la page la transmet d'abord sur ordinateur.
9. **Changer de profil.** Recruteur (profil actuel), talent (`switchSpace` vers l'espace
   personnel, l'espace talent du Modèle B tel quel, retour par ses paramètres), entreprise :
   l'administrateur ouvre « Agir au nom de l'entreprise » (`/app/hire/entreprise` : demandes pour
   rejoindre, chiffres, messages, offres, « Publier au nom de … ») ; les autres voient la page de
   l'entreprise. La confirmation des « nouveaux membres qui indiquent travailler chez … » (planche
   191) n'a pas de modèle de données : non construite, les demandes de rattachement s'affichent à
   la place. Le profil talent reste discret pour sa propre entreprise : la découverte et la
   recherche du téléphone excluent déjà les membres de l'organisation (M6).
10. **Page de l'entreprise.** La page du Modèle B talent (`PhoneCompany`) sert aussi au recruteur ;
    sur sa propre entreprise, un bandeau « Votre entreprise · page administrée par … » et
    « Publier au nom de … » au-dessus de la barre d'onglets. Les profils de membres gardent
    `PhonePerson`.
11. **Modèles de messages.** Lus au téléphone (texte de l'organisation ou de Jumanly, déplié d'un
    toucher) ; créés et modifiés sur ordinateur.
12. **Nettoyage.** Supprimés : la barre du bas de l'ancienne coque (`bottom-bar.tsx`),
    `hidesRecruiterTabBar` et ses tests, la partie téléphone de l'ancien Compte RH et sa règle CSS,
    quatre textes orphelins de `hireAccount`. Une fenêtre d'ordinateur rétrécie sous 768 px passe
    au Modèle B (`ViewSync` dans `RecruiterShell`). Les anciennes adresses du téléphone mènent aux
    écrans Modèle B : `/app/hire/entretiens` → Candidatures › Entretiens, `/app/hire/rapports` →
    Mes statistiques, `/app/organisation/equipe` → Équipe de recrutement. Gardés : l'en-tête
    `header.tsx` et `org-sheet.tsx` (servent à la tablette et à l'ordinateur), les règles
    `@media (max-width: 767.98px)` de `recruiter-web*.css` (elles gardent lisibles au téléphone
    les pages de l'administration d'entreprise, réservée au web, et les pages d'offre qui n'ont pas
    d'écran Modèle B), et les e2e `mobile-recruteur-*.spec.ts`, adaptés aux écrans Modèle B.
