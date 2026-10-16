# Learn v2 · reprise des vidéos (16 octobre 2026)

- La position de lecture vit dans une table à part (`LessonProgress`), pas dans `Enrollment`.
  « Leçon terminée » reste un geste de l'apprenant (`Enrollment.completedLessons`) : regarder une
  vidéo jusqu'au bout ne la marque pas terminée toute seule.
- Le lecteur envoie la position toutes les 15 secondes de lecture, à la pause, à la fin et quand
  on quitte la page. Une route API (`POST /api/learn/position`) plutôt qu'une Server Action, car
  `navigator.sendBeacon` doit pouvoir l'appeler pendant la fermeture de la page.
- Pas de reprise dans les 5 premières secondes ni dans les 10 dernières : la vidéo repart du
  début.
- Seul un apprenant inscrit, dont la formule ouvre la formation, enregistre une position ; les
  aperçus publics et l'aperçu de l'admin n'enregistrent rien.
