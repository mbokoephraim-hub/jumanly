# Mobile Talent v5 · écran d'objectif et « Pour moi » (prompt 3)

Date : 16 octobre 2026.

## Décision

- **Objectif sans migration.** L'écran d'objectif (`/app/bienvenue`, écrans 01-02) pose une seule
  question à trois réponses (emploi, compétences, carrière). La réponse est rangée dans le champ
  existant `TalentProfile.goal`. `homeFocus(goal)` (`src/lib/welcome.ts`) range les six objectifs
  du profil dans ces trois accueils ; un objectif plus fin déjà choisi (« Me reconvertir »,
  « Trouver des missions ») est gardé s'il tombe dans le même accueil.
- **« Plus tard » partout.** Rien n'est obligatoire : « Plus tard » (étape 1) et « Passer »
  (étape 2) mènent à l'action interrompue ou à « Pour moi ». L'étape 2 n'écrit que ce qui est
  rempli : un champ vide n'efface jamais le profil.
- **Écarts à la maquette 02.** Les puces « Domaine » et le niveau d'expérience ne sont pas posés :
  il n'existe ni référentiel de domaines pour le talent ni champ de niveau d'expérience, et on n'en
  invente pas. La visibilité du profil n'est plus demandée ici ; elle reste dans le profil
  (défaut inchangé).
- **« Pour moi » (`/app`).** Trois ordres selon l'objectif (écrans 03 à 05), données réelles seules
  (`src/server/services/for-me.ts`) :
  - offres : celles du matching (`recommendedJobs`) ; si le calcul ne peut pas tourner (pas de
    compétence, calcul désactivé), les offres ouvertes les plus récentes avec la mention
    « Sélection générale, non personnalisée » et un lien pour personnaliser ;
  - formations : en cours, puis celles qui comblent les écarts des offres recommandées, puis les
    plus récentes (intermédiaires et avancées pour l'accueil carrière) ;
  - compétences à renforcer (carrière) : demandées par les offres enregistrées ou candidatées et
    absentes du profil, avec leur « Pourquoi ? » ;
  - prochaines actions : entretiens à confirmer, documents demandés, messages non lus, formation
    en cours, profil à compléter ; trois au plus, section masquée si vide.
- **Carte objectif.** Trois chiffres réels ; un compteur à zéro n'est pas affiché, le pourcentage
  du profil l'est toujours. Sans objectif choisi, le titre est « Choisissez votre objectif ».
- **Éléments de maquette non repris** faute de donnée réelle : « Q 3/8 » sur la tuile Entretien,
  « Prochain exercice » (écran 04), « Reprendre votre diagnostic, interrompu à la question 12 »
  (écran 05). Ils reviendront si les prompts suivants exposent ces données.
- L'ancien tableau de bord reste à `/app/tableau-de-bord`.
