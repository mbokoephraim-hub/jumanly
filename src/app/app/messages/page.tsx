import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HireMessages } from "@/components/connect/hire-messages";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { firstConversation, InboxList } from "@/components/talent/messages/inbox-list";
import { Notice } from "@/components/talent/notice";
import { AutoSelect } from "@/components/talent/web/auto-select";
import { db } from "@/server/db";
import { connectViewer } from "@/server/hire-context";
import { talentContactRequests } from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inbox");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * Messages (planche talent-2 § 5): the conversations with the recruiters, the newest first, a
 * request to be put in touch above them. A recruiting team keeps its own screen.
 *
 * On a tablet or a computer (planche web talent-2 § 4) the list is the left column of the
 * messaging and the newest conversation opens beside it (`/app/messages/[id]`).
 */
export default async function MessagesPage({ searchParams }: PageProps<"/app/messages">) {
  const params = await searchParams;
  const { viewer } = await connectViewer("/app/messages");
  if (viewer.hire) return <HireMessages params={params} viewer={viewer} />;

  const t = await getTranslations();
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const answered = typeof params.reponse === "string" ? params.reponse : null;
  const [conversation, requests] = await Promise.all([
    q || answered ? Promise.resolve(null) : firstConversation(viewer.userId),
    talentContactRequests(db, viewer.userId),
  ]);
  // A request waiting for an answer keeps the list in front: nothing opens on its own.
  const first = requests.some((request) => request.status === "pending") ? null : conversation;
  const answeredCompany =
    requests.find((request) => request.id === params.demande)?.organization.name ?? "";

  return (
    <div className="t-flux t-large t-msgs">
      <FlowHead back="/app" backLabel={t("inbox.back")} title={t("inbox.title")} />
      {answered === "declined" && (
        <Notice tone="ok">
          {t("connect.contactRequest.declined", { company: answeredCompany })}
        </Notice>
      )}
      {answered === "blocked" && (
        <Notice tone="ok">
          {t("connect.contactRequest.blocked", { company: answeredCompany })}
        </Notice>
      )}
      {(answered === "expired" || answered === "notFound") && (
        <Notice tone="err">{t("connect.contactRequest.unavailable")}</Notice>
      )}
      <div className="t-msg3 t-msg-seule">
        <div className="t-flux t-msg-ls">
          <InboxList userId={viewer.userId} query={q} />
        </div>
        <div className="t-msg-vide">
          <TalentIcon name="message" />
          <p>{t("inbox.web.choose")}</p>
          <AutoSelect href={first ? `/app/messages/${first}#dernier` : null} from="web" />
        </div>
      </div>
    </div>
  );
}
