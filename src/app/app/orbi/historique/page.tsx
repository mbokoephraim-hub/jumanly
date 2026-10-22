import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { historyDate, topicLook } from "@/components/talent/orbi-history";
import { requireUser } from "@/server/auth/session";
import { clearOrbiHistoryAction, deleteOrbiConversationAction } from "@/server/actions/orbi";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { listOrbiConversations } from "@/server/services/orbi";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talentOrbi.historyPage");
  return { title: t("metaTitle"), robots: { index: false } };
}

/**
 * « Historique Orbi » (talent lot 4 § 9): find an exchange again (search in titles and messages),
 * reopen it, erase it, or erase everything after a confirmation (`?effacer=1`). A recruiter finds
 * the exchanges of the active organization's space.
 */
export default async function OrbiHistoryPage({ searchParams }: PageProps<"/app/orbi/historique">) {
  const params = await searchParams;
  const user = await requireUser("/app/orbi/historique");
  // In an organization's space, the exchanges held there (recruteur lot 5), never the talent's own.
  const space = await getActiveSpace(user.id);
  const t = await getTranslations("talentOrbi.historyPage");
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const confirming = params.effacer === "1";
  const rows = await listOrbiConversations(db, user.id, query, space?.organizationId ?? null);
  const when = await historyDate();
  // The phone of the talent has no head above the pages any more (Modèle B, B9): this one draws its own.
  const ownHead = !space && (await isPhone());
  const tShell = await getTranslations("talentShell");

  return (
    <>
      {ownHead ? (
        <FlowHead back="/app" backLabel={tShell("header.back")} title={t("metaTitle")} />
      ) : null}
      <form action="/app/orbi/historique" method="get" role="search" className="t-rech t-verre">
        <TalentIcon name="recherche" size="s" />
        <input
          key={query}
          name="q"
          type="search"
          defaultValue={query}
          aria-label={t("search.label")}
          placeholder={t("search.label")}
          enterKeyHint="search"
          autoComplete="off"
        />
        <button type="submit" className="sr-only">
          {t("search.submit")}
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="t-gar">{query ? t("noResult", { query }) : t("empty")}</p>
      ) : (
        <ul aria-label={t("list")} className="t-verre t-liste t-orbi-hist">
          {rows.map((row) => (
            <li key={row.id} className="t-li">
              <Link href={`/app/orbi?c=${row.id}`} className="t-orbi-ligne">
                <span className={`t-cases ${topicLook[row.topic].tone}`}>
                  <TalentIcon name={topicLook[row.topic].icon} size="s" />
                </span>
                <span className="t-t">
                  <b>{row.title}</b>
                  <span>{t("line", { count: row.messages, date: when(row.updatedAt) })}</span>
                </span>
              </Link>
              <form action={deleteOrbiConversationAction} data-no-draft>
                <input type="hidden" name="id" value={row.id} />
                <button
                  type="submit"
                  className="t-bi"
                  aria-label={t("delete", { title: row.title })}
                >
                  <TalentIcon name="supprimer" size="s" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <p className="t-gar">
        <TalentIcon name="supprimer" size="s" />
        {t("guarantee")}
      </p>

      {rows.length > 0 &&
        !query &&
        (confirming ? (
          <div role="alertdialog" aria-labelledby="orbi-effacer" className="t-verre t-orbi-conf">
            <p id="orbi-effacer">{t("clearConfirm")}</p>
            <div className="t-acts">
              <Link href="/app/orbi/historique" className="t-bt t-sec t-s">
                {t("cancel")}
              </Link>
              <form action={clearOrbiHistoryAction} data-no-draft>
                <button type="submit" className="t-bt t-d t-s">
                  {t("clearYes")}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <Link href="/app/orbi/historique?effacer=1" className="t-bt t-txt t-s self-start">
            {t("clear")}
          </Link>
        ))}
    </>
  );
}
