# Prompt à coller dans Claude Code · Modèle B (espace talent mobile)

À coller tel quel dans une nouvelle session Claude Code ouverte sur le dépôt `jumanly` (branche `main` à jour).

---

Tu travailles sur Jumanly. Lis d'abord `CLAUDE.md` et `docs/PLAN-REFONTE-EN-3-ETAPES.md`, puis `docs/modele-b/BRIEF-MODELE-B-CLAUDE-CODE.md`, `docs/modele-b/captures/INDEX.md` et les sources `docs/modele-b/maquette/`.

Le Modèle B est **la seule référence** pour l'interface de l'espace talent sur mobile (390 px). Il remplace les planches talent de `docs/refonte-mobile/` : ce qui a été codé d'après elles est refait. L'espace recruteur, l'administration d'entreprise et les règles métier ne changent pas. On ne supprime **aucune donnée** d'utilisateur (migrations additives, nommées clairement).

Méthode :

- Commence par le lot B0 : le diagnostic dans `docs/journal.md` (écrans existants, écrans à refaire, fichiers à supprimer), puis enchaîne sans attendre.
- Un lot = une branche et une PR, dans l'ordre B1 à B9 du brief. Chaque PR liste la correspondance capture → écran codé et les fichiers supprimés.
- Pour chaque écran, ouvre la capture et le fichier `.dc.html` correspondant, et reproduis fidèlement la mise en forme, les textes et les états (valeurs exactes dans le fichier). Les photos sont dans `docs/modele-b/images/`. L'interface talent mobile est uniquement en sombre.
- Respecte les trois règles de comportement : aucun clic vide, recherche en deux temps, retour clair. Respecte la règle du mouvement : jamais d'écran vide ni de noir entre deux écrans, les 5 onglets restent montés, tout est préchargé pendant le logo (1,2 s, logo seul), jamais de roue qui tourne.
- Respecte les règles d'or : candidater toujours gratuit ; droits par clés, jamais de nom de forfait ; Orbi propose, l'humain décide ; aucun numéro de téléphone Jumanly ; aucun texte en dur (`textes/textes-application.md` → `pnpm messages`) ; données de démonstration fictives, local et previews seulement.
- Définition de fini : § 7 du brief.
- À la fin de B9 : un rapport dans `docs/journal.md` (fait, reste, captures dans `captures/etape-1/`), puis arrêt en attendant la validation d'Ephraïm.

En cas d'ambiguïté, choisis l'option la plus simple qui respecte les règles d'or, note-la dans `docs/decisions/` et continue.
