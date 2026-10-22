# Bannière du profil et préchargement des pages (22 octobre 2026)

Demande d'Ephraïm : pouvoir changer la bannière de son profil, pas seulement la photo ; et que les pages de l'appli soient déjà chargées quand on les ouvre, sans attendre à chaque toucher.

## Bannière

- « Modifier le profil » (téléphone) montre la bannière en haut, avec « Changer la bannière » : prendre une photo, choisir dans la galerie, ou revenir à la bannière Jumanly (le dessin du Modèle B).
- L'image est recadrée au format 5 × 2 (1200 × 480, JPEG) dans le téléphone avant l'envoi, puis gardée en base (`ProfileBanner`, comme la photo) et servie à une adresse impossible à deviner (`/api/banniere/…`), renouvelée à chaque changement. Le serveur vérifie le type réel (JPEG, PNG, WebP) et la taille (1,5 Mo au plus).
- Elle s'affiche sur Carrière (fondue vers le fond sombre pour garder le texte lisible) et sur la page de la personne dans Explorer, qui n'est montrée qu'aux relations ou si le profil est visible.
- Migration additive : `TalentProfile.banner` et la table `ProfileBanner`.

## Préchargement

- À l'ouverture d'un écran, le téléphone charge en arrière-plan, données comprises, les pages vers lesquelles mènent ses liens (les cinq onglets étant montés, cela couvre ce que chaque onglet ouvre) : d'abord ce qui est à l'écran, deux à la fois, quand le téléphone est libre, 40 au plus par écran. Une page chargée d'avance sert 30 secondes au plus (`staleTimes.static: 30`, le minimum) ; tant qu'un écran reste ouvert, ses liens visibles sont rechargés toutes les 30 secondes.
- Jamais préchargées, donc toujours demandées au toucher : les pages qui changent pendant qu'on les regarde (notifications, messages, suivi des candidatures, formulaire de candidature).
- Jamais préchargés non plus : un fichier (PDF, Word, agenda, export), une conversation (l'ouvrir la marque comme lue), les espaces d'équipe, d'institution et d'administration (une consultation de profil y est journalisée). Une liste de motifs (`src/lib/phone-preload.ts`) le dit ; un test unitaire vérifie que chaque fichier servi sous `/app` y figure.
- `partialPrefetching` passe à `false` (next.config.ts). Avec le préchargement partiel, une page chargée d'avance ne contenait que sa coquille : au toucher, le téléphone redemandait les données au serveur (mesuré : 0,8 s sur réseau lent, comme sans préchargement). Sans lui, la page arrive avec ses données : 0,2 s au toucher, le temps de la transition. Les liens ordinaires ne chargent toujours que jusqu'à leur première limite.
- Coût : jusqu'à 40 rendus de pages côté serveur à l'ouverture d'un écran, pour une personne connectée au téléphone.
- Rien n'est préchargé avec l'économiseur de données ou en 2G, pour respecter le réseau lent (règle d'or 9).
