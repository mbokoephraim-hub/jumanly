import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { avatarTone, initialsOf } from "@/components/recruiter/candidates";
import { OrbiLine } from "@/components/recruiter/offers";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { defaultTimeZone } from "@/lib/dates";
import {
  addDays,
  clock,
  dayLabels,
  mondayOf,
  monthGrid,
  monthLabels,
  monthOf,
  nextMonth,
  zoned,
} from "@/lib/interview-calendar";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import { interviewsToEvaluate, invitableApplications } from "@/server/services/hire-interviews";
import { listInterviews } from "@/server/services/interviews";
import { cheapestPlanWhere, listPublicPlans } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireInterviews");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
const dayKey = /^\d{4}-\d{2}-\d{2}$/;
const monthKey = /^\d{4}-\d{2}$/;

/** The colour of a card's edge and its tag (planche AGENDA). */
const look = {
  confirmed: "t-ok",
  pending: "t-at",
  reschedule: "t-au",
  done: "t-fi",
  no_show: "t-fi",
  canceled: "t-an",
  declined: "t-an",
} as const;

/**
 * Entretiens (brief recruteur § 4 item 4, planche r2plus AGENDA): the week with its days and
 * hours, the month, and « À évaluer ». The interviews waiting for the candidate's answer come
 * first; Orbi offers to prepare the next one. « + » proposes an interview to a candidate.
 */
export default async function InterviewsPage({ searchParams }: PageProps<"/app/hire/entretiens">) {
  const query = await searchParams;
  // Old addresses: the planner of a candidate now lives in their file.
  const candidature = one(query.candidature);
  if (candidature && candidature !== "nouveau")
    redirect(`/app/hire/candidats/${encodeURIComponent(candidature)}/entretien`);
  const { ctx } = await requireHire("/app/hire/entretiens", "readApplications");
  const t = await getTranslations("hireInterviews");
  const tw = await getTranslations("hireWeb.agenda");
  const format = await getFormatter();
  const now = new Date();
  const timeZone = defaultTimeZone();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [enabled, collaboration] = await Promise.all([
    can(db, subject, "connect.appointments"),
    can(db, subject, "hire.collaboration"),
  ]);
  const head = <FlowHead back="/app/hire" backLabel={t("agenda.back")} title={t("agenda.title")} />;
  if (!enabled) {
    const plan = cheapestPlanWhere(
      await listPublicPlans(db),
      ["rh", "company"],
      (item) => item.entitlements["connect.appointments"] === "true",
    );
    return (
      <div className="t-flux">
        {head}
        <div className="t-rc-orbi">
          <div className="t-rc-lock">
            <b>
              <OrbiMark size={22} />
              {t("plan.lockedTitle")}
            </b>
            <span>{plan ? t("plan.locked", { plan: plan.name }) : t("plan.lockedNoPlan")}</span>
            <Link href="/app/abonnement/formules" className="t-bt t-sec t-s t-press">
              {t("plan.seePlans")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const manage = hirePermissions(ctx.role).manage;
  const view = (["mois", "evaluer"] as const).find((item) => item === query.vue) ?? "semaine";
  const team = collaboration && one(query.filtre) === "equipe";
  const today = zoned(now, timeZone).key;
  const askedDay = dayKey.test(one(query.semaine)) ? one(query.semaine) : today;
  const monday = mondayOf(askedDay);
  const month = monthKey.test(one(query.mois)) ? one(query.mois) : monthOf(today);
  const grid = monthGrid(month);
  const from = view === "mois" ? grid[0]![0]! : monday;
  const [interviews, toEvaluate, invitable] = await Promise.all([
    listInterviews(db, ctx, {
      filter: team ? "team" : "mine",
      from: new Date(`${addDays(from, -1)}T00:00:00Z`),
    }),
    interviewsToEvaluate(db, ctx, now),
    manage ? invitableApplications(db, ctx) : Promise.resolve([]),
  ]);
  const at = (date: Date) => zoned(date, timeZone);
  const placed = interviews.filter(
    (item) =>
      item.startsAt &&
      ["confirmed", "done", "no_show"].includes(item.status) &&
      (view !== "semaine" ||
        (at(item.startsAt).key >= monday && at(item.startsAt).key <= addDays(monday, 6))),
  );
  const waiting = interviews.filter(
    (item) => item.status === "pending" || item.status === "reschedule",
  );
  const byDay = new Map<string, typeof placed>();
  for (const item of placed) {
    const key = at(item.startsAt!).key;
    byDay.set(key, [...(byDay.get(key) ?? []), item]);
  }
  const labels = dayLabels(from, view === "mois" ? grid.length * 7 : 7);
  const nextOwn = interviews.find(
    (item) =>
      item.status === "confirmed" &&
      item.startsAt &&
      item.startsAt > now &&
      (item.organizerId === ctx.userId || item.participantIds.includes(ctx.userId)),
  );
  const selected =
    view === "mois" && dayKey.test(one(query.jour)) && monthOf(one(query.jour)) === month
      ? one(query.jour)
      : view === "mois" && monthOf(today) === month
        ? today
        : null;

  const href = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams();
    const state: Record<string, string | null> = {
      vue: view === "semaine" ? null : view,
      filtre: team ? "equipe" : null,
      semaine: view === "semaine" && monday !== mondayOf(today) ? monday : null,
      mois: view === "mois" && month !== monthOf(today) ? month : null,
      ...changes,
    };
    for (const [key, value] of Object.entries(state)) if (value) next.set(key, value);
    const search = next.toString();
    return search ? `/app/hire/entretiens?${search}` : "/app/hire/entretiens";
  };
  const when = (date: Date) =>
    format.dateTime(date, { weekday: "short", day: "numeric", month: "short", timeZone });
  const time = (date: Date) =>
    format.dateTime(date, { hour: "2-digit", minute: "2-digit", timeZone });
  const tag = (status: keyof typeof look) =>
    t(`agenda.status.${status === "no_show" ? "noShow" : status}`);

  const card = (item: (typeof interviews)[number], showTime: boolean) => {
    const name = item.application.profile.user.name;
    return (
      <li key={item.id} className="t-ri-ag">
        {showTime && item.startsAt && (
          <span className="t-ri-heure" aria-hidden>
            {clock(at(item.startsAt).minutes)}
          </span>
        )}
        <Link
          href={`/app/hire/entretiens/${item.id}`}
          className={cx("t-verre t-ri-ent t-press", look[item.status])}
        >
          <span className={cx("t-rc-av", avatarTone(item.application.id))} aria-hidden>
            {initialsOf(name)}
          </span>
          <span className="t-t">
            <b>
              <span className="t-rc-nom">{name}</span>
              <span className={cx("t-ri-etq", look[item.status])}>{tag(item.status)}</span>
            </b>
            <span>{item.application.job.title}</span>
            <span className="t-m">
              {[
                item.startsAt && !showTime
                  ? `${when(item.startsAt)} · ${time(item.startsAt)}`
                  : null,
                t(`plan.mode.${item.mode}`),
                t("plan.duration", { minutes: item.durationMinutes }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
        </Link>
      </li>
    );
  };

  // ─── Web (lot 2): the week in hours, with the requests and the evaluations beside it ──
  const weekKeys = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const inWeek = (date: Date) => {
    const key = at(date).key;
    return key >= monday && key <= addDays(monday, 6);
  };
  const timed = [
    ...placed.map((item) => ({ item, start: item.startsAt! })),
    ...waiting.flatMap((item) => {
      const start = (item.status === "reschedule" ? item.proposedSlots : item.slots).find(inWeek);
      return start ? [{ item, start }] : [];
    }),
  ];
  const evaluated = new Set(toEvaluate.map((item) => item.id));
  const firstHour = Math.min(9, ...timed.map(({ start }) => Math.floor(at(start).minutes / 60)));
  const lastHour = Math.max(
    18,
    ...timed.map(({ item, start }) =>
      Math.min(24, Math.ceil((at(start).minutes + item.durationMinutes) / 60)),
    ),
  );
  const hours = Array.from({ length: lastHour - firstHour }, (_, index) => firstHour + index);
  const HOUR_PX = 56;
  const weekGrid = (
    <section aria-label={t("agenda.weekDays")} className="t-verre t-rw-agw t-rw-web">
      <div className="t-rw-agh" aria-hidden>
        <span />
        {weekKeys.map((key, index) => (
          <span key={key} className={cx(key === today && "t-auj", index > 4 && "t-we")}>
            <small>{labels[key]?.letter}</small>
            <b>{labels[key]?.day}</b>
          </span>
        ))}
      </div>
      <div className="t-rw-agb" style={{ height: hours.length * HOUR_PX }}>
        <ol className="t-rw-agt" aria-hidden>
          {hours.map((hour) => (
            <li key={hour}>{clock(hour * 60)}</li>
          ))}
        </ol>
        {weekKeys.map((key, index) => {
          const items = timed.filter(({ start }) => at(start).key === key);
          return (
            <div key={key} className={cx("t-rw-agj", index > 4 && "t-we")}>
              <h3 className="sr-only">
                {t("agenda.dayCount", { day: labels[key]?.long ?? key, count: items.length })}
              </h3>
              {items.length > 0 && (
                <ul>
                  {items.map(({ item, start }) => {
                    const name = item.application.profile.user.name;
                    const minutes = at(start).minutes - firstHour * 60;
                    const status =
                      item.status === "done" && evaluated.has(item.id)
                        ? tw("toEvaluate")
                        : tag(item.status);
                    return (
                      <li
                        key={item.id}
                        style={{
                          top: (minutes / 60) * HOUR_PX,
                          height: Math.max(40, (item.durationMinutes / 60) * HOUR_PX - 4),
                        }}
                      >
                        <Link
                          href={`/app/hire/entretiens/${item.id}`}
                          aria-label={tw("eventAria", {
                            name,
                            when: `${labels[key]?.long ?? key} · ${time(start)}`,
                            status,
                          })}
                          className={cx("t-rw-ev t-press", look[item.status])}
                        >
                          <b>{name}</b>
                          <span>
                            {item.status === "confirmed"
                              ? `${time(start)} · ${t(`plan.mode.${item.mode}`)}`
                              : status}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
  const waitingSection = view !== "evaluer" && waiting.length > 0 && (
    <section aria-labelledby="ri-attente" className="t-ri-groupe">
      <h2 id="ri-attente">{t("agenda.waiting", { count: waiting.length })}</h2>
      <ul>
        {waiting.map((item) => {
          const name = item.application.profile.user.name;
          const slots = item.status === "reschedule" ? item.proposedSlots : item.slots;
          return (
            <li key={item.id} className="t-ri-ag">
              <Link
                href={`/app/hire/entretiens/${item.id}`}
                className={cx("t-verre t-ri-ent t-press", look[item.status])}
              >
                <span className={cx("t-rc-av", avatarTone(item.application.id))} aria-hidden>
                  {initialsOf(name)}
                </span>
                <span className="t-t">
                  <b>
                    <span className="t-rc-nom">{name}</span>
                    <span className={cx("t-ri-etq", look[item.status])}>{tag(item.status)}</span>
                  </b>
                  <span>{item.application.job.title}</span>
                  <span className="t-m">
                    {item.status === "reschedule"
                      ? t("agenda.proposedBack", { count: slots.length })
                      : t("agenda.slotsSent", { count: slots.length })}
                    {slots[0] ? ` · ${when(slots[0])}` : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
  const orbiLine = view !== "evaluer" && nextOwn && (
    <OrbiLine
      action={
        <Link href={`/app/hire/entretiens/${nextOwn.id}`} className="t-bt t-sec t-s t-press">
          {t("agenda.open")}
        </Link>
      }
    >
      {t.rich("agenda.orbi", {
        b: (chunks) => <b>{chunks}</b>,
        name: nextOwn.application.profile.user.name,
        when: `${when(nextOwn.startsAt!)} · ${time(nextOwn.startsAt!)}`,
      })}
    </OrbiLine>
  );

  return (
    <div className="t-flux t-ri-agenda t-rw-agp">
      <FlowHead
        back="/app/hire"
        backLabel={t("agenda.back")}
        title={t("agenda.title")}
        end={
          manage ? (
            <SheetButton target="ri-nouveau" label={t("agenda.new")} className="t-bi t-press">
              <TalentIcon name="plus" size="s" />
            </SheetButton>
          ) : undefined
        }
      />

      <div className="t-rw-h">
        <div className="t-t t-rw-web">
          <h1>{t("agenda.title")}</h1>
          <p>
            {view === "semaine"
              ? t("agenda.weekOf", {
                  from: labels[monday]?.short ?? monday,
                  to: labels[addDays(monday, 6)]?.short ?? "",
                })
              : view === "mois"
                ? monthLabels(`${month}-01`, 1)[0]!.label
                : t("agenda.evaluate", { count: toEvaluate.length })}
          </p>
        </div>
        <nav className="t-seg" aria-label={t("agenda.views")}>
          <Link
            href={href({ vue: null, mois: null })}
            aria-current={view === "semaine" ? "page" : undefined}
            className="t-press"
          >
            {t("agenda.week")}
          </Link>
          <Link
            href={href({ vue: "mois", semaine: null })}
            aria-current={view === "mois" ? "page" : undefined}
            className="t-press"
          >
            {t("agenda.month")}
          </Link>
          <Link
            href={href({ vue: "evaluer", semaine: null, mois: null })}
            aria-current={view === "evaluer" ? "page" : undefined}
            className="t-press"
          >
            {t("agenda.evaluate", { count: toEvaluate.length })}
          </Link>
        </nav>
      </div>

      <div className="t-rw-tlb">
        {collaboration && view !== "evaluer" && (
          <nav className="t-rx-onglets" aria-label={t("agenda.whose")}>
            <Link
              href={href({ filtre: null })}
              aria-current={team ? undefined : "page"}
              className="t-puce t-press"
            >
              {t("agenda.mine")}
            </Link>
            <Link
              href={href({ filtre: "equipe" })}
              aria-current={team ? "page" : undefined}
              className="t-puce t-press"
            >
              {t("agenda.team")}
            </Link>
          </nav>
        )}

        {orbiLine && <div className="t-rw-m">{orbiLine}</div>}

        {view === "semaine" && (
          <>
            <div className="t-ri-semh">
              <Link
                href={href({ semaine: addDays(monday, -7) })}
                aria-label={t("agenda.previousWeek")}
                className="t-bi t-press t-ri-prec"
              >
                <TalentIcon name="suivant" size="xs" />
              </Link>
              <b>
                {t("agenda.weekOf", {
                  from: labels[monday]?.short ?? monday,
                  to: labels[addDays(monday, 6)]?.short ?? "",
                })}
              </b>
              <Link
                href={href({ semaine: addDays(monday, 7) })}
                aria-label={t("agenda.nextWeek")}
                className="t-bi t-press"
              >
                <TalentIcon name="suivant" size="xs" />
              </Link>
            </div>
          </>
        )}
        {manage && (
          <SheetButton target="ri-nouveau" className="t-bt t-p t-s t-press t-rw-web">
            <TalentIcon name="plus" size="xs" />
            {t("agenda.new")}
          </SheetButton>
        )}
      </div>

      {view === "semaine" && (
        <>
          <ol className="t-ri-sem t-rw-tel" aria-label={t("agenda.weekDays")}>
            {Array.from({ length: 7 }, (_, index) => addDays(monday, index)).map((key) => {
              const count = byDay.get(key)?.length ?? 0;
              return (
                <li key={key} className={cx(key === today && "t-auj", count > 0 && "t-pl")}>
                  <span aria-hidden>{labels[key]?.letter}</span>
                  <b aria-hidden>{labels[key]?.day}</b>
                  <span className="sr-only">
                    {t("agenda.dayCount", { day: labels[key]?.long ?? key, count })}
                  </span>
                  {count > 0 && <i aria-hidden />}
                </li>
              );
            })}
          </ol>
        </>
      )}

      {view !== "semaine" && waitingSection}

      {view === "semaine" && (
        <div className="t-rw-g t-rw-agg">
          {/* Beside the week (first in the page on a phone): requests, evaluations, Orbi. */}
          <div className="t-rw-c t-rw-aga">
            {waitingSection}
            {toEvaluate.length > 0 && (
              <section aria-labelledby="rw-a-evaluer" className="t-ri-groupe t-rw-web">
                <h2 id="rw-a-evaluer">{tw("toEvaluate")}</h2>
                <ul className="t-verre t-rw-aev">
                  {toEvaluate.slice(0, 4).map((item) => {
                    const name = item.application.profile.user.name;
                    return (
                      <li key={item.id}>
                        <span
                          className={cx("t-rc-av", avatarTone(item.application.id))}
                          aria-hidden
                        >
                          {initialsOf(name)}
                        </span>
                        <span className="t-t">
                          <b className="t-rc-nom">{name}</b>
                          <span>
                            {item.startsAt
                              ? `${when(item.startsAt)} · ${time(item.startsAt)}`
                              : item.application.job.title}
                          </span>
                        </span>
                        <Link
                          href={`/app/hire/candidats/${item.application.id}/evaluation`}
                          className="t-bt t-p t-s t-press"
                          aria-label={t("agenda.evaluateAria", { name })}
                        >
                          {t("agenda.evaluateCta")}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {toEvaluate.length > 4 && (
                  <Link href={href({ vue: "evaluer", semaine: null })} className="t-pq t-press">
                    {tw("seeAll")}
                  </Link>
                )}
              </section>
            )}
            {orbiLine && <div className="t-rw-w">{orbiLine}</div>}
          </div>
          <div className="t-rw-c t-rw-agl">
            {weekGrid}
            {byDay.size === 0 ? (
              <div className="t-verre t-rc-vide t-rw-tel">
                <span className="t-rc-rond" aria-hidden>
                  <TalentIcon name="agenda" />
                </span>
                <b>{t("agenda.emptyWeek")}</b>
                <span>{manage ? t("agenda.emptyText") : t("agenda.emptyTextReader")}</span>
              </div>
            ) : (
              [...byDay.entries()]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, items]) => (
                  <section
                    key={key}
                    aria-labelledby={`ri-j-${key}`}
                    className="t-ri-groupe t-rw-tel"
                  >
                    <h2 id={`ri-j-${key}`}>
                      {key === today
                        ? t("agenda.today", { day: labels[key]?.long ?? key })
                        : labels[key]?.long}
                    </h2>
                    <ul>{items.map((item) => card(item, true))}</ul>
                  </section>
                ))
            )}
          </div>
        </div>
      )}

      {view === "mois" && (
        <div className="t-rw-g t-rw-agm">
          <div className="t-verre t-ri-calm t-ri-mois">
            <div className="t-mh">
              <Link
                href={href({ mois: nextMonth(month, -1), jour: null })}
                aria-label={t("calendar.previous")}
                className="t-press t-ri-prec"
              >
                <TalentIcon name="suivant" size="xs" />
              </Link>
              <b id="ri-mois">{monthLabels(`${month}-01`, 1)[0]!.label}</b>
              <Link
                href={href({ mois: nextMonth(month, 1), jour: null })}
                aria-label={t("calendar.next")}
                className="t-press"
              >
                <TalentIcon name="suivant" size="xs" />
              </Link>
            </div>
            <table className="t-ri-grille" aria-labelledby="ri-mois">
              <thead>
                <tr>
                  {(["l", "ma", "me", "j", "v", "s", "d"] as const).map((key) => (
                    <th key={key} scope="col">
                      <span aria-hidden>{t(`calendar.letter.${key}`)}</span>
                      <span className="sr-only">{t(`calendar.weekday.${key}`)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((week) => (
                  <tr key={week[0]}>
                    {week.map((key) => {
                      const count = byDay.get(key)?.length ?? 0;
                      const inMonth = monthOf(key) === month;
                      return (
                        <td key={key}>
                          {inMonth ? (
                            <Link
                              href={href({ jour: key })}
                              aria-current={selected === key ? "date" : undefined}
                              aria-label={t("agenda.dayCount", {
                                day: labels[key]?.long ?? key,
                                count,
                              })}
                              className={cx(
                                "t-press",
                                key === today && "t-auj",
                                count > 0 && "t-pl",
                              )}
                              scroll={false}
                            >
                              {labels[key]?.day}
                              {count > 0 && <i aria-hidden />}
                            </Link>
                          ) : (
                            <span aria-hidden className="t-hors">
                              {labels[key]?.day}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected && (
            <section aria-labelledby="ri-jour" className="t-ri-groupe">
              <h2 id="ri-jour">{labels[selected]?.long ?? selected}</h2>
              {byDay.get(selected)?.length ? (
                <ul>{byDay.get(selected)!.map((item) => card(item, true))}</ul>
              ) : (
                <p className="t-rc-note">{t("agenda.emptyDay")}</p>
              )}
            </section>
          )}
        </div>
      )}

      {view === "evaluer" &&
        (toEvaluate.length === 0 ? (
          <div className="t-verre t-rc-vide">
            <span className="t-rc-rond" aria-hidden>
              <TalentIcon name="valider" />
            </span>
            <b>{t("agenda.evaluateEmpty")}</b>
            <span>{t("agenda.evaluateEmptyText")}</span>
          </div>
        ) : (
          <ul className="t-ri-groupe t-rw-grille">
            {toEvaluate.map((item) => {
              const name = item.application.profile.user.name;
              return (
                <li key={item.id} className="t-verre t-ri-ent t-ri-aev">
                  <span className={cx("t-rc-av", avatarTone(item.application.id))} aria-hidden>
                    {initialsOf(name)}
                  </span>
                  <span className="t-t">
                    <b className="t-rc-nom">{name}</b>
                    <span>{item.application.job.title}</span>
                    <span className="t-m">{item.startsAt ? when(item.startsAt) : ""}</span>
                  </span>
                  <Link
                    href={`/app/hire/candidats/${item.application.id}/evaluation`}
                    className="t-bt t-p t-s t-press"
                    aria-label={t("agenda.evaluateAria", { name })}
                  >
                    {t("agenda.evaluateCta")}
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}

      {manage && (
        <Sheet
          id="ri-nouveau"
          title={t("agenda.newTitle")}
          closeLabel={t("plan.close")}
          openParam="candidature"
          defaultOpen={candidature === "nouveau"}
        >
          {invitable.length === 0 ? (
            <p className="t-rc-note">{t("agenda.newEmpty")}</p>
          ) : (
            <ul className="t-rc-offres">
              {invitable.map((item) => (
                <li key={item.id}>
                  <Link href={`/app/hire/candidats/${item.id}/entretien`} className="t-press">
                    <span className="t-t">
                      <b>{item.profile.user.name}</b>
                      <span>{[item.job.title, item.stage.name].join(" · ")}</span>
                    </span>
                    <TalentIcon name="suivant" size="s" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      )}
    </div>
  );
}
