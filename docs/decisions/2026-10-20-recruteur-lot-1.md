# Recruteur lot 1 · cadre mobile (20/10/2026)

Étape 2 de `docs/PLAN-REFONTE-EN-3-ETAPES.md`, brief `docs/refonte-mobile/BRIEF-RECRUTEUR-CLAUDE-CODE.md` § 1 et planches recruteur-1 (`nav`, `tete_r`, r1) et recruteur-3 (COMPTE_R, PROF_R, OBR1 à OBR3, r3plus).

## Ce qui change

- L'espace recruteur quitte l'ancien cadre (`AppShell`) pour `RecruiterShell` (`src/components/recruiter/`) : mêmes surfaces, icônes et mode sombre que l'espace talent, barre du bas À traiter · Offres · Orbi · Candidats · Messages, en-tête avec la pastille de l'organisation active, la recherche, la cloche et l'avatar.
- La pastille ouvre « Organisation active » (`switchSpace`, qui revérifie l'adhésion) avec le retour à l'espace talent.
- Nouvelles pages : `/app/hire/compte` (Compte RH) et `/app/hire/compte/profil` (nom affiché et fonction, `Membership.jobTitle`).
- Premiers pas du propriétaire d'une nouvelle organisation : `/app/bienvenue` en 3 écrans (vous recrutez pour, votre organisation, espace prêt avec les vraies limites `org.seats` et `jobs.active.max`). L'ancienne liste « Bienvenue » de l'organisation est retirée.

## Écarts assumés (à reprendre dans les lots suivants)

- **Cadre ordinateur et tablette** : il arrive avec les lots web recruteur. D'ici là, le cadre du téléphone (en-tête, barre du bas) sert à toutes les largeurs (pas de `.t-cadre`) ; à partir de 768 px, les pages Hire pas encore refaites gardent leur largeur d'origine (1240 px) et les écrans refaits (`.t-flux`) restent dans la colonne de 560 px.
- **Pages Hire encore anciennes** : À traiter, Offres, Candidats, viviers, entretiens, rapports gardent leur contenu actuel dans le nouveau cadre ; elles sont refaites aux lots 2 à 4.
- **Orbi recruteur** : l'onglet mène à `/app/orbi`, qui renvoie encore vers À traiter pour un recruteur. La conversation Orbi recruteur arrive au lot 5 (écrans partagés).
- **Messages, notifications, recherche, abonnement, paramètres** : écrans partagés avec le talent, repris au lot 5 pour le recruteur.
- **Photo du profil RH** : affichée, modifiable depuis le profil talent ; l'éditeur de photo dans le profil RH viendra avec le lot 5.
- **« En indépendant »** est enregistré comme `consultant` (catégorie existante « Cabinet ou consultant RH »), pour ne pas ajouter de valeur au profil d'organisation.
- **Taille** : cinq tranches fixes (`1-10` à `1000+`) ; les anciennes valeurs libres restent lisibles.
- **Inviter un collègue** : la planche nomme la formule (« Dès RH Pro ») ; l'écran dit « Selon votre formule » pour ne pas écrire de nom de forfait.
