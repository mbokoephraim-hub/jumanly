# Admin v2 · étape 4 : choix

Date : 15 octobre 2026

- **Stockage en base par défaut** : aucun stockage S3 n'est configuré en production et le projet
  n'embarque pas de client S3. Les justificatifs (petits et rares) sont donc gardés dans la table
  `StoredFile`, derrière l'interface `FileStorage`. Un pilote S3 pourra s'ajouter derrière la même
  interface quand les variables `S3_*` seront fournies.
- **4 Mo par envoi au lieu de 5** : une requête vers une fonction Vercel s'arrête à 4,5 Mo. La
  limite est par envoi ; l'organisation peut envoyer plusieurs fois (6 documents au plus).
- **Type vérifié par contenu** : PDF, PNG, JPEG, WEBP reconnus à leurs premiers octets ; le nom et
  le type annoncés par le navigateur ne comptent pas. Les fichiers sont servis avec
  `X-Content-Type-Options: nosniff`.
- **Suspension** : plutôt que de filtrer les offres dans les 30 requêtes publiques, les offres en
  ligne passent à « fermée » et leurs identifiants sont gardés sur l'organisation pour la
  réactivation. Un espace d'organisation suspendue n'est plus un espace actif (`getActiveSpace`),
  ce qui ferme Hire, ses exports et le côté recruteur de la messagerie.
- **Candidats prévenus** d'une offre retirée par une notification dans l'application (pas d'e-mail,
  pour ne pas dire publiquement pourquoi l'organisation est suspendue).
