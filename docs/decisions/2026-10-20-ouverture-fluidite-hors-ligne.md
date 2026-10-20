# Ouverture, fluidité et hors connexion (20/10/2026)

Demande d'Ephraïm : logo animé à l'instant puis l'entrée après 3,5 s, menus instantanés, usage hors connexion
« comme WhatsApp ».

- **Logo hors de React.** Le logo est posé par un script en ligne avant le premier affichage, sur `<html>`, pour
  qu'il soit là avant le JavaScript de la page et survive au passage de `/demarrage` à `/app` (navigation
  côté client). Il ne bloque rien : l'espace se charge dessous pendant les 3,5 s.
- **`/demarrage` plutôt que `/app` comme page de départ.** Page statique, gardée par le service worker et servie
  sans attendre le réseau ; elle passe ensuite à `/app` (ou à la connexion). Les installations existantes
  prennent la nouvelle page de départ quand le téléphone relit le manifeste (Android) ou à la réinstallation.
- **Pas de `loading.tsx` dans l'espace connecté.** Un squelette générique donnait l'impression d'un
  téléchargement à chaque onglet. Sans lui, la navigation attend la page suivante en gardant la précédente.
  `src/app/admin/loading.tsx` est gardé (hors refonte talent).
- **Pas de `experimental.useOffline`.** Il laisse une navigation en échec en attente ; sans lui, Next recharge
  la page, que le service worker sert depuis l'appareil.
- **Pages gardées en clair sur l'appareil.** Comme une messagerie : ce qui a été vu reste lisible hors ligne.
  Garde-fous : effacement à la déconnexion (y compris une préparation encore en cours), pages de paiement et
  testeur jamais gardées, 60 pages au plus. Les actions (postuler, envoyer) demandent toujours le réseau ; les
  brouillons restent gardés comme avant (`src/lib/drafts.ts`).
- **Pas de `staleTimes`.** Garder les pages vues 3 min dans le navigateur rendait certains écrans périmés après
  une action (statut d'un compte, entretien confirmé) : essayé puis retiré. Les données restent toujours à jour.
