# JUMANLY · Cahier des charges pour Claude Code (v1.0, octobre 2026)

Ce dossier contient tout ce qu'il faut pour faire développer l'application web Jumanly par Claude Code, étape par étape.

## Comment l'utiliser

1. Créez un dépôt GitHub vide (par exemple `jumanly`).
2. Copiez **le contenu de ce dossier** à la racine du dépôt : `CLAUDE.md`, `PROMPT-DEMARRAGE.md`, `docs/`, `textes/`, `ressources/`. Le fichier `jumanly-cahier-des-charges.pdf` n'est pas nécessaire dans le dépôt : il sert à la lecture.
3. Ouvrez le dépôt dans Claude Code (terminal, application de bureau ou claude.ai/code).
4. Collez le contenu de `PROMPT-DEMARRAGE.md`. Claude Code lit le cahier des charges, résume, pose ses questions, puis réalise l'étape E0.
5. Pour chaque étape suivante, collez le prompt de l'étape fourni dans `docs/specifications.md (partie 12)`, vérifiez le résultat, puis passez à la suivante.

## Contenu

| Élément | Rôle |
|---|---|
| `CLAUDE.md` | Règles permanentes, lues automatiquement par Claude Code à chaque session |
| `PROMPT-DEMARRAGE.md` | Le prompt principal à coller au démarrage |
| `docs/specifications.md`, partie 01 | Vision, publics, modules, principes, lancement |
| `docs/specifications.md`, partie 02 | Technologies recommandées, arborescence, variables d'environnement |
| `docs/specifications.md`, partie 03 | Schémas d'architecture, moteur de droits, tâches de fond |
| `docs/specifications.md`, partie 04 | Schéma des données (diagramme entité-relation) et tables |
| `docs/specifications.md`, partie 05 | Forfaits, matrice des droits et quotas, rôles, cycle d'abonnement |
| `docs/specifications.md`, partie 06 | Schémas des parcours : inscription avec forfait, candidature, recrutement, paiement, partenaires, formation |
| `docs/specifications.md`, partie 07 | Toutes les pages, publiques et connectées, avec l'étape de livraison |
| `docs/specifications.md`, partie 08 | Logique du matching : critères, poids, score, « Pourquoi ? », garde-fous |
| `docs/specifications.md`, partie 09 | Paiements Mobile Money et carte, abonnement prépayé |
| `docs/specifications.md`, partie 10 | Sécurité, données personnelles, modération |
| `docs/specifications.md`, partie 11 | Charte appliquée à l'interface |
| `docs/specifications.md`, partie 12 | Étapes E0 à E11, définition de fini et prompt de chaque étape |
| `textes/textes-application.md` | Tous les textes de l'application dans un seul fichier, en 10 parties, prêts à intégrer |
| `ressources/` | Jetons CSS, logos, favicon, 41 icônes en 3 styles, personnages illustrés (SVG et PNG), motifs, formes, fonds |
| `jumanly-cahier-des-charges.pdf` | Version de lecture de l'ensemble, schémas compris |
| `jumanly-cahier-des-charges.zip` | Tout le contenu à déposer dans le dépôt, en une archive |

## Points à valider par l'équipe Jumanly

- **Quotas chiffrés** (crédits IA, simulations, recherches) : valeurs provisoires marquées « P » dans le doc 05, à calibrer selon les coûts.
- **Score de compatibilité visible par tous les talents**, y compris Free (doc 08, § 8.6) : proposé pour l'inclusion, à confirmer.
- **Visibilité du profil par défaut** (doc 10, § 10.6) : proposition « visible des recruteurs », à confirmer.
- **Fournisseur Mobile Money** et passerelle carte (doc 09) : à choisir pendant le test fermé.
- **Délai de grâce** de 3 jours et règles de prorata, résiliation, remboursement : à fixer dans les conditions commerciales.
- **Pages légales** : gabarits à faire valider par un juriste (raison sociale, adresse, juridiction, hébergeur à compléter).
- **Champ téléphone dans le profil et le CV du talent** : aucun n'est prévu (la règle « pas de téléphone » vise les contacts de Jumanly) ; à confirmer, car un CV en comporte souvent un.
- **Étapes du pipeline** : Nouvelles, Présélection, Test, Entretien, Offre, Recruté, Non retenu (la maquette 07 en montrait d'autres) ; modifiables par offre.
- **Rétrogradation d'une organisation** : offres et membres au-delà des limites mis en pause, sans suppression (proposition).
- **Éléments des maquettes écartés** faute de source : alertes WhatsApp, mentors, groupes, masterclass, « Jumanly Meet », chiffres d'employeurs.
- **Site web** `jumanly.io` : déduit de l'adresse e-mail, à confirmer.

## Sources

Note conceptuelle JUMANLY v2.0 (octobre 2026), charte graphique v1, maquettes UI/UX v1, brochures tarifaires v1. L'écran 09 « formules » des maquettes contient des avantages qui ne figurent pas dans la note ; ce cahier des charges suit la note.
