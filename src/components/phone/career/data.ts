import "server-only";
import QRCode from "qrcode";
import { getFormatter, getTranslations } from "next-intl/server";
import { languageName } from "@/lib/dates";
import { profileLanguageCodes } from "@/server/services/profile-view";
import { siteUrl } from "@/lib/seo";
import type { CareerHome } from "@/server/services/career-phone";
import { companyTone } from "../explorer/data";
import { initialsOf, shortName, toneOf } from "../fil/data";

/** « @grace.mbuyi »: the name in small letters, without accents, joined by dots. */
export function handleOf(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .trim()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "") || "jumanly"
  );
}

export type CareerEntry = {
  id: string;
  initials: string;
  tone: number;
  title: string;
  when: string;
  href: string | null;
};

export type CareerSearchItem = {
  id: string;
  scope: "profil" | "cv" | "portfolio" | "candidatures" | "parametres";
  initials: string;
  title: string;
  kind: string;
  href: string;
};

export type CareerView = {
  name: string;
  initials: string;
  tone: number;
  image: string | null;
  /** The banner the person chose (an /api/banniere/… address), or null for the drawn one. */
  banner: string | null;
  /** « @grace.mbuyi · Analyste de données junior · Kinshasa ». */
  handle: string;
  cap: string | null;
  availability: string;
  percent: number;
  plan: string;
  suggestion: { skillId: string; skill: string; text: string } | null;
  about: string | null;
  skills: { id: string; name: string }[];
  experiences: CareerEntry[];
  educations: CareerEntry[];
  places: string[];
  cvs: {
    id: string;
    title: string;
    line: string;
    tags: { text: string; strong?: boolean }[];
    href: string;
    pdf: string;
    primary: boolean;
  }[];
  adapt: { text: string; href: string } | null;
  projects: {
    id: string;
    title: string;
    line: string;
    featured: boolean;
    cover: string | null;
    tone: number;
    href: string;
  }[];
  progression: {
    stage: string;
    stageIndex: number;
    /** No diagnostic yet: « Faire le point » shows the stage. */
    diagnostic: boolean;
    next: string;
    courses: string;
    percent: number;
    applications: number;
    steps: { text: string; href: string }[];
  };
  applications: {
    id: string;
    href: string;
    title: string;
    line: string;
    initials: string;
    tone: number;
    status: string;
    strong: boolean;
    bars: number;
    note: string;
    noteStrong: boolean;
  }[];
  share: { url: string; qr: string; pdf: string | null; open: boolean };
  search: CareerSearchItem[];
  /** The two sheets of the profile: « Ajouter des compétences », « Langues et lieux ». */
  sheets: {
    skills: { id: string; name: string }[];
    languages: { code: string; label: string; on: boolean }[];
    places: { name: string; on: boolean }[];
  };
};

const DAY = 86_400_000;

/** « Français », « Lingala »: the name of a language, as a title. */
export function languageLabel(code: string) {
  const name = languageName(code);
  return name.charAt(0).toLocaleUpperCase("fr") + name.slice(1);
}

/** Everything the Carrière tab writes, on the server, from the person's own data. */
export async function careerView(home: CareerHome, now = new Date()): Promise<CareerView> {
  const t = await getTranslations("phoneCareer");
  const tc = await getTranslations("career.cv.template.name");
  const format = await getFormatter();
  const month = (date: Date) => format.dateTime(date, { month: "long", year: "numeric" });
  const day = (date: Date) => format.dateTime(date, { day: "numeric", month: "short" });
  // « aujourd’hui », « hier », « le 3 oct. ».
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const ago = (date: Date) =>
    date >= midnight
      ? t("when.today")
      : date.getTime() >= midnight.getTime() - DAY
        ? t("when.yesterday")
        : t("when.on", { date: day(date) });

  const name = home.user.name;
  const city = home.user.city;
  const title = home.profile.headline;
  const handleText = [t("handle", { handle: handleOf(name) }), title, city]
    .filter(Boolean)
    .join(" · ");

  const experiences: CareerEntry[] = home.profile.experiences.map((item) => {
    const company = shortName(item.company);
    const range = item.endDate
      ? t("when.range", { start: month(item.startDate), end: month(item.endDate) })
      : t("when.since", { start: month(item.startDate) });
    return {
      id: item.id,
      initials: initialsOf(company),
      tone: companyTone(company),
      title: `${item.title}, ${company}`,
      when: item.location ? t("when.place", { when: range, place: item.location }) : range,
      href: `/app/career/profil/experience/${item.id}`,
    };
  });
  const educations: CareerEntry[] = [
    ...home.profile.educations.map((item) => ({
      id: item.id,
      initials: initialsOf(item.school),
      tone: companyTone(item.school),
      title: item.degree,
      when: [
        item.school,
        item.startYear && item.endYear
          ? t("when.range", { start: String(item.startYear), end: String(item.endYear) })
          : item.endYear
            ? String(item.endYear)
            : null,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/app/career/profil/formation/${item.id}`,
    })),
    ...home.attestations.map((item) => ({
      id: item.id,
      initials: "J",
      tone: 0,
      title: item.title,
      when: t("attestation", { date: format.dateTime(item.issuedAt, { dateStyle: "medium" }) }),
      href: `/app/learn/attestations/${item.id}`,
    })),
  ];
  const places = [
    ...home.profile.languages.map((language) => languageLabel(language.code)),
    ...home.profile.desiredLocations,
  ];

  const cvs = home.cvs.map((cv) => {
    const template = tc.has(cv.templateId as "classique")
      ? tc(cv.templateId as "classique")
      : cv.templateId;
    const tags: { text: string; strong?: boolean }[] = [{ text: template }];
    if (cv.isPrimary) tags.push({ text: t("cv.primary"), strong: true });
    else if (cv.uses > 0) tags.push({ text: t("cv.uses", { count: cv.uses }) });
    return {
      id: cv.id,
      title: cv.title,
      line: t("cv.updated", { when: ago(cv.updatedAt) }),
      tags,
      href: `/app/career/cv/${cv.id}`,
      pdf: `/app/career/cv/${cv.id}/pdf`,
      primary: cv.isPrimary,
    };
  });

  const projects = home.projects.map((project, index) => ({
    id: project.id,
    title: project.title,
    line: project.tool
      ? t("portfolio.line", { tool: project.tool, count: project.photos })
      : t("portfolio.lineNoTool", { count: project.photos }),
    featured: project.featured,
    cover: project.cover,
    tone: index % 5,
    href: `/app/career/portfolio/${project.id}`,
  }));

  // « Prochaines étapes »: three things that move the person forward, from their own data.
  const steps: { text: string; href: string }[] = [];
  if (home.suggestion)
    steps.push({
      text: t("progression.step.skill", { skill: home.suggestion.name }),
      href: "/app/career/cv?ajouter=competences",
    });
  if (home.progression.upcoming)
    steps.push({
      text: t("progression.step.interview", {
        date: format.dateTime(home.progression.upcoming.at, { weekday: "long" }),
      }),
      href: `/app/suivi/${home.progression.upcoming.id}`,
    });
  if (home.cvs.length === 0)
    steps.push({ text: t("progression.step.cv"), href: "/app/career/cv?nouveau=1" });
  if (home.projects.length === 0)
    steps.push({ text: t("progression.step.project"), href: "/app/career/portfolio/nouvelle" });
  const missing: Record<string, { text: string; href: string }> = {
    summary: { text: t("progression.step.about"), href: "/app/career/profil/apropos" },
    experience: {
      text: t("progression.step.experience"),
      href: "/app/career/profil/experience/nouvelle",
    },
    education: {
      text: t("progression.step.education"),
      href: "/app/career/profil/formation/nouvelle",
    },
    languages: { text: t("progression.step.languages"), href: "/app/career/cv?ajouter=langues" },
  };
  for (const key of home.missing) if (missing[key]) steps.push(missing[key]!);
  if (home.applications.length === 0)
    steps.push({ text: t("progression.step.apply"), href: "/app/jobs" });
  if (home.progression.courses.all === 0)
    steps.push({ text: t("progression.step.course"), href: "/app/learn" });
  const stages = ["discovery", "building", "ready", "competitive"] as const;
  const stageIndex = home.progression.stage ? stages.indexOf(home.progression.stage) : -1;
  const nextSteps = steps.slice(0, 3);

  const applications = home.applications.map((row) => {
    const company = shortName(row.company);
    const strong = row.status === "interview" || row.status === "offer" || row.status === "hired";
    const note = row.interviewAt
      ? t("applications.interview", {
          date: format
            .dateTime(row.interviewAt, {
              weekday: "long",
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })
            .replace(":00", " h")
            .replace(":", " h "),
        })
      : row.viewedAt
        ? t("applications.viewed", { when: ago(row.viewedAt) })
        : t("applications.waiting");
    return {
      id: row.id,
      href: `/app/suivi/${row.id}`,
      title: row.title,
      line: t("applications.sent", {
        company,
        date: format.dateTime(row.createdAt, { day: "numeric", month: "short" }),
      }),
      initials: initialsOf(company),
      tone: companyTone(company),
      status: t(`applications.status.${row.status}`),
      strong,
      bars: row.bars,
      note,
      noteStrong: Boolean(row.interviewAt),
    };
  });

  const primary = home.cvs.find((cv) => cv.isPrimary) ?? home.cvs[0] ?? null;
  const url = `${siteUrl()}${
    home.portfolioSlug ? `/portfolio/${home.portfolioSlug}` : `/app/personnes/${home.userId}`
  }`;
  const qr = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    color: { dark: "#0b1a1f", light: "#f5efe3" },
  });

  const search: CareerSearchItem[] = [
    ...home.profile.skills.map((skill) => ({
      id: `s-${skill.id}`,
      scope: "profil" as const,
      initials: initialsOf(skill.name),
      title: skill.name,
      kind: t("kind.skill"),
      href: "/app/career/cv",
    })),
    ...(home.profile.summary
      ? [
          {
            id: "about",
            scope: "profil" as const,
            initials: "AP",
            title: t("about"),
            kind: t("kind.about"),
            href: "/app/career/profil/apropos",
          },
        ]
      : []),
    ...experiences.map((item) => ({
      id: `e-${item.id}`,
      scope: "profil" as const,
      initials: "EX",
      title: item.title,
      kind: t("kind.experienceWhen", { when: item.when }),
      href: item.href ?? "/app/career/cv",
    })),
    ...home.profile.educations.map((item) => ({
      id: `f-${item.id}`,
      scope: "profil" as const,
      initials: "FO",
      title: item.degree,
      kind: t("kind.educationWhere", { school: item.school }),
      href: `/app/career/profil/formation/${item.id}`,
    })),
    ...home.attestations.map((item) => ({
      id: `a-${item.id}`,
      scope: "profil" as const,
      initials: "FO",
      title: item.title,
      kind: t("kind.attestation"),
      href: `/app/learn/attestations/${item.id}`,
    })),
    ...home.profile.languages.map((language) => ({
      id: `l-${language.code}`,
      scope: "profil" as const,
      initials: "LA",
      title: languageLabel(language.code),
      kind: t("kind.language"),
      href: "/app/career/cv?ajouter=langues",
    })),
    ...cvs.map((cv) => ({
      id: `c-${cv.id}`,
      scope: "cv" as const,
      initials: "CV",
      title: cv.title,
      kind: t("kind.cv"),
      href: cv.href,
    })),
    ...projects.map((project) => ({
      id: `p-${project.id}`,
      scope: "portfolio" as const,
      initials: "RE",
      title: project.title,
      kind: t("kind.project"),
      href: project.href,
    })),
    ...applications.map((row, index) => ({
      id: `a-${row.id}`,
      scope: "candidatures" as const,
      initials: row.initials,
      title: row.title,
      kind: t("kind.application", { company: shortName(home.applications[index]!.company) }),
      href: row.href,
    })),
    ...(
      [
        ["account", "/app/parametres"],
        ["plan", "/app/abonnement"],
        ["privacy", "/app/parametres/confidentialite"],
        ["notifications", "/app/parametres/notifications"],
        ["help", "/app/compte/aide"],
      ] as const
    ).map(([key, href]) => ({
      id: `r-${key}`,
      scope: "parametres" as const,
      initials: "PA",
      title: t(`setting.${key}`),
      kind: t("kind.setting"),
      href,
    })),
  ];

  return {
    name,
    initials: initialsOf(name),
    tone: toneOf(name, false),
    image: home.user.image,
    banner: home.profile.banner,
    handle: handleText,
    cap: home.profile.targetJob,
    availability: t(`availability.${home.profile.availability}`),
    percent: home.percent,
    plan: home.plan ?? "Free",
    suggestion: home.suggestion
      ? {
          skillId: home.suggestion.id,
          skill: home.suggestion.name,
          text: t("suggestion", { skill: home.suggestion.name, count: home.suggestion.count }),
        }
      : null,
    about: home.profile.summary?.trim() || null,
    skills: home.profile.skills,
    experiences,
    educations,
    places,
    cvs,
    adapt: home.adapt
      ? {
          text: t("cv.adapt", { cv: home.adapt.cvTitle, company: shortName(home.adapt.company) }),
          href: `/app/career/cv/${home.adapt.cvId}?adapter=${home.adapt.jobId}`,
        }
      : null,
    projects,
    progression: {
      stage: home.progression.stage
        ? t(`progression.stage.${home.progression.stage}`)
        : t("progression.noStage"),
      stageIndex,
      next: !home.progression.stage
        ? t("progression.noStageText")
        : home.progression.nextStage
          ? t("progression.next", {
              count: nextSteps.length,
              stage: t(`progression.stage.${home.progression.nextStage}`),
            })
          : t("progression.top"),
      diagnostic: home.progression.stage === null,
      courses: t("progression.coursesValue", {
        done: home.progression.courses.done,
        all: home.progression.courses.all,
      }),
      percent: home.percent,
      applications: home.progression.applications,
      steps: nextSteps,
    },
    applications,
    share: {
      url,
      qr,
      pdf: primary ? `/app/career/cv/${primary.id}/pdf` : null,
      open: home.profile.visibility === "recruiters",
    },
    search,
    sheets: {
      skills: home.addSkills,
      languages: [
        ...new Set([
          ...home.profile.languages.map((item) => item.code),
          ...profileLanguageCodes.slice(0, 8),
        ]),
      ].map((code) => ({
        code,
        label: languageLabel(code),
        on: home.profile.languages.some((item) => item.code === code),
      })),
      places: [
        ...new Set([
          ...home.profile.desiredLocations,
          ...(home.user.city ? [home.user.city] : []),
          ...home.jobCities,
          t("remote"),
        ]),
      ].map((name) => ({ name, on: home.profile.desiredLocations.includes(name) })),
    },
  };
}
