# Refonte mobile, lot 5 : choix et écarts (19 octobre 2026)

- **Clé de signature.** Les attestations sont signées en Ed25519 avec `CERTIFICATE_SIGNING_KEY`
  (32 octets en base64). Sans elle, la clé est dérivée de `BETTER_AUTH_SECRET` : changer ce secret
  change la clé, et les anciennes attestations s'affichent alors « authentiques » sans mention de
  signature (jamais « modifiées »). À faire avant l'ouverture : définir `CERTIFICATE_SIGNING_KEY`
  dans Vercel et ne plus la changer.
- **Attestations délivrées avant le lot.** Elles sont signées à leur premier affichage par le
  talent ; leur score, domaine et compétences restent vides.
- **PDF « verrouillé ».** Le PDF porte le numéro et la signature dans ses métadonnées, sans
  chiffrement : la preuve reste la vérification en ligne (numéro ou code QR).
- **Quiz corrigé question par question.** La correction vient du serveur après la réponse, rien
  n'est enregistré avant la fin. Un quiz à essais limités ne corrige qu'au résultat, pour qu'on ne
  puisse pas essayer les réponses sans consommer d'essai.
- **« À revoir ».** Les questions ne sont pas reliées à une leçon : le résultat propose les leçons
  du module qui précèdent le quiz.
- **Exercice : 4 Mo au lieu de 5.** L'hébergeur refuse les envois de plus de 4,5 Mo. Orbi peut
  relire (carte d'information) ; la relecture par l'IA d'un fichier rendu viendra avec un droit.
- **Rechercher** a sa propre adresse (`/app/learn/rechercher`), que la recherche sous le titre
  d'Apprendre ouvre ; les anciens liens du catalogue y mènent avec leurs filtres.
- **Domaines.** Les tuiles « Par domaine » affichent les domaines de la base, avec leurs noms
  actuels (en anglais) : le renommage se fait dans l'admin, pas dans le code.
- **Module gratuit.** Une formation au-dessus de la formule montre ses leçons d'aperçu
  (`isPreview`) sans inscription ; la progression n'y est pas enregistrée.
- **« Visible sur mon profil ».** Une attestation masquée disparaît de la fiche candidat côté
  recruteur (compétences certifiées) ; le talent peut toujours la joindre à une candidature.
- **Parcours partagé.** Il n'existe pas de page publique de parcours : le lien partagé mène à la
  page connectée.
