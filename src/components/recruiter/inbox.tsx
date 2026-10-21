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
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cleanupConversationsAction } from "@/server/actions/hire-messaging";
import { cleanupCandidates } from "@/server/services/hire-messaging";
import { AutoSelect } from "@/components/talent/web/auto-select";

const DAY = 86_400_000;

/** The tone of each badge (planche v2.3 `.etq-s`). */
export const badgeTone: Record<InboxBadge, string> = {
  interview: "t-r5-ret",
  hired: "t-r5-ret",
  review: "t-r5-at",
  retained: "t-r5-ret",
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
  const tw = await getTranslations("hireWeb3.messages");
  return (
    <div className="t-flux t-large t-rw3-msgs">
      <h1 className="sr-only">{t("title")}</h1>
      <MessagesHead />
      <div className="t-msg3 t-rw3-m3">
        <div className="t-flux t-msg-ls t-rw3-ls">
          <RecruiterInboxList ctx={ctx} params={params} autoOpen />
        </div>
        <div className="t-msg-vide">
          <TalentIcon name="message" />
          <p>{tw("choose")}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * The title of the messaging on a computer and a tablet, with its rule (planche web recruteur-3
 * § 2, `.w-h`): on a phone the head of the frame names the tab.
 */
export async function MessagesHead() {
  const t = await getTranslations("rhInbox");
  const tw = await getTranslations("hireWeb3.messages");
  return (
    <div className="t-rw-h t-rw-web t-rw3-mh">
      <div className="t-t">
        <p aria-hidden className="t-rw-h1">
          {t("title")}
        </p>
      </div>
      <p className="t-rw3-pill">
        <TalentIcon name="confidentialite" size="xs" />
        {tw("rule")}
      </p>
    </div>
  );
}

/**
 * The list of the messaging: the search, the filters, Orbi's lines, the conversations and the
 * rule. Alone on a phone; the left column of the messaging on a computer or a tablet, with the
 * open conversation lit (`selected`).
 */
export async function RecruiterInboxList({
  ctx,
  params,
  selected,
  autoOpen = false,
}: {
  ctx: HireContext;
  params: Record<string, string | string[] | undefined>;
  selected?: string;
  /**
   * On a computer or a tablet the newest conversation opens beside the list (planche web
   * recruteur-3 § 2), unless the list was filtered or searched. Never on a phone.
   */
  autoOpen?: boolean;
}) {
  const t = await getTranslations("rhInbox");
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const filter: InboxFilter = (inboxFilters as readonly string[]).includes(one("filtre"))
    ? (one("filtre") as InboxFilter)
    : "toutes";
  const q = one("q").slice(0, 100);
  const now = new Date();
  const { rows, unread, waiting } = await listRecruiterInbox(db, ctx, { filter, q });
  const format = await getFormatter();
  const times = await Promise.all(rows.map((row) => shortTime(row.at, now)));
  const href = (value: InboxFilter) => {
    const next = new URLSearchParams();
    if (value !== "toutes") next.set("filtre", value);
    if (q) next.set("q", q);
    const query = next.toString();
    return query ? `/app/messages?${query}` : "/app/messages";
  };
  const names = waiting.slice(0, 2).map((row) => row.firstName);
  // Lot 6: Orbi proposes to remove the finished conversations of the non retained (planche NETT).
  const t6 = await getTranslations("rhInbox6");
  const cleanup = filter === "toutes" && !q ? await cleanupCandidates(db, ctx, now) : [];
  const cleaned = one("ok") === "nettoyage" ? Number(one("n")) || 0 : null;

  return (
    <>
      <form action="/app/messages" method="get" role="search" className="t-rech t-verre">
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

      {one("ok") === "retiree" && <ToastOnLoad message={t6("hidden")} />}
      {cleaned !== null && <ToastOnLoad message={t6("cleaned", { count: cleaned })} />}
      {cleanup.length > 0 && (
        <OrbiLine
          action={
            <SheetButton target="r6-nettoyage" className="t-bt t-sec t-s t-press">
              {t6("cleanup.see")}
            </SheetButton>
          }
        >
          {t6("cleanup.line", { count: cleanup.length })}
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
              <Link
                href={`/app/messages/${row.id}#dernier`}
                aria-current={row.id === selected ? "page" : undefined}
                className={cx("t-r5-cv t-press", row.id === selected && "t-on")}
              >
                <span className={cx("t-rc-av", avatarTone(index))} aria-hidden>
                  {initials(row.name)}
                </span>
                <span className="t-t">
                  <b>
                    {row.online && (
                      <span className="t-r6-dot" role="img" aria-label={t6("online")} />
                    )}
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
                  <span>
                    {row.pinned && (
                      <span className="t-r6-pin" role="img" aria-label={t6("pinned")}>
                        <TalentIcon name="favori" size="xs" />
                      </span>
                    )}
                    {times[index]}
                  </span>
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
      {autoOpen && filter === "toutes" && !q && rows[0] && !one("ok") && (
        <AutoSelect href={`/app/messages/${rows[0].id}#dernier`} from="web" />
      )}

      {cleanup.length > 0 && (
        <Sheet id="r6-nettoyage" title={t6("cleanup.title")} closeLabel={t6("close")}>
          <form action={cleanupConversationsAction} className="t-flux">
            <p className="t-r6-sous">{t6("cleanup.text")}</p>
            <ul className="t-verre t-r6-ret-l">
              {cleanup.map((item, index) => (
                <li key={item.id}>
                  <label className="t-r6-relu t-press">
                    <input type="checkbox" name="ids" value={item.id} defaultChecked />
                    <span className={cx("t-rc-av", avatarTone(index))} aria-hidden>
                      {initials(item.name)}
                    </span>
                    <span className="t-t">
                      <b>{item.name}</b>
                      <span>
                        {[item.job, format.dateTime(item.at, { day: "numeric", month: "short" })]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="t-gar">
              <TalentIcon name="confidentialite" size="s" />
              <span>{t6("cleanup.rule")}</span>
            </p>
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t6("cleanup.confirm")}
            </button>
          </form>
        </Sheet>
      )}
    </>
  );
}
