import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Logo, toneOf } from "@/components/talent/art";
import { TalentIcon } from "@/components/talent/icon";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { shortName } from "@/lib/short-name";
import { respondContactAction } from "@/server/actions/connect";
import { db } from "@/server/db";
import { talentInbox, type InboxRow } from "@/server/services/inbox";
import { talentContactRequests } from "@/server/services/talent-search";

const DAY = 86_400_000;

/**
 * The conversations of a talent (planche talent-2 § 5; planche web talent-2 § 4, left column of
 * Messages): the search, the requests to be put in touch, the conversations newest first, and
 * « Orbi n'y a pas accès ». On a large screen the open conversation is lit (`selected`).
 */
export async function InboxList({
  userId,
  query,
  selected = null,
  prefix = "in",
}: {
  userId: string;
  /** Text searched (`?q=`). */
  query: string;
  selected?: string | null;
  /** Ids stay unique when two pages of Messages are in the document. */
  prefix?: string;
}) {
  const t = await getTranslations();
  const format = await getFormatter();
  const now = new Date();
  const [rows, requests] = await Promise.all([
    talentInbox(db, userId),
    talentContactRequests(db, userId),
  ]);
  const pending = requests.filter((request) => request.status === "pending");
  const needle = query.trim().toLocaleLowerCase("fr");
  const shown = needle
    ? rows.filter((row) =>
        [row.company, row.person, row.job].some((value) =>
          value?.toLocaleLowerCase("fr").includes(needle),
        ),
      )
    : rows;

  const when = (date: Date) => {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    if (date >= today) return format.dateTime(date, { hour: "2-digit", minute: "2-digit" });
    if (date.getTime() >= today.getTime() - DAY) return t("inbox.yesterday");
    if (date.getTime() >= today.getTime() - 6 * DAY)
      return format.dateTime(date, { weekday: "short" });
    return format.dateTime(date, { day: "numeric", month: "short" });
  };
  const preview = (row: InboxRow) => {
    const last = row.last;
    if (!last) return t("inbox.item.none");
    const payload = (last.payload ?? {}) as { document?: unknown };
    if (last.kind === "invitation") return t("inbox.item.invitation");
    if (last.kind === "document_request") return t("inbox.item.documentRequest");
    if (last.kind === "slot") return t("inbox.item.slot");
    if (last.kind === "decision") return t("inbox.item.decision");
    if (last.senderId === userId) return t("inbox.item.you", { message: last.body.slice(0, 120) });
    if (payload.document) return t("inbox.item.attachment");
    return last.body.slice(0, 120);
  };

  return (
    <>
      <form action="/app/messages" method="get" role="search" className="t-rech t-verre">
        <TalentIcon name="recherche" size="s" />
        <input
          key={query}
          name="q"
          type="search"
          defaultValue={query}
          aria-label={t("inbox.search")}
          placeholder={t("inbox.search")}
          enterKeyHint="search"
          autoComplete="off"
        />
      </form>

      {pending.length > 0 && (
        <section aria-labelledby={`${prefix}-demandes`} className="t-flux t-serre">
          <h2 id={`${prefix}-demandes`} className="t-grp-t">
            {t("inbox.requests")} <b>{pending.length}</b>
          </h2>
          <div className="t-verre t-liste t-lignes">
            {pending.map((request) => (
              <SheetButton
                key={request.id}
                target={`${prefix}-dem-${request.id}`}
                className="t-li t-nv t-press"
              >
                <Logo
                  name={request.organization.name}
                  tone={toneOf(request.organization.name)}
                  className="t-lg-s"
                />
                <span className="t-t">
                  <b>{t("connect.contactRequest.title", { company: request.organization.name })}</b>
                  <span>
                    {request.job
                      ? t("connect.contactRequest.job", { jobTitle: request.job.title })
                      : t("inbox.requestLine")}
                  </span>
                </span>
                <TalentIcon name="suivant" size="s" />
              </SheetButton>
            ))}
          </div>
        </section>
      )}

      {rows.length === 0 ? (
        <div className="t-verre t-carte t-vide">
          <b>{t("inbox.empty.title")}</b>
          <span>{t("inbox.empty.text")}</span>
          <Link href="/app/jobs" className="t-bt t-p t-s t-press">
            {t("inbox.empty.cta")}
          </Link>
        </div>
      ) : shown.length === 0 ? (
        <p className="t-vide-t">{t("inbox.noResult", { query })}</p>
      ) : (
        <ul className="t-verre t-liste t-lignes t-msg-lst">
          {shown.map((row) => {
            const name = row.person ? `${shortName(row.person)} · ${row.company}` : row.company;
            return (
              <li key={row.id} className={cx("t-li", row.id === selected && "t-on")}>
                <Logo
                  name={row.company}
                  src={row.logo}
                  tone={toneOf(row.company)}
                  className="t-lg-s"
                />
                <span className="t-t">
                  <Link
                    href={`/app/messages/${row.id}#dernier`}
                    className="t-lien"
                    aria-current={row.id === selected ? "page" : undefined}
                  >
                    <b>{name}</b>
                  </Link>
                  <span>{preview(row)}</span>
                </span>
                <span className="t-hm">
                  {row.last && <span className="t-v">{when(row.last.createdAt)}</span>}
                  {row.unread > 0 && (
                    <span className="t-nl">
                      {row.unread}
                      <span className="sr-only"> {t("inbox.unread", { count: row.unread })}</span>
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <p className="t-gar">
        <TalentIcon name="confidentialite" size="s" />
        <span className="t-mob">{t("inbox.privacy")}</span>
        <span className="t-w-seul">{t("inbox.web.privacy")}</span>
      </p>

      {pending.map((request) => {
        const company = request.organization.name;
        return (
          <Sheet
            key={request.id}
            id={`${prefix}-dem-${request.id}`}
            title={t("connect.contactRequest.title", { company })}
            closeLabel={t("offer.close")}
          >
            <div className="t-flux t-serre">
              <p>
                {t("connect.contactRequest.body", {
                  recruiterName: request.requester?.name ?? company,
                })}
              </p>
              <div className="t-verre t-carte">
                <b>{t("connect.contactRequest.message")}</b>
                <p className="t-texte-l">{request.message}</p>
              </div>
              {request.profile.visibility === "anonymous" && (
                <p className="t-vide-t">{t("connect.contactRequest.anonymousNote", { company })}</p>
              )}
              <p className="t-vide-t">
                {t("connect.contactRequest.expiresOn", { date: request.expiresAt })}
              </p>
              <form action={respondContactAction}>
                <input type="hidden" name="request" value={request.id} />
                <input type="hidden" name="answer" value="accept" />
                <button type="submit" className="t-bt t-p t-pl t-press">
                  {t("connect.contactRequest.accept")}
                </button>
              </form>
              <form action={respondContactAction}>
                <input type="hidden" name="request" value={request.id} />
                <input type="hidden" name="answer" value="decline" />
                <button type="submit" className="t-bt t-sec t-pl t-press">
                  {t("connect.contactRequest.decline")}
                </button>
              </form>
              <form action={respondContactAction}>
                <input type="hidden" name="request" value={request.id} />
                <input type="hidden" name="answer" value="block" />
                <button type="submit" className="t-sig t-press">
                  {t("connect.contactRequest.block", { company })}
                </button>
              </form>
            </div>
          </Sheet>
        );
      })}
    </>
  );
}

/** The newest conversation, opened beside the list on a large screen. */
export async function firstConversation(userId: string) {
  const rows = await talentInbox(db, userId);
  return rows[0]?.id ?? null;
}
