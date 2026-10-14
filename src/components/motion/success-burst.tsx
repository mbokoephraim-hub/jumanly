import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** Brand shapes that spread out once around the check (angle in degrees, distance in px). */
const sparks = [
  { shape: "forme-etincelle-lime", angle: -150, distance: 64, size: 18 },
  { shape: "forme-point-lime", angle: -100, distance: 58, size: 10 },
  { shape: "forme-etincelle-sapin", angle: -40, distance: 66, size: 14 },
  { shape: "forme-point-sapin", angle: 10, distance: 60, size: 9 },
  { shape: "forme-etincelle-lime", angle: 70, distance: 62, size: 12 },
  { shape: "forme-point-lime", angle: 150, distance: 56, size: 11 },
];

/**
 * Card of an important confirmation (docs/experience-animee § 4.2): a check that draws itself,
 * brand shapes that spread out once (Rebond), then the text and the next step. With less motion,
 * the card is shown as it ends: check drawn, shapes in place.
 */
export function SuccessBurst({
  title,
  children,
  action,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      role="status"
      className={cx(
        "jm-success relative flex flex-col items-center gap-3 overflow-hidden rounded-[24px] bg-blanc px-5 py-7 text-center ring-1 ring-feuille/30 sm:px-8",
        className,
      )}
    >
      <span aria-hidden className="relative flex size-16 items-center justify-center">
        {sparks.map((spark, index) => (
          <span
            key={index}
            className="jm-spark absolute top-1/2 left-1/2 bg-contain bg-center bg-no-repeat"
            style={
              {
                width: spark.size,
                height: spark.size,
                marginLeft: -spark.size / 2,
                marginTop: -spark.size / 2,
                backgroundImage: `url(/marque/formes/${spark.shape}.svg)`,
                "--sx": `${Math.cos((spark.angle * Math.PI) / 180) * spark.distance}px`,
                "--sy": `${Math.sin((spark.angle * Math.PI) / 180) * spark.distance}px`,
              } as React.CSSProperties
            }
          />
        ))}
        <span className="jm-success-disc flex size-16 items-center justify-center rounded-full bg-lime text-sapin">
          <svg viewBox="0 0 24 24" className="size-8" fill="none">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              pathLength={1}
              className="jm-check"
              stroke="currentColor"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
      <h2 className="text-[20px] leading-tight font-bold tracking-tight lg:text-[22px]">{title}</h2>
      {children && (
        <div className="flex max-w-[560px] flex-col gap-1 text-[15px] text-sapin/85">
          {children}
        </div>
      )}
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </section>
  );
}
