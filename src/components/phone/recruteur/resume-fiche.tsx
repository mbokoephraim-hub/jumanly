import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { MenuArt } from "@/components/site/menu-art";
import { markCriterionAction, sortGestureAction } from "@/server/actions/hire-tri";
import { db } from "@/server/db";
import { applicationMatches } from "@/server/matching/service";
import type { MatchExplanation } from "@/server/matching/types";
import { sentAttachments } from "@/server/services/application-attachments";
import { ANALYSIS_EVENT } from "@/server/services/cv-analysis";
import {
  hirePermissions,
  HireError,
  recordView,
  rejectReasons,
  type HireContext,
} from "@/server/services/hire";
import { atsBoard } from "@/server/services/hire-ats";
import { rankByClass } from "@/server/services/hire-classes";
import { blindName } from "@/server/services/hire-filters";
import { proposedQuestions } from "@/server/services/hire-interviews";
import { highlightsOf } from "@/server/services/hire-phone-candidatures";
import { isOnHold } from "@/server/services/hire-tri";
import { parseCriteria } from "@/server/services/jobs";
import { candidateSearchSchema, offerCandidates } from "@/server/services/hire-offer-candidates";
import { OrbiDisc, PhoneIcon } from "../icon";
import { RhProposal, type RhProposalTexts } from "./fiche-proposition";
import { RhDecision, type RhDecisionOption } from "./fiche-decision";
import { holdReasons, retainReasons, suggestionOf } from "@/server/services/hire-evaluation";
import { CandidateAbout, CandidateHead } from "../profil/candidate-summary";
import { profileView, ProfileTexts } from "../profil/server";
import { personProfile } from "@/server/services/person-profile";
import { parseCv } from "@/server/services/cv";
import { SwipePager } from "./tri-client";
import { RhUndoGesture } from "./tri";

/** The three parts of a candidate's file (Ephraïm, 03/11/2026). */
export const RH_FILE_PARTS = ["resume", "documents", "score"] as const;
export type RhFilePart = (typeof RH_FILE_PARTS)[number];

/**
 * The summary of a candidate, before any document (« Logique du recrutement », la fiche résumé,
 * Ephraïm 01/11/2026): identity with the flag and the current situation, one sentence, six skills
 * (those of the offer first), a short timeline, the practical points and the documents with their
 * state. The Orbi block (score, class, reasons, gaps, two questions) comes with the matching level
 * of the organization (`hire.matching.level`). Fixed at the bottom: Ne pas retenir · En attente ·
 * Retenir; a horizontal swipe goes to the next candidate in the order of the ranking. Opening it
 * is logged (golden rule n° 5).
 */
export async function RhCandidateSummary({
  ctx,
  jobId,
  applicationId,
  stageId,
  query,
  sortable,
  part = "resume",
  fromList = false,
}: {
  ctx: HireContext;
  jobId: string;
  applicationId: string;
  stageId: string | undefined;
  query: Record<string, string | string[] | undefined>;
  sortable: boolean;
  /** « Résumé · Documents · Score » (Ephraïm, 03/11/2026). */
  part?: RhFilePart;
  /** Opened from « Candidatures »: back there, and the order of application to go next. */
  fromList?: boolean;
}) {
  const t = await getTranslations("phoneRhTri");
  const tf = await getTranslations("phoneRhFiche");
  const tp = await getTranslations("phone");
  const tr = await getTranslations("phoneRhCandidatures");
  const format = await getFormatter();
  const now = new Date();
  const board = await atsBoard(db, ctx, jobId, now);
  const row = board.rows.find((item) => item.id === applicationId);
  if (!row) notFound();
  const application = await recordView(db, ctx, applicationId, now).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const permissions = hirePermissions(ctx.role);
  const { profile, job } = application;
  const person = profile.user;

  // ─── The order of the ranking, inside the stage of the candidate ─────────────────
  // From « Candidatures » (03/11/2026): every person in the order of application (or the order the
  // team chose), never Orbi's; from the pipeline, the ranking inside the stage.
  const sameStage = board.rows.filter(
    (item) => item.stage.name === row.stage.name && item.status === row.status,
  );
  const ranked: { id: string }[] = fromList
    ? (await offerCandidates(db, ctx, jobId, candidateSearchSchema.parse({}))).candidates
    : rankByClass(sameStage);
  const at = ranked.findIndex((item) => item.id === row.id);
  const stageParam = fromList ? "&de=candidatures" : stageId ? `&etape=${stageId}` : "";
  const partParam = part === "resume" ? "" : `&partie=${part}`;
  const hrefOf = (id: string, keep = partParam) =>
    `/app/hire/offres/${jobId}?vue=candidats${stageParam}&fiche=${id}${keep}`;
  const next = at >= 0 && at < ranked.length - 1 ? hrefOf(ranked[at + 1]!.id) : null;
  const previous = at > 0 ? hrefOf(ranked[at - 1]!.id) : null;
  const self = hrefOf(row.id);
  const partHref = (key: RhFilePart) => hrefOf(row.id, key === "resume" ? "" : `&partie=${key}`);
  // « Tri à l'aveugle »: the name and the initials come once the person is retained.
  const masked = board.job.blindSort && application.shortlistedAt === null;
  const list = fromList
    ? `/app/hire/offres/${jobId}`
    : `/app/hire/offres/${jobId}?vue=candidats${stageParam}`;

  // ─── Experiences (all of them) and studies ──────────────────────────────────────
  const year = (date: Date | null) => (date ? String(date.getUTCFullYear()) : t("timeline.today"));
  const confirmed = new Set(
    (
      await db.referenceCheck.findMany({
        where: {
          status: "confirmed",
          experienceId: { in: profile.experiences.map((item) => item.id) },
        },
        select: { experienceId: true },
      })
    ).map((item) => item.experienceId),
  );
  const experiences = profile.experiences.map((item) => ({
    id: item.id,
    title: item.title,
    where: [item.company, item.location].filter(Boolean).join(" · "),
    when: `${year(item.startDate)} – ${year(item.endDate)}`,
    lines: item.description
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 6),
    verified: confirmed.has(item.id),
  }));
  const unverified = experiences.filter((item) => !item.verified).length;
  const educations = profile.educations.map((item) => ({
    id: item.id,
    title: item.degree,
    where: item.school,
    when: item.endYear ? String(item.endYear) : t("timeline.today"),
    diploma: item.kind === "diploma",
    proof: Boolean(item.image),
  }));
  const noProof = educations.filter((item) => item.diploma && !item.proof);
  const diplomasWithoutProof = noProof.length;
  // Orbi names what to add (Ephraïm, 03/11/2026: « expliquer lesquelles »).
  const named = (items: string[]) => items.slice(0, 3).join(", ");
  const unverifiedNames = named(
    experiences.filter((item) => !item.verified).map((item) => item.title),
  );
  const diplomaNames = named(noProof.map((item) => item.title));

  // ─── Documents and their state ───────────────────────────────────────────────────
  const read = application.events.some((event) => event.type === ANALYSIS_EVENT);
  const attachments = sentAttachments(application.attachments);
  const state = (verified: boolean): "verified" | "read" | "received" =>
    verified ? "verified" : read ? "read" : "received";
  const file = `/app/hire/candidats/${row.id}`;
  // « Documents » (Ephraïm, 03/11/2026): one horizontal card per piece, the drawing of « Mes
  // documents » of the talent on the left, the title, one line on what is inside, « Consulter ».
  const cvTitle =
    application.cvSnapshot && typeof application.cvSnapshot === "object"
      ? String((application.cvSnapshot as Record<string, unknown>).title ?? "").trim()
      : "";
  const diplomaRows = profile.educations.filter((item) => item.kind === "diploma");
  const documents: {
    key: string;
    art: "cv" | "letter" | "portfolio" | "certificate" | "document";
    title: string;
    hook: string;
    state: "verified" | "read" | "received" | null;
    href: string;
  }[] = [
    application.coverLetter?.trim()
      ? {
          key: "letter",
          art: "letter" as const,
          title: t("documents.letter"),
          hook: tf("cards.letter"),
          state: state(false),
          href: `${file}?onglet=reponses`,
        }
      : null,
    // « Lettre de motivation, puis CV » (Ephraïm, 03/11/2026): the CV card is always there.
    application.cvSnapshot
      ? {
          key: "cv",
          art: "cv" as const,
          title: cvTitle || t("documents.cv"),
          hook: tf("cards.cv"),
          state: state(false),
          href: `${file}?onglet=cv`,
        }
      : {
          key: "cv",
          art: "cv" as const,
          title: t("documents.cv"),
          hook: tf("cards.cvNone"),
          state: null,
          href: self.replace(/&partie=[a-z]+/, ""),
        },
    profile.portfolioSlug && profile.portfolioPublic && !masked
      ? {
          key: "portfolio",
          art: "portfolio" as const,
          title: tf("documents.portfolio"),
          hook: tf("cards.portfolio"),
          state: null,
          href: `/portfolio/${profile.portfolioSlug}`,
        }
      : null,
    diplomaRows.length > 0
      ? {
          key: "diplomas",
          art: "certificate" as const,
          title: tf("diplomas.title"),
          hook: tf("cards.diplomas", {
            count: diplomaRows.length,
            proofs: diplomaRows.filter((item) => item.image).length,
          }),
          state: null,
          href: `${self.replace(/&partie=[a-z]+/, "")}`,
        }
      : null,
    ...attachments.map((item, index) => ({
      key: `a-${index}`,
      art: item.type === "certificate" ? ("certificate" as const) : ("document" as const),
      title: item.title,
      hook: tf("cards.attachment"),
      // An attestation of Jumanly is checked by its code: it counts as verified.
      state: state(item.type === "certificate"),
      href: `${file}?onglet=reponses`,
    })),
  ].filter((item): item is NonNullable<typeof item> => item !== null);
  const missingAsked = Math.max(0, row.documents.asked - row.documents.received);

  // ─── Orbi ────────────────────────────────────────────────────────────────────────
  const match = board.withScores
    ? await applicationMatches(db, [application], now).then((map) => map.get(application.id))
    : undefined;
  const explanation: MatchExplanation | null = match && match !== "disabled" ? match : null;
  const latest = profile.experiences[0] ?? null;
  const { notes, checks } = highlightsOf(
    explanation,
    latest ? { title: latest.title, company: latest.company } : null,
    job.city,
  );
  const questions = proposedQuestions(application, 2);
  // What the verification proved (« Diplôme vérifié », « 2 référents donnés »).
  const pieces = await db.verificationItem.findMany({
    where: { request: { applicationId: application.id }, receivedAt: { not: null } },
    select: { kind: true, certificateCode: true, checks: true },
  });
  const referents = pieces.filter((item) => item.kind === "referent").length;
  const proofsGained = [
    ...pieces
      .filter((item) => item.kind === "diploma")
      .slice(0, 1)
      .map((item) =>
        item.certificateCode || (Array.isArray(item.checks) && item.checks.length === 0)
          ? t("notes.diplomaVerified")
          : t("notes.diplomaToCheck"),
      ),
    ...(referents > 0 ? [t("notes.referents", { count: referents })] : []),
  ];

  // ─── Elimination criteria ────────────────────────────────────────────────────────
  const criteria = parseCriteria(job.knockoutCriteria);
  const live = sortable && permissions.manage && application.status === "active";
  const onHold = isOnHold(application.events);
  const shortlisted = application.shortlistedAt !== null;

  const gestureForm = (id: string, gesture: string, target: string) => (
    <form id={id} action={sortGestureAction} hidden>
      <input type="hidden" name="application" value={row.id} />
      <input type="hidden" name="job" value={jobId} />
      <input type="hidden" name="gesture" value={gesture} />
      <input type="hidden" name="back" value={target} />
    </form>
  );
  // After « Retenir » or « En attente », the next candidate opens (« trier les 15 »).
  const after = next ?? list;

  // ─── Propositions (Ephraïm, 03/11/2026): a prepared message for what is missing ─────
  const proposalTexts: RhProposalTexts = {
    title: tf("ask.title"),
    lead: tf("ask.lead"),
    label: tf("ask.label"),
    send: tf("ask.send"),
    cancel: tp("cancel"),
    close: tp("close"),
  };
  const company = job.organization.name;
  const proposals = [
    unverified > 0
      ? {
          id: "experiences",
          text: tf("proposals.experiences", { count: unverified }),
          detail: tf("proposals.experiencesDetail", { items: unverifiedNames }),
          action: tf("proposals.experiencesAction"),
          message: tf("messages.experiences", { job: job.title, company, items: unverifiedNames }),
        }
      : null,
    diplomasWithoutProof > 0
      ? {
          id: "diplomes",
          text: tf("proposals.diplomas", { count: diplomasWithoutProof }),
          detail: tf("proposals.diplomasDetail", { items: diplomaNames }),
          action: tf("proposals.diplomasAction"),
          message: tf("messages.diplomas", { job: job.title, company, items: diplomaNames }),
        }
      : null,
    missingAsked > 0
      ? {
          id: "documents",
          text: tf("proposals.missing", { count: missingAsked }),
          detail: tf("proposals.missingDetail"),
          action: tf("proposals.missingAction"),
          message: tf("messages.missing", { job: job.title, company }),
        }
      : null,
    !application.coverLetter?.trim()
      ? {
          id: "lettre",
          text: tf("proposals.letter"),
          detail: tf("proposals.letterDetail"),
          action: tf("proposals.letterAction"),
          message: tf("messages.letter", { job: job.title, company }),
        }
      : null,
    !application.cvSnapshot
      ? {
          id: "cv",
          text: tf("proposals.cv"),
          detail: tf("proposals.cvDetail"),
          action: tf("proposals.cvAction"),
          message: tf("messages.cv", { job: job.title, company }),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);
  const sent = query.demande;
  // The head and « Résumé » are those of the person's profile (Ephraïm, 03/11/2026); the bio and
  // the title are those of the CV sent, else of the profile.
  const row_ = await personProfile(db, ctx.userId, profile.userId, "candidate");
  const view = row_ ? await profileView(row_, { now }) : null;
  const cv = application.cvSnapshot
    ? parseCv(
        (application.cvSnapshot as Record<string, Prisma.JsonValue>).content ??
          application.cvSnapshot,
      )
    : null;
  const cvSummary = cv?.summary?.trim() ?? "";
  const bio = cvSummary ? { title: null, text: cvSummary } : (view?.about ?? null);
  const title = cv?.info.headline?.trim() || profile.headline?.trim() || null;

  // ─── « Évaluation » (Ephraïm, 03/11/2026): Orbi's opinion and reasons, the recruiter decides ──
  const toVerifyLines = [
    ...experiences
      .filter((item) => !item.verified)
      .slice(0, 3)
      .map((item) => tf("eval.verify.experience", { title: item.title })),
    ...noProof.slice(0, 3).map((item) => tf("eval.verify.diploma", { title: item.title })),
    ...(missingAsked > 0 ? [tf("eval.verify.documents", { count: missingAsked })] : []),
    ...(!application.cvSnapshot ? [tf("eval.verify.cv")] : []),
    ...checks
      .filter((item) => item.key === "declared")
      .slice(0, 2)
      .map((item) => tf("eval.verify.skill", { skill: "skill" in item ? item.skill : "" })),
  ];
  const suggestion = suggestionOf({
    orbiClass: explanation ? (row.orbiClass ?? null) : row.orbiClass === "hors" ? "hors" : null,
    toVerify:
      experiences.filter((item) => !item.verified).length + diplomasWithoutProof + missingAsked,
  });
  const criterionRows = (explanation?.criteria ?? []).filter(
    (item) => item.status !== "not_applicable" && item.weight > 0,
  );
  const weakLines = [
    ...(explanation?.missingSkills ?? [])
      .filter((item) => item.importance === "required")
      .slice(0, 3)
      .map((item) => t("orbi.gapSkill", { skill: item.skill })),
    ...criterionRows
      .filter((item) => item.status === "unmet" && !item.key.startsWith("skills"))
      .map((item) => tf("eval.weak.unmet", { label: tr(`why.criteria.${item.key}`) })),
    ...criterionRows
      .filter((item) => item.status === "partial" && !item.key.startsWith("skills"))
      .map((item) => tf("eval.weak.partial", { label: tr(`why.criteria.${item.key}`) })),
    ...row.missedCriteria.map((label) => tf("eval.weak.knockout", { label })),
  ];
  const strongLines = [
    ...notes.slice(0, 3).map((note) => tr(`notes.${note.key}`, note as never)),
    ...proofsGained,
    ...(row.star ? [t("notes.star")] : []),
  ];
  const decisionOptions: RhDecisionOption[] = [
    {
      choice: "retain",
      label: t("actions.retain"),
      line: tf("eval.decision.retainLine"),
      done: shortlisted ? tf("eval.decision.retained") : null,
      reasons: retainReasons.map((value) => ({
        value,
        label: tf(`eval.reasons.retain.${value}`),
      })),
    },
    {
      choice: "hold",
      label: t("actions.hold"),
      line: tf("eval.decision.holdLine"),
      done: onHold ? tf("eval.decision.held") : null,
      reasons: holdReasons.map((value) => ({ value, label: tf(`eval.reasons.hold.${value}`) })),
    },
    {
      choice: "reject",
      label: t("actions.reject"),
      line: tf("eval.decision.rejectLine"),
      done: null,
      reasons: rejectReasons
        .filter((value): value is Exclude<typeof value, "withdrawn"> => value !== "withdrawn")
        .map((value) => ({ value, label: tf(`eval.reasons.reject.${value}`) })),
    },
  ];
  const suggestedLabel = suggestion
    ? decisionOptions.find((item) => item.choice === suggestion.suggestion)!.label
    : null;

  return (
    <SwipePager next={next} previous={previous}>
      <div
        className="nb-page nb-rh-detail nb-rh-fr nb-rh-fp"
        data-classe={row.orbiClass ?? undefined}
      >
        {sent === "envoyee" ? <ToastOnLoad message={tf("ask.sent")} tone="success" /> : null}
        {sent === "erreur" || sent === "vide" ? (
          <ToastOnLoad message={tf("ask.failed")} tone="error" />
        ) : null}
        <header className="nb-rh-barre">
          <Link href={list} className="nb-rh-retour" aria-label={fromList ? tf("back") : t("back")}>
            <PhoneIcon name="retour" size={20} />
          </Link>
          <span className="nb-rh-fp-barre-t">{tf("title")}</span>
        </header>
        <RhUndoGesture query={query} jobId={jobId} back={self} />

        {view ? (
          <ProfileTexts>
            <CandidateHead
              person={view}
              name={masked ? t("blind.name", { index: blindName(at) }) : person.name}
              title={title}
              email={person.email}
              masked={masked}
            />
          </ProfileTexts>
        ) : null}
        {masked ? <p className="nb-meta nb-rh-fp-aveugle">{t("blind.line")}</p> : null}
        {shortlisted || onHold ? (
          <p className="nb-rh-fp-etat">
            <span className="nb-rh-fr-etat" data-etat={shortlisted ? "retenu" : "attente"}>
              {shortlisted ? t("state.retained") : t("state.hold")}
            </span>
          </p>
        ) : null}

        <div className="nb-pf-onglets nb-rh-fp-onglets">
          <nav
            className="nb-pf-seg nb-rh-fp-seg"
            aria-label={tf("parts")}
            style={{ gridTemplateColumns: `repeat(${RH_FILE_PARTS.length}, minmax(0, 1fr))` }}
          >
            <span
              className="nb-pf-ind"
              style={{
                width: `calc((100% - 6px) / ${RH_FILE_PARTS.length})`,
                transform: `translateX(${RH_FILE_PARTS.indexOf(part) * 100}%)`,
              }}
              aria-hidden
            />
            {RH_FILE_PARTS.map((key) => (
              <Link
                key={key}
                href={partHref(key)}
                aria-current={key === part ? "page" : undefined}
                scroll={false}
                replace
              >
                {tf(`part.${key}`)}
              </Link>
            ))}
          </nav>
        </div>

        {part === "resume" && view ? (
          <ProfileTexts>
            <CandidateAbout person={view} bio={bio} />
          </ProfileTexts>
        ) : null}

        {part === "documents" ? (
          <>
            <section className="nb-rh-fd" aria-labelledby="rh-fd-t">
              <h2 id="rh-fd-t" className="nb-rh-co-h">
                {tf("documents.title")}
                <small>{documents.length}</small>
              </h2>
              {documents.length === 0 ? (
                <p className="nb-meta">{t("documents.none")}</p>
              ) : (
                <ul className="nb-rh-fd-liste">
                  {documents.map((item, index) => (
                    <li key={item.key} className="nb-rh-fd-carte" data-art={item.art}>
                      <span className="nb-rh-fd-visuel" aria-hidden>
                        <MenuArt name={item.art} size="lg" />
                      </span>
                      <span className="nb-rh-fd-t">
                        <b>{item.title}</b>
                        <span>{item.hook}</span>
                        <span className="nb-rh-fd-bas">
                          {item.state ? (
                            <span className="nb-rh-fr-doc-etat" data-etat={item.state}>
                              {t(`documents.state.${item.state}`)}
                            </span>
                          ) : (
                            <span />
                          )}
                          <Link
                            href={item.href}
                            className="nb-rh-fd-go"
                            data-premier={index === 0 ? "" : undefined}
                            aria-label={`${tf("cards.open")} · ${item.title}`}
                          >
                            {tf("cards.open")}
                            <PhoneIcon name="chevron" size={14} />
                          </Link>
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {missingAsked > 0 ? (
                <p className="nb-meta" data-ambre="">
                  {t("documents.missing", { count: missingAsked })}
                </p>
              ) : null}
            </section>

            <section className="nb-rh-fp-props" aria-labelledby="rh-fp-props">
              <h2 id="rh-fp-props" className="nb-rh-co-h">
                <OrbiDisc size={26} />
                {tf("proposals.title")}
              </h2>
              {proposals.length === 0 ? (
                <p className="nb-meta">{tf("proposals.none")}</p>
              ) : (
                <ol className="nb-cr-etapes">
                  {proposals.map((item, index) => (
                    <li key={item.id}>
                      {permissions.manage ? (
                        <RhProposal
                          id={item.id}
                          application={row.id}
                          job={jobId}
                          back={self}
                          action={item.action}
                          detail={item.detail}
                          index={index}
                          message={item.message}
                          texts={proposalTexts}
                        />
                      ) : (
                        <p className="nb-meta">{item.detail}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        ) : null}

        {part === "score" ? (
          <>
            {board.withScores ? (
              <section className="nb-rh-ev" aria-labelledby="rh-ev-avis">
                <h2 id="rh-ev-avis" className="nb-rh-co-h">
                  <OrbiDisc size={26} />
                  {t("orbi.title")}
                </h2>
                {explanation ? (
                  <div className="nb-rh-ev-avis" data-classe={row.orbiClass ?? undefined}>
                    <div className="nb-rh-fr-score">
                      <span
                        className="nb-rh-anneau nb-rh-anneau-l"
                        style={{ "--p": explanation.score } as CSSProperties}
                        role="img"
                        aria-label={t("orbi.score", { value: explanation.score })}
                      >
                        <b aria-hidden>{explanation.score}</b>
                      </span>
                      <span className="nb-rh-res-t">
                        <b>{row.orbiClass ? t(`class.${row.orbiClass}`) : null}</b>
                        <span className="nb-meta">
                          {row.orbiClass ? tf(`eval.summary.${row.orbiClass}`) : null}
                        </span>
                      </span>
                    </div>
                    {suggestion && suggestedLabel ? (
                      <p className="nb-rh-ev-sugg" data-choix={suggestion.suggestion}>
                        <b>{tf("eval.suggests", { choice: suggestedLabel })}</b>
                        <span>{tf(`eval.why.${suggestion.why}`)}</span>
                      </p>
                    ) : null}
                    <dl className="nb-rh-fr-notes">
                      <div>
                        <dt>{t("notes.compatibility")}</dt>
                        <dd>{t("notes.percent", { value: explanation.score })}</dd>
                      </div>
                      <div data-etoile={row.star ? "" : undefined}>
                        <dt>{t("notes.potential")}</dt>
                        <dd>
                          {row.star
                            ? t("notes.star")
                            : t("notes.percent", { value: row.potential.value })}
                        </dd>
                      </div>
                      <div data-niveau={row.confidence.after.level}>
                        <dt>{t("notes.confidence")}</dt>
                        <dd>{t(`notes.level.${row.confidence.after.level}`)}</dd>
                      </div>
                    </dl>
                    <p className="nb-meta">{t("orbi.rule")}</p>
                  </div>
                ) : (
                  <p className="nb-meta">{t("orbi.none")}</p>
                )}
              </section>
            ) : (
              <section className="nb-rh-co-ats" aria-labelledby="rh-fp-score">
                <div className="nb-rh-co-affiche" aria-hidden>
                  <OrbiDisc size={64} />
                </div>
                <div className="nb-rh-co-ats-corps">
                  <span className="nb-rh-co-ats-i" aria-hidden>
                    <PhoneIcon name="cadenas" size={22} strong />
                  </span>
                  <div>
                    <h2 id="rh-fp-score">{tf("score.title")}</h2>
                    <p>{tf("score.locked")}</p>
                  </div>
                </div>
                <Link href="/app/hire/abonnement" className="nb-rh-co-ats-go" data-verrou="">
                  {tf("score.upgrade")}
                </Link>
              </section>
            )}

            {criterionRows.length > 0 || criteria.length > 0 ? (
              <section className="nb-rh-ev" aria-labelledby="rh-ev-crit">
                <h2 id="rh-ev-crit" className="nb-rh-co-h">
                  {tf("eval.criteria.title")}
                </h2>
                {criterionRows.length > 0 ? (
                  <ul className="nb-rh-ev-crit">
                    {criterionRows.map((item) => (
                      <li key={item.key} data-statut={item.status}>
                        <span className="nb-rh-ev-signe" aria-hidden>
                          {tf(
                            `eval.criteria.sign.${item.status as "met" | "partial" | "unmet" | "unknown"}`,
                          )}
                        </span>
                        <span>{tr(`why.criteria.${item.key}`)}</span>
                        <b>
                          {tf(
                            `eval.criteria.status.${item.status as "met" | "partial" | "unmet" | "unknown"}`,
                          )}
                        </b>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {criteria.length > 0 ? (
                  <>
                    <p className="nb-rh-f-verif">{t("criteria.title")}</p>
                    <p className="nb-meta">{t("criteria.lead")}</p>
                    <ul className="nb-rh-fr-crit">
                      {criteria.map((label) => {
                        const missed = row.missedCriteria.includes(label);
                        return (
                          <li key={label} data-manque={missed ? "" : undefined}>
                            <span>{label}</span>
                            {live ? (
                              <form action={markCriterionAction}>
                                <input type="hidden" name="application" value={row.id} />
                                <input type="hidden" name="job" value={jobId} />
                                <input type="hidden" name="label" value={label} />
                                <input type="hidden" name="missing" value={missed ? "0" : "1"} />
                                <input type="hidden" name="back" value={self} />
                                <button type="submit" className="nb-rh-fr-crit-b">
                                  {missed ? t("criteria.met") : t("criteria.unmet")}
                                </button>
                              </form>
                            ) : missed ? (
                              <b>{t("criteria.missing")}</b>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : null}
              </section>
            ) : null}

            <section className="nb-rh-ev" aria-labelledby="rh-ev-pourquoi">
              <h2 id="rh-ev-pourquoi" className="nb-rh-co-h">
                {tf("eval.reasonsTitle")}
              </h2>
              <div className="nb-rh-ev-liste" data-ton="pour">
                <p>{tf("eval.strong.title")}</p>
                {strongLines.length > 0 ? (
                  <ul>
                    {strongLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <small className="nb-meta">{tf("eval.strong.none")}</small>
                )}
              </div>
              <div className="nb-rh-ev-liste" data-ton="faible">
                <p>{tf("eval.weak.title")}</p>
                {weakLines.length > 0 ? (
                  <ul>
                    {weakLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <small className="nb-meta">{tf("eval.weak.none")}</small>
                )}
              </div>
              <div className="nb-rh-ev-liste" data-ton="verifier">
                <p>{tf("eval.verify.title")}</p>
                {toVerifyLines.length > 0 ? (
                  <>
                    <ul>
                      {toVerifyLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                    <Link
                      href={`${self.replace(/&partie=[a-z]+/, "")}&partie=documents`}
                      className="nb-rh-ev-lien"
                    >
                      {tf("eval.verify.ask")}
                      <PhoneIcon name="chevron" size={14} />
                    </Link>
                  </>
                ) : (
                  <small className="nb-meta">{tf("eval.verify.none")}</small>
                )}
              </div>
              {explanation ? (
                <>
                  {questions.length > 0 ? (
                    <>
                      <p className="nb-rh-f-verif">{t("orbi.questions")}</p>
                      <ol className="nb-rh-fr-questions">
                        {questions.map((item) => (
                          <li key={item.skill}>
                            {t(`orbi.question.${item.check ? "check" : "proven"}`, {
                              skill: item.skill,
                            })}
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : null}
                </>
              ) : null}
            </section>

            {live ? (
              <section className="nb-rh-ev" aria-labelledby="rh-ev-decision">
                <h2 id="rh-ev-decision" className="nb-rh-co-h">
                  {tf("eval.decision.title")}
                </h2>
                <p className="nb-meta">{tf("eval.decision.lead")}</p>
                <RhDecision
                  application={row.id}
                  job={jobId}
                  back={after}
                  suggested={suggestion?.suggestion ?? null}
                  options={decisionOptions}
                  rejectMessage={tr("reject.message", {
                    name: person.firstName || person.name.split(/\s+/)[0] || "",
                    job: job.title,
                    company,
                  })}
                  texts={{
                    suggested: tf("eval.decision.suggested"),
                    reason: tf("eval.decision.reason"),
                    message: tr("reject.messageLabel"),
                    confirm: {
                      retain: tf("eval.decision.confirm.retain"),
                      hold: tf("eval.decision.confirm.hold"),
                      reject: tr("reject.send"),
                    },
                    cancel: tp("cancel"),
                    close: tp("close"),
                  }}
                />
              </section>
            ) : null}
          </>
        ) : null}

        <p className="nb-meta nb-rh-regle">
          {t("applied", { when: format.relativeTime(application.createdAt, now) })}
        </p>

        {live ? (
          <div className="nb-bas nb-rh-fr-bas">
            {gestureForm(
              `rh-fr-retenir-${row.id}`,
              shortlisted ? "annuler-retenir" : "retenir",
              shortlisted ? self : after,
            )}
            {gestureForm(
              `rh-fr-attente-${row.id}`,
              onHold ? "annuler-attente" : "attente",
              onHold ? self : after,
            )}
            <Link
              href={`/app/hire/candidats/${row.id}/decision?issue=rejected`}
              className="nb-rh-fr-act"
              data-act="non"
            >
              {t("actions.reject")}
            </Link>
            <button
              type="submit"
              form={`rh-fr-attente-${row.id}`}
              className="nb-rh-fr-act"
              data-act="attente"
            >
              {onHold ? t("actions.unhold") : t("actions.hold")}
            </button>
            <button
              type="submit"
              form={`rh-fr-retenir-${row.id}`}
              className="nb-rh-fr-act"
              data-act="oui"
            >
              {shortlisted ? t("actions.unretain") : t("actions.retain")}
            </button>
          </div>
        ) : null}
      </div>
    </SwipePager>
  );
}
