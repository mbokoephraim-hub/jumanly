import "@/styles/phone-badge-or.css";

/** Gold seal with a check: the mark of anything verified (31/10/2026). */
export function GoldSeal({ size = 16, label }: { size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path
        d="M12 1.8l2.5 1.9 3.1-.1 1 3 2.5 1.8-1 3 1 3-2.5 1.8-1 3-3.1-.1L12 22.2l-2.5-1.9-3.1.1-1-3-2.5-1.8 1-3-1-3 2.5-1.8 1-3 3.1.1z"
        fill="#b8860b"
      />
      <path
        d="M12 3.6l2.1 1.6 2.6-.1.8 2.5 2.1 1.5-.8 2.5.8 2.5-2.1 1.5-.8 2.5-2.6-.1L12 20l-2.1-1.6-2.6.1-.8-2.5-2.1-1.5.8-2.5-.8-2.5 2.1-1.5.8-2.5 2.6.1z"
        fill="#f2cf5b"
      />
      <path
        d="m8.3 12.2 2.5 2.5 4.9-5.1"
        fill="none"
        stroke="#3a2600"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** « Vérifié » as a real gold badge: seal + word on a gold pill. */
export function GoldVerifiedBadge({
  label,
  help,
  small,
}: {
  label: string;
  help?: string;
  small?: boolean;
}) {
  return (
    <span className="nb-or" title={help} data-petit={small ? "" : undefined}>
      <GoldSeal size={small ? 14 : 16} />
      {label}
      {help ? <span className="sr-only">{help}</span> : null}
    </span>
  );
}
