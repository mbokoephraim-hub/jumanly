/**
 * UX test scenario (local and preview only, CLAUDE.md § 11): five of each kind (talents, courses,
 * jobs, recruiters, companies, partners) with some activity between them, so that every space can be
 * tried as if the platform were already in use. Everything is obviously fictional: names end with
 * « Démo », organizations say « (fictive) », addresses use the reserved `.test` domain.
 * See /mnt/project-files/ux-test/PROMPT.md.
 */
import { hashPassword } from "better-auth/crypto";
import { freezeApplicationMatch } from "../../src/server/matching/service";
import { defaultStages } from "../../src/server/services/applications";
import type { ContractType, RemoteMode, StageKind } from "../../src/generated/prisma/client";
import type { SeedClient } from "./client";
import { DEMO_PASSWORD } from "./accounts";

const day = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * day);
const NOTICE = "Contenu fictif de démonstration.";

type Company = {
  slug: string;
  name: string;
  type: "company" | "recruiter";
  plan: string;
  city: string;
  country: string;
  sector: string;
  recruiter: { email: string; firstName: string };
  job: {
    slug: string;
    title: string;
    contractType: ContractType;
    remote: RemoteMode;
    salary?: [number, number];
    experienceMin: number;
    summary: string;
    responsibilities: string[];
    requirements: string[];
    skills: { slug: string; importance: "required" | "preferred" }[];
  };
};

const companies: Company[] = [
  {
    slug: "ux-savane-telecom-fictive",
    name: "Savane Télécom (entreprise fictive)",
    type: "company",
    plan: "company",
    city: "Kinshasa",
    country: "RD Congo",
    sector: "Télécommunications",
    recruiter: { email: "recruteur1.ux@jumanly.test", firstName: "Nadia" },
    job: {
      slug: "ux-conseiller-clientele-kinshasa",
      title: "Conseiller clientèle bilingue (démo)",
      contractType: "cdi",
      remote: "hybrid",
      salary: [45000, 65000],
      experienceMin: 1,
      summary: "Vous répondez aux clients d'un opérateur imaginaire, par téléphone et par chat.",
      responsibilities: [
        "Répondre aux demandes des clients",
        "Résoudre les réclamations simples",
        "Remonter les incidents à l'équipe technique",
      ],
      requirements: ["Une première expérience en relation client", "Français et anglais"],
      skills: [
        { slug: "relation-client", importance: "required" },
        { slug: "communication-orale", importance: "required" },
        { slug: "anglais", importance: "preferred" },
      ],
    },
  },
  {
    slug: "ux-baobab-finance-fictive",
    name: "Baobab Finance (entreprise fictive)",
    type: "company",
    plan: "company_plus",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    sector: "Banque et microfinance",
    recruiter: { email: "recruteur2.ux@jumanly.test", firstName: "Koffi" },
    job: {
      slug: "ux-analyste-credit-abidjan",
      title: "Analyste crédit junior (démo)",
      contractType: "cdi",
      remote: "onsite",
      salary: [70000, 90000],
      experienceMin: 1,
      summary: "Vous étudiez les demandes de crédit d'une institution de microfinance imaginaire.",
      responsibilities: [
        "Analyser les dossiers de crédit",
        "Préparer les tableaux de suivi",
        "Présenter les dossiers au comité",
      ],
      requirements: ["Formation en finance ou gestion", "À l'aise avec les tableurs"],
      skills: [
        { slug: "excel", importance: "required" },
        { slug: "comptabilite-generale", importance: "required" },
        { slug: "esprit-d-analyse", importance: "preferred" },
      ],
    },
  },
  {
    slug: "ux-kivu-logistique-fictive",
    name: "Kivu Logistique (entreprise fictive)",
    type: "company",
    plan: "company",
    city: "Goma",
    country: "RD Congo",
    sector: "Transport et logistique",
    recruiter: { email: "recruteur3.ux@jumanly.test", firstName: "Patience" },
    job: {
      slug: "ux-assistant-logistique-goma",
      title: "Assistant logistique (démo)",
      contractType: "cdd",
      remote: "onsite",
      experienceMin: 0,
      summary: "Vous suivez les livraisons d'un entrepôt imaginaire.",
      responsibilities: [
        "Suivre les entrées et sorties de stock",
        "Préparer les bons de livraison",
        "Mettre à jour le tableau de bord",
      ],
      requirements: ["Rigueur et organisation", "Bases d'Excel"],
      skills: [
        { slug: "organisation", importance: "required" },
        { slug: "excel", importance: "preferred" },
      ],
    },
  },
  {
    slug: "ux-talents-sahel-cabinet-fictif",
    name: "Talents Sahel (cabinet fictif)",
    type: "recruiter",
    plan: "rh_pro",
    city: "Dakar",
    country: "Sénégal",
    sector: "Conseil en recrutement",
    recruiter: { email: "recruteur4.ux@jumanly.test", firstName: "Awa" },
    job: {
      slug: "ux-chargee-communication-dakar",
      title: "Chargé de communication digitale (démo)",
      contractType: "cdi",
      remote: "hybrid",
      salary: [60000, 80000],
      experienceMin: 2,
      summary: "Pour un client imaginaire, vous animez les réseaux sociaux et le site.",
      responsibilities: [
        "Construire le calendrier éditorial",
        "Rédiger et publier les contenus",
        "Suivre les statistiques",
      ],
      requirements: ["Deux ans en communication", "Une belle plume"],
      skills: [
        { slug: "gestion-des-reseaux-sociaux", importance: "required" },
        { slug: "redaction-web", importance: "required" },
        { slug: "creativite", importance: "preferred" },
      ],
    },
  },
  {
    slug: "ux-lagune-sante-fictive",
    name: "Lagune Santé (entreprise fictive)",
    type: "company",
    plan: "company",
    city: "Cotonou",
    country: "Bénin",
    sector: "Santé",
    recruiter: { email: "recruteur5.ux@jumanly.test", firstName: "Rodrigue" },
    job: {
      slug: "ux-assistant-administratif-cotonou",
      title: "Assistant administratif et accueil (démo)",
      contractType: "stage",
      remote: "onsite",
      experienceMin: 0,
      summary: "Stage fictif à l'accueil et au secrétariat d'une clinique imaginaire.",
      responsibilities: [
        "Accueillir les patients",
        "Tenir les agendas",
        "Classer les dossiers administratifs",
      ],
      requirements: ["Sens de l'accueil", "Bureautique"],
      skills: [
        { slug: "word", importance: "required" },
        { slug: "organisation", importance: "required" },
        { slug: "relation-client", importance: "preferred" },
      ],
    },
  },
];

type Talent = {
  email: string;
  firstName: string;
  plan?: string;
  city: string;
  headline: string;
  summary: string;
  goal: string;
  desired: string[];
  skills: [string, number][];
  experience?: { title: string; company: string; years: number };
  education: { degree: string; level: "secondary" | "vocational" | "bachelor" | "master" };
  /** Jobs applied to (slug → stage kind). */
  applications: [string, StageKind][];
  /** Courses (slug → share of lessons done, 1 = finished with an attestation). */
  courses: [string, number][];
  visibility: "private" | "recruiters" | "anonymous";
};

const talents: Talent[] = [
  {
    email: "grace.ux@jumanly.test",
    firstName: "Grâce",
    city: "Kinshasa",
    headline: "Jeune diplômée en communication",
    summary: "Je cherche un premier emploi dans la relation client ou la communication. (démo)",
    goal: "firstJob",
    desired: ["Conseillère clientèle", "Chargée de communication"],
    skills: [
      ["relation-client", 2],
      ["communication-orale", 3],
      ["gestion-des-reseaux-sociaux", 2],
      ["anglais", 2],
    ],
    education: { degree: "Licence en communication (fictive)", level: "bachelor" },
    applications: [
      ["ux-conseiller-clientele-kinshasa", "screening"],
      ["ux-chargee-communication-dakar", "new"],
    ],
    courses: [
      ["ux-service-client-excellence", 0.5],
      ["demo-reussir-son-cv", 1],
    ],
    visibility: "recruiters",
  },
  {
    email: "jeanpierre.ux@jumanly.test",
    firstName: "Jean-Pierre",
    plan: "talent_pro",
    city: "Lubumbashi",
    headline: "Gestionnaire de stock en reconversion",
    summary: "Vingt ans dans le commerce, je me forme au numérique et à la logistique. (démo)",
    goal: "reconversion",
    desired: ["Assistant logistique"],
    skills: [
      ["organisation", 3],
      ["excel", 1],
      ["negociation", 3],
    ],
    experience: { title: "Gérant de boutique", company: "Commerce familial (fictif)", years: 20 },
    education: { degree: "Diplôme d'État (fictif)", level: "secondary" },
    applications: [["ux-assistant-logistique-goma", "interview"]],
    courses: [
      ["ux-excel-tableaux-de-bord", 0.25],
      ["ux-bien-utiliser-son-telephone-pro", 1],
    ],
    visibility: "recruiters",
  },
  {
    email: "aminata.ux@jumanly.test",
    firstName: "Aminata",
    plan: "talent_pro",
    city: "Dakar",
    headline: "Chargée de communication, trois ans d'expérience",
    summary: "Je crée des contenus et j'anime des communautés en ligne. (démo)",
    goal: "newJob",
    desired: ["Chargée de communication digitale"],
    skills: [
      ["gestion-des-reseaux-sociaux", 4],
      ["redaction-web", 3],
      ["creativite", 3],
    ],
    experience: { title: "Community manager", company: "Agence imaginaire (fictive)", years: 3 },
    education: { degree: "Master en marketing (fictif)", level: "master" },
    applications: [["ux-chargee-communication-dakar", "interview"]],
    courses: [["ux-ecrire-pour-le-web", 0.75]],
    visibility: "recruiters",
  },
  {
    email: "yannick.ux@jumanly.test",
    firstName: "Yannick",
    city: "Abidjan",
    headline: "Diplômé en finance",
    summary: "Je veux rejoindre une banque ou une institution de microfinance. (démo)",
    goal: "firstJob",
    desired: ["Analyste crédit"],
    skills: [
      ["excel", 3],
      ["comptabilite-generale", 2],
    ],
    education: { degree: "Licence en finance (fictive)", level: "bachelor" },
    applications: [
      ["ux-analyste-credit-abidjan", "new"],
      ["demo-comptable-junior-abidjan", "screening"],
    ],
    courses: [
      ["ux-finances-personnelles", 1],
      ["demo-preparer-un-entretien", 0.5],
    ],
    visibility: "anonymous",
  },
  {
    email: "esperance.ux@jumanly.test",
    firstName: "Espérance",
    city: "Cotonou",
    headline: "Étudiante, à la recherche d'un stage",
    summary: "Organisée et souriante, je cherche un stage d'accueil ou d'administration. (démo)",
    goal: "firstJob",
    desired: ["Assistante administrative"],
    skills: [
      ["word", 2],
      ["organisation", 2],
    ],
    education: { degree: "BTS en secrétariat (fictif)", level: "vocational" },
    applications: [["ux-assistant-administratif-cotonou", "new"]],
    courses: [],
    visibility: "private",
  },
];

type Lesson = {
  title: string;
  kind: "text" | "video" | "exercise" | "quiz";
  minutes: number;
  paragraphs: string[];
};
type Course = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  requiredLevel: "free" | "fundamentals" | "standard" | "advanced";
  objectives: string[];
  skills: string[];
  modules: { title: string; lessons: Lesson[] }[];
  quiz: { prompt: string; options: string[]; answer: string[]; explanation: string }[];
};

const quizLesson = (minutes = 5): Lesson => ({
  title: "Évaluation finale",
  kind: "quiz",
  minutes,
  paragraphs: ["Répondez aux questions pour valider la formation et obtenir l'attestation."],
});

const courses: Course[] = [
  {
    slug: "ux-service-client-excellence",
    title: "Un service client qui fidélise (démo)",
    summary: "Accueillir, écouter et résoudre une réclamation avec calme.",
    category: "Relation client",
    level: "beginner",
    requiredLevel: "free",
    objectives: ["Accueillir un client", "Reformuler une demande", "Traiter une réclamation"],
    skills: ["relation-client", "communication-orale"],
    modules: [
      {
        title: "Accueillir",
        lessons: [
          {
            title: "Les trois premières secondes",
            kind: "text",
            minutes: 6,
            paragraphs: [
              "Le client se fait une idée en quelques secondes : un bonjour, son prénom si on le connaît, un regard ou une voix souriante.",
              "Au téléphone, on se présente avec le nom du service puis son prénom : « Service client, Grâce, bonjour ».",
              "Exemple : un client entre pendant que vous êtes au téléphone ; un signe de la main lui montre qu'il est vu.",
            ],
          },
          {
            title: "Écouter et reformuler",
            kind: "video",
            minutes: 9,
            paragraphs: [
              "Écouter, c'est laisser le client finir sans l'interrompre, puis reformuler : « Si je comprends bien, votre forfait n'a pas été activé ».",
              "La reformulation montre que vous avez compris et évite les malentendus.",
            ],
          },
        ],
      },
      {
        title: "Résoudre",
        lessons: [
          {
            title: "La méthode CALME pour une réclamation",
            kind: "text",
            minutes: 8,
            paragraphs: [
              "C comme Calmer : on laisse le client s'exprimer. A comme Accepter son ressenti. L comme Localiser le problème par des questions. M comme Mettre en œuvre une solution. E comme Engager un suivi.",
              "On ne promet jamais ce qu'on ne peut pas tenir : mieux vaut un délai réaliste qu'une promesse rompue.",
            ],
          },
          {
            title: "Exercice : répondre à un client mécontent",
            kind: "exercise",
            minutes: 15,
            paragraphs: [
              "Un client écrit : « Cela fait trois jours que j'attends ma carte SIM ». Rédigez une réponse en suivant la méthode CALME.",
            ],
          },
          quizLesson(),
        ],
      },
    ],
    quiz: [
      {
        prompt: "Que signifie le « L » de la méthode CALME ?",
        options: ["Localiser le problème", "Laisser tomber", "Lire le contrat"],
        answer: ["0"],
        explanation: "On pose des questions pour localiser le problème.",
      },
      {
        prompt: "Pourquoi reformuler la demande d'un client ?",
        options: ["Pour gagner du temps", "Pour montrer qu'on a compris", "Pour le contredire"],
        answer: ["1"],
        explanation: "La reformulation montre l'écoute et évite les malentendus.",
      },
    ],
  },
  {
    slug: "ux-excel-tableaux-de-bord",
    title: "Construire un tableau de bord avec un tableur (démo)",
    summary: "Des données brutes à un tableau de bord clair, en quatre étapes.",
    category: "Bureautique",
    level: "intermediate",
    requiredLevel: "standard",
    objectives: ["Nettoyer des données", "Utiliser SOMME.SI", "Créer un graphique"],
    skills: ["excel"],
    modules: [
      {
        title: "Préparer les données",
        lessons: [
          {
            title: "Une ligne, un enregistrement",
            kind: "text",
            minutes: 7,
            paragraphs: [
              "Un tableau exploitable a une ligne par enregistrement (une vente, une livraison) et une colonne par information (date, produit, montant).",
              "On évite les cellules fusionnées et les lignes vides au milieu des données.",
            ],
          },
          {
            title: "Mettre sous forme de tableau",
            kind: "video",
            minutes: 10,
            paragraphs: [
              "Accueil > Mettre sous forme de tableau transforme une plage en tableau : les filtres apparaissent et les formules s'étendent seules.",
            ],
          },
        ],
      },
      {
        title: "Calculer et montrer",
        lessons: [
          {
            title: "SOMME.SI et NB.SI",
            kind: "text",
            minutes: 12,
            paragraphs: [
              'SOMME.SI additionne les valeurs qui respectent une condition : =SOMME.SI(B:B;"Goma";C:C) additionne la colonne C pour les lignes où B vaut Goma.',
              'NB.SI compte les lignes qui respectent une condition : =NB.SI(B:B;"Goma").',
              "Erreur fréquente : oublier les guillemets autour d'un texte dans la condition.",
            ],
          },
          {
            title: "Exercice : le tableau de bord des livraisons",
            kind: "exercise",
            minutes: 20,
            paragraphs: [
              "À partir d'une liste de livraisons fictives, calculez le total par ville avec SOMME.SI puis tracez un histogramme.",
            ],
          },
          quizLesson(),
        ],
      },
    ],
    quiz: [
      {
        prompt: "Quelle formule additionne les montants de la ville de Goma ?",
        options: ['=NB.SI(B:B;"Goma")', '=SOMME.SI(B:B;"Goma";C:C)', "=SOMME(C:C)"],
        answer: ["1"],
        explanation: "SOMME.SI additionne selon une condition ; NB.SI compte.",
      },
      {
        prompt: "Que faut-il éviter dans un tableau de données ?",
        options: ["Les cellules fusionnées", "Les en-têtes de colonne", "Les dates"],
        answer: ["0"],
        explanation: "Les cellules fusionnées empêchent de trier et de filtrer.",
      },
    ],
  },
  {
    slug: "ux-ecrire-pour-le-web",
    title: "Écrire pour le web et les réseaux (démo)",
    summary: "Des textes courts, clairs et qui donnent envie de cliquer.",
    category: "Communication",
    level: "intermediate",
    requiredLevel: "standard",
    objectives: ["Écrire un titre accrocheur", "Structurer un texte court", "Adapter le ton"],
    skills: ["redaction-web", "gestion-des-reseaux-sociaux"],
    modules: [
      {
        title: "Les bases",
        lessons: [
          {
            title: "La pyramide inversée",
            kind: "text",
            minutes: 8,
            paragraphs: [
              "On commence par l'information la plus importante, puis les détails : le lecteur pressé a l'essentiel dans la première phrase.",
              "Exemple : « Les inscriptions au forum emploi ouvrent lundi » avant d'expliquer le lieu et le programme.",
            ],
          },
          {
            title: "Un titre qui donne envie",
            kind: "video",
            minutes: 9,
            paragraphs: [
              "Un bon titre est court, concret et promet un bénéfice : « 3 erreurs à éviter dans votre CV ».",
            ],
          },
        ],
      },
      {
        title: "Publier",
        lessons: [
          {
            title: "Adapter le texte à chaque réseau",
            kind: "text",
            minutes: 9,
            paragraphs: [
              "Sur un réseau professionnel, on soigne le ton et on apporte une information utile ; sur un réseau grand public, on est plus court et plus visuel.",
            ],
          },
          {
            title: "Exercice : trois versions d'une annonce",
            kind: "exercise",
            minutes: 15,
            paragraphs: [
              "Rédigez l'annonce d'un atelier fictif en trois versions : site, réseau professionnel, message court.",
            ],
          },
          quizLesson(),
        ],
      },
    ],
    quiz: [
      {
        prompt: "Selon la pyramide inversée, que met-on en premier ?",
        options: ["Les détails", "L'information la plus importante", "La conclusion"],
        answer: ["1"],
        explanation: "Le lecteur pressé doit avoir l'essentiel dès la première phrase.",
      },
    ],
  },
  {
    slug: "ux-finances-personnelles",
    title: "Gérer son budget personnel (démo)",
    summary: "Suivre ses dépenses, épargner et éviter le surendettement.",
    category: "Compétences de vie",
    level: "beginner",
    requiredLevel: "free",
    objectives: ["Faire un budget mensuel", "Épargner régulièrement", "Comprendre un crédit"],
    skills: ["excel"],
    modules: [
      {
        title: "Le budget",
        lessons: [
          {
            title: "La règle 50-30-20",
            kind: "text",
            minutes: 7,
            paragraphs: [
              "Une méthode simple : 50 % des revenus pour les besoins (logement, nourriture, transport), 30 % pour les envies, 20 % pour l'épargne.",
              "Exemple : avec 300 USD par mois, 150 pour les besoins, 90 pour les envies, 60 pour l'épargne.",
            ],
          },
          {
            title: "Suivre ses dépenses",
            kind: "video",
            minutes: 8,
            paragraphs: [
              "Noter chaque dépense pendant un mois permet de voir où part l'argent ; un carnet ou un tableur suffit.",
            ],
          },
        ],
      },
      {
        title: "Épargne et crédit",
        lessons: [
          {
            title: "Comprendre le coût d'un crédit",
            kind: "text",
            minutes: 9,
            paragraphs: [
              "Le coût d'un crédit, ce sont les intérêts et les frais. On compare toujours le montant total remboursé, pas seulement la mensualité.",
            ],
          },
          quizLesson(),
        ],
      },
    ],
    quiz: [
      {
        prompt: "Dans la règle 50-30-20, quelle part va à l'épargne ?",
        options: ["50 %", "30 %", "20 %"],
        answer: ["2"],
        explanation: "20 % des revenus vont à l'épargne.",
      },
    ],
  },
  {
    slug: "ux-bien-utiliser-son-telephone-pro",
    title: "Le téléphone, outil de travail (démo)",
    summary: "Messagerie, agenda et documents : travailler efficacement depuis son téléphone.",
    category: "Compétences numériques",
    level: "beginner",
    requiredLevel: "free",
    objectives: ["Organiser son agenda", "Envoyer un document propre", "Protéger ses comptes"],
    skills: ["organisation"],
    modules: [
      {
        title: "S'organiser",
        lessons: [
          {
            title: "Un agenda qui vous rappelle tout",
            kind: "text",
            minutes: 6,
            paragraphs: [
              "Chaque rendez-vous va dans l'agenda avec un rappel la veille et une heure avant.",
            ],
          },
          {
            title: "Envoyer un document en PDF",
            kind: "video",
            minutes: 7,
            paragraphs: [
              "Un CV ou une facture s'envoie en PDF, avec un nom clair : « CV-Prenom-Nom.pdf ».",
            ],
          },
        ],
      },
      {
        title: "Se protéger",
        lessons: [
          {
            title: "Mots de passe et double vérification",
            kind: "text",
            minutes: 8,
            paragraphs: [
              "Un mot de passe long et différent pour chaque compte, et la double vérification activée sur la messagerie.",
            ],
          },
          quizLesson(),
        ],
      },
    ],
    quiz: [
      {
        prompt: "Dans quel format envoyer un CV ?",
        options: ["Photo", "PDF", "Message vocal"],
        answer: ["1"],
        explanation: "Le PDF garde la mise en page sur tous les appareils.",
      },
    ],
  },
];

const partners = [
  {
    slug: "ux-universite-lumiere-fictive",
    name: "Université Lumière (partenaire fictif)",
    kind: "university",
    city: "Kinshasa",
  },
  {
    slug: "ux-banque-emeraude-fictive",
    name: "Banque Émeraude (partenaire fictif)",
    kind: "bank",
    city: "Abidjan",
  },
  {
    slug: "ux-fondation-avenir-fictive",
    name: "Fondation Avenir (partenaire fictif)",
    kind: "foundation",
    city: "Dakar",
  },
  {
    slug: "ux-cooperation-horizons-fictive",
    name: "Coopération Horizons (partenaire fictif)",
    kind: "cooperation",
    city: "Kigali",
  },
  {
    slug: "ux-agence-emploi-fictive",
    name: "Agence pour l'emploi (partenaire fictif)",
    kind: "public",
    city: "Cotonou",
  },
];

async function account(
  db: SeedClient,
  password: string,
  email: string,
  firstName: string,
  city: string,
) {
  const now = new Date();
  const data = {
    name: `${firstName} Démo`,
    firstName,
    lastName: "Démo",
    emailVerified: true,
    country: "CD",
    city,
    termsAcceptedAt: now,
    aiConsentAt: now,
  };
  const user = await db.user.upsert({
    where: { email },
    update: data,
    create: { email, ...data },
  });
  await db.account.deleteMany({ where: { userId: user.id, providerId: "credential" } });
  await db.account.create({
    data: { userId: user.id, accountId: user.id, providerId: "credential", password },
  });
  return user;
}

async function subscribe(
  db: SeedClient,
  subjectType: "user" | "organization",
  subjectId: string,
  code: string,
) {
  const plan = await db.plan.findUniqueOrThrow({ where: { code } });
  await db.subscription.deleteMany({ where: { subjectType, subjectId } });
  await db.subscription.create({
    data: {
      subjectType,
      subjectId,
      planId: plan.id,
      status: "active",
      source: "admin",
      currentPeriodStart: ago(5),
      currentPeriodEnd: new Date(Date.now() + 60 * day),
    },
  });
  return plan;
}

export async function seedUxScenario(db: SeedClient) {
  const password = await hashPassword(DEMO_PASSWORD);
  const skills = await db.skill.findMany({ select: { id: true, slug: true } });
  const skillId = new Map(skills.map((skill) => [skill.slug, skill.id]));

  // Companies, their recruiter and their job.
  for (const [index, company] of companies.entries()) {
    const org = await db.organization.upsert({
      where: { slug: company.slug },
      update: {},
      create: {
        type: company.type,
        name: company.name,
        slug: company.slug,
        description: `${company.name} n'existe pas. ${NOTICE}`,
        country: company.country,
        city: company.city,
        sector: company.sector,
        size: "50-249",
        verifiedAt: new Date(),
        verificationStatus: "verified",
      },
    });
    await subscribe(db, "organization", org.id, company.plan);
    const recruiter = await account(
      db,
      password,
      company.recruiter.email,
      company.recruiter.firstName,
      company.city,
    );
    await db.talentProfile.upsert({
      where: { userId: recruiter.id },
      update: {},
      create: { userId: recruiter.id },
    });
    await db.membership.upsert({
      where: { userId_organizationId: { userId: recruiter.id, organizationId: org.id } },
      update: { role: "org_owner", status: "active" },
      create: { organizationId: org.id, userId: recruiter.id, role: "org_owner", status: "active" },
    });

    const { job } = company;
    const data = {
      organizationId: org.id,
      title: job.title,
      description: `${job.summary} ${NOTICE}`,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      benefits: ["Avantages fictifs, pour la démonstration"],
      process: ["Étude de la candidature", "Entretien", "Réponse sous deux semaines"],
      contractType: job.contractType,
      city: company.city,
      country: company.country,
      remote: job.remote,
      salaryMin: job.salary?.[0] ?? null,
      salaryMax: job.salary?.[1] ?? null,
      experienceMin: job.experienceMin,
      languagesRequired: [{ code: "fr", level: "B2" }],
      knockoutCriteria: [],
      status: "published" as const,
      publishedAt: ago(index + 1),
      closesAt: new Date(Date.now() + (20 + index * 3) * day),
    };
    const saved = await db.job.upsert({
      where: { slug: job.slug },
      update: data,
      create: { slug: job.slug, ...data },
    });
    await db.jobSkill.deleteMany({ where: { jobId: saved.id } });
    for (const skill of job.skills) {
      const id = skillId.get(skill.slug);
      if (id)
        await db.jobSkill.create({
          data: {
            jobId: saved.id,
            skillId: id,
            importance: skill.importance,
            weight: skill.importance === "required" ? 5 : 2,
          },
        });
    }
    if ((await db.pipelineStage.count({ where: { jobId: saved.id } })) === 0)
      await db.pipelineStage.createMany({
        data: defaultStages.map((stage, order) => ({ jobId: saved.id, order, ...stage })),
      });
  }

  // Courses with real (generic) lesson content, a quiz and an attestation.
  for (const [index, course] of courses.entries()) {
    const durationMinutes = course.modules
      .flatMap((module) => module.lessons)
      .reduce((sum, lesson) => sum + lesson.minutes, 0);
    const data = {
      title: course.title,
      summary: course.summary,
      description: `${course.summary} ${NOTICE}`,
      objectives: course.objectives,
      audience: "Toute personne qui veut progresser vite et concrètement. Contenu fictif.",
      category: course.category,
      level: course.level,
      durationMinutes,
      requiredLevel: course.requiredLevel,
      status: "published" as const,
      enrollmentCount: 30 + index * 7,
      publishedAt: ago(3 + index),
      instructor: "Formatrice fictive (démo)",
      certificateEnabled: true,
    };
    const saved = await db.course.upsert({
      where: { slug: course.slug },
      update: data,
      create: { slug: course.slug, ...data },
    });
    await db.courseModule.deleteMany({ where: { courseId: saved.id } });
    await db.courseSkill.deleteMany({ where: { courseId: saved.id } });
    for (const [moduleIndex, module] of course.modules.entries()) {
      await db.courseModule.create({
        data: {
          courseId: saved.id,
          order: moduleIndex + 1,
          title: module.title,
          lessons: {
            create: module.lessons.map((lesson, lessonIndex) => ({
              order: lessonIndex + 1,
              title: lesson.title,
              kind: lesson.kind,
              durationSec: lesson.minutes * 60,
              isPreview: moduleIndex === 0 && lessonIndex === 0,
              content: { paragraphs: lesson.paragraphs },
              ...(lesson.kind === "quiz"
                ? {
                    quiz: {
                      create: {
                        passingScore: 50,
                        questions: {
                          create: course.quiz.map((question, order) => ({
                            order: order + 1,
                            type: "single" as const,
                            ...question,
                          })),
                        },
                      },
                    },
                  }
                : {}),
            })),
          },
        },
      });
    }
    for (const slug of course.skills) {
      const id = skillId.get(slug);
      if (id) await db.courseSkill.create({ data: { courseId: saved.id, skillId: id } });
    }
  }

  // Talents with a profile, applications and courses in progress.
  for (const talent of talents) {
    const user = await account(db, password, talent.email, talent.firstName, talent.city);
    await db.subscription.deleteMany({ where: { subjectType: "user", subjectId: user.id } });
    if (talent.plan) await subscribe(db, "user", user.id, talent.plan);
    const profileData = {
      headline: talent.headline,
      summary: talent.summary,
      goal: talent.goal,
      targetJob: talent.desired[0],
      desiredJobTitles: talent.desired,
      desiredLocations: [talent.city],
      visibility: talent.visibility,
      languages: [{ code: "fr", level: "fluent" }],
      completeness: talent.experience ? 85 : 70,
    };
    const profile = await db.talentProfile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: { userId: user.id, ...profileData },
    });
    await db.profileSkill.deleteMany({ where: { profileId: profile.id } });
    for (const [slug, level] of talent.skills) {
      const id = skillId.get(slug);
      if (id) await db.profileSkill.create({ data: { profileId: profile.id, skillId: id, level } });
    }
    await db.experience.deleteMany({ where: { profileId: profile.id } });
    if (talent.experience)
      await db.experience.create({
        data: {
          profileId: profile.id,
          title: talent.experience.title,
          company: talent.experience.company,
          startDate: ago(talent.experience.years * 365),
          description: "Expérience fictive de démonstration.",
        },
      });
    await db.education.deleteMany({ where: { profileId: profile.id } });
    await db.education.create({
      data: {
        profileId: profile.id,
        degree: talent.education.degree,
        level: talent.education.level,
        school: "École fictive (démo)",
        endYear: 2024,
      },
    });
    if ((await db.document.count({ where: { profileId: profile.id, kind: "cv" } })) === 0)
      await db.document.create({
        data: { profileId: profile.id, kind: "cv", title: "Mon CV (fictif)", isPrimary: true },
      });

    for (const [index, [slug, kind]] of talent.applications.entries()) {
      const job = await db.job.findUnique({ where: { slug }, select: { id: true } });
      if (!job) continue;
      if ((await db.pipelineStage.count({ where: { jobId: job.id } })) === 0)
        await db.pipelineStage.createMany({
          data: defaultStages.map((stage, order) => ({ jobId: job.id, order, ...stage })),
        });
      const stage = await db.pipelineStage.findFirstOrThrow({ where: { jobId: job.id, kind } });
      const existing = await db.application.findUnique({
        where: { jobId_profileId: { jobId: job.id, profileId: profile.id } },
      });
      if (existing) {
        await db.application.update({ where: { id: existing.id }, data: { stageId: stage.id } });
        if (existing.matchScore === null) await freezeApplicationMatch(db, existing.id);
        continue;
      }
      const created = await db.application.create({
        data: {
          jobId: job.id,
          profileId: profile.id,
          stageId: stage.id,
          coverLetter: "Lettre de motivation fictive, pour la démonstration.",
          createdAt: ago(index + 1),
          viewedAt: kind === "new" ? null : ago(index),
          events: { create: { type: "submitted", createdAt: ago(index + 1) } },
        },
      });
      // As in the real application flow, the score shown when applying is frozen.
      await freezeApplicationMatch(db, created.id);
    }

    for (const [slug, share] of talent.courses) {
      const course = await db.course.findUnique({
        where: { slug },
        include: { modules: { include: { lessons: true }, orderBy: { order: "asc" } } },
      });
      if (!course) continue;
      const lessons = course.modules.flatMap((module) =>
        module.lessons.sort((a, b) => a.order - b.order),
      );
      const done = lessons.slice(0, Math.round(lessons.length * share)).map((lesson) => lesson.id);
      const finished = share >= 1;
      const data = {
        progress: Math.round(share * 100),
        completedLessons: done,
        lastLessonId: done.at(-1) ?? null,
        startedAt: ago(12),
        completedAt: finished ? ago(2) : null,
      };
      const enrollment = await db.enrollment.upsert({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        update: data,
        create: { userId: user.id, courseId: course.id, ...data },
      });
      if (finished && course.certificateEnabled)
        await db.certificate.upsert({
          where: { enrollmentId: enrollment.id },
          update: {},
          create: {
            enrollmentId: enrollment.id,
            code: `JMN-UX${talent.firstName.slice(0, 2).toUpperCase()}-${course.slug.slice(3, 7).toUpperCase()}`,
            holderName: `${talent.firstName} Démo`,
            courseTitle: course.title,
            hours: Math.max(1, Math.round(course.durationMinutes / 60)),
            issuedAt: ago(2),
          },
        });
    }
  }

  // Partner institutions, each with a manager and a batch of sponsored licences.
  const pro = await db.plan.findUniqueOrThrow({ where: { code: "talent_pro" } });
  for (const [index, partner] of partners.entries()) {
    const org = await db.organization.upsert({
      where: { slug: partner.slug },
      update: {},
      create: {
        type: "partner",
        partnerKind: partner.kind,
        name: partner.name,
        slug: partner.slug,
        description: `Institution imaginaire. ${NOTICE}`,
        city: partner.city,
      },
    });
    await subscribe(db, "organization", org.id, "partner");
    const manager = await account(
      db,
      password,
      `partenaire${index + 1}.ux@jumanly.test`,
      ["Patrick", "Mireille", "Ousmane", "Claudine", "Hervé"][index]!,
      partner.city,
    );
    await db.talentProfile.upsert({
      where: { userId: manager.id },
      update: {},
      create: { userId: manager.id },
    });
    await db.membership.upsert({
      where: { userId_organizationId: { userId: manager.id, organizationId: org.id } },
      update: { role: "partner_manager", status: "active" },
      create: {
        organizationId: org.id,
        userId: manager.id,
        role: "partner_manager",
        status: "active",
      },
    });
    if ((await db.licenseBatch.count({ where: { partnerOrgId: org.id } })) === 0) {
      const batch = await db.licenseBatch.create({
        data: {
          partnerOrgId: org.id,
          planId: pro.id,
          name: `Promotion ${2026 + (index % 2)} (fictive)`,
          seats: 20 + index * 10,
          months: 6,
          startsAt: ago(10),
          endsAt: new Date(Date.now() + 170 * day),
          contractRef: `UX-CONTRAT-FICTIF-${index + 1}`,
          priceCents: (20 + index * 10) * 5 * 6 * 100,
          minGroup: 10,
        },
      });
      await db.license.createMany({
        data: [1, 2, 3].map((n) => ({
          batchId: batch.id,
          code: `JMLYUX${index + 1}${String(n).padStart(5, "0")}`,
          label: "Démo",
        })),
      });
    }
  }

  console.log(
    `✓ Scénario UX : ${talents.length} talents, ${companies.length} entreprises et recruteurs, ${companies.length} offres, ${courses.length} formations, ${partners.length} partenaires (*.ux@jumanly.test)`,
  );
}
