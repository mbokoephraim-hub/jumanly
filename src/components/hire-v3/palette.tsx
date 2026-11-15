"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { openHireOrbi } from "./orbi";
import type { HirePaletteCandidate, HirePaletteOffer } from "@/server/services/hire-search";
import { avatarColor, initialsOf } from "./avatar";
import type { HireV3Link } from "./frame";
import { HireIcon, type HireIconName } from "./icon";

type Filter = "all" | "candidates" | "offers" | "pages";
type Item = {
  key: string;
  label: string;
  sub: string;
  href: string;
  group: Exclude<Filter, "all">;
  icon: HireIconName;
  colour: string;
  score?: number | null;
};

const PAGE = "#0F3F37";
const OFFER = "#4C8DF6";
const scoreColour = (score: number) =>
  score >= 75 ? "#2FA25A" : score >= 50 ? "#E8981C" : "#7484AE";

/** The rapid actions of the prototype (palette `Q`), with their colours. */
const QUICK = [
  { key: "publish", icon: "plus", c: "#2FA25A", b: "#E6F6E0", href: "/app/hire/offres/nouvelle" },
  { key: "slots", icon: "cal", c: "#F2994A", b: "#FEEFE2", href: "/app/hire/entretiens" },
  { key: "test", icon: "tests", c: "#8B6CF0", b: "#EFEAFE", href: "/app/hire/tests" },
  { key: "messages", icon: "chat", c: "#4C8DF6", b: "#E6EFFE", href: "/app/messages" },
] as const;

let cache: { candidates: HirePaletteCandidate[]; offers: HirePaletteOffer[] } | null = null;

/**
 * `Ctrl K` of the recruiter's web app v3 (`palette()` of the prototype): the filters Tout,
 * Candidats, Offres and Pages with their counts, the rapid actions, the recent candidates with
 * their %, the offers and the pages, « Demander à Orbi » with the words typed, and the keyboard
 * foot. The candidates and offers of the organization come from `/api/hire/recherche/index`.
 */
export function HirePalette({ pages, onClose }: { pages: HireV3Link[]; onClose: () => void }) {
  const t = useTranslations("hireV3.palette");
  const router = useRouter();
  const [data, setData] = useState(cache);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    let live = true;
    fetch("/api/hire/recherche/index", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((json) => {
        if (!live || !json) return;
        cache = json;
        setData(json);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const items = useMemo<Item[]>(() => {
    const statusOf = (offer: HirePaletteOffer) =>
      offer.status === "live" ? t("live") : offer.status === "paused" ? t("paused") : t("draft");
    return [
      ...(data?.candidates ?? []).map((c) => ({
        key: `c${c.id}`,
        label: c.name,
        sub: c.sub || t("candidate"),
        href: c.href,
        group: "candidates" as const,
        icon: "users" as const,
        colour: c.score == null ? PAGE : scoreColour(c.score),
        score: c.score,
      })),
      ...(data?.offers ?? []).map((o) => ({
        key: `o${o.id}`,
        label: o.title,
        sub: o.department ? `${o.department} · ${statusOf(o)}` : statusOf(o),
        href: o.href,
        group: "offers" as const,
        icon: "offres" as const,
        colour: OFFER,
      })),
      ...pages.map((p) => ({
        key: `p${p.href}`,
        label: p.label,
        sub: t("page"),
        href: p.href,
        group: "pages" as const,
        icon: p.icon,
        colour: PAGE,
      })),
    ];
  }, [data, pages, t]);

  const words = query.toLowerCase().trim();
  const matching = items.filter(
    (item) =>
      !words || item.label.toLowerCase().includes(words) || item.sub.toLowerCase().includes(words),
  );
  const count = (f: Filter) => matching.filter((item) => f === "all" || item.group === f).length;
  const groups: Exclude<Filter, "all">[] =
    filter === "all" ? ["candidates", "offers", "pages"] : [filter];
  const shown = groups.map((group) => {
    let list = matching.filter((item) => item.group === group);
    if (!words && filter === "all") list = list.slice(0, group === "pages" ? 4 : 3);
    return { group, list };
  });
  const flat = shown.flatMap((g) => g.list);
  const current = Math.min(selected, Math.max(0, flat.length - 1));

  const open = (item: Item) => {
    onClose();
    router.push(item.href);
  };

  return (
    <div
      className="overlay"
      id="ov"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="palette pv2" role="dialog" aria-modal="true" aria-label={t("dialog")}>
        <div className="pv2-h">
          <HireIcon name="search" />
          <input
            id="pin"
            ref={input}
            value={query}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                setSelected(Math.min(current + 1, flat.length - 1));
                event.preventDefault();
              }
              if (event.key === "ArrowUp") {
                setSelected(Math.max(current - 1, 0));
                event.preventDefault();
              }
              if (event.key === "Enter" && flat[current]) open(flat[current]);
              if (event.key === "Escape") onClose();
            }}
          />
          <kbd>{t("escape")}</kbd>
        </div>
        <div className="pv2-f" id="pf">
          {(["all", "candidates", "offers", "pages"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={f === filter ? "on" : undefined}
              aria-pressed={f === filter}
              onClick={() => {
                setFilter(f);
                setSelected(0);
                input.current?.focus();
              }}
            >
              {t(`filters.${f}`)}
              <em>{count(f)}</em>
            </button>
          ))}
        </div>
        <div className="pl" id="pl">
          {words && flat.length === 0 ? (
            <div className="meta" style={{ padding: "16px 8px" }}>
              {t("none", { query })}
            </div>
          ) : null}
          {!words && filter === "all" ? (
            <>
              <div className="pv2-g">{t("quick")}</div>
              <div className="pv2-q">
                {QUICK.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    style={{ "--c": action.c, "--b": action.b } as React.CSSProperties}
                    onClick={() => {
                      onClose();
                      router.push(action.href);
                    }}
                  >
                    <span>
                      <HireIcon name={action.icon} size="s" />
                    </span>
                    {t(`actions.${action.key}`)}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {shown.map(({ group, list }) =>
            list.length === 0 ? null : (
              <Fragment key={group}>
                <div className="pv2-g">
                  {group === "candidates" && !words ? t("recent") : t(`filters.${group}`)}
                </div>
                {list.map((item) => {
                  const n = flat.indexOf(item);
                  return (
                    <div
                      key={item.key}
                      className={n === current ? "po on" : "po"}
                      onMouseEnter={() => setSelected(n)}
                      onClick={() => open(item)}
                    >
                      {item.group === "candidates" ? (
                        <span className={`av ${avatarColor(item.label)} xs`} aria-hidden="true">
                          {initialsOf(item.label)}
                        </span>
                      ) : (
                        <span
                          className="pv2-dot"
                          style={{ "--c": item.colour } as React.CSSProperties}
                        >
                          <HireIcon name={item.icon} size="s" />
                        </span>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <b>{item.label}</b>
                        <div className="meta">{item.sub}</div>
                      </div>
                      {item.score != null ? (
                        <span
                          className="pv2-sc"
                          style={{ "--c": item.colour } as React.CSSProperties}
                        >
                          {t("score", { score: item.score })}
                        </span>
                      ) : (
                        <span style={{ marginLeft: "auto", color: "var(--muted)" }}>
                          <HireIcon name="chev" size="s" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ),
          )}
          {words ? (
            <div
              className="pv2-orbi"
              role="button"
              tabIndex={0}
              onClick={() => {
                onClose();
                openHireOrbi(query);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                onClose();
                openHireOrbi(query);
              }}
            >
              <HireIcon name="orbi" size="s" />
              <span>{t.rich("askOrbi", { query, em: (chunks) => <em>{chunks}</em> })}</span>
              <HireIcon name="right" size="s" />
            </div>
          ) : null}
        </div>
        <div className="pv2-ft">
          <span>
            <kbd>{t("up")}</kbd>
            <kbd>{t("down")}</kbd>
            {t("navigate")}
          </span>
          <span>
            <kbd>{t("enter")}</kbd>
            {t("open")}
          </span>
          <span>{t("reopen")}</span>
        </div>
      </div>
    </div>
  );
}
