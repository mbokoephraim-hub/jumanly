# Refonte étape 1, lot mobile 7 : choix et écarts (19 octobre 2026)

Planche talent-4 § 7 (abonnement et paiement), § 8 (paramètres et aide), § 10 (mode sombre).
Ce lot termine l'espace talent mobile : l'ancien design talent est effacé (jamais les données).

- **Espaces organisation et partenaire inchangés.** Un membre d'organisation ou de partenaire
  (`getActiveSpace` / `getPartnerSpace`) garde jusqu'aux étapes 2 et 3 les anciennes pages,
  déplacées en composants : `HireBilling` (`src/components/billing/hire-billing.tsx`),
  `HireSettings` (`src/components/account/hire-settings.tsx`), `HireSearch`
  (`src/components/connect/hire-search.tsx`), et l'ancien `CheckoutPanel`. Les pages talent
  choisissent avec `inOrganizationSpace(userId)` (`src/server/talent-space.ts`) ; les nouvelles
  sous-pages (`/app/parametres/securite`, …) renvoient ces membres vers `?onglet=` de l'ancienne
  page. Accès refusé et invitation suivent le même partage.
- **Formules lues en base.** Prix, nom, badge « Recommandé » et lignes viennent des forfaits
  (`Plan`, droits, textes `pricing.talent.*`), jamais de la planche. Le sélecteur Mensuel/Annuel
  n'apparaît que s'il existe un forfait annuel en base (aucun aujourd'hui, partie 05 : mensuel au
  lancement).
- **Quotas « restant sur total ».** La barre montre ce qui reste du mois (planche « 112 sur 150 »).
- **Moyen de paiement.** Prépayé : rien n'est enregistré. La ligne « Moyen de paiement » montre le
  dernier moyen utilisé (opérateur, numéro masqué « 81 ••• 42 ») et n'ouvre rien ; on choisit à
  chaque paiement.
- **Indicatif.** Nouvelle colonne `Country.dialCode` (migration additive, remplie pour 243 pays,
  6 territoires sans indicatif). Le numéro complet est `indicatif + numéro sans 0 initial` ; il
  n'est jamais réaffiché en entier (`maskNumber(msisdn, dialCode)` → « +243 81 ••• 42 »).
- **Opérateurs.** Couleurs de marque, sauf Orange assombri (#C25200) pour que la lettre blanche
  atteigne le contraste AA ; MTN en jaune avec la lettre en Sapin.
- **« Je n'ai rien reçu ».** Conseils, rappel que Jumanly ne demande jamais le code secret, la
  référence de la demande, et « Vérifier maintenant ». Pas de nouvelle demande : une demande en
  attente bloque les doublons 15 minutes (partie 09), et la marquer expirée côté Jumanly serait
  risqué si l'opérateur la confirme ensuite.
- **Référence du paiement reçu.** Le numéro de facture (JMN-2026-000123), sinon la référence du
  prestataire.
- **Paiement simulé.** Le prestataire factice n'existe qu'en local et en preview
  (`paymentProvider()` renvoie `null` ailleurs, test unitaire ajouté) ; sans prestataire, une
  formule payante démarre en essai, comme avant.
- **Double vérification par code e-mail.** C'est le mécanisme existant (pas d'application
  d'authentification) : les cases « Code de l'application » de la planche sont omises.
- **Télécharger mes données.** Le fichier se télécharge directement (la planche dit « envoyé par
  e-mail ») ; dans la suppression, « Télécharger mes données d'abord » le télécharge puis envoie la
  demande.
- **Suppression du compte.** Le texte ne reprend pas « les attestations restent vérifiables » :
  la suppression actuelle les efface. 30 jours de délai, comme avant.
- **Confidentialité.** « Qui voit mon profil » ouvre une feuille à trois choix (privé, visible,
  anonyme) au lieu d'un seul interrupteur, pour garder l'anonyme. « Qui a consulté mon profil » lit
  le journal `profile.view` (une ligne par organisation, la plus récente).
- **Notifications par catégorie.** Candidatures, messages, formations, abonnement (nouvelles
  colonnes `User.notificationsMuted`, `User.notificationEmails`), plus la lettre d'information.
  « Offres pour moi » est omise : aucune notification de ce type n'existe. Le canal « Appli +
  e-mail » ne concerne que les rappels de fin de période ; reçus et e-mails de sécurité partent
  toujours. Les notifications d'une catégorie coupée ne sont plus créées.
- **Aide.** Les questions de la FAQ publique (avec les changements de `/admin/contenus`), par
  thème, avec une recherche. Contact uniquement par e-mail (assistant@jumanly.io) ; aucun délai de
  réponse promis (« réponse sous 2 jours ouvrés » de la planche retiré).
- **Mode testeur.** `/app/testeur` reste réservé aux adresses de `TESTER_EMAILS` (404 pour tout
  autre compte, lien visible seulement pour eux), y compris en production comme le veut la décision
  du 16/10 : « invisible en production » est compris comme invisible pour tout autre compte.
- **Conseils de préparation.** `/app/career/conseils` redirige vers Apprendre ; les fiches
  s'ouvrent sur place dans « S'entraîner aux entretiens » (toutes, plus seulement trois), pour
  toutes les formules : sans simulation dans la formule à la place des quotas comme au lot 6b, et
  en bas de page « Conseils de préparation » quand la formule a des simulations (partie 05 : fiches
  gratuites pour tous).
- **Anciennes adresses** (redirections permanentes) : `/app/tableau-de-bord` → `/app`,
  `/app/espace` → `/app/compte`, `/app/career` → `/app/career/cv`, `/app/career/conseils` →
  `/app/learn`. « Mes espaces » de Compte devient une ligne par organisation (changement d'espace
  direct). Le lien « Tableau de bord » de l'ancien cadre (AppShell) est retiré.
- **Mode sombre partout.** La liste `REDRAWN` et la classe `t-ancien` disparaissent : toutes les
  pages de l'espace talent prennent le mode sombre. Accès refusé et invitation, encore à l'ancien
  design et illisibles en sombre, sont redessinés pour les talents ; les bandeaux d'alerte de
  `/admin/contenus` gardent un texte lisible en sombre.
- **Colonne `User.theme` supprimée** (migration `remove_old_talent_theme`) : réglage de l'ancien
  design, remplacé par `User.appearance` depuis le lot 1 ; aucune donnée utilisateur perdue.
