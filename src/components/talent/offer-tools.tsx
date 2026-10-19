"use client";

import { useEffect, useState, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { BackButton } from "./back-button";
import { TalentIcon } from "./icon";

/** « Partager » an offer: the phone's share sheet, or the link copied. */
export function ShareButton({
  url,
  title,
  label,
  copied,
  className,
}: {
  url: string;
  title: string;
  label: string;
  copied: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={className}
      onClick={async () => {
        if (navigator.share) {
          await navigator.share({ title, url }).catch(() => undefined);
          return;
        }
        await navigator.clipboard?.writeText(url).catch(() => undefined);
        showToast({ message: copied, tone: "success" });
      }}
    >
      <TalentIcon name="partager" size="s" />
    </button>
  );
}

/**
 * Head of an offer once its banner has left the screen (planche talent-1 § 3, bas de page):
 * « Retour », the title and « Enregistrer » stay at hand.
 */
export function OfferStickyHead({
  watch,
  title,
  backLabel,
  fallback,
  children,
}: {
  /** Id of the banner: the head shows when it is out of sight. */
  watch: string;
  title: string;
  backLabel: string;
  fallback: string;
  children?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const target = document.getElementById(watch);
    if (!target || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry!.isIntersecting), {
      rootMargin: "-40px 0px 0px 0px",
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [watch]);
  return (
    <div
      className="t-verre t-fort t-od-tete"
      data-visible={visible ? "" : undefined}
      aria-hidden={!visible}
      inert={!visible}
    >
      <BackButton fallback={fallback} label={backLabel} />
      <p>{title}</p>
      {children}
    </div>
  );
}
