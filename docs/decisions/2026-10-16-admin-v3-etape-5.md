# Admin v3 · étape 5 : PDF à joindre

- **4 Mo par fichier** au lieu des 10 Mo du plan : une requête vers le site s'arrête à 4,2 Mo
  (`serverActions.bodySizeLimit`, limite d'hébergement Vercel). Un envoi direct vers un stockage
  externe lèvera cette limite plus tard.
- **Téléchargement par `/formations/documents/[id]`** : le fichier reste privé et chaque demande
  passe par la règle d'accès. Réponse `404` quand l'accès est refusé, pour ne pas révéler qu'un
  document existe.
- **« L'équipe »** = les rôles qui ouvrent l'administration (`ADMIN_SHELL_ROLES`).
- Un document d'une leçon en aperçu gratuit est téléchargeable par tous, comme la leçon.
- Les liens vers des fichiers hébergés ailleurs restent dans « Ressources à télécharger » de chaque
  leçon ; l'étape Documents le rappelle.
