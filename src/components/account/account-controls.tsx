"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/brand/icon";
import { showToast } from "@/components/motion/toaster";
import { cx } from "@/lib/cx";
import { updateTheme } from "@/server/actions/settings";

type Theme = "light" | "green";

/**
 * « Thème : Clair · Vert » (screens 61, 62): two submit buttons of one form. With JavaScript the
 * page changes at once, before the server keeps the choice; without it the form posts.
 */
export function ThemeSwitch({
  current,
  labels,
}: {
  current: Theme;
  labels: { group: string; light: string; green: string; saved: string };
}) {
  const [theme, setTheme] = useState<Theme>(current);
  const [, startTransition] = useTransition();
  const choose = (next: Theme) => {
    setTheme(next);
    document.documentElement.classList.toggle("jm-vert", next === "green");
    document.querySelector(".jm-talent")?.classList.toggle("jm-vert", next === "green");
    const data = new FormData();
    data.set("theme", next);
    startTransition(async () => {
      await updateTheme(data);
      showToast({ message: labels.saved, tone: "success" });
    });
  };
  return (
    <form
      action={updateTheme}
      role="group"
      aria-label={labels.group}
      className="jm-segment flex rounded-pill p-[3px]"
    >
      {(["light", "green"] as const).map((value) => (
        <button
          key={value}
          type="submit"
          name="theme"
          value={value}
          aria-pressed={theme === value}
          onClick={(event) => {
            event.preventDefault();
            if (theme !== value) choose(value);
          }}
          className={cx(
            "min-h-9 rounded-pill px-3.5 text-[13px]",
            theme === value ? "jm-segment-on font-semibold" : "font-medium",
          )}
        >
          {value === "light" ? labels.light : labels.green}
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
