import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { HireThread } from "@/components/connect/hire-thread";
import { Logo, toneOf } from "@/components/talent/art";
import { FlowHead } from "@/components/talent/flow-head";
import { InboxList } from "@/components/talent/messages/inbox-list";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { TalentReportForm } from "@/components/talent/report-form";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { formatDayMonth } from "@/lib/dates";
import { shortName } from "@/lib/short-name";
import { zoneCity } from "@/lib/slots";
import { statusChip } from "@/lib/suivi-status";
import {
  answerDocumentAction,
  answerInterviewAction,
  blockAction,
  sendDocumentAction,
  sendLinkAction,
  sendMessageAction,
  sendSlotAction,
} from "@/server/actions/connect";
import { switchSpace } from "@/server/actions/hire";
import { db } from "@/server/db";
import { connectViewer } from "@/server/hire-context";
import { authLimits } from "@/server/rate-limit";
import { talentStatus } from "@/server/services/applications";
import {
  ConnectError,
  getConversation,
  markRead,
  MESSAGE_MAX,
  peerOf,
} from "@/server/services/connect";
import {
  attachableDocuments,
  conversationTimeZone,
} from "@/server/services/conversation-attachments";
import { interviewsForConversation } from "@/server/services/interviews";
import { similarJobs } from "@/server/services/jobs";
import { decisionParagraphs } from "@/server/services/message-templates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inbox");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

type Payload = {
  name?: string;
  due?: string;
  submittedAt?: string;
  document?: { title?: string; type?: string };
  interviewId?: string;
  link?: string;
  startsAt?: string;
  timezone?: string;
  note?: string;
  outcome?: "rejected" | "hired";
  /** A decision the recruiter undid within the 10 minutes (lot 3 recruteur). */
  retracted?: boolean;
  company?: string;
  jobTitle?: string;
  signer?: string;
};

const plusChoices = ["creneau", "cv", "lettre", "document", "lien"] as const;
const DAY = 86_400_000;

/**
 * A conversation (planche talent-2 § 5): the recruiter and the company at the head, the days,
 * the bubbles, the slots to confirm, the files sent, and the composer with « + ». A recruiting
 * team keeps its own screen.
 */
export default async function ThreadPage({
  params,
  searchParams,
}: PageProps<"/app/messages/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const context = await connectViewer(`/app/messages/${id}`);
  if (context.viewer.hire) return <HireThread id={id} query={query} context={context} />;
  const { user, space, viewer } = context;
  const t = await getTranslations();
  const format = await getFormatter();

  let conversation;
  try {
    conversation = await getConversation(db, viewer, id);
  } catch (error) {
    if (!(error instanceof ConnectError)) throw error;
    // The conversation may belong to a team this person is part of: offer to switch.
    const other = await db.conversation.findFirst({
      where: {
        id,
        organization: { memberships: { some: { userId: user.id, status: "active" } } },
      },
      include: { organization: { select: { name: true } } },
    });
    if (!other) notFound();
    return (
      <div className="t-flux">
        <FlowHead back="/app/messages" backLabel={t("inbox.back")} title={t("inbox.title")} />
        <div className="t-verre t-carte t-vide">
          <b>{t("connect.switchSpace.text", { org: other.organization?.name ?? "" })}</b>
          <form action={switchSpace}>
            <input type="hidden" name="space" value={other.organizationId ?? ""} />
            <input type="hidden" name="suite" value={`/app/messages/${id}`} />
            <button type="submit" className="t-bt t-p t-s t-press">
              {t("connect.switchSpace.cta")}
            </button>
          </form>
        </div>
      </div>
    );
  }
  void space;

  await markRead(db, viewer, conversation.id);
  const now = new Date();
  const back = `/app/messages/${conversation.id}`;
  // A conversation with a connection (lot 6): the other talent stands where the company would.
  const peer = conversation.kind === "peer" ? peerOf(conversation, user.id) : null;
  const company = peer?.name ?? conversation.organization?.name ?? "";
  const jobTitle =
    conversation.application?.job.title ?? conversation.contactRequest?.job?.title ?? "";
  const senderIds = [
    ...new Set(
      conversation.messages
        .map((message) => message.senderId)
        .filter((v): v is string => Boolean(v)),
    ),
  ];
  const lastDecisionId = conversation.messages.findLast(
    (message) => message.kind === "decision" && !message.hiddenAt,
  )?.id;
  const [senderRows, documents, slotZone, linked, interviewRows, appliedJob] = await Promise.all([
    db.user.findMany({ where: { id: { in: senderIds } }, select: { id: true, name: true } }),
    attachableDocuments(db, user.id, "document"),
    conversationTimeZone(db, conversation.id),
    conversation.application
      ? db.application.findUnique({
          where: { id: conversation.application.id },
          select: {
            status: true,
            viewedAt: true,
            stage: { select: { kind: true } },
            job: { select: { status: true, closesAt: true } },
          },
        })
      : Promise.resolve(null),
    interviewsForConversation(
      db,
      conversation.messages.flatMap((message) => {
        const interviewId = (message.payload as Payload | null)?.interviewId;
        return message.kind === "invitation" && interviewId ? [interviewId] : [];
      }),
    ),
    lastDecisionId && conversation.application
      ? db.job.findUnique({
          where: { slug: conversation.application.job.slug },
          select: { slug: true, contractType: true, country: true },
        })
      : Promise.resolve(null),
  ]);
  const similar = appliedJob ? await similarJobs(db, appliedJob, 3) : [];
  const senders = new Map(senderRows.map((row) => [row.id, row.name]));
  const interviews = new Map(interviewRows.map((interview) => [interview.id, interview]));
  const person = conversation.messages.findLast(
    (message) => message.senderId && message.senderId !== user.id,
  )?.senderId;
  const personName = person ? senders.get(person) : undefined;
  const status = linked ? talentStatus(linked, now) : null;
  const canWrite = peer ? conversation.connection?.status === "accepted" : !conversation.blockedAt;
  // Blocked by me: the organization, or the other talent of the connection.
  const iBlocked = peer
    ? conversation.connection?.status === "blocked" &&
      conversation.connection.blockedById === user.id
    : Boolean(conversation.blockedAt);
  const cvs = documents.filter((document) => document.kind === "cv");
  const letters = documents.filter((document) => document.kind === "cover_letter");
  const lists = { cv: cvs, lettre: letters, document: documents } as const;
  const openPlus = plusChoices.find((choice) => choice === query.envoyer);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const dayLabel = (date: Date) => {
    if (date >= startOfToday) return t("inbox.today");
    if (date.getTime() >= startOfToday.getTime() - DAY) return t("inbox.yesterday");
    return format.dateTime(date, { weekday: "long", day: "numeric", month: "long" });
  };
  const hour = (date: Date, timeZone?: string) =>
    format.dateTime(date, { hour: "2-digit", minute: "2-digit", timeZone });
  const slotDay = (date: Date, timeZone: string) =>
    format.dateTime(date, { weekday: "short", day: "numeric", timeZone });
  const lastId = conversation.messages.at(-1)?.id;

  // Right column on a computer (planche web talent-2 § 4, `.cx`): the application, the files.
  const files = conversation.messages.filter(
    (message) =>
      !message.hiddenAt &&
      (message.kind === "file" || Boolean((message.payload as Payload | null)?.document)),
  );
  const side = (
    <aside className="t-msg-cx" aria-label={t("inbox.web.context")}>
      {conversation.application && status && (
        <>
          <h2 className="t-msg-h">{t("inbox.web.linked")}</h2>
          <div className="t-cd t-msg-cd">
            <div className="t-haut">
              <Logo
                name={company}
                src={conversation.organization?.logo}
                tone={toneOf(company)}
                className="t-lg-s"
              />
              <div className="t-t">
                <b>{jobTitle}</b>
                <span>{company}</span>
                <em className={cx("t-st", statusChip[status])}>{t(`suivi.status.${status}`)}</em>
              </div>
            </div>
          </div>
        </>
      )}
      <h2 className="t-msg-h">{t("inbox.web.files")}</h2>
      {files.length === 0 ? (
        <p className="t-vide-t">{t("inbox.web.noFiles")}</p>
      ) : (
        <ul className="t-flux t-serre t-msg-fic">
          {files.map((message) => {
            const payload = (message.payload ?? {}) as Payload;
            return (
              <li key={message.id}>
                <a
                  href={`/app/messages/${conversation.id}/document/${message.id}`}
                  className="t-pj t-press"
                >
                  <span className="t-cases" aria-hidden>
                    <TalentIcon name="document" size="s" />
                  </span>
                  <span className="t-t">
                    <b>{payload.document?.title ?? message.body}</b>
                    <span>{formatDayMonth(message.createdAt)}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {conversation.application && status && (
        <Link href={`/app/suivi/${conversation.application.id}`} className="t-bt t-sec t-m t-press">
          {t("inbox.seeApplication")}
        </Link>
      )}
    </aside>
  );

  return (
    <div className="t-flux t-large t-msgs">
      <p aria-hidden className="t-w-titre">
        {t("inbox.title")}
      </p>
      <div className="t-msg3">
        <div className="t-flux t-msg-ls">
          <InboxList userId={user.id} query="" selected={conversation.id} prefix="cv-in" />
        </div>
        <div className="t-flux t-conv">
          <FlowHead
            back="/app/messages"
            backLabel={t("inbox.back")}
            end={
              <SheetButton target="cv-options" className="t-bi t-press" label={t("inbox.options")}>
                <TalentIcon name="plus-options" size="s" />
              </SheetButton>
            }
          >
            <Logo
              name={company}
              src={peer ? peer.image : conversation.organization?.logo}
              tone={toneOf(company)}
              className="t-lg-s"
            />
            <div className="t-qui">
              <h1>{personName && !peer ? shortName(personName) : company}</h1>
              <span>
                {peer
                  ? t("reseau.thread.subtitle")
                  : personName
                    ? [company, jobTitle].filter(Boolean).join(" · ")
                    : jobTitle}
              </span>
            </div>
          </FlowHead>

          {query.ok === "relation" && (
            <Notice tone="ok">{t("connect.contactRequest.accepted", { company })}</Notice>
          )}
          {query.ok === "entretien" && <Notice tone="ok">{t("connect.invite.done")}</Notice>}
          {query.ok === "document" && (
            <Notice tone="ok">{t("connect.docRequest.submitted")}</Notice>
          )}
          {query.ok === "bloque" && (
            <Notice tone="ok">{t("connect.block.done", { name: company })}</Notice>
          )}
          {query.signalement === "ok" && <Notice tone="ok">{t("report.success")}</Notice>}
          {query.signalement === "deja" && <Notice>{t("report.already")}</Notice>}
          {query.erreur === "entretien" ? (
            <Notice tone="err">{t("connect.invite.error")}</Notice>
          ) : query.erreur === "trop" ? (
            <Notice tone="err">
              {t("system.error.rateLimit", { seconds: authLimits.message.window })}
            </Notice>
          ) : (
            query.erreur && <Notice tone="err">{t("connect.thread.error")}</Notice>
          )}

          {conversation.application && status && (
            <Link
              href={`/app/suivi/${conversation.application.id}`}
              className="t-verre t-li t-press"
            >
              <span className="t-cases t-c2" aria-hidden>
                <TalentIcon name="candidature" size="s" />
              </span>
              <span className="t-t">
                <b>{jobTitle}</b>
                <span>{t("inbox.seeApplication")}</span>
              </span>
              <em className={cx("t-st", statusChip[status])}>{t(`suivi.status.${status}`)}</em>
            </Link>
          )}
          {peer ? (
            iBlocked ? (
              <Notice>{t("reseau.thread.blocked", { name: company })}</Notice>
            ) : (
              !canWrite && <Notice>{t("reseau.thread.ended")}</Notice>
            )
          ) : (
            conversation.blockedAt && <Notice>{t("connect.thread.youBlocked")}</Notice>
          )}

          <ol className="t-fil" aria-label={t("inbox.thread")}>
            {conversation.messages.map((message, index) => {
              const mine = message.senderId === user.id;
              const payload = (message.payload ?? {}) as Payload;
              const previous = conversation.messages[index - 1];
              const newDay =
                !previous || dayLabel(previous.createdAt) !== dayLabel(message.createdAt);
              const time = hour(message.createdAt);
              const interview =
                message.kind === "invitation"
                  ? interviews.get(payload.interviewId ?? "")
                  : undefined;
              let body;
              if (message.hiddenAt) {
                body = (
                  <div className="t-b-r t-cache">
                    <i>{t(payload.retracted ? "hireCandidates.retracted" : "report.hidden")}</i>
                  </div>
                );
              } else if (message.kind === "invitation" && interview) {
                const zone = interview.timezone;
                const future = interview.slots.filter((slot) => slot > now).slice(0, 3);
                const application = conversation.application?.id;
                body = (
                  <section id={`entretien-${interview.id}`} className="t-verre t-b-cr">
                    <span className="t-k">
                      <TalentIcon name="agenda" size="xs" />
                      {interview.status === "pending"
                        ? t("inbox.slots.title")
                        : interview.status === "confirmed"
                          ? t("inbox.slots.confirmed")
                          : interview.status === "reschedule"
                            ? t("inbox.slots.reschedule")
                            : t("inbox.slots.closed")}
                    </span>
                    {message.body && <p>{message.body}</p>}
                    {interview.status === "pending" && future.length > 0 ? (
                      <form action={answerInterviewAction} className="t-flux t-serre">
                        <input type="hidden" name="conversation" value={conversation.id} />
                        <input type="hidden" name="interview" value={interview.id} />
                        <input type="hidden" name="answer" value="accept" />
                        <fieldset className="t-fs">
                          <legend className="sr-only">{t("connect.invite.slots")}</legend>
                          <div className="t-creneaux">
                            {future.map((slot, position) => (
                              <label key={slot.toISOString()} className="t-press">
                                <input
                                  type="radio"
                                  name="slot"
                                  value={slot.toISOString()}
                                  defaultChecked={position === 0}
                                  required
                                />
                                <b>{slotDay(slot, zone)}</b>
                                {hour(slot, zone)}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <small className="t-pas-t">
                          {t("candidature.invite.zone", { city: zoneCity(zone) })}
                        </small>
                        <div className="t-bts">
                          <button type="submit" className="t-bt t-p t-m t-pl t-press">
                            {t("candidature.invite.confirm")}
                          </button>
                          {application && (
                            <Link
                              href={`/app/suivi/${application}?proposer=1#entretien`}
                              className="t-bt t-sec t-m t-press"
                            >
                              {t("candidature.invite.other")}
                            </Link>
                          )}
                        </div>
                      </form>
                    ) : interview.status === "confirmed" && interview.startsAt ? (
                      <p>
                        <b>
                          {t("candidature.invite.when", {
                            day: format.dateTime(interview.startsAt, {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              timeZone: zone,
                            }),
                            time: hour(interview.startsAt, zone),
                          })}
                        </b>
                      </p>
                    ) : null}
                    {application && interview.status !== "pending" && (
                      <Link href={`/app/suivi/${application}#entretien`} className="t-lien-d">
                        {t("inbox.seeApplication")}
                      </Link>
                    )}
                  </section>
                );
              } else if (message.kind === "document_request") {
                const done = Boolean(payload.submittedAt);
                const late = !done && payload.due && new Date(payload.due) < now;
                body = (
                  <section className="t-verre t-b-cr">
                    <span className="t-k">
                      <TalentIcon name="document" size="xs" />
                      {t("inbox.request.title", { name: payload.name ?? "" })}
                    </span>
                    {message.body !== payload.name && <p className="t-texte-l">{message.body}</p>}
                    <span className={cx("t-st", done ? "t-pre" : late ? "t-ret" : "t-en")}>
                      {done
                        ? t("inbox.request.sent", {
                            date: formatDayMonth(new Date(payload.submittedAt!)),
                          })
                        : payload.due
                          ? t("inbox.request.due", { date: formatDayMonth(new Date(payload.due)) })
                          : t("inbox.request.waiting")}
                    </span>
                    {!done && canWrite && (
                      <SheetButton
                        target={`cv-dem-${message.id}`}
                        className="t-bt t-p t-m t-pl t-press"
                      >
                        {t("inbox.request.answer")}
                      </SheetButton>
                    )}
                  </section>
                );
              } else if (message.kind === "file") {
                body = (
                  <a
                    href={`/app/messages/${conversation.id}/document/${message.id}`}
                    className={cx("t-b-f t-press", !mine && "t-recu")}
                  >
                    <TalentIcon name="document" size="s" />
                    <span>
                      <b>{payload.document?.title ?? message.body}</b>
                      <span>
                        {mine ? t("inbox.file.sent", { time }) : t("inbox.file.received", { time })}
                      </span>
                    </span>
                  </a>
                );
              } else if (message.kind === "slot" && payload.startsAt) {
                const startsAt = new Date(payload.startsAt);
                const zone = payload.timezone ?? "UTC";
                body = (
                  <div className={cx("t-b-f", !mine && "t-recu")}>
                    <TalentIcon name="agenda" size="s" />
                    <span>
                      <b>
                        {t("inbox.slot.title", {
                          day: format.dateTime(startsAt, {
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                            timeZone: zone,
                          }),
                          time: hour(startsAt, zone),
                        })}
                      </b>
                      <span>
                        {[t("connect.slot.zone", { city: zoneCity(zone) }), payload.note]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                  </div>
                );
              } else if (message.kind === "decision") {
                const hired = payload.outcome === "hired";
                body = (
                  <div className="t-flux t-serre">
                    <div className="t-b-r t-decision">
                      <b>{hired ? t("connect.decision.hired") : t("connect.decision.rejected")}</b>
                      {decisionParagraphs(message.body).map((paragraph, position) => (
                        <p key={position}>{paragraph}</p>
                      ))}
                      <small>
                        {t("connect.decision.signer", {
                          name: payload.signer ?? senders.get(message.senderId ?? "") ?? company,
                        })}
                      </small>
                    </div>
                    {!hired && message.id === lastDecisionId && (
                      <div className="t-verre t-rebond">
                        <b>{t("suivi.similar.title")}</b>
                        <span>
                          {similar.length > 0
                            ? t("suivi.similar.text", { count: similar.length })
                            : t("connect.decision.bounce.trainLine")}
                        </span>
                        <Link
                          href={
                            similar.length > 0
                              ? "/app/jobs?vue=recentes"
                              : "/app/career/entretiens/nouveau"
                          }
                          className="t-bt t-sec t-s t-press"
                        >
                          {similar.length > 0
                            ? t("suivi.similar.cta")
                            : t("connect.decision.bounce.train")}
                        </Link>
                      </div>
                    )}
                  </div>
                );
              } else {
                body = (
                  <div className={mine ? "t-bulle-u" : "t-b-r"}>
                    <p className="t-texte-l">{message.body}</p>
                    {payload.link && (
                      <a
                        href={payload.link}
                        rel="noopener noreferrer nofollow ugc"
                        target="_blank"
                        className="t-lien-d t-url"
                      >
                        {payload.link}
                      </a>
                    )}
                    {payload.document && (
                      <a
                        href={`/app/messages/${conversation.id}/document/${message.id}`}
                        className="t-lien-d"
                      >
                        {t("connect.document.view")}
                      </a>
                    )}
                  </div>
                );
              }
              return (
                <li
                  key={message.id}
                  id={message.id === lastId ? "dernier" : undefined}
                  className={cx("t-msg", mine ? "t-moi" : "t-eux")}
                >
                  {newDay && <span className="t-jour">{dayLabel(message.createdAt)}</span>}
                  {body}
                  <small className="t-heure">
                    {mine
                      ? time
                      : `${shortName(senders.get(message.senderId ?? "") ?? company)} · ${time}`}
                  </small>
                </li>
              );
            })}
          </ol>

          {canWrite && (
            <form action={sendMessageAction} className="t-bas-f t-nu">
              <div className="t-verre t-fort t-compo">
                <SheetButton target="cv-plus" className="t-bi t-press" label={t("inbox.plus.open")}>
                  <TalentIcon name="plus" size="s" />
                </SheetButton>
                <input type="hidden" name="conversation" value={conversation.id} />
                <label htmlFor="cv-corps" className="sr-only">
                  {t("inbox.composer")}
                </label>
                <input
                  id="cv-corps"
                  name="body"
                  required
                  maxLength={MESSAGE_MAX}
                  placeholder={t("inbox.composer")}
                  autoComplete="off"
                  enterKeyHint="send"
                />
                <button type="submit" className="t-bi t-env t-press" aria-label={t("inbox.send")}>
                  <TalentIcon name="envoyer" size="s" />
                </button>
              </div>
            </form>
          )}

          <Sheet id="cv-options" title={t("inbox.options")} closeLabel={t("offer.close")}>
            <div className="t-verre t-liste">
              {conversation.application && (
                <Link href={`/app/suivi/${conversation.application.id}`} className="t-li t-press">
                  <span className="t-cases t-c2" aria-hidden>
                    <TalentIcon name="candidature" size="s" />
                  </span>
                  <span className="t-t">
                    <b>{t("inbox.seeApplication")}</b>
                  </span>
                  <TalentIcon name="suivant" size="s" />
                </Link>
              )}
              <SheetButton target="cv-signaler" className="t-li t-press">
                <span className="t-cases t-c3" aria-hidden>
                  <TalentIcon name="aide" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("connect.report.cta")}</b>
                </span>
              </SheetButton>
              {iBlocked ? (
                <form action={blockAction}>
                  <input type="hidden" name="conversation" value={conversation.id} />
                  <input type="hidden" name="block" value="0" />
                  <button type="submit" className="t-li t-press">
                    <span className="t-cases t-c1" aria-hidden>
                      <TalentIcon name="valider" size="s" />
                    </span>
                    <span className="t-t">
                      <b>{t("connect.unblock")}</b>
                    </span>
                  </button>
                </form>
              ) : (
                <SheetButton target="cv-bloquer" className="t-li t-press">
                  <span className="t-cases t-c3" aria-hidden>
                    <TalentIcon name="fermer" size="s" />
                  </span>
                  <span className="t-t">
                    <b>{t("connect.block.cta")}</b>
                  </span>
                </SheetButton>
              )}
            </div>
          </Sheet>

          <Sheet id="cv-signaler" title={t("connect.report.title")} closeLabel={t("offer.close")}>
            <TalentReportForm targetType="conversation" targetId={conversation.id} back={back} />
          </Sheet>

          {!iBlocked && (
            <Sheet
              id="cv-bloquer"
              title={t("connect.block.confirm.title", { name: company })}
              closeLabel={t("offer.close")}
            >
              <form action={blockAction} className="t-flux">
                <input type="hidden" name="conversation" value={conversation.id} />
                <input type="hidden" name="block" value="1" />
                <p className="t-vide-t">
                  {peer ? t("reseau.block.body") : t("connect.block.confirm.body")}
                </p>
                <button type="submit" className="t-bt t-p t-pl t-press">
                  {t("connect.block.confirm.cta")}
                </button>
              </form>
            </Sheet>
          )}

          {canWrite && (
            <>
              <Sheet id="cv-plus" title={t("inbox.plus.title")} closeLabel={t("offer.close")}>
                <div className="t-verre t-liste">
                  {(
                    [
                      ["cv", "cv", "t-c1"],
                      ["lettre", "modifier", "t-c2"],
                      ["document", "document", "t-c3"],
                      ["creneau", "agenda", "t-c2"],
                      ["lien", "partager", "t-c1"],
                    ] as const
                  ).map(([key, icon, tone]) => (
                    <SheetButton key={key} target={`cv-plus-${key}`} className="t-li t-press">
                      <span className={cx("t-cases", tone)} aria-hidden>
                        <TalentIcon name={icon} size="s" />
                      </span>
                      <span className="t-t">
                        <b>{t(`connect.plus.${key}.label`)}</b>
                      </span>
                      <TalentIcon name="suivant" size="s" />
                    </SheetButton>
                  ))}
                </div>
                <p className="t-gar">
                  <TalentIcon name="cadenas" size="s" />
                  <span>{t("connect.plus.copy")}</span>
                </p>
              </Sheet>

              {(["cv", "lettre", "document"] as const).map((key) => {
                const items = lists[key];
                return (
                  <Sheet
                    key={key}
                    id={`cv-plus-${key}`}
                    title={t(`connect.plus.${key}.title`)}
                    closeLabel={t("offer.close")}
                    openParam="envoyer"
                    defaultOpen={openPlus === key}
                  >
                    {items.length === 0 ? (
                      <div className="t-flux t-serre">
                        <p className="t-vide-t">{t(`connect.plus.${key}.empty`)}</p>
                        <Link
                          href={key === "cv" ? "/app/career/cv" : "/app/career/cv?vue=lettres"}
                          className="t-bt t-sec t-pl t-press"
                        >
                          {t("inbox.plus.create")}
                        </Link>
                      </div>
                    ) : (
                      <form action={sendDocumentAction} className="t-flux">
                        <input type="hidden" name="conversation" value={conversation.id} />
                        <fieldset className="t-fs">
                          <legend className="sr-only">{t(`connect.plus.${key}.title`)}</legend>
                          <div className="t-choix">
                            {items.map((document, position) => (
                              <label key={document.id} className="t-verre t-ch">
                                <input
                                  type="radio"
                                  name="document"
                                  value={document.id}
                                  defaultChecked={position === 0}
                                  required
                                />
                                <span className="t-t">
                                  <b>{document.title}</b>
                                  <span>
                                    {t("connect.plus.updated", { date: document.updatedAt })}
                                  </span>
                                </span>
                                <span className="t-radio" aria-hidden />
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <button type="submit" className="t-bt t-p t-pl t-press">
                          {t("connect.plus.send")}
                        </button>
                      </form>
                    )}
                  </Sheet>
                );
              })}

              <Sheet
                id="cv-plus-creneau"
                title={t("connect.plus.creneau.title")}
                closeLabel={t("offer.close")}
                openParam="envoyer"
                defaultOpen={openPlus === "creneau"}
              >
                <form action={sendSlotAction} className="t-flux">
                  <input type="hidden" name="conversation" value={conversation.id} />
                  <div className="t-champ">
                    <label htmlFor="cv-date">{t("connect.plus.creneau.date")}</label>
                    <input id="cv-date" type="date" name="date" required className="t-saisie" />
                  </div>
                  <div className="t-champ">
                    <label htmlFor="cv-heure">{t("connect.plus.creneau.time")}</label>
                    <input
                      id="cv-heure"
                      type="time"
                      name="time"
                      required
                      step={900}
                      className="t-saisie"
                    />
                  </div>
                  <p className="t-vide-t">{t("connect.slot.zone", { city: zoneCity(slotZone) })}</p>
                  <div className="t-champ">
                    <label htmlFor="cv-note">{t("connect.plus.creneau.note")}</label>
                    <input
                      id="cv-note"
                      type="text"
                      name="note"
                      maxLength={300}
                      className="t-saisie"
                    />
                  </div>
                  <button type="submit" className="t-bt t-p t-pl t-press">
                    {t("connect.plus.send")}
                  </button>
                </form>
              </Sheet>

              <Sheet
                id="cv-plus-lien"
                title={t("connect.plus.lien.title")}
                closeLabel={t("offer.close")}
                openParam="envoyer"
                defaultOpen={openPlus === "lien"}
              >
                <form action={sendLinkAction} className="t-flux">
                  <input type="hidden" name="conversation" value={conversation.id} />
                  <div className="t-champ">
                    <label htmlFor="cv-url">{t("connect.plus.lien.url")}</label>
                    <input
                      id="cv-url"
                      type="url"
                      name="url"
                      required
                      maxLength={500}
                      inputMode="url"
                      placeholder={t("connect.plus.lien.placeholder")}
                      className="t-saisie"
                    />
                  </div>
                  <div className="t-champ">
                    <label htmlFor="cv-lien-texte">{t("connect.plus.lien.text")}</label>
                    <input
                      id="cv-lien-texte"
                      type="text"
                      name="label"
                      maxLength={120}
                      className="t-saisie"
                    />
                  </div>
                  <button type="submit" className="t-bt t-p t-pl t-press">
                    {t("connect.plus.send")}
                  </button>
                </form>
              </Sheet>

              {conversation.messages
                .filter(
                  (message) =>
                    message.kind === "document_request" &&
                    !message.hiddenAt &&
                    !(message.payload as Payload | null)?.submittedAt,
                )
                .map((message) => (
                  <Sheet
                    key={message.id}
                    id={`cv-dem-${message.id}`}
                    title={(message.payload as Payload | null)?.name ?? message.body}
                    closeLabel={t("offer.close")}
                  >
                    {documents.length === 0 ? (
                      <div className="t-flux t-serre">
                        <p className="t-vide-t">{t("candidature.requests.none")}</p>
                        <Link href="/app/career/cv?vue=lettres" className="t-bt t-sec t-pl t-press">
                          {t("inbox.plus.create")}
                        </Link>
                      </div>
                    ) : (
                      <form action={answerDocumentAction} className="t-flux">
                        <input type="hidden" name="conversation" value={conversation.id} />
                        <input type="hidden" name="request" value={message.id} />
                        <fieldset className="t-fs">
                          <legend className="t-lab-c">{t("candidature.requests.choose")}</legend>
                          <div className="t-choix">
                            {documents.map((document, position) => (
                              <label key={document.id} className="t-verre t-ch">
                                <input
                                  type="radio"
                                  name="document"
                                  value={document.id}
                                  defaultChecked={position === 0}
                                />
                                <span className="t-t">
                                  <b>{document.title}</b>
                                </span>
                                <span className="t-radio" aria-hidden />
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <p className="t-gar">
                          <TalentIcon name="cadenas" size="s" />
                          <span>{t("connect.docRequest.privacy")}</span>
                        </p>
                        <button type="submit" className="t-bt t-p t-pl t-press">
                          {t("candidature.requests.send")}
                        </button>
                      </form>
                    )}
                  </Sheet>
                ))}
            </>
          )}
        </div>
        {side}
      </div>
    </div>
  );
}
