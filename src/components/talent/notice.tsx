import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { TalentIcon } from "./icon";

/** A line of news on a screen (planche `.gar`): saved, sent, or something to watch. */
export function Notice({ tone = "", children }: { tone?: "ok" | "err" | ""; children: ReactNode }) {
  return (
    <p role="status" className={cx("t-gar", tone && `t-${tone}`)}>
      <TalentIcon name={tone === "err" ? "aide" : "valider"} size="s" />
      <span>{children}</span>
    </p>
  );
}
