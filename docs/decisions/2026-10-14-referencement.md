# Référencement : moteurs de recherche et assistants IA (14 octobre 2026)

Demande du propriétaire : être visible sur Google, les autres moteurs et les assistants IA.

1. **Assistants IA autorisés** : `robots.txt` nomme les robots des moteurs et des assistants IA
   (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…) avec les mêmes règles que `*`. Ce choix
   autorise aussi l'entraînement des modèles sur les pages publiques (jamais sur l'espace connecté).
   Pour revenir dessus, retirer les robots d'entraînement de `namedCrawlers` et les mettre en
   `disallow: "/"`.
2. **`/llms.txt`** (format llmstxt.org) généré depuis les textes et la base : pages publiques,
   formations publiées, offres ouvertes (100 au plus chacune). Jamais de profil ni de portfolio.
3. **Portfolios toujours non indexés** (décision E10 inchangée). Une option « visible dans les
   moteurs » choisie par le talent pourra être ajoutée si le propriétaire le souhaite.
4. **Vérification des moteurs par DNS** (enregistrement TXT chez Hostinger), pas par balise dans le
   code : une propriété « Domaine » couvre `jumanly.io` et `www`, et Bing l'importe depuis Google.
5. `JobPosting` complété (salaire, localisation à distance, `directApply: false` car la candidature
   passe par un compte gratuit) ; `Organization` + `WebSite` sur l'accueil, contact par e-mail
   uniquement (règle d'or 8).
