# Modèle B recruteur, M3 : le Fil du recruteur au téléphone

Date : 22/10/2026 · Lot M3 (`docs/modele-b-recruteur/`, captures 031 à 040).

1. **« À traiter » quitte le téléphone.** Au téléphone, l'onglet Fil (`/app/hire`) montre le Fil du recruteur, comme les captures. L'écran « À traiter » reste le premier écran sur ordinateur et tablette (inchangés). Les candidatures à examiner se retrouvent dans l'onglet Candidatures (refait en M5).
2. **Publier au nom de l'entreprise** : seulement pour un membre qui gère les offres (`hirePermissions(role).manage` : propriétaire, administrateur, recruteur). Un manager qui recrute ou un lecteur publie en son nom. Un recruteur indépendant (espace personnel) n'a pas de page d'entreprise : il publie en son nom.
3. **Offre jointe** : uniquement une offre **en ligne** de l'organisation active (`organizationId`), vérifiée côté serveur ; sans espace recruteur, aucune offre ne peut être jointe.
4. **Événement** : une date et une heure sont demandées ; une date passée (plus d'un jour) est refusée. La publication prend le type « event » déjà connu du Fil.
5. **Recherche du Fil** : « Rechercher dans » propose Tout, Publications, Personnes, Entreprises (jamais les offres ni les candidats de l'organisation). Avec « Tout », personnes et entreprises sont réunies sous « Personnes et entreprises », puis « Publications ». Les publications d'une personne bloquée n'apparaissent pas.
6. **« Orbi complète le texte »** ouvre la conversation d'Orbi avec le début du texte ; Orbi propose, la personne recopie ce qu'elle veut garder (aucune publication automatique). Les crédits suivent les règles habituelles de la conversation.
7. **Photo** : même chemin que pour un talent (photo réduite à 1280 px sur le téléphone, puis envoyée).
8. Aucune migration : les champs `organizationId`, `jobId` et `eventAt` de `FeedPost` existaient déjà.
