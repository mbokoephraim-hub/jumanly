import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon, Logo, type IconName } from "@/components/brand";
import { NavLink } from "@/components/layout/nav-link";
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
  { key: "dashboard", href: "/admin", icon: "statistiques" },
  { key: "users", href: "/admin/utilisateurs", icon: "profil" },
  { key: "organizations", href: "/admin/organisations", icon: "entreprise" },
  { key: "plans", href: "/admin/forfaits", icon: "portefeuille" },
  { key: "subscriptions", href: "/admin/abonnements", icon: "mobile-money" },
  { key: "courses", href: "/admin/formations", icon: "learn" },
  { key: "jobs", href: "/admin/offres", icon: "jobs" },
  { key: "partners", href: "/admin/partenaires", icon: "certificat" },
  { key: "ai", href: "/admin/ia", icon: "intelligence" },
  { key: "content", href: "/admin/contenus", icon: "edit" },
  { key: "reports", href: "/admin/signalements", icon: "securite" },
  { key: "audit", href: "/admin/journal", icon: "doc" },
] as const satisfies readonly { key: string; href: string; icon: IconName }[];

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
  const t = await getTranslations("admin");
  const home = editorOnly ? "/admin/formations" : "/admin";
  const initials = admin.name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
  // Mockup 07-01: wide Nuit bar (256 px) with the Lime tile, « Jumanly Admin » and the Néon
  // « Administration » tag; Crème main panel with 32 px corners. Phones: Sapin header with the
  // search and the account, Crème sheet, floating pill navigation.
  return (
    <div className="min-h-dvh bg-sapin text-sapin lg:flex lg:bg-nuit lg:py-3.5 lg:pr-3.5">
      <aside className="hidden shrink-0 flex-col gap-1 text-blanc lg:sticky lg:top-3.5 lg:flex lg:h-[calc(100dvh-28px)] lg:w-64 lg:overflow-y-auto lg:px-[18px] lg:py-3.5">
        <Link href={home} className="flex items-center gap-2.5 px-1.5 pb-[18px]">
          <Logo variant="tile" height={40} />
          <span className="flex flex-col items-start">
            <span className="text-[15px] leading-5 font-semibold">{t("nav.title")}</span>
            <span className="mt-[3px] inline-flex h-5 items-center rounded-pill bg-neon px-2.5 text-[10px] font-semibold text-sapin">
              {t("env.badge")}
            </span>
          </span>
        </Link>
        <nav aria-label={t("nav.title")}>
          <ul className="flex flex-col gap-1">
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
          </ul>
        </nav>
        <Link
          href="/app"
          className="mt-auto flex h-[42px] items-center gap-3 rounded-sm px-3.5 text-[13.5px] font-medium text-blanc/70 hover:bg-blanc/8 hover:text-blanc"
        >
          <Icon name="chev-l" className="size-5" />
          {t("nav.backToApp")}
        </Link>
      </aside>

      <header className="flex h-[72px] items-center gap-2.5 px-4 text-blanc lg:hidden">
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

      <div className="min-h-[calc(100dvh-72px)] min-w-0 flex-1 rounded-t-[28px] bg-creme lg:min-h-0 lg:rounded-panel">
        <main
          id="content"
          className="flex flex-col gap-5 px-4 pt-5 pb-32 sm:px-6 lg:px-[30px] lg:pt-[26px] lg:pb-[30px]"
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
        className="fixed bottom-[max(26px,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 rounded-pill bg-sapin p-[7px] shadow-float lg:hidden"
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
