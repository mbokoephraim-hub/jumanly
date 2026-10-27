"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { messageHelpAction } from "@/server/actions/messages-phone";
import type { HelpResult } from "@/server/services/message-help";
import { PhoneSheet } from "../sheet";
import { Spark } from "./parts";

const MODES = ["reply", "pro", "short", "english"] as const;
type Mode = (typeof MODES)[number];

/**
 * « Orbi vous aide à répondre » (planche Chat-orbi): « Proposer une réponse · Plus professionnel ·
 * Plus court · En anglais », the text Orbi writes (the person can change it), « Envoyer » and
 * « Autre version ». Nothing leaves without the person's touch on « Envoyer ». One credit of the
 * person per text, with their consent (`message_help`); without the model, a simple text.
 */
export function OrbiHelp({
  open,
  onClose,
  conversationId,
  draft,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  /** What the person had written: « Plus professionnel » and « Plus court » start from it. */
  draft: string;
  onSend: (text: string) => void;
}) {
  const t = useTranslations("phoneChat.orbiSheet");
  const tm = useTranslations("phoneMsg");
  const [mode, setMode] = useState<Mode>("reply");
  const [text, setText] = useState("");
  const [result, setResult] = useState<HelpResult | null>(null);
  const [pending, start] = useTransition();
  const opened = useRef(false);

  const ask = (next: Mode, again = false) => {
    setMode(next);
    start(async () => {
      const answer = await messageHelpAction({ conversationId, mode: next, draft, again }).catch(
        () => null,
      );
      const value = answer ?? ({ ok: false, error: "invalid" } as const);
      setResult(value);
      if (value.ok) setText(value.text);
    });
  };

  // Opening the sheet is the person's ask: Orbi proposes at once.
  useEffect(() => {
    if (!open) {
      opened.current = false;
      return;
    }
    if (opened.current) return;
    opened.current = true;

    setText("");
    setResult(null);
    ask(draft.trim() ? "pro" : "reply");
    // `ask` reads the draft of this opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const failure =
    result && !result.ok ? (result.error === "needsAi" ? t("needsAi") : tm("error")) : null;

  return (
    <PhoneSheet open={open} onClose={onClose} label={t("title")} closeLabel={tm("close")}>
      <div className="nb-ch-redige">
        <div className="nb-ch-redige-h">
          <span className="nb-ch-disque" aria-hidden>
            <Spark size={17} />
          </span>
          <span>
            <b>{t("title")}</b>
            <span>{t("sub")}</span>
          </span>
        </div>
        <div className="nb-ch-tons" role="group" aria-label={t("tones")}>
          {MODES.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              disabled={pending}
              onClick={() => ask(key)}
            >
              {t(`mode.${key}`)}
            </button>
          ))}
        </div>
        <label className="nb-ch-brouillon" data-attente={pending ? "" : undefined}>
          <span className="nb-ch-sr">{t("draft")}</span>
          <textarea
            value={pending ? t("thinking") : (failure ?? text)}
            readOnly={pending || Boolean(failure)}
            rows={4}
            maxLength={4000}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        {result?.ok && result.source === "template" ? (
          <p className="nb-ch-simple">{t("simple")}</p>
        ) : null}
        <div className="nb-ch-redige-b">
          <button
            type="button"
            className="nb-ch-envoyer-l"
            disabled={pending || !text.trim() || Boolean(failure)}
            onClick={() => {
              onSend(text.trim());
              onClose();
            }}
          >
            {t("send")}
          </button>
          <button
            type="button"
            className="nb-ch-autre"
            disabled={pending}
            onClick={() => ask(mode, true)}
          >
            {t("again")}
          </button>
        </div>
      </div>
    </PhoneSheet>
  );
}
