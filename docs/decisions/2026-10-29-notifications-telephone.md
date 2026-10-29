# Notifications des messages sur le téléphone (29/10/2026)

Demande d'Ephraïm : voir un nouveau message même hors de l'application, un bandeau avec la photo quand on
est ailleurs dans l'application, la photo dans la liste des notifications, et une notification lue qui
disparaît aussitôt.

## Choix

- **Web Push** (le standard des navigateurs, sans service payant). Paquet `web-push`, derrière l'interface
  `src/server/adapters/push.ts` (factice avec `PUSH_PROVIDER=fake`).
- **Clés de signature (VAPID)** : prises de `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` si elles existent, sinon
  créées une fois par la plateforme et gardées en base (table `PlatformKey`). Rien à configurer dans Vercel.
- **Appareils** : table `PushSubscription` (un appareil suit la personne connectée dessus ; un appareil qui
  ne répond plus est oublié). Se déconnecter coupe les notifications de l'appareil (service worker).
- **Contenu** : comme les e-mails, on dit qui a écrit, jamais quoi (« Nouveau message de Sublime Koyi »).
  Envoyé pour les types « importants » (`importantNotificationTypes`) et selon les réglages de catégories.
- **Demande de permission** : seulement au toucher d'« Activer » (carte dans Chat, avec « Plus tard », et
  dans Notifications tant que ce n'est pas activé). Jamais d'invite à l'arrivée.
- **iPhone** : Safari n'envoie des notifications qu'à une appli ajoutée à l'écran d'accueil ; la carte le dit.
- **Bandeau dans l'application** : la cloche interroge le serveur toutes les 20 s (au lieu de 60 s) pendant
  que la page est visible ; un nouveau message montre le bandeau avec la photo.
- **Liste** : seules les notifications non lues s'affichent ; un nouveau message remplace la ligne non lue
  de la même conversation. L'auteur est gardé dans la notification (`actorId`) ; pour les anciennes, la
  photo vient de l'autre personne de la conversation.
