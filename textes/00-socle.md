# 00 · Socle (textes provisoires de l'étape E0)

> Fichier créé à l'étape E0 pour les textes du socle technique (gabarits, composants, page `/dev/composants`).
> Les textes officiels de l'interface viendront des fichiers `textes/01` et suivants du cahier des charges.
> Format : chaque tableau `| Clé | Texte |` est converti en `messages/fr.json` par `pnpm messages`.
> Les variables s'écrivent entre accolades : `{limite}`.

## Commun

| Clé                              | Texte                                             |
| -------------------------------- | ------------------------------------------------- |
| `commun.marque.nom`              | Jumanly                                           |
| `commun.marque.slogan`           | Learn. Grow. Connect.                             |
| `commun.marque.portePar`         | Une plateforme développée par The Growth Lab      |
| `commun.contact.titre`           | Nous écrire                                       |
| `commun.contact.emailPrincipal`  | assistant@jumanly.io                              |
| `commun.contact.emailSecondaire` | infojumanly@gmail.com                             |
| `commun.piedDePage.droits`       | © Jumanly · The Growth Lab. Tous droits réservés. |

## Métadonnées

| Clé                   | Texte                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `meta.titre`          | Jumanly · Learn. Grow. Connect.                                                              |
| `meta.modeleTitre`    | %s · Jumanly                                                                                 |
| `meta.description`    | Jumanly relie les talents africains aux formations et aux employeurs qui leur correspondent. |
| `meta.nomApplication` | Jumanly                                                                                      |

## Navigation

| Clé                                | Texte                    |
| ---------------------------------- | ------------------------ |
| `navigation.public.accueil`        | Accueil Jumanly          |
| `navigation.public.principale`     | Navigation principale    |
| `navigation.public.menu`           | Ouvrir le menu           |
| `navigation.public.formations`     | Formations               |
| `navigation.public.offres`         | Offres d'emploi          |
| `navigation.public.tarifs`         | Tarifs                   |
| `navigation.public.connexion`      | Se connecter             |
| `navigation.public.inscription`    | Créer un compte          |
| `navigation.espace.principale`     | Navigation de mon espace |
| `navigation.espace.allerAuContenu` | Aller au contenu         |
| `navigation.espace.notifications`  | Notifications            |
| `navigation.espace.accueil`        | Accueil                  |
| `navigation.espace.learn`          | Learn                    |
| `navigation.espace.career`         | Career                   |
| `navigation.espace.jobs`           | Jobs                     |
| `navigation.espace.connect`        | Connect                  |

## Composants

| Clé                              | Texte                          |
| -------------------------------- | ------------------------------ |
| `composants.chargement`          | Chargement en cours            |
| `composants.fermer`              | Fermer                         |
| `composants.facultatif`          | (facultatif)                   |
| `composants.pourcentage`         | {valeur} %                     |
| `composants.jaugeQuota.utilise`  | {utilise} sur {limite}         |
| `composants.jaugeQuota.illimite` | {utilise} utilisés · illimité  |
| `composants.jaugeQuota.atteint`  | Limite atteinte pour ce mois.  |
| `composants.ia.suggere`          | Suggéré par l'IA               |
| `composants.ia.pourquoi`         | Pourquoi ?                     |
| `composants.ia.humainDecide`     | L'IA recommande, vous décidez. |

## Accueil provisoire

| Clé                   | Texte                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `accueil.pastille`    | Bientôt disponible                                                                         |
| `accueil.titre`       | Votre carrière commence ici.                                                               |
| `accueil.sousTitre`   | Formez-vous, enrichissez votre profil et rencontrez les employeurs qui vous correspondent. |
| `accueil.creerCompte` | Créer un compte                                                                            |
| `accueil.seConnecter` | Se connecter                                                                               |

## Espace connecté provisoire

| Clé                                   | Texte                                                          |
| ------------------------------------- | -------------------------------------------------------------- |
| `espace.utilisateurExemple`           | Aïcha Exemple                                                  |
| `espace.tableauDeBord.surtitre`       | Mon espace                                                     |
| `espace.tableauDeBord.titre`          | Bonjour, bienvenue sur Jumanly                                 |
| `espace.tableauDeBord.profilLabel`    | Profil complété                                                |
| `espace.tableauDeBord.profilTitre`    | Complétez votre profil                                         |
| `espace.tableauDeBord.profilTexte`    | Un profil complet vous fait remonter dans les recommandations. |
| `espace.tableauDeBord.videTitre`      | Votre tableau de bord arrive bientôt                           |
| `espace.tableauDeBord.videTexte`      | Formations, offres et messages apparaîtront ici.               |
| `espace.tableauDeBord.voirComposants` | Voir les composants                                            |

## Page /dev/composants

| Clé                                       | Texte                                                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `devComposants.titre`                     | Bibliothèque de composants                                                                                  |
| `devComposants.intro`                     | Tous les composants de base de Jumanly et leurs états. Page interne, non indexée.                           |
| `devComposants.gabaritPublic`             | Gabarit du site public                                                                                      |
| `devComposants.gabaritEspace`             | Gabarit de l'espace connecté                                                                                |
| `devComposants.sections.couleurs`         | Couleurs et dégradés                                                                                        |
| `devComposants.sections.typographie`      | Typographie                                                                                                 |
| `devComposants.sections.boutons`          | Boutons                                                                                                     |
| `devComposants.sections.champs`           | Champs de saisie                                                                                            |
| `devComposants.sections.choix`            | Cases, boutons radio et interrupteurs                                                                       |
| `devComposants.sections.pastilles`        | Pastilles                                                                                                   |
| `devComposants.sections.cartes`           | Cartes                                                                                                      |
| `devComposants.sections.alertes`          | Alertes                                                                                                     |
| `devComposants.sections.avatars`          | Avatars                                                                                                     |
| `devComposants.sections.onglets`          | Onglets                                                                                                     |
| `devComposants.sections.progression`      | Progression et quotas                                                                                       |
| `devComposants.sections.ia`               | Intelligence : score expliqué                                                                               |
| `devComposants.sections.chargement`       | Chargement                                                                                                  |
| `devComposants.sections.vide`             | État vide                                                                                                   |
| `devComposants.sections.modale`           | Fenêtre modale                                                                                              |
| `devComposants.couleurs.sapin`            | Vert Sapin #0F3F37                                                                                          |
| `devComposants.couleurs.lime`             | Lime #A6F26B                                                                                                |
| `devComposants.couleurs.creme`            | Crème #F2EDE5                                                                                               |
| `devComposants.couleurs.feuille`          | Feuille #3DA14F                                                                                             |
| `devComposants.couleurs.mentheIa`         | Menthe IA #2FD3A6                                                                                           |
| `devComposants.couleurs.nuit`             | Nuit #0B1A1F                                                                                                |
| `devComposants.couleurs.neon`             | Néon #E3F67C                                                                                                |
| `devComposants.couleurs.ardoise`          | Ardoise #5B6B68                                                                                             |
| `devComposants.couleurs.brume`            | Brume #DCE5E1                                                                                               |
| `devComposants.couleurs.ambre`            | Ambre #F2B33D                                                                                               |
| `devComposants.couleurs.corail`           | Corail #E25C4B                                                                                              |
| `devComposants.couleurs.mentheClaire`     | Menthe claire #BFEFDF                                                                                       |
| `devComposants.typo.display`              | Learn. Grow.                                                                                                |
| `devComposants.typo.h1`                   | Votre carrière commence ici                                                                                 |
| `devComposants.typo.h2`                   | Formations recommandées pour vous                                                                           |
| `devComposants.typo.label`                | Date limite                                                                                                 |
| `devComposants.typo.corps`                | Jumanly relie les talents africains aux formations et aux employeurs qui leur correspondent.                |
| `devComposants.typo.legende`              | Une plateforme développée par The Growth Lab                                                                |
| `devComposants.variantes.primaire`        | Primaire                                                                                                    |
| `devComposants.variantes.secondaire`      | Secondaire                                                                                                  |
| `devComposants.variantes.contour`         | Contour                                                                                                     |
| `devComposants.variantes.fantome`         | Fantôme                                                                                                     |
| `devComposants.variantes.danger`          | Danger                                                                                                      |
| `devComposants.etats.icone`               | Avec icône                                                                                                  |
| `devComposants.etats.chargement`          | En cours                                                                                                    |
| `devComposants.etats.desactive`           | Désactivé                                                                                                   |
| `devComposants.etats.petit`               | Petit                                                                                                       |
| `devComposants.etats.moyen`               | Moyen                                                                                                       |
| `devComposants.etats.grand`               | Grand                                                                                                       |
| `devComposants.etats.lien`                | Lien                                                                                                        |
| `devComposants.boutons.action`            | Postuler                                                                                                    |
| `devComposants.boutons.lien`              | Créer mon profil                                                                                            |
| `devComposants.champs.nom`                | Nom complet                                                                                                 |
| `devComposants.champs.nomExemple`         | Ex. : Aïcha Exemple                                                                                         |
| `devComposants.champs.email`              | Adresse e-mail                                                                                              |
| `devComposants.champs.emailAide`          | Nous ne la partageons jamais sans votre accord.                                                             |
| `devComposants.champs.emailInvalide`      | aicha@exemple                                                                                               |
| `devComposants.champs.emailErreur`        | Saisissez une adresse e-mail valide, par exemple nom@domaine.com.                                           |
| `devComposants.champs.desactive`          | Champ non modifiable                                                                                        |
| `devComposants.champs.valeurFixe`         | Valeur verrouillée                                                                                          |
| `devComposants.champs.pays`               | Pays                                                                                                        |
| `devComposants.champs.paysInvite`         | Choisissez un pays                                                                                          |
| `devComposants.champs.paysErreur`         | Choisissez votre pays pour continuer.                                                                       |
| `devComposants.champs.paysA`              | République démocratique du Congo                                                                            |
| `devComposants.champs.paysB`              | Cameroun                                                                                                    |
| `devComposants.champs.paysC`              | Sénégal                                                                                                     |
| `devComposants.champs.bio`                | Présentation                                                                                                |
| `devComposants.champs.bioAide`            | Quelques lignes sur votre parcours et vos objectifs.                                                        |
| `devComposants.choix.conditions`          | J'accepte les conditions d'utilisation                                                                      |
| `devComposants.choix.alertes`             | Recevoir les alertes d'offres                                                                               |
| `devComposants.choix.alertesAide`         | Un e-mail par semaine au maximum.                                                                           |
| `devComposants.choix.profil`              | Je suis                                                                                                     |
| `devComposants.choix.talent`              | Un talent                                                                                                   |
| `devComposants.choix.recruteur`           | Un recruteur RH                                                                                             |
| `devComposants.choix.entreprise`          | Une entreprise                                                                                              |
| `devComposants.choix.profilVisible`       | Profil visible des recruteurs                                                                               |
| `devComposants.choix.profilVisibleAide`   | Vous pouvez le masquer à tout moment.                                                                       |
| `devComposants.choix.emails`              | Résumé hebdomadaire par e-mail                                                                              |
| `devComposants.pastilles.neutre`          | Brouillon                                                                                                   |
| `devComposants.pastilles.sapin`           | Learn                                                                                                       |
| `devComposants.pastilles.lime`            | Nouveau                                                                                                     |
| `devComposants.pastilles.succes`          | Retenu                                                                                                      |
| `devComposants.pastilles.alerte`          | En attente                                                                                                  |
| `devComposants.pastilles.erreur`          | Non retenu                                                                                                  |
| `devComposants.pastilles.ia`              | Suggéré par l'IA                                                                                            |
| `devComposants.cartes.standardTitre`      | Gestion de projet agile                                                                                     |
| `devComposants.cartes.standardTexte`      | Learn · 6 modules · Certificat                                                                              |
| `devComposants.cartes.teinteTitre`        | 3 offres correspondent à votre profil                                                                       |
| `devComposants.cartes.teinteTexte`        | Consultez-les avant la date limite.                                                                         |
| `devComposants.cartes.sombreTitre`        | Module Intelligence                                                                                         |
| `devComposants.cartes.sombreTexte`        | Des recommandations expliquées, jamais imposées.                                                            |
| `devComposants.alertes.infoTitre`         | Information                                                                                                 |
| `devComposants.alertes.infoTexte`         | Votre profil est visible des recruteurs vérifiés uniquement.                                                |
| `devComposants.alertes.succesTitre`       | Candidature envoyée                                                                                         |
| `devComposants.alertes.succesTexte`       | Vous suivrez son avancement dans vos candidatures.                                                          |
| `devComposants.alertes.alerteTitre`       | Quota bientôt atteint                                                                                       |
| `devComposants.alertes.alerteTexte`       | Il vous reste 2 analyses ce mois-ci.                                                                        |
| `devComposants.alertes.alerteAction`      | Voir les forfaits                                                                                           |
| `devComposants.alertes.erreurTitre`       | Envoi impossible                                                                                            |
| `devComposants.alertes.erreurTexte`       | Vérifiez votre connexion puis réessayez.                                                                    |
| `devComposants.avatars.nom`               | Aïcha Exemple                                                                                               |
| `devComposants.onglets.talents`           | Talents                                                                                                     |
| `devComposants.onglets.recruteurs`        | Recruteurs                                                                                                  |
| `devComposants.onglets.entreprises`       | Entreprises                                                                                                 |
| `devComposants.onglets.talentsTexte`      | Formez-vous et postulez gratuitement.                                                                       |
| `devComposants.onglets.recruteursTexte`   | Publiez vos offres et suivez vos candidats.                                                                 |
| `devComposants.onglets.entreprisesTexte`  | Pilotez vos recrutements en équipe.                                                                         |
| `devComposants.progression.profil`        | Profil complété                                                                                             |
| `devComposants.progression.formation`     | Progression de la formation                                                                                 |
| `devComposants.progression.quotaNormal`   | Analyses de CV                                                                                              |
| `devComposants.progression.quotaProche`   | Crédits IA du mois                                                                                          |
| `devComposants.progression.quotaAtteint`  | Offres actives                                                                                              |
| `devComposants.progression.quotaIllimite` | Candidatures                                                                                                |
| `devComposants.ia.offre`                  | Compatibilité avec « Analyste RH junior » (exemple fictif)                                                  |
| `devComposants.ia.raison1`                | Excel avancé : compétence requise, présente sur votre profil.                                               |
| `devComposants.ia.raison2`                | Certificat RH obtenu sur Jumanly Learn.                                                                     |
| `devComposants.ia.raison3`                | 2 ans d'expérience pour 1 an demandé.                                                                       |
| `devComposants.vide.titre`                | Aucune candidature pour l'instant                                                                           |
| `devComposants.vide.texte`                | Parcourez les offres : postuler est toujours gratuit.                                                       |
| `devComposants.vide.action`               | Voir les offres                                                                                             |
| `devComposants.modale.ouvrir`             | Ouvrir la fenêtre                                                                                           |
| `devComposants.modale.titre`              | Retirer ma candidature ?                                                                                    |
| `devComposants.modale.texte`              | Le recruteur ne verra plus votre candidature. Vous pourrez postuler à nouveau tant que l'offre est ouverte. |
| `devComposants.modale.annuler`            | Annuler                                                                                                     |
| `devComposants.modale.confirmer`          | Retirer                                                                                                     |
