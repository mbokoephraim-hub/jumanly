# Site public en français et en anglais (28/10/2026)

**Demande d'Ephraïm** : le site public doit exister en français et en anglais.

- Les pages publiques vivent sous `src/app/[locale]/(public)` ; l'adresse ne change pas, la langue est gardée dans le cookie `jm_langue` (choix par le sélecteur FR / EN de l'en-tête, route `/langue?vers=`). Les pages sont rendues statiquement par langue.
- Les textes anglais sont dans `textes/en/*.md` (mêmes clés que `textes/textes-application.md`) ; `pnpm messages` produit `messages/en.json`, posé par-dessus le français : un texte pas encore traduit reste en français. Un test vérifie que chaque clé anglaise existe en français et garde les mêmes variables.
- next-intl est corrigé (`patches/`) pour mettre en cache la configuration, les textes, le format et la langue **par langue** : la page 404 racine rend l'en-tête en français en même temps qu'une page anglaise, ce qui mélangeait les deux.
- Montants, dates et noms de pays suivent la langue de la page (`src/lib/display-locale.ts`).
- L'espace connecté (`/app`, `/admin`) reste en français pour l'instant. Les contenus venant de la base (offres, formations, descriptions des forfaits) restent dans la langue où ils ont été écrits.
