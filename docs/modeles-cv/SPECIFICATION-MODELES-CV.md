# Jumanly · Spécification des modèles de CV

Version 1.0 · 14 octobre 2026 · à placer dans le dépôt sous `docs/modeles-cv/` avec le dossier `modeles/` et le dossier `interface/`.

Ce document complète le cahier des charges (`docs/specifications.md`, parties 05 et 07) et les maquettes de la page `/app/career/cv` (lot 9). En cas de contradiction sur les modèles de CV, **ce document l'emporte** ; les écarts sont listés dans la partie 12.

---

## 1. En bref

- Jumanly propose **15 modèles de CV** à tous ses utilisateurs : **5 gratuits** et **10 réservés** aux forfaits supérieurs.
- Chaque modèle est **dynamique** : couleur d'accent, police, densité, photo, langue des titres, ordre des sections et nombre de pages se règlent librement, sans toucher au contenu.
- La police recommandée, proposée par défaut, est **Sora**, la police de l'application.
- Les couleurs sont présentées en deux groupes : les **couleurs recommandées pour les logiciels de recrutement (ATS)** et les **autres couleurs** (couleurs de base).
- Il existe des modèles **avec photo** (photo facultative) et **sans photo**, à **une colonne** ou **deux colonnes**.
- Un CV fait **1, 2 ou 3 pages** ; l'utilisateur peut ajouter une page à l'endroit qu'il choisit.
- **Le CV téléchargé est neutre** : aucun logo, aucune couleur, aucune police imposée ni aucune mention de Jumanly. C'est le document de l'utilisateur.
- **L'interface** qui sert à choisir, régler et télécharger le CV, elle, suit l'identité visuelle de Jumanly (maquettes dans `interface/`).

---

## 2. Principes non négociables

1. **Neutralité du document.** Le fichier PDF ou Word exporté ne contient ni logo, ni filigrane, ni pied de page « Créé avec Jumanly », ni couleur de la marque imposée, ni lien vers Jumanly. Les couleurs Vert Sapin #0F3F37 et Lime #A6F26B ne figurent pas dans la palette des modèles. Les métadonnées du PDF portent le nom de l'utilisateur (titre « CV Prénom Nom », auteur « Prénom Nom ») et aucun champ « Créateur » au nom de Jumanly.
2. **Le contenu ne change jamais quand on change de modèle.** Le modèle n'est qu'une mise en forme. Changer de modèle, de couleur ou de police ne modifie, ne coupe et ne supprime aucun texte. Une section qu'un modèle ne prévoit pas est ajoutée à la fin de la colonne principale.
3. **Lisible par les logiciels de recrutement.** Le texte du PDF est sélectionnable, dans l'ordre de lecture, avec les polices intégrées. Aucun texte n'est transformé en image. Les niveaux dessinés (jauges, pastilles) sont toujours aussi écrits en toutes lettres.
4. **Accessibilité des couleurs.** Le texte courant est toujours noir (#1A1D21) ou gris foncé (#555B63) sur fond blanc. La couleur d'accent ne sert qu'aux titres, filets, pastilles et aplats. Une couleur dont le contraste sur blanc est inférieur à 4,5:1 est refusée (voir 4.1).
5. **Ce qui est vu est ce qui est téléchargé.** L'aperçu et l'export utilisent le même code HTML, la même feuille de style et le même algorithme de pagination (partie 6). La page affichée à l'écran est exactement la page du PDF.
6. **Les droits se vérifient côté serveur.** L'accès à un modèle réservé est contrôlé à l'application du modèle et à l'export, jamais seulement dans l'interface.

---

## 3. Le catalogue des 15 modèles

Aperçu de l'ensemble : `modeles/planche-15-modeles.png`. Chaque modèle a sa feuille de style (`modeles/css/modele-<id>.css`), une page de démonstration (`modeles/html/NN-<id>.html`), un PDF (`modeles/pdf/NN-<id>.pdf`) et une vignette (`modeles/apercus/NN-<id>.png`). Toutes les valeurs sont aussi dans `modeles/catalogue.json`.

### 3.1 Les 5 modèles gratuits (tous les forfaits, Free compris)

| N° | Id | Nom | Mise en page | Photo | Couleur par défaut | Lisibilité ATS | Pages conseillées | Pour qui |
|---|---|---|---|---|---|---|---|---|
| 01 | `classique` | Classique | Une colonne, en-tête centré, filets fins | Sans | Encre | Excellente | 1 à 2 | Tous profils, candidatures en ligne |
| 02 | `epure` | Épuré | Une colonne, titres de sections dans une marge à gauche | Facultative (carrée) | Graphite | Excellente | 1 à 2 | CV sobre et aéré |
| 03 | `premier-emploi` | Premier emploi | Une colonne ; formation et projets avant l'expérience ; compétences en étiquettes | Facultative (ronde) | Pétrole | Excellente | 1 | Étudiants, jeunes diplômés, stages |
| 04 | `moderne` | Moderne | En-tête teinté, colonne secondaire à droite | Facultative (ronde) | Bleu | Très bonne | 1 à 2 | Tous profils |
| 05 | `colonne` | Colonne | Barre latérale teintée à gauche (photo, coordonnées, compétences) | Facultative (ronde) | Forêt | Très bonne | 1 à 2 | Tous profils |

### 3.2 Les 10 modèles réservés

| N° | Id | Nom | Accès | Mise en page | Photo | Couleur par défaut | ATS | Pages | Pour qui |
|---|---|---|---|---|---|---|---|---|---|
| 06 | `executif` | Exécutif | Starter et plus | Une colonne, bandeau fin en haut, encadré « Réalisations clés » | Sans | Bordeaux | Excellente | 2 | Cadres, managers |
| 07 | `bandeau` | Bandeau | Starter et plus | Bandeau plein de couleur avec photo, colonne secondaire à droite en cartes | Facultative (ronde) | Marine | Très bonne | 1 à 2 | Commerce, services |
| 08 | `contraste` | Contraste | Starter et plus | Barre latérale foncée en texte blanc, compétences et langues en pastilles | Facultative (ronde) | Pétrole | Bonne | 1 à 2 | Se démarquer à l'impression |
| 09 | `parcours` | Parcours | Starter et plus | Frise chronologique : dates à gauche, ligne et pastilles | Facultative (ronde) | Turquoise | Très bonne | 1 à 2 | Parcours riches, reconversions |
| 10 | `compact` | Compact | Starter et plus | Marges réduites, en-tête sur une ligne, compétences en trois colonnes ; densité compacte par défaut | Sans | Encre | Excellente | 1 | Longues carrières sur une page |
| 11 | `academique` | Académique | Pro et plus | Sections numérotées, publications et communications en références [1], [2]… ; rappel du nom en haut des pages suivantes | Sans | Marine | Excellente | 2 à 3 | Enseignants, chercheurs, bourses |
| 12 | `creatif` | Créatif | Pro et plus | Grand monogramme (initiales) ou photo, nom très présent, cartes teintées à droite | Facultative (remplace le monogramme) | Brique | Bonne | 1 à 2 | Communication, design |
| 13 | `tech` | Tech | Pro et plus | Compétences regroupées par domaine, projets avant l'expérience, outils sous chaque poste | Sans | Violet | Très bonne | 1 à 2 | Développement, data, numérique |
| 14 | `elegant` | Élégant | Pro et plus | En-tête centré avec photo ronde, titres centrés entre deux filets | Facultative (ronde) | Prune | Très bonne | 1 à 2 | Hôtellerie, juridique, profils seniors |
| 15 | `visuel` | Visuel | Pro et plus | Grande photo, jauges de compétences, pastilles de langues | Facultative (rectangulaire) | Framboise | Bonne | 1 à 2 | Montrer ses niveaux d'un coup d'œil |

Répartition : 5 gratuits, 5 dès Starter, 5 dès Pro. Bilan par forfait : **Free 5 modèles, Starter 10, Pro 15, Premium 15.** 10 modèles proposent une photo facultative, 5 sont sans photo. 9 sont à une colonne, 6 à deux colonnes ou barre latérale.

### 3.3 Libellés de lisibilité ATS

| Valeur | Libellé affiché | Sens |
|---|---|---|
| `excellente` | ATS excellente | Une colonne, aucun décor porteur d'information |
| `tres-bonne` | ATS très bonne | Deux colonnes ou décors légers ; ordre de lecture conservé |
| `bonne` | ATS bonne | Barre latérale foncée ou jauges ; toujours lisible, mais à éviter pour les candidatures déposées sur des portails automatiques |

Un filtre « ATS excellente » existe dans la galerie, et le libellé `career.cv.template.ats` s'affiche sous chaque modèle `excellente` ou `tres-bonne`.

---

## 4. Ce que l'utilisateur peut régler

Tous les réglages s'appliquent à **tous les modèles**, gratuits comme réservés. Ils sont enregistrés par CV (un même utilisateur peut avoir un CV « Banque » en Marine et un CV « ONG » en Forêt).

### 4.1 Couleur d'accent

Seize couleurs, toutes vérifiées sur fond blanc (contraste WCAG). Les huit premières sont présentées en premier sous le titre « Recommandées pour les logiciels de recrutement » : elles sont sombres et sobres, s'impriment bien en noir et blanc et gardent un contraste d'au moins 9:1.

| Code | Nom | Hex | Groupe | Contraste |
|---|---|---|---|---|
| `encre` | Encre | #1F2933 | Recommandée ATS | 14,8:1 |
| `marine` | Marine | #1B365D | Recommandée ATS | 12,1:1 |
| `petrole` | Pétrole | #0B4F5C | Recommandée ATS | 9,2:1 |
| `foret` | Forêt | #24503A | Recommandée ATS | 9,2:1 |
| `bordeaux` | Bordeaux | #6B1E2E | Recommandée ATS | 11,4:1 |
| `prune` | Prune | #4A2545 | Recommandée ATS | 12,8:1 |
| `brun` | Brun | #5A3A22 | Recommandée ATS | 10,2:1 |
| `graphite` | Graphite | #3D434A | Recommandée ATS | 10,0:1 |
| `bleu` | Bleu | #1D5FBF | Autre couleur | 6,1:1 |
| `turquoise` | Turquoise | #0E7C86 | Autre couleur | 5,0:1 |
| `vert` | Vert | #2E7D32 | Autre couleur | 5,1:1 |
| `brique` | Brique | #B23A2B | Autre couleur | 5,9:1 |
| `orange` | Orange brûlé | #B4530A | Autre couleur | 5,0:1 |
| `violet` | Violet | #6D3FB3 | Autre couleur | 7,0:1 |
| `framboise` | Framboise | #B0285F | Autre couleur | 6,3:1 |
| `acier` | Acier | #4F6D8A | Autre couleur | 5,4:1 |

- **Couleur personnalisée** : un champ hexadécimal accepte toute couleur dont le contraste sur blanc est **au moins 4,5:1**. En dessous, la couleur est refusée avec le message `career.cv.style.color.tooLight` et l'interface propose la teinte la plus proche qui passe (même teinte, luminosité réduite). Le contraste s'affiche à côté du champ (« Contraste 12,1:1 »).
- **Teintes dérivées** calculées automatiquement à partir de l'accent : `--cv-doux` (7 % de l'accent sur blanc, fonds d'en-tête et de barre latérale claire) et `--cv-doux2` (15 %, étiquettes et fonds de jauges). Ne jamais demander ces teintes à l'utilisateur.

### 4.2 Police

| Code | Police | Style | Statut |
|---|---|---|---|
| `sora` | Sora | Sans empattement | **Recommandée, par défaut sur tous les modèles** |
| `inter` | Inter | Sans empattement | Proposée |
| `source-sans` | Source Sans 3 | Sans empattement | Proposée |
| `lato` | Lato | Sans empattement | Proposée |
| `merriweather` | Merriweather | Avec empattement | Proposée |
| `lora` | Lora | Avec empattement | Proposée |

Toutes sont sous licence SIL Open Font License : elles peuvent être intégrées au PDF et hébergées par Jumanly. Les fichiers TTF sont fournis dans `modeles/polices/`. Les polices sont **auto-hébergées** (pas d'appel à Google Fonts à l'export). Le badge « Recommandée » apparaît à côté de Sora.

### 4.3 Densité

| Code | Libellé | Taille du texte | Espace entre sections | Marges |
|---|---|---|---|---|
| `aeree` | Aérée | 10,25 pt | 6,5 mm | 17 mm |
| `standard` | Standard (par défaut, sauf Compact) | 9,6 pt | 5,4 mm | 14 mm |
| `compacte` | Compacte | 9 pt | 4 mm | 11 mm |

Aucune taille de texte en dessous de 9 pt.

### 4.4 Photo

- Les modèles marqués « Photo facultative » ont un emplacement photo ; l'interrupteur `career.cv.info.photo.text` l'affiche ou le masque. **Désactivé par défaut** (texte d'aide existant : « De nombreux recruteurs préfèrent un CV sans photo »).
- Photo désactivée : l'emplacement disparaît et la mise en page se resserre (pas de cadre vide). Exception : **Créatif** affiche alors un monogramme (initiales sur l'accent).
- Les modèles « sans photo » n'ont pas d'emplacement ; l'interrupteur est grisé avec `career.cv.style.photo.unsupported`.
- La photo vient de la photo de profil ou d'un fichier propre au CV (JPG, PNG, WEBP, 2 Mo maximum, comme le cahier des charges). Recadrage carré dans l'interface ; la forme (ronde, carrée arrondie, rectangulaire) est fixée par le modèle.

### 4.5 Langue des titres

Français ou English. Seuls les titres de sections et les libellés de niveaux changent (« Expérience professionnelle » / « Work experience », « Avancé » / « Advanced ») ; le contenu de l'utilisateur n'est pas traduit. Les libellés des deux langues sont dans `modeles.py` (`TITRES`, `NIVEAUX`) et doivent passer dans les fichiers de traduction (`cv.titles.*`, `cv.levels.*`), indépendamment de la langue de l'interface.

### 4.6 Sections : ordre, affichage, titres personnalisés

- Chaque modèle définit un **ordre par défaut** (`ordreSections` dans `catalogue.json`) et, pour les modèles à deux colonnes, les sections placées dans la **colonne secondaire** (`colonneSecondaire`).
- L'utilisateur peut monter, descendre, masquer une section (textes existants `career.cv.section.*`) et la déplacer d'une colonne à l'autre sur les modèles à deux colonnes (`career.cv.section.moveColumn`).
- Une section personnalisée (`custom`) peut recevoir un titre libre (ex. « Publications »).
- Changer de modèle **réapplique l'ordre par défaut du nouveau modèle** seulement si l'utilisateur n'avait pas modifié l'ordre ; sinon son ordre est conservé.

### 4.7 Pages : 1, 2 ou 3, et l'utilisateur ajoute les siennes

- La pagination est **automatique** (partie 6) : le contenu passe sur la page suivante quand la page est pleine.
- L'utilisateur peut **ajouter une page** à l'endroit qu'il veut : « Commencer une nouvelle page ici » sur une section ou sur un élément (une expérience, une formation). Le saut est enregistré (`pageBreaks`) et visible dans l'aperçu (trait pointillé « Saut de page avant « Engagement » »). Il se retire d'un clic.
- **Maximum 3 pages** (valeur réglable par l'admin, `cv.pages.max`). Au-delà de 2 pages, le message existant `career.cv.export.tooLong` s'affiche, sans bloquer. Si le contenu dépasse 3 pages, l'export est bloqué avec `career.cv.pages.overMax` et deux propositions : passer en densité compacte, masquer une section.
- Bouton **« Faire tenir sur une page »** : essaie dans l'ordre densité compacte, puis réduction des marges du modèle de 2 mm ; s'il n'y arrive pas, il le dit (`career.cv.pages.fitFailed`) et ne coupe aucun texte.
- Sur les pages 2 et 3 : pas d'en-tête complet ; numéro « 2 / 3 » en bas à droite ; certains modèles ajoutent un rappel discret du nom (Académique) ou un liseré de couleur (Exécutif, Bandeau).

---

## 5. Données

### 5.1 Ce qui existe déjà

Le modèle `Document` du cahier des charges (`kind = cv`, `templateId`, `content` en JSON, `fileUrl`, `isPrimary`) est conservé. On ajoute un champ `style` (JSON) et on précise le format de `content`.

```prisma
model Document {
  // … champs existants (profileId, kind, title, templateId, content, fileUrl, isPrimary)
  style      Json?     // CvStyle, voir 5.3 ; null = valeurs par défaut du modèle
  pageCount  Int?      // nombre de pages calculé au dernier rendu
}
```

Le catalogue des modèles vit **dans le code** (registre typé), pas en base : les modèles sont versionnés avec l'application. Seul le niveau d'accès est surchargeable par l'admin (5.4).

### 5.2 Contenu d'un CV (`content`)

Exemples complets : `modeles/donnees/exemple-junior.json`, `exemple-senior.json`, `exemple-academique.json` (structure à reprendre en TypeScript ; les noms de champs y sont en français, les traduire en anglais dans le code).

```ts
type CvContent = {
  info: { firstName: string; lastName: string; headline: string; city?: string; email?: string;
          links: { label: string; url: string }[]; photoUrl?: string };
  summary?: string;            // section « Profil »
  highlights?: string[];       // « Réalisations clés » (affichée par Exécutif, ailleurs en section ordinaire)
  sections: CvSection[];
};
type CvSection = {
  id: string; type: 'experience' | 'education' | 'skills' | 'languages' | 'certificates' | 'projects'
    | 'volunteer' | 'interests' | 'publications' | 'talks' | 'teaching' | 'custom';
  title?: string;              // titre personnalisé ; sinon titre traduit du type
  hidden?: boolean;
  items: CvItem[];
};
type CvItem = {
  id: string; title: string; organization?: string; location?: string;
  start?: string; end?: string; current?: boolean;          // dates libres affichées telles quelles : « mars 2023 », « 2024 »
  text?: string; bullets?: string[]; tools?: string;
  level?: 1 | 2 | 3 | 4;       // compétences : Notions, Intermédiaire, Avancé, Expert (même échelle que ProfileSkill)
  languageLevel?: string;      // langues : « Langue maternelle », « B2, intermédiaire avancé »
  group?: string;              // compétences : domaine (utilisé par Tech)
};
```

Coordonnées : comme le prévoit `career.cv.info.contact.hint`, les coordonnées affichées sont l'e-mail, la ville et des liens. **Pas de champ âge, situation familiale ni nationalité.** Le téléphone personnel du talent n'est pas prévu par les textes actuels (voir 12).

### 5.3 Réglages d'un CV (`style`)

```ts
type CvStyle = {
  accent: string;              // code de la palette ('marine') ou '#RRGGBB' validé (contraste ≥ 4,5)
  font: 'sora' | 'inter' | 'source-sans' | 'lato' | 'merriweather' | 'lora';
  density: 'aeree' | 'standard' | 'compacte';
  showPhoto: boolean;
  titlesLanguage: 'fr' | 'en';
  sectionOrder?: string[];     // ids de sections, colonne principale
  sideSections?: string[];     // ids de sections placées dans la colonne secondaire
  pageBreaks?: string[];       // ids de sections ou d'éléments précédés d'un saut de page
};
```

Valeurs par défaut : celles du modèle dans `catalogue.json` (`couleurParDefaut`, `policeParDefaut` = `sora`, `densiteParDefaut`), `showPhoto = false`, `titlesLanguage` = langue de l'interface.

### 5.4 Droits

Remplacer dans `docs/specifications.md` partie 05 la ligne `career.cv.templates.max` par :

| Clé de droit | Free | Starter | Pro | Premium |
|---|---|---|---|---|
| `career.cv.templates.access` | `free` | `starter` | `pro` | `pro` |

Un modèle est utilisable si son niveau (`free` < `starter` < `pro`) est inférieur ou égal à celui du forfait. Les licences Partners suivent le forfait sponsorisé. Le niveau de chaque modèle est modifiable dans `/admin/forfaits` (table `CvTemplateAccess { templateId, access }`, vide par défaut = valeurs du registre). Aucun nom de forfait dans le code des modèles.

---

## 6. Rendu, pagination et export

### 6.1 Un seul rendu HTML pour l'aperçu et l'export

- Un composant React `<CvDocument content style templateId />` produit le HTML du CV : un `<article class="cv tpl-<id> d-<densité>">` avec les variables `--cv-accent` et `--cv-police`. Le balisage est le même pour les 15 modèles (voir `modeles/html/*.html`) ; **seules changent la feuille de style du modèle et la configuration** (blocs de l'en-tête, colonne secondaire, présentation des compétences et des langues).
- Feuilles de style : `modeles/css/cv-base.css` (socle commun) + `modeles/css/modele-<id>.css`. Les reprendre telles quelles (CSS ordinaire importé dans le composant, ou CSS Modules), **sans Tailwind** : ce sont des styles d'impression en mm et en pt, isolés de l'interface.
- Présentations disponibles (`presentations` dans le catalogue) : compétences en `ligne`, `liste-niveau`, `chips`, `grille`, `barres`, `points`, `groupes` ; langues en `ligne`, `liste-niveau`, `liste`, `points` ; centres d'intérêt en `ligne`, `chips`, `liste`. Le rendu de chacune est dans `source/modeles.py` (`liste_comp`, `liste_langues`).

### 6.2 Pagination (identique à l'écran et dans le PDF)

Implémentation de référence : `modeles/js/pagination.js` (une centaine de lignes, à porter en TypeScript dans un hook `usePagination`). Principe :

1. Le CV complet est rendu une fois, caché.
2. On crée une page A4 fixe (210 × 297 mm, `overflow: hidden`) à partir du gabarit de page du modèle (zones `tete`, `principal`, `lateral`, `pied` placées par une grille CSS propre à chaque modèle).
3. On verse les blocs un par un dans la colonne principale, puis dans la colonne secondaire. Unités insécables : le titre d'une section avec son premier élément, puis chaque élément. Si un bloc déborde, il passe sur la page suivante ; un titre ne reste jamais seul en bas de page.
4. Les sauts manuels (`pageBreaks`) forcent une nouvelle page.
5. **Charger les polices avant de mesurer** (`document.fonts.load` pour les graisses 300 à 700 de la police choisie) : sans cela, la mesure se fait avec une police de secours et des lignes sont coupées dans le PDF.
6. Le résultat (nombre de pages, alerte `trop-de-pages` ou `element-trop-long`) remonte à l'interface.

Relancer la pagination après chaque modification, avec un délai de 300 ms.

### 6.3 Export PDF

- Route `POST /api/cv/[documentId]/export?format=pdf` : vérifie la propriété du document et le droit `career.cv.templates.access` **avant** tout rendu, puis ouvre dans un navigateur sans interface une page interne d'impression `/impression/cv/[documentId]` (jeton signé à usage unique, 60 s, pas de navigation de l'app, pas de cookie de session), attend `document.body.dataset.pret === '1'`, puis `page.pdf({ preferCSSPageSize: true, printBackground: true })`.
- Navigateur : `puppeteer-core` + `@sparticuz/chromium` dans une fonction Vercel (mémoire 1 Go, délai 30 s), ou une tâche Inngest si le délai devient un problème. Les polices sont lues depuis le dépôt (`public/fonts/cv/`).
- Écart avec le cahier des charges : la partie « Pile technique » prévoit `@react-pdf/renderer` pour les PDF. **Pour les CV, on utilise Chromium**, parce que les 15 modèles reposent sur des grilles CSS et sur la même pagination que l'aperçu. `@react-pdf/renderer` reste prévu pour les attestations et les factures.
- Nom du fichier : `CV-Prenom-Nom.pdf` (sans accents ni espaces), ou `CV-Prenom-Nom-<titre-du-cv>.pdf` si l'utilisateur a plusieurs CV.
- Le PDF est stocké (R2) pour les candidatures : une candidature garde la copie envoyée même si le CV change ensuite (déjà prévu par `career.cv.delete.confirm.body`).

### 6.4 Export Word

Format `docx` (bibliothèque `docx`) : **version simplifiée à une colonne** quel que soit le modèle, avec la police, la couleur d'accent des titres et l'ordre des sections de l'utilisateur. Un message l'annonce avant le téléchargement (`career.cv.export.docxNote`). Pas de barre latérale, de jauges ni de photo dans le Word.

### 6.5 Vignettes

Les vignettes de la galerie sont des images fixes rendues avec les données de démonstration : `modeles/apercus/NN-<id>.png` (600 px), à copier dans `public/cv-templates/`. L'aperçu « avec votre contenu » d'un modèle, lui, est rendu en direct avec `<CvDocument>`.

---

## 7. Règles pour les logiciels de recrutement (ATS)

À respecter dans tous les modèles, y compris les futurs :

- Texte réel et sélectionnable ; ordre du HTML = ordre de lecture (colonne principale avant la colonne secondaire).
- Titres de sections standards (« Expérience professionnelle », « Formation », « Compétences »…) : les titres personnalisés restent possibles mais l'interface les signale (`career.cv.section.customTitleHint`).
- Pas de tableau pour la mise en page, pas de texte dans des images, pas d'icône à la place d'un mot (« LinkedIn » est écrit, pas seulement dessiné).
- Dates au même format dans tout le CV.
- Les jauges et pastilles sont doublées d'un niveau écrit (visible ou masqué visuellement mais présent dans le texte du PDF).
- Le coach IA (score « Lisibilité ATS » déjà prévu) baisse la note des modèles « ATS bonne » et le dit avec un « Pourquoi ? ».

---

## 8. Interface (aux couleurs de Jumanly)

Maquettes : `interface/01-galerie-modeles-desktop.png` et `-mobile.png`, `interface/02-mise-en-forme-desktop.png` et `-mobile.png` (+ PDF et HTML autonomes dans `interface/html/`). Elles utilisent le socle des maquettes page par page (`jumanly-ui.css`, icônes, gabarit de l'espace connecté) : les reproduire comme les autres pages.

### 8.1 Galerie « Choisir un modèle »

Route : `/app/career/cv/modeles` (ou panneau plein écran depuis « Changer de modèle »), paramètre `?cv=<documentId>`.

- Filtres en pastilles : Tous (15), Inclus dans mon forfait (n), Avec photo, Sans photo, Une colonne, Deux colonnes, ATS excellente. Tri : Recommandés (par défaut), Gratuits d'abord, Nom.
- Rappel en tête : « 5 modèles inclus dans votre forfait · 10 autres avec Starter ou Pro ».
- Carte de modèle : vignette au format A4, étiquette « Inclus » (Lime) ou cadenas + forfait requis (Sapin, texte Néon), coche Sapin sur le modèle actuel, nom, type de mise en page, icône profil si photo possible.
- Panneau de détail (à droite sur desktop, en bas sur mobile) : aperçu **avec le contenu de l'utilisateur**, description, étiquettes (ATS, colonnes, photo, pages), puis :
  - modèle inclus : bouton « Utiliser ce modèle » (`career.cv.template.apply`) puis toast `career.cv.template.applied` ;
  - modèle réservé : encadré « Disponible avec Starter » (`career.cv.template.locked`), boutons « Aperçu plein écran » et « Voir les forfaits » (vers `/app/abonnement?suite=/app/career/cv/modeles`). Après souscription, retour sur la galerie avec le modèle présélectionné.
- Mention sous le panneau : « Vos CV téléchargés ne portent ni logo ni mention Jumanly. » (`career.cv.template.neutral`).

### 8.2 Mise en forme

Dans l'éditeur `/app/career/cv`, le panneau de gauche reçoit deux onglets : **Contenu** (sections, comme aujourd'hui) et **Mise en forme**. La carte « Modèle » existante de la maquette du lot 9 ouvre la galerie.

Ordre des réglages : Modèle (vignette + « Changer ») · Couleur d'accent (recommandées ATS, autres couleurs, champ personnalisé avec contraste) · Police (chaque nom écrit dans sa propre police, Sora avec le badge « Recommandée ») · Densité (Aérée, Standard, Compacte) · Photo (interrupteur) · Langue des titres (Français, English).

Au centre : les pages A4 du CV, l'une sous l'autre, avec les sauts de page visibles. À droite : carte « Pages » (miniatures, « 2 sur 3 au maximum », « Ajouter », « Commencer une nouvelle page ici », « Faire tenir sur une page ») et carte « Exporter mon CV » (PDF recommandé ou Word, nom du fichier, nombre de pages, « Télécharger »). Le coach IA de la maquette du lot 9 reste accessible depuis l'onglet Aperçu.

Chaque réglage s'enregistre immédiatement (indicateur « Enregistré » existant) ; annuler avec Ctrl+Z dans la session.

### 8.3 Mobile

Galerie en deux colonnes, filtres défilants, barre d'action fixe en bas pour le modèle sélectionné. Mise en forme : aperçu réduit en haut (touché = plein écran avec pages défilantes), réglages dessous en une colonne. Cibles tactiles de 44 px minimum.

### 8.4 États à prévoir

| Situation | Comportement |
|---|---|
| CV vide | Galerie consultable avec les données de démonstration ; « Utiliser ce modèle » renvoie à l'éditeur (`career.cv.empty`) |
| Modèle réservé ouvert en aperçu | Aperçu complet avec le contenu de l'utilisateur ; le mot « Aperçu » est posé **par l'interface** sur l'image, jamais dans le document ; export et enregistrement indisponibles |
| Forfait rétrogradé (ex. Pro → Free) | Le CV garde son modèle et reste consultable ; à l'export, message `career.cv.template.downgraded` et choix d'un modèle inclus en un clic (le contenu ne bouge pas) ; les PDF déjà envoyés aux recruteurs ne changent pas |
| Plus de 2 pages | Message `career.cv.export.tooLong`, export possible |
| Plus de 3 pages | Export bloqué, `career.cv.pages.overMax` + propositions |
| Élément plus haut qu'une page | Alerte sur l'élément (`career.cv.pages.itemTooLong`) |
| Couleur trop claire | Refus + teinte proposée (`career.cv.style.color.tooLight`) |
| Export en cours / échec | Textes existants `career.cv.export.preparing`, `.ready`, `.error` |
| Hors connexion | Réglages gardés localement et envoyés au retour ; export indisponible |

---

## 9. Textes à ajouter

À ajouter dans `textes/textes-application.md`, section `/app/career/cv` (les clés `career.cv.template.*` existantes sont réutilisées telles quelles).

| Clé | Texte |
|---|---|
| `career.cv.templates.title` | Choisir un modèle |
| `career.cv.templates.subtitle` | Changez de mise en page quand vous voulez : votre contenu ne bouge pas. |
| `career.cv.templates.count` | {included} modèles inclus dans votre forfait · {others} autres avec Starter ou Pro |
| `career.cv.templates.filter.all` | Tous ({count}) |
| `career.cv.templates.filter.included` | Inclus dans mon forfait ({count}) |
| `career.cv.templates.filter.photo` | Avec photo |
| `career.cv.templates.filter.noPhoto` | Sans photo |
| `career.cv.templates.filter.oneColumn` | Une colonne |
| `career.cv.templates.filter.twoColumns` | Deux colonnes |
| `career.cv.templates.filter.atsBest` | ATS excellente |
| `career.cv.templates.sort` | Trier : {order} |
| `career.cv.template.preview` | Aperçu avec votre contenu |
| `career.cv.template.previewFull` | Aperçu plein écran |
| `career.cv.template.previewBadge` | Aperçu |
| `career.cv.template.seePlans` | Voir les forfaits |
| `career.cv.template.lockedHint` | Inclus dans {plans}. Changer de modèle ne modifie jamais votre contenu. |
| `career.cv.template.neutral` | Vos CV téléchargés ne portent ni logo ni mention Jumanly. |
| `career.cv.template.downgraded` | Votre forfait ne comprend plus le modèle « {templateName} ». Choisissez un modèle inclus pour télécharger ce CV : votre contenu reste identique. |
| `career.cv.template.ats.excellent` | ATS excellente |
| `career.cv.template.ats.veryGood` | ATS très bonne |
| `career.cv.template.ats.good` | ATS bonne |
| `career.cv.template.layout.one` | Une colonne |
| `career.cv.template.layout.two` | Deux colonnes |
| `career.cv.template.layout.side` | Barre latérale |
| `career.cv.template.photo.optional` | Photo facultative |
| `career.cv.template.photo.none` | Sans photo |
| `career.cv.tab.content` | Contenu |
| `career.cv.tab.style` | Mise en forme |
| `career.cv.style.color.recommended` | Recommandées pour les logiciels de recrutement |
| `career.cv.style.color.others` | Autres couleurs |
| `career.cv.style.color.custom` | Couleur personnalisée |
| `career.cv.style.color.contrast` | Contraste {ratio}:1 |
| `career.cv.style.color.hint` | Le texte reste noir sur fond blanc. La couleur ne sert qu'aux titres, aux filets et aux décors. |
| `career.cv.style.color.tooLight` | Cette couleur est trop claire pour être lue facilement. Essayez {suggestion}. |
| `career.cv.style.font.recommended` | Recommandée |
| `career.cv.style.font.hint` | Toutes les polices sont intégrées au PDF. |
| `career.cv.template.density.standard` | Standard |
| `career.cv.style.photo.unsupported` | Ce modèle n'a pas d'emplacement photo. |
| `career.cv.style.titlesLanguage` | Langue des titres |
| `career.cv.style.titlesLanguage.hint` | Seuls les titres de sections changent. Votre texte n'est pas traduit. |
| `career.cv.section.moveColumn` | Changer de colonne |
| `career.cv.section.customTitleHint` | Un titre courant (« Expérience », « Formation ») est mieux reconnu par les logiciels de recrutement. |
| `career.cv.pages.title` | Pages |
| `career.cv.pages.count` | {count} sur {max} au maximum |
| `career.cv.pages.add` | Ajouter |
| `career.cv.pages.breakHere` | Commencer une nouvelle page ici |
| `career.cv.pages.breakLabel` | Saut de page avant « {sectionName} » |
| `career.cv.pages.removeBreak` | Retirer le saut de page |
| `career.cv.pages.fitOne` | Faire tenir sur une page |
| `career.cv.pages.fitFailed` | Votre CV ne tient pas sur une page sans couper de texte. Masquez une section ou raccourcissez une expérience. |
| `career.cv.pages.hint` | Les recruteurs lisent surtout la première page. Au-delà de deux pages, nous vous le signalons. |
| `career.cv.pages.overMax` | Votre CV dépasse {max} pages. Passez en densité compacte ou masquez une section pour pouvoir le télécharger. |
| `career.cv.pages.itemTooLong` | Cet élément est plus long qu'une page. Raccourcissez-le pour qu'il s'affiche en entier. |
| `career.cv.export.fileName` | {fileName} · {count, plural, one {# page} other {# pages}} · texte sélectionnable |
| `career.cv.export.docxNote` | La version Word est simplifiée sur une colonne pour rester modifiable facilement. |

Titres des sections dans le document (`cv.titles.*`, en français et en anglais) et niveaux (`cv.levels.*`) : reprendre les dictionnaires `TITRES` et `NIVEAUX` de `source/modeles.py`.

Corriger aussi `faq.talents.a4` : « un modèle de CV standard » devient « 5 modèles de CV ».

---

## 10. Organisation du code proposée

```
src/features/cv/
  templates/
    registry.ts            // les 15 modèles : id, nom, accès, grille, photo, défauts, ordre, colonne secondaire, présentations (catalogue.json)
    base.css               // = modeles/css/cv-base.css
    <id>.css               // = modeles/css/modele-<id>.css (15 fichiers)
  render/
    CvDocument.tsx         // balisage commun (section, élément, compétences, langues, en-tête)
    usePagination.ts       // port de modeles/js/pagination.js
    palette.ts             // 16 couleurs + contraste WCAG + teinte proposée
  export/
    pdf.ts                 // puppeteer-core + @sparticuz/chromium
    docx.ts
  ui/
    TemplateGallery.tsx    // 8.1
    StylePanel.tsx         // 8.2
    PagesPanel.tsx
public/fonts/cv/            // = modeles/polices/*.ttf
public/cv-templates/        // = modeles/apercus/NN-<id>.png
```

## 11. Étapes et définition de fini

À intégrer dans la feuille de route du cahier des charges :

- **E3** (CV) : `<CvDocument>`, pagination, les 5 modèles gratuits, réglages couleur, police, densité, photo, langue des titres, sauts de page, export PDF. Un talent Free choisit parmi 5 modèles.
- **E7** (paiement) : les 10 modèles réservés, verrous, aperçu des modèles réservés, retour après souscription, rétrogradation.
- **E10** (documents) : export Word simplifié.

Fini quand :

1. Les 15 modèles rendus avec `modeles/donnees/exemple-*.json` ressemblent aux PDF de référence `modeles/pdf/` (comparaison visuelle automatisée, tolérance faible).
2. Le PDF exporté et l'aperçu ont le même nombre de pages et les mêmes coupures pour les 3 jeux de données et les 3 densités.
3. Le texte extrait du PDF (`pdftotext`) contient tous les champs saisis, dans l'ordre de lecture, y compris les niveaux des jauges.
4. Aucun PDF exporté ne contient « Jumanly », le logo ni les couleurs #0F3F37 et #A6F26B (test automatique sur le texte et les métadonnées).
5. Un compte Free ne peut ni appliquer ni exporter un modèle réservé, même en appelant l'API directement (test).
6. Changer de modèle 15 fois de suite ne modifie pas `content` (test).
7. Une couleur de contraste inférieur à 4,5:1 est refusée par l'API comme par l'interface.

---

## 12. Points à valider par Ephraïm

1. **Répartition des 10 modèles réservés** : proposition 5 dès Starter et 5 dès Pro (Free 5, Starter 10, Pro et Premium 15). Alternative : les 10 dès Starter, ou les 10 dès Pro seulement.
2. **Écart avec la note conceptuelle** : elle donne « un modèle de CV standard » au forfait Free ; on passe à 5 gratuits comme demandé. La FAQ et `docs/specifications.md` partie 05 sont à corriger (partie 9 et 5.4).
3. **Export PDF par Chromium** au lieu de `@react-pdf/renderer` pour les CV (6.3).
4. **Téléphone sur le CV** : les textes actuels ne prévoient que l'e-mail, la ville et des liens. Beaucoup de recruteurs en Afrique attendent un numéro ; faut-il ajouter un champ téléphone facultatif propre au talent ? (Sans lien avec la décision de ne publier aucun numéro de Jumanly.)
5. **Maximum de pages** : 3 par défaut, réglable par l'admin.

---

## 13. Fichiers fournis

| Chemin | Contenu |
|---|---|
| `SPECIFICATION-MODELES-CV.md` | Ce document |
| `MESSAGE-CLAUDE-CODE.txt` | Message à coller dans Claude Code |
| `modeles/catalogue.json` | Les 15 modèles, 16 couleurs, 6 polices, densités, pages, accès |
| `modeles/css/cv-base.css`, `modeles/css/modele-*.css` | Feuilles de style de référence |
| `modeles/js/pagination.js` | Pagination de référence |
| `modeles/html/NN-<id>.html` | Les 15 modèles en HTML autonome (ouvrir dans Chrome, imprimer en PDF) |
| `modeles/html/variantes/*.html` | 8 variantes : autre couleur, autre police, sans photo, titres en anglais, densité compacte, monogramme, CV long |
| `modeles/pdf/` | PDF A4 de chaque modèle et de chaque variante |
| `modeles/apercus/` | Vignettes 600 px, pages en 150 dpi, variantes |
| `modeles/planche-15-modeles.png` | Vue d'ensemble des 15 modèles |
| `modeles/donnees/exemple-*.json` | 3 CV de démonstration (junior, cadre, chercheur) |
| `modeles/polices/` | Sora, Inter, Source Sans 3, Lato, Merriweather, Lora (TTF, OFL) + `polices.css` |
| `interface/` | Maquettes de la galerie et de la mise en forme (desktop, mobile, PDF, HTML) |
| `source/` | Générateur Python des modèles et des maquettes (`modeles.py`, `donnees.py`, `interface.py`, `rendu.js`, `apercus.py`) |
