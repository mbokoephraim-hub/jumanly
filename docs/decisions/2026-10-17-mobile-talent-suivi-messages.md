# Mobile Talent v5 · Suivi, entretiens, messages et décisions (prompt 5)

Date : 17 octobre 2026.

## Décision

- **Nouveaux types de message.** `MessageKind` gagne `file` (document joint), `slot` (créneau
  proposé) et `decision` (refus ou embauche). Nouvelle table `MessageTemplate`, filtrée par
  `organizationId`. Migration additive `20261017015124_message_kinds_and_templates` ; retour
  arrière : `docs/ux-mobile-talent/retour-arriere/prompt-5-messages.sql` (les messages des nouveaux
  types redeviennent `text`, la table des modèles est supprimée).
- **Une décision n'est jamais une bulle.** Passer une candidature à « Non retenu » ou « Embauché »
  (menu d'étape ou glisser-déposer du tableau) ouvre l'aperçu du message
  (`/app/hire/candidats/[id]/message?modele=refus|acceptation`). Le recruteur voit exactement la
  carte que recevra le talent et rien ne part avant son clic sur « Envoyer ». Le refus sans message
  qui existait reste possible (« Enregistrer la décision sans message ») : aucune carte n'est alors
  envoyée, la notification habituelle part.
- **Texte par défaut.** Ordre : texte modifié dans l'aperçu, puis modèle de refus de l'offre, puis
  modèle de l'organisation (repères `{prenom}`, `{poste}`, `{entreprise}`, `{signataire}`), puis
  le texte par défaut de `textes/`.
- **« Pour rebondir ».** Sous la dernière carte de refus, côté talent seulement : offres proches
  réelles (`similarJobs`) et l'entraînement à l'entretien. Rien n'est inventé.
- **Entretiens depuis Suivi.** Confirmer un créneau proposé, ou proposer jusqu'à trois autres
  moments (statut `reschedule`, `proposedSlots` existants). La confirmation n'apparaît qu'après la
  réponse du serveur. « Rejoindre » suit la fenêtre existante `LINK_VISIBLE_HOURS` ;
  « Ajouter à mon agenda » télécharge un fichier `.ics`. Le fuseau d'un créneau envoyé dans une
  conversation est celui du dernier entretien de la conversation, sinon le fuseau par défaut.
- **Bouton + des messages.** Créneau, mon CV, ma lettre, un document de Career, un lien. Le talent
  n'envoie que ses propres documents ; le recruteur n'envoie jamais ceux du talent. La relance IA
  et « Écrire avec l'IA » sont des emplacements désactivés jusqu'au prompt 8.
- **Conversation comme les écrans 24 et 51.** Sur téléphone, côté talent : la barre du haut porte
  la flèche retour et le nom de l'interlocuteur (« Signaler » et « Bloquer » passent dans le menu
  « ⋯ »), plus de carte blanche autour du fil, bulles blanches avec l'heure dedans. Une invitation
  à un entretien devient une pastille « Entretien proposé · N créneaux · Voir » qui ouvre l'écran
  de confirmation ; le recruteur garde la carte complète. Le bandeau de sécurité reste.
- **Modèles Hire.** Nouvelle page `/app/hire/modeles` (entrée « Modèles » du menu Hire). Seuls les
  rôles qui gèrent les candidatures écrivent un modèle.

## Non fait (pas de donnée ou hors périmètre)

- « Accepter » une offre d'emploi (écran 53) : aucun modèle d'offre d'emploi n'existe.
- Réponses rapides (écran 24) et bouton « Plus chaleureux » (IA) : non affichés.
