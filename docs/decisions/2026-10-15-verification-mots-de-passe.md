# Vérification des mots de passe divulgués : ne jamais bloquer l'inscription

**Date** : 15 octobre 2026

## Contexte

En production, l'inscription vérifie que le mot de passe ne figure pas dans une fuite connue
(service Have I Been Pwned, partie 10 § 10.1). Le module de Better Auth lève une erreur interne
quand ce service ne répond pas, et n'a pas de délai maximal. L'inscription affichait alors
« Un problème est survenu de notre côté. Réessayez dans un instant. », pour tous les profils,
et la cause n'apparaissait nulle part dans les journaux.

## Décision

- Un mot de passe trouvé dans une fuite reste refusé.
- Si le service ne répond pas en 4 secondes ou renvoie une erreur, le mot de passe est accepté
  (les autres règles, 10 caractères avec une lettre et un chiffre, s'appliquent toujours) et
  l'incident est écrit dans les journaux (`src/server/auth/password-check.ts`).
- Toute autre erreur inattendue de l'inscription est désormais journalisée avec sa cause.

## Pourquoi

Une panne d'un service tiers ne doit pas empêcher quelqu'un de créer son compte. Le risque
accepté (un mot de passe divulgué passe pendant la panne) est faible et limité dans le temps.
