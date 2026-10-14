import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { authLimits } from "@/server/rate-limit";
import { Alert, Badge, Button, Select, TextArea } from "@/components/ui";
import { cx } from "@/lib/cx";
import { InterviewCard } from "@/components/connect/interview-card";
import { ReportForm } from "@/components/connect/report-form";
import { answerDocumentAction, blockAction, sendMessageAction } from "@/server/actions/connect";
import { switchSpace } from "@/server/actions/hire";
import { db } from "@/server/db";
import { connectViewer } from "@/server/hire-context";
import { ConnectError, getConversation, markRead, MESSAGE_MAX } from "@/server/services/connect";
import { hirePermissions } from "@/server/services/hire";
import { interviewsForConversation } from "@/server/services/interviews";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("connect");
  return { title: { absolute: t("list.title") }, robots: { index: false } };
}

type Payload = {
  name?: string;
  due?: string;
  submittedAt?: string;
  document?: { title?: string };
  interviewId?: string;
};

/**
 * A conversation (partie 07 § 3): messages, document requests and the answer with a CV,
 * and for the talent, « Bloquer » and « Signaler ».
 */
export default async function ThreadPage({
  params,
  searchParams,
}: PageProps<"/app/messages/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { user, space, viewer } = await connectViewer(`/app/messages/${id}`);
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
  const senders = new Map(
    (
      await db.user.findMany({ where: { id: { in: senderIds } }, select: { id: true, name: true } })
    ).map((u) => [u.id, u.name]),
  );
  const cvs = fromOrganization
    ? []
    : await db.document.findMany({
        where: { profile: { userId: user.id }, kind: "cv" },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true },
      });
  const contact = conversation.contactRequest;
  const otherName = fromOrganization
    ? (conversation.application?.profile.user.name ?? contact?.profile.user.name ?? "")
    : (conversation.organization?.name ?? "");
  const jobTitle = conversation.application?.job.title ?? contact?.job?.title ?? "";
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
  const ti = await getTranslations("connect.invite");
  const te = await getTranslations("system.error");
  const tc = await getTranslations("connect.contactRequest");
  const th = await getTranslations("hire.talents.result");
  const now = new Date();
  const back = `/app/messages/${conversation.id}`;
  const lastId = conversation.messages.at(-1)?.id;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/messages" className="text-sm underline">
        {t("thread.back")}
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1">{otherName}</h1>
          {!conversation.application && jobTitle && (
            <p className="text-ardoise">{tc("job", { jobTitle })}</p>
          )}
          {conversation.application && (
            <p className="text-ardoise">
              {[jobTitle, t("side.stage", { stage: conversation.application.stage.name })].join(
                " · ",
              )}
            </p>
          )}
        </div>
        {conversation.application &&
          (fromOrganization ? (
            <Link
              href={`/app/hire/candidats/${conversation.application.id}`}
              className="text-sm font-medium underline"
            >
              {t("side.linkedApplication")}
            </Link>
          ) : (
            <Link href="/app/jobs/candidatures" className="text-sm font-medium underline">
              {t("side.viewApplication")}
            </Link>
          ))}
      </header>

      {fromOrganization && contact && (
        <Link
          href={`/app/hire/talents/${contact.profile.id}`}
          className="text-sm font-medium underline"
        >
          {th("view")}
        </Link>
      )}
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
      {conversation.blockedAt &&
        (fromOrganization ? (
          <Alert tone="warning" title={t("thread.blocked")} />
        ) : (
          <Alert title={t("thread.youBlocked")} />
        ))}

      <section
        aria-label={t("list.title")}
        className="flex flex-col gap-3 rounded-card bg-blanc p-4 sm:p-6"
      >
        <p className="text-sm text-ardoise">{t("thread.privacy")}</p>
        {!fromOrganization && <p className="text-sm text-ardoise">{t("thread.safety")}</p>}
        <ol className="flex flex-col gap-3">
          {conversation.messages.map((message) => {
            const mine = message.senderId === user.id;
            const payload = (message.payload ?? {}) as Payload;
            const author = mine
              ? t("thread.you")
              : (senders.get(message.senderId ?? "") ?? otherName);
            return (
              <li
                key={message.id}
                id={message.id === lastId ? "dernier" : undefined}
                className={cx(
                  "flex max-w-[85%] flex-col gap-1 rounded-md p-3",
                  mine ? "self-end bg-menthe-claire" : "self-start bg-creme",
                )}
              >
                <p className="text-ardoise text-caption">
                  {[
                    author,
                    format.dateTime(message.createdAt, { dateStyle: "medium", timeStyle: "short" }),
                  ].join(" · ")}
                </p>
                {message.hiddenAt ? (
                  <p className="italic">{tr("hidden")}</p>
                ) : message.kind === "invitation" && interviews.get(payload.interviewId ?? "") ? (
                  <InterviewCard
                    interview={interviews.get(payload.interviewId ?? "")!}
                    conversationId={conversation.id}
                    talent={!fromOrganization}
                    now={now}
                  />
                ) : message.kind === "document_request" ? (
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold">
                      {t("docRequest.title", { documentName: payload.name ?? "" })}
                    </p>
                    {payload.due && (
                      <p className="text-sm">
                        {t("docRequest.due", { date: new Date(payload.due) })}
                      </p>
                    )}
                    {message.body !== payload.name && (
                      <p className="whitespace-pre-line">{message.body}</p>
                    )}
                    <Badge
                      tone={
                        payload.submittedAt
                          ? "success"
                          : payload.due && new Date(payload.due) < now
                            ? "warning"
                            : "neutral"
                      }
                      className="self-start"
                    >
                      {payload.submittedAt
                        ? t("docRequest.status.submitted", { date: new Date(payload.submittedAt) })
                        : payload.due && new Date(payload.due) < now
                          ? t("docRequest.status.overdue")
                          : t("docRequest.status.pending")}
                    </Badge>
                    {!fromOrganization &&
                      !payload.submittedAt &&
                      (cvs.length === 0 ? (
                        <p className="text-sm">
                          <Link href="/app/career/cv" className="underline">
                            {t("docRequest.noDocument")}
                          </Link>
                        </p>
                      ) : (
                        <form action={answerDocumentAction} className="flex flex-col gap-2">
                          <input type="hidden" name="conversation" value={conversation.id} />
                          <input type="hidden" name="request" value={message.id} />
                          <Select
                            id={`document-${message.id}`}
                            name="document"
                            required
                            label={t("docRequest.chooseExisting")}
                            options={cvs.map((cv) => ({ value: cv.id, label: cv.title }))}
                          />
                          <p className="text-ardoise text-caption">{t("docRequest.privacy")}</p>
                          <Button type="submit" size="sm" className="self-start">
                            {t("docRequest.send")}
                          </Button>
                        </form>
                      ))}
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-line">{message.body}</p>
                    {payload.document && (
                      <a
                        href={`/app/messages/${conversation.id}/document/${message.id}`}
                        className="text-sm font-medium underline"
                      >
                        {t("document.view")}
                      </a>
                    )}
                  </>
                )}
                {!mine && !fromOrganization && !message.hiddenAt && message.senderId && (
                  <details className="text-sm">
                    <summary className="cursor-pointer underline">{tr("title.message")}</summary>
                    <ReportForm targetType="message" targetId={message.id} back={back} />
                  </details>
                )}
              </li>
            );
          })}
        </ol>

        {canWrite ? (
          <form
            action={sendMessageAction}
            className="flex flex-col gap-3 border-t border-brume pt-4"
          >
            <input type="hidden" name="conversation" value={conversation.id} />
            <TextArea
              id="message-body"
              name="body"
              required
              rows={3}
              maxLength={MESSAGE_MAX}
              label={t("thread.composer.send")}
              placeholder={t("thread.composer.placeholder")}
            />
            <Button type="submit" className="self-end">
              {t("thread.composer.send")}
            </Button>
          </form>
        ) : (
          fromOrganization &&
          !conversation.blockedAt && <p className="text-sm text-ardoise">{t("list.readOnly")}</p>
        )}
      </section>

      {!fromOrganization && (
        <div className="flex flex-col gap-3">
          <form action={blockAction}>
            <input type="hidden" name="conversation" value={conversation.id} />
            <input type="hidden" name="block" value={conversation.blockedAt ? "0" : "1"} />
            <Button type="submit" variant="tertiary" size="sm">
              {conversation.blockedAt ? t("unblock") : t("block.cta")}
            </Button>
          </form>
          {!conversation.blockedAt && (
            <p className="text-sm text-ardoise">{t("block.confirm.body")}</p>
          )}
          <details className="text-sm">
            <summary className="cursor-pointer underline">{t("report.title")}</summary>
            <ReportForm targetType="conversation" targetId={conversation.id} back={back} />
          </details>
        </div>
      )}
    </div>
  );
}
