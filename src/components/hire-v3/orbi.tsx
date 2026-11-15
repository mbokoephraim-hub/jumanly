"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { askOrbiAction } from "@/server/actions/orbi";
import { hireOrbiPanelAction } from "@/server/actions/hire-v3-orbi";
import type { HireOrbiPanel } from "@/server/services/hire-v3-orbi";
import { loose } from "@/lib/loose-t";
import { HireIcon } from "./icon";

/** Opens Orbi's panel from anywhere in the recruiter's web app v3, with an optional question. */
export const HIRE_ORBI_EVENT = "hv3:orbi";

export function openHireOrbi(question?: string) {
  window.dispatchEvent(new CustomEvent<string | undefined>(HIRE_ORBI_EVENT, { detail: question }));
}

const TODO_COLOUR: Record<HireOrbiPanel["todo"][number]["kind"], string> = {
  unseen: "#3FAE3A",
  unread: "#4C8DF6",
  invitations: "#F2994A",
  scorecards: "#8B6CF0",
};

/** The suggestions under the conversation, by page (`ctx` of the prototype's `orbi()`). */
function context(pathname: string) {
  if (pathname.startsWith("/app/hire/candidats")) return "candidates";
  if (pathname.startsWith("/app/hire/entretiens")) return "agenda";
  if (pathname.startsWith("/app/hire/tests")) return "tests";
  if (pathname.startsWith("/app/hire/viviers") || pathname.startsWith("/app/hire/talents"))
    return "pool";
  return "home";
}

type Bubble = { id: string; who: "me" | "them"; text: string[]; why?: string | null };

/**
 * Orbi's panel (`.drawer.obd` of the prototype, opened by the rail and by « Demander à Orbi » of the
 * search): what to do today, what was done for the member, then the conversation with the
 * recruiting assistant (`askOrbiAction`: consent, rights and credits checked, logged). Orbi
 * proposes, the member decides; name, age, gender and photo stay out of every score.
 */
export function HireOrbi({ firstName }: { firstName: string }) {
  const t = useTranslations("hireV3.orbi");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<HireOrbiPanel | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const body = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const ask = (question: string) => {
    const q = question.trim();
    if (q.length < 2) return;
    setBubbles((list) => [...list, { id: `q${Date.now()}`, who: "me", text: [q] }]);
    startTransition(async () => {
      const result = await askOrbiAction({ conversationId, text: q });
      if (result.ok) {
        setConversationId(result.conversationId);
        setBubbles((list) => [
          ...list,
          { id: result.answer.id, who: "them", text: result.answer.text, why: result.answer.why },
        ]);
      } else {
        setBubbles((list) => [...list, { id: `e${Date.now()}`, who: "them", text: [t("failed")] }]);
      }
    });
  };
  const askRef = useRef(ask);
  useEffect(() => {
    askRef.current = ask;
  });

  useEffect(() => {
    const onOpen = (event: Event) => {
      setOpen(true);
      const question = (event as CustomEvent<string | undefined>).detail;
      if (question) askRef.current(question);
    };
    window.addEventListener(HIRE_ORBI_EVENT, onOpen);
    return () => window.removeEventListener(HIRE_ORBI_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    let live = true;
    void hireOrbiPanelAction()
      .then((data) => {
        if (live) setPanel(data);
      })
      .catch(() => {});
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      live = false;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Another page closes the panel, like the prototype's `closeLayer()`.
  const [shownOn, setShownOn] = useState(pathname);
  if (shownOn !== pathname) {
    setShownOn(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [bubbles, pending]);

  if (!open) return null;
  const ctx = context(pathname);
  const lt = loose(t);
  const suggestions = [0, 1, 2].map((n) => lt(`ask.${ctx}.${n}`));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    ask(text);
    setText("");
  };

  return (
    <>
      <div
        className="overlay"
        style={{ padding: 0, background: "rgba(14,27,23,.2)" }}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside className="drawer obd" role="dialog" aria-modal="true" aria-label={t("title")}>
        <div className="obh">
          <span className="oborb">
            <i />
          </span>
          <div style={{ minWidth: 0 }}>
            <b>{t("title")}</b>
            <em>{t("status")}</em>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="round"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          >
            <HireIcon name="x" size="s" />
          </button>
        </div>
        <div className="obb" ref={body} aria-live="polite">
          <div className="obsec">
            <span>{t("todo")}</span>
            {panel && panel.todo.length > 0 ? <em>{panel.todo.length}</em> : null}
          </div>
          {panel === null ? (
            <p className="meta" style={{ margin: 0 }}>
              {t("loading")}
            </p>
          ) : panel.todo.length === 0 ? (
            <p className="meta" style={{ margin: 0 }}>
              {t("todoEmpty")}
            </p>
          ) : (
            panel.todo.slice(0, 3).map((item, i) => {
              const colour = TODO_COLOUR[item.kind];
              return (
                <Link
                  key={item.kind}
                  href={item.href}
                  className="obit"
                  style={{ "--c": colour } as React.CSSProperties}
                  onClick={() => setOpen(false)}
                >
                  <b className="obn" aria-hidden="true">
                    {i + 1}
                  </b>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b className="tr">{lt(`todoItem.${item.kind}`, { count: item.count })}</b>
                    <em className="tr">{lt(`todoSub.${item.kind}`)}</em>
                  </span>
                  <HireIcon name="chev" size="s" />
                </Link>
              );
            })
          )}
          <div className="obsec">
            <span>{t("done")}</span>
          </div>
          <div className="obdone">
            {panel && panel.done.length > 0 ? (
              panel.done.map((item) => (
                <div key={item.kind}>
                  <span className="obck">
                    <HireIcon name="check" size="s" />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b>{lt(`doneItem.${item.kind}`, { count: item.count })}</b>
                    <em>{lt(`doneSub.${item.kind}`)}</em>
                  </span>
                </div>
              ))
            ) : (
              <div>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <em>{panel ? t("doneEmpty") : t("loading")}</em>
                </span>
              </div>
            )}
          </div>
          <div className="obsec">
            <span>{t("chat")}</span>
          </div>
          <div className="bb them">
            {firstName ? t("hello", { name: firstName }) : t("helloAnon")}
          </div>
          {bubbles.map((bubble) => (
            <div key={bubble.id} className={`bb ${bubble.who}`}>
              {bubble.text.map((p, i) => (
                <p key={i} style={{ margin: i ? "6px 0 0" : 0 }}>
                  {p}
                </p>
              ))}
              {bubble.who === "them" && bubble.why ? (
                <span className="obwhy">
                  <HireIcon name="orbi" size="s" />
                  {bubble.why}
                </span>
              ) : null}
            </div>
          ))}
          {pending ? (
            <div className="bb them obtyping" aria-label={t("typing")}>
              <i />
              <i />
              <i />
            </div>
          ) : null}
        </div>
        <div className="sugg obsg">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => ask(s)} disabled={pending}>
              <HireIcon name="spark2" size="s" />
              {s}
            </button>
          ))}
        </div>
        <form className="composer obc" onSubmit={submit}>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            autoComplete="off"
            maxLength={2000}
          />
          <button className="obsend" type="submit" aria-label={t("send")} disabled={pending}>
            <HireIcon name="send" size="s" />
          </button>
        </form>
        <div className="obf">
          <HireIcon name="shield" size="s" />
          {t("rule")}
        </div>
      </aside>
    </>
  );
}
