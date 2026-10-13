import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

/** Building blocks of the public pages: hero, section, feature grid, check list, FAQ, call to action. */

export function PageHero({
  eyebrow,
  title,
  text,
  badge,
  actions,
  aside,
  tone = "creme",
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  tone?: "creme" | "sapin";
}) {
  const dark = tone === "sapin";
  return (
    <section className={cx(dark ? "bg-sapin text-blanc" : "bg-creme text-sapin")}>
      <div className="mx-auto grid max-w-7xl items-center gap-10 page-x py-12 md:grid-cols-[1.4fr_1fr] md:py-20">
        <div className="flex flex-col items-start gap-5">
          {eyebrow && (
            <p className={cx("text-eyebrow", dark ? "text-neon" : "text-feuille-fonce")}>
              {eyebrow}
            </p>
          )}
          <h1 className="max-w-3xl text-display">{title}</h1>
          {text && (
            <p
              className={cx("max-w-2xl text-lg leading-8", dark ? "text-blanc/80" : "text-ardoise")}
            >
              {text}
            </p>
          )}
          {badge}
          {actions && (
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">{actions}</div>
          )}
        </div>
        {aside && <div className="hidden justify-center md:flex">{aside}</div>}
      </div>
    </section>
  );
}

export function Section({
  id,
  title,
  subtitle,
  children,
  tone = "creme",
  className,
}: {
  id?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  tone?: "creme" | "blanc" | "sapin";
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cx(
        tone === "blanc" && "bg-blanc",
        tone === "sapin" && "bg-sapin text-blanc",
        tone === "creme" && "bg-creme",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-8 page-x py-12 md:py-16">
        {(title || subtitle) && (
          <div className="flex max-w-3xl flex-col gap-3">
            {title && <h2 className="text-h1">{title}</h2>}
            {subtitle && (
              <p
                className={cx(
                  "text-lg leading-8",
                  tone === "sapin" ? "text-blanc/80" : "text-ardoise",
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export type Feature = { title: string; text: string; icon?: IconName; label?: string };

export function FeatureGrid({
  items,
  columns = 3,
  tone = "blanc",
}: {
  items: Feature[];
  columns?: 2 | 3 | 4;
  tone?: "blanc" | "creme";
}) {
  return (
    <ul
      className={cx(
        "grid gap-4",
        columns === 2 && "md:grid-cols-2",
        columns === 3 && "md:grid-cols-3",
        columns === 4 && "sm:grid-cols-2 lg:grid-cols-4",
      )}
    >
      {items.map((item) => (
        <li
          key={item.title}
          className={cx(
            "flex flex-col gap-3 rounded-card p-6 text-sapin",
            tone === "blanc" ? "bg-blanc" : "bg-creme",
          )}
        >
          {item.icon && <Icon name={item.icon} duo className="size-10" />}
          {item.label && <p className="text-eyebrow text-feuille-fonce">{item.label}</p>}
          <h3 className="text-lg leading-7 font-semibold">{item.title}</h3>
          <p className="text-[15px] leading-6 text-ardoise">{item.text}</p>
        </li>
      ))}
    </ul>
  );
}

export function CheckList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cx("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[15px] leading-6">
          <Icon name="valider" className="mt-0.5 size-5 shrink-0 text-feuille" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Steps({ items }: { items: { number: string; title: string; text: string }[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.number} className="flex flex-col gap-3 rounded-card bg-blanc p-6">
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-full bg-lime text-lg font-semibold text-sapin"
          >
            {item.number}
          </span>
          <h3 className="text-lg leading-7 font-semibold">{item.title}</h3>
          <p className="text-[15px] leading-6 text-ardoise">{item.text}</p>
        </li>
      ))}
    </ol>
  );
}

/** Questions and answers with native <details>: works without JavaScript. */
export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <details key={item.question} className="group rounded-md bg-blanc p-5 open:pb-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold">
            {item.question}
            <Icon
              name="ajouter"
              className="size-5 shrink-0 transition-transform group-open:rotate-45"
            />
          </summary>
          <p className="mt-3 text-[15px] leading-7 text-ardoise">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBand({
  title,
  text,
  actions,
}: {
  title: string;
  text?: string;
  actions: ReactNode;
}) {
  return (
    <section className="bg-creme">
      <div className="mx-auto max-w-7xl page-x py-12 md:py-16">
        <div className="flex flex-col items-start gap-5 rounded-panel bg-sapin p-8 text-blanc md:flex-row md:items-center md:justify-between md:p-12">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="text-h1">{title}</h2>
            {text && <p className="text-lg leading-8 text-blanc/80">{text}</p>}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">{actions}</div>
        </div>
      </div>
    </section>
  );
}

/** A highlighted band inside a section (partners, upsell, quote). */
export function Band({
  title,
  text,
  action,
  tone = "lime",
}: {
  title: string;
  text: string;
  action?: ReactNode;
  tone?: "lime" | "blanc";
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-start gap-4 rounded-card p-6 md:flex-row md:items-center md:justify-between md:p-8",
        tone === "lime" ? "bg-lime text-sapin" : "bg-blanc text-sapin",
      )}
    >
      <div className="flex max-w-2xl flex-col gap-2">
        <h3 className="text-h2">{title}</h3>
        <p className="text-[15px] leading-6">{text}</p>
      </div>
      {action}
    </div>
  );
}
