# Audit de l'application Talent face au cahier des charges « Jumanly Talent MVP 1.0 »

18 octobre 2026. Point de vue : product manager, UX/UI SaaS, ingénierie.
Base de l'audit : lecture du code du dépôt (routes `src/app/app/**`, services `src/server/**`, schéma Prisma, tests, journal) et du cahier des charges reçu le 18/10 (29 pages). Aucun code n'a été modifié.

---

## 1. En bref

1. **L'application est déjà avancée.** Sur les 16 fonctionnalités du cahier, 9 existent et marchent, 5 existent en partie, 2 sont absentes. Il n'y a rien à reconstruire.
2. **Le vrai problème est l'excès, pas le manque.** L'espace talent compte **44 pages** sous `/app`, avec trois accueils qui se recoupent, deux catalogues de formations, un module Career à 9 sous-pages et un bouton « + » qui duplique la navigation. La priorité du MVP est de **ramener l'espace à environ 20 pages** et de finir 4 manques.
3. **Le gros manque est l'assistant unique.** Jumanly AI (« Orbi ») est annoncé partout dans l'interface mais n'existe pas : il y a 12 fonctions d'IA séparées, toutes bien sécurisées (consentement, droit, quota, journal `AiUsage`), mais aucun point d'entrée commun.
4. **La navigation actuelle est déjà presque celle du cahier.** La barre du bas affiche Offres, Apprendre, Pour moi, Suivi, Compte. Il suffit de sortir Compte de la barre et d'y placer l'assistant.
5. **Quatre corrections touchent la confiance** et doivent passer avant le lancement : statuts de candidature à aligner, paiement Mobile Money encore simulé, noms de forfaits écrits en dur à un endroit, pas de candidature externe (donc pas de risque de faux « envoyée », mais un besoin à couvrir).

---

## 2. État de chaque fonctionnalité

Légende du statut : **Existe** (rien à faire ou retouches), **À corriger**, **À intégrer** (existe ailleurs, à déplacer ou fusionner), **À développer**.
Phase : **MVP**, **P2** (après stabilisation), **P3**.

| # | Fonctionnalité du cahier | Ce qui existe aujourd'hui | Statut | Ce qu'il faut faire | Phase |
|---|---|---|---|---|---|
| 1 | Inscription et onboarding | Inscription en 4 étapes (compte, forfait, paiement, vérification) puis `/app/bienvenue` (pays, objectif, lieux, précisions). | À corriger | Ne plus demander le pays deux fois. Remplacer les 3 tuiles par les objectifs du cahier (premier emploi, nouvel emploi, compétences, reconversion…) reliés à 3 accueils. Ajouter le niveau d'études. Repousser le choix de forfait après l'onboarding (Free par défaut) pour raccourcir l'entrée. | MVP |
| 2 | Pour moi | `/app` : accueil qui s'adapte à l'objectif (offres d'abord, ou formations d'abord). | Existe | Supprimer les doublons (`tableau-de-bord`, `espace`). Garder 4 blocs : prochaine action, 3 offres, formation en cours, accès rapides. | MVP |
| 3 | Profil professionnel | `/app/profil` complet (photo, titre, résumé, expériences dont stages, études, compétences avec preuve, langues, préférences, visibilité, aperçu recruteur). Import par texte collé. | À intégrer | Ramener les **projets** (aujourd'hui dans `career/portfolio`) comme section du profil. Ajouter certificats externes et pièces justificatives. Sections repliables. | MVP (projets), P2 (pièces) |
| 4 | CV Builder | Très complet : modèles, sections réordonnables, IA avec avant/après à accepter ou refuser, adaptation à une offre, PDF, 10 versions. | À corriger | Ajouter les sections projets, certifications et centres d'intérêt. Import de CV en fichier PDF/DOCX (aujourd'hui texte collé seulement). Le **First Job Builder** devient un mode du CV Builder, pas un outil à part. | MVP (sections), P2 (First Job, import fichier) |
| 5 | Offres et détail d'offre, Trust Shield | Liste avec filtres riches, « Pour vous » classé par score avec « Pourquoi ? », enregistrement, détail complet, badge entreprise vérifiée, signalement relié à la modération admin. | À corriger | Ajouter le filtre domaine. Afficher un vrai bloc « Vérification » (entreprise vérifiée le…, ce que ça signifie) au lieu d'un badge seul. | MVP |
| 6 | Smart Application (« Préparer ma candidature ») | Seulement un lien « Adapter mon CV » et les compétences manquantes. | À développer | Un panneau dans le détail de l'offre : points qui correspondent, informations manquantes, CV à adapter, documents demandés. Rien n'est envoyé sans validation. Version simple au MVP, version enrichie (lettre, conseils) en P2. | MVP simple, P2 enrichi |
| 7 | Candidature simplifiée | 3 étapes (CV, lettre, vérification), brouillon automatique, copie figée du CV, confirmation, ajout automatique au suivi. Gratuit, vérifié par test. | À corriger | Ajouter les pièces jointes. Les questions de présélection attendent que le côté recruteur les crée (P2). **Candidature externe** : bouton « Postuler sur le site de l'entreprise » puis « J'ai postulé », statut « Déclarée par vous », jamais « Envoyée ». | MVP (pièces jointes), P2 (questions, externe si aucune offre externe au lancement) |
| 8 | Suivi | `/app/suivi` : candidatures, entretiens, messages ; statuts réels ; historique ; CV envoyé ; documents demandés ; créneaux d'entretien avec ajout à l'agenda. | À corriger | Aligner les statuts (voir § 3.3). Grouper par situation (à faire, en attente, entretien, terminé). Fusionner `jobs/candidatures` dans Suivi. | MVP |
| 9 | Simulateur d'entretien | `career/entretiens` : écrit et oral, 4 types, 3 niveaux, 3 durées, retour sur 5 critères, rattachable à une offre. | À intégrer | Le lancer depuis l'entretien réel dans Suivi (« Préparer cet entretien ») et depuis le détail d'offre. Ajouter un court briefing et la mention « privé, jamais vu par le recruteur ». Il existe déjà : on le garde au MVP au lieu d'attendre P2. | MVP |
| 10 | Career Recovery (rebond après refus) | Un encart bienveillant et un lien vers d'autres offres. | À développer | Dans la candidature « Non retenue » : rappel des écarts déjà calculés par le matching (jamais une raison inventée), formation liée, 3 offres proches. | P2 |
| 11 | Apprendre et Learning Room | Catalogue avec filtres, mes formations, détail, salle de cours (vidéo adaptative, transcription, notes, quiz, exercices, ressources, progression, reprise automatique, PDF), évaluations, attestations. | Existe | Afficher les compétences visées sur le détail. Renommer « parcours » (qui veut dire « mes formations ») et fusionner `explorer` dans l'accueil Apprendre. | MVP |
| 12 | Match & Grow | Le détail d'offre propose déjà une formation pour le premier écart de compétence, avec score estimé. | Existe (partiel) | Montrer tous les écarts, pas seulement le premier. | P2 |
| 13 | Skills Passport | Les compétences du profil ont déjà un niveau et une preuve. Les attestations existent. | À développer | Trois niveaux de preuve (déclarée, documentée, évaluée) affichés sur le profil. | P3 |
| 14 | Jumanly AI (assistant unique) | **Absent.** 12 fonctions d'IA séparées, un seul chat (coach Learn) sans historique. Socle commun `runAi` solide. | À développer | Voir § 4.3. Un seul panneau, ouvert depuis la barre, qui connaît la page courante et propose les actions de cette page. Le coach Learn devient ce même panneau. | MVP |
| 15 | Messages et notifications | Complet : conversations liées aux candidatures, demandes de documents, créneaux, blocage, modération ; 43 types de notifications. | À corriger | Réglages de notifications par catégorie (aujourd'hui un seul groupe). | MVP |
| 16 | Abonnement et paramètres | Complet : formule, quotas, changement, factures PDF ; compte, mot de passe, sessions, double authentification, consentements, export des données, suppression du compte. | À corriger | Brancher un vrai fournisseur Mobile Money (aujourd'hui simulé). Fusionner `compte`, `espace` et `parametres` (voir § 3). | MVP |

**Outils présents dans l'application mais absents du cahier** : diagnostic de carrière, plan de progression, générateur LinkedIn, lettres et documents, conseils, portfolio public. Ils fonctionnent. Je recommande de les **garder mais de ne plus en faire des pages de navigation** (voir § 3.2).

---

## 3. Doublons, écrans inutiles et simplifications

### 3.1 Doublons à supprimer

| Doublon | Décision |
|---|---|
| `/app/tableau-de-bord` (859 lignes) refait `/app` (Pour moi) | **Supprimer**, rediriger vers `/app`. |
| `/app/espace` refait `/app/compte` | **Supprimer**, rediriger vers `/app/compte`. |
| `/app/jobs/candidatures` recoupe `/app/suivi` | **Fusionner** dans Suivi. Le détail d'une candidature devient `/app/suivi/[id]`. |
| `/app/learn/explorer` refait l'accueil Apprendre et le catalogue public `/formations` | **Fusionner** : l'accueil Apprendre affiche le catalogue avec la recherche. |
| `/app/learn/coach` (chat séparé) | **Remplacer** par l'assistant unique ouvert dans le contexte d'une leçon. |
| Menu du compte : « Abonnement » et « Quotas » vont à la même page | Garder une seule entrée. |
| Bouton « + » dans l'en-tête (Postuler, CV, Lettre, Entretien, Expérience, Premium) | **Supprimer** : chaque action existe déjà là où on en a besoin. |
| Menu latéral talent (`TalentMenu`) | **Supprimer** au profit de la page Compte. |

### 3.2 Pages à retirer de la navigation (le service reste)

| Page | Où elle va |
|---|---|
| `career` (accueil du module, 8 cartes) | Disparaît comme destination. « CV et documents » devient l'entrée du Compte et des actions contextuelles. |
| `career/diagnostic`, `career/plan` | Alimentent la « prochaine action » de Pour moi. Accessibles depuis le profil (« Faire le point »). |
| `career/linkedin`, `career/documents` | Onglets de « CV et documents ». |
| `career/conseils` | Fiches intégrées à Apprendre (contenus courts). |
| `career/portfolio` | Devient la section Projets du profil. La page publique `/portfolio/[slug]` reste. |
| `career/entretiens` | Reste, mais on y arrive depuis Suivi ou une offre, plus depuis un menu. |
| `/app/testeur` | Outil interne : invisible en production. |

### 3.3 Statuts de candidature

Les statuts actuels sont tous calculés à partir de données réelles, ce qui est le bon principe. Je recommande de **ne pas inventer « Reçue »** : dans Jumanly, une candidature envoyée arrive instantanément chez le recruteur. Proposition :

| Cahier | Aujourd'hui | Recommandation |
|---|---|---|
| Envoyée | Envoyée | Envoyée |
| Reçue | (aucun) | Fusionné avec Envoyée |
| En examen | Consultée par le recruteur | **En examen** (renommer) |
| Présélectionnée | Présélectionnée | inchangé |
| Entretien | Test à passer, Entretien | inchangé |
| (absent) | Offre reçue, Recruté | **garder**, ce sont de bonnes nouvelles réelles |
| Non retenue | Non retenue | inchangé |
| Retirée | Retirée | inchangé |
| Clôturée | Offre clôturée | inchangé |
| (externe) | n'existe pas | **Déclarée par vous** |

### 3.4 Noms à clarifier

- « Entretiens » désigne à la fois le simulateur et les vrais entretiens : appeler le simulateur **« S'entraîner »**.
- « Parcours » désigne à la fois « mes formations » et les parcours de formation : appeler la première **« Mes formations »**.

---

## 4. Architecture de navigation recommandée

### 4.1 Le choix

Le cahier demande 4 onglets (Pour moi, Offres, Apprendre, Suivi) et un bouton flottant pour l'IA. Ma refonte mobile du 17/10 proposait Accueil, Se former, Orbi, Opportunités, Carrière.

**Je recommande de suivre le cahier, avec l'assistant au centre de la barre plutôt qu'en bouton flottant :**

```
 Pour moi    Offres    ( Orbi )    Apprendre    Suivi
```

Pourquoi :
- Ce sont les 4 actions principales du cahier, et le code a déjà ces 4 onglets : le changement est faible et sans risque.
- Un bouton flottant cache le contenu des listes sur petit écran et entre en conflit avec le bouton « Postuler » collant. Au centre de la barre, l'assistant est visible sans rien masquer. C'est aussi la barre que vous avez choisie comme référence (rond central qui déborde).
- « Carrière » disparaît comme onglet : le CV, le profil et les documents vivent dans le Compte et apparaissent au moment où on en a besoin (dans une offre, une candidature).

La refonte mobile garde son identité visuelle (verre, pilule, couleurs, icônes) mais adopte ces noms d'onglets.

### 4.2 Les zones fixes

- **En-tête** : titre de la page, recherche (offres, formations, messages), messages, cloche des notifications, avatar qui ouvre le Compte.
- **Compte** (avatar) : mon profil, CV et documents, mes attestations, mon abonnement, paramètres (sécurité, confidentialité, notifications), aide, déconnexion.
- **Ordinateur** : même structure dans une colonne d'icônes à gauche.

### 4.3 L'assistant unique

- Un seul panneau, qui s'ouvre en bas de l'écran depuis le rond central.
- Il reçoit le contexte de la page (l'offre, la leçon, la candidature) et propose 2 ou 3 actions adaptées en tête : « Préparer ma candidature », « Expliquer cette notion », « Préparer mon entretien », « Améliorer ce texte ».
- Les 12 fonctions d'IA existantes deviennent ses actions. Rien ne change dans le socle de sécurité (consentement, droit, quota, journal).
- Historique simple des conversations, que l'on peut effacer.
- L'assistant ne modifie rien et n'envoie rien sans validation (déjà vrai aujourd'hui).
- Quand le quota est épuisé, il le dit et propose la formule, mais **n'empêche jamais** de lire une offre ou de postuler.
- La messagerie avec les recruteurs reste séparée.

---

## 5. Liste définitive des pages

**Espace talent : 20 pages** (contre 44 aujourd'hui). Les routes existantes sont réutilisées autant que possible.

| # | Page | Route | Contenu | Remplace |
|---|---|---|---|---|
| 1 | Bienvenue (onboarding) | `/app/bienvenue` | objectif, niveau, domaine, lieux, type de poste | — |
| 2 | Pour moi | `/app` | prochaine action, 3 offres, formation en cours, accès rapides | `tableau-de-bord`, `espace` |
| 3 | Offres | `/app/jobs` | Pour vous / Récentes / Enregistrées, recherche, filtres | `jobs/enregistrees` (onglet) |
| 4 | Détail de l'offre | `/app/jobs/[slug]` | description, vérification, score et « Pourquoi ? », Préparer ma candidature, Match & Grow, signaler | — |
| 5 | Candidature | `/app/jobs/[slug]/postuler` | CV, pièces, vérification, envoi | flux actuel dans la page |
| 6 | Apprendre | `/app/learn` | en cours, recommandées, catalogue avec recherche | `learn/explorer`, `career/conseils` |
| 7 | Détail de la formation | `/app/learn/[slug]` | programme, compétences visées, accès | — |
| 8 | Salle de cours | `/app/learn/[slug]/[lecon]` | leçon, exercices, ressources, progression, assistant | `learn/coach` |
| 9 | Mes formations | `/app/learn/mes-formations` | en cours, terminées, enregistrées, évaluations, attestations | `learn/parcours`, `learn/evaluations` |
| 10 | Suivi | `/app/suivi` | candidatures groupées par situation, entretiens à venir | `jobs/candidatures` |
| 11 | Détail d'une candidature | `/app/suivi/[id]` | historique, documents envoyés, messages, entretien, préparer | `jobs/candidatures/[id]`, `suivi/entretiens/[id]` |
| 12 | S'entraîner (entretien) | `/app/career/entretiens/[id]` | briefing, simulation, retour | — |
| 13 | Messages | `/app/messages` | conversations | — |
| 14 | Conversation | `/app/messages/[id]` | fil, fichiers, créneaux | — |
| 15 | Notifications | `/app/notifications` | liste | — |
| 16 | Compte | `/app/compte` | entrées du compte | `espace`, menu latéral |
| 17 | Mon profil | `/app/profil` | sections repliables, projets, aperçu recruteur, faire le point | `career/portfolio`, `career/diagnostic`, `career/plan` (en section) |
| 18 | CV et documents | `/app/career/cv` | mes CV, lettres, LinkedIn | `career`, `career/documents`, `career/linkedin`, `cv/modeles` |
| 19 | Éditeur de CV | `/app/career/cv/[id]` | édition, modèles, IA, adaptation, PDF | — |
| 20 | Abonnement et paramètres | `/app/abonnement`, `/app/parametres` | formule, quotas, factures ; sécurité, confidentialité, notifications | — |

Restent en dehors de la navigation : recherche (`/app/recherche`), import (`/app/profil/import`), paiement (`/app/abonnement/payer`), invitation, impression du CV. Les anciennes routes redirigent vers les nouvelles pour ne casser aucun lien.

---

## 6. Les cinq parcours

**Parcours 1. Préparer une candidature**
Offres → Détail de l'offre (score et « Pourquoi ? ») → « Préparer ma candidature » (panneau : ce qui correspond, ce qui manque) → « Adapter mon CV » (éditeur, propositions à accepter) → Candidature (CV, pièces, envoi) → Confirmation → Suivi.
*Aujourd'hui :* tout existe sauf le panneau de préparation et les pièces jointes.

**Parcours 2. Préparer un entretien**
Notification « Invitation à un entretien » → Détail de la candidature (confirmer le créneau, ajouter à l'agenda) → « Préparer cet entretien » → Briefing → Simulation (écrite ou orale) → Retour → Retour au détail de la candidature.
*Aujourd'hui :* invitation, créneaux et simulateur existent, mais ne sont pas reliés.

**Parcours 3. Développer une compétence**
Besoin repéré (écart sur une offre, objectif, plan) → Détail de la formation → Salle de cours → Exercice → Évaluation → Attestation → compétence ajoutée au profil.
*Aujourd'hui :* complet. Manque l'ajout automatique de la compétence prouvée au profil.

**Parcours 4. Rebondir après un refus**
Notification « Non retenue » → Détail de la candidature → encart « Rebondir » : écarts déjà calculés, formation liée, 3 offres proches → nouvelle candidature.
*Aujourd'hui :* seul le lien vers d'autres offres existe. Phase 2.

**Parcours 5. Valoriser son profil**
Bienvenue → Mon profil (import ou saisie, projets, compétences) → CV et documents (CV créé depuis le profil) → utilisé dans une candidature.
*Aujourd'hui :* complet sauf les projets, absents du profil et du CV.

---

## 7. Ce qui doit être fini pour le MVP, et ce qui peut attendre

### MVP : à terminer avant l'ouverture

Par ordre de priorité :

1. **Simplifier la navigation** : 4 onglets + assistant au centre, Compte par l'avatar, suppression du « + », du menu latéral, de `tableau-de-bord`, `espace`, `explorer`, `jobs/candidatures`, `learn/coach` (avec redirections).
2. **Assistant unique** (version 1) : panneau, contexte de page, actions existantes regroupées, historique simple.
3. **Préparer ma candidature** (version simple) dans le détail de l'offre.
4. **Suivi** : statuts alignés, groupement par situation, détail de candidature unique, lien « Préparer cet entretien » vers le simulateur.
5. **Profil et CV** : section Projets (fusion du portfolio), sections projets, certifications et centres d'intérêt dans le CV.
6. **Onboarding** : objectifs du cahier, pays demandé une seule fois, niveau d'études.
7. **Candidature** : pièces jointes.
8. **Confiance et exploitation** : vrai fournisseur Mobile Money, bloc « Vérification » sur l'offre, réglages de notifications par catégorie, noms de forfaits retirés de `contact-rules.ts`, `/app/testeur` invisible en production.
9. **Petites retouches** : compétences visées sur le détail d'une formation, filtre domaine, renommages (« S'entraîner », « Mes formations »).

Ce qui existe déjà et reste tel quel au MVP : Learning Room, reprise, vidéo adaptative, attestations, messagerie, abonnement, sécurité du compte, simulateur d'entretien, CV Builder, matching explicable.

### Phase 2 : après les premiers tests

- Préparer ma candidature enrichi (lettre, conseils par critère).
- Career Recovery (rebond après refus).
- First Job Builder, comme mode du CV Builder.
- Match & Grow sur tous les écarts.
- Candidature externe (« Déclarée par vous »), sauf si des offres externes sont publiées dès le lancement : dans ce cas, MVP.
- Questions de présélection (à créer d'abord côté recruteur).
- Import de CV en fichier PDF ou DOCX.
- Pièces justificatives et certificats externes dans le profil.
- Meilleures recommandations.

### Phase 3

- Skills Passport (déclarée, documentée, évaluée).
- Skills Challenge.
- Évaluations avancées.

---

## 8. Décisions à prendre par Ephraïm

1. **Navigation** : Pour moi · Offres · Orbi (centre) · Apprendre · Suivi, à la place de la barre de ma refonte du 17/10. *Recommandé.*
2. **Nom de l'assistant** : Orbi dans l'interface (comme aujourd'hui) ou Jumanly AI (comme le cahier). *Recommandé : Orbi, avec « l'assistant IA de Jumanly » en sous-titre.*
3. **Choix du forfait à l'inscription** : le garder, ou le déplacer après l'onboarding (Free par défaut). *Recommandé : le déplacer.*
4. **Offres externes au lancement** : oui ou non. Si oui, la candidature externe passe en MVP.
5. **Fournisseur Mobile Money** à choisir (aucun n'est branché aujourd'hui).

Une fois ces choix faits, l'étape suivante est de reprendre la refonte mobile écran par écran sur cette liste de 20 pages, puis de rédiger les prompts Claude Code dans l'ordre du § 7.

### Décisions d'Ephraïm (18/10/2026)

1. Navigation Pour moi · Offres · Orbi (centre) · Apprendre · Suivi : **validée**.
2. Nom de l'assistant : **Orbi**.
3. Choix du forfait : **après l'onboarding**, Free par défaut.
4. Offres externes au lancement : **non**, seulement les offres des recruteurs Jumanly ; candidature externe en phase 2.
5. Mobile Money : fournisseurs ajoutés progressivement ; le paiement simulé ne doit pas partir en production.
