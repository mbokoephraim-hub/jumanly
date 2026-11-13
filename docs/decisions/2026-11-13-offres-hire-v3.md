# Offres du prototype v3 : écarts avec des données réelles (lot V3-2)

Le prototype v3 montre des chiffres fictifs. Règle d'or n° 11 : rien n'est inventé. Écarts retenus :

- **« Objectif » des cartes** (candidatures visées) n'existe pas en base : remplacé par « Postes »
  (nombre de postes de l'offre). Les brouillons montrent 4 étapes (celles du service) au lieu de 5.
- **« Partages »** n'est pas mesuré : la 4ᵉ tuile des statistiques et du rapport devient
  « Entretiens ».
- **Sources** : celles que l'application connaît (candidature directe, invitation, recherche de
  talents), pas LinkedIn / WhatsApp / page carrière, qui ne sont pas suivies.
- **Tests rendus** (accueil) reste à 0 jusqu'au lot V3-3 (tests).
- **Nouvelle offre** : les étapes 5 (équipe et étapes) et 6 (diffusion) montrent ce qui suit sans
  réglage fictif (pas d'interrupteur qui ne ferait rien) ; les poids du score se lisent à l'étape 3
  et se changent sur la page « Poids du score » quand le droit `hire.matching.weights` est ouvert.
  Ton / longueur de l'annonce et « Orbi suggère » ne sont pas branchés (pas de service) ; « Premier
  jet d'Orbi » utilise `jobWriterAction` (crédits et consentement vérifiés). Le test de compétences
  se choisit au lot V3-3.
- **Rapport** : « Enregistrer en PDF » ouvre la fenêtre d'impression (comme le prototype) ; la
  fenêtre de téléchargement journalisée arrive au lot V3-5. Les pistes et « À retenir » sont
  calculés à partir des chiffres de la période.
- La fenêtre « statistique détaillée » (`statModal`) n'est pas reprise : les tuiles et le tableau
  mènent au rapport et à la fiche de l'offre.
