# Refonte étape 1 · web talent 3 (Apprendre sur ordinateur et tablette)

Écarts et choix par rapport au brief web et à la planche `docs/refonte-web/talent-3`.

1. **Adresses** : le brief cite `/app/apprendre/…` ; les routes existantes `/app/learn/…` sont gardées
   (pas de doublon, pas de redirection à maintenir).
2. **Parcours** : la planche montre « l'attestation de parcours ». Il n'existe qu'une attestation par
   formation dans les données : la carte de droite s'appelle « Attestations du parcours » et montre le
   modèle au nom du talent.
3. **Modèle d'attestation** : avant de finir, le détail d'une formation montre le dessin réel au nom du
   talent avec le numéro fictif `JMN-XXXX-XXXX`, sans score (`specimenDrawing`).
4. **Filtre « Disponibles hors connexion »** omis : aucune donnée ne dit qu'une formation l'est.
   Le filtre « Avec attestation » est ajouté (`attestation=1`, formations dont l'attestation est activée).
5. **Durées** : les tranches de durée existantes du filtre sont gardées.
6. **Formation verrouillée sur tablette** : même mise en page en colonnes que l'ordinateur.
7. **« Votre score pour cette offre passe de 86 à 91 % »** (formation terminée) omis : l'écart avant et
   après n'est pas calculé ; l'offre suivante garde son « Pourquoi ? ».
8. **Cadre W0** : la règle `main.t-colonne:has(> .t-large)` ne prenait jamais (les pages sont dans
   `.jm-page`, `app/app/template.tsx`) ; corrigée dans le bloc du lot, en ignorant les routes cachées
   par `cacheComponents`. L'en-tête mobile de l'accueil Apprendre est caché dès 768 px (`header.tsx`).
9. **Mode concentré** : décidé par l'adresse (une leçon `/app/learn/<formation>/<leçon>`). Le résultat
   d'un quiz et l'exercice, à la même adresse, remettent le cadre complet comme la planche
   (`FullFrame`, attribut `data-cadre-plein`).
10. **Orbi après un quiz** : texte déterministe (nombre de réponses à revoir), pas d'appel au modèle.
    « Vos réponses » montre l'énoncé de chaque question (la planche montre un thème, absent des données).
11. **Plan sur tablette** : la planche ne montre pas le plan de la formation ni celui des questions sur
    tablette ; ils sont cachés entre 768 et 1199 px, Orbi et le support passent côte à côte.
12. **Quiz** : pas de bouton fermer dans la tête web (planche) ; le rail reste disponible. Le résultat
    garde le bouton fermer.
13. **Vérification publique** : sortie du site marketing (`(public)`) vers un groupe `(verification)` au
    style talent (logo, « Vérifier une attestation » qui mène à `/attestations`). Le dessin n'est
    montré et servi que pour une attestation authentique et signée ; il ne figure pas au téléphone.
14. **Détail d'une attestation** : le bouton d'options (vérification en ligne, formation) est gardé dans
    la tête web.
15. **Mes formations** n'a pas d'écran dans la planche web : titre web, onglets, formations sur deux
    colonnes.
