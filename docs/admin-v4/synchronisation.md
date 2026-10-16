# Admin v4 · Ce que l'admin change, où l'utilisateur le voit

Étape 1 de `docs/admin-v4/PLAN.md` (16 octobre 2026). Règle : une modification ou un ajout fait
dans l'admin s'affiche dès la requête suivante, sur toutes les pages concernées.

## Comment c'est garanti

- **Pages de l'espace connecté et de l'admin** : lues à chaque requête (session, base). Rien à
  invalider, sauf les lectures partagées ci-dessous.
- **Lectures partagées en cache** (`src/server/queries/public.ts`, `"use cache"`) : chacune porte
  une étiquette (`cacheTag`) ; l'action admin qui change la donnée appelle `updateTag(étiquette)`.
  Sur Vercel, le cache est commun à toutes les instances : l'effacement vaut partout.
- **Droits et quotas** (`src/server/entitlements`) : gardés le temps d'une requête seulement.
  Avant cette étape, ils restaient 60 s en mémoire dans chaque instance du serveur : un forfait
  modifié, un droit ou des crédits offerts pouvaient mettre jusqu'à une minute à s'appliquer sur une
  autre instance. Corrigé (`docs/decisions/2026-10-16-admin-v4-etape-1.md`).
- **Session et rôle** : relus en base à chaque requête (pas de cache dans le cookie) : une
  suspension ou un changement de rôle vaut à la requête suivante.

## Tableau

| Élément de l'admin | Pages concernées | Étiquette ou mécanisme | Vérifié |
|---|---|---|---|
| Forfaits (champs, droits, nouveau, copie, retrait, suppression) | accueil, `/tarifs`, `/formations`, `/formations/[slug]`, `/contact`, `/entreprises`, `/recruteurs`, `/talents`, `/inscription/forfait`, `/inscription/compte`, `/llms.txt`, `/app/learn`, `/app/learn/[slug]` ; `/app/abonnement` (lu en base) | `plans` ; droits par requête | ✓ |
| Forfait, droit ou crédits offerts à un compte ; abonnement prolongé, changé, résilié | tout l'espace connecté (menus, verrous, quotas) | droits par requête | ✓ corrigé |
| Formations (fiche, statut, modules, leçons, vidéo, documents PDF) | `/formations`, `/formations/[slug]`, accueil, `/app/learn`, `/llms.txt`, plan du site | `courses`, `course:<slug>` | ✓ |
| Quiz d'une formation (réglages, questions) | `/formations/[slug]`, leçons dans `/app/learn` | `courses`, `course:<slug>` | ✓ corrigé (n'effaçait rien) |
| Attestation révoquée | `/attestations/[code]` | `certificate:<code>` | ✓ |
| Offres (modération, correction demandée, signalement clos) | `/offres`, `/offres/[slug]`, accueil, `/app/jobs`, `/app/jobs/[slug]`, `/entreprises/[slug]` | `jobs`, `job:<slug>` | ✓ |
| Organisations (vérification, suspension, réactivation) | offres et pages entreprise publiques ; espace Hire | `jobs` ; droits par requête | ✓ |
| FAQ, textes modifiables | `/faq`, accueil, `/tarifs` | `contents` | ✓ |
| Bandeaux | tout le site public et l'espace connecté (selon le public visé) | `contents` | ✓ |
| Fiches conseils | `/app/career`, `/app/career/conseils` | `contents` | ✓ |
| Poids du matching | `/comment-fonctionne-le-matching` ; scores calculés à la demande | `matching-weights` | ✓ corrigé (n'effaçait rien) |
| Comptes (suspension, rôle, e-mail vérifié, suppression) | connexion et tout l'espace connecté | session relue en base | ✓ |
| Partenaires et licences | espace partenaire, licences des talents | lecture directe ; droits par requête | ✓ |
| Coûts de l'IA, indicateurs | admin seulement | — | — |

## Tests

- `tests/db/entitlements.test.ts` : un droit accordé ailleurs s'applique à la requête suivante.
- Parcours e2e existants qui vont de l'admin à la page de l'utilisateur : fiche conseil publiée puis
  lue dans Career (`admin-contents.spec.ts`), question de FAQ ajoutée puis lue sur `/faq`
  (`launch.spec.ts`), forfait et crédits offerts (`admin.spec.ts`), PDF d'une formation sur la page
  publique (`admin-v3.spec.ts`), offre modérée (`moderation.spec.ts`).
- Les poids du matching ne sont pas modifiés en e2e : les autres parcours, lancés en parallèle,
  calculent des scores avec eux.
