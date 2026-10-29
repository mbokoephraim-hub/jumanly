import "server-only";
import QRCode from "qrcode";
import { getFormatter, getTranslations } from "next-intl/server";
import { accentHex } from "@/features/cv/render/palette";
import { languageName } from "@/lib/dates";
import { colorOf, PROFILE_PALETTE, type ProfileColor } from "@/lib/profile-colors";
import { profileLanguageCodes } from "@/server/services/profile-view";
import { siteUrl } from "@/lib/seo";
import type { CareerHome, PlanTier } from "@/server/services/career-phone";
import type { ProfileLanguage } from "@/server/services/profile";
import { handleFromName } from "@/lib/social-links";
import { companyTone } from "../explorer/data";
import { initialsOf, shortName, toneOf } from "../fil/data";
import type { ProfileView } from "../profil/data";
import { profileView } from "../profil/server";

const fileKind = (type: string) => (type === "docx" ? "docx" : type === "image" ? "image" : "pdf");

/** « @grace.mbuyi »: the name in small letters, without accents, joined by dots. */
export const handleOf = handleFromName;

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

export const AVAILABILITIES = ["open", "listening", "not_looking"] as const;
export type Availability = (typeof AVAILABILITIES)[number];

/** The grounds of the drawn tiles of the portfolio (maquette Carriere.dc.html, `real`). */
const TILE_GROUNDS = ["#0F3F37", "#1E4E79", "#3B2C66", "#5A3D0B", "#6B2A22"] as const;

export type CareerView = {
  /** The head, the person's own profile as others see it (docs/carriere-v3, captures 01). */
  person: ProfileView;
  /** The name of the person's plan: the label of its icon after the name. */
  planTag: string | null;
  /** The paid level of the plan (1 to 3), one icon each; 0 (free) shows none. */
  planTier: PlanTier;
  /** « CDI, Stage »: the contracts the person looks for. */
  contracts: string | null;
  availabilityKey: Availability;
  availabilities: { key: Availability; label: string }[];
  /** « Profil complété » card: Orbi's next suggestion, « Ajouter » or a link. */
  completion: { text: string | null; href: string | null };
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
  /** « Formation »: studies and Jumanly attestations (tagged « Jumanly »). */
  educationRows: { id: string; title: string; line: string; href: string; jumanly: boolean }[];
  places: string[];
  cvs: {
    id: string;
    title: string;
    line: string;
    tags: { text: string; strong?: boolean }[];
    href: string;
    pdf: string;
    primary: boolean;
    /** « Modèle Moderne · modifié hier ». */
    meta: string;
    score: number;
    /** The CV's accent colour, for its drawn thumbnail. */
    color: string;
    /** An imported CV kept as its file: read and saved as it is, not edited. */
    file: boolean;
    /** The colour the talent gave it in the library (Ephraïm, 29/10). */
    tag: { key: ProfileColor; hex: string } | null;
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
    ground: string;
    skills: { name: string; color: string }[];
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
    /** The ring of « candidatures », in percent (five applications fill it). */
    applicationsPercent: number;
    coursesPercent: number;
    steps: { text: string; title: string; detail: string; href: string }[];
  };
  /** « Mes entraînements » (demande du 29/10/2026): preparations and the simulations' follow-up. */
  training: {
    open: boolean;
    applied: boolean;
    plan: boolean;
    planName: string | null;
    start: string;
    preparations: { key: string; title: string; detail: string; href: string; locked: boolean }[];
    followUp: {
      count: string;
      last: number;
      change: string | null;
      criteria: { key: string; label: string; score: number }[];
      report: string;
    } | null;
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
    /** « Baobab Fintech · il y a 6 j ». */
    meta: string;
    score: number | null;
    /** 0 Envoyée, 1 Vue, 2 Entretien, 3 Réponse. */
    step: number;
    /** « Entretien jeudi 29 oct. à 10 h · préparez-vous avec Orbi ». */
    interview: string | null;
    /** The answer once given (« Non retenue », « Retirée »…), shown on the card. */
    answer: string | null;
  }[];
  share: { url: string; qr: string; pdf: string | null; open: boolean };
  search: CareerSearchItem[];
  /** The two sheets of the profile: « Ajouter des compétences », « Langues et lieux ». */
  sheets: {
    skills: { id: string; name: string }[];
    languages: { code: string; label: string; on: boolean; level?: ProfileLanguage["level"] }[];
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
  const tp = await getTranslations("phoneInterview");
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

  // « il y a 6 j », « hier », « aujourd’hui ».
  const daysAgo = (date: Date) => {
    if (date >= midnight) return t("when.today");
    const days = Math.ceil((midnight.getTime() - date.getTime()) / DAY);
    return days <= 1 ? t("when.yesterday") : t("when.daysAgo", { days });
  };
  // « 10 h », « 14 h 30 ».
  const hourOf = (date: Date) => {
    const [hour = "0", minute = "00"] = format
      .dateTime(date, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .split(/\D+/);
    return minute === "00"
      ? t("when.hour", { hour: Number(hour) })
      : t("when.hourMinute", { hour: Number(hour), minute });
  };

  const name = home.user.name;
  const city = home.user.city;
  const title = home.profile.headline;
  const handleText = [t("handle", { handle: home.profile.handle ?? handleOf(name) }), title, city]
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
  const educationRows: CareerView["educationRows"] = [
    ...home.profile.educations.map((item) => ({
      id: item.id,
      title: item.degree,
      line: [
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
      jumanly: false,
    })),
    ...home.attestations.map((item) => ({
      id: item.id,
      title: item.title,
      line: t("attestation", { date: format.dateTime(item.issuedAt, { dateStyle: "medium" }) }),
      href: `/app/learn/attestations/${item.id}`,
      jumanly: true,
    })),
  ];
  const places = [
    ...home.profile.languages.map((language) => languageLabel(language.code)),
    ...home.profile.desiredLocations,
  ];

  // « modifié hier », « 3 oct. ».
  const cvWhen = (date: Date) =>
    date >= midnight
      ? t("cv.changedToday")
      : date.getTime() >= midnight.getTime() - DAY
        ? t("cv.changedYesterday")
        : day(date);
  const accentOf = (style: unknown) => {
    const code = (style as { accent?: unknown } | null)?.accent;
    return (typeof code === "string" && accentHex(code)) || "#0F3F37";
  };
  const cvs = home.cvs.map((cv) => {
    const template = tc.has(cv.templateId as "classique")
      ? tc(cv.templateId as "classique")
      : cv.templateId;
    const tags: { text: string; strong?: boolean }[] = [
      { text: cv.fileType ? t("cv.imported") : template },
    ];
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
      meta: cv.fileType
        ? t("cv.metaFile", {
            kind: t(`cv.fileKind.${fileKind(cv.fileType)}`),
            when: cvWhen(cv.updatedAt),
          })
        : t("cv.meta", { template, when: cvWhen(cv.updatedAt) }),
      score: cv.score,
      color: accentOf(cv.style),
      file: Boolean(cv.fileType),
      tag:
        cv.colorTag && cv.colorTag in PROFILE_PALETTE
          ? {
              key: cv.colorTag as ProfileColor,
              hex: PROFILE_PALETTE[cv.colorTag as ProfileColor],
            }
          : null,
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
    ground:
      project.featured && project.cover ? "#F2EDE5" : TILE_GROUNDS[index % TILE_GROUNDS.length]!,
    skills: project.skills.map((name) => ({ name, color: PROFILE_PALETTE[colorOf(name)] })),
  }));

  // « Prochaines étapes »: three things that move the person forward, from their own data.
  type Step = { text: string; title: string; detail: string; href: string };
  const step = (key: string, href: string, values: Record<string, string | number> = {}): Step => {
    const title = t(`progression.step.${key}` as "progression.step.cv", values);
    return {
      text: title,
      title,
      detail: t(`progression.stepText.${key}` as "progression.stepText.cv", values),
      href,
    };
  };
  const steps: Step[] = [];
  if (home.suggestion)
    steps.push(
      step("skill", "/app/profil?ajouter=competences", {
        skill: home.suggestion.name,
        count: home.suggestion.count,
      }),
    );
  if (home.projects.length === 0) steps.push(step("project", "/app/career/portfolio/nouvelle"));
  if (home.progression.upcoming)
    steps.push(
      step(
        "interview",
        `/app/career/entretiens/nouveau?candidature=${home.progression.upcoming.id}`,
        { date: format.dateTime(home.progression.upcoming.at, { weekday: "long" }) },
      ),
    );
  if (home.cvs.length === 0) steps.push(step("cv", "/app/career/cv/nouveau"));
  const missing: Record<string, Step> = {
    summary: step("about", "/app/career/profil/apropos"),
    experience: step("experience", "/app/career/profil/experience/nouvelle"),
    education: step("education", "/app/career/profil/formation/nouvelle"),
    languages: step("languages", "/app/profil?ajouter=langues"),
  };
  for (const key of home.missing) if (missing[key]) steps.push(missing[key]!);
  if (home.applications.length === 0) steps.push(step("apply", "/app/jobs"));
  if (home.progression.courses.all === 0) steps.push(step("course", "/app/learn"));
  const stages = ["discovery", "building", "ready", "competitive"] as const;
  const stageIndex = home.progression.stage ? stages.indexOf(home.progression.stage) : -1;
  const nextSteps = steps.slice(0, 3);

  // « Mes entraînements »: the simulation opens on the application to prepare.
  const training = home.training;
  const simHref = (applicationId: string | null) =>
    `/app/career/entretiens/nouveau${applicationId ? `?candidature=${applicationId}` : ""}`;
  const criterionLabel = (key: string) =>
    tp(`report.criterion.${key}` as "report.criterion.clarity");
  const preparations: CareerView["training"]["preparations"] = training.preparations.map((item) => {
    if (item.kind === "interview")
      return {
        key: `i-${item.applicationId}`,
        title: t("training.prep.interview", { title: item.title }),
        detail: item.at
          ? t("training.prep.interviewDate", {
              company: shortName(item.company),
              date: format.dateTime(item.at, { weekday: "long", day: "numeric", month: "short" }),
            })
          : t("training.prep.interviewText", { company: shortName(item.company) }),
        href: simHref(item.applicationId),
        locked: !training.access.open,
      };
    if (item.kind === "criterion")
      return {
        key: `c-${item.criterion}`,
        title: t("training.prep.criterion", { criterion: criterionLabel(item.criterion) }),
        detail: t(`training.prep.criterionText.${item.criterion}`, { score: item.score }),
        href: simHref(item.applicationId),
        locked: !training.access.open,
      };
    return {
      key: `s-${item.skill}`,
      title: t("training.prep.skill", { skill: item.skill }),
      detail: t("training.prep.skillText", { job: item.job }),
      href: `/app/learn/rechercher?q=${encodeURIComponent(item.skill)}`,
      locked: false,
    };
  });
  if (!training.access.applied)
    preparations.unshift({
      key: "apply",
      title: t("training.prep.apply"),
      detail: t("training.prep.applyText"),
      href: "/app/jobs",
      locked: false,
    });
  const followUp = training.followUp;

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
      meta: t("applications.meta", { company, when: daysAgo(row.createdAt) }),
      score: row.score,
      step: Math.max(0, Math.min(3, row.bars - 1)),
      answer: ["notSelected", "withdrawn", "jobClosed", "hired", "offer"].includes(row.status)
        ? t(`applications.status.${row.status}`)
        : null,
      interview: row.interviewAt
        ? t("applications.interviewNote", {
            day: format.dateTime(row.interviewAt, {
              weekday: "long",
              day: "numeric",
              month: "short",
            }),
            time: hourOf(row.interviewAt),
          })
        : null,
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
      href: "/app/profil",
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
      href: item.href ?? "/app/profil",
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
      href: "/app/profil?ajouter=langues",
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

  const tl = await getTranslations("talent.profile.preferences.contract");
  const contract = (code: string) => (tl.has(code as "cdi") ? tl(code as "cdi") : code);
  const firstMissing = home.missing.map((key) => missing[key]).find(Boolean) ?? null;
  const person = await profileView(home.person!, { now });

  return {
    person,
    planTag: home.plan,
    planTier: home.planTier,
    contracts:
      home.profile.desiredContracts.length > 0
        ? home.profile.desiredContracts.slice(0, 3).map(contract).join(", ")
        : null,
    availabilityKey: home.profile.availability,
    availabilities: AVAILABILITIES.map((key) => ({ key, label: t(`availability.${key}`) })),
    completion: home.suggestion
      ? {
          text: t("completion.skill", {
            skill: home.suggestion.name,
            count: home.suggestion.count,
          }),
          href: null,
        }
      : firstMissing
        ? { text: firstMissing.title, href: firstMissing.href }
        : { text: home.percent >= 100 ? t("completion.done") : null, href: null },
    educationRows,
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
      applicationsPercent: Math.min(100, home.progression.applications * 20),
      coursesPercent:
        home.progression.courses.all === 0
          ? 0
          : Math.round((100 * home.progression.courses.done) / home.progression.courses.all),
      steps: nextSteps,
    },
    training: {
      open: training.access.open,
      applied: training.access.applied,
      plan: training.access.plan,
      planName: training.access.planName,
      start: simHref(training.applicationId),
      preparations,
      followUp: followUp
        ? {
            count: t("training.follow.count", { count: followUp.count }),
            last: followUp.last,
            change:
              followUp.change === null
                ? null
                : followUp.change > 0
                  ? t("training.follow.up", { points: followUp.change })
                  : followUp.change < 0
                    ? t("training.follow.down", { points: followUp.change })
                    : t("training.follow.same"),
            criteria: followUp.criteria.map((item) => ({
              key: item.key,
              label: criterionLabel(item.key),
              score: item.score,
            })),
            report: `/app/career/entretiens/${followUp.lastId}?depuis=historique`,
          }
        : null,
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
        level: home.profile.languages.find((item) => item.code === code)?.level,
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
