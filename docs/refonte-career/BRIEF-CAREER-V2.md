# Accueil Career v2 · brief de refonte

Date : 15 octobre 2026. Maquette validée par le propriétaire le 15 octobre 2026.

Route : `/app/career` (fichier `src/app/app/career/page.tsx`). Les sous-pages Career ne changent pas.

Maquette de référence dans `docs/refonte-career/maquette/` :

- `career-v2.html` : la maquette animée, à ouvrir dans un navigateur (elle passe en version mobile sous 760 px) ;
- `career-v2-desktop.jpg` (1440 px) et `career-v2-mobile.jpg` (390 px) : les captures pleine hauteur.

Elle remplace la maquette 03-08 (`docs/maquettes/03-espace-talent/`) pour cette seule route. Les valeurs qu'elle affiche sont des exemples d'un compte Free : **en production, tout vient des données réelles** (règle d'or 11). Le bloc « Ce qui change » en bas de la maquette est une note pour la validation : il ne fait pas partie de la page.

Ce brief s'ajoute à `docs/experience-animee/BRIEF-ESPACE-UTILISATEUR.md` et le respecte (bandeau d'univers, rail d'onglets, `motion.css`, animations réduites). Il ne touche ni aux fichiers des modèles de CV (`docs/modeles-cv/`, éditeur et modèles de CV), ni au diagnostic.

---

## 1. Ce qui ne change pas

- Le chargement des données de `page.tsx` (diagnostic, CV principal et score, droits, quotas, plan, documents, LinkedIn, portfolio, entretiens à venir) est gardé tel quel. On ajoute seulement ce que le § 3 demande.
- Les droits passent toujours par `can()` et les clés de droits ; le nom de la formule qui ouvre un outil vient de `talentPlanFor(plans, clé)`. **Aucun nom de forfait dans le code** (règle d'or 2).
- Les textes existants `career.home.*` sont gardés ; les nouveaux sont listés au § 8.
- Le panneau IA « Entraînez-vous à l'oral avant votre entretien » (`AiPanel`) reste, affiché seulement quand un entretien est prévu. Il se place après le groupe 3.
- En-tête de page et `CareerTabs` restent ; dans le rail, un petit cadenas (`lock`, 13 px, opacité 0,55) suit le libellé des onglets dont l'outil est verrouillé.

## 2. Structure de la page

1. En-tête et rail d'onglets (inchangés, cadenas en plus).
2. **Hero « parcours »** (§ 3).
3. **Groupe 1 · Faire le point** : Diagnostic (grande carte sombre, 7/12) + Plan de progression (5/12).
4. **Groupe 2 · Préparer mes candidatures** : Mon CV (6/12, sur deux rangées) + Lettres et documents (3/12) + Préparation LinkedIn (3/12) + Portfolio (6/12).
5. **Groupe 3 · M'entraîner** : Simulations d'entretien (7/12) + Conseils de préparation (5/12, « Bientôt disponible »).
6. Panneau IA de l'entretien à venir (s'il existe).
7. **Bandeau d'offre** (§ 6), seulement s'il reste des outils verrouillés.

Grille : 12 colonnes, `gap` 16 px. Sous 1180 px les cartes 7/12 et 5/12 passent en pleine largeur et les 3/12 en demi-largeur ; sous 760 px tout est sur une colonne. Chaque groupe a un en-tête : pastille carrée Sapin 34 px avec le numéro en Néon, titre 22 px SemiBold, phrase d'appui en Ardoise alignée à droite (sous le titre en mobile). Les numéros sont justifiés : ce sont les étapes du parcours.

## 3. Hero « parcours »

Composant `CareerHero` (serveur), coins 32 px, fond `--jm-degrade-profondeur` + trois halos radiaux (Lime en bas à droite, Menthe en haut à droite, vert `#1E9A64` en bas à gauche) qui glissent lentement (classe `.jm-flow` existante), et le motif `motif-trajectoires-sombre` via `Pattern`. Deux colonnes (1,15 fr / 0,85 fr), une seule colonne sous 1180 px.

**Colonne texte** : surtitre Néon avec un trait de 22 px, titre 46 px (34 px mobile) dont le mot « professionnelle » prend le dégradé Signature en `background-clip: text`, phrase d'appui 16 px Light, puis le **parcours**, puis deux boutons (Lime « Continuer » vers l'étape en cours, verre « Voir mon diagnostic » ou « Commencer le diagnostic »).

**Le parcours en 4 étapes**, calculé côté serveur dans une fonction pure `careerJourney()` (`src/server/services/career-journey.ts`, testée) :

| Étape | Terminée quand | Lien |
|---|---|---|
| 1. Faire le point | un diagnostic existe | diagnostic |
| 2. Construire mon CV | le score du CV principal atteint 60/100 (seuil « Prêt » de l'échelle du diagnostic, `stageFloors.ready`) | CV principal |
| 3. Préparer mes candidatures | au moins un document, une proposition LinkedIn, un projet de portfolio ou une candidature envoyée | documents si ouverts, sinon Jobs |
| 4. M'entraîner | au moins une simulation (écrite ou orale) faite ce mois | simulations |

L'étape **en cours** est la première non terminée. Affichage : carte de verre (blanc 6 %, liseré blanc 10 %), titre « Votre parcours Career », compteur « {done} étape(s) terminée(s) sur 4 », barre de 6 px au dégradé Signature (largeur = done/4, minimum 8 % pour l'étape en cours), puis 4 étapes en grille (2 × 2 en mobile) : pastille 22 px (✓ Lime si terminée, anneau Lime + halo si en cours, contour blanc 25 % sinon), libellé et sous-ligne (date du diagnostic, « En cours », « À venir », « Terminée »). Le seuil de 60 et les règles sont notés dans `docs/decisions/`.

**Colonne scène** (décorative, `aria-hidden`) : trois orbites concentriques (Menthe 28 %, Lime 25 %, la plus petite en pointillés Néon qui tourne en 60 s), un socle lumineux Lime flouté, **Amani en pose « joie »** (`Character`, 190 px de large ; 150 px en mobile) qui flotte (`jm-float`), **Orbi** (`AiOrb` ou `Orbi`, 38 px) en haut à droite, deux étincelles Néon, et **trois cartes flottantes** blanches (rayon 18 px, légère rotation de −4° à 4°, ombre profonde, délais de flottement décalés) :

- **Score du CV** : jauge circulaire (dégradé conique Feuille sur Brume) avec la note réelle, sous-ligne « {score}/100 · {niveau} » (niveau tiré de `bandFor`) ; « Pas encore de CV » s'il n'y en a pas ;
- **Diagnostic** : « Diagnostic fait le {date} » ou « Pas encore de diagnostic » ;
- **Prochaine étape** : le libellé de l'étape en cours ; « Parcours terminé » si les 4 le sont.

Toutes ces valeurs sont réelles. Les anciennes tuiles de chiffres (score, plan, simulations) disparaissent du hero : leurs valeurs passent dans les cartes.

## 4. Les cartes d'outils

Composant `CareerToolCard` (serveur) à deux zones : **l'illustration** en haut (170 px ; 300 px minimum pour Mon CV qui s'étire ; 150 px pour Portfolio ; 200 px pour le groupe 3) puis **le corps** (puce d'icône 38 px, titre 18 px, description, pied).

- Carte blanche, coins 28 px, ombre douce ; au survol elle monte de 4 px, l'ombre s'allonge, les objets de l'illustration montent de 6 px et le chevron du lien avance de 3 px (`transform` seulement).
- Pied séparé par un filet Brume : à gauche l'état réel (texte existant), à droite l'action. Mon CV a un vrai bouton Sapin « Ouvrir mon CV » et une barre de score (`Gauge`).
- **Badge** dans le coin haut droit de l'illustration, jamais à côté du titre :
  - outil ouvert par la formule gratuite : pastille Lime « Inclus » (texte Sapin) ; seulement sur Diagnostic et Mon CV, pour que le talent Free voie ce qu'il a ;
  - outil verrouillé : cadenas + nom de la formule (`talentPlanFor`). Fond Sapin / texte Lime pour la formule la moins chère, fond Nuit / texte Néon avec liseré Néon pour les suivantes ;
  - à venir : verre blanc 85 % flouté, horloge + « Bientôt disponible ».
- **Outil verrouillé** : l'illustration reste visible (c'est elle qui donne envie), avec un voile blanc dégradé sur son bas ; la puce d'icône passe en Brume ; le pied dit « Avec {formule} · {prix} USD/mois » (prix depuis `PublicPlan.priceCents`, formaté) et le lien devient « Débloquer », vers `/app/abonnement`. La carte reste un lien vers l'outil, qui garde son propre écran de verrou.
- **Conseils de préparation** : fond blanc 55 %, bordure pointillée Sapin 18 %, sans ombre ; pied « Arrive prochainement ». Pas de bouton « Me prévenir » tant qu'aucune notification n'existe pour ça.

### Illustrations (HTML/CSS + SVG, aucune nouvelle image)

Composant `CareerArt` avec une variante par outil. Fonds en dégradés doux tirés de la charte, avec une grille de points Sapin 16 % masquée vers le bas (points blancs 14 % sur fond sombre). Les objets flottent avec `jm-float` (6 s, délais −1,5 / −3 / −4,5 s).

| Outil | Fond | Objets |
|---|---|---|
| Diagnostic | dégradé Intelligence, carte sur fond Nuit | le **radar des 6 dimensions du dernier bilan v2** (`Radar`, valeurs réelles) et Orbi ; sans bilan v2, le radar vide (axes seuls) |
| Plan de progression | Néon clair (`#FBFDE9 → #DCEF86`) | trois jalons en pointillés en escalier (objectif, étapes, formations) et une puce calendrier Sapin ; avec un plan, les jalons cochés reprennent l'avancement réel |
| Mon CV | Lime clair (`#F4FDE6 → #B9EE8C`) | deux feuilles de CV schématiques inclinées (−7° et 5°), la carte « Score du CV » avec jauge, et la carte Sapin du premier conseil du coach CV (`cvScore`) quand il y en a un (masquée en mobile) |
| Lettres et documents | Menthe clair | une enveloppe Sapin et une lettre inclinée |
| Préparation LinkedIn | Crème | une carte de profil (bandeau Intelligence, initiales, lignes, trois pastilles de compétences), sans logo LinkedIn |
| Portfolio | Sapin profond | trois cadres de projet en éventail |
| Simulations d'entretien | Lime clair | **Kofi en pose « téléphone »** posé en bas à gauche, une bulle de question, une pastille Sapin avec micro et onde animée (barres Lime, 1,6 s) |
| Conseils | transparent | trois fiches en pointillés en éventail |

Les feuilles, lettres et lignes sont des blocs schématiques (pas de faux texte). Toute l'illustration est `aria-hidden`.

## 5. Diagnostic et plan

- **Diagnostic** : à gauche le texte (description en 6 dimensions), les **4 stades** en pastilles (Découverte, Construction, Prêt, Compétitif), le stade réel du dernier bilan v2 (`stageFor(globalScore)`) en Lime ; aucune pastille active pour un bilan v1 ou sans bilan. Pied : date du dernier diagnostic + « Voir mon diagnostic », ou « Pas encore de diagnostic » + « Commencer le diagnostic ». En mobile, le radar passe sous le texte.
- **Plan de progression** sans plan : « Pas encore de plan », sous-ligne « Créé à partir de votre diagnostic » si un diagnostic existe, lien « Créer mon plan ». Avec un plan : « {done}/{total} étapes » et une `Gauge`.

## 6. Bandeau d'offre

Composant `CareerUpgradeBand`, affiché **seulement si au moins un outil Career est verrouillé** pour le talent. Il présente la formule la moins chère qui ouvre le plus d'outils verrouillés (calcul à partir des droits de `listPublicPlans`, jamais d'un nom écrit en dur) :

- fond dégradé Signature, coins 32 px, halo Sapin en bas à droite ;
- surtitre « Formule {formule} », titre « Débloquez {count} outils pour candidater mieux » (pluriel ICU) ;
- une pastille blanche 70 % par outil ouvert par cette formule (icône `valider` Feuille + titre de l'outil) ;
- prix en grand (« {prix} USD », 30 px, sans retour à la ligne) + « par mois · Mobile Money ou carte », bouton Sapin « Voir les formules » vers `/app/abonnement` ;
- à droite (desktop seulement) Fatou en pose « montre » sur un socle d'ombre, deux étincelles.

Texte Sapin sur le dégradé (jamais blanc sur Lime, règle d'or 10).

## 7. Mouvement et accessibilité

- Réutiliser `src/styles/motion.css` (`jm-float`, `.jm-flow`, `jm-spin`, `jm-rise`) et `AppMotionRoot` ; ajouter seulement ce qui manque (l'onde du micro). `transform` et `opacity` seulement.
- Entrée : le hero puis chaque groupe montent de 14 px en fondu (700 ms, courbe Arrivée, 80 ms de décalage) depuis un état visible.
- `prefers-reduced-motion` et le réglage utilisateur d'animations réduites : tout est immobile, rien n'est caché.
- Les badges et états sont du texte ; aucune information portée par la couleur seule. Focus visible (anneau Lime 3 px). Cibles tactiles de 44 px minimum en mobile.
- Aucun JavaScript client ajouté pour cette page, hors composants déjà clients (rail d'onglets).

## 8. Nouveaux textes

À ajouter dans `textes/textes-application.md`, section `/app/career` (partie 03), puis `pnpm messages` :

| Clé | Texte |
|---|---|
| `career.home.heroTitle` | Votre identité professionnelle, étape par étape |
| `career.home.heroTitleAccent` | professionnelle |
| `career.home.heroLead` | Faites le point, construisez un CV solide, préparez vos candidatures et entraînez-vous. Jumanly vous indique toujours la prochaine étape. |
| `career.home.journey.title` | Votre parcours Career |
| `career.home.journey.count` | {done, plural, =0 {Aucune étape terminée sur 4} one {# étape terminée sur 4} other {# étapes terminées sur 4}} |
| `career.home.journey.step.point` | Faire le point |
| `career.home.journey.step.cv` | Construire mon CV |
| `career.home.journey.step.apply` | Préparer mes candidatures |
| `career.home.journey.step.train` | M'entraîner |
| `career.home.journey.state.done` | Terminée |
| `career.home.journey.state.current` | En cours |
| `career.home.journey.state.next` | À venir |
| `career.home.journey.continue` | Continuer |
| `career.home.journey.finished` | Parcours terminé |
| `career.home.float.cv` | Score du CV |
| `career.home.float.cvSub` | {score}/100 · {band} |
| `career.home.float.diagnostic` | Diagnostic fait |
| `career.home.float.diagnosticSub` | le {date, date, medium} |
| `career.home.float.next` | Prochaine étape |
| `career.home.group.point.title` | Faire le point |
| `career.home.group.point.lead` | Savoir où vous en êtes et où vous allez |
| `career.home.group.apply.title` | Préparer mes candidatures |
| `career.home.group.apply.lead` | Les documents que les recruteurs liront |
| `career.home.group.train.title` | M'entraîner |
| `career.home.group.train.lead` | Arriver prêt le jour de l'entretien |
| `career.home.badge.included` | Inclus |
| `career.home.diagnostic.descV2` | Un bilan en 6 dimensions : clarté du projet, compétences, expérience, outils de candidature, entretiens et réseau. Chaque note est expliquée. |
| `career.home.cv.descV2` | Éditez votre CV par sections, choisissez un modèle et exportez-le en PDF. Le score vous dit quoi améliorer en premier. |
| `career.home.cv.chip.templates` | Modèles |
| `career.home.cv.chip.pdf` | Export PDF |
| `career.home.cv.chip.score` | Score expliqué |
| `career.home.plan.fromDiagnostic` | Créé à partir de votre diagnostic |
| `career.home.plan.create` | Créer mon plan |
| `career.home.locked.with` | Avec {plan} |
| `career.home.locked.withPrice` | Avec {plan} · {price} USD/mois |
| `career.home.locked.cta` | Débloquer |
| `career.home.tips.soon` | Arrive prochainement |
| `career.home.interviews.question` | « Présentez-vous en deux minutes. » |
| `career.home.upgrade.eyebrow` | Formule {plan} |
| `career.home.upgrade.title` | {count, plural, one {Débloquez un outil pour candidater mieux} other {Débloquez # outils pour candidater mieux}} |
| `career.home.upgrade.price` | {price} USD |
| `career.home.upgrade.period` | par mois · Mobile Money ou carte |
| `career.home.upgrade.cta` | Voir les formules |

Les textes de stade (Découverte…) et de niveau du score viennent des clés du diagnostic qui existent déjà.

## 9. Tests et définition de fini

- Unitaires : `careerJourney()` (aucune étape, étapes 1 et 2, tout terminé, seuil de 60 exact) et le choix de la formule du bandeau (aucun outil verrouillé → pas de bandeau).
- e2e : un talent Free voit 4 outils verrouillés, les badges de formule, le bandeau d'offre et un parcours cohérent ; un talent avec la formule qui ouvre tout ne voit ni verrou ni bandeau. Même parcours avec `pnpm test:e2e:reduced`.
- Rendu conforme à `career-v2-desktop.jpg` (1440 px) et `career-v2-mobile.jpg` (390 px), sans défilement horizontal.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `messages:check` et `brand:check` passent ; `docs/journal.md` à jour ; une note dans `docs/decisions/` (règles du parcours, seuil de 60, choix de la formule du bandeau).
