import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { requireUser } from "@/server/auth/session";
import { clearOrbiHistoryAction, deleteOrbiConversationAction } from "@/server/actions/orbi";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { listOrbiConversations, type OrbiTopic } from "@/server/services/orbi";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talentOrbi.historyPage");
  return { title: t("metaTitle"), robots: { index: false } };
}

/** Icon and colour of a line, by subject (planche talent-4 § 9). */
const topicLook: Record<OrbiTopic, { icon: TalentIconName; tone: string }> = {
  cv: { icon: "cv", tone: "t-c2" },
  interview: { icon: "entretien", tone: "t-c1" },
  offer: { icon: "opportunites", tone: "t-c3" },
  path: { icon: "cap", tone: "t-c2" },
  learn: { icon: "lecon", tone: "t-c1" },
  other: { icon: "orbi", tone: "t-c2" },
};

/**
 * « Historique Orbi » (talent lot 4 § 9): find an exchange again (search in titles and messages),
 * reopen it, erase it, or erase everything after a confirmation (`?effacer=1`).
 */
export default async function OrbiHistoryPage({ searchParams }: PageProps<"/app/orbi/historique">) {
  const params = await searchParams;
  const user = await requireUser("/app/orbi/historique");
  if (await getActiveSpace(user.id)) redirect("/app/hire");
  const t = await getTranslations("talentOrbi.historyPage");
  const format = await getFormatter();
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const confirming = params.effacer === "1";
  const rows = await listOrbiConversations(db, user.id, query);

  const now = new Date();
  const day = (date: Date) =>
    format.dateTime(date, { year: "numeric", month: "numeric", day: "numeric" });
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const when = (date: Date) =>
    day(date) === day(now)
      ? t("today")
      : day(date) === day(yesterday)
        ? t("yesterday")
        : format.dateTime(date, { day: "numeric", month: "short" });

  return (
    <>
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
