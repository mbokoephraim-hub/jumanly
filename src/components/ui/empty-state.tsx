import type { ReactNode } from "react";

/**
 * Brand illustration made of the visual identity's shapes (AI orb, Lime and Sapin circles).
 * To be replaced by the illustrated characters once they are provided.
 */
function EmptyIllustration() {
  return (
    <svg aria-hidden viewBox="0 0 120 96" className="h-24 w-30">
      <defs>
        <radialGradient id="empty-orb" cx="38%" cy="32%">
          <stop offset="0" stopColor="#F4FFB8" />
          <stop offset="0.45" stopColor="#A6F26B" />
          <stop offset="1" stopColor="#3DA14F" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="52" r="40" fill="#DCE5E1" />
      <rect x="34" y="30" width="52" height="44" rx="10" fill="#FFFFFF" />
      <rect x="42" y="40" width="28" height="5" rx="2.5" fill="#0F3F37" />
      <rect x="42" y="51" width="36" height="5" rx="2.5" fill="#DCE5E1" />
      <rect x="42" y="61" width="22" height="5" rx="2.5" fill="#DCE5E1" />
      <circle cx="88" cy="28" r="12" fill="url(#empty-orb)" />
    </svg>
  );
}

/** Illustrated empty state (§ 11.5), with an action to move forward. */
export function EmptyState({
  illustration,
  title,
  description,
  action,
}: {
  /** Replaces the default illustration (an icon or a character). */
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-blanc px-6 py-10 text-center">
      {illustration ?? <EmptyIllustration />}
      <p className="text-lg font-semibold text-sapin">{title}</p>
      {description && <p className="max-w-sm text-[15px] leading-6 text-ardoise">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
