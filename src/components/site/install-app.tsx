"use client";

import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { INSTALL_EVENT } from "@/lib/install-prompt";

/** The event Chrome and Edge fire when Jumanly can be installed (not yet in the DOM types). */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    /** Kept by the inline script of the root layout (src/lib/install-prompt.ts). */
    __jmInstall?: InstallPromptEvent | null;
    __jmInstalled?: boolean;
  }
}

type Mode = "none" | "prompt" | "ios";

const STANDALONE = "(display-mode: standalone)";

function mode(): Mode {
  const installed =
    window.__jmInstalled ||
    window.matchMedia(STANDALONE).matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (installed) return "none";
  if (window.__jmInstall) return "prompt";
  // iPhone, iPod and iPad (an iPad asks for the desktop site: a Mac with a touch screen).
  const ios =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "none";
}

function subscribe(callback: () => void) {
  const media = window.matchMedia(STANDALONE);
  window.addEventListener(INSTALL_EVENT, callback);
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener(INSTALL_EVENT, callback);
    media.removeEventListener("change", callback);
  };
}

/**
 * « Installer l'appli »: on Android, Chrome and Edge the button opens the browser's installation;
 * on iPhone and iPad it opens a <dialog> with the three steps of Safari (focus kept inside and
 * Escape handled by the browser). Hidden when the app is installed or the browser cannot install
 * it. The trigger and the steps are drawn by the server, so this file stays tiny on public pages.
 */
export function InstallApp({
  id,
  as: Wrapper = "div",
  className,
  buttonClassName,
  dialogClassName,
  trigger,
  steps,
}: {
  /** Unique on the page (Next keeps the previous routes in the DOM). */
  id: string;
  as?: "div" | "li";
  className?: string;
  buttonClassName?: string;
  dialogClassName?: string;
  trigger: ReactNode;
  /** Content of the iPhone dialog; its title carries the id `${id}-t`. */
  steps: ReactNode;
}) {
  const current = useSyncExternalStore(subscribe, mode, () => "none" as Mode);
  const dialog = useRef<HTMLDialogElement>(null);

  const install = async () => {
    const event = window.__jmInstall;
    if (current === "ios" || !event) {
      dialog.current?.showModal();
      return;
    }
    // An event can be shown only once; the browser offers a new one later if the person waits.
    window.__jmInstall = null;
    window.dispatchEvent(new Event(INSTALL_EVENT));
    await event.prompt().catch(() => undefined);
  };

  return (
    <Wrapper className={className} hidden={current === "none"} data-install={current}>
      <button
        type="button"
        className={buttonClassName}
        aria-haspopup={current === "ios" ? "dialog" : undefined}
        aria-controls={current === "ios" ? id : undefined}
        onClick={() => void install()}
      >
        {trigger}
      </button>
      {current === "ios" && (
        <dialog
          ref={dialog}
          id={id}
          className={dialogClassName}
          aria-labelledby={`${id}-t`}
          onClick={(event) => {
            if (event.target === event.currentTarget) event.currentTarget.close();
          }}
        >
          {steps}
        </dialog>
      )}
    </Wrapper>
  );
}
