"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { voiceAdapter } from "@/lib/voice";
import { askOrbiAction } from "@/server/actions/orbi";
import { MESSAGE_MAX, orbiActions, type OrbiReply } from "@/lib/orbi";
import { BackButton } from "./back-button";
import { TalentIcon } from "./icon";
import { OrbiMark } from "./orbi-mark";

type Turn = OrbiReply | { id: string; role: "error"; text: string };

/**
 * Orbi as a conversation page (talent lot 4 § 9): back arrow, Orbi and the credits left, the
 * history; the four aids (`children`); the exchange; the composer in place of the bottom bar.
 * A new exchange starts without `?c=`; the first answer puts its id in the address, so a reload or
 * the history finds it again. Texts come from `talentOrbi` (NextIntlClientProvider).
 */
export function OrbiChat({
  conversationId: initialId,
  messages,
  credits: initialCredits,
  children,
}: {
  conversationId: string | null;
  messages: OrbiReply[];
  /** Credits left this month, null when unlimited. */
  credits: number | null;
  children: ReactNode;
}) {
  const t = useTranslations("talentOrbi");
  const [conversationId, setConversationId] = useState(initialId);
  const [turns, setTurns] = useState<Turn[]>(messages);
  const [credits, setCredits] = useState(initialCredits);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [canListen, setCanListen] = useState(false);
  const [listening, setListening] = useState(false);
  const stopListening = useRef<(() => void) | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const counter = useRef(0);

  // Dictation only where the browser can (known after the first paint, never on the server).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a browser capability
    setCanListen(voiceAdapter().canListen);
    return () => stopListening.current?.();
  }, []);

  useEffect(() => {
    if (turns.length > 0 || pending) end.current?.scrollIntoView({ block: "end" });
  }, [turns, pending]);

  const localId = () => `local-${(counter.current += 1)}`;

  const send = () => {
    const value = text.trim();
    if (pending) return;
    if (value.length < 2 || value.length > MESSAGE_MAX) {
      setTurns((list) => [...list, { id: localId(), role: "error", text: t("error.invalid") }]);
      return;
    }
    stopListening.current?.();
    const optimistic: OrbiReply = {
      id: localId(),
      role: "user",
      text: [value],
      actions: [],
      why: null,
      source: null,
      limit: null,
      createdAt: new Date(),
    };
    setTurns((list) => [...list, optimistic]);
    setText("");
    start(async () => {
      const result = await askOrbiAction({
        conversationId: conversationId ?? undefined,
        text: value,
      }).catch(() => ({ ok: false as const, error: "failed" as const }));
      if (!result.ok) {
        setTurns((list) => [
          ...list,
          { id: localId(), role: "error", text: t(`error.${result.error}`) },
        ]);
        if (result.error === "notFound") setConversationId(null);
        return;
      }
      setTurns((list) => [
        ...list.map((turn) => (turn.id === optimistic.id ? result.question : turn)),
        result.answer,
      ]);
      if (result.answer.source === "ai" && credits !== null)
        setCredits((left) => (left === null ? null : Math.max(0, left - 1)));
      if (result.conversationId !== conversationId) {
        setConversationId(result.conversationId);
        window.history.replaceState(
          window.history.state,
          "",
          `/app/orbi?c=${result.conversationId}`,
        );
      }
    });
  };

  const dictate = () => {
    if (listening) {
      stopListening.current?.();
      return;
    }
    const before = text ? `${text.trimEnd()} ` : "";
    setListening(true);
    stopListening.current = voiceAdapter().listen({
      onText: (spoken) => setText(`${before}${spoken}`.slice(0, MESSAGE_MAX)),
      onEnd: () => {
        setListening(false);
        stopListening.current = null;
      },
      onError: () => {
        setListening(false);
        stopListening.current = null;
      },
    });
  };

  return (
    <>
      <div className="t-or-tete t-tete">
        <BackButton fallback="/app" label={t("back")} />
        <OrbiMark size={40} state={pending ? "reflechit" : listening ? "ecoute" : "repos"} />
        <div className="t-t">
          <b>{t("title")}</b>
          <span aria-label={credits === null ? undefined : t("creditsAria", { count: credits })}>
            {credits === null ? t("creditsUnlimited") : t("credits", { count: credits })}
          </span>
        </div>
        <Link href="/app/orbi/historique" className="t-bi" aria-label={t("history")}>
          <TalentIcon name="horloge" />
        </Link>
      </div>

      {children}

      <section
        aria-label={t("chat.aria")}
        aria-live="polite"
        aria-busy={pending}
        className="t-orbi-fil"
      >
        {turns.length === 0 && (
          <div className="t-bulle-o">
            <OrbiMark size={32} />
            <div className="t-verre t-corps">
              <p>{t("intro")}</p>
            </div>
          </div>
        )}
        {turns.map((turn) =>
          turn.role === "user" ? (
            <div key={turn.id} className="t-bulle-u">
              <span className="sr-only">{t("chat.you")}</span>
              {turn.text.join("\n\n")}
            </div>
          ) : turn.role === "error" ? (
            <p key={turn.id} role="alert" className="t-aide t-err">
              {turn.text}
            </p>
          ) : (
            <OrbiAnswer key={turn.id} answer={turn} />
          ),
        )}
        {pending && (
          <div className="t-bulle-o">
            <OrbiMark size={32} state="reflechit" />
            <div className="t-verre t-corps">
              <p className="t-pense">{t("chat.thinking")}</p>
            </div>
          </div>
        )}
        <div ref={end} />
      </section>

      <form
        className="t-orbi-compo-f"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <div className="t-verre t-fort t-compo">
          <Link
            href="/app/orbi"
            className="t-bi"
            aria-label={t("newChat")}
            onClick={(event) => {
              event.preventDefault();
              if (pending) return;
              setTurns([]);
              setConversationId(null);
              window.history.replaceState(window.history.state, "", "/app/orbi");
            }}
          >
            <TalentIcon name="plus" size="s" />
          </Link>
          <input
            type="text"
            name="message"
            value={text}
            maxLength={MESSAGE_MAX}
            autoComplete="off"
            enterKeyHint="send"
            aria-label={t("composer.label")}
            placeholder={t("composer.placeholder")}
            onChange={(event) => setText(event.target.value)}
          />
          {canListen && (
            <button
              type="button"
              className="t-bi"
              aria-pressed={listening}
              aria-label={listening ? t("composer.stopDictate") : t("composer.dictate")}
              onClick={dictate}
            >
              <TalentIcon name="micro" size="s" />
            </button>
          )}
          <button
            type="submit"
            className="t-bi t-env"
            disabled={pending}
            aria-busy={pending || undefined}
            aria-label={t("composer.send")}
          >
            <TalentIcon name="envoyer" size="s" />
          </button>
        </div>
        <p className="t-orbi-pied">{t("composer.footer")}</p>
      </form>
    </>
  );
}

const plansLimits = new Set(["entitlement", "quota"]);

function OrbiAnswer({ answer }: { answer: OrbiReply }) {
  const t = useTranslations("talentOrbi");
  return (
    <div className="t-bulle-o">
      <OrbiMark size={32} />
      <div className="t-verre t-corps">
        <span className="sr-only">{t("chat.orbi")}</span>
        {answer.text.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        {answer.limit && (
          <p className="t-source">
            {t(`limit.${answer.limit}`)}{" "}
            {answer.limit === "consent" ? (
              <Link href="/app/parametres?onglet=confidentialite" className="underline">
                {t("limitLink.consent")}
              </Link>
            ) : plansLimits.has(answer.limit) ? (
              <Link href="/app/abonnement" className="underline">
                {t("limitLink.plans")}
              </Link>
            ) : null}
          </p>
        )}
        <div className="t-acts">
          {answer.actions.map((action, index) => (
            <Link
              key={action}
              href={orbiActions[action]}
              className={index === 0 ? "t-bt t-p t-s" : "t-bt t-sec t-s"}
            >
              {t(`actions.${action}`)}
            </Link>
          ))}
          {answer.why && (
            <details className="t-orbi-pq">
              <summary className="t-pq">
                <TalentIcon name="pourquoi" />
                {t("why")}
              </summary>
              <p>{answer.why}</p>
              <p>{t(answer.source === "ai" ? "source.ai" : "source.rules")}</p>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
