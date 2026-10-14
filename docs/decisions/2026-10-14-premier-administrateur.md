# Premier administrateur en production

**Contexte.** Le premier administrateur se crée avec `pnpm admin:promote <e-mail>`, qui demande un accès
direct à la base. En production (Vercel + Neon), le propriétaire n'a pas de terminal branché sur la base,
et un mot de passe ne doit jamais circuler dans une conversation.

**Décision.** Variable `ADMIN_BOOTSTRAP_EMAIL` (une ou plusieurs adresses, séparées par des virgules).
À l'ouverture d'une session, un compte dont l'adresse est listée, **vérifiée**, et qui n'a encore aucun
rôle de plateforme reçoit `platform_admin`. Le changement est inscrit au journal d'audit
(`via: ADMIN_BOOTSTRAP_EMAIL`). La personne crée son compte elle-même sur `/inscription` et choisit son
mot de passe ; la vérification en deux étapes reste obligatoire pour ouvrir `/admin`.

**Garde-fous.** Adresse vérifiée exigée (le code de vérification ne parvient qu'au titulaire de l'adresse,
ou, tant que les e-mails ne sont pas branchés, aux personnes qui lisent les journaux Vercel). Un compte
ayant déjà un rôle (support, éditeur…) n'est jamais modifié. La variable est à retirer une fois
l'administrateur créé ; les suivants se nomment depuis `/admin/utilisateurs`.
