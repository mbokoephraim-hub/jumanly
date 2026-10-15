import Link from "next/link";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { QueueKeys } from "./queue-keys";

/**
 * « Précédente / Suivante » of a moderation queue (Admin v2, étape 7), with its position and the
 * keyboard shortcuts J and K.
 */
export function QueueNav({
  label,
  prev,
  next,
  prevLabel,
  nextLabel,
  position,
  hint,
}: {
  label: string;
  prev?: string;
  next?: string;
  prevLabel: string;
  nextLabel: string;
  position: string;
  hint: string;
}) {
  const link =
    "inline-flex size-9 items-center justify-center rounded-full bg-blanc ring-[1.5px] ring-brume ring-inset hover:bg-creme";
  const off = "pointer-events-none opacity-40";
  return (
    <nav aria-label={label} className="flex items-center gap-2">
      <QueueKeys prev={prev} next={next} />
      {prev ? (
        <Link href={prev} scroll={false} aria-keyshortcuts="K" className={link}>
          <Icon name="chev-l" aria-hidden className="size-4" />
          <span className="sr-only">{prevLabel}</span>
        </Link>
      ) : (
        <span aria-hidden className={cx(link, off)}>
          <Icon name="chev-l" className="size-4" />
        </span>
      )}
      <span className="text-[12px] font-semibold tabular-nums">{position}</span>
      {next ? (
        <Link href={next} scroll={false} aria-keyshortcuts="J" className={link}>
          <Icon name="chev-r" aria-hidden className="size-4" />
          <span className="sr-only">{nextLabel}</span>
        </Link>
      ) : (
        <span aria-hidden className={cx(link, off)}>
          <Icon name="chev-r" className="size-4" />
        </span>
      )}
      <span className="text-[11px] leading-[15px] text-ardoise max-lg:hidden">{hint}</span>
    </nav>
  );
}
