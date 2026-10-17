# Refonte de l'expérience mobile · cahier des charges (version 1, 17 octobre 2026)

**Statut.** Dès sa validation, ce document remplace, **pour la forme et la navigation mobiles**, les cahiers
`docs/ux-mobile-talent/CAHIER-DES-CHARGES-*.md` (v1 à v9). Les **règles métier** décidées dans ces versions
restent valables (liste au § K). Maquette des fondations : `maquette/refonte-mobile-fondations.html`.

Ordre de travail voulu : **fondations** (ce lot) → **Talent** → **Recruteur** → **Entreprise** → brief et prompts
pour Claude Code. Chaque étape est validée avant la suivante.

---

## A. Ma demande (texte dicté, non retouché)

> Alors, j'ai commencé l'étape de test. Et voici ce que j'en déduis. Le concept autour de l'application est parfait. Nous sommes à l'intersection de trois choses: head tech, carrière tech et HR tech. Head tech et carrière tech. C'est mélangé pour les talents. Et HR Tech, c'est l'interface uniquement pour les entreprises et les recruteurs. Alors cela est très bien. Mais il faudrait simplifier l'utilisation à chaque utilisateur pour que chacun atteigne facilement cet objectif. Pour un talent, l'objectif... c'est de pouvoir faire grandir sa carrière. Et pour cela, il a besoin d'un outil important, de deux outils importants, ou bien de trois outils importants qui est la formation en employabilité, deuxièmement, l'accompagnement dans la carrière professionnelle, et troisièmement, saisir l'opportunité, saisir l'opportunité. Pour un recruteur, tout ce qu'il a envie de savoir, c'est que son offre soit vue par les bons candidats, qu'ils traitent très facilement leurs euh, documents de candidature, de manière qualitative, qu'ils rassemblent ces différents documents et qu'ils les traitent avec rapidité et avec minutieux, et qu'ils programment directement un rendez-vous. Je crois que ça, c'est la philosophie d'un candidat plutôt d'un recruteur. Alors justement, on doit construire une expérience utilisateur mobile qui facilite cette chose. Et pour cela, on a besoin de naviguer sur une interface, pas avec beaucoup d'éléments, mais avec des éléments qui nous permettent d'atteindre ces objectifs. Avec des interfaces qui nous amènent à réaliser cet objectif. C'est pourquoi j'aimerais que tu ferais face l'expérience mobile de, des visiteurs, que tu refasses tous les designs. On va aller progressivement. Tout d'abord, on va créer les icônes, on va créer des options, on va créer les styles de menu, les styles de, de barres de recherche. Donc, toutes les options qui existent doivent avoir déjà sa forme. On va créer une meilleure visualisation de du de l'IA. J'ai pas trop beaucoup trop aimé comment ça affiche trop les verts là en dégradé, c'est pas très cool. On va refaire beaucoup de choses. Refaire euh, comment va s'afficher des options. Et tu dois retenir les options qui sont le plus important. Premièrement, tu dois réfléchir comme Un designer qui crée des expériences utilisateurs qui accrochent et qui facilitent le travail à l'utilisateur. Et pour cela, tu dois créer chaque page, chaque bloc et réfléchir à comment cela sera productif. Je n'ai pas besoin de beaucoup d'options, de beaucoup d'outils. J'ai besoin des outils qui servent énormément. Je ne veux pas que tu crées euh, le mode free, que tu crées le modèle exact pour tout le monde, pour tout talent, peu importe son niveau. C'est vrai que l'utilisation ne sera pas pareille, mais d'abord, Tous doivent avoir, avoir d'abord une identité d'expérience mobile qui correspond. Puis tu crées de l'autre côté, quand tu finiras par créer l'espace mobile pour talent, on passera par l'espace mobile pour recruteur. Et on passera pour l'espace mobile pour entreprise. Alors c'est ici que tu dois sortir ta carte d'ingéniosité. C'est vrai que tu peux t'inspirer de ce qu'on a déjà réalisé, mais cette, ce qu'on a réalisé ne permet pas une meilleure utilisation de l'application. Donc, tu dois, en fonction de toutes les informations de ta mémoire et de ce que l'on veut apporter comme solution, réfléchir sur la bonne pratique et proposer une maquette. Alors, tu vas réécrire le cahier des charges que je te proposais maintenant de manière assez pointuée et précise, améliorée. Utilise ta capacité à, à mieux affiner les idées.

Lecture de la dictée : « head tech » = **EdTech** ; « l'expérience mobile des visiteurs » = l'expérience
mobile **des utilisateurs** (talents, recruteurs, entreprises) ; « la philosophie d'un candidat plutôt d'un
recruteur » = la phrase décrit bien le **recruteur**.

---

## B. Diagnostic : pourquoi refaire

1. **Le concept est juste**, la forme ne sert pas assez l'objectif. Les versions 1 à 9 ont été construites
   par ajouts successifs : bouton +, onglet « Pour moi », menu latéral, recherche qui sert aussi d'IA, page
   Compte, bannières, badges. Chaque ajout se défendait, l'ensemble disperse l'attention.
2. **Trop d'entrées pour la même chose.** Exemple : une réalisation se publiait depuis le +, le profil, « Pour
   moi » et « J'ai trouvé une opportunité ». Le talent ne sait plus où aller.
3. **Les dégradés verts** (boutons, barre, IA) fatiguent l'œil et banalisent l'IA. Ils sont retirés.
4. **Une expérience par forfait** (aperçus floutés, variantes « Free ») complique l'interface. On construit
   **une seule expérience**, identique pour tous les talents ; le forfait ne change que des limites.

---

## C. Ce que chaque utilisateur vient faire

### C1. Talent : faire grandir sa carrière
Trois outils, et rien qui ne serve pas l'un des trois :

| Pilier | Ce que le talent veut | Ce que l'app lui donne |
|---|---|---|
| **Se former** (employabilité) | Apprendre ce qui fait embaucher, vite, sur téléphone | Parcours d'employabilité courts, reprise en un geste, certificats |
| **Être accompagné** (carrière) | Savoir où il va et comment y arriver | Orbi (CV, entretien, orientation, analyse d'offre), profil et CV prêts |
| **Saisir l'opportunité** | Trouver la bonne offre et postuler sans friction | Offres pour lui avec score expliqué, candidature gratuite, suivi clair |

### C2. Recruteur (RH) : recruter vite et bien
Un fil en cinq gestes, et l'interface suit ce fil :

1. **Publier** une offre (aidé par Orbi), **vue par les bons candidats** (diffusion ciblée, invitations).
2. **Recevoir** les candidatures, triées par adéquation avec le « Pourquoi ? ».
3. **Rassembler** le dossier complet d'un candidat au même endroit (CV, lettre, attestations, réalisations,
   réponses aux questions).
4. **Décider** avec rapidité et minutie : Retenir, À revoir, Ne pas retenir (jamais automatique, message type).
5. **Programmer** l'entretien directement (créneaux, visio ou présentiel, invitation et rappel).

### C3. Entreprise
Le fil du recruteur, plus ce qui concerne l'organisation : **équipe** (inviter, rôles), **page entreprise**
(marque employeur), **abonnement et factures**, plusieurs offres et plusieurs recruteurs.

### C4. Mesures de réussite (vérifiées en test fermé)

| Tâche | Objectif |
|---|---|
| Talent : postuler à une offre vue sur l'Accueil | 3 touchers au plus (offre → Postuler → Envoyer) |
| Talent : reprendre sa formation | 1 toucher depuis l'Accueil |
| Talent : connaître le statut d'une candidature | 2 touchers au plus |
| Talent : demander de l'aide à Orbi sur son CV | 2 touchers au plus |
| Recruteur : de la notification « nouvelle candidature » à la décision | 3 touchers au plus |
| Recruteur : programmer un entretien depuis la fiche | 4 touchers au plus |
| Tous : réussite des tâches en test fermé | 8 sur 10 sans aide |

---

## D. Principes de design (règles pour chaque écran)

1. **Une action principale par écran.** Un seul bouton plein. Le reste est secondaire ou dans un menu.
2. **Navigation fixe et courte** : quatre onglets et Orbi au centre. Aucun autre élément permanent.
3. **Trois niveaux au plus** : onglet → liste → détail. Au-delà, une feuille (bottom sheet) qui se ferme.
4. **Carte = un titre, une ligne, une action.** Le détail vient au toucher.
5. **Le pouce d'abord** : les actions sont en bas, les lectures en haut. Cibles de 44 px minimum.
6. **Aplats, pas de dégradés.** Fond Crème, cartes blanches, texte et action en Sapin. Le **Lime** est un
   accent rare : état actif, réussite, point d'Orbi. Menthe, Ambre et Corail sont réservés aux états.
7. **Une seule expérience pour tous.** Le forfait ne change que des limites, annoncées au moment où on les
   atteint, en une ligne, sans écran grisé ni flouté.
8. **Orbi propose, l'humain décide.** Chaque suggestion a un « Pourquoi ? » ; aucune décision automatique.
9. **Réseau lent** : squelettes de chargement, mode hors ligne lisible, images légères, rien d'animé
   d'indispensable.
10. **Accessibilité WCAG 2.2 AA** : contraste, focus visible, libellés lisibles par lecteur d'écran, texte
    Sapin sur Lime.

---

## E. Talent : architecture

### E1. Barre du bas (fixe)
**Accueil · Se former · Orbi (centre) · Opportunités · Carrière**

- Fond blanc, filet en haut, sans flou ni dégradé. Icône active en Sapin avec le **point Lime** de la
  marque, libellé en gras ; inactive en Ardoise.
- Orbi est un rond Sapin de 52 px, au-dessus de la barre, avec son point Lime. Il ouvre Orbi en plein écran.

### E2. En-tête
- Pages principales : **titre en grand** à gauche ; à droite **Notifications**, **Messages** et **l'avatar**
  (qui ouvre Compte). Pas de logo, pas de menu latéral.
- Pages secondaires : **Retour**, titre court, une action au plus (Partager, Enregistrer ou Plus).
- Au défilement, l'en-tête se réduit à une ligne.

### E3. Recherche
- Une barre de recherche **seulement là où l'on cherche** : Accueil (tout), Se former (formations),
  Opportunités (offres). Bouton Filtres à droite, badge du nombre de filtres actifs.
- La recherche **ne sert plus aussi d'IA** : chercher et demander sont deux gestes différents (Orbi au
  centre). Dans les résultats, une ligne « Demander à Orbi : … » reste proposée si rien ne correspond.

### E4. Contenu des onglets

| Onglet | Contenu, dans l'ordre | Action principale |
|---|---|---|
| **Accueil** | Bonjour + une phrase ; **la prochaine étape** (une seule carte) ; les trois piliers avec leur avancement ; 2 offres pour vous ; formation en cours | Ce que dit « Prochaine étape » |
| **Se former** | Recherche ; Reprendre ; **Parcours d'employabilité** (CV, entretien, savoir-être, numérique) ; thèmes ; mes certificats | Reprendre ou Commencer |
| **Orbi** | Conversation ; 4 aides : Améliorer mon CV, Préparer un entretien, Analyser une offre, Choisir ma voie ; crédits restants | Écrire ou parler |
| **Opportunités** | Recherche et filtres ; **Pour vous / Enregistrées / Candidatures** ; alertes | Postuler |
| **Carrière** | Profil et sa complétude ; mes CV ; réalisations ; objectif (Cap) ; connexions ; attestations ; « J'ai trouvé un poste » | Compléter le profil |

**Compte** (par l'avatar) : formule et paiements (Mobile Money, carte), préférences, confidentialité et
consentements, thème, aide (e-mail seulement), déconnexion.

### E5. Retiré par rapport aux versions 1 à 9
- Le **bouton +** de l'en-tête : son contenu est rangé là où il sert (réalisations et connexions dans
  Carrière, candidature dans Opportunités).
- L'onglet **« Pour moi »** devient **Accueil**, recentré sur une seule prochaine étape.
- Le **menu latéral** : tout est dans les onglets ou Compte.
- Les **dégradés** de boutons, de barres et de l'IA ; le **thème Vert** reste, en aplats.
- Les **écrans par forfait** (aperçus floutés) : une seule ligne d'information à la place.

---

## F. Recruteur : architecture

**Barre : Aujourd'hui · Offres · Orbi (centre) · Candidats · Agenda.** Même en-tête, avec le sélecteur
d'organisation sous le titre quand il y en a plusieurs.

| Onglet | Contenu | Action principale |
|---|---|---|
| **Aujourd'hui** | À traiter (nouvelles candidatures, dossiers incomplets, entretiens du jour), offres actives et leur portée | Traiter |
| **Offres** | Mes offres (vues, candidatures, adéquation moyenne) ; créer en 3 étapes avec Orbi ; diffuser et inviter | Publier une offre |
| **Orbi** | Rédiger une offre, résumer un dossier, préparer les questions d'entretien, rédiger un message | Demander |
| **Candidats** | Par offre, triés par score avec « Pourquoi ? » ; filtres ; **dossier complet** du candidat ; décision | Retenir, À revoir, Ne pas retenir |
| **Agenda** | Entretiens à venir ; créneaux disponibles ; invitation, rappel, compte rendu | Programmer |

Règles : filtre `organizationId` partout ; profil visible seulement si le talent a postulé ou s'est rendu
visible ; chaque consultation journalisée ; aucun rejet automatique ; message type modifiable avant envoi.

## G. Entreprise : architecture
La barre du recruteur, plus dans Compte : **Équipe** (inviter, rôles, offres attribuées), **Page
entreprise** (logo, bannière, présentation), **Abonnement et factures**. Le tableau Aujourd'hui ajoute la
vue d'ensemble de l'équipe.

---

## H. Fondations du système (étape 1, livrée avec ce document)

| Élément | Règle |
|---|---|
| **Icônes** | Nouveau jeu de 51 icônes, grille 24 px, trait 1,8 px, bouts arrondis. État actif = trait Sapin plus épais et **point Lime** (signature du logo). Pas d'icône remplie de couleur. |
| **Barre du bas** | Talent et recruteur, même gabarit ; Orbi au centre ; badge de compteur en Corail seulement pour les urgences, sinon point Lime. |
| **En-têtes** | Principal (titre en grand), secondaire (retour), réduit (au défilement), avec sélecteur d'organisation. |
| **Recherche** | Repos, saisie (récentes et suggestions), filtres actifs (puces), aucun résultat (avec « Demander à Orbi »). Feuille de filtres. |
| **Options** | Ligne de liste, interrupteur, choix unique en cartes, choix multiples en puces, sélecteur à segments, feuille d'actions, menu contextuel, étapes. |
| **Boutons** | Principal Sapin plein ; Accent Lime avec texte Sapin (un moment fort : Postuler, Publier) ; Secondaire blanc avec contour ; Texte ; Danger ; bouton icône. Hauteurs 52, 44, 36. |
| **Cartes** | Prochaine étape, offre, formation, candidature (statut), personne, Orbi. |
| **États** | Chargement (squelette), vide, erreur, hors ligne, succès (toast). |

## I. Orbi : nouvelle visualisation
- **Marque** : un disque Sapin, une orbite fine, le **point Lime** qui s'y déplace. Aplats, aucun dégradé.
- **États** : Repos (point fixe), Écoute (orbite qui respire), Réfléchit (le point tourne), Répond.
  Avec « animations réduites », seul le texte d'état change.
- **Réponses** : bulles blanches à filet Lime à gauche, pas de fond coloré ; chaque proposition a
  **Pourquoi ?**, **Utiliser** et **Modifier**. Sources ou données utilisées toujours citées.
- **Dans les pages** : une carte « Orbi suggère » au plus par écran, refusable.
- **Règles** inchangées : consentement, droit et quota vérifiés côté serveur, journal `AiUsage`, aucune
  limite d'IA ne bloque la consultation d'une offre ni une candidature.

## J. Étapes et validation

| Étape | Livrable | Validation |
|---|---|---|
| 1. Fondations | Planche : icônes, menus, recherche, options, boutons, cartes, Orbi, états ; 3 écrans d'aperçu | Ephraïm |
| 2. Talent | Les 5 onglets, inscription et objectif, postuler, suivre, se former, préparer un entretien avec Orbi, Compte | Ephraïm, puis test fermé |
| 3. Recruteur | Les 5 onglets, publier, trier, dossier, décider, programmer | Ephraïm |
| 4. Entreprise | Équipe, page entreprise, abonnement | Ephraïm |
| 5. Développement | Brief et prompts Claude Code, remplacement des anciens prompts mobiles | — |

## K. Règles métier conservées des versions précédentes
- Candidater est toujours gratuit ; aucun nom de forfait dans le code (clés de droits).
- Pas de message sans connexion acceptée (sauf candidat et recruteur d'une candidature).
- Pays avec drapeaux (RD Congo d'abord), lieux de travail par pays puis villes.
- Réalisations : sans commentaires, 1 à 3 photos, PDF en carrousel, floutage des informations sensibles.
- Score de matching déterministe et expliqué ; données exclues du matching (règle d'or 4).
- Contact par e-mail uniquement, aucun numéro de téléphone.

## L. Choix faits par défaut (à confirmer)
1. **Orbi au centre de la barre**, plutôt que dans la barre de recherche : l'accompagnement est un pilier,
   il mérite une place fixe.
2. **Recherche et Orbi séparés** : chercher et demander restent deux gestes.
3. **Accueil centré sur une seule prochaine étape**, calculée (profil incomplet, formation à reprendre,
   candidature à compléter, entretien à préparer).
