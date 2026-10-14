import type { Metadata } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { SkillsInput } from "@/components/app/skills-input";
import { SignupStepper } from "@/components/auth/auth-card";
import { Character } from "@/components/brand";
import { Icon } from "@/components/brand/icon";
import { Pattern } from "@/components/site/marketing";
import { Alert, Button, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { pickMessages } from "@/i18n/client-messages";
import { welcomeGoals } from "@/lib/welcome";
import { requireUser } from "@/server/auth/session";
import { finishWelcome, saveTalentWelcome } from "@/server/actions/welcome";
import { db } from "@/server/db";
import { limit, resolvePlan } from "@/server/entitlements";
import { ownedOrganization } from "@/server/services/accounts";
import { readSignupFlow } from "@/server/signup-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("welcome.seo");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/** Step 6 · first steps, for a talent or for the owner of a new organization. */
export default async function WelcomePage() {
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

  const plan = await resolvePlan(db, { type: "user", id: user.id });
  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    include: { skills: { include: { skill: { select: { name: true } } } } },
  });
  const hasCv = profile
    ? (await db.document.count({ where: { profileId: profile.id, kind: "cv" } })) > 0
    : false;
  const suggestions = (
    await db.skill.findMany({ select: { name: true }, orderBy: { name: "asc" } })
  ).map((skill) => skill.name);
  const paidPlan = flow.plan
    ? await db.plan.findUnique({ where: { code: flow.plan }, select: { priceCents: true } })
    : null;
  const messages = await getMessages();
  const skills = profile?.skills.map((entry) => entry.skill.name) ?? [];
  const done = {
    goal: Boolean(profile?.goal),
    skills: skills.length > 0,
    cv: hasCv,
    // The visibility is asked here: it counts once this screen has been saved.
    visibility: Boolean(profile?.goal || profile?.targetJob),
  };
  const doneCount = Object.values(done).filter(Boolean).length;
  const total = Object.keys(done).length;
  const quick = suggestions.filter((name) => !skills.includes(name)).slice(0, 3);
  const next = [
    { key: "diagnostic", href: "/app/career/diagnostic", icon: "up", tile: "bg-lime-clair" },
    { key: "jobs", href: "/app/jobs", icon: "jobs", tile: "bg-menthe-claire" },
    { key: "training", href: "/formations?acces=free", icon: "learn", tile: "bg-lime" },
    { key: "code", href: "/activer", icon: "certificat", tile: "bg-creme" },
  ] as const;
  const card = "flex flex-col gap-4 rounded-[24px] bg-blanc p-5 lg:p-6";
  const heading = (step: keyof typeof done, index: number, title: string) => (
    <h2 id={`welcome-${step}`} className="mb-1 flex items-center gap-3 text-lg font-bold">
      <span
        aria-hidden
        className={cx(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          done[step] ? "bg-lime text-sapin" : "bg-sapin text-lime",
        )}
      >
        {done[step] ? <Icon name="check" className="size-4" /> : index}
      </span>
      {title}
    </h2>
  );

  return (
    <div className="flex max-w-[1312px] flex-col gap-7">
      <header className="flex items-start gap-6">
        <span className="jm-slide-in hidden shrink-0 md:block">
          <Character name="amani" pose="salut" height={170} />
        </span>
        <div className="flex flex-1 flex-col gap-4">
          <div className="max-w-[620px]">
            <SignupStepper current="welcome" paid={Boolean(paidPlan?.priceCents)} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
              {t("talent.title", { firstName })}
            </h1>
            <Link
              href="/app/abonnement"
              className="flex items-center gap-1.5 rounded-pill bg-sapin px-3 py-1.5 text-xs font-semibold text-lime"
            >
              <Icon name="etoile" className="size-3.5" />
              {t("talent.plan", { plan: plan?.planName ?? "" })}
            </Link>
          </div>
          <p className="text-[15px] text-ardoise lg:text-base">{t("talent.subtitle")}</p>
          <div className="flex items-center gap-3">
            <span
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={doneCount}
              aria-label={t("progress", { done: doneCount, total })}
              className="h-1.5 w-full max-w-[350px] overflow-hidden rounded-pill bg-brume"
            >
              <span
                className="jm-fill block h-full rounded-pill bg-feuille"
                style={{ width: `${(doneCount / total) * 100}%` }}
              />
            </span>
            <span className="shrink-0 rounded-pill bg-[#E4FAD0] px-2.5 py-1 text-[11px] font-semibold">
              {t("progress", { done: doneCount, total })}
            </span>
          </div>
        </div>
      </header>
      {resume}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-7">
        <form action={saveTalentWelcome} className="jm-steps flex flex-col gap-4">
          <div role="group" aria-labelledby="welcome-goal" className={card}>
            {heading("goal", 1, t("talent.goal.title"))}
            <div className="flex flex-wrap gap-2">
              {welcomeGoals.map((goal) => (
                <label
                  key={goal}
                  className="flex h-10 cursor-pointer items-center gap-2 rounded-pill bg-blanc px-4 text-[13px] font-medium ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40 has-checked:bg-sapin has-checked:text-blanc has-checked:ring-sapin has-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)]"
                >
                  <input
                    type="radio"
                    name="goal"
                    value={goal}
                    defaultChecked={profile?.goal === goal}
                    className="peer sr-only"
                  />
                  <Icon name="check" className="hidden size-4 text-lime peer-checked:block" />
                  {t(`talent.goal.${goal}`)}
                </label>
              ))}
            </div>
            <TextField
              id="welcome-target"
              name="targetJob"
              icon="objectif"
              label={t("talent.targetJob.label")}
              placeholder={t("talent.targetJob.placeholder")}
              defaultValue={profile?.targetJob ?? ""}
            />
          </div>
          <div role="group" aria-labelledby="welcome-skills" className={card}>
            {heading("skills", 2, t("talent.skills.title"))}
            <NextIntlClientProvider messages={pickMessages(messages, ["welcome"])}>
              <SkillsInput
                suggestions={suggestions}
                initial={skills}
                quick={quick}
                label={t("talent.skills.label")}
              />
            </NextIntlClientProvider>
          </div>
          <div role="group" aria-labelledby="welcome-cv" className={card}>
            {heading("cv", 3, t("talent.cv.title"))}
            <Link
              href="/app/career/cv"
              className="group flex flex-col gap-1.5 rounded-[18px] bg-neon p-5 transition-transform hover:-translate-y-0.5"
            >
              <Icon name="doc" className="size-5" />
              <span className="mt-1 text-[15px] font-bold">{t("talent.cv.create.text")}</span>
              <span className="text-xs text-sapin/80">{t("talent.cv.create.help")}</span>
            </Link>
          </div>
          <div role="group" aria-labelledby="welcome-visibility" className={card}>
            {heading("visibility", 4, t("talent.visibility.title"))}
            <div className="flex flex-col gap-2.5">
              {(["private", "recruiters", "anonymous"] as const).map((value) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-[16px] bg-blanc px-4 py-3 text-sm ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40 has-checked:bg-[#E4FAD0] has-checked:ring-0 has-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)]"
                >
                  <span className="relative flex size-[22px] shrink-0">
                    <input
                      type="radio"
                      name="visibility"
                      value={value}
                      defaultChecked={(profile?.visibility ?? "private") === value}
                      className="peer size-[22px] cursor-pointer appearance-none rounded-full bg-blanc ring-[1.5px] ring-[#8a9794] ring-inset checked:bg-sapin checked:ring-sapin"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-[7px] left-[7px] hidden size-2 rounded-full bg-lime peer-checked:block"
                    />
                  </span>
                  {t(`talent.visibility.${value}`)}
                </label>
              ))}
            </div>
            <p className="text-xs text-ardoise">{t("talent.visibility.help")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="flex-1 text-xs text-ardoise">{t("later")}</p>
            <Button type="submit" formAction={finishWelcome} variant="tertiary" size="lg">
              {t("skip")}
            </Button>
            <Button type="submit" size="lg" iconAfter={<Icon name="chev-r" className="size-5" />}>
              {t("finish")}
            </Button>
          </div>
        </form>
        <aside className="flex flex-col gap-4 self-start lg:sticky lg:top-24">
          <section className="relative overflow-hidden rounded-[28px] bg-sapin p-6">
            <Pattern name="motif-trajectoires-sombre" size={360} opacity={0.6} />
            <div className="relative flex flex-col gap-3">
              <h2 className="mb-1 text-xs font-bold tracking-[0.14em] text-lime uppercase">
                {t("talent.next.title")}
              </h2>
              {next.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="group flex items-center gap-3.5 rounded-[18px] bg-blanc p-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                >
                  <span
                    aria-hidden
                    className={cx(
                      "flex size-10 shrink-0 items-center justify-center rounded-[12px]",
                      item.tile,
                    )}
                  >
                    <Icon name={item.icon} className="size-5" />
                  </span>
                  <span className="flex-1">{t(`talent.next.${item.key}`)}</span>
                  <Icon
                    name="chev-r"
                    className="size-4 text-ardoise transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              ))}
            </div>
          </section>
          <p className="flex items-start gap-3 rounded-[18px] bg-[#E4FAD0] px-4 py-3.5 text-[13px] leading-[19px]">
            <Icon name="check" className="mt-px size-4 shrink-0 text-feuille-fonce" />
            {t("talent.reminder")}
          </p>
          <span className="jm-float hidden justify-center lg:flex">
            <Character name="amani" pose="joie" height={220} />
          </span>
        </aside>
      </div>
    </div>
  );
}
