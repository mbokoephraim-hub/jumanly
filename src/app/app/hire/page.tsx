import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { AtsEntry } from "@/components/recruiter/ats";
import { OfferCard, OfferSheets, OrbiLine } from "@/components/recruiter/offers";
import { TalentAvatar } from "@/components/talent/avatar";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { limit } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { hirePermissions, isOrgVerified } from "@/server/services/hire";
import { activeCount, listOffers } from "@/server/services/hire-offers";
import { applicationsThisWeek, hireToday } from "@/server/services/hire-today";
import { atsToday } from "@/server/services/hire-ats";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireToday");
  return { title: t("seo"), robots: { index: false } };
}

const firstName = (name: string | null | undefined) => (name ?? "").trim().split(/\s+/)[0] ?? "";

/**
 * À traiter (brief recruteur § 3, planche recruteur-1 r1 and r1plus): Orbi's line, « Publier une
 * offre », what waits for an action (four tiles), the new applications, the next interviews and
 * the active offers. When nothing waits: « Rien à traiter », the figures of the week, Orbi and the
 * next steps. Real figures only; Orbi points, the recruiter decides.
 */
export default async function HireTodayPage() {
  const { user, space, ctx } = await requireHire("/app/hire");
  const t = await getTranslations("hireToday");
  const tw = await getTranslations("hireWeb.today");
  const format = await getFormatter();
  const now = new Date();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const permissions = hirePermissions(ctx.role);
  const [today, offers, max, verified, week] = await Promise.all([
    hireToday(db, ctx, now),
    listOffers(db, ctx, now),
    limit(db, subject, "jobs.active.max"),
    isOrgVerified(db, ctx.organizationId),
    applicationsThisWeek(db, ctx, now),
  ]);
  const org = space.organization.name;
  const active = offers.filter((offer) => offer.tab === "actives");
  const shown = active.slice(0, 2);
  const date = format.dateTime(now, { weekday: "long", day: "numeric", month: "long" });
  const name = user.firstName ?? firstName(user.name);
  const hello = name ? t("hello", { name, date }) : t("helloNoName", { date });
  // On a computer or a tablet (planche web recruteur-1 § 1): the greeting as the page's title, the
  // date and the organization under it, « Publier une offre » on the right.
  const publish = permissions.manage && (
    <Link href="/app/hire/offres/nouvelle" className="t-bt t-a t-m t-press">
      <TalentIcon name="plus" size="s" />
      {t("publish")}
    </Link>
  );
  const webHead = (
    <div className="t-rw-h t-web">
      <div className="t-t">
        <p className="t-rw-h1">{name ? tw("hello", { name }) : tw("helloNoName")}</p>
        <p>{tw("line", { date: date.charAt(0).toUpperCase() + date.slice(1), org })}</p>
      </div>
      {publish}
    </div>
  );
  const weekMax = Math.max(1, ...week.days.map((item) => item.count));
  const todayIndex = (now.getUTCDay() + 6) % 7;
  const weekChart = (
    <section aria-labelledby="rx-today-sem" className="t-verre t-rw-sem t-web">
      <div className="t-h">
        <h2 id="rx-today-sem">{tw("week.title")}</h2>
        <span>{tw("week.total", { count: week.total })}</span>
      </div>
      <div
        className="t-rx-sem"
        role="img"
        aria-label={tw("week.aria", {
          list: week.days
            .map((item) =>
              tw("week.day", {
                day: format.dateTime(item.day, { weekday: "long", timeZone: "UTC" }),
                count: item.count,
              }),
            )
            .join(", "),
        })}
      >
        {week.days.map((item, index) => (
          <div key={item.day.toISOString()} className={cx(index === todayIndex && "t-on")}>
            <i style={{ height: `${Math.round((item.count / weekMax) * 100)}%` }} />
            {format.dateTime(item.day, { weekday: "narrow", timeZone: "UTC" })}
          </div>
        ))}
      </div>
    </section>
  );
  const sheets = shown.map((offer) => (
    <OfferSheets
      key={offer.id}
      job={offer}
      back="/app/hire"
      manage={permissions.manage}
      readApplications={permissions.readApplications}
    />
  ));

  if (today.empty) {
    const nextSteps: {
      href: string;
      icon: TalentIconName;
      tone: string;
      title: string;
      text: string;
    }[] = [
      ...(permissions.manage
        ? [
            {
              href: "/app/hire/offres/nouvelle",
              icon: "offre" as const,
              tone: "t-c3",
              title: t("next.publish"),
              text:
                max < 0
                  ? t("next.publishUnlimited", { count: activeCount(offers) })
                  : t("next.publishText", { count: activeCount(offers), max }),
            },
          ]
        : []),
      {
        href: "/app/hire/candidats?vue=talents",
        icon: "recherche",
        tone: "t-c2",
        title: t("next.search"),
        text: t("next.searchText"),
      },
      ...(verified || !permissions.administer
        ? []
        : [
            {
              href: "/app/organisation/verification",
              icon: "entreprise" as const,
              tone: "t-c1",
              title: t("next.verify"),
              text: t("next.verifyText"),
            },
          ]),
    ];
    return (
      <div className="t-flux t-large t-rw-today">
        <h1 className="sr-only">{t("title")}</h1>
        <p className="t-rx-salut t-mob">{hello}</p>
        {webHead}
        <div className="t-rw-g">
          <div className="t-rw-c">
            <div className="t-verre t-rx-vide">
              <span className="t-rx-rond" aria-hidden>
                <TalentIcon name="valider" />
              </span>
              <b>{t("empty.title")}</b>
              <span>{t("empty.text")}</span>
            </div>
            <ul className="t-q3" aria-label={t("week.aria")}>
              {(
                [
                  ["applications", today.week.applications],
                  ["interviews", today.week.interviews],
                  ["decisions", today.week.decisions],
                ] as const
              ).map(([key, count]) => (
                <li key={key} className="t-verre">
                  <b>{count}</b>
                  {t(`week.${key}`, { count })}
                </li>
              ))}
            </ul>
          </div>
          <div className="t-rw-c">
            {active[0] ? (
              <OrbiLine
                action={
                  <Link href="/app/hire/candidats?vue=talents" className="t-bt t-sec t-s t-press">
                    {t("orbi.see")}
                  </Link>
                }
              >
                {t("empty.orbiJob", { job: active[0].title })}
              </OrbiLine>
            ) : (
              permissions.manage && (
                <OrbiLine
                  action={
                    <Link href="/app/hire/offres/nouvelle" className="t-bt t-sec t-s t-press">
                      {t("orbi.see")}
                    </Link>
                  }
                >
                  {t("empty.orbiNoJob")}
                </OrbiLine>
              )
            )}
            <h2 className="t-ck-t">{t("next.title")}</h2>
            <ul className="t-verre t-liste t-lignes">
              {nextSteps.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="t-li t-press">
                    <span className={cx("t-cases", item.tone)} aria-hidden>
                      <TalentIcon name={item.icon} size="s" />
                    </span>
                    <span className="t-t">
                      <b>{item.title}</b>
                      <span>{item.text}</span>
                    </span>
                    <TalentIcon name="suivant" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {shown.length > 0 && (
          <section aria-labelledby="rx-today-off0" className="t-flux t-serre">
            <div className="t-sec-t">
              <h2 id="rx-today-off0">{t("offers.title")}</h2>
              <Link href="/app/hire/offres">{t("offers.all")}</Link>
            </div>
            <div className="t-rw-grille t-rw-x">
              {shown.map((offer) => (
                <OfferCard
                  key={offer.id}
                  job={offer}
                  org={org}
                  now={now}
                  manage={permissions.manage}
                  readApplications={permissions.readApplications}
                  back="/app/hire"
                />
              ))}
            </div>
          </section>
        )}
        {sheets}
      </div>
    );
  }

  const first = today.unseen[0];
  const orbiParts = [
    today.counts.unseen > 0 ? t("orbi.unseen", { count: today.counts.unseen }) : null,
    today.nextConfirmed
      ? t("orbi.interview", {
          name: firstName(today.nextConfirmed.application.profile.user.name),
          day: format.dateTime(today.nextConfirmed.at!, {
            weekday: "long",
            timeZone: today.nextConfirmed.timezone || undefined,
          }),
        })
      : today.counts.invitations > 0
        ? t("orbi.invitations", { count: today.counts.invitations })
        : null,
  ].filter(Boolean);
  const orbiHref = first
    ? `/app/hire/candidats/${first.id}`
    : today.upcoming.length
      ? "/app/hire/entretiens"
      : null;
  // Lot 6: the offers whose applications Orbi has not read yet (planche 0 bis `ENT_AT`).
  const ta = await getTranslations("hireAts.entry");
  const ats = await atsToday(db, ctx, now);
  const atsFirst = ats.pending[0];
  const tiles = [
    { key: "unseen", count: today.counts.unseen, href: "/app/hire/candidats" },
    { key: "invitations", count: today.counts.invitations, href: "/app/hire/entretiens" },
    { key: "scorecards", count: today.counts.scorecards, href: "/app/hire/entretiens?vue=evaluer" },
    { key: "unread", count: today.counts.unread, href: "/app/messages" },
  ] as const;

  return (
    <div className="t-flux t-large t-rw-today">
      <h1 className="sr-only">{t("title")}</h1>
      <p className="t-rx-salut t-mob">{hello}</p>
      {webHead}
      {orbiParts.length > 0 && (
        <OrbiLine
          action={
            orbiHref && (
              <Link href={orbiHref} className="t-bt t-sec t-s t-press">
                {t("orbi.see")}
              </Link>
            )
          }
        >
          {t.rich("orbi.line", { text: orbiParts.join(" "), b: (chunks) => <b>{chunks}</b> })}
        </OrbiLine>
      )}
      {permissions.manage && (
        <Link href="/app/hire/offres/nouvelle" className="t-bt t-a t-rx-pub t-press t-mob">
          <TalentIcon name="plus" size="s" />
          {t("publish")}
        </Link>
      )}
      {atsFirst && (
        <AtsEntry
          title={ta("todayTitle", { count: atsFirst.pending })}
          text={ta("todayText", { title: atsFirst.title })}
          cta={ta("todayCta")}
          href={`/app/hire/offres/${atsFirst.id}/ats`}
          count={atsFirst.pending}
          chips={ats.pending.slice(1, 3).map((item) => item.title)}
        />
      )}
      <ul className="t-rx-ag" aria-label={t("counts.aria")}>
        {tiles.map((tile) => (
          <li key={tile.key}>
            <Link href={tile.href} className="contents">
              <b>{tile.count}</b>
              <span>{t(`counts.${tile.key}`, { count: tile.count })}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className={cx("t-rw-g", today.unseen.length === 0 && "t-un")}>
        {today.unseen.length > 0 && (
          <div className="t-rw-c">
            <section aria-labelledby="rx-today-new" className="t-flux t-serre">
              <div className="t-sec-t">
                <h2 id="rx-today-new">{t("new.title")}</h2>
                <Link href="/app/hire/candidats">{t("new.all")}</Link>
              </div>
              {today.unseen.map((application) => {
                const person = application.profile.user;
                return (
                  <div key={application.id} className="t-verre t-rx-cand">
                    <TalentAvatar name={person.name} image={person.image} />
                    <div className="t-t">
                      <b>
                        <span>{person.name}</span>
                        <span className="t-rx-nv">{t("new.badge")}</span>
                      </b>
                      <span className="t-l">
                        {t("new.line", {
                          job: application.job.title,
                          when: format.relativeTime(application.createdAt, now),
                        })}
                      </span>
                      <span className="t-rx-etq">{application.stage.name}</span>
                    </div>
                    <Link
                      href={`/app/hire/candidats/${application.id}`}
                      className="t-bt t-p t-s t-press"
                      aria-label={t("new.examineAria", { name: person.name })}
                    >
                      {t("new.examine")}
                    </Link>
                  </div>
                );
              })}
            </section>
          </div>
        )}

        <div className="t-rw-c">
          {today.upcoming.length > 0 && (
            <section aria-labelledby="rx-today-int" className="t-flux t-serre">
              <div className="t-sec-t">
                <h2 id="rx-today-int">{t("interviews.title")}</h2>
                <Link href="/app/hire/entretiens">{t("interviews.agenda")}</Link>
              </div>
              {today.upcoming.map((interview) => {
                const at = interview.at!;
                const timeZone = interview.timezone || undefined;
                const status =
                  interview.status === "confirmed"
                    ? "confirmed"
                    : interview.status === "reschedule"
                      ? "reschedule"
                      : "pending";
                const person = interview.application.profile.user.name;
                return (
                  <Link
                    key={interview.id}
                    href={`/app/hire/entretiens/${interview.id}`}
                    className="t-verre t-rx-ent t-press"
                    aria-label={t("interviews.open", {
                      name: person,
                      date: format.dateTime(at, {
                        dateStyle: "long",
                        timeStyle: "short",
                        timeZone,
                      }),
                    })}
                  >
                    <span className="t-rx-jr" aria-hidden>
                      {format.dateTime(at, { month: "short", timeZone }).replace(".", "")}
                      <b>{format.dateTime(at, { day: "numeric", timeZone })}</b>
                    </span>
                    <span className="t-t">
                      <b>{person}</b>
                      <span>
                        {t("interviews.line", {
                          job: interview.application.job.title,
                          time: format.dateTime(at, {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone,
                          }),
                          mode: t(`interviews.mode.${interview.mode}` as "interviews.mode.video"),
                        })}
                      </span>
                      <span className={status === "confirmed" ? "t-rx-ok" : "t-rx-att"}>
                        {t(`interviews.status.${status}`)}
                      </span>
                    </span>
                    <TalentIcon name="suivant" size="s" />
                  </Link>
                );
              })}
            </section>
          )}
          {weekChart}
        </div>
      </div>

      {shown.length > 0 && (
        <section aria-labelledby="rx-today-off" className="t-flux t-serre">
          <div className="t-sec-t">
            <h2 id="rx-today-off">{t("offers.title")}</h2>
            <Link href="/app/hire/offres">{t("offers.all")}</Link>
          </div>
          <div className="t-rw-grille t-rw-x">
            {shown.map((offer) => (
              <OfferCard
                key={offer.id}
                job={offer}
                org={org}
                now={now}
                manage={permissions.manage}
                readApplications={permissions.readApplications}
                back="/app/hire"
              />
            ))}
          </div>
        </section>
      )}
      {sheets}
    </div>
  );
}
