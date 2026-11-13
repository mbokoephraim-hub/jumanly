import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { laterDecisionAction, moveCandidateAction } from "@/server/actions/hire-candidates";
import { sentAttachments } from "@/server/services/application-attachments";
import { screeningAnswersOf } from "@/server/services/screening";
import type { CandidateV3 } from "@/server/services/hire-v3-candidates";
import { avatarColor, initialsOf } from "./avatar";
import { arcSvg, radarSvg } from "./charts";
import { HireIcon, type HireIconName } from "./icon";
import { clsOf } from "./kanban";
import { HirePage } from "./page-head";
import { HireTabs } from "./tabs";

export const CANDIDATE_FILE_TABS = ["resume", "parcours", "test", "documents"] as const;
export type CandidateFileTab = (typeof CANDIDATE_FILE_TABS)[number];

const CLS_COLOUR = { fort: "#2FA25A", cons: "#D9901A", lim: "#8C9AB8" } as const;
const SCOL: Record<string, string> = {
  new: "#4C8DF6",
  screening: "#8B6CF0",
  test: "#D9A514",
  interview: "#F2994A",
  offer: "#3FAE3A",
  hired: "#3FAE3A",
};

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

/** La fiche d'un candidat (`V.candidat` of the prototype v3): Résumé, Parcours, Test, Documents. */
export async function HireV3Candidate({
  data,
  tab,
  canManage,
}: {
  data: CandidateV3;
  tab: CandidateFileTab;
  canManage: boolean;
}) {
  const t = await getTranslations("hireV3Candidate");
  const tc = await getTranslations("hireV3Candidates");
  const format = await getFormatter();
  const { application, explanation } = data;
  const { profile, job } = application;
  const person = profile.user;
  const firstName = person.firstName || person.name.split(/\s+/)[0]!;
  const score = explanation?.score ?? application.matchScore ?? null;
  const k = clsOf(score ?? 0);
  const base = `/app/hire/candidats/${application.id}`;
  const stages = job.stages.filter((s) => s.kind !== "rejected");
  const current = stages.findIndex((s) => s.id === application.stageId);
  const next = current >= 0 ? stages[current + 1] : undefined;
  const decided = application.stage.kind === "hired" || application.stage.kind === "rejected";
  const live = canManage && application.status === "active" && !decided;
  const tabs = CANDIDATE_FILE_TABS.map((key) => ({
    label: t(`tabs.${key}`),
    href: key === "resume" ? base : `${base}?onglet=${key}`,
    active: key === tab,
  }));
  const attachments = sentAttachments(application.attachments);
  const docCount =
    (application.cvSnapshot ? 1 : 0) + (application.coverLetter ? 1 : 0) + attachments.length;

  const hero = (
    <>
      <div className="chero">
        <div className="chero-top">
          <div className="crumbs">
            <Link href="/app/hire/candidats">
              <HireIcon name="chev" size="s" style={{ transform: "rotate(180deg)" }} />
              {t("crumb")}
            </Link>
            <span>/</span>
            <Link href={`/app/hire/candidats?offre=${job.id}`}>{job.title}</Link>
          </div>
          <div className="row" style={{ gap: 8, marginLeft: "auto" }}>
            {data.position.prev ? (
              <Link
                className="round"
                href={`/app/hire/candidats/${data.position.prev}`}
                aria-label={t("prev")}
              >
                <HireIcon name="chev" size="s" style={{ transform: "rotate(180deg)" }} />
              </Link>
            ) : null}
            <span className="meta">
              {t("position", { n: data.position.index + 1, total: data.position.total })}
            </span>
            {data.position.next ? (
              <Link
                className="round"
                href={`/app/hire/candidats/${data.position.next}`}
                aria-label={t("next")}
              >
                <HireIcon name="chev" size="s" />
              </Link>
            ) : null}
          </div>
        </div>
        <div className="chero-main">
          <div className="cav">
            <span className={`av ${avatarColor(person.name)} l`} aria-hidden="true">
              {initialsOf(person.name)}
            </span>
            <span
              className="cav-r"
              style={{ "--p": score ?? 0, "--c": CLS_COLOUR[k] } as React.CSSProperties}
            />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <h1>{person.name}</h1>
              {score !== null ? (
                <span className={`cm ${k}`}>
                  {k === "fort" ? <HireIcon name="spark2" size="s" /> : null}
                  {tc(`cls.${k}`)}
                </span>
              ) : null}
            </div>
            <div className="cmeta">
              {profile.headline ? (
                <span>
                  <HireIcon name="offres" size="s" />
                  {profile.headline}
                </span>
              ) : null}
              {person.city ? (
                <span>
                  <HireIcon name="pin" size="s" />
                  {person.city}
                </span>
              ) : null}
              <span>
                <HireIcon name="link" size="s" />
                {t("via", { source: tc(`source.${application.source}`) })}
              </span>
              <span>
                <HireIcon name="eye" size="s" />
                {t("views", { count: data.views })}
              </span>
            </div>
          </div>
          <div className="cact">
            <Link className="btn ghost" href={`${base}/message`}>
              <HireIcon name="chat" />
              {t("write")}
            </Link>
            {live ? (
              <Link className="btn dark" href={`${base}/entretien`}>
                <HireIcon name="cal" />
                {t("slot")}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="fzs">
          {stages.map((s, i) => (
            <span key={s.id} style={{ display: "contents" }}>
              {i > 0 ? <i className="fzl2" /> : null}
              <div
                className={i < current ? "fz fzk" : i === current ? "fz fzc" : "fz"}
                style={{ "--c": SCOL[s.kind] ?? SCOL.new } as React.CSSProperties}
              >
                <span className="fzd">
                  {i < current ? <HireIcon name="check" size="s" /> : i + 1}
                </span>
                <span className="fzl">{s.name}</span>
                {i === current ? <em>{t("current")}</em> : null}
              </div>
            </span>
          ))}
          {live && next ? (
            next.kind === "hired" ? (
              <Link className="btn pri sm" style={{ marginLeft: 14 }} href={`${base}/decision`}>
                {t("decide")} <HireIcon name="right" size="s" />
              </Link>
            ) : (
              <form action={moveCandidateAction} style={{ display: "contents" }}>
                <input type="hidden" name="application" value={application.id} />
                <input type="hidden" name="stage" value={next.id} />
                <input type="hidden" name="retour" value="profil" />
                <button type="submit" className="btn pri sm" style={{ marginLeft: 14 }}>
                  {t("advance")} <HireIcon name="right" size="s" />
                </button>
              </form>
            )
          ) : null}
        </div>
      </div>
      <div className="ph cph">
        <div className="row" style={{ gap: 8 }}>
          {live ? (
            <>
              <form action={laterDecisionAction} style={{ display: "contents" }}>
                <input type="hidden" name="application" value={application.id} />
                <button type="submit" className="chip">
                  <HireIcon name="clock" size="s" />
                  {t("wait")}
                </button>
              </form>
              <Link className="chip" href={`${base}/decision?issue=rejected`}>
                <HireIcon name="x" size="s" />
                {t("reject")}
              </Link>
            </>
          ) : null}
        </div>
        <div className="act">
          <HireTabs tabs={tabs} />
        </div>
      </div>
    </>
  );

  if (tab === "parcours") {
    const items = [
      ...profile.experiences.map((e) => ({
        id: e.id,
        when: `${e.startDate.getUTCFullYear()} · ${e.endDate ? e.endDate.getUTCFullYear() : t("present")}`,
        title: e.title,
        where: e.company,
        text: e.description,
      })),
      ...profile.educations.map((e) => ({
        id: e.id,
        when: [e.startYear, e.endYear].filter(Boolean).join(" · "),
        title: [e.degree, e.field].filter(Boolean).join(", "),
        where: e.school,
        text: "",
      })),
    ];
    return (
      <HirePage view="candidat">
        {hero}
        <div className="card">
          <Head title={t("path")} icon="book" />
          {items.length === 0 ? <p className="meta">{t("noPath")}</p> : null}
          <div className="tl">
            {items.map((e, i) => (
              <div key={e.id} className={i ? "tli" : "tli on"}>
                <span className="tld" />
                <span className="meta tly">{e.when}</span>
                <div>
                  <b>{e.title}</b>
                  <div className="muted">{e.where}</div>
                  {e.text ? <div className="meta">{e.text}</div> : null}
                </div>
              </div>
            ))}
          </div>
          {profile.skills.length ? (
            <>
              <div className="meta" style={{ marginTop: 14 }}>
                {t("declared")}
              </div>
              <div className="chips" style={{ marginTop: 8 }}>
                {profile.skills.map((s) => (
                  <span key={s.skillId} className="tag">
                    {s.skill.name}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </HirePage>
    );
  }

  if (tab === "test")
    return (
      <HirePage view="candidat">
        {hero}
        <div className="card">
          <Head title={t("test.title")} icon="tests" />
          <p className="meta">{t("test.none")}</p>
        </div>
      </HirePage>
    );

  if (tab === "documents") {
    const docs: { key: string; title: string; sub: string; href: string; bg: string }[] = [
      ...(application.cvSnapshot
        ? [
            {
              key: "cv",
              title: t("docCv"),
              sub: t("docCvSub"),
              href: `${base}/cv`,
              bg: "var(--s5)",
            },
          ]
        : []),
      ...(application.coverLetter
        ? [
            {
              key: "letter",
              title: t("docLetter"),
              sub: t("docLetterSub"),
              href: `${base}/lire`,
              bg: "var(--s2)",
            },
          ]
        : []),
      ...attachments.map((a, i) => ({
        key: `a${i}`,
        title: a.title,
        sub: a.type === "certificate" ? t("certificate") : "",
        href: a.type === "certificate" ? `/attestations/${a.code}` : `${base}/lire`,
        bg: ["var(--s1)", "var(--s3)", "var(--s4)"][i % 3]!,
      })),
    ];
    return (
      <HirePage view="candidat">
        {hero}
        <div className="card">
          <Head
            title={t("docs")}
            icon="file"
            right={
              live ? (
                <Link className="btn sm ghost" href={`${base}/message`}>
                  <HireIcon name="plus" size="s" />
                  {t("askDoc")}
                </Link>
              ) : null
            }
          />
          {docs.length === 0 ? <p className="meta">{t("noDocs")}</p> : null}
          <div className="docg">
            {docs.map((d) => (
              <Link key={d.key} className="doc" href={d.href}>
                <div className="docp" style={{ background: d.bg }}>
                  <HireIcon name="file" size="l" />
                </div>
                <b>{d.title}</b>
                <div className="row">
                  <span className="meta">{d.sub}</span>
                  <span className="pill p-ok" style={{ marginLeft: "auto" }}>
                    {t("received")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </HirePage>
    );
  }

  // Résumé.
  const criteria =
    explanation?.criteria.filter((c) => c.weight > 0 && c.status !== "not_applicable") ?? [];
  const missing = data.skills.filter((s) => s.required && s.level < s.expected).slice(0, 2);
  const answers = screeningAnswersOf(application.screeningAnswers)
    .filter((a) => a.answer)
    .slice(0, 1);
  const questions: [string, string][] = [
    [t("question.impact"), t("question.impactTag")],
    ...answers.map(
      (a) =>
        [t("question.answer", { question: a.question }), t("question.answerTag")] as [
          string,
          string,
        ],
    ),
    ...missing.map(
      (s) => [t("question.skill", { skill: s.name }), t("question.skillTag")] as [string, string],
    ),
  ].slice(0, 3);
  const languages = data.languages
    .map((l) => [l.name ?? l.code, l.level].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(", ");
  const availability =
    data.availableFrom && data.availableFrom > new Date()
      ? t("facts.from", {
          date: format.dateTime(data.availableFrom, { day: "numeric", month: "long" }),
        })
      : data.availability
        ? t(`facts.${data.availability}`)
        : "–";
  const radarSkills = data.skills.slice(0, 6);
  return (
    <HirePage view="candidat">
      {hero}
      <div className="cgrid">
        <div className="card corb">
          <div className="ch">
            <span className="chip-ic orbic">
              <HireIcon name="orbi" size="s" />
            </span>
            <h3>{t("orbi")}</h3>
          </div>
          {score === null ? (
            <p className="meta">{t("noScore")}</p>
          ) : (
            <>
              <div className="arcw">
                <span
                  style={{ display: "contents" }}
                  dangerouslySetInnerHTML={{ __html: arcSvg(score) }}
                />
                <div className="arcn">
                  <b className="num">{score}</b>
                  <span>{t("percent")}</span>
                </div>
                <span className="arcl">{tc(`cls.${k}`)}</span>
              </div>
              <div className="whyt">
                <HireIcon name="help" size="s" />
                {t("why")}
              </div>
              <div className="stack" style={{ gap: 8 }}>
                {criteria.map((c) => {
                  const plus = c.status === "met" || c.value >= 0.6;
                  return (
                    <div key={c.key} className={plus ? "wf p" : "wf m"}>
                      <span className="wfi">{plus ? "+" : "−"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <b>{tc(`criterion.${c.key}`)}</b>
                          <span className="meta">
                            {t("value", { value: Math.round(c.value * 100) })}
                          </span>
                        </div>
                        <span className="wfb">
                          <i style={{ width: `${Math.round(c.value * 100)}%` }} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          <div className="meta" style={{ marginTop: 12 }}>
            {t("orbiNote")}
          </div>
        </div>
        <div className="card">
          <Head
            title={t("skills")}
            icon="star"
            right={
              <div className="legend">
                <span>
                  <i style={{ border: "2px dashed #0E1B17", background: "transparent" }} />
                  {t("expected")}
                </span>
                <span>
                  <i style={{ background: "#7DE36B" }} />
                  {firstName}
                </span>
              </div>
            }
          />
          {radarSkills.length === 0 ? <p className="meta">{t("noSkills")}</p> : null}
          {radarSkills.length >= 3 ? (
            <div
              className="radw"
              dangerouslySetInnerHTML={{
                __html: radarSvg(
                  radarSkills.map((s) => s.name),
                  [
                    { v: radarSkills.map((s) => s.expected), stroke: "#0E1B17", dash: true },
                    {
                      v: radarSkills.map((s) => s.level),
                      stroke: "#1E9A64",
                      fill: "rgba(166,242,107,.5)",
                      w: 2.5,
                    },
                  ],
                  250,
                ),
              }}
            />
          ) : null}
          <div className="stack" style={{ gap: 8 }}>
            {data.skills.map((s) => (
              <div key={s.name} className="skr">
                <span>{s.name}</span>
                <span className="skb">
                  <i
                    style={{
                      width: `${s.level}%`,
                      background:
                        s.level >= s.expected
                          ? "linear-gradient(90deg,#A6F26B,#3DA14F)"
                          : "linear-gradient(90deg,#FFD08A,#E8A13A)",
                    }}
                  />
                  <em style={{ left: `${s.expected}%` }} />
                </span>
                <b className="num">{s.level}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="cside">
          <div className="card ctest">
            <div className="row" style={{ gap: 12 }}>
              <div className="oring" style={{ "--fg": "#1E9A64" } as React.CSSProperties}>
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <circle cx="32" cy="32" r="27" fill="#fff" />
                  <circle
                    cx="32"
                    cy="32"
                    r="24"
                    fill="none"
                    stroke="#1E9A64"
                    strokeOpacity=".12"
                    strokeWidth="5"
                  />
                </svg>
                <b className="num">–</b>
                <span>{t("test.sub")}</span>
              </div>
              <div>
                <b style={{ fontFamily: "var(--f-display)" }}>{t("test.title")}</b>
                <div className="meta">{t("test.none")}</div>
              </div>
            </div>
          </div>
          <div className="card cfacts">
            {(
              [
                [
                  "briefcase",
                  t("facts.experience"),
                  t("facts.experienceValue", { count: data.years }),
                ],
                ["cal", t("facts.available"), availability],
                ["globe", t("facts.languages"), languages || t("facts.noLanguage")],
                ["file", t("facts.documents"), t("facts.documentsValue", { count: docCount })],
              ] as [HireIconName, string, string][]
            ).map(([icon, label, value]) => (
              <div key={label} className="cf">
                <span className="chip-ic">
                  <HireIcon name={icon} size="s" />
                </span>
                <div>
                  <span className="meta">{label}</span>
                  <b>{value}</b>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card cq">
          <Head
            title={t("questions")}
            icon="chat"
            right={
              <span className="pill p-2">
                <HireIcon name="orbi" size="s" />
                {t("questionsTag")}
              </span>
            }
          />
          <div className="qg">
            {questions.map(([text, tag], i) => (
              <div key={i} className="qc">
                <span className="qn">{t("qn", { n: i + 1 })}</span>
                <span className="tag">{tag}</span>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card cteam">
          <Head
            title={t("team")}
            icon="team"
            right={
              data.average !== null ? (
                <span className="avgs">
                  <b className="num">{String(data.average).replace(".", ",")}</b>
                  <span aria-label={t("stars", { value: data.average })}>
                    {"★".repeat(Math.round(data.average))}
                  </span>
                </span>
              ) : null
            }
          />
          <div className="stack" style={{ gap: 8 }}>
            {data.reviews.length === 0 ? <p className="meta">{t("teamEmpty")}</p> : null}
            {data.reviews.map((r) => (
              <div key={r.id} className="rv">
                <div className="row" style={{ gap: 8 }}>
                  <span className={`av ${avatarColor(r.name)} xs`} aria-hidden="true">
                    {initialsOf(r.name)}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <b style={{ fontSize: 13, display: "block" }}>{r.you ? t("you") : r.name}</b>
                    <span className="meta">
                      {format.dateTime(r.at, { day: "numeric", month: "long" })}
                    </span>
                  </div>
                  {r.rating ? (
                    <span className="stars" aria-label={t("stars", { value: r.rating })}>
                      {"★".repeat(r.rating)}
                      <span>{"★".repeat(5 - r.rating)}</span>
                    </span>
                  ) : null}
                </div>
                {r.comment ? <p>{r.comment}</p> : null}
              </div>
            ))}
          </div>
          <Link
            className="btn sm dark"
            style={{ width: "100%", justifyContent: "center", marginTop: "auto" }}
            href={`${base}/evaluation`}
          >
            <HireIcon name="send" size="s" />
            {t("ask")}
          </Link>
        </div>
      </div>
    </HirePage>
  );
}
