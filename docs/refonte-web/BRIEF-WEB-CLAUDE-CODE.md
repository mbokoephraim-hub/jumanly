# Refonte web (ordinateur et tablette) · talent, recruteur, administration d'entreprise · brief pour Claude Code

19 octobre 2026. Maquettes en 11 planches validées par Ephraïm : talent 1 à 4 et Studio CV, recruteur 1 à 4, administration d'entreprise 1 et 2. Ce brief vient **après** les deux briefs mobiles (`docs/refonte-mobile/BRIEF-TALENT-CLAUDE-CODE.md`, `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md`), qui restent la référence **fonctionnelle** : mêmes écrans, mêmes règles, mêmes données, même identité (verre, crème, sapin, lime, Orbi). Le web ne change que la **disposition**. Les règles métier de `docs/specifications.md` et les règles d'or du `CLAUDE.md` priment.

Seule exception : l'**administration d'entreprise** (§ 4) est nouvelle et réservée au web.

## 0. Principe : un seul code, trois largeurs

- Pas d'application web séparée. Les mêmes routes `/app/*` et les mêmes composants servent les trois largeurs ; seule la mise en page change selon le point de rupture.
- Points de rupture : **mobile < 768 px** (brief mobile, inchangé) ; **tablette 768 à 1199 px** (rail d'icônes) ; **ordinateur ≥ 1200 px** (barre latérale). Les planches sont dessinées à 1240 px (ordinateur) et 820 px (tablette).
- Aucune fonction mobile ne doit manquer en web (demande explicite d'Ephraïm). Pour chaque lot, cocher dans la PR la liste des écrans mobiles correspondants et leur équivalent web.
- L'ancien rendu « écran large » (colonne centrée provisoire des briefs mobiles, ancien `pipeline-board.tsx`, anciens tableaux de bord) disparaît dès que l'écran web correspondant existe. Aucune donnée supprimée ; migrations additives et nommées clairement.
- Les adresses affichées dans les planches (`jumanly.io/hire/...`, `jumanly.io/organisation/...`) sont illustratives : dans le code, l'espace connecté reste sous `/app` (`/app/hire/...`, `/app/organisation/...`), comme dans les briefs mobiles.

## 1. Sources à ouvrir

| Quoi | Où |
|---|---|
| Cadres communs (barre latérale, rail tablette, barre du haut, panneau Orbi, fenêtres) | `docs/refonte-mobile/maquette/source/web.py` |
| Talent 1 : cadre, Pour moi, offres, détail d'une offre, Orbi dans l'offre | `docs/refonte-web/talent-1/` (`web1.py`) |
| Talent 2 : postuler en 3 étapes, suivi et détail côte à côte, s'entraîner avec Orbi, messagerie en 3 colonnes, notifications sous la cloche, mode sombre | `docs/refonte-web/talent-2/` (`web2.py`) |
| Studio CV : mes CV, modèles (vrais aperçus des 15 modèles), studio en 3 panneaux, contenu et Orbi, adapter à un texte collé, lettres, LinkedIn | `docs/refonte-web/studio-cv/` (`webcv.py`) |
| Talent 3 : Apprendre, recherche et parcours, détail d'une formation, salle de cours avec plan à droite, quiz, attestations, vérification publique | `docs/refonte-web/talent-3/` (`web3.py`) |
| Talent 4 : connexion en deux parties, mot de passe oublié, inscription, premiers pas plein écran, menu de l'avatar, profil en 2 colonnes, formules côte à côte, paramètres à rubriques, page Orbi avec historique | `docs/refonte-web/talent-4/` (`web4.py`) |
| Recruteur 1 : À traiter en 2 colonnes, menu d'organisation sous le nom, offres en grille, création (étapes en tête, formulaire, aperçu à droite), détail d'une offre | `docs/refonte-web/recruteur-1/` (`webr1.py`) |
| Recruteur 2 : candidats (liste et dossier côte à côte), dossier en 2 colonnes, étapes et décision, agenda en semaine, talents avec filtres à gauche, propositions en tableau | `docs/refonte-web/recruteur-2/` (`webr2.py`) |
| Recruteur 3 : Orbi avec historique, messagerie 3 colonnes et candidature, notifications avec résumé du jour, compte, organisation, vérification, équipe en tableau, abonnement, formules RH, paiement, rapports, paramètres et journal des consultations, premiers pas | `docs/refonte-web/recruteur-3/` (`webr3.py`) |
| Recruteur 4 : ATS (liste et classement), sélection et retenus, quand lancer l'analyse, répondre à tous (aperçu Jumanly et e-mail), messagerie enrichie, propositions aux talents, rejoindre une organisation, fin d'offre à J-3, notifications de l'ordinateur, rapport PDF | `docs/refonte-web/recruteur-4/` (`webr4.py`) |
| Admin 1 : vue d'ensemble, équipe et sièges, inviter et accueillir, rôles et accès, pôles et offres, crédits Orbi et quotas, départ d'un membre, côté membre | `docs/refonte-web/admin-1/` (`webadm1.py`) |
| Admin 2 : créer l'organisation, page et vérification, abonnement et factures, rapports consolidés, viviers partagés, modèles communs, sécurité, Orbi pour l'admin, paramètres et transfert | `docs/refonte-web/admin-2/` (`webadm2.py`) |

Chaque dossier contient la planche HTML et une capture par section (`captures/*.png`). Les générateurs sont dans `docs/refonte-mobile/maquette/source/` (valeurs exactes de tailles, marges, couleurs, ombres, en clair et en sombre). La section « Comment on y arrive » de chaque planche donne le chemin d'accès à chaque écran ; il n'y a aucun marqueur ni numéro d'appui dans l'interface.

## 2. Cadre commun (lot W0)

1. **Ordinateur** : barre latérale de 232 px à gauche (logo, organisation active pour le recruteur, entrées de l'espace, **Orbi** en carte au milieu avec le raccourci `Ctrl K`, puis l'avatar en bas) ; barre du haut avec titre, recherche, cloche et avatar ; contenu en colonnes.
2. **Tablette** : rail d'icônes de 84 px ; contenu sur deux colonnes quand la place le permet.
3. **Entrées** : talent = Pour moi · Offres · Orbi · Apprendre · Suivi (+ Messages, CV, Profil) ; recruteur = À traiter · Offres · Orbi · Candidats · Messages (+ Agenda, Talents, Rapports) ; administration = § 4. Même ordre et mêmes icônes que les barres mobiles.
4. **Orbi** : en web, Orbi s'ouvre en **panneau à droite** (contexte de l'écran conservé) depuis n'importe quel écran, ou en page complète avec l'historique (`/app/orbi`). `Ctrl K` ouvre la recherche avec Orbi. Mêmes règles qu'en mobile : il propose (Appliquer / Modifier / Refuser), ne décide jamais, ne rejette personne, n'envoie rien sans accord, crédits visibles sous son nom.
5. **Fenêtres et volets** : ce qui est une feuille du bas en mobile devient une fenêtre centrée (choix, confirmation) ou un volet latéral (fiche d'un membre, dossier rapide). Premiers pas, connexion et création d'organisation sont en plein écran.
6. **Listes et détail côte à côte** (candidatures, candidats, messages, suivi) : la sélection met à jour l'adresse (`?id=`), pour que le retour et le partage de lien marchent.
7. **Mode sombre** : toutes les couleurs restent lisibles (tuiles et avatars en tons clairs sur fond sombre, texte Sapin sur Lime, jamais blanc sur Lime). Chaque écran est livré en clair et en sombre.
8. **Calendrier réel** : les dates viennent des données ; les jours de la semaine sont calculés, jamais écrits en dur.

## 3. Écrans talent et recruteur → routes

Les routes sont celles des briefs mobiles (talent § routes, recruteur § 3). Ajouts propres au web :

| Écran web | Route |
|---|---|
| Recherche globale et Orbi (`Ctrl K`) | fenêtre, sans route |
| Panneau Orbi à droite | paramètre `?orbi=1` sur la route courante |
| Studio CV (3 panneaux) | `/app/cv/[id]` ; modèles `/app/cv/modeles` |
| Salle de cours avec plan | `/app/apprendre/[slug]/[lecon]` |
| Agenda en semaine | `/app/hire/entretiens?vue=semaine` |
| ATS d'une offre (liste et classement) | `/app/hire/offres/[id]/ats` |
| Notifications de l'ordinateur | autorisation du navigateur demandée depuis `/app/parametres/notifications`, jamais au premier chargement |

## 4. Administration d'entreprise (nouveau, web uniquement)

### 4.1 Qui y accède

- Une **organisation** a un compte ; son administration pilote les sièges, les rôles, les accès, l'équipe, les crédits et l'abonnement. Réservée aux formules entreprise (droits `org.*`, partie 05) ; les recruteurs autonomes et petits cabinets restent sur les formules RH et sont leur propre administrateur (écrans Compte, Équipe et Abonnement du recruteur, inchangés).
- **Règle d'Ephraïm (19/10)** : l'administrateur d'une organisation n'a **pas d'espace talent**. Il a un **compte personnel RH rattaché à l'organisation** et passe de **Administration** à **Recrutement** (il recrute aussi) par le nom de l'organisation en haut de la barre latérale. En Recrutement, un bandeau « Revenir à l'administration » reste visible. Un membre qui quitte l'organisation **garde son compte RH** (sans les données de l'organisation).
- L'administration n'existe pas sur mobile : sous 768 px, `/app/organisation/*` affiche une page simple « À ouvrir sur un ordinateur » avec le lien, sauf l'acceptation d'une invitation et la réponse à une demande de crédits, qui restent possibles.

### 4.2 Rôles (partie 05)

| Rôle (code) | Dans les planches |
|---|---|
| `org_owner` | Administratrice principale (une seule ; transfert possible, § 4.4) |
| `org_admin` | Administrateur |
| `recruiter` | Recruteur |
| `hiring_manager` | Manager (évalue les candidats de ses offres) |
| `viewer` | Lecteur (chiffres agrégés seulement) |

- Rôles personnalisés (exemple « Recruteur junior ») et **pôles** (= `org.teams`) dès que le droit le permet ; filiales (`org.entities`) seulement là où le droit existe. On teste les clés de droits (`org.seats`, `org.teams`, `org.permissions.level`, `org.entities`…), jamais un nom de forfait.
- La matrice « Rôles et accès » est la source des autorisations côté serveur : chaque action Hire vérifie le rôle **et** l'`organizationId`.

### 4.3 Écrans → routes

| Écrans des planches | Route |
|---|---|
| Créer l'organisation (formule, organisation, domaine, équipe) | `/app/organisation/creer` |
| Vue d'ensemble (sièges, offres, crédits, activité, à faire) | `/app/organisation` |
| Équipe, fiche d'un membre en volet, sièges pleins | `/app/organisation/equipe`, `/app/organisation/equipe/[memberId]` |
| Inviter (plusieurs adresses), demandes d'accès sur domaine vérifié | `/app/organisation/equipe?inviter=1`, `/app/organisation/equipe/demandes` |
| Accepter une invitation (côté invité) | `/app/invitation/[token]` |
| Rôles et accès, changer de rôle, rôle personnalisé | `/app/organisation/roles` |
| Pôles | `/app/organisation/poles` |
| Offres de l'organisation, confier une offre, validation avant publication | `/app/organisation/offres`, `/app/organisation/offres/[id]/validation` |
| Crédits Orbi par pôle et par membre, demandes de crédits | `/app/organisation/credits` |
| Retirer un membre (reprise de ses offres et candidatures) | fenêtre depuis la fiche du membre |
| Page de l'organisation, vérification | `/app/organisation/profil`, `/app/organisation/profil/verification` |
| Abonnement, changer de formule, paiement, factures | `/app/organisation/abonnement` (+ `formules`, `paiement`) |
| Rapports consolidés (onglets par pôle, offre, membre) | `/app/organisation/rapports` |
| Viviers partagés et visibilité | `/app/organisation/viviers` |
| Modèles communs : grilles, étapes, messages | `/app/organisation/modeles/grilles`, `.../etapes`, `.../messages` |
| Sécurité : journal d'audit, consultations de profils, connexion et accès | `/app/organisation/securite` |
| Orbi pour l'admin | panneau Orbi et `/app/organisation/orbi` |
| Paramètres, transfert du rôle d'administratrice principale | `/app/organisation/parametres` |

L'actuel `src/app/app/organisation/page.tsx` est remplacé par la vue d'ensemble ; ses fonctions encore utiles migrent vers les nouvelles routes.

### 4.4 Règles à appliquer

1. **Sièges** = `org.seats`. Inviter au-delà du nombre de sièges ouvre la fenêtre « sièges pleins » (libérer un siège ou changer de formule) ; une invitation en attente occupe un siège. Les membres inactifs depuis 30 jours sont signalés, jamais retirés automatiquement.
2. **Invitations** par e-mail (plusieurs à la fois, rôle et pôle choisis). Sur domaine vérifié, une personne qui s'inscrit avec ce domaine peut **demander** à rejoindre ; l'admin accepte ou refuse. L'e-mail d'invitation ne contient aucun numéro de téléphone.
3. **Retrait d'un membre** : ses offres et candidatures en cours sont confiées à un autre membre (choix obligatoire) ; l'historique reste ; son compte RH personnel est conservé ; journalisé.
4. **Crédits Orbi** (`ai.credits.monthly` de l'organisation) répartis par pôle, avec une limite mensuelle facultative par membre ; un membre à court envoie une demande, l'admin accorde ou non. Chaque consommation reste tracée dans `AiUsage`.
5. **Validation avant publication** : réglage de l'organisation, désactivé par défaut ; activé, une offre d'un rôle concerné passe « En validation » (bleu doux) avant d'être publiée.
6. **Viviers partagés** : visibilité choisie (organisation, pôle, privé) ; un talent n'y figure que s'il a candidaté ou rendu son profil visible (règle d'or 5).
7. **Modèles communs** (grilles d'évaluation, étapes, messages) proposés par défaut aux recruteurs, qui peuvent les adapter par offre.
8. **Rapports consolidés** : agrégats par pôle, offre et membre ; données exclues du matching jamais affichées ; export PDF.
9. **Sécurité** : journal d'audit (qui a fait quoi : rôles, retraits, crédits, validations, transferts), journal des consultations de profils (règle d'or 5), connexions et double authentification exigible pour l'équipe.
10. **Transfert du rôle d'administratrice principale** : vers un `org_admin` existant, confirmé par mot de passe et par e-mail ; l'ancienne principale devient `org_admin`. Il y a toujours exactement un `org_owner`.
11. **Vues membre** : le recruteur voit son espace habituel (avec « En validation » si le réglage est actif, ses crédits restants et le bouton « Demander des crédits ») ; le manager voit les candidats de ses offres et sa grille d'évaluation ; le lecteur voit les chiffres agrégés seulement, et les entrées interdites disparaissent de la barre latérale (pas de contenu flouté).
12. **Orbi pour l'admin** résume l'activité, signale les sièges inutilisés, les offres sans réponse et les crédits en baisse, et prépare des messages ; il ne change ni rôle, ni siège, ni crédit sans accord.
13. **Données de démonstration** : organisation fictive Mwinda Énergies et son équipe, seed local et previews uniquement.

### 4.5 Deux réglages à confirmer par Ephraïm

La validation avant publication (point 5) et la limite de crédits par membre (point 4) sont des ajouts des maquettes. Les coder comme réglages **désactivés par défaut**, et les noter dans `docs/decisions/` ; si Ephraïm les refuse, on retire seulement le réglage.

## 5. Ordre de travail (un lot = une PR)

0. Diagnostic de l'existant face à ce brief (rendu grand écran actuel, `/app/organisation`, rôles en base) et plan, avec la liste de ce qui sera supprimé. Aucun code.
1. **W0** cadre commun : points de rupture, barre latérale, rail tablette, barre du haut, recherche `Ctrl K`, panneau Orbi, fenêtres et volets, mode sombre.
2. **Talent** : lots web talent 1, 2, Studio CV, 3 puis 4 (une PR chacun).
3. **Recruteur** : lots web recruteur 1 à 4 (une PR chacun).
4. **Admin 1** : rôles en base (migration additive si besoin), bascule Administration ↔ Recrutement, vue d'ensemble, équipe, invitations et demandes, rôles et accès, pôles, offres et validation, crédits, retrait, vues membre.
5. **Admin 2** : création de l'organisation, page et vérification, abonnement et factures, rapports consolidés, viviers partagés, modèles communs, sécurité, Orbi admin, paramètres et transfert.
6. Contrôle final : chaque route `/app/*` à 1440 px et 1024 px, clair et sombre, ne montre que le nouveau design ; liste des fichiers supprimés.

## 6. Définition de fini, pour chaque lot

- Captures Playwright à **1440 px** (ordinateur) et **1024 px** (tablette), clair et sombre, de chaque écran, comparées aux captures des planches ; écarts listés et corrigés. Vérifier aussi que **390 px** n'a pas régressé.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build`, `pnpm messages:check` et les e2e des parcours touchés passent (`pnpm test:e2e:reduced` compris).
- Tests admin : isolation par `organizationId` ; un `viewer` ne peut lire aucune candidature nominative ; un manager ne voit que ses offres ; impossible d'inviter au-delà de `org.seats` ; retrait sans reprise impossible ; toujours un seul `org_owner` ; aucun changement par Orbi sans accord ; chaque action d'administration écrite dans le journal d'audit.
- Accessibilité WCAG 2.2 AA : navigation au clavier dans la barre latérale, les fenêtres et le panneau Orbi (focus piégé, `Échap` ferme), contrastes en sombre.
- Tous les textes dans `textes/textes-application.md` → `pnpm messages`. Aucun numéro de téléphone Jumanly.
- `docs/journal.md` mis à jour ; tout écart au brief noté dans `docs/decisions/`.
