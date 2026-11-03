import "server-only";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { MenuArt, type MenuArtName } from "@/components/site/menu-art";
import type { AgendaTasks } from "@/server/services/hire-agenda";
import { WAITING_DAYS } from "@/server/services/hire-offer-candidates";
import type { rhInterviews } from "@/server/services/hire-phone-candidatures";
import { OrbiDisc, PhoneIcon } from "../icon";
import { deskTabHref } from "./desk-tabs";

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
export async function RhAgenda({
  interviews,
  tasks,
  day,
  timeZone,
  now,
}: {
  interviews: Interviews;
  tasks: AgendaTasks;
  /** The day shown, `YYYY-MM-DD` in the member's time zone. */
  day: string;
  timeZone: string;
  now: Date;
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
  const taskCount = tasks.reviews.length + tasks.pieces.length + tasks.waiting.length;

  return (
    <div className="nb-page nb-rh-ag">
      <nav className="nb-rh-ag-semaine" aria-label={t("week")}>
        {week.map((item) => {
          const count = byDay.get(item.key)?.length ?? 0;
          return (
            <Link
              key={item.key}
              href={
                item.key === today
                  ? "/app/hire/entretiens"
                  : `/app/hire/entretiens?jour=${item.key}`
              }
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
          <p className="nb-rh-ag-vide">
            <MenuArt name="calendar" size="xs" />
            {t("dayEmpty")}
          </p>
        ) : (
          <ul className="nb-rh-ag-liste">{shown.map((card) => interviewCard(card))}</ul>
        )}
        {chosen.key === today && toFix.length > 0 ? (
          <>
            <h3 className="nb-rh-ag-sous">{t("toFix", { count: toFix.length })}</h3>
            <ul className="nb-rh-ag-liste">{toFix.map((card) => interviewCard(card))}</ul>
          </>
        ) : null}
      </section>

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
          {taskCount > 0 ? <small>{taskCount}</small> : null}
        </h2>
        {taskCount === 0 ? (
          <p className="nb-rh-ag-vide">
            <OrbiDisc size={28} />
            {t("tasks.empty")}
          </p>
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
    </div>
  );
}
