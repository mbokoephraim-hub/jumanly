# Recruteur web lot 2 · trier, décider, rencontrer (21/10/2026)

Étape 2 de `docs/PLAN-REFONTE-EN-3-ETAPES.md`, brief `docs/refonte-web/BRIEF-WEB-CLAUDE-CODE.md`, planche `docs/refonte-web/recruteur-2` (captures w0 à w6). Ordinateur (≥ 1200 px) et tablette (768 à 1199 px) ; le téléphone (< 768 px) garde le lot mobile au pixel près.

## Ce qui change

- **Candidats** : tête « Candidats » avec la ligne de l'offre et le sélecteur Candidatures / Rechercher des talents ; l'offre et « Trier et filtrer » (fenêtre ancrée) sur une ligne ; une seule ligne d'Orbi (analyse et « Examiner ») ; à partir de 1200 px la liste à gauche (360 px) et le dossier ouvert à côté (`?id=`), avec qui, le score et son « Pourquoi ? », les étapes, le résumé d'Orbi, les documents et les actions (Changer d'étape, Entretien, Écrire, dossier complet). Tablette : la liste en deux colonnes, un clic ouvre le dossier.
- **Dossier** : fil « Candidatures · offre », deux colonnes (Orbi, documents, compétences, pièces, réponses, évaluation / Actions en carte, notes, historique, « Candidature n sur N » avec précédente et suivante). L'analyse d'Orbi s'ouvre en panneau à droite avec « Demander à Orbi ».
- **Décision** : le choix et le résultat à gauche, le message au candidat, le ton, le motif, l'appel, le vivier et l'envoi à droite ; la confirmation en carte de deux colonnes, puis « Ce que X a reçu » et « Vivier mis à jour ».
- **Entretiens** : semaine en grille horaire (lundi à dimanche, créneaux confirmés, en attente et à replanifier en couleur), à droite les demandes en attente, « À évaluer » et la ligne d'Orbi ; « Proposer un entretien » dans la barre ; mois et « À évaluer » en grilles.
- **Proposer un entretien** : le calendrier et les heures du jour sur un même écran, l'aperçu de l'invitation à côté du message.
- **Préparer et évaluer** : deux colonnes, barre d'action dans la page.
- **Rechercher des talents** : les filtres ouverts à gauche (avec « Comparer à l'offre »), la recherche et « Viviers » sur une ligne, les profils en grille de deux colonnes. Tablette : les filtres restent dans leur fenêtre.
- **Mes propositions** : tableau Talent · Offre proposée · Réponse · action, la jauge du mois et la règle « Acceptée / Refusée » au-dessus.
- **Profil d'un talent** : carte avec couverture, nom, puces et les actions (Vivier, Proposer l'offre, menu) ; deux colonnes (Orbi, compétences, projets / chiffres, expérience, formation, note de consultation).
- **Proposer l'offre** : une carte centrée. **Viviers** : tête avec « Créer un vivier », cartes en grille ; un vivier en grille de cartes.

## Écarts assumés

- **Aucun dossier ouvert d'office** : la planche montre la première candidature sélectionnée ; ouvrir un dossier est une consultation enregistrée (règle d'or n° 5), donc le recruteur choisit. Une invite « Choisissez une candidature » tient la place.
- **« Changer d'étape » depuis le dossier ouvert à côté** revient à la liste avec ce dossier ouvert (`retour=liste`), et non au dossier complet.
- **Le fil du dossier** mène à la liste sans `?id=` : sur tablette, une adresse de liste avec un dossier ouvre ce dossier.
- **La ligne ATS d'Orbi** et la ligne « non vues » du téléphone sont fusionnées en une ligne sur ordinateur ; « Examiner » reste.
- **Agenda** : une demande en attente ou à replanifier apparaît à son premier créneau proposé de la semaine (hachures pour « à replanifier »).
- **Calendrier** : sur ordinateur et tablette le premier jour ouvré libre est choisi d'office et « Heures » n'est plus une étape ; une adresse `?etape=heures` revient au jour.
- **« Demander à Orbi »** dans le panneau d'analyse ouvre `/app/orbi?q=` : aucune donnée du candidat n'est envoyée avec la question.
- **Pas de champ de recherche dans Mes propositions** ni de « Proposer l'offre à plusieurs » dans un vivier : ces fonctions n'existent pas sur téléphone ; elles ne sont pas inventées ici.
- **Filtres de la colonne de gauche** : un bouton « Voir les profils » applique les choix (pas de recherche à chaque clic, pour le réseau lent et le quota de recherches).
- **Défauts du téléphone laissés tels quels** (le téléphone ne change pas dans ce lot) : boutons trop fins de la fenêtre d'analyse et champ « Votre avis » écrasé dans l'évaluation. Ils sont corrigés à partir de 768 px seulement.
- **Doublons cachés** : quelques commandes existent deux fois dans la page (une pour le téléphone, une pour l'ordinateur), l'une toujours en `display: none` ; un lecteur d'écran n'en voit qu'une.
