# Connexion, inscription et générique d'entrée v2 · brief de refonte

Date : 15 octobre 2026. Maquettes validées le 15 octobre 2026 (validation déléguée par le propriétaire).

Routes : `/connexion` et l'entrée de l'inscription (`/inscription`), plus un **générique** joué à l'arrivée dans l'espace (`/app/**`) juste après une connexion réussie.

Maquettes de référence dans `docs/refonte-connexion/maquette/` :

- `connexion-v2.html` : la page animée (profil, connexion ou inscription, ouverture rejouable). Elle passe en mise en page mobile sous 980 px ;
- `generique.html` : le générique, avec les trois profils, la version complète et la version courte ;
- captures : `connexion-talent-desktop.jpg`, `connexion-rh-desktop.jpg`, `inscription-entreprise-desktop.jpg`, `connexion-mobile.jpg`, `connexion-ouverture-1s.jpg` (instant de l'ouverture), `generique-desktop-planche.jpg` (6 instants), `generique-mobile-planche.jpg`.

Elles remplacent les maquettes 02-01 (connexion) et 02-04 (choix du profil) de `docs/maquettes/02-connexion-inscription/` pour ces écrans. Les autres étapes de l'inscription (forfait, compte, vérification, paiement, premiers pas) ne changent pas. Les chiffres des cartes flottantes (82, 87 %, « Leçon 3 sur 8 »…) sont **décoratifs** et identiques pour tout le monde : ce sont des illustrations de l'appli, jamais des données d'un compte. Ils restent dans les textes, pas dans le code.

Ce brief s'appuie sur `docs/experience-animee/BRIEF-ESPACE-UTILISATEUR.md` : `src/styles/motion.css`, `MotionRoot` / `AppMotionRoot`, seuls `transform` et `opacity` sont animés, tout est immobile en animations réduites (préférence système **ou** réglage « Réduire les animations » du compte).

---

## 1. Ce qui ne change pas

- Better Auth et toute la logique serveur de `src/server/auth/` et `src/server/actions/auth.ts` (mot de passe, code e-mail, lien magique, deux étapes, limites de tentatives, `isSafeInternalPath` pour `?suite=`).
- Les alertes existantes de `/connexion` (`deconnecte`, `suppression`, `erreur=google`, reprise d'une offre avec `suite`), le lien « Vous avez un code de licence ? Activez-le », les mentions légales, la signature « Une plateforme développée par The Growth Lab · assistant@jumanly.io ». **Aucun numéro de téléphone.**
- `LoginForm`, `MagicLinkForm`, `PasswordField` : on les restyle, on ne réécrit pas leur logique.
- Le parcours d'inscription en étapes (`/inscription/forfait`, `/compte`, `/verification`, `/paiement`, `/app/bienvenue`) et `readSignupParams`.

## 2. Mise en page de `/connexion` et `/inscription`

Le layout `(auth)` garde sa structure (scène à gauche, formulaire à droite) mais la scène change complètement. Les autres écrans du groupe `(auth)` (mot de passe oublié, réinitialiser, étapes d'inscription, activer) gardent l'`AuthAside` actuel : seule la page d'entrée reçoit la scène animée. Concrètement, le layout affiche `AuthStage` quand la route est `/connexion` ou `/inscription` (sans sous-chemin), `AuthAside` sinon.

**Desktop (≥ 980 px)** : grille 1,12 fr / 0,88 fr, hauteur 100 dvh.

- **Scène** (`AuthStage`, colonne gauche) : fond `--jm-degrade-profondeur`, trois halos radiaux (Lime au centre-bas, Menthe en haut à droite, `#1E9A64` en bas à gauche) qui dérivent lentement (26 s, alterné), trame de points blancs 7 % masquée en radial. En haut : logo négatif (lien vers `/`) et **sélecteur de profil** (§ 3). Au centre : l'**orbite** (§ 4). En bas : « Learn. Grow. Connect. » (le dernier mot en Lime) et « Une plateforme développée par The Growth Lab ».
- **Formulaire** (colonne droite, Crème, halo Lime en haut à droite) : en haut « Retour au site » et « Langue : Français » ; au centre une colonne de 440 px (§ 5) ; en bas la signature.

**Mobile et tablette (< 980 px)** : une colonne. La scène passe en haut (logo centré, sélecteur pleine largeur, orbite réduite, sans pied de scène), le formulaire remonte par-dessus en **feuille** Crème aux coins hauts de 30 px (`margin-top: -34px`, ombre vers le haut). Sous 620 px : boutons sociaux réduits au logo (le nom reste dans `aria-label`), bulle et cartes réduites (voir les valeurs dans la maquette). Aucun défilement horizontal.

## 3. Sélecteur de profil et accroches

Trois boutons en pilule de verre (`aria-pressed`) : **Talent**, **RH**, **Entreprise**. Le profil choisi change l'accroche, le personnage principal et les trois cartes flottantes. Il est lu, dans l'ordre, depuis `?profil=` (valeurs de `signupProfileValues`, `company` affiché « Entreprise »), puis le dernier choix mémorisé (`localStorage` `jm-role`, lecture protégée par try/catch), sinon **Talent**. Il est synchronisé dans les deux sens avec le choix « Vous êtes » de l'onglet Créer un compte. Le profil Partenaire n'apparaît pas ici (il garde `/activer` et `/partenaires`).

| Profil | Surtitre | Accroche (mots en dégradé Signature soulignés) | Phrase d'appui | Ligne d'action |
|---|---|---|---|---|
| Talent | Pour les talents | Prêt à **booster votre employabilité** ? | Formez-vous, renforcez votre CV et laissez les offres venir à vous. | Connectez-vous pour reprendre votre parcours |
| RH | Pour les professionnels RH | Prêt à recruter les **bons profils**, plus vite ? | Publiez, triez et échangez avec vos candidats au même endroit, avec une IA qui explique ses choix. | Connectez-vous pour retrouver vos candidats |
| Entreprise | Pour les entreprises | Prêt à bâtir **l'équipe** qui fera grandir votre entreprise ? | Un vivier de talents formés, un suivi de recrutement clair et toute votre équipe sur la même page. | Connectez-vous pour piloter vos recrutements |

L'accroche est le titre de la scène (`h2`, l'`h1` de la page reste celui du formulaire). Elle apparaît **mot par mot** (`jm-word` : flou 10 px → net, montée de 0,45 em, 70 ms entre deux mots).

## 4. L'orbite (décor, `aria-hidden`)

Carré de `min(640px, 100%)`, `container-type: inline-size` pour placer les avatars en `cqw`.

- **Trois anneaux** concentriques (46 %, 72 %, 98 % ; Lime 22 %, blanc 13 %, le dernier en pointillés Néon 16 %). Chaque anneau porte des avatars et **tourne** (70 s, 110 s en sens inverse, 150 s) ; chaque avatar contre-tourne à la même vitesse pour rester droit (rotation de l'anneau, rotation inverse de l'avatar : `transform` seulement).
- **Avatars** : disques blancs bordés de 3 px, cadrés sur la tête et les épaules des personnages (`Character`) : Kofi « joie », Fatou « salut », Nadia « salut », Diallo « joie », Amani « salut », plus Orbi et deux points Lime. Aucune photo de personne réelle.
- **Bulle d'accroche** au centre : rectangle arrondi 30 px (8 px en bas à gauche) avec une queue en bas à gauche, dégradé `#206856 → Sapin → #0B2824`, liseré Lime 28 %, halo Lime 5 %. Elle « respire » (translation −6 px, rotation −0,6°, 7 s). Contenu : surtitre Néon avec trait, accroche 34 px SemiBold (29 px sous 1180 px, 21 px sous 620 px), phrase d'appui 14,5 px Light, ligne d'action avec trois points (le premier allongé en Lime).
- **Personnage principal** près de la queue de la bulle, disque de 104 px (60 px en mobile) avec halo Lime et pastille ✓ : **Amani « joie »** (Talent), **Nadia « montre »** (RH), **Diallo « montre »** (Entreprise).
- **Trois cartes flottantes** blanches (rayon 18 px, rotations −4°, 3°, −2°, flottement de 10 px décalé, 6 à 7 s) : en haut à gauche, en haut à droite, en bas à droite. Contenu par profil (textes au § 9) :
  - Talent : jauge « Force du profil · 82 % » ; « Nouvelle offre pour vous · Analyste de données junior » avec pastille « Compatibilité 87 % » ; « Certificat obtenu · Excel pour l'analyse » ;
  - RH : « Profil recommandé · Kofi A. · Data analyst » avec pastille « Pourquoi ? » (l'IA explique toujours) ; « Entretien planifié · Jeudi · 10:00 » ; « Candidatures triées · Pipeline à jour » ;
  - Entreprise : « Offre publiée · Chargé(e) de clientèle » ; « Votre équipe recrute · Recruteurs invités » ; « Vivier de talents · Profils formés sur Jumanly ».
- Deux étincelles Néon qui scintillent.

### Ouverture (une fois par chargement, environ 2,4 s)

| Temps | Ce qui se passe | Courbe |
|---|---|---|
| 0 → 0,4 s | Un **point Lime** (le point du J) tombe au centre, grossit puis s'ouvre en onde et disparaît. | Arrivée |
| 0,35 → 1,4 s | Les trois anneaux s'ouvrent depuis le centre (échelle 0,3 → 1), décalés de 150 ms. | Arrivée |
| 0,9 → 1,3 s | Les avatars éclosent sur les anneaux (0,4 → 1), chacun avec son délai. | Rebond |
| 0,95 s | La bulle jaillit depuis sa queue (échelle 0,2 → 1). | Rebond |
| 1,25 s → | L'accroche mot par mot, puis surtitre et phrase d'appui. | Arrivée |
| 1,5 s → | Personnage principal, puis les trois cartes (140 ms d'écart). | Rebond |
| 0,45 s | Le formulaire glisse depuis la droite (40 px) et apparaît. | Arrivée |

Ensuite tout passe en mouvement d'ambiance (rotation des anneaux, flottement, souffle, reflet qui balaie le bouton principal toutes les 4,5 s). Au changement de profil, seuls l'accroche, le personnage et les cartes rejouent leur apparition (sans délai initial). Les scènes hors écran sont en pause (`[data-scene]`, déjà géré par `motion.css`). En animations réduites : tout est affiché dans son état final, rien ne tourne.

## 5. Formulaire

Colonne de 440 px, `gap` 18 px.

1. **Bascule** « Se connecter » / « Créer un compte » : pilule à deux onglets (`role="tablist"`), le fond blanc glisse sous l'onglet actif (0,45 s, Arrivée). `/connexion` ouvre « Se connecter », `/inscription` ouvre « Créer un compte » ; la bascule change l'URL (`router.replace`, sans rechargement) pour que le retour arrière et le partage du lien restent justes.
2. **Se connecter** : titre « Bon retour parmi nous » (32 px Bold), sous-titre ; alertes existantes ; libellé « Continuer avec » puis les **trois boutons sociaux** en grille de 3 (§ 6) ; séparateur « ou avec votre e-mail » ; e-mail et mot de passe (champs de 52 px, rayon 16 px, focus Sapin + halo Lime) ; « Rester connecté sur cet appareil » et « Mot de passe oublié ? » ; bouton Lime « Se connecter » avec flèche dans une pastille Sapin ; bouton contour « Recevoir un lien de connexion par e-mail » (ouvre `MagicLinkForm` comme aujourd'hui) ; pied : code de licence et mentions.
3. **Créer un compte** : titre « Créez votre compte gratuit », sous-titre ; « Vous êtes » en trois cartes radio (Talent, Professionnel RH, Entreprise) liées au sélecteur de la scène ; « S'inscrire avec » et les trois boutons sociaux ; séparateur ; e-mail ; bouton « Continuer » ; rappels « Inscription gratuite » et « Mobile Money et carte » ; mentions. **Continuer** mène à l'étape suivante du parcours actuel, `/inscription/forfait?profil=…` avec l'e-mail gardé pour pré-remplir l'étape « compte » (paramètre ou cookie court de `signup-flow`, au choix de l'implémentation, jamais dans un journal). L'étape 1 « Vous êtes… » est donc faite sur cette page : l'indicateur d'étapes garde sa numérotation.

## 6. Connexion et inscription par Google, Apple et LinkedIn

Troisième option retenue : **LinkedIn**, le compte le plus naturel pour une plateforme de carrière et de recrutement (et utile plus tard pour pré-remplir le profil, avec accord).

- Better Auth gère les trois fournisseurs (`socialProviders.google`, `.apple`, `.linkedin`). Sur le modèle de `googleEnabled`, ajouter `appleEnabled` (`APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`, plus `APPLE_APP_BUNDLE_IDENTIFIER` si une appli native vient un jour) et `linkedinEnabled` (`LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`). Variables dans `.env.example` et `docs/deploiement-vercel.md`. Un bouton n'apparaît que si son fournisseur est configuré ; si aucun ne l'est, la ligne « Continuer avec » et le séparateur disparaissent.
- `account.accountLinking.trustedProviders` : `["google", "apple", "linkedin"]`. Apple peut masquer l'e-mail (relais `privaterelay.appleid.com`) : le compte se crée quand même, l'e-mail de relais est accepté comme e-mail vérifié.
- Une seule action serveur `signInWithProvider(provider, formData)` remplace `signInWithGoogle` (même `safeNext`, `callbackURL` vers l'arrivée du § 7, `errorCallbackURL` `/connexion?erreur=<provider>`), avec une alerte par fournisseur (`auth.error.appleFailed`, `auth.error.linkedinFailed`).
- **Inscription sociale** : le profil choisi est transmis (cookie court `signup-flow` posé avant la redirection) ; au retour, un nouveau compte social reprend le parcours à l'étape forfait avec ce profil, exactement comme un compte e-mail après vérification. Un compte existant est simplement connecté.
- Boutons : 50 px, rayon 16 px, blancs à liseré Brume ; **Apple en noir** (règle d'Apple), logos officiels Google (G quatre couleurs), Apple et LinkedIn (carré `#0A66C2`) en SVG dans `public/marque/fournisseurs/`. Survol : montée de 2 px et ombre. `aria-label` « Continuer avec Google » (ou « S'inscrire avec… » dans l'onglet inscription).
- Configuration externe à faire par le propriétaire (à noter dans `docs/deploiement-vercel.md`, pas à automatiser) : compte Apple Developer (Services ID, domaine vérifié, clé de signature), appli LinkedIn avec le produit « Sign In with LinkedIn using OpenID Connect », URL de retour `…/api/auth/callback/<provider>` pour chacun.

## 7. Le générique d'entrée

Composant client `AppIntro`, monté dans `AppShell`. Il couvre l'écran (`position: fixed`, `z-index` au-dessus de tout, `role="dialog"`, `aria-modal`, `aria-label` « Présentation de Jumanly ») pendant que l'espace se charge **dessous** : à la fin, on découvre la vraie page, déjà prête.

**Quand il se joue**

- Toutes les connexions réussies et les retours de vérification arrivent avec `?arrivee=1` (mot de passe, code, lien magique, Google, Apple, LinkedIn, `autoSignInAfterVerification`). `AppIntro` lit ce paramètre puis le retire de l'URL (`router.replace`).
- **Version complète** (9,6 s) si le compte n'a jamais vu le générique : nouveau champ `User.introSeenAt DateTime?` (migration Prisma), posé par une action serveur `markIntroSeen()` à la fin ou au « Passer ». Elle se joue donc une fois par compte, sur n'importe quel appareil. Pour un nouveau compte, elle se joue par-dessus `/app/bienvenue`.
- **Version courte** (2 s) aux connexions suivantes.
- **Jamais** sans `?arrivee=1` (simple navigation, rechargement), ni en animations réduites (préférence système ou réglage du compte) : à la place, le toast existant « Bon retour, {prénom} ».
- « Revoir la présentation » dans `/app/parametres` (rejoue la version complète).

**Version complète, scène par scène** (temps depuis le début)

| Temps | Scène | Détail |
|---|---|---|
| 0 → 1,9 s | **Logo** | Fond Nuit avec halo Sapin central et trame de points ; trois anneaux s'ouvrent. Le point Lime tombe du haut, rebondit, éclate ; le symbole Lime pivote et éclot (0,55 s), le logotype « jumanly » glisse depuis derrière lui (0,85 s), puis l'ensemble s'efface en grossissant. |
| 1,9 → 3,3 s | **Bienvenue** | Le **bandeau** arrondi (76 % de large, rayon 3 % de la largeur, Lime) s'ouvre horizontalement (`scaleX` 0 → 1) ; le **portrait** rond (22 %, bordure Nuit, halo Lime) éclot au centre et coupe le bandeau ; de part et d'autre : « Bienvenue, » et le **prénom**. Les quatre pastilles de progression apparaissent en bas. |
| 3,3 / 4,6 / 5,9 / 7,2 s | **Quatre modules** (1,3 s chacun) | La couleur du bandeau glisse (Lime, Menthe, Néon, `#7DE36B`), l'étiquette du module apparaît au-dessus (icône + nom en capitales Néon), les mots changent (« Votre » / « formation »…) avec l'effet mot par mot, deux cartes de l'appli arrivent de l'extérieur en tournant et repartent vers le centre à la scène suivante, la pastille du module se remplit. |
| 8,5 s | **Slogan** | Les cartes partent, portrait et mots se replient, le bandeau passe en Néon avec « Learn. Grow. Connect. ». |
| 9,1 → 9,6 s | **Ouverture** | Un disque Lime part du centre et couvre l'écran (échelle 0 → 40), puis tout s'efface et l'espace apparaît en se posant (échelle 1,08 → 1). |

Modules et cartes par profil (textes au § 9) :

| Profil | Module 1 | Module 2 | Module 3 | Module 4 |
|---|---|---|---|---|
| Talent | Learn · Votre formation | Career · Votre CV | Jobs · Votre emploi | Connect · Votre réseau |
| RH | Jobs · Vos offres | Hire · Vos candidats | Intelligence · Vos profils | Connect · Vos échanges |
| Entreprise | Jobs · Vos offres | Vivier · Votre vivier | Équipe · Votre équipe | Hire · Vos recrutements |

Le profil vient de l'espace actif (talent, RH ou organisation) ; un compte partenaire voit la version Entreprise. **Portrait** : la photo de profil si elle existe, sinon le personnage du profil (Amani « joie », Nadia « montre », Diallo « montre ») sur sa couleur. **Prénom** : `firstName`, sinon `name` ; s'il n'y en a pas, « Bienvenue » seul, sans virgule. La taille des mots s'adapte à leur longueur (`min(5,6 cqw, 40 cqw / nombre de lettres)`) pour ne jamais déborder du bandeau.

**Version courte** : le point Lime pulse au centre, les anneaux s'ouvrent, « Bon retour, {prénom} » mot par mot (le prénom en dégradé Signature), puis la même ouverture en disque Lime (1,3 → 2 s).

**Commandes et accessibilité** : bouton « Passer l'intro » en haut à droite (avec `Échap` affiché), visible dès la première image et focalisé à l'ouverture ; un clic n'importe où, `Échap` ou « Passer » sautent directement à l'espace. Barre de progression de 3 px (dégradé Signature) en bas. Région `aria-live` : « Bienvenue, {prénom}. Présentation de Jumanly. ». Le focus revient ensuite au contenu principal (`#content`). Pas de son.

**Mobile** : écran vertical. Le bandeau devient presque carré (92 % × 100 % de la largeur), les mots passent au-dessus et au-dessous du portrait (34 %), les cartes en haut et en bas, les pastilles en bas.

**Technique** : une seule boucle de temps (une table d'étapes et `setTimeout`, ou Web Animations API), aucune bibliothèque d'animation, `transform` et `opacity` seulement (le changement de couleur du bandeau peut passer par une transition de `background-color` sur un seul élément, ou par quatre calques superposés en fondu si l'on veut s'en tenir à `opacity`). Les personnages viennent de `Character` / `public/illustrations/`. Le composant est chargé à la demande (`next/dynamic`) pour ne rien coûter aux pages quand il ne se joue pas.

## 8. Composants et fichiers

- `src/components/auth/auth-stage.tsx` (client) : sélecteur, orbite, bulle, cartes, ouverture.
- `src/components/auth/auth-entry.tsx` (client) : bascule connexion / inscription et synchronisation du profil.
- `src/components/auth/social-buttons.tsx` : les trois boutons, affichés selon la configuration.
- `src/components/app/app-intro.tsx` (client) + `src/server/actions/intro.ts` (`markIntroSeen`).
- Styles : les nouvelles classes et images-clés vont dans `src/styles/motion.css` (section « Connexion et générique »), en réutilisant `jm-word`, `jm-float`, `jm-pop`, `jm-rise`.
- `prisma/schema.prisma` : `User.introSeenAt`. Migration.
- `src/server/auth/index.ts` : fournisseurs Apple et LinkedIn ; `src/server/actions/auth.ts` : `signInWithProvider`, `callbackURL` avec `?arrivee=1` partout.

## 9. Textes à ajouter

Dans `textes/textes-application.md`, partie 02 (section `/connexion` et « Commun · Authentification ») et dans la section de l'espace pour le générique, puis `pnpm messages`. Tous les textes visibles du brief (tableaux des § 3, 4, 5 et 7) y vont, y compris les contenus des cartes décoratives. Clés suggérées :

- `auth.stage.roles.{talent,rh,company}`, `auth.stage.{talent,rh,company}.{eyebrow,hook,sub,line}` (les mots en dégradé balisés dans le texte, par exemple `Prêt à <hl>booster votre employabilité</hl> ?`), `auth.stage.{talent,rh,company}.cards.{1,2,3}.{title,text,pill}`, `auth.stage.slogan` ;
- `auth.entry.{loginTab,signupTab}`, `auth.social.{label,signupLabel,google,apple,linkedin}`, `auth.social.aria.{continue,signup}`, `auth.error.{appleFailed,linkedinFailed}`, `auth.or.email` (« ou avec votre e-mail ») ;
- `signup.entry.{title,subtitle,who,continue,free,payment}` ;
- `intro.{label,skip,skipKey,welcome,welcomeNoName,back,slogan,live}`, `intro.{talent,rh,company}.modules.{1..4}.{tag,left,right}` et `.cards.{1,2}.{title,text,pill}`, `settings.replayIntro`.

## 10. Critères d'acceptation

- `/connexion` et `/inscription` ressemblent aux captures à 1440 px et 390 px, sans défilement horizontal ; le reste de l'inscription est inchangé.
- Le profil vient de `?profil=`, puis du dernier choix, sinon Talent ; il reste synchronisé entre la scène et le formulaire.
- Seuls les fournisseurs configurés s'affichent ; Google, Apple et LinkedIn connectent un compte existant et créent un nouveau compte qui reprend le parcours à l'étape forfait avec le bon profil.
- Le générique complet se joue une seule fois par compte, la version courte aux connexions suivantes, jamais sur une simple navigation ni en animations réduites ; « Passer », `Échap` et clic fonctionnent ; le focus revient au contenu.
- Seuls `transform` et `opacity` sont animés (hors l'éventuelle transition de couleur du bandeau notée au § 7) ; Lighthouse accessibilité ≥ 95 sur `/connexion` ; le budget JavaScript des pages publiques n'est pas dépassé (l'`AuthStage` ne charge aucune bibliothèque).
- Tests : unitaires pour le choix du profil et le choix de la version du générique ; e2e connexion e-mail avec générique complet puis court, « Passer », inscription jusqu'à l'étape forfait ; e2e en animations réduites sans générique.
