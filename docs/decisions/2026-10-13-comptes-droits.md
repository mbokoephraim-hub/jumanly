# 2026-10-13 · Comptes, forfaits et moteur de droits (E2)

Statut : accepté.

1. **Cache des droits en mémoire (60 s) au lieu de Redis.** Redis n'est pas encore en place. Le
   cache est vidé à chaque achat, essai, résiliation et à chaque modification d'un forfait dans
   l'admin. Avec plusieurs serveurs, un changement de forfait mettrait au plus 60 s à s'appliquer
   sur les autres : à revoir quand Redis arrive.
2. **Vérification en deux étapes par code e-mail**, pas d'application d'authentification (TOTP),
   comme le décrivent les textes. Obligatoire pour les administrateurs de la plateforme.
3. **Pas de prestataire de paiement réel encore.** Le prestataire factice ne fonctionne qu'en local
   et en preview. Ailleurs, choisir une formule payante ouvre un essai de 14 jours ; le compte
   revient en Free à la fin, sans perte de données.
4. **Google** n'est proposé que si `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont remplis, et
   seulement aux talents à l'inscription (un recruteur doit saisir le nom de son organisation).
5. **Inscription** : le choix du profil, du forfait et la page de retour vivent dans un cookie
   `jm_signup` (httpOnly, 2 heures) entre les étapes ; rien n'est enregistré en base avant l'étape 3.
6. **« contract » sans dérogation vaut 0** : une valeur négociée par contrat n'ouvre rien tant qu'une
   dérogation (`EntitlementOverride`) ne l'a pas fixée pour l'organisation.
7. **Admin des forfaits** : une modification s'applique tout de suite, y compris une baisse de quota
   (la partie 05 prévoit la période suivante ; l'aperçu d'impact viendra avec l'admin complète, E11).
   `jobs.apply` reste toujours vrai, quoi qu'on envoie. Chaque modification est journalisée
   (`AuditLog`).
8. **Le seed ne réécrit plus les forfaits existants** : il crée seulement ce qui manque, pour ne pas
   écraser les réglages faits dans l'admin. `SEED_PLANS_RESET=1 pnpm db:seed` remet la matrice du
   fichier.
9. **Limites de tentatives** : Better Auth ne limite que ses propres routes HTTP. Nos formulaires
   l'appellent depuis des actions serveur, donc les mêmes limites sont appliquées dans
   `src/server/rate-limit.ts` (connexion : 10 par adresse e-mail toutes les 15 min ; inscription :
   10 par heure et par adresse IP ; lien magique et réinitialisation : 5 par 15 min). Désactivables
   pour les tests (`AUTH_RATE_LIMIT=off`).
10. **Admin invisible** : le proxy répond un vrai 404 à toute personne connectée qui n'est pas
    administrateur ou support.
11. **Export de données** : « Télécharger mes données » renvoie tout de suite un fichier JSON (compte,
    profil, organisations, abonnements, paiements, appareils). L'archive complète par e-mail sous
    48 heures viendra quand CV, candidatures et messages existeront.
12. **Reportés** : onglets Notifications et Langue des paramètres (E10), changement d'adresse e-mail,
    association Google depuis les paramètres, partie CV de l'écran de bienvenue (E3), actions admin
    « attribuer un forfait » et « export des données d'un utilisateur » (E11).
