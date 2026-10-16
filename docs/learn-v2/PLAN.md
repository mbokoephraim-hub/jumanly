# Learn v2 · plan

Analyse complète (existant, manques, modèle de données, plan) : document « Jumanly Learn, analyse et
plan » remis au propriétaire le 16 octobre 2026. On part du module Learn actuel, sans le
reconstruire ni supprimer de table ou de donnée.

## Phase 1

1. **Domaines et lignes éditoriales** : table `LearningDomain` (7 domaines créés par la migration
   `learn_domains`), `Course.domainId` et `Course.editorialLine` (Jumanly Originals, Expert Series,
   Partner Programs). Catalogue Explorer par domaine, filtres (niveau, durée, langue, accès,
   compétence, ligne éditoriale), administration `/admin/formations/domaines`. Retour arrière :
   `retour-arriere/etape-1-domaines.sql`.
2. **Parcours** : tables `LearningPath`, `LearningPathCourse`, `LearningPathFollow` (migration
   `learn_paths`). Section « Parcours » d'Explorer, page d'un parcours, « Parcours suivis »,
   administration `/admin/formations/parcours`. Retour arrière :
   `retour-arriere/etape-2-parcours.sql`.
3. **Reprise à la seconde près** : table `LessonProgress` (migration `learn_lesson_progress`),
   `POST /api/learn/position`, reprise dans le lecteur. Retour arrière :
   `retour-arriere/etape-3-reprise-video.sql`.
4. Learning Room : onglets résumé et transcription, sous-titres WebVTT, temps restant, barre
   compacte sur téléphone.
5. Statut « Validé » (Brouillon → En vérification → Validé → Publié → Archivé), historique des
   changements, validation par Jumanly avant publication, tableau de bord pédagogique.

## Phases suivantes

- Phase 2 : évaluations, devoirs remis, attestations (QR code), lien avec Career.
- Phase 3 : Coach IA et recommandations.
- Phase 4 : experts, institutions, cohortes.
