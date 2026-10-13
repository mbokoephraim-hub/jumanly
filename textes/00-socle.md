# 00 · Socle (textes de l'étape E0)

> Textes propres au socle technique : page interne `/dev/composants` et écrans provisoires.
> Tous les autres textes viennent de `textes-application.md` (textes officiels). Une clé ne peut exister
> qu'une fois : le script refuse les doublons.
> Chaque tableau `| Clé | Texte |` est converti en `messages/fr.json` par `pnpm messages`.

## Composants

| Clé | Texte |
|---|---|
| `ui.percent` | {value} % |
| `ui.avatarStack.more` | +{count} |
| `ui.avatarStack.moreAria` | {count, plural, one {et # autre personne} other {et # autres personnes}} |

## Écrans provisoires du socle (remplacés aux étapes E1 et E3)

| Clé | Texte |
|---|---|
| `foundation.sampleUser` | Aïcha Exemple |
| `foundation.sampleFirstName` | Aïcha |
| `foundation.emptyTitle` | Votre tableau de bord arrive bientôt |
| `foundation.emptyText` | Formations, offres et messages apparaîtront ici. |
| `foundation.seeComponents` | Voir les composants |
| `foundation.samplePlan` | Free |

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
| `devComponents.sections.brand` | Marque |
| `devComponents.sections.search` | Recherche et filtres |
| `devComponents.sections.stats` | Cartes de statistique |
| `devComponents.sections.listings` | Cartes de formation et d'offre |
| `devComponents.sections.pipeline` | Étapes de recrutement |
| `devComponents.sections.table` | Tableau |
| `devComponents.sections.plans` | Verrou de forfait et carte de formule |
| `devComponents.sections.toast` | Notification |
| `devComponents.sections.drawer` | Tiroir mobile |
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
| `devComponents.variants.tertiary` | Tertiaire |
| `devComponents.variants.icon` | Icône ronde |
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
| `devComponents.badges.contract` | CDI |
| `devComponents.badges.trendUp` | +12 % |
| `devComponents.badges.trendDown` | −3 % |
| `devComponents.cards.defaultTitle` | Gestion de projet agile |
| `devComponents.cards.defaultText` | Learn · 6 modules · Certificat |
| `devComponents.cards.tintedTitle` | 3 offres correspondent à votre profil |
| `devComponents.cards.tintedText` | Consultez-les avant la date limite. |
| `devComponents.cards.darkTitle` | Module Intelligence |
| `devComponents.cards.darkText` | Des recommandations expliquées, jamais imposées. |
| `devComponents.cards.selected` | Élément sélectionné |
| `devComponents.cards.tone.learn` | Learn |
| `devComponents.cards.tone.career` | Career |
| `devComponents.cards.tone.jobs` | Jobs |
| `devComponents.cards.tone.hire` | Hire |
| `devComponents.cards.tone.connect` | Connect |
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
| `devComponents.avatars.nameB` | Brice Exemple |
| `devComponents.avatars.nameC` | Chantal Exemple |
| `devComponents.avatars.nameD` | David Exemple |
| `devComponents.avatars.nameE` | Esther Exemple |
| `devComponents.avatars.nameF` | Fabrice Exemple |
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
| `devComponents.ai.suggestion` | Ajoutez « Gestion de la paie » à vos compétences : 4 offres suivies la demandent. |
| `devComponents.ai.suggestionWhy` | Cette compétence apparaît dans 4 des offres que vous avez enregistrées et dans votre attestation RH. |
| `devComponents.empty.title` | Aucune candidature pour l'instant |
| `devComponents.empty.text` | Parcourez les offres : postuler est toujours gratuit. |
| `devComponents.empty.action` | Voir les offres |
| `devComponents.modal.open` | Ouvrir la fenêtre |
| `devComponents.modal.title` | Retirer ma candidature ? |
| `devComponents.modal.text` | Le recruteur ne verra plus votre candidature. Vous pourrez postuler à nouveau tant que l'offre est ouverte. |
| `devComponents.modal.cancel` | Annuler |
| `devComponents.modal.confirm` | Retirer |
| `devComponents.brand.primary` | Logo principal |
| `devComponents.brand.negative` | Logo négatif |
| `devComponents.brand.symbol` | Pictogrammes |
| `devComponents.brand.orb` | Orbe IA |
| `devComponents.search.id` | Rechercher une offre |
| `devComponents.search.placeholder` | Métier, compétence, entreprise |
| `devComponents.search.filterRemote` | Télétravail |
| `devComponents.search.filterFullTime` | Temps plein |
| `devComponents.search.filterFree` | Formations gratuites |
| `devComponents.search.filterDisabled` | Indisponible |
| `devComponents.stats.applications` | Candidatures envoyées |
| `devComponents.stats.applicationsValue` | 12 |
| `devComponents.stats.views` | Vues du profil |
| `devComponents.stats.viewsValue` | 48 |
| `devComponents.stats.viewsTrend` | +12 % ce mois-ci |
| `devComponents.stats.courses` | Formations terminées |
| `devComponents.stats.coursesValue` | 3 |
| `devComponents.listings.courseTitle` | Gestion de projet agile (exemple fictif) |
| `devComponents.listings.courseLevel` | débutant |
| `devComponents.listings.courseDuration` | 6 h |
| `devComponents.listings.coursePlan` | Exemple Plus |
| `devComponents.listings.jobTitle` | Analyste RH junior (exemple fictif) |
| `devComponents.listings.jobCompany` | Entreprise Exemple |
| `devComponents.listings.jobCity` | Kinshasa |
| `devComponents.listings.jobCountry` | RD Congo |
| `devComponents.listings.jobContract` | CDI |
| `devComponents.listings.jobDeadline` | 30 novembre 2026 |
| `devComponents.listings.jobBTitle` | Chargée de communication (exemple fictif) |
| `devComponents.listings.jobBCity` | Douala |
| `devComponents.listings.jobBCountry` | Cameroun |
| `devComponents.listings.jobBContract` | Stage |
| `devComponents.table.caption` | Candidatures reçues (exemple fictif) |
| `devComponents.table.name` | Candidat |
| `devComponents.table.stage` | Étape |
| `devComponents.table.date` | Reçue le |
| `devComponents.table.date1` | 2 octobre 2026 |
| `devComponents.table.date2` | 5 octobre 2026 |
| `devComponents.plans.lockPlan` | Exemple Plus |
| `devComponents.plans.lockText` | Cette analyse détaillée fait partie d'un forfait supérieur. Postuler reste toujours gratuit. |
| `devComponents.plans.freeName` | Exemple Gratuit |
| `devComponents.plans.paidName` | Exemple Plus |
| `devComponents.plans.audience` | les talents en recherche active |
| `devComponents.plans.feature1` | Candidatures illimitées |
| `devComponents.plans.feature2` | 10 crédits IA par mois |
| `devComponents.plans.feature3` | Analyse de CV détaillée |
| `devComponents.plans.ctaFree` | Commencer gratuitement |
| `devComponents.plans.ctaPaid` | Choisir ce forfait |
| `devComponents.toast.show` | Afficher une notification |
| `devComponents.drawer.open` | Ouvrir le tiroir |
| `devComponents.drawer.title` | Filtres |
| `devComponents.drawer.text` | Sur mobile, les filtres s'ouvrent dans ce tiroir qui remonte du bas de l'écran. |
| `devComponents.drawer.apply` | Afficher les résultats |
