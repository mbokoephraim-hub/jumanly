# Guide de Jumanly Admin

Ce guide explique, pas à pas, les gestes courants de l'administration de Jumanly. Il s'adresse au
propriétaire et à l'équipe, sans connaissance technique.

## Avant de commencer

- **Adresse** : `https://jumanly.io/admin`, avec un compte administrateur. La double
  authentification est obligatoire : gardez votre application d'authentification à portée de main.
- **Rôles** :
  - *Administrateur de la plateforme* : voit et fait tout.
  - *Support* : voit tout, ne modifie rien (les boutons d'action n'apparaissent pas).
  - *Éditeur de contenus* : ne voit que Formations et Contenus.
- **Le motif** : chaque action sensible (suspendre, offrir un forfait, refuser une offre, restaurer
  un contenu…) demande un motif. Écrivez une phrase claire : elle est gardée dans le journal d'audit
  et sert de mémoire à toute l'équipe.
- **La recherche** est la grande barre arrondie en haut à droite de chaque page : elle trouve un
  compte, une organisation, une offre ou une formation. La touche « / » y place le curseur.
- **Le menu** est une colonne flottante d'icônes, arrondie en haut et en bas, sur la gauche de
  l'écran. Passez la souris sur une icône (ou atteignez-la avec la touche Tab) : son nom apparaît
  dans une bulle. L'icône de la page ouverte est mise en avant. En bas de la colonne, votre
  avatar (nom et rôle en bulle) et le retour à l'espace utilisateur.
- **Le menu du haut** montre les autres pages de la même rubrique (par exemple « Forfaits et
  droits » et « Abonnements ») ; l'onglet ouvert est souligné. S'il y a trop d'onglets, faites-les
  glisser.
- **Sur tablette** (à partir de 768 px), la colonne et le menu du haut restent. **Sur téléphone**,
  le menu devient une pilule en dégradé en bas de l'écran ; le bouton « Toutes les rubriques »
  ouvre les autres, et la recherche est en haut. Un éditeur de contenus ne voit que Formations et
  Contenus.
- **Ce que vous modifiez se voit tout de suite** dans les pages des utilisateurs (forfaits, droits,
  formations, contenus, bandeaux…), sans redéployer : le détail est dans
  `docs/admin-v4/synchronisation.md`.

## Espace des utilisateurs (ce qu'ils voient)

Tous les forfaits ont la même présentation : la colonne d'icônes à gauche (Accueil, Learn, Career,
Jobs, Messages ; Hire et ses pages pour un recruteur ; licences et rapports pour un partenaire),
le menu du haut avec les pages de la rubrique, la recherche, les notifications et le compte en bas
de la colonne (profil, abonnement, paramètres, déconnexion). Le forfait change seulement les outils
ouverts : un outil fermé porte un petit cadenas dans le menu du haut. Sur téléphone, une icône
loupe ouvre la recherche.

## Lire les indicateurs (`Indicateurs`)

1. Choisissez la période (7, 30 ou 90 jours) en haut de la page.
2. Les quatre chiffres clés : utilisateurs actifs, revenu mensuel récurrent, passage du gratuit au
   payant, dépenses d'IA. La flèche compare à la période précédente.
3. « Ce qui demande votre attention » liste les urgences, de la plus importante à la moins
   importante. « Pourquoi ? » explique chaque alerte ; « Traiter » ouvre la bonne page.
4. « Forfaits utilisés » montre combien de comptes ont chaque forfait. Cliquez sur un forfait pour
   voir ses comptes.
5. Pour le coût d'acquisition et la marge : ouvrez « Coûts » et saisissez vos dépenses du mois
   (publicité, hébergement, IA, autres). Les indicateurs se calculent ensuite seuls.

## Vérifier un compte (`Utilisateurs`)

1. Cherchez la personne par son nom ou son e-mail, puis ouvrez sa fiche.
2. Regardez l'état du compte : e-mail vérifié ou non, double authentification, dernière connexion,
   organisations, attestations.
3. Si l'e-mail n'est pas vérifié : « Renvoyer l'e-mail de vérification » (un nouveau lien de confirmation). En dernier recours,
   « Marquer comme vérifié » (avec un motif).
4. Si la personne a perdu son mot de passe : « Envoyer un lien de réinitialisation ».
5. La carte « Droits et quotas » montre ce que son forfait permet et ce qu'elle a déjà consommé.

## Offrir un forfait ou des crédits (`Utilisateurs`)

1. Ouvrez la fiche du compte.
2. « Attribuer un forfait manuellement » : choisissez le forfait, la date de fin et le motif, puis
   « Offrir le forfait ». Le forfait offert se retire à tout moment depuis la même fiche.
3. « Ajouter des crédits » : choisissez le quota (par exemple les crédits d'IA), le nombre, la date
   de fin et le motif.

Rappel : candidater est toujours gratuit. Aucun forfait n'est nécessaire pour postuler.

## Gérer les abonnements (`Abonnements`)

Ouvrez un abonnement pour voir sa frise (créé, payé, renouvelé…). Vous pouvez le prolonger, changer
de forfait, le résilier ou enregistrer un paiement reçu par virement ou en espèces. Le client reçoit
un e-mail à chaque action.

## Vérifier une organisation (`Organisations`)

1. L'onglet « Vérification » liste les demandes en attente.
2. Ouvrez la fiche, consultez les justificatifs envoyés (chaque ouverture est journalisée).
3. Décidez : vérifier, refuser, ou « Demander un complément » (l'organisation reçoit votre message).
4. En cas d'abus, « Suspendre » ferme ses offres et son espace recrutement ; « Réactiver » les
   rouvre.

## Créer une formation de A à Z (`Formations`)

La page `Formations` s'appelle le **Studio formations** : chaque formation y est une carte avec
son statut, son nombre de modules, ses inscrits et son état de préparation. « Liste » donne la vue
en tableau.

1. **Choisir un modèle.** « Nouvelle formation », un titre, puis un modèle : *Formation courte*,
   *Parcours certifiant*, *Atelier pratique* ou *Partir de zéro*. Le modèle crée les modules et les
   leçons de départ, que vous renommez ensuite.
2. **Suivre les 7 étapes** de la colonne de gauche. Une coche verte marque une étape terminée ;
   « Étape suivante » en bas de page passe à la suivante. Pensez à enregistrer avant de changer
   d'étape.
   - *Informations* : titre, résumé, description, catégorie, niveau, durée, image de couverture.
   - *Public et objectifs* : à qui s'adresse la formation, prérequis, objectifs, compétences
     validées, niveau de forfait qui l'ouvre.
   - *Programme* : modules et leçons. Les flèches changent l'ordre ; « Modifier » ouvre la leçon à
     côté du programme (texte, vidéo, transcription, ressources, documents de la leçon).
   - *Documents* : les PDF à joindre (voir plus bas).
   - *Quiz* : les questions, le seuil de réussite et le nombre de tentatives.
   - *Attestation* : délivrer ou non une attestation, avec son aperçu.
   - *Publication* : le récapitulatif, le statut (brouillon, en relecture, publiée, archivée) avec
     un motif gardé dans l'historique, et les PDF de la formation.
3. **La carte « Prête à publier ? »** à droite donne un pourcentage et la liste de ce qui manque ;
   chaque point mène à la bonne étape. « Aperçu comme un talent » montre la formation telle qu'un
   apprenant la verra ; « Dupliquer » crée une copie en brouillon.

### Joindre des PDF (étape Documents)

- Choisissez un fichier PDF (4 Mo au plus, sans mot de passe), un titre et un type : support de
  cours, fiche d'exercices, lecture, modèle à remplir, corrigé ou autre.
- **Rattaché à** : toute la formation, ou une leçon précise.
- **Qui peut le télécharger ?** Tout le monde (il apparaît sur la fiche publique), les inscrits dont
  le forfait ouvre la formation, ou l'équipe Jumanly seulement. Un corrigé reste toujours à
  l'équipe.
- **Réservé aux forfaits avec ressources spécialisées** : seuls les comptes qui ont ce droit le
  téléchargent.
- Chaque document se réordonne, se renomme, se remplace par un nouveau fichier ou se supprime. Le
  nombre de pages et de téléchargements s'affiche sous son titre.

### Les PDF que Jumanly fabrique (encart « PDF de la formation »)

Ils sont faits à la demande à partir du contenu actuel, aux couleurs de Jumanly :

- **Programme** : objectifs, public, prérequis, modules et leçons avec leur durée, compétences. Les
  visiteurs le téléchargent aussi depuis la fiche publique.
- **Support de cours complet** : toutes les leçons en un fichier, pour lire hors connexion. Les
  inscrits le téléchargent depuis le lecteur.
- **Quiz et corrigé** (équipe) : questions, bonnes réponses et explications.
- **Aperçu de l'attestation** (équipe) : l'attestation avec un nom d'exemple et la mention
  « Aperçu ».
- **Bilan de la formation** (équipe) : inscrits, achèvement, où s'arrêtent ceux qui n'ont pas
  terminé, notes moyennes des quiz, attestations ; choisissez la période. Aucun nom n'y figure.

Chaque téléchargement par l'équipe est inscrit dans l'historique de la formation.

## Modérer les offres (`Modération des offres`)

1. La file présente d'abord les offres les plus sensibles, puis les plus anciennes. Les touches J et
   K passent d'une offre à l'autre.
2. Lisez l'avis du contrôle automatique et son « Pourquoi ? ». C'est une aide : vous décidez.
3. Trois décisions :
   - **Approuver** : l'offre est en ligne.
   - **Demander une correction** : cochez les points à revoir et écrivez un motif. Le recruteur
     corrige et renvoie l'offre, qui revient dans la file.
   - **Refuser** : avec un motif, que le recruteur reçoit.

## Traiter un signalement (`Signalements`)

1. Ouvrez le signalement le plus haut de la file (le plus grave).
2. Lisez le contenu signalé. Pour un message, « Lire le contexte » montre deux messages avant et
   deux après ; cette lecture est journalisée.
3. Ajoutez une note interne si vous attendez un avis.
4. Clôturez avec une décision et un motif : classer, avertir l'auteur ou masquer le contenu. La
   personne qui a signalé est informée. Pour aller plus loin, « Suspendre l'auteur » ouvre sa
   fiche.

## Partenaires (`Partenaires`)

1. « Nouveau partenaire » : l'organisation et l'e-mail de son responsable, qui reçoit une
   invitation.
2. « Nouveau lot de licences » après la signature du contrat : forfait, nombre de licences, durée,
   dates, référence et montant du contrat, motif.
3. Cliquez sur un lot pour ouvrir sa fiche : licences utilisées, restantes, expirées, et l'impact
   des bénéficiaires. Tout chiffre qui concerne moins de 10 personnes est masqué.
4. « Prolonger le lot » recule la fin du contrat ; « Modifier le lot » change son nom, sa référence
   ou son montant.

## IA et matching (`IA et matching`)

- « Consommation » : appels, crédits et personnes par fonction et par forfait, coût estimé.
- « Coût par forfait » : une alerte apparaît quand l'IA coûte 30 % du prix d'un forfait ou plus.
- Budget du mois : facultatif, il se règle dans la variable `AI_MONTHLY_BUDGET_USD` de Vercel.
- Les modèles d'IA se règlent uniquement dans les variables `AI_MODEL_DEFAULT` et `AI_MODEL_FAST`.
- « Poids du matching » change l'importance des critères du score (avec une note) ; « Révisions
  humaines » liste les scores contestés par des talents, à confirmer ou corriger.

## Contenus (`Contenus`)

- **FAQ** : modifiez une question, masquez-la ou ajoutez-en une, avec un motif.
- **Bannières** : un message en haut du site ou de l'espace connecté, avec des dates.
- **Conseils de préparation** : écrivez les fiches pratiques (titre, texte, temps de lecture),
  cochez « Publier » pour qu'elles s'affichent aux talents dans Career.
- **Versions précédentes** : chaque enregistrement garde la version d'avant. « Restaurer cette
  version » la remet en ligne (avec un motif) ; la version remplacée est gardée elle aussi.

Les textes de l'interface (boutons, titres…) ne se modifient pas ici : ils sont dans
`textes/textes-application.md` et changent avec une mise en ligne.

## Journal d'audit (`Journal d'audit`)

Toutes les actions de l'administration y sont : qui, quoi, quand et pourquoi. Filtrez par famille
(comptes, organisations, forfaits…) ou par personne, ouvrez une ligne pour voir le détail, et
exportez la sélection en CSV si besoin.

## Contact

Pour toute question : assistant@jumanly.io ou infojumanly@gmail.com.
