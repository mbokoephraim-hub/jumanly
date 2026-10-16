# Learn v2 · domaines du catalogue (16 octobre 2026)

- Un domaine est une table (`LearningDomain`) et non une liste figée : l'équipe les renomme,
  décrit, ordonne et en crée dans `/admin/formations/domaines`. Seul un administrateur en
  supprime un ; ses formations restent publiées, sans domaine.
- Une formation appartient à un domaine au plus. L'ancien thème (`Course.category`) est gardé
  pour ne rien casser ; la migration range les formations existantes d'après leur thème.
- La page d'un domaine est `/app/learn/explorer?domaine=<slug>` (et non une route
  `/explorer/[domaine]` comme proposé dans l'analyse) : elle se combine avec les autres filtres
  sans dupliquer la page.
- La ligne éditoriale (`originals`, `expert_series`, `partner_programs`) est un enum : elle
  change le badge de la carte et le filtre, pas les droits d'accès, qui restent ceux du niveau
  (`learn.catalog.level`).
- Retour arrière : `docs/learn-v2/retour-arriere/etape-1-domaines.sql` (supprime seulement ce que
  l'étape ajoute).
