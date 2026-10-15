"use client";

import { Button } from "@/components/ui/button";

/** « Changer d'espace » on the 403 page: opens the space switcher of the header, where it is shown. */
export function OpenSpaceSwitcher({ label }: { label: string }) {
  const open = () => {
    const menus = document.querySelectorAll<HTMLDetailsElement>("details[data-space-switcher]");
    const visible = Array.from(menus).find((menu) => menu.offsetParent !== null);
    if (!visible) return;
    visible.open = true;
    visible.scrollIntoView({ block: "nearest" });
    visible.querySelector("summary")?.focus();
  };
  return (
    <Button type="button" variant="secondary" size="lg" onClick={open}>
      {label}
    </Button>
  );
}
