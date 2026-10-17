import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/brand/icon";
import { PhoneTitle } from "@/components/layout/phone-title";
import { PhoneOverview, phoneParts, type PhonePart } from "@/components/profile/phone-overview";
import { PhotoEditor } from "@/components/profile/photo-editor";
import { Pattern } from "@/components/site/marketing";
import {
  Alert,
  Button,
  Checkbox,
  ProgressRing,
  Select,
  TextArea,
  TextField,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import { myCertificates } from "@/server/services/learn";
import { countryOptions } from "@/config/countries";
import { dynamic } from "@/i18n/dynamic";
import { languageName } from "@/lib/dates";
import {
  addLanguage,
  addSkill,
  deleteEducation,
  deleteExperience,
  removeLanguage,
  removeSkill,
  saveEducation,
  saveExperience,
  saveIdentity,
  savePreferences,
  saveSummary,
  saveVisibility,
} from "@/server/actions/profile";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  cefrLevels,
  completeness,
  contractPreferences,
  dateToMonth,
  getFullProfile,
  languageLevels,
  parseProfileLanguages,
  PROFILE_SKILLS_MAX,
  PROFILE_SUMMARY_MAX,
  skillLevelKeys,
  skillProofs,
  type FullProfile,
} from "@/server/services/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.profile");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** Languages offered in the form: the most useful on the continent first. */
const languageCodes = [
  "fr",
  "en",
  "ln",
  "sw",
  "pt",
  "ar",
  "es",
  "de",
  "zh",
  "wo",
  "yo",
  "ha",
  "am",
  "kg",
  "lu",
  "rw",
];

const experienceTypes = ["job", "internship", "freelance", "volunteer", "entrepreneur"] as const;
const educationLevels = [
  "none",
  "secondary",
  "vocational",
  "bachelor",
  "master",
  "doctorate",
] as const;

/** « Mon profil professionnel » (partie 07 § 3): every section, saved one at a time. */
export default async function ProfilePage({ searchParams }: PageProps<"/app/profil">) {
  const params = await searchParams;
  const user = await requireUser("/app/profil");
  const t = await getTranslations();
  const profile = await getFullProfile(db, user.id);
  const { percent, missing } = completeness(profile);
  const sectionNames: Record<string, string> = {
    identity: t("talent.profile.identity.title"),
    summary: t("talent.profile.summary.title"),
    experience: t("talent.profile.experience.title"),
    education: t("talent.profile.education.title"),
    skills: t("talent.profile.skills.title"),
    languages: t("talent.profile.languages.title"),
    preferences: t("talent.profile.preferences.title"),
  };
  const sectionAnchors: Record<string, string> = {
    identity: "#identite",
    summary: "#resume",
    experience: "#experiences",
    education: "#formations",
    skills: "#competences",
    languages: "#langues",
    preferences: "#preferences",
  };
  const notice = { section: one(params.section), ok: one(params.ok), error: one(params.erreur) };
  // Prompt 6 (screen 25): on a phone the overview comes first and each part opens alone; after a
  // save the part just saved stays open. The desktop keeps every part on one page.
  const isPart = (value?: string): value is PhonePart => phoneParts.includes(value as PhonePart);
  const partie = isPart(one(params.partie))
    ? (one(params.partie) as PhonePart)
    : isPart(notice.section)
      ? notice.section
      : undefined;
  const only = (...ids: PhonePart[]) => (partie && ids.includes(partie) ? "" : "max-md:hidden");
  const partTitles: Record<PhonePart, string> = {
    identite: t("talent.profile.identity.title"),
    resume: t("talent.profile.summary.title"),
    experiences: t("talent.profile.experience.title"),
    formations: t("talent.profile.education.title"),
    competences: t("talent.profile.skills.title"),
    langues: t("talent.profile.languages.title"),
    preferences: t("talent.profile.availability.title"),
    visibilite: t("talent.profile.tabs.visibility"),
  };
  const photoOpen = one(params.photo) === "1";
  const photoError = one(params.erreur);

  const visibilityChip = {
    private: "bg-gris-clair",
    recruiters: "bg-menthe-claire text-menthe-texte",
    anonymous: "bg-[#FBF6C9]",
  }[profile.visibility];

  return (
    <div className="flex flex-col gap-5">
      {partie ? (
        <PhoneTitle
          back="/app/profil"
          backLabel={t("talent.profile.phone.backProfile")}
          title={partTitles[partie]}
        />
      ) : (
        <PhoneTitle
          back="/app"
          backLabel={t("talent.profile.phone.back")}
          title={t("talent.profile.phone.title")}
        />
      )}
      {(notice.ok === "photo" || notice.ok === "photo-retiree") && (
        <Alert
          tone="success"
          title={t(
            notice.ok === "photo"
              ? "talent.profile.phone.photo.saved"
              : "talent.profile.phone.photo.removed",
          )}
        />
      )}
      {!partie && <PhoneOverview profile={profile} />}
      {/* Admin v4, étape 3 (inspired by Patreon's profile pages): a thin cover, the avatar, the
          name and one line of facts, then the parts of the profile as horizontal tabs. */}
      <section
        aria-labelledby="profil-titre"
        className="overflow-hidden rounded-[24px] bg-blanc ring-1 ring-sapin/6 max-md:hidden"
      >
        <div aria-hidden className="jm-profile-cover h-20 lg:h-24" />
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3 px-5 pt-3 lg:px-6">
          <Link
            href="/app/profil?photo=1"
            aria-label={t("talent.profile.phone.photo.change")}
            className="-mt-12 shrink-0 self-start rounded-full ring-4 ring-blanc"
          >
            {profile.user.image ? (
              // A small square served with a long cache: next/image has nothing to add.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.user.image}
                alt=""
                className="size-[76px] rounded-full object-cover lg:size-[84px]"
              />
            ) : (
              <span
                aria-hidden
                className="grid size-[76px] place-items-center rounded-full bg-lime text-[24px] font-semibold text-sapin lg:size-[84px]"
              >
                {initials(user.name)}
              </span>
            )}
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h1 id="profil-titre" className="text-[12.5px] leading-4 text-ardoise">
              {t("talent.profile.title")}
            </h1>
            <p className="text-[22px] leading-7 font-semibold tracking-[-0.02em] lg:text-[26px] lg:leading-8">
              {user.name}
            </p>
            {profile.headline && (
              <p className="text-[13.5px] leading-5 text-ardoise">{profile.headline}</p>
            )}
          </div>
          <a
            href="#apercu"
            className="flex h-10 items-center gap-2 rounded-pill bg-blanc px-4 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40"
          >
            <Icon name="eye" className="size-4" />
            {t("talent.profile.preview.text")}
          </a>
        </div>
        <p className="flex flex-wrap items-center gap-2 px-5 pt-3 text-xs font-semibold lg:px-6">
          {[profile.user.city, profile.user.country].some(Boolean) && (
            <span className="flex items-center gap-1.5 text-ardoise">
              <Icon name="localisation" className="size-3.5" />
              {[profile.user.city, profile.user.country].filter(Boolean).join(", ")}
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-pill bg-lime-clair px-3 py-1.5 text-up-texte">
            <Icon name="check" className="size-3.5" />
            {t("talent.profile.autosaved")}
          </span>
          <span
            className={cx("flex items-center gap-1.5 rounded-pill px-3 py-1.5", visibilityChip)}
          >
            <Icon name="eye" className="size-3.5" />
            {t(`talent.profile.visibility.badge.${profile.visibility}`)}
          </span>
        </p>
        <nav aria-label={t("talent.profile.tabs.aria")} className="mt-3 border-t border-sapin/8">
          <ul className="jm-section-tabs flex gap-1 overflow-x-auto px-3 py-1.5 lg:px-4">
            {(
              [
                ["#identite", t("talent.profile.identity.title")],
                ["#resume", sectionNames.summary],
                ["#experiences", sectionNames.experience],
                ["#formations", sectionNames.education],
                ["#competences", sectionNames.skills],
                ["#langues", sectionNames.languages],
                ["#preferences", sectionNames.preferences],
                ["#visibilite", t("talent.profile.tabs.visibility")],
              ] as const
            ).map(([href, label]) => (
              <li key={href} className="shrink-0">
                <a
                  href={href}
                  className="flex h-9 items-center rounded-pill px-3 text-[13px] font-medium whitespace-nowrap text-ardoise hover:bg-sapin/5 hover:text-sapin"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>
      {one(params.import) !== undefined && !partie && (
        <Alert
          tone="success"
          title={t("ai.cvImport.done", { count: Number(one(params.import)) || 0 })}
        />
      )}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className={only("identite")}>
            <Identity profile={profile} notice={notice} />
          </div>
          <div className={only("resume")}>
            <Summary profile={profile} notice={notice} />
          </div>
          <div className={only("experiences")}>
            <Experiences profile={profile} notice={notice} />
          </div>
          <div className={only("formations")}>
            <Educations profile={profile} notice={notice} />
          </div>
          <div className={only("competences")}>
            <Skills profile={profile} notice={notice} />
          </div>
          <div className={only("langues")}>
            <Languages profile={profile} notice={notice} />
          </div>
          <div className={only("preferences")}>
            <Preferences profile={profile} notice={notice} />
          </div>
        </div>
        <aside className="flex flex-col gap-5 max-xl:-order-1 xl:sticky xl:top-[84px]">
          <section className="flex flex-col gap-3 rounded-[24px] bg-blanc p-5 max-md:hidden">
            <div className="flex items-center gap-4">
              <ProgressRing
                value={percent}
                size={96}
                label={t("talent.profile.completion.text", { percent })}
              />
              <div className="flex flex-col gap-1">
                <p className="text-[17px] leading-tight font-bold">
                  {t("talent.profile.completion.text", { percent })}
                </p>
                <p className="text-xs leading-[17px] text-ardoise">
                  {t("talent.profile.completion.hint")}
                </p>
              </div>
            </div>
            {missing.length > 0 && (
              <p className="flex items-start gap-2 rounded-[14px] bg-[#FBF6C9] px-3 py-2 text-xs">
                <Icon name="objectif" className="mt-px size-3.5 shrink-0" />
                {t("talent.profile.completion.missing", {
                  sections: missing.map((key) => sectionNames[key]).join(", "),
                })}
              </p>
            )}
            {missing[0] && (
              <a
                href={sectionAnchors[missing[0]] ?? "#identite"}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-pill bg-lime px-4 text-[14px] font-semibold text-sapin hover:bg-lime/85"
              >
                {t("talent.profile.completion.next", { section: sectionNames[missing[0]] })}
                <Icon name="chev-r" className="size-4" />
              </a>
            )}
          </section>
          <div className={only("visibilite")}>
            <RecruiterPreview profile={profile} />
          </div>
          <div className={only("visibilite")}>
            <Visibility profile={profile} notice={notice} />
          </div>
          <section className="flex flex-col gap-3 rounded-[24px] bg-blanc p-5 max-md:hidden">
            <p className="flex items-center gap-3 text-[15px] font-bold">
              <span
                aria-hidden
                className="flex size-9 items-center justify-center rounded-[12px] bg-lime-clair"
              >
                <Icon name="cv" className="size-[18px]" />
              </span>
              {t("talent.profile.importCv.text")}
            </p>
            <p className="text-xs leading-[17px] text-ardoise">
              {t("talent.profile.importCv.hint")}
            </p>
            <Link
              href="/app/profil/import"
              className="flex h-9 items-center gap-2 self-start rounded-pill px-4 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40"
            >
              <Icon name="telecharger" className="size-4" />
              {t("talent.profile.importCv.action")}
            </Link>
          </section>
        </aside>
      </div>
      {photoOpen && (
        // Screen 26: a sheet over the profile on a phone, a dialog on a computer. Closing goes back
        // to the profile, so the sheet works without JavaScript.
        <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
          <Link
            href="/app/profil"
            aria-hidden
            tabIndex={-1}
            className="absolute inset-0 bg-sapin/55"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-titre"
            className="relative flex max-h-[94dvh] w-full flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-creme px-5 pt-3 md:max-w-[440px] md:rounded-[28px]"
          >
            <span
              aria-hidden
              className="mx-auto block h-1.5 w-10 rounded-full bg-brume md:hidden"
            />
            <div className="flex items-center justify-between gap-3">
              <h2 id="photo-titre" className="text-[26px] font-bold tracking-[-0.02em]">
                {t("talent.profile.phone.photo.title")}
              </h2>
              <Link
                href="/app/profil"
                aria-label={t("talent.profile.phone.photo.close")}
                className="grid size-12 shrink-0 place-items-center rounded-full bg-blanc shadow-douce"
              >
                <Icon name="fermer" className="size-5" />
              </Link>
            </div>
            {photoError && (
              <Alert
                tone="error"
                title={t(
                  photoError === "type" || photoError === "size"
                    ? `talent.profile.phone.photo.error.${photoError}`
                    : "talent.profile.phone.photo.error.photo",
                )}
              />
            )}
            <PhotoEditor
              current={profile.user.image ?? undefined}
              hasPhoto={Boolean(profile.user.image)}
              labels={{
                take: t("talent.profile.phone.photo.take"),
                choose: t("talent.profile.phone.photo.choose"),
                remove: t("talent.profile.phone.photo.remove"),
                never: t("talent.profile.phone.photo.never"),
                zoom: t("talent.profile.phone.photo.zoom"),
                cancel: t("talent.profile.phone.photo.cancel"),
                save: t("talent.profile.phone.photo.save"),
                empty: t("talent.profile.phone.photo.empty"),
                drag: t("talent.profile.phone.photo.drag"),
              }}
            />
          </section>
        </div>
      )}
    </div>
  );
}

type Notice = { section?: string; ok?: string; error?: string };
type SectionProps = { profile: FullProfile; notice: Notice };

async function Section({
  id,
  title,
  subtitle,
  icon,
  badge,
  notice,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  icon: IconName;
  badge?: ReactNode;
  notice: Notice;
  children: ReactNode;
}) {
  const t = await getTranslations("talent.profile");
  const td = dynamic(t);
  const mine = notice.section === id;
  const errorText =
    notice.error === "endBeforeStart"
      ? t("experience.error.endBeforeStart")
      : notice.error && td.has(`skills.${notice.error}`)
        ? td(`skills.${notice.error}`, { max: PROFILE_SKILLS_MAX })
        : t("error");
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex scroll-mt-24 flex-col gap-4 rounded-[24px] bg-blanc p-5 lg:p-6"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-lime-clair"
        >
          <Icon name={icon} className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1.5">
          <h2 id={`${id}-title`} className="text-lg leading-6 font-bold lg:text-xl">
            {title}
          </h2>
          {subtitle && <p className="text-xs leading-[17px] text-ardoise">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {mine && notice.ok && <Alert tone="success" title={t("saved")} />}
      {mine && notice.error && <Alert tone="error" title={errorText} />}
      {children}
    </section>
  );
}

/** A native disclosure holding a form: no JavaScript needed. */
function Disclosure({
  label,
  children,
  open = false,
  icon = "plus",
}: {
  label: string;
  children: ReactNode;
  open?: boolean;
  icon?: IconName;
}) {
  return (
    <details className="group" open={open}>
      <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-pill bg-blanc px-4 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40 [&::-webkit-details-marker]:hidden">
        <Icon name={icon} className="size-3.5" />
        {label}
      </summary>
      <div className="mt-3 rounded-[18px] bg-creme p-4 lg:p-5">{children}</div>
    </details>
  );
}

/** Choice shown as a pill (contract types, work modes): the box itself is visually hidden. */
function ChipCheck({
  id,
  name,
  value,
  label,
  defaultChecked,
  type = "checkbox",
}: {
  id: string;
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
  type?: "checkbox" | "radio";
}) {
  return (
    <label
      htmlFor={id}
      className="inline-flex h-9 cursor-pointer items-center rounded-pill bg-blanc px-4 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40 has-checked:bg-sapin has-checked:text-blanc has-checked:ring-sapin has-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)]"
    >
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      {label}
    </label>
  );
}

function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

const tileTones = ["bg-gris-clair", "bg-lime-clair", "bg-menthe-claire"];

async function Identity({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  return (
    <Section id="identite" title={t("identity.title")} icon="profil" notice={notice}>
      <div className="flex items-center gap-4 rounded-[18px] bg-creme p-4">
        {profile.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.user.image}
            alt=""
            className="size-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-lime text-lg font-bold"
          >
            {initials(profile.user.name)}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-semibold">{t("identity.photo.text")}</span>
          <span className="text-xs text-ardoise">{t("identity.photo.hint")}</span>
        </span>
        <Link
          href="/app/profil?photo=1"
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-pill bg-blanc px-4 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40"
        >
          <Icon name="edit" className="size-3.5" />
          {t(profile.user.image ? "identity.photo.change" : "identity.photo.upload")}
        </Link>
      </div>
      <form action={saveIdentity} className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="firstName"
          name="firstName"
          label={t("identity.firstName")}
          defaultValue={profile.user.firstName ?? ""}
          required
          autoComplete="given-name"
        />
        <TextField
          id="lastName"
          name="lastName"
          label={t("identity.lastName")}
          defaultValue={profile.user.lastName ?? ""}
          required
          autoComplete="family-name"
        />
        <TextField
          id="headline"
          name="headline"
          label={t("identity.headline.text")}
          placeholder={t("identity.headline.placeholder")}
          hint={t("identity.headline.hint")}
          defaultValue={profile.headline ?? ""}
          maxLength={120}
          className="sm:col-span-2"
        />
        <Select
          id="country"
          name="country"
          label={t("identity.country")}
          defaultValue={profile.user.country ?? ""}
          required
          options={countryOptions("code")}
          placeholder={t("identity.country")}
        />
        <TextField
          id="city"
          name="city"
          icon="localisation"
          label={t("identity.city.text")}
          placeholder={t("identity.city.placeholder")}
          defaultValue={profile.user.city ?? ""}
          required
          autoComplete="address-level2"
        />
        <TextField
          id="email"
          name="email"
          icon="message"
          label={t("identity.email.text")}
          hint={t("identity.email.hint")}
          defaultValue={profile.user.email}
          readOnly
          className="sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Section>
  );
}

async function Summary({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  return (
    <Section id="resume" title={t("summary.title")} icon="edit" notice={notice}>
      <form action={saveSummary} className="flex flex-col gap-4">
        <TextArea
          id="summary"
          name="summary"
          label={t("summary.label")}
          placeholder={t("summary.placeholder")}
          hint={t("summary.counter", {
            count: profile.summary?.length ?? 0,
            max: PROFILE_SUMMARY_MAX,
          })}
          defaultValue={profile.summary ?? ""}
          maxLength={PROFILE_SUMMARY_MAX}
          rows={5}
        />
        <div>
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Section>
  );
}

async function ExperienceForm({ experience }: { experience?: FullProfile["experiences"][number] }) {
  const t = await getTranslations("talent.profile");
  const key = experience?.id ?? "new";
  return (
    <form action={saveExperience} className="grid gap-4 sm:grid-cols-2">
      {experience && <input type="hidden" name="id" value={experience.id} />}
      <TextField
        id={`exp-title-${key}`}
        name="title"
        label={t("experience.role.text")}
        placeholder={t("experience.role.placeholder")}
        defaultValue={experience?.title}
        required
      />
      <TextField
        id={`exp-company-${key}`}
        name="company"
        label={t("experience.company.text")}
        placeholder={t("experience.company.placeholder")}
        defaultValue={experience?.company}
        required
      />
      <Select
        id={`exp-type-${key}`}
        name="type"
        label={t("experience.type.text")}
        defaultValue={experience?.type ?? "job"}
        required
        options={experienceTypes.map((type) => ({
          value: type,
          label: t(`experience.type.${type}`),
        }))}
      />
      <TextField
        id={`exp-location-${key}`}
        name="location"
        label={t("experience.location")}
        defaultValue={experience?.location ?? ""}
      />
      <TextField
        id={`exp-start-${key}`}
        name="start"
        type="month"
        label={t("experience.start")}
        defaultValue={dateToMonth(experience?.startDate)}
        required
      />
      <TextField
        id={`exp-end-${key}`}
        name="end"
        type="month"
        label={t("experience.end")}
        defaultValue={dateToMonth(experience?.endDate)}
      />
      <Checkbox
        id={`exp-current-${key}`}
        name="current"
        value="on"
        defaultChecked={experience ? experience.endDate === null : false}
        label={t("experience.current")}
        className="sm:col-span-2"
      />
      <TextArea
        id={`exp-description-${key}`}
        name="description"
        label={t("experience.description.text")}
        placeholder={t("experience.description.placeholder")}
        defaultValue={experience?.description}
        rows={4}
        className="sm:col-span-2"
      />
      <div className="sm:col-span-2">
        <Button type="submit">{t("save")}</Button>
      </div>
    </form>
  );
}

async function Experiences({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  const period = (start: Date, end: Date | null) => {
    const format = (date: Date) =>
      new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" }).format(
        date,
      );
    return end
      ? t("experience.period.text", { start: format(start), end: format(end) })
      : t("experience.period.current", { start: format(start) });
  };
  return (
    <Section id="experiences" title={t("experience.title")} icon="career" notice={notice}>
      {profile.experiences.length === 0 ? (
        <p className="rounded-[16px] bg-creme px-4 py-3 text-sm text-ardoise">
          {t("experience.empty")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-brume border-t border-brume">
          {profile.experiences.map((experience, index) => (
            <li key={experience.id} className="flex gap-3 py-4">
              <span
                aria-hidden
                className={cx(
                  "flex size-10 shrink-0 items-center justify-center rounded-[12px] text-[13px] font-bold",
                  tileTones[index % tileTones.length],
                )}
              >
                {initials(experience.company)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div className="flex flex-col">
                    <p className="text-[15px] font-semibold">{experience.title}</p>
                    <p className="text-xs text-ardoise">
                      {experience.company}
                      {" · "}
                      {t(`experience.type.${experience.type}`)}
                      {experience.location && ` · ${experience.location}`}
                    </p>
                  </div>
                  <p className="text-xs text-ardoise">
                    {period(experience.startDate, experience.endDate)}
                  </p>
                </div>
                {experience.description && (
                  <ul className="flex flex-col gap-0.5 text-[13px] leading-5">
                    {experience.description
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => (
                        <li key={line} className="flex gap-2">
                          <span aria-hidden>{"•"}</span>
                          {line}
                        </li>
                      ))}
                  </ul>
                )}
                <div className="mt-1 flex flex-wrap items-start gap-2">
                  <Disclosure label={t("edit")} icon="edit">
                    <ExperienceForm experience={experience} />
                  </Disclosure>
                  <form action={deleteExperience}>
                    <input type="hidden" name="id" value={experience.id} />
                    <Button type="submit" variant="tertiary" size="sm">
                      {t("delete")}
                    </Button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Disclosure
        label={t("experience.add")}
        open={profile.experiences.length === 0 && notice.section === "experiences"}
      >
        <ExperienceForm />
      </Disclosure>
    </Section>
  );
}

async function EducationForm({ education }: { education?: FullProfile["educations"][number] }) {
  const t = await getTranslations("talent.profile");
  const key = education?.id ?? "new";
  return (
    <form action={saveEducation} className="grid gap-4 sm:grid-cols-2">
      {education && <input type="hidden" name="id" value={education.id} />}
      <TextField
        id={`edu-degree-${key}`}
        name="degree"
        label={t("education.degree.text")}
        placeholder={t("education.degree.placeholder")}
        defaultValue={education?.degree}
        required
        className="sm:col-span-2"
      />
      <Select
        id={`edu-level-${key}`}
        name="level"
        label={t("education.level.text")}
        defaultValue={education?.level ?? "bachelor"}
        required
        options={educationLevels.map((level) => ({
          value: level,
          label: t(`education.level.${level}`),
        }))}
      />
      <TextField
        id={`edu-field-${key}`}
        name="field"
        label={t("education.field")}
        defaultValue={education?.field ?? ""}
      />
      <TextField
        id={`edu-school-${key}`}
        name="school"
        label={t("education.school")}
        defaultValue={education?.school}
        required
        className="sm:col-span-2"
      />
      <TextField
        id={`edu-start-${key}`}
        name="startYear"
        type="number"
        inputMode="numeric"
        min={1950}
        max={2100}
        label={t("education.start")}
        defaultValue={education?.startYear?.toString() ?? ""}
      />
      <TextField
        id={`edu-end-${key}`}
        name="endYear"
        type="number"
        inputMode="numeric"
        min={1950}
        max={2100}
        label={t("education.end")}
        defaultValue={education?.endYear?.toString() ?? ""}
      />
      <Checkbox
        id={`edu-progress-${key}`}
        name="inProgress"
        value="on"
        defaultChecked={education ? education.endYear === null : false}
        label={t("education.inProgress")}
        className="sm:col-span-2"
      />
      <div className="sm:col-span-2">
        <Button type="submit">{t("save")}</Button>
      </div>
    </form>
  );
}

async function Educations({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  const certificates = (await myCertificates(db, profile.userId)).filter(
    (certificate) => !certificate.revokedAt,
  );
  return (
    <Section id="formations" title={t("education.title")} icon="diplome" notice={notice}>
      {profile.educations.length === 0 ? (
        <p className="rounded-[16px] bg-creme px-4 py-3 text-sm text-ardoise">
          {t("sectionEmpty")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-brume">
          {profile.educations.map((education) => (
            <li key={education.id} className="flex gap-3 py-3">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-gris-clair text-[13px] font-bold"
              >
                {initials(education.school)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div className="flex flex-col">
                    <p className="text-[15px] font-semibold">{education.degree}</p>
                    <p className="text-xs text-ardoise">
                      {[education.school, t(`education.level.${education.level}`), education.field]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="text-xs text-ardoise">
                    {education.endYear === null
                      ? t("education.inProgress")
                      : [education.startYear, education.endYear].filter(Boolean).join(" à ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  <Disclosure label={t("edit")} icon="edit">
                    <EducationForm education={education} />
                  </Disclosure>
                  <form action={deleteEducation}>
                    <input type="hidden" name="id" value={education.id} />
                    <Button type="submit" variant="tertiary" size="sm">
                      {t("delete")}
                    </Button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {certificates.length > 0 && (
        <div className="flex flex-col gap-3 rounded-[18px] bg-lime-clair p-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Icon name="certificat" className="size-4" />
              {t("education.jumanlyCertificates.text")}
            </p>
            <p className="mt-0.5 text-xs text-ardoise">{t("education.jumanlyCertificates.hint")}</p>
          </div>
          <ul className="flex flex-col gap-2">
            {certificates.map((certificate) => (
              <li
                key={certificate.id}
                className="flex items-center gap-3 rounded-[14px] bg-blanc px-3 py-2.5"
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-lime"
                >
                  <Icon name="certificat" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <Link
                    href={`/attestations/${certificate.code}`}
                    className="truncate text-[13px] font-semibold hover:underline"
                  >
                    {certificate.courseTitle}
                  </Link>
                  <span className="text-[11px] text-ardoise">
                    {t("education.jumanlyCertificates.issued", { date: certificate.issuedAt })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Disclosure label={t("education.add")}>
        <EducationForm />
      </Disclosure>
    </Section>
  );
}

async function Skills({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  const td = dynamic(t);
  const reference = await db.skill.findMany({ select: { name: true }, orderBy: { name: "asc" } });
  const levels = [1, 2, 3, 4] as const;
  const levelOptions = levels.map((level) => ({
    value: String(level),
    label: t(`skills.level.${skillLevelKeys[level]}`),
  }));
  return (
    <Section
      id="competences"
      title={t("skills.title")}
      subtitle={t("skills.subtitle")}
      icon="competence"
      badge={
        <span className="shrink-0 rounded-pill bg-neon px-2.5 py-1 text-[11px] font-semibold">
          {t("skills.count", { count: profile.skills.length, max: PROFILE_SKILLS_MAX })}
        </span>
      }
      notice={notice}
    >
      {profile.skills.length < 3 && (
        <p className="rounded-[16px] bg-[#FBF6C9] px-4 py-3 text-sm">{t("skills.empty")}</p>
      )}
      {profile.skills.length > 0 && (
        <div className="overflow-hidden rounded-[18px] ring-[1.5px] ring-brume ring-inset">
          <p className="flex justify-between bg-creme/60 px-4 py-2.5 text-[11px] font-semibold tracking-[0.08em] text-ardoise uppercase max-sm:hidden">
            {t("skills.table.skill")}
            <span className="w-[300px]">{t("skills.level.text")}</span>
          </p>
          <ul className="flex flex-col divide-y divide-brume">
            {profile.skills.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-sm font-semibold">{entry.skill.name}</span>
                  <span className="flex flex-wrap items-center gap-2 text-[11px] text-ardoise">
                    {entry.proof && td.has(`skills.proof.${entry.proof}`) ? (
                      <span className="flex items-center gap-1">
                        <Icon
                          name={entry.proof === "certificate" ? "certificat" : "lien"}
                          className="size-3"
                        />
                        {td(`skills.proof.${entry.proof}`)}
                      </span>
                    ) : (
                      t("skills.proof.none")
                    )}
                    <span
                      className={cx(
                        "flex items-center gap-1 rounded-pill px-2 py-0.5 font-semibold",
                        entry.verified ? "bg-lime-clair text-up-texte" : "bg-gris-clair text-sapin",
                      )}
                    >
                      {entry.verified && <Icon name="check" className="size-3" />}
                      {entry.verified ? t("skills.badge.verified") : t("skills.badge.declared")}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className="flex rounded-pill bg-creme p-0.5 text-[11px]"
                    aria-label={t(
                      `skills.level.${skillLevelKeys[entry.level as 1 | 2 | 3 | 4] ?? "intermediate"}`,
                    )}
                  >
                    {levels.map((level) => (
                      <span
                        key={level}
                        aria-hidden
                        className={cx(
                          "rounded-pill px-2.5 py-1",
                          level === entry.level
                            ? "bg-sapin font-semibold text-blanc"
                            : "text-ardoise",
                        )}
                      >
                        {t(`skills.level.${skillLevelKeys[level]}`)}
                      </span>
                    ))}
                  </span>
                  <form action={removeSkill}>
                    <input type="hidden" name="id" value={entry.id} />
                    <button
                      type="submit"
                      className="flex size-8 items-center justify-center rounded-full text-ardoise hover:bg-creme hover:text-sapin"
                    >
                      <Icon name="fermer" className="size-4" />
                      <span className="sr-only">
                        {t("delete")} {entry.skill.name}
                      </span>
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Disclosure label={t("skills.add")} open={profile.skills.length < 3}>
        <form action={addSkill} className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="skill-name"
            name="skill"
            icon="recherche"
            label={t("skills.title")}
            placeholder={t("skills.search.placeholder")}
            list="skills-reference"
            autoComplete="off"
            required
          />
          <datalist id="skills-reference">
            {reference.map((skill) => (
              <option key={skill.name} value={skill.name} />
            ))}
          </datalist>
          <Select
            id="skill-level"
            name="level"
            label={t("skills.level.text")}
            defaultValue="2"
            required
            options={levelOptions}
          />
          <Select
            id="skill-proof"
            name="proof"
            label={t("skills.proof.text")}
            hint={t("skills.proof.hint")}
            defaultValue=""
            options={[
              { value: "", label: t("skills.proof.none") },
              ...skillProofs.map((proof) => ({ value: proof, label: t(`skills.proof.${proof}`) })),
            ]}
          />
          <TextField
            id="skill-proof-url"
            name="proofUrl"
            type="url"
            label={t("skills.proofUrl")}
            placeholder="https://"
          />
          <div className="sm:col-span-2">
            <Button type="submit">{t("add")}</Button>
          </div>
        </form>
      </Disclosure>
    </Section>
  );
}

async function Languages({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  const languages = parseProfileLanguages(profile.languages);
  return (
    <Section id="langues" title={t("languages.title")} icon="langue" notice={notice}>
      {languages.length === 0 ? (
        <p className="text-sm text-ardoise">{t("languages.empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-brume">
          {languages.map((language) => (
            <li key={language.code} className="flex flex-wrap items-center gap-3 py-2.5">
              <span className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-8 items-center justify-center rounded-full bg-gris-clair"
                >
                  <Icon name="langue" className="size-4" />
                </span>
                <span className="text-sm font-semibold">{languageName(language.code)}</span>
              </span>
              <span className="ml-auto flex items-center gap-2 text-[11px] font-semibold">
                <span className="rounded-pill bg-gris-clair px-2.5 py-1">
                  {t(`languages.level.${language.level}`)}
                </span>
                {language.cefr && (
                  <span className="rounded-pill bg-neon px-2.5 py-1">{language.cefr}</span>
                )}
              </span>
              <form action={removeLanguage}>
                <input type="hidden" name="code" value={language.code} />
                <button
                  type="submit"
                  className="flex size-8 items-center justify-center rounded-full text-ardoise hover:bg-creme hover:text-sapin"
                >
                  <Icon name="fermer" className="size-4" />
                  <span className="sr-only">
                    {t("delete")} {languageName(language.code)}
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <Disclosure label={t("languages.add")}>
        <form action={addLanguage} className="grid gap-4 sm:grid-cols-3">
          <Select
            id="language-code"
            name="code"
            label={t("languages.language")}
            required
            placeholder={t("languages.language")}
            options={languageCodes
              .map((code) => ({ value: code, label: languageName(code) }))
              .sort((a, b) => a.label.localeCompare(b.label, "fr"))}
          />
          <Select
            id="language-level"
            name="level"
            label={t("languages.level.text")}
            defaultValue="professional"
            required
            options={languageLevels.map((level) => ({
              value: level,
              label: t(`languages.level.${level}`),
            }))}
          />
          <Select
            id="language-cefr"
            name="cefr"
            label={t("languages.cefr.text")}
            defaultValue=""
            options={[
              { value: "", label: "–" },
              ...cefrLevels.map((level) => ({ value: level, label: level })),
            ]}
          />
          <div className="sm:col-span-3">
            <Button type="submit">{t("add")}</Button>
          </div>
        </form>
      </Disclosure>
    </Section>
  );
}

async function Preferences({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  const label = "text-[13px] font-semibold";
  return (
    <Section id="preferences" title={t("availability.title")} icon="horloge" notice={notice}>
      <form action={savePreferences} className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className={cx(label, "mb-2")}>{t("availability.status.text")}</legend>
          <div className="flex flex-wrap gap-1 rounded-pill bg-creme p-1">
            {(
              [
                ["open", "open"],
                ["listening", "listening"],
                ["not_looking", "notLooking"],
              ] as const
            ).map(([value, key]) => (
              <label
                key={value}
                htmlFor={`availability-${value}`}
                className="flex h-9 flex-1 cursor-pointer items-center justify-center rounded-pill px-4 text-[13px] font-semibold whitespace-nowrap has-checked:bg-sapin has-checked:text-blanc has-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)]"
              >
                <input
                  id={`availability-${value}`}
                  type="radio"
                  name="availability"
                  value={value}
                  defaultChecked={profile.availability === value}
                  className="sr-only"
                />
                {t(`availability.status.${key}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="availableFrom"
            name="availableFrom"
            type="date"
            icon="calendrier"
            label={t("availability.from")}
            hint={t("availability.immediate")}
            defaultValue={profile.availableFrom?.toISOString().slice(0, 10) ?? ""}
          />
          <TextField
            id="notice"
            name="notice"
            label={t("availability.notice.text")}
            placeholder={t("availability.notice.placeholder")}
            defaultValue={profile.notice ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1 border-t border-brume pt-5">
          <h3 className="text-base font-bold">{t("preferences.title")}</h3>
          <p className="text-xs leading-[17px] text-ardoise">{t("preferences.subtitle")}</p>
        </div>
        <TextField
          id="desiredJobTitles"
          name="desiredJobTitles"
          label={t("preferences.jobTitles.text")}
          placeholder={t("preferences.jobTitles.placeholder")}
          defaultValue={profile.desiredJobTitles.join(", ")}
        />
        <fieldset className="flex flex-col">
          <legend className={cx(label, "mb-2")}>{t("preferences.contract.text")}</legend>
          <div className="flex flex-wrap gap-2">
            {contractPreferences.map((contract) => (
              <ChipCheck
                key={contract}
                id={`contract-${contract}`}
                name="contracts"
                value={contract}
                defaultChecked={profile.desiredContracts.includes(contract)}
                label={t(`preferences.contract.${contract}`)}
              />
            ))}
          </div>
        </fieldset>
        <TextField
          id="desiredLocations"
          name="desiredLocations"
          icon="localisation"
          label={t("preferences.location.text")}
          placeholder={t("preferences.location.placeholder")}
          defaultValue={profile.desiredLocations.join(", ")}
        />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <fieldset className="flex flex-col">
            <legend className={cx(label, "mb-2")}>{t("preferences.remote.text")}</legend>
            <div className="flex flex-wrap gap-2">
              {(["onsite", "hybrid", "remote"] as const).map((mode) => (
                <ChipCheck
                  key={mode}
                  id={`remote-${mode}`}
                  name="remote"
                  value={mode}
                  defaultChecked={profile.remotePreferences.includes(mode)}
                  label={t(`preferences.remote.${mode}`)}
                />
              ))}
            </div>
          </fieldset>
          <Checkbox
            id="relocation"
            name="relocation"
            value="on"
            defaultChecked={profile.relocation}
            label={t("preferences.relocation")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
          <TextField
            id="salaryMin"
            name="salaryMin"
            type="number"
            inputMode="numeric"
            min={0}
            icon="portefeuille"
            label={t("preferences.salary.text")}
            hint={t("preferences.salary.hint")}
            defaultValue={profile.salaryMin?.toString() ?? ""}
          />
          <Select
            id="salaryPeriod"
            name="salaryPeriod"
            label={t("preferences.salary.period.text")}
            defaultValue={profile.salaryPeriod}
            options={[
              { value: "month", label: t("preferences.salary.period.month") },
              { value: "year", label: t("preferences.salary.period.year") },
            ]}
          />
        </div>
        <div>
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Section>
  );
}

async function Visibility({ profile, notice }: SectionProps) {
  const t = await getTranslations("talent.profile");
  const mine = notice.section === "visibilite";
  return (
    <section
      id="visibilite"
      aria-labelledby="visibilite-title"
      className="flex scroll-mt-24 flex-col gap-3 rounded-[24px] bg-blanc p-5"
    >
      <div>
        <h2 id="visibilite-title" className="text-lg leading-6 font-bold">
          {t("visibility.title")}
        </h2>
        <p className="mt-0.5 text-xs text-ardoise">{t("visibility.subtitle")}</p>
      </div>
      {mine && notice.ok && <Alert tone="success" title={t("saved")} />}
      {mine && notice.error && <Alert tone="error" title={t("error")} />}
      <form action={saveVisibility} className="flex flex-col gap-3">
        <fieldset className="flex flex-col gap-2.5">
          <legend className="sr-only">{t("visibility.title")}</legend>
          {(["private", "recruiters", "anonymous"] as const).map((value) => (
            <label
              key={value}
              htmlFor={`visibility-${value}`}
              className="flex cursor-pointer gap-3 rounded-[16px] p-3.5 ring-[1.5px] ring-brume ring-inset has-checked:bg-lime-clair/60 has-checked:ring-2 has-checked:ring-sapin has-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)]"
            >
              <span className="relative mt-0.5 flex">
                <input
                  id={`visibility-${value}`}
                  type="radio"
                  name="visibility"
                  value={value}
                  defaultChecked={profile.visibility === value}
                  className="peer size-[18px] shrink-0 cursor-pointer appearance-none rounded-full bg-blanc ring-[1.5px] ring-[#8a9794] ring-inset checked:bg-sapin checked:ring-sapin"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-[6px] left-[6px] hidden size-1.5 rounded-full bg-lime peer-checked:block"
                />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold">{t(`visibility.${value}.text`)}</span>
                <span className="text-[11px] leading-4 text-ardoise">
                  {t(`visibility.${value}.desc`)}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="flex items-start gap-2 rounded-[14px] bg-lime-clair px-3 py-2.5 text-[11px] leading-4">
          <Icon name="lock" className="mt-px size-3.5 shrink-0" />
          {t("visibility.always")}
        </p>
        <div>
          <Button type="submit" size="sm">
            {t("save")}
          </Button>
        </div>
      </form>
    </section>
  );
}

/** What a recruiter sees in the talent pool: name (or not), headline and main skills. */
async function RecruiterPreview({ profile }: { profile: FullProfile }) {
  const t = await getTranslations("talent.profile");
  const anonymous = profile.visibility === "anonymous";
  return (
    <section
      id="apercu"
      aria-labelledby="apercu-title"
      className="relative flex scroll-mt-24 flex-col gap-3 overflow-hidden rounded-[24px] bg-sapin p-5 text-blanc"
    >
      <Pattern name="motif-trajectoires-sombre" size={220} opacity={0.4} />
      <p className="relative text-[11px] font-bold tracking-[0.12em] text-neon uppercase">
        {t("preview.text")}
      </p>
      <h2 id="apercu-title" className="relative text-[15px] font-bold">
        {t("preview.title")}
      </h2>
      <div className="relative flex items-center gap-3 rounded-[16px] bg-blanc p-3.5 text-sapin">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-bold"
        >
          {anonymous ? "?" : initials(profile.user.name)}
        </span>
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-sm font-semibold">
            {anonymous ? t("visibility.badge.anonymous") : profile.user.name}
          </span>
          {profile.headline && (
            <span className="truncate text-[11px] text-ardoise">{profile.headline}</span>
          )}
          {profile.skills.length > 0 && (
            <span className="flex flex-wrap gap-1">
              {profile.skills.slice(0, 3).map((entry) => (
                <span
                  key={entry.id}
                  className="rounded-pill bg-gris-clair px-2 py-0.5 text-[10px] font-semibold"
                >
                  {entry.skill.name}
                </span>
              ))}
            </span>
          )}
        </span>
      </div>
      {anonymous && <p className="relative text-[11px] text-blanc/75">{t("preview.anonymous")}</p>}
    </section>
  );
}
