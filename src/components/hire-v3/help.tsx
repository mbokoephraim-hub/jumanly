import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HireIcon, type HireIconName } from "./icon";
import { HirePage, HirePageHead } from "./page-head";

/** Categories of the help (`HCAT` of the prototype v3), only those the app offers today. */
const CATS: [string, HireIconName, string, string][] = [
  ["offers", "offres", "#2FA25A", "#E6F6E0"],
  ["orbi", "users", "#8B6CF0", "#EFEAFE"],
  ["agenda", "cal", "#F2994A", "#FEEFE2"],
  ["plan", "card", "#0F3F37", "#E3ECE8"],
];
const FAQ: [string, string][] = [
  ["q1", "orbi"],
  ["q2", "orbi"],
  ["q3", "offers"],
  ["q4", "offers"],
  ["q5", "agenda"],
  ["q6", "plan"],
];
const GUIDES: [string, HireIconName, number, string][] = [
  ["g1", "offres", 0, "/app/hire/offres/nouvelle"],
  ["g2", "users", 1, "/app/hire/candidats"],
  ["g3", "cal", 2, "/app/hire/entretiens"],
  ["g4", "team", 1, "/app/hire/compte/equipe"],
  ["g5", "chart", 0, "/app/hire/rapports"],
  ["g6", "card", 3, "/app/hire/compte/formule"],
];
const MAIL = "assistant@jumanly.io";

/**
 * « Aide » (`V.aide` of the prototype v3): the help centre (search, categories, questions, first
 * steps), the guides, and « Nous écrire » by e-mail only (golden rule n° 8: no phone number).
 * The search is a plain GET: the questions that match stay, opened.
 */
export async function HireV3Help({
  tab,
  q,
  firstName,
  steps,
}: {
  tab: "centre" | "guides" | "ecrire";
  q: string;
  firstName: string;
  steps: { key: string; done: boolean; href: string }[];
}) {
  const t = await getTranslations("hireV3Help");
  const tabs = (["centre", "guides", "ecrire"] as const).map((k) => ({
    label: t(`tabs.${k}`),
    href: k === "centre" ? "/app/hire/compte/aide" : `/app/hire/compte/aide?onglet=${k}`,
    active: tab === k,
  }));
  const mail = (
    <div className="tsbox hpmail">
      <div className="tsh">
        <h3>{t("mail.title")}</h3>
      </div>
      <span className="hpm-i">
        <HireIcon name="mail" size="s" />
      </span>
      <b>{MAIL}</b>
      <span className="meta">{t("mail.text")}</span>
      <a className="btn sm dark" href={`mailto:${MAIL}`}>
        <HireIcon name="send" size="s" />
        {t("mail.button")}
      </a>
      <p className="hpno">
        <HireIcon name="shield" size="s" />
        {t("mail.noPhone")}
      </p>
    </div>
  );
  if (tab === "guides")
    return (
      <HirePage view="aide">
        <HirePageHead title={t("tabs.guides")} sub={t("sub")} tabs={tabs} />
        <div className="hpgw">
          {GUIDES.map(([key, icon, cat, href], i) => (
            <Link
              key={key}
              className="hpg"
              href={href}
              style={{ "--c": CATS[cat]![2], "--b": CATS[cat]![3] } as React.CSSProperties}
            >
              <span className="hpg-c">
                <span className="hpg-n">{t("guideN", { n: String(i + 1).padStart(2, "0") })}</span>
                <span className="hpg-i">
                  <HireIcon name={icon} size="s" />
                </span>
              </span>
              <b>{t(`guides.${key}.title`)}</b>
              <span className="meta">{t(`guides.${key}.sub`)}</span>
              <span className="hpg-f">
                <HireIcon name="play" size="s" />
                {t("guideGo")}
                <em>
                  <HireIcon name="right" size="s" />
                </em>
              </span>
            </Link>
          ))}
        </div>
      </HirePage>
    );
  if (tab === "ecrire")
    return (
      <HirePage view="aide">
        <HirePageHead title={t("tabs.ecrire")} sub={t("sub")} tabs={tabs} />
        <div className="tsgrid">
          <div className="tsbox">
            <div className="tsh">
              <h3>{t("write.title")}</h3>
              <span className="meta">{t("write.sub")}</span>
            </div>
            <div
              className="hpsub"
              style={{ padding: 14, display: "flex", flexWrap: "wrap", gap: 8 }}
            >
              {CATS.map(([key, , colour]) => (
                <a
                  key={key}
                  className="hpchip"
                  style={{ "--c": colour } as React.CSSProperties}
                  href={`mailto:${MAIL}?subject=${encodeURIComponent(t(`cats.${key}`))}`}
                >
                  <i />
                  {t(`cats.${key}`)}
                </a>
              ))}
            </div>
            <p className="meta" style={{ padding: "0 14px 14px" }}>
              {t("write.text")}
            </p>
          </div>
          <div className="tsside">{mail}</div>
        </div>
      </HirePage>
    );
  const needle = q.trim().toLowerCase();
  const faq = FAQ.filter(
    ([key]) =>
      !needle || `${t(`faq.${key}.q`)} ${t(`faq.${key}.a`)}`.toLowerCase().includes(needle),
  );
  const done = steps.filter((s) => s.done).length;
  return (
    <HirePage view="aide">
      <div className="ph hphero">
        <div className="act hpact">
          {tabs.map((tb) => (
            <Link key={tb.href} className={tb.active ? "chip on" : "chip"} href={tb.href}>
              {tb.label}
            </Link>
          ))}
        </div>
        <div className="hph-t">
          <span className="vh-k">
            <HireIcon name="help" size="s" />
            {t("tabs.centre")}
          </span>
          <h1>{t("hero", { name: firstName })}</h1>
          <form className="hps" action="/app/hire/compte/aide">
            <HireIcon name="search" size="s" />
            <input
              name="q"
              defaultValue={q}
              placeholder={t("search")}
              aria-label={t("searchLabel")}
            />
          </form>
          <div className="hppop">
            <span>{t("popular")}</span>
            {(["refus", "partager", "places"] as const).map((k) => (
              <Link key={k} href={`/app/hire/compte/aide?q=${encodeURIComponent(t(`pop.${k}.q`))}`}>
                {t(`pop.${k}.label`)}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="hpcats">
        {CATS.map(([key, icon, c, b]) => (
          <Link
            key={key}
            className="hpc"
            style={{ "--c": c, "--b": b } as React.CSSProperties}
            href={`/app/hire/compte/aide?q=${encodeURIComponent(t(`cats.${key}Q`))}`}
          >
            <span className="hpc-i">
              <HireIcon name={icon} size="s" />
            </span>
            <b>{t(`cats.${key}`)}</b>
            <span className="meta">
              {t("answers", { count: FAQ.filter((f) => f[1] === key).length })}
            </span>
          </Link>
        ))}
      </div>
      <div className="tsgrid">
        <div className="tsbox">
          <div className="tsh">
            <h3>{t("faqTitle")}</h3>
            <span className="meta">{t("answers", { count: faq.length })}</span>
          </div>
          <div>
            {faq.map(([key, cat], i) => {
              const c = CATS.find((x) => x[0] === cat)!;
              return (
                <details
                  key={key}
                  className="hpq"
                  open={i === 0 || !!needle}
                  style={{ "--c": c[2] } as React.CSSProperties}
                >
                  <summary>
                    <i />
                    <span>{t(`faq.${key}.q`)}</span>
                    <em>{t(`cats.${cat}`)}</em>
                    <HireIcon name="down" size="s" />
                  </summary>
                  <p>{t(`faq.${key}.a`)}</p>
                  <div className="hpqf">
                    <span className="meta">{t("helpful")}</span>
                    <Link className="chip" href="/app/hire/compte/aide?onglet=ecrire">
                      {t("notHelpful")}
                    </Link>
                  </div>
                </details>
              );
            })}
          </div>
          {faq.length === 0 ? (
            <div className="hpempty" style={{ display: "flex" }}>
              <HireIcon name="search" size="s" />
              <b>{t("empty")}</b>
              <Link className="btn sm ghost" href="/app/hire/compte/aide?onglet=ecrire">
                {t("mail.button")}
              </Link>
            </div>
          ) : null}
        </div>
        <div className="tsside">
          <div className="tsbox">
            <div className="tsh">
              <h3>{t("steps.title")}</h3>
              <span className="meta">{t("steps.count", { done, total: steps.length })}</span>
            </div>
            <div className="hpbar">
              <i style={{ width: `${(done / Math.max(1, steps.length)) * 100}%` }} />
            </div>
            {steps.map((s) => (
              <Link key={s.key} className={s.done ? "hpst ok" : "hpst"} href={s.href}>
                <span className="hpck">{s.done ? <HireIcon name="check" size="s" /> : null}</span>
                <span>{t(`steps.${s.key}`)}</span>
                {s.done ? null : <HireIcon name="right" size="s" />}
              </Link>
            ))}
          </div>
          {mail}
        </div>
      </div>
    </HirePage>
  );
}
