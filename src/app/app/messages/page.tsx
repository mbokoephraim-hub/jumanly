import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { HireMessages } from "@/components/connect/hire-messages";
import { Logo, toneOf } from "@/components/talent/art";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { shortName } from "@/lib/short-name";
import { respondContactAction } from "@/server/actions/connect";
import { db } from "@/server/db";
import { connectViewer } from "@/server/hire-context";
import { talentInbox, type InboxRow } from "@/server/services/inbox";
import { talentContactRequests } from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inbox");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const DAY = 86_400_000;

/**
 * Messages (planche talent-2 § 5): the conversations with the recruiters, the newest first, a
 * request to be put in touch above them. A recruiting team keeps its own screen.
 */
export default async function MessagesPage({ searchParams }: PageProps<"/app/messages">) {
  const params = await searchParams;
  const { viewer } = await connectViewer("/app/messages");
  if (viewer.hire) return <HireMessages params={params} viewer={viewer} />;

  const t = await getTranslations();
  const format = await getFormatter();
  const now = new Date();
  const [rows, requests] = await Promise.all([
    talentInbox(db, viewer.userId),
    talentContactRequests(db, viewer.userId),
  ]);
  const pending = requests.filter((request) => request.status === "pending");
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const needle = q.trim().toLocaleLowerCase("fr");
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
    if (last.senderId === viewer.userId)
      return t("inbox.item.you", { message: last.body.slice(0, 120) });
    if (payload.document) return t("inbox.item.attachment");
    return last.body.slice(0, 120);
  };
  const answered = typeof params.reponse === "string" ? params.reponse : null;
  const answeredCompany =
    requests.find((request) => request.id === params.demande)?.organization.name ?? "";

  return (
    <div className="t-flux">
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

      <form action="/app/messages" method="get" role="search" className="t-rech t-verre">
        <TalentIcon name="recherche" size="s" />
        <input
          key={q}
          name="q"
          type="search"
          defaultValue={q}
          aria-label={t("inbox.search")}
          placeholder={t("inbox.search")}
          enterKeyHint="search"
          autoComplete="off"
        />
      </form>

      {pending.length > 0 && (
        <section aria-labelledby="in-demandes" className="t-flux t-serre">
          <h2 id="in-demandes" className="t-grp-t">
            {t("inbox.requests")} <b>{pending.length}</b>
          </h2>
          <div className="t-verre t-liste t-lignes">
            {pending.map((request) => (
              <SheetButton
                key={request.id}
                target={`in-dem-${request.id}`}
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
        <p className="t-vide-t">{t("inbox.noResult", { query: q })}</p>
      ) : (
        <ul className="t-verre t-liste t-lignes">
          {shown.map((row) => {
            const name = row.person ? `${shortName(row.person)} · ${row.company}` : row.company;
            return (
              <li key={row.id} className="t-li">
                <Logo
                  name={row.company}
                  src={row.logo}
                  tone={toneOf(row.company)}
                  className="t-lg-s"
                />
                <span className="t-t">
                  <Link href={`/app/messages/${row.id}#dernier`} className="t-lien">
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
        <span>{t("inbox.privacy")}</span>
      </p>

      {pending.map((request) => {
        const company = request.organization.name;
        return (
          <Sheet
            key={request.id}
            id={`in-dem-${request.id}`}
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
    </div>
  );
}
