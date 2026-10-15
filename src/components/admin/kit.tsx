import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { chipClasses, chipOnClasses } from "@/components/ui/filter-chip";
import { cx } from "@/lib/cx";
import { getCurrentUser } from "@/server/auth/session";

/**
 * Shared pieces of Jumanly Admin (mockups 07-01 to 07-11): page header with the logged-actions
 * tag, the search and the account pill; cards, tabs, filter bars, sensitive-action panels and the
 * audit notice. Filters and panels are links and GET forms: the admin works without JavaScript.
 */

export const adminCard = "rounded-[24px] bg-blanc p-5 lg:p-[22px]";
export const adminTitle =
  "text-[18px] leading-[24px] font-semibold tracking-[-0.015em] lg:text-[20px] lg:leading-[26px]";
/** Small capital label of a section (« DOCUMENTS FOURNIS », « COMPTE »). */
export const adminLabel =
  "text-[11px] leading-4 font-semibold tracking-[0.1em] text-ardoise uppercase";

/** Title of an admin page (mockup 07-01, `.top`). The tools on the right show from `lg`. */
export async function AdminPageHeader({
  title,
  eyebrow,
  subtitle,
}: {
  title: ReactNode;
  /** Replaces « Jumanly Admin » above the title (the user count on mobile, for instance). */
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
}) {
  const t = await getTranslations("admin");
  const user = await getCurrentUser();
  const role = user?.platformRole ?? "user";
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-center gap-3.5 lg:min-h-[52px]">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[12px] leading-4 text-ardoise lg:text-[13px]">
            {eyebrow ?? t("nav.title")}
          </span>
          <h1 className="text-[24px] leading-[30px] font-semibold tracking-[-0.025em] lg:text-[30px] lg:leading-9">
            {title}
          </h1>
        </div>
        <span className="hidden h-8 shrink-0 items-center gap-1.5 rounded-pill bg-brume px-3.5 text-[11px] font-semibold xl:inline-flex">
          <Icon name="doc" className="size-3.5" />
          {t("header.logged")}
        </span>
        <form
          action="/admin/utilisateurs"
          role="search"
          className="relative hidden w-[260px] shrink-0 lg:block"
        >
          <label htmlFor="admin-header-search" className="sr-only">
            {t("header.searchLabel")}
          </label>
          <Icon
            name="recherche"
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ardoise"
          />
          <input
            id="admin-header-search"
            name="q"
            type="search"
            placeholder={t("header.search")}
            className="h-11 w-full rounded-pill bg-blanc pr-4 pl-11 text-[13px] text-sapin placeholder:text-ardoise focus:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus:outline-none"
          />
        </form>
        {user && (
          <span className="hidden shrink-0 items-center gap-2.5 rounded-pill bg-blanc py-[5px] pr-3.5 pl-[5px] lg:flex">
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-full bg-[#14745f] text-[13px] font-semibold text-neon"
            >
              {initialsOf(user.name)}
            </span>
            <span className="flex flex-col">
              <span className="text-[13px] leading-[17px] font-semibold">{user.name}</span>
              <span className="text-[11px] leading-[15px] text-ardoise">
                {t(`role.${role === "user" ? "readOnly" : role}`)}
              </span>
            </span>
          </span>
        )}
      </div>
      {subtitle && <p className="text-[13px] leading-5 text-ardoise">{subtitle}</p>}
    </header>
  );
}

function initialsOf(name: string) {
  return (
    name
      .split(/[\s-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "?"
  );
}

/** Person or organization initials in a table row. */
export { Initials, OrgMark } from "@/components/hire/kit";

/**
 * Underlined tabs (mockups 07-03, 07-07, 07-09): links, the current one in Sapin with a 2 px bar.
 * On phones they become a row of chips that scrolls.
 */
export function AdminTabs({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string; current: boolean }[];
}) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-2 lg:gap-7 lg:border-b lg:border-brume">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={cx(
                // Phones: chips.
                "max-lg:inline-flex max-lg:h-[34px] max-lg:items-center max-lg:rounded-pill max-lg:px-3.5 max-lg:text-[12.5px] max-lg:font-medium",
                item.current
                  ? "max-lg:bg-sapin max-lg:text-blanc"
                  : "max-lg:bg-blanc max-lg:ring-[1.5px] max-lg:ring-brume max-lg:ring-inset",
                // Desktop: underlined text.
                "lg:-mb-px lg:inline-flex lg:h-11 lg:items-center lg:border-b-2 lg:text-[14.5px]",
                item.current
                  ? "lg:border-sapin lg:font-semibold lg:text-sapin"
                  : "lg:border-transparent lg:text-ardoise lg:hover:text-sapin",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Bar of a list page: a search field (GET form), filter chips, and a count on the right. */
export function AdminFilterBar({
  action,
  searchLabel,
  q,
  hidden,
  children,
  aside,
}: {
  action: string;
  searchLabel: string;
  q?: string;
  /** Query parameters kept when searching (current tab, filters). */
  hidden?: Record<string, string | undefined>;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:flex-wrap lg:items-center">
      <form action={action} role="search" className="relative w-full lg:w-[260px] xl:w-[318px]">
        {Object.entries(hidden ?? {}).map(([name, value]) =>
          value ? <input key={name} type="hidden" name={name} value={value} /> : null,
        )}
        <label htmlFor={`${action}-q`} className="sr-only">
          {searchLabel}
        </label>
        <Icon
          name="recherche"
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ardoise"
        />
        <input
          id={`${action}-q`}
          name="q"
          type="search"
          defaultValue={q}
          placeholder={searchLabel}
          className="h-10 w-full rounded-pill bg-blanc pr-4 pl-11 text-[13px] text-sapin ring-[1.5px] ring-brume ring-inset placeholder:text-ardoise focus:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus:ring-sapin focus:outline-none"
        />
      </form>
      {children && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 lg:mx-0 lg:overflow-visible lg:px-0">
          {children}
        </div>
      )}
      {aside && <div className="lg:ml-auto">{aside}</div>}
    </div>
  );
}

/**
 * Filter chip that opens a list of choices (« Statut ▾ »). Each choice is a link; the chip turns
 * Sapin when a choice other than « all » is active.
 */
export function FilterMenu({
  label,
  group,
  options,
}: {
  label: string;
  group: string;
  options: { href: string; label: string; current: boolean }[];
}) {
  const active = options.find((option) => option.current && option !== options[0]);
  return (
    <details name={`filter-${group}`} className="group/menu relative shrink-0">
      <summary
        className={cx(
          chipClasses,
          "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
          active && chipOnClasses,
        )}
      >
        {active ? `${label} : ${active.label}` : label}
        <Icon name="chev-d" className="transition-transform group-open/menu:rotate-180" />
      </summary>
      <ul className="absolute top-[calc(100%+6px)] left-0 z-30 flex max-h-80 min-w-52 flex-col gap-0.5 overflow-y-auto rounded-[18px] bg-blanc p-1.5 text-[13px] shadow-menu ring-1 ring-sapin/8">
        {options.map((option) => (
          <li key={option.href}>
            <Link
              href={option.href}
              aria-current={option.current ? "true" : undefined}
              className={cx(
                "flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-creme",
                option.current && "font-semibold",
              )}
            >
              {option.label}
              {option.current && <Icon name="check" className="size-4 text-feuille" />}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Capital label with a line after it (« ACTION SENSIBLE · MOTIF OBLIGATOIRE »). */
export function SectionRule({ children }: { children: ReactNode }) {
  return (
    <p className={cx(adminLabel, "flex items-center gap-3 after:h-px after:flex-1 after:bg-brume")}>
      {children}
    </p>
  );
}

/**
 * Sensitive action (mockup 07-02, « Suspendre le compte »): a card with the Corail shield, the
 * question, the required reason and the two buttons. The form is the caller's; the close link
 * removes the action from the address.
 */
export async function SensitivePanel({
  title,
  text,
  closeHref,
  icon = "securite",
  tone = "danger",
  children,
  className,
}: {
  title: string;
  text?: ReactNode;
  closeHref?: string;
  icon?: IconName;
  tone?: "danger" | "neutral";
  children: ReactNode;
  className?: string;
}) {
  const t = await getTranslations("admin.sensitive");
  return (
    <section
      aria-label={title}
      className={cx(
        "flex flex-col gap-3.5 rounded-[24px] bg-blanc p-5 shadow-[0_14px_34px_rgba(11,26,31,0.08)] ring-1 ring-brume lg:p-[22px]",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cx(
            "grid size-[38px] shrink-0 place-items-center rounded-[12px]",
            tone === "danger" ? "bg-down-fond text-corail-fonce" : "bg-creme text-sapin",
          )}
        >
          <Icon name={icon} className="size-[18px]" />
        </span>
        <h2 className="flex-1 text-[16px] leading-[22px] font-semibold lg:text-[17px]">{title}</h2>
        {closeHref && (
          <Link
            href={closeHref}
            scroll={false}
            aria-label={t("close")}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-creme hover:bg-brume"
          >
            <Icon name="fermer" className="size-4" />
          </Link>
        )}
      </div>
      {text && <p className="text-[13.5px] leading-[21px]">{text}</p>}
      {children}
    </section>
  );
}

/** The reason field of a sensitive action, with the audit hint under it. */
export async function ReasonField({
  id,
  label,
  name = "reason",
  defaultValue,
  rows = 3,
}: {
  id: string;
  label?: string;
  name?: string;
  defaultValue?: string;
  rows?: number;
}) {
  const t = await getTranslations("admin");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label ?? t("sensitive.reason")}{" "}
        <span aria-hidden className="text-corail-fonce">
          *
        </span>
      </label>
      <textarea
        id={id}
        name={name}
        required
        rows={rows}
        defaultValue={defaultValue}
        aria-describedby={`${id}-hint`}
        className="w-full rounded-[16px] bg-blanc px-4 py-3 text-[13.5px] leading-5 text-sapin ring-[1.5px] ring-brume ring-inset focus:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus:ring-2 focus:ring-sapin focus:outline-none"
      />
      <p id={`${id}-hint`} className="flex items-start gap-1.5 text-[11px] leading-4 text-ardoise">
        <Icon name="doc" className="mt-px size-3 shrink-0" />
        {t("reason.required")}
      </p>
    </div>
  );
}

/** Brume notice « Toutes les actions d'administration sont enregistrées… ». */
export async function AuditNotice({ className }: { className?: string }) {
  const t = await getTranslations("admin");
  return (
    <p
      className={cx(
        "flex items-start gap-2.5 rounded-[16px] bg-brume/70 px-4 py-3 text-[11.5px] leading-4",
        className,
      )}
    >
      <Icon name="doc" className="size-4 shrink-0" />
      {t("audit.notice")}
    </p>
  );
}

/** Label / value line of a detail panel (« Identifiant · usr_8f2k41 »). */
export function DetailRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[13px] leading-5">
      <dt className="text-ardoise">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words">{children}</dd>
    </div>
  );
}

/** Status tags of the admin (`.tag` of the mockups). */
export const tagTone = {
  success: "bg-lime-clair text-up-texte",
  warning: "bg-ambre-fond text-ambre-texte",
  error: "bg-down-fond text-down-texte",
  neutral: "bg-brume text-sapin",
  lime: "bg-lime text-sapin",
  neon: "bg-neon text-sapin",
  sapin: "bg-sapin text-neon",
  menthe: "bg-menthe-claire text-menthe-texte",
  outline: "bg-transparent text-sapin ring-[1.2px] ring-sapin ring-inset",
} as const;
export type TagTone = keyof typeof tagTone;

export function Tag({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: TagTone;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-pill px-2.5 text-[11px] leading-none font-semibold whitespace-nowrap",
        tagTone[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} className="size-3" />}
      {children}
    </span>
  );
}

/** Rounded icon tile (lists « À traiter », documents, lessons). */
export function IconTile({
  icon,
  tone = "bg-creme",
  size = 38,
}: {
  icon: IconName;
  tone?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className={cx("grid shrink-0 place-items-center rounded-[12px] text-sapin", tone)}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} className="size-[17px]" />
    </span>
  );
}
