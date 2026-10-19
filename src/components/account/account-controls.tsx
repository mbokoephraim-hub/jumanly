"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/brand/icon";
import { showToast } from "@/components/motion/toaster";
import { updateAppearance } from "@/server/actions/settings";

type Appearance = "auto" | "light" | "dark";

/**
 * « Apparence : Auto · Clair · Sombre » (brief § 2.10): three submit buttons of one form. With
 * JavaScript the choice is kept in the background and the shell follows it; without it the form
 * posts.
 */
export function AppearanceSwitch({
  current,
  labels,
}: {
  current: Appearance;
  labels: { group: string; auto: string; light: string; dark: string; saved: string };
}) {
  const [appearance, setAppearance] = useState<Appearance>(current);
  const [, startTransition] = useTransition();
  const choose = (next: Appearance) => {
    setAppearance(next);
    const data = new FormData();
    data.set("appearance", next);
    startTransition(async () => {
      await updateAppearance(data);
      showToast({ message: labels.saved, tone: "success" });
    });
  };
  return (
    <form action={updateAppearance} role="group" aria-label={labels.group} className="t-seg">
      {(["auto", "light", "dark"] as const).map((value) => (
        <button
          key={value}
          type="submit"
          name="appearance"
          value={value}
          aria-pressed={appearance === value}
          onClick={(event) => {
            event.preventDefault();
            if (appearance !== value) choose(value);
          }}
          className="t-press"
        >
          {labels[value]}
        </button>
      ))}
    </form>
  );
}

/**
 * « Inviter un proche »: the phone's share sheet with the address of Jumanly, or the address
 * copied when there is no share sheet.
 */
export function InviteButton({
  url,
  labels,
  className,
  children,
}: {
  url: string;
  labels: { title: string; text: string; copied: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const data = { title: labels.title, text: labels.text, url };
        try {
          if (navigator.share) {
            await navigator.share(data);
            return;
          }
          await navigator.clipboard.writeText(url);
          showToast({ message: labels.copied, tone: "success" });
        } catch {
          // Closing the share sheet is not an error.
        }
      }}
    >
      {children}
      <Icon name="chev-r" className="size-4 shrink-0 opacity-60" />
    </button>
  );
}
