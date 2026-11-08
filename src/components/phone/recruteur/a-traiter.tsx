import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { PhoneIcon } from "@/components/phone/icon";
import { db } from "@/server/db";
import { hireToday } from "@/server/services/hire-today";
import type { HireContext } from "@/server/services/hire";
import { initialsOf } from "./compte-initials";

/**
 * « À traiter », beside the recruiter's Fil on a computer (Ephraïm, 08/11/2026: « une interface
 * approfondie avec d'autres outils »): what waits today, the new applications, the next interviews
 * and the week, read from the organization's offers only (`hireToday`). A phone keeps the Fil alone
 * (these come with the bell and the tabs).
 */
export async function RhTodayRail({ ctx }: { ctx: HireContext }) {
  const now = new Date();
  const [today, t, format] = await Promise.all([
    hireToday(db, ctx, now),
    getTranslations("hireToday"),
    getFormatter(),
  ]);
  const tiles = [
    { key: "unseen", count: today.counts.unseen, href: "/app/hire/offres" },
    { key: "invitations", count: today.counts.invitations, href: "/app/hire/entretiens" },
    { key: "scorecards", count: today.counts.scorecards, href: "/app/hire/entretiens" },
    { key: "unread", count: today.counts.unread, href: "/app/messages" },
  ] as const;
  return (
    <aside className="nb-rh-cote" aria-labelledby="rh-cote-t">
      <h2 id="rh-cote-t" className="nb-rh-cote-t">
        {t("title")}
      </h2>
      {today.empty ? (
        <div className="nb-rh-cote-carte">
          <b>{t("empty.title")}</b>
          <p>{t("empty.text")}</p>
        </div>
      ) : null}
      <ul className="nb-rh-cote-tuiles" aria-label={t("counts.aria")}>
        {tiles.map((tile) => (
          <li key={tile.key}>
            <Link href={tile.href} data-zero={tile.count === 0 ? "" : undefined}>
              <b>{tile.count}</b>
              <span>{t(`counts.${tile.key}`, { count: tile.count })}</span>
            </Link>
          </li>
        ))}
      </ul>

      {today.unseen.length > 0 ? (
        <section className="nb-rh-cote-carte" aria-labelledby="rh-cote-new">
          <div className="nb-rh-cote-h">
            <h3 id="rh-cote-new">{t("new.title")}</h3>
            <Link href="/app/hire/offres">{t("new.all")}</Link>
          </div>
          <ul className="nb-rh-cote-liste">
            {today.unseen.map((application) => (
              <li key={application.id}>
                <Link
                  href={`/app/hire/candidats/${application.id}`}
                  aria-label={t("new.examineAria", { name: application.profile.user.name })}
                >
                  <span className="nb-rh-cote-av" aria-hidden>
                    {initialsOf(application.profile.user.name)}
                  </span>
                  <span className="nb-rh-cote-x">
                    <b>{application.profile.user.name}</b>
                    <small>
                      {t("new.line", {
                        job: application.job.title,
                        when: format.relativeTime(application.createdAt, now),
                      })}
                    </small>
                  </span>
                  <PhoneIcon name="chevron" size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {today.upcoming.length > 0 ? (
        <section className="nb-rh-cote-carte" aria-labelledby="rh-cote-ent">
          <div className="nb-rh-cote-h">
            <h3 id="rh-cote-ent">{t("interviews.title")}</h3>
            <Link href="/app/hire/entretiens">{t("interviews.agenda")}</Link>
          </div>
          <ul className="nb-rh-cote-liste">
            {today.upcoming.map((interview) => (
              <li key={interview.id}>
                <Link href={`/app/hire/entretiens/${interview.id}`}>
                  <span className="nb-rh-cote-av" aria-hidden>
                    {initialsOf(interview.application.profile.user.name)}
                  </span>
                  <span className="nb-rh-cote-x">
                    <b>{interview.application.profile.user.name}</b>
                    <small>
                      {t("interviews.line", {
                        job: interview.application.job.title,
                        time: format.dateTime(interview.at!, {
                          weekday: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: interview.timezone || undefined,
                        }),
                        mode: t(`interviews.mode.${interview.mode}`),
                      })}
                    </small>
                    <small className="nb-rh-cote-etat" data-statut={interview.status}>
                      {t(`interviews.status.${interview.status as "confirmed"}`)}
                    </small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="nb-rh-cote-carte" aria-label={t("week.aria")}>
        <ul className="nb-rh-cote-semaine">
          {(["applications", "interviews", "decisions"] as const).map((key) => (
            <li key={key}>
              <b>{today.week[key]}</b>
              <span>{t(`week.${key}`, { count: today.week[key] })}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
