# Refonte mobile, lot 4 : choix et écarts (19 octobre 2026)

- **Pièces jointes figées à l'envoi.** Le recruteur voit les attestations et documents tels qu'ils
  étaient quand la personne a postulé (`Application.attachments`, JSON). Migration additive.
- **CV adapté à une offre.** `CareerDocument.adaptedForJobId` (additif) pour proposer ce CV en
  premier quand on postule à cette offre.
- **Pas de case de consentement à l'envoi.** La planche n'en montre pas ; la vérification rappelle
  ce qui sera partagé. Le consentement au matching reste dans les paramètres.
- **Notification « profil consulté »** (`profileViewed`) : ajoutée parce que la planche la montre ;
  envoyée à la première consultation d'une candidature.
- **Équipes de recrutement et partenaires.** `/app/messages` et `/app/notifications` sont partagés :
  ces comptes gardent leur écran actuel, déplacé en composants dans `src/components/connect/`.
  Le code talent qui y reste est supprimé au lot 7.
- **Accueil « Entretiens »** (liste des entraînements) : traité au lot 6 avec la carrière.
- **Pas de conversation « Équipe Jumanly »** : le modèle de données n'a pas de conversation avec
  la plateforme ; le support reste dans l'aide.
- **Signaler** se fait sur la conversation (options), pas sur chaque message.
- Une ancienne capture locale (ancien design) a été retirée ; elle n'était pas suivie par git.
