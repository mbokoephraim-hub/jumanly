# Refonte étape 1 · web talent 4a (accès) : écarts et choix

19 octobre 2026. Planche `docs/refonte-web/talent-4` § 1 (Se connecter), § 2 (Inscription et premiers
pas) et § 10 (connexion en sombre), générateur `docs/refonte-mobile/maquette/source/web4.py`.

## Choix

1. **Un seul code, trois largeurs.** Les écrans d'accès gardent leurs pages et composants mobiles
   (`src/components/access/`). La disposition large est portée par le gabarit
   `src/app/(auth)/(acces)/layout.tsx` (`.t-split` : panneau de marque `.t-vit` + formulaire `.t-frm`)
   et par un bloc CSS commenté en fin de `src/styles/talent.css`.
2. **Tablette (768 à 1199 px)** : la colonne du téléphone, centrée à 460 px et centrée en hauteur, sans
   panneau de marque, comme les écrans tablette de la planche (`T_CONNEX`, `T_MDP3`, `T_VALIDE`). Le
   panneau n'apparaît qu'à partir de 1200 px (point de rupture « ordinateur » du brief web).
3. **Barres d'action** : la barre fixée en bas du téléphone (`.t-bas-f`) reprend sa place sous les
   champs dès 768 px sur les pages publiques. Sur « Mot de passe oublié », le bouton passe avant
   l'avertissement de sécurité (ordre de la planche).
4. **Retour** : en mobile, rond en haut à gauche ; dès 768 px, lien texte (« Retour à la connexion » sur
   mot de passe oublié, « Retour » ailleurs). La planche ne dessine ce lien que sur « Mot de passe
   oublié » ; il est gardé sur les autres étapes (code, création du compte) pour qu'aucune fonction
   mobile ne manque en web. Il disparaît sur « Mot de passe modifié ».
5. **Titre de l'étape** : le nom d'écran de l'en-tête mobile (« Créer un compte », « Nouveau mot de
   passe »…) reste le `h1` pour les lecteurs d'écran ; dès 768 px il est masqué visuellement et la
   question de l'écran sert de titre visible. Sur « Créer un compte », la planche ajoute le titre et
   « Avec votre adresse e-mail. » : bloc visible dès 768 px (`aria-hidden`, doublon du `h1`).
6. **Google / LinkedIn** : en mobile, « Continuer avec Google » sur toute la largeur ; dès 768 px, sur la
   connexion, deux boutons côte à côte au nom court (`access.providerShort.*`, planche `FOURN`). Seuls
   les fournisseurs configurés sur le serveur s'affichent (captures faites avec des identifiants
   factices pour les montrer).
7. **Premiers pas plein écran** (`/app/bienvenue`) : dès 768 px, la page se pose au-dessus de l'espace
   (position fixe, sans barre latérale ni barre du haut, quel que soit le cadre W0) : logo à gauche,
   progression « n sur 4 » au centre, question centrée sur 820 px, barre du bas sur toute la largeur
   avec un trait. « Retour » passe dans la barre du bas (étapes 2 à 4). La planche ne le montre pas à
   l'étape 4 « Votre espace est prêt » : gardé, car le téléphone le propose. Pas de retour à l'étape 1
   (comme la planche ; il ramènerait à « Compte validé »).
8. **Études et domaine** : sous-titre « Facultatif. Cela affine… » ajouté en web seulement (absent de la
   planche mobile).
9. **Pays** : la feuille du bas devient une fenêtre centrée de 780 px (et non une bulle accrochée au
   champ comme dans la planche) : RD Congo en tête, puis trois colonnes (Afrique centrale, Afrique de
   l'Ouest et de l'Est, Hors d'Afrique), puis tous les pays de A à Z sur trois colonnes, et le bouton
   « Tous de A à Z ». Titre « Votre pays » et bouton de fermeture gardés (accessibilité, Échap). Le
   Maroc est dans « Afrique de l'Ouest et de l'Est » et l'Afrique du Sud dans « A à Z », comme en
   mobile (la planche les met sous « Nord et australe ») : la liste des groupes n'a pas changé.
10. **Panneau de marque** : les deux cartes (offre « Analyste de données junior · Baobab Fintech »,
    86 %, et la phrase d'Orbi) sont une illustration fixe de l'appli, identique pour tout le monde,
    masquée aux lecteurs d'écran, comme dans la planche. Ce ne sont ni des données d'un compte ni un
    client réel ; à retirer si Ephraïm juge que c'est contraire à la règle d'or 11.
11. **Carte « Bienvenue » de Pour moi** : ses trois premiers pas passent côte à côte dès 768 px
    (`W_BIENV`). La mise en page de Pour moi elle-même appartient au lot web talent 1.

## Nettoyage

- Textes morts de l'ancienne scène animée de `/connexion` et `/inscription` (`auth.stage.*`,
  docs/refonte-connexion) retirés de `textes/textes-application.md` : plus aucun composant ne les lit.
- Il ne restait aucun composant de l'ancien rendu large de ces pages (supprimé au lot mobile 2).
- Hors périmètre, gardé : `src/app/(auth)/(etapes)/` (forfait et paiement RH ou entreprise,
  activation d'une licence Partners) et `src/components/auth/*` qu'il utilise ; ils relèvent des
  étapes 2 et 3 de la refonte.
