# Refonte étape 1 · web talent 1 : Pour moi, Offres, détail d'une offre (19/10/2026)

Lot web talent 1 de `docs/refonte-web/BRIEF-WEB-CLAUDE-CODE.md` (§ 5), planche `docs/refonte-web/talent-1`
(captures w1 à w5), valeurs de `docs/refonte-mobile/maquette/source/web1.py` et `web.py`.

## Choix et écarts

1. **Données réelles à la place des chiffres de la planche.** « Votre profil passe à 80 % et 4 offres
   de plus deviennent compatibles » n'est pas calculable sans simulation : le bandeau dit ce que la
   prochaine étape réelle demande (« Votre profil est complété à 80 %… », « Baobab Fintech vous propose
   des créneaux… ») et son bouton suit le type d'étape (Compléter, Préparer, Répondre…).
2. **« Orbi vous suggère » est calculé, pas généré.** La compétence requise qui manque le plus souvent
   dans les 20 offres les plus compatibles (matching déterministe, partie 08), et la formation publiée la
   plus courte qui l'enseigne (`orbiFocus`, `src/server/services/for-me.ts`). Sans compétence manquante :
   une phrase générale. Les puces ouvrent une page (entretiens, CV, formation) : Orbi propose, rien ne
   change sans la personne. Les crédits affichés sont les crédits restants du mois.
3. **« Votre profil » (colonne de droite)** : CV principal, expériences et formation, compétences
   (3 au minimum, seuil de la complétude), « une réalisation » = au moins une expérience avec ses
   réalisations décrites (pas de modèle « réalisation » à part ; les projets dépendent d'un droit).
4. **Tablette, Pour moi** : la planche ne montre pas l'accès rapide ; il reste sous les deux cartes
   (aucune fonction mobile ne doit manquer, le rail n'a ni Mes CV ni les attestations).
5. **Tablette, détail d'une offre** : la planche met « Entreprise vérifiée » en pleine largeur sous les
   deux colonnes ; on le garde en bas de la colonne de droite (un seul ordre de blocs pour les trois
   largeurs, sans dupliquer le contenu).
6. **Ordinateur, détail** : « Le poste » (description), les critères du recruteur, les avantages et les
   étapes, absents de la planche mais présents dans les données, suivent les compétences dans la colonne
   de gauche.
7. **Préparer ma candidature** : la même feuille qu'en mobile (`od-prep`) devient un panneau de 420 px
   à droite dès 768 px (440 px sur tablette) ; s'y ajoutent, sur grand écran seulement, « Pour combler
   l'écart » (la formation qui comble l'écart) et « Demander à Orbi », qui ferme le panneau et envoie la
   question, avec l'offre en contexte, au panneau Orbi du cadre (`?orbi=1`). `?preparer=1` l'ouvre.
8. **« Pourquoi ? » en fenêtre** : « Compris » ajouté à côté de « Contester ce score » sur grand écran
   seulement (le mobile ferme par la croix ou le voile, comme sur sa planche).
9. **Offres, ordinateur** : les filtres ouverts à gauche s'appliquent dès qu'on touche une puce (l'adresse
   suit, Retour marche) ; la recherche passe en tête de la liste, celle de la tête de page est masquée.
   Le bouton filtres de la recherche ouvre toujours la fenêtre des filtres (même contenu).
10. **Cadre W0, `t-large`** : le sélecteur `main.t-colonne:has(> .t-large)` ne voyait pas les pages, qui
    sont enveloppées par `src/app/app/template.tsx` (`.jm-page`). Ajout d'un sélecteur qui passe par
    `.jm-page` visible (les pages gardées en mémoire par `cacheComponents` portent `display: none`) ; la
    tête de page (titre, recherche) prend aussi toute la largeur.
11. **`/app/recherche`** n'est pas dessinée par la planche talent-1 : inchangée dans ce lot.
