# Connexion v2 et générique d'entrée : choix et écarts

Date : 15 octobre 2026 · brief `docs/refonte-connexion/BRIEF-CONNEXION-V2.md` (remplace les
maquettes 02-01 et 02-04 pour `/connexion` et `/inscription`)

## LinkedIn, troisième fournisseur de connexion

- Google, **Apple** et **LinkedIn** passent tous par les `socialProviders` de Better Auth
  (`src/server/auth/index.ts`). Chacun n'est activé, et son bouton affiché, que si ses variables
  d'environnement existent (`enabledProviders()`). Rien à configurer en local ni en preview.
- **Pourquoi LinkedIn** plutôt qu'un autre (Facebook, Microsoft) : c'est le compte professionnel
  que les talents et les recruteurs africains ont déjà, il sert le cœur de Jumanly (Career, Jobs,
  Hire) et son produit « Sign In with LinkedIn using OpenID Connect » ne donne que l'identité
  (nom, e-mail vérifié, photo), rien du réseau. Apple est là parce qu'il est attendu sur iPhone.
- Apple peut masquer l'adresse (relais `privaterelay.appleid.com`) : ces adresses sont
  considérées comme vérifiées (Apple les garantit). Un compte existant n'est relié que par les
  fournisseurs de confiance (`accountLinking.trustedProviders`).
- **Inscription sociale** : un nouveau compte reprend le parcours à l'étape forfait avec le profil
  choisi (`newUserCallbackURL`). Pour un compte RH ou Entreprise, le nom de l'organisation (et la
  fonction) est demandé sur cette même étape, puisque l'étape « compte » est sautée. Un compte
  social « en attente » (créé il y a moins de 24 h, sans mot de passe ni organisation) est le seul
  compte connecté autorisé sur `/inscription/forfait` (`pendingSocialSignup`).
- La configuration chez Apple et LinkedIn est faite par le propriétaire :
  `docs/deploiement-vercel.md`, section « Connexion par Google, Apple et LinkedIn ».

## Quand le générique se joue

- Toutes les connexions réussies arrivent sur l'espace avec `?arrivee=1` (`withArrival`) : mot de
  passe, code de deux étapes, lien magique, Google, Apple, LinkedIn, vérification de l'e-mail,
  fin d'inscription (paiement ou formule gratuite).
- **Complet** (9,6 s) une seule fois par compte : `User.introSeenAt`, posé par `markIntroSeen()`
  quand il se termine ou qu'on le passe. Il vaut donc pour tous les appareils.
- **Court** (2 s) aux connexions suivantes. **Jamais** sans `?arrivee=1` (navigation,
  rechargement) ni en animations réduites (préférence du système ou réglage du compte) : le
  message d'accueil (« Bon retour, {prénom} ! ») s'affiche à la place.
- Le marqueur est retiré de l'adresse aussitôt lu, par `history.replaceState` plutôt que
  `router.replace` (proposé par le brief) : pas de nouveau rendu serveur de l'espace pendant
  que le générique joue. Un rechargement ne le rejoue pas.
- « Revoir la présentation » (`/app/parametres`, Affichage) rejoue la version complète
  (`?arrivee=1&revoir=1`).
- Le générique (`AppIntro`) n'est chargé qu'au moment où il joue (`next/dynamic`) ; les textes
  et le portrait sont préparés côté serveur (`introData`).

## Écarts

- **Avatar principal de la scène** : dans la maquette validée, il est invisible (taille nulle, seul
  le badge apparaît). Le brief prévoit 104 px (60 px sur téléphone) : c'est le brief qui est suivi,
  avatar placé pour ne pas couvrir le texte de la bulle.
- **Mots qui montent** (bulle de la scène, générique) : même mouvement que `jm-word`, mais sans
  son flou, pour n'animer que `transform` et `opacity`.
- **Portrait du générique** : le personnage est cadré en buste dans le rond (la maquette agrandit
  l'image de 132 %) ; une photo de profil remplit le rond.
- Le profil de l'espace actif choisit la version : talent, RH (organisation de recrutement) ou
  Entreprise (entreprise et partenaire).
