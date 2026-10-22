# Compte recruteur depuis un compte talent, suppression immédiate, Fil professionnel (22/10/2026)

Demande d'Ephraïm du 22/10/2026, quatre corrections.

## 1. Passer d'un compte talent à un compte recruteur

- Téléphone : Paramètres › Recrutement › « Passer en compte recruteur » (feuille de confirmation).
  Ordinateur : Compte › Espaces › « Passer en compte recruteur ».
- `becomeRecruiterAction` (`src/server/actions/hire.ts`) : si la personne travaille déjà dans un espace
  recruteur, elle y entre ; sinon une organisation à son nom est créée (`setupAccount`, profil `rh`, nom
  vide) et elle arrive sur les premiers pas recruteur (`/app/bienvenue` : pour qui elle recrute,
  l'organisation, ou demander à rejoindre une organisation existante).
- Le profil talent reste intact ; le retour se fait depuis le compte de l'espace recruteur.

## 2. Suppression du compte : immédiate et totale

- Plus de délai de 30 jours (`DELETION_GRACE_DAYS` supprimé). `deleteAccount` (paramètres) appelle
  `eraseAccount` (`src/server/services/account-deletion.ts`) : la ligne `User` est supprimée et les
  cascades emportent profil, CV, documents, candidatures, publications, relations, notifications,
  historique. Avant cela sont effacés ce que les cascades n'atteignent pas : abonnements, compteurs,
  dérogations, coordonnées de facturation, empreinte de matching, messages envoyés, conversations tenues
  avec des recruteurs.
- L'adresse e-mail est libre : une nouvelle inscription crée un compte neuf, sans rien d'avant.
- **Écart assumé** : les paiements et factures sont gardés (obligation comptable, partie 09), sans lien
  vers un compte existant ; le journal garde « un compte a été supprimé » (`user.erase`), sans nom ni
  e-mail.
- Un propriétaire d'organisation reste bloqué s'il y a d'autres membres, des offres ou des entités :
  il transfère d'abord. Un espace recruteur vide (ouvert depuis un compte talent et jamais utilisé)
  part avec le compte.
- L'administration garde son anonymisation (`anonymizeUser`) et la purge des anciennes demandes
  programmées.

## 3. Publications limitées à 220 caractères

- `FEED_POST_MAX = 220` (`src/server/services/feed-limits.ts`) pour une publication, avec ou sans photo ;
  compteur visible sous le texte. Les réponses restent à 2 000 caractères.

## 4. « Pour vous » met en avant le professionnel

- `src/server/services/feed-rank.ts`, déterministe, sans modèle d'IA : score = fraîcheur
  (e^(-âge/36 h)) × (1 + bonus), bonus plafonné à 3 pour ne pas tout écraser (« pas à 100 % »).
- Bonus : offre jointe 1,5 ; nouveau poste 0,9 (1,5 s'il a été obtenu par une candidature Jumanly
  dans les 120 jours) ; événement 0,8 ; attestation ou réalisation 0,6 ; publication d'organisation ou
  texte aux mots du travail 0,4 ; auteur qui répond aux autres (jusqu'à 0,5), qui revient souvent
  (jours actifs sur 30, jusqu'à 0,5), qui a beaucoup de connexions (jusqu'à 0,6) ; réactions (jusqu'à 0,5).
- Variété : chaque publication suivante du même auteur compte 40 % de moins. Ma publication des
  10 dernières minutes reste en tête.
- Choisi parmi les 200 publications les plus récentes. « Abonnements » et « Entreprises » restent
  chronologiques. Aucune donnée exclue du matching (CLAUDE.md § 4) n'est utilisée.
