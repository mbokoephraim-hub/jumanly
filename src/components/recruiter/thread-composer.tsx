"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { TalentIcon } from "@/components/talent/icon";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { sendMessageAction } from "@/server/actions/connect";
import { requestDocumentAction } from "@/server/actions/hire";
import { draftMessageAction } from "@/server/actions/hire-conversation";
import type { DraftMode } from "@/server/services/message-drafts";

export type ComposerTemplate = {
  id: string;
  kind: string;
  title: string;
  line: string;
  icon: "agenda" | "document" | "horloge" | "valider" | "message";
  tone: string;
  /** Inserted in the composer, to read before sending… */
  body?: string;
  /** …or a screen of its own (a decision is read on its page before it leaves). */
  href?: string;
};

type Labels = {
  placeholder: string;
  send: string;
  plus: string;
  orbi: string;
  chips: Record<DraftMode, string>;
  chipsLabel: string;
  draft: string;
  summaryTitle: string;
  edit: string;
  use: string;
  close: string;
  thinking: string;
  template: string;
  credits: string;
  errors: {
    empty: string;
    formalEmpty: string;
    failed: string;
    consent: string;
    quota: string;
    entitlement: string;
    unavailable: string;
  };
  plusTitle: string;
  plusSlots: string;
  plusSlotsLine: string;
  plusDocument: string;
  plusDocumentLine: string;
  plusTemplates: string;
  plusTemplatesLine: string;
  templatesTitle: string;
  templatesCreate: string;
  templatesRule: string;
  documentTitle: string;
  documentName: string;
  documentNamePlaceholder: string;
  documentDue: string;
  documentNote: string;
  documentForbidden: string;
  documentSend: string;
  sheetClose: string;
};

type Draft = { mode: DraftMode; text: string; note: string | null } | null;

/**
 * The bottom of a recruiter's conversation (planche recruteur-3 `CONV_R`, v2.3): Orbi's chips,
 * the draft card, and the composer with « + » (slots, a document, the templates). Orbi only
 * writes in the composer; the recruiter reads, changes and sends (golden rule n° 3).
 */
export function ThreadComposer({
  conversationId,
  applicationId,
  max,
  templates,
  slotsHref,
  labels,
  documentNote,
  openTemplates = false,
}: {
  conversationId: string;
  applicationId: string | null;
  max: number;
  templates: ComposerTemplate[];
  slotsHref: string | null;
  labels: Labels;
  documentNote: string;
  /** `?modeles=1` (the file's menu « Modèles de message »): the templates open at once. */
  openTemplates?: boolean;
}) {
  const field = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<Draft>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<DraftMode | null>(null);

  const put = (value: string) => {
    setText(value.slice(0, max));
    setDraft(null);
    requestAnimationFrame(() => {
      const node = field.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(node.value.length, node.value.length);
    });
  };

  const ask = (next: DraftMode) => {
    setError(null);
    if (next === "formal" && text.trim().length < 3) {
      setError(labels.errors.formalEmpty);
      return;
    }
    setMode(next);
    start(async () => {
      const result = await draftMessageAction({ conversationId, mode: next, text });
      setMode(null);
      if (!result.ok) {
        setError(result.error === "empty" ? labels.errors.empty : labels.errors.failed);
        return;
      }
      setDraft({
        mode: next,
        text: result.text,
        note: result.limit
          ? labels.errors[result.limit]
          : result.source === "template"
            ? labels.template
            : null,
      });
    });
  };

  return (
    <div className="t-r5-bas">
      {(draft || error || pending) && (
        <section className="t-r5-brou" aria-live="polite" aria-busy={pending}>
          <div className="t-r5-brou-h">
            <OrbiMark size={22} />
            <b>
              {pending
                ? labels.thinking
                : draft?.mode === "summary"
                  ? labels.summaryTitle
                  : draft
                    ? labels.draft
                    : labels.orbi}
            </b>
          </div>
          {error && <p className="t-r5-brou-e">{error}</p>}
          {draft && (
            <>
              <p className="t-texte-l">{draft.text}</p>
              {draft.note && <small>{draft.note}</small>}
              <div className="t-r5-brou-a">
                <button
                  type="button"
                  className="t-bt t-sec t-s t-press"
                  onClick={() => {
                    setDraft(null);
                    setError(null);
                  }}
                >
                  {labels.close}
                </button>
                {draft.mode !== "summary" && (
                  <button
                    type="button"
                    className="t-bt t-p t-s t-press"
                    onClick={() => put(draft.text)}
                  >
                    {labels.use}
                  </button>
                )}
              </div>
            </>
          )}
          {error && !draft && (
            <div className="t-r5-brou-a">
              <button
                type="button"
                className="t-bt t-sec t-s t-press"
                onClick={() => setError(null)}
              >
                {labels.close}
              </button>
            </div>
          )}
        </section>
      )}

      <div className="t-r5-och" role="group" aria-label={labels.chipsLabel}>
        {(["reply", "summary", "formal"] as const).map((chip) => (
          <button
            key={chip}
            type="button"
            className="t-press"
            disabled={pending}
            aria-pressed={mode === chip}
            onClick={() => ask(chip)}
          >
            {chip === "reply" && <OrbiMark size={16} />}
            {labels.chips[chip]}
          </button>
        ))}
        <small className="sr-only">{labels.credits}</small>
      </div>

      <form action={sendMessageAction} className="t-r5-form" onSubmit={() => setDraft(null)}>
        <div className="t-verre t-fort t-compo">
          <SheetButton target="r5-plus" className="t-bi t-press" label={labels.plus}>
            <TalentIcon name="plus" size="s" />
          </SheetButton>
          <input type="hidden" name="conversation" value={conversationId} />
          <label htmlFor="r5-corps" className="sr-only">
            {labels.placeholder}
          </label>
          <textarea
            ref={field}
            id="r5-corps"
            name="body"
            required
            rows={1}
            maxLength={max}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={labels.placeholder}
            autoComplete="off"
            enterKeyHint="send"
          />
          <button
            type="button"
            className="t-bi t-r5-ob t-press"
            aria-label={labels.orbi}
            disabled={pending}
            onClick={() => ask("reply")}
          >
            <OrbiMark size={24} />
          </button>
          <button type="submit" className="t-bi t-env t-press" aria-label={labels.send}>
            <TalentIcon name="envoyer" size="s" />
          </button>
        </div>
      </form>

      <Sheet id="r5-plus" title={labels.plusTitle} closeLabel={labels.sheetClose}>
        <ul className="t-verre t-liste t-lignes">
          {slotsHref && (
            <li>
              <Link href={slotsHref} className="t-li t-press">
                <span className="t-cases t-c2" aria-hidden>
                  <TalentIcon name="agenda" size="s" />
                </span>
                <span className="t-t">
                  <b>{labels.plusSlots}</b>
                  <span>{labels.plusSlotsLine}</span>
                </span>
                <TalentIcon name="suivant" />
              </Link>
            </li>
          )}
          {applicationId && (
            <li>
              <SheetButton target="r5-document" className="t-li t-press">
                <span className="t-cases t-c1" aria-hidden>
                  <TalentIcon name="document" size="s" />
                </span>
                <span className="t-t">
                  <b>{labels.plusDocument}</b>
                  <span>{labels.plusDocumentLine}</span>
                </span>
                <TalentIcon name="suivant" />
              </SheetButton>
            </li>
          )}
          <li>
            <SheetButton target="r5-modeles" className="t-li t-press">
              <span className="t-cases t-c3" aria-hidden>
                <TalentIcon name="message" size="s" />
              </span>
              <span className="t-t">
                <b>{labels.plusTemplates}</b>
                <span>{labels.plusTemplatesLine}</span>
              </span>
              <TalentIcon name="suivant" />
            </SheetButton>
          </li>
        </ul>
      </Sheet>

      <Sheet
        id="r5-modeles"
        title={labels.templatesTitle}
        closeLabel={labels.sheetClose}
        openParam="modeles"
        defaultOpen={openTemplates}
      >
        <ul className="t-verre t-liste t-lignes">
          {templates.map((template) => {
            const inside = (
              <>
                <span className={cx("t-cases", template.tone)} aria-hidden>
                  <TalentIcon name={template.icon} size="s" />
                </span>
                <span className="t-t">
                  <b>{template.title}</b>
                  <span>{template.line}</span>
                </span>
                <TalentIcon name="suivant" />
              </>
            );
            return (
              <li key={template.id}>
                {template.href ? (
                  <Link href={template.href} className="t-li t-press">
                    {inside}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="t-li t-press"
                    onClick={(event) => {
                      event.currentTarget.closest("dialog")?.close();
                      put(template.body ?? "");
                    }}
                  >
                    {inside}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="t-gar">
          <TalentIcon name="confidentialite" size="s" />
          <span>{labels.templatesRule}</span>
        </p>
        <Link href="/app/hire/modeles" className="t-bt t-sec t-m t-pl t-press">
          {labels.templatesCreate}
        </Link>
      </Sheet>

      {applicationId && (
        <Sheet id="r5-document" title={labels.documentTitle} closeLabel={labels.sheetClose}>
          <form action={requestDocumentAction} className="t-flux">
            <input type="hidden" name="application" value={applicationId} />
            <input type="hidden" name="conversation" value={conversationId} />
            <input type="hidden" name="retour" value="conversation" />
            <div className="t-champ">
              <label htmlFor="r5-doc-nom">{labels.documentName}</label>
              <input
                id="r5-doc-nom"
                name="name"
                required
                minLength={2}
                maxLength={120}
                placeholder={labels.documentNamePlaceholder}
                className="t-saisie"
              />
            </div>
            <div className="t-champ">
              <label htmlFor="r5-doc-date">{labels.documentDue}</label>
              <input id="r5-doc-date" name="due" type="date" required className="t-saisie" />
            </div>
            <div className="t-champ">
              <label htmlFor="r5-doc-note">{labels.documentNote}</label>
              <textarea
                id="r5-doc-note"
                name="note"
                rows={4}
                maxLength={1000}
                defaultValue={documentNote}
                className="t-verre t-zone"
              />
            </div>
            <p className="t-gar">
              <TalentIcon name="confidentialite" size="s" />
              <span>{labels.documentForbidden}</span>
            </p>
            <button type="submit" className="t-bt t-p t-m t-pl t-press">
              {labels.documentSend}
            </button>
          </form>
        </Sheet>
      )}
    </div>
  );
}
