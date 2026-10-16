# Droits résolus gardés le temps d'une requête (Admin v4, étape 1)

La partie 03 prévoit un cache de 60 s des droits résolus, dans Redis, invalidé à chaque changement.
Sans Redis, ce cache vivait dans la mémoire de chaque instance du serveur : sur Vercel, l'instance
qui traite l'action admin l'effaçait, mais les autres gardaient l'ancienne valeur jusqu'à 60 s.

Décision : les droits résolus ne sont plus gardés qu'au sein d'une requête (`cache` de React).
Chaque requête relit forfaits, abonnements et dérogations en base (trois petites requêtes indexées).
Le propriétaire veut que tout changement de l'admin se voie tout de suite. Si la charge l'impose,
un cache partagé (Redis) avec invalidation pourra revenir.
