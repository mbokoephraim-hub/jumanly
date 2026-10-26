# Modèle B recruteur, M7 : messages, notifications et Orbi au téléphone

Date : 26 octobre 2026. Lot M7 de `docs/modele-b-recruteur/BRIEF-MODELE-B-RECRUTEUR-CLAUDE-CODE.md`
(captures 120 à 134 et 180 à 184).

## Choix faits (option la plus simple qui respecte les règles d'or)

1. **Équipe = une table à part.** Les conversations entre deux membres d'une entreprise vivent
   dans `TeamThread` et `TeamMessage` (migration additive `20261026004024_team_threads`). Un talent
   ne peut pas y accéder ; un troisième collègue ou une autre entreprise non plus. Un collègue parti
   de l'entreprise : la conversation se relit, on ne peut plus lui écrire, elle sort de la liste.
2. **Réseau** = les propositions acceptées (la conversation avec le talent) et les relations
   personnelles du membre (conversations entre deux personnes, écrites en son nom, jamais au nom
   de l'entreprise). Les propositions pas encore acceptées restent dans Talents › Propositions.
3. **Aides à l'écriture** (« Orbi propose », « Modèles », « Joindre ») seulement avec un candidat
   ou un talent. « Orbi propose » écrit un brouillon dans le champ : rien ne part sans « Envoyer ».
4. **Modèles** : ceux de l'entreprise, sinon les modèles Jumanly (convocation, document, relance).
   Acceptation et refus restent dans la fiche de la candidature (réponse relue avant envoi).
5. **Fichier joint** : PDF ou image, 4 Mo au plus (limite déjà en place) ; le texte de l'écran dit
   « 4 Mo », pas « 10 Mo ».
6. **« Nouveau message »** : un candidat déjà en conversation ou un collègue. Un talent qui n'a pas
   candidaté se contacte par « Proposer une offre » (règle de confidentialité n° 5).
7. **Menu « ··· »** : fiche ou profil, couper les notifications (pour soi), épingler pour l'équipe,
   retirer de la messagerie de l'équipe (rien n'est effacé, comme à l'ordinateur).
8. **Notifications** : quatre onglets Tout, Candidatures, Entretiens, Réseau (chaque type est rangé
   dans un seul onglet ; ce qui n'entre dans aucun ne se voit que sous « Tout »). Au-dessus de la
   liste, les demandes pour rejoindre l'entreprise (administrateur, planche 183) et les offres qui
   se terminent, avec leurs boutons, comme à l'ordinateur. Ce qui n'est pas dit par une personne a
   une cloche à la place des initiales.
9. **Orbi** : « Qui attend une réponse de ma part ? », « Résumer mes non-lus », « Qui recevoir en
   premier ? », « Qui proposer pour mes offres ? » et « Que dois-je faire aujourd'hui ? » se
   répondent à partir des données de l'entreprise, sans crédit (score déterministe du doc 08,
   personne n'est écarté). Les autres questions et ce qui est écrit vont à la conversation d'Orbi
   (crédits de l'entreprise). La page Orbi du téléphone repart d'une conversation neuve ;
   l'historique reste sur ordinateur (`/app/orbi?c=`).

## Hors de ce lot

Les captures 126, 129 à 131 et 133 montrent des conversations de démonstration (Benjamin,
Nathalie, Christelle, Joseph) : les mêmes écrans servent, avec les données réelles.
