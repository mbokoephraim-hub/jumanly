# 00 · Socle (textes de l'étape E0)

> Textes du socle technique : gabarits, composants de base et page `/dev/composants`.
> Les textes officiels de l'interface sont dans les fichiers `textes/01` et suivants.
> Chaque tableau `| Clé | Texte |` est converti en `messages/fr.json` par `pnpm messages`.
> Les variables s'écrivent entre accolades : `{limit}`.

## Commun

| Clé | Texte |
|---|---|
| `common.brand.name` | Jumanly |
| `common.brand.slogan` | Learn. Grow. Connect. |
| `common.brand.byline` | Une plateforme développée par The Growth Lab |
| `common.contact.title` | Nous écrire |
| `common.contact.primaryEmail` | assistant@jumanly.io |
| `common.contact.secondaryEmail` | infojumanly@gmail.com |
| `common.footer.rights` | © Jumanly · The Growth Lab. Tous droits réservés. |

## Métadonnées

| Clé | Texte |
|---|---|
| `meta.title` | Jumanly · Learn. Grow. Connect. |
| `meta.titleTemplate` | %s · Jumanly |
| `meta.description` | Jumanly relie les talents africains aux formations et aux employeurs qui leur correspondent. |
| `meta.applicationName` | Jumanly |

## Navigation

| Clé | Texte |
|---|---|
| `nav.public.home` | Accueil Jumanly |
| `nav.public.main` | Navigation principale |
| `nav.public.menu` | Ouvrir le menu |
| `nav.public.courses` | Formations |
| `nav.public.jobs` | Offres d'emploi |
| `nav.public.pricing` | Tarifs |
| `nav.public.signIn` | Se connecter |
| `nav.public.signUp` | Créer un compte |
| `nav.app.main` | Navigation de mon espace |
| `nav.app.skipToContent` | Aller au contenu |
| `nav.app.notifications` | Notifications |
| `nav.app.home` | Accueil |
| `nav.app.learn` | Learn |
| `nav.app.career` | Career |
| `nav.app.jobs` | Jobs |
| `nav.app.connect` | Connect |

## Composants

| Clé | Texte |
|---|---|
| `ui.loading` | Chargement en cours |
| `ui.close` | Fermer |
| `ui.optional` | (facultatif) |
| `ui.percent` | {value} % |
| `ui.quota.used` | {used} sur {limit} |
| `ui.quota.unlimited` | {used} utilisés · illimité |
| `ui.quota.reached` | Limite atteinte pour ce mois. |
| `ui.ai.suggested` | Suggéré par l'IA |
| `ui.ai.why` | Pourquoi ? |
| `ui.ai.humanDecides` | L'IA recommande, vous décidez. |

## Accueil provisoire (remplacé à l'étape E1)

| Clé | Texte |
|---|---|
| `home.badge` | Bientôt disponible |
| `home.title` | Votre carrière commence ici. |
| `home.subtitle` | Formez-vous, enrichissez votre profil et rencontrez les employeurs qui vous correspondent. |
| `home.signUp` | Créer un compte |
| `home.signIn` | Se connecter |

## Espace connecté provisoire (remplacé à l'étape E3)

| Clé | Texte |
|---|---|
| `app.sampleUser` | Aïcha Exemple |
| `app.dashboard.eyebrow` | Mon espace |
| `app.dashboard.title` | Bonjour, bienvenue sur Jumanly |
| `app.dashboard.profileLabel` | Profil complété |
| `app.dashboard.profileTitle` | Complétez votre profil |
| `app.dashboard.profileText` | Un profil complet vous fait remonter dans les recommandations. |
| `app.dashboard.emptyTitle` | Votre tableau de bord arrive bientôt |
| `app.dashboard.emptyText` | Formations, offres et messages apparaîtront ici. |
| `app.dashboard.seeComponents` | Voir les composants |

## E-mails

| Clé | Texte |
|---|---|
| `email.layout.footer` | Une plateforme développée par The Growth Lab. Pour nous écrire : {email} |
| `email.example.preview` | Exemple de gabarit d'e-mail Jumanly |
| `email.example.title` | Bienvenue sur Jumanly |
| `email.example.body` | Ceci est le gabarit commun des e-mails. Les vrais modèles arrivent avec les notifications. |
| `email.example.cta` | Ouvrir mon espace |

## Page /dev/composants

| Clé | Texte |
|---|---|
| `devComponents.title` | Bibliothèque de composants |
| `devComponents.intro` | Tous les composants de base de Jumanly et leurs états. Page interne, non indexée. |
| `devComponents.publicLayout` | Gabarit du site public |
| `devComponents.appLayout` | Gabarit de l'espace connecté |
| `devComponents.sections.colors` | Couleurs et dégradés |
| `devComponents.sections.typography` | Typographie |
| `devComponents.sections.buttons` | Boutons |
| `devComponents.sections.fields` | Champs de saisie |
| `devComponents.sections.choices` | Cases, boutons radio et interrupteurs |
| `devComponents.sections.badges` | Pastilles |
| `devComponents.sections.cards` | Cartes |
| `devComponents.sections.alerts` | Alertes |
| `devComponents.sections.avatars` | Avatars |
| `devComponents.sections.tabs` | Onglets |
| `devComponents.sections.progress` | Progression et quotas |
| `devComponents.sections.ai` | Intelligence : score expliqué |
| `devComponents.sections.loading` | Chargement |
| `devComponents.sections.empty` | État vide |
| `devComponents.sections.modal` | Fenêtre modale |
| `devComponents.colors.sapin` | Vert Sapin #0F3F37 |
| `devComponents.colors.lime` | Lime #A6F26B |
| `devComponents.colors.creme` | Crème #F2EDE5 |
| `devComponents.colors.blanc` | Blanc #FFFFFF |
| `devComponents.colors.feuille` | Feuille #3DA14F |
| `devComponents.colors.menthe` | Menthe IA #2FD3A6 |
| `devComponents.colors.nuit` | Nuit #0B1A1F |
| `devComponents.colors.neon` | Néon #E3F67C |
| `devComponents.colors.ardoise` | Ardoise #5B6B68 |
| `devComponents.colors.brume` | Brume #DCE5E1 |
| `devComponents.colors.ambre` | Ambre #F2B33D |
| `devComponents.colors.corail` | Corail #E25C4B |
| `devComponents.colors.mentheClaire` | Menthe claire #BFEFDF |
| `devComponents.gradients.signature` | Dégradé signature |
| `devComponents.gradients.ai` | Dégradé Intelligence |
| `devComponents.gradients.depth` | Dégradé profondeur |
| `devComponents.type.display` | Learn. Grow. |
| `devComponents.type.h1` | Votre carrière commence ici |
| `devComponents.type.h2` | Formations recommandées pour vous |
| `devComponents.type.label` | Date limite |
| `devComponents.type.body` | Jumanly relie les talents africains aux formations et aux employeurs qui leur correspondent. |
| `devComponents.type.caption` | Une plateforme développée par The Growth Lab |
| `devComponents.variants.primary` | Primaire |
| `devComponents.variants.secondary` | Secondaire |
| `devComponents.variants.outline` | Contour |
| `devComponents.variants.ghost` | Fantôme |
| `devComponents.variants.danger` | Danger |
| `devComponents.states.icon` | Avec icône |
| `devComponents.states.loading` | En cours |
| `devComponents.states.disabled` | Désactivé |
| `devComponents.states.small` | Petit |
| `devComponents.states.medium` | Moyen |
| `devComponents.states.large` | Grand |
| `devComponents.states.link` | Lien |
| `devComponents.buttons.action` | Postuler |
| `devComponents.buttons.link` | Créer mon profil |
| `devComponents.fields.name` | Nom complet |
| `devComponents.fields.namePlaceholder` | Ex. : Aïcha Exemple |
| `devComponents.fields.email` | Adresse e-mail |
| `devComponents.fields.emailHint` | Nous ne la partageons jamais sans votre accord. |
| `devComponents.fields.emailInvalid` | aicha@exemple |
| `devComponents.fields.emailError` | Saisissez une adresse e-mail valide, par exemple nom@domaine.com. |
| `devComponents.fields.locked` | Champ non modifiable |
| `devComponents.fields.lockedValue` | Valeur verrouillée |
| `devComponents.fields.country` | Pays |
| `devComponents.fields.countryPlaceholder` | Choisissez un pays |
| `devComponents.fields.countryError` | Choisissez votre pays pour continuer. |
| `devComponents.fields.countryA` | République démocratique du Congo |
| `devComponents.fields.countryB` | Cameroun |
| `devComponents.fields.countryC` | Sénégal |
| `devComponents.fields.bio` | Présentation |
| `devComponents.fields.bioHint` | Quelques lignes sur votre parcours et vos objectifs. |
| `devComponents.choices.terms` | J'accepte les conditions d'utilisation |
| `devComponents.choices.alerts` | Recevoir les alertes d'offres |
| `devComponents.choices.alertsHint` | Un e-mail par semaine au maximum. |
| `devComponents.choices.profile` | Je suis |
| `devComponents.choices.talent` | Un talent |
| `devComponents.choices.recruiter` | Un recruteur RH |
| `devComponents.choices.company` | Une entreprise |
| `devComponents.choices.visible` | Profil visible des recruteurs |
| `devComponents.choices.visibleHint` | Vous pouvez le masquer à tout moment. |
| `devComponents.choices.digest` | Résumé hebdomadaire par e-mail |
| `devComponents.badges.neutral` | Brouillon |
| `devComponents.badges.sapin` | Learn |
| `devComponents.badges.lime` | Nouveau |
| `devComponents.badges.success` | Retenu |
| `devComponents.badges.warning` | En attente |
| `devComponents.badges.error` | Non retenu |
| `devComponents.badges.ai` | Suggéré par l'IA |
| `devComponents.cards.defaultTitle` | Gestion de projet agile |
| `devComponents.cards.defaultText` | Learn · 6 modules · Certificat |
| `devComponents.cards.tintedTitle` | 3 offres correspondent à votre profil |
| `devComponents.cards.tintedText` | Consultez-les avant la date limite. |
| `devComponents.cards.darkTitle` | Module Intelligence |
| `devComponents.cards.darkText` | Des recommandations expliquées, jamais imposées. |
| `devComponents.alerts.infoTitle` | Information |
| `devComponents.alerts.infoText` | Votre profil est visible des recruteurs vérifiés uniquement. |
| `devComponents.alerts.successTitle` | Candidature envoyée |
| `devComponents.alerts.successText` | Vous suivrez son avancement dans vos candidatures. |
| `devComponents.alerts.warningTitle` | Quota bientôt atteint |
| `devComponents.alerts.warningText` | Il vous reste 2 analyses ce mois-ci. |
| `devComponents.alerts.warningAction` | Voir les forfaits |
| `devComponents.alerts.errorTitle` | Envoi impossible |
| `devComponents.alerts.errorText` | Vérifiez votre connexion puis réessayez. |
| `devComponents.avatars.name` | Aïcha Exemple |
| `devComponents.tabs.talents` | Talents |
| `devComponents.tabs.recruiters` | Recruteurs |
| `devComponents.tabs.companies` | Entreprises |
| `devComponents.tabs.talentsText` | Formez-vous et postulez gratuitement. |
| `devComponents.tabs.recruitersText` | Publiez vos offres et suivez vos candidats. |
| `devComponents.tabs.companiesText` | Pilotez vos recrutements en équipe. |
| `devComponents.progress.profile` | Profil complété |
| `devComponents.progress.course` | Progression de la formation |
| `devComponents.progress.quotaNormal` | Analyses de CV |
| `devComponents.progress.quotaNear` | Crédits IA du mois |
| `devComponents.progress.quotaReached` | Offres actives |
| `devComponents.progress.quotaUnlimited` | Candidatures |
| `devComponents.ai.job` | Compatibilité avec « Analyste RH junior » (exemple fictif) |
| `devComponents.ai.reason1` | Excel avancé : compétence requise, présente sur votre profil. |
| `devComponents.ai.reason2` | Certificat RH obtenu sur Jumanly Learn. |
| `devComponents.ai.reason3` | 2 ans d'expérience pour 1 an demandé. |
| `devComponents.empty.title` | Aucune candidature pour l'instant |
| `devComponents.empty.text` | Parcourez les offres : postuler est toujours gratuit. |
| `devComponents.empty.action` | Voir les offres |
| `devComponents.modal.open` | Ouvrir la fenêtre |
| `devComponents.modal.title` | Retirer ma candidature ? |
| `devComponents.modal.text` | Le recruteur ne verra plus votre candidature. Vous pourrez postuler à nouveau tant que l'offre est ouverte. |
| `devComponents.modal.cancel` | Annuler |
| `devComponents.modal.confirm` | Retirer |
