"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { learnSearchAction } from "@/server/actions/learn-phone";
import { PhoneIcon } from "../icon";
import { askOrbi } from "../orbi-bus";
import type { FormationView, FoundView } from "./data";
import { CourseLine, CourseSquare } from "./parts";

const SCOPES = ["tout", "cours", "lecons", "attestations"] as const;
type Scope = (typeof SCOPES)[number];

/** Recent searches stay on this phone only (a convenience, never needed by the page). */
const RECENT_KEY = "jm-formation-recherches";
const RECENT_MAX = 3;
type Recent = { query: string; at: number };

function readRecent(): Recent[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as unknown;
    return Array.isArray(value)
      ? value.filter(
          (item): item is Recent => typeof item?.query === "string" && typeof item?.at === "number",
        )
      : [];
  } catch {
    return [];
  }
}

function writeRecent(list: Recent[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {}
}

/**
 * The search of Formation in two steps (planches Formation-recherche, -recherche-texte): touching
 * the field shows where to search, the course to resume, the recent searches and the skills the
 * person's offers ask; from the first letter, the courses, lessons and attestations found.
 * « Tout voir » opens it on the courses. « Annuler » comes back to the tab as it was.
 */
export function FormationSearch({
  open,
  start,
  onOpen,
  onClose,
  current,
  skills,
}: {
  open: boolean;
  /** The rubric « Tout voir » asked for, when it opened the search. */
  start: Scope | null;
  onOpen: () => void;
  onClose: () => void;
  current: FormationView["current"];
  skills: string[];
}) {
  const t = useTranslations("phoneLearn.search");
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("tout");
  const [found, setFound] = useState<FoundView | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const typed = query.trim();

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once the browser is there
    setRecent(readRecent());
    if (start) setScope(start);
  }, [open, start]);

  useEffect(() => {
    if (!typed) return;
    let live = true;
    const timer = setTimeout(() => {
      void learnSearchAction(typed, scope).then((result) => {
        if (live && result.ok) setFound(result.value);
      });
    }, 150);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [typed, scope]);

  const close = () => {
    setQuery("");
    setFound(null);
    setScope("tout");
    input.current?.blur();
    onClose();
  };
  const remember = () => {
    if (!typed) return;
    writeRecent([
      { query: typed, at: Date.now() },
      ...readRecent().filter((item) => item.query.toLowerCase() !== typed.toLowerCase()),
    ]);
  };
  const pick = (value: string) => {
    setQuery(value);
    input.current?.focus();
  };
  const when = (at: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (at >= today.getTime()) return t("today");
    if (at >= today.getTime() - 86_400_000) return t("yesterday");
    return new Intl.DateTimeFormat("fr", { day: "numeric", month: "short" }).format(at);
  };

  const empty =
    found && !found.courses.length && !found.lessons.length && !found.certificates.length;

  return (
    <>
      <div className="nb-ex-champ">
        <label className="nb-ex-recherche">
          <PhoneIcon name="recherche" size={20} />
          <input
            ref={input}
            type="search"
            value={query}
            onFocus={onOpen}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!event.target.value.trim()) setFound(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") close();
              if (event.key === "Enter") remember();
            }}
            aria-label={t("label")}
            placeholder={t("placeholder")}
            enterKeyHint="search"
          />
          {typed ? (
            <button
              type="button"
              aria-label={t("clear")}
              onClick={() => {
                setQuery("");
                setFound(null);
                input.current?.focus();
              }}
            >
              <PhoneIcon name="fermer" size={16} />
            </button>
          ) : null}
        </label>
        {open ? (
          <button type="button" className="nb-ex-annuler" data-retour="" onClick={close}>
            {t("cancel")}
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="nb-ex-options nb-fo-options" data-recherche="">
          <p className="nb-ex-groupe">{t("in")}</p>
          <div className="nb-ex-portee" role="group" aria-label={t("in")}>
            {SCOPES.map((key) => (
              <button
                key={key}
                type="button"
                className="nb-ex-chip"
                data-fort=""
                aria-pressed={scope === key}
                onClick={() => setScope(key)}
              >
                {t(`scope.${key}`)}
              </button>
            ))}
          </div>

          {typed ? (
            found === null ? null : empty ? (
              <div className="nb-fo-rien">
                <p className="nb-meta">{t("empty", { query: typed })}</p>
                <button
                  type="button"
                  onClick={() => {
                    remember();
                    askOrbi(t("orbiQuestion", { query: typed }));
                  }}
                >
                  {t("askOrbi")}
                </button>
              </div>
            ) : (
              <div onClickCapture={remember}>
                {found.courses.length > 0 ? (
                  <section aria-label={t("courses", { count: found.courses.length })}>
                    <h2 className="nb-ex-groupe">
                      {t("courses", { count: found.courses.length })}
                    </h2>
                    {found.courses.map((row) => (
                      <CourseLine key={row.slug} row={row} />
                    ))}
                  </section>
                ) : null}
                {found.lessons.length > 0 ? (
                  <section aria-label={t("lessons", { count: found.lessons.length })}>
                    <h2 className="nb-ex-groupe">
                      {t("lessons", { count: found.lessons.length })}
                    </h2>
                    {found.lessons.map((lesson) => (
                      <Link key={lesson.id} href={lesson.href} className="nb-fo-ligne">
                        <CourseSquare initials={String(lesson.num)} tone={lesson.tone} size={40} />
                        <span className="nb-fo-ligne-t">
                          <b>{lesson.title}</b>
                          <small className="nb-meta">{lesson.line}</small>
                        </span>
                      </Link>
                    ))}
                  </section>
                ) : null}
                {found.certificates.length > 0 ? (
                  <section aria-label={t("certificates", { count: found.certificates.length })}>
                    <h2 className="nb-ex-groupe">
                      {t("certificates", { count: found.certificates.length })}
                    </h2>
                    {found.certificates.map((item) => (
                      <Link key={item.id} href={item.href} className="nb-fo-ligne">
                        <span className="nb-fo-carre" data-att="" aria-hidden>
                          <PhoneIcon name="coche" size={22} stroke={2.2} />
                        </span>
                        <span className="nb-fo-ligne-t">
                          <b>{item.title}</b>
                          <small className="nb-meta">{item.line}</small>
                        </span>
                      </Link>
                    ))}
                  </section>
                ) : null}
              </div>
            )
          ) : (
            <>
              {current ? (
                <section aria-label={t("resume")}>
                  <h2 className="nb-ex-groupe">{t("resume")}</h2>
                  <Link href={current.href} className="nb-fo-ligne" data-nu="">
                    <CourseSquare initials={current.initials} tone={current.tone} />
                    <span className="nb-fo-ligne-t">
                      <b>{current.title}</b>
                      <small className="nb-meta">{current.lesson}</small>
                    </span>
                    <span className="nb-fo-etat" data-ton="lime">
                      {t("resumeAction")}
                    </span>
                  </Link>
                </section>
              ) : null}
              {recent.length > 0 ? (
                <section aria-label={t("recent")}>
                  <h2 className="nb-ex-groupe">{t("recent")}</h2>
                  {recent.map((item) => (
                    <button
                      key={item.query}
                      type="button"
                      className="nb-ex-recent"
                      onClick={() => pick(item.query)}
                    >
                      <PhoneIcon name="horloge" size={20} />
                      <span>{item.query}</span>
                      <span className="nb-meta">{when(item.at)}</span>
                    </button>
                  ))}
                </section>
              ) : null}
              {skills.length > 0 ? (
                <section aria-label={t("skills")}>
                  <h2 className="nb-ex-groupe">{t("skills")}</h2>
                  <div className="nb-ex-populaires">
                    {skills.map((value) => (
                      <button key={value} type="button" onClick={() => pick(value)}>
                        {value}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
              <p className="nb-ex-astuce">{t("hint")}</p>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}
