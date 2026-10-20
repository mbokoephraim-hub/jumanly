# Recruteur lot 6 · ATS, retenus, réponses groupées, messagerie, propositions, rejoindre, rapport PDF (20/10/2026)

Étape 2 de `docs/PLAN-REFONTE-EN-3-ETAPES.md`, brief `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md` § 4, point 6 (décisions § 2.16 à 2.21), planches `recruteur-4` (générateur `recruteur4.py`) et `modeles-recruteur` (générateur `modeles4.py`). Dernier lot mobile du recruteur.

## Ce qui change

- **ATS avec Orbi** (`/app/hire/offres/[id]/ats`) : héros « Analyser les N CV avec Orbi » (crédits, durée), choix « Maintenant » ou « À la clôture de l'offre », option « Analyser aussi les nouvelles candidatures », suivi de l'analyse dossier par dossier avec « Arrêter », recommandation d'Orbi (podium, points communs, « À vérifier en entretien », « Pourquoi ? » avec la règle), onglets Recommandés / À vérifier / Tous, cartes avec score, trois barres et compétences à vérifier, sélection (Écrire, Entretien, Retenir). Entrées : carte « À traiter », carte de Candidatures, bouton « Analyser (ATS) » et menu de Mes offres, rappel de fin d'offre.
- **Profil pour cette offre** (`/ats/[applicationId]`) : synthèse d'Orbi, tableau critère par critère (ce que le dossier montre, correspond ou à vérifier), questions à poser, données exclues rappelées, consultation journalisée.
- **Liste des retenus** (`/app/hire/offres/[id]/retenus`) : choisie par le recruteur seul, retrait possible, ligne d'Orbi vers la réponse aux autres.
- **Réponses groupées** (`/app/hire/offres/[id]/reponses`) : groupes Retenus / Non retenus, modèle avec `{prenom}`, `{point_fort}`, `{poste}`, `{entreprise}`, aperçu personne par personne, « J'ai relu » puis confirmation, envoi, « Annuler l'envoi » pendant 10 minutes (messages retirés, décisions annulées, aucun e-mail parti).
- **Modèles d'e-mails** : candidature retenue, non retenue, demande pour rejoindre, fin d'offre (`emails/`, sans numéro de téléphone, contact assistant@jumanly.io).
- **Messagerie enrichie** : « En ligne », « Distribué » / « Lu », badge Retenu, épingler (pour l'équipe), couper les notifications (pour soi), retirer de ma messagerie (côté organisation seulement), signaler, nettoyage proposé par Orbi des conversations terminées des non retenus. Réglages `/app/parametres/messagerie` (présence, accusés de lecture, jours de rappel).
- **Fin d'offre** : rappels J-7, J-3 (par défaut), J-1 et jour de clôture ; carte dans Notifications avec chiffres, Analyser, Statistiques, Prolonger (+7, +14, +30 jours ou une date) et Clôturer ou annuler.
- **Propositions** : « Relancer » dans Mes propositions.
- **Rejoindre une organisation existante** : à l'étape « Votre organisation » de la bienvenue, les organisations au même domaine professionnel ou au même nom ; « Demander à rejoindre » ; l'administrateur accepte (rôle, sièges) ou refuse dans Notifications ; expiration au bout de 7 jours.
- **Rapport PDF** : A4 en deux pages aux couleurs de Jumanly d'après `modeles-recruteur/rapport-recrutement` (L'essentiel, entonnoir, semaines, offres ; sources, délais de réponse, entretiens et décisions, Orbi, lecture d'Orbi), puis le détail des indicateurs du forfait.

## Écarts assumés

- **Fuseau des rappels** : les organisations n'ont pas de fuseau ; le jour se compte dans celui de la plateforme (`DEFAULT_TIME_ZONE`).
- **J-3 seul par défaut** ; chaque membre choisit ses jours. Le rappel va au créateur de l'offre, sinon aux administrateurs.
- **Tâches de fond** (analyses programmées, rappels de fin d'offre, expiration des demandes) : lancées par `/api/jobs/billing` (`runHireJobs`), comme les e-mails des décisions du lot 3 ; le script `pnpm jobs:billing` ne les lance pas.
- **Rejoindre** : l'organisation que la personne a créée reste à elle ; `jumanly.test` (domaine de la démo et des tests) compte comme une boîte gratuite et ne rapproche jamais par le domaine. L'administrateur ne voit que le nom et le domaine de l'adresse.
- **Orbi dans une conversation** : les trois modes du lot 5 (répondre, résumer, plus formel) restent ; « Traduire » et « Relancer » ne sont pas ajoutés.
- **Pas d'indicateur « écrit… »** : il faudrait du temps réel.
- **Pas de réordonnancement à la main** des retenus.
- **Retenus** : le message apparaît tout de suite dans la messagerie du talent et peut être retiré pendant 10 minutes ; l'e-mail part après ces 10 minutes.
- **« Annuler le recrutement »** clôt l'offre puis ouvre la réponse aux non retenus ; les retenus sont informés par leur groupe.
- **« Relancer »** : une seule fois par proposition, à tout moment avant son expiration.
- **Présence et accusés de lecture réciproques** : qui cache les siens ne voit pas ceux des autres.
- **Rapport PDF** : les sections dessinées (vue d'ensemble, entonnoir, sources, par offre) et l'activité par recruteur (noms des membres) quittent la liste de détail, pour tenir la promesse « aucune donnée personnelle ». Le nombre de « réponses envoyées aux non retenus » compte les décisions « non retenue » de la période. La lecture d'Orbi est un texte fixe tiré des chiffres (semaine la plus active, source principale, réponses lentes), sans appel au modèle.
- **Crédits d'Orbi par organisation** : `AiUsage` n'a pas d'organisation ; les CV analysés se comptent par les événements `orbi_analysis`, les messages rédigés par l'usage `message_draft` des membres.
