# Prompt à coller dans Claude Code · recruteur mobile (Modèle B)

Ce prompt se colle tel quel dans une nouvelle session Claude Code ouverte sur le dépôt `jumanly`, avec la branche `main` à jour. Il couvre uniquement l'appli recruteur au téléphone (390 px). La tablette, l'ordinateur et l'administration d'entreprise viendront ensuite, avec `PROMPT-LANCEMENT-MODELE-B-RECRUTEUR.md`.

---

Tu travailles sur Jumanly. Lis d'abord ces documents :

- `CLAUDE.md` ;
- `docs/PLAN-REFONTE-EN-3-ETAPES.md` ;
- `docs/modele-b-recruteur/BRIEF-MODELE-B-RECRUTEUR-CLAUDE-CODE.md`, en particulier les § 2 à 5 ;
- `docs/modele-b-recruteur/mobile/captures/INDEX.md`, sections 01 à 11 ;
- les sources `docs/modele-b-recruteur/mobile/maquette/`.

Pour les règles de mouvement communes (transitions, préchargement), reprends ce qui a été fait pour le talent : `docs/modele-b/BRIEF-MODELE-B-CLAUDE-CODE.md` § 3.

Ta mission : refaire l'appli recruteur au téléphone sur le Modèle B. Ce modèle est la seule référence à 390 px et remplace les planches recruteur de `docs/refonte-mobile/`. Ce qui a été codé d'après elles est refait, et l'ancien design recruteur mobile est effacé. Les données d'utilisateur ne sont jamais effacées : les migrations sont additives et nommées clairement. Ne touche pas aux écrans ordinateur, tablette ou administration d'entreprise.

Ce que tu dois reproduire :

- **Thème** : tout est en sombre.
- **Barre du bas** : Fil · Offres · Candidatures · Talents · Messages. Orbi est un disque menthe flottant, jamais en lime, et le compte s'ouvre par l'avatar.
- **Fidélité** : pour chaque écran, ouvre la capture et le fichier `.dc.html` correspondant, puis reproduis fidèlement la mise en forme, les textes et les états. Les valeurs exactes sont dans le fichier.
- **Règles de comportement** :
  - aucun clic vide : chaque bouton ouvre un écran, une feuille ou une confirmation, avec un retour ;
  - recherche en deux temps : d'abord les options de la page, puis les résultats dès la première lettre ;
  - défilements tels que sur les captures ;
  - jamais d'écran noir ou vide entre deux écrans, jamais de roue qui tourne.
- **Règles métier** :
  - candidater est toujours gratuit ;
  - les droits se testent par clés, jamais par nom de forfait ;
  - Orbi recommande, le recruteur décide : aucun rejet automatique, et un « Pourquoi ? » sur chaque score, sans donnée exclue ;
  - chaque consultation de profil est journalisée ;
  - toute requête Hire est filtrée par `organizationId` ;
  - le logo de l'entreprise s'affiche seulement après acceptation du rattachement ;
  - les publications du Fil font 220 caractères au plus ;
  - la formule est en lecture seule pour le recruteur ;
  - le profil talent discret n'est jamais visible par sa propre entreprise ;
  - aucun numéro de téléphone de Jumanly ;
  - aucun texte en dur (`textes/textes-application.md`, puis `pnpm messages`) ;
  - les données de démonstration sont fictives, en local et en preview seulement.

Méthode, avec un lot par branche et par PR, dans cet ordre :

- **M0 · Diagnostic** dans `docs/journal.md` : écrans recruteur mobiles existants, écrans à refaire, fichiers de l'ancien design à supprimer. Enchaîne ensuite sans attendre.
- **M1 · Coque** : barre à 5, Orbi flottant, avatar, recherche en deux temps, feuilles, transitions et préchargement.
- **M2 · Ouverture et inscription** (section 01) : rôle, entreprise, demande de rattachement et logo, pays et contacts, profil recruteur.
- **M3 · Fil** (section 02) : au nom du recruteur ou de l'entreprise.
- **M4 · Offres** (section 03) : indicateurs, publication en 5 étapes, partage, pause, clôture.
- **M5 · Candidatures** (sections 04 et 05) : tout l'ATS, la fiche de chaque candidat, planifier, évaluer, proposer, diagnostic, décisions.
- **M6 · Talents** (section 06) : recherche, vivier, propositions, onglet Réseau.
- **M7 · Messages** (section 07), plus **Notifications et Orbi** (section 10).
- **M8 · Compte** (section 08), **pages entreprise et membres** (section 09), **changer de profil** (section 11), puis **nettoyage** : ancien design recruteur mobile supprimé, anciennes routes redirigées, code mort retiré.

Chaque PR liste la correspondance entre capture et écran codé, ainsi que les fichiers supprimés.

Définition de fini de chaque lot :

- captures Playwright à 390 × 844 de chaque écran, comparées à `mobile/captures/`, écarts corrigés ;
- un test e2e qui touche chaque bouton du lot ;
- des tests en base pour l'isolation par organisation et le journal des consultations ;
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build`, `pnpm messages:check` et les e2e touchés passent ;
- `docs/journal.md` à jour.

À la fin de M8, écris un rapport dans `docs/journal.md`, avec les captures dans `captures/etape-2-mobile/`, puis arrête-toi en attendant la validation d'Ephraïm.

En cas d'ambiguïté, choisis l'option la plus simple qui respecte les règles d'or, note-la dans `docs/decisions/` et continue.
