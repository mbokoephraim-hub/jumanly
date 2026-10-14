# Career avancé (E10)

Statut : accepté.

1. **Table `InterviewSession`** (nom de la partie 04) : questions et réponses dans `questions`
   (JSON), retour dans `feedback`. Les rendez-vous d'entretien réels restent dans `Interview`.
2. **Une séance = une unité du quota du mode**, consommée au démarrage et rendue si la création
   échoue. Les appels au modèle d'une séance coûtent 0 crédit IA (`runAi` saute le compteur quand
   le coût est nul) mais vérifient le consentement et sont journalisés dans `AiUsage`.
3. **Pas de note** : le retour donne un niveau (solide, en progrès, à travailler) par critère et des
   commentaires. Une sortie du modèle qui contient une note, un pourcentage ou une « chance » est
   rejetée et remplacée par le retour par règles (structure situation-action-résultat, exemples,
   longueur, longueur des phrases, débit à l'oral).
4. **Questions** : banque de huit questions par type dans les textes ; le modèle peut proposer des
   questions adaptées au poste, rejetées si elles touchent l'âge, la famille, la santé, l'origine,
   la religion ou les opinions (CLAUDE.md § 4).
5. **Voix dans le navigateur** : synthèse (`speechSynthesis`) et dictée (`SpeechRecognition`)
   derrière l'adaptateur `src/lib/voice`, choisi par `NEXT_PUBLIC_VOICE_PROVIDER` (`browser` ou
   `none`). Aucun son n'est stocké ni envoyé à Jumanly : la réponse transcrite est relue puis
   envoyée comme texte avec sa durée. Un fournisseur hébergé pourra s'ajouter comme autre
   implémentation.
6. **Documents** : lettres, biographies, e-mails et remerciements sont des `Document`
   (`cover_letter`, `bio`, `other`) au contenu `{ type, text, jobId, corrections }`. Sans modèle,
   un texte construit à partir du profil (textes `career.documents.template.*`).
7. **Garde-fous contre l'invention** : une sortie est rejetée si elle contient un chiffre absent des
   sources (profil, offre, points saisis) ou une compétence demandée par l'offre que le talent n'a
   pas. LinkedIn ne propose que les compétences du profil ; le CV adapté garde le même nombre de
   lignes par expérience et ne fait que réordonner les compétences.
8. **Correction** : une liste de remplacements « avant / après / pourquoi », chacun sur un extrait
   exact du texte ; le talent coche ceux qu'il applique.
9. **Portfolio** : adresse `/portfolio/<prénom>-<8 caractères aléatoires>`, page non indexée,
   visible seulement si publiée et si le droit `career.portfolio.level` est encore actif. Elle ne
   montre que le nom, le titre, la présentation et les projets. Médias en liens https faute de
   stockage de fichiers ; le niveau `standard` garde la mise en page classique, `enriched` ouvre
   la grille et trois couleurs d'accent.
10. **Exercices métier** : `Lesson.jobSpecific` et `Course.jobFamilies`. Un exercice métier est
    facultatif : il n'entre ni dans la progression ni dans les conditions de l'attestation, si
    bien qu'un forfait sans ce droit peut terminer la formation.
11. **Rapport détaillé** : PDF généré à la demande depuis les données du talent (aucune note de la
    personne), réservé à `reports.progress.detailed`.
12. **Compteur de quota** : la création concurrente du compteur du mois est tolérée (erreur
    d'unicité ignorée) ; l'incrément reste atomique.
