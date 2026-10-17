# Textes de l'application Jumanly

Tous les textes de l'interface, en français, dans un seul fichier. Chaque partie correspond à un domaine de l'application. Format : tableaux `| Clé | Texte |`, clés uniques sur tout le fichier, variables ICU entre accolades. Le script de l'étape E0 convertit ce fichier en `messages/fr.json`.

## Sommaire

- Partie 01 · Site public
- Partie 02 · Inscription et connexion
- Partie 03 · Espace talent
- Partie 04 · Espace recruteur et entreprise
- Partie 05 · Forfaits et paiement
- Partie 06 · Jumanly Intelligence (IA et matching)
- Partie 07 · Notifications et e-mails
- Partie 08 · Textes système
- Partie 09 · Espace partenaire et Jumanly Admin
- Partie 10 · Pages légales
- Partie 11 · Socle technique (composants, personnages, page interne `/dev/composants`)

---

## Partie 01 · Site public

Textes définitifs des pages publiques (doc 07, § 1). Langue : français, vouvoiement. Les clés sont à reporter dans `messages/fr.json`.

Conventions :

- Variables entre accolades façon ICU : `{firstName}`, `{count, plural, one {# offre} other {# offres}}`.
- Les prix viennent de la base (`Plan`) : dans les textes, ils sont passés en variable (`{price}`). Les valeurs de référence sont dans `docs/specifications.md (partie 05)`.
- Les quotas chiffrés sont provisoires : toujours passés en variable (`{quota}`), jamais écrits en dur.
- Les emplacements entre crochets (`[...]`) sont à remplir avant publication et ne doivent jamais être affichés tels quels en production. Si le contenu n'existe pas encore, le bloc correspondant est masqué.
- Aucun numéro de téléphone, nulle part.
- Les textes de la page `/tarifs` sont dans la partie 05. Les textes des pages légales sont dans la partie 10.

---

### Commun · Libellés partagés

*Petits libellés réutilisés sur toutes les pages publiques.*

| Clé | Texte |
|---|---|
| `common.brand` | Jumanly |
| `common.slogan` | Learn. Grow. Connect. |
| `common.signature` | Une plateforme développée par The Growth Lab |
| `common.currency` | USD |
| `common.perMonth` | /mois |
| `common.priceMonthly` | {price} USD/mois |
| `common.free` | Gratuit |
| `common.onQuote` | Sur devis |
| `common.included` | Inclus |
| `common.notIncluded` | Non inclus |
| `common.recommended` | Recommandé |
| `common.new` | Nouveau |
| `common.seeMore` | Voir plus |
| `common.seeAll` | Tout voir |
| `common.learnMore` | En savoir plus |
| `common.back` | Retour |
| `common.close` | Fermer |
| `common.rail.previous` | Onglets précédents |
| `common.rail.next` | Onglets suivants |
| `common.cancel` | Annuler |
| `common.confirm` | Confirmer |
| `common.save` | Enregistrer |
| `common.send` | Envoyer |
| `common.retry` | Réessayer |
| `common.loading` | Chargement… |
| `common.required` | Obligatoire |
| `common.optional` | Facultatif |
| `common.why` | Pourquoi ? |
| `common.verifiedCompany` | Entreprise vérifiée |
| `common.applyFree` | Postuler gratuitement |
| `common.seePlans` | Voir les forfaits |
| `common.requiredPlan` | Forfait requis : {plan} |
| `common.freeApplications` | Candidatures toujours gratuites |
| `common.aiRecommendsHumanDecides` | L'IA recommande, l'humain décide. |
| `common.error.generic` | Un problème est survenu. Veuillez réessayer dans un instant. |
| `common.error.network` | Connexion impossible. Vérifiez votre accès à Internet, puis réessayez. |
| `common.error.notFound.title` | Page introuvable |
| `common.error.notFound.text` | Cette page n'existe pas ou a été déplacée. |
| `common.error.notFound.cta` | Revenir à l'accueil |
| `common.error.server.title` | Le service est momentanément indisponible |
| `common.error.server.text` | Nos équipes sont prévenues. Veuillez réessayer dans quelques minutes. |
| `common.seo.titleSuffix` | · Jumanly |
| `common.seo.publisher` | The Growth Lab |
| `common.alt.logo` | Jumanly, Learn. Grow. Connect. |
| `common.alt.aiOrb` | Suggestion de l'intelligence artificielle |

---

### Global · En-tête et navigation publics

*Permettre à tout visiteur de se repérer et d'accéder en un geste à la connexion ou à l'inscription.*

| Clé | Texte |
|---|---|
| `nav.skipToContent` | Aller au contenu principal |
| `nav.home` | Accueil |
| `nav.talents` | Talents |
| `nav.recruiters` | Recruteurs |
| `nav.companies` | Entreprises |
| `nav.partners` | Partenaires |
| `nav.trainings` | Formations |
| `nav.jobs` | Offres d'emploi |
| `nav.pricing` | Tarifs |
| `nav.about` | À propos |
| `nav.faq` | FAQ |
| `nav.contact` | Contact |
| `nav.group.solutions` | Solutions |
| `nav.group.discover` | Découvrir |
| `nav.login` | Se connecter |
| `nav.signup` | Créer un compte |
| `nav.goToApp` | Mon espace |
| `nav.menu.open` | Ouvrir le menu |
| `nav.menu.close` | Fermer le menu |
| `nav.menu.label` | Menu principal |
| `nav.logo.label` | Jumanly, retour à l'accueil |

---

### Global · Pied de page

*Rassembler les liens utiles, les contacts par e-mail et la signature The Growth Lab.*

| Clé | Texte |
|---|---|
| `footer.tagline` | Se former, construire son parcours et rencontrer les bonnes opportunités, sur une seule plateforme. |
| `footer.slogan` | Learn. Grow. Connect. |
| `footer.signature` | Une plateforme développée par The Growth Lab |
| `footer.col.solutions.text` | Solutions |
| `footer.col.solutions.talents` | Jumanly for Talents |
| `footer.col.solutions.rh` | Jumanly for RH |
| `footer.col.solutions.companies` | Jumanly for Companies |
| `footer.col.solutions.partners` | Jumanly Partners |
| `footer.col.discover.text` | Découvrir |
| `footer.col.discover.trainings` | Formations |
| `footer.col.discover.jobs` | Offres d'emploi |
| `footer.col.discover.pricing` | Tarifs |
| `footer.col.discover.about` | À propos |
| `footer.col.discover.faq` | Questions fréquentes |
| `footer.col.contact.text` | Nous écrire |
| `footer.col.contact.proLabel` | Professionnels et partenaires |
| `footer.col.contact.pro` | assistant@jumanly.io |
| `footer.col.contact.generalLabel` | Questions générales |
| `footer.col.contact.general` | infojumanly@gmail.com |
| `footer.col.contact.site` | jumanly.io |
| `footer.col.contact.form` | Formulaire de contact |
| `footer.legal.notice` | Mentions légales |
| `footer.legal.privacy` | Confidentialité |
| `footer.legal.terms` | Conditions générales |
| `footer.legal.cookies` | Cookies |
| `footer.legal.cookieSettings` | Gérer les cookies |
| `footer.payments` | Paiement par Mobile Money et carte bancaire. Prix en USD. |
| `footer.copyright` | © {year} Jumanly. Tous droits réservés. |
| `footer.language` | Langue : Français |

---

### Global · Bandeau cookies

*Recueillir un consentement clair, sans dark pattern : accepter et refuser ont le même poids visuel.*

| Clé | Texte |
|---|---|
| `cookies.banner.title` | Votre vie privée compte |
| `cookies.banner.text` | Jumanly utilise des cookies nécessaires au fonctionnement du site. Avec votre accord, nous utilisons aussi des cookies de mesure d'audience pour améliorer la plateforme. Vous pouvez changer d'avis à tout moment. |
| `cookies.banner.acceptAll` | Tout accepter |
| `cookies.banner.rejectAll` | Tout refuser |
| `cookies.banner.customize` | Personnaliser |
| `cookies.banner.policyLink` | Politique cookies |
| `cookies.modal.title` | Paramètres des cookies |
| `cookies.modal.intro` | Choisissez les catégories que vous acceptez. Les cookies nécessaires ne peuvent pas être désactivés, car le site ne fonctionnerait pas sans eux. |
| `cookies.modal.necessary.title` | Nécessaires |
| `cookies.modal.necessary.text` | Connexion, sécurité, mémorisation de vos choix de cookies et de langue. |
| `cookies.modal.necessary.status` | Toujours actifs |
| `cookies.modal.analytics.title` | Mesure d'audience |
| `cookies.modal.analytics.text` | Statistiques anonymes de fréquentation pour comprendre quelles pages sont utiles et améliorer le site. |
| `cookies.modal.preferences.title` | Préférences |
| `cookies.modal.preferences.text` | Mémorisation de réglages facultatifs, comme vos filtres de recherche. |
| `cookies.modal.toggleOn` | Activé |
| `cookies.modal.toggleOff` | Désactivé |
| `cookies.modal.save` | Enregistrer mes choix |
| `cookies.modal.acceptAll` | Tout accepter |
| `cookies.modal.rejectAll` | Tout refuser |
| `cookies.toast.saved` | Vos choix de cookies sont enregistrés. |

---

### `/` · Accueil

*Faire comprendre en quelques secondes ce qu'est Jumanly, rassurer (gratuit, explicable, confidentiel) et orienter chaque public vers son parcours.*

#### SEO

| Clé | Texte |
|---|---|
| `home.seo.title` | Jumanly · Se former, évoluer, recruter. Learn. Grow. Connect. |
| `home.seo.description` | Formations, outils de carrière, offres d'emploi et recrutement réunis sur une seule plateforme. Candidatures toujours gratuites. Paiement par Mobile Money et carte. |
| `home.seo.ogTitle` | Jumanly · Learn. Grow. Connect. |
| `home.seo.ogDescription` | La plateforme qui relie formation, carrière et recrutement. Commencez gratuitement. |
| `home.seo.ogImageAlt` | Logo Jumanly et slogan Learn. Grow. Connect. |

#### Héros

| Clé | Texte |
|---|---|
| `home.hero.eyebrow` | Formation · Carrière · Recrutement |
| `home.hero.title` | Learn. Grow. Connect. |
| `home.hero.subtitle` | Jumanly réunit la formation, le développement de carrière, les offres d'emploi et le recrutement sur une seule plateforme. Formez-vous, construisez un profil qui vous ressemble et rencontrez les employeurs qui ont besoin de vos compétences. |
| `home.hero.ctaPrimary` | Créer mon compte gratuit |
| `home.hero.ctaSecondary` | Je recrute |
| `home.hero.reassurance1` | Inscription gratuite |
| `home.hero.reassurance2` | Candidatures toujours gratuites |
| `home.hero.reassurance3` | Mobile Money et carte |
| `home.hero.imageAlt` | Aperçu du tableau de bord Jumanly sur ordinateur et sur téléphone : progression des formations, candidatures en cours et offres compatibles. |
| `home.hero.visual.badge` | Attestation obtenue |
| `home.hero.visual.matchTitle` | Analyste de données junior |
| `home.hero.visual.matchText` | 87 % compatible · Pourquoi ? |
| `home.hero.visual.matchShort` | 87 % compatible |

#### Trois publics

| Clé | Texte |
|---|---|
| `home.audiences.title` | Une plateforme, trois façons d'avancer |
| `home.audiences.subtitle` | Que vous cherchiez un emploi, que vous recrutiez seul ou en équipe, Jumanly s'adapte à votre situation. |
| `home.audiences.eyebrow` | Pour qui ? |
| `home.audiences.talents.label` | Jumanly for Talents |
| `home.audiences.talents.title` | Vous construisez votre carrière |
| `home.audiences.talents.text` | Étudiants, jeunes diplômés, personnes en recherche d'emploi ou professionnels : formez-vous, préparez vos candidatures et postulez gratuitement. |
| `home.audiences.talents.cta` | Découvrir l'espace talents |
| `home.audiences.rh.label` | Jumanly for RH |
| `home.audiences.rh.title` | Vous recrutez seul ou en petite équipe |
| `home.audiences.rh.text` | Recruteurs indépendants, consultants et responsables RH : publiez vos offres, triez les candidatures et échangez avec les candidats dans un outil clair. |
| `home.audiences.rh.cta` | Découvrir l'espace recruteurs |
| `home.audiences.companies.label` | Jumanly for Companies |
| `home.audiences.companies.title` | Vous recrutez à plusieurs |
| `home.audiences.companies.text` | PME, grandes entreprises et groupes : partagez les candidatures entre recruteurs et managers, organisez vos équipes et pilotez vos recrutements. |
| `home.audiences.companies.cta` | Découvrir l'espace entreprises |

#### Parcours en 4 étapes

| Clé | Texte |
|---|---|
| `home.journey.title` | De la formation au recrutement, un parcours continu |
| `home.journey.subtitle` | Chaque étape nourrit la suivante. Ce que vous apprenez enrichit votre profil, et votre profil vous rapproche des bonnes offres. |
| `home.journey.eyebrow` | Le parcours |
| `home.journey.step1.number` | 1 |
| `home.journey.step1.title` | Se former |
| `home.journey.step1.text` | Suivez des formations vidéo, faites les exercices et obtenez des attestations à valoriser sur votre profil. |
| `home.journey.step2.number` | 2 |
| `home.journey.step2.title` | Construire son profil |
| `home.journey.step2.text` | Faites votre diagnostic de carrière, créez votre CV et préparez vos candidatures avec des conseils clairs. |
| `home.journey.step3.number` | 3 |
| `home.journey.step3.title` | Postuler |
| `home.journey.step3.text` | Trouvez des emplois, stages et missions, postulez gratuitement et suivez chaque candidature étape par étape. |
| `home.journey.step4.number` | 4 |
| `home.journey.step4.title` | Échanger et être recruté |
| `home.journey.step4.text` | Échangez avec les recruteurs, recevez des invitations et organisez vos entretiens au même endroit. |

#### Modules

| Clé | Texte |
|---|---|
| `home.modules.title` | Cinq services connectés |
| `home.modules.subtitle` | Jumanly n'est pas une juxtaposition d'outils. Chaque service est relié à votre profil, à vos offres et à vos candidatures. |
| `home.modules.eyebrow` | Les modules |
| `home.modules.learn.name` | Jumanly Learn |
| `home.modules.learn.text` | Formations vidéo, supports pédagogiques, exercices, évaluations et attestations. |
| `home.modules.learn.imageAlt` | Catalogue de formations Jumanly Learn |
| `home.modules.career.name` | Jumanly Career |
| `home.modules.career.text` | Diagnostic de carrière, CV, lettres, préparation LinkedIn, plan de progression et simulations d'entretien. |
| `home.modules.career.imageAlt` | Éditeur de CV avec suggestions du coach IA |
| `home.modules.jobs.name` | Jumanly Jobs |
| `home.modules.jobs.text` | Emplois, stages et missions : cherchez, enregistrez, postulez gratuitement et suivez vos candidatures. |
| `home.modules.jobs.imageAlt` | Recherche d'offres d'emploi avec filtres |
| `home.modules.hire.name` | Jumanly Hire |
| `home.modules.hire.text` | Publication d'offres, recherche de talents, analyse des CV et pipeline de recrutement pour les recruteurs et les entreprises. |
| `home.modules.hire.imageAlt` | Pipeline de recrutement organisé par étapes |
| `home.modules.connect.name` | Jumanly Connect |
| `home.modules.connect.text` | Messagerie, invitations, demandes de documents, rendez-vous et notifications entre candidats et recruteurs. |
| `home.modules.connect.imageAlt` | Messagerie entre un candidat et un recruteur |
| `home.modules.intelligence.name` | Jumanly Intelligence |
| `home.modules.intelligence.text` | Au service de tous les modules : analyse de documents, recommandations et matching explicable. Chaque suggestion vous dit pourquoi. |

#### Aperçu formations

| Clé | Texte |
|---|---|
| `home.trainings.title` | Des formations pour gagner en employabilité |
| `home.trainings.subtitle` | Commencez par une sélection de formations gratuites, puis accédez à des parcours plus complets selon votre forfait. |
| `home.trainings.eyebrow` | Jumanly Learn |
| `home.trainings.cta` | Voir toutes les formations |
| `home.trainings.empty` | Les premières formations arrivent bientôt. Créez votre compte pour être prévenu de leur ouverture. |

#### Aperçu offres

| Clé | Texte |
|---|---|
| `home.jobs.title` | Les dernières opportunités |
| `home.jobs.subtitle` | Emplois, stages et missions publiés par des recruteurs et des entreprises. Postuler est toujours gratuit. |
| `home.jobs.eyebrow` | Jumanly Jobs |
| `home.jobs.cta` | Voir toutes les offres |
| `home.jobs.empty` | Les premières offres seront bientôt publiées. Créez votre compte pour préparer votre profil dès maintenant. |
| `home.jobs.recruiterCta` | Vous recrutez ? Publiez une offre gratuitement |

#### Forfaits résumés

| Clé | Texte |
|---|---|
| `home.pricing.title` | Commencez gratuitement, évoluez à votre rythme |
| `home.pricing.subtitle` | Chaque famille de forfaits démarre par une formule gratuite. Les formules payantes ajoutent des outils, jamais une condition pour postuler. |
| `home.pricing.eyebrow` | Forfaits |
| `home.pricing.talents.name` | Jumanly for Talents |
| `home.pricing.talents.price` | De 0 à {price} USD/mois |
| `home.pricing.talents.text` | Free, Starter, Pro et Premium : de la découverte à la préparation intensive. |
| `home.pricing.rh.name` | Jumanly for RH |
| `home.pricing.rh.price` | De 0 à {price} USD/mois |
| `home.pricing.rh.text` | RH Free, RH Pro et RH Premium : pour recruter seul ou en petite équipe. |
| `home.pricing.companies.name` | Jumanly for Companies |
| `home.pricing.companies.price` | À partir de {price} USD/mois |
| `home.pricing.companies.text` | Company, Company Plus et Company Premium : pour les organisations multi-recruteurs. |
| `home.pricing.partners.name` | Jumanly Partners |
| `home.pricing.partners.price` | Sur contrat |
| `home.pricing.partners.text` | Des licences financées par une institution pour un groupe de bénéficiaires. |
| `home.pricing.payment` | Paiement par Mobile Money et carte bancaire. Prix en USD. |
| `home.pricing.cta` | Comparer les forfaits |

#### Confiance

| Clé | Texte |
|---|---|
| `home.trust.title` | Une plateforme qui vous respecte |
| `home.trust.subtitle` | Nos engagements sont inscrits dans le fonctionnement même de Jumanly. |
| `home.trust.eyebrow` | Nos engagements |
| `home.trust.free.title` | Candidatures toujours gratuites |
| `home.trust.free.text` | Quel que soit votre forfait, postuler ne coûte rien. Les profils Free sont recrutés au même titre que les abonnés. |
| `home.trust.ai.title` | L'IA recommande, l'humain décide |
| `home.trust.ai.text` | Le matching rapproche les besoins et les compétences, mais aucune décision de recrutement n'est prise automatiquement. Chaque suggestion explique son « Pourquoi ? ». |
| `home.trust.privacy.title` | Votre confidentialité respectée |
| `home.trust.privacy.text` | Vous choisissez qui voit votre profil. Un recruteur ne voit votre profil complet que si vous postulez à son offre ou si vous l'avez rendu visible. |
| `home.trust.payment.title` | Un paiement adapté |
| `home.trust.payment.text` | Payez par Mobile Money ou par carte bancaire. Sans engagement : vous pouvez revenir au forfait gratuit sans perdre vos données. |

#### Témoignages (masqué tant qu'il est vide)

| Clé | Texte |
|---|---|
| `home.testimonials.title` | Ils utilisent Jumanly |
| `home.testimonials.item1` | [Témoignage à recueillir pendant la bêta : talent] |
| `home.testimonials.item2` | [Témoignage à recueillir pendant la bêta : recruteur] |
| `home.testimonials.item3` | [Témoignage à recueillir pendant la bêta : entreprise] |
| `home.testimonials.partnersTitle` | Ils soutiennent Jumanly |
| `home.testimonials.partnersLogos` | [Logos de partenaires à fournir, avec leur accord écrit] |

#### FAQ courte

| Clé | Texte |
|---|---|
| `home.faq.title` | Questions fréquentes |
| `home.faq.eyebrow` | FAQ |
| `home.faq.q1` | Jumanly est-il gratuit ? |
| `home.faq.a1` | Oui, vous pouvez créer votre compte, construire votre profil, consulter les offres et postuler gratuitement. Des formules payantes ajoutent des formations et des outils de préparation. |
| `home.faq.q2` | Dois-je payer pour postuler à une offre ? |
| `home.faq.a2` | Non, jamais. Les candidatures sont gratuites pour tous, quel que soit le forfait. |
| `home.faq.q3` | Comment fonctionne l'intelligence artificielle ? |
| `home.faq.a3` | L'IA vous fait des suggestions et explique toujours pourquoi. Elle ne prend aucune décision à votre place ni à la place des recruteurs. |
| `home.faq.q4` | Comment puis-je payer ? |
| `home.faq.a4` | Par Mobile Money ou par carte bancaire. Les prix sont affichés en USD. |
| `home.faq.cta` | Voir toutes les questions |

#### Appel final

| Clé | Texte |
|---|---|
| `home.finalCta.title` | Votre prochaine étape commence ici |
| `home.finalCta.text` | Créez votre compte gratuitement en quelques minutes. Vous choisirez ensuite la formule qui vous convient. |
| `home.finalCta.primary` | Créer mon compte gratuit |
| `home.finalCta.secondary` | Se connecter |

---

### `/a-propos` · À propos

*Présenter la vision, la mission, le positionnement et l'origine de Jumanly avec sobriété.*

| Clé | Texte |
|---|---|
| `about.seo.title` | À propos de Jumanly · Vision, mission et valeurs |
| `about.seo.description` | Jumanly relie formation, carrière et recrutement pour faciliter la rencontre entre talents et employeurs. Une plateforme développée par The Growth Lab. |
| `about.hero.eyebrow` | À propos |
| `about.hero.title` | Relier les compétences aux opportunités |
| `about.hero.text` | Jumanly est une plateforme numérique qui réunit la formation professionnelle, le développement de carrière, la découverte d'opportunités et la gestion du recrutement au sein d'un même écosystème. |
| `about.hero.imageAlt` | Talents et recruteurs reliés par la plateforme Jumanly |
| `about.hero.chips.learn` | Se former |
| `about.hero.chips.exchange` | Échanger |
| `about.hero.chips.recruit` | Recruter |
| `about.vision.title` | Notre vision |
| `about.vision.text` | Construire une plateforme africaine de référence qui facilite le développement des compétences, la progression professionnelle et la rencontre entre talents et employeurs. |
| `about.mission.title` | Notre mission |
| `about.mission.text` | Accompagner les individus dans la construction de leur trajectoire professionnelle et permettre aux organisations d'identifier, d'évaluer et de recruter plus efficacement les compétences dont elles ont besoin. |
| `about.positioning.title` | À la croisée de trois univers |
| `about.positioning.eyebrow` | Positionnement |
| `about.positioning.intro` | Notre ambition n'est pas de proposer plusieurs services sur un même site, mais de les connecter pour créer une expérience professionnelle continue. |
| `about.positioning.edtech.title` | EdTech |
| `about.positioning.edtech.text` | L'apprentissage numérique et le développement des compétences. |
| `about.positioning.careertech.title` | CareerTech |
| `about.positioning.careertech.text` | L'accompagnement de carrière, la construction du profil professionnel et la préparation aux opportunités. |
| `about.positioning.hrtech.title` | HRTech |
| `about.positioning.hrtech.text` | La recherche de talents, l'automatisation de certaines tâches RH et la gestion des recrutements. |
| `about.continuity.title` | Une expérience continue |
| `about.continuity.text` | Un talent peut se former, enrichir son profil, améliorer sa candidature et postuler. Un employeur peut identifier ce profil, examiner ses qualifications, échanger avec le candidat et organiser son recrutement. Tout se passe au même endroit. |
| `about.values.title` | Nos valeurs |
| `about.values.eyebrow` | Ce qui nous guide |
| `about.values.access.title` | Accessibilité |
| `about.values.access.text` | Chacun doit pouvoir construire une présence professionnelle, même sans capacité financière. C'est pourquoi le compte, le profil et les candidatures sont gratuits. |
| `about.values.fairness.title` | Équité |
| `about.values.fairness.text` | Les profils Free sont sélectionnés et recrutés au même titre que les abonnés payants. Le forfait ne donne aucune priorité dans les candidatures. |
| `about.values.transparency.title` | Transparence |
| `about.values.transparency.text` | Chaque suggestion de l'IA explique son « Pourquoi ? ». Les quotas sont visibles et les prix sont affichés clairement. |
| `about.values.humanDecision.title` | Décision humaine |
| `about.values.humanDecision.text` | L'IA recommande, l'humain décide. Aucune recommandation ne devient automatiquement une décision de recrutement. |
| `about.values.privacy.title` | Respect de la vie privée |
| `about.values.privacy.text` | Vous choisissez la visibilité de votre profil. Les partenaires institutionnels ne reçoivent que des données agrégées. |
| `about.growthlab.title` | Une initiative de The Growth Lab |
| `about.growthlab.eyebrow` | The Growth Lab |
| `about.growthlab.text` | Jumanly est développée et portée par The Growth Lab, qui assure la direction stratégique du produit, l'organisation des contenus, la politique commerciale, la gestion des partenariats et la supervision de la plateforme. |
| `about.growthlab.signature` | Une plateforme développée par The Growth Lab |
| `about.launch.title` | Une plateforme construite avec ses utilisateurs |
| `about.launch.text` | Jumanly s'ouvre par étapes : un test fermé, puis une bêta communautaire avec des talents et des employeurs, avant l'ouverture progressive au public. Les retours des premiers utilisateurs façonnent chaque version. |
| `about.launch.eyebrow` | Lancement |
| `about.launch.step1` | Test fermé |
| `about.launch.step2` | Bêta communautaire |
| `about.launch.step3` | Ouverture progressive au public |
| `about.cta.title` | Envie de nous rejoindre ou de collaborer ? |
| `about.cta.primary` | Créer mon compte gratuit |
| `about.cta.secondary` | Nous écrire |

---

### `/talents` · Pour les talents

*Montrer aux talents ce qu'ils peuvent faire avec Learn, Career, Jobs et Connect, et présenter les quatre formules.*

| Clé | Texte |
|---|---|
| `talents.seo.title` | Jumanly for Talents · Formez-vous, préparez vos candidatures, postulez gratuitement |
| `talents.seo.description` | Formations, CV, préparation LinkedIn, simulations d'entretien et offres d'emploi. Commencez gratuitement, candidatures toujours gratuites. Formules dès {price} USD/mois. |
| `talents.hero.eyebrow` | Jumanly for Talents |
| `talents.hero.title` | De la formation au recrutement |
| `talents.hero.text` | Se former, construire un profil qui donne envie, postuler et suivre chaque candidature. Quatre formules pour avancer à votre rythme. |
| `talents.hero.cta` | Créer mon compte gratuit |
| `talents.hero.secondary` | Voir les formules |
| `talents.hero.badge` | Candidatures toujours gratuites |
| `talents.hero.imageAlt` | Tableau de bord d'un talent sur téléphone, avec sa progression et ses candidatures |
| `talents.hero.visual.badge` | Attestation obtenue |
| `talents.hero.visual.matchTitle` | Analyste de données junior |
| `talents.hero.visual.matchText` | 87 % compatible · Pourquoi ? |
| `talents.intro.title` | Un seul compte pour tout votre parcours |
| `talents.intro.text` | Un seul compte relie vos formations, vos documents de candidature et les offres. Chaque étape nourrit la suivante, et l'IA explique toujours pourquoi elle vous conseille. |
| `talents.intro.eyebrow` | Un seul compte |
| `talents.learn.label` | Learn |
| `talents.learn.title` | Se former |
| `talents.learn.text` | Formations vidéo, supports, exercices, évaluations et attestations à valoriser sur votre profil. Les premières formations portent sur l'employabilité, les compétences professionnelles, le positionnement et la préparation au recrutement. |
| `talents.learn.imageAlt` | Lecteur de formation avec vidéo, progression et quiz |
| `talents.career.label` | Career |
| `talents.career.title` | Construire son profil |
| `talents.career.text` | Diagnostic de carrière, CV, lettres de motivation, biographie, préparation LinkedIn, plan de progression et simulations d'entretien. Le coach IA justifie chaque suggestion, et vous choisissez de l'appliquer ou non. |
| `talents.career.imageAlt` | Éditeur de CV avec une suggestion du coach IA et son explication |
| `talents.career.decide` | Appliquer ou ignorer, vous décidez |
| `talents.jobs.label` | Jobs |
| `talents.jobs.title` | Postuler gratuitement |
| `talents.jobs.text` | Emplois, stages et missions. Consultez les critères, enregistrez les offres qui vous intéressent, postulez et suivez chaque candidature étape par étape. |
| `talents.jobs.imageAlt` | Détail d'une offre avec score de compatibilité et lien Pourquoi |
| `talents.connect.label` | Connect |
| `talents.connect.title` | Échanger avec les recruteurs |
| `talents.connect.text` | Messagerie liée à vos candidatures, invitations, demandes de documents et rendez-vous d'entretien, au même endroit. |
| `talents.connect.imageAlt` | Conversation entre un talent et un recruteur |
| `talents.guarantees.title` | Nos garanties |
| `talents.guarantees.item1` | Candidatures gratuites, quelle que soit la formule. |
| `talents.guarantees.item2` | Profils Free recrutés au même titre que les abonnés. |
| `talents.guarantees.item3` | Vos choix de confidentialité sont respectés. |
| `talents.guarantees.item4` | Licence financée par un partenaire ? Activez-la avec votre code. |
| `talents.guarantees.eyebrow` | Engagements |
| `talents.privacy.title` | Vous décidez qui vous voit |
| `talents.privacy.text` | Votre profil peut rester privé, être visible des recruteurs, ou apparaître de façon anonyme jusqu'à ce que vous acceptiez une mise en relation. Vous pouvez changer ce réglage à tout moment. |
| `talents.plans.title` | Quatre formules, un même parcours |
| `talents.plans.text` | Commencez gratuitement, puis passez à la formule qui correspond à votre objectif. Chaque formule comprend tout ce que propose la précédente. |
| `talents.plans.note` | Les cartes de formules reprennent les textes `pricing.talent.*` du fichier 05. |
| `talents.plans.cta` | Comparer les formules en détail |
| `talents.plans.eyebrow` | Formules |
| `talents.plans.payment` | Paiement par Mobile Money et carte bancaire. Prix en USD. |
| `talents.partners.title` | Votre licence offerte par un partenaire |
| `talents.partners.text` | Université, banque, fondation ou employeur : avec Jumanly Partners, une institution peut financer votre formule. Si vous avez reçu un code, activez-le en quelques secondes. |
| `talents.partners.cta` | Activer un code |
| `talents.finalCta.title` | Prêt à faire le premier pas ? |
| `talents.finalCta.text` | Créez votre compte gratuit, faites votre diagnostic de carrière et découvrez les offres qui vous correspondent. |
| `talents.finalCta.primary` | Créer mon compte gratuit |

Note d'intégration : la ligne `talents.plans.note` n'est pas affichée ; elle indique au développeur de réutiliser les composants de cartes de `/tarifs`.

---

### `/recruteurs` · Pour les recruteurs

*Convaincre les recruteurs indépendants et petites équipes de la valeur de Jumanly Hire et du matching explicable.*

| Clé | Texte |
|---|---|
| `recruiters.seo.title` | Jumanly for RH · Un ATS simple et un matching explicable pour recruter |
| `recruiters.seo.description` | Publiez vos offres, analysez les CV, présélectionnez et échangez avec les candidats. Compte recruteur gratuit pour démarrer, formules RH dès {price} USD/mois. |
| `recruiters.hero.eyebrow` | Jumanly for RH |
| `recruiters.hero.title` | Recruter avec méthode, même en solo |
| `recruiters.hero.text` | Pour les recruteurs indépendants, consultants RH, responsables RH et petites équipes : publiez, triez, échangez et décidez, sans organisation complexe. |
| `recruiters.hero.cta` | Créer mon compte recruteur gratuit |
| `recruiters.hero.secondary` | Voir les formules RH |
| `recruiters.hero.badge` | Un compte recruteur gratuit pour démarrer |
| `recruiters.hero.imageAlt` | Pipeline de recrutement Jumanly Hire avec des candidatures classées par étape |
| `recruiters.intro.text` | Jumanly Hire réunit vos offres, vos candidatures et vos échanges dans un ATS adapté à votre taille. Le matching rapproche les besoins et les qualifications. Vous gardez la décision. |
| `recruiters.benefits.title` | Tout votre recrutement au même endroit |
| `recruiters.benefits.pipeline.title` | Un pipeline clair |
| `recruiters.benefits.pipeline.text` | Chaque candidature avance d'étape en étape, de la réception à l'offre. |
| `recruiters.benefits.cv.title` | Des CV comparables |
| `recruiters.benefits.cv.text` | Analyse structurée des CV, présélection et classement des candidatures. |
| `recruiters.benefits.matching.title` | Un matching explicable |
| `recruiters.benefits.matching.text` | Des suggestions de profils qui disent pourquoi. L'IA recommande, l'humain décide. |
| `recruiters.benefits.messaging.title` | Des échanges suivis |
| `recruiters.benefits.messaging.text` | Messagerie liée aux candidatures, rendez-vous et entretiens au même endroit. |
| `recruiters.matching.title` | Le matching, expliqué |
| `recruiters.matching.text` | Pour chaque offre, vous indiquez les compétences requises et souhaitées, leur poids et vos critères éliminatoires. Jumanly calcule une compatibilité et affiche ce qui la justifie : compétences présentes, compétences manquantes, critères remplis. Vous voyez le raisonnement, vous restez maître du choix. |
| `recruiters.matching.point1` | Critères explicites, définis par vous. |
| `recruiters.matching.point2` | Un « Pourquoi ? » sur chaque score. |
| `recruiters.matching.point3` | Aucune candidature écartée automatiquement par l'IA. |
| `recruiters.matching.imageAlt` | Fiche candidature avec un score de compatibilité et son explication |
| `recruiters.guarantees.title` | Un recrutement responsable |
| `recruiters.guarantees.item1` | Accès aux candidats encadré par leurs choix de confidentialité. |
| `recruiters.guarantees.item2` | Quotas de recherche et de contact qui empêchent l'extraction massive de données. |
| `recruiters.guarantees.item3` | Statistiques de recrutement à chaque étape. |
| `recruiters.guarantees.item4` | Évolution vers Jumanly for Companies à tout moment. |
| `recruiters.plans.title` | Trois formules pour recruter mieux |
| `recruiters.plans.text` | Démarrez avec un compte gratuit et une offre active, puis ajoutez des utilisateurs, des offres et des outils à mesure que vos besoins grandissent. |
| `recruiters.plans.cta` | Comparer les formules RH |
| `recruiters.upsell.title` | Plus de 3 recruteurs ou plusieurs départements ? |
| `recruiters.upsell.text` | Jumanly for Companies ajoute les équipes, les permissions et les rapports consolidés, dès {price} USD par mois. |
| `recruiters.upsell.cta` | Découvrir Jumanly for Companies |
| `recruiters.finalCta.title` | Publiez votre première offre gratuitement |
| `recruiters.finalCta.text` | Un compte recruteur, une offre active, la réception des candidatures et la messagerie : tout cela est inclus dans RH Free. |
| `recruiters.finalCta.primary` | Créer mon compte recruteur |
| `recruiters.hero.visual.title` | 3 profils suggérés |
| `recruiters.hero.visual.text` | Pourquoi ? · Appliquer ou ignorer |
| `recruiters.benefits.eyebrow` | Jumanly Hire |
| `recruiters.matching.eyebrow` | Jumanly Intelligence |
| `recruiters.matching.link` | Comment fonctionne le matching |
| `recruiters.example.initials` | GM |
| `recruiters.example.name` | Grâce Mbuyi |
| `recruiters.example.role` | Analyste de données junior · Kinshasa |
| `recruiters.example.intro` | Somme pondérée des huit critères de votre offre, selon les poids que vous avez définis. |
| `recruiters.example.missing` | Compétences manquantes : Power BI (souhaitée) |
| `recruiters.example.shortlist` | Présélectionner |
| `recruiters.example.message` | Envoyer un message |
| `recruiters.guarantees.eyebrow` | Nos engagements |
| `recruiters.plans.eyebrow` | Formules RH |
| `recruiters.plans.payment` | Paiement par Mobile Money et carte bancaire. Prix en USD. |
| `recruiters.upsell.initials` | MK, AD, FS, JB |
| `recruiters.upsell.more` | +8 |

Note d'intégration : la fiche « Grâce Mbuyi » (`recruiters.example.*`) et les initiales du bandeau (`recruiters.upsell.initials`, `recruiters.upsell.more`) sont des illustrations manifestement fictives, présentées comme un exemple d'écran ; les libellés des critères et du score viennent de la partie 06 (`match.*`).

---

### `/entreprises` · Pour les entreprises

*Présenter l'environnement collaboratif de recrutement et orienter vers les formules Company ou la demande de devis.*

| Clé | Texte |
|---|---|
| `companies.seo.title` | Jumanly for Companies · Recruter en équipe et piloter vos recrutements |
| `companies.seo.description` | Profil entreprise vérifié, ATS partagé, équipes, permissions et rapports consolidés. Formules Company dès {price} USD/mois, Company Premium sur devis. |
| `companies.hero.eyebrow` | Jumanly for Companies |
| `companies.hero.title` | Recruter ensemble, piloter d'un seul regard |
| `companies.hero.text` | Un environnement de recrutement collectif pour les PME, les grandes entreprises et les groupes : plusieurs recruteurs, plusieurs départements, un pilotage commun. |
| `companies.hero.cta` | Créer le compte de mon entreprise |
| `companies.hero.secondary` | Demander un devis |
| `companies.hero.badge` | Commencez gratuitement avec RH Free |
| `companies.hero.imageAlt` | Tableau de bord de recrutement partagé entre plusieurs recruteurs d'une entreprise |
| `companies.intro.text` | La différence avec les formules RH tient au nombre de collaborateurs, à la gestion organisationnelle et aux outils de pilotage. Recruteurs et managers travaillent sur les mêmes candidatures, chacun avec ses droits. |
| `companies.benefits.title` | Un recrutement organisé à l'échelle de votre structure |
| `companies.benefits.verified.title` | Un profil entreprise vérifié |
| `companies.benefits.verified.text` | Une marque employeur reconnaissable, signalée « Entreprise vérifiée » sur chaque offre. |
| `companies.benefits.teams.title` | Équipes et permissions |
| `companies.benefits.teams.text` | Offres attribuées aux responsables, droits par rôle, départements et filiales. |
| `companies.benefits.ats.title` | Un ATS partagé |
| `companies.benefits.ats.text` | Gestion collaborative des candidatures, des entretiens et des grilles d'évaluation. |
| `companies.benefits.reports.title` | Des rapports consolidés |
| `companies.benefits.reports.text` | Tableaux de bord par équipe et département, rapports exportables autorisés. |
| `companies.roles.title` | Chacun son rôle |
| `companies.roles.text` | Propriétaire, administrateur, recruteur, manager ou lecteur : attribuez à chaque collaborateur les droits dont il a besoin, rien de plus. Les rôles disponibles dépendent de votre formule. |
| `companies.guarantees.title` | Nos engagements |
| `companies.guarantees.item1` | Démarrage gratuit avec les fonctionnalités RH Free. |
| `companies.guarantees.item2` | Volumes et services définis par contrat pour Company Premium. |
| `companies.guarantees.item3` | Accès aux candidats encadré par leurs choix de confidentialité. |
| `companies.guarantees.item4` | L'IA recommande, vos équipes décident. |
| `companies.plans.title` | Trois formules à l'échelle de votre organisation |
| `companies.plans.text` | Choisissez selon le nombre de recruteurs et de managers, le volume d'offres et le niveau de pilotage. La formule Premium se construit avec vous. |
| `companies.plans.cta` | Comparer les formules Company |
| `companies.quote.title` | Un groupe, plusieurs entités ou des besoins particuliers ? |
| `companies.quote.text` | Company Premium s'adapte à votre organisation : entités et filiales, workflows configurables, intégrations avec vos outils RH autorisés, tableaux de bord personnalisés et accompagnement à la configuration. |
| `companies.quote.cta` | Demander un devis |
| `companies.partners.title` | Financer l'employabilité de vos équipes |
| `companies.partners.text` | Avec Jumanly Partners, offrez des licences Starter, Pro ou Premium à des collaborateurs, des stagiaires ou des cohortes de jeunes. |
| `companies.partners.cta` | Découvrir Jumanly Partners |
| `companies.finalCta.title` | Commencez gratuitement, évoluez quand vous êtes prêts |
| `companies.finalCta.text` | Créez le compte de votre entreprise avec RH Free, publiez une première offre, puis passez à une formule Company dès que votre équipe grandit. |
| `companies.finalCta.primary` | Créer le compte de mon entreprise |
| `companies.finalCta.secondary` | Demander un devis |
| `companies.hero.visual.orgInitials` | BF |
| `companies.hero.visual.orgName` | Baobab Fintech |
| `companies.hero.visual.team` | 4 recruteurs sur cette offre |
| `companies.hero.visual.initials` | MK, AD, JB, FS |
| `companies.benefits.eyebrow` | Pourquoi Company |
| `companies.roles.eyebrow` | Rôles |
| `companies.roles.chip.owner` | Propriétaire |
| `companies.roles.chip.admin` | Administrateur |
| `companies.roles.chip.recruiter` | Recruteur |
| `companies.roles.chip.manager` | Manager |
| `companies.roles.chip.viewer` | Lecteur |
| `companies.roles.example.members` | Membres de l'organisation |
| `companies.roles.example.member1.name` | Moussa Kanté |
| `companies.roles.example.member1.team` | Direction RH |
| `companies.roles.example.member2.name` | Aminata Diop |
| `companies.roles.example.member2.team` | Direction RH |
| `companies.roles.example.member3.name` | Jean Bakala |
| `companies.roles.example.member3.team` | Finance |
| `companies.roles.example.member4.name` | Fatoumata Sy |
| `companies.roles.example.member4.team` | Tech |
| `companies.roles.example.member5.name` | Paul Nzeza |
| `companies.roles.example.member5.team` | Direction générale |
| `companies.roles.imageAlt` | Liste fictive des membres d'une organisation, chacun avec son rôle |
| `companies.guarantees.eyebrow` | Engagements |
| `companies.plans.eyebrow` | Formules Company |
| `companies.plans.payment` | Paiement par Mobile Money et carte bancaire. Prix en USD. |

Note d'intégration : l'organisation « Baobab Fintech » et ses membres (`companies.hero.visual.*`, `companies.roles.example.*`) sont une illustration manifestement fictive. L'étiquette de formule de la liste des membres affiche le nom de la formule Company recommandée, lu en base.

---

### `/partenaires` · Jumanly Partners

*Expliquer le modèle de licences sponsorisées aux institutions et recueillir leurs demandes de contact.*

| Clé | Texte |
|---|---|
| `partners.seo.title` | Jumanly Partners · Financez l'accès à la formation et à l'emploi |
| `partners.seo.description` | Banques, universités, fondations, entreprises, programmes publics : offrez des licences Jumanly à vos bénéficiaires et suivez l'impact grâce à des rapports agrégés. |
| `partners.hero.eyebrow` | Jumanly Partners |
| `partners.hero.title` | Financez l'avenir professionnel d'un groupe de bénéficiaires |
| `partners.hero.text` | Jumanly Partners permet à une institution de financer l'accès aux formules Starter, Pro ou Premium pour des étudiants, des jeunes, des collaborateurs ou des communautés. |
| `partners.hero.cta` | Nous contacter |
| `partners.hero.imageAlt` | Tableau de bord partenaire avec des indicateurs d'usage agrégés |
| `partners.who.title` | Pour quelles institutions ? |
| `partners.who.banks.title` | Banques |
| `partners.who.banks.text` | Financer l'accès de jeunes à des outils d'employabilité. |
| `partners.who.universities.title` | Universités |
| `partners.who.universities.text` | Proposer des licences d'employabilité aux étudiants finalistes. |
| `partners.who.companies.title` | Entreprises |
| `partners.who.companies.text` | Offrir des formations de préparation ou de développement professionnel à leurs collaborateurs. |
| `partners.who.international.title` | Organisations internationales et agences de coopération |
| `partners.who.international.text` | Financer des cohortes de jeunes dans le cadre de programmes d'insertion. |
| `partners.who.foundations.title` | Fondations |
| `partners.who.foundations.text` | Soutenir des bénéficiaires issus de communautés spécifiques. |
| `partners.who.public.title` | Programmes publics |
| `partners.who.public.text` | Accompagner l'insertion professionnelle à l'échelle d'un programme. |
| `partners.how.title` | Comment ça marche |
| `partners.how.step1.title` | Vous choisissez |
| `partners.how.step1.text` | Le nombre de licences, la formule (Starter, Pro ou Premium) et la durée de l'accès. |
| `partners.how.step2.title` | Nous contractualisons |
| `partners.how.step2.text` | Le contrat fixe les volumes, la durée et les conditions. Il n'y a pas d'achat en ligne. |
| `partners.how.step3.title` | Vos bénéficiaires activent |
| `partners.how.step3.text` | Chacun active sa licence avec un code ou un lien d'invitation, puis profite de la formule pendant la durée convenue. |
| `partners.how.step4.title` | Vous suivez l'impact |
| `partners.how.step4.text` | Votre tableau de bord présente des rapports agrégés : licences activées, formations suivies, attestations obtenues, candidatures envoyées, embauches déclarées. |
| `partners.example.title` | Un exemple concret |
| `partners.example.text` | Une banque finance l'accès Starter de 500 jeunes pendant six mois. |
| `partners.example.formula` | 500 bénéficiaires × 5 USD × 6 mois = 15 000 USD |
| `partners.example.note` | Ce montant est une base commerciale indicative, calculée au tarif individuel de référence. Il peut faire l'objet de remises institutionnelles et n'inclut pas d'éventuels coûts de déploiement additionnels. |
| `partners.example.formulaAlt` | Exemple : cinq cents bénéficiaires multipliés par cinq dollars multipliés par six mois égalent quinze mille dollars. |
| `partners.privacy.title` | Des rapports utiles, une vie privée protégée |
| `partners.privacy.text` | Vous recevez des rapports d'usage et d'impact agrégés. Vous n'avez pas accès aux CV, aux messages ni aux données personnelles de vos bénéficiaires, sauf consentement explicite de leur part. |
| `partners.privacy.point1` | Indicateurs agrégés uniquement. |
| `partners.privacy.point2` | Aucun accès aux CV ni aux messages. |
| `partners.privacy.point3` | Aucune donnée nominative sans consentement. |
| `partners.privacy.point4` | Export des rapports en PDF. |
| `partners.references.title` | Ils financent déjà des licences |
| `partners.references.content` | [Logos et références de partenaires à fournir, avec leur accord écrit] |
| `partners.contact.anchor` | contact |
| `partners.contact.title` | Construisons votre programme ensemble |
| `partners.contact.text` | Décrivez votre projet. Notre équipe vous répond par e-mail pour préparer une proposition adaptée. Vous pouvez aussi nous écrire directement à assistant@jumanly.io. |
| `partners.contact.form.org.label` | Nom de l'institution |
| `partners.contact.form.org.placeholder` | Ex. : Université de… |
| `partners.contact.form.type.label` | Type d'institution |
| `partners.contact.form.type.placeholder` | Choisissez un type |
| `partners.contact.form.type.bank` | Banque ou institution financière |
| `partners.contact.form.type.university` | Université ou école |
| `partners.contact.form.type.foundation` | Fondation |
| `partners.contact.form.type.company` | Entreprise |
| `partners.contact.form.type.international` | Organisation internationale ou agence de coopération |
| `partners.contact.form.type.public` | Programme public |
| `partners.contact.form.type.other` | Autre |
| `partners.contact.form.name.label` | Votre nom complet |
| `partners.contact.form.name.placeholder` | Prénom et nom |
| `partners.contact.form.role.label` | Votre fonction |
| `partners.contact.form.role.placeholder` | Ex. : Responsable RSE |
| `partners.contact.form.email.label` | E-mail professionnel |
| `partners.contact.form.email.placeholder` | nom@institution.org |
| `partners.contact.form.country.label` | Pays |
| `partners.contact.form.country.placeholder` | Choisissez un pays |
| `partners.contact.form.beneficiaries.label` | Nombre approximatif de bénéficiaires |
| `partners.contact.form.beneficiaries.placeholder` | Ex. : 200 |
| `partners.contact.form.beneficiaries.help` | Une estimation suffit. Nous l'affinerons ensemble. |
| `partners.contact.form.plan.label` | Formule envisagée |
| `partners.contact.form.plan.starter` | Starter |
| `partners.contact.form.plan.pro` | Pro |
| `partners.contact.form.plan.premium` | Premium |
| `partners.contact.form.plan.unsure` | Je ne sais pas encore |
| `partners.contact.form.duration.label` | Durée envisagée |
| `partners.contact.form.duration.placeholder` | Ex. : 6 mois |
| `partners.contact.form.message.label` | Votre projet |
| `partners.contact.form.message.placeholder` | Public visé, objectifs, calendrier… |
| `partners.contact.form.consent` | J'accepte que Jumanly utilise ces informations pour répondre à ma demande, conformément à la politique de confidentialité. |
| `partners.contact.form.submit` | Envoyer ma demande |
| `partners.contact.form.sending` | Envoi en cours… |
| `partners.contact.success.title` | Merci, votre demande est envoyée |
| `partners.contact.success.text` | Nous vous répondons par e-mail à l'adresse {email}. Pensez à vérifier vos courriers indésirables. |
| `partners.contact.error` | Votre demande n'a pas pu être envoyée. Réessayez ou écrivez-nous à assistant@jumanly.io. |
| `partners.contact.form.error.required` | Ce champ est obligatoire. |
| `partners.contact.form.error.email` | Saisissez une adresse e-mail valide. |
| `partners.contact.form.error.number` | Saisissez un nombre. |
| `partners.contact.form.error.consent` | Votre accord est nécessaire pour que nous puissions vous répondre. |
| `partners.beneficiary.title` | Vous avez reçu un code de licence ? |
| `partners.beneficiary.text` | Activez votre accès sponsorisé en quelques secondes. |
| `partners.beneficiary.cta` | Activer mon code |
| `partners.hero.visual.orgInitials` | FH |
| `partners.hero.visual.orgName` | Fondation Horizon |
| `partners.hero.visual.program` | Programme Cohorte 2026 · Starter · 6 mois |
| `partners.hero.visual.aggregated` | Agrégé |
| `partners.hero.visual.licenses.label` | Licences activées |
| `partners.hero.visual.licenses.value` | 412 / 500 |
| `partners.hero.visual.courses.label` | Formations suivies |
| `partners.hero.visual.courses.value` | 1 268 |
| `partners.hero.visual.certificates.label` | Attestations obtenues |
| `partners.hero.visual.certificates.value` | 534 |
| `partners.hero.visual.applications.label` | Candidatures envoyées |
| `partners.hero.visual.applications.value` | 2 041 |
| `partners.hero.visual.chart.title` | Licences activées par mois |
| `partners.hero.visual.chart.months` | Mai, Juin, Juil., Août, Sept., Oct. |
| `partners.who.eyebrow` | Institutions |
| `partners.how.eyebrow` | Le modèle |
| `partners.example.beneficiaries.value` | 500 |
| `partners.example.beneficiaries.unit` | bénéficiaires |
| `partners.example.price.value` | 5 USD |
| `partners.example.months.value` | 6 |
| `partners.example.months.unit` | mois |
| `partners.example.total.value` | 15 000 USD |
| `partners.privacy.eyebrow` | Confidentialité |
| `partners.contact.eyebrow` | Contact |

Note d'intégration : le tableau de bord du héros (`partners.hero.visual.*`, « Fondation Horizon ») est une illustration manifestement fictive. Les éléments de la formule d'exemple (`partners.example.*.value`) reprennent `partners.example.formula`, lue en entier par les lecteurs d'écran via `partners.example.formulaAlt`.

---

### `/formations` · Catalogue public

*Laisser le visiteur explorer les formations, comprendre ce qui est gratuit et ce qui demande un forfait.*

| Clé | Texte |
|---|---|
| `trainings.seo.title` | Formations Jumanly Learn · Employabilité et compétences professionnelles |
| `trainings.seo.description` | Formations vidéo, exercices et attestations pour gagner en employabilité. Une sélection est gratuite, les autres sont incluses dans les formules Starter, Pro et Premium. |
| `trainings.hero.eyebrow` | Jumanly Learn |
| `trainings.hero.title` | Formations |
| `trainings.hero.text` | Formations vidéo, supports, exercices, évaluations et attestations. Commencez par les formations gratuites, puis accédez à davantage de parcours selon votre forfait. |
| `trainings.search.label` | Rechercher une formation |
| `trainings.search.placeholder` | Ex. : entretien, CV, prise de parole |
| `trainings.search.submit` | Rechercher |
| `trainings.filters.title` | Filtres |
| `trainings.filters.open` | Filtrer |
| `trainings.filters.apply` | Afficher les résultats |
| `trainings.filters.reset` | Effacer les filtres |
| `trainings.filters.theme.label` | Thème |
| `trainings.filters.theme.all` | Tous les thèmes |
| `trainings.filters.level.label` | Niveau |
| `trainings.filters.level.all` | Tous les niveaux |
| `trainings.filters.level.beginner` | Débutant |
| `trainings.filters.level.intermediate` | Intermédiaire |
| `trainings.filters.level.advanced` | Avancé |
| `trainings.filters.access.label` | Accès |
| `trainings.filters.access.all` | Toutes les formations |
| `trainings.filters.access.free` | Gratuites |
| `trainings.filters.access.starter` | Incluses dans Starter |
| `trainings.filters.access.pro` | Incluses dans Pro |
| `trainings.filters.access.premium` | Incluses dans Premium |
| `trainings.sort.label` | Trier par |
| `trainings.sort.recent` | Plus récentes |
| `trainings.sort.popular` | Plus suivies |
| `trainings.sort.duration` | Durée |
| `trainings.results.count` | {count, plural, =0 {Aucune formation} one {# formation} other {# formations}} |
| `trainings.card.duration` | {duration} |
| `trainings.card.lessons` | {count, plural, one {# leçon} other {# leçons}} |
| `trainings.card.level` | Niveau {level} |
| `trainings.card.certificate` | Attestation |
| `trainings.card.badge.free` | Gratuite |
| `trainings.card.badge.plan` | Inclus dans {plan} |
| `trainings.card.cta` | Voir la formation |
| `trainings.card.imageAlt` | Illustration de la formation {title} |
| `trainings.empty.title` | Aucune formation ne correspond à votre recherche |
| `trainings.empty.text` | Essayez d'autres mots-clés ou retirez un filtre. |
| `trainings.empty.cta` | Effacer les filtres |
| `trainings.emptyCatalog.title` | Le catalogue se prépare |
| `trainings.emptyCatalog.text` | Les premières formations arrivent bientôt. Créez votre compte pour être prévenu de leur ouverture. |
| `trainings.pagination.prev` | Précédent |
| `trainings.pagination.next` | Suivant |
| `trainings.pagination.page` | Page {page} sur {total} |
| `trainings.banner.title` | Accédez à plus de formations |
| `trainings.banner.text` | Les formules Starter, Pro et Premium ouvrent progressivement les formations fondamentales, les parcours standards et les parcours avancés. |
| `trainings.banner.cta` | Voir les forfaits |

---

### `/formations/[slug]` · Fiche formation publique

*Donner envie de commencer une formation, en étant clair sur le forfait requis.*

| Clé | Texte |
|---|---|
| `training.seo.title` | {title} · Formation Jumanly Learn |
| `training.seo.description` | {summary} Durée : {duration}. Niveau : {level}. |
| `training.breadcrumb.trainings` | Formations |
| `training.badge.free` | Formation gratuite |
| `training.badge.plan` | Incluse dans {plan} et plus |
| `training.meta.duration` | Durée : {duration} |
| `training.meta.level` | Niveau : {level} |
| `training.meta.lessons` | {count, plural, one {# leçon} other {# leçons}} |
| `training.meta.certificate` | Attestation de réussite |
| `training.meta.language` | Langue : {language} |
| `training.about.title` | À propos de cette formation |
| `training.objectives.title` | Ce que vous allez apprendre |
| `training.audience.title` | Pour qui ? |
| `training.program.title` | Programme |
| `training.program.module` | Module {number} · {title} |
| `training.program.lessonDuration` | {duration} |
| `training.program.preview` | Aperçu gratuit |
| `training.program.locked` | Accessible après inscription |
| `training.preview.title` | Première leçon en aperçu |
| `training.preview.text` | Regardez la première leçon gratuitement, sans créer de compte. |
| `training.preview.play` | Lire l'aperçu |
| `training.preview.position` | Module {module} · Leçon {lesson} |
| `training.preview.videoAlt` | Vidéo d'aperçu de la formation {title} |
| `training.certificate.title` | Une attestation à valoriser |
| `training.certificate.text` | En terminant la formation et ses évaluations, vous obtenez une attestation téléchargeable, vérifiable par un lien public et visible sur votre profil. |
| `training.certificate.sample.intro` | Jumanly atteste que |
| `training.certificate.sample.text` | a suivi et validé « {title} » ({duration}). |
| `training.instructor.role` | Formateur de cette formation |
| `training.cta.start` | Commencer |
| `training.cta.startFree` | Commencer gratuitement |
| `training.cta.requiredPlan` | Cette formation est incluse dans la formule {plan}. Créez votre compte pour y accéder. |
| `training.cta.seePlans` | Voir les forfaits |
| `training.cta.note` | Inscription gratuite. Vous reviendrez directement à cette formation. |
| `training.related.title` | Formations associées |
| `training.notFound.title` | Formation introuvable |
| `training.notFound.text` | Cette formation n'existe pas ou n'est plus disponible. |
| `training.notFound.cta` | Voir le catalogue |

---

### `/offres` · Offres publiques

*Permettre à tout visiteur de chercher des offres et de postuler gratuitement après inscription.*

| Clé | Texte |
|---|---|
| `jobs.seo.title` | Offres d'emploi, stages et missions · Jumanly Jobs |
| `jobs.seo.description` | Trouvez des emplois, stages et missions et postulez gratuitement. Suivez chaque candidature étape par étape sur Jumanly. |
| `jobs.hero.eyebrow` | Jumanly Jobs |
| `jobs.hero.title` | Offres d'emploi |
| `jobs.hero.text` | Emplois, stages et missions publiés par des recruteurs et des entreprises. Postuler est toujours gratuit. |
| `jobs.search.keyword.label` | Mot-clé |
| `jobs.search.keyword.placeholder` | Métier, compétence, entreprise |
| `jobs.search.city.label` | Ville |
| `jobs.search.city.placeholder` | Votre ville |
| `jobs.search.country.label` | Pays |
| `jobs.search.country.placeholder` | Tous les pays |
| `jobs.search.contract.label` | Type de contrat |
| `jobs.search.contract.all` | Tous les contrats |
| `jobs.search.contract.cdi` | CDI |
| `jobs.search.contract.cdd` | CDD |
| `jobs.search.contract.internship` | Stage |
| `jobs.search.contract.mission` | Mission ou freelance |
| `jobs.search.contract.alternance` | Alternance |
| `jobs.search.contract.volunteer` | Volontariat |
| `jobs.search.remote.label` | Télétravail |
| `jobs.search.remote.all` | Indifférent |
| `jobs.search.remote.onsite` | Sur site |
| `jobs.search.remote.hybrid` | Hybride |
| `jobs.search.remote.full` | Télétravail complet |
| `jobs.search.submit` | Rechercher |
| `jobs.search.reset` | Effacer les filtres |
| `jobs.search.openFilters` | Filtres |
| `jobs.search.filtersCount` | {count, plural, =0 {Filtres} other {Filtres · #}} |
| `jobs.results.count` | {count, plural, =0 {Aucune offre} one {# offre} other {# offres}} |
| `jobs.sort.label` | Trier par |
| `jobs.sort.recent` | Plus récentes |
| `jobs.sort.deadline` | Date limite proche |
| `jobs.card.company` | {company} |
| `jobs.card.location` | {city}, {country} |
| `jobs.card.remote.onsite` | Sur site |
| `jobs.card.remote.hybrid` | Hybride |
| `jobs.card.remote.full` | Télétravail |
| `jobs.card.published` | Publiée {relativeDate} |
| `jobs.card.deadline` | Date limite : {date} |
| `jobs.card.verified` | Entreprise vérifiée |
| `jobs.card.save` | Enregistrer l'offre |
| `jobs.card.saveLoginHint` | Connectez-vous pour enregistrer cette offre. |
| `jobs.card.cta` | Voir l'offre |
| `jobs.card.logoAlt` | Logo de {company} |
| `jobs.matchHint.text` | Connectez-vous pour voir votre compatibilité avec chaque offre et savoir pourquoi. |
| `jobs.matchHint.cta` | Se connecter |
| `jobs.empty.title` | Aucune offre ne correspond à votre recherche |
| `jobs.empty.text` | Élargissez la zone, retirez un filtre ou essayez un autre mot-clé. |
| `jobs.empty.cta` | Effacer les filtres |
| `jobs.emptyAll.title` | Les premières offres arrivent bientôt |
| `jobs.emptyAll.text` | Créez votre compte dès maintenant pour préparer votre profil et être prévenu des nouvelles offres. |
| `jobs.emptyAll.cta` | Créer mon compte gratuit |
| `jobs.recruiterBanner.title` | Vous recrutez ? |
| `jobs.recruiterBanner.text` | Publiez votre première offre gratuitement avec RH Free. |
| `jobs.recruiterBanner.cta` | Publier une offre |
| `jobs.pagination.prev` | Précédent |
| `jobs.pagination.next` | Suivant |
| `jobs.pagination.page` | Page {page} sur {total} |

---

### `/offres/[slug]` · Détail d'offre public

*Présenter l'offre complète et mener à une candidature gratuite (connexion puis retour sur l'offre).*

| Clé | Texte |
|---|---|
| `job.seo.title` | {title} · {company} · {city} · Jumanly |
| `job.seo.description` | {company} recrute : {title} à {city}, {contract}. Postulez gratuitement sur Jumanly. |
| `job.breadcrumb.jobs` | Offres d'emploi |
| `job.header.company` | {company} |
| `job.header.verified` | Entreprise vérifiée |
| `job.header.verifiedHelp` | L'identité de cette entreprise a été vérifiée par Jumanly. |
| `job.header.location` | {city}, {country} |
| `job.header.contract` | {contract} |
| `job.header.remote` | {remote} |
| `job.header.salary` | {salary} |
| `job.header.salaryHidden` | Rémunération non communiquée |
| `job.header.published` | Publiée le {date} |
| `job.header.deadline` | Candidatures jusqu'au {date} |
| `job.header.logoAlt` | Logo de {company} |
| `job.cta.apply` | Postuler gratuitement |
| `job.cta.applyNote` | Gratuit, quel que soit votre forfait. Vous reviendrez sur cette offre après connexion. |
| `job.cta.save` | Enregistrer |
| `job.cta.share` | Partager |
| `job.cta.shareCopied` | Lien copié. |
| `job.cta.report` | Signaler cette offre |
| `job.description.title` | Description du poste |
| `job.missions.title` | Missions |
| `job.requirements.title` | Profil recherché |
| `job.skills.required` | Compétences requises |
| `job.skills.preferred` | Compétences souhaitées |
| `job.criteria.title` | Critères indispensables |
| `job.criteria.help` | Ces critères sont fixés par le recruteur. Ils sont affichés pour que vous sachiez exactement ce qui est attendu. |
| `job.languages.title` | Langues |
| `job.benefits.title` | Ce que nous offrons |
| `job.process.title` | Déroulement du recrutement |
| `job.company.title` | À propos de {company} |
| `job.company.cta` | Voir la page de l'entreprise |
| `job.match.title` | Votre compatibilité avec cette offre |
| `job.match.text` | Connectez-vous pour voir votre score de compatibilité, les raisons de ce score et les formations qui peuvent combler un écart. |
| `job.match.cta` | Se connecter |
| `job.closed.title` | Cette offre n'accepte plus de candidatures |
| `job.closed.text` | Découvrez d'autres offres proches. |
| `job.closed.cta` | Voir les offres similaires |
| `job.similar.title` | Offres similaires |
| `job.notFound.title` | Offre introuvable |
| `job.notFound.text` | Cette offre a été retirée ou n'existe pas. |
| `job.notFound.cta` | Voir toutes les offres |
| `job.report.title` | Signaler cette offre |
| `job.report.reason.label` | Motif |
| `job.report.reason.fraud` | Offre frauduleuse ou demande d'argent |
| `job.report.reason.discrimination` | Contenu discriminatoire |
| `job.report.reason.misleading` | Informations trompeuses |
| `job.report.reason.other` | Autre |
| `job.report.details.label` | Précisions |
| `job.report.details.placeholder` | Décrivez ce qui vous semble anormal. |
| `job.report.submit` | Envoyer le signalement |
| `job.report.loginRequired` | Connectez-vous pour signaler une offre. |
| `job.report.success` | Merci. Notre équipe va examiner cette offre. |
| `job.safety.text` | Un recruteur ne doit jamais vous demander d'argent pour postuler. En cas de doute, signalez l'offre. |

---

### `/entreprises/[slug]` · Page entreprise publique

*Présenter un employeur et ses offres ouvertes (livré à l'étape E8).*

| Clé | Texte |
|---|---|
| `companyPage.seo.title` | {company} · Offres et présentation · Jumanly |
| `companyPage.seo.description` | Découvrez {company} et ses offres ouvertes. Postulez gratuitement sur Jumanly. |
| `companyPage.verified` | Entreprise vérifiée |
| `companyPage.logoAlt` | Logo de {company} |
| `companyPage.coverAlt` | Image de présentation de {company} |
| `companyPage.sector` | Secteur : {sector} |
| `companyPage.size` | Taille : {size} |
| `companyPage.location` | Siège : {city}, {country} |
| `companyPage.website` | Site web |
| `companyPage.about.title` | Présentation |
| `companyPage.jobs.title` | Offres ouvertes |
| `companyPage.jobs.count` | {count, plural, =0 {Aucune offre ouverte} one {# offre ouverte} other {# offres ouvertes}} |
| `companyPage.jobs.empty` | Cette entreprise n'a pas d'offre ouverte pour le moment. |
| `companyPage.jobs.emptyCta` | Voir toutes les offres |
| `companyPage.notFound.title` | Entreprise introuvable |
| `companyPage.notFound.text` | Cette page n'existe pas ou n'est plus publique. |
| `companyPage.jobs.row` | {city} · {contract} |

---

### `/faq` · Questions fréquentes

*Répondre aux questions courantes de chaque public, classées par thème.*

| Clé | Texte |
|---|---|
| `faq.seo.title` | Questions fréquentes · Jumanly |
| `faq.seo.description` | Gratuité, forfaits, paiement par Mobile Money et carte, intelligence artificielle, confidentialité, recrutement et licences partenaires : toutes les réponses sur Jumanly. |
| `faq.hero.title` | Questions fréquentes |
| `faq.hero.text` | Vous ne trouvez pas votre réponse ? Écrivez-nous, nous vous répondons par e-mail. |
| `faq.hero.eyebrow` | FAQ |
| `faq.search.label` | Rechercher une question |
| `faq.search.placeholder` | Ex. : paiement, visibilité du profil |
| `faq.search.empty` | Aucune question ne correspond. Essayez un autre mot ou écrivez-nous. |
| `faq.themes.label` | Thèmes |
| `faq.theme.general` | Jumanly en général |
| `faq.theme.talents` | Talents et candidatures |
| `faq.theme.learn` | Formations |
| `faq.theme.ai` | Intelligence artificielle |
| `faq.theme.privacy` | Confidentialité et données |
| `faq.theme.billing` | Forfaits et paiement |
| `faq.theme.recruiters` | Recruteurs et entreprises |
| `faq.theme.partners` | Partenaires et licences |
| `faq.general.q1` | Qu'est-ce que Jumanly ? |
| `faq.general.a1` | Jumanly est une plateforme qui réunit la formation professionnelle, le développement de carrière, les offres d'emploi et la gestion du recrutement. Elle s'adresse aux talents, aux professionnels des ressources humaines et aux organisations. |
| `faq.general.q2` | Qui est derrière Jumanly ? |
| `faq.general.a2` | Jumanly est une plateforme développée et portée par The Growth Lab, qui en assure la direction stratégique, les contenus, la politique commerciale et la supervision. |
| `faq.general.q3` | Puis-je utiliser Jumanly sur mon téléphone ? |
| `faq.general.a3` | Oui. Le site est conçu d'abord pour le téléphone et fonctionne aussi sur tablette et ordinateur, depuis votre navigateur. |
| `faq.general.q4` | Puis-je être à la fois talent et recruteur ? |
| `faq.general.a4` | Oui. Vous avez un compte personnel et vous pouvez aussi être membre d'une ou plusieurs organisations. Un sélecteur vous permet de passer de votre espace personnel à celui de votre organisation. |
| `faq.talents.q1` | Dois-je payer pour postuler ? |
| `faq.talents.a1` | Non. Les candidatures sont gratuites et illimitées pour tous, quel que soit votre forfait, même si vos quotas d'assistance IA sont épuisés. |
| `faq.talents.q2` | Les recruteurs favorisent-ils les abonnés payants ? |
| `faq.talents.a2` | Non. Les profils Free peuvent être sélectionnés et recrutés au même titre que les abonnés payants. Votre forfait ne vous donne ni priorité ni désavantage dans les candidatures. |
| `faq.talents.q3` | Comment suivre mes candidatures ? |
| `faq.talents.a3` | Dans votre espace, la rubrique « Mes candidatures » affiche l'étape de chaque candidature, son historique et les messages du recruteur. |
| `faq.talents.q4` | Que contient le forfait gratuit ? |
| `faq.talents.a4` | Votre compte et votre profil professionnel, un diagnostic de carrière simplifié, la consultation des offres, les candidatures gratuites et leur suivi, 5 modèles de CV, une sélection de formations gratuites, des conseils généraux de préparation et la messagerie liée aux candidatures. |
| `faq.learn.q1` | Les formations donnent-elles une attestation ? |
| `faq.learn.a1` | Oui. Lorsque vous terminez une formation et ses évaluations, vous obtenez une attestation téléchargeable en PDF, avec un lien de vérification public. Elle peut apparaître sur votre profil. |
| `faq.learn.q2` | Quelles formations sont gratuites ? |
| `faq.learn.a2` | Une sélection de formations est accessible à tous. Dans le catalogue, chaque formation indique si elle est gratuite ou incluse dans une formule. |
| `faq.learn.q3` | Puis-je essayer une formation avant de m'inscrire ? |
| `faq.learn.a3` | Oui. La première leçon de chaque formation est visible en aperçu sur sa fiche publique. |
| `faq.ai.q1` | L'IA décide-t-elle qui est recruté ? |
| `faq.ai.a1` | Non. L'IA recommande, l'humain décide. Le matching aide les recruteurs à repérer des profils, mais aucune candidature n'est acceptée ou refusée automatiquement. |
| `faq.ai.q2` | Comment savoir pourquoi l'IA me suggère quelque chose ? |
| `faq.ai.a2` | Chaque suggestion porte un lien « Pourquoi ? » qui explique sur quoi elle repose : compétences, expériences, critères de l'offre. Vous pouvez appliquer ou ignorer chaque suggestion. |
| `faq.ai.q3` | Que se passe-t-il quand mon quota d'assistance IA est atteint ? |
| `faq.ai.a3` | La fonctionnalité concernée est mise en pause jusqu'au renouvellement de votre période. Vous pouvez attendre ou passer à une formule supérieure. Vos candidatures, elles, restent toujours possibles. |
| `faq.privacy.q1` | Qui peut voir mon profil ? |
| `faq.privacy.a1` | Vous choisissez parmi trois réglages : privé (seuls les recruteurs des offres auxquelles vous postulez le voient), visible des recruteurs, ou anonyme (nom et photo masqués jusqu'à ce que vous acceptiez une mise en relation). |
| `faq.privacy.q2` | Un recruteur peut-il me contacter sans que j'aie postulé ? |
| `faq.privacy.a2` | Seulement si votre profil est visible dans le vivier. Il vous envoie alors une demande de mise en relation, que vous êtes libre d'accepter ou de refuser avant tout échange. |
| `faq.privacy.q3` | Puis-je télécharger ou supprimer mes données ? |
| `faq.privacy.a3` | Oui. Dans vos paramètres, vous pouvez exporter vos données et demander la suppression de votre compte. |
| `faq.billing.q1` | Comment puis-je payer ? |
| `faq.billing.a1` | Par Mobile Money ou par carte bancaire. Les prix sont affichés en USD. |
| `faq.billing.q2` | Mon abonnement se renouvelle-t-il automatiquement ? |
| `faq.billing.a2` | Avec Mobile Money, l'abonnement est prépayé pour une période. Nous vous rappelons l'échéance 7 jours, 3 jours et le jour même. Sans renouvellement, vous bénéficiez d'un court délai de grâce, puis vous revenez au forfait gratuit. |
| `faq.billing.q3` | Est-ce que je perds mes données si je reviens au forfait gratuit ? |
| `faq.billing.a3` | Non. Votre profil, vos CV, vos attestations et vos candidatures sont conservés. Seules les fonctionnalités payantes sont mises en pause. |
| `faq.billing.q4` | Puis-je changer de formule ? |
| `faq.billing.a4` | Oui, à tout moment. Une montée en gamme s'applique immédiatement. Une réduction prend effet à la fin de la période déjà payée. |
| `faq.recruiters.q1` | Puis-je recruter gratuitement ? |
| `faq.recruiters.a1` | Oui. RH Free comprend un compte recruteur, une offre active, la réception des candidatures, une gestion simple des étapes et la messagerie liée aux candidatures. |
| `faq.recruiters.q2` | Quelle différence entre Jumanly for RH et Jumanly for Companies ? |
| `faq.recruiters.a2` | Les formules RH conviennent aux recruteurs indépendants et aux petites équipes, jusqu'à 3 utilisateurs. Les formules Company ajoutent davantage de collaborateurs, un profil entreprise vérifié, la gestion d'équipes, des permissions et des rapports de pilotage. |
| `faq.recruiters.q3` | Pourquoi la recherche de talents est-elle limitée par des quotas ? |
| `faq.recruiters.a3` | Pour protéger les talents. Les quotas de recherche et de mise en relation empêchent l'extraction massive de données personnelles. |
| `faq.recruiters.q4` | Comment obtenir le badge « Entreprise vérifiée » ? |
| `faq.recruiters.a4` | Le profil entreprise vérifié est inclus dans les formules Company. Notre équipe vérifie les informations de votre organisation avant d'afficher le badge. |
| `faq.partners.q1` | Qu'est-ce qu'une licence sponsorisée ? |
| `faq.partners.a1` | C'est un accès Starter, Pro ou Premium financé par une institution (banque, université, fondation, entreprise, programme public) pour une durée convenue. Vous n'avez rien à payer. |
| `faq.partners.q2` | Comment activer ma licence ? |
| `faq.partners.a2` | Avec le code ou le lien d'invitation reçu de l'institution. Connectez-vous ou créez votre compte, puis saisissez votre code sur la page d'activation. |
| `faq.partners.q3` | L'institution qui finance ma licence voit-elle mon CV ou mes messages ? |
| `faq.partners.a3` | Non. Elle reçoit uniquement des rapports agrégés d'usage et d'impact, sans CV, sans messages et sans donnée nominative, sauf si vous y consentez. |
| `faq.cta.title` | Vous avez encore une question ? |
| `faq.cta.text` | Écrivez-nous, nous vous répondons par e-mail. |
| `faq.cta.button` | Nous contacter |

Nombre de questions : 28, réparties en 8 thèmes.

---

### `/contact` · Contact

*Recueillir les demandes par formulaire et donner les adresses e-mail. Aucun téléphone.*

| Clé | Texte |
|---|---|
| `contact.seo.title` | Contact · Jumanly |
| `contact.seo.description` | Une question, un projet de recrutement ou de partenariat ? Écrivez à l'équipe Jumanly via le formulaire ou par e-mail. |
| `contact.hero.title` | Contactez-nous |
| `contact.hero.text` | Une question, une suggestion ou un projet ? Remplissez le formulaire ou écrivez-nous directement. Nous répondons par e-mail. |
| `contact.hero.eyebrow` | Contact |
| `contact.emails.title` | Nos adresses |
| `contact.emails.pro.label` | Professionnels, entreprises et partenaires |
| `contact.emails.pro.value` | assistant@jumanly.io |
| `contact.emails.general.label` | Questions générales |
| `contact.emails.general.value` | infojumanly@gmail.com |
| `contact.emails.site.label` | Site |
| `contact.emails.site.value` | jumanly.io |
| `contact.faqHint.text` | Votre réponse se trouve peut-être déjà dans les questions fréquentes. |
| `contact.faqHint.cta` | Consulter la FAQ |
| `contact.form.title` | Envoyer un message |
| `contact.form.subject.label` | Sujet |
| `contact.form.subject.placeholder` | Choisissez un sujet |
| `contact.form.subject.account` | Mon compte et ma connexion |
| `contact.form.subject.talent` | Formations, carrière et candidatures |
| `contact.form.subject.billing` | Abonnement et paiement |
| `contact.form.subject.recruiter` | Recrutement et formules RH |
| `contact.form.subject.quote` | Demande de devis Company Premium |
| `contact.form.subject.partners` | Jumanly Partners et licences sponsorisées |
| `contact.form.subject.privacy` | Données personnelles et confidentialité |
| `contact.form.subject.report` | Signaler un abus ou une offre suspecte |
| `contact.form.subject.press` | Presse et médias |
| `contact.form.subject.other` | Autre demande |
| `contact.form.name.label` | Nom complet |
| `contact.form.name.placeholder` | Prénom et nom |
| `contact.form.email.label` | E-mail |
| `contact.form.email.placeholder` | vous@exemple.com |
| `contact.form.email.help` | Nous vous répondrons à cette adresse. |
| `contact.form.organization.label` | Organisation |
| `contact.form.organization.placeholder` | Nom de votre entreprise ou institution |
| `contact.form.organization.help` | Facultatif, utile pour les demandes professionnelles. |
| `contact.form.country.label` | Pays |
| `contact.form.country.placeholder` | Choisissez un pays |
| `contact.form.quote.users.label` | Nombre d'utilisateurs envisagé |
| `contact.form.quote.users.placeholder` | Ex. : 40 |
| `contact.form.quote.entities.label` | Nombre d'entités ou de filiales |
| `contact.form.quote.entities.placeholder` | Ex. : 3 |
| `contact.form.message.label` | Message |
| `contact.form.message.placeholder` | Décrivez votre demande en quelques lignes. |
| `contact.form.message.counter` | {count} / {max} caractères |
| `contact.form.consent` | J'accepte que Jumanly utilise ces informations pour répondre à ma demande, conformément à la politique de confidentialité. |
| `contact.form.consentLink` | politique de confidentialité |
| `contact.form.submit` | Envoyer mon message |
| `contact.form.sending` | Envoi en cours… |
| `contact.form.error.required` | Ce champ est obligatoire. |
| `contact.form.error.email` | Saisissez une adresse e-mail valide. |
| `contact.form.error.messageShort` | Votre message est trop court. Ajoutez quelques précisions. |
| `contact.form.error.messageLong` | Votre message dépasse {max} caractères. |
| `contact.form.error.consent` | Votre accord est nécessaire pour que nous puissions vous répondre. |
| `contact.form.error.rateLimit` | Vous avez envoyé plusieurs messages en peu de temps. Réessayez dans quelques minutes. |
| `contact.form.error.send` | Votre message n'a pas pu être envoyé. Réessayez ou écrivez-nous à infojumanly@gmail.com. |
| `contact.success.title` | Merci, votre message est envoyé |
| `contact.success.text` | Nous vous répondons par e-mail à l'adresse {email}. Pensez à vérifier vos courriers indésirables. |
| `contact.success.cta` | Revenir à l'accueil |

Note d'intégration : le sujet « Demande de devis Company Premium » affiche les champs `contact.form.quote.*` et `contact.form.organization` devient obligatoire. Le lien `/contact?sujet=devis` présélectionne ce sujet. Les messages au sujet professionnel (devis, recrutement, partenaires, presse) sont routés vers assistant@jumanly.io, les autres vers infojumanly@gmail.com.


---

## Partie 02 · Inscription et connexion

Textes définitifs de l'authentification, de l'inscription en 6 étapes avec choix du forfait, et de l'activation d'une licence Partners (doc 07, § 2).

Conventions : identiques au fichier 01 (variables ICU, prix et quotas en variables, aucun téléphone). Les libellés partagés `common.*` sont définis dans la partie 01. Les écrans détaillés de paiement (Mobile Money, carte, attente, échec) sont dans la partie 05 (clés `checkout.*`) et sont réutilisés à l'étape 5.

Rappel du paramètre `?suite=` : si le visiteur arrive depuis une action (postuler, commencer une formation, enregistrer), il est ramené à cette action à la fin de l'inscription ou de la connexion. Les messages `auth.resume.*` l'en informent.

---

### Commun · Authentification

*Libellés partagés par tous les écrans d'authentification.*

| Clé | Texte |
|---|---|
| `auth.layout.tagline` | Learn. Grow. Connect. |
| `auth.layout.signature` | Une plateforme développée par The Growth Lab |
| `auth.layout.imageAlt` | Aperçu de l'espace Jumanly sur téléphone |
| `auth.layout.backHome` | Retour au site |
| `auth.layout.eyebrow` | Jumanly |
| `auth.layout.languageShort` | FR |
| `auth.layout.languageLabel` | Langue : français |
| `auth.or` | ou |
| `auth.google` | Continuer avec Google |
| `auth.password.show` | Afficher le mot de passe |
| `auth.password.hide` | Masquer le mot de passe |
| `auth.resume.apply` | Connectez-vous pour postuler à l'offre « {jobTitle} ». Vous y reviendrez juste après. |
| `auth.resume.training` | Connectez-vous pour commencer la formation « {trainingTitle} ». Vous y reviendrez juste après. |
| `auth.resume.save` | Connectez-vous pour enregistrer cette offre. Vous y reviendrez juste après. |
| `auth.resume.generic` | Connectez-vous pour continuer. Vous reviendrez à la page que vous consultiez. |
| `auth.legal.text` | En continuant, vous acceptez les {terms} et la {privacy} de Jumanly. |
| `auth.legal.terms` | conditions générales |
| `auth.legal.privacy` | politique de confidentialité |
| `auth.orEmail` | ou avec votre e-mail |
| `auth.entry.aria` | Connexion ou inscription |
| `auth.entry.loginTab` | Se connecter |
| `auth.entry.signupTab` | Créer un compte |
| `auth.social.label` | Continuer avec |
| `auth.social.signupLabel` | S'inscrire avec |
| `auth.social.google` | Google |
| `auth.social.apple` | Apple |
| `auth.social.linkedin` | LinkedIn |
| `auth.social.aria.continue` | Continuer avec {provider} |
| `auth.social.aria.signup` | S'inscrire avec {provider} |

#### Scène d'accueil de `/connexion` et `/inscription`

*Décor animé à gauche du formulaire (docs/refonte-connexion/BRIEF-CONNEXION-V2.md). Les mots entre `<hl>` et `</hl>` s'affichent en dégradé. Les chiffres des cartes sont des illustrations de l'appli, identiques pour tout le monde, jamais des données d'un compte.*

| Clé | Texte |
|---|---|
| `auth.stage.rolesLabel` | Je suis |
| `auth.stage.roles.talent` | Talent |
| `auth.stage.roles.rh` | RH |
| `auth.stage.roles.company` | Entreprise |
| `auth.stage.slogan` | Learn. Grow. <hl>Connect.</hl> |
| `auth.stage.talent.eyebrow` | Pour les talents |
| `auth.stage.talent.hook` | Prêt à <hl>booster votre employabilité</hl> ? |
| `auth.stage.talent.sub` | Formez-vous, renforcez votre CV et laissez les offres venir à vous. |
| `auth.stage.talent.line` | Connectez-vous pour reprendre votre parcours |
| `auth.stage.talent.cards.1.value` | 82 |
| `auth.stage.talent.cards.1.title` | Force du profil |
| `auth.stage.talent.cards.1.text` | 82 % · en progression |
| `auth.stage.talent.cards.2.title` | Nouvelle offre pour vous |
| `auth.stage.talent.cards.2.text` | Analyste de données junior |
| `auth.stage.talent.cards.2.pill` | Compatibilité 87 % |
| `auth.stage.talent.cards.3.title` | Certificat obtenu |
| `auth.stage.talent.cards.3.text` | Excel pour l'analyse |
| `auth.stage.rh.eyebrow` | Pour les professionnels RH |
| `auth.stage.rh.hook` | Prêt à recruter les <hl>bons profils</hl>, plus vite ? |
| `auth.stage.rh.sub` | Publiez, triez et échangez avec vos candidats au même endroit, avec une IA qui explique ses choix. |
| `auth.stage.rh.line` | Connectez-vous pour retrouver vos candidats |
| `auth.stage.rh.cards.1.title` | Profil recommandé |
| `auth.stage.rh.cards.1.text` | Kofi A. · Data analyst |
| `auth.stage.rh.cards.1.pill` | Pourquoi ? |
| `auth.stage.rh.cards.2.title` | Entretien planifié |
| `auth.stage.rh.cards.2.text` | Jeudi · 10:00 |
| `auth.stage.rh.cards.3.title` | Candidatures triées |
| `auth.stage.rh.cards.3.text` | Pipeline à jour |
| `auth.stage.company.eyebrow` | Pour les entreprises |
| `auth.stage.company.hook` | Prêt à bâtir <hl>l'équipe</hl> qui fera grandir votre entreprise ? |
| `auth.stage.company.sub` | Un vivier de talents formés, un suivi de recrutement clair et toute votre équipe sur la même page. |
| `auth.stage.company.line` | Connectez-vous pour piloter vos recrutements |
| `auth.stage.company.cards.1.title` | Offre publiée |
| `auth.stage.company.cards.1.text` | Chargé(e) de clientèle |
| `auth.stage.company.cards.2.title` | Votre équipe recrute |
| `auth.stage.company.cards.2.text` | Recruteurs invités |
| `auth.stage.company.cards.3.title` | Vivier de talents |
| `auth.stage.company.cards.3.text` | Profils formés sur Jumanly |

---

### `/connexion` · Connexion

*Permettre une connexion rapide par e-mail et mot de passe, par Google ou par lien magique.*

| Clé | Texte |
|---|---|
| `login.seo.title` | Se connecter · Jumanly |
| `login.seo.description` | Connectez-vous à votre espace Jumanly pour suivre vos formations, vos candidatures et vos recrutements. |
| `login.title` | Bon retour parmi nous |
| `login.subtitle` | Connectez-vous pour retrouver votre espace. |
| `login.email.label` | E-mail |
| `login.email.placeholder` | vous@exemple.com |
| `login.password.label` | Mot de passe |
| `login.password.placeholder` | Votre mot de passe |
| `login.remember` | Rester connecté sur cet appareil |
| `login.forgot` | Mot de passe oublié ? |
| `login.submit` | Se connecter |
| `login.submitting` | Connexion… |
| `login.magic.toggle` | Recevoir un lien de connexion par e-mail |
| `login.magic.title` | Connexion sans mot de passe |
| `login.magic.text` | Saisissez votre e-mail. Nous vous envoyons un lien qui vous connecte en un clic. |
| `login.magic.submit` | Envoyer le lien |
| `login.magic.sent.title` | Vérifiez votre boîte de réception |
| `login.magic.sent.text` | Si un compte existe pour {email}, un lien de connexion vient d'être envoyé. Il est valable {minutes} minutes. |
| `login.magic.sent.resend` | Renvoyer le lien |
| `login.magic.sent.back` | Utiliser mon mot de passe |
| `login.magic.backToPassword` | Se connecter avec un mot de passe |
| `login.noAccount` | Pas encore de compte ? |
| `login.signupLink` | Créer un compte gratuit |
| `login.partnerCode` | Vous avez un code de licence ? Activez-le |
| `login.twoFactor.seo` | Vérification en deux étapes · Jumanly |
| `login.twoFactor.title` | Confirmez votre connexion |
| `login.twoFactor.text` | Votre compte est protégé par la vérification en deux étapes. Nous venons d'envoyer un code à {digits} chiffres à votre adresse e-mail. |
| `login.deletionScheduled` | Votre compte sera supprimé dans {days} jours. Reconnectez-vous avant cette date pour annuler la suppression. |

---

### `/mot-de-passe-oublie` · Mot de passe oublié

*Envoyer un lien de réinitialisation sans révéler si l'adresse existe.*

| Clé | Texte |
|---|---|
| `forgot.seo.title` | Mot de passe oublié · Jumanly |
| `forgot.seo.description` | Recevez par e-mail un lien pour choisir un nouveau mot de passe. |
| `forgot.title` | Mot de passe oublié ? |
| `forgot.subtitle` | Saisissez l'e-mail de votre compte. Nous vous enverrons un lien pour en choisir un nouveau. |
| `forgot.email.label` | E-mail |
| `forgot.email.placeholder` | vous@exemple.com |
| `forgot.submit` | Envoyer le lien |
| `forgot.submitting` | Envoi… |
| `forgot.sent.title` | Vérifiez votre boîte de réception |
| `forgot.sent.text` | Si un compte existe pour {email}, vous allez recevoir un lien de réinitialisation. Il est valable {minutes} minutes. Pensez à regarder dans vos courriers indésirables. |
| `forgot.sent.resend` | Renvoyer le lien |
| `forgot.sent.resendIn` | Renvoyer dans {seconds} s |
| `forgot.back` | Retour à la connexion |
| `forgot.googleHint` | Vous vous connectez avec Google ? Vous n'avez pas besoin de mot de passe : utilisez le bouton « Continuer avec Google ». |

---

### `/reinitialiser` · Réinitialisation du mot de passe

*Choisir un nouveau mot de passe à partir du lien reçu.*

| Clé | Texte |
|---|---|
| `reset.seo.title` | Nouveau mot de passe · Jumanly |
| `reset.title` | Choisissez un nouveau mot de passe |
| `reset.subtitle` | Pour le compte {email}. |
| `reset.password.label` | Nouveau mot de passe |
| `reset.password.placeholder` | Au moins {min} caractères |
| `reset.password.help` | Au moins {min} caractères, avec une lettre et un chiffre. |
| `reset.confirm.label` | Confirmez le mot de passe |
| `reset.confirm.placeholder` | Saisissez-le à nouveau |
| `reset.logoutOthers` | Déconnecter mes autres appareils |
| `reset.submit` | Enregistrer le mot de passe |
| `reset.submitting` | Enregistrement… |
| `reset.success.title` | Mot de passe modifié |
| `reset.success.text` | Votre nouveau mot de passe est enregistré. Vous pouvez maintenant vous connecter. |
| `reset.success.cta` | Se connecter |
| `reset.invalid.title` | Ce lien n'est plus valable |
| `reset.invalid.text` | Le lien a expiré ou a déjà été utilisé. Demandez-en un nouveau. |
| `reset.invalid.cta` | Demander un nouveau lien |

---

### Commun · Indicateur d'étapes de l'inscription

*Montrer où en est la personne dans les 6 étapes.*

| Clé | Texte |
|---|---|
| `signup.stepper.label` | Étape {current} sur {total} |
| `signup.stepper.profile` | Profil |
| `signup.stepper.plan` | Forfait |
| `signup.stepper.account` | Compte |
| `signup.stepper.verify` | Vérification |
| `signup.stepper.payment` | Paiement |
| `signup.stepper.welcome` | Premiers pas |
| `signup.back` | Étape précédente |
| `signup.continue` | Continuer |
| `signup.hasAccount` | Déjà un compte ? |
| `signup.loginLink` | Se connecter |

Note d'intégration : l'étape « Paiement » n'apparaît dans l'indicateur que si un forfait payant est choisi ; `{total}` vaut alors 6, sinon 5.

---

### `/inscription` · Étape 1 · Vous êtes…

*Faire choisir le profil qui détermine la famille de forfaits.*

| Clé | Texte |
|---|---|
| `signup.profile.seo.title` | Créer un compte · Jumanly |
| `signup.profile.seo.description` | Créez votre compte Jumanly gratuitement : talent, recruteur ou entreprise. Candidatures toujours gratuites. |
| `signup.profile.title` | Bienvenue sur Jumanly |
| `signup.profile.subtitle` | Pour commencer, dites-nous qui vous êtes. Vous pourrez rejoindre une organisation plus tard depuis votre compte. |
| `signup.profile.groupLabel` | Votre profil |
| `signup.profile.talent.title` | Talent |
| `signup.profile.talent.text` | Étudiant, jeune diplômé, en recherche d'emploi ou professionnel : je veux me former, préparer mes candidatures et postuler. |
| `signup.profile.talent.badge` | Gratuit pour commencer |
| `signup.profile.rh.title` | Recruteur ou consultant RH |
| `signup.profile.rh.text` | Je recrute seul ou en petite équipe et je veux publier des offres et gérer mes candidatures. |
| `signup.profile.rh.badge` | Une offre active gratuite |
| `signup.profile.company.title` | Entreprise |
| `signup.profile.company.text` | Mon organisation recrute avec plusieurs recruteurs ou managers. |
| `signup.profile.company.badge` | Démarrage gratuit avec RH Free |
| `signup.profile.partner.title` | Institution partenaire |
| `signup.profile.partner.text` | Banque, université, fondation, programme public : je souhaite financer des licences pour des bénéficiaires. |
| `signup.profile.partner.badge` | Sur contrat |
| `signup.profile.partner.redirect.title` | Parlons de votre programme |
| `signup.profile.partner.redirect.text` | Les comptes partenaires sont ouverts par notre équipe après la signature d'un contrat. Décrivez votre projet, nous vous répondons par e-mail. |
| `signup.profile.partner.redirect.cta` | Accéder au formulaire partenaires |
| `signup.profile.beneficiary` | Vous êtes bénéficiaire et avez reçu un code de licence ? Choisissez « Talent », puis activez votre code. |
| `signup.profile.error.required` | Choisissez le profil qui vous correspond. |
| `signup.profile.cta` | Continuer |
| `signup.entry.title` | Créez votre compte gratuit |
| `signup.entry.subtitle` | Quelques secondes suffisent. Vous choisirez votre formule ensuite. |
| `signup.entry.who` | Vous êtes |
| `signup.entry.profiles.talent` | Talent |
| `signup.entry.profiles.rh` | Professionnel RH |
| `signup.entry.profiles.company` | Entreprise |
| `signup.entry.continue` | Continuer |
| `signup.entry.free` | Inscription gratuite |
| `signup.entry.payment` | Mobile Money et carte |
| `signup.entry.legal` | En créant un compte, vous acceptez les {terms} et la {privacy} de Jumanly. |

---

### `/inscription/forfait` · Étape 2 · Choix du forfait

*Laisser choisir un forfait de la famille, avec Free présélectionné et rassurant, et les formules payantes bien visibles.*

| Clé | Texte |
|---|---|
| `signup.plan.seo.title` | Choisir votre forfait · Jumanly |
| `signup.plan.title.talent` | Choisissez votre formule |
| `signup.plan.title.rh` | Choisissez votre formule recruteur |
| `signup.plan.title.company` | Choisissez la formule de votre entreprise |
| `signup.plan.subtitle` | Vous pouvez commencer gratuitement et changer de formule à tout moment. |
| `signup.plan.freeReassurance.talent` | Avec Free, vous créez votre profil et postulez gratuitement. Les profils Free sont recrutés au même titre que les abonnés. |
| `signup.plan.freeReassurance.rh` | Avec RH Free, vous publiez une offre et recevez des candidatures sans rien payer. |
| `signup.plan.freeReassurance.company` | Commencez gratuitement avec RH Free, puis passez à une formule Company quand votre équipe est prête. |
| `signup.plan.selected` | Sélectionné |
| `signup.plan.select` | Choisir {plan} |
| `signup.plan.selectFree` | Commencer gratuitement |
| `signup.plan.price.free` | Gratuit |
| `signup.plan.price.monthly` | {price} USD/mois |
| `signup.plan.price.quote` | Sur devis |
| `signup.plan.recommended` | Recommandé |
| `signup.plan.includesPrevious` | Tout {plan}, plus : |
| `signup.plan.seats` | {count, plural, one {# utilisateur} other {Jusqu'à # utilisateurs}} |
| `signup.plan.activeJobs` | {count, plural, one {# offre active} other {# offres actives}} |
| `signup.plan.quote.text` | Company Premium se construit avec vous : nous préparons un devis adapté à votre organisation. |
| `signup.plan.quote.cta` | Demander un devis |
| `signup.plan.quote.hint` | En attendant, vous pouvez créer votre compte avec RH Free. |
| `signup.plan.compare.show` | Comparer les formules |
| `signup.plan.compare.hide` | Masquer le comparatif |
| `signup.plan.payment` | Paiement par Mobile Money ou carte bancaire. Prix en USD. Sans engagement. |
| `signup.plan.applyFree` | Rappel : candidater reste gratuit, quelle que soit la formule. |
| `signup.plan.partnerCode` | Vous avez un code de licence offert par une institution ? Choisissez Free : vous l'activerez juste après. |
| `signup.plan.cta.free` | Continuer avec {plan} |
| `signup.plan.cta.paid` | Continuer avec {plan} · {price} USD/mois |
| `signup.plan.paidNote` | Vous paierez après avoir créé et vérifié votre compte. Vous pourrez aussi commencer en Free et payer plus tard. |

Note d'intégration : les noms, accroches et listes de fonctionnalités des cartes réutilisent les clés `pricing.talent.*`, `pricing.rh.*` et `pricing.company.*` de la partie 05. Profil Talent : Free, Starter, Pro, Premium. Profil Recruteur : RH Free, RH Pro, RH Premium. Profil Entreprise : RH Free (présélectionné), Company, Company Plus, Company Premium (bouton devis, non sélectionnable).

---

### `/inscription/compte` · Étape 3 · Création du compte

*Recueillir le minimum d'informations et les consentements.*

| Clé | Texte |
|---|---|
| `signup.account.seo.title` | Créer votre compte · Jumanly |
| `signup.account.title` | Créez votre compte |
| `signup.account.subtitle.talent` | Quelques informations pour démarrer. Vous compléterez votre profil ensuite. |
| `signup.account.subtitle.org` | Vos informations et celles de votre organisation. Vous pourrez inviter vos collègues ensuite. |
| `signup.account.planReminder` | Formule choisie : {plan} |
| `signup.account.planChange` | Modifier |
| `signup.account.google` | S'inscrire avec Google |
| `signup.account.firstName.label` | Prénom |
| `signup.account.firstName.placeholder` | Votre prénom |
| `signup.account.lastName.label` | Nom |
| `signup.account.lastName.placeholder` | Votre nom |
| `signup.account.email.label` | E-mail |
| `signup.account.email.placeholder` | vous@exemple.com |
| `signup.account.email.help` | Un code de vérification vous sera envoyé à cette adresse. |
| `signup.account.email.helpOrg` | Utilisez de préférence votre adresse professionnelle. |
| `signup.account.password.label` | Mot de passe |
| `signup.account.password.placeholder` | Au moins {min} caractères |
| `signup.account.password.help` | Au moins {min} caractères, avec une lettre et un chiffre. |
| `signup.account.password.strength.weak` | Faible |
| `signup.account.password.strength.medium` | Moyen |
| `signup.account.password.strength.strong` | Solide |
| `signup.account.country.label` | Pays |
| `signup.account.country.placeholder` | Choisissez votre pays |
| `signup.account.city.label` | Ville |
| `signup.account.city.placeholder` | Votre ville |
| `signup.account.city.help` | Utile pour vous proposer des offres proches de vous. |
| `signup.account.orgName.label` | Nom de l'organisation |
| `signup.account.orgName.placeholder` | Ex. : Cabinet Conseil RH |
| `signup.account.orgName.help` | Ce nom apparaîtra sur vos offres. Vous pourrez le modifier ensuite. |
| `signup.account.orgRole.label` | Votre fonction |
| `signup.account.orgRole.placeholder` | Ex. : Responsable recrutement |
| `signup.account.consent.terms` | J'accepte les {terms} et la {privacy}. |
| `signup.account.consent.termsLink` | conditions générales d'utilisation et de vente |
| `signup.account.consent.privacyLink` | politique de confidentialité |
| `signup.account.consent.ai` | Je comprends que Jumanly utilise l'IA pour me faire des suggestions expliquées, et qu'aucune décision de recrutement n'est prise automatiquement. |
| `signup.account.consent.newsletter` | Je souhaite recevoir par e-mail des conseils, des nouvelles formations et des offres adaptées. (facultatif) |
| `signup.account.consent.age` | Je confirme avoir l'âge minimum requis pour utiliser Jumanly ({minAge} ans). |
| `signup.account.submit` | Créer mon compte |
| `signup.account.submitting` | Création du compte… |

---

### `/inscription/verification` · Étape 4 · Vérification de l'e-mail

*Confirmer l'adresse e-mail par un code reçu.*

| Clé | Texte |
|---|---|
| `signup.verify.seo.title` | Vérifier votre e-mail · Jumanly |
| `signup.verify.title` | Vérifiez votre e-mail |
| `signup.verify.subtitle` | Nous avons envoyé un code à {digits} chiffres à {email}. Saisissez-le ci-dessous. |
| `signup.verify.code.label` | Code de vérification |
| `signup.verify.code.digitLabel` | Chiffre {index} sur {digits} |
| `signup.verify.code.help` | Le code est valable {minutes} minutes. |
| `signup.verify.submit` | Vérifier |
| `signup.verify.submitting` | Vérification… |
| `signup.verify.resend` | Renvoyer le code |
| `signup.verify.resendIn` | Renvoyer le code dans {seconds} s |
| `signup.verify.resent` | Un nouveau code a été envoyé à {email}. |
| `signup.verify.spam` | Rien reçu ? Regardez dans vos courriers indésirables ou promotions. |
| `signup.verify.changeEmail` | Modifier mon adresse e-mail |
| `signup.verify.success` | Adresse vérifiée. Bienvenue ! |

---

### `/inscription/paiement` · Étape 5 · Paiement (forfait payant uniquement)

*Activer le forfait payant choisi, sans jamais bloquer l'accès au compte gratuit.*

| Clé | Texte |
|---|---|
| `signup.payment.seo.title` | Paiement · Jumanly |
| `signup.payment.title` | Activez votre formule {plan} |
| `signup.payment.subtitle` | Votre compte est créé. Il ne reste qu'à régler votre première période pour activer {plan}. |
| `signup.payment.summary.title` | Récapitulatif |
| `signup.payment.summary.plan` | Formule |
| `signup.payment.summary.period` | Période |
| `signup.payment.summary.periodValue` | 1 mois, du {startDate} au {endDate} |
| `signup.payment.summary.total` | Total à payer |
| `signup.payment.summary.totalValue` | {price} USD |
| `signup.payment.summary.localAmount` | Soit environ {localAmount} {localCurrency}, selon le taux appliqué par votre opérateur. |
| `signup.payment.method.title` | Moyen de paiement |
| `signup.payment.method.mobileMoney` | Mobile Money |
| `signup.payment.method.card` | Carte bancaire |
| `signup.payment.prepaid` | Avec Mobile Money, l'abonnement est prépayé : rien n'est prélevé automatiquement. Nous vous rappellerons avant l'échéance. |
| `signup.payment.payLater.text` | Commencer en Free et payer plus tard |
| `signup.payment.payLater.help` | Vous accédez tout de suite à votre espace avec la formule gratuite. Vous pourrez activer {plan} quand vous le souhaitez depuis « Mon abonnement ». |
| `signup.payment.applyFree` | Candidater reste gratuit, que vous payiez maintenant ou non. |
| `signup.payment.secure` | Paiement sécurisé. Jumanly ne conserve pas les données complètes de votre carte. |
| `signup.payment.success.title` | Paiement confirmé |
| `signup.payment.success.text` | Votre formule {plan} est active jusqu'au {endDate}. Le reçu est envoyé à {email}. |
| `signup.payment.success.cta` | Continuer |
| `signup.payment.trial.title` | Votre formule {plan} est activée en essai |
| `signup.payment.trial.text` | Le paiement en ligne arrive bientôt. En attendant, profitez de {plan} jusqu'au {endDate}. Nous vous préviendrons avant la fin de l'essai. |
| `signup.payment.trial.cta` | Continuer |

Note d'intégration : le formulaire de paiement intégré réutilise les écrans `checkout.*` de la partie 05. Le bloc `signup.payment.trial.*` sert avant la livraison du paiement en ligne (étape E7), quand le forfait payant est activé en essai ou manuellement.

---

### `/app/bienvenue` · Étape 6 · Premiers pas

*Accueillir la personne et l'aider à faire une première action utile selon son profil.*

#### Commun

| Clé | Texte |
|---|---|
| `welcome.seo.title` | Bienvenue · Jumanly |
| `welcome.skip` | Passer pour l'instant |
| `welcome.later` | Vous pourrez compléter ces informations à tout moment depuis votre profil. |
| `welcome.progress` | {done} sur {total} |
| `welcome.finish` | Accéder à mon espace |
| `welcome.saved` | C'est enregistré. |
| `welcome.resume.text` | Vous allez maintenant reprendre là où vous en étiez. |
| `welcome.resume.cta` | Continuer vers « {target} » |

#### Talent

| Clé | Texte |
|---|---|
| `welcome.talent.title` | Bienvenue, {firstName} |
| `welcome.talent.subtitle` | Quelques questions pour personnaliser votre espace. Cela ne prend qu'un instant. |
| `welcome.talent.plan` | Votre formule : {plan} |
| `welcome.talent.goal.title` | Quel est votre objectif principal ? |
| `welcome.talent.goal.firstJob` | Trouver mon premier emploi ou stage |
| `welcome.talent.goal.newJob` | Changer d'emploi |
| `welcome.talent.goal.reconversion` | Me reconvertir |
| `welcome.talent.goal.promotion` | Évoluer dans mon poste |
| `welcome.talent.goal.skills` | Développer mes compétences |
| `welcome.talent.goal.freelance` | Trouver des missions |
| `welcome.talent.targetJob.label` | Quel métier visez-vous ? |
| `welcome.talent.targetJob.placeholder` | Ex. : Assistant comptable |
| `welcome.talent.skills.title` | Quelles sont vos principales compétences ? |
| `welcome.talent.skills.label` | Compétences |
| `welcome.talent.skills.placeholder` | Ajoutez une compétence puis appuyez sur Entrée |
| `welcome.talent.skills.help` | Ajoutez-en au moins trois. Elles servent à vous proposer des offres et des formations adaptées. |
| `welcome.talent.skills.suggestions` | Suggestions |
| `welcome.talent.skills.remove` | Retirer {skill} |
| `welcome.talent.cv.title` | Et votre CV ? |
| `welcome.talent.cv.import.text` | Importer mon CV |
| `welcome.talent.cv.import.help` | PDF ou Word, {maxSize} Mo maximum. Nous préremplissons votre profil, vous vérifiez chaque information. |
| `welcome.talent.cv.create.text` | Créer mon CV sur Jumanly |
| `welcome.talent.cv.create.help` | Partez de votre profil et d'un modèle prêt à l'emploi. |
| `welcome.talent.cv.uploading` | Import en cours… |
| `welcome.talent.cv.parsed` | Nous avons extrait {count, plural, one {# information} other {# informations}} de votre CV. Vérifiez-les avant de les enregistrer. |
| `welcome.talent.cv.error.format` | Ce format n'est pas accepté. Importez un fichier PDF ou Word. |
| `welcome.talent.cv.error.size` | Le fichier dépasse {maxSize} Mo. |
| `welcome.talent.cv.error.read` | Nous n'avons pas pu lire ce fichier. Vous pouvez créer votre CV directement sur Jumanly. |
| `welcome.talent.visibility.title` | Qui peut voir votre profil ? |
| `welcome.talent.visibility.private` | Privé : seuls les recruteurs des offres auxquelles je postule |
| `welcome.talent.visibility.recruiters` | Visible des recruteurs, avec mon nom |
| `welcome.talent.visibility.anonymous` | Anonyme : visible sans mon nom ni ma photo, jusqu'à ce que j'accepte une mise en relation |
| `welcome.talent.visibility.help` | Vous pouvez changer ce choix à tout moment dans vos paramètres. |
| `welcome.talent.next.title` | Vos premiers pas |
| `welcome.talent.next.diagnostic` | Faire mon diagnostic de carrière |
| `welcome.talent.next.jobs` | Découvrir les offres |
| `welcome.talent.next.training` | Commencer une formation gratuite |
| `welcome.talent.next.code` | Activer un code de licence |
| `welcome.talent.reminder` | Bon à savoir : vos candidatures sont toujours gratuites, quelle que soit votre formule. |
| `welcome.talent.step1.eyebrow` | Étape 1 sur 2 · moins d'une minute |
| `welcome.talent.step1.title` | Qu'est-ce qui vous amène sur Jumanly ? |
| `welcome.talent.step1.hint` | Modifiable à tout moment. |
| `welcome.talent.step1.later` | Plus tard |
| `welcome.talent.step1.next` | Continuer |
| `welcome.talent.focus.job.text` | Trouver un emploi ou un stage |
| `welcome.talent.focus.job.line` | Offres d'abord |
| `welcome.talent.focus.skills.text` | Développer mes compétences |
| `welcome.talent.focus.skills.line` | Formations d'abord |
| `welcome.talent.focus.career.text` | Faire évoluer ma carrière |
| `welcome.talent.focus.career.line` | Postes à responsabilité |
| `welcome.talent.step2.eyebrow` | Étape 2 sur 2 · tout est facultatif |
| `welcome.talent.step2.title` | Quelques précisions pour vos offres |
| `welcome.talent.step2.titles.label` | Métiers recherchés |
| `welcome.talent.step2.titles.placeholder` | Ex. : analyste de données, chargé d'études |
| `welcome.talent.step2.skills.label` | Vos compétences |
| `welcome.talent.step2.locations.label` | Où souhaitez-vous travailler ? |
| `welcome.talent.step2.locations.placeholder` | Ex. : Kinshasa |
| `welcome.talent.step2.preferences` | Préférences (contrat, télétravail) |
| `welcome.talent.step2.skip` | Passer |
| `welcome.talent.step2.next` | Voir mes offres |
| `welcome.talent.step2.back` | Revenir à l'étape 1 |

#### Recruteur et entreprise

| Clé | Texte |
|---|---|
| `welcome.org.title` | Bienvenue, {firstName} |
| `welcome.org.subtitle` | L'espace de {orgName} est prêt. Publions votre première offre. |
| `welcome.org.plan` | Formule : {plan} · {seats, plural, one {# utilisateur} other {# utilisateurs}} · {jobs, plural, one {# offre active} other {# offres actives}} |
| `welcome.org.steps.title` | Pour bien démarrer |
| `welcome.org.steps.profile.text` | Compléter le profil de l'organisation |
| `welcome.org.steps.profile.help` | Logo, secteur, présentation : ce que les candidats verront sur vos offres. |
| `welcome.org.steps.job.text` | Publier ma première offre |
| `welcome.org.steps.job.help` | Un formulaire guidé vous aide à décrire le poste, les compétences et les critères. |
| `welcome.org.steps.invite.text` | Inviter des collègues |
| `welcome.org.steps.invite.help` | Votre formule permet jusqu'à {seats, plural, one {# utilisateur} other {# utilisateurs}}. |
| `welcome.org.steps.verify.text` | Demander la vérification de l'entreprise |
| `welcome.org.steps.verify.help` | Inclus dans les formules Company : le badge « Entreprise vérifiée » s'affiche sur vos offres. |
| `welcome.org.cta.job` | Créer ma première offre |
| `welcome.org.cta.dashboard` | Aller au tableau de bord |
| `welcome.org.principle` | Bon à savoir : le matching vous suggère des profils et explique pourquoi. L'IA recommande, vous décidez. |
| `welcome.org.privacy` | Les talents choisissent la visibilité de leur profil. Vous voyez le profil complet des personnes qui postulent à vos offres. |
| `welcome.org.personal` | Vous avez aussi un espace personnel de talent. Passez de l'un à l'autre avec le sélecteur d'espace. |

---

### `/activer` · Activation d'une licence Partners

*Permettre à un bénéficiaire d'activer l'accès financé par une institution, avec un code ou un lien d'invitation.*

| Clé | Texte |
|---|---|
| `activate.seo.title` | Activer ma licence · Jumanly |
| `activate.seo.description` | Activez la licence Jumanly offerte par votre institution avec votre code ou votre lien d'invitation. |
| `activate.title` | Activez votre licence |
| `activate.subtitle` | Une institution finance votre accès à Jumanly. Saisissez le code que vous avez reçu. |
| `activate.code.label` | Code de licence |
| `activate.code.placeholder` | Ex. : JMLY-XXXX-XXXX |
| `activate.code.help` | Le code figure dans l'e-mail ou le message de votre institution. Les majuscules et les tirets ne comptent pas. |
| `activate.submit` | Vérifier le code |
| `activate.submitting` | Vérification… |
| `activate.loginRequired.title` | Connectez-vous pour activer votre licence |
| `activate.loginRequired.text` | La licence sera rattachée à votre compte personnel. Vous n'avez pas encore de compte ? Créez-le gratuitement, votre code sera conservé. |
| `activate.loginRequired.login` | Se connecter |
| `activate.loginRequired.signup` | Créer mon compte |
| `activate.preview.title` | Votre licence |
| `activate.preview.sponsor` | Offerte par : {sponsorName} |
| `activate.preview.plan` | Formule : {plan} |
| `activate.preview.duration` | Durée : jusqu'au {endDate} |
| `activate.preview.free` | Vous n'avez rien à payer. |
| `activate.preview.privacy` | {sponsorName} recevra uniquement des statistiques agrégées d'usage et d'impact. Votre CV, vos messages et vos données personnelles ne lui sont pas transmis sans votre accord. |
| `activate.preview.confirm` | Activer ma licence |
| `activate.preview.cancel` | Annuler |
| `activate.success.title` | Votre licence {plan} est active |
| `activate.success.text` | Profitez de toutes les fonctionnalités de {plan} jusqu'au {endDate}, grâce à {sponsorName}. |
| `activate.success.cta` | Découvrir mon espace |
| `activate.pending.title` | Votre licence est mise en attente |
| `activate.pending.text` | Vous avez déjà la formule {currentPlan}, supérieure à {plan}. La licence offerte par {sponsorName} sera utilisée à la fin de votre abonnement actuel, si elle est encore valable. |
| `activate.pending.cta` | Voir mon abonnement |
| `activate.replace.text` | La licence {plan} remplace votre formule actuelle {currentPlan} pendant sa durée. [Règle applicable à la période déjà payée à définir dans les conditions commerciales] |
| `activate.error.invalid` | Ce code n'est pas reconnu. Vérifiez sa saisie ou contactez votre institution. |
| `activate.error.used` | Ce code a déjà été utilisé. Chaque code ne peut être activé qu'une fois. |
| `activate.error.expired` | Ce code a expiré. Contactez l'institution qui vous l'a remis. |
| `activate.error.exhausted` | Toutes les licences de ce programme ont été attribuées. Contactez l'institution qui vous a remis ce code. |
| `activate.error.notYet` | Ce programme commence le {startDate}. Revenez à cette date pour activer votre code. |
| `activate.error.emailMismatch` | Cette invitation a été envoyée à une autre adresse e-mail. Connectez-vous avec l'adresse {maskedEmail} ou contactez votre institution. |
| `activate.error.alreadyActive` | Une licence de ce programme est déjà active sur votre compte. |
| `activate.error.tooManyAttempts` | Trop de tentatives. Réessayez dans {minutes} minutes. |
| `activate.invite.title` | Vous êtes invité par {sponsorName} |
| `activate.invite.text` | {sponsorName} vous offre la formule {plan} jusqu'au {endDate}. Connectez-vous ou créez votre compte pour l'activer. |
| `activate.help` | Un problème avec votre code ? Écrivez-nous à infojumanly@gmail.com en indiquant le nom de votre institution. |
| `activate.preview.months` | Durée : {months, plural, one {# mois} other {# mois}}, au plus tard jusqu'au {endDate} |
| `activate.change` | Saisir un autre code |

---

### Messages d'erreur d'authentification

*Messages clairs, sans jargon technique et sans révéler d'informations sur l'existence d'un compte quand ce n'est pas nécessaire.*

| Clé | Texte |
|---|---|
| `auth.error.required` | Ce champ est obligatoire. |
| `auth.error.emailInvalid` | Saisissez une adresse e-mail valide, par exemple nom@exemple.com. |
| `auth.error.emailTaken.text` | Un compte existe déjà avec cette adresse. Connectez-vous ou réinitialisez votre mot de passe. |
| `auth.error.emailTaken.login` | Se connecter |
| `auth.error.emailTaken.forgot` | Mot de passe oublié |
| `auth.error.invalidCredentials` | E-mail ou mot de passe incorrect. Vérifiez votre saisie et réessayez. |
| `auth.error.passwordTooShort` | Le mot de passe doit contenir au moins {min} caractères. |
| `auth.error.passwordWeak` | Ajoutez au moins une lettre et un chiffre. |
| `auth.error.passwordCommon` | Ce mot de passe est trop courant. Choisissez-en un plus personnel. |
| `auth.error.passwordMismatch` | Les deux mots de passe ne correspondent pas. |
| `auth.error.passwordSameAsOld` | Choisissez un mot de passe différent de l'ancien. |
| `auth.error.nameInvalid` | Ce nom contient des caractères non acceptés. |
| `auth.error.countryRequired` | Choisissez votre pays. |
| `auth.error.cityRequired` | Indiquez votre ville. |
| `auth.error.orgNameRequired` | Indiquez le nom de votre organisation. |
| `auth.error.termsRequired` | Vous devez accepter les conditions générales et la politique de confidentialité pour créer un compte. |
| `auth.error.aiConsentRequired` | Merci de confirmer avoir pris connaissance du fonctionnement de l'IA. |
| `auth.error.ageRequired` | Vous devez avoir au moins {minAge} ans pour créer un compte. |
| `auth.error.codeInvalid` | Ce code est incorrect. Vérifiez-le et réessayez. |
| `auth.error.codeExpired` | Ce code a expiré. Demandez-en un nouveau. |
| `auth.error.codeTooManyAttempts` | Trop de codes incorrects. Demandez un nouveau code. |
| `auth.error.codeIncomplete` | Saisissez les {digits} chiffres du code. |
| `auth.error.resendTooSoon` | Patientez {seconds} secondes avant de demander un nouveau code. |
| `auth.error.emailNotVerified.text` | Votre adresse e-mail n'est pas encore vérifiée. Saisissez le code reçu par e-mail pour continuer. |
| `auth.error.emailNotVerified.cta` | Recevoir un nouveau code |
| `auth.error.tooManyAttempts` | Trop de tentatives de connexion. Par sécurité, réessayez dans {minutes} minutes ou réinitialisez votre mot de passe. |
| `auth.error.accountLocked` | Votre compte est temporairement verrouillé après plusieurs tentatives. Un e-mail vous a été envoyé pour le débloquer. |
| `auth.error.accountSuspended` | Votre compte est suspendu. Pour en savoir plus, écrivez-nous à assistant@jumanly.io. |
| `auth.error.accountDeleted` | Ce compte a été supprimé. Vous pouvez créer un nouveau compte avec cette adresse. |
| `auth.error.googleOnly` | Ce compte a été créé avec Google, Apple ou LinkedIn. Utilisez le bouton de ce service, ou définissez un mot de passe avec « Mot de passe oublié ». |
| `auth.error.googleFailed` | La connexion avec Google n'a pas abouti. Réessayez ou utilisez votre e-mail. |
| `auth.error.appleFailed` | La connexion avec Apple n'a pas abouti. Réessayez ou utilisez votre e-mail. |
| `auth.error.linkedinFailed` | La connexion avec LinkedIn n'a pas abouti. Réessayez ou utilisez votre e-mail. |
| `auth.error.googleCancelled` | Connexion avec Google annulée. |
| `auth.error.magicLinkExpired` | Ce lien de connexion a expiré ou a déjà été utilisé. Demandez-en un nouveau. |
| `auth.error.magicLinkOtherDevice` | Ce lien a été demandé depuis un autre appareil. Ouvrez-le sur l'appareil d'origine ou demandez-en un nouveau. |
| `auth.error.resetLinkInvalid` | Ce lien de réinitialisation n'est plus valable. Demandez-en un nouveau. |
| `auth.error.sessionExpired` | Votre session a expiré. Reconnectez-vous pour continuer. |
| `auth.error.network` | Connexion impossible. Vérifiez votre accès à Internet, puis réessayez. |
| `auth.error.server` | Un problème est survenu de notre côté. Réessayez dans un instant. |
| `auth.error.emailSendFailed` | L'e-mail n'a pas pu être envoyé. Vérifiez l'adresse saisie ou réessayez dans quelques minutes. |
| `auth.error.captcha` | Merci de confirmer que vous n'êtes pas un robot. |
| `auth.success.logout` | Vous êtes déconnecté. À bientôt ! |
| `auth.success.passwordChanged` | Votre mot de passe a été modifié. |

---

### E-mails transactionnels liés à l'authentification

*Objets et corps courts des e-mails envoyés pendant l'inscription et la connexion. Signature commune.*

| Clé | Texte |
|---|---|
| `email.signature` | L'équipe Jumanly · Learn. Grow. Connect. · jumanly.io |
| `email.footer` | Une plateforme développée par The Growth Lab. Vous recevez cet e-mail car une action a été effectuée sur votre compte Jumanly. |
| `email.verify.subject` | Votre code de vérification Jumanly : {code} |
| `email.verify.body` | Bonjour {firstName}, voici votre code pour vérifier votre adresse e-mail : {code}. Il est valable {minutes} minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail. |
| `email.magic.subject` | Votre lien de connexion à Jumanly |
| `email.magic.body` | Bonjour {firstName}, cliquez sur le bouton ci-dessous pour vous connecter. Le lien est valable {minutes} minutes et ne peut servir qu'une fois. |
| `email.magic.cta` | Me connecter |
| `email.reset.subject` | Réinitialiser votre mot de passe Jumanly |
| `email.reset.body` | Bonjour {firstName}, vous avez demandé à changer votre mot de passe. Le lien ci-dessous est valable {minutes} minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé. |
| `email.reset.cta` | Choisir un nouveau mot de passe |
| `email.welcome.subject` | Bienvenue sur Jumanly, {firstName} |
| `email.welcome.body` | Votre compte est prêt. Complétez votre profil, découvrez les formations gratuites et postulez aux offres qui vous correspondent. Rappel : vos candidatures sont toujours gratuites. |
| `email.welcome.cta` | Accéder à mon espace |
| `email.welcomeOrg.subject` | L'espace de {orgName} est prêt |
| `email.welcomeOrg.body` | Bonjour {firstName}, votre espace recruteur est créé avec la formule {plan}. Publiez votre première offre et invitez vos collègues. |
| `email.welcomeOrg.cta` | Publier une offre |
| `email.passwordChanged.subject` | Votre mot de passe Jumanly a été modifié |
| `email.passwordChanged.body` | Bonjour {firstName}, le mot de passe de votre compte a été modifié le {date}. Si ce n'est pas vous, réinitialisez-le immédiatement et écrivez-nous à assistant@jumanly.io. |
| `email.license.subject` | {sponsorName} vous offre l'accès Jumanly {plan} |
| `email.license.body` | {sponsorName} finance votre accès à la formule {plan} de Jumanly jusqu'au {endDate}. Activez-le avec le code {code} ou en cliquant sur le bouton ci-dessous. |
| `email.license.cta` | Activer ma licence |


---

## Partie 03 · Espace talent

Textes d'interface de l'espace connecté côté talent, à intégrer tels quels dans `messages/fr.json`. Les droits et forfaits cités suivent `docs/specifications.md (partie 05)`. Les routes suivent `docs/specifications.md (partie 07)`.

Conventions :

- Variables ICU entre accolades : `{firstName}`, `{plan}`, `{count}`, `{date}`, `{score}`, `{company}`, `{jobTitle}`, `{quota}`, `{used}`.
- `{plan}` reçoit toujours le **nom affiché** du forfait (Free, Starter, Pro, Premium) calculé à partir du droit manquant, jamais un nom codé en dur.
- Les textes communs (erreurs génériques, chargement, validation, téléversement, dates relatives) sont dans la partie 08. Les textes IA détaillés (« Pourquoi ? », critères, coach) sont dans la partie 06.
- Correspondance des niveaux Learn vers le forfait requis : `free` = Free, `fundamentals` = Starter, `standard` = Pro, `advanced` = Premium.

---

### Navigation · Barre latérale (desktop) et pilule flottante (mobile)

*Repères permanents : quatre destinations pour le talent (barre du bas sur téléphone, plus Career dans la colonne d'icônes sur ordinateur), le menu de l'avatar, et le menu Hire quand l'espace Organisation est actif.*

| Clé | Texte |
|---|---|
| `appNav.brand.text` | Jumanly |
| `appNav.brand.tagline` | Learn. Grow. Connect. |
| `appNav.home` | Accueil |
| `appNav.learn` | Learn |
| `appNav.career` | Career |
| `appNav.jobs` | Jobs |
| `appNav.messages` | Messages |
| `appNav.notifications` | Notifications |
| `appNav.hire.text` | Hire |
| `appNav.hire.jobs` | Offres |
| `appNav.hire.talents` | Talents |
| `appNav.hire.interviews` | Entretiens |
| `appNav.hire.reports` | Rapports |
| `appNav.hire.pools` | Viviers |
| `appNav.hire.messages` | Connect |
| `appNav.hire.templates` | Modèles |
| `appNav.organization` | Organisation |
| `appNav.partner` | Partenaire |
| `appNav.partnerLicenses` | Licences |
| `appNav.partnerReports` | Rapports |
| `appNav.admin` | Jumanly Admin |
| `appNav.settings` | Paramètres |
| `appNav.logout` | Se déconnecter |
| `appNav.search.placeholder` | Rechercher sur Jumanly |
| `appNav.search.aria` | Rechercher des formations, des offres ou des messages |
| `appNav.search.empty` | Aucun résultat pour « {query} ». |
| `appNav.search.section.courses` | Formations |
| `appNav.search.section.jobs` | Offres |
| `appNav.search.section.messages` | Messages |
| `appNav.search.seeAll` | Voir tous les résultats |
| `appNav.search.shortcut` | Raccourci : touche barre oblique |
| `appNav.search.title` | Recherche |
| `appNav.search.subtitle` | Formations, offres et conversations |
| `appNav.search.prompt` | Tapez un mot pour chercher une formation, une offre ou une conversation. |
| `appNav.search.results` | {count, plural, =0 {Aucun résultat} one {# résultat} other {# résultats}} pour « {query} » |
| `appNav.search.phoneTitle` | Rechercher |
| `appNav.search.back` | Retour à Pour moi |
| `appNav.search.clear` | Effacer la recherche |
| `appNav.search.tab.label` | Type de résultats |
| `appNav.search.tab.all` | Tout |
| `appNav.search.tab.jobs` | Offres |
| `appNav.search.tab.courses` | Formations |
| `appNav.search.seeJobs` | Voir les offres pour « {query} » |
| `appNav.search.seeCourses` | Voir les formations pour « {query} » |
| `appNav.search.recent.title` | Recherches récentes |
| `appNav.search.recent.clear` | Effacer |
| `appNav.unreadBadge.aria` | {count, plural, one {# élément non lu} other {# éléments non lus}} |
| `appNav.collapse` | Réduire le menu |
| `appNav.expand` | Déplier le menu |
| `appNav.mobile.aria` | Navigation principale |
| `appNav.mobile.more` | Plus |
| `appNav.tabs.forMe` | Pour moi |
| `appNav.tabs.offers` | Offres |
| `appNav.tabs.learn` | Apprendre |
| `appNav.tabs.suivi` | Suivi |
| `appNav.tabs.badge` | {count, plural, one {# action à traiter} other {# actions à traiter}} |
| `appNav.topMenu.open` | Mon espace |
| `appNav.topMenu.label` | Menu de mon espace |
| `appNav.topMenu.messages` | Messages |
| `appNav.topMenu.profile` | Mon profil |
| `appNav.topMenu.cvs` | Mes CV |
| `appNav.topMenu.dashboard` | Tableau de bord |
| `appNav.topMenu.settings` | Paramètres |
| `appNav.topMenu.all` | Tout Mon espace |
| `appNav.topMenu.unread` | {count, plural, one {# message non lu} other {# messages non lus}} |
| `appNav.title.career` | Career |
| `appNav.title.messages` | Messages |
| `appNav.title.notifications` | Notifications |
| `appNav.title.profile` | Mon profil |
| `appNav.title.subscription` | Abonnement |
| `appNav.title.settings` | Paramètres |
| `appNav.title.dashboard` | Tableau de bord |
| `appNav.title.search` | Recherche |
| `appNav.skipToContent` | Aller au contenu principal |
| `appNav.section.aria` | Sous-rubriques de {section} |
| `appNav.section.dashboard` | Tableau de bord |
| `appNav.section.profile` | Mon profil |
| `appNav.section.subscription` | Abonnement |
| `appNav.section.catalog` | Explorer |
| `appNav.section.certificates` | Certifications |
| `appNav.section.learnHome` | Mon espace |
| `appNav.section.learnPaths` | Mes parcours |
| `appNav.section.learnEvaluations` | Exercices et évaluations |
| `appNav.section.learnCoach` | Coach IA |
| `appNav.section.offers` | Offres |
| `appNav.section.applications` | Mes candidatures |
| `appNav.section.saved` | Offres enregistrées |
| `appNav.section.account` | Mon espace |

### Navigation · Menu du compte

*Accès au profil, à l'abonnement et aux réglages depuis l'avatar.*

| Clé | Texte |
|---|---|
| `account.menu.aria` | Ouvrir le menu du compte |
| `account.menu.roleBadge.text` | {space} · {plan} |
| `account.menu.roleBadge.talent` | Talent |
| `account.menu.profile` | Mon profil |
| `account.menu.publicProfile` | Voir mon profil public |
| `account.menu.subscription` | Mon abonnement |
| `account.menu.quotas` | Mes quotas |
| `account.menu.certificates` | Mes attestations |
| `account.menu.settings` | Paramètres |
| `account.menu.help` | Aide et FAQ |
| `account.menu.contact` | Nous écrire |
| `account.menu.howMatchingWorks` | Comment fonctionne le matching |
| `account.menu.activateLicense` | Activer un code de licence |
| `account.menu.logout` | Se déconnecter |
| `account.menu.sponsored` | Licence offerte par {sponsorName} |

### Navigation · Sélecteur d'espace

*Un même compte passe de son espace Personnel à l'espace d'une organisation dont il est membre.*

| Clé | Texte |
|---|---|
| `spaceSwitcher.label` | Espace |
| `spaceSwitcher.aria` | Changer d'espace |
| `spaceSwitcher.personal.text` | Personnel |
| `spaceSwitcher.personal.hint` | Learn, Career, Jobs et vos messages |
| `spaceSwitcher.org.hint` | {role} · {plan} |
| `spaceSwitcher.sectionOrgs` | Organisations |
| `spaceSwitcher.createOrg` | Créer une organisation |
| `spaceSwitcher.joinHint` | Pour rejoindre une organisation, demandez une invitation à son administrateur. |
| `spaceSwitcher.switched` | Vous êtes dans l'espace {space}. |
| `spaceSwitcher.pendingInvites` | {count, plural, one {# invitation en attente} other {# invitations en attente}} |

---

### Espace · Générique d'entrée

*Joué après une connexion réussie (docs/refonte-connexion/BRIEF-CONNEXION-V2.md § 7) : la version complète une seule fois par compte, la version courte ensuite, jamais en animations réduites (le message de bienvenue s'affiche à la place). Les cartes et leurs chiffres sont des illustrations de l'appli, identiques pour tout le monde, jamais des données du compte.*

| Clé | Texte |
|---|---|
| `intro.label` | Présentation de Jumanly |
| `intro.skip` | Passer l'intro |
| `intro.skipKey` | Échap |
| `intro.wordmark` | jumanly |
| `intro.welcome` | Bienvenue, |
| `intro.welcomeNoName` | Bienvenue |
| `intro.back` | Bon retour, {name} |
| `intro.backNoName` | Bon retour |
| `intro.slogan` | Learn. Grow. Connect. |
| `intro.live` | Bienvenue, {name}. Présentation de Jumanly. |
| `intro.liveNoName` | Bienvenue. Présentation de Jumanly. |
| `intro.toast.first` | Bienvenue sur Jumanly, {name} ! |
| `intro.toast.back` | Bon retour, {name} ! |
| `intro.talent.modules.1.tag` | Learn |
| `intro.talent.modules.1.left` | Votre |
| `intro.talent.modules.1.right` | formation |
| `intro.talent.modules.1.cards.1.value` | 38 |
| `intro.talent.modules.1.cards.1.title` | Leçon 3 sur 8 |
| `intro.talent.modules.1.cards.1.text` | Excel pour l'analyse |
| `intro.talent.modules.1.cards.2.title` | Certificat |
| `intro.talent.modules.1.cards.2.text` | Délivré à la fin du parcours |
| `intro.talent.modules.2.tag` | Career |
| `intro.talent.modules.2.left` | Votre |
| `intro.talent.modules.2.right` | CV |
| `intro.talent.modules.2.cards.1.value` | 82 |
| `intro.talent.modules.2.cards.1.title` | Score du CV |
| `intro.talent.modules.2.cards.1.text` | 82/100 · Prêt |
| `intro.talent.modules.2.cards.2.title` | Conseil de l'IA |
| `intro.talent.modules.2.cards.2.text` | Ajoutez un résultat chiffré |
| `intro.talent.modules.2.cards.2.pill` | Pourquoi ? |
| `intro.talent.modules.3.tag` | Jobs |
| `intro.talent.modules.3.left` | Votre |
| `intro.talent.modules.3.right` | emploi |
| `intro.talent.modules.3.cards.1.title` | Analyste de données junior |
| `intro.talent.modules.3.cards.1.text` | Compatibilité 87 % |
| `intro.talent.modules.3.cards.2.title` | Candidature envoyée |
| `intro.talent.modules.3.cards.2.text` | Suivez-la dans Jobs |
| `intro.talent.modules.4.tag` | Connect |
| `intro.talent.modules.4.left` | Votre |
| `intro.talent.modules.4.right` | réseau |
| `intro.talent.modules.4.cards.1.title` | Nadia, recruteuse |
| `intro.talent.modules.4.cards.1.text` | « Votre profil nous intéresse » |
| `intro.talent.modules.4.cards.2.title` | Entretien |
| `intro.talent.modules.4.cards.2.text` | Jeudi · 10:00 |
| `intro.rh.modules.1.tag` | Jobs |
| `intro.rh.modules.1.left` | Vos |
| `intro.rh.modules.1.right` | offres |
| `intro.rh.modules.1.cards.1.title` | Offre publiée |
| `intro.rh.modules.1.cards.1.text` | Data analyst · Kinshasa |
| `intro.rh.modules.1.cards.2.title` | Diffusée aux talents |
| `intro.rh.modules.1.cards.2.text` | du vivier Jumanly |
| `intro.rh.modules.2.tag` | Hire |
| `intro.rh.modules.2.left` | Vos |
| `intro.rh.modules.2.right` | candidats |
| `intro.rh.modules.2.cards.1.value` | 55 |
| `intro.rh.modules.2.cards.1.title` | Pipeline |
| `intro.rh.modules.2.cards.1.text` | Nouveaux · Entretien · Offre |
| `intro.rh.modules.2.cards.2.title` | Candidature avancée |
| `intro.rh.modules.2.cards.2.text` | Étape Entretien |
| `intro.rh.modules.3.tag` | Intelligence |
| `intro.rh.modules.3.left` | Vos |
| `intro.rh.modules.3.right` | profils |
| `intro.rh.modules.3.cards.1.title` | Profil recommandé |
| `intro.rh.modules.3.cards.1.text` | Kofi A. · Data analyst |
| `intro.rh.modules.3.cards.1.pill` | Pourquoi ? |
| `intro.rh.modules.3.cards.2.title` | Critères visibles |
| `intro.rh.modules.3.cards.2.text` | L'IA explique chaque score |
| `intro.rh.modules.4.tag` | Connect |
| `intro.rh.modules.4.left` | Vos |
| `intro.rh.modules.4.right` | échanges |
| `intro.rh.modules.4.cards.1.title` | Kofi A. |
| `intro.rh.modules.4.cards.1.text` | « Merci pour l'invitation » |
| `intro.rh.modules.4.cards.2.title` | Entretien planifié |
| `intro.rh.modules.4.cards.2.text` | Jeudi · 10:00 |
| `intro.company.modules.1.tag` | Jobs |
| `intro.company.modules.1.left` | Vos |
| `intro.company.modules.1.right` | offres |
| `intro.company.modules.1.cards.1.title` | Offre publiée |
| `intro.company.modules.1.cards.1.text` | Chargé(e) de clientèle |
| `intro.company.modules.1.cards.2.title` | Page entreprise |
| `intro.company.modules.1.cards.2.text` | Votre marque employeur |
| `intro.company.modules.2.tag` | Vivier |
| `intro.company.modules.2.left` | Votre |
| `intro.company.modules.2.right` | vivier |
| `intro.company.modules.2.cards.1.title` | Talents formés |
| `intro.company.modules.2.cards.1.text` | Certificats vérifiables |
| `intro.company.modules.2.cards.2.title` | Matching explicable |
| `intro.company.modules.2.cards.2.text` | Chaque score a ses raisons |
| `intro.company.modules.2.cards.2.pill` | Pourquoi ? |
| `intro.company.modules.3.tag` | Équipe |
| `intro.company.modules.3.left` | Votre |
| `intro.company.modules.3.right` | équipe |
| `intro.company.modules.3.cards.1.title` | Recruteurs invités |
| `intro.company.modules.3.cards.1.text` | Rôles et droits par membre |
| `intro.company.modules.3.cards.2.title` | Note de Nadia |
| `intro.company.modules.3.cards.2.text` | « À rencontrer » |
| `intro.company.modules.4.tag` | Hire |
| `intro.company.modules.4.left` | Vos |
| `intro.company.modules.4.right` | recrutements |
| `intro.company.modules.4.cards.1.value` | 70 |
| `intro.company.modules.4.cards.1.title` | Tableau de bord |
| `intro.company.modules.4.cards.1.text` | Délais et étapes |
| `intro.company.modules.4.cards.2.title` | Poste pourvu |
| `intro.company.modules.4.cards.2.text` | Bienvenue dans l'équipe |

---

### `/app/tableau-de-bord` · Tableau de bord talent

*Accueillir, montrer la prochaine étape et rappeler que tout le parcours mène à l'emploi.*

| Clé | Texte |
|---|---|
| `talent.dashboard.title` | Accueil |
| `talent.dashboard.seo` | Accueil · Jumanly |
| `talent.dashboard.date` | {date, date, full} |
| `talent.dashboard.greeting.text` | Bonjour {firstName}, prêt pour la suite ? |
| `talent.dashboard.greeting.neutral` | Bonjour {firstName}, on continue ? |
| `talent.dashboard.greeting.morning` | Bonjour {firstName} |
| `talent.dashboard.greeting.evening` | Bonsoir {firstName} |
| `talent.dashboard.greeting.first` | Bienvenue sur Jumanly, {firstName} |
| `talent.dashboard.welcome.matches` | {count, plural, one {# offre correspond à votre profil.} other {# offres correspondent à votre profil.}} |
| `talent.dashboard.welcome.course` | Reprenez « {courseTitle} » : {count, plural, one {il vous reste # leçon.} other {il vous reste # leçons.}} |
| `talent.dashboard.welcome.profile` | Votre profil est complet à {percent} %. Quelques minutes suffisent pour le compléter. |
| `talent.dashboard.welcome.close` | Fermer le message du jour |
| `talent.dashboard.nextStep.title` | Votre prochaine étape |
| `talent.dashboard.nextStep.completeProfile` | Complétez votre profil pour être mieux vu des recruteurs. |
| `talent.dashboard.nextStep.importCv` | Importez ou créez votre CV en quelques minutes. |
| `talent.dashboard.nextStep.diagnostic` | Faites votre diagnostic de carrière (10 minutes). |
| `talent.dashboard.nextStep.resumeCourse` | Reprenez « {courseTitle} » là où vous l'avez laissée. |
| `talent.dashboard.nextStep.apply` | {count, plural, one {# offre compatible vous attend.} other {# offres compatibles vous attendent.}} |
| `talent.dashboard.nextStep.interview` | Préparez votre entretien avec {company} du {date, date, medium}. |
| `talent.dashboard.nextStep.cta` | Commencer |
| `talent.dashboard.nextStep.hint.interview` | Simulation d'entretien, fiche entreprise et questions fréquentes, au même endroit. |
| `talent.dashboard.nextStep.hint.course` | Chaque leçon terminée compte pour votre attestation. |
| `talent.dashboard.nextStep.hint.apply` | Chaque offre explique pourquoi elle vous correspond. Candidater reste gratuit. |
| `talent.dashboard.nextStep.hint.profile` | Un profil complet aide les recruteurs à vous comprendre. |
| `talent.dashboard.kpi.courses.text` | Formations en cours |
| `talent.dashboard.kpi.courses.hint` | {count, plural, =0 {Aucune nouvelle ce mois} one {# nouvelle ce mois} other {# nouvelles ce mois}} |
| `talent.dashboard.kpi.hours.text` | Heures d'apprentissage |
| `talent.dashboard.kpi.hours.value` | {hours, number} h |
| `talent.dashboard.kpi.hours.hint` | contre {hours, number} h le mois dernier |
| `talent.dashboard.kpi.applications.text` | Candidatures envoyées |
| `talent.dashboard.kpi.applications.hint` | {count, plural, =0 {Aucun entretien planifié} one {# entretien planifié} other {# entretiens planifiés}} |
| `talent.dashboard.kpi.profileStrength.text` | Force du profil |
| `talent.dashboard.kpi.profileStrength.value` | {percent} % |
| `talent.dashboard.kpi.profileStrength.hint` | Prochaine action : {action} |
| `talent.dashboard.kpi.delta.up` | +{value} |
| `talent.dashboard.kpi.delta.points` | +{value} pts |
| `talent.dashboard.journey.title` | Votre parcours |
| `talent.dashboard.journey.subtitle` | Se former, enrichir son profil, candidater, être recruté. |
| `talent.dashboard.journey.next` | Votre prochaine étape : {step} |
| `talent.dashboard.journey.go` | Y aller |
| `talent.dashboard.journey.learn.text` | Se former |
| `talent.dashboard.journey.learn.status` | {count, plural, =0 {Aucune formation active} one {# formation active} other {# formations actives}} |
| `talent.dashboard.journey.profile.text` | Enrichir son profil |
| `talent.dashboard.journey.profile.status` | Profil complété à {percent} % |
| `talent.dashboard.journey.apply.text` | Candidater |
| `talent.dashboard.journey.apply.status` | {count, plural, =0 {Aucune candidature} one {# candidature} other {# candidatures}} |
| `talent.dashboard.journey.hired.text` | Être recruté |
| `talent.dashboard.journey.hired.status` | Objectif : {goal} |
| `talent.dashboard.learningTime.title` | Temps d'apprentissage |
| `talent.dashboard.learningTime.subtitle` | 8 dernières semaines |
| `talent.dashboard.learningTime.weekLabel` | S{week} |
| `talent.dashboard.learningTime.aria` | Graphique du temps d'apprentissage par semaine |
| `talent.dashboard.ai.title` | Jumanly Intelligence |
| `talent.dashboard.ai.matches.text` | {count, plural, one {# offre correspond à votre profil à plus de {threshold} %.} other {# offres correspondent à votre profil à plus de {threshold} %.}} |
| `talent.dashboard.ai.matches.none` | Pas encore d'offre très compatible. Complétez vos compétences pour affiner les suggestions. |
| `talent.dashboard.ai.why` | Pourquoi ? |
| `talent.dashboard.ai.reason` | {criteria} correspondent à ce que demande la première offre. |
| `talent.dashboard.ai.score` | {score} % |
| `talent.dashboard.ai.cta` | Voir les offres |
| `talent.dashboard.ai.dismiss` | Ignorer |
| `talent.dashboard.continue.title` | Continuer à apprendre |
| `talent.dashboard.continue.seeAll` | Tout voir |
| `talent.dashboard.continue.progress` | Progression |
| `talent.dashboard.continue.lessons` | {done}/{total} leçons |
| `talent.dashboard.continue.resume` | Reprendre |
| `talent.dashboard.continue.empty.text` | Vous n'avez pas encore commencé de formation. |
| `talent.dashboard.continue.empty.cta` | Explorer le catalogue |
| `talent.dashboard.applications.title` | Candidatures en cours |
| `talent.dashboard.applications.seeAll` | Toutes mes candidatures |
| `talent.dashboard.applications.empty.text` | Aucune candidature en cours. Les candidatures sont toujours gratuites. |
| `talent.dashboard.applications.empty.cta` | Trouver une offre |
| `talent.dashboard.upcoming.title` | À venir |
| `talent.dashboard.upcoming.interview.text` | Entretien · {company} |
| `talent.dashboard.upcoming.interview.detail` | {time} · {mode} · {interviewer} |
| `talent.dashboard.upcoming.quiz.text` | Quiz · {courseTitle} |
| `talent.dashboard.upcoming.quiz.detail` | À terminer avant le {date, date, medium} |
| `talent.dashboard.upcoming.document` | Document à déposer · {documentName} |
| `talent.dashboard.upcoming.empty` | Rien de prévu pour l'instant. |
| `talent.dashboard.quotas.title` | Mes quotas |
| `talent.dashboard.quotas.renewal` | Renouvellement le {date, date, long} |
| `talent.dashboard.quotas.aiCredits` | Crédits IA |
| `talent.dashboard.quotas.interviewText` | Simulations d'entretien écrites |
| `talent.dashboard.quotas.interviewVoice` | Simulations d'entretien vocales |
| `talent.dashboard.quotas.usage` | {used} sur {quota} utilisés |
| `talent.dashboard.quotas.unlimited` | Illimité |
| `talent.dashboard.quotas.notIncluded` | Non inclus dans votre forfait |
| `talent.dashboard.quotas.seePlans` | Voir les forfaits |
| `talent.dashboard.freeReminder` | Votre forfait Free vous permet de candidater sans limite et d'être recruté au même titre que tout le monde. |
| `talent.dashboard.sponsoredBanner` | Votre accès {plan} est offert par {sponsorName} jusqu'au {date, date, long}. |
| `talent.dashboard.pastDueBanner.text` | Votre paiement est en attente. Votre forfait {plan} reste actif jusqu'au {date, date, long}. |
| `talent.dashboard.pastDueBanner.cta` | Régler maintenant |

---

### `/app` · Pour moi

*Accueil de l'espace talent (docs/ux-mobile-talent, prompt 3, écrans 03 à 05) : le contenu suit l'objectif choisi à l'écran de bienvenue (emploi, compétences, carrière). Chiffres réels seulement ; un chiffre absent n'est pas affiché. Aucun sous-titre de section.*

| Clé | Texte |
|---|---|
| `talent.forMe.seo` | Pour moi · Jumanly |
| `talent.forMe.goal.eyebrow` | Mon objectif |
| `talent.forMe.goal.none` | Choisissez votre objectif |
| `talent.forMe.goal.edit` | Modifier mon objectif |
| `talent.forMe.goal.choose` | Choisir mon objectif |
| `talent.forMe.stats.applications` | {count, plural, one {candidature} other {candidatures}} |
| `talent.forMe.stats.interviews` | {count, plural, one {entretien} other {entretiens}} |
| `talent.forMe.stats.courses` | {count, plural, one {formation en cours} other {formations en cours}} |
| `talent.forMe.stats.certificates` | {count, plural, one {attestation} other {attestations}} |
| `talent.forMe.stats.skills` | {count, plural, one {compétence à renforcer} other {compétences à renforcer}} |
| `talent.forMe.stats.profile` | profil |
| `talent.forMe.stats.percent` | {percent} % |
| `talent.forMe.jobs.title.job` | Opportunités pour vous |
| `talent.forMe.jobs.title.skills` | Offres liées à vos compétences |
| `talent.forMe.jobs.title.career` | Postes pour votre évolution |
| `talent.forMe.jobs.all` | Voir toutes les offres |
| `talent.forMe.jobs.general` | Sélection générale, non personnalisée. |
| `talent.forMe.jobs.complete` | Personnaliser |
| `talent.forMe.jobs.empty` | Aucune offre ouverte pour le moment. |
| `talent.forMe.courses.title.job` | Formations recommandées |
| `talent.forMe.courses.title.skills` | Formations recommandées |
| `talent.forMe.courses.title.career` | Formations de spécialisation |
| `talent.forMe.courses.explore` | Explorer |
| `talent.forMe.courses.resume` | Reprendre |
| `talent.forMe.courses.discover` | Découvrir |
| `talent.forMe.courses.locked` | Non incluse dans votre formule |
| `talent.forMe.courses.why` | Pourquoi ? Vos offres demandent : {skills}. |
| `talent.forMe.courses.progress` | Progression : {percent} % |
| `talent.forMe.resume.eyebrow` | Reprendre ma formation |
| `talent.forMe.resume.left` | {count, plural, =0 {Toutes les leçons sont faites} one {# leçon restante} other {# leçons restantes}} |
| `talent.forMe.resume.lesson` | Prochaine leçon : {lesson} |
| `talent.forMe.resume.cta` | Reprendre |
| `talent.forMe.tools.title` | Préparez votre candidature |
| `talent.forMe.tools.locked` | Non inclus dans votre formule |
| `talent.forMe.tools.cv` | Mon CV |
| `talent.forMe.tools.cvLine` | Créer ou améliorer |
| `talent.forMe.tools.profile` | Mon profil |
| `talent.forMe.tools.profileLine` | Le rendre visible |
| `talent.forMe.tools.interview` | Entretien |
| `talent.forMe.tools.interviewLine` | S'entraîner |
| `talent.forMe.tools.documents` | Documents |
| `talent.forMe.tools.documentsLine` | Lettres et attestations |
| `talent.forMe.position.title` | Me positionner |
| `talent.forMe.position.diagnostic` | Diagnostic carrière |
| `talent.forMe.position.diagnosticLine` | Faire le point sur votre parcours |
| `talent.forMe.position.linkedin` | Optimisation LinkedIn |
| `talent.forMe.position.linkedinLine` | Titre, résumé, compétences |
| `talent.forMe.position.portfolio` | Portfolio |
| `talent.forMe.position.portfolioLine` | Montrer vos réalisations |
| `talent.forMe.skills.title` | Compétences à renforcer |
| `talent.forMe.skills.search` | Chercher une formation en {name} |
| `talent.forMe.skills.why` | Pourquoi ces compétences ? |
| `talent.forMe.skills.whyText` | Elles sont demandées par les offres que vous avez enregistrées ou auxquelles vous avez postulé, et ne figurent pas encore sur votre profil. |
| `talent.forMe.skills.offers` | {name} : {count, plural, one {demandée par # offre} other {demandée par # offres}} |
| `talent.forMe.progress.title` | Progression et certificats |
| `talent.forMe.progress.all` | Mes acquis |
| `talent.forMe.progress.certificate` | Attestation · {title} |
| `talent.forMe.progress.issued` | Obtenue le {date, date, long} |
| `talent.forMe.progress.courses` | {inProgress, plural, one {# formation en cours} other {# formations en cours}}, {done, plural, one {# terminée} other {# terminées}} |
| `talent.forMe.progress.coursesLine` | Voir mes formations |
| `talent.forMe.actions.title.job` | Mes prochaines actions |
| `talent.forMe.actions.title.skills` | Mes prochaines actions |
| `talent.forMe.actions.title.career` | Prochaines étapes |
| `talent.forMe.actions.interview` | Confirmer votre entretien |
| `talent.forMe.actions.interviewLine` | {company} · {date, date, long} |
| `talent.forMe.actions.document` | Envoyer un document |
| `talent.forMe.actions.draft` | Terminer votre candidature |
| `talent.forMe.actions.draftLine` | {job} · {company} · brouillon enregistré |
| `talent.forMe.actions.message` | Répondre au recruteur |
| `talent.forMe.actions.messageLine` | Nouveau message |
| `talent.forMe.actions.course` | Reprendre votre formation |
| `talent.forMe.actions.profile` | Compléter votre profil |
| `talent.forMe.actions.profileLine` | Profil complet à {percent} % |

### `/app/suivi` · Suivi

*Quatrième destination de la barre du bas (docs/ux-mobile-talent, prompt 2) : ce qui attend une action, puis les candidatures, les messages et les offres enregistrées. Contenu complet au prompt 5.*

| Clé | Texte |
|---|---|
| `talent.suivi.seo` | Suivi · Jumanly |
| `talent.suivi.title` | Suivi |
| `talent.suivi.todo.title` | À traiter |
| `talent.suivi.todo.empty` | Rien à traiter pour le moment. |
| `talent.suivi.todo.interviews` | {count, plural, one {# entretien à confirmer} other {# entretiens à confirmer}} |
| `talent.suivi.todo.documents` | {count, plural, one {# document demandé} other {# documents demandés}} |
| `talent.suivi.todo.messages` | {count, plural, one {# message non lu} other {# messages non lus}} |
| `talent.suivi.todo.line` | Ouvrir mes messages |
| `talent.suivi.drafts.title` | Candidatures en brouillon |
| `talent.suivi.drafts.line` | {company} · enregistrée le {date, date, long} |
| `talent.suivi.links.title` | Mon suivi |
| `talent.suivi.links.applications` | Mes candidatures |
| `talent.suivi.links.applicationsLine` | {count, plural, =0 {Aucune candidature en cours} one {# en cours} other {# en cours}} |
| `talent.suivi.links.messages` | Messages |
| `talent.suivi.links.messagesLine` | Échanges avec les recruteurs |
| `talent.suivi.links.saved` | Offres enregistrées |
| `talent.suivi.links.savedLine` | {count, plural, =0 {Aucune offre enregistrée} one {# offre} other {# offres}} |
| `talent.suivi.filters.label` | Filtrer le suivi |
| `talent.suivi.filters.tout` | Tout |
| `talent.suivi.filters.candidatures` | Candidatures |
| `talent.suivi.filters.entretiens` | Entretiens |
| `talent.suivi.filters.messages` | Messages |
| `talent.suivi.filters.messagesCount` | Messages · {count} |
| `talent.suivi.todo.document` | Document demandé |
| `talent.suivi.todo.due` | avant le {date, date, long} |
| `talent.suivi.applications.title` | Mes candidatures |
| `talent.suivi.applications.all` | Toutes |
| `talent.suivi.applications.details` | Voir le détail |
| `talent.suivi.applications.sent` | Envoyée le {date, date, medium} |
| `talent.suivi.applications.changed` | Statut communiqué le {date, date, medium} |
| `talent.suivi.messages.waiting` | Réponse attendue |
| `talent.suivi.messages.unread` | Message non lu |
| `talent.suivi.messages.search` | Rechercher une conversation |
| `talent.suivi.messages.noResult` | Aucune conversation ne correspond à votre recherche. |
| `talent.suivi.messages.who` | Seuls vos recruteurs peuvent vous écrire. |
| `talent.suivi.empty.candidatures.title` | Aucune candidature pour l'instant |
| `talent.suivi.empty.candidatures.text` | Elles apparaîtront ici. |
| `talent.suivi.empty.candidatures.cta` | Explorer les offres |
| `talent.suivi.empty.candidatures.secondary` | Préparer mon CV d'abord |
| `talent.suivi.empty.entretiens.title` | Aucun entretien pour l'instant |
| `talent.suivi.empty.entretiens.text` | Quand un recruteur vous propose un entretien, il apparaît ici. |
| `talent.suivi.empty.entretiens.cta` | M'entraîner à l'entretien |
| `talent.suivi.empty.messages.title` | Aucun message pour l'instant |
| `talent.suivi.empty.messages.text` | Les recruteurs des offres où vous avez postulé peuvent vous écrire ici. |
| `talent.suivi.empty.messages.cta` | Explorer les offres |
| `talent.suivi.ok.confirmed` | Présence confirmée. {company} est prévenue. |
| `talent.suivi.ok.proposed` | Vos propositions sont envoyées. Le recruteur va vous répondre. |
| `talent.suivi.ok.declined` | Votre réponse est envoyée. |
| `talent.suivi.resume.title` | À reprendre |
| `talent.suivi.resume.application` | Candidature · {job} |
| `talent.suivi.resume.cta` | Reprendre |
| `talent.suivi.links.savedHint` | Les offres gardées pour plus tard |
| `talent.suivi.interviews.title` | Entretiens à venir |
| `talent.suivi.prepare.title` | Préparer |
| `talent.suivi.prepare.simulation` | Simulation d'entretien |
| `talent.suivi.prepare.simulationLine` | Questions du poste, à l'écrit ou à l'oral |
| `talent.suivi.prepare.offer` | Revoir l'offre |
| `talent.suivi.interview.noDate` | date |
| `talent.suivi.interview.unknown` | ? |
| `talent.suivi.interview.toConfirm` | Entretien à confirmer |
| `talent.suivi.interview.confirmed` | Confirmé |
| `talent.suivi.interview.waiting` | En attente du recruteur |
| `talent.suivi.interview.proposedLine` | {company} · vous avez proposé {count, plural, one {# créneau} other {# créneaux}} le {date, date, long} |
| `talent.suivi.interview.when` | {day}, {start} – {end} (heure de {city}) |
| `talent.suivi.interview.confirm` | Confirmer |
| `talent.suivi.interview.propose` | Proposer un autre moment |
| `talent.suivi.interview.editProposals` | Modifier mes propositions |
| `talent.suivi.interview.join` | Rejoindre |
| `talent.suivi.interview.joinLater` | Le lien s'active {hours, plural, one {# heure} other {# heures}} avant. |
| `talent.suivi.interview.calendar` | Ajouter à mon agenda |
| `talent.suivi.calendar.summary` | Entretien · {job} · {company} |
| `talent.suivi.confirm.title` | Confirmer l'entretien |
| `talent.suivi.confirm.confirmedTitle` | Votre entretien |
| `talent.suivi.confirm.with` | Avec {name} |
| `talent.suivi.confirm.format` | {mode} · {minutes} minutes |
| `talent.suivi.confirm.addressLater` | Adresse communiquée par le recruteur |
| `talent.suivi.confirm.linkLater` | Lien après confirmation |
| `talent.suivi.confirm.back` | Retour |
| `talent.suivi.confirm.close` | Fermer |
| `talent.suivi.confirm.choose` | Choisissez un des créneaux proposés |
| `talent.suivi.confirm.slotLine` | {start} – {end} · heure de {city} |
| `talent.suivi.confirm.none` | Aucun ne me convient : proposer un autre moment |
| `talent.suivi.confirm.submit` | Confirmer ce créneau |
| `talent.suivi.confirm.propose.title` | Proposer un autre moment |
| `talent.suivi.confirm.propose.hint` | Jusqu'à {max} créneaux, à l'heure de {city}. |
| `talent.suivi.confirm.propose.error` | Choisissez au moins un créneau à venir. |
| `talent.suivi.confirm.propose.hour` | {hour} h 00 |
| `talent.suivi.confirm.propose.days` | Jour |
| `talent.suivi.confirm.propose.hours` | Heure |
| `talent.suivi.confirm.propose.chosen` | Vos propositions · {count} sur {max} |
| `talent.suivi.confirm.propose.item` | {day} · {hour} |
| `talent.suivi.confirm.propose.remove` | Retirer {slot} |
| `talent.suivi.confirm.propose.full` | Vous avez choisi {max} créneaux. Retirez-en un pour en changer. |
| `talent.suivi.confirm.propose.messageLabel` | Un mot pour le recruteur |
| `talent.suivi.confirm.propose.message` | Un mot pour le recruteur (facultatif) |
| `talent.suivi.confirm.propose.send` | Envoyer mes propositions |

### `/app/espace` · Mon espace

*Tout l'espace personnel sur une page (écran 17) : profil, outils carrière, acquis, compte. Ouverte depuis « Tout Mon espace » dans le menu de l'avatar.*

| Clé | Texte |
|---|---|
| `talent.espace.seo` | Mon espace · Jumanly |
| `talent.espace.title` | Mon espace |
| `talent.espace.back` | Retour |
| `talent.espace.completeness` | Profil complété à {percent} % |
| `talent.espace.complete` | Compléter |
| `talent.espace.missing` | Il manque : {sections}. |
| `talent.espace.spaces` | Changer d'espace |
| `talent.espace.tiles.dashboard` | Tableau de bord |
| `talent.espace.tiles.dashboardLine` | Mon activité |
| `talent.espace.tiles.subscription` | Abonnement |
| `talent.espace.tiles.subscriptionLine` | Formule {plan} |
| `talent.espace.groups.profile` | Profil professionnel |
| `talent.espace.groups.tools` | Outils carrière |
| `talent.espace.groups.acquired` | Acquis |
| `talent.espace.groups.account` | Mon compte |
| `talent.espace.rows.edit` | Modifier mes informations |
| `talent.espace.rows.editLine` | Titre, résumé, coordonnées |
| `talent.espace.rows.skills` | Mes compétences |
| `talent.espace.rows.skillsLine` | {count, plural, =0 {Aucune compétence} one {# compétence} other {# compétences}} |
| `talent.espace.rows.portfolio` | Mon portfolio |
| `talent.espace.rows.portfolioLine` | Vos réalisations |
| `talent.espace.rows.visibility` | Visibilité auprès des recruteurs |
| `talent.espace.rows.visibilityLine` | Qui peut voir mon profil |
| `talent.espace.tools.builder` | CV Builder |
| `talent.espace.tools.builderLine` | Créer un CV |
| `talent.espace.tools.cvs` | Mes CV |
| `talent.espace.tools.cvsLine` | {count, plural, =0 {Aucun CV} one {# CV} other {# CV}} |
| `talent.espace.tools.documents` | Lettres et documents |
| `talent.espace.tools.documentsLine` | Modèles et pièces |
| `talent.espace.tools.linkedin` | Optimisation LinkedIn |
| `talent.espace.tools.linkedinLine` | Titre, résumé |
| `talent.espace.tools.interviews` | Simulations d'entretien |
| `talent.espace.tools.interviewsLine` | À l'écrit ou à l'oral |
| `talent.espace.tools.career` | Tous les outils Career |
| `talent.espace.tools.careerLine` | Diagnostic, plan, conseils |
| `talent.espace.tools.locked` | Outil non inclus dans votre formule |
| `talent.espace.acquired.certificates` | Certificats et attestations |
| `talent.espace.acquired.certificatesLine` | {count, plural, =0 {Aucune attestation} one {# attestation} other {# attestations}} |
| `talent.espace.acquired.evaluations` | Compétences évaluées |
| `talent.espace.acquired.evaluationsLine` | Résultats de vos évaluations |
| `talent.espace.account.billing` | Abonnement et facturation |
| `talent.espace.account.notifications` | Notifications |
| `talent.espace.account.settings` | Paramètres et confidentialité |
| `talent.espace.account.matching` | Comment fonctionne le matching |
| `talent.espace.account.license` | Activer un code de licence |
| `talent.espace.account.help` | Assistance |

### `/app/profil` · Profil professionnel

*Construire le profil qui alimente le CV, le matching et la vue recruteur.*

#### En-tête et complétude

| Clé | Texte |
|---|---|
| `talent.profile.title` | Mon profil professionnel |
| `talent.profile.tabs.aria` | Parties du profil |
| `talent.profile.tabs.visibility` | Visibilité |
| `talent.profile.subtitle` | Votre profil alimente votre CV, vos candidatures et les suggestions d'offres. |
| `talent.profile.completion.text` | Profil complété à {percent} % |
| `talent.profile.completion.next` | Compléter : {section} |
| `talent.profile.completion.hint` | Un profil complet aide les recruteurs à vous comprendre. |
| `talent.profile.completion.missing` | Il manque : {sections} |
| `talent.profile.preview.text` | Aperçu côté recruteur |
| `talent.profile.preview.title` | Voici ce qu'un recruteur voit |
| `talent.profile.preview.anonymous` | En mode anonyme, votre nom et votre photo sont masqués jusqu'à ce que vous acceptiez une mise en relation. |
| `talent.profile.importCv.text` | Remplir à partir de mon CV |
| `talent.profile.importCv.hint` | Nous lisons votre CV et pré-remplissons les sections. Vous validez chaque élément. |
| `talent.profile.importCv.action` | Importer un CV |
| `talent.profile.import.paste.label` | Texte de votre CV |
| `talent.profile.import.paste.hint` | Ouvrez votre CV, copiez tout le texte et collez-le ici. Rien n'est ajouté à votre profil sans votre validation. |
| `talent.profile.import.submit` | Lire mon CV |
| `talent.profile.import.tooShort` | Collez le texte de votre CV (30 caractères au moins). |
| `talent.profile.import.empty` | Aucun élément trouvé. Vérifiez le texte collé, ou remplissez votre profil à la main. |
| `talent.profile.import.noStart` | Date de début introuvable : ajoutez cette expérience à la main. |
| `talent.profile.import.skillsHint` | Seules les compétences de notre référentiel sont ajoutées. Vous pourrez préciser leur niveau dans votre profil. |
| `talent.profile.import.cancel` | Annuler l'import |
| `talent.profile.save` | Enregistrer |
| `talent.profile.saved` | Profil enregistré. |
| `talent.profile.autosaved` | Enregistré automatiquement |
| `talent.profile.phone.title` | Mon profil |
| `talent.profile.phone.back` | Retour à Mon espace |
| `talent.profile.phone.backProfile` | Retour à mon profil |
| `talent.profile.phone.photo.change` | Changer la photo |
| `talent.profile.phone.photo.title` | Photo de profil |
| `talent.profile.phone.photo.close` | Fermer |
| `talent.profile.phone.photo.take` | Prendre une photo |
| `talent.profile.phone.photo.choose` | Choisir dans la galerie |
| `talent.profile.phone.photo.remove` | Retirer la photo |
| `talent.profile.phone.photo.never` | Jamais utilisée pour le matching. |
| `talent.profile.phone.photo.zoom` | Agrandir la photo |
| `talent.profile.phone.photo.cancel` | Annuler |
| `talent.profile.phone.photo.save` | Enregistrer la photo |
| `talent.profile.phone.photo.empty` | Choisissez ou prenez une photo pour la recadrer. |
| `talent.profile.phone.photo.drag` | Faites glisser la photo pour la centrer. |
| `talent.profile.phone.photo.error.type` | Ce fichier n'est pas une image JPEG, PNG ou WebP. |
| `talent.profile.phone.photo.error.size` | Cette image est trop lourde. Essayez-en une autre. |
| `talent.profile.phone.photo.error.photo` | La photo n'a pas pu être envoyée. Réessayez. |
| `talent.profile.phone.photo.saved` | Photo enregistrée. |
| `talent.profile.phone.photo.removed` | Photo retirée. |
| `talent.profile.phone.build.title` | Construire mon profil |
| `talent.profile.phone.build.count` | {done} étapes sur {total} |
| `talent.profile.phone.build.add` | Ajouter |
| `talent.profile.phone.build.done` | Fait |
| `talent.profile.phone.build.step.photo` | Photo |
| `talent.profile.phone.build.step.headline` | Titre et métier visé |
| `talent.profile.phone.build.step.bio` | Bio |
| `talent.profile.phone.build.step.experiences` | Expériences |
| `talent.profile.phone.build.step.skills` | Compétences |
| `talent.profile.phone.build.step.education` | Formation |
| `talent.profile.phone.headline.label` | Titre |
| `talent.profile.phone.headline.placeholder` | Ex. : Analyste de données |
| `talent.profile.phone.bio.label` | Bio |
| `talent.profile.phone.bio.hint` | ce que les recruteurs lisent en premier |
| `talent.profile.phone.bio.placeholder` | En deux ou trois phrases : ce que vous faites et ce que vous cherchez. |
| `talent.profile.phone.bio.counter` | {count} / {max} |
| `talent.profile.phone.bio.ai` | M'aider à l'écrire |
| `talent.profile.phone.bio.aiSoon` | Bientôt disponible |
| `talent.profile.phone.status.saved` | Enregistré |
| `talent.profile.phone.status.saving` | Enregistrement… |
| `talent.profile.phone.status.error` | Non enregistré, réessayez |
| `talent.profile.phone.status.idle` | Enregistré au fil de la saisie |
| `talent.profile.phone.rows.label` | Parties du profil |
| `talent.profile.phone.rows.experiences` | Expériences |
| `talent.profile.phone.rows.experiencesCount` | {count, plural, =0 {Ajouter un poste} one {# poste} other {# postes}} |
| `talent.profile.phone.rows.education` | Formation |
| `talent.profile.phone.rows.educationCount` | {count, plural, =0 {Ajouter un diplôme} one {# diplôme} other {# diplômes}} |
| `talent.profile.phone.rows.skills` | Compétences |
| `talent.profile.phone.rows.skillsCount` | {count, plural, =0 {Ajouter une compétence} one {# compétence} other {# compétences}} |
| `talent.profile.phone.rows.languages` | Langues |
| `talent.profile.phone.rows.languagesEmpty` | Ajouter une langue |
| `talent.profile.phone.rows.place` | Lieu et préférences |
| `talent.profile.phone.rows.placeEmpty` | Ajouter vos préférences |
| `talent.profile.phone.rows.identity` | Identité |
| `talent.profile.phone.rows.visibility` | Visibilité |
| `talent.profile.phone.rows.import` | Importer mon CV |
| `talent.profile.phone.preview` | Voir mon profil côté recruteur |
| `talent.profile.unsaved` | Modifications non enregistrées |
| `talent.profile.edit` | Modifier |
| `talent.profile.add` | Ajouter |
| `talent.profile.delete` | Supprimer |
| `talent.profile.reorder` | Réorganiser |
| `talent.profile.sectionEmpty` | Cette section est vide. |
| `talent.profile.seo` | Mon profil · Jumanly |
| `talent.profile.error` | Vérifiez les champs de cette section, puis réessayez. |
| `talent.profile.cancel` | Annuler |

#### Identité

| Clé | Texte |
|---|---|
| `talent.profile.identity.title` | Identité |
| `talent.profile.identity.photo.text` | Photo de profil |
| `talent.profile.identity.photo.hint` | Facultative. La photo n'est jamais utilisée pour calculer la compatibilité. |
| `talent.profile.identity.photo.upload` | Ajouter une photo |
| `talent.profile.identity.photo.change` | Changer la photo |
| `talent.profile.identity.photo.remove` | Retirer la photo |
| `talent.profile.identity.firstName` | Prénom |
| `talent.profile.identity.lastName` | Nom |
| `talent.profile.identity.headline.text` | Titre professionnel |
| `talent.profile.identity.headline.placeholder` | Ex. : Analyste de données junior |
| `talent.profile.identity.headline.hint` | Le métier que vous visez ou exercez, en quelques mots. |
| `talent.profile.identity.country` | Pays |
| `talent.profile.identity.city.text` | Ville |
| `talent.profile.identity.city.placeholder` | Ex. : Kinshasa |
| `talent.profile.identity.email.text` | E-mail de contact |
| `talent.profile.identity.email.hint` | Visible par un recruteur seulement après votre candidature ou une mise en relation acceptée. |
| `talent.profile.identity.links.text` | Liens |
| `talent.profile.identity.links.placeholder` | https:// |
| `talent.profile.identity.links.add` | Ajouter un lien |
| `talent.profile.identity.links.label.text` | Libellé du lien |
| `talent.profile.identity.links.label.placeholder` | Ex. : LinkedIn, GitHub, site personnel |

#### Résumé

| Clé | Texte |
|---|---|
| `talent.profile.summary.title` | Résumé |
| `talent.profile.summary.label` | Présentez-vous |
| `talent.profile.summary.placeholder` | En trois ou quatre phrases : ce que vous savez faire, ce que vous cherchez, ce qui vous distingue. |
| `talent.profile.summary.counter` | {count}/{max} caractères |
| `talent.profile.summary.aiSuggest` | Proposer une reformulation |

#### Expériences

| Clé | Texte |
|---|---|
| `talent.profile.experience.title` | Expériences |
| `talent.profile.experience.add` | Ajouter une expérience |
| `talent.profile.experience.role.text` | Intitulé du poste |
| `talent.profile.experience.role.placeholder` | Ex. : Assistante reporting |
| `talent.profile.experience.company.text` | Organisation |
| `talent.profile.experience.company.placeholder` | Ex. : nom de l'entreprise, de l'association ou de l'administration |
| `talent.profile.experience.type.text` | Type |
| `talent.profile.experience.type.job` | Emploi |
| `talent.profile.experience.type.internship` | Stage |
| `talent.profile.experience.type.freelance` | Mission indépendante |
| `talent.profile.experience.type.volunteer` | Bénévolat ou engagement |
| `talent.profile.experience.type.entrepreneur` | Entrepreneuriat |
| `talent.profile.experience.location` | Lieu |
| `talent.profile.experience.start` | Date de début |
| `talent.profile.experience.end` | Date de fin |
| `talent.profile.experience.current` | J'occupe actuellement ce poste |
| `talent.profile.experience.period.current` | {start} à aujourd'hui |
| `talent.profile.experience.period.text` | {start} à {end} |
| `talent.profile.experience.description.text` | Réalisations |
| `talent.profile.experience.description.placeholder` | Une réalisation par ligne. Commencez par un verbe d'action et chiffrez quand c'est possible. |
| `talent.profile.experience.skills` | Compétences utilisées |
| `talent.profile.experience.error.endBeforeStart` | La date de fin doit suivre la date de début. |
| `talent.profile.experience.empty` | Ajoutez vos emplois, stages, missions ou engagements. Tout compte. |

#### Formations et diplômes

| Clé | Texte |
|---|---|
| `talent.profile.education.title` | Formations et diplômes |
| `talent.profile.education.add` | Ajouter une formation |
| `talent.profile.education.degree.text` | Diplôme ou intitulé |
| `talent.profile.education.degree.placeholder` | Ex. : Licence en sciences économiques |
| `talent.profile.education.level.text` | Niveau |
| `talent.profile.education.level.none` | Sans diplôme |
| `talent.profile.education.level.secondary` | Secondaire |
| `talent.profile.education.level.vocational` | Formation professionnelle |
| `talent.profile.education.level.bachelor` | Licence ou équivalent |
| `talent.profile.education.level.master` | Master ou équivalent |
| `talent.profile.education.level.doctorate` | Doctorat |
| `talent.profile.education.field` | Domaine |
| `talent.profile.education.school` | Établissement |
| `talent.profile.education.start` | Année de début |
| `talent.profile.education.end` | Année de fin |
| `talent.profile.education.inProgress` | En cours |
| `talent.profile.education.jumanlyCertificates.text` | Attestations Jumanly |
| `talent.profile.education.jumanlyCertificates.hint` | Ajoutées automatiquement quand vous terminez une formation. Vous pouvez les masquer. |
| `talent.profile.education.jumanlyCertificates.hide` | Masquer sur le profil |
| `talent.profile.education.jumanlyCertificates.show` | Afficher sur le profil |
| `talent.profile.education.jumanlyCertificates.issued` | Obtenue le {date, date, long} |

#### Compétences

| Clé | Texte |
|---|---|
| `talent.profile.skills.title` | Compétences |
| `talent.profile.skills.subtitle` | Elles comptent le plus dans le calcul de compatibilité. Indiquez votre niveau et, si possible, une preuve. |
| `talent.profile.skills.add` | Ajouter une compétence |
| `talent.profile.skills.search.placeholder` | Ex. : SQL, gestion de projet, prise de parole |
| `talent.profile.skills.level.text` | Niveau |
| `talent.profile.skills.level.beginner` | Débutant |
| `talent.profile.skills.level.intermediate` | Intermédiaire |
| `talent.profile.skills.level.advanced` | Avancé |
| `talent.profile.skills.level.expert` | Expert |
| `talent.profile.skills.proof.text` | Preuve |
| `talent.profile.skills.proof.hint` | Une attestation, un projet, une expérience ou un lien qui montre cette compétence. |
| `talent.profile.skills.proof.certificate` | Attestation Jumanly |
| `talent.profile.skills.proof.experience` | Expérience |
| `talent.profile.skills.proof.project` | Projet du portfolio |
| `talent.profile.skills.proof.link` | Lien |
| `talent.profile.skills.proof.none` | Sans preuve |
| `talent.profile.skills.badge.verified` | Validée par une attestation Jumanly |
| `talent.profile.skills.badge.declared` | Déclarée |
| `talent.profile.skills.max` | Vous pouvez ajouter jusqu'à {max} compétences. |
| `talent.profile.skills.duplicate` | Cette compétence est déjà dans votre profil. |
| `talent.profile.skills.empty` | Ajoutez au moins trois compétences pour recevoir des suggestions d'offres. |
| `talent.profile.skills.unknown` | Cette compétence n'est pas dans notre référentiel. Choisissez une des propositions de la liste. |
| `talent.profile.skills.proofUrl` | Lien vers la preuve (facultatif) |
| `talent.profile.skills.count` | {count} sur {max} |
| `talent.profile.skills.table.skill` | Compétence et preuve |

#### Langues

| Clé | Texte |
|---|---|
| `talent.profile.languages.title` | Langues |
| `talent.profile.languages.add` | Ajouter une langue |
| `talent.profile.languages.language` | Langue |
| `talent.profile.languages.level.text` | Niveau |
| `talent.profile.languages.level.native` | Langue maternelle |
| `talent.profile.languages.level.fluent` | Courant |
| `talent.profile.languages.level.professional` | Professionnel |
| `talent.profile.languages.level.intermediate` | Intermédiaire |
| `talent.profile.languages.level.basic` | Notions |
| `talent.profile.languages.cefr.text` | Niveau CECR (facultatif) |
| `talent.profile.languages.cefr.placeholder` | Ex. : B2 |
| `talent.profile.languages.empty` | Ajoutez les langues dans lesquelles vous pouvez travailler. |

#### Disponibilité et préférences

| Clé | Texte |
|---|---|
| `talent.profile.availability.title` | Disponibilité |
| `talent.profile.availability.status.text` | Situation |
| `talent.profile.availability.status.open` | En recherche active |
| `talent.profile.availability.status.listening` | À l'écoute d'opportunités |
| `talent.profile.availability.status.notLooking` | Pas en recherche |
| `talent.profile.availability.from` | Disponible à partir de |
| `talent.profile.availability.immediate` | Disponible immédiatement |
| `talent.profile.availability.notice.text` | Préavis |
| `talent.profile.availability.notice.placeholder` | Ex. : 1 mois |
| `talent.profile.preferences.title` | Préférences |
| `talent.profile.preferences.subtitle` | Elles servent à vous proposer des offres adaptées. Elles ne sont pas visibles des recruteurs, sauf le type de contrat et la disponibilité. |
| `talent.profile.preferences.jobTitles.text` | Postes recherchés |
| `talent.profile.preferences.jobTitles.placeholder` | Ex. : Data analyst, chargé de reporting |
| `talent.profile.preferences.contract.text` | Types de contrat |
| `talent.profile.preferences.contract.cdi` | CDI |
| `talent.profile.preferences.contract.cdd` | CDD |
| `talent.profile.preferences.contract.internship` | Stage |
| `talent.profile.preferences.contract.freelance` | Mission ou freelance |
| `talent.profile.preferences.contract.apprenticeship` | Alternance |
| `talent.profile.preferences.contract.volunteer` | Volontariat |
| `talent.profile.preferences.contract.partTime` | Temps partiel |
| `talent.profile.preferences.location.text` | Lieux souhaités |
| `talent.profile.preferences.location.placeholder` | Ville ou pays |
| `talent.profile.preferences.radius.text` | Rayon |
| `talent.profile.preferences.radius.value` | {km} km |
| `talent.profile.preferences.remote.text` | Mode de travail |
| `talent.profile.preferences.remote.onsite` | Sur site |
| `talent.profile.preferences.remote.hybrid` | Hybride |
| `talent.profile.preferences.remote.remote` | Télétravail |
| `talent.profile.preferences.relocation` | Prêt à déménager |
| `talent.profile.preferences.salary.text` | Salaire souhaité |
| `talent.profile.preferences.salary.min` | Minimum |
| `talent.profile.preferences.salary.currency` | Devise |
| `talent.profile.preferences.salary.period.text` | Période |
| `talent.profile.preferences.salary.period.month` | par mois |
| `talent.profile.preferences.salary.period.year` | par an |
| `talent.profile.preferences.salary.hint` | Facultatif. Jamais affiché aux recruteurs. |
| `talent.profile.preferences.sectors` | Secteurs d'intérêt |

#### Visibilité du profil

| Clé | Texte |
|---|---|
| `talent.profile.visibility.title` | Qui peut voir mon profil ? |
| `talent.profile.visibility.subtitle` | Vous choisissez. Vous pouvez changer d'avis à tout moment. |
| `talent.profile.visibility.private.text` | Privé |
| `talent.profile.visibility.private.desc` | Seuls les recruteurs des offres auxquelles vous candidatez voient votre profil. Vous n'apparaissez pas dans le vivier de talents. |
| `talent.profile.visibility.recruiters.text` | Visible des recruteurs |
| `talent.profile.visibility.recruiters.desc` | Les recruteurs inscrits sur Jumanly peuvent vous trouver dans le vivier de talents, avec votre nom. Ils doivent vous demander une mise en relation avant de vous écrire. |
| `talent.profile.visibility.anonymous.text` | Anonyme |
| `talent.profile.visibility.anonymous.desc` | Vous apparaissez dans le vivier, mais votre nom et votre photo restent masqués jusqu'à ce que vous acceptiez une mise en relation. |
| `talent.profile.visibility.badge.private` | Profil privé |
| `talent.profile.visibility.badge.recruiters` | Visible des recruteurs |
| `talent.profile.visibility.badge.anonymous` | Profil anonyme |
| `talent.profile.visibility.always` | Quel que soit votre choix, aucun recruteur ne peut vous écrire sans votre candidature ou votre accord. |
| `talent.profile.visibility.changed` | Visibilité mise à jour : {visibility}. |
| `talent.profile.visibility.confirmPrivate.title` | Passer en profil privé ? |
| `talent.profile.visibility.confirmPrivate.body` | Vous n'apparaîtrez plus dans le vivier de talents. Vos candidatures en cours ne sont pas touchées. |
| `talent.profile.visibility.confirmPrivate.confirm` | Passer en privé |
| `talent.profile.visibility.blockedCompanies.text` | Organisations masquées |
| `talent.profile.visibility.blockedCompanies.hint` | Ces organisations ne vous verront pas dans le vivier, par exemple votre employeur actuel. |
| `talent.profile.visibility.blockedCompanies.add` | Masquer une organisation |

---

### `/app/learn` · Catalogue Learn

*Montrer ce que le talent peut suivre maintenant, et ce qu'un forfait supérieur ouvrirait, sans culpabiliser.*

| Clé | Texte |
|---|---|
| `learn.catalog.eyebrow` | Learn · {count, plural, one {# formation} other {# formations}}, dont {free} gratuites |
| `learn.catalog.title` | Explorer les formations |
| `learn.seo` | Learn · Formations |
| `learn.catalog.search.label` | Rechercher une formation |
| `learn.catalog.search.submit` | Rechercher |
| `learn.catalog.tabs` | Listes de formations |
| `learn.catalog.certificatesLink` | Mes attestations |
| `learn.catalog.resume` | Reprendre ma formation · {percent} % |
| `learn.catalog.search.placeholder` | Rechercher une formation, une compétence, un formateur |
| `learn.catalog.tab.all` | Toutes |
| `learn.catalog.tab.mine` | Mes formations |
| `learn.catalog.tab.saved` | Enregistrées |
| `learn.catalog.tab.completed` | Terminées |
| `learn.catalog.filters.text` | Filtres |
| `learn.catalog.filters.count` | Filtres · {count} |
| `learn.catalog.filters.reset` | Réinitialiser |
| `learn.catalog.filters.apply` | Afficher {count, plural, one {# formation} other {# formations}} |
| `learn.catalog.filter.theme` | Thème |
| `learn.catalog.filter.level.text` | Niveau |
| `learn.catalog.filter.level.beginner` | Débutant |
| `learn.catalog.filter.level.intermediate` | Intermédiaire |
| `learn.catalog.filter.level.advanced` | Avancé |
| `learn.catalog.filter.access.text` | Accès |
| `learn.catalog.filter.access.included` | Inclus dans mon forfait |
| `learn.catalog.filter.access.free` | Gratuit |
| `learn.catalog.filter.access.all` | Toutes |
| `learn.catalog.filter.duration.text` | Durée |
| `learn.catalog.filter.duration.short` | Moins de 2 h |
| `learn.catalog.filter.duration.medium` | 2 à 10 h |
| `learn.catalog.filter.duration.long` | Plus de 10 h |
| `learn.catalog.filter.language` | Langue |
| `learn.catalog.filter.certificate` | Avec attestation |
| `learn.catalog.filter.skill` | Compétence |
| `learn.catalog.filter.editorial` | Collection |
| `learn.catalog.filter.any` | Tous |
| `learn.catalog.filter.submit` | Appliquer |
| `learn.catalog.filter.active` | {count, plural, one {# filtre actif} other {# filtres actifs}} |
| `learn.catalog.language.fr` | Français |
| `learn.catalog.language.en` | Anglais |
| `learn.catalog.domains.title` | Domaines |
| `learn.catalog.domains.all` | Tous les domaines |
| `learn.catalog.domains.count` | {count, plural, =0 {Bientôt} one {# formation} other {# formations}} |
| `learn.catalog.domain.eyebrow` | Domaine |
| `learn.catalog.domain.empty` | Aucune formation publiée dans ce domaine pour l'instant. |
| `learn.catalog.paths.title` | Parcours |
| `learn.catalog.paths.subtitle` | Plusieurs formations à suivre dans l'ordre pour atteindre un objectif. |
| `learn.catalog.paths.courses` | {count, plural, one {# formation} other {# formations}} |
| `learn.catalog.paths.open` | Voir le parcours |
| `learn.catalog.paths.label` | Parcours |
| `learn.editorial.originals` | Jumanly Originals |
| `learn.editorial.expert_series` | Jumanly Expert Series |
| `learn.editorial.partner_programs` | Jumanly Partner Programs |
| `learn.catalog.sort.text` | Trier |
| `learn.catalog.sort.popular` | Popularité |
| `learn.catalog.sort.recent` | Plus récentes |
| `learn.catalog.sort.recommended` | Recommandées pour moi |
| `learn.catalog.sort.duration` | Durée |
| `learn.catalog.featured.badge` | Parcours |
| `learn.catalog.featured.cta` | Commencer le parcours |
| `learn.catalog.section.popular` | Populaires |
| `learn.catalog.section.recommended` | Recommandé pour votre objectif « {goal} » |
| `learn.catalog.section.continue` | En cours |
| `learn.catalog.seeAll` | Voir tout le catalogue |
| `learn.card.modules` | {count, plural, one {# module} other {# modules}} |
| `learn.card.lessons` | {count, plural, one {# leçon} other {# leçons}} |
| `learn.card.duration.text` | {hours} h |
| `learn.card.duration.minutes` | {minutes} min |
| `learn.card.rating` | {rating}/5 · {count, plural, one {# avis} other {# avis}} |
| `learn.card.learners` | {count, plural, one {# apprenant} other {# apprenants}} |
| `learn.card.instructor` | {name} |
| `learn.card.certificate` | Attestation |
| `learn.card.badge.free` | Gratuit |
| `learn.card.badge.included` | Inclus dans {plan} |
| `learn.card.badge.new` | Nouveau |
| `learn.card.progress` | {percent} % |
| `learn.card.completed` | Terminée |
| `learn.card.save` | Enregistrer |
| `learn.card.saved` | Enregistrée |
| `learn.card.start` | Commencer |
| `learn.card.resume` | Reprendre |
| `learn.lock.badge` | Disponible avec {plan} |
| `learn.lock.title` | Cette formation est disponible avec {plan} |
| `learn.lock.body` | Vous pouvez consulter le programme et la première leçon. Pour suivre la suite, passez à {plan} ou attendez qu'une licence vous soit proposée. |
| `learn.lock.preview` | Voir la première leçon |
| `learn.lock.cta` | Voir les forfaits |
| `learn.lock.aria` | Formation verrouillée, disponible avec {plan} |
| `learn.catalog.empty.text` | Aucune formation ne correspond à ces filtres. |
| `learn.catalog.empty.cta` | Effacer les filtres |
| `learn.mine.empty.text` | Vous n'avez pas encore commencé de formation. Les formations gratuites sont ouvertes à tous. |
| `learn.mine.empty.cta` | Voir les formations gratuites |
| `learn.saved.empty` | Aucune formation enregistrée. |
| `learn.completed.empty` | Vos formations terminées apparaîtront ici, avec leurs attestations. |
| `learn.catalog.loading` | Chargement des formations… |
| `learn.save.success` | Formation enregistrée. |
| `learn.save.removed` | Formation retirée de vos enregistrements. |

### `/app/learn` · Académie : Mon espace d'apprentissage

*L'accueil de l'académie : la prochaine leçon en un clic, ce qui reste à faire, l'aide du Coach IA et les attestations obtenues. Encourager sans culpabiliser.*

| Clé | Texte |
|---|---|
| `learn.home.seo` | Learn · Mon espace d'apprentissage |
| `learn.home.eyebrow` | Learn · Mon espace d'apprentissage |
| `learn.home.title` | Bonjour {firstName}, on apprend quoi aujourd'hui ? |
| `learn.home.next.eyebrow` | Votre prochaine leçon |
| `learn.home.next.position` | Module {module} · {lesson} |
| `learn.home.next.remaining` | {count, plural, one {Encore # leçon avant l'attestation} other {Encore # leçons avant l'attestation}} |
| `learn.home.next.cta` | Reprendre la leçon |
| `learn.home.next.others` | Vos autres formations en cours |
| `learn.home.start.title` | Commencez votre première formation |
| `learn.home.start.body` | Choisissez une formation gratuite : votre progression, vos évaluations et vos attestations s'afficheront ici. |
| `learn.home.start.cta` | Explorer les formations |
| `learn.home.stats.aria` | Votre progression |
| `learn.home.stats.inProgress` | Formations en cours |
| `learn.home.stats.lessons` | Leçons terminées |
| `learn.home.stats.passed` | Évaluations réussies |
| `learn.home.stats.certificates` | Attestations |
| `learn.home.todo.title` | À faire maintenant |
| `learn.home.todo.empty` | Rien à rattraper : vos évaluations sont à jour. |
| `learn.home.todo.all` | Exercices et évaluations |
| `learn.home.coach.eyebrow` | Coach IA |
| `learn.home.coach.title` | Une notion vous résiste ? |
| `learn.home.coach.body` | Le Coach IA explique, reformule et donne des exemples à partir de vos leçons. Il ne donne pas les réponses des évaluations. |
| `learn.home.coach.cta` | Parler au Coach IA |
| `learn.home.certificate.title` | Dernière attestation |
| `learn.home.certificate.issued` | Délivrée le {date} |
| `learn.home.certificate.cta` | Mes certifications |
| `learn.home.certificate.empty` | Terminez une formation pour obtenir votre première attestation. |
| `learn.home.reco.title` | Recommandées pour vous |
| `learn.home.reco.all` | Tout voir |
| `learn.home.domains.title` | Domaines |
| `learn.home.domains.explore` | Explorer le catalogue |
| `learn.home.acquired.title` | Exercices et certificats |
| `learn.home.acquired.evaluations` | Mes évaluations |
| `learn.home.acquired.evaluationsTodo` | {count, plural, one {# exercice à faire} other {# exercices à faire}} |
| `learn.home.acquired.certificates` | Mes attestations |
| `learn.home.acquired.certificatesCount` | {count, plural, =0 {Aucune attestation pour le moment} one {# attestation obtenue} other {# attestations obtenues}} |
| `learn.home.acquired.paths` | Mes parcours |
| `learn.home.acquired.pathsLine` | {count, plural, =0 {Aucune formation en cours} one {# formation en cours} other {# formations en cours}} |

### `/app/learn/parcours` · Mes parcours

*Toutes les formations du talent, avec l'étape suivante de chacune.*

| Clé | Texte |
|---|---|
| `learn.paths.seo` | Learn · Mes parcours |
| `learn.paths.eyebrow` | Learn · Mes parcours |
| `learn.paths.title` | Mes parcours |
| `learn.paths.tabs` | Listes de formations |
| `learn.paths.tab.active` | En cours |
| `learn.paths.tab.completed` | Terminées |
| `learn.paths.tab.saved` | Enregistrées |
| `learn.paths.next` | Prochaine leçon : {lesson} |
| `learn.paths.remaining` | {count, plural, one {# leçon restante} other {# leçons restantes}} |
| `learn.paths.completedOn` | Terminée le {date} |
| `learn.paths.certificate` | Voir l'attestation |
| `learn.paths.open` | Ouvrir |
| `learn.paths.followed.title` | Parcours suivis |
| `learn.paths.followed.progress` | {done} sur {total} formations terminées |
| `learn.paths.followed.next` | Prochaine formation : {course} |
| `learn.paths.followed.finished` | Parcours terminé |
| `learn.paths.followed.discover` | Découvrir les parcours |

### `/app/learn/parcours/[parcours]` · Un parcours (Learn v2, étape 2)

*Les formations d'un parcours dans l'ordre conseillé, avec la progression et l'étape suivante.*

| Clé | Texte |
|---|---|
| `learn.path.seo` | Learn · Parcours |
| `learn.path.eyebrow` | Parcours |
| `learn.path.back` | Explorer |
| `learn.path.progress` | {done} sur {total} formations terminées |
| `learn.path.start` | Commencer le parcours |
| `learn.path.continue` | Continuer : {course} |
| `learn.path.finished` | Parcours terminé, bravo. Vos attestations sont dans « Certifications ». |
| `learn.path.followed` | Parcours ajouté à « Mes parcours ». |
| `learn.path.unfollowed` | Parcours retiré de « Mes parcours ». Vos formations et votre progression restent. |
| `learn.path.unfollow` | Ne plus suivre ce parcours |
| `learn.path.steps` | Les étapes du parcours |
| `learn.path.step` | Étape {number} |
| `learn.path.state.done` | Terminée |
| `learn.path.state.active` | En cours · {percent} % |
| `learn.path.state.todo` | À faire |
| `learn.path.state.locked` | Disponible avec {plan} |
| `learn.path.open` | Ouvrir la formation |
| `learn.path.access` | Le parcours n'ouvre pas de formation à lui seul : chaque formation garde l'accès de votre formule. |
| `learn.path.nextLocked` | La prochaine formation demande la formule {plan}. |
| `learn.path.plans` | Voir les formules |

### `/app/learn/evaluations` · Exercices et évaluations

*Les quiz qui valident une formation et les exercices qui entraînent, rangés par ce qu'il reste à faire.*

| Clé | Texte |
|---|---|
| `learn.evaluations.seo` | Learn · Exercices et évaluations |
| `learn.evaluations.eyebrow` | Learn · Exercices et évaluations |
| `learn.evaluations.title` | Exercices et évaluations |
| `learn.evaluations.intro` | Les évaluations valident vos formations ; les exercices vous entraînent. Le Coach IA peut vous aider à comprendre une erreur, sans donner les réponses. |
| `learn.evaluations.tabs` | Filtrer les évaluations |
| `learn.evaluations.tab.todo` | À faire · {count} |
| `learn.evaluations.tab.review` | À revoir · {count} |
| `learn.evaluations.tab.passed` | Réussies · {count} |
| `learn.evaluations.kind.quiz` | Évaluation |
| `learn.evaluations.kind.exercise` | Exercice |
| `learn.evaluations.questions` | {count, plural, one {# question} other {# questions}} |
| `learn.evaluations.minutes` | {minutes} min |
| `learn.evaluations.passing` | Réussie à partir de {score} % |
| `learn.evaluations.best` | Meilleur score : {score} % |
| `learn.evaluations.attempts` | {count, plural, one {# essai} other {# essais}} |
| `learn.evaluations.cta.start` | Commencer |
| `learn.evaluations.cta.retry` | Réessayer |
| `learn.evaluations.cta.review` | Revoir |
| `learn.evaluations.cta.coach` | Comprendre avec le Coach IA |
| `learn.evaluations.empty.todo` | Tout est à jour. Explorez une nouvelle formation pour continuer à progresser. |
| `learn.evaluations.empty.review` | Aucune évaluation à revoir. |
| `learn.evaluations.empty.passed` | Vos évaluations réussies s'afficheront ici. |
| `learn.evaluations.empty.cta` | Explorer les formations |

### `/app/learn/coach` · Coach IA (assistant pédagogique)

*Un assistant qui accompagne l'apprenant à partir du contenu de ses formations uniquement : il explique, reformule, donne des exemples, propose des exercices, aide à comprendre une erreur et conseille quoi réviser. Il n'invente rien et ne donne jamais les réponses des évaluations.*

| Clé | Texte |
|---|---|
| `learn.coach.seo` | Learn · Coach IA |
| `learn.coach.eyebrow` | Learn · Coach IA |
| `learn.coach.title` | Votre Coach IA |
| `learn.coach.intro` | Il explique, reformule et donne des exemples à partir de vos leçons. Il ne donne pas les réponses des évaluations : il vous aide à les trouver. |
| `learn.coach.welcome` | Bonjour {firstName} ! Choisissez ce dont vous avez besoin ou posez votre question sur la formation. |
| `learn.coach.form.course` | Formation |
| `learn.coach.form.lesson` | Leçon |
| `learn.coach.form.lessonAll` | Toute la formation |
| `learn.coach.form.intents` | Que voulez-vous faire ? |
| `learn.coach.form.question` | Votre question |
| `learn.coach.form.placeholder` | Ex. : je ne comprends pas la différence entre deux notions de la leçon |
| `learn.coach.form.submit` | Demander au Coach |
| `learn.coach.form.sending` | Le Coach prépare sa réponse… |
| `learn.coach.form.credit` | Réponse reformulée par Jumanly Intelligence : 1 crédit IA. |
| `learn.coach.intent.explain` | Expliquer une notion |
| `learn.coach.intent.rephrase` | Reformuler la leçon |
| `learn.coach.intent.example` | Un autre exemple |
| `learn.coach.intent.question` | Poser une question |
| `learn.coach.intent.exercise` | Un exercice en plus |
| `learn.coach.intent.mistake` | Comprendre mon erreur |
| `learn.coach.intent.revision` | Que réviser ? |
| `learn.coach.chat.aria` | Conversation avec le Coach IA |
| `learn.coach.chat.you` | Vous |
| `learn.coach.chat.coach` | Coach IA |
| `learn.coach.chat.reset` | Nouvelle conversation |
| `learn.coach.source.ai` | Réponse de Jumanly Intelligence, à partir de votre cours |
| `learn.coach.source.course` | Réponse tirée directement de votre cours |
| `learn.coach.why` | Pourquoi ? |
| `learn.coach.sources` | Leçons utilisées : {list} |
| `learn.coach.noSources` | Le Coach n'a trouvé aucune leçon qui en parle. |
| `learn.coach.limit.consent` | Activez l'IA dans vos paramètres pour des réponses reformulées par Jumanly Intelligence. |
| `learn.coach.limit.entitlement` | Les réponses reformulées par Jumanly Intelligence ne sont pas incluses dans votre forfait : le Coach répond avec les passages du cours. |
| `learn.coach.limit.quota` | Vos crédits IA du mois sont utilisés : le Coach répond avec les passages du cours. |
| `learn.coach.limit.unavailable` | Jumanly Intelligence est indisponible pour l'instant, aucun crédit n'a été utilisé : le Coach répond avec les passages du cours. |
| `learn.coach.rule` | L'IA recommande, vous décidez. Le Coach ne remplace pas la leçon et ne donne pas les réponses des évaluations. |
| `learn.coach.error.notEnrolled` | Commencez cette formation pour poser vos questions au Coach. |
| `learn.coach.error.locked` | Cette formation n'est pas ouverte avec votre forfait. |
| `learn.coach.error.notFound` | Formation introuvable. |
| `learn.coach.error.invalid` | Écrivez votre question en quelques mots. |
| `learn.coach.error.failed` | Le Coach n'a pas pu répondre. Réessayez dans un instant. |
| `learn.coach.empty.title` | Le Coach IA vous accompagne dans vos formations |
| `learn.coach.empty.body` | Commencez une formation : vous pourrez ensuite lui poser toutes vos questions. |
| `learn.coach.empty.cta` | Explorer les formations |
| `learn.coach.player.title` | Une question sur cette leçon ? |
| `learn.coach.player.body` | Le Coach IA explique, reformule ou donne un exemple à partir de ce cours. |
| `learn.coach.answer.explain` | Voici ce que dit votre cours à ce sujet : |
| `learn.coach.answer.rephrase` | En résumé, avec les mots du cours : |
| `learn.coach.answer.example` | Un exemple donné dans votre cours : |
| `learn.coach.answer.noExample` | Votre cours ne donne pas d'autre exemple sur ce point. Essayez d'appliquer la notion à une situation de votre travail ou de votre quartier, puis relisez la leçon pour vérifier. |
| `learn.coach.answer.exercise` | Exercice d'entraînement sur « {lesson} » : en trois à cinq lignes, appliquez ces points à une situation que vous connaissez, puis relisez la leçon pour vérifier votre réponse. |
| `learn.coach.answer.mistake` | Voici les questions à retravailler. Relisez le passage indiqué, puis retentez l'évaluation : |
| `learn.coach.answer.mistakeHint` | À relire dans « {lesson} » : |
| `learn.coach.answer.noMistake` | Aucune erreur à revoir dans cette formation pour l'instant. Bravo ! |
| `learn.coach.answer.revision` | Je vous conseille de revoir, dans cet ordre : |
| `learn.coach.answer.noRevision` | Rien à réviser en priorité : vous pouvez avancer vers la leçon suivante. |
| `learn.coach.answer.notCovered` | Votre cours n'aborde pas ce point. Je préfère ne rien inventer : reformulez votre question avec les mots de la leçon, ou ouvrez la leçon la plus proche. |
| `learn.coach.answer.declined` | Je ne donne pas les réponses des évaluations : elles servent à valider ce que vous avez appris. En revanche, je peux vous expliquer la notion ou vous proposer un exercice pour vous entraîner. |

### `/app/learn/[slug]` · Fiche formation (avant de commencer)

*Donner tous les éléments pour décider de commencer.*

| Clé | Texte |
|---|---|
| `learn.course.back` | Retour au catalogue |
| `learn.course.eyebrow` | Learn · Catalogue de formations |
| `learn.course.about` | À propos de cette formation |
| `learn.course.outcomes` | Ce que vous saurez faire |
| `learn.course.program` | Programme |
| `learn.course.prerequisites.text` | Prérequis |
| `learn.course.prerequisites.none` | Aucun prérequis. |
| `learn.course.level` | Niveau : {level} |
| `learn.course.duration` | Durée : {hours} h |
| `learn.course.language` | Langue : {language} |
| `learn.course.certificate` | Attestation Jumanly à la fin, ajoutée à votre profil |
| `learn.course.requiredPlan` | Forfait requis : {plan} |
| `learn.course.includedInPlan` | Inclus dans votre forfait |
| `learn.course.previewBadge` | Aperçu |
| `learn.course.instructor.text` | Formateur |
| `learn.course.instructor.courses` | {count, plural, one {# formation} other {# formations}} |
| `learn.course.start` | Commencer |
| `learn.course.resume` | Reprendre |
| `learn.course.restart` | Recommencer |
| `learn.course.enrolled` | Formation ajoutée à « Mes formations ». Bon apprentissage ! |
| `learn.course.seo` | {title} · Learn |
| `learn.course.finished` | Formation terminée. Bravo pour votre persévérance ! |
| `learn.course.viewCertificate` | Voir mon attestation |
| `learn.course.continue` | Continuer : {lessonTitle} |
| `learn.error.locked` | Cette formation n'est pas incluse dans votre forfait actuel. |
| `learn.error.notEnrolled` | Commencez la formation pour suivre cette leçon. |
| `learn.error.attempts` | Vous avez utilisé toutes les tentatives de ce quiz. |
| `learn.error.invalid` | Cette action n'est pas possible pour cette leçon. |
| `learn.error.notFound` | Cette leçon est introuvable. |

### `/app/learn/[slug]` · Lecteur

*Apprendre sans distraction, sur un petit écran et une connexion variable.*

| Clé | Texte |
|---|---|
| `learn.player.eyebrow` | Learn · Mes formations |
| `learn.player.position` | Module {module} · Leçon {lesson} |
| `learn.player.play` | Lire |
| `learn.player.pause` | Pause |
| `learn.player.rewind` | Reculer de 10 secondes |
| `learn.player.forward` | Avancer de 10 secondes |
| `learn.player.speed.text` | Vitesse |
| `learn.player.speed.value` | {speed}× |
| `learn.player.subtitles.text` | Sous-titres |
| `learn.player.subtitles.off` | Désactivés |
| `learn.player.subtitles.lang` | Sous-titres {lang} |
| `learn.player.quality.text` | Qualité |
| `learn.player.quality.auto` | Automatique |
| `learn.player.quality.low` | Économie de données |
| `learn.player.fullscreen` | Plein écran |
| `learn.player.exitFullscreen` | Quitter le plein écran |
| `learn.player.volume` | Volume |
| `learn.player.mute` | Couper le son |
| `learn.player.time` | {current} / {total} |
| `learn.player.lowBandwidth` | Connexion lente détectée. Nous passons en qualité réduite pour éviter les coupures. |
| `learn.player.resume.text` | Reprise là où vous vous étiez arrêté, à {time}. |
| `learn.player.resume.restart` | Reprendre au début |
| `learn.player.transcript` | Transcription |
| `learn.player.markComplete` | Marquer comme terminée |
| `learn.player.completed` | Leçon terminée |
| `learn.player.moduleDone.title` | Module {number} terminé, bravo {firstName} ! |
| `learn.player.moduleDone.body` | « {title} » est derrière vous. Place au module {number} : {next}. |
| `learn.player.next` | Leçon suivante |
| `learn.player.previous` | Leçon précédente |
| `learn.player.resumeAt` | Reprendre à {time} |
| `learn.player.error.text` | La vidéo ne se charge pas. Vérifiez votre connexion puis réessayez. |
| `learn.player.error.retry` | Réessayer |
| `learn.player.noVideo` | La vidéo de cette leçon n'est pas encore disponible. Les autres contenus restent accessibles. |
| `learn.player.exercise.text` | Exercice |
| `learn.player.lessonDone` | Terminée |
| `learn.player.lessonCurrent` | Leçon en cours |
| `learn.player.tab.overview` | Aperçu |
| `learn.player.tab.resources` | Ressources |
| `learn.player.tab.notes` | Notes |
| `learn.player.tab.questions` | Questions ({count}) |
| `learn.player.tab.lessons` | Leçons |
| `learn.player.overview.empty` | Pas de description pour cette leçon. |
| `learn.player.resources.download` | Télécharger |
| `learn.player.resources.meta` | {type} · {size} |
| `learn.player.resources.empty` | Aucune ressource pour cette leçon. |
| `learn.player.resources.locked` | Ressources spécialisées · Disponible avec {plan} |
| `learn.documents.title` | Documents de la formation |
| `learn.documents.lessonTitle` | Documents de la leçon |
| `learn.documents.publicTitle` | Documents à télécharger |
| `learn.documents.meta` | {kind} · {pages, plural, one {# page} other {# pages}} · {size} |
| `learn.documents.download` | Télécharger |
| `learn.documents.downloadNamed` | Télécharger « {title} » |
| `learn.documents.size.kb` | {size} Ko |
| `learn.documents.size.mb` | {size} Mo |
| `learn.documents.kind.support` | Support de cours |
| `learn.documents.kind.exercises` | Fiche d'exercices |
| `learn.documents.kind.reading` | Lecture complémentaire |
| `learn.documents.kind.template` | Modèle à remplir |
| `learn.documents.kind.answer_key` | Corrigé |
| `learn.documents.kind.other` | Autre document |
| `learn.pdf.title` | En PDF |
| `learn.pdf.programme` | Télécharger le programme |
| `learn.pdf.programmeHint` | Objectifs, modules et leçons, pour le garder ou le partager. |
| `learn.pdf.support` | Télécharger le support de cours |
| `learn.pdf.supportHint` | Toutes les leçons en un seul fichier, pour lire hors connexion. |
| `learn.pdf.doc.footer` | jumanly.io · assistant@jumanly.io · infojumanly@gmail.com |
| `learn.pdf.doc.page` | Page {page} sur {total} |
| `learn.pdf.doc.generated` | Document généré le {date, date, long} |
| `learn.pdf.doc.level.beginner` | Débutant |
| `learn.pdf.doc.level.intermediate` | Intermédiaire |
| `learn.pdf.doc.level.advanced` | Avancé |
| `learn.pdf.doc.kind.video` | Vidéo |
| `learn.pdf.doc.kind.text` | Lecture |
| `learn.pdf.doc.kind.exercise` | Exercice |
| `learn.pdf.doc.kind.quiz` | Quiz |
| `learn.pdf.doc.kind.resource` | Ressource |
| `learn.pdf.doc.minutes` | {minutes} min |
| `learn.pdf.doc.module` | Module {number} · {title} |
| `learn.pdf.doc.program.eyebrow` | Programme de formation |
| `learn.pdf.doc.program.summary` | En bref |
| `learn.pdf.doc.program.audience` | Pour qui ? |
| `learn.pdf.doc.program.prerequisites` | Prérequis |
| `learn.pdf.doc.program.prerequisitesNone` | Aucun prérequis. |
| `learn.pdf.doc.program.objectives` | Objectifs |
| `learn.pdf.doc.program.level` | Niveau |
| `learn.pdf.doc.program.duration` | Durée |
| `learn.pdf.doc.program.lessons` | Leçons |
| `learn.pdf.doc.program.lessonsValue` | {modules, plural, one {# module} other {# modules}}, {lessons, plural, one {# leçon} other {# leçons}} |
| `learn.pdf.doc.program.certificate` | Attestation |
| `learn.pdf.doc.program.certificateYes` | Attestation de réussite délivrée |
| `learn.pdf.doc.program.certificateNo` | Pas d'attestation |
| `learn.pdf.doc.program.program` | Programme |
| `learn.pdf.doc.program.skills` | Compétences validées |
| `learn.pdf.doc.program.url` | Fiche en ligne : {url} |
| `learn.pdf.doc.support.eyebrow` | Support de cours |
| `learn.pdf.doc.support.intro` | Toutes les leçons de la formation, module par module, pour lire hors connexion. |
| `learn.pdf.doc.support.transcript` | Transcription de la vidéo |
| `learn.pdf.doc.support.online` | Cette leçon se suit en ligne. |
| `learn.pdf.doc.support.quiz` | Quiz de {count, plural, one {# question} other {# questions}}, à faire en ligne. |
| `learn.pdf.doc.support.documents` | Documents de la formation |
| `learn.pdf.doc.support.documentsHint` | Téléchargez-les depuis la page de la formation, connecté à votre compte. |
| `learn.pdf.doc.quiz.eyebrow` | Quiz et corrigé · Réservé à l'équipe |
| `learn.pdf.doc.quiz.title` | Quiz · {lesson} |
| `learn.pdf.doc.quiz.rules` | Seuil de réussite : {score} % · Tentatives : {attempts} |
| `learn.pdf.doc.quiz.unlimited` | illimitées |
| `learn.pdf.doc.quiz.question` | Question {number} |
| `learn.pdf.doc.quiz.type.single` | Une seule réponse |
| `learn.pdf.doc.quiz.type.multiple` | Plusieurs réponses |
| `learn.pdf.doc.quiz.type.text` | Réponse écrite |
| `learn.pdf.doc.quiz.right` | Bonne réponse |
| `learn.pdf.doc.quiz.accepted` | Réponses acceptées : {answers} |
| `learn.pdf.doc.quiz.explanation` | Explication : {text} |
| `learn.pdf.doc.quiz.empty` | Ce quiz n'a pas encore de question. |
| `learn.pdf.doc.quiz.none` | Cette formation n'a pas encore de quiz. |
| `learn.pdf.doc.certificate.watermark` | Aperçu |
| `learn.pdf.doc.certificate.code` | JMN-APER-CU00 |
| `learn.pdf.doc.report.eyebrow` | Bilan de la formation · Réservé à l'équipe |
| `learn.pdf.doc.report.period` | Période : {period} |
| `learn.pdf.doc.report.periodAll` | depuis la création de la formation |
| `learn.pdf.doc.report.periodDays` | les {days} derniers jours |
| `learn.pdf.doc.report.privacy` | Chiffres d'ensemble : aucun nom de talent n'apparaît dans ce bilan. |
| `learn.pdf.doc.report.enrollments` | Inscriptions |
| `learn.pdf.doc.report.enrolled` | Inscrits |
| `learn.pdf.doc.report.completed` | Formation terminée |
| `learn.pdf.doc.report.inProgress` | En cours |
| `learn.pdf.doc.report.completionRate` | Taux d'achèvement |
| `learn.pdf.doc.report.percent` | {value} % |
| `learn.pdf.doc.report.stops` | Où s'arrêtent les inscrits qui n'ont pas terminé |
| `learn.pdf.doc.report.notStarted` | Pas encore commencé |
| `learn.pdf.doc.report.quizzes` | Quiz |
| `learn.pdf.doc.report.quizLine` | Moyenne {average} % · {attempts, plural, one {# tentative} other {# tentatives}} · réussite {passRate} % |
| `learn.pdf.doc.report.quizNone` | Aucune tentative sur la période. |
| `learn.pdf.doc.report.certificates` | Attestations |
| `learn.pdf.doc.report.issued` | Délivrées |
| `learn.pdf.doc.report.revoked` | Révoquées |
| `learn.pdf.doc.report.none` | Aucun quiz dans cette formation. |
| `learn.player.notes.placeholder` | Prenez des notes. Elles sont privées et liées au moment de la vidéo. |
| `learn.player.notes.add` | Ajouter une note à {time} |
| `learn.player.notes.saved` | Note enregistrée. |
| `learn.player.notes.empty` | Vos notes apparaîtront ici. Elles ne sont visibles que par vous. |
| `learn.player.notes.title` | Mes notes |
| `learn.player.notes.label` | Nouvelle note |
| `learn.player.notes.save` | Enregistrer la note |
| `learn.player.notes.delete.text` | Supprimer |
| `learn.player.notes.delete.confirm` | Supprimer cette note ? |
| `learn.player.notes.export` | Exporter mes notes |
| `learn.player.questions.ask` | Poser une question |
| `learn.player.questions.placeholder` | Votre question sur cette leçon |
| `learn.player.questions.hint` | Votre question et votre prénom sont visibles par les autres apprenants de cette formation. |
| `learn.player.questions.submit` | Publier |
| `learn.player.questions.answer` | Répondre |
| `learn.player.questions.answers` | {count, plural, =0 {Pas encore de réponse} one {# réponse} other {# réponses}} |
| `learn.player.questions.instructorAnswer` | Réponse du formateur |
| `learn.player.questions.helpful` | Utile |
| `learn.player.questions.report` | Signaler |
| `learn.player.questions.empty` | Aucune question pour l'instant. Soyez le premier à demander. |
| `learn.player.questions.posted` | Question publiée. |
| `learn.player.instructor.title` | Formateur |
| `learn.player.instructor.learners` | {count, plural, one {# apprenant} other {# apprenants}} |
| `learn.player.toc.title` | Contenu du cours |
| `learn.player.toc.progress` | {done}/{total} · {percent} % |
| `learn.player.toc.module` | Module {number} · {title} |
| `learn.player.toc.lessons` | {count, plural, one {# leçon} other {# leçons}} |
| `learn.player.toc.quiz.text` | Quiz du module |
| `learn.player.toc.quiz.questions` | {count, plural, one {# question} other {# questions}} |
| `learn.player.toc.lockedLesson` | Disponible avec {plan} |
| `learn.player.toc.certificateIn` | {count, plural, one {Attestation dans # leçon} other {Attestation dans # leçons}} |
| `learn.player.toc.certificateHint` | Ajoutée automatiquement à votre profil Career. |
| `learn.player.exercise.jobSpecific.text` | Exercice métier |
| `learn.player.exercise.jobSpecific.locked` | Exercices adaptés à votre métier · Disponible avec {plan} |
| `learn.player.exercise.jobSpecific.optional` | Facultatif : cet exercice ne compte pas dans votre progression. |
| `learn.player.exercise.jobSpecific.families` | Métiers concernés : {families} |

### `/app/learn/[slug]` · Quiz et résultats

*Vérifier les acquis avec bienveillance, et permettre de réessayer.*

| Clé | Texte |
|---|---|
| `learn.quiz.title` | Quiz · {moduleTitle} |
| `learn.quiz.eyebrow` | Learn · {courseTitle} |
| `learn.quiz.intro` | {count, plural, one {# question} other {# questions}}. Il faut {passScore} % de bonnes réponses pour valider. |
| `learn.quiz.attempts` | {count, plural, =0 {Tentatives illimitées} one {# tentative restante} other {# tentatives restantes}} |
| `learn.quiz.start` | Commencer le quiz |
| `learn.quiz.progress` | Question {current} sur {total} |
| `learn.quiz.single` | Une seule réponse |
| `learn.quiz.multiple` | Plusieurs réponses possibles |
| `learn.quiz.trueFalse.true` | Vrai |
| `learn.quiz.trueFalse.false` | Faux |
| `learn.quiz.openAnswer.placeholder` | Votre réponse |
| `learn.quiz.next` | Question suivante |
| `learn.quiz.previous` | Question précédente |
| `learn.quiz.submit` | Valider mes réponses |
| `learn.quiz.unanswered` | {count, plural, one {# question sans réponse.} other {# questions sans réponse.}} Voulez-vous quand même valider ? |
| `learn.quiz.timer` | Temps restant : {time} |
| `learn.quiz.leave.title` | Quitter le quiz ? |
| `learn.quiz.leave.body` | Vos réponses ne seront pas enregistrées. |
| `learn.quiz.leave.confirm` | Quitter |
| `learn.quiz.leave.cancel` | Continuer le quiz |
| `learn.quiz.result.title.pass` | Bravo, module validé ! |
| `learn.quiz.result.title.fail` | Presque ! Encore un effort. |
| `learn.quiz.result.score` | {correct}/{total} bonnes réponses · {percent} % |
| `learn.quiz.result.passScore` | Seuil de réussite : {passScore} % |
| `learn.quiz.result.body.pass` | Vous pouvez passer au module suivant. |
| `learn.quiz.result.body.fail` | Revoyez les leçons indiquées ci-dessous, puis réessayez quand vous êtes prêt. |
| `learn.quiz.result.review` | Revoir mes réponses |
| `learn.quiz.result.correct` | Bonne réponse |
| `learn.quiz.result.incorrect` | Réponse incorrecte |
| `learn.quiz.result.explanation` | Explication |
| `learn.quiz.result.revisit` | À revoir : {lessonTitle} |
| `learn.quiz.result.retry` | Réessayer |
| `learn.quiz.result.continue` | Continuer la formation |
| `learn.quiz.result.moduleBadge` | Module {number} validé |
| `learn.quiz.result.yourAnswer` | Votre réponse |
| `learn.quiz.result.grid` | Question par question |
| `learn.quiz.result.nextModule` | Module suivant |
| `learn.quiz.result.reviewCount` | {count, plural, one {# question} other {# questions}} |
| `learn.quiz.result.retryAfter` | Nouvelle tentative possible {time, relative} |
| `learn.quiz.noAttempts` | Vous avez utilisé toutes vos tentatives. Écrivez à assistant@jumanly.io si vous avez besoin d'aide. |
| `learn.quiz.question` | Question {number} |

### `/app/learn/attestations` · Attestations

*Valoriser l'effort et donner une preuve vérifiable aux recruteurs.*

| Clé | Texte |
|---|---|
| `learn.certificates.title` | Mes attestations |
| `learn.certificates.subtitle` | Chaque attestation est ajoutée à votre profil et peut être vérifiée par un recruteur grâce à son lien public. |
| `learn.certificates.seo` | Mes attestations |
| `learn.certificates.eyebrow` | Learn · Attestations |
| `learn.certificates.count` | {count, plural, one {# attestation} other {# attestations}} |
| `learn.certificates.preview` | Aperçu du PDF |
| `learn.certificates.publicLink.title` | Lien de vérification public |
| `learn.certificates.publicLink.body` | Seules les informations nécessaires à la vérification sont affichées : titulaire, formation, durée, date et numéro. |
| `learn.certificates.verifyLink` | Page de vérification |
| `learn.certificates.revoked` | Révoquée le {date, date, long} |
| `learn.certificates.issued` | Obtenue le {date, date, long} |
| `learn.certificates.number` | N° {code} |
| `learn.certificates.download` | Télécharger le PDF |
| `learn.certificates.copyLink` | Copier le lien de vérification |
| `learn.certificates.linkCopied` | Lien copié. |
| `learn.certificates.share` | Partager |
| `learn.certificates.addToCv` | Ajouter à mon CV |
| `learn.certificates.showOnProfile` | Afficher sur mon profil |
| `learn.certificates.empty.text` | Vous n'avez pas encore d'attestation. Terminez une formation pour obtenir la première. |
| `learn.certificates.empty.cta` | Voir mes formations |
| `learn.certificates.congrats.title` | Félicitations, {firstName} ! |
| `learn.certificates.congrats.eyebrow` | Nouvelle attestation |
| `learn.certificates.congrats.body` | Vous avez terminé « {courseTitle} ». Votre attestation est prête et déjà visible sur votre profil. |
| `learn.certificates.pdf.title` | Attestation de réussite |
| `learn.certificates.pdf.body` | Jumanly atteste que {fullName} a suivi et validé la formation « {courseTitle} » ({hours} h). |
| `learn.certificates.pdf.date` | Délivrée le {date, date, long} |
| `learn.certificates.pdf.verify` | Vérifiez l'authenticité de cette attestation sur {verifyUrl} |
| `learn.certificates.pdf.footer` | Jumanly · Learn. Grow. Connect. · Une plateforme développée par The Growth Lab |

### `/attestations/[code]` · Page publique de vérification

*Permettre à toute personne de vérifier qu'une attestation est authentique, sans exposer d'autres données.*

| Clé | Texte |
|---|---|
| `certificate.verify.title` | Vérification d'attestation |
| `certificate.verify.seo.title` | Vérification d'attestation · Jumanly |
| `certificate.verify.seo.description` | Vérifiez l'authenticité d'une attestation de formation Jumanly à partir de son numéro. |
| `certificate.verify.intro` | Saisissez le numéro inscrit sur l'attestation pour vérifier qu'elle a bien été délivrée par Jumanly. |
| `certificate.verify.valid.badge` | Attestation authentique |
| `certificate.verify.valid.body` | Cette attestation a bien été délivrée par Jumanly. |
| `certificate.verify.holder` | Titulaire |
| `certificate.verify.course` | Formation |
| `certificate.verify.duration` | Durée |
| `certificate.verify.issued` | Date de délivrance |
| `certificate.verify.code` | Numéro |
| `certificate.verify.revoked.badge` | Attestation révoquée |
| `certificate.verify.revoked.body` | Cette attestation a été délivrée puis révoquée le {date, date, long}. |
| `certificate.verify.notFound.title` | Attestation introuvable |
| `certificate.verify.notFound.body` | Vérifiez le numéro saisi. Si le doute persiste, écrivez-nous à assistant@jumanly.io. |
| `certificate.verify.form.label` | Numéro d'attestation |
| `certificate.verify.form.placeholder` | Ex. : JMN-XXXX-XXXX |
| `certificate.verify.form.submit` | Vérifier |
| `certificate.verify.privacy` | Seules les informations nécessaires à la vérification sont affichées. |
| `certificate.verify.cta` | Découvrir les formations Jumanly |

---

### `/app/career` · Accueil Career

*Rassembler les outils qui construisent l'identité professionnelle.*

| Clé | Texte |
|---|---|
| `career.home.eyebrow` | Career |
| `career.home.title` | Votre identité professionnelle |
| `career.home.subtitle` | Diagnostic, CV, documents, entretiens : tout ce qui prépare votre candidature. |
| `career.home.diagnostic.title` | Diagnostic de carrière |
| `career.home.diagnostic.desc` | Faites le point sur vos atouts et vos priorités. |
| `career.home.diagnostic.cta.start` | Commencer le diagnostic |
| `career.home.diagnostic.cta.view` | Voir mon diagnostic |
| `career.home.diagnostic.lastDone` | Dernier diagnostic : {date, date, medium} |
| `career.home.cv.title` | Mon CV |
| `career.home.cv.desc` | Éditez votre CV par sections et exportez-le en PDF. |
| `career.home.cv.cta` | Ouvrir mon CV |
| `career.home.cv.score` | Score du CV : {score}/100 |
| `career.home.documents.title` | Lettres et documents |
| `career.home.documents.desc` | Lettres de motivation, biographie, correction de textes. |
| `career.home.linkedin.title` | Préparation LinkedIn |
| `career.home.linkedin.desc` | Un titre, un résumé et des compétences prêts à copier. |
| `career.home.interviews.title` | Simulations d'entretien |
| `career.home.interviews.desc` | Entraînez-vous à l'écrit puis à l'oral, avec un retour détaillé. |
| `career.home.plan.title` | Plan de progression |
| `career.home.plan.desc` | Vos objectifs, vos étapes et les formations qui vous font avancer. |
| `career.home.plan.cta` | Ouvrir mon plan |
| `career.home.portfolio.title` | Portfolio |
| `career.home.portfolio.desc` | Montrez vos projets sur une page à partager. |
| `career.home.seo` | Career · Jumanly |
| `career.home.later` | Bientôt disponible |
| `career.home.tips.title` | Conseils de préparation |
| `career.home.tips.desc` | Des fiches pratiques pour préparer chaque étape d'un recrutement. |
| `career.home.lock` | Disponible avec {plan} |
| `career.home.quota` | {used}/{quota} ce mois |
| `career.nav.home` | Accueil Career |
| `career.nav.label` | Rubriques Career |
| `career.home.stats.cv` | Score du CV |
| `career.home.stats.cvUnit` | /100 |
| `career.home.stats.plan` | Plan |
| `career.home.stats.planUnit` | étapes |
| `career.home.stats.interviews` | Simulations |
| `career.home.stats.interviewsUnit` | ce mois |
| `career.home.stats.ratio` | {value}/{max} |
| `career.home.stats.none` | — |
| `career.home.open` | Ouvrir |
| `career.home.diagnostic.none` | Pas encore de diagnostic |
| `career.home.cv.none` | Pas encore de CV |
| `career.home.documents.count` | {count, plural, =0 {Aucun document} one {# document} other {# documents}} |
| `career.home.linkedin.last` | Propositions du {date, date, medium} |
| `career.home.linkedin.none` | Aucune proposition pour l'instant |
| `career.home.interviews.cta` | S'entraîner |
| `career.home.plan.steps` | {done}/{total} étapes |
| `career.home.plan.none` | Pas encore de plan |
| `career.home.portfolio.count` | {count, plural, =0 {Aucun projet} one {# projet} other {# projets}} |
| `career.home.portfolio.public` | page publique |
| `career.home.ai.title` | Entraînez-vous à l'oral avant votre entretien avec {organization} |
| `career.home.ai.body` | Une simulation vous fait répondre aux questions les plus fréquentes, puis vous donne un retour détaillé. |
| `career.home.ai.why` | Votre entretien a lieu le {date, date, long}. |
| `career.home.ai.left` | {count, plural, =0 {Vous avez utilisé vos simulations orales ce mois.} one {Il vous reste # simulation orale ce mois.} other {Il vous reste # simulations orales ce mois.}} |
| `career.home.ai.start` | Démarrer la simulation |
| `career.home.heroTitle` | Votre identité professionnelle, étape par étape |
| `career.home.heroTitleAccent` | professionnelle |
| `career.home.heroLead` | Faites le point, construisez un CV solide, préparez vos candidatures et entraînez-vous. Jumanly vous indique toujours la prochaine étape. |
| `career.home.journey.title` | Votre parcours Career |
| `career.home.journey.count` | {done, plural, =0 {Aucune étape terminée sur 4} one {# étape terminée sur 4} other {# étapes terminées sur 4}} |
| `career.home.journey.step.point` | Faire le point |
| `career.home.journey.step.cv` | Construire mon CV |
| `career.home.journey.step.apply` | Préparer mes candidatures |
| `career.home.journey.step.train` | M'entraîner |
| `career.home.journey.state.done` | Terminée |
| `career.home.journey.state.current` | En cours |
| `career.home.journey.state.next` | À venir |
| `career.home.journey.continue` | Continuer |
| `career.home.journey.finished` | Parcours terminé |
| `career.home.float.cv` | Score du CV |
| `career.home.float.cvSub` | {score}/100 · {band} |
| `career.home.float.diagnostic` | Diagnostic fait |
| `career.home.float.diagnosticSub` | le {date, date, medium} |
| `career.home.float.next` | Prochaine étape |
| `career.home.group.point.title` | Faire le point |
| `career.home.group.point.lead` | Savoir où vous en êtes et où vous allez |
| `career.home.group.apply.title` | Préparer mes candidatures |
| `career.home.group.apply.lead` | Les documents que les recruteurs liront |
| `career.home.group.train.title` | M'entraîner |
| `career.home.group.train.lead` | Arriver prêt le jour de l'entretien |
| `career.home.badge.included` | Inclus |
| `career.home.diagnostic.descV2` | Un bilan en 6 dimensions : clarté du projet, compétences, expérience, outils de candidature, entretiens et réseau. Chaque note est expliquée. |
| `career.home.cv.descV2` | Éditez votre CV par sections, choisissez un modèle et exportez-le en PDF. Le score vous dit quoi améliorer en premier. |
| `career.home.cv.chip.templates` | Modèles |
| `career.home.cv.chip.pdf` | Export PDF |
| `career.home.cv.chip.score` | Score expliqué |
| `career.home.plan.fromDiagnostic` | Créé à partir de votre diagnostic |
| `career.home.plan.create` | Créer mon plan |
| `career.home.locked.with` | Avec {plan} |
| `career.home.locked.withPrice` | Avec {plan} · {price} USD/mois |
| `career.home.locked.cta` | Débloquer |
| `career.home.tips.soon` | Arrive prochainement |
| `career.home.tips.ready` | {count, plural, one {# fiche à lire} other {# fiches à lire}} |
| `career.home.interviews.question` | « Présentez-vous en deux minutes. » |
| `career.home.upgrade.eyebrow` | Formule {plan} |
| `career.home.upgrade.title` | {count, plural, one {Débloquez un outil pour candidater mieux} other {Débloquez # outils pour candidater mieux}} |
| `career.home.upgrade.price` | {price} USD |
| `career.home.upgrade.period` | par mois · Mobile Money ou carte |
| `career.home.upgrade.cta` | Voir les formules |
| `career.nav.locked` | (outil verrouillé) |

#### Conseils généraux (Free, contenu statique)

| Clé | Texte |
|---|---|
| `career.tips.title` | Conseils de préparation |
| `career.tips.cv` | Réussir son CV en une page |
| `career.tips.letter` | Écrire une lettre courte et utile |
| `career.tips.interview` | Les 10 questions d'entretien les plus fréquentes |
| `career.tips.salary` | Parler de salaire sereinement |
| `career.tips.firstJob` | Chercher un premier emploi sans expérience |
| `career.tips.network` | Développer son réseau professionnel |
| `career.tips.readTime` | {minutes} min de lecture |
| `career.tips.eyebrow` | Career · Conseils de préparation |
| `career.tips.intro` | Des fiches pratiques et gratuites pour préparer chaque étape d'un recrutement. |
| `career.tips.empty` | Aucune fiche n'est publiée pour l'instant. |
| `career.tips.back` | Retour à Career |

### `/app/career/diagnostic` · Diagnostic de carrière

*Un questionnaire court qui aide à choisir la suite. Simplifié (règles, sans IA) pour Free ; personnalisé (IA) à partir de Starter.*

#### Introduction et déroulé

| Clé | Texte |
|---|---|
| `career.diagnostic.title` | Diagnostic de carrière |
| `career.diagnostic.eyebrow` | Career · Diagnostic de carrière |
| `career.diagnostic.intro.simple` | Six dimensions, 6 à 8 minutes. Votre bilan est calculé par des règles fixes, expliquées point par point. |
| `career.diagnostic.intro.personalized` | Six dimensions, quatre questions de plus et deux questions de relance, 8 à 10 minutes. Jumanly Intelligence explique vos résultats et propose des pistes ; les notes restent calculées par des règles fixes. |
| `career.diagnostic.badge.simple` | Diagnostic simplifié |
| `career.diagnostic.badge.personalized` | Diagnostic personnalisé |
| `career.diagnostic.upsell` | Le diagnostic personnalisé est disponible avec {plan}. |
| `career.diagnostic.start` | Commencer |
| `career.diagnostic.resume` | Reprendre là où je m'étais arrêté |
| `career.diagnostic.restart` | Refaire le diagnostic |
| `career.diagnostic.progress` | Question {current} sur {total} |
| `career.diagnostic.section` | Partie {current} sur {total} · {name} |
| `career.diagnostic.next` | Suivant |
| `career.diagnostic.previous` | Précédent |
| `career.diagnostic.skip` | Passer cette question |
| `career.diagnostic.finish` | Voir mon bilan |
| `career.diagnostic.saved` | Vos réponses sont enregistrées au fur et à mesure. |
| `career.diagnostic.required` | Choisissez au moins une réponse pour continuer. |
| `career.diagnostic.analyzing` | Analyse de vos réponses… |
| `career.diagnostic.privacy` | Vos réponses restent privées. Elles ne sont jamais montrées aux recruteurs. |
| `career.diagnostic.seo` | Diagnostic de carrière · Jumanly |
| `career.diagnostic.error` | Répondez à chaque question (le métier visé et les compétences sont facultatifs). |

#### Questions (communes aux deux versions)

| Clé | Texte |
|---|---|
| `career.diagnostic.part.situation` | Votre situation |
| `career.diagnostic.part.goals` | Vos objectifs |
| `career.diagnostic.part.skills` | Vos compétences |
| `career.diagnostic.part.search` | Votre recherche |
| `career.diagnostic.part.more` | Pour aller plus loin |
| `career.diagnostic.q.situation.text` | Quelle est votre situation actuelle ? |
| `career.diagnostic.q.situation.a1` | Étudiant |
| `career.diagnostic.q.situation.a2` | Jeune diplômé |
| `career.diagnostic.q.situation.a3` | En recherche d'emploi |
| `career.diagnostic.q.situation.a4` | En poste, je veux évoluer |
| `career.diagnostic.q.situation.a5` | En poste, je veux changer de métier |
| `career.diagnostic.q.situation.a6` | Entrepreneur ou indépendant |
| `career.diagnostic.q.experience.text` | Combien d'années d'expérience professionnelle avez-vous (stages compris) ? |
| `career.diagnostic.q.experience.a1` | Aucune |
| `career.diagnostic.q.experience.a2` | Moins d'un an |
| `career.diagnostic.q.experience.a3` | 1 à 3 ans |
| `career.diagnostic.q.experience.a4` | 3 à 5 ans |
| `career.diagnostic.q.experience.a5` | Plus de 5 ans |
| `career.diagnostic.q.education` | Quel est votre plus haut niveau d'études ? |
| `career.diagnostic.q.goal.text` | Quel est votre objectif principal pour les six prochains mois ? |
| `career.diagnostic.q.goal.a1` | Trouver un premier emploi |
| `career.diagnostic.q.goal.a2` | Trouver un stage |
| `career.diagnostic.q.goal.a3` | Changer d'emploi |
| `career.diagnostic.q.goal.a4` | Obtenir une promotion |
| `career.diagnostic.q.goal.a5` | Me reconvertir |
| `career.diagnostic.q.goal.a6` | Lancer ou développer mon activité |
| `career.diagnostic.q.targetRole.text` | Quel métier visez-vous ? |
| `career.diagnostic.q.targetRole.placeholder` | Ex. : Comptable, développeur web, chargé de communication |
| `career.diagnostic.q.targetRole.unsure` | Je ne sais pas encore |
| `career.diagnostic.q.targetRole.hint` | Laissez vide si vous ne savez pas encore. |
| `career.diagnostic.q.topSkillsPlaceholder` | Ex. : Excel, rédaction, service client |
| `career.diagnostic.q.topSkillsHint` | Séparez-les par des virgules. Facultatif. |
| `career.diagnostic.q.sector` | Quels secteurs vous attirent ? (plusieurs choix) |
| `career.diagnostic.q.topSkills` | Quelles sont vos trois compétences les plus solides ? |
| `career.diagnostic.q.skillsToBuild` | Quelles compétences aimeriez-vous développer ? |
| `career.diagnostic.q.confidence.text` | Sur une échelle de 1 à 5, à quel point vous sentez-vous prêt pour un entretien ? |
| `career.diagnostic.q.confidence.min` | Pas prêt |
| `career.diagnostic.q.confidence.max` | Tout à fait prêt |
| `career.diagnostic.q.cvStatus.text` | Où en est votre CV ? |
| `career.diagnostic.q.cvStatus.a1` | Je n'en ai pas |
| `career.diagnostic.q.cvStatus.a2` | J'en ai un, mais il n'est pas à jour |
| `career.diagnostic.q.cvStatus.a3` | Il est à jour |
| `career.diagnostic.q.applications.text` | Combien de candidatures avez-vous envoyées le mois dernier ? |
| `career.diagnostic.q.applications.a1` | Aucune |
| `career.diagnostic.q.applications.a2` | 1 à 5 |
| `career.diagnostic.q.applications.a3` | 6 à 15 |
| `career.diagnostic.q.applications.a4` | Plus de 15 |
| `career.diagnostic.q.obstacle.text` | Qu'est-ce qui vous freine le plus aujourd'hui ? |
| `career.diagnostic.q.obstacle.a1` | Je ne sais pas quel métier choisir |
| `career.diagnostic.q.obstacle.a2` | Il me manque des compétences |
| `career.diagnostic.q.obstacle.a3` | Mon CV ne donne pas de réponses |
| `career.diagnostic.q.obstacle.a4` | Je suis mal à l'aise en entretien |
| `career.diagnostic.q.obstacle.a5` | Je ne trouve pas d'offres adaptées |
| `career.diagnostic.q.obstacle.a6` | Je manque de réseau |
| `career.diagnostic.q.time.text` | Combien de temps pouvez-vous consacrer chaque semaine à votre progression ? |
| `career.diagnostic.q.time.a1` | Moins d'une heure |
| `career.diagnostic.q.time.a2` | 1 à 3 heures |
| `career.diagnostic.q.time.a3` | 3 à 6 heures |
| `career.diagnostic.q.time.a4` | Plus de 6 heures |
| `career.diagnostic.q.workMode.text` | Quel mode de travail préférez-vous ? |
| `career.diagnostic.q.mobility.text` | Êtes-vous prêt à changer de ville ou de pays ? |
| `career.diagnostic.q.mobility.a1` | Non |
| `career.diagnostic.q.mobility.a2` | Dans mon pays |
| `career.diagnostic.q.mobility.a3` | Dans ma région |
| `career.diagnostic.q.mobility.a4` | Partout |

#### Questions supplémentaires (diagnostic personnalisé)

| Clé | Texte |
|---|---|
| `career.diagnostic.q.achievement.text` | Décrivez en quelques lignes une réalisation dont vous êtes fier. |
| `career.diagnostic.q.achievement.placeholder` | Le contexte, ce que vous avez fait, le résultat. |
| `career.diagnostic.q.values.text` | Qu'est-ce qui compte le plus pour vous dans un emploi ? (trois choix) |
| `career.diagnostic.q.values.a1` | Apprendre |
| `career.diagnostic.q.values.a2` | La rémunération |
| `career.diagnostic.q.values.a3` | La stabilité |
| `career.diagnostic.q.values.a4` | L'impact social |
| `career.diagnostic.q.values.a5` | L'autonomie |
| `career.diagnostic.q.values.a6` | L'équilibre vie professionnelle et personnelle |
| `career.diagnostic.q.values.a7` | Les responsabilités |
| `career.diagnostic.q.workStyle.text` | Vous travaillez plutôt… |
| `career.diagnostic.q.workStyle.a1` | Seul, en autonomie |
| `career.diagnostic.q.workStyle.a2` | En équipe |
| `career.diagnostic.q.workStyle.a3` | Les deux me conviennent |
| `career.diagnostic.q.feedback` | Quel retour avez-vous reçu le plus souvent de vos responsables ou enseignants ? |
| `career.diagnostic.q.languages` | Dans quelles langues pouvez-vous travailler ? |
| `career.diagnostic.q.digital` | Quels outils numériques utilisez-vous avec aisance ? |
| `career.diagnostic.q.horizon` | Où vous voyez-vous dans trois ans ? |
| `career.diagnostic.q.useProfile` | Utiliser mon profil et mon CV pour affiner le bilan |

#### Résultat

| Clé | Texte |
|---|---|
| `career.diagnostic.result.title` | Votre bilan de carrière |
| `career.diagnostic.result.date` | Établi le {date, date, long} |
| `career.diagnostic.result.questions` | {count} questions |
| `career.diagnostic.result.exploreJobs` | Voir les offres |
| `career.diagnostic.result.strengths` | Vos atouts |
| `career.diagnostic.result.priorities` | Vos priorités |
| `career.diagnostic.result.readiness.text` | Votre niveau de préparation |
| `career.diagnostic.result.readiness.low` | À construire |
| `career.diagnostic.result.readiness.medium` | En bonne voie |
| `career.diagnostic.result.readiness.high` | Prêt à candidater |
| `career.diagnostic.result.roles` | Métiers à explorer |
| `career.diagnostic.result.nextSteps` | Vos trois prochaines étapes |
| `career.diagnostic.result.courses` | Formations conseillées |
| `career.diagnostic.result.createPlan` | Créer mon plan de progression |
| `career.diagnostic.result.download` | Télécharger le bilan (PDF) |
| `career.diagnostic.result.simple.note` | Ce bilan est établi à partir de vos réponses, selon des règles fixes. |
| `career.diagnostic.result.personalized.note` | Bilan généré par l'IA à partir de vos réponses et de votre profil. Vérifiez-le : vous restez le meilleur juge de votre parcours. |
| `career.diagnostic.result.history` | Diagnostics précédents |
| `career.diagnostic.result.namedSkills` | Les compétences que vous citez : {skills} |
| `career.diagnostic.result.rolesEmpty` | Vous n'avez pas encore de métier précis en tête. Les offres et les formations peuvent vous donner des idées. |
| `career.diagnostic.rule.strength.experience` | Une expérience professionnelle sur laquelle vous appuyer |
| `career.diagnostic.rule.strength.education` | Un niveau d'études supérieur |
| `career.diagnostic.rule.strength.availability` | Du temps à consacrer chaque semaine à votre progression |
| `career.diagnostic.rule.strength.mobility` | Une ouverture à la mobilité |
| `career.diagnostic.rule.strength.interview` | De l'assurance en entretien |
| `career.diagnostic.rule.strength.applications` | Une recherche déjà active |
| `career.diagnostic.rule.strength.none` | Vos atouts se préciseront en complétant votre profil. Chaque expérience compte, même courte. |
| `career.diagnostic.rule.priority.role` | Choisir un métier cible |
| `career.diagnostic.rule.priority.skills` | Renforcer les compétences demandées dans vos offres cibles |
| `career.diagnostic.rule.priority.cv` | Mettre votre CV à jour |
| `career.diagnostic.rule.priority.interview` | Vous préparer aux entretiens |
| `career.diagnostic.rule.priority.search` | Trouver des offres adaptées et candidater régulièrement |
| `career.diagnostic.rule.priority.network` | Développer votre réseau professionnel |
| `career.diagnostic.rule.step.profile` | Compléter votre profil professionnel |
| `career.diagnostic.rule.step.cv` | Créer ou mettre à jour votre CV |
| `career.diagnostic.rule.step.skills` | Suivre une formation sur une compétence demandée |
| `career.diagnostic.rule.step.interview` | Préparer vos réponses aux questions d'entretien fréquentes |
| `career.diagnostic.rule.step.jobs` | Enregistrer cinq offres qui vous intéressent et postuler |
| `career.diagnostic.rule.step.network` | Rendre votre profil visible des recruteurs |
| `career.diagnostic.rule.step.role` | Lister trois métiers qui vous attirent, puis refaire le diagnostic |
| `career.diagnostic.rule.step.cta` | Y aller |

#### Diagnostic en 6 dimensions : accueil, questions, scan, résultat (barème `diagnostic_scoring_v2`)

*Brief docs/experience-animee § 5. Une question par écran, le radar se dessine pendant les réponses, le scan coche les étapes réelles, le résultat donne une note sur 100 par dimension et un niveau sur 4 stades.*

| Clé | Texte |
|---|---|
| `career.diagnostic.welcome.title` | Où en êtes-vous vraiment ? |
| `career.diagnostic.welcome.titleAgain` | Refaites le point |
| `career.diagnostic.welcome.tagline` | {duration}, une question à la fois. Vos réponses restent privées. |
| `career.diagnostic.welcome.text` | Six dimensions, une question à la fois. Vous voyez votre profil se dessiner pendant que vous répondez, puis vous recevez un bilan expliqué point par point. |
| `career.diagnostic.welcome.duration` | 6 à 8 minutes |
| `career.diagnostic.welcome.launch` | Lancer mon diagnostic |
| `career.diagnostic.welcome.resume` | Reprendre mon diagnostic, étape {current} sur {total} |
| `career.diagnostic.welcome.restart` | Recommencer à zéro |
| `career.diagnostic.welcome.prefillHint` | Métier visé, compétences, langues, études et CV déjà remplis : vous pouvez tout modifier. |
| `career.diagnostic.welcome.hook.dimensions` | 6 dimensions |
| `career.diagnostic.welcome.hook.dimensionsText` | Projet, compétences, expérience, outils, entretiens, recherche. |
| `career.diagnostic.welcome.hook.steps` | Une question à la fois |
| `career.diagnostic.welcome.hook.stepsText` | Votre profil se dessine pendant que vous répondez. |
| `career.diagnostic.welcome.hook.explained` | Un bilan expliqué |
| `career.diagnostic.welcome.hook.explainedText` | Une note sur 100 et vos priorités, point par point. |
| `career.diagnostic.welcome.plans` | Voir les formules |
| `career.diagnostic.welcome.ai.simple` | Chaque note est calculée par des règles fixes et expliquée. |
| `career.diagnostic.welcome.ai.personalized` | Jumanly Intelligence explique vos résultats et vous propose des pistes. |
| `career.diagnostic.last.title` | Votre dernier bilan |
| `career.diagnostic.last.headerCta` | Revoir mon dernier bilan |
| `career.diagnostic.last.date` | Fait le {date} |
| `career.diagnostic.last.score` | {score} sur 100 |
| `career.diagnostic.last.up` | +{points} points depuis le {date} |
| `career.diagnostic.last.down` | {points} points depuis le {date} |
| `career.diagnostic.last.same` | Stable depuis le {date} |
| `career.diagnostic.last.first` | Votre premier bilan : refaites-le dans un mois pour mesurer vos progrès. |
| `career.diagnostic.last.open` | Voir mon bilan complet |
| `career.diagnostic.welcome.constellation` | Les six dimensions de votre bilan |
| `career.diagnostic.welcome.noscript` | Sans JavaScript, toutes les questions s'affichent sur une seule page. |
| `career.diagnostic.card.label` | Votre carte professionnelle |
| `career.diagnostic.card.noTarget` | Métier visé à préciser |
| `career.diagnostic.card.skills` | {count, plural, =0 {Aucune compétence déclarée} one {# compétence déclarée} other {# compétences déclarées}} |
| `career.diagnostic.step.label` | Étape {current} sur {total} · {name} |
| `career.diagnostic.step.trail` | Les six étapes du diagnostic |
| `career.diagnostic.step.done` | terminée |
| `career.diagnostic.step.current` | en cours |
| `career.diagnostic.analyze` | Terminer et lancer l'analyse |
| `career.diagnostic.prefilled` | Pré-rempli depuis votre profil. Modifiez si besoin. |
| `career.diagnostic.cvScore` | Votre CV sur Jumanly a un score de {score} sur 100. |
| `career.diagnostic.savedAt` | Réponse enregistrée |
| `career.diagnostic.dimension.clarity.name` | Clarté du projet |
| `career.diagnostic.dimension.skills.name` | Compétences |
| `career.diagnostic.dimension.experience.name` | Expérience |
| `career.diagnostic.dimension.tools.name` | Outils de candidature |
| `career.diagnostic.dimension.interviews.name` | Préparation aux entretiens |
| `career.diagnostic.dimension.search.name` | Recherche active et réseau |
| `career.diagnostic.dimension.clarity.short` | Projet |
| `career.diagnostic.dimension.skills.short` | Compétences |
| `career.diagnostic.dimension.experience.short` | Expérience |
| `career.diagnostic.dimension.tools.short` | Outils |
| `career.diagnostic.dimension.interviews.short` | Entretiens |
| `career.diagnostic.dimension.search.short` | Recherche |
| `career.diagnostic.dimension.clarity.finding.low` | Votre projet reste à préciser : choisir un métier cible rendra chaque autre effort plus utile. |
| `career.diagnostic.dimension.clarity.finding.mid` | Vous avez une direction. Connaître le métier et ses recruteurs de plus près la rendra solide. |
| `career.diagnostic.dimension.clarity.finding.high` | Vous savez où vous allez et qui recrute pour ce métier. |
| `career.diagnostic.dimension.skills.finding.low` | Les compétences demandées pour votre cible sont encore à construire ou à prouver. |
| `career.diagnostic.dimension.skills.finding.mid` | Vous avez des bases. Une preuve (attestation, projet) pour chaque compétence fera la différence. |
| `career.diagnostic.dimension.skills.finding.high` | Vos compétences correspondent à ce que demandent les offres, avec des preuves à l'appui. |
| `career.diagnostic.dimension.experience.finding.low` | Votre expérience est encore courte : stages, projets et engagements comptent, montrez-les. |
| `career.diagnostic.dimension.experience.finding.mid` | Vous avez de l'expérience. Des résultats chiffrés la rendront plus convaincante. |
| `career.diagnostic.dimension.experience.finding.high` | Votre expérience est solide et vous savez la décrire avec des résultats. |
| `career.diagnostic.dimension.tools.finding.low` | Vos outils de candidature sont à créer : un CV à jour est la première étape. |
| `career.diagnostic.dimension.tools.finding.mid` | Vos outils existent. Les mettre à jour et les adapter à chaque offre augmentera vos réponses. |
| `career.diagnostic.dimension.tools.finding.high` | CV, lettre et profil en ligne sont prêts à être envoyés. |
| `career.diagnostic.dimension.interviews.finding.low` | Les entretiens sont votre chantier principal : entraînez-vous à présenter votre parcours. |
| `career.diagnostic.dimension.interviews.finding.mid` | Vous êtes à l'aise par moments. Quelques simulations vous donneront de l'assurance. |
| `career.diagnostic.dimension.interviews.finding.high` | Vous êtes prêt pour le jour J. |
| `career.diagnostic.dimension.search.finding.low` | Votre recherche est peu active : un rythme régulier et quelques contacts changeront la donne. |
| `career.diagnostic.dimension.search.finding.mid` | Vous cherchez régulièrement. Élargir votre réseau multipliera les occasions. |
| `career.diagnostic.dimension.search.finding.high` | Vous êtes visible et régulier dans votre recherche. |
| `career.diagnostic.dimension.clarity.action` | Explorer les offres |
| `career.diagnostic.dimension.skills.action` | Voir les formations |
| `career.diagnostic.dimension.experience.action` | Ajouter un projet à mon portfolio |
| `career.diagnostic.dimension.tools.action` | Améliorer mon CV |
| `career.diagnostic.dimension.interviews.action` | M'entraîner à l'entretien |
| `career.diagnostic.dimension.search.action` | Voir les offres |
| `career.diagnostic.dimension.whyIntro` | Les réponses qui ont compté, selon le barème fixe : |
| `career.diagnostic.dimension.points` | {points} sur {max} |
| `career.diagnostic.dimension.score` | {score} sur 100 |
| `career.diagnostic.dimension.reason.targetRole` | Métier visé renseigné |
| `career.diagnostic.dimension.reason.familiarity` | Connaissance du métier |
| `career.diagnostic.dimension.reason.companies` | Entreprises qui recrutent, connues |
| `career.diagnostic.dimension.reason.sectors` | Secteurs choisis |
| `career.diagnostic.dimension.reason.obstacle` | Frein principal autre que le choix du métier |
| `career.diagnostic.dimension.reason.skillLevels` | Niveau dans les compétences demandées |
| `career.diagnostic.dimension.reason.skillProofs` | Preuves de ces compétences |
| `career.diagnostic.dimension.reason.topSkills` | Compétences solides citées |
| `career.diagnostic.dimension.reason.languages` | Langues de travail |
| `career.diagnostic.dimension.reason.digital` | Outils numériques |
| `career.diagnostic.dimension.reason.experience` | Années d'expérience |
| `career.diagnostic.dimension.reason.education` | Niveau d'études |
| `career.diagnostic.dimension.reason.quantified` | Résultats chiffrés |
| `career.diagnostic.dimension.reason.achievement` | Réalisation décrite |
| `career.diagnostic.dimension.reason.cvStatus` | État du CV |
| `career.diagnostic.dimension.reason.coverLetter` | Lettre de motivation |
| `career.diagnostic.dimension.reason.onlineProfile` | Profil en ligne |
| `career.diagnostic.dimension.reason.confidence` | Confiance en entretien |
| `career.diagnostic.dimension.reason.interviews` | Entretiens passés |
| `career.diagnostic.dimension.reason.pitch` | Présentation de votre parcours |
| `career.diagnostic.dimension.reason.applications` | Candidatures du mois dernier |
| `career.diagnostic.dimension.reason.time` | Temps disponible chaque semaine |
| `career.diagnostic.dimension.reason.contacts` | Professionnels à contacter |
| `career.diagnostic.q.sectors.text` | Quels secteurs vous attirent ? |
| `career.diagnostic.q.sectors.placeholder` | Ex. : Banque, santé, numérique |
| `career.diagnostic.q.familiarity.text` | À quel point ce métier vous est-il familier ? |
| `career.diagnostic.q.familiarity.a1` | Je l'exerce |
| `career.diagnostic.q.familiarity.a2` | Je l'ai découvert en stage |
| `career.diagnostic.q.familiarity.a3` | J'en ai entendu parler |
| `career.diagnostic.q.familiarity.a4` | Je le découvre |
| `career.diagnostic.q.companies.text` | Connaissez-vous trois entreprises qui recrutent pour ce métier près de chez vous ? |
| `career.diagnostic.q.companies.a1` | Oui, trois ou plus |
| `career.diagnostic.q.companies.a2` | Une ou deux |
| `career.diagnostic.q.companies.a3` | Pas encore |
| `career.diagnostic.q.skillsToBuildPlaceholder` | Ex. : Power BI, prise de parole, anglais |
| `career.diagnostic.q.languagesPlaceholder` | Ex. : Français, anglais, lingala |
| `career.diagnostic.q.digitalPlaceholder` | Ex. : Excel, Canva, Google Drive |
| `career.diagnostic.q.skillLevel.text` | Votre niveau en {skill} ? |
| `career.diagnostic.q.skillLevel.source.role` | L'une des compétences les plus demandées dans les offres publiées pour ce métier ({count, plural, one {# offre} other {# offres}}). |
| `career.diagnostic.q.skillLevel.source.all` | L'une des compétences les plus demandées dans les offres publiées sur Jumanly ({count, plural, one {# offre} other {# offres}}). |
| `career.diagnostic.q.skillLevel.source.own` | Une compétence que vous avez citée. |
| `career.diagnostic.q.skillLevel.l1` | Notions |
| `career.diagnostic.q.skillLevel.l2` | Intermédiaire |
| `career.diagnostic.q.skillLevel.l3` | Avancé |
| `career.diagnostic.q.skillLevel.l4` | Expert |
| `career.diagnostic.q.skillLevel.l1Hint` | Je connais les bases |
| `career.diagnostic.q.skillLevel.l2Hint` | Je l'utilise avec un peu d'aide |
| `career.diagnostic.q.skillLevel.l3Hint` | Je l'utilise seul, au quotidien |
| `career.diagnostic.q.skillLevel.l4Hint` | Je pourrais l'enseigner |
| `career.diagnostic.q.skillProof.text` | Pouvez-vous le prouver ? |
| `career.diagnostic.q.skillProof.a1` | Oui, avec une attestation ou un certificat |
| `career.diagnostic.q.skillProof.a2` | Oui, avec un projet |
| `career.diagnostic.q.skillProof.a3` | Oui, par mon expérience |
| `career.diagnostic.q.skillProof.a4` | Rien encore |
| `career.diagnostic.q.quantified.text` | Avez-vous déjà travaillé avec des résultats chiffrés (ventes, délais, nombre de clients…) ? |
| `career.diagnostic.q.quantified.a1` | Oui, souvent |
| `career.diagnostic.q.quantified.a2` | Parfois |
| `career.diagnostic.q.quantified.a3` | Pas encore |
| `career.diagnostic.q.coverLetter.text` | Avez-vous une lettre de motivation que vous pouvez adapter à chaque offre ? |
| `career.diagnostic.q.coverLetter.a1` | Oui, prête à adapter |
| `career.diagnostic.q.coverLetter.a2` | J'en ai une, mais elle reste générale |
| `career.diagnostic.q.coverLetter.a3` | Pas encore |
| `career.diagnostic.q.onlineProfile.text` | Votre profil LinkedIn ou votre profil en ligne est-il à jour ? |
| `career.diagnostic.q.onlineProfile.a1` | Oui, il est à jour |
| `career.diagnostic.q.onlineProfile.a2` | Il existe, mais il n'est pas à jour |
| `career.diagnostic.q.onlineProfile.a3` | Je n'en ai pas |
| `career.diagnostic.q.interviews.text` | Combien d'entretiens d'embauche avez-vous passés ces 6 derniers mois ? |
| `career.diagnostic.q.interviews.a1` | Aucun |
| `career.diagnostic.q.interviews.a2` | 1 ou 2 |
| `career.diagnostic.q.interviews.a3` | 3 à 5 |
| `career.diagnostic.q.interviews.a4` | Plus de 5 |
| `career.diagnostic.q.pitch.text` | Savez-vous présenter votre parcours en 2 minutes ? |
| `career.diagnostic.q.pitch.a1` | Oui |
| `career.diagnostic.q.pitch.a2` | À peu près |
| `career.diagnostic.q.pitch.a3` | Non |
| `career.diagnostic.q.workMode.a1` | Sur site |
| `career.diagnostic.q.workMode.a2` | Hybride |
| `career.diagnostic.q.workMode.a3` | Télétravail |
| `career.diagnostic.q.workMode.a4` | Peu importe |
| `career.diagnostic.q.contacts.text` | Combien de professionnels de votre domaine pourriez-vous contacter cette semaine ? |
| `career.diagnostic.q.contacts.a1` | Aucun |
| `career.diagnostic.q.contacts.a2` | 1 ou 2 |
| `career.diagnostic.q.contacts.a3` | 3 à 5 |
| `career.diagnostic.q.contacts.a4` | Plus de 5 |
| `career.diagnostic.radar.live` | Votre profil se dessine |
| `career.diagnostic.radar.liveHint` | Chaque réponse fait grandir l'axe concerné. Notes provisoires, calculées par des règles fixes. |
| `career.diagnostic.radar.caption` | Notes par dimension, sur 100 |
| `career.diagnostic.radar.dimension` | Dimension |
| `career.diagnostic.radar.score` | Note |
| `career.diagnostic.radar.delta` | Évolution |
| `career.diagnostic.radar.current` | Ce diagnostic |
| `career.diagnostic.radar.previous` | Diagnostic précédent (pointillés) |
| `career.diagnostic.scan.title` | Analyse de votre diagnostic |
| `career.diagnostic.scan.answers` | Lecture de vos réponses |
| `career.diagnostic.scan.profile` | Lecture de votre profil et de votre CV |
| `career.diagnostic.scan.offers` | Comparaison avec les offres de votre métier |
| `career.diagnostic.scan.offersRole` | Comparaison avec les offres de votre métier ({count, plural, =0 {aucune offre publiée} one {# offre} other {# offres}}) |
| `career.diagnostic.scan.offersAll` | Comparaison avec les offres publiées sur Jumanly ({count, plural, =0 {aucune offre publiée} one {# offre} other {# offres}}) |
| `career.diagnostic.scan.dimensions` | Calcul de vos 6 dimensions |
| `career.diagnostic.scan.priorities` | Préparation de vos priorités |
| `career.diagnostic.scan.ai` | Rédaction de votre synthèse par Jumanly Intelligence |
| `career.diagnostic.followUp.badge` | Question de relance {current} sur {total} · Jumanly Intelligence |
| `career.diagnostic.followUp.hint` | Jumanly Intelligence vous pose cette question à partir de vos réponses. Elle est facultative et ne change pas vos notes. |
| `career.diagnostic.followUp.loading` | Jumanly Intelligence prépare deux questions de relance… |
| `career.diagnostic.followUp.rule.achievementResult` | Quel a été le résultat concret de la réalisation que vous avez décrite : un chiffre, un délai, un retour reçu ? |
| `career.diagnostic.followUp.rule.achievementStory` | Racontez une situation où vous avez réglé un problème, au travail ou en formation : qu'avez-vous fait, et avec quel résultat ? |
| `career.diagnostic.followUp.rule.energy` | Quelles tâches vous donnent le plus d'énergie, même si vous ne savez pas encore quel métier les propose ? |
| `career.diagnostic.followUp.rule.obstacleTried` | Qu'avez-vous déjà essayé face à ce qui vous freine, et qu'est-ce qui a bloqué ? |
| `career.diagnostic.followUp.rule.skillProof` | Comment pourriez-vous montrer votre niveau en {skill} à un recruteur dans les prochaines semaines ? |
| `career.diagnostic.followUp.rule.pitch` | Si vous deviez présenter votre parcours en deux phrases, que diriez-vous ? |
| `career.diagnostic.followUp.rule.nextJob` | Qu'attendez-vous en priorité de votre prochain poste ? |
| `career.diagnostic.followUp.rule.proudSkill` | Quelle compétence vos collègues ou vos formateurs vous reconnaissent-ils le plus ? |
| `career.diagnostic.miniPlan.title` | Votre mini plan gratuit |
| `career.diagnostic.miniPlan.intro` | Trois actions gratuites pour cette semaine, choisies par Jumanly Intelligence à partir de vos priorités. |
| `career.diagnostic.miniPlan.free` | Gratuit |
| `career.diagnostic.miniPlan.why` | chaque action répond à l'une de vos trois priorités, qui sont vos dimensions les plus basses. |
| `career.diagnostic.miniPlan.step.role.title` | Choisir une piste de métier |
| `career.diagnostic.miniPlan.step.role.text` | Ouvrez cinq offres qui vous attirent et notez les compétences qui reviennent le plus souvent. |
| `career.diagnostic.miniPlan.step.skills.title` | Renforcer une compétence demandée |
| `career.diagnostic.miniPlan.step.skills.text` | Suivez une formation gratuite sur une compétence demandée dans vos offres cibles. |
| `career.diagnostic.miniPlan.step.experience.title` | Valoriser une réalisation |
| `career.diagnostic.miniPlan.step.experience.text` | Ajoutez à votre profil une réalisation chiffrée : le contexte, ce que vous avez fait, le résultat. |
| `career.diagnostic.miniPlan.step.cv.title` | Mettre votre CV à jour |
| `career.diagnostic.miniPlan.step.cv.text` | Refaites votre CV avec un modèle gratuit, puis faites-le relire par une personne de confiance. |
| `career.diagnostic.miniPlan.step.interview.title` | Préparer votre présentation |
| `career.diagnostic.miniPlan.step.interview.text` | Entraînez-vous à présenter votre parcours en 2 minutes, à voix haute, trois fois cette semaine. |
| `career.diagnostic.miniPlan.step.search.title` | Candidater cette semaine |
| `career.diagnostic.miniPlan.step.search.text` | Postulez à trois offres qui vous correspondent : candidater est toujours gratuit. |
| `career.diagnostic.miniPlan.step.network.title` | Activer votre réseau |
| `career.diagnostic.miniPlan.step.network.text` | Rendez votre profil visible des recruteurs, puis écrivez à trois professionnels de votre domaine. |
| `career.diagnostic.upgrade.title` | Pour aller plus loin |
| `career.diagnostic.upgrade.intro` | Ces accompagnements font partie des offres payantes. Votre mini plan et vos candidatures restent gratuits. |
| `career.diagnostic.upgrade.item.progressPlan` | Un plan de progression complet, à suivre semaine après semaine |
| `career.diagnostic.upgrade.item.personalized` | Un diagnostic personnalisé par Jumanly Intelligence, avec des questions de relance |
| `career.diagnostic.upgrade.item.interview` | Des simulations d'entretien avec un retour détaillé |
| `career.diagnostic.upgrade.item.documents` | Des lettres de motivation et une bio rédigées avec l'IA |
| `career.diagnostic.upgrade.item.recommendations` | Des formations recommandées pour les compétences à renforcer |
| `career.diagnostic.scan.done` | terminé |
| `career.diagnostic.scan.running` | en cours |
| `career.diagnostic.scan.ready` | Votre diagnostic est prêt |
| `career.diagnostic.scan.level` | Niveau {stage} |
| `career.diagnostic.scan.cta` | Voir mon diagnostic |
| `career.diagnostic.scan.fallback` | Jumanly Intelligence n'a pas répondu à temps : votre bilan est calculé par les règles fixes, sans crédit consommé. Vous pourrez relancer la version personnalisée plus tard. |
| `career.diagnostic.scan.error` | L'analyse n'a pas pu aboutir. Vos réponses sont enregistrées : réessayez. |
| `career.diagnostic.scan.retry` | Réessayer |
| `career.diagnostic.stage.discovery` | Découverte |
| `career.diagnostic.stage.building` | Construction |
| `career.diagnostic.stage.ready` | Prêt |
| `career.diagnostic.stage.competitive` | Compétitif |
| `career.diagnostic.stage.range` | {from} à {to} |
| `career.diagnostic.stage.discoveryText` | Vous posez les bases : clarifiez votre projet et créez vos premiers outils. |
| `career.diagnostic.stage.buildingText` | Vous avez des bases solides : quelques chantiers ciblés vous rendront prêt. |
| `career.diagnostic.stage.readyText` | Vous êtes prêt à candidater : travaillez vos points faibles pour vous démarquer. |
| `career.diagnostic.stage.competitiveText` | Vous êtes compétitif : visez les offres exigeantes et entretenez votre réseau. |
| `career.diagnostic.result.global` | Votre niveau global |
| `career.diagnostic.result.score` | {score} sur 100 |
| `career.diagnostic.result.outOf` | sur 100 |
| `career.diagnostic.result.track` | Les quatre stades du diagnostic |
| `career.diagnostic.result.youAreHere` | Vous êtes ici |
| `career.diagnostic.result.radar` | Vos 6 dimensions |
| `career.diagnostic.result.detail` | Le détail, dimension par dimension |
| `career.diagnostic.result.offers` | {count, plural, =0 {Aucune offre publiée comparée} one {# offre comparée} other {# offres comparées}} |
| `career.diagnostic.result.legacy` | Ce bilan a été établi avec la première version du diagnostic, en trois niveaux. |
| `career.diagnostic.result.evolution.title` | Votre évolution |
| `career.diagnostic.result.evolution.since` | Depuis votre diagnostic du {date, date, long} |
| `career.diagnostic.result.evolution.up` | En hausse de {value} points |
| `career.diagnostic.result.evolution.down` | En baisse de {value} points |
| `career.diagnostic.result.evolution.same` | Stable |
| `career.diagnostic.result.evolution.first` | C'est votre premier diagnostic en six dimensions : refaites-le dans 30 jours pour mesurer vos progrès. |
| `career.diagnostic.result.remind.cta` | Refaire dans 30 jours |
| `career.diagnostic.result.remind.hint` | Nous vous enverrons une notification ce jour-là. |
| `career.diagnostic.result.remind.done` | Rappel prévu le {date, date, long}. |
| `career.diagnostic.result.remind.sent` | Le rappel a été envoyé le {date, date, long}. |
| `career.diagnostic.rule.priority.experience` | Valoriser votre expérience : projets, stages, engagements |
| `career.diagnostic.pdf.title` | Bilan de carrière |
| `career.diagnostic.pdf.subtitle` | {name} · établi le {date, date, long} |
| `career.diagnostic.pdf.footer` | Document établi par Jumanly à partir des réponses du talent, selon un barème fixe (diagnostic_scoring_v2). Il n'est jamais montré aux recruteurs. |
| `career.diagnostic.pdf.global` | Niveau global |
| `career.diagnostic.pdf.dimensions` | Six dimensions |
| `career.diagnostic.pdf.priorities` | Priorités |
| `career.diagnostic.pdf.summary` | Synthèse de Jumanly Intelligence |
| `career.diagnostic.toast.ready` | Votre diagnostic est prêt. |

### `/app/career/cv` · Éditeur de CV et coach IA

*Éditer le CV section par section, avec un coach qui propose et un talent qui décide.*

| Clé | Texte |
|---|---|
| `career.cv.eyebrow` | Career · Dernière modification {time, relative} |
| `career.cv.title` | Mon CV |
| `career.cv.openPrimary` | Ouvrir mon CV principal |
| `career.cv.myCvs` | Mes CV |
| `career.cv.new` | Nouveau CV |
| `career.cv.duplicate` | Dupliquer |
| `career.cv.rename` | Renommer |
| `career.cv.name.placeholder` | Ex. : CV Data analyst |
| `career.cv.delete.text` | Supprimer ce CV |
| `career.cv.delete.confirm.title` | Supprimer « {cvName} » ? |
| `career.cv.delete.confirm.body` | Ce CV sera définitivement supprimé. Les candidatures déjà envoyées gardent leur copie. |
| `career.cv.delete.confirm.cta` | Supprimer |
| `career.cv.deleted` | CV supprimé. |
| `career.cv.default` | CV principal |
| `career.cv.setDefault` | Utiliser par défaut pour mes candidatures |
| `career.cv.import.text` | Importer un CV existant |
| `career.cv.import.hint` | PDF ou Word, 5 Mo maximum. Nous en extrayons le contenu, vous vérifiez chaque section. |
| `career.cv.import.success` | CV importé. Vérifiez les sections pré-remplies. |
| `career.cv.import.partial` | Certaines sections n'ont pas pu être lues. Complétez-les à la main. |
| `career.cv.fromProfile` | Remplir depuis mon profil |
| `career.cv.syncProfile` | Mettre aussi à jour mon profil |
| `career.cv.sections` | Sections |
| `career.cv.section.info` | Informations |
| `career.cv.section.summary` | Profil |
| `career.cv.section.experience` | Expériences |
| `career.cv.section.education` | Formation |
| `career.cv.section.skills` | Compétences |
| `career.cv.section.languages` | Langues |
| `career.cv.section.certificates` | Certificats et attestations |
| `career.cv.section.volunteer` | Engagement |
| `career.cv.section.projects` | Projets |
| `career.cv.section.portfolio` | Portfolio |
| `career.cv.section.interests` | Centres d'intérêt |
| `career.cv.section.custom` | Section personnalisée |
| `career.cv.section.add` | Ajouter une section |
| `career.cv.section.hide` | Masquer sur le CV |
| `career.cv.section.show` | Afficher sur le CV |
| `career.cv.section.moveUp` | Monter |
| `career.cv.section.moveDown` | Descendre |
| `career.cv.section.completion` | {percent} % |
| `career.cv.info.contact.text` | Coordonnées affichées |
| `career.cv.info.contact.hint` | E-mail, téléphone, ville et liens. Évitez d'indiquer votre âge, votre situation familiale ou votre photo si ce n'est pas demandé. |
| `career.cv.info.photo.text` | Afficher ma photo sur le CV |
| `career.cv.info.photo.hint` | Facultatif. De nombreux recruteurs préfèrent un CV sans photo. |
| `career.cv.bullet.add` | Ajouter une réalisation |
| `career.cv.template.text` | Modèle |
| `career.cv.template.current` | « {templateName} » · lisible par les logiciels de recrutement |
| `career.cv.template.change` | Changer de modèle |
| `career.cv.template.title` | Choisir un modèle |
| `career.cv.template.ats.text` | Lisible par les logiciels de recrutement |
| `career.cv.template.included` | Inclus |
| `career.cv.template.locked` | Disponible avec {plan} |
| `career.cv.template.limit` | {count, plural, one {# modèle inclus dans votre forfait} other {# modèles inclus dans votre forfait}} |
| `career.cv.template.apply` | Utiliser ce modèle |
| `career.cv.template.applied` | Modèle appliqué. Votre contenu n'a pas changé. |
| `career.cv.template.color` | Couleur d'accent |
| `career.cv.template.font` | Police |
| `career.cv.template.density.text` | Densité |
| `career.cv.template.density.airy` | Aérée |
| `career.cv.template.density.compact` | Compacte |
| `career.cv.tab.preview` | Aperçu |
| `career.cv.tab.letter` | Lettre de motivation |
| `career.cv.tab.linkedin` | Biographie LinkedIn |
| `career.cv.share.text` | Partager |
| `career.cv.share.link` | Lien de partage en lecture seule |
| `career.cv.share.copy` | Copier le lien |
| `career.cv.share.disable` | Désactiver le lien |
| `career.cv.share.copied` | Lien copié. |
| `career.cv.export.text` | PDF |
| `career.cv.export.title` | Exporter mon CV |
| `career.cv.export.format.pdf` | PDF (recommandé) |
| `career.cv.export.format.docx` | Word |
| `career.cv.export.pages` | {count, plural, one {# page} other {# pages}} |
| `career.cv.export.tooLong` | Votre CV dépasse deux pages. Les recruteurs lisent rarement au-delà. |
| `career.cv.export.preparing` | Préparation du PDF… |
| `career.cv.export.ready` | Votre CV est prêt. |
| `career.cv.export.download` | Télécharger |
| `career.cv.export.error` | L'export a échoué. Réessayez dans un instant. |
| `career.cv.tailor.text` | Adapter à une offre |
| `career.cv.tailor.desc` | Choisissez une offre : nous proposons une version de votre CV qui met en avant ce qu'elle demande, sans rien inventer. |
| `career.cv.tailor.selectJob` | Choisir une offre |
| `career.cv.tailor.locked` | Adaptation du CV à une offre · Disponible avec {plan} |
| `career.cv.tailor.created` | Version « {cvName} » créée pour {jobTitle}. |
| `career.cv.tailor.cta` | Créer la version adaptée |
| `career.cv.tailor.name` | CV · {jobTitle} |
| `career.cv.tailor.noJobs` | Enregistrez une offre ou candidatez pour pouvoir y adapter votre CV. |
| `career.cv.tailor.notFound` | Cette offre n'est plus disponible. |
| `career.cv.saved` | Enregistré |
| `career.cv.saving` | Enregistrement… |
| `career.cv.empty` | Votre CV est vide. Importez un CV existant ou remplissez-le depuis votre profil. |
| `career.cv.coach.footer` | L'IA conseille, vous décidez. Rien n'est modifié sans votre accord. |
| `career.cv.simulateInterview` | Simuler un entretien |
| `career.cv.seo` | Mon CV · Jumanly |
| `career.cv.updated` | Modifié le {date} |
| `career.cv.open` | Ouvrir |
| `career.cv.template.name.classique` | Classique |
| `career.cv.template.name.epure` | Épuré |
| `career.cv.template.name.premierEmploi` | Premier emploi |
| `career.cv.template.name.moderne` | Moderne |
| `career.cv.template.name.colonne` | Colonne |
| `career.cv.template.name.executif` | Exécutif |
| `career.cv.template.name.bandeau` | Bandeau |
| `career.cv.template.name.contraste` | Contraste |
| `career.cv.template.name.parcours` | Parcours |
| `career.cv.template.name.academique` | Académique |
| `career.cv.template.name.creatif` | Créatif |
| `career.cv.template.name.tech` | Tech |
| `career.cv.template.name.elegant` | Élégant |
| `career.cv.template.name.visuel` | Visuel |
| `career.cv.template.description.classique` | Une colonne, en-tête centré, filets fins. Le plus sûr pour les logiciels de recrutement. |
| `career.cv.template.description.epure` | Titres de sections dans une marge à gauche, beaucoup de blanc, photo carrée facultative. |
| `career.cv.template.description.premierEmploi` | La formation et les projets passent avant l'expérience. Compétences en étiquettes. |
| `career.cv.template.description.moderne` | En-tête teinté avec photo ronde, colonne de droite pour les compétences et les langues. |
| `career.cv.template.description.colonne` | Barre latérale teintée à gauche avec photo, coordonnées et compétences. |
| `career.cv.template.description.executif` | Une colonne, bandeau fin en haut, encadré « Réalisations clés ». |
| `career.cv.template.description.bandeau` | Bandeau plein de couleur en haut, photo ronde cerclée de blanc, colonne de droite. |
| `career.cv.template.description.contraste` | Barre latérale foncée en texte blanc, compétences et langues en pastilles. |
| `career.cv.template.description.parcours` | Frise chronologique : dates à gauche, ligne et pastilles. |
| `career.cv.template.description.compact` | Marges réduites, en-tête sur une ligne, compétences en trois colonnes. |
| `career.cv.template.description.academique` | Sections numérotées, publications et communications en références, plusieurs pages. |
| `career.cv.template.description.creatif` | Monogramme ou photo en grand, nom très présent, colonne de cartes teintées à droite. |
| `career.cv.template.description.tech` | Compétences regroupées par domaine, projets avant l'expérience, outils sous chaque poste. |
| `career.cv.template.description.elegant` | En-tête centré avec photo ronde, titres centrés entre deux filets. |
| `career.cv.template.description.visuel` | Grande photo, jauges de compétences et pastilles de langues (niveaux aussi écrits en toutes lettres). |
| `career.cv.template.audience.classique` | Tous profils, candidatures en ligne |
| `career.cv.template.audience.epure` | CV sobre et aéré |
| `career.cv.template.audience.premierEmploi` | Étudiants, jeunes diplômés, stages |
| `career.cv.template.audience.moderne` | Tous profils |
| `career.cv.template.audience.colonne` | Tous profils |
| `career.cv.template.audience.executif` | Cadres, managers |
| `career.cv.template.audience.bandeau` | Commerce, services |
| `career.cv.template.audience.contraste` | Se démarquer à l'impression |
| `career.cv.template.audience.parcours` | Parcours riches, reconversions |
| `career.cv.template.audience.compact` | Longues carrières sur une page |
| `career.cv.template.audience.academique` | Enseignants, chercheurs, bourses |
| `career.cv.template.audience.creatif` | Communication, design |
| `career.cv.template.audience.tech` | Développement, data, numérique |
| `career.cv.template.audience.elegant` | Hôtellerie, juridique, profils seniors |
| `career.cv.template.audience.visuel` | Montrer ses niveaux d'un coup d'œil |
| `career.cv.templates.title` | Choisir un modèle |
| `career.cv.templates.subtitle` | Changez de mise en page quand vous voulez : votre contenu ne bouge pas. |
| `career.cv.templates.count` | {included} modèles inclus dans votre forfait · {others} autres avec Starter ou Pro |
| `career.cv.templates.filter.all` | Tous ({count}) |
| `career.cv.templates.filter.included` | Inclus dans mon forfait ({count}) |
| `career.cv.templates.filter.photo` | Avec photo |
| `career.cv.templates.filter.noPhoto` | Sans photo |
| `career.cv.templates.filter.oneColumn` | Une colonne |
| `career.cv.templates.filter.twoColumns` | Deux colonnes |
| `career.cv.templates.filter.atsBest` | ATS excellente |
| `career.cv.templates.sort` | Trier : {order} |
| `career.cv.templates.sortBy.recommended` | Recommandés |
| `career.cv.templates.sortBy.free` | Gratuits d'abord |
| `career.cv.templates.sortBy.name` | Nom |
| `career.cv.template.preview` | Aperçu avec votre contenu |
| `career.cv.template.previewFull` | Aperçu plein écran |
| `career.cv.template.previewBadge` | Aperçu |
| `career.cv.template.seePlans` | Voir les forfaits |
| `career.cv.template.lockedHint` | Inclus dans {plans}. Changer de modèle ne modifie jamais votre contenu. |
| `career.cv.template.neutral` | Vos CV téléchargés ne portent ni logo ni mention Jumanly. |
| `career.cv.template.downgraded` | Votre forfait ne comprend plus le modèle « {templateName} ». Choisissez un modèle inclus pour télécharger ce CV : votre contenu reste identique. |
| `career.cv.template.ats.excellent` | ATS excellente |
| `career.cv.template.ats.veryGood` | ATS très bonne |
| `career.cv.template.ats.good` | ATS bonne |
| `career.cv.template.layout.one` | Une colonne |
| `career.cv.template.layout.two` | Deux colonnes |
| `career.cv.template.layout.side` | Barre latérale |
| `career.cv.template.photo.optional` | Photo facultative |
| `career.cv.template.photo.none` | Sans photo |
| `career.cv.tab.content` | Contenu |
| `career.cv.tab.style` | Mise en forme |
| `career.cv.style.color.recommended` | Recommandées pour les logiciels de recrutement |
| `career.cv.style.color.others` | Autres couleurs |
| `career.cv.style.color.custom` | Couleur personnalisée |
| `career.cv.style.color.apply` | Appliquer |
| `career.cv.style.color.invalid` | Saisissez une couleur au format #1B365D. |
| `career.cv.style.color.contrast` | Contraste {ratio}:1 |
| `career.cv.style.color.hint` | Le texte reste noir sur fond blanc. La couleur ne sert qu'aux titres, aux filets et aux décors. |
| `career.cv.style.color.tooLight` | Cette couleur est trop claire pour être lue facilement. Essayez {suggestion}. |
| `career.cv.style.font.recommended` | Recommandée |
| `career.cv.style.font.hint` | Toutes les polices sont intégrées au PDF. |
| `career.cv.template.density.standard` | Standard |
| `career.cv.style.photo.unsupported` | Ce modèle n'a pas d'emplacement photo. |
| `career.cv.style.titlesLanguage.text` | Langue des titres |
| `career.cv.style.titlesLanguage.hint` | Seuls les titres de sections changent. Votre texte n'est pas traduit. |
| `career.cv.style.titlesLanguage.fr` | Français |
| `career.cv.style.titlesLanguage.en` | English |
| `career.cv.section.moveColumn` | Changer de colonne |
| `career.cv.section.customTitleHint` | Un titre courant (« Expérience », « Formation ») est mieux reconnu par les logiciels de recrutement. |
| `career.cv.pages.title` | Pages |
| `career.cv.pages.count` | {count} sur {max} au maximum |
| `career.cv.pages.add` | Ajouter |
| `career.cv.pages.page` | Page {number} |
| `career.cv.pages.breakTarget` | Avant quel élément ? |
| `career.cv.pages.breakHere` | Commencer une nouvelle page ici |
| `career.cv.pages.breakLabel` | Saut de page avant « {sectionName} » |
| `career.cv.pages.removeBreak` | Retirer le saut de page |
| `career.cv.pages.fitOne` | Faire tenir sur une page |
| `career.cv.pages.fitFailed` | Votre CV ne tient pas sur une page sans couper de texte. Masquez une section ou raccourcissez une expérience. |
| `career.cv.pages.hint` | Les recruteurs lisent surtout la première page. Au-delà de deux pages, nous vous le signalons. |
| `career.cv.pages.overMax` | Votre CV dépasse {max} pages. Passez en densité compacte ou masquez une section pour pouvoir le télécharger. |
| `career.cv.pages.itemTooLong` | Cet élément est plus long qu'une page. Raccourcissez-le pour qu'il s'affiche en entier. |
| `career.cv.export.fileName` | {fileName} · {count, plural, one {# page} other {# pages}} · texte sélectionnable |
| `career.cv.export.docxNote` | La version Word est simplifiée sur une colonne pour rester modifiable facilement. |
| `career.cv.template.name.compact` | Compact |
| `career.cv.info.showEmail` | Afficher mon e-mail sur le CV |
| `career.cv.info.phone.label` | Téléphone (facultatif) |
| `career.cv.info.phone.hint` | Affiché seulement sur ce CV, à côté de votre e-mail. Laissez vide pour ne pas l'afficher. |
| `career.cv.info.phone.invalid` | Numéro de téléphone non valide : chiffres, espaces, +, tirets et parenthèses seulement. |
| `career.cv.fromProfileHint` | Le contenu des sections vient de votre profil. Modifiez-le dans votre profil, puis touchez « Remplir depuis mon profil ». |
| `career.cv.fromProfileDone` | CV mis à jour à partir de votre profil. |
| `career.cv.limit` | Vous pouvez avoir jusqu'à {max} CV. |
| `career.cv.back` | Mes CV |
| `career.cv.list.lead` | Gardez un CV par type de poste. Le CV principal est celui qui part avec vos candidatures. |
| `career.cv.list.count` | CV créés |
| `career.cv.list.countValue` | {count} sur {max} |
| `career.cv.list.primaryScore` | Score du CV principal |
| `career.cv.list.chooseTemplate` | Choisir un modèle |
| `career.cv.list.primaryTitle` | CV principal |
| `career.cv.list.primaryLead` | Envoyé par défaut avec vos candidatures |
| `career.cv.list.othersTitle` | Mes autres CV |
| `career.cv.list.othersLead` | Adaptés à d'autres postes |
| `career.cv.list.openEditor` | Ouvrir l'éditeur |
| `career.cv.list.why` | Pourquoi ce score ? |
| `career.cv.list.more` | Plus d'actions |
| `career.cv.list.newHint` | Rempli à partir de votre profil. Il vous reste {count} CV. |
| `career.cv.list.templatesTitle` | {total} modèles neutres, lisibles par les logiciels de recrutement |
| `career.cv.list.templatesBody` | {included, plural, one {# est inclus dans votre formule.} other {# sont inclus dans votre formule.}} Vos CV téléchargés ne portent ni logo ni mention Jumanly. |
| `career.cv.list.templatesColumns` | Une ou deux colonnes |
| `career.cv.list.templatesPhoto` | Avec ou sans photo |
| `career.cv.list.templatesFonts` | {count} polices |
| `career.cv.list.templatesCta` | Voir les modèles |
| `career.cv.list.templatesEyebrow` | Modèles de CV |
| `career.cv.criteria.ats` | Lisibilité ATS |
| `career.cv.criteria.impact` | Impact |
| `career.cv.criteria.keywords` | Mots-clés |
| `career.cv.score.noAi` | Calculé sur votre contenu, sans IA |
| `career.cv.progress.done` | Toutes les sections sont remplies |
| `career.cv.progress.todo` | {count, plural, one {# section à compléter} other {# sections à compléter}} |
| `career.cv.progress.hint` | Changez l'ordre avec les flèches |
| `career.cv.section.count.experience` | {count, plural, =0 {Aucun poste} one {# poste} other {# postes}} |
| `career.cv.section.count.education` | {count, plural, =0 {Aucun diplôme} one {# diplôme} other {# diplômes}} |
| `career.cv.section.count.skills` | {count, plural, =0 {Aucune compétence} one {# compétence} other {# compétences}} |
| `career.cv.section.count.languages` | {count, plural, =0 {Aucune langue} one {# langue} other {# langues}} |
| `career.cv.section.count.summary` | Nom, titre, contact et résumé |
| `career.cv.section.toComplete` | À compléter |
| `career.cv.section.editInProfile` | Modifier dans mon profil |
| `career.cv.profileCard.title` | Le contenu vient de votre profil |
| `career.cv.profileCard.body` | Modifiez votre profil, puis mettez ce CV à jour en un clic. |
| `career.cv.profileCard.cta` | Remplir |
| `career.cv.preview.pageOf` | Page {page} sur {total} · A4 |
| `career.cv.preview.zoomIn` | Agrandir |
| `career.cv.preview.zoomOut` | Réduire |
| `career.cv.preview.fullscreen` | Plein écran |
| `career.cv.preview.highlightHint` | La section que vous modifiez est surlignée sur la page |
| `career.cv.toolbar.label` | Actions du CV |
| `career.cv.toolbar.download` | Télécharger le PDF |
| `career.cv.toolbar.count` | {count, plural, one {# CV} other {# CV}} |
| `career.cv.summary.counter` | {count} / {max} |
| `career.cv.summary.hint` | 3 à 4 lignes conseillées |

### Document CV · Titres et niveaux imprimés sur le CV

Ces textes figurent dans le CV téléchargé. Ils suivent la « langue des titres » choisie pour chaque CV (français ou anglais), quelle que soit la langue de l'interface. Le contenu saisi par la personne n'est jamais traduit.

| Clé | Texte |
|---|---|
| `cv.titles.fr.summary` | Profil |
| `cv.titles.fr.highlights` | Réalisations clés |
| `cv.titles.fr.experience` | Expérience professionnelle |
| `cv.titles.fr.education` | Formation |
| `cv.titles.fr.skills` | Compétences |
| `cv.titles.fr.languages` | Langues |
| `cv.titles.fr.certificates` | Certifications |
| `cv.titles.fr.projects` | Projets |
| `cv.titles.fr.volunteer` | Engagement |
| `cv.titles.fr.interests` | Centres d'intérêt |
| `cv.titles.fr.publications` | Publications |
| `cv.titles.fr.talks` | Communications |
| `cv.titles.fr.teaching` | Enseignements |
| `cv.titles.fr.custom` | Autres informations |
| `cv.titles.en.summary` | Profile |
| `cv.titles.en.highlights` | Key achievements |
| `cv.titles.en.experience` | Work experience |
| `cv.titles.en.education` | Education |
| `cv.titles.en.skills` | Skills |
| `cv.titles.en.languages` | Languages |
| `cv.titles.en.certificates` | Certifications |
| `cv.titles.en.projects` | Projects |
| `cv.titles.en.volunteer` | Volunteering |
| `cv.titles.en.interests` | Interests |
| `cv.titles.en.publications` | Publications |
| `cv.titles.en.talks` | Talks |
| `cv.titles.en.teaching` | Teaching |
| `cv.titles.en.custom` | Additional information |
| `cv.levels.fr.1` | Notions |
| `cv.levels.fr.2` | Intermédiaire |
| `cv.levels.fr.3` | Avancé |
| `cv.levels.fr.4` | Expert |
| `cv.levels.en.1` | Basic |
| `cv.levels.en.2` | Intermediate |
| `cv.levels.en.3` | Advanced |
| `cv.levels.en.4` | Expert |
| `cv.languageLevels.fr.native` | Langue maternelle |
| `cv.languageLevels.fr.fluent` | Courant |
| `cv.languageLevels.fr.professional` | Professionnel |
| `cv.languageLevels.fr.intermediate` | Intermédiaire |
| `cv.languageLevels.fr.basic` | Notions |
| `cv.languageLevels.en.native` | Native language |
| `cv.languageLevels.en.fluent` | Fluent |
| `cv.languageLevels.en.professional` | Professional |
| `cv.languageLevels.en.intermediate` | Intermediate |
| `cv.languageLevels.en.basic` | Basic |
| `cv.present.fr` | aujourd'hui |
| `cv.present.en` | present |
| `cv.colors.encre` | Encre |
| `cv.colors.marine` | Marine |
| `cv.colors.petrole` | Pétrole |
| `cv.colors.foret` | Forêt |
| `cv.colors.bordeaux` | Bordeaux |
| `cv.colors.prune` | Prune |
| `cv.colors.brun` | Brun |
| `cv.colors.graphite` | Graphite |
| `cv.colors.bleu` | Bleu |
| `cv.colors.turquoise` | Turquoise |
| `cv.colors.vert` | Vert |
| `cv.colors.brique` | Brique |
| `cv.colors.orange` | Orange brûlé |
| `cv.colors.violet` | Violet |
| `cv.colors.framboise` | Framboise |
| `cv.colors.acier` | Acier |

### `/app/career/documents` · Lettres, biographie et correction

*Rédiger et corriger les documents de candidature (Starter et plus).*

| Clé | Texte |
|---|---|
| `career.documents.title` | Lettres et documents |
| `career.documents.openLast` | Ouvrir mon dernier document |
| `career.documents.subtitle` | Lettres de motivation, biographies et correction de vos textes. |
| `career.documents.locked.title` | Disponible avec {plan} |
| `career.documents.locked.body` | La création et la correction de documents professionnels sont incluses à partir de {plan}. |
| `career.documents.new` | Nouveau document |
| `career.documents.mine` | Mes documents |
| `career.documents.badge` | Proposition IA |
| `career.documents.edit.cta` | Modifier |
| `career.documents.aiNotice` | Ce contenu a été proposé par l'IA à partir de vos informations. Il peut contenir des erreurs : relisez-le avant de l'utiliser. |
| `career.documents.pick` | Choisissez un document à gauche, ou créez-en un avec l'IA. |
| `career.documents.type.letter` | Lettre de motivation |
| `career.documents.type.bio` | Biographie professionnelle |
| `career.documents.type.email` | E-mail de candidature |
| `career.documents.type.thankYou` | Message de remerciement après entretien |
| `career.documents.type.proofread` | Correction d'un texte |
| `career.documents.generate.title` | Rédiger avec l'IA |
| `career.documents.generate.job` | Offre visée (facultatif) |
| `career.documents.generate.tone.text` | Ton |
| `career.documents.generate.tone.formal` | Formel |
| `career.documents.generate.tone.warm` | Chaleureux |
| `career.documents.generate.tone.direct` | Direct |
| `career.documents.generate.length.text` | Longueur |
| `career.documents.generate.length.short` | Courte |
| `career.documents.generate.length.standard` | Standard |
| `career.documents.generate.points.text` | Points à mettre en avant |
| `career.documents.generate.points.placeholder` | Ex. : mon stage en banque, mon attestation Power BI |
| `career.documents.generate.cta` | Générer une proposition |
| `career.documents.generate.cost` | {count, plural, one {Utilise # crédit IA} other {Utilise # crédits IA}} |
| `career.documents.proofread.paste` | Collez votre texte |
| `career.documents.proofread.cta` | Corriger |
| `career.documents.proofread.changes` | {count, plural, =0 {Aucune correction proposée} one {# correction proposée} other {# corrections proposées}} |
| `career.documents.proofread.acceptAll` | Tout appliquer |
| `career.documents.proofread.rejectAll` | Tout ignorer |
| `career.documents.list.empty` | Aucun document pour l'instant. |
| `career.documents.list.updated` | Modifié {time, relative} |
| `career.documents.copy` | Copier le texte |
| `career.documents.copied` | Texte copié. |
| `career.documents.export` | Télécharger en PDF |
| `career.documents.delete.confirm` | Supprimer ce document ? Cette action est définitive. |
| `career.documents.saved` | Document enregistré. |
| `career.documents.back` | Tous mes documents |
| `career.documents.created` | Votre proposition est prête. Relisez-la et adaptez-la avant de l'utiliser. |
| `career.documents.deleted` | Document supprimé. |
| `career.documents.delete.cta` | Supprimer |
| `career.documents.open` | Ouvrir |
| `career.documents.edit.title` | Titre du document |
| `career.documents.edit.text` | Texte |
| `career.documents.edit.save` | Enregistrer |
| `career.documents.generate.noJob` | Sans offre précise |
| `career.documents.generate.type` | Type de document |
| `career.documents.proofread.title` | Titre |
| `career.documents.proofread.apply` | Appliquer les corrections cochées |
| `career.documents.proofread.before` | Avant |
| `career.documents.proofread.after` | Après |
| `career.documents.proofread.why` | Pourquoi |
| `career.documents.proofread.rule.spaces` | Espaces en trop. |
| `career.documents.proofread.rule.punctuation` | Pas d'espace avant une virgule ou un point. |
| `career.documents.proofread.rule.capital` | Une phrase commence par une majuscule. |
| `career.documents.error.input` | Vérifiez les informations saisies. |
| `career.documents.template.title.letter` | Lettre · {jobTitle} |
| `career.documents.template.title.bio` | Biographie professionnelle |
| `career.documents.template.title.email` | E-mail de candidature · {jobTitle} |
| `career.documents.template.title.thankYou` | Remerciement · {jobTitle} |
| `career.documents.template.greeting.formal` | Madame, Monsieur, |
| `career.documents.template.greeting.simple` | Bonjour, |
| `career.documents.template.letter.intro` | Je vous adresse ma candidature au poste de {jobTitle}. |
| `career.documents.template.letter.introCompany` | Je vous adresse ma candidature au poste de {jobTitle} chez {company}. |
| `career.documents.template.letter.experience` | Mon expérience récente ({lastRole}) m'a permis de développer des compétences utiles pour ce poste. |
| `career.documents.template.letter.skills` | Je mets à votre service mes compétences en {skills}. |
| `career.documents.template.points` | Je souhaite notamment mettre en avant : {points}. |
| `career.documents.template.letter.closing` | Je reste à votre disposition pour un entretien et vous remercie de l'attention portée à ma candidature. |
| `career.documents.template.bio.intro` | {name} : {headline}. |
| `career.documents.template.bio.experience` | Expérience récente : {lastRole}. |
| `career.documents.template.bio.skills` | Compétences principales : {skills}. |
| `career.documents.template.email.intro` | Veuillez trouver ci-joint ma candidature au poste de {jobTitle}, accompagnée de mon CV. |
| `career.documents.template.email.skills` | Mon profil met en avant les compétences suivantes : {skills}. |
| `career.documents.template.closing` | Je reste disponible pour un échange. Bien cordialement, |
| `career.documents.template.thankYou.body` | Je vous remercie pour notre entretien au sujet du poste de {jobTitle}. Nos échanges ont confirmé mon intérêt pour ce poste. |
| `career.documents.template.notice` | Cette proposition reprend uniquement les informations de votre profil. Relisez-la et complétez-la avant de l'envoyer. |

### `/app/career/linkedin` · Préparation LinkedIn

*Proposer un titre, un résumé et des compétences prêts à copier.*

| Clé | Texte |
|---|---|
| `career.linkedin.title` | Préparation LinkedIn |
| `career.linkedin.subtitle` | Des propositions à partir de votre profil Jumanly. Copiez-les sur LinkedIn après relecture. |
| `career.linkedin.aiLine` | Votre titre et votre résumé LinkedIn, écrits à partir de votre profil. |
| `career.linkedin.locked` | Disponible avec {plan} |
| `career.linkedin.headline.text` | Titre |
| `career.linkedin.headline.hint` | 220 caractères maximum sur LinkedIn. |
| `career.linkedin.headline.count` | {count}/{max} |
| `career.linkedin.about` | Résumé (section « Infos ») |
| `career.linkedin.skills` | Compétences à mettre en avant |
| `career.linkedin.experience` | Descriptions d'expériences |
| `career.linkedin.generate` | Générer des propositions |
| `career.linkedin.regenerate` | Proposer une autre version |
| `career.linkedin.copy` | Copier |
| `career.linkedin.copied` | Copié. Collez-le dans LinkedIn. |
| `career.linkedin.checklist.title` | Liste de vérification |
| `career.linkedin.checklist.photo` | Une photo nette et un bandeau sobre |
| `career.linkedin.checklist.url` | Une adresse de profil personnalisée |
| `career.linkedin.checklist.open` | L'option « Ouvert aux opportunités » si vous cherchez |
| `career.linkedin.checklist.certificates` | Vos attestations Jumanly dans « Licences et certifications » |
| `career.linkedin.disclaimer` | Jumanly n'est pas affilié à LinkedIn et ne publie rien sur votre compte. |
| `career.linkedin.empty` | Générez des propositions à partir de votre profil Jumanly. Rien n'est publié sur LinkedIn. |
| `career.linkedin.generatedAt` | Propositions du {date, date, medium} |
| `career.linkedin.template.about` | {headline}. Compétences principales : {skills}. Expérience récente : {lastRole}. |
| `career.linkedin.profileHint` | Plus votre profil Jumanly est complet, plus les propositions sont utiles. |

### `/app/career/entretiens` · Simulations d'entretien

*S'entraîner à l'écrit (Starter et plus) puis à l'oral (Pro et plus), avec un retour structuré.*

| Clé | Texte |
|---|---|
| `career.interviews.title` | Simulations d'entretien |
| `career.interviews.lastSession` | Revoir ma dernière séance |
| `career.interviews.aiLine` | Après chaque séance, un retour clair : vos points forts et quoi travailler. |
| `career.interviews.subtitle` | Entraînez-vous sans pression. Vous recevez un retour détaillé après chaque séance. |
| `career.interviews.mode.text.text` | À l'écrit |
| `career.interviews.mode.text.desc` | Vous répondez par écrit, à votre rythme. |
| `career.interviews.mode.voice.text` | À l'oral |
| `career.interviews.mode.voice.desc` | Vous répondez à voix haute, comme en vrai. |
| `career.interviews.mode.locked` | Disponible avec {plan} |
| `career.interviews.quota.text` | {used}/{quota} simulations écrites ce mois |
| `career.interviews.quota.voice` | {used}/{quota} simulations orales ce mois |
| `career.interviews.quota.reached` | Vous avez utilisé toutes vos simulations de ce mois. Elles se renouvellent le {date, date, long}. |
| `career.interviews.setup.title` | Préparer la séance |
| `career.interviews.setup.mode` | Mode |
| `career.interviews.setup.job.text` | Poste visé |
| `career.interviews.setup.job.fromOffer` | Partir d'une offre enregistrée ou d'une candidature |
| `career.interviews.setup.type.text` | Type d'entretien |
| `career.interviews.setup.type.hr` | Entretien RH |
| `career.interviews.setup.type.technical` | Entretien technique |
| `career.interviews.setup.type.motivation` | Motivation et parcours |
| `career.interviews.setup.type.behavioral` | Mises en situation |
| `career.interviews.setup.level.text` | Exigence |
| `career.interviews.setup.level.easy` | Bienveillant |
| `career.interviews.setup.level.standard` | Standard |
| `career.interviews.setup.level.hard` | Exigeant |
| `career.interviews.setup.duration.text` | Durée |
| `career.interviews.setup.duration.value` | {minutes} min |
| `career.interviews.setup.language` | Langue |
| `career.interviews.setup.start` | Démarrer la simulation |
| `career.interviews.session.question` | Question {current} sur {total} |
| `career.interviews.session.answer.placeholder` | Votre réponse |
| `career.interviews.session.send` | Envoyer ma réponse |
| `career.interviews.session.hint` | Astuce : structurez votre réponse avec la situation, l'action et le résultat. |
| `career.interviews.session.end.text` | Terminer la séance |
| `career.interviews.session.end.confirm` | Terminer maintenant ? Vous recevrez un retour sur les questions déjà traitées. |
| `career.interviews.voice.micPermission` | Jumanly a besoin d'accéder à votre micro pour la simulation orale. |
| `career.interviews.voice.micDenied` | Micro inaccessible. Autorisez-le dans les réglages de votre navigateur, ou passez à la simulation écrite. |
| `career.interviews.voice.record` | Répondre |
| `career.interviews.voice.stop` | J'ai terminé |
| `career.interviews.voice.recording` | Enregistrement en cours… {time} |
| `career.interviews.voice.listening` | L'intervieweur vous écoute |
| `career.interviews.voice.speaking` | L'intervieweur parle |
| `career.interviews.voice.retry` | Recommencer ma réponse |
| `career.interviews.voice.privacy` | Vos enregistrements servent uniquement à votre retour. Ils sont supprimés après {days} jours. |
| `career.interviews.voice.noRecording` | Aucun enregistrement n'est conservé : votre navigateur transcrit votre réponse, que vous relisez avant de l'envoyer. |
| `career.interviews.voice.unsupported` | Votre navigateur ne permet pas la dictée. Répondez par écrit : la question est lue à voix haute et le retour reste le même. |
| `career.interviews.voice.listen` | Réécouter la question |
| `career.interviews.voice.duration` | Durée de votre réponse : {seconds} s |
| `career.interviews.feedback.title` | Votre retour |
| `career.interviews.feedback.overall` | Impression générale |
| `career.interviews.feedback.strengths` | Points forts |
| `career.interviews.feedback.improve` | À améliorer |
| `career.interviews.feedback.criteria.structure` | Structure des réponses |
| `career.interviews.feedback.criteria.relevance` | Pertinence |
| `career.interviews.feedback.criteria.examples` | Exemples concrets |
| `career.interviews.feedback.criteria.clarity` | Clarté |
| `career.interviews.feedback.criteria.pace` | Débit et pauses (oral) |
| `career.interviews.feedback.perQuestion` | Retour question par question |
| `career.interviews.feedback.betterAnswer` | Piste de réponse |
| `career.interviews.feedback.disclaimer` | Retour généré par l'IA. Il vous aide à progresser, il ne prédit pas le résultat d'un vrai entretien. |
| `career.interviews.feedback.again` | Refaire une simulation |
| `career.interviews.feedback.latest` | Dernière séance · {type} · {date, date, medium} |
| `career.interviews.feedback.none` | Votre retour apparaîtra ici après votre première séance : impression générale, critères, points forts et pistes de progrès. |
| `career.interviews.history.title` | Séances précédentes |
| `career.interviews.history.empty` | Votre première simulation apparaîtra ici. |
| `career.interviews.history.item` | {type} · {date, date, medium} · {mode} |
| `career.interviews.history.inProgress` | En cours |
| `career.interviews.history.open` | Ouvrir la séance |
| `career.interviews.history.session` | Séance |
| `career.interviews.history.date` | Date |
| `career.interviews.history.mode` | Mode |
| `career.interviews.history.feedback` | Votre retour |
| `career.interviews.history.completed` | Terminée |
| `career.interviews.setup.job.none` | Aucune offre : je saisis le poste |
| `career.interviews.setup.job.placeholder` | Ex. : Chargé de clientèle |
| `career.interviews.setup.questions` | {count} questions environ |
| `career.interviews.error.consent` | Les simulations utilisent l'IA. Activez-la dans vos paramètres de confidentialité pour commencer. |
| `career.interviews.error.invalid` | Vérifiez le poste visé et les options choisies. |
| `career.interviews.session.answered` | Votre réponse |
| `career.interviews.session.progress` | {done} réponses sur {total} |
| `career.interviews.session.allAnswered` | Vous avez répondu à toutes les questions. Terminez la séance pour recevoir votre retour. |
| `career.interviews.session.back` | Toutes mes simulations |
| `career.interviews.feedback.level.solid` | Solide |
| `career.interviews.feedback.level.developing` | En progrès |
| `career.interviews.feedback.level.toWork` | À travailler |
| `career.interviews.feedback.rules` | Retour établi par des règles simples (longueur, exemples, structure). Il vous aide à progresser, il ne prédit pas le résultat d'un vrai entretien. |
| `career.interviews.feedback.notAnswered` | Sans réponse |
| `career.interviews.feedback.rule.answered` | Vous avez mené l'exercice jusqu'au bout : c'est la meilleure façon de progresser. |
| `career.interviews.feedback.rule.examples` | Vos réponses s'appuient sur des exemples concrets. |
| `career.interviews.feedback.rule.structure` | Vos réponses suivent une structure claire : situation, action, résultat. |
| `career.interviews.feedback.rule.concise` | Vos réponses ont une longueur adaptée et des phrases faciles à suivre. |
| `career.interviews.feedback.rule.pace` | Votre débit à l'oral est régulier et facile à suivre. |
| `career.interviews.feedback.rule.short` | Réponse courte : développez avec un exemple tiré de votre parcours. |
| `career.interviews.feedback.rule.long` | Réponse longue : allez à l'essentiel en deux ou trois idées. |
| `career.interviews.feedback.rule.noExample` | Appuyez-vous sur un exemple précis : un projet, une mission, un chiffre. |
| `career.interviews.feedback.rule.noResult` | Terminez par le résultat obtenu : ce qui a changé grâce à votre action. |
| `career.interviews.feedback.rule.noAnswer` | Certaines questions sont restées sans réponse : reprenez-les lors d'une prochaine séance. |
| `career.interviews.feedback.rule.slow` | Débit un peu lent : préparez vos idées clés pour gagner en fluidité. |
| `career.interviews.feedback.rule.fast` | Débit rapide : marquez des pauses pour laisser le temps de suivre. |
| `career.interviews.bank.hr.1` | Présentez-vous en quelques minutes : votre parcours et ce qui vous amène vers le poste de {jobTitle}. |
| `career.interviews.bank.hr.2` | Pourquoi souhaitez-vous rejoindre notre organisation ? |
| `career.interviews.bank.hr.3` | Quelles sont vos principales qualités pour réussir comme {jobTitle} ? |
| `career.interviews.bank.hr.4` | Parlez-nous d'un point que vous cherchez à améliorer et de ce que vous faites pour y arriver. |
| `career.interviews.bank.hr.5` | Comment vous organisez-vous lorsque plusieurs tâches urgentes arrivent en même temps ? |
| `career.interviews.bank.hr.6` | Racontez une situation où vous avez dû travailler avec une personne au caractère difficile. |
| `career.interviews.bank.hr.7` | Où vous voyez-vous dans trois ans ? |
| `career.interviews.bank.hr.8` | Avez-vous des questions à nous poser sur le poste ? |
| `career.interviews.bank.technical.1` | Décrivez un projet récent en lien avec le métier de {jobTitle} : votre rôle et les outils utilisés. |
| `career.interviews.bank.technical.2` | Quelle compétence technique maîtrisez-vous le mieux ? Donnez un exemple d'utilisation. |
| `career.interviews.bank.technical.3` | Comment vérifiez-vous la qualité de votre travail avant de le livrer ? |
| `career.interviews.bank.technical.4` | Racontez un problème technique difficile et la façon dont vous l'avez résolu. |
| `career.interviews.bank.technical.5` | Comment vous tenez-vous à jour dans votre domaine ? |
| `career.interviews.bank.technical.6` | Si vous deviez expliquer une notion clé de votre métier à un débutant, que diriez-vous ? |
| `career.interviews.bank.technical.7` | Quelle erreur avez-vous commise dans un projet et qu'en avez-vous appris ? |
| `career.interviews.bank.technical.8` | Comment organiseriez-vous vos trente premiers jours comme {jobTitle} ? |
| `career.interviews.bank.motivation.1` | Qu'est-ce qui vous attire dans le métier de {jobTitle} ? |
| `career.interviews.bank.motivation.2` | Racontez les étapes de votre parcours qui vous ont conduit jusqu'ici. |
| `career.interviews.bank.motivation.3` | Quel accomplissement vous rend le plus fier, et pourquoi ? |
| `career.interviews.bank.motivation.4` | Qu'attendez-vous de votre prochain poste ? |
| `career.interviews.bank.motivation.5` | Pourquoi devrions-nous retenir votre candidature plutôt qu'une autre ? |
| `career.interviews.bank.motivation.6` | Quelles formations ou expériences récentes vous préparent à ce poste ? |
| `career.interviews.bank.motivation.7` | Dans quel environnement de travail donnez-vous le meilleur de vous-même ? |
| `career.interviews.bank.motivation.8` | Que savez-vous de notre secteur et de ses enjeux ? |
| `career.interviews.bank.behavioral.1` | Un client mécontent vous appelle pour une erreur qui n'est pas la vôtre. Que faites-vous ? |
| `career.interviews.bank.behavioral.2` | Votre responsable vous confie une tâche que vous n'avez jamais faite, à rendre demain. Comment procédez-vous ? |
| `career.interviews.bank.behavioral.3` | Racontez une situation où vous avez pris une initiative sans qu'on vous le demande. |
| `career.interviews.bank.behavioral.4` | Un collègue ne fait pas sa part dans un projet commun. Comment réagissez-vous ? |
| `career.interviews.bank.behavioral.5` | Racontez un moment où vous avez dû convaincre quelqu'un. |
| `career.interviews.bank.behavioral.6` | Vous découvrez une erreur dans un document déjà envoyé. Que faites-vous ? |
| `career.interviews.bank.behavioral.7` | Décrivez une situation où vous avez dû vous adapter rapidement à un changement. |
| `career.interviews.bank.behavioral.8` | Racontez un échec et ce que vous avez fait ensuite. |

### `/app/career/plan` · Plan de progression

*Transformer le diagnostic en étapes concrètes (Starter et plus).*

| Clé | Texte |
|---|---|
| `career.plan.title` | Mon plan de progression |
| `career.plan.subtitle` | Vos objectifs, découpés en étapes simples. |
| `career.plan.locked` | Disponible avec {plan} |
| `career.plan.empty` | Vous n'avez pas encore de plan. Partez de votre diagnostic ou créez-le vous-même. |
| `career.plan.fromDiagnostic` | Créer à partir de mon diagnostic |
| `career.plan.manual` | Créer mon plan |
| `career.plan.goal.text` | Objectif |
| `career.plan.goal.placeholder` | Ex. : Décrocher un poste de data analyst |
| `career.plan.deadline` | Échéance |
| `career.plan.goal.add` | Ajouter un objectif |
| `career.plan.step.add` | Ajouter une étape |
| `career.plan.step.title.placeholder` | Ex. : Terminer la formation SQL |
| `career.plan.step.due` | À faire avant le {date, date, medium} |
| `career.plan.step.done` | Fait |
| `career.plan.step.todo` | À faire |
| `career.plan.step.inProgress` | En cours |
| `career.plan.step.late` | En retard |
| `career.plan.progress` | {done}/{total} étapes |
| `career.plan.courses` | Formations recommandées |
| `career.plan.recommendations.text` | Recommandations de développement |
| `career.plan.recommendations.locked` | Recommandations de développement · Disponible avec {plan} |
| `career.plan.report.text` | Rapport de progression détaillé |
| `career.plan.report.locked` | Rapport détaillé · Disponible avec {plan} |
| `career.plan.report.download` | Télécharger le rapport (PDF) |
| `career.plan.report.desc` | Un bilan de vos formations, de vos compétences, de vos outils Career et de vos candidatures, à télécharger et à garder. |
| `career.plan.report.pdf.title` | Rapport de progression |
| `career.plan.report.pdf.subtitle` | {name} · {date, date, long} |
| `career.plan.report.pdf.footer` | Rapport établi par Jumanly à partir de vos propres données. Il décrit votre parcours, il ne note pas votre profil. |
| `career.plan.report.section.plan` | Plan de progression |
| `career.plan.report.section.learn` | Formations |
| `career.plan.report.section.courses` | Progression par formation |
| `career.plan.report.section.profile` | Profil et documents |
| `career.plan.report.section.interviews` | Simulations d'entretien |
| `career.plan.report.section.jobs` | Candidatures |
| `career.plan.report.row.goal` | Objectif |
| `career.plan.report.row.steps` | Étapes réalisées |
| `career.plan.report.row.enrolled` | Formations suivies |
| `career.plan.report.row.completed` | Formations terminées |
| `career.plan.report.row.certificates` | Attestations obtenues |
| `career.plan.report.row.completeness` | Profil complété |
| `career.plan.report.row.skills` | Compétences déclarées |
| `career.plan.report.row.verified` | Compétences vérifiées |
| `career.plan.report.row.cvs` | CV |
| `career.plan.report.row.documents` | Lettres et documents |
| `career.plan.report.row.interviews` | Simulations terminées |
| `career.plan.report.row.recentInterviews` | Simulations des 90 derniers jours |
| `career.plan.report.row.criterion` | Dernière simulation · {criterion} |
| `career.plan.report.row.applications` | Candidatures envoyées |
| `career.plan.report.row.recentApplications` | Candidatures des 90 derniers jours |
| `career.plan.report.row.inProgress` | Candidatures en cours |
| `career.plan.report.row.interviewStage` | Candidatures au stade de l'entretien ou de l'offre |
| `career.plan.report.row.hired` | Recrutements |
| `career.plan.report.value.steps` | {done} sur {total} |
| `career.plan.report.value.percent` | {percent} % |
| `career.plan.report.value.none` | Aucun |
| `career.plan.encouragement` | Une étape à la fois. Vous avez déjà fait {done} {done, plural, one {étape} other {étapes}}. |
| `career.plan.saved` | Plan mis à jour. |
| `career.plan.steps` | Étapes |
| `career.plan.updated` | Mis à jour le {date, date, long} |

### `/app/career/portfolio` · Portfolio

*Montrer ses réalisations sur une page publique (standard avec Pro, enrichi avec Premium).*

| Clé | Texte |
|---|---|
| `career.portfolio.title` | Mon portfolio |
| `career.portfolio.subtitle` | Vos projets, en images et en mots, sur une page à partager. |
| `career.portfolio.locked` | Disponible avec {plan} |
| `career.portfolio.enrichedLocked` | Présentation enrichie · Disponible avec {plan} |
| `career.portfolio.project.add` | Ajouter un projet |
| `career.portfolio.project.title` | Titre du projet |
| `career.portfolio.project.context` | Contexte |
| `career.portfolio.project.role` | Votre rôle |
| `career.portfolio.project.result` | Résultat |
| `career.portfolio.project.skills` | Compétences mobilisées |
| `career.portfolio.project.media` | Images, vidéos ou documents |
| `career.portfolio.project.link` | Lien externe |
| `career.portfolio.project.date` | Date |
| `career.portfolio.project.delete.confirm` | Supprimer ce projet du portfolio ? |
| `career.portfolio.empty` | Ajoutez votre premier projet : un travail d'études, une mission, un projet associatif. |
| `career.portfolio.public.text` | Page publique |
| `career.portfolio.public.on` | Votre portfolio est visible à cette adresse : {url} |
| `career.portfolio.public.off` | Votre portfolio n'est visible que par vous. |
| `career.portfolio.public.toggle` | Rendre la page publique |
| `career.portfolio.public.copy` | Copier le lien |
| `career.portfolio.layout` | Mise en page |
| `career.portfolio.cover` | Image de couverture |
| `career.portfolio.intro` | Texte de présentation |
| `career.portfolio.preview` | Voir la page |
| `career.portfolio.saved` | Portfolio enregistré. |
| `career.portfolio.deleted` | Projet supprimé. |
| `career.portfolio.limit` | Vous avez atteint {max} projets. Supprimez-en un pour en ajouter un autre. |
| `career.portfolio.error` | Vérifiez les informations du projet : les liens commencent par https://. |
| `career.portfolio.projects` | Projets |
| `career.portfolio.count` | {count, plural, =0 {Aucun projet} one {# projet} other {# projets}} |
| `career.portfolio.publicBadge` | Page publique |
| `career.portfolio.privateBadge` | Page privée |
| `career.portfolio.settings` | Présentation |
| `career.portfolio.saveSettings` | Enregistrer la présentation |
| `career.portfolio.layoutOption.classic` | Classique |
| `career.portfolio.layoutOption.grid` | Grille |
| `career.portfolio.accent.text` | Couleur d'accent |
| `career.portfolio.accent.sapin` | Sapin |
| `career.portfolio.accent.feuille` | Feuille |
| `career.portfolio.accent.ardoise` | Ardoise |
| `career.portfolio.public.privacy` | La page publique montre votre nom, votre titre, votre présentation et vos projets. Rien d'autre de votre profil. |
| `career.portfolio.project.skillsHint` | Séparez les compétences par des virgules. |
| `career.portfolio.project.mediaHint` | Jusqu'à 3 adresses https (images, vidéos ou documents en ligne), séparées par un espace. |
| `career.portfolio.project.save` | Enregistrer le projet |
| `career.portfolio.project.edit` | Modifier ce projet |
| `career.portfolio.project.delete.cta` | Supprimer |
| `career.portfolio.page.title` | Portfolio de {name} |
| `career.portfolio.page.open` | Voir le projet |
| `career.portfolio.page.media` | Médias |
| `career.portfolio.page.footer` | Portfolio publié sur Jumanly |
| `career.portfolio.page.empty` | Aucun projet publié pour l'instant. |
| `career.portfolio.page.unavailable` | Ce portfolio n'est pas disponible. Son auteur l'a peut-être retiré. |
| `career.portfolio.page.seo` | Portfolio · Jumanly |
| `career.portfolio.page.eyebrow` | Portfolio |
| `career.portfolio.page.projects` | Projets |
| `career.portfolio.page.count` | {count, plural, one {# projet} other {# projets}} |
| `career.portfolio.page.files` | {count, plural, one {# fichier} other {# fichiers}} |
| `career.portfolio.page.share` | Partager |
| `career.portfolio.page.shareCopied` | Lien copié |

---

### `/app/jobs` · Recherche d'offres

*Trouver vite les offres pertinentes et rappeler que candidater est gratuit.*

| Clé | Texte |
|---|---|
| `talent.jobs.search.eyebrow` | Jobs · Emplois, stages et missions |
| `talent.jobs.search.title` | {count, plural, =0 {Aucune offre pour vous} one {# offre pour vous} other {# offres pour vous}} |
| `talent.jobs.search.keyword.label` | Poste, compétence ou entreprise |
| `talent.jobs.search.keyword.placeholder` | Ex. : Analyste de données |
| `talent.jobs.search.location.label` | Lieu |
| `talent.jobs.search.location.placeholder` | Ville ou pays |
| `talent.jobs.search.radius` | {km} km |
| `talent.jobs.search.submit` | Rechercher |
| `talent.jobs.search.tab.all` | Tous ({count}) |
| `talent.jobs.search.tab.recommended` | Recommandées |
| `talent.jobs.search.tab.recent` | Récentes |
| `talent.jobs.search.tab.forYou` | Pour vous |
| `talent.jobs.search.tab.saved` | Enregistrées · {count} |
| `talent.jobs.search.general` | Sélection générale, non personnalisée : ajoutez vos compétences pour voir les offres qui vous correspondent. |
| `talent.jobs.search.personalise` | Personnaliser |
| `talent.jobs.search.closedHidden` | Les offres clôturées ne s'affichent plus. |
| `talent.jobs.filters.text` | Filtres |
| `talent.jobs.filters.count` | Filtres · {count} |
| `talent.jobs.filters.reset` | Réinitialiser |
| `talent.jobs.filters.apply` | Afficher {count, plural, one {# offre} other {# offres}} |
| `talent.jobs.filter.contract` | Type de contrat |
| `talent.jobs.filter.remote.text` | Télétravail |
| `talent.jobs.filter.remote.onsite` | Sur site |
| `talent.jobs.filter.remote.hybrid` | Hybride |
| `talent.jobs.filter.remote.remote` | Télétravail |
| `talent.jobs.filter.experience.text` | Expérience |
| `talent.jobs.filter.experience.none` | Sans expérience |
| `talent.jobs.filter.experience.junior` | Moins de 2 ans |
| `talent.jobs.filter.experience.mid` | 2 à 5 ans |
| `talent.jobs.filter.experience.senior` | Plus de 5 ans |
| `talent.jobs.filter.salary.text` | Salaire |
| `talent.jobs.filter.salary.min` | Minimum {amount} {currency} par mois |
| `talent.jobs.filter.salary.disclosed` | Salaire indiqué uniquement |
| `talent.jobs.filter.sector` | Secteur |
| `talent.jobs.filter.language` | Langue |
| `talent.jobs.filter.country` | Pays |
| `talent.jobs.filter.posted.text` | Date de publication |
| `talent.jobs.filter.posted.24h` | Dernières 24 heures |
| `talent.jobs.filter.posted.7d` | 7 derniers jours |
| `talent.jobs.filter.posted.30d` | 30 derniers jours |
| `talent.jobs.filter.compatibility.text` | Compatibilité minimale |
| `talent.jobs.filter.compatibility.value` | {score} % et plus |
| `talent.jobs.filter.verified` | Entreprises vérifiées uniquement |
| `talent.jobs.sort.text` | Trier : |
| `talent.jobs.sort.compatibility` | Compatibilité |
| `talent.jobs.sort.recent` | Plus récentes |
| `talent.jobs.sort.salary` | Salaire |
| `talent.jobs.sort.distance` | Distance |
| `talent.jobs.alert.title` | Créez une alerte pour cette recherche |
| `talent.jobs.alert.body` | Recevez les nouvelles offres par notification ou par e-mail. |
| `talent.jobs.alert.cta` | Activer l'alerte |
| `talent.jobs.alert.created` | Alerte créée. Nous vous préviendrons des nouvelles offres. |
| `talent.jobs.alert.manage` | Gérer mes alertes |
| `talent.jobs.alert.frequency.text` | Fréquence |
| `talent.jobs.alert.frequency.instant` | Dès qu'une offre paraît |
| `talent.jobs.alert.frequency.daily` | Une fois par jour |
| `talent.jobs.alert.frequency.weekly` | Une fois par semaine |
| `talent.jobs.alert.delete.confirm` | Supprimer cette alerte ? |
| `talent.jobs.sidebar.applications.text` | Vos candidatures |
| `talent.jobs.sidebar.applications.link` | Suivi |
| `talent.jobs.sidebar.sent` | Envoyées |
| `talent.jobs.sidebar.viewed` | Consultées par le recruteur |
| `talent.jobs.sidebar.interviews` | Entretiens |
| `talent.jobs.sidebar.offers` | Offres reçues |
| `talent.jobs.sidebar.free` | Les candidatures sont toujours gratuites. |
| `talent.jobs.sidebar.rate` | {value} sur {total} |
| `talent.jobs.sidebar.chart` | Parcours de vos candidatures, de l'envoi à l'offre |
| `talent.jobs.sidebar.empty` | Pas encore de candidature. Votre suivi s'affichera ici dès la première. |
| `talent.jobs.sidebar.emptyCta` | Trouver une offre |
| `talent.jobs.sidebar.companies.text` | Entreprises qui recrutent |
| `talent.jobs.sidebar.companies.meta` | {count, plural, one {# offre} other {# offres}} · {sector} |
| `talent.jobs.sidebar.follow` | Suivre |
| `talent.jobs.sidebar.following` | Suivie |
| `talent.jobs.search.empty.title` | Aucune offre ne correspond à votre recherche. |
| `talent.jobs.search.empty.body` | Élargissez le lieu, retirez un filtre ou créez une alerte pour être prévenu. |
| `talent.jobs.search.empty.cta` | Effacer les filtres |
| `talent.jobs.search.loading` | Recherche des offres… |
| `talent.jobs.search.loadMore` | Voir plus d'offres |
| `talent.jobs.seo` | Offres · Jumanly |
| `talent.jobs.search.tabs` | Vues des offres |
| `talent.jobs.filters.remove` | Retirer le filtre : {label} |
| `talent.jobs.filters.close` | Fermer les filtres |
| `talent.jobs.filter.any` | Peu importe |
| `talent.jobs.sidebar.companies.count` | {count, plural, one {# offre} other {# offres}} |
| `talent.jobs.aiPanel.job` | {job} · {company} |
| `talent.jobs.aiPanel.updated` | Calcul expliqué, mis à jour {time} |
| `talent.jobs.search.previous` | Page précédente |
| `talent.jobs.search.next` | Page suivante |

### `/app/jobs` · Carte d'offre

*Résumer une offre en un coup d'œil, avec sa compatibilité.*

| Clé | Texte |
|---|---|
| `talent.jobs.card.new` | Nouveau |
| `talent.jobs.card.verified` | Entreprise vérifiée |
| `talent.jobs.card.location` | {city} · {workMode} |
| `talent.jobs.card.salary.text` | {min} à {max} {currency}/mois |
| `talent.jobs.card.salary.single` | {amount} {currency}/mois |
| `talent.jobs.card.salary.undisclosed` | Salaire non communiqué |
| `talent.jobs.card.compatibility.text` | {score} % compatible |
| `talent.jobs.card.compatibility.aria` | Compatibilité {score} sur 100, {band} |
| `talent.jobs.card.posted` | {time, relative} |
| `talent.jobs.card.closingSoon` | Clôture {time, relative} |
| `talent.jobs.card.closingIn` | Clôture {time} |
| `talent.jobs.card.applied` | Candidature envoyée |
| `talent.jobs.card.save` | Enregistrer l'offre |
| `talent.jobs.card.unsave` | Retirer des offres enregistrées |
| `talent.jobs.card.saved.toast` | Offre enregistrée. |
| `talent.jobs.card.unsaved.toast` | Offre retirée de vos enregistrements. |
| `talent.jobs.card.hide` | Masquer cette offre |
| `talent.jobs.card.contract.cdi` | CDI |
| `talent.jobs.card.contract.cdd` | CDD {months} mois |
| `talent.jobs.card.contract.internship` | Stage {months} mois |
| `talent.jobs.card.contract.freelance` | Mission |
| `talent.jobs.card.contract.apprenticeship` | Alternance |
| `talent.jobs.card.contract.volunteer` | Volontariat |
| `talent.jobs.card.contract.partTime` | Temps partiel |

### `/app/jobs/[slug]` · Détail de l'offre

*Tout comprendre avant de postuler : missions, critères, processus et compatibilité expliquée.*

| Clé | Texte |
|---|---|
| `talent.jobs.detail.back` | Retour aux {count} offres |
| `talent.jobs.detail.eyebrow` | Détail de l'offre |
| `talent.jobs.detail.posted` | Publiée {time, relative} |
| `talent.jobs.detail.publishedAgo` | Publiée {time} |
| `talent.jobs.detail.facts.experience.min` | {min, plural, =0 {Sans expérience} one {# an minimum} other {# ans minimum}} |
| `talent.jobs.detail.applicants` | {count, plural, one {# candidat} other {# candidats}} |
| `talent.jobs.detail.apply` | Postuler gratuitement |
| `talent.jobs.detail.applied.text` | Candidature envoyée le {date, date, medium} |
| `talent.jobs.detail.applied.track` | Suivre ma candidature |
| `talent.jobs.detail.closed` | Cette offre n'accepte plus de candidatures. |
| `talent.jobs.detail.save` | Enregistrer |
| `talent.jobs.detail.share` | Partager |
| `talent.jobs.detail.report` | Signaler cette offre |
| `talent.jobs.detail.facts.contract` | Contrat |
| `talent.jobs.detail.facts.salary` | Salaire |
| `talent.jobs.detail.facts.experience.text` | Expérience |
| `talent.jobs.detail.facts.experience.value` | {min} à {max} ans |
| `talent.jobs.detail.facts.start` | Début |
| `talent.jobs.detail.facts.location` | Lieu |
| `talent.jobs.detail.facts.deadline` | Date limite |
| `talent.jobs.detail.missions` | Vos missions |
| `talent.jobs.detail.profile` | Profil recherché |
| `talent.jobs.detail.skills.required` | Compétences requises |
| `talent.jobs.detail.skills.preferred` | Compétences souhaitées |
| `talent.jobs.detail.skills.title` | Compétences demandées |
| `talent.jobs.detail.skills.owned` | Coche : déjà dans votre profil. |
| `talent.jobs.detail.tailor.text` | Adapter mon CV à cette offre |
| `talent.jobs.detail.tailor.line` | À partir de votre CV principal |
| `talent.jobs.detail.knockout.text` | Critères indispensables |
| `talent.jobs.detail.knockout.hint` | Le recruteur a indiqué ces critères comme indispensables. Vous pouvez quand même postuler : c'est lui qui décide. |
| `talent.jobs.detail.benefits` | Avantages |
| `talent.jobs.detail.process.text` | Processus de recrutement |
| `talent.jobs.detail.process.step` | {number} · {name} |
| `talent.jobs.detail.compatibility.title` | Compatibilité |
| `talent.jobs.detail.compatibility.updated` | Calcul expliqué, mis à jour {time, relative} |
| `talent.jobs.detail.compatibility.why` | Pourquoi ? |
| `talent.jobs.detail.compatibility.gap` | À renforcer : {skills}. |
| `talent.jobs.detail.compatibility.course.text` | La formation « {courseTitle} » ({hours} h) ferait passer votre score à {newScore} %. |
| `talent.jobs.detail.compatibility.course.cta` | Voir la formation |
| `talent.jobs.detail.compatibility.publicHint` | Connectez-vous pour voir votre compatibilité avec cette offre. |
| `talent.jobs.detail.compatibility.see` | Voir le détail du calcul |
| `talent.jobs.detail.compatibility.optedOutCta` | Réactiver dans mes paramètres |
| `talent.jobs.detail.compatibility.incompleteCta` | Ajouter mes compétences |
| `talent.jobs.detail.recruiter.text` | Recruteur |
| `talent.jobs.detail.recruiter.responseTime` | Répond en {days, plural, one {# jour} other {# jours}} en moyenne |
| `talent.jobs.detail.company.title` | L'entreprise |
| `talent.jobs.detail.company.meta` | {sector} · {size} employés |
| `talent.jobs.detail.company.see` | Voir l'entreprise |
| `talent.jobs.detail.company.otherJobs` | {count, plural, one {# autre offre} other {# autres offres}} |
| `talent.jobs.detail.similar` | Offres similaires |

### `/app/jobs/[slug]` · Postuler (1 ou 2 étapes)

*Postuler en une étape si le profil est prêt, en deux si l'offre demande une lettre ou des réponses.*

| Clé | Texte |
|---|---|
| `talent.jobs.apply.heading` | Postuler |
| `talent.jobs.apply.title` | Postuler à {jobTitle} |
| `talent.jobs.apply.subtitle` | chez {company} |
| `talent.jobs.apply.free` | Candidature gratuite, quel que soit votre forfait. |
| `talent.jobs.apply.step.text` | Étape {current} sur {total} |
| `talent.jobs.apply.step.documents` | Vos documents |
| `talent.jobs.apply.step.questions` | Questions du recruteur |
| `talent.jobs.apply.step.review` | Vérification |
| `talent.jobs.apply.cv.text` | CV envoyé |
| `talent.jobs.apply.cv.select` | Choisir un CV |
| `talent.jobs.apply.cv.upload` | Téléverser un autre CV |
| `talent.jobs.apply.cv.none` | Vous n'avez pas encore de CV. Créez-le en quelques minutes ou téléversez un fichier. |
| `talent.jobs.apply.cv.create` | Créer mon CV |
| `talent.jobs.apply.letter.text` | Lettre de motivation |
| `talent.jobs.apply.letter.optional` | Facultative |
| `talent.jobs.apply.letter.required` | Demandée par le recruteur |
| `talent.jobs.apply.letter.write` | Écrire ici |
| `talent.jobs.apply.letter.upload` | Joindre un fichier |
| `talent.jobs.apply.letter.choose` | Choisir un document enregistré |
| `talent.jobs.apply.letter.placeholder` | Quelques lignes pour dire pourquoi ce poste vous intéresse. |
| `talent.jobs.apply.questions.intro` | Le recruteur souhaite en savoir un peu plus. |
| `talent.jobs.apply.questions.required` | Réponse obligatoire |
| `talent.jobs.apply.profileShared` | Le recruteur verra votre profil professionnel complet, même si votre profil est privé. |
| `talent.jobs.apply.knockout.warning` | Vous ne remplissez pas tous les critères indispensables ({criteria}). Vous pouvez quand même postuler : le recruteur examine chaque candidature. |
| `talent.jobs.apply.next` | Continuer |
| `talent.jobs.apply.back` | Retour |
| `talent.jobs.apply.submit` | Envoyer ma candidature |
| `talent.jobs.apply.submitting` | Envoi en cours… |
| `talent.jobs.apply.success.title` | Candidature envoyée ! |
| `talent.jobs.apply.success.body` | {company} a bien reçu votre candidature. Vous serez prévenu à chaque changement d'étape. |
| `talent.jobs.apply.success.track` | Suivre ma candidature |
| `talent.jobs.apply.success.continue` | Voir d'autres offres |
| `talent.jobs.apply.error` | Votre candidature n'a pas pu être envoyée. Vos réponses sont conservées, réessayez. |
| `talent.jobs.apply.already` | Vous avez déjà postulé à cette offre. |
| `talent.jobs.apply.cancel.confirm` | Abandonner la candidature ? Vos réponses ne seront pas enregistrées. |
| `talent.jobs.apply.cv.profileOnly` | Envoyer seulement mon profil |
| `talent.jobs.apply.flow.title` | Candidature |
| `talent.jobs.apply.flow.job` | {job} · {company} |
| `talent.jobs.apply.flow.steps` | Étapes de la candidature |
| `talent.jobs.apply.flow.step.cv` | CV |
| `talent.jobs.apply.flow.step.lettre` | Lettre |
| `talent.jobs.apply.flow.step.verification` | Vérification |
| `talent.jobs.apply.flow.stepState.done` | , terminée |
| `talent.jobs.apply.flow.stepState.current` | , en cours |
| `talent.jobs.apply.flow.cv.title` | Quel CV envoyer ? |
| `talent.jobs.apply.flow.cv.updated` | Modifié le {date, date, long} |
| `talent.jobs.apply.flow.cv.primary` | CV principal · {line} |
| `talent.jobs.apply.flow.cv.profile` | Mon profil Jumanly seul |
| `talent.jobs.apply.flow.cv.profileLine` | Sans CV joint |
| `talent.jobs.apply.flow.cv.tailor` | Adapter ce CV à l'offre avant l'envoi |
| `talent.jobs.apply.flow.cv.tailorLine` | Une copie est créée, l'original ne change pas |
| `talent.jobs.apply.flow.letter.title` | Votre lettre de motivation |
| `talent.jobs.apply.flow.letter.label` | Lettre de motivation (facultative) |
| `talent.jobs.apply.flow.review.ready` | Votre candidature est prête |
| `talent.jobs.apply.flow.review.readyLine` | Touchez « Modifier » pour changer un bloc. |
| `talent.jobs.apply.flow.review.checked` | Vérifié |
| `talent.jobs.apply.flow.review.cv` | CV |
| `talent.jobs.apply.flow.review.change` | Changer |
| `talent.jobs.apply.flow.review.letter` | Lettre de motivation |
| `talent.jobs.apply.flow.review.noLetter` | Pas de lettre : elle est facultative. |
| `talent.jobs.apply.flow.review.words` | {count, plural, one {# mot} other {# mots}} |
| `talent.jobs.apply.flow.review.editLetter` | Modifier la lettre |
| `talent.jobs.apply.flow.review.profile` | Profil partagé |
| `talent.jobs.apply.flow.review.editProfile` | Modifier mon profil |
| `talent.jobs.apply.flow.review.moreSkills` | +{count} |
| `talent.jobs.apply.flow.review.seenBy` | Vu par ce recruteur seulement |
| `talent.jobs.apply.flow.review.contact` | Contact |
| `talent.jobs.apply.flow.review.edit` | Modifier |
| `talent.jobs.apply.flow.review.consent` | J'accepte que {company} consulte ma candidature. |
| `talent.jobs.apply.flow.saved` | Brouillon enregistré à {time, time, short} |
| `talent.jobs.apply.flow.quit` | Quitter |
| `talent.jobs.apply.flow.continue` | Continuer |
| `talent.jobs.apply.flow.previous` | Étape précédente |
| `talent.jobs.apply.flow.kept` | Brouillon gardé. Vous pourrez reprendre votre candidature depuis Pour moi ou cette offre. |
| `talent.jobs.apply.flow.resume` | Reprendre ma candidature |
| `talent.jobs.apply.flow.error.title` | Votre candidature n'est pas encore envoyée |
| `talent.jobs.apply.flow.error.body` | Connexion coupée. Votre brouillon est gardé. |
| `talent.jobs.apply.flow.error.state` | État |
| `talent.jobs.apply.flow.error.draft` | Brouillon, non envoyé |
| `talent.jobs.apply.flow.error.lastSave` | Dernier enregistrement |
| `talent.jobs.apply.flow.error.lastSaveValue` | {date, date, medium} à {date, time, short} |
| `talent.jobs.apply.flow.error.later` | Plus tard |
| `talent.jobs.apply.flow.error.retry` | Réessayer |
| `talent.jobs.apply.flow.sent.received` | Reçue par {company}. |
| `talent.jobs.apply.flow.sent.track` | Suivre ma candidature |
| `talent.jobs.apply.flow.sent.trackLine` | Dans Suivi, avec son historique |
| `talent.jobs.apply.flow.sent.prepare` | Préparer l'entretien |
| `talent.jobs.apply.flow.sent.prepareLine` | Simulation et conseils |
| `talent.jobs.apply.flow.sent.explore` | Continuer à explorer les offres |
| `talent.jobs.detail.seo` | {jobTitle} · Jumanly |
| `talent.jobs.detail.backToJobs` | Toutes les offres |

### `/app/jobs/candidatures` · Mes candidatures

*Savoir où en est chaque candidature, sans avoir à relancer.*

| Clé | Texte |
|---|---|
| `talent.jobs.applications.title` | Mes candidatures |
| `talent.jobs.applications.subtitle` | Suivez chaque étape. Vous êtes prévenu à chaque changement. |
| `talent.jobs.applications.tab.active` | En cours ({count}) |
| `talent.jobs.applications.tab.closed` | Terminées ({count}) |
| `talent.jobs.applications.tab.all` | Toutes |
| `talent.jobs.applications.tab.empty` | Aucune candidature dans cet onglet. |
| `talent.jobs.applications.sentOn` | Envoyée le {date, date, medium} |
| `talent.jobs.applications.updated` | Mise à jour {time} |
| `talent.jobs.applications.status.sent` | Envoyée |
| `talent.jobs.applications.status.viewed` | Consultée par le recruteur |
| `talent.jobs.applications.status.shortlisted` | Présélectionnée |
| `talent.jobs.applications.status.test` | Test à passer |
| `talent.jobs.applications.status.interview` | Entretien |
| `talent.jobs.applications.status.offer` | Offre reçue |
| `talent.jobs.applications.status.hired` | Recruté |
| `talent.jobs.applications.status.notSelected` | Non retenue |
| `talent.jobs.applications.status.withdrawn` | Retirée |
| `talent.jobs.applications.status.jobClosed` | Offre clôturée |
| `talent.jobs.applications.status.help` | Les étapes affichées sont celles que le recruteur a définies. |
| `talent.jobs.applications.timeline.text` | Historique |
| `talent.jobs.applications.timeline.event` | {date, date, medium} · {event} |
| `talent.jobs.applications.messages` | Messages ({count}) |
| `talent.jobs.applications.openConversation` | Ouvrir la conversation |
| `talent.jobs.applications.viewJob` | Voir l'offre |
| `talent.jobs.applications.viewSentCv` | Voir le CV envoyé |
| `talent.jobs.applications.withdraw.text` | Retirer ma candidature |
| `talent.jobs.applications.withdraw.confirm.title` | Retirer votre candidature ? |
| `talent.jobs.applications.withdraw.confirm.body` | Le recruteur sera informé. Vous ne pourrez pas postuler de nouveau à cette offre. |
| `talent.jobs.applications.withdraw.confirm.cta` | Retirer |
| `talent.jobs.applications.withdrawn.toast` | Candidature retirée. |
| `talent.jobs.applications.notSelected.note` | Cette candidature n'a pas abouti. Ce n'est pas un jugement sur votre valeur. Continuez : d'autres offres vous correspondent. |
| `talent.jobs.applications.notSelected.cta` | Voir les offres compatibles |
| `talent.jobs.applications.hired.note` | Félicitations, {firstName} ! Bonne réussite dans ce nouveau poste. |
| `talent.jobs.applications.empty.text` | Vous n'avez pas encore postulé. Les candidatures sont gratuites et illimitées. |
| `talent.jobs.applications.empty.cta` | Trouver une offre |
| `talent.jobs.applications.reportError` | Signaler une erreur sur mon score |
| `talent.jobs.applications.seo` | Mes candidatures · Jumanly |
| `talent.jobs.applications.event.submitted` | Candidature envoyée |
| `talent.jobs.applications.event.withdrawn` | Candidature retirée |
| `talent.jobs.applications.event.stage_changed` | Nouvelle étape : {stage} |
| `talent.jobs.applications.event.decision` | Décision du recruteur |
| `talent.jobs.applications.tracker` | Étapes de la candidature |
| `talent.jobs.applications.toggle` | Afficher le détail : {job} |
| `talent.jobs.applications.score` | Score au moment de la candidature : {score} %, {band} |
| `talent.jobs.applications.ai.title` | {count, plural, one {# nouvelle offre très compatible avec votre profil.} other {# nouvelles offres très compatibles avec votre profil.}} |
| `talent.jobs.applications.ai.job` | {job} · {company} · {score} % compatible |
| `talent.jobs.applications.ai.reason` | {criteria} : ce que l'offre demande correspond à votre profil. |
| `talent.jobs.applications.review.title` | Le score vous semble faux ? |
| `talent.jobs.applications.review.body` | Une personne de l'équipe Jumanly vérifiera le calcul. Votre candidature reste examinée pendant la révision. |
| `talent.jobs.applications.more` | Plus d'actions |

### `/app/jobs/enregistrees` · Offres enregistrées

*Garder sous la main les offres à revoir.*

| Clé | Texte |
|---|---|
| `talent.jobs.saved.title` | Offres enregistrées |
| `talent.jobs.saved.count` | {count, plural, one {# offre enregistrée} other {# offres enregistrées}} |
| `talent.jobs.saved.closingSoon` | Clôture bientôt |
| `talent.jobs.saved.closed` | Offre clôturée |
| `talent.jobs.saved.remove` | Retirer |
| `talent.jobs.saved.apply` | Postuler gratuitement |
| `talent.jobs.saved.empty.text` | Aucune offre enregistrée. Touchez l'icône d'enregistrement sur une offre pour la retrouver ici. |
| `talent.jobs.saved.empty.cta` | Rechercher des offres |
| `talent.jobs.saved.clearClosed` | Retirer les offres clôturées |
| `talent.jobs.saved.soonCount` | {count, plural, one {# clôture bientôt} other {# clôturent bientôt}} |
| `talent.jobs.saved.sort.recent` | Ajoutées récemment |
| `talent.jobs.saved.sort.deadline` | Date limite |
| `talent.jobs.saved.closedNote` | Cette offre n'accepte plus de candidatures. |
| `talent.jobs.saved.seo` | Offres enregistrées · Jumanly |

---

### `/app/messages` · Messagerie Connect

*Échanger avec les recruteurs dans un cadre lié aux candidatures, sûr et privé.*

#### Liste des conversations

| Clé | Texte |
|---|---|
| `connect.eyebrow` | Messagerie · {count, plural, =0 {Tout est lu} one {# non lu} other {# non lus}} |
| `connect.title` | Connect |
| `connect.resume` | Reprendre avec {name} |
| `connect.list.title` | Messages |
| `connect.list.search.placeholder` | Rechercher |
| `connect.list.filter.all` | Tous |
| `connect.list.filter.unread` | Non lus |
| `connect.list.filter.recruiters` | Recruteurs |
| `connect.list.filter.requests` | Demandes |
| `connect.list.filter.archived` | Archivés |
| `connect.list.item.role` | {company} · {role} |
| `connect.list.item.you` | Vous : {message} |
| `connect.list.item.attachment` | Pièce jointe |
| `connect.list.item.invitation` | Invitation à un entretien |
| `connect.list.item.documentRequest` | Document demandé |
| `connect.list.item.slot` | Créneau proposé |
| `connect.list.item.decision` | Décision sur la candidature |
| `connect.list.unread` | {count, plural, one {# non lu} other {# non lus}} |
| `connect.list.filters` | Filtrer les conversations |
| `connect.list.pick` | Choisissez une conversation pour la lire. |
| `connect.side.file.receivedPlain` | Reçu |
| `connect.thread.more` | Plus d'actions |
| `connect.list.empty.text` | Aucune conversation. Elles s'ouvrent quand vous candidatez ou acceptez une mise en relation. |
| `connect.list.empty.cta` | Voir les offres |
| `connect.list.archive` | Archiver |
| `connect.list.unarchive` | Désarchiver |
| `connect.list.markUnread` | Marquer comme non lu |

#### Conversation

| Clé | Texte |
|---|---|
| `connect.thread.online` | En ligne |
| `connect.thread.lastSeen` | Vu {time, relative} |
| `connect.thread.today` | Aujourd'hui |
| `connect.thread.yesterday` | Hier |
| `connect.thread.composer.placeholder` | Écrire un message… |
| `connect.thread.composer.send` | Envoyer |
| `connect.thread.composer.attach` | Joindre un fichier |
| `connect.thread.composer.closed` | Cette conversation est fermée. Vous pouvez encore la lire. |
| `connect.thread.sent` | Envoyé |
| `connect.thread.read` | Lu |
| `connect.thread.failed` | Non envoyé. Touchez pour réessayer. |
| `connect.thread.privacy` | Vos échanges sont privés : seuls vous et l'équipe de recrutement les voyez. |
| `connect.thread.safety` | Jumanly ne vous demandera jamais de payer pour un entretien ou un emploi. Signalez toute demande de ce type. |
| `connect.thread.loadEarlier` | Messages précédents |
| `connect.side.verified` | Recruteur vérifié |
| `connect.side.linkedApplication` | Candidature liée |
| `connect.side.stage` | Étape : {stage} |
| `connect.side.files.text` | Fichiers partagés |
| `connect.side.file.sent` | Envoyé · {size} |
| `connect.side.file.received` | Reçu · {size} |
| `connect.side.files.empty` | Aucun fichier partagé. |
| `connect.side.viewApplication` | Voir ma candidature |

#### Invitations et rendez-vous

| Clé | Texte |
|---|---|
| `connect.invite.title` | Invitation à un entretien |
| `connect.invite.format` | {mode} · {minutes} min |
| `connect.invite.mode.video` | Entretien vidéo |
| `connect.invite.mode.onsite` | Entretien sur place |
| `connect.invite.mode.call` | Entretien en visio, audio seulement |
| `connect.invite.date` | {date, date, full} |
| `connect.invite.time` | {time} (heure de {timezone}) |
| `connect.invite.location` | Adresse : {address} |
| `connect.invite.link` | Le lien de connexion sera visible ici {hours, plural, one {# heure} other {# heures}} avant le rendez-vous. |
| `connect.invite.join` | Rejoindre l'entretien |
| `connect.invite.accept` | Accepter |
| `connect.invite.propose.text` | Proposer un autre créneau |
| `connect.invite.decline.text` | Décliner |
| `connect.invite.slots` | Choisissez un créneau |
| `connect.invite.accepted` | Rendez-vous confirmé. Il est ajouté à votre tableau de bord. |
| `connect.invite.status.pending` | En attente de votre réponse |
| `connect.invite.status.accepted` | Confirmé |
| `connect.invite.status.declined` | Décliné |
| `connect.invite.status.rescheduleRequested` | Nouveau créneau proposé |
| `connect.invite.status.canceled` | Annulé |
| `connect.invite.status.past` | Terminé |
| `connect.invite.addToCalendar` | Ajouter à mon agenda |
| `connect.invite.propose.title` | Proposer d'autres créneaux |
| `connect.invite.propose.hint` | Proposez jusqu'à trois créneaux. |
| `connect.invite.propose.message` | Message (facultatif) |
| `connect.invite.propose.send` | Envoyer la proposition |
| `connect.invite.decline.confirm.title` | Décliner cet entretien ? |
| `connect.invite.decline.confirm.body` | Le recruteur sera prévenu. Vous pouvez ajouter un message. |
| `connect.invite.reminder` | Rappel : entretien {time, relative} |
| `connect.invite.chosen` | Votre créneau : {date, date, full} à {time} (heure de {timezone}) |
| `connect.invite.canceled` | Le recruteur a annulé cet entretien. |
| `connect.invite.declined` | Vous avez décliné cet entretien. |
| `connect.invite.proposed` | Vous avez proposé : {slots}. Le recruteur va vous répondre. |
| `connect.invite.done` | Réponse envoyée. |
| `connect.invite.error` | Choisissez un créneau à venir. |
| `connect.invite.slot` | Créneau {number} |
| `connect.thread.application` | Candidature · {job} |
| `connect.pill.pending` | Entretien proposé · {count, plural, one {# créneau} other {# créneaux}} |
| `connect.pill.reschedule` | Autres moments proposés |
| `connect.pill.confirmed` | Entretien confirmé · {date} à {time} |
| `connect.pill.closed` | Entretien clos |
| `connect.pill.see` | Voir |
| `connect.templates.use` | Utiliser un modèle |
| `connect.file.kind` | PDF |
| `connect.file.meta.cv` | CV · PDF |
| `connect.file.meta.text` | Document · PDF |
| `connect.file.download` | Télécharger |
| `connect.slot.title` | Créneau proposé · {time} |
| `connect.slot.zone` | Heure de {city} |
| `connect.decision.hired` | Candidature retenue |
| `connect.decision.rejected` | Candidature non retenue |
| `connect.decision.signer` | {name} · Recrutement |
| `connect.decision.bounce.title` | Pour rebondir |
| `connect.decision.bounce.offers` | {count, plural, one {# offre proche} other {# offres proches}} |
| `connect.decision.bounce.train` | S'entraîner |
| `connect.decision.bounce.trainLine` | Simulation d'entretien |
| `connect.plus.title` | Envoyer |
| `connect.plus.close` | Fermer |
| `connect.plus.back` | Retour |
| `connect.plus.open` | Envoyer un créneau, un document ou un lien |
| `connect.plus.creneau.title` | Proposer un créneau |
| `connect.plus.creneau.label` | Un créneau |
| `connect.plus.creneau.date` | Date |
| `connect.plus.creneau.time` | Heure |
| `connect.plus.creneau.note` | Un mot (facultatif) |
| `connect.plus.cv.title` | Envoyer un CV |
| `connect.plus.cv.label` | Mon CV |
| `connect.plus.cv.empty` | Créer mon premier CV |
| `connect.plus.lettre.title` | Envoyer une lettre |
| `connect.plus.lettre.label` | Ma lettre |
| `connect.plus.lettre.empty` | Écrire une lettre dans Career |
| `connect.plus.document.title` | Envoyer un document |
| `connect.plus.document.label` | Un document |
| `connect.plus.document.empty` | Créer un document dans Career |
| `connect.plus.lien.title` | Envoyer un lien |
| `connect.plus.lien.label` | Un lien |
| `connect.plus.lien.url` | Adresse du lien |
| `connect.plus.lien.placeholder` | https:// |
| `connect.plus.lien.text` | Texte du lien (facultatif) |
| `connect.plus.ai.label` | Relance IA |
| `connect.plus.ai.soon` | Bientôt disponible |
| `connect.plus.updated` | Modifié le {date, date, long} |
| `connect.plus.copy` | Une copie est envoyée : vos modifications suivantes ne la changent pas. |
| `connect.plus.send` | Envoyer |

#### Demandes de documents

| Clé | Texte |
|---|---|
| `connect.docRequest.title` | Document demandé : {documentName} |
| `connect.docRequest.due` | À déposer avant le {date, date, long} |
| `connect.docRequest.upload` | Déposer |
| `connect.docRequest.chooseExisting` | Choisir dans mes documents |
| `connect.docRequest.status.pending` | À déposer |
| `connect.docRequest.status.submitted` | Déposé le {date, date, medium} |
| `connect.docRequest.status.overdue` | Échéance dépassée |
| `connect.docRequest.submitted` | Document envoyé au recruteur. |
| `connect.docRequest.privacy` | Ce document n'est visible que par l'équipe qui recrute pour cette offre. |

#### Demandes de mise en relation (côté talent)

| Clé | Texte |
|---|---|
| `connect.contactRequest.title` | {company} souhaite échanger avec vous |
| `connect.contactRequest.body` | {recruiterName} a trouvé votre profil dans le vivier de talents. Vous décidez si vous souhaitez échanger. |
| `connect.contactRequest.job` | À propos de : {jobTitle} |
| `connect.contactRequest.message` | Son message |
| `connect.contactRequest.anonymousNote` | Votre profil est anonyme. Si vous acceptez, votre nom et votre photo deviennent visibles pour {company}. |
| `connect.contactRequest.accept` | Accepter et échanger |
| `connect.contactRequest.decline` | Décliner |
| `connect.contactRequest.block` | Ne plus recevoir de demandes de {company} |
| `connect.contactRequest.accepted` | Vous pouvez maintenant échanger avec {company}. |
| `connect.contactRequest.declined` | Demande déclinée. {company} en est informé, sans détail. |
| `connect.contactRequest.expires` | Sans réponse, la demande expire {time, relative}. |
| `connect.contactRequest.expired` | Demande expirée |
| `connect.contactRequest.expiresOn` | Sans réponse, la demande expire le {date, date, long}. |
| `connect.contactRequest.empty` | Aucune demande de mise en relation. |
| `connect.contactRequest.status.accepted` | Acceptée |
| `connect.contactRequest.status.declined` | Déclinée |
| `connect.contactRequest.blocked` | Vous ne recevrez plus de demandes de {company}. |
| `connect.contactRequest.unavailable` | Cette demande n'est plus disponible. |
| `connect.contactRequest.receivedOn` | Reçue le {date, date, long} |
| `connect.contactRequest.open` | Ouvrir la conversation |

#### Signalement et blocage

| Clé | Texte |
|---|---|
| `connect.report.cta` | Signaler |
| `connect.report.title` | Signaler cette conversation |
| `connect.report.reason.text` | Motif |
| `connect.report.reason.spam` | Message indésirable |
| `connect.report.reason.payment` | Demande d'argent ou de paiement |
| `connect.report.reason.harassment` | Propos déplacés ou harcèlement |
| `connect.report.reason.fake` | Faux recruteur ou fausse offre |
| `connect.report.reason.personalData` | Demande de données personnelles abusive |
| `connect.report.reason.other` | Autre |
| `connect.report.details` | Précisez (facultatif) |
| `connect.report.submit` | Envoyer le signalement |
| `connect.report.success` | Merci. L'équipe Jumanly examine votre signalement. |
| `connect.block.cta` | Bloquer |
| `connect.block.confirm.title` | Bloquer {name} ? |
| `connect.block.confirm.body` | Cette personne ne pourra plus vous écrire. Vos candidatures ne sont pas retirées. |
| `connect.block.confirm.cta` | Bloquer |
| `connect.block.done` | {name} est bloqué. |
| `connect.unblock` | Débloquer |
| `connect.thread.blocked` | Le talent a bloqué cette conversation. Vous ne pouvez plus lui écrire. |
| `connect.thread.youBlocked` | Vous avez bloqué cette conversation : l'organisation ne peut plus vous écrire. |
| `connect.thread.withJob` | {name} · {jobTitle} |
| `connect.thread.back` | Toutes les conversations |
| `connect.thread.you` | Vous |
| `connect.thread.error` | Le message n'a pas pu être envoyé. Vérifiez son contenu et réessayez. |
| `connect.docRequest.noDocument` | Vous n'avez pas encore de CV. Créez-en un dans Career, puis revenez ici. |
| `connect.docRequest.send` | Envoyer ce CV |
| `connect.document.view` | Ouvrir le document |
| `connect.switchSpace.text` | Cette conversation appartient à l'espace de {org}. |
| `connect.switchSpace.cta` | Passer dans cet espace |
| `connect.switchSpace.personal` | Cette conversation appartient à votre espace personnel. |
| `connect.list.readOnly` | Votre rôle permet de lire les conversations, pas d'y répondre. |

---

### `/app/parametres` · Paramètres

*Garder la main sur son compte, sa sécurité et ses données.*

#### Structure

| Clé | Texte |
|---|---|
| `settings.title` | Paramètres |
| `settings.tab.account` | Compte |
| `settings.tab.security` | Sécurité |
| `settings.tab.privacy` | Confidentialité |
| `settings.tab.notifications` | Notifications |
| `settings.tab.language` | Langue et région |
| `settings.tab.data` | Mes données |
| `settings.save` | Enregistrer |
| `settings.saved` | Modifications enregistrées. |
| `settings.cancel` | Annuler |
| `settings.seo.title` | Paramètres · Jumanly |
| `settings.error` | Vérifiez les champs indiqués, puis réessayez. |

#### Compte

| Clé | Texte |
|---|---|
| `settings.account.title` | Compte |
| `settings.account.name` | Nom affiché |
| `settings.account.email.text` | Adresse e-mail |
| `settings.account.email.change` | Changer d'adresse |
| `settings.account.email.pending` | Un code a été envoyé à {email}. L'ancienne adresse reste active jusqu'à la confirmation. |
| `settings.account.email.verified` | Vérifiée |
| `settings.account.country` | Pays |
| `settings.account.city` | Ville |
| `settings.account.plan.text` | Forfait |
| `settings.account.plan.value` | {plan} |
| `settings.account.plan.manage` | Gérer mon abonnement |
| `settings.account.memberships.text` | Mes organisations |
| `settings.account.memberships.role` | {org} · {role} |
| `settings.account.memberships.leave.text` | Quitter l'organisation |
| `settings.account.memberships.leave.confirm` | Quitter {org} ? Vous perdrez l'accès à son espace Hire. Votre compte personnel n'est pas touché. |
| `settings.account.memberships.empty` | Vous n'êtes membre d'aucune organisation. |
| `settings.display.title` | Affichage |
| `settings.display.reduceMotion.text` | Réduire les animations |
| `settings.display.reduceMotion.hint` | Les pages s'affichent sans mouvement : mêmes informations, sans apparitions ni effets de lumière. Votre appareil peut aussi le demander pour tous les sites. |
| `settings.display.replayIntro.text` | Revoir la présentation |
| `settings.display.replayIntro.hint` | Rejoue le générique d'accueil de Jumanly, celui de votre première connexion. |

#### Sécurité

| Clé | Texte |
|---|---|
| `settings.security.title` | Sécurité |
| `settings.security.password.text` | Mot de passe |
| `settings.security.password.change` | Changer le mot de passe |
| `settings.security.password.current` | Mot de passe actuel |
| `settings.security.password.new` | Nouveau mot de passe |
| `settings.security.password.confirm` | Confirmer le nouveau mot de passe |
| `settings.security.password.changed` | Mot de passe modifié. Les autres appareils ont été déconnectés. |
| `settings.security.password.wrong` | Mot de passe actuel incorrect. |
| `settings.security.google.text` | Connexion avec Google |
| `settings.security.google.linked` | Associée à {email} |
| `settings.security.google.link` | Associer mon compte Google |
| `settings.security.google.unlink` | Dissocier |
| `settings.security.2fa.text` | Vérification en deux étapes |
| `settings.security.2fa.desc` | Un code envoyé par e-mail à chaque connexion depuis un nouvel appareil. |
| `settings.security.2fa.on` | Activée |
| `settings.security.2fa.off` | Désactivée |
| `settings.security.2fa.enable` | Activer |
| `settings.security.2fa.disable` | Désactiver |
| `settings.security.2fa.password` | Votre mot de passe, pour confirmer |
| `settings.security.2fa.required` | Votre rôle d'administrateur exige la vérification en deux étapes. Activez-la pour accéder à Jumanly Admin. |
| `settings.security.sessions.text` | Appareils connectés |
| `settings.security.sessions.current` | Cet appareil |
| `settings.security.sessions.item` | {device} · {city} · {time, relative} |
| `settings.security.sessions.logout` | Déconnecter |
| `settings.security.sessions.logoutAll` | Déconnecter tous les autres appareils |
| `settings.security.sessions.loggedOut` | Appareil déconnecté. |
| `settings.security.sessions.since` | {device} · connecté le {date} |
| `settings.security.sessions.unknown` | Appareil inconnu |
| `settings.security.2fa.changed` | Vérification en deux étapes mise à jour. |

#### Confidentialité

| Clé | Texte |
|---|---|
| `settings.privacy.title` | Confidentialité |
| `settings.privacy.visibility.text` | Visibilité du profil |
| `settings.privacy.visibility.manage` | Modifier dans mon profil |
| `settings.privacy.contactRequests.text` | Recevoir des demandes de mise en relation |
| `settings.privacy.contactRequests.hint` | Désactivé, plus aucun recruteur ne peut vous contacter hors de vos candidatures. |
| `settings.privacy.contactRequests.legend` | Mises en relation |
| `settings.privacy.ai.text` | Utilisation de l'IA |
| `settings.privacy.ai.desc` | Autoriser Jumanly Intelligence à analyser mon profil et mes documents pour me faire des suggestions. |
| `settings.privacy.ai.hint` | Coach CV, diagnostic personnalisé, plan de progression et analyse de vos documents. Sans cette autorisation, vous pouvez toujours postuler. |
| `settings.privacy.ai.matching.text` | Calculer ma compatibilité avec les offres |
| `settings.privacy.ai.matching.hint` | Désactivé, vous pouvez toujours postuler. Le recruteur verra votre candidature sans score. |
| `settings.privacy.ai.learnMore` | Comment fonctionne le matching |
| `settings.privacy.partner.text` | Partage avec un partenaire |
| `settings.privacy.partner.desc` | Votre licence est offerte par {sponsorName}. {sponsorName} reçoit uniquement des statistiques agrégées, jamais votre CV, vos messages ni vos données personnelles. |
| `settings.privacy.partner.optIn` | Autoriser {sponsorName} à savoir que j'ai été recruté (facultatif) |
| `settings.privacy.cookies` | Préférences de cookies |
| `settings.privacy.policy` | Lire la politique de confidentialité |

#### Notifications

| Clé | Texte |
|---|---|
| `settings.notifications.title` | Notifications |
| `settings.notifications.subtitle` | Choisissez ce que vous recevez, et où. |
| `settings.notifications.channel.inApp` | Dans l'application |
| `settings.notifications.channel.email` | Par e-mail |
| `settings.notifications.group.applications` | Mes candidatures |
| `settings.notifications.group.messages` | Messages et rendez-vous |
| `settings.notifications.group.jobs` | Alertes d'offres et suggestions |
| `settings.notifications.group.learn` | Formations et attestations |
| `settings.notifications.group.account` | Compte, sécurité et abonnement |
| `settings.notifications.group.digest` | Résumé hebdomadaire |
| `settings.notifications.group.news` | Nouveautés Jumanly |
| `settings.notifications.essential` | Indispensable, ne peut pas être désactivé |
| `settings.notifications.pauseAll` | Suspendre les e-mails non essentiels |

#### Langue et région

| Clé | Texte |
|---|---|
| `settings.language.title` | Langue et région |
| `settings.language.interface` | Langue de l'interface |
| `settings.language.fr` | Français |
| `settings.language.en` | English |
| `settings.language.timezone.text` | Fuseau horaire |
| `settings.language.timezone.auto` | Automatique ({timezone}) |
| `settings.language.currency` | Devise d'affichage |
| `settings.language.dataSaver.text` | Mode économie de données |
| `settings.language.dataSaver.desc` | Vidéos en qualité réduite et images allégées par défaut. |

#### Mes données

| Clé | Texte |
|---|---|
| `settings.data.title` | Mes données |
| `settings.data.export.text` | Télécharger mes données |
| `settings.data.export.desc` | Profil, CV, candidatures, messages, attestations et notes, dans une archive. |
| `settings.data.export.cta` | Demander l'export |
| `settings.data.export.requested` | Export demandé. Vous recevrez un lien par e-mail sous 48 heures. |
| `settings.data.export.ready` | Votre archive est prête jusqu'au {date, date, long}. |
| `settings.data.export.download` | Télécharger l'archive |
| `settings.data.export.now` | Télécharger mes données (fichier JSON) |
| `settings.data.export.nowDesc` | Compte, profil, organisations, abonnements, paiements et appareils connectés. Les autres éléments s'ajouteront à l'export au fur et à mesure de leur ouverture. |
| `settings.data.delete.text` | Supprimer mon compte |
| `settings.data.delete.desc` | Votre profil, vos CV, vos messages et vos attestations seront supprimés. Les recruteurs ne verront plus vos candidatures. |
| `settings.data.delete.cta` | Supprimer mon compte |
| `settings.data.delete.confirm.title` | Supprimer définitivement votre compte ? |
| `settings.data.delete.confirm.body` | Vous disposez de {days} jours pour changer d'avis en vous reconnectant. Passé ce délai, la suppression est définitive. Un abonnement en cours n'est pas remboursé automatiquement. |
| `settings.data.delete.confirm.type` | Tapez SUPPRIMER pour confirmer |
| `settings.data.delete.confirm.password` | Votre mot de passe |
| `settings.data.delete.confirm.cta` | Supprimer mon compte |
| `settings.data.delete.ownerBlock` | Vous êtes propriétaire de {org}. Transférez la propriété ou supprimez l'organisation avant de supprimer votre compte. |
| `settings.data.delete.scheduled` | Suppression programmée le {date, date, long}. Reconnectez-vous avant cette date pour l'annuler. |
| `settings.data.delete.canceled` | Suppression annulée. Bon retour parmi nous. |
| `settings.data.delete.confirm.error` | Tapez SUPPRIMER, en majuscules, pour confirmer. |
| `settings.data.contact` | Une question sur vos données ? Écrivez-nous à assistant@jumanly.io. |

### `/app/testeur` · Mode testeur (compte passe-partout)

*Réservé aux adresses listées dans la variable TESTER_EMAILS : essayer chaque forfait soi-même, sans paiement. Chaque changement est inscrit au journal d'audit.*

| Clé | Texte |
|---|---|
| `tester.seo.title` | Mode testeur · Jumanly |
| `tester.eyebrow` | Compte passe-partout |
| `tester.title` | Mode testeur |
| `tester.subtitle` | Passez d'un forfait à l'autre sans paiement pour essayer chaque page vous-même. |
| `tester.notice` | Ce mode ne s'affiche que pour votre compte. Choisir un forfait, même celui en cours, remet vos quotas à zéro. Chaque changement est inscrit au journal d'audit. |
| `tester.saved` | C'est fait : le forfait {plan} est actif. |
| `tester.created` | Votre espace de test est prêt. |
| `tester.error` | Ce changement n'a pas pu être fait. Réessayez. |
| `tester.current` | Forfait actuel |
| `tester.choose` | Utiliser ce forfait |
| `tester.reset` | Remettre les quotas à zéro |
| `tester.free` | Gratuit |
| `tester.onQuote` | Sur devis |
| `tester.talent.title` | Côté talent |
| `tester.talent.text` | Votre espace personnel : Learn, Career, Jobs et messages. |
| `tester.talent.open` | Ouvrir mon espace talent |
| `tester.org.title` | Côté recruteur et entreprise |
| `tester.org.text` | Les forfaits RH et Entreprise s'appliquent à votre organisation de test, dont vous êtes propriétaire. |
| `tester.org.empty` | Vous n'avez pas encore d'organisation. Créez-en une pour essayer Hire. |
| `tester.org.create` | Créer mon organisation de test |
| `tester.org.open` | Ouvrir l'espace {name} |
| `tester.org.defaultName` | Organisation de test |
| `tester.org.family.rh` | Recruteurs et cabinets RH |
| `tester.org.family.company` | Entreprises |
| `tester.partner.title` | Côté partenaire |
| `tester.partner.text` | Une institution de test dont vous êtes gestionnaire. Les lots de licences se créent depuis l'administration. |
| `tester.partner.create` | Créer mon institution de test |
| `tester.partner.open` | Ouvrir l'espace {name} |
| `tester.partner.defaultName` | Institution de test |
| `tester.admin.title` | Administration |
| `tester.admin.text` | Forfaits, abonnements, utilisateurs et journal d'audit. |
| `tester.admin.open` | Ouvrir l'administration |
| `tester.admin.missing` | Votre compte n'est pas encore administrateur. Ajoutez aussi votre adresse dans la variable ADMIN_BOOTSTRAP_EMAIL, puis reconnectez-vous. |
| `account.menu.tester` | Mode testeur |


---

## Partie 04 · Espace recruteur et entreprise

Textes d'interface de l'espace Hire et de la gestion d'organisation. Les droits (`hire.*`, `org.*`, `reports.*`, `connect.appointments`) et les rôles suivent `docs/specifications.md (partie 05)`.

Conventions :

- Variables : `{org}`, `{jobTitle}`, `{candidateName}`, `{count}`, `{quota}`, `{used}`, `{plan}`, `{score}`, `{date}`, `{stage}`, `{memberName}`, `{role}`.
- `{plan}` reçoit le nom affiché du **premier forfait de la famille** qui ouvre le droit manquant (RH Pro, RH Premium, Company, Company Plus, Company Premium).
- Textes IA (« Pourquoi ? », critères, bandes, analyse de CV) : voir la partie 06. Textes communs : voir la partie 08.
- Principe affiché partout où un score apparaît : l'IA classe et explique, le recruteur décide.

---

### Navigation Hire

*Menu de l'espace Organisation, visible quand le sélecteur d'espace est sur une organisation.*

| Clé | Texte |
|---|---|
| `hire.nav.dashboard` | Accueil |
| `hire.nav.jobs` | Offres |
| `hire.nav.pipeline` | Pipeline |
| `hire.nav.talents` | Talents |
| `hire.nav.pools` | Viviers |
| `hire.nav.interviews` | Entretiens |
| `hire.nav.messages` | Connect |
| `hire.nav.reports` | Rapports |
| `hire.nav.organization` | Organisation |
| `hire.nav.subscription` | Abonnement |
| `hire.nav.settings` | Paramètres |
| `hire.nav.roleBadge` | {family} · {plan} |
| `hire.nav.family.rh` | RH |
| `hire.nav.family.company` | Company |
| `hire.nav.locked` | Disponible avec {plan} |

---

### `/app/hire` · Tableau de bord recrutement

*Voir en un coup d'œil ce qui demande une action aujourd'hui.*

| Clé | Texte |
|---|---|
| `hire.dashboard.eyebrow` | Hire · {org} |
| `hire.dashboard.title` | Tableau de bord recrutement |
| `hire.dashboard.greeting` | Bonjour {firstName}, voici l'essentiel du jour. |
| `hire.dashboard.kpi.applications.text` | Candidatures |
| `hire.dashboard.kpi.applications.delta` | +{count} cette sem. |
| `hire.dashboard.kpi.responseTime.text` | Délai de réponse |
| `hire.dashboard.kpi.responseTime.value` | {days} j |
| `hire.dashboard.kpi.responseTime.goal` | Objectif {days} j |
| `hire.dashboard.kpi.interviews.text` | Entretiens |
| `hire.dashboard.kpi.interviews.week` | {count} cette sem. |
| `hire.dashboard.kpi.avgCompatibility.text` | Compatibilité moy. |
| `hire.dashboard.kpi.avgCompatibility.top` | Top 10 : {score} % |
| `hire.dashboard.kpi.activeJobs.text` | Offres actives |
| `hire.dashboard.kpi.activeJobs.value` | {count} sur {max} |
| `hire.dashboard.toDo.title` | À traiter |
| `hire.dashboard.toDo.newApplications` | {count, plural, one {# nouvelle candidature à examiner} other {# nouvelles candidatures à examiner}} |
| `hire.dashboard.toDo.noReply` | {count, plural, one {# candidat attend une réponse depuis plus de {days} jours} other {# candidats attendent une réponse depuis plus de {days} jours}} |
| `hire.dashboard.toDo.scorecards` | {count, plural, one {# évaluation à compléter} other {# évaluations à compléter}} |
| `hire.dashboard.toDo.contactAccepted` | {count, plural, one {# mise en relation acceptée} other {# mises en relation acceptées}} |
| `hire.dashboard.toDo.empty` | Rien en attente. Beau travail. |
| `hire.dashboard.toDo.emptyCandidates` | Revoir les candidats de vos offres |
| `hire.dashboard.toDo.emptyPublish` | Publier une offre |
| `hire.dashboard.jobs.title` | Offres actives |
| `hire.dashboard.jobs.row` | {jobTitle} · {count, plural, one {# candidature} other {# candidatures}} |
| `hire.dashboard.jobs.seeAll` | Toutes les offres |
| `hire.dashboard.jobs.empty.text` | Aucune offre active. Publiez votre première offre en quelques minutes. |
| `hire.dashboard.jobs.empty.cta` | Créer une offre |
| `hire.dashboard.interviews.title` | Entretiens à venir |
| `hire.dashboard.interviews.row` | {time} · {candidateName} · {jobTitle} |
| `hire.dashboard.interviews.empty` | Aucun entretien planifié. |
| `hire.dashboard.interviews.locked` | Rendez-vous et agenda · Disponible avec {plan} |
| `hire.dashboard.quotas.title` | Quotas de l'organisation |
| `hire.dashboard.quotas.renewal` | Renouvellement le {date, date, long} |
| `hire.dashboard.quotas.seats` | Utilisateurs |
| `hire.dashboard.quotas.activeJobs` | Offres actives |
| `hire.dashboard.quotas.search` | Recherches dans le vivier |
| `hire.dashboard.quotas.contacts` | Demandes de mise en relation |
| `hire.dashboard.quotas.aiCredits` | Crédits IA |
| `hire.dashboard.quotas.usage` | {used} sur {quota} |
| `hire.dashboard.quotas.unlimited` | Selon contrat |
| `hire.dashboard.quotas.notIncluded` | Non inclus |
| `hire.dashboard.quotas.seePlans` | Voir les forfaits |
| `hire.dashboard.newCta` | Nouvelle offre |
| `hire.dashboard.resume` | {count, plural, one {Voir # nouveau candidat} other {Voir # nouveaux candidats}} · {jobTitle} |
| `hire.dashboard.verifyBanner.text` | Faites vérifier votre organisation pour afficher le badge « Entreprise vérifiée » sur vos offres. |
| `hire.dashboard.verifyBanner.cta` | Demander la vérification |
| `hire.dashboard.fairness` | Rappel : les profils Free sont des candidats comme les autres. Le forfait d'un talent n'influence jamais son score. |
| `hire.dashboard.verifyBanner.pending` | Votre demande de vérification est en cours d'examen. |
| `hire.dashboard.banner.jobs` | {count, plural, =0 {Aucune offre active} one {# offre active} other {# offres actives}} |
| `hire.dashboard.banner.team` | {count, plural, one {# recruteur dans l'équipe} other {# recruteurs dans l'équipe}} |
| `hire.dashboard.kpi.none` | — |
| `hire.dashboard.toDo.scorecardsHint` | Après vos derniers entretiens |
| `hire.dashboard.toDo.contactHint` | Depuis la recherche de talents |
| `hire.dashboard.jobs.newTag` | {count, plural, one {# nouvelle} other {# nouvelles}} |
| `hire.dashboard.jobs.bar` | Candidats par étape : {detail} |
| `hire.dashboard.interviews.with` | {mode} · avec {memberName} |
| `hire.dashboard.interviews.where` | {mode} · {place} |

---

### `/app/hire/offres` · Mes offres

*Gérer le cycle de vie des offres dans la limite d'offres actives du forfait.*

| Clé | Texte |
|---|---|
| `hire.jobs.title` | Mes offres |
| `hire.jobs.new` | Nouvelle offre |
| `hire.jobs.tab.published` | Publiées ({count}) |
| `hire.jobs.tab.drafts` | Brouillons ({count}) |
| `hire.jobs.tab.closed` | Fermées ({count}) |
| `hire.jobs.tab.all` | Toutes |
| `hire.jobs.search.placeholder` | Rechercher une offre |
| `hire.jobs.filter.owner` | Responsable |
| `hire.jobs.filter.team` | Équipe |
| `hire.jobs.filter.department` | Département |
| `hire.jobs.filter.entity` | Entité |
| `hire.jobs.limit.text` | {count, plural, one {# offre active} other {# offres actives}} sur {max} incluses dans {plan} |
| `hire.jobs.limit.reached.text` | Vous avez atteint la limite de {max, plural, one {# offre active} other {# offres actives}} de votre forfait. Fermez une offre ou passez à un forfait supérieur pour en publier une nouvelle. |
| `hire.jobs.limit.reached.cta` | Voir les forfaits |
| `hire.jobs.limit.contract` | Limite fixée par votre contrat : {max} offres actives. |
| `hire.jobs.status.draft` | Brouillon |
| `hire.jobs.status.pendingReview` | En vérification |
| `hire.jobs.status.published` | Publiée |
| `hire.jobs.status.paused` | En pause |
| `hire.jobs.status.closed` | Fermée |
| `hire.jobs.status.rejected` | Refusée par la modération |
| `hire.jobs.status.changesRequested` | Correction demandée |
| `hire.jobs.status.expired` | Expirée |
| `hire.jobs.row.applications` | {count, plural, =0 {Aucune candidature} one {# candidature} other {# candidatures}} |
| `hire.jobs.row.new` | {count, plural, one {# nouvelle} other {# nouvelles}} |
| `hire.jobs.row.published` | Publiée le {date, date, medium} |
| `hire.jobs.row.expires` | Expire le {date, date, medium} |
| `hire.jobs.row.owner` | Responsable : {memberName} |
| `hire.jobs.action.pipeline` | Ouvrir le pipeline |
| `hire.jobs.action.edit` | Modifier |
| `hire.jobs.action.duplicate` | Dupliquer |
| `hire.jobs.action.pause` | Mettre en pause |
| `hire.jobs.action.resume` | Reprendre la publication |
| `hire.jobs.action.close` | Fermer l'offre |
| `hire.jobs.action.reopen` | Rouvrir |
| `hire.jobs.action.delete` | Supprimer le brouillon |
| `hire.jobs.action.share` | Copier le lien public |
| `hire.jobs.action.assign` | Attribuer à un responsable |
| `hire.jobs.close.confirm.title` | Fermer « {jobTitle} » ? |
| `hire.jobs.close.confirm.body` | L'offre n'acceptera plus de candidatures. Les candidats en cours restent dans le pipeline. Pensez à informer ceux qui ne seront pas retenus. |
| `hire.jobs.close.confirm.notify` | Envoyer le message de refus aux candidats sans décision |
| `hire.jobs.close.confirm.cta` | Fermer l'offre |
| `hire.jobs.closed.toast` | Offre fermée. Une place d'offre active est libérée. |
| `hire.jobs.delete.confirm.title` | Supprimer ce brouillon ? |
| `hire.jobs.delete.confirm.body` | Cette action est définitive. |
| `hire.jobs.rejected.reason` | Motif de la modération : {reason} |
| `hire.jobs.rejected.fix` | Corriger et soumettre de nouveau |
| `hire.jobs.changes.title` | La modération demande une correction |
| `hire.jobs.changes.reason` | Message de la modération : {reason} |
| `hire.jobs.changes.points` | Points à corriger |
| `hire.jobs.changes.point.real` | Rendre le poste et l'organisation clairement identifiables |
| `hire.jobs.changes.point.noPayment` | Retirer toute demande de paiement aux candidats |
| `hire.jobs.changes.point.noDiscrimination` | Retirer les critères liés au genre, à l'âge, à l'origine, à la religion, à la situation familiale ou à la santé |
| `hire.jobs.changes.point.knockout` | Justifier par le poste les critères éliminatoires, ou les retirer |
| `hire.jobs.changes.resend` | Corrigez l'offre puis publiez-la de nouveau : elle repart en vérification. |
| `hire.jobs.changes.fix` | Corriger l'offre |
| `hire.jobs.empty.published` | Aucune offre publiée. |
| `hire.jobs.empty.drafts` | Aucun brouillon. |
| `hire.jobs.empty.closed` | Aucune offre fermée. |
| `hire.jobs.empty.cta` | Créer une offre |
| `hire.jobs.assign.locked` | Attribution des offres aux responsables · Disponible avec {plan} |
| `hire.jobs.filter.all` | Tous |
| `hire.jobs.filter.submit` | Filtrer |
| `hire.jobs.col.job` | Offre |
| `hire.jobs.col.status` | Statut |
| `hire.jobs.col.applications` | Candidatures |
| `hire.jobs.col.publication` | Publication |
| `hire.jobs.col.actions` | Actions |
| `hire.jobs.row.sent` | Envoyée le {date, date, medium} |
| `hire.jobs.row.notPublished` | Pas encore publiée |
| `hire.jobs.row.menu` | Actions pour « {jobTitle} » |
| `hire.jobs.search.submit` | Rechercher |
| `hire.jobs.search.empty` | Aucune offre ne correspond à « {query} ». |
| `hire.jobs.cancel` | Annuler |
| `hire.jobs.reopened.limit` | Vous avez atteint la limite d'offres actives de votre forfait. Fermez une offre ou passez à un forfait supérieur pour rouvrir celle-ci. |
| `hire.jobs.tabs` | Offres par statut |
| `hire.jobs.filter.locked` | Disponible avec {plan} |
| `hire.assign.title` | Attribution |
| `hire.assign.subtitle` | Qui est responsable de cette offre et qui peut voir ses candidats. |
| `hire.assign.none` | Non attribué |
| `hire.assign.members.hint` | Les responsables du recrutement ne voient que les offres auxquelles ils sont ajoutés. |
| `hire.assign.entities.locked` | Entités et filiales · Disponible avec {plan} |
| `hire.assign.save` | Enregistrer l'attribution |
| `hire.assign.saved` | Attribution enregistrée. |
| `hire.assign.error` | Ces changements n'ont pas pu être enregistrés. Vérifiez les champs puis réessayez. |
| `hire.assign.members.text` | Équipe de recrutement |

---

### `/app/hire/offres/nouvelle` · Création guidée d'une offre

*Un formulaire en six étapes qui produit une offre claire et des critères de matching explicites.*

#### Cadre de l'assistant

| Clé | Texte |
|---|---|
| `hire.jobForm.title.new` | Nouvelle offre |
| `hire.jobForm.title.edit` | Modifier l'offre |
| `hire.jobForm.step.text` | Étape {current} sur {total} |
| `hire.jobForm.step.basics` | L'essentiel |
| `hire.jobForm.step.description` | Description |
| `hire.jobForm.step.skills` | Compétences |
| `hire.jobForm.step.criteria` | Critères |
| `hire.jobForm.step.process` | Processus |
| `hire.jobForm.step.preview` | Aperçu et publication |
| `hire.jobForm.next` | Continuer |
| `hire.jobForm.back` | Retour |
| `hire.jobForm.saveDraft` | Enregistrer le brouillon |
| `hire.jobForm.draftSaved` | Brouillon enregistré {time, relative} |
| `hire.jobForm.leave.confirm` | Quitter ? Votre brouillon est enregistré, vous pourrez le reprendre. |
| `hire.jobForm.fromTemplate` | Partir d'une offre existante |
| `hire.jobForm.aiDraft` | Rédiger une première version avec l'IA |

#### Étape 1 · L'essentiel

| Clé | Texte |
|---|---|
| `hire.jobForm.jobTitle.text` | Intitulé du poste |
| `hire.jobForm.jobTitle.placeholder` | Ex. : Analyste de données junior |
| `hire.jobForm.jobTitle.hint` | Un intitulé simple et courant. Évitez les abréviations internes. |
| `hire.jobForm.jobTitle.neutral` | Pensez à un intitulé neutre, ouvert à tous (ex. : « Analyste » plutôt que « Analyste homme »). |
| `hire.jobForm.contract.text` | Type de contrat |
| `hire.jobForm.contract.duration` | Durée (mois) |
| `hire.jobForm.workTime.text` | Temps de travail |
| `hire.jobForm.workTime.full` | Temps plein |
| `hire.jobForm.workTime.part` | Temps partiel |
| `hire.jobForm.workMode` | Mode de travail |
| `hire.jobForm.location.country` | Pays |
| `hire.jobForm.location.city` | Ville |
| `hire.jobForm.location.district` | Quartier ou commune (facultatif) |
| `hire.jobForm.salary.text` | Rémunération |
| `hire.jobForm.salary.min` | Minimum |
| `hire.jobForm.salary.max` | Maximum |
| `hire.jobForm.salary.currency` | Devise |
| `hire.jobForm.salary.period` | Période |
| `hire.jobForm.salary.hide` | Ne pas afficher la rémunération |
| `hire.jobForm.salary.hint` | Les offres avec une fourchette de salaire reçoivent des candidatures plus ciblées. |
| `hire.jobForm.salary.error.range` | Le maximum doit être supérieur au minimum. |
| `hire.jobForm.startDate` | Date de début souhaitée |
| `hire.jobForm.deadline` | Date limite de candidature |
| `hire.jobForm.openings` | Nombre de postes |
| `hire.jobForm.owner` | Responsable de l'offre |
| `hire.jobForm.team.text` | Équipe |
| `hire.jobForm.department` | Département |
| `hire.jobForm.entity` | Entité |

#### Étape 2 · Description

| Clé | Texte |
|---|---|
| `hire.jobForm.missions.text` | Missions |
| `hire.jobForm.missions.placeholder` | Une mission par ligne, en commençant par un verbe. |
| `hire.jobForm.profile.text` | Profil recherché |
| `hire.jobForm.profile.placeholder` | Formation, expérience, qualités utiles au poste. |
| `hire.jobForm.benefits.text` | Avantages |
| `hire.jobForm.benefits.add` | Ajouter un avantage |
| `hire.jobForm.benefits.placeholder` | Ex. : Assurance santé, budget formation |
| `hire.jobForm.about` | À propos de l'équipe (facultatif) |
| `hire.jobForm.language` | Langue de l'offre |
| `hire.jobForm.description.inclusive` | Rappel : n'indiquez ni âge, ni genre, ni origine, ni religion, ni situation familiale, ni état de santé. Ces critères sont interdits et ignorés par le matching. |
| `hire.jobForm.description.aiImprove` | Améliorer la clarté avec l'IA |

#### Étape 3 · Compétences et poids

| Clé | Texte |
|---|---|
| `hire.jobForm.skills.title` | Compétences attendues |
| `hire.jobForm.skills.subtitle` | Elles comptent le plus dans le score de compatibilité. Séparez l'indispensable du souhaitable. |
| `hire.jobForm.skills.required.text` | Compétences requises |
| `hire.jobForm.skills.required.hint` | Ce que la personne doit savoir faire dès son arrivée. |
| `hire.jobForm.skills.preferred.text` | Compétences souhaitées |
| `hire.jobForm.skills.preferred.hint` | Un plus, qui peut s'apprendre en poste. |
| `hire.jobForm.skills.add` | Ajouter une compétence |
| `hire.jobForm.skills.search.placeholder` | Ex. : SQL, Power BI, négociation |
| `hire.jobForm.skills.level` | Niveau attendu |
| `hire.jobForm.skills.weight.text` | Importance |
| `hire.jobForm.skills.weight.low` | Utile |
| `hire.jobForm.skills.weight.medium` | Importante |
| `hire.jobForm.skills.weight.high` | Essentielle |
| `hire.jobForm.skills.suggestions` | Compétences souvent demandées pour ce poste |
| `hire.jobForm.skills.max` | {max} compétences requises au maximum, pour garder des critères lisibles. |
| `hire.jobForm.skills.minRequired` | Ajoutez au moins une compétence requise. |
| `hire.jobForm.weights.title` | Poids des critères |
| `hire.jobForm.weights.subtitle` | Répartissez 100 points entre les critères. Les candidats verront comment leur score est calculé. |
| `hire.jobForm.weights.default` | Utiliser la répartition recommandée |
| `hire.jobForm.weights.total` | Total : {total}/100 |
| `hire.jobForm.weights.error.total` | Le total doit être égal à 100. Il est actuellement de {total}. |

#### Étape 4 · Critères (expérience, langues, diplôme, critères éliminatoires)

| Clé | Texte |
|---|---|
| `hire.jobForm.experience.text` | Expérience attendue |
| `hire.jobForm.experience.min` | Minimum (années) |
| `hire.jobForm.experience.max` | Maximum (années, facultatif) |
| `hire.jobForm.experience.noneOk` | Ouvert aux débutants |
| `hire.jobForm.education.text` | Formation ou diplôme |
| `hire.jobForm.education.level` | Niveau minimum |
| `hire.jobForm.education.field` | Domaines |
| `hire.jobForm.education.equivalent` | Expérience équivalente acceptée |
| `hire.jobForm.languages.text` | Langues |
| `hire.jobForm.languages.add` | Ajouter une langue |
| `hire.jobForm.languages.level` | Niveau minimum |
| `hire.jobForm.availability` | Disponibilité souhaitée |
| `hire.jobForm.knockout.title` | Critères éliminatoires |
| `hire.jobForm.knockout.subtitle` | Facultatif. Ce sont les seules conditions sans lesquelles vous ne pouvez pas recruter (ex. : diplôme exigé par la loi, permis de conduire, droit de travailler dans le pays). |
| `hire.jobForm.knockout.add` | Ajouter un critère éliminatoire |
| `hire.jobForm.knockout.type.text` | Type |
| `hire.jobForm.knockout.type.skill` | Compétence |
| `hire.jobForm.knockout.type.education` | Diplôme ou certification |
| `hire.jobForm.knockout.type.language` | Langue |
| `hire.jobForm.knockout.type.license` | Permis ou habilitation |
| `hire.jobForm.knockout.type.workAuth` | Autorisation de travail |
| `hire.jobForm.knockout.type.location` | Lieu de travail |
| `hire.jobForm.knockout.type.question` | Question oui ou non |
| `hire.jobForm.knockout.question.placeholder` | Ex. : Disposez-vous d'un permis de conduire B ? |
| `hire.jobForm.knockout.public` | Ces critères sont affichés aux candidats sur l'offre. |
| `hire.jobForm.knockout.behavior` | Un candidat qui ne remplit pas un critère éliminatoire peut quand même postuler. Il est signalé, jamais écarté automatiquement : vous décidez. |
| `hire.jobForm.knockout.forbidden` | Ce critère ne peut pas être utilisé : il porte sur une donnée protégée (genre, âge, photo, origine, religion, situation familiale, état de santé). |
| `hire.jobForm.knockout.max` | {max} critères éliminatoires au maximum. |

#### Étape 5 · Processus et questions

| Clé | Texte |
|---|---|
| `hire.jobForm.process.title` | Étapes du recrutement |
| `hire.jobForm.process.subtitle` | Elles seront visibles par les candidats sur l'offre et dans leur suivi. |
| `hire.jobForm.process.default` | Étapes par défaut : Nouvelles, Présélection, Test, Entretien, Offre, Recruté, Non retenu. |
| `hire.jobForm.process.custom.text` | Personnaliser les étapes |
| `hire.jobForm.process.custom.locked` | Workflows configurables · Disponible avec {plan} |
| `hire.jobForm.process.skipTest` | Pas de test pour cette offre |
| `hire.jobForm.letter.text` | Lettre de motivation |
| `hire.jobForm.letter.none` | Non demandée |
| `hire.jobForm.letter.optional` | Facultative |
| `hire.jobForm.letter.required` | Obligatoire |
| `hire.jobForm.questions.text` | Questions aux candidats |
| `hire.jobForm.questions.add` | Ajouter une question |
| `hire.jobForm.questions.type.short` | Réponse courte |
| `hire.jobForm.questions.type.long` | Réponse longue |
| `hire.jobForm.questions.type.yesNo` | Oui ou non |
| `hire.jobForm.questions.type.choice` | Choix multiple |
| `hire.jobForm.questions.required` | Réponse obligatoire |
| `hire.jobForm.questions.hint` | Plus de deux ou trois questions découragent les candidats. Restez bref. |
| `hire.jobForm.team.title` | Équipe de recrutement |
| `hire.jobForm.team.add` | Ajouter un membre |
| `hire.jobForm.team.locked` | Collaboration entre recruteurs · Disponible avec {plan} |
| `hire.jobForm.rejectionTemplate.text` | Message de refus |
| `hire.jobForm.rejectionTemplate.hint` | Modèle envoyé quand vous déplacez un candidat dans « Non retenu ». Vous pourrez l'ajuster à chaque fois. |

#### Étape 6 · Aperçu et publication

| Clé | Texte |
|---|---|
| `hire.jobForm.preview.title` | Aperçu de votre offre |
| `hire.jobForm.preview.subtitle` | C'est ainsi que les talents verront votre offre. |
| `hire.jobForm.preview.desktop` | Ordinateur |
| `hire.jobForm.preview.mobile` | Mobile |
| `hire.jobForm.preview.checklist` | Avant de publier |
| `hire.jobForm.preview.check.title` | Intitulé clair |
| `hire.jobForm.preview.check.skills` | Au moins une compétence requise |
| `hire.jobForm.preview.check.salary` | Rémunération indiquée (recommandé) |
| `hire.jobForm.preview.check.location` | Lieu et mode de travail |
| `hire.jobForm.preview.check.deadline` | Date limite |
| `hire.jobForm.publish.text` | Publier l'offre |
| `hire.jobForm.publish.schedule` | Programmer la publication |
| `hire.jobForm.publish.terms` | Je certifie que cette offre correspond à un poste réel et respecte les conditions d'utilisation de Jumanly. |
| `hire.jobForm.publish.free` | Les candidatures sont gratuites pour les talents. Il est interdit de leur demander un paiement. |
| `hire.jobForm.publish.limitReached` | Limite d'offres actives atteinte ({max}). Fermez une offre ou changez de forfait pour publier celle-ci. Elle reste enregistrée en brouillon. |
| `hire.jobForm.publish.success.title` | Votre offre est en ligne ! |
| `hire.jobForm.publish.success.body` | Elle est visible sur Jumanly et dans les recherches des talents. |
| `hire.jobForm.publish.success.review` | Votre offre a été transmise pour une vérification rapide. Elle sera en ligne dès validation. |
| `hire.jobForm.publish.success.share` | Copier le lien de l'offre |
| `hire.jobForm.publish.success.pipeline` | Voir le pipeline |
| `hire.jobForm.publish.hiringManagerBlocked` | Votre rôle ne permet pas de publier une offre. Enregistrez-la en brouillon et demandez à un recruteur ou un administrateur de la publier. |
| `hire.jobForm.error.required` | Ce champ est obligatoire pour publier. |
| `hire.jobForm.error.invalid` | Certaines informations ne sont pas valides. Vérifiez le formulaire. |
| `hire.jobForm.draft.ok` | Brouillon enregistré. |
| `hire.jobForm.summary.text` | Présentation du poste |
| `hire.jobForm.summary.placeholder` | Le contexte, l'équipe et ce que la personne fera au quotidien. |
| `hire.jobForm.lines.hint` | Un élément par ligne. |
| `hire.jobForm.skills.separator` | Séparez les compétences par une virgule. |
| `hire.jobForm.skills.unknown` | Compétences absentes du référentiel : {skills}. Vérifiez l'orthographe ou choisissez une compétence proche. |
| `hire.jobForm.salary.unit` | Montants mensuels, en USD. |
| `hire.jobForm.step.current` | Étape {current} sur {total} · {step} |
| `hire.jobForm.step.aria` | Étapes de l'offre |
| `hire.jobForm.draftSavedAt` | Brouillon enregistré {time} |
| `hire.jobForm.ai.draftHint` | À partir de l'intitulé et de l'essentiel saisis à l'étape 1. |
| `hire.jobForm.ai.draftCta` | Rédiger |
| `hire.jobForm.ai.drafted` | Première version ajoutée dans les champs vides. Relisez-la et adaptez-la. |
| `hire.jobForm.ai.draftNothing` | L'IA n'a rien proposé de plus. Vos champs sont inchangés. |
| `hire.jobForm.ai.improveIntro` | L'IA relit vos missions et propose des formulations plus claires. Vous choisissez ce que vous gardez. |
| `hire.jobForm.ai.improveEmpty` | Aucune amélioration proposée : vos missions sont déjà claires. |
| `hire.jobForm.ai.needTitle` | Indiquez d'abord l'intitulé du poste à l'étape 1. |
| `hire.jobForm.ai.needMissions` | Ajoutez au moins une mission pour que l'IA la relise. |
| `hire.jobForm.ai.consent` | Activez Jumanly Intelligence dans vos paramètres de confidentialité pour utiliser l'aide à la rédaction. |
| `hire.jobForm.ai.locked` | L'aide à la rédaction est disponible avec {plan}. Vous pouvez rédiger votre offre librement. |
| `hire.jobForm.ai.quota` | Les crédits IA de votre organisation sont épuisés pour ce mois. Vous pouvez rédiger votre offre librement. |
| `hire.jobForm.preview.salaryRange` | {min} – {max} USD/mois |
| `hire.jobForm.preview.salaryOne` | {amount} USD/mois |
| `hire.jobForm.preview.verified` | Entreprise vérifiée |
| `hire.jobForm.error.certify` | Cochez la case de certification pour publier l'offre. |
| `hire.jobForm.draft.copied` | Copie créée en brouillon. Vérifiez-la puis publiez-la. |
| `hire.jobForm.benefits.remove` | Retirer « {benefit} » |
| `hire.jobForm.templates.empty` | Aucune offre à reprendre pour l'instant. |

---

### `/app/hire/offres/[id]` · Pipeline

*Faire avancer chaque candidat d'étape en étape, avec le score comme aide et non comme verdict.*

#### En-tête et vues

| Clé | Texte |
|---|---|
| `hire.pipeline.eyebrow` | Hire · {org} |
| `hire.pipeline.title` | Pipeline de recrutement |
| `hire.pipeline.jobSelect` | Changer d'offre |
| `hire.pipeline.jobStatus` | {status} |
| `hire.pipeline.summary` | {count, plural, one {# candidature} other {# candidatures}} · {days} j de réponse |
| `hire.pipeline.view.board` | Pipeline |
| `hire.pipeline.view.list` | Liste |
| `hire.pipeline.filters` | Filtres |
| `hire.pipeline.team` | Équipe de recrutement |
| `hire.pipeline.newJob` | Nouvelle offre |
| `hire.pipeline.add.text` | Ajouter |
| `hire.pipeline.add.hint` | Ajouter un candidat de votre vivier à cette offre |
| `hire.pipeline.aiNotice` | Le score aide à prioriser. Il ne remplace pas votre lecture : examinez chaque candidature. |

#### Étapes par défaut

| Clé | Texte |
|---|---|
| `hire.pipeline.stage.new` | Nouvelles |
| `hire.pipeline.stage.screening` | Présélection |
| `hire.pipeline.stage.test` | Test |
| `hire.pipeline.stage.interview` | Entretien |
| `hire.pipeline.stage.offer` | Offre |
| `hire.pipeline.stage.hired` | Recruté |
| `hire.pipeline.stage.rejected` | Non retenu |
| `hire.pipeline.stage.count` | {count} |
| `hire.pipeline.stage.empty` | Aucun candidat à cette étape. |
| `hire.pipeline.stage.dropHere` | Déposez ici pour passer en « {stage} » |
| `hire.pipeline.stage.menu` | Options de l'étape |
| `hire.pipeline.stage.sortByScore` | Trier par compatibilité |
| `hire.pipeline.stage.sortByDate` | Trier par date |
| `hire.pipeline.stage.sortManual` | Ordre manuel |
| `hire.pipeline.stage.collapse` | Replier la colonne |
| `hire.pipeline.stage.simple.note` | Votre forfait inclut une gestion simple des étapes. |

#### Carte candidat

| Clé | Texte |
|---|---|
| `hire.pipeline.card.location` | {city} |
| `hire.pipeline.card.score.text` | {score} % |
| `hire.pipeline.card.score.aria` | Compatibilité {score} sur 100, {band}. Ouvrir l'explication. |
| `hire.pipeline.card.notRated` | Non évalué |
| `hire.pipeline.card.rating.aria` | Note de l'équipe : {rating} sur 5 |
| `hire.pipeline.card.certificate` | Attestation Jumanly |
| `hire.pipeline.card.knockout` | Critère indispensable non rempli |
| `hire.pipeline.card.interviewAt` | {date, date, short} · {time} |
| `hire.pipeline.card.test` | Test : {score}/{max} |
| `hire.pipeline.card.offerSent` | Offre envoyée |
| `hire.pipeline.card.offerAccepted` | Acceptée |
| `hire.pipeline.card.offerDeclined` | Déclinée |
| `hire.pipeline.card.received` | {time, relative} |
| `hire.pipeline.card.anonymous` | Candidat anonyme |
| `hire.pipeline.card.availableNow` | Disponible de suite |
| `hire.pipeline.card.withdrawn` | Candidature retirée |
| `hire.pipeline.card.comments` | {count, plural, one {# commentaire} other {# commentaires}} |
| `hire.pipeline.card.menu` | Actions |
| `hire.pipeline.card.more` | + {count} autres |

#### Actions

| Clé | Texte |
|---|---|
| `hire.pipeline.action.view` | Voir le profil |
| `hire.pipeline.action.moveTo` | Déplacer vers… |
| `hire.pipeline.action.moveAria` | Déplacer {candidateName} vers une autre étape |
| `hire.pipeline.action.moveSubmit` | Déplacer |
| `hire.pipeline.action.advance` | Étape suivante |
| `hire.pipeline.action.schedule` | Planifier |
| `hire.pipeline.action.message` | Envoyer un message |
| `hire.pipeline.action.requestDocument` | Demander un document |
| `hire.pipeline.action.shortlist` | Ajouter à la présélection |
| `hire.pipeline.action.addToPool` | Ajouter à un vivier |
| `hire.pipeline.action.reject` | Ne pas retenir |
| `hire.pipeline.action.restore` | Remettre dans le pipeline |
| `hire.pipeline.action.hire` | Marquer comme recruté |
| `hire.pipeline.action.bulk.text` | {count, plural, one {# candidat sélectionné} other {# candidats sélectionnés}} |
| `hire.pipeline.action.bulk.move` | Déplacer la sélection |
| `hire.pipeline.action.bulk.message` | Écrire à la sélection |
| `hire.pipeline.action.bulk.reject` | Ne pas retenir la sélection |
| `hire.pipeline.action.selectAll` | Tout sélectionner |
| `hire.pipeline.moved.text` | {candidateName} est passé en « {stage} ». |
| `hire.pipeline.moved.undo` | Annuler |
| `hire.pipeline.moved.notified` | Le candidat a été informé du changement d'étape. |
| `hire.pipeline.drag.aria` | Glisser pour changer d'étape. Avec le clavier : Espace pour saisir, flèches pour déplacer, Espace pour déposer. |
| `hire.pipeline.drag.grabbed` | {candidateName} saisi. Étape actuelle : {stage}. |
| `hire.pipeline.drag.dropped` | {candidateName} déposé dans « {stage} ». |
| `hire.pipeline.drag.canceled` | Déplacement annulé. |
| `hire.pipeline.hire.confirm.title` | Confirmer le recrutement de {candidateName} ? |
| `hire.pipeline.hire.confirm.body` | Le candidat est informé. Vous pourrez fermer l'offre si tous les postes sont pourvus. |
| `hire.pipeline.hire.confirm.cta` | Confirmer |
| `hire.pipeline.hire.success` | Félicitations pour ce recrutement ! |
| `hire.pipeline.permission.readOnly` | Vous consultez ce pipeline en lecture seule. |

#### Message de refus (déplacement vers « Non retenu »)

| Clé | Texte |
|---|---|
| `hire.reject.title` | Ne pas retenir {candidateName} |
| `hire.reject.reason.text` | Motif interne |
| `hire.reject.reason.hint` | Visible uniquement par votre équipe. Il alimente l'historique des décisions. |
| `hire.reject.reason.skills` | Compétences insuffisantes pour ce poste |
| `hire.reject.reason.experience` | Expérience insuffisante |
| `hire.reject.reason.knockout` | Critère indispensable non rempli |
| `hire.reject.reason.otherCandidate` | Un autre profil a été retenu |
| `hire.reject.reason.withdrawn` | Le candidat s'est retiré |
| `hire.reject.reason.positionClosed` | Poste pourvu ou annulé |
| `hire.reject.reason.other` | Autre |
| `hire.reject.message.text` | Message au candidat |
| `hire.reject.message.hint` | Modifiable. Un message humain et respectueux fait toute la différence. |
| `hire.reject.message.default` | Bonjour {firstName},\n\nMerci pour l'intérêt que vous portez à {org} et pour le temps consacré à votre candidature au poste de {jobTitle}.\n\nAprès examen attentif, nous ne donnons pas suite à votre candidature pour ce poste. Cette décision tient aux besoins précis du poste à ce moment et ne remet pas en cause vos qualités.\n\nNous vous encourageons à continuer : d'autres offres sur Jumanly pourraient vous correspondre.\n\nNous vous souhaitons une belle réussite.\n\n{recruiterName}, {org} |
| `hire.reject.message.withFeedback` | Ajouter un conseil personnalisé |
| `hire.reject.message.feedback.placeholder` | Ex. : Votre expérience en reporting est solide ; renforcer Python serait un atout pour des postes similaires. |
| `hire.reject.send.now` | Envoyer maintenant |
| `hire.reject.send.delay` | Envoyer dans {days, plural, one {# jour} other {# jours}} |
| `hire.reject.send.none.text` | Ne pas envoyer de message |
| `hire.reject.send.none.warning` | Le candidat verra seulement le statut « Non retenue ». Nous recommandons d'envoyer un message. |
| `hire.reject.confirm` | Confirmer |
| `hire.reject.done` | Décision enregistrée. |
| `hire.reject.aiRule` | Rappel : un score bas ou un critère non rempli ne suffit pas à justifier une décision. Elle vous appartient. |
| `hire.templates.write` | Écrire avec un modèle |
| `hire.templates.message.title` | Message |
| `hire.templates.message.back` | Retour |
| `hire.templates.message.choose` | Choisir un modèle |
| `hire.templates.message.ai` | Écrire avec l'IA |
| `hire.templates.message.aiSoon` | Bientôt disponible |
| `hire.templates.message.manage` | Gérer les modèles de l'organisation |
| `hire.templates.message.decided` | La décision est déjà prise pour cette candidature. |
| `hire.templates.message.titleFor` | {kind} · {name} |
| `hire.templates.message.preview` | Aperçu de ce que reçoit {firstName} |
| `hire.templates.message.edit` | Modifier le texte |
| `hire.templates.message.text` | Texte du message |
| `hire.templates.message.refresh` | Mettre à jour l'aperçu |
| `hire.templates.message.afterClick` | Envoyé seulement après votre clic. |
| `hire.templates.message.cancel` | Annuler |
| `hire.templates.message.send` | Envoyer |
| `hire.templates.message.withoutMessage` | Enregistrer la décision sans message |
| `hire.templates.message.error` | Le message n'est pas parti. Vérifiez le texte et réessayez. |
| `hire.templates.message.convocationHint` | Pour proposer des créneaux que le candidat confirme en un geste : |
| `hire.templates.message.schedule` | planifier l'entretien |
| `hire.templates.kind.convocation` | Convocation |
| `hire.templates.kind.document` | Demander un document |
| `hire.templates.kind.relance` | Relance |
| `hire.templates.kind.acceptation` | Acceptation |
| `hire.templates.kind.refus` | Refus |
| `hire.templates.banner.hired` | Candidature retenue |
| `hire.templates.banner.rejected` | Candidature non retenue |
| `hire.templates.signer` | {name} · Recrutement |
| `hire.templates.today` | aujourd'hui |
| `hire.templates.default.convocation.body` | Bonjour {firstName},\n\nMerci pour votre candidature au poste de {jobTitle}. Nous aimerions vous rencontrer pour un entretien.\n\nJe vous propose des créneaux dans cette conversation : dites-moi celui qui vous convient.\n\n{signer}, {company} |
| `hire.templates.default.document.body` | Bonjour {firstName}, pour avancer sur votre candidature au poste de {jobTitle}, pourriez-vous nous envoyer ce document ? |
| `hire.templates.default.relance.body` | Bonjour {firstName},\n\nJe reviens vers vous au sujet de votre candidature au poste de {jobTitle}. Avez-vous pu lire mon dernier message ?\n\n{signer}, {company} |
| `hire.templates.default.acceptation.body` | Bonjour {firstName},\n\nNous avons le plaisir de vous proposer le poste de {jobTitle}.\n\nProchaine étape : un échange sur votre arrivée. Nous revenons vers vous dans cette conversation. |
| `hire.templates.default.refus.body` | Bonjour {firstName},\n\nMerci pour votre candidature au poste de {jobTitle} et pour le temps que vous y avez consacré. Nous avons retenu un autre profil pour ce poste.\n\nCette décision tient aux besoins précis du poste et ne remet pas en cause vos qualités. Nous gardons votre profil pour nos prochaines offres. |
| `hire.templates.page.title` | Modèles de message |
| `hire.templates.page.subtitle` | Les textes de votre organisation, pour écrire plus vite aux candidats. |
| `hire.templates.page.saved` | Modèle enregistré. |
| `hire.templates.page.deleted` | Modèle supprimé. |
| `hire.templates.page.error` | Vérifiez le nom et le texte du modèle. |
| `hire.templates.page.placeholders` | Dans un modèle, '{prenom}', '{poste}', '{entreprise}' et '{signataire}' sont remplacés au moment d'écrire au candidat. |
| `hire.templates.page.empty` | Aucun modèle pour l'instant. Jumanly propose un texte par défaut pour chaque type. |
| `hire.templates.page.edit` | Modifier |
| `hire.templates.page.view` | Voir |
| `hire.templates.page.kind` | Type |
| `hire.templates.page.name` | Nom du modèle |
| `hire.templates.page.save` | Enregistrer |
| `hire.templates.page.delete` | Supprimer |
| `hire.templates.page.new` | Nouveau modèle |
| `hire.templates.page.bodyPlaceholder` | Bonjour '{prenom}', … |
| `hire.templates.page.create` | Créer le modèle |

#### Filtres du pipeline

| Clé | Texte |
|---|---|
| `hire.pipeline.filter.score.text` | Compatibilité |
| `hire.pipeline.filter.score.band` | {band} |
| `hire.pipeline.filter.skills` | Compétences |
| `hire.pipeline.filter.location` | Localisation |
| `hire.pipeline.filter.experience` | Expérience |
| `hire.pipeline.filter.languages` | Langues |
| `hire.pipeline.filter.availability` | Disponibilité |
| `hire.pipeline.filter.knockout` | Critères indispensables remplis |
| `hire.pipeline.filter.rating` | Note de l'équipe |
| `hire.pipeline.filter.notRated` | Non évalués |
| `hire.pipeline.filter.assignee` | Évaluateur |
| `hire.pipeline.filter.date` | Date de candidature |
| `hire.pipeline.filter.source.text` | Origine |
| `hire.pipeline.filter.source.applied` | Candidature directe |
| `hire.pipeline.filter.source.sourced` | Mise en relation depuis le vivier |
| `hire.pipeline.filter.source.pool` | Ajouté depuis un vivier |
| `hire.pipeline.filter.deep.locked` | Filtres approfondis · Disponible avec {plan} |
| `hire.pipeline.filter.reset` | Réinitialiser |
| `hire.pipeline.filter.apply` | Appliquer |
| `hire.pipeline.filter.none` | Aucun candidat ne correspond à ces filtres. |
| `hire.pipeline.empty.text` | Pas encore de candidature. Partagez le lien de l'offre pour la faire connaître. |
| `hire.pipeline.empty.cta` | Copier le lien de l'offre |
| `hire.pipeline.matching.locked` | Suggestions de matching · Disponible avec {plan} |
| `hire.pipeline.matching.explainLocked` | Explication détaillée du score · Disponible avec {plan} |

---

### `/app/hire/candidats/[applicationId]` · Fiche candidature

*Réunir tout ce qu'il faut pour décider, avec traçabilité.*

#### En-tête et onglets

| Clé | Texte |
|---|---|
| `hire.application.back` | Retour au pipeline |
| `hire.application.title` | Fiche candidature |
| `hire.application.decision.title` | Votre décision |
| `hire.application.decision.advance` | Étape suivante · {stage} |
| `hire.application.skills.matched` | Correspondent à l'offre |
| `hire.application.skills.other` | Autres compétences |
| `hire.application.position` | {index} sur {total} |
| `hire.application.appliedFor` | Candidature à {jobTitle} |
| `hire.application.appliedOn` | Reçue le {date, date, long} |
| `hire.application.source.direct` | Candidature directe |
| `hire.application.source.contact` | Après mise en relation |
| `hire.application.stage` | Étape |
| `hire.application.previous` | Candidat précédent |
| `hire.application.next` | Candidat suivant |
| `hire.application.tab.profile` | Profil |
| `hire.application.tab.cv` | CV |
| `hire.application.tab.analysis` | Analyse |
| `hire.application.tab.answers` | Réponses |
| `hire.application.tab.scorecard` | Évaluation |
| `hire.application.tab.notes` | Notes |
| `hire.application.tab.history` | Historique |
| `hire.application.tab.messages` | Messages |
| `hire.application.certificates` | Attestations Jumanly |
| `hire.application.certificate.verify` | Vérifier |
| `hire.application.cv.download` | Télécharger le CV |
| `hire.application.cv.original` | Fichier d'origine |
| `hire.application.letter.text` | Lettre de motivation |
| `hire.application.letter.none` | Pas de lettre jointe. |
| `hire.application.answers.empty` | Aucune question posée pour cette offre. |
| `hire.application.knockout.text` | Critères indispensables |
| `hire.application.knockout.met` | Rempli |
| `hire.application.knockout.notMet` | Non rempli |
| `hire.application.knockout.unknown` | Information absente du profil |
| `hire.application.knockout.note` | Ce signalement n'écarte pas le candidat. Vérifiez l'information avec lui si besoin. |
| `hire.application.privacy` | Ces informations sont confidentielles. Ne les partagez pas hors de l'équipe de recrutement. |
| `hire.application.planLabel.hidden` | Le forfait du talent n'est jamais affiché ni pris en compte. |
| `hire.application.addToPool` | Ajouter à un vivier |
| `hire.application.pool.none` | Créez d'abord un vivier dans l'onglet Viviers. |

#### Score

| Clé | Texte |
|---|---|
| `hire.application.score.title` | Compatibilité |
| `hire.application.score.value` | {score} % · {band} |
| `hire.application.score.why` | Pourquoi ? |
| `hire.application.score.updated` | Calculé {time, relative} |
| `hire.application.score.computed` | Calculé {time} |
| `hire.application.score.disabled` | Ce candidat a choisi de ne pas faire calculer sa compatibilité. Examinez son profil directement. |
| `hire.application.score.disputed` | Le candidat a demandé une révision humaine de ce score. |

#### Notes de l'équipe

| Clé | Texte |
|---|---|
| `hire.application.notes.title` | Notes de l'équipe |
| `hire.application.notes.placeholder` | Ajoutez une note. Mentionnez un collègue avec @. |
| `hire.application.notes.add` | Ajouter la note |
| `hire.application.notes.private` | Visible uniquement par votre équipe, jamais par le candidat. |
| `hire.application.notes.author` | {memberName} · {time, relative} |
| `hire.application.notes.edit` | Modifier |
| `hire.application.notes.delete.text` | Supprimer |
| `hire.application.notes.delete.confirm` | Supprimer cette note ? |
| `hire.application.notes.empty` | Aucune note pour l'instant. |
| `hire.application.notes.reminder` | Restez factuel : notez ce qui concerne le poste, rien sur la vie privée du candidat. |
| `hire.application.notes.collab.locked` | Notes partagées entre recruteurs · Disponible avec {plan} |
| `hire.application.notes.edited` | Modifiée |
| `hire.application.notes.save` | Enregistrer |
| `hire.application.notes.mentioned` | {count, plural, one {# collègue prévenu.} other {# collègues prévenus.}} |

#### Grille d'évaluation

| Clé | Texte |
|---|---|
| `hire.scorecard.title` | Grille d'évaluation |
| `hire.scorecard.locked` | Grilles d'évaluation · Disponible avec {plan} |
| `hire.scorecard.template.text` | Modèle de grille |
| `hire.scorecard.template.edit` | Modifier le modèle |
| `hire.scorecard.criterion.add` | Ajouter un critère |
| `hire.scorecard.criterion.name.text` | Critère |
| `hire.scorecard.criterion.name.placeholder` | Ex. : Maîtrise de SQL |
| `hire.scorecard.criterion.description` | Ce que vous observez |
| `hire.scorecard.rating.text` | Note |
| `hire.scorecard.rating.1` | Insuffisant |
| `hire.scorecard.rating.2` | À développer |
| `hire.scorecard.rating.3` | Conforme |
| `hire.scorecard.rating.4` | Solide |
| `hire.scorecard.rating.5` | Excellent |
| `hire.scorecard.comment` | Commentaire |
| `hire.scorecard.recommendation.text` | Votre avis |
| `hire.scorecard.recommendation.strongYes` | Tout à fait favorable |
| `hire.scorecard.recommendation.yes` | Favorable |
| `hire.scorecard.recommendation.no` | Réservé |
| `hire.scorecard.recommendation.strongNo` | Défavorable |
| `hire.scorecard.submit` | Enregistrer mon évaluation |
| `hire.scorecard.submitted` | Évaluation enregistrée. |
| `hire.scorecard.others.text` | Évaluations de l'équipe |
| `hire.scorecard.others.hidden` | Les avis des autres évaluateurs apparaissent après l'envoi du vôtre, pour éviter de vous influencer. |
| `hire.scorecard.average` | Moyenne de l'équipe : {average}/5 · {count, plural, one {# évaluation} other {# évaluations}} |
| `hire.scorecard.pending` | En attente : {names} |
| `hire.scorecard.empty` | Aucune évaluation pour l'instant. |
| `hire.scorecard.template.hint` | Un critère par ligne. Ajoutez une précision après deux-points, par exemple « SQL : requêtes et jointures ». |
| `hire.scorecard.template.saved` | Modèle de grille enregistré. |
| `hire.scorecard.template.invalid` | Indiquez entre 1 et {max} critères, un par ligne. |
| `hire.scorecard.template.save` | Enregistrer le modèle |
| `hire.scorecard.mine` | Votre évaluation |
| `hire.scorecard.update` | Mettre à jour mon évaluation |
| `hire.scorecard.reviewer` | {memberName} · {average}/5 · {recommendation} |
| `hire.scorecard.invalid` | Notez chaque critère et donnez votre avis. |

#### Historique des décisions

| Clé | Texte |
|---|---|
| `hire.history.title` | Historique des décisions |
| `hire.history.locked` | Historique des décisions · Disponible avec {plan} |
| `hire.history.subtitle` | Chaque décision est datée et attribuée, pour un recrutement traçable. |
| `hire.history.event.applied` | Candidature reçue |
| `hire.history.event.viewed` | Profil consulté par {memberName} |
| `hire.history.event.moved` | {memberName} a déplacé la candidature de « {from} » vers « {to} » |
| `hire.history.event.rated` | {memberName} a rempli la grille d'évaluation |
| `hire.history.event.noted` | {memberName} a ajouté une note |
| `hire.history.event.interviewScheduled` | Entretien planifié le {date, date, medium} par {memberName} |
| `hire.history.event.documentRequested` | {memberName} a demandé : {documentName} |
| `hire.history.event.rejected` | {memberName} a décidé de ne pas retenir la candidature · Motif : {reason} |
| `hire.history.event.rejectionSent` | Message de refus envoyé |
| `hire.history.event.hired` | {memberName} a marqué le candidat comme recruté |
| `hire.history.event.scoreDisputed` | Le candidat a demandé une révision humaine du score |
| `hire.history.event.scoreReviewed` | Score revu par {memberName} |
| `hire.history.event.withdrawn` | Le candidat a retiré sa candidature |
| `hire.history.event.message` | Message de {memberName} |
| `hire.history.timestamp` | {date, date, medium} à {time} |
| `hire.history.export` | Exporter l'historique |
| `hire.history.col.date` | Date |
| `hire.history.col.event` | Événement |

#### Message, rendez-vous et document depuis la fiche

| Clé | Texte |
|---|---|
| `hire.application.message` | Envoyer un message |
| `hire.application.schedule.text` | Planifier un entretien |
| `hire.application.schedule.locked` | Rendez-vous · Disponible avec {plan} |
| `hire.application.requestDocument.text` | Demander un document |
| `hire.application.requestDocument.name.text` | Document demandé |
| `hire.application.requestDocument.name.placeholder` | Ex. : Copie du diplôme |
| `hire.application.requestDocument.due` | À déposer avant le |
| `hire.application.requestDocument.note` | Message (facultatif) |
| `hire.application.requestDocument.send` | Envoyer la demande |
| `hire.application.requestDocument.sent` | Demande envoyée au candidat. |
| `hire.application.requestDocument.forbidden` | Ne demandez que des documents utiles au poste. Les documents sur la santé, la religion ou la situation familiale sont interdits. |

---

### `/app/hire/talents` · Recherche dans le vivier

*Trouver des talents qui ont choisi d'être visibles, et leur demander une mise en relation.*

| Clé | Texte |
|---|---|
| `hire.talents.title` | Rechercher des talents |
| `hire.talents.subtitle` | Seuls les talents qui ont choisi d'être visibles des recruteurs apparaissent ici. |
| `hire.talents.locked.title` | Recherche dans le vivier · Disponible avec {plan} |
| `hire.talents.locked.body` | Avec votre forfait, vous recevez les candidatures et consultez les profils des personnes qui ont postulé. |
| `hire.talents.search.placeholder` | Compétence, métier, mot-clé |
| `hire.talents.search.location` | Lieu |
| `hire.talents.search.submit` | Rechercher |
| `hire.talents.search.fromJob` | Chercher des profils pour une offre |
| `hire.talents.quota.text` | {used}/{quota} recherches ce mois · {contactsUsed}/{contactsQuota} demandes de mise en relation |
| `hire.talents.quota.reached.search` | Vous avez utilisé toutes vos recherches du mois. Elles se renouvellent le {date, date, long}. Cette limite protège les données des talents. |
| `hire.talents.quota.reached.contact` | Vous avez utilisé toutes vos demandes de mise en relation du mois. Elles se renouvellent le {date, date, long}. |
| `hire.talents.quota.upgrade` | Voir les forfaits |
| `hire.talents.quota.title` | Quotas du mois |
| `hire.talents.quota.searches` | Recherches dans le vivier |
| `hire.talents.quota.contacts` | Demandes de mise en relation |
| `hire.talents.quota.value` | {used} sur {max} |
| `hire.talents.quota.unlimited` | Illimité |
| `hire.talents.quota.renewal` | Renouvellement le {date, date, long}. Cette limite protège les données des talents. |
| `hire.talents.sort` | Trier : {value} |
| `hire.talents.sortScore` | Compatibilité |
| `hire.talents.filter.skills` | Compétences |
| `hire.talents.filter.experience` | Expérience |
| `hire.talents.filter.location` | Localisation |
| `hire.talents.filter.remote` | Mode de travail accepté |
| `hire.talents.filter.contract` | Contrat recherché |
| `hire.talents.filter.languages` | Langues |
| `hire.talents.filter.education` | Formation |
| `hire.talents.filter.availability` | Disponibilité |
| `hire.talents.filter.certificates` | Avec attestation Jumanly |
| `hire.talents.filter.deep.locked` | Filtres approfondis · Disponible avec {plan} |
| `hire.talents.filter.deep.text` | Filtres approfondis |
| `hire.talents.results` | {count, plural, =0 {Aucun talent trouvé} one {# talent trouvé} other {# talents trouvés}} |
| `hire.talents.result.anonymous` | Talent anonyme · {headline} |
| `hire.talents.result.headline` | {headline} · {city} |
| `hire.talents.result.experience` | {years, plural, =0 {Débutant} one {# an d'expérience} other {# ans d'expérience}} |
| `hire.talents.result.score` | {score} % compatible avec {jobTitle} |
| `hire.talents.result.view` | Voir le profil |
| `hire.talents.result.addToPool` | Ajouter à un vivier |
| `hire.talents.result.contact` | Demander une mise en relation |
| `hire.talents.result.contacted` | Demande envoyée |
| `hire.talents.result.connected` | En relation |
| `hire.talents.empty` | Aucun talent ne correspond. Essayez moins de filtres ou un lieu plus large. |
| `hire.talents.filter.any` | Indifférent |
| `hire.talents.filter.experienceMin` | Expérience minimale (années) |
| `hire.talents.filter.job.none` | Aucune offre |
| `hire.talents.capped` | Seuls les {max} premiers résultats sont proposés. Précisez votre recherche pour trouver plus vite. |
| `hire.talents.page.previous` | Page précédente |
| `hire.talents.page.next` | Page suivante |
| `hire.talents.page.current` | Page {page} sur {pages} |
| `hire.talents.start` | Saisissez une compétence, un métier ou un lieu pour lancer une recherche. Chaque recherche compte dans le quota du mois. |
| `hire.talents.blocked` | Vous avez consulté beaucoup de profils en peu de temps. L'accès est suspendu pendant une heure et l'équipe Jumanly a été prévenue. |
| `hire.talents.profile.back` | Retour à la recherche |
| `hire.talents.profile.applied` | Ce talent a postulé à l'une de vos offres. |
| `hire.talents.profile.full` | Profil complet visible : ce talent a accepté votre demande ou postulé à l'une de vos offres. |
| `hire.talents.profile.experience` | Expériences |
| `hire.talents.profile.education` | Formation |
| `hire.talents.profile.skills` | Compétences |
| `hire.talents.profile.verified` | Vérifiée |
| `hire.talents.profile.openConversation` | Ouvrir la conversation |
| `hire.talents.profile.anonymousNote` | Ce talent est anonyme. Son nom et sa photo seront visibles s'il accepte votre demande. |
| `hire.talents.profile.limited` | Profil résumé. Le profil complet est visible après acceptation de votre demande ou si le talent postule à l'une de vos offres. |

#### Demande de mise en relation

| Clé | Texte |
|---|---|
| `hire.contact.title` | Demander une mise en relation |
| `hire.contact.subtitle` | Le talent reçoit votre demande et décide d'y répondre. Aucun échange n'est possible avant son accord. |
| `hire.contact.job.text` | Offre concernée |
| `hire.contact.job.none` | Pas d'offre précise (prise de contact générale) |
| `hire.contact.message.text` | Votre message |
| `hire.contact.message.placeholder` | Présentez-vous, le poste et pourquoi son profil vous intéresse. |
| `hire.contact.message.min` | Un message d'au moins {min} caractères augmente les chances de réponse. |
| `hire.contact.cost` | Cette demande utilisera 1 mise en relation sur les {remaining} restantes ce mois. |
| `hire.contact.send` | Envoyer la demande |
| `hire.contact.sent` | Demande envoyée. Vous serez prévenu de la réponse du talent. |
| `hire.contact.status.pending` | En attente de réponse |
| `hire.contact.status.accepted` | Acceptée |
| `hire.contact.status.declined` | Déclinée |
| `hire.contact.status.expired` | Expirée |
| `hire.contact.declined.note` | Le talent a décliné. Merci de respecter son choix : une nouvelle demande ne sera possible qu'après {days} jours. |
| `hire.contact.blocked` | Ce talent ne souhaite plus recevoir de demandes de votre organisation. |
| `hire.contact.noPayment` | Il est interdit de demander un paiement à un talent. Tout manquement entraîne la suspension du compte. |
| `hire.contact.error.invalid` | Votre message doit compter au moins {min} caractères. |
| `hire.contact.error.pending` | Une demande est déjà en attente de réponse pour ce talent. |
| `hire.contact.error.connected` | Vous êtes déjà en relation avec ce talent. |
| `hire.contact.error.locked` | Les demandes de mise en relation ne sont pas incluses dans votre forfait. |
| `hire.contact.error.notFound` | Ce profil n'est plus visible dans le vivier. |

---

### `/app/hire/viviers` · Viviers et listes

*Garder des talents en tête pour de futurs recrutements, seul ou en équipe.*

| Clé | Texte |
|---|---|
| `hire.pools.title` | Viviers de talents |
| `hire.pools.subtitle` | Regroupez des profils pour vos besoins futurs. |
| `hire.pools.new` | Nouveau vivier |
| `hire.pools.name.text` | Nom du vivier |
| `hire.pools.name.placeholder` | Ex. : Analystes data · Kinshasa |
| `hire.pools.description` | Description (facultatif) |
| `hire.pools.descriptionShort` | Description |
| `hire.pools.visibility.text` | Visibilité |
| `hire.pools.visibility.private` | Moi uniquement |
| `hire.pools.visibility.team` | Mon équipe |
| `hire.pools.visibility.org` | Toute l'organisation |
| `hire.pools.visibility.shared.locked` | Viviers partagés · Disponible avec {plan} |
| `hire.pools.count` | {count, plural, =0 {Aucun talent} one {# talent} other {# talents}} |
| `hire.pools.updated` | Mis à jour {time, relative} |
| `hire.pools.owner` | Créé par {memberName} |
| `hire.pools.open` | Ouvrir |
| `hire.pools.rename` | Renommer |
| `hire.pools.delete.text` | Supprimer le vivier |
| `hire.pools.delete.confirm.title` | Supprimer « {poolName} » ? |
| `hire.pools.delete.confirm.body` | Les talents ne sont pas prévenus et restent sur Jumanly. Seule la liste est supprimée. |
| `hire.pools.added` | {candidateName} ajouté à « {poolName} ». |
| `hire.pools.removed` | Retiré du vivier. |
| `hire.pools.remove` | Retirer du vivier |
| `hire.pools.addToJob` | Proposer pour une offre |
| `hire.pools.consentNote` | Un talent qui passe son profil en privé disparaît automatiquement de vos viviers, sauf s'il a postulé à l'une de vos offres. |
| `hire.pools.empty` | Aucun vivier. Créez-en un depuis la recherche ou une fiche candidature. |
| `hire.pools.detail.empty` | Ce vivier est vide. |
| `hire.pools.created` | Vivier créé. |
| `hire.pools.renamed` | Vivier renommé. |
| `hire.pools.deleted` | Vivier supprimé. |
| `hire.pools.locked` | Viviers de talents · Disponible avec {plan} |
| `hire.pools.create` | Créer le vivier |
| `hire.pools.save` | Enregistrer |
| `hire.pools.back` | Tous les viviers |
| `hire.pools.choose` | Vivier |
| `hire.pools.add` | Ajouter |
| `hire.pools.note` | Note (facultatif) |
| `hire.pools.invalid` | Donnez un nom d'au moins 2 caractères. |
| `hire.pools.visibility.teamRequired` | Rejoignez d'abord une équipe pour partager un vivier avec elle. |
| `hire.pools.addedDone` | Talent ajouté au vivier. |
| `hire.pools.updatedOn` | Mis à jour le {date, date, medium} |
| `hire.pools.addedOn` | Ajouté le {date, date, medium} |
| `hire.pools.error.forbidden` | Cette action n'est pas permise pour votre rôle. |
| `hire.pools.error.notFound` | Ce vivier ou ce profil n'est plus disponible. |
| `hire.pools.search` | Rechercher un vivier |
| `hire.pools.searchEmpty` | Aucun vivier ne correspond à « {query} ». |
| `hire.pools.updatedAgo` | Mis à jour {time} |
| `hire.pools.addedAgo` | Ajouté {time} |
| `hire.pools.table.talent` | Talent |
| `hire.pools.table.origin` | Origine |
| `hire.pools.table.added` | Ajout |
| `hire.pools.origin.applied` | Candidat · {jobTitle} |
| `hire.pools.origin.contact` | Mise en relation acceptée |
| `hire.pools.origin.search` | Depuis la recherche de talents |
| `hire.pools.actions` | Actions pour {name} |

---

### `/app/hire/entretiens` · Entretiens et agenda

*Planifier, confirmer et préparer les entretiens.*

| Clé | Texte |
|---|---|
| `hire.interviews.title` | Entretiens |
| `hire.interviews.locked` | Rendez-vous et organisation des entretiens · Disponible avec {plan} |
| `hire.interviews.view.agenda` | Agenda |
| `hire.interviews.view.list` | Liste |
| `hire.interviews.view.day` | Jour |
| `hire.interviews.view.week` | Semaine |
| `hire.interviews.view.month` | Mois |
| `hire.interviews.today` | Aujourd'hui |
| `hire.interviews.new` | Planifier un entretien |
| `hire.interviews.filter.mine` | Mes entretiens |
| `hire.interviews.filter.team` | Toute l'équipe |
| `hire.interviews.filter.job` | Offre |
| `hire.interviews.form.candidate` | Candidat |
| `hire.interviews.form.job` | Offre |
| `hire.interviews.form.type.text` | Type |
| `hire.interviews.form.type.video` | Vidéo |
| `hire.interviews.form.type.onsite` | Sur place |
| `hire.interviews.form.type.audio` | Audio en ligne |
| `hire.interviews.form.duration` | Durée |
| `hire.interviews.form.slots.text` | Créneaux proposés |
| `hire.interviews.form.slots.hint` | Proposez un à trois créneaux. Le candidat choisit. |
| `hire.interviews.form.slots.add` | Ajouter un créneau |
| `hire.interviews.form.timezone` | Fuseau horaire : {timezone} |
| `hire.interviews.form.link.text` | Lien de visioconférence |
| `hire.interviews.form.link.placeholder` | https:// |
| `hire.interviews.form.address` | Adresse |
| `hire.interviews.form.participants.text` | Participants de l'équipe |
| `hire.interviews.form.participants.locked` | Entretiens collaboratifs · Disponible avec {plan} |
| `hire.interviews.form.message.text` | Message au candidat |
| `hire.interviews.form.message.default` | Bonjour {firstName}, nous souhaitons vous rencontrer pour échanger sur le poste de {jobTitle}. Merci de choisir le créneau qui vous convient. |
| `hire.interviews.form.send` | Envoyer l'invitation |
| `hire.interviews.sent` | Invitation envoyée. Vous serez prévenu de la réponse. |
| `hire.interviews.status.pending` | En attente du candidat |
| `hire.interviews.status.confirmed` | Confirmé |
| `hire.interviews.status.reschedule` | Nouveau créneau demandé |
| `hire.interviews.status.declined` | Décliné |
| `hire.interviews.status.canceled` | Annulé |
| `hire.interviews.status.done` | Terminé |
| `hire.interviews.status.noShow` | Absent |
| `hire.interviews.item` | {time} · {candidateName} · {jobTitle} |
| `hire.interviews.join` | Rejoindre |
| `hire.interviews.reschedule` | Reprogrammer |
| `hire.interviews.cancel.text` | Annuler l'entretien |
| `hire.interviews.cancel.confirm.title` | Annuler cet entretien ? |
| `hire.interviews.cancel.confirm.body` | Le candidat sera prévenu. Ajoutez un mot d'explication, c'est apprécié. |
| `hire.interviews.cancel.reason` | Message au candidat |
| `hire.interviews.markDone` | Marquer comme terminé |
| `hire.interviews.fillScorecard` | Remplir la grille d'évaluation |
| `hire.interviews.prep` | Préparer l'entretien |
| `hire.interviews.empty.text` | Aucun entretien prévu. |
| `hire.interviews.empty.cta` | Planifier un entretien |
| `hire.interviews.noShow` | Marquer comme absent |
| `hire.interviews.proposed` | Créneaux proposés par le candidat : {slots} |
| `hire.interviews.slotsPending` | Créneaux proposés : {slots} |
| `hire.interviews.organizer` | Organisé par {memberName} |
| `hire.interviews.error.invalid` | Vérifiez le candidat, le type, la durée et au moins un créneau. |
| `hire.interviews.error.past` | Choisissez des créneaux à venir. |
| `hire.interviews.canceled` | Entretien annulé. Le candidat a été prévenu. |
| `hire.interviews.updated` | Entretien mis à jour. |
| `hire.interviews.rescheduled` | Nouveaux créneaux envoyés au candidat. |
| `hire.interviews.form.noCandidate` | Aucun candidat en cours. Les entretiens se planifient pour une candidature active. |
| `hire.interviews.form.minutes` | {minutes} min |
| `hire.interviews.form.slot` | Créneau {number} |
| `hire.interviews.upcoming` | À venir |
| `hire.interviews.waiting` | En attente de réponse |
| `hire.interviews.past` | Passés et annulés |
| `hire.interviews.previous` | Période précédente |
| `hire.interviews.next` | Période suivante |
| `hire.interviews.toConfirm` | À confirmer |
| `hire.interviews.linkSent` | lien envoyé au candidat |
| `hire.interviews.prepIntro` | Points à éclaircir en entretien, repérés par le score de compatibilité de {candidateName} : |
| `hire.interviews.prepWhy` | Ces points viennent du score et de l'offre. Ils ne changent pas le score et ne valent pas évaluation. |
| `hire.interviews.prepEmpty` | Le score ne relève ni critère à vérifier ni compétence manquante pour cette candidature. |
| `hire.interviews.prepOpen` | Voir le score détaillé |
| `hire.interviews.dayEmpty` | Aucun entretien ce jour-là. |
| `hire.interviews.selectHint` | Choisissez un entretien dans l'agenda pour voir son détail. |
| `hire.interviews.legend` | Légende des statuts |
| `hire.interviews.slotProposed` | Créneau proposé |
| `hire.interviews.actions` | Actions de l'entretien |
| `hire.interviews.calendar` | Agenda des entretiens |

---

### `/app/hire/rapports` · Statistiques et rapports

*Piloter les recrutements selon le niveau de rapports du forfait.*

| Clé | Texte |
|---|---|
| `hire.reports.title` | Rapports |
| `hire.reports.period.text` | Période |
| `hire.reports.period.30d` | 30 derniers jours |
| `hire.reports.period.90d` | 3 derniers mois |
| `hire.reports.period.12m` | 12 derniers mois |
| `hire.reports.period.custom` | Personnalisée |
| `hire.reports.basic.title` | Vue d'ensemble |
| `hire.reports.basic.activeJobs` | Offres actives |
| `hire.reports.basic.applications` | Candidatures reçues |
| `hire.reports.basic.hires` | Recrutements |
| `hire.reports.stats.title` | Statistiques de recrutement |
| `hire.reports.stats.locked` | Statistiques de recrutement · Disponible avec {plan} |
| `hire.reports.stats.funnel` | Entonnoir par étape |
| `hire.reports.stats.conversion` | Taux de passage |
| `hire.reports.stats.timeToHire.text` | Délai moyen de recrutement |
| `hire.reports.stats.timeToHire.value` | {days} jours |
| `hire.reports.stats.responseTime` | Délai moyen de première réponse |
| `hire.reports.stats.sources` | Origine des candidatures |
| `hire.reports.stats.byJob` | Par offre |
| `hire.reports.advanced.title` | Tableaux de bord avancés |
| `hire.reports.advanced.locked` | Rapports avancés · Disponible avec {plan} |
| `hire.reports.advanced.byRecruiter` | Activité par recruteur |
| `hire.reports.advanced.scorecards` | Synthèse des évaluations |
| `hire.reports.advanced.decisions` | Motifs de décision |
| `hire.reports.advanced.candidateExperience` | Candidats informés de la décision |
| `hire.reports.consolidated.title` | Rapports consolidés |
| `hire.reports.consolidated.locked` | Rapports par équipe et département · Disponible avec {plan} |
| `hire.reports.consolidated.byTeam` | Par équipe |
| `hire.reports.consolidated.byDepartment` | Par département |
| `hire.reports.custom.title` | Tableaux de bord personnalisés |
| `hire.reports.custom.locked` | Tableaux de bord personnalisés · Disponible avec {plan} |
| `hire.reports.custom.new` | Nouveau tableau de bord |
| `hire.reports.custom.addWidget` | Ajouter un indicateur |
| `hire.reports.custom.byEntity` | Par entité |
| `hire.reports.export.text` | Exporter |
| `hire.reports.export.csv` | Exporter en CSV |
| `hire.reports.export.pdf` | Exporter en PDF |
| `hire.reports.export.locked` | Export des rapports · Disponible avec {plan} |
| `hire.reports.export.ready` | Export prêt. Le téléchargement commence. |
| `hire.reports.export.privacy` | Les exports ne contiennent que des données agrégées et les informations nécessaires au suivi de vos recrutements. |
| `hire.reports.empty` | Pas encore assez de données pour cette période. |
| `hire.reports.period.from` | Du |
| `hire.reports.period.to` | Au |
| `hire.reports.period.apply` | Afficher |
| `hire.reports.col.name` | Nom |
| `hire.reports.col.applications` | Candidatures |
| `hire.reports.col.hires` | Recrutements |
| `hire.reports.col.value` | Valeur |
| `hire.reports.col.count` | Nombre |
| `hire.reports.col.moves` | Déplacements |
| `hire.reports.col.decisions` | Décisions |
| `hire.reports.col.notes` | Notes |
| `hire.reports.col.section` | Section |
| `hire.reports.col.rate` | Taux |
| `hire.reports.rate` | {rate} % |
| `hire.reports.none` | Non disponible |
| `hire.reports.source.direct` | Candidature directe |
| `hire.reports.source.invitation` | Invitation |
| `hire.reports.source.talent_search` | Recherche dans le vivier |
| `hire.reports.scorecards.summary` | {count, plural, =0 {Aucune évaluation} one {# évaluation} other {# évaluations}} · moyenne {average}/5 |
| `hire.reports.custom.note` | Indicateurs ventilés par entité. Pour un tableau de bord sur mesure, écrivez-nous : nous le configurons avec vous. |
| `hire.reports.pdf.title` | Rapport de recrutement · {org} |
| `hire.reports.pdf.period` | Du {from, date, long} au {to, date, long} |
| `hire.reports.pdf.generated` | Édité le {date, date, long} sur Jumanly |
| `hire.reports.stats.sourcesTotal` | {count, plural, one {candidature} other {candidatures}} |
| `hire.reports.advanced.candidateExperienceHint` | Part des candidats non retenus qui ont reçu un message de refus. |
| `hire.reports.scorecards.average` | Moyenne sur 5 |
| `hire.reports.scorecards.recommendations` | Recommandations |
| `hire.reports.consolidated.share` | Part des candidatures |
| `hire.reports.col.job` | Offre |
| `hire.reports.col.recruiter` | Recruteur |
| `hire.reports.days` | {days} j |

---

### `/app/organisation` · Organisation

*Gérer l'identité, la vérification, les membres et la structure de l'organisation.*

#### Structure et profil entreprise

| Clé | Texte |
|---|---|
| `org.title` | Organisation |
| `org.tab.profile` | Profil |
| `org.tab.verification` | Vérification |
| `org.tab.members` | Membres |
| `org.tab.teams` | Équipes |
| `org.tab.departments` | Départements |
| `org.tab.entities` | Entités |
| `org.tab.subscription` | Abonnement |
| `org.profile.title` | Profil de l'organisation |
| `org.profile.subtitle` | Ces informations apparaissent sur vos offres et votre page publique. |
| `org.profile.logo.text` | Logo |
| `org.profile.logo.upload` | Ajouter un logo |
| `org.profile.cover` | Image de couverture |
| `org.profile.name` | Nom de l'organisation |
| `org.profile.legalName` | Raison sociale |
| `org.profile.type.text` | Type |
| `org.profile.type.company` | Entreprise |
| `org.profile.type.consultant` | Cabinet ou recruteur indépendant |
| `org.profile.type.ngo` | Association ou ONG |
| `org.profile.type.public` | Organisme public |
| `org.profile.type.education` | Établissement d'enseignement |
| `org.profile.sector` | Secteur |
| `org.profile.size.text` | Taille |
| `org.profile.size.value` | {min} à {max} employés |
| `org.profile.country` | Pays du siège |
| `org.profile.city` | Ville |
| `org.profile.website.text` | Site web |
| `org.profile.website.placeholder` | https:// |
| `org.profile.category.text` | Type d'organisation |
| `org.profile.category.none` | Non précisé |
| `org.profile.category.company` | Entreprise |
| `org.profile.category.consultant` | Cabinet ou consultant RH |
| `org.profile.category.ngo` | ONG ou association |
| `org.profile.category.public` | Institution publique |
| `org.profile.category.education` | École ou université |
| `org.profile.contactEmail` | E-mail de contact recrutement |
| `org.profile.description.text` | Présentation |
| `org.profile.description.placeholder` | Votre activité, vos valeurs, ce qui fait la différence pour vos équipes. |
| `org.profile.publicPage.text` | Page publique |
| `org.profile.publicPage.view` | Voir la page publique |
| `org.profile.saved` | Profil de l'organisation enregistré. |
| `org.profile.save` | Enregistrer |
| `org.profile.invalid` | Certaines informations ne sont pas valides. Vérifiez le formulaire. |
| `org.profile.countryHint` | Code pays à deux lettres, par exemple CI ou CM. |
| `org.profile.legalNameHint` | Nom officiel, tel qu'il figure au registre. |

#### Vérification

| Clé | Texte |
|---|---|
| `org.verification.title` | Vérification de l'organisation |
| `org.verification.subtitle` | Le badge « Entreprise vérifiée » rassure les talents et met vos offres en confiance. |
| `org.verification.locked` | Profil entreprise vérifié · Disponible avec {plan} |
| `org.verification.status.none` | Non vérifiée |
| `org.verification.status.pending` | Vérification en cours |
| `org.verification.status.verified` | Entreprise vérifiée |
| `org.verification.status.rejected` | Vérification refusée |
| `org.verification.status.expired` | Vérification à renouveler |
| `org.verification.docs` | Documents demandés |
| `org.verification.doc.registration` | Justificatif d'immatriculation (registre du commerce ou équivalent) |
| `org.verification.doc.taxId` | Numéro d'identification fiscale ou équivalent |
| `org.verification.doc.domain` | Adresse e-mail sur le domaine de l'organisation |
| `org.verification.doc.mandate` | Justificatif de votre rôle dans l'organisation |
| `org.verification.domain.code` | Nous avons envoyé un code à {email}. |
| `org.verification.submit` | Envoyer la demande |
| `org.verification.submitted` | Demande envoyée. Nous revenons vers vous par e-mail sous {days, plural, one {# jour ouvré} other {# jours ouvrés}}. |
| `org.verification.rejected.reason` | Motif : {reason} |
| `org.verification.resubmit` | Compléter la demande |
| `org.verification.verifiedOn` | Vérifiée le {date, date, long} |
| `org.verification.badge.tooltip` | Jumanly a vérifié l'existence de cette organisation et le rôle de la personne qui l'administre. |
| `org.verification.form.registration` | Numéro d'immatriculation (registre du commerce ou équivalent) |
| `org.verification.form.taxId` | Numéro d'identification fiscale (facultatif) |
| `org.verification.form.domainEmail` | Votre adresse e-mail sur le domaine de l'organisation (facultatif) |
| `org.verification.form.mandate` | Votre fonction et ce qui l'atteste |
| `org.verification.form.mandateHint` | Ex. : Directrice des ressources humaines, mandat signé par la direction générale. |
| `org.verification.invalid` | Complétez le numéro d'immatriculation et votre fonction. |
| `org.verification.status.info_requested` | Complément demandé |
| `org.verification.infoRequested` | Jumanly a besoin d'un complément : {reason} |
| `org.verification.answer` | Envoyer le complément |
| `org.verification.form.documents` | Justificatifs (PDF ou image) |
| `org.verification.form.documentsHint` | Registre du commerce, pièce attestant votre fonction… 4 Mo au total par envoi, 6 documents au plus. |
| `org.verification.documents.title` | Justificatifs envoyés |
| `org.verification.documents.remove` | Retirer {name} |
| `org.verification.documents.removed` | Justificatif retiré. |
| `org.verification.documents.meta` | {size} · envoyé le {date, date, medium} |
| `org.verification.fileError.fileType` | Seuls les PDF et les images (PNG, JPEG, WEBP) sont acceptés. |
| `org.verification.fileError.fileSize` | Les justificatifs dépassent 4 Mo pour cet envoi. Envoyez-les en plusieurs fois. |
| `org.verification.fileError.fileCount` | Vous avez atteint 6 justificatifs. Retirez-en un pour en ajouter un autre. |
| `org.verification.fileError.status` | Votre organisation est déjà vérifiée. |

#### Membres et invitations

| Clé | Texte |
|---|---|
| `org.members.title` | Membres |
| `org.members.seats.text` | {used} sur {max, plural, one {# utilisateur} other {# utilisateurs}} inclus dans {plan} |
| `org.members.seats.full` | Tous les sièges sont occupés. Retirez un membre ou passez à un forfait supérieur pour inviter quelqu'un. |
| `org.members.invite` | Inviter un membre |
| `org.members.search.placeholder` | Rechercher un membre |
| `org.members.col.name` | Nom |
| `org.members.col.role` | Rôle |
| `org.members.col.teams` | Équipes |
| `org.members.col.lastActive` | Dernière activité |
| `org.members.col.status` | Statut |
| `org.members.status.active` | Actif |
| `org.members.status.invited` | Invitation envoyée |
| `org.members.status.suspended` | Suspendu |
| `org.members.you` | Vous |
| `org.members.changeRole` | Changer le rôle |
| `org.members.roleChanged` | {memberName} est maintenant {role}. |
| `org.members.remove.text` | Retirer de l'organisation |
| `org.members.remove.confirm.title` | Retirer {memberName} ? |
| `org.members.remove.confirm.body` | {memberName} perd l'accès à l'espace de {org}. Ses offres et ses notes restent dans l'organisation. Son compte personnel n'est pas touché. |
| `org.members.remove.confirm.reassign` | Réattribuer ses offres à |
| `org.members.remove.confirm.cta` | Retirer |
| `org.members.removed` | {memberName} a été retiré. |
| `org.members.removedDone` | Membre retiré de l'organisation. |
| `org.members.roleDone` | Rôle mis à jour. |
| `org.members.transferOwnership.text` | Transférer la propriété |
| `org.members.transferOwnership.confirm` | {memberName} deviendra propriétaire de {org}, avec accès à la facturation et à la suppression. Vous deviendrez administrateur. |
| `org.members.lastOwner` | Une organisation doit garder au moins un propriétaire. |
| `org.invite.expiresIn` | Expire {time} |
| `org.members.filter.all` | Tous les rôles |
| `org.members.searchEmpty` | Aucun membre ne correspond à votre recherche. |
| `org.members.actions` | Actions pour {name} |
| `org.members.team.none` | Aucune équipe |
| `org.members.team.save` | Changer l'équipe |
| `org.members.teamDone` | Équipe mise à jour. |
| `org.members.transferDone` | Propriété transférée. |
| `org.invite.title` | Inviter des membres |
| `org.invite.emails.text` | Adresses e-mail |
| `org.invite.emails.placeholder` | Une ou plusieurs adresses, séparées par une virgule |
| `org.invite.role` | Rôle |
| `org.invite.team` | Équipe (facultatif) |
| `org.invite.message` | Message personnel (facultatif) |
| `org.invite.send` | Envoyer les invitations |
| `org.invite.sent` | {count, plural, one {# invitation envoyée.} other {# invitations envoyées.}} |
| `org.invite.pending` | Invitations en attente |
| `org.invite.expires` | Expire {time, relative} |
| `org.invite.resend` | Renvoyer |
| `org.invite.revoke` | Annuler l'invitation |
| `org.invite.revoked` | Invitation annulée. |
| `org.invite.error.alreadyMember` | {email} est déjà membre de l'organisation. |
| `org.invite.error.seats` | Pas assez de sièges disponibles pour {count, plural, one {# invitation} other {# invitations}}. |
| `org.invite.error.role` | Ce rôle n'est pas inclus dans le forfait de votre organisation. |
| `org.invite.error.otherEmail` | Cette invitation a été envoyée à une autre adresse e-mail. Connectez-vous avec le compte invité. |
| `org.invite.accept.title` | Rejoindre {org} sur Jumanly |
| `org.invite.accept.body` | {inviterName} vous invite à rejoindre {org} en tant que {role}. Votre compte personnel reste séparé de l'espace de l'organisation. |
| `org.invite.accept.cta` | Accepter l'invitation |
| `org.invite.accept.decline` | Refuser |
| `org.invite.accept.expired` | Cette invitation a expiré. Demandez-en une nouvelle à {inviterName}. |
| `org.invite.accepted` | Bienvenue dans l'espace de {org}. |

#### Rôles

| Clé | Texte |
|---|---|
| `org.roles.title` | Rôles et permissions |
| `org.roles.org_owner.text` | Propriétaire |
| `org.roles.org_owner.desc` | Tous les droits sur l'organisation, y compris l'abonnement, la facturation et la suppression de l'organisation. |
| `org.roles.org_admin.text` | Administrateur |
| `org.roles.org_admin.desc` | Gère les membres, les équipes, les permissions, toutes les offres et les rapports. N'a pas accès à la facturation. |
| `org.roles.recruiter.text` | Recruteur |
| `org.roles.recruiter.desc` | Crée et publie les offres qui lui sont attribuées, gère leur pipeline, échange avec les candidats et planifie les rendez-vous. |
| `org.roles.hiring_manager.text` | Responsable du recrutement |
| `org.roles.hiring_manager.desc` | Voit les candidats des offres qui lui sont attribuées, les évalue et les commente. Ne publie pas d'offre. |
| `org.roles.viewer.text` | Lecteur |
| `org.roles.viewer.desc` | Consulte les tableaux de bord et les rapports, sans accès aux actions sur les candidatures. |
| `org.roles.partner_manager.text` | Responsable partenaire |
| `org.roles.partner_manager.desc` | Distribue les licences financées par l'institution et consulte les rapports agrégés. |
| `org.roles.locked` | Ce rôle est disponible avec {plan}. |
| `org.roles.scope.text` | Portée |
| `org.roles.scope.org` | Toute l'organisation |
| `org.roles.scope.team` | Équipe : {team} |
| `org.roles.scope.locked` | Rôles par équipe et permissions par offre · Disponible avec {plan} |
| `org.roles.perJob` | Permissions par offre |
| `org.roles.error.selfDemote` | Vous ne pouvez pas modifier votre propre rôle. Demandez à un autre propriétaire. |

#### Équipes, départements et entités

| Clé | Texte |
|---|---|
| `org.teams.title` | Équipes |
| `org.teams.locked` | Plusieurs équipes RH · Disponible avec {plan} |
| `org.teams.new` | Nouvelle équipe |
| `org.teams.name.text` | Nom de l'équipe |
| `org.teams.name.placeholder` | Ex. : Recrutement technique |
| `org.teams.lead` | Responsable |
| `org.teams.members` | {count, plural, one {# membre} other {# membres}} |
| `org.teams.jobs` | {count, plural, one {# offre} other {# offres}} |
| `org.teams.addMember` | Ajouter un membre |
| `org.teams.delete.confirm` | Supprimer l'équipe « {team} » ? Ses offres restent dans l'organisation. |
| `org.teams.empty` | Aucune équipe. Créez des équipes pour répartir les offres et les tableaux de bord. |
| `org.departments.title` | Départements |
| `org.departments.locked` | Départements · Disponible avec {plan} |
| `org.departments.new` | Nouveau département |
| `org.departments.name.text` | Nom du département |
| `org.departments.name.placeholder` | Ex. : Finance |
| `org.departments.delete.confirm` | Supprimer le département « {department} » ? Les offres rattachées ne seront plus classées. |
| `org.departments.empty` | Aucun département. |
| `org.entities.title` | Entités et filiales |
| `org.entities.locked` | Plusieurs entités organisationnelles · Disponible avec {plan} |
| `org.entities.new` | Nouvelle entité |
| `org.entities.name` | Nom de l'entité |
| `org.entities.country` | Pays |
| `org.entities.parent` | Entité parente |
| `org.entities.verified` | Vérifiée |
| `org.entities.delete.confirm` | Supprimer l'entité « {entity} » ? Ses offres et ses équipes doivent d'abord être réattribuées. |
| `org.entities.empty` | Aucune entité. |
| `org.entities.quote` | Demander un devis |
| `org.structure.created` | Élément créé. |
| `org.structure.deleted` | Élément supprimé. |
| `org.structure.notEmpty` | Réattribuez d'abord les offres, équipes et entités rattachées. |
| `org.structure.invalid` | Donnez un nom d'au moins 2 caractères. |
| `org.structure.create` | Créer |
| `org.structure.delete` | Supprimer |
| `org.entities.noParent` | Aucune (entité principale) |
| `org.entities.parentOf` | Rattachée à {entity} |
| `org.teams.entity` | Entité (facultatif) |
| `org.teams.noLead` | Aucun responsable |

#### Suppression de l'organisation

| Clé | Texte |
|---|---|
| `org.delete.title` | Supprimer l'organisation |
| `org.delete.body` | Les offres seront fermées et les membres perdront l'accès. Les candidats seront informés de la fermeture des offres. Cette action est réservée au propriétaire. |
| `org.delete.confirm.type` | Tapez le nom de l'organisation pour confirmer |
| `org.delete.confirm.cta` | Supprimer définitivement |
| `org.delete.activeSubscription` | Résiliez d'abord l'abonnement en cours. |
| `org.delete.done` | Organisation supprimée. |


---

## Partie 05 · Forfaits et paiement

Textes définitifs de la page `/tarifs`, de l'écran `/app/abonnement` (et de sa variante organisation `/app/organisation/abonnement`), du paiement Mobile Money et carte, du cycle de vie de l'abonnement, des quotas, des licences sponsorisées et de la demande de devis Company Premium.

Source de vérité : `docs/specifications.md (partie 05)`. En cas d'écart, le doc 05 l'emporte.

Conventions :

- Prix : stockés dans `Plan` et injectés en variable `{price}`. Valeurs de référence au lancement : Free 0, Starter 4,9, Pro 19,9, Premium 49,9, RH Free 0, RH Pro 19,9, RH Premium 49,9, Company 79,9, Company Plus 179,9 USD/mois, Company Premium sur devis. Format d'affichage français : virgule décimale (`4,9 USD/mois`).
- Capacités (utilisateurs, offres actives) : injectées en variable (`{seats}`, `{jobs}`) depuis `PlanEntitlement`.
- Quotas chiffrés : provisoires, toujours injectés en variable (`{quota}`, `{used}`, `{limit}`), jamais écrits en dur.
- Durées de rappel et de grâce : injectées en variable (`{days}`), valeurs de seed J-7, J-3, J-0 et grâce 3 jours (provisoire).
- Aucun avantage hors doc 05 : pas de mentorat, pas de revue humaine de CV, pas de mois offerts.
- Le rappel « candidater reste gratuit » figure sur chaque écran de ce fichier.

---

### `/tarifs` · Forfaits

*Présenter toutes les formules de façon claire et honnête, par famille, et mener à l'inscription ou au devis.*

#### SEO et en-tête

| Clé | Texte |
|---|---|
| `pricing.seo.title` | Tarifs et forfaits · Jumanly |
| `pricing.seo.description` | Talents dès 0 USD, formules RH, Company et licences Partners. Candidatures toujours gratuites. Paiement par Mobile Money et carte bancaire, prix en USD. |
| `pricing.hero.eyebrow` | Tarifs |
| `pricing.hero.title` | Commencez gratuitement, évoluez à votre rythme |
| `pricing.hero.subtitle` | Chaque famille démarre par une formule gratuite. Les formules payantes ajoutent des outils, jamais une condition pour postuler. |
| `pricing.hero.badge` | Candidatures toujours gratuites |
| `pricing.tabs.label` | Choisir une famille de forfaits |
| `pricing.tabs.talents` | Talents |
| `pricing.tabs.rh` | RH |
| `pricing.tabs.companies` | Companies |
| `pricing.tabs.partners` | Partners |
| `pricing.payment.methods` | Paiement par Mobile Money ou carte bancaire. Prix en USD, par mois. |
| `pricing.payment.prepaid` | Sans engagement. Avec Mobile Money, l'abonnement est prépayé pour un mois : rien n'est prélevé sans votre accord. |
| `pricing.payment.localCurrency` | Le montant est converti dans votre monnaie au moment du paiement, selon le taux appliqué par l'opérateur ou la banque. |
| `pricing.payment.prepaidShort` | Sans engagement, prépayé pour un mois avec Mobile Money |
| `pricing.card.perMonth` | /mois |
| `pricing.card.currency` | USD |
| `pricing.card.free` | Gratuit |
| `pricing.card.quote` | Sur devis |
| `pricing.card.idealFor` | Idéal pour : {audience} |
| `pricing.card.includesPrevious` | Tout {plan}, plus : |
| `pricing.card.current` | Votre formule actuelle |
| `pricing.card.provisional` | Les quotas peuvent évoluer. Ils sont toujours affichés dans votre tableau de bord. |

#### Onglet Talents

| Clé | Texte |
|---|---|
| `pricing.talent.title` | Jumanly for Talents |
| `pricing.talent.subtitle` | Quatre formules, un même parcours. Chaque formule comprend tout ce que propose la précédente. |
| `pricing.talent.free.name` | Free |
| `pricing.talent.free.tagline` | Pour découvrir Jumanly |
| `pricing.talent.free.price` | Gratuit |
| `pricing.talent.free.ideal` | étudiants et jeunes diplômés |
| `pricing.talent.free.f1` | Compte et profil professionnel |
| `pricing.talent.free.f2` | Diagnostic de carrière simplifié |
| `pricing.talent.free.f3` | Consultation des offres d'emploi |
| `pricing.talent.free.f4` | Candidatures gratuites et suivi des candidatures |
| `pricing.talent.free.f5` | Un modèle de CV standard |
| `pricing.talent.free.f6` | Sélection de formations gratuites |
| `pricing.talent.free.f7` | Conseils généraux de préparation professionnelle |
| `pricing.talent.free.f8` | Messagerie liée aux candidatures |
| `pricing.talent.free.note` | Les profils Free sont sélectionnés et recrutés au même titre que les abonnés payants. |
| `pricing.talent.free.cta` | Créer mon compte gratuit |
| `pricing.talent.starter.name` | Starter |
| `pricing.talent.starter.tagline` | Pour se lancer |
| `pricing.talent.starter.badge` | Offre d'entrée |
| `pricing.talent.starter.price` | {price} USD/mois |
| `pricing.talent.starter.ideal` | première insertion ou reconversion |
| `pricing.talent.starter.includes` | Tout Free, plus : |
| `pricing.talent.starter.f1` | Formations fondamentales d'employabilité |
| `pricing.talent.starter.f2` | Plusieurs modèles de CV |
| `pricing.talent.starter.f3` | Création et correction de documents professionnels |
| `pricing.talent.starter.f4` | Outils de préparation LinkedIn |
| `pricing.talent.starter.f5` | Diagnostic de carrière personnalisé |
| `pricing.talent.starter.f6` | Quota mensuel d'assistance IA |
| `pricing.talent.starter.f7` | Simulations d'entretien textuelles |
| `pricing.talent.starter.f8` | Plan de progression individuel |
| `pricing.talent.starter.cta` | Choisir Starter |
| `pricing.talent.pro.name` | Pro |
| `pricing.talent.pro.tagline` | Pour accélérer sa carrière |
| `pricing.talent.pro.badge` | Recommandé |
| `pricing.talent.pro.price` | {price} USD/mois |
| `pricing.talent.pro.ideal` | talents qui visent une évolution ou une promotion |
| `pricing.talent.pro.includes` | Tout Starter, plus : |
| `pricing.talent.pro.f1` | Ensemble des parcours pédagogiques standards |
| `pricing.talent.pro.f2` | Corrections IA plus nombreuses |
| `pricing.talent.pro.f3` | Adaptation avancée du CV à différentes offres |
| `pricing.talent.pro.f4` | Simulations d'entretien vocales, dans une limite mensuelle |
| `pricing.talent.pro.f5` | Exercices adaptés à des métiers spécifiques |
| `pricing.talent.pro.f6` | Recommandations de développement professionnel |
| `pricing.talent.pro.f7` | Outils supplémentaires de gestion de carrière et de candidature |
| `pricing.talent.pro.cta` | Choisir Pro |
| `pricing.talent.premium.name` | Premium |
| `pricing.talent.premium.tagline` | Pour une préparation intensive |
| `pricing.talent.premium.price` | {price} USD/mois |
| `pricing.talent.premium.ideal` | cadres et profils expérimentés |
| `pricing.talent.premium.includes` | Tout Pro, plus : |
| `pricing.talent.premium.f1` | Quotas IA plus élevés |
| `pricing.talent.premium.f2` | Davantage de simulations d'entretien |
| `pricing.talent.premium.f3` | Parcours professionnels avancés |
| `pricing.talent.premium.f4` | Portfolio et présentation professionnelle enrichis |
| `pricing.talent.premium.f5` | Rapports détaillés de progression |
| `pricing.talent.premium.f6` | Accès prioritaire à l'assistance technique |
| `pricing.talent.premium.f7` | Ressources pédagogiques spécialisées |
| `pricing.talent.premium.note` | L'accompagnement par un expert humain n'est pas inclus. S'il est proposé, il fera l'objet d'un service distinct. |
| `pricing.talent.premium.cta` | Choisir Premium |
| `pricing.talent.partnersBand.title` | Votre licence offerte par un partenaire |
| `pricing.talent.partnersBand.text` | Université, banque, fondation ou employeur : avec Jumanly Partners, une institution peut financer votre formule. |
| `pricing.talent.partnersBand.cta` | Activer un code |

#### Comparatif Talents

*Tableau sous les cartes. Les coches et tirets sont des icônes, avec texte alternatif `common.included` / `common.notIncluded`. Colonnes : Free · Starter · Pro · Premium. La colonne Pro est mise en avant.*

| Clé | Texte |
|---|---|
| `pricing.talent.compare.title` | Comparer les formules Talents |
| `pricing.talent.compare.toggleShow` | Afficher le comparatif détaillé |
| `pricing.talent.compare.toggleHide` | Masquer le comparatif |
| `pricing.talent.compare.colFeature` | Fonctionnalité |
| `pricing.talent.compare.apply` | Profil, offres et candidatures gratuites |
| `pricing.talent.compare.messaging` | Messagerie liée aux candidatures |
| `pricing.talent.compare.diagnostic.text` | Diagnostic de carrière |
| `pricing.talent.compare.diagnostic.simple` | Simplifié |
| `pricing.talent.compare.diagnostic.personalized` | Personnalisé |
| `pricing.talent.compare.trainings.text` | Formations |
| `pricing.talent.compare.trainings.free` | Sélection gratuite |
| `pricing.talent.compare.trainings.fundamentals` | Employabilité |
| `pricing.talent.compare.trainings.standard` | Parcours standards |
| `pricing.talent.compare.trainings.advanced` | Parcours avancés et ressources spécialisées |
| `pricing.talent.compare.cv.text` | Modèles de CV |
| `pricing.talent.compare.cv.free` | 5 modèles |
| `pricing.talent.compare.cv.starter` | 10 modèles |
| `pricing.talent.compare.cv.pro` | 15 modèles |
| `pricing.talent.compare.cv.tailored` | Tous, adaptés à chaque offre |
| `pricing.talent.compare.documents` | Documents professionnels et préparation LinkedIn |
| `pricing.talent.compare.ai.text` | Assistance IA |
| `pricing.talent.compare.ai.monthly` | {quota} crédits/mois |
| `pricing.talent.compare.interviewText` | Simulations d'entretien textuelles |
| `pricing.talent.compare.interviewVoice` | Simulations d'entretien vocales |
| `pricing.talent.compare.interview.monthly` | {quota}/mois |
| `pricing.talent.compare.plan.text` | Plan de progression |
| `pricing.talent.compare.plan.base` | Individuel |
| `pricing.talent.compare.plan.reco` | + recommandations |
| `pricing.talent.compare.plan.reports` | + rapports détaillés |
| `pricing.talent.compare.exercises` | Exercices par métier |
| `pricing.talent.compare.portfolio.text` | Portfolio |
| `pricing.talent.compare.portfolio.standard` | Standard |
| `pricing.talent.compare.portfolio.enriched` | Enrichi |
| `pricing.talent.compare.support.text` | Assistance technique |
| `pricing.talent.compare.support.standard` | Standard |
| `pricing.talent.compare.support.priority` | Prioritaire |
| `pricing.talent.compare.note` | Les quotas indiqués sont mensuels et renouvelés à la date anniversaire de votre abonnement. Ils peuvent évoluer ; les valeurs en vigueur sont toujours visibles dans votre tableau de bord. |

#### Onglet RH

| Clé | Texte |
|---|---|
| `pricing.rh.title` | Jumanly for RH |
| `pricing.rh.subtitle` | Pour les recruteurs indépendants, consultants RH, responsables RH et petites équipes. Démarrez avec un compte gratuit et une offre active, puis ajoutez des utilisateurs, des offres et des outils. |
| `pricing.rh.seats` | {seats, plural, one {# utilisateur RH} other {Jusqu'à # utilisateurs RH}} |
| `pricing.rh.jobs` | {jobs, plural, one {# offre active} other {# offres actives}} |
| `pricing.rh.free.name` | RH Free |
| `pricing.rh.free.tagline` | Pour découvrir le recrutement |
| `pricing.rh.free.price` | Gratuit |
| `pricing.rh.free.ideal` | un recrutement ponctuel |
| `pricing.rh.free.f1` | Un compte recruteur |
| `pricing.rh.free.f2` | Une offre active |
| `pricing.rh.free.f3` | Réception et consultation des candidatures |
| `pricing.rh.free.f4` | Gestion simple des étapes |
| `pricing.rh.free.f5` | Consultation des profils ayant candidaté |
| `pricing.rh.free.f6` | Messagerie liée aux candidatures |
| `pricing.rh.free.f7` | Tableau de bord élémentaire |
| `pricing.rh.free.cta` | Créer mon compte recruteur |
| `pricing.rh.pro.name` | RH Pro |
| `pricing.rh.pro.tagline` | Pour des besoins réguliers |
| `pricing.rh.pro.badge` | Recommandé |
| `pricing.rh.pro.price` | {price} USD/mois |
| `pricing.rh.pro.ideal` | recruteurs indépendants |
| `pricing.rh.pro.f1` | Jusqu'à {seats} utilisateurs RH |
| `pricing.rh.pro.f2` | {jobs} offres actives |
| `pricing.rh.pro.f3` | Gestion de plusieurs recrutements |
| `pricing.rh.pro.f4` | Recherche avancée dans le vivier de talents |
| `pricing.rh.pro.f5` | Suggestions de matching |
| `pricing.rh.pro.f6` | Analyse structurée des CV |
| `pricing.rh.pro.f7` | Présélection et classement manuel |
| `pricing.rh.pro.f8` | Messagerie et rendez-vous |
| `pricing.rh.pro.f9` | Statistiques de recrutement |
| `pricing.rh.pro.cta` | Choisir RH Pro |
| `pricing.rh.premium.name` | RH Premium |
| `pricing.rh.premium.tagline` | Pour plusieurs recrutements simultanés |
| `pricing.rh.premium.price` | {price} USD/mois |
| `pricing.rh.premium.ideal` | consultants et petites équipes |
| `pricing.rh.premium.f1` | Jusqu'à {seats} utilisateurs RH |
| `pricing.rh.premium.f2` | {jobs} offres actives |
| `pricing.rh.premium.f3` | Outils ATS avancés |
| `pricing.rh.premium.f4` | Matching enrichi et explicable |
| `pricing.rh.premium.f5` | Filtres approfondis de recherche de talents |
| `pricing.rh.premium.f6` | Collaboration entre recruteurs |
| `pricing.rh.premium.f7` | Grilles d'évaluation |
| `pricing.rh.premium.f8` | Historique des décisions |
| `pricing.rh.premium.f9` | Rapports et tableaux de bord avancés |
| `pricing.rh.premium.f10` | Quotas supérieurs de recherche et d'assistance IA |
| `pricing.rh.premium.f11` | Support prioritaire |
| `pricing.rh.premium.cta` | Choisir RH Premium |
| `pricing.rh.privacyNote` | L'accès aux candidats est encadré par leurs choix de confidentialité. Les quotas de recherche et de contact empêchent l'extraction massive de données personnelles. |
| `pricing.rh.upsell.title` | Plus de {seats} recruteurs ou plusieurs départements ? |
| `pricing.rh.upsell.text` | Jumanly for Companies ajoute les équipes, les permissions et les rapports consolidés, dès {price} USD par mois. |
| `pricing.rh.upsell.cta` | Voir les formules Companies |

#### Comparatif RH

*Colonnes : RH Free · RH Pro · RH Premium. La colonne RH Pro est mise en avant.*

| Clé | Texte |
|---|---|
| `pricing.rh.compare.title` | Comparer les formules RH |
| `pricing.rh.compare.seats` | Utilisateurs RH |
| `pricing.rh.compare.jobs` | Offres actives |
| `pricing.rh.compare.applications` | Réception et consultation des candidatures |
| `pricing.rh.compare.pipeline.text` | Gestion des recrutements |
| `pricing.rh.compare.pipeline.simple` | Étapes simples |
| `pricing.rh.compare.pipeline.multi` | Plusieurs en parallèle |
| `pricing.rh.compare.pipeline.advanced` | ATS avancé |
| `pricing.rh.compare.search.text` | Recherche dans le vivier de talents |
| `pricing.rh.compare.search.advanced` | Avancée, {quota}/mois |
| `pricing.rh.compare.search.deep` | Filtres approfondis, {quota}/mois |
| `pricing.rh.compare.contacts.text` | Demandes de mise en relation |
| `pricing.rh.compare.contacts.monthly` | {quota}/mois |
| `pricing.rh.compare.matching.text` | Matching |
| `pricing.rh.compare.matching.suggestions` | Suggestions |
| `pricing.rh.compare.matching.explainable` | Enrichi et explicable |
| `pricing.rh.compare.cvAnalysis` | Analyse structurée des CV |
| `pricing.rh.compare.shortlist` | Présélection et classement |
| `pricing.rh.compare.messaging.text` | Messagerie |
| `pricing.rh.compare.messaging.applications` | Liée aux candidatures |
| `pricing.rh.compare.messaging.appointments` | + rendez-vous |
| `pricing.rh.compare.collaboration` | Collaboration entre recruteurs |
| `pricing.rh.compare.scorecards` | Grilles d'évaluation et historique des décisions |
| `pricing.rh.compare.reports.text` | Pilotage |
| `pricing.rh.compare.reports.basic` | Tableau de bord élémentaire |
| `pricing.rh.compare.reports.stats` | Statistiques |
| `pricing.rh.compare.reports.advanced` | Rapports avancés |
| `pricing.rh.compare.ai.text` | Assistance IA |
| `pricing.rh.compare.ai.monthly` | {quota} crédits/mois |
| `pricing.rh.compare.support.text` | Support |
| `pricing.rh.compare.support.standard` | Standard |
| `pricing.rh.compare.support.priority` | Prioritaire |

#### Onglet Companies

| Clé | Texte |
|---|---|
| `pricing.company.title` | Jumanly for Companies |
| `pricing.company.subtitle` | Un environnement de recrutement collectif pour les organisations. Choisissez selon le nombre de recruteurs et de managers, le volume d'offres et le niveau de pilotage. |
| `pricing.company.startFree.text` | Pas encore prêt ? Votre entreprise peut commencer gratuitement avec RH Free, puis évoluer vers une formule Company. |
| `pricing.company.startFree.cta` | Commencer avec RH Free |
| `pricing.company.base.name` | Company |
| `pricing.company.base.tagline` | Pour les PME |
| `pricing.company.base.price` | {price} USD/mois |
| `pricing.company.base.ideal` | PME aux recrutements structurés |
| `pricing.company.base.f1` | Jusqu'à {seats} utilisateurs, recruteurs ou managers |
| `pricing.company.base.f2` | {jobs} offres actives |
| `pricing.company.base.f3` | Profil entreprise vérifié |
| `pricing.company.base.f4` | Tableau de bord de recrutement partagé |
| `pricing.company.base.f5` | Gestion collaborative des candidatures |
| `pricing.company.base.f6` | ATS avancé |
| `pricing.company.base.f7` | Recherche de talents et matching des profils |
| `pricing.company.base.f8` | Messagerie et organisation des entretiens |
| `pricing.company.base.f9` | Grilles d'évaluation |
| `pricing.company.base.f10` | Statistiques des recrutements |
| `pricing.company.base.cta` | Choisir Company |
| `pricing.company.plus.name` | Company Plus |
| `pricing.company.plus.tagline` | Pour plusieurs équipes |
| `pricing.company.plus.badge` | Recommandé |
| `pricing.company.plus.price` | {price} USD/mois |
| `pricing.company.plus.ideal` | entreprises multi-départements |
| `pricing.company.plus.f1` | Jusqu'à {seats} utilisateurs |
| `pricing.company.plus.f2` | {jobs} offres actives |
| `pricing.company.plus.f3` | Plusieurs équipes RH |
| `pricing.company.plus.f4` | Attribution des offres aux responsables |
| `pricing.company.plus.f5` | Permissions avancées |
| `pricing.company.plus.f6` | Viviers et listes de talents partagés |
| `pricing.company.plus.f7` | Matching et recherche avancés |
| `pricing.company.plus.f8` | Gestion collaborative des entretiens |
| `pricing.company.plus.f9` | Tableaux de bord par équipe et département |
| `pricing.company.plus.f10` | Rapports d'activité consolidés et export des rapports autorisés |
| `pricing.company.plus.f11` | Assistance prioritaire |
| `pricing.company.plus.cta` | Choisir Company Plus |
| `pricing.company.premium.name` | Company Premium |
| `pricing.company.premium.tagline` | Pour les grands groupes |
| `pricing.company.premium.price` | Sur devis |
| `pricing.company.premium.ideal` | groupes et organisations aux besoins particuliers |
| `pricing.company.premium.f1` | {seats} utilisateurs ou davantage, selon contrat |
| `pricing.company.premium.f2` | Volumes d'offres négociés |
| `pricing.company.premium.f3` | Plusieurs entités organisationnelles |
| `pricing.company.premium.f4` | Gestion des départements et filiales |
| `pricing.company.premium.f5` | Workflows de recrutement configurables |
| `pricing.company.premium.f6` | Intégrations avec des outils RH autorisés |
| `pricing.company.premium.f7` | Tableaux de bord personnalisés |
| `pricing.company.premium.f8` | Permissions avancées |
| `pricing.company.premium.f9` | Accompagnement à la configuration |
| `pricing.company.premium.f10` | Maintenance et support contractuels |
| `pricing.company.premium.cta` | Demander un devis |
| `pricing.company.premium.note` | Les volumes de recrutement, d'utilisateurs et de services sont définis par contrat. |
| `pricing.company.partnersBand.title` | Financer l'employabilité de vos équipes |
| `pricing.company.partnersBand.text` | Avec Jumanly Partners, offrez des licences Starter, Pro ou Premium à des collaborateurs, des stagiaires ou des cohortes de jeunes. |
| `pricing.company.partnersBand.cta` | Découvrir Jumanly Partners |

#### Comparatif Companies

*Colonnes : Company · Company Plus · Company Premium. La colonne Company Plus est mise en avant.*

| Clé | Texte |
|---|---|
| `pricing.company.compare.title` | Comparer les formules Companies |
| `pricing.company.compare.seats.text` | Utilisateurs |
| `pricing.company.compare.seats.contract` | {seats} et plus, selon contrat |
| `pricing.company.compare.jobs.text` | Offres actives |
| `pricing.company.compare.jobs.negotiated` | Négociées |
| `pricing.company.compare.verified` | Profil entreprise vérifié |
| `pricing.company.compare.ats` | ATS avancé et candidatures partagées |
| `pricing.company.compare.search.text` | Recherche de talents et matching |
| `pricing.company.compare.search.standard` | Inclus, {quota} recherches/mois |
| `pricing.company.compare.search.advanced` | Avancés, {quota} recherches/mois |
| `pricing.company.compare.search.contract` | Avancés, volume selon contrat |
| `pricing.company.compare.contacts.text` | Demandes de mise en relation |
| `pricing.company.compare.contacts.monthly` | {quota}/mois |
| `pricing.company.compare.contacts.contract` | Selon contrat |
| `pricing.company.compare.interviews.text` | Entretiens |
| `pricing.company.compare.interviews.organize` | Organisation |
| `pricing.company.compare.interviews.team` | Gestion en équipe |
| `pricing.company.compare.scorecards` | Grilles d'évaluation et historique des décisions |
| `pricing.company.compare.teams.text` | Équipes RH et départements |
| `pricing.company.compare.teams.multi` | Plusieurs équipes |
| `pricing.company.compare.teams.entities` | + entités et filiales |
| `pricing.company.compare.permissions.text` | Permissions |
| `pricing.company.compare.permissions.standard` | Standard |
| `pricing.company.compare.permissions.advanced` | Avancées |
| `pricing.company.compare.pools` | Viviers de talents partagés |
| `pricing.company.compare.dashboards.text` | Tableaux de bord |
| `pricing.company.compare.dashboards.shared` | Partagé |
| `pricing.company.compare.dashboards.team` | Par équipe et département |
| `pricing.company.compare.dashboards.custom` | Personnalisés |
| `pricing.company.compare.reports.text` | Rapports |
| `pricing.company.compare.reports.stats` | Statistiques |
| `pricing.company.compare.reports.consolidated` | Consolidés, avec export |
| `pricing.company.compare.reports.custom` | Sur mesure, avec export |
| `pricing.company.compare.workflows` | Workflows configurables et intégrations |
| `pricing.company.compare.onboarding` | Accompagnement à la configuration |
| `pricing.company.compare.ai.text` | Assistance IA |
| `pricing.company.compare.ai.monthly` | {quota} crédits/mois |
| `pricing.company.compare.ai.contract` | Selon contrat |
| `pricing.company.compare.support.text` | Support |
| `pricing.company.compare.support.standard` | Standard |
| `pricing.company.compare.support.priority` | Prioritaire |
| `pricing.company.compare.support.contract` | Selon contrat |

#### Onglet Partners

| Clé | Texte |
|---|---|
| `pricing.partners.title` | Jumanly Partners |
| `pricing.partners.subtitle` | Une institution finance l'accès à Jumanly pour un groupe de bénéficiaires : étudiants, jeunes, collaborateurs ou communautés. |
| `pricing.partners.price` | Sur contrat |
| `pricing.partners.f1` | Lots de licences Starter, Pro ou Premium |
| `pricing.partners.f2` | Durée d'accès définie par contrat |
| `pricing.partners.f3` | Activation par code ou lien d'invitation |
| `pricing.partners.f4` | Tableau de bord des licences achetées, activées et actives |
| `pricing.partners.f5` | Rapports d'usage et d'impact agrégés, exportables en PDF |
| `pricing.partners.f6` | Aucun accès aux CV, messages ni données personnelles non autorisées |
| `pricing.partners.example.title` | Exemple indicatif |
| `pricing.partners.example.text` | Une banque finance l'accès Starter de 500 jeunes pendant six mois. |
| `pricing.partners.example.formula` | 500 bénéficiaires × 5 USD × 6 mois = 15 000 USD |
| `pricing.partners.example.note` | Base commerciale indicative au tarif individuel de référence, susceptible de remises institutionnelles et hors coûts de déploiement additionnels. |
| `pricing.partners.noOnline` | Les licences Partners ne s'achètent pas en ligne : le contrat est établi avec notre équipe. |
| `pricing.partners.cta` | Nous contacter |
| `pricing.partners.ctaSecondary` | En savoir plus sur Jumanly Partners |
| `pricing.partners.beneficiary` | Vous avez reçu un code ? Activez votre licence. |

#### Garanties communes

| Clé | Texte |
|---|---|
| `pricing.guarantees.title` | Ce qui ne change jamais, quelle que soit la formule |
| `pricing.guarantees.apply` | Candidater reste gratuit et illimité, même quand vos quotas sont épuisés. |
| `pricing.guarantees.equal` | Les profils Free sont recrutés au même titre que les abonnés. |
| `pricing.guarantees.ai` | L'IA recommande, l'humain décide. Chaque suggestion explique son « Pourquoi ? ». |
| `pricing.guarantees.data` | Revenir au forfait gratuit ne supprime aucune donnée. |
| `pricing.guarantees.quotas` | Vos quotas sont visibles à tout moment dans votre tableau de bord. |

#### FAQ facturation

| Clé | Texte |
|---|---|
| `pricing.faq.title` | Questions sur la facturation |
| `pricing.faq.eyebrow` | FAQ |
| `pricing.faq.q1` | Quels moyens de paiement acceptez-vous ? |
| `pricing.faq.a1` | Mobile Money et carte bancaire. Les opérateurs disponibles dépendent de votre pays et s'affichent au moment du paiement. |
| `pricing.faq.q2` | Pourquoi les prix sont-ils en USD ? |
| `pricing.faq.a2` | Pour afficher un prix identique dans tous les pays. Le montant est converti dans votre monnaie au moment du paiement, selon le taux de l'opérateur ou de la banque. |
| `pricing.faq.q3` | L'abonnement se renouvelle-t-il automatiquement ? |
| `pricing.faq.a3` | Avec Mobile Money, l'abonnement est prépayé pour un mois et ne se renouvelle pas tout seul. Nous vous rappelons l'échéance à l'avance, et vous renouvelez en un geste. [Renouvellement automatique par carte : à confirmer selon le prestataire de paiement] |
| `pricing.faq.q4` | Que se passe-t-il si je ne renouvelle pas à temps ? |
| `pricing.faq.a4` | Vous bénéficiez d'un délai de grâce de quelques jours pendant lequel votre formule reste active. Ensuite, vous revenez automatiquement à la formule gratuite, sans perdre vos données. |
| `pricing.faq.q5` | Puis-je changer de formule en cours de mois ? |
| `pricing.faq.a5` | Oui. Une montée en gamme s'applique immédiatement, et le temps restant sur votre formule actuelle est pris en compte. Une réduction de gamme prend effet à la fin de la période déjà payée. |
| `pricing.faq.q6` | Puis-je résilier à tout moment ? |
| `pricing.faq.a6` | Oui. Votre formule reste active jusqu'à la fin de la période payée, puis vous revenez à la formule gratuite. Vos données sont conservées. |
| `pricing.faq.q7` | Puis-je être remboursé ? |
| `pricing.faq.a7` | Les règles de remboursement sont précisées dans nos conditions générales de vente. [Règles de remboursement à définir] |
| `pricing.faq.q8` | Que se passe-t-il quand un quota est atteint ? |
| `pricing.faq.a8` | La fonctionnalité concernée est mise en pause jusqu'au renouvellement de votre période. Vous pouvez attendre, ou passer à une formule supérieure. Vous êtes prévenu à 80 % puis à 100 % de chaque quota. |
| `pricing.faq.q9` | Est-ce que je dois payer pour postuler ? |
| `pricing.faq.a9` | Non, jamais. Aucune option payante ne conditionne la candidature. |
| `pricing.faq.q10` | Puis-je obtenir une facture ? |
| `pricing.faq.a10` | Oui. Chaque paiement donne lieu à un reçu envoyé par e-mail et à une facture téléchargeable dans « Mon abonnement ». Pour une organisation, vous pouvez indiquer la raison sociale et l'adresse de facturation. |
| `pricing.faq.q11` | Une institution finance ma formule. Que se passe-t-il si j'ai déjà un abonnement ? |
| `pricing.faq.a11` | Si la licence offerte est supérieure à votre formule, elle s'applique tout de suite. Si votre formule actuelle est supérieure, la licence est mise en attente. |
| `pricing.faq.q12` | Proposez-vous des formules trimestrielles ou annuelles ? |
| `pricing.faq.a12` | Pas pour le moment. Les abonnements sont mensuels. D'autres durées pourront être proposées plus tard. |
| `pricing.faq.more` | D'autres questions ? Consultez la FAQ complète ou écrivez-nous à infojumanly@gmail.com. |

#### Appel final

| Clé | Texte |
|---|---|
| `pricing.finalCta.title` | Prêt à commencer ? |
| `pricing.finalCta.text` | Créez votre compte gratuitement. Vous pourrez changer de formule quand vous le souhaitez. |
| `pricing.finalCta.primary` | Créer mon compte gratuit |
| `pricing.finalCta.secondary` | Demander un devis |

---

### `/app/abonnement` · Mon abonnement

*Montrer clairement le forfait actuel, la consommation des quotas, l'historique et les factures, et permettre de changer de formule.*

#### En-tête et forfait actuel

| Clé | Texte |
|---|---|
| `billing.seo.title` | Mon abonnement · Jumanly |
| `billing.title` | Mon abonnement |
| `billing.subtitle` | Votre formule, vos quotas et vos paiements. |
| `billing.applyFree` | Candidater reste gratuit et illimité, quelle que soit votre formule. |
| `billing.current.title` | Formule actuelle |
| `billing.current.plan` | {plan} |
| `billing.current.price` | {price} USD/mois |
| `billing.current.free` | Gratuit |
| `billing.current.sponsored` | Offerte par {sponsorName} |
| `billing.current.status.active` | Active |
| `billing.current.status.trialing` | Essai |
| `billing.current.status.pastDue` | Paiement en attente |
| `billing.current.status.canceled` | Résiliée, active jusqu'au {endDate} |
| `billing.current.status.expired` | Expirée |
| `billing.current.status.sponsored` | Licence sponsorisée |
| `billing.current.period` | Période en cours : du {startDate} au {endDate} |
| `billing.current.nextRenewal` | Prochaine échéance : {date} |
| `billing.current.daysLeft` | {days, plural, =0 {Échéance aujourd'hui} one {# jour restant} other {# jours restants}} |
| `billing.current.method.text` | Moyen de paiement : {method} |
| `billing.current.method.mobileMoney` | Mobile Money · {operator} · {maskedNumber} |
| `billing.current.method.card` | Carte {brand} se terminant par {last4} |
| `billing.current.renew` | Renouveler maintenant |
| `billing.current.change` | Changer de formule |
| `billing.current.cancel` | Résilier |
| `billing.current.resume` | Réactiver ma formule |
| `billing.current.scheduled.text` | Passage à {plan} prévu le {date}. |
| `billing.current.scheduled.cancel` | Annuler ce changement |
| `billing.current.freeTitle` | Vous utilisez la formule gratuite |
| `billing.current.freeText` | Vous pouvez créer votre profil, consulter les offres et postuler gratuitement. Pour aller plus loin, découvrez les formules payantes. |
| `billing.current.freeCta` | Découvrir les formules |
| `billing.current.includes` | Votre formule comprend |
| `billing.current.ring` | {days} j |
| `billing.current.nextRenewalDays` | Prochaine échéance : {date} · {days, plural, =0 {échéance aujourd'hui} one {# jour restant} other {# jours restants}} |

#### Jauges de quotas

| Clé | Texte |
|---|---|
| `billing.quotas.title` | Vos quotas |
| `billing.quotas.subtitle` | Renouvelés le {resetDate}. |
| `billing.quotas.usage` | {used} sur {limit} |
| `billing.quotas.unlimited` | Illimité |
| `billing.quotas.none` | Non inclus dans votre formule |
| `billing.quotas.left` | {count, plural, =0 {Plus rien} one {# restant} other {# restants}} |
| `billing.quotas.reached` | Quota atteint |
| `billing.quotas.ai` | Assistance IA |
| `billing.quotas.interviewText` | Simulations d'entretien textuelles |
| `billing.quotas.interviewVoice` | Simulations d'entretien vocales |
| `billing.quotas.talentSearch` | Recherches dans le vivier |
| `billing.quotas.contactRequests` | Demandes de mise en relation |
| `billing.quotas.activeJobs` | Offres actives |
| `billing.quotas.seats` | Utilisateurs |
| `billing.quotas.applications` | Candidatures |
| `billing.quotas.applicationsValue` | Gratuites et illimitées |
| `billing.quotas.gaugeLabel` | {name} : {used} utilisés sur {limit} |
| `billing.quotas.help` | Les quotas se renouvellent chaque mois à la date anniversaire de votre abonnement, et non au début du mois civil. |

#### Changer de formule

| Clé | Texte |
|---|---|
| `billing.change.title` | Changer de formule |
| `billing.change.subtitle` | Comparez les formules et choisissez celle qui vous convient. |
| `billing.change.current` | Formule actuelle |
| `billing.change.upgrade` | Passer à {plan} |
| `billing.change.downgrade` | Passer à {plan} |
| `billing.change.quote` | Demander un devis |
| `billing.change.unavailable` | Non disponible pour votre compte |
| `billing.change.note` | Une montée en gamme s'applique immédiatement, et le temps restant sur votre formule actuelle est pris en compte. Une réduction de gamme prend effet à la fin de la période déjà payée. |
| `billing.upgrade.title` | Passer à {plan} |
| `billing.upgrade.text` | Votre nouvelle formule s'applique immédiatement. |
| `billing.upgrade.summary.newPlan` | Nouvelle formule |
| `billing.upgrade.summary.price` | Prix mensuel |
| `billing.upgrade.summary.credit` | Crédit pour le temps restant sur {currentPlan} |
| `billing.upgrade.summary.total` | À payer aujourd'hui |
| `billing.upgrade.summary.newEnd` | Nouvelle échéance |
| `billing.upgrade.prorataNote` | Le crédit correspond aux jours non utilisés de votre formule actuelle. Votre nouvelle formule commence aujourd'hui pour un mois. |
| `billing.upgrade.confirm` | Payer et activer {plan} |
| `billing.upgrade.success.title` | Bienvenue dans {plan} |
| `billing.upgrade.success.text` | Votre nouvelle formule est active. Vos nouveaux quotas sont disponibles dès maintenant. |
| `billing.upgrade.success.cta` | Découvrir mes nouvelles fonctionnalités |
| `billing.downgrade.title` | Passer à {plan} |
| `billing.downgrade.text` | Vous gardez {currentPlan} jusqu'au {endDate}. Le passage à {plan} se fera automatiquement à cette date. |
| `billing.downgrade.lose.title` | À partir du {endDate}, vous n'aurez plus accès à : |
| `billing.downgrade.keep` | Vos données sont conservées : profil, CV, documents, attestations, candidatures et messages. |
| `billing.downgrade.orgWarning` | Votre nouvelle formule permet {seats, plural, one {# utilisateur} other {# utilisateurs}} et {jobs, plural, one {# offre active} other {# offres actives}}. Vous en avez actuellement {currentSeats} et {currentJobs}. Choisissez avant le {endDate} les membres et les offres à conserver. Les autres seront mis en pause, sans être supprimés. |
| `billing.downgrade.confirm` | Confirmer le changement |
| `billing.downgrade.success` | C'est noté. Vous passerez à {plan} le {endDate}. |
| `billing.cancel.title` | Résilier votre formule {plan} ? |
| `billing.cancel.text` | Votre formule reste active jusqu'au {endDate}. Ensuite, vous reviendrez à {freePlan}, sans perdre vos données. |
| `billing.cancel.reason.label` | Pouvez-vous nous dire pourquoi ? (facultatif) |
| `billing.cancel.reason.price` | Le prix est trop élevé pour moi |
| `billing.cancel.reason.found` | J'ai trouvé un emploi ou terminé mon recrutement |
| `billing.cancel.reason.features` | Il me manque des fonctionnalités |
| `billing.cancel.reason.usage` | Je ne l'utilise pas assez |
| `billing.cancel.reason.payment` | Le paiement est compliqué |
| `billing.cancel.reason.other` | Autre raison |
| `billing.cancel.comment.placeholder` | Votre avis nous aide à améliorer Jumanly. |
| `billing.cancel.confirm` | Confirmer la résiliation |
| `billing.cancel.keep` | Garder ma formule |
| `billing.cancel.success` | Votre résiliation est enregistrée. {plan} reste actif jusqu'au {endDate}. |
| `billing.resume.success` | Votre formule {plan} est réactivée. |

#### Historique et factures

| Clé | Texte |
|---|---|
| `billing.history.title` | Historique des paiements |
| `billing.history.col.date` | Date |
| `billing.history.col.description` | Description |
| `billing.history.col.method` | Moyen |
| `billing.history.col.amount` | Montant |
| `billing.history.col.status` | Statut |
| `billing.history.col.invoice` | Facture |
| `billing.history.description` | {plan} · du {startDate} au {endDate} |
| `billing.history.status.paid` | Payé |
| `billing.history.status.pending` | En attente |
| `billing.history.status.failed` | Échoué |
| `billing.history.status.refunded` | Remboursé |
| `billing.history.status.expired` | Expiré |
| `billing.history.download` | Télécharger la facture |
| `billing.history.downloadAlt` | Télécharger la facture {number} en PDF |
| `billing.invoice.pdf.title` | Facture |
| `billing.invoice.pdf.number` | Facture n° {number} |
| `billing.invoice.pdf.issued` | Date d'émission : {date} |
| `billing.invoice.pdf.seller` | The Growth Lab · Jumanly |
| `billing.invoice.pdf.sellerContact` | assistant@jumanly.io · infojumanly@gmail.com |
| `billing.invoice.pdf.billedTo` | Facturé à |
| `billing.invoice.pdf.taxId` | Identifiant fiscal : {taxId} |
| `billing.invoice.pdf.description` | Forfait {plan}, du {startDate} au {endDate} |
| `billing.invoice.pdf.price` | Prix du forfait |
| `billing.invoice.pdf.credit` | Crédit du forfait précédent (temps non utilisé) |
| `billing.invoice.pdf.total` | Total payé |
| `billing.invoice.pdf.amount` | {amount} USD |
| `billing.invoice.pdf.method` | Moyen de paiement : {method} |
| `billing.invoice.pdf.reference` | Référence du paiement : {reference} |
| `billing.invoice.pdf.refunded` | Remboursée le {date} |
| `billing.invoice.pdf.footer` | Facture émise par The Growth Lab pour la plateforme Jumanly. Montants en dollars américains (USD). |
| `billing.history.empty` | Aucun paiement pour le moment. |
| `billing.history.pdfNote` | Factures en PDF |
| `billing.history.method.mobileMoney` | Mobile Money · {operator} |
| `billing.history.method.card` | Carte bancaire |
| `billing.history.method.bankTransfer` | Virement bancaire |
| `billing.history.method.cash` | Espèces |
| `billing.invoiceDetails.title` | Informations de facturation |
| `billing.invoiceDetails.text` | Ces informations apparaissent sur vos factures. |
| `billing.invoiceDetails.name.label` | Nom ou raison sociale |
| `billing.invoiceDetails.address.label` | Adresse de facturation |
| `billing.invoiceDetails.taxId.label` | Numéro d'identification fiscale |
| `billing.invoiceDetails.taxId.help` | Facultatif, pour les organisations. |
| `billing.invoiceDetails.email.label` | E-mail de réception des factures |
| `billing.invoiceDetails.save` | Enregistrer |
| `billing.invoiceDetails.saved` | Informations de facturation enregistrées. |
| `billing.invoiceDetails.error` | Vérifiez le nom et l'adresse e-mail. |
| `billing.help.text` | Une question sur votre facture ? Écrivez-nous à {email}. |
| `billing.help.emailPersonal` | infojumanly@gmail.com |
| `billing.help.emailPro` | assistant@jumanly.io |
| `billing.finalize.text` | Votre formule {plan} n'est pas encore activée. En attendant, votre compte fonctionne avec {freePlan}. |
| `billing.finalize.cta` | Finaliser mon forfait |

#### Variante organisation (`/app/organisation/abonnement`)

| Clé | Texte |
|---|---|
| `orgBilling.seo.title` | Abonnement de l'organisation · Jumanly |
| `orgBilling.title` | Abonnement de {orgName} |
| `orgBilling.subtitle` | Formule, sièges, quotas et paiements de votre organisation. |
| `orgBilling.ownerOnly` | Seul le propriétaire de l'organisation peut modifier l'abonnement et les moyens de paiement. |
| `orgBilling.seats.title` | Sièges |
| `orgBilling.seats.usage` | {used} sur {limit} utilisateurs |
| `orgBilling.seats.manage` | Gérer les membres |
| `orgBilling.seats.full` | Tous les sièges sont occupés. Retirez un membre ou passez à une formule supérieure pour en inviter un autre. |
| `orgBilling.jobs.title` | Offres actives |
| `orgBilling.jobs.usage` | {used} sur {limit} offres actives |
| `orgBilling.contract.title` | Contrat Company Premium |
| `orgBilling.contract.text` | Votre formule est régie par un contrat. Pour toute modification de volume ou de services, écrivez à assistant@jumanly.io. |
| `orgBilling.contract.ref` | Référence du contrat : {reference} |
| `orgBilling.contract.end` | Fin du contrat : {date} |

---

### Paiement · Parcours commun

*Écran de paiement partagé par l'inscription (étape 5), la montée en gamme et le renouvellement.*

| Clé | Texte |
|---|---|
| `checkout.title` | Paiement |
| `checkout.summary.title` | Récapitulatif |
| `checkout.summary.plan` | {plan} |
| `checkout.summary.period` | Du {startDate} au {endDate} |
| `checkout.summary.amount` | {amount} USD |
| `checkout.summary.credit` | Crédit déduit : {credit} USD |
| `checkout.summary.total` | Total : {total} USD |
| `checkout.summary.local` | Environ {localAmount} {localCurrency}, au taux de votre opérateur ou de votre banque. |
| `checkout.method.title` | Choisissez votre moyen de paiement |
| `checkout.method.mobileMoney.text` | Mobile Money |
| `checkout.method.mobileMoney.help` | Vous confirmez le paiement sur votre téléphone. |
| `checkout.method.card.text` | Carte bancaire |
| `checkout.method.card.help` | Cartes acceptées par notre prestataire de paiement. |
| `checkout.secure` | Paiement sécurisé par notre prestataire. Jumanly ne conserve pas les données complètes de votre carte ni votre code Mobile Money. |
| `checkout.terms.text` | En payant, vous acceptez les {terms}. |
| `checkout.terms.link` | conditions générales de vente |
| `checkout.applyFree` | Rappel : candidater reste gratuit, que vous payiez ou non. |
| `checkout.cancel` | Annuler et revenir |
| `checkout.summary.creditValue` | − {credit} USD |
| `checkout.summary.currency` | USD |
| `checkout.steps.label` | Étapes du paiement |
| `checkout.steps.method` | Moyen de paiement |
| `checkout.steps.details` | Informations |
| `checkout.steps.confirm` | Confirmation |
| `checkout.steps.done` | terminée |
| `checkout.steps.current` | en cours |

### Paiement · Mobile Money

*Guider pas à pas un paiement Mobile Money, y compris la confirmation sur le téléphone.*

| Clé | Texte |
|---|---|
| `checkout.mm.operator.title` | Votre opérateur |
| `checkout.mm.operator.label` | Opérateur Mobile Money |
| `checkout.mm.operator.placeholder` | Choisissez votre opérateur |
| `checkout.mm.operator.help` | Seuls les opérateurs disponibles dans votre pays sont affichés. |
| `checkout.mm.operator.logoAlt` | Logo de {operator} |
| `checkout.mm.operator.none` | Aucun opérateur Mobile Money n'est encore disponible dans votre pays. Vous pouvez payer par carte bancaire. |
| `checkout.mm.country.label` | Pays du compte Mobile Money |
| `checkout.mm.number.label` | Numéro Mobile Money |
| `checkout.mm.number.placeholder` | Numéro du compte à débiter |
| `checkout.mm.number.help` | Le numéro associé à votre compte {operator}. Il sert uniquement à ce paiement. |
| `checkout.mm.number.remember` | Mémoriser ce numéro pour mes prochains renouvellements |
| `checkout.mm.submit` | Payer {total} USD |
| `checkout.mm.submitting` | Envoi de la demande… |
| `checkout.mm.waiting.title` | Confirmez le paiement sur votre téléphone |
| `checkout.mm.waiting.text` | Une demande de paiement de {localAmount} {localCurrency} a été envoyée au {maskedNumber}. Suivez les instructions de {operator} et saisissez votre code secret pour valider. |
| `checkout.mm.waiting.step1` | Déverrouillez votre téléphone. |
| `checkout.mm.waiting.step2` | Ouvrez la notification ou le message de {operator}. |
| `checkout.mm.waiting.step3` | Vérifiez le montant, puis saisissez votre code secret. |
| `checkout.mm.waiting.noPrompt` | Pas de notification ? Composez le code de votre opérateur pour consulter vos paiements en attente : {ussdHint}. |
| `checkout.mm.waiting.timer` | Temps restant : {minutes} min {seconds} s |
| `checkout.mm.waiting.keepOpen` | Gardez cette page ouverte. Elle se mettra à jour automatiquement. |
| `checkout.mm.waiting.never` | Jumanly ne vous demandera jamais votre code secret. Ne le communiquez à personne. |
| `checkout.mm.waiting.cancel` | Annuler le paiement |
| `checkout.mm.waiting.changeNumber` | Utiliser un autre numéro |
| `checkout.mm.waiting.illustrationAlt` | Téléphone affichant une demande de confirmation de paiement |
| `checkout.mm.checking` | Vérification du paiement… |
| `checkout.mm.waiting.status` | En attente de confirmation |
| `checkout.mm.error.numberInvalid` | Ce numéro ne semble pas valide pour {operator}. Vérifiez l'indicatif et le nombre de chiffres. |
| `checkout.mm.error.operatorRequired` | Choisissez votre opérateur. |
| `checkout.mm.error.numberRequired` | Saisissez votre numéro Mobile Money. |

### Paiement · Carte bancaire

*Permettre un paiement par carte via le formulaire sécurisé du prestataire.*

| Clé | Texte |
|---|---|
| `checkout.card.title` | Carte bancaire |
| `checkout.card.secureForm` | Formulaire sécurisé du prestataire |
| `checkout.card.number.label` | Numéro de carte |
| `checkout.card.number.placeholder` | 1234 1234 1234 1234 |
| `checkout.card.expiry.label` | Date d'expiration |
| `checkout.card.expiry.placeholder` | MM/AA |
| `checkout.card.cvc.label` | Code de sécurité |
| `checkout.card.cvc.placeholder` | 3 ou 4 chiffres |
| `checkout.card.cvc.help` | Les chiffres au dos de votre carte. |
| `checkout.card.name.label` | Nom sur la carte |
| `checkout.card.name.placeholder` | Tel qu'il figure sur la carte |
| `checkout.card.save` | Enregistrer cette carte pour mes prochains paiements |
| `checkout.card.submit` | Payer {total} USD |
| `checkout.card.submitting` | Paiement en cours… |
| `checkout.card.3ds` | Votre banque peut vous demander une confirmation supplémentaire. Suivez ses instructions. |
| `checkout.card.error.number` | Numéro de carte invalide. |
| `checkout.card.error.expiry` | Date d'expiration invalide ou dépassée. |
| `checkout.card.error.cvc` | Code de sécurité invalide. |
| `checkout.card.error.declined` | Votre banque a refusé le paiement. Contactez-la ou essayez un autre moyen de paiement. |
| `checkout.card.error.insufficient` | Le paiement a été refusé pour solde insuffisant. |
| `checkout.card.error.3dsFailed` | La confirmation demandée par votre banque n'a pas abouti. Réessayez. |
| `checkout.card.error.notSupported` | Cette carte n'est pas acceptée. Essayez une autre carte ou Mobile Money. |

### Paiement · Résultats

*Messages de fin de paiement : succès, échec, expiration, annulation, statut incertain.*

| Clé | Texte |
|---|---|
| `checkout.success.title` | Paiement confirmé |
| `checkout.success.text` | Merci. Votre formule {plan} est active jusqu'au {endDate}. Un reçu a été envoyé à {email}. |
| `checkout.success.reference` | Référence : {reference} |
| `checkout.success.cta` | Continuer |
| `checkout.success.invoice` | Télécharger la facture |
| `checkout.failed.title` | Le paiement n'a pas abouti |
| `checkout.failed.text` | Aucun montant n'a été débité. Vous pouvez réessayer ou choisir un autre moyen de paiement. |
| `checkout.failed.reason.insufficient` | Le solde de votre compte Mobile Money est insuffisant. |
| `checkout.failed.reason.rejected` | Le paiement a été refusé sur votre téléphone. |
| `checkout.failed.reason.wrongPin` | Le code secret saisi était incorrect. |
| `checkout.failed.reason.limit` | Le montant dépasse le plafond autorisé par votre opérateur. |
| `checkout.failed.reason.operator` | Le service de {operator} est momentanément indisponible. |
| `checkout.failed.reason.generic` | L'opérateur n'a pas pu traiter le paiement. |
| `checkout.failed.retry` | Réessayer |
| `checkout.failed.otherMethod` | Choisir un autre moyen de paiement |
| `checkout.failed.keepFree` | Continuer avec la formule gratuite |
| `checkout.expired.title` | Le délai de confirmation est dépassé |
| `checkout.expired.text` | La demande de paiement n'a pas été confirmée à temps et a été annulée. Aucun montant n'a été débité. |
| `checkout.expired.retry` | Envoyer une nouvelle demande |
| `checkout.cancelled.title` | Paiement annulé |
| `checkout.cancelled.text` | Vous avez annulé le paiement. Aucun montant n'a été débité. |
| `checkout.pending.title` | Paiement en cours de vérification |
| `checkout.pending.text` | Nous attendons la confirmation de {operator}. Cela peut prendre quelques minutes. Vous recevrez un e-mail dès que votre formule sera activée. Inutile de payer à nouveau. |
| `checkout.pending.cta` | Revenir à mon espace |
| `checkout.duplicate` | Un paiement est déjà en cours pour cette formule. Attendez sa confirmation avant d'en lancer un autre. |
| `checkout.debitedNotActivated` | Vous avez été débité mais votre formule n'est pas active ? Écrivez-nous à infojumanly@gmail.com avec la référence {reference}. Nous régularisons au plus vite. |
| `checkout.result.eyebrow` | Résultat du paiement |
| `checkout.mm.operators.mpesa` | M-Pesa |
| `checkout.mm.operators.orange` | Orange Money |
| `checkout.mm.operators.airtel` | Airtel Money |
| `checkout.mm.operators.mtn` | MTN Mobile Money |
| `checkout.fake` | Paiement de démonstration : aucun argent n'est débité. Un numéro se terminant par 0000 simule un refus, 1111 un délai dépassé, 2222 une attente. |
| `checkout.trial.text` | Le paiement en ligne arrive bientôt. En attendant, vous pouvez essayer {plan} pendant {days} jours, sans rien payer. |
| `checkout.trial.cta` | Essayer {plan} |

---

### Renouvellement, rappels et délai de grâce

*Prévenir avant l'échéance, faciliter le renouvellement prépayé et expliquer sans alarmer le retour au forfait gratuit.*

#### Bannières dans l'application

| Clé | Texte |
|---|---|
| `renewal.banner.upcoming` | Votre formule {plan} arrive à échéance {days, plural, one {dans # jour} other {dans # jours}}, le {date}. |
| `renewal.banner.today` | Votre formule {plan} arrive à échéance aujourd'hui. |
| `renewal.banner.cta` | Renouveler |
| `renewal.banner.grace.text` | Votre paiement est en attente. Votre formule {plan} reste active jusqu'au {graceEndDate}. Renouvelez avant cette date pour continuer sans interruption. |
| `renewal.banner.grace.cta` | Renouveler maintenant |
| `renewal.banner.downgraded.text` | Votre formule {plan} a pris fin. Vous êtes revenu à {freePlan}. Toutes vos données sont conservées. |
| `renewal.banner.downgraded.cta` | Réactiver {plan} |
| `renewal.banner.dismiss` | Masquer |

#### Écran de renouvellement

| Clé | Texte |
|---|---|
| `renewal.page.title` | Renouveler {plan} |
| `renewal.page.text` | Votre abonnement est prépayé : renouvelez pour un mois supplémentaire. La nouvelle période commence à la fin de la période en cours. |
| `renewal.page.period` | Nouvelle période : du {startDate} au {endDate} |
| `renewal.page.useSaved` | Payer avec {method} |
| `renewal.page.otherMethod` | Utiliser un autre moyen de paiement |
| `renewal.page.success` | Merci ! Votre formule {plan} est renouvelée jusqu'au {endDate}. |
| `renewal.page.applyFree` | Même sans renouvellement, vous pourrez toujours postuler gratuitement. |

#### Notifications et e-mails de rappel

| Clé | Texte |
|---|---|
| `renewal.notif.d7` | Votre formule {plan} arrive à échéance le {date}. Renouvelez en un geste pour garder vos avantages. |
| `renewal.notif.d3` | Plus que {days} jours avant l'échéance de votre formule {plan}. |
| `renewal.notif.d0` | Votre formule {plan} arrive à échéance aujourd'hui. Renouvelez pour éviter toute interruption. |
| `renewal.notif.grace` | Paiement en attente : votre formule {plan} reste active jusqu'au {graceEndDate}. |
| `renewal.notif.downgraded` | Votre formule {plan} a pris fin. Vous êtes passé à {freePlan}, sans perte de données. |
| `renewal.notif.renewed` | Formule {plan} renouvelée jusqu'au {endDate}. Merci ! |
| `renewal.email.d7.subject` | Votre formule {plan} arrive à échéance le {date} |
| `renewal.email.d7.body` | Bonjour {firstName}, votre formule {plan} arrive à échéance le {date}. Avec Mobile Money, l'abonnement est prépayé : pour continuer à profiter de vos avantages, renouvelez-le depuis votre espace. Rappel : vos candidatures restent gratuites dans tous les cas. |
| `renewal.email.d3.subject` | Plus que {days} jours avant l'échéance de {plan} |
| `renewal.email.d3.body` | Bonjour {firstName}, votre formule {plan} prend fin le {date}. Renouvelez en quelques secondes par Mobile Money ou par carte. |
| `renewal.email.d0.subject` | Votre formule {plan} arrive à échéance aujourd'hui |
| `renewal.email.d0.body` | Bonjour {firstName}, votre formule {plan} arrive à échéance aujourd'hui. Sans renouvellement, elle restera active pendant un délai de grâce jusqu'au {graceEndDate}, puis vous reviendrez à {freePlan}. Vos données seront conservées. |
| `renewal.email.downgraded.subject` | Vous êtes revenu à {freePlan} |
| `renewal.email.downgraded.body` | Bonjour {firstName}, votre formule {plan} n'a pas été renouvelée. Vous utilisez désormais {freePlan}. Votre profil, vos CV, vos attestations, vos candidatures et vos messages sont conservés. Vous pouvez réactiver {plan} à tout moment. |
| `renewal.email.cta` | Renouveler ma formule |
| `renewal.email.receipt.subject` | Reçu de paiement Jumanly · {plan} |
| `renewal.email.receipt.body` | Bonjour {firstName}, nous avons bien reçu votre paiement de {amount} USD pour la formule {plan}, valable du {startDate} au {endDate}. Référence : {reference}. Votre facture est disponible dans votre espace. |

#### Retour au forfait gratuit

| Clé | Texte |
|---|---|
| `downgradeFree.title` | Vous êtes revenu à {freePlan} |
| `downgradeFree.text` | Votre formule {plan} a pris fin. Rien n'est perdu : vos données restent en sécurité et vous retrouverez tout en réactivant une formule. |
| `downgradeFree.kept.title` | Ce qui est conservé |
| `downgradeFree.kept.talent` | Profil, CV et documents créés, attestations obtenues, plan de progression, candidatures et messages. |
| `downgradeFree.kept.org` | Offres, candidatures, notes, grilles d'évaluation, historique des décisions et messages. |
| `downgradeFree.paused.title` | Ce qui est mis en pause |
| `downgradeFree.paused.talent` | Les fonctionnalités et formations réservées à {plan}. Votre progression dans ces formations est enregistrée. |
| `downgradeFree.paused.org` | Les offres actives au-delà de {jobs, plural, one {# offre} other {# offres}} passent en pause, et les membres au-delà de {seats, plural, one {# siège} other {# sièges}} perdent l'accès. Rien n'est supprimé. |
| `downgradeFree.applyFree` | Vous pouvez toujours postuler gratuitement à toutes les offres. |
| `downgradeFree.cta` | Réactiver {plan} |
| `downgradeFree.secondary` | Continuer avec {freePlan} |

---

### Quotas · Alertes et verrous

*Prévenir avant d'atteindre un quota, expliquer clairement quand il est atteint, et indiquer le forfait requis pour une fonctionnalité verrouillée. Jamais d'erreur technique.*

#### Alerte à 80 %

| Clé | Texte |
|---|---|
| `quota.warn.title` | Vous avez utilisé 80 % de votre quota |
| `quota.warn.text` | Il vous reste {left} sur {limit} pour « {quotaName} » jusqu'au {resetDate}. |
| `quota.warn.cta` | Voir mes quotas |
| `quota.warn.upgrade` | Augmenter mes quotas |
| `quota.warn.email.subject` | 80 % de votre quota « {quotaName} » utilisé |
| `quota.warn.email.body` | Bonjour {firstName}, vous avez utilisé {used} sur {limit} pour « {quotaName} ». Votre quota se renouvelle le {resetDate}. Si vous en avez besoin de davantage, découvrez les formules supérieures. |

#### Quota atteint (100 %)

| Clé | Texte |
|---|---|
| `quota.reached.title` | Quota atteint |
| `quota.reached.text` | Vous avez utilisé tout votre quota « {quotaName} » pour cette période. Il se renouvelle le {resetDate}. |
| `quota.reached.options` | Vous pouvez : |
| `quota.reached.wait` | Attendre le renouvellement, le {resetDate} |
| `quota.reached.addon` | Ajouter des crédits supplémentaires |
| `quota.reached.upgrade` | Passer à {plan} pour un quota plus élevé |
| `quota.reached.applyFree` | Vos candidatures ne sont pas concernées : vous pouvez toujours postuler gratuitement. |
| `quota.reached.close` | J'ai compris |
| `quota.reached.email.subject` | Quota « {quotaName} » atteint |
| `quota.reached.email.body` | Bonjour {firstName}, vous avez atteint votre quota « {quotaName} ». Il se renouvelle le {resetDate}. En attendant, toutes les autres fonctionnalités restent disponibles, et vous pouvez toujours postuler gratuitement. |
| `quota.reached.inline` | Quota atteint jusqu'au {resetDate}. |

Note d'intégration : `quota.reached.addon` n'est affiché que si une option de crédits supplémentaires existe pour ce quota (doc 05, § 4). `quota.reached.upgrade` n'est pas affiché si l'utilisateur a déjà la formule la plus élevée de sa famille.

#### Messages spécifiques par quota

| Clé | Texte |
|---|---|
| `quota.name.ai` | Assistance IA |
| `quota.name.interviewText` | Simulations d'entretien textuelles |
| `quota.name.interviewVoice` | Simulations d'entretien vocales |
| `quota.name.talentSearch` | Recherches dans le vivier |
| `quota.name.contactRequests` | Demandes de mise en relation |
| `quota.ai.reached` | Vous avez utilisé vos {limit} crédits d'assistance IA ce mois-ci. Vos documents restent modifiables à la main. |
| `quota.interview.reached` | Vous avez fait vos {limit} simulations d'entretien de la période. Revoyez vos feedbacks précédents en attendant le {resetDate}. |
| `quota.talentSearch.reached` | Vous avez atteint votre limite de recherches dans le vivier pour cette période. Cette limite protège les données personnelles des talents. Elle se renouvelle le {resetDate}. |
| `quota.contactRequests.reached` | Vous avez envoyé toutes vos demandes de mise en relation de la période. Les échanges en cours et les candidatures reçues ne sont pas concernés. |
| `quota.activeJobs.reached` | Vous avez {limit, plural, one {# offre active} other {# offres actives}}, le maximum de votre formule. Fermez une offre ou passez à une formule supérieure pour en publier une nouvelle. Vous pouvez enregistrer celle-ci en brouillon. |
| `quota.activeJobs.saveDraft` | Enregistrer en brouillon |
| `quota.seats.reached` | Tous les sièges de votre formule sont occupés ({limit}). Retirez un membre ou passez à une formule supérieure pour inviter un nouveau collègue. |

#### Verrou de fonctionnalité

| Clé | Texte |
|---|---|
| `lock.badge` | {plan} |
| `lock.iconAlt` | Fonctionnalité verrouillée |
| `lock.title` | Disponible avec {plan} |
| `lock.text` | « {feature} » est inclus à partir de la formule {plan}. |
| `lock.cta` | Voir les forfaits |
| `lock.ctaUpgrade` | Passer à {plan} |
| `lock.ctaQuote` | Demander un devis |
| `lock.applyFree` | Rappel : vos candidatures restent gratuites. |
| `lock.org.notOwner` | Demandez au propriétaire de votre organisation de changer de formule. |
| `lock.org.notify` | Prévenir le propriétaire |
| `lock.org.notified` | Le propriétaire de l'organisation a été prévenu. |
| `lock.training.title` | Formation incluse dans {plan} |
| `lock.training.text` | Cette formation fait partie des parcours de la formule {plan}. Vous pouvez regarder la première leçon en aperçu. |
| `lock.training.preview` | Voir l'aperçu |
| `lock.feature.cvTailor` | Adaptation du CV à une offre |
| `lock.feature.documents` | Lettres, biographie et correction de documents |
| `lock.feature.linkedin` | Préparation LinkedIn |
| `lock.feature.diagnosticPersonalized` | Diagnostic de carrière personnalisé |
| `lock.feature.interviewText` | Simulations d'entretien textuelles |
| `lock.feature.interviewVoice` | Simulations d'entretien vocales |
| `lock.feature.progressPlan` | Plan de progression |
| `lock.feature.portfolio` | Portfolio |
| `lock.feature.jobExercises` | Exercices par métier |
| `lock.feature.detailedReports` | Rapports détaillés de progression |
| `lock.feature.talentSearch` | Recherche dans le vivier de talents |
| `lock.feature.matching` | Suggestions de matching |
| `lock.feature.cvAnalysis` | Analyse structurée des CV |
| `lock.feature.shortlist` | Présélection et classement |
| `lock.feature.appointments` | Rendez-vous |
| `lock.feature.collaboration` | Collaboration entre recruteurs |
| `lock.feature.scorecards` | Grilles d'évaluation |
| `lock.feature.decisionHistory` | Historique des décisions |
| `lock.feature.verifiedProfile` | Profil entreprise vérifié |
| `lock.feature.teams` | Équipes RH |
| `lock.feature.sharedPools` | Viviers de talents partagés |
| `lock.feature.reportsExport` | Export des rapports |
| `lock.feature.entities` | Entités et filiales |
| `lock.feature.workflows` | Workflows configurables |
| `lock.feature.integrations` | Intégrations |

---

### Licence sponsorisée active

*Informer le bénéficiaire de sa licence Partners, de sa durée et de la protection de ses données.*

| Clé | Texte |
|---|---|
| `sponsored.card.title` | Licence offerte par {sponsorName} |
| `sponsored.card.plan` | Formule {plan} |
| `sponsored.card.period` | Du {startDate} au {endDate} |
| `sponsored.card.daysLeft` | {days, plural, =0 {Se termine aujourd'hui} one {# jour restant} other {# jours restants}} |
| `sponsored.card.free` | Vous n'avez rien à payer pendant cette période. |
| `sponsored.card.privacy` | {sponsorName} reçoit uniquement des statistiques agrégées. Votre CV, vos messages et vos données personnelles ne lui sont pas transmis sans votre accord. |
| `sponsored.card.privacyLink` | En savoir plus sur vos données |
| `sponsored.card.logoAlt` | Logo de {sponsorName} |
| `sponsored.pending.title` | Licence en attente |
| `sponsored.pending.text` | Votre licence {plan} offerte par {sponsorName} commencera à la fin de votre formule actuelle {currentPlan}, si elle est encore valable. |
| `sponsored.ending.banner` | Votre licence {plan} offerte par {sponsorName} se termine le {endDate}. Vous pourrez ensuite continuer gratuitement ou choisir une formule. |
| `sponsored.ending.cta` | Voir les formules |
| `sponsored.ended.title` | Votre licence sponsorisée est terminée |
| `sponsored.ended.text` | Merci d'avoir utilisé Jumanly grâce à {sponsorName}. Vous êtes revenu à Free. Toutes vos données sont conservées, et vous pouvez toujours postuler gratuitement. |
| `sponsored.ended.cta` | Continuer avec une formule payante |
| `sponsored.ended.secondary` | Continuer avec Free |
| `sponsored.consent.title` | {sponsorName} souhaite connaître votre parcours |
| `sponsored.consent.text` | {sponsorName} demande à recevoir {dataDescription} vous concernant, pour {purpose}. Vous êtes libre d'accepter ou de refuser. Votre licence n'en dépend pas. |
| `sponsored.consent.accept` | J'accepte |
| `sponsored.consent.decline` | Je refuse |
| `sponsored.consent.withdraw` | Vous pouvez changer votre réponse à tout moment sur cette page. |
| `sponsored.consent.dataDescription` | le fait que vous ayez été recruté grâce à Jumanly (sans votre nom ni celui de l'employeur) |
| `sponsored.consent.purpose` | mesurer l'impact de son programme |
| `sponsored.consent.status.accepted` | Vous avez accepté que votre recrutement soit comptabilisé, de façon anonyme. |
| `sponsored.consent.status.declined` | Vous avez refusé que votre recrutement soit comptabilisé. |
| `sponsored.consent.change` | Changer ma réponse |
| `sponsored.consent.saved` | Votre réponse est enregistrée. |

---

### Demande de devis Company Premium

*Recueillir une demande de devis pour Company Premium. Le bouton « Demander un devis » ouvre `/contact?sujet=devis` ou cette fenêtre dans l'application.*

| Clé | Texte |
|---|---|
| `quote.title` | Demander un devis Company Premium |
| `quote.hero.title` | Demander un devis |
| `quote.hero.text` | Pour les grands groupes et les organisations aux besoins particuliers : décrivez votre projet, nous construisons la proposition avec vous. |
| `quote.subtitle` | Décrivez votre organisation et vos besoins. Nous préparons une proposition adaptée et vous répondons par e-mail. |
| `quote.org.label` | Nom de l'organisation |
| `quote.org.placeholder` | Raison sociale ou nom du groupe |
| `quote.name.label` | Votre nom complet |
| `quote.name.placeholder` | Prénom et nom |
| `quote.role.label` | Votre fonction |
| `quote.role.placeholder` | Ex. : Directrice des ressources humaines |
| `quote.email.label` | E-mail professionnel |
| `quote.email.placeholder` | nom@entreprise.com |
| `quote.country.label` | Pays du siège |
| `quote.country.placeholder` | Choisissez un pays |
| `quote.users.label` | Nombre d'utilisateurs envisagé |
| `quote.users.placeholder` | Recruteurs et managers |
| `quote.entities.label` | Nombre d'entités, filiales ou départements |
| `quote.entities.placeholder` | Ex. : 4 |
| `quote.jobs.label` | Volume d'offres estimé par an |
| `quote.jobs.placeholder` | Une estimation suffit |
| `quote.needs.label` | Besoins particuliers |
| `quote.needs.workflows` | Workflows de recrutement configurables |
| `quote.needs.integrations` | Intégrations avec nos outils RH |
| `quote.needs.dashboards` | Tableaux de bord personnalisés |
| `quote.needs.onboarding` | Accompagnement à la configuration |
| `quote.needs.support` | Maintenance et support contractuels |
| `quote.needs.partners` | Licences Partners pour nos collaborateurs |
| `quote.tools.label` | Outils RH utilisés aujourd'hui |
| `quote.tools.placeholder` | Facultatif |
| `quote.message.label` | Message |
| `quote.message.placeholder` | Contexte, calendrier, contraintes… |
| `quote.consent` | J'accepte que Jumanly utilise ces informations pour répondre à ma demande, conformément à la politique de confidentialité. |
| `quote.submit` | Envoyer ma demande |
| `quote.submitting` | Envoi… |
| `quote.success.title` | Merci, votre demande est envoyée |
| `quote.success.text` | Notre équipe vous répond par e-mail à {email}. En attendant, vous pouvez commencer gratuitement avec RH Free ou choisir la formule Company. |
| `quote.success.cta` | Revenir aux forfaits |
| `quote.error.required` | Ce champ est obligatoire. |
| `quote.error.email` | Saisissez une adresse e-mail valide. |
| `quote.error.number` | Saisissez un nombre. |
| `quote.error.consent` | Votre accord est nécessaire pour que nous puissions vous répondre. |
| `quote.error.send` | Votre demande n'a pas pu être envoyée. Réessayez ou écrivez-nous à assistant@jumanly.io. |
| `quote.direct` | Vous préférez écrire directement ? assistant@jumanly.io |


---

## Partie 06 · Jumanly Intelligence (IA et matching)

Tous les textes liés à l'IA : orbe et carte IA, score de compatibilité et « Pourquoi ? », coach CV, analyse structurée de CV, avertissements, consentement, signalement et révision humaine, crédits IA, et page publique « Comment fonctionne le matching ».

Règles qui s'appliquent à chaque texte de ce fichier :

- **L'IA recommande, l'humain décide.** L'IA classe et explique ; elle ne rejette jamais un candidat.
- Toute suggestion IA porte l'orbe IA, un lien « Pourquoi ? » et, si elle modifie quelque chose, les boutons Appliquer / Ignorer.
- Le score (0 à 100) est la **somme pondérée** de huit critères : compétences requises, compétences souhaitées, expérience, localisation et télétravail, contrat et disponibilité, langues, formation ou diplôme, proximité avec le poste (doc 08, § 8.3).
- Données **jamais** utilisées : genre, âge, photo, origine, religion, situation familiale, état de santé. Le forfait du talent n'est pas non plus pris en compte.
- Bandes : 85 à 100 « Très compatible » ; 70 à 84 « Compatible » ; 50 à 69 « Partiellement compatible » ; moins de 50 « Peu compatible ».
- Variables : `{score}`, `{band}`, `{weight}`, `{points}`, `{skill}`, `{skills}`, `{courseTitle}`, `{hours}`, `{newScore}`, `{jobTitle}`, `{company}`, `{candidateName}`, `{used}`, `{quota}`, `{plan}`.

---

### Orbe et carte IA (composant commun)

*Signaler sans ambiguïté qu'un contenu vient de l'IA et donner la main à l'utilisateur.*

| Clé | Texte |
|---|---|
| `ai.brand` | Jumanly Intelligence |
| `ai.orb.aria` | Suggestion de Jumanly Intelligence |
| `ai.orb.tooltip` | Contenu proposé par l'IA. Vous gardez la décision. |
| `ai.card.title` | Jumanly Intelligence |
| `ai.card.why` | Pourquoi ? |
| `ai.card.whyClose` | Masquer l'explication |
| `ai.card.apply` | Appliquer |
| `ai.card.ignore` | Ignorer |
| `ai.card.applied.text` | Suggestion appliquée. |
| `ai.card.applied.undo` | Annuler |
| `ai.card.ignored` | Suggestion ignorée. Nous ne vous la reproposerons pas. |
| `ai.card.next` | Suivante |
| `ai.card.previous` | Précédente |
| `ai.card.counter` | Suggestion {current} sur {total} |
| `ai.card.feedback.question` | Cette suggestion vous a-t-elle aidé ? |
| `ai.card.feedback.yes` | Oui |
| `ai.card.feedback.no` | Non |
| `ai.card.feedback.thanks` | Merci, votre avis améliore les suggestions. |
| `ai.card.loading` | Jumanly Intelligence analyse… |
| `ai.card.error` | L'analyse n'a pas abouti. Aucun crédit n'a été utilisé. Réessayez dans un instant. |
| `ai.card.retry` | Réessayer |
| `ai.card.empty` | Aucune suggestion pour l'instant. |
| `ai.disclaimer.short` | Suggestion générée par l'IA, vérifiez-la. |
| `ai.disclaimer.long` | Ce contenu est généré par l'IA à partir de vos informations. Il peut contenir des erreurs : relisez-le avant de l'utiliser. |
| `ai.disclaimer.decide` | L'IA conseille, vous décidez. Rien n'est modifié sans votre accord. |
| `ai.disclaimer.recruiter` | L'IA classe et explique. Elle ne prend aucune décision : vous examinez chaque candidature. |
| `ai.disclaimer.noInvention` | L'IA reformule ce que vous avez écrit. Elle n'ajoute ni expérience ni diplôme que vous n'avez pas. |

---

### Score de compatibilité · Libellés

*Nommer le score et ses bandes de la même façon partout.*

| Clé | Texte |
|---|---|
| `match.score.label` | Compatibilité |
| `match.score.value` | {score} % |
| `match.score.valueWithBand` | {score} % · {band} |
| `match.score.compact` | {score} % compatible |
| `match.score.aria` | Compatibilité de {score} sur 100 : {band} |
| `match.band.veryHigh.text` | Très compatible |
| `match.band.high.text` | Compatible |
| `match.band.partial.text` | Partiellement compatible |
| `match.band.low.text` | Peu compatible |
| `match.band.veryHigh.range` | 85 à 100 |
| `match.band.high.range` | 70 à 84 |
| `match.band.partial.range` | 50 à 69 |
| `match.band.low.range` | Moins de 50 |
| `match.score.updated` | Calcul expliqué, mis à jour {time, relative} |
| `match.score.pending` | Calcul en cours… |
| `match.score.unavailable` | Score indisponible : profil trop incomplet. Ajoutez vos compétences pour obtenir un score. |
| `match.score.optedOut` | Calcul de compatibilité désactivé |
| `match.score.lowIsNotNo` | Un score bas n'est pas un refus. Vous pouvez toujours postuler. |

### Score de compatibilité · Libellés des critères

*Les huit critères, leur nom court et leur explication.*

| Clé | Texte |
|---|---|
| `match.criterion.requiredSkills.text` | Compétences requises |
| `match.criterion.requiredSkills.desc` | Les compétences que l'offre exige, comparées à celles de votre profil et à leur niveau. |
| `match.criterion.preferredSkills.text` | Compétences souhaitées |
| `match.criterion.preferredSkills.desc` | Les compétences qui sont un plus pour le poste. |
| `match.criterion.experience.text` | Expérience |
| `match.criterion.experience.desc` | Vos années d'expérience utiles au poste, stages et engagements compris. |
| `match.criterion.location.text` | Localisation et télétravail |
| `match.criterion.location.desc` | La distance au lieu de travail, votre mobilité et le mode de travail accepté. |
| `match.criterion.contract.text` | Contrat et disponibilité |
| `match.criterion.contract.desc` | Le contrat proposé, comparé à ceux que vous recherchez, et votre date de disponibilité. |
| `match.criterion.languages.text` | Langues |
| `match.criterion.languages.desc` | Les langues demandées et le niveau attendu. |
| `match.criterion.education.text` | Formation et diplôme |
| `match.criterion.education.desc` | Le niveau et le domaine d'études, ou l'expérience équivalente si l'offre l'accepte. |
| `match.criterion.availability.text` | Disponibilité |
| `match.criterion.availability.desc` | Votre date de disponibilité, comparée à la date de début souhaitée. |
| `match.criterion.semantic.text` | Proximité avec le poste |
| `match.criterion.semantic.desc` | La ressemblance entre l'ensemble de votre profil et la description du poste, mesurée automatiquement. Ce critère n'est calculé que si le service est actif. |
| `match.criterion.weight` | Poids : {weight} % |
| `match.criterion.points` | {points} sur {weight} points |
| `match.criterion.percent` | {percent} % |
| `match.criterion.status.met` | Rempli |
| `match.criterion.status.partial` | Partiellement rempli |
| `match.criterion.status.unmet` | Non rempli |
| `match.criterion.status.unknown` | Information absente |
| `match.criterion.status.notRequested` | Non demandé par l'offre |
| `match.criterion.status.notApplicable` | Non pris en compte pour cette offre |
| `match.detail.unknown` | Information absente de votre profil : ce critère compte pour moitié. |
| `match.detail.skills` | {met} sur {total} au niveau attendu |
| `match.detail.experience.none` | Aucune expérience minimale demandée |
| `match.detail.education.none` | Aucun diplôme exigé par l'offre |
| `match.detail.education.met` | Votre niveau d'études correspond à celui demandé. |
| `match.detail.education.below` | Votre niveau d'études est en dessous de celui demandé. |
| `match.detail.education.certificate` | Une attestation Jumanly sur une compétence du poste compte en plus. |
| `match.detail.languages` | {met} sur {total, plural, one {# langue demandée} other {# langues demandées}} renseignées dans votre profil |
| `match.detail.location.relocation` | Poste à {city}, dans votre pays : vous acceptez de déménager. |
| `match.detail.location.far` | Poste à {city}, loin de votre lieu de vie. |
| `match.detail.contract.wanted` | Ce contrat fait partie de vos recherches. |
| `match.detail.contract.notWanted` | Ce contrat ne fait pas partie de vos recherches. |
| `match.detail.availability.ok` | Vous êtes disponible à temps. |
| `match.detail.availability.late` | Votre disponibilité arrive après le début souhaité. |
| `match.detail.semantic` | Ressemblance avec la description du poste : {percent} % |

---

### « Pourquoi ? » · Côté talent

*Expliquer le score en langage simple et montrer comment progresser.*

| Clé | Texte |
|---|---|
| `match.why.talent.title` | Pourquoi {score} % ? |
| `match.why.talent.intro` | Votre score est la somme de huit critères, pondérés par le recruteur. Voici le détail pour « {jobTitle} ». |
| `match.why.talent.met.title` | Ce qui correspond |
| `match.why.talent.met.item.skill` | {skill} : niveau {level} attendu, vous l'avez |
| `match.why.talent.met.item.skillVerified` | {skill} : validé par votre attestation Jumanly |
| `match.why.talent.met.item.experience` | {years, plural, one {# an} other {# ans}} d'expérience pour {min} demandés |
| `match.why.talent.met.item.language` | {language} {level} |
| `match.why.talent.met.item.location` | Lieu compatible : {city} · {workMode} |
| `match.why.talent.met.item.contract` | {contract} fait partie de vos recherches |
| `match.why.talent.met.item.education` | Diplôme attendu : {degree} |
| `match.why.talent.met.item.availability` | Disponible à temps pour un début le {date, date, medium} |
| `match.why.talent.partial.title` | Ce qui correspond en partie |
| `match.why.talent.partial.item.skillLevel` | {skill} : niveau {expected} attendu, vous indiquez {actual} |
| `match.why.talent.partial.item.experience` | {years, plural, one {# an} other {# ans}} d'expérience pour {min} demandés |
| `match.why.talent.partial.item.language` | {language} : {expected} attendu, vous indiquez {actual} |
| `match.why.talent.partial.item.location` | {distance} km du lieu de travail |
| `match.why.talent.partial.item.education` | Domaine d'études proche de celui demandé |
| `match.why.talent.missing.title` | Compétences manquantes |
| `match.why.talent.missing.required` | Requise : {skill} |
| `match.why.talent.missing.preferred` | Souhaitée : {skill} |
| `match.why.talent.missing.none` | Aucune compétence manquante. Bravo ! |
| `match.why.talent.missing.maybeHave` | Vous avez cette compétence ? Ajoutez-la à votre profil, le score sera recalculé. |
| `match.why.talent.missing.addToProfile` | Ajouter à mon profil |
| `match.why.talent.courses.title` | Formations Jumanly pour combler l'écart |
| `match.why.talent.courses.item` | « {courseTitle} » · {hours} h |
| `match.why.talent.courses.impact` | Votre score passerait à {newScore} % |
| `match.why.talent.courses.included` | Incluse dans votre forfait |
| `match.why.talent.courses.free` | Gratuite |
| `match.why.talent.courses.locked` | Disponible avec {plan} |
| `match.why.talent.courses.cta` | Voir la formation |
| `match.why.talent.courses.none` | Pas encore de formation Jumanly sur ces compétences. |
| `match.why.talent.knockout.title` | Critères indispensables de l'offre |
| `match.why.talent.knockout.met` | Vous remplissez tous les critères indispensables. |
| `match.why.talent.knockout.unmet` | Vous ne remplissez pas : {criteria}. Vous pouvez quand même postuler : le recruteur examine chaque candidature. |
| `match.why.talent.knockout.toVerify` | À vérifier par le recruteur |
| `match.why.talent.breakdown` | Détail par critère |
| `match.why.talent.neverUsed` | Jamais pris en compte : genre, âge, photo, origine, religion, situation familiale, état de santé, ni votre forfait Jumanly. |
| `match.why.talent.reportError` | Le score vous semble faux ? Signaler une erreur |
| `match.why.talent.learnMore` | Comment fonctionne le matching |
| `match.why.talent.footer` | Ce score vous aide à choisir où postuler. La décision de recrutement appartient toujours au recruteur. |

### « Pourquoi ? » · Côté recruteur

*Donner une lecture rapide et vérifiable, sans transformer le score en décision.*

| Clé | Texte |
|---|---|
| `match.why.recruiter.title` | Pourquoi {score} % pour {candidateName} ? |
| `match.why.recruiter.intro` | Somme pondérée des huit critères de votre offre, avec les poids affichés pour chacun. |
| `match.why.recruiter.met.title` | Critères remplis |
| `match.why.recruiter.partial.title` | Critères partiellement remplis |
| `match.why.recruiter.missing.title` | Compétences manquantes |
| `match.why.recruiter.missing.item` | {skill} ({kind}) |
| `match.why.recruiter.missing.kind.required` | requise |
| `match.why.recruiter.missing.kind.preferred` | souhaitée |
| `match.why.recruiter.missing.inProgress` | En cours d'apprentissage sur Jumanly : « {courseTitle} » ({percent} %) |
| `match.why.recruiter.evidence.text` | Éléments du profil utilisés |
| `match.why.recruiter.evidence.declared` | Déclaré par le candidat |
| `match.why.recruiter.evidence.verified` | Validé par une attestation Jumanly |
| `match.why.recruiter.evidence.cv` | Extrait du CV |
| `match.why.recruiter.evidence.absent` | Absente du profil |
| `match.why.recruiter.knockout.title` | Critères éliminatoires de l'offre |
| `match.why.recruiter.knockout.unmet` | Non rempli : {criteria}. Le candidat n'est pas écarté : à vous de juger. |
| `match.why.recruiter.knockout.unknown` | Information absente : {criteria}. Vous pouvez demander une précision au candidat. |
| `match.why.recruiter.verify.unknown` | Information absente du profil : {criterion} |
| `match.why.recruiter.weights.text` | Poids utilisés |
| `match.why.recruiter.weights.edit` | Modifier les poids de l'offre |
| `match.why.recruiter.weights.recalc` | Les scores de tous les candidats seront recalculés. |
| `match.why.recruiter.neverUsed` | Le score n'utilise jamais : genre, âge, photo, origine, religion, situation familiale, état de santé, ni le forfait du talent. |
| `match.why.recruiter.rule` | L'IA classe et explique, vous décidez. Un score ne justifie pas à lui seul une décision. |
| `match.why.recruiter.disputed` | Ce candidat a signalé une erreur sur son score. Une révision humaine est en cours. |
| `match.why.recruiter.suggestionsOnly` | Votre forfait inclut les suggestions de matching. L'explication détaillée par critère est disponible avec {plan}. |

---

### Formations recommandées (Learn, plan de progression, tableau de bord)

*Relier chaque recommandation à un écart concret.*

| Clé | Texte |
|---|---|
| `ai.recoCourses.title` | Recommandé par l'IA pour votre objectif « {goal} » |
| `ai.recoCourses.link` | Matching expliqué |
| `ai.recoCourses.reason.demand` | Demandée dans {percent} % des offres que vous visez |
| `ai.recoCourses.reason.savedJobs` | Requise pour {count, plural, one {# de vos offres enregistrées} other {# de vos offres enregistrées}} |
| `ai.recoCourses.reason.gap` | Comble une compétence manquante pour « {jobTitle} » |
| `ai.recoCourses.reason.plan` | Étape de votre plan de progression |
| `ai.recoCourses.impact.text` | +{points} pts |
| `ai.recoCourses.impact.aria` | Ferait gagner environ {points} points de compatibilité |
| `ai.recoCourses.ignore` | Ne plus me proposer |
| `ai.recoCourses.why` | Nous comparons les compétences de votre profil à celles des offres que vous consultez et enregistrez. |

---

### Coach CV

*Proposer des améliorations précises, chacune justifiée, que le talent accepte ou non.*

| Clé | Texte |
|---|---|
| `ai.cvCoach.title` | Coach IA |
| `ai.cvCoach.analysis` | Analyse de votre CV |
| `ai.cvCoach.score.text` | {score} |
| `ai.cvCoach.score.label` | Score du CV · {level} |
| `ai.cvCoach.score.level.excellent` | Excellent |
| `ai.cvCoach.score.level.veryGood` | Très bon |
| `ai.cvCoach.score.level.good` | Bon |
| `ai.cvCoach.score.level.toImprove` | À améliorer |
| `ai.cvCoach.score.detail.text` | Lisibilité ATS {ats} · Impact {impact} · Mots-clés {keywords} |
| `ai.cvCoach.score.detail.short` | ATS {ats} · Impact {impact} · Mots-clés {keywords} |
| `ai.cvCoach.score.delta` | {delta, plural, one {+# depuis {since}} other {+# depuis {since}}} |
| `ai.cvCoach.score.explain` | Le score du CV mesure sa lisibilité par les logiciels de recrutement, l'impact de vos réalisations et la présence des mots-clés de votre métier visé. Il est différent du score de compatibilité avec une offre. |
| `ai.cvCoach.score.ats.text` | Lisibilité ATS |
| `ai.cvCoach.score.ats.desc` | Votre CV peut-il être lu correctement par un logiciel de recrutement ? |
| `ai.cvCoach.score.impact.text` | Impact |
| `ai.cvCoach.score.impact.desc` | Vos réalisations sont-elles concrètes et chiffrées ? |
| `ai.cvCoach.score.keywords.text` | Mots-clés |
| `ai.cvCoach.score.keywords.desc` | Les termes attendus pour le métier visé sont-ils présents ? |
| `ai.cvCoach.priority` | {count, plural, one {# suggestion prioritaire} other {# suggestions prioritaires}} |
| `ai.cvCoach.analyze` | Analyser mon CV |
| `ai.cvCoach.reanalyze` | Relancer l'analyse |
| `ai.cvCoach.cost` | {count, plural, one {Utilise # crédit IA} other {Utilise # crédits IA}} |
| `ai.cvCoach.suggestion.quantify.title` | Quantifiez vos résultats |
| `ai.cvCoach.suggestion.quantify.body` | « {before} » → « {after} » |
| `ai.cvCoach.suggestion.quantify.why` | Les recruteurs retiennent mieux les réalisations chiffrées. Remplacez le chiffre proposé par votre vrai chiffre. |
| `ai.cvCoach.suggestion.actionVerb.title` | Commencez par un verbe d'action |
| `ai.cvCoach.suggestion.actionVerb.why` | Un verbe d'action montre ce que vous avez fait, pas seulement ce dont vous étiez chargé. |
| `ai.cvCoach.suggestion.headlineSkill.title` | Ajoutez la compétence {skill} au titre |
| `ai.cvCoach.suggestion.headlineSkill.why` | Elle apparaît dans {percent} % des offres « {jobTitle} » publiées récemment sur Jumanly. |
| `ai.cvCoach.suggestion.headlineSkill.basis` | Basé sur {count, plural, one {# offre analysée} other {# offres analysées}}. |
| `ai.cvCoach.suggestion.summary.title` | Renforcez votre profil en tête de CV |
| `ai.cvCoach.suggestion.summary.why` | Les premières lignes sont souvent les seules lues. Dites ce que vous apportez en une phrase. |
| `ai.cvCoach.suggestion.length.title` | Raccourcissez votre CV |
| `ai.cvCoach.suggestion.length.why` | Votre CV fait {pages} pages. Visez une page en début de carrière, deux au maximum ensuite. |
| `ai.cvCoach.suggestion.typo.title` | Corrigez {count, plural, one {# faute} other {# fautes}} |
| `ai.cvCoach.suggestion.typo.why` | Une faute peut suffire à faire mauvaise impression. |
| `ai.cvCoach.suggestion.dates.title` | Précisez vos dates |
| `ai.cvCoach.suggestion.dates.why` | Indiquez le mois et l'année pour chaque expérience. |
| `ai.cvCoach.suggestion.sensitive.title` | Retirez une information personnelle non nécessaire |
| `ai.cvCoach.suggestion.sensitive.why` | Âge, situation familiale, religion ou état de santé n'ont pas leur place dans un CV et ne sont jamais utilisés par Jumanly. |
| `ai.cvCoach.suggestion.certificate.title` | Ajoutez votre attestation « {courseTitle} » |
| `ai.cvCoach.suggestion.certificate.why` | Elle prouve votre compétence en {skill} et peut être vérifiée par un recruteur. |
| `ai.cvCoach.keywords.title` | Mots-clés à ajouter |
| `ai.cvCoach.keywords.hint` | Ajoutez-les seulement si vous maîtrisez vraiment ces compétences. |
| `ai.cvCoach.keywords.add` | Ajouter {keyword} |
| `ai.cvCoach.allDone` | Toutes les suggestions ont été traitées. Votre CV est prêt. |
| `ai.cvCoach.empty` | Ajoutez un titre, un résumé ou une expérience à votre CV pour lancer l'analyse. |
| `ai.cvCoach.obsolete` | Ce texte a changé depuis l'analyse. Relancez l'analyse pour une suggestion à jour. |
| `ai.cvCoach.adviceOnly` | Conseil à appliquer vous-même, dans votre profil ou dans ce CV. |
| `ai.cvCoach.footer` | L'IA conseille, vous décidez. Rien n'est modifié sans votre accord. |
| `ai.cvCoach.locked.free` | Le coach IA est disponible avec {plan}. Votre CV reste modifiable et exportable gratuitement. |
| `ai.cvCoach.tips.free.title` | Conseils pour votre CV |
| `ai.cvCoach.tips.free.body` | Une page, des verbes d'action, des résultats chiffrés, vos compétences clés en haut. |

---

### Analyse structurée de CV (côté recruteur)

*Résumer un CV sous une forme comparable, en citant toujours la source.*

| Clé | Texte |
|---|---|
| `ai.cvAnalysis.title` | Analyse structurée du CV |
| `ai.cvAnalysis.locked` | Analyse structurée des CV · Disponible avec {plan} |
| `ai.cvAnalysis.run` | Analyser le CV |
| `ai.cvAnalysis.running` | Analyse du CV en cours… |
| `ai.cvAnalysis.summary` | En bref |
| `ai.cvAnalysis.experience.text` | Expériences |
| `ai.cvAnalysis.experience.total` | {years, plural, =0 {Moins d'un an} one {# an} other {# ans}} d'expérience au total, dont {relevant} en lien avec le poste |
| `ai.cvAnalysis.experience.item` | {role} · {company} · {period} |
| `ai.cvAnalysis.education` | Formation |
| `ai.cvAnalysis.skills.text` | Compétences repérées |
| `ai.cvAnalysis.skills.matched` | Correspondent à l'offre |
| `ai.cvAnalysis.skills.other` | Autres compétences |
| `ai.cvAnalysis.languages` | Langues |
| `ai.cvAnalysis.certificates` | Certificats et attestations |
| `ai.cvAnalysis.questions.text` | Points à éclaircir en entretien |
| `ai.cvAnalysis.questions.gap` | Période sans activité indiquée entre {from} et {to} : à aborder sans a priori, de nombreuses raisons sont légitimes. |
| `ai.cvAnalysis.questions.skill` | {skill} est cité sans exemple concret. |
| `ai.cvAnalysis.source` | Source : {section} du CV |
| `ai.cvAnalysis.confidence.low` | Lecture incertaine, vérifiez dans le CV d'origine |
| `ai.cvAnalysis.unreadable` | Ce fichier n'a pas pu être lu entièrement (scan ou mise en page complexe). Consultez le CV d'origine. |
| `ai.cvAnalysis.excluded` | L'analyse ignore volontairement : photo, âge, genre, origine, religion, situation familiale, état de santé. |
| `ai.cvAnalysis.disclaimer` | Suggestion générée par l'IA, vérifiez-la dans le CV d'origine avant toute décision. |
| `ai.cvAnalysis.reportError` | Signaler une erreur d'analyse |

### Analyse de CV à l'import (côté talent)

| Clé | Texte |
|---|---|
| `ai.cvImport.title` | Vérifiez les informations extraites |
| `ai.cvImport.body` | Nous avons lu votre CV. Validez, corrigez ou retirez chaque élément avant de l'ajouter à votre profil. |
| `ai.cvImport.found` | {count, plural, one {# élément trouvé} other {# éléments trouvés}} |
| `ai.cvImport.accept` | Valider |
| `ai.cvImport.edit` | Corriger |
| `ai.cvImport.reject` | Retirer |
| `ai.cvImport.acceptAll` | Tout valider |
| `ai.cvImport.done` | Profil mis à jour avec {count, plural, one {# élément} other {# éléments}}. |
| `ai.cvImport.noAi` | Extraction automatique du texte, sans crédit IA. |

---

### Consentement à l'usage de l'IA

*Informer clairement avant la première utilisation et permettre de revenir sur son choix.*

| Clé | Texte |
|---|---|
| `ai.consent.title` | Jumanly Intelligence et vos données |
| `ai.consent.intro` | Pour vous proposer des offres compatibles, des formations utiles et des conseils sur vos documents, Jumanly Intelligence analyse votre profil et les documents que vous lui confiez. |
| `ai.consent.uses.title` | Ce que l'IA utilise |
| `ai.consent.uses.body` | Vos compétences, expériences, formations, langues, préférences de travail et disponibilité. |
| `ai.consent.never.title` | Ce que l'IA n'utilise jamais |
| `ai.consent.never.body` | Votre genre, votre âge, votre photo, votre origine, votre religion, votre situation familiale et votre état de santé. |
| `ai.consent.control.title` | Vous gardez la main |
| `ai.consent.control.body` | Chaque suggestion est expliquée. Rien n'est modifié sans votre accord. Vous pouvez signaler une erreur et demander une révision par une personne. |
| `ai.consent.optional` | Ce choix est facultatif. Sans lui, vous pouvez toujours postuler et être recruté. |
| `ai.consent.accept` | J'accepte |
| `ai.consent.decline` | Pas maintenant |
| `ai.consent.learnMore` | Comment fonctionne le matching |
| `ai.consent.change` | Vous pouvez modifier ce choix dans Paramètres > Confidentialité. |
| `ai.consent.declined.state` | Vous n'avez pas activé Jumanly Intelligence. Activez-la pour recevoir des suggestions. |
| `ai.consent.declined.cta` | Activer |
| `ai.consent.recruiter.title` | Utiliser l'IA dans vos recrutements |
| `ai.consent.recruiter.body` | Le matching et l'analyse de CV vous aident à prioriser. Vous vous engagez à examiner chaque candidature et à ne jamais fonder une décision sur le seul score. |
| `ai.consent.recruiter.accept` | Je m'engage |

---

### Signalement d'erreur et révision humaine

*Permettre au talent de contester un score ou une analyse, et suivre la demande.*

| Clé | Texte |
|---|---|
| `ai.dispute.cta` | Signaler une erreur |
| `ai.dispute.title` | Signaler une erreur sur ce score |
| `ai.dispute.intro` | Si une information a été mal lue ou mal prise en compte, dites-le nous. Une personne de l'équipe Jumanly vérifiera le calcul. |
| `ai.dispute.what.text` | Qu'est-ce qui vous semble faux ? |
| `ai.dispute.what.skill` | Une compétence que j'ai n'est pas prise en compte |
| `ai.dispute.what.experience` | Mon expérience est mal comptée |
| `ai.dispute.what.education` | Mon diplôme est mal pris en compte |
| `ai.dispute.what.language` | Une langue est mal évaluée |
| `ai.dispute.what.location` | Ma localisation ou mon mode de travail est mal pris en compte |
| `ai.dispute.what.other` | Autre chose |
| `ai.dispute.details.text` | Expliquez en quelques mots |
| `ai.dispute.details.placeholder` | Ex. : J'ai deux ans d'expérience en SQL, indiqués dans mon stage chez {company}. |
| `ai.dispute.fixFirst.text` | Astuce : si une information manque dans votre profil, ajoutez-la. Le score est recalculé tout de suite. |
| `ai.dispute.fixFirst.cta` | Compléter mon profil |
| `ai.dispute.humanReview` | Demander une révision humaine |
| `ai.dispute.notifyRecruiter` | Informer le recruteur qu'une révision est demandée |
| `ai.dispute.submit` | Envoyer |
| `ai.dispute.sent` | Merci. Votre demande est enregistrée. Nous vous répondons par e-mail sous {days, plural, one {# jour ouvré} other {# jours ouvrés}}. |
| `ai.dispute.status.open` | Révision demandée |
| `ai.dispute.status.inReview` | En cours d'examen |
| `ai.dispute.status.corrected` | Score corrigé |
| `ai.dispute.status.confirmed` | Score confirmé après vérification |
| `ai.dispute.result.corrected` | Après vérification, votre score passe de {oldScore} % à {newScore} %. Le recruteur voit le score corrigé. |
| `ai.dispute.result.confirmed` | Après vérification, le score est confirmé. Explication : {reason} |
| `ai.dispute.applicationUnaffected` | Votre candidature reste examinée pendant la révision. |
| `ai.dispute.contact` | Une question ? assistant@jumanly.io |
| `ai.dispute.already` | Une révision est déjà en cours pour ce score. |
| `ai.dispute.invalid` | Choisissez ce qui vous semble faux et expliquez-le en quelques mots (10 caractères au moins). |
| `ai.dispute.noScore` | Aucun score à réviser pour cette offre. |
| `ai.report.suggestion.text` | Signaler cette suggestion |
| `ai.report.suggestion.reason.wrong` | Information inexacte |
| `ai.report.suggestion.reason.inappropriate` | Contenu inapproprié |
| `ai.report.suggestion.reason.biased` | Contenu discriminatoire ou biaisé |
| `ai.report.suggestion.reason.other` | Autre |
| `ai.report.suggestion.sent` | Merci, l'équipe Jumanly examinera cette suggestion. |

---

### Crédits IA

*Rendre le quota lisible et ne jamais bloquer la candidature. Le bouton « Ajouter des crédits » n'apparaît que si l'option de crédits supplémentaires est active.*

| Clé | Texte |
|---|---|
| `ai.credits.title` | Crédits IA |
| `ai.credits.usage` | {used} sur {quota} crédits utilisés |
| `ai.credits.remaining` | {count, plural, =0 {Aucun crédit restant} one {# crédit restant} other {# crédits restants}} |
| `ai.credits.renewal` | Renouvellement le {date, date, long} |
| `ai.credits.cost.text` | {count, plural, one {Cette action utilise # crédit} other {Cette action utilise # crédits}} |
| `ai.credits.cost.confirm` | Continuer ({count, plural, one {# crédit} other {# crédits}}) |
| `ai.credits.free` | Sans crédit |
| `ai.credits.whatUses.title` | Qu'est-ce qui utilise des crédits ? |
| `ai.credits.whatUses.body` | Les analyses et rédactions par l'IA : coach CV, lettres, correction, préparation LinkedIn, diagnostic personnalisé, analyse de CV côté recruteur. Le calcul de compatibilité et les candidatures n'en utilisent pas. |
| `ai.credits.warning80` | Vous avez utilisé {percent} % de vos crédits IA. Ils se renouvellent le {date, date, long}. |
| `ai.credits.reached.title` | Crédits IA épuisés pour ce mois |
| `ai.credits.reached.body` | Les fonctions IA sont en pause jusqu'au {date, date, long}. Tout le reste fonctionne, et vous pouvez toujours postuler gratuitement. |
| `ai.credits.reached.wait` | Attendre le renouvellement |
| `ai.credits.reached.buy` | Ajouter des crédits |
| `ai.credits.reached.upgrade` | Voir les forfaits |
| `ai.credits.none` | Les fonctions IA sont disponibles avec {plan}. |
| `ai.credits.org.text` | Crédits partagés par l'organisation |
| `ai.credits.org.reached` | L'organisation a utilisé tous ses crédits IA du mois. Contactez un administrateur de {org}. |

---

### `/comment-fonctionne-le-matching` · Page publique d'explication

*Expliquer simplement, à tous, comment le score est calculé et ce qu'il ne prend jamais en compte. Accessible aussi depuis le panneau « Comment fonctionne le matching » dans l'application.*

| Clé | Texte |
|---|---|
| `matchingPage.meta.title` | Comment fonctionne le matching · Jumanly |
| `matchingPage.meta.description` | Le score de compatibilité Jumanly expliqué simplement : les critères, les poids, ce que l'IA n'utilise jamais, et votre droit à une révision humaine. |
| `matchingPage.title` | Comment fonctionne le matching |
| `matchingPage.lead` | Sur Jumanly, l'IA recommande et l'humain décide. Voici, en langage simple, comment nous calculons la compatibilité entre un talent et une offre. |
| `matchingPage.panel.title` | Comment fonctionne le matching |
| `matchingPage.panel.readMore` | Lire l'explication complète |
| `matchingPage.s1.title` | 1. Un score de 0 à 100 |
| `matchingPage.s1.body` | Pour chaque offre, nous comparons les besoins du recruteur à votre profil. Le résultat est un score de 0 à 100. Plus il est élevé, plus votre profil correspond à ce que l'offre demande. |
| `matchingPage.s2.title` | 2. Huit critères, et seulement ceux-là |
| `matchingPage.s2.body` | Le score additionne huit critères liés au poste : |
| `matchingPage.s2.list.1` | les compétences requises ; |
| `matchingPage.s2.list.2` | les compétences souhaitées ; |
| `matchingPage.s2.list.3` | l'expérience ; |
| `matchingPage.s2.list.4` | la localisation et le télétravail ; |
| `matchingPage.s2.list.5` | le type de contrat et la disponibilité ; |
| `matchingPage.s2.list.6` | les langues ; |
| `matchingPage.s2.list.7` | la formation ou le diplôme ; |
| `matchingPage.s2.list.8` | la proximité entre votre profil et la description du poste. |
| `matchingPage.s3.title` | 3. Des poids choisis par le recruteur |
| `matchingPage.s3.body` | Chaque critère compte pour une part du score. Le recruteur peut donner plus de poids à ce qui compte vraiment pour le poste. Ces poids sont affichés dans l'explication du score. |
| `matchingPage.s4.title` | 4. Quatre niveaux faciles à lire |
| `matchingPage.s4.veryHigh` | 85 à 100 : Très compatible |
| `matchingPage.s4.high` | 70 à 84 : Compatible |
| `matchingPage.s4.partial` | 50 à 69 : Partiellement compatible |
| `matchingPage.s4.low` | Moins de 50 : Peu compatible |
| `matchingPage.s4.note` | Un score bas n'est pas un refus. Vous pouvez toujours postuler, gratuitement. |
| `matchingPage.s5.title` | 5. Un « Pourquoi ? » sur chaque score |
| `matchingPage.s5.body` | Chaque score s'accompagne d'une explication : les critères remplis, ceux qui le sont en partie, les compétences manquantes, et les formations Jumanly qui peuvent combler l'écart. |
| `matchingPage.s6.title` | 6. Ce que nous n'utilisons jamais |
| `matchingPage.s6.body` | Ces informations ne sont jamais prises en compte dans le score, ni dans aucune suggestion : |
| `matchingPage.s6.list.1` | le genre ; |
| `matchingPage.s6.list.2` | l'âge ; |
| `matchingPage.s6.list.3` | la photo ; |
| `matchingPage.s6.list.4` | l'origine ; |
| `matchingPage.s6.list.5` | la religion ; |
| `matchingPage.s6.list.6` | la situation familiale ; |
| `matchingPage.s6.list.7` | l'état de santé. |
| `matchingPage.s6.plan` | Votre forfait Jumanly n'est pas pris en compte non plus : un profil Free est recruté au même titre qu'un abonné. |
| `matchingPage.s7.title` | 7. L'IA ne rejette personne |
| `matchingPage.s7.body` | Le matching classe et explique. Il n'écarte aucune candidature. Si une offre fixe des critères éliminatoires (par exemple un diplôme exigé par la loi), ils sont affichés sur l'offre ; un candidat qui ne les remplit pas est signalé au recruteur, jamais rejeté automatiquement. Chaque décision est prise par une personne. |
| `matchingPage.s8.title` | 8. Vous pouvez contester |
| `matchingPage.s8.body` | Si votre score vous semble faux, touchez « Signaler une erreur » sous l'explication. Une personne de l'équipe Jumanly vérifie le calcul et vous répond par e-mail. |
| `matchingPage.s9.title` | 9. Vous gardez le contrôle |
| `matchingPage.s9.body` | Vous pouvez désactiver le calcul de compatibilité dans vos paramètres. Vous pourrez toujours postuler ; le recruteur verra votre candidature sans score. |
| `matchingPage.faq.title` | Questions fréquentes |
| `matchingPage.faq.q1` | Payer un forfait améliore-t-il mon score ? |
| `matchingPage.faq.a1` | Non. Le forfait n'entre pas dans le calcul. Les forfaits donnent accès à des outils pour progresser (formations, coach IA), ce qui peut vous aider à renforcer votre profil. |
| `matchingPage.faq.q2` | Comment améliorer mon score ? |
| `matchingPage.faq.a2` | Complétez votre profil, indiquez le niveau de vos compétences et suivez les formations proposées dans le « Pourquoi ? ». Les attestations Jumanly rendent vos compétences vérifiables. |
| `matchingPage.faq.q3` | Le recruteur voit-il mon score ? |
| `matchingPage.faq.a3` | Oui, avec la même explication que vous. Il lui sert à prioriser, pas à décider à votre place. |
| `matchingPage.faq.q4` | Qui peut me contacter grâce au matching ? |
| `matchingPage.faq.a4` | Seuls les recruteurs des offres auxquelles vous postulez, ou ceux dont vous acceptez la demande de mise en relation si votre profil est visible dans le vivier. |
| `matchingPage.contact` | Une question sur le matching ? Écrivez-nous à assistant@jumanly.io ou infojumanly@gmail.com. |
| `matchingPage.cta` | Créer mon profil gratuitement |
| `matchingPage.eyebrow` | Jumanly Intelligence |
| `matchingPage.nav.label` | Sommaire |
| `matchingPage.nav.s1` | 1. Un score de 0 à 100 |
| `matchingPage.nav.s2` | 2. Huit critères |
| `matchingPage.nav.s6` | 6. Ce que nous n'utilisons jamais |
| `matchingPage.nav.s8` | 8. Vous pouvez contester |
| `matchingPage.hero.imageAlt` | Exemple de score de compatibilité : 87 %, très compatible |
| `matchingPage.s3.example` | Exemple fictif · Analyste de données junior, Baobab Fintech |
| `matchingPage.s5.example` | Exemple fictif : Grâce Mbuyi, talent Pro à Kinshasa. |
| `matchingPage.s5.imageAlt` | Exemple d'explication d'un score de 87 %, avec les critères remplis, les compétences manquantes et une formation pour combler l'écart |
| `matchingPage.example.job` | Analyste de données junior |
| `matchingPage.example.company` | Baobab Fintech |
| `matchingPage.example.skill` | SQL |
| `matchingPage.example.language` | Français |
| `matchingPage.example.languageLevel` | C2 |
| `matchingPage.example.city` | Kinshasa |
| `matchingPage.example.workMode` | Hybride |
| `matchingPage.example.partialLanguage` | Anglais |
| `matchingPage.example.partialExpected` | B2 |
| `matchingPage.example.partialActual` | B1 |
| `matchingPage.example.missingSkill` | Power BI |
| `matchingPage.example.course` | Tableaux de bord avec Power BI |
| `matchingPage.faq.eyebrow` | FAQ |
| `matchingPage.finalCta.title` | Sur Jumanly, l'IA recommande et l'humain décide. |

Note d'intégration : la fiche « Pourquoi 87 % ? » (`matchingPage.example.*`) est un exemple manifestement fictif ; ses phrases viennent des modèles `match.why.talent.*`. Les poids affichés en section 3 sont lus en base (MatchingWeights, valeurs par défaut sinon).


---

## Partie 07 · Notifications et e-mails

Textes des notifications dans l'application (`/app/notifications`, cloche de la barre supérieure) et des modèles d'e-mails transactionnels.

Conventions :

- Variables : `{firstName}`, `{company}`, `{org}`, `{jobTitle}`, `{stage}`, `{date}`, `{time}`, `{plan}`, `{amount}`, `{currency}`, `{quota}`, `{used}`, `{percent}`, `{courseTitle}`, `{sponsorName}`, `{code}`, `{url}`, `{count}`.
- Chaque e-mail a : `subject` (objet), `preheader` (prévisualisation, 90 caractères maximum), paragraphes `p1`, `p2`…, `cta` (bouton) et, si utile, `ctaUrl` (variable de lien, non affichée).
- **E-mails essentiels** (sans lien de désabonnement) : vérification, réinitialisation, changement de statut, invitation à un entretien, demande de document, paiements, rappels de renouvellement, délai de grâce, retour au forfait gratuit, licences, sécurité. **Non essentiels** (avec lien de désabonnement) : nouveau message (récapitulatif), résumé hebdomadaire, alertes d'offres, nouveautés.
- Aucun numéro de téléphone, jamais. Contact uniquement par e-mail.
- Les modèles complets sont sous `mail.*`. la partie 02 contient des versions courtes (`email.*`) des e-mails d'authentification : les modèles `mail.*` de ce fichier font foi pour l'envoi ; les clés `email.*` du fichier 02 sont à supprimer ou à faire pointer vers celles-ci.
- Les seuils de quota (80 % et 100 %) reprennent les libellés `quota.name.*` de la partie 05 pour `{quotaName}`.
- Pas de majuscules criardes ni de points d'exclamation en série. Ton chaleureux, phrases courtes.

---

### Notifications · Centre de notifications

*Liste, filtres et actions communes.*

| Clé | Texte |
|---|---|
| `notifications.title` | Notifications |
| `notifications.bell.aria` | Notifications · {count, plural, =0 {aucune non lue} one {# non lue} other {# non lues}} |
| `notifications.bell.many` | 9+ |
| `notifications.tab.all` | Toutes |
| `notifications.tab.unread` | Non lues |
| `notifications.tab.applications` | Candidatures |
| `notifications.tab.messages` | Messages |
| `notifications.tab.learn` | Formations |
| `notifications.tab.account` | Compte |
| `notifications.tab.hire` | Recrutement |
| `notifications.markAllRead` | Tout marquer comme lu |
| `notifications.markRead` | Marquer comme lu |
| `notifications.markUnread` | Marquer comme non lu |
| `notifications.delete` | Supprimer |
| `notifications.settings` | Choisir mes notifications |
| `notifications.seeAll` | Voir toutes les notifications |
| `notifications.group.today` | Aujourd'hui |
| `notifications.group.yesterday` | Hier |
| `notifications.group.thisWeek` | Cette semaine |
| `notifications.group.earlier` | Plus tôt |
| `notifications.priority.important` | Important |
| `notifications.priority.forYou` | Pour vous |
| `notifications.priority.jumanly` | Jumanly |
| `notifications.preferences` | Préférences de notification |
| `notifications.back` | Retour à Pour moi |
| `notifications.empty.text` | Vous êtes à jour. Aucune notification. |
| `notifications.empty.unread` | Aucune notification non lue. |
| `notifications.loading` | Chargement des notifications… |
| `notifications.allRead` | Toutes les notifications sont marquées comme lues. |
| `notifications.panel.title` | Dernières notifications |
| `notifications.panel.seeAll` | Voir toutes les notifications |
| `notifications.panel.close` | Fermer les notifications |
| `notifications.tab.unreadCount` | Non lues ({count}) |
| `notifications.tabs` | Filtrer les notifications |
| `notifications.time.yesterday` | Hier à {time} |
| `notifications.action.interviewInvite` | Choisir un créneau |
| `notifications.action.newMessage` | Répondre |
| `notifications.action.documentRequest` | Déposer |
| `notifications.action.certificateIssued` | Voir l'attestation |
| `notifications.action.contactRequest` | Répondre à la demande |
| `notifications.item.newApplication` | Nouvelle candidature de {candidateName} pour « {jobTitle} » |
| `notifications.item.statusChange` | Votre candidature à « {jobTitle} » chez {company} est passée à l'étape « {stage} » |
| `notifications.item.notSelected` | {company} n'a pas retenu votre candidature à « {jobTitle} » |
| `notifications.item.newMessage` | Nouveau message de {senderName} · {jobTitle} |
| `notifications.item.documentRequest` | {company} vous demande un document : {documentName} |
| `notifications.item.orgInvite` | {inviterName} vous invite à rejoindre {org} |
| `notifications.item.jobApproved` | Votre offre « {jobTitle} » a été validée et publiée |
| `notifications.item.jobRejected` | Votre offre « {jobTitle} » a été refusée par la modération |
| `notifications.item.jobChangesRequested` | La modération demande une correction sur votre offre « {jobTitle} » |
| `notifications.item.reportClosed` | Votre signalement a été traité. Merci de nous aider à garder Jumanly sûr. |
| `notifications.item.moderationWarning` | Jumanly vous adresse un avertissement : un contenu que vous avez publié ne respecte pas les règles. |
| `notifications.item.certificateIssued` | Votre attestation « {courseTitle} » est prête |
| `notifications.item.matchReviewed` | Votre demande de révision du score pour « {jobTitle} » a été traitée |
| `notifications.item.paymentSucceeded` | Paiement reçu : {amount} USD pour {plan}. Merci ! |
| `notifications.item.paymentFailed` | Le paiement de votre forfait {plan} n'a pas abouti. Réessayez pour garder vos avantages. |
| `notifications.item.renewalDue` | Votre forfait {plan} arrive à échéance le {date}. Renouvelez pour garder vos avantages. |
| `notifications.item.grace` | Paiement en attente : votre forfait {plan} reste actif jusqu'au {date}. |
| `notifications.item.downgraded` | Votre compte est revenu au forfait {freePlan}. Toutes vos données sont conservées. |
| `notifications.item.upgraded` | Bienvenue dans {plan} ! Vos nouveaux avantages sont actifs. |
| `notifications.item.renewed` | Forfait {plan} renouvelé jusqu'au {date}. Merci ! |
| `notifications.item.mention` | {memberName} vous a mentionné dans une note sur {candidateName}. |
| `notifications.item.contactRequest` | {company} souhaite échanger avec vous. Vous décidez de répondre ou non. |
| `notifications.item.contactAccepted` | Un talent a accepté votre demande de mise en relation. |
| `notifications.item.contactDeclined` | Un talent a décliné votre demande de mise en relation. |
| `notifications.item.interviewInvite` | {company} vous invite à un entretien pour {jobTitle}. Choisissez votre créneau. |
| `notifications.item.interviewTeam` | Vous participez à l'entretien de {candidateName} pour {jobTitle}. |
| `notifications.item.interviewConfirmed` | {candidateName} a confirmé son entretien pour {jobTitle}. |
| `notifications.item.interviewReschedule` | {candidateName} propose d'autres créneaux pour {jobTitle}. |
| `notifications.item.interviewDeclined` | {candidateName} a décliné l'entretien pour {jobTitle}. |
| `notifications.item.interviewCanceled` | {company} a annulé l'entretien pour {jobTitle}. |
| `notifications.item.orgVerified` | {org} est maintenant une entreprise vérifiée. |
| `notifications.item.orgVerificationRejected` | La vérification de {org} n'a pas été acceptée. Consultez le motif. |
| `notifications.item.orgVerificationInfo` | Jumanly a besoin d'un complément pour vérifier {org}. |
| `notifications.item.orgSuspended` | {org} a été suspendue par Jumanly. Écrivez à assistant@jumanly.io pour en savoir plus. |
| `notifications.item.orgReactivated` | {org} est de nouveau active. |
| `notifications.item.jobUnavailable` | L'offre « {job} » de {org} n'est plus disponible. Votre candidature reste dans votre suivi. |
| `notifications.item.abnormalUsage` | Usage inhabituel : {count} profils consultés en une heure par un membre de {org}. Accès suspendu une heure. |
| `notifications.item.licenseActivated` | Votre licence {plan} offerte par {sponsorName} est active jusqu'au {date}. |
| `notifications.item.licenseOnHold` | Votre licence {licensePlan} offerte par {sponsorName} est en attente : votre forfait {plan} actuel est supérieur. Elle commencera le {date}. |
| `notifications.item.licenseExpiring` | Votre licence {plan} offerte par {sponsorName} se termine le {date}. |
| `notifications.item.licenseExpired` | Votre licence offerte par {sponsorName} est terminée. Vous êtes au forfait {freePlan}, vos données sont conservées. |
| `notifications.item.licensesLow` | {count, plural, =0 {Plus aucune licence disponible} one {Il reste # licence disponible} other {Il reste # licences disponibles}} dans le lot « {batchName} ». |
| `notifications.item.diagnosticReady` | Votre diagnostic de carrière est prêt : niveau {stage}. |
| `notifications.item.diagnosticReminder` | Cela fait 30 jours depuis votre diagnostic de carrière. Refaites-le pour voir vos progrès. |
| `notifications.item.unread` | Non lue |

### Notifications · Talent (par événement)

*Une phrase, une action. Le lien ouvre l'écran concerné.*

| Clé | Texte |
|---|---|
| `notif.talent.welcome` | Bienvenue sur Jumanly, {firstName}. Commencez par compléter votre profil. |
| `notif.talent.application.sent` | Votre candidature à « {jobTitle} » chez {company} a bien été envoyée. |
| `notif.talent.application.viewed` | {company} a consulté votre candidature à « {jobTitle} ». |
| `notif.talent.application.stage` | Votre candidature à « {jobTitle} » est passée à l'étape « {stage} ». |
| `notif.talent.application.shortlisted` | Bonne nouvelle : vous êtes présélectionné pour « {jobTitle} » chez {company}. |
| `notif.talent.application.test` | {company} vous propose un test pour « {jobTitle} ». |
| `notif.talent.application.offer` | {company} vous a fait une offre pour « {jobTitle} ». |
| `notif.talent.application.hired` | Félicitations ! {company} confirme votre recrutement pour « {jobTitle} ». |
| `notif.talent.application.notSelected` | {company} ne donne pas suite à votre candidature à « {jobTitle} ». Un message vous attend. |
| `notif.talent.application.jobClosed` | L'offre « {jobTitle} » a été fermée par {company}. |
| `notif.talent.interview.invited` | {company} vous invite à un entretien pour « {jobTitle} ». Choisissez un créneau. |
| `notif.talent.interview.confirmed` | Entretien confirmé avec {company} le {date, date, medium} à {time}. |
| `notif.talent.interview.rescheduled` | {company} propose un nouveau créneau pour votre entretien. |
| `notif.talent.interview.canceled` | {company} a annulé l'entretien du {date, date, medium}. |
| `notif.talent.interview.reminder24h` | Rappel : entretien avec {company} demain à {time}. |
| `notif.talent.interview.reminder1h` | Votre entretien avec {company} commence dans une heure. |
| `notif.talent.document.requested` | {company} vous demande : {documentName}, avant le {date, date, medium}. |
| `notif.talent.document.reminder` | Pensez à déposer « {documentName} » pour {company} avant demain. |
| `notif.talent.message.new` | Nouveau message de {senderName} ({company}). |
| `notif.talent.contact.requested` | {company} souhaite échanger avec vous. Vous décidez. |
| `notif.talent.contact.expiring` | La demande de mise en relation de {company} expire bientôt. |
| `notif.talent.jobs.matches` | {count, plural, one {# nouvelle offre très compatible avec votre profil.} other {# nouvelles offres très compatibles avec votre profil.}} |
| `notif.talent.jobs.alert` | {count, plural, one {# nouvelle offre pour votre alerte « {alertName} ».} other {# nouvelles offres pour votre alerte « {alertName} ».}} |
| `notif.talent.jobs.savedClosing` | L'offre enregistrée « {jobTitle} » se clôture dans {days, plural, one {# jour} other {# jours}}. |
| `notif.talent.learn.certificate` | Bravo ! Votre attestation « {courseTitle} » est prête. |
| `notif.talent.learn.answer` | Nouvelle réponse à votre question dans « {courseTitle} ». |
| `notif.talent.learn.newCourse` | Nouvelle formation incluse dans votre forfait : « {courseTitle} ». |
| `notif.talent.learn.inactive` | Vous avez fait {percent} % de « {courseTitle} ». On continue ? |
| `notif.talent.ai.disputeResolved` | Votre demande de révision de score pour « {jobTitle} » a été traitée. |
| `notif.talent.profile.incomplete` | Ajoutez vos compétences pour recevoir des offres compatibles. |
| `notif.talent.org.invited` | {inviterName} vous invite à rejoindre {org} sur Jumanly. |

### Notifications · Recruteur et organisation (par événement)

| Clé | Texte |
|---|---|
| `notif.hire.application.new` | Nouvelle candidature à « {jobTitle} » : {candidateName}. |
| `notif.hire.application.newBatch` | {count, plural, one {# nouvelle candidature} other {# nouvelles candidatures}} à « {jobTitle} ». |
| `notif.hire.application.withdrawn` | {candidateName} a retiré sa candidature à « {jobTitle} ». |
| `notif.hire.application.waiting` | {count, plural, one {# candidat attend votre réponse depuis plus de {days} jours.} other {# candidats attendent votre réponse depuis plus de {days} jours.}} |
| `notif.hire.interview.accepted` | {candidateName} a accepté l'entretien du {date, date, medium} à {time}. |
| `notif.hire.interview.reschedule` | {candidateName} propose un autre créneau. |
| `notif.hire.interview.declined` | {candidateName} a décliné l'entretien. |
| `notif.hire.interview.reminder` | Entretien avec {candidateName} dans une heure. |
| `notif.hire.document.received` | {candidateName} a déposé « {documentName} ». |
| `notif.hire.message.new` | Nouveau message de {candidateName}. |
| `notif.hire.contact.accepted` | {candidateName} a accepté votre demande de mise en relation. |
| `notif.hire.contact.declined` | Un talent a décliné votre demande de mise en relation. |
| `notif.hire.scorecard.requested` | {memberName} vous demande d'évaluer {candidateName}. |
| `notif.hire.mention` | {memberName} vous a mentionné dans une note sur {candidateName}. |
| `notif.hire.job.assigned` | {memberName} vous a attribué l'offre « {jobTitle} ». |
| `notif.hire.job.published` | Votre offre « {jobTitle} » est en ligne. |
| `notif.hire.job.rejected` | Votre offre « {jobTitle} » n'a pas été validée par la modération. Voir le motif. |
| `notif.hire.job.expiring` | L'offre « {jobTitle} » expire dans {days, plural, one {# jour} other {# jours}}. |
| `notif.hire.score.disputed` | {candidateName} a demandé une révision humaine de son score pour « {jobTitle} ». |
| `notif.org.member.joined` | {memberName} a rejoint {org}. |
| `notif.org.verification.approved` | {org} est désormais une entreprise vérifiée. |
| `notif.org.verification.rejected` | La vérification de {org} n'a pas abouti. Voir le motif. |
| `notif.org.seats.full` | Tous les sièges de {org} sont occupés. |

### Notifications · Compte, quotas et abonnement (tous profils)

| Clé | Texte |
|---|---|
| `notif.account.newDevice` | Nouvelle connexion à votre compte depuis {device} ({city}). Ce n'était pas vous ? Changez votre mot de passe. |
| `notif.account.passwordChanged` | Votre mot de passe a été modifié. |
| `notif.account.emailChanged` | Votre adresse e-mail a été modifiée. |
| `notif.quota.80` | Vous avez utilisé {percent} % de votre quota « {quotaName} ». Renouvellement le {date, date, medium}. |
| `notif.quota.100.text` | Quota « {quotaName} » atteint. La fonction est en pause jusqu'au {date, date, medium}. |
| `notif.quota.100.applyStillFree` | Vos candidatures restent gratuites et illimitées. |
| `notif.billing.paymentSuccess` | Paiement reçu : {amount} {currency} pour {plan}. Merci ! |
| `notif.billing.paymentFailed` | Le paiement de votre forfait {plan} n'a pas abouti. Réessayez pour garder vos avantages. |
| `notif.billing.renewal.j7` | Votre forfait {plan} arrive à échéance dans 7 jours. |
| `notif.billing.renewal.j3` | Votre forfait {plan} arrive à échéance dans 3 jours. |
| `notif.billing.renewal.j0` | Votre forfait {plan} arrive à échéance aujourd'hui. |
| `notif.billing.grace` | Paiement en attente : votre forfait {plan} reste actif jusqu'au {date, date, medium}. |
| `notif.billing.downgraded` | Votre compte est revenu au forfait {freePlan}. Toutes vos données sont conservées. |
| `notif.billing.upgraded` | Bienvenue dans {plan} ! Vos nouveaux avantages sont actifs. |
| `notif.billing.canceled` | Résiliation enregistrée. {plan} reste actif jusqu'au {date, date, medium}. |
| `notif.license.activated` | Votre licence {plan} offerte par {sponsorName} est active jusqu'au {date, date, medium}. |
| `notif.license.expiring` | Votre licence {plan} offerte par {sponsorName} se termine dans {days, plural, one {# jour} other {# jours}}. |
| `notif.license.expired` | Votre licence offerte par {sponsorName} est terminée. Vous êtes au forfait {freePlan}, vos données sont conservées. |
| `notif.license.onHold` | Votre licence {licensePlan} est en attente : votre forfait {plan} actuel est supérieur. Elle s'activera si vous quittez ce forfait. |
| `notif.partner.licensesLow` | {count, plural, one {Il reste # licence disponible} other {Il reste # licences disponibles}} dans le lot « {batchName} ». |
| `notif.partner.batchExpiring` | Le lot « {batchName} » expire le {date, date, medium}. |
| `notif.partner.reportReady` | Votre rapport d'impact de {period} est prêt. |

---

### E-mails · Éléments communs

*En-tête, pied de page et mentions présents dans tous les e-mails.*

| Clé | Texte |
|---|---|
| `mail.common.greeting.text` | Bonjour {firstName}, |
| `mail.common.greeting.noName` | Bonjour, |
| `mail.common.signature` | L'équipe Jumanly |
| `mail.common.footer.tagline` | Learn. Grow. Connect. |
| `mail.common.footer.developedBy` | Une plateforme développée par The Growth Lab |
| `mail.common.footer.contact` | Une question ? Écrivez-nous : assistant@jumanly.io · infojumanly@gmail.com |
| `mail.common.footer.reason` | Vous recevez cet e-mail parce que vous avez un compte Jumanly avec l'adresse {email}. |
| `mail.common.footer.unsubscribe` | Se désabonner de ces e-mails |
| `mail.common.footer.preferences` | Gérer mes préférences d'e-mails |
| `mail.common.footer.essential` | Cet e-mail concerne la sécurité ou le fonctionnement de votre compte. Il ne peut pas être désactivé. |
| `mail.common.footer.legal` | Confidentialité · Conditions d'utilisation |
| `mail.common.buttonFallback` | Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur : {url} |
| `mail.common.safety` | Jumanly ne vous demandera jamais votre mot de passe ni un paiement pour postuler. |
| `mail.common.notYou` | Vous n'êtes pas à l'origine de cette demande ? Ignorez cet e-mail, votre compte reste protégé. |

### E-mail · Bienvenue talent

| Clé | Texte |
|---|---|
| `mail.welcome.talent.subject` | Bienvenue sur Jumanly, {firstName} |
| `mail.welcome.talent.preheader` | Votre parcours commence : se former, enrichir son profil, candidater, être recruté. |
| `mail.welcome.talent.p1` | Bienvenue sur Jumanly. Votre compte {plan} est prêt. |
| `mail.welcome.talent.p2` | Pour bien démarrer : complétez votre profil, importez ou créez votre CV, puis explorez les offres compatibles avec vous. |
| `mail.welcome.talent.p3` | Les candidatures sont toujours gratuites, et votre profil est vu par les recruteurs au même titre que tous les autres. |
| `mail.welcome.talent.cta` | Compléter mon profil |

### E-mail · Bienvenue recruteur (RH)

| Clé | Texte |
|---|---|
| `mail.welcome.recruiter.subject` | Votre espace recruteur Jumanly est prêt |
| `mail.welcome.recruiter.preheader` | Publiez votre première offre en quelques minutes. |
| `mail.welcome.recruiter.p1` | Bienvenue sur Jumanly. Votre espace {org} est actif avec le forfait {plan}. |
| `mail.welcome.recruiter.p2` | Publiez votre première offre : précisez les compétences requises et souhaitées, et Jumanly classera les candidatures en expliquant chaque score. |
| `mail.welcome.recruiter.p3` | L'IA classe et explique, vous décidez. |
| `mail.welcome.recruiter.cta` | Créer ma première offre |

### E-mail · Bienvenue entreprise

| Clé | Texte |
|---|---|
| `mail.welcome.company.subject` | {org} est sur Jumanly |
| `mail.welcome.company.preheader` | Invitez votre équipe et publiez vos offres. |
| `mail.welcome.company.p1` | Bienvenue sur Jumanly. L'espace de recrutement de {org} est actif avec le forfait {plan}. |
| `mail.welcome.company.p2` | Trois étapes pour démarrer : complétez le profil de l'organisation, invitez vos collègues, publiez votre première offre. |
| `mail.welcome.company.p3` | Pensez à demander la vérification de votre organisation : le badge « Entreprise vérifiée » rassure les candidats. |
| `mail.welcome.company.cta` | Configurer mon organisation |

### E-mail · Bienvenue partenaire

| Clé | Texte |
|---|---|
| `mail.welcome.partner.subject` | Votre espace Jumanly Partners est ouvert |
| `mail.welcome.partner.preheader` | Distribuez vos licences et suivez leur impact. |
| `mail.welcome.partner.p1` | Bienvenue dans Jumanly Partners. L'espace de {org} est prêt. |
| `mail.welcome.partner.p2` | Vous pouvez distribuer vos licences par code, par lien d'invitation ou par import d'une liste d'e-mails, puis suivre l'usage et l'impact dans des rapports agrégés. |
| `mail.welcome.partner.p3` | Aucune donnée nominative des bénéficiaires (CV, messages, informations personnelles) ne vous est transmise. |
| `mail.welcome.partner.cta` | Ouvrir mon espace partenaire |

### E-mail · Code de vérification

| Clé | Texte |
|---|---|
| `mail.verifyCode.subject` | Votre code Jumanly : {code} |
| `mail.verifyCode.preheader` | Ce code est valable {minutes} minutes. |
| `mail.verifyCode.p1` | Voici votre code de vérification : |
| `mail.verifyCode.code` | {code} |
| `mail.verifyCode.p2` | Il est valable {minutes} minutes. Ne le communiquez à personne : l'équipe Jumanly ne vous le demandera jamais. |
| `mail.verifyCode.p3` | Vous n'êtes pas à l'origine de cette demande ? Ignorez cet e-mail. |

### E-mail · Lien de connexion (lien magique)

| Clé | Texte |
|---|---|
| `mail.magicLink.subject` | Votre lien de connexion à Jumanly |
| `mail.magicLink.preheader` | Connectez-vous en un clic. Lien valable {minutes} minutes. |
| `mail.magicLink.p1` | Touchez le bouton ci-dessous pour vous connecter. Le lien est valable {minutes} minutes et ne fonctionne qu'une fois. |
| `mail.magicLink.cta` | Me connecter |

### E-mail · Réinitialisation du mot de passe

| Clé | Texte |
|---|---|
| `mail.resetPassword.subject` | Réinitialiser votre mot de passe Jumanly |
| `mail.resetPassword.preheader` | Ce lien est valable {minutes} minutes. |
| `mail.resetPassword.p1` | Vous avez demandé à réinitialiser votre mot de passe. Touchez le bouton ci-dessous pour en choisir un nouveau. |
| `mail.resetPassword.p2` | Ce lien est valable {minutes} minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe actuel reste valable. |
| `mail.resetPassword.cta` | Choisir un nouveau mot de passe |
| `mail.passwordChanged.subject` | Votre mot de passe Jumanly a été modifié |
| `mail.passwordChanged.preheader` | Si ce n'était pas vous, réagissez maintenant. |
| `mail.passwordChanged.p1` | Le mot de passe de votre compte a été modifié le {date, date, long} à {time}. |
| `mail.passwordChanged.p2` | Si vous n'êtes pas à l'origine de ce changement, réinitialisez votre mot de passe et écrivez-nous à assistant@jumanly.io. |
| `mail.passwordChanged.cta` | Sécuriser mon compte |

### E-mail · Candidature envoyée (talent)

| Clé | Texte |
|---|---|
| `mail.applicationSent.subject` | Candidature envoyée : {jobTitle} chez {company} |
| `mail.applicationSent.preheader` | Vous serez prévenu à chaque changement d'étape. |
| `mail.applicationSent.p1` | Votre candidature au poste de {jobTitle} chez {company} a bien été envoyée le {date, date, long}. |
| `mail.applicationSent.p2` | Vous serez prévenu à chaque étape. En attendant, préparez-vous : relisez l'offre et entraînez-vous à présenter votre parcours en deux minutes. |
| `mail.applicationSent.cta` | Suivre ma candidature |

### E-mail · Changement de statut de candidature (talent)

| Clé | Texte |
|---|---|
| `mail.statusChange.subject` | Votre candidature chez {company} avance |
| `mail.statusChange.preheader` | Nouvelle étape : {stage}. |
| `mail.statusChange.p1` | Votre candidature au poste de {jobTitle} chez {company} est passée à l'étape « {stage} ». |
| `mail.statusChange.p2.shortlisted` | Bonne nouvelle : votre profil a retenu l'attention du recruteur. |
| `mail.statusChange.p2.test` | Le recruteur vous propose un test. Les détails sont dans votre messagerie. |
| `mail.statusChange.p2.offer` | {company} vous fait une offre. Prenez le temps de la lire et d'en discuter avec le recruteur. |
| `mail.statusChange.p2.hired` | Félicitations ! Nous vous souhaitons une très belle réussite dans ce nouveau poste. |
| `mail.statusChange.cta` | Voir ma candidature |
| `mail.notSelected.subject` | Votre candidature chez {company} |
| `mail.notSelected.preheader` | Un message de {company} vous attend. |
| `mail.notSelected.p1` | {company} a examiné votre candidature au poste de {jobTitle} et n'y donne pas suite. |
| `mail.notSelected.message` | Message du recruteur : « {message} » |
| `mail.notSelected.p2` | Une réponse négative ne dit rien de votre valeur. D'autres offres sur Jumanly correspondent à votre profil. |
| `mail.notSelected.cta` | Voir les offres compatibles |

### E-mail · Invitation à un entretien (talent)

| Clé | Texte |
|---|---|
| `mail.interviewInvite.subject` | {company} vous invite à un entretien |
| `mail.interviewInvite.preheader` | Pour le poste de {jobTitle}. Choisissez votre créneau. |
| `mail.interviewInvite.p1` | {company} souhaite vous rencontrer pour le poste de {jobTitle}. |
| `mail.interviewInvite.details` | {mode} · {minutes} min |
| `mail.interviewInvite.slots` | Créneaux proposés : {slots} (heure de {timezone}) |
| `mail.interviewInvite.p2` | Choisissez le créneau qui vous convient ou proposez-en un autre. |
| `mail.interviewInvite.cta` | Répondre à l'invitation |
| `mail.interviewConfirmed.subject` | Entretien confirmé avec {company} le {date, date, medium} |
| `mail.interviewConfirmed.preheader` | {time}, heure de {timezone}. |
| `mail.interviewConfirmed.p1` | Votre entretien pour le poste de {jobTitle} est confirmé le {date, date, full} à {time} (heure de {timezone}). |
| `mail.interviewConfirmed.p2` | Conseil : relisez l'offre, préparez deux exemples concrets de réalisations et une question à poser. |
| `mail.interviewConfirmed.cta` | Voir les détails |
| `mail.interviewReminder.subject` | Rappel : entretien demain avec {company} |
| `mail.interviewReminder.preheader` | {date, date, medium} à {time}. |
| `mail.interviewReminder.p1` | Votre entretien pour le poste de {jobTitle} a lieu demain à {time} (heure de {timezone}). |
| `mail.interviewReminder.cta` | Voir les détails |

### E-mail · Demande de document (talent)

| Clé | Texte |
|---|---|
| `mail.documentRequest.subject` | {company} vous demande un document |
| `mail.documentRequest.preheader` | {documentName}, à déposer avant le {date, date, medium}. |
| `mail.documentRequest.p1` | Pour votre candidature au poste de {jobTitle}, {company} vous demande : {documentName}. |
| `mail.documentRequest.p2` | À déposer avant le {date, date, long}, directement dans votre messagerie Jumanly. Ne l'envoyez pas par un autre canal. |
| `mail.documentRequest.cta` | Déposer le document |

### E-mail · Nouveau message (récapitulatif, non essentiel)

| Clé | Texte |
|---|---|
| `mail.newMessage.subject` | {count, plural, one {Nouveau message de {senderName}} other {# nouveaux messages sur Jumanly}} |
| `mail.newMessage.preheader` | {preview} |
| `mail.newMessage.p1` | {senderName} ({company}) vous a écrit au sujet de « {jobTitle} ». |
| `mail.newMessage.p2` | Pour protéger vos échanges, le contenu des messages n'est lisible que sur Jumanly. |
| `mail.newMessage.cta` | Lire et répondre |

### E-mail · Mise en relation demandée (talent)

| Clé | Texte |
|---|---|
| `mail.contactRequested.subject` | {company} souhaite échanger avec vous |
| `mail.contactRequested.preheader` | Vous décidez de répondre ou non. |
| `mail.contactRequested.p1` | Un recruteur de {company} a trouvé votre profil dans le vivier de talents Jumanly et souhaite échanger avec vous. |
| `mail.contactRequested.p2` | Aucun échange n'est possible sans votre accord. Si votre profil est anonyme, votre nom ne sera révélé que si vous acceptez. |
| `mail.contactRequested.p3` | Sans réponse, la demande expire le {date, date, long}. |
| `mail.contactRequested.cta` | Voir la demande |

### E-mail · Mise en relation acceptée (recruteur)

| Clé | Texte |
|---|---|
| `mail.contactAccepted.subject` | {candidateName} a accepté votre demande |
| `mail.contactAccepted.preheader` | Vous pouvez maintenant échanger sur Jumanly. |
| `mail.contactAccepted.p1` | {candidateName} a accepté votre demande de mise en relation. La conversation est ouverte dans Connect. |
| `mail.contactAccepted.p2` | Un premier message clair et personnalisé fait bonne impression. |
| `mail.contactAccepted.cta` | Écrire à {candidateName} |
| `mail.orgVerified.subject` | {org} est une entreprise vérifiée |
| `mail.orgVerified.preheader` | Le badge apparaît désormais sur vos offres. |
| `mail.orgVerified.p1` | Bonne nouvelle : Jumanly a vérifié {org}. |
| `mail.orgVerified.p2` | Le badge « Entreprise vérifiée » s'affiche sur vos offres et votre page publique. |
| `mail.orgVerified.cta` | Voir mon organisation |
| `mail.orgVerificationRejected.subject` | Vérification de {org} : un complément est nécessaire |
| `mail.orgVerificationRejected.preheader` | Consultez le motif et complétez votre demande. |
| `mail.orgVerificationRejected.p1` | Nous n'avons pas pu vérifier {org}. Motif : {reason} |
| `mail.orgVerificationRejected.p2` | Vous pouvez compléter et renvoyer votre demande à tout moment. |
| `mail.orgVerificationRejected.cta` | Compléter la demande |
| `mail.orgVerificationInfo.subject` | Vérification de {org} : un complément est demandé |
| `mail.orgVerificationInfo.preheader` | Il nous manque un élément pour terminer la vérification. |
| `mail.orgVerificationInfo.p1` | Pour vérifier {org}, nous avons besoin d'un complément : {reason} |
| `mail.orgVerificationInfo.p2` | Ajoutez-le depuis l'onglet Vérification de votre organisation : la demande reprend dès votre réponse. |
| `mail.orgVerificationInfo.cta` | Compléter la demande |
| `mail.orgSuspended.subject` | {org} est suspendue |
| `mail.orgSuspended.preheader` | Vos offres sont retirées et l'espace recrutement est fermé. |
| `mail.orgSuspended.p1` | Jumanly a suspendu {org}. Motif : {reason} |
| `mail.orgSuspended.p2` | Vos offres ne sont plus visibles et l'espace recrutement est fermé. Pour en parler, écrivez à assistant@jumanly.io. |
| `mail.orgSuspended.cta` | Ouvrir Jumanly |
| `mail.orgReactivated.subject` | {org} est de nouveau active |
| `mail.orgReactivated.preheader` | Votre espace recrutement est rouvert. |
| `mail.orgReactivated.p1` | Jumanly a réactivé {org}. |
| `mail.orgReactivated.p2` | Les offres fermées par la suspension sont republiées si leur date limite n'est pas passée. |
| `mail.orgReactivated.cta` | Ouvrir mon espace recrutement |
| `mail.moderationWarning.subject` | Avertissement de la modération Jumanly |
| `mail.moderationWarning.preheader` | Un contenu que vous avez publié ne respecte pas les règles de Jumanly. |
| `mail.moderationWarning.p1` | Après un signalement, la modération de Jumanly a constaté qu'un contenu que vous avez publié ne respecte pas les règles de la plateforme. Motif : {reason} |
| `mail.moderationWarning.p2` | Merci d'en tenir compte : en cas de nouvel écart, votre compte peut être suspendu. Pour toute question, écrivez à assistant@jumanly.io. |
| `mail.moderationWarning.cta` | Ouvrir Jumanly |
| `mail.reportClosed.subject` | Votre signalement a été traité |
| `mail.reportClosed.preheader` | Merci de nous aider à garder Jumanly sûr. |
| `mail.reportClosed.p1` | La modération de Jumanly a examiné votre signalement et l'a clôturé : {decision}. |
| `mail.reportClosed.p2` | Par respect pour chacun, nous ne détaillons pas les mesures prises envers un autre compte. Merci de votre vigilance. |
| `mail.reportClosed.cta` | Ouvrir Jumanly |
| `mail.reportClosed.decision.dismiss` | aucune infraction aux règles n'a été constatée |
| `mail.reportClosed.decision.hide` | le contenu a été retiré |
| `mail.reportClosed.decision.warn` | son auteur a reçu un avertissement |

### E-mail · Nouvelle candidature (recruteur)

| Clé | Texte |
|---|---|
| `mail.newApplication.subject` | Nouvelle candidature : {jobTitle} |
| `mail.newApplication.preheader` | {candidateName} a postulé. |
| `mail.newApplication.p1.text` | {candidateName} a postulé à votre offre « {jobTitle} ». |
| `mail.newApplication.p1.batch` | {count, plural, one {# nouvelle candidature} other {# nouvelles candidatures}} pour « {jobTitle} » depuis hier. |
| `mail.newApplication.p2` | Une réponse rapide, même brève, améliore l'image de {org} auprès des candidats. |
| `mail.newApplication.cta` | Voir la candidature |

### E-mail · Invitation à rejoindre une organisation

| Clé | Texte |
|---|---|
| `mail.orgInvite.subject` | {inviterName} vous invite à rejoindre {org} sur Jumanly |
| `mail.orgInvite.preheader` | Rôle proposé : {role}. |
| `mail.orgInvite.p1` | {inviterName} vous invite à rejoindre l'espace de recrutement de {org} sur Jumanly, en tant que {role}. |
| `mail.orgInvite.message` | Son message : « {message} » |
| `mail.orgInvite.p2` | Si vous avez déjà un compte Jumanly, l'organisation s'ajoutera à votre sélecteur d'espace. Votre espace personnel reste séparé. |
| `mail.orgInvite.p3` | Cette invitation expire le {date, date, long}. |
| `mail.orgInvite.cta` | Rejoindre {org} |
| `mail.partnerInvite.subject` | Votre espace Jumanly Partners pour {org} |
| `mail.partnerInvite.preheader` | Distribuez les licences financées et suivez leur impact. |
| `mail.partnerInvite.p1` | Jumanly vous invite à gérer l'espace partenaire de {org} : distribution des licences financées et rapports d'impact agrégés. |
| `mail.partnerInvite.p2` | Vous ne verrez jamais les données personnelles des bénéficiaires : uniquement des chiffres agrégés. |
| `mail.partnerInvite.cta` | Ouvrir l'espace partenaire |

### E-mail · Attestation obtenue

| Clé | Texte |
|---|---|
| `mail.certificate.subject` | Bravo {firstName}, votre attestation est prête |
| `mail.certificate.preheader` | « {courseTitle} » est validée. |
| `mail.certificate.p1` | Vous avez terminé la formation « {courseTitle} ». Félicitations pour cet effort. |
| `mail.certificate.p2` | Votre attestation est ajoutée à votre profil. Elle dispose d'un lien de vérification public que vous pouvez partager avec un recruteur : {verifyUrl} |
| `mail.certificate.cta` | Télécharger mon attestation |

### E-mail · Quota à 80 %

| Clé | Texte |
|---|---|
| `mail.quota80.subject` | Vous avez utilisé {percent} % de votre quota {quotaName} |
| `mail.quota80.preheader` | Renouvellement le {date, date, medium}. |
| `mail.quota80.p1` | Vous avez utilisé {used} sur {quota} de votre quota « {quotaName} » ce mois-ci. |
| `mail.quota80.p2` | Il se renouvelle le {date, date, long}. Si vous en avez besoin de plus, vous pouvez changer de forfait à tout moment. |
| `mail.quota80.cta` | Voir mes quotas |

### E-mail · Quota à 100 %

| Clé | Texte |
|---|---|
| `mail.quota100.subject` | Quota {quotaName} atteint |
| `mail.quota100.preheader` | La fonction est en pause jusqu'au {date, date, medium}. |
| `mail.quota100.p1` | Vous avez utilisé tout votre quota « {quotaName} » ce mois-ci. Cette fonction est en pause jusqu'au {date, date, long}. |
| `mail.quota100.p2` | Vous pouvez attendre le renouvellement, ajouter une option si elle est proposée, ou passer à un forfait supérieur. |
| `mail.quota100.p3.talent` | Rassurez-vous : vos candidatures restent gratuites et illimitées. |
| `mail.quota100.p3.recruiter` | Ces limites protègent les données personnelles des talents contre toute extraction massive. |
| `mail.quota100.cta` | Voir les options |

### E-mail · Paiement réussi

| Clé | Texte |
|---|---|
| `mail.paymentSuccess.subject` | Paiement reçu : {plan} |
| `mail.paymentSuccess.preheader` | {amount} {currency}, période jusqu'au {date, date, medium}. |
| `mail.paymentSuccess.p1` | Nous avons bien reçu votre paiement de {amount} {currency} pour le forfait {plan}. |
| `mail.paymentSuccess.p2` | Période couverte : du {startDate, date, long} au {endDate, date, long}. Moyen de paiement : {method}. |
| `mail.paymentSuccess.p3` | Votre facture est disponible dans votre espace. |
| `mail.paymentSuccess.cta` | Télécharger la facture |

### E-mail · Paiement échoué

| Clé | Texte |
|---|---|
| `mail.paymentFailed.subject` | Votre paiement n'a pas abouti |
| `mail.paymentFailed.preheader` | Réessayez pour garder votre forfait {plan}. |
| `mail.paymentFailed.p1` | Le paiement de {amount} {currency} pour votre forfait {plan} n'a pas abouti. |
| `mail.paymentFailed.p2` | Raisons fréquentes : solde insuffisant, délai de confirmation Mobile Money dépassé, carte refusée. Aucun montant n'a été prélevé. |
| `mail.paymentFailed.p3` | Votre forfait reste actif jusqu'au {date, date, long}. |
| `mail.paymentFailed.cta` | Réessayer le paiement |

### E-mails · Rappels de renouvellement J-7, J-3, J-0

| Clé | Texte |
|---|---|
| `mail.renewal.j7.subject` | Votre forfait {plan} se termine dans 7 jours |
| `mail.renewal.j7.preheader` | Renouvelez avant le {date, date, medium} pour ne rien interrompre. |
| `mail.renewal.j7.p1` | Votre forfait {plan} est prépayé jusqu'au {date, date, long}. |
| `mail.renewal.j7.p2` | Pour continuer sans interruption, renouvelez-le par Mobile Money ou par carte. |
| `mail.renewal.j7.cta` | Renouveler mon forfait |
| `mail.renewal.j3.subject` | Plus que 3 jours pour renouveler {plan} |
| `mail.renewal.j3.preheader` | Échéance le {date, date, medium}. |
| `mail.renewal.j3.p1` | Votre forfait {plan} arrive à échéance le {date, date, long}. |
| `mail.renewal.j3.p2` | Renouvelez maintenant pour garder vos avantages et vos quotas. |
| `mail.renewal.j3.cta` | Renouveler mon forfait |
| `mail.renewal.j0.subject` | Votre forfait {plan} arrive à échéance aujourd'hui |
| `mail.renewal.j0.preheader` | Renouvelez aujourd'hui pour éviter toute interruption. |
| `mail.renewal.j0.p1` | Votre forfait {plan} arrive à échéance aujourd'hui. |
| `mail.renewal.j0.p2` | Sans renouvellement, vous bénéficiez d'un délai de grâce de {graceDays, plural, one {# jour} other {# jours}}, puis votre compte revient au forfait {freePlan}. Vos données sont conservées. |
| `mail.renewal.j0.cta` | Renouveler maintenant |

### E-mail · Délai de grâce

| Clé | Texte |
|---|---|
| `mail.grace.subject` | Votre forfait {plan} est en délai de grâce |
| `mail.grace.preheader` | Il reste actif jusqu'au {date, date, medium}. |
| `mail.grace.p1` | Nous n'avons pas reçu le renouvellement de votre forfait {plan}. Il reste actif jusqu'au {date, date, long}. |
| `mail.grace.p2` | Après cette date, votre compte reviendra au forfait {freePlan}. Vous ne perdrez aucune donnée. |
| `mail.grace.cta` | Renouveler mon forfait |

### E-mail · Retour au forfait gratuit

| Clé | Texte |
|---|---|
| `mail.downgraded.subject` | Votre compte est passé au forfait {freePlan} |
| `mail.downgraded.preheader` | Vos données sont conservées. Vous pouvez revenir à {plan} à tout moment. |
| `mail.downgraded.p1` | Faute de renouvellement, votre compte est revenu au forfait {freePlan}. |
| `mail.downgraded.p2` | Vos données sont toutes conservées : profil, CV, documents, attestations, candidatures. Les fonctions de {plan} sont en pause. |
| `mail.downgraded.p3.talent` | Vous pouvez toujours postuler gratuitement et être recruté au même titre que tous. |
| `mail.downgraded.p3.org` | Si votre organisation dépasse les limites de {freePlan} (offres actives, utilisateurs), les éléments en trop sont mis en pause, jamais supprimés. Un propriétaire peut choisir lesquels garder actifs. |
| `mail.downgraded.cta` | Revenir à {plan} |
| `mail.subscriptionAdmin.extended.subject` | Votre forfait {plan} est prolongé |
| `mail.subscriptionAdmin.extended.preheader` | Il reste actif jusqu'au {date, date, medium}. |
| `mail.subscriptionAdmin.extended.p1` | Jumanly a prolongé votre forfait {plan} : il reste actif jusqu'au {date, date, long}. |
| `mail.subscriptionAdmin.planNow.subject` | Votre forfait passe à {newPlan} |
| `mail.subscriptionAdmin.planNow.preheader` | Le changement s'applique dès maintenant. |
| `mail.subscriptionAdmin.planNow.p1` | Jumanly a remplacé votre forfait {plan} par {newPlan}. Les droits de {newPlan} s'appliquent dès maintenant, jusqu'au {date, date, long}. |
| `mail.subscriptionAdmin.planTerm.subject` | Votre forfait passera à {newPlan} |
| `mail.subscriptionAdmin.planTerm.preheader` | Le changement s'appliquera le {date, date, medium}. |
| `mail.subscriptionAdmin.planTerm.p1` | Votre forfait {plan} reste actif jusqu'au {date, date, long}. Le renouvellement se fera ensuite avec {newPlan}. |
| `mail.subscriptionAdmin.cancelNow.subject` | Votre forfait {plan} est résilié |
| `mail.subscriptionAdmin.cancelNow.preheader` | Votre compte repasse au forfait gratuit. |
| `mail.subscriptionAdmin.cancelNow.p1` | Jumanly a résilié votre forfait {plan} le {date, date, long}. Votre compte repasse au forfait gratuit ; rien n'est supprimé. |
| `mail.subscriptionAdmin.cancelTerm.subject` | Votre forfait {plan} prendra fin le {date, date, medium} |
| `mail.subscriptionAdmin.cancelTerm.preheader` | Il reste actif jusqu'à cette date. |
| `mail.subscriptionAdmin.cancelTerm.p1` | Jumanly a résilié votre forfait {plan} à son échéance. Il reste actif jusqu'au {date, date, long}, puis votre compte repasse au forfait gratuit. |
| `mail.subscriptionAdmin.reason` | Motif : {reason}. Pour toute question, écrivez à assistant@jumanly.io. |
| `mail.subscriptionAdmin.cta` | Voir mon abonnement |

### E-mail · Licence sponsorisée activée

| Clé | Texte |
|---|---|
| `mail.licenseActivated.subject` | Votre accès {plan} offert par {sponsorName} est actif |
| `mail.licenseActivated.preheader` | Jusqu'au {date, date, medium}. Profitez-en pour avancer. |
| `mail.licenseActivated.p1` | Grâce à {sponsorName}, vous bénéficiez du forfait {plan} jusqu'au {date, date, long}. |
| `mail.licenseActivated.p2` | {sponsorName} reçoit uniquement des statistiques agrégées. Votre CV, vos messages et vos informations personnelles ne lui sont pas transmis. |
| `mail.licenseActivated.p3.onHold` | Votre forfait actuel est supérieur : la licence est mise en attente et s'activera si vous changez de forfait. |
| `mail.licenseActivated.cta` | Découvrir mes avantages |

### E-mail · Licence sponsorisée expirée

| Clé | Texte |
|---|---|
| `mail.licenseExpired.subject` | Votre accès offert par {sponsorName} est terminé |
| `mail.licenseExpired.preheader` | Vos données sont conservées. |
| `mail.licenseExpired.p1` | Votre licence {plan} offerte par {sponsorName} a pris fin le {date, date, long}. Votre compte est au forfait {freePlan}. |
| `mail.licenseExpired.p2` | Tout ce que vous avez construit est conservé, y compris vos attestations. Vous pouvez continuer avec {freePlan} ou choisir un forfait. |
| `mail.licenseExpired.cta` | Voir les forfaits |
| `mail.licenseExpiring.subject` | Votre accès offert par {sponsorName} se termine dans {days} jours |
| `mail.licenseExpiring.preheader` | Fin de la licence le {date, date, medium}. |
| `mail.licenseExpiring.p1` | Votre licence {plan} offerte par {sponsorName} se termine le {date, date, long}. Pensez à terminer vos formations en cours. |
| `mail.licenseExpiring.cta` | Reprendre mes formations |

### E-mail · Licence offerte (invitation d'un bénéficiaire)

| Clé | Texte |
|---|---|
| `mail.licenseInvite.subject` | {sponsorName} vous offre un accès Jumanly {plan} |
| `mail.licenseInvite.preheader` | Formations, CV, préparation aux entretiens. Activez votre accès. |
| `mail.licenseInvite.p1` | {sponsorName} vous offre un accès au forfait Jumanly {plan} pendant {months, plural, one {# mois} other {# mois}}. |
| `mail.licenseInvite.p2` | Jumanly vous aide à vous former, à construire votre CV et à trouver des offres. {sponsorName} ne verra que des statistiques agrégées, jamais votre CV ni vos messages. |
| `mail.licenseInvite.p3` | Votre code d'activation : {code} |
| `mail.licenseInvite.cta` | Activer mon accès |

### E-mail · Résumé hebdomadaire (non essentiel)

| Clé | Texte |
|---|---|
| `mail.weekly.talent.subject` | Votre semaine sur Jumanly |
| `mail.weekly.talent.preheader` | {count, plural, one {# nouvelle offre compatible} other {# nouvelles offres compatibles}} et vos progrès. |
| `mail.weekly.talent.p1` | Voici votre semaine en bref. |
| `mail.weekly.talent.learn` | Formations : {hours} h d'apprentissage, {lessons, plural, one {# leçon terminée} other {# leçons terminées}}. |
| `mail.weekly.talent.applications` | Candidatures : {active, plural, one {# en cours} other {# en cours}}, {updates, plural, =0 {aucune mise à jour} one {# mise à jour} other {# mises à jour}}. |
| `mail.weekly.talent.matches` | {count, plural, =0 {Pas de nouvelle offre très compatible cette semaine.} one {# nouvelle offre très compatible avec votre profil.} other {# nouvelles offres très compatibles avec votre profil.}} |
| `mail.weekly.talent.nextStep` | Votre prochaine étape : {nextStep} |
| `mail.weekly.talent.cta` | Ouvrir Jumanly |
| `mail.weekly.recruiter.subject` | Votre semaine de recrutement · {org} |
| `mail.weekly.recruiter.preheader` | {count, plural, one {# nouvelle candidature} other {# nouvelles candidatures}} cette semaine. |
| `mail.weekly.recruiter.applications` | Nouvelles candidatures : {count} |
| `mail.weekly.recruiter.waiting` | Candidats en attente de réponse : {count} |
| `mail.weekly.recruiter.interviews` | Entretiens la semaine prochaine : {count} |
| `mail.weekly.recruiter.cta` | Ouvrir le tableau de bord |
| `mail.weekly.unsubscribe` | Ne plus recevoir le résumé hebdomadaire |


---

## Partie 08 · Textes système

Textes transverses, communs à toute l'application et aux pages publiques : erreurs, pages d'erreur, maintenance, hors ligne, session, validation, états vides, chargement, confirmations, toasts, téléversement, dates, accessibilité et signalement.

Conventions :

- Les messages d'erreur disent **ce qui s'est passé** et **quoi faire**, sans jargon technique ni code d'erreur brut (le code éventuel va dans `system.error.reference`).
- Jamais de numéro de téléphone. Contact : assistant@jumanly.io, infojumanly@gmail.com.
- Les tailles et types de fichiers ci-dessous sont les valeurs initiales ; ils sont injectés par variables (`{maxSize}`, `{types}`) pour rester modifiables.

---

### Erreurs génériques

*Rassurer, expliquer en une phrase, proposer une action.*

| Clé | Texte |
|---|---|
| `system.error.generic.title` | Un problème est survenu |
| `system.error.generic.body` | Ce n'est pas de votre faute. Réessayez dans un instant. |
| `system.error.retry` | Réessayer |
| `system.error.reload` | Recharger la page |
| `system.error.back` | Retour |
| `system.error.home` | Retour à l'accueil |
| `system.error.contact` | Si le problème persiste, écrivez-nous à assistant@jumanly.io. |
| `system.error.reference` | Référence de l'incident : {ref} |
| `system.error.network` | Connexion impossible. Vérifiez votre accès à internet. |
| `system.error.timeout` | Le serveur met trop de temps à répondre. Réessayez. |
| `system.error.rateLimit` | Trop de tentatives en peu de temps. Patientez {seconds, plural, one {# seconde} other {# secondes}} avant de réessayer. |
| `system.error.saveFailed` | L'enregistrement a échoué. Vos modifications sont conservées sur cet appareil ; réessayez. |
| `system.error.loadFailed` | Impossible de charger ce contenu. |
| `system.error.conflict` | Ce contenu a été modifié par quelqu'un d'autre. Rechargez pour voir la dernière version. |
| `system.error.notFoundItem` | Cet élément n'existe plus ou a été supprimé. |
| `system.error.paymentProvider` | Le service de paiement ne répond pas. Aucun montant n'a été prélevé. Réessayez plus tard. |
| `system.error.aiUnavailable` | Jumanly Intelligence est momentanément indisponible. Aucun crédit n'a été utilisé. Le reste de Jumanly fonctionne normalement. |

### Page 404 · Introuvable

| Clé | Texte |
|---|---|
| `system.404.meta.title` | Page introuvable · Jumanly |
| `system.404.code` | 404 |
| `system.404.title` | Cette page est introuvable |
| `system.404.body` | Le lien est peut-être incorrect, ou la page a été déplacée. |
| `system.404.job` | Cette offre n'est plus en ligne. Elle a peut-être été pourvue. |
| `system.404.course` | Cette formation n'est plus disponible. |
| `system.404.cta.home` | Retour à l'accueil |
| `system.404.cta.jobs` | Voir les offres |
| `system.404.cta.courses` | Voir les formations |
| `system.404.search` | Ou cherchez ce qu'il vous faut : |
| `system.404.searchPlaceholder` | Rechercher une formation, une offre… |
| `system.404.pageTitle` | Page introuvable |

### Page 403 · Accès refusé

| Clé | Texte |
|---|---|
| `system.403.meta.title` | Accès refusé · Jumanly |
| `system.403.code` | 403 |
| `system.403.title` | Vous n'avez pas accès à cette page |
| `system.403.body` | Votre rôle ne permet pas d'ouvrir ce contenu. |
| `system.403.org` | Cette page appartient à l'espace de {org}. Demandez l'accès à un administrateur de l'organisation. |
| `system.403.wrongSpace` | Cette page appartient à un autre espace. Changez d'espace dans le menu pour y accéder. |
| `system.403.switchSpace` | Changer d'espace |
| `system.403.suspended` | Votre compte est suspendu. Écrivez à assistant@jumanly.io pour en savoir plus. |
| `system.403.orgSuspended` | Cette organisation est suspendue par Jumanly : son espace recrutement est fermé. Écrivez à assistant@jumanly.io pour en savoir plus. |
| `system.403.cta` | Retour à l'accueil |
| `system.403.pageTitle` | Accès refusé |

### Verrou de forfait et quota atteint

*Les textes de verrou (`lock.*`) et de quota (`quota.*`) sont définis une seule fois dans la partie 05. Ne pas les dupliquer ici. Rappel : un verrou de forfait n'est pas une erreur 403 ; la fonction existe mais n'est pas incluse dans le forfait actuel.*

### Page 500 · Erreur serveur

| Clé | Texte |
|---|---|
| `system.500.meta.title` | Erreur · Jumanly |
| `system.500.code` | 500 |
| `system.500.title` | Nous rencontrons un problème technique |
| `system.500.body` | Notre équipe est prévenue. Vos données sont en sécurité. Réessayez dans quelques minutes. |
| `system.500.cta.retry` | Réessayer |
| `system.500.cta.home` | Retour à l'accueil |
| `system.500.footer` | Une plateforme développée par The Growth Lab · assistant@jumanly.io |

### Maintenance

| Clé | Texte |
|---|---|
| `system.maintenance.meta.title` | Maintenance en cours · Jumanly |
| `system.maintenance.title` | Jumanly fait peau neuve |
| `system.maintenance.body.text` | Une maintenance est en cours pour améliorer la plateforme. Nous serons de retour vers {time} ({timezone}). |
| `system.maintenance.body.noTime` | Une maintenance est en cours pour améliorer la plateforme. Nous revenons très vite. |
| `system.maintenance.data` | Vos données, candidatures et formations sont conservées. |
| `system.maintenance.contact` | Une urgence ? Écrivez-nous à assistant@jumanly.io. |
| `system.maintenance.banner.text` | Maintenance prévue le {date, date, long} de {start} à {end} ({timezone}). Jumanly sera indisponible pendant ce créneau. |
| `system.maintenance.banner.dismiss` | J'ai compris |
| `system.maintenance.readOnly` | Maintenance en cours : Jumanly est en lecture seule. Vous pourrez enregistrer vos modifications dans quelques minutes. |
| `system.maintenance.badge` | Maintenance en cours |
| `system.maintenance.timezone` | heure de {city} |

### Hors ligne

| Clé | Texte |
|---|---|
| `system.offline.banner` | Vous êtes hors ligne. Certaines actions sont indisponibles. |
| `system.offline.back` | Connexion rétablie. |
| `system.offline.page.title` | Pas de connexion |
| `system.offline.page.body` | Vérifiez votre connexion internet ou vos données mobiles, puis réessayez. |
| `system.offline.queued` | Hors ligne : votre message sera envoyé dès le retour de la connexion. |
| `system.offline.draftKept` | Votre saisie est conservée sur cet appareil. |
| `system.offline.slow` | Connexion lente. Le chargement peut prendre un peu plus de temps. |
| `system.offline.dataSaver` | Activer le mode économie de données |
| `system.offline.dataSaverOn` | Mode économie de données activé |
| `system.offline.dataSaverHint` | Les vidéos se chargent en qualité réduite sur cet appareil. |

### Session expirée et authentification

| Clé | Texte |
|---|---|
| `system.session.expired.title` | Votre session a expiré |
| `system.session.expired.body` | Pour protéger votre compte, vous avez été déconnecté après une période d'inactivité. Reconnectez-vous pour continuer : vous reviendrez sur cette page. |
| `system.session.expired.cta` | Me reconnecter |
| `system.session.expiring` | Votre session expire dans {minutes, plural, one {# minute} other {# minutes}}. |
| `system.session.extend` | Rester connecté |
| `system.session.loggedOut` | Vous êtes déconnecté. À bientôt. |
| `system.session.loggedOutElsewhere` | Vous avez été déconnecté depuis un autre appareil. |
| `system.auth.required.text` | Connectez-vous pour continuer. |
| `system.auth.required.apply` | Connectez-vous ou créez un compte gratuit pour postuler. Vous reviendrez ensuite sur cette offre. |
| `system.auth.required.course` | Créez un compte gratuit pour commencer cette formation. |
| `system.auth.required.save` | Créez un compte gratuit pour enregistrer cette offre. |

---

### Validation des formulaires (règles communes)

*Messages affichés sous le champ, après sa sortie ou à l'envoi. Ils disent quoi corriger.*

| Clé | Texte |
|---|---|
| `validation.required.text` | Ce champ est obligatoire. |
| `validation.required.named` | Indiquez {field}. |
| `validation.required.choice` | Choisissez une option. |
| `validation.required.checkbox` | Cochez cette case pour continuer. |
| `validation.email.invalid` | Saisissez une adresse e-mail valide, par exemple nom@exemple.com. |
| `validation.email.taken` | Un compte existe déjà avec cette adresse. Connectez-vous ou réinitialisez votre mot de passe. |
| `validation.password.min` | Au moins {min} caractères. |
| `validation.password.rules` | Au moins {min} caractères, dont une lettre et un chiffre. |
| `validation.password.weak` | Ce mot de passe est trop courant. Choisissez-en un plus personnel. |
| `validation.password.mismatch` | Les deux mots de passe ne correspondent pas. |
| `validation.password.strength.weak` | Faible |
| `validation.password.strength.medium` | Moyen |
| `validation.password.strength.strong` | Solide |
| `validation.password.show` | Afficher le mot de passe |
| `validation.password.hide` | Masquer le mot de passe |
| `validation.minLength` | Au moins {min, plural, one {# caractère} other {# caractères}}. |
| `validation.maxLength` | {max, plural, one {# caractère} other {# caractères}} au maximum. |
| `validation.counter` | {count}/{max} |
| `validation.number.invalid` | Saisissez un nombre. |
| `validation.number.min` | La valeur minimale est {min}. |
| `validation.number.max` | La valeur maximale est {max}. |
| `validation.number.integer` | Saisissez un nombre entier. |
| `validation.date.invalid` | Saisissez une date valide (jj/mm/aaaa). |
| `validation.date.past` | Choisissez une date passée. |
| `validation.date.future` | Choisissez une date à venir. |
| `validation.date.range` | La date de fin doit suivre la date de début. |
| `validation.url.invalid` | Saisissez une adresse web complète, commençant par https://. |
| `validation.code.invalid` | Code incorrect. Vérifiez les {length} chiffres reçus par e-mail. |
| `validation.code.expired` | Ce code a expiré. Demandez-en un nouveau. |
| `validation.code.resend` | Renvoyer le code |
| `validation.code.resendIn` | Nouveau code possible dans {seconds} s |
| `validation.select.max` | {max, plural, one {# choix au maximum.} other {# choix au maximum.}} |
| `validation.select.min` | {min, plural, one {Au moins # choix.} other {Au moins # choix.}} |
| `validation.duplicate` | Cet élément existe déjà. |
| `validation.forbiddenContent` | Ce texte contient des informations non autorisées (coordonnées de paiement, propos discriminatoires). Modifiez-le pour continuer. |
| `validation.form.summary.text` | {count, plural, one {# champ à corriger.} other {# champs à corriger.}} |
| `validation.form.summary.link` | Aller au premier champ à corriger |
| `validation.optional` | facultatif |
| `validation.required.marker.aria` | obligatoire |

---

### États vides génériques

| Clé | Texte |
|---|---|
| `empty.generic.title` | Rien pour l'instant |
| `empty.generic.body` | Ce contenu apparaîtra ici dès qu'il sera disponible. |
| `empty.search.title` | Aucun résultat |
| `empty.search.body` | Aucun résultat pour « {query} ». Vérifiez l'orthographe ou essayez un terme plus général. |
| `empty.filters.title` | Aucun résultat avec ces filtres |
| `empty.filters.cta` | Effacer les filtres |
| `empty.list.cta` | Ajouter |
| `empty.permission` | Vous ne voyez que les éléments auxquels votre rôle donne accès. |

### Chargement

| Clé | Texte |
|---|---|
| `loading.generic` | Chargement… |
| `loading.aria` | Chargement en cours |
| `loading.saving` | Enregistrement… |
| `loading.sending` | Envoi… |
| `loading.uploading` | Téléversement… {percent} % |
| `loading.processing` | Traitement en cours… |
| `loading.searching` | Recherche… |
| `loading.slow` | Cela prend plus de temps que prévu. Merci de patienter. |
| `loading.more` | Charger plus |
| `loading.end` | Vous avez tout vu. |
| `loading.skeleton.aria` | Contenu en cours de chargement |

### Confirmations (boîtes de dialogue)

| Clé | Texte |
|---|---|
| `confirm.delete.title` | Supprimer {item} ? |
| `confirm.delete.body` | Cette action est définitive. |
| `confirm.delete.cta` | Supprimer |
| `confirm.cancel` | Annuler |
| `confirm.discard.title` | Quitter sans enregistrer ? |
| `confirm.discard.body` | Vos modifications seront perdues. |
| `confirm.discard.cta` | Quitter sans enregistrer |
| `confirm.discard.stay` | Rester sur la page |
| `confirm.generic.title` | Confirmer cette action ? |
| `confirm.generic.cta` | Confirmer |
| `confirm.typeToConfirm` | Tapez {word} pour confirmer |
| `confirm.irreversible` | Cette action ne peut pas être annulée. |

### Toasts (messages temporaires)

| Clé | Texte |
|---|---|
| `toast.saved` | Enregistré. |
| `toast.updated` | Mis à jour. |
| `toast.deleted.text` | Supprimé. |
| `toast.deleted.undo` | Supprimé. Annuler ? |
| `toast.undo` | Annuler |
| `toast.restored` | Restauré. |
| `toast.copied` | Copié dans le presse-papiers. |
| `toast.linkCopied` | Lien copié. |
| `toast.sent` | Envoyé. |
| `toast.invited` | Invitation envoyée. |
| `toast.error` | Une erreur est survenue. Réessayez. |
| `toast.close` | Fermer |
| `toast.region.aria` | Notifications temporaires |

---

### Téléversement de fichiers

*Types acceptés et tailles maximales par usage. Messages d'erreur précis.*

| Clé | Texte |
|---|---|
| `upload.dropzone` | Glissez votre fichier ici ou |
| `upload.browse` | parcourez vos fichiers |
| `upload.choose` | Choisir un fichier |
| `upload.takePhoto` | Prendre une photo |
| `upload.replace` | Remplacer |
| `upload.remove` | Retirer |
| `upload.hint.text` | {types} · {maxSize} maximum |
| `upload.hint.cv` | PDF ou Word (.docx) · 5 Mo maximum |
| `upload.hint.photo` | JPG, PNG ou WebP · 2 Mo maximum · format carré conseillé |
| `upload.hint.logo` | PNG, JPG, WebP ou SVG · 2 Mo maximum |
| `upload.hint.cover` | JPG, PNG ou WebP · 5 Mo maximum · 1600 × 400 pixels conseillés |
| `upload.hint.document` | PDF, JPG ou PNG · 10 Mo maximum |
| `upload.hint.message` | PDF, Word, JPG ou PNG · 10 Mo maximum |
| `upload.hint.portfolio` | Images (JPG, PNG, WebP) 5 Mo, PDF 10 Mo, vidéo MP4 50 Mo |
| `upload.hint.csv` | CSV (UTF-8) · 2 Mo maximum · 5 000 lignes maximum |
| `upload.hint.verification` | PDF, JPG ou PNG · 10 Mo maximum |
| `upload.progress` | {fileName} · {percent} % |
| `upload.success` | {fileName} ajouté. |
| `upload.error.type` | Format non accepté. Formats possibles : {types}. |
| `upload.error.size` | Fichier trop lourd ({size}). Taille maximale : {maxSize}. |
| `upload.error.empty` | Ce fichier est vide. |
| `upload.error.corrupt` | Ce fichier est illisible ou endommagé. |
| `upload.error.protected` | Ce fichier est protégé par un mot de passe. Retirez la protection puis réessayez. |
| `upload.error.virus` | Ce fichier a été bloqué par notre contrôle de sécurité. |
| `upload.error.count` | {max, plural, one {# fichier au maximum.} other {# fichiers au maximum.}} |
| `upload.error.network` | Le téléversement a été interrompu. Réessayez. |
| `upload.cancel` | Annuler le téléversement |
| `upload.scanning` | Vérification de sécurité… |
| `upload.lowBandwidth` | Connexion lente : le téléversement peut prendre quelques minutes. Gardez cette page ouverte. |

---

### Dates et formats relatifs

*Formats d'affichage. Les dates sont dans le fuseau de l'utilisateur ; les rendez-vous indiquent toujours le fuseau.*

| Clé | Texte |
|---|---|
| `date.relative.now` | À l'instant |
| `date.relative.minutes` | Il y a {count, plural, one {# min} other {# min}} |
| `date.relative.hours` | Il y a {count, plural, one {# h} other {# h}} |
| `date.relative.yesterday` | Hier |
| `date.relative.days` | Il y a {count, plural, one {# j} other {# j}} |
| `date.relative.weeks` | Il y a {count, plural, one {# sem.} other {# sem.}} |
| `date.relative.months` | Il y a {count, plural, one {# mois} other {# mois}} |
| `date.relative.years` | Il y a {count, plural, one {# an} other {# ans}} |
| `date.relative.inMinutes` | Dans {count, plural, one {# minute} other {# minutes}} |
| `date.relative.inHours` | Dans {count, plural, one {# heure} other {# heures}} |
| `date.relative.tomorrow` | Demain |
| `date.relative.inDays` | Dans {count, plural, one {# jour} other {# jours}} |
| `date.today` | Aujourd'hui |
| `date.todayAt` | Aujourd'hui à {time} |
| `date.yesterdayAt` | Hier à {time} |
| `date.tomorrowAt` | Demain à {time} |
| `date.on` | Le {date, date, medium} |
| `date.onAt` | Le {date, date, medium} à {time} |
| `date.range` | Du {start, date, medium} au {end, date, medium} |
| `date.since` | Depuis {date, date, medium} |
| `date.until` | Jusqu'au {date, date, long} |
| `date.present` | aujourd'hui |
| `date.timezone` | heure de {timezone} |
| `date.format.short` | jj/mm/aaaa |
| `date.format.monthYear` | mm/aaaa |
| `date.weekday.short` | lun., mar., mer., jeu., ven., sam., dim. |
| `duration.minutes` | {count} min |
| `duration.hours` | {count} h |
| `duration.hoursMinutes` | {hours} h {minutes} |
| `number.percent` | {value} % |
| `number.currency.text` | {amount} {currency} |
| `number.currency.perMonth` | {amount} {currency}/mois |
| `number.thousands.short` | {value} k |

---

### Accessibilité (libellés aria importants)

| Clé | Texte |
|---|---|
| `a11y.skipToContent` | Aller au contenu principal |
| `a11y.mainNav` | Navigation principale |
| `a11y.breadcrumb` | Fil d'Ariane |
| `a11y.openMenu` | Ouvrir le menu |
| `a11y.closeMenu` | Fermer le menu |
| `a11y.close` | Fermer |
| `a11y.closeDialog` | Fermer la fenêtre |
| `a11y.search` | Rechercher |
| `a11y.clearSearch` | Effacer la recherche |
| `a11y.filters` | Ouvrir les filtres |
| `a11y.sort` | Trier les résultats |
| `a11y.pagination` | Pagination |
| `a11y.page` | Page {page} sur {total} |
| `a11y.nextPage` | Page suivante |
| `a11y.previousPage` | Page précédente |
| `a11y.avatar.text` | Photo de {name} |
| `a11y.avatar.initials` | Initiales de {name} |
| `a11y.logo` | Jumanly, retour à l'accueil |
| `a11y.notifications` | Notifications |
| `a11y.unread` | non lu |
| `a11y.newWindow` | s'ouvre dans un nouvel onglet |
| `a11y.download` | Télécharger {fileName} ({size}) |
| `a11y.progress` | Progression : {percent} % |
| `a11y.rating` | Note : {rating} sur 5 |
| `a11y.score` | Score : {score} sur 100 |
| `a11y.badge.verified` | Entreprise vérifiée |
| `a11y.badge.new` | Nouveau |
| `a11y.locked` | Verrouillé |
| `a11y.required` | obligatoire |
| `a11y.expand` | Déplier |
| `a11y.collapse` | Replier |
| `a11y.moreActions.text` | Plus d'actions |
| `a11y.moreActions.for` | Plus d'actions pour {name} |
| `a11y.dragHandle` | Poignée de déplacement |
| `a11y.chart.summary` | Graphique : {summary} |
| `a11y.tabList` | Onglets |
| `a11y.loading` | Chargement en cours |
| `a11y.liveRegion.updated` | Contenu mis à jour |
| `a11y.carousel.previous` | Élément précédent |
| `a11y.carousel.next` | Élément suivant |
| `a11y.video.player` | Lecteur vidéo : {title} |
| `a11y.aiOrb` | Suggestion de Jumanly Intelligence |
| `a11y.theme.toggle` | Changer de thème |
| `a11y.language.switch` | Changer de langue |
| `a11y.dateInput` | Format attendu : jour, mois, année |

---

### Signalement de contenu (offres, messages, questions, profils)

*Un parcours unique pour signaler, quel que soit le contenu.*

| Clé | Texte |
|---|---|
| `report.cta` | Signaler |
| `report.title.job` | Signaler cette offre |
| `report.title.message` | Signaler ce message |
| `report.title.question` | Signaler cette question |
| `report.title.profile` | Signaler ce profil |
| `report.title.organization` | Signaler cette organisation |
| `report.intro` | Votre signalement est confidentiel. La personne concernée ne saura pas qu'il vient de vous. |
| `report.reason.text` | Pourquoi signalez-vous ce contenu ? |
| `report.reason.scam` | Arnaque ou demande de paiement |
| `report.reason.fakeJob` | Offre fictive ou trompeuse |
| `report.reason.discrimination` | Contenu discriminatoire |
| `report.reason.harassment` | Harcèlement ou propos déplacés |
| `report.reason.spam` | Contenu indésirable ou publicitaire |
| `report.reason.personalData` | Demande abusive de données personnelles |
| `report.reason.inappropriate` | Contenu inapproprié |
| `report.reason.impersonation` | Usurpation d'identité |
| `report.reason.other` | Autre motif |
| `report.details.text` | Précisions (facultatif) |
| `report.details.placeholder` | Ce qui vous a alerté, en quelques mots. |
| `report.block` | Bloquer aussi cet utilisateur |
| `report.submit` | Envoyer le signalement |
| `report.success` | Merci. L'équipe Jumanly examine votre signalement et prendra les mesures nécessaires. |
| `report.already` | Vous avez déjà signalé ce contenu. Il est en cours d'examen. |
| `report.urgent` | En cas de danger immédiat, contactez les autorités de votre pays. |
| `report.contact` | Vous pouvez aussi écrire à assistant@jumanly.io. |
| `report.hidden` | Ce contenu a été masqué après signalement. |
| `report.removed` | Ce contenu a été retiré car il ne respecte pas les règles de Jumanly. |


---

## Partie 09 · Espace partenaire et Jumanly Admin

Textes de l'espace Jumanly Partners (`/app/partenaire`, rôle `partner_manager`) et de la console d'administration (`/admin`, rôles `platform_admin`, `support_agent`, `content_editor`).

Conventions :

- Variables : `{org}`, `{batchName}`, `{plan}`, `{count}`, `{total}`, `{used}`, `{date}`, `{code}`, `{email}`, `{userName}`, `{amount}`, `{currency}`, `{period}`, `{percent}`.
- **Règle Partners, affichée partout où des données apparaissent** : le partenaire ne voit que des rapports agrégés. Aucune donnée nominative (nom, e-mail, CV, messages, candidatures individuelles) n'est partagée. Seule exception prévue : un bénéficiaire qui a explicitement donné son accord pour un usage précis (voir `sponsored.consent.*` dans la partie 05).
- Seuil d'anonymat : un indicateur portant sur moins de `{minGroup}` personnes n'est pas affiché, pour éviter toute réidentification.
- Les textes Admin sont internes mais suivent les mêmes règles de ton (sobres, sans jargon inutile, sans em-dash).

---

### Navigation · Espace partenaire

| Clé | Texte |
|---|---|
| `partner.nav.dashboard` | Tableau de bord |
| `partner.nav.licenses` | Licences |
| `partner.nav.reports` | Rapports |
| `partner.nav.settings` | Paramètres |
| `partner.nav.badge` | Jumanly Partners |
| `partner.nav.contact` | Mon contact Jumanly |

### `/app/partenaire` · Tableau de bord partenaire

*Suivre la distribution et l'usage des licences financées, en données agrégées uniquement.*

| Clé | Texte |
|---|---|
| `partner.dashboard.eyebrow` | Jumanly Partners · {org} |
| `partner.dashboard.title` | Tableau de bord |
| `partner.dashboard.subtitle` | L'accès que vous financez, et son usage, en chiffres agrégés. |
| `partner.dashboard.openReport` | Voir le rapport détaillé |
| `partner.dashboard.privacy` | Aucune donnée nominative n'est partagée : vous voyez des totaux et des moyennes, jamais le CV, les messages ou les informations personnelles d'un bénéficiaire. |
| `partner.dashboard.kpi.purchased` | Licences achetées |
| `partner.dashboard.kpi.distributed` | Licences distribuées |
| `partner.dashboard.kpi.activated` | Licences activées |
| `partner.dashboard.kpi.active` | Bénéficiaires actifs (30 derniers jours) |
| `partner.dashboard.kpi.activationRate` | Taux d'activation : {percent} % |
| `partner.dashboard.kpi.available` | {count, plural, =0 {Aucune licence disponible} one {# licence disponible} other {# licences disponibles}} |
| `partner.dashboard.usage.title` | Usage agrégé |
| `partner.dashboard.usage.learningHours` | Heures de formation |
| `partner.dashboard.usage.coursesCompleted` | Formations terminées |
| `partner.dashboard.usage.certificates` | Attestations obtenues |
| `partner.dashboard.usage.cvCreated` | CV créés ou mis à jour |
| `partner.dashboard.usage.applications` | Candidatures envoyées |
| `partner.dashboard.usage.interviewSims` | Simulations d'entretien réalisées |
| `partner.dashboard.usage.hiresDeclared.text` | Embauches déclarées |
| `partner.dashboard.usage.hiresDeclared.hint` | Nombre de bénéficiaires ayant indiqué un recrutement et accepté qu'il soit comptabilisé. |
| `partner.dashboard.usage.chartAria` | Évolution mensuelle des bénéficiaires actifs |
| `partner.dashboard.batches.title` | Mes lots de licences |
| `partner.dashboard.batches.row` | {batchName} · {plan} · {activated}/{total} activées |
| `partner.dashboard.batches.period` | Du {start, date, medium} au {end, date, medium} |
| `partner.dashboard.batches.seeAll` | Gérer les licences |
| `partner.dashboard.smallGroup` | Données masquées : moins de {minGroup} bénéficiaires concernés. |
| `partner.dashboard.smallGroupWhen` | Chaque chiffre s'affiche dès qu'il concerne au moins {minGroup} bénéficiaires : plus vous distribuez de codes, plus vite ils apparaissent (« Gérer les licences »). |
| `partner.dashboard.empty` | Aucun lot de licences pour l'instant. Votre contact Jumanly le créera après signature du contrat. |
| `partner.dashboard.contact` | Une question sur votre contrat ? Écrivez à assistant@jumanly.io. |
| `partner.hidden` | Masqué |
| `partner.dashboard.months.title` | Bénéficiaires actifs par mois |
| `partner.dashboard.months.month` | Mois |
| `partner.dashboard.months.value` | {month} : {value} |
| `partner.dashboard.kpi.batches` | {count, plural, =0 {Aucun lot} one {# lot} other {# lots}} |
| `partner.dashboard.usage.hoursValue` | {hours} h |
| `partner.dashboard.usage.batch` | Lot affiché |
| `partner.dashboard.usage.batchAll` | Tous les lots |

### `/app/partenaire/licences` · Lots, codes et invitations

*Distribuer les licences par code, lien ou liste d'e-mails, sans accéder aux comptes des bénéficiaires.*

#### Lots

| Clé | Texte |
|---|---|
| `partner.licenses.title` | Licences |
| `partner.licenses.subtitle` | Distribuez vos licences par code, par lien d'invitation ou par import d'e-mails. |
| `partner.licenses.batch.select` | Lot |
| `partner.licenses.batch.plan` | Forfait : {plan} |
| `partner.licenses.batch.period` | Valable du {start, date, long} au {end, date, long} |
| `partner.licenses.batch.duration` | Durée par bénéficiaire : {months, plural, one {# mois} other {# mois}} |
| `partner.licenses.batch.usage` | {activated} activées sur {total} |
| `partner.licenses.batch.status.upcoming` | À venir |
| `partner.licenses.batch.status.active` | En cours |
| `partner.licenses.batch.status.expired` | Terminé |
| `partner.licenses.batch.status.exhausted` | Toutes les licences sont distribuées |
| `partner.licenses.batch.more` | Besoin de licences supplémentaires ? Écrivez à assistant@jumanly.io. |
| `partner.licenses.batch.none` | Aucun lot de licences pour l'instant. Votre contact Jumanly le créera après signature du contrat. |
| `partner.licenses.batch.available` | {count, plural, =0 {Aucune licence disponible} one {# licence disponible} other {# licences disponibles}} |
| `partner.licenses.error.invalid` | Vérifiez les informations saisies. |
| `partner.licenses.error.notFound` | Cet élément n'existe plus. |
| `partner.licenses.error.batchClosed` | Ce lot est terminé : ses licences ne peuvent plus être distribuées. |
| `partner.licenses.error.noneAvailable` | Toutes les licences de ce lot sont distribuées. |
| `partner.licenses.error.consent` | Confirmez que ces personnes ont accepté de recevoir une invitation de votre part. |

#### Codes d'activation

| Clé | Texte |
|---|---|
| `partner.licenses.codes.title` | Codes d'activation |
| `partner.licenses.codes.desc` | Chaque code active une licence, une seule fois. Le bénéficiaire le saisit sur jumanly.io/activer. |
| `partner.licenses.codes.generate` | Générer des codes |
| `partner.licenses.codes.quantity.text` | Nombre de codes |
| `partner.licenses.codes.quantity.max` | {max} codes au maximum (licences encore disponibles). |
| `partner.licenses.codes.label.text` | Libellé interne (facultatif) |
| `partner.licenses.codes.label.placeholder` | Ex. : Promotion 2026, campus Nord |
| `partner.licenses.codes.generated` | {count, plural, one {# code généré.} other {# codes générés.}} |
| `partner.licenses.codes.download` | Télécharger les codes (CSV) |
| `partner.licenses.codes.col.code` | Code |
| `partner.licenses.codes.col.label` | Libellé |
| `partner.licenses.codes.col.status` | Statut |
| `partner.licenses.codes.col.created` | Créé le |
| `partner.licenses.codes.status.available` | Disponible |
| `partner.licenses.codes.status.used` | Utilisé |
| `partner.licenses.codes.status.revoked` | Révoqué |
| `partner.licenses.codes.status.expired` | Expiré |
| `partner.licenses.codes.revoke.text` | Révoquer |
| `partner.licenses.codes.revoke.confirm` | Révoquer ce code ? Il ne pourra plus être utilisé. La licence redevient disponible. |
| `partner.licenses.codes.usedNote` | Un code utilisé n'indique pas qui l'a activé. |
| `partner.licenses.codes.empty` | Aucun code pour ce lot. |
| `partner.licenses.codes.revoked` | Code révoqué. La licence est de nouveau disponible. |

#### Lien d'invitation

| Clé | Texte |
|---|---|
| `partner.licenses.link.title` | Lien d'invitation |
| `partner.licenses.link.desc` | Un lien unique à partager avec votre groupe. Chaque personne qui l'utilise active une licence, dans la limite des licences disponibles. |
| `partner.licenses.link.create` | Créer un lien |
| `partner.licenses.link.maxUses` | Nombre maximum d'activations |
| `partner.licenses.link.expires` | Expire le |
| `partner.licenses.link.copy` | Copier le lien |
| `partner.licenses.link.copied` | Lien copié. |
| `partner.licenses.link.uses` | {used} activations sur {max} |
| `partner.licenses.link.disable` | Désactiver le lien |
| `partner.licenses.link.disabled` | Lien désactivé. |
| `partner.licenses.link.warning` | Toute personne disposant du lien peut activer une licence. Partagez-le uniquement avec votre groupe. |
| `partner.licenses.link.created` | Lien créé. Copiez-le et partagez-le avec votre groupe. |
| `partner.licenses.link.empty` | Aucun lien pour l'instant. |
| `partner.licenses.link.address` | Adresse du lien |
| `partner.licenses.link.expiresOn` | Expire le {date} |

#### Import CSV d'e-mails

| Clé | Texte |
|---|---|
| `partner.licenses.import.title` | Inviter par e-mail |
| `partner.licenses.import.desc` | Importez une liste d'adresses : chaque personne reçoit un e-mail d'invitation avec son code personnel. |
| `partner.licenses.import.template` | Télécharger le modèle CSV |
| `partner.licenses.import.format` | Une colonne « email », une adresse par ligne. Facultatif : « prenom » pour personnaliser l'e-mail. |
| `partner.licenses.import.upload` | Importer le fichier |
| `partner.licenses.import.manual` | Ou saisissez des adresses, séparées par une virgule |
| `partner.licenses.import.preview` | Vérification du fichier |
| `partner.licenses.import.valid` | {count, plural, one {# adresse valide} other {# adresses valides}} |
| `partner.licenses.import.invalid` | {count, plural, one {# adresse invalide (ignorée)} other {# adresses invalides (ignorées)}} |
| `partner.licenses.import.duplicates` | {count, plural, one {# doublon retiré} other {# doublons retirés}} |
| `partner.licenses.import.alreadyInvited` | {count, plural, one {# personne déjà invitée} other {# personnes déjà invitées}} |
| `partner.licenses.import.tooMany` | Le fichier contient {count} adresses, mais il ne reste que {available} licences. Retirez des adresses ou demandez des licences supplémentaires. |
| `partner.licenses.import.downloadErrors` | Télécharger la liste des erreurs |
| `partner.licenses.import.confirm` | Envoyer {count, plural, one {# invitation} other {# invitations}} |
| `partner.licenses.import.sending` | Envoi des invitations… |
| `partner.licenses.import.sent` | {count, plural, one {# invitation envoyée.} other {# invitations envoyées.}} |
| `partner.licenses.import.privacy` | Les adresses servent uniquement à envoyer les invitations. Après activation, vous ne voyez plus que des statistiques agrégées. |
| `partner.licenses.import.consent` | Je confirme que ces personnes ont accepté de recevoir une invitation Jumanly de notre part. |
| `partner.licenses.invites.status.sent` | Invitation envoyée |
| `partner.licenses.invites.status.activated` | Activée |
| `partner.licenses.invites.status.bounced` | Adresse injoignable |
| `partner.licenses.invites.status.expired` | Invitation expirée |
| `partner.licenses.invites.resend.text` | Relancer les invitations non activées |
| `partner.licenses.invites.resend.confirm` | Relancer {count, plural, one {# personne} other {# personnes}} ? |
| `partner.licenses.invites.title` | Invitations par e-mail |
| `partner.licenses.invites.resent` | {count, plural, =0 {Aucune invitation à relancer.} one {# invitation relancée.} other {# invitations relancées.}} |
| `partner.licenses.import.file` | Fichier CSV |
| `partner.licenses.batch.rate` | {percent} % |
| `partner.licenses.invites.desc` | Totaux du lot, sans détail par personne |
| `partner.licenses.invites.count` | {label} · {count} |
| `partner.licenses.import.send` | Envoyer les invitations |
| `partner.licenses.import.noFile` | Aucun fichier choisi |

### `/app/partenaire/rapports` · Rapports d'impact agrégés

*Mesurer l'impact du financement sans exposer aucune personne.*

| Clé | Texte |
|---|---|
| `partner.reports.title` | Rapports d'impact |
| `partner.reports.subtitle` | Des indicateurs agrégés pour mesurer l'impact de votre programme. |
| `partner.reports.privacy.title` | Ce que contiennent ces rapports |
| `partner.reports.privacy.body` | Uniquement des totaux, des moyennes et des taux. Aucune donnée nominative n'est partagée : ni nom, ni e-mail, ni CV, ni message, ni candidature individuelle. |
| `partner.reports.privacy.threshold` | Tout indicateur portant sur moins de {minGroup} personnes est masqué. |
| `partner.reports.period` | Période |
| `partner.reports.batch.text` | Lot |
| `partner.reports.batch.all` | Tous les lots |
| `partner.reports.batch.apply` | Afficher |
| `partner.reports.section.reach` | Portée |
| `partner.reports.section.learning` | Formation |
| `partner.reports.section.career` | Préparation à l'emploi |
| `partner.reports.section.employment` | Accès à l'emploi |
| `partner.reports.metric.activated` | Bénéficiaires ayant activé leur licence |
| `partner.reports.metric.activeMonthly` | Bénéficiaires actifs par mois |
| `partner.reports.metric.coursesStarted` | Formations commencées |
| `partner.reports.metric.coursesCompleted` | Formations terminées |
| `partner.reports.metric.certificates` | Attestations obtenues |
| `partner.reports.metric.avgHours` | Heures de formation par bénéficiaire actif (moyenne) |
| `partner.reports.metric.topThemes` | Thèmes les plus suivis |
| `partner.reports.metric.profilesCompleted` | Profils complétés à plus de {percent} % |
| `partner.reports.metric.cvs` | CV créés |
| `partner.reports.metric.interviewSims` | Simulations d'entretien |
| `partner.reports.metric.applications` | Candidatures envoyées |
| `partner.reports.metric.interviews` | Entretiens obtenus |
| `partner.reports.metric.hiresDeclared` | Embauches déclarées (avec accord des bénéficiaires) |
| `partner.reports.export.pdf` | Exporter en PDF |
| `partner.reports.export.ready` | Rapport prêt. Le téléchargement commence. |
| `partner.reports.export.footer` | Rapport agrégé généré par Jumanly le {date, date, long}. Ne contient aucune donnée nominative. |
| `partner.reports.pdf.title` | Rapport d'impact · {org} |
| `partner.reports.monthly` | Recevoir le rapport chaque mois par e-mail |
| `partner.reports.empty` | Pas encore assez de données. Les premiers indicateurs apparaîtront quand au moins {minGroup} bénéficiaires auront activé leur licence. |
| `partner.reports.requestNominative` | Vous avez besoin d'une information individuelle (par exemple pour un suivi de programme) ? Elle ne peut être transmise qu'avec l'accord explicite de chaque bénéficiaire. Écrivez à assistant@jumanly.io pour mettre en place une demande de consentement. |
| `partner.reports.range` | Du {from, date, long} au {to, date, long} |
| `partner.reports.metric.activatedOf` | sur {count, plural, one {# licence distribuée} other {# licences distribuées}} |
| `partner.reports.hours` | {hours} h |
| `partner.reports.percent` | {percent} % |
| `partner.reports.hiresByBatch` | Embauches déclarées par lot |

---

### Navigation · Jumanly Admin

| Clé | Texte |
|---|---|
| `admin.nav.title` | Jumanly Admin |
| `admin.nav.dashboard` | Indicateurs |
| `admin.nav.users` | Utilisateurs |
| `admin.nav.organizations` | Organisations |
| `admin.nav.plans` | Forfaits et droits |
| `admin.nav.subscriptions` | Abonnements |
| `admin.nav.courses` | Formations |
| `admin.nav.jobs` | Modération des offres |
| `admin.nav.partners` | Partenaires |
| `admin.nav.ai` | IA et matching |
| `admin.nav.content` | Contenus |
| `admin.nav.reports` | Signalements |
| `admin.nav.audit` | Journal d'audit |
| `admin.nav.backToApp` | Retour à l'application |
| `admin.env.badge` | Administration |
| `admin.role.platform_admin` | Administrateur de la plateforme |
| `admin.role.support_agent` | Support |
| `admin.role.content_editor` | Éditeur de contenus |
| `admin.role.readOnly` | Accès en lecture seule |
| `admin.audit.notice` | Toutes les actions d'administration sont enregistrées dans le journal d'audit. |
| `admin.reason.required` | Indiquez le motif de cette action. Il sera enregistré dans le journal d'audit. |
| `admin.seo.title` | Jumanly Admin |
| `admin.notAllowed` | Votre rôle ne permet pas cette action. |
| `admin.header.logged` | Actions journalisées |
| `admin.header.search` | Rechercher |
| `admin.header.searchLabel` | Rechercher un compte par nom, e-mail ou identifiant |
| `admin.nav.more` | Toutes les rubriques |
| `admin.nav.mobile` | Rubriques de Jumanly Admin |
| `admin.nav.home` | Accueil de Jumanly Admin |
| `admin.nav.group.steer` | Pilotage |
| `admin.nav.group.accounts` | Comptes et partenaires |
| `admin.nav.group.offer` | Forfaits et abonnements |
| `admin.nav.group.content` | Formations et contenus |
| `admin.nav.group.control` | Modération et contrôle |
| `admin.nav.costs` | Coûts et revenus |
| `admin.nav.section` | Rubriques de « {group} » |
| `admin.sensitive.label` | Action sensible · motif obligatoire |
| `admin.sensitive.reason` | Motif |
| `admin.sensitive.close` | Fermer |

### Jumanly Admin · éléments communs (v2)

| Clé | Texte |
|---|---|
| `admin.kit.seeJournal` | Voir dans le journal |
| `admin.kit.pager.label` | Pages |
| `admin.kit.pager.previous` | Page précédente |
| `admin.kit.pager.next` | Page suivante |
| `admin.kit.pager.status` | Page {page} sur {pages} |
| `admin.kit.pager.range` | {from} à {to} sur {total} |
| `admin.kit.summary` | En résumé |
| `admin.platformRole.user` | Utilisateur |
| `admin.platformRole.content_editor` | Éditeur de contenus |
| `admin.platformRole.support_agent` | Support |
| `admin.platformRole.platform_admin` | Administrateur |
| `admin.memberRole.talent` | Talent |
| `admin.memberRole.org_owner` | Propriétaire d'organisation |
| `admin.memberRole.org_admin` | Administrateur d'organisation |
| `admin.memberRole.recruiter` | Recruteur |
| `admin.memberRole.hiring_manager` | Responsable du recrutement |
| `admin.memberRole.viewer` | Lecteur |
| `admin.memberRole.partner_manager` | Gestionnaire partenaire |

### `/admin/journal` · Journal d'audit

*Qui a fait quoi, sur quoi, avec quel motif. Lecture seule (administrateurs et support).*

| Clé | Texte |
|---|---|
| `admin.journal.title` | Journal d'audit |
| `admin.journal.subtitle` | Chaque action d'administration, avec son auteur, sa cible et son motif. |
| `admin.journal.filter.actor` | Auteur : nom ou e-mail |
| `admin.journal.filter.family` | Action |
| `admin.journal.filter.target` | Cible |
| `admin.journal.filter.period` | Période |
| `admin.journal.filter.all` | Toutes |
| `admin.journal.filter.allPeriods` | Depuis le début |
| `admin.journal.filter.days` | {count, plural, one {Dernières 24 heures} other {# derniers jours}} |
| `admin.journal.filter.oneTarget` | Une seule cible |
| `admin.journal.filter.clear` | Effacer les filtres |
| `admin.journal.count` | {count, plural, =0 {Aucune action} one {# action} other {# actions}} |
| `admin.journal.export` | Exporter en CSV |
| `admin.journal.col.when` | Date |
| `admin.journal.col.who` | Auteur |
| `admin.journal.col.what` | Action |
| `admin.journal.col.target` | Cible |
| `admin.journal.col.reason` | Motif |
| `admin.journal.system` | Jumanly (automatique) |
| `admin.journal.deletedActor` | Compte supprimé |
| `admin.journal.noReason` | Sans motif |
| `admin.journal.reasonLabel` | Motif : {reason} |
| `admin.journal.empty.title` | Aucune action ne correspond |
| `admin.journal.empty.text` | Élargissez la période ou retirez un filtre. |
| `admin.journal.stats.today` | Aujourd'hui |
| `admin.journal.stats.week` | 7 derniers jours |
| `admin.journal.stats.actors` | Personnes actives (7 jours) |
| `admin.journal.stats.sensitive` | Actions sensibles (7 jours) |
| `admin.journal.csv.file` | journal-audit-jumanly |
| `admin.journal.csv.action` | Code de l'action |
| `admin.journal.csv.targetId` | Identifiant de la cible |
| `admin.journal.history.title` | Historique |
| `admin.journal.history.empty` | Aucune action enregistrée sur cette fiche. |
| `admin.journal.history.all` | Tout l'historique |
| `admin.journal.action.user_suspend` | a suspendu le compte |
| `admin.journal.action.user_unsuspend` | a réactivé le compte |
| `admin.journal.action.user_role` | a changé le rôle plateforme |
| `admin.journal.action.org_verification_verify` | a vérifié l'organisation |
| `admin.journal.action.org_verification_reject` | a refusé la vérification |
| `admin.journal.action.org_verification_request` | a demandé la vérification |
| `admin.journal.action.org_invite` | a invité un membre |
| `admin.journal.action.org_transferOwnership` | a transféré la propriété |
| `admin.journal.action.org_document_add` | a joint des justificatifs |
| `admin.journal.action.org_document_view` | a consulté un justificatif |
| `admin.journal.action.org_verification_info` | a demandé un complément |
| `admin.journal.action.org_suspend` | a suspendu l'organisation |
| `admin.journal.action.org_unsuspend` | a réactivé l'organisation |
| `admin.journal.action.plan_update` | a modifié le forfait |
| `admin.journal.action.plan_create` | a créé le forfait |
| `admin.journal.action.plan_duplicate` | a dupliqué un forfait |
| `admin.journal.action.plan_withdraw` | a retiré le forfait de la vente |
| `admin.journal.action.plan_delete` | a supprimé le forfait |
| `admin.journal.action.subscription_extend` | a prolongé l'abonnement |
| `admin.journal.action.subscription_plan` | a changé le forfait de l'abonnement |
| `admin.journal.action.subscription_cancel` | a résilié l'abonnement |
| `admin.journal.action.payment_manual` | a enregistré un paiement manuel |
| `admin.journal.action.payment_refund` | a remboursé le paiement |
| `admin.journal.action.course_create` | a créé la formation |
| `admin.journal.action.course_update` | a modifié la fiche de la formation |
| `admin.journal.action.course_status` | a changé le statut de la formation |
| `admin.journal.action.course_module_add` | a ajouté un module |
| `admin.journal.action.course_module_rename` | a renommé un module |
| `admin.journal.action.course_module_delete` | a supprimé un module |
| `admin.journal.action.course_module_move` | a déplacé un module |
| `admin.journal.action.course_lesson_move` | a déplacé une leçon |
| `admin.journal.action.course_document_add` | a ajouté un document PDF |
| `admin.journal.action.course_document_update` | a modifié un document PDF |
| `admin.journal.action.course_document_replace` | a remplacé le fichier d'un document PDF |
| `admin.journal.action.course_document_delete` | a supprimé un document PDF |
| `admin.journal.action.course_document_move` | a déplacé un document PDF |
| `admin.journal.action.course_pdf_download` | a téléchargé un PDF de formation |
| `admin.journal.action.course_lesson_add` | a ajouté une leçon |
| `admin.journal.action.course_lesson_update` | a modifié une leçon |
| `admin.journal.action.course_lesson_delete` | a supprimé une leçon |
| `admin.journal.action.course_quiz_update` | a modifié le quiz |
| `admin.journal.action.course_question_save` | a enregistré une question |
| `admin.journal.action.course_question_delete` | a supprimé une question |
| `admin.journal.action.course_duplicate` | a dupliqué une formation |
| `admin.journal.action.course_cover` | a changé l'image de couverture |
| `admin.journal.action.course_lesson_video` | a envoyé la vidéo d'une leçon |
| `admin.journal.action.certificate_revoke` | a révoqué une attestation |
| `admin.journal.action.job_approve` | a accepté l'offre |
| `admin.journal.action.job_refuse` | a refusé l'offre |
| `admin.journal.action.job_publish` | a publié l'offre |
| `admin.journal.action.job_close` | a clôturé l'offre |
| `admin.journal.action.job_duplicate` | a dupliqué l'offre |
| `admin.journal.action.job_assign` | a attribué l'offre |
| `admin.journal.action.report_dismiss` | a classé le signalement |
| `admin.journal.action.report_hide` | a masqué le contenu signalé |
| `admin.journal.action.report_warn` | a averti l'auteur du contenu signalé |
| `admin.journal.action.report_note` | a ajouté une note interne au signalement |
| `admin.journal.action.report_context` | a lu le contexte d'un message signalé |
| `admin.journal.action.job_changes` | a demandé une correction de l'offre |
| `admin.journal.action.job_resubmit` | a renvoyé l'offre corrigée |
| `admin.journal.action.partner_create` | a créé le partenaire |
| `admin.journal.action.partner_batch` | a créé un lot de licences |
| `admin.journal.action.partner_inviteManager` | a invité un gestionnaire partenaire |
| `admin.journal.action.partner_update` | a modifié le partenaire |
| `admin.journal.action.partner_batch_update` | a modifié un lot de licences |
| `admin.journal.action.partner_batch_extend` | a prolongé un lot de licences |
| `admin.journal.action.license_activate` | a activé une licence |
| `admin.journal.action.license_codes` | a généré des codes |
| `admin.journal.action.license_invite` | a envoyé des invitations |
| `admin.journal.action.license_link` | a créé un lien d'invitation |
| `admin.journal.action.license_reinvite` | a relancé une invitation |
| `admin.journal.action.license_revoke` | a retiré une licence |
| `admin.journal.action.matching_weights_update` | a modifié les poids du matching |
| `admin.journal.action.match_dispute_confirmed` | a confirmé un score contesté |
| `admin.journal.action.match_dispute_corrected` | a corrigé un score contesté |
| `admin.journal.action.match_dispute_in_review` | a pris en charge une contestation de score |
| `admin.journal.target.message` | Message |
| `admin.journal.target.platform` | Plateforme |
| `admin.journal.target.matchingWeights` | Poids du matching |
| `admin.journal.target.talentProfile` | Profil talent |
| `admin.journal.target.licenseBatch` | Lot de licences |
| `admin.journal.action.content_faq_save` | a enregistré une question de la FAQ |
| `admin.journal.action.content_faq_hide` | a masqué une question de la FAQ |
| `admin.journal.action.content_faq_reset` | a rétabli une question de la FAQ |
| `admin.journal.action.content_banner_save` | a enregistré une bannière |
| `admin.journal.action.content_banner_delete` | a supprimé une bannière |
| `admin.journal.action.content_tip_save` | a enregistré une fiche conseil |
| `admin.journal.action.content_restore` | a restauré une version précédente d'un contenu |
| `admin.journal.action.profile_view` | a consulté un profil |
| `admin.journal.action.talent_search` | a cherché des talents |
| `admin.journal.action.security_abnormalUsage` | usage anormal détecté |
| `admin.journal.action.admin_indicators_export` | a exporté les indicateurs |
| `admin.journal.action.admin_audit_export` | a exporté le journal d'audit |
| `admin.journal.family.user` | Comptes |
| `admin.journal.family.org` | Organisations |
| `admin.journal.family.plan` | Forfaits |
| `admin.journal.family.payment` | Paiements |
| `admin.journal.family.subscription` | Abonnements |
| `admin.journal.family.course` | Formations |
| `admin.journal.family.certificate` | Attestations |
| `admin.journal.family.job` | Offres |
| `admin.journal.family.report` | Signalements |
| `admin.journal.family.partner` | Partenaires |
| `admin.journal.family.license` | Licences |
| `admin.journal.family.matching` | Poids du matching |
| `admin.journal.family.match` | Contestations de score |
| `admin.journal.family.content` | Contenus |
| `admin.journal.family.profile` | Consultations de profil |
| `admin.journal.family.talent` | Recherches de talents |
| `admin.journal.family.security` | Sécurité |
| `admin.journal.family.admin` | Exports |
| `admin.journal.target.user` | Compte |
| `admin.journal.target.organization` | Organisation |
| `admin.journal.target.plan` | Forfait |
| `admin.journal.target.subscription` | Abonnement |
| `admin.journal.target.payment` | Paiement |
| `admin.journal.target.course` | Formation |
| `admin.journal.target.certificate` | Attestation |
| `admin.journal.target.job` | Offre |
| `admin.journal.target.report` | Signalement |
| `admin.journal.target.license` | Licence |
| `admin.journal.target.matchDispute` | Contestation de score |
| `admin.journal.target.content` | Contenu |

### `/admin/recherche` · Recherche globale

| Clé | Texte |
|---|---|
| `admin.search.title` | Recherche |
| `admin.search.label` | Rechercher un compte, une organisation, une offre, une formation ou un forfait |
| `admin.search.labelEditor` | Rechercher une formation |
| `admin.search.placeholder` | Nom, e-mail, titre ou identifiant |
| `admin.search.submit` | Rechercher |
| `admin.search.hint` | Saisissez au moins 2 caractères. |
| `admin.search.results` | {count, plural, =0 {Aucun résultat pour « {q} »} one {# résultat pour « {q} »} other {# résultats pour « {q} »}} |
| `admin.search.empty.title` | Rien trouvé |
| `admin.search.empty.text` | Vérifiez l'orthographe, ou cherchez par e-mail ou par identifiant. |
| `admin.search.kind.users` | Comptes |
| `admin.search.kind.organizations` | Organisations |
| `admin.search.kind.jobs` | Offres |
| `admin.search.kind.courses` | Formations |
| `admin.search.kind.plans` | Forfaits |
| `admin.search.more` | Voir tous les résultats |
| `admin.search.open` | Ouvrir |

### `/admin` · Indicateurs

*Suivre la santé économique et l'usage de la plateforme (note conceptuelle § 11).*

| Clé | Texte |
|---|---|
| `admin.dashboard.title` | Indicateurs |
| `admin.dashboard.banner.subtitle` | Les {days} derniers jours en un coup d'œil : ce qui avance, et ce qui attend une décision. |
| `admin.dashboard.banner.attention` | Éléments à traiter |
| `admin.dashboard.period` | Période |
| `admin.dashboard.compare` | Comparer à la période précédente |
| `admin.dashboard.kpi.usersFree` | Utilisateurs gratuits |
| `admin.dashboard.kpi.usersPaid` | Utilisateurs payants |
| `admin.dashboard.kpi.usersSponsored` | Utilisateurs sponsorisés |
| `admin.dashboard.kpi.conversion` | Conversion Free vers payant |
| `admin.dashboard.kpi.mrr` | Revenu mensuel récurrent |
| `admin.dashboard.kpi.renewal` | Taux de renouvellement |
| `admin.dashboard.kpi.cac` | Coût d'acquisition client |
| `admin.dashboard.kpi.costPerUser` | Coût de fonctionnement par utilisateur |
| `admin.dashboard.kpi.aiCost` | Dépenses IA |
| `admin.dashboard.kpi.grossMargin` | Marge brute |
| `admin.dashboard.kpi.activeCompanies` | Comptes entreprises actifs |
| `admin.dashboard.kpi.institutionalRevenue` | Revenus des contrats institutionnels |
| `admin.dashboard.kpi.value.currency` | {amount} {currency} |
| `admin.dashboard.kpi.value.percent` | {value, number} % |
| `admin.dashboard.kpi.revenue30` | Encaissé sur 30 jours |
| `admin.dashboard.kpi.none` | Pas encore de données |
| `admin.dashboard.kpi.period` | Sur les 30 derniers jours : conversion des comptes créés, renouvellement des périodes arrivées à échéance, dépenses IA estimées. |
| `admin.dashboard.kpi.delta` | {delta} % par rapport à la période précédente |
| `admin.dashboard.byFamily` | Par famille : Talents, RH, Companies, Partners |
| `admin.dashboard.byPlan` | Par forfait |
| `admin.dashboard.activity.title` | Activité |
| `admin.dashboard.activity.signups` | Inscriptions |
| `admin.dashboard.activity.applications` | Candidatures |
| `admin.dashboard.activity.jobs` | Offres publiées |
| `admin.dashboard.activity.certificates` | Attestations délivrées |
| `admin.dashboard.alerts.title` | À traiter |
| `admin.dashboard.alerts.verifications` | {count, plural, one {# vérification d'organisation en attente} other {# vérifications d'organisation en attente}} |
| `admin.dashboard.alerts.jobs` | {count, plural, one {# offre à modérer} other {# offres à modérer}} |
| `admin.dashboard.alerts.reports` | {count, plural, one {# signalement ouvert} other {# signalements ouverts}} |
| `admin.dashboard.alerts.disputes` | {count, plural, one {# révision de score demandée} other {# révisions de score demandées}} |
| `admin.dashboard.alerts.payments` | {count, plural, one {# paiement à vérifier} other {# paiements à vérifier}} |
| `admin.dashboard.export` | Exporter les indicateurs |
| `admin.dashboard.periodValue` | Période : {days} derniers jours |
| `admin.dashboard.periodOption` | {days} derniers jours |
| `admin.dashboard.kpi.vsPrevious` | vs période précédente |
| `admin.dashboard.kpi.deltaPercent` | {value} % |
| `admin.dashboard.kpi.deltaPoints` | {count, plural, one {{value} pt} other {{value} pts}} |
| `admin.dashboard.kpi.lowerIsBetter` | Pour un coût, une baisse est une bonne nouvelle. |
| `admin.dashboard.activity.monthly` | Mensuel |
| `admin.dashboard.activity.aria` | Activité mois par mois, de {from} à {to} : inscriptions, candidatures, offres publiées et attestations délivrées. |
| `admin.dashboard.family.title` | Par famille |
| `admin.dashboard.family.hint` | Talents, RH, Companies, Partners |
| `admin.dashboard.family.talent` | Talents |
| `admin.dashboard.family.rh` | RH |
| `admin.dashboard.family.company` | Companies |
| `admin.dashboard.family.partner` | Partners |
| `admin.dashboard.plan.hint` | Comptes payants et sponsorisés |
| `admin.dashboard.plan.col.plan` | Forfait |
| `admin.dashboard.plan.col.subscribers` | Abonnés |
| `admin.dashboard.plan.col.revenue` | Revenu (USD) |
| `admin.dashboard.plan.col.margin` | Marge brute |
| `admin.dashboard.plan.empty` | Aucun compte payant ou sponsorisé pour l'instant. |
| `admin.dashboard.ai.other` | Autres |
| `admin.dashboard.ai.link` | Voir IA et matching |
| `admin.dashboard.ai.empty` | Aucun appel d'IA sur la période. |
| `admin.dashboard.alerts.empty` | Rien à traiter pour l'instant. |
| `admin.dashboard.csv.file` | indicateurs-jumanly |
| `admin.dashboard.csv.indicator` | Indicateur |
| `admin.dashboard.csv.value` | Valeur |
| `admin.dashboard.csv.previous` | Période précédente |
| `admin.dashboard.csv.plan` | Comptes {family} · {plan} |

### `/admin` · Indicateurs intelligents (v2)

| Clé | Texte |
|---|---|
| `admin.dashboard.hero` | Chiffres clés |
| `admin.dashboard.more` | Autres indicateurs |
| `admin.dashboard.kpi.activeUsers` | Utilisateurs actifs |
| `admin.dashboard.attention.title` | Ce qui demande votre attention |
| `admin.dashboard.attention.hint` | Du plus urgent au moins urgent |
| `admin.dashboard.attention.open` | Traiter |
| `admin.dashboard.attention.first` | Traiter : {item} |
| `admin.dashboard.attention.why` | Pourquoi ? |
| `admin.dashboard.attention.overdue` | En retard |
| `admin.dashboard.attention.oldest` | {days, plural, =0 {Le plus ancien date d'aujourd'hui} one {Le plus ancien attend depuis # jour} other {Le plus ancien attend depuis # jours}} |
| `admin.dashboard.attention.rank` | Priorité calculée : {score} points (type d'élément, plus 2 points par jour d'attente). |
| `admin.dashboard.attention.kind.payments` | {count, plural, one {# paiement bloqué} other {# paiements bloqués}} |
| `admin.dashboard.attention.kind.reports` | {count, plural, one {# signalement à traiter} other {# signalements à traiter}} |
| `admin.dashboard.attention.kind.disputes` | {count, plural, one {# score contesté à revoir} other {# scores contestés à revoir}} |
| `admin.dashboard.attention.kind.verifications` | {count, plural, one {# organisation à vérifier} other {# organisations à vérifier}} |
| `admin.dashboard.attention.kind.jobs` | {count, plural, one {# offre à modérer} other {# offres à modérer}} |
| `admin.dashboard.attention.kind.aiSpike` | Dépenses d'IA inhabituelles |
| `admin.dashboard.attention.kind.expiring` | {count, plural, one {# abonnement arrive à échéance sous 7 jours} other {# abonnements arrivent à échéance sous 7 jours}} |
| `admin.dashboard.attention.reason.payments` | Un paiement encore « en attente » après 15 minutes n'a pas reçu la confirmation du fournisseur : la personne a peut-être payé sans avoir accès. |
| `admin.dashboard.attention.reason.reports` | Une personne a signalé une offre ou un message. Tant qu'il n'est pas traité, le contenu reste visible. |
| `admin.dashboard.attention.reason.disputes` | Un talent a demandé la révision humaine de son score. La réponse est due en {due} jours au plus ; le plus ancien attend depuis {days} jours. |
| `admin.dashboard.attention.reason.verifications` | Une organisation attend sa vérification pour afficher le badge « vérifiée » et inspirer confiance aux candidats. |
| `admin.dashboard.attention.reason.jobs` | Le contrôle automatique a mis ces offres de côté. Elles ne sont pas publiées tant qu'une personne ne les a pas vues. |
| `admin.dashboard.attention.reason.aiSpike` | L'IA a coûté {lastDayCents, number} centimes USD ces dernières 24 heures, plus de {factor} fois la moyenne quotidienne du mois ({averageCents, number} centimes). |
| `admin.dashboard.attention.reason.expiring` | Les abonnements prépayés s'arrêtent à échéance sans renouvellement. Le plus proche se termine dans {days} jours. |
| `admin.dashboard.costs.title` | Coûts et rentabilité |
| `admin.dashboard.costs.empty` | Saisissez vos coûts mensuels pour calculer le coût d'acquisition, le coût par utilisateur et la marge. |
| `admin.dashboard.costs.total` | Coûts de la période, IA comprise : {amount}. |
| `admin.dashboard.costs.enter` | Saisir les coûts |
| `admin.dashboard.costs.edit` | Modifier les coûts |
| `admin.dashboard.plansUsed.title` | Forfaits utilisés |
| `admin.dashboard.plansUsed.hint` | Tous les comptes, forfaits gratuits compris. Un forfait ouvre la liste de ses comptes. |
| `admin.dashboard.plansUsed.accounts` | {count, plural, =0 {aucun compte} one {# compte} other {# comptes}} |
| `admin.dashboard.plansUsed.sponsored` | dont {count} offerts |

### `/admin/indicateurs/couts` · Coûts mensuels

| Clé | Texte |
|---|---|
| `admin.costs.title` | Coûts mensuels |
| `admin.costs.subtitle` | Vos coûts réels, mois par mois, en USD. Ils servent à calculer le coût d'acquisition, le coût par utilisateur et la marge brute. |
| `admin.costs.back` | Retour aux indicateurs |
| `admin.costs.form.title` | Saisir un mois |
| `admin.costs.form.month` | Mois |
| `admin.costs.form.amountHint` | Montant en USD, par exemple 120,50. Laissez vide pour zéro. |
| `admin.costs.form.note` | Note |
| `admin.costs.form.save` | Enregistrer les coûts |
| `admin.costs.category.acquisition` | Acquisition (publicité, campagnes) |
| `admin.costs.category.hosting` | Hébergement et services techniques |
| `admin.costs.category.ai_external` | IA hors Jumanly (abonnements, outils) |
| `admin.costs.category.other` | Autres coûts de fonctionnement |
| `admin.costs.saved` | Coûts du mois enregistrés. Les indicateurs sont à jour. |
| `admin.costs.error` | Vérifiez le mois et les montants (nombres positifs, deux décimales au plus). |
| `admin.costs.history.title` | 12 derniers mois |
| `admin.costs.history.month` | Mois |
| `admin.costs.history.total` | Total |
| `admin.costs.history.none` | Non saisi |
| `admin.costs.history.line` | {category} : {amount} USD |
| `admin.costs.history.edit` | Modifier |
| `admin.costs.aiNote` | Les dépenses d'IA de Jumanly sont déjà mesurées automatiquement : ne les saisissez pas ici. |
| `admin.costs.formula` | Coût d'acquisition = acquisition ÷ nouveaux comptes payants. Coût par utilisateur = coûts de fonctionnement (IA comprise) ÷ utilisateurs actifs. Marge brute = (revenus − coûts de fonctionnement) ÷ revenus. |
| `admin.journal.action.cost_save` | a saisi les coûts du mois |
| `admin.journal.family.cost` | Coûts |

### `/admin/utilisateurs` · Utilisateurs

| Clé | Texte |
|---|---|
| `admin.users.title` | Utilisateurs |
| `admin.users.search.placeholder` | Nom, e-mail ou identifiant |
| `admin.users.filter.plan` | Forfait |
| `admin.users.filter.role` | Rôle |
| `admin.users.filter.status` | Statut |
| `admin.users.filter.country` | Pays |
| `admin.users.col.name` | Nom |
| `admin.users.col.email` | E-mail |
| `admin.users.col.plan` | Forfait |
| `admin.users.col.roles` | Rôles |
| `admin.users.col.created` | Inscrit le |
| `admin.users.col.lastActive` | Dernière activité |
| `admin.users.col.status` | Statut |
| `admin.users.status.active` | Actif |
| `admin.users.status.unverified` | E-mail non vérifié |
| `admin.users.status.suspended` | Suspendu |
| `admin.users.status.deletionScheduled` | Suppression programmée |
| `admin.users.detail.title` | Fiche utilisateur |
| `admin.users.detail.account` | Compte |
| `admin.users.detail.subscription` | Abonnement |
| `admin.users.detail.memberships` | Organisations |
| `admin.users.detail.quotas` | Quotas et consommation |
| `admin.users.detail.activity` | Activité |
| `admin.users.detail.privateNote` | Les messages privés, CV et documents des utilisateurs ne sont pas visibles depuis l'administration. |
| `admin.users.action.suspend.text` | Suspendre le compte |
| `admin.users.action.suspend.confirm` | Suspendre {userName} ? Il ne pourra plus se connecter. |
| `admin.users.action.suspend.reason` | Motif (communiqué par e-mail à l'utilisateur) |
| `admin.users.action.unsuspend` | Réactiver le compte |
| `admin.users.action.roles.text` | Modifier les rôles plateforme |
| `admin.users.action.roles.warning` | Les rôles plateforme donnent accès à l'administration. Attribuez-les avec prudence. |
| `admin.users.action.resendVerification` | Renvoyer l'e-mail de vérification |
| `admin.users.action.resetPassword` | Envoyer un lien de réinitialisation |
| `admin.users.action.grantPlan.text` | Attribuer un forfait manuellement |
| `admin.users.action.grantPlan.until` | Jusqu'au |
| `admin.users.action.exportData` | Générer l'export de ses données |
| `admin.users.action.delete.text` | Supprimer le compte |
| `admin.users.action.delete.confirm` | Supprimer définitivement le compte de {userName} ? Cette action est irréversible. |
| `admin.users.suspended` | Compte suspendu. |
| `admin.users.updated` | Utilisateur mis à jour. |
| `admin.users.supportReadOnly` | Votre rôle Support permet de consulter les comptes et abonnements, sans les modifier. |
| `admin.users.search.submit` | Rechercher |
| `admin.users.empty` | Aucun utilisateur ne correspond à cette recherche. |
| `admin.users.role.user` | Aucun rôle plateforme |
| `admin.users.action.roles.save` | Enregistrer le rôle |
| `admin.users.selfProtected` | Vous ne pouvez pas modifier votre propre rôle ni suspendre votre propre compte. |
| `admin.users.count` | {count, plural, one {# utilisateur} other {# utilisateurs}} |
| `admin.users.stats.total` | Comptes |
| `admin.users.summary` | Forfait : {plan} · inscrit le {date} |
| `admin.users.filter.all` | Tous |
| `admin.users.detail.id` | Identifiant |
| `admin.users.detail.method` | Moyen |
| `admin.users.detail.planPrice` | {plan} · {price} USD/mois |
| `admin.users.detail.until` | {status} jusqu'au {date} |
| `admin.users.detail.noEnd` | Sans échéance |
| `admin.users.detail.noMembership` | Aucune appartenance |
| `admin.users.detail.noQuota` | Aucun quota mesuré pour ce forfait. |
| `admin.users.detail.applications` | Candidatures |
| `admin.users.detail.coursesInProgress` | Formations en cours |
| `admin.users.detail.certificates` | Attestations |
| `admin.users.detail.actions` | Actions sur le compte |
| `admin.users.neverActive` | Aucune connexion |
| `admin.users.list` | Liste des utilisateurs |

### `/admin/utilisateurs` · fiche v2 (vérification, droits, export, suppression)

| Clé | Texte |
|---|---|
| `admin.users.status.deleted` | Supprimé |
| `admin.users.deletedName` | Compte supprimé |
| `admin.users.deletedNote` | Ce compte a été supprimé et anonymisé. Ses candidatures et paiements sont conservés sans données personnelles. |
| `admin.users.col.verification` | Vérification |
| `admin.users.verification.email` | E-mail vérifié |
| `admin.users.verification.emailMissing` | E-mail non vérifié |
| `admin.users.verification.twoFactor` | Double authentification |
| `admin.users.verification.twoFactorShort` | 2FA |
| `admin.users.detail.check` | Vérification du compte |
| `admin.users.detail.email` | E-mail |
| `admin.users.detail.emailVerified` | Vérifié |
| `admin.users.detail.emailUnverified` | Non vérifié |
| `admin.users.detail.twoFactor` | Double authentification |
| `admin.users.detail.twoFactorOn` | Activée |
| `admin.users.detail.twoFactorOff` | Désactivée |
| `admin.users.detail.methods` | Connexion par |
| `admin.users.detail.noMethod` | Aucun moyen de connexion |
| `admin.users.detail.lastSignIn` | Dernière connexion |
| `admin.users.detail.certificateList` | Attestations obtenues |
| `admin.users.detail.noCertificate` | Aucune attestation pour l'instant. |
| `admin.users.detail.certificateLine` | {course} · {date} |
| `admin.users.detail.revoked` | Retirée |
| `admin.users.method.credential` | Mot de passe |
| `admin.users.method.google` | Google |
| `admin.users.method.linkedin` | LinkedIn |
| `admin.users.method.apple` | Apple |
| `admin.users.method.magicLink` | Lien par e-mail |
| `admin.users.action.verifyEmail.text` | Marquer l'e-mail comme vérifié |
| `admin.users.action.verifyEmail.confirm` | Marquer l'adresse {email} comme vérifiée ? Faites-le seulement si vous avez confirmé par un autre moyen qu'elle appartient bien à cette personne. |
| `admin.users.action.verifyEmail.reason` | Comment l'adresse a été confirmée |
| `admin.users.action.verifyEmail.submit` | Marquer comme vérifié |
| `admin.users.action.resendHint` | Un nouveau code est envoyé à l'adresse du compte. |
| `admin.users.action.grantPlan.confirm` | Le forfait choisi s'applique tout de suite et s'arrête seul à la date indiquée, sans paiement. Le forfait payé ou la licence de la personne, s'il en a un, n'est pas modifié. |
| `admin.users.action.grantPlan.plan` | Forfait offert |
| `admin.users.action.grantPlan.submit` | Offrir le forfait |
| `admin.users.action.grantPlan.revoke` | Retirer |
| `admin.users.action.grantPlan.revokeTitle` | Retirer le forfait offert |
| `admin.users.action.grantPlan.revokeConfirm` | Retirer le forfait {plan} offert jusqu'au {date} ? La personne revient à son forfait habituel. |
| `admin.users.action.credits.text` | Ajouter des crédits |
| `admin.users.action.credits.confirm` | Les crédits s'ajoutent au quota de la période en cours, jusqu'à la date indiquée. Un nouvel ajout remplace le précédent et s'y additionne. |
| `admin.users.action.credits.quota` | Quota |
| `admin.users.action.credits.amount` | Nombre à ajouter |
| `admin.users.action.credits.current` | Aujourd'hui : {used} utilisé(s) sur {limit}. |
| `admin.users.action.credits.submit` | Ajouter |
| `admin.users.action.credits.none` | Le forfait de cette personne n'a pas de quota à augmenter (tout est illimité ou non inclus). |
| `admin.users.action.override.removeTitle` | Retirer l'ajout |
| `admin.users.action.override.removeConfirm` | Retirer l'ajout sur « {right} » ? La valeur du forfait s'applique de nouveau. |
| `admin.users.action.exportHint` | Fichier JSON avec tout ce que Jumanly conserve sur la personne (droit d'accès). Le téléchargement est journalisé. |
| `admin.users.action.delete.intro` | Le compte est anonymisé : nom, e-mail, profil, CV, expériences et historique sont effacés ; les candidatures et paiements sont conservés sans données personnelles. La personne ne peut plus se connecter. |
| `admin.users.action.delete.step1` | Étape 1 sur 2 · Motif |
| `admin.users.action.delete.step2` | Étape 2 sur 2 · Confirmation |
| `admin.users.action.delete.continue` | Continuer |
| `admin.users.action.delete.reasonShown` | Motif : {reason} |
| `admin.users.action.delete.typeEmail` | Saisissez l'e-mail du compte pour confirmer ({email}) |
| `admin.users.action.delete.submit` | Supprimer définitivement |
| `admin.users.action.until` | Jusqu'au |
| `admin.users.action.reason` | Motif |
| `admin.users.block.self` | Vous ne pouvez pas supprimer votre propre compte. |
| `admin.users.block.lastAdmin` | C'est le dernier administrateur de la plateforme : nommez-en un autre avant de supprimer ce compte. |
| `admin.users.block.owner` | Cette personne est propriétaire d'une organisation : la propriété doit être transférée avant la suppression. |
| `admin.users.block.deleted` | Ce compte est déjà supprimé. |
| `admin.users.done.codeSent` | Code de vérification envoyé. |
| `admin.users.done.resetSent` | Lien de réinitialisation envoyé. |
| `admin.users.done.verified` | Adresse e-mail marquée comme vérifiée. |
| `admin.users.done.planGranted` | Forfait offert. |
| `admin.users.done.planRevoked` | Forfait offert retiré. |
| `admin.users.done.creditsAdded` | Crédits ajoutés. |
| `admin.users.done.overrideRemoved` | Ajout retiré. |
| `admin.users.done.deleted` | Compte supprimé et anonymisé. |
| `admin.users.error.champs` | Vérifiez les champs du formulaire. |
| `admin.users.error.motif` | Indiquez un motif (3 caractères au moins). |
| `admin.users.error.until` | Choisissez une date de fin entre demain et dans deux ans. |
| `admin.users.error.plan` | Ce forfait ne peut pas être offert. |
| `admin.users.error.quota` | Ce quota n'existe pas dans le forfait de la personne. |
| `admin.users.error.unlimited` | Ce quota est déjà illimité. |
| `admin.users.error.grant` | Ce forfait offert n'existe plus. |
| `admin.users.error.confirm` | L'e-mail saisi ne correspond pas au compte, ou l'envoi a échoué. |
| `admin.users.error.self` | Vous ne pouvez pas faire cette action sur votre propre compte. |
| `admin.users.error.lastAdmin` | C'est le dernier administrateur de la plateforme. |
| `admin.users.error.owner` | Cette personne est propriétaire d'une organisation. |
| `admin.users.error.deleted` | Ce compte est supprimé. |
| `admin.users.rights.title` | Droits et quotas |
| `admin.users.rights.intro` | Ce que le compte peut faire aujourd'hui, et d'où vient chaque droit. |
| `admin.users.rights.col.right` | Droit |
| `admin.users.rights.col.value` | Valeur |
| `admin.users.rights.col.used` | Utilisé |
| `admin.users.rights.col.source` | Origine |
| `admin.users.rights.source.plan` | Forfait payé |
| `admin.users.rights.source.license` | Licence partenaire |
| `admin.users.rights.source.gift` | Forfait offert |
| `admin.users.rights.source.free` | Forfait gratuit |
| `admin.users.rights.source.override` | Ajout manuel |
| `admin.users.rights.overrideUntil` | Ajout jusqu'au {date} |
| `admin.users.rights.overrideNoEnd` | Ajout sans échéance |
| `admin.users.rights.planLine` | Forfait {plan} |
| `admin.users.rights.granted` | Forfaits offerts en cours |
| `admin.users.rights.grantedLine` | {plan} jusqu'au {date} |
| `admin.users.rights.yes` | Inclus |
| `admin.users.rights.no` | Non inclus |
| `admin.users.rights.unlimited` | Illimité |
| `admin.users.rights.contract` | Selon contrat |
| `admin.users.rights.usedOf` | {used} sur {limit} |
| `admin.users.rights.usedOnly` | {used} |
| `admin.users.export.selection` | Exporter en CSV |
| `admin.users.export.hint` | Cochez des comptes pour n'exporter qu'eux ; sinon toute la liste filtrée est exportée. L'export est journalisé. |
| `admin.users.export.select` | Sélectionner {name} |
| `admin.users.csv.file` | jumanly-utilisateurs |
| `admin.users.csv.id` | Identifiant |
| `admin.users.csv.emailVerified` | E-mail vérifié |
| `admin.users.csv.twoFactor` | Double authentification |
| `admin.users.csv.yes` | oui |
| `admin.users.csv.no` | non |

### Jumanly Admin · noms des droits et des niveaux

| Clé | Texte |
|---|---|
| `admin.entitlement.jobs_apply` | Postuler aux offres |
| `admin.entitlement.jobs_track` | Suivre ses candidatures |
| `admin.entitlement.connect_messaging_application` | Messagerie liée aux candidatures |
| `admin.entitlement.career_diagnostic_level` | Diagnostic de carrière |
| `admin.entitlement.career_cv_templates_access` | Modèles de CV |
| `admin.entitlement.career_cv_tailor` | CV adapté à une offre |
| `admin.entitlement.career_documents` | Documents de candidature |
| `admin.entitlement.career_linkedin` | Optimisation LinkedIn |
| `admin.entitlement.career_progress_plan` | Plan de progression |
| `admin.entitlement.career_progress_plan_recommendations` | Recommandations du plan de progression |
| `admin.entitlement.career_portfolio_level` | Portfolio |
| `admin.entitlement.career_tools_extended` | Outils de carrière avancés |
| `admin.entitlement.career_interview_text_monthly` | Simulations d'entretien écrites par mois |
| `admin.entitlement.career_interview_voice_monthly` | Simulations d'entretien vocales par mois |
| `admin.entitlement.learn_catalog_level` | Catalogue de formations |
| `admin.entitlement.learn_exercises_job_specific` | Exercices par métier |
| `admin.entitlement.learn_resources_specialized` | Ressources spécialisées |
| `admin.entitlement.ai_credits_monthly` | Crédits d'assistance IA par mois |
| `admin.entitlement.reports_progress_detailed` | Rapport de progression détaillé |
| `admin.entitlement.support_priority` | Support prioritaire |
| `admin.entitlement.org_seats` | Sièges |
| `admin.entitlement.org_seats_min` | Sièges garantis |
| `admin.entitlement.jobs_active_max` | Offres actives |
| `admin.entitlement.hire_pipeline_level` | Suivi des candidatures |
| `admin.entitlement.hire_talent_search` | Recherche dans le vivier |
| `admin.entitlement.hire_talent_search_monthly` | Recherches dans le vivier par mois |
| `admin.entitlement.hire_contact_requests_monthly` | Demandes de mise en relation par mois |
| `admin.entitlement.hire_matching_level` | Matching |
| `admin.entitlement.hire_cv_analysis` | Analyse des CV |
| `admin.entitlement.hire_shortlist` | Présélection |
| `admin.entitlement.hire_collaboration` | Recrutement en équipe |
| `admin.entitlement.hire_scorecards` | Grilles d'évaluation |
| `admin.entitlement.hire_decision_history` | Historique des décisions |
| `admin.entitlement.connect_appointments` | Prise de rendez-vous |
| `admin.entitlement.org_verified_profile` | Profil d'entreprise vérifié |
| `admin.entitlement.org_teams` | Équipes |
| `admin.entitlement.org_entities` | Entités et filiales |
| `admin.entitlement.org_permissions_level` | Permissions |
| `admin.entitlement.org_talent_pools_shared` | Viviers partagés |
| `admin.entitlement.reports_level` | Rapports |
| `admin.entitlement.reports_export` | Export des rapports |
| `admin.entitlement.hire_workflows_custom` | Processus personnalisés |
| `admin.entitlement.integrations` | Intégrations |
| `admin.entitlementLevel.none` | Non inclus |
| `admin.entitlementLevel.simple` | Simple |
| `admin.entitlementLevel.personalized` | Personnalisé |
| `admin.entitlementLevel.free` | Gratuit |
| `admin.entitlementLevel.starter` | Starter |
| `admin.entitlementLevel.pro` | Pro |
| `admin.entitlementLevel.standard` | Standard |
| `admin.entitlementLevel.enriched` | Enrichi |
| `admin.entitlementLevel.fundamentals` | Fondamentaux |
| `admin.entitlementLevel.advanced` | Avancé |
| `admin.entitlementLevel.multi` | Plusieurs étapes |
| `admin.entitlementLevel.deep` | Approfondi |
| `admin.entitlementLevel.suggestions` | Suggestions |
| `admin.entitlementLevel.explainable` | Explicable |
| `admin.entitlementLevel.basic` | Basique |
| `admin.entitlementLevel.stats` | Statistiques |
| `admin.entitlementLevel.consolidated` | Consolidé |
| `admin.entitlementLevel.custom` | Sur mesure |
| `admin.journal.action.user_email_verify` | a marqué l'e-mail comme vérifié |
| `admin.journal.action.user_email_resend` | a renvoyé le code de vérification |
| `admin.journal.action.user_password_reset` | a envoyé un lien de réinitialisation du mot de passe |
| `admin.journal.action.user_plan_grant` | a offert un forfait |
| `admin.journal.action.user_plan_revoke` | a retiré un forfait offert |
| `admin.journal.action.user_quota_add` | a ajouté des crédits |
| `admin.journal.action.user_quota_remove` | a retiré un ajout de crédits |
| `admin.journal.action.user_export` | a exporté les données du compte |
| `admin.journal.action.user_export_list` | a exporté la liste des utilisateurs |
| `admin.journal.action.user_delete` | a supprimé le compte |
| `admin.journal.reason.scheduled` | Suppression demandée par la personne (délai de 30 jours écoulé) |

### `/admin/organisations` · Organisations et vérification

| Clé | Texte |
|---|---|
| `admin.orgs.title` | Organisations |
| `admin.orgs.tab.all` | Toutes |
| `admin.orgs.tab.pending` | Vérifications en attente ({count}) |
| `admin.orgs.tab.verified` | Vérifiées |
| `admin.orgs.tab.partners` | Partenaires |
| `admin.orgs.col.name` | Organisation |
| `admin.orgs.col.type` | Type |
| `admin.orgs.col.plan` | Forfait |
| `admin.orgs.col.seats` | Membres |
| `admin.orgs.col.activeJobs` | Offres actives |
| `admin.orgs.col.verification` | Vérification |
| `admin.orgs.verify.title` | Vérifier {org} |
| `admin.orgs.verify.documents` | Documents fournis |
| `admin.orgs.verify.checklist` | Points à contrôler |
| `admin.orgs.verify.check.registration` | Immatriculation cohérente avec le nom déclaré |
| `admin.orgs.verify.check.domain` | E-mail sur le domaine de l'organisation confirmé |
| `admin.orgs.verify.check.mandate` | Rôle du demandeur justifié |
| `admin.orgs.verify.check.website` | Site web ou présence publique cohérente |
| `admin.orgs.verify.approve` | Approuver la vérification |
| `admin.orgs.verify.reject.text` | Refuser |
| `admin.orgs.verify.reject.reason` | Motif communiqué à l'organisation |
| `admin.orgs.verify.requestMore` | Demander un complément |
| `admin.orgs.verify.approved` | {org} est vérifiée. |
| `admin.orgs.verify.rejected` | Vérification refusée. L'organisation a été prévenue par e-mail. |
| `admin.orgs.revoke.text` | Retirer le badge vérifié |
| `admin.orgs.revoke.confirm` | Retirer le badge de {org} ? Ses offres n'afficheront plus « Entreprise vérifiée ». |
| `admin.orgs.suspend.text` | Suspendre l'organisation |
| `admin.orgs.suspend.confirm` | Suspendre {org} ? Ses offres seront retirées et ses membres ne pourront plus accéder à l'espace Hire. Les candidats seront prévenus. |
| `admin.orgs.col.owner` | Propriétaire |
| `admin.orgs.col.requestedAt` | Demande du {date, date, medium} |
| `admin.orgs.tab.rejected` | Refusées |
| `admin.orgs.tab.none` | Non vérifiées |
| `admin.orgs.verify.field.registration` | Immatriculation : {value} |
| `admin.orgs.verify.field.taxId` | Identification fiscale : {value} |
| `admin.orgs.verify.field.domainEmail` | E-mail sur le domaine : {value} |
| `admin.orgs.verify.field.mandate` | Fonction du demandeur : {value} |
| `admin.orgs.verify.field.website` | Site web : {value} |
| `admin.orgs.verify.reasonRequired` | Indiquez le motif communiqué à l'organisation. |
| `admin.orgs.empty` | Aucune organisation dans cette liste. |
| `admin.orgs.tab.pendingShort` | En attente ({count}) |
| `admin.orgs.search` | Nom de l'organisation |
| `admin.orgs.filter.country` | Pays |
| `admin.orgs.filter.all` | Toutes |
| `admin.orgs.type.recruiter` | Cabinet RH |
| `admin.orgs.type.company` | Entreprise |
| `admin.orgs.type.partner` | Partenaire |
| `admin.orgs.status.none` | Non vérifiée |
| `admin.orgs.status.pending` | En attente |
| `admin.orgs.status.verified` | Vérifiée |
| `admin.orgs.status.rejected` | Refusée |
| `admin.orgs.doc.registration` | Immatriculation |
| `admin.orgs.doc.taxId` | Identification fiscale |
| `admin.orgs.doc.domainEmail` | E-mail sur le domaine |
| `admin.orgs.doc.mandate` | Fonction du demandeur |
| `admin.orgs.doc.website` | Site web |
| `admin.orgs.verify.noDocuments` | Aucun élément fourni pour l'instant. |
| `admin.orgs.list` | Liste des organisations |
| `admin.orgs.count` | {count, plural, one {# organisation} other {# organisations}} |
| `admin.orgs.members` | {count, plural, one {# membre} other {# membres}} |
| `admin.orgs.status.info_requested` | À compléter |
| `admin.orgs.tab.info` | Complément demandé |
| `admin.orgs.suspendedTag` | Suspendue |
| `admin.orgs.suspendedSince` | Suspendue le {date, date, medium} · {reason} |
| `admin.orgs.verify.files` | Justificatifs joints |
| `admin.orgs.verify.noFiles` | Aucun justificatif joint. |
| `admin.orgs.verify.fileOpen` | Ouvrir {name} |
| `admin.orgs.verify.fileMeta` | {size} · {date, date, medium} |
| `admin.orgs.verify.fileHint` | Chaque ouverture est enregistrée dans le journal. |
| `admin.orgs.verify.moreReason` | Ce qu'il manque (envoyé à l'organisation) |
| `admin.orgs.verify.moreSubmit` | Demander ce complément |
| `admin.orgs.verify.infoPending` | Complément demandé : {reason} |
| `admin.orgs.suspend.reason` | Motif (communiqué à l'organisation) |
| `admin.orgs.reactivate.text` | Réactiver l'organisation |
| `admin.orgs.reactivate.confirm` | Réactiver {org} ? Ses membres retrouvent l'espace recrutement et les offres fermées par la suspension sont republiées si leur date limite n'est pas passée. |
| `admin.orgs.reactivate.note` | Note (facultative) |
| `admin.orgs.done.infoRequested` | Demande de complément envoyée. |
| `admin.orgs.done.suspended` | Organisation suspendue. |
| `admin.orgs.done.reactivated` | Organisation réactivée. |
| `admin.orgs.error.status` | Cette action n'est plus possible dans l'état actuel de l'organisation. |
| `admin.orgs.error.reason` | Indiquez un motif (3 caractères au moins). |
| `admin.orgs.detail.members` | Membres et rôles |
| `admin.orgs.detail.noMember` | Aucun membre. |
| `admin.orgs.detail.memberSuspended` | suspendu |
| `admin.orgs.detail.plan` | Forfait et quotas |
| `admin.orgs.detail.quotaLine` | {used} sur {limit} |
| `admin.orgs.detail.quotaUnlimited` | {used} · illimité |
| `admin.orgs.detail.jobs` | Offres en ligne |
| `admin.orgs.detail.noJob` | Aucune offre en ligne. |
| `admin.orgs.detail.jobApplications` | {count, plural, =0 {aucune candidature} one {# candidature} other {# candidatures}} |
| `admin.orgs.detail.jobsSummary` | {published} en ligne · {closed} fermées · {total} au total |
| `admin.orgs.detail.subscriptions` | Voir ses abonnements et paiements |
| `admin.orgs.detail.allJobs` | Voir ses offres dans la modération |

### `/admin/forfaits` · Forfaits et droits

*Modifier forfaits, prix, droits et quotas sans redéploiement.*

| Clé | Texte |
|---|---|
| `admin.plans.title` | Forfaits et droits |
| `admin.plans.subtitle` | Les modifications s'appliquent sans redéploiement. Elles sont enregistrées dans le journal d'audit. |
| `admin.plans.family.talents` | Jumanly for Talents |
| `admin.plans.family.rh` | Jumanly for RH |
| `admin.plans.family.companies` | Jumanly for Companies |
| `admin.plans.family.partners` | Jumanly Partners |
| `admin.plans.col.code` | Code |
| `admin.plans.col.name` | Nom affiché |
| `admin.plans.col.price` | Prix |
| `admin.plans.col.interval` | Période |
| `admin.plans.col.subscribers` | Abonnés |
| `admin.plans.col.status` | Statut |
| `admin.plans.status.public` | Visible |
| `admin.plans.status.hidden` | Masqué |
| `admin.plans.status.quote` | Sur devis |
| `admin.plans.edit` | Modifier le forfait |
| `admin.plans.field.name` | Nom affiché |
| `admin.plans.field.tagline` | Accroche |
| `admin.plans.field.price` | Prix |
| `admin.plans.field.currency` | Devise |
| `admin.plans.field.interval.text` | Période de facturation |
| `admin.plans.field.interval.month` | Mensuel |
| `admin.plans.field.interval.quarter` | Trimestriel |
| `admin.plans.field.interval.year` | Annuel |
| `admin.plans.field.recommended` | Afficher le badge « Recommandé » |
| `admin.plans.field.purchasable` | Achetable en ligne |
| `admin.plans.field.order` | Ordre d'affichage |
| `admin.plans.entitlements.title` | Droits |
| `admin.plans.entitlements.key` | Clé de droit |
| `admin.plans.entitlements.type.text` | Type |
| `admin.plans.entitlements.type.feature` | Fonctionnalité |
| `admin.plans.entitlements.type.level` | Niveau |
| `admin.plans.entitlements.type.quota` | Quota par période |
| `admin.plans.entitlements.type.capacity` | Capacité |
| `admin.plans.entitlements.value.text` | Valeur |
| `admin.plans.entitlements.value.on` | Inclus |
| `admin.plans.entitlements.value.off` | Non inclus |
| `admin.plans.entitlements.value.unlimited` | Illimité (-1) |
| `admin.plans.entitlements.value.none` | Aucun (0) |
| `admin.plans.entitlements.provisional.text` | Provisoire |
| `admin.plans.entitlements.provisional.hint` | Valeur à calibrer selon les coûts techniques. |
| `admin.plans.entitlements.matrix` | Voir la matrice complète |
| `admin.plans.entitlements.inherit` | Comprend tout ce que propose {plan} |
| `admin.plans.guard.applyFree` | Le droit `jobs.apply` ne peut pas être désactivé : les candidatures sont gratuites pour tous. |
| `admin.plans.guard.freeRecruitable` | Aucun réglage ne peut réduire la visibilité d'un profil Free auprès des recruteurs. |
| `admin.plans.save.preview` | Aperçu de l'impact |
| `admin.plans.save.impact` | {count, plural, one {# abonné concerné} other {# abonnés concernés}}. Les quotas réduits s'appliquent à la prochaine période. |
| `admin.plans.save.confirm` | Appliquer les modifications |
| `admin.plans.saved` | Forfait mis à jour. |
| `admin.plans.priceChange.notice` | Un changement de prix s'applique aux nouveaux abonnements et aux renouvellements après information des abonnés. |
| `admin.plans.duplicate` | Dupliquer le forfait |
| `admin.plans.new` | Nouveau forfait |
| `admin.plans.back` | Tous les forfaits |
| `admin.plans.field.priceHelp` | En USD. Laisser vide pour « Sur devis ». |
| `admin.plans.field.public` | Visible sur la page Tarifs |
| `admin.plans.error.value` | Valeur non valable pour {key}. Pour un quota : un nombre entier, -1 pour illimité. |
| `admin.plans.error.price` | Indiquez un prix valable, par exemple 9.99. |
| `admin.plans.error.fields` | Vérifiez les informations du forfait : le nom est obligatoire et l'ordre d'affichage est un nombre entier. |
| `admin.plans.families` | Familles de forfaits |
| `admin.plans.familyShort.talents` | Talents |
| `admin.plans.familyShort.rh` | RH |
| `admin.plans.familyShort.companies` | Companies |
| `admin.plans.familyShort.partners` | Partners |
| `admin.plans.subscribersCount` | {count, plural, =0 {Aucun abonné} one {# abonné} other {# abonnés}} |
| `admin.plans.empty` | Aucun forfait dans cette famille. |
| `admin.plans.save.none` | Aucune modification pour l'instant. Modifiez un champ ou un droit pour voir son impact ici. |
| `admin.plans.save.readOnly` | Lecture seule : votre rôle ne permet pas de modifier les forfaits. |

### `/admin/forfaits` · versions, nouveau forfait, retrait (Admin v2, étape 5)

| Clé | Texte |
|---|---|
| `admin.plans.v2.field.family` | Famille |
| `admin.plans.v2.field.code.label` | Code du forfait |
| `admin.plans.v2.field.code.hint` | En minuscules, chiffres et « _ », par exemple talent_pro_2027. Il ne change plus ensuite. |
| `admin.plans.v2.field.name.label` | Nom affiché |
| `admin.plans.v2.field.name.hint` | Le nom vu par les clients. |
| `admin.plans.v2.new.confirm` | Le forfait part des droits du premier forfait de sa famille. Il est créé masqué et non vendu : réglez son prix et ses droits, puis mettez-le en vente. |
| `admin.plans.v2.new.submit` | Créer le forfait |
| `admin.plans.v2.duplicate.confirm` | Le double reprend le prix et les droits de {plan}. Il est créé masqué et non vendu, à vérifier avant mise en vente. |
| `admin.plans.v2.duplicate.name` | {plan} (copie) |
| `admin.plans.v2.duplicate.submit` | Créer le double |
| `admin.plans.v2.withdraw.text` | Retirer de la vente |
| `admin.plans.v2.withdraw.confirm` | {plan} ne sera plus visible ni achetable. {count, plural, =0 {Personne ne l'a en ce moment.} one {# abonné le garde jusqu'à son échéance.} other {# abonnés le gardent jusqu'à leur échéance.}} |
| `admin.plans.v2.delete.text` | Supprimer le forfait |
| `admin.plans.v2.delete.confirm` | {plan} n'a jamais servi : il sera supprimé avec ses droits. Cette action est définitive. |
| `admin.plans.v2.delete.used` | Ce forfait a déjà servi : il ne peut pas être supprimé, seulement retiré de la vente. |
| `admin.plans.v2.delete.free` | Forfait gratuit de la famille : il ne peut être ni supprimé ni retiré de la vente. |
| `admin.plans.v2.accounts` | {count, plural, =0 {Aucun compte sur ce forfait} one {# compte sur ce forfait} other {# comptes sur ce forfait}} |
| `admin.plans.v2.accountsLink` | Voir les comptes |
| `admin.plans.v2.reason.label` | Motif de la modification |
| `admin.plans.v2.reason.hint` | Enregistré avec la version du forfait. |
| `admin.plans.v2.history.title` | Versions du forfait |
| `admin.plans.v2.history.empty` | Aucune modification enregistrée pour l'instant. |
| `admin.plans.v2.history.price` | Prix |
| `admin.plans.v2.history.change` | {from} → {to} |
| `admin.plans.v2.done.created` | Forfait créé, masqué et non vendu. |
| `admin.plans.v2.done.createdHint` | Vérifiez son prix et ses droits, puis cochez « Visible » et « Achetable en ligne » pour le mettre en vente. |
| `admin.plans.v2.done.withdrawn` | Forfait retiré de la vente. |
| `admin.plans.v2.done.deleted` | Forfait supprimé. |
| `admin.plans.v2.error.reason` | Indiquez le motif de la modification (3 caractères au moins). |
| `admin.plans.v2.error.motif` | Indiquez un motif (3 caractères au moins). |
| `admin.plans.v2.error.champs` | Vérifiez le code (minuscules, chiffres et « _ ») et le nom du forfait. |
| `admin.plans.v2.error.taken` | Ce code de forfait existe déjà. Choisissez-en un autre. |
| `admin.plans.v2.error.used` | Ce forfait a déjà servi : retirez-le de la vente au lieu de le supprimer. |
| `admin.plans.v2.error.free` | Le forfait gratuit d'une famille ne peut être ni supprimé ni retiré de la vente. |
| `admin.plans.v2.error.notFound` | Forfait introuvable. |

### `/admin/abonnements` · Abonnements et paiements

| Clé | Texte |
|---|---|
| `admin.subscriptions.title` | Abonnements |
| `admin.subscriptions.filter.status` | Statut |
| `admin.subscriptions.status.trialing` | Essai |
| `admin.subscriptions.status.active` | Actif |
| `admin.subscriptions.status.past_due` | Délai de grâce |
| `admin.subscriptions.status.canceled` | Résilié (actif jusqu'à la fin de période) |
| `admin.subscriptions.status.expired` | Expiré |
| `admin.subscriptions.status.sponsored` | Sponsorisé |
| `admin.subscriptions.col.holder` | Titulaire |
| `admin.subscriptions.col.plan` | Forfait |
| `admin.subscriptions.col.periodEnd` | Fin de période |
| `admin.subscriptions.col.method` | Moyen de paiement |
| `admin.subscriptions.payments.title` | Paiements |
| `admin.subscriptions.payments.status.succeeded` | Réussi |
| `admin.subscriptions.payments.status.pending` | En attente de confirmation |
| `admin.subscriptions.payments.status.failed` | Échoué |
| `admin.subscriptions.payments.status.refunded` | Remboursé |
| `admin.subscriptions.payments.method.mobileMoney` | Mobile Money |
| `admin.subscriptions.payments.method.card` | Carte |
| `admin.subscriptions.payments.method.manual` | Manuel |
| `admin.subscriptions.payments.method.bankTransfer` | Virement bancaire |
| `admin.subscriptions.payments.method.cash` | Espèces |
| `admin.subscriptions.action.extend` | Prolonger la période |
| `admin.subscriptions.action.changePlan` | Changer de forfait |
| `admin.subscriptions.action.cancel` | Résilier |
| `admin.subscriptions.action.markPaid` | Enregistrer un paiement manuel |
| `admin.subscriptions.action.refund.text` | Rembourser manuellement |
| `admin.subscriptions.action.refund.confirm` | Rembourser {amount} {currency} à {userName} ? Le remboursement est à effectuer auprès du prestataire de paiement, puis enregistré ici. |
| `admin.subscriptions.action.refund.reference` | Référence du remboursement |
| `admin.subscriptions.refunded` | Remboursement enregistré. |
| `admin.subscriptions.invoice` | Voir la facture |
| `admin.subscriptions.filter.all` | Tous |
| `admin.subscriptions.empty` | Aucun abonnement pour ce filtre. |
| `admin.subscriptions.payments.empty` | Aucun paiement pour l'instant. |
| `admin.subscriptions.payments.status.expired` | Expiré |
| `admin.subscriptions.payments.col.date` | Date |
| `admin.subscriptions.payments.col.amount` | Montant |
| `admin.subscriptions.payments.col.status` | Statut |
| `admin.subscriptions.payments.col.reference` | Référence |
| `admin.subscriptions.payments.credit` | Crédit déduit : {credit} USD |
| `admin.subscriptions.refundError` | Remboursement non enregistré : indiquez la référence du remboursement. |
| `admin.subscriptions.search` | Titulaire, référence |
| `admin.subscriptions.filter.plan` | Forfait |
| `admin.subscriptions.filter.method` | Moyen de paiement |
| `admin.subscriptions.kpi.toVerify` | Paiements à vérifier |
| `admin.subscriptions.list` | Liste des abonnements |
| `admin.subscriptions.payments.list` | Liste des paiements |
| `admin.subscriptions.actions.title` | Actions · {holder} |
| `admin.subscriptions.actions.open` | Actions pour {holder} |
| `admin.subscriptions.actions.none` | Aucune action disponible pour ce paiement. |

### `/admin/abonnements` · fiche d'abonnement et actions (Admin v2, étape 5)

| Clé | Texte |
|---|---|
| `admin.subscriptions.v2.kpi.active` | Actifs |
| `admin.subscriptions.v2.kpi.late` | En retard (délai de grâce) |
| `admin.subscriptions.v2.kpi.renewSoon` | À renouveler sous 7 jours |
| `admin.subscriptions.v2.kpi.revenue` | Revenu du mois |
| `admin.subscriptions.v2.open` | Ouvrir l'abonnement de {holder} |
| `admin.subscriptions.v2.card` | Abonnement |
| `admin.subscriptions.v2.notFound` | Abonnement introuvable. |
| `admin.subscriptions.v2.period` | Période en cours |
| `admin.subscriptions.v2.periodValue` | Du {start} au {end} |
| `admin.subscriptions.v2.source` | Origine |
| `admin.subscriptions.v2.sourceValue.self` | Souscrit par le client |
| `admin.subscriptions.v2.sourceValue.admin` | Offert par Jumanly |
| `admin.subscriptions.v2.sourceValue.license` | Licence d'un partenaire |
| `admin.subscriptions.v2.next` | Forfait au renouvellement |
| `admin.subscriptions.v2.licence` | Licence d'un partenaire : elle se gère depuis l'espace du partenaire. |
| `admin.subscriptions.v2.timeline.title` | Historique |
| `admin.subscriptions.v2.timeline.created` | Créé |
| `admin.subscriptions.v2.timeline.paid` | Payé · {amount} |
| `admin.subscriptions.v2.timeline.renewed` | Renouvelé · {amount} |
| `admin.subscriptions.v2.timeline.failed` | Paiement échoué · {amount} |
| `admin.subscriptions.v2.timeline.refunded` | Remboursé · {amount} |
| `admin.subscriptions.v2.timeline.late` | En retard |
| `admin.subscriptions.v2.timeline.canceled` | Résilié |
| `admin.subscriptions.v2.timeline.ended` | Terminé |
| `admin.subscriptions.v2.when.label` | Quand ? |
| `admin.subscriptions.v2.extend.confirm` | L'abonnement de {holder} se termine le {date}. Choisissez la nouvelle date de fin. Le client est prévenu par e-mail. |
| `admin.subscriptions.v2.extend.until` | Nouvelle date de fin |
| `admin.subscriptions.v2.change.confirm` | {holder} a le forfait {plan}. Le client est prévenu par e-mail. |
| `admin.subscriptions.v2.change.plan` | Nouveau forfait |
| `admin.subscriptions.v2.change.term` | À l'échéance, le {date} |
| `admin.subscriptions.v2.change.now` | Tout de suite, sans changer la date de fin |
| `admin.subscriptions.v2.change.none` | Aucun autre forfait possible pour ce compte. |
| `admin.subscriptions.v2.cancel.confirm` | Résilier le forfait {plan} de {holder} ? Le client est prévenu par e-mail ; rien n'est supprimé. |
| `admin.subscriptions.v2.cancel.term` | À l'échéance : le forfait reste actif jusqu'au {date} |
| `admin.subscriptions.v2.cancel.now` | Tout de suite : retour au forfait gratuit dès maintenant |
| `admin.subscriptions.v2.manual.confirm` | Un virement ou des espèces reçus de {holder}. La période, la facture et le reçu par e-mail sont ceux d'un paiement en ligne. |
| `admin.subscriptions.v2.manual.amount` | Montant reçu (USD) |
| `admin.subscriptions.v2.manual.amountHint` | Par exemple 9.99. |
| `admin.subscriptions.v2.manual.months` | Nombre de mois payés |
| `admin.subscriptions.v2.manual.reference` | Référence du paiement |
| `admin.subscriptions.v2.manual.referenceHint` | Référence du virement ou numéro du reçu remis. Elle figure sur la facture. |
| `admin.subscriptions.v2.manual.submit` | Enregistrer le paiement |
| `admin.subscriptions.v2.done.extended` | Abonnement prolongé. Le client est prévenu. |
| `admin.subscriptions.v2.done.planNow` | Forfait changé. Le client est prévenu. |
| `admin.subscriptions.v2.done.planTerm` | Changement de forfait prévu à l'échéance. Le client est prévenu. |
| `admin.subscriptions.v2.done.cancelNow` | Abonnement résilié : retour au forfait gratuit. Le client est prévenu. |
| `admin.subscriptions.v2.done.cancelTerm` | Abonnement résilié à l'échéance. Le client est prévenu. |
| `admin.subscriptions.v2.done.manual` | Paiement enregistré. La facture et le reçu sont partis. |
| `admin.subscriptions.v2.error.reason` | Indiquez un motif (3 caractères au moins). |
| `admin.subscriptions.v2.error.fields` | Vérifiez les champs du formulaire. |
| `admin.subscriptions.v2.error.date` | Choisissez une date après la fin actuelle, à deux ans au plus. |
| `admin.subscriptions.v2.error.plan` | Ce forfait ne convient pas à ce compte. |
| `admin.subscriptions.v2.error.status` | Cette action n'est pas possible dans l'état actuel de l'abonnement. |
| `admin.subscriptions.v2.error.amount` | Indiquez un montant supérieur à zéro. |
| `admin.subscriptions.v2.error.reference` | Cette référence de paiement est déjà enregistrée. |
| `admin.subscriptions.v2.error.notFound` | Abonnement introuvable. |

### `/admin/formations` · Formations (Learn)

| Clé | Texte |
|---|---|
| `admin.courses.title` | Formations |
| `admin.courses.new` | Nouvelle formation |
| `admin.courses.list.empty` | Aucune formation pour l'instant. Créez la première. |
| `admin.courses.col.title` | Formation |
| `admin.courses.col.status` | Statut |
| `admin.courses.col.access` | Accès |
| `admin.courses.col.lessons` | Leçons |
| `admin.courses.col.learners` | Apprenants |
| `admin.courses.col.updated` | Modifiée le |
| `admin.courses.create.label` | Titre de la nouvelle formation |
| `admin.courses.create.submit` | Créer le brouillon |
| `admin.courses.create.invalid` | Donnez un titre d'au moins 3 caractères. |
| `admin.courses.created` | Brouillon créé. Complétez la fiche, puis ajoutez les modules et les leçons. |
| `admin.courses.saved` | Modifications enregistrées. |
| `admin.courses.invalid` | Certains champs sont incomplets ou invalides. Vérifiez la fiche. |
| `admin.courses.back` | Toutes les formations |
| `admin.courses.viewPublic` | Voir la page publique |
| `admin.courses.details` | Fiche de la formation |
| `admin.courses.save` | Enregistrer la fiche |
| `admin.courses.skillsUnknown` | Compétences absentes du référentiel, non retenues : {names} |
| `admin.courses.status.draft` | Brouillon |
| `admin.courses.status.review` | En relecture |
| `admin.courses.status.published` | Publiée |
| `admin.courses.status.archived` | Archivée |
| `admin.courses.status.text` | Statut |
| `admin.courses.status.change` | Changer le statut |
| `admin.courses.status.saved` | Statut mis à jour. |
| `admin.courses.field.title` | Titre |
| `admin.courses.field.slug` | Adresse (slug) |
| `admin.courses.field.summary` | Résumé |
| `admin.courses.field.outcomes` | Objectifs pédagogiques |
| `admin.courses.field.theme` | Thème |
| `admin.courses.field.level` | Niveau |
| `admin.courses.field.language` | Langue |
| `admin.courses.field.languageHint` | Code de langue : fr, en… |
| `admin.courses.field.description` | Description |
| `admin.courses.field.audience` | Public visé |
| `admin.courses.field.duration` | Durée totale (minutes) |
| `admin.courses.field.prerequisites` | Prérequis |
| `admin.courses.field.cover` | Image de couverture |
| `admin.courses.field.jobFamilies.text` | Métiers des exercices |
| `admin.courses.field.jobFamilies.hint` | Familles de métiers visées par les exercices métier, séparées par des virgules. |
| `admin.courses.field.outcomesHint` | Un objectif par ligne. |
| `admin.courses.field.slugHint` | Laissez tel quel pour garder l'adresse actuelle. |
| `admin.courses.field.skillsFormat` | Séparez les compétences par des virgules. Seules celles du référentiel sont retenues. |
| `admin.courses.field.instructor` | Formateur |
| `admin.courses.field.catalogLevel.text` | Niveau de catalogue requis |
| `admin.courses.field.catalogLevel.free` | Gratuit (tous les forfaits) |
| `admin.courses.field.catalogLevel.fundamentals` | Fondamentaux (Starter et plus) |
| `admin.courses.field.catalogLevel.standard` | Standard (Pro et plus) |
| `admin.courses.field.catalogLevel.advanced` | Avancé (Premium) |
| `admin.courses.field.specialized` | Ressource spécialisée |
| `admin.courses.field.jobSpecific` | Exercice métier |
| `admin.courses.field.previewLesson` | Première leçon en aperçu public |
| `admin.courses.field.skills.text` | Compétences validées par l'attestation |
| `admin.courses.field.skills.hint` | Elles sont ajoutées au profil du talent comme compétences validées et utilisées par le matching. |
| `admin.courses.modules` | Modules |
| `admin.courses.module.add` | Ajouter un module |
| `admin.courses.module.title` | Titre du module |
| `admin.courses.module.number` | Module {number} |
| `admin.courses.module.rename` | Renommer |
| `admin.courses.module.delete` | Supprimer le module |
| `admin.courses.module.empty` | Aucune leçon dans ce module. |
| `admin.courses.modulesEmpty` | Ajoutez un premier module pour organiser les leçons. |
| `admin.courses.lesson.add` | Ajouter une leçon |
| `admin.courses.lesson.title` | Titre de la leçon |
| `admin.courses.lesson.kind.text` | Type de leçon |
| `admin.courses.lesson.kind.video` | Vidéo |
| `admin.courses.lesson.kind.textLesson` | Texte |
| `admin.courses.lesson.kind.exercise` | Exercice |
| `admin.courses.lesson.kind.quiz` | Quiz |
| `admin.courses.lesson.kind.resource` | Ressources |
| `admin.courses.lesson.edit` | Modifier |
| `admin.courses.lesson.editing` | Leçon : {title} |
| `admin.courses.lesson.save` | Enregistrer la leçon |
| `admin.courses.lesson.saved` | Leçon enregistrée. |
| `admin.courses.lesson.delete` | Supprimer la leçon |
| `admin.courses.lesson.duration` | Durée (minutes) |
| `admin.courses.lesson.content` | Texte de la leçon |
| `admin.courses.lesson.contentHint` | Séparez les paragraphes par une ligne vide. |
| `admin.courses.lesson.resourcesHint` | Une ressource par ligne : Titre | adresse | type (ex. : Modèle de CV | https://… | PDF). |
| `admin.courses.lesson.resourcesInvalid` | {count, plural, one {# ligne de ressource ignorée} other {# lignes de ressources ignorées}} : vérifiez le format. |
| `admin.courses.lesson.isPreview` | Leçon en aperçu public (visible sans compte) |
| `admin.courses.lesson.jobSpecific.text` | Exercice métier (réservé aux forfaits qui l'incluent) |
| `admin.courses.lesson.jobSpecific.hint` | Facultatif pour l'apprenant : il ne compte pas dans la progression ni dans l'attestation. |
| `admin.courses.lesson.jobSpecific.badge` | Exercice métier |
| `admin.courses.lesson.previewBadge` | Aperçu public |
| `admin.courses.lesson.video.text` | Vidéo |
| `admin.courses.lesson.video.upload` | Téléverser la vidéo |
| `admin.courses.lesson.video.id` | Identifiant de la vidéo |
| `admin.courses.lesson.video.hint` | Identifiant de la vidéo dans la bibliothèque vidéo. En local, une adresse https directe fonctionne aussi. |
| `admin.courses.lesson.subtitles` | Sous-titres |
| `admin.courses.lesson.resources` | Ressources à télécharger |
| `admin.courses.lesson.transcript` | Transcription |
| `admin.courses.quiz.add` | Ajouter un quiz |
| `admin.courses.quiz.passScore` | Seuil de réussite (%) |
| `admin.courses.quiz.attempts` | Nombre de tentatives (0 = illimité) |
| `admin.courses.quiz.question.add` | Ajouter une question |
| `admin.courses.quiz.question.type` | Type de question |
| `admin.courses.quiz.question.explanation` | Explication affichée après la réponse |
| `admin.courses.quiz.title` | Quiz de la leçon |
| `admin.courses.quiz.save` | Enregistrer les réglages |
| `admin.courses.quiz.saved` | Quiz enregistré. |
| `admin.courses.quiz.empty` | Ce quiz n'a pas encore de question. |
| `admin.courses.quiz.question.prompt` | Question |
| `admin.courses.quiz.question.number` | Question {number} |
| `admin.courses.quiz.question.options` | Choix proposés (un par ligne) |
| `admin.courses.quiz.question.answer` | Bonne réponse |
| `admin.courses.quiz.question.answerHint` | Choix unique : numéro du bon choix. Choix multiples : numéros séparés par des virgules. Réponse libre : réponses acceptées, une par ligne. |
| `admin.courses.quiz.question.save` | Enregistrer la question |
| `admin.courses.quiz.question.delete` | Supprimer la question |
| `admin.courses.quiz.question.invalid` | Question non enregistrée : vérifiez les choix et la bonne réponse. |
| `admin.courses.quiz.questionType.single` | Choix unique |
| `admin.courses.quiz.questionType.multiple` | Choix multiples |
| `admin.courses.quiz.questionType.text` | Réponse libre |
| `admin.courses.certificate.title` | Attestation |
| `admin.courses.certificate.enabled` | Délivrer une attestation |
| `admin.courses.certificate.rule.text` | Conditions d'obtention |
| `admin.courses.certificate.rule.allLessons` | Toutes les leçons terminées |
| `admin.courses.certificate.rule.quizzes` | Tous les quiz réussis |
| `admin.courses.certificate.revoke.text` | Révoquer une attestation |
| `admin.courses.certificate.revoke.confirm` | Révoquer l'attestation {code} ? La page de vérification affichera « Attestation révoquée ». |
| `admin.courses.certificate.revoke.code` | Numéro de l'attestation |
| `admin.courses.certificate.revoke.submit` | Révoquer l'attestation |
| `admin.courses.certificate.revoke.done` | Attestation révoquée. La page de vérification l'indique désormais. |
| `admin.courses.certificate.revoke.notFound` | Aucune attestation active avec ce numéro. |
| `admin.courses.publish.text` | Publier |
| `admin.courses.publish.check` | Avant de publier : un titre, un résumé, une image de couverture, au moins une leçon, un formateur renseigné et des questions dans chaque quiz. |
| `admin.courses.published` | Formation publiée. |
| `admin.courses.publish.problem.lessons` | Ajoutez au moins une leçon. |
| `admin.courses.publish.problem.instructor` | Renseignez le formateur. |
| `admin.courses.publish.problem.summary` | Renseignez le résumé et la description. |
| `admin.courses.publish.problem.quiz` | Chaque quiz doit avoir au moins une question. |
| `admin.courses.editorOnly` | Votre rôle Éditeur de contenus permet de créer et publier des formations. |
| `admin.courses.filter.search` | Titre de formation |
| `admin.courses.filter.catalog` | Niveau de catalogue |
| `admin.courses.filter.all` | Tous |
| `admin.courses.filter.count` | {count, plural, =0 {Aucune formation} one {# formation} other {# formations}} |
| `admin.courses.filter.empty` | Aucune formation ne correspond à ces filtres. |
| `admin.courses.updatedAt` | Enregistrée le {date} |
| `admin.courses.listMeta` | {access} · {lessons} · {learners, plural, =0 {aucun apprenant} one {# apprenant} other {# apprenants}} |
| `admin.courses.pick` | Choisissez une formation dans la liste pour modifier sa fiche, ses modules et son attestation. |
| `admin.courses.moreFields` | Présentation détaillée |
| `admin.courses.indicator.on` | (activé) |
| `admin.courses.indicator.off` | (désactivé) |
| `admin.courses.indicators` | Indicateurs calculés à partir du niveau de catalogue et des leçons : l'aperçu public et les exercices métier se règlent dans chaque leçon. |
| `admin.courses.lesson.resourcesCount` | {count, plural, one {# ressource} other {# ressources}} |
| `admin.courses.lesson.editNamed` | Modifier la leçon « {title} » |
| `admin.courses.lesson.deleteNamed` | Supprimer la leçon « {title} » |
| `admin.courses.quiz.meta` | {count, plural, =0 {Aucune question} one {# question} other {# questions}} · Seuil {score} % · {attempts, plural, =0 {Tentatives illimitées} one {# tentative} other {# tentatives}} |
| `admin.courses.certificate.withFiche` | Pris en compte avec « Enregistrer la fiche ». |
| `admin.courses.certificate.revoke.next` | Continuer |
| `admin.courses.certificate.revoke.ask` | Saisissez le numéro de l'attestation de cette formation à révoquer. |
| `admin.courses.publish.problem.title` | Donnez un titre d'au moins 3 caractères. |
| `admin.courses.publish.problem.certificateQuiz` | L'attestation demande un quiz avec au moins une question. |
| `admin.courses.publish.problem.cover` | Ajoutez une image de couverture. |
| `admin.courses.v2.readiness.title` | Prête à publier ? |
| `admin.courses.v2.readiness.percent` | {percent} % |
| `admin.courses.v2.readiness.label` | Préparation de la formation : {percent} % |
| `admin.courses.v2.readiness.ready` | Tout est prêt : la formation peut être publiée. |
| `admin.courses.v2.readiness.missing` | {count, plural, one {Il reste # point à compléter.} other {Il reste # points à compléter.}} |
| `admin.courses.v2.readiness.published` | Formation en ligne. Les modifications sont visibles aussitôt enregistrées. |
| `admin.courses.v2.readiness.done` | (fait) |
| `admin.courses.v2.readiness.todo` | (à faire) |
| `admin.courses.v2.readiness.advice` | Conseillé, ne bloque pas la publication. |
| `admin.courses.v2.step.info` | Informations |
| `admin.courses.v2.step.audience` | Public et objectifs |
| `admin.courses.v2.step.program` | Programme |
| `admin.courses.v2.step.quiz` | Quiz |
| `admin.courses.v2.step.certificate` | Attestation |
| `admin.courses.v2.step.publish` | Publication |
| `admin.courses.v2.preview` | Aperçu comme un talent |
| `admin.courses.v2.duplicate.text` | Dupliquer |
| `admin.courses.v2.duplicate.title` | Dupliquer la formation |
| `admin.courses.v2.duplicate.confirm` | Une copie en brouillon de « {title} » est créée, avec ses modules, leçons et quiz. Les apprenants, leur progression et les attestations ne sont pas copiés. Ajoutez une image de couverture à la copie avant de la publier. |
| `admin.courses.v2.duplicate.name` | Titre de la copie |
| `admin.courses.v2.duplicate.defaultName` | {title} (copie) |
| `admin.courses.v2.duplicate.submit` | Créer la copie |
| `admin.courses.v2.duplicate.done` | Copie créée en brouillon. Ajoutez sa couverture avant de la publier. |
| `admin.courses.v2.cover.current` | Couverture actuelle |
| `admin.courses.v2.cover.none` | Aucune couverture pour l'instant. |
| `admin.courses.v2.cover.file` | Envoyer une image |
| `admin.courses.v2.cover.hint` | PNG, JPEG ou WebP, 4 Mo au plus. L'image est recadrée au format 16:9 et allégée pour les connexions lentes. Envoyée avec « Enregistrer la fiche ». |
| `admin.courses.v2.cover.error.fileType` | Cette image n'a pas pu être lue. Envoyez un fichier PNG, JPEG ou WebP. |
| `admin.courses.v2.cover.error.fileSize` | Cette image dépasse 4 Mo. |
| `admin.courses.v2.cover.error.notFound` | Formation introuvable. |
| `admin.courses.v2.stats.label` | {enrolled, plural, =0 {Aucun inscrit} one {# inscrit} other {# inscrits}} · {completion} · {quiz} · {certificates, plural, =0 {aucune attestation} one {# attestation} other {# attestations}} |
| `admin.courses.v2.stats.completion` | {value} % terminent |
| `admin.courses.v2.stats.quiz` | quiz {value} % en moyenne |
| `admin.courses.v2.stats.none` | aucun quiz passé |
| `admin.courses.v2.listMeta` | {access} · {lessons} |
| `admin.courses.v2.stats.empty` | Aucun inscrit pour l'instant |
| `admin.courses.v2.previewPage.title` | Aperçu : {title} |
| `admin.courses.v2.previewPage.notice` | Aperçu réservé à l'équipe : la formation telle qu'un talent la verra, sans progression ni inscription. |
| `admin.courses.v2.previewPage.back` | Retour à l'éditeur |
| `admin.courses.v2.previewPage.status` | Statut actuel |
| `admin.courses.v2.previewPage.empty` | Aucune leçon pour l'instant. |
| `admin.courses.v2.previewPage.quiz` | {count, plural, =0 {Quiz sans question} one {Quiz de # question} other {Quiz de # questions}} · seuil {score} % |
| `admin.courses.v2.previewPage.noVideo` | Vidéo pas encore envoyée. |
| `admin.courses.video.title` | Vidéo de la leçon |
| `admin.courses.video.file` | Fichier vidéo |
| `admin.courses.video.hintDirect` | MP4, WebM ou MOV. Le fichier part directement chez l'hébergeur vidéo, qui l'encode pour une lecture adaptée aux réseaux lents. |
| `admin.courses.video.hintSite` | MP4 ou WebM, 4 Mo au plus (aucun hébergeur vidéo n'est configuré). Pour une vidéo plus longue, collez son adresse dans le champ « Identifiant de la vidéo ». |
| `admin.courses.video.send` | Envoyer la vidéo |
| `admin.courses.video.sending` | Envoi en cours… |
| `admin.courses.video.done` | Vidéo envoyée. L'encodage commence. |
| `admin.courses.video.saved` | Vidéo enregistrée pour cette leçon. |
| `admin.courses.video.state.none` | Aucune vidéo pour l'instant. |
| `admin.courses.video.state.ready` | Vidéo prête à être lue. |
| `admin.courses.video.state.processing` | Encodage en cours ({progress} %). |
| `admin.courses.video.state.failed` | L'encodage a échoué. Envoyez le fichier à nouveau. |
| `admin.courses.video.error.fileType` | Ce fichier n'est pas une vidéo MP4 ou WebM. |
| `admin.courses.video.error.fileSize` | Cette vidéo dépasse 4 Mo. |
| `admin.courses.video.error.upload` | L'envoi a échoué. Vérifiez la connexion puis réessayez. |
| `admin.courses.video.captions` | Sous-titres et transcription : renseignez le champ « Transcription » de la leçon, il s'affiche sous la vidéo. |

### `/admin/formations` · Studio formations (Admin v3)

*Galerie des formations et création à partir d'un modèle de départ (`docs/admin-v3/PLAN.md`, étape 3).*

| Clé | Texte |
|---|---|
| `admin.courses.v3.title` | Studio formations |
| `admin.courses.v3.eyebrow` | Jumanly Admin · Learn |
| `admin.courses.v3.subtitle` | Créez, préparez et publiez les formations du catalogue Learn. |
| `admin.courses.v3.figures.published` | Publiées |
| `admin.courses.v3.figures.drafts` | Brouillons |
| `admin.courses.v3.figures.enrolled` | Inscriptions (30 jours) |
| `admin.courses.v3.figures.certificates` | Attestations (30 jours) |
| `admin.courses.v3.view.label` | Affichage |
| `admin.courses.v3.view.galerie` | Galerie |
| `admin.courses.v3.view.liste` | Liste |
| `admin.courses.v3.gallery.duration` | {minutes} min |
| `admin.courses.v3.gallery.program` | {modules, plural, =0 {Aucun module} one {# module} other {# modules}} |
| `admin.courses.v3.createdFromTemplate` | Brouillon créé à partir du modèle. Renommez les modules et les leçons, puis complétez la fiche. |
| `admin.courses.v3.create.title` | Nouvelle formation |
| `admin.courses.v3.create.subtitle` | Donnez un titre et choisissez un modèle de départ : le brouillon s'ouvre avec son programme, prêt à être complété. |
| `admin.courses.v3.create.invalid` | Certains champs sont incomplets. Donnez un titre d'au moins 3 caractères et choisissez un modèle. |
| `admin.courses.v3.create.basics` | L'essentiel |
| `admin.courses.v3.create.themeHint` | Choisissez un thème existant ou saisissez-en un nouveau. |
| `admin.courses.v3.create.template` | Modèle de départ |
| `admin.courses.v3.create.templateHint` | Le modèle crée les modules et les leçons, vides, avec des titres provisoires à renommer. Rien n'est publié. |
| `admin.courses.v3.create.submit` | Créer la formation |
| `admin.courses.v3.create.draftNote` | La formation est créée en brouillon : elle n'apparaît pas dans le catalogue avant sa publication. |
| `admin.courses.v3.create.copyTitle` | Ou dupliquer une formation |
| `admin.courses.v3.create.copyText` | Reprenez le programme et les quiz d'une formation existante, sans ses inscrits ni ses attestations. |
| `admin.courses.v3.create.copySource` | Formation à copier |
| `admin.courses.v3.create.copyName` | Titre de la copie |
| `admin.courses.v3.create.copySubmit` | Dupliquer en brouillon |
| `admin.courses.v3.create.tipsTitle` | Bon à savoir |
| `admin.courses.v3.create.tips.one` | Avant la publication, il faut une couverture, un résumé, une description et un formateur. |
| `admin.courses.v3.create.tips.two` | Une attestation demande au moins un quiz avec des questions. |
| `admin.courses.v3.create.tips.three` | Enregistrez quand vous voulez et revenez plus tard : rien n'est visible avant la publication. |
| `admin.courses.v3.template.moduleTitle` | Module {index} |
| `admin.courses.v3.template.finalModule` | Évaluation finale |
| `admin.courses.v3.template.lessonTitle.intro` | Introduction |
| `admin.courses.v3.template.lessonTitle.lesson` | Leçon en vidéo |
| `admin.courses.v3.template.lessonTitle.reading` | À lire |
| `admin.courses.v3.template.lessonTitle.moduleQuiz` | Quiz du module |
| `admin.courses.v3.template.lessonTitle.finalQuiz` | Quiz final |
| `admin.courses.v3.template.lessonTitle.exercise` | Exercice {index} |
| `admin.courses.v3.template.summary` | {modules, plural, =0 {Programme libre} one {# module} other {# modules}} · {lessons, plural, =0 {aucune leçon} one {# leçon} other {# leçons}} |
| `admin.courses.v3.template.withCertificate` | Avec attestation |
| `admin.courses.v3.template.withoutCertificate` | Sans attestation |
| `admin.courses.v3.template.short.name` | Formation courte |
| `admin.courses.v3.template.short.text` | Un module pour transmettre un savoir précis : une vidéo, une lecture et un quiz de fin. |
| `admin.courses.v3.template.certifying.name` | Parcours certifiant |
| `admin.courses.v3.template.certifying.text` | Trois modules qui se terminent chacun par un quiz, puis une évaluation finale qui ouvre l'attestation. |
| `admin.courses.v3.template.workshop.name` | Atelier pratique |
| `admin.courses.v3.template.workshop.text` | Une démonstration en vidéo, puis deux exercices pour s'entraîner. |
| `admin.courses.v3.template.blank.name` | Partir de zéro |
| `admin.courses.v3.template.blank.text` | Une formation vide : vous construisez le programme vous-même. |
| `admin.courses.v3.editor.nav` | Étapes de la formation |
| `admin.courses.v3.editor.studio` | Studio formations |
| `admin.courses.v3.editor.position` | Étape {number} sur {total} |
| `admin.courses.v3.editor.next` | Étape suivante : {name} |
| `admin.courses.v3.editor.previous` | Étape précédente : {name} |
| `admin.courses.v3.editor.saveFirst` | Pensez à enregistrer avant de passer à l'étape suivante. |
| `admin.courses.v3.editor.stats.modules` | Modules |
| `admin.courses.v3.editor.stats.lessons` | Leçons |
| `admin.courses.v3.editor.stats.duration` | Durée des leçons |
| `admin.courses.v3.editor.stats.minutes` | {minutes} min |
| `admin.courses.v3.editor.stats.status` | Statut |
| `admin.courses.v3.editor.intro.informations` | Le titre, le résumé, le thème, le niveau du catalogue et l'image de couverture : ce que le talent voit d'abord. |
| `admin.courses.v3.editor.intro.public` | À qui s'adresse la formation, ce qu'on y apprend et les compétences que l'attestation valide. |
| `admin.courses.v3.editor.intro.programme` | Construisez le programme module par module. Déplacez les modules et les leçons avec les flèches, ouvrez une leçon pour la rédiger. |
| `admin.courses.v3.editor.intro.quiz` | Les quiz de la formation, leurs questions et leur seuil de réussite. |
| `admin.courses.v3.editor.intro.attestation` | L'attestation délivrée à la fin de la formation, ses conditions et son apparence. |
| `admin.courses.v3.editor.intro.publication` | Le récapitulatif avant la mise en ligne, puis le statut de la formation. |
| `admin.courses.v3.editor.aside.title` | À compléter |
| `admin.courses.v3.editor.aside.none` | Rien à compléter : la formation peut être publiée. |
| `admin.courses.v3.editor.aside.actions` | Actions |
| `admin.courses.v3.editor.program.totals` | {modules, plural, =0 {Aucun module} one {# module} other {# modules}} · {lessons, plural, =0 {aucune leçon} one {# leçon} other {# leçons}} · {quizzes, plural, =0 {aucun quiz} one {# quiz} other {# quiz}} · {minutes} min |
| `admin.courses.v3.editor.program.moduleMeta` | {lessons, plural, =0 {Aucune leçon} one {# leçon} other {# leçons}} · {minutes} min |
| `admin.courses.v3.editor.program.moveModuleUp` | Monter le module « {title} » |
| `admin.courses.v3.editor.program.moveModuleDown` | Descendre le module « {title} » |
| `admin.courses.v3.editor.program.moveLessonUp` | Monter la leçon « {title} » |
| `admin.courses.v3.editor.program.moveLessonDown` | Descendre la leçon « {title} » |
| `admin.courses.v3.editor.program.moduleTools` | Renommer ou supprimer |
| `admin.courses.v3.editor.program.addLesson` | Nouvelle leçon dans ce module |
| `admin.courses.v3.editor.program.panel` | Rédaction de la leçon |
| `admin.courses.v3.editor.program.close` | Fermer la leçon |
| `admin.courses.v3.editor.quiz.title` | Quiz de la formation |
| `admin.courses.v3.editor.quiz.empty` | Aucun quiz pour l'instant. Ajoutez une leçon de type Quiz dans le programme. |
| `admin.courses.v3.editor.quiz.toProgram` | Aller au programme |
| `admin.courses.v3.editor.quiz.edit` | Modifier les questions de « {title} » |
| `admin.courses.v3.editor.quiz.missing` | À compléter : ajoutez au moins une question. |
| `admin.courses.v3.editor.quiz.ready` | Prêt |
| `admin.courses.v3.editor.quiz.certificate` | L'attestation demande au moins un quiz avec des questions. |
| `admin.courses.v3.editor.attestation.save` | Enregistrer l'attestation |
| `admin.courses.v3.editor.attestation.saveHint` | Le réglage est enregistré avec la fiche de la formation. |
| `admin.courses.v3.editor.attestation.preview` | Aperçu de l'attestation |
| `admin.courses.v3.editor.attestation.heading` | Attestation de réussite |
| `admin.courses.v3.editor.attestation.awarded` | décernée à |
| `admin.courses.v3.editor.attestation.learner` | Prénom Nom du talent |
| `admin.courses.v3.editor.attestation.forCourse` | pour avoir suivi et réussi la formation |
| `admin.courses.v3.editor.attestation.skills` | Compétences validées |
| `admin.courses.v3.editor.attestation.code` | Numéro de vérification : JMN-XXXX-XXXX |
| `admin.courses.v3.editor.attestation.note` | Aperçu indicatif : l'attestation réelle porte le nom du talent, la date et un numéro vérifiable sur jumanly.io. |
| `admin.courses.v3.editor.attestation.off` | Aucune attestation n'est délivrée pour cette formation. |
| `admin.courses.v3.editor.publication.recap` | Récapitulatif |
| `admin.courses.v3.editor.publication.current` | Statut actuel : {status} |
| `admin.courses.v3.editor.publication.ready` | La formation est prête à être publiée. |
| `admin.courses.v3.editor.publication.notReady` | Complétez les points ci-dessous avant de publier. |
| `admin.courses.v3.editor.publication.go` | Compléter |
| `admin.courses.v3.editor.publication.change` | Changer le statut |
| `admin.courses.v3.editor.publication.reason` | Motif (facultatif) |
| `admin.courses.v3.editor.publication.reasonHint` | Gardé dans le journal de la formation. |
| `admin.courses.v3.editor.publication.history` | Historique de la formation |
| `admin.courses.v3.editor.intro.documents` | Les fichiers PDF de la formation : supports de cours, fiches d'exercices, lectures, modèles et corrigés, et qui peut les télécharger. |
| `admin.courses.v3.editor.documents.step` | Documents |
| `admin.courses.v3.editor.documents.title` | Documents PDF |
| `admin.courses.v3.editor.documents.empty` | Aucun document pour l'instant. Ajoutez un support de cours, une fiche d'exercices ou un corrigé. |
| `admin.courses.v3.editor.documents.add` | Ajouter un document |
| `admin.courses.v3.editor.documents.file` | Fichier PDF |
| `admin.courses.v3.editor.documents.fileHint` | PDF uniquement, 4 Mo au plus. Un fichier protégé par un mot de passe est refusé. |
| `admin.courses.v3.editor.documents.submit` | Envoyer le document |
| `admin.courses.v3.editor.documents.field.title` | Titre du document |
| `admin.courses.v3.editor.documents.field.kind` | Type de document |
| `admin.courses.v3.editor.documents.field.visibility` | Qui peut le télécharger ? |
| `admin.courses.v3.editor.documents.field.specialized` | Réservé aux forfaits avec ressources spécialisées |
| `admin.courses.v3.editor.documents.field.lesson` | Rattaché à |
| `admin.courses.v3.editor.documents.field.replace` | Remplacer le fichier |
| `admin.courses.v3.editor.documents.field.replaceHint` | Facultatif : le titre et les réglages sont gardés. |
| `admin.courses.v3.editor.documents.wholeCourse` | Toute la formation |
| `admin.courses.v3.editor.documents.kind.support` | Support de cours |
| `admin.courses.v3.editor.documents.kind.exercises` | Fiche d'exercices |
| `admin.courses.v3.editor.documents.kind.reading` | Lecture complémentaire |
| `admin.courses.v3.editor.documents.kind.template` | Modèle à remplir |
| `admin.courses.v3.editor.documents.kind.answer_key` | Corrigé |
| `admin.courses.v3.editor.documents.kind.other` | Autre document |
| `admin.courses.v3.editor.documents.visibility.public` | Tout le monde, sur la fiche publique |
| `admin.courses.v3.editor.documents.visibility.enrolled` | Les inscrits dont le forfait ouvre la formation |
| `admin.courses.v3.editor.documents.visibility.team` | L'équipe Jumanly seulement |
| `admin.courses.v3.editor.documents.answerKey` | Un corrigé reste toujours réservé à l'équipe. |
| `admin.courses.v3.editor.documents.meta` | {kind} · {pages, plural, one {# page} other {# pages}} · {size} · {downloads, plural, =0 {aucun téléchargement} one {# téléchargement} other {# téléchargements}} |
| `admin.courses.v3.editor.documents.lesson` | Leçon : {title} |
| `admin.courses.v3.editor.documents.specializedTag` | Ressource spécialisée |
| `admin.courses.v3.editor.documents.edit` | Modifier « {title} » |
| `admin.courses.v3.editor.documents.save` | Enregistrer le document |
| `admin.courses.v3.editor.documents.download` | Télécharger « {title} » |
| `admin.courses.v3.editor.documents.delete` | Supprimer « {title} » |
| `admin.courses.v3.editor.documents.moveUp` | Monter « {title} » |
| `admin.courses.v3.editor.documents.moveDown` | Descendre « {title} » |
| `admin.courses.v3.editor.documents.saved` | Document enregistré. |
| `admin.courses.v3.editor.documents.deleted` | Document supprimé. |
| `admin.courses.v3.editor.documents.error.champs` | Vérifiez le titre et le type du document. |
| `admin.courses.v3.editor.documents.error.fileType` | Envoyez un fichier PDF. |
| `admin.courses.v3.editor.documents.error.fileSize` | Le fichier dépasse 4 Mo. |
| `admin.courses.v3.editor.documents.error.unreadable` | Ce PDF est illisible. Exportez-le à nouveau, puis réessayez. |
| `admin.courses.v3.editor.documents.error.encrypted` | Ce PDF est protégé par un mot de passe. Envoyez une version sans protection. |
| `admin.courses.v3.editor.documents.error.notFound` | Document introuvable. |
| `admin.courses.v3.editor.documents.links` | Les liens vers des fichiers hébergés ailleurs restent dans « Ressources à télécharger » de chaque leçon. |
| `admin.courses.v3.editor.documents.panel` | Documents PDF de la leçon |
| `admin.courses.v3.editor.documents.panelEmpty` | Aucun document rattaché à cette leçon. |
| `admin.courses.v3.editor.documents.size.kb` | {size} Ko |
| `admin.courses.v3.editor.documents.size.mb` | {size} Mo |
| `admin.courses.v3.pdf.title` | PDF de la formation |
| `admin.courses.v3.pdf.intro` | Générés à la demande à partir du contenu actuel de la formation. |
| `admin.courses.v3.pdf.programme` | Programme |
| `admin.courses.v3.pdf.programmeHint` | Public : objectifs, modules et leçons |
| `admin.courses.v3.pdf.support` | Support de cours complet |
| `admin.courses.v3.pdf.supportHint` | Toutes les leçons, pour lire hors connexion |
| `admin.courses.v3.pdf.quiz` | Quiz et corrigé |
| `admin.courses.v3.pdf.quizHint` | Équipe : questions, bonnes réponses, explications |
| `admin.courses.v3.pdf.attestation` | Aperçu de l'attestation |
| `admin.courses.v3.pdf.attestationHint` | Équipe : avec un nom d'exemple |
| `admin.courses.v3.pdf.report` | Bilan de la formation |
| `admin.courses.v3.pdf.reportHint` | Équipe : inscrits, achèvement, quiz, attestations, sans nom |
| `admin.courses.v3.pdf.periodLabel` | Période du bilan |
| `admin.courses.v3.pdf.period.30` | 30 derniers jours |
| `admin.courses.v3.pdf.period.90` | 90 derniers jours |
| `admin.courses.v3.pdf.period.365` | 12 derniers mois |
| `admin.courses.v3.pdf.period.all` | Depuis la création |
| `admin.courses.v3.pdf.reportSubmit` | Télécharger le bilan |
| `admin.courses.v3.pdf.download` | Télécharger le PDF « {name} » |
| `admin.courses.v3.pdf.logged` | Chaque téléchargement par l'équipe est journalisé. |


### `/admin/formations/domaines` · Domaines et collections (Learn v2, étape 1)

*Ranger les formations du catalogue par domaine ; les 7 domaines de départ sont créés automatiquement.*

| Clé | Texte |
|---|---|
| `admin.courses.domains.link` | Domaines |
| `admin.courses.domains.title` | Domaines du catalogue |
| `admin.courses.domains.eyebrow` | Jumanly Admin · Learn |
| `admin.courses.domains.subtitle` | Les domaines organisent le catalogue Learn. Chaque formation appartient à un domaine ; renommer un domaine garde son adresse. |
| `admin.courses.domains.back` | Studio formations |
| `admin.courses.domains.count` | {count, plural, =0 {Aucune formation publiée} one {# formation publiée} other {# formations publiées}} |
| `admin.courses.domains.field.name` | Nom |
| `admin.courses.domains.field.description` | Description |
| `admin.courses.domains.field.icon` | Icône |
| `admin.courses.domains.field.order` | Ordre d'affichage |
| `admin.courses.domains.save` | Enregistrer |
| `admin.courses.domains.delete` | Supprimer |
| `admin.courses.domains.deleteHint` | Les formations de ce domaine restent publiées, sans domaine, jusqu'à ce que vous les rangiez ailleurs. |
| `admin.courses.domains.new.title` | Nouveau domaine |
| `admin.courses.domains.new.submit` | Créer le domaine |
| `admin.courses.domains.ok.created` | Domaine créé. |
| `admin.courses.domains.ok.saved` | Domaine enregistré. |
| `admin.courses.domains.ok.deleted` | Domaine supprimé ; ses formations sont maintenant sans domaine. |
| `admin.courses.domains.error` | Vérifiez le nom (2 caractères au moins) et l'ordre (un nombre). |
| `admin.courses.domains.readOnly` | Seul un administrateur de la plateforme peut supprimer un domaine. |
| `admin.courses.field.domain` | Domaine |
| `admin.courses.field.domainNone` | Sans domaine |
| `admin.courses.field.editorial` | Collection |
| `admin.courses.field.editorialHint` | Jumanly Partner Programs seulement avec une convention signée avec le partenaire. |

### `/admin/formations/parcours` · Parcours (Learn v2, étape 2)

*Enchaîner plusieurs formations publiées dans un ordre conseillé ; un parcours n'ouvre aucun accès.*

| Clé | Texte |
|---|---|
| `admin.courses.paths.link` | Parcours |
| `admin.courses.paths.title` | Parcours |
| `admin.courses.paths.eyebrow` | Jumanly Admin · Learn |
| `admin.courses.paths.subtitle` | Un parcours enchaîne plusieurs formations dans un ordre conseillé. Il n'ouvre aucun accès : chaque formation garde son niveau. |
| `admin.courses.paths.back` | Studio formations |
| `admin.courses.paths.empty` | Aucun parcours pour l'instant. |
| `admin.courses.paths.courses` | {count, plural, =0 {Aucune formation} one {# formation} other {# formations}} |
| `admin.courses.paths.followers` | {count, plural, =0 {Aucun apprenant} one {# apprenant} other {# apprenants}} |
| `admin.courses.paths.status.draft` | Brouillon |
| `admin.courses.paths.status.review` | En relecture |
| `admin.courses.paths.status.published` | Publié |
| `admin.courses.paths.status.archived` | Archivé |
| `admin.courses.paths.edit` | Modifier |
| `admin.courses.paths.new.title` | Nouveau parcours |
| `admin.courses.paths.new.field` | Titre du parcours |
| `admin.courses.paths.new.submit` | Créer le parcours |
| `admin.courses.paths.new.error` | Donnez un titre d'au moins 3 caractères. |
| `admin.courses.paths.all` | Tous les parcours |
| `admin.courses.paths.info.title` | Informations |
| `admin.courses.paths.field.title` | Titre |
| `admin.courses.paths.field.summary` | Présentation |
| `admin.courses.paths.field.summaryHint` | Ce que l'apprenant saura faire à la fin du parcours. |
| `admin.courses.paths.save` | Enregistrer |
| `admin.courses.paths.list.title` | Formations du parcours |
| `admin.courses.paths.list.hint` | Dans l'ordre conseillé. Une formation en brouillon n'apparaît pas aux apprenants. |
| `admin.courses.paths.list.empty` | Ajoutez au moins deux formations publiées. |
| `admin.courses.paths.list.add` | Ajouter une formation |
| `admin.courses.paths.list.choose` | Choisir une formation |
| `admin.courses.paths.list.addSubmit` | Ajouter |
| `admin.courses.paths.list.up` | Monter « {title} » |
| `admin.courses.paths.list.down` | Descendre « {title} » |
| `admin.courses.paths.list.remove` | Retirer « {title} » |
| `admin.courses.paths.list.notPublished` | Non visible : formation {status} |
| `admin.courses.paths.publication.title` | Publication |
| `admin.courses.paths.publication.current` | Statut : |
| `admin.courses.paths.publication.publish` | Publier |
| `admin.courses.paths.publication.draft` | Repasser en brouillon |
| `admin.courses.paths.publication.archive` | Archiver |
| `admin.courses.paths.publication.problems` | Avant de publier : |
| `admin.courses.paths.publication.view` | Voir comme un apprenant |
| `admin.courses.paths.problem.summary` | ajoutez une présentation |
| `admin.courses.paths.problem.courses` | ajoutez au moins {count} formations publiées |
| `admin.courses.paths.ok.created` | Parcours créé. Ajoutez une présentation et ses formations. |
| `admin.courses.paths.ok.saved` | Modifications enregistrées. |
| `admin.courses.paths.ok.course` | Liste des formations mise à jour. |
| `admin.courses.paths.ok.published` | Parcours publié. |
| `admin.courses.paths.ok.draft` | Parcours repassé en brouillon. |
| `admin.courses.paths.ok.archived` | Parcours archivé ; il n'apparaît plus aux apprenants. |
| `admin.courses.paths.error.infos` | Vérifiez le titre (3 caractères au moins). |
| `admin.courses.paths.error.already` | Cette formation est déjà dans le parcours. |
| `admin.courses.paths.error.full` | Un parcours compte 20 formations au plus. |
| `admin.courses.paths.error.notFound` | Formation introuvable. |
| `admin.courses.paths.error.publication` | Le parcours n'est pas encore prêt à être publié. |
### `/admin/offres` · Modération des offres

| Clé | Texte |
|---|---|
| `admin.jobs.title` | Modération des offres |
| `admin.jobs.tab.pending` | À vérifier ({count}) |
| `admin.jobs.tab.flagged` | Signalées ({count}) |
| `admin.jobs.tab.all` | Toutes |
| `admin.jobs.autoFlag.text` | Signal automatique : {reason} |
| `admin.jobs.autoFlag.payment` | Mention d'un paiement demandé au candidat |
| `admin.jobs.autoFlag.discrimination` | Critère discriminatoire possible |
| `admin.jobs.autoFlag.contactOutside` | Invitation à poursuivre hors de Jumanly |
| `admin.jobs.autoFlag.newOrg` | Organisation récente non vérifiée |
| `admin.jobs.checklist` | Points à contrôler |
| `admin.jobs.check.real` | Le poste paraît réel et l'organisation identifiable |
| `admin.jobs.check.noPayment` | Aucun paiement demandé aux candidats |
| `admin.jobs.check.noDiscrimination` | Aucun critère portant sur le genre, l'âge, l'origine, la religion, la situation familiale ou la santé |
| `admin.jobs.check.knockout` | Critères éliminatoires justifiés par le poste |
| `admin.jobs.approve` | Approuver |
| `admin.jobs.reject.text` | Refuser |
| `admin.jobs.reject.reason` | Motif communiqué au recruteur |
| `admin.jobs.requestChanges` | Demander une correction |
| `admin.jobs.unpublish.text` | Dépublier |
| `admin.jobs.unpublish.confirm` | Dépublier « {jobTitle} » ? Les candidats seront informés que l'offre n'est plus disponible. |
| `admin.jobs.approved` | Offre approuvée et publiée. |
| `admin.jobs.rejected` | Offre refusée. Le recruteur a été prévenu. |
| `admin.jobs.search` | Titre, organisation |
| `admin.jobs.list` | Offres à modérer |
| `admin.jobs.filter.flag` | Signal automatique |
| `admin.jobs.filter.country` | Pays |
| `admin.jobs.filter.contract` | Type de contrat |
| `admin.jobs.filter.all` | Tous |
| `admin.jobs.filter.none` | Sans signal |
| `admin.jobs.count` | {count, plural, =0 {Aucune offre} one {# offre} other {# offres}} |
| `admin.jobs.noFlag` | Aucun signal automatique |
| `admin.jobs.unverified` | Organisation non vérifiée |
| `admin.jobs.publishedBy` | publiée par {name} |
| `admin.jobs.excerpt` | Extrait de l'offre |
| `admin.jobs.excerptHint` | Les passages surlignés ont déclenché le signal automatique. |
| `admin.jobs.reports` | {count, plural, one {# signalement ouvert} other {# signalements ouverts}} |
| `admin.jobs.seeReports` | Voir les signalements |
| `admin.jobs.cancel` | Annuler |
| `admin.jobs.requestChangesHint` | L'offre est renvoyée au recruteur avec votre motif : il la corrige puis la soumet à nouveau. |
| `admin.jobs.empty.pending` | Aucune offre à vérifier. Les offres signalées automatiquement à la publication apparaîtront ici. |
| `admin.jobs.empty.flagged` | Aucune offre signalée par les utilisateurs. |
| `admin.jobs.empty.all` | Aucune offre publiée. |
| `admin.jobs.empty.filtered` | Aucune offre ne correspond à ces filtres. |
| `admin.jobs.tab.changes` | Correction demandée ({count}) |
| `admin.jobs.empty.changes` | Aucune offre en attente de correction. |
| `admin.jobs.changesSent` | Correction demandée. Le recruteur la voit sur son offre et la renverra corrigée. |
| `admin.jobs.changesPending` | En attente de la version corrigée du recruteur. |
| `admin.jobs.error.motif` | Indiquez un motif d'au moins 3 caractères. |
| `admin.jobs.fix.legend` | Points à corriger |
| `admin.jobs.fix.hint` | Cochez ce que le recruteur doit corriger : il voit ces points sur son offre. |
| `admin.jobs.fix.real` | Rendre le poste et l'organisation clairement identifiables |
| `admin.jobs.fix.noPayment` | Retirer toute demande de paiement aux candidats |
| `admin.jobs.fix.noDiscrimination` | Retirer les critères liés au genre, à l'âge, à l'origine, à la religion, à la situation familiale ou à la santé |
| `admin.jobs.fix.knockout` | Justifier par le poste les critères éliminatoires, ou les retirer |
| `admin.jobs.auto.title` | Avis du contrôle automatique |
| `admin.jobs.auto.review` | À vérifier : {count, plural, one {# point repéré} other {# points repérés}} |
| `admin.jobs.auto.clear` | Rien de suspect repéré |
| `admin.jobs.auto.why` | Pourquoi ? |
| `admin.jobs.auto.whyTitle` | Pourquoi cet avis ? |
| `admin.jobs.auto.whyText` | Le contrôle automatique cherche des tournures précises dans le texte de l'offre et regarde l'ancienneté de l'organisation. Il ne décide jamais : c'est vous qui approuvez, demandez une correction ou refusez. |
| `admin.jobs.auto.rule.payment` | Une phrase évoque une somme à payer par le candidat (frais, dossier, formation payante…). |
| `admin.jobs.auto.rule.discrimination` | Une phrase cite un critère protégé : genre, âge, origine, religion, situation familiale ou santé. |
| `admin.jobs.auto.rule.contactOutside` | Une phrase invite à poursuivre hors de Jumanly (numéro, messagerie, adresse e-mail). |
| `admin.jobs.auto.rule.newOrg` | L'organisation a été créée il y a moins de 30 jours et n'est pas encore vérifiée. |
| `admin.jobs.auto.rule.none` | Aucune de ces règles ne s'applique à cette offre. |
| `admin.jobs.nav.label` | Parcourir la file |
| `admin.jobs.nav.prev` | Offre précédente |
| `admin.jobs.nav.next` | Offre suivante |
| `admin.jobs.nav.position` | {position} sur {total} |
| `admin.jobs.nav.hint` | Raccourcis clavier : J pour la suivante, K pour la précédente. |
| `admin.jobs.order` | Les plus graves d'abord, puis les plus anciennes. |

### `/admin/partenaires` · Partenaires et lots de licences

| Clé | Texte |
|---|---|
| `admin.partners.title` | Partenaires |
| `admin.partners.new` | Nouveau partenaire |
| `admin.partners.field.org` | Organisation partenaire |
| `admin.partners.field.type.text` | Type |
| `admin.partners.field.type.bank` | Banque |
| `admin.partners.field.type.university` | Université |
| `admin.partners.field.type.foundation` | Fondation |
| `admin.partners.field.type.company` | Entreprise |
| `admin.partners.field.type.cooperation` | Agence de coopération |
| `admin.partners.field.type.public` | Programme public |
| `admin.partners.field.manager` | Responsable partenaire (e-mail) |
| `admin.partners.contract.title` | Contrat |
| `admin.partners.contract.reference` | Référence du contrat |
| `admin.partners.contract.amount` | Montant |
| `admin.partners.contract.start` | Début |
| `admin.partners.contract.end` | Fin |
| `admin.partners.batch.new` | Nouveau lot de licences |
| `admin.partners.batch.name` | Nom du lot |
| `admin.partners.batch.plan` | Forfait (Starter, Pro ou Premium) |
| `admin.partners.batch.quantity` | Nombre de licences |
| `admin.partners.batch.months` | Durée par bénéficiaire (mois) |
| `admin.partners.batch.minGroup` | Seuil d'anonymat des rapports |
| `admin.partners.batch.created` | Lot créé. Le responsable partenaire peut distribuer les licences. |
| `admin.partners.noOnlinePurchase` | Les licences Partners ne s'achètent pas en ligne : le lot est créé ici après signature du contrat. |
| `admin.partners.subtitle` | Organisations partenaires, contrats et lots de licences sponsorisées. |
| `admin.partners.empty` | Aucun partenaire pour l'instant. |
| `admin.partners.created` | Partenaire créé. Une invitation a été envoyée au responsable. |
| `admin.partners.invited` | Invitation envoyée. |
| `admin.partners.error` | Vérifiez les informations saisies : la fin doit suivre le début, le seuil d'anonymat est d'au moins 10. |
| `admin.partners.managers` | Responsables : {emails} |
| `admin.partners.noManager` | Aucun responsable actif. |
| `admin.partners.pending` | Invitation en attente : {emails} |
| `admin.partners.inviteManager` | Inviter un responsable |
| `admin.partners.invite` | Inviter |
| `admin.partners.create` | Créer le partenaire |
| `admin.partners.batch.create` | Créer le lot |
| `admin.partners.batch.contract` | Contrat {reference} |
| `admin.partners.batch.amountHelp` | En USD, tel que prévu au contrat (facultatif). |
| `admin.partners.batch.none` | Aucun lot pour ce partenaire. |
| `admin.partners.list` | Liste des partenaires |
| `admin.partners.search` | Rechercher un partenaire |
| `admin.partners.filter.all` | Tous |
| `admin.partners.col.batches` | Lots |
| `admin.partners.summary` | {batches, plural, =0 {Aucun lot} one {# lot} other {# lots}} · {seats, plural, =0 {aucune licence} one {# licence} other {# licences}} |
| `admin.partners.status.active` | Actif |
| `admin.partners.status.upcoming` | À venir |
| `admin.partners.status.ended` | Terminé |
| `admin.partners.status.none` | Sans lot |
| `admin.partners.since` | Partenaire depuis le {date, date, long} |
| `admin.partners.contract.none` | Aucun contrat enregistré. La référence, le montant et les dates du contrat sont saisis avec chaque lot de licences. |
| `admin.partners.contract.fromBatch` | Contrat du lot le plus récent, « {name} ». |
| `admin.partners.batches.title` | Lots de licences |
| `admin.partners.batches.plan` | Forfait |
| `admin.partners.batches.seats` | Licences |
| `admin.partners.batches.months` | Durée |
| `admin.partners.batches.minGroup` | Seuil |
| `admin.partners.batches.status` | Statut |
| `admin.partners.batches.monthsValue` | {months} mois |
| `admin.partners.batch.minGroupHint` | Tout indicateur portant sur moins de {count} personnes est masqué. |
| `admin.partners.creation` | Création |
| `admin.partners.cancel` | Annuler |
| `admin.partners.edit` | Modifier le partenaire |
| `admin.partners.editText` | Le nom et le type s'affichent dans l'espace partenaire et sur les pages d'activation des licences. |
| `admin.partners.save` | Enregistrer |
| `admin.partners.updated` | Partenaire modifié. |
| `admin.partners.errorMotif` | Indiquez le motif (au moins 3 caractères) avant d'enregistrer. |
| `admin.partners.errorStarted` | La date de début ne change plus : le lot a commencé ou une licence est déjà active. |
| `admin.partners.errorEnd` | La nouvelle fin doit suivre la fin actuelle et la date du jour. |
| `admin.partners.batch.reasonHint` | Par exemple : contrat signé le 10 octobre, bon de commande reçu. |
| `admin.partners.batch.open` | Voir la fiche du lot {name} |
| `admin.partners.lot.title` | Fiche du lot |
| `admin.partners.lot.period` | Du {start, date, long} au {end, date, long} |
| `admin.partners.lot.plan` | Forfait {plan} · {months} mois par bénéficiaire |
| `admin.partners.lot.used` | {percent} % des licences utilisées |
| `admin.partners.lot.codes.title` | Licences et codes |
| `admin.partners.lot.codes.seats` | Licences prévues |
| `admin.partners.lot.codes.activated` | Utilisées |
| `admin.partners.lot.codes.active` | En cours |
| `admin.partners.lot.codes.unused` | Codes distribués, pas encore utilisés |
| `admin.partners.lot.codes.available` | Restantes à distribuer |
| `admin.partners.lot.codes.expired` | Expirées |
| `admin.partners.lot.codes.revoked` | Retirées |
| `admin.partners.lot.impact.title` | Impact des bénéficiaires |
| `admin.partners.lot.impact.rule` | Chaque chiffre qui porte sur moins de {count} personnes est masqué, comme dans l'espace partenaire. |
| `admin.partners.lot.impact.active` | Personnes actives |
| `admin.partners.lot.impact.completed` | Formations terminées |
| `admin.partners.lot.impact.certificates` | Attestations obtenues |
| `admin.partners.lot.impact.applications` | Candidatures envoyées |
| `admin.partners.lot.impact.hires` | Embauches déclarées |
| `admin.partners.lot.impact.hidden` | Masqué |
| `admin.partners.lot.edit` | Modifier le lot |
| `admin.partners.lot.editText` | Le nom, la référence et le montant du contrat. La date de début ne change que tant que le lot n'a pas commencé. |
| `admin.partners.lot.extend` | Prolonger le lot |
| `admin.partners.lot.extendText` | Choisissez une nouvelle fin de contrat. Les licences en cours qui s'arrêtaient à l'ancienne fin vont jusqu'à leur durée prévue, dans la limite de la nouvelle fin. |
| `admin.partners.lot.extendEnd` | Nouvelle fin du contrat |
| `admin.partners.lot.extendConfirm` | Prolonger |
| `admin.partners.lot.updated` | Lot modifié. |
| `admin.partners.lot.extended` | Lot prolongé. {count, plural, =0 {Aucune licence en cours n'était limitée par l'ancienne fin.} one {# licence en cours a été prolongée.} other {# licences en cours ont été prolongées.}} |

### `/admin/ia` · IA et poids du matching

| Clé | Texte |
|---|---|
| `admin.ai.title` | IA et matching |
| `admin.ai.tab.usage` | Consommation |
| `admin.ai.tab.weights` | Poids du matching |
| `admin.ai.tab.disputes` | Révisions humaines |
| `admin.ai.tab.audit` | Journal d'audit |
| `admin.ai.usage.byFeature` | Par fonction |
| `admin.ai.usage.byPlan` | Par forfait |
| `admin.ai.usage.cost.text` | Coût estimé : {amount} {currency} |
| `admin.ai.usage.credits` | Crédits consommés : {count} |
| `admin.ai.usage.feature.cvCoach` | Coach CV |
| `admin.ai.usage.feature.documents` | Lettres et correction |
| `admin.ai.usage.feature.linkedin` | Préparation LinkedIn |
| `admin.ai.usage.feature.diagnostic` | Diagnostic personnalisé |
| `admin.ai.usage.feature.interviewText` | Simulations écrites |
| `admin.ai.usage.feature.interviewVoice` | Simulations orales |
| `admin.ai.usage.feature.cvAnalysis` | Analyse de CV (recruteurs) |
| `admin.ai.usage.feature.jobDraft` | Rédaction d'offres |
| `admin.ai.usage.feature.learnCoach` | Coach IA des formations |
| `admin.ai.usage.feature.cvParse` | Lecture de CV à l'import |
| `admin.ai.usage.period` | 30 derniers jours |
| `admin.ai.usage.col.feature` | Fonction |
| `admin.ai.usage.col.plan` | Forfait |
| `admin.ai.usage.col.calls` | Appels |
| `admin.ai.usage.col.failures` | Échecs |
| `admin.ai.usage.col.tokens` | Jetons (entrée / sortie) |
| `admin.ai.usage.col.cost` | Coût estimé (USD) |
| `admin.ai.usage.plan.none` | Sans forfait |
| `admin.ai.usage.empty` | Aucun appel d'IA sur la période. |
| `admin.ai.usage.noPrice` | Prix inconnu pour {models} : le coût de ces appels n'est pas estimé. Ajoutez le tarif dans src/server/ai/prices.ts. |
| `admin.ai.scores.title` | Répartition des scores calculés |
| `admin.ai.scores.count` | {count, plural, one {# score} other {# scores}} |
| `admin.ai.scores.empty` | Aucun score calculé pour le moment. |
| `admin.ai.usage.cost.perFeature` | Coût par crédit, à mettre à jour selon le fournisseur |
| `admin.ai.weights.title` | Poids par défaut du matching |
| `admin.ai.weights.subtitle` | Répartition proposée aux recruteurs à la création d'une offre. Total : 100. Les recruteurs peuvent l'ajuster pour leurs offres. |
| `admin.ai.weights.criterion` | Critère |
| `admin.ai.weights.value` | Poids |
| `admin.ai.weights.total` | Total : {total}/100 |
| `admin.ai.weights.error` | Le total doit être égal à 100. |
| `admin.ai.weights.bands.title` | Bandes de score |
| `admin.ai.weights.bands.hint` | Seuils d'affichage : 85, 70 et 50. |
| `admin.ai.weights.excluded.title` | Données exclues du calcul |
| `admin.ai.weights.excluded.body` | Genre, âge, photo, origine, religion, situation familiale, état de santé, forfait du talent. Cette liste ne peut pas être modifiée. |
| `admin.ai.weights.impact` | Les scores existants seront recalculés. Les recruteurs et les talents verront la nouvelle explication. |
| `admin.ai.weights.save` | Enregistrer les poids |
| `admin.ai.weights.version` | Version en vigueur : {version} |
| `admin.ai.weights.default` | Poids par défaut de la spécification |
| `admin.ai.weights.note` | Motif du changement |
| `admin.ai.weights.history` | Versions précédentes |
| `admin.ai.weights.historyItem` | {version}, du {date} |
| `admin.ai.weights.saved` | Poids enregistrés. Recalcul des scores en cours. |
| `admin.ai.disputes.title` | Révisions humaines demandées |
| `admin.ai.disputes.col.talent` | Talent |
| `admin.ai.disputes.col.job` | Offre |
| `admin.ai.disputes.col.reason` | Motif |
| `admin.ai.disputes.col.age` | Ouverte depuis |
| `admin.ai.disputes.recompute` | Recalculer le score |
| `admin.ai.disputes.correct` | Corriger et notifier |
| `admin.ai.disputes.confirm` | Confirmer le score et expliquer |
| `admin.ai.disputes.response` | Réponse envoyée au talent |
| `admin.ai.disputes.resolved` | Révision clôturée. Le talent a été prévenu par e-mail. |
| `admin.ai.disputes.empty` | Aucune révision en attente. |
| `admin.ai.disputes.take` | Prendre en charge |
| `admin.ai.disputes.scoreBefore` | Score contesté : {score} % |
| `admin.ai.disputes.recruiterNotified` | Le talent souhaite que le recruteur soit prévenu. |
| `admin.ai.disputes.responseHint` | Obligatoire pour confirmer le score : expliquez au talent ce qui a été vérifié. |
| `admin.ai.disputes.responseMissing` | Écrivez une réponse au talent pour confirmer le score. |
| `admin.ai.audit.title` | Journal d'audit IA |
| `admin.ai.audit.desc` | Chaque calcul de score conserve les poids utilisés, les critères évalués et la version du modèle, pour permettre une explication et une révision. |
| `admin.ai.audit.filter` | Filtrer par utilisateur, offre ou fonction |
| `admin.ai.weights.desc.requiredSkills` | Les compétences que l'offre exige, comparées à celles du profil et à leur niveau. |
| `admin.ai.weights.desc.preferredSkills` | Les compétences qui sont un plus pour le poste. |
| `admin.ai.weights.desc.experience` | Les années d'expérience utiles au poste, stages et engagements compris. |
| `admin.ai.weights.desc.education` | Le niveau et le domaine d'études, ou l'expérience équivalente si l'offre l'accepte. |
| `admin.ai.weights.desc.languages` | Les langues demandées et le niveau attendu. |
| `admin.ai.weights.desc.location` | La distance au lieu de travail, la mobilité et le mode de travail accepté. |
| `admin.ai.weights.desc.contract` | Le contrat proposé et la date de disponibilité, comparés aux souhaits du talent. |
| `admin.ai.weights.desc.semantic` | Similarité entre le profil et l'offre, calculée par le modèle. |
| `admin.ai.weights.excluded.list` | Genre, Âge, Photo, Origine, Religion, Situation familiale, État de santé, Forfait du talent |
| `admin.ai.weights.excluded.locked` | Cette liste ne peut pas être modifiée. |
| `admin.ai.usage.cost.label` | Coût estimé |
| `admin.ai.usage.calls` | Appels |
| `admin.ai.usage.share` | {percent} % |
| `admin.ai.disputes.days` | {count} j |
| `admin.ai.disputes.seeAll` | Traiter les révisions |
| `admin.ai.audit.action.weights` | Nouvelle version des poids |
| `admin.ai.audit.action.inReview` | Révision prise en charge |
| `admin.ai.audit.action.corrected` | Score corrigé et talent prévenu |
| `admin.ai.audit.action.confirmed` | Score confirmé et expliqué |
| `admin.ai.audit.empty` | Aucune action sur le matching pour le moment. |
| `admin.ai.audit.by` | Par {name} |
| `admin.ai.usage.col.credits` | Crédits |
| `admin.ai.usage.col.people` | Personnes |
| `admin.ai.usage.creditsTotal` | {count, plural, =0 {aucun crédit consommé} one {# crédit consommé} other {# crédits consommés}} |
| `admin.ai.cost.title` | Coût par forfait |
| `admin.ai.cost.text` | Coût estimé de l'IA par personne sur 30 jours, comparé au prix mensuel du forfait. À partir de {percent} %, le forfait coûte trop cher en IA. |
| `admin.ai.cost.col.perPerson` | Coût par personne |
| `admin.ai.cost.col.price` | Prix mensuel |
| `admin.ai.cost.col.share` | Part du prix |
| `admin.ai.cost.free` | Gratuit |
| `admin.ai.cost.quote` | Sur devis |
| `admin.ai.cost.alert` | Alerte : l'IA coûte {percent} % du prix du forfait {plan}. |
| `admin.ai.cost.ok` | Aucun forfait ne dépasse {percent} % de son prix en coût d'IA. |
| `admin.ai.budget.title` | Budget du mois |
| `admin.ai.budget.none` | Aucun budget mensuel n'est fixé. Ajoutez la variable AI_MONTHLY_BUDGET_USD (en USD) pour suivre les dépenses d'IA du mois. |
| `admin.ai.budget.value` | {spent} sur {budget} ({percent} %) |
| `admin.ai.budget.spent` | {spent} dépensés ce mois-ci |
| `admin.ai.budget.near` | Le budget d'IA du mois est presque atteint. |
| `admin.ai.budget.over` | Le budget d'IA du mois est dépassé. |
| `admin.ai.exhausted` | {count, plural, =0 {Aucun compte n'a épuisé ses crédits d'IA de la période.} one {# compte a épuisé ses crédits d'IA de la période.} other {# comptes ont épuisé leurs crédits d'IA de la période.}} |
| `admin.ai.models.title` | Modèles utilisés |
| `admin.ai.models.text` | Les modèles se règlent dans les variables d'environnement AI_MODEL_DEFAULT et AI_MODEL_FAST, jamais dans l'administration. |
| `admin.ai.models.default` | Modèle principal |
| `admin.ai.models.fast` | Modèle rapide |
| `admin.ai.models.unset` | Non défini |

### `/admin/contenus` · Contenus éditables

| Clé | Texte |
|---|---|
| `admin.content.title` | Contenus |
| `admin.content.tab.faq` | FAQ |
| `admin.content.tab.banners` | Bannières |
| `admin.content.tab.texts` | Textes de l'interface |
| `admin.content.tab.tips` | Conseils de préparation |
| `admin.content.faq.add` | Ajouter une question |
| `admin.content.faq.theme` | Thème |
| `admin.content.faq.question` | Question |
| `admin.content.faq.answer` | Réponse |
| `admin.content.banner.add` | Nouvelle bannière |
| `admin.content.banner.text` | Texte |
| `admin.content.banner.audience.text` | Public visé |
| `admin.content.banner.audience.all` | Tous |
| `admin.content.banner.audience.talents` | Talents |
| `admin.content.banner.audience.recruiters` | Recruteurs et entreprises |
| `admin.content.banner.audience.partners` | Partenaires |
| `admin.content.banner.start` | Début d'affichage |
| `admin.content.banner.end` | Fin d'affichage |
| `admin.content.banner.style.info` | Information |
| `admin.content.banner.style.warning` | Avertissement |
| `admin.content.texts.key` | Clé |
| `admin.content.texts.value` | Texte |
| `admin.content.texts.warning` | Conservez les variables entre accolades, par exemple {firstName}. |
| `admin.content.texts.rules` | Rappels : pas de numéro de téléphone, pas d'em-dash, vouvoiement. |
| `admin.content.publish` | Publier |
| `admin.content.published` | Contenu publié. |
| `admin.content.history` | Historique des versions |
| `admin.content.restore` | Restaurer cette version |
| `admin.content.subtitle` | Modifiez la FAQ et publiez des bannières sans nouvelle mise en ligne. Les textes d'origine restent dans textes/ et peuvent être rétablis à tout moment. |
| `admin.content.group.home` | Accueil (FAQ courte) |
| `admin.content.group.pricing` | Tarifs (FAQ facturation) |
| `admin.content.faq.count` | {count, plural, =0 {Aucune question} one {# question} other {# questions}} |
| `admin.content.faq.status.edited` | Modifiée |
| `admin.content.faq.status.added` | Ajoutée |
| `admin.content.faq.status.hidden` | Masquée |
| `admin.content.faq.edit` | Modifier |
| `admin.content.faq.hide` | Masquer cette question |
| `admin.content.faq.show` | Afficher à nouveau |
| `admin.content.faq.reset` | Rétablir le texte d'origine |
| `admin.content.faq.delete` | Supprimer cette question |
| `admin.content.banner.style.text` | Style |
| `admin.content.banner.empty` | Aucune bannière. Une bannière s'affiche en haut des pages pour le public choisi, entre ses dates de début et de fin (incluses). |
| `admin.content.banner.dates` | Du {start} au {end} |
| `admin.content.banner.always` | Sans date de fin |
| `admin.content.banner.delete` | Supprimer la bannière |
| `admin.content.banner.save` | Enregistrer la bannière |
| `admin.content.banner.where` | La bannière « Tous » s'affiche aussi sur le site public ; les autres seulement dans l'espace connecté correspondant. |
| `admin.content.saved` | Modification enregistrée. |
| `admin.content.deleted` | Contenu supprimé. |
| `admin.content.error` | Vérifiez les champs : la question fait au moins 3 caractères, la réponse au moins 3, et la date de fin suit la date de début. |
| `admin.content.reasonMissing` | Indiquez le motif de la modification avant de publier. |
| `admin.content.search` | Question ou réponse |
| `admin.content.col.status` | Statut |
| `admin.content.col.updated` | Modifié |
| `admin.content.faq.status.original` | D'origine |
| `admin.content.faq.pick` | Choisissez une question dans la liste pour la modifier, ou ajoutez-en une ci-dessous. |
| `admin.content.faq.searchEmpty` | Aucune question ne correspond à cette recherche. |
| `admin.content.preview` | Aperçu |
| `admin.content.changes.title` | Dernières modifications |
| `admin.content.changes.empty` | Aucune modification enregistrée pour l'instant. |
| `admin.content.changes.by` | {date} · {name} |
| `admin.content.changes.version` | Version {number} |
| `admin.content.changes.current` | En ligne |
| `admin.content.changes.action.faqSave` | Question enregistrée |
| `admin.content.changes.action.faqHide` | Question masquée |
| `admin.content.changes.action.faqReset` | Texte d'origine rétabli |
| `admin.content.changes.action.bannerSave` | Bannière enregistrée |
| `admin.content.changes.action.bannerDelete` | Bannière supprimée |
| `admin.content.changes.unknownActor` | Compte supprimé |
| `admin.content.banner.status.scheduled` | Programmée |
| `admin.content.banner.status.live` | En ligne |
| `admin.content.banner.status.ended` | Terminée |
| `admin.content.banner.count` | {count, plural, =0 {Aucune bannière} one {# bannière} other {# bannières}} |
| `admin.content.tips.title` | Fiches conseils |
| `admin.content.tips.where` | Les fiches publiées s'affichent pour tous les talents, gratuitement, dans Career · Conseils de préparation. Elles sont écrites ici, sans IA. |
| `admin.content.tips.count` | {count, plural, =0 {Aucune fiche publiée} one {# fiche publiée} other {# fiches publiées}} |
| `admin.content.tips.status.published` | Publiée |
| `admin.content.tips.status.draft` | Brouillon |
| `admin.content.tips.status.empty` | À écrire |
| `admin.content.tips.field.title` | Titre |
| `admin.content.tips.field.body` | Texte de la fiche |
| `admin.content.tips.field.bodyHint` | Au moins 20 caractères. Séparez les paragraphes par une ligne vide. |
| `admin.content.tips.field.minutes` | Temps de lecture (minutes) |
| `admin.content.tips.field.published` | Publier la fiche pour les talents |
| `admin.content.tips.add` | Nouvelle fiche |
| `admin.content.tips.pick` | Choisissez une fiche dans la liste pour l'écrire ou la modifier, ou créez-en une nouvelle ci-dessous. |
| `admin.content.tips.save` | Enregistrer la fiche |
| `admin.content.tips.error` | Vérifiez les champs : un titre d'au moins 3 caractères, un texte d'au moins 20 et un temps de lecture entre 1 et 60 minutes. |
| `admin.content.versions.title` | Versions précédentes |
| `admin.content.versions.text` | Chaque enregistrement garde la version d'avant. « Restaurer » la remet en ligne et garde aussi la version actuelle. |
| `admin.content.versions.empty` | Aucune version précédente pour ce contenu. |
| `admin.content.versions.item` | Remplacée le {date} par {name} |
| `admin.content.versions.original` | Texte d'origine (textes de l'interface) |
| `admin.content.versions.none` | Aucun contenu (pas encore créé) |
| `admin.content.versions.reason` | Motif du changement : {reason} |
| `admin.content.versions.restore` | Restaurer cette version |
| `admin.content.versions.restored` | Version restaurée. |
| `admin.content.changes.action.tipSave` | Fiche enregistrée |
| `admin.content.changes.action.restore` | Version restaurée |

### `/admin/signalements` · Signalements

| Clé | Texte |
|---|---|
| `admin.reports.title` | Signalements |
| `admin.reports.tab.open` | Ouverts ({count}) |
| `admin.reports.tab.inProgress` | En cours |
| `admin.reports.tab.closed` | Clôturés |
| `admin.reports.filter.type` | Type de contenu |
| `admin.reports.type.job` | Offre |
| `admin.reports.type.message` | Message |
| `admin.reports.type.conversation` | Conversation |
| `admin.reports.type.question` | Question de formation |
| `admin.reports.type.profile` | Profil |
| `admin.reports.type.organization` | Organisation |
| `admin.reports.type.aiSuggestion` | Suggestion IA |
| `admin.reports.col.reason` | Motif |
| `admin.reports.col.reportedBy` | Signalé par |
| `admin.reports.col.count` | Signalements |
| `admin.reports.col.date` | Date |
| `admin.reports.priority.high.text` | Prioritaire |
| `admin.reports.priority.high.hint` | Arnaque, demande de paiement ou harcèlement |
| `admin.reports.messageAccess` | Seul le message signalé et son contexte immédiat sont visibles, pour l'instruction du signalement. |
| `admin.reports.action.dismiss` | Classer sans suite |
| `admin.reports.action.hide` | Masquer le contenu |
| `admin.reports.action.remove` | Retirer le contenu |
| `admin.reports.action.warn` | Avertir l'auteur |
| `admin.reports.action.suspend` | Suspendre l'auteur |
| `admin.reports.action.note` | Note interne |
| `admin.reports.action.notifyReporter` | Informer la personne qui a signalé |
| `admin.reports.resolved` | Signalement traité. |
| `admin.reports.empty` | Aucun signalement ouvert. |
| `admin.reports.search` | Motif, auteur |
| `admin.reports.filter.priority` | Priorité |
| `admin.reports.filter.all` | Tous |
| `admin.reports.priority.normal` | Normale |
| `admin.reports.count` | {count, plural, one {# signalement} other {# signalements}} |
| `admin.reports.detail.title.job` | Offre signalée |
| `admin.reports.detail.title.message` | Message signalé |
| `admin.reports.detail.title.conversation` | Conversation signalée |
| `admin.reports.detail.author` | Auteur |
| `admin.reports.detail.flagged` | message signalé |
| `admin.reports.detail.hidden` | Ce contenu est déjà masqué. |
| `admin.reports.detail.details` | Précisions de la personne qui a signalé |
| `admin.reports.detail.seeJob` | Voir l'offre publiée |
| `admin.reports.detail.decision` | Décision : {action} |
| `admin.reports.confirm.dismiss` | Le signalement sera clôturé sans autre action. |
| `admin.reports.confirm.hide` | Le contenu signalé ne sera plus visible et le signalement sera clôturé. L'identité de la personne qui a signalé n'est jamais communiquée à l'auteur. |
| `admin.reports.confirm.warn` | L'auteur reçoit un avertissement par e-mail et le signalement est clôturé. L'identité de la personne qui a signalé n'est jamais communiquée. |
| `admin.reports.emptyInProgress` | Aucun signalement en cours. |
| `admin.reports.emptyClosed` | Aucun signalement clôturé. |
| `admin.reports.emptyFiltered` | Aucun signalement ne correspond à ces filtres. |
| `admin.reports.list` | Liste des signalements |
| `admin.reports.tab.inProgressCount` | En cours ({count}) |
| `admin.reports.tab.closedCount` | Clôturés ({count}) |
| `admin.reports.order` | Les plus graves d'abord, puis les plus anciens. |
| `admin.reports.severity.2` | Grave |
| `admin.reports.severity.1` | À examiner |
| `admin.reports.severity.0` | Mineur |
| `admin.reports.context.show` | Lire le contexte de la conversation |
| `admin.reports.context.hint` | Les deux messages avant et après le message signalé. Cette lecture est enregistrée dans le journal. |
| `admin.reports.context.title` | Contexte de la conversation |
| `admin.reports.context.talent` | Talent |
| `admin.reports.context.org` | Recruteur |
| `admin.reports.context.reported` | Message signalé |
| `admin.reports.context.hidden` | Message masqué par la modération |
| `admin.reports.jobText` | Texte de l'offre |
| `admin.reports.author.title` | Auteur du contenu |
| `admin.reports.author.none` | Auteur inconnu ou compte supprimé. |
| `admin.reports.author.suspend` | Suspendre l'auteur |
| `admin.reports.author.suspendHint` | Ouvre sa fiche utilisateur, où la suspension demande un motif. |
| `admin.reports.decide.title` | Clôturer le signalement |
| `admin.reports.decide.legend` | Décision |
| `admin.reports.decide.hint` | Les autres signalements ouverts sur ce même contenu sont clôturés avec la même décision. Chaque personne qui a signalé est informée, sans détail sur l'auteur. |
| `admin.reports.decide.submit` | Clôturer avec cette décision |
| `admin.reports.decide.warnHint` | L'auteur reçoit un e-mail d'avertissement avec votre motif ; le contenu reste visible. |
| `admin.reports.decide.dismissHint` | Aucune infraction : le contenu reste visible. |
| `admin.reports.decide.hideHint` | Une offre est retirée (refusée), un message est masqué. |
| `admin.reports.note.title` | Notes internes |
| `admin.reports.note.label` | Ajouter une note interne |
| `admin.reports.note.hint` | Visible seulement par l'équipe Jumanly. Le signalement passe « En cours ». |
| `admin.reports.note.submit` | Ajouter la note |
| `admin.reports.note.empty` | Aucune note pour l'instant. |
| `admin.reports.note.saved` | Note ajoutée. |
| `admin.reports.closedOn` | Clôturé le {date} |
| `admin.reports.decisionReason` | Motif : {reason} |
| `admin.reports.error.motif` | Choisissez une décision et indiquez un motif d'au moins 3 caractères. |
| `admin.reports.error.note` | La note doit compter au moins 3 caractères. |
| `admin.reports.nav.prev` | Signalement précédent |
| `admin.reports.nav.next` | Signalement suivant |


---

## Partie 10 · Pages légales

Gabarits structurés des pages `/mentions-legales`, `/confidentialite`, `/conditions` et `/cookies` (doc 07, § 1).

**Ces textes sont des bases de travail, pas des textes juridiques définitifs.** Chaque page doit être relue et validée par un juriste avant publication, au regard du droit applicable dans le pays d'établissement de The Growth Lab et dans les pays où Jumanly est proposé.

Conventions :

- Les éléments entre crochets `[...]` sont à compléter. Une page contenant encore un crochet ne doit pas être publiée.
- Variables ICU pour les valeurs gérées en base ou en configuration : `{lastUpdated}`, `{graceDays}`.
- Contact exclusivement par e-mail : assistant@jumanly.io (professionnel) et infojumanly@gmail.com (général). Aucun téléphone.
- Les durées de conservation, règles de prorata, de résiliation et de remboursement sont des propositions ou des emplacements « [à définir] » à arbitrer avec le juriste.

### Commun · Pages légales

*Éléments partagés par les quatre pages.*

| Clé | Texte |
|---|---|
| `legal.validationBanner` | À faire valider par un juriste avant publication |
| `legal.lastUpdated` | Dernière mise à jour : {lastUpdated} |
| `legal.toc` | Sommaire |
| `legal.eyebrow` | Informations légales |
| `legal.print` | Imprimer |
| `legal.backToTop` | Haut de page |
| `legal.contactLine` | Pour toute question : infojumanly@gmail.com. Pour les professionnels et partenaires : assistant@jumanly.io. |
| `legal.nav.notice` | Mentions légales |
| `legal.nav.privacy` | Confidentialité |
| `legal.nav.terms` | Conditions générales |
| `legal.nav.cookies` | Cookies |

Note d'intégration : `legal.validationBanner` est affiché en tête de chaque page légale dans les environnements de test, et retiré une fois la validation obtenue.

---

### `/mentions-legales` · Mentions légales

*Identifier l'éditeur, le responsable de publication et l'hébergeur du site.*

**À faire valider par un juriste avant publication.**

| Clé | Texte |
|---|---|
| `notice.seo.title` | Mentions légales · Jumanly |
| `notice.seo.description` | Informations légales sur l'éditeur et l'hébergeur de la plateforme Jumanly. |
| `notice.title` | Mentions légales |
| `notice.intro` | Le site jumanly.io et la plateforme Jumanly sont édités par The Growth Lab. Les présentes mentions informent les utilisateurs de l'identité des différents intervenants. |
| `notice.publisher.title` | 1. Éditeur |
| `notice.publisher.text` | Jumanly est une plateforme développée et éditée par The Growth Lab. Raison sociale : [raison sociale de The Growth Lab]. Forme juridique : [forme juridique]. Capital social : [montant, si applicable]. Siège social : [adresse complète]. Pays : [pays d'immatriculation]. Numéro d'immatriculation : [numéro RCCM ou équivalent]. Numéro d'identification fiscale : [numéro]. E-mail : infojumanly@gmail.com. |
| `notice.director.title` | 2. Responsable de la publication |
| `notice.director.text` | [Fonction du responsable de la publication au sein de The Growth Lab]. Contact : assistant@jumanly.io. |
| `notice.host.title` | 3. Hébergement |
| `notice.host.text` | La plateforme est hébergée par : [nom de l'hébergeur], [forme juridique], [adresse], [pays]. Les données sont stockées dans les centres de données situés : [pays ou région des serveurs]. |
| `notice.ip.title` | 4. Propriété intellectuelle |
| `notice.ip.text` | La marque Jumanly, le logo, le slogan « Learn. Grow. Connect. », la charte graphique, le code spécifique de la plateforme et les contenus pédagogiques sont protégés. Leur titularité est établie contractuellement par The Growth Lab [à préciser]. Toute reproduction ou utilisation sans autorisation écrite préalable est interdite. Les contenus publiés par les utilisateurs (profils, CV, offres) restent leur propriété, dans les conditions prévues par les conditions générales. |
| `notice.content.title` | 5. Contenus publiés par les utilisateurs |
| `notice.content.text` | Les offres d'emploi sont publiées sous la responsabilité des recruteurs et des entreprises qui les diffusent. The Growth Lab modère les contenus signalés et peut retirer tout contenu manifestement illicite, frauduleux ou contraire aux conditions générales. Pour signaler un contenu : bouton « Signaler » ou infojumanly@gmail.com. |
| `notice.liability.title` | 6. Responsabilité |
| `notice.liability.text` | The Growth Lab met tout en œuvre pour assurer l'exactitude des informations et la disponibilité du service, sans pouvoir garantir une disponibilité permanente. Les suggestions de l'intelligence artificielle sont fournies à titre indicatif et ne constituent ni un conseil professionnel garanti, ni une décision de recrutement. |
| `notice.law.title` | 7. Droit applicable |
| `notice.law.text` | Les présentes mentions sont régies par le droit [pays de juridiction]. |
| `notice.contact.title` | 8. Contact |
| `notice.contact.text` | Questions générales : infojumanly@gmail.com. Professionnels, partenaires et presse : assistant@jumanly.io. Site : jumanly.io. |

---

### `/confidentialite` · Politique de confidentialité

*Expliquer simplement quelles données sont traitées, pourquoi, combien de temps, avec qui elles sont partagées, et comment exercer ses droits.*

**À faire valider par un juriste avant publication.** Vérifier en particulier la conformité aux lois de protection des données applicables [lois nationales à identifier, et RGPD si des utilisateurs résident dans l'Union européenne].

| Clé | Texte |
|---|---|
| `privacy.seo.title` | Politique de confidentialité · Jumanly |
| `privacy.seo.description` | Comment Jumanly traite vos données personnelles, utilise l'IA de façon explicable et respecte vos choix de visibilité. |
| `privacy.title` | Politique de confidentialité |
| `privacy.summary.title` | L'essentiel en quelques lignes |
| `privacy.summary.item1` | Vous choisissez qui voit votre profil. |
| `privacy.summary.item2` | L'IA fait des suggestions expliquées. Elle ne prend aucune décision de recrutement. |
| `privacy.summary.item3` | Les institutions partenaires ne voient que des statistiques agrégées, jamais vos CV ni vos messages sans votre accord. |
| `privacy.summary.item4` | Nous ne vendons pas vos données. |
| `privacy.summary.item5` | Vous pouvez exporter vos données et supprimer votre compte à tout moment. |
| `privacy.controller.title` | 1. Responsable du traitement |
| `privacy.controller.text` | Le responsable du traitement est The Growth Lab, [raison sociale], [adresse], [pays], éditeur de Jumanly. Pour toute question relative à vos données : infojumanly@gmail.com. [Délégué à la protection des données ou référent : à désigner, contact par e-mail uniquement]. |
| `privacy.data.title` | 2. Données que nous traitons |
| `privacy.data.account` | Données de compte : nom, prénom, adresse e-mail, mot de passe chiffré, pays, ville, langue, profil choisi à l'inscription, consentements. |
| `privacy.data.profile` | Données de profil professionnel : titre, résumé, photo (facultative), expériences, formations, compétences et niveaux, langues, disponibilité, préférences (contrat, lieu, télétravail, salaire souhaité), réglage de visibilité. |
| `privacy.data.documents` | Documents : CV importés ou créés, lettres, biographie, portfolio, pièces transmises à un recruteur. |
| `privacy.data.learning` | Données d'apprentissage : formations suivies, progression, résultats aux quiz et évaluations, attestations. |
| `privacy.data.career` | Données de préparation : réponses au diagnostic de carrière, plan de progression, simulations d'entretien (texte et, pour les simulations vocales, enregistrement audio et transcription). |
| `privacy.data.applications` | Données de candidature : offres consultées, enregistrées, candidatures, étapes, notes et évaluations des recruteurs, historique des décisions. |
| `privacy.data.messages` | Communications : messages, invitations, demandes de documents, rendez-vous. |
| `privacy.data.org` | Données des recruteurs et organisations : identité professionnelle, fonction, organisation, offres publiées, membres, rôles, informations de vérification de l'entreprise. |
| `privacy.data.billing` | Données de paiement : formule, historique, montants, opérateur Mobile Money et numéro utilisé (masqué), quatre derniers chiffres de la carte, informations de facturation. Les données complètes de carte et les codes secrets Mobile Money sont traités par nos prestataires de paiement et ne sont jamais conservés par Jumanly. |
| `privacy.data.technical` | Données techniques : journaux de connexion, adresse IP, type d'appareil et de navigateur, cookies (voir la politique cookies). |
| `privacy.data.ai` | Données d'usage de l'IA : demandes adressées aux assistants, suggestions produites, suggestions appliquées ou ignorées, consommation des quotas. |
| `privacy.data.sensitive` | Nous ne vous demandons pas de données sensibles (origine, religion, opinions, santé, etc.). Évitez de les inclure dans votre CV ou vos messages. [Traitement éventuel de données relatives au handicap à des fins d'inclusion : à étudier avec le juriste] |
| `privacy.purposes.title` | 3. Pourquoi nous les traitons |
| `privacy.purposes.service` | Fournir le service : créer et gérer votre compte, vos formations, vos documents, vos candidatures et vos échanges. Base : exécution du contrat (conditions générales). |
| `privacy.purposes.matching` | Rapprocher talents et offres : calculer une compatibilité, suggérer des offres, des formations ou des profils, avec une explication. Base : exécution du contrat [et intérêt légitime, à valider]. |
| `privacy.purposes.recruitment` | Permettre aux recruteurs de gérer leurs recrutements dans le respect de vos choix de visibilité. Base : exécution du contrat. |
| `privacy.purposes.billing` | Gérer les abonnements, paiements, factures et licences sponsorisées. Base : exécution du contrat et obligations légales comptables. |
| `privacy.purposes.security` | Assurer la sécurité, prévenir la fraude, les faux recruteurs et l'extraction massive de données. Base : intérêt légitime. |
| `privacy.purposes.improvement` | Améliorer la plateforme à partir de statistiques d'usage. Base : intérêt légitime ou consentement pour les cookies de mesure d'audience. |
| `privacy.purposes.partners` | Produire des rapports agrégés pour les institutions qui financent des licences. Base : [intérêt légitime ou exécution du contrat avec le partenaire, à valider]. |
| `privacy.purposes.marketing` | Vous envoyer des conseils et nouveautés par e-mail, si vous l'avez accepté. Base : consentement, retirable à tout moment. |
| `privacy.purposes.legal` | Respecter nos obligations légales et répondre aux demandes des autorités habilitées. |
| `privacy.ai.title` | 4. Intelligence artificielle et matching explicable |
| `privacy.ai.principle` | Chez Jumanly, l'IA recommande et l'humain décide. Les outils d'IA vous aident à rédiger, corriger, vous préparer et repérer des opportunités. Le moteur de matching aide les recruteurs à repérer des profils. Aucune de ces recommandations ne devient automatiquement une décision. |
| `privacy.ai.noAutomatedDecision` | Aucune décision produisant des effets juridiques ou vous affectant de manière significative n'est prise sur le seul fondement d'un traitement automatisé. Aucune candidature n'est acceptée ou refusée automatiquement par l'IA : c'est toujours un recruteur qui décide. |
| `privacy.ai.explanation` | Chaque suggestion est accompagnée d'un lien « Pourquoi ? » qui indique les éléments sur lesquels elle repose : compétences présentes ou manquantes, expériences, critères définis par le recruteur, préférences que vous avez indiquées. |
| `privacy.ai.criteria` | Le score de compatibilité repose uniquement sur des critères professionnels : compétences et leur niveau, expériences, formations, langues, localisation et préférences de travail, critères explicites de l'offre. Il n'utilise ni votre forfait, ni votre photo, ni votre âge, ni votre genre, ni aucune donnée sensible. |
| `privacy.ai.rights` | Vous pouvez à tout moment demander une explication sur une suggestion ou un score, contester un score que vous estimez inexact, et demander l'intervention d'une personne. Écrivez à infojumanly@gmail.com en précisant l'offre ou la suggestion concernée. |
| `privacy.ai.audit` | Les calculs de matching et les suggestions sont journalisés pour permettre leur contrôle et leur explication. |
| `privacy.ai.providers` | Certains traitements d'IA sont réalisés par des prestataires techniques agissant pour notre compte. [Engagement contractuel de non-utilisation des données pour l'entraînement des modèles : à vérifier avant publication] [Liste des prestataires d'IA, pays de traitement et garanties contractuelles à compléter] |
| `privacy.ai.free` | Le diagnostic de carrière simplifié et les conseils généraux de la formule Free reposent sur des règles et des contenus fixes, sans appel à l'IA. |
| `privacy.visibility.title` | 5. Visibilité de votre profil |
| `privacy.visibility.intro` | Vous choisissez qui peut voir votre profil, et vous pouvez changer ce réglage à tout moment dans vos paramètres. |
| `privacy.visibility.private` | Privé : seuls les recruteurs des offres auxquelles vous postulez voient votre profil complet. |
| `privacy.visibility.recruiters` | Visible des recruteurs : votre profil, avec votre nom, apparaît dans le vivier consultable par les recruteurs abonnés. |
| `privacy.visibility.anonymous` | Anonyme : votre profil apparaît dans le vivier sans votre nom ni votre photo. Ils ne sont révélés que si vous acceptez une demande de mise en relation. |
| `privacy.visibility.contact` | Une demande de mise en relation doit être acceptée par vous avant tout échange. Les recherches et demandes des recruteurs sont limitées par des quotas afin d'empêcher l'extraction massive de données. |
| `privacy.visibility.application` | Lorsque vous postulez, le recruteur de l'offre accède à votre profil, aux documents joints et aux échanges liés à cette candidature. |
| `privacy.visibility.public` | Certaines pages peuvent être rendues publiques à votre demande : portfolio partageable, lien de vérification d'une attestation. |
| `privacy.recipients.title` | 6. Qui peut accéder à vos données |
| `privacy.recipients.recruiters` | Les recruteurs et entreprises, dans les limites décrites ci-dessus et selon les rôles attribués au sein de leur organisation. |
| `privacy.recipients.partners` | Les institutions partenaires (Jumanly Partners) qui financent votre licence reçoivent uniquement des rapports agrégés d'usage et d'impact : nombre de licences activées, formations suivies, attestations obtenues, candidatures envoyées, embauches déclarées. Elles n'ont aucun accès à vos CV, messages ni données nominatives, sauf consentement explicite et spécifique de votre part, que vous pouvez retirer à tout moment. |
| `privacy.recipients.team` | Les équipes habilitées de The Growth Lab, pour le support et la modération. Le support n'a pas accès au contenu de vos messages privés. |
| `privacy.recipients.processors` | Nos sous-traitants techniques : hébergement [nom], envoi d'e-mails [nom], paiement Mobile Money et carte [noms], intelligence artificielle [noms], mesure d'audience [nom]. Ils agissent sur nos instructions et sont tenus à la confidentialité. |
| `privacy.recipients.authorities` | Les autorités, lorsque la loi l'exige. |
| `privacy.recipients.noSale` | Nous ne vendons ni ne louons vos données personnelles. |
| `privacy.transfers.title` | 7. Transferts hors de votre pays |
| `privacy.transfers.text` | Certains prestataires peuvent traiter des données dans d'autres pays : [liste des pays]. Ces transferts sont encadrés par [garanties contractuelles ou mécanismes applicables, à préciser]. |
| `privacy.retention.title` | 8. Durées de conservation |
| `privacy.retention.intro` | Nous conservons vos données le temps nécessaire aux finalités décrites. Durées proposées, à valider : |
| `privacy.retention.account` | Compte et profil : tant que le compte est actif. Compte inactif depuis [durée à définir] : information par e-mail, puis suppression ou anonymisation. |
| `privacy.retention.applications` | Candidatures et échanges associés : [durée à définir] après la clôture de l'offre, sauf si vous supprimez votre compte avant. |
| `privacy.retention.recruiterNotes` | Notes, évaluations et historique des décisions des recruteurs : [durée à définir] après la clôture de l'offre. |
| `privacy.retention.voice` | Enregistrements audio des simulations d'entretien : [durée à définir, la plus courte possible] ; la transcription et le feedback restent disponibles dans votre espace. |
| `privacy.retention.certificates` | Attestations : conservées tant que le compte existe, pour permettre leur vérification. |
| `privacy.retention.billing` | Factures et données comptables : [durée légale du pays de juridiction]. |
| `privacy.retention.logs` | Journaux techniques et de sécurité : [durée à définir]. |
| `privacy.retention.ai` | Journal d'audit du matching et des suggestions IA : [durée à définir]. |
| `privacy.retention.deletion` | À la suppression de votre compte, vos données sont supprimées ou anonymisées sous [délai à définir], à l'exception de celles que la loi nous oblige à conserver. |
| `privacy.rights.title` | 9. Vos droits |
| `privacy.rights.list` | Selon la loi applicable, vous disposez des droits suivants : accès à vos données ; rectification ; effacement ; limitation du traitement ; opposition ; portabilité ; retrait de votre consentement à tout moment ; droit de ne pas faire l'objet d'une décision fondée exclusivement sur un traitement automatisé ; droit d'obtenir une explication sur une suggestion de l'IA et de la contester ; [droit de définir des directives sur le sort de vos données après votre décès, si applicable]. |
| `privacy.rights.selfService` | Plusieurs de ces droits s'exercent directement dans « Paramètres » : modifier votre profil, changer votre visibilité, exporter vos données, supprimer votre compte, gérer vos préférences d'e-mails. |
| `privacy.rights.howTo` | Pour toute autre demande, écrivez à infojumanly@gmail.com. Nous pouvons vous demander de justifier votre identité. Nous répondons dans un délai de [délai légal à préciser]. |
| `privacy.rights.complaint` | Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l'autorité de protection des données compétente : [nom de l'autorité du pays de juridiction]. |
| `privacy.security.title` | 10. Sécurité |
| `privacy.security.text` | Nous protégeons vos données par des mesures techniques et organisationnelles adaptées : chiffrement des communications, mots de passe chiffrés, contrôle des accès par rôle, journalisation, sauvegardes. En cas de violation de données présentant un risque pour vous, nous vous en informons dans les conditions prévues par la loi. |
| `privacy.minors.title` | 11. Mineurs |
| `privacy.minors.text` | Jumanly est réservée aux personnes âgées d'au moins [âge minimum à définir] ans. [Conditions d'accès des mineurs, par exemple pour les stages, à définir avec le juriste] |
| `privacy.changes.title` | 12. Modifications |
| `privacy.changes.text` | Nous pouvons modifier cette politique. En cas de changement important, nous vous prévenons par e-mail ou dans l'application avant son entrée en vigueur. |
| `privacy.contact.title` | 13. Contact |
| `privacy.contact.text` | Données personnelles et questions générales : infojumanly@gmail.com. Professionnels et partenaires : assistant@jumanly.io. |

---

### `/conditions` · Conditions générales d'utilisation et de vente

*Fixer les règles d'usage de la plateforme et les conditions commerciales des abonnements et licences.*

**À faire valider par un juriste avant publication.** Les règles de prorata, de résiliation et de remboursement sont à arbitrer ; elles sont signalées « [à définir] ».

#### Partie 1 · Conditions générales d'utilisation

| Clé | Texte |
|---|---|
| `terms.seo.title` | Conditions générales d'utilisation et de vente · Jumanly |
| `terms.seo.description` | Règles d'utilisation de la plateforme Jumanly et conditions des abonnements, paiements et licences sponsorisées. |
| `terms.title` | Conditions générales d'utilisation et de vente |
| `terms.intro` | Les présentes conditions régissent l'utilisation de la plateforme Jumanly, éditée par The Growth Lab ([raison sociale], [adresse], [pays]), et la souscription à ses formules payantes. En créant un compte, vous les acceptez. |
| `terms.part1.title` | Partie 1 · Utilisation de la plateforme |
| `terms.definitions.title` | 1. Définitions |
| `terms.definitions.text` | « Plateforme » : le site jumanly.io et ses services. « Utilisateur » : toute personne disposant d'un compte. « Talent » : utilisateur qui utilise les services de formation, de carrière et de candidature. « Recruteur » : utilisateur qui publie des offres et gère des recrutements, seul ou au sein d'une organisation. « Organisation » : entreprise ou structure disposant d'un espace recruteur partagé. « Partenaire » : institution qui finance des licences pour des bénéficiaires. « Formule » : forfait gratuit ou payant définissant les fonctionnalités et quotas accessibles. « Quota » : volume d'utilisation d'une fonctionnalité par période. |
| `terms.services.title` | 2. Services proposés |
| `terms.services.text` | Jumanly réunit cinq services : Learn (formations), Career (outils de carrière), Jobs (offres et candidatures), Hire (gestion du recrutement) et Connect (messagerie, invitations, rendez-vous), soutenus par des outils d'intelligence artificielle. Les fonctionnalités accessibles dépendent de votre formule, décrite sur la page Tarifs. |
| `terms.account.title` | 3. Compte |
| `terms.account.text` | Vous devez fournir des informations exactes et les tenir à jour. Votre compte est personnel ; vous êtes responsable de la confidentialité de vos identifiants. Un même compte peut appartenir à une ou plusieurs organisations, avec les rôles qu'elles vous attribuent. Âge minimum : [à définir]. |
| `terms.free.title` | 4. Gratuité des candidatures |
| `terms.free.text` | La création du compte, du profil et les candidatures sont gratuites et illimitées, quelle que soit la formule. Aucune option payante ne conditionne la candidature. Les profils utilisant la formule gratuite peuvent être sélectionnés et recrutés au même titre que les abonnés payants. |
| `terms.ai.title` | 5. Intelligence artificielle |
| `terms.ai.text` | Les suggestions de l'IA (corrections, recommandations, scores de compatibilité) sont fournies à titre d'aide. Elles sont accompagnées d'une explication et peuvent être appliquées ou ignorées. Elles ne constituent pas une décision de recrutement : seuls les recruteurs décident. L'IA peut se tromper ; vous restez responsable des contenus que vous publiez. Vous pouvez demander une explication ou contester une suggestion à infojumanly@gmail.com. |
| `terms.talentRules.title` | 6. Engagements des talents |
| `terms.talentRules.text` | Vous vous engagez à publier des informations sincères sur votre parcours, à ne pas usurper l'identité d'autrui et à ne pas transmettre de documents falsifiés. |
| `terms.recruiterRules.title` | 7. Engagements des recruteurs et des organisations |
| `terms.recruiterRules.text` | Vous vous engagez à publier des offres réelles, licites et non discriminatoires ; à ne jamais demander d'argent à un candidat pour postuler ou être recruté ; à utiliser les données des candidats uniquement pour le recrutement concerné ; à respecter leurs choix de visibilité ; à ne pas extraire, copier ou revendre les données du vivier ; à respecter le droit du travail et la protection des données applicables. Le titulaire du compte organisation est responsable des actions de ses membres. |
| `terms.partnerRules.title` | 8. Partenaires |
| `terms.partnerRules.text` | Les partenaires accèdent à des rapports agrégés. Ils n'ont aucun accès aux CV, messages ni données nominatives des bénéficiaires sans consentement explicite de ceux-ci. Les conditions particulières de chaque partenariat sont fixées par contrat. |
| `terms.prohibited.title` | 9. Usages interdits |
| `terms.prohibited.text` | Sont notamment interdits : les contenus illicites, haineux, discriminatoires ou trompeurs ; les offres frauduleuses ; le harcèlement ; l'envoi de messages non sollicités en masse ; l'extraction automatisée de données (robots, scraping) ; le contournement des quotas ou des mesures de sécurité ; la revente d'accès. |
| `terms.moderation.title` | 10. Modération, suspension et signalement |
| `terms.moderation.text` | Tout utilisateur peut signaler une offre ou un message. The Growth Lab peut retirer un contenu, suspendre ou fermer un compte en cas de manquement, après information de l'utilisateur sauf urgence ou obligation légale. L'utilisateur peut contester par e-mail à infojumanly@gmail.com. |
| `terms.content.title` | 11. Contenus et propriété intellectuelle |
| `terms.content.text` | Vous restez propriétaire des contenus que vous publiez. Vous accordez à The Growth Lab une licence non exclusive, limitée à ce qui est nécessaire au fonctionnement du service (hébergement, affichage aux destinataires autorisés, traitement par les outils d'IA à votre demande). Les formations, la marque et le logiciel Jumanly restent la propriété de leurs titulaires ; les formations sont réservées à un usage personnel. |
| `terms.certificates.title` | 12. Attestations |
| `terms.certificates.text` | Les attestations délivrées par Jumanly Learn certifient la réussite d'une formation sur la plateforme. Elles ne constituent pas un diplôme ni une certification d'État, sauf mention contraire. |
| `terms.availability.title` | 13. Disponibilité et responsabilité |
| `terms.availability.text` | The Growth Lab s'efforce d'assurer l'accès au service en continu, sans garantie de disponibilité permanente. Jumanly n'est pas partie aux relations de travail entre talents et employeurs et ne garantit pas l'obtention d'un emploi ni d'un recrutement. [Limitations de responsabilité à rédiger par le juriste] |
| `terms.data.title` | 14. Données personnelles |
| `terms.data.text` | Le traitement de vos données est décrit dans la politique de confidentialité. |
| `terms.closure.title` | 15. Fermeture du compte |
| `terms.closure.text` | Vous pouvez supprimer votre compte à tout moment depuis vos paramètres. Une formule payante en cours n'est pas remboursée du seul fait de la suppression, sauf règle contraire prévue à l'article 22 [à définir]. |

#### Partie 2 · Conditions générales de vente

| Clé | Texte |
|---|---|
| `terms.part2.title` | Partie 2 · Abonnements, paiements et licences |
| `terms.plans.title` | 16. Formules et prix |
| `terms.plans.text` | Les formules, leurs fonctionnalités, leurs quotas et leurs prix sont décrits sur la page Tarifs, qui fait partie des présentes conditions. Les prix sont exprimés en dollars américains (USD), [toutes taxes comprises ou hors taxes : à préciser selon la fiscalité applicable]. Le montant peut être converti dans votre monnaie locale par l'opérateur ou la banque au moment du paiement ; les frais éventuels de conversion ou de l'opérateur [sont à la charge de l'utilisateur / sont inclus : à définir]. La formule Company Premium et les licences Partners font l'objet d'un devis et d'un contrat spécifiques. |
| `terms.quotas.title` | 17. Quotas |
| `terms.quotas.text` | Certaines fonctionnalités sont soumises à des quotas par période, visibles dans votre tableau de bord. La période est d'un mois à compter de la date de début de l'abonnement. Vous êtes prévenu à 80 % puis à 100 %. Une fois un quota atteint, la fonctionnalité est temporairement limitée jusqu'au renouvellement, sauf achat d'une option ou changement de formule. Les quotas peuvent évoluer ; toute baisse s'applique à la période suivante, après information. Les quotas ne concernent jamais la candidature. |
| `terms.payment.title` | 18. Paiement |
| `terms.payment.text` | Le paiement s'effectue par Mobile Money ou par carte bancaire, via des prestataires de paiement agréés. Les abonnements sont mensuels et payables d'avance. Avec Mobile Money, l'abonnement est prépayé pour une période et n'est pas reconduit automatiquement. [Renouvellement automatique par carte : à définir selon le prestataire] Un reçu et une facture sont mis à disposition après chaque paiement. |
| `terms.renewal.title` | 19. Renouvellement, délai de grâce et retour au forfait gratuit |
| `terms.renewal.text` | Nous vous rappelons l'échéance 7 jours, 3 jours et le jour même. À défaut de renouvellement, votre formule reste active pendant un délai de grâce de {graceDays} jours. À l'issue de ce délai, votre compte revient automatiquement à la formule gratuite de sa famille (Free ou RH Free). Vos données sont conservées ; seules les fonctionnalités payantes sont mises en pause. Pour une organisation, les offres et membres au-delà des limites de la formule gratuite sont mis en pause, sans suppression. |
| `terms.change.title` | 20. Changement de formule |
| `terms.change.text` | Montée en gamme : elle est immédiate. Le temps restant sur la formule précédente est crédité selon la règle suivante : [règle de prorata à définir]. Réduction de gamme : elle prend effet à la fin de la période déjà payée, sans remboursement de la période en cours [à confirmer]. |
| `terms.cancellation.title` | 21. Résiliation |
| `terms.cancellation.text` | Vous pouvez résilier à tout moment depuis « Mon abonnement ». La formule reste active jusqu'à la fin de la période payée, puis le compte revient à la formule gratuite. [Conditions de résiliation par The Growth Lab et de suspension pour manquement : à définir] [Conditions de résiliation des contrats Company Premium et Partners : selon contrat] |
| `terms.refund.title` | 22. Droit de rétractation et remboursement |
| `terms.refund.text` | [Existence et durée d'un droit de rétractation selon le droit applicable : à définir] [Cas de remboursement (double paiement, paiement débité sans activation, indisponibilité prolongée du service) et modalités : à définir] En cas de paiement débité sans activation de votre formule, écrivez à infojumanly@gmail.com avec la référence du paiement : nous régularisons la situation. |
| `terms.sponsored.title` | 23. Licences sponsorisées (Jumanly Partners) |
| `terms.sponsored.text` | Une licence sponsorisée donne accès gratuitement à une formule Starter, Pro ou Premium pour la durée fixée par le partenaire. Elle s'active par un code ou un lien d'invitation, à usage unique et personnel. Si vous avez déjà une formule payante inférieure, la licence s'applique à sa place [règle applicable à la période déjà payée : à définir]. Si votre formule est supérieure, la licence est mise en attente. À la fin de la licence, votre compte revient à la formule gratuite, sans perte de données. |
| `terms.addons.title` | 24. Options complémentaires |
| `terms.addons.text` | Certains services peuvent être proposés séparément (par exemple des crédits supplémentaires d'IA ou de simulation). Leur prix et leurs conditions sont indiqués avant tout achat. Aucune option ne conditionne l'accès gratuit aux candidatures. |
| `terms.priceChange.title` | 25. Évolution des prix et des formules |
| `terms.priceChange.text` | The Growth Lab peut faire évoluer ses prix et ses formules. Toute modification vous est notifiée au moins [délai à définir] avant de s'appliquer, et ne concerne pas la période déjà payée. |
| `terms.invoices.title` | 26. Factures |
| `terms.invoices.text` | Les factures sont disponibles dans « Mon abonnement ». Les organisations peuvent renseigner leur raison sociale, leur adresse et leur numéro fiscal. |

#### Partie 3 · Dispositions finales

| Clé | Texte |
|---|---|
| `terms.part3.title` | Partie 3 · Dispositions finales |
| `terms.modification.title` | 27. Modification des conditions |
| `terms.modification.text` | Nous pouvons modifier les présentes conditions. Les changements importants vous sont notifiés par e-mail ou dans l'application avant leur entrée en vigueur. |
| `terms.law.title` | 28. Droit applicable et litiges |
| `terms.law.text` | Les présentes conditions sont régies par le droit [pays de juridiction]. En cas de différend, nous vous invitons à nous écrire d'abord à infojumanly@gmail.com pour rechercher une solution amiable. À défaut, le litige sera porté devant [juridiction compétente], sous réserve des règles protectrices applicables aux consommateurs. |
| `terms.contact.title` | 29. Contact |
| `terms.contact.text` | Questions générales et facturation des particuliers : infojumanly@gmail.com. Organisations, devis et partenaires : assistant@jumanly.io. |

---

### `/cookies` · Politique cookies

*Expliquer les cookies utilisés et comment modifier ses choix.*

**À faire valider par un juriste avant publication.**

| Clé | Texte |
|---|---|
| `cookiesPolicy.seo.title` | Politique cookies · Jumanly |
| `cookiesPolicy.seo.description` | Quels cookies Jumanly utilise, pourquoi, et comment gérer vos choix. |
| `cookiesPolicy.title` | Politique cookies |
| `cookiesPolicy.what.title` | 1. Qu'est-ce qu'un cookie ? |
| `cookiesPolicy.what.text` | Un cookie est un petit fichier déposé sur votre appareil lors de la consultation d'un site. Il permet de mémoriser des informations, comme votre connexion ou vos préférences. |
| `cookiesPolicy.categories.title` | 2. Les cookies que nous utilisons |
| `cookiesPolicy.necessary.title` | Cookies nécessaires |
| `cookiesPolicy.necessary.text` | Indispensables au fonctionnement du site : maintien de la connexion, sécurité et prévention de la fraude, mémorisation de vos choix de cookies et de langue. Ils ne peuvent pas être désactivés. |
| `cookiesPolicy.analytics.title` | Cookies de mesure d'audience |
| `cookiesPolicy.analytics.text` | Ils nous aident à comprendre comment le site est utilisé afin de l'améliorer. Ils ne sont déposés qu'avec votre accord. Outil utilisé : [nom de l'outil de mesure d'audience]. |
| `cookiesPolicy.preferences.title` | Cookies de préférences |
| `cookiesPolicy.preferences.text` | Ils mémorisent des réglages facultatifs, comme vos filtres de recherche. Ils ne sont déposés qu'avec votre accord. |
| `cookiesPolicy.noAds` | Jumanly n'utilise pas de cookies publicitaires. [À confirmer avant publication] |
| `cookiesPolicy.table.title` | 3. Liste détaillée |
| `cookiesPolicy.table.colName` | Nom |
| `cookiesPolicy.table.colPurpose` | Finalité |
| `cookiesPolicy.table.colCategory` | Catégorie |
| `cookiesPolicy.table.colDuration` | Durée |
| `cookiesPolicy.table.colProvider` | Émetteur |
| `cookiesPolicy.table.content` | [Tableau à générer à partir des cookies réellement déposés en production] |
| `cookiesPolicy.duration.title` | 4. Durée de conservation |
| `cookiesPolicy.duration.text` | Vos choix sont conservés pendant [durée à définir]. Les cookies soumis à consentement ont une durée maximale de [durée à définir]. Nous vous redemandons votre accord à l'issue de cette période. |
| `cookiesPolicy.manage.title` | 5. Gérer vos choix |
| `cookiesPolicy.manage.text` | Vous pouvez modifier vos choix à tout moment avec le lien « Gérer les cookies » en bas de chaque page, ou depuis les réglages de votre navigateur. Refuser les cookies facultatifs n'empêche pas d'utiliser Jumanly. |
| `cookiesPolicy.manage.cta` | Gérer les cookies |
| `cookiesPolicy.contact.title` | 6. Contact |
| `cookiesPolicy.contact.text` | Pour toute question : infojumanly@gmail.com. |

---

## Partie 11 · Socle technique

Textes ajoutés à l'étape E0 : composants de base, textes alternatifs des personnages, écrans provisoires et page interne `/dev/composants` (visible seulement en local et en preview). Les exemples de la page interne sont manifestement fictifs.

### Composants

| Clé | Texte |
|---|---|
| `ui.percent` | {value} % |
| `ui.avatarStack.more` | +{count} |
| `ui.avatarStack.moreAria` | {count, plural, one {et # autre personne} other {et # autres personnes}} |

### Personnages de la marque (textes alternatifs)

| Clé | Texte |
|---|---|
| `brand.characters.amani` | Amani, la talent |
| `brand.characters.kofi` | Kofi, le jeune diplômé |
| `brand.characters.nadia` | Nadia, la recruteuse |
| `brand.characters.diallo` | M. Diallo, le dirigeant |
| `brand.characters.fatou` | Fatou, la formatrice |
| `brand.characters.orbi` | Orbi, l'assistant IA |

### Écrans provisoires du socle (remplacés aux étapes E1 et E3)

| Clé | Texte |
|---|---|
| `foundation.sampleUser` | Aïcha Exemple |
| `foundation.sampleFirstName` | Aïcha |
| `foundation.emptyTitle` | Votre tableau de bord arrive bientôt |
| `foundation.emptyText` | Formations, offres et messages apparaîtront ici. |
| `foundation.seeComponents` | Voir les composants |
| `foundation.samplePlan` | Free |
| `foundation.sampleJobTitle` | Analyste de données junior |
| `foundation.sampleCompany` | Cabinet Exemple |
| `foundation.sampleStage` | Entretien |
| `foundation.sampleDocument` | Copie du diplôme |
| `foundation.sampleRole` | Recruteur |
| `foundation.sampleCourse` | Réussir son CV |
| `foundation.sampleEmail` | aicha.exemple@exemple.com |
| `foundation.sampleMode` | Visio |

### Page /dev/composants

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
| `devComponents.colors.limeClair` | Lime clair #E4FAD0 |
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
| `devComponents.variants.white` | Sur teinte |
| `devComponents.variants.inverse` | Sur fond sombre |
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
| `devComponents.brand.icons` | Icônes : trait, trait blanc et duo |
| `devComponents.brand.characters` | Personnages |
| `devComponents.brand.patterns` | Motifs |
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
| `devComponents.sections.mobileButtons` | Gamme mobile : boutons |
| `devComponents.sections.mobileCards` | Gamme mobile : cartes |
| `devComponents.sections.mobileStates` | Gamme mobile : états d'interaction |
| `devComponents.mobile.principal` | Principal |
| `devComponents.mobile.accent` | Accent |
| `devComponents.mobile.soft` | Secondaire |
| `devComponents.mobile.outline` | Contour |
| `devComponents.mobile.link` | Lien |
| `devComponents.mobile.ai` | Jumanly AI |
| `devComponents.mobile.danger` | Danger |
| `devComponents.mobile.rest` | Repos |
| `devComponents.mobile.loading` | En cours |
| `devComponents.mobile.done` | Fait |
| `devComponents.mobile.disabled` | Désactivé |
| `devComponents.mobile.sizeL` | L · 52 px |
| `devComponents.mobile.sizeM` | M · 44 px |
| `devComponents.mobile.sizeS` | S · 36 px |
| `devComponents.mobile.apply` | Postuler |
| `devComponents.mobile.sending` | Envoi… |
| `devComponents.mobile.sent` | Envoyée |
| `devComponents.mobile.confirm` | Confirmer |
| `devComponents.mobile.reply` | Répondre |
| `devComponents.mobile.resume` | Reprendre |
| `devComponents.mobile.upgrade` | Passer à Pro |
| `devComponents.mobile.start` | Commencer |
| `devComponents.mobile.later` | Plus tard |
| `devComponents.mobile.edit` | Modifier |
| `devComponents.mobile.seeAll` | Tout voir |
| `devComponents.mobile.save` | Enregistrer l'offre |
| `devComponents.mobile.askAi` | Demander à Jumanly AI |
| `devComponents.mobile.improve` | Améliorer |
| `devComponents.mobile.analyse` | Analyser les exigences |
| `devComponents.mobile.delete` | Supprimer |
| `devComponents.mobile.confirmDelete` | Oui, supprimer |
| `devComponents.mobile.goalEyebrow` | Mon objectif |
| `devComponents.mobile.goalTitle` | Trouver un emploi |
| `devComponents.mobile.goalEdit` | Changer d'objectif |
| `devComponents.mobile.statApplications` | candidatures |
| `devComponents.mobile.statInterviews` | entretien |
| `devComponents.mobile.statProfile` | profil |
| `devComponents.mobile.profileSubtitle` | Analyste de données · Ville exemple |
| `devComponents.mobile.visible` | Visible des recruteurs |
| `devComponents.mobile.tileCv` | Mon CV |
| `devComponents.mobile.tileCvLine` | Créer, télécharger |
| `devComponents.mobile.tileInterview` | Entretien |
| `devComponents.mobile.tileInterviewLine` | S'entraîner |
| `devComponents.mobile.tileLocked` | Outil non inclus dans votre formule |
| `devComponents.mobile.aiTitle` | Jumanly AI |
| `devComponents.mobile.aiLine` | Votre copilote carrière |
| `devComponents.mobile.chipCv` | CV |
| `devComponents.mobile.chipJobs` | Offres |
| `devComponents.mobile.chipInterview` | Entretien |
| `devComponents.mobile.fileName` | CV · Analyste de données |
| `devComponents.mobile.fileMeta` | PDF · 2 pages · 184 Ko |
| `devComponents.mobile.fileKind` | PDF |
| `devComponents.mobile.download` | Télécharger |
| `devComponents.mobile.slotWeekday` | jeu. |
| `devComponents.mobile.slotDay` | 23 |
| `devComponents.mobile.slotMonth` | oct. |
| `devComponents.mobile.slotTitle` | Entretien · 10 h |
| `devComponents.mobile.slotMeta` | Visio · 45 min |
| `devComponents.mobile.accept` | Accepter |
| `devComponents.mobile.otherTime` | Autre moment |
| `devComponents.mobile.decisionJob` | Analyste de données junior |
| `devComponents.mobile.rejectedBanner` | Candidature non retenue |
| `devComponents.mobile.rejectedHello` | Bonjour Aïcha, |
| `devComponents.mobile.rejectedBody` | Merci pour votre candidature. Nous avons retenu un autre profil pour ce poste. |
| `devComponents.mobile.hiredBanner` | Candidature retenue |
| `devComponents.mobile.hiredBody` | Nous avons le plaisir de vous proposer le poste. Prochaine étape : un échange sur votre arrivée. |
| `devComponents.mobile.signer` | Recruteur exemple · Recrutement |
| `devComponents.mobile.decisionDate` | 16 oct. |
| `devComponents.mobile.rowTitle` | Modifier mes informations |
| `devComponents.mobile.rowLine` | Photo, bio, titre |
| `devComponents.mobile.rowPressed` | Ligne appuyée |

### Site public (étape E1)

Petits textes techniques des pages publiques qui ne figurent pas dans les parties 01, 05 et 10 : durées, salaires, navigation, e-mails internes du formulaire de contact.

| Clé | Texte |
|---|---|
| `ui.duration.minutes` | {minutes} min |
| `ui.duration.hours` | {hours} h |
| `ui.duration.hoursMinutes` | {hours} h {minutes} min |
| `ui.salary.range` | {min} à {max} USD/mois |
| `ui.salary.from` | À partir de {min} USD/mois |
| `ui.languageLevel` | {language} ({level}) |
| `ui.breadcrumb` | Fil d'Ariane |
| `ui.pagination` | Pagination |
| `ui.unlimited` | Illimité |
| `contactEmail.subject` | Message du site · {subject} · {name} |
| `contactEmail.partnersSubject` | Demande Jumanly Partners · {organization} |
| `contactEmail.intro` | Nouveau message reçu depuis le formulaire du site. Répondez directement à cet e-mail pour écrire à l'expéditeur. |
| `cookiesTable.consent.name` | jm_consent |
| `cookiesTable.consent.purpose` | Mémoriser vos choix de cookies |
| `cookiesTable.consent.category` | Nécessaire |
| `cookiesTable.consent.duration` | 6 mois |
| `cookiesTable.consent.provider` | Jumanly |

### Référencement (moteurs de recherche et assistants IA)

Textes de `/llms.txt`, le résumé du site public lu par les assistants IA (ChatGPT, Claude, Perplexity…). Seules les pages publiques y figurent ; l'espace connecté, les profils et les portfolios n'y sont jamais.

| Clé | Texte |
|---|---|
| `llms.summary` | Jumanly est une plateforme web africaine qui réunit la formation (Learn), le développement de carrière (Career), les offres d'emploi (Jobs) et le recrutement (Hire et Connect), avec une intelligence artificielle explicable. Elle s'adresse aux talents, aux professionnels RH, aux entreprises et aux institutions partenaires. |
| `llms.facts.free` | Candidater à une offre est toujours gratuit, quel que soit le forfait. |
| `llms.facts.ai` | L'IA recommande, l'humain décide : aucun rejet automatique, et chaque score de compatibilité est expliqué. |
| `llms.facts.payment` | Prix en dollars américains (USD), paiement par Mobile Money et carte bancaire. Interface en français. |
| `llms.facts.contact` | Contact uniquement par e-mail : assistant@jumanly.io et infojumanly@gmail.com. |
| `llms.sections.pages` | Pages principales |
| `llms.sections.courses` | Formations publiées |
| `llms.sections.jobs` | Offres d'emploi ouvertes |
| `llms.sections.more` | Pour aller plus loin |
| `llms.sitemap` | Plan du site (toutes les pages publiques) |
| `llms.job` | {title} · {company} · {city} |
