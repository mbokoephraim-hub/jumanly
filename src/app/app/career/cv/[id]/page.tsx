import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { previewData } from "@/features/cv/document";
import { templateKey } from "@/features/cv/examples";
import { cvFileName } from "@/features/cv/export/pdf";
import { splitName } from "@/features/cv/render/build";
import { CvPaginationProvider, CvPreview } from "@/features/cv/render/CvPreview";
import { cvSourceOf } from "@/features/cv/source";
import { blockLayout, MAX_PAGES } from "@/features/cv/style";
import { ExportPanel } from "@/features/cv/ui/ExportPanel";
import { PagesPanel } from "@/features/cv/ui/PagesPanel";
import { StylePanel } from "@/features/cv/ui/StylePanel";
import { dynamic } from "@/i18n/dynamic";
import { AppPageHeader } from "@/components/app/page-header";
import { AiGateNotice } from "@/components/career/ai-gate";
import { CvCoachPanel, type CoachState } from "@/components/career/cv-coach-panel";
import { card, CareerTabs, eyebrow, pillClass } from "@/components/career/kit";
import { Alert, Button, Checkbox, Select, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import {
  changeCvSection,
  createCv,
  deleteCv,
  duplicateCv,
  refreshCvFromProfile,
  setPrimaryCv,
  updateCvDetails,
} from "@/server/actions/cv";
import { tailorCvAction } from "@/server/actions/career-documents";
import { aiFeatures, aiReadiness, AI_CREDITS_KEY } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { usage } from "@/server/entitlements";
import {
  canUseTemplate,
  cvSectionIds,
  isEmptyCv,
  MAX_CVS,
  parseCv,
  type CvSectionId,
} from "@/server/services/cv";
import { aiState, TAILOR_GATE } from "@/server/services/career-documents";
import { cvScore, parseSuggestion, targetSkillsFor } from "@/server/services/cv-coach";
import { interviewJobs } from "@/server/services/interview-sim";
import { cheapestPlanWithLimit, listPublicPlans, talentPlanFor } from "@/server/services/plans";
import { TabRail } from "@/components/motion/tab-rail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.cv");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * CV editor (partie 07 § 4). The content comes from the profile (« Remplir depuis mon profil »);
 * here the person chooses the title, the summary and the visibility of sections (« Contenu »), and
 * the template, colour, font, density and pages (« Mise en forme », docs/modeles-cv § 8.2). The
 * preview is the exported document itself, paginated in the browser.
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
  const plans = await listPublicPlans(db);
  const owner = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { image: true },
  });
  const source = cvSourceOf(cv, owner.image);
  const { template, style } = source;
  const { data, demo } = await previewData(source);
  const included = await canUseTemplate(db, { type: "user", id: user.id }, template);
  const view = query.vue === "style" ? "style" : "content";
  const d = dynamic(t);
  const templateName = d(`template.name.${templateKey(template.id)}`);
  const cvs = await db.document.findMany({
    where: { kind: "cv", profileId: cv.profileId },
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    select: { id: true, title: true, isPrimary: true },
  });
  const count = cvs.length;
  const tHome = await getTranslations("career.home");
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
            plan: talentPlanFor(plans, "career.cv.templates.access", ["pro"]),
          })
        : query.erreur === "couleur"
          ? null
          : query.export === "overMax"
            ? t("pages.overMax", { max: MAX_PAGES })
            : query.export === "locked"
              ? t("template.downgraded", { templateName })
              : query.export
                ? t("export.error")
                : query.erreur
                  ? tProfile("error")
                  : null;

  // Sections in the order of the document (main column, then the secondary one).
  const sectionOrder = blockLayout(template, style, cvSectionIds).map(
    (block) => block.type as CvSectionId,
  );
  const sections = sectionOrder.map(
    (id) => content.sections.find((section) => section.id === id) ?? { id, visible: true },
  );
  const breakTargets = demo
    ? []
    : data.blocks.flatMap((block) => [
        { id: block.id, name: block.title },
        ...("items" in block
          ? block.items.map((item) => ({
              id: item.id,
              name: [block.title, item.title].join(" · "),
            }))
          : []),
      ]);
  const { firstName, lastName } = splitName(content.info.name.trim());
  const fileName = cvFileName(
    [firstName, lastName].join(" "),
    cvs.length > 1 ? cv.title : undefined,
  );
  const customError =
    query.erreur === "couleur"
      ? typeof query.proposee === "string"
        ? query.proposee
        : "invalid"
      : undefined;
  const filled: Record<CvSectionId, boolean> = {
    summary: content.summary.trim().length > 0,
    experience: content.experiences.length > 0,
    education: content.education.length > 0,
    skills: content.skills.length > 0,
    languages: content.languages.length > 0,
  };
  const pdfLink = (className: string) => (
    <span className={className}>
      <a href={`/app/career/cv/${cv.id}/pdf`} className={pillClass("dark", "sm")} download>
        <Icon name="telecharger" className="size-4" />
        <span className="sr-only">{t("export.download")}</span> {t("export.text")}
      </a>
    </span>
  );

  return (
    <>
      <AppPageHeader
        eyebrow={[tHome("eyebrow"), t("updated", { date: formatDate(cv.updatedAt) })].join(" · ")}
        title={t("title")}
        actions={pdfLink("lg:hidden")}
      />
      <CareerTabs active="cv" />
      {notice && <Alert tone="success" title={notice} />}
      {error && <Alert tone="error" title={error} />}

      {!included && <Alert tone="error" title={t("template.downgraded", { templateName })} />}

      <CvPaginationProvider>
        <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_330px]">
          <div className="order-3 flex min-w-0 flex-col gap-5 lg:order-1 lg:row-span-2 xl:row-span-1">
            <section aria-labelledby="cv-mine" className={cx(card, "flex flex-col gap-3 lg:p-4")}>
              <h2 id="cv-mine" className={cx(eyebrow, "text-ardoise")}>
                {t("myCvs")}
              </h2>
              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-3 rounded-[16px] bg-creme px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <Icon name="doc" className="size-4 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold">{cv.title}</span>
                    {cv.isPrimary && <span className="text-xs text-ardoise">{t("default")}</span>}
                  </span>
                  <Icon
                    name="chev-d"
                    className="size-4 shrink-0 transition group-open:rotate-180"
                  />
                </summary>
                <ul className="mt-2 flex flex-col gap-1 rounded-[16px] bg-blanc p-2 ring-1 ring-brume">
                  {cvs.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/app/career/cv/${item.id}`}
                        aria-current={item.id === cv.id ? "page" : undefined}
                        className="flex flex-col rounded-xl px-3 py-2 text-sm hover:bg-lime-clair aria-[current=page]:bg-lime-clair"
                      >
                        <span className="font-semibold">{item.title}</span>
                        {item.isPrimary && (
                          <span className="text-xs text-ardoise">{t("default")}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
              <div className="flex flex-wrap gap-2">
                <form action={createCv}>
                  <button
                    type="submit"
                    disabled={count >= MAX_CVS}
                    className={pillClass("outline", "sm", "h-9 px-3")}
                  >
                    <Icon name="plus" className="size-3.5" />
                    {t("new")}
                  </button>
                </form>
                <form action={duplicateCv}>
                  <input type="hidden" name="id" value={cv.id} />
                  <button
                    type="submit"
                    disabled={count >= MAX_CVS}
                    className={pillClass("outline", "sm", "h-9 px-3")}
                  >
                    {t("duplicate")}
                  </button>
                </form>
              </div>
              {!cv.isPrimary && (
                <form action={setPrimaryCv}>
                  <input type="hidden" name="id" value={cv.id} />
                  <button
                    type="submit"
                    className="text-left text-[13px] font-semibold text-up-texte hover:underline"
                  >
                    {t("setDefault")}
                  </button>
                </form>
              )}
              <details>
                <summary className="cursor-pointer text-[13px] font-semibold text-ardoise">
                  {t("delete.text")}
                </summary>
                <form
                  action={deleteCv}
                  className="mt-3 flex flex-col items-start gap-2 rounded-[16px] bg-creme p-3"
                >
                  <input type="hidden" name="id" value={cv.id} />
                  <p className="text-sm font-semibold">
                    {t("delete.confirm.title", { cvName: cv.title })}
                  </p>
                  <p className="text-xs">{t("delete.confirm.body")}</p>
                  <Button type="submit" variant="danger" size="sm">
                    {t("delete.confirm.cta")}
                  </Button>
                </form>
              </details>
            </section>

            <nav
              aria-label={t("tab.style")}
              className="flex gap-1 rounded-pill bg-blanc p-1 ring-1 ring-brume"
            >
              {(
                [
                  ["content", t("tab.content"), `/app/career/cv/${cv.id}`],
                  ["style", t("tab.style"), `/app/career/cv/${cv.id}?vue=style`],
                ] as const
              ).map(([key, label, href]) => (
                <Link
                  key={key}
                  href={href}
                  aria-current={view === key ? "page" : undefined}
                  className="flex h-10 flex-1 items-center justify-center rounded-pill text-sm font-semibold hover:bg-creme aria-[current=page]:bg-sapin aria-[current=page]:text-blanc"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {view === "style" ? (
              <section aria-label={t("tab.style")} className={cx(card, "lg:p-4")}>
                <StylePanel
                  documentId={cv.id}
                  template={template}
                  style={style}
                  customError={customError}
                />
              </section>
            ) : (
              <>
                <section
                  aria-labelledby="cv-sections"
                  className={cx(card, "flex flex-col gap-2 lg:p-4")}
                >
                  <h2 id="cv-sections" className="px-2 pb-1 text-[17px] font-semibold">
                    {t("sections")}
                  </h2>
                  <ul className="flex flex-col gap-1">
                    {sections.map((section, index) => {
                      const name = t(`section.${section.id}`);
                      return (
                        <li key={section.id}>
                          <details className="group rounded-[14px] open:bg-creme">
                            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-[14px] px-2 py-2.5 hover:bg-creme [&::-webkit-details-marker]:hidden">
                              <Icon name={sectionIcons[section.id]} className="size-4 shrink-0" />
                              <span
                                className={cx(
                                  "min-w-0 flex-1 text-sm",
                                  section.visible ? "font-medium" : "text-ardoise line-through",
                                )}
                              >
                                {name}
                              </span>
                              {filled[section.id] ? (
                                <Icon
                                  name="check"
                                  label={t("saved")}
                                  className="size-4 text-feuille"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-down-texte">
                                  {t("section.completion", { percent: 0 })}
                                </span>
                              )}
                            </summary>
                            <div className="flex flex-wrap gap-1 px-2 pb-2.5">
                              {(
                                [
                                  ["up", t("section.moveUp"), index === 0, "up"],
                                  [
                                    "down",
                                    t("section.moveDown"),
                                    index === sections.length - 1,
                                    "down",
                                  ],
                                  [
                                    "toggle",
                                    section.visible ? t("section.hide") : t("section.show"),
                                    false,
                                    section.visible ? "eye-off" : "eye",
                                  ],
                                ] as const
                              ).map(([move, label, disabled, icon]) => (
                                <form key={move} action={changeCvSection}>
                                  <input type="hidden" name="id" value={cv.id} />
                                  <input type="hidden" name="section" value={section.id} />
                                  <input type="hidden" name="move" value={move} />
                                  <button
                                    type="submit"
                                    disabled={disabled}
                                    aria-label={[label, name].join(" · ")}
                                    className="flex h-8 items-center gap-1 rounded-pill bg-blanc px-2.5 text-xs font-semibold ring-1 ring-brume ring-inset hover:bg-lime-clair disabled:opacity-40"
                                  >
                                    <Icon name={icon} className="size-3.5" />
                                    {label}
                                  </button>
                                </form>
                              ))}
                            </div>
                          </details>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section
                  aria-labelledby="cv-content"
                  className={cx(card, "flex flex-col gap-3 lg:p-4")}
                >
                  <h2 id="cv-content" className="text-[17px] font-semibold">
                    {t("section.info")}
                  </h2>
                  <p className="text-xs leading-[18px] text-ardoise">{t("fromProfileHint")}</p>
                  <form action={refreshCvFromProfile}>
                    <input type="hidden" name="id" value={cv.id} />
                    <button
                      type="submit"
                      className={pillClass("outline", "sm", "h-auto min-h-9 px-3 py-1.5 text-left")}
                    >
                      <Icon name="profil" className="size-3.5 shrink-0" />
                      {t("fromProfile")}
                    </button>
                  </form>
                  <form action={updateCvDetails} className="flex flex-col gap-3">
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
                    <button type="submit" className={pillClass("dark", "sm", "self-start")}>
                      {tProfile("save")}
                    </button>
                  </form>
                </section>

                <Link
                  href={`/app/career/cv/${cv.id}?vue=style`}
                  className={cx(
                    card,
                    "flex items-center gap-3 hover:ring-2 hover:ring-sapin lg:p-4",
                  )}
                >
                  <Icon name="doc" className="size-5 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={cx(eyebrow, "text-ardoise")}>{t("template.text")}</span>
                    <span className="truncate text-sm font-semibold">{templateName}</span>
                  </span>
                  <span className="text-sm font-semibold text-up-texte">{t("tab.style")}</span>
                </Link>
              </>
            )}
          </div>

          <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
            <TabRail name="cv-document">
              <div className="flex w-max gap-2">
                <span
                  className={pillClass("dark", "sm", "pointer-events-none shrink-0")}
                  aria-current="page"
                >
                  {t("tab.preview")}
                </span>
                <Link
                  href="/app/career/documents"
                  className={pillClass("outline", "sm", "shrink-0")}
                >
                  {t("tab.letter")}
                </Link>
                <Link
                  href="/app/career/linkedin"
                  className={pillClass("outline", "sm", "shrink-0")}
                >
                  {t("tab.linkedin")}
                </Link>
              </div>
            </TabRail>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 rounded-pill bg-lime-clair px-3 py-1 text-xs font-semibold">
                <Icon name="check" className="size-3.5" />
                {t("saved")}
              </span>
              {pdfLink("hidden lg:block")}
            </div>

            <section
              id="adapter"
              aria-labelledby="cv-tailor"
              className={cx(card, "flex scroll-mt-24 flex-col gap-3 lg:p-5")}
            >
              <div className="flex items-start gap-3">
                <Icon name="jobs" className="mt-0.5 size-5 shrink-0" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 id="cv-tailor" className="text-[15px] font-semibold">
                    {t("tailor.text")}
                  </h2>
                  <p className="text-[13px] leading-[18px] text-ardoise">
                    {tailor.state === "entitlement"
                      ? t("tailor.locked", { plan: tailorPlan })
                      : t("tailor.desc")}
                  </p>
                </div>
              </div>
              {tailor.state !== "entitlement" && (
                <>
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
                      <p className="text-[13px]">{t("tailor.noJobs")}</p>
                    ) : (
                      <form
                        action={tailorCvAction}
                        className="flex flex-wrap items-end gap-3 [&>div:first-of-type]:min-w-[220px] [&>div:first-of-type]:flex-1"
                      >
                        <input type="hidden" name="cvId" value={cv.id} />
                        <Select
                          id={`tailor-job-${cv.id}`}
                          name="jobId"
                          label={t("tailor.selectJob")}
                          required
                          options={tailorJobs.map((job) => ({ value: job.id, label: job.title }))}
                        />
                        <button type="submit" className={pillClass("outline", "sm", "h-11")}>
                          {t("tailor.cta")}
                        </button>
                        <p className="w-full text-xs text-ardoise">
                          {tAll("career.documents.generate.cost", {
                            count: aiFeatures.cv_tailor.credits,
                          })}
                        </p>
                      </form>
                    ))}
                </>
              )}
            </section>

            <section aria-labelledby="cv-preview" className="flex flex-col gap-3">
              <h2 id="cv-preview" className="sr-only">
                {t("tab.preview")}
              </h2>
              {(demo || isEmptyCv(content)) && <Alert tone="info" title={t("empty")} />}
              <div className="rounded-[16px] bg-creme p-3 sm:p-5">
                <CvPreview data={data} template={template} style={style} label={t("tab.preview")} />
              </div>
            </section>
          </div>

          <div className="order-2 flex min-w-0 flex-col gap-5 lg:order-3 lg:col-start-2 xl:col-start-3">
            {view === "style" && (
              <PagesPanel
                documentId={cv.id}
                targets={breakTargets}
                breaks={style.pageBreaks ?? []}
                fitTried={query.ajuste === "1"}
                labels={{
                  title: t("pages.title"),
                  count: t("pages.count", { count: "{count}", max: MAX_PAGES }),
                  page: t("pages.page", { number: "{number}" }),
                  breakHere: t("pages.breakHere"),
                  breakTarget: t("pages.breakTarget"),
                  breakLabel: t("pages.breakLabel", { sectionName: "{sectionName}" }),
                  removeBreak: t("pages.removeBreak"),
                  fitOne: t("pages.fitOne"),
                  fitFailed: t("pages.fitFailed"),
                  hint: t("pages.hint"),
                  tooLong: t("export.tooLong"),
                  overMax: t("pages.overMax", { max: MAX_PAGES }),
                  itemTooLong: t("pages.itemTooLong"),
                }}
              />
            )}
            <ExportPanel
              documentId={cv.id}
              fileName={fileName}
              locked={!included}
              labels={{
                title: t("export.title"),
                pdf: t("export.format.pdf"),
                fileLines: Array.from({ length: MAX_PAGES + 3 }, (_, index) =>
                  t("export.fileName", { fileName, count: index + 1 }),
                ),
                download: t("export.download"),
                preparing: t("export.preparing"),
                ready: t("export.ready"),
                error: t("export.error"),
                overMax: t("pages.overMax", { max: MAX_PAGES }),
                locked: t("template.downgraded", { templateName }),
                neutral: t("template.neutral"),
              }}
            />
            {view === "content" && (
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
            )}
          </div>
        </div>
      </CvPaginationProvider>
    </>
  );
}

const sectionIcons: Record<CvSectionId, IconName> = {
  summary: "profil",
  experience: "career",
  education: "diplome",
  skills: "competence",
  languages: "langue",
};
