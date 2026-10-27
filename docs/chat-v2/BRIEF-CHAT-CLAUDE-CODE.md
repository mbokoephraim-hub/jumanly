# Brief · Chat (talent)

Validé par Ephraïm le 27/10/2026. Remplace les écrans Messages du Modèle B (`docs/modele-b/maquette/Messages*.dc.html`), onglet renommé **Chat** dans le menu en pilule (`docs/fil-menu-publication/`). Mobile d'abord (390 px), même identité que le profil et Carrière (`docs/profil-personne/`, `docs/carriere-v3/`).

Maquette : `maquette/Chat.dc.html` (réglages `ecran` liste · conv · video, `feuille`) et les planches qui l'utilisent. Captures : `captures/01` à `13`.

## Liste · 01, 02

- Titre « Chat », Rechercher, Nouveau message (Lime).
- **En ligne maintenant** : rangée d'avatars 58 px, anneau aux couleurs de compétences, point menthe ; toucher = ouvrir la discussion.
- **Carte Orbi** « N messages non lus · Orbi résume » → résumé en une phrase par discussion (règle d'or 12 : consentement, droit, quota, `AiUsage`).
- Segment **Tout · Connexions · Recruteurs · Entreprises**, pilule Lime glissante, compteurs de non-lus.
- Demandes de connexion (avatars superposés + nombre).
- Ligne de discussion : avatar + point en ligne, nom + badge vérifié, **étiquette de rôle colorée**, aperçu (gras si non lu), heure, badge Lime du nombre de non-lus ou coche « lu » ; **« écrit… »** animé en temps réel.
- Rappel : on n'écrit qu'à ses connexions et aux recruteurs de ses candidatures.

## Discussion · 03 à 09

- En-tête flouté : retour, avatar, nom vérifié, « En ligne · organisation » ou « écrit… », **appel vidéo**, **···**.
- **Contexte épinglé** quand la discussion vient d'une candidature : offre, étape, score, « Voir ».
- Bulles : reçues `#13282C`, envoyées **Lime, texte Sapin**, heure + double coche « lu », séparateurs de jour. Nouvelle bulle qui monte en douceur ; le fil reste collé en bas.
- **Carte Entretien** (date, lieu, durée) : « Ajouter à l'agenda » → « ✓ Dans l'agenda » + rappels, « S'entraîner » (simulation Orbi).
- **Réponses suggérées par Orbi** au-dessus de la saisie : un toucher envoie ; l'interlocuteur apparaît « écrit… » quand il tape (temps réel).
- **Toucher un message** → barre de réactions (6) ; la réaction s'affiche sous la bulle.
- Saisie : « + » (feuille **Joindre** : Photo, Appareil, Document, Mon CV, Attestation, Rendez-vous), champ, bouton Orbi (feuille **Orbi rédige** : tons Proposer · Plus professionnel · Plus court · En anglais, Envoyer, Autre version ; rien ne part sans action de la personne), micro → **note vocale** (onde, durée, envoyer).

## Menu ··· · 10

Fiche de la personne, puis : Voir le profil, Voir la candidature, Rechercher dans la discussion, Médias liens et documents, Notifications (interrupteur), Épingler, **Signaler** et **Bloquer** en corail (confirmation à l'étape suivante).

## Appel vidéo · 11 à 13

1. Icône vidéo → fenêtre **« Souhaitez-vous appeler {nom} en vidéo ? »**, Non / « Oui, appeler ».
2. Oui → plein écran : avatar avec onde Lime, « Appel en cours… », « Chiffré de bout en bout », sa propre vignette.
3. Décroché → minuteur menthe ; boutons Micro, Caméra, Haut-parleur (état coupé = rond crème) et Raccrocher (corail) → retour à la discussion avec « Appel terminé · durée ».
Appel possible seulement entre connexions ou avec le recruteur d'une candidature ; aucun enregistrement. Fournisseur vidéo derrière une interface avec implémentation `fake` (choix technique à noter dans `docs/decisions/`).

## Définition de fini

Conforme aux captures ; textes dans `textes/textes-application.md` ; temps réel (messages, « écrit… », en ligne) ; WCAG 2.2 AA, cibles 44 px ; `prefers-reduced-motion` ; e2e : ouvrir une discussion, envoyer une réponse suggérée, réagir, lancer et raccrocher un appel ; lint, types, tests, build ; `docs/journal.md`.
