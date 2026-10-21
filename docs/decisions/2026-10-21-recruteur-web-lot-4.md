# Recruteur web lot 4 : choix et écarts (21 octobre 2026)

Planche `docs/refonte-web/recruteur-4`. Le téléphone ne change pas (comparaison au pixel près à
390 px, clair et sombre : seules diffèrent les données de démonstration modifiées entre les deux
prises et l'indicateur de développement de Next).

1. **Tête de l'offre et quatre rubriques.** Sur ordinateur et tablette, l'ATS, le profil pour
   l'offre et la liste des retenus s'ouvrent sur l'offre (`OfferHead` : titre en `h1`, lieu,
   contrat, mode, date limite, actions et « … » ancré) et ses rubriques (`OfferTabs` :
   Candidatures, Analyse (ATS), Retenus, Statistiques). « Statistiques » mène au détail de
   l'offre, qui porte ses chiffres : pas de page de statistiques par offre en plus. Sur téléphone,
   la tête du lot mobile reste (`t-tete-f`), masquée seulement au-delà de 768 px.
2. **Le titre de la page devient celui de l'offre** sur ordinateur (comme la planche) ; le nom de
   l'écran (« Analyse », « Profil pour cette offre », « Liste des retenus ») passe dans les
   rubriques ou dans un titre de section. Le téléphone garde le titre de l'écran.
3. **Aperçu de l'e-mail.** « Voir le message et l'e-mail » rend l'e-mail exactement comme il part
   (`groupReplyEmailPreview`, même gabarit que l'envoi), par une route POST
   `/api/hire/reponses/apercu` : validation Zod → session → espace actif → droit `manage` et
   offre de l'organisation (`replyRecipients`) → service. Rien n'est envoyé ni enregistré ;
   l'adresse du talent n'apparaît pas. L'e-mail est montré dans un `iframe` `sandbox` vide.
   Aucun appel au modèle d'IA : la phrase personnalisée vient du même calcul que l'envoi.
4. **Fenêtre « Proposition acceptée ».** La nouvelle de la cloche ouvre la conversation avec
   `?acceptee=1` ; sur ordinateur une fenêtre l'annonce (profil, « Écrire à … »). Sur téléphone
   le paramètre est ignoré (la fenêtre n'existe qu'à 768 px et plus). Les anciennes notifications
   gardent leur lien sans le paramètre.
5. **Fenêtre « Proposition envoyée »** après « Envoyer à … » (`?ok=proposee`), sur ordinateur
   seulement ; le délai affiché vient de `CONTACT_EXPIRY_DAYS`.
6. **Notifications de l'ordinateur.** Réglage « Sur cet ordinateur » dans Paramètres ›
   Notifications (espace recruteur, ordinateur seulement). La permission du navigateur n'est
   demandée qu'au clic sur l'interrupteur, jamais à l'arrivée. Le choix est propre au navigateur
   (`localStorage`), pas en base. Le cadre recruteur lit `/api/notifications` toutes les minutes
   (pas de push serveur, pas de service worker) et affiche au plus trois nouvelles non lues.
7. **Export du rapport.** La fenêtre « Exporter le rapport en PDF » est un formulaire GET vers la
   route existante, qui revérifie `reports.export`. Période : 30 jours, trimestre, 12 mois ou
   personnalisée (du, au). Contenu : chiffres clés toujours, détail par offre et lecture d'Orbi
   au choix (le PDF saute ces sections). « Aperçu » ouvre le même PDF dans un onglet. **Écart :**
   « Offres · Choisir » (une partie des offres) n'est pas construit : le rapport n'a pas de filtre
   par offre aujourd'hui ; la fenêtre affiche « Toutes · N ».
8. **Mes propositions** : le tableau du lot 2 est gardé (la planche du lot 4 le dessine en
   cartes) pour ne pas défaire un écran validé ; « Relancer » et « Relancé » y sont déjà.
9. **Paramètres de l'offre (Attribution, Modèle de grille)** : nouvelle mise en forme en cartes
   sur ordinateur seulement (`t-rw-o9`). Sur téléphone, le bloc garde son rendu actuel, y compris
   son contraste imparfait en mode sombre (dette notée, hors du périmètre « téléphone inchangé »).
10. **Menus de la messagerie.** Le « … » de la conversation et le « + » de la zone de saisie
    s'ouvrent en menus ancrés sous leur bouton (`anchor`). La messagerie en trois colonnes, le
    panneau Orbi et « Alléger la messagerie » appartiennent au lot 3 : seuls les menus changent.
11. **Fenêtre « Quand analyser ? »** : garde la fenêtre centrée du cadre web (pas de mise en page
    propre) ; « Analyse programmée » prend la place du lancement dans la colonne de gauche de
    l'ATS, la liste des candidatures reçues à droite, comme la planche.
12. **Écran du talent « Proposition reçue »** (planche w7, côté talent) : non construit, il relève
    de l'espace talent (étape 1 close).
13. **Demande pour rejoindre** : la fiche de l'organisation trouvée (bandeau, logo) et les trois
    étapes « Demande envoyée » ne s'affichent qu'à partir de 768 px ; le parcours ne change pas.
