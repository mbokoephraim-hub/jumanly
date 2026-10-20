"use client";

import { useEffect, useRef } from "react";

const MARK = "data-nav-pending";
/** Below this, the next page came fast enough: no bar. */
const BAR_DELAY_MS = 120;
/** A link that started no page request in this time opened something of the page (a sheet). */
const NO_PAGE_MS = 250;
/** A page request answered while the address stayed: the navigation ended there. */
const SAME_PAGE_MS = 6_000;
/** A form handled on the page that started no request in this time is released. */
const NO_ACTION_MS = 400;
/** Beyond this, the marks give up (the page may have refused to change, or failed). */
const GIVE_UP_MS = 20_000;

/**
 * Answer to every tap (ux-test, étape 1 ; reprise du 20/10, demande d'Ephraïm : « certaines touches
 * font cliquer deux ou trois fois », fluidité de WhatsApp). The signed-in space keeps the previous
 * page while the next one comes (no loading screen), so without this a tap looked like nothing
 * happened and people tapped again:
 * - the link touched is marked `data-nav-pending` (dimmed) and a thin bar runs along the top of the
 *   screen until the new page is there; touching the same link again meanwhile does nothing;
 * - the button of a form being sent is marked `data-sending` (busy, no second tap) and the form
 *   is not sent twice;
 * - in the talent and recruiter spaces (`.t-app`), the new page slides in from the right, from the
 *   left when going back, and the first-level pages fade into each other.
 * Next.js links handle their click themselves, so the start is read from the click and the end from
 * the address; page requests and server actions are followed through `fetch` (headers `RSC` and
 * `Next-Action`), the only global sign of their start and end. Nothing moves when motion is
 * reduced; the marks stay.
 */
export function NavigationFeedback({ label }: { label: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = () => document.getElementById("content");
    let going: { link: HTMLElement; href: string } | null = null;
    let sending = new Set<HTMLElement>();
    let pages = 0;
    /** Page requests ever started: tells whether a tap asked for a page. */
    let pagesStarted = 0;
    let pagesBeforeTap = 0;
    let actions = 0;
    let shownHref = window.location.href;
    let back = false;
    let watch = 0;
    const timers = {
      bar: undefined as ReturnType<typeof setTimeout> | undefined,
      giveUp: undefined as ReturnType<typeof setTimeout> | undefined,
      noPage: undefined as ReturnType<typeof setTimeout> | undefined,
      noAction: undefined as ReturnType<typeof setTimeout> | undefined,
    };

    // Hidden copies of earlier pages (kept by the router) do not count.
    const loadingScreen = () =>
      [...document.querySelectorAll("[data-page-loading]")].some(
        (element) => element.getClientRects().length > 0,
      );
    const busy = () => going !== null || sending.size > 0;
    const showBar = (on: boolean) => {
      const element = bar.current;
      if (!element) return;
      element.toggleAttribute("data-active", on);
      element.setAttribute("aria-hidden", on ? "false" : "true");
    };
    const start = () => {
      clearTimeout(timers.bar);
      timers.bar = setTimeout(() => {
        if (busy()) showBar(true);
      }, BAR_DELAY_MS);
      clearTimeout(timers.giveUp);
      timers.giveUp = setTimeout(() => {
        endNavigation();
        releaseForms();
      }, GIVE_UP_MS);
      cancelAnimationFrame(watch);
      watch = requestAnimationFrame(followAddress);
    };
    const stopIfIdle = () => {
      if (busy()) return;
      clearTimeout(timers.bar);
      clearTimeout(timers.giveUp);
      cancelAnimationFrame(watch);
      showBar(false);
    };
    const endNavigation = () => {
      clearTimeout(timers.noPage);
      going?.link.removeAttribute(MARK);
      going = null;
      content()?.removeAttribute("aria-busy");
      stopIfIdle();
    };
    const releaseForms = () => {
      clearTimeout(timers.noAction);
      for (const element of sending) {
        element.removeAttribute("data-sending");
        element.removeAttribute("aria-busy");
      }
      sending = new Set();
      stopIfIdle();
    };

    const still = () =>
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.querySelector("[data-reduce-motion]") !== null;
    /** The page shown has changed: it enters (talent and recruiter spaces). */
    const enter = (from: string, to: string) => {
      const main = content();
      if (main?.closest(".t-app") && !still()) {
        main.removeAttribute("data-entree");
        void main.offsetWidth; // restart the entry
        main.setAttribute(
          "data-entree",
          firstLevel(from, to) ? "fondu" : back ? "retour" : "avant",
        );
      }
      back = false;
    };
    const onEntered = (event: AnimationEvent) => {
      const main = content();
      if (main && event.animationName.startsWith("t-entree-p")) main.removeAttribute("data-entree");
    };

    // The address changes when the next page is shown (Next keeps the previous one until then).
    const followAddress = () => {
      const href = window.location.href;
      if (href !== shownHref && !loadingScreen()) {
        const before = new URL(shownHref).pathname;
        const now = new URL(href).pathname;
        shownHref = href;
        if (before !== now) enter(before, now);
        endNavigation();
        releaseForms();
      }
      if (busy()) watch = requestAnimationFrame(followAddress);
    };

    const target = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return null;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return null;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return null;
      if (link.origin !== location.origin) return null;
      // Same page (or only its anchor): nothing will load.
      if (link.pathname === location.pathname && link.search === location.search) return null;
      // Files and API routes open outside the app.
      if (
        link.pathname.startsWith("/api/") ||
        /\.(pdf|csv|zip|png|jpe?g|svg)$|\/(pdf|cv|support|export)$/.test(link.pathname)
      )
        return null;
      return { link, href: link.pathname + link.search };
    };
    // Before the page's own handlers: the same link touched again while its page comes.
    const onClickFirst = (event: MouseEvent) => {
      pagesBeforeTap = pagesStarted;
      const found = target(event);
      if (found && going?.href === found.href) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const onClick = (event: MouseEvent) => {
      const found = target(event);
      if (!found || going?.href === found.href) return;
      going?.link.removeAttribute(MARK);
      going = found;
      found.link.setAttribute(MARK, "");
      content()?.setAttribute("aria-busy", "true");
      start();
      // A plain link is a page load. A handled one that asks nothing opened something of the page.
      if (!event.defaultPrevented) return;
      clearTimeout(timers.noPage);
      const before = pagesBeforeTap;
      timers.noPage = setTimeout(() => {
        if (going === found && pagesStarted === before && location.href === shownHref)
          endNavigation();
      }, NO_PAGE_MS);
    };

    const onSubmitFirst = (event: SubmitEvent) => {
      const form = event.target;
      if (form instanceof HTMLFormElement && form.hasAttribute("data-sending")) {
        // Already sending: the second tap sends nothing.
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    // After the page's own handlers (React runs the form's action on the way).
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.target === "_blank") return;
      if (form.hasAttribute("data-sending")) return;
      form.setAttribute("data-sending", "");
      sending.add(form);
      const submitter = event.submitter;
      if (submitter instanceof HTMLElement) {
        submitter.setAttribute("data-sending", "");
        submitter.setAttribute("aria-busy", "true");
        sending.add(submitter);
      }
      start();
      // Handled on the page (an action, a filter, a search): released when no request follows.
      if (!event.defaultPrevented) return;
      clearTimeout(timers.noAction);
      timers.noAction = setTimeout(() => {
        if (actions === 0 && pages === 0 && location.href === shownHref) releaseForms();
      }, NO_ACTION_MS);
    };

    const onPopState = () => {
      back = true;
      start();
    };
    // Mobile Safari only shows `:active` when the page listens to touches.
    const onTouch = () => undefined;

    const original = window.fetch;
    const tracked: typeof window.fetch = (input, init) => {
      const headers = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined),
      );
      const action = headers.has("next-action");
      const page = !action && headers.has("rsc") && !headers.has("next-router-prefetch");
      if (!action && !page) return original(input, init);
      if (action) actions += 1;
      else {
        pages += 1;
        pagesStarted += 1;
      }
      const done = () => {
        if (action) actions -= 1;
        else pages -= 1;
        // The page came but the address stayed (sent back to the same page): nothing more comes.
        if (!action && pages === 0) {
          clearTimeout(timers.noPage);
          timers.noPage = setTimeout(() => {
            if (pages === 0 && location.href === shownHref) endNavigation();
          }, SAME_PAGE_MS);
        }
        // A sending ends once React has shown its answer, and the page it refreshed if any.
        if (actions === 0 && pages === 0 && sending.size > 0)
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              if (actions === 0 && pages === 0 && location.href === shownHref) releaseForms();
            }),
          );
      };
      const answer = original(input, init);
      answer.then(done, done);
      return answer;
    };
    window.fetch = tracked;

    document.addEventListener("click", onClickFirst, true);
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmitFirst, true);
    document.addEventListener("submit", onSubmit);
    document.addEventListener("touchstart", onTouch, { passive: true });
    document.addEventListener("animationend", onEntered);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClickFirst, true);
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmitFirst, true);
      document.removeEventListener("submit", onSubmit);
      document.removeEventListener("touchstart", onTouch);
      document.removeEventListener("animationend", onEntered);
      window.removeEventListener("popstate", onPopState);
      if (window.fetch === tracked) window.fetch = original;
      for (const timer of Object.values(timers)) clearTimeout(timer);
      cancelAnimationFrame(watch);
    };
  }, []);

  return (
    <div ref={bar} role="progressbar" aria-label={label} aria-hidden className="jm-nav-progress" />
  );
}

/** Between two pages of the first level (the tabs and their neighbours): a fade, not a slide. */
function firstLevel(from: string, to: string) {
  const depth = (path: string) => path.split("/").filter(Boolean).length;
  return depth(from) <= 2 && depth(to) <= 2;
}
