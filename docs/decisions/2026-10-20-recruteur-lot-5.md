# Recruteur lot 5 · échanger et gérer (20/10/2026)

Étape 2 de `docs/PLAN-REFONTE-EN-3-ETAPES.md`, brief `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md` § 4, point 5, planches recruteur-3 (`docs/refonte-mobile/recruteur-3/`) et leur version 2 (`r3plus.py`, qui l'emporte en cas d'écart).

## Ce qui change

- **Orbi recruteur** (`/app/orbi`, `/app/orbi/historique`) : la même page de conversation que le talent, avec la persona de l'organisation. Le modèle reçoit les offres de l'organisation et leurs chiffres, jamais un nom ni une coordonnée de candidat. Il ne propose que des pages de l'espace recruteur (`recruiterOrbiActions`). Crédits de l'organisation (`ai.credits.monthly`), consentement du membre. L'historique est rangé par espace (`OrbiConversation.organizationId`, migration `20261020210000_recruteur_lot_5_orbi_organisation`) : il ne se mélange ni avec l'espace talent de la personne ni avec une autre organisation.
- **Messages** (`/app/messages`) : recherche, filtres Toutes, Non lues, Retenus, Propositions, Non retenus, badge d'étape, ligne d'Orbi sur les réponses attendues. Filtré par `organizationId`. Un membre « lecteur » ne voit aucune conversation.
- **Conversation** (`/app/messages/[id]`) : en-tête avec le badge, carte de contexte (offre, étape, score si le droit `hire.matching.level` le permet), cartes d'invitation (elles mènent à la préparation de l'entretien) et de document demandé, chips d'Orbi « Proposer une réponse », « Résumer », « Plus formel ». **Le brouillon ne part jamais seul** : il s'affiche dans une carte, « Utiliser » le met dans le champ, le recruteur relit et envoie. « + » : proposer des créneaux (planificateur du lot 4), demander un document, modèles. Menu ⋯ : dossier, décision, modèles, Orbi.
- **Brouillons d'Orbi** (`message-drafts.ts`) : la conversation est passée comme donnée entre des marqueurs que le candidat ne peut pas fermer ; un brouillon qui décide (retenu, rejeté…), donne un contact, un lien, une somme ou un salaire, parle de consignes, ou touche une donnée exclue est écarté au profit du texte écrit sans le modèle. Le prénom n'est jamais envoyé au modèle (il remet `{prenom}`). Sans consentement, sans crédit ou en panne, le brouillon vient du modèle de texte et la carte le dit.
- **Modèles** (`/app/hire/modeles`) : vos modèles (modifier, supprimer dans une feuille), textes de Jumanly pour les types sans modèle, création. L'ancien écran « Message » du dossier (`/app/hire/candidats/[id]/message`) mène à la conversation, feuille des modèles ouverte (`?modeles=1`).
- **Notifications** : la liste commune, plus « Votre journée en bref » (nouvelles candidatures, réponses aux invitations, évaluations, messages non lus) calculée à l'ouverture.
- **Profil RH** : aperçu « Ce que voient les candidats ».
- **Organisation** (`/app/organisation`) : carte avec bannière et logo, 4 chiffres réels, présentation, ligne d'Orbi (bannière, présentation ou vérification qui manque), Équipe, Vérification, Structure, « Voir la page comme un talent ». Modifier : `/app/organisation/modifier`. Vérification : `/app/organisation/verification` (anneau en 3 étapes). Équipe : `/app/organisation/equipe` (sièges, membres et rôles, invitations, tableau des droits tiré de `hirePermissions`, activité récente tirée des événements des candidatures, invitation dans une feuille). Les anciens onglets `?onglet=` redirigent.
- **Abonnement** (`/app/abonnement` dans l'espace recruteur) : carte de la formule avec les jours restants, quotas réels (sièges, offres, crédits, analyses, grilles), échéances (payée, rappel 7 jours avant, fin → formule gratuite), changer, prolonger, moyen de paiement, factures. **Formules RH** : PlanPicker de la famille de l'organisation et tableau comparatif par clés de droits. **Paiement** : `payer` généralisé à la famille de la formule (`billingSubject`) ; seul le propriétaire de l'organisation active paie. **Factures** au nom de l'organisation, avec ses coordonnées de facturation.
- **Rapports** (`/app/hire/rapports`) : 30 jours, Trimestre, Par offre ; 4 chiffres, entonnoir, candidatures par semaine (4 dernières semaines), sources, ligne d'Orbi calculée sans modèle, export PDF.
- **Paramètres** (`/app/parametres` dans l'espace recruteur) : notifications, apparence, Orbi, sécurité (validation en deux étapes, journal des consultations, confidentialité), données. Les pages de détail sont celles du talent (même compte). **Journal des consultations** (`/app/parametres/consultations`) : les profils ouverts dans l'organisation (90 jours, 100 lignes), de toute l'équipe pour un administrateur, les siens pour les autres.
- `/app/hire/bienvenue` mène aux premiers pas (`/app/bienvenue`, lot 1).

## Écarts assumés

- **Export CSV des rapports retiré** (décision d'Ephraïm : export toujours en PDF). L'adresse `?format=csv` rend le PDF.
- **Messagerie** : pas de présence « En ligne », ni d'accusés « Distribué » / « Lu », ni de « écrit… », ni de chips « Traduire » et « Rappel », ni de rangement des conversations terminées. Ils demandent un temps réel et des réglages de chaque côté qui ne sont pas encore là.
- **« Langues d'échange »** et « répond en 3 jours » du profil RH : non construits, aucun écran ne les montrerait aux candidats.
- **Résumé du matin** : remplacé par « Votre journée en bref », calculé à l'ouverture sans modèle ; pas d'envoi à 8:00. Le réglage « Résumé du matin » n'existe donc pas.
- **Paramètres** : pas de fuseau horaire ni de signature des messages (rien ne les utilise encore) ; la validation en deux étapes s'active dans Sécurité, pas d'interrupteur sur la page. La suppression du compte reste dans l'espace talent.
- **Invitation quand l'équipe est pleine** : pas d'invitation en attente d'un siège ; la feuille dit qu'il n'y a plus de siège libre et mène à la formule supérieure (choisie par `org.seats`).
- **Structure** (équipes, départements, entités) : les anciens composants sous `/app/organisation/structure`, jusqu'à l'étape 3 (administration d'entreprise, web seulement).
- **Partenaires** : leurs écrans d'abonnement, de notifications et de paramètres restent ceux d'avant (étape 3).
- **Fiche entretien depuis la conversation** : « Proposer des créneaux » ouvre le planificateur du lot 4 au lieu d'une feuille dans la conversation.

## Fichiers supprimés

- `src/components/connect/hire-messages.tsx`, `hire-thread.tsx`, `contact-requests.tsx`, `interview-card.tsx`, `report-form.tsx` (ancienne messagerie Hire) ; `conversation-list.tsx` réduit à `conversation-labels.ts` (le seul export encore servi, à la recherche).
- `VerificationTab` de `src/components/org/structure-tabs.tsx` ; l'action `sendTemplateMessageAction` et l'ancien écran « Message » du dossier (remplacé par une redirection).
