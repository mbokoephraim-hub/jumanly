import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

type Props = ComponentProps<"div"> & {
  /** `tinted`: light mint background; `dark`: depth gradient. */
  appearance?: "default" | "tinted" | "dark";
};

const appearances = {
  default: "bg-blanc text-sapin shadow-card",
  tinted: "bg-menthe-claire text-sapin",
  dark: "bg-gradient-depth text-blanc",
};

export function Card({ appearance = "default", className, ...rest }: Props) {
  return <div className={cx("rounded-card p-6", appearances[appearance], className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: ComponentProps<"h3">) {
  return <h3 className={cx("text-lg leading-7 font-semibold", className)} {...rest} />;
}

export function CardText({ className, ...rest }: ComponentProps<"p">) {
  return <p className={cx("mt-1 text-[15px] leading-6 opacity-80", className)} {...rest} />;
}
