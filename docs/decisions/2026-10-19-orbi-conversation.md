# Orbi : conversation libre et historique (talent lot 4 § 9), avancés hors de l'ordre des lots

- 19/10/2026 : Ephraïm a choisi de construire la conversation avec Orbi tout de suite, avant l'étape 7 du brief talent.
- Fonction IA `orbi_chat` : 1 crédit `ai.credits.monthly` par réponse, modèle rapide (`AI_MODEL_FAST`), via `runAi`
  (consentement, crédits, journal `AiUsage`). En Free (0 crédit), sans consentement ou en panne : réponse par
  règles qui mène vers l'outil du sujet, sans crédit pris, avec la raison et un lien (paramètres ou formules).
- Le modèle reçoit le profil professionnel (titre, poste visé, études, compétences, 5 expériences, candidatures et
  offres enregistrées récentes) et les 8 derniers messages ; jamais le nom, l'âge, la photo, le pays d'origine ou
  l'adresse. Orbi ne propose que des pages d'une liste fixe (`src/lib/orbi.ts`), jamais un lien libre.
- Échanges gardés (`OrbiConversation`, `OrbiMessage`) jusqu'à ce que la personne les efface ; inclus dans
  « Télécharger mes données » ; effacés avec le compte.
- Le « + » du champ commence un nouvel échange (la maquette ne précise pas son rôle). Le micro utilise la dictée du
  navigateur quand elle existe (`NEXT_PUBLIC_VOICE_PROVIDER`), sinon il n'apparaît pas.
