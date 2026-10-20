# Recruteur lot 4 · entretiens, talents et viviers (20/10/2026)

Étape 2 de `docs/PLAN-REFONTE-EN-3-ETAPES.md`, brief `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md` § 4, point 4, planches r2plus ENT, AGENDA, PREP_R, EVAL, TAL, TPROF, CONTACT et VIVIERS (`r2plus.py` l'emporte en cas d'écart).

## Ce qui change

- **Proposer un entretien** (`/app/hire/candidats/[id]/entretien`) : format (visio, sur site, audio), durée, participants de l'équipe (droit `hire.collaboration`), calendrier du mois avec la charge de chaque jour, journée en demi-heures avec les entretiens déjà prévus, suggestion d'Orbi pour le créneau libre suivant, 3 créneaux au plus, puis aperçu de l'invitation telle que le talent la verra, message préparé et relu (tons), envoi. Le même écran sert à proposer d'autres créneaux (`?entretien=`).
- **Agenda** (`/app/hire/entretiens`) : Semaine, Mois et « À évaluer · N », filtre Les miens / L'équipe, groupe « En attente de réponse », cartes par jour, ligne d'Orbi vers la préparation du prochain entretien confirmé, « + » qui ouvre la liste des candidatures en cours. L'ancienne adresse `?candidature=X` mène au planificateur.
- **Préparation** (`/app/hire/entretiens/[id]`) : date, participants, état (créneaux envoyés, autres dates proposées par le talent avec « Accepter »), « Ce qu'il faut vérifier » et questions d'Orbi tirées des compétences de l'offre et de leurs preuves (calcul fixe, `proposedQuestions`), questions de l'équipe (ajoutées et retirées par leur auteur, refusées si elles touchent à la vie privée), partage du lien, suivi (reprogrammer, terminé, absent, annuler avec un message). Chaque ouverture est journalisée comme une consultation du dossier.
- **Évaluation** (`/app/hire/candidats/[id]/evaluation`) : critères de la grille de l'offre notés de 1 à 4 (sinon « Impression générale »), avis, suite proposée (Poursuivre, Hésitation, Ne pas poursuivre), brouillon sur l'appareil, évaluations de l'équipe montrées seulement après l'envoi de la sienne. La suite proposée ne déplace jamais le candidat. Le dossier résume l'évaluation et y mène.
- **Rechercher des talents** (`/app/hire/candidats?vue=talents`) : recherche libre, filtres compétences, lieu, à distance, expérience (trois niveaux), disponibilité ; comparaison avec une offre (score déterministe de la partie 08) ; cartes chargées par pages. Aucun filtre sur une donnée exclue du matching. « Mes propositions » (`?vue=propositions`) avec leur état et le quota du mois. L'ancienne adresse `/app/hire/talents` redirige.
- **Profil d'un talent** (`/app/hire/talents/[id]`) : identité selon la visibilité choisie par le talent (anonyme : ni nom, ni employeurs, ni projets), « Consultation enregistrée », chiffres, points d'Orbi ✓ / ! comparés à l'offre, détail du score, compétences, expérience, formation et attestations Jumanly. Barre du bas : Vivier, puis Proposer l'offre, Écrire (proposition acceptée), Voir sa candidature ou Proposition envoyée.
- **Proposer l'offre** (`/app/hire/talents/[id]/proposer`) : offre choisie, message personnalisé à relire (tons), « Joindre l'annonce », quota, envoi. Le talent décide seul ; ses coordonnées ne sont partagées que s'il accepte.
- **Viviers** (`/app/hire/viviers`, `/app/hire/viviers/[id]`) : cartes avec la pile d'initiales et le nombre de disponibles, suggestion d'Orbi (talents d'un vivier qui correspondent à une offre), création (visibilité partagée avec `org.talent_pools.shared`), détail avec l'origine de chaque talent, note, retrait, renommer et supprimer. « Ajouter à un vivier » depuis le profil d'un talent et depuis le dossier d'un candidat.
- **Message d'acceptation** : « Proposer un appel d'arrivée » (droit `connect.appointments`) ajoute au message un appel audio de 30 minutes avec 1 à 3 créneaux ; annuler la décision annule l'appel.

## Écarts assumés

- **Occupation de l'équipe** : seuls les entretiens déjà prévus dans Jumanly comptent ; aucun agenda externe n'est lu.
- **Notes de 1 à 4** (la grille de l'ancien design allait jusqu'à 5) ; « Hésitation » correspond à la recommandation `maybe` ajoutée par la migration `20261020200000_recruteur_lot_4_entretiens_questions_hesitation`. Une note 5 déjà enregistrée avec l'ancienne grille reste en base telle quelle (le seed n'en crée pas) ; une nouvelle note 5 est refusée.
- **Évaluation par candidature**, pas par entretien : une seule évaluation par membre et par candidature, comme l'ancienne grille.
- **Brouillon d'évaluation** dans le navigateur (`localStorage`), effacé à l'envoi ; il ne passe pas d'un appareil à l'autre.
- **Pas de rappel la veille** ni de lien de visio obligatoire : le lien peut être ajouté plus tard.
- **Appel d'arrivée** : créneaux saisis en `datetime-local` dans le fuseau du serveur (`DEFAULT_TIME_ZONE`), affiché sous les champs.
- **Recherche** : sans `offre`, la comparaison prend l'offre publiée la plus récente (`offre=aucune` pour ne pas comparer). Chaque recherche distincte du mois compte une fois dans `hire.talent_search.monthly` : ouvrir « Découvrir » en compte donc une.
- **« Relancer »** dans Mes propositions n'est pas construit (une proposition expire, le talent n'est pas relancé). Le bouton du filtre dit « Voir les profils » sans compter les profils à l'avance.
- **Proposer l'offre** relit le profil, ce qui journalise une seconde consultation.
- **Projets** masqués pour un profil anonyme ; en vue limitée, le contexte des projets est masqué.
- **Partager la préparation** copie seulement le lien (les membres qui ont accès à l'offre l'ouvrent).
- **Navigation** : les liens du cadre vers `/app/hire/talents` restent et redirigent.
- **Anciennes clés de texte** `hire.talents.*`, `hire.interviews.*`, `hire.pools.*` gardées dans `textes/` pour ne pas toucher aux autres écrans qui en partagent ; à nettoyer à la fin de l'étape 2.
- **Messages, notifications, organisation, équipe, abonnement, rapports** : lot 5, liens conservés.
- **Correction transversale** : une feuille (`Sheet`) se ferme quand on touche un de ses liens. Sinon, l'écran gardé derrière le suivant laissait la feuille modale et rendait le nouvel écran inerte (trouvé par le parcours « + » de l'agenda vers le planificateur).
