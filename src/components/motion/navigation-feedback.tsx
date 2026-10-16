"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

/**
 * Click feedback (ux-test, étape 1): the moment a link to another page is clicked or a search form
 * is sent, a thin bar runs along the top of the screen and the clicked element is marked
 * `data-nav-pending` (styled in motion.css), until the new page is there. Without it, a slow network
 * leaves the screen still for a second or more and people click again.
 */
export function NavigationFeedback({ label }: { label: string }) {
  return (
    <Suspense fallback={null}>
      <Feedback label={label} />
    </Suspense>
  );
}

const MARK = "data-nav-pending";
/** Beyond this, the bar gives up (the page may have refused to change, or failed). */
const GIVE_UP_MS = 12_000;

function clear() {
  document.querySelectorAll(`[${MARK}]`).forEach((element) => element.removeAttribute(MARK));
}

function Feedback({ label }: { label: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [pending, setPending] = useState(false);

  // The new address is there: the bar finishes once the page has replaced its loading screen.
  const route = `${pathname}?${search}`;
  useEffect(() => {
    let frame = 0;
    const settle = () => {
      // Hidden copies of earlier pages (kept by the router) do not count.
      const loading = [...document.querySelectorAll("[data-page-loading]")].some(
        (element) => element.getClientRects().length > 0,
      );
      if (loading) {
        frame = requestAnimationFrame(settle);
        return;
      }
      setPending(false);
      clear();
    };
    frame = requestAnimationFrame(settle);
    return () => cancelAnimationFrame(frame);
  }, [route]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = (element: Element | null) => {
      element?.setAttribute(MARK, "");
      setPending(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setPending(false);
        clear();
      }, GIVE_UP_MS);
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download") || link.origin !== location.origin) return;
      // Same page (or only its anchor): nothing will load.
      if (link.pathname === location.pathname && link.search === location.search) return;
      // Files and API routes open outside the app.
      if (/\.(pdf|csv|zip|png|jpe?g|svg)$|\/(pdf|cv|support|export)$/.test(link.pathname)) return;
      start(link);
    };
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || event.defaultPrevented) return;
      // A search or filter form (GET) loads another page; server actions show their own state.
      if (form.method.toLowerCase() !== "get" || form.target === "_blank") return;
      start(event.submitter ?? form);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-hidden={!pending}
      data-active={pending ? "" : undefined}
      className="jm-nav-progress"
    />
  );
}
