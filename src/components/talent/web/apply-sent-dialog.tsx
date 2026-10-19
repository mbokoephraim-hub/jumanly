"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { CenteredDialog } from "./dialog";

const WIDE = "(min-width: 768px)";
const isWide = () => window.matchMedia(WIDE).matches;
const subscribe = (change: () => void) => {
  const media = window.matchMedia(WIDE);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
};

/**
 * « Candidature envoyée » on a tablet or a computer (planche web talent-2 § 1, confirmation): a
 * centred window over the offer, two next steps only. Closing it (Échap, the veil, « Fermer »)
 * leads to the offer itself. On a phone the confirmation keeps its own screen.
 */
export function ApplySentDialog({
  id,
  title,
  closeLabel,
  offerHref,
  children,
}: {
  id: string;
  title: string;
  closeLabel: string;
  offerHref: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const wide = useSyncExternalStore(subscribe, isWide, () => false);
  const [dismissed, setDismissed] = useState(false);
  const open = wide && !dismissed;
  return (
    <CenteredDialog
      id={id}
      title={title}
      closeLabel={closeLabel}
      titleHidden
      open={open}
      className="t-conf-d"
      onClose={() => {
        // A link of the window was followed: the page is already changing.
        if (!open) return;
        setDismissed(true);
        router.replace(offerHref, { scroll: false });
      }}
    >
      <div
        onClick={(event) => {
          // A link inside the window: let it lead, without going back to the offer first.
          if ((event.target as Element).closest("a")) setDismissed(true);
        }}
      >
        {children}
      </div>
    </CenteredDialog>
  );
}
