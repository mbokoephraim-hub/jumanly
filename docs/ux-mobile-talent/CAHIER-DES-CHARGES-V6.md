# Expérience mobile Talent · version 6 (17 octobre 2026)

Ce document complète `CAHIER-DES-CHARGES-UX-MOBILE.md` et le remplace là où ils diffèrent. Partie A : ma
demande telle que je l'ai dictée. Partie B : la même demande reformulée, c'est elle qu'il faut appliquer.
Maquettes : `maquette/mobile-talent.html`, écrans 57 à 66 et section « En-tête, retour et barre du bas » ;
tous les écrans 01 à 56 ont été mis à jour avec la nouvelle barre et le nouvel en-tête.

## A. Ma demande (texte dicté, non retouché)

> Je souhaite que tu redéposes encore cette identité visuelle dans, dans mes mains. Que tu les redéposes parce que c'est qui devait générer ne correspond pas vraiment à ce qu'on a fait. Et avant que tu ne redéposes, je vais faire ce qui est une correction. Au lieu de 4 options, on va en faire 5 en bas. Tu vas juste adapter. On va faire l'option aussi. Le compte. Le compte aussi va être juste en bas. Et la partie. La partie pour moi va être bien au centre. Et c'est elle qui sera la partie principale. Quant à l'autre, c'est la partie pour moi qui est physique. La partie offre à côté. Apprendre aussi à côté. Donc, offre et apprendre et sont à gauche, au milieu pour moi. De l'autre côté, suivi. Et à la fin, pour moi. Et à la fin, en fait, euh, mon compte. Et quand on clique sur les comptes là, il faudrait qu'une interface s'ouvre. Et cette interface m'a montré toutes les options. Au-dessus, maintenant où étaient les comptes, je place maintenant les messages juste en haut. Mais quand on ouvre maintenant euh, le compte, on doit voir euh, certaines options. Euh, on doit voir l'écran, un écran s'ouvrir avec le profil, le compte qui est. Avec un crayon en haut pour modifier. Avec euh, un message là pour dire euh, créer un password, protéger votre compte. Euh, créer un password euh, et tout ça. Dans un bloc. Un autre bloc pour dire abonnement. Un autre bloc pour dire. Euh, euh, votre compte, confidentialité, un autre compte pour euh, un autre bloc pour dire euh, aide et commentaires, un autre aide et commentaires, inviter un proche, notification aussi, et euh, notification. Un autre compte pour euh, un autre bloc pour euh, l'IA et autre. Maintenant, quand on clique sur le menu qui s'affiche là, juste en haut, c'est là qu'on pourra trouver les options telles que mes CV. Table de bord, euh, IA et tout mon espace juste en haut là. On peut le faire de cette façon. Et aussi, on doit pouvoir voir aussi euh, l'icône retour à chaque euh, ouverture de page. Crée vraiment une icône retour. Et deuxièmement, j'aimerais que tu puisses aussi créer euh, des interfaces. La première, elle est blanche comme tu l'avais, mais l'autre doit être maintenant verte. Doit être verte. Dans une identité visuelle beaucoup plus immersive. Il faudra aussi refaire l'intro. Quand on télécharge l'appli et quand on l'ouvre, ce que ça donne. Je préfère pas que ce soit à chaque fois qu'on doit ouvrir l'appli quand on l'ouvre. On doit pouvoir voir le logo et c'est téléchargé. Et dans l'interface aussi, quand tu entres, le header d'en haut, là, j'aimerais que tu que tu enlèves la barre verte là. Que ça ne soit plus comme ça. Au lieu du. Essaie aussi de rajouter un truc plus en haut. Quand on clique sur plus là, on pourra voir par exemple. Euh, envoyer une candidature. Enfin, à toi d'être créatif quoi. Donc euh, voilà un peu. Mais reformule mon prompt. Aussi pour les offres, il faudrait qu'on ait l'option. En fait, il faudrait que quand celui qui poste l'offre, poste l'offre avec une photo. Et il faudrait qu'on ait l'opportunité de voir le logo de la boîte. Pas une photo en soi, mais qu'on qu'on voit plutôt euh, euh, la bannière, la bannière de la boîte. Donc, qu'on ait l'habitude de voir la bannière de la boîte et le logo de la boîte, le nom de la boîte et l'offre que la boîte a publiée. Voilà. Adapte ces idées.

## B. Demande reformulée

### B1. Fidélité aux maquettes (priorité absolue)

Ce qui a été codé jusqu'ici ne ressemble pas assez aux maquettes. À partir de maintenant :
- Les maquettes (`maquette/mobile-talent.html` et `maquette/ecrans/NN.jpg`) sont la référence visuelle.
  Les styles d'origine sont fournis dans `maquette/source/` (`style.css` à `style6.css`) : reprends-en les
  valeurs exactes (couleurs, dégradés, rayons, ombres, tailles, espacements) dans nos jetons, sans les
  approximer et sans ajouter de couleur.
- Pour chaque écran livré, une capture Playwright à 390 px de large est comparée à `ecrans/NN.jpg`. Les
  deux images sont jointes dans le résumé de fin d'étape. Tout écart visible est corrigé ou justifié.
- Identité : Vert Sapin #0F3F37, Lime #A6F26B, Crème #F2EDE5, Feuille #3DA14F, police Sora, logo des
  fichiers de `ressources/` (jamais redessiné).

### B2. Barre du bas à 5 onglets

De gauche à droite : **Offres** (`/app/jobs`), **Apprendre** (`/app/learn`), **Pour moi** (`/app`),
**Suivi** (`/app/suivi`), **Compte** (`/app/compte`).
- Pour moi est au centre et c'est l'onglet principal : un rond surélevé de 58 px portant le symbole J,
  en dégradé Lime quand il est actif, blanc sinon. C'est l'écran d'ouverture.
- Compte affiche la photo (ou les initiales) de l'utilisateur au lieu d'une icône.
- Les autres onglets : icône + libellé, actif dans une pastille Lime avec texte Sapin. Pastille de Suivi
  = nombre réel d'actions à traiter.

### B3. En-tête

- Plus de bande verte : l'en-tête est sur le fond de la page (Crème en thème clair), avec des boutons
  ronds blancs.
- À gauche : le bouton **Menu** (trois traits) puis le logo ou le titre de la page.
- À droite : Rechercher, **+** (bouton en dégradé), Notifications, **Messages** (pastille du nombre de
  messages non lus). Messages prend la place qu'occupait l'avatar.
- **Menu du haut** (le bouton Menu) : Jumanly AI, Mes CV, Tableau de bord, Mes candidatures, Simulations
  d'entretien, Attestations, puis « Tout Mon espace ».

### B4. Bouton retour sur chaque page ouverte

Toute page qui n'est pas un onglet (détail d'offre, candidature, conversation, éditeur de CV, réglages,
sous-pages de Compte…) commence par un bouton **Retour** de 42 px (icône `jm-retour`, nouvelle icône à
créer dans le jeu d'icônes), qui ramène à l'écran précédent, jamais à l'accueil par surprise.

### B5. Le bouton +

Il ouvre une feuille « Créer » : Envoyer une candidature (choisir une offre), Créer un CV, Écrire une
lettre, Simulation d'entretien, Ajouter une expérience, Demander à l'IA. Chaque action garde ses règles
(postuler reste gratuit ; les actions IA vérifient droit et crédits).

### B6. Page Compte

Toucher Compte ouvre une page (pas un menu) :
1. En haut, la carte profil : photo, nom, métier visé, formule, et un **crayon** pour modifier.
2. Un bloc d'alerte **« Protégez votre compte »** quand l'utilisateur n'a pas de mot de passe (inscription
   par Google ou LinkedIn) : « Créer un mot de passe ». Il disparaît une fois le mot de passe créé.
3. Bloc **Abonnement** : formule actuelle, échéance, changer de formule.
4. Bloc **Jumanly AI** : crédits du mois, historique, consentement.
5. Bloc **Compte et confidentialité** : informations, mot de passe et sécurité, visibilité du profil,
   données personnelles.
6. Bloc **Notifications**.
7. Bloc **Préférences** : thème (Clair ou Vert), langue.
8. Bloc **Aide et commentaires** et **Inviter un proche**.
9. Se déconnecter.

### B7. Deux thèmes : Clair et Vert

- **Clair** : l'interface actuelle, fond Crème et cartes blanches.
- **Vert** : une version immersive, fond en dégradé Sapin → Nuit, cartes vertes translucides, textes
  clairs, accents Lime (texte Sapin sur Lime, jamais blanc sur Lime). Contraste AA vérifié.
- Le choix se fait dans Compte › Préférences, est enregistré sur le compte et s'applique sans
  rechargement. Par défaut : Clair.

### B8. Ouverture de l'application

- À **chaque ouverture** : seulement le logo animé sur fond Sapin (moins d'une seconde), puis Pour moi.
- À la **première ouverture** après l'installation : un écran de bienvenue (personnages en orbite,
  « Learn. Grow. Connect. », Commencer / J'ai déjà un compte), une seule fois (indicateur stocké).
- La longue intro animée ne se joue plus à chaque fois. Animations réduites : logo fixe.

### B9. Offres avec bannière et logo

- Le recruteur ajoute à son organisation une **bannière** (image large) et un **logo** ; l'éditeur d'offre
  montre l'aperçu de la carte (écran 66).
- Chaque carte d'offre affiche : la bannière de l'entreprise, son logo, son nom, puis le titre de l'offre,
  le lieu, le contrat et le « Pourquoi ? ». Le détail d'une offre s'ouvre sur la bannière en grand.
- Sans bannière : un fond de motif Jumanly aux couleurs de l'identité. Images optimisées (règle d'or 9).
