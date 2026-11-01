import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { JobSettings } from "@/components/hire/job-settings";
import { ModerationChanges } from "@/components/hire/moderation-changes";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { CopyRow } from "@/components/recruiter/copy-row";
import { OpenOnWide } from "@/components/recruiter/open-on-wide";
import {
  fileSize,
  OfferSheets,
  OrbiLine,
  PdfRow,
  publicJobUrl,
  statusOf,
} from "@/components/recruiter/offers";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { formatDayMonth } from "@/lib/dates";
import { pauseJobAction, publishOfferAction, resumeJobAction } from "@/server/actions/hire-offers";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { getOrgJob, HireError, hirePermissions } from "@/server/services/hire";
import { isPhone } from "@/server/view";
import { effectiveRights } from "@/server/services/org-team";
import { RhCandidateSummary } from "@/components/phone/recruteur/resume-fiche";
import {
  RhOfferCandidates,
  RhOfferDetail,
  RhOfferPublished,
} from "@/components/phone/recruteur/offres";
import {
  listOffers,
  offerHistory,
  offerPerformance,
  offerStages,
  screeningQuestionsOf,
  type HistoryEvent,
} from "@/server/services/hire-offers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireOffers.detail");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

const historyIcon: Record<HistoryEvent["type"], TalentIconName> = {
  message: "message",
  candidature: "candidats",
  modification: "modifier",
  publication: "valider",
};

function Section({
  icon,
  tone,
  title,
  aside,
  open,
  className,
  children,
}: {
  icon: TalentIconName;
  tone: "former" | "accomp" | "oppo";
  title: string;
  aside?: string;
  open?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <details className={cx("t-verre t-sect", className)} open={open}>
      <summary className="t-sh">
        <span className={cx("t-cases", `t-g-${tone}`)} aria-hidden>
          <TalentIcon name={icon} size="s" />
        </span>
        <b>{title}</b>
        {aside && <small>{aside}</small>}
        <TalentIcon name="suivant" size="s" className="t-chev" />
      </summary>
      <div className="t-sc">{children}</div>
    </details>
  );
}

/**
 * An offer (brief recruteur § 2.7, planche recruteur-1 r4 and r1plus): its head with the status
 * and its actions, three figures, the stages, the description, the application, the skills, the
 * job sheet, the typed history and the performance. Just published, the confirmation screen
 * (planche `PUBLIE`) comes first. The candidates open from the bar at the bottom.
 */
async function OfferPageContent({ params, searchParams }: PageProps<"/app/hire/offres/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx, space } = await requireHire(`/app/hire/offres/${id}`);
  const t = await getTranslations("hireOffers");
  const tl = await getTranslations("learn.documents");
  const format = await getFormatter();
  const now = new Date();
  const job = await getOrgJob(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const permissions = hirePermissions(ctx.role);
  const [offers, history, performance, stages, organization] = await Promise.all([
    listOffers(db, ctx, now),
    offerHistory(db, ctx, job.id),
    offerPerformance(db, ctx, job.id, now),
    offerStages(db, ctx, job.id),
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { logo: true, banner: true },
    }),
  ]);
  const row = offers.find((offer) => offer.id === job.id);
  const figures = row?.figures ?? { applications: 0, unseen: 0, views: 0, interviews: 0 };
  const color = row?.color ?? "c0";
  const org = space.organization.name;
  const status = statusOf(job, now);
  const base = `/app/hire/offres/${job.id}`;
  const place = [
    org,
    job.city,
    t(`contract.${job.contractType}` as "contract.cdi"),
    t(`remote.${job.remote}` as "remote.onsite"),
  ].join(" · ");
  const published = one(query.publiee);

  // ─── Just published (planche PUBLIE + r1plus) ─────────────────────────────────────────
  if (published === "1" || published === "verification") {
    const review = published === "verification" || job.status === "pending_review";
    const initials = org
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return (
      <div className="t-flux t-conf t-rx-publie t-large">
        <div className="t-rw-pub">
          <div>
            <span className="t-rond-ok t-rw-o1">
              <TalentIcon name={review ? "horloge" : "valider"} />
            </span>
            <h1 className="t-h2s t-rw-o2">
              {review ? t("published.reviewTitle") : t("published.title")}
            </h1>
            <p className="t-rw-o3">
              {review
                ? t("published.reviewText", { title: job.title })
                : t("published.text", { title: job.title })}
            </p>
            <div className="t-suite t-rw-o6 w-full">
              {!review && (
                <CopyRow
                  value={publicJobUrl(job.slug)}
                  copied={t("published.copied")}
                  className="t-verre t-press"
                >
                  <span className="t-cases" style={{ background: "var(--g-accomp)" }} aria-hidden>
                    <TalentIcon name="partager" size="s" />
                  </span>
                  {t("published.copy")}
                </CopyRow>
              )}
              <Link href="/app/hire/candidats?vue=talents" className="t-verre t-press">
                <span className="t-cases" style={{ background: "var(--g-oppo)" }} aria-hidden>
                  <TalentIcon name="recherche" size="s" />
                </span>
                {t("published.search")}
              </Link>
            </div>
            <Link href={base} className="t-bt t-p t-pl t-press t-rw-o7 w-full">
              {t("published.see")}
            </Link>
            <Link href="/app/hire/offres" className="t-bt t-txt t-press t-rw-o8">
              {t("published.back")}
            </Link>
          </div>
          <div>
            <div className="t-verre t-rx-ap t-rw-o4 w-full">
              <div className="t-cv">
                <span aria-hidden>
                  {organization.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a 40 px logo
                    <img src={organization.logo} alt="" />
                  ) : (
                    initials
                  )}
                </span>
              </div>
              <div className="t-t">
                <b>{job.title}</b>
                {place}
                <span>
                  {[
                    job.closesAt
                      ? t("published.deadline", { date: formatDayMonth(job.closesAt) })
                      : null,
                    t("published.free"),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            </div>
            <div className="t-verre t-rx-tl t-rw-o5 w-full">
              {review ? (
                <div className="t-at">
                  <i />
                  <div>
                    <b>{t("published.reviewing")}</b>
                    <span>{t("published.reviewingText")}</span>
                  </div>
                </div>
              ) : (
                <div className="t-ok">
                  <i />
                  <div>
                    <b>{t("published.visible")}</b>
                    <span>{t("published.visibleText")}</span>
                  </div>
                </div>
              )}
              <div className={review ? undefined : "t-at"}>
                <i />
                <div>
                  <b>{t("published.first")}</b>
                  <span>{t("published.firstText")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ok = ["enregistree", "pause", "reprise"].find((value) => value === one(query.ok));
  const questions = screeningQuestionsOf(job.screeningQuestions);
  const required = job.skills.filter((item) => item.importance === "required");
  const preferred = job.skills.filter((item) => item.importance === "preferred");
  const maxStage = Math.max(1, ...stages.map((stage) => stage.count));
  const editable = permissions.manage && job.status !== "closed" && job.status !== "archived";
  const draft = ["draft", "rejected", "changes_requested"].includes(job.status);
  const salary = job.salaryMin !== null || job.salaryMax !== null;
  const weekMax = Math.max(1, ...performance.week.map((item) => item.count));
  const percent = (value: number | null) =>
    value === null
      ? t("detail.none")
      : format.number(value, { style: "percent", maximumFractionDigits: 1 });

  // On a computer or a tablet (planche web recruteur-1 § 4): the essentials and « Voir les
  // candidatures » in the head, four figures, then the stages and the content on the left, the
  // performance and the history on the right. On a phone, the order of the mobile lot (`t-rw-oN`).
  const candidatesHref = `/app/hire/candidats?offre=${job.id}`;
  return (
    <div className="t-flux t-large t-rw-od">
      {ok && <ToastOnLoad message={t(`detail.ok.${ok as "pause"}`)} tone="success" />}
      <h1 className="t-web sr-only">{t("detail.title")}</h1>
      <FlowHead
        back="/app/hire/offres"
        backLabel={t("detail.back")}
        title={t("detail.title")}
        end={
          <SheetButton target={`menu-${job.id}`} label={t("detail.menu")} className="t-bi t-press">
            <TalentIcon name="plus-options" size="s" />
          </SheetButton>
        }
      />
      {one(query.limite) && <Notice tone="err">{t("detail.limit")}</Notice>}
      {job.status === "changes_requested" && (
        <ModerationChanges
          job={job}
          fixHref={permissions.manage ? `${base}/modifier?etape=4` : undefined}
        />
      )}
      {job.status === "rejected" && job.moderationReason && (
        <Notice tone="err">{t("card.rejected")}</Notice>
      )}

      <section aria-labelledby="rx-od-t" className={cx("t-verre t-rx-odh", `t-${color}`)}>
        <span className="t-rw-ico t-web" aria-hidden>
          <TalentIcon name="offre" />
        </span>
        <div className="t-rw-x t-rw-odt">
          <div className="t-k">
            <span className={cx("t-rx-stp", status.tone)}>{t(`status.${status.key}`)}</span>
            <span className="t-mt">
              {[
                job.publishedAt
                  ? t("detail.since", { date: formatDayMonth(job.publishedAt) })
                  : null,
                job.closesAt
                  ? t("detail.deadline", { date: formatDayMonth(job.closesAt) })
                  : t("detail.noDeadline"),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          <h2 id="rx-od-t">{job.title}</h2>
          <span className="t-mt">{place}</span>
        </div>
        <div className="t-bts">
          {editable && (
            <Link href={`${base}/modifier`} className="t-bt t-sec t-s t-press">
              <TalentIcon name="modifier" size="xs" />
              <span className="t-lib">{t("detail.edit")}</span>
            </Link>
          )}
          {["published", "paused", "closed"].includes(job.status) && (
            <CopyRow
              value={publicJobUrl(job.slug)}
              copied={t("menu.copied")}
              className="t-bt t-sec t-s t-press"
            >
              <TalentIcon name="partager" size="xs" />
              <span className="t-lib">{t("detail.link")}</span>
            </CopyRow>
          )}
          {permissions.manage && job.status === "published" && (
            <form action={pauseJobAction}>
              <input type="hidden" name="id" value={job.id} />
              <input type="hidden" name="back" value={base} />
              <button type="submit" className="t-bt t-sec t-s t-press">
                <TalentIcon name="horloge" size="xs" />
                <span className="t-lib">{t("detail.pause")}</span>
              </button>
            </form>
          )}
          {permissions.manage && job.status === "paused" && (
            <form action={resumeJobAction}>
              <input type="hidden" name="id" value={job.id} />
              <input type="hidden" name="back" value={base} />
              <button type="submit" className="t-bt t-sec t-s t-press">
                <TalentIcon name="valider" size="xs" />
                <span className="t-lib">{t("detail.resume")}</span>
              </button>
            </form>
          )}
          {permissions.manage && draft && (
            <form action={publishOfferAction}>
              <input type="hidden" name="id" value={job.id} />
              <input type="hidden" name="intent" value="publish" />
              <button type="submit" className="t-bt t-p t-s t-press">
                <TalentIcon name="envoyer" size="xs" />
                <span className="t-lib">{t("detail.republish")}</span>
              </button>
            </form>
          )}
          <SheetButton
            target={`menu-${job.id}`}
            label={t("detail.menu")}
            className="t-bt t-sec t-s t-press t-web"
            anchor
          >
            <TalentIcon name="plus-options" size="xs" />
          </SheetButton>
          {permissions.readApplications && !draft && (
            <Link href={candidatesHref} className="t-bt t-p t-m t-press t-web t-rw-voir">
              <TalentIcon name="candidats" size="s" />
              {t("detail.candidates", { count: figures.applications })}
            </Link>
          )}
        </div>
      </section>

      <dl className="t-verre t-rx-chf" aria-label={t("detail.figures")}>
        {(
          [
            ["applications", figures.applications],
            ["unseen", figures.unseen],
            ["interviews", figures.interviews],
          ] as const
        ).map(([key, value]) => (
          <div key={key}>
            <dt className="sr-only">{t(`card.${key}`, { count: value })}</dt>
            <dd>
              <b>{value}</b>
              <span aria-hidden>{t(`card.${key}`, { count: value })}</span>
            </dd>
          </div>
        ))}
        <div className="t-web">
          <dt className="sr-only">{t("card.views", { count: figures.views })}</dt>
          <dd>
            <b>{format.number(figures.views)}</b>
            <span aria-hidden>{t("card.views", { count: figures.views })}</span>
          </dd>
        </div>
      </dl>

      <div className="t-rw-g t-rw-odg">
        <div className="t-rw-c">
          {stages.length > 0 && (
            <Section
              icon="candidats"
              tone="accomp"
              title={t("detail.stages")}
              open
              className="t-rw-o2"
            >
              <ul className="t-rx-etp">
                {stages.map((stage) => (
                  <li key={stage.id}>
                    <div>
                      <span className="sr-only">
                        {t("detail.stageCount", { stage: stage.name, count: stage.count })}
                      </span>
                      <span aria-hidden>{stage.name}</span>
                      <span className="t-br" aria-hidden>
                        <i style={{ width: `${Math.round((stage.count / maxStage) * 100)}%` }} />
                      </span>
                      <b aria-hidden>{stage.count}</b>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section
            icon="document"
            tone="former"
            title={t("detail.description")}
            className="t-rw-o3"
          >
            {job.description ? (
              <p className="text-[13px] whitespace-pre-line">{job.description}</p>
            ) : (
              <p className="t-aide">{t("form.preview.empty")}</p>
            )}
            {job.responsibilities.length > 0 && (
              <ul className="list-disc pl-5 text-[13px]">
                {job.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            icon="candidature"
            tone="accomp"
            title={t("detail.candidature")}
            className="t-rw-o4"
            aside={t("detail.candidatureAside", {
              documents: job.requestedDocuments.length,
              questions: questions.length,
              both: job.requestedDocuments.length > 0 && questions.length > 0 ? "yes" : "no",
            })}
          >
            {job.requestedDocuments.length > 0 && (
              <div className="t-rx-chx">
                {job.requestedDocuments.map((kind) => (
                  <span key={kind}>{t(`form.document.${kind as "cv"}`)}</span>
                ))}
              </div>
            )}
            {questions.length > 0 && (
              <ul className="t-rx-qs">
                {questions.map((question) => (
                  <li key={question.id} className="t-rx-q">
                    <span className="t-t">
                      {question.text}
                      <small>
                        {t("form.questionLine", { kind: t(`form.questionKind.${question.kind}`) })}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {job.applicationInstructions && (
              <p className="text-[13px]">{job.applicationInstructions}</p>
            )}
            <p className="t-gar">
              <TalentIcon name="valider" size="s" />
              <span>{t("form.free")}</span>
            </p>
          </Section>

          <Section
            icon="cap"
            tone="oppo"
            title={t("detail.skills")}
            aside={String(job.skills.length)}
            className="t-rw-o5"
          >
            <div className="t-comp">
              {required.map((item) => (
                <span key={item.skillId} className="t-v">
                  {item.skill.name}
                </span>
              ))}
              {preferred.map((item) => (
                <span key={item.skillId}>{item.skill.name}</span>
              ))}
            </div>
          </Section>

          {job.jobSheetName && (
            <Section
              icon="document"
              tone="accomp"
              title={t("detail.sheet")}
              className="t-rw-o6"
              aside={t("detail.sheetAside", { pages: job.jobSheetPages ?? 1 })}
            >
              <PdfRow
                bare
                name={job.jobSheetName}
                badge={t("sheet.pdf")}
                line={t("form.sheetLine", {
                  pages: job.jobSheetPages ?? 1,
                  size: fileSize(job.jobSheetSize ?? 0, tl),
                })}
              >
                <Link
                  href={`${base}/fiche`}
                  className="t-bt t-sec t-s t-press"
                  aria-label={t("form.sheetReadAria", { name: job.jobSheetName })}
                >
                  {t("form.sheetRead")}
                </Link>
              </PdfRow>
            </Section>
          )}
        </div>
        <div className="t-rw-c">
          <Section
            icon="progression"
            tone="former"
            title={t("detail.performance")}
            aside={t("detail.performanceAside")}
            className="t-rw-o8"
          >
            <dl className="t-rx-chf t-nu">
              <div>
                <dt className="sr-only">{t("detail.views", { count: performance.views })}</dt>
                <dd>
                  <b>{format.number(performance.views)}</b>
                  <span aria-hidden>{t("detail.views", { count: performance.views })}</span>
                </dd>
              </div>
              <div>
                <dt className="sr-only">{t("detail.applied")}</dt>
                <dd>
                  <b>{percent(performance.applied)}</b>
                  <span aria-hidden>{t("detail.applied")}</span>
                </dd>
              </div>
              <div>
                <dt className="sr-only">{t("detail.response")}</dt>
                <dd>
                  <b>
                    {performance.responseDays === null
                      ? t("detail.none")
                      : t("detail.days", { days: format.number(performance.responseDays) })}
                  </b>
                  <span aria-hidden>{t("detail.response")}</span>
                </dd>
              </div>
            </dl>
            <div
              className="t-rx-sem"
              role="img"
              aria-label={t("detail.chart", {
                list: performance.week
                  .map(
                    (item) =>
                      `${format.dateTime(item.day, { weekday: "long", timeZone: "UTC" })} ${item.count}`,
                  )
                  .join(", "),
              })}
            >
              {performance.week.map((item, index) => (
                <div key={item.day.toISOString()} className={cx(index === 6 && "t-on")}>
                  <i
                    style={{ height: `${Math.max(4, Math.round((item.count / weekMax) * 100))}%` }}
                  />
                  {format.dateTime(item.day, { weekday: "narrow", timeZone: "UTC" })}
                </div>
              ))}
            </div>
            <p className="t-rx-note">{t("detail.chartNote")}</p>
          </Section>
          <Section
            icon="horloge"
            tone="accomp"
            title={t("detail.history")}
            aside={String(history.length)}
            className="t-rw-o7"
          >
            {history.length === 0 ? (
              <p className="t-aide">{t("detail.historyEmpty")}</p>
            ) : (
              <ol className="t-rx-hist">
                {history.map((event, index) => {
                  const values: Record<string, string | number> = {
                    ...event.values,
                    actor: event.values.actor || t("history.team"),
                  };
                  if (event.values.date) values.date = formatDayMonth(new Date(event.values.date));
                  if (event.values.count) values.count = Number(event.values.count);
                  return (
                    <li key={`${event.at.getTime()}-${index}`}>
                      <span className={cx("t-k", `t-${event.type}`)} aria-hidden>
                        <TalentIcon name={historyIcon[event.type]} size="s" />
                      </span>
                      <div className="t-t">
                        {t(`history.${event.key}` as "history.published", values as never)}
                        <small>
                          {format.dateTime(event.at, {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                        {event.text && (
                          <div className="t-rx-bul">{t("history.quote", { text: event.text })}</div>
                        )}
                      </div>
                      <span className={cx("t-rx-ty", `t-${event.type}`)}>
                        {t(`history.type.${event.type}`)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </Section>
          <div className="t-rw-o1 empty:hidden">
            {job.status === "pending_review" ? (
              <OrbiLine>{t("detail.orbiReview")}</OrbiLine>
            ) : (
              !salary &&
              editable && (
                <OrbiLine
                  action={
                    <Link href={`${base}/modifier?etape=1`} className="t-bt t-sec t-s t-press">
                      {t("detail.orbiSalaryAction")}
                    </Link>
                  }
                >
                  {t("detail.orbiSalary")}
                </OrbiLine>
              )
            )}
          </div>
        </div>
      </div>

      {/* Who follows the offer and its evaluation grid (moved from the old pipeline, lot 3). */}
      {permissions.manage && !draft && (
        <div className="t-rw-o9">
          <JobSettings ctx={ctx} job={job} ok={one(query.ok)} error={one(query.erreur)} />
        </div>
      )}

      {permissions.readApplications && !draft && (
        <div className="t-verre t-fort t-bas-f t-mob">
          <Link href={candidatesHref} className="t-bt t-p t-pl t-press">
            <TalentIcon name="candidats" size="s" />
            {t("detail.candidates", { count: figures.applications })}
          </Link>
        </div>
      )}
      <OpenOnWide selector=".t-rw-od details.t-sect" />
      <OfferSheets
        job={{ ...job, figures }}
        back={base}
        manage={permissions.manage}
        readApplications={permissions.readApplications}
        withView={false}
      />
    </div>
  );
}

/**
 * On a phone (Modèle B recruteur, lot M4): the offer and its figures (planche
 * Recruteur-offre-detail), its candidates (`?vue=candidats`), or « Votre offre est en ligne »
 * right after publication (`?publiee=1`).
 */
async function PhoneOffer({ params, searchParams }: PageProps<"/app/hire/offres/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx, space } = await requireHire(`/app/hire/offres/${id}`);
  const now = new Date();
  const job = await getOrgJob(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const permissions = hirePermissions(ctx.role);
  const sortable = permissions.manage && effectiveRights(space.role, space.rights).sort;
  const published = one(query.publiee);
  if (published === "1" || published === "verification")
    return (
      <RhOfferPublished
        job={job}
        review={published === "verification" || job.status === "pending_review"}
      />
    );
  const offers = await listOffers(db, ctx, now);
  const figures = offers.find((offer) => offer.id === job.id)?.figures ?? {
    applications: 0,
    unseen: 0,
    views: 0,
    interviews: 0,
  };
  const fiche = one(query.fiche);
  if (one(query.vue) === "candidats" && permissions.readApplications && fiche)
    return (
      <RhCandidateSummary
        key={fiche}
        ctx={ctx}
        jobId={job.id}
        applicationId={fiche.slice(0, 60)}
        stageId={one(query.etape)}
        query={query}
        sortable={sortable}
      />
    );
  if (one(query.vue) === "candidats" && permissions.readApplications)
    return (
      <RhOfferCandidates
        query={query}
        sortable={sortable}
        key={`${one(query.etape) ?? ""}-${one(query.classe) ?? ""}-${one(query.cible) ?? ""}`}
        ctx={ctx}
        jobId={job.id}
        unseen={figures.unseen}
        stageId={one(query.etape)}
        orbiClass={one(query.classe)}
      />
    );
  const ok = (["pause", "reprise"] as const).find((value) => value === one(query.ok));
  const tl = await getTranslations("hireOffers.list");
  return (
    <>
      {ok && <ToastOnLoad message={tl(`ok.${ok}`)} tone="success" />}
      <RhOfferDetail
        ctx={ctx}
        job={job}
        figures={figures}
        org={space.organization.name}
        manage={permissions.manage}
        period={one(query.jours) === "30" ? 30 : 7}
        openReport={one(query.rapport) === "1"}
        notice={one(query.limite) ? tl("limit") : undefined}
        now={now}
      />
    </>
  );
}

export default async function OfferPage(props: PageProps<"/app/hire/offres/[id]">) {
  if (await isPhone()) return <PhoneOffer {...props} />;
  return <OfferPageContent {...props} />;
}
