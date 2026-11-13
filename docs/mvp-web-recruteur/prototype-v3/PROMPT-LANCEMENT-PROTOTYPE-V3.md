# Prompt de lancement · Jumanly Hire v3 (application web recruteur)

À coller tel quel dans Claude Code, une session par lot. Le même prompt sert pour chaque lot : Claude Code prend le premier lot qui n'est pas encore fusionné.

```
Lis CLAUDE.md, puis docs/mvp-web-recruteur/prototype-v3/BRIEF-PROTOTYPE-V3.md.
Ouvre docs/mvp-web-recruteur/prototype-v3/jumanly-hire.html et les captures du lot (captures/clair, captures/sombre, captures/fenetres).

Mission : remplacer le design recruteur web actuel par ce prototype, À L'IDENTIQUE. On ne change rien :
mêmes couleurs, tailles, rayons, bordures, espacements, ordre des blocs, libellés, icônes, animations et mode sombre.
- Reprends code/hire-v3.css tel quel (préfixé une seule fois sous .hv3, voir le brief), sans modifier aucune valeur.
- Garde les mêmes noms de classes. Traduis en TSX le balisage des fonctions V.<vue>.r(tab) de code/hire-v3.js.
- Supprime l'ancien design recruteur ordinateur des écrans du lot (composants, styles, cadres hire-frame) ; ne touche jamais aux données (migrations additives seulement).
- Branche les vraies données des services hire-* ; les données du prototype sont fictives (seed de démo seulement).
- Textes dans textes/textes-application.md puis pnpm messages ; droits par clés ; Hire filtré par organizationId ; téléchargements et consultations journalisés.

Lots (un lot = une PR, dans cet ordre ; fais le premier qui n'est pas fusionné et ne commence pas le suivant) :
V3-1 Cadre : CSS v3, barre du haut, logo, rail, menu profil, mode sombre, recherche Ctrl K, en-tête de page et bouton Télécharger générique.
V3-2 Offres : accueil, liste des offres (cartes 3 par ligne), statistiques, rapport des offres, fiche offre, nouvelle offre (8 écrans).
V3-3 Candidats : pipeline, liste, comparer, fiche candidat (4 onglets), tests (3 onglets).
V3-4 Agenda, Messages, Vivier, Suivi automatique.
V3-5 Rapports, téléchargements (fenêtre + PDF, Excel, CSV) et les 6 modèles de documents.
V3-6 Équipe (inviter, attribuer, fiche membre), Profil et Réglages, Aide, Page entreprise, Formule.

Pour chaque lot : plan court, code, puis captures Playwright 1440 × 900 en clair et en sombre à comparer côte à côte avec celles du dossier (corrige tout écart), lint, types, tests, build, journal, puis la PR.
```

## Ordre et contrôle

- Six lots, six PR. Chaque PR montre ses captures avant et après dans sa description.
- Un écart avec la capture de référence est un bogue, pas un choix de design.
- Une fois le lot V3-6 fusionné, l'ancien prototype et le Modèle B recruteur web ne servent plus de référence.
