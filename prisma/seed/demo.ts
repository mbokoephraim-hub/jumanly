/**
 * Demo dataset, local and preview only (CLAUDE.md § 11, docs/specifications.md partie 04 § 4.3).
 * Everything here is obviously fictional: names say "fictive" and every description says it is a demo.
 * Demo talents and recruiters arrive with accounts at step E2.
 */
import type { ContractType, RemoteMode } from "../../src/generated/prisma/client";
import type { SeedClient } from "./client";

const DEMO_NOTICE = "Contenu fictif de démonstration : cette offre n'existe pas.";
const COURSE_NOTICE = "Formation fictive de démonstration.";

const day = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number) => new Date(Date.now() + days * day);

type JobSeed = {
  slug: string;
  title: string;
  contractType: ContractType;
  city: string;
  country: string;
  remote: RemoteMode;
  salary?: [number, number];
  experienceMin: number;
  publishedDaysAgo: number;
  closesInDays: number;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  skills: { slug: string; importance: "required" | "preferred" }[];
  languages: { code: string; level: string }[];
  knockout?: string[];
};

const jobs: JobSeed[] = [
  {
    slug: "demo-assistant-administratif-kinshasa",
    title: "Assistant administratif (démo)",
    contractType: "cdi",
    city: "Kinshasa",
    country: "RD Congo",
    remote: "onsite",
    salary: [40000, 60000],
    experienceMin: 1,
    publishedDaysAgo: 2,
    closesInDays: 28,
    summary: "Vous assurez le suivi administratif quotidien d'une équipe fictive.",
    responsibilities: [
      "Classer et archiver les documents",
      "Préparer les courriers et comptes rendus",
      "Tenir l'agenda de l'équipe",
    ],
    requirements: [
      "Une première expérience en secrétariat ou administration",
      "Maîtrise des outils bureautiques",
    ],
    skills: [
      { slug: "excel", importance: "required" },
      { slug: "word", importance: "required" },
      { slug: "organisation", importance: "preferred" },
    ],
    languages: [{ code: "fr", level: "C1" }],
  },
  {
    slug: "demo-comptable-junior-abidjan",
    title: "Comptable junior (démo)",
    contractType: "cdd",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    remote: "hybrid",
    salary: [50000, 70000],
    experienceMin: 1,
    publishedDaysAgo: 4,
    closesInDays: 21,
    summary: "Vous participez à la tenue de la comptabilité d'une structure imaginaire.",
    responsibilities: [
      "Saisir les écritures comptables",
      "Préparer les rapprochements bancaires",
      "Participer aux clôtures mensuelles",
    ],
    requirements: ["Formation en comptabilité ou gestion", "Connaissance d'un logiciel comptable"],
    skills: [
      { slug: "comptabilite-generale", importance: "required" },
      { slug: "excel", importance: "required" },
      { slug: "sage", importance: "preferred" },
    ],
    languages: [{ code: "fr", level: "C1" }],
  },
  {
    slug: "demo-stage-marketing-digital-dakar",
    title: "Stage en marketing digital (démo)",
    contractType: "stage",
    city: "Dakar",
    country: "Sénégal",
    remote: "hybrid",
    experienceMin: 0,
    publishedDaysAgo: 1,
    closesInDays: 30,
    summary: "Stage fictif pour découvrir la communication en ligne d'une marque inventée.",
    responsibilities: [
      "Préparer les publications des réseaux sociaux",
      "Suivre les statistiques des campagnes",
      "Rédiger de courts articles",
    ],
    requirements: ["Étudiant ou jeune diplômé en communication ou marketing"],
    skills: [
      { slug: "gestion-des-reseaux-sociaux", importance: "required" },
      { slug: "redaction-web", importance: "preferred" },
      { slug: "creativite", importance: "preferred" },
    ],
    languages: [{ code: "fr", level: "B2" }],
  },
  {
    slug: "demo-developpeur-web-douala",
    title: "Développeur web (démo)",
    contractType: "cdi",
    city: "Douala",
    country: "Cameroun",
    remote: "remote",
    salary: [80000, 120000],
    experienceMin: 2,
    publishedDaysAgo: 6,
    closesInDays: 25,
    summary: "Vous développez les pages d'une application fictive.",
    responsibilities: [
      "Développer de nouvelles fonctionnalités",
      "Corriger les anomalies",
      "Relire le code de l'équipe",
    ],
    requirements: ["Deux ans d'expérience en développement web", "Pratique de Git"],
    skills: [
      { slug: "javascript", importance: "required" },
      { slug: "html", importance: "required" },
      { slug: "css", importance: "required" },
      { slug: "git", importance: "preferred" },
    ],
    languages: [
      { code: "fr", level: "B2" },
      { code: "en", level: "B1" },
    ],
  },
  {
    slug: "demo-charge-clientele-lubumbashi",
    title: "Chargé de clientèle (démo)",
    contractType: "cdi",
    city: "Lubumbashi",
    country: "RD Congo",
    remote: "onsite",
    experienceMin: 0,
    publishedDaysAgo: 3,
    closesInDays: 14,
    summary: "Vous accueillez et conseillez les clients d'une agence imaginaire.",
    responsibilities: [
      "Répondre aux demandes des clients",
      "Présenter les services",
      "Suivre les réclamations",
    ],
    requirements: ["Aisance à l'oral", "Sens du service"],
    skills: [
      { slug: "relation-client", importance: "required" },
      { slug: "communication-orale", importance: "required" },
      { slug: "swahili", importance: "preferred" },
    ],
    languages: [{ code: "fr", level: "B2" }],
  },
  {
    slug: "demo-analyste-donnees-kigali",
    title: "Analyste de données (démo)",
    contractType: "mission",
    city: "Kigali",
    country: "Rwanda",
    remote: "remote",
    salary: [90000, 110000],
    experienceMin: 2,
    publishedDaysAgo: 8,
    closesInDays: 20,
    summary: "Mission fictive de six mois pour construire des tableaux de bord.",
    responsibilities: [
      "Collecter et nettoyer les données",
      "Construire des tableaux de bord",
      "Présenter les résultats",
    ],
    requirements: ["Expérience en analyse de données", "Esprit de synthèse"],
    skills: [
      { slug: "sql", importance: "required" },
      { slug: "power-bi", importance: "required" },
      { slug: "anglais", importance: "preferred" },
    ],
    languages: [
      { code: "fr", level: "B2" },
      { code: "en", level: "B2" },
    ],
  },
  {
    slug: "demo-assistant-rh-alternance-yaounde",
    title: "Assistant ressources humaines en alternance (démo)",
    contractType: "alternance",
    city: "Yaoundé",
    country: "Cameroun",
    remote: "onsite",
    experienceMin: 0,
    publishedDaysAgo: 5,
    closesInDays: 35,
    summary: "Alternance fictive au sein d'un service RH inventé.",
    responsibilities: [
      "Préparer les dossiers du personnel",
      "Participer au recrutement",
      "Mettre à jour les tableaux de suivi",
    ],
    requirements: ["Inscription dans une formation en RH"],
    skills: [
      { slug: "recrutement", importance: "required" },
      { slug: "excel", importance: "preferred" },
    ],
    languages: [{ code: "fr", level: "B2" }],
  },
  {
    slug: "demo-commercial-terrain-cotonou",
    title: "Commercial terrain (démo)",
    contractType: "cdd",
    city: "Cotonou",
    country: "Bénin",
    remote: "onsite",
    salary: [35000, 55000],
    experienceMin: 1,
    publishedDaysAgo: 10,
    closesInDays: 10,
    summary: "Vous développez un portefeuille de clients fictifs.",
    responsibilities: [
      "Prospecter de nouveaux clients",
      "Négocier les commandes",
      "Rendre compte de l'activité",
    ],
    requirements: ["Expérience en vente", "Permis de conduire"],
    skills: [
      { slug: "prospection-commerciale", importance: "required" },
      { slug: "negociation", importance: "required" },
    ],
    languages: [{ code: "fr", level: "B2" }],
    knockout: ["Permis de conduire B"],
  },
  {
    slug: "demo-volontaire-education-bamako",
    title: "Volontaire en éducation numérique (démo)",
    contractType: "volontariat",
    city: "Bamako",
    country: "Mali",
    remote: "onsite",
    experienceMin: 0,
    publishedDaysAgo: 12,
    closesInDays: 18,
    summary: "Volontariat fictif pour animer des ateliers d'initiation au numérique.",
    responsibilities: [
      "Animer des ateliers",
      "Accompagner les participants",
      "Préparer les supports",
    ],
    requirements: ["Goût pour la transmission"],
    skills: [
      { slug: "formation-d-adultes", importance: "required" },
      { slug: "travail-en-equipe", importance: "preferred" },
    ],
    languages: [{ code: "fr", level: "B2" }],
  },
  {
    slug: "demo-chef-de-projet-kinshasa",
    title: "Chef de projet (démo)",
    contractType: "cdi",
    city: "Kinshasa",
    country: "RD Congo",
    remote: "hybrid",
    salary: [120000, 160000],
    experienceMin: 5,
    publishedDaysAgo: 7,
    closesInDays: 30,
    summary: "Vous pilotez des projets imaginaires de bout en bout.",
    responsibilities: [
      "Planifier et suivre les projets",
      "Coordonner les équipes",
      "Rendre compte au comité de pilotage",
    ],
    requirements: ["Cinq ans d'expérience en gestion de projet"],
    skills: [
      { slug: "gestion-de-projet", importance: "required" },
      { slug: "leadership", importance: "required" },
      { slug: "anglais", importance: "preferred" },
    ],
    languages: [
      { code: "fr", level: "C1" },
      { code: "en", level: "B2" },
    ],
  },
];

type CourseSeed = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  requiredLevel: "free" | "fundamentals" | "standard" | "advanced";
  enrollmentCount: number;
  objectives: string[];
  modules: {
    title: string;
    lessons: {
      title: string;
      kind: "video" | "text" | "exercise" | "quiz";
      minutes: number;
      /** Job-specific exercise (`learn.exercises.job_specific`). */
      jobSpecific?: boolean;
    }[];
  }[];
  skills: string[];
  jobFamilies?: string[];
};

/** Quiz of the demo courses: obviously fictitious, two questions. */
const demoQuiz = {
  passingScore: 50,
  maxAttempts: 0,
  questions: {
    create: [
      {
        order: 1,
        type: "single" as const,
        prompt: "Question de démonstration : Jumanly est…",
        options: ["Une plateforme de formation et d'emploi", "Un jeu vidéo"],
        answer: ["0"],
        explanation: "Réponse de démonstration.",
      },
      {
        order: 2,
        type: "multiple" as const,
        prompt: "Question de démonstration : quels modules existent ?",
        options: ["Learn", "Jobs", "Météo"],
        answer: ["0", "1"],
        explanation: "Réponse de démonstration.",
      },
    ],
  },
};

const courses: CourseSeed[] = [
  {
    slug: "demo-reussir-son-cv",
    title: "Réussir son CV (démo)",
    summary: "Les bases d'un CV clair et lisible.",
    category: "Employabilité",
    level: "beginner",
    requiredLevel: "free",
    enrollmentCount: 120,
    objectives: [
      "Structurer un CV",
      "Mettre en valeur ses expériences",
      "Éviter les erreurs fréquentes",
    ],
    modules: [
      {
        title: "Les fondations",
        lessons: [
          { title: "À quoi sert un CV", kind: "text", minutes: 6 },
          { title: "Les rubriques essentielles", kind: "video", minutes: 9 },
        ],
      },
      {
        title: "Mettre en valeur son parcours",
        lessons: [
          { title: "Décrire une expérience", kind: "video", minutes: 11 },
          { title: "Exercice : réécrire une expérience", kind: "exercise", minutes: 15 },
          { title: "Quiz final", kind: "quiz", minutes: 5 },
        ],
      },
    ],
    skills: ["redaction-professionnelle"],
  },
  {
    slug: "demo-preparer-un-entretien",
    title: "Préparer un entretien d'embauche (démo)",
    summary: "Se préparer sereinement aux questions classiques.",
    category: "Employabilité",
    level: "beginner",
    requiredLevel: "free",
    enrollmentCount: 95,
    objectives: [
      "Se présenter en deux minutes",
      "Répondre aux questions fréquentes",
      "Poser ses propres questions",
    ],
    modules: [
      {
        title: "Avant l'entretien",
        lessons: [
          { title: "Se renseigner sur l'employeur", kind: "text", minutes: 7 },
          { title: "Préparer son pitch", kind: "video", minutes: 10 },
        ],
      },
      {
        title: "Pendant l'entretien",
        lessons: [
          { title: "Les questions classiques", kind: "video", minutes: 12 },
          {
            title: "Exercice métier : l'entretien d'un chargé de clientèle",
            kind: "exercise",
            minutes: 15,
            jobSpecific: true,
          },
          { title: "Quiz final", kind: "quiz", minutes: 5 },
        ],
      },
    ],
    skills: ["communication-orale"],
    jobFamilies: ["Relation client", "Commerce"],
  },
  {
    slug: "demo-excel-pour-debuter",
    title: "Excel pour débuter (démo)",
    summary: "Tableaux, formules simples et graphiques.",
    category: "Bureautique",
    level: "beginner",
    requiredLevel: "fundamentals",
    enrollmentCount: 80,
    objectives: [
      "Créer un tableau propre",
      "Utiliser les formules de base",
      "Construire un graphique",
    ],
    modules: [
      {
        title: "Prise en main",
        lessons: [
          { title: "L'interface", kind: "text", minutes: 8 },
          { title: "Saisir et mettre en forme", kind: "video", minutes: 14 },
        ],
      },
      {
        title: "Calculer",
        lessons: [
          { title: "Les premières formules", kind: "video", minutes: 16 },
          { title: "Exercice : un budget mensuel", kind: "exercise", minutes: 20 },
        ],
      },
    ],
    skills: ["excel"],
  },
  {
    slug: "demo-prise-de-parole",
    title: "Prendre la parole en public (démo)",
    summary: "Gagner en aisance devant un groupe.",
    category: "Compétences comportementales",
    level: "intermediate",
    requiredLevel: "standard",
    enrollmentCount: 40,
    objectives: ["Structurer une intervention", "Gérer le trac", "Captiver son auditoire"],
    modules: [
      {
        title: "Préparer",
        lessons: [
          { title: "Le message clé", kind: "text", minutes: 9 },
          { title: "Construire son plan", kind: "video", minutes: 12 },
        ],
      },
      {
        title: "S'exprimer",
        lessons: [
          { title: "La voix et le regard", kind: "video", minutes: 13 },
          { title: "Exercice : une présentation de trois minutes", kind: "exercise", minutes: 20 },
        ],
      },
    ],
    skills: ["communication-orale", "gestion-du-stress"],
  },
  {
    slug: "demo-gestion-de-projet-essentiels",
    title: "Les essentiels de la gestion de projet (démo)",
    summary: "Planifier, suivre et clôturer un projet.",
    category: "Gestion de projet",
    level: "intermediate",
    requiredLevel: "standard",
    enrollmentCount: 55,
    objectives: ["Définir un périmètre", "Construire un planning", "Suivre l'avancement"],
    modules: [
      {
        title: "Cadrer",
        lessons: [
          { title: "Qu'est-ce qu'un projet", kind: "text", minutes: 8 },
          { title: "Les objectifs et le périmètre", kind: "video", minutes: 14 },
        ],
      },
      {
        title: "Piloter",
        lessons: [
          { title: "Le planning", kind: "video", minutes: 15 },
          { title: "Quiz final", kind: "quiz", minutes: 6 },
        ],
      },
    ],
    skills: ["gestion-de-projet"],
  },
  {
    slug: "demo-negocier-son-salaire",
    title: "Négocier son salaire (démo)",
    summary: "Préparer et mener une négociation salariale.",
    category: "Carrière",
    level: "advanced",
    requiredLevel: "advanced",
    enrollmentCount: 20,
    objectives: ["Connaître sa valeur", "Argumenter", "Conclure un accord"],
    modules: [
      {
        title: "Se préparer",
        lessons: [
          { title: "Évaluer son poste", kind: "text", minutes: 10 },
          { title: "Préparer ses arguments", kind: "video", minutes: 13 },
        ],
      },
      {
        title: "Négocier",
        lessons: [
          { title: "Mener l'échange", kind: "video", minutes: 15 },
          { title: "Exercice : jeu de rôle", kind: "exercise", minutes: 20 },
        ],
      },
    ],
    skills: ["negociation"],
  },
];

export async function seedDemo(db: SeedClient) {
  const organization = await db.organization.upsert({
    where: { slug: "demo-horizon-fictive" },
    update: {},
    create: {
      type: "company",
      name: "Horizon Démo (entreprise fictive)",
      slug: "demo-horizon-fictive",
      description:
        "Entreprise imaginaire utilisée pour la démonstration de Jumanly. Elle n'existe pas.",
      country: "RD Congo",
      city: "Kinshasa",
      sector: "Services",
      size: "50-249",
      verifiedAt: new Date(),
    },
  });

  const skills = await db.skill.findMany({ select: { id: true, slug: true } });
  const skillId = new Map(skills.map((skill) => [skill.slug, skill.id]));
  const missing = new Set<string>();
  const resolve = (slug: string) => {
    const id = skillId.get(slug);
    if (!id) missing.add(slug);
    return id;
  };

  for (const job of jobs) {
    const data = {
      organizationId: organization.id,
      title: job.title,
      description: `${job.summary} ${DEMO_NOTICE}`,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      benefits: ["Avantages fictifs, pour la démonstration"],
      process: [
        "Étude de la candidature",
        "Entretien avec le recruteur",
        "Réponse sous deux semaines",
      ],
      contractType: job.contractType,
      city: job.city,
      country: job.country,
      remote: job.remote,
      salaryMin: job.salary?.[0] ?? null,
      salaryMax: job.salary?.[1] ?? null,
      experienceMin: job.experienceMin,
      languagesRequired: job.languages,
      knockoutCriteria: job.knockout ?? [],
      status: "published" as const,
      publishedAt: daysFromNow(-job.publishedDaysAgo),
      closesAt: daysFromNow(job.closesInDays),
    };
    const saved = await db.job.upsert({
      where: { slug: job.slug },
      update: data,
      create: { slug: job.slug, ...data },
    });
    await db.jobSkill.deleteMany({ where: { jobId: saved.id } });
    for (const skill of job.skills) {
      const id = resolve(skill.slug);
      if (id) {
        await db.jobSkill.create({
          data: {
            jobId: saved.id,
            skillId: id,
            importance: skill.importance,
            weight: skill.importance === "required" ? 5 : 2,
          },
        });
      }
    }
  }

  for (const course of courses) {
    const durationMinutes = course.modules
      .flatMap((module) => module.lessons)
      .reduce((sum, lesson) => sum + lesson.minutes, 0);
    const data = {
      title: course.title,
      summary: course.summary,
      description: `${course.summary} ${COURSE_NOTICE}`,
      objectives: course.objectives,
      audience: "Toute personne qui souhaite découvrir Jumanly. Contenu fictif.",
      category: course.category,
      level: course.level,
      durationMinutes,
      requiredLevel: course.requiredLevel,
      status: "published" as const,
      enrollmentCount: course.enrollmentCount,
      publishedAt: daysFromNow(-course.enrollmentCount / 10),
      instructor: "Formateur fictif (démo)",
      jobFamilies: course.jobFamilies ?? [],
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
              jobSpecific: lesson.jobSpecific ?? false,
              content: {
                paragraphs: [
                  moduleIndex === 0 && lessonIndex === 0
                    ? `${lesson.title} : leçon d'aperçu de démonstration.`
                    : `${lesson.title} : leçon de démonstration.`,
                  COURSE_NOTICE,
                ],
              },
              ...(lesson.kind === "quiz" ? { quiz: { create: demoQuiz } } : {}),
            })),
          },
        },
      });
    }
    for (const slug of course.skills) {
      const id = resolve(slug);
      if (id) await db.courseSkill.create({ data: { courseId: saved.id, skillId: id } });
    }
  }

  if (missing.size > 0)
    console.warn(`Compétences absentes du référentiel : ${[...missing].join(", ")}`);
  console.log(`Démo : 1 entreprise fictive, ${jobs.length} offres, ${courses.length} formations.`);
}
