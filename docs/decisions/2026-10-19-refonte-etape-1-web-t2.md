# Refonte étape 1 · web talent 2 : écarts et choix (19 octobre 2026)

Planche `docs/refonte-web/talent-2` (d1 à d5, valeurs de `web2.py`). Un seul code pour les trois
largeurs : le téléphone (< 768 px) garde son balisage et son ordre ; les blocs propres au grand écran
sont cachés en dessous de 768 px (`.t-w-seul`), ceux du téléphone au-dessus (`.t-mob`) ; `.t-ordi`
n'apparaît qu'à 1200 px et plus, `.t-hors-ordi` en dessous.

## Cadre (correctif W0)

- La règle `t-large` du cadre ne voyait pas la racine d'une page enveloppée par `cacheComponents`
  (`.jm-page`) : ajout de `main.t-colonne:has(> .jm-page:not([style*="none"]) > .t-large)`. Les routes
  cachées (`display: none`) sont exclues pour ne pas élargir la page suivante.

## Suivi (d2)

- Liste et détail côte à côte **sur ordinateur seulement** (≥ 1200 px), par `?id=` dans l'adresse ;
  `/app/suivi/[id]` reste valide (lien d'e-mail, téléphone, tablette). Sur tablette la planche ne
  montre pas de côte à côte : la carte ouvre la page de la candidature, mise en page comme le détail
  d'ordinateur (en-tête, 5 étapes, deux colonnes).
- Chaque carte porte deux liens (un seul visible selon la largeur) : vers `/app/suivi/[id]` (téléphone,
  tablette) et vers `/app/suivi?id=` (ordinateur), plutôt qu'un script qui réécrit les liens.
- Sans `?id=` sur ordinateur, la première candidature s'ouvre d'elle-même (`AutoSelect`,
  `router.replace`) : la planche n'a pas d'état « rien de choisi ».
- Le détail est un composant partagé (`components/talent/suivi/application-detail.tsx`) ; dans la
  liste, ses identifiants prennent le préfixe `su-` (la page cachée reste dans le DOM) et les réponses
  (créneau, document) reviennent à `/app/suivi?id=…#su-…`.
- Terminées, non retenue : le rebond montre trois offres proches et une formation (planche), en web
  seulement ; le téléphone garde son lien « offre proche ».

## Postuler (d1)

- Le bouton « Retour » du titre est masqué en web (la barre latérale des étapes sert de retour) ; le
  bouton « Quitter et garder le brouillon » reste à droite du titre : la fonction du téléphone doit
  exister en web et la planche ne la place pas.
- Confirmation : fenêtre centrée **au-dessus de la page de l'offre** (rendue derrière), fermée elle
  ramène à l'offre. Sur téléphone, l'écran de confirmation reste.
- Le lien « Adapter mon CV pour cette offre » ouvre le studio CV existant (`?adapter=`).

## S'entraîner (d3)

- Briefing en deux colonnes ; la carte « Avec Orbi » annonce « une question à la fois » (le nombre de
  questions dépend de la durée choisie, il n'est pas connu avant de commencer).
- Simulation : le temps restant est calculé au rendu (début de la séance + durée) ; ce n'est pas un
  chronomètre qui coupe la séance, rien ne bloque l'utilisateur. Le plan des questions (ordinateur
  seulement, comme la planche) affiche le texte de chaque question, tronqué.
- Retour : les 5 critères gardent un **niveau en mots** (Solide, En progrès, À travailler) ; la jauge
  de la planche reprend ce niveau (85 / 55 / 35 %) sans aucun chiffre affiché, conformément à la
  partie 08 § 8.9 (pas de note).
- La page de liste `/app/career/entretiens` n'est pas dessinée en web dans la planche : elle garde le
  format téléphone dans la zone de 760 px.

## Messages et notifications (d4)

- Trois colonnes : liste, conversation, contexte (candidature liée, fichiers échangés). Le contexte
  n'apparaît qu'à 1200 px et plus ; sur tablette, liste et conversation. Les fichiers sont listés sans
  leur taille (non stockée pour les documents de candidature).
- `/app/messages` ouvre seule la conversation la plus récente en web, sauf pendant une recherche,
  après la réponse à une demande de mise en relation, ou quand une demande attend une réponse (elle
  reste au premier plan dans la liste).
- La cloche ouvre un panneau (`popover`) sous elle avec les 8 dernières notifications groupées,
  « Tout marquer comme lu » et « Toutes les notifications » ; la page `/app/notifications` reste.
  Le panneau lit `/api/notifications/panneau` à l'ouverture.
