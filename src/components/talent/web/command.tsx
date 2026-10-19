"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { SearchPreviewItem } from "@/app/api/recherche/apercu/route";
import { cx } from "@/lib/cx";
import { TalentIcon, type TalentIconName } from "../icon";
import { OrbiMark } from "../orbi-mark";
import { openOrbiPanel } from "./orbi-panel";

/** Event that opens the search window (the search pill of the top bar, `Ctrl K`). */
const OPEN_EVENT = "jm-commande";

export function openTalentCommand() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export type CommandLabels = {
  title: string;
  label: string;
  placeholder: string;
  esc: string;
  close: string;
  suggestions: string;
  ask: string;
  /** « Demander à Orbi : « {query} » », `{query}` left in place. */
  askQuery: string;
  askHint: string;
  goTo: string;
  results: string;
  job: string;
  course: string;
  /** `{query}` left in place. */
  all: string;
  /** `{query}` left in place. */
  none: string;
  searching: string;
  /** Plural forms of « # suggestions ». */
  count: { zero: string; one: string; other: string };
};

type Option =
  | { kind: "ask"; id: string }
  | { kind: "go"; id: string; href: string; label: string; icon: TalentIconName; hint?: string };

const fill = (text: string, query: string) => text.replace("{query}", query);

/**
 * « Rechercher ou demander à Orbi » (brief web § 2.4, `Ctrl K`): a centred window, no address of its
 * own. Empty, it offers Orbi and the destinations; with words, Orbi first (« Demander à Orbi : … »
 * opens the panel and sends the question), then the offers and courses that match, then the full
 * results. A combobox: arrows move, Entrée opens, Échap closes.
 */
export function TalentCommand({
  labels,
  destinations,
}: {
  labels: CommandLabels;
  /** « Aller à » when nothing is written: the entries of the sidebar. */
  destinations: { href: string; label: string; icon: TalentIconName }[];
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useId();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchPreviewItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);

  // Ctrl K (⌘ K on a Mac) anywhere in the talent space, and the search pill of the top bar.
  useEffect(() => {
    const open = () => {
      const node = dialog.current;
      if (!node || node.open) return;
      setQuery("");
      setItems([]);
      setActive(0);
      node.showModal();
      input.current?.focus();
    };
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else open();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, open);
    };
  }, []);

  // Offers and courses that match, a moment after the last key (the search of the phone).
  const words = query.trim();
  useEffect(() => {
    if (words.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to look for
      setItems([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/recherche/apercu?n=6&q=${encodeURIComponent(words)}`, {
        signal: controller.signal,
        cache: "no-store",
      }).catch(() => null);
      const data = response?.ok
        ? ((await response.json()) as { items: SearchPreviewItem[] })
        : null;
      if (controller.signal.aborted) return;
      setItems(data?.items ?? []);
      setSearching(false);
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [words]);

  const options: Option[] = [{ kind: "ask", id: `${list}-orbi` }];
  if (words.length >= 2) {
    items.forEach((item, index) =>
      options.push({
        kind: "go",
        id: `${list}-r${index}`,
        href: item.href,
        label: item.title,
        icon: item.kind === "job" ? "opportunites" : "former",
        hint: item.kind === "job" ? labels.job : labels.course,
      }),
    );
    options.push({
      kind: "go",
      id: `${list}-tout`,
      href: `/app/recherche?q=${encodeURIComponent(words)}`,
      label: fill(labels.all, words),
      icon: "recherche",
    });
  } else {
    destinations.forEach((destination, index) =>
      options.push({ kind: "go", id: `${list}-d${index}`, ...destination }),
    );
  }
  const current = Math.min(active, options.length - 1);

  const choose = (option: Option) => {
    dialog.current?.close();
    if (option.kind === "ask") openOrbiPanel(words.length >= 2 ? words : undefined);
    else router.push(option.href);
  };

  const count = options.length;
  const countText = (count === 1 ? labels.count.one : labels.count.other).replace(
    "#",
    String(count),
  );

  const row = (option: Option, index: number) => {
    const on = index === current;
    const common = {
      id: option.id,
      role: "option" as const,
      "aria-selected": on,
      className: cx("t-cmd-o", on && "t-on"),
      onMouseMove: () => setActive(index),
      onClick: () => choose(option),
    };
    if (option.kind === "ask")
      return (
        <div key={option.id} {...common}>
          <OrbiMark size={34} />
          <span className="t-t">
            <b>{words.length >= 2 ? fill(labels.askQuery, words) : labels.ask}</b>
            <span>{labels.askHint}</span>
          </span>
          <TalentIcon name="suivant" size="xs" />
        </div>
      );
    return (
      <div key={option.id} {...common}>
        <span className="t-cases" aria-hidden>
          <TalentIcon name={option.icon} size="s" />
        </span>
        <span className="t-t">
          <b>{option.label}</b>
          {option.hint && <span>{option.hint}</span>}
        </span>
        <TalentIcon name="suivant" size="xs" />
      </div>
    );
  };

  const rest = options.slice(1);
  return (
    <dialog
      ref={dialog}
      className="t-fenetre t-cmd"
      aria-label={labels.title}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="t-cmd-champ">
        <TalentIcon name="recherche" size="s" />
        <input
          ref={input}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={list}
          aria-activedescendant={options[current]?.id}
          aria-autocomplete="list"
          aria-label={labels.label}
          placeholder={labels.placeholder}
          autoComplete="off"
          enterKeyHint="go"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value.slice(0, 100));
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((current + 1) % options.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((current - 1 + options.length) % options.length);
            } else if (event.key === "Enter") {
              event.preventDefault();
              const option = options[current];
              if (option) choose(option);
            }
          }}
        />
        <button
          type="button"
          className="t-kbd t-press"
          aria-label={labels.close}
          onClick={() => dialog.current?.close()}
        >
          {labels.esc}
        </button>
      </div>
      <div id={list} role="listbox" aria-label={labels.suggestions} className="t-cmd-l">
        {row(options[0], 0)}
        <div role="group" aria-labelledby={`${list}-g`}>
          <div id={`${list}-g`} role="presentation" className="t-cmd-g">
            {words.length >= 2 ? labels.results : labels.goTo}
          </div>
          {rest.map((option, index) => row(option, index + 1))}
        </div>
      </div>
      {words.length >= 2 && items.length === 0 && (
        <p className="t-cmd-vide">{searching ? labels.searching : fill(labels.none, words)}</p>
      )}
      <p className="sr-only" aria-live="polite">
        {searching ? labels.searching : countText}
      </p>
    </dialog>
  );
}
