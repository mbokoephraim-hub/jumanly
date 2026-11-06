import "server-only";
import Link from "next/link";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import { pickMessages } from "@/i18n/client-messages";
import { MenuArt, type MenuArtName } from "@/components/site/menu-art";
import type {
  AgendaCampaign,
  AgendaPieces,
  AgendaReview,
  AgendaTasks,
} from "@/server/services/hire-agenda";
import { rhUnscheduleOfferAction } from "@/server/actions/phone-rh-offres";
import { CHECK_DELAYS } from "@/server/services/hire-verification";
import type { rhInterviews } from "@/server/services/hire-phone-candidatures";
import { OrbiDisc, PhoneIcon } from "../icon";
import { addDays, monthGrid, nextMonth, noonOf } from "@/lib/interview-calendar";
import { PlanCheckRow, PlanInterviewRow, type PlanDay } from "./agenda-plan";

type Interviews = Awaited<ReturnType<typeof rhInterviews>>;
type Card = Interviews["today"][number];

const ficheHref = (jobId: string, applicationId: string, de: "trier" | "completer") =>
  `/app/hire/offres/${jobId}?vue=candidats&de=${de}&fiche=${applicationId}`;

/**
 * « Agenda » (Ephraïm, 03/11/2026: it replaced « Candidatures »). Since 05/11/2026 it has two
 * parts only, chosen by Ephraïm: « Mois », the calendar where everything with a date shows, and
 * « À planifier », what still waits for a date: interviews of the retained, document checks of
 * the people set aside. « Aujourd'hui », « Semaine » and « À faire » are gone; people waiting for
 * an answer stay in Offres. Each line opens the candidate inside their offer.
 */
export const AGENDA_VIEWS = ["mois", "planifier"] as const;
export type AgendaView = (typeof AGENDA_VIEWS)[number];

const BASE = "/app/hire/entretiens";

/** What « À planifier » counts: the badge of its tab and the line under the title. */
export function toPlanCount(interviews: Interviews, tasks: AgendaTasks) {
  const open = [...interviews.today, ...interviews.ahead].filter(
    (card) => !card.confirmed || !card.when,
  ).length;
  const undated =
    tasks.pieces.filter((item) => !item.checkAt).length +
    tasks.reviews.filter((item) => !item.checkAt).length;
  return tasks.toPlan.length + open + undated;
}

export async function RhAgenda({
  interviews,
  tasks,
  campaigns = [],
  view,
  day,
  month,
  timeZone,
  now,
  canPlan,
  canCheck,
  dateError = false,
}: {
  interviews: Interviews;
  tasks: AgendaTasks;
  /** Programmed openings and ends of offers (« Programmer la campagne »). */
  campaigns?: AgendaCampaign[];
  view: AgendaView;
  /** The day shown under the month, `YYYY-MM-DD` in the member's time zone. */
  day: string;
  /** The month shown, `YYYY-MM`. */
  month: string;
  timeZone: string;
  now: Date;
  /** The member may propose interviews (manage + `connect.appointments`). */
  canPlan: boolean;
  /** The member may date a document check (manage). */
  canCheck: boolean;
  /** « Fixer la date » came back refused (a past day, a candidate gone). */
  dateError?: boolean;
}) {
  const t = await getTranslations("phoneRhAgenda");
  const ti = await getTranslations("phoneRhCandidatures.interviews");
  const format = await getFormatter();
  const keyOf = (date: Date) => date.toLocaleDateString("en-CA", { timeZone });
  const today = keyOf(now);
  const cards = [...interviews.today, ...interviews.ahead];
  const byDay = new Map<string, Card[]>();
  for (const card of cards) {
    if (!card.when) continue;
    const key = keyOf(card.when);
    byDay.set(key, [...(byDay.get(key) ?? []), card]);
  }
  // The document checks with a date (« Fixer la date »): in « Mois » beside the interviews.
  const checksByDay = new Map<string, (AgendaPieces | AgendaReview)[]>();
  for (const item of [...tasks.pieces, ...tasks.reviews]) {
    if (!item.checkAt) continue;
    const key = keyOf(item.checkAt);
    checksByDay.set(key, [...(checksByDay.get(key) ?? []), item]);
  }
  // The campaigns: the opening of a programmed offer, the last day of an offer.
  type Mark = { kind: "open" | "end"; at: Date; campaign: AgendaCampaign };
  const marksByDay = new Map<string, Mark[]>();
  const mark = (item: Mark) => {
    const key = keyOf(item.at);
    marksByDay.set(key, [...(marksByDay.get(key) ?? []), item]);
  };
  for (const campaign of campaigns) {
    if (campaign.opensAt) mark({ kind: "open", at: campaign.opensAt, campaign });
    if (campaign.closesAt) mark({ kind: "end", at: campaign.closesAt, campaign });
  }
  const countOf = (key: string) =>
    (byDay.get(key)?.length ?? 0) +
    (checksByDay.get(key)?.length ?? 0) +
    (marksByDay.get(key)?.length ?? 0);
  const days = new Set([...byDay.keys(), ...checksByDay.keys(), ...marksByDay.keys()]);
  const dayName = (date: Date, key: string) =>
    key === today
      ? t("today")
      : format.dateTime(date, { weekday: "long", day: "numeric", month: "long" });
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

  const checkCard = (item: AgendaPieces | AgendaReview) => (
    <li key={`v-${item.applicationId}`} className="nb-rh-ag-rdv" data-verif="">
      <span className="nb-rh-ag-heure">
        <b>{clock(item.checkAt!)}</b>
        <small>{t("checks.short")}</small>
      </span>
      <span className="nb-rh-ag-qui">
        <b>{nobody(item.name)}</b>
        <span>{item.jobTitle}</span>
        <em>
          {"required" in item
            ? t("checks.received", { received: item.received, required: item.required })
            : t("checks.reviewCard")}
        </em>
      </span>
      <Link
        href={ficheHref(item.jobId, item.applicationId, "completer")}
        className="nb-rh-ag-go"
        data-doux=""
      >
        {t("see")}
      </Link>
    </li>
  );
  const campaignCard = (item: Mark) => (
    <li
      key={`c-${item.kind}-${item.campaign.jobId}`}
      className="nb-rh-ag-rdv"
      data-campagne={item.kind}
    >
      <span className="nb-rh-ag-heure">
        <b>{item.kind === "open" ? clock(item.at) : t("campaigns.endShort")}</b>
        <small>{t(item.kind === "open" ? "campaigns.openTag" : "campaigns.endTag")}</small>
      </span>
      <span className="nb-rh-ag-qui">
        <b>{item.campaign.title}</b>
        <span>{t(item.kind === "open" ? "campaigns.opens" : "campaigns.ends")}</span>
      </span>
      <Link href={`/app/hire/offres/${item.campaign.jobId}`} className="nb-rh-ag-go" data-doux="">
        {t("see")}
      </Link>
    </li>
  );
  const dayItems = (key: string) => [
    ...(marksByDay.get(key) ?? [])
      .filter((item) => item.kind === "open")
      .map((item) => campaignCard(item)),
    ...(byDay.get(key) ?? []).map((card) => interviewCard(card)),
    ...(checksByDay.get(key) ?? [])
      .sort((a, b) => a.checkAt!.getTime() - b.checkAt!.getTime())
      .map((item) => checkCard(item)),
    ...(marksByDay.get(key) ?? [])
      .filter((item) => item.kind === "end")
      .map((item) => campaignCard(item)),
  ];
  // The days offered in the window of « Planifier l'entretien »: today and the next 13.
  const planDays: PlanDay[] = Array.from({ length: 14 }, (_, index) => {
    const key = addDays(today, index);
    const date = noonOf(key);
    return {
      key,
      weekday: index === 0 ? t("sheet.today") : format.dateTime(date, { weekday: "short" }),
      num: String(Number(key.slice(8))),
      month: format.dateTime(date, { month: "short" }),
    };
  });
  const planDelays = CHECK_DELAYS.map((days) => ({
    days,
    until: t("sheet.until", { date: noonOf(addDays(today, days)) }),
  }));
  // Waiting for the candidate, or without a date any more: still to plan.
  const open = cards.filter((card) => !card.confirmed || !card.when);
  const counts: Record<AgendaView, number> = {
    mois: [...days]
      .filter((key) => key.startsWith(month))
      .reduce((sum, key) => sum + countOf(key), 0),
    planifier: toPlanCount(interviews, tasks),
  };
  const tabHref = (key: AgendaView) => (key === "mois" ? BASE : `${BASE}?vue=${key}`);
  const empty = (art: MenuArtName | "orbi", text: string) => (
    <p className="nb-rh-ag-vide">
      {art === "orbi" ? <OrbiDisc size={28} /> : <MenuArt name={art} size="xs" />}
      {text}
    </p>
  );
  const dayList = (key: string, title: string) => (
    <section key={key} className="nb-rh-ag-bloc" aria-label={title}>
      <h3 className="nb-rh-ag-sous">
        <span>{title}</span>
        <small>{countOf(key)}</small>
      </h3>
      <ul className="nb-rh-ag-liste">{dayItems(key)}</ul>
    </section>
  );
  const monthHref = (key: string) => (key === monthOfKey(today) ? BASE : `${BASE}?mois=${key}`);

  let body: ReactNode;
  if (view === "mois") {
    const grid = monthGrid(month);
    const names = Array.from({ length: 7 }, (_, index) =>
      format.dateTime(noonOf(addDays(grid[0]![0]!, index)), { weekday: "narrow" }),
    );
    // The day chosen (today by default) first, then the rest of the month still to come.
    const shown = dayItems(day);
    const later = [...days]
      .filter((key) => key.startsWith(month) && key > day && key >= today)
      .sort();
    body = (
      <>
        {canCheck ? (
          // « + Planifier » (05/11/2026): what can take a date, each leading to where it is set.
          <details className="nb-rh-ag-plus">
            <summary>
              <PhoneIcon name="plus" size={18} />
              {t("add.title")}
            </summary>
            <ul>
              {(
                [
                  ["interview", "people", `${BASE}?vue=planifier#rh-ag-plan`],
                  ["check", "document", `${BASE}?vue=planifier#rh-ag-verif`],
                  ["campaign", "calendar", "/app/hire/offres/nouvelle"],
                ] as const
              ).map(([key, art, href]) => (
                <li key={key}>
                  <Link href={href} className="nb-rh-ag-tache">
                    <span className="nb-rh-ag-art" aria-hidden>
                      <MenuArt name={art} size="xs" />
                    </span>
                    <span className="nb-rh-ag-t">
                      <b>{t(`add.${key}`)}</b>
                      <span>{t(`add.${key}Line`)}</span>
                    </span>
                    <PhoneIcon name="chevron" size={18} />
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        <section className="nb-rh-ag-mois" aria-labelledby="rh-ag-mois">
          <div className="nb-rh-ag-mois-h">
            <Link
              href={monthHref(nextMonth(month, -1))}
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
              href={monthHref(nextMonth(month, 1))}
              aria-label={t("monthNext")}
              scroll={false}
              replace
            >
              <PhoneIcon name="chevron" size={18} />
            </Link>
          </div>
          <div className="nb-rh-ag-grille">
            {names.map((name, index) => (
              <span key={`n-${index}`} className="nb-rh-ag-jn" aria-hidden>
                {name}
              </span>
            ))}
            {grid.flat().map((key) => {
              const count = countOf(key);
              const other = !key.startsWith(month);
              return (
                <Link
                  key={key}
                  href={`${BASE}?mois=${key.slice(0, 7)}&jour=${key}`}
                  className="nb-rh-ag-case"
                  data-autre={other ? "" : undefined}
                  data-passe={key < today ? "" : undefined}
                  data-choisi={key === day ? "" : undefined}
                  aria-current={key === today ? "date" : undefined}
                  aria-label={`${dayName(noonOf(key), key)} · ${t("count", { count })}`}
                  scroll={false}
                  replace
                >
                  {Number(key.slice(8))}
                  {count > 0 ? (
                    // One dot per interview, three at most (Ephraïm, 03/11/2026: a figure under
                    // the date read as a mistake).
                    <span className="nb-rh-ag-points" aria-hidden>
                      {Array.from({ length: Math.min(count, 3) }, (_, index) => (
                        <i key={index} />
                      ))}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>
        <section className="nb-rh-ag-bloc" aria-labelledby="rh-ag-jour">
          <h2 id="rh-ag-jour" className="nb-rh-ag-h">
            <span>{dayName(noonOf(day), day)}</span>
            {shown.length > 0 ? <small>{shown.length}</small> : null}
          </h2>
          {shown.length === 0 ? (
            empty("calendar", t("dayEmpty"))
          ) : (
            <ul className="nb-rh-ag-liste">{shown}</ul>
          )}
        </section>
        {later.length > 0 ? (
          <section className="nb-rh-ag-bloc" aria-labelledby="rh-ag-ensuite">
            <h2 id="rh-ag-ensuite" className="nb-rh-ag-h">
              <span>{t("later")}</span>
            </h2>
            {later.map((key) => dayList(key, dayName(noonOf(key), key)))}
          </section>
        ) : null}
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
      </>
    );
  } else {
    const undated = tasks.pieces.filter((item) => !item.checkAt);
    const unplanned = tasks.reviews.filter((item) => !item.checkAt);
    const programmed = campaigns.filter((item) => item.opensAt);
    const checks = unplanned.length + undated.length;
    body = (
      <>
        <section className="nb-rh-ag-bloc" aria-labelledby="rh-ag-plan">
          <h2 id="rh-ag-plan" className="nb-rh-ag-h">
            <span>{t("plan.title")}</span>
            {tasks.toPlan.length + open.length > 0 ? (
              <small>{tasks.toPlan.length + open.length}</small>
            ) : null}
          </h2>
          {tasks.toPlan.length + open.length === 0 ? (
            empty("people", t("plan.empty"))
          ) : (
            <ul className="nb-rh-ag-taches">
              {tasks.toPlan.map((item) => (
                <PlanInterviewRow
                  key={item.applicationId}
                  person={{
                    applicationId: item.applicationId,
                    name: nobody(item.name),
                    jobTitle: item.jobTitle,
                  }}
                  days={planDays}
                  canManage={canCheck}
                  canPlan={canPlan}
                />
              ))}
            </ul>
          )}
          {open.length > 0 ? (
            <ul className="nb-rh-ag-liste">{open.map((card) => interviewCard(card))}</ul>
          ) : null}
        </section>
        <section className="nb-rh-ag-bloc" aria-labelledby="rh-ag-verif">
          <h2 id="rh-ag-verif" className="nb-rh-ag-h">
            <span>{t("checks.title")}</span>
            {checks > 0 ? <small>{checks}</small> : null}
          </h2>
          {dateError ? (
            <p className="nb-rh-ag-erreur" role="alert">
              {t("checks.error")}
            </p>
          ) : null}
          {checks === 0 ? (
            empty("document", t("checks.empty"))
          ) : (
            <ul className="nb-rh-ag-taches">
              {undated.map((item) => (
                <PlanCheckRow
                  key={`p-${item.applicationId}`}
                  person={{
                    applicationId: item.applicationId,
                    name: nobody(item.name),
                    jobTitle: item.jobTitle,
                  }}
                  delays={planDelays}
                  tone={item.late ? "due" : "ok"}
                  tag={item.late ? t("checks.lateTag") : undefined}
                  canCheck={canCheck}
                />
              ))}
              {unplanned.map((item) => (
                <PlanCheckRow
                  key={`r-${item.applicationId}`}
                  person={{
                    applicationId: item.applicationId,
                    name: nobody(item.name),
                    jobTitle: item.jobTitle,
                  }}
                  delays={planDelays}
                  tone={item.due ? "due" : "attente"}
                  canCheck={canCheck}
                />
              ))}
            </ul>
          )}
        </section>
        <section className="nb-rh-ag-bloc" aria-labelledby="rh-ag-campagnes">
          <h2 id="rh-ag-campagnes" className="nb-rh-ag-h">
            <span>{t("campaigns.title")}</span>
            {programmed.length > 0 ? <small>{programmed.length}</small> : null}
          </h2>
          {programmed.length === 0 ? (
            empty("calendar", t("campaigns.empty"))
          ) : (
            <ul className="nb-rh-ag-liste">
              {programmed.map((item) => (
                <li key={item.jobId} className="nb-rh-ag-camp">
                  <Link href={`/app/hire/offres/${item.jobId}`} className="nb-rh-ag-tache">
                    <span className="nb-rh-ag-art" aria-hidden>
                      <MenuArt name="calendar" size="xs" />
                    </span>
                    <span className="nb-rh-ag-t">
                      <b>{item.title}</b>
                      <span>
                        {item.closesAt
                          ? t("campaigns.line", { opens: item.opensAt!, closes: item.closesAt })
                          : t("campaigns.lineNoEnd", { opens: item.opensAt! })}
                      </span>
                    </span>
                    <PhoneIcon name="chevron" size={18} />
                  </Link>
                  {canCheck ? (
                    <form action={rhUnscheduleOfferAction}>
                      <input type="hidden" name="job" value={item.jobId} />
                      <button type="submit" className="nb-rh-ag-annuler">
                        {t("campaigns.cancel")}
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {canCheck ? (
            <Link href="/app/hire/offres/nouvelle" className="nb-rh-ag-go nb-rh-ag-nouvelle">
              {t("campaigns.new")}
            </Link>
          ) : null}
        </section>
      </>
    );
  }

  return (
    <div className="nb-page nb-rh-ag">
      <nav className="nb-rh-co-onglets" aria-label={t("tabs")}>
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
      {view === "planifier" ? (
        // The windows of « À planifier » need their texts in the browser.
        <NextIntlClientProvider messages={pickMessages(await getMessages(), ["phoneRhAgenda"])}>
          {body}
        </NextIntlClientProvider>
      ) : (
        body
      )}
    </div>
  );
}

const monthOfKey = (key: string) => key.slice(0, 7);
