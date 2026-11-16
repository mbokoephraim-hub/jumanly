import { loose } from "@/lib/loose-t";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { hv3ToggleFavoriteAction } from "@/server/actions/hire-v3-vivier";
import type { VivierTab, VivierV3 } from "@/server/services/hire-v3-vivier";
import { avatarColor, initialsOf } from "./avatar";
import { donutSvg } from "./charts";
import { HireIcon, type HireIconName } from "./icon";
import { HireDownloadButton, HirePage } from "./page-head";
import { HireTabs } from "./tabs";
import { VivierFilter } from "./vivier-filter";

/** The colour and cover of a pool (`VDOM` of the prototype), by its place in the list. */
const POOL_LOOK: [string, string][] = [
  ["#3FAE3A", "linear-gradient(135deg,#C9F59E,#EFFBE2)"],
  ["#D9A514", "linear-gradient(135deg,#FFE7A3,#FFF7DD)"],
  ["#F2994A", "linear-gradient(135deg,#FFD3B0,#FFF1E4)"],
  ["#4C8DF6", "linear-gradient(135deg,#BFD9FF,#EEF5FF)"],
  ["#8B6CF0", "linear-gradient(135deg,#DCCFFF,#F4F0FF)"],
];
const PAGE = "/app/hire/viviers";
const look = (index: number) => POOL_LOOK[index % POOL_LOOK.length]!;
const cls = (score: number) => (score >= 75 ? "fort" : score >= 50 ? "cons" : "lim");
const CLS_COLOUR = { fort: "#2FA25A", cons: "#D9901A", lim: "#8C9AB8" };
const RING_C = 2 * Math.PI * 20;

/** The score ring of a card (`vRing()` of the prototype). */
function VRing({ score, title }: { score: number; title: string }) {
  return (
    <span className="vring" title={title}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill="none" stroke="#EEF1E8" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke={CLS_COLOUR[cls(score)]}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(RING_C * score) / 100} ${RING_C}`}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <b>{score}</b>
    </span>
  );
}

/**
 * Vivier (`V.vivier` of the prototype v3): Orbi's three talents closest to the newest offer, the
 * pools as a donut (a click filters), the bar (Télécharger, Tous · Favoris · Relancés, search,
 * Ajouter un talent), the criteria, then one card per talent. The criteria and the search filter
 * the cards in the page (`vApply()` of the prototype, in `VivierFilter`); the tabs are addresses.
 * « Inviter » and the talent's page go through the existing screens, where every view is journaled.
 */
export async function HireV3Vivier({
  data,
  tab,
  q,
  canManage,
}: {
  data: VivierV3;
  tab: VivierTab;
  q: string;
  canManage: boolean;
}) {
  const t = await getTranslations("hireV3Vivier");
  const tp = await getTranslations("hireV3.page");
  const format = await getFormatter();
  const tk = loose(t);
  const href = (key: string) => (key === "tous" ? PAGE : `${PAGE}?onglet=${key}`);
  const list = data.talents.filter(
    (talent) =>
      (tab !== "favoris" || talent.favorite) && (tab !== "relances" || talent.relanceDays !== null),
  );
  const tabs = [
    { key: "tous", count: data.talents.length },
    { key: "favoris", count: data.favorites },
    { key: "relances", count: data.relances },
  ].map((item) => ({
    label: tk(`tabs.${item.key}`),
    count: item.count,
    href: href(item.key),
    active: tab === item.key,
  }));
  const max = Math.max(1, ...data.pools.map((p) => p.count));
  const profileHref = (talent: VivierV3["talents"][number]) =>
    talent.applicationId
      ? `/app/hire/candidats/${talent.applicationId}`
      : `/app/hire/talents/${talent.profileId}`;
  const month = (date: Date) => {
    const text = format.dateTime(date, { month: "long", year: "numeric" });
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  const criteria: { key: string; icon: HireIconName; options: [string, string][] }[] = [
    { key: "comp", icon: "layers", options: data.skills.map((name) => [name, name]) },
    { key: "dom", icon: "briefcase", options: data.pools.map((p) => [p.id, p.name]) },
    { key: "ville", icon: "pin", options: data.cities.map((city) => [city, city]) },
    {
      key: "dispo",
      icon: "zap",
      options: [
        ["oui", t("crit.dispoYes")],
        ["non", t("crit.dispoNo")],
      ],
    },
    ...(data.offer
      ? [
          {
            key: "sc",
            icon: "target" as const,
            options: ["80", "70", "60"].map(
              (v) => [v, t("crit.scMin", { value: v })] as [string, string],
            ),
          },
        ]
      : []),
    {
      key: "acc",
      icon: "shield",
      options: [
        ["soon", t("crit.accSoon")],
        ["ok", t("crit.accOk")],
      ],
    },
  ];
  return (
    <HirePage view="vivier">
      <VivierFilter />
      <div className="vhero">
        <div className="vh-l">
          <span className="vh-k">
            <HireIcon name="orbi" size="s" />
            {t("hero.kicker")}
          </span>
          {data.offer && data.top.length > 0 ? (
            <>
              <h1>
                {t.rich("hero.title", {
                  count: data.top.length,
                  em: (chunks) => <em>{chunks}</em>,
                  offer: data.offer.title,
                })}
              </h1>
              <p>{t("hero.text")}</p>
              <div className="vh-p">
                {data.top.map((talent) => (
                  <div className="vh-t" key={talent.profileId}>
                    <span
                      className={`av ${avatarColor(talent.name ?? talent.profileId)}`}
                      aria-hidden="true"
                    >
                      {talent.name ? initialsOf(talent.name) : t("anon")}
                    </span>
                    <span>
                      <b>{talent.name ? talent.name.split(" ")[0] : t("anonymous")}</b>
                      <span className="meta">{talent.headline ?? talent.pool}</span>
                    </span>
                    <em className={`cm ${cls(talent.score ?? 0)}`}>
                      {t("percent", { value: talent.score ?? 0 })}
                    </em>
                  </div>
                ))}
              </div>
              <div className="row" style={{ gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {canManage && data.bestPoolId ? (
                  <Link
                    className="btn pri"
                    href={`/app/hire/viviers/${data.bestPoolId}?offre=${data.offer.id}`}
                  >
                    <HireIcon name="send" size="s" />
                    {t("hero.invite", { count: data.top.length })}
                  </Link>
                ) : null}
                <button type="button" className="btn ghost sm" popoverTarget="vh-why">
                  {t("hero.whyButton")}
                </button>
                <div id="vh-why" className="vh-why" popover="auto">
                  <HireIcon name="orbi" size="s" />
                  {t("hero.why")}
                </div>
              </div>
            </>
          ) : (
            <>
              <h1>{data.offer ? t("hero.noneTitle") : t("hero.noOfferTitle")}</h1>
              <p>{data.offer ? t("hero.none", { offer: data.offer.title }) : t("hero.noOffer")}</p>
            </>
          )}
        </div>
        <div className="vh-r">
          <div className="vpool">
            <div className="vp-h">
              <span className="chip-ic">
                <HireIcon name="users" size="s" />
              </span>
              <div>
                <h3>{t("pool.title")}</h3>
                <span className="meta">{t("pool.sub")}</span>
              </div>
              <span className="vp-ok">
                <HireIcon name="shield" size="s" />
                {t("pool.consent")}
              </span>
            </div>
            <div className="vp-b">
              <div
                className="vdon"
                dangerouslySetInnerHTML={{
                  __html: donutSvg(
                    data.pools.map(
                      (p) => [p.count, look(p.index)[0], p.id] as [number, string, string],
                    ),
                    120,
                    String(data.talents.length),
                    t("pool.talents"),
                    14,
                  ),
                }}
              />
              <div className="vp-l">
                {data.pools.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className="vp-r"
                    data-vcv={`dom:${p.id}`}
                    style={{ "--c": look(p.index)[0] } as React.CSSProperties}
                  >
                    <i />
                    <span>{p.name}</span>
                    <span className="vp-bar">
                      <b style={{ width: `${(p.count / max) * 100}%` }} />
                    </span>
                    <b>{p.count}</b>
                    <em>
                      <HireIcon name="chev" size="s" />
                    </em>
                  </button>
                ))}
              </div>
            </div>
            <div className="vp-s">
              <Link className="vp-t" href={href("favoris")} scroll={false}>
                <HireIcon name="heart" size="s" />
                <b>{data.favorites}</b>
                <span>{t("pool.favorites")}</span>
                <em>
                  <HireIcon name="chev" size="s" />
                </em>
              </Link>
              <Link className="vp-t" href={href("relances")} scroll={false}>
                <HireIcon name="refresh" size="s" />
                <b>{data.relances}</b>
                <span>{t("pool.relances")}</span>
                <em>
                  <HireIcon name="chev" size="s" />
                </em>
              </Link>
              <button type="button" className="vp-t warn" data-vcv="acc:soon">
                <HireIcon name="clock" size="s" />
                <b>{data.renew}</b>
                <span>{t("pool.renew")}</span>
                <em>
                  <HireIcon name="chev" size="s" />
                </em>
              </button>
            </div>
          </div>
        </div>
      </div>
      <form className="ph vph" action={PAGE}>
        <div className="act">
          <HireDownloadButton
            href="/app/hire/telecharger?doc=talents&retour=%2Fapp%2Fhire%2Fviviers"
            label={tp("download")}
          />
          <HireTabs tabs={tabs} />
        </div>
        {tab !== "tous" ? <input type="hidden" name="onglet" value={tab} /> : null}
        <label className="vsearch">
          <HireIcon name="search" size="s" />
          <input
            id="vsq"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={t("search")}
            aria-label={t("search")}
            autoComplete="off"
          />
        </label>
        <Link className="btn ghost sm vadd" href="/app/hire/talents">
          <HireIcon name="plus" size="s" />
          {t("add")}
        </Link>
      </form>
      <div className="vcrit">
        <div className="vct-row">
          {criteria.map((c, i) => (
            <button type="button" key={c.key} className={i ? "vct" : "vct on"} data-vct={c.key}>
              <HireIcon name={c.icon} size="s" />
              {tk(`crit.${c.key}`)}
              <em className="vcn" data-vcn={c.key} hidden />
            </button>
          ))}
          <span className="vres">
            <b data-vcount="">{list.length}</b>
            <span
              data-vcount-label=""
              data-one={t("count", { count: 1 })}
              data-other={t("count", { count: 2 })}
            >
              {" "}
              {t("count", { count: list.length })}
            </span>
          </span>
          <button type="button" className="vclr" data-vclr="">
            <HireIcon name="x" size="s" />
            {t("clear")}
          </button>
        </div>
        {criteria.map((c, i) => (
          <div key={c.key} className={i ? "vcp" : "vcp on"} data-vcp={c.key}>
            {c.options.length ? (
              c.options.map(([value, label]) => (
                <button type="button" key={value} className="vco" data-vcv={`${c.key}:${value}`}>
                  {label}
                </button>
              ))
            ) : (
              <span className="meta">{t("crit.none")}</span>
            )}
          </div>
        ))}
      </div>
      <div className="vgrid">
        {list.map((talent, n) => {
          const [colour, cover] = look(talent.poolIndex);
          const name = talent.name ?? t("anonymous");
          const line = [talent.headline, talent.city].filter(Boolean).join(" · ");
          return (
            <article
              className="vc"
              key={talent.profileId}
              data-q={[
                talent.name ?? "",
                talent.headline ?? "",
                talent.city ?? "",
                talent.pool,
                ...talent.skills.map((s) => s.name),
              ]
                .join(" ")
                .toLowerCase()}
              data-comp={talent.skills.map((s) => s.name).join("|")}
              data-dom={talent.poolId}
              data-ville={talent.city ?? ""}
              data-dispo={talent.available ? "oui" : "non"}
              data-sc={talent.score ?? 0}
              data-acc={talent.renewSoon ? "soon" : "ok"}
              style={
                {
                  "--g": cover,
                  "--c": colour,
                  animationDelay: `${n * 40}ms`,
                } as React.CSSProperties
              }
            >
              <div className="vc-cov">
                <span className="vc-dom">{talent.pool}</span>
                <form action={hv3ToggleFavoriteAction}>
                  <input type="hidden" name="profile" value={talent.profileId} />
                  {tab !== "tous" ? <input type="hidden" name="onglet" value={tab} /> : null}
                  <button
                    type="submit"
                    className={talent.favorite ? "vfav on" : "vfav"}
                    aria-pressed={talent.favorite}
                    aria-label={talent.favorite ? t("favoriteRemove") : t("favoriteAdd")}
                  >
                    <HireIcon name="heart" size="s" />
                  </button>
                </form>
              </div>
              <div className="vc-id">
                <span
                  className={`av ${avatarColor(talent.name ?? talent.profileId)} l`}
                  aria-hidden="true"
                >
                  {talent.name ? initialsOf(talent.name) : t("anon")}
                </span>
                {talent.score !== null ? (
                  <VRing score={talent.score} title={t("ringTitle")} />
                ) : null}
              </div>
              <div>
                <b className="vc-n">{name}</b>
                {line ? (
                  <div className="muted" style={{ fontSize: 13 }}>
                    {line}
                  </div>
                ) : null}
              </div>
              {talent.skills.length > 0 ? (
                <div className="chips">
                  {talent.skills.map((skill) => (
                    <span key={skill.name} className={skill.wanted ? "tag vt" : "tag"}>
                      {skill.wanted ? <HireIcon name="check" size="s" /> : null}
                      {skill.name}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="vc-meta">
                <span className={talent.available ? "ok" : ""}>
                  <HireIcon name={talent.available ? "zap" : "clock"} size="s" />
                  {talent.available ? t("available") : t("listening")}
                </span>
                <span>
                  <HireIcon name="shield" size="s" />
                  {t("consent", { date: month(talent.consentUntil) })}
                </span>
              </div>
              {talent.relanceDays !== null ? (
                <div className="vc-rel">
                  <HireIcon name="refresh" size="s" />
                  <span className="tr">{t("relance", { days: talent.relanceDays })}</span>
                </div>
              ) : (talent.score ?? 0) >= 50 && data.offer ? (
                <div className="vc-rel ok">
                  <HireIcon name="target" size="s" />
                  <span className="tr">{t("forOffer", { offer: data.offer.title })}</span>
                </div>
              ) : (
                <div className="vc-rel gr">
                  <HireIcon name="heart" size="s" />
                  <span className="tr">{t("keep")}</span>
                </div>
              )}
              <div className="vc-act">
                {canManage ? (
                  <Link
                    className="btn sm pri"
                    href={`/app/hire/viviers/${talent.poolId}${data.offer ? `?offre=${data.offer.id}` : ""}`}
                  >
                    <HireIcon name="send" size="s" />
                    {t("invite")}
                  </Link>
                ) : null}
                {talent.conversationId ? (
                  <Link
                    className="round"
                    href={`/app/messages?c=${talent.conversationId}`}
                    aria-label={t("write", { name })}
                  >
                    <HireIcon name="chat" size="s" />
                  </Link>
                ) : null}
                <Link
                  className="round"
                  href={profileHref(talent)}
                  aria-label={t("profile", { name })}
                >
                  <HireIcon name="users" size="s" />
                </Link>
              </div>
            </article>
          );
        })}
        <div className="vempty" hidden={list.length > 0}>
          <HireIcon name="search" />
          {list.length === 0 && tab !== "tous" ? (
            <>
              <b>{tk(`emptyTab.${tab}`)}</b>
              <span className="meta">{tk(`emptyTab.${tab}Text`)}</span>
            </>
          ) : data.talents.length ? (
            <>
              <b>{t("empty.title")}</b>
              <span className="meta">{t("empty.text")}</span>
              <button type="button" className="chip" data-vclr="">
                {t("clear")}
              </button>
            </>
          ) : (
            <>
              <b>{t("empty.none")}</b>
              <span className="meta">{t("empty.noneText")}</span>
            </>
          )}
        </div>
      </div>
      <p className="meta vnote">
        <HireIcon name="shield" size="s" />
        {t("note")}
      </p>
    </HirePage>
  );
}
