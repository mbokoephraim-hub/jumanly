# Prompts Claude Code · expérience mobile Talent et Jumanly AI

Date : 16 octobre 2026, mis à jour le 17 octobre (version 6). Dix prompts à coller dans Claude Code **un par un, dans l’ordre**. Chaque prompt
attend la fin du précédent (code fusionné, vérifications vertes) avant d’être envoyé.

Références déposées sur `main` :
- `docs/ux-mobile-talent/` : cahier des charges mobile (fait foi), `BRIEF-MOBILE-TALENT.md`,
  `PROMPT-AMELIORE.md`, **`CAHIER-DES-CHARGES-V6.md` (l’emporte en cas de différence)**, maquettes
  `maquette/mobile-talent.html`, `maquette/ecrans/01.jpg` à `66.jpg` et styles d’origine `maquette/source/`.
- `docs/jumanly-ai/` : cahier des charges Jumanly AI (fait foi), `BRIEF-JUMANLY-AI.md`.

| N° | Prompt | Écrans |
|---|---|---|
| 0 | Diagnostic et plan, sans code | tous |
| 1 | Socle visuel : boutons, cartes, états d’interaction | planches Boutons, Cartes, États |
| 2 | Navigation v6 : 5 onglets, en-tête, retour, +, Compte, thèmes, ouverture | 17, 34, 57-62 |
| 3 | Objectif et Pour moi | 01-05 |
| 4 | Offres avec bannières, candidature en étapes, Apprendre | 06-14, 31-33, 63-66 |
| 5 | Suivi, entretiens, messages et décisions | 15-16, 20-24, 50-55 |
| 6 | Profil, CV mobile, recherche, notifications, mesure | 18-19, 25-29, 56 |
| 7 | Jumanly AI : assistant central, bouton, panneau | 35-36, 41-44 |
| 8 | Jumanly AI : offres, CV, suivi, suggestions applicables | 30, 37-38, 40 |
| 9 | Jumanly AI : Learn, Hire, simulations d’entretien | 39, 43, 45-49 |

---

## Prompt 0 · Diagnostic et plan

```text
Nous lançons deux chantiers liés : l’expérience mobile de l’espace Talent, puis Jumanly AI.

Lis, dans cet ordre :
1. CLAUDE.md (règles d’or).
2. docs/ux-mobile-talent/CAHIER-DES-CHARGES-UX-MOBILE.md (ma demande), puis CAHIER-DES-CHARGES-V6.md (version 6, elle l’emporte en cas de différence), BRIEF-MOBILE-TALENT.md (choix par défaut, § 5 cartes et messages, § 6 version 6), PROMPT-AMELIORE.md.
3. docs/jumanly-ai/CAHIER-DES-CHARGES-JUMANLY-AI.md (ma demande, elle fait foi) et BRIEF-JUMANLY-AI.md.
4. Les maquettes : docs/ux-mobile-talent/maquette/mobile-talent.html (planches Boutons, Cartes, États d’interaction, puis 66 écrans), maquette/ecrans/01.jpg à 66.jpg et les styles d’origine maquette/source/style.css à style6.css.
5. Les briefs déjà livrés qu’il faut respecter : docs/interactions-relief, docs/experience-animee, docs/refonte-career, docs/modeles-cv, docs/learn-v2/PLAN.md, docs/refonte-connexion.

Ne code rien. Ta réponse est un diagnostic et un plan :
- l’existant concerné : AppShell, IconRail, AccountMenu, SectionNav, config/navigation.ts, pages /app, Jobs, Learn, Career, Connect, Hire, authentification, rôles, abonnements et droits, couche IA (runAi, AiUsage, AiSuggestion, cv-coach, learn-coach, job-writer, diagnostic-ai) ;
- ce qui est déjà fait ou en partie fait par les briefs précédents (lis docs/journal.md) ;
- les composants à créer et ceux à réutiliser ;
- les données manquantes et les migrations prévues (User.theme, Organization.banner, brouillons de candidature, MessageKind file/slot/decision, modèles de message Hire, AiConversation/AiMessage, notes de simulation), avec leur nom ;
- les risques (sécurité, isolation des organisations, données personnelles, coûts IA, budget JS mobile) ;
- les écarts que tu proposes par rapport aux briefs, avec la raison ;
- pourquoi le rendu actuel s’écarte des maquettes (jetons, composants, ombres, rayons) et comment tu garantis la fidélité : valeurs reprises de maquette/source/, capture Playwright à 390 px comparée à maquette/ecrans/NN.jpg pour chaque écran ;
- le découpage en 9 prompts que je t’enverrai ensuite (socle visuel, navigation, Pour moi, Offres et candidature, Suivi et messages, profil et CV, puis Jumanly AI en 3 temps) : confirme-le ou propose mieux.

Attends ma validation.
```

---

## Prompt 1 · Socle visuel

```text
Prompt 1 sur 9 : le socle visuel, pour tout l’espace Talent.

Références : planches « Boutons », « Cartes » et « États d’interaction » de docs/ux-mobile-talent/maquette/mobile-talent.html ; PROMPT-AMELIORE.md § 2 et § 5 ; BRIEF-MOBILE-TALENT.md § 5 ; styles d’origine dans docs/ux-mobile-talent/maquette/source/ (style.css à style6.css) : reporte leurs valeurs exactes dans nos jetons, sans approximation ni nouvelle couleur, y compris les jetons du thème Vert (.vert de style6.css).

À faire :
- <Button variant="primary|accent|secondary|outline|link|ai|danger" size="L|M|S"> avec les états repos, appui, en cours, fait, désactivé ; principal en dégradé Sapin → Émeraude avec le rond Lime et la flèche ; accent en dégradé Lime, texte Sapin ; jamais blanc sur Lime.
- L’identité IA réservée : <AiChip>, signature (nuit aurore, contour irisé, orbe Lime). Pas encore de logique IA.
- Les cartes : GoalCard, ProfileCard, VisualTile (zone d’illustration en formes simples ou personnage de ressources/), AiBento, FileCard, SlotCard, DecisionCard. Une carte = un titre et une ligne au plus.
- Un seul Pressable (ou une classe utilitaire) pour l’appui visible : fond Lime clair, contour Lime, échelle 0,98, 120 ms, couleur seule en animations réduites ; indicateur si la navigation dépasse 300 ms.
- Ajoute-les à /dev/composants avec tous leurs états. Ne change encore aucune page.

Fin : lint, typecheck, test, build, test:e2e:reduced sur /dev/composants, captures de /dev/composants à côté des planches de la maquette dans ton résumé, journal, puis résume et arrête-toi.
```

---

## Prompt 2 · Navigation

```text
Prompt 2 sur 9 : navigation mobile de l’espace Talent, version 6.

Références : CAHIER-DES-CHARGES-V6.md partie B (fait foi), BRIEF-MOBILE-TALENT.md § 6, PROMPT-AMELIORE.md § 3 ; maquette, section « En-tête, retour et barre du bas », écrans 03, 17, 34 et 57 à 62.

À faire :
- Barre du bas à 5 onglets : Offres (/app/jobs), Apprendre (/app/learn), Pour moi (/app) au centre dans un rond surélevé de 58 px avec le symbole J, Suivi (/app/suivi, pastille réelle), Compte (/app/compte, avatar ou initiales). Actif en pastille Lime, texte Sapin. Masquée sur les écrans à barre d’action fixe.
- En-tête sans bande verte : bouton Menu + logo ou titre à gauche ; Rechercher, + (dégradé), Notifications, Messages (pastille réelle) à droite. Menu du haut (écran 34) : Jumanly AI (emplacement jusqu’au prompt 7), Mes CV, Tableau de bord, Mes candidatures, Simulations d’entretien, Attestations, « Tout Mon espace ».
- BackButton (42 px, nouvelle icône jm-retour dans le sprite) en tête de toute page qui n’est pas un onglet ; repli sur la page parente si l’historique est vide.
- Bouton + : feuille « Créer » (écran 60), 6 actions vers les routes existantes.
- Page /app/compte (écrans 61-62) : profil + crayon, « Protégez votre compte » si aucun mot de passe (flux existant de création de mot de passe), Abonnement, Jumanly AI, Compte et confidentialité, Notifications, Préférences (thème, langue), Aide et commentaires, Inviter un proche, Se déconnecter. Les sous-pages réutilisent les paramètres existants.
- Thème Vert (écrans 59, 62) : migration user_theme (User.theme light|green, défaut light), classe sur <html> rendue côté serveur, jetons .vert de maquette/source/style6.css, contraste AA vérifié par axe.
- Ouverture (57-58) : écran de démarrage PWA = logo sur Sapin, court ; bienvenue une seule fois ; la longue intro ne se rejoue plus à chaque ouverture.
- Page /app/espace (écran 17), tableau de bord déplacé tel quel à /app/tableau-de-bord, /app/suivi créée (contenu au prompt 5), redirections pour toute route déplacée.
- Ordinateur : rail = les 5 destinations + Career ; Hire et Partenaire inchangés.

Fin : 360, 390, 430 px et ordinateur, dans les deux thèmes ; captures Playwright à 390 px des écrans 03, 34, 57 à 62 posées à côté de maquette/ecrans/NN.jpg dans ton résumé ; lint, typecheck, test, build, e2e navigation (et reduced) ; journal ; résume et arrête-toi.
```

---

## Prompt 3 · Objectif et Pour moi

```text
Prompt 3 sur 9 : objectif et page Pour moi.

Références : écrans 01 à 05, BRIEF-MOBILE-TALENT.md § 2 points 1 et 7, § 5 point 3.

À faire :
- Écran d’objectif à la première connexion (après le générique d’entrée), une seule question, « Plus tard » possible ; homeFocus(goal) sans migration.
- Pour moi selon l’objectif, avec GoalCard (chiffres réels, chiffre absent = masqué), offres de recommendedJobs ou « non personnalisée », formations, outils en VisualTile, prochaines actions réelles.
- Aucun sous-titre de section, aucun texte long, aucune donnée inventée.

Fin : vérifications complètes, e2e du parcours d’inscription jusqu’à Pour moi ; journal ; résume et arrête-toi.
```

---

## Prompt 4 · Offres, candidature, Apprendre

```text
Prompt 4 sur 9 : Offres, candidature en étapes, Apprendre.

Références : écrans 06 à 14, 31 à 33 ; BRIEF-MOBILE-TALENT.md § 2 point 6 ; docs/learn-v2/PLAN.md.

À faire :
- Offres : recherche, puces de filtres, feuille de filtres, onglets Pour vous / Récentes / Enregistrées, enregistrement avec toast « Annuler ».
- Détail d’offre : sections repliables, barre Enregistrer + Postuler fixe.
- Candidature en étapes sur /app/jobs/[slug]?postuler=1&etape=… : CV, lettre, questions (sautée sans questions), vérification par blocs avec Modifier, envoi, confirmation, erreur réseau ; brouillon serveur à chaque étape ; « Candidature envoyée » seulement après la réponse du serveur. Candidater reste gratuit.
- Apprendre : formation en cours, catalogue, fiche formation, Learning Room alignée sur Learn v2 (ne pas réimplémenter la progression).
- Bannières (écrans 63 à 66) : migration organization_banner (Organization.banner), envoi et recadrage 3:1 dans Hire avec aperçu de la carte ; carte d’offre = bannière, logo, nom de l’entreprise, titre, lieu, contrat ; détail d’offre ouvert sur la bannière ; motif Jumanly sans bannière ; images optimisées ; filtre organizationId.
- Le bloc IA de l’écran 31 reste un emplacement (AiChip inactif) jusqu’au prompt 8.

Fin : vérifications complètes, e2e « trouver une offre et postuler » et « reprendre une formation » ; captures à 390 px à côté des maquettes ; journal ; résume et arrête-toi.
```

---

## Prompt 5 · Suivi, entretiens, messages et décisions

```text
Prompt 5 sur 9 : Suivi, entretiens, messages et décisions.

Références : écrans 15, 16, 20 à 24 et 50 à 55 ; BRIEF-MOBILE-TALENT.md § 5 points 4 à 6.

À faire :
- /app/suivi : filtres, urgent d’abord, états vides utiles.
- Entretiens : confirmer un créneau (Interview.slots), proposer jusqu’à 3 autres moments (proposedSlots, statut reschedule), confirmation après réponse du serveur, Rejoindre et .ics.
- Messages (réutilise Connect) : liste, conversation, demande de document ; bouton + (créneau, mon CV, ma lettre, relance IA en emplacement jusqu’au prompt 8, document, lien) ; pièces en FileCard téléchargeable et SlotCard. Migration MessageKind : file, slot, decision.
- Décisions : un passage à rejected ou hired envoie une DecisionCard (logo et nom de l’entreprise, poste, bandeau, texte, signataire, date), jamais une bulle ; sous un refus, « Pour rebondir » avec des données réelles.
- Côté Hire : modèles de message de l’organisation (convocation, document, relance, acceptation, refus), filtrés par organizationId ; le refus s’affiche en aperçu exact et part seulement après le clic du recruteur.

Fin : vérifications complètes, e2e entretien et refus (côté recruteur puis côté talent), test d’isolation des organisations ; journal ; résume et arrête-toi.
```

---

## Prompt 6 · Profil, CV, recherche, notifications

```text
Prompt 6 sur 9 : profil, CV mobile, recherche, notifications, mesure.

Références : écrans 18, 19, 25 à 29 et 56 ; BRIEF-MOBILE-TALENT.md § 2 points 8 et 9, § 5 point 7 ; docs/refonte-career/BRIEF-CV-V2.md ; docs/modeles-cv (ne pas toucher au rendu).

À faire :
- Profil : photo (prendre, choisir, retirer, recadrage), titre, bio avec compteur, « Construire mon profil ». « M’aider à l’écrire » reste un AiChip inactif jusqu’au prompt 8.
- CV : créer (profil, import, vierge), éditeur une section à la fois, mise en forme, Mes CV avec vignettes et téléchargement PDF (état en cours, toast), sans mention Jumanly.
- Recherche groupée (récentes seulement avec le consentement préférences), notifications priorisées et préférences.
- track(event, props) unique derrière le consentement analytics, sans contenu privé.
- Optimisations réseau lent et budget JS.

Fin : vérifications complètes, e2e « compléter mon profil » et « télécharger mon CV » ; journal ; résume et arrête-toi.
```

---

## Prompt 7 · Jumanly AI, socle

```text
Prompt 7 sur 9 : Jumanly AI, étape 1 du cahier des charges.

Références : docs/jumanly-ai/CAHIER-DES-CHARGES-JUMANLY-AI.md, BRIEF-JUMANLY-AI.md (§ 2 en entier, § 3 risques), écrans 34 à 36 et 41 à 44.

À faire :
- Service assistant central (src/server/services/assistant.ts) avec des modes ; contexte construit côté serveur à partir de { kind, id } après contrôle de session, de droit et d’appartenance ; champs choisis, jamais les champs exclus du matching ; tout passe par runAi (consentement, droit, quota, AiUsage).
- AiFab au-dessus de la barre du bas, AiPanel coulissant (mi-hauteur, agrandi, fermé), panneau latéral sur ordinateur, entrée Jumanly AI du menu du haut.
- Accueil de l’orbe (écran 44) : 4 actions phares, suggestions du mode de la page, question libre.
- AiConversation et AiMessage (migration assistant_conversations), historique avec renommer, rouvrir, supprimer (écran 41), crédits affichés, écran de limite atteinte (42). Rien de payant ne bloque une offre ou une candidature.
- Tests : appartenance, isolation, quota, « jamais bloquant », injection de consignes dans un contenu.

Fin : vérifications complètes, e2e ouverture du panneau et conversation (fournisseur fake) ; journal ; résume et arrête-toi.
```

---

## Prompt 8 · Jumanly AI dans Offres, CV et Suivi

```text
Prompt 8 sur 9 : Jumanly AI, étapes 2 et 3 du cahier des charges.

Références : écrans 30, 31, 37, 38, 40 ; BRIEF-JUMANLY-AI.md § 2 points 7 et 8.

À faire :
- Mode offre : analyser les exigences face au profil, sans note (le score reste celui du matching), adapter mon CV, préparer mon entretien ; « Pourquoi ces offres ? » et élargir une recherche (31).
- Mode CV : corriger, reformuler, adapter à une offre ; original et suggestion, Appliquer, Modifier, Ignorer, Revenir à la version précédente ; AiSuggestion et decideSuggestion de cv-coach ; rien enregistré sans clic ; crochets pour les chiffres.
- Mode suivi : brouillon de relance inséré dans la zone d’écriture, jamais envoyé seul ; branche la « Relance IA » du bouton +.
- Active les AiChip laissés en emplacement (bio, offres, CV).

Fin : vérifications complètes, e2e « adapter mon CV à une offre » et « revenir à la version précédente » ; journal ; résume et arrête-toi.
```

---

## Prompt 9 · Learn, Hire et simulations d’entretien

```text
Prompt 9 sur 9 : Jumanly AI, étapes 4 et 5 du cahier des charges.

Références : écrans 39, 43, 45 à 49 ; BRIEF-JUMANLY-AI.md § 2 points 10 et 11 ; docs/specifications.md parties 05, 07 (/app/career/entretiens), 08 § 8.9, 10.

À faire :
- Mode formation dans la Learning Room : expliquer, donner un exemple, comprendre mon erreur, avec la référence de la leçon (learn-coach).
- Mode recruteur dans Hire, membres autorisés seulement, filtré par organizationId : rédiger une offre, compétences clés, questions d’entretien, synthèse ; aucune décision ni rejet automatique (job-writer).
- Simulation écrite (Starter et plus, par clé de droit) : questions tirées de l’offre, retour « ce qui marche / à renforcer », meilleure formulation faite des mots de l’utilisateur, « Garder cette formulation », test de connaissances facultatif, bilan sans note d’embauche, jamais visible des recruteurs.
- Simulation orale (Pro et plus) en dernier : adaptateur de transcription et de synthèse (NEXT_PUBLIC_VOICE_PROVIDER), micro autorisé seulement sur cette page, voix jamais enregistrée, sous-titres, animations réduites respectées.

Fin : vérifications complètes, e2e simulation écrite et mode recruteur (isolation testée) ; journal ; bilan de l’ensemble des 9 prompts et liste des points ouverts.
```
