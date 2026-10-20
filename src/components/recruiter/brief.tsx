import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { OrbiMark } from "@/components/talent/orbi-mark";
import type { HireToday } from "@/server/services/hire-today";

/**
 * « Votre journée en bref » (planche r3plus `NOTIF_R`, v2.3): what waits today, counted from the
 * organization's offers (`hireToday`, filtered by organization). Written without the model, from
 * the figures only; Orbi sends and changes nothing.
 */
export async function RecruiterBrief({
  today,
  firstName,
}: {
  today: HireToday;
  firstName: string;
}) {
  const t = await getTranslations("rhNotifications.brief");
  const points = [
    {
      key: "applications" as const,
      count: today.counts.unseen,
      line: today.unseen[0]?.job.title ?? null,
      href: "/app/hire/candidats",
      tone: "t-r5-n1",
    },
    {
      key: "invitations" as const,
      count: today.counts.invitations,
      line: null,
      href: "/app/hire/entretiens",
      tone: "t-r5-n2",
    },
    {
      key: "scorecards" as const,
      count: today.counts.scorecards,
      line: null,
      href: "/app/hire/entretiens?vue=evaluer",
      tone: "t-r5-n3",
    },
    {
      key: "messages" as const,
      count: today.counts.unread,
      line: null,
      href: "/app/messages?filtre=non-lues",
      tone: "t-r5-n2",
    },
  ].filter((point) => point.count > 0);
  const name = firstName.split(/\s+/)[0] ?? "";

  return (
    <section className="t-r5-brief" aria-labelledby="r5-brief-t">
      <div className="t-r5-brief-h">
        <OrbiMark size={30} />
        <div className="t-t">
          <b id="r5-brief-t">{t("title")}</b>
          <span>{t("source")}</span>
        </div>
      </div>
      <p className="t-r5-brief-m">
        {points.length > 0 ? t("hello", { name, count: points.length }) : t("calm", { name })}
      </p>
      {points.length > 0 && (
        <ul>
          {points.map((point) => (
            <li key={point.key} className="t-r5-pt">
              <span className={`t-r5-n ${point.tone}`} aria-hidden>
                {point.count > 99 ? "99+" : point.count}
              </span>
              <span className="t-t">
                {t(`point.${point.key}`, { count: point.count })}
                {point.line && <small>{point.line}</small>}
              </span>
              <Link href={point.href} className="t-press">
                {t(`cta.${point.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
