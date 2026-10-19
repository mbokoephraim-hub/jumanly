import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { cx } from "@/lib/cx";
import type { OrbiTopic } from "@/server/services/orbi";
import { TalentIcon, type TalentIconName } from "./icon";

/** Icon and colour of a line, by subject (planche talent-4 § 9). */
export const topicLook: Record<OrbiTopic, { icon: TalentIconName; tone: string }> = {
  cv: { icon: "cv", tone: "t-c2" },
  interview: { icon: "entretien", tone: "t-c1" },
  offer: { icon: "opportunites", tone: "t-c3" },
  path: { icon: "cap", tone: "t-c2" },
  learn: { icon: "lecon", tone: "t-c1" },
  other: { icon: "orbi", tone: "t-c2" },
};

/** « aujourd'hui », « hier » or the day, for a line of the history. */
export async function historyDate() {
  const t = await getTranslations("talentOrbi.historyPage");
  const format = await getFormatter();
  const now = new Date();
  const day = (date: Date) =>
    format.dateTime(date, { year: "numeric", month: "numeric", day: "numeric" });
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return (date: Date) =>
    day(date) === day(now)
      ? t("today")
      : day(date) === day(yesterday)
        ? t("yesterday")
        : format.dateTime(date, { day: "numeric", month: "short" });
}

/**
 * The history at the left of Orbi's page on a computer (planche talent-4 § 9, web): « Nouveau »,
 * the search (it opens the full history), the latest exchanges, the current one lit, and the way to
 * erase them. Hidden below 1200 px, where the clock of the head opens the history page.
 */
export async function OrbiHistoryAside({
  rows,
  current,
}: {
  rows: { id: string; title: string; topic: OrbiTopic; messages: number; updatedAt: Date }[];
  current: string | null;
}) {
  const t = await getTranslations("talentOrbi");
  const when = await historyDate();
  return (
    <aside className="t-orw-h" aria-labelledby="orbi-historique">
      <div className="t-orw-ht">
        <h2 id="orbi-historique">{t("web.title")}</h2>
        <Link href="/app/orbi" className="t-bt t-sec t-s t-press">
          <TalentIcon name="plus" size="xs" />
          {t("web.new")}
        </Link>
      </div>
      <form action="/app/orbi/historique" method="get" role="search" className="t-rech t-verre">
        <TalentIcon name="recherche" size="s" />
        <input
          name="q"
          type="search"
          aria-label={t("web.search")}
          placeholder={t("web.search")}
          enterKeyHint="search"
          autoComplete="off"
        />
      </form>
      {rows.length === 0 ? (
        <p className="t-orw-vide">{t("web.empty")}</p>
      ) : (
        <ul aria-label={t("historyPage.list")} className="t-orw-l">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/app/orbi?c=${row.id}`}
                aria-current={row.id === current ? "page" : undefined}
                className={cx("t-press", row.id === current && "t-on")}
              >
                <span aria-hidden className={cx("t-cases", topicLook[row.topic].tone)}>
                  <TalentIcon name={topicLook[row.topic].icon} size="s" />
                </span>
                <span className="t-t">
                  <b>{row.title}</b>
                  <span>
                    {t("historyPage.line", { count: row.messages, date: when(row.updatedAt) })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/app/orbi/historique" className="t-orw-gar t-press">
        <TalentIcon name="supprimer" size="s" />
        {t("web.guarantee")}
      </Link>
    </aside>
  );
}
