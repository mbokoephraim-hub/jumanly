import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { AtsCard, AtsDocs, AtsPodium, AtsRings } from "@/components/recruiter/ats";
import { AtsFollow, AtsSelection } from "@/components/recruiter/ats-client";
import { avatarTone, initialsOf } from "@/components/recruiter/candidates";
import { OfferSheets, OrbiLine } from "@/components/recruiter/offers";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { formatDayMonth } from "@/lib/dates";
import {
  cancelAtsAction,
  launchAtsAction,
  shortlistAction,
  stopAtsAction,
} from "@/server/actions/hire-ats";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { cheapestPlanWhere, limitOf, listPublicPlans } from "@/server/services/plans";
import { HireError, hirePermissions } from "@/server/services/hire";
import {
  atsBoard,
  atsViews,
  CREDITS_PER_FILE,
  type AtsRow,
  type AtsView,
} from "@/server/services/hire-ats";
import { listOffers } from "@/server/services/hire-offers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireAts");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** About three seconds a file (planche « ≈ 1 min »), never less than a minute shown. */
const minutesFor = (files: number) => Math.max(1, Math.round((files * 3) / 60));

const stageTone: Record<string, string> = {
  new: "#A6F26B",
  screening: "#2FD3A6",
  test: "#F2B33D",
  interview: "#9CC3EE",
  offer: "#C9B8F2",
};

/**
 * ATS of an offer (brief recruteur § 2.16, planches recruteur-4 § 1, 1 bis and v4.1): before any
 * analysis, « Analyser les N CV » with the credits it costs, where the applications stand and the
 * ranking by score; during it, file by file; after it, Orbi's recommendation (podium, the files to
 * see first and why), the views Recommandés · À vérifier · Tous, and « Sélectionner » to keep files
 * in the list of the retained. Nothing is rejected: every application stays in « Tous ».
 */
export default async function AtsPage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]/ats">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx } = await requireHire(`/app/hire/offres/${id}/ats`, "readApplications");
  const t = await getTranslations("hireAts");
  const format = await getFormatter();
  const now = new Date();
  const board = await atsBoard(db, ctx, id, now).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const permissions = hirePermissions(ctx.role);
  const { job } = board;
  const base = `/app/hire/offres/${job.id}/ats`;
  const offers = await listOffers(db, ctx, now);
  const offer = offers.find((item) => item.id === job.id);
  const figures = offer?.figures ?? { applications: 0, unseen: 0, views: 0, interviews: 0 };
  const total = board.rows.length;
  const pending = board.toAnalyse.length;
  const credits = pending * CREDITS_PER_FILE;
  const view: AtsView = atsViews.find((value) => value === one(query.vue)) ?? "recommandes";
  const selecting = one(query.selection) === "1" && permissions.manage;
  const error = one(query.erreur);
  const ok = one(query.ok);

  const lineOf = (row: AtsRow) =>
    [
      row.years > 0 ? t("line.years", { count: row.years }) : t("line.starter"),
      row.city,
      now.getTime() - row.createdAt.getTime() < 2 * 86_400_000
        ? t("line.received", { when: format.relativeTime(row.createdAt, now) })
        : null,
    ]
      .filter(Boolean)
      .join(" · ");
  const shortLine = (row: AtsRow) =>
    row.years > 0 ? t("line.years", { count: row.years }) : t("line.starter");
  const fileHref = (row: AtsRow) => `${base}/${row.id}`;

  const head = (
    <FlowHead
      back={`/app/hire/offres/${job.id}`}
      backLabel={t("back")}
      title={job.title}
      end={
        <SheetButton target={`menu-${job.id}`} label={t("menu")} className="t-bi t-press">
          <TalentIcon name="plus-options" size="s" />
        </SheetButton>
      }
    />
  );
  const sheets = (
    <OfferSheets
      job={{ ...job, figures }}
      back={base}
      manage={permissions.manage}
      readApplications
    />
  );

  // ─── Analysis running (planche v4.1 ATS2) ──────────────────────────────────────────────
  if (board.running && board.run) {
    const ids = board.run.ids;
    const rows = ids
      .map((value) => board.rows.find((row) => row.id === value))
      .filter((row): row is AtsRow => Boolean(row));
    const done = rows.filter((row) => row.analysis !== null);
    const current = rows.find((row) => row.analysis === null);
    const ratio = ids.length ? done.length / ids.length : 0;
    const step = ratio < 0.25 ? 0 : ratio < 0.5 ? 1 : ratio < 1 ? 2 : 3;
    const left = Math.max(5, (ids.length - done.length) * 3);
    return (
      <div className="t-flux t-r6">
        {head}
        <AtsFollow />
        <section className="t-r6-prog" aria-live="polite" aria-labelledby="ats-prog-t">
          <span className="t-big" style={{ "--p": Math.round(ratio * 100) } as React.CSSProperties}>
            <b>
              {done.length}
              <small>{t("progress.of", { count: ids.length })}</small>
            </b>
          </span>
          <h2 id="ats-prog-t">{t("progress.title")}</h2>
          <p>{t("progress.text", { seconds: left })}</p>
          <ol className="t-r6-step" aria-label={t("progress.steps")}>
            {(["read", "skills", "proofs", "rank"] as const).map((key, index) => (
              <li
                key={key}
                className={cx(index < step && "t-ok", index === step && "t-en")}
                aria-current={index === step ? "step" : undefined}
              >
                <i aria-hidden />
                {t(`progress.step.${key}`)}
              </li>
            ))}
          </ol>
        </section>
        <div className="t-sec-t">
          <h2>{t("progress.files")}</h2>
          <span>{t("progress.count", { done: done.length, total: ids.length })}</span>
        </div>
        <ul className="t-r6-fl">
          {rows.slice(0, 8).map((row) => {
            const isDone = row.analysis !== null;
            const isCurrent = row.id === current?.id;
            return (
              <li
                key={row.id}
                className={cx(isCurrent && "t-en", !isDone && !isCurrent && "t-att")}
              >
                <span className={cx("t-rc-av", avatarTone(row.id))} aria-hidden>
                  {initialsOf(row.name)}
                </span>
                <div className="t-t">
                  <b>{row.name}</b>
                  <span>
                    {isDone
                      ? t("progress.read")
                      : isCurrent
                        ? t("progress.reading")
                        : t("progress.waiting")}
                  </span>
                  {isCurrent && (
                    <span className="t-mb" aria-hidden>
                      <i />
                    </span>
                  )}
                </div>
                <span className={cx("t-pill", !isDone && "t-w")}>
                  {isDone && row.score !== null ? (
                    row.score
                  ) : isDone ? (
                    <TalentIcon name="valider" size="xs" />
                  ) : (
                    <TalentIcon name="horloge" size="xs" />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <OrbiLine>{t("progress.orbi")}</OrbiLine>
        <form action={stopAtsAction} className="t-verre t-fort t-bas-f">
          <input type="hidden" name="job" value={job.id} />
          <button type="submit" className="t-bt t-sec t-pl t-press">
            {t("progress.stop")}
          </button>
        </form>
        {sheets}
      </div>
    );
  }

  // ─── Locks (right, consent, credits) and the launch sheet ──────────────────────────────
  const plans = board.readiness === "entitlement" ? await listPublicPlans(db) : [];
  const plan =
    board.readiness === "entitlement"
      ? cheapestPlanWhere(
          plans,
          ["rh", "company"],
          (item) => item.entitlements["hire.cv_analysis"] === "true",
        )
      : null;
  const lock =
    board.readiness === "entitlement" ? (
      <div className="t-verre t-r6-lock">
        <OrbiMark size={26} />
        <div className="t-t">
          <b>{t("lock.title")}</b>
          <span>
            {plan
              ? t("lock.plan", {
                  plan: plan.name,
                  credits: limitOf(plan, "ai.credits.monthly") ?? 0,
                })
              : t("lock.noPlan")}
          </span>
        </div>
        <Link href="/app/abonnement/formules" className="t-bt t-sec t-s t-press">
          {t("lock.see")}
        </Link>
      </div>
    ) : board.readiness === "consent" ? (
      <Notice>
        {t("lock.consent")}{" "}
        <Link href="/app/parametres/confidentialite">{t("lock.consentLink")}</Link>
      </Notice>
    ) : null;
  const short = board.credits !== null && board.credits < credits;

  const launchSheet = (
    <Sheet
      id="ats-quand"
      title={t("when.title")}
      closeLabel={t("close")}
      openParam="lancer"
      defaultOpen={one(query.lancer) === "1" && board.readiness === "ready"}
    >
      <form action={launchAtsAction} className="t-flux">
        <input type="hidden" name="job" value={job.id} />
        <fieldset className="t-r6-qop">
          <legend className="sr-only">{t("when.title")}</legend>
          <label className="t-press">
            <input type="radio" name="when" value="maintenant" defaultChecked className="sr-only" />
            <span className="t-cases t-g-former" aria-hidden>
              <OrbiMark size={22} />
            </span>
            <span className="t-t">
              <b>{t("when.now")}</b>
              <span>{t("when.nowText", { count: pending })}</span>
              <em>{t("when.credits", { count: credits })}</em>
            </span>
            <span className="t-rd" aria-hidden />
          </label>
          {job.closesAt && (
            <label className="t-press">
              <input type="radio" name="when" value="fin" className="sr-only" />
              <span className="t-cases t-g-oppo" aria-hidden>
                <TalentIcon name="agenda" size="s" />
              </span>
              <span className="t-t">
                <b>{t("when.end")}</b>
                <span>{t("when.endText", { date: formatDayMonth(job.closesAt) })}</span>
                <em>{t("when.endCredits")}</em>
              </span>
              <span className="t-rd" aria-hidden />
            </label>
          )}
        </fieldset>
        <label className="t-r6-qsw t-press">
          <span className="t-t">
            <b>{t("when.autoAdd")}</b>
            {t("when.autoAddText")}
          </span>
          <input
            type="checkbox"
            name="autoAdd"
            role="switch"
            defaultChecked={board.schedule.autoAdd}
            className="t-sw"
          />
        </label>
        {short && (
          <Notice tone="err">{t("when.short", { credits, left: board.credits ?? 0 })}</Notice>
        )}
        <button type="submit" className="t-bt t-p t-pl t-press">
          {t("when.launch")}
        </button>
      </form>
    </Sheet>
  );

  const errorNotice =
    error &&
    ["running", "nothing", "credits", "quota", "consent", "entitlement", "date"].includes(error) ? (
      <Notice tone={error === "nothing" ? "" : "err"}>
        {t(`error.${error as "running"}`, { credits, left: board.credits ?? 0 })}
      </Notice>
    ) : null;
  const okToast =
    ok && ["programmee", "annulee", "arretee"].includes(ok) ? (
      <ToastOnLoad message={t(`ok.${ok as "programmee"}`)} />
    ) : null;

  // ─── The schedule (planche 1 bis ATS_PROG) ─────────────────────────────────────────────
  const schedule =
    board.schedule.atClose && job.closesAt ? (
      <section className="t-r6-prg" aria-labelledby="ats-prg-t">
        <div className="t-h">
          <span className="t-cal" aria-hidden>
            <i>
              {format.dateTime(job.closesAt, { month: "short" }).replace(".", "").toUpperCase()}
            </i>
            <b>{format.dateTime(job.closesAt, { day: "numeric" })}</b>
          </span>
          <div className="t-t">
            <b id="ats-prg-t">{t("schedule.title")}</b>
            <span>{t("schedule.text")}</span>
          </div>
        </div>
        <ol className="t-tl2" aria-label={t("schedule.timeline")}>
          {job.publishedAt && (
            <li className="t-ok">
              {t("schedule.published", { date: formatDayMonth(job.publishedAt) })}
            </li>
          )}
          <li className="t-ok">{t("schedule.today")}</li>
          <li>{t("schedule.analysis", { date: formatDayMonth(job.closesAt) })}</li>
        </ol>
        <dl className="t-r6-kp">
          <div>
            <dt>{t("schedule.received")}</dt>
            <dd>{total}</dd>
          </div>
          <div>
            <dt>{t("schedule.pending")}</dt>
            <dd>{pending}</dd>
          </div>
          <div>
            <dt>{t("schedule.creditsLeft")}</dt>
            <dd>{board.credits === null ? "∞" : board.credits}</dd>
          </div>
        </dl>
        <div className="t-rw">
          <SheetButton target="ats-quand" className="t-bt t-sec t-s t-press">
            {t("schedule.edit")}
          </SheetButton>
          <form action={cancelAtsAction}>
            <input type="hidden" name="job" value={job.id} />
            <button type="submit" className="t-bt t-sec t-s t-press">
              {t("schedule.cancel")}
            </button>
          </form>
          {pending > 0 && (
            <form action={launchAtsAction}>
              <input type="hidden" name="job" value={job.id} />
              <input type="hidden" name="when" value="maintenant" />
              {board.schedule.autoAdd && <input type="hidden" name="autoAdd" value="on" />}
              <button type="submit" className="t-bt t-p t-s t-press">
                {t("schedule.now")}
              </button>
            </form>
          )}
        </div>
      </section>
    ) : null;

  const hero =
    pending > 0 && board.readiness !== "entitlement" ? (
      <section className="t-r6-hero" aria-labelledby="ats-hero-t">
        <AtsRings />
        <div className="t-r">
          <AtsDocs count={pending} />
          <div className="t-t">
            <b id="ats-hero-t">
              {board.analysed > 0
                ? t("hero.more", { count: pending })
                : t("hero.title", { count: pending })}
            </b>
            {t("hero.text")}
          </div>
        </div>
        <dl className="t-r6-kp t-dk">
          <div>
            <dd>{credits}</dd>
            <dt>{t("hero.credits", { count: credits })}</dt>
          </div>
          <div>
            <dd>{board.credits === null ? "∞" : board.credits}</dd>
            <dt>{t("hero.available")}</dt>
          </div>
          <div>
            <dd>{t("hero.minutes", { count: minutesFor(pending) })}</dd>
            <dt>{t("hero.duration")}</dt>
          </div>
        </dl>
        {board.readiness === "consent" ? null : (
          <SheetButton target="ats-quand" className="t-bt t-pl t-press">
            <OrbiMark size={22} />
            {t("hero.launch")}
          </SheetButton>
        )}
      </section>
    ) : null;

  const activeTotal = board.stageCounts.reduce((sum, stage) => sum + stage.count, 0);
  const distribution =
    activeTotal > 0 ? (
      <section className="t-r6-dist" aria-labelledby="ats-dist-t">
        <div className="t-h">
          <b id="ats-dist-t">{t("dist.title", { count: activeTotal })}</b>
          <span>{t("dist.today")}</span>
        </div>
        <span className="t-bar" aria-hidden>
          {board.stageCounts
            .filter((stage) => stage.count > 0)
            .map((stage) => (
              <i
                key={stage.id}
                style={{ flex: stage.count, background: stageTone[stage.kind] ?? "#E2DCD2" }}
              />
            ))}
        </span>
        <ul className="t-lg">
          {board.stageCounts
            .filter((stage) => stage.count > 0)
            .map((stage) => (
              <li
                key={stage.id}
                style={{ "--c": stageTone[stage.kind] ?? "#E2DCD2" } as React.CSSProperties}
              >
                {t("dist.stage", { stage: stage.name, count: stage.count })}
              </li>
            ))}
        </ul>
      </section>
    ) : null;

  // ─── Selection (planche v4.1 ATS_SEL) ──────────────────────────────────────────────────
  if (selecting) {
    const source =
      view === "recommandes" ? board.recommended : view === "verifier" ? board.verify : board.rows;
    const list = (source.length ? source : board.rows).filter((row) => row.status === "active");
    const preselected =
      one(query.ids)?.split(",") ??
      (view === "recommandes" ? board.recommended.map((row) => row.id) : []);
    return (
      <div className="t-flux t-r6">
        {head}
        <ViewTabs base={base} view={view} board={board} selecting />
        <AtsSelection
          rows={list.map((row) => ({
            id: row.id,
            initials: initialsOf(row.name),
            tone: avatarTone(row.id),
            rank: board.rows.indexOf(row) + 1,
            name: row.name,
            line: lineOf(row),
            score: row.score,
            scoreLabel: row.score !== null ? t("card.scoreAria", { score: row.score }) : "",
          }))}
          preselected={preselected.filter((value) => list.some((row) => row.id === value))}
          action={shortlistAction}
          jobId={job.id}
          writeHref={`/app/hire/offres/${job.id}/reponses?groupe=selection`}
          interviewHref="/app/hire/candidats/{id}/entretien"
          labels={{
            selected: {
              zero: t("select.count", { count: 0 }),
              one: t("select.count", { count: 1 }),
              other: t("select.count", { count: 2 }).replace("2", "#"),
            },
            of: t("select.of", { count: total }),
            clear: t("select.clear"),
            all: t("select.all"),
            write: t("select.write"),
            interview: t("select.interview"),
            keep: t("select.keep"),
            close: t("select.close"),
            closeHref: `${base}?vue=${view}`,
            source: t(`select.source.${view}`),
            outOf: t("card.outOf"),
          }}
        />
        {sheets}
      </div>
    );
  }

  // ─── Before any analysis: hero, distribution, ranking by score (planche v4.1 ATS1) ─────
  if (board.analysed === 0) {
    return (
      <div className="t-flux t-r6">
        {head}
        {okToast}
        {errorNotice}
        {lock}
        {schedule ?? hero}
        {distribution}
        {total === 0 ? (
          <div className="t-verre t-rc-vide">
            <span className="t-rc-rond" aria-hidden>
              <TalentIcon name="candidats" />
            </span>
            <b>{t("empty.title")}</b>
            <span>{t("empty.text")}</span>
          </div>
        ) : (
          <>
            <div className="t-sec-t">
              <h2>{board.withScores ? t("list.byScore") : t("list.byDate")}</h2>
              <Link href={`/app/hire/candidats?offre=${job.id}`}>{t("list.sort")}</Link>
            </div>
            <ul className="t-r6-liste">
              {board.rows.map((row, index) => (
                <li key={row.id}>
                  <AtsCard
                    row={row}
                    rank={index + 1}
                    href={fileHref(row)}
                    whyHref={fileHref(row)}
                    line={lineOf(row)}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
        {launchSheet}
        {sheets}
      </div>
    );
  }

  // ─── After the analysis: Orbi's recommendation (planche v4.1 ATS3) ─────────────────────
  const shown =
    view === "recommandes" ? board.recommended : view === "verifier" ? board.verify : board.rows;
  const podium = board.recommended.slice(0, 3);
  const listed = view === "recommandes" ? shown.slice(podium.length) : shown;
  const usedCredits = board.analysed * CREDITS_PER_FILE;
  const names = board.recommendedToCheck.map((row) => row.name.split(/\s+/)[0]!);
  return (
    <div className="t-flux t-r6">
      {head}
      {okToast}
      {errorNotice}
      {board.run?.failed && <Notice tone="err">{t(`runFailed.${board.run.failed}`)}</Notice>}
      <section className="t-r6-reco" aria-labelledby="ats-reco-t">
        <div className="t-h">
          <OrbiMark size={34} />
          <div className="t-t">
            <b id="ats-reco-t">{t("reco.title")}</b>
            <span>{t("reco.sub", { count: board.analysed, credits: usedCredits })}</span>
          </div>
        </div>
        {podium.length > 0 ? (
          <>
            <AtsPodium rows={podium} line={shortLine} />
            <p>
              <b>{t("reco.priority", { count: board.recommended.length })}</b>{" "}
              {board.shared.length > 0
                ? t("reco.shared", {
                    skills: format.list(board.shared),
                    count: board.shared.length,
                  })
                : t("reco.sharedNone")}{" "}
              {names.length > 0 &&
                t("reco.check", { names: format.list(names), count: names.length })}
            </p>
            <div className="t-acts">
              <Link href={`${base}?vue=recommandes#ats-liste`} className="t-bt t-p t-s t-press">
                {t("reco.see", { count: board.recommended.length })}
              </Link>
              <SheetButton target="ats-pourquoi" className="t-bt t-sec t-s t-press">
                <TalentIcon name="pourquoi" size="xs" />
                {t("reco.why")}
              </SheetButton>
            </div>
          </>
        ) : (
          <>
            <p>{t("reco.none")}</p>
            <div className="t-acts">
              <SheetButton target="ats-pourquoi" className="t-bt t-sec t-s t-press">
                <TalentIcon name="pourquoi" size="xs" />
                {t("reco.why")}
              </SheetButton>
            </div>
          </>
        )}
      </section>
      {lock}
      {schedule ?? hero}
      <ViewTabs base={base} view={view} board={board} />
      <div id="ats-liste" className="t-flux t-serre">
        {listed.length === 0 ? (
          // The recommended files already stand on the podium above: no « none » under them.
          view === "recommandes" && podium.length > 0 ? null : (
            <p className="t-verre t-rc-rien">{t(`list.empty.${view}`)}</p>
          )
        ) : (
          <ul className="t-r6-liste">
            {listed.map((row) => (
              <li key={row.id}>
                <AtsCard
                  row={row}
                  rank={board.rows.indexOf(row) + 1}
                  href={fileHref(row)}
                  whyHref={fileHref(row)}
                  line={lineOf(row)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {permissions.manage && (
        <div className="t-verre t-fort t-bas-f">
          <Link href={`${base}?vue=${view}&selection=1`} className="t-bt t-sec t-m t-press">
            {t("bar.select")}
          </Link>
          <Link href={`/app/hire/offres/${job.id}/retenus`} className="t-bt t-p t-pl t-press">
            {t("bar.shortlist")}
            {board.shortlisted.length > 0 && <small> · {board.shortlisted.length}</small>}
          </Link>
        </div>
      )}
      <Sheet id="ats-pourquoi" title={t("why.title")} closeLabel={t("close")}>
        <div className="t-flux t-serre t-r6-why">
          <p>{t("why.lead")}</p>
          <ul>
            <li>{t("why.rule1")}</li>
            <li>{board.withScores ? t("why.rule2", { floor: 70 }) : t("why.rule2NoScore")}</li>
            <li>{t("why.rule3", { max: 5 })}</li>
            <li>{t("why.rule4")}</li>
          </ul>
          <p className="t-gar">
            <TalentIcon name="confidentialite" size="s" />
            <span>{t("why.excluded")}</span>
          </p>
        </div>
      </Sheet>
      {launchSheet}
      {sheets}
    </div>
  );
}

async function ViewTabs({
  base,
  view,
  board,
  selecting,
}: {
  base: string;
  view: AtsView;
  board: Awaited<ReturnType<typeof atsBoard>>;
  selecting?: boolean;
}) {
  const t = await getTranslations("hireAts");
  const counts: Record<AtsView, number> = {
    recommandes: board.recommended.length,
    verifier: board.verify.length,
    tous: board.rows.length,
  };
  return (
    <nav className="t-r6-tabs" aria-label={t("tabs.aria")}>
      {(["recommandes", "verifier", "tous"] as const).map((key) => (
        <Link
          key={key}
          href={`${base}?vue=${key}${selecting ? "&selection=1" : ""}`}
          aria-current={view === key ? "page" : undefined}
          className="t-press"
        >
          {t(`tabs.${key}`)}
          <small>{counts[key]}</small>
        </Link>
      ))}
    </nav>
  );
}
