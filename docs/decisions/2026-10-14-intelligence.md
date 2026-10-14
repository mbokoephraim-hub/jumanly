# 2026-10-14 · Intelligence v1 : matching explicable et IA (E6)

Statut : accepté.

1. **Critères** : la partie 08 l'emporte sur les textes. Huit critères ; « contrat » couvre le type
   de contrat et la disponibilité et s'affiche « Contrat et disponibilité ». La proximité
   sémantique est « non applicable » tant qu'aucun vecteur n'existe (`EMBEDDINGS_PROVIDER` vide) :
   elle sort alors du numérateur et du dénominateur.
2. **Critères éliminatoires** : texte libre saisi par le recruteur, jamais évalué par la machine.
   Ils s'affichent « à vérifier » au talent et au recruteur ; aucune candidature n'est écartée.
3. **Score figé** : la candidature garde le score et l'explication du moment de l'envoi. Les
   candidatures plus anciennes que E6 reçoivent le leur à la première lecture.
4. **Poids** : une nouvelle version s'active tout de suite ; chaque score en cache porte sa
   version et se recalcule à sa prochaine lecture. Ajustement des poids par offre : reporté.
5. **Révision humaine** : une seule demande ouverte par talent et par offre. « Corrigé » recalcule
   le score et le fige de nouveau sur la candidature ; « Confirmé » exige une réponse écrite.
   Délai affiché : 5 jours ouvrés, à confirmer.
6. **Crédits IA** : lecture de CV 1 crédit, coach CV 2, diagnostic personnalisé 2. Les crédits
   sont rendus quand l'appel échoue ou que la sortie est refusée par la validation.
7. **Fournisseur** : `@anthropic-ai/sdk`, sorties structurées validées par Zod. Pas de modèle de
   secours en dur : le modèle vient de l'environnement. Sans `ANTHROPIC_API_KEY` (ou avec
   `AI_PROVIDER=fake`), un adaptateur factice renvoie les réponses par règles.
8. **Coût** : estimé avec une table de prix par million de jetons (`src/server/ai/prices.ts`).
   Un modèle absent de la table est signalé dans `/admin/ia` et son coût compte zéro.
9. **Coach CV sans invention** : une suggestion est refusée si son texte de départ a changé, si
   elle ajoute un chiffre ou nomme une compétence absente du CV.
10. **Import de CV** : texte collé seulement ; la lecture des PDF et Word est reportée. Sans
    consentement ou sans crédit, extraction gratuite des compétences du référentiel.
11. **Plan de progression** : construit par règles depuis le dernier diagnostic et les
    compétences manquantes ; aucun appel au modèle.
12. **Reportés** : analyse de CV pour les recruteurs (`hire_cv_analysis`), mesure du taux
    d'ouverture du « Pourquoi ? ».
