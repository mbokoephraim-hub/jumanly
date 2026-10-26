# Étape 3 · A5 : Journal des consultations et Réglages du recrutement (26 octobre 2026)

Captures 084 à 087 de `docs/modele-b-recruteur/web/`.

1. **Qui lit le journal.** `/app/organisation/journal` est réservé au propriétaire et aux
   administrateurs, comme les autres écrans de la section ENTREPRISE. Il lit le journal d'audit de
   l'organisation de l'espace actif seulement (90 jours, 100 lignes) : profils consultés, CV ouverts,
   PDF de candidat ou de talent, exports d'historique, évaluations enregistrées et rapports exportés.
   Un membre d'une autre organisation n'est jamais un filtre.
2. **Profils anonymes.** Une consultation d'un profil anonyme (recherche de talents) reste anonyme
   dans le journal : la ligne dit « Profil anonyme », sans nom. Les rapports n'ont pas de personne.
3. **Étapes.** Les noms viennent du catalogue d'étapes existant (Reçue, En examen, Présélectionnée,
   Test pratique, Entretien, Proposition, Décision finale), pas ceux de la maquette. « Reçue » et
   « Décision finale » sont fixes. Le choix s'enregistre dans `Organization.pipelineTemplate` (migration
   additive `org_recruiting_settings`) et ne s'applique qu'aux nouvelles offres ; les offres en cours
   gardent leurs étapes.
4. **Modèles de messages.** Cinq types, ceux qui existent déjà dans `MessageTemplate` : convocation,
   demande de document, relance, refus avec conseil, proposition. Pas de « Accuser réception » : ce type
   n'existe pas. Les champs à remplacer restent `{prenom}`, `{poste}`, `{entreprise}` et
   `{signataire}`, pas ceux de la maquette.
5. **Grille d'entretien.** Les critères de l'organisation (`Organization.scorecardCriteria`, 10 au plus,
   sans doublon) servent aux offres qui n'ont pas leur propre grille ; à défaut, les compétences
   requises de l'offre. La note reste de 1 à 4 (échelle existante), pas de 1 à 5. Sans le droit
   `hire.scorecards`, l'onglet le dit et mène à « Formule et facturation ».
6. **Anciennes pages.** `/app/parametres/consultations` et `/app/hire/modeles` restent en place pour
   l'instant ; leur sort se règle au nettoyage (A6).
