# Hébergement de production sur Vercel

La page de déploiement d'applications Node.js de Hostinger restait bloquée (import GitHub et URL
publique, sur Edge comme sur Chrome). Le propriétaire a choisi Vercel, conçu pour Next.js ; le
domaine reste chez Hostinger, qui ne fait plus que le DNS. `vercel.json` fixe la commande de build,
la région (`fra1`, comme la base Neon) et la tâche horaire d'abonnement (Vercel Cron, qui appelle
la route en GET avec `CRON_SECRET`, d'où l'export `GET` à côté de `POST`).
