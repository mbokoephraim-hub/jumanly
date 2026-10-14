# Espace connecté animé : messages (lot B)

Date : 14 octobre 2026. Brief : `docs/experience-animee/BRIEF-ESPACE-UTILISATEUR.md` § 4.

- **Interrogation plutôt que SSE.** Sur Vercel, une connexion SSE garde une fonction ouverte pour
  chaque personne connectée. La cloche interroge donc `/api/notifications` toutes les 60 s, et
  seulement quand l'onglet est visible ; c'est le repli prévu par le brief. La route ne fait que
  lire : marquer comme lu passe par une Server Action (`markAllNotificationsReadInPlace`).
- **Pas de bannière « e-mail non vérifié ».** better-auth refuse la connexion tant que l'adresse
  n'est pas vérifiée (`requireEmailVerification`) : personne n'arrive dans `/app` sans adresse
  vérifiée. La vérification réussie mène à la bienvenue, qui est animée.
- **Cloche en amélioration progressive.** Sans JavaScript, la cloche reste un lien vers la page des
  notifications. Le libellé accessible suit le nombre de non lues ; les trois formes (0, 1,
  plusieurs) sont rendues sur le serveur et passées au composant.
- **Message du jour sans décalage.** La place du message est réservée dans le bandeau, qu'il
  s'affiche ou non : rien ne bouge sous lui (CLS). Sans JavaScript, il reste caché ; la même
  information est dans « Votre prochaine étape ».
- **Tracés SVG.** La coche et le « j » se dessinent par `stroke-dashoffset`, comme le `.jm-draw`
  déjà en place sur l'accueil ; tout le reste n'anime que `transform` et `opacity`.
