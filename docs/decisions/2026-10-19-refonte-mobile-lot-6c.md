# Refonte mobile, lot 6c : choix et écarts (19 octobre 2026)

Planche talent-4 § 6 « CV et documents ». Les écrans remplacent les anciens, sur téléphone comme
sur ordinateur (colonne centrée, comme les lots précédents) ; la version ordinateur et tablette
du studio CV (`docs/refonte-web/studio-cv/`) reste à faire dans un lot à part.

- **Import : 4 Mo au lieu de 5.** L'hébergeur refuse les envois de plus de 4,5 Mo (même choix
  qu'au lot 5). Le fichier est lu sur le serveur (`src/server/services/cv-file.ts` : unpdf pour
  le PDF, fflate pour le Word), jamais conservé. Un scan sans texte est refusé avec un message.
- **« Depuis LinkedIn ».** Pas d'accès à l'API LinkedIn : la ligne demande le PDF du profil
  LinkedIn (« Enregistrer en PDF ») et le lit avec le même lecteur.
- **« Lu dans votre fichier · à vérifier ».** Un interrupteur par groupe (expériences,
  compétences, diplômes) plutôt qu'une case par élément. Une expérience sans date de début n'est
  pas ajoutée (le profil l'exige) : le nombre est dit sous la liste. L'import par texte collé
  disparaît de l'écran (l'action `readCvAction` reste pour Orbi).
- **Galerie des modèles.** Les vignettes sont les aperçus réels des modèles
  (`public/cv-templates/`), pas des dessins. Familles : « Sobres » = une colonne, hors modèles
  créatifs ; « Colonne » = deux colonnes ; « Créatifs » = Créatif, Visuel, Contraste, Bandeau.
  « Inclus » ou le nom de la formule suit `career.cv.templates.access`, lu en base.
- **Liste des CV.** Le sous-titre dit « modèle · modifié le … » (le nombre de pages n'est connu
  qu'après mise en page dans le navigateur). L'onglet LinkedIn ouvre `/app/career/linkedin`.
- **Lettres.** Une lettre s'ouvre toujours sur `/app/career/documents/[id]`, redessinée ;
  `/app/career/documents` redirige vers l'onglet Lettres (`/app/career/cv?vue=lettres`).
- **Avant/après.** Toutes les propositions d'Orbi sur un CV (« Améliorer le résumé », copie
  adaptée) passent par le même écran : Refuser, Modifier (le texte du talent remplace la
  proposition), Accepter. « Améliorer » n'existe que sur le résumé ; les réalisations gardent les
  conseils du profil.
- **Adapter.** La copie est faite par règles (compétences demandées en tête) ; les
  reformulations du modèle y sont rangées comme changements à valider un par un, jamais
  appliquées d'office. Un texte collé (5 000 caractères au plus) est encadré comme donnée dans le
  prompt et n'en sort jamais comme consigne ; aucun chiffre absent du CV n'est accepté.
  « Adapter mon CV » depuis une offre ouvre la feuille sur cette offre (`?adapter=<offre>`).
- **Abandonnés avec l'ancien éditeur.** Le panneau des sauts de page, la couleur libre (la
  couleur se choisit dans la palette ; une couleur trop claire reste refusée côté serveur), la
  langue des titres, la photo, le choix de colonne, le score et l'analyse du coach, le zoom de
  l'atelier. Les coordonnées (e-mail affiché, téléphone facultatif) passent dans le menu « … »
  de l'éditeur.
- **Crédits.** La note « Rien n'est modifié sans votre accord » donne les crédits Orbi restants
  quand le forfait en a un nombre fini.
- **Barre du bas.** Les pages CV, lettres et LinkedIn s'ouvrent depuis Compte et dessinent leur
  propre tête : la barre du bas est masquée, y compris sur la liste.
