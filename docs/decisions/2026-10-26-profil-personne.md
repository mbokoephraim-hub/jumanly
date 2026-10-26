# Profil d'une personne : choix d'intégration (26/10/2026)

1. **Le dossier de candidature reste.** La maquette « Candidat » montre le profil avec la carte de la
   candidature et les quatre onglets du profil. Les outils du recruteur (Résumé, CV, Réponses, Notes,
   Historique, répartir, demander un document, ne pas retenir, PDF) ne disparaissent pas : le
   candidat s'ouvre sur son profil, et « ··· » › « Dossier de candidature » ouvre le dossier (aussi
   directement par `?onglet=resume`, etc.). Après un geste fait dans le dossier, on y reste.
2. **« Avancer »** déplace la candidature à l'étape suivante (jamais « Non retenue ») ; vers
   « Retenue », la feuille « Recruter » et son message s'ouvrent. C'est toujours un geste humain.
3. **Type de contrat d'une expérience** : la base n'a pas de contrat par expérience, seulement son
   type (Emploi, Stage, Freelance, Bénévolat, Entrepreneur). C'est lui qui s'affiche en couleur ; la
   durée est sur la ligne des dates.
4. **Domaine** : le premier secteur du profil, sinon la famille de compétences la plus présente.
5. **Heure locale** : fuseau de la capitale du pays (liste de ~50 pays dans `src/lib/countries.ts`) ;
   sans fuseau connu, l'heure n'est pas affichée.
6. **Événements** dans Réalisations : pas encore de source en base ; seuls projets et certificats
   s'affichent (le libellé « Événement » est prêt).
7. **Photo côté recruteur** : la maquette validée l'affiche ; elle reste exclue du calcul du score
   (règle d'or 4), comme le rappelle la feuille « Pourquoi ? ».
