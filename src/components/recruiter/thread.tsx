import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { initials } from "@/components/ui/avatar";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { switchSpace } from "@/server/actions/hire";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import type { connectViewer } from "@/server/hire-context";
import { authLimits } from "@/server/rate-limit";
import { ConnectError, getConversation, markRead, MESSAGE_MAX } from "@/server/services/connect";
import { hirePermissions } from "@/server/services/hire";
import { interviewsForConversation } from "@/server/services/interviews";
import {
  decisionParagraphs,
  fillTemplate,
  listTemplates,
  templateKinds,
  type TemplateKind,
} from "@/server/services/message-templates";
import { badgeOf } from "@/server/services/recruiter-inbox";
import { organizationCreditsLeft } from "@/server/services/recruiter-orbi";
import { badgeTone } from "./inbox";
import { ThreadComposer, type ComposerTemplate } from "./thread-composer";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { TalentReportForm } from "@/components/talent/report-form";
import { conversationMenuAction } from "@/server/actions/hire-messaging";
import { isOnline, receiptOf } from "@/server/services/hire-messaging";

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
  retracted?: boolean;
  label?: string;
};

const DAY = 86_400_000;
const templateIcon: Record<
  TemplateKind,
  "agenda" | "document" | "horloge" | "valider" | "message"
> = {
  convocation: "agenda",
  document: "document",
  relance: "horloge",
  acceptation: "valider",
  refus: "message",
};
const templateTone: Record<TemplateKind, string> = {
  convocation: "t-c2",
  document: "t-c1",
  relance: "",
  acceptation: "t-c3",
  refus: "",
};

/**
 * A conversation of the recruiter space (planche recruteur-3 `CONV_R`, v2.3): the candidate and
 * their stage at the top, the offer with its stage track and « Dossier », the days, the bubbles,
 * the invitation and document cards, then Orbi's chips (propose a reply, summarize, more formal)
 * and the composer with « + » (slots, a document, the templates). Orbi only drafts: the recruiter
 * reads, changes and sends.
 */
export async function RecruiterThread({
  id,
  query,
  context: { user, viewer },
}: {
  id: string;
  query: Record<string, string | string[] | undefined>;
  context: Awaited<ReturnType<typeof connectViewer>>;
}) {
  const t = await getTranslations("rhThread");
  const t6 = await getTranslations("rhThread6");
  const tt = await getTranslations("hire.templates");
  const format = await getFormatter();
  const ctx = viewer.hire!;

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
    const personal = other.talentUserId === user.id;
    return (
      <div className="t-flux">
        <FlowHead back="/app/messages" backLabel={t("back")} title={t("switch.title")} />
        <div className="t-verre t-carte t-vide">
          <b>
            {personal
              ? t("switch.personal")
              : t("switch.org", { org: other.organization?.name ?? "" })}
          </b>
          <form action={switchSpace}>
            <input
              type="hidden"
              name="space"
              value={personal ? "personal" : (other.organizationId ?? "")}
            />
            <input type="hidden" name="suite" value={`/app/messages/${id}`} />
            <button type="submit" className="t-bt t-p t-s t-press">
              {t("switch.cta")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  await markRead(db, viewer, conversation.id);
  const now = new Date();
  const permissions = hirePermissions(ctx.role);
  const canWrite = permissions.manage && !conversation.blockedAt;
  const application = conversation.application;
  const contact = conversation.contactRequest;
  const person = application?.profile.user ?? contact?.profile.user ?? null;
  const name = person?.name ?? "";
  const jobTitle = application?.job.title ?? contact?.job?.title ?? "";
  const senderIds = [
    ...new Set(
      conversation.messages.map((message) => message.senderId).filter((v): v is string => !!v),
    ),
  ];
  const interviewIds = conversation.messages.flatMap((message) => {
    const interviewId = (message.payload as Payload | null)?.interviewId;
    return message.kind === "invitation" && interviewId ? [interviewId] : [];
  });
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [senderRows, interviewRows, linked, matching, templates, credits, talent, me, seats] =
    await Promise.all([
      db.user.findMany({ where: { id: { in: senderIds } }, select: { id: true, name: true } }),
      interviewsForConversation(db, interviewIds),
      application
        ? db.application.findFirst({
            // Golden rule n° 6: the application is read through the organization.
            where: { id: application.id, job: { organizationId: ctx.organizationId } },
            select: {
              status: true,
              matchScore: true,
              shortlistedAt: true,
              profile: { select: { matchingEnabled: true } },
              stage: { select: { kind: true, name: true, order: true } },
              job: {
                select: {
                  stages: {
                    where: { kind: { notIn: ["hired", "rejected"] } },
                    orderBy: { order: "asc" },
                    select: { id: true, order: true },
                  },
                },
              },
            },
          })
        : Promise.resolve(null),
      level(db, subject, "hire.matching.level"),
      canWrite ? listTemplates(db, ctx) : Promise.resolve([]),
      canWrite ? organizationCreditsLeft(db, ctx.organizationId) : Promise.resolve(null),
      db.user.findUnique({
        where: { id: conversation.talentUserId },
        select: {
          firstName: true,
          name: true,
          lastSeenAt: true,
          showPresence: true,
          readReceipts: true,
        },
      }),
      // Lot 6: presence and receipts are reciprocal; the mute is this member's own.
      db.user.findUnique({
        where: { id: user.id },
        select: { showPresence: true, readReceipts: true },
      }),
      db.conversationParticipant.findMany({
        where: {
          conversationId: conversation.id,
          userId: { in: [conversation.talentUserId, user.id] },
        },
        select: { userId: true, lastReadAt: true, mutedAt: true },
      }),
    ]);
  const mine = { showPresence: me?.showPresence ?? true, readReceipts: me?.readReceipts ?? true };
  const online = isOnline(talent, mine, now);
  const talentSeat = seats.find((row) => row.userId === conversation.talentUserId);
  const muted = Boolean(seats.find((row) => row.userId === user.id)?.mutedAt);
  const pinned = conversation.orgPinnedAt !== null;
  const lastOwn = [...conversation.messages]
    .reverse()
    .find(
      (message) =>
        message.senderId !== conversation.talentUserId && message.senderId && !message.hiddenAt,
    );
  const receipt = receiptOf(
    lastOwn ?? null,
    talent
      ? { readReceipts: talent.readReceipts, lastReadAt: talentSeat?.lastReadAt ?? null }
      : null,
    mine,
  );
  const senders = new Map(senderRows.map((row) => [row.id, row.name]));
  const interviews = new Map(interviewRows.map((row) => [row.id, row]));
  const badge = badgeOf(linked);
  const score =
    linked && matching !== "none" && linked.profile.matchingEnabled ? linked.matchScore : null;
  const firstName = (talent?.firstName || talent?.name || "").split(/\s+/)[0] ?? "";
  const dossier = application
    ? `/app/hire/candidats/${application.id}`
    : contact
      ? `/app/hire/talents/${contact.profile.id}`
      : null;
  const decided =
    !linked ||
    linked.status !== "active" ||
    linked.stage.kind === "hired" ||
    linked.stage.kind === "rejected";

  // The templates of the sheet: the organization's own, else Jumanly's text; a decision opens its
  // own screen, where the message is read before it leaves (lot 3).
  const values = {
    firstName,
    jobTitle,
    company: conversation.organization?.name ?? "",
    signer: user.name,
  };
  const composerTemplates: ComposerTemplate[] = templateKinds.flatMap(
    (kind): ComposerTemplate[] => {
      const look = { icon: templateIcon[kind], tone: templateTone[kind] };
      if (kind === "acceptation" || kind === "refus") {
        if (!application || decided) return [];
        return [
          {
            id: kind,
            kind,
            title: t(`templates.kind.${kind}`),
            line: t(`templates.line.${kind}`),
            href: `/app/hire/candidats/${application.id}/decision?issue=${kind === "refus" ? "rejected" : "hired"}`,
            ...look,
          },
        ];
      }
      const own = templates.filter((template) => template.kind === kind);
      if (own.length > 0)
        return own.map((template) => ({
          id: template.id,
          kind,
          title: template.title,
          line: t(`templates.line.own`),
          body: fillTemplate(template.body, values),
          ...look,
        }));
      return [
        {
          id: kind,
          kind,
          title: t(`templates.kind.${kind}`),
          line: t(`templates.line.${kind}`),
          body: tt(`default.${kind}.body`, {
            firstName,
            jobTitle,
            company: values.company,
            signer: user.name,
          }).replaceAll("\\n", "\n"),
          ...look,
        },
      ];
    },
  );

  const dayLabel = (date: Date) => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    if (date >= start) return t("today");
    if (date.getTime() >= start.getTime() - DAY) return t("yesterday");
    return format.dateTime(date, { weekday: "long", day: "numeric", month: "long" });
  };
  const time = (date: Date) => format.dateTime(date, { hour: "2-digit", minute: "2-digit" });
  const lastId = conversation.messages.at(-1)?.id;
  const one = (key: string) => (typeof query[key] === "string" ? (query[key] as string) : "");
  const stages = linked?.job.stages ?? [];

  return (
    <div className="t-flux t-r5-conv">
      <div className="t-r5-ch">
        <Link href="/app/messages" aria-label={t("back")} className="t-bi t-press">
          <TalentIcon name="retour" size="s" />
        </Link>
        <span className="t-rc-av t-b" aria-hidden>
          {initials(name)}
        </span>
        <div className="t-t">
          <h1>{name}</h1>
          <span className={cx("t-r5-etq", badgeTone[badge])}>{t(`badge.${badge}`)}</span>
          {online && <span className="t-r6-online">{t6("online")}</span>}
        </div>
        <SheetButton target="r5-conv-menu" className="t-bi t-press" label={t("menu.open")}>
          <TalentIcon name="plus-options" size="s" />
        </SheetButton>
      </div>

      {jobTitle && (
        <div className="t-r5-ctx">
          <span className="t-cases t-c3" aria-hidden>
            <TalentIcon name="offre" size="s" />
          </span>
          <div className="t-t">
            <b>{jobTitle}</b>
            <span>
              {linked
                ? score !== null
                  ? t("context.stageScore", { stage: linked.stage.name, score })
                  : t("context.stage", { stage: linked.stage.name })
                : t("context.proposal")}
            </span>
            {linked && stages.length > 1 && (
              <span className="t-r5-stp" aria-hidden>
                {stages.map((stage) => (
                  <i key={stage.id} className={cx(stage.order <= linked.stage.order && "t-on")} />
                ))}
              </span>
            )}
          </div>
          {dossier && (
            <Link href={dossier} className="t-bt t-sec t-s t-press">
              {application ? t("context.file") : t("context.profile")}
            </Link>
          )}
        </div>
      )}

      {one("ok") === "document" && <Notice tone="ok">{t("ok.document")}</Notice>}
      {["pin", "unpin", "mute", "unmute"].includes(one("ok")) && (
        <ToastOnLoad message={t6(`ok.${one("ok") as "pin"}`)} />
      )}
      {one("signalement") === "ok" && <ToastOnLoad message={t6("reported")} />}
      {one("signalement") === "deja" && <ToastOnLoad message={t6("reportedAlready")} />}
      {one("erreur") === "trop" ? (
        <Notice tone="err">{t("error.tooMany", { seconds: authLimits.message.window })}</Notice>
      ) : one("erreur") === "document" ? (
        <Notice tone="err">{t("error.document")}</Notice>
      ) : (
        one("erreur") && <Notice tone="err">{t("error.send")}</Notice>
      )}
      {conversation.blockedAt && <Notice tone="err">{t("blocked")}</Notice>}

      <ol className="t-fil t-r5-fil" aria-label={t("thread", { name })}>
        {conversation.messages.length === 0 && <li className="t-r5-vide">{t("empty")}</li>}
        {conversation.messages.map((message, index) => {
          const payload = (message.payload ?? {}) as Payload;
          const fromTalent = message.senderId === conversation.talentUserId;
          const author = fromTalent
            ? firstName
            : message.senderId === user.id
              ? null
              : (senders.get(message.senderId ?? "") ?? t("team"));
          const previous = conversation.messages[index - 1];
          const newDay = !previous || dayLabel(previous.createdAt) !== dayLabel(message.createdAt);
          const interview =
            message.kind === "invitation" ? interviews.get(payload.interviewId ?? "") : undefined;
          const when = (date: Date, zone?: string) =>
            format.dateTime(date, {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              ...(zone ? { timeZone: zone } : {}),
            });
          let body;
          if (message.hiddenAt) {
            body = (
              <div className="t-b-r t-cache">
                <i>{payload.retracted ? t("retracted") : t("hidden")}</i>
              </div>
            );
          } else if (message.kind === "system") {
            body = <p className="t-r5-sys">{message.body}</p>;
          } else if (message.kind === "invitation") {
            const inside = (
              <>
                <span className="t-cases t-c2" aria-hidden>
                  <TalentIcon name="agenda" size="s" />
                </span>
                <span className="t-t">
                  <b>{t(`invite.${interview?.status ?? "pending"}`)}</b>
                  <span>
                    {interview?.startsAt
                      ? when(interview.startsAt, interview.timezone)
                      : interview && interview.slots.length > 0
                        ? interview.slots
                            .map((slot) => when(slot, interview.timezone))
                            .join(` ${t("or")} `)
                        : message.body}
                  </span>
                </span>
              </>
            );
            body = interview ? (
              <Link className="t-r5-inv t-press" href={`/app/hire/entretiens/${interview.id}`}>
                {inside}
              </Link>
            ) : (
              <div className="t-r5-inv">{inside}</div>
            );
          } else if (message.kind === "document_request") {
            const late = !payload.submittedAt && payload.due && new Date(payload.due) < now;
            body = (
              <div className="t-r5-inv">
                <span className="t-cases t-c1" aria-hidden>
                  <TalentIcon name="document" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("document.title", { name: payload.name ?? "" })}</b>
                  <span>
                    {payload.submittedAt
                      ? t("document.received", { date: new Date(payload.submittedAt) })
                      : late
                        ? t("document.overdue")
                        : payload.due
                          ? t("document.due", { date: new Date(payload.due) })
                          : t("document.pending")}
                  </span>
                </span>
              </div>
            );
          } else if (message.kind === "file") {
            body = (
              <a
                href={`/app/messages/${conversation.id}/document/${message.id}`}
                className={cx("t-b-f t-press", fromTalent && "t-recu")}
              >
                <TalentIcon name="document" size="s" />
                <span>
                  <b>{payload.document?.title ?? message.body}</b>
                  <span>{t("file.open")}</span>
                </span>
              </a>
            );
          } else if (message.kind === "slot" && payload.startsAt) {
            body = (
              <div className={cx("t-b-f", fromTalent && "t-recu")}>
                <TalentIcon name="agenda" size="s" />
                <span>
                  <b>{t("slot")}</b>
                  <span>{when(new Date(payload.startsAt), payload.timezone ?? "UTC")}</span>
                </span>
              </div>
            );
          } else if (message.kind === "decision") {
            body = (
              <div className="t-b-r t-decision">
                <b>{payload.outcome === "hired" ? t("decision.hired") : t("decision.rejected")}</b>
                {decisionParagraphs(message.body).map((paragraph, at) => (
                  <p key={at} className="t-texte-l">
                    {paragraph}
                  </p>
                ))}
              </div>
            );
          } else {
            body = (
              <div className={fromTalent ? "t-b-r" : "t-bulle-u"}>
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
              </div>
            );
          }
          return (
            <li
              key={message.id}
              id={message.id === lastId ? "dernier" : undefined}
              className={cx("t-msg", fromTalent ? "t-eux" : "t-moi")}
            >
              {newDay && <span className="t-jour">{dayLabel(message.createdAt)}</span>}
              {body}
              <small className="t-heure">
                {author
                  ? t("meta", { author, time: time(message.createdAt) })
                  : time(message.createdAt)}
                {message.id === lastOwn?.id && receipt && (
                  <span className={cx("t-r6-lu", receipt === "read" && "t-on")}>
                    {" · "}
                    {t6(`receipt.${receipt}`)}
                  </span>
                )}
              </small>
            </li>
          );
        })}
      </ol>

      {canWrite ? (
        <ThreadComposer
          conversationId={conversation.id}
          applicationId={application?.id ?? null}
          max={MESSAGE_MAX}
          templates={composerTemplates}
          slotsHref={
            application && !decided ? `/app/hire/candidats/${application.id}/entretien` : null
          }
          labels={{
            placeholder: t("composer.placeholder"),
            send: t("composer.send"),
            plus: t("composer.plus"),
            orbi: t("orbi.reply"),
            chips: {
              reply: t("orbi.reply"),
              summary: t("orbi.summary"),
              formal: t("orbi.formal"),
            },
            chipsLabel: t("orbi.label"),
            draft: t("orbi.draft"),
            summaryTitle: t("orbi.summaryTitle"),
            edit: t("orbi.edit"),
            use: t("orbi.use"),
            close: t("orbi.close"),
            thinking: t("orbi.thinking"),
            template: t("orbi.noAi"),
            credits:
              credits === null ? t("orbi.creditsUnlimited") : t("orbi.credits", { count: credits }),
            errors: {
              empty: t("orbi.error.empty"),
              formalEmpty: t("orbi.error.formalEmpty"),
              failed: t("orbi.error.failed"),
              consent: t("orbi.limit.consent"),
              quota: t("orbi.limit.quota"),
              entitlement: t("orbi.limit.entitlement"),
              unavailable: t("orbi.limit.unavailable"),
            },
            plusTitle: t("plus.title"),
            plusSlots: t("plus.slots"),
            plusSlotsLine: t("plus.slotsLine"),
            plusDocument: t("plus.document"),
            plusDocumentLine: t("plus.documentLine"),
            plusTemplates: t("plus.templates"),
            plusTemplatesLine: t("plus.templatesLine"),
            templatesTitle: t("templates.title"),
            templatesCreate: t("templates.create"),
            templatesRule: t("templates.rule"),
            documentTitle: t("documentSheet.title"),
            documentName: t("documentSheet.name"),
            documentNamePlaceholder: t("documentSheet.namePlaceholder"),
            documentDue: t("documentSheet.due"),
            documentNote: t("documentSheet.note"),
            documentForbidden: t("documentSheet.forbidden"),
            documentSend: t("documentSheet.send"),
            sheetClose: t("close"),
          }}
          documentNote={tt("default.document.body", {
            firstName,
            jobTitle,
            company: values.company,
            signer: user.name,
          }).replaceAll("\\n", "\n")}
        />
      ) : (
        !conversation.blockedAt && <p className="t-gar">{t("readOnly")}</p>
      )}

      <Sheet id="r5-conv-menu" title={t("menu.title")} closeLabel={t("close")}>
        <ul className="t-verre t-liste t-lignes">
          {dossier && (
            <li>
              <Link href={dossier} className="t-li t-press">
                <span className="t-cases t-c3" aria-hidden>
                  <TalentIcon name="candidats" size="s" />
                </span>
                <span className="t-t">
                  <b>{application ? t("menu.file") : t("menu.profile")}</b>
                </span>
                <TalentIcon name="suivant" />
              </Link>
            </li>
          )}
          {application && permissions.manage && !decided && (
            <li>
              <Link href={`${dossier}/decision`} className="t-li t-press">
                <span className="t-cases t-c1" aria-hidden>
                  <TalentIcon name="valider" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("menu.decision")}</b>
                </span>
                <TalentIcon name="suivant" />
              </Link>
            </li>
          )}
          <li>
            <Link href="/app/hire/modeles" className="t-li t-press">
              <span className="t-cases t-c2" aria-hidden>
                <TalentIcon name="message" size="s" />
              </span>
              <span className="t-t">
                <b>{t("menu.templates")}</b>
              </span>
              <TalentIcon name="suivant" />
            </Link>
          </li>
          <li>
            <Link href="/app/orbi" className="t-li t-press">
              <span className="t-cases" aria-hidden>
                <TalentIcon name="orbi" size="s" />
              </span>
              <span className="t-t">
                <b>{t("menu.orbi")}</b>
              </span>
              <TalentIcon name="suivant" />
            </Link>
          </li>
          {/* Lot 6 (planche CONV_MENU): pin for the team, mute for oneself, remove, report. */}
          <li>
            <form action={conversationMenuAction}>
              <input type="hidden" name="conversation" value={conversation.id} />
              <input type="hidden" name="action" value={pinned ? "unpin" : "pin"} />
              <button type="submit" className="t-li t-press">
                <span className="t-cases t-c1" aria-hidden>
                  <TalentIcon name="favori" size="s" />
                </span>
                <span className="t-t">
                  <b>{pinned ? t6("menu.unpin") : t6("menu.pin")}</b>
                  <span>{t6("menu.pinText")}</span>
                </span>
              </button>
            </form>
          </li>
          <li>
            <form action={conversationMenuAction}>
              <input type="hidden" name="conversation" value={conversation.id} />
              <input type="hidden" name="action" value={muted ? "unmute" : "mute"} />
              <button type="submit" className="t-li t-press">
                <span className="t-cases" aria-hidden>
                  <TalentIcon name="notification" size="s" />
                </span>
                <span className="t-t">
                  <b>{muted ? t6("menu.unmute") : t6("menu.mute")}</b>
                  <span>{t6("menu.muteText")}</span>
                </span>
              </button>
            </form>
          </li>
          {permissions.manage && (
            <li>
              <SheetButton target="r6-conv-retirer" className="t-li t-press">
                <span className="t-cases" aria-hidden>
                  <TalentIcon name="fermer" size="s" />
                </span>
                <span className="t-t">
                  <b>{t6("menu.hide")}</b>
                  <span>{t6("menu.hideText")}</span>
                </span>
              </SheetButton>
            </li>
          )}
          <li>
            <SheetButton target="r6-conv-signaler" className="t-li t-press">
              <span className="t-cases" aria-hidden>
                <TalentIcon name="aide" size="s" />
              </span>
              <span className="t-t">
                <b>{t6("menu.report")}</b>
              </span>
            </SheetButton>
          </li>
        </ul>
      </Sheet>
      {permissions.manage && (
        <Sheet id="r6-conv-retirer" title={t6("hide.title")} closeLabel={t("close")}>
          <form action={conversationMenuAction} className="t-flux">
            <input type="hidden" name="conversation" value={conversation.id} />
            <input type="hidden" name="action" value="hide" />
            <p>{t6("hide.text", { name: firstName })}</p>
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t6("hide.confirm")}
            </button>
          </form>
        </Sheet>
      )}
      <Sheet id="r6-conv-signaler" title={t6("report.title")} closeLabel={t("close")}>
        <TalentReportForm
          targetType="conversation"
          targetId={conversation.id}
          back={`/app/messages/${conversation.id}`}
        />
      </Sheet>
    </div>
  );
}
