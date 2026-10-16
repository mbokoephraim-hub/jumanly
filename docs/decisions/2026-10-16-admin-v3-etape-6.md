# Admin v3 · étape 6 : PDF générés

- **Cache par contenu, pas par `updatedAt`** : modifier une leçon ou une question ne change pas
  `Course.updatedAt`. La clé du cache est une empreinte de tout ce que le PDF affiche (et du jour,
  imprimé dans le pied de page). Cache en mémoire (40 fichiers), perdu au redémarrage : le PDF est
  simplement refait.
- **Le bilan n'est jamais mis en cache** : il change à chaque inscription.
- **« Où s'arrêtent les inscrits »** : module de la dernière leçon ouverte par chaque inscrit qui
  n'a pas terminé (pas de date d'activité en base pour définir un abandon).
- **Équipe** = rôles qui éditent les formations (`requireCourseEditor`). Un refus renvoie 404.
- Le support de l'équipe liste tous les documents sauf ceux réservés à l'équipe ; celui d'un talent
  ne liste que ceux qu'il peut télécharger.
- Police Helvetica intégrée au lecteur PDF : pas de fichier de police à charger, les accents
  français passent. Le texte d'un numéro de page (`render`) disparaît s'il hérite d'une hauteur de
  ligne : la hauteur de ligne est posée sur les paragraphes, pas sur la page.
