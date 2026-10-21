"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PhoneIcon } from "./icon";

export type SearchItem = {
  href: string;
  title: string;
  sub?: string;
  initials?: string;
  image?: string | null;
  /** An organization: a rounded square instead of a circle. */
  org?: boolean;
};
export type SearchGroup = { title: string; items: SearchItem[] };

/**
 * Search in two steps (brief § 3, rule 2): touching the field shows the options of the page
 * (`options`: shortcuts, recent searches, filters); from the first letter, the results, grouped,
 * from `endpoint` (`?q=` → `{ groups }`). « Retour » closes it and comes back to the page as it was.
 */
export function TwoStepSearch({
  label,
  placeholder,
  endpoint,
  options,
  texts,
  className,
}: {
  label: string;
  placeholder: string;
  endpoint: string;
  options: ReactNode;
  texts: { back: string; empty: string; clear: string };
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[] | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`${endpoint}${endpoint.includes("?") ? "&" : "?"}q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : { groups: [] }))
        .then((data: { groups: SearchGroup[] }) => setGroups(data.groups))
        .catch(() => undefined);
    }, 120);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, endpoint]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setGroups(null);
  };
  const typed = query.trim() !== "";
  const found = groups?.filter((group) => group.items.length > 0) ?? [];

  return (
    <>
      <button
        type="button"
        className={className ? `nb-recherche ${className}` : "nb-recherche"}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <PhoneIcon name="recherche" size={18} />
        <span>{placeholder}</span>
      </button>
      {open ? (
        <div className="nb-recherche-ecran" role="dialog" aria-label={label} data-recherche="">
          <div className="nb-recherche-tete">
            <button
              type="button"
              className="nb-retour"
              aria-label={texts.back}
              data-retour=""
              onClick={close}
            >
              <PhoneIcon name="retour" size={22} stroke={2} />
            </button>
            <label className="nb-recherche">
              <PhoneIcon name="recherche" size={18} />
              <input
                ref={input}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") close();
                }}
                aria-label={label}
                placeholder={placeholder}
                enterKeyHint="search"
              />
              {typed ? (
                <button
                  type="button"
                  aria-label={texts.clear}
                  onClick={() => {
                    setQuery("");
                    input.current?.focus();
                  }}
                >
                  <PhoneIcon name="fermer" size={16} />
                </button>
              ) : null}
            </label>
          </div>
          {!typed ? (
            <div className="nb-recherche-options">{options}</div>
          ) : groups === null ? null : found.length === 0 ? (
            <p className="nb-vide">{texts.empty.replace("{query}", query.trim())}</p>
          ) : (
            found.map((group) => (
              <section key={group.title} aria-label={group.title}>
                <h2 className="nb-sec">{group.title}</h2>
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href} className="nb-ligne">
                    <span className="nb-av" data-org={item.org ? "" : undefined}>
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- a 40 px picture
                        <img src={item.image} alt="" />
                      ) : (
                        item.initials
                      )}
                    </span>
                    <span className="nb-ligne-texte">
                      <b>{item.title}</b>
                      {item.sub ? <small>{item.sub}</small> : null}
                    </span>
                  </Link>
                ))}
              </section>
            ))
          )}
        </div>
      ) : null}
    </>
  );
}
