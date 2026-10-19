# Refonte mobile de l'espace talent · lot 1 (fondations)

19 octobre 2026. Brief : `docs/refonte-mobile/BRIEF-TALENT-CLAUDE-CODE.md`, planche Fondations.

## Ce qui s'écarte du brief ou le précise

1. **Mode sombre page par page.** Le mode sombre (Auto, Clair, Sombre) est en place, mais il ne
   s'applique qu'aux pages déjà redessinées d'après les planches (`REDRAWN` dans
   `src/lib/appearance.ts`, aujourd'hui `/app/orbi`). Les autres pages gardent le mode clair
   jusqu'à leur lot : un ancien écran passé en sombre devenait illisible (textes clairs sur
   cartes blanches, contrastes sous le seuil AA). Sur ordinateur, ces anciennes pages gardent
   aussi leur largeur (classe `t-ancien`) : leur mise en page suit la largeur de l'écran et se
   chevauchait dans la colonne étroite. La liste grandit à chaque lot et disparaît au lot 7.
2. **Classes des planches préfixées.** `fondations.css` est repris à l'identique dans
   `src/styles/talent.css`, avec le préfixe `t-` sur chaque classe (`.bt` → `.t-bt`) pour ne
   heurter aucune classe existante. Seule la mise en page des planches elles-mêmes (grilles de
   présentation, cadre du téléphone) n'est pas reprise.
3. **Icônes talent à part.** Les 51 icônes de `icones.py` sont dans `ressources/icones/talent/`
   et génèrent `src/components/talent/icon-paths.ts` (`pnpm brand`). Plusieurs noms existent déjà
   dans le jeu de la marque avec un autre dessin : les deux jeux restent séparés, le second sert
   Hire, partenaire et admin.
4. **Orbi plein écran sans conversation.** Les quatre aides mènent aux fonctions existantes (CV,
   entretiens, offres, diagnostic). Le champ « Écrire à Orbi » est visible mais désactivé, avec la
   phrase « La conversation avec Orbi arrive bientôt » : la conversation arrive au lot 7.
5. **Sauvegarde hors connexion (demande d'Ephraïm du 19/10).** Chaque formulaire envoyé de
   l'espace talent garde un brouillon sur le téléphone pendant la saisie (`localStorage`, par
   compte, 7 jours). Envoyé sans réseau, il reste sur le téléphone et part au retour du réseau si
   la page est encore ouverte ; sinon il est remis dans le formulaire à la prochaine ouverture.
   Jamais gardés : mots de passe, fichiers, codes. Un formulaire peut refuser avec
   `data-no-draft`.
6. **Animations.** Toucher : enfoncement léger en 40 ms et `touch-action: manipulation` (pas
   d'attente du double toucher) ; l'onglet s'allume dès le toucher, avant l'arrivée de la page, et
   le satellite d'Orbi tourne pendant le chargement de son onglet. Défilement : les cartes entrent
   en douceur (`animation-timeline: view()`, sans JavaScript ; les navigateurs qui ne le savent pas
   affichent simplement les cartes). Tout est coupé en mouvement réduit et avec « Réduire les
   animations ».
7. **Accès gardés.** Le menu de l'avatar disparaît (le compte s'ouvre par l'avatar) : « Mon
   espace et mes organisations », le mode testeur et Jumanly Admin sont désormais des lignes de la
   page Compte, en attendant sa refonte au lot 6.
8. **Ancienne ouverture.** `/ouverture` redirige vers `/app` ; l'application installée démarre
   sur `/app`. Le générique d'entrée reste pour Hire et partenaire seulement.
9. **`User.theme`** n'est plus lu ; la colonne reste jusqu'à sa migration de retrait au lot 7.
   La migration de ce lot (`20261019090000_user_appearance`) est additive.
10. **Générique d'entrée gardé.** Le générique joué après une connexion (refonte connexion § 7)
    reste dans l'espace talent : c'est un écran de connexion, pas un élément de l'ancienne
    interface, et « Revoir la présentation » des paramètres en dépend.

## Reste à faire dans les lots suivants

- Bouton Filtres de la recherche d'Apprendre (lot 5, avec les filtres du catalogue).
- Pages talent encore à l'ancien contenu dans la nouvelle coquille : lots 2 à 7.
