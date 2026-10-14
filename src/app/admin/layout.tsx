import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon, Logo, type IconName } from "@/components/brand";
import { NavLink } from "@/components/layout/nav-link";
import { Badge, Skeleton } from "@/components/ui";
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
  { key: "users", href: "/admin/utilisateurs", icon: "equipe" },
  { key: "organizations", href: "/admin/organisations", icon: "entreprise" },
  { key: "plans", href: "/admin/forfaits", icon: "reglages" },
  { key: "subscriptions", href: "/admin/abonnements", icon: "portefeuille" },
  { key: "courses", href: "/admin/formations", icon: "learn" },
  { key: "jobs", href: "/admin/offres", icon: "jobs" },
  { key: "partners", href: "/admin/partenaires", icon: "connect" },
  { key: "ai", href: "/admin/ia", icon: "intelligence" },
  { key: "content", href: "/admin/contenus", icon: "doc" },
  { key: "reports", href: "/admin/signalements", icon: "securite" },
] as const satisfies readonly { key: string; href: string; icon: IconName }[];

async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminShell();
  if (!admin) notFound();
  const editorOnly = admin.platformRole === "content_editor";
  const visible = links.filter(
    (link) => !editorOnly || link.key === "courses" || link.key === "content",
  );
  const t = await getTranslations("admin");
  // Mockup 00-04: wide Nuit bar (256 px) with inline labels, Crème main panel with 32 px corners.
  // On small screens the bar becomes a scrollable row above the panel.
  return (
    <div className="min-h-dvh bg-nuit text-sapin lg:flex lg:py-3.5 lg:pr-3.5">
      <aside className="flex shrink-0 flex-col gap-3 px-4 pt-4 pb-3 text-blanc lg:sticky lg:top-3.5 lg:h-[calc(100dvh-28px)] lg:w-64 lg:gap-1 lg:overflow-y-auto lg:px-[18px] lg:py-3.5">
        <div className="flex items-center justify-between gap-3 lg:mb-4 lg:flex-col lg:items-start">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo variant="negative" height={26} />
          </Link>
          <Badge tone="lime">
            {t(`role.${admin.platformRole === "user" ? "readOnly" : admin.platformRole}`)}
          </Badge>
        </div>
        <nav aria-label={t("nav.title")} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <ul className="flex gap-1 lg:flex-col">
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
          className="hidden h-[42px] items-center gap-3 rounded-sm px-3.5 text-[13.5px] font-medium text-blanc/70 hover:bg-blanc/8 hover:text-blanc lg:mt-auto lg:flex"
        >
          <Icon name="precedent" className="size-5" />
          {t("nav.backToApp")}
        </Link>
      </aside>
      <div className="min-w-0 flex-1 rounded-t-[28px] bg-creme lg:rounded-panel">
        <main
          id="content"
          className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-[30px] lg:pt-[26px] lg:pb-[30px]"
        >
          {admin.platformRole === "support_agent" && (
            <p className="text-sm text-ardoise">{t("users.supportReadOnly")}</p>
          )}
          {children}
          <p className="text-ardoise text-caption">{t("audit.notice")}</p>
          <Link href="/app" className="text-sm font-semibold text-feuille-fonce lg:hidden">
            {t("nav.backToApp")}
          </Link>
        </main>
      </div>
    </div>
  );
}
