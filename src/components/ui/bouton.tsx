import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Chargeur } from "./chargeur";

export type VarianteBouton = "primaire" | "secondaire" | "contour" | "fantome" | "danger";
export type TailleBouton = "sm" | "md" | "lg";

const variantes: Record<VarianteBouton, string> = {
  primaire: "bg-sapin text-blanc hover:bg-[#145045] active:bg-nuit",
  secondaire: "bg-lime text-sapin hover:bg-[#97e85a] active:bg-[#88d94c]",
  contour: "border border-sapin/25 bg-transparent text-sapin hover:border-sapin hover:bg-sapin/5",
  fantome: "bg-transparent text-sapin hover:bg-sapin/8",
  danger: "bg-corail text-blanc hover:bg-[#cf4b3b]",
};

const tailles: Record<TailleBouton, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

type ProprietesStyle = {
  variante?: VarianteBouton;
  taille?: TailleBouton;
  pleineLargeur?: boolean;
  icone?: ReactNode;
};

export function classesBouton({
  variante = "primaire",
  taille = "md",
  pleineLargeur = false,
}: ProprietesStyle = {}) {
  return cx(
    "inline-flex items-center justify-center rounded-pastille font-medium whitespace-nowrap",
    "transition-colors disabled:pointer-events-none disabled:opacity-45",
    "aria-disabled:pointer-events-none aria-disabled:opacity-45",
    variantes[variante],
    tailles[taille],
    pleineLargeur && "w-full",
  );
}

type ProprietesBouton = ComponentProps<"button"> &
  ProprietesStyle & {
    /** Affiche un indicateur et bloque le bouton pendant une action. */
    chargement?: boolean;
  };

export function Bouton({
  variante,
  taille,
  pleineLargeur,
  icone,
  chargement = false,
  disabled,
  className,
  children,
  type = "button",
  ...reste
}: ProprietesBouton) {
  return (
    <button
      type={type}
      disabled={disabled || chargement}
      aria-busy={chargement || undefined}
      className={cx(classesBouton({ variante, taille, pleineLargeur }), className)}
      {...reste}
    >
      {chargement ? <Chargeur taille="sm" /> : icone}
      {children}
    </button>
  );
}

type ProprietesBoutonLien = ComponentProps<typeof Link> & ProprietesStyle;

/** Lien qui a l'apparence d'un bouton (navigation). */
export function BoutonLien({
  variante,
  taille,
  pleineLargeur,
  icone,
  className,
  children,
  ...reste
}: ProprietesBoutonLien) {
  return (
    <Link className={cx(classesBouton({ variante, taille, pleineLargeur }), className)} {...reste}>
      {icone}
      {children}
    </Link>
  );
}
