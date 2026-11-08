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
  saveWelcomeJob,
  saveWelcomePlaces,
  saveWelcomeStudies,
} from "@/server/actions/welcome";
import { db } from "@/server/db";
import { ownedOrganization } from "@/server/services/accounts";
import { listCountries, listDialCountries, listLocalities } from "@/server/services/places";
import { readSignupFlow } from "@/server/signup-flow";
import { isModelB } from "@/server/phone-routes";
import { PhoneOnboarding } from "@/components/phone/accueil/onboarding";
import { PhoneRecruiterOnboarding } from "@/components/phone/recruteur/onboarding";
import { companyState, searchCompanies } from "@/server/services/recruiter-onboarding";
import {
  phoneContracts,
  phoneFirstSkills,
  phoneSituations,
  type PhoneContract,
  type PhoneSituation,
} from "@/lib/phone-onboarding";

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
  // A recruiter on a phone (Modèle B recruteur, M2): the seven steps, then « Profil prêt ».
  const recruiter = await db.recruiterProfile.findUnique({ where: { userId: user.id } });
  // The recruiter's computer keeps its own first steps (only the talent's computer is Modèle B).
  if (recruiter && (await isModelB())) {
    const [countries, dials, localities, company, near, social] = await Promise.all([
      listCountries(db),
      listDialCountries(db),
      listLocalities(db),
      companyState(db, user.id),
      searchCompanies(db, user.id, ""),
      db.account.findFirst({
        where: { userId: user.id, providerId: { in: ["google", "apple", "linkedin"] } },
        select: { providerId: true },
      }),
    ]);
    const dial = new Map(dials.map((row) => [row.code, row.dialCode]));
    const messages = await getMessages();
    const tp = await getTranslations("phoneAccueil.profile.name.provider");
    const free =
      /@(gmail|googlemail|yahoo|ymail|outlook|hotmail|live|msn|icloud|me|aol|proton|protonmail)\./i;
    const kinds = ["charge", "rh", "manager", "dirigeant", "cabinet", "independant"] as const;
    const audiences = ["nobody", "interview", "connections"] as const;
    const hires = ["few", "some", "many"] as const;
    return (
      <NextIntlClientProvider
        messages={pickMessages(messages, ["phoneRhOnboarding", "phoneAccueil", "common"])}
      >
        <PhoneRecruiterOnboarding
          data={{
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            provider: social ? tp(social.providerId as "google" | "apple" | "linkedin") : null,
            image: user.image ?? null,
            country: user.country ?? "CD",
            city: user.city ?? "",
            otherCities: recruiter.otherCities,
            countries: countries.map(({ code, name }) => ({
              code,
              name,
              dial: dial.get(code) ?? null,
            })),
            cities: Object.fromEntries(
              Object.entries(localities).map(([code, rows]) => [
                code,
                rows
                  .filter((row) => row.kind === "city")
                  .slice(0, 6)
                  .map((row) => row.name),
              ]),
            ),
            workEmail: recruiter.workEmail ?? (free.test(user.email) ? "" : user.email),
            phone: recruiter.phone ?? "",
            phoneCountry: recruiter.phoneCountry ?? user.country ?? "CD",
            whatsapp: recruiter.whatsapp,
            linkedin: recruiter.linkedin ?? "",
            contactsFor: audiences.find((item) => item === recruiter.contactsFor) ?? "interview",
            kind: kinds.find((item) => item === recruiter.kind) ?? null,
            jobTitle: recruiter.jobTitle ?? "",
            company,
            near,
            domains: recruiter.domains,
            levels: recruiter.levels,
            hiresPerYear: hires.find((item) => item === recruiter.hiresPerYear) ?? null,
            headline: recruiter.headline ?? "",
            hiringNow: recruiter.hiringNow,
            ready: Boolean(recruiter.completedAt),
          }}
        />
      </NextIntlClientProvider>
    );
  }
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

  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    include: { skills: { include: { skill: { select: { name: true } } } } },
  });
  const ta = await getTranslations("access");

  // On a phone: Modèle B, the six steps of the profile, then « Profil prêt » (docs/modele-b).
  if (await isModelB()) {
    const [countries, localities, skills, asked, social, chosen] = await Promise.all([
      listCountries(db),
      listLocalities(db),
      db.skill.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
      db.skill.findMany({
        select: { name: true },
        orderBy: { jobs: { _count: "desc" } },
        take: 24,
      }),
      db.account.findFirst({
        where: { userId: user.id, providerId: { in: ["google", "apple", "linkedin"] } },
        select: { providerId: true },
      }),
      flow.plan
        ? db.plan.findFirst({
            where: { code: flow.plan, family: "talent", priceCents: { gt: 0 } },
            select: { id: true },
          })
        : null,
    ]);
    const names = new Set(skills.map((skill) => skill.name));
    const first = [
      ...new Set([
        ...phoneFirstSkills.filter((name) => names.has(name)),
        ...asked.map((skill) => skill.name),
      ]),
    ].slice(0, 12);
    const messages = await getMessages();
    const tp = await getTranslations("phoneAccueil.profile.name.provider");
    const situation = (phoneSituations as readonly string[]).includes(profile?.situation ?? "")
      ? (profile?.situation as PhoneSituation)
      : null;
    return (
      <NextIntlClientProvider messages={pickMessages(messages, ["phoneAccueil", "common"])}>
        <PhoneOnboarding
          data={{
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            provider: social ? tp(social.providerId as "google" | "apple" | "linkedin") : null,
            image: user.image ?? null,
            country: user.country ?? "CD",
            city: user.city ?? "",
            relocation: profile?.relocation ?? false,
            situation,
            cap: profile?.targetJob ?? "",
            contracts: (profile?.desiredContracts ?? []).filter((item): item is PhoneContract =>
              (phoneContracts as readonly string[]).includes(item),
            ),
            skills: profile?.skills.map((row) => row.skill.name) ?? [],
            countries: countries.map(({ code, name }) => ({ code, name })),
            cities: Object.fromEntries(
              Object.entries(localities).map(([code, rows]) => [
                code,
                rows
                  .filter((row) => row.kind === "city")
                  .slice(0, 6)
                  .map((row) => row.name),
              ]),
            ),
            allSkills: skills.map((skill) => skill.name),
            firstSkills: first,
            plan: Boolean(chosen),
          }}
        />
      </NextIntlClientProvider>
    );
  }
  // On a computer too, the job aimed at and the skills (évaluation talent, 07/11/2026): without
  // them, the offers are not ranked « pour vous » and the score has nothing to explain.
  const step =
    etape === "objectif"
      ? 1
      : etape === "metier"
        ? 2
        : etape === "etudes" || etape === "2" || etape === "precisions"
          ? 3
          : etape === "lieux"
            ? 4
            : etape === "pret"
              ? 5
              : 0;
  const TOTAL = 5;
  const stepHref = [
    "/app/bienvenue",
    "?etape=objectif",
    "?etape=metier",
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

  if (step === 2) {
    const tc = await getTranslations("phoneAccueil.profile.cap");
    const [all, asked] = await Promise.all([
      db.skill.findMany({ select: { name: true } }),
      db.skill.findMany({
        select: { name: true },
        orderBy: { jobs: { _count: "desc" } },
        take: 24,
      }),
    ]);
    const names = new Set(all.map((skill) => skill.name));
    const mine = profile?.skills.map((row) => row.skill.name) ?? [];
    const offered = [
      ...new Set([
        ...mine,
        ...phoneFirstSkills.filter((name) => names.has(name)),
        ...asked.map((skill) => skill.name),
      ]),
    ].slice(0, Math.max(15, mine.length));
    return frame(
      <>
        <div className="t-ob-q">
          <h1>{ta("onboarding.job.title")}</h1>
          <p>{ta("onboarding.job.text")}</p>
        </div>
        <form id="bienvenue-metier" action={saveWelcomeJob} className="flex flex-col gap-3.5">
          <div className="t-champ">
            <label htmlFor="welcome-cap">{ta("onboarding.job.cap")}</label>
            <div className="t-verre t-saisie">
              <TalentIcon name="cap" size="s" />
              <input
                id="welcome-cap"
                name="cap"
                list="welcome-jobs"
                maxLength={120}
                placeholder={ta("onboarding.job.capPlaceholder")}
                defaultValue={profile?.targetJob ?? ""}
              />
              <datalist id="welcome-jobs">
                {tc("jobs")
                  .split(";")
                  .map((job) => (
                    <option key={job} value={job} />
                  ))}
              </datalist>
            </div>
          </div>
          <fieldset className="t-fs">
            <legend className="t-lab-c">{ta("onboarding.job.skills")}</legend>
            <p className="t-vu-large">{ta("onboarding.job.skillsHint")}</p>
            <div className="t-puces">
              {offered.map((name) => (
                <label key={name} className="t-puce t-press">
                  <input
                    type="checkbox"
                    name="skills"
                    value={name}
                    defaultChecked={mine.includes(name)}
                  />
                  {name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="t-champ">
            <label htmlFor="welcome-other">{ta("onboarding.job.other")}</label>
            <div className="t-verre t-saisie">
              <input
                id="welcome-other"
                name="other"
                maxLength={300}
                placeholder={ta("onboarding.job.otherPlaceholder")}
              />
            </div>
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

  const messages = await getMessages();

  if (step === 3) {
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
            {skip(stepHref[4])}
            {continueButton}
          </AccessBar>
        </form>
      </>,
    );
  }

  if (step === 4) {
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
            {skip(stepHref[5])}
            {continueButton}
          </AccessBar>
        </form>
      </>,
    );
  }

  // Step 5: the free plan, and the cheapest paid plan to go further (names and prices from the base).
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
