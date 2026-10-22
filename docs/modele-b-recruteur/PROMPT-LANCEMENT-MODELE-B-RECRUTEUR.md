# Prompt à coller dans Claude Code · Modèle B recruteur et administrateur

À coller tel quel dans une nouvelle session Claude Code ouverte sur le dépôt `jumanly`, avec la branche `main` à jour. Ce prompt ne se lance qu'une fois l'étape 1 (talent) validée par Ephraïm.

---

Tu travailles sur Jumanly. Lis d'abord ces documents, dans cet ordre :

- `CLAUDE.md` ;
- `docs/PLAN-REFONTE-EN-3-ETAPES.md` ;
- `docs/modele-b-recruteur/BRIEF-MODELE-B-RECRUTEUR-CLAUDE-CODE.md` ;
- les index `docs/modele-b-recruteur/mobile/captures/INDEX.md` et `docs/modele-b-recruteur/web/captures/INDEX.md` ;
- les sources `mobile/maquette/` et `web/maquette/`.

Le Modèle B recruteur est **la seule référence** pour l'interface :

- du recruteur, sur mobile (390 px), sur tablette et sur ordinateur ;
- de l'administrateur d'entreprise, sur ordinateur uniquement.

Il remplace les planches recruteur et admin de `docs/refonte-mobile/` et de `docs/refonte-web/`. Ce qui a été codé d'après ces planches est refait. Les règles métier ne changent pas. On ne supprime **aucune donnée** : les migrations sont additives et nommées clairement.

Méthode :

- Fais l'étape 2 (lots R0 à R8 du brief), puis arrête-toi : écris le rapport dans `docs/journal.md`, avec les captures dans `captures/etape-2/`, et attends la validation d'Ephraïm. Ne commence l'étape 3 (lots A1 à A6) qu'après cette validation.
- Commence par le diagnostic R0, puis enchaîne sans attendre.
- Un lot correspond à une branche et une PR. Chaque PR liste la correspondance entre capture et écran codé, ainsi que les fichiers supprimés.
- Pour chaque écran, ouvre la capture et le fichier `.dc.html` correspondant. Reproduis fidèlement la mise en forme, les textes et les états : les valeurs exactes sont dans le fichier. Tout est en sombre.
- Respecte les règles de comportement :
  - aucun clic vide ;
  - recherche en deux temps ;
  - retour clair ;
  - jamais d'écran vide ni de noir entre deux écrans, jamais de roue qui tourne.
- Respecte les règles d'or :
  - candidater est toujours gratuit ;
  - les droits se testent par clés, jamais par nom de forfait ;
  - Orbi recommande, l'humain décide : aucun rejet automatique, et un « Pourquoi ? » sur chaque score ;
  - chaque consultation de profil est journalisée ;
  - les requêtes Hire sont filtrées par `organizationId` ;
  - aucun numéro de téléphone de Jumanly ;
  - aucun texte en dur (`textes/textes-application.md`, puis `pnpm messages`) ;
  - les données de démonstration sont fictives, en local et en preview seulement.
- Définition de fini : § 7 du brief.

En cas d'ambiguïté, choisis l'option la plus simple qui respecte les règles d'or, note-la dans `docs/decisions/` et continue.
