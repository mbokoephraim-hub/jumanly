/**
 * Apprendre of the mobile redesign (docs/refonte-mobile/talent-3), for Grâce of the UX scenario
 * (local and preview only, CLAUDE.md § 11): the courses of the planche, two in progress, one
 * finished with its signed attestation, one above the Free plan with a free first module, the
 * path « Premier emploi en bureau », a quiz and an exercise to do. Every course, text and
 * attestation is fictional. Runs after `seedUxScenario` and `seedLearnDomains`.
 */
import { signCertificate } from "../../src/server/services/certificate-signature";
import type { CatalogLevel, CourseLevel, LessonKind } from "../../src/generated/prisma/client";
import type { SeedClient } from "./client";

const day = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * day);
const NOTICE = "Formation fictive de démonstration.";

type Question = { prompt: string; options: string[]; answer: number; explanation: string };
type Lesson = {
  title: string;
  kind: LessonKind;
  minutes: number;
  brief?: string;
  paragraphs?: string[];
  steps?: { title: string; minutes: number }[];
  takeaways?: string[];
  preview?: boolean;
  quiz?: Question[];
};
type Course = {
  slug: string;
  title: string;
  summary: string;
  domain: string;
  category: string;
  level: CourseLevel;
  requiredLevel: CatalogLevel;
  skills: string[];
  modules: { title: string; lessons: Lesson[] }[];
};

const video = (title: string, minutes: number, brief: string, more: string[] = []): Lesson => ({
  title,
  kind: "video",
  minutes,
  brief,
  paragraphs: [brief, ...more],
});

/**
 * Modèle B, lot B7: « À retenir » and the quick question of some lessons on the phone
 * (`content.takeaways`, `content.check`), by lesson title. Fictional teaching content.
 */
type Check = { question: string; options: string[]; answer: number; explanation: string };
const phoneLessons: Record<string, { takeaways?: string[]; check?: Check }> = {
  "INNER JOIN": {
    takeaways: [
      "Une jointure relie deux tables par une colonne commune",
      "INNER JOIN ne garde que les lignes présentes des deux côtés",
      "Nommez les tables avec un alias court",
    ],
    check: {
      question: "Quelles lignes garde INNER JOIN ?",
      options: [
        "Celles présentes dans les deux tables",
        "Toutes les lignes de la première table",
        "Aucune ligne",
      ],
      answer: 0,
      explanation: "INNER JOIN ne garde que ce qui existe des deux côtés de la jointure.",
    },
  },
  "LEFT JOIN": {
    takeaways: [
      "LEFT JOIN garde toutes les lignes de la première table",
      "Une valeur absente à droite devient NULL",
      "Pratique pour trouver ce qui manque",
    ],
    check: {
      question: "Que devient une ligne sans correspondance à droite avec LEFT JOIN ?",
      options: ["Elle reste, avec des NULL", "Elle disparaît", "Elle est doublée"],
      answer: 0,
      explanation: "LEFT JOIN garde la ligne de gauche et met NULL dans les colonnes de droite.",
    },
  },
  "Une requête dans la requête": {
    takeaways: [
      "La sous-requête est calculée d'abord",
      "Elle se place entre parenthèses",
      "Testez-la seule avant de l'imbriquer",
    ],
    check: {
      question: "Quelle partie est calculée en premier ?",
      options: ["La sous-requête", "Le SELECT principal", "Le ORDER BY"],
      answer: 0,
      explanation:
        "La requête entre parenthèses donne d'abord son résultat à la requête principale.",
    },
  },
  "Les six secondes du premier regard": {
    takeaways: [
      "Le haut du CV est lu en premier",
      "Un titre qui reprend le poste visé",
      "Les compétences clés visibles tout de suite",
    ],
    check: {
      question: "Que lit d'abord un recruteur ?",
      options: ["Le haut du CV", "Les loisirs", "La dernière ligne"],
      answer: 0,
      explanation: "Le titre, le dernier poste et les compétences sont lus en quelques secondes.",
    },
  },
  "Les rubriques utiles": {
    takeaways: [
      "Gardez ce qui sert le poste visé",
      "Retirez ce qui n'apporte rien",
      "Un ordre clair : expériences, formation, compétences",
    ],
    check: {
      question: "Quelle rubrique garder ?",
      options: ["Celle qui sert le poste visé", "Toutes, par principe", "Aucune"],
      answer: 0,
      explanation: "Un CV court ne garde que ce qui aide le recruteur à vous choisir.",
    },
  },
};

const courses: Course[] = [
  {
    slug: "demo-t3-ecrire-un-cv",
    title: "Écrire un CV qui décroche un entretien",
    summary: "Un CV clair d'une page, des résultats chiffrés et les bons mots-clés. (fictif)",
    domain: "career-employability",
    category: "career",
    level: "beginner",
    requiredLevel: "free",
    skills: ["redaction-professionnelle"],
    modules: [
      {
        title: "Ce que lit un recruteur",
        lessons: [
          video(
            "Les six secondes du premier regard",
            6,
            "Un recruteur parcourt d'abord le haut du CV : le titre, le dernier poste et les compétences.",
          ),
          video("Les rubriques utiles", 5, "Gardez les rubriques qui servent le poste visé."),
        ],
      },
      {
        title: "Le bon format",
        lessons: [
          video(
            "Une page, pas plus",
            4,
            "Pour un premier emploi, une page suffit : trois expériences et cinq compétences au plus.",
          ),
          video(
            "Un résultat chiffré par expérience",
            4,
            "Un chiffre rend une expérience concrète : un délai tenu, un nombre de clients, une hausse.",
          ),
          {
            title: "Le bon format de CV",
            kind: "quiz",
            minutes: 4,
            quiz: [
              {
                prompt: "Combien de pages pour un premier CV ?",
                options: ["Une page", "Deux pages", "Trois pages"],
                answer: 0,
                explanation:
                  "Une page suffit pour un premier emploi : le recruteur va à l'essentiel.",
              },
              {
                prompt: "Que mettre en haut du CV ?",
                options: ["Ses loisirs", "Le titre du poste visé", "Sa photo seule"],
                answer: 1,
                explanation: "Le titre dit tout de suite quel poste vous visez.",
              },
              {
                prompt: "Quelle expérience est la plus parlante ?",
                options: [
                  "J'ai aidé les clients.",
                  "J'ai répondu à 40 clients par jour.",
                  "J'étais au guichet.",
                ],
                answer: 1,
                explanation: "Le chiffre montre l'ampleur du travail.",
              },
              {
                prompt: "Combien de compétences mettre en avant ?",
                options: ["Cinq au plus", "Quinze", "Toutes"],
                answer: 0,
                explanation:
                  "Cinq compétences choisies pour le poste se lisent mieux qu'une longue liste.",
              },
              {
                prompt: "Quel nom de fichier choisir ?",
                options: ["cv.pdf", "Prenom-Nom-CV.pdf", "document1.pdf"],
                answer: 1,
                explanation: "Votre nom dans le fichier aide le recruteur à le retrouver.",
              },
            ],
          },
          {
            title: "Mon CV en une page",
            kind: "exercise",
            minutes: 10,
            brief: "Mettez en pratique le module : un CV d'une page, prêt à envoyer.",
            steps: [
              { title: "Reprenez votre CV actuel.", minutes: 2 },
              { title: "Gardez 3 expériences et 5 compétences au plus.", minutes: 4 },
              { title: "Ajoutez un résultat chiffré par expérience.", minutes: 4 },
            ],
          },
        ],
      },
      {
        title: "Les mots-clés de l'offre",
        lessons: [video("Lire une offre", 5, "Repérez les mots qui reviennent dans l'offre.")],
      },
      {
        title: "La mise en page",
        lessons: [video("Aérer sans perdre de place", 4, "Des marges égales et une seule police.")],
      },
      {
        title: "Envoyer son CV",
        lessons: [
          video("Le PDF et le message", 4, "Envoyez toujours un PDF, avec un message court."),
        ],
      },
    ],
  },
  {
    slug: "demo-t3-sql-jointures",
    title: "SQL : jointures et sous-requêtes",
    summary: "Relier deux tables et poser une question dans une question. (fictif)",
    domain: "digital-productivity",
    category: "data",
    level: "intermediate",
    requiredLevel: "free",
    skills: ["sql"],
    modules: [
      {
        title: "Les jointures",
        lessons: [
          video("INNER JOIN", 12, "Une jointure relie deux tables par une colonne commune."),
          video("LEFT JOIN", 10, "LEFT JOIN garde toutes les lignes de la première table."),
        ],
      },
      {
        title: "Les sous-requêtes",
        lessons: [video("Une requête dans la requête", 12, "La sous-requête calcule d'abord.")],
      },
      {
        title: "Cas pratique",
        lessons: [video("Le tableau des ventes", 10, "On assemble tout sur un exemple fictif.")],
      },
    ],
  },
  {
    slug: "demo-t3-excel-pour-le-travail",
    title: "Excel pour le travail",
    summary: "Les formules, les tableaux croisés et les graphiques du quotidien. (fictif)",
    domain: "digital-productivity",
    category: "digital",
    level: "beginner",
    requiredLevel: "free",
    skills: ["excel", "tableaux-croises-dynamiques"],
    modules: [
      {
        title: "Les bases d'un tableau",
        lessons: [
          video(
            "Saisir et trier",
            5,
            "Un tableau propre : une ligne par élément, une colonne par donnée.",
          ),
          {
            title: "Mettre en forme",
            kind: "exercise",
            minutes: 3,
            brief: "Mettez en forme un tableau fictif.",
          },
        ],
      },
      {
        title: "Les formules utiles",
        lessons: [
          video("SOMME et MOYENNE", 4, "SOMME additionne une plage, MOYENNE en donne la moyenne."),
          video(
            "Les formules SI et RECHERCHEV",
            8,
            "La formule SI teste une condition et renvoie une valeur si elle est vraie, une autre sinon. On l'utilise pour classer une agence selon son objectif.",
            [
              "RECHERCHEV cherche une valeur dans la première colonne d'un tableau et renvoie la valeur de la même ligne, dans la colonne choisie.",
            ],
          ),
          {
            title: "Quiz · Les formules",
            kind: "quiz",
            minutes: 4,
            quiz: [
              {
                prompt: "Quelle formule renvoie « Atteint » si les ventes dépassent 100 ?",
                options: ["=RECHERCHEV(100;A2;1)", '=SI(B2>100;"Atteint";"Non")', "=SOMME(B2;100)"],
                answer: 1,
                explanation:
                  "SI teste la condition B2 > 100, puis renvoie le premier texte si elle est vraie.",
              },
              {
                prompt: "Que fait SOMME(A1:A5) ?",
                options: [
                  "Elle additionne A1 à A5",
                  "Elle compte les cellules",
                  "Elle trie la colonne",
                ],
                answer: 0,
                explanation: "SOMME additionne toutes les valeurs de la plage.",
              },
              {
                prompt: "RECHERCHEV cherche la valeur dans…",
                options: [
                  "la dernière colonne",
                  "la première colonne du tableau",
                  "toutes les cellules",
                ],
                answer: 1,
                explanation: "RECHERCHEV regarde toujours la première colonne du tableau choisi.",
              },
            ],
          },
        ],
      },
      {
        title: "Les tableaux croisés",
        lessons: [
          video("Résumer en un clic", 12, "Un tableau croisé résume des milliers de lignes."),
        ],
      },
      {
        title: "Les graphiques",
        lessons: [
          video(
            "Choisir le bon graphique",
            10,
            "Une courbe pour le temps, des barres pour comparer.",
          ),
        ],
      },
      {
        title: "Imprimer et partager",
        lessons: [video("Une page lisible", 6, "Réglez la zone d'impression avant d'envoyer.")],
      },
      {
        title: "Cas pratique",
        lessons: [
          video("Le suivi des ventes", 8, "On assemble tout sur un tableau de ventes fictif."),
        ],
      },
    ],
  },
  {
    slug: "demo-t3-reussir-son-entretien",
    title: "Réussir son entretien",
    summary: "Se présenter, répondre aux questions difficiles et parler salaire. (fictif)",
    domain: "career-employability",
    category: "sales",
    level: "intermediate",
    requiredLevel: "fundamentals",
    skills: ["communication-orale"],
    modules: [
      {
        title: "Se présenter en 2 minutes",
        lessons: [
          {
            ...video(
              "Le pitch en trois temps",
              6,
              "Qui vous êtes, ce que vous savez faire, ce que vous cherchez.",
            ),
            preview: true,
          },
        ],
      },
      {
        title: "Les questions difficiles",
        lessons: [
          video("Vos défauts", 9, "Un vrai défaut, et ce que vous faites pour le corriger."),
        ],
      },
      {
        title: "Négocier son salaire",
        lessons: [
          video("Donner une fourchette", 8, "Une fourchette réaliste, appuyée sur le marché."),
        ],
      },
      {
        title: "Les questions à poser",
        lessons: [video("Montrer son intérêt", 8, "Deux questions préparées sur le poste.")],
      },
      {
        title: "Après l'entretien",
        lessons: [video("Le message de remerciement", 9, "Un message court le jour même.")],
      },
    ],
  },
  {
    slug: "demo-t3-tableaux-croises",
    title: "Tableaux croisés en 30 min",
    summary: "Résumer un grand tableau en quelques clics. (fictif)",
    domain: "digital-productivity",
    category: "digital",
    level: "beginner",
    requiredLevel: "free",
    skills: ["tableaux-croises-dynamiques"],
    modules: [
      {
        title: "Créer le tableau",
        lessons: [video("Les champs", 10, "Glissez les champs en lignes et en valeurs.")],
      },
      { title: "Filtrer", lessons: [video("Les segments", 10, "Un segment filtre d'un clic.")] },
      {
        title: "Présenter",
        lessons: [video("La mise en forme", 10, "Un style sobre se lit mieux.")],
      },
    ],
  },
  {
    slug: "demo-t3-presenter-ses-chiffres",
    title: "Présenter ses chiffres",
    summary: "Un chiffre, une phrase, un graphique. (fictif)",
    domain: "career-employability",
    category: "career",
    level: "beginner",
    requiredLevel: "free",
    skills: ["presentation-professionnelle"],
    modules: [
      {
        title: "Choisir le chiffre",
        lessons: [video("Le message d'abord", 12, "Un seul message par diapositive.")],
      },
      {
        title: "La phrase",
        lessons: [video("Dire ce que le chiffre veut dire", 11, "Le chiffre seul ne dit rien.")],
      },
      {
        title: "Le graphique",
        lessons: [video("Simplifier", 11, "Retirez tout ce qui ne sert pas.")],
      },
      {
        title: "À l'oral",
        lessons: [video("Présenter en 2 minutes", 11, "Commencez par la conclusion.")],
      },
    ],
  },
  {
    slug: "demo-t3-travailler-en-equipe",
    title: "Travailler en équipe",
    summary: "Se répartir le travail et dire les choses simplement. (fictif)",
    domain: "career-employability",
    category: "soft",
    level: "beginner",
    requiredLevel: "free",
    skills: ["travail-en-equipe"],
    modules: [
      { title: "Les rôles", lessons: [video("Qui fait quoi", 8, "Un rôle clair pour chacun.")] },
      {
        title: "Les réunions",
        lessons: [video("Courtes et utiles", 7, "Un ordre du jour, une décision.")],
      },
      {
        title: "Les désaccords",
        lessons: [video("Dire non poliment", 8, "Les faits d'abord, puis une proposition.")],
      },
      { title: "Le suivi", lessons: [video("Un point par semaine", 7, "Dix minutes suffisent.")] },
    ],
  },
];

/** Planche talent-3: in progress (share of lessons done), finished, saved. */
const graceCourses: [string, number][] = [
  ["demo-t3-ecrire-un-cv", 0.4],
  ["demo-t3-sql-jointures", 0.15],
  ["demo-t3-excel-pour-le-travail", 1],
];
const graceSaved = ["demo-t3-tableaux-croises", "demo-t3-presenter-ses-chiffres"];
const path = {
  slug: "demo-premier-emploi-en-bureau",
  title: "Premier emploi en bureau",
  summary:
    "Parcours fictif de démonstration : un CV clair, Excel au travail, des chiffres bien présentés et un entretien réussi.",
  courses: [
    "demo-t3-ecrire-un-cv",
    "demo-t3-excel-pour-le-travail",
    "demo-t3-presenter-ses-chiffres",
    "demo-t3-reussir-son-entretien",
  ],
};

export async function seedLearnScenario(db: SeedClient) {
  const grace = await db.user.findUnique({
    where: { email: "grace.ux@jumanly.test" },
    select: { id: true, firstName: true, lastName: true, name: true },
  });
  if (!grace) return;
  const [domains, skills] = await Promise.all([
    db.learningDomain.findMany({ select: { id: true, slug: true } }),
    db.skill.findMany({
      where: { slug: { in: courses.flatMap((course) => course.skills) } },
      select: { id: true, slug: true, name: true },
    }),
  ]);
  const domainOf = new Map(domains.map((domain) => [domain.slug, domain.id]));
  const skillOf = new Map(skills.map((skill) => [skill.slug, skill]));

  for (const [index, course] of courses.entries()) {
    const lessons = course.modules.flatMap((module) => module.lessons);
    const data = {
      title: course.title,
      summary: course.summary,
      description: `${course.summary} ${NOTICE}`,
      objectives: lessons.slice(0, 3).map((lesson) => lesson.title),
      audience: "Toute personne qui débute. Contenu fictif.",
      category: course.category,
      domainId: domainOf.get(course.domain) ?? null,
      level: course.level,
      durationMinutes: lessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
      requiredLevel: course.requiredLevel,
      status: "published" as const,
      enrollmentCount: 40 + index * 9,
      publishedAt: ago(4 + index),
      instructor: "Formatrice fictive (démo)",
      certificateEnabled: true,
    };
    const saved = await db.course.upsert({
      where: { slug: course.slug },
      update: data,
      create: { slug: course.slug, ...data },
    });
    // Rebuilt each time: the lessons of these demo courses carry no learner data but Grâce's.
    await db.courseModule.deleteMany({ where: { courseId: saved.id } });
    await db.courseSkill.deleteMany({ where: { courseId: saved.id } });
    for (const [moduleIndex, module] of course.modules.entries())
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
              isPreview: lesson.preview ?? (moduleIndex === 0 && lessonIndex === 0),
              content: {
                paragraphs: lesson.paragraphs ?? [],
                ...(lesson.brief ? { brief: lesson.brief } : {}),
                ...(lesson.steps ? { steps: lesson.steps } : {}),
                ...(lesson.takeaways ? { takeaways: lesson.takeaways } : {}),
                ...phoneLessons[lesson.title],
              },
              ...(lesson.quiz
                ? {
                    quiz: {
                      create: {
                        passingScore: 80,
                        questions: {
                          create: lesson.quiz.map((question, order) => ({
                            order: order + 1,
                            type: "single" as const,
                            prompt: question.prompt,
                            options: question.options,
                            answer: [String(question.answer)],
                            explanation: question.explanation,
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
    for (const slug of course.skills) {
      const skill = skillOf.get(slug);
      if (skill) await db.courseSkill.create({ data: { courseId: saved.id, skillId: skill.id } });
    }
  }

  // Grâce: two courses in progress, Excel finished with its signed attestation.
  const holder =
    [grace.firstName, grace.lastName].filter(Boolean).join(" ") || grace.name || "Grâce Démo";
  for (const [slug, share] of graceCourses) {
    const course = await db.course.findUniqueOrThrow({
      where: { slug },
      include: {
        modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
        skills: { include: { skill: { select: { name: true } } } },
        domain: { select: { name: true } },
      },
    });
    const lessons = course.modules.flatMap((module) => module.lessons);
    // The quiz and the exercise stay to do in the course in progress (« À faire »).
    const done = lessons
      .filter((lesson) => share >= 1 || (lesson.kind !== "quiz" && lesson.kind !== "exercise"))
      .slice(0, Math.max(1, Math.round(lessons.length * share)))
      .map((lesson) => lesson.id);
    const finished = share >= 1;
    const data = {
      progress: Math.round(share * 100),
      completedLessons: done,
      lastLessonId: done.at(-1) ?? null,
      startedAt: ago(finished ? 9 : 4),
      completedAt: finished ? ago(1) : null,
    };
    const enrollment = await db.enrollment.upsert({
      where: { userId_courseId: { userId: grace.id, courseId: course.id } },
      update: data,
      create: { userId: grace.id, courseId: course.id, ...data },
    });
    if (!finished) continue;
    const quiz = lessons.find((lesson) => lesson.kind === "quiz");
    const quizRow = quiz ? await db.quiz.findUnique({ where: { lessonId: quiz.id } }) : null;
    if (quizRow)
      await db.quizAttempt.create({
        data: { userId: grace.id, quizId: quizRow.id, score: 90, answers: {}, passed: true },
      });
    const certificate = {
      code: "JMN-7K4P-2QX9",
      holderName: holder,
      courseTitle: course.title,
      hours: Math.max(1, Math.round(course.durationMinutes / 60)),
      issuedAt: ago(1),
      score: 90,
    };
    const signed = signCertificate(certificate);
    const values = {
      ...certificate,
      domain: course.domain?.name ?? null,
      modules: course.modules.length,
      skills: course.skills.map((item) => item.skill.name),
      signature: signed.signature,
      keyId: signed.keyId,
      signedAt: certificate.issuedAt,
      onProfile: true,
    };
    await db.certificate.deleteMany({
      where: { code: certificate.code, NOT: { enrollmentId: enrollment.id } },
    });
    await db.certificate.upsert({
      where: { enrollmentId: enrollment.id },
      update: values,
      create: { enrollmentId: enrollment.id, ...values },
    });
  }
  for (const slug of graceSaved) {
    const course = await db.course.findUniqueOrThrow({ where: { slug }, select: { id: true } });
    await db.savedCourse.upsert({
      where: { userId_courseId: { userId: grace.id, courseId: course.id } },
      update: {},
      create: { userId: grace.id, courseId: course.id },
    });
  }

  // The path « Premier emploi en bureau », suggested by Orbi in the search.
  const saved = await db.learningPath.upsert({
    where: { slug: path.slug },
    update: { title: path.title, summary: path.summary },
    create: {
      slug: path.slug,
      title: path.title,
      summary: path.summary,
      domainId: domainOf.get("career-employability") ?? null,
      status: "published",
      publishedAt: new Date(),
    },
  });
  for (const [order, slug] of path.courses.entries()) {
    const course = await db.course.findUniqueOrThrow({ where: { slug }, select: { id: true } });
    await db.learningPathCourse.upsert({
      where: { pathId_courseId: { pathId: saved.id, courseId: course.id } },
      update: { order },
      create: { pathId: saved.id, courseId: course.id, order },
    });
  }
  console.log("✓ Apprendre : formations, attestation et parcours de Grâce (planche talent-3)");
}
