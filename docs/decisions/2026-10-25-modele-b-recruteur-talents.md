# Modèle B recruteur, M6 · Talents au téléphone (25/10/2026)

Choix faits pour la section 06 (`docs/modele-b-recruteur/mobile/captures/INDEX.md`), au plus simple dans le respect des règles d'or.

- **Découvrir** : les talents visibles (profil « visible des recruteurs » ou anonyme) qui ont une compétence des offres en ligne (l'offre choisie, ou les cinq plus récentes pour « Toutes mes offres »), classés par le score fixe de la partie 08 (le meilleur parmi les offres comparées). Une suggestion ne consomme pas de recherche du quota mensuel ; elle demande le droit `hire.talent_search` (sinon un renvoi vers les formules). Les membres de l'entreprise n'y apparaissent jamais (profil discret).
- **Masquer ce profil de mes suggestions** : table additive `HiddenTalentSuggestion` (migration `20261025233814_talent_suggestions_and_proposal_seen`), par membre et par entreprise. Le talent n'en sait rien ; la recherche le trouve encore.
- **Recherche en deux temps** : par compétence, métier ou ville, au plus douze talents visibles sous leur nom, sans score, comme la recherche de personnes de Jumanly ; elle demande le droit `hire.talent_search` et ne consomme pas le quota mensuel, qui reste celui de la recherche avec filtres et scores de l'ordinateur. Les « Suggéré par Orbi » de la planche 102 viennent avec Orbi (M7).
- **« Vue, sans réponse »** : colonne additive `ContactRequest.seenAt`, posée la première fois que le talent ouvre ses Messages (où les propositions sont listées). Rien d'autre n'est appris sur le talent.
- **Partager le profil à un collègue** : une notification au collègue (même entreprise seulement) avec le lien du profil ; l'ouverture par le collègue est journalisée comme toute consultation. Le partage dans Messages viendra avec la messagerie d'équipe (M7).
- **Télécharger le profil en PDF** : un PDF texte de ce que le recruteur voit (résumé tant que la personne n'a pas candidaté ou accepté), journalisé `talent.pdf`.
- **Signaler ce profil** : un membre d'une entreprise peut signaler un profil visible des recruteurs (avant, il fallait une connexion entre les deux personnes).
- **Réseau** : les connexions de la personne (jamais de l'entreprise) ; « À connaître » reprend les suggestions d'Explorer (talents visibles sous leur nom) ; « RH » marque une personne membre d'une entreprise.
- **Badge « CAP »** de la planche 108 : Jumanly n'a pas ce badge ; la preuve des compétences (« Vérifiée » ou « Déclarée ») le remplace.
- **Vivier** : listes personnelles ; le vivier partagé reste soumis à `org.talent_pools.shared` (la note nomme la formule la moins chère qui l'ouvre, lue en base).
- **Orbi « Qui proposer »** (planche 119) : construit avec Orbi en M7.
- **Options d'une liste** : la planche 105 n'en montre pas, mais l'ordinateur permettait de renommer et supprimer un vivier. Pour ne rien retirer au téléphone, un bouton « Options de la liste » ouvre une feuille : renommer, supprimer (la liste seulement, jamais les profils).
- **Anciens tests du téléphone** : la partie téléphone de « talents : recherche, profil, vivier… » (`mobile-recruteur-entretiens.spec.ts`) teste l'ancien écran ; elle est réservée à l'ordinateur et ses gestes sont repris dans `modele-b-recruteur-talents.spec.ts`. `hire-advanced.spec.ts` suit le nouveau parcours au téléphone (recherche par ville, « Proposer une offre », options d'une liste).
