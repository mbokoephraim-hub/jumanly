# Admin v2 · étape 9 : passe finale

- Le contrôle « aucun texte brut » cherche les clés de `messages/fr.json` restées affichées
  (`admin.users.title`…), hors des balises `<code>` : l'onglet FAQ montre volontairement la clé de
  chaque question.
- Le contrôle du clavier vérifie que la première tabulation atteint un élément visible ; le parcours
  complet de chaque formulaire reste couvert par les tests e2e de chaque étape.
- Les contrastes sont vérifiés par axe (règles WCAG 2.2 AA) sur l'état au repos (animations
  réduites), comme `tests/e2e/accessibility.spec.ts`.
- La vérification à 1440 et 390 px force la taille de la fenêtre dans le test ; les autres tests
  gardent les tailles des projets Playwright (ordinateur, Pixel 7).
