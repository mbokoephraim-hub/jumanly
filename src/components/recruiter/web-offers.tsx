import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { PhoneIcon } from "@/components/phone/icon";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { limit, resolvePlan } from "@/server/entitlements";
import type { HireContext } from "@/server/services/hire";
import { contractFilterOf } from "@/server/services/jobs";
import { webOffers } from "@/server/services/hire-web-offers";
import { RecruiterAside } from "./web-aside";

/** The colour of a status in the table (lime for what is live, amber for what waits). */
export const STATUS_TONE: Record<string, string> = {
  published: "rb-lime-t",
  paused: "rb-ambre-t",
  pending_review: "rb-ambre-t",
  changes_requested: "rb-ambre-t",
  draft: "rb-brume-t",
  closed: "rb-brume-t",
  rejected: "rb-brume-t",
  archived: "rb-brume-t",
};

/** Live offers first, then the drafts and what waits, the closed ones last. */
const ORDER = [
  "published",
  "pending_review",
  "changes_requested",
  "paused",
  "draft",
  "rejected",
  "closed",
];

/**
 * « Offres » of the recruiter on a computer (Modèle B, lot N2, captures 034 and 090): four
 * figures of the last thirty days, then « Vos offres » as a table (applications, new this week,
 * views, status, publication); each row opens the offer. Orbi on the right.
 */
export async function RecruiterWebOffers({
  ctx,
  now = new Date(),
}: {
  ctx: HireContext;
  now?: Date;
}) {
  const t = await getTranslations("rhWeb.offers");
  const ts = await getTranslations("rhWeb.home.offers.status");
  const tc = await getTranslations("jobs.search.contract");
  const format = await getFormatter();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [data, max, plan] = await Promise.all([
    webOffers(db, ctx, now),
    limit(db, subject, "jobs.active.max"),
    resolvePlan(db, subject, now),
  ]);
  const { figures } = data;
  const offers = [...data.offers].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const active = data.offers.filter((offer) => offer.status === "published").length;
  const count =
    max < 0 ? t("activeUnlimited", { count: active }) : t("active", { count: active, max });
  const line = plan?.planName ? t("plan", { line: count, plan: plan.planName }) : count;
  const percent = (value: number | null) =>
    value === null ? t("none") : format.number(value, { style: "percent" });

  // Orbi: the live offer with the fewest applications, as a question (never a verdict).
  const live = offers.filter((offer) => offer.status === "published");
  const quiet = [...live].sort((a, b) => a.figures.applications - b.figures.applications)[0];
  const question = quiet ? t("orbi.question", { title: quiet.title }) : t("orbi.questionNone");
  const fact = quiet
    ? t("orbi.fact", {
        title: quiet.title,
        applications: quiet.figures.applications,
        views: quiet.figures.views,
        week: quiet.week,
      })
    : t("orbi.factNone");

  const tiles = [
    { value: String(figures.applications), label: t("tiles.applications") },
    { value: String(figures.week), label: t("tiles.week", { count: figures.week }) },
    {
      value:
        figures.responseDays === null
          ? t("none")
          : t("tiles.daysValue", { days: format.number(figures.responseDays) }),
      label: t("tiles.delay"),
    },
    { value: percent(figures.answeredShare), label: t("tiles.answered") },
  ];

  return (
    <div className="rb-page rb-cols">
      <div className="rb-col">
        <h1 className="sr-only">{t("title")}</h1>
        <div className="rb-g4" role="list" aria-label={t("tiles.aria")}>
          {tiles.map((tile) => (
            <div key={tile.label} className="rb-tuile" role="listitem">
              <b>{tile.value}</b>
              {tile.label}
            </div>
          ))}
        </div>

        <div className="rb-sec-h">
          <h2>{t("yours")}</h2>
          <p className="rb-meta">{line}</p>
        </div>
        {offers.length === 0 ? (
          <div className="rb-carte">
            <p className="rb-vide">{t("empty")}</p>
            <Link href="/app/hire/offres/nouvelle" className="rb-btn t-press">
              <PhoneIcon name="plus" size={18} stroke={2.4} />
              {t("create")}
            </Link>
          </div>
        ) : (
          <table className="rb-table">
            <caption className="sr-only">{t("yours")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("col.offer")}</th>
                <th scope="col">{t("col.applications")}</th>
                <th scope="col">{t("col.week")}</th>
                <th scope="col">{t("col.views")}</th>
                <th scope="col">{t("col.status")}</th>
                <th scope="col">{t("col.published")}</th>
                <th scope="col">
                  <span className="sr-only">{t("col.open")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => {
                const href = `/app/hire/offres/${offer.id}`;
                return (
                  <tr key={offer.id}>
                    <th scope="row">
                      <Link href={href} className="rb-tl">
                        <b>{offer.title}</b>
                        <span className="rb-meta">
                          {[offer.city, tc(contractFilterOf(offer.contractType))]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </Link>
                    </th>
                    <td>{offer.figures.applications}</td>
                    <td className={cx(offer.week > 0 && "rb-lime-t rb-fort")}>
                      {offer.week > 0 ? t("plus", { count: offer.week }) : t("none")}
                    </td>
                    <td>{offer.figures.views}</td>
                    <td className={cx("rb-fort", STATUS_TONE[offer.status])}>{ts(offer.status)}</td>
                    <td className="rb-meta">
                      {offer.publishedAt
                        ? format.dateTime(offer.publishedAt, { day: "numeric", month: "short" })
                        : t("none")}
                    </td>
                    <td>
                      <Link
                        href={href}
                        className="rb-chev"
                        aria-label={t("openAria", { title: offer.title })}
                      >
                        <PhoneIcon name="chevron" size={18} stroke={1.8} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <RecruiterAside question={question} fact={fact} />
    </div>
  );
}
