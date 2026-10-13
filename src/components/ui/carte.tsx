import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

type Proprietes = ComponentProps<"div"> & {
  /** `teinte` : fond menthe claire ; `sombre` : dégradé profondeur. */
  apparence?: "standard" | "teinte" | "sombre";
};

const apparences = {
  standard: "bg-blanc text-sapin shadow-carte",
  teinte: "bg-menthe-claire text-sapin",
  sombre: "bg-degrade-profondeur text-blanc",
};

export function Carte({ apparence = "standard", className, ...reste }: Proprietes) {
  return <div className={cx("rounded-carte p-6", apparences[apparence], className)} {...reste} />;
}

export function TitreCarte({ className, ...reste }: ComponentProps<"h3">) {
  return <h3 className={cx("text-lg leading-7 font-semibold", className)} {...reste} />;
}

export function TexteCarte({ className, ...reste }: ComponentProps<"p">) {
  return <p className={cx("mt-1 text-[15px] leading-6 opacity-80", className)} {...reste} />;
}
