# 2026-11-07 · L'espace talent sur ordinateur reprend le Modèle B du téléphone

Demande d'Ephraïm (07/11/2026) : sur ordinateur, l'espace talent doit avoir les mêmes fonctions, la même
logique, les mêmes couleurs et les mêmes textes qu'au téléphone, adaptés au grand écran, page après page.

## Choix

- **Un seul espace talent.** `isModelB()` (`src/server/phone-routes.ts`) vaut vrai au téléphone, et aussi
  sur ordinateur et tablette pour une personne dans son espace personnel (ni espace entreprise, ni espace
  partenaire). Toutes les pages talent l'utilisent à la place de `isPhone()`. Le recruteur et
  l'administration gardent leurs écrans d'ordinateur.
- **Cadre large** (`PhoneShell wide`, `src/styles/talent-large.css`) : le menu du téléphone se met debout à
  gauche (marque + Fil · Explorer · Carrière · Hub · Chat, avec leurs noms), le contenu au milieu, Orbi en
  bas à droite, ses fenêtres au centre de l'écran. Les étapes suivantes élargissent chaque page
  (Fil, Explorer et Postuler, Carrière, Formation, Chat, puis le reste).
- **L'ancien design talent d'ordinateur** n'est plus affiché (`TalentShell` retiré du layout). Son code sera
  effacé à la dernière étape, une fois chaque page élargie (jamais les données).
- **Premiers pas** : le talent prend ceux du téléphone ; le recruteur garde les siens sur ordinateur.

## Fonctions qui n'existaient que sur ordinateur

- **Fiches pour préparer** (contenus de `/admin/contenus`) : ajoutées à « Mes simulations » du Modèle B,
  pour tous (téléphone compris).
- À vérifier aux étapes suivantes : la recherche groupée de l'en-tête, le catalogue des formations par
  domaine, le masquage du numéro sur l'écran de paiement.

## Tests

- Les tests e2e de l'ancien design talent d'ordinateur suivent maintenant le chemin du Modèle B.
- Retirés car ils ne testaient que l'ancien écran d'ordinateur, couverts au téléphone par les séries
  `modele-b-*` : `web-talent-1.spec.ts`, la navigation et les premiers pas d'ordinateur
  (`mobile-talent.spec.ts`), la leçon à onglets (`mobile-talent.spec.ts`), Connexions dans Compte
  (`mobile-compte.spec.ts`, couvert par `modele-b-messages.spec.ts`).
- `web-frame.spec.ts` vérifie le nouveau cadre sur ordinateur (1440) et tablette (900).
