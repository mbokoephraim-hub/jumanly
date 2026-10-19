# Refonte étape 1 · W0 cadre web commun de l'espace talent (19/10/2026)

Lot W0 de `docs/refonte-web/BRIEF-WEB-CLAUDE-CODE.md` (§ 0, § 2, § 3), planches `talent-1` § 0, § 4
(contenant du panneau Orbi), § 5 et `talent-4` § 3 (menu de l'avatar) et § 9 (Orbi en page).

## Choix et écarts

1. **Entrées sous le séparateur : Messages, Mes CV, Connexions.** La capture `talent-1/w0.png` ne
   montre que Messages et Connexions, mais le générateur commun `web.py` (`SEC`), la planche `talent-4`
   (dernière version) et le brief (§ 2.3 « + Messages, CV, Profil ») ajoutent Mes CV. La dernière
   version fait foi (plan en 3 étapes, règle 3). Profil est dans le menu de l'avatar et la carte du bas.
2. **Logo de la barre latérale.** La planche dessine un « J » en police dans une tuile Lime ; on sert la
   vraie tuile de marque (`/marque/jumanly-symbole-lime.svg`, même couleur, même rayon) et le mot
   « jumanly » suivi du point Lime. Aucun texte en dur (règle 7) : le mot vient de `talentShell.web.brand`.
3. **Fenêtre `Ctrl K` sans maquette.** Aucune planche ne la dessine : elle reprend la fenêtre centrée de
   `web.py` (`.dlg`, 600 px au lieu de 520 pour la liste), Orbi en première ligne (« Demander à Orbi :
   « … » » ouvre le panneau et envoie la question), puis les offres et formations qui correspondent
   (`/api/recherche/apercu`, désormais jusqu'à 6 résultats avec `n`), puis « Voir tous les résultats ».
   Sans mot : Orbi et les destinations (« Aller à »). `⌘ K` marche aussi sur Mac.
4. **Panneau Orbi.** `?orbi=1` sur la route courante ouvre un nouvel échange ; dès la première réponse,
   l'adresse devient `?orbi=<id>` (un rechargement ou un lien partagé retrouve l'échange). Fenêtre
   modale native (`<dialog>`) : focus piégé, `Échap` ferme, sans voile (la page reste lisible derrière,
   comme sur la planche). Le contenu propre à un écran (« Préparer ma candidature » d'une offre) viendra
   avec le lot web talent 1 ; le cadre fournit la conversation générique avec les quatre aides.
5. **Feuilles du bas existantes.** Au-dessus de 768 px, toutes les `.t-sheet` des pages deviennent des
   fenêtres centrées de 520 px (brief § 2.5), sans changer les pages. Les lots web suivants utiliseront
   directement `CenteredDialog` ou `SidePanel`, qui sont des feuilles du bas sur téléphone.
6. **Zone de contenu.** La colonne centrée provisoire (560 px) disparaît sur tablette et ordinateur :
   le contenu s'aligne à gauche sous la barre du haut (marges 24 ou 32 px de `web.py`). Les pages encore
   au format téléphone gardent une largeur lisible de 760 px (`--t-page-max`) ; une page mise en colonnes
   par un lot web pose la classe `t-large` sur sa racine et prend toute la zone. Les barres fixées des
   pages (bas d'offre, champ d'Orbi, tête qui apparaît) s'alignent sur cette zone.
7. **Orbi en page.** Sur ordinateur : historique à gauche (8 derniers échanges, « Nouveau », recherche
   qui ouvre l'historique complet, rappel d'effacement), conversation au centre, sans barre du haut ni
   retour (planche talent-4 § 9). Sur tablette : comme la planche, l'horloge ouvre l'historique.
8. **Premiers pas** (`/app/bienvenue`) restent en plein écran, sans barre latérale ni barre du haut.
9. **Mode sombre du cadre** : les pages encore à l'ancien design (liste `REDRAWN`, gérée par le lot 7)
   restent claires, cadre compris, pour ne jamais montrer une page à moitié sombre.
10. **`?orbi=` partagé avec le studio CV.** Le studio CV (lot 6c) répond déjà dans `?orbi=<code>`
    (« quota », « obsolete »…). Le panneau ne s'ouvre donc que pour `orbi=1` ou un identifiant
    d'échange (cuid2, 24 caractères) ; les autres valeurs restent au studio.
