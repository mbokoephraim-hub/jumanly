import type { Metadata } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { AccessBar, AccessTop } from "@/components/access/frame";
import { OnboardingFrame } from "@/components/access/onboarding-frame";
import { RecruiterFirstSteps } from "@/components/recruiter/first-steps";
import { PlacesFields, StudiesFields } from "@/components/access/onboarding";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { pickMessages } from "@/i18n/client-messages";
import { featuredStudyFields, studyFields, studyLevels } from "@/lib/studies";
import { onboardingGoals, welcomeContracts, workModes } from "@/lib/welcome";
import { requireUser } from "@/server/auth/session";
import {
  finishWelcome,
  payWelcome,
  saveWelcomeGoal,
  saveWelcomePlaces,
  saveWelcomeStudies,
} from "@/server/actions/welcome";
import { db } from "@/server/db";
import { ownedOrganization } from "@/server/services/accounts";
import { listCountries, listLocalities } from "@/server/services/places";
import { readSignupFlow } from "@/server/signup-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("welcome.seo");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/**
 * Step 6 · first steps. The owner of a new organization gets the recruiter's three steps; a talent gets « Compte
 * validé » then four questions (planche talent-4 § 1): the goal, the studies, where and how to
 * work (the country is asked only here), and « Votre espace est prêt » with the free plan.
 */
export default async function WelcomePage({ searchParams }: PageProps<"/app/bienvenue">) {
  const user = await requireUser("/app/bienvenue");
  const flow = await readSignupFlow();
  const org = await ownedOrganization(db, user.id);
  const firstName = user.firstName ?? user.name;

  const { etape, seul, erreur, rejoindre } = await searchParams;
  // The owner of a new organization: the recruiter's first steps (planche recruteur-3 OBR).
  if (org)
    return (
      <RecruiterFirstSteps
        org={org}
        email={user.email}
        step={typeof etape === "string" ? etape : undefined}
        error={typeof erreur === "string"}
        userId={user.id}
        join={typeof rejoindre === "string" ? rejoindre : undefined}
      />
    );

  const profile = await db.talentProfile.findUnique({ where: { userId: user.id } });
  const ta = await getTranslations("access");
  const step =
    etape === "objectif"
      ? 1
      : etape === "etudes" || etape === "2" || etape === "precisions"
        ? 2
        : etape === "lieux"
          ? 3
          : etape === "pret"
            ? 4
            : 0;
  const TOTAL = 4;
  const stepHref = [
    "/app/bienvenue",
    "?etape=objectif",
    "?etape=etudes",
    "?etape=lieux",
    "?etape=pret",
  ].map((query, index) => (index === 0 ? query : `/app/bienvenue${query}`));

  if (step === 0) {
    const items: { key: "goal" | "studies" | "places"; icon: TalentIconName; tone: string }[] = [
      { key: "goal", icon: "cap", tone: "t-c3" },
      { key: "studies", icon: "former", tone: "t-c1" },
      { key: "places", icon: "localisation", tone: "t-c2" },
    ];
    return (
      <OnboardingFrame brand={ta("brand")} homeLabel={ta("home")} className="t-conf">
        <span className="t-rond-ok">
          <TalentIcon name="valider" />
        </span>
        <h1 className="t-h2s">{ta("validated.title")}</h1>
        <p>{ta("validated.text", { firstName: firstName ?? "" })}</p>
        <ul className="t-verre t-liste">
          {items.map((item) => (
            <li key={item.key} className="t-li">
              <span className={cx("t-cases", item.tone)} aria-hidden>
                <TalentIcon name={item.icon} size="s" />
              </span>
              <span className="t-t">
                <b>{ta(`validated.${item.key}`)}</b>
                <span>{ta(`validated.${item.key}Time`)}</span>
              </span>
            </li>
          ))}
        </ul>
        <Link href={stepHref[1]} className="t-bt t-p t-pl t-press w-full" autoFocus>
          {ta("validated.start")}
        </Link>
      </OnboardingFrame>
    );
  }

  const back = seul === "1" ? "/app" : stepHref[step - 1];
  const head = (
    <>
      <AccessTop back={back} backLabel={ta("back")} />
      <div className="t-prg">
        <div
          className="t-pas"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL}
          aria-valuenow={step}
          aria-label={ta("onboarding.progress", { step, total: TOTAL })}
        >
          {Array.from({ length: TOTAL }, (_, index) => (
            <i key={index} className={cx(index < step && "t-ok")} />
          ))}
        </div>
        <span className="t-pas-t" aria-hidden>
          {ta("onboarding.step", { step, total: TOTAL })}
        </span>
      </div>
    </>
  );
  const frame = (children: React.ReactNode) => (
    <OnboardingFrame brand={ta("brand")} homeLabel={ta("home")} head={head}>
      {children}
    </OnboardingFrame>
  );
  // « Retour » moves into the bottom bar from the tablet on (the round button of the head is hidden).
  const backButton = (
    <Link href={back} className="t-bt t-sec t-m t-press t-obw-back">
      <TalentIcon name="retour" size="s" />
      {ta("back")}
    </Link>
  );
  const continueButton = (
    <button type="submit" className="t-bt t-p t-pl t-press">
      {ta("onboarding.continue")}
    </button>
  );
  const skip = (href: string) => (
    <Link href={href} className="t-bt t-sec t-m t-press">
      {ta("onboarding.skip")}
    </Link>
  );

  if (step === 1) {
    const looks = {
      firstJob: { tone: "t-o1", icon: "opportunites" },
      newJob: { tone: "t-o2", icon: "candidature" },
      skills: { tone: "t-o3", icon: "former" },
      reconversion: { tone: "t-o4", icon: "cap" },
    } as const;
    return frame(
      <>
        <form id="bienvenue-objectif" action={saveWelcomeGoal} className="flex flex-col gap-3.5">
          {seul === "1" && <input type="hidden" name="only" value="1" />}
          <fieldset className="t-fs">
            <legend className="t-ob-q">
              <h1>{ta("onboarding.goal.title")}</h1>
              <p>{ta("onboarding.goal.text")}</p>
            </legend>
            <div className="t-obj-g">
              {onboardingGoals.map((goal) => (
                <label key={goal} className={cx("t-press", looks[goal].tone)}>
                  <input
                    type="radio"
                    name="goal"
                    value={goal}
                    defaultChecked={profile?.goal === goal}
                    className="sr-only"
                  />
                  <span className="t-cases" aria-hidden>
                    <TalentIcon name={looks[goal].icon} size="s" />
                  </span>
                  <b>{ta(`onboarding.goal.${goal}`)}</b>
                  {ta(`onboarding.goal.${goal}Line`)}
                </label>
              ))}
            </div>
          </fieldset>
          <AccessBar>{continueButton}</AccessBar>
        </form>
      </>,
    );
  }

  const messages = await getMessages();

  if (step === 2) {
    return frame(
      <>
        <div className="t-ob-q">
          <h1>{ta("onboarding.studies.title")}</h1>
          <p className="t-vu-large">{ta("onboarding.studies.text")}</p>
        </div>
        <form id="bienvenue-etudes" action={saveWelcomeStudies} className="flex flex-col gap-3.5">
          <div className="t-ob-duo">
            <StudiesFields
              levels={studyLevels.map((value) => ({
                value,
                label: ta(`onboarding.studies.level.${value}`),
              }))}
              fields={studyFields
                .map((value) => ({ value, label: ta(`onboarding.studies.field.${value}`) }))
                .sort((a, b) =>
                  (featuredStudyFields as readonly string[]).includes(a.value) ===
                  (featuredStudyFields as readonly string[]).includes(b.value)
                    ? 0
                    : (featuredStudyFields as readonly string[]).includes(a.value)
                      ? -1
                      : 1,
                )}
              featured={[...featuredStudyFields]}
              initialLevel={profile?.studyLevel}
              initialField={profile?.studyField}
              labels={{
                level: ta("onboarding.studies.level.label"),
                field: ta("onboarding.studies.field.label"),
                search: ta("onboarding.studies.field.search"),
                none: ta("onboarding.studies.field.none"),
              }}
            />
          </div>
          <AccessBar>
            {backButton}
            {skip(stepHref[3])}
            {continueButton}
          </AccessBar>
        </form>
      </>,
    );
  }

  if (step === 3) {
    const [countries, localities] = await Promise.all([listCountries(db), listLocalities(db)]);
    const cities = Object.fromEntries(
      Object.entries(localities).map(([code, rows]) => [
        code,
        rows.filter((row) => row.kind === "city").map((row) => row.name),
      ]),
    );
    const mode = profile?.remotePreferences.length === 1 ? profile.remotePreferences[0] : null;
    return frame(
      <>
        <div className="t-ob-q">
          <h1>{ta("onboarding.places.title")}</h1>
          <p>{ta("onboarding.places.text")}</p>
        </div>
        <form id="bienvenue-lieux" action={saveWelcomePlaces} className="flex flex-col gap-3.5">
          <NextIntlClientProvider messages={pickMessages(messages, ["access"])}>
            <PlacesFields
              countries={countries.map(({ code, name }) => ({ code, name }))}
              localities={cities}
              initialCountry={user.country ?? "CD"}
              initialCity={user.city}
              contracts={welcomeContracts.map((value) => ({
                value,
                label: ta(`onboarding.places.contracts.${value}`),
              }))}
              initialContracts={profile?.desiredContracts ?? []}
              modes={workModes.map((value) => ({
                value,
                label: ta(`onboarding.places.modes.${value}`),
              }))}
              initialMode={mode}
              labels={{
                country: {
                  label: ta("onboarding.places.country"),
                  choose: ta("onboarding.places.chooseCountry"),
                  title: ta("countries.title"),
                  search: ta("countries.search"),
                  none: ta("countries.none"),
                  close: ta("countries.close"),
                  az: ta("countries.az"),
                  sections: {
                    central: ta("countries.section.central"),
                    westEast: ta("countries.section.westEast"),
                    outside: ta("countries.section.outside"),
                    all: ta("countries.section.all"),
                  },
                },
                city: ta("onboarding.places.city"),
                cityPlaceholder: ta("onboarding.places.cityPlaceholder"),
                contract: ta("onboarding.places.contract"),
                mode: ta("onboarding.places.mode"),
              }}
            />
          </NextIntlClientProvider>
          <AccessBar>
            {backButton}
            {skip(stepHref[4])}
            {continueButton}
          </AccessBar>
        </form>
      </>,
    );
  }

  // Step 4: the free plan, and the cheapest paid plan to go further (names and prices from the base).
  const [free, upgrade, chosen] = await Promise.all([
    db.plan.findFirst({
      where: { family: "talent", priceCents: 0 },
      select: { name: true, priceCents: true },
    }),
    db.plan.findFirst({
      where: { family: "talent", isPurchasable: true, priceCents: { gt: 0 } },
      orderBy: { priceCents: "asc" },
      select: { name: true, priceCents: true },
    }),
    flow.plan
      ? db.plan.findFirst({
          where: { code: flow.plan, family: "talent", priceCents: { gt: 0 } },
          select: { name: true },
        })
      : null,
  ]);
  return frame(
    <>
      <div className="t-pret">
        <span className="t-rond-ok">
          <TalentIcon name="valider" />
        </span>
        <h1>{ta("onboarding.ready.title")}</h1>
        <p>
          {chosen
            ? ta("onboarding.ready.textPaid", { plan: chosen.name })
            : ta("onboarding.ready.text")}
        </p>
      </div>
      <div className="t-ob-duo t-form-r">
        {free && (
          <div className="t-form t-fr t-on">
            <div className="t-h">
              <b>{free.name}</b>
              <span className="t-prix">
                {ta("onboarding.ready.price", { price: formatUsd(0) })}
              </span>
            </div>
            <ul>
              {(["f1", "f2", "f3"] as const).map((key) => (
                <li key={key}>
                  <TalentIcon name="valider" size="xs" />
                  {ta(`onboarding.ready.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {upgrade && !chosen && (
          <div className="t-verre t-carte t-sugg">
            <OrbiMark size={36} />
            <div className="t-t">
              <small>{ta("onboarding.ready.more")}</small>
              <b>
                {ta("onboarding.ready.moreText", {
                  plan: upgrade.name,
                  price: formatUsd(upgrade.priceCents ?? 0),
                })}
              </b>
              <div>
                <Link href="/app/abonnement" className="t-bt t-sec t-s t-press">
                  {ta("onboarding.ready.moreCta")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <form id="bienvenue-pret" action={chosen ? payWelcome : finishWelcome}>
        <AccessBar>
          {backButton}
          {chosen && (
            <button type="submit" formAction={finishWelcome} className="t-bt t-sec t-m t-press">
              {ta("onboarding.ready.start")}
            </button>
          )}
          <button type="submit" className={cx("t-bt t-pl t-press", chosen ? "t-p" : "t-a")}>
            {chosen ? ta("onboarding.ready.pay") : ta("onboarding.ready.start")}
          </button>
        </AccessBar>
      </form>
    </>,
  );
}
