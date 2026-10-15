# Mes CV et éditeur de CV v2 · brief de refonte

Date : 15 octobre 2026. Maquettes validées le 15 octobre 2026 (le propriétaire a délégué la validation).

Routes : `/app/career/cv` (liste « Mes CV », `src/app/app/career/cv/page.tsx`) et `/app/career/cv/[id]` (éditeur, `src/app/app/career/cv/[id]/page.tsx`).

Maquettes dans `docs/refonte-career/maquette/` :

| Fichier | Contenu |
|---|---|
| `mes-cv-v2.html` | liste « Mes CV », animée, passe en mobile sous 760 px |
| `editeur-cv-v2.html` | éditeur ; les onglets Contenu / Mise en forme fonctionnent (ouvrir avec `#mise-en-forme` pour le second) |
| `mes-cv-desktop.jpg`, `mes-cv-mobile.jpg` | captures pleine hauteur, 1440 et 390 px |
| `editeur-contenu-desktop.jpg`, `editeur-mise-en-forme-desktop.jpg`, `editeur-mobile.jpg` | captures de l'éditeur |

Les valeurs des maquettes sont des exemples (Grâce Mbuyi, scores, dates) : **en production, tout vient des données réelles** (règle d'or 11). Le bloc « Ce qui change » en bas de chaque maquette est une note de validation, pas un élément de page. Les vignettes de CV viennent des aperçus des modèles (`docs/modeles-cv/modeles/apercus/`).

## 0. Ce brief et les modèles de CV

Ce brief est **une refonte de la mise en page**, pas des fonctions. Il s'applique par-dessus `docs/modeles-cv/SPECIFICATION-MODELES-CV.md`, qui reste la référence pour tout ce qui touche aux modèles, aux réglages, à la pagination et à l'export (§ 4 à § 8 de cette spécification).

- **Ne pas modifier** : `docs/modeles-cv/`, `src/features/cv/render/` (CvDocument, CvPreview, pagination), `src/features/cv/templates/`, les routes PDF et le contenu des panneaux `StylePanel`, `PagesPanel`, `ExportPanel` au-delà de leur habillage (classes, conteneur). Si un lot des modèles de CV est en cours sur ces fichiers, attendre qu'il soit fusionné.
- Server Actions, droits (`can`, `talentPlanFor`), quotas et textes existants (`career.cv.*`) sont gardés. Aucun nom de forfait dans le code.
- Même langage visuel que `docs/refonte-career/BRIEF-CAREER-V2.md` (hero Profondeur, cartes à illustration, badges de verrou) et que `docs/experience-animee/` (`motion.css`, rail d'onglets, animations réduites).

---

## 1. « Mes CV » (`/app/career/cv`)

### 1.1 Hero

Composant `CvListHero` (serveur), même famille que `CareerHero` : coins 32 px, `--jm-degrade-profondeur`, halos Lime / Menthe / vert qui glissent (`.jm-flow`), trajectoires en filigrane. Deux colonnes, une seule sous 1180 px.

- Surtitre Néon « Career · Mon CV », titre « Mes CV » 44 px (34 px mobile), phrase d'appui.
- Deux chiffres en cartes de verre avec barre au dégradé Signature : **CV créés** « {count} sur {max} » (`MAX_CVS`), **Score du CV principal** « {score} /100 · {niveau} » (`cvScore(...).total` et `level`). Sans CV principal : la seconde carte n'apparaît pas.
- Boutons : Lime « Nouveau CV » (action `createCv`, désactivé à la limite avec le texte `career.cv.limit`), verre « Choisir un modèle » (`/app/career/cv/modeles?cv=<id du principal>`).
- Scène décorative (`aria-hidden`) : **les vignettes des modèles réellement utilisés** par les CV du talent (jusqu’à 3, `public/cv-templates/NN-<id>.png` comme dans `StylePanel`, sinon les trois premiers modèles inclus) en éventail flottant (−12°, −2°, 9°, `jm-float` décalé), Orbi, une étincelle, une carte flottante « CV principal · {modèle} · {pages} page(s) » avec jauge, et **Amani en pose « montre »** (`Character`) qui désigne l'éventail.

### 1.2 CV principal

Titre de section « CV principal » + « Envoyé par défaut avec vos candidatures ». Grande carte deux colonnes (330 px / reste ; une colonne en mobile) :

- **Illustration** : fond Lime clair (`#F4FDE6 → #B9EE8C`) + grille de points, vignette du modèle du CV (178 px, −4°, flottante) devant une seconde vignette désaturée.
- **Corps** : titre du CV (24 px), badge Lime « ★ CV principal », puces d'information (modèle, libellé ATS du modèle, nombre de pages si connu, « Modifié le… ») ; **bloc score** : jauge circulaire 86 px avec le total, puis les trois critères réels de `cvScore` (Lisibilité ATS, Impact, Mots-clés) en barres, et « Pourquoi ce score ? » qui ouvre l'explication existante du coach (ancre `#coach` de l'éditeur) ; actions : Sapin « Ouvrir l'éditeur », contour « PDF », contour « Dupliquer », menu « … ».
- Le nombre de pages n'est connu qu'après pagination côté client : s'il n'est pas stocké, ne pas l'afficher plutôt que l'inventer.

### 1.3 Mes autres CV

Grille de cartes (4 colonnes ≥ 1180 px, 2 colonnes dessous, 2 colonnes serrées en mobile) :

- Illustration de 200 px (170 px mobile) sur un fond doux qui alterne (Menthe clair, Crème, Néon clair), grille de points, **vignette du modèle** inclinée de −3° qui se redresse et monte de 8 px au survol, **jauge du score** en pastille dans le coin bas droit.
- Corps : titre (16 px), sous-ligne « {modèle} · Modifié le {date} », pied : Sapin « Ouvrir », contour « PDF », menu « … ». En mobile, seul « Ouvrir » reste visible (pleine largeur), le reste passe dans le menu.
- **Menu « … »** (un `<details>` sans JavaScript, comme les filtres Jobs) : Définir comme CV principal (`setPrimaryCv`), Dupliquer (`duplicateCv`), Supprimer (confirmation existante `career.cv.delete.confirm.*`).
- **Carte « Nouveau CV »** en dernier : bordure pointillée, pastille Lime 64 px avec « + », « Nouveau CV », « Rempli à partir de votre profil. Il vous reste {count} CV. ». Masquée à la limite (l'alerte existante s'affiche alors).
- Sans aucun CV : l'état vide existant, habillé comme la carte « Nouveau CV » en grand, avec Amani en pose « salut ».

### 1.4 Bandeau des modèles

Bandeau au dégradé Intelligence, coins 32 px, grille de points blancs : surtitre « Modèles de CV », titre « {total} modèles neutres, lisibles par les logiciels de recrutement », phrase « {included} sont inclus dans votre formule. Vos CV téléchargés ne portent ni logo ni mention Jumanly. » (chiffres tirés du catalogue et des droits), trois pastilles (une ou deux colonnes, avec ou sans photo, {fonts} polices), bouton Lime « Voir les modèles ». À droite (desktop), éventail de 3 vignettes flottantes dont une réservée porte le badge de sa formule.

### 1.5 Données à ajouter

Pour chaque CV de la liste : `templateId` (via `style`), `cvScore(parseCv(content), targets.skills)` (fonction pure, au plus `MAX_CVS` appels) et la vignette du modèle. Rien d'autre.

---

## 2. L'éditeur (`/app/career/cv/[id]`)

### 2.1 Barre d'atelier

Remplace l'en-tête de page sur cette route (le rail `CareerTabs` reste au-dessus). Barre blanche translucide (blanc 86 %, flou 14 px), coins 24 px, **collante** (`position: sticky; top: calc(10px + env(safe-area-inset-top))`) :

- à gauche, le **sélecteur de CV** : tuile au dégradé Signature avec l'icône CV, titre du CV, sous-ligne « CV principal · {count} CV » ; il ouvre la liste existante (`<details>`) ;
- l'état d'enregistrement (`career.cv.saved` / `saving`) en pastille Lime clair ;
- à droite : contour « Nouveau », contour « Dupliquer », bouton rond « … » (Définir par défaut, Supprimer), Sapin « Télécharger le PDF ».
- En mobile : sélecteur + « … » seulement ; « Enregistré » et « Télécharger le PDF » passent dans une **barre d'action fixe** au-dessus du menu bas (blanc 92 %, flou).

Les notices (`ok`, `erreur`) deviennent un bandeau Lime clair avec pastille ✓, sous la barre.

### 2.2 Trois colonnes

`340px | minmax(0,1fr) | 330px`, `gap` 18 px. Sous 1280 px : deux colonnes, la colonne de droite passe dessous en 3 cartes côte à côte ; sous 900 px : une colonne, **l'aperçu en premier** (réduit à 300 px de large ; un toucher l'ouvre en plein écran, § 8.3 de la spécification des modèles).

La colonne centrale et celle de droite sont **collantes** (`top` = hauteur de la barre d'atelier + 16 px) : la feuille reste visible pendant qu'on fait défiler les réglages. Il n'y a plus de grand vide sous l'aperçu.

### 2.3 Colonne gauche : Contenu / Mise en forme

Une seule carte. En tête, un **interrupteur à pilule** (fond Crème, pilule Sapin qui glisse de l'un à l'autre en 450 ms, courbe Arrivée). Les deux onglets restent des liens (`?vue=style`), comme aujourd'hui ; la pilule est placée côté serveur.

**Contenu** :

- Carte d'avancement : jauge « {remplies}/{total} » (à partir de `filled`), titre « Toutes les sections sont remplies » ou « {count} sections à compléter », aide « Changez l'ordre avec les flèches » ;
- Liste des sections : tuile d'icône 36 px (Lime clair ; Sapin avec icône Lime quand la section est ouverte), nom, **sous-ligne de contenu réel** (« {n} postes », « {n} diplômes », « {n} compétences », « {n} langues »), pastille ✓ Lime si remplie ou « À compléter » ; les boutons Monter / Descendre / Masquer apparaissent au survol (toujours visibles au clavier et en tactile). Une section masquée a son nom barré et l'icône œil barré.
- Une section ouverte (`<details open>`) devient une carte blanche à ombre douce. **La section Profil contient le formulaire « Informations » actuel** (nom du CV, résumé avec compteur de caractères, afficher l'e-mail, téléphone facultatif, Enregistrer). Les autres sections ouvertes montrent les boutons d'ordre et un lien « Modifier dans mon profil » vers la rubrique du profil.
- En bas, carte Profondeur « Le contenu vient de votre profil » + bouton Lime « Remplir » (action `refreshCvFromProfile` existante).

**Mise en forme** : le contenu de `StylePanel` (§ 8.2 de la spécification des modèles) dans cet habillage :

- carte Modèle sur fond Crème : vignette 64 px, nom, badge du libellé ATS, lien « Changer de modèle » ;
- pastilles de couleur 30 px (8 par ligne, la sélectionnée entourée d'un anneau Sapin avec ✓ blanc), champ hexadécimal en pilule + badge de contraste + « Appliquer » ;
- polices en liste, chaque « Aa » écrit dans sa police, la sélectionnée encadrée Sapin, badge Lime « Recommandée » ;
- **densité dessinée** : trois boutons avec 3, 4 ou 5 traits plus ou moins serrés, le choisi avec anneau Lime ;
- interrupteur photo (Sapin / Lime quand actif), langue des titres en interrupteur à deux positions.
Filets Brume entre les groupes, libellés en petites capitales espacées.

### 2.4 Colonne centrale : le plan de travail

- Onglets Aperçu du CV / Lettre de motivation / Biographie LinkedIn dans un rail (comme aujourd'hui), au-dessus.
- **Plan de travail** : fond `#E7E1D6 → #DED7CA`, coins 30 px, grille de points Sapin 12 %. Barre d'outils blanche 80 % : « Page {n} sur {total} · A4 » à gauche ; à droite zoom (−, valeur, +) et plein écran. En mobile : seulement le compteur et le plein écran.
- La feuille (`CvPreview`, inchangé) est posée au centre avec une ombre profonde ; pages l'une sous l'autre comme aujourd'hui.
- **La section ouverte est surlignée sur la feuille** : CSS seul, par `:has()` sur le conteneur de l'éditeur — `details[data-section="experience"][open]` surligne `[data-id]` du bloc correspondant (anneau Lime 2 px, fond Lime 14 %, étiquette Sapin avec le nom de la section). Uniquement dans l'aperçu, jamais dans le PDF. Ajouter l'attribut `data-section` côté éditeur ; ne pas toucher au rendu du CV si l'identifiant de bloc suffit.
- Légende sous la feuille : « La section que vous modifiez est surlignée sur la page ».

### 2.5 Colonne droite

Dans cet ordre :

1. **Coach IA** (`CvCoachPanel`, logique inchangée) : fond Intelligence, cercle Néon décoratif, Orbi flottant 40 px, titre ; bloc de verre avec la **jauge 76 px** du total, « Score du CV · {niveau} », mention « Calculé sur votre contenu, sans IA » ; **les trois critères en barres** (étiquette, barre Signature, valeur tabulaire) ; « Pourquoi ? » en Néon. Si l'IA est verrouillée : badge Lime de la formule (`talentPlanFor`) suivi du texte existant ; puis conseils en puces Lime, bouton blanc « Simuler un entretien », mention de pied existante.
2. **Exporter mon CV** (`ExportPanel`) : format en carte Sapin cochée, nom de fichier (retour à la ligne permis partout), Sapin « Télécharger », mention de neutralité.
3. **Pages** (`PagesPanel`) : miniatures avec anneau Sapin sur la page courante, case pointillée « + », texte d'aide, contour « Faire tenir sur une page ».
4. **Adapter à une offre** : carte avec badge de formule dans le coin (Nuit / Néon pour une formule supérieure) ; contenu existant (`tailor.*`).

---

## 3. Mouvement et accessibilité

- `motion.css` existant (`jm-float`, `.jm-flow`, `jm-rise`) ; `transform` et `opacity` seulement ; entrée des blocs en fondu montant de 14 px, décalés de 80 ms, depuis un état visible.
- Animations réduites (préférence système et réglage utilisateur) : tout est immobile, la pilule change de place sans glisser.
- Vignettes et personnages `aria-hidden` ; la jauge a toujours sa valeur en texte. Focus visible (anneau Lime 3 px), cibles de 44 px en mobile, barres collantes qui ne masquent jamais le champ actif (`scroll-margin-top`).
- Pas de nouveau composant client hors l'interrupteur de densité/couleurs déjà client dans `StylePanel`.

## 4. Nouveaux textes

À ajouter dans `textes/textes-application.md` (section `/app/career/cv`), puis `pnpm messages` :

| Clé | Texte |
|---|---|
| `career.cv.list.lead` | Gardez un CV par type de poste. Le CV principal est celui qui part avec vos candidatures. |
| `career.cv.list.count` | CV créés |
| `career.cv.list.countValue` | {count} sur {max} |
| `career.cv.list.primaryScore` | Score du CV principal |
| `career.cv.list.chooseTemplate` | Choisir un modèle |
| `career.cv.list.primaryTitle` | CV principal |
| `career.cv.list.primaryLead` | Envoyé par défaut avec vos candidatures |
| `career.cv.list.othersTitle` | Mes autres CV |
| `career.cv.list.othersLead` | Adaptés à d'autres postes |
| `career.cv.list.openEditor` | Ouvrir l'éditeur |
| `career.cv.list.why` | Pourquoi ce score ? |
| `career.cv.list.more` | Plus d'actions |
| `career.cv.list.newHint` | Rempli à partir de votre profil. Il vous reste {count} CV. |
| `career.cv.list.templatesTitle` | {total} modèles neutres, lisibles par les logiciels de recrutement |
| `career.cv.list.templatesBody` | {included, plural, one {# est inclus dans votre formule.} other {# sont inclus dans votre formule.}} Vos CV téléchargés ne portent ni logo ni mention Jumanly. |
| `career.cv.list.templatesColumns` | Une ou deux colonnes |
| `career.cv.list.templatesPhoto` | Avec ou sans photo |
| `career.cv.list.templatesFonts` | {count} polices |
| `career.cv.list.templatesCta` | Voir les modèles |
| `career.cv.criteria.ats` | Lisibilité ATS |
| `career.cv.criteria.impact` | Impact |
| `career.cv.criteria.keywords` | Mots-clés |
| `career.cv.score.noAi` | Calculé sur votre contenu, sans IA |
| `career.cv.progress.done` | Toutes les sections sont remplies |
| `career.cv.progress.todo` | {count, plural, one {# section à compléter} other {# sections à compléter}} |
| `career.cv.progress.hint` | Changez l'ordre avec les flèches |
| `career.cv.section.count.experience` | {count, plural, =0 {Aucun poste} one {# poste} other {# postes}} |
| `career.cv.section.count.education` | {count, plural, =0 {Aucun diplôme} one {# diplôme} other {# diplômes}} |
| `career.cv.section.count.skills` | {count, plural, =0 {Aucune compétence} one {# compétence} other {# compétences}} |
| `career.cv.section.count.languages` | {count, plural, =0 {Aucune langue} one {# langue} other {# langues}} |
| `career.cv.section.count.summary` | Nom, titre, contact et résumé |
| `career.cv.section.toComplete` | À compléter |
| `career.cv.section.editInProfile` | Modifier dans mon profil |
| `career.cv.profileCard.title` | Le contenu vient de votre profil |
| `career.cv.profileCard.body` | Modifiez votre profil, puis mettez ce CV à jour en un clic. |
| `career.cv.profileCard.cta` | Remplir |
| `career.cv.preview.pageOf` | Page {page} sur {total} · A4 |
| `career.cv.preview.zoomIn` | Agrandir |
| `career.cv.preview.zoomOut` | Réduire |
| `career.cv.preview.fullscreen` | Plein écran |
| `career.cv.preview.highlightHint` | La section que vous modifiez est surlignée sur la page |
| `career.cv.toolbar.label` | Actions du CV |
| `career.cv.toolbar.download` | Télécharger le PDF |
| `career.cv.toolbar.count` | {count, plural, one {# CV} other {# CV}} |
| `career.cv.summary.counter` | {count} / {max} |
| `career.cv.summary.hint` | 3 à 4 lignes conseillées |

Réutiliser les textes existants pour le reste (`career.cv.new`, `duplicate`, `setDefault`, `delete.*`, `saved`, `export.*`, `pages.*`, `tailor.*`, `style.*`, `tab.*`).

## 5. Tests et définition de fini

- e2e « Mes CV » : un talent avec 3 CV voit le CV principal en grande carte avec ses trois critères, 2 cartes « autres », la carte « Nouveau CV » avec le bon reste ; le menu « … » définit un autre CV comme principal ; à `MAX_CVS`, la carte « Nouveau CV » disparaît.
- e2e éditeur : l'interrupteur Contenu / Mise en forme garde la vue dans l'URL ; ouvrir « Expériences » surligne le bloc dans l'aperçu et le PDF exporté n'a aucun surlignage ; la barre d'atelier reste visible en bas de page ; en 390 px l'aperçu est en premier et la barre d'action est fixe.
- Mêmes parcours avec `pnpm test:e2e:reduced`.
- Rendu conforme aux captures (1440 et 390 px), aucun défilement horizontal, aucun vide sous l'aperçu.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `messages:check`, `brand:check` passent ; `docs/journal.md` à jour ; note dans `docs/decisions/` (surlignage par `:has()`, colonnes collantes, menu « … » en `<details>`).
