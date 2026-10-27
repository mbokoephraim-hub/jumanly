import "server-only";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import type { Messages } from "next-intl";
import type { ReactNode } from "react";
import { pickMessages } from "@/i18n/client-messages";
import { countryCode, countryName, flagOf, timeZoneOf } from "@/lib/countries";
import {
  colorOf,
  familyShares,
  PROFILE_COLORS,
  PROFILE_PALETTE,
  type ProfileColor,
} from "@/lib/profile-colors";
import { handleFromName as handleFrom, SOCIAL_KINDS } from "@/lib/social-links";
import type { PersonProfile } from "@/server/services/person-profile";
import { initialsOf, toneOf } from "../fil/data";
import type { ProfileView } from "./data";

const MONTH = 30.44 * 86_400_000;
const MINUTE = 60_000;

/** The texts a person's profile needs in the browser (plus those of the space around it). */
export async function ProfileTexts({
  children,
  extra = [],
}: {
  children: ReactNode;
  extra?: (keyof Messages)[];
}) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      messages={pickMessages(messages, [
        "phoneProfile",
        "phoneExplorer",
        "phoneFil",
        "phone",
        ...extra,
      ])}
    >
      {children}
    </NextIntlClientProvider>
  );
}

/** The drawn banner: a dark ground and its motif, in the colour of the person's field. */
const BANNER_GROUND: Record<ProfileColor, string> = {
  lime: "#0F3F37",
  menthe: "#0E4A3F",
  ambre: "#5A3D0B",
  ciel: "#1E4E79",
  corail: "#6B2A22",
  lilas: "#3B2C66",
  sable: "#4A3F2A",
  rose: "#5E2342",
};

/** Bars of a language (5 = mother tongue or fluent). */
const LANGUAGE_BARS = { native: 5, fluent: 5, professional: 4, intermediate: 3, basic: 2 } as const;

/** The colour of each family, never twice the same in the bar: the next free one on a clash. */
export function distinctColors(names: string[]): ProfileColor[] {
  const used = new Set<ProfileColor>();
  return names.map((name) => {
    let color = colorOf(name);
    for (let step = 0; used.has(color) && step < PROFILE_COLORS.length; step++)
      color = PROFILE_COLORS[(PROFILE_COLORS.indexOf(color) + 1) % PROFILE_COLORS.length]!;
    used.add(color);
    return color;
  });
}

/** « Étudie environ 25 dossiers… »: one line of the description, without its bullet. */
export function pointsOf(description: string) {
  return description
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*·–]\s*/, "").trim())
    .filter(Boolean);
}

/**
 * Turns what the service read into the profile's view: the texts of `phoneProfile`, the colours
 * of the skills, the flag and local time, the activity, the achievements and the files.
 */
export async function profileView(
  person: PersonProfile,
  options: {
    now: Date;
    /** The CV sent with the application (vue recruteur). */
    cv?: { href: string } | null;
  },
): Promise<ProfileView> {
  const t = await getTranslations("phoneProfile");
  const tl = await getTranslations("talent.profile");
  const tc = await getTranslations("forMe.category");
  const tx = await getTranslations("phoneCareer.form.experienceType");
  const format = await getFormatter();
  const { now } = options;

  // ─── Who ───────────────────────────────────────────────────────────────────────
  const family = (category: string) => {
    try {
      return tc(category as "data");
    } catch {
      return category;
    }
  };
  const shares = familyShares(person.skills.map((skill) => skill.category));
  const recruiter = person.recruiter;
  const domain = recruiter
    ? (recruiter.organization?.name ?? null)
    : (person.sector ?? (shares[0] ? family(shares[0].family) : null));
  const bannerKey = colorOf(domain ?? person.name);
  const code = countryCode(person.country);
  const country = code ? countryName(code) : null;
  const zone = code ? timeZoneOf(code) : null;
  const time = zone
    ? (() => {
        const parts = new Intl.DateTimeFormat("fr", {
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
          timeZone: zone,
        }).formatToParts(now);
        const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
        return t("time", { hour: String(Number(part("hour"))), minute: part("minute") });
      })()
    : null;
  const place =
    code || person.city
      ? {
          flag: code ? flagOf(code) : "",
          flagLabel: country ? t("flag", { country }) : "",
          text:
            person.city && country
              ? t("place", { city: person.city, country })
              : (person.city ?? country ?? ""),
          time,
        }
      : null;

  const elapsed = person.lastSeen ? now.getTime() - person.lastSeen.getTime() : null;
  const activity =
    elapsed === null || elapsed < 0
      ? null
      : elapsed < 5 * MINUTE
        ? t("activity.now")
        : elapsed < 60 * MINUTE
          ? t("activity.minutes", { count: Math.round(elapsed / MINUTE) })
          : elapsed < 24 * 60 * MINUTE
            ? t("activity.hours", { count: Math.round(elapsed / (60 * MINUTE)) })
            : elapsed < 7 * 24 * 60 * MINUTE
              ? t("activity.days", { count: Math.round(elapsed / (24 * 60 * MINUTE)) })
              : null;

  const socials: ProfileView["socials"] = [];
  for (const kind of ["linkedin", "instagram"] as const)
    if (person.socials[kind])
      socials.push({ kind, href: person.socials[kind]!, label: t(`social.${kind}`) });
  if (person.email)
    socials.push({ kind: "email", href: `mailto:${person.email}`, label: t("social.email") });
  for (const kind of SOCIAL_KINDS.filter((item) => item !== "linkedin" && item !== "instagram"))
    if (person.socials[kind])
      socials.push({ kind, href: person.socials[kind]!, label: t(`social.${kind}`) });

  const common =
    person.common.count > 0
      ? {
          people: person.common.people.map((item, index) => ({
            initials: initialsOf(item.fullName),
            image: item.image,
            color: [PROFILE_PALETTE.ambre, PROFILE_PALETTE.menthe, PROFILE_PALETTE.lilas][index]!,
          })),
          line:
            person.common.count === 1
              ? t("common.one", { a: person.common.people[0]?.name ?? "" })
              : person.common.count === 2
                ? t("common.two", {
                    a: person.common.people[0]?.name ?? "",
                    b: person.common.people[1]?.name ?? "",
                  })
                : t("common.many", {
                    a: person.common.people[0]?.name ?? "",
                    b: person.common.people[1]?.name ?? "",
                    count: person.common.count - 2,
                  }),
        }
      : null;

  // ─── À propos ────────────────────────────────────────────────────────────────────
  const skills = person.skills.map((skill) => ({
    name: skill.name,
    color: PROFILE_PALETTE[colorOf(skill.name)],
    verified: skill.verified,
  }));
  const month = (date: Date, withYear = true) =>
    format.dateTime(date, {
      month: "short",
      ...(withYear ? { year: "numeric" } : {}),
      timeZone: "UTC",
    });
  const duration = (start: Date, end: Date | null) => {
    const total = Math.max(1, Math.round(((end ?? now).getTime() - start.getTime()) / MONTH));
    const years = Math.floor(total / 12);
    const months = total % 12;
    return [
      years > 0 ? t("years", { count: years }) : null,
      months > 0 ? t("months", { count: months }) : null,
    ]
      .filter(Boolean)
      .join(" ");
  };
  const experiences = person.experiences.map((item) => {
    const sameYear =
      item.endDate !== null && item.endDate.getUTCFullYear() === item.startDate.getUTCFullYear();
    const span = item.endDate
      ? t("span", { start: month(item.startDate, !sameYear), end: month(item.endDate) })
      : t("span", { start: month(item.startDate), end: t("today") });
    return {
      id: item.id,
      initials: initialsOf(item.company),
      color: PROFILE_PALETTE[colorOf(item.company)],
      title: item.title,
      current: item.endDate === null,
      company: item.company,
      type: tx(item.type),
      dates: [span, duration(item.startDate, item.endDate), item.location]
        .filter(Boolean)
        .join(" · "),
      points: pointsOf(item.description),
    };
  });
  const educations = person.educations.map((item) => ({
    id: item.id,
    title: item.degree,
    line: [item.school, item.endYear ? String(item.endYear) : null].filter(Boolean).join(" · "),
  }));
  const languageName = new Intl.DisplayNames(["fr"], { type: "language" });
  const languages = person.languages.map((item) => {
    let name = item.code;
    try {
      name = languageName.of(item.code) ?? item.code;
    } catch {}
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      level: LANGUAGE_BARS[item.level],
      label: tl(`languages.level.${item.level}`),
    };
  });

  // ─── Réalisations et portfolio ─────────────────────────────────────────────────────
  const works: ProfileView["works"] = [
    ...person.projects.map((project) => {
      const image = project.files.find((file) => file.type.startsWith("image/"));
      return {
        id: project.id,
        kind: t("work.project"),
        title: project.title,
        cover: image ? `/api/projets/${project.id}/${image.index}` : null,
        color: BANNER_GROUND[colorOf(project.title)],
        href: null,
        skills: project.skills.slice(0, 3).map((name) => ({
          name,
          color: PROFILE_PALETTE[colorOf(name)],
        })),
      };
    }),
    ...person.certificates.map((certificate) => ({
      id: certificate.id,
      kind: t("work.certificate"),
      title: certificate.courseTitle,
      cover: null,
      color: BANNER_GROUND[colorOf(certificate.courseTitle)],
      href: `/attestations/${certificate.code}`,
      skills: certificate.skills.slice(0, 3).map((name) => ({
        name,
        color: PROFILE_PALETTE[colorOf(name)],
      })),
    })),
  ];
  const size = (bytes: number) =>
    t("file.size", { size: format.number(bytes / 1_048_576, { maximumFractionDigits: 1 }) });
  const host = (href: string) => {
    try {
      return new URL(href).hostname.replace(/^www\./, "");
    } catch {
      return href;
    }
  };
  const files: ProfileView["files"] = [
    ...person.projects.flatMap((project) =>
      project.files
        .filter((file) => file.type === "application/pdf")
        .map((file) => ({
          id: `${project.id}-${file.index}`,
          badge: t("file.pdfBadge"),
          title: file.name.replace(/\.pdf$/i, ""),
          line: t("file.pdf", { size: size(file.size) }),
          href: `/api/projets/${project.id}/${file.index}`,
          color: PROFILE_PALETTE.ambre,
        })),
    ),
    ...person.projects.flatMap((project) =>
      project.link
        ? [
            {
              id: `${project.id}-lien`,
              badge: t("file.linkBadge"),
              title: project.title,
              line: t("file.link", { host: host(project.link) }),
              href: project.link,
              color: PROFILE_PALETTE.ciel,
            },
          ]
        : [],
    ),
    ...(options.cv
      ? [
          {
            id: "cv",
            badge: t("file.cvBadge"),
            title: t("file.cv", { name: person.name }),
            line: t("file.cvLine"),
            href: options.cv.href,
            color: PROFILE_PALETTE.ciel,
          },
        ]
      : []),
    ...(person.portfolio
      ? [
          {
            id: "portfolio",
            badge: t("file.webBadge"),
            title: t("file.portfolioTitle", { slug: person.portfolio }),
            line: t("file.portfolio"),
            href: `/portfolio/${person.portfolio}`,
            color: PROFILE_PALETTE.lime,
          },
        ]
      : []),
  ];

  return {
    id: person.id,
    name: person.name,
    first: person.firstName,
    initials: initialsOf(person.name),
    tone: toneOf(person.name, false),
    image: person.image,
    banner: person.banner,
    bannerColor: { background: BANNER_GROUND[bannerKey], motif: PROFILE_PALETTE[bannerKey] },
    domain,
    ring: skills.slice(0, 5).map((skill) => skill.color),
    online: elapsed !== null && elapsed >= 0 && elapsed < 5 * MINUTE,
    socials,
    verified: person.verified,
    handle: t("handle", { handle: person.handle ?? handleFrom(person.name) }),
    place,
    bio: recruiter?.headline ?? person.headline,
    about: person.about ? { title: person.aboutTitle, text: person.about } : null,
    connections: person.connections,
    contract: person.contract
      ? tl(`preferences.contract.${person.contract}` as "preferences.contract.cdi")
      : null,
    activity,
    common,
    skills,
    skillsCount: t("skillsCount", { count: skills.length }),
    families: distinctColors(shares.map((item) => item.family)).map((color, index) => ({
      label: t("family", { label: family(shares[index]!.family), share: shares[index]!.share }),
      color: PROFILE_PALETTE[color],
      share: shares[index]!.share,
    })),
    experiences,
    experiencesCount: t("experiencesCount", { count: experiences.length }),
    educations,
    languages,
    works,
    files,
    link: person.link,
    conversationId: person.conversationId,
    recruiter: recruiter
      ? {
          post: recruiter.jobTitle,
          organization: recruiter.organization,
          hiringNow: recruiter.hiringNow,
          seeking: recruiter.seeking,
          domains: recruiter.domains,
          offers: t("recruiter.offers", { count: recruiter.offers }),
        }
      : null,
  };
}
