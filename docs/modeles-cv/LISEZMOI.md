# Modèles de CV Jumanly (v1, 14 octobre 2026)

À lire en premier : **SPECIFICATION-MODELES-CV.md** (la spécification complète pour Claude Code).

- `modeles/planche-15-modeles.png` : les 15 modèles d'un coup d'œil.
- `modeles/pdf/` : chaque modèle en PDF A4, plus 8 variantes (couleur, police, sans photo, titres en anglais…).
- `interface/` : l'écran de choix des modèles et le panneau de mise en forme, aux couleurs de Jumanly.
- `MESSAGE-CLAUDE-CODE.txt` : le message à coller dans Claude Code après avoir copié ce dossier dans le dépôt sous `docs/modeles-cv/`.
- `jumanly-modeles-cv.zip` : tout le dossier, prêt à déposer.

Pour regénérer : `cd source && python3 modeles.py && NODE_PATH=/opt/node-tools/node_modules node rendu.js && python3 apercus.py && python3 interface.py && NODE_PATH=/opt/node-tools/node_modules node ../../../maquettes-ui/source/rendu_pages.js jobs-interface.json`
