import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeaderAction } from "@/components/app/header-action";
import { AppPageHeader } from "@/components/app/page-header";
import { Character } from "@/components/brand/character";
import { pillClass } from "@/components/career/kit";
import { ContactRequests } from "@/components/connect/contact-requests";
import {
  ConversationList,
  conversationLabels,
  type ListFilter,
} from "@/components/connect/conversation-list";
import { db } from "@/server/db";
import { listConversations, type Viewer } from "@/server/services/connect";
import { talentContactRequests } from "@/server/services/talent-search";

/**
 * Connect for a recruiting team (partie 07 § 3 et § 4, mockup 03-21): the conversations of the
 * organization. The talent has its own screens (planche talent-2 § 5). On a
 * computer the list sits beside the reading pane; on a phone the list is the page.
 */
export async function HireMessages({
  params,
  viewer,
}: {
  params: Record<string, string | string[] | undefined>;
  viewer: Viewer;
}) {
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
  const latest = unread[0] ?? conversations[0];
  const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <AppPageHeader
        eyebrow={t("eyebrow", { count: unread.length })}
        title={t("title")}
        actions={
          latest && (
            <HeaderAction
              href={`/app/messages/${latest.id}`}
              icon="message"
              label={t("resume", { name: conversationLabels(latest, viewer).name })}
            />
          )
        }
      />
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
