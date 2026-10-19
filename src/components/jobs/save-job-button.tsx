"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/brand/icon";
import { TalentIcon } from "@/components/talent/icon";
import { showToast } from "@/components/motion/toaster";
import { cx } from "@/lib/cx";
import { setJobSavedAction, toggleSaveAction } from "@/server/actions/jobs";

export type SaveJobLabels = {
  save: string;
  unsave: string;
  saved: string;
  removed: string;
  undo: string;
};

/**
 * « Enregistrer » an offer (docs/ux-mobile-talent, prompt 4): the state changes at once and a toast
 * offers « Annuler ». Without JavaScript the form still works, through a page reload.
 */
export function SaveJobButton({
  slug,
  saved: initial,
  back,
  labels,
  name,
  showLabel = false,
  className,
  iconClassName = "size-[18px]",
  talent = false,
}: {
  slug: string;
  saved: boolean;
  back: string;
  labels: SaveJobLabels;
  /** Offer title, read after the action by a screen reader. */
  name?: string;
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
  /** The icon of the talent space (planche talent-1), filled when saved. */
  talent?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  // Another « Enregistrer » of the same offer changed it: the page sends the new state.
  const [known, setKnown] = useState(initial);
  if (known !== initial) {
    setKnown(initial);
    setSaved(initial);
  }
  const [pending, startTransition] = useTransition();

  const apply = (value: boolean, withToast: boolean) => {
    setSaved(value);
    startTransition(async () => {
      const result = await setJobSavedAction(slug, value);
      if (result === null) {
        setSaved(!value);
        return;
      }
      router.refresh();
      if (withToast)
        showToast({
          message: value ? labels.saved : labels.removed,
          tone: value ? "success" : "info",
          action: { label: labels.undo, run: () => apply(!value, false) },
        });
    });
  };

  const label = saved ? labels.unsave : labels.save;
  return (
    <form
      action={toggleSaveAction}
      onSubmit={(event) => {
        event.preventDefault();
        apply(!saved, true);
      }}
      className={talent ? "contents" : "relative z-10"}
    >
      <input type="hidden" name="job" value={slug} />
      <input type="hidden" name="back" value={back} />
      <button
        type="submit"
        aria-pressed={saved}
        aria-label={showLabel ? undefined : name ? `${label} · ${name}` : label}
        aria-busy={pending || undefined}
        className={className}
      >
        {talent ? (
          <TalentIcon name="favori" size="s" on={saved} />
        ) : (
          <Icon name="favori" className={cx(iconClassName, saved && "fill-sapin")} />
        )}
        {showLabel && label}
      </button>
    </form>
  );
}
