import type { Metadata } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { SkillsInput } from "@/components/app/skills-input";
import { Character } from "@/components/brand";
import { Icon } from "@/components/brand/icon";
import { CountryPicker } from "@/components/places/country-picker";
import { WorkPlaces } from "@/components/places/work-places";
import { Alert, Button, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { pickMessages } from "@/i18n/client-messages";
import { homeFocus, homeFocuses } from "@/lib/welcome";
import { contractPreferences } from "@/server/services/profile";
import { requireUser } from "@/server/auth/session";
import {
  finishWelcome,
  saveWelcomeCountry,
  saveWelcomeDetails,
  saveWelcomeGoal,
  saveWelcomePlaces,
} from "@/server/actions/welcome";
import { db } from "@/server/db";
import { limit, resolvePlan } from "@/server/entitlements";
import { ownedOrganization } from "@/server/services/accounts";
import { listCountries, listLocalities } from "@/server/services/places";
import { readSignupFlow } from "@/server/signup-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("welcome.seo");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/**
 * Step 6 · first steps, for the owner of a new organization, or for a talent three short screens
 * (docs/ux-mobile-talent, V8 § B1): the country where they live (81), their goal (01), where they
 * want to work (82); then, if they wish, optional details (02).
 */
export default async function WelcomePage({ searchParams }: PageProps<"/app/bienvenue">) {
  const user = await requireUser("/app/bienvenue");
  const t = await getTranslations("welcome");
  const flow = await readSignupFlow();
  const org = await ownedOrganization(db, user.id);
  const firstName = user.firstName ?? user.name;

  const resume = flow.next && (
    <Alert
      title={t("resume.text")}
      action={
        <form action={finishWelcome}>
          <Button type="submit" size="sm">
            {t("resume.cta", { target: flow.next })}
          </Button>
        </form>
      }
    />
  );

  if (org) {
    const subject = { type: "organization" as const, id: org.id };
    const plan = await resolvePlan(db, subject);
    const seats = await limit(db, subject, "org.seats");
    const jobs = await limit(db, subject, "jobs.active.max");
    const steps = ["profile", "job", "invite", "verify"] as const;
    return (
      <div className="flex max-w-[960px] flex-col gap-6">
        <header className="flex items-start gap-6">
          <span className="jm-slide-in hidden shrink-0 md:block">
            <Character name="nadia" pose="salut" height={160} />
          </span>
          <div className="flex flex-col gap-3">
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-sapin text-lime lg:size-12"
            >
              <svg viewBox="0 0 24 24" className="size-7" fill="none">
                <path
                  d="M15 9.5v6a4.5 4.5 0 0 1-9 0"
                  pathLength={1}
                  className="jm-letter"
                  stroke="currentColor"
                  strokeWidth={3.2}
                  strokeLinecap="round"
                />
                <circle
                  cx="15"
                  cy="4"
                  r="0.01"
                  className="jm-letter-dot"
                  stroke="currentColor"
                  strokeWidth={3.2}
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <h1 className="text-[30px] leading-[1.1] font-bold tracking-tight lg:text-[40px]">
              {t("org.title", { firstName })}
            </h1>
            <p className="text-[15px] text-ardoise lg:text-base">
              {t("org.subtitle", { orgName: org.name })}
            </p>
            <p className="flex items-center gap-1.5 self-start rounded-pill bg-sapin px-3 py-1.5 text-xs font-semibold text-lime">
              <Icon name="etoile" className="size-3.5" />
              {t("org.plan", { plan: plan?.planName ?? "", seats, jobs })}
            </p>
          </div>
        </header>
        {resume}
        <section className="flex flex-col gap-4 rounded-[24px] bg-blanc p-5 lg:p-6">
          <h2 className="text-lg font-bold">{t("org.steps.title")}</h2>
          <ol className="flex flex-col gap-3">
            {steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3.5">
                <span
                  aria-hidden
                  className={cx(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    index === 0 ? "bg-lime text-sapin" : "bg-sapin text-lime",
                  )}
                >
                  {index + 1}
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold">{t(`org.steps.${step}.text`)}</span>
                  <span className="text-sm text-ardoise">
                    {t(`org.steps.${step}.help`, { seats })}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <p className="flex items-start gap-3 rounded-[18px] bg-[#E4FAD0] px-4 py-3.5 text-[13px] leading-[19px]">
          <Icon name="check" className="mt-px size-4 shrink-0 text-feuille-fonce" />
          {t("org.principle")}
        </p>
        <p className="text-sm text-ardoise">{t("org.privacy")}</p>
        <p className="text-sm text-ardoise">{t("org.personal")}</p>
        <form action={finishWelcome}>
          <Button type="submit" size="lg" iconAfter={<Icon name="chev-r" className="size-5" />}>
            {t("org.cta.dashboard")}
          </Button>
        </form>
      </div>
    );
  }

  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    include: { skills: { include: { skill: { select: { name: true } } } } },
  });
  const { etape, seul } = await searchParams;
  const step =
    etape === "objectif"
      ? "goal"
      : etape === "lieux"
        ? "places"
        : etape === "2" || etape === "precisions"
          ? "details"
          : "country";
  const current = homeFocus(profile?.goal);
  const choice = current.personalised ? current.focus : "job";
  // Fixed at the bottom of a phone, in the flow of the page from a tablet up.
  const bar =
    "fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-brume bg-creme px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] md:static md:z-auto md:justify-end md:border-0 md:bg-transparent md:p-0";
  const focusTiles = { job: "bg-lime", skills: "bg-neon", career: "bg-menthe-claire" } as const;
  const focusIcons = { job: "jobs", skills: "diplome", career: "objectif" } as const;

  const messages = await getMessages();

  if (step === "country") {
    const countries = await listCountries(db);
    const known = countries.some((country) => country.code === user.country);
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 pb-24 md:pb-0">
        {resume}
        <form action={saveWelcomeCountry} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold text-feuille-fonce">
                {t("talent.country.eyebrow")}
              </p>
              <Button type="submit" formAction={finishWelcome} variant="link" size="S">
                {t("talent.country.later")}
              </Button>
            </div>
            <h1 className="text-[24px] leading-[1.2] font-bold tracking-tight">
              {t("talent.country.title")}
            </h1>
          </div>
          <NextIntlClientProvider messages={pickMessages(messages, ["places"])}>
            <CountryPicker countries={countries} initial={known ? user.country : "CD"} />
          </NextIntlClientProvider>
          <div className={bar}>
            <Button
              type="submit"
              variant="principal"
              size="L"
              arrow
              className="flex-1 md:flex-none"
            >
              {t("talent.country.next")}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (step === "places") {
    const [countries, localities] = await Promise.all([listCountries(db), listLocalities(db)]);
    const chosen =
      profile && profile.desiredCountries.length > 0
        ? profile.desiredCountries
        : user.country && countries.some((country) => country.code === user.country)
          ? [user.country]
          : [];
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 pb-24 md:pb-0">
        {resume}
        <div className="flex flex-col gap-3">
          <p className="text-[12px] font-semibold text-feuille-fonce">
            {t("talent.places.eyebrow")}
          </p>
          <h1 className="text-[24px] leading-[1.2] font-bold tracking-tight">
            {t("talent.places.title")}
          </h1>
          <p className="text-[13.5px] text-ardoise">{t("talent.places.hint")}</p>
        </div>
        <form action={saveWelcomePlaces} className="flex flex-col gap-3">
          <NextIntlClientProvider messages={pickMessages(messages, ["places"])}>
            <WorkPlaces
              countries={countries}
              localities={localities}
              initialCountries={chosen}
              initialPlaces={profile?.desiredLocations ?? []}
              initialRemote={profile?.remotePreferences.includes("remote") ?? false}
              remoteLabel={t("talent.places.remote.text")}
              remoteLine={t("talent.places.remote.line")}
            />
          </NextIntlClientProvider>
          <Button
            type="submit"
            name="then"
            value="details"
            variant="link"
            size="S"
            className="self-start text-feuille-fonce underline"
          >
            {t("talent.places.details")}
          </Button>
          <div className={bar}>
            <Link
              href="/app/bienvenue?etape=objectif"
              className="inline-flex h-[52px] items-center justify-center rounded-pill bg-blanc px-6 text-[15px] font-semibold text-sapin shadow-douce focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)] focus-visible:outline-none"
            >
              {t("talent.places.back")}
            </Link>
            <Button
              type="submit"
              variant="principal"
              size="L"
              arrow
              className="flex-1 md:flex-none"
            >
              {t("talent.places.next")}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (step === "goal") {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 pb-24 md:pb-0">
        {resume}
        <span className="jm-slide-in flex justify-center">
          <Character name="amani" pose="joie" height={150} />
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold text-feuille-fonce">
            {t("talent.step1.eyebrow")}
          </p>
          <h1 className="text-[28px] leading-[1.15] font-bold tracking-tight">
            {t("talent.step1.title")}
          </h1>
          <p className="text-[14px] text-ardoise">{t("talent.step1.hint")}</p>
        </div>
        <form action={saveWelcomeGoal} className="flex flex-col gap-3">
          {/* « Modifier mon objectif » from the home page goes straight back to it. */}
          {seul === "1" && <input type="hidden" name="only" value="1" />}
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">{t("talent.step1.title")}</legend>
            {homeFocuses.map((focus) => (
              <label
                key={focus}
                className="group jm-pressable flex min-h-[76px] cursor-pointer items-center gap-4 rounded-[22px] px-4 py-3 has-checked:ring-2 has-checked:ring-sapin has-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)]"
              >
                <input
                  type="radio"
                  name="focus"
                  value={focus}
                  defaultChecked={choice === focus}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cx(
                    "grid size-12 shrink-0 place-items-center rounded-[14px]",
                    focusTiles[focus],
                  )}
                >
                  <Icon name={focusIcons[focus]} className="size-6" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[16px] leading-snug font-semibold">
                    {t(`talent.focus.${focus}.text`)}
                  </span>
                  <span className="text-[13px] text-ardoise">
                    {t(`talent.focus.${focus}.line`)}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="grid size-6 shrink-0 place-items-center rounded-full ring-2 ring-brume group-has-checked:bg-sapin group-has-checked:ring-sapin"
                >
                  <span className="size-2.5 rounded-full bg-blanc opacity-0 group-has-checked:opacity-100" />
                </span>
              </label>
            ))}
          </fieldset>
          <div className={bar}>
            <Button type="submit" formAction={finishWelcome} variant="soft" size="L">
              {t("talent.step1.later")}
            </Button>
            <Button
              type="submit"
              variant="principal"
              size="L"
              arrow
              className="flex-1 md:flex-none"
            >
              {t("talent.step1.next")}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  const suggestions = (
    await db.skill.findMany({ select: { name: true }, orderBy: { name: "asc" } })
  ).map((skill) => skill.name);
  const skills = profile?.skills.map((entry) => entry.skill.name) ?? [];
  const quick = suggestions.filter((name) => !skills.includes(name)).slice(0, 3);
  const tp = await getTranslations("talent.profile.preferences");
  const chip =
    "flex h-10 cursor-pointer items-center gap-2 rounded-pill bg-blanc px-4 text-[13px] font-medium ring-[1.5px] ring-brume ring-inset has-checked:bg-sapin has-checked:text-blanc has-checked:ring-sapin has-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)]";

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 pb-24 md:pb-0">
      {resume}
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-feuille-fonce">{t("talent.step2.eyebrow")}</p>
        <h1 className="text-[28px] leading-[1.15] font-bold tracking-tight">
          {t("talent.step2.title")}
        </h1>
      </div>
      <form action={saveWelcomeDetails} className="flex flex-col gap-5">
        <TextField
          id="welcome-titles"
          name="titles"
          icon="recherche"
          label={t("talent.step2.titles.label")}
          placeholder={t("talent.step2.titles.placeholder")}
          defaultValue={profile?.desiredJobTitles.join(", ") ?? ""}
        />
        <div className="flex flex-col gap-2">
          <NextIntlClientProvider messages={pickMessages(messages, ["welcome"])}>
            <SkillsInput
              suggestions={suggestions}
              initial={skills}
              quick={quick}
              label={t("talent.step2.skills.label")}
            />
          </NextIntlClientProvider>
        </div>
        <details className="group rounded-[22px] bg-blanc shadow-douce">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
            {t("talent.step2.preferences")}
            <Icon name="chev-d" className="size-5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-4 px-5 pb-5">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[13px] font-semibold">{tp("contract.text")}</legend>
              <div className="flex flex-wrap gap-2">
                {contractPreferences.map((contract) => (
                  <label key={contract} className={chip}>
                    <input
                      type="checkbox"
                      name="contracts"
                      value={contract}
                      defaultChecked={profile?.desiredContracts.includes(contract)}
                      className="sr-only"
                    />
                    {tp(`contract.${contract}`)}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[13px] font-semibold">{tp("remote.text")}</legend>
              <div className="flex flex-wrap gap-2">
                {(["onsite", "hybrid", "remote"] as const).map((mode) => (
                  <label key={mode} className={chip}>
                    <input
                      type="checkbox"
                      name="remote"
                      value={mode}
                      defaultChecked={profile?.remotePreferences.includes(mode)}
                      className="sr-only"
                    />
                    {tp(`remote.${mode}`)}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </details>
        <Link
          href="/app/bienvenue?etape=lieux"
          className="self-start text-[14px] font-semibold text-feuille-fonce underline"
        >
          {t("talent.step2.back")}
        </Link>
        <div className={bar}>
          <Button type="submit" formAction={finishWelcome} variant="soft" size="L">
            {t("talent.step2.skip")}
          </Button>
          <Button type="submit" variant="principal" size="L" arrow className="flex-1 md:flex-none">
            {t("talent.step2.next")}
          </Button>
        </div>
      </form>
    </div>
  );
}
