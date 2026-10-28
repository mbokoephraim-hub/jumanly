import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { RhTeamConversation } from "@/components/phone/recruteur/conversation";
import { RhMessagesTexts } from "@/components/phone/recruteur/messages";
import { FlowHead } from "@/components/talent/flow-head";
import { rhSendTeamAction } from "@/server/actions/phone-rh-messages";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { teamThread } from "@/server/services/hire-phone-messages";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhMessages");
  return { title: t("title"), robots: { index: false } };
}

/**
 * A conversation between two members of the organization (« Équipe » of Messages, Modèle B
 * recruteur M7). On a phone the Modèle B screen; on a computer, the same messages in a plain page
 * until the web space has its own team messaging.
 */
export default async function TeamThreadPage({
  params,
  searchParams,
}: PageProps<"/app/messages/equipe/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx } = await requireHire(`/app/messages/equipe/${id}`);
  if (await isPhone())
    return (
      <RhMessagesTexts>
        <RhTeamConversation ctx={ctx} id={id} query={query} />
      </RhMessagesTexts>
    );
  const t = await getTranslations("phoneRhMessages");
  const format = await getFormatter();
  const thread = await teamThread(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  return (
    <div className="t-flux">
      <FlowHead back="/app/messages" backLabel={t("thread.back")} title={thread.other.name} />
      <ol className="t-flux">
        {thread.messages.map((message) => (
          <li key={message.id} className="t-verre t-carte">
            <p>{message.body}</p>
            <small className="t-meta">
              {message.mine ? t("row.you", { text: "" }) : thread.other.name} ·{" "}
              {format.dateTime(message.at, {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </small>
          </li>
        ))}
      </ol>
      {thread.other.left ? (
        <p className="t-meta">{t("thread.left")}</p>
      ) : (
        <form action={rhSendTeamAction} className="t-flux">
          <input type="hidden" name="thread" value={thread.id} />
          <label className="sr-only" htmlFor="equipe-message">
            {t("thread.input")}
          </label>
          <textarea id="equipe-message" name="body" required maxLength={4000} rows={3} />
          <button type="submit" className="t-bt t-p t-s t-press">
            {t("thread.send")}
          </button>
        </form>
      )}
    </div>
  );
}
