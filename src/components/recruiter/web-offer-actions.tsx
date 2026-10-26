"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { PhoneIcon } from "@/components/phone/icon";
import { closeJobAction } from "@/server/actions/hire";

/** A button that opens its own dialog (`showModal`), closed by Échap, « Annuler » or a click out. */
function DialogButton({
  label,
  className,
  title,
  icon,
  children,
}: {
  label: string;
  className: string;
  title: string;
  icon?: ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {icon}
        {label}
      </button>
      <dialog
        ref={dialog}
        className="rb-modal"
        aria-label={title}
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="rb-boite rb-boite-g">{children(close)}</div>
      </dialog>
    </>
  );
}

/** « Partager »: copy the public link, write to WhatsApp, or publish it in the Fil. */
export function ShareOfferButton({
  url,
  title,
  labels,
}: {
  url: string;
  title: string;
  labels: {
    share: string;
    title: string;
    copy: string;
    copied: string;
    whatsapp: string;
    fil: string;
    filHint: string;
    cancel: string;
  };
}) {
  return (
    <DialogButton
      label={labels.share}
      title={labels.title}
      className="rb-btn2 t-press"
      icon={<PhoneIcon name="partager" size={18} stroke={1.8} />}
    >
      {(close) => (
        <>
          <h2>{labels.title}</h2>
          <p className="rb-meta rb-url">{url.replace(/^https?:\/\//, "")}</p>
          <div className="rb-liste-b">
            <button
              type="button"
              className="rb-rowl t-press"
              data-value={url}
              onClick={async () => {
                await navigator.clipboard?.writeText(url).catch(() => undefined);
                showToast({ message: labels.copied, tone: "success" });
                close();
              }}
            >
              <span className="rb-rowl-t">
                <b>{labels.copy}</b>
              </span>
            </button>
            <a
              className="rb-rowl"
              href={`https://wa.me/?text=${encodeURIComponent(`${title} · ${url}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="rb-rowl-t">
                <b>{labels.whatsapp}</b>
              </span>
            </a>
            <a className="rb-rowl" href="/app/hire/fil">
              <span className="rb-rowl-t">
                <b>{labels.fil}</b>
                <span className="rb-meta">{labels.filHint}</span>
              </span>
            </a>
          </div>
          <button type="button" className="rb-btn2 t-press" onClick={close}>
            {labels.cancel}
          </button>
        </>
      )}
    </DialogButton>
  );
}

/** « Clôturer », confirmed: the offer leaves the search, its applications stay readable. */
export function CloseOfferButton({
  jobId,
  labels,
}: {
  jobId: string;
  labels: { close: string; title: string; text: string; confirm: string; cancel: string };
}) {
  return (
    <DialogButton label={labels.close} title={labels.title} className="rb-btn2 t-press">
      {(close) => (
        <>
          <h2>{labels.title}</h2>
          <p className="rb-meta">{labels.text}</p>
          <div className="rb-boite-act">
            <button type="button" className="rb-btn2 t-press" onClick={close}>
              {labels.cancel}
            </button>
            <form action={closeJobAction}>
              <input type="hidden" name="id" value={jobId} />
              <button type="submit" className="rb-btn rb-danger t-press">
                {labels.confirm}
              </button>
            </form>
          </div>
        </>
      )}
    </DialogButton>
  );
}
