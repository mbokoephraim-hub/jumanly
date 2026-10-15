# Admin v2 · étape 6 : écarts et choix

- **Nouvelle dépendance `sharp`** (0.35) pour la couverture : recadrage 16:9 et WebP en trois
  largeurs côté serveur. C'est la bibliothèque qu'utilise déjà Next.js pour ses images ; aucun
  service externe.
- **Stockage des médias** : sous `public/` dans l'interface `src/server/storage` (pilote `database`
  aujourd'hui), servis par la route publique `/medias/[...key]`, seule à lire ce préfixe. Les
  justificatifs privés restent hors de `public/`. Passer à un stockage objet (S3) ne change que le
  pilote.
- **Vidéo** : l'envoi direct vers Bunny Stream (protocole TUS, signature
  `sha256(bibliothèque + clé + expiration + vidéo)`) n'a pas pu être essayé sans clés ; il
  demande `BUNNY_STREAM_LIBRARY_ID` et `BUNNY_STREAM_API_KEY`. Sans hébergeur, le site garde
  lui-même les vidéos de 4 Mo au plus (limite d'une requête sur Vercel) : pour la production, une
  vraie vidéo passe par Bunny.
- **Sous-titres** : la transcription de la leçon tient lieu de sous-titres pour l'instant ; les
  fichiers de sous-titres de Bunny pourront s'ajouter quand l'hébergeur sera branché.
- **Copie d'une formation** sans couverture : la copie en reçoit une avant publication, ainsi les
  fichiers de l'original peuvent être remplacés sans casser la copie.
- **Couverture obligatoire** pour publier, comme le demande le plan ; les formations déjà publiées
  sans image restent en ligne (le contrôle ne joue qu'au passage en « publiée »).
