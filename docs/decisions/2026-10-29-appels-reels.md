# Appels réels du Chat, audio et vidéo (29/10/2026)

Demande d'Ephraïm : les appels vidéo n'affichaient pas l'image (le fournisseur était factice), il faut un bouton
audio et un bouton vidéo, que la personne appelée puisse accepter en audio ou en vidéo, et qu'on s'entende et se
voie réellement. Les vocaux mettaient du temps à partir.

## Choix

- **WebRTC de téléphone à téléphone** (`VIDEO_CALL_PROVIDER=webrtc`, par défaut) plutôt qu'un service payant
  (LiveKit, Daily, Twilio) : aucun compte à créer, aucun coût, la voix et l'image ne passent pas par Jumanly
  (chiffrement de bout en bout DTLS-SRTP). Le serveur ne fait que transmettre les deux descriptions de
  connexion (SDP) pendant la sonnerie, par `/app/appels` (interrogé toutes les 4 s dans tout l'espace connecté,
  1,5 s pendant qu'on appelle), puis les efface à la fin de l'appel.
- **Relais TURN facultatif** (`CALL_TURN_URLS`, `CALL_TURN_USERNAME`, `CALL_TURN_CREDENTIAL`) : sans lui, l'appel
  peut échouer quand les deux téléphones sont derrière un opérateur mobile qui les cache (cas fréquent). À
  brancher avant l'ouverture au public (par exemple Metered ou Cloudflare).
- Les deux côtés négocient toujours un canal son et un canal image : couper ou rallumer la caméra pendant
  l'appel ne demande pas de nouvelle négociation. Si l'appelé accepte en audio, la caméra de l'appelant s'éteint.
- Le fournisseur `fake` reste pour le local et les tests e2e ; il est ignoré en production (`VERCEL_ENV`).
- Vocaux : enregistrés à 24 kb/s (≈ 180 Ko la minute), affichés tout de suite dans la discussion, et les
  notifications / e-mails partent après la réponse (`after()`), pour tous les messages.
