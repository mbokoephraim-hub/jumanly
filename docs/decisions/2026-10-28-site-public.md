# Nouvelle identité du site public (28/10/2026)

**Demande d'Ephraïm** : l'ancienne identité du site était incohérente ; s'inspirer de ses quatre images (mise en page claire et aérée, vert profond et Lime, cartes arrondies, grands titres, chiffres en ligne, boutons pilule sombres) tout en gardant l'identité du Modèle B de l'application.

- **Mise à jour du même jour** : Ephraïm trouvait la première version trop « site pour enfants » et hors Modèle B. Le site reprend donc le Modèle B sombre : fond Nuit (#0B1A1F), cartes Surface (#13282C) avec un filet fin, texte Crème, gris Brume, Lime réservé aux actions, étiquettes Néon sur vert foncé, police Sora.
- Mécanique : la classe `.jm-site-b` (`src/styles/site.css`, posée sur la mise en page publique et la 404) redéfinit les jetons dans ce périmètre (Papier → Nuit, Blanc → Surface, Sapin → Crème). Les fonds clairs (Lime, Néon, menthe, ambre, `.jm-light`) gardent les jetons d'origine, donc le texte reste Sapin sur Lime. Classe `.jm-card` pour les cartes.
- Plus de personnages illustrés, de formes ni de motifs sur le site public. Visuels : vraies photos fournies par Ephraïm (`public/photos/`, cadre `PhotoFrame`, texte alternatif dans `textes/`) et aperçus de l'application en HTML (`src/components/site/previews.tsx` : pipeline recruteur, offres compatibles avec score et « Pourquoi ? »). Aucune photo inventée de clients.
- Héros communs `SiteHero` et `HeroPanel`, boutons pilule `SiteButton` (`src/components/site/marketing.tsx`).
- Corrections au passage : page 404 dans la langue de la page, compteurs animés lisant les nombres anglais (`1,200`) et français (`1 200`), personnage du contact invisible sur fond Nuit.
