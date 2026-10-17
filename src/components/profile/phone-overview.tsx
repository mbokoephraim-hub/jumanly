import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Icon, type IconName } from "@/components/brand/icon";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { languageName } from "@/lib/dates";
import {
  parseProfileLanguages,
  PROFILE_SUMMARY_MAX,
  type FullProfile,
} from "@/server/services/profile";
import { IntroForm } from "./intro-form";

/** The profile parts opened one at a time on a phone (`?partie=`), also the desktop anchors. */
export const phoneParts = [
  "identite",
  "resume",
  "experiences",
  "formations",
  "competences",
  "langues",
  "preferences",
  "visibilite",
] as const;
export type PhonePart = (typeof phoneParts)[number];

const part = (id: PhonePart) => `/app/profil?partie=${id}`;

function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/** A pill « Ajouter » for what is still empty, as on screen 25. */
function AddPill({ label }: { label: string }) {
  return (
    <span className="flex h-11 shrink-0 items-center rounded-pill bg-blanc px-5 text-[16px] font-semibold ring-1 shadow-douce ring-brume">
      {label}
    </span>
  );
}

/**
 * « Mon profil » on a phone (screen 25): the photo, the six steps of « Construire mon profil »,
 * the title and the bio saved as they are typed, then one row per part of the profile.
 */
export async function PhoneOverview({ profile }: { profile: FullProfile }) {
  const t = await getTranslations("talent.profile.phone");
  const tp = await getTranslations("talent.profile");
  const languages = parseProfileLanguages(profile.languages);
  const steps: {
    key: "photo" | "headline" | "bio" | "experiences" | "skills" | "education";
    done: boolean;
    href: string;
  }[] = [
    { key: "photo", done: Boolean(profile.user.image), href: "/app/profil?photo=1" },
    { key: "headline", done: Boolean(profile.headline), href: "#phone-headline" },
    { key: "bio", done: Boolean(profile.summary), href: "#phone-bio" },
    { key: "experiences", done: profile.experiences.length > 0, href: part("experiences") },
    { key: "skills", done: profile.skills.length > 0, href: part("competences") },
    { key: "education", done: profile.educations.length > 0, href: part("formations") },
  ];
  const done = steps.filter((step) => step.done).length;
  const place = [
    profile.user.city,
    profile.desiredContracts
      .map((contract) => dynamic(tp)(`preferences.contract.${contract}`))
      .join(", "),
  ]
    .filter(Boolean)
    .join(" · ");
  const rows: { id: PhonePart; icon: IconName; title: string; detail: string; empty: boolean }[] = [
    {
      id: "experiences",
      icon: "career",
      title: t("rows.experiences"),
      detail: t("rows.experiencesCount", { count: profile.experiences.length }),
      empty: profile.experiences.length === 0,
    },
    {
      id: "formations",
      icon: "diplome",
      title: t("rows.education"),
      detail: t("rows.educationCount", { count: profile.educations.length }),
      empty: profile.educations.length === 0,
    },
    {
      id: "competences",
      icon: "competence",
      title: t("rows.skills"),
      detail: t("rows.skillsCount", { count: profile.skills.length }),
      empty: profile.skills.length === 0,
    },
    {
      id: "langues",
      icon: "langue",
      title: t("rows.languages"),
      detail:
        languages.map((language) => languageName(language.code)).join(", ") ||
        t("rows.languagesEmpty"),
      empty: languages.length === 0,
    },
    {
      id: "preferences",
      icon: "localisation",
      title: t("rows.place"),
      detail: place || t("rows.placeEmpty"),
      empty: !place,
    },
  ];
  const more: { href: string; icon: IconName; title: string; detail?: string }[] = [
    { href: part("identite"), icon: "profil", title: t("rows.identity") },
    {
      href: part("visibilite"),
      icon: "eye",
      title: t("rows.visibility"),
      detail: tp(`visibility.badge.${profile.visibility}`),
    },
    { href: "/app/profil/import", icon: "cv", title: t("rows.import") },
  ];

  return (
    <div className="flex flex-col gap-6 pb-24 md:hidden">
      <div className="flex flex-col items-center gap-3 pt-2">
        <Link href="/app/profil?photo=1" className="relative" aria-label={t("photo.change")}>
          {profile.user.image ? (
            // The photo is a small square served with a long cache: next/image has nothing to add.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.user.image}
              alt=""
              className="size-[120px] rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="grid size-[120px] place-items-center rounded-full bg-lime text-[40px] font-semibold tracking-[-0.02em] text-sapin"
            >
              {initials(profile.user.name)}
            </span>
          )}
          <span
            aria-hidden
            className="absolute -right-1 bottom-0 grid size-11 place-items-center rounded-full bg-sapin text-lime ring-4 ring-creme"
          >
            <Icon name="edit" className="size-4" />
          </span>
        </Link>
        <Link href="/app/profil?photo=1" className="text-[17px] font-semibold text-feuille-fonce">
          {t("photo.change")}
        </Link>
      </div>

      <section
        aria-labelledby="build-title"
        className="flex flex-col gap-3 rounded-[24px] bg-blanc p-5 shadow-douce"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="build-title" className="text-[18px] font-bold">
            {t("build.title")}
          </h2>
          <p className="text-[15px] text-ardoise">
            {t("build.count", { done, total: steps.length })}
          </p>
        </div>
        <div
          role="progressbar"
          aria-labelledby="build-title"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={done}
          className="h-2 overflow-hidden rounded-full bg-gris-clair"
        >
          <div
            className="h-full rounded-full bg-feuille"
            style={{ width: `${(done / steps.length) * 100}%` }}
          />
        </div>
        <ul className="flex flex-col">
          {steps.map((step) => (
            <li key={step.key} className="flex min-h-14 items-center gap-4">
              {step.done ? (
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-feuille text-blanc">
                  <Icon name="check" className="size-4" />
                  <span className="sr-only">{t("build.done")}</span>
                </span>
              ) : (
                <span aria-hidden className="size-8 shrink-0 rounded-full ring-2 ring-brume" />
              )}
              <span
                className={cx(
                  "min-w-0 flex-1 text-[17px]",
                  step.done && "text-ardoise line-through",
                )}
              >
                {t(`build.step.${step.key}`)}
              </span>
              {!step.done && (
                <Link
                  href={step.href}
                  aria-label={`${t("build.add")} · ${t(`build.step.${step.key}`)}`}
                >
                  <AddPill label={t("build.add")} />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <IntroForm
        headline={profile.headline ?? ""}
        summary={profile.summary ?? ""}
        max={PROFILE_SUMMARY_MAX}
        labels={{
          headline: t("headline.label"),
          headlinePlaceholder: t("headline.placeholder"),
          bio: t("bio.label"),
          bioHint: t("bio.hint"),
          bioPlaceholder: t("bio.placeholder"),
          counter: t.raw("bio.counter") as string,
          ai: t("bio.ai"),
          aiSoon: t("bio.aiSoon"),
          saved: t("status.saved"),
          saving: t("status.saving"),
          error: t("status.error"),
          idle: t("status.idle"),
        }}
        preview={
          <Link
            href={part("visibilite")}
            className="flex h-14 items-center justify-center rounded-pill bg-gradient-principal px-4 text-center text-[16px] leading-5 font-semibold text-blanc shadow-[var(--jm-ombre-principal)]"
          >
            {t("preview")}
          </Link>
        }
      />

      <nav aria-label={t("rows.label")} className="flex flex-col gap-4">
        <ul className="overflow-hidden rounded-[24px] bg-blanc shadow-douce">
          {rows.map((row, index) => (
            <li key={row.id} className={cx(index > 0 && "border-t border-brume")}>
              <Link href={part(row.id)} className="flex min-h-[84px] items-center gap-4 px-5 py-3">
                <span
                  aria-hidden
                  className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-creme"
                >
                  <Icon name={row.icon} className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[17px] font-semibold">{row.title}</span>
                  <span className="truncate text-[15px] text-ardoise">{row.detail}</span>
                </span>
                {row.empty ? (
                  <AddPill label={t("build.add")} />
                ) : (
                  <Icon name="chev-r" className="size-5 shrink-0 text-ardoise" />
                )}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="overflow-hidden rounded-[24px] bg-blanc shadow-douce">
          {more.map((row, index) => (
            <li key={row.href} className={cx(index > 0 && "border-t border-brume")}>
              <Link href={row.href} className="flex min-h-16 items-center gap-4 px-5 py-3">
                <Icon name={row.icon} className="size-5 shrink-0" />
                <span className="min-w-0 flex-1 text-[16px] font-semibold">{row.title}</span>
                {row.detail && (
                  <span className="truncate text-[14px] text-ardoise">{row.detail}</span>
                )}
                <Icon name="chev-r" className="size-5 shrink-0 text-ardoise" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
