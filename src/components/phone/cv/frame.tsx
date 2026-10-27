import Link from "next/link";
import type { ReactNode } from "react";
import { PhoneIcon } from "../icon";

export const CV_STEPS = ["modele", "contenu", "style", "apercu"] as const;
export type CvStep = (typeof CV_STEPS)[number];

/**
 * The frame of « Créer un CV » (docs/carriere-v3, captures 06 to 15): full screen, without the
 * pill menu; a round Retour (or Fermer on the first screen), the title and its line, the four
 * steps when the CV has them (each segment opens its step), the main Lime button held at the
 * bottom. Shared by the server and the browser screens.
 */
export function CvFrame({
  title,
  sub,
  back,
  steps,
  bottom,
  children,
  className,
}: {
  title: string;
  sub?: string;
  back: { href: string; label: string; close?: boolean; onClick?: () => void };
  steps?: {
    current: CvStep;
    /** Where each step opens; null while it cannot be opened yet (no CV before a template). */
    hrefs: Record<CvStep, string | null>;
    names: Record<CvStep, string>;
    label: string;
    count: string;
  };
  bottom?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const index = steps ? CV_STEPS.indexOf(steps.current) : -1;
  const icon = <PhoneIcon name={back.close ? "fermer" : "retour"} size={20} stroke={2} />;
  return (
    <div className={`nb-page nb-cv${className ? ` ${className}` : ""}`}>
      <header className="nb-cv-tete">
        {back.onClick ? (
          <button
            type="button"
            className="nb-cv-retour"
            aria-label={back.label}
            onClick={back.onClick}
          >
            {icon}
          </button>
        ) : (
          <Link href={back.href} className="nb-cv-retour" aria-label={back.label}>
            {icon}
          </Link>
        )}
        <div className="nb-cv-titre">
          <h1>{title}</h1>
          {sub ? <p>{sub}</p> : null}
        </div>
        {steps ? (
          <span className="nb-cv-num" aria-hidden>
            {steps.count}
          </span>
        ) : null}
      </header>
      {steps ? (
        <nav className="nb-cv-etapes" aria-label={steps.label}>
          <ol>
            {CV_STEPS.map((step, position) => {
              const href = steps.hrefs[step];
              const inner = (
                <>
                  <span className="nb-cv-trait" aria-hidden />
                  {steps.names[step]}
                </>
              );
              return (
                <li key={step} data-fait={position <= index ? "" : undefined}>
                  {href && position !== index ? (
                    <Link href={href} replace>
                      {inner}
                    </Link>
                  ) : (
                    <span aria-current={position === index ? "step" : undefined}>{inner}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
      <div className="nb-cv-corps">{children}</div>
      {bottom ? <div className="nb-cv-bas">{bottom}</div> : null}
    </div>
  );
}
