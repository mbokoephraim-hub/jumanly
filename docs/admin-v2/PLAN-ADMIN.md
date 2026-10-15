# Jumanly Admin v2 · plan par étapes

Date : 15 octobre 2026. Demande du propriétaire : une administration où **chaque page fonctionne
comme prévu** (ajouter une formation, vérifier un utilisateur, voir les forfaits utilisés…) et dont
le design est **plus intelligent et mieux présenté**. Le travail est découpé en 9 étapes, envoyées
une par une. Chaque étape a son prompt prêt à coller (section 3).

## 1. Où on en est (inventaire au 15 octobre 2026)

L'admin vit sous `/admin` (13 écrans refaits au lot 13, PR #43, maquettes `docs/maquettes/07-jumanly-admin/`).
Trois rôles l'ouvrent (`src/server/auth/roles.ts`) : `platform_admin` (tout), `support_agent`
(lecture seule), `content_editor` (Formations et Contenus seulement). Le kit partagé est
`src/components/admin/kit.tsx`, les actions sont dans `src/server/actions/admin.ts` et
`src/server/actions/course-admin.ts`. Les écarts du lot 13 sont listés dans
`docs/decisions/2026-10-15-refonte-lot-13.md`.

| Page | Ce qui marche | Ce qui manque |
|---|---|---|
| `/admin` Indicateurs | Période 7/30/90 jours, comparaison, export CSV, file « À traiter », comptes payants par forfait, coût IA | Coût d'acquisition, coût par utilisateur, marge (aucun coût saisi) ; les forfaits **gratuits** ne sont pas comptés ; pas d'alertes ni de lien direct « voir les comptes de ce forfait » |
| `/admin/utilisateurs` | Recherche, filtres (forfait, rôle, statut, pays), fiche, suspension avec motif, rôle plateforme | Vérifier l'e-mail à la main, renvoyer le code, lien de réinitialisation, forfait manuel ou offert, export des données, suppression du compte, historique des actions sur ce compte |
| `/admin/organisations` | Onglets, filtres, fiche, vérification (accepter/refuser) | Suspension (aucun statut en base), « Demander un complément », pièces justificatives (rien n'est stocké), membres de l'organisation |
| `/admin/forfaits` et `/[code]` | Forfaits par famille, abonnés en cours, modification des prix, droits et quotas avec aperçu de l'impact | Nouveau forfait, dupliquer, motif enregistré, historique des versions, liste des comptes d'un forfait |
| `/admin/abonnements` | Liste, filtres, paiements, remboursement manuel | Prolonger, changer de forfait, résilier, enregistrer un paiement manuel |
| `/admin/formations` et `/[id]` | Création par titre, éditeur (fiche, modules, leçons, quiz, attestations, publication) | Création guidée de bout en bout, envoi de la vidéo et de l'image (seule une adresse est saisie), aperçu « comme un talent », contrôle avant publication, duplication, statistiques (inscrits, achèvement) |
| `/admin/offres` | File de modération, contrôle automatique, accepter/refuser | « Demander une correction » distincte d'un refus |
| `/admin/signalements` | Liste, fiche, clôture | Retirer le contenu, avertir ou suspendre l'auteur, note interne, informer la personne qui a signalé, contexte de la conversation |
| `/admin/partenaires` | Création de partenaire, invitation de gestionnaire, lots de licences | Modifier un partenaire, motif à la création d'un lot, suivi d'un lot (codes utilisés) |
| `/admin/ia` | Consommation, poids du matching versionnés, contestations, journal du matching | Crédits consommés (seulement un nombre d'appels), coût par forfait |
| `/admin/contenus` | FAQ, bannières, motif de publication | Conseils de préparation, restauration d'une ancienne version |
| Journal d'audit | La table `AuditLog` existe et se remplit | **Aucune page** pour le consulter |

Le parcours de cohérence du 15 octobre a confirmé que toutes ces pages s'ouvrent sans erreur ; il
n'a pas cliqué chaque bouton. L'étape 1 le fait.

## 2. Les étapes

| # | Étape | Ce que le propriétaire verra |
|---|---|---|
| 1 | Socle et recette | Un design plus lisible sur toutes les pages, une recherche globale, le journal d'audit, chaque bouton testé |
| 2 | Indicateurs intelligents | Un tableau de bord qui dit quoi faire, tous les forfaits utilisés (gratuits compris), les coûts saisis |
| 3 | Utilisateurs | Vérifier, aider, offrir un forfait, exporter, supprimer un compte |
| 4 | Organisations | Vérifier avec pièces, demander un complément, suspendre |
| 5 | Forfaits et abonnements | Créer, dupliquer, historique ; gérer un abonnement de A à Z |
| 6 | Formations | Ajouter une formation complète, vidéo et image comprises, et la publier sans erreur |
| 7 | Modération | Offres et signalements traités jusqu'au bout |
| 8 | Partenaires, IA, contenus | Les derniers manques de ces trois pages |
| 9 | Passe finale | Cohérence, accessibilité, guide d'utilisation de l'admin |

Ordre conseillé : 1 d'abord (les autres s'appuient sur son kit), puis 2 à 8 dans l'ordre, 9 à la fin.

## 3. Les prompts

### Règles communes (rappelées dans chaque prompt)

Chaque prompt se termine par ce bloc. Il est recopié en entier pour que chaque étape se suffise à
elle-même.

> **Règles** : lire `CLAUDE.md`, `docs/specifications.md` (parties 05, 07 § 6, 10) et la maquette de
> la page dans `docs/maquettes/07-jumanly-admin/` (PDF et HTML) avant de coder. Textes uniquement
> dans `textes/textes-application.md` (partie 09), puis `pnpm messages`. Aucun nom de forfait dans
> le code : droits via `can()` et `consume()`, forfaits lus en base. Écriture dans l'ordre valider →
> session → rôle → droit → quota → service ; logique dans `src/server/services/`. Toute action
> sensible demande un motif et écrit dans `AuditLog`. `support_agent` voit sans modifier,
> `content_editor` ne voit que Formations et Contenus. Aucun bouton sans effet, aucune donnée
> inventée : si une fonction n'est pas construite, ne pas l'afficher. Pas de numéro de téléphone.
> E-mails via l'adaptateur `src/server/adapters/email.ts` (sans clé Resend, l'e-mail factice part
> dans les journaux). Migrations Prisma nommées clairement. Tests : unitaires ou en base pour chaque
> règle, e2e Playwright pour chaque action de l'étape (rôles autorisé et refusé). Avant de terminer :
> `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm test:e2e`, `pnpm build` ;
> captures 1440 et 390 px dans `/mnt/project-files/captures/admin-v2/etape-N/` ; entrée dans
> `docs/journal.md` ; écarts dans `docs/decisions/2026-MM-JJ-admin-v2-etape-N.md`. Une PR, fusionnée
> automatiquement dès que la CI est verte. Puis attendre l'étape suivante.

---

### Étape 1 · Socle et recette

> Réalise l'étape 1 du plan `docs/admin-v2/PLAN-ADMIN.md` : socle de Jumanly Admin v2.
>
> 1. **Recette** : écris un test e2e `tests/e2e/admin.spec.ts` qui ouvre les 13 écrans de `/admin`
>    avec `platform_admin`, `support_agent` et `content_editor` (comptes de démo `*@jumanly.test` ;
>    ajoute au seed un compte fictif `support@jumanly.test`, il n'existe pas encore),
>    et qui déclenche **chaque action existante** au moins une fois (suspendre puis réactiver,
>    changer un rôle, modifier un forfait, rembourser, vérifier une organisation, modérer une offre,
>    clore un signalement, enregistrer des poids, traiter une contestation, créer partenaire et lot,
>    créer et publier une formation, enregistrer FAQ et bannière). Corrige tout ce qui échoue.
>    Liste les corrections dans le journal.
> 2. **Kit v2** (`src/components/admin/kit.tsx`) : hiérarchie plus claire (titre, résumé chiffré en
>    tête de page, état vide illustré avec l'action utile), cartes et tables plus aérées, pastilles
>    de statut homogènes (couleurs de la partie 11, texte Sapin sur Lime), confirmation visible
>    après chaque action (message de succès qui dit ce qui a changé et lien « Voir dans le
>    journal »). Applique-le aux 13 écrans sans changer leur contenu.
> 3. **Recherche globale** dans l'en-tête : un champ qui trouve comptes, organisations, offres,
>    formations et forfaits (par nom, e-mail, identifiant), résultats groupés par type, accessible
>    au clavier, filtrée selon le rôle. Fonctionne sans JavaScript (formulaire GET vers
>    `/admin/recherche`).
> 4. **Journal d'audit** : nouvelle page `/admin/journal` (rubrique dans la barre latérale,
>    `platform_admin` et `support_agent`) : filtres par auteur, action, type de cible, période ;
>    chaque ligne dit en français qui a fait quoi, sur quoi, avec le motif ; lien vers la fiche de
>    la cible. Export CSV journalisé. Chaque fiche (utilisateur, organisation, forfait, formation)
>    gagne un encadré « Historique » avec ses 10 dernières actions.
>
> [Règles communes]

### Étape 2 · Indicateurs intelligents

> Réalise l'étape 2 du plan `docs/admin-v2/PLAN-ADMIN.md` : le tableau de bord `/admin`.
>
> 1. **Forfaits utilisés** : un bloc qui compte les comptes actifs de **tous** les forfaits, gratuits
>    compris, par famille (talent, RH, entreprise, partenaire), avec la part de chaque forfait, les
>    abonnements offerts (`sponsored`) à part, et la variation sur la période. Chaque ligne mène à
>    `/admin/utilisateurs?forfait=…` ou `/admin/organisations?forfait=…`.
> 2. **Ce qui demande votre attention** : la file « À traiter » devient une liste priorisée
>    (vérifications en attente, offres à modérer, signalements, contestations, paiements bloqués,
>    abonnements qui expirent sous 7 jours, consommation IA anormale), chaque élément avec son
>    ancienneté et un bouton qui ouvre directement la fiche concernée. Les règles de priorité sont
>    déterministes, écrites dans un service testé, et chaque alerte a un « Pourquoi ? ».
> 3. **Coûts** : une page `/admin/indicateurs/couts` où l'administrateur saisit chaque mois ses
>    coûts (acquisition, hébergement, IA hors Jumanly, autres) en USD. Avec ces saisies, le tableau
>    de bord calcule coût d'acquisition, coût par utilisateur actif et marge brute ; sans saisie, il
>    garde « Pas encore de données ». Nouvelle table, montants en centimes.
> 4. **Présentation** : en tête, 4 chiffres clés (utilisateurs actifs, revenu mensuel récurrent,
>    conversion vers payant, coût IA) avec leur tendance ; graphiques SVG côté serveur lisibles à
>    390 px ; l'export CSV inclut les nouveaux blocs.
>
> [Règles communes]

### Étape 3 · Utilisateurs

> Réalise l'étape 3 du plan `docs/admin-v2/PLAN-ADMIN.md` : la page `/admin/utilisateurs` et sa
> fiche.
>
> 1. **Vérifier un utilisateur** : la fiche montre clairement l'état du compte (e-mail vérifié ou
>    non, double authentification, dernière connexion, méthode de connexion, organisations,
>    attestations). Actions : renvoyer le code de vérification ; marquer l'e-mail comme vérifié à
>    la main (motif obligatoire) ; envoyer un lien de réinitialisation du mot de passe.
> 2. **Forfait manuel** : attribuer ou retirer un forfait offert pour une durée (abonnement
>    `sponsored` avec date de fin, motif obligatoire), et ajouter des crédits ou un quota
>    ponctuel via `EntitlementOverride`. La fiche affiche droits et quotas restants, d'où ils
>    viennent (forfait, licence, surcharge).
> 3. **Export des données** du compte (partie 10 : droit d'accès) en fichier JSON téléchargeable,
>    journalisé ; **suppression du compte** en deux temps (motif, puis saisie de l'e-mail pour
>    confirmer) : anonymisation selon la partie 10, candidatures conservées sans données
>    personnelles, impossible sur son propre compte et sur le dernier `platform_admin`.
> 4. **Liste** : colonnes forfait, statut et vérification lisibles en un coup d'œil ; filtre
>    « e-mail non vérifié » ; actions groupées sûres (exporter la sélection en CSV, journalisé).
>    Un `support_agent` voit tout mais n'agit pas.
>
> [Règles communes]

### Étape 4 · Organisations

> Réalise l'étape 4 du plan `docs/admin-v2/PLAN-ADMIN.md` : la page `/admin/organisations` et sa
> fiche.
>
> 1. **Vérification avec pièces** : l'organisation peut joindre des justificatifs (PDF ou image,
>    5 Mo max) depuis son espace ; ils sont stockés derrière une interface de stockage avec une
>    implémentation `fake` (S3 quand les variables existent, voir `.env.example`). L'admin les
>    ouvre depuis la fiche (consultation journalisée).
> 2. **Demander un complément** : nouveau statut de vérification « complément demandé », message à
>    l'organisation (e-mail et notification), retour automatique en « en attente » quand elle
>    répond.
> 3. **Suspension** d'une organisation (statut en base, migration) : ses offres sont masquées, ses
>    membres ne peuvent plus agir dans Hire, motif obligatoire, réactivation possible. Les
>    candidatures des talents restent visibles pour eux.
> 4. **Fiche** : membres et rôles, forfait et quotas, offres publiées, historique ; lien vers les
>    abonnements de l'organisation.
>
> [Règles communes]

### Étape 5 · Forfaits et abonnements

> Réalise l'étape 5 du plan `docs/admin-v2/PLAN-ADMIN.md` : `/admin/forfaits` et
> `/admin/abonnements`. La partie 05 des spécifications reste la source de vérité des droits.
>
> 1. **Forfaits** : « Nouveau forfait » et « Dupliquer » (le double est créé masqué, non vendu,
>    à vérifier avant mise en vente) ; motif de modification enregistré ; historique des versions
>    avec ce qui a changé ; nombre de comptes et lien vers la liste des comptes de chaque forfait ;
>    un forfait qui a des abonnés ne peut pas être supprimé, seulement retiré de la vente.
> 2. **Abonnements** : sur chaque abonnement, prolonger (nouvelle date de fin), changer de forfait
>    (immédiat ou à l'échéance), résilier (immédiat ou à l'échéance), enregistrer un paiement manuel
>    (virement, espèces) avec facture générée ; motif obligatoire, e-mail au client, tout passe par
>    les services de la partie 09 (aucune écriture directe de statut).
> 3. **Présentation** : fiche d'abonnement en frise (créé, payé, renouvelé, en retard, résilié),
>    indicateurs en tête (actifs, en retard, à renouveler sous 7 jours, revenu du mois).
>
> [Règles communes]

### Étape 6 · Formations

> Réalise l'étape 6 du plan `docs/admin-v2/PLAN-ADMIN.md` : `/admin/formations` et l'éditeur
> `/admin/formations/[id]`.
>
> 1. **Ajouter une formation** de bout en bout : après le titre, un parcours guidé en étapes
>    (informations, public et niveau requis, modules et leçons, quiz, attestation, publication) avec
>    une jauge « prête à publier » qui liste ce qui manque.
> 2. **Médias** : envoyer l'image de couverture (optimisée, plusieurs tailles) et la vidéo d'une
>    leçon depuis l'ordinateur, derrière l'adaptateur vidéo `src/server/adapters/video.ts` (envoi
>    vers Bunny Stream quand il est configuré ; le `fake` garde une adresse https). Suivi de
>    l'encodage, sous-titres ou transcription.
> 3. **Contrôle avant publication** : impossible de publier sans titre, description, au moins une
>    leçon, quiz valide si attestation, image ; message clair pour chaque manque.
> 4. **Aperçu « comme un talent »** (sans créer de progression), **duplication** d'une formation,
>    **statistiques** par formation (inscrits, taux d'achèvement, note moyenne au quiz, attestations
>    délivrées), visibles dans la liste.
> 5. Le `content_editor` fait tout cela ; seul `platform_admin` révoque une attestation.
>
> [Règles communes]

### Étape 7 · Modération (offres et signalements)

> Réalise l'étape 7 du plan `docs/admin-v2/PLAN-ADMIN.md` : `/admin/offres` et
> `/admin/signalements`.
>
> 1. **Offres** : « Demander une correction » devient un vrai statut distinct du refus (migration),
>    avec les points à corriger cochés dans la liste de contrôle ; le recruteur le voit dans Hire
>    et renvoie l'offre ; historique des échanges sur la fiche.
> 2. **Signalements** : contexte (les messages autour d'un message signalé, l'offre complète) ;
>    actions retirer le contenu, avertir l'auteur (e-mail), suspendre l'auteur (renvoie vers
>    l'action utilisateur de l'étape 3), note interne, informer la personne qui a signalé à la
>    clôture ; un signalement se clôt toujours avec une décision et un motif.
> 3. **Présentation** : file triée par gravité et ancienneté, compteur par statut, raccourcis
>    clavier suivant/précédent, et l'avis du contrôle automatique affiché avec son « Pourquoi ? »
>    (l'humain décide toujours).
>
> [Règles communes]

### Étape 8 · Partenaires, IA et contenus

> Réalise l'étape 8 du plan `docs/admin-v2/PLAN-ADMIN.md` : `/admin/partenaires`, `/admin/ia`,
> `/admin/contenus`.
>
> 1. **Partenaires** : modifier un partenaire (nom, contrat, dates) ; motif à la création d'un
>    lot ; fiche de lot avec codes utilisés, restants et expirés, prolongation du lot. Les agrégats
>    respectent le seuil de 10 personnes.
> 2. **IA** : crédits consommés par fonction et par forfait (à partir de `AiUsage`), coût par
>    forfait, alerte de dépassement ; les modèles restent configurés par variables
>    d'environnement.
> 3. **Contenus** : onglet « Conseils de préparation » éditable ; chaque enregistrement garde une
>    copie de la version précédente, et « Restaurer » remet une ancienne version (motif, journal).
>    Les textes de l'interface restent dans `textes/textes-application.md` (non éditables ici).
>
> [Règles communes]

### Étape 9 · Passe finale

> Réalise l'étape 9 du plan `docs/admin-v2/PLAN-ADMIN.md` : passe finale de Jumanly Admin v2.
>
> 1. Parcours automatique de toutes les pages admin à 1440 et 390 px :
>    aucun débordement, aucun texte brut, un seul h1, contrastes WCAG 2.2 AA, navigation au clavier.
> 2. Relance de `tests/e2e/admin.spec.ts` complet et de `pnpm test:e2e:reduced`.
> 3. Mets à jour `docs/decisions/2026-10-15-refonte-lot-13.md` (ce qui est maintenant construit) et
>    écris `docs/guide-admin.md` : un guide simple, en français, pour le propriétaire (comment
>    vérifier un compte, offrir un forfait, ajouter une formation, modérer, lire les indicateurs).
>
> [Règles communes]
