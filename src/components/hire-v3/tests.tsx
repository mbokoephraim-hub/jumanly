import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { loose } from "@/lib/loose-t";
import { createTestAction, sendTestAction } from "@/server/actions/hire-v3-tests";
import type {
  TestResults,
  TestsOverview,
  testLibrary,
  testsWithResults,
} from "@/server/services/hire-v3-tests";
import { avatarColor, initialsOf } from "./avatar";
import { barsWaveSvg } from "./charts";
import { HireEmpty } from "./empty";
import { HireIcon, type HireIconName } from "./icon";
import { HirePage, HirePageHead } from "./page-head";
import { clsOf } from "./score-class";

export type TestsTab = "mine" | "results" | "library";
export const TESTS_TABS = { mine: "mes-tests", results: "resultats", library: "bibliotheque" };
const PAGE = "/app/hire/tests";

/** The colour of each test in turn (`TST[].c/b` of the prototype). */
const TEST_COLOURS: [string, string][] = [
  ["#3FAE3A", "#E6F6E0"],
  ["#4C8DF6", "#E6EFFE"],
  ["#8B6CF0", "#EFEAFE"],
  ["#F2994A", "#FEEFE2"],
  ["#D9A514", "#FFF7D6"],
];
/** The colour of each domain of the library (`TCAT`). */
const DOMAIN_COLOUR: Record<string, string> = {
  data: "#3FAE3A",
  finance: "#F2994A",
  service: "#4C8DF6",
  transversal: "#8B6CF0",
  langues: "#D9A514",
};
const CLS_LABEL_KEY = { fort: "fort", cons: "cons", lim: "lim" } as const;

function TsBar({ value, max, colour }: { value: number; max: number; colour: string }) {
  return (
    <span className="tsbar">
      <i style={{ width: `${max ? (value / max) * 100 : 0}%`, background: colour }} />
    </span>
  );
}

function Head({
  title,
  icon,
  right,
}: {
  title: string;
  icon: HireIconName;
  right?: React.ReactNode;
}) {
  return (
    <div className="ch">
      <span className="chip-ic">
        <HireIcon name={icon} size="s" />
      </span>
      <h3>{title}</h3>
      <div className="r">{right}</div>
    </div>
  );
}

async function tabsOf(tab: TestsTab) {
  const t = await getTranslations("hireV3Tests");
  return (Object.keys(TESTS_TABS) as TestsTab[]).map((key) => ({
    label: t(`tabs.${key}`),
    href: key === "mine" ? PAGE : `${PAGE}?onglet=${TESTS_TABS[key]}`,
    active: key === tab,
  }));
}

/** The flash line after an action (`?envoye=3`, `?erreur=forbidden`). */
async function Flash({ query }: { query: Record<string, string | string[] | undefined> }) {
  const t = await getTranslations("hireV3Tests.flash");
  const sent = typeof query.envoye === "string" ? Number(query.envoye) : null;
  const error = typeof query.erreur === "string" ? query.erreur : null;
  if (sent === null && !error && !query.archive) return null;
  const text =
    sent !== null
      ? t("sent", { count: sent })
      : query.archive
        ? t("archived")
        : error === "forbidden"
          ? t("forbidden")
          : t("invalid");
  return (
    <p className="meta" role="status" style={{ margin: "0 0 12px", fontWeight: 600 }}>
      {text}
    </p>
  );
}

/** « Créer un test » (`?creer=1`): the title and the offer, or a template of the library. */
async function CreateWindow({ jobs }: { jobs: { id: string; title: string }[] }) {
  const t = await getTranslations("hireV3Tests.create");
  return (
    <div className="overlay sov">
      <div className="smod nwmod" role="dialog" aria-modal="true" aria-labelledby="ts-new">
        <div className="row">
          <span className="nwm-k">
            <HireIcon name="tests" size="s" />
          </span>
          <div style={{ marginLeft: 12 }}>
            <h3 id="ts-new">{t("title")}</h3>
            <span className="meta">{t("sub")}</span>
          </div>
          <Link
            className="round"
            style={{ marginLeft: "auto" }}
            href={PAGE}
            aria-label={t("close")}
          >
            <HireIcon name="x" size="s" />
          </Link>
        </div>
        <form action={createTestAction}>
          <label className="nwf" style={{ marginTop: 18 }}>
            <span>{t("name")}</span>
            <input name="title" placeholder={t("namePlaceholder")} maxLength={120} />
          </label>
          <label className="nwf" style={{ marginTop: 12 }}>
            <span>{t("job")}</span>
            <select name="job" defaultValue={jobs[0]?.id ?? ""}>
              <option value="">{t("noJob")}</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>
          <div className="row" style={{ gap: 8, marginTop: 18 }}>
            <span className="meta">
              <HireIcon name="shield" size="s" /> {t("safe")}
            </span>
            <Link
              className="btn sm ghost"
              style={{ marginLeft: "auto" }}
              href={`${PAGE}?onglet=bibliotheque`}
            >
              {t("library")}
            </Link>
            <button type="submit" className="btn sm pri">
              {t("go")} <HireIcon name="right" size="s" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** « Tests » of the recruiter's web app v3 (`V.tests` of the prototype, screens 29-31). */
export async function HireV3Tests({
  tab,
  overview,
  results,
  withResults,
  library,
  jobs,
  query,
}: {
  tab: TestsTab;
  overview: TestsOverview;
  results: TestResults | null;
  withResults: Awaited<ReturnType<typeof testsWithResults>>;
  library: ReturnType<typeof testLibrary>;
  jobs: { id: string; title: string }[];
  query: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations("hireV3Tests");
  const lt = loose(t);
  const tc = await getTranslations("hireV3Candidates");
  const tabs = await tabsOf(tab);
  const creating = query.creer === "1" && overview.canManage && overview.enabled;
  const createButton =
    overview.canManage && overview.enabled ? (
      <Link className="btn pri" href={`${PAGE}?creer=1`} scroll={false}>
        <HireIcon name="plus" />
        {t("createTest")}
      </Link>
    ) : null;
  const locked = !overview.enabled ? (
    <div className="tsbox" style={{ display: "flex", minHeight: 200, marginBottom: 16 }}>
      <HireEmpty
        icon="tests"
        title={t("locked")}
        text={t("lockedText")}
        action={{ href: "/app/hire/compte/formule", label: t("lockedAction"), icon: "r_card" }}
      />
    </div>
  ) : null;

  if (tab === "library") {
    const cat = typeof query.cat === "string" && DOMAIN_COLOUR[query.cat] ? query.cat : "all";
    const shown = library.filter((x) => cat === "all" || x.domain === cat);
    return (
      <HirePage view="tests">
        <HirePageHead
          title={t("heads.library")}
          sub={t("librarySub", { count: library.length })}
          tabs={tabs}
        />
        <Flash query={query} />
        {locked}
        <div className="tsbox">
          <div className="tsfil">
            {["all", ...Object.keys(DOMAIN_COLOUR)].map((c) => (
              <Link
                key={c}
                className={c === cat ? "tschip on" : "tschip"}
                href={
                  c === "all"
                    ? `${PAGE}?onglet=bibliotheque`
                    : `${PAGE}?onglet=bibliotheque&cat=${c}`
                }
                scroll={false}
              >
                {c !== "all" ? <i style={{ background: DOMAIN_COLOUR[c] }} /> : null}
                {lt(`domains.${c}`)}
                <em>
                  {c === "all" ? library.length : library.filter((x) => x.domain === c).length}
                </em>
              </Link>
            ))}
          </div>
          <div className="tslib">
            {shown.length === 0 ? (
              <HireEmpty compact icon="search" title={t("libraryEmpty")} />
            ) : null}
            {shown.map((x) => (
              <div
                key={x.key}
                className="tsmod"
                style={{ "--c": DOMAIN_COLOUR[x.domain] } as React.CSSProperties}
              >
                <div className="row" style={{ gap: 8 }}>
                  <span className="tsdom">
                    <i />
                    {lt(`domains.${x.domain}`)}
                  </span>
                  <span className="tslv">{lt(`levels.${x.level}`)}</span>
                </div>
                <b>{x.title}</b>
                <div className="tsfacts">
                  <span>
                    <HireIcon name="tests" size="s" />
                    {t("questions", { count: x.questions })}
                  </span>
                  <span>
                    <HireIcon name="clock" size="s" />
                    {t("minutes", { count: x.minutes })}
                  </span>
                </div>
                {overview.canManage && overview.enabled ? (
                  <form action={createTestAction}>
                    <input type="hidden" name="template" value={x.key} />
                    <button type="submit" className="btn sm ghost">
                      <HireIcon name="plus" size="s" />
                      {t("useTemplate")}
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </HirePage>
    );
  }

  if (tab === "results") {
    const selected = results?.test.id;
    return (
      <HirePage view="tests">
        <HirePageHead title={t("heads.results")} sub={t("resultsSub")} tabs={tabs} />
        {withResults.length === 0 || !results ? (
          <div className="tsbox" style={{ display: "flex", minHeight: 360 }}>
            <HireEmpty
              icon="chart"
              title={t("resultsEmpty")}
              text={t("resultsEmptyText")}
              action={{ href: PAGE, label: t("tabs.mine"), icon: "tests" }}
            />
          </div>
        ) : (
          <>
            <div className="tssel">
              {withResults.slice(0, 4).map((x, i) => (
                <Link
                  key={x.id}
                  className={x.id === selected ? "tsopt on" : "tsopt"}
                  href={`${PAGE}?onglet=resultats&test=${x.id}`}
                  style={{ "--c": TEST_COLOURS[i % 5]![0] } as React.CSSProperties}
                  scroll={false}
                >
                  <i />
                  <span>
                    <b>{x.title}</b>
                    <em>
                      {[t("submittedCount", { count: x.submitted }), x.job]
                        .filter(Boolean)
                        .join(" · ")}
                    </em>
                  </span>
                </Link>
              ))}
            </div>
            <div className="tsk">
              <div className="tskt">
                <span>{t("kpi.submitted")}</span>
                <b className="num">{t("ratio", { a: results.submitted, b: results.sent })}</b>
                <em>
                  {t("percentOf", {
                    value: results.sent ? Math.round((results.submitted / results.sent) * 100) : 0,
                  })}
                </em>
              </div>
              <div className="tskt">
                <span>{t("kpi.average")}</span>
                <b className="num">{results.average ?? "–"}</b>
                <em>{t("outOf100")}</em>
              </div>
              <div className="tskt">
                <span>{t("kpi.median")}</span>
                <b className="num">{results.median ?? "–"}</b>
                <em>{t("medianSub")}</em>
              </div>
              <div className="tskt">
                <span>{t("kpi.passed")}</span>
                <b className="num">{t("ratio", { a: results.passed, b: results.submitted })}</b>
                <em>{t("passedSub")}</em>
              </div>
            </div>
            <div className="tsgrid">
              <div className="tsbox">
                <div className="tsh">
                  <h3>{t("ranking")}</h3>
                  <span className="meta">{t("rankingSub")}</span>
                </div>
                <div className="tsth tsrr">
                  <span>{t("cols.rank")}</span>
                  <span>{t("cols.candidate")}</span>
                  <span>{t("cols.score")}</span>
                  <span>{t("cols.duration")}</span>
                  <span>{t("cols.match")}</span>
                  <span />
                </div>
                {results.ranking.map((r, i) => (
                  <Link
                    key={r.inviteId}
                    className="tsrr tsrow"
                    href={`/app/hire/candidats/${r.applicationId}?onglet=test`}
                  >
                    <span className={i < 3 ? "tsrk tsr1" : "tsrk"}>{i + 1}</span>
                    <span className="row" style={{ gap: 10, minWidth: 0 }}>
                      <span className={`av ${avatarColor(r.name)} xs`} aria-hidden="true">
                        {initialsOf(r.name)}
                      </span>
                      <b className="tr">{r.name}</b>
                    </span>
                    <span className="row" style={{ gap: 8 }}>
                      <b className="num" style={{ width: 26 }}>
                        {r.score ?? "–"}
                      </b>
                      {r.score !== null ? (
                        <TsBar
                          value={r.score}
                          max={100}
                          colour={r.score >= 80 ? "#2FA25A" : r.score >= 60 ? "#7DBA4A" : "#E8981C"}
                        />
                      ) : (
                        <span className="meta">{t("toGrade")}</span>
                      )}
                    </span>
                    <span className="meta">
                      {r.minutes ? t("minutes", { count: r.minutes }) : "–"}
                    </span>
                    <span>
                      {r.matchScore !== null ? (
                        <span className={`cm ${clsOf(r.matchScore)}`}>
                          {clsOf(r.matchScore) === "fort" ? (
                            <HireIcon name="spark2" size="s" />
                          ) : null}
                          {tc(`cls.${CLS_LABEL_KEY[clsOf(r.matchScore)]}`)}
                        </span>
                      ) : (
                        <span className="meta">–</span>
                      )}
                    </span>
                    <span className="tsgo">
                      <HireIcon name="chev" size="s" />
                    </span>
                  </Link>
                ))}
              </div>
              <div className="stack" style={{ gap: 16 }}>
                <div className="tsbox">
                  <Head title={t("distribution")} icon="chart" />
                  <div
                    dangerouslySetInnerHTML={{
                      __html: barsWaveSvg({
                        data: ["0-20", "20-40", "40-60", "60-80", "80-100"].map(
                          (label, i) => [label, results.buckets[i] ?? 0] as [string, number],
                        ),
                        hi: results.buckets.indexOf(Math.max(...results.buckets)),
                        h: 180,
                        w: 420,
                      }),
                    }}
                  />
                </div>
                <div className="tsbox">
                  <Head title={t("hardest")} icon="filter" />
                  {results.hardest.length === 0 ? (
                    <p className="meta">{t("hardestEmpty")}</p>
                  ) : (
                    results.hardest.map((q) => (
                      <div key={q.id} className="tsq">
                        <div className="row" style={{ fontSize: 13, gap: 12 }}>
                          <span className="tr" style={{ flex: 1, minWidth: 0 }}>
                            {q.prompt}
                          </span>
                          <b className="num" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>
                            {t("percent", { value: q.rate ?? 0 })}
                          </b>
                        </div>
                        <TsBar
                          value={q.rate ?? 0}
                          max={100}
                          colour={(q.rate ?? 0) < 60 ? "#E8981C" : "#2FA25A"}
                        />
                      </div>
                    ))
                  )}
                  <div className="meta">{t("hardestSub")}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </HirePage>
    );
  }

  // « Mes tests »
  const live = overview.tests.filter((x) => x.status === "live");
  const drafts = overview.tests.filter((x) => x.status !== "live");
  const firstDraft = overview.todo.drafts[0];
  const suggestions = library.slice(0, 3);
  const row = (x: TestsOverview["tests"][number], i: number) => {
    const [c, b] = TEST_COLOURS[i % 5]!;
    return (
      <div key={x.id} className="tsrr2 tsrow" style={{ "--c": c, "--b": b } as React.CSSProperties}>
        <Link
          className="tsname"
          href={`${PAGE}/${x.id}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          <i />
          <span style={{ minWidth: 0 }}>
            <b className="tr">{x.title}</b>
            <em className="tr">{x.job?.title ?? t("noJob")}</em>
          </span>
        </Link>
        <span className="meta">{t("format", { questions: x.questions, minutes: x.minutes })}</span>
        <span>
          {x.sent ? (
            <span className="row" style={{ gap: 8 }}>
              <b className="num">{t("ratio", { a: x.submitted, b: x.sent })}</b>
              <TsBar value={x.submitted} max={x.sent} colour={c} />
            </span>
          ) : (
            <span className="meta">–</span>
          )}
        </span>
        <span>
          {x.average !== null ? (
            <>
              <b className="num">{x.average}</b>
              <span className="meta">{t("per100")}</span>
            </>
          ) : (
            <span className="meta">–</span>
          )}
        </span>
        <span>
          {x.status === "live" ? (
            <span className="tsst live">
              <i />
              {t("status.live")}
            </span>
          ) : (
            <span className="tsst dr">{t("status.draft")}</span>
          )}
        </span>
        <span className="row" style={{ justifyContent: "flex-end" }}>
          {x.status === "live" ? (
            <Link className="btn sm ghost" href={`${PAGE}?onglet=resultats&test=${x.id}`}>
              {t("results")}
            </Link>
          ) : overview.canManage && x.job && x.questions > 0 ? (
            <form action={sendTestAction}>
              <input type="hidden" name="id" value={x.id} />
              <input type="hidden" name="back" value="list" />
              <button type="submit" className="btn sm dark">
                <HireIcon name="send" size="s" />
                {t("send")}
              </button>
            </form>
          ) : (
            <Link className="btn sm ghost" href={`${PAGE}/${x.id}`}>
              {t("edit")}
            </Link>
          )}
        </span>
      </div>
    );
  };
  return (
    <HirePage view="tests">
      <HirePageHead
        title={t("heads.mine")}
        sub={t("mineSub", {
          tests: overview.tests.length,
          sent: overview.sentThisMonth,
          submitted: overview.kpi.submitted,
        })}
        tabs={tabs}
        actions={createButton}
      />
      <Flash query={query} />
      {locked}
      <div className="tstodo">
        <div className="tstd">
          <span className="chip-ic">
            <HireIcon name="eye" size="s" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <b>{t("todo.review", { count: overview.todo.today + overview.todo.toGrade })}</b>
            <em>
              {overview.todo.toGrade
                ? t("todo.toGrade", { count: overview.todo.toGrade })
                : t("todo.reviewSub")}
            </em>
          </span>
          <Link className="btn sm dark" href={`${PAGE}?onglet=resultats`}>
            {t("todo.reviewGo")}
          </Link>
        </div>
        <div className="tstd">
          <span className="chip-ic">
            <HireIcon name="refresh" size="s" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <b>{t("todo.waiting", { count: overview.todo.waiting })}</b>
            <em>{t("todo.waitingSub")}</em>
          </span>
          <Link className="btn sm ghost" href="/app/hire/suivi">
            {t("todo.waitingGo")}
          </Link>
        </div>
        <div className="tstd">
          <span className="chip-ic">
            <HireIcon name="send" size="s" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <b>{firstDraft ? t("todo.draft", { title: firstDraft.title }) : t("todo.noDraft")}</b>
            <em>
              {firstDraft
                ? [
                    firstDraft.job?.title ?? t("noJob"),
                    t("candidates", { count: firstDraft.candidates }),
                  ].join(" · ")
                : t("todo.noDraftSub")}
            </em>
          </span>
          {firstDraft && overview.canManage && firstDraft.job && firstDraft.questions > 0 ? (
            <form action={sendTestAction}>
              <input type="hidden" name="id" value={firstDraft.id} />
              <input type="hidden" name="back" value="list" />
              <button type="submit" className="btn sm ghost">
                {t("send")}
              </button>
            </form>
          ) : firstDraft ? (
            <Link className="btn sm ghost" href={`${PAGE}/${firstDraft.id}`}>
              {t("edit")}
            </Link>
          ) : (
            <Link className="btn sm ghost" href={`${PAGE}?onglet=bibliotheque`}>
              {t("tabs.library")}
            </Link>
          )}
        </div>
      </div>
      <div className="tsk">
        <div className="tskt">
          <span>{t("kpi.submittedTests")}</span>
          <b className="num">{t("ratio", { a: overview.kpi.submitted, b: overview.kpi.sent })}</b>
          <em>
            {t("percent", {
              value: overview.kpi.sent
                ? Math.round((overview.kpi.submitted / overview.kpi.sent) * 100)
                : 0,
            })}
          </em>
        </div>
        <div className="tskt">
          <span>{t("kpi.average")}</span>
          <b className="num">{overview.kpi.average ?? "–"}</b>
          <em>{t("outOf100")}</em>
        </div>
        <div className="tskt">
          <span>{t("kpi.duration")}</span>
          <b className="num">
            {overview.kpi.duration ? t("minutes", { count: overview.kpi.duration }) : "–"}
          </b>
          <em>{t("durationSub")}</em>
        </div>
        <div className="tskt">
          <span>{t("kpi.reminders")}</span>
          <b className="num">{overview.kpi.reminders}</b>
          <em>{t("remindersSub")}</em>
        </div>
      </div>
      <div className="tsgrid">
        <div className="tsbox">
          <div className="tsh">
            <h3>{t("yourTests")}</h3>
            <span className="meta">{t("yourTestsSub")}</span>
          </div>
          {overview.tests.length === 0 ? (
            <HireEmpty
              icon="tests"
              title={t("empty")}
              text={t("emptyText")}
              action={
                overview.canManage && overview.enabled
                  ? { href: `${PAGE}?onglet=bibliotheque`, label: t("tabs.library"), icon: "book" }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="tsth tsrr2">
                <span>{t("cols.test")}</span>
                <span>{t("cols.format")}</span>
                <span>{t("cols.submitted")}</span>
                <span>{t("cols.average")}</span>
                <span>{t("cols.status")}</span>
                <span />
              </div>
              <div className="tsgrp">{t("groups.live", { count: live.length })}</div>
              {live.map((x, i) => row(x, i))}
              <div className="tsgrp">{t("groups.draft", { count: drafts.length })}</div>
              {drafts.map((x, i) => row(x, live.length + i))}
            </>
          )}
          {overview.canManage && overview.enabled ? (
            <Link className="tsnew" href={`${PAGE}?creer=1`} scroll={false}>
              <HireIcon name="plus" size="s" />
              {t("newFromOffer")}
            </Link>
          ) : null}
        </div>
        <div className="card dk tsorbi">
          <Head title={t("orbi.title")} icon="orbi" />
          <div className="meta" style={{ margin: "-4px 0 10px" }}>
            {t("orbi.sub")}
          </div>
          <div className="stack">
            {suggestions.map((x) => (
              <div key={x.key} className="tsoq">
                <div style={{ fontWeight: 500 }}>{x.title}</div>
                <div className="row" style={{ marginTop: 8 }}>
                  <span className="meta">
                    {t("format", { questions: x.questions, minutes: x.minutes })}
                  </span>
                  {overview.canManage && overview.enabled ? (
                    <form action={createTestAction} style={{ marginLeft: "auto" }}>
                      <input type="hidden" name="template" value={x.key} />
                      <button
                        type="submit"
                        className="btn sm pri"
                        style={{ animation: "none", height: 30 }}
                      >
                        <HireIcon name="plus" size="s" />
                        {t("orbi.add")}
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="meta" style={{ marginTop: 12 }}>
            {t("orbi.foot")}
          </div>
        </div>
      </div>
      {creating ? <CreateWindow jobs={jobs} /> : null}
    </HirePage>
  );
}
