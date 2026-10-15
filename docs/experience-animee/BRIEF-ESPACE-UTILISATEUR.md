# Jumanly · Espace utilisateur animé

Version 1.0 · 14 octobre 2026 · demande d'Ephraïm Mboko.

> **Mise à jour du 15 octobre 2026** : `docs/interactions-relief/BRIEF-INTERACTIONS-RELIEF-V2.md` remplace le § 2 (hors torche, conservée) et le § 8 de ce brief : curseur Orbi, relief des cadres, en-têtes en îlots, entrée chorégraphiée. Le reste de ce brief reste valable.

Ce brief rend l'espace connecté (`/app/...`) vivant, dynamique et technologique, **sans changer l'identité** : mêmes couleurs, mêmes cartes, mêmes icônes, mêmes maquettes (`docs/maquettes/`). Il ajoute le mouvement, la lumière, les fonds de la marque et des moments forts (bienvenue, vérification, notifications, diagnostic, évaluations).

Il s'applique **à chaque page** de l'espace talent, puis aux espaces recruteur, entreprise et partenaire, avec les mêmes composants.

---

## 0. Règles qui ne bougent pas

1. **Réutiliser l'existant** : `src/styles/motion.css` (dégradés qui tournent `.jm-ring`, fonds qui glissent `.jm-flow`, lumière qui suit le pointeur `.jm-spotlight`, tracés `.jm-draw`, images clés `jm-*`) et `src/components/site/motion.tsx` (`MotionRoot`) déjà en place sur la page d'accueil. Les étendre à `/app`, ne pas créer un second système.
2. **CSS d'abord**, petits hooks React ensuite (IntersectionObserver, variables CSS du pointeur, View Transitions). **Aucune bibliothèque d'animation ajoutée** sans note dans `docs/decisions/`.
3. **On n'anime que `transform`, `opacity`, `filter` et des propriétés `@property`.** Jamais `width`, `height`, `top`, `left` en boucle. Objectif : 60 images/s sur un téléphone Android d'entrée de gamme.
4. **`prefers-reduced-motion: reduce`** : aucune animation, aucune torche, aucun balayage ; tout est visible tout de suite, la même information est donnée (texte, chiffres, étapes). Ajouter aussi un réglage « Réduire les animations » dans `/app/parametres` (préférence enregistrée, appliquée par `html[data-motion="off"]`).
5. **L'état final est l'état par défaut** : sans JavaScript, ou si une animation échoue, la page est complète et lisible. Une animation ne fait qu'y mener.
6. **Rien d'inventé** : aucune donnée fictive dans les animations (pas de « 212 offres analysées » si ce n'est pas le vrai chiffre). Les étapes de chargement affichent ce qui se passe vraiment.
7. **Accessibilité WCAG 2.2 AA** inchangée : contrastes, focus visible (anneau Lime 3 px), cibles de 44 px sur mobile, `aria-live` pour les messages qui apparaissent. Texte Sapin sur Lime, jamais blanc sur Lime.
8. **Tous les textes** dans `textes/textes-application.md` puis `pnpm messages` (règle d'or 7).
9. Animer **sert à comprendre** (où je suis, ce qui a changé, ce qui charge, ce que j'ai gagné), pas à décorer au point de gêner la lecture. Durées : 150 à 250 ms pour les interactions, 300 à 600 ms pour les entrées, boucles d'ambiance lentes (8 à 30 s).

Courbes (identiques à l'identité motion) : **Élan** `cubic-bezier(.2,.8,.2,1)` pour les entrées, **Départ** `cubic-bezier(.4,0,1,1)` pour les sorties, **Rebond** `cubic-bezier(.34,1.56,.64,1)` pour les confirmations, **Arrivée** `cubic-bezier(0,0,.2,1)` pour les jauges.

---

## 1. Un univers par module

Chaque module a sa teinte (déjà définie dans les maquettes), son fond et son motif. Ils apparaissent dans le **bandeau d'univers** en haut de chaque page (titre, sur-titre, icône du module) et dans les états vides et les messages de réussite. **Jamais derrière un texte courant.**

| Module, page | Teinte | Fond du bandeau (`public/marque/fonds/`) | Motif d'ambiance (`public/marque/motifs/`) |
|---|---|---|---|
| Accueil `/app` | Sapin + Lime | `fond-06-sapin-orbites` | orbites sombre |
| Profil `/app/profil` | Crème | `fond-01-creme-trajectoire` | trajectoires clair |
| Learn `/app/learn/...` | Lime | `fond-04-lime-pastilles` | pastilles lime |
| Career `/app/career/...` | Néon | `fond-07-sapin-trajectoires` | trajectoires sombre |
| Diagnostic, coach, IA | Dégradé IA | `fond-08-intelligence`, `fond-09-nuit-orbe` | orbites sombre |
| Jobs `/app/jobs/...` | Menthe claire | `fond-02-creme-reseau` | réseau clair |
| Messages, Connect | Blanc | `fond-03-blanc-minimal` | points clair |
| Hire (recruteur) | Brume | `fond-10-profondeur-monogramme` | monogramme sombre |
| Abonnement, forfaits | Signature | `fond-05-signature` | pastilles lime |
| Paramètres | Crème | `fond-03-blanc-minimal` | aucun |

Bandeau d'univers (composant `<UniverseHeader module="career">`) :
- Hauteur 120 à 160 px desktop, 96 px mobile ; coins 28 px ; le fond SVG en `background` couvrant, opacité 0,9 sur fond sombre, 0,6 sur fond clair.
- Le dégradé de la teinte **glisse lentement** (`.jm-flow`, 24 s, aller-retour) ; une forme de la marque (`forme-orbites`, `forme-trajectoire`, `forme-arc`) dérive très lentement en parallaxe (déplacement de 0 à 24 px selon le défilement).
- À l'entrée dans la page : le bandeau descend de 12 px en fondu (400 ms, Élan), puis le titre apparaît mot par mot (`jm-word`, 40 ms d'écart).
- Le motif d'ambiance se pose aussi, à 6–10 % d'opacité, en fond du panneau Crème de la page, fixe, masqué en dégradé vers le bas pour ne jamais gêner la lecture.

---

## 2. Le menu : dégradé animé et curseur-torche

Menu latéral desktop (barre Sapin de 92 px, `app-shell.tsx`, `nav-link.tsx`) :

- **Curseur-torche** : quand le pointeur survole le menu, un halo Lime (cercle de 160 px, `radial-gradient` Lime 22 % → transparent) suit le curseur et **révèle le motif « orbites sombre »** caché sous la barre (le motif est masqué par `mask-image: radial-gradient(circle 120px at var(--mx) var(--my), #000, transparent)`). Effet : on éclaire la barre comme avec une lampe. Variables `--mx`/`--my` posées par un seul écouteur `pointermove` throttlé avec `requestAnimationFrame`. Seulement si `(pointer: fine)` et animations permises. Le halo s'éteint en 300 ms quand le pointeur sort.
- **Élément actif** : pilule au **dégradé Signature qui circule** (`background-size: 200%`, 6 s) avec l'icône Sapin ; un anneau `.jm-ring` fin tourne autour au survol.
- **Indicateur qui glisse** : la pilule active se déplace d'un élément à l'autre lors d'un changement de page (un seul élément positionné, `transform: translateY`, 350 ms, Élan), au lieu d'apparaître d'un coup.
- **Survol d'un élément** : l'icône monte de 2 px et s'éclaire en Lime, le libellé passe de 70 % à 100 % d'opacité (150 ms).
- **Pastille de notification** sur l'icône Messages ou Notifications : pulsation douce (`jm-pulse`) tant qu'il y a du non-lu.

Navigation mobile (pilule flottante en bas) :
- Pas de torche (pas de pointeur). À la place, au toucher : une onde Lime part du doigt (`::after` qui grandit et s'efface, 400 ms).
- L'élément actif est une pilule Lime au dégradé qui circule ; la pilule **glisse** vers le nouvel élément au changement de page ; l'icône fait un petit rebond (Rebond, 250 ms).
- La barre se cache en descendant la page et revient en remontant (translateY, 250 ms).

---

## 3. Entrer dans une page, monter, descendre

- **Transition de page** : API View Transitions de Next.js 16 (`experimental.viewTransition` + `<ViewTransition>`), nommée par zone : le menu et l'en-tête restent fixes, seul le contenu fait un fondu-glissé (sortie 120 ms vers le haut, entrée 280 ms depuis 16 px plus bas). Repli sans View Transitions : entrée seule.
- **Cartes en cascade** : à l'arrivée sur une page, les cartes apparaissent l'une après l'autre (fondu + 16 px, 40 ms d'écart, 8 cartes au maximum, le reste sans délai).
- **Au défilement, dans les deux sens** (demande explicite) : un élément `[data-reveal]` apparaît en entrant dans l'écran **en descendant comme en remontant** : en descendant il vient d'en dessous (+16 px), en remontant il vient d'au-dessus (−16 px). Il ne se cache plus une fois vu sur la page tant qu'il reste à moins d'un écran (pas de clignotement). Le sens est lu dans `MotionRoot` (comparaison du `scrollY`) et posé en `data-dir="up|down"`.
- **Chiffres** : les compteurs (score, progression, crédits) montent de 0 à leur valeur à la première apparition (`splitLastNumber` existe déjà), 600 ms, Arrivée. **Jauges et anneaux** se remplissent en même temps.
- **Graphiques** : les courbes se tracent (`.jm-draw`), les barres poussent depuis la base.

---

## 4. Messages : bienvenue, vérification, notifications

### 4.1 Bienvenue

- **Première connexion après l'inscription** : la page `/app/bienvenue` existe ; l'animer : le personnage illustré `salut` entre en glissant, le logo dessine son J (`.jm-draw`), puis les 3 premiers pas apparaissent en cascade.
- **Chaque retour** (première visite du jour) : un **bandeau de bienvenue** en haut du tableau de bord, sur fond `fond-06-sapin-orbites` : « Bonjour Grâce » écrit mot par mot, une phrase utile qui dépend de l'état réel du compte (« 2 offres correspondent à votre profil », « Reprenez votre formation SQL, il vous reste 3 leçons »), et l'orbe IA qui respire. Se ferme seul après 8 s ou d'un clic ; une seule fois par jour (`localStorage` + date).
- Salutation neutre (pas de « prêt » au masculin) : formulations déjà validées dans les textes.

### 4.2 Vérification et confirmations

- **E-mail non vérifié** : bannière persistante Ambre en haut de toutes les pages `/app` avec « Vérifiez votre adresse e-mail » et « Renvoyer l'e-mail » ; quand la vérification réussit, la bannière se transforme en coche verte qui **se dessine** (tracé SVG 400 ms), puis se replie.
- **Confirmations importantes** (e-mail vérifié, entreprise vérifiée, paiement confirmé, attestation obtenue, candidature envoyée) : carte centrale de réussite avec coche dessinée, éclats de formes de la marque (`forme-etincelle`, `forme-point`) qui s'écartent une seule fois (Rebond), puis bouton de suite. Pas de confettis génériques.
- **Toasts** (`src/components/ui/toast.tsx`) : arrivent du haut à droite (desktop) ou du haut (mobile) avec un glissé + rebond léger, icône animée selon le type (coche qui se dessine, croix, information), **barre de temps** fine en bas qui se vide, pause au survol. `role="status"` / `aria-live="polite"`.

### 4.3 Notifications

- **Cloche** de l'en-tête : quand une notification arrive, elle oscille 3 fois (rotation ±12°, 600 ms) et la pastille Lime apparaît avec un rebond ; le nombre s'incrémente en roulant.
- **Arrivée en direct** : nouvelles notifications par flux SSE (`/api/notifications/stream`) ou, à défaut, interrogation toutes les 60 s quand l'onglet est visible. Une notification importante (invitation à un entretien, message d'un recruteur, paiement) déclenche aussi un toast.
- **Panneau** des notifications : s'ouvre en tombant de la cloche (origine en haut à droite, échelle 0,96 → 1, 200 ms) ; les non lues ont un liseré Lime qui pulse une fois ; « Tout marquer comme lu » fait disparaître les liserés en cascade.

---

## 5. Le diagnostic de carrière, comme un vrai examen

Route `/app/career/diagnostic`. C'est le moment fort de l'expérience : il doit donner l'impression d'un **véritable bilan, mené par l'IA de Jumanly, avec la rigueur d'un médecin**, tout en restant honnête (le diagnostic simplifié du forfait Free est calculé par des règles, sans appel à l'IA : l'animation le dit avec la mention existante `career.diagnostic.result.simple.note`).

### 5.1 Écran d'accueil du diagnostic

- Fond `fond-09-nuit-orbe`. Au centre, **le badge du talent** : une carte d'identité professionnelle (initiales ou photo de profil, prénom, métier visé, ville, nombre de compétences déclarées), légèrement inclinée, qui flotte (`jm-float`).
- **Orbi, l'orbe IA**, tourne en orbite autour du badge (trajectoire elliptique, 6 s par tour, traînée lumineuse Menthe).
- Les 6 dimensions du bilan (5.3) sont posées en constellation autour, éteintes.
- Bouton « Lancer mon diagnostic », durée annoncée (« 6 à 8 minutes »), et « Utiliser mon profil et mon CV pour affiner le bilan » (texte existant) pour pré-remplir.

### 5.2 Pendant les questions : voir où l'on en est

- En haut, **une trajectoire** (forme `trajectoire` de la marque) avec 6 étapes = 6 dimensions. Le point courant avance le long du tracé ; les étapes passées s'allument en Lime ; l'étape courante pulse. Libellé « Étape 2 sur 6 · Vos compétences ».
- **Une question par écran** (mobile et desktop), entrée en glissé latéral (sens selon suivant/précédent), réponses en grandes cartes sélectionnables avec coche qui se dessine.
- À droite (desktop) ou en bas (mobile), **le radar se construit en direct** : chaque réponse fait grandir l'axe concerné avec un léger rebond. On voit son profil se dessiner pendant qu'on répond.
- Enregistrement automatique de chaque réponse : on peut quitter et reprendre (« Reprendre mon diagnostic, étape 3 sur 6 »).

### 5.3 Des questions plus fortes

Le questionnaire actuel (`career.diagnostic.q.*`, 4 parties) est conservé comme base. On le réorganise en **6 dimensions notées sur 100**, avec des questions adaptatives (on ne pose pas de question sur le poste actuel à un étudiant) et pré-remplies depuis le profil quand c'est possible.

| Dimension | Ce qu'elle mesure | Questions (existantes ✓, nouvelles ★) |
|---|---|---|
| 1. Clarté du projet | Savoir où l'on va | ✓ situation, ✓ objectif à 6 mois, ✓ métier visé, ✓ secteurs, ★ « À quel point ce métier vous est-il familier ? » (je l'exerce / je l'ai découvert en stage / j'en ai entendu parler / je le découvre), ★ « Connaissez-vous trois entreprises qui recrutent pour ce métier près de chez vous ? » |
| 2. Compétences | Ce que l'on sait faire, et la preuve | ✓ trois compétences solides, ✓ compétences à développer, ✓ langues, ✓ outils numériques, ★ **auto-évaluation sur 4 niveaux** (Notions → Expert) des 5 compétences les plus demandées pour le métier visé (tirées du référentiel et des offres réelles), ★ « Pouvez-vous le prouver ? » pour chacune (attestation, projet, expérience, rien encore) |
| 3. Expérience | Ce que l'on a déjà fait | ✓ années d'expérience, ✓ niveau d'études, ✓ réalisation dont on est fier, ★ « Avez-vous déjà travaillé avec des résultats chiffrés ? » |
| 4. Outils de candidature | CV, lettre, profil en ligne | ✓ état du CV (pré-rempli si un CV existe sur Jumanly, avec son score), ★ « Avez-vous une lettre de motivation adaptable ? », ★ « Votre profil LinkedIn ou en ligne est-il à jour ? » |
| 5. Préparation aux entretiens | Être prêt le jour J | ✓ confiance de 1 à 5, ★ « Combien d'entretiens avez-vous passés ces 6 derniers mois ? », ★ « Savez-vous présenter votre parcours en 2 minutes ? » (oui / à peu près / non) |
| 6. Recherche active et réseau | Être visible et régulier | ✓ candidatures du mois dernier, ✓ obstacle principal, ✓ temps disponible, ✓ mobilité, ✓ mode de travail, ★ « Combien de professionnels de votre domaine pourriez-vous contacter cette semaine ? » |

Diagnostic personnalisé (Starter et plus) : en plus, ✓ valeurs, ✓ style de travail, ✓ retours reçus, ✓ horizon à 3 ans, et l'IA peut poser **2 questions de relance** générées à partir des réponses précédentes (ex. après une réalisation vague : « Quel a été le résultat concret ? »), dans le quota d'IA.

Calcul : chaque dimension a un barème fixe et versionné (`diagnostic_scoring_v2`), documenté dans `docs/specifications.md` partie 08 à la suite du matching, testé unitairement. L'IA ne note pas : elle explique et propose (règle d'or 3).

### 5.4 L'analyse : le scan

Quand le talent valide la dernière réponse :

1. Le badge revient au centre. **Une ligne de balayage Lime** le parcourt de haut en bas, puis de bas en haut (1,2 s chacun), avec une grille fine qui s'illumine sur son passage (style « scanner »).
2. **Orbi accélère** et resserre son orbite ; les compétences du talent, sous forme de petites pastilles, sont aspirées vers l'orbe.
3. Une **liste d'étapes réelles** se coche l'une après l'autre (coche qui se dessine) : « Lecture de vos réponses », « Lecture de votre profil et de votre CV » (si autorisé), « Comparaison avec les offres de votre métier » (avec le vrai nombre d'offres comparées), « Calcul de vos 6 dimensions », « Préparation de vos priorités ». Chaque étape se coche **quand le traitement correspondant est fini** ; pour le diagnostic par règles, durée minimale de 3 s pour que le moment existe, jamais plus.
4. Les 6 dimensions de la constellation s'allument une à une avec leur couleur de niveau.
5. **Comme un médecin qui remet son compte rendu** : le badge se retourne (rotation 3D, 600 ms) et laisse place à une carte « Votre diagnostic est prêt », avec le niveau global en grand et le bouton **« Voir mon diagnostic »** (pulsation douce jusqu'au clic). Un toast et une notification sont aussi créés (« Votre diagnostic est prêt »).

Si l'IA échoue ou est trop lente (> 25 s) : on bascule sur le diagnostic par règles, on le dit clairement, et on propose de relancer plus tard sans consommer de crédit.

### 5.5 Le résultat

- **Niveau global** sur une échelle en 4 stades, dessinée comme une trajectoire avec la position du talent : **Découverte** (0–39) → **Construction** (40–59) → **Prêt** (60–79) → **Compétitif** (80–100). Le marqueur glisse jusqu'à sa place.
- **Radar des 6 dimensions** (SVG accessible : chaque axe a aussi sa valeur écrite et un tableau lisible par les lecteurs d'écran).
- Pour chaque dimension : note, phrase de constat, **« Pourquoi ? »** (quelles réponses ont compté), et l'action la plus utile (vers une formation Learn, l'éditeur de CV, une simulation d'entretien, des offres Jobs).
- **Les 3 priorités** de la semaine, transformables en plan de progression en un clic.
- **Évolution** : si un diagnostic précédent existe, les écarts par dimension (+8, −3) avec flèches, et le radar précédent en pointillé derrière le nouveau. Historique existant (`career.diagnostic.result.history`).
- Partage : export PDF du bilan (aux couleurs Jumanly, c'est un document de la plateforme) et « Refaire dans 30 jours » (rappel).

---

## 6. Évaluations et progression : voir son niveau

S'applique aux quiz Learn (`/app/learn/.../quiz`), aux simulations d'entretien, au score du CV, aux compétences du profil.

- **Pendant un quiz** : barre de progression en segments (une case par question), qui s'allument en Lime (juste) ou en Brume (à revoir) **après** la correction, pas avant ; compte à rebours en anneau s'il y a un temps limite.
- **Résultat** : anneau qui se remplit jusqu'au score, seuil de réussite marqué sur l'anneau, message selon le résultat ; si réussite, carte d'attestation qui se retourne et proposition « Ajouter à mon CV » (texte existant `learn.certificates.addToCv`).
- **Niveau de compétence** : chaque compétence du profil montre son niveau sur une **échelle en 4 marches** (Notions, Intermédiaire, Avancé, Expert) ; quand une évaluation fait monter d'un niveau, la marche s'allume avec un petit éclat, et un toast le confirme.
- **Tableau de bord** : une carte « Où j'en suis » réunit le niveau du diagnostic, la progression des formations, le score du CV et les candidatures, chacun avec sa jauge animée.

---

## 7. Les barres d'onglets qui défilent

Les barres d'onglets trop longues pour l'écran (navigation Career, filtres Jobs et Learn, onglets de profil) deviennent un **rail d'onglets** (`<TabRail>`), commun à toute l'app :

- Le rail est posé sur une bande translucide (Sapin 6 % sur fond clair, Blanc 8 % sur fond sombre) aux coins de 99 px.
- **Bords en fondu** (`mask-image` en dégradé) seulement du côté où il reste des onglets cachés.
- **Flèches rondes « verre »** (fond blanc 70 % + `backdrop-filter: blur(8px)`, icône chevron) qui apparaissent au survol sur desktop, du côté où l'on peut défiler ; clic = défilement d'une page de rail, doux.
- **Onglet actif** : pilule Sapin avec un **liseré au dégradé Signature qui circule** ; changer d'onglet fait **glisser la pilule** de l'ancien vers le nouveau (un seul indicateur en `transform`).
- **Fil de progression** de 2 px sous le rail, Lime, qui montre où l'on est dans la longueur du rail (largeur = partie visible, position = défilement).
- Glisser à la souris (drag), molette verticale convertie en horizontal, aimantation douce sur les onglets (`scroll-snap-type: x proximity`), et l'onglet actif est **ramené dans l'écran** à l'arrivée sur la page.
- Mobile : défilement au doigt avec inertie ; un léger rebond lumineux sur le bord quand on arrive au bout.
- Clavier : flèches gauche/droite entre onglets, `role="tablist"` ou `nav` selon le cas.

---

## 8. Micro-interactions communes

- **Boutons** : pression = échelle 0,97 (100 ms) ; bouton Lime principal = un **reflet lumineux** le traverse au survol (dégradé blanc 30 % qui passe, 600 ms) ; bouton en chargement = le texte laisse place à trois points qui pulsent, la largeur ne change pas.
- **Cartes** : survol = montée de 2 px et ombre plus profonde ; cartes IA = anneau `.jm-ring` qui tourne lentement au survol ; carte sélectionnée = liseré Sapin qui se dessine.
- **Champs** : focus = anneau Lime qui s'ouvre depuis le centre ; erreur = petit tremblement horizontal (2 allers-retours, 200 ms) et message qui glisse.
- **Chargement** : squelettes avec un balayage Crème → Blanc au lieu du gris standard ; pour l'IA, l'orbe qui respire et la phrase de ce qui se passe.
- **États vides** : personnage illustré `repos` qui respire doucement + motif du module en fond.
- **Score de compatibilité** (dégradé IA) : l'anneau se remplit et le dégradé tourne une fois.

---

## 9. Organisation du code

```
src/components/motion/
  app-motion-root.tsx      // étend MotionRoot à /app : reveal deux sens, data-dir, compteurs, préférence utilisateur
  universe-header.tsx      // bandeau d'univers par module (fond, motif, dégradé, parallaxe)
  torch.tsx                // curseur-torche du menu (pointer: fine, rAF)
  tab-rail.tsx             // rail d'onglets
  scan.tsx                 // scène de scan du diagnostic (badge, balayage, orbite, étapes)
  success-burst.tsx        // confirmation (coche dessinée + éclats de formes)
  count-up.tsx, gauge.tsx, radar.tsx, stage-track.tsx
src/styles/motion.css      // + section « Espace connecté » (garder un seul fichier, sections commentées)
src/config/universes.ts    // module → teinte, fond, motif, forme
```

## 10. Ordre de travail (lots)

1. **Lot A · Socle** : `AppMotionRoot`, préférence « Réduire les animations », `UniverseHeader` sur toutes les pages `/app`, menu (torche, dégradé, pilule qui glisse), navigation mobile, transitions de page, reveal dans les deux sens, `TabRail` partout où une barre déborde.
2. **Lot B · Messages** : bienvenue du jour, bannière de vérification, confirmations, toasts, cloche et panneau de notifications, flux en direct.
3. **Lot C · Diagnostic** : questionnaire en 6 dimensions (textes, barème v2, tests), écran d'accueil, trajectoire des étapes, radar en direct, scan, résultat, évolution.
4. **Lot D · Évaluations** : quiz, résultat, niveaux de compétences, carte « Où j'en suis ».
5. **Lot E · Passage page par page** : appliquer micro-interactions, compteurs, jauges et états vides à chaque page de l'espace talent, puis recruteur, entreprise et partenaire.

Chaque lot : une PR, captures avant/après (desktop 1440 et mobile 390) dans la description, une note dans `docs/journal.md`.

## 11. Définition de fini

- Lint, types, tests et build passent ; `pnpm test:e2e` passe avec et sans `reducedMotion: 'reduce'` (Playwright).
- Aucune régression de contenu : en mode « animations réduites », chaque page affiche exactement les mêmes informations.
- Performance mobile (profil Moto G4 de Lighthouse) : pas de tâche longue > 50 ms due aux animations, CLS < 0,05, pas de chute sous 50 images/s sur le tableau de bord pendant le défilement.
- Le barème du diagnostic v2 est couvert par des tests unitaires (6 dimensions, 4 stades, questions adaptatives).
- Aucune donnée inventée à l'écran ; aucune animation n'affiche un nombre qui n'est pas réel.
- Les nouveaux textes sont dans `textes/textes-application.md` et `messages:check` passe.
