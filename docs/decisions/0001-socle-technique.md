# 0001 · Choix du socle technique (E0)

Date : 13 octobre 2026 · Statut : accepté

## Décisions

1. **Next.js 16.4 et React 19**, dernières versions stables. Cache Components et Partial Prefetching
   activés (réglages par défaut de Next 16) : pages statiques par défaut, rapides sur réseau lent.
2. **Tailwind CSS 4** configuré en CSS (`@theme`), sans fichier `tailwind.config`. Les jetons restent
   des variables CSS (`--jm-*`) dans `ressources/jumanly-tokens.css`, source unique pour le design.
3. **Sora auto-hébergée** via `@fontsource-variable/sora` : pas de dépendance à Google Fonts au build
   ni à l'exécution, un seul fichier woff2 variable (graisses 100 à 800).
4. **Prisma 7** avec le générateur `prisma-client` (client généré dans `src/generated/prisma`, non
   versionné) et l'adaptateur `@prisma/adapter-pg`. URL de connexion dans `prisma.config.ts`.
5. **next-intl sans préfixe de langue** dans les URL (une seule langue, `fr`). Si l'anglais est
   décidé (E11), on passera au routage par langue.
6. **Textes** : `textes/*.md` est la source ; `messages/fr.json` est généré **et versionné** pour être
   relu dans les PR ; la CI échoue s'il n'est pas à jour.
7. **Aucun texte en dur** imposé par la règle ESLint `react/jsx-no-literals` sur `src/**/*.tsx`.
8. **Noms en français** pour le code métier et les composants (`Bouton`, `ChampTexte`…), comme les
   textes et la documentation.
9. **Tests e2e sur la version de production** (`pnpm build` puis `pnpm start`), en desktop et en mobile.
