"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { messageHelpAction } from "@/server/actions/messages-phone";
import type { HelpResult } from "@/server/services/message-help";
import { OrbiDisc } from "../icon";
import { PhoneSheet } from "../sheet";

const MODES = ["reply", "pro", "short", "fix", "english"] as const;
type Mode = (typeof MODES)[number];

/**
 * Orbi helps to write (planche Messages-orbi): « Proposer une réponse », « Plus professionnel »,
 * « Plus court », « Corriger les fautes », « Traduire en anglais ». Orbi writes a text; « Utiliser »
 * puts it in the field, where the person reads it, changes it and sends it, or not.
 */
export function OrbiHelp({
  open,
  onClose,
  conversationId,
  name,
  draft,
  onUse,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  name: string;
  draft: string;
  onUse: (text: string) => void;
}) {
  const t = useTranslations("phoneMsg.help");
  const tm = useTranslations("phoneMsg");
  const [mode, setMode] = useState<Mode | null>(null);
  const [result, setResult] = useState<HelpResult | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a closed sheet starts again
    setMode(null);
    setResult(null);
  }, [open]);

  const ask = (next: Mode, again = false) => {
    setMode(next);
    setResult(null);
    start(async () => {
      const answer = await messageHelpAction({ conversationId, mode: next, draft, again }).catch(
        () => null,
      );
      setResult(answer ?? { ok: false, error: "invalid" });
    });
  };

  const text = result?.ok ? result.text : null;
  const failure =
    result && !result.ok
      ? result.error === "empty"
        ? t("fixEmpty")
        : result.error === "needsAi"
          ? t("needsAi")
          : tm("error")
      : null;

  return (
    <PhoneSheet open={open} onClose={onClose} label={t("title")} closeLabel={tm("close")}>
      <div className="nb-ms-orbi">
        <div className="nb-ms-orbi-h">
          <OrbiDisc size={44} />
          <span>
            <b>{t("title")}</b>
            <span className="nb-meta">{t("for", { name })}</span>
          </span>
        </div>
        {draft.trim() ? <p className="nb-ms-votre">{t("yours", { text: draft.trim() })}</p> : null}
        <div className="nb-ms-puces">
          {MODES.map((key) => (
            <button
              key={key}
              type="button"
              className="nb-chip"
              aria-pressed={mode === key}
              disabled={pending}
              onClick={() => ask(key)}
            >
              {t(`mode.${key}`)}
            </button>
          ))}
        </div>
        {pending ? (
          <p className="nb-meta nb-ms-orbi-att" aria-live="polite">
            {t("thinking")}
          </p>
        ) : null}
        {text ? (
          <div className="nb-ms-orbi-rep" aria-live="polite">
            <p>{text}</p>
            {result?.ok && result.source === "template" ? (
              <p className="nb-meta">{t("simple")}</p>
            ) : null}
            <div className="nb-ms-orbi-b">
              <button
                type="button"
                className="nb-ms-utiliser"
                onClick={() => {
                  onUse(text);
                  onClose();
                }}
              >
                {t("use")}
              </button>
              <button
                type="button"
                className="nb-bs"
                disabled={pending}
                onClick={() => ask("reply", true)}
              >
                {t("again")}
              </button>
            </div>
          </div>
        ) : null}
        {failure ? (
          <p className="nb-ms-orbi-rep nb-meta" aria-live="polite">
            {failure}
          </p>
        ) : null}
        <p className="nb-meta nb-ms-decide">{t("decide")}</p>
      </div>
    </PhoneSheet>
  );
}
