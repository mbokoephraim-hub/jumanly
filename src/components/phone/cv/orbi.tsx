"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { prepareCvWithOrbiAction } from "@/server/actions/cv-flow";
import { PhoneIcon } from "../icon";
import { CvFrame } from "./frame";
import { OrbiSpark } from "./marks";

/** The time each line of Orbi's work stays « en cours » before the next one (reduced: none). */
const STEP_MS = 650;

/**
 * « Orbi prépare votre CV » (capture 12): the CV is made on the server at once (the profile,
 * the Cap, the template Orbi picks, a summary proposed); the lines say what was done, one after
 * the other, then « Voir le contenu ». The address keeps the CV made: coming back does not make
 * another one.
 */
export function CvOrbiPrepare({
  done: madeAlready,
  lines,
}: {
  /** The CV already made from this screen (`?cv=`), when coming back to it. */
  done: string | null;
  lines: string[];
}) {
  const t = useTranslations("phoneCv");
  const router = useRouter();
  const started = useRef(false);
  const [cvId, setCvId] = useState(madeAlready);
  const [failed, setFailed] = useState<null | "limit" | "error">(null);
  const [noSummary, setNoSummary] = useState(false);
  const [shown, setShown] = useState(madeAlready ? lines.length : 0);

  useEffect(() => {
    if (started.current || madeAlready) return;
    started.current = true;
    prepareCvWithOrbiAction()
      .then((result) => {
        if (!result.ok) return setFailed("limit");
        setCvId(result.id);
        setNoSummary(result.orbi !== "done");
        router.replace(`/app/career/cv/nouveau?etape=orbi&cv=${result.id}`, { scroll: false });
      })
      .catch(() => setFailed("error"));
  }, [madeAlready, router]);

  // The lines tick one by one; the last one waits for the CV.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (shown >= lines.length - 1 && !cvId) return;
    if (shown >= lines.length) return;
    const timer = window.setTimeout(() => setShown((count) => count + 1), reduced ? 0 : STEP_MS);
    return () => window.clearTimeout(timer);
  }, [shown, cvId, lines.length]);

  const ready = cvId !== null && shown >= lines.length;
  const percent = Math.round((100 * shown) / lines.length);
  return (
    <CvFrame
      title={t("orbi.title")}
      sub={t("orbi.sub")}
      back={{ href: "/app/career/cv/nouveau", label: t("back") }}
      bottom={
        ready ? (
          <Link
            href={`/app/career/cv/${cvId}?etape=contenu`}
            className="nb-bouton nb-cv-principal"
            data-plein=""
            data-large=""
          >
            {t("orbi.see")}
          </Link>
        ) : failed ? (
          <Link
            href="/app/career/cv"
            className="nb-bouton nb-cv-principal"
            data-plein=""
            data-large=""
          >
            {t("orbi.backToCvs")}
          </Link>
        ) : (
          <button
            type="button"
            className="nb-bouton nb-cv-principal"
            data-plein=""
            data-large=""
            disabled
          >
            {t("orbi.see")}
          </button>
        )
      }
    >
      <div className="nb-cv-lecture">
        <div className="nb-cv-feuille" aria-hidden data-menthe="">
          <i data-titre="" />
          <i data-sous="" />
          <i data-section="" />
          <i />
          <i />
          <i data-w="70" />
          <i data-section="" />
          <i />
          <i data-w="80" />
          <span className="nb-cv-etoile">
            <OrbiSpark size={24} />
          </span>
        </div>
        {failed ? (
          <p className="nb-cv-erreur" role="alert">
            {failed === "limit" ? t("orbi.limit") : t("orbi.error")}
          </p>
        ) : (
          <>
            <b className="nb-cv-lecture-t" role="status" aria-live="polite">
              {ready ? t("orbi.ready") : t("orbi.writing")}
            </b>
            <span
              className="nb-cv-barre"
              role="progressbar"
              aria-label={t("orbi.progress")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <span style={{ width: `${percent}%` }} />
            </span>
            <ul className="nb-cv-lus">
              {lines.map((line, index) => (
                <li key={line} data-fait={index < shown ? "" : undefined}>
                  <i aria-hidden>
                    {index < shown ? <PhoneIcon name="coche" size={14} stroke={2.6} /> : "…"}
                  </i>
                  {line}
                </li>
              ))}
            </ul>
            {ready && noSummary ? <p className="nb-cv-note">{t("orbi.noSummary")}</p> : null}
          </>
        )}
      </div>
    </CvFrame>
  );
}
