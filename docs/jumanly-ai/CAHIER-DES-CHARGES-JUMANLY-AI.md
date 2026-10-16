# Jumanly AI · cahier des charges d’intégration UX

Texte du propriétaire (Ephraïm Mboko), reçu le 16 octobre 2026, reproduit tel quel. Il fait foi. Le brief
`BRIEF-JUMANLY-AI.md` dit comment l’intégrer au code existant.

---

JUMANLY AI — CAHIER DES CHARGES D’INTÉGRATION UX

Je souhaite intégrer et améliorer un assistant intelligent appelé Jumanly AI dans notre application web Jumanly.

Jumanly AI doit être un assistant professionnel unique, présent dans les différents espaces de la plateforme et capable de proposer des actions adaptées au contexte de navigation de l’utilisateur.

Je ne souhaite pas créer uniquement une page de chatbot indépendante. Je souhaite une assistance intégrée, intuitive et permanente, sans perturber l’utilisation de l’application.

1. Affichage de l’assistant

Sur mobile, créer un bouton flottant Jumanly AI, positionné au-dessus de la navigation inférieure existante.

Lorsqu’on appuie dessus, ouvrir un panneau de conversation coulissant, extensible et refermable.

Sur ordinateur, privilégier un panneau latéral.

Prévoir également des actions contextuelles directement dans les pages de l’application.

Conserver les quatre menus mobiles actuels : Pour moi, Offres, Apprendre et Suivi.

Ne pas ajouter un cinquième onglet permanent pour l’IA.

2. Assistance contextualisée

L’assistant devra adapter ses propositions selon la page consultée.

Dans Pour moi : comprendre les objectifs professionnels, expliquer les recommandations et proposer des prochaines actions.

Dans Offres : analyser les exigences du poste, comparer les éléments pertinents du profil, expliquer les critères, préparer une candidature et proposer l’amélioration du CV.

Dans le CV Builder : corriger, reformuler et améliorer les rubriques, proposer des suggestions et permettre leur application après validation.

Dans Suivi : organiser les démarches, aider à préparer les entretiens, proposer des messages de relance et rappeler les actions pertinentes.

Dans Jumanly Learn : expliquer une leçon, proposer des exemples, répondre aux questions et aider à comprendre les exercices.

Dans Jumanly Hire : assister les recruteurs autorisés dans la rédaction des offres, la synthèse des qualifications, la préparation des entretiens et la gestion des communications.

3. Fonctionnement des suggestions

Lorsque l’utilisateur ouvre Jumanly AI, afficher une courte présentation et trois suggestions pertinentes liées au contexte.

Exemples :

Sur une offre :

* Analyser les exigences.
* Adapter mon CV.
* Préparer mon entretien.

Dans le CV Builder :

* Corriger cette rubrique.
* Améliorer la formulation.
* Adapter cette expérience à une offre.

Dans une formation :

* Expliquer cette notion.
* Donner un exemple.
* M’aider à comprendre mon erreur.

L’utilisateur pourra également rédiger librement sa propre question.

4. Modifications assistées par IA

Lorsque Jumanly AI propose une correction de document, afficher le texte original et le texte suggéré.

Prévoir les actions :

* Appliquer.
* Modifier.
* Ignorer.
* Revenir à la version précédente.

Aucune modification ne devra être automatiquement enregistrée sans validation.

L’assistant ne devra jamais inventer des expériences, diplômes, compétences ou résultats professionnels.

5. Contexte et données

Jumanly AI pourra utiliser, selon les droits et permissions :

* Le profil professionnel.
* Les compétences renseignées.
* La formation consultée.
* L’offre actuellement ouverte.
* Le CV sélectionné.
* Les candidatures appartenant à l’utilisateur.
* Les entretiens réellement programmés.

Il ne doit pas pouvoir accéder librement aux données personnelles d’autres utilisateurs ou organisations.

Les autorisations doivent être vérifiées côté serveur.

6. Conversations

Prévoir un historique des conversations associées à chaque utilisateur.

L’utilisateur doit pouvoir retrouver, renommer et supprimer ses conversations selon les règles de conservation applicables.

Les conversations pourront être liées à un contexte précis : carrière, formation, offre ou document.

Ne pas confondre la messagerie entre candidats et recruteurs avec les conversations de Jumanly AI.

7. Abonnements et quotas

Réutiliser les abonnements déjà présents dans Jumanly.

Le système devra appliquer les limites d’utilisation IA correspondant aux formules Free, Starter, Pro et Premium.

Afficher clairement les limites atteintes et les possibilités d’accès complémentaires, sans interrompre les fonctionnalités gratuites essentielles.

Aucune limite d’IA ne doit empêcher un candidat de consulter une offre ou d’envoyer une candidature gratuite.

8. Sécurité et contrôles

* Les appels IA passent par le serveur.
* Les clés API restent confidentielles.
* Les permissions sont contrôlées.
* Les données personnelles sont minimisées.
* Les modifications de documents exigent une validation.
* Les communications et candidatures ne sont pas envoyées automatiquement.
* Les réponses de l’IA ne doivent pas inventer des événements ou des décisions de recrutement.
* Les outils RH ne doivent pas procéder à des rejets automatiques non supervisés.
* Les consommations et dépenses IA doivent être mesurables.

9. Intégration à l’application existante

Avant de coder, analyse la structure actuelle de Jumanly.

Identifie les composants de navigation, les pages Career, Jobs, Learn, Hire, le système d’authentification, les rôles et le système d’abonnement.

Propose une architecture réutilisable pour Jumanly AI.

Ne construis pas cinq chatbots séparés. Crée un assistant central disposant de plusieurs modes et actions contextualisées.

Ne reconstruis pas l’application et ne modifie pas inutilement les modules existants.

10. Développement par étapes

Étape 1 : composant de conversation, affichage mobile et desktop, suggestions contextuelles.

Étape 2 : intégration aux offres, au suivi et au CV Builder.

Étape 3 : corrections de documents applicables, historique des conversations et suivi des quotas.

Étape 4 : intégration à Jumanly Learn et Jumanly Hire.

Étape 5 : fonctions vocales et personnalisation avancée.

Avant de commencer le développement, présente un diagnostic de l’architecture existante, la liste des composants à créer ou réutiliser, les données nécessaires et les risques de sécurité.

Procède ensuite par modules, avec des tests et sans dégrader les fonctionnalités déjà opérationnelles.

Résultat attendu : Jumanly AI doit être un copilote professionnel qui aide chaque utilisateur à agir directement depuis la page qu’il consulte, sans imposer de passer systématiquement par une interface de chatbot indépendante. Dans ce petit menu là, on pourra trouver un assistant IA, on pourra trouver certaines options et autres. Mais à toi de bien organiser.
