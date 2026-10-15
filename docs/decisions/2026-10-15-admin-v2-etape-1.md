# Admin v2 · étape 1 : choix

Date : 15 octobre 2026

- **Support et outils de contenu** : le rôle Support (lecture seule) n'ouvre ni l'éditeur de
  formations ni les contenus, réservés aux rôles qui les modifient (`CONTENT_ROLES`). Plutôt que
  d'ouvrir ces pages en lecture seule, leurs liens sont retirés du menu et de la recherche du
  support. Option la plus simple ; à revoir si le support doit lire les formations.
- **Pages refusées** : une page admin hors du rôle répond « Cette page est introuvable » dans le
  gabarit (code HTTP 200, le rendu étant en flux). L'admin n'est pas révélée ; les tests vérifient
  le titre, pas le code.
- **Libellés du journal** : chaque code d'action connu a son texte (`admin.journal.action.*`) ; un
  code nouveau s'affiche tel quel en attendant son texte, plutôt que de disparaître.
- **Motif** : lu dans `reason`, puis `note` et `resolution` selon l'action qui l'a enregistré.
