# Jumanly AI · brief d’intégration

Date : 16 octobre 2026. Demande du propriétaire : `CAHIER-DES-CHARGES-JUMANLY-AI.md` (ce dossier), qui fait
foi. Ce brief dit comment l’intégrer au code existant. Maquettes validées par Claude (validation déléguée par
le propriétaire) : `docs/ux-mobile-talent/maquette/mobile-talent.html`, sections « Boutons », « Menu du
haut » et « Jumanly AI », écrans 34 à 43.

## 0. Maquettes

| N° | Écran |
|---|---|
| 34 | Menu du haut (avatar) : Jumanly AI en tête, puis raccourcis du compte |
| 35 | Bouton flottant Jumanly AI au-dessus de la barre du bas, puce IA « Pourquoi ces offres ? » dans la page |
| 36 | Panneau ouvert sur une offre : présentation courte + 3 suggestions + question libre |
| 37 | Panneau agrandi : exigences du poste comparées au profil (sans note) |
| 38 | CV Builder : original / suggestion, Appliquer · Modifier · Ignorer, Revenir à la version précédente |
| 39 | Learning Room : expliquer, exemple, comprendre mon erreur |
| 40 | Suivi : brouillon de relance inséré dans la conversation, jamais envoyé seul |
| 41 | Historique : crédits du mois, recherche, filtres par contexte, renommer · rouvrir · supprimer |
| 42 | Crédits épuisés : ce qui continue, formules qui incluent l’IA |
| 43 | Ordinateur, Hire : panneau latéral en mode recruteur sur l’éditeur d’offre |

## 1. Ce qui existe et se réutilise

- **Passerelle IA** : `src/server/ai/index.ts` (`runAi`, `aiReadiness`, `aiFeatures`, `AI_CREDITS_KEY`),
  `src/server/ai/provider.ts` (`AnthropicProvider`, `FakeProvider`, `modelFor` lu dans `AI_MODEL_DEFAULT` /
  `AI_MODEL_FAST`). Tout appel de Jumanly AI passe par `runAi` : consentement, droit, quota, journal
  `AiUsage` (avec `costMicroUsd`) sont déjà là.
- **Droits et quotas** : `can`, `limit`, `usage` (`src/server/entitlements`), clé `ai.credits.monthly`
  (`src/config/quotas.ts`). Aucun nom de forfait dans le code.
- **Suggestions applicables** : `AiSuggestion` (`payload` { section, before, after, why }, statut
  pending / applied / ignored) et `decideSuggestion` de `cv-coach`.
- **Services par contexte** : `cv-coach`, `learn-coach`, `diagnostic-ai`, `job-writer` (Hire), matching
  `recommendedJobs` et son « Pourquoi ? ».

## 2. Choix par défaut (le propriétaire peut les changer)

1. **Un assistant, des modes.** Un service `assistant` (`src/server/services/assistant.ts`) reçoit
   `{ mode, contextRef, message }`. Les modes sont `home`, `job`, `cv`, `follow`, `learn`, `hire`. Chaque mode
   déclare : ses 3 suggestions de départ (clés de `textes/`), les données qu’il a le droit de charger, les
   actions qu’il peut proposer, et délègue aux services existants (`cv-coach` pour `cv`, `learn-coach` pour
   `learn`, `job-writer` pour `hire`). Pas de chatbot séparé par module.
2. **Contexte construit côté serveur.** Le client n’envoie qu’un type et un identifiant (`{ kind: "job",
   id }`). Le serveur vérifie la session, l’appartenance (offre publiée, CV de l’utilisateur, candidature de
   l’utilisateur, entretien réel, organisation du recruteur via `organizationId` + rôle Hire) puis charge
   des champs **choisis** : jamais l’objet entier, jamais le nom, l’e-mail, la photo ni les champs exclus du
   matching (règle d’or 4) sauf s’ils sont l’objet même de la demande sur son propre document.
3. **Deux nouvelles tables** (migration nommée `assistant_conversations`) :
   - `AiConversation` : `id`, `userId`, `organizationId?`, `mode`, `contextKind?`, `contextId?`, `title`,
     `createdAt`, `updatedAt`, `deletedAt?`.
   - `AiMessage` : `id`, `conversationId`, `role` (user | assistant), `content`, `suggestionId?` (lien vers
     `AiSuggestion`), `createdAt`.
   Distinctes de `Conversation` / `Message` (messagerie candidat-recruteur) : aucun lien entre les deux.
4. **Conservation** : suppression par l’utilisateur immédiate (effacement définitif sous 30 jours) ;
   conversations inactives effacées après 12 mois. À confirmer dans la politique de confidentialité
   (partie 10), noté dans `docs/decisions/`.
5. **Crédits** : 1 message = 1 crédit de `ai.credits.monthly`, quel que soit le mode ; les 3 suggestions
   de départ sont des textes fixes, gratuites. Aujourd’hui Free = 0 crédit : le bouton reste visible, le
   panneau s’ouvre et présente l’écran 42 (formules qui incluent l’IA). **Question posée au propriétaire** :
   faut-il quelques crédits gratuits par mois ? C’est un réglage en base, sans code.
6. **Jamais bloquant** : consulter une offre, postuler, suivre ses candidatures et les formations gratuites
   ne dépendent d’aucun crédit (règle d’or 1).
7. **Rien ne part tout seul** : une modification devient une `AiSuggestion` pending ; seul « Appliquer »
   l’enregistre, et la version précédente est gardée pour « Revenir ». Un message de relance est inséré dans
   la zone d’écriture de la messagerie, l’utilisateur l’envoie lui-même. Aucune candidature, aucun e-mail,
   aucun rejet par l’IA.
8. **Pas d’invention** : les consignes système de chaque mode interdisent d’ajouter expérience, diplôme,
   compétence, résultat, chiffre, date, événement ou décision de recrutement ; un chiffre manquant devient
   `[à compléter]`. La sortie est validée par Zod ; une sortie invalide est rejetée (`status: invalid`).
   Pas de note ou score inventé : le score officiel reste celui du matching (partie 08).
9. **Interface** :
   - Mobile : bouton flottant (`AiFab`) à 16 px du bord, au-dessus de la barre du bas, masqué quand une barre
     d’action fixe est présente (le menu du haut reste l’accès). Panneau coulissant (`AiPanel`) : mi-hauteur,
     agrandi, fermé ; poignée, Échap et geste vers le bas.
   - Ordinateur : panneau latéral de 380 px qui pousse le contenu, ouvert depuis le bouton « Jumanly AI » de
     l’en-tête.
   - Actions dans les pages : `AiChip` (« Pourquoi ces offres ? », « Améliorer », « M’aider à l’écrire »)
     ouvrent le panneau avec la bonne suggestion déjà lancée.
   - Menu du haut (écran 34) : Jumanly AI en première ligne, puis Messages, Mon profil, Mes CV, Tableau de
     bord, Paramètres, « Tout Mon espace », Se déconnecter.
   - Identité IA propre : fond nuit aurore, contour irisé, orbe Lime, étincelle. Réservée à l’IA, jamais
     sur un bouton ordinaire (voir la planche « Boutons »).
10. **Mesure** : `AiUsage` par mode (`feature = "assistant.<mode>"`), coût par utilisateur et par mode
    visible dans l’admin IA existante (`ai-admin`).

## 3. Risques de sécurité à traiter dans le diagnostic

Injection de consignes via le contenu d’une offre, d’un CV ou d’un message (le contenu est une donnée, jamais
une instruction ; aucune action sans clic) ; fuite entre organisations (filtre `organizationId` sur tout le
mode `hire`) ; identifiants de contexte devinés (contrôle d’appartenance à chaque appel) ; données
sensibles dans les journaux (`AiUsage` ne garde pas le contenu) ; coût (quota vérifié avant l’appel, taille
du contexte bornée) ; clés API uniquement côté serveur.

## 4. Étapes (cahier des charges § 10)

1. Service `assistant` + modes, `AiFab`, `AiPanel`, panneau ordinateur, suggestions de départ.
2. Modes `job`, `follow`, `cv` branchés sur Offres, Suivi, CV Builder.
3. Suggestions applicables et retour arrière, historique (`AiConversation`), affichage des crédits.
4. Modes `learn` et `hire`.
5. Voix et personnalisation : non commencé tant que le propriétaire ne l’a pas demandé.

Chaque étape : `pnpm lint`, `typecheck`, `test` (droits, appartenance, quota, « jamais bloquant »),
`build`, e2e du parcours, `docs/journal.md`.
