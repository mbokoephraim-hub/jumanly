import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { VivierTab, VivierV3 } from "@/server/services/hire-v3-vivier";
import { avatarColor, initialsOf } from "./avatar";
import { donutSvg, ringHtml } from "./charts";
import { HireIcon } from "./icon";
import { HirePage, HirePageHead } from "./page-head";

/** The colour and cover of a pool (`VDOM` of the prototype), by its place in the list. */
const POOL_LOOK: [string, string][] = [
  ["#3FAE3A", "linear-gradient(135deg,#C9F59E,#EFFBE2)"],
  ["#D9A514", "linear-gradient(135deg,#FFE7A3,#FFF7DD)"],
  ["#F2994A", "linear-gradient(135deg,#FFD3B0,#FFF1E4)"],
  ["#4C8DF6", "linear-gradient(135deg,#BFD9FF,#EEF5FF)"],
  ["#8B6CF0", "linear-gradient(135deg,#DCCFFF,#F4F0FF)"],
];
const look = (index: number) => POOL_LOOK[index % POOL_LOOK.length]!;
const cls = (score: number) => (score >= 75 ? "fort" : score >= 50 ? "cons" : "lim");

/**
 * Vivier (`V.vivier` of the prototype v3): Orbi's three talents closest to the newest offer, the
 * pools as a donut (a click filters), the search, then one card per talent. « Inviter » and the
 * talent's page go through the existing screens, where every view is journaled.
 */
export async function HireV3Vivier({
  data,
  tab,
  q,
  pool,
  canManage,
}: {
  data: VivierV3;
  tab: VivierTab;
  q: string;
  pool: string;
  canManage: boolean;
}) {
  const t = await getTranslations("hireV3Vivier");
  const base = (over: Record<string, string>) => {
    const params = new URLSearchParams({
      onglet: tab,
      ...(q ? { q } : {}),
      ...(pool ? { vivier: pool } : {}),
      ...over,
    });
    for (const [key, value] of [...params])
      if (!value || (key === "onglet" && value === "tous")) params.delete(key);
    const s = params.toString();
    return `/app/hire/viviers${s ? `?${s}` : ""}`;
  };
  const needle = q.trim().toLowerCase();
  const list = data.talents.filter(
    (talent) =>
      (tab !== "disponibles" || talent.available) &&
      (tab !== "proches" || (talent.score ?? 0) >= 50) &&
      (!pool || talent.poolId === pool) &&
      (!needle ||
        [talent.name ?? "", talent.headline ?? "", talent.pool, ...talent.skills.map((s) => s.name)]
          .join(" ")
          .toLowerCase()
          .includes(needle)),
  );
  const tabs = [
    { key: "tous", count: data.talents.length },
    { key: "disponibles", count: data.available },
    { key: "proches", count: data.close.length },
  ].map((item) => ({
    label: t(`tabs.${item.key}`, { count: item.count }),
    href: base({ onglet: item.key }),
    active: tab === item.key,
  }));
  const max = Math.max(1, ...data.pools.map((p) => p.count));
  const profileHref = (talent: VivierV3["talents"][number]) =>
    talent.applicationId
      ? `/app/hire/candidats/${talent.applicationId}`
      : `/app/hire/talents/${talent.profileId}`;
  return (
    <HirePage view="vivier">
      <HirePageHead title={t("title")} sub={t("sub")} tabs={tabs} />
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
                    {t("hero.invite")}
                  </Link>
                ) : null}
                <span className="meta">{t("hero.why")}</span>
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
                    data.pools.map((p) => [p.count, look(p.index)[0]] as [number, string]),
                    120,
                    String(data.talents.length),
                    t("pool.talents"),
                    14,
                  ),
                }}
              />
              <div className="vp-l">
                {data.pools.map((p) => (
                  <Link
                    key={p.id}
                    className={pool === p.id ? "vp-r on" : "vp-r"}
                    href={base({ vivier: pool === p.id ? "" : p.id })}
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
                  </Link>
                ))}
              </div>
            </div>
            <div className="vp-s">
              <Link className="vp-t" href={base({ onglet: "disponibles" })}>
                <HireIcon name="zap" size="s" />
                <b>{data.available}</b>
                <span>{t("pool.available")}</span>
                <em>
                  <HireIcon name="chev" size="s" />
                </em>
              </Link>
              <Link className="vp-t" href={base({ onglet: "proches" })}>
                <HireIcon name="target" size="s" />
                <b>{data.close.length}</b>
                <span>{t("pool.close")}</span>
                <em>
                  <HireIcon name="chev" size="s" />
                </em>
              </Link>
              <Link className="vp-t" href="/app/hire/talents">
                <HireIcon name="search" size="s" />
                <b>{data.pools.length}</b>
                <span>{t("pool.pools")}</span>
                <em>
                  <HireIcon name="chev" size="s" />
                </em>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <form className="ph vph" action="/app/hire/viviers">
        <div className="act" />
        {tab !== "tous" ? <input type="hidden" name="onglet" value={tab} /> : null}
        {pool ? <input type="hidden" name="vivier" value={pool} /> : null}
        <label className="vsearch">
          <HireIcon name="search" size="s" />
          <input
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
          <span className="vres">
            <b>{list.length}</b>
            <span>{t("count", { count: list.length })}</span>
          </span>
          {q || pool ? (
            <Link className="vclr" href={base({ q: "", vivier: "" })}>
              <HireIcon name="x" size="s" />
              {t("clear")}
            </Link>
          ) : null}
        </div>
      </div>
      <div className="vgrid">
        {list.map((talent, n) => {
          const [colour, cover] = look(talent.poolIndex);
          const name = talent.name ?? t("anonymous");
          return (
            <article
              className="vc"
              key={talent.profileId}
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
              </div>
              <div className="vc-id">
                <span
                  className={`av ${avatarColor(talent.name ?? talent.profileId)} l`}
                  aria-hidden="true"
                >
                  {talent.name ? initialsOf(talent.name) : t("anon")}
                </span>
                {talent.score !== null ? (
                  <span
                    className="vring"
                    title={t("ringTitle")}
                    dangerouslySetInnerHTML={{ __html: ringHtml(talent.score, 48, 5) }}
                  />
                ) : null}
              </div>
              <div>
                <b className="vc-n">{name}</b>
                {talent.headline ? (
                  <div className="muted" style={{ fontSize: 13 }}>
                    {talent.headline}
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
                  {talent.applicationId ? t("applied") : t("visible")}
                </span>
              </div>
              {(talent.score ?? 0) >= 50 && data.offer ? (
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
        {list.length === 0 ? (
          <div className="vempty">
            <HireIcon name="search" />
            <b>{data.talents.length ? t("empty.title") : t("empty.none")}</b>
            <span className="meta">
              {data.talents.length ? t("empty.text") : t("empty.noneText")}
            </span>
            {data.talents.length ? (
              <Link className="chip" href={base({ q: "", vivier: "", onglet: "tous" })}>
                {t("clear")}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className="meta vnote">
        <HireIcon name="shield" size="s" />
        {t("note")}
      </p>
    </HirePage>
  );
}
