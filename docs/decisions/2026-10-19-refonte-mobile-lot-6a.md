# Refonte mobile, lot 6a : choix et écarts (19 octobre 2026)

- **Projets.** Ils restent des documents `portfolio_item`, avec deux champs ajoutés dans le contenu
  (`visible`, `files`) et des fichiers servis par `/api/projets/[id]/[n]`. Ils restent soumis au
  droit `career.portfolio.level`. `/app/career/portfolio` ne garde qu'une redirection vers la
  section Projets de Mon profil.
- **Connexions** (nouvelle table `Connection`, migration additive `20261019180000_connections`) :
  la recherche ne montre que les talents dont le profil est visible des recruteurs ; une demande
  croisée est acceptée d'office ; retirer une connexion ne supprime rien (la conversation reste
  lisible, sans réponse possible) ; bloquer vaut dans les deux sens et seul l'auteur du blocage le
  lève ; un profil se signale (cible `profile`) seulement par une personne qui a un lien avec lui.
  La feuille d'options d'une personne (`?personne=`) n'est pas sur la planche : elle regroupe
  Écrire, Retirer, Signaler, Bloquer.
- **Preuve d'une compétence** : champ `ProfileSkill.proofRef` (migration additive
  `20261019181000_skill_proof_ref`) qui pointe vers une attestation ou un projet.
- **Apparence** : le choix clair/sombre passe dans Paramètres (la planche Compte ne l'a plus).
- **Aide** : la ligne mène à `/contact` jusqu'au lot 7, qui crée `/app/compte/aide`.
- **« Mes autres espaces »** : liste ajoutée à Compte pour les membres d'une organisation, les
  testeurs et les administrateurs, sinon ils n'auraient plus d'accès à leur espace.
- **Expérience** : la carte Orbi « reformuler » de la planche n'est pas faite (aucune fonction
  existante ne le fait).
- **Résumé** : la limite reste à 1 000 caractères, pas 300, pour ne couper aucun résumé déjà saisi.
- **Niveaux** : trois niveaux proposés ; « Expert » s'affiche seulement s'il est déjà choisi.
- **Seed** : quatre personnes fictives (`*.connexion@jumanly.test`) pour les connexions ; Grâce
  reste au forfait gratuit, ses projets sont donc verrouillés.
