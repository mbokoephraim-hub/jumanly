import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { pillClass } from "@/components/career/kit";
import { TabRail } from "@/components/motion/tab-rail";
import { CompanyLogo, segmentedItem, segmentedList } from "@/components/ui";
import { cx } from "@/lib/cx";
import { respondContactAction } from "@/server/actions/connect";
import type { listConversations, Viewer } from "@/server/services/connect";
import type { talentContactRequests } from "@/server/services/talent-search";

type Conversation = Awaited<ReturnType<typeof listConversations>>[number];
type Request = Awaited<ReturnType<typeof talentContactRequests>>[number];

export type ListFilter = "tous" | "non-lus" | "demandes";

/** Name of the other side and the job of a conversation, as the list and the thread show them. */
export function conversationLabels(conversation: Conversation, viewer: Viewer) {
  const name = viewer.hire
    ? (conversation.application?.profile.user.name ??
      conversation.contactRequest?.profile.user.name ??
      "")
    : (conversation.organization?.name ?? "");
  const job =
    conversation.application?.job.title ?? conversation.contactRequest?.job?.title ?? null;
  return { name, job };
}

const DAY = 86_400_000;

/**
 * Column of conversations (mockup 03-21): search, filters in a rail, the pending contact request
 * of a talent, then each conversation with its last message. The open one is in Sapin.
 */
export async function ConversationList({
  viewer,
  conversations,
  requests,
  filter,
  query,
  activeId,
  className,
}: {
  viewer: Viewer;
  conversations: Conversation[];
  requests: Request[];
  filter: ListFilter;
  query: string;
  activeId?: string;
  className?: string;
}) {
  const t = await getTranslations("connect");
  const format = await getFormatter();
  const now = new Date();
  const pending = requests.filter((item) => item.status === "pending");
  const unread = conversations.filter((item) => item.unread);
  const needle = query.trim().toLocaleLowerCase("fr");
  const shown = (filter === "non-lus" ? unread : conversations).filter((conversation) => {
    if (!needle) return true;
    const { name, job } = conversationLabels(conversation, viewer);
    return `${name} ${job ?? ""}`.toLocaleLowerCase("fr").includes(needle);
  });
  const filters: { id: ListFilter; label: string; count?: number }[] = [
    { id: "tous", label: t("list.filter.all") },
    { id: "non-lus", label: t("list.filter.unread"), count: unread.length || undefined },
    ...(viewer.hire
      ? []
      : [
          {
            id: "demandes" as const,
            label: t("list.filter.requests"),
            count: pending.length || undefined,
          },
        ]),
  ];
  const when = (date: Date) => {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    if (date >= startOfToday) return format.dateTime(date, { hour: "2-digit", minute: "2-digit" });
    if (date.getTime() >= startOfToday.getTime() - DAY) return t("thread.yesterday");
    if (date.getTime() >= startOfToday.getTime() - 6 * DAY) {
      return format.dateTime(date, { weekday: "short" });
    }
    return format.dateTime(date, { day: "numeric", month: "short" });
  };
  const request = filter === "tous" && !viewer.hire ? pending[0] : undefined;

  return (
    <section
      aria-labelledby="conversations-title"
      className={cx("flex min-w-0 flex-col gap-2.5 rounded-[24px] bg-blanc p-4", className)}
    >
      <div className="flex items-center justify-between px-1.5 pt-1">
        <h2 id="conversations-title" className="text-lg font-semibold">
          {t("list.title")}
        </h2>
        {unread.length > 0 && (
          <span className="rounded-pill bg-lime px-2.5 py-0.5 text-xs font-semibold text-sapin">
            {t("list.unread", { count: unread.length })}
          </span>
        )}
      </div>
      <form action="/app/messages" role="search" className="relative">
        {filter !== "tous" && <input type="hidden" name="filtre" value={filter} />}
        <label htmlFor="conversations-search" className="sr-only">
          {t("list.search.placeholder")}
        </label>
        <Icon
          name="recherche"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ardoise"
        />
        <input
          id="conversations-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder={t("list.search.placeholder")}
          className="h-11 w-full rounded-pill bg-creme pr-4 pl-10 text-sm placeholder:text-ardoise focus-visible:outline-2 focus-visible:outline-sapin"
        />
      </form>
      <nav aria-label={t("list.filters")}>
        <TabRail name="conversations-filters" className="bg-transparent! p-0!">
          <div className={segmentedList}>
            {filters.map((item) => {
              const on = item.id === filter;
              return (
                <Link
                  key={item.id}
                  href={item.id === "tous" ? "/app/messages" : `/app/messages?filtre=${item.id}`}
                  aria-current={on ? "page" : undefined}
                  className={segmentedItem(on, "h-8 px-3 text-xs")}
                >
                  {item.label}
                  {item.count !== undefined && (
                    <b className="font-semibold text-feuille-fonce">{item.count}</b>
                  )}
                </Link>
              );
            })}
          </div>
        </TabRail>
      </nav>

      {request && (
        <div className="bg-menthe-clair flex flex-col gap-2.5 rounded-[18px] p-3.5 text-sapin">
          <div className="flex items-center gap-2.5">
            <CompanyLogo
              name={request.organization.name}
              size="sm"
              className="size-9! rounded-[11px]! text-xs!"
            />
            <p className="flex-1 text-sm font-semibold">
              {t("contactRequest.title", { company: request.organization.name })}
            </p>
          </div>
          <p className="text-xs leading-4">
            {t("contactRequest.body", {
              recruiterName: request.requester?.name ?? request.organization.name,
            })}
          </p>
          {request.job && (
            <p className="text-xs text-ardoise">
              {t("contactRequest.job", { jobTitle: request.job.title })}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {(["accept", "decline"] as const).map((answer) => (
              <form key={answer} action={respondContactAction}>
                <input type="hidden" name="request" value={request.id} />
                <input type="hidden" name="answer" value={answer} />
                <button
                  type="submit"
                  className={pillClass(answer === "accept" ? "dark" : "outline", "sm")}
                >
                  {answer === "accept" ? t("contactRequest.accept") : t("contactRequest.decline")}
                </button>
              </form>
            ))}
          </div>
          <p className="text-xs text-ardoise">
            {t("contactRequest.expiresOn", { date: request.expiresAt })}
          </p>
        </div>
      )}

      {filter === "demandes" ? null : shown.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-ardoise">{t("list.empty.text")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {shown.map((conversation) => {
            const { name, job } = conversationLabels(conversation, viewer);
            const active = conversation.id === activeId;
            const last = conversation.last;
            const payload = (last?.payload ?? {}) as { document?: unknown };
            const preview = !last
              ? ""
              : last.kind === "invitation"
                ? t("list.item.invitation")
                : last.kind === "document_request"
                  ? t("list.item.documentRequest")
                  : last.senderId === viewer.userId
                    ? t("list.item.you", { message: last.body.slice(0, 120) })
                    : payload.document
                      ? t("list.item.attachment")
                      : last.body.slice(0, 120);
            return (
              <li key={conversation.id}>
                <Link
                  href={`/app/messages/${conversation.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "flex items-start gap-3 rounded-[18px] p-3",
                    active ? "bg-sapin text-blanc" : "hover:bg-creme focus-visible:bg-creme",
                  )}
                >
                  <CompanyLogo
                    name={name}
                    size="md"
                    className="size-11! shrink-0 rounded-[13px]! text-[15px]!"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={cx(
                          "truncate text-[13px]",
                          conversation.unread || active ? "font-semibold" : "font-medium",
                        )}
                      >
                        {name}
                      </span>
                      {last && (
                        <span
                          className={cx(
                            "shrink-0 text-[11px]",
                            active ? "text-blanc/60" : "text-ardoise",
                          )}
                        >
                          {when(last.createdAt)}
                        </span>
                      )}
                    </span>
                    {job && (
                      <span
                        className={cx(
                          "truncate text-xs",
                          active ? "text-blanc/60" : "text-ardoise",
                        )}
                      >
                        {job}
                      </span>
                    )}
                    {preview && (
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={cx(
                            "truncate text-xs",
                            active ? "text-blanc/85" : "text-ardoise",
                            conversation.unread && !active && "font-semibold text-sapin",
                          )}
                        >
                          {preview}
                        </span>
                        {conversation.unread && (
                          <span className="size-2.5 shrink-0 rounded-full bg-lime">
                            <span className="sr-only">{t("list.filter.unread")}</span>
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
