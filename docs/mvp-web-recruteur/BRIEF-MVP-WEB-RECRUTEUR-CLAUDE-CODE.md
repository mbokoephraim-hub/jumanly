# MVP web recruteur · brief pour Claude Code

Décision d'Ephraïm du 12/11/2026. Jumanly démarre par **une seule offre : l'outil de recrutement des entreprises, sur ordinateur (application web)**. Prix cible : **4 900 USD par an et par entreprise**. Le reste de la plateforme n'est pas effacé : il est **mis en veille** (caché, code et données intacts) et reviendra après les premiers clients.

Ce brief l'emporte sur `docs/PLAN-REFONTE-EN-3-ETAPES.md` pour l'ordre de travail. Il ne change ni les règles d'or de `CLAUDE.md`, ni la logique du recrutement validée le 01/11/2026 (`docs/decisions/2026-11-01-hire-logique-recrutement.md`), ni le design du Modèle B recruteur (`docs/modele-b-recruteur/`, captures `web/captures/INDEX.md`).

---

## 1. La promesse à tenir

> « En 10 minutes, une entreprise publie une offre et la partage. Orbi lui sort une short-list expliquée, les candidats passent un test, réservent eux-mêmes leur entretien dans l'agenda de l'équipe, et Jumanly relance tout le monde à sa place. Les bons profils non retenus restent dans son vivier. »

Chaque lot se juge à cette phrase : si une fonction ne la sert pas, elle attend.

## 2. Périmètre

### Dans le MVP (10 briques)

| # | Brique | État dans le dépôt au 12/11/2026 | Travail |
|---|---|---|---|
| 1 | Espace entreprise et équipe (inscription, logo, rôles admin / recruteur, invitations) | Fait (étape 3, lots A1 à A6) | Vérifier |
| 2 | Offres d'emploi (modèle, publication, page carrière, lien à partager) | Fait en grande partie (`/app/hire/offres`, `/entreprises/[slug]`, `/offres/[slug]`) | Ajuster : partage LinkedIn / WhatsApp, suivi de la source |
| 3 | **Candidature express** (sans création de compte longue) | À construire : aujourd'hui « Postuler » envoie vers l'inscription talent complète | Construire |
| 4 | Short-list Orbi expliquée (classes, 3 notes, raisons) | Fait (Tableau Orbi, `hire-classes`, `hire-scores`, `hire-tri`) | Vérifier, raisons en 3 familles |
| 5 | Pipeline ATS (étapes, glisser-déposer, notes d'équipe, évaluations) | Fait (`hire-ats`, `hire-candidates`, `Scorecard`) | Vérifier le glisser-déposer en colonnes sur ordinateur |
| 6 | **Tests de compétences** | À construire (seuls les quiz de Learn existent, liés aux cours) | Construire |
| 7 | **Prise de rendez-vous connectée à l'agenda Google / Outlook** | Partiel : entretiens à créneaux proposés (`Interview`), fichier `.ics` | Construire la connexion d'agenda et la réservation par le candidat |
| 8 | **Suivi automatique** (e-mails aux candidats, relances, rappels à l'équipe) | Partiel : relances des pièces de vérification, modèles de messages, réponses groupées | Construire les règles automatiques par étape |
| 9 | **Vivier** (automatique, avec consentement) | Partiel : viviers manuels (`TalentPool`) | Construire l'entrée automatique et les suggestions à chaque nouvelle offre |
| 10 | Tableau de bord et rapports PDF | Fait (`hire-reports`, `hire-report-pdf`) | Ajouter les indicateurs du MVP |

Plus : la **formule annuelle** à 4 900 USD (lot M1) et le **mode MVP** qui cache le reste (lot M0).

### Mis en veille (caché, jamais supprimé)

- Fil social (talent et recruteur), Explorer, Formation (Learn), badges et attestations, diagnostic, Career avancé, Orbi conversation côté talent, Partners.
- Application mobile : **aucun nouveau travail mobile**. Les écrans recruteur au téléphone déjà codés restent, mais on ne les teste plus et on n'en ajoute pas. Le parcours **candidat** reste, lui, impeccable au téléphone (les candidats postulent depuis WhatsApp).
- Formules talent et RH : retirées des pages publiques (`isPublic = false`), conservées en base.

## 3. Lots de construction (une PR par lot, dans cet ordre)

Chaque lot : lire ce brief et les documents cités, plan court, code, tests, `docs/journal.md`, note dans `docs/decisions/` si un choix s'écarte. Ne pas commencer le lot suivant avant que le précédent soit fusionné.

### M-00 · État des lieux (pas de code)

Parcourir l'application en recruteur (seed de démo) et remplir `docs/mvp-web-recruteur/ETAT-DES-LIEUX.md` : pour **chaque critère d'acceptation** de ce brief, « fait », « à ajuster » ou « à construire », avec le fichier concerné. Corriger le tableau du § 2 si le dépôt dit autre chose. C'est cette liste qui pilote les lots suivants.

### M0 · Mode MVP

- Variable d'environnement `PRODUCT_SCOPE` : `full` (défaut, local) ou `hire` (production MVP). Lue par une seule fonction `productScope()` ; jamais de test dispersé.
- En mode `hire` :
  - Menu recruteur sur ordinateur : **Accueil (À traiter) · Offres · Candidats · Agenda · Vivier · Chat**, puis Outils (Rapports, Tests, Modèles de messages, Suivi automatique) et Entreprise. Le Fil disparaît, l'accueil devient « À traiter » en pleine largeur (`RhTodayRail` élargi).
  - Talents → **Vivier** (Découvrir et Propositions cachés tant que la base de talents est petite).
  - Routes mises en veille : redirection 307 vers l'accueil recruteur ou vers le site ; liens retirés des menus, du pied de page, du plan du site et de `llms.txt`.
  - Site public recentré sur les entreprises : accueil = page recruteurs, `/tarifs` = la formule annuelle, `/offres` et `/entreprises/[slug]` restent (ce sont les pages carrière).
  - Un compte talent existant garde l'accès à ses candidatures, ses messages et son profil (jamais de perte de données).
- Critères : avec `PRODUCT_SCOPE=hire`, aucune page ni lien mis en veille n'est atteignable ; avec `full`, rien ne change (tests e2e existants verts).

### M1 · Formule annuelle « Jumanly Hire »

- Le champ `Plan.interval` accepte `year`. Nouvelle formule en base (seed + écran admin) : code `hire_business`, famille `company`, `priceCents = 490000`, `interval = year`, publique et achetable, avec **tous les droits du MVP** (analyse Orbi, filtres, vérification standard, tests, agenda connecté, suivi automatique, vivier, rapports PDF). Droits nouveaux : `hire.assessments`, `hire.calendar.sync`, `hire.automation`, `hire.pool.auto` (jamais de nom de formule dans le code, règle 2).
- Sièges inclus : **5 membres** par défaut (réglable dans l'admin). Au-delà : demande au support par e-mail.
- Paiement : abonnement prépayé existant (Mobile Money, carte) sur 12 mois, rappels à J-30, J-7, J-1 par la tâche de facturation ; facture annuelle. Ajouter « Demander une facture pour virement » qui envoie un e-mail à assistant@jumanly.io (pas de virement automatisé).
- Les formules Company, Company Plus, RH restent en base, cachées du public en mode `hire`.
- Critères : une entreprise s'abonne, voit 4 900 USD / an (et « soit 408 USD par mois » en petit), reçoit sa facture ; les droits s'ouvrent ; à l'échéance non payée, délai de grâce puis droits gratuits, données conservées.

### M2 · Candidature express (côté candidat, mobile d'abord)

- Depuis `/offres/[slug]` : un formulaire sur la page, sans quitter l'offre : prénom, nom, e-mail, CV (PDF ou Word, 5 Mo), questions de l'offre (3 au plus), case « Garder mon profil dans le vivier de l'entreprise pour d'autres offres » (non cochée par défaut), consentement à la politique de confidentialité.
- Envoi → e-mail de confirmation avec lien (mécanisme existant de confirmation par lien, `docs/decisions/2026-10-27-confirmation-par-lien.md`). Le lien crée un compte talent léger (profil prérempli par l'import de CV existant, `cv-import`) et valide la candidature. Sans clic sous 48 h : une relance, puis la candidature reste « non confirmée » et invisible au recruteur après 7 jours (effacée à 30 jours).
- Une personne déjà inscrite et connectée postule en un clic avec son CV Jumanly.
- Page de suivi candidat minimale : statut de la candidature, test à passer, créneau à réserver, pièces à envoyer, messages.
- Source de la candidature enregistrée (`utm_source` du lien : linkedin, whatsapp, lien direct, page carrière).
- Critères : candidature complète en moins de 2 minutes au téléphone à 390 px, en 3G lente ; candidater reste gratuit (règle 1) ; 200 Ko de JS max sur la page d'offre (règle 9).

### M3 · Offres, page carrière et partage (ajustements)

- Création d'offre par modèle (les modèles existants) ou par texte collé que Orbi met en forme (l'humain valide).
- Après publication : panneau « Partager » avec lien court copiable, boutons LinkedIn et WhatsApp (liens de partage natifs, sans API), QR code téléchargeable, chaque lien porte sa source.
- Page carrière de l'entreprise (`/entreprises/[slug]`) : logo, bannière, présentation, offres ouvertes, bouton « Rejoindre notre vivier » (même formulaire que M2 sans offre).
- Critères : de l'inscription de l'entreprise à une offre partagée sur WhatsApp en moins de 10 minutes (mesuré dans le test e2e de bout en bout du lot M9).

### M4 · Short-list Orbi et pipeline (vérification et finitions)

- Garder les étapes et les classes validées le 01/11 (Reçue, En examen, Présélectionnée, Entretien, Décision finale, Embauché, Refusé ; classes Fort potentiel, À considérer, Limité, Hors critères). Ajouter l'étape facultative **Test** quand un test est rattaché à l'offre (M5).
- Chaque candidat de la short-list montre **3 familles de raisons** : « Correspond », « À vérifier », « Manque », issues du calcul déterministe (doc 08) ; le résultat d'un test (M5) et un entretien évalué alimentent la note Confiance.
- Sur ordinateur : vue colonnes avec glisser-déposer (clavier compris : flèches + Entrée, WCAG 2.2) et vue tableau ; déplacer vers « Refusé » demande toujours une confirmation humaine (règle 3).
- Critères : aucun candidat n'est écarté ni caché par Orbi ; tout score a son « Pourquoi ? ».

### M5 · Tests de compétences

- Tables : `SkillTest` (organisation, titre, compétences liées, durée facultative, consigne), `SkillTestQuestion` (type `choice` | `multi` | `short` | `task` avec fichier ou lien, barème), `SkillTestInvite` (candidature, échéance, jeton), `SkillTestAttempt` (réponses, début, fin, score auto, note manuelle, correcteur).
- Bibliothèque de l'entreprise (Outils → Tests) : créer, dupliquer, archiver. **Orbi propose** des questions à partir des compétences de l'offre ; le recruteur les relit et les valide avant tout envoi (règle 3, appel journalisé dans `AiUsage`).
- Rattacher un test à une offre : envoi automatique à la candidature, ou à l'entrée dans une étape choisie, ou à la main (un candidat, ou plusieurs d'un coup).
- Côté candidat (téléphone d'abord) : lien depuis l'e-mail ou la page de suivi, sans autre compte ; une tentative ; chronomètre affiché si durée ; sauvegarde à chaque réponse (réseau coupé = reprise) ; option « temps supplémentaire » accordée par le recruteur (accessibilité).
- Correction : choix corrigés automatiquement ; réponses courtes et exercices notés par l'équipe avec la grille ; Orbi peut proposer une note commentée, l'humain la confirme.
- Le résultat apparaît sur la fiche et dans la short-list (« Test SQL : 82 % ») et compte dans la note Confiance. Un test non passé n'élimine personne : il est signalé « À vérifier ».
- Critères : un recruteur crée un test de 10 questions en moins de 5 minutes avec Orbi ; un candidat le passe au téléphone ; le score s'affiche dans la short-list ; isolation par `organizationId` (règle 6).

### M6 · Agenda connecté et réservation d'entretien

- Connexion de l'agenda par membre (Compte → Agenda) : **Google Agenda** (API Google Calendar, OAuth) et **Outlook / Microsoft 365** (Microsoft Graph, OAuth). Droits minimaux : lire les disponibilités (free/busy) et créer ou modifier les événements créés par Jumanly. Jetons chiffrés en base, révocables. Derrière une interface `CalendarProvider` avec implémentation `fake` pour les tests et le local.
- Variables d'environnement : `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `CALENDAR_TOKEN_KEY` (à ajouter à la partie 02 des spécifications et à `.env.example`).
- Planifier : le recruteur choisit durée, mode (les modes d'entretien existants), participants de l'équipe et une plage de dates. Jumanly calcule les créneaux libres **communs** à tous les participants.
- Le candidat reçoit un lien et **réserve lui-même** un créneau (page de réservation, téléphone d'abord, fuseau du candidat affiché). Il peut demander un autre moment (mécanisme `proposedSlots` existant).
- À la réservation : événement créé dans l'agenda de chaque participant, avec lien **Google Meet** ou **Teams** généré automatiquement si visio ; invitation `.ics` au candidat ; rappels e-mail à J-1 et H-1 (M7). Annulation ou déplacement synchronisés dans les deux sens.
- Sans agenda connecté : le fonctionnement actuel (créneaux proposés à la main + `.ics`) reste.
- **À lancer dès le début du MVP** : la validation de l'application Google (écran de consentement, droits « sensibles ») et l'inscription de l'application Microsoft prennent plusieurs semaines. Rédiger dans `docs/mvp-web-recruteur/AGENDA-VALIDATION.md` ce qu'Ephraïm doit remplir dans les consoles Google et Microsoft.
- Critères : avec deux recruteurs connectés (un Google, un Outlook), un candidat ne voit que les créneaux libres pour les deux ; l'événement apparaît dans les deux agendas avec le lien de visio ; un déplacement dans Google met Jumanly à jour.

### M7 · Suivi automatique

- Outils → **Suivi automatique** : une liste de règles simples, activées par défaut, que l'entreprise peut couper ou modifier (texte basé sur les modèles de messages existants, variables `{prénom}`, `{poste}`, `{entreprise}`, `{lien}`).
- Règles livrées :
  - Candidats : accusé de réception (immédiat) ; invitation au test ; relance test non passé (J+2, puis J+4) ; invitation à réserver l'entretien ; relance créneau non réservé (J+2) ; rappels d'entretien (J-1, H-1) ; relance des pièces (existante, garder 5 jours et 2 relances) ; réponse négative **seulement quand un membre a déplacé la personne dans « Refusé »**, envoyée après un délai de 24 h annulable (jamais automatique sans décision humaine, règle 3) ; candidature non confirmée (M2).
  - Équipe : candidature sans action depuis 3 jours ; évaluation d'entretien non rédigée à H+24 ; offre sans nouvelle candidature depuis 7 jours (« Partagez-la à nouveau ») ; résumé quotidien par e-mail à 8 h dans le fuseau du membre (réglable).
- Exécution : une tâche planifiée (route `/api/jobs/hire-automation`, cron toutes les 15 minutes dans `vercel.json`, comme `/api/jobs/billing`), chaque envoi réclamé une seule fois (même mécanisme que les relances de vérification), journalisé dans `ApplicationEvent` et visible sur la fiche du candidat (« E-mail envoyé automatiquement le… »).
- Tous les e-mails : expéditeur Jumanly au nom de l'entreprise, réponse vers le Chat, aucun numéro de téléphone (règle 8), lien vers la page de suivi.
- Critères : un candidat qui ne passe pas son test reçoit 2 relances puis plus rien ; couper une règle l'arrête pour toutes les offres ; aucune réponse négative n'est envoyée sans geste humain.

### M8 · Vivier automatique

- Un vivier « Vivier de l'entreprise » existe pour chaque organisation (en plus des viviers manuels actuels).
- Y entrent automatiquement, **seulement avec le consentement du candidat** (case de M2 ou « Rejoindre notre vivier » de M3) : les candidats non retenus et les candidats d'une offre fermée. Étiquettes automatiques : offre d'origine, compétences, classe Orbi, dernière étape atteinte.
- À la publication d'une nouvelle offre : « 12 personnes de votre vivier correspondent » (même calcul déterministe), avec envoi groupé d'une invitation à postuler (le candidat postule en un clic).
- Recherche et filtres dans le Vivier (compétence, ville, disponibilité, offre d'origine, classe). Retrait possible à tout moment par la personne (lien dans chaque e-mail) ; conservation 24 mois puis demande de renouvellement du consentement, sinon retrait.
- Critères : sans consentement, personne n'entre dans le vivier ; une nouvelle offre affiche les correspondances du vivier ; le retrait par le candidat est immédiat.

### M9 · Tableau de bord, premiers pas et bilan

- Tableau de bord : candidatures par offre et par source, délai moyen jusqu'à l'embauche, taux de passage d'une étape à l'autre, tests envoyés / passés, entretiens planifiés / tenus, temps gagné par le suivi automatique (nombre d'e-mails envoyés). Export PDF existant enrichi.
- Premiers pas d'une nouvelle entreprise (checklist dans l'accueil) : logo → inviter un collègue → connecter son agenda → première offre → partager le lien → créer un test.
- Test e2e de bout en bout `mvp-recruteur.spec.ts` : inscription entreprise → abonnement annuel (paiement `fake`) → offre → partage → candidature express au téléphone → short-list → test → réservation d'entretien (agenda `fake`) → évaluation → embauche → refus avec e-mail différé → vivier → rapport PDF.
- Bilan dans `docs/journal.md` et mise à jour de `ETAT-DES-LIEUX.md` (tout « fait »).

## 4. Critères transverses (chaque lot)

- Règles d'or de `CLAUDE.md` respectées, en particulier 1 (candidater gratuit), 2 (droits, pas de noms de formules), 3 (aucun rejet automatique), 5 et 6 (confidentialité, isolation), 7 (textes dans `textes/textes-application.md`), 8 (aucun téléphone).
- Recruteur : testé à **1440 et 1024 px**, clair et sombre. Candidat : testé à **390 px** et sur ordinateur.
- Design : Modèle B recruteur (`docs/modele-b-recruteur/web/captures/`), goûts d'Ephraïm : peu de texte, icônes pleines sur tuiles pastel, un seul bouton lime par écran, l'action principale et Orbi qui pulsent, une couleur vive par classe et par étape (voir `docs/decisions/2026-11-01-hire-logique-recrutement.md`). Les nouveaux écrans (tests, réservation, suivi automatique, vivier) suivent les composants existants ; pas de nouveau style.
- Lint, types, tests unitaires, e2e et build verts avant de demander la fusion.

## 5. Points réglés par défaut (modifiables dans l'admin ou plus tard)

- 5 sièges inclus dans la formule annuelle.
- Pas d'essai gratuit automatique : une démo est proposée par e-mail depuis `/tarifs`.
- Les formules mensuelles Company restent en base, cachées.
- Délais de relance : J+2 et J+4 pour les tests, J+2 pour l'entretien, 24 h pour la réponse négative.
