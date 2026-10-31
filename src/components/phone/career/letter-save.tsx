"use client";

import Link from "next/link";
import { useState } from "react";
import { PhoneIcon } from "../icon";

/** Downloads the PDF answered by the server under its own file name. */
async function download(url: string) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok || !response.headers.get("Content-Type")?.includes("application/pdf"))
    throw new Error("export");
  const blob = await response.blob();
  const name =
    /filename="([^"]+)"/.exec(response.headers.get("Content-Disposition") ?? "")?.[1] ??
    "lettre.pdf";
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 30_000);
}

/**
 * « Enregistrer cette lettre » (Ephraïm, 31/10/2026): the PDF downloads at once, then a card says
 * the letter is in Mes documents, with the way back to them.
 */
export function LetterSave({
  pdf,
  back,
  texts,
}: {
  pdf: string;
  back: string;
  texts: {
    save: string;
    saving: string;
    error: string;
    title: string;
    text: string;
    backLabel: string;
  };
}) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  return (
    <>
      {state === "error" ? (
        <p className="nb-lt-note" role="alert">
          {texts.error}
        </p>
      ) : null}
      <button
        type="button"
        className="nb-lt-bt"
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          try {
            await download(pdf);
            setState("done");
          } catch {
            setState("error");
          }
        }}
      >
        <PhoneIcon name="telecharger" size={20} />
        {state === "busy" ? texts.saving : texts.save}
      </button>
      {state === "done" ? (
        <div className="nb-lt-accueil">
          <div
            className="nb-lt-carte nb-lt-fini"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lm-fini-t"
          >
            <span className="nb-lt-fini-i" aria-hidden>
              <PhoneIcon name="coche" size={30} stroke={2.6} />
            </span>
            <h2 id="lm-fini-t">{texts.title}</h2>
            <p>{texts.text}</p>
            <Link href={back} className="nb-lt-bt" autoFocus>
              <PhoneIcon name="document" size={20} />
              {texts.backLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
