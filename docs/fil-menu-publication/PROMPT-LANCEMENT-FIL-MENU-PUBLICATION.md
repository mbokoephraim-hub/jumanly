# Prompt à coller dans Claude Code · Menu en pilule, publications du Fil et Explorer

À coller tel quel dans une nouvelle session Claude Code ouverte sur le dépôt `jumanly` (branche `main` à jour).

---

Tu travailles sur Jumanly. Lis d'abord `CLAUDE.md`, puis `docs/fil-menu-publication/BRIEF-FIL-MENU-PUBLICATION-CLAUDE-CODE.md`, ses captures (`docs/fil-menu-publication/captures/`) et ses maquettes (`docs/fil-menu-publication/maquette/`). Ces maquettes ont été validées par Ephraïm le 26/10/2026. Elles complètent `docs/modele-b/` et `docs/modele-b-recruteur/` et l'emportent sur eux pour le menu du bas, les publications du Fil et l'Explorer talent.

Fais le travail en trois lots, une PR par lot, dans cet ordre :

1. **Menu en pilule** (talent et recruteur) : pilule Lime avec icône et nom en Sapin pour l'onglet actif, ronds `#203F42` pour les autres, animation 0,34 s, libellés Hub et Chat (textes dans `textes/textes-application.md`, puis `pnpm messages`).
2. **Publication du Fil** : migration `FeedPost.title`, limites 60 / 160 dans `feed-limits.ts` avec Zod partagé, carte titre + texte + image à encoche alignés sur le nom, écran Publier avec compteurs et aperçu, talent et recruteur.
3. **Explorer** : recherche Sapin compacte + bouton Filtres Lime, suppression de la rangée Tout/Offres/Entreprises/Personnes, pastilles plus petites aux couleurs Jumanly, feuille de filtres animée (contrat, salaire, secteur, résidence), filtres appliqués côté serveur. Aucun filtre par genre, âge ou nationalité.

Reproduis fidèlement les maquettes (mesures, couleurs, ordre des éléments), sans inventer d'écran. Respecte les règles d'or, en particulier : candidater reste gratuit, aucun texte en dur, WCAG 2.2 AA, `prefers-reduced-motion`. Avant chaque PR : lint, types, tests, build, e2e du parcours concerné, et une ligne dans `docs/journal.md`. Ne passe au lot suivant qu'une fois le précédent fusionné.
