# Jumanly · Modèle B recruteur et administrateur, 22/10/2026

Ce fichier est le journal de conception. La référence pour coder est `BRIEF-MODELE-B-RECRUTEUR-CLAUDE-CODE.md`, qui l'emporte en cas d'écart.

- Mobile et tablette : https://claude.ai/artifact/2R11i4PDVMPuxYjJpLGdjx (`mobile/`, 197 planches, sans les anciennes planches « RecruteurWeb », remplacées par `web/`).
- Ordinateur : https://claude.ai/artifact/EHecvWavsiB4vmknL8Jghz (`web/`, 91 planches).

## Décisions d'Ephraïm (22/10/2026)

- **Logique et barre** :
  - même logique que le talent (`docs/modele-b/`) : sombre, peu d'icônes, aucun clic vide, recherche en deux temps, Orbi flottant ;
  - le recruteur est d'abord une personne ;
  - barre du bas : Fil · Offres · Candidatures · Talents · Messages.
- **Canvas** : il est réservé au recruteur, sans écrans talent.
- **Ouverture et inscription** : l'ouverture ressemble à celle du talent, avec des questions sur le rôle dans l'entreprise. Si l'entreprise est sur Jumanly, le recruteur fait une demande de rattachement pour afficher son logo. Viennent ensuite le pays, les contacts et le profil recruteur.
- **Défilements** : ils ne sont pas tous identiques, et chaque touche mène à une page.
- **Candidatures** : on y voit tout l'ATS.
- **Réseau** : le recruteur se connecte à d'autres personnes (onglet Réseau dans Talents, catégorie Réseau dans Messages).
- **Fil** : publications de 220 caractères au plus.
- **Changer de profil** :
  - profil talent discret : l'entreprise du recruteur ne le voit pas, et il candidate ailleurs gratuitement ;
  - profil entreprise, réservé à l'administrateur.
- **Pages entreprise** : l'onglet Membres regroupe les personnes qui déclarent y travailler, avec « Se connecter » à chacun ou à tous. Un bandeau indique les membres de votre réseau qui y travaillent. L'administrateur est prévenu et peut confirmer, mais ce n'est pas obligatoire : sans réponse, la mention « Indiqué par la personne » s'affiche. Les invitations sont limitées à 50 par jour.
- **Pilotage** : agenda (jour, semaine, mois, disponibilités, synchronisation Google et Outlook) ; équipe (droits par membre, tâches Attribuée → Acceptée → En cours → Terminée) ; tableau de bord ; Mon espace ; 4 modèles de rapports PDF.
- **Ordinateur** : un canvas à part, de A à Z (site, connexion, inscriptions, appli), avec une interface pour la recruteuse (Nadia) et une pour l'administrateur (Joseph). L'administration d'entreprise est réservée au web.
- **Export** : toutes les formules Company exportent leurs rapports (`docs/decisions/2026-10-22-export-rapports-company.md`).

## Choix notés en cours de route

- Le vivier est personnel ; le vivier partagé suit `org.talent_pools.shared`.
- La formule est en lecture seule pour le recruteur et gérée sur le web par l'administrateur.
- Le téléphone du recruteur n'est visible qu'en entretien ou par son équipe.
- Les crédits Orbi affichés varient d'une planche à l'autre (310 ou 110 restants). Ce sont des valeurs de démonstration : le code lit le quota réel.
- Les dates des PDF de rapports datent d'avant l'alignement sur le calendrier (semaine du lundi 19 au vendredi 23/10). Les écrans font foi.

## Fichiers

- `mobile/maquette/` et `web/maquette/` : les pages `.dc.html`, le `canvas.json` et les rapports PDF.
- `mobile/captures/` et `web/captures/` : les captures, avec leur `INDEX.md`.
- `generateurs/` : les scripts `gen_*.py` et `*_logic.js`, `build_canvas.py` (mobile), `build_w_canvas.py` (web), `pdf/rapports.py`, et les outils de test `tg.js`, `tg2.js`, `bal.py`, `rendu.js`, `capt_all.js`. Ils s'exécutent depuis un dossier qui contient `canvas/project/`.
