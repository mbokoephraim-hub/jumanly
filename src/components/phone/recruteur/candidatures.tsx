import "server-only";
import Link from "next/link";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import { pickMessages } from "@/i18n/client-messages";
import { defaultTimeZone } from "@/lib/dates";
import { moveCandidateAction } from "@/server/actions/hire-candidates";
import { db } from "@/server/db";
import { hirePermissions, type HireContext } from "@/server/services/hire";
import {
  HIGH_POTENTIAL,
  RH_PHASES,
  rhApplications,
  rhDiagnostic,
  rhInterviews,
  type RhPhase,
  type RhRow,
} from "@/server/services/hire-phone-candidatures";
import { OrbiDisc, PhoneIcon } from "../icon";
import { levelOf } from "./level";
import { RhGroupButton, RhSelectable, type RhGroupData } from "./candidatures-client";

const DAY = 86_400_000;

/** The texts the Candidatures screens need in the browser (sheets, selection). */
export async function RhCandidaturesTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["phoneRhCandidatures", "phone"])}>
      {children}
    </NextIntlClientProvider>
  );
}

export const RH_VIEWS = ["potentiel", "toutes", "entretiens", "decisions"] as const;
export type RhView = (typeof RH_VIEWS)[number];
const WHEN = ["aujourdhui", "avenir", "documenter"] as const;
const DECISIONS = ["propositions", "recrutes", "nonretenus"] as const;

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

export function initialsOf(name: string) {
  return name
    .replace(/\(.*\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** A soft colour per person (never from who they are: from the letters of the file's id). */
export function tintOf(id: string) {
  let sum = 0;
  for (const char of id) sum = (sum + char.charCodeAt(0)) % 6;
  return String(sum);
}

export function RhInitials({ id, name }: { id: string; name: string }) {
  return (
    <span className="nb-rh-ini" data-teinte={tintOf(id)} aria-hidden>
      {initialsOf(name)}
    </span>
  );
}

export function RhPct({ score, label }: { score: number; label: string }) {
  return (
    <span className="nb-rh-pct" data-niveau={levelOf(score)}>
      {label}
    </span>
  );
}

type Query = Record<string, string | string[] | undefined>;

function hrefWith(query: Query, changes: Record<string, string | null>) {
  const params = new URLSearchParams();
  // Another view starts from its first filter.
  const keep = "vue" in changes ? ["offre"] : ["offre", "vue", "etape", "quand", "decision", "tri"];
  for (const key of ["offre", "vue", "etape", "quand", "decision", "tri"]) {
    const value = key in changes ? changes[key] : keep.includes(key) ? one(query[key]) : null;
    if (value) params.set(key, value);
  }
  const text = params.toString();
  return text ? `/app/hire/candidats?${text}` : "/app/hire/candidats";
}

export type RhApplicationsData = Awaited<ReturnType<typeof rhApplications>>;

/** « 17 nouvelles · 170 candidatures · 9 à fort potentiel », under the title. */
export async function rhCandidaturesLine(data: RhApplicationsData) {
  const t = await getTranslations("phoneRhCandidatures");
  return t("line", {
    unseen: data.rows.filter((row) => row.unseen).length,
    total: data.rows.length,
    high: data.rows.filter(
      (row) =>
        (row.score ?? 0) >= HIGH_POTENTIAL && row.phase !== "nonretenu" && row.phase !== "recrute",
    ).length,
  });
}

/**
 * The tab Candidatures on the phone (Modèle B recruteur, M5, planches Recruteur-candidatures,
 * -cand-*): the offers, then « Fort potentiel · Toutes · Entretiens · Décisions ». The score ranks
 * and is explained; nobody is set aside by it.
 */
export async function RhCandidatures({
  ctx,
  query,
  data,
}: {
  ctx: HireContext;
  query: Query;
  data: RhApplicationsData;
}) {
  const t = await getTranslations("phoneRhCandidatures");
  const format = await getFormatter();
  const now = new Date();
  const offerId = one(query.offre) ?? null;
  const view = RH_VIEWS.find((value) => value === one(query.vue)) ?? "potentiel";
  const permissions = hirePermissions(ctx.role);
  const percent = (score: number) => t("percent", { score });
  const when = (date: Date) =>
    now.getTime() - date.getTime() < DAY
      ? format.relativeTime(date, now)
      : format.relativeTime(date, { now, unit: "day" });
  const live = data.rows.filter((row) => row.phase !== "nonretenu" && row.phase !== "recrute");
  const high = live.filter((row) => (row.score ?? 0) >= HIGH_POTENTIAL);
  const interviews = await rhInterviews(db, ctx, offerId, defaultTimeZone(), now);
  const ok = one(query.ok);
  const back = hrefWith(query, {});
  const [org, me] = await Promise.all([
    db.organization.findUnique({ where: { id: ctx.organizationId }, select: { name: true } }),
    db.user.findUnique({ where: { id: ctx.userId }, select: { name: true, firstName: true } }),
  ]);
  const who = {
    company: org?.name ?? "",
    signer: me ? (me.firstName || me.name).split(/\s+/)[0]! : "",
  };

  const rowLine = (row: RhRow) =>
    t("row.line", {
      headline: row.headline ?? row.firstSkill ?? "",
      hasHeadline: row.headline || row.firstSkill ? "yes" : "no",
      years: row.years,
    });

  const candidateRow = (row: RhRow, sub: ReactNode, end?: ReactNode) => (
    <Link href={`/app/hire/candidats/${row.id}`} className="nb-rh-cl">
      <RhInitials id={row.id} name={row.name} />
      <span className="nb-rh-res-t">
        <b>
          {row.name}
          {row.unseen ? <i className="nb-rh-point" aria-label={t("row.new")} /> : null}
        </b>
        {sub}
      </span>
      {end ?? (row.score !== null ? <RhPct score={row.score} label={percent(row.score)} /> : null)}
    </Link>
  );

  const offerChips = (
    <nav className="nb-rh-filtres" aria-label={t("offers")}>
      <Link
        href={hrefWith(query, { offre: null })}
        className="nb-chip"
        aria-current={offerId ? undefined : "page"}
      >
        {t("allOffers", { count: data.total })}
      </Link>
      {data.offers.map((offer) => (
        <Link
          key={offer.id}
          href={hrefWith(query, { offre: offer.id })}
          className="nb-chip"
          aria-current={offer.id === offerId ? "page" : undefined}
        >
          {t("offerChip", { title: offer.title, count: offer.count })}
        </Link>
      ))}
    </nav>
  );

  const views = (
    <nav className="nb-rh-vues" aria-label={t("views.label")}>
      {RH_VIEWS.map((key) => (
        <Link
          key={key}
          href={hrefWith(query, { vue: key === "potentiel" ? null : key })}
          aria-current={key === view ? "page" : undefined}
        >
          {t(`views.${key}`)}
          {key === "potentiel" && high.length > 0 ? <i>{high.length}</i> : null}
          {key === "entretiens" && interviews.today.length + interviews.ahead.length > 0 ? (
            <i>{interviews.today.length + interviews.ahead.length}</i>
          ) : null}
        </Link>
      ))}
    </nav>
  );

  let body: ReactNode;
  if (view === "potentiel") {
    body = (
      <>
        {data.withScores && data.rows.length > 0 ? (
          <Link
            href={`/app/hire/candidats/diagnostic${offerId ? `?offre=${offerId}` : ""}`}
            className="nb-rh-orbi-l"
          >
            <OrbiDisc size={44} />
            <span>
              <b>{t("diagnostic.card", { count: data.rows.length })}</b>
              <span>{t("diagnostic.cardHint")}</span>
            </span>
            <PhoneIcon name="chevron" size={18} />
          </Link>
        ) : null}
        <p className="nb-meta nb-rh-regle">
          {data.withScores ? t("high.rule", { count: high.length }) : t("high.noScore")}
        </p>
        {high.length === 0 ? (
          <p className="nb-vide nb-rh-marge">{t("high.empty")}</p>
        ) : (
          <ul className="nb-rh-fp">
            {high.map((row) => (
              <li key={row.id} className="nb-rh-fp-carte">
                <div className="nb-rh-fp-h">
                  <RhInitials id={row.id} name={row.name} />
                  <span className="nb-rh-res-t">
                    <b>{row.name}</b>
                    <span className="nb-meta">
                      {t("high.sub", { job: row.jobTitle, stage: row.stage.name })}
                    </span>
                  </span>
                  {row.score !== null ? (
                    <RhPct score={row.score} label={percent(row.score)} />
                  ) : null}
                </div>
                {row.notes.length > 0 ? (
                  <ul className="nb-rh-puces">
                    {row.notes.map((note, index) => (
                      <li key={index}>{t(`notes.${note.key}`, note as never)}</li>
                    ))}
                  </ul>
                ) : null}
                {row.interests.length > 0 ? (
                  <>
                    <p className="nb-meta nb-rh-fp-s">{t("interests")}</p>
                    <div className="nb-rh-etiq">
                      {row.interests.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </>
                ) : null}
                <div className="nb-rh-fp-b">
                  <span className="nb-meta">
                    {[
                      t(`availability.${row.availability.kind}`, {
                        date: row.availability.from ?? now,
                      }),
                      row.assignee ? t("followedBy", { name: row.assignee }) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <Link href={`/app/hire/candidats/${row.id}`} className="nb-rh-ouvrir">
                    {t("open")}
                    <span className="sr-only">{row.name}</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  } else if (view === "toutes") {
    const phase = RH_PHASES.find((value) => value === one(query.etape)) ?? ("recue" as RhPhase);
    const byDate = one(query.tri) === "date";
    const inPhase = data.rows
      .filter((row) => row.phase === phase)
      .sort((a, b) =>
        byDate || !data.withScores
          ? b.createdAt.getTime() - a.createdAt.getTime()
          : (b.score ?? -1) - (a.score ?? -1) || b.createdAt.getTime() - a.createdAt.getTime(),
      );
    body = (
      <>
        <nav className="nb-rh-phases" aria-label={t("phases.label")}>
          {RH_PHASES.map((key) => (
            <Link
              key={key}
              href={hrefWith(query, { etape: key === "recue" ? null : key })}
              aria-current={key === phase ? "page" : undefined}
            >
              <b>{data.rows.filter((row) => row.phase === key).length}</b>
              <span>{t(`phases.${key}`)}</span>
            </Link>
          ))}
        </nav>
        <RhSelectable
          rows={inPhase.map((row) => ({ id: row.id, name: row.name, line: rowLine(row) }))}
          manage={permissions.manage}
          group={groupData(inPhase, back, who)}
          sort={
            <Link href={hrefWith(query, { tri: byDate ? null : "date" })} className="nb-rh-tri">
              <PhoneIcon name="echanger" size={18} />
              {byDate ? t("sort.date") : t("sort.score")}
            </Link>
          }
        >
          {inPhase.length === 0 ? (
            <p className="nb-vide nb-rh-marge">{t("phases.empty")}</p>
          ) : (
            inPhase.map((row) => (
              <div key={row.id} data-id={row.id}>
                {candidateRow(
                  row,
                  <>
                    <span className="nb-meta">{rowLine(row)}</span>
                    <span className="nb-meta">
                      {t("row.when", { job: row.jobTitle, when: when(row.createdAt) })}
                    </span>
                  </>,
                )}
              </div>
            ))
          )}
        </RhSelectable>
      </>
    );
  } else if (view === "entretiens") {
    const which = WHEN.find((value) => value === one(query.quand)) ?? "aujourdhui";
    const list =
      which === "aujourdhui"
        ? interviews.today
        : which === "avenir"
          ? interviews.ahead
          : interviews.toDocument;
    const counts = {
      aujourdhui: interviews.today.length,
      avenir: interviews.ahead.length,
      documenter: interviews.toDocument.length,
    };
    body = (
      <>
        <nav className="nb-rh-filtres" aria-label={t("interviews.label")}>
          {WHEN.map((key) => (
            <Link
              key={key}
              href={hrefWith(query, { quand: key === "aujourdhui" ? null : key })}
              className="nb-chip"
              aria-current={key === which ? "page" : undefined}
            >
              {t(`interviews.${key}`, { count: counts[key] })}
            </Link>
          ))}
        </nav>
        {list.length === 0 ? (
          <p className="nb-vide nb-rh-marge">{t(`interviews.empty.${which}`)}</p>
        ) : (
          <ul className="nb-rh-fp">
            {list.map((item) => (
              <li key={item.id} className="nb-rh-fp-carte">
                <div className="nb-rh-fp-h">
                  <span className="nb-rh-heure">
                    <b>
                      {item.when
                        ? format.dateTime(item.when, { hour: "2-digit", minute: "2-digit" })
                        : t("interviews.toFix")}
                    </b>
                    <span>{t(`interviews.mode.${item.mode}`)}</span>
                  </span>
                  <span className="nb-rh-res-t">
                    <b>{item.name}</b>
                    <span className="nb-meta nb-rh-2l">
                      {item.when
                        ? t("interviews.date", {
                            date: format.dateTime(item.when, {
                              weekday: "long",
                              day: "numeric",
                              month: "short",
                            }),
                            job: item.jobTitle,
                          })
                        : item.jobTitle}
                    </span>
                    {item.with.length > 0 ? (
                      <span className="nb-meta">
                        {t("interviews.with", { names: item.with.join(", ") })}
                      </span>
                    ) : null}
                  </span>
                  {item.score !== null ? (
                    <RhPct score={item.score} label={percent(item.score)} />
                  ) : null}
                </div>
                <div className="nb-rh-fp-actions">
                  {which === "documenter" ? (
                    <Link
                      href={`/app/hire/candidats/${item.applicationId}/evaluation?entretien=${item.id}`}
                      className="nb-bp"
                    >
                      {t("interviews.document")}
                    </Link>
                  ) : which === "aujourdhui" && item.link ? (
                    <a href={item.link} className="nb-bp" target="_blank" rel="noreferrer">
                      {t("interviews.join")}
                    </a>
                  ) : (
                    <Link href={`/app/hire/entretiens/${item.id}`} className="nb-bp">
                      {t("interviews.see")}
                    </Link>
                  )}
                  <Link href={`/app/hire/candidats/${item.applicationId}`} className="nb-bs">
                    {t("interviews.file")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  } else {
    const which = DECISIONS.find((value) => value === one(query.decision)) ?? "propositions";
    const lists = {
      propositions: data.rows.filter((row) => row.phase === "proposition"),
      recrutes: data.rows.filter((row) => row.phase === "recrute"),
      nonretenus: data.rows.filter((row) => row.phase === "nonretenu" || row.waiting),
    };
    const waiting = lists.nonretenus.filter((row) => row.waiting);
    const list = lists[which];
    body = (
      <>
        <nav className="nb-rh-filtres" aria-label={t("decisions.label")}>
          {DECISIONS.map((key) => (
            <Link
              key={key}
              href={hrefWith(query, { decision: key === "propositions" ? null : key })}
              className="nb-chip"
              aria-current={key === which ? "page" : undefined}
            >
              {t(`decisions.${key}`, { count: lists[key].length })}
            </Link>
          ))}
        </nav>
        {which === "nonretenus" && waiting.length > 0 && permissions.manage ? (
          <RhGroupButton
            data={groupData(waiting, back, who, "nonretenu")}
            label={t("decisions.answerAll", { count: waiting.length })}
            hint={t("decisions.answerAllHint")}
          />
        ) : null}
        {list.length === 0 ? (
          <p className="nb-vide nb-rh-marge">{t(`decisions.empty.${which}`)}</p>
        ) : (
          <ul>
            {list.map((row) => (
              <li key={row.id}>
                {candidateRow(
                  row,
                  <>
                    <span className="nb-meta">{row.jobTitle}</span>
                    {which === "propositions" && row.proposalAt ? (
                      <span className="nb-meta">
                        {t("decisions.sent", {
                          date: format.dateTime(row.proposalAt, { weekday: "long" }),
                        })}
                      </span>
                    ) : which === "recrutes" ? (
                      <span className="nb-meta">{t("decisions.hired")}</span>
                    ) : row.waiting ? (
                      <span className="nb-meta" data-ambre="">
                        {t("decisions.waiting")}
                      </span>
                    ) : (
                      <span className="nb-meta">
                        {row.answered ? t("decisions.answered") : t("decisions.rejected")}
                      </span>
                    )}
                  </>,
                  <PhoneIcon name="chevron" size={18} />,
                )}
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  return (
    <RhCandidaturesTexts>
      {ok === "groupe" ? (
        <p className="nb-rh-ok-l" role="status">
          {t("group.sent", { count: Number(one(query.n)) || 0 })}
        </p>
      ) : one(query.erreur) === "groupe" ? (
        <p className="nb-erreur nb-rh-marge" role="alert">
          {t("group.error")}
        </p>
      ) : null}
      {offerChips}
      {views}
      <div className="nb-rh-vue">{body}</div>
    </RhCandidaturesTexts>
  );
}

/** What the sheet « Message à N candidats » needs: the people, their first names, the offer. */
function groupData(
  rows: RhRow[],
  back: string,
  who: { company: string; signer: string },
  template?: RhGroupData["template"],
): RhGroupData {
  return {
    back,
    template: template ?? "entretien",
    people: rows.map((row) => ({ id: row.id, firstName: row.firstName, job: row.jobTitle })),
    ...who,
  };
}

/**
 * Diagnostic of all the CVs by Orbi (planche Recruteur-cand-diagnostic): read from the explained
 * scores, criterion by criterion; the recruiter decides who moves on.
 */
export async function RhDiagnostic({ ctx, query }: { ctx: HireContext; query: Query }) {
  const t = await getTranslations("phoneRhCandidatures.diagnostic");
  const tc = await getTranslations("phoneRhCandidatures");
  const format = await getFormatter();
  const now = new Date();
  const list = await rhApplications(db, ctx, null, now);
  const jobId = one(query.offre) ?? list.offers[0]?.id ?? null;
  const back = jobId ? `/app/hire/candidats?offre=${jobId}` : "/app/hire/candidats";
  if (!jobId)
    return (
      <div className="nb-page nb-rh-detail">
        <header className="nb-rh-barre">
          <Link href={back} className="nb-rh-retour">
            <PhoneIcon name="retour" size={20} />
            {t("back")}
          </Link>
        </header>
        <p className="nb-vide nb-rh-marge">{t("empty")}</p>
      </div>
    );
  const data = await rhDiagnostic(db, ctx, jobId, now);
  const manage = hirePermissions(ctx.role).manage;
  const share = (count: number) => (data.read ? `${(count / data.read) * 100}%` : "0%");
  return (
    <div className="nb-page nb-rh-detail">
      <header className="nb-rh-barre">
        <Link href={back} className="nb-rh-retour">
          <PhoneIcon name="retour" size={20} />
          {t("back")}
        </Link>
      </header>
      <section className="nb-rh-diag-h">
        <OrbiDisc size={52} />
        <span>
          <h1>{t("title")}</h1>
          <p className="nb-meta">{t("line", { count: data.read, job: data.job.title })}</p>
        </span>
      </section>
      <nav className="nb-rh-filtres" aria-label={tc("offers")}>
        {list.offers.map((offer) => (
          <Link
            key={offer.id}
            href={`/app/hire/candidats/diagnostic?offre=${offer.id}`}
            className="nb-chip"
            aria-current={offer.id === jobId ? "page" : undefined}
          >
            {offer.title}
          </Link>
        ))}
      </nav>
      <div className="nb-rh-diag-c">
        <div className="nb-rh-pile" aria-hidden>
          <span data-t="tout" style={{ width: share(data.all) }} />
          <span data-t="partie" style={{ width: share(data.partial) }} />
          <span data-t="peu" style={{ width: share(data.little) }} />
        </div>
        <div className="nb-rh-diag-tuiles">
          <p>
            <b data-t="tout">{data.all}</b>
            {t("all")}
          </p>
          <p>
            <b data-t="partie">{data.partial}</b>
            {t("partial")}
          </p>
          <p>
            <b>{data.little}</b>
            {t("little")}
          </p>
        </div>
      </div>
      {data.skills.length > 0 ? (
        <section className="nb-rh-diag-s" aria-labelledby="rh-diag-skills">
          <h2 id="rh-diag-skills">{t("skills")}</h2>
          {data.skills.map((skill) => (
            <p key={skill.name} className="nb-rh-diag-l">
              <span>{skill.name}</span>
              <span className="nb-rh-jauge" aria-hidden>
                <i style={{ width: share(skill.count) }} />
              </span>
              <span className="nb-meta">{t("of", { count: skill.count, total: data.read })}</span>
            </p>
          ))}
          {data.missing ? (
            <p className="nb-meta">
              {t("missing", { skill: data.missing.name, count: data.missing.count })}
            </p>
          ) : null}
        </section>
      ) : null}
      <section className="nb-rh-diag-p" aria-labelledby="rh-diag-closest">
        <h2 id="rh-diag-closest">{t("closest")}</h2>
        <ul>
          {data.closest.map((row) => (
            <li key={row.id}>
              <Link href={`/app/hire/candidats/${row.id}`} className="nb-rh-cl">
                <RhInitials id={row.id} name={row.name} />
                <span className="nb-rh-res-t">
                  <b>{row.name}</b>
                  <span className="nb-meta">
                    {tc("row.line", {
                      headline: row.headline ?? row.firstSkill ?? "",
                      hasHeadline: row.headline || row.firstSkill ? "yes" : "no",
                      years: row.years,
                    })}
                  </span>
                  <span className="nb-meta">
                    {tc("row.when", {
                      job: row.jobTitle,
                      when: format.relativeTime(row.createdAt, now),
                    })}
                  </span>
                </span>
                {row.score !== null ? (
                  <RhPct score={row.score} label={tc("percent", { score: row.score })} />
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      {manage && data.next && data.firstStep ? (
        <form action={moveCandidateAction} className="nb-bas">
          <input type="hidden" name="application" value={data.next.id} />
          <input type="hidden" name="stage" value={data.firstStep.id} />
          <button type="submit" className="nb-bp">
            {t("shortlist", { name: data.next.firstName })}
          </button>
        </form>
      ) : null}
    </div>
  );
}
