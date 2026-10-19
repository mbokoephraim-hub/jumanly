import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
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
import {
  MobileActionBar,
  ModeSwitch,
  Notice,
  SectionsPanel,
  WorkshopBar,
} from "@/components/career/cv/editor";
import { CriteriaBars } from "@/components/career/cv/parts";
import {
  PhoneEditorBar,
  PhoneEditorTabs,
  PhonePartChips,
  PhoneSection,
  type CvPhoneView,
  type PhonePartChip,
} from "@/components/career/cv/phone-editor";
import { PhoneTitle } from "@/components/talent/page-title";
import { Workbench } from "@/components/career/cv/workbench";
import { card, pillClass } from "@/components/career/kit";
import { Alert, Checkbox, Select, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { updateCvDetails } from "@/server/actions/cv";
import { tailorCvAction } from "@/server/actions/career-documents";
import { aiFeatures, aiReadiness, AI_CREDITS_KEY } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { usage } from "@/server/entitlements";
import {
  canUseTemplate,
  cvPhoneParts,
  cvSectionIds,
  isEmptyCv,
  MAX_CVS,
  parseCv,
  type CvPhonePart,
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
  // Prompt 6 (screens 28, 29): on a phone, « Contenu » shows one part at a time, « Mise en forme »
  // the page and its settings, « Aperçu » the page, the coach and the export.
  const phoneView: CvPhoneView =
    query.vue === "style" ? "style" : query.vue === "apercu" ? "preview" : "content";
  const part: CvPhonePart = cvPhoneParts.includes(query.partie as CvPhonePart)
    ? (query.partie as CvPhonePart)
    : "info";
  const d = dynamic(t);
  const templateName = d(`template.name.${templateKey(template.id)}`);
  const cvs = await db.document.findMany({
    where: { kind: "cv", profileId: cv.profileId },
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    select: { id: true, title: true, isPrimary: true },
  });
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
        : query.erreur === "couleur" || query.erreur === "telephone"
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
  const sectionCounts: Record<CvSectionId, number | null> = {
    summary: null,
    experience: content.experiences.length,
    education: content.education.length,
    skills: content.skills.length,
    languages: content.languages.length,
  };
  // Names of the sections for the label on the highlighted block (src/styles/cv-v2.css).
  const highlightLabels = Object.fromEntries(
    cvSectionIds.map((sectionId) => [
      `--jm-cv-label-${sectionId}`,
      JSON.stringify(t(`section.${sectionId}`)),
    ]),
  ) as CSSProperties;
  const tailorLocked = tailor.state === "entitlement";
  const phoneParts: PhonePartChip[] = [
    { key: "info", label: t("phone.part.info"), filled: content.info.name.trim().length > 0 },
    { key: "summary", label: t("section.summary"), filled: filled.summary },
    ...sectionOrder
      .filter((sectionId) => sectionId !== "summary")
      .map((sectionId) => ({
        key: sectionId,
        label: t(`section.${sectionId}`),
        filled: filled[sectionId],
      })),
  ];
  const partIndex = phoneParts.findIndex((chip) => chip.key === part);
  const nextPart = phoneParts[partIndex + 1];
  const listSections = sectionOrder.filter((sectionId) => sectionId !== "summary");
  const detailsHidden = (except: "title" | "summary" | "contact") => (
    <>
      <input type="hidden" name="id" value={cv.id} />
      <input type="hidden" name="partie" value={except === "summary" ? "summary" : "info"} />
      {except !== "title" && <input type="hidden" name="title" value={cv.title} />}
      {except !== "summary" && <input type="hidden" name="summary" value={content.summary} />}
      {except !== "contact" && (
        <>
          {content.info.showEmail && <input type="hidden" name="showEmail" value="on" />}
          <input type="hidden" name="phone" value={content.info.phone} />
        </>
      )}
    </>
  );

  const profileForm = (
    <form action={updateCvDetails} className="flex flex-col gap-3 border-t border-brume pt-3">
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
      <div className="flex flex-col gap-1">
        <TextArea
          id="cv-summary"
          name="summary"
          label={t("section.summary")}
          defaultValue={content.summary}
          rows={5}
          maxLength={SUMMARY_MAX}
        />
        <p className="flex justify-between gap-2 text-xs text-ardoise">
          <span>{t("summary.hint")}</span>
          <span className="tabular-nums">
            {t("summary.counter", { count: content.summary.length, max: SUMMARY_MAX })}
          </span>
        </p>
      </div>
      <Checkbox
        id="cv-show-email"
        name="showEmail"
        value="on"
        defaultChecked={content.info.showEmail}
        label={t("info.showEmail")}
        hint={t("info.contact.hint")}
      />
      <TextField
        id="cv-phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        label={t("info.phone.label")}
        hint={t("info.phone.hint")}
        defaultValue={content.info.phone}
        maxLength={30}
        error={query.erreur === "telephone" ? t("info.phone.invalid") : undefined}
      />
      <button type="submit" className={pillClass("dark", "sm", "h-11 self-start lg:h-9")}>
        {tProfile("save")}
      </button>
    </form>
  );

  return (
    <>
      <PhoneTitle back="/app/career/cv" backLabel={t("phone.back")} title={cv.title} />
      <AppPageHeader eyebrow={tHome("eyebrow")} title={t("title")} className="max-md:sr-only" />
      <WorkshopBar
        cv={{ id: cv.id, title: cv.title, isPrimary: cv.isPrimary }}
        cvs={cvs}
        className="max-md:hidden"
      />
      {notice && <Notice>{notice}</Notice>}
      {error && <Alert tone="error" title={error} />}
      {!included && <Alert tone="error" title={t("template.downgraded", { templateName })} />}

      <PhoneEditorTabs id={cv.id} view={phoneView} />
      {phoneView === "content" && (
        <>
          <PhonePartChips id={cv.id} part={part} parts={phoneParts} />
          {part === "info" && (
            <form
              action={updateCvDetails}
              className="flex flex-col gap-4 rounded-[24px] bg-blanc p-5 shadow-douce md:hidden"
            >
              {detailsHidden("contact")}
              <TextField
                id="cv-phone-title"
                name="title"
                label={t("rename")}
                placeholder={t("name.placeholder")}
                defaultValue={cv.title}
                required
                maxLength={80}
              />
              <Checkbox
                id="cv-phone-show-email"
                name="showEmail"
                value="on"
                defaultChecked={content.info.showEmail}
                label={t("info.showEmail")}
                hint={t("info.contact.hint")}
              />
              <TextField
                id="cv-phone-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                label={t("info.phone.label")}
                hint={t("info.phone.hint")}
                defaultValue={content.info.phone}
                maxLength={30}
                error={query.erreur === "telephone" ? t("info.phone.invalid") : undefined}
              />
              <button type="submit" className={pillClass("dark", "md", "self-start")}>
                {tProfile("save")}
              </button>
            </form>
          )}
          {part === "summary" && (
            <form
              action={updateCvDetails}
              className="flex flex-col gap-3 rounded-[24px] bg-blanc p-5 shadow-douce md:hidden"
            >
              {detailsHidden("summary")}
              <input type="hidden" name="title" value={cv.title} />
              <TextArea
                id="cv-phone-summary"
                name="summary"
                label={t("section.summary")}
                defaultValue={content.summary}
                rows={6}
                maxLength={SUMMARY_MAX}
              />
              <p className="flex justify-between gap-2 text-[14px] text-ardoise">
                <span>{t("summary.hint")}</span>
                <span className="tabular-nums">
                  {t("summary.counter", { count: content.summary.length, max: SUMMARY_MAX })}
                </span>
              </p>
              <button type="submit" className={pillClass("dark", "md", "self-start")}>
                {tProfile("save")}
              </button>
            </form>
          )}
          {part !== "info" && part !== "summary" && (
            <PhoneSection
              id={cv.id}
              section={part}
              content={content}
              visible={sections.find((section) => section.id === part)?.visible ?? true}
              first={listSections.indexOf(part) === 0}
              last={listSections.indexOf(part) === listSections.length - 1}
            />
          )}
        </>
      )}

      <CvPaginationProvider>
        <div
          className="jm-cv-editor grid items-start gap-[18px] min-[900px]:grid-cols-[minmax(0,340px)_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_330px]"
          style={highlightLabels}
        >
          <section
            aria-label={view === "style" ? t("tab.style") : t("tab.content")}
            className={cx(
              "order-2 flex min-w-0 flex-col gap-4 rounded-[24px] bg-blanc p-3.5 min-[900px]:order-1 lg:p-4",
              phoneView !== "style" && "max-md:hidden",
            )}
          >
            <div className="max-md:hidden">
              <ModeSwitch id={cv.id} view={view} />
            </div>
            {view === "style" ? (
              <StylePanel
                documentId={cv.id}
                template={template}
                style={style}
                customError={customError}
              />
            ) : (
              <SectionsPanel
                id={cv.id}
                profileForm={profileForm}
                sections={sections.map((section) => ({
                  id: section.id,
                  visible: section.visible,
                  filled: filled[section.id],
                  count: sectionCounts[section.id],
                }))}
              />
            )}
          </section>

          <section
            aria-labelledby="cv-preview"
            className={cx(
              "order-1 flex min-w-0 flex-col gap-3 min-[900px]:sticky min-[900px]:top-[98px] min-[900px]:order-2",
              phoneView === "content" && "max-md:hidden",
            )}
          >
            <h2 id="cv-preview" className="sr-only">
              {t("tab.preview")}
            </h2>
            <TabRail name="cv-document" className="max-md:hidden">
              <div className="flex w-max gap-1 rounded-pill bg-blanc/70 p-1 ring-1 ring-sapin/6">
                <span
                  className={pillClass("dark", "sm", "pointer-events-none shrink-0")}
                  aria-current="page"
                >
                  {t("tab.preview")}
                </span>
                <Link
                  href="/app/career/documents"
                  className={pillClass("outline", "sm", "shrink-0 bg-transparent ring-0")}
                >
                  {t("tab.letter")}
                </Link>
                <Link
                  href="/app/career/linkedin"
                  className={pillClass("outline", "sm", "shrink-0 bg-transparent ring-0")}
                >
                  {t("tab.linkedin")}
                </Link>
              </div>
            </TabRail>
            {(demo || isEmptyCv(content)) && <Alert tone="info" title={t("empty")} />}
            <Workbench
              labels={{
                pageOf: t("preview.pageOf", { page: "{page}", total: "{total}" }),
                zoomIn: t("preview.zoomIn"),
                zoomOut: t("preview.zoomOut"),
                fullscreen: t("preview.fullscreen"),
                close: tAll("common.close"),
                hint: t("preview.highlightHint"),
                label: t("tab.preview"),
              }}
            >
              <CvPreview data={data} template={template} style={style} label={t("tab.preview")} />
            </Workbench>
          </section>

          <div
            className={cx(
              "order-3 grid min-w-0 items-start gap-[18px] min-[900px]:col-span-2 min-[900px]:grid-cols-3 xl:col-span-1 xl:grid-cols-1",
              phoneView !== "preview" && "max-md:hidden",
            )}
          >
            <CvCoachPanel
              documentId={cv.id}
              score={score}
              coach={coach}
              credits={credits}
              suggestions={suggestions}
              missingKeywords={missingKeywords}
              percents={targets.percents}
              targetTitle={targets.title}
              criteria={<CriteriaBars score={score} dark />}
              outcome={{
                coach: typeof query.coach === "string" ? query.coach : undefined,
                suggestion: typeof query.suggestion === "string" ? query.suggestion : undefined,
              }}
            />
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
            <section
              id="adapter"
              aria-labelledby="cv-tailor"
              className={cx(card, "relative flex scroll-mt-28 flex-col gap-3 lg:p-5")}
            >
              {tailorLocked && tailorPlan && (
                <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-pill bg-nuit px-2.5 py-1 text-[11px] font-semibold text-neon">
                  <Icon name="lock" className="size-3" />
                  {tailorPlan}
                </span>
              )}
              <div className={cx("flex items-start gap-3", tailorLocked && "pr-20")}>
                <Icon name="jobs" className="mt-0.5 size-5 shrink-0" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 id="cv-tailor" className="text-[15px] font-semibold">
                    {t("tailor.text")}
                  </h2>
                  <p className="text-[13px] leading-[18px] text-ardoise">
                    {tailorLocked ? t("tailor.locked", { plan: tailorPlan }) : t("tailor.desc")}
                  </p>
                </div>
              </div>
              {!tailorLocked && (
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
                      <form action={tailorCvAction} className="flex flex-col gap-3">
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
                        <p className="text-xs text-ardoise">
                          {tAll("career.documents.generate.cost", {
                            count: aiFeatures.cv_tailor.credits,
                          })}
                        </p>
                      </form>
                    ))}
                </>
              )}
            </section>
          </div>
        </div>
      </CvPaginationProvider>
      {phoneView === "style" && (
        <p className="text-[15px] text-ardoise md:hidden">{t("phone.neutral")}</p>
      )}
      <MobileActionBar id={cv.id} className="max-md:hidden" />
      <PhoneEditorBar
        id={cv.id}
        view={phoneView}
        next={
          nextPart
            ? `/app/career/cv/${cv.id}?partie=${nextPart.key}`
            : `/app/career/cv/${cv.id}?vue=style`
        }
        fileName={fileName}
        locked={!included}
      />
    </>
  );
}

/** Limit of the CV summary (`updateCvDetails` checks it again). */
const SUMMARY_MAX = 1000;
