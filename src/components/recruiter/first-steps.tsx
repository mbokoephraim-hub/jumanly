import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Organization } from "@/generated/prisma/client";
import { AccessBar, AccessTop } from "@/components/access/frame";
import { OnboardingFrame } from "@/components/access/onboarding-frame";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { countryOptions } from "@/config/countries";
import { cx } from "@/lib/cx";
import { finishWelcome } from "@/server/actions/welcome";
import {
  saveFirstStepsOrganizationAction,
  saveRecruitingForAction,
} from "@/server/actions/recruiter-account";
import { db } from "@/server/db";
import { limit, resolvePlan } from "@/server/entitlements";
import { followedStageCount } from "@/server/services/applications";
import { organizationSizes, recruitingFor } from "@/server/services/recruiter-account";

const TOTAL = 3;

const looks: Record<(typeof recruitingFor)[number], { tone: string; icon: TalentIconName }> = {
  company: { tone: "t-o1", icon: "entreprise" },
  consultant: { tone: "t-o2", icon: "candidats" },
  independent: { tone: "t-o3", icon: "profil" },
  education: { tone: "t-o4", icon: "cap" },
};

/**
 * First steps of a recruiter (planche recruteur-3 OBR1 to OBR3, r3plus): who the organization
 * recruits for, the organization itself, then « Votre espace recruteur est prêt » with the real
 * limits of its plan (`org.seats`, `jobs.active.max`) and three things to do next.
 */
export async function RecruiterFirstSteps({
  org,
  email,
  step: wanted,
  error,
}: {
  org: Organization;
  email: string;
  step?: string;
  error: boolean;
}) {
  const t = await getTranslations("hireWelcome");
  const ta = await getTranslations("access");
  const step = wanted === "organisation" ? 2 : wanted === "pret" ? 3 : 1;
  const hrefs = [
    "/app/bienvenue",
    "/app/bienvenue?etape=organisation",
    "/app/bienvenue?etape=pret",
  ];
  const back = step > 1 ? hrefs[step - 2] : null;

  const head = (
    <>
      {back && <AccessTop back={back} backLabel={t("back")} />}
      <div className="t-prg">
        <div
          className="t-pas"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL}
          aria-valuenow={step}
          aria-label={t("step", { step })}
        >
          {Array.from({ length: TOTAL }, (_, index) => (
            <i key={index} className={cx(index < step && "t-ok")} />
          ))}
        </div>
        <span className="t-pas-t" aria-hidden>
          {t("step", { step })}
        </span>
      </div>
    </>
  );
  const frame = (children: React.ReactNode) => (
    <OnboardingFrame brand={ta("brand")} homeLabel={ta("home")} head={head}>
      {children}
    </OnboardingFrame>
  );
  const backButton = back && (
    <Link href={back} className="t-bt t-sec t-m t-press t-obw-back">
      <TalentIcon name="retour" size="s" />
      {t("back")}
    </Link>
  );
  const continueButton = (
    <button type="submit" className="t-bt t-p t-pl t-press">
      {t("continue")}
    </button>
  );

  if (step === 1) {
    const current =
      org.category === "company" || org.category === "education" ? org.category : null;
    return frame(
      <form
        id="rh-bienvenue-pour"
        action={saveRecruitingForAction}
        className="flex flex-col gap-3.5"
      >
        <fieldset className="t-fs">
          <legend className="t-ob-q">
            <h1>{t("for.title")}</h1>
            <p>{t("for.lead")}</p>
          </legend>
          <div className="t-obj-g">
            {recruitingFor.map((value) => (
              <label key={value} className={cx("t-press", looks[value].tone)}>
                <input
                  type="radio"
                  name="for"
                  value={value}
                  defaultChecked={current === value}
                  className="sr-only"
                />
                <span className="t-cases" aria-hidden>
                  <TalentIcon name={looks[value].icon} size="s" />
                </span>
                <b>{t(`for.${value}`)}</b>
                {t(`for.${value}Text`)}
              </label>
            ))}
          </div>
        </fieldset>
        <AccessBar>{continueButton}</AccessBar>
      </form>,
    );
  }

  if (step === 2) {
    const domain = email.split("@")[1] ?? "";
    return frame(
      <>
        <div className="t-ob-q">
          <h1>{t("org.title")}</h1>
          <p>{t("org.lead")}</p>
        </div>
        {error && <Notice tone="err">{t("org.error")}</Notice>}
        <form
          id="rh-bienvenue-organisation"
          action={saveFirstStepsOrganizationAction}
          className="t-flux"
        >
          <div className="t-champ">
            <label htmlFor="rh-ob-name">{t("org.name")}</label>
            <span className="t-verre t-saisie">
              <input
                id="rh-ob-name"
                name="name"
                required
                minLength={2}
                maxLength={120}
                autoComplete="organization"
                defaultValue={org.name}
              />
            </span>
          </div>
          <div className="t-champ">
            <label htmlFor="rh-ob-country">{t("org.country")}</label>
            <span className="t-verre t-saisie">
              <select id="rh-ob-country" name="country" defaultValue={org.country ?? ""}>
                <option value="">{t("org.countryNone")}</option>
                {countryOptions("code").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </span>
          </div>
          <div className="t-champ">
            <label htmlFor="rh-ob-sector">{t("org.sector")}</label>
            <span className="t-verre t-saisie">
              <input
                id="rh-ob-sector"
                name="sector"
                maxLength={120}
                defaultValue={org.sector ?? ""}
                placeholder={t("org.sectorPlaceholder")}
              />
            </span>
          </div>
          <div className="t-champ">
            <label htmlFor="rh-ob-size">{t("org.size")}</label>
            <span className="t-verre t-saisie">
              <select id="rh-ob-size" name="size" defaultValue={org.size ?? ""}>
                <option value="">{t("org.sizeNone")}</option>
                {organizationSizes.map((size, index) => (
                  <option key={size} value={size}>
                    {t(`org.sizes.s${index + 1}` as "org.sizes.s1")}
                  </option>
                ))}
              </select>
            </span>
          </div>
          {domain && (
            <p className="t-gar">
              <TalentIcon name="confidentialite" size="s" />
              <span>{t("org.domain", { domain: `@${domain}` })}</span>
            </p>
          )}
          <AccessBar>
            {backButton}
            {continueButton}
          </AccessBar>
        </form>
      </>,
    );
  }

  const subject = { type: "organization" as const, id: org.id };
  const [plan, seats, jobs] = await Promise.all([
    resolvePlan(db, subject),
    limit(db, subject, "org.seats"),
    limit(db, subject, "jobs.active.max"),
  ]);
  const stages = followedStageCount;
  const next: { href: string; icon: TalentIconName; tone: string; key: string }[] = [
    { href: "/app/hire/offres/nouvelle", icon: "offre", tone: "t-c1", key: "publish" },
    {
      href: "/app/organisation?onglet=verification",
      icon: "confidentialite",
      tone: "t-c2",
      key: "verify",
    },
    { href: "/app/organisation?onglet=membres", icon: "candidats", tone: "t-c3", key: "invite" },
  ];
  const shown = (value: number) => (value < 0 ? "∞" : String(value));
  return frame(
    <>
      <div className="t-pret">
        <span className="t-rond-ok">
          <TalentIcon name="valider" />
        </span>
        <h1>{t("ready.title")}</h1>
        <p>{t("ready.lead", { plan: plan?.planName ?? "" })}</p>
      </div>
      <div className="t-q3">
        <div className="t-verre">
          <b>{shown(seats)}</b>
          {t("ready.seats", { count: seats })}
        </div>
        <div className="t-verre">
          <b>{shown(jobs)}</b>
          {t("ready.jobs", { count: jobs })}
        </div>
        <div className="t-verre">
          <b>{stages}</b>
          {t("ready.stages")}
        </div>
      </div>
      <div className="t-verre t-carte t-sugg">
        <OrbiMark size={36} />
        <p className="t-t">{t("ready.orbi")}</p>
      </div>
      <ul className="t-verre t-liste t-lignes">
        {next.map((item) => (
          <li key={item.key}>
            <Link href={item.href} className="t-li t-press">
              <span className={cx("t-cases", item.tone)} aria-hidden>
                <TalentIcon name={item.icon} size="s" />
              </span>
              <span className="t-t">
                <b>{t(`ready.${item.key}` as "ready.publish")}</b>
                <span>{t(`ready.${item.key}Text` as "ready.publishText")}</span>
              </span>
              <TalentIcon name="suivant" />
            </Link>
          </li>
        ))}
      </ul>
      <form id="rh-bienvenue-pret" action={finishWelcome}>
        <AccessBar>
          {backButton}
          <button type="submit" className="t-bt t-a t-pl t-press">
            {t("ready.start")}
          </button>
        </AccessBar>
      </form>
    </>,
  );
}
