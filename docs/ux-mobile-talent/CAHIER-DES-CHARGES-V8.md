# Expérience mobile Talent, RH et entreprise · version 8 (17 octobre 2026)

Complète `CAHIER-DES-CHARGES-V7.md` et l'emporte sur lui là où ils diffèrent. Maquettes : écrans 81 à 94 et
planche « 0e · Pays, drapeaux et villes » de `maquette/mobile-talent.html`.

## A. Ma demande (texte dicté, non retouché)

> mais tu n'as pas montré euh, euh, voilà comment on arrive à comment ça affiche quand on veut exporter un document, quand on veut exporter une image pour mettre ça en avant et comment l'utilisateur, un autre utilisateur peut voir, peut rechercher une autre personne. Dans le plus là, quand on va cliquer sur l'option plus, c'est là qu'on va trouver les connexions. C'est là qu'on va trouver euh, mettre en avant une chose. C'est là qu'on va trouver euh, euh, découvrir le profil suggéré. C'est là que voilà, le matching proposera. Le matching proposera les différents, euh, les différents profils qui sont dans le même domaine que vous et les différents recruteurs. Donc ça peut être comme ça. Ça permet une meilleure facilitation de connexion. C'est vraiment ce que l'on veut, faciliter la connexion. Et euh, pas non plus pour tous. Hein. Donc seulement pour ceux qui payent notre euh, logiciel. Quoi. Comment on recherche un candidat et comment on recherche un profil pour la connexion. On n'écrit pas à quelqu'un sans connexion. La personne doit accepter la connexion pour qu'il y ait contact. Et, euh, par exemple, connexion établie, comment ça affiche? On doit prévenir qu'une connexion a été établie dans les notifications. Euh, quand la connexion est établie, laissez un message par exemple. Et aussi, dans la partie où, quand on se connecte pour la première fois, il faudrait que la personne précise également son pays. Et quand on cliquera sur euh, pays, on doit pouvoir voir les drapeaux de chaque pays et leur nom. Particulièrement les drapeaux de pays de l'Afrique centrale, ce sont les premières qui doivent être vues, puis de l'Afrique de l'Ouest, puis de chaque pays africain, après de certains pays européens comme la France, la Belgique, les États-Unis. L'Allemagne, l'Angleterre, euh, cela peut aussi s'afficher. Mais d'abord fixer sur le pays. En premier temps, là, la République. J'aimerais même que ce soit par ordre. Hein. Ça commence par les pays, par A jusqu'à Z. Et donc, et quand quelqu'un dit où souhaitez-vous travailler, il faudrait qu'il y ait plusieurs options euh, de pays. Et quand tu cliques sur un pays d'abord, ça propose également les villes de ces pays. Donc, tu cliques également sur une province ou une ville bien précise. Ce sont des informations qui sont connues. Euh... Et même aussi pour le recruteur. Où souhaitez-vous recruter? Tu dois vraiment créer une expérience mobile, talent, RH et entreprise. C'est vraiment important. Où souhaitez-vous trouver votre prochain candidat? Voilà, tout ça. Essayez de développer quelque chose de, qui s'adapte à toutes les offres.

## B. Demande reformulée

### B1. Pays et lieux (talent et recruteur)
- À la **première connexion**, la personne indique **son pays** (écran 81) : liste avec le **drapeau et le
  nom** de chaque pays et une recherche. Ordre : **RD Congo en premier**, puis l'**Afrique centrale**, l'**Afrique
  de l'Ouest**, le **reste de l'Afrique**, puis **hors d'Afrique** (Allemagne, Belgique, États-Unis, France,
  Royaume-Uni…). De A à Z dans chaque groupe.
- « **Où souhaitez-vous travailler ?** » (écran 82) : **plusieurs pays** ; toucher un pays propose **ses
  villes et provinces** (ou « Tout le pays ») ; option télétravail.
- Côté recruteur : « **Où souhaitez-vous trouver votre prochain candidat ?** » (écran 91), même sélecteur,
  plus les domaines recrutés.
- Les pays, provinces et villes viennent d'un référentiel connu (pas de saisie libre au départ).

### B2. Mettre en avant : image et PDF
- Écran 83 : « Ajouter » propose Prendre une photo, Choisir une image, Importer un PDF, Ajouter un lien.
- Écran 84 : après l'import d'un PDF, choisir la couverture, réordonner les pages, autoriser ou non le
  téléchargement, choisir qui le voit. Le PDF se lit ensuite en carrousel.

### B3. Se connecter
- Le **bouton +** regroupe (écran 85) : Mettre une réalisation en avant, **Profils suggérés**, Rechercher une
  personne, Mes connexions, J'ai trouvé une opportunité, Envoyer une candidature, Créer un CV, Passer à
  Premium.
- **Profils suggérés** (écran 86) : le matching propose des personnes **du même domaine** et des
  **recruteurs**, avec la raison (compétences communes, même formation, recrute dans votre domaine).
  **Réservé aux formules payantes** ; en gratuit, l'écran 87 montre l'aperçu flouté et les formules.
- **Rechercher une personne** (écran 88) : par nom, métier, lieu, talents ou recruteurs.
- **Pas de message sans connexion** : la personne doit d'abord accepter. Une fois acceptée, une
  **notification** prévient (écran 89) et propose de **laisser un message** (écran 90).

### B4. Recruteur sur mobile (RH et entreprise)
- Même identité, navigation propre : Tableau, Offres, **Recruter** (au centre), Candidats, Compte ; le nom
  de l'organisation en haut, avec changement d'organisation.
- **Tableau** (écran 92) : nouveaux candidats, entretiens du jour, offres en ligne, ce qui attend.
- **Rechercher un candidat** (écran 93) : compétence, métier, ville, badge Cap ; score et « Pourquoi ? » ;
  seuls les profils rendus visibles apparaissent ; « Inviter à postuler » ; pas de message avant que le
  candidat accepte.
- **Profil d'un candidat** (écran 94) : score expliqué, compétences, réalisations ; consultation
  enregistrée.
- Le tout s'adapte à chaque formule (Talent, RH, Companies) par les clés de droits.
