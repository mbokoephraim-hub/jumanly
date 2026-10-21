# Recruteur web lot 1 · cadre, À traiter, offres, création, détail (21/10/2026)

Étape 2 de `docs/PLAN-REFONTE-EN-3-ETAPES.md`, brief `docs/refonte-web/BRIEF-WEB-CLAUDE-CODE.md` (§ 2, 3, 5, 6), planche `docs/refonte-web/recruteur-1` (`webr1.py`). Ordinateur (≥ 1200 px) et tablette (768 à 1199 px) ; le téléphone garde le lot mobile.

## Ce qui change

- **Cadre web du recruteur** : celui du talent (lot W0, classes `t-cadre`), barre latérale de 232 px, rail de 84 px sur tablette, barre du haut (recherche `Ctrl K`, cloche, messages, avatar). Barre latérale : logo, organisation active avec son menu sous le nom, À traiter · Offres · Orbi (carte avec `Ctrl K`) · Candidats · Messages, puis Agenda · Talents · Rapports, Paramètres et la carte du compte. La barre du bas disparaît dès 768 px ; la règle provisoire de `recruiter-ats.css` est retirée.
- **`Ctrl K` du recruteur** : « Demander à Orbi », puis les candidats et offres de l'organisation active (`/api/hire/recherche/apercu`, service `hire-search.ts`, filtré par `jobScope`, candidats seulement pour les rôles qui lisent les candidatures), puis « Aller à ».
- **À traiter** : bonjour en titre, date et organisation dessous, « Publier une offre » à droite ; nouvelles candidatures à gauche, entretiens et « Candidatures cette semaine » (barres par jour) à droite ; offres actives en grille.
- **Mes offres** : titre, ligne « N offres actives sur M · formule X », recherche et onglets sur une ligne, cartes en grille ; le menu « … » s'ouvre sous son bouton (fenêtre ancrée).
- **Créer une offre** : les 4 étapes en tête (avec l'organisation), le formulaire dans une carte, l'aperçu de l'annonce à droite qui suit la saisie ; « Rédiger avec Orbi » en panneau à droite ; la fenêtre « Limite atteinte » centrée.
- **Offre publiée** : une carte en deux colonnes (confirmation, suites, puis l'annonce et la frise).
- **Détail d'une offre** : tête avec ses boutons ronds (modifier, partager, pause ou reprise, menu « … ») et « Voir les N candidatures », chiffres sur 4 colonnes, deux colonnes (étapes, description, candidature, compétences, fiche / performance, historique, ligne d'Orbi).

## Écarts assumés

- **Organisation dans le rail de la tablette** : la planche ne la montre que dans la barre latérale ; sur tablette un rond avec ses initiales sous le logo ouvre le même menu, pour ne pas perdre la fonction du téléphone.
- **Entrée « Talents »** dans le groupe Agenda · Rapports : la recherche de talents existe sur téléphone (Candidats › Rechercher des talents) ; elle mène au même écran.
- **Orbi reste une page pour le recruteur** : « Demander à Orbi » de `Ctrl K` ouvre `/app/orbi?q=…` et envoie la question ; le panneau Orbi à droite depuis tout écran est laissé au lot web recruteur 3.
- **« Voir tous les résultats »** n'est pas proposé dans `Ctrl K` du recruteur : il n'existe pas de page de résultats commune candidats + offres.
- **Aperçu de l'annonce** : titre, lieu, contrat, mode, deux responsabilités, compétences, date limite et documents ; rien n'est enregistré avant « Continuer ».
- **Attribution et Modèle de grille** (détail d'une offre) gardent leur mise en forme actuelle, en pleine largeur sous les deux colonnes ; ils seront repris avec la gestion (lot web recruteur 4).
- **Sections du détail ouvertes d'office** sur ordinateur et tablette (`OpenOnWide`) ; repliables comme sur téléphone.
- **« Candidatures cette semaine »** : semaine du lundi au dimanche en UTC, comme les autres chiffres de la semaine.
- **Fenêtre « Clôturer »** : reprend la confirmation du téléphone ; l'option « message aux non retenus » de la planche n'est pas ajoutée (les réponses groupées du lot 6 s'en chargent).
- **Trois corrections visibles aussi sur téléphone** (défauts, pas de nouveau design) : l'indicateur `.t-sp` des cartes d'offre s'affichait comme un rond étiré ; les trois tuiles « cette semaine » d'À traiter vide (`.t-q3` en `li`) n'étaient pas mises en forme ; « Copier le lien » de l'offre publiée n'avait pas la forme de sa voisine. Tout le reste du téléphone est identique au pixel près (comparaison avant/après à 390 px).
- **Fenêtres ouvertes par l'adresse** (`Sheet` avec `defaultOpen`, comme « Limite atteinte ») : la vérification « ma place est-elle affichée ? » remonte au-delà des enveloppes web en `display: contents`, qui n'ont pas de boîte sur téléphone.
