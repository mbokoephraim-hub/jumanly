"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { cx } from "@/lib/cx";
import { initialsOf } from "@/components/recruiter/candidates";

export type ReplyPerson = { id: string; name: string; firstName: string; strength: string };

/** The template filled for one person, the same rule as the server (`personalize`). */
function fill(body: string, person: ReplyPerson, values: { jobTitle: string; company: string }) {
  return body.replace(/\{(prenom|point_fort|poste|entreprise)\}/g, (_, key: string) =>
    key === "prenom"
      ? person.firstName
      : key === "point_fort"
        ? person.strength
        : key === "poste"
          ? values.jobTitle
          : values.company,
  );
}

const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * « Répondre aux candidats » (planches `ENV`, `ENV_OK`, `MSG_LONG`, `MSG_REFUS`): the template the
 * member reads and changes, the channels, each person's message before it leaves (« Aperçus »), the
 * mandatory « J'ai relu », then the confirmation with the number. Nothing is sent from here before
 * the last button.
 */
export function GroupReplyForm({
  action,
  jobId,
  group,
  ids,
  people,
  defaultBody,
  values,
  retained,
  labels,
  web,
  lead,
}: {
  action: (formData: FormData) => void | Promise<void>;
  jobId: string;
  group: string;
  ids: string;
  people: ReplyPerson[];
  defaultBody: string;
  values: { jobTitle: string; company: string; signer: string; initials: string };
  retained: boolean;
  labels: {
    channels: string;
    message: string;
    messageLocked: string;
    email: string;
    template: string;
    variables: string;
    orbi: string;
    reviewed: string;
    previews: string;
    send: string;
    confirmTitle: string;
    confirmGroup: string;
    confirmChannels: string;
    confirmChannelsEmail: string;
    undo: string;
    undoText: string;
    confirmReviewed: string;
    back: string;
    confirm: string;
    previewTitle: string;
    previewFor: string;
    badge: string;
    cta: string;
    reply: string;
    alsoEmail: string;
    subject: string;
    previous: string;
    next: string;
    close: string;
    needReviewed: string;
    recipients: string;
  };
  /** On a computer or a tablet (planche web recruteur-4 § 4): the head, the live preview. */
  web: {
    title: string;
    sub: string;
    subEmail: string;
    previewHead: string;
    peopleAria: string;
    more: string;
    seeEmail: string;
    cancel: string;
    cancelHref: string;
    windowTitle: string;
    windowSub: string;
    windowSubEmail: string;
    inJumanly: string;
    byEmail: string;
    emailLoading: string;
    emailError: string;
    emailFrame: string;
  };
  /** The groups and the notices, at the top of the form's first column. */
  lead?: ReactNode;
}) {
  const [body, setBody] = useState(defaultBody);
  const [email, setEmail] = useState(true);
  const [reviewed, setReviewed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [index, setIndex] = useState(0);
  const [warn, setWarn] = useState(false);
  const [mail, setMail] = useState<{ key: string; html?: string; failed?: boolean } | null>(null);
  const person = people[index] ?? people[0];
  const count = people.length;
  const n = (text: string) => text.replaceAll("#", String(count));
  const shown = people.slice(0, 12);

  // The e-mail of the person on screen, rendered by the server from the letter as it is now.
  const openWindow = async () => {
    const dialog = document.getElementById("rh6-apercu-web");
    if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal();
    if (!email || !person) return;
    const key = `${person.id}:${body}`;
    if (mail?.key === key && mail.html) return;
    setMail({ key });
    try {
      const response = await fetch("/api/hire/reponses/apercu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: jobId,
          group,
          ids: ids ? ids.split(",") : [],
          application: person.id,
          body,
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { html: string };
      setMail({ key, html: data.html });
    } catch {
      setMail({ key, failed: true });
    }
  };

  const letter = person && (
    <article className="t-r6-long">
      <div className="t-h">
        <span className="t-r6-lg" aria-hidden>
          {values.initials}
        </span>
        <div className="t-t">
          <b>{values.company}</b>
          {values.signer} · {values.jobTitle}
        </div>
        <span className={cx("t-r6-ret", !retained && "t-off")}>{labels.badge}</span>
      </div>
      {paragraphs(fill(body, person, values)).map((item, at) => (
        <p key={at} className="t-texte-l">
          {item}
        </p>
      ))}
      <div className="t-cta" aria-hidden>
        <span className="t-bt t-p t-s">{labels.cta}</span>
        {retained && <span className="t-bt t-sec t-s">{labels.reply}</span>}
      </div>
    </article>
  );

  const reviewBox = (
    <label className="t-r6-relu t-press">
      <input
        type="checkbox"
        name="relu"
        checked={reviewed}
        onChange={(event) => {
          setReviewed(event.target.checked);
          setWarn(false);
        }}
      />
      <span>{n(labels.reviewed)}</span>
    </label>
  );
  const warning = warn && (
    <p role="alert" className="t-gar t-err">
      <TalentIcon name="aide" size="s" />
      <span>{labels.needReviewed}</span>
    </p>
  );
  const sendButton = (className: string) =>
    reviewed ? (
      <SheetButton target="rh6-confirmer" className={className}>
        <TalentIcon name="envoyer" size="s" />
        {n(labels.send)}
      </SheetButton>
    ) : (
      <button type="button" className={className} onClick={() => setWarn(true)}>
        <TalentIcon name="envoyer" size="s" />
        {n(labels.send)}
      </button>
    );

  return (
    <form action={action} className="t-flux t-r6 t-rw-rf">
      <input type="hidden" name="job" value={jobId} />
      <input type="hidden" name="groupe" value={group} />
      <input type="hidden" name="ids" value={ids} />

      <div className="t-rw-web t-rw-rh">
        <h1>{web.title}</h1>
        <p>{email ? web.subEmail : web.sub}</p>
      </div>

      <div className="t-rw-rp">
        <div className="t-rw-rpl">
          {lead}

          <fieldset className="t-fs t-flux t-serre">
            <legend className="t-lab-c">{labels.channels}</legend>
            <div className="t-puces">
              <span className="t-puce t-on" aria-label={labels.messageLocked}>
                <TalentIcon name="valider" size="xs" />
                {labels.message}
              </span>
              <label className={cx("t-puce t-press", email && "t-on")}>
                <input
                  type="checkbox"
                  name="email"
                  checked={email}
                  onChange={(event) => setEmail(event.target.checked)}
                  className="sr-only"
                />
                {email && <TalentIcon name="valider" size="xs" />}
                {labels.email}
              </label>
            </div>
          </fieldset>

          <div className="t-champ">
            <label htmlFor="rh6-body" className="t-lab-c">
              {labels.template}
            </label>
            <span className="t-verre t-saisie t-r6-env">
              <textarea
                id="rh6-body"
                name="body"
                rows={10}
                maxLength={4000}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </span>
            <small className="t-aide">{labels.variables}</small>
          </div>

          <div className="t-rx-orbi">
            <OrbiMark size={26} />
            <p className="t-t">{labels.orbi}</p>
          </div>

          <details className="t-verre t-r6-dest">
            <summary className="t-press">{n(labels.recipients)}</summary>
            <ul>
              {people.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          </details>

          <div className="t-rw-m">
            {reviewBox}
            {warning}
          </div>
        </div>

        {person && (
          <section className="t-rw-web t-rw-rpr" aria-labelledby="rh6-apercu-h">
            <div className="t-rw-sect">
              <h2 id="rh6-apercu-h">
                {web.previewHead
                  .replace("{index}", String(index + 1))
                  .replace("{count}", String(count))}
              </h2>
              {count > 1 && (
                <button
                  type="button"
                  className="t-press"
                  onClick={() => setIndex((index + 1) % count)}
                >
                  {labels.next}
                </button>
              )}
            </div>
            <ul className="t-rw-rpp" aria-label={web.peopleAria}>
              {shown.map((item, at) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cx("t-press", at === index && "t-on")}
                    aria-pressed={at === index}
                    onClick={() => setIndex(at)}
                  >
                    <i aria-hidden>{initialsOf(item.name)}</i>
                    {item.firstName}
                  </button>
                </li>
              ))}
              {count > shown.length && (
                <li className="t-plus">
                  {web.more.replace("{count}", String(count - shown.length))}
                </li>
              )}
            </ul>
            {letter}
            <button type="button" className="t-bt t-sec t-s t-press t-rw-rpe" onClick={openWindow}>
              <TalentIcon name="document" size="xs" />
              {web.seeEmail}
            </button>
            {reviewBox}
            {warning}
            <div className="t-rw-rpa">
              <Link href={web.cancelHref} className="t-bt t-sec t-m t-press">
                {web.cancel}
              </Link>
              {sendButton("t-bt t-p t-m t-press t-rw-dk")}
            </div>
          </section>
        )}
      </div>

      <div className="t-verre t-fort t-bas-f t-rw-tel">
        <SheetButton target="rh6-apercu" className="t-bt t-sec t-m t-press">
          {labels.previews}
        </SheetButton>
        {sendButton("t-bt t-p t-pl t-press")}
      </div>

      <Sheet id="rh6-apercu" title={labels.previewTitle} closeLabel={labels.close}>
        {person && (
          <div className="t-flux t-serre">
            <span className="t-lab-c">{labels.previewFor.replace("{name}", person.firstName)}</span>
            {letter}
            {email && (
              <div className="t-verre t-r6-mail">
                <span className="t-th" aria-hidden>
                  <i />
                  <u />
                  <u />
                </span>
                <div className="t-t">
                  <b>{labels.alsoEmail}</b>
                  {labels.subject}
                </div>
              </div>
            )}
            {count > 1 && (
              <div className="t-r6-nav">
                <button
                  type="button"
                  className="t-bt t-sec t-s t-press"
                  onClick={() => setIndex((index - 1 + count) % count)}
                >
                  {labels.previous}
                </button>
                <span>
                  {index + 1} / {count}
                </span>
                <button
                  type="button"
                  className="t-bt t-sec t-s t-press"
                  onClick={() => setIndex((index + 1) % count)}
                >
                  {labels.next}
                </button>
              </div>
            )}
          </div>
        )}
      </Sheet>

      {person && (
        <Sheet
          id="rh6-apercu-web"
          title={web.windowTitle}
          closeLabel={labels.close}
          className="t-rw-mailw"
        >
          <div className="t-flux t-serre">
            <p className="t-rw-mailw-s">
              {(email ? web.windowSubEmail : web.windowSub).replace("{name}", person.firstName)}
            </p>
            <div className="t-rw-mailw-c">
              <div className="t-flux t-serre">
                <span className="t-lab-c">{web.inJumanly}</span>
                {letter}
              </div>
              {email && (
                <div className="t-flux t-serre">
                  <span className="t-lab-c">{web.byEmail}</span>
                  {mail?.html ? (
                    <iframe
                      title={web.emailFrame.replace("{name}", person.firstName)}
                      sandbox=""
                      srcDoc={mail.html}
                      className="t-rw-mailf"
                    />
                  ) : (
                    <p className="t-verre t-rc-rien" role="status">
                      {mail?.failed ? web.emailError : web.emailLoading}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Sheet>
      )}

      <Sheet id="rh6-confirmer" title={n(labels.confirmTitle)} closeLabel={labels.close}>
        <div className="t-flux t-serre">
          <ul className="t-verre t-liste t-lignes">
            <li className="t-li">
              <span className="t-cases" aria-hidden>
                <TalentIcon name="message" size="s" />
              </span>
              <span className="t-t">
                <b>{n(labels.confirmGroup)}</b>
                <span>{email ? labels.confirmChannelsEmail : labels.confirmChannels}</span>
              </span>
            </li>
            <li className="t-li">
              <span className="t-cases t-c2" aria-hidden>
                <TalentIcon name="horloge" size="s" />
              </span>
              <span className="t-t">
                <b>{labels.undo}</b>
                <span>{labels.undoText}</span>
              </span>
            </li>
          </ul>
          <label className="t-r6-relu t-press">
            <input
              type="checkbox"
              name="confirme"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>{n(labels.confirmReviewed)}</span>
          </label>
          <div className="t-rx-feuille-bts">
            <SheetButton target="rh6-apercu" className="t-bt t-sec t-m t-press">
              {labels.back}
            </SheetButton>
            <button type="submit" className="t-bt t-p t-press" disabled={!confirmed || !reviewed}>
              {labels.confirm}
            </button>
          </div>
        </div>
      </Sheet>
    </form>
  );
}
