import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export type ScanCard = {
  initials: string;
  firstName: string;
  targetJob: string;
  city: string | null;
  skills: string;
  label: string;
};

export type ScanNode = { key: string; label: string; band: "low" | "mid" | "high" | null };

const nodeTone = { low: "bg-menthe", mid: "bg-lime", high: "bg-neon" } as const;

/**
 * Scene of the career diagnostic (docs/experience-animee § 5.1 and § 5.4), on the Nuit-orbe
 * background: the talent's card floating and slightly tilted, Orbi on an elliptic orbit with its
 * Menthe trail, the six dimensions as a constellation (unlit until computed). While `scanning`,
 * a Lime line sweeps the card over a fine grid, Orbi speeds up and the skill pills are drawn
 * into the orb; `flipped` turns the card over to show `back`. Purely visual: every state is
 * readable as is, and the steps of the analysis are given in text next to it.
 */
export function ScanScene({
  card,
  nodes,
  nodesLabel,
  pills = [],
  scanning = false,
  flipped = false,
  back,
  className,
}: {
  card: ScanCard;
  nodes: ScanNode[];
  nodesLabel: string;
  pills?: string[];
  scanning?: boolean;
  flipped?: boolean;
  back?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-scanning={scanning ? "" : undefined}
      className={cx(
        "relative isolate flex aspect-square w-full items-center justify-center overflow-hidden rounded-[24px] bg-nuit bg-cover bg-center sm:aspect-[16/11]",
        className,
      )}
      style={{ backgroundImage: "url(/marque/fonds/fond-09-nuit-orbe-16x9.svg)" }}
    >
      {/* Constellation */}
      <ul aria-label={nodesLabel} className="absolute inset-0">
        {nodes.map((node, index) => {
          const angle = -Math.PI / 2 + (2 * Math.PI * index) / nodes.length;
          const left = 50 + 39 * Math.cos(angle);
          const top = 50 + 42 * Math.sin(angle);
          return (
            <li
              key={node.key}
              data-lit={node.band ? "" : undefined}
              className="jm-node absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <span
                aria-hidden
                className={cx(
                  "size-3 rounded-full ring-4 ring-blanc/10",
                  node.band ? nodeTone[node.band] : "bg-blanc/70",
                )}
              />
              <span className="text-[10px] font-medium whitespace-nowrap text-blanc sm:text-xs">
                {node.label}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Orbit of Orbi */}
      <div
        aria-hidden
        className="jm-orbit pointer-events-none absolute size-[min(44%,250px)] sm:size-[min(58%,250px)]"
      >
        <div className="jm-orbit-arm">
          <span className="jm-orbit-trail" />
          <span className="absolute top-1/2 left-full -translate-x-1/2 -translate-y-1/2">
            <span className="jm-orbit-body block">
              <span className="block size-6 rounded-full bg-ai-orb shadow-orb" />
            </span>
          </span>
        </div>
      </div>

      {/* Pills drawn into the orb during the scan */}
      {pills.length > 0 && (
        <ul aria-hidden className="pointer-events-none absolute inset-0">
          {pills.slice(0, 6).map((pill, index) => {
            const left = index % 2 === 0 ? 14 + index * 3 : 70 - index * 2;
            const top = 76 + (index % 3) * 6;
            return (
              <li
                key={pill}
                className="jm-pill absolute max-w-[40%] truncate rounded-pill bg-blanc/90 px-2.5 py-1 text-[11px] font-semibold text-sapin"
                style={
                  {
                    left: `${left}%`,
                    top: `${Math.min(88, top)}%`,
                    "--i": index,
                    "--dx": `${(50 - left) * 3}px`,
                    "--dy": `${(48 - top) * 3}px`,
                  } as React.CSSProperties
                }
              >
                {pill}
              </li>
            );
          })}
        </ul>
      )}

      {/* The card, its back face once the analysis is done */}
      <div className="relative w-[min(48%,280px)] [perspective:900px] sm:w-[min(60%,280px)]">
        <div className={cx(!scanning && !flipped && "jm-float")}>
          <div data-flipped={flipped ? "" : undefined} className="jm-flip relative -rotate-3">
            <div
              aria-hidden={flipped || undefined}
              className="jm-flip-face relative flex flex-col gap-3 overflow-hidden rounded-[20px] bg-blanc p-3 text-sapin shadow-[0_24px_60px_rgb(0_0_0/0.35)] sm:p-5"
            >
              <span
                aria-hidden
                className="jm-scan-grid pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(rgb(166 242 107 / 0.35) 1px, transparent 1px), linear-gradient(90deg, rgb(166 242 107 / 0.35) 1px, transparent 1px)",
                  backgroundSize: "14px 14px",
                }}
              />
              <span
                aria-hidden
                className="jm-scan-line pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-lime shadow-[0_0_14px_4px_rgb(166_242_107/0.7)]"
              />
              <p className="text-[9px] font-semibold tracking-[0.1em] text-ardoise uppercase sm:text-[10px]">
                {card.label}
              </p>
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-semibold text-sapin sm:size-11">
                  {card.initials}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-base font-semibold">{card.firstName}</span>
                  <span className="truncate text-xs text-ardoise">{card.targetJob}</span>
                </span>
              </div>
              <p className="flex flex-wrap gap-x-2 text-xs text-ardoise">
                {card.city && <span>{card.city}</span>}
                <span className="font-medium text-feuille-fonce">{card.skills}</span>
              </p>
            </div>
            {back && (
              <div
                aria-hidden={!flipped || undefined}
                className="jm-flip-face jm-flip-back absolute inset-0 flex flex-col justify-center gap-2 rounded-[20px] bg-sapin p-3 text-blanc shadow-[0_24px_60px_rgb(0_0_0/0.35)] sm:p-5"
              >
                {back}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
