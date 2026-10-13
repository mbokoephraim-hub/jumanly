# 2026-10-13 · Choix du site public (E1)

Statut : accepté.

1. **Textes des formules rattachés par `Plan.contentKey`** (ex. `pricing.talent.pro`). Le code ne
   nomme jamais un forfait : il lit les formules en base et va chercher leurs textes par cette clé.
   Les cases des comparatifs de `/tarifs` sont calculées à partir des droits (`src/config/pricing-compare.ts`) :
   une valeur changée dans l'admin change le tableau.
2. **Deux clés de droits ajoutées** (et reportées dans la partie 05) : `career.progress_plan.recommendations`
   (le comparatif distingue « plan de progression » et « avec recommandations ») et `org.seats.min`
   (Company Premium : 30 sièges minimum, mentionné sur la carte).
3. **Contrat `volontariat`** ajouté à l'énumération `ContractType` : le filtre « Volontariat » des
   textes de `/offres` n'avait pas d'équivalent dans la partie 04. Le filtre « Mission » regroupe
   `mission` et `freelance`, « Stage » couvre `stage`.
4. **Filtre d'accès des formations** : « Gratuit », « Fondamentaux », « Standard », « Avancé » pointent
   sur les niveaux de catalogue (`free` … `advanced`) ; le badge d'une formation affiche la formule
   la moins chère qui l'ouvre, calculée depuis les droits.
5. **Pages légales** : tant qu'elles contiennent des emplacements `[...]`, elles répondent 404 en
   production (rien d'incomplet n'est publié) et affichent un bandeau « à faire valider par un juriste »
   en local et en preview.
6. **Formulaire partenaires** : la formule souhaitée est une liste fermée (`partnerPlans`) et reste
   facultative ; le message partenaire peut aller jusqu'à 2 000 caractères.
7. **Adresse inconnue d'offre ou de formation** : rendue à la demande (les nouvelles offres
   n'attendent pas un nouveau build). Le tout premier rendu d'une adresse inconnue peut partir avec
   le code 200, mais la page « Page introuvable » porte toujours `noindex` ; les suivants répondent 404.
8. **Robots** : tout est interdit hors production (`APP_ENV`), pour que les previews ne soient jamais
   indexées. Lighthouse SEO se mesure donc sur un build `APP_ENV=production`.
