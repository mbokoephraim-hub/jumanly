# Mes CV et éditeur de CV v2 : choix techniques et écarts

Date : 15 octobre 2026 · brief `docs/refonte-career/BRIEF-CV-V2.md`

## Choix

- **Surlignage de la section ouverte par `:has()`** (`src/styles/cv-v2.css`) : la règle part du
  conteneur `.jm-cv-editor` et vise le bloc `[data-id]` de la feuille d'aperçu (`.cv-pages`).
  Chaque section de l'éditeur est un `<details name="cv-section" data-section="…">` (une seule
  ouverte à la fois). Le nom affiché sur l'étiquette vient des textes, passé en variables CSS
  (`--jm-cv-label-*`). Le rendu du CV (`src/features/cv/render/`) n'est pas touché ; la page
  d'impression n'a pas ce conteneur, donc le PDF n'a aucune trace du surlignage (vérifié par e2e).
- **Colonnes collantes** : la barre d'atelier est collante sur toute la page ; la colonne de
  l'aperçu l'est dès 900 px, et le plan de travail fait au plus la hauteur de l'écran (les pages
  défilent dedans). **Écart** : la colonne de droite (coach, export, pages, adapter) n'est pas
  collante. Ses quatre cartes dépassent la hauteur d'un écran ; collante, leur bas resterait
  inaccessible jusqu'à la fin de la page (ou exigerait un défilement interne peu visible).
- **Menus « … » en `<details>`**, sans JavaScript, comme les filtres Jobs : sur les cartes de
  « Mes CV » (définir comme principal, dupliquer, supprimer avec la confirmation existante) et
  dans la barre d'atelier. « Définir comme principal » depuis la liste garde la personne sur la
  liste (`retour=liste` → `?ok=principal`).
- **Plan de travail** (`src/components/career/cv/workbench.tsx`, client) : compteur de pages lu
  dans la pagination existante (`usePaginationResult`), zoom par la largeur donnée à `CvPreview`
  (inchangé), plein écran rendu dans `document.body` (un ancêtre crée son propre empilement). En
  mobile, la feuille réduite à 300 px s'ouvre en plein écran au toucher (§ 8.3 des modèles).
- **Nombre de pages** : il n'est pas enregistré. Il n'apparaît donc ni dans « Mes CV » ni sur la
  carte flottante du hero, seulement dans l'éditeur une fois la pagination faite.
- **Boutons d'ordre au survol** : sur une section fermée et avec un pointeur seulement, ils
  remplacent l'état (✓ ou « À compléter ») ; au clavier ils apparaissent au focus ; en tactile ils
  sont dans la section ouverte.
- **Compteur du résumé** : sans nouveau composant client (§ 3 du brief), il montre la longueur
  enregistrée, pas la saisie en cours. Limite : 1 000 caractères, celle de `updateCvDetails`.
- **Coach IA** : le composant reçoit les trois critères rendus par la page (`CriteriaBars`) ;
  la logique (consentement, droit, crédits, suggestions) ne change pas. Il est maintenant visible
  dans les deux vues, comme les cartes Export et Pages.
- **Interrupteur « Afficher mon e-mail »** : la case à cocher existante est gardée (l'habillage
  en interrupteur demanderait un composant client).
- **Un texte ajouté hors brief** : `career.cv.list.templatesEyebrow` (« Modèles de CV »), le
  surtitre du bandeau des modèles.
- **Tests** : `getByRole("button", { name: "Nouveau CV", exact: true })` dans les parcours
  existants (la carte « Nouveau CV » a un nom plus long) ; sans aucun CV, le bouton est porté par
  la grande carte vide et le hero n'en montre pas.
