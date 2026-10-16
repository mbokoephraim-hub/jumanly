# JUMANLY — CAHIER DES CHARGES UX MOBILE

Module 1 : Expérience utilisateur Talent

Projet : Jumanly — The Growth Lab
Périmètre : Interface mobile de l’espace Talent
Nature : Spécifications fonctionnelles destinées à Claude Code
Priorité : Haute

Texte du propriétaire, 16 octobre 2026, recopié tel quel. Les décisions d’intégration, les maquettes et
les liens avec les autres briefs sont dans `BRIEF-MOBILE-TALENT.md`.

---

## 1. OBJECTIF DE LA MISSION

Je souhaite réorganiser entièrement l’expérience utilisateur mobile de Jumanly pour la rendre plus pratique, personnalisée et orientée vers les besoins réels des utilisateurs.

Jumanly est une application web qui combine recherche d’emploi, formation professionnelle, développement de carrière, préparation des candidatures et recrutement.

L’application dispose déjà d’une architecture générale.

Tu ne dois pas reconstruire l’application ni modifier inutilement les fonctionnalités existantes.

Je souhaite uniquement repenser et améliorer l’organisation, la navigation, la hiérarchie des informations et les interactions sur smartphone.

La priorité est de permettre aux utilisateurs d’accéder immédiatement aux informations et fonctionnalités qui les intéressent.

Je ne veux pas qu’un utilisateur ouvre Jumanly et tombe directement sur un dashboard composé de statistiques, de graphiques ou de chiffres.

Je veux qu’il retrouve immédiatement les opportunités, les formations ou les actions professionnelles correspondant à sa raison d’utiliser Jumanly.

Le dashboard personnel restera accessible dans un espace secondaire.

## 2. PRINCIPES UX À RESPECTER

L’expérience mobile devra respecter les principes suivants :

1. L’information utile apparaît en premier.
2. Les opportunités professionnelles sont prioritaires pour les chercheurs d’emploi.
3. Les formations apparaissent rapidement après les opportunités.
4. La navigation principale comporte uniquement quatre destinations.
5. Les fonctionnalités secondaires sont accessibles dans un menu supérieur.
6. Les utilisateurs peuvent accéder aux informations importantes avec un minimum d’actions.
7. Les pages évitent les éléments inutiles.
8. Les formulaires sont courts et adaptés au mobile.
9. Les actions principales sont facilement identifiables.
10. L’interface s’adapte à l’objectif de chaque utilisateur.
11. Les activités interrompues sont récupérables.
12. Les informations affichées sont réelles, actualisées et correctement identifiées.

Le design devra rester cohérent avec l’identité visuelle actuelle de Jumanly.

Ne modifie pas les couleurs, typographies ou éléments de marque sans nécessité.

## 3. NAVIGATION PRINCIPALE

Je souhaite une barre de navigation fixe en bas de l’écran.

Elle doit comprendre quatre menus :

### 3.1. Pour moi

Icône : Accueil.

Il s’agit de la page d’ouverture personnalisée.

Elle affiche les opportunités, formations et recommandations correspondant aux objectifs de l’utilisateur.

### 3.2. Offres

Icône : Briefcase.

Cet espace permet de consulter les opportunités, rechercher un emploi, enregistrer une offre et candidater.

### 3.3. Apprendre

Icône : Graduation Cap.

Cet espace donne accès à Jumanly Learn, aux formations et aux parcours pédagogiques.

### 3.4. Suivi

Icône : Clipboard List.

Cet espace centralise les candidatures, entretiens, messages professionnels et actions en cours.

### Règles de la barre inférieure

* La barre doit rester visible sur les principaux écrans de navigation.
* Chaque option comporte une icône et un libellé.
* L’option active doit être clairement identifiable.
* Les zones tactiles doivent être suffisamment grandes.
* La navigation doit respecter les zones de sécurité des smartphones.
* La barre ne doit pas masquer les contenus ou boutons.
* Les pages de lecture vidéo, certains formulaires et les expériences immersives pourront masquer temporairement cette barre si nécessaire.
* Les destinations conservent leur état de navigation lorsque cela améliore l’expérience.
* Le bouton Retour doit fonctionner de manière prévisible.

Ne pas ajouter Dashboard, Profil, Paramètres ou Abonnement à la barre inférieure.

## 4. BARRE SUPÉRIEURE

Créer une barre supérieure simple.

Elle comprendra :

A. Jumanly — Identification de l’application ou titre de la section.

B. Recherche — Accès à une recherche globale ou à une recherche contextualisée.

C. Notifications — Messages, invitations aux entretiens, changements de candidature, alertes d’opportunités et informations utiles.

D. Menu secondaire — Icône trois points ou menu de compte. Ce menu donnera accès aux fonctionnalités personnelles et administratives de l’utilisateur.

La barre supérieure devra rester compacte afin de réserver la majorité de l’écran aux contenus.

## 5. PREMIÈRE CONNEXION ET PERSONNALISATION

Lors de la première utilisation, demander à l’utilisateur son objectif principal.

Proposer trois options :

1. Trouver un emploi ou un stage.
2. Développer mes compétences.
3. Faire évoluer ma carrière.

Permettre ensuite de renseigner progressivement :

* Domaine professionnel.
* Métiers recherchés.
* Localisation souhaitée.
* Niveau d’expérience.
* Préférences professionnelles.

Ne pas obliger l’utilisateur à remplir intégralement son profil pour consulter les opportunités et les formations gratuites.

Les informations manquantes pourront être demandées lorsque leur utilité devient évidente.

Prévoir la modification de l’objectif principal dans les préférences.

L’accueil s’adaptera à cet objectif, mais les quatre menus principaux resteront identiques.

## 6. PAGE « POUR MOI » — ACCUEIL PERSONNALISÉ

C’est la première page affichée après connexion pour un utilisateur Talent.

Elle ne doit pas ressembler à un tableau de bord administratif.

Elle doit fonctionner comme un flux de contenus et d’actions personnalisés.

### 6.1. Utilisateur recherchant un emploi

Organiser les éléments dans cet ordre :

**Section 1 — Opportunités pour vous**

Afficher directement les premières opportunités disponibles correspondant aux préférences connues.

Chaque carte doit présenter :

* Intitulé du poste.
* Nom de l’entreprise.
* Localisation.
* Type de contrat.
* Date de publication ou délai de candidature.
* Action pour consulter l’offre.
* Icône pour enregistrer l’offre.

Prévoir un bouton « Voir toutes les offres ».

Ne pas surcharger les cartes avec des descriptions longues.

Si l’utilisateur a déjà candidaté, afficher un indicateur pertinent.

**Section 2 — Formations recommandées**

Afficher des formations utiles pour renforcer sa compétitivité.

Chaque carte présente :

* Titre.
* Domaine.
* Niveau.
* Durée indicative.
* Type d’accès.
* Action « Découvrir » ou « Reprendre ».

Prévoir « Explorer les formations ».

**Section 3 — Préparez votre candidature**

Proposer des raccourcis contextuels :

* Créer ou améliorer mon CV.
* Optimiser mon profil.
* Préparer un entretien.
* Consulter les documents professionnels.

Les actions devront être liées aux fonctionnalités déjà disponibles dans Jumanly Career.

**Section 4 — Mes prochaines actions**

Afficher seulement les actions nécessitant une intervention :

* Compléter une candidature commencée.
* Répondre à un recruteur.
* Confirmer un entretien.
* Terminer une formation.
* Mettre à jour une information importante.

Cette section ne doit pas reprendre inutilement toutes les statistiques.

### 6.2. Utilisateur venu pour se former

Organiser son accueil dans cet ordre :

1. Reprendre ma formation.
2. Parcours et formations recommandés.
3. Prochain exercice ou évaluation.
4. Opportunités professionnelles liées aux compétences visées.
5. Progression et certificats.

### 6.3. Utilisateur souhaitant évoluer professionnellement

Organiser son accueil dans cet ordre :

1. Opportunités correspondant à son objectif d’évolution.
2. Outils de positionnement professionnel.
3. Formations de développement et de spécialisation.
4. Recommandations de compétences.
5. Activités et prochaines étapes.

### 6.4. Règles de personnalisation

Ne pas inventer de correspondances ou de scores.

Utiliser les préférences, informations professionnelles et activités réellement disponibles.

Lorsque les données sont insuffisantes, afficher des offres récentes et vérifiées, des catégories populaires ou des formations générales.

Indiquer clairement lorsqu’une recommandation n’est pas personnalisée.

Ne pas afficher les mêmes offres en boucle.

Éviter les contenus expirés ou les opportunités clôturées.

## 7. MENU « OFFRES »

Créer une expérience entièrement consacrée à la recherche d’opportunités.

### 7.1. Page principale

Afficher :

* Barre de recherche.
* Filtres accessibles.
* Offres recommandées.
* Offres récentes.
* Offres enregistrées.
* Historique de recherche si disponible.

Les filtres doivent permettre de sélectionner :

* Métier.
* Domaine.
* Localisation.
* Type de contrat.
* Expérience.
* Mode de travail.
* Date de publication.

Les filtres avancés pourront être regroupés dans un panneau secondaire.

### 7.2. Cartes d’offres

Chaque carte présente les informations essentielles, sans surcharge.

Prévoir :

* Ouvrir l’offre.
* Enregistrer.
* Identifier une candidature déjà soumise.

### 7.3. Détail d’une offre

Afficher :

* Intitulé.
* Entreprise.
* Lieu.
* Type de contrat.
* Description du poste.
* Responsabilités.
* Qualifications.
* Compétences demandées.
* Date limite.
* Conditions de candidature.

Actions principales :

Postuler et Enregistrer.

Si le CV de l’utilisateur est disponible, proposer une action secondaire « Adapter mon CV à cette offre ».

### 7.4. Candidature mobile

Le dépôt d’une candidature doit être simple.

Prévoir un parcours progressif :

1. Sélection du CV.
2. Ajout éventuel d’une lettre.
3. Questions du recruteur.
4. Vérification.
5. Envoi.
6. Confirmation.

L’utilisateur doit pouvoir revenir en arrière sans perdre ses informations déjà enregistrées.

Les informations existantes du profil devront être réutilisées.

Distinguer clairement les candidatures effectuées dans Jumanly et celles redirigées vers un site externe.

Ne jamais déclarer une candidature envoyée sans confirmation de l’opération correspondante.

## 8. MENU « APPRENDRE »

La page Apprendre doit présenter directement les contenus pédagogiques.

L’ordre recommandé :

1. Formation en cours.
2. Bouton Reprendre.
3. Formations recommandées.
4. Domaines de formation.
5. Explorer le catalogue.
6. Accès aux exercices et certificats.

Ne pas afficher un dashboard statistique comme premier élément.

### 8.1. Catalogue mobile

Prévoir :

* Recherche.
* Catégories.
* Filtres simples.
* Cartes de formation.
* Niveau.
* Durée.
* Conditions d’accès.

### 8.2. Fiche formation

Afficher les objectifs, modules, durée, prérequis, activités, évaluations et conditions de certification.

L’action principale sera « Commencer » ou « Reprendre ».

### 8.3. Learning Room

Adapter la salle de formation aux petits écrans.

Priorités :

* Lecteur vidéo.
* Titre de la leçon.
* Progression.
* Action suivante.
* Modules.
* Résumé.
* Transcription.
* Ressources.
* Notes.
* Exercice.

Éviter de présenter tous ces éléments simultanément.

Utiliser des onglets ou sections repliables.

La reprise de progression doit fonctionner après interruption.

## 9. MENU « SUIVI »

Cet espace doit permettre à l’utilisateur de retrouver ses démarches professionnelles.

Organiser les informations par utilité :

**Mes candidatures** — Afficher les candidatures en cours, leur statut communiqué et leur historique.

**Mes entretiens** — Afficher les rendez-vous programmés, les informations nécessaires et les actions de confirmation.

**Mes messages** — Afficher les conversations liées aux recrutements et les demandes nécessitant une réponse.

**Mes activités** — Permettre de reprendre certaines actions non terminées.

La priorité sera toujours donnée aux activités les plus récentes ou urgentes, et non aux statistiques générales.

Prévoir des états vides accompagnés d’actions pertinentes, par exemple « Explorer les offres » lorsqu’aucune candidature n’existe.

## 10. MENU SECONDAIRE — MON ESPACE

En appuyant sur l’icône supérieure, l’utilisateur doit accéder à :

**Profil professionnel**

* Consulter mon profil.
* Modifier mes informations.
* Gérer mes compétences.
* Gérer mon portfolio.
* Contrôler ma visibilité auprès des recruteurs.

**Outils carrière**

* CV Builder.
* Mes CV.
* Lettres et documents.
* Optimisation LinkedIn.
* Coach carrière.
* Simulations d’entretien.

**Acquis**

* Certificats.
* Attestations.
* Réalisations.
* Compétences évaluées.

**Mon compte**

* Abonnement.
* Facturation.
* Paiements.
* Paramètres.
* Notifications.
* Confidentialité.
* Assistance.
* Déconnexion.

Le menu devra permettre d’atteindre rapidement les fonctions secondaires sans présenter une longue liste désorganisée.

Ne pas enfermer les outils Career exclusivement dans ce menu : lorsqu’une fonctionnalité est pertinente dans une offre ou une candidature, proposer aussi un accès direct depuis cette page.

## 11. RECHERCHE ET NOTIFICATIONS

**Recherche**

Créer une recherche permettant de retrouver rapidement les offres et les formations.

Les résultats devront être clairement regroupés par catégorie.

Prévoir des recherches récentes lorsque l’utilisateur a autorisé leur conservation.

**Notifications**

Prioriser :

* Message reçu d’un recruteur.
* Invitation ou modification d’entretien.
* Mise à jour communiquée d’une candidature.
* Offre pertinente.
* Activité de formation à reprendre.

Les notifications commerciales ou promotionnelles ne doivent pas masquer les événements importants.

Prévoir les préférences de notification.

## 12. EXPÉRIENCE MOBILE ET CONNECTIVITÉ

L’application doit être adaptée aux smartphones et aux connexions limitées.

Prévoir :

* Navigation rapide.
* Images optimisées.
* Chargement progressif.
* Pages courtes.
* Formulaires adaptés.
* Sauvegarde des brouillons.
* Reprise des activités.
* Messages de chargement.
* Gestion des erreurs réseau.
* Retour arrière cohérent.
* Boutons faciles à utiliser.
* Absence de défilement horizontal involontaire.

Les actions sensibles doivent être confirmées par le serveur.

Ne pas afficher une opération comme réussie si elle n’a pas été enregistrée.

Prévoir une évolution progressive vers une expérience PWA si l’architecture existante le permet.

## 13. ACCESSIBILITÉ

Respecter les bonnes pratiques d’accessibilité numérique.

Prévoir :

* Textes lisibles.
* Navigation claire.
* Contrastes suffisants.
* Zones tactiles confortables.
* Libellés associés aux icônes.
* Messages d’erreur compréhensibles.
* Navigation compatible avec les technologies d’assistance.
* Sous-titres et transcriptions pour les formations concernées.
* Prise en compte de la taille du texte définie par l’utilisateur.

## 14. ANALYTICS ET MESURE UX

Prévoir des événements permettant de mesurer :

* Ouverture de l’accueil.
* Consultation d’une offre.
* Utilisation des filtres.
* Enregistrement d’une offre.
* Début et confirmation de candidature.
* Ouverture d’une formation.
* Reprise d’une leçon.
* Accès au CV.
* Consultation du suivi.
* Utilisation des notifications.

Les données permettront d’analyser les parcours, les abandons et les fonctionnalités les plus utilisées.

Ne pas enregistrer dans les outils analytiques le contenu privé des CV, messages ou documents.

## 15. CRITÈRES DE VALIDATION

Je considère cette amélioration réussie si :

1. L’utilisateur Talent n’arrive plus directement sur un dashboard statistique.
2. L’accueil présente en priorité les contenus correspondant à son objectif.
3. Les quatre menus inférieurs fonctionnent.
4. Les offres sont immédiatement accessibles.
5. Les formations se trouvent dans les premières sections pertinentes.
6. Le menu secondaire donne accès aux outils Career.
7. Le candidat peut retrouver facilement ses démarches.
8. Le parcours de candidature fonctionne sur smartphone.
9. Les activités peuvent être reprises.
10. Les rôles, abonnements et permissions existants restent opérationnels.
11. Les pages mobiles n’introduisent pas de régression dans la version ordinateur.
12. Les informations affichées correspondent à des données réelles ou à des états vides correctement gérés.

## 16. CONSIGNES DE DÉVELOPPEMENT POUR CLAUDE

Avant de modifier le code :

* Examine les routes et pages mobiles existantes.
* Analyse les composants de navigation.
* Vérifie les rôles et les permissions.
* Identifie les services utilisés pour les offres, formations et candidatures.
* Repère les composants réutilisables.
* Établis la liste des fichiers concernés.
* Propose un plan de modification.

Ne supprime pas les routes existantes sans prévoir leur compatibilité.

Ne recrée pas les modules Learn, Jobs ou Career lorsqu’ils existent déjà.

Réutilise les données et services opérationnels.

Procède progressivement :

* Phase 1 : navigation inférieure et menu secondaire.
* Phase 2 : accueil intelligent selon l’objectif.
* Phase 3 : amélioration des parcours Offres, Apprendre et Suivi.
* Phase 4 : personnalisation avancée, notifications et optimisations.

Teste chaque phase sur différentes tailles de smartphone et sur ordinateur.

Ta première réponse doit présenter ton diagnostic du code existant et le plan d’intégration UX. N’écris pas immédiatement tout le nouveau code.

## RÉSULTAT ATTENDU

Je veux que l’expérience mobile de Jumanly soit orientée vers la recherche d’opportunités, le développement professionnel et les actions utiles.

L’utilisateur doit découvrir rapidement ce qui l’intéresse, accéder à ses fonctions essentielles et poursuivre ses activités sans difficulté.

La priorité n’est pas de créer un nouveau design graphique, mais de rendre la navigation et l’utilisation de Jumanly plus naturelles, rapides et efficaces.
