import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CopyButton } from "@/components/talent/copy-button";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { OrbiLimit, orbiLimitCode } from "@/components/talent/cv/orbi-limit";
import { cx } from "@/lib/cx";
import { generateLinkedinAction } from "@/server/actions/career-documents";
import { aiFeatures } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { aiState, fold, latestLinkedin, LINKEDIN_GATE } from "@/server/services/career-documents";
import { getFullProfile } from "@/server/services/profile";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("docs.linkedin");
  return { title: t("seo"), robots: { index: false } };
}

/** How many skills the screen proposes to add (planche : « 5 compétences à ajouter »). */
const SKILLS_SHOWN = 5;

/**
 * Préparer LinkedIn (planche talent-4 § 6, `career.linkedin`): a title, a summary and five skills
 * proposed from the Jumanly profile, each to copy. Nothing is published on LinkedIn.
 */
export default async function LinkedinPage({ searchParams }: PageProps<"/app/career/linkedin">) {
  const query = await searchParams;
  const user = await requireUser("/app/career/linkedin");
  const t = await getTranslations();
  const [state, plans, proposal, profile] = await Promise.all([
    aiState(db, user.id, "linkedin", LINKEDIN_GATE),
    listPublicPlans(db),
    latestLinkedin(db, user.id),
    getFullProfile(db, user.id),
  ]);
  const plan = talentPlanFor(plans, LINKEDIN_GATE.key);
  const aiError = orbiLimitCode(query.ia);
  // Skills already proven on Jumanly (a course, an attestation) carry the tick of the planche.
  const proven = new Set(
    profile.skills
      .filter((entry) => entry.source === "course" || entry.source === "assessment")
      .map((entry) => fold(entry.skill.name)),
  );
  const skills = proposal?.skills.slice(0, SKILLS_SHOWN) ?? [];
  const copy = { copied: t("docs.linkedin.copied"), className: "t-bt t-sec t-s t-press" };

  return (
    <div className="t-flux">
      <FlowHead
        back="/app/career/cv?vue=lettres"
        backLabel={t("docs.back")}
        title={t("docs.linkedin.title")}
      />
      {aiError && <OrbiLimit code={aiError} plan={plan} />}

      {state.state === "entitlement" ? (
        <>
          <div className="t-verre t-carte t-sugg">
            <OrbiMark size={36} />
            <div className="t-t">
              <small>{t("docs.linkedin.label")}</small>
              <b>{t("docs.linkedin.lead")}</b>
            </div>
          </div>
          <OrbiLimit code="entitlement" plan={plan} />
        </>
      ) : !proposal ? (
        <div className="t-verre t-carte t-sugg">
          <OrbiMark size={36} />
          <div className="t-t">
            <small>{t("docs.linkedin.label")}</small>
            <b>{t("docs.linkedin.lead")}</b>
            {state.state === "ready" ? (
              <form action={generateLinkedinAction}>
                <button type="submit" className="t-bt t-p t-s t-press">
                  {t("docs.linkedin.generate", { count: aiFeatures.linkedin.credits })}
                </button>
              </form>
            ) : (
              <OrbiLimit code={state.state} plan={plan} />
            )}
          </div>
        </div>
      ) : (
        <>
          <section aria-labelledby="li-titre" className="t-verre t-li-b">
            <h2 id="li-titre">{t("docs.linkedin.headline")}</h2>
            <p>{proposal.headline}</p>
            <CopyButton value={proposal.headline} label={t("docs.linkedin.copy")} {...copy} />
          </section>
          {proposal.about && (
            <section aria-labelledby="li-resume" className="t-verre t-li-b">
              <h2 id="li-resume">{t("docs.linkedin.about")}</h2>
              <p className="whitespace-pre-line">{proposal.about}</p>
              <CopyButton value={proposal.about} label={t("docs.linkedin.copy")} {...copy} />
            </section>
          )}
          {skills.length > 0 && (
            <section aria-labelledby="li-competences" className="t-verre t-li-b">
              <h2 id="li-competences">{t("docs.linkedin.skills", { count: skills.length })}</h2>
              <ul className="t-comp">
                {skills.map((skill) => (
                  <li key={skill}>
                    <span className={cx(proven.has(fold(skill)) && "t-v")}>{skill}</span>
                  </li>
                ))}
              </ul>
              {proven.size > 0 && <p className="t-aide">{t("docs.linkedin.proven")}</p>}
            </section>
          )}
          {state.state === "ready" && (
            <form action={generateLinkedinAction}>
              <button type="submit" className="t-lien-m t-press w-full">
                <OrbiMark size={20} />
                {t("docs.linkedin.regenerate", { count: aiFeatures.linkedin.credits })}
              </button>
            </form>
          )}
        </>
      )}
      <p className="t-gar">
        <TalentIcon name="cadenas" size="s" />
        {t("docs.linkedin.note")}
      </p>
      <p className="t-aide">{t("career.linkedin.disclaimer")}</p>
    </div>
  );
}
