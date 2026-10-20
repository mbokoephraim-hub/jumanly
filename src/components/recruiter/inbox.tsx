import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { initials } from "@/components/ui/avatar";
import { TalentIcon } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import type { HireContext } from "@/server/services/hire";
import {
  inboxFilters,
  listRecruiterInbox,
  type InboxBadge,
  type InboxFilter,
} from "@/server/services/recruiter-inbox";
import { OrbiLine } from "./offers";

const DAY = 86_400_000;

/** The tone of each badge (planche v2.3 `.etq-s`). */
export const badgeTone: Record<InboxBadge, string> = {
  interview: "t-r5-ret",
  hired: "t-r5-ret",
  review: "t-r5-at",
  rejected: "t-r5-nr",
  withdrawn: "t-r5-nr",
  proposal: "t-r5-ct",
};

/** The text key of each filter (the address keeps the French words). */
const filterKey = {
  toutes: "toutes",
  "non-lues": "nonLues",
  retenus: "retenus",
  propositions: "propositions",
  "non-retenus": "nonRetenus",
} as const satisfies Record<InboxFilter, string>;

/** Avatar tones in turn, like the planche (b, a, plain). */
export const avatarTone = (index: number) => ["t-b", "", "t-a"][index % 3]!;

/** « 10:12 », « Hier », « lun. » or « 12 oct. ». */
export async function shortTime(date: Date, now = new Date()) {
  const format = await getFormatter();
  const t = await getTranslations("rhInbox");
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (date >= start) return format.dateTime(date, { hour: "2-digit", minute: "2-digit" });
  if (date.getTime() >= start.getTime() - DAY) return t("yesterday");
  if (date.getTime() >= start.getTime() - 6 * DAY)
    return format.dateTime(date, { weekday: "short" });
  return format.dateTime(date, { day: "numeric", month: "short" });
}

/**
 * Messages of the recruiter space (planche recruteur-3 `MSG_R`, v2.3): the search, the filters
 * (all, unread, retained, proposals, not retained), Orbi's line on the answers awaited, then the
 * conversations with their stage badge, the last message, the time and the unread count.
 */
export async function RecruiterInbox({
  ctx,
  params,
}: {
  ctx: HireContext;
  params: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations("rhInbox");
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const filter: InboxFilter = (inboxFilters as readonly string[]).includes(one("filtre"))
    ? (one("filtre") as InboxFilter)
    : "toutes";
  const q = one("q").slice(0, 100);
  const { rows, unread, waiting } = await listRecruiterInbox(db, ctx, { filter, q });
  const now = new Date();
  const times = await Promise.all(rows.map((row) => shortTime(row.at, now)));
  const href = (value: InboxFilter) => {
    const next = new URLSearchParams();
    if (value !== "toutes") next.set("filtre", value);
    if (q) next.set("q", q);
    const query = next.toString();
    return query ? `/app/messages?${query}` : "/app/messages";
  };
  const names = waiting.slice(0, 2).map((row) => row.firstName);

  return (
    <div className="t-flux">
      <h1 className="sr-only">{t("title")}</h1>
      <form method="get" role="search" className="t-rech t-verre">
        {filter !== "toutes" && <input type="hidden" name="filtre" value={filter} />}
        <TalentIcon name="recherche" size="s" />
        <input
          name="q"
          type="search"
          defaultValue={q}
          aria-label={t("search")}
          placeholder={t("search")}
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent text-[14px] text-(--texte) outline-none"
        />
      </form>

      <nav aria-label={t("filters")} className="t-rx-onglets">
        {inboxFilters.map((value) => (
          <Link
            key={value}
            href={href(value)}
            aria-current={value === filter ? "page" : undefined}
            className="t-puce t-press"
          >
            {t(`filter.${filterKey[value]}`)}
            {value === "non-lues" && unread > 0 && <small>{unread}</small>}
          </Link>
        ))}
      </nav>

      {waiting.length > 0 && filter === "toutes" && !q && (
        <OrbiLine
          action={
            <Link href={`/app/messages/${waiting[0]!.id}#dernier`} className="t-bt t-p t-s t-press">
              {t("orbi.open")}
            </Link>
          }
        >
          {t.rich("orbi.waiting", {
            count: waiting.length,
            names: names.join(` ${t("orbi.and")} `),
            b: (chunks) => <b>{chunks}</b>,
          })}
        </OrbiLine>
      )}

      {rows.length === 0 ? (
        <div className="t-verre t-carte t-vide">
          <b>{q || filter !== "toutes" ? t("empty.filtered") : t("empty.title")}</b>
          {!q && filter === "toutes" && <span>{t("empty.text")}</span>}
        </div>
      ) : (
        <ul aria-label={t("list")} className="t-verre t-r5-cvs">
          {rows.map((row, index) => (
            <li key={row.id}>
              <Link href={`/app/messages/${row.id}#dernier`} className="t-r5-cv t-press">
                <span className={cx("t-rc-av", avatarTone(index))} aria-hidden>
                  {initials(row.name)}
                </span>
                <span className="t-t">
                  <b>
                    <span className="t-r5-nom">{row.name}</span>
                    <span className={cx("t-r5-etq", badgeTone[row.badge])}>
                      {t(`badge.${row.badge}`)}
                    </span>
                  </b>
                  <span className="t-r5-o">
                    {row.proposal
                      ? row.job
                        ? t("proposal", { job: row.job })
                        : t("proposalNoJob")
                      : row.job}
                  </span>
                  <span className={cx("t-r5-m", row.unread > 0 && "t-r5-mnl")}>
                    {row.last
                      ? row.lastMine
                        ? t("mine", { text: row.last.body })
                        : row.last.body
                      : t("noMessage")}
                  </span>
                </span>
                <span className="t-r5-hm">
                  <span>{times[index]}</span>
                  {row.unread > 0 && (
                    <i>
                      <span aria-hidden>{row.unread > 9 ? "9+" : row.unread}</span>
                      <span className="sr-only">{t("unread", { count: row.unread })}</span>
                    </i>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="t-gar">
        <TalentIcon name="confidentialite" size="s" />
        <span>{t("rule")}</span>
      </p>
    </div>
  );
}
