import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Alert, Badge, Button } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { cx } from "@/lib/cx";
import { resolveReportAction } from "@/server/actions/admin";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  listReports,
  reportContext,
  reportReasons,
  urgentReasons,
} from "@/server/services/moderation";

const types = ["job", "message", "conversation"] as const;

/** Reports (partie 10 § 10.7): urgent ones first, only the reported content is shown. */
export default async function AdminReports({ searchParams }: PageProps<"/admin/signalements">) {
  const params = await searchParams;
  const admin = await requireAdmin();
  const t = await getTranslations("admin.reports");
  const tr = await getTranslations("report.reason");
  const writable = admin ? canWriteAdmin(admin) : false;
  const tab = params.onglet === "clotures" ? "closed" : "open";
  const [open, reports] = await Promise.all([listReports(db, "open"), listReports(db, tab)]);
  const sorted = [...reports].sort(
    (a, b) => Number(urgentReasons.includes(b.reason)) - Number(urgentReasons.includes(a.reason)),
  );
  const context = await reportContext(db, sorted);

  return (
    <>
      <h1 className="text-h1">{t("title")}</h1>
      {params.ok && <Alert tone="success" title={t("resolved")} />}
      <nav aria-label={t("title")} className="flex flex-wrap gap-2">
        {[
          { id: "ouverts", label: t("tab.open", { count: open.length }), active: tab === "open" },
          { id: "clotures", label: t("tab.closed"), active: tab === "closed" },
        ].map((item) => (
          <Link
            key={item.id}
            href={`/admin/signalements?onglet=${item.id}`}
            aria-current={item.active ? "page" : undefined}
            className={cx(
              "rounded-pill px-4 py-2 text-[15px] font-medium",
              item.active ? "bg-sapin text-blanc" : "bg-blanc",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <p className="text-sm text-ardoise">{t("messageAccess")}</p>
      {sorted.length === 0 ? (
        <p className="rounded-card bg-blanc p-6">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {sorted.map((report) => {
            const type = (types as readonly string[]).includes(report.targetType)
              ? (report.targetType as (typeof types)[number])
              : null;
            const reporter = context.reporter.get(report.reporterId);
            const job = context.job.get(report.targetId);
            const message = context.message.get(report.targetId);
            const conversation = context.conversation.get(report.targetId);
            const reason = (reportReasons as readonly string[]).includes(report.reason)
              ? tr(report.reason as (typeof reportReasons)[number])
              : report.reason;
            return (
              <li key={report.id} className="flex flex-col gap-3 rounded-card bg-blanc p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {type && <Badge tone="hire">{t(`type.${type}`)}</Badge>}
                  {urgentReasons.includes(report.reason) && (
                    <Badge tone="error">{t("priority.high.text")}</Badge>
                  )}
                  <span className="text-sm text-ardoise">{formatDate(report.createdAt)}</span>
                </div>
                <dl className="grid gap-1 text-sm sm:grid-cols-[max-content_1fr] sm:gap-x-4">
                  <dt className="font-semibold">{t("col.reason")}</dt>
                  <dd>{reason}</dd>
                  <dt className="font-semibold">{t("col.reportedBy")}</dt>
                  <dd>{reporter ? [reporter.name, reporter.email].join(" · ") : ""}</dd>
                </dl>
                {report.details && (
                  <p className="rounded-md bg-creme p-3 text-sm whitespace-pre-line">
                    {report.details}
                  </p>
                )}
                {job && (
                  <p className="text-sm">
                    {job.status === "published" ? (
                      <Link href={`/offres/${job.slug}`} className="font-medium underline">
                        {job.title}
                      </Link>
                    ) : (
                      job.title
                    )}
                    {[" ·", job.organization.name].join(" ")}
                  </p>
                )}
                {message && (
                  <blockquote className="border-l-4 border-brume pl-3 text-sm whitespace-pre-line">
                    {[message.conversation.organization?.name, message.body]
                      .filter(Boolean)
                      .join(" · ")}
                  </blockquote>
                )}
                {conversation && <p className="text-sm">{conversation.organization?.name}</p>}
                {writable && report.status !== "closed" && (
                  <div className="flex flex-wrap gap-2">
                    <form action={resolveReportAction}>
                      <input type="hidden" name="report" value={report.id} />
                      <input type="hidden" name="action" value="dismiss" />
                      <Button type="submit" size="sm" variant="tertiary">
                        {t("action.dismiss")}
                      </Button>
                    </form>
                    {(type === "job" || type === "message") && (
                      <form action={resolveReportAction}>
                        <input type="hidden" name="report" value={report.id} />
                        <input type="hidden" name="action" value="hide" />
                        <Button type="submit" size="sm" variant="danger">
                          {t("action.hide")}
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
