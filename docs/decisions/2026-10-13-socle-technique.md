# 2026-10-13 · Choix du socle technique (E0)

Statut : accepté, puis confronté à `docs/specifications.md` (parties 02, 03 et 11) : choix conformes,
sauf les écarts notés ci-dessous.

1. **Next.js 16.4 et React 19**, dernières versions stables. Cache Components et Partial Prefetching
   activés (réglages par défaut de Next 16) : pages statiques par défaut, rapides sur réseau lent.
2. **Tailwind CSS 4** configuré en CSS (`@theme` dans `src/app/globals.css`), sans `tailwind.config`.
   Les jetons officiels `ressources/jumanly-tokens.css` restent la source unique.
3. **Écart avec les jetons officiels : Sora auto-hébergée.** La ligne `@import` vers Google Fonts du
   fichier de jetons est mise en commentaire ; Sora est servie par le site (`@fontsource-variable/sora`
   + `next/font/local`). Raison : pas de dépendance à un service externe, moins de requêtes sur réseau
   lent (CLAUDE.md § 9). `--jm-font` est redéfinie dans `globals.css` pour pointer sur cette police.
4. **Compléments d'interface hors jetons officiels** : Ambre, Corail et Menthe claire (partie 11),
   plus leurs versions foncées pour le texte (contraste AA vérifié par axe), dans `globals.css`.
   Pas d'ombre : la hiérarchie vient des fonds (§ 11.3).
5. **Prisma 7** avec le générateur `prisma-client` (client généré dans `src/generated/prisma`, non
   versionné) et l'adaptateur `@prisma/adapter-pg`. Configuration dans `prisma.config.ts`.
6. **next-intl sans préfixe de langue** dans les URL (une seule langue, `fr`). Passage au routage par
   langue si l'anglais est décidé. Clés de traduction typées : une clé inexistante ne compile pas.
7. **Clés de textes en anglais** (`common.brand.name`), comme le reste du code ; les textes restent en
   français. `messages/fr.json` est généré **et versionné** pour être relu dans les PR ; la CI échoue
   s'il n'est pas à jour.
8. **Aucun texte en dur** imposé par la règle ESLint `react/jsx-no-literals` sur `src/**/*.tsx`.
9. **E-mails** : React Email, rendus hors requête Next.js avec `createTranslator` sur `messages/fr.json`.
10. **Icônes** : `lucide-react` (trait 2 px, extrémités rondes, conforme à la charte) en attendant les
    icônes de la marque.
11. **Tests e2e sur la version de production** (`pnpm build` puis `pnpm start`), en desktop et mobile.
12. **Modale et tiroir sur l'élément natif `<dialog>`** plutôt qu'une bibliothèque (Radix) : piège
    du focus et touche Échap gérés par le navigateur, zéro Ko de JavaScript en plus.
13. **Filtres en pilule sans JavaScript** (case à cocher stylée dans un formulaire GET) : pages de
    recherche publiques légères.
14. **`APP_ENV`** (`local`, `preview`, `staging`, `production`, vide = `local`) décide de
    l'existence des pages internes `/dev/…` (partie 03, § 3.7).
