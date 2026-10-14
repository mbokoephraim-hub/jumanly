import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { AiGateNotice } from "@/components/career/ai-gate";
import { CopyButton } from "@/components/career/copy-button";
import { Button, EmptyState } from "@/components/ui";
import { generateLinkedinAction } from "@/server/actions/career-documents";
import { aiFeatures } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  aiState,
  HEADLINE_MAX,
  latestLinkedin,
  LINKEDIN_GATE,
} from "@/server/services/career-documents";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.linkedin");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

const checklist = ["photo", "url", "open", "certificates"] as const;

/**
 * LinkedIn preparation (partie 07 § 3, `career.linkedin`): headline, summary, skills and
 * experiences proposed from the Jumanly profile, to copy after reading. Nothing is posted.
 */
export default async function LinkedinPage({ searchParams }: PageProps<"/app/career/linkedin">) {
  const query = await searchParams;
  const user = await requireUser("/app/career/linkedin");
  const t = await getTranslations();
  const [state, plans, proposal] = await Promise.all([
    aiState(db, user.id, "linkedin", LINKEDIN_GATE),
    listPublicPlans(db),
    latestLinkedin(db, user.id),
  ]);
  const plan = talentPlanFor(plans, LINKEDIN_GATE.key);
  const copy = { label: t("career.linkedin.copy"), copiedLabel: t("career.linkedin.copied") };
  const block = (title: string, text: string, hint?: string) => (
    <div className="flex flex-col gap-2 rounded-card bg-creme p-4">
      <h3 className="font-semibold text-h3">{title}</h3>
      {hint && <p className="text-sm text-ardoise">{hint}</p>}
      <p className="whitespace-pre-line">{text}</p>
      <div>
        <CopyButton value={text} {...copy} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/career" className="text-sm underline">
        {t("career.home.eyebrow")}
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{t("career.linkedin.title")}</h1>
        <p className="text-ardoise">{t("career.linkedin.subtitle")}</p>
      </header>

      {state.state === "entitlement" ? (
        <AiGateNotice state="entitlement" plan={plan} resetsAt={null} />
      ) : (
        <section className="flex flex-col gap-4 rounded-card bg-blanc p-6">
          <div className="flex items-center gap-2">
            <AiOrb />
            <h2 className="text-h2">{t("career.linkedin.generate")}</h2>
          </div>
          <AiGateNotice
            state={state.state}
            plan={plan}
            resetsAt={state.resetsAt}
            outcome={typeof query.ia === "string" ? query.ia : undefined}
          />
          {state.state === "ready" && (
            <form action={generateLinkedinAction} className="flex flex-col items-start gap-2">
              <p className="text-sm text-ardoise">{t("career.linkedin.profileHint")}</p>
              <p className="text-sm text-ardoise">
                {t("career.documents.generate.cost", { count: aiFeatures.linkedin.credits })}
              </p>
              <Button type="submit">
                {proposal ? t("career.linkedin.regenerate") : t("career.linkedin.generate")}
              </Button>
            </form>
          )}

          {!proposal ? (
            <EmptyState title={t("career.linkedin.empty")} />
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-ardoise">
                {t("career.linkedin.generatedAt", { date: proposal.createdAt })}
              </p>
              {block(
                t("career.linkedin.headline.text"),
                proposal.headline,
                t("career.linkedin.headline.hint", { max: HEADLINE_MAX }),
              )}
              {proposal.about && block(t("career.linkedin.about"), proposal.about)}
              {proposal.skills.length > 0 &&
                block(t("career.linkedin.skills"), proposal.skills.join("\n"))}
              {proposal.experiences.filter((item) => item.text.trim()).length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="font-semibold text-h3">{t("career.linkedin.experience")}</h3>
                  {proposal.experiences
                    .filter((item) => item.text.trim())
                    .map((item, index) => (
                      <div key={index}>
                        {block([item.title, item.company].join(" · "), item.text)}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-card bg-blanc p-6">
        <h2 className="text-h2">{t("career.linkedin.checklist.title")}</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {checklist.map((key) => (
            <li key={key}>{t(`career.linkedin.checklist.${key}`)}</li>
          ))}
        </ul>
      </section>
      <p className="text-sm text-ardoise">{t("career.linkedin.disclaimer")}</p>
    </div>
  );
}
