import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import {
  CandidateAvatar,
  FileSection,
  ScoreRing,
  StageTrack,
} from "@/components/recruiter/candidates";
import { fileTrack, LetterSheet, MoveSheet, WhySheet } from "@/components/recruiter/file-parts";
import { OpenOnWide } from "@/components/recruiter/open-on-wide";
import { PoolSheet } from "@/components/recruiter/pool-sheet";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { formatDayMonth } from "@/lib/dates";
import { requestDocumentAction, addNoteAction } from "@/server/actions/hire";
import { deleteNoteAction, editNoteAction } from "@/server/actions/hire-advanced";
import {
  analysisToNoteAction,
  analyzeCandidateAction,
  reportAnalysisAction,
} from "@/server/actions/hire-candidates";
import { deliverDueDecisionMails } from "@/server/application-events";
import { db } from "@/server/db";
import { can, level } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { describeEvent, payloadText as text } from "@/server/hire-history";
import { applicationMatches } from "@/server/matching/service";
import type { MatchExplanation } from "@/server/matching/types";
import { reportError } from "@/server/observability";
import { sentAttachments } from "@/server/services/application-attachments";
import { ensureApplicationConversation } from "@/server/services/connect";
import {
  ANALYSIS_EVENT,
  analysisReadiness,
  creditsLeft,
  parseAnalysis,
  skillProofs,
  type AnalysisPoint,
} from "@/server/services/cv-analysis";
import { nextStepOf, RATING_MAX, scorecardView, visibleNotes } from "@/server/services/evaluation";
import { HireError, hirePermissions, recordView } from "@/server/services/hire";
import { candidateList } from "@/server/services/hire-candidates";
import { parseCriteria } from "@/server/services/jobs";
import {
  cheapestPlanWhere,
  levelOf,
  limitOf,
  listPublicPlans,
  orgPlanFor,
} from "@/server/services/plans";
import { screeningAnswersOf, screeningQuestionsOf } from "@/server/services/screening";
import { poolChoices } from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireCandidates.file");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

const MONTH = 30.44 * 86_400_000;
const DAY = 86_400_000;

/**
 * A candidate's file (brief recruteur § 4 item 3, planches recruteur-2 § 2 and r2plus `DOS`,
 * `DOS2`, `ORB_LOCK`): who they are without photo, the score and its « Pourquoi ? », the track of
 * the stages, Orbi's summary (a reading of the file, never a decision), the documents, the skills
 * of the offer with their proof, the answers, the private notes and the history. Opening it is
 * logged (golden rule n° 5). Every change is a human action: « Changer d'étape » at the bottom.
 */
export default async function CandidateFilePage({
  params,
  searchParams,
}: PageProps<"/app/hire/candidats/[applicationId]">) {
  const [{ applicationId }, query] = await Promise.all([params, searchParams]);
  // The old decision links lead to the decision screen.
  if (query.decision === "refus" || query.decision === "acceptation")
    redirect(
      `/app/hire/candidats/${applicationId}/decision?issue=${query.decision === "refus" ? "rejected" : "hired"}`,
    );
  const { user, ctx } = await requireHire(
    `/app/hire/candidats/${applicationId}`,
    "readApplications",
  );
  const t = await getTranslations("hireCandidates");
  const tw = await getTranslations("hireWeb");
  const th = await getTranslations("hire");
  const ti = await getTranslations("hireInterviews");
  const ui = await getTranslations("ui");
  const tq = await getTranslations("hireOffers.questions");
  const format = await getFormatter();
  const now = new Date();
  const application = await recordView(db, ctx, applicationId, now).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  after(() => deliverDueDecisionMails().catch((error) => reportError(error)));
  const permissions = hirePermissions(ctx.role);
  const { profile, job } = application;
  const person = profile.user;
  const firstName = person.firstName || person.name.split(/\s+/)[0]!;
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [
    conversation,
    matchingLevel,
    collaboration,
    scorecards,
    history,
    appointments,
    plans,
    readiness,
    left,
    notes,
  ] = await Promise.all([
    application.conversation ?? ensureApplicationConversation(db, application.id),
    level(db, subject, "hire.matching.level") as Promise<"none" | "suggestions" | "explainable">,
    can(db, subject, "hire.collaboration"),
    can(db, subject, "hire.scorecards"),
    can(db, subject, "hire.decision_history"),
    can(db, subject, "connect.appointments"),
    listPublicPlans(db),
    analysisReadiness(db, ctx),
    creditsLeft(db, ctx),
    visibleNotes(db, ctx, application.events),
  ]);
  const [match, scoreView, dispute, actors, hiddenProofs, pools, steps, order] = await Promise.all([
    matchingLevel === "none"
      ? null
      : applicationMatches(db, [application], now).then((map) => map.get(application.id) ?? null),
    scorecards ? scorecardView(db, ctx, application) : null,
    db.matchDispute.findFirst({
      where: {
        applicationId: application.id,
        notifyRecruiter: true,
        status: { in: ["open", "in_review"] },
      },
      select: { id: true },
    }),
    db.user.findMany({
      where: {
        id: {
          in: [
            ...new Set(
              application.events
                .map((event) => event.actorId)
                .filter((id): id is string => Boolean(id)),
            ),
          ],
        },
      },
      select: { id: true, name: true },
    }),
    // An attestation the talent hid from their profile proves nothing here (refonte talent lot 5).
    db.certificate.findMany({
      where: { onProfile: false, enrollment: { userId: profile.userId } },
      select: { code: true },
    }),
    permissions.manage ? poolChoices(db, ctx, application.profileId) : null,
    fileTrack(application),
    // Web (lot 2): « Candidature 1 sur 24 », in the order of the list of the offer.
    candidateList(db, ctx, { offre: job.id }, now)
      .then((list) => list.visible.map((row) => row.id))
      .catch(() => [] as string[]),
  ]);
  const names = new Map(actors.map((actor) => [actor.id, actor.name]));
  const memberName = (id: string | null) => (id ? (names.get(id) ?? "") : "");
  const explanation: MatchExplanation | null = match && match !== "disabled" ? match : null;
  const score = explanation?.score ?? null;
  const base = `/app/hire/candidats/${application.id}`;
  const decided = application.stage.kind === "hired" || application.stage.kind === "rejected";
  const live = permissions.manage && application.status !== "withdrawn" && !decided;
  const stamp = (date: Date) =>
    th("history.timestamp", {
      date,
      time: format.dateTime(date, { hour: "2-digit", minute: "2-digit" }),
    });
  const when = (date: Date) =>
    now.getTime() - date.getTime() < 2 * DAY
      ? format.relativeTime(date, now)
      : formatDayMonth(date);

  // ─── Who ──────────────────────────────────────────────────────────────────────────
  const months = profile.experiences.reduce(
    (sum, item) =>
      sum + Math.max(0, ((item.endDate ?? now).getTime() - item.startDate.getTime()) / MONTH),
    0,
  );
  const years = Math.floor((months + 0.5) / 12);
  const line = [
    profile.headline,
    profile.experiences.length ? t("file.years", { count: years }) : null,
    person.city,
  ]
    .filter(Boolean)
    .join(" · ");

  // ─── Orbi ─────────────────────────────────────────────────────────────────────────
  const analysisEvent = [...application.events]
    .reverse()
    .find((event) => event.type === ANALYSIS_EVENT);
  const analysis = parseAnalysis(analysisEvent?.payload);
  const analysisLine = (item: AnalysisPoint) =>
    "text" in item ? item.text : t(`analysis.point.${item.key}`, item.values as never);
  const orbiError = ["consent", "quota", "unavailable", "entitlement"].find(
    (value) => value === one(query.orbi),
  );
  const orbiState = analysis
    ? "analysis"
    : orbiError === "unavailable"
      ? "unavailable"
      : readiness === "ready"
        ? "ready"
        : readiness;
  const analysisPlan = cheapestPlanWhere(
    plans,
    ["rh", "company"],
    (plan) => plan.entitlements["hire.cv_analysis"] === "true",
  );
  const planCredits = analysisPlan ? limitOf(analysisPlan, "ai.credits.monthly") : null;
  const matchingPlan = (levels: string[]) =>
    cheapestPlanWhere(plans, ["rh", "company"], (plan) =>
      levels.includes(levelOf(plan, "hire.matching.level")),
    )?.name ?? null;

  // ─── Documents, skills, answers ───────────────────────────────────────────────────
  const letter = application.coverLetter?.trim() ?? "";
  const words = letter ? letter.split(/\s+/).length : 0;
  const hidden = new Set(hiddenProofs.map((item) => `/attestations/${item.code}`));
  const attachments = sentAttachments(application.attachments).filter(
    (item) => item.type !== "certificate" || !hidden.has(`/attestations/${item.code}`),
  );
  const proofs = skillProofs({
    job,
    profile: {
      skills: profile.skills.map((item) => ({
        ...item,
        verified: item.verified && !(item.proofUrl && hidden.has(item.proofUrl)),
      })),
    },
  });
  const proven = proofs.filter((item) => item.proof !== "missing").length;
  const questions = screeningQuestionsOf(job.screeningQuestions);
  const answers = screeningAnswersOf(application.screeningAnswers);
  const criteria = parseCriteria(job.knockoutCriteria);
  const position = order.indexOf(application.id);
  const previous = position > 0 ? order[position - 1] : null;
  const next = position >= 0 && position < order.length - 1 ? order[position + 1] : null;
  const events = application.events
    .map((event) => ({ event, line: describeEvent(th, memberName(event.actorId), event) }))
    .filter((item): item is { event: (typeof application.events)[number]; line: string } =>
      Boolean(item.line),
    )
    .reverse();

  // ─── Toasts ───────────────────────────────────────────────────────────────────────
  const ok = one(query.ok);
  const toast =
    ok === "deplacee"
      ? t("ok.deplacee")
      : ok === "note"
        ? Number(query.mentions) > 0
          ? th("application.notes.mentioned", { count: Number(query.mentions) })
          : t("ok.note")
        : ok === "note-orbi"
          ? t("ok.noteOrbi")
          : ok === "signale"
            ? t("ok.signale")
            : ok === "annulee"
              ? t("ok.annulee")
              : ok === "plus-tard"
                ? t("ok.plusTard", { stage: application.stage.name })
                : ok === "document"
                  ? th("application.requestDocument.sent")
                  : ok === "entretien"
                    ? th("interviews.sent")
                    : ok === "vivier"
                      ? th("pools.addedDone")
                      : ok === "decision"
                        ? th("reject.done")
                        : ok === "evaluation"
                          ? t("ok.evaluation")
                          : null;

  return (
    <div className="t-flux t-rc-dos t-rw-dos">
      {toast && <ToastOnLoad message={toast} tone="success" />}
      <Link href={`/app/hire/candidats?offre=${job.id}`} className="t-rw-crumb t-rw-web">
        <TalentIcon name="suivant" size="xs" />
        {tw("file.crumb", { offer: job.title })}
      </Link>
      <FlowHead
        back={`/app/hire/candidats?offre=${job.id}`}
        backLabel={t("file.back")}
        title={t("file.title")}
        end={
          <SheetButton target="rc-menu" label={t("file.menu")} className="t-bi t-press">
            <TalentIcon name="plus-options" size="s" />
          </SheetButton>
        }
      />
      {one(query.erreur) === "etape" && <Notice tone="err">{t("error.etape")}</Notice>}
      {dispute && <Notice tone="err">{t("why.disputed")}</Notice>}

      <section aria-labelledby="rc-nom" className="t-verre t-rc-top">
        <div className="t-rc-id">
          <CandidateAvatar id={application.id} name={person.name} className="t-l" />
          <div className="t-t">
            <h2 id="rc-nom">{person.name}</h2>
            {line && <p>{line}</p>}
            <div className="t-k">
              {!application.viewedAt && <span className="t-rx-nv">{t("file.new")}</span>}
              {application.status === "withdrawn" && (
                <span className="t-rc-etq t-ret">{t("file.withdrawn")}</span>
              )}
              <span className="t-rc-etq">
                {t("file.applied", { when: when(application.createdAt) })}
              </span>
            </div>
          </div>
          {score !== null && (
            <ScoreRing
              score={score}
              text={ui("percent", { value: score })}
              label={t("file.scoreAria", { score })}
            />
          )}
        </div>
        <StageTrack steps={steps} label={t("file.track")} />
      </section>

      {/* Web: the content on the left, the actions, notes and history on the right (planche
          `.dosw`); on a phone the wrappers step aside and `t-rw-o*` keeps the order of the lot. */}
      <div className="t-rw-g t-rw-d2">
        <div className="t-rw-c">
          {/* ─── Orbi ─── */}
          <section id="orbi" aria-labelledby="rc-orbi-t" className="t-rc-orbi t-rw-o1">
            {orbiState === "entitlement" ? (
              <div className="t-rc-lock">
                <b id="rc-orbi-t">
                  <OrbiMark size={22} />
                  {t("orbiCard.lockedTitle")}
                </b>
                <span>
                  {analysisPlan
                    ? t("orbiCard.locked", { plan: analysisPlan.name, credits: planCredits ?? 0 })
                    : t("orbiCard.lockedNoPlan")}
                </span>
                <Link href="/app/abonnement/formules" className="t-bt t-sec t-s t-press">
                  {analysisPlan
                    ? t("orbiCard.see", { plan: analysisPlan.name })
                    : t("orbiCard.seePlans")}
                </Link>
              </div>
            ) : (
              <>
                <div className="t-h">
                  <OrbiMark size={30} />
                  <div className="t-t">
                    <b id="rc-orbi-t">{t("orbiCard.title")}</b>
                    <span>{t("orbiCard.sub")}</span>
                  </div>
                </div>
                {orbiState === "analysis" && analysis ? (
                  <>
                    <ul className="t-rc-pts">
                      {[
                        ...analysis.strengths
                          .slice(0, 2)
                          .map((item) => ({ item, tone: "t-v" as const })),
                        ...analysis.toVerify
                          .slice(0, 1)
                          .map((item) => ({ item, tone: "t-a" as const })),
                      ].map(({ item, tone }, index) => (
                        <li key={index}>
                          <i aria-hidden className={tone}>
                            {tone === "t-v" ? "✓" : "!"}
                          </i>
                          <span>{analysisLine(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : orbiState === "ready" ? (
                  <>
                    <p>{t("orbiCard.intro")}</p>
                    <form action={analyzeCandidateAction}>
                      <input type="hidden" name="application" value={application.id} />
                      <button type="submit" className="t-bt t-p t-s t-press">
                        <TalentIcon name="orbi" size="xs" />
                        {t("orbiCard.run")}
                      </button>
                    </form>
                  </>
                ) : orbiState === "consent" ? (
                  <p>
                    {t("orbiCard.consent")}{" "}
                    <Link href="/app/parametres/confidentialite">{t("orbiCard.consentLink")}</Link>
                  </p>
                ) : (
                  <p role={orbiState === "unavailable" ? "status" : undefined}>
                    {t(orbiState === "unavailable" ? "orbiCard.unavailable" : "orbiCard.quota")}
                  </p>
                )}
              </>
            )}
            {(score !== null || orbiState === "analysis") && (
              <div className="t-rc-liens">
                {orbiState === "analysis" && (
                  <SheetButton target="rc-analyse" className="t-pq t-press">
                    <TalentIcon name="orbi" size="xs" />
                    {t("orbiCard.open")}
                  </SheetButton>
                )}
                {score !== null && (
                  <SheetButton target="rc-pourquoi" className="t-pq t-press">
                    <TalentIcon name="pourquoi" size="xs" />
                    {t("why.link", { score })}
                  </SheetButton>
                )}
              </div>
            )}
            {match === "disabled" && <p className="t-rc-note">{t("why.disabled")}</p>}
            {matchingLevel === "none" && matchingPlan(["suggestions", "explainable"]) && (
              <p className="t-rc-note">
                {t("why.locked", { plan: matchingPlan(["suggestions", "explainable"]) ?? "" })}
              </p>
            )}
          </section>

          {/* ─── Documents ─── */}
          <div className="t-rc-docs t-rw-o2" role="group" aria-label={t("docs.aria")}>
            {application.cvSnapshot !== null ? (
              <a
                href={`${base}/cv`}
                aria-label={t("docs.cvAria", { name: person.name })}
                className="t-rc-doc t-press"
              >
                <span className="t-pg" aria-hidden>
                  <i className="t-hd" />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="t-t">
                  <TalentIcon name="cv" size="xs" />
                  <span>
                    <b>{t("docs.cv")}</b>
                    {t("docs.cvLine", { date: formatDayMonth(application.createdAt) })}
                  </span>
                </span>
              </a>
            ) : (
              <span className="t-rc-doc t-vide">
                <b>{t("docs.noCv")}</b>
                {t("docs.noCvText")}
              </span>
            )}
            {letter ? (
              <SheetButton
                target="rc-lettre"
                label={t("docs.letterAria", { name: person.name })}
                className="t-rc-doc t-press"
              >
                <span className="t-pg" aria-hidden>
                  <i className="t-hd" />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="t-t">
                  <TalentIcon name="document" size="xs" />
                  <span>
                    <b>{t("docs.letter")}</b>
                    {t("docs.letterLine", { count: words })}
                  </span>
                </span>
              </SheetButton>
            ) : (
              <span className="t-rc-doc t-vide">
                <b>{t("docs.noLetter")}</b>
                {t("docs.optional")}
              </span>
            )}
          </div>

          {/* ─── Skills of the offer ─── */}
          <section aria-labelledby="rc-cpt" className="t-verre t-rc-cpt t-rw-o3">
            <div className="t-hh">
              <h2 id="rc-cpt">{t("skills.title")}</h2>
              {proofs.length > 0 && (
                <span>{t("skills.count", { met: proven, total: proofs.length })}</span>
              )}
            </div>
            {proofs.length === 0 ? (
              <p className="t-rc-note">{t("skills.none")}</p>
            ) : (
              <ul>
                {proofs.map((item) => (
                  <li key={item.skillId}>
                    <b>{item.required ? item.name : t("skills.preferred", { skill: item.name })}</b>
                    <span className={cx("t-pv", `t-${item.proof}`)}>
                      {item.proof === "certificate" && <TalentIcon name="certificat" size="xs" />}
                      {item.proof === "project" && <TalentIcon name="realisation" size="xs" />}
                      {t(`skills.proof.${item.proof}`)}
                    </span>
                    {item.level > 0 && (
                      <span
                        className="t-lv"
                        role="img"
                        aria-label={t("skills.level", { level: Math.min(4, item.level) })}
                      >
                        {[1, 2, 3, 4].map((step) => (
                          <i key={step} className={step <= item.level ? "t-on" : undefined} />
                        ))}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {attachments.length > 0 && (
            <FileSection
              icon={<TalentIcon name="document" size="s" />}
              tone="oppo"
              className="t-rw-o4"
              title={t("docs.joined")}
              aside={String(attachments.length)}
            >
              <ul className="t-rc-joints">
                {attachments.map((item, index) =>
                  item.type === "certificate" ? (
                    <li key={index}>
                      <Link href={`/attestations/${item.code}`} className="t-press">
                        <TalentIcon name="certificat" size="s" />
                        <span className="t-t">
                          <b>{item.title}</b>
                          <span>
                            {t("docs.certificate", {
                              date: formatDayMonth(new Date(item.issuedAt)),
                            })}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ) : (
                    <li key={index}>
                      <details>
                        <summary className="t-press">
                          <TalentIcon name="document" size="s" />
                          <span className="t-t">
                            <b>{item.title}</b>
                            <span>{t("docs.text")}</span>
                          </span>
                        </summary>
                        <p className="whitespace-pre-line">{item.text}</p>
                      </details>
                    </li>
                  ),
                )}
              </ul>
            </FileSection>
          )}

          {/* ─── Answers ─── */}
          <FileSection
            id="reponses"
            icon={<TalentIcon name="document" size="s" />}
            tone="former"
            className="t-rw-o5"
            title={t("answers.title")}
            aside={questions.length ? String(answers.length) : undefined}
          >
            {questions.length === 0 ? (
              <p className="t-rc-note">{t("answers.none")}</p>
            ) : (
              <dl className="t-rc-rep">
                {questions.map((question) => {
                  const answer = answers.find((item) => item.id === question.id);
                  return (
                    <div key={question.id}>
                      <dt>{question.text}</dt>
                      <dd className={cx(!answer && "t-sans")}>
                        {!answer
                          ? t("answers.noAnswer")
                          : answer.kind === "yesno"
                            ? tq(answer.answer === "yes" ? "yes" : "no")
                            : answer.answer}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
            {criteria.length > 0 && (
              <div className="t-rc-ko">
                <b>{t("knockout.title")}</b>
                <ul>
                  {criteria.map((criterion) => (
                    <li key={criterion}>
                      <TalentIcon name="horloge" size="xs" />
                      {criterion}
                    </li>
                  ))}
                </ul>
                <span>{t("knockout.note")}</span>
              </div>
            )}
          </FileSection>

          {/* ─── Evaluation (recruteur lot 4: its own screen, planche r2plus EVAL) ─── */}
          <FileSection
            id="evaluation"
            icon={<TalentIcon name="valider" size="s" />}
            tone="former"
            className="t-rw-o8"
            title={t("evaluation.title")}
            aside={scoreView ? String(scoreView.count) : undefined}
            open={ok === "evaluation"}
          >
            {!scorecards ? (
              <p className="t-rc-note">
                {t("evaluation.locked", { plan: orgPlanFor(plans, "hire.scorecards") })}
              </p>
            ) : (
              <div className="t-ri-evr">
                {scoreView?.mine ? (
                  <p>
                    {t.rich("evaluation.mine", {
                      b: (chunks) => <b>{chunks}</b>,
                      suite: ti(`evaluation.suite.${nextStepOf(scoreView.mine.recommendation)}`),
                    })}
                  </p>
                ) : (
                  <p>{t("evaluation.notYet")}</p>
                )}
                {scoreView && !scoreView.hidden && scoreView.average !== null && (
                  <p>
                    {t("evaluation.team", {
                      count: scoreView.count,
                      average: scoreView.average,
                      max: RATING_MAX,
                    })}
                  </p>
                )}
                {scoreView && scoreView.hidden && scoreView.count > 0 && (
                  <p className="t-rc-note">{t("evaluation.hidden", { count: scoreView.count })}</p>
                )}
                {scoreView && scoreView.pending.length > 0 && (
                  <p className="t-rc-note">
                    {t("evaluation.pending", { names: scoreView.pending.join(", ") })}
                  </p>
                )}
                {permissions.evaluate && (
                  <Link href={`${base}/evaluation`} className="t-bt t-sec t-s t-press">
                    <TalentIcon name="valider" size="xs" />
                    {scoreView?.mine ? t("evaluation.edit") : t("evaluation.open")}
                  </Link>
                )}
              </div>
            )}
          </FileSection>
        </div>
        <div className="t-rw-c">
          {/* ─── The bar of actions (web: the « Actions » card, planche `.act-c`) ─── */}
          <nav aria-label={t("bar.aria")} className="t-verre t-fort t-rc-bar t-rw-o9">
            <h2 className="t-rw-k t-rw-web" aria-hidden>
              {tw("file.actions")}
            </h2>
            {live ? (
              <SheetButton target="rc-etape" className="t-bt t-p t-pl t-press">
                <TalentIcon name="progression" size="s" />
                {t("bar.move")}
              </SheetButton>
            ) : (
              <span className="t-rc-bar-etat">
                {application.status === "withdrawn"
                  ? t("file.withdrawn")
                  : t("bar.decided", { stage: application.stage.name })}
              </span>
            )}
            {live && application.status === "active" && appointments && (
              <Link
                href={`/app/hire/candidats/${application.id}/entretien`}
                aria-label={t("bar.interview")}
                className="t-bi t-press"
              >
                <TalentIcon name="entretien" size="s" />
                <span className="t-rw-web" aria-hidden>
                  {tw("pane.interview")}
                </span>
              </Link>
            )}
            <Link
              href={`/app/messages/${conversation.id}`}
              aria-label={t("bar.message")}
              className="t-bi t-press"
            >
              <TalentIcon name="message" size="s" />
              <span className="t-rw-web" aria-hidden>
                {tw("pane.write")}
              </span>
            </Link>
            <SheetButton target="rc-menu" className="t-bi t-press t-rw-web">
              <TalentIcon name="plus-options" size="s" />
              <span>{tw("file.more")}</span>
            </SheetButton>
          </nav>
          {/* ─── Notes ─── */}
          <FileSection
            id="notes"
            icon={<TalentIcon name="modifier" size="s" />}
            tone="accomp"
            className="t-rw-o6"
            title={t("notes.title")}
            aside={String(notes.length)}
            open={ok === "note" || ok === "note-orbi"}
          >
            {notes.length === 0 ? (
              <p className="t-rc-note">{t("notes.empty")}</p>
            ) : (
              <ul className="t-rc-notes">
                {notes.map((note) => {
                  const mine = note.actorId === user.id;
                  const by = {
                    name: memberName(note.actorId),
                    date: when(note.createdAt),
                  };
                  return (
                    <li key={note.id} className={cx(!mine && "t-autre")}>
                      <p className="whitespace-pre-line">{text(note.payload, "body")}</p>
                      <small>
                        {[
                          t(mine ? "notes.mine" : "notes.other", by),
                          text(note.payload, "editedAt") ? t("notes.edited") : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                      {mine && (
                        <div className="t-rc-note-act">
                          <details>
                            <summary className="t-press">{t("notes.edit")}</summary>
                            <form action={editNoteAction} className="t-rc-note-f">
                              <input type="hidden" name="application" value={application.id} />
                              <input type="hidden" name="note" value={note.id} />
                              <label className="sr-only" htmlFor={`note-${note.id}`}>
                                {t("notes.editLabel")}
                              </label>
                              <textarea
                                id={`note-${note.id}`}
                                name="body"
                                required
                                rows={3}
                                maxLength={2000}
                                defaultValue={text(note.payload, "body")}
                              />
                              <button type="submit" className="t-bt t-p t-s t-press">
                                {t("notes.save")}
                              </button>
                            </form>
                          </details>
                          <details>
                            <summary className="t-press">{t("notes.delete")}</summary>
                            <form action={deleteNoteAction} className="t-rc-note-f">
                              <input type="hidden" name="application" value={application.id} />
                              <input type="hidden" name="note" value={note.id} />
                              <p>{t("notes.deleteConfirm")}</p>
                              <button type="submit" className="t-bt t-sec t-s t-press">
                                {t("notes.deleteSubmit")}
                              </button>
                            </form>
                          </details>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {permissions.evaluate && (
              <form action={addNoteAction} className="t-rc-note-f t-rc-ajout">
                <input type="hidden" name="application" value={application.id} />
                <label htmlFor="rc-note">{t("notes.add")}</label>
                <textarea
                  id="rc-note"
                  name="body"
                  required
                  rows={2}
                  maxLength={2000}
                  placeholder={t("notes.placeholder")}
                />
                <button type="submit" className="t-bt t-sec t-s t-press">
                  <TalentIcon name="plus" size="xs" />
                  {t("notes.submit")}
                </button>
              </form>
            )}
            <p className="t-rc-note">
              {collaboration
                ? t("notes.private")
                : t("notes.solo", { plan: orgPlanFor(plans, "hire.collaboration") })}
            </p>
          </FileSection>

          {/* ─── History ─── */}
          <FileSection
            id="historique"
            icon={<TalentIcon name="horloge" size="s" />}
            tone="oppo"
            className="t-rw-o7"
            title={t("history.title")}
            aside={String(events.length)}
          >
            <ol className="t-rc-hist">
              {events.map(({ event, line: sentence }) => (
                <li key={event.id}>
                  <span>{sentence}</span>
                  <small>{stamp(event.createdAt)}</small>
                </li>
              ))}
            </ol>
            {history ? (
              <a href={`${base}/historique`} className="t-pq t-press">
                <TalentIcon name="telecharger" size="xs" />
                {t("history.export")}
              </a>
            ) : (
              <p className="t-rc-note">
                {th("history.locked", { plan: orgPlanFor(plans, "hire.decision_history") })}
              </p>
            )}
          </FileSection>

          {position >= 0 && order.length > 1 && (
            <nav aria-label={tw("file.pagerAria")} className="t-rw-pager t-rw-web">
              {previous ? (
                <Link
                  href={`/app/hire/candidats/${previous}`}
                  aria-label={tw("file.prev")}
                  className="t-bi t-press t-ri-prec"
                >
                  <TalentIcon name="suivant" size="xs" />
                </Link>
              ) : (
                <span className="t-bi t-off" aria-hidden>
                  <TalentIcon name="suivant" size="xs" />
                </span>
              )}
              <span>{tw("file.pager", { index: position + 1, total: order.length })}</span>
              {next ? (
                <Link
                  href={`/app/hire/candidats/${next}`}
                  aria-label={tw("file.next")}
                  className="t-bi t-press"
                >
                  <TalentIcon name="suivant" size="xs" />
                </Link>
              ) : (
                <span className="t-bi t-off" aria-hidden>
                  <TalentIcon name="suivant" size="xs" />
                </span>
              )}
            </nav>
          )}
        </div>
      </div>
      <OpenOnWide selector=".t-rw-dos details.t-rc-sect" />

      {/* ─── Sheets ─── */}
      {explanation && (
        <WhySheet
          id="rc-pourquoi"
          explanation={explanation}
          matchingLevel={matchingLevel}
          morePlan={matchingPlan(["explainable"])}
        />
      )}

      {analysis && (
        <Sheet
          id="rc-analyse"
          openParam="analyse"
          defaultOpen={one(query.analyse) === "1"}
          title={t("analysis.title")}
          closeLabel={t("analysis.close")}
          className="t-rx-op"
        >
          <div className="t-rc-ana">
            <b>{t("analysis.strengths")}</b>
            {analysis.strengths.length ? (
              <ul>
                {analysis.strengths.map((item, index) => (
                  <li key={index}>{analysisLine(item)}</li>
                ))}
              </ul>
            ) : (
              <p>{t("analysis.none")}</p>
            )}
            <b>{t("analysis.toVerify")}</b>
            {analysis.toVerify.length ? (
              <ul>
                {analysis.toVerify.map((item, index) => (
                  <li key={index}>{analysisLine(item)}</li>
                ))}
              </ul>
            ) : (
              <p>{t("analysis.none")}</p>
            )}
          </div>
          <p className="t-gar">
            <TalentIcon name="cadenas" size="s" />
            <span>
              {[
                analysis.source === "ai" ? t("analysis.guard") : t("analysis.template"),
                left !== null ? t("analysis.credits", { left }) : null,
              ]
                .filter(Boolean)
                .join(" ")}
            </span>
          </p>
          <div className="t-rx-feuille-bts">
            <form action={reportAnalysisAction}>
              <input type="hidden" name="application" value={application.id} />
              <button type="submit" className="t-bt t-sec t-m t-press">
                {t("analysis.report")}
              </button>
            </form>
            {permissions.evaluate && (
              <form action={analysisToNoteAction}>
                <input type="hidden" name="application" value={application.id} />
                <button type="submit" className="t-bt t-p t-m t-press">
                  {t("analysis.toNote")}
                </button>
              </form>
            )}
          </div>
          {/* Web: a question to Orbi from the panel (planche `.op`), in Orbi's own page. */}
          <form action="/app/orbi" className="t-rw-ask t-rw-web">
            <label htmlFor="rc-orbi-q" className="sr-only">
              {tw("file.askLabel")}
            </label>
            <input
              id="rc-orbi-q"
              name="q"
              required
              maxLength={500}
              placeholder={tw("file.ask")}
              autoComplete="off"
            />
            <button type="submit" aria-label={tw("file.askSend")} className="t-bi t-press">
              <TalentIcon name="envoyer" size="xs" />
            </button>
          </form>
        </Sheet>
      )}

      {live && (
        <MoveSheet
          id="rc-etape"
          application={application}
          name={person.name}
          firstName={firstName}
          appointments={appointments}
        />
      )}

      {letter && <LetterSheet id="rc-lettre" name={person.name} letter={letter} />}

      <Sheet id="rc-menu" title={t("menu.title")} closeLabel={t("menu.close")}>
        <div className="t-verre t-liste t-lignes">
          <Link href={`/app/hire/offres/${job.id}`} className="t-li t-press">
            <span className="t-cases t-c1" aria-hidden>
              <TalentIcon name="offre" size="s" />
            </span>
            <span className="t-t">
              <b>{t("menu.offer")}</b>
              <span>{job.title}</span>
            </span>
          </Link>
          {permissions.manage && (
            <Link href={`/app/messages/${conversation.id}?modeles=1`} className="t-li t-press">
              <span className="t-cases t-c2" aria-hidden>
                <TalentIcon name="message" size="s" />
              </span>
              <span className="t-t">
                <b>{t("menu.template")}</b>
              </span>
            </Link>
          )}
          {permissions.manage && application.status !== "withdrawn" && (
            <SheetButton target="rc-document" className="t-li t-press">
              <span className="t-cases t-c3" aria-hidden>
                <TalentIcon name="document" size="s" />
              </span>
              <span className="t-t">
                <b>{t("menu.document")}</b>
              </span>
            </SheetButton>
          )}
          {application.cvSnapshot !== null && (
            <a href={`${base}/cv`} className="t-li t-press">
              <span className="t-cases t-c1" aria-hidden>
                <TalentIcon name="telecharger" size="s" />
              </span>
              <span className="t-t">
                <b>{t("menu.cv")}</b>
              </span>
            </a>
          )}
          {permissions.manage && (
            <SheetButton target="rc-vivier" className="t-li t-press">
              <span className="t-cases t-c3" aria-hidden>
                <TalentIcon name="favori" size="s" />
              </span>
              <span className="t-t">
                <b>{t("menu.pool")}</b>
              </span>
            </SheetButton>
          )}
          {live && (
            <Link href={`${base}/decision`} className="t-li t-press">
              <span className="t-cases t-c2" aria-hidden>
                <TalentIcon name="valider" size="s" />
              </span>
              <span className="t-t">
                <b>{t("menu.decision")}</b>
                <span>{t("move.decisionText")}</span>
              </span>
            </Link>
          )}
        </div>
      </Sheet>

      {permissions.manage && (
        <PoolSheet
          id="rc-vivier"
          profileId={application.profileId}
          back={base}
          pools={pools}
          lockedPlan={orgPlanFor(plans, "hire.shortlist")}
        />
      )}

      {permissions.manage && application.status !== "withdrawn" && (
        <Sheet
          id="rc-document"
          title={th("application.requestDocument.text")}
          closeLabel={t("menu.close")}
          defaultOpen={one(query.erreur) === "document"}
        >
          <form action={requestDocumentAction} className="t-rc-doc-f">
            <input type="hidden" name="application" value={application.id} />
            {one(query.erreur) === "document" && (
              <Notice tone="err">{th("jobForm.error.invalid")}</Notice>
            )}
            <div className="t-champ">
              <label htmlFor="rc-doc-nom">{th("application.requestDocument.name.text")}</label>
              <div className="t-verre t-saisie">
                <input
                  id="rc-doc-nom"
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder={th("application.requestDocument.name.placeholder")}
                />
              </div>
            </div>
            <div className="t-champ">
              <label htmlFor="rc-doc-date">{th("application.requestDocument.due")}</label>
              <div className="t-verre t-saisie">
                <input id="rc-doc-date" name="due" type="date" required />
              </div>
            </div>
            <div className="t-champ">
              <label htmlFor="rc-doc-note">{th("application.requestDocument.note")}</label>
              <div className="t-verre t-saisie">
                <textarea id="rc-doc-note" name="note" rows={3} maxLength={1000} />
              </div>
            </div>
            <p className="t-gar">
              <TalentIcon name="confidentialite" size="s" />
              <span>{th("application.requestDocument.forbidden")}</span>
            </p>
            <div className="t-rx-feuille-bts">
              <button type="submit" className="t-bt t-p t-m t-press">
                {th("application.requestDocument.send")}
              </button>
            </div>
          </form>
        </Sheet>
      )}
    </div>
  );
}
