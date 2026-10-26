import "server-only";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { db } from "@/server/db";
import { ConnectError, getConversation, markRead } from "@/server/services/connect";
import { hirePermissions, HireError, type HireContext } from "@/server/services/hire";
import { relationThread, teamThread } from "@/server/services/hire-phone-messages";
import { interviewsForConversation } from "@/server/services/interviews";
import { fillTemplate, listTemplates, templateKinds } from "@/server/services/message-templates";
import { initialsOf, tintOf } from "./candidatures";
import { RhThread, type RhBubble, type RhThreadData } from "./conversation-client";

const OK = ["document", "file", "mute", "unmute", "pin", "unpin"] as const;
const ERRORS = ["invalid", "blocked", "trop", "file", "document", "other"] as const;
type Query = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** « mar. 16 h 02 », « 9 h 12 » today, the date beyond a week. */
async function stamp(at: Date, now: Date) {
  const format = await getFormatter();
  const day = (date: Date) =>
    format.dateTime(date, { year: "numeric", month: "numeric", day: "numeric" });
  const time = format
    .dateTime(at, { hour: "numeric", minute: "2-digit" })
    .replace(/^(\d+):(\d+)$/, "$1 h $2");
  if (day(at) === day(now)) return time;
  if (now.getTime() - at.getTime() < 6 * 86_400_000)
    return `${format.dateTime(at, { weekday: "short" })} ${time}`;
  return format.dateTime(at, { day: "numeric", month: "short" });
}

async function feedback(query: Query) {
  const t = await getTranslations("phoneRhMessages");
  const ok = OK.find((key) => key === one(query.ok));
  const error = ERRORS.find((key) => key === one(query.erreur));
  return {
    toast: ok ? t(`ok.${ok}`) : null,
    error: error ? t(`error.${error}`) : null,
  };
}

/**
 * A conversation of the recruiter on the phone (planches 125 to 131): the person and the green
 * line, the card of what the conversation is about with « Ouvrir », the bubbles, an interview's
 * card, then « Orbi propose · Modèles · Joindre » and the field. With a candidate or a talent the
 * organization writes; with a relation, the member writes as themself.
 */
export async function RhConversation({
  ctx,
  userId,
  userName,
  id,
  query,
}: {
  ctx: HireContext;
  userId: string;
  userName: string;
  id: string;
  query: Query;
}) {
  const t = await getTranslations("phoneRhMessages");
  const trh = await getTranslations("rhThread.templates");
  const tt = await getTranslations("hire.templates");
  const format = await getFormatter();
  const now = new Date();
  const conversation = await getConversation(db, { userId, hire: ctx }, id)
    .then(async (found) => {
      await markRead(db, { userId, hire: ctx }, found.id);
      return found;
    })
    .catch(async (error) => {
      if (!(error instanceof ConnectError)) throw error;
      return relationThread(db, userId, id).catch((other) => {
        if (other instanceof HireError || other instanceof ConnectError) notFound();
        throw other;
      });
    });
  const peer = conversation.kind === "peer";
  const application = conversation.application;
  const contact = conversation.contactRequest;
  const other = peer
    ? conversation.connection!.requester.id === userId
      ? conversation.connection!.addressee
      : conversation.connection!.requester
    : null;
  const talentId = peer ? other!.id : conversation.talentUserId;

  const [talent, interviews, templates, participant, profile] = await Promise.all([
    db.user.findUnique({
      where: { id: talentId },
      select: {
        name: true,
        firstName: true,
        talentProfile: { select: { id: true, headline: true } },
      },
    }),
    interviewsForConversation(
      db,
      conversation.messages.flatMap((message) => {
        const interviewId = (message.payload as { interviewId?: string } | null)?.interviewId;
        return message.kind === "invitation" && interviewId ? [interviewId] : [];
      }),
    ),
    peer ? Promise.resolve([]) : listTemplates(db, ctx),
    db.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: conversation.id, userId } },
      select: { mutedAt: true },
    }),
    contact ? Promise.resolve(contact.profile.id) : Promise.resolve(null),
  ]);
  const name = talent?.name ?? "";
  const firstName = (talent?.firstName || name).split(/\s+/)[0] ?? "";

  const context = application
    ? application.stage
      ? t("context.application", { job: application.job.title, stage: application.stage.name })
      : application.job.title
    : contact
      ? contact.job
        ? t("context.proposal", { job: contact.job.title })
        : t("context.proposalNoJob")
      : talent?.talentProfile?.headline
        ? t("context.relation", { headline: talent.talentProfile.headline })
        : t("context.relationOnly");
  const open = application
    ? `/app/hire/candidats/${application.id}`
    : profile
      ? `/app/hire/talents/${profile}`
      : `/app/personnes/${talentId}`;

  const byInterview = new Map(interviews.map((interview) => [interview.id, interview]));
  const bubbles: RhBubble[] = await Promise.all(
    conversation.messages.map(async (message) => {
      const mine = peer
        ? message.senderId === userId
        : message.senderId !== conversation.talentUserId;
      const at = await stamp(message.createdAt, now);
      const payload = (message.payload ?? {}) as {
        name?: string;
        upload?: { name?: string };
        interviewId?: string;
      };
      if (message.hiddenAt)
        return { id: message.id, mine, at, kind: "text", text: t("thread.withdrawn"), muted: true };
      if (message.kind === "system")
        return { id: message.id, mine: false, at, kind: "system", text: message.body };
      if (message.kind === "document_request")
        return {
          id: message.id,
          mine,
          at,
          kind: "text",
          text: `${t("thread.document", { name: payload.name ?? "" })}${message.body && message.body !== payload.name ? `\n${message.body}` : ""}`,
        };
      if (message.kind === "file" && payload.upload)
        return {
          id: message.id,
          mine,
          at,
          kind: "file",
          text: t("thread.file", { name: payload.upload.name ?? "" }),
          href: `/app/messages/${conversation.id}/media/${message.id}`,
        };
      if (message.kind === "invitation" && payload.interviewId) {
        const interview = byInterview.get(payload.interviewId);
        if (interview) {
          const when = interview.startsAt
            ? format.dateTime(interview.startsAt, {
                weekday: "long",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })
            : null;
          return {
            id: message.id,
            mine,
            at,
            kind: "interview",
            text: when ? t("thread.interview", { when }) : t("thread.interviewPending"),
            sub: `${t(`thread.mode.${interview.mode}`)} · ${t(`thread.interviewState.${interview.status}`)}`,
          };
        }
      }
      return { id: message.id, mine, at, kind: "text", text: message.body };
    }),
  );

  const values = {
    firstName,
    jobTitle: application?.job.title ?? contact?.job?.title ?? "",
    company: conversation.organization?.name ?? "",
    signer: userName,
  };
  const ownTemplates = templateKinds
    .filter((kind) => kind !== "acceptation" && kind !== "refus")
    .flatMap((kind) => {
      const own = templates.filter((template) => template.kind === kind);
      if (own.length > 0)
        return own.map((template) => ({
          key: template.id,
          title: template.title,
          body: fillTemplate(template.body, values),
        }));
      return [
        {
          key: kind,
          title: trh(`kind.${kind}`),
          body: tt(`default.${kind}.body`, values).replaceAll("\\n", "\n"),
        },
      ];
    });

  const writable = peer
    ? conversation.connection?.status === "accepted"
    : hirePermissions(ctx.role).manage && !conversation.blockedAt;
  const { toast, error } = await feedback(query);
  const data: RhThreadData = {
    kind: peer ? "relation" : "organization",
    conversationId: conversation.id,
    applicationId: application?.id ?? null,
    name,
    initials: initialsOf(name) || "?",
    tint: tintOf(talentId),
    context,
    open,
    bubbles,
    templates: ownTemplates,
    canWrite: writable,
    notice: writable ? null : conversation.blockedAt ? t("thread.blocked") : t("thread.readOnly"),
    muted: Boolean(participant?.mutedAt),
    pinned: Boolean(conversation.orgPinnedAt),
    error,
    start: one(query.modeles) === "1" && !peer ? "templates" : null,
  };
  return (
    <>
      {toast ? <ToastOnLoad message={toast} tone="success" /> : null}
      <RhThread data={data} />
    </>
  );
}

/** A conversation with a colleague (planches 132, 133): only the two of them read it. */
export async function RhTeamConversation({
  ctx,
  id,
  query,
}: {
  ctx: HireContext;
  id: string;
  query: Query;
}) {
  const t = await getTranslations("phoneRhMessages");
  const now = new Date();
  const thread = await teamThread(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const role = thread.other.role ? t(`role.${thread.other.role}`) : "";
  const context = [thread.other.jobTitle, role].filter(Boolean).join(" · ");
  const { error } = await feedback(query);
  const data: RhThreadData = {
    kind: "team",
    conversationId: thread.id,
    applicationId: null,
    name: thread.other.name,
    initials: initialsOf(thread.other.name) || "?",
    tint: tintOf(thread.other.id),
    context,
    open: `/app/personnes/${thread.other.id}`,
    bubbles: await Promise.all(
      thread.messages.map(async (message) => ({
        id: message.id,
        mine: message.mine,
        at: await stamp(message.at, now),
        kind: "text" as const,
        text: message.body,
      })),
    ),
    templates: [],
    canWrite: !thread.other.left,
    notice: thread.other.left ? t("thread.left") : null,
    muted: false,
    pinned: false,
    error,
  };
  return <RhThread data={data} />;
}
