# Admin v2 · étape 8 : écarts et choix

- **Contrat d'un partenaire** : il reste porté par chaque lot (référence, montant, dates), comme
  en E9. « Modifier le partenaire » change le nom et le type ; « Modifier le lot » change le nom,
  la référence et le montant. La fin d'un lot ne fait que reculer (« Prolonger ») : l'avancer
  couperait des licences en cours. Le début ne bouge que tant que le lot n'a pas commencé et
  qu'aucune licence n'est active.
- **Prolongation** : seules les licences en cours dont la fin était l'ancienne fin du contrat sont
  allongées, jusqu'à leur durée prévue. Les licences déjà terminées ne sont pas rouvertes.
- **Fiche de lot** : les nombres de licences et de codes sont de la comptabilité de contrat (le
  partenaire les voit aussi) et restent visibles ; tout chiffre qui porte sur l'activité des
  personnes passe par le seuil d'anonymat du lot.
- **Crédits d'IA** : recalculés à partir de `AiUsage` (appels réussis × crédits de la fonction
  dans `src/server/ai/index.ts`). Les simulations d'entretien ont leur propre quota et comptent 0.
- **Budget d'IA** : nouvelle variable facultative `AI_MONTHLY_BUDGET_USD` ; sans elle, la page
  affiche seulement la dépense du mois. Seuil d'alerte du coût par forfait : 30 % du prix mensuel
  (un forfait annuel compte pour un douzième).
- **Conseils de préparation** : la partie 05 prévoit des « conseils généraux » gratuits et sans IA,
  mais aucun texte n'existait. Les fiches sont écrites dans l'admin (aucun contenu inventé n'est
  livré) ; la page talent `/app/career/conseils` n'apparaît qu'avec au moins une fiche publiée.
- **Versions** : table `ContentVersion` (valeurs d'avant de chaque clé d'un contenu) plutôt que le
  journal d'audit, pour pouvoir restaurer une question (question et réponse) d'un seul geste.
