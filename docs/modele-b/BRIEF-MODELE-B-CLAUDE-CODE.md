# Brief Claude Code · Modèle B, espace talent mobile (21/10/2026)

Décision d'Ephraïm du 21/10/2026 : le **Modèle B** est la nouvelle interface de l'espace talent sur mobile. Il a été construit et validé écran par écran sur le canvas https://claude.ai/artifact/LVFeBq5dTarRKCSukqKPjy, puis déposé ici (« Tu peux faire le dépôt… dépose dans main »).

## 0. Portée et place dans le plan

- **Remplace**, pour la forme et la navigation de l'espace talent mobile (390 px), les planches talent de `docs/refonte-mobile/` (`BRIEF-TALENT-CLAUDE-CODE.md`, `maquette/`, `talent-1` à `talent-4`) et la barre « Pour moi · Offres · Orbi · Apprendre · Suivi ». Ce qui a déjà été codé d'après ces planches est **refait** sur le Modèle B.
- **Ne change pas** : les règles métier (forfaits et droits, `docs/specifications.md` parties 05 et 08), les règles d'or de `CLAUDE.md`, l'espace recruteur (`docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md`), l'administration d'entreprise.
- **Ordinateur et tablette (talent)** : `docs/refonte-web/` reste la référence tant qu'Ephraïm n'a pas demandé une version ordinateur du Modèle B. Les textes, les états et les parcours doivent cependant être les mêmes que ceux du Modèle B ; tout écart est noté dans `docs/decisions/`.
- Le `docs/PLAN-REFONTE-EN-3-ETAPES.md` s'applique toujours : le Modèle B constitue la partie mobile de l'étape 1.
- L'espace talent mobile est **uniquement en sombre** (décision d'Ephraïm « tout en sombre ») : pas de thème clair à 390 px pour ces écrans.

## 1. Où regarder

| Dossier | Contenu |
|---|---|
| `captures/INDEX.md` | Les 183 planches dans l'ordre du canvas, en 21 rangées, avec ce que montre chaque capture. Point d'entrée. |
| `maquette/*.dc.html` | Sources des pages. Une page principale par espace (`Fil`, `Offres`, `Entreprise`, `Personne`, `Carriere`, `Entretien`, `Formation`, `Messages`, `Accueil`, `Application`) contient toute la logique (`class Component`, `renderVals`) et tous les écrans ; les autres fichiers (`Fil-detail.dc.html`…) importent la page principale avec un écran fixé (`<dc-import name="Fil" vue="detail">`). Les valeurs exactes (couleurs, tailles, espacements, textes) sont dans ces fichiers. |
| `maquette/canvas.json` | Ordre et titres des planches. |
| `maquette/generateurs/` | Scripts qui ont produit les pages (`gen_*.py`, `*_logic.js`), `transitions_lib.py` (les transitions), tests `tg.js` / `bal.py`, captures `capt_all.js`. Lecture seule pour toi : ils servent de référence, pas de code à embarquer. |
| `images/` | Photos d'exemple du Fil, avatar et bannière de Grâce (`profil/`), modèles envoyés par Ephraïm (`references/`). Les captures n'affichent pas les photos : ces fichiers les donnent. |
| `LISEZMOI.md` | Journal de conception, étape par étape, avec les décisions d'Ephraïm (le présent brief l'emporte en cas d'écart). |

Les fichiers `.dc.html` ne s'ouvrent pas seuls dans un navigateur (ils dépendent du canvas). Lis-les comme du HTML + CSS + JS, et compare ton rendu aux captures.

## 2. Identité (planche `Identite.dc.html`)

- Fond Nuit `#0B1A1F` (Explorer `#070F12`), Surface `#13282C`, Surface haute `#1B3338`, texte Crème `#F2EDE5`, secondaire Brume `#8FA39E`.
- **Lime `#A6F26B` est réservé aux actions** : un seul bouton plein lime par écran, point lime sous l'onglet actif.
- **Orbi** : disque Menthe `#2FD3A6`, étincelle à 4 branches couleur nuit, petit point crème. Jamais en lime, jamais en dégradé.
- Étiquettes : Entreprise (lime), Nouveau poste (menthe `#5FE0B8`), Réalisation (ambre `#F4C463`), Alerte (corail `#F08A7C`).
- Police Sora, tailles 28 / 17 / 15 / 13. Marges latérales **20 px** partout. Icônes rares, 24 px, trait 1,7 (2,1 actif).
- Listes à filet façon Threads ; cartes seulement pour les offres et les cours.

## 3. Coque, navigation et mouvement

### Barre du bas
Cinq onglets en **icônes seules**, sans libellés : **Fil · Explorer · Carrière · Formation · Messages** (Carrière = sac de travail, ex-Progression). Fond flouté, point lime sous l'icône active. Orbi est un bouton flottant (disque menthe) présent sur les onglets, jamais dans la barre. L'avatar en haut à gauche ouvre le profil (Carrière).

### Règles de comportement
1. **Aucun clic vide** : chaque bouton ouvre un écran, une feuille ou un message de confirmation, avec un retour.
2. **Recherche en deux temps** : au toucher, les options propres à la page ; dès la première lettre, les résultats.
3. **Retour** : une page en arrière, sauf fins de parcours (ex. bilan d'entretien → retour direct à la candidature).

### Ouverture et préchargement (planche `Application.dc.html`)
- À l'ouverture de l'appli : **le logo seul**, 1,2 s, sans barre de progression, sans icônes, sans texte (Ephraïm l'a refusé). L'ouverture longue animée de `Accueil` (3,9 s, puis 1,7 s les fois suivantes) sert à la première ouverture avant connexion.
- Pendant le logo, tout est chargé derrière : session, les 5 onglets, leurs images, polices et icônes. Le logo s'efface en fondu (420 ms) sur le Fil déjà affiché.
- Les 5 onglets **restent montés** (keep-alive) : changer d'onglet ne recharge rien et ramène à l'endroit laissé (défilement compris).
- La page d'une offre, d'un cours ou d'un profil est préchargée (données + images) dès que sa carte apparaît à l'écran.
- **Jamais de roue qui tourne** : on affiche le dernier contenu connu, le nouveau le remplace sans clignoter. Les pages déjà vues restent consultables sans réseau.

### Transitions (planche `Transitions.dc.html`, code de référence `maquette/generateurs/transitions_lib.py`)
Règle : **l'écran d'avant reste affiché jusqu'à ce que le nouveau le recouvre. Jamais de fond vide, jamais de noir.** 250 à 400 ms, courbe `cubic-bezier(.2,.8,.2,1)`, uniquement `transform` et `opacity` (et `clip-path` pour Orbi).

| Transition | Quand | Mouvement | Durée |
|---|---|---|---|
| Approche | bouton ordinaire | nouvel écran de 97,5 % à 100 %, opacité 0,4 → 1, origine au point touché | 340 ms |
| Ouverture de carte | carte d'offre, de cours, de profil | de 92 % à 100 % depuis la carte, opacité 0,5 → 1 | 380 ms |
| Retour | flèche retour | la page précédente revient de la gauche (−22 px → 0) ; dans l'appli réelle, la page quittée part vers la droite au-dessus | 300 ms |
| Orbi s'ouvre | disque Orbi | cercle qui grandit depuis le disque jusqu'à couvrir l'écran | 400 ms |
| Feuille | menus, choix, Orbi en feuille | voile en fondu (260 ms), feuille qui monte de 56 px | 340 ms |
| Passage d'onglet | barre du bas | le nouvel onglet se pose par-dessus l'ancien en glissant de 22 px dans le sens de la barre, l'ancien recule de 14 px puis se masque | 320 ms |

`prefers-reduced-motion` : fondu court seulement. Utilise le mécanisme du dépôt (`src/styles/motion.css`, `MotionRoot`) et l'API View Transitions ou une couche équivalente dans le routeur ; aucune transition ne doit passer par un écran vide.

## 4. Les espaces, dans l'ordre du canvas

Chaque ligne renvoie aux rangées de `captures/INDEX.md`. Tous les écrans de la rangée sont à faire.

| Rangées | Espace | Points clés |
|---|---|---|
| 02 | Ouverture, bienvenue, inscription, connexion (`Accueil`) | logo animé (carré lime en rebond, J qui se dessine, tête qui tombe, logotype révélé, point lime, « Learn. Grow. Connect. » mot par mot, « Une plateforme développée par The Growth Lab ») ; 3 écrans de bienvenue ; Google, Apple, LinkedIn (choix du compte) ou e-mail + code à 6 chiffres + mot de passe à règles en direct ; connexion, mot de passe oublié, conditions |
| 03 | Profil en 6 étapes | nom, photo vérifiée par Orbi, pays (drapeaux, recherche) et ville + « Je peux déménager », situation, Cap (recherche de métier ou propositions d'Orbi), compétences (au moins 3, import du CV par Orbi) ; puis notifications et « Profil prêt » à 40 % |
| 04 | Application | coque, ouverture, onglets (§ 3) |
| 05-06 | Fil | façon Threads : Pour vous / Abonnements / Entreprises ; publication, détail et réponses, J'aime · Répondre · Republier ; menu ···, signaler, republier ou citer, envoyer ; notifications (Tout / Candidatures / Offres / Réseau) ; Orbi |
| 07-08 | Explorer | offres en rangées par domaine ou par secteur, « Pour vous » d'abord ; filtres Tout / Offres / Entreprises / Personnes ; détail d'offre avec « 86 % pour vous » expliqué (Pourquoi ?) ; postuler (choix du CV, mot au recruteur, confirmation) ; Tout voir, offres enregistrées ; recherche |
| 09-10 | Profils | entreprise (Publications, À propos, Offres, Membres) ; une page par personne ; « Message » seulement une fois la connexion acceptée |
| 11-15 | Carrière | en-tête profil (bannière, avatar, Cap, profil complété) ; Profil · CV · Portfolio · Progression · Candidatures ; modifier le profil avec Orbi ; paramètres, abonnement et paiement Mobile Money, confidentialité, notifications, aide (e-mail seulement), déconnexion ; CV (nouveau, modèle, éditeur, import, export, adapter à une offre) ; portfolio ; candidatures (détail, préparation Orbi, écrire à la recruteuse, retrait) |
| 16 | Simulation d'entretien avec Orbi | par écrit (dès Starter) ou à l'oral (dès Pro) ; 5, 10 ou 15 min (3, 6 ou 9 questions) ; 7 focus (complet, expériences, technique, motivation ; mises en situation, pièges, anglais en Pro) ; ton bienveillant ou exigeant ; téléchargement des questions (offre + CV), test du micro, question lue à voix haute, relance, Répéter, Indice (STAR), Son, Pause, Terminer ; bilan sur 100 et détail par réponse ; historique ; rien n'est montré au recruteur |
| 17 | Formation | Continuer, conseil Orbi, Pour vous / Mes cours / Attestations ; cours, cours payant, leçon avec question rapide, fin, attestation (profil, Fil, télécharger) ; « Répéter avec Orbi » ouvre la simulation |
| 18-21 | Messages | Connexions / Recruteurs / Entreprises, non-lus, demandes ; discussion (infos, médias, silencieux, éphémères, bloquer, exporter) ; écrire avec Orbi, note vocale, photo, pièces jointes (documents, CV, lettre, contact, agenda) ; une discussion par connexion, liée à son profil |

## 5. Points à trancher (à noter dans `docs/decisions/`, sans bloquer)

- **Essai offert en Free** de la simulation orale (une simulation de 5 min) : proposition non confirmée par Ephraïm. Le coder derrière une clé de droit (nouvelle, par exemple `career.interview.trial` ; aucune clé d'entretien n'existe encore), réglable dans l'admin.
- Forfaits : les mentions « Dès Starter » / « Dès Pro » viennent des maquettes ; les droits réels viennent de la base (règle d'or 2).
- Photos d'exemple et noms des personnes : données de démonstration fictives, en local et en preview seulement.

## 6. Lots (un lot = une branche et une PR)

- **B0 · Diagnostic** dans `docs/journal.md` : écrans talent mobile existants, écrans à refaire, fichiers de l'ancien design talent mobile à supprimer.
- **B1 · Fondations** : jetons sombres, Sora, coque à 5 onglets montés, barre en icônes, Orbi flottant, ouverture logo + préchargement, les 6 transitions, composant de recherche en deux temps, feuilles.
- **B2 · Accueil** (rangées 02-03).
- **B3 · Fil** (05-06).
- **B4 · Explorer et profils** (07-10).
- **B5 · Carrière** (11-15).
- **B6 · Simulation d'entretien** (16).
- **B7 · Formation** (17).
- **B8 · Messages** (18-21).
- **B9 · Nettoyage** : suppression de l'ancien design talent mobile, redirections des anciennes routes, code mort.

## 7. Définition de fini de chaque lot

- Captures Playwright à 390 × 844 de chaque écran du lot, comparées aux captures de `captures/` ; écarts corrigés.
- Aucun clic vide : un test e2e parcourt chaque bouton du lot et vérifie qu'il ouvre un écran, une feuille ou un message.
- Transitions : un test vérifie qu'aucun changement d'écran ne passe par un fond vide (l'ancien écran reste présent tant que le nouveau n'est pas opaque).
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build`, `pnpm messages:check` et les e2e touchés passent ; textes dans `textes/textes-application.md` ; `docs/journal.md` à jour.
