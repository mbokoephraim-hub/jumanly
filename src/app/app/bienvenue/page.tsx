import type { Metadata } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { SkillsInput } from "@/components/app/skills-input";
import { Alert, Button, ButtonLink, Checkbox, TextField } from "@/components/ui";
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
      <div className="flex max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-h1">{t("org.title", { firstName })}</h1>
          <p className="text-ardoise">{t("org.subtitle", { orgName: org.name })}</p>
          <p className="text-sm font-medium">
            {t("org.plan", { plan: plan?.planName ?? "", seats, jobs })}
          </p>
        </header>
        {resume}
        <section className="flex flex-col gap-3 rounded-card bg-blanc p-6">
          <h2 className="text-h2">{t("org.steps.title")}</h2>
          <ol className="flex flex-col gap-3">
            {steps.map((step) => (
              <li key={step} className="flex flex-col">
                <span className="font-semibold">{t(`org.steps.${step}.text`)}</span>
                <span className="text-sm text-ardoise">
                  {t(`org.steps.${step}.help`, { seats })}
                </span>
              </li>
            ))}
          </ol>
        </section>
        <p className="text-sm">{t("org.principle")}</p>
        <p className="text-sm text-ardoise">{t("org.privacy")}</p>
        <p className="text-sm text-ardoise">{t("org.personal")}</p>
        <form action={finishWelcome}>
          <Button type="submit" size="lg">
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
  const suggestions = (
    await db.skill.findMany({ select: { name: true }, orderBy: { name: "asc" } })
  ).map((skill) => skill.name);
  const messages = await getMessages();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{t("talent.title", { firstName })}</h1>
        <p className="text-ardoise">{t("talent.subtitle")}</p>
        <p className="text-sm font-medium">{t("talent.plan", { plan: plan?.planName ?? "" })}</p>
      </header>
      {resume}
      <form action={saveTalentWelcome} className="flex flex-col gap-6 rounded-card bg-blanc p-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-semibold text-h3">{t("talent.goal.title")}</legend>
          {welcomeGoals.map((goal) => (
            <Checkbox
              key={goal}
              id={`goal-${goal}`}
              type="radio"
              name="goal"
              value={goal}
              label={t(`talent.goal.${goal}`)}
              defaultChecked={profile?.goal === goal}
            />
          ))}
        </fieldset>
        <TextField
          id="welcome-target"
          name="targetJob"
          label={t("talent.targetJob.label")}
          placeholder={t("talent.targetJob.placeholder")}
          defaultValue={profile?.targetJob ?? ""}
        />
        <NextIntlClientProvider messages={pickMessages(messages, ["welcome"])}>
          <SkillsInput
            suggestions={suggestions}
            initial={profile?.skills.map((entry) => entry.skill.name) ?? []}
          />
        </NextIntlClientProvider>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-semibold text-h3">{t("talent.visibility.title")}</legend>
          {(["private", "recruiters", "anonymous"] as const).map((value) => (
            <Checkbox
              key={value}
              id={`visibility-${value}`}
              type="radio"
              name="visibility"
              value={value}
              label={t(`talent.visibility.${value}`)}
              defaultChecked={(profile?.visibility ?? "private") === value}
            />
          ))}
          <p className="text-ardoise text-caption">{t("talent.visibility.help")}</p>
        </fieldset>
        <p className="text-sm text-ardoise">{t("later")}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg">
            {t("finish")}
          </Button>
          <Button type="submit" formAction={finishWelcome} variant="tertiary">
            {t("skip")}
          </Button>
        </div>
      </form>
      <section className="flex flex-col gap-3">
        <h2 className="text-h2">{t("talent.next.title")}</h2>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/offres" variant="secondary">
            {t("talent.next.jobs")}
          </ButtonLink>
          <ButtonLink href="/formations?acces=free" variant="secondary">
            {t("talent.next.training")}
          </ButtonLink>
        </div>
        <p className="text-sm">{t("talent.reminder")}</p>
        <Link href="/app/abonnement" className="text-sm underline">
          {t("talent.plan", { plan: plan?.planName ?? "" })}
        </Link>
      </section>
    </div>
  );
}
