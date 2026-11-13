"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { openOrbi } from "@/components/phone/orbi-bus";
import { signOut } from "@/server/actions/auth";
import { updateAppearance } from "@/server/actions/settings";
import { HireIcon, HireSymbol, type HireIconName } from "./icon";
import { HirePalette } from "./palette";
import { applyHireTheme } from "./theme";

export type HireV3Link = {
  href: string;
  label: string;
  icon: HireIconName;
  count?: number;
  /** Lit only on this exact address (« Accueil »). */
  exact?: boolean;
  /** Other addresses that light this entry (the talents of a pool light « Vivier »). */
  match?: string[];
};

export type HireV3Notification = {
  id: string;
  href: string;
  icon: HireIconName;
  text: string;
  meta: string;
};

export type HireV3FrameProps = {
  nav: HireV3Link[];
  tools: HireV3Link[];
  /** The pages offered by the search, beside candidates and offers. */
  pages: HireV3Link[];
  bell: { items: HireV3Notification[]; unread: number };
  me: { name: string; line: string; org: string; initials: string; color: string };
  dark: boolean;
};

const HOME = "/app/hire";

function inside(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function isLit(pathname: string, link: Pick<HireV3Link, "href" | "exact" | "match">) {
  if (link.exact) return pathname === link.href;
  return [link.href, ...(link.match ?? [])].some((path) => inside(pathname, path));
}

/**
 * The frame of the recruiter's web app v3 (docs/mvp-web-recruteur/prototype-v3, validated by
 * Ephraïm on 13/11/2026), drawn as `topbar()` and `rail()` of the prototype: the floating bar
 * (logo, the modules in a pill with the active one in black, search, bell, help, profile) and the
 * rail of small icon pills on the left (Nouvelle offre in Lime, Orbi, then the tools). The profile
 * menu carries the dark mode, kept on the account; `Ctrl K` opens the search. Same class names as
 * the prototype, under `.hv3` (src/styles/hire-v3.css).
 */
export function HireV3Frame({ nav, tools, pages, bell, me, dark: darkOnServer }: HireV3FrameProps) {
  const t = useTranslations("hireV3");
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const railOpen = openOn === pathname;
  const [drop, setDrop] = useState<"bell" | "me" | null>(null);
  const [palette, setPalette] = useState(false);
  const [dark, setDark] = useState(darkOnServer);
  const [, startTransition] = useTransition();

  // Another page closes the menus (the prototype's `closeLayer()` on each route).
  const [shownOn, setShownOn] = useState(pathname);
  if (shownOn !== pathname) {
    setShownOn(pathname);
    setDrop(null);
    setPalette(false);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setDrop(null);
        setPalette(true);
      }
      if (event.key === "Escape") setDrop(null);
    };
    const onDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target && !target.closest(".drop") && !target.closest("[data-drop]")) setDrop(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !dark;
    setDark(next);
    applyHireTheme(next);
    const form = new FormData();
    form.set("appearance", next ? "dark" : "light");
    startTransition(() => updateAppearance(form));
  }, [dark]);

  const current = (link: HireV3Link) => (isLit(pathname, link) ? "page" : undefined);

  return (
    <div className={railOpen ? "hv3 app hv3-cadre open" : "hv3 app hv3-cadre"}>
      <header className="top" id="top">
        <Link className="logo" href={HOME} aria-label={t("brand")}>
          <HireSymbol />
          <b>{t("name")}</b>
        </Link>
        <button
          type="button"
          className="ibtn burger"
          id="burger"
          aria-label={t("burger")}
          aria-expanded={railOpen}
          aria-controls="rail"
          onClick={() => setOpenOn(railOpen ? null : pathname)}
        >
          <HireIcon name="menu" />
        </button>
        <nav className="topnav" aria-label={t("nav.aria")}>
          {nav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={current(link) ? "on" : undefined}
              aria-current={current(link)}
            >
              <HireIcon name={link.icon} />
              {link.label}
              {link.count ? (
                <span className="cnt">{link.count > 99 ? "99+" : link.count}</span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="topr">
          <button
            type="button"
            className="ibtn"
            id="searchbtn"
            aria-label={t("search")}
            onClick={() => {
              setDrop(null);
              setPalette(true);
            }}
          >
            <HireIcon name="search" />
          </button>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="ibtn"
              id="bell"
              data-drop=""
              aria-label={t("bell.title")}
              aria-expanded={drop === "bell"}
              onClick={() => setDrop(drop === "bell" ? null : "bell")}
            >
              <HireIcon name="bell" />
              {bell.unread > 0 ? <span className="badge" /> : null}
            </button>
            {drop === "bell" ? <BellDrop {...bell} /> : null}
          </div>
          <Link className="ibtn hm" href="/app/hire/compte/aide" aria-label={t("help")}>
            <HireIcon name="help" />
          </Link>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="me"
              id="mebtn"
              data-drop=""
              aria-expanded={drop === "me"}
              onClick={() => setDrop(drop === "me" ? null : "me")}
            >
              <span className={`av ${me.color} xs`} aria-hidden="true">
                {me.initials}
              </span>
              <div style={{ textAlign: "left" }}>
                <b>{me.name}</b>
                <small>{me.org}</small>
              </div>
              <HireIcon name="down" size="s" />
            </button>
            {drop === "me" ? <MeMenu me={me} dark={dark} onTheme={toggleTheme} /> : null}
          </div>
        </div>
      </header>
      <aside className="rail" id="rail" aria-label={t("tools.aria")}>
        <div className="rgroup">
          <Link
            className="rbtn lime"
            href="/app/hire/offres/nouvelle"
            aria-label={t("tools.publish")}
          >
            <HireIcon name="r_plus" />
            <span className="tip">{t("tools.publish")}</span>
          </Link>
          <button
            type="button"
            className="rbtn"
            id="orbibtn"
            aria-label={t("tools.orbi")}
            onClick={openOrbi}
          >
            <HireIcon name="r_orbi" />
            <span className="tip">{t("tools.orbi")}</span>
          </button>
        </div>
        <nav className="rgroup" aria-label={t("tools.aria")}>
          {tools.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={current(link) ? "rbtn on" : "rbtn"}
              aria-label={link.label}
              aria-current={current(link)}
            >
              <HireIcon name={link.icon} />
              <span className="tip">{link.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <PageBar />
      {palette ? <HirePalette pages={pages} onClose={() => setPalette(false)} /> : null}
    </div>
  );
}

function BellDrop({ items, unread }: HireV3FrameProps["bell"]) {
  const t = useTranslations("hireV3.bell");
  return (
    <div className="drop" role="dialog" aria-label={t("title")}>
      <div className="row" style={{ padding: "6px 8px 10px" }}>
        <b style={{ fontFamily: "var(--f-display)", fontSize: 16 }}>{t("title")}</b>
        {unread > 0 ? (
          <span className="pill p-ok" style={{ marginLeft: "auto" }}>
            {t("count", { count: unread })}
          </span>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="meta" style={{ padding: "4px 8px 10px", margin: 0 }}>
          {t("empty")}
        </p>
      ) : (
        items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="row"
            style={{ padding: "10px 8px", borderRadius: 14, textDecoration: "none" }}
          >
            <span className="chip-ic">
              <HireIcon name={item.icon} size="s" />
            </span>
            <div style={{ minWidth: 0 }}>
              <b style={{ fontSize: 13, display: "block" }}>{item.text}</b>
              <span className="meta">{item.meta}</span>
            </div>
            <i
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--feuille)",
                marginLeft: "auto",
                flex: "none",
              }}
            />
          </Link>
        ))
      )}
      <Link
        href="/app/notifications"
        className="meta"
        style={{
          display: "block",
          textAlign: "center",
          fontWeight: 600,
          color: "var(--sapin)",
          padding: "8px 0 4px",
        }}
      >
        {t("all")}
      </Link>
    </div>
  );
}

function MeMenu({
  me,
  dark,
  onTheme,
}: {
  me: HireV3FrameProps["me"];
  dark: boolean;
  onTheme: () => void;
}): ReactNode {
  const t = useTranslations("hireV3.me");
  return (
    <div className="drop pmenu">
      <Link href="/app/hire/compte/profil" className="pm-me">
        <span className={`av ${me.color}`} aria-hidden="true">
          {me.initials}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <b>{me.name}</b>
          <span className="meta">{me.line}</span>
        </div>
        <HireIcon name="chev" size="s" />
      </Link>
      <div className="pm-g">
        <Link href="/app/hire/compte/profil" className="pm-i">
          <HireIcon name="users" size="s" />
          <span>{t("profile")}</span>
        </Link>
        <Link href="/app/hire/compte" className="pm-i">
          <HireIcon name="side" size="s" />
          <span>{t("settings")}</span>
        </Link>
      </div>
      <div className="pm-g">
        <button type="button" className="pm-i" role="switch" aria-checked={dark} onClick={onTheme}>
          <HireIcon name={dark ? "r_sun" : "r_moon"} size="s" />
          <span>{t("dark")}</span>
          <span className={dark ? "nwsw on" : "nwsw"} style={{ marginLeft: "auto" }}>
            <i />
          </span>
        </button>
        <Link href="/app/hire/compte/aide" className="pm-i">
          <HireIcon name="help" size="s" />
          <span>{t("help")}</span>
        </Link>
      </div>
      <div className="pm-g">
        <form action={signOut}>
          <button type="submit" className="pm-i out">
            <HireIcon name="out" size="s" />
            <span>{t("logout")}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * The thin scroll bar on the right of the prototype (`#pgbar`): follows the page (here the layer
 * of the pages, `#content`), drags and jumps on a click.
 */
function PageBar() {
  const barRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    const bar = barRef.current;
    const thumb = thumbRef.current;
    const page = document.getElementById("content");
    if (!bar || !thumb || !page) return;
    const update = () => {
      const max = page.scrollHeight - page.clientHeight;
      const height = bar.clientHeight;
      bar.classList.toggle("off", max < 8);
      if (max < 8) return;
      const size = Math.max(36, (height * page.clientHeight) / page.scrollHeight);
      thumb.style.height = `${size}px`;
      thumb.style.top = `${((height - size) * page.scrollTop) / max}px`;
    };
    let drag = false;
    let y0 = 0;
    let s0 = 0;
    const down = (event: PointerEvent) => {
      drag = true;
      y0 = event.clientY;
      s0 = page.scrollTop;
      bar.classList.add("drag");
      thumb.setPointerCapture(event.pointerId);
      event.stopPropagation();
    };
    const move = (event: PointerEvent) => {
      if (!drag) return;
      const max = page.scrollHeight - page.clientHeight;
      page.scrollTop = s0 + ((event.clientY - y0) * max) / (bar.clientHeight - thumb.clientHeight);
    };
    const up = () => {
      drag = false;
      bar.classList.remove("drag");
    };
    const jump = (event: MouseEvent) => {
      if (event.target === thumb) return;
      const rect = bar.getBoundingClientRect();
      const max = page.scrollHeight - page.clientHeight;
      page.scrollTo({ top: (max * (event.clientY - rect.top)) / rect.height, behavior: "smooth" });
    };
    const observer = new MutationObserver(() => requestAnimationFrame(update));
    observer.observe(page, { childList: true, subtree: true });
    page.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    thumb.addEventListener("pointerdown", down);
    thumb.addEventListener("pointermove", move);
    thumb.addEventListener("pointerup", up);
    bar.addEventListener("click", jump);
    const timer = window.setTimeout(update, 400);
    return () => {
      observer.disconnect();
      page.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      thumb.removeEventListener("pointerdown", down);
      thumb.removeEventListener("pointermove", move);
      thumb.removeEventListener("pointerup", up);
      bar.removeEventListener("click", jump);
      window.clearTimeout(timer);
    };
  }, [pathname]);
  return (
    <div id="pgbar" ref={barRef} aria-hidden="true">
      <i className="tr2" />
      <i className="th" ref={thumbRef} />
    </div>
  );
}
