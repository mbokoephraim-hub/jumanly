"use client";

import { NextIntlClientProvider, useLocale, type AbstractIntlMessages } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { orbiAides, type OrbiReply } from "@/lib/orbi";
import { orbiPanelAction } from "@/server/actions/orbi";
import { TalentIcon } from "../icon";
import { OrbiChat } from "../orbi-chat";
import { OrbiMark } from "../orbi-mark";
import { closeDialog, SidePanel } from "./dialog";

/** Parameter of the address that opens the panel: `1` for a new exchange, or an exchange's id. */
export const ORBI_PARAM = "orbi";

/** A question written in `Ctrl K`, waiting for the panel to open and send it. */
let waiting: string | null = null;

/** Said when this module changes `?orbi=` itself (pushState does not always reach the hooks). */
const ORBI_EVENT = "jm-orbi-panneau";

/**
 * `1` or an exchange's id (cuid2: 24 lowercase letters and digits). Other values are not the
 * panel's: the CV studio already answers in `?orbi=<code>` (« quota », « obsolete »…).
 */
const PANEL_VALUE = /^(1|[a-z][a-z0-9]{23,31})$/;

const readParam = () => {
  const value = new URL(window.location.href).searchParams.get(ORBI_PARAM);
  return value && PANEL_VALUE.test(value) ? value : null;
};

/**
 * Opens Orbi in the right panel of the current page (brief web § 2.4): the page stays as it is,
 * `?orbi=1` goes into the address (a new entry: « Retour » closes the panel). `question` is sent at
 * once (« Demander à Orbi : … » in `Ctrl K`).
 */
export function openOrbiPanel(question?: string) {
  waiting = question?.trim() || null;
  const url = new URL(window.location.href);
  url.searchParams.set(ORBI_PARAM, "1");
  window.history.pushState(window.history.state, "", url);
  window.dispatchEvent(new Event(ORBI_EVENT));
}

/**
 * `?orbi=` of the address, followed live: a link or a navigation (search params), « Retour » and
 * « Suivant » (popstate), and the openings and closings of this module (its event).
 */
function useOrbiParam() {
  const params = useSearchParams();
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setValue(readParam());
    read();
    window.addEventListener("popstate", read);
    window.addEventListener(ORBI_EVENT, read);
    return () => {
      window.removeEventListener("popstate", read);
      window.removeEventListener(ORBI_EVENT, read);
    };
  }, [params]);
  return value;
}

type Loaded = {
  key: string;
  credits: number | null;
  conversationId: string | null;
  messages: OrbiReply[];
  question?: string;
};

/**
 * Orbi in a side panel on any page of the talent space (`?orbi=1`, planche talent-1 § 4 `.op`):
 * 420 px on the right, the page readable behind. Same conversation and same rules as the page Orbi
 * (credits under its name; it proposes, the person decides). Not on Orbi's own page.
 */
export function OrbiPanel({
  texts,
  labels,
}: {
  /** The `talentOrbi` texts of the conversation. */
  texts: AbstractIntlMessages;
  labels: {
    title: string;
    close: string;
    expand: string;
    loading: string;
    error: string;
    aides: string;
  } & Record<(typeof orbiAides)[number]["key"], string>;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const param = useOrbiParam();
  const value = pathname === "/app/orbi" ? null : param;
  const open = value !== null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);

  // Opening: the credits and, for `?orbi=<id>`, the exchange to reopen. Only once per opening:
  // the conversation then keeps the address up to date by itself.
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the panel was closed
      setLoaded(null);
      setFailed(false);
      return;
    }
    if (loaded) return;
    let live = true;
    const question = waiting ?? undefined;
    waiting = null;
    orbiPanelAction({ id: value === "1" ? null : value })
      .then((data) => {
        if (live) setLoaded({ key: `${Date.now()}`, ...data, question });
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per opening
  }, [open]);

  return (
    <SidePanel
      id="orbi-panneau"
      title={labels.title}
      closeLabel={labels.close}
      open={open}
      bare
      className="t-op"
      onClose={() => {
        const url = new URL(window.location.href);
        if (!url.searchParams.has(ORBI_PARAM)) return;
        url.searchParams.delete(ORBI_PARAM);
        window.history.replaceState(window.history.state, "", url);
        window.dispatchEvent(new Event(ORBI_EVENT));
      }}
    >
      {loaded ? (
        <NextIntlClientProvider locale={locale} messages={{ talentOrbi: texts }}>
          <OrbiChat
            key={loaded.key}
            variant="panel"
            conversationId={loaded.conversationId}
            messages={loaded.messages}
            credits={loaded.credits}
            question={loaded.question}
            panelLabels={{ close: labels.close, expand: labels.expand }}
          >
            {loaded.messages.length === 0 && !loaded.question && (
              <nav aria-label={labels.aides}>
                <ul className="t-op-aides">
                  {orbiAides.map((aide) => (
                    <li key={aide.key}>
                      <Link href={aide.href} className="t-press">
                        <TalentIcon name={aide.icon} size="xs" />
                        {labels[aide.key]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </OrbiChat>
        </NextIntlClientProvider>
      ) : (
        <div className="t-op-attente">
          <button
            type="button"
            className="t-bi t-press"
            aria-label={labels.close}
            onClick={(event) => closeDialog(event.currentTarget)}
          >
            <TalentIcon name="fermer" size="s" />
          </button>
          <OrbiMark size={40} state={failed ? "repos" : "reflechit"} />
          <p role="status">{failed ? labels.error : labels.loading}</p>
        </div>
      )}
    </SidePanel>
  );
}
