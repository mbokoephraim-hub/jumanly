# Alignement Hire v3, lot 3 (tests de compétences) : choix et écarts restants

Date : 14/11/2026.

Le lot 3 pose une première version des tests (M5 du brief MVP) pour que l'écran du prototype soit
vrai. Ce qui reste du lot M5 :

- **Une tentative par invitation** : les réponses vivent sur `SkillTestInvite` ; pas de table
  `SkillTestAttempt` séparée, pas de jeton d'accès sans compte (le candidat ouvre le test connecté,
  depuis le message de l'entreprise).
- **Types de questions** : « choix unique » et « réponse écrite ». Les types `multi` et `task`
  (fichier ou lien) viendront avec M5.
- **Orbi** ne génère pas encore de questions : « Orbi propose » montre des modèles de la
  bibliothèque, que le recruteur copie et relit. La génération (journalisée dans `AiUsage`) viendra
  avec M5.
- **Envoi** à la main, aux candidats actifs de l'offre qui ne l'ont pas reçu. L'envoi automatique à
  la candidature ou à une étape, le chronomètre, la sauvegarde à chaque réponse et le temps
  supplémentaire viendront avec M5. Les relances de test arrivent avec le suivi automatique (lot 4).
- **Bibliothèque** : six modèles réels (le prototype en annonce huit) ; aucun chiffre inventé.
- **Formule annuelle `hire_business`** (lot M1, autre fil) : la clé `hire.assessments` existe déjà ;
  la formule devra l'avoir à `true` à sa création.
- Le score de test n'entre pas encore dans la note Confiance ni dans la short-list.
