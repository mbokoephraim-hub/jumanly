# Jumanly · Interactions et cadres v2.1

Version 2.1 · 15 octobre 2026 · demande d'Ephraïm Mboko. La v2.1 remplace le relief à épaisseur de la v2.0 par des ombres douces (retour d'Ephraïm : trop d'épaisseur ; garder l'identité) et ajoute le zoom au clic.

Maquettes de référence (à ouvrir dans un navigateur, souris en main) :
- `docs/interactions-relief/maquette/app-v2.html` : espace connecté.
- `docs/interactions-relief/maquette/site-v2.html` : site public.
- Captures : `maquette/*.jpg`.

Les maquettes sont la référence visuelle et de comportement. **Leur contenu (héros du site, cartes du tableau de bord) n'est qu'un banc d'essai : les pages gardent leur contenu et leur mise en page actuels**, seuls les cadres, l'en-tête, le curseur et les effets changent. Leurs CSS et JS (`common.css`, `common.js` intégrés aux HTML) donnent les valeurs exactes : ombres, durées, courbes, tailles. Les données affichées sont des exemples.

---

## Ce que demande Ephraïm, reformulé

Jumanly doit se comporter comme une **application** et non comme une page web posée sur du papier blanc. Quatre chantiers, valables **partout** (site public, connexion, espace talent, recruteur, entreprise, partenaire, admin) :

1. **Le curseur Orbi.** Le pointeur de la souris devient Orbi, l'orbe de la marque, entouré de son orbite. L'orbite est une **loupe** : sous elle, le fond s'inverse (un fond blanc ou Crème devient Vert Sapin, un fond Sapin devient menthe claire) et le texte passe automatiquement dans la couleur lisible (vert clair sur fond foncé, vert foncé sur fond clair). Quand Orbi passe sur quelque chose de **cliquable**, la loupe s'efface, l'orbite se resserre autour de l'orbe et l'élément **grandit légèrement** : on sent la différence entre un texte qu'on lit et un lien qui mène ailleurs.
2. **Des cadres qui se détachent du fond.** Sans changer l'identité visuelle : les cartes et encadrés reçoivent une ombre large et légère et un contour presque invisible (modèle : image 6), pour qu'on voie tout de suite qu'il s'agit d'un cadre.
3. **Les en-têtes en îlots.** Fin des bandes qui vont d'un bord à l'autre. Le site public a un en-tête **flottant**, détaché des bords, aux coins arrondis (modèle joint par Ephraïm). Dans l'application, la barre du haut devient deux îlots flottants, et **le vide à gauche** (au-dessus du bandeau vert de chaque page) est comblé par le **champ de recherche** (le rectangle où l'on écrit) et deux raccourcis.
4. **Des effets partout.** Entrer sur une page, survoler, cliquer, ouvrir : chaque geste a une réponse visible. Le logo lui-même s'anime.

Ce brief **prolonge** `docs/experience-animee/BRIEF-ESPACE-UTILISATEUR.md` (v1.0). Il **remplace** ses § 2 (menu : la torche reste, le reste du pointeur passe au curseur Orbi) et § 8 (micro-interactions), et **remplace** la règle « ombres quasi nulles » de `src/styles/tokens.css` et le commentaire « Hierarchy comes from backgrounds, not shadows » de `src/components/ui/card.tsx`. Tout le reste de la v1 (univers par module, reveal, notifications, diagnostic, TabRail) reste valable.

---

## 0. Règles qui ne bougent pas

1. **Un seul système de mouvement** : on étend `src/styles/motion.css`, `AppMotionRoot` (`src/components/motion/app-motion-root.tsx`) et `MotionRoot` (`src/components/site/motion.tsx`). Pas de second système, **aucune bibliothèque d'animation** ajoutée.
2. **On n'anime que `transform`, `opacity`, `filter`** (et des `@property`). Jamais `width`, `height`, `top`, `left`, `box-shadow` en boucle (une ombre peut changer en transition au survol, jamais dans une animation infinie).
3. **Animations réduites** (`prefers-reduced-motion: reduce` ou réglage « Réduire les animations », `User.reduceMotion`, `html[data-reduce-motion]`) : pas de curseur Orbi, pas d'inclinaison, pas d'entrée chorégraphiée. Les **ombres des cadres restent** (elles ne sont pas une animation).
4. **L'état final est l'état par défaut** : sans JavaScript, la page est complète. Une animation d'entrée part d'un état visible et ne laisse jamais un bloc à `opacity: 0` en attendant un observateur, sauf un bloc situé sous la ligne de flottaison.
5. **Accessibilité** : le contour de focus clavier (`:focus-visible`, Lime 3 px) ne change pas et ne dépend pas du curseur. Le curseur Orbi n'est qu'un décor : `aria-hidden`, `pointer-events: none`.
6. Identité v1 inchangée : Sora, Sapin `#0F3F37`, Lime `#A6F26B`, Crème `#F2EDE5`. Aucun texte en dur : chaque nouveau texte va dans `textes/textes-application.md`, puis `pnpm messages`. Aucun chiffre inventé, aucun numéro de téléphone.

---

## 1. Le curseur Orbi

### 1.1 Où il s'applique
- Uniquement si `(pointer: fine)` (souris, pavé tactile) **et** animations permises **et** réglage « Curseur Orbi » activé (voir 1.6).
- Sur téléphone et tablette : pas de curseur. À la place, l'onde Lime au toucher (§ 4.3).

### 1.2 Les cinq calques
Un composant client unique `<OrbiCursor />` (fichier `src/components/motion/orbi-cursor.tsx`), monté **une fois** dans `AppShell`, dans le layout public et dans le layout de connexion. Il crée 5 éléments `position: fixed`, `pointer-events: none`, `aria-hidden`, `z-index` au-dessus de tout sauf les modales natives :

| Calque | Taille | Rôle | CSS clé |
|---|---|---|---|
| `loupe` | 96 px | inverse ce qui est dessous | `backdrop-filter: invert(1) hue-rotate(180deg)` |
| `teinte` | 96 px | ramène le noir vers le Sapin | `background: #0F3F37; mix-blend-mode: screen` |
| `anneau` | 96 px | l'orbite | bordure Lime 1,5 px + halo, satellite Lime 8 px qui tourne (3,2 s) |
| `onde` | 40 px | onde au clic | anneau Lime qui grandit à ×2,6 et s'efface (520 ms) |
| `orbe` | 14 px | Orbi, exactement au bout du pointeur | `--jm-orbe-ia` + halo `--jm-halo-orbe` |

Résultat vérifié dans la maquette : blanc et Crème → Sapin ; texte Sapin → menthe très claire ; Lime → vert moyen ; Sapin → menthe claire ; texte blanc → Sapin. Le contraste reste lisible dans tous les cas.

### 1.3 Mouvement
- Un seul écouteur `pointermove` (passif) sur `window`, une seule boucle `requestAnimationFrame`.
- L'orbe suit le pointeur sans retard. La loupe, la teinte et l'anneau le suivent avec un léger retard (interpolation 0,24 par image) : effet de traîne.
- Tout est déplacé par `transform: translate(x, y) scale(s)`.
- `cursor: none` sur `html` uniquement quand le curseur est actif (`html[data-orbi]`). **Les champs de saisie gardent le curseur texte natif** (`cursor: text`).
- Le pointeur sort de la fenêtre ou la fenêtre perd le focus : les calques s'effacent (250 ms).

### 1.4 Les quatre états
Calculés à chaque mouvement à partir de `event.target` :

| Sous le pointeur | État | Loupe | Anneau | Élément |
|---|---|---|---|---|
| Texte, fond, image, carte non cliquable | `lecture` | visible, échelle 1 | 96 px | rien |
| `a`, `button`, `[role=button]`, `summary`, `label[for]`, `[data-orbi-cible]` | `lien` | effacée | se resserre à 0,42 (≈ 40 px), satellite plus rapide | **zoom** (§ 1.5) |
| `input`, `textarea`, `[contenteditable]` | `saisie` | effacée | effacé | orbe effacé, curseur texte natif |
| Menu Sapin (`[data-torch]`) | `menu` | effacée | visible | la **torche** existante fait l'effet (motif orbites révélé) |

Un élément peut demander d'être traité comme du texte (pas de zoom) avec `data-orbi="off"` : tableaux de données denses, éditeur de CV, lecteur vidéo.

### 1.5 Le zoom des éléments cliquables
- Classe `.jm-cible` posée **automatiquement** sur l'élément cliquable survolé (pas besoin de la mettre à la main), retirée à la sortie.
- `transform: translate(var(--tx), var(--ty)) scale(var(--zoom))` avec transition 220 ms `--jm-elan`.
- `--zoom` au survol : **1,06** pour un bouton, un lien, une puce, une icône ; **1,02** pour une carte ou une ligne de liste entièrement cliquable. Règle : si l'élément fait plus de 240 px de large ou de haut, la valeur « carte ».
- **Au clic** (`pointerdown`), l'élément **zoome encore** : **1,12** (carte : 1,04), puis revient à la valeur de survol 160 ms après le relâchement, courbe `--jm-rebond`. C'est le signal « ce lien m'emmène ailleurs » demandé par Ephraïm.
- **Attraction** : l'élément se décale de 4 px au plus vers le pointeur (`--tx`, `--ty`).
- Les **liens dans un paragraphe** ne zooment pas (ils feraient bouger le texte) : soulignement Lime qui se dessine de gauche à droite à la place.
- Une carte cliquable gagne aussi l'ombre de survol `--jm-ombre-carte-h` ; une ligne de liste cliquable gagne un liseré Lime 1,5 px et sa flèche avance de 3 px en passant au Lime.
- Les tuiles d'icône dans un élément survolé font un petit saut (−4 px, −6°, 450 ms `--jm-rebond`).

### 1.6 Réglage
Dans `/app/parametres`, section « Affichage », sous « Réduire les animations » : interrupteur **« Curseur Orbi »**, activé par défaut. Nouveau champ `User.orbiCursor Boolean @default(true)` (migration Prisma). Sur le site public (pas de compte) : activé, sauf animations réduites. Textes : `parametres.affichage.orbi.label` « Curseur Orbi », `.aide` « Remplace le pointeur de la souris par Orbi. Désactivez-le pour retrouver le pointeur habituel. »

### 1.7 Performance
- Le `backdrop-filter` d'un disque de 96 px est peu coûteux, mais : pas de loupe pendant un défilement rapide (la masquer si `scroll` dans les 120 dernières ms) et pas de loupe au-dessus d'une vidéo ou d'un `canvas` (état `lecture` sans loupe).
- Navigateurs sans `backdrop-filter` (`@supports not`) : seuls l'anneau et l'orbe s'affichent.

---

## 2. Les cadres : ombres douces

**L'identité visuelle ne change pas** : mêmes couleurs, mêmes tuiles d'icône en aplat, mêmes boutons en pilule, mêmes pages et contenus (`docs/maquettes/`). On améliore seulement la façon dont les cadres se détachent du fond, sur le modèle de l'image 6 d'Ephraïm : cartes blanches, contour presque invisible, ombre large et légère. **Aucune épaisseur, aucune arête, aucun bouton qui s'enfonce, aucun dégradé ajouté.**

### 2.1 Jetons (dans `src/styles/tokens.css`, exposés dans `globals.css` comme `--shadow-*`)
Valeurs exactes dans la maquette (`common.css`, bloc « Ombres douces ») :

| Jeton | Valeur | Usage |
|---|---|---|
| `--jm-ombre-carte` | `0 0 0 1px rgba(15,63,55,.045), 0 1px 2px rgba(15,63,55,.04), 0 12px 32px -12px rgba(15,63,55,.14)` | toutes les cartes de l'app et du site, îlots de l'en-tête, menus, palette de recherche |
| `--jm-ombre-carte-h` | `0 0 0 1px rgba(15,63,55,.06), 0 2px 4px rgba(15,63,55,.04), 0 20px 44px -14px rgba(15,63,55,.20)` | survol d'une carte cliquable |
| `--jm-ombre-douce` | `0 0 0 1px rgba(15,63,55,.05), 0 4px 14px -6px rgba(15,63,55,.12)` | élément posé dans une carte : ligne de liste, sous-encadré, raccourci, bouton blanc |
| `--jm-zone` | `#F6F3EE` | zone secondaire dans une carte : valeur clé (« 4 candidatures »), piste de jauge et de barre, champ de saisie (avec contour 1 px Sapin 6 %) |
| `--jm-ombre-sombre` | `0 14px 36px -16px rgba(11,26,31,.45)` | bandeau d'univers, cartes IA et Sapin |

Les boutons Lime et Sapin gardent leur aplat et reçoivent seulement une ombre colorée très légère (`0 6px 16px -8px` Lime ou Sapin). Les tuiles d'icône gardent leur aplat, avec une ombre de même famille (`0 6px 14px -6px`).

### 2.2 Composants à modifier
- `Card` (`src/components/ui/card.tsx`) : `--jm-ombre-carte` par défaut (prop `flat` pour s'en passer) ; carte cliquable : `--jm-ombre-carte-h` au survol. Les teintes de module gardent leur fond.
- `Button` : ombre légère sur `primary` et `secondary`, `--jm-ombre-douce` sur `white` et `tertiary`. Rien d'autre ne change.
- Champs (`text-field`, `text-area`, `select`, `search-field`) : fond `--jm-zone` + contour 1 px ; au focus, fond blanc + anneau Lime 2 px + halo Lime 22 %.
- Listes cliquables (offres, candidatures, notifications) : chaque ligne devient un petit encadré blanc à `--jm-ombre-douce`, espacé de 10 px.
- Barres et jauges : piste `--jm-zone`, remplissage inchangé.

### 2.3 Ce qu'on ne fait pas
- Pas d'ombre sur le texte, les titres, les séparateurs, les badges.
- Pas de deuxième ombre forte sur un élément déjà posé dans une carte : `--jm-ombre-douce` au plus.

## 3. Les en-têtes en îlots

### 3.1 Site public (`src/components/layout/public-header.tsx`)
- L'en-tête devient un **îlot flottant** : `position: sticky; top: calc(env(safe-area-inset-top) + 14px)`, largeur max 1180 px, centré, marge 14 px au-dessus, coins 26 px, fond blanc 94 → 80 % + `backdrop-filter: blur(16px) saturate(1.4)`, ombre `--jm-ombre-carte`.
- Contenu inchangé : logo, les 7 liens (soulignement Lime lumineux sous la page courante), « Se connecter » (bouton blanc), « Créer un compte » (bouton Lime).
- Défilement : après 40 px l'îlot se **compacte** (padding vertical 10 → 6 px, ombre plus profonde) ; en descendant au-delà de 220 px il **se cache** (`translateY(-100% - 24px)`), il **revient** dès qu'on remonte. Menu ouvert : il ne se cache jamais.
- Mobile et tablette (< 1280 px, comme aujourd'hui) : logo, « Créer un compte », bouton menu. Le menu s'ouvre en **feuille** qui se déplie sous l'îlot (`scale(.96) → 1`, `--jm-rebond`), toujours en `<details>` natif ou bouton `aria-expanded`.

### 3.2 Espace connecté (`src/components/layout/app-shell.tsx`)
La barre de 78 px alignée à droite est remplacée par une rangée de **deux îlots** :
- **Îlot gauche (comble le vide)** : le **champ de recherche** (fond `--jm-zone`), `flex: 1`, max 620 px, placeholder « Rechercher une offre, une formation, une page… », raccourci clavier affiché `Ctrl K` (`⌘ K` sur Mac). Puis deux **raccourcis** en puces : dans l'espace talent « Mon CV » (`/app/career/cv`) et « Offres suivies » (`/app/jobs/favoris` ou la route existante des favoris) ; dans l'espace recruteur « Publier une offre » et « Vivier » ; partenaire « Mes licences » et « Rapports ». Les raccourcis se cachent sous 1280 px.
- **Îlot droit** : sélecteur d'espace, cloche, compte (avatar, nom, formule), séparés par de fins traits.
- Mobile : l'en-tête Sapin reste ; le **champ de recherche** se place en haut de la feuille Crème, en îlot pleine largeur.

**Recherche** (nouveau composant `src/components/app/command-search.tsx`) : `Ctrl K` / `⌘ K` ou clic ouvre une palette en modale (carte blanche à `--jm-ombre-carte`, entrée `jm-pop-in`). Elle cherche, sans nouvelle API au premier lot : (1) les pages de l'espace d'après `src/config/navigation.ts` et les sous-pages connues ; (2) un renvoi « Chercher “…” dans les offres » vers `/app/jobs?q=…` et « … dans les formations » vers `/app/learn?q=…` (ou les routes de recherche existantes). Navigation au clavier (flèches, Entrée, Échap), `role="combobox"` + `listbox`. Textes dans `textes/textes-application.md` (`app.recherche.*`).

### 3.3 Logo animé (`src/components/brand/logo.tsx`)
- Le point Lime du J et la tige deviennent deux éléments SVG distincts (`.tige`, `.point`).
- **À l'arrivée** dans l'espace ou sur le site (une fois par chargement complet) : la tige se trace (`stroke-dashoffset`, 800 ms) puis le point tombe et rebondit (900 ms `--jm-rebond`).
- **Au survol** : le point fait le tour de l'orbite du J (1,1 s).
- Rien en animations réduites.

---

## 4. Les effets

### 4.1 Entrer sur une page (complète la v1 § 3)
Chorégraphie, en une seule passe, déclenchée à chaque navigation (`usePathname`) :
1. 0 ms : les îlots du haut descendent (`-18px`, flou 4 px → net, 600 ms).
2. 180 ms : le bandeau d'univers **se déplie** (`scaleY(.86) → 1` depuis le haut, 800 ms) ; sa tuile d'icône **apparaît en rebond** ; le titre arrive **mot par mot** (60 ms d'écart, légère rotation, flou → net).
3. 250 ms et suivantes : les cartes **montent** une à une (70 ms d'écart, `translateY(22px) scale(.975)`, flou 4 px → net, 750 ms `--jm-elan`).
4. 450 ms : les nombres réels **comptent** depuis 0 (`count-up.tsx` existant), les anneaux et barres de progression **se tracent** / **se remplissent**.
Les blocs sous la ligne de flottaison attendent d'entrer à l'écran (le reveal v1 continue de s'appliquer). Attributs : `data-enter="rise" | "drop" | "unfold" | "pop"`, `style="--i: n"`.

Changement de page : le contenu sortant part en 220 ms (`opacity → 0`, `translateY(10px)`, flou 3 px), la pilule du menu glisse vers le nouvel élément (`--jm-rebond`), puis l'entrée ci-dessus. Utiliser les View Transitions si disponibles, sinon cette séquence.

### 4.2 Survoler (souris)
- Éléments cliquables : zoom + attraction (§ 1.5).
- **Cartes qui s'inclinent** vers le pointeur : cartes de statistiques, carte IA, cartes du héros public, cartes de formule (`data-tilt`, 4 à 7° max, `perspective(900px)`), avec un **reflet** doux qui suit le pointeur (`radial-gradient` blanc 35 %, `mix-blend-mode: soft-light`). Pas sur les listes ni les formulaires.
- Icônes du menu : montent de 3 px en rebond. Liens « Voir tout › » : la flèche avance.
- Cartes IA : anneau lumineux conique qui tourne autour du bord (`@property --a`, 4 s).

### 4.3 Toucher (téléphone)
- Tout élément cliquable : **onde Lime** qui part du doigt (24 px → ×9, 500 ms) et le lien **zoome** (`scale(1.06)`) tant que le doigt est posé.

### 4.4 Cliquer
- Onde de l'orbite (§ 1.2) + l'anneau se contracte un instant.
- L'élément cliqué zoome à 1,12 puis revient (§ 1.5).
- Action réussie : `success-burst.tsx` existant.

### 4.5 Ambiance
- Orbi du bandeau d'univers : orbe qui flotte (4 s) dans deux orbites qui tournent en sens contraire (9 s et 16 s), satellite Néon.
- Une seule chose tourne en continu par écran visible, en plus du curseur.

---

## 5. Organisation du code

```
src/styles/tokens.css            // + jetons d'ombres douces (§ 2.1)
src/styles/motion.css            // + curseur Orbi, cible, inclinaison, entrée (data-enter), îlots
src/components/motion/
  orbi-cursor.tsx                // § 1 : calques, boucle rAF, états, onde
  app-motion-root.tsx            // + entrée chorégraphiée, inclinaison, onde tactile généralisée
src/components/site/motion.tsx   // MotionRoot : mêmes ajouts pour le site public
src/components/ui/
  card.tsx                       // ombre douce + survol
  button.tsx                     // ombre légère
  text-field.tsx, text-area.tsx, select.tsx, search-field.tsx  // fond --jm-zone + contour
src/components/layout/
  public-header.tsx              // îlot flottant
  app-shell.tsx                  // deux îlots + recherche
src/components/app/command-search.tsx   // palette Ctrl K
src/components/brand/logo.tsx    // J animé
prisma/schema.prisma             // User.orbiCursor
```

## 6. Ordre de travail (lots)

1. **Lot R1 · Cadres** : jetons, `Card`, `Button`, champs, listes, barres. Toutes les pages en profitent sans y toucher. Vérifier quelques pages clés contre `maquette/app-v2.html` (bouton « Ombres » de la maquette pour comparer avant/après).
2. **Lot R2 · En-têtes** : îlot du site public, deux îlots de l'app, palette de recherche, logo animé.
3. **Lot R3 · Curseur Orbi** : composant, états, zoom automatique, réglage `orbiCursor` (migration), exclusions (`data-orbi="off"`, vidéo, canvas).
4. **Lot R4 · Effets** : entrée chorégraphiée, transition de page, inclinaison, onde tactile partout, ambiance du bandeau.

Un commit par lot ; `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` et `pnpm test:e2e:reduced` verts à chaque lot. Noter la décision « ombres douces sur les cadres, à la place des ombres quasi nulles » dans `docs/decisions/`.

## 7. Définition de fini

- Souris : sur n'importe quelle page, le pointeur est Orbi ; un fond blanc passe au vert sous l'orbite avec un texte lisible ; un bouton ou un lien grossit légèrement et l'orbite se resserre ; dans un champ, curseur texte normal.
- Clavier seul : tout est utilisable, le focus est visible, rien ne dépend du curseur.
- Téléphone : pas de curseur, onde au toucher, le lien touché zoome.
- Chaque cadre se détache du fond par une ombre douce ; aucune épaisseur ; couleurs, icônes et boutons inchangés.
- Site public : en-tête en îlot qui se compacte, se cache et revient. App : plus de vide à gauche de la barre du haut, recherche `Ctrl K` fonctionnelle.
- Animations réduites ou réglage désactivé : aucune animation, pointeur normal, ombres conservées, page complète.
- 60 images/s au survol sur un portable ordinaire ; aucun décalage de mise en page (CLS) causé par les zooms (ils sont en `transform`).
