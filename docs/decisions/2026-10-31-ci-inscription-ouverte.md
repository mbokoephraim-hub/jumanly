# CI : inscription ouverte pour les tests e2e (31/10/2026)

Depuis la liste d'attente (#242, 29/10), les boutons publics « Créer un compte » mènent à
`/liste-attente` tant que `NEXT_PUBLIC_SIGNUP_OPEN` ne vaut pas `1`. Une quarantaine de parcours
e2e commencent par l'inscription publique et échouaient donc tous ; les fusions sans vérification
de la semaine du 27/10 ne l'ont pas vu.

Décision : la CI construit le site avec `NEXT_PUBLIC_SIGNUP_OPEN=1`, pour continuer à tester
l'inscription qui servira à l'ouverture. Le mode liste d'attente reste vérifié par le test
unitaire `tests/unit/site.test.ts` (les boutons suivent `joinHref`). La production n'est pas
touchée.
