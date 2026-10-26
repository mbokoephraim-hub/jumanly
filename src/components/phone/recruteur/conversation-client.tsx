"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { requestDocumentAction } from "@/server/actions/hire";
import { draftMessageAction } from "@/server/actions/hire-conversation";
import {
  rhConversationAction,
  rhMuteAction,
  rhSendAction,
  rhSendTeamAction,
  rhUploadAction,
} from "@/server/actions/phone-rh-messages";
import { OrbiDisc, PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";

export type RhBubble = {
  id: string;
  mine: boolean;
  at: string;
  kind: "text" | "system" | "file" | "interview";
  text: string;
  sub?: string;
  href?: string;
  muted?: boolean;
};

export type RhThreadData = {
  /** Who writes: the organization (candidate, talent), the member (relation), a colleague. */
  kind: "organization" | "relation" | "team";
  conversationId: string;
  applicationId: string | null;
  name: string;
  initials: string;
  tint: string;
  context: string;
  open: string;
  bubbles: RhBubble[];
  templates: { key: string; title: string; body: string }[];
  canWrite: boolean;
  notice: string | null;
  muted: boolean;
  pinned: boolean;
  error: string | null;
  /** `?modeles=1` (« Modèles de message » of the file): the templates open at once. */
  start?: "templates" | null;
};

type Sheet = "templates" | "attach" | "document" | "menu" | null;

/** In three weeks, the date « À envoyer avant le » proposes by default. */
function inThreeWeeks() {
  const date = new Date(Date.now() + 21 * 86_400_000);
  return date.toISOString().slice(0, 10);
}

/**
 * A conversation of the recruiter (planches 125 to 133). « Orbi propose » writes a reply in the
 * field, to read before sending; « Modèles » puts a model in the field; « Joindre » proposes an
 * interview, asks for a document or sends a file. Nothing leaves without « Envoyer ».
 */
export function RhThread({ data }: { data: RhThreadData }) {
  const t = useTranslations("phoneRhMessages");
  const tc = useTranslations("phone");
  const [sheet, setSheet] = useState<Sheet>(data.start ?? null);
  const [text, setText] = useState("");
  const [orbi, setOrbi] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const field = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const close = () => setSheet(null);
  const organization = data.kind === "organization";

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [data.bubbles.length]);

  const use = (body: string) => {
    setText(body);
    close();
    field.current?.focus();
  };

  const propose = () => {
    setOrbi(t("orbi.thinking"));
    start(async () => {
      const result = await draftMessageAction({
        conversationId: data.conversationId,
        mode: "reply",
        text,
      }).catch(() => null);
      if (!result || !result.ok) {
        setOrbi(t("orbi.failed"));
        return;
      }
      setText(result.text);
      setOrbi(
        result.limit === "quota"
          ? t("orbi.noCredits")
          : result.limit === "entitlement"
            ? t("orbi.locked")
            : t("orbi.ready"),
      );
      field.current?.focus();
    });
  };

  return (
    <div className="nb-page nb-rm-fil">
      <header className="nb-rm-barre">
        <Link href="/app/messages" className="nb-rond" aria-label={t("thread.back")}>
          <PhoneIcon name="retour" size={20} />
        </Link>
        <span className="nb-rh-ini" data-teinte={data.tint} aria-hidden>
          {data.initials}
        </span>
        <span className="nb-rm-qui">
          <h1>{data.name}</h1>
          {data.context ? <span>{data.context}</span> : null}
        </span>
        <button
          type="button"
          className="nb-rond nb-rh-plus-menu"
          aria-label={t("thread.more")}
          aria-haspopup="dialog"
          onClick={() => setSheet("menu")}
        >
          <PhoneIcon name="plusOptions" size={24} stroke={3} />
        </button>
      </header>
      <div className="nb-rm-corps">
        {data.context ? (
          <div className="nb-rm-sujet">
            <PhoneIcon name="document" size={18} />
            <span>{data.context}</span>
            <Link href={data.open} aria-label={t("thread.openLabel", { what: data.context })}>
              {t("thread.open")}
            </Link>
          </div>
        ) : null}
        {data.bubbles.length === 0 ? (
          <p className="nb-vide">{t("thread.empty")}</p>
        ) : (
          <ol className="nb-rm-bulles">
            {data.bubbles.map((bubble) =>
              bubble.kind === "system" ? (
                <li key={bubble.id} className="nb-rm-systeme">
                  {bubble.text}
                </li>
              ) : bubble.kind === "interview" ? (
                <li key={bubble.id} className="nb-rm-rdv">
                  <PhoneIcon name="agenda" size={20} />
                  <span>
                    <b>{bubble.text}</b>
                    {bubble.sub ? <small>{bubble.sub}</small> : null}
                  </span>
                </li>
              ) : (
                <li
                  key={bubble.id}
                  className="nb-rm-bulle"
                  data-moi={bubble.mine ? "" : undefined}
                  data-retire={bubble.muted ? "" : undefined}
                >
                  {bubble.kind === "file" && bubble.href ? (
                    <a href={bubble.href} target="_blank" rel="noopener">
                      <PhoneIcon name="document" size={16} />
                      {bubble.text}
                    </a>
                  ) : (
                    <p>{bubble.text}</p>
                  )}
                  <small>{bubble.at}</small>
                </li>
              ),
            )}
          </ol>
        )}
        <div ref={end} id="dernier" />
      </div>
      <div className="nb-rm-pied">
        {data.error ? (
          <p className="nb-erreur" role="alert">
            {data.error}
          </p>
        ) : null}
        {data.canWrite ? (
          <>
            {organization ? (
              <div className="nb-rm-aides" role="group" aria-label={t("chips.label")}>
                <button type="button" className="nb-chip" onClick={propose} disabled={pending}>
                  <OrbiDisc size={18} />
                  {t("chips.orbi")}
                </button>
                <button type="button" className="nb-chip" onClick={() => setSheet("templates")}>
                  {t("chips.templates")}
                </button>
                <button type="button" className="nb-chip" onClick={() => setSheet("attach")}>
                  <PhoneIcon name="lien" size={16} />
                  {t("chips.attach")}
                </button>
              </div>
            ) : null}
            {orbi ? (
              <p className="nb-meta nb-rm-orbi" role="status">
                {orbi}
              </p>
            ) : null}
            <form
              action={data.kind === "team" ? rhSendTeamAction : rhSendAction}
              className="nb-rm-saisie"
              onSubmit={() => {
                setOrbi(null);
                setTimeout(() => setText(""), 0);
              }}
            >
              <input
                type="hidden"
                name={data.kind === "team" ? "thread" : "conversation"}
                value={data.conversationId}
              />
              <textarea
                ref={field}
                name="body"
                rows={1}
                required
                maxLength={4000}
                value={text}
                onChange={(event) => setText(event.target.value)}
                aria-label={t("thread.input")}
                placeholder={t("thread.input")}
              />
              <button type="submit" className="nb-rm-envoyer" aria-label={t("thread.send")}>
                <PhoneIcon name="envoyer" size={20} />
              </button>
            </form>
          </>
        ) : data.notice ? (
          <p className="nb-meta nb-rm-note">{data.notice}</p>
        ) : null}
      </div>

      <PhoneSheet
        open={sheet === "templates"}
        onClose={close}
        label={t("templates.title")}
        closeLabel={tc("close")}
      >
        <div className="nb-rm-feuille">
          <h2 className="nb-rh-feuille-t">{t("templates.title")}</h2>
          {data.templates.length === 0 ? (
            <p className="nb-vide">{t("templates.empty")}</p>
          ) : (
            <ul>
              {data.templates.map((template) => (
                <li key={template.key}>
                  <button type="button" className="nb-rm-choix" onClick={() => use(template.body)}>
                    <b>{template.title}</b>
                    <small>{template.body}</small>
                  </button>
                </li>
              ))}
              <li>
                <Link href="/app/hire/modeles" className="nb-rm-choix" data-lien="">
                  <b>{t("templates.manage")}</b>
                  <small>{t("templates.where")}</small>
                </Link>
              </li>
            </ul>
          )}
          <button type="button" className="nb-annuler" onClick={close}>
            {t("attach.cancel")}
          </button>
        </div>
      </PhoneSheet>

      <PhoneSheet
        open={sheet === "attach"}
        onClose={close}
        label={t("attach.title")}
        closeLabel={tc("close")}
      >
        <div className="nb-rm-feuille">
          <h2 className="nb-rh-feuille-t">{t("attach.title")}</h2>
          <ul>
            {data.applicationId ? (
              <>
                <li>
                  <Link
                    href={`/app/hire/candidats/${data.applicationId}/entretien`}
                    className="nb-rm-choix"
                  >
                    <b>{t("attach.interview")}</b>
                    <small>{t("attach.interviewLine")}</small>
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    className="nb-rm-choix"
                    onClick={() => setSheet("document")}
                  >
                    <b>{t("attach.document")}</b>
                    <small>{t("attach.documentLine")}</small>
                  </button>
                </li>
              </>
            ) : null}
            <li>
              <form action={rhUploadAction} className="nb-rm-fichier">
                <input type="hidden" name="conversation" value={data.conversationId} />
                <label className="nb-rm-choix">
                  <b>{t("attach.file")}</b>
                  <small>{t("attach.fileLine")}</small>
                  <input
                    type="file"
                    name="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      if (event.currentTarget.files?.length)
                        event.currentTarget.form?.requestSubmit();
                    }}
                  />
                </label>
              </form>
            </li>
          </ul>
          <button type="button" className="nb-annuler" onClick={close}>
            {t("attach.cancel")}
          </button>
        </div>
      </PhoneSheet>

      {data.applicationId ? (
        <PhoneSheet
          open={sheet === "document"}
          onClose={close}
          label={t("document.title")}
          closeLabel={tc("close")}
        >
          <form action={requestDocumentAction} className="nb-rh-decision">
            <h2 className="nb-rh-feuille-t">{t("document.title")}</h2>
            <input type="hidden" name="application" value={data.applicationId} />
            <input type="hidden" name="conversation" value={data.conversationId} />
            <input type="hidden" name="retour" value="conversation" />
            <label className="nb-meta" htmlFor="rm-doc-nom">
              {t("document.name")}
            </label>
            <input
              id="rm-doc-nom"
              name="name"
              required
              minLength={2}
              maxLength={120}
              placeholder={t("document.namePlaceholder")}
              className="nb-rh-zone"
            />
            <label className="nb-meta" htmlFor="rm-doc-date">
              {t("document.due")}
            </label>
            <input
              id="rm-doc-date"
              name="due"
              type="date"
              required
              defaultValue={inThreeWeeks()}
              className="nb-rh-zone"
            />
            <label className="nb-meta" htmlFor="rm-doc-note">
              {t("document.note")}
            </label>
            <textarea
              id="rm-doc-note"
              name="note"
              rows={3}
              maxLength={1000}
              className="nb-rh-zone"
            />
            <button type="submit" className="nb-bp">
              {t("document.send")}
            </button>
            <button type="button" className="nb-annuler" onClick={close}>
              {t("attach.cancel")}
            </button>
          </form>
        </PhoneSheet>
      ) : null}

      <PhoneSheet
        open={sheet === "menu"}
        onClose={close}
        label={t("menu.title")}
        closeLabel={tc("close")}
      >
        <div className="nb-rm-feuille">
          <h2 className="nb-rh-feuille-t">{t("menu.title")}</h2>
          <ul>
            <li>
              <Link href={data.open} className="nb-rm-choix">
                <b>{data.applicationId ? t("menu.file") : t("menu.profile")}</b>
              </Link>
            </li>
            {data.kind !== "team" ? (
              <li>
                <form action={rhMuteAction}>
                  <input type="hidden" name="conversation" value={data.conversationId} />
                  <input type="hidden" name="on" value={data.muted ? "0" : "1"} />
                  <button type="submit" className="nb-rm-choix">
                    <b>{data.muted ? t("menu.unmute") : t("menu.mute")}</b>
                  </button>
                </form>
              </li>
            ) : null}
            {organization ? (
              <>
                <li>
                  <form action={rhConversationAction}>
                    <input type="hidden" name="conversation" value={data.conversationId} />
                    <input type="hidden" name="action" value={data.pinned ? "unpin" : "pin"} />
                    <button type="submit" className="nb-rm-choix">
                      <b>{data.pinned ? t("menu.unpin") : t("menu.pin")}</b>
                      <small>{t("menu.pinLine")}</small>
                    </button>
                  </form>
                </li>
                <li>
                  <form action={rhConversationAction}>
                    <input type="hidden" name="conversation" value={data.conversationId} />
                    <input type="hidden" name="action" value="hide" />
                    <button type="submit" className="nb-rm-choix">
                      <b>{t("menu.hide")}</b>
                      <small>{t("menu.hideLine")}</small>
                    </button>
                  </form>
                </li>
              </>
            ) : null}
          </ul>
          <button type="button" className="nb-annuler" onClick={close}>
            {t("attach.cancel")}
          </button>
        </div>
      </PhoneSheet>
    </div>
  );
}
