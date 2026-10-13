# Ressources de marque Jumanly

Fichiers à copier dans le projet à l'étape E0 (`public/` pour les images, `src/styles/` pour les jetons).

| Dossier | Contenu | Usage dans l'application |
|---|---|---|
| `jumanly-tokens.css` | Couleurs, dégradés, typographie, rayons | `src/styles/tokens.css`, branché sur Tailwind |
| `logos/` | Logo horizontal, vertical, logotype, symbole (SVG) et favicons (PNG, SVG) | En-tête, pied de page, e-mails, favicon, PWA |
| `icones/trait/` | 41 icônes de la marque, trait Sapin, 24 px, trait 2 px (`jm-<nom>.svg`) | Icônes par défaut de l'interface |
| `icones/trait-blanc/` | Les mêmes en blanc | Sur fond Sapin ou Nuit (barre latérale) |
| `icones/duo/` | Les mêmes avec pastille Lime | Mise en avant (cartes de modules, site public) |
| `icones/jumanly-icones-sprite.svg`, `icones.json` | Sprite SVG unique et liste des icônes | Composant `<Icon name="…" />` |
| `illustrations/svg/`, `illustrations/png/` | Les personnages un par un, fond transparent : Amani (la talent), Kofi (le jeune diplômé), Nadia (la recruteuse), M. Diallo (le dirigeant), Fatou (la formatrice), en 6 poses (`repos`, `salut`, `joie`, `montre`, `telephone`, `perplexe`), et Orbi (l'assistant IA) | Site public, états vides, écran de bienvenue, erreurs ; Orbi uniquement pour l'IA |
| `illustrations/planche-personnages.png` | Le casting complet | Référence |
| `motifs/` | 6 motifs en 3 coloris (SVG) | Fonds de sections du site public |
| `formes/` | 12 formes de la marque (SVG) | Décor ; orbe et étincelle réservés à l'IA |
| `fonds/` | 10 fonds 16:9 (SVG et PNG) | Héros et bandeaux du site public |

Conseils pour les illustrations :
- `perplexe` convient aux erreurs et aux pages introuvables, `joie` aux succès (candidature envoyée, attestation obtenue), `salut` à l'accueil et à la bienvenue, `telephone` et `montre` aux sections qui présentent l'application.
- Préférer les SVG (légers, nets à toutes les tailles) ; les PNG servent aux e-mails.
- Les prénoms des personnages sont encore à valider.
