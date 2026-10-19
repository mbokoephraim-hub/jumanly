# Refonte étape 1 · web talent 4b : compte, profil, abonnement, paramètres, aide (19 octobre 2026)

Planche `docs/refonte-web/talent-4`, sections 3 à 10 (captures f3 « Compte » à f10). Valeurs tirées
de `docs/refonte-mobile/maquette/source/web4.py` et `web.py`.

## Principe : un seul balisage pour les trois largeurs

Les pages gardent le balisage du téléphone. Des enveloppes `.t-w4-g2` (1,75/1), `.t-w4-g2e` (deux
colonnes égales), `.t-w4-g2r` (1fr + 360 px), `.t-w4-col`, `.t-w4-h` (tête web), `.t-w4-prm`
(rubriques) et `.t-w4-aide-h` deviennent `display: contents` sous 768 px : l'ordre et l'aspect du
téléphone ne changent pas. `.t-w4-web` n'existe qu'à 768 px et plus, `.t-w4-tel` seulement en
dessous. Tous les styles sont dans le bloc « Web talent 4b » à la fin de `src/styles/talent.css`.

La règle W0 `main.t-colonne:has(> .t-large)` ne prend pas (la page est dans le `.jm-page` du
gabarit) : le lot ajoute sa propre règle, limitée aux pages `.t-w4.t-large` et qui ignore les
pages gardées cachées par `cacheComponents`. Les lignes de W0 ne sont pas modifiées.

## Choix

- **Profil, fenêtres au lieu de pages** : sur ordinateur et tablette, Modifier, Expérience,
  Compétence, Ce que je cherche et Projet s'ouvrent en fenêtre centrée au-dessus du profil
  (`/app/profil?fenetre=…`), Vu par un recruteur et Faire le point en volet à droite. Le code des
  formulaires est partagé (`src/components/talent/profile/screens.tsx`, mode `page` ou `fenetre`).
  Sans JavaScript, ou sur téléphone, les liens mènent aux sous-pages, qui restent. Les actions
  gardent `fenetre` en cas d'erreur pour rouvrir la même fenêtre.
- **Sections du profil** toutes ouvertes à 768 px et plus (les deux colonnes montrent tout) ;
  repliables sur téléphone comme avant.
- **Formules** : la formule gratuite n'est affichée qu'en web (quatrième carte), avec ses textes
  issus du forfait (`contentKey`), jamais son nom en dur. Chaque carte a son bouton ; la barre du bas
  reste sur téléphone. La carte devient un `div` qui contient le `label` du choix (pas de formulaire
  dans un `label`).
- **Paiement** : à 768 px et plus, services et numéro sur un même écran (le téléphone garde les
  deux étapes), récapitulatif à droite avec le bouton Payer. Attente, paiement reçu et échec
  s'affichent en carte centrée sur la page, pas par-dessus le formulaire de paiement (même adresse,
  le retour du prestataire et l'interrogation restent inchangés). Le paiement simulé reste limité aux
  environnements internes (`isInternalEnv()`), inchangé.
- **Abonnement** : « Prolonger » mène au paiement de la formule en cours ; il n'y a pas de bouton
  « Changer » de moyen de paiement (aucun moyen n'est enregistré : il se choisit à chaque paiement,
  la ligne montre celui du dernier paiement).
- **Paramètres** : rubriques à gauche sur ordinateur, en puces sur tablette (planche T_CONF). La page
  racine devient la rubrique « Appareil et affichage » + « Mes données ». « Supprimer mon compte »
  ouvre la fenêtre existante (`?supprimer=1`). Sur les rubriques, le titre web est « Paramètres » et
  la rubrique en sous-titre.
- **Aide** : la grande recherche, les thèmes en cartes, puis « Questions fréquentes » (la première
  question de chaque thème) et « Nous écrire » (e-mail seulement).
- **Diagnostic** : le résultat en deux colonnes avec « Mon plan de progression » à droite
  (`PlanSummary`, verrouillé sans `career.progress_plan`).

## Écarts restants

- Sécurité : pas de saisie à 6 cases « Code de l'application » (notre double vérification passe par
  un code e-mail, pas par une application d'authentification).
- L'indicatif reste la fenêtre de choix du pays existante (pas de liste déroulante ancrée).
- Faire le point : pas de mention « 1 crédit » (règles fixes, sans IA, donc gratuit).
- L'accueil du diagnostic (avant le questionnaire) garde le format téléphone centré.
- Enregistrer la photo depuis la fenêtre « Modifier » revient à la sous-page (formulaire de fichier
  existant).
- Les autorisations de notifications du navigateur (planche recruteur) ne sont pas traitées ici.
- La ligne fine à droite de la recherche, en haut, vient du cadre W0 (à voir dans son lot).

## Tests de bout en bout

Le projet « desktop » (1280 px) voit désormais la mise en page web : `mobile-compte`, `payments` et
`talent` (diagnostic) distinguent téléphone et ordinateur (« Voir mon profil », recherche de
connexions dans la tête, numéro sur le même écran que le service, déduction et factures dans
l'abonnement, plan à côté du diagnostic). Le test Compte reçoit 90 s (une inscription et une
quinzaine de pages). Le test Connexions attend l'avis de la page (« C'est fait. … ») au lieu du texte
de la feuille, identique, qui laissait la recherche partir avant la fin du retrait.
