# Prompt à coller dans Claude Code · administrateur d'entreprise (Modèle B, ordinateur)

Ce prompt se colle tel quel dans une nouvelle session Claude Code ouverte sur le dépôt `jumanly`, avec la branche `main` à jour. Il couvre uniquement l'administrateur d'entreprise, sur ordinateur et tablette en largeur (1024 et 1440 px). C'est l'étape 3 du plan : à lancer une fois l'étape 2 (recruteur) validée par Ephraïm.

---

Tu travailles sur Jumanly. Lis d'abord ces documents :

- `CLAUDE.md` ;
- `docs/PLAN-REFONTE-EN-3-ETAPES.md` ;
- `docs/modele-b-recruteur/BRIEF-MODELE-B-RECRUTEUR-CLAUDE-CODE.md`, en particulier les § 2 à 5 et les lots A1 à A6 du § 6 ;
- `docs/modele-b-recruteur/web/captures/INDEX.md`, sections 04 et 06 ;
- les sources `docs/modele-b-recruteur/web/maquette/`, dont `Web-Acces.dc.html` (étapes `a-*`) et `Web-App.dc.html` (props `qui="joseph"`).

Ta mission : construire l'espace de l'administrateur d'entreprise sur le Modèle B. Ce modèle est la seule référence et remplace les planches admin de `docs/refonte-web/` (`admin-1`, `admin-2`). Ce qui a été codé d'après elles est refait, et l'ancien `/app/organisation` est effacé. Les données ne sont jamais effacées : les migrations sont additives et nommées clairement. Ne touche pas aux écrans recruteur déjà validés, sauf pour y brancher la partie ENTREPRISE.

Ce que tu dois reproduire :

- **Thème** : tout est en sombre, et lime `#A6F26B` est réservé aux actions.
- **Barre latérale** : l'administrateur (Joseph) a la même appli que le recruteur, avec en plus une partie **ENTREPRISE** : Équipe, Page entreprise, Formule et facturation, Journal, Réglages. Cette partie ne s'affiche que pour les rôles `org_owner` et `org_admin`.
- **Web uniquement** : sous 768 px, `/app/organisation/*` affiche « À ouvrir sur un ordinateur », sauf pour accepter une invitation et répondre à une demande de rattachement.
- **Fidélité** : pour chaque écran, ouvre la capture et le fichier `.dc.html` correspondant, puis reproduis fidèlement la mise en forme, les textes et les états. Les valeurs exactes sont dans le fichier.
- **Règles de comportement** :
  - aucun clic vide : chaque bouton ouvre un écran, une fenêtre ou une confirmation, avec un retour ;
  - recherche en deux temps ;
  - jamais d'écran vide ni de roue qui tourne.
- **Rôles** : Administrateur → `org_admin`, Recruteur → `recruiter`, Manager → `hiring_manager`, Lecteur → `viewer`. Le créateur de l'organisation est `org_owner`. Les interrupteurs « Droits de … » ajustent les permissions d'un membre dans la limite de `org.permissions.level`.
- **Règles métier** :
  - les droits se testent par clés, jamais par nom de forfait. Les quotas (utilisateurs, offres en ligne, recherches, mises en relation, crédits Orbi) viennent de la partie 05 et s'affichent en jauges ;
  - le droit `reports.export` est ouvert à toutes les formules Company (décision du 22/10/2026) ;
  - le paiement est prépayé par M-Pesa, Orange Money, Airtel Money ou carte (partie 09). Rappels à 7, 3 et 0 jours, 3 jours de grâce, puis retour au gratuit sans perte de données. Monter en gamme prend effet tout de suite, réduire à la fin de la période payée ;
  - une demande de rattachement va à l'administrateur, qui accepte ou refuse. Le logo de l'entreprise n'apparaît chez le recruteur qu'après acceptation, et chaque membre accepté compte dans le quota d'utilisateurs ;
  - un membre déclaré par son expérience se confirme ou reçoit « Ne travaille pas ici ». Sans réponse, la mention « Indiqué par la personne » s'affiche ;
  - le journal des consultations liste chaque consultation de profil faite par l'équipe ;
  - toute requête est filtrée par `organizationId` ;
  - les factures ne portent aucun numéro de téléphone de Jumanly : le contact se fait uniquement par assistant@jumanly.io et infojumanly@gmail.com ;
  - aucun texte en dur (`textes/textes-application.md`, puis `pnpm messages`) ;
  - les données de démonstration sont fictives, en local et en preview seulement.

Méthode, avec un lot par branche et par PR, dans cet ordre :

- **A0 · Diagnostic** dans `docs/journal.md` : écrans entreprise existants, écrans à refaire, fichiers de l'ancien `/app/organisation` à supprimer. Enchaîne ensuite sans attendre.
- **A1 · Inscription de l'administrateur** (section 04) : formule, compte de l'entreprise, code, rôle, entreprise, logo, vérification, paiement, invitation de l'équipe, « prêt ». À gauche, l'aperçu en direct de la page entreprise.
- **A2 · Équipe** : membres et rôles, droits par membre, tâches (Attribuée → Acceptée → En cours → Terminée), invitations, demandes de rattachement, nouveaux membres déclarés.
- **A3 · Page entreprise** : modification et aperçu public.
- **A4 · Formule et facturation** : usage, changement de formule, factures, fenêtre de paiement.
- **A5 · Journal des consultations et réglages du recrutement** : étapes, modèles de messages, grille d'évaluation.
- **A6 · Nettoyage** : ancien `/app/organisation` et tout ancien écran entreprise supprimés, anciennes routes redirigées, code mort retiré.

Chaque PR liste la correspondance entre capture et écran codé, ainsi que les fichiers supprimés.

Définition de fini de chaque lot :

- captures Playwright à 1440 × 900 et 1024 px de chaque écran, comparées à `web/captures/`, écarts corrigés ;
- un test e2e qui touche chaque bouton du lot, et un test qui vérifie qu'un `recruiter` ou un `viewer` n'accède pas à la partie ENTREPRISE ;
- des tests en base pour l'isolation par organisation, les quotas de sièges et le journal des consultations ;
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build`, `pnpm messages:check` et les e2e touchés passent ;
- `docs/journal.md` à jour.

À la fin de A6, écris un rapport dans `docs/journal.md`, avec les captures dans `captures/etape-3/`, puis arrête-toi en attendant la validation d'Ephraïm.

En cas d'ambiguïté, choisis l'option la plus simple qui respecte les règles d'or, note-la dans `docs/decisions/` et continue.
