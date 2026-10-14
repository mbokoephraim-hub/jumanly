import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand";
import { Badge, Skeleton } from "@/components/ui";
import { requireAdminShell } from "@/server/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.seo");
  return { title: { absolute: t("title") }, robots: { index: false, follow: false } };
}

/**
 * Jumanly Admin: administrators, support agents and content editors (courses only); a 404 for
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
  { key: "dashboard", href: "/admin" },
  { key: "users", href: "/admin/utilisateurs" },
  { key: "organizations", href: "/admin/organisations" },
  { key: "plans", href: "/admin/forfaits" },
  { key: "subscriptions", href: "/admin/abonnements" },
  { key: "courses", href: "/admin/formations" },
  { key: "jobs", href: "/admin/offres" },
  { key: "ai", href: "/admin/ia" },
  { key: "reports", href: "/admin/signalements" },
] as const;

async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminShell();
  if (!admin) notFound();
  const editorOnly = admin.platformRole === "content_editor";
  const visible = links.filter((link) => !editorOnly || link.key === "courses");
  const t = await getTranslations("admin");
  return (
    <div className="min-h-dvh bg-creme">
      <header className="bg-sapin text-blanc">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 page-x py-4">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo variant="negative" height={24} />
            <span className="font-semibold">{t("nav.title")}</span>
          </Link>
          <Badge tone="sapin">
            {t(`role.${admin.platformRole === "user" ? "readOnly" : admin.platformRole}`)}
          </Badge>
          <nav aria-label={t("nav.title")} className="flex flex-wrap gap-4 text-sm">
            {visible.map((link) => (
              <Link key={link.key} href={link.href} className="underline-offset-4 hover:underline">
                {t(`nav.${link.key}`)}
              </Link>
            ))}
            <Link href="/app" className="text-blanc/80 underline-offset-4 hover:underline">
              {t("nav.backToApp")}
            </Link>
          </nav>
        </div>
      </header>
      <main id="content" className="mx-auto flex max-w-6xl flex-col gap-6 page-x py-8">
        {admin.platformRole === "support_agent" && (
          <p className="text-sm text-ardoise">{t("users.supportReadOnly")}</p>
        )}
        {children}
        <p className="text-ardoise text-caption">{t("audit.notice")}</p>
      </main>
    </div>
  );
}
