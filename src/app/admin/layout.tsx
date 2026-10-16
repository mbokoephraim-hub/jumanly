import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon, Logo, type IconName } from "@/components/brand";
import { IconRail } from "@/components/layout/icon-rail";
import { NavLink } from "@/components/layout/nav-link";
import { SectionNav } from "@/components/layout/section-nav";
import { TopSearch } from "@/components/layout/top-search";
import type { Section, SectionLink } from "@/config/section-navigation";
import { Skeleton } from "@/components/ui";
import { requireAdminShell } from "@/server/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.seo");
  return { title: { absolute: t("title") }, robots: { index: false, follow: false } };
}

/**
 * Jumanly Admin: administrators, support agents and content editors (courses and contents); a 404 for
 * everyone else.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-[60dvh] rounded-panel" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

const links = [
  { key: "dashboard", href: "/admin", icon: "statistiques", group: "steer" },
  { key: "users", href: "/admin/utilisateurs", icon: "profil", group: "accounts" },
  { key: "organizations", href: "/admin/organisations", icon: "entreprise", group: "accounts" },
  { key: "partners", href: "/admin/partenaires", icon: "certificat", group: "accounts" },
  { key: "plans", href: "/admin/forfaits", icon: "portefeuille", group: "offer" },
  { key: "subscriptions", href: "/admin/abonnements", icon: "mobile-money", group: "offer" },
  { key: "courses", href: "/admin/formations", icon: "learn", group: "content" },
  { key: "content", href: "/admin/contenus", icon: "edit", group: "content" },
  { key: "jobs", href: "/admin/offres", icon: "jobs", group: "control" },
  { key: "reports", href: "/admin/signalements", icon: "securite", group: "control" },
  { key: "ai", href: "/admin/ia", icon: "intelligence", group: "control" },
  { key: "audit", href: "/admin/journal", icon: "doc", group: "control" },
] as const satisfies readonly { key: string; href: string; icon: IconName; group: string }[];

const groups = ["steer", "accounts", "offer", "content", "control"] as const;

// Mockup 07-01 (mobile): the floating pill shows the three most used sections and « more ».
const pillKeys = {
  admin: ["dashboard", "users", "reports"],
  editor: ["courses", "content"],
} as const;

async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminShell();
  if (!admin) notFound();
  const editorOnly = admin.platformRole === "content_editor";
  // Content editors only see courses and contents; support agents (read only) see everything
  // except these two editing tools, which they cannot open.
  const contentKeys: readonly string[] = ["courses", "content"];
  const visible = links.filter((link) =>
    editorOnly
      ? contentKeys.includes(link.key)
      : admin.platformRole !== "support_agent" || !contentKeys.includes(link.key),
  );
  const pill = (editorOnly ? pillKeys.editor : pillKeys.admin) as readonly string[];
  const [t, a11y, tNav] = await Promise.all([
    getTranslations("admin"),
    getTranslations("a11y"),
    getTranslations("appNav"),
  ]);
  const sections: Section[] = groups.map((group) => {
    const items = visible.filter((link) => link.group === group);
    const links: SectionLink[] = items.map((link) => ({
      href: link.href,
      label: t(`nav.${link.key}`),
      icon: link.icon,
    }));
    // The costs and revenue page belongs to the dashboard's group.
    if (group === "steer" && !editorOnly)
      links.push({ href: "/admin/indicateurs/couts", label: t("nav.costs"), icon: "portefeuille" });
    return {
      match: [
        ...items.map((link) => link.href),
        ...(group === "steer" ? ["/admin/indicateurs"] : []),
      ],
      label: t("nav.section", { group: t(`nav.group.${group}`) }),
      links,
    };
  });
  const home = editorOnly ? "/admin/formations" : "/admin";
  const roleLabel = t(`role.${admin.platformRole === "user" ? "readOnly" : admin.platformRole}`);
  const initials = admin.name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
  // Admin v3: the page sits on the site's light background (halos and dots); phones keep the deep
  // green header with the search and the account, the Crème sheet and the floating pill.
  return (
    <div className="jm-admin-bg min-h-dvh text-sapin md:flex">
      {/* First stop of the keyboard: skips the column of icons (and the phone header). */}
      <a
        href="#content"
        className="sr-only z-50 rounded-pill bg-lime px-4 py-2 text-sapin focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {a11y("skipToContent")}
      </a>
      {/* Admin v3 (docs/admin-v3/PLAN.md, étape 1): a floating gradient column of icons, as tall as
          its content and centered in the window; each label shows in a tooltip. */}
      <IconRail
        home={home}
        homeLabel={t("nav.home")}
        homeTip={`${t("nav.title")} · ${t("env.badge")}`}
        label={t("nav.title")}
        groups={groups.map((group) => ({
          label: t(`nav.group.${group}`),
          items: visible
            .filter((link) => link.group === group)
            .map((link) => ({ ...link, label: t(`nav.${link.key}`) })),
        }))}
        footer={
          <>
            {/* Admin v4, étape 3: the account at the foot of the column (name and role in the tip). */}
            <Link
              href="/app/profil"
              aria-label={`${admin.name} · ${roleLabel}`}
              className="jm-admin-link relative mt-1 grid size-10 place-items-center rounded-full bg-lime text-[13px] font-semibold text-sapin ring-2 ring-lime/50"
            >
              {initials}
              <span aria-hidden className="jm-admin-tip">
                {admin.name} · {roleLabel}
              </span>
            </Link>
            <Link
              href="/app"
              aria-label={t("nav.backToApp")}
              className="jm-admin-link relative grid size-10 place-items-center rounded-full text-blanc/75 hover:bg-blanc/12 hover:text-blanc"
            >
              <Icon name="chev-l" className="size-[21px]" />
              <span aria-hidden className="jm-admin-tip">
                {t("nav.backToApp")}
              </span>
            </Link>
          </>
        }
      />

      <header className="flex h-[72px] items-center gap-2.5 px-4 text-blanc md:hidden">
        <Link href={home} className="shrink-0 rounded-sm">
          <Logo variant="tile" height={42} />
        </Link>
        <form action="/admin/recherche" role="search" className="relative min-w-0 flex-1">
          <label htmlFor="admin-mobile-search" className="sr-only">
            {t(editorOnly ? "search.labelEditor" : "search.label")}
          </label>
          <Icon
            name="recherche"
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-blanc/70"
          />
          <input
            id="admin-mobile-search"
            name="q"
            type="search"
            placeholder={t("header.search")}
            className="h-11 w-full rounded-pill bg-blanc/10 pr-3 pl-10 text-[13px] text-blanc placeholder:text-blanc/70 focus:bg-blanc/16 focus:outline-2 focus:outline-lime"
          />
        </form>
        <Link
          href="/app"
          aria-label={t("nav.backToApp")}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-[#14745f] text-[14px] font-semibold text-neon ring-2 ring-lime"
        >
          {initials}
        </Link>
      </header>

      <div className="min-h-[calc(100dvh-72px)] min-w-0 flex-1 rounded-t-[28px] bg-creme md:min-h-0 md:rounded-none md:bg-transparent">
        {/* Admin v4, étape 2: the other sections of the same group, as a horizontal menu. */}
        <div className="jm-topbar sticky top-0 z-30 flex items-center gap-5 px-4 pt-3 sm:px-6 md:h-[68px] md:pt-0 lg:px-6 xl:px-[max(2rem,calc((100%-1400px)/2+2rem))]">
          <SectionNav sections={sections} className="min-w-0 flex-1" />
          <div className="ml-auto hidden w-[min(40%,420px)] shrink-0 justify-end md:flex">
            <TopSearch
              id="admin-search"
              action="/admin/recherche"
              label={t(editorOnly ? "search.labelEditor" : "search.label")}
              placeholder={t("header.search")}
              shortcut={tNav("search.shortcut")}
            />
          </div>
        </div>
        <main
          id="content"
          tabIndex={-1}
          className="jm-admin-page mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 pt-5 pb-32 outline-none sm:px-6 md:pt-4 md:pb-8 lg:px-6 xl:px-8"
        >
          {admin.platformRole === "support_agent" && (
            <p className="order-1 flex items-center gap-2.5 rounded-[14px] bg-neon px-4 py-2.5 text-[12px] font-medium">
              <Icon name="eye" className="size-4 shrink-0" />
              {t("users.supportReadOnly")}
            </p>
          )}
          {children}
        </main>
      </div>

      <nav
        aria-label={t("nav.mobile")}
        className="fixed bottom-[max(26px,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 rounded-pill bg-sapin bg-(image:--jm-degrade-rail-h) p-[7px] shadow-float md:hidden"
      >
        <ul className="flex items-center gap-1">
          {visible
            .filter((link) => pill.includes(link.key))
            .map((link) => (
              <li key={link.key}>
                <NavLink
                  href={link.href}
                  label={t(`nav.${link.key}`)}
                  icon={<Icon name={link.icon} />}
                  placement="pill"
                />
              </li>
            ))}
          {visible.length > pill.length && (
            <li>
              <details name="admin-more" className="group/menu relative">
                <summary
                  aria-label={t("nav.more")}
                  className="flex h-12 w-[46px] cursor-pointer list-none items-center justify-center rounded-pill text-blanc/70 group-open/menu:bg-blanc/10 group-open/menu:text-blanc hover:text-blanc [&::-webkit-details-marker]:hidden"
                >
                  <Icon name="grid" className="size-[22px]" />
                </summary>
                <ul className="absolute right-0 bottom-[calc(100%+14px)] flex w-64 flex-col gap-0.5 rounded-[22px] bg-nuit p-2 shadow-float">
                  {visible.map((link) => (
                    <li key={link.key}>
                      <NavLink
                        href={link.href}
                        label={t(`nav.${link.key}`)}
                        icon={<Icon name={link.icon} />}
                        placement="admin"
                      />
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/app"
                      className="flex h-[42px] items-center gap-3 rounded-sm px-3.5 text-[13.5px] font-medium text-blanc/70 hover:bg-blanc/8 hover:text-blanc"
                    >
                      <Icon name="chev-l" className="size-5" />
                      {t("nav.backToApp")}
                    </Link>
                  </li>
                </ul>
              </details>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
