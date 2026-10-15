import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Character } from "@/components/brand";
import { Icon } from "@/components/brand/icon";
import {
  AdminFilterBar,
  AdminPageHeader,
  AdminTabs,
  AuditNotice,
  FilterMenu,
  Tag,
  adminCard,
  adminLabel,
} from "@/components/admin/kit";
import { Alert, Button, buttonClasses } from "@/components/ui";
import { formatShortDate as formatDate } from "@/lib/dates";
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
type ReportType = (typeof types)[number];

const tabs = { ouverts: "open", "en-cours": "inProgress", clotures: "closed" } as const;
type Tab = keyof typeof tabs;

const actions = ["dismiss", "hide"] as const;
type Action = (typeof actions)[number];

type Params = { onglet?: Tab; q?: string; type?: string; priorite?: string; id?: string };

function hrefOf(params: Params, changes: Partial<Params & { action: string }> = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...changes })) {
    if (value && !(key === "onglet" && value === "ouverts")) query.set(key, value);
  }
  const text = query.toString();
  return text ? `/admin/signalements?${text}` : "/admin/signalements";
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value.slice(0, 100) : undefined;

/** Reports (partie 10 § 10.7): urgent ones first, only the reported content is shown. */
export default async function AdminReports({ searchParams }: PageProps<"/admin/signalements">) {
  const raw = await searchParams;
  const admin = await requireAdmin();
  // Content editors see the admin shell, but only the courses.
  if (!admin) notFound();
  const t = await getTranslations("admin.reports");
  const tr = await getTranslations("report.reason");
  const tc = await getTranslations("common");
  const writable = canWriteAdmin(admin);

  const tabParam = one(raw.onglet) ?? "";
  const onglet: Tab = tabParam in tabs ? (tabParam as Tab) : "ouverts";
  const type = (types as readonly string[]).includes(one(raw.type) ?? "")
    ? (one(raw.type) as ReportType)
    : undefined;
  const priorite = ["haute", "normale"].includes(one(raw.priorite) ?? "")
    ? one(raw.priorite)
    : undefined;
  const q = one(raw.q)?.trim() || undefined;
  const params: Params = { onglet, q, type, priorite };

  const [active, closed] = await Promise.all([
    listReports(db, "open"),
    onglet === "clotures" ? listReports(db, "closed") : Promise.resolve([]),
  ]);
  const opened = active.filter((report) => report.status === "open");
  const inProgress = active.filter((report) => report.status === "in_progress");
  const all = onglet === "clotures" ? closed : onglet === "en-cours" ? inProgress : opened;
  const context = await reportContext(db, all);

  const reasonOf = (reason: string) =>
    (reportReasons as readonly string[]).includes(reason)
      ? tr(reason as (typeof reportReasons)[number])
      : reason;
  const urgent = (reason: string) => urgentReasons.includes(reason);
  const typeOf = (value: string) =>
    (types as readonly string[]).includes(value) ? (value as ReportType) : null;
  const count = (report: { targetType: string; targetId: string }) =>
    all.filter((item) => item.targetType === report.targetType && item.targetId === report.targetId)
      .length;

  const needle = q?.toLowerCase();
  const rows = all
    .filter((report) => !type || report.targetType === type)
    .filter((report) => !priorite || urgent(report.reason) === (priorite === "haute"))
    .filter((report) => {
      if (!needle) return true;
      const reporter = context.reporter.get(report.reporterId);
      return [reasonOf(report.reason), report.details, reporter?.name, reporter?.email].some(
        (text) => text?.toLowerCase().includes(needle),
      );
    })
    .sort(
      (a, b) =>
        Number(urgent(b.reason)) - Number(urgent(a.reason)) ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    );

  const selected = rows.find((report) => report.id === one(raw.id)) ?? rows[0];
  const action = actions.find((item) => item === one(raw.action));
  const filtered = Boolean(q || type || priorite);
  const emptyText = filtered
    ? t("emptyFiltered")
    : onglet === "clotures"
      ? t("emptyClosed")
      : onglet === "en-cours"
        ? t("emptyInProgress")
        : t("empty");

  const priorityTag = (reason: string) =>
    urgent(reason) ? (
      <Tag tone="error" icon="securite">
        {t("priority.high.text")}
      </Tag>
    ) : null;

  return (
    <>
      <AdminPageHeader title={t("title")} />
      <AdminTabs
        label={t("title")}
        items={(Object.keys(tabs) as Tab[]).map((id) => ({
          href: hrefOf({ onglet: id }),
          current: onglet === id,
          label:
            id === "ouverts"
              ? t("tab.open", { count: opened.length })
              : t(`tab.${tabs[id] as "inProgress" | "closed"}`),
        }))}
      />
      {raw.ok && <Alert tone="success" title={t("resolved")} />}

      <AdminFilterBar
        action="/admin/signalements"
        searchLabel={t("search")}
        q={q}
        hidden={{ onglet: onglet === "ouverts" ? undefined : onglet, type, priorite }}
      >
        <FilterMenu
          label={t("filter.type")}
          group="reports-type"
          options={[undefined, ...types].map((value) => ({
            href: hrefOf(params, { type: value }),
            label: value ? t(`type.${value}`) : t("filter.all"),
            current: type === value,
          }))}
        />
        <FilterMenu
          label={t("filter.priority")}
          group="reports-priority"
          options={[undefined, "haute", "normale"].map((value) => ({
            href: hrefOf(params, { priorite: value }),
            label: !value
              ? t("filter.all")
              : value === "haute"
                ? t("priority.high.text")
                : t("priority.normal"),
            current: priorite === value,
          }))}
        />
      </AdminFilterBar>

      {rows.length === 0 ? (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className={cx(adminCard, "flex items-center gap-4")}>
            <Character name="nadia" pose="repos" height={90} />
            <div className="flex flex-col gap-1">
              <p className="text-[15px] font-semibold">{emptyText}</p>
              <p className="text-[12px] leading-[17px] text-ardoise">{t("messageAccess")}</p>
            </div>
          </div>
          <AuditNotice />
        </div>
      ) : (
        <>
          {/* Desktop: table. */}
          <div className="hidden rounded-[24px] bg-blanc py-1.5 lg:block">
            <table className="w-full table-fixed border-collapse text-left text-[13px]">
              <caption className="sr-only">{t("list")}</caption>
              <thead>
                <tr className={adminLabel}>
                  <th scope="col" className="w-[130px] px-[18px] py-2.5 font-semibold">
                    {t("filter.priority")}
                  </th>
                  <th scope="col" className="w-[180px] px-1.5 py-2.5 font-semibold">
                    {t("filter.type")}
                  </th>
                  <th scope="col" className="px-1.5 py-2.5 font-semibold">
                    {t("col.reason")}
                  </th>
                  <th scope="col" className="w-[150px] px-1.5 py-2.5 font-semibold">
                    {t("col.reportedBy")}
                  </th>
                  <th scope="col" className="w-[110px] px-1.5 py-2.5 font-semibold">
                    {t("col.count")}
                  </th>
                  <th scope="col" className="w-[120px] py-2.5 pr-[18px] pl-1.5 font-semibold">
                    {t("col.date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((report) => {
                  const kind = typeOf(report.targetType);
                  const current = report.id === selected?.id;
                  return (
                    <tr
                      key={report.id}
                      aria-current={current ? "true" : undefined}
                      className={cx("border-t border-brume", current && "bg-creme/60")}
                    >
                      <td className="px-[18px] py-3.5">
                        {priorityTag(report.reason) ?? (
                          <span className="text-[11px] text-ardoise">{t("priority.normal")}</span>
                        )}
                      </td>
                      <td className="px-1.5 py-3.5">
                        <Tag>{kind ? t(`type.${kind}`) : report.targetType}</Tag>
                      </td>
                      <td className="px-1.5 py-3.5">
                        <Link
                          href={`${hrefOf(params, { id: report.id })}#signalement`}
                          scroll={false}
                          className="font-medium hover:underline"
                        >
                          {reasonOf(report.reason)}
                        </Link>
                      </td>
                      <td className="truncate px-1.5 py-3.5 text-ardoise">
                        {context.reporter.get(report.reporterId)?.name}
                      </td>
                      <td className="px-1.5 py-3.5 font-semibold">{count(report)}</td>
                      <td className="py-3.5 pr-[18px] pl-1.5 whitespace-nowrap">
                        {formatDate(report.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phones: list of cards. */}
          <ul className="flex flex-col rounded-[24px] bg-blanc px-5 py-1 lg:hidden">
            {rows.map((report, index) => {
              const kind = typeOf(report.targetType);
              return (
                <li key={report.id} className={cx(index > 0 && "border-t border-brume")}>
                  <Link
                    href={`${hrefOf(params, { id: report.id })}#signalement`}
                    aria-current={report.id === selected?.id ? "true" : undefined}
                    className="flex items-center gap-3 py-3.5"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex flex-wrap gap-1.5">
                        <Tag>{kind ? t(`type.${kind}`) : report.targetType}</Tag>
                        {urgent(report.reason) && <Tag tone="error">{t("priority.high.text")}</Tag>}
                      </span>
                      <span className="text-[14px] leading-5 font-semibold">
                        {reasonOf(report.reason)}
                      </span>
                      <span className="text-[12px] text-ardoise">
                        {[t("count", { count: count(report) }), formatDate(report.createdAt)].join(
                          " · ",
                        )}
                      </span>
                    </span>
                    <Icon name="chev-r" className="size-4 shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
            {selected && (
              <ReportDetail
                report={selected}
                kind={typeOf(selected.targetType)}
                title={t(
                  `detail.title.${typeOf(selected.targetType) ?? "conversation"}` as "detail.title.job",
                )}
                reason={reasonOf(selected.reason)}
                count={count(selected)}
                context={context}
                writable={writable}
                action={action}
                closeHref={`${hrefOf(params, { id: selected.id })}#signalement`}
                actionHref={(value) =>
                  `${hrefOf(params, { id: selected.id, action: value })}#signalement`
                }
                priorityTag={priorityTag(selected.reason)}
                confirmLabel={tc("confirm")}
                cancelLabel={tc("cancel")}
              />
            )}
            <AuditNotice />
          </div>
        </>
      )}
    </>
  );
}

type Report = Awaited<ReturnType<typeof listReports>>[number];
type Context = Awaited<ReturnType<typeof reportContext>>;

/** Detail of the selected report: the reported content only, then the decision. */
async function ReportDetail({
  report,
  kind,
  title,
  reason,
  count,
  context,
  writable,
  action,
  closeHref,
  actionHref,
  priorityTag,
  confirmLabel,
  cancelLabel,
}: {
  report: Report;
  kind: ReportType | null;
  title: string;
  reason: string;
  count: number;
  context: Context;
  writable: boolean;
  action?: Action;
  closeHref: string;
  actionHref: (action: Action) => string;
  priorityTag: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
}) {
  const t = await getTranslations("admin.reports");
  const reporter = context.reporter.get(report.reporterId);
  const job = context.job.get(report.targetId);
  const message = context.message.get(report.targetId);
  const conversation = context.conversation.get(report.targetId);
  const available: Action[] =
    kind === "job" || kind === "message" ? ["dismiss", "hide"] : ["dismiss"];
  const chosen = action && available.includes(action) ? action : undefined;
  const resolution = actions.find((item) => item === report.resolution);

  return (
    <section
      id="signalement"
      aria-labelledby="signalement-titre"
      className={cx(adminCard, "flex scroll-mt-6 flex-col gap-3.5")}
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <h2
          id="signalement-titre"
          className="text-[18px] leading-6 font-semibold tracking-[-0.015em] lg:text-[20px] lg:leading-[26px]"
        >
          {title}
        </h2>
        {priorityTag}
        <span className="ml-auto text-[11px] text-ardoise">
          {[t("count", { count }), formatDate(report.createdAt)].join(" · ")}
        </span>
      </div>
      <p className="-mt-1.5 text-[11.5px] text-ardoise">{reason}</p>
      <p className="flex items-start gap-2.5 rounded-[12px] bg-brume px-3 py-2.5 text-[11.5px] leading-4">
        <Icon name="lock" className="size-4 shrink-0" />
        {t("messageAccess")}
      </p>

      <div className="flex flex-col gap-2.5 rounded-[18px] bg-creme p-4">
        {message && (
          <div className="flex flex-col items-start gap-1">
            <p className="max-w-[420px] rounded-[16px_16px_16px_6px] bg-down-fond px-3.5 py-2.5 text-[12.5px] leading-[18px] whitespace-pre-line ring-[1.5px] ring-down-texte ring-inset">
              {message.body}
            </p>
            <span className="text-[11px] text-ardoise">
              {[
                message.conversation.organization?.name ?? t("detail.author"),
                t("detail.flagged"),
              ].join(" · ")}
            </span>
            {message.hiddenAt && (
              <span className="text-[11px] font-medium">{t("detail.hidden")}</span>
            )}
          </div>
        )}
        {job && (
          <div className="flex flex-col gap-1 rounded-[16px] bg-blanc px-3.5 py-3">
            <p className="text-[13.5px] font-semibold">{job.title}</p>
            <p className="text-[12px] text-ardoise">{job.organization.name}</p>
            {job.status === "published" && (
              <Link
                href={`/offres/${job.slug}`}
                className="self-start text-[12px] font-semibold underline"
              >
                {t("detail.seeJob")}
              </Link>
            )}
          </div>
        )}
        {conversation && (
          <p className="rounded-[16px] bg-blanc px-3.5 py-3 text-[13px] font-medium">
            {conversation.organization?.name}
          </p>
        )}
        {report.details && (
          <div className="flex flex-col gap-1">
            <span className={adminLabel}>{t("detail.details")}</span>
            <p className="text-[12.5px] leading-[18px] whitespace-pre-line">{report.details}</p>
          </div>
        )}
        <p className="text-[11px] text-ardoise">
          {[
            t("col.reportedBy"),
            [reporter?.name, reporter?.email].filter(Boolean).join(" · "),
          ].join(" : ")}
        </p>
      </div>

      {report.status === "closed" && resolution && (
        <p className="text-[13px] font-medium">
          {t("detail.decision", { action: t(`action.${resolution}`) })}
        </p>
      )}

      {writable && report.status !== "closed" && (
        <>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {available.map((item) => (
              <li key={item}>
                <Link
                  href={actionHref(item)}
                  scroll={false}
                  aria-current={chosen === item ? "true" : undefined}
                  className={cx(
                    buttonClasses({
                      variant: chosen === item ? "secondary" : "tertiary",
                      fullWidth: true,
                    }),
                  )}
                >
                  {t(`action.${item}`)}
                </Link>
              </li>
            ))}
          </ul>
          {chosen && (
            <form action={resolveReportAction} className="flex flex-col gap-3">
              <input type="hidden" name="report" value={report.id} />
              <input type="hidden" name="action" value={chosen} />
              <p className="text-[13px] leading-[19px]">{t(`confirm.${chosen}`)}</p>
              <div className="flex flex-wrap justify-end gap-2">
                <Link
                  href={closeHref}
                  scroll={false}
                  className={buttonClasses({ variant: "tertiary" })}
                >
                  {cancelLabel}
                </Link>
                <Button type="submit" variant={chosen === "hide" ? "danger" : "secondary"}>
                  {confirmLabel}
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}
