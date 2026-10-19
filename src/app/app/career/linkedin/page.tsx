import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { CopyButton } from "@/components/talent/copy-button";
import { FlowHead } from "@/components/talent/flow-head";
import { StudioFrame } from "@/components/talent/cv/studio/studio-frame";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { OrbiLimit, orbiLimitCode } from "@/components/talent/cv/orbi-limit";
import { LetterMenu } from "@/components/talent/cv/letter-menu";
import { SheetButton } from "@/components/talent/sheet";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { generateLinkedinAction } from "@/server/actions/career-documents";
import { aiFeatures } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  aiState,
  fold,
  latestLinkedin,
  LINKEDIN_GATE,
  listDocuments,
  parseDocument,
} from "@/server/services/career-documents";
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
  const d = dynamic(t);
  const format = await getFormatter();
  const [state, plans, proposal, profile, letters, cvCount] = await Promise.all([
    aiState(db, user.id, "linkedin", LINKEDIN_GATE),
    listPublicPlans(db),
    latestLinkedin(db, user.id),
    getFullProfile(db, user.id),
    listDocuments(db, user.id),
    db.document.count({ where: { kind: "cv", profile: { userId: user.id } } }),
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
  const day = (date: Date) => format.dateTime(date, { day: "numeric", month: "short" });
  const letterLine = (letter: (typeof letters)[number]) => {
    const type = parseDocument(letter.content)?.type ?? "letter";
    return type === "letter"
      ? t("docs.letters.written", { date: day(letter.updatedAt) })
      : t("docs.letters.line", {
          type: d(`docs.letters.type.${type}`),
          date: day(letter.updatedAt),
        });
  };
  const tabs = [
    { id: "cv", href: "/app/career/cv", label: t("docs.list.tab.cv"), count: cvCount },
    {
      id: "lettres",
      href: "/app/career/cv?vue=lettres",
      label: t("docs.list.tab.letters"),
      count: letters.length,
    },
    { id: "linkedin", href: "/app/career/linkedin", label: t("docs.list.tab.linkedin") },
  ];
  const fields = proposal
    ? [
        { key: "headline", label: t("docs.web.linkedin.headline"), value: proposal.headline },
        { key: "about", label: t("docs.web.linkedin.about"), value: proposal.about },
        { key: "skills", label: t("docs.web.linkedin.skills"), value: skills.join(" · ") },
      ].filter((field) => field.value)
    : [];
  const webCopy = { copied: t("docs.linkedin.copied"), className: "t-sc-copier t-press" };
  const generate =
    state.state === "ready" ? (
      <form action={generateLinkedinAction}>
        <button type="submit" className="t-bt t-p t-s t-press">
          {t("docs.linkedin.generate", { count: aiFeatures.linkedin.credits })}
        </button>
      </form>
    ) : (
      <OrbiLimit code={state.state} plan={plan} />
    );

  return (
    <>
      <div className="t-mob t-flux">
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

      {/* ─── Tablet and computer (planche studio-cv § 7) ──────────────────────────────── */}
      <div className="t-large t-sc-liste">
        <StudioFrame />
        <div className="t-sc-wh">
          <div className="t-t">
            <h1>{t("docs.list.title")}</h1>
            <p>{t("docs.web.list.lead")}</p>
          </div>
        </div>
        <nav aria-label={t("docs.list.tabs")} className="t-seg t-sc-seg">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={tab.id === "linkedin" ? "page" : undefined}
              className="t-press"
            >
              {tab.label}
              {tab.count !== undefined && <small>{tab.count}</small>}
            </Link>
          ))}
        </nav>
        {aiError && <OrbiLimit code={aiError} plan={plan} />}
        <div className="t-sc-lkd">
          <section aria-labelledby="sc-li-t" className="t-sc-col">
            <div className="t-sc-sec">
              <h2 id="sc-li-t">{t("docs.linkedin.title")}</h2>
              <span>{t("docs.web.linkedin.source")}</span>
            </div>
            {state.state === "entitlement" ? (
              <div className="t-verre t-carte t-sugg">
                <OrbiMark size={36} />
                <div className="t-t">
                  <small>{t("docs.linkedin.label")}</small>
                  <b>{t("docs.linkedin.lead")}</b>
                  <OrbiLimit code="entitlement" plan={plan} />
                </div>
              </div>
            ) : !proposal ? (
              <div className="t-verre t-carte t-sugg">
                <OrbiMark size={36} />
                <div className="t-t">
                  <small>{t("docs.linkedin.label")}</small>
                  <b>{t("docs.linkedin.lead")}</b>
                  {generate}
                </div>
              </div>
            ) : (
              <>
                <ul className="t-sc-li">
                  {fields.map((field) => (
                    <li key={field.key} className="t-sc-f">
                      <span className="t-sc-fh">
                        <h3>{field.label}</h3>
                        <CopyButton
                          value={field.value}
                          label={t("docs.linkedin.copy")}
                          {...webCopy}
                        />
                      </span>
                      <p className={cx(field.key === "about" && "whitespace-pre-line")}>
                        {field.value}
                      </p>
                    </li>
                  ))}
                </ul>
                {proven.size > 0 && <p className="t-aide">{t("docs.linkedin.proven")}</p>}
                {state.state === "ready" && (
                  <form action={generateLinkedinAction}>
                    <button type="submit" className="t-lien-m t-press">
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
          </section>
          <section aria-labelledby="sc-lt-t" className="t-sc-col">
            <div className="t-sc-sec">
              <h2 id="sc-lt-t">{t("docs.web.letters.title")}</h2>
              <Link href="/app/career/cv?vue=lettres&nouvelle=1" className="t-press">
                {t("docs.letters.new")}
              </Link>
            </div>
            {letters.length === 0 ? (
              <p className="t-sc-sub">{t("docs.web.letters.empty")}</p>
            ) : (
              <ul className="t-sc-lettres">
                {letters.map((letter, index) => (
                  <li key={letter.id} className="t-verre t-pj">
                    <span className={cx("t-cases", index % 2 === 1 && "t-sc-former")} aria-hidden>
                      <TalentIcon name="document" size="s" />
                    </span>
                    <span className="t-t">
                      <Link href={`/app/career/documents/${letter.id}`} className="t-lien">
                        <b>{letter.title}</b>
                      </Link>
                      <span>{letterLine(letter)}</span>
                    </span>
                    <SheetButton
                      target={`li-lettre-${letter.id}`}
                      className="t-bi t-press"
                      label={t("docs.list.more", { title: letter.title })}
                    >
                      <TalentIcon name="plus-options" size="s" />
                    </SheetButton>
                  </li>
                ))}
              </ul>
            )}
            <div className="t-verre t-carte t-sugg">
              <OrbiMark size={36} />
              <div className="t-t">
                <small>{t("docs.web.letters.help")}</small>
                <b>{t("docs.web.letters.helpText")}</b>
              </div>
            </div>
          </section>
        </div>
      </div>
      {letters.map((letter) => (
        <LetterMenu key={letter.id} letter={letter} prefix="li-lettre-" />
      ))}
    </>
  );
}
