import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { Character } from "@/components/brand/character";
import { pillClass } from "@/components/career/kit";
import { ContactRequests } from "@/components/connect/contact-requests";
import { ConversationList, type ListFilter } from "@/components/connect/conversation-list";
import { db } from "@/server/db";
import { connectViewer } from "@/server/hire-context";
import { listConversations } from "@/server/services/connect";
import { talentContactRequests } from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("connect");
  return { title: { absolute: t("list.title") }, robots: { index: false } };
}

/**
 * Connect (partie 07 § 3 et § 4, mockup 03-21): the conversations of the active space. On a
 * computer the list sits beside the reading pane; on a phone the list is the page.
 */
export default async function MessagesPage({ searchParams }: PageProps<"/app/messages">) {
  const params = await searchParams;
  const { viewer } = await connectViewer("/app/messages");
  const t = await getTranslations("connect");
  const [conversations, requests] = await Promise.all([
    listConversations(db, viewer),
    viewer.hire ? Promise.resolve([]) : talentContactRequests(db, viewer.userId),
  ]);
  const unread = conversations.filter((item) => item.unread);
  const filter: ListFilter =
    !viewer.hire && params.filtre === "demandes"
      ? "demandes"
      : params.filtre === "non-lus"
        ? "non-lus"
        : "tous";
  const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <AppPageHeader eyebrow={t("eyebrow", { count: unread.length })} title={t("title")} />
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <ConversationList
          viewer={viewer}
          conversations={conversations}
          requests={requests}
          filter={filter}
          query={one(params.q)}
        />
        {filter === "demandes" ? (
          <ContactRequests
            requests={requests}
            answered={one(params.reponse)}
            answeredId={one(params.demande)}
          />
        ) : (
          <div className="hidden min-h-[520px] flex-col items-center justify-center gap-4 rounded-[24px] bg-blanc p-8 text-center lg:flex">
            <Character name="kofi" pose="telephone" height={150} />
            <p className="max-w-sm text-sm text-ardoise">
              {conversations.length === 0 ? t("list.empty.text") : t("list.pick")}
            </p>
            {conversations.length === 0 && !viewer.hire && (
              <Link href="/app/jobs" className={pillClass("dark", "sm")}>
                {t("list.empty.cta")}
              </Link>
            )}
            <p className="max-w-sm text-xs text-ardoise">{t("thread.privacy")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
