# Revue des lots mobiles 1 à 6 : écarts gardés (19 octobre 2026)

Revue capture contre planche des écrans talent mobiles (390 px, clair et sombre). Les écarts corrigés
sont listés dans `docs/journal.md`. Écarts volontairement gardés :

1. **Noms de domaine en anglais** (Apprendre, Rechercher) : ils viennent de la base (décision du lot 5) ;
   certains passent sur deux ou trois lignes dans les tuiles de 84 px. On garde la largeur de la planche.
2. **Pourquoi ce score** : le moteur déterministe (doc 08) renvoie huit critères, la planche en montre
   moins. On affiche tous les critères réels.
3. **Blocs en plus sur le détail d'offre** (décision du lot 3) : gardés.
4. **Liens dans le texte soulignés** (conditions, politique) alors que la planche les met seulement en
   gras : WCAG 1.4.1 (la couleur ou la graisse seule ne suffit pas).
5. **Connexions, demandes reçues** : les boutons Accepter et Ignorer passent sous le nom ; à 390 px ils
   ne tenaient pas à droite sans écraser le nom.
6. **Notifications** : le lien « Tout marquer comme lu » est gardé (fonction existante, absente de la
   planche).
7. **Mes attestations** : la ligne date et score reste sous le titre (information utile, absente de la
   planche).
8. **CV et documents** : la pastille « Principal » reste sous le sous-titre.
9. **Connexion** : les boutons Google et LinkedIn n'apparaissent que si les fournisseurs sont configurés
   (normal en local).
10. **Plan de carrière** pour le compte payant de démo : état vide (aucun plan dans le seed), conforme à
    l'état vide de la planche.
11. Les corrections CSS sont ajoutées en fin de `src/styles/talent.css` plutôt que de réécrire les blocs
    des lots précédents : moins de risque de régression, et le lot 7 (suppression de l'ancien code)
    travaille en parallèle sur ce fichier.
