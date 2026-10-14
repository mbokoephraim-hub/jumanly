import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { AiGateNotice } from "@/components/career/ai-gate";
import { CopyButton } from "@/components/career/copy-button";
import {
  AiBrand,
  AiPanel,
  card,
  cardTitle,
  CareerTabs,
  eyebrow,
  pillClass,
} from "@/components/career/kit";
import { EmptyState } from "@/components/ui";
import { cx } from "@/lib/cx";
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
  const copy = {
    label: t("career.linkedin.copy"),
    copiedLabel: t("career.linkedin.copied"),
    className: pillClass("dark", "sm"),
    icon: <Icon name="doc" className="size-4" />,
  };
  const block = (
    id: string,
    title: string,
    text: string,
    body: ReactNode,
    options: { hint?: string; count?: string } = {},
  ) => (
    <section
      key={id}
      aria-labelledby={`linkedin-${id}`}
      className={cx(card, "flex flex-col gap-3 lg:px-6 lg:py-6")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 id={`linkedin-${id}`} className={cardTitle}>
            {title}
          </h3>
          {options.hint && <p className="text-xs text-ardoise">{options.hint}</p>}
        </div>
        <span className={cx(eyebrow, "flex items-center gap-2 text-feuille-fonce")}>
          <AiOrb size={18} />
          {t("career.documents.badge")}
        </span>
      </div>
      <div className="flex flex-col gap-2 rounded-[16px] bg-lime-clair/40 px-4 py-3.5 text-sm leading-[21px] ring-[1.5px] ring-lime-clair ring-inset">
        {body}
        {options.count && <p className="self-end text-xs text-ardoise">{options.count}</p>}
      </div>
      <div>
        <CopyButton value={text} {...copy} />
      </div>
    </section>
  );
  const experiences = proposal?.experiences.filter((item) => item.text.trim()) ?? [];

  return (
    <>
      <AppPageHeader eyebrow={t("career.linkedin.subtitle")} title={t("career.linkedin.title")} />
      <CareerTabs active="linkedin" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="order-2 flex min-w-0 flex-col gap-5 lg:order-1">
          {state.state === "entitlement" ? (
            <AiGateNotice state="entitlement" plan={plan} resetsAt={null} />
          ) : !proposal ? (
            <div className={card}>
              <EmptyState title={t("career.linkedin.empty")} />
            </div>
          ) : (
            <>
              <h2 className="text-[13px] text-ardoise">
                {t("career.linkedin.generatedAt", { date: proposal.createdAt })}
              </h2>
              {block(
                "headline",
                t("career.linkedin.headline.text"),
                proposal.headline,
                <p>{proposal.headline}</p>,
                {
                  hint: t("career.linkedin.headline.hint", { max: HEADLINE_MAX }),
                  count: t("career.linkedin.headline.count", {
                    count: proposal.headline.length,
                    max: HEADLINE_MAX,
                  }),
                },
              )}
              {proposal.about &&
                block(
                  "about",
                  t("career.linkedin.about"),
                  proposal.about,
                  <p className="whitespace-pre-line">{proposal.about}</p>,
                )}
              {proposal.skills.length > 0 &&
                block(
                  "skills",
                  t("career.linkedin.skills"),
                  proposal.skills.join("\n"),
                  <ul className="flex flex-wrap gap-2">
                    {proposal.skills.map((skill) => (
                      <li
                        key={skill}
                        className="rounded-pill bg-blanc px-3 py-1.5 text-xs font-semibold ring-1 ring-brume ring-inset"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>,
                )}
              {experiences.length > 0 &&
                block(
                  "experience",
                  t("career.linkedin.experience"),
                  experiences
                    .map((item) => [[item.title, item.company].join(" · "), item.text].join("\n"))
                    .join("\n\n"),
                  <div className="flex flex-col gap-3">
                    {experiences.map((item, index) => (
                      <div key={index} className="flex flex-col gap-1">
                        <p className="font-semibold">{[item.title, item.company].join(" · ")}</p>
                        <p className="whitespace-pre-line">{item.text}</p>
                      </div>
                    ))}
                  </div>,
                )}
            </>
          )}
        </div>

        <div className="order-1 flex min-w-0 flex-col gap-5 lg:order-2">
          {state.state !== "entitlement" && (
            <AiPanel labelledBy="linkedin-ai">
              <h2 id="linkedin-ai" className="sr-only">
                {t("career.linkedin.generate")}
              </h2>
              <AiBrand />
              <p className="text-sm leading-5 text-blanc/90">{t("career.linkedin.subtitle")}</p>
              <AiGateNotice
                state={state.state}
                plan={plan}
                resetsAt={state.resetsAt}
                outcome={typeof query.ia === "string" ? query.ia : undefined}
              />
              {state.state === "ready" && (
                <form action={generateLinkedinAction} className="flex flex-col gap-2">
                  <button type="submit" className={pillClass("lime", "md", "w-full")}>
                    <Icon name="intelligence" className="size-4" />
                    {proposal ? t("career.linkedin.regenerate") : t("career.linkedin.generate")}
                  </button>
                  <p className="text-center text-xs text-blanc/80">
                    {t("career.documents.generate.cost", { count: aiFeatures.linkedin.credits })}
                  </p>
                </form>
              )}
              <p className="text-xs leading-[17px] text-blanc/75">
                {t("career.linkedin.profileHint")}
              </p>
            </AiPanel>
          )}
          <section aria-labelledby="linkedin-checklist" className={cx(card, "flex flex-col gap-3")}>
            <h2 id="linkedin-checklist" className={cardTitle}>
              {t("career.linkedin.checklist.title")}
            </h2>
            <ul className="flex flex-col gap-3">
              {checklist.map((key) => (
                <li key={key}>
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-5 shrink-0 rounded accent-sapin"
                    />
                    {t(`career.linkedin.checklist.${key}`)}
                  </label>
                </li>
              ))}
            </ul>
          </section>
          <p className="flex gap-2 text-xs leading-[17px] text-ardoise">
            <Icon name="lock" className="mt-px size-4 shrink-0" />
            {t("career.linkedin.disclaimer")}
          </p>
        </div>
      </div>
    </>
  );
}
