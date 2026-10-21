import Link from "next/link";
import { AccessMark } from "@/components/access/frame";
import { cx } from "@/lib/cx";

/**
 * Full-screen frame of the first steps (refonte-web talent-4 § 2, `obw`): on a phone, the column
 * of the talent space; from the tablet on, a page of its own above the space (no side bar), the
 * logo and the progress at the top, the question centred, the buttons along the bottom.
 */
export function OnboardingFrame({
  brand,
  homeLabel,
  head,
  children,
  className,
  tag,
}: {
  brand: string;
  /** A word beside the logo on a tablet or a computer (« Hire », planche web recruteur-3 § 8). */
  tag?: string;
  homeLabel: string;
  head?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("t-acces t-obw", className)}>
      <div className="t-obw-h">
        <Link href="/app" aria-label={homeLabel} className="t-lgo">
          <AccessMark size={30} />
          <span aria-hidden>{brand}</span>
          {tag && (
            <small aria-hidden className="t-obw-tag">
              {tag}
            </small>
          )}
        </Link>
        {head}
      </div>
      <div className="t-oc">{children}</div>
    </div>
  );
}
