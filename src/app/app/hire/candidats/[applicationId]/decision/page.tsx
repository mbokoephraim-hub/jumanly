import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { CandidateAvatar, ScoreRing, StageTrack } from "@/components/recruiter/candidates";
import { DecisionMessage, UndoCountdown } from "@/components/recruiter/candidates-client";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { pickMessages } from "@/i18n/client-messages";
import { cx } from "@/lib/cx";
import { defaultTimeZone, formatDayMonth } from "@/lib/dates";
import { zoneLabel } from "@/lib/interview-calendar";
import {
  decideAction,
  laterDecisionAction,
  undoDecisionAction,
} from "@/server/actions/hire-candidates";
import { db } from "@/server/db";
import { can, level } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { isPhone } from "@/server/view";
import { RhProposal } from "@/components/phone/recruteur/proposition";
import { applicationMatches } from "@/server/matching/service";
import { RATING_MAX, scorecardView } from "@/server/services/evaluation";
import { getOrgApplication, HireError, rejectReasons } from "@/server/services/hire";
import {
  DECISION_UNDO_MS,
  decisionOutcomes,
  decisionStageOf,
  laterStage,
  stillToDecide,
  undoableDecision,
} from "@/server/services/hire-candidates";
import {
  decisionParagraphs,
  fillTemplate,
  highlightSegments,
  organizationTemplate,
  strongestSkill,
  templateTones,
  tidyText,
  type TemplateTone,
} from "@/server/services/message-templates";
import { ARRIVAL_CALL_MINUTES, SLOTS_MAX } from "@/server/services/interviews";
import { listPools } from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireCandidates.decision");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

const outcomeIcon = { hired: "valider", rejected: "fermer", withdrawn: "deconnexion" } as const;

/**
 * « Décision finale » (brief recruteur § 4 item 3, planche r2plus `DECIS` and `DECIS_OK`): the
 * result chosen by the member, the message Orbi prepared from the templates (the values filled in
 * highlighted, the tone to change, the text to edit), the pool, and « Confirmer et envoyer ».
 * Nothing is chosen in advance and nothing leaves without the member's click; for 10 minutes the
 * decision can be undone, and the e-mail to the talent waits until then.
 */
export default async function DecisionPage({
  params,
  searchParams,
}: PageProps<"/app/hire/candidats/[applicationId]/decision">) {
  const [{ applicationId }, query] = await Promise.all([params, searchParams]);
  const fileHref = `/app/hire/candidats/${applicationId}`;
  const page = `${fileHref}/decision`;
  const { user, space, ctx } = await requireHire(page, "manage");
  const t = await getTranslations("hireCandidates");
  const tw = await getTranslations("hireWeb.decision");
  const th = await getTranslations("hire");
  const ui = await getTranslations("ui");
  const now = new Date();
  const [found, application] = await Promise.all([
    undoableDecision(db, ctx, applicationId, now),
    getOrgApplication(db, ctx, applicationId),
  ]).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const person = application.profile.user;
  const firstName = person.firstName || person.name.split(/\s+/)[0]!;
  const job = application.job;
  const decided =
    application.stage.kind === "hired" ||
    application.stage.kind === "rejected" ||
    application.status === "withdrawn";
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const messages = await getMessages();

  // On the recruiter's phone (Modèle B recruteur M5): « Faire une proposition »; the outcomes are
  // decided from the file (its sheets « Ne pas retenir » and « Recruter »).
  if (await isPhone()) {
    if (decided || one(query.issue) !== "proposition") redirect(fileHref);
    return (
      <RhProposal
        application={{ id: application.id, firstName, job: job.title }}
        company={space.organization.name}
        error={Boolean(one(query.erreur))}
      />
    );
  }

  // ─── « Décision enregistrée » ─────────────────────────────────────────────────────
  if (one(query.enregistree) === "1" || decided) {
    if (!found) redirect(fileHref);
    const payload = found.payload;
    const deadline = new Date(found.event.createdAt.getTime() + DECISION_UNDO_MS);
    const open = found.leftMs > 0;
    const others = await stillToDecide(db, ctx, job.id, application.id, now);
    const matching = await level(db, subject, "hire.matching.level");
    const matches =
      matching === "none" ? new Map<string, never>() : await applicationMatches(db, others, now);
    const error = one(query.erreur);
    // Web (lot 2): what the talent received and the pool, under the confirmation. Both are read
    // through the application of this organization only.
    const [sent, pool] = await Promise.all([
      payload.messageId
        ? db.message.findFirst({
            where: {
              id: payload.messageId,
              hiddenAt: null,
              conversation: { applicationId: application.id, organizationId: ctx.organizationId },
            },
            select: { body: true },
          })
        : null,
      payload.poolAddedId
        ? db.talentPool.findFirst({
            where: { id: payload.poolAddedId, organizationId: ctx.organizationId },
            select: { id: true, name: true, _count: { select: { entries: true } } },
          })
        : null,
    ]);
    return (
      <div className="t-flux t-conf t-rc-fait t-rw-fait">
        <div className="t-rw-ok">
          <div>
            <span className="t-rond-ok">
              <TalentIcon name="valider" />
            </span>
            <h1 className="t-h2s">{t("done.title")}</h1>
            <p>
              {payload.outcome === "withdrawn"
                ? t("done.textWithdrawn", { name: person.name })
                : t("done.text", {
                    name: person.name,
                    stage: payload.to ?? application.stage.name,
                  })}
            </p>
            {error === "delai" && <Notice tone="err">{t("done.expired")}</Notice>}
            {error === "annulation" && <Notice tone="err">{t("done.undoError")}</Notice>}
            <ul className="t-verre t-rc-chk">
              <li>
                <span className="t-o" aria-hidden>
                  <TalentIcon name="valider" size="xs" />
                </span>
                {payload.messageId ? t("done.message", { firstName }) : t("done.noMessage")}
              </li>
              {payload.poolName && (
                <li>
                  <span className="t-o" aria-hidden>
                    <TalentIcon name="valider" size="xs" />
                  </span>
                  {t("done.pool", { name: payload.poolName })}
                </li>
              )}
              <li>
                <span className="t-o" aria-hidden>
                  <TalentIcon name="valider" size="xs" />
                </span>
                {t("done.history")}
              </li>
              {open && payload.mail === "pending" && (
                <li>
                  <span className="t-o t-g" aria-hidden>
                    <TalentIcon name="notification" size="xs" />
                  </span>
                  {t("done.mail", { firstName })}
                </li>
              )}
              <li>
                <span className="t-o t-g" aria-hidden>
                  <TalentIcon name="horloge" size="xs" />
                </span>
                <NextIntlClientProvider messages={pickMessages(messages, ["hireCandidates"])}>
                  {open ? <UndoCountdown deadline={deadline.toISOString()} /> : t("done.over")}
                </NextIntlClientProvider>
              </li>
            </ul>
          </div>
          <div>
            {others.length > 0 && (
              <>
                <h2 className="t-ck-t t-rc-encore">{t("done.next")}</h2>
                <ul className="t-rc-minis">
                  {others.map((other) => {
                    const match = matches.get(other.id);
                    const score = match && match !== "disabled" ? match.score : null;
                    const interview = other.interviews[0]?.startsAt;
                    return (
                      <li key={other.id}>
                        <Link
                          href={`/app/hire/candidats/${other.id}`}
                          className="t-verre t-rc-mini t-press"
                        >
                          <CandidateAvatar id={other.id} name={other.profile.user.name} />
                          <span className="t-t">
                            <b>{other.profile.user.name}</b>
                            <span>
                              {[
                                interview
                                  ? t("done.interviewed", { date: formatDayMonth(interview) })
                                  : other.stage.name,
                                other._count.scorecards
                                  ? t("done.evaluated", { count: other._count.scorecards })
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                          {score !== null && (
                            <ScoreRing
                              score={score}
                              size="s"
                              text={ui("percent", { value: score })}
                              label={t("file.scoreAria", { score })}
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <div className="t-rc-fait-bts">
              {open && (
                <form action={undoDecisionAction}>
                  <input type="hidden" name="application" value={application.id} />
                  <button type="submit" className="t-bt t-sec t-m t-press">
                    {t("done.undo")}
                  </button>
                </form>
              )}
              {others[0] ? (
                <Link href={`/app/hire/candidats/${others[0].id}`} className="t-bt t-p t-m t-press">
                  {t("done.nextCandidate")}
                </Link>
              ) : (
                <Link href={`/app/hire/candidats?offre=${job.id}`} className="t-bt t-p t-m t-press">
                  {t("done.back")}
                </Link>
              )}
            </div>
          </div>
        </div>

        {(sent || pool) && (
          <div className="t-rw-g t-rw-recu t-rw-web">
            {sent && (
              <section aria-labelledby="rw-recu" className="t-rw-c">
                <h2 id="rw-recu" className="t-rw-k">
                  {tw("received", { firstName })}
                </h2>
                <div className="t-verre t-rw-msg">
                  <p className="t-rw-k">
                    <TalentIcon name="message" size="xs" />
                    {tw("receivedFrom", { company: space.organization.name, job: job.title })}
                  </p>
                  <p className="whitespace-pre-line">{sent.body}</p>
                </div>
              </section>
            )}
            {pool && (
              <section aria-labelledby="rw-vivier" className="t-rw-c">
                <h2 id="rw-vivier" className="t-rw-k">
                  {tw("pool")}
                </h2>
                <Link
                  href={`/app/hire/viviers/${pool.id}`}
                  aria-label={tw("poolOpen", { name: pool.name })}
                  className="t-verre t-rc-sugg t-press"
                >
                  <TalentIcon name="favori" size="s" />
                  <span className="t-t">
                    <b>{pool.name}</b>
                    <span>{tw("poolCount", { count: pool._count.entries })}</span>
                  </span>
                  <TalentIcon name="suivant" size="s" />
                </Link>
              </section>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── The choice and the message ───────────────────────────────────────────────────
  const outcome = decisionOutcomes.find((value) => value === one(query.issue)) ?? null;
  const [matching, scorecards, shortlist, interview, appointments] = await Promise.all([
    level(db, subject, "hire.matching.level"),
    can(db, subject, "hire.scorecards"),
    can(db, subject, "hire.shortlist"),
    db.interview.findFirst({
      where: {
        applicationId: application.id,
        organizationId: ctx.organizationId,
        startsAt: { not: null },
      },
      orderBy: { startsAt: "desc" },
      select: { startsAt: true },
    }),
    can(db, subject, "connect.appointments"),
  ]);
  // « Proposer un appel » with the acceptance (lot 3 leftover): times to fix the arrival date.
  const call = outcome === "hired" && appointments && one(query.appel) === "1";
  const timeZone = defaultTimeZone();
  const [match, view, pools] = await Promise.all([
    matching === "none"
      ? null
      : applicationMatches(db, [application], now).then((map) => map.get(application.id) ?? null),
    scorecards ? scorecardView(db, ctx, application) : null,
    shortlist ? listPools(db, ctx) : [],
  ]);
  const explanation = match && match !== "disabled" ? match : null;
  const company = space.organization.name;
  const values = { firstName, jobTitle: job.title, company, signer: user.name };
  const kind = outcome === "hired" ? "acceptation" : "refus";
  const own =
    outcome === "withdrawn" || !outcome ? null : await organizationTemplate(db, ctx, kind);
  const ownText =
    outcome === "rejected" && job.rejectionTemplate
      ? job.rejectionTemplate.replaceAll("\\n", "\n")
      : own
        ? fillTemplate(own.body, values)
        : null;
  const asked = templateTones.find((tone) => tone === one(query.ton));
  const tone: TemplateTone | "organisation" =
    asked ?? (ownText && one(query.ton) !== "jumanly" ? "organisation" : "chaleureux");
  // The strongest skill, only when the organization sees matching (V7 § B6).
  const strength = strongestSkill(explanation);
  const toneText = (chosen: TemplateTone) =>
    outcome === "withdrawn"
      ? tidyText(
          t(`decision.withdrawnMessage.${chosen}`, {
            firstName,
            jobTitle: job.title,
            company,
          }).replaceAll("\\n", "\n"),
        )
      : tidyText(
          th(`templates.tone.${chosen}.${kind}.body`, {
            ...values,
            strengthLine: strength
              ? th(`templates.tone.${chosen}.${kind}.strength`, { strength })
              : "",
            nextLine:
              kind === "acceptation"
                ? th(`templates.tone.${chosen}.acceptation.${call ? "nextCall" : "next"}`)
                : "",
          }).replaceAll("\\n", "\n"),
        );
  const body = !outcome
    ? ""
    : tone === "organisation" && ownText
      ? ownText
      : toneText(tone as TemplateTone);
  const segments = decisionParagraphs(body).map((paragraph) =>
    highlightSegments(paragraph, [firstName, job.title, company, strength]),
  );
  const link = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams();
    const state: Record<string, string | null | undefined> = {
      issue: outcome,
      ton: asked ?? (one(query.ton) === "jumanly" ? "jumanly" : null),
      appel: call ? "1" : null,
      ...changes,
    };
    for (const [key, value] of Object.entries(state)) if (value) next.set(key, value);
    const search = next.toString();
    return search ? `${page}?${search}` : page;
  };
  const tones = [
    ...(ownText && outcome !== "withdrawn" ? (["organisation"] as const) : []),
    ...templateTones,
  ];
  const later = laterStage(application);
  const finalStage = decisionStageOf(job.stages);
  const steps = [
    ...job.stages
      .filter(
        (stage) =>
          stage.kind !== "hired" && stage.kind !== "rejected" && stage.id !== finalStage?.id,
      )
      .map((stage) => ({
        key: stage.id,
        name: stage.name,
        state: (stage.order <= application.stage.order || application.stageId === finalStage?.id
          ? "done"
          : "next") as "done" | "next",
      })),
    { key: "decision", name: t("file.trackDecision"), state: "now" as const },
  ].map((step) => ({
    ...step,
    hint: t(
      step.state === "now"
        ? "file.trackNow"
        : step.state === "done"
          ? "file.trackDone"
          : "file.track",
    ),
  }));
  const evaluations = view
    ? [
        ...(view.mine
          ? [
              {
                name: user.name,
                average:
                  view.mine.ratings.reduce((sum, item) => sum + item.rating, 0) /
                  Math.max(1, view.mine.ratings.length),
              },
            ]
          : []),
        ...view.others.map((item) => ({ name: item.reviewerName, average: item.average })),
      ]
    : [];
  const error = one(query.erreur);
  const pool = pools[0];

  return (
    <div className="t-flux t-rc-dec t-rw-decp">
      {/* Web: the head of the page (planche `DECIS` web); on a phone, the round « Retour » head. */}
      <div className="t-rw-h t-rw-web">
        <div className="t-t">
          <Link href={fileHref} className="t-rw-crumb">
            <TalentIcon name="suivant" size="xs" />
            {t("decision.back")}
          </Link>
          <h1>{t("decision.title")}</h1>
          <p>{[job.title, job.city].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <FlowHead back={fileHref} backLabel={t("decision.back")} title={t("decision.title")} />
      {error === "1" && <Notice tone="err">{t("decision.error")}</Notice>}
      {error === "message" && <Notice tone="err">{t("decision.errorMessage")}</Notice>}
      {error === "appel" && <Notice tone="err">{t("decision.callError")}</Notice>}

      <form action={decideAction} className="t-rc-dec-f">
        <input type="hidden" name="application" value={application.id} />
        {/* Web: who and the result on the left, the message on the right (planche `DECIS`). */}
        <div className="t-rw-g t-rw-dec">
          <div className="t-rw-c">
            <section className="t-verre t-rc-dec-h" aria-label={person.name}>
              <div className="t-rc-mini">
                <CandidateAvatar id={application.id} name={person.name} />
                <span className="t-t">
                  <b>{person.name}</b>
                  <span>
                    {[
                      job.title,
                      interview?.startsAt
                        ? t("decision.interviewOn", { date: formatDayMonth(interview.startsAt!) })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                {explanation && (
                  <ScoreRing
                    score={explanation.score}
                    size="s"
                    text={ui("percent", { value: explanation.score })}
                    label={t("file.scoreAria", { score: explanation.score })}
                  />
                )}
              </div>
              <StageTrack steps={steps} label={t("file.track")} />
            </section>

            {evaluations.length > 0 && (
              <section aria-label={t("decision.evaluations")} className="t-rc-evs">
                {evaluations.map((item, index) => {
                  const rounded = Math.round(item.average);
                  return (
                    <div key={index}>
                      <b>{item.name}</b>
                      <span
                        className="t-n5"
                        role="img"
                        aria-label={t("decision.evaluationAria", {
                          name: item.name,
                          score: Math.round(item.average * 10) / 10,
                        })}
                      >
                        {Array.from({ length: RATING_MAX }, (_, index) => index + 1).map((step) => (
                          <i key={step} className={step <= rounded ? "t-on" : undefined} />
                        ))}
                      </span>
                    </div>
                  );
                })}
              </section>
            )}

            <h2 className="t-lab-c" id="rc-resultat">
              {t("decision.result")}
            </h2>
            <nav className="t-rc-res" aria-labelledby="rc-resultat">
              {decisionOutcomes.map((value) => (
                <Link
                  key={value}
                  href={link({ issue: value, ton: null })}
                  aria-current={outcome === value ? "true" : undefined}
                  className={cx("t-press", `t-${value}`)}
                  scroll={false}
                >
                  <span className="t-cases" aria-hidden>
                    <TalentIcon name={outcomeIcon[value]} size="s" />
                  </span>
                  {t(`decision.outcome.${value}`)}
                  <small>{t(`decision.outcome.${value}Text`)}</small>
                </Link>
              ))}
            </nav>
          </div>
          <div className="t-rw-c">
            <h2 className="t-lab-c t-rw-web">{tw("message")}</h2>

            {!outcome ? (
              <p className="t-gar">
                <TalentIcon name="orbi" size="s" />
                <span>{t("decision.choose")}</span>
              </p>
            ) : (
              <>
                <input type="hidden" name="outcome" value={outcome} />
                {outcome === "withdrawn" && (
                  <p className="t-rc-note">{t("decision.withdrawnOptional")}</p>
                )}
                <NextIntlClientProvider messages={pickMessages(messages, ["hireCandidates"])}>
                  <DecisionMessage
                    key={`${outcome}-${tone}-${call ? "appel" : "seul"}`}
                    body={body}
                    segments={segments}
                    firstName={firstName}
                    title={t("decision.prepared")}
                    edited={t("decision.edited")}
                  />
                </NextIntlClientProvider>
                <ul className="t-rc-tons" aria-label={t("decision.tones")}>
                  {tones.map((chip) => (
                    <li key={chip}>
                      <Link
                        href={link({ ton: chip === "organisation" ? null : chip })}
                        aria-current={chip === tone ? "true" : undefined}
                        className="t-press"
                        scroll={false}
                      >
                        {th(`templates.toneName.${chip}`)}
                      </Link>
                    </li>
                  ))}
                </ul>

                {outcome === "rejected" && (
                  <div className="t-champ">
                    <label htmlFor="rc-motif">{th("reject.reason.text")}</label>
                    <div className="t-verre t-saisie">
                      <select id="rc-motif" name="reason" defaultValue="">
                        <option value="">{t("decision.reasonNone")}</option>
                        {rejectReasons.map((reason) => (
                          <option key={reason} value={reason}>
                            {th(`reject.reason.${reason}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <small>{th("reject.reason.hint")}</small>
                  </div>
                )}

                {outcome === "hired" && appointments && (
                  <div className="t-verre t-liste t-lignes t-ri-appel">
                    <Link
                      href={link({ appel: call ? null : "1" })}
                      role="switch"
                      aria-checked={call}
                      className="t-li t-press"
                      scroll={false}
                      replace
                    >
                      <span className="t-cases t-c1" aria-hidden>
                        <TalentIcon name="entretien" size="s" />
                      </span>
                      <span className="t-t">
                        <b>{t("decision.call")}</b>
                        <span>{t("decision.callText", { minutes: ARRIVAL_CALL_MINUTES })}</span>
                      </span>
                      <span aria-hidden className={cx("t-sw", call && "t-on")} />
                    </Link>
                    {call && (
                      <div className="t-li t-ri-appel-c">
                        <input type="hidden" name="appel" value="on" />
                        <input type="hidden" name="timezone" value={timeZone} />
                        {Array.from({ length: SLOTS_MAX }, (_, index) => (
                          <div key={index} className="t-champ">
                            <label htmlFor={`rc-appel-${index}`}>
                              {t("decision.callSlot", { rank: index + 1 })}
                            </label>
                            <div className="t-verre t-saisie">
                              <input
                                id={`rc-appel-${index}`}
                                type="datetime-local"
                                name="slot"
                                required={index === 0}
                                step={900}
                              />
                            </div>
                          </div>
                        ))}
                        <small>{t("decision.callNote", { zone: zoneLabel(timeZone, now) })}</small>
                      </div>
                    )}
                  </div>
                )}

                {pool && outcome !== "withdrawn" && (
                  <div className="t-verre t-liste t-lignes">
                    <label className="t-li t-press">
                      <span className="t-cases t-c2" aria-hidden>
                        <TalentIcon name="favori" size="s" />
                      </span>
                      <span className="t-t">
                        <b>
                          {pools.length === 1
                            ? t("decision.pool", { name: pool.name })
                            : t("decision.poolChoose")}
                        </b>
                        <span>{t("decision.poolText")}</span>
                      </span>
                      <input type="checkbox" role="switch" name="vivier" className="sr-only" />
                      <span aria-hidden className="t-sw" />
                    </label>
                    {pools.length === 1 ? (
                      <input type="hidden" name="pool" value={pool.id} />
                    ) : (
                      <div className="t-li">
                        <label htmlFor="rc-vivier" className="sr-only">
                          {t("decision.poolSelect")}
                        </label>
                        <select id="rc-vivier" name="pool" className="t-rc-sel">
                          {pools.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <p className="t-gar">
              <TalentIcon name="horloge" size="s" />
              <span>{t("decision.guard")}</span>
            </p>

            <div className="t-verre t-fort t-bas-f t-rw-st">
              {later ? (
                <button
                  type="submit"
                  formAction={laterDecisionAction}
                  formNoValidate
                  className="t-bt t-sec t-m t-press"
                >
                  {t("decision.later")}
                </button>
              ) : (
                <Link href={fileHref} className="t-bt t-sec t-m t-press">
                  {t("decision.later")}
                </Link>
              )}
              {outcome ? (
                <button type="submit" className="t-bt t-p t-pl t-press">
                  {t("decision.confirm")}
                </button>
              ) : (
                <span className="t-bt t-p t-pl t-rc-off-bt" aria-disabled="true">
                  {t("decision.confirm")}
                </span>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
