import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Avatar } from "@/components/entreprise/team";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { consultationJournal } from "@/server/services/org-journal";

const PAGE = "/app/organisation/journal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orgJournal");
  return { title: t("title"), robots: { index: false } };
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/**
 * Journal des consultations (étape 3, A5, capture 084), for the owner and the administrators only:
 * a recruiter, a manager or a viewer gets « page introuvable ». The members are links
 * (`?membre=`), so the page needs no script. Under 768 px the layout of `/app/organisation` shows
 * « À ouvrir sur un ordinateur ».
 */
export default async function JournalPage({
  searchParams,
}: PageProps<"/app/organisation/journal">) {
  const query = await searchParams;
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgJournal");
  const format = await getFormatter();
  const now = new Date();
  const wanted = typeof query.membre === "string" ? query.membre.slice(0, 60) : null;
  const { member, members, rows } = await consultationJournal(db, ctx, wanted, now);

  const dayKey = (date: Date) =>
    format.dateTime(date, { year: "numeric", month: "2-digit", day: "2-digit" });
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  const when = (date: Date) => {
    const time = format
      .dateTime(date, { hour: "2-digit", minute: "2-digit" })
      .replace(/^0/, "")
      .replace(":", " h ");
    const key = dayKey(date);
    if (key === today) return t("today", { time });
    if (key === yesterday) return t("yesterday", { time });
    const day = format.dateTime(date, { weekday: "short", day: "numeric", month: "short" });
    return t("other", { date: day.charAt(0).toLocaleUpperCase("fr") + day.slice(1), time });
  };
  const chosen = members.find((item) => item.userId === member);

  return (
    <div className="ae-app ae-page">
      <h1 className="ae-h1">{t("title")}</h1>
      <p className="ae-meta ae-jr-intro">{t("intro")}</p>
      <nav aria-label={t("filters")}>
        <ul className="ae-pills ae-pills-wrap ae-jr-filtres">
          <li>
            <Link
              href={PAGE}
              scroll={false}
              className={cx("ae-pill", !member && "ae-pill-on")}
              aria-current={!member ? "page" : undefined}
            >
              {t("all")}
            </Link>
          </li>
          {members.map((item) => (
            <li key={item.userId}>
              <Link
                href={`${PAGE}?membre=${item.userId}`}
                scroll={false}
                className={cx("ae-pill", member === item.userId && "ae-pill-on")}
                aria-current={member === item.userId ? "page" : undefined}
              >
                {firstName(item.name)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {rows.length === 0 ? (
        <p className="ae-carte ae-meta ae-jr-vide">
          {chosen ? t("emptyMember", { name: firstName(chosen.name) }) : t("empty")}
        </p>
      ) : (
        <table className="ae-jr-table">
          <thead>
            <tr>
              <th scope="col">{t("col.date")}</th>
              <th scope="col">{t("col.member")}</th>
              <th scope="col">{t("col.action")}</th>
              <th scope="col">{t("col.person")}</th>
              <th scope="col">{t("col.object")}</th>
              <th scope="col">
                <span className="sr-only">{t("col.open")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const actor = row.actorName ? firstName(row.actorName) : t("formerMember");
              const action = t(`kind.${row.kind}`);
              const person = row.person ?? (row.anonymous ? t("anonymous") : t("noPerson"));
              const object =
                row.object?.kind === "job"
                  ? row.object.title
                  : row.object?.kind === "report"
                    ? t("object.report")
                    : row.object?.kind === "search"
                      ? t("object.search")
                      : "";
              return (
                <tr key={row.id}>
                  <td className="ae-meta">{when(row.at)}</td>
                  <td>
                    <span className="ae-ligne ae-ligne-s">
                      <Avatar name={row.actorName || actor} small />
                      {actor}
                    </span>
                  </td>
                  <td>{action}</td>
                  <th scope="row">{person}</th>
                  <td className="ae-meta">{object}</td>
                  <td>
                    {row.href && (
                      <Link
                        href={row.href}
                        className="ae-fb-pdf"
                        aria-label={t("open", { action, person })}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="ae-meta ae-jr-note">{t("note")}</p>
    </div>
  );
}
