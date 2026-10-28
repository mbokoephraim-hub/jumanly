# Brief Claude Code · Modèle B recruteur et administrateur d'entreprise (22/10/2026)

Décision d'Ephraïm du 22/10/2026 : l'espace recruteur sur mobile et l'espace recruteur + administrateur sur ordinateur sont validés (« la partie recruteur mobile et la partie recruteur web est faite. Tu peux les déposer dans notre dépôt »). Ils ont été construits sur deux canvas :

- **Mobile et tablette** : https://claude.ai/artifact/2R11i4PDVMPuxYjJpLGdjx, déposé dans `mobile/`.
- **Ordinateur, recruteur et administrateur, de l'ouverture du site à la dernière page** : https://claude.ai/artifact/EHecvWavsiB4vmknL8Jghz, déposé dans `web/`.

## 0. Portée et place dans le plan

- **Remplace**, pour la forme et la navigation, toutes les planches recruteur et entreprise précédentes :
  - `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md` et les planches `recruteur-1` à `recruteur-4` ;
  - les lots recruteur et admin de `docs/refonte-web/` (`recruteur-1` à `recruteur-4`, `admin-1`, `admin-2`).

  Ce qui a déjà été codé d'après ces planches est **refait** sur le Modèle B.
- **Ne change pas** :
  - les règles métier : forfaits, droits et quotas en partie 05 (qui fait foi), matching en partie 08 ;
  - les règles d'or de `CLAUDE.md` ;
  - l'espace talent (`docs/modele-b/`).
- **Ordre** : `docs/PLAN-REFONTE-EN-3-ETAPES.md` s'applique toujours.
  - **Étape 2** : le recruteur, sur mobile (`mobile/`) et sur ordinateur (`web/`, sections 01, 02, 03 et 05).
  - **Étape 3** : l'administrateur et l'entreprise, sur le web uniquement (`web/`, sections 04 et 06).
  - On ne commence pas l'étape 3 avant la validation de l'étape 2.
- **Écrans** :
  - Mobile, 390 px : `mobile/`, sections 01 à 11.
  - Tablette, 1180 × 820 : les planches `RecruteurTablette*` de `mobile/` (section 12).
  - Ordinateur, 1440 × 900 : `web/`.

  Les anciennes planches « RecruteurWeb » du canvas mobile ne sont pas déposées, car `web/` les remplace.
- **Thème** : tout est en sombre, comme le talent.

## 1. Où regarder

| Dossier | Contenu |
|---|---|
| `mobile/captures/INDEX.md`, `web/captures/INDEX.md` | Chaque planche dans l'ordre du canvas, par section. C'est le point d'entrée. |
| `mobile/maquette/`, `web/maquette/` | Les sources `.dc.html` et le fichier `canvas.json` (ordre et titres). Une page principale contient la logique et tous les écrans : `Recruteur-*.dc.html` sur mobile, `Web-App.dc.html` et `Web-Acces.dc.html` sur le web. Les autres fichiers l'importent avec un écran fixé, par exemple `<dc-import name="Web-App" qui="nadia" vue="candidat" fT="profil">`. Les valeurs exactes (couleurs, tailles, textes, états) sont dans ces fichiers. |
| `mobile/maquette/rapports/`, `web/maquette/rapports/` | Les 4 modèles PDF A4 : rapport d'activité du recruteur, rapport de recrutement de l'entreprise, suivi ATS d'une offre, compte rendu d'entretien. |
| `generateurs/` | Les scripts qui ont produit les pages, plus `tg.js` (test des clics), `bal.py` (balises) et `capt_all.js` (captures). Ils servent de référence et ne sont pas du code à embarquer. |
| `LISEZMOI.md` | Le journal des décisions d'Ephraïm. En cas d'écart, le présent brief l'emporte. |

Les `.dc.html` ne s'ouvrent pas seuls dans un navigateur. Lis-les comme du HTML, du CSS et du JS, puis compare ton rendu aux captures.

## 2. Identité

Elle est identique au talent (`docs/modele-b/`, planche `Identite.dc.html`) :

- **Couleurs** :
  - Fond Nuit `#0B1A1F`, Surface `#13282C`, Surface haute `#1B3338`.
  - Texte Crème `#F2EDE5`, texte secondaire Brume `#8FA39E`.
  - **Lime `#A6F26B` est réservé aux actions**, avec un seul bouton plein lime par zone.
- **Orbi** : disque Menthe `#2FD3A6` avec une étincelle couleur nuit, jamais en lime ni en dégradé.
- **Typographie** : Sora. Les listes sont à filet ; les cartes sont réservées aux offres, aux candidats et aux indicateurs.
- **Logos** : le logo de l'entreprise (Baobab Fintech) s'affiche à côté du nom du recruteur une fois le rattachement accepté. Avant cela, une pastille « ? » apparaît.

## 3. Règles de comportement (toutes les pages)

1. **Aucun clic vide** : chaque bouton ouvre un écran, une feuille, une fenêtre ou un message de confirmation, avec un retour.
2. **Recherche en deux temps** : au toucher, les options propres à la page s'affichent ; dès la première lettre, les résultats apparaissent.
3. **Mouvement** : jamais d'écran noir ni vide entre deux écrans, et jamais de roue qui tourne. Les règles et le code sont ceux du talent (`docs/modele-b/BRIEF-MODELE-B-CLAUDE-CODE.md` § 3).
4. **Défilements variés** : tous les écrans ne défilent pas de la même façon. Il y a des rangées horizontales, des colonnes d'ATS et des listes. Suis la capture.

## 4. Les personnes et leurs interfaces

Les personnes de démonstration sont fictives (local et previews seulement).

- **Nadia Kalala**, chargée de recrutement chez Baobab Fintech, rôle `recruiter`.
- **Joseph Ilunga**, administrateur de Baobab Fintech, rôle `org_owner`. Il a la même appli que Nadia, plus une partie **ENTREPRISE** dans la barre latérale : Équipe, Page entreprise, Formule et facturation, Journal, Réglages. Cette partie est réservée au web. Sous 768 px, `/app/organisation/*` affiche « À ouvrir sur un ordinateur », sauf pour accepter une invitation ou répondre à une demande de rattachement.
- **Rôles des maquettes et rôles du code** : Administrateur → `org_admin` ; Recruteur → `recruiter` ; Manager → `hiring_manager` ; Lecteur → `viewer`. Joseph, créateur de l'organisation, est `org_owner`. Les interrupteurs « Droits de … » dans Équipe ajustent les permissions du membre dans la limite de `org.permissions.level`, sans jamais tester un nom de forfait.

### Mobile (`mobile/`)

- Barre du bas : **Fil · Offres · Candidatures · Talents · Messages**, Orbi flottant, Compte par l'avatar.
- Sections :
  - 01 : ouverture et inscription. Le recruteur décrit son rôle ; si l'entreprise est sur Jumanly, il demande son rattachement pour afficher le logo ; puis pays et contacts, et profil recruteur.
  - 02 : Fil. Publications de 220 caractères au plus, avec compteur, au nom du recruteur ou de l'entreprise.
  - 03 : Offres. Indicateurs, publication en 5 étapes, partage, pause, clôture.
  - 04-05 : Candidatures. Tout l'ATS : colonnes par étape, fort potentiel, entretiens, décisions, fiche de chaque candidat, planifier, évaluer, proposer, diagnostic.
  - 06 : Talents. Recherche, vivier, propositions, onglet Réseau.
  - 07 : Messages. Candidats, talents, équipe, réseau.
  - 08 : Compte. Profil avec logo, statistiques, équipe, formule en lecture seule, réglages, aide par e-mail uniquement.
  - 09 : Pages entreprise, membres et réseau.
  - 10 : Notifications et Orbi.
  - 11 : Changer de profil (§ 5).

### Ordinateur (`web/`)

- **01 · Site public** : page « Recruter » et page des tarifs RH et Company. Le pied de page ne montre que les e-mails.
- **02 · Accès** : ouverture (logo animé), connexion, mot de passe oublié, choix du profil.
- **03 · Inscription du recruteur**, en 9 étapes : compte, code, photo, pays et contacts, rôle, entreprise, demande de rattachement, ce qu'il recrute, profil. Viennent ensuite les écrans « demande envoyée » et « rattachement accepté ». À gauche, un aperçu en direct du profil.
- **04 · Inscription de l'administrateur**, en 9 étapes : formule, compte de l'entreprise, code, rôle, entreprise, logo, vérification, paiement (M-Pesa, Orange Money, Airtel Money, carte), invitation de l'équipe, puis « prêt ». À gauche, un aperçu en direct de la page entreprise.
- **05 · Appli de Nadia** :
  - Accueil du jour : entretiens, tâches, à traiter.
  - Fil.
  - Offres : liste, détail en onglets, assistant de publication en 5 étapes.
  - Candidatures : colonnes ou liste.
  - Fiche candidat en 7 onglets : Résumé, Profil et CV, Réponses, Diagnostic, Évaluations, Notes, Historique.
  - Évaluation d'entretien : 5 critères notés de 1 à 5, avec une recommandation.
  - Agenda : jour, semaine et mois, avec les disponibilités.
  - Talents, Messages, Notifications, Orbi en page.
  - Pilotage : tableau de bord et Mon espace.
  - Compte et Changer de profil.
- **06 · Espace de Joseph** :
  - Équipe : membres et rôles, tâches, invitations et demandes de rattachement.
  - Page entreprise.
  - Formule et facturation : usage, changement de formule, factures, paiement.
  - Journal des consultations.
  - Réglages du recrutement : étapes, modèles de messages, grille d'évaluation.

La semaine de démonstration va du lundi 19 au vendredi 23 octobre 2026.

## 5. Règles métier que les maquettes illustrent

- **Candidater est gratuit**, et un profil Free est traité comme les autres.
- **Orbi recommande, le recruteur décide** : aucun rejet automatique. Chaque score a son « Pourquoi ? », qui reprend les critères de la partie 08 sans aucune donnée exclue. La fiche candidat rappelle que l'âge, la photo, la nationalité et la situation familiale ne sont jamais utilisés. « Non retenu » est toujours un geste humain.
- **Journal** : chaque consultation de profil est journalisée. L'administrateur lit ce journal dans « Journal ».
- **Isolation** : toute requête Hire est filtrée par `organizationId`.
- **Quotas** de la partie 05, lus par clés de droits :
  - utilisateurs et offres en ligne : RH Free 1 et 1, RH Pro 2 et 5, RH Premium 3 et 15, Company 5 et 20, Company Plus 15 et 50 ;
  - recherches de talents, demandes de mise en relation, crédits Orbi (`ai.credits.monthly`).

  « Formule et facturation » les affiche en jauges.
- **Export des rapports** : toutes les formules Company exportent leurs rapports en PDF (décision d'Ephraïm du 22/10/2026, `docs/decisions/2026-10-22-export-rapports-company.md`, droit `reports.export`).
- **Vivier** : le vivier est personnel ; le vivier partagé reste soumis à `org.talent_pools.shared`.
- **Formule** : le recruteur la voit en lecture seule, et seul l'administrateur la gère, sur le web.
- **Abonnement prépayé** (partie 09) :
  - rappels à 7, 3 et 0 jours ;
  - 3 jours de grâce, puis retour au gratuit sans perte de données ;
  - monter en gamme prend effet tout de suite, réduire prend effet à la fin de la période payée.
- **Rattachement** : une demande va à l'administrateur, qui accepte ou refuse. Le logo de l'entreprise n'apparaît qu'après acceptation. Les sièges utilisés comptent dans le quota d'utilisateurs.
- **Membres d'une entreprise** :
  - toute personne qui indique y travailler dans son expérience apparaît dans l'onglet Membres ;
  - l'administrateur peut confirmer ou répondre « Ne travaille pas ici » ;
  - sans réponse, la mention « Indiqué par la personne » s'affiche ;
  - les invitations de connexion sont limitées à 50 par jour.
- **Profil talent discret** : un recruteur peut basculer vers un profil talent et candidater ailleurs gratuitement. Sa propre entreprise ne le voit pas, et il est masqué des membres tant que la recherche discrète est active. Seul l'administrateur bascule vers le profil entreprise.
- **Téléphone** : celui du recruteur n'est visible qu'en entretien ou par son équipe. **Aucun numéro de Jumanly**, nulle part. Le contact se fait uniquement par assistant@jumanly.io et infojumanly@gmail.com.
- **Textes** : aucun texte en dur. Tout passe par `textes/textes-application.md`, puis `pnpm messages`.

## 6. Lots (un lot = une branche et une PR)

### Étape 2 · Recruteur (mobile + ordinateur + tablette)

- **R0 · Diagnostic** dans `docs/journal.md` : écrans recruteur existants, écrans à refaire, fichiers de l'ancien design à supprimer.
- **R1 · Coque** :
  - mobile : barre à 5, Orbi flottant, avatar ;
  - ordinateur : barre latérale avec PILOTAGE, en-tête avec recherche et « Publier une offre », Orbi à droite ;
  - tablette : rail d'icônes et Orbi flottant ;
  - recherche en deux temps et feuilles.
- **R2 · Site public et accès** : `web/` sections 01 et 02, `mobile/` section 01, inscription du recruteur (`web/` 03) et rattachement.
- **R3 · Fil et Offres** : publication en 5 étapes, partage, pause et clôture.
- **R4 · Candidatures** : ATS, fiche candidat en 7 onglets, évaluation, diagnostic, planification, proposition, décisions.
- **R5 · Agenda et pilotage** : tableau de bord, Mon espace, rapports PDF.
- **R6 · Talents, réseau, pages entreprise et membres.**
- **R7 · Messages, notifications, Orbi.**
- **R8 · Compte, changer de profil, tablette, nettoyage** : suppression de l'ancien design recruteur, redirections, code mort.

Rapport dans `docs/journal.md`, puis arrêt en attendant la validation d'Ephraïm.

### Étape 3 · Administrateur et entreprise (web uniquement)

- **A1 · Inscription de l'administrateur** (`web/` 04) : formule, entreprise, logo, vérification, paiement, invitation de l'équipe.
- **A2 · Équipe** : membres et rôles, droits par membre, tâches (Attribuée → Acceptée → En cours → Terminée), invitations, demandes de rattachement, nouveaux membres déclarés.
- **A3 · Page entreprise** : modification et aperçu public.
- **A4 · Formule et facturation** : usage, changement de formule, factures, paiement Mobile Money et carte.
- **A5 · Journal des consultations et réglages du recrutement** : étapes, modèles, grille d'évaluation.
- **A6 · Nettoyage** : l'ancien `/app/organisation` et tout ancien écran entreprise sont supprimés.

## 7. Définition de fini de chaque lot

- Captures Playwright de chaque écran du lot, aux tailles des planches : 390 × 844, 1180 × 820, 1440 × 900. Elles sont comparées à `mobile/captures/` et `web/captures/`, et les écarts sont corrigés.
- Aucun clic vide : un test e2e parcourt chaque bouton du lot.
- Isolation par `organizationId` et journal des consultations couverts par des tests en base.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build`, `pnpm messages:check` et les e2e touchés passent.
- `docs/journal.md` est à jour, et chaque écart est noté dans `docs/decisions/`.
