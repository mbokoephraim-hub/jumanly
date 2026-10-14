import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, ButtonLink, EmptyState } from "@/components/ui";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { connectViewer } from "@/server/hire-context";
import { ContactRequests } from "@/components/connect/contact-requests";
import { listConversations } from "@/server/services/connect";
import { talentContactRequests } from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("connect");
  return { title: { absolute: t("list.title") }, robots: { index: false } };
}

/** Connect (partie 07 § 3 et § 4): the conversations of the active space. */
export default async function MessagesPage({ searchParams }: PageProps<"/app/messages">) {
  const params = await searchParams;
  const { viewer } = await connectViewer("/app/messages");
  const t = await getTranslations("connect");
  const conversations = await listConversations(db, viewer);
  const unread = conversations.filter((item) => item.unread);
  const requestsTab = !viewer.hire && params.filtre === "demandes";
  const onlyUnread = params.filtre === "non-lus";
  const shown = onlyUnread ? unread : conversations;
  const requests = viewer.hire ? [] : await talentContactRequests(db, viewer.userId);
  const pending = requests.filter((item) => item.status === "pending").length;
  const filter = requestsTab ? "demandes" : onlyUnread ? "non-lus" : "tous";
  const filters = [
    { id: "tous", label: t("list.filter.all") },
    { id: "non-lus", label: t("list.filter.unread") },
    ...(viewer.hire
      ? []
      : [
          {
            id: "demandes",
            label:
              pending > 0 ? `${t("list.filter.requests")} (${pending})` : t("list.filter.requests"),
          },
        ]),
  ];
  const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-eyebrow text-ardoise">{t("eyebrow", { count: unread.length })}</p>
        <h1 className="text-h1">{t("list.title")}</h1>
      </header>
      <nav aria-label={t("list.title")} className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const active = item.id === filter;
          return (
            <Link
              key={item.id}
              href={`/app/messages?filtre=${item.id}`}
              aria-current={active ? "page" : undefined}
              className={cx(
                "rounded-pill px-4 py-2 text-[15px] font-medium",
                active ? "bg-sapin text-blanc" : "bg-blanc",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {requestsTab ? (
        <ContactRequests
          requests={requests}
          answered={one(params.reponse)}
          answeredId={one(params.demande)}
        />
      ) : shown.length === 0 ? (
        <EmptyState
          title={t("list.empty.text")}
          action={
            viewer.hire ? undefined : (
              <ButtonLink href="/app/jobs">{t("list.empty.cta")}</ButtonLink>
            )
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-brume rounded-card bg-blanc">
          {shown.map((conversation) => {
            const other = viewer.hire
              ? (conversation.application?.profile.user.name ??
                conversation.contactRequest?.profile.user.name ??
                "")
              : (conversation.organization?.name ?? "");
            const last = conversation.last;
            const preview = !last
              ? ""
              : last.kind === "document_request"
                ? t("list.item.documentRequest")
                : last.senderId === viewer.userId
                  ? t("list.item.you", { message: last.body.slice(0, 120) })
                  : last.body.slice(0, 120);
            return (
              <li key={conversation.id}>
                <Link
                  href={`/app/messages/${conversation.id}`}
                  className="flex flex-col gap-1 p-4 hover:bg-creme focus-visible:bg-creme"
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className={cx("text-sapin", conversation.unread && "font-semibold")}>
                      {t("thread.withJob", {
                        name: other,
                        jobTitle:
                          conversation.application?.job.title ??
                          conversation.contactRequest?.job?.title ??
                          t("list.filter.requests"),
                      })}
                    </span>
                    {conversation.unread && <Badge tone="new">{t("list.filter.unread")}</Badge>}
                  </span>
                  {preview && <span className="line-clamp-1 text-sm text-ardoise">{preview}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
