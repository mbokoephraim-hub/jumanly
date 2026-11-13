import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { pickMessages } from "@/i18n/client-messages";
import type { CandidatesV3 } from "@/server/services/hire-v3-candidates";
import { avatarColor, initialsOf } from "./avatar";
import { radarSvg } from "./charts";
import { HireIcon } from "./icon";
import { clsOf, Gauge, HireKanban, type KanbanColumn } from "./kanban";
import { HireDownloadButton, HirePage, HirePageHead } from "./page-head";
import { HireTabs } from "./tabs";

export const CANDIDATE_TABS = ["pipeline", "liste", "comparer"] as const;
export type CandidateTab = (typeof CANDIDATE_TABS)[number];

/** Colours of the stages (`SCOL` of the prototype), by kind. */
const SCOL: Record<string, [string, string]> = {
  new: ["#4C8DF6", "#EAF2FF"],
  screening: ["#8B6CF0", "#F1ECFF"],
  test: ["#D9A514", "#FFF7D6"],
  interview: ["#F2994A", "#FFF1E4"],
  offer: ["#3FAE3A", "#E9F8DF"],
  hired: ["#3FAE3A", "#E9F8DF"],
};
const CLS_COLOUR = { fort: "#2FA25A", cons: "#D9901A", lim: "#8C9AB8" } as const;
const CMP = ["#2FA25A", "#8B6CF0", "#F2994A"];
const CMP_FILL = ["rgba(166,242,107,.4)", "rgba(139,108,240,.10)", "rgba(242,153,74,.10)"];

/** Candidats (`V.candidats` of the prototype v3): the offer on top, then Pipeline, Liste, Comparer. */
export async function HireV3Candidates({
  data,
  tab,
  filter,
  canMove,
}: {
  data: CandidatesV3;
  tab: CandidateTab;
  filter: "all" | "fort" | "cons" | "lim";
  canMove: boolean;
}) {
  const t = await getTranslations("hireV3Candidates");
  const to = await getTranslations("hireV3Offers");
  const tp = await getTranslations("hireV3.page");
  const { job } = data;
  const base = (extra: Record<string, string>) => {
    const params = new URLSearchParams({ ...(job ? { offre: job.id } : {}), ...extra });
    return `/app/hire/candidats?${params}`;
  };
  const tabs = CANDIDATE_TABS.map((key) => ({
    label: t(`tabs.${key}`),
    href: base({
      ...(key === "pipeline" ? {} : { onglet: key }),
      ...(filter === "all" ? {} : { classe: filter }),
    }),
    active: key === tab,
  }));
  if (!job)
    return (
      <HirePage view="candidats">
        <HirePageHead title={t("title")} />
        <p className="meta">{t("empty")}</p>
      </HirePage>
    );
  const all = data.candidates.filter((c) => c.status !== "rejected");
  const shown = all.filter((c) => filter === "all" || clsOf(c.score) === filter);
  const count = (k: string) => all.filter((c) => clsOf(c.score) === k).length;
  const pct = Math.round(
    Math.min(1, data.candidates.length / Math.max(1, job.openings * 10)) * 100,
  );

  const hero = (
    <div className="hero">
      <div className="hero-l">
        <div className="row" style={{ gap: 8, marginBottom: 8 }}>
          {job.department ? <span className="odep">{job.department}</span> : null}
          <span className={job.status === "published" ? "ost live" : "ost pa"}>
            {job.status === "published" ? <span className="d" /> : null}
            {to(
              `status.${job.status === "published" ? "live" : job.status === "paused" ? "paused" : "closed"}`,
            )}
          </span>
          {data.offers.length > 1 ? (
            <details className="hero-swd" style={{ position: "relative" }}>
              <summary className="hero-sw">
                <HireIcon name="offres" size="s" />
                {t("hero.change")} <HireIcon name="down" size="s" />
              </summary>
              <div
                className="drop"
                style={{ position: "absolute", top: "110%", left: 0, zIndex: 20, minWidth: 260 }}
              >
                {data.offers.map((o) => (
                  <Link key={o.id} className="dd-i" href={`/app/hire/candidats?offre=${o.id}`}>
                    <span style={{ flex: 1 }}>{o.title}</span>
                    <span className="meta">{o.count}</span>
                  </Link>
                ))}
              </div>
            </details>
          ) : null}
        </div>
        <h1>{job.title}</h1>
        <div className="oloc">
          <HireIcon name="pin" size="s" />
          {job.city} · {to(`contract.${job.contractType}`)} ·{" "}
          {job.daysLeft === null ? t("hero.noEnd") : t("hero.closes", { count: job.daysLeft })}
        </div>
      </div>
      <div className="hero-k">
        <div>
          <b className="num">{data.candidates.length}</b>
          <span>{t("hero.applications")}</span>
        </div>
        <div>
          <b className="num">{data.high}</b>
          <span>
            <HireIcon name="spark2" size="s" />
            {t("hero.high")}
          </span>
        </div>
        <div>
          <b className="num">{job.openings}</b>
          <span>{t("hero.openings", { count: job.openings })}</span>
          <i className="hbar">
            <i style={{ width: `${pct}%` }} />
          </i>
        </div>
      </div>
    </div>
  );
  const chips = (
    <div className="ph cbar">
      <div className="chips">
        {(
          [
            ["all", t("chips.all"), all.length],
            ["fort", t("cls.fort"), count("fort")],
            ["cons", t("cls.cons"), count("cons")],
            ["lim", t("cls.lim"), count("lim")],
          ] as [string, string, number][]
        ).map(([key, label, n]) => (
          <Link
            key={key}
            className={filter === key ? "chip on" : "chip"}
            scroll={false}
            href={base({
              ...(tab === "pipeline" ? {} : { onglet: tab }),
              ...(key === "all" ? {} : { classe: key }),
            })}
          >
            {key !== "all" ? (
              <i
                className="cdot"
                style={{ background: CLS_COLOUR[key as keyof typeof CLS_COLOUR] }}
              />
            ) : null}
            {label} <em>{n}</em>
          </Link>
        ))}
      </div>
      <span className="meta cbh">
        <HireIcon name="orbi" size="s" /> {t("orbi")}
      </span>
      <div className="act">
        <HireDownloadButton
          href={`/app/hire/telecharger?doc=${tab === "comparer" ? "comparaison" : "candidats"}&offre=${job.id}&retour=${encodeURIComponent(base(tab === "pipeline" ? {} : { onglet: tab }))}`}
          label={tp("download")}
        />
        <HireTabs tabs={tabs} />
      </div>
    </div>
  );

  let body: React.ReactNode;
  if (tab === "liste") {
    const stageOf = new Map(data.stages.map((s) => [s.id, s]));
    body = (
      <div className="clist">
        <div className="clh">
          <span>{t("list.candidate")}</span>
          <span>{t("list.match")}</span>
          <span>{t("list.stage")}</span>
          <span>{t("list.test")}</span>
          <span>{t("list.source")}</span>
          <span />
        </div>
        {shown.length === 0 ? <p className="meta">{t("emptyOffer")}</p> : null}
        {shown.map((c, i) => {
          const stage = stageOf.get(c.stageId);
          const colour = SCOL[stage?.kind ?? "new"] ?? SCOL.new!;
          const k = clsOf(c.score);
          return (
            <div key={c.id} className="clr" style={{ animationDelay: `${i * 30}ms` }}>
              <Link
                className="row"
                style={{ gap: 10, minWidth: 0 }}
                href={`/app/hire/candidats/${c.id}`}
              >
                <span className={`av ${avatarColor(c.name)}`} aria-hidden="true">
                  {initialsOf(c.name)}
                </span>
                <span style={{ minWidth: 0 }}>
                  <b className="tr" style={{ display: "block" }}>
                    {c.name}
                  </b>
                  {c.role ? <span className="meta tr">{c.role}</span> : null}
                </span>
              </Link>
              <span className="row" style={{ gap: 10 }}>
                <b className="num" style={{ fontSize: 18, width: 44 }}>
                  {c.scored ? t("score", { value: c.score }) : "–"}
                </b>
                <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <Gauge score={c.score} />
                  <span className={`cm ${k}`}>
                    {k === "fort" ? <HireIcon name="spark2" size="s" /> : null}
                    {t(`cls.${k}`)}
                  </span>
                </span>
              </span>
              <span>
                <span
                  className="stp"
                  style={{ "--c": colour[0], "--b": colour[1] } as React.CSSProperties}
                >
                  <i />
                  {stage?.name ?? ""}
                </span>
              </span>
              <span>
                <span className="meta">{t("toTest")}</span>
              </span>
              <span className="meta">{t(`source.${c.source}`)}</span>
              <span className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                <Link
                  className="round"
                  href={`/app/hire/candidats/${c.id}/message`}
                  aria-label={t("list.write", { name: c.name })}
                >
                  <HireIcon name="chat" size="s" />
                </Link>
                <Link
                  className="round"
                  href={`/app/hire/candidats/${c.id}`}
                  aria-label={t("list.open", { name: c.name })}
                >
                  <HireIcon name="right" size="s" />
                </Link>
              </span>
            </div>
          );
        })}
      </div>
    );
  } else if (tab === "comparer") {
    const three = all.filter((c) => c.scored && c.criteria.length).slice(0, 3);
    if (three.length < 2) body = <p className="meta">{t("cmp.need")}</p>;
    else {
      const keys = three[0]!.criteria.map((c) => c.key);
      const axes = keys.map((key) => t(`criterion.${key}`));
      const values = three.map((c) =>
        keys.map((key) => c.criteria.find((x) => x.key === key)?.value ?? 0),
      );
      const series = [
        { v: keys.map(() => 75), stroke: "#0E1B17", dash: true, w: 2 },
        ...three
          .map((_, i) => ({
            v: values[i]!,
            stroke: CMP[i]!,
            fill: CMP_FILL[i],
            w: i === 0 ? 2.5 : 2,
          }))
          .reverse(),
      ];
      body = (
        <>
          <div className="cmpc">
            {three.map((c, i) => (
              <div key={c.id} className="cmp-h" style={{ "--c": CMP[i] } as React.CSSProperties}>
                <span className={`av ${avatarColor(c.name)}`} aria-hidden="true">
                  {initialsOf(c.name)}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <b className="tr" style={{ display: "block" }}>
                    {c.name}
                  </b>
                  {c.role ? <span className="meta">{c.role}</span> : null}
                </div>
                <div style={{ textAlign: "right" }}>
                  <b className="num" style={{ fontSize: 22 }}>
                    {t("score", { value: c.score })}
                  </b>
                  <Gauge score={c.score} />
                </div>
              </div>
            ))}
          </div>
          <div className="cmpg">
            <div className="card">
              <div className="ch">
                <span className="chip-ic">
                  <HireIcon name="orbi" size="s" />
                </span>
                <h3>{t("cmp.title")}</h3>
                <div className="r" />
              </div>
              <div dangerouslySetInnerHTML={{ __html: radarSvg(axes, series, 330) }} />
              <div className="legend" style={{ justifyContent: "center", marginTop: 6 }}>
                <span>
                  <i style={{ background: "transparent", border: "2px dashed #0E1B17" }} />
                  {t("cmp.expected")}
                </span>
                {three.map((c, i) => (
                  <span key={c.id}>
                    <i style={{ background: CMP[i] }} />
                    {c.name.split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="ch">
                <span className="chip-ic">
                  <HireIcon name="chart" size="s" />
                </span>
                <h3>{t("cmp.byCriterion")}</h3>
              </div>
              <div className="stack" style={{ gap: 12 }}>
                {keys.map((key, i) => {
                  const best = Math.max(...values.map((v) => v[i]!));
                  return (
                    <div key={key} className="cmp-r">
                      <b>{axes[i]}</b>
                      <div className="stack" style={{ gap: 4 }}>
                        {values.map((v, j) => (
                          <div key={j} className="row" style={{ gap: 8 }}>
                            <span className="mbar" style={{ flex: 1, margin: 0, height: 7 }}>
                              <i
                                style={{
                                  width: `${v[i]}%`,
                                  background: CMP[j],
                                  opacity: v[i] === best ? 1 : 0.45,
                                }}
                              />
                            </span>
                            <b
                              className="num"
                              style={{
                                width: 26,
                                fontSize: 12.5,
                                ...(v[i] === best ? {} : { color: "var(--muted)" }),
                              }}
                            >
                              {v[i]}
                            </b>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                className="row"
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 16,
                  background: "var(--limebg)",
                }}
              >
                <span className="chip-ic" style={{ background: "var(--lime)" }}>
                  <HireIcon name="orbi" size="s" />
                </span>
                <span style={{ flex: 1, fontSize: 13 }}>
                  {t("cmp.best", { name: three[0]!.name.split(" ")[0]! })}
                </span>
                <Link className="btn sm dark" href={`/app/hire/candidats/${three[0]!.id}`}>
                  {t("cmp.see", { name: three[0]!.name.split(" ")[0]! })}
                </Link>
              </div>
            </div>
          </div>
        </>
      );
    }
  } else {
    const columns: KanbanColumn[] = data.stages.map((s) => ({
      id: s.id,
      name: s.name,
      kind: s.kind,
      colour: SCOL[s.kind] ?? SCOL.new!,
    }));
    body = (
      <NextIntlClientProvider messages={pickMessages(await getMessages(), ["hireV3Candidates"])}>
        <HireKanban
          key={job.id}
          columns={columns}
          cards={shown.map((c) => ({
            id: c.id,
            name: c.name,
            role: c.role,
            score: c.score,
            scored: c.scored,
            skill: c.skill,
            stageId: c.stageId,
          }))}
          canMove={canMove}
        />
      </NextIntlClientProvider>
    );
  }

  return (
    <HirePage view="candidats">
      {hero}
      {chips}
      {body}
    </HirePage>
  );
}
