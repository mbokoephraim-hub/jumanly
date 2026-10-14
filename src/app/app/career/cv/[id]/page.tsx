import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AiGateNotice } from "@/components/career/ai-gate";
import { CvCoachPanel, type CoachState } from "@/components/career/cv-coach-panel";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Checkbox,
  PlanLock,
  Select,
  TextArea,
  TextField,
} from "@/components/ui";
import {
  changeCvSection,
  deleteCv,
  duplicateCv,
  refreshCvFromProfile,
  setCvTemplate,
  setPrimaryCv,
  updateCvDetails,
} from "@/server/actions/cv";
import { tailorCvAction } from "@/server/actions/career-documents";
import { aiFeatures, aiReadiness, AI_CREDITS_KEY } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { limit, usage } from "@/server/entitlements";
import { cvLabels } from "@/server/pdf/cv-labels";
import {
  allowedTemplates,
  cvTemplates,
  isEmptyCv,
  MAX_CVS,
  parseCv,
  type CvContent,
} from "@/server/services/cv";
import { aiState, TAILOR_GATE } from "@/server/services/career-documents";
import { cvScore, parseSuggestion, targetSkillsFor } from "@/server/services/cv-coach";
import { interviewJobs } from "@/server/services/interview-sim";
import { cheapestPlanWithLimit, listPublicPlans, talentPlanFor } from "@/server/services/plans";
import type { CvLabels } from "@/server/pdf/cv-document";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.cv");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * CV editor (partie 07 § 4). The content comes from the profile (« Remplir depuis mon profil »);
 * here the person chooses the title, the summary, the order and visibility of sections and the
 * template. Templates beyond `career.cv.templates.max` show a plan lock.
 */
export default async function CvEditorPage({
  params,
  searchParams,
}: PageProps<"/app/career/cv/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser(`/app/career/cv/${id}`);
  const cv = await db.document.findFirst({
    where: { id, kind: "cv", profile: { userId: user.id } },
  });
  if (!cv) notFound();
  const t = await getTranslations("career.cv");
  const tProfile = await getTranslations("talent.profile");
  const content = parseCv(cv.content);
  const max = await limit(db, { type: "user", id: user.id }, "career.cv.templates.max");
  const allowed = allowedTemplates(max) as string[];
  const plans = await listPublicPlans(db);
  const labels = await cvLabels(cv.title);
  const count = await db.document.count({ where: { kind: "cv", profileId: cv.profileId } });
  const [tailor, tailorJobs] = await Promise.all([
    aiState(db, user.id, "cv_tailor", TAILOR_GATE),
    interviewJobs(db, user.id),
  ]);
  const tailorPlan = talentPlanFor(plans, TAILOR_GATE.key);
  const tAll = await getTranslations();
  const [readiness, credits, targets, pending] = await Promise.all([
    aiReadiness(db, user.id, "cv_coach"),
    usage(db, { type: "user", id: user.id }, AI_CREDITS_KEY),
    targetSkillsFor(db, user.id),
    db.aiSuggestion.findMany({
      where: { userId: user.id, feature: "cv_coach", documentId: cv.id, status: "pending" },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const coachPlan =
    cheapestPlanWithLimit(plans, "talent", AI_CREDITS_KEY, aiFeatures.cv_coach.credits)?.name ??
    null;
  const coach: CoachState =
    readiness === "ready" || readiness === "consent"
      ? { state: readiness }
      : readiness === "unavailable"
        ? { state: "ready" }
        : { state: readiness, plan: coachPlan, resetsAt: credits.resetsAt };
  const score = cvScore(content, targets.skills);
  const cvWords = JSON.stringify(content).toLowerCase();
  const missingKeywords = targets.skills.filter((skill) => !cvWords.includes(skill.toLowerCase()));
  const suggestions = pending.flatMap((row) => {
    const payload = parseSuggestion(row.payload);
    return payload ? [{ id: row.id, payload }] : [];
  });

  const notice =
    typeof query.adapte === "string"
      ? t("tailor.created", { cvName: cv.title, jobTitle: query.adapte })
      : query.ok === "profil"
        ? t("fromProfileDone")
        : query.ok === "modele"
          ? t("template.applied")
          : query.ok
            ? t("saved")
            : null;
  const error =
    query.erreur === "limite"
      ? t("limit", { max: MAX_CVS })
      : query.erreur === "modele"
        ? t("template.locked", {
            plan:
              cheapestPlanWithLimit(plans, "talent", "career.cv.templates.max", cvTemplates.length)
                ?.name ?? "",
          })
        : query.erreur
          ? tProfile("error")
          : null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/career/cv" className="text-sm underline">
        {t("back")}
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h1">{cv.title}</h1>
            {cv.isPrimary && <Badge tone="career">{t("default")}</Badge>}
          </div>
          <p className="text-sm text-ardoise">
            {t("template.current", {
              templateName: t(
                `template.name.${cvTemplates.find((tpl) => tpl.id === cv.templateId)?.id ?? "classic"}`,
              ),
            })}
          </p>
        </div>
        <ButtonLink href={`/app/career/cv/${cv.id}/pdf`} prefetch={false}>
          {t("export.download")}
        </ButtonLink>
      </header>
      {notice && <Alert tone="success" title={notice} />}
      {error && <Alert tone="error" title={error} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="cv-content"
            className="flex flex-col gap-4 rounded-card bg-blanc p-6"
          >
            <h2 id="cv-content" className="text-h2">
              {t("section.info")}
            </h2>
            <p className="text-sm text-ardoise">{t("fromProfileHint")}</p>
            <form action={refreshCvFromProfile}>
              <input type="hidden" name="id" value={cv.id} />
              <Button type="submit" variant="secondary" size="sm">
                {t("fromProfile")}
              </Button>
            </form>
            <form action={updateCvDetails} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={cv.id} />
              <TextField
                id="cv-title"
                name="title"
                label={t("rename")}
                placeholder={t("name.placeholder")}
                defaultValue={cv.title}
                required
                maxLength={80}
              />
              <TextArea
                id="cv-summary"
                name="summary"
                label={t("section.summary")}
                defaultValue={content.summary}
                rows={5}
                maxLength={1000}
              />
              <Checkbox
                id="cv-show-email"
                name="showEmail"
                value="on"
                defaultChecked={content.info.showEmail}
                label={t("info.showEmail")}
                hint={t("info.contact.hint")}
              />
              <div>
                <Button type="submit">{tProfile("save")}</Button>
              </div>
            </form>
          </section>

          <section
            aria-labelledby="cv-sections"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="cv-sections" className="text-h2">
              {t("sections")}
            </h2>
            <ul className="flex flex-col divide-y divide-brume">
              {content.sections.map((section, index) => (
                <li
                  key={section.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className={section.visible ? "font-medium" : "text-ardoise line-through"}>
                    {t(`section.${section.id}`)}
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {(
                      [
                        ["up", t("section.moveUp"), index === 0],
                        ["down", t("section.moveDown"), index === content.sections.length - 1],
                        ["toggle", section.visible ? t("section.hide") : t("section.show"), false],
                      ] as const
                    ).map(([move, label, disabled]) => (
                      <form key={move} action={changeCvSection}>
                        <input type="hidden" name="id" value={cv.id} />
                        <input type="hidden" name="section" value={section.id} />
                        <input type="hidden" name="move" value={move} />
                        <Button
                          type="submit"
                          variant="tertiary"
                          size="sm"
                          disabled={disabled}
                          aria-label={`${label} · ${t(`section.${section.id}`)}`}
                        >
                          {label}
                        </Button>
                      </form>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="cv-template"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="cv-template" className="text-h2">
              {t("template.title")}
            </h2>
            <p className="text-sm text-ardoise">{t("template.limit", { count: allowed.length })}</p>
            <ul className="grid gap-3 sm:grid-cols-3">
              {cvTemplates.map((template, index) => {
                const isAllowed = allowed.includes(template.id);
                const plan = cheapestPlanWithLimit(
                  plans,
                  "talent",
                  "career.cv.templates.max",
                  index + 1,
                );
                return (
                  <li
                    key={template.id}
                    className="flex flex-col gap-2 rounded-md border-2 border-brume p-4"
                  >
                    <span
                      aria-hidden
                      className="h-2 rounded-pill"
                      style={{ backgroundColor: template.accent }}
                    />
                    <span className="font-semibold">{t(`template.name.${template.id}`)}</span>
                    <span className="text-ardoise text-caption">{t("template.ats")}</span>
                    {cv.templateId === template.id ? (
                      <Badge tone="success">{t("template.included")}</Badge>
                    ) : isAllowed ? (
                      <form action={setCvTemplate}>
                        <input type="hidden" name="id" value={cv.id} />
                        <input type="hidden" name="template" value={template.id} />
                        <Button type="submit" variant="secondary" size="sm">
                          {t("template.apply")}
                        </Button>
                      </form>
                    ) : (
                      plan && <PlanLock plan={plan.name} compact />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            aria-labelledby="cv-actions"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="cv-actions" className="sr-only">
              {t("myCvs")}
            </h2>
            <div className="flex flex-wrap gap-3">
              {!cv.isPrimary && (
                <form action={setPrimaryCv}>
                  <input type="hidden" name="id" value={cv.id} />
                  <Button type="submit" variant="secondary" size="sm">
                    {t("setDefault")}
                  </Button>
                </form>
              )}
              <form action={duplicateCv}>
                <input type="hidden" name="id" value={cv.id} />
                <Button type="submit" variant="secondary" size="sm" disabled={count >= MAX_CVS}>
                  {t("duplicate")}
                </Button>
              </form>
            </div>
            <details>
              <summary className="cursor-pointer text-sm font-medium underline">
                {t("delete.text")}
              </summary>
              <form
                action={deleteCv}
                className="mt-3 flex flex-col items-start gap-3 rounded-md bg-creme p-4"
              >
                <input type="hidden" name="id" value={cv.id} />
                <p className="font-semibold">{t("delete.confirm.title", { cvName: cv.title })}</p>
                <p className="text-sm">{t("delete.confirm.body")}</p>
                <Button type="submit" variant="danger" size="sm">
                  {t("delete.confirm.cta")}
                </Button>
              </form>
            </details>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="cv-preview" className="flex flex-col gap-3">
            <h2 id="cv-preview" className="text-h2">
              {t("tab.preview")}
            </h2>
            {isEmptyCv(content) && <Alert tone="info" title={t("empty")} />}
            <CvPreview
              content={content}
              labels={labels}
              accent={cvTemplates.find((tpl) => tpl.id === cv.templateId)?.accent ?? "#0E3B33"}
            />
          </section>
          <CvCoachPanel
            documentId={cv.id}
            score={score}
            coach={coach}
            credits={credits}
            suggestions={suggestions}
            missingKeywords={missingKeywords}
            percents={targets.percents}
            targetTitle={targets.title}
            outcome={{
              coach: typeof query.coach === "string" ? query.coach : undefined,
              suggestion: typeof query.suggestion === "string" ? query.suggestion : undefined,
            }}
          />
          <section
            id="adapter"
            aria-labelledby="cv-tailor"
            className="flex scroll-mt-24 flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="cv-tailor" className="text-h2">
              {t("tailor.text")}
            </h2>
            {tailor.state === "entitlement" ? (
              <p className="text-sm">{t("tailor.locked", { plan: tailorPlan })}</p>
            ) : (
              <>
                <p className="text-sm text-ardoise">{t("tailor.desc")}</p>
                <AiGateNotice
                  state={tailor.state}
                  plan={tailorPlan}
                  resetsAt={tailor.resetsAt}
                  outcome={typeof query.adaptation === "string" ? query.adaptation : undefined}
                />
                {query.adaptation === "notFound" && (
                  <Alert tone="error" title={t("tailor.notFound")} />
                )}
                {query.adaptation === "limit" && (
                  <Alert tone="error" title={t("limit", { max: MAX_CVS })} />
                )}
                {tailor.state === "ready" &&
                  (tailorJobs.length === 0 ? (
                    <p className="text-sm">{t("tailor.noJobs")}</p>
                  ) : (
                    <form action={tailorCvAction} className="flex flex-col gap-3">
                      <input type="hidden" name="cvId" value={cv.id} />
                      <Select
                        id={`tailor-job-${cv.id}`}
                        name="jobId"
                        label={t("tailor.selectJob")}
                        required
                        options={tailorJobs.map((job) => ({ value: job.id, label: job.title }))}
                      />
                      <p className="text-sm text-ardoise">
                        {tAll("career.documents.generate.cost", {
                          count: aiFeatures.cv_tailor.credits,
                        })}
                      </p>
                      <div>
                        <Button type="submit" variant="secondary" size="sm">
                          {t("tailor.cta")}
                        </Button>
                      </div>
                    </form>
                  ))}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/** HTML preview, same order and content as the PDF. */
function CvPreview({
  content,
  labels,
  accent,
}: {
  content: CvContent;
  labels: CvLabels;
  accent: string;
}) {
  const { info } = content;
  const contact = [info.showEmail ? info.email : "", labels.location(info.city, info.country)]
    .filter(Boolean)
    .join(" · ");
  const body = {
    summary: content.summary ? <p className="whitespace-pre-line">{content.summary}</p> : null,
    experience:
      content.experiences.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {content.experiences.map((item, index) => (
            <li key={index}>
              <p className="font-semibold">
                {item.title}
                {" · "}
                {item.company}
              </p>
              <p className="text-ardoise text-caption">
                {labels.period(item.start, item.end)}
                {item.location && ` · ${item.location}`}
              </p>
              {item.bullets.length > 0 && (
                <ul className="mt-1 list-disc pl-5">
                  {item.bullets.map((bullet, line) => (
                    <li key={line}>{bullet}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : null,
    education:
      content.education.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {content.education.map((item, index) => (
            <li key={index}>
              <p className="font-semibold">{item.degree}</p>
              <p className="text-ardoise text-caption">
                {[item.school, item.field, labels.years(item.startYear, item.endYear)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      ) : null,
    skills:
      content.skills.length > 0 ? (
        <p>
          {content.skills
            .map((skill) => [skill.name, labels.skillLevel(skill.level)].join(" · "))
            .join(", ")}
        </p>
      ) : null,
    languages:
      content.languages.length > 0 ? (
        <p>
          {content.languages
            .map((language) => labels.language(language.code, language.level, language.cefr))
            .join(", ")}
        </p>
      ) : null,
  };
  return (
    <article className="flex flex-col gap-4 rounded-card bg-blanc p-6 text-sm leading-6 shadow-sm">
      <header className="border-b-2 pb-3" style={{ borderColor: accent }}>
        <p className="text-xl font-bold">{info.name}</p>
        {info.headline && <p>{info.headline}</p>}
        {contact && <p className="text-ardoise text-caption">{contact}</p>}
      </header>
      {content.sections
        .filter((section) => section.visible && body[section.id])
        .map((section) => (
          <section key={section.id} className="flex flex-col gap-2">
            <h3 className="text-xs font-bold tracking-wide uppercase" style={{ color: accent }}>
              {labels.sections[section.id]}
            </h3>
            {body[section.id]}
          </section>
        ))}
    </article>
  );
}
