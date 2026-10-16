import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { Alert } from "@/components/ui";
import { chipClasses, chipOnClasses } from "@/components/ui/filter-chip";
import { cx } from "@/lib/cx";
import { getCurrentUser } from "@/server/auth/session";

/**
 * Shared pieces of Jumanly Admin (mockups 07-01 to 07-11): page header with the logged-actions
 * tag, the search and the account pill; cards, tabs, filter bars, sensitive-action panels and the
 * audit notice. Filters and panels are links and GET forms: the admin works without JavaScript.
 */

export const adminCard = "jm-admin-card rounded-[24px] bg-blanc p-5 lg:p-[22px]";
export const adminTitle =
  "text-[18px] leading-[24px] font-semibold tracking-[-0.015em] lg:text-[20px] lg:leading-[26px]";
/** Small capital label of a section (« DOCUMENTS FOURNIS », « COMPTE »). */
export const adminLabel =
  "text-[11px] leading-4 font-semibold tracking-[0.1em] text-ardoise uppercase";

/**
 * Title of an admin page. Admin v3 (docs/admin-v3/PLAN.md, étape 1): a deep green banner with the
 * site's dots and Lime halo, the Néon eyebrow, the white title, and from `lg` the logged-actions
 * tag, the search and the account pill; optional key figures as translucent chips.
 */
export async function AdminPageHeader({
  title,
  eyebrow,
  subtitle,
  stats,
}: {
  title: ReactNode;
  /** Replaces « Jumanly Admin » above the title (the user count on mobile, for instance). */
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  /** 2 to 4 key figures shown in the banner. */
  stats?: { label: string; value: ReactNode }[];
}) {
  const t = await getTranslations("admin");
  const user = await getCurrentUser();
  const role = user?.platformRole ?? "user";
  return (
    <header className="jm-admin-hero flex flex-col gap-3 rounded-[28px] px-5 py-5 text-blanc lg:px-8 lg:py-7">
      <div className="flex items-center gap-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[11px] leading-4 font-semibold tracking-[0.14em] text-neon uppercase lg:text-[12px]">
            {eyebrow ?? t("nav.title")}
          </span>
          <h1 className="text-[24px] leading-[30px] font-semibold tracking-[-0.025em] lg:text-[32px] lg:leading-[38px]">
            {title}
          </h1>
        </div>
        <span className="hidden h-8 shrink-0 items-center gap-1.5 rounded-pill bg-blanc/10 px-3.5 text-[11px] font-semibold text-neon ring-1 ring-blanc/15 ring-inset xl:inline-flex">
          <Icon name="doc" className="size-3.5" />
          {t("header.logged")}
        </span>
        <form
          action="/admin/recherche"
          role="search"
          className="relative hidden w-[240px] shrink-0 lg:block xl:w-[260px]"
        >
          <label htmlFor="admin-header-search" className="sr-only">
            {t(role === "content_editor" ? "search.labelEditor" : "search.label")}
          </label>
          <Icon
            name="recherche"
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-blanc/75"
          />
          <input
            id="admin-header-search"
            name="q"
            type="search"
            placeholder={t("header.search")}
            className="h-11 w-full rounded-pill bg-blanc/10 pr-4 pl-11 text-[13px] text-blanc ring-1 ring-blanc/20 ring-inset placeholder:text-blanc/75 focus:bg-blanc/15 focus:shadow-[0_0_0_4px_rgb(166_242_107/0.45)] focus:outline-none"
          />
        </form>
        {user && (
          <span className="hidden shrink-0 items-center gap-2.5 rounded-pill bg-blanc/10 py-[5px] pr-3.5 pl-[5px] ring-1 ring-blanc/15 ring-inset lg:flex">
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-full bg-lime text-[13px] font-semibold text-sapin"
            >
              {initialsOf(user.name)}
            </span>
            <span className="flex flex-col">
              <span className="text-[13px] leading-[17px] font-semibold">{user.name}</span>
              <span className="text-[11px] leading-[15px] text-blanc/75">
                {t(`role.${role === "user" ? "readOnly" : role}`)}
              </span>
            </span>
          </span>
        )}
      </div>
      {subtitle && (
        <p className="max-w-[72ch] text-[13px] leading-5 text-blanc/80 lg:text-[14px] lg:leading-[22px]">
          {subtitle}
        </p>
      )}
      {stats && stats.length > 0 && (
        <dl className="flex flex-wrap gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-baseline gap-2 rounded-pill bg-blanc/10 px-3.5 py-1.5 ring-1 ring-blanc/15 ring-inset"
            >
              <dd className="text-[16px] leading-6 font-semibold text-lime">{stat.value}</dd>
              <dt className="text-[12px] leading-4 text-blanc/80">{stat.label}</dt>
            </div>
          ))}
        </dl>
      )}
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
  name = "q",
  hidden,
  children,
  aside,
}: {
  action: string;
  searchLabel: string;
  q?: string;
  /** Name of the search field (« q » by default). */
  name?: string;
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
          name={name}
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
  tone,
}: {
  label: string;
  group: string;
  options: { href: string; label: string; current: boolean }[];
  /** « sapin »: always filled (the period of the indicators), with the label as given. */
  tone?: "sapin";
}) {
  const active =
    tone === "sapin"
      ? undefined
      : options.find((option) => option.current && option !== options[0]);
  return (
    <details name={`filter-${group}`} className="group/menu relative shrink-0">
      <summary
        className={cx(
          chipClasses,
          "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
          active && chipOnClasses,
          tone === "sapin" && "h-9 !bg-sapin !text-blanc !ring-0",
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
  maxLength = 2000,
}: {
  id: string;
  label?: string;
  name?: string;
  defaultValue?: string;
  rows?: number;
  maxLength?: number;
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
        maxLength={maxLength}
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
  tone = "jm-admin-tile",
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

/**
 * Confirmation after an action (Admin v2): says what changed and, for the roles that read the
 * journal, links to the entry it wrote.
 */
export async function AdminDone({
  title,
  children,
  journal,
}: {
  title: string;
  children?: ReactNode;
  /** The target of the action (« Voir dans le journal »), or the journal address to open. */
  journal?: { type: string; id: string } | string;
}) {
  const [t, user] = await Promise.all([getTranslations("admin"), getCurrentUser()]);
  const reads = user?.platformRole === "platform_admin" || user?.platformRole === "support_agent";
  return (
    <Alert
      tone="success"
      title={title}
      action={
        journal && reads ? (
          <Link
            href={
              typeof journal === "string"
                ? journal
                : `/admin/journal?cible=${journal.type}&id=${encodeURIComponent(journal.id)}`
            }
            className="inline-flex items-center gap-1 text-[13px] font-semibold underline underline-offset-2"
          >
            <Icon name="doc" className="size-3.5" />
            {t("kit.seeJournal")}
          </Link>
        ) : undefined
      }
    >
      {children}
    </Alert>
  );
}

export type AdminStat = {
  label: string;
  value: ReactNode;
  icon?: IconName;
  /** A figure that asks for action (pending items) is drawn in Ambre when not zero. */
  tone?: "neutral" | "attention" | "success";
  href?: string;
};

/**
 * Summary figures at the top of a list page (Admin v2): 2 to 5 tiles, two per row on phones.
 * A tile with a link filters the list.
 */
export async function AdminStats({ items }: { items: AdminStat[] }) {
  const t = await getTranslations("admin.kit");
  return (
    <section aria-label={t("summary")}>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(170px,1fr))] lg:gap-3.5">
        {items.map((item) => {
          const body = (
            <>
              <span className="flex items-center justify-between gap-2 text-[12px] leading-4 text-ardoise">
                {item.label}
                {item.icon && (
                  <span
                    aria-hidden
                    className={cx(
                      "grid size-9 shrink-0 place-items-center rounded-[12px]",
                      item.tone === "attention"
                        ? "bg-ambre-fond text-ambre-texte"
                        : item.tone === "success"
                          ? "bg-lime-clair text-up-texte"
                          : "jm-admin-tile text-sapin",
                    )}
                  >
                    <Icon name={item.icon} className="size-4" />
                  </span>
                )}
              </span>
              <span className="text-[24px] leading-8 font-semibold tracking-[-0.025em] lg:text-[30px] lg:leading-9">
                {item.value}
              </span>
            </>
          );
          const box = cx(
            "jm-admin-card flex h-full flex-col gap-1.5 rounded-[22px] bg-blanc px-4 py-3.5 lg:px-5 lg:py-4",
            item.tone === "attention" && "ring-[1.5px] ring-ambre-fond ring-inset",
          );
          return (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={cx(
                    box,
                    "jm-admin-card-link focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus-visible:outline-none",
                  )}
                >
                  {body}
                </Link>
              ) : (
                <div className={box}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Previous / next pages of a long list, with « 51 à 100 sur 240 ». Links: works without JS. */
export async function AdminPager({
  page,
  total,
  pageSize,
  href,
}: {
  page: number;
  total: number;
  pageSize: number;
  href: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const t = await getTranslations("admin.kit.pager");
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const link =
    "inline-flex h-9 items-center gap-1.5 rounded-pill bg-blanc px-3.5 text-[12.5px] font-semibold ring-[1.5px] ring-brume ring-inset hover:ring-sapin";
  return (
    <nav aria-label={t("label")} className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-[12.5px] text-ardoise">
        {t("range", { from, to, total })}
        <span className="sr-only">
          {" · "}
          {t("status", { page, pages })}
        </span>
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className={link} rel="prev">
            <Icon name="chev-l" className="size-3.5" />
            {t("previous")}
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className={link} rel="next">
            {t("next")}
            <Icon name="chev-r" className="size-3.5" />
          </Link>
        )}
      </div>
    </nav>
  );
}

/** Empty list or search (Admin v2): an illustrated tile, what happened, and the useful action. */
export function AdminEmpty({
  title,
  text,
  icon = "recherche",
  action,
}: {
  title: string;
  text?: ReactNode;
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <div className="jm-admin-card flex flex-col items-center gap-2.5 rounded-[24px] bg-blanc px-6 py-10 text-center">
      <span
        aria-hidden
        className="jm-admin-tile grid size-14 place-items-center rounded-[18px] text-sapin"
      >
        <Icon name={icon} className="size-6" />
      </span>
      <p className="text-[16px] leading-[22px] font-semibold">{title}</p>
      {text && <p className="max-w-[46ch] text-[13px] leading-5 text-ardoise">{text}</p>}
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}

/** Reads `?page=` (1 when missing or invalid). */
export function pageParam(value: string | string[] | undefined) {
  const number = Number(typeof value === "string" ? value : "1");
  return Number.isInteger(number) && number > 0 ? Math.min(number, 10_000) : 1;
}
