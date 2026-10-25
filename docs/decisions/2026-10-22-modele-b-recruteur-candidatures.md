# Modèle B recruteur, M5 · Candidatures au téléphone (22/10/2026)

Choix faits pour les planches 04 et 05 (`docs/modele-b-recruteur/mobile/captures/INDEX.md`), au plus simple dans le respect des règles d'or.

- **Les six colonnes de « Toutes »** (Reçues, Présélection, Entretien, Proposition, Recrutés, Non retenus) regroupent les étapes de chaque offre par leur nature (`StageKind`) : `new` → Reçues, `screening` et `test` → Présélection, `interview` → Entretien, `offer` ou une proposition envoyée → Proposition, `hired` → Recrutés, `rejected` → Non retenus. Les étapes personnalisées de l'ordinateur restent intactes ; le changement d'étape se fait toujours vers une étape réelle de l'offre.
- **Fort potentiel** : score de correspondance de 80 % ou plus, parmi les candidatures en cours. Le score classe et s'explique (« Pourquoi ? »), il n'écarte personne : toutes les candidatures restent dans « Toutes ».
- **Proposition** : la planche « Proposition à … » envoie un message dans la conversation de la candidature (salaire mensuel, date de début, texte) et enregistre un évènement `job_proposal` (salaire en centimes). La candidature passe à l'étape « Proposition » de l'offre quand elle existe ; sinon elle reste à son étape et figure dans la colonne Proposition grâce à l'évènement. La décision (recruter ou non) reste un geste humain.
- **« Sans réponse »** (Décisions · Non retenus) : candidatures encore actives sur une offre clôturée ou archivée. « Répondre aux N sans réponse » envoie le modèle « Réponse non retenue » à chacun, avec son prénom, et enregistre la décision du membre (même service que les réponses groupées de l'ordinateur).
- **Notation** : l'échelle reste celle de l'ordinateur (4 étoiles, `RATING_MAX`) pour ne pas rendre incomparables les évaluations déjà saisies ; la planche en montre 5.
- **Lien de visio** : facultatif. Jumanly ne crée pas de visioconférence ; le recruteur colle son lien. « Rejoindre » n'apparaît que lorsqu'un lien existe.
- **Motifs de « Ne pas retenir »** : « Disponibilité incompatible » de la planche correspond au motif existant « Autre », sans nouvelle valeur en base. Le motif reste interne à l'équipe.
- **Répartir à un collègue** : migration additive `20261022191139_application_assignee` (colonne `Application.assignedToId`, facultative, mise à vide si le membre quitte). Le collègue choisi est prévenu (`candidateAssigned`), un évènement `assigned` entre dans l'historique. Seuls les membres actifs de la même entreprise peuvent être choisis.
- **Télécharger en PDF** : un PDF texte (fiche, CV, réponses, notes, historique au choix), généré sur demande, sans photo. Chaque téléchargement est journalisé (`candidate.pdf`) et l'ouverture de la fiche l'est aussi (`profile.view`).
- **Recruter** : depuis la fiche, une feuille avec le message de bonne nouvelle (même service `decide` que l'ordinateur, avec son délai d'annulation).
- **Diagnostic des CV par Orbi** : lu dans les explications de score déjà calculées (aucun nouvel appel à un modèle). « Présélectionner » déplace la personne la plus proche vers la première étape de présélection ; c'est le recruteur qui appuie.
- **La feuille Orbi de l'onglet** (planche 083) est construite avec Orbi en M7.
- **Agenda** : « Ajouter à mon agenda » télécharge un fichier `.ics` de l'entretien (organisation vérifiée).
- **Résumé par Orbi dans la fiche** : la carte « Résumé par Orbi » de l'onglet Résumé reprend l'analyse sur demande de l'ordinateur (1 crédit, droit et quota vérifiés, points forts et points à vérifier, « Ajouter aux notes »). Sans le droit, la fiche reste entière et renvoie vers les formules.
- **Annuler une décision** : une bande « Annulable encore … · Annuler » s'affiche en haut de la fiche pendant le délai d'annulation (même service que l'ordinateur).
- **Préparer l'entretien** : la page de préparation de l'ordinateur (questions d'Orbi, questions de l'équipe) reste celle du téléphone ; seule la confirmation « Invitation envoyée » est propre au Modèle B.
- **« Écrire »** ouvre la conversation de la candidature (créée au besoin).
- **Anciens tests du téléphone** : les tests de `mobile-recruteur-candidats.spec.ts` et le test « entretien » de `mobile-recruteur-entretiens.spec.ts` décrivent l'ancien design ; ils restent pour l'ordinateur et leurs gestes sont repris au téléphone dans `modele-b-recruteur-candidatures.spec.ts`.
- **Appel d'arrivée et vivier depuis la fiche** : les planches 04-05 n'en montrent pas ; l'appel d'arrivée reste sur l'écran de décision de l'ordinateur, l'ajout au vivier arrive au téléphone avec Talents (M6).
