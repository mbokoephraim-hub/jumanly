import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { authLimits } from "@/server/rate-limit";
import { AppPageHeader } from "@/components/app/page-header";
import { Icon } from "@/components/brand/icon";
import { pillClass } from "@/components/career/kit";
import { tag, tagTone } from "@/components/jobs/talent-kit";
import { zoneCity } from "@/components/suivi/interview-item";
import {
  Alert,
  Button,
  CompanyLogo,
  DecisionCard,
  FileCard,
  Select,
  SlotCard,
  VisualTile,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import { ConversationList } from "@/components/connect/conversation-list";
import { InterviewCard } from "@/components/connect/interview-card";
import { ReportForm } from "@/components/connect/report-form";
import { PhoneTitle } from "@/components/talent/page-title";
import {
  answerDocumentAction,
  blockAction,
  sendDocumentAction,
  sendLinkAction,
  sendMessageAction,
  sendSlotAction,
} from "@/server/actions/connect";
import { switchSpace } from "@/server/actions/hire";
import { db } from "@/server/db";
import type { connectViewer } from "@/server/hire-context";
import {
  ConnectError,
  getConversation,
  listConversations,
  markRead,
  MESSAGE_MAX,
} from "@/server/services/connect";
import { applicationTracker, isClosedStatus, talentStatus } from "@/server/services/applications";
import { hirePermissions } from "@/server/services/hire";
import { interviewsForConversation } from "@/server/services/interviews";
import {
  attachableDocuments,
  conversationTimeZone,
  type AttachmentKind,
} from "@/server/services/conversation-attachments";
import { similarJobs } from "@/server/services/jobs";
import { decisionParagraphs } from "@/server/services/message-templates";
import { talentContactRequests } from "@/server/services/talent-search";

type Payload = {
  name?: string;
  due?: string;
  submittedAt?: string;
  document?: { title?: string; type?: string };
  interviewId?: string;
  /** Text with a link (prompt 5). */
  link?: string;
  /** Slot (prompt 5). */
  startsAt?: string;
  timezone?: string;
  note?: string;
  /** Decision (prompt 5). */
  outcome?: "rejected" | "hired";
  company?: string;
  jobTitle?: string;
  signer?: string;
};

const plusChoices = ["creneau", "cv", "lettre", "document", "lien"] as const;
type PlusChoice = (typeof plusChoices)[number];

const DAY = 86_400_000;

/**
 * A conversation (partie 07 § 3, mockup 03-21): on a computer, the list, the thread and its
 * context (the other side, the linked application, the shared files); on a phone, the thread
 * alone. Messages, interview invitations, document requests and the answer with a CV, and for
 * the talent, « Bloquer » and « Signaler ».
 */
export async function HireThread({
  id,
  query,
  context: { user, space, viewer },
}: {
  id: string;
  query: Record<string, string | string[] | undefined>;
  context: Awaited<ReturnType<typeof connectViewer>>;
}) {
  const t = await getTranslations("connect");
  const tr = await getTranslations("report");
  const format = await getFormatter();

  let conversation;
  try {
    conversation = await getConversation(db, viewer, id);
  } catch (error) {
    if (!(error instanceof ConnectError)) throw error;
    // The conversation may belong to the other space of this person: offer to switch.
    const other = await db.conversation.findFirst({
      where: {
        id,
        OR: [
          { talentUserId: user.id },
          { organization: { memberships: { some: { userId: user.id, status: "active" } } } },
        ],
      },
      include: { organization: { select: { id: true, name: true } } },
    });
    if (!other) notFound();
    const personal = other.talentUserId === user.id && space !== null;
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <Alert
          title={
            personal
              ? t("switchSpace.personal")
              : t("switchSpace.text", { org: other.organization?.name ?? "" })
          }
          action={
            <form action={switchSpace}>
              <input
                type="hidden"
                name="space"
                value={personal ? "personal" : (other.organizationId ?? "")}
              />
              <input type="hidden" name="suite" value={`/app/messages/${id}`} />
              <Button type="submit" size="sm">
                {t("switchSpace.cta")}
              </Button>
            </form>
          }
        />
      </div>
    );
  }

  await markRead(db, viewer, conversation.id);
  const fromOrganization = Boolean(viewer.hire);
  const canWrite = fromOrganization
    ? hirePermissions(viewer.hire!.role).manage && !conversation.blockedAt
    : true;
  const senderIds = [
    ...new Set(
      conversation.messages
        .map((message) => message.senderId)
        .filter((v): v is string => Boolean(v)),
    ),
  ];
  const [senderRows, cvs, conversations, requests, linked] = await Promise.all([
    db.user.findMany({ where: { id: { in: senderIds } }, select: { id: true, name: true } }),
    fromOrganization
      ? Promise.resolve([])
      : db.document.findMany({
          where: { profile: { userId: user.id }, kind: "cv" },
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true },
        }),
    listConversations(db, viewer),
    fromOrganization ? Promise.resolve([]) : talentContactRequests(db, viewer.userId),
    conversation.application
      ? db.application.findUnique({
          where: { id: conversation.application.id },
          select: {
            status: true,
            viewedAt: true,
            matchScore: true,
            stage: { select: { kind: true } },
            job: {
              select: {
                status: true,
                closesAt: true,
                stages: {
                  select: { kind: true, name: true, order: true },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);
  const senders = new Map(senderRows.map((u) => [u.id, u.name]));
  const contact = conversation.contactRequest;
  const otherName = fromOrganization
    ? (conversation.application?.profile.user.name ?? contact?.profile.user.name ?? "")
    : (conversation.organization?.name ?? "");
  const jobTitle = conversation.application?.job.title ?? contact?.job?.title ?? "";
  // The person who writes from the other side, when one has written.
  const otherPerson = conversation.messages.find(
    (message) => message.senderId && message.senderId !== user.id,
  )?.senderId;
  const otherPersonName = !fromOrganization && otherPerson ? senders.get(otherPerson) : undefined;
  const interviews = new Map(
    (
      await interviewsForConversation(
        db,
        conversation.messages.flatMap((message) => {
          const interviewId = (message.payload as Payload | null)?.interviewId;
          return message.kind === "invitation" && interviewId ? [interviewId] : [];
        }),
      )
    ).map((interview) => [interview.id, interview]),
  );
  // « Pour rebondir » under the latest refusal (prompt 5): close offers that are really open.
  const lastDecisionId = conversation.messages.findLast(
    (message) => message.kind === "decision" && !message.hiddenAt,
  )?.id;
  const appliedJob =
    !fromOrganization && lastDecisionId && conversation.application
      ? await db.job.findUnique({
          where: { slug: conversation.application.job.slug },
          select: { slug: true, contractType: true, country: true },
        })
      : null;
  const similar = appliedJob ? await similarJobs(db, appliedJob, 3) : [];
  // « + » (prompt 5, screen 50): only the talent sends files, slots and links.
  const plus = !fromOrganization && canWrite && !conversation.blockedAt;
  const plusChoice: PlusChoice | "menu" | null = !plus
    ? null
    : plusChoices.includes(query.envoyer as PlusChoice)
      ? (query.envoyer as PlusChoice)
      : query.envoyer === "1"
        ? "menu"
        : null;
  const attachKind: AttachmentKind | null =
    plusChoice === "cv" || plusChoice === "lettre" || plusChoice === "document" ? plusChoice : null;
  const [attachable, slotZone] = await Promise.all([
    attachKind ? attachableDocuments(db, user.id, attachKind) : Promise.resolve([]),
    plusChoice === "creneau" ? conversationTimeZone(db, conversation.id) : Promise.resolve(""),
  ]);
  const ti = await getTranslations("connect.invite");
  const te = await getTranslations("system.error");
  const tc = await getTranslations("connect.contactRequest");
  const th = await getTranslations("hire.talents.result");
  const tj = await getTranslations("talent.jobs");
  const tw = await getTranslations("common");
  const now = new Date();
  const back = `/app/messages/${conversation.id}`;
  const lastId = conversation.messages.at(-1)?.id;
  const sharedFiles = conversation.messages.flatMap((message) => {
    const payload = (message.payload ?? {}) as Payload;
    return payload.document && !message.hiddenAt
      ? [
          {
            id: message.id,
            title: payload.document.title ?? "",
            mine: message.senderId === user.id,
          },
        ]
      : [];
  });
  const steps =
    linked && conversation.application && !isClosedStatus(talentStatus(linked, now))
      ? applicationTracker(linked, talentStatus(linked, now))
      : [];
  const listFilter = "tous" as const;
  const dayLabel = (date: Date) => {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    if (date >= startOfToday) return t("thread.today");
    if (date.getTime() >= startOfToday.getTime() - DAY) return t("thread.yesterday");
    return format.dateTime(date, { dateStyle: "long" });
  };
  const subtitle = conversation.application
    ? [jobTitle, t("side.stage", { stage: conversation.application.stage.name })].join(" · ")
    : jobTitle && tc("job", { jobTitle });

  const actions = !fromOrganization && (
    <>
      <details className="relative">
        <summary
          className={cx(pillClass("outline", "sm"), "list-none [&::-webkit-details-marker]:hidden")}
        >
          <Icon name="alerte" className="size-4" />
          {t("report.cta")}
        </summary>
        <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-[18px] bg-blanc shadow-menu ring-1 ring-sapin/8">
          <p className="px-4 pt-4 text-sm font-semibold">{t("report.title")}</p>
          <ReportForm targetType="conversation" targetId={conversation.id} back={back} />
        </div>
      </details>
      {conversation.blockedAt ? (
        <form action={blockAction}>
          <input type="hidden" name="conversation" value={conversation.id} />
          <input type="hidden" name="block" value="0" />
          <button type="submit" className={pillClass("outline", "sm")}>
            {t("unblock")}
          </button>
        </form>
      ) : (
        <details className="relative">
          <summary
            className={cx(
              pillClass("outline", "sm"),
              "list-none [&::-webkit-details-marker]:hidden",
            )}
          >
            {t("block.cta")}
          </summary>
          <form
            action={blockAction}
            className="absolute right-0 z-30 mt-2 flex w-72 flex-col items-start gap-2 rounded-[18px] bg-blanc p-4 text-sm shadow-menu ring-1 ring-sapin/8"
          >
            <input type="hidden" name="conversation" value={conversation.id} />
            <input type="hidden" name="block" value="1" />
            <p className="font-semibold">{t("block.confirm.title", { name: otherName })}</p>
            <p className="text-ardoise">{t("block.confirm.body")}</p>
            <button type="submit" className={pillClass("dark", "sm")}>
              {t("block.confirm.cta")}
            </button>
          </form>
        </details>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      {!fromOrganization && (
        <PhoneTitle
          back="/app/suivi?filtre=messages"
          backLabel={t("thread.back")}
          title={otherPersonName ?? otherName}
        >
          <details className="relative">
            <summary
              aria-label={t("thread.more")}
              className="t-bi cursor-pointer list-none [&::-webkit-details-marker]:hidden"
            >
              <Icon name="more" className="size-5" />
            </summary>
            <div className="absolute top-full right-0 z-40 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-wrap items-start gap-2 rounded-[18px] bg-blanc p-3 text-sapin shadow-menu ring-1 ring-sapin/8">
              {actions}
            </div>
          </details>
        </PhoneTitle>
      )}
      <AppPageHeader
        eyebrow={t("eyebrow", { count: conversations.filter((item) => item.unread).length })}
        title={t("title")}
        titleAs="p"
        className="max-lg:hidden"
      />

      {query.ok === "relation" && (
        <Alert tone="success" title={tc("accepted", { company: otherName })} />
      )}
      {query.ok === "entretien" && <Alert tone="success" title={ti("done")} />}
      {query.signalement === "ok" && <Alert tone="success" title={tr("success")} />}
      {query.signalement === "deja" && <Alert title={tr("already")} />}
      {query.ok === "document" && <Alert tone="success" title={t("docRequest.submitted")} />}
      {query.ok === "bloque" && (
        <Alert tone="success" title={t("block.done", { name: otherName })} />
      )}
      {query.erreur === "entretien" ? (
        <Alert tone="error" title={ti("error")} />
      ) : query.erreur === "trop" ? (
        <Alert tone="error" title={te("rateLimit", { seconds: authLimits.message.window })} />
      ) : (
        query.erreur && <Alert tone="error" title={t("thread.error")} />
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_280px]">
        <ConversationList
          viewer={viewer}
          conversations={conversations}
          requests={requests}
          filter={listFilter}
          query=""
          activeId={conversation.id}
          className="max-lg:hidden lg:h-[calc(100dvh-300px)] lg:min-h-[520px] lg:overflow-y-auto"
        />

        <section
          aria-labelledby="thread-title"
          className={cx(
            "flex min-w-0 flex-col overflow-hidden rounded-[24px] bg-blanc lg:h-[calc(100dvh-300px)] lg:min-h-[520px]",
            !fromOrganization && "max-md:-mx-4 max-md:rounded-none max-md:bg-transparent",
          )}
        >
          <header
            className={cx(
              "flex flex-wrap items-center gap-3 border-b border-brume px-4 py-3.5 lg:px-[22px] lg:py-4",
              !fromOrganization && "max-md:hidden",
            )}
          >
            <Link
              href="/app/messages"
              aria-label={t("thread.back")}
              className="flex size-9 items-center justify-center rounded-full text-sapin hover:bg-creme lg:hidden"
            >
              <Icon name="chev-l" className="size-5" />
            </Link>
            <CompanyLogo
              name={otherPersonName ?? otherName}
              size="md"
              className="size-11! rounded-full! text-base!"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <h1 id="thread-title" className="truncate text-base font-semibold">
                {otherPersonName ?? otherName}
              </h1>
              <p className="truncate text-xs text-ardoise">
                {otherPersonName ? [otherName, subtitle].filter(Boolean).join(" · ") : subtitle}
              </p>
            </div>
            {actions && <div className="flex items-center gap-2 max-sm:w-full">{actions}</div>}
            {fromOrganization && conversation.application && (
              <>
                <Link
                  href={`/app/hire/candidats/${conversation.application.id}/message`}
                  className={pillClass("outline", "sm")}
                >
                  {t("templates.use")}
                </Link>
                <Link
                  href={`/app/hire/candidats/${conversation.application.id}`}
                  className={pillClass("outline", "sm")}
                >
                  {t("side.linkedApplication")}
                </Link>
              </>
            )}
            {fromOrganization && contact && (
              <Link
                href={`/app/hire/talents/${contact.profile.id}`}
                className={pillClass("outline", "sm")}
              >
                {th("view")}
              </Link>
            )}
          </header>
          {!fromOrganization && conversation.application && linked && (
            <Link
              href="/app/suivi?filtre=candidatures"
              className="mx-4 mt-3 flex items-center gap-2.5 rounded-[18px] bg-blanc px-3.5 py-2.5 shadow-douce lg:mx-6"
            >
              <Icon name="jobs" className="size-4 shrink-0 text-ardoise" />
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-ardoise">
                {t("thread.application", { job: jobTitle })}
              </span>
              <span className="shrink-0 rounded-pill bg-lime px-3 py-1 text-[12.5px] font-semibold">
                {tj(`applications.status.${talentStatus(linked, now)}`)}
              </span>
            </Link>
          )}

          {/* Reversed column: the thread opens on the latest message. */}
          <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto">
            <div className="flex flex-col gap-4 px-4 py-5 lg:px-6">
              {!fromOrganization && (
                <p className="flex items-start gap-2.5 rounded-[14px] bg-[#FBF6C9] px-3.5 py-2.5 text-xs leading-4">
                  <Icon name="securite" className="size-4 shrink-0" />
                  {t("thread.safety")}
                </p>
              )}
              {conversation.blockedAt &&
                (fromOrganization ? (
                  <Alert tone="warning" title={t("thread.blocked")} />
                ) : (
                  <Alert title={t("thread.youBlocked")} />
                ))}
              <ol className="flex flex-col gap-4">
                {conversation.messages.map((message, index) => {
                  const mine = message.senderId === user.id;
                  const payload = (message.payload ?? {}) as Payload;
                  const author = mine
                    ? t("thread.you")
                    : (senders.get(message.senderId ?? "") ?? otherName);
                  const previous = conversation.messages[index - 1];
                  const newDay =
                    !previous || dayLabel(previous.createdAt) !== dayLabel(message.createdAt);
                  const time = format.dateTime(message.createdAt, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const interview =
                    message.kind === "invitation"
                      ? interviews.get(payload.interviewId ?? "")
                      : undefined;
                  // The talent answers an invitation on its own screen (screen 24): a pill here.
                  const pill = !message.hiddenAt && !fromOrganization && Boolean(interview);
                  const card =
                    !message.hiddenAt &&
                    !pill &&
                    (message.kind === "invitation" || message.kind === "document_request");
                  // Files, slots and decisions have their own cards, never a bubble (prompt 5).
                  const bare =
                    !message.hiddenAt &&
                    (message.kind === "file" ||
                      message.kind === "slot" ||
                      message.kind === "decision");
                  const textBubble = !card && !bare && !pill && !message.hiddenAt;
                  const waiting =
                    !fromOrganization &&
                    message.kind === "document_request" &&
                    !payload.submittedAt;
                  return (
                    <li
                      key={message.id}
                      id={message.id === lastId ? "dernier" : undefined}
                      className="flex flex-col gap-4"
                    >
                      {newDay && (
                        <span className={cx(tag, tagTone.brume, "self-center")}>
                          {dayLabel(message.createdAt)}
                        </span>
                      )}
                      <div
                        className={cx(
                          "flex max-w-full flex-col gap-1",
                          pill ? "items-center" : mine ? "items-end" : "items-start",
                        )}
                      >
                        <div
                          className={cx(
                            "max-w-[min(460px,92%)] text-[13.5px] leading-5",
                            pill
                              ? "max-w-full!"
                              : bare
                                ? cx("w-[460px]", message.kind === "decision" && "max-w-full!")
                                : card
                                  ? cx(
                                      "w-[460px] rounded-[22px] bg-blanc p-4 ring-inset",
                                      waiting
                                        ? "ring-2 shadow-douce ring-ambre"
                                        : "ring-[1.5px] ring-brume",
                                    )
                                  : mine
                                    ? "rounded-[22px_22px_6px_22px] bg-sapin px-4 py-3 text-[15px] leading-[22px] text-blanc"
                                    : cx(
                                        "rounded-[22px_22px_22px_6px] bg-creme px-4 py-3 text-[15px] leading-[22px]",
                                        !fromOrganization && "max-md:bg-blanc max-md:shadow-douce",
                                      ),
                          )}
                        >
                          {message.hiddenAt ? (
                            <p className="italic">{tr("hidden")}</p>
                          ) : message.kind === "file" ? (
                            <FileCard
                              name={payload.document?.title ?? message.body}
                              kind={t("file.kind")}
                              meta={
                                payload.document?.type === "text"
                                  ? t("file.meta.text")
                                  : t("file.meta.cv")
                              }
                              href={`/app/messages/${conversation.id}/document/${message.id}`}
                              downloadLabel={t("file.download")}
                              className={mine ? "bg-lime-clair!" : undefined}
                            />
                          ) : message.kind === "slot" && payload.startsAt ? (
                            (() => {
                              const startsAt = new Date(payload.startsAt);
                              const timeZone = payload.timezone ?? "UTC";
                              return (
                                <SlotCard
                                  weekday={format.dateTime(startsAt, {
                                    weekday: "short",
                                    timeZone,
                                  })}
                                  day={format.dateTime(startsAt, { day: "numeric", timeZone })}
                                  month={format.dateTime(startsAt, { month: "short", timeZone })}
                                  title={t("slot.title", {
                                    time: format.dateTime(startsAt, {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      timeZone,
                                    }),
                                  })}
                                  meta={[t("slot.zone", { city: zoneCity(timeZone) }), payload.note]
                                    .filter(Boolean)
                                    .join(" · ")}
                                />
                              );
                            })()
                          ) : message.kind === "decision" ? (
                            <div className="flex flex-col gap-4">
                              <DecisionCard
                                outcome={payload.outcome === "hired" ? "hired" : "rejected"}
                                company={payload.company ?? otherName}
                                job={payload.jobTitle ?? jobTitle}
                                banner={
                                  payload.outcome === "hired"
                                    ? t("decision.hired")
                                    : t("decision.rejected")
                                }
                                paragraphs={decisionParagraphs(message.body)}
                                signer={t("decision.signer", { name: payload.signer ?? author })}
                                date={format.dateTime(message.createdAt, {
                                  day: "numeric",
                                  month: "short",
                                })}
                              />
                              {!fromOrganization &&
                                payload.outcome !== "hired" &&
                                message.id === lastDecisionId && (
                                  <section
                                    aria-labelledby={`rebondir-${message.id}`}
                                    className="flex flex-col gap-2.5"
                                  >
                                    <h2
                                      id={`rebondir-${message.id}`}
                                      className="text-[14px] font-semibold text-ardoise"
                                    >
                                      {t("decision.bounce.title")}
                                    </h2>
                                    <div className="grid grid-cols-2 gap-3">
                                      {similar.length > 0 && (
                                        <VisualTile
                                          href="/app/jobs?vue=recentes"
                                          tone="lime"
                                          scene="jobs"
                                          title={t("decision.bounce.offers", {
                                            count: similar.length,
                                          })}
                                          line={similar
                                            .map((job) => job.title)
                                            .slice(0, 2)
                                            .join(" · ")}
                                        />
                                      )}
                                      <VisualTile
                                        href="/app/career/entretiens"
                                        tone="menthe"
                                        scene="interview"
                                        title={t("decision.bounce.train")}
                                        line={t("decision.bounce.trainLine")}
                                      />
                                    </div>
                                  </section>
                                )}
                            </div>
                          ) : pill && interview ? (
                            <Link
                              href={`/app/suivi/entretiens/${interview.id}`}
                              className="inline-flex max-w-full items-center gap-2 rounded-pill bg-lime-clair px-4 py-2.5 text-[14px] text-sapin"
                            >
                              <Icon name="calendrier" className="size-4 shrink-0" />
                              <span className="min-w-0">
                                {interview.status === "pending"
                                  ? t("pill.pending", { count: interview.slots.length })
                                  : interview.status === "reschedule"
                                    ? t("pill.reschedule")
                                    : interview.status === "confirmed" && interview.startsAt
                                      ? t("pill.confirmed", {
                                          date: format.dateTime(interview.startsAt, {
                                            weekday: "long",
                                            day: "numeric",
                                            timeZone: interview.timezone,
                                          }),
                                          time: format.dateTime(interview.startsAt, {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            timeZone: interview.timezone,
                                          }),
                                        })
                                      : t("pill.closed")}
                                {" · "}
                                <span className="font-semibold underline">{t("pill.see")}</span>
                              </span>
                            </Link>
                          ) : message.kind === "invitation" && interview ? (
                            <InterviewCard
                              interview={interview}
                              conversationId={conversation.id}
                              talent={!fromOrganization}
                              now={now}
                            />
                          ) : message.kind === "document_request" ? (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-start gap-3">
                                <span
                                  aria-hidden
                                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FBF6C9]"
                                >
                                  <Icon name="doc" className="size-[18px]" />
                                </span>
                                <div className="flex min-w-0 flex-1 flex-col">
                                  <p className="text-[13px] font-semibold">
                                    {t("docRequest.title", { documentName: payload.name ?? "" })}
                                  </p>
                                  {payload.due && (
                                    <p className="text-xs text-ardoise">
                                      {t("docRequest.due", { date: new Date(payload.due) })}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={cx(
                                    tag,
                                    payload.submittedAt
                                      ? tagTone.menthe
                                      : payload.due && new Date(payload.due) < now
                                        ? tagTone.brume
                                        : tagTone.ambre,
                                  )}
                                >
                                  {payload.submittedAt
                                    ? t("docRequest.status.submitted", {
                                        date: new Date(payload.submittedAt),
                                      })
                                    : payload.due && new Date(payload.due) < now
                                      ? t("docRequest.status.overdue")
                                      : t("docRequest.status.pending")}
                                </span>
                              </div>
                              {message.body !== payload.name && (
                                <p className="whitespace-pre-line">{message.body}</p>
                              )}
                              {!fromOrganization &&
                                !payload.submittedAt &&
                                (cvs.length === 0 ? (
                                  <p className="text-sm">
                                    <Link href="/app/career/cv" className="underline">
                                      {t("docRequest.noDocument")}
                                    </Link>
                                  </p>
                                ) : (
                                  <form
                                    action={answerDocumentAction}
                                    className="flex flex-col gap-2"
                                  >
                                    <input
                                      type="hidden"
                                      name="conversation"
                                      value={conversation.id}
                                    />
                                    <input type="hidden" name="request" value={message.id} />
                                    {cvs.length === 1 ? (
                                      <input type="hidden" name="document" value={cvs[0]!.id} />
                                    ) : (
                                      <Select
                                        id={`document-${message.id}`}
                                        name="document"
                                        required
                                        label={t("docRequest.chooseExisting")}
                                        options={cvs.map((cv) => ({
                                          value: cv.id,
                                          label: cv.title,
                                        }))}
                                      />
                                    )}
                                    <button
                                      type="submit"
                                      className={pillClass("dark", "sm", "self-start")}
                                    >
                                      <Icon name="up" className="size-4" />
                                      {t("docRequest.send")}
                                    </button>
                                  </form>
                                ))}
                              <p className="flex items-center gap-1.5 text-xs text-ardoise">
                                <Icon name="lock" className="size-3.5 shrink-0" />
                                {t("docRequest.privacy")}
                              </p>
                            </div>
                          ) : (
                            <>
                              <p className="whitespace-pre-line">{message.body}</p>
                              {payload.link && (
                                <a
                                  href={payload.link}
                                  rel="noopener noreferrer nofollow ugc"
                                  target="_blank"
                                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold break-all underline"
                                >
                                  <Icon name="lien" className="size-4 shrink-0" />
                                  {payload.link}
                                </a>
                              )}
                              {payload.document && (
                                <a
                                  href={`/app/messages/${conversation.id}/document/${message.id}`}
                                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold underline"
                                >
                                  <Icon name="clip" className="size-4" />
                                  {t("document.view")}
                                </a>
                              )}
                              <span
                                className={cx(
                                  "mt-1 block text-right text-[12px]",
                                  mine ? "text-blanc/70" : "text-ardoise",
                                )}
                              >
                                {time}
                              </span>
                            </>
                          )}
                        </div>
                        {!pill && (
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-ardoise">
                            {textBubble ? (
                              !mine && <span>{author}</span>
                            ) : (
                              <span>{mine ? time : `${author} · ${time}`}</span>
                            )}
                            {!mine &&
                              !fromOrganization &&
                              !message.hiddenAt &&
                              message.senderId && (
                                <details className="text-xs">
                                  <summary className="cursor-pointer list-none text-ardoise underline [&::-webkit-details-marker]:hidden">
                                    {tr("title.message")}
                                  </summary>
                                  <ReportForm
                                    targetType="message"
                                    targetId={message.id}
                                    back={back}
                                  />
                                </details>
                              )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {plusChoice && (
            <section
              id="envoyer"
              aria-labelledby="envoyer-titre"
              className="flex flex-col gap-3 border-t border-brume bg-creme px-4 py-4 lg:px-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 id="envoyer-titre" className="text-[19px] font-semibold">
                  {plusChoice === "menu" ? t("plus.title") : t(`plus.${plusChoice}.title`)}
                </h2>
                <Link
                  href={plusChoice === "menu" ? back : `${back}?envoyer=1#envoyer`}
                  aria-label={plusChoice === "menu" ? t("plus.close") : t("plus.back")}
                  className="grid size-11 place-items-center rounded-full bg-blanc shadow-douce"
                >
                  <Icon name={plusChoice === "menu" ? "fermer" : "chev-l"} className="size-5" />
                </Link>
              </div>
              {plusChoice === "menu" && (
                <ul className="grid grid-cols-3 gap-3">
                  {(
                    [
                      ["creneau", "calendrier", "bg-lime"],
                      ["cv", "doc", "bg-neon"],
                      ["lettre", "edit", "bg-menthe-claire"],
                    ] as const
                  ).map(([key, icon, tone]) => (
                    <li key={key}>
                      <Link
                        href={`${back}?envoyer=${key}#envoyer`}
                        className="jm-pressable flex flex-col items-center gap-2 rounded-[22px] p-2 pb-3 text-center"
                      >
                        <span
                          aria-hidden
                          className={cx("grid h-16 w-full place-items-center rounded-[16px]", tone)}
                        >
                          <span className="grid size-10 place-items-center rounded-[12px] bg-blanc">
                            <Icon name={icon} className="size-5" />
                          </span>
                        </span>
                        <span className="text-[14px] font-semibold">{t(`plus.${key}.label`)}</span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <span
                      aria-disabled="true"
                      className="jm-ai-surface flex flex-col items-center gap-2 rounded-[22px] p-2 pb-3 text-center text-blanc opacity-70"
                    >
                      <span aria-hidden className="grid h-16 w-full place-items-center">
                        <span className="grid size-10 place-items-center rounded-[12px] bg-lime text-sapin">
                          <Icon name="intelligence" className="size-5" />
                        </span>
                      </span>
                      <span className="text-[14px] font-semibold">{t("plus.ai.label")}</span>
                      <span className="text-[11.5px]">{t("plus.ai.soon")}</span>
                    </span>
                  </li>
                  {(
                    [
                      ["document", "clip", "bg-brume"],
                      ["lien", "lien", "bg-blanc"],
                    ] as const
                  ).map(([key, icon, tone]) => (
                    <li key={key}>
                      <Link
                        href={`${back}?envoyer=${key}#envoyer`}
                        className="jm-pressable flex flex-col items-center gap-2 rounded-[22px] p-2 pb-3 text-center"
                      >
                        <span
                          aria-hidden
                          className={cx("grid h-16 w-full place-items-center rounded-[16px]", tone)}
                        >
                          <span className="grid size-10 place-items-center rounded-[12px] bg-blanc shadow-douce">
                            <Icon name={icon} className="size-5" />
                          </span>
                        </span>
                        <span className="text-[14px] font-semibold">{t(`plus.${key}.label`)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {attachKind &&
                (attachable.length === 0 ? (
                  <p className="text-[14px]">
                    <Link
                      href={attachKind === "cv" ? "/app/career/cv" : "/app/career/documents"}
                      className="font-semibold underline"
                    >
                      {t(`plus.${attachKind}.empty`)}
                    </Link>
                  </p>
                ) : (
                  <form action={sendDocumentAction} className="flex flex-col gap-3">
                    <input type="hidden" name="conversation" value={conversation.id} />
                    <fieldset className="flex flex-col gap-2">
                      <legend className="sr-only">{t(`plus.${attachKind}.title`)}</legend>
                      {attachable.map((document, index) => (
                        <label
                          key={document.id}
                          className="flex cursor-pointer items-center gap-3 rounded-[18px] bg-blanc p-3 shadow-douce has-checked:ring-2 has-checked:ring-sapin has-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)]"
                        >
                          <input
                            type="radio"
                            name="document"
                            value={document.id}
                            defaultChecked={index === 0}
                            required
                            className="sr-only"
                          />
                          <span
                            aria-hidden
                            className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-creme"
                          >
                            <Icon name="doc" className="size-5" />
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-[14.5px] font-semibold">
                              {document.title}
                            </span>
                            <span className="text-[12.5px] text-ardoise">
                              {t("plus.updated", { date: document.updatedAt })}
                            </span>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    <p className="flex items-center gap-1.5 text-xs text-ardoise">
                      <Icon name="lock" className="size-3.5 shrink-0" />
                      {t("plus.copy")}
                    </p>
                    <Button type="submit" variant="principal" size="M" className="self-start">
                      {t("plus.send")}
                    </Button>
                  </form>
                ))}
              {plusChoice === "creneau" && (
                <form action={sendSlotAction} className="flex flex-col gap-3">
                  <input type="hidden" name="conversation" value={conversation.id} />
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5 text-[13.5px] font-semibold">
                      {t("plus.creneau.date")}
                      <input
                        type="date"
                        name="date"
                        required
                        className="h-12 rounded-[14px] bg-blanc px-3 text-[15px] font-normal shadow-douce"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[13.5px] font-semibold">
                      {t("plus.creneau.time")}
                      <input
                        type="time"
                        name="time"
                        required
                        step={900}
                        className="h-12 rounded-[14px] bg-blanc px-3 text-[15px] font-normal shadow-douce"
                      />
                    </label>
                  </div>
                  <p className="text-[12.5px] text-ardoise">
                    {t("slot.zone", { city: zoneCity(slotZone) })}
                  </p>
                  <label className="flex flex-col gap-1.5 text-[13.5px] font-semibold">
                    {t("plus.creneau.note")}
                    <input
                      type="text"
                      name="note"
                      maxLength={300}
                      className="h-12 rounded-[14px] bg-blanc px-3 text-[15px] font-normal shadow-douce"
                    />
                  </label>
                  <Button type="submit" variant="principal" size="M" className="self-start">
                    {t("plus.send")}
                  </Button>
                </form>
              )}
              {plusChoice === "lien" && (
                <form action={sendLinkAction} className="flex flex-col gap-3">
                  <input type="hidden" name="conversation" value={conversation.id} />
                  <label className="flex flex-col gap-1.5 text-[13.5px] font-semibold">
                    {t("plus.lien.url")}
                    <input
                      type="url"
                      name="url"
                      required
                      maxLength={500}
                      inputMode="url"
                      placeholder={t("plus.lien.placeholder")}
                      className="h-12 rounded-[14px] bg-blanc px-3 text-[15px] font-normal shadow-douce"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[13.5px] font-semibold">
                    {t("plus.lien.text")}
                    <input
                      type="text"
                      name="label"
                      maxLength={120}
                      className="h-12 rounded-[14px] bg-blanc px-3 text-[15px] font-normal shadow-douce"
                    />
                  </label>
                  <Button type="submit" variant="principal" size="M" className="self-start">
                    {t("plus.send")}
                  </Button>
                </form>
              )}
            </section>
          )}

          {canWrite ? (
            <form
              action={sendMessageAction}
              className="flex items-end gap-2.5 border-t border-brume px-3 py-3 lg:px-[18px] lg:py-3.5"
            >
              {plus && (
                <Link
                  href={plusChoice ? back : `${back}?envoyer=1#envoyer`}
                  aria-label={t("plus.open")}
                  aria-expanded={Boolean(plusChoice)}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-blanc ring-[1.5px] ring-brume ring-inset"
                >
                  <Icon name="plus" className="size-5" />
                </Link>
              )}
              <input type="hidden" name="conversation" value={conversation.id} />
              <label htmlFor="message-body" className="sr-only">
                {t("thread.composer.placeholder")}
              </label>
              <textarea
                id="message-body"
                name="body"
                required
                rows={1}
                maxLength={MESSAGE_MAX}
                placeholder={t("thread.composer.placeholder")}
                className="field-sizing-content max-h-40 min-h-11 flex-1 resize-none rounded-[22px] bg-creme px-4 py-3 text-sm placeholder:text-ardoise focus-visible:outline-2 focus-visible:outline-sapin max-md:bg-blanc max-md:text-[15px] max-md:shadow-douce"
              />
              <button
                type="submit"
                aria-label={t("thread.composer.send")}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-lime text-sapin hover:bg-lime/85"
              >
                <Icon name="send" className="size-5" />
              </button>
            </form>
          ) : (
            fromOrganization &&
            !conversation.blockedAt && (
              <p className="border-t border-brume px-5 py-4 text-sm text-ardoise">
                {t("list.readOnly")}
              </p>
            )
          )}
        </section>

        <aside className="hidden flex-col gap-4 xl:flex">
          <section className="flex flex-col items-center gap-3 rounded-[24px] bg-blanc p-5 text-center">
            <CompanyLogo
              name={otherPersonName ?? otherName}
              size="lg"
              className="size-[76px]! rounded-full! text-[27px]!"
            />
            <div className="flex flex-col">
              <p className="text-base font-semibold">{otherPersonName ?? otherName}</p>
              {otherPersonName && <p className="text-xs text-ardoise">{otherName}</p>}
            </div>
            {!fromOrganization && conversation.organization?.verifiedAt && (
              <span className={cx(tag, tagTone.menthe)}>
                <Icon name="check" className="size-3" />
                {t("side.verified")}
              </span>
            )}
          </section>

          {conversation.application && (
            <section className="flex flex-col gap-3 rounded-[24px] bg-blanc p-5">
              <h2 className="text-[15px] font-semibold">{t("side.linkedApplication")}</h2>
              <div className="flex items-center gap-2.5">
                <CompanyLogo
                  name={conversation.organization?.name ?? jobTitle}
                  size="sm"
                  className="size-9! rounded-[11px]! text-xs!"
                />
                <div className="flex min-w-0 flex-col">
                  <p className="truncate text-sm font-semibold">{jobTitle}</p>
                  <p className="text-xs text-ardoise">
                    {t("side.stage", { stage: conversation.application.stage.name })}
                  </p>
                </div>
              </div>
              {steps.length > 0 && (
                <div aria-hidden className="flex gap-1">
                  {steps.map((step) => (
                    <span
                      key={step.key}
                      className={cx(
                        "h-1.5 flex-1 rounded-full",
                        step.state === "done" && "bg-lime",
                        step.state === "current" && "bg-sapin",
                        step.state === "next" && "bg-brume",
                      )}
                    />
                  ))}
                </div>
              )}
              {!fromOrganization && linked?.matchScore != null && (
                <div className="flex items-center justify-between gap-2">
                  <span className={cx(tag, "bg-gradient-ai text-blanc")}>
                    <Icon name="intelligence" className="size-3 text-neon" />
                    {tj("card.compatibility.text", { score: linked.matchScore })}
                  </span>
                  <Link
                    href={`/app/jobs/${conversation.application.job.slug}#compatibilite`}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#14745F] hover:underline"
                  >
                    <Icon name="eye" className="size-3.5" />
                    {tw("why")}
                  </Link>
                </div>
              )}
              <Link
                href={
                  fromOrganization
                    ? `/app/hire/candidats/${conversation.application.id}`
                    : "/app/jobs/candidatures"
                }
                className={pillClass("outline", "sm")}
              >
                {fromOrganization ? t("side.linkedApplication") : t("side.viewApplication")}
              </Link>
            </section>
          )}

          <section className="flex flex-col gap-2.5 rounded-[24px] bg-blanc p-5">
            <h2 className="text-[15px] font-semibold">{t("side.files.text")}</h2>
            {sharedFiles.length === 0 ? (
              <p className="text-xs text-ardoise">{t("side.files.empty")}</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {sharedFiles.map((file) => (
                  <li key={file.id}>
                    <a
                      href={`/app/messages/${conversation.id}/document/${file.id}`}
                      className="flex items-center gap-2.5 hover:underline"
                    >
                      <span
                        aria-hidden
                        className={cx(
                          "flex size-[34px] shrink-0 items-center justify-center rounded-[10px]",
                          file.mine ? "bg-lime-clair" : "bg-[#FBF6C9]",
                        )}
                      >
                        <Icon name="doc" className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">{file.title}</span>
                        <span className="text-xs text-ardoise">
                          {file.mine ? t("thread.sent") : t("side.file.receivedPlain")}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="flex items-start gap-2 px-1 text-xs text-ardoise">
            <Icon name="lock" className="size-3.5 shrink-0" />
            {t("thread.privacy")}
          </p>
        </aside>
      </div>
    </div>
  );
}
