import "server-only";
import Link from "next/link";
import type { ReactNode } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { MenuArt, type MenuArtName } from "@/components/site/menu-art";
import type { AgendaTasks } from "@/server/services/hire-agenda";
import { WAITING_DAYS } from "@/server/services/hire-offer-candidates";
import type { rhInterviews } from "@/server/services/hire-phone-candidatures";
import { OrbiDisc, PhoneIcon } from "../icon";
import { deskTabHref } from "./desk-tabs";
import { addDays, mondayOf, monthGrid, nextMonth, noonOf } from "@/lib/interview-calendar";

type Interviews = Awaited<ReturnType<typeof rhInterviews>>;
type Card = Interviews["today"][number];

const ficheHref = (jobId: string, applicationId: string, de: "trier" | "completer") =>
  `/app/hire/offres/${jobId}?vue=candidats&de=${de}&fiche=${applicationId}`;

/**
 * « Agenda » (Ephraïm, 03/11/2026: it replaced « Candidatures », which only led back to the
 * offers): the recruiter's day, whatever the offer. The week with its interviews, the interviews
 * of the day chosen, those to document, then « À faire »: cards set aside to review, pieces
 * awaited, people without an answer. Each line opens the candidate inside their offer.
 */
export const AGENDA_VIEWS = ["jour", "semaine", "mois", "planifier", "faire"] as const;
export type AgendaView = (typeof AGENDA_VIEWS)[number];

const BASE = "/app/hire/entretiens";

export async function RhAgenda({
  interviews,
  tasks,
  view,
  day,
  month,
  timeZone,
  now,
  canPlan,
}: {
  interviews: Interviews;
  tasks: AgendaTasks;
  view: AgendaView;
  /** The day shown, `YYYY-MM-DD` in the member's time zone. */
  day: string;
  /** The month shown, `YYYY-MM`. */
  month: string;
  timeZone: string;
  now: Date;
  /** The member may propose interviews (manage + `connect.appointments`). */
  canPlan: boolean;
}) {
  const t = await getTranslations("phoneRhAgenda");
  const ti = await getTranslations("phoneRhCandidatures.interviews");
  const format = await getFormatter();
  const keyOf = (date: Date) => date.toLocaleDateString("en-CA", { timeZone });
  const today = keyOf(now);
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getTime() + index * 86_400_000);
    return { key: keyOf(date), date };
  });
  const cards = [...interviews.today, ...interviews.ahead];
  const byDay = new Map<string, Card[]>();
  for (const card of cards) {
    if (!card.when) continue;
    const key = keyOf(card.when);
    byDay.set(key, [...(byDay.get(key) ?? []), card]);
  }
  const shown = byDay.get(day) ?? [];
  const toFix = cards.filter((card) => !card.when);
  const dayName = (date: Date, key: string) =>
    key === today
      ? t("today")
      : format.dateTime(date, { weekday: "long", day: "numeric", month: "long" });
  const chosen = week.find((item) => item.key === day) ?? week[0]!;
  const nobody = (name: string | null) => name ?? t("blind");
  const clock = (date: Date) => format.dateTime(date, { hour: "2-digit", minute: "2-digit" });

  const interviewCard = (card: Card, evaluate = false) => (
    <li key={card.id} className="nb-rh-ag-rdv">
      <span className="nb-rh-ag-heure">
        <b>{card.when ? clock(card.when) : ti("toFix")}</b>
        <small>{ti(`mode.${card.mode}`)}</small>
      </span>
      <span className="nb-rh-ag-qui">
        <b>{card.name}</b>
        <span>{card.jobTitle}</span>
        {!card.confirmed ? <em>{t("pending")}</em> : null}
      </span>
      {evaluate ? (
        <Link
          href={`/app/hire/candidats/${card.applicationId}/evaluation?entretien=${card.id}`}
          className="nb-rh-ag-go"
        >
          {t("evaluate.go")}
        </Link>
      ) : card.link && card.when && keyOf(card.when) === today ? (
        <a href={card.link} className="nb-rh-ag-go" target="_blank" rel="noreferrer">
          {ti("join")}
        </a>
      ) : (
        <Link href={`/app/hire/entretiens/${card.id}`} className="nb-rh-ag-go" data-doux="">
          {t("see")}
        </Link>
      )}
    </li>
  );

  const task = (
    key: string,
    art: MenuArtName,
    href: string,
    title: string,
    line: string,
    tone: "due" | "attente" | "ok",
  ) => (
    <li key={key}>
      <Link href={href} className="nb-rh-ag-tache" data-ton={tone}>
        <span className="nb-rh-ag-art" aria-hidden>
          <MenuArt name={art} size="xs" />
        </span>
        <span className="nb-rh-ag-t">
          <b>{title}</b>
          <span>{line}</span>
        </span>
        <PhoneIcon name="chevron" size={18} />
      </Link>
    </li>
  );
  const taskCount =
    tasks.reviews.length +
    tasks.pieces.length +
    tasks.waiting.length +
    interviews.toDocument.length;
  const pending = cards.filter((card) => !card.confirmed);
  const counts: Record<AgendaView, number> = {
    jour: (byDay.get(today) ?? []).length,
    semaine: cards.filter((card) => card.when && keyOf(card.when) < addDays(mondayOf(today), 14))
      .length,
    mois: cards.filter((card) => card.when && keyOf(card.when).startsWith(month)).length,
    planifier: tasks.toPlan.length + pending.length,
    faire: taskCount,
  };
  const tabHref = (key: AgendaView) => (key === "jour" ? BASE : `${BASE}?vue=${key}`);
  const empty = (art: MenuArtName | "orbi", text: string) => (
    <p className="nb-rh-ag-vide">
      {art === "orbi" ? <OrbiDisc size={28} /> : <MenuArt name={art} size="xs" />}
      {text}
    </p>
  );
  const dayList = (key: string, title: string) => {
    const list = byDay.get(key) ?? [];
    return (
      <section key={key} className="nb-rh-ag-bloc" aria-label={title}>
        <h3 className="nb-rh-ag-sous">
          <span>{title}</span>
          <small>{list.length}</small>
        </h3>
        <ul className="nb-rh-ag-liste">{list.map((card) => interviewCard(card))}</ul>
      </section>
    );
  };

  let body: ReactNode;
  if (view === "jour") {
    body = (
      <>
        <nav className="nb-rh-ag-semaine" aria-label={t("week")}>
          {week.map((item) => {
            const count = byDay.get(item.key)?.length ?? 0;
            return (
              <Link
                key={item.key}
                href={item.key === today ? BASE : `${BASE}?jour=${item.key}`}
                aria-current={item.key === chosen.key ? "date" : undefined}
                aria-label={`${dayName(item.date, item.key)} · ${t("count", { count })}`}
                scroll={false}
                replace
              >
                <small>{format.dateTime(item.date, { weekday: "short" }).replace(".", "")}</small>
                <b>{format.dateTime(item.date, { day: "numeric" })}</b>
                <i data-plein={count > 0 ? "" : undefined} aria-hidden />
              </Link>
            );
          })}
        </nav>
        <section className="nb-rh-ag-bloc" aria-labelledby="rh-ag-jour">
          <h2 id="rh-ag-jour" className="nb-rh-ag-h">
            <span>{dayName(chosen.date, chosen.key)}</span>
            {shown.length > 0 ? <small>{shown.length}</small> : null}
          </h2>
          {shown.length === 0 ? (
            empty("calendar", t("dayEmpty"))
          ) : (
            <ul className="nb-rh-ag-liste">{shown.map((card) => interviewCard(card))}</ul>
          )}
        </section>
      </>
    );
  } else if (view === "semaine") {
    // This week and the next, Monday first, only the days that hold an interview.
    const monday = mondayOf(today);
    const weeks = [
      { title: t("weekThis"), from: monday },
      { title: t("weekNext"), from: addDays(monday, 7) },
    ];
    body = weeks.map((item) => {
      const days = Array.from({ length: 7 }, (_, index) => addDays(item.from, index)).filter(
        (key) => key >= today && (byDay.get(key)?.length ?? 0) > 0,
      );
      return (
        <section key={item.from} className="nb-rh-ag-bloc" aria-label={item.title}>
          <h2 className="nb-rh-ag-h">
            <span>{item.title}</span>
            <small>{days.reduce((sum, key) => sum + (byDay.get(key)?.length ?? 0), 0)}</small>
          </h2>
          {days.length === 0
            ? empty("calendar", t("weekEmpty"))
            : days.map((key) => dayList(key, dayName(noonOf(key), key)))}
        </section>
      );
    });
  } else if (view === "mois") {
    const grid = monthGrid(month);
    const names = Array.from({ length: 7 }, (_, index) =>
      format.dateTime(noonOf(addDays(grid[0]![0]!, index)), { weekday: "narrow" }),
    );
    const inMonth = [...byDay.keys()].filter((key) => key.startsWith(month)).sort();
    body = (
      <>
        <section className="nb-rh-ag-mois" aria-labelledby="rh-ag-mois">
          <div className="nb-rh-ag-mois-h">
            <Link
              href={`${BASE}?vue=mois&mois=${nextMonth(month, -1)}`}
              aria-label={t("monthPrev")}
              scroll={false}
              replace
            >
              <PhoneIcon name="retour" size={18} />
            </Link>
            <h2 id="rh-ag-mois">
              {format.dateTime(noonOf(`${month}-01`), { month: "long", year: "numeric" })}
            </h2>
            <Link
              href={`${BASE}?vue=mois&mois=${nextMonth(month, 1)}`}
              aria-label={t("monthNext")}
              scroll={false}
              replace
            >
              <PhoneIcon name="chevron" size={18} />
            </Link>
          </div>
          <div className="nb-rh-ag-grille" role="grid">
            {names.map((name, index) => (
              <span key={`n-${index}`} className="nb-rh-ag-jn" aria-hidden>
                {name}
              </span>
            ))}
            {grid.flat().map((key) => {
              const count = byDay.get(key)?.length ?? 0;
              const other = !key.startsWith(month);
              return (
                <Link
                  key={key}
                  href={`${BASE}?jour=${key}`}
                  className="nb-rh-ag-case"
                  data-autre={other ? "" : undefined}
                  data-passe={key < today ? "" : undefined}
                  aria-current={key === today ? "date" : undefined}
                  aria-label={`${dayName(noonOf(key), key)} · ${t("count", { count })}`}
                  scroll={false}
                >
                  {Number(key.slice(8))}
                  {count > 0 ? <i>{count}</i> : null}
                </Link>
              );
            })}
          </div>
        </section>
        {inMonth.length === 0
          ? empty("calendar", t("monthEmpty"))
          : inMonth.map((key) => dayList(key, dayName(noonOf(key), key)))}
      </>
    );
  } else if (view === "planifier") {
    body = (
      <>
        <section className="nb-rh-ag-bloc" aria-labelledby="rh-ag-plan">
          <h2 id="rh-ag-plan" className="nb-rh-ag-h">
            <span>{t("plan.title")}</span>
            {tasks.toPlan.length > 0 ? <small>{tasks.toPlan.length}</small> : null}
          </h2>
          <p className="nb-rh-ag-aide">{t("plan.help")}</p>
          {tasks.toPlan.length === 0 ? (
            empty("people", t("plan.empty"))
          ) : (
            <ul className="nb-rh-ag-liste">
              {tasks.toPlan.map((item) => (
                <li key={item.applicationId} className="nb-rh-ag-rdv" data-plan="">
                  <span className="nb-rh-ag-art" aria-hidden>
                    <MenuArt name="calendar" size="sm" />
                  </span>
                  <span className="nb-rh-ag-qui">
                    <b>{nobody(item.name)}</b>
                    <span>{item.jobTitle}</span>
                    <small>{t("plan.since", { date: item.retainedAt })}</small>
                  </span>
                  {canPlan ? (
                    <Link
                      href={`/app/hire/candidats/${item.applicationId}/entretien`}
                      className="nb-rh-ag-go"
                    >
                      {t("plan.go")}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
        {pending.length > 0 ? (
          <section className="nb-rh-ag-bloc" aria-labelledby="rh-ag-reponse">
            <h2 id="rh-ag-reponse" className="nb-rh-ag-h">
              <span>{t("plan.pending")}</span>
              <small>{pending.length}</small>
            </h2>
            <ul className="nb-rh-ag-liste">{pending.map((card) => interviewCard(card))}</ul>
          </section>
        ) : null}
      </>
    );
  } else {
    body = (
      <>
        {interviews.toDocument.length > 0 ? (
          <section className="nb-rh-ag-bloc" aria-labelledby="rh-ag-eval">
            <h2 id="rh-ag-eval" className="nb-rh-ag-h">
              <span>{t("evaluate.title")}</span>
              <small>{interviews.toDocument.length}</small>
            </h2>
            <ul className="nb-rh-ag-liste">
              {interviews.toDocument.map((card) => interviewCard(card, true))}
            </ul>
          </section>
        ) : null}
        <section className="nb-rh-ag-bloc" aria-labelledby="rh-ag-faire">
          <h2 id="rh-ag-faire" className="nb-rh-ag-h">
            <span>{t("tasks.title")}</span>
          </h2>
          {tasks.reviews.length + tasks.pieces.length + tasks.waiting.length === 0 ? (
            empty("orbi", t("tasks.empty"))
          ) : (
            <ul className="nb-rh-ag-taches">
              {tasks.reviews.map((item) =>
                task(
                  `r-${item.applicationId}`,
                  "hourglass",
                  ficheHref(item.jobId, item.applicationId, "trier"),
                  nobody(item.name),
                  item.due
                    ? t("tasks.reviewDue", { job: item.jobTitle })
                    : t("tasks.reviewOn", { job: item.jobTitle, date: item.remindAt }),
                  item.due ? "due" : "attente",
                ),
              )}
              {tasks.pieces.map((item) =>
                task(
                  `p-${item.applicationId}`,
                  "document",
                  ficheHref(item.jobId, item.applicationId, "completer"),
                  nobody(item.name),
                  t(item.late ? "tasks.piecesLate" : "tasks.pieces", {
                    received: item.received,
                    required: item.required,
                    date: item.dueAt,
                    job: item.jobTitle,
                  }),
                  item.late ? "due" : "ok",
                ),
              )}
              {tasks.waiting.map((item) =>
                task(
                  `w-${item.jobId}`,
                  "people",
                  deskTabHref(item.jobId, "trier"),
                  item.jobTitle,
                  t("tasks.waiting", { count: item.count, days: WAITING_DAYS }),
                  "due",
                ),
              )}
            </ul>
          )}
        </section>
      </>
    );
  }

  return (
    <div className="nb-page nb-rh-ag">
      <nav className="nb-rh-co-onglets nb-rh-co-onglets-defil" aria-label={t("tabs")}>
        {AGENDA_VIEWS.map((key) => (
          <Link
            key={key}
            href={tabHref(key)}
            aria-current={key === view ? "page" : undefined}
            scroll={false}
            replace
          >
            {t(`tab.${key}`)}
            {counts[key] > 0 ? <small>{counts[key]}</small> : null}
          </Link>
        ))}
      </nav>
      {body}
      {toFix.length > 0 && view === "jour" ? (
        <section className="nb-rh-ag-bloc" aria-labelledby="rh-ag-fixer">
          <h2 id="rh-ag-fixer" className="nb-rh-ag-h">
            <span>{t("toFix", { count: toFix.length })}</span>
          </h2>
          <ul className="nb-rh-ag-liste">{toFix.map((card) => interviewCard(card))}</ul>
        </section>
      ) : null}
    </div>
  );
}
