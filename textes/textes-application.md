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

#### Trois publics

| Clé | Texte |
|---|---|
| `home.audiences.title` | Une plateforme, trois façons d'avancer |
| `home.audiences.subtitle` | Que vous cherchiez un emploi, que vous recrutiez seul ou en équipe, Jumanly s'adapte à votre situation. |
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
| `home.trainings.cta` | Voir toutes les formations |
| `home.trainings.empty` | Les premières formations arrivent bientôt. Créez votre compte pour être prévenu de leur ouverture. |

#### Aperçu offres

| Clé | Texte |
|---|---|
| `home.jobs.title` | Les dernières opportunités |
| `home.jobs.subtitle` | Emplois, stages et missions publiés par des recruteurs et des entreprises. Postuler est toujours gratuit. |
| `home.jobs.cta` | Voir toutes les offres |
| `home.jobs.empty` | Les premières offres seront bientôt publiées. Créez votre compte pour préparer votre profil dès maintenant. |
| `home.jobs.recruiterCta` | Vous recrutez ? Publiez une offre gratuitement |

#### Forfaits résumés

| Clé | Texte |
|---|---|
| `home.pricing.title` | Commencez gratuitement, évoluez à votre rythme |
| `home.pricing.subtitle` | Chaque famille de forfaits démarre par une formule gratuite. Les formules payantes ajoutent des outils, jamais une condition pour postuler. |
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
| `about.vision.title` | Notre vision |
| `about.vision.text` | Construire une plateforme africaine de référence qui facilite le développement des compétences, la progression professionnelle et la rencontre entre talents et employeurs. |
| `about.mission.title` | Notre mission |
| `about.mission.text` | Accompagner les individus dans la construction de leur trajectoire professionnelle et permettre aux organisations d'identifier, d'évaluer et de recruter plus efficacement les compétences dont elles ont besoin. |
| `about.positioning.title` | À la croisée de trois univers |
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
| `about.growthlab.text` | Jumanly est développée et portée par The Growth Lab, qui assure la direction stratégique du produit, l'organisation des contenus, la politique commerciale, la gestion des partenariats et la supervision de la plateforme. |
| `about.growthlab.signature` | Une plateforme développée par The Growth Lab |
| `about.launch.title` | Une plateforme construite avec ses utilisateurs |
| `about.launch.text` | Jumanly s'ouvre par étapes : un test fermé, puis une bêta communautaire avec des talents et des employeurs, avant l'ouverture progressive au public. Les retours des premiers utilisateurs façonnent chaque version. |
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
| `talents.intro.title` | Un seul compte pour tout votre parcours |
| `talents.intro.text` | Un seul compte relie vos formations, vos documents de candidature et les offres. Chaque étape nourrit la suivante, et l'IA explique toujours pourquoi elle vous conseille. |
| `talents.learn.label` | Learn |
| `talents.learn.title` | Se former |
| `talents.learn.text` | Formations vidéo, supports, exercices, évaluations et attestations à valoriser sur votre profil. Les premières formations portent sur l'employabilité, les compétences professionnelles, le positionnement et la préparation au recrutement. |
| `talents.learn.imageAlt` | Lecteur de formation avec vidéo, progression et quiz |
| `talents.career.label` | Career |
| `talents.career.title` | Construire son profil |
| `talents.career.text` | Diagnostic de carrière, CV, lettres de motivation, biographie, préparation LinkedIn, plan de progression et simulations d'entretien. Le coach IA justifie chaque suggestion, et vous choisissez de l'appliquer ou non. |
| `talents.career.imageAlt` | Éditeur de CV avec une suggestion du coach IA et son explication |
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
| `talents.privacy.title` | Vous décidez qui vous voit |
| `talents.privacy.text` | Votre profil peut rester privé, être visible des recruteurs, ou apparaître de façon anonyme jusqu'à ce que vous acceptiez une mise en relation. Vous pouvez changer ce réglage à tout moment. |
| `talents.plans.title` | Quatre formules, un même parcours |
| `talents.plans.text` | Commencez gratuitement, puis passez à la formule qui correspond à votre objectif. Chaque formule comprend tout ce que propose la précédente. |
| `talents.plans.note` | Les cartes de formules reprennent les textes `pricing.talent.*` du fichier 05. |
| `talents.plans.cta` | Comparer les formules en détail |
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

---

### `/formations` · Catalogue public

*Laisser le visiteur explorer les formations, comprendre ce qui est gratuit et ce qui demande un forfait.*

| Clé | Texte |
|---|---|
| `trainings.seo.title` | Formations Jumanly Learn · Employabilité et compétences professionnelles |
| `trainings.seo.description` | Formations vidéo, exercices et attestations pour gagner en employabilité. Une sélection est gratuite, les autres sont incluses dans les formules Starter, Pro et Premium. |
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
| `training.preview.videoAlt` | Vidéo d'aperçu de la formation {title} |
| `training.certificate.title` | Une attestation à valoriser |
| `training.certificate.text` | En terminant la formation et ses évaluations, vous obtenez une attestation téléchargeable, vérifiable par un lien public et visible sur votre profil. |
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

---

### `/faq` · Questions fréquentes

*Répondre aux questions courantes de chaque public, classées par thème.*

| Clé | Texte |
|---|---|
| `faq.seo.title` | Questions fréquentes · Jumanly |
| `faq.seo.description` | Gratuité, forfaits, paiement par Mobile Money et carte, intelligence artificielle, confidentialité, recrutement et licences partenaires : toutes les réponses sur Jumanly. |
| `faq.hero.title` | Questions fréquentes |
| `faq.hero.text` | Vous ne trouvez pas votre réponse ? Écrivez-nous, nous vous répondons par e-mail. |
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
| `faq.talents.a4` | Votre compte et votre profil professionnel, un diagnostic de carrière simplifié, la consultation des offres, les candidatures gratuites et leur suivi, un modèle de CV standard, une sélection de formations gratuites, des conseils généraux de préparation et la messagerie liée aux candidatures. |
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
| `auth.error.googleOnly` | Ce compte a été créé avec Google. Utilisez « Continuer avec Google » ou définissez un mot de passe avec « Mot de passe oublié ». |
| `auth.error.googleFailed` | La connexion avec Google n'a pas abouti. Réessayez ou utilisez votre e-mail. |
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
| `email.license.body` | Bonjour, {sponsorName} finance votre accès à la formule {plan} de Jumanly jusqu'au {endDate}. Activez-le avec le code {code} ou en cliquant sur le bouton ci-dessous. |
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

*Repères permanents : cinq destinations pour le talent, plus le menu Hire quand l'espace Organisation est actif.*

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
| `appNav.organization` | Organisation |
| `appNav.partner` | Partenaire |
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
| `appNav.unreadBadge.aria` | {count, plural, one {# élément non lu} other {# éléments non lus}} |
| `appNav.collapse` | Réduire le menu |
| `appNav.expand` | Déplier le menu |
| `appNav.mobile.aria` | Navigation principale |
| `appNav.mobile.more` | Plus |
| `appNav.skipToContent` | Aller au contenu principal |

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

### `/app` · Tableau de bord talent

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
| `talent.dashboard.nextStep.title` | Votre prochaine étape |
| `talent.dashboard.nextStep.completeProfile` | Complétez votre profil pour être mieux vu des recruteurs. |
| `talent.dashboard.nextStep.importCv` | Importez ou créez votre CV en quelques minutes. |
| `talent.dashboard.nextStep.diagnostic` | Faites votre diagnostic de carrière (10 minutes). |
| `talent.dashboard.nextStep.resumeCourse` | Reprenez « {courseTitle} » là où vous l'avez laissée. |
| `talent.dashboard.nextStep.apply` | {count, plural, one {# offre compatible vous attend.} other {# offres compatibles vous attendent.}} |
| `talent.dashboard.nextStep.interview` | Préparez votre entretien avec {company} du {date, date, medium}. |
| `talent.dashboard.nextStep.cta` | Commencer |
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

### `/app/profil` · Profil professionnel

*Construire le profil qui alimente le CV, le matching et la vue recruteur.*

#### En-tête et complétude

| Clé | Texte |
|---|---|
| `talent.profile.title` | Mon profil professionnel |
| `talent.profile.subtitle` | Votre profil alimente votre CV, vos candidatures et les suggestions d'offres. |
| `talent.profile.completion.text` | Profil complété à {percent} % |
| `talent.profile.completion.hint` | Un profil complet aide les recruteurs à vous comprendre. |
| `talent.profile.completion.missing` | Il manque : {sections} |
| `talent.profile.preview.text` | Aperçu côté recruteur |
| `talent.profile.preview.title` | Voici ce qu'un recruteur voit |
| `talent.profile.preview.anonymous` | En mode anonyme, votre nom et votre photo sont masqués jusqu'à ce que vous acceptiez une mise en relation. |
| `talent.profile.importCv.text` | Remplir à partir de mon CV |
| `talent.profile.importCv.hint` | Nous lisons votre CV et pré-remplissons les sections. Vous validez chaque élément. |
| `talent.profile.save` | Enregistrer |
| `talent.profile.saved` | Profil enregistré. |
| `talent.profile.autosaved` | Enregistré automatiquement |
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
| `learn.catalog.title` | Catalogue de formations |
| `learn.seo` | Learn · Formations |
| `learn.catalog.search.label` | Rechercher une formation |
| `learn.catalog.search.submit` | Rechercher |
| `learn.catalog.tabs` | Listes de formations |
| `learn.catalog.certificatesLink` | Mes attestations |
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

### `/app/learn/[slug]` · Fiche formation (avant de commencer)

*Donner tous les éléments pour décider de commencer.*

| Clé | Texte |
|---|---|
| `learn.course.back` | Retour au catalogue |
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
| `learn.player.transcript` | Transcription |
| `learn.player.markComplete` | Marquer comme terminée |
| `learn.player.completed` | Leçon terminée |
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

### `/app/learn/[slug]` · Quiz et résultats

*Vérifier les acquis avec bienveillance, et permettre de réessayer.*

| Clé | Texte |
|---|---|
| `learn.quiz.title` | Quiz · {moduleTitle} |
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
| `career.home.portfolio.title` | Portfolio |
| `career.home.portfolio.desc` | Montrez vos projets sur une page à partager. |
| `career.home.seo` | Career · Jumanly |
| `career.home.later` | Bientôt disponible |
| `career.home.tips.title` | Conseils de préparation |
| `career.home.tips.desc` | Des fiches pratiques pour préparer chaque étape d'un recrutement. |
| `career.home.lock` | Disponible avec {plan} |
| `career.home.quota` | {used}/{quota} ce mois |

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

### `/app/career/diagnostic` · Diagnostic de carrière

*Un questionnaire court qui aide à choisir la suite. Simplifié (règles, sans IA) pour Free ; personnalisé (IA) à partir de Starter.*

#### Introduction et déroulé

| Clé | Texte |
|---|---|
| `career.diagnostic.title` | Diagnostic de carrière |
| `career.diagnostic.intro.simple` | 12 questions, environ 8 minutes. Vous recevez un bilan et des premières pistes. |
| `career.diagnostic.intro.personalized` | 20 questions, environ 15 minutes. Jumanly Intelligence analyse vos réponses et votre profil pour un bilan personnalisé. |
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
| `career.diagnostic.q.workMode` | Quel mode de travail préférez-vous ? |
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

### `/app/career/cv` · Éditeur de CV et coach IA

*Éditer le CV section par section, avec un coach qui propose et un talent qui décide.*

| Clé | Texte |
|---|---|
| `career.cv.eyebrow` | Career · Dernière modification {time, relative} |
| `career.cv.title` | Mon CV |
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
| `career.cv.info.contact.hint` | E-mail, ville et liens. Évitez d'indiquer votre âge, votre situation familiale ou votre photo si ce n'est pas demandé. |
| `career.cv.info.photo.text` | Afficher ma photo sur le CV |
| `career.cv.info.photo.hint` | Facultatif. De nombreux recruteurs préfèrent un CV sans photo. |
| `career.cv.bullet.add` | Ajouter une réalisation |
| `career.cv.template.text` | Modèle |
| `career.cv.template.current` | « {templateName} » · lisible par les logiciels de recrutement |
| `career.cv.template.change` | Changer de modèle |
| `career.cv.template.title` | Choisir un modèle |
| `career.cv.template.ats` | Lisible par les logiciels de recrutement |
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
| `career.cv.saved` | Enregistré |
| `career.cv.saving` | Enregistrement… |
| `career.cv.empty` | Votre CV est vide. Importez un CV existant ou remplissez-le depuis votre profil. |
| `career.cv.coach.footer` | L'IA conseille, vous décidez. Rien n'est modifié sans votre accord. |
| `career.cv.simulateInterview` | Simuler un entretien |
| `career.cv.seo` | Mon CV · Jumanly |
| `career.cv.updated` | Modifié le {date} |
| `career.cv.open` | Ouvrir |
| `career.cv.template.name.classic` | Classique |
| `career.cv.template.name.modern` | Moderne |
| `career.cv.template.name.compact` | Compact |
| `career.cv.info.showEmail` | Afficher mon e-mail sur le CV |
| `career.cv.fromProfileHint` | Le contenu des sections vient de votre profil. Modifiez-le dans votre profil, puis touchez « Remplir depuis mon profil ». |
| `career.cv.fromProfileDone` | CV mis à jour à partir de votre profil. |
| `career.cv.limit` | Vous pouvez avoir jusqu'à {max} CV. |
| `career.cv.back` | Mes CV |

### `/app/career/documents` · Lettres, biographie et correction

*Rédiger et corriger les documents de candidature (Starter et plus).*

| Clé | Texte |
|---|---|
| `career.documents.title` | Lettres et documents |
| `career.documents.subtitle` | Lettres de motivation, biographies et correction de vos textes. |
| `career.documents.locked.title` | Disponible avec {plan} |
| `career.documents.locked.body` | La création et la correction de documents professionnels sont incluses à partir de {plan}. |
| `career.documents.new` | Nouveau document |
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

### `/app/career/linkedin` · Préparation LinkedIn

*Proposer un titre, un résumé et des compétences prêts à copier.*

| Clé | Texte |
|---|---|
| `career.linkedin.title` | Préparation LinkedIn |
| `career.linkedin.subtitle` | Des propositions à partir de votre profil Jumanly. Copiez-les sur LinkedIn après relecture. |
| `career.linkedin.locked` | Disponible avec {plan} |
| `career.linkedin.headline.text` | Titre |
| `career.linkedin.headline.hint` | 220 caractères maximum sur LinkedIn. |
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

### `/app/career/entretiens` · Simulations d'entretien

*S'entraîner à l'écrit (Starter et plus) puis à l'oral (Pro et plus), avec un retour structuré.*

| Clé | Texte |
|---|---|
| `career.interviews.title` | Simulations d'entretien |
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
| `career.interviews.history.title` | Séances précédentes |
| `career.interviews.history.empty` | Votre première simulation apparaîtra ici. |
| `career.interviews.history.item` | {type} · {date, date, medium} · {mode} |

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
| `career.plan.encouragement` | Une étape à la fois. Vous avez déjà fait {done} {done, plural, one {étape} other {étapes}}. |
| `career.plan.saved` | Plan mis à jour. |

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
| `talent.jobs.detail.seo` | {jobTitle} · Jumanly |
| `talent.jobs.detail.scoreLater` | Le calcul de compatibilité arrive bientôt. Vous pouvez déjà postuler. |
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
| `talent.jobs.applications.sentOn` | Envoyée le {date, date, medium} |
| `talent.jobs.applications.updated` | Mise à jour {time, relative} |
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
| `talent.jobs.saved.seo` | Offres enregistrées · Jumanly |

---

### `/app/messages` · Messagerie Connect

*Échanger avec les recruteurs dans un cadre lié aux candidatures, sûr et privé.*

#### Liste des conversations

| Clé | Texte |
|---|---|
| `connect.eyebrow` | Messagerie · {count, plural, =0 {Tout est lu} one {# non lu} other {# non lus}} |
| `connect.title` | Connect |
| `connect.list.title` | Messages |
| `connect.list.search.placeholder` | Rechercher |
| `connect.list.filter.all` | Tous |
| `connect.list.filter.unread` | Non lus |
| `connect.list.filter.recruiters` | Recruteurs |
| `connect.list.filter.requests` | Demandes de mise en relation |
| `connect.list.filter.archived` | Archivés |
| `connect.list.item.role` | {company} · {role} |
| `connect.list.item.you` | Vous : {message} |
| `connect.list.item.attachment` | Pièce jointe |
| `connect.list.item.invitation` | Invitation à un entretien |
| `connect.list.item.documentRequest` | Document demandé |
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
| `settings.privacy.ai.text` | Utilisation de l'IA |
| `settings.privacy.ai.desc` | Autoriser Jumanly Intelligence à analyser mon profil et mes documents pour me faire des suggestions. |
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
| `hire.dashboard.verifyBanner.text` | Faites vérifier votre organisation pour afficher le badge « Entreprise vérifiée » sur vos offres. |
| `hire.dashboard.verifyBanner.cta` | Demander la vérification |
| `hire.dashboard.fairness` | Rappel : les profils Free sont des candidats comme les autres. Le forfait d'un talent n'influence jamais son score. |

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
| `hire.jobs.empty.published` | Aucune offre publiée. |
| `hire.jobs.empty.drafts` | Aucun brouillon. |
| `hire.jobs.empty.closed` | Aucune offre fermée. |
| `hire.jobs.empty.cta` | Créer une offre |
| `hire.jobs.assign.locked` | Attribution des offres aux responsables · Disponible avec {plan} |

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

#### Score

| Clé | Texte |
|---|---|
| `hire.application.score.title` | Compatibilité |
| `hire.application.score.value` | {score} % · {band} |
| `hire.application.score.why` | Pourquoi ? |
| `hire.application.score.updated` | Calculé {time, relative} |
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
| `org.profile.contactEmail` | E-mail de contact recrutement |
| `org.profile.description.text` | Présentation |
| `org.profile.description.placeholder` | Votre activité, vos valeurs, ce qui fait la différence pour vos équipes. |
| `org.profile.publicPage.text` | Page publique |
| `org.profile.publicPage.view` | Voir la page publique |
| `org.profile.saved` | Profil de l'organisation enregistré. |
| `org.profile.save` | Enregistrer |
| `org.profile.invalid` | Certaines informations ne sont pas valides. Vérifiez le formulaire. |
| `org.profile.countryHint` | Code pays à deux lettres, par exemple CI ou CM. |

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
| `pricing.talent.compare.cv.one` | 1 standard |
| `pricing.talent.compare.cv.several` | Plusieurs |
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
| `billing.quotas.cvTemplates` | Modèles de CV |
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
| `billing.upgrade.title` | Passer à {plan} |
| `billing.upgrade.text` | Votre nouvelle formule s'applique immédiatement. |
| `billing.upgrade.summary.newPlan` | Nouvelle formule |
| `billing.upgrade.summary.price` | Prix mensuel |
| `billing.upgrade.summary.credit` | Crédit pour le temps restant sur {currentPlan} |
| `billing.upgrade.summary.total` | À payer aujourd'hui |
| `billing.upgrade.summary.newEnd` | Nouvelle échéance |
| `billing.upgrade.prorataNote` | Le crédit est calculé selon nos conditions générales de vente. [Règle de prorata à confirmer] |
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
| `billing.history.empty` | Aucun paiement pour le moment. |
| `billing.invoiceDetails.title` | Informations de facturation |
| `billing.invoiceDetails.text` | Ces informations apparaissent sur vos factures. |
| `billing.invoiceDetails.name.label` | Nom ou raison sociale |
| `billing.invoiceDetails.address.label` | Adresse de facturation |
| `billing.invoiceDetails.taxId.label` | Numéro d'identification fiscale |
| `billing.invoiceDetails.taxId.help` | Facultatif, pour les organisations. |
| `billing.invoiceDetails.email.label` | E-mail de réception des factures |
| `billing.invoiceDetails.save` | Enregistrer |
| `billing.invoiceDetails.saved` | Informations de facturation enregistrées. |
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
| `checkout.mm.error.numberInvalid` | Ce numéro ne semble pas valide pour {operator}. Vérifiez l'indicatif et le nombre de chiffres. |
| `checkout.mm.error.operatorRequired` | Choisissez votre opérateur. |
| `checkout.mm.error.numberRequired` | Saisissez votre numéro Mobile Money. |

### Paiement · Carte bancaire

*Permettre un paiement par carte via le formulaire sécurisé du prestataire.*

| Clé | Texte |
|---|---|
| `checkout.card.title` | Carte bancaire |
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
| `quota.cvTemplates.reached` | Votre formule comprend {limit, plural, one {# modèle de CV} other {# modèles de CV}}. Passez à une formule supérieure pour en utiliser davantage. |

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
| `sponsored.consent.withdraw` | Vous pouvez retirer votre accord à tout moment dans vos paramètres de confidentialité. |

---

### Demande de devis Company Premium

*Recueillir une demande de devis pour Company Premium. Le bouton « Demander un devis » ouvre `/contact?sujet=devis` ou cette fenêtre dans l'application.*

| Clé | Texte |
|---|---|
| `quote.title` | Demander un devis Company Premium |
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
- Le score (0 à 100) est la **somme pondérée** de huit critères : compétences requises, compétences souhaitées, expérience, localisation et télétravail, type de contrat, langues, formation ou diplôme, disponibilité.
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
| `match.criterion.contract.text` | Type de contrat |
| `match.criterion.contract.desc` | Le contrat proposé, comparé à ceux que vous recherchez. |
| `match.criterion.languages.text` | Langues |
| `match.criterion.languages.desc` | Les langues demandées et le niveau attendu. |
| `match.criterion.education.text` | Formation et diplôme |
| `match.criterion.education.desc` | Le niveau et le domaine d'études, ou l'expérience équivalente si l'offre l'accepte. |
| `match.criterion.availability.text` | Disponibilité |
| `match.criterion.availability.desc` | Votre date de disponibilité, comparée à la date de début souhaitée. |
| `match.criterion.weight` | Poids : {weight} % |
| `match.criterion.points` | {points} sur {weight} points |
| `match.criterion.percent` | {percent} % |
| `match.criterion.status.met` | Rempli |
| `match.criterion.status.partial` | Partiellement rempli |
| `match.criterion.status.unmet` | Non rempli |
| `match.criterion.status.unknown` | Information absente |
| `match.criterion.status.notRequested` | Non demandé par l'offre |

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
| `match.why.recruiter.intro` | Somme pondérée des huit critères de votre offre, selon les poids que vous avez définis. |
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
| `match.why.recruiter.knockout.title` | Critères éliminatoires de l'offre |
| `match.why.recruiter.knockout.unmet` | Non rempli : {criteria}. Le candidat n'est pas écarté : à vous de juger. |
| `match.why.recruiter.knockout.unknown` | Information absente : {criteria}. Vous pouvez demander une précision au candidat. |
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
| `matchingPage.s2.list.5` | le type de contrat ; |
| `matchingPage.s2.list.6` | les langues ; |
| `matchingPage.s2.list.7` | la formation ou le diplôme ; |
| `matchingPage.s2.list.8` | la disponibilité. |
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
| `notifications.empty.text` | Vous êtes à jour. Aucune notification. |
| `notifications.empty.unread` | Aucune notification non lue. |
| `notifications.loading` | Chargement des notifications… |
| `notifications.allRead` | Toutes les notifications sont marquées comme lues. |
| `notifications.item.newApplication` | Nouvelle candidature de {candidateName} pour « {jobTitle} » |
| `notifications.item.statusChange` | Votre candidature à « {jobTitle} » chez {company} est passée à l'étape « {stage} » |
| `notifications.item.notSelected` | {company} n'a pas retenu votre candidature à « {jobTitle} » |
| `notifications.item.newMessage` | Nouveau message de {senderName} · {jobTitle} |
| `notifications.item.documentRequest` | {company} vous demande un document : {documentName} |
| `notifications.item.orgInvite` | {inviterName} vous invite à rejoindre {org} |
| `notifications.item.jobApproved` | Votre offre « {jobTitle} » a été validée et publiée |
| `notifications.item.jobRejected` | Votre offre « {jobTitle} » a été refusée par la modération |
| `notifications.item.certificateIssued` | Votre attestation « {courseTitle} » est prête |
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
| `system.403.cta` | Retour à l'accueil |

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
| `partner.dashboard.empty` | Aucun lot de licences pour l'instant. Votre contact Jumanly le créera après signature du contrat. |
| `partner.dashboard.contact` | Une question sur votre contrat ? Écrivez à assistant@jumanly.io. |

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
| `partner.reports.monthly` | Recevoir le rapport chaque mois par e-mail |
| `partner.reports.empty` | Pas encore assez de données. Les premiers indicateurs apparaîtront quand au moins {minGroup} bénéficiaires auront activé leur licence. |
| `partner.reports.requestNominative` | Vous avez besoin d'une information individuelle (par exemple pour un suivi de programme) ? Elle ne peut être transmise qu'avec l'accord explicite de chaque bénéficiaire. Écrivez à assistant@jumanly.io pour mettre en place une demande de consentement. |

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

### `/admin` · Indicateurs

*Suivre la santé économique et l'usage de la plateforme (note conceptuelle § 11).*

| Clé | Texte |
|---|---|
| `admin.dashboard.title` | Indicateurs |
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
| `admin.dashboard.kpi.grossMargin` | Marge brute par forfait |
| `admin.dashboard.kpi.activeCompanies` | Comptes entreprises actifs |
| `admin.dashboard.kpi.institutionalRevenue` | Revenus des contrats institutionnels |
| `admin.dashboard.kpi.value.currency` | {amount} {currency} |
| `admin.dashboard.kpi.value.percent` | {value} % |
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
| `admin.users.summary` | Forfait : {plan} · inscrit le {date} |

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
| `admin.subscriptions.action.extend` | Prolonger la période |
| `admin.subscriptions.action.changePlan` | Changer de forfait |
| `admin.subscriptions.action.cancel` | Résilier |
| `admin.subscriptions.action.markPaid` | Enregistrer un paiement manuel |
| `admin.subscriptions.action.refund.text` | Rembourser manuellement |
| `admin.subscriptions.action.refund.confirm` | Rembourser {amount} {currency} à {userName} ? Le remboursement est à effectuer auprès du prestataire de paiement, puis enregistré ici. |
| `admin.subscriptions.action.refund.reference` | Référence du remboursement |
| `admin.subscriptions.refunded` | Remboursement enregistré. |
| `admin.subscriptions.invoice` | Voir la facture |

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
| `admin.courses.field.cover` | Image de couverture (adresse https) |
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
| `admin.courses.publish.check` | Avant de publier : au moins une leçon, un niveau de catalogue choisi, un formateur renseigné. |
| `admin.courses.published` | Formation publiée. |
| `admin.courses.publish.problem.lessons` | Ajoutez au moins une leçon. |
| `admin.courses.publish.problem.instructor` | Renseignez le formateur. |
| `admin.courses.publish.problem.summary` | Renseignez le résumé et la description. |
| `admin.courses.publish.problem.quiz` | Chaque quiz doit avoir au moins une question. |
| `admin.courses.editorOnly` | Votre rôle Éditeur de contenus permet de créer et publier des formations. |

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
| `admin.ai.audit.title` | Journal d'audit IA |
| `admin.ai.audit.desc` | Chaque calcul de score conserve les poids utilisés, les critères évalués et la version du modèle, pour permettre une explication et une révision. |
| `admin.ai.audit.filter` | Filtrer par utilisateur, offre ou fonction |

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
