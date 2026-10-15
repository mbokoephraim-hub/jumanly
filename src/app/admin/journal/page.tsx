import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AuditRows, targetLabel } from "@/components/admin/audit";
import {
  AdminEmpty,
  AdminFilterBar,
  AdminPageHeader,
  AdminPager,
  AdminStats,
  FilterMenu,
  adminCard,
  pageParam,
} from "@/components/admin/kit";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  AUDIT_FAMILIES,
  AUDIT_PERIODS,
  AUDIT_TARGETS,
  listAudit,
  readAuditFilters,
} from "@/server/services/admin-audit";

const PAGE = "/admin/journal";
/** Families whose actions change access, money or a decision (« Actions sensibles »). */
const SENSITIVE = [
  "user.",
  "plan.",
  "payment.",
  "subscription.",
  "certificate.",
  "org.verification",
];

/**
 * Journal d'audit (Admin v2, étape 1): who did what, on what, with which reason. Read only, for
 * administrators and support agents; filters are links and GET forms.
 */
export default async function AdminJournal({ searchParams }: PageProps<"/admin/journal">) {
  await connection();
  if (!(await requireAdmin())) notFound();
  const params = await searchParams;
  const t = await getTranslations("admin");
  const filters = readAuditFilters(params);
  const page = pageParam(params.page);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const dayAgo = new Date(now.getTime() - 86_400_000);

  const [result, today, week, actors, sensitive] = await Promise.all([
    listAudit(db, { ...filters, page }, now),
    db.auditLog.count({ where: { createdAt: { gte: dayAgo } } }),
    db.auditLog.count({ where: { createdAt: { gte: weekAgo } } }),
    db.auditLog.groupBy({
      by: ["actorId"],
      where: { createdAt: { gte: weekAgo }, actorId: { not: null } },
    }),
    db.auditLog.count({
      where: {
        createdAt: { gte: weekAgo },
        OR: SENSITIVE.map((prefix) => ({ action: { startsWith: prefix } })),
      },
    }),
  ]);

  const current = {
    action: filters.family,
    cible: filters.target,
    periode: filters.period ? String(filters.period) : undefined,
    auteur: filters.actor,
    id: filters.targetId,
  };
  const href = (changes: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...current, ...changes }))
      if (value) query.set(key, value);
    const text = query.toString();
    return text ? `${PAGE}?${text}` : PAGE;
  };
  const exportQuery = new URLSearchParams(
    Object.entries(current).filter((entry): entry is [string, string] => !!entry[1]),
  ).toString();
  const filtered = Object.values(current).some(Boolean);

  return (
    <>
      <AdminPageHeader title={t("journal.title")} subtitle={t("journal.subtitle")} />
      <AdminStats
        items={[
          {
            label: t("journal.stats.today"),
            value: today,
            icon: "horloge",
            href: href({ periode: "1", page: undefined }),
          },
          {
            label: t("journal.stats.week"),
            value: week,
            icon: "statistiques",
            href: href({ periode: "7", page: undefined }),
          },
          { label: t("journal.stats.actors"), value: actors.length, icon: "equipe" },
          {
            label: t("journal.stats.sensitive"),
            value: sensitive,
            icon: "securite",
            tone: sensitive > 0 ? "attention" : "neutral",
          },
        ]}
      />
      <AdminFilterBar
        action={PAGE}
        searchLabel={t("journal.filter.actor")}
        q={filters.actor}
        name="auteur"
        hidden={{ ...current, auteur: undefined }}
        aside={
          <ButtonLink
            href={`/admin/journal.csv${exportQuery ? `?${exportQuery}` : ""}`}
            variant="secondary"
            size="sm"
            icon={<Icon name="telecharger" />}
          >
            {t("journal.export")}
          </ButtonLink>
        }
      >
        <FilterMenu
          label={t("journal.filter.family")}
          group="action"
          options={[
            {
              href: href({ action: undefined, page: undefined }),
              label: t("journal.filter.all"),
              current: !filters.family,
            },
            ...AUDIT_FAMILIES.map((family) => ({
              href: href({ action: family, page: undefined }),
              label: t(`journal.family.${family}`),
              current: filters.family === family,
            })),
          ]}
        />
        <FilterMenu
          label={t("journal.filter.target")}
          group="cible"
          options={[
            {
              href: href({ cible: undefined, id: undefined, page: undefined }),
              label: t("journal.filter.all"),
              current: !filters.target,
            },
            ...AUDIT_TARGETS.map((target) => ({
              href: href({ cible: target, id: undefined, page: undefined }),
              label: targetLabel(t, target),
              current: filters.target === target,
            })),
          ]}
        />
        <FilterMenu
          label={t("journal.filter.period")}
          group="periode"
          options={[
            {
              href: href({ periode: undefined, page: undefined }),
              label: t("journal.filter.allPeriods"),
              current: !filters.period,
            },
            ...AUDIT_PERIODS.map((days) => ({
              href: href({ periode: String(days), page: undefined }),
              label: t("journal.filter.days", { count: days }),
              current: filters.period === days,
            })),
          ]}
        />
        {filters.targetId && (
          <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-pill bg-sapin px-3.5 text-[12.5px] font-medium text-blanc">
            {t("journal.filter.oneTarget")}
            <Link
              href={href({ id: undefined, page: undefined })}
              aria-label={t("journal.filter.clear")}
              className="grid size-5 place-items-center rounded-full bg-blanc/15"
            >
              <Icon name="fermer" className="size-3" />
            </Link>
          </span>
        )}
      </AdminFilterBar>

      <p className="text-[12.5px] text-ardoise" aria-live="polite">
        {t("journal.count", { count: result.total })}
      </p>

      {result.entries.length === 0 ? (
        <AdminEmpty
          icon="doc"
          title={t("journal.empty.title")}
          text={t("journal.empty.text")}
          action={
            filtered ? (
              <ButtonLink href={PAGE} variant="secondary" size="sm">
                {t("journal.filter.clear")}
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <section aria-label={t("journal.title")} className={adminCard}>
          <AuditRows entries={result.entries} />
        </section>
      )}
      <AdminPager
        page={result.page}
        total={result.total}
        pageSize={result.pageSize}
        href={(number) => href({ page: number > 1 ? String(number) : undefined })}
      />
    </>
  );
}
