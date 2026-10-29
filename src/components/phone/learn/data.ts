import "server-only";
import { getFormatter, getTranslations } from "next-intl/server";
import type { FormationFound, FormationHome } from "@/server/services/learn-phone";
import { planForCatalogLevel, type PublicPlan } from "@/server/services/plans";
import { initialsOf, shortName, toneOf } from "../fil/data";

/** The square of a course (« BI », « SQL »): a short skill it teaches, or the title's initials. */
export function courseMark(title: string, skills: string[] = []) {
  const short = skills.find((skill) => /^[\p{L}+#]{2,4}$/u.test(skill));
  if (short) return short.toUpperCase();
  // « SQL : jointures » → « SQL »: a first word already in capitals.
  const first = title.split(/[\s:·]+/)[0] ?? "";
  return /^[\p{Lu}+#]{2,4}$/u.test(first) ? first : initialsOf(title);
}

/** One of the six colours of the course banners, always the same for a course. */
export const courseTone = (slug: string) => toneOf(slug, false);

/** « Power BI » from « Power BI : premiers tableaux de bord » (the back link of a lesson). */
export const shortTitle = (title: string) => title.split(/\s*[:·–—]\s*/)[0]!.trim() || title;

export type CourseRow = {
  slug: string;
  href: string;
  initials: string;
  tone: number;
  /** The cover the admin chose (an image), shown in place of the initials. */
  cover: string | null;
  title: string;
  sub: string;
  /** « 25 % », « Terminé », « Gratuit », « Pro ». */
  state: string | null;
  /** Lime for done or free, cream for a plan. */
  stateTone: "lime" | "plan" | null;
  progress: number | null;
};

export type CourseCard = {
  slug: string;
  href: string;
  initials: string;
  tone: number;
  cover: string | null;
  title: string;
  line: string;
  level: string;
  price: string;
  free: boolean;
  domain: string | null;
};

export type FormationView = {
  me: { initials: string; image: string | null };
  current: {
    href: string;
    slug: string;
    initials: string;
    tone: number;
    cover: string | null;
    title: string;
    line: string;
    lesson: string;
    progress: number;
  } | null;
  advice: { text: string } | null;
  chips: string[];
  forOffers: CourseCard[];
  interview: { title: string; line: string | null; href: string };
  inProgress: CourseRow[];
  finished: CourseRow[];
  saved: CourseRow[];
  certificates: { id: string; href: string; title: string; line: string }[];
  certificatesTitle: string;
  /** « Compétences demandées dans vos offres » of the search. */
  skills: string[];
};

/** The words of the tab, from the texts and the person's data. */
export async function formationWords(plans: PublicPlan[]) {
  const t = await getTranslations("phoneLearn");
  const format = await getFormatter();
  const day = (date: Date) =>
    format.dateTime(date, { day: "numeric", month: "short", year: "numeric" });
  const duration = (minutes: number) =>
    minutes >= 60
      ? minutes % 60 === 0
        ? t("hoursOnly", { hours: minutes / 60 })
        : t("hours", {
            hours: Math.floor(minutes / 60),
            minutes: String(minutes % 60).padStart(2, "0"),
          })
      : t("minutes", { count: Math.max(1, minutes) });
  const price = (requiredLevel: string) =>
    requiredLevel === "free"
      ? t("free")
      : (planForCatalogLevel(plans, requiredLevel)?.name ?? t("free"));
  const level = (value: string) =>
    value === "beginner" || value === "intermediate" || value === "advanced"
      ? t(`level.${value}`)
      : value;
  return { t, day, duration, price, level };
}

export async function formationView(
  home: FormationHome,
  me: { name: string; image: string | null },
  plans: PublicPlan[],
  skills: string[],
  now = new Date(),
): Promise<FormationView> {
  const { t, day, duration, price, level } = await formationWords(plans);
  const format = await getFormatter();
  const current = home.current;
  const lessonOf = (course: (typeof home.inProgress)[number]) => {
    const lessons = course.lessonIds;
    const index = course.next ? lessons.findIndex((id) => id === course.next!.id) : -1;
    return { n: index + 1, count: lessons.length };
  };
  const card = (course: FormationHome["forOffers"][number]): CourseCard => ({
    slug: course.slug,
    href: `/app/learn/${course.slug}`,
    initials: courseMark(course.title, course.skills),
    tone: courseTone(course.slug),
    cover: course.coverUrl,
    title: course.title,
    line: t("cardLine", { count: course.lessons, duration: duration(course.minutes) }),
    level: level(course.level),
    price: price(course.requiredLevel),
    free: course.free,
    domain: course.domain,
  });
  const row = (course: FormationHome["inProgress"][number]): CourseRow => {
    const { n, count } = lessonOf(course);
    return {
      slug: course.slug,
      href: `/app/learn/${course.slug}`,
      initials: courseMark(course.title),
      tone: courseTone(course.slug),
      cover: course.coverUrl,
      title: course.title,
      sub: course.finished
        ? course.completedAt
          ? t("finishedOn", { date: day(course.completedAt) })
          : t("finishedNoDate")
        : t("lessonOf", { n: Math.max(1, n), count }),
      state: course.finished ? t("done") : t("percent", { value: course.progress }),
      stateTone: course.finished ? "lime" : null,
      progress: course.finished ? null : course.progress,
    };
  };

  let currentView: FormationView["current"] = null;
  if (current) {
    const { n, count } = lessonOf(current);
    currentView = {
      href: current.next
        ? `/app/learn/${current.slug}/${current.next.id}`
        : `/app/learn/${current.slug}`,
      slug: current.slug,
      initials: courseMark(current.title),
      tone: courseTone(current.slug),
      cover: current.coverUrl,
      title: current.title,
      lesson: t("lessonOf", { n: Math.max(1, n), count }),
      line: t("continueLine", {
        lesson: t("lessonOf", { n: Math.max(1, n), count }),
        title: current.next?.title ?? "",
        duration: duration(Math.max(1, Math.round((current.next?.durationSec ?? 60) / 60))),
      }),
      progress: current.progress,
    };
  }
  const left = current ? current.leftLessons : 0;
  const advice =
    current && home.advice
      ? {
          text: t("advice", {
            course: shortTitle(current.title),
            count: home.advice.offers,
            left,
          }),
        }
      : current
        ? { text: t("adviceNoOffer", { course: shortTitle(current.title), left }) }
        : null;

  const interview = home.interview
    ? {
        title: t("interview.title"),
        line: t("interview.line", {
          company: shortName(home.interview.company),
          when: format.dateTime(home.interview.startsAt, {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "numeric",
            minute: "2-digit",
            timeZone: home.interview.timezone || undefined,
          }),
        }),
        href: `/app/career/entretiens/nouveau?candidature=${home.interview.applicationId}&depuis=formation`,
      }
    : {
        title: t("interview.practiceTitle"),
        line: null,
        href: "/app/career/entretiens/nouveau?depuis=formation",
      };

  const forOffers = home.forOffers.map(card);
  const chips = [
    ...new Set(forOffers.flatMap((course) => (course.domain ? [course.domain] : []))),
  ].slice(0, 5);

  void now;
  return {
    me: { initials: initialsOf(me.name), image: me.image },
    current: currentView,
    advice,
    chips,
    forOffers,
    interview,
    inProgress: home.inProgress.map(row),
    finished: home.finished.map(row),
    saved: home.saved.map((course) => ({
      slug: course.slug,
      href: `/app/learn/${course.slug}`,
      initials: courseMark(course.title, course.skills),
      tone: courseTone(course.slug),
      cover: course.coverUrl,
      title: course.title,
      sub: t("cardLine", { count: course.lessons, duration: duration(course.minutes) }),
      state: price(course.requiredLevel),
      stateTone: course.free ? "lime" : "plan",
      progress: null,
    })),
    certificates: home.certificates.map((item) => ({
      id: item.id,
      href: `/app/learn/attestations/${item.id}`,
      title: item.title,
      line:
        item.score !== null
          ? t("certificateLine", { date: day(item.issuedAt), score: item.score })
          : t("certificateLineNoScore", { date: day(item.issuedAt) }),
    })),
    certificatesTitle: t("certificatesCount", { count: home.certificates.length }),
    skills,
  };
}

export type FoundView = {
  courses: CourseRow[];
  lessons: { id: string; href: string; title: string; line: string; num: number; tone: number }[];
  certificates: { id: string; href: string; title: string; line: string }[];
};

/** The results of the search, in the words of the rows (« Leçon 3 sur 8 », « Gratuit »…). */
export async function foundView(found: FormationFound, plans: PublicPlan[]): Promise<FoundView> {
  const { t, day, duration, price } = await formationWords(plans);
  return {
    courses: found.courses.map((course) => {
      const started = course.progress !== null && !course.finished && course.progress > 0;
      return {
        slug: course.slug,
        href: `/app/learn/${course.slug}`,
        initials: courseMark(course.title, course.skills),
        tone: courseTone(course.slug),
        cover: course.coverUrl,
        title: course.title,
        sub: course.finished
          ? t("finishedNoDate")
          : t("cardLine", { count: course.lessons, duration: duration(course.minutes) }),
        state: course.finished
          ? t("done")
          : started
            ? t("percent", { value: course.progress! })
            : price(course.requiredLevel),
        stateTone: course.finished || (!started && course.free) ? "lime" : started ? null : "plan",
        progress: started ? course.progress : null,
      };
    }),
    lessons: found.lessons.map((lesson) => ({
      id: lesson.id,
      href: `/app/learn/${lesson.course.slug}/${lesson.id}`,
      title: lesson.title,
      line: t("lessonLine", {
        course: shortTitle(lesson.course.title),
        duration: duration(lesson.minutes),
      }),
      num: lesson.num,
      tone: courseTone(lesson.course.slug),
    })),
    certificates: found.certificates.map((item) => ({
      id: item.id,
      href: `/app/learn/attestations/${item.id}`,
      title: item.courseTitle,
      line: t("certificateLineNoScore", { date: day(item.issuedAt) }),
    })),
  };
}
