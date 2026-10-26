import "server-only";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { addNoteAction } from "@/server/actions/hire";
import { analysisToNoteAction, analyzeCandidateAction } from "@/server/actions/hire-candidates";
import { db } from "@/server/db";
import { can, level } from "@/server/entitlements";
import { describeEvent } from "@/server/hire-history";
import { applicationMatches } from "@/server/matching/service";
import type { MatchExplanation } from "@/server/matching/types";
import { sentAttachments } from "@/server/services/application-attachments";
import {
  ANALYSIS_EVENT,
  analysisReadiness,
  parseAnalysis,
  type AnalysisPoint,
} from "@/server/services/cv-analysis";
import { ensureApplicationConversation } from "@/server/services/connect";
import { visibleNotes } from "@/server/services/evaluation";
import { hirePermissions, recordView, type HireContext } from "@/server/services/hire";
import { undoableDecision } from "@/server/services/hire-candidates";
import {
  highlightsOf,
  phaseOf,
  PROPOSAL_EVENT,
  rhAssignees,
} from "@/server/services/hire-phone-candidatures";
import { screeningAnswersOf } from "@/server/services/screening";
import { PhoneIcon } from "../icon";
import { RhCandidaturesTexts, initialsOf, tintOf } from "./candidatures";
import { RhFile, type RhFileData } from "./candidat-client";

const DAY = 86_400_000;
const MONTH = 30.44 * DAY;

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

const TABS = ["resume", "cv", "reponses", "notes", "historique"] as const;
export type RhFileTab = (typeof TABS)[number];

/**
 * A candidate's file on the recruiter's phone (Modèle B recruteur, M5, planches
 * Recruteur-candidat*): who, the score and its « Pourquoi ? », the stage, then Résumé, CV,
 * Réponses, Notes and Historique. Opening it is logged (golden rule n° 5); every change is a
 * member's gesture, Orbi only notes and reads.
 */
export async function RhCandidate({
  ctx,
  applicationId,
  query,
}: {
  ctx: HireContext;
  applicationId: string;
  query: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations("phoneRhCandidatures");
  const th = await getTranslations("hire");
  const tc = await getTranslations("hireCandidates");
  const format = await getFormatter();
  const now = new Date();
  const application = await recordView(db, ctx, applicationId, now);
  const permissions = hirePermissions(ctx.role);
  const { profile, job } = application;
  const person = profile.user;
  const firstName = (person.firstName || person.name).split(/\s+/)[0]!;
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [
    matchingLevel,
    scorecards,
    notes,
    members,
    interviews,
    org,
    hiddenProofs,
    readiness,
    undo,
  ] = await Promise.all([
    level(db, subject, "hire.matching.level"),
    can(db, subject, "hire.scorecards"),
    visibleNotes(db, ctx, application.events),
    rhAssignees(db, ctx),
    db.interview.findMany({
      where: { applicationId: application.id, status: { in: ["pending", "confirmed", "done"] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        mode: true,
        status: true,
        startsAt: true,
        slots: true,
        organizerId: true,
        participantIds: true,
        application: {
          select: { scorecards: { where: { reviewerId: ctx.userId }, select: { id: true } } },
        },
      },
    }),
    db.organization.findUnique({ where: { id: ctx.organizationId }, select: { name: true } }),
    db.certificate.findMany({
      where: { onProfile: false, enrollment: { userId: profile.userId } },
      select: { code: true },
    }),
    analysisReadiness(db, ctx),
    permissions.manage ? undoableDecision(db, ctx, applicationId, now) : null,
  ]);
  const conversation =
    application.conversation ?? (await ensureApplicationConversation(db, application.id));
  const match =
    matchingLevel === "none"
      ? null
      : await applicationMatches(db, [application], now).then(
          (map) => map.get(application.id) ?? null,
        );
  const explanation: MatchExplanation | null = match && match !== "disabled" ? match : null;
  const actorIds = [
    ...new Set(
      [
        ...application.events.map((event) => event.actorId),
        ...interviews.flatMap((item) => [item.organizerId, ...item.participantIds]),
      ].filter((id): id is string => Boolean(id)),
    ),
  ];
  const actors = new Map(
    (
      await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } })
    ).map((user) => [user.id, user.name]),
  );
  const nameOf = (id: string | null) => (id ? (actors.get(id) ?? "") : "");
  const decided = application.stage.kind === "hired" || application.stage.kind === "rejected";
  const proposed = application.events.some((event) => event.type === PROPOSAL_EVENT);
  const phase = phaseOf(application.stage.kind, proposed && !decided);
  const live = permissions.manage && application.status === "active" && !decided;

  // ─── Who ─────────────────────────────────────────────────────────────────────────
  const months = profile.experiences.reduce(
    (sum, item) =>
      sum + Math.max(0, ((item.endDate ?? now).getTime() - item.startDate.getTime()) / MONTH),
    0,
  );
  const years = Math.floor((months + 0.5) / 12);
  const line1 = [
    profile.headline ?? (profile.experiences.length > 0 ? t("file.years", { count: years }) : null),
    profile.targetJob ? t("file.cap", { job: profile.targetJob }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const when = (date: Date) =>
    now.getTime() - date.getTime() < DAY
      ? format.relativeTime(date, now)
      : format.relativeTime(date, { now, unit: "day" });
  const line2 = [
    person.city,
    t(`file.source.${application.source}`, { when: when(application.createdAt) }),
  ]
    .filter(Boolean)
    .join(" · ");

  // ─── Interviews ──────────────────────────────────────────────────────────────────
  const upcoming = interviews
    .map((item) => ({ ...item, at: item.startsAt ?? item.slots[0] ?? null }))
    .filter((item) => item.at && item.at > now && item.status !== "done")
    .sort((a, b) => a.at!.getTime() - b.at!.getTime())[0];
  const toDocument = scorecards
    ? interviews.find(
        (item) =>
          item.status !== "pending" &&
          item.startsAt &&
          item.startsAt <= now &&
          (item.organizerId === ctx.userId || item.participantIds.includes(ctx.userId)) &&
          item.application.scorecards.length === 0,
      )
    : undefined;
  const slot = (date: Date) =>
    t("file.slot", {
      date: format.dateTime(date, { weekday: "long", day: "numeric", month: "short" }),
      time: format.dateTime(date, { hour: "2-digit", minute: "2-digit" }),
    });

  // ─── The primary button ──────────────────────────────────────────────────────────
  const base = `/app/hire/candidats/${application.id}`;
  const primary: RhFileData["primary"] =
    toDocument && permissions.evaluate
      ? { kind: "link", label: t("file.primary.document"), href: `${base}/evaluation` }
      : !live
        ? null
        : phase === "recue" || phase === "preselection"
          ? { kind: "link", label: t("file.primary.plan"), href: `${base}/entretien` }
          : phase === "entretien"
            ? {
                kind: "link",
                label: t("file.primary.propose"),
                href: `${base}/decision?issue=proposition`,
              }
            : { kind: "recruit", label: t("file.primary.recruit", { name: firstName }) };

  // ─── Résumé ──────────────────────────────────────────────────────────────────────
  const latest = profile.experiences[0] ?? null;
  const { notes: highlights, checks } = highlightsOf(
    explanation,
    latest ? { title: latest.title, company: latest.company } : null,
    job.city,
  );
  const interests = [...profile.sectors, ...profile.desiredJobTitles].slice(0, 4);
  const availability =
    profile.availability === "not_looking"
      ? t("availability.not")
      : profile.availableFrom && profile.availableFrom > now
        ? t("availability.from", { date: profile.availableFrom })
        : profile.availability === "listening"
          ? t("availability.listening")
          : t("availability.now");
  // Orbi reads the file on demand (one credit): points to read, never a decision.
  const analysis = parseAnalysis(
    [...application.events].reverse().find((event) => event.type === ANALYSIS_EVENT)?.payload,
  );
  const analysisLine = (item: AnalysisPoint) =>
    "text" in item ? item.text : tc(`analysis.point.${item.key}`, item.values as never);
  const orbiError = ["consent", "quota", "unavailable", "entitlement"].find(
    (value) => value === one(query.orbi),
  );
  const orbiCard = (
    <section className="nb-rh-f-s" id="orbi" aria-labelledby="rh-f-orbi-t">
      <h2 id="rh-f-orbi-t">{analysis ? tc("analysis.title") : tc("orbiCard.title")}</h2>
      {analysis ? (
        <>
          <p className="nb-rh-f-verif" data-lime="">
            {tc("analysis.strengths")}
          </p>
          <ul className="nb-rh-puces">
            {analysis.strengths.length > 0 ? (
              analysis.strengths.map((item, index) => <li key={index}>{analysisLine(item)}</li>)
            ) : (
              <li>{tc("analysis.none")}</li>
            )}
          </ul>
          <p className="nb-rh-f-verif">{tc("analysis.toVerify")}</p>
          <ul className="nb-rh-puces" data-ambre="">
            {analysis.toVerify.length > 0 ? (
              analysis.toVerify.map((item, index) => <li key={index}>{analysisLine(item)}</li>)
            ) : (
              <li>{tc("analysis.none")}</li>
            )}
          </ul>
          {permissions.evaluate ? (
            <form action={analysisToNoteAction}>
              <input type="hidden" name="application" value={application.id} />
              <button type="submit" className="nb-bs">
                {tc("analysis.toNote")}
              </button>
            </form>
          ) : null}
        </>
      ) : readiness === "entitlement" ? (
        <>
          <p className="nb-meta">{tc("orbiCard.lockedNoPlan")}</p>
          <Link href="/app/abonnement/formules" className="nb-rh-attest">
            {tc("orbiCard.seePlans")}
          </Link>
        </>
      ) : (
        <>
          <p className="nb-meta">{tc("orbiCard.intro")}</p>
          {orbiError === "unavailable" || readiness === "consent" || readiness === "quota" ? (
            <p className="nb-meta" data-ambre="">
              {tc(
                `orbiCard.${orbiError === "unavailable" ? "unavailable" : (readiness as "quota")}`,
              )}
            </p>
          ) : null}
          {readiness === "ready" ? (
            <form action={analyzeCandidateAction}>
              <input type="hidden" name="application" value={application.id} />
              <button type="submit" className="nb-bs">
                {tc("orbiCard.run")}
              </button>
            </form>
          ) : null}
        </>
      )}
    </section>
  );

  const resume = (
    <>
      {highlights.length + checks.length > 0 ? (
        <section className="nb-rh-f-s">
          <h2 className="nb-rh-f-orbi">
            <span className="nb-rh-etoile" aria-hidden />
            {t("file.orbi")}
          </h2>
          {highlights.length > 0 ? (
            <ul className="nb-rh-puces">
              {highlights.map((note, index) => (
                <li key={index}>{t(`notes.${note.key}`, note as never)}</li>
              ))}
            </ul>
          ) : null}
          {checks.length > 0 ? (
            <>
              <p className="nb-rh-f-verif">{t("file.check")}</p>
              <ul className="nb-rh-puces" data-ambre="">
                {checks.map((check, index) => (
                  <li key={index}>{t(`checks.${check.key}`, check as never)}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}
      <section className="nb-rh-f-s">
        <h2>{t("interests")}</h2>
        {interests.length > 0 ? (
          <div className="nb-rh-etiq">
            {interests.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
        <p className="nb-meta">{t("file.availability", { value: availability })}</p>
      </section>
      {upcoming?.at ? (
        <section className="nb-rh-f-s">
          <h2>{t("file.interview")}</h2>
          <Link href={`/app/hire/entretiens/${upcoming.id}`} className="nb-rh-f-rdv">
            <span className="nb-rh-rond-i" aria-hidden>
              <PhoneIcon name="agenda" size={20} />
            </span>
            <span className="nb-rh-res-t">
              <b>{slot(upcoming.at)}</b>
              <span className="nb-meta">
                {[
                  t(`interviews.mode.${upcoming.mode}`),
                  [upcoming.organizerId, ...upcoming.participantIds]
                    .filter((id) => id !== ctx.userId)
                    .map(nameOf)
                    .filter(Boolean)
                    .join(", "),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          </Link>
        </section>
      ) : null}
      {orbiCard}
    </>
  );

  // ─── CV ──────────────────────────────────────────────────────────────────────────
  const hidden = new Set(hiddenProofs.map((item) => item.code));
  const attachments = sentAttachments(application.attachments).filter(
    (item) => item.type !== "certificate" || !hidden.has(item.code),
  );
  const duration = (start: Date, end: Date | null) => {
    const total = Math.max(1, Math.round(((end ?? now).getTime() - start.getTime()) / MONTH));
    return total < 12
      ? t("cv.months", { count: total })
      : t("cv.years", { count: Math.round(total / 12) });
  };
  const cv = (
    <>
      <section className="nb-rh-f-s">
        <h2>{t("cv.experience")}</h2>
        {profile.experiences.length === 0 ? (
          <p className="nb-meta">{t("cv.none")}</p>
        ) : (
          profile.experiences.slice(0, 6).map((item) => (
            <div key={item.id} className="nb-rh-f-xp">
              <b>{item.title}</b>
              <span className="nb-meta">
                {[
                  item.company,
                  duration(item.startDate, item.endDate),
                  String((item.endDate ?? item.startDate).getUTCFullYear()),
                ].join(" · ")}
              </span>
            </div>
          ))
        )}
      </section>
      <section className="nb-rh-f-s">
        <h2>{t("cv.education")}</h2>
        {profile.educations.length === 0 ? (
          <p className="nb-meta">{t("cv.none")}</p>
        ) : (
          profile.educations.slice(0, 4).map((item) => (
            <p key={item.id} className="nb-rh-f-p">
              {t("cv.degree", { degree: item.degree, school: item.school })}
              {item.endYear ? t("cv.year", { year: String(item.endYear) }) : null}
            </p>
          ))
        )}
        {attachments
          .filter((item) => item.type === "certificate")
          .map((item) => (
            <Link
              key={item.type === "certificate" ? item.code : item.title}
              href={item.type === "certificate" ? `/attestations/${item.code}` : "#"}
              className="nb-rh-attest"
            >
              {t("cv.certificate", { title: item.title })}
            </Link>
          ))}
      </section>
      <section className="nb-rh-f-s">
        <h2>{t("cv.skills")}</h2>
        {profile.skills.slice(0, 10).map((item) => (
          <p key={item.id} className="nb-rh-f-comp">
            <span>{item.skill.name}</span>
            <span className="nb-meta" data-lime={item.verified ? "" : undefined}>
              {item.verified ? t("cv.verified") : t("cv.declared")}
            </span>
          </p>
        ))}
      </section>
    </>
  );

  // ─── Réponses et documents ───────────────────────────────────────────────────────
  const answers = screeningAnswersOf(application.screeningAnswers);
  const letter = application.coverLetter?.trim() ?? "";
  const reponses = (
    <>
      {answers.length === 0 && !letter ? (
        <p className="nb-meta nb-rh-f-s">{t("answers.none")}</p>
      ) : null}
      {answers.map((answer) => (
        <section key={answer.id} className="nb-rh-f-s">
          <p className="nb-rh-f-q">{answer.question}</p>
          <p className="nb-rh-f-p">
            {answer.kind === "yesno" && (answer.answer === "yes" || answer.answer === "no")
              ? t(`answers.${answer.answer}`)
              : answer.answer || t("answers.empty")}
          </p>
        </section>
      ))}
      {letter ? (
        <section className="nb-rh-f-s">
          <p className="nb-rh-f-q">{t("answers.letter")}</p>
          <p className="nb-rh-f-p nb-rh-f-lettre">{letter}</p>
        </section>
      ) : null}
      <section className="nb-rh-f-s">
        <h2>{t("answers.documents")}</h2>
        {application.cvSnapshot !== null ? (
          <a href={`${base}/cv`} className="nb-rh-doc">
            <span className="nb-rh-doc-i" data-pdf="">
              {t("answers.pdf")}
            </span>
            <span className="nb-rh-res-t">
              <b>{t("answers.cv")}</b>
              <span className="nb-meta">{t("answers.cvHint")}</span>
            </span>
          </a>
        ) : null}
        {attachments.map((item) =>
          item.type === "certificate" ? (
            <Link key={item.code} href={`/attestations/${item.code}`} className="nb-rh-doc">
              <span className="nb-rh-doc-i" data-ok="" aria-hidden />
              <span className="nb-rh-res-t">
                <b>{item.title}</b>
                <span className="nb-meta">{t("answers.certificateHint")}</span>
              </span>
            </Link>
          ) : (
            <div key={item.title} className="nb-rh-doc">
              <span className="nb-rh-doc-i" aria-hidden />
              <span className="nb-rh-res-t">
                <b>{item.title}</b>
                <span className="nb-meta">{item.text.slice(0, 120)}</span>
              </span>
            </div>
          ),
        )}
        {application.cvSnapshot === null && attachments.length === 0 ? (
          <p className="nb-meta">{t("answers.noDocument")}</p>
        ) : null}
      </section>
    </>
  );

  // ─── Notes ───────────────────────────────────────────────────────────────────────
  const noteText = (payload: unknown) =>
    payload && typeof payload === "object" && "body" in payload
      ? String((payload as { body: unknown }).body ?? "")
      : "";
  const notesPanel = (
    <>
      {permissions.evaluate ? (
        <form action={addNoteAction} className="nb-rh-note-f">
          <input type="hidden" name="application" value={application.id} />
          <input
            name="body"
            required
            minLength={2}
            maxLength={2000}
            aria-label={t("notes_.label")}
            placeholder={t("notes_.placeholder")}
          />
          <button type="submit">{t("notes_.add")}</button>
        </form>
      ) : null}
      <ul>
        {[...notes].reverse().map((note) => (
          <li key={note.id} className="nb-rh-note">
            <span className="nb-rh-ini" data-teinte="n" aria-hidden>
              {initialsOf(nameOf(note.actorId))}
            </span>
            <span className="nb-rh-res-t">
              <span className="nb-rh-note-h">
                <b>{nameOf(note.actorId)}</b>
                <span className="nb-meta">{when(note.createdAt)}</span>
              </span>
              <span className="nb-rh-f-p">{noteText(note.payload)}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="nb-meta nb-rh-f-s">{t("notes_.rule")}</p>
    </>
  );

  // ─── Historique ──────────────────────────────────────────────────────────────────
  const history = (
    <ul className="nb-rh-histo">
      {[...application.events]
        .map((event) => ({ event, line: describeEvent(th, nameOf(event.actorId), event) }))
        .filter((item) => item.line)
        .reverse()
        .map(({ event, line }) => (
          <li key={event.id}>
            <span>{line}</span>
            <span className="nb-meta">{when(event.createdAt)}</span>
          </li>
        ))}
    </ul>
  );

  // ─── Pourquoi ? ──────────────────────────────────────────────────────────────────
  const explainable = matchingLevel === "explainable";
  const why: RhFileData["why"] = explanation
    ? {
        title: t("why.title", { score: explanation.score }),
        line: t(`why.band.${explanation.band}`),
        rows: explainable
          ? explanation.criteria
              .filter((item) => item.status !== "not_applicable" && item.weight > 0)
              .map((item) => ({
                label: t(`why.criteria.${item.key}`),
                value: t("why.points", {
                  points: format.number(Math.round(item.value * item.weight * 10) / 10),
                  weight: item.weight,
                }),
                share: Math.max(0, Math.min(1, item.value)),
              }))
          : [],
        locked: explainable ? null : t("why.locked"),
        notUsed: t("why.notUsed"),
      }
    : null;

  const ok = one(query.ok);
  const toastKey = [
    "deplacee",
    "note",
    "note-orbi",
    "annulee",
    "confie",
    "decision",
    "proposition",
    "document",
    "evaluation",
    "entretien",
  ].find((value) => value === ok);
  const tab =
    TABS.find((value) => value === one(query.onglet)) ??
    (ok === "note" || ok === "note-orbi" ? "notes" : "resume");
  const company = org?.name ?? "";

  const data: RhFileData = {
    id: application.id,
    name: person.name,
    firstName,
    initials: initialsOf(person.name),
    tint: tintOf(application.id),
    line1,
    line2,
    jobTitle: job.title,
    back: `/app/hire/candidats?offre=${job.id}`,
    score: explanation
      ? {
          label: t("percent", { score: explanation.score }),
          value: explanation.score,
          band: t(`why.bandShort.${explanation.band}`),
        }
      : null,
    why,
    stage: { id: application.stage.id, name: application.stage.name },
    stages: job.stages.map((stage) => ({ id: stage.id, name: stage.name, kind: stage.kind })),
    live,
    manage: permissions.manage,
    assignee: application.assignedToId ? nameOf(application.assignedToId) || null : null,
    assigneeId: application.assignedToId,
    members: members.map((member) => ({
      id: member.id,
      name: member.id === ctx.userId ? t("assign.me", { name: member.name }) : member.name,
      initials: initialsOf(member.name),
      sub: [member.title, t("assign.follows", { count: member.follows })]
        .filter(Boolean)
        .join(" · "),
    })),
    planned: upcoming?.at ? slot(upcoming.at) : null,
    primary,
    messageHref: `/app/messages/${conversation.id}`,
    reject: {
      message: t("reject.message", { name: firstName, job: job.title, company }),
    },
    recruit: {
      message: t("recruit.message", { name: firstName, job: job.title, company }),
    },
    notesCount: notes.length,
    tab,
    error: one(query.erreur) ? t("file.error") : null,
    pdfHref: `${base}/dossier`,
    canPdf: permissions.readApplications,
    dueDefault: new Date(now.getTime() + 7 * DAY).toISOString().slice(0, 10),
    // « Annuler » for 10 minutes after a decision (same rule as on a computer).
    undo:
      undo && undo.leftMs > 0
        ? {
            line: tc("done.left", { time: format.relativeTime(now.getTime() + undo.leftMs, now) }),
            button: tc("done.undo"),
          }
        : null,
  };

  return (
    <RhCandidaturesTexts>
      {toastKey ? (
        <ToastOnLoad
          message={
            toastKey === "annulee"
              ? tc("ok.annulee")
              : t(`file.ok.${(toastKey === "note-orbi" ? "note" : toastKey) as "deplacee"}`)
          }
          tone="success"
        />
      ) : null}
      <RhFile
        data={data}
        panels={{ resume, cv, reponses, notes: notesPanel, historique: history }}
      />
    </RhCandidaturesTexts>
  );
}
