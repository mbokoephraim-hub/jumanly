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
  ReasonField,
  Tag,
  adminCard,
  adminLabel,
  type TagTone,
} from "@/components/admin/kit";
import { QueueNav } from "@/components/admin/queue-nav";
import { Alert, Button, Checkbox, TextArea } from "@/components/ui";
import { formatDateTime, formatShortDate as formatDate } from "@/lib/dates";
import { cx } from "@/lib/cx";
import { closeReportAction, reportNoteAction } from "@/server/actions/admin-moderation";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  listReports,
  messageContext,
  reportAuthor,
  reportContext,
  reportCounts,
  reportNotes,
  reportReasons,
  reportSeverity,
  urgentReasons,
} from "@/server/services/moderation";

const types = ["job", "message", "conversation", "profile", "post"] as const;
type ReportType = (typeof types)[number];

const tabs = { ouverts: "open", "en-cours": "inProgress", clotures: "closed" } as const;
type Tab = keyof typeof tabs;

const decisions = ["dismiss", "warn", "hide"] as const;
type Decision = (typeof decisions)[number];

const severityTone: Record<number, TagTone> = { 2: "error", 1: "warning", 0: "neutral" };

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

/**
 * Reports (partie 10 § 10.7, Admin v2 étape 7): the most serious and the oldest first; the
 * reported content, its immediate context on request (logged), internal notes, then a decision
 * with a reason that closes it and informs whoever reported.
 */
export default async function AdminReports({ searchParams }: PageProps<"/admin/signalements">) {
  const raw = await searchParams;
  const admin = await requireAdmin();
  // Content editors see the admin shell, but only the courses.
  if (!admin) notFound();
  const t = await getTranslations("admin.reports");
  const tr = await getTranslations("report.reason");
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

  const [active, closed, counts] = await Promise.all([
    listReports(db, "open"),
    onglet === "clotures" ? listReports(db, "closed") : Promise.resolve([]),
    reportCounts(db),
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
    });

  const selected = rows.find((report) => report.id === one(raw.id)) ?? rows[0];
  const index = selected ? rows.indexOf(selected) : -1;
  const around = (offset: number) => {
    const report = index >= 0 ? rows[index + offset] : undefined;
    return report ? `${hrefOf(params, { id: report.id })}#signalement` : undefined;
  };
  const filtered = Boolean(q || type || priorite);
  const emptyText = filtered
    ? t("emptyFiltered")
    : onglet === "clotures"
      ? t("emptyClosed")
      : onglet === "en-cours"
        ? t("emptyInProgress")
        : t("empty");

  const severityTag = (reason: string) => {
    const level = reportSeverity(reason) as 0 | 1 | 2;
    return (
      <Tag tone={severityTone[level]} icon={level === 2 ? "securite" : undefined}>
        {t(`severity.${level}`)}
      </Tag>
    );
  };

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
              ? t("tab.open", { count: counts.open })
              : id === "en-cours"
                ? t("tab.inProgressCount", { count: counts.inProgress })
                : t("tab.closedCount", { count: counts.closed }),
        }))}
      />
      {raw.ok === "1" && <Alert tone="success" title={t("resolved")} />}
      {raw.ok === "note" && <Alert tone="success" title={t("note.saved")} />}
      {raw.erreur === "motif" && <Alert tone="error" title={t("error.motif")} />}
      {raw.erreur === "note" && <Alert tone="error" title={t("error.note")} />}
      {onglet !== "clotures" && <p className="text-[12px] leading-4 text-ardoise">{t("order")}</p>}

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
          <div className="jm-admin-card hidden rounded-[24px] bg-blanc py-1.5 lg:block">
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
                      <td className="px-[18px] py-3.5">{severityTag(report.reason)}</td>
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
          <ul className="jm-admin-card flex flex-col rounded-[24px] bg-blanc px-5 py-1 lg:hidden">
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
                        {severityTag(report.reason)}
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
              <div className="flex min-w-0 flex-col gap-3">
                <QueueNav
                  label={t("list")}
                  prev={around(-1)}
                  next={around(1)}
                  prevLabel={t("nav.prev")}
                  nextLabel={t("nav.next")}
                  position={`${index + 1} / ${rows.length}`}
                  hint={(await getTranslations("admin.jobs"))("nav.hint")}
                />
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
                  adminId={admin.id}
                  showContext={one(raw.contexte) === "1"}
                  selfHref={hrefOf(params, { id: selected.id })}
                  severityTag={severityTag(selected.reason)}
                />
              </div>
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

/**
 * Detail of the selected report: the content (and, for a message, its immediate context on
 * request), its author, the internal notes, then the decision that closes it.
 */
async function ReportDetail({
  report,
  kind,
  title,
  reason,
  count,
  context,
  writable,
  adminId,
  showContext,
  selfHref,
  severityTag,
}: {
  report: Report;
  kind: ReportType | null;
  title: string;
  reason: string;
  count: number;
  context: Context;
  writable: boolean;
  adminId: string;
  showContext: boolean;
  selfHref: string;
  severityTag: React.ReactNode;
}) {
  const t = await getTranslations("admin.reports");
  const reporter = context.reporter.get(report.reporterId);
  const job = context.job.get(report.targetId);
  const post = context.post.get(report.targetId);
  const message = context.message.get(report.targetId);
  const conversation = context.conversation.get(report.targetId);
  const [thread, author, notes] = await Promise.all([
    message && showContext ? messageContext(db, adminId, report.id) : Promise.resolve(null),
    reportAuthor(db, report),
    reportNotes(db, report.id),
  ]);
  const available: Decision[] =
    kind === "job" || kind === "message" || kind === "post"
      ? ["dismiss", "warn", "hide"]
      : ["dismiss", "warn"];
  const resolution = decisions.find((item) => item === report.resolution);
  const open = report.status !== "closed";
  const canSuspend = writable && author && author.id !== adminId && author.platformRole === "user";
  const internal = notes.filter((note) => note.action === "report.note");

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
        {severityTag}
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
        {message && !thread && (
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
            <Link
              href={`${selfHref}&contexte=1#signalement`.replace("?&", "?")}
              scroll={false}
              className="mt-1 text-[12px] font-semibold underline underline-offset-2"
            >
              {t("context.show")}
            </Link>
            <span className="text-[11px] leading-4 text-ardoise">{t("context.hint")}</span>
          </div>
        )}
        {thread && (
          <div className="flex flex-col gap-2">
            <h3 className={adminLabel}>{t("context.title")}</h3>
            <ol className="flex flex-col gap-2">
              {thread.map((item) => (
                <li
                  key={item.id}
                  className={cx(
                    "flex max-w-[460px] flex-col gap-1",
                    item.side === "talent" ? "items-end self-end" : "items-start",
                  )}
                >
                  <p
                    className={cx(
                      "rounded-[16px] px-3.5 py-2.5 text-[12.5px] leading-[18px] whitespace-pre-line",
                      item.reported
                        ? "bg-down-fond ring-[1.5px] ring-down-texte ring-inset"
                        : "bg-blanc",
                    )}
                  >
                    {item.hiddenAt && !item.reported ? t("context.hidden") : item.body}
                  </p>
                  <span className="text-[11px] text-ardoise">
                    {[
                      item.side === "talent" ? t("context.talent") : t("context.org"),
                      formatDateTime(item.createdAt),
                      item.reported ? t("context.reported") : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {post && (
          <div className="flex flex-col gap-1.5 rounded-[16px] bg-blanc px-3.5 py-3">
            <p className="text-[12px] text-ardoise">
              {[
                post.organization?.name ?? post.author?.name ?? t("detail.author"),
                post.parentId ? t("detail.postReply") : t("detail.post"),
              ].join(" · ")}
            </p>
            <p className="text-[12.5px] leading-[18px] whitespace-pre-line">{post.body}</p>
            {post.imageUrl && <p className="text-[11px] text-ardoise">{t("detail.postImage")}</p>}
            {post.hiddenAt && (
              <span className="text-[11px] font-medium">{t("detail.hidden")}</span>
            )}
          </div>
        )}
        {job && (
          <div className="flex flex-col gap-1.5 rounded-[16px] bg-blanc px-3.5 py-3">
            <p className="text-[13.5px] font-semibold">{job.title}</p>
            <p className="text-[12px] text-ardoise">
              {[job.organization.name, job.city].filter(Boolean).join(" · ")}
            </p>
            <details>
              <summary className="cursor-pointer text-[12px] font-semibold underline underline-offset-2">
                {t("jobText")}
              </summary>
              <div className="mt-2 flex flex-col gap-2 text-[12.5px] leading-[18px]">
                <p className="whitespace-pre-line">{job.description}</p>
                {[...job.requirements, ...job.benefits].length > 0 && (
                  <ul className="flex list-disc flex-col gap-0.5 pl-5">
                    {[...job.requirements, ...job.benefits].map((line, key) => (
                      <li key={key}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
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

      {kind !== "conversation" && (
        <div className="flex flex-col gap-1.5 rounded-[16px] px-3.5 py-3 ring-[1.5px] ring-brume ring-inset">
          <h3 className={adminLabel}>{t("author.title")}</h3>
          {author ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="flex-1 text-[13px]">
                <span className="font-semibold">{author.name}</span>{" "}
                <span className="text-ardoise">{author.email}</span>
              </p>
              {canSuspend && (
                <Link
                  href={`/admin/utilisateurs?fiche=${author.id}&action=suspendre`}
                  title={t("author.suspendHint")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-blanc px-3.5 text-[12.5px] font-semibold text-corail-fonce ring-[1.5px] ring-brume ring-inset hover:bg-creme"
                >
                  <Icon name="securite" aria-hidden className="size-3.5" />
                  {t("author.suspend")}
                </Link>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] text-ardoise">{t("author.none")}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className={adminLabel}>{t("note.title")}</h3>
        {internal.length === 0 ? (
          <p className="text-[12.5px] text-ardoise">{t("note.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {internal.map((note) => (
              <li
                key={note.id}
                className="rounded-[12px] bg-creme px-3 py-2 text-[12.5px] leading-[18px]"
              >
                <p className="whitespace-pre-line">{note.note}</p>
                <p className="mt-0.5 text-[11px] text-ardoise">
                  {[note.actor, formatDateTime(note.createdAt)].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
        {writable && open && (
          <form action={reportNoteAction} className="flex flex-col gap-2">
            <input type="hidden" name="report" value={report.id} />
            <input type="hidden" name="back" value={selfHref} />
            <TextArea
              id="report-note"
              name="note"
              label={t("note.label")}
              hint={t("note.hint")}
              rows={2}
              minLength={3}
              maxLength={1000}
              required
            />
            <Button type="submit" variant="tertiary" size="sm" className="self-start">
              {t("note.submit")}
            </Button>
          </form>
        )}
      </div>

      {!open && resolution && (
        <div className="flex flex-col gap-1 rounded-[14px] bg-lime-clair px-3.5 py-3 text-[13px]">
          <p className="font-semibold">
            {t("detail.decision", { action: t(`action.${resolution}`) })}
          </p>
          {report.resolutionReason && (
            <p className="text-[12.5px]">
              {t("decisionReason", { reason: report.resolutionReason })}
            </p>
          )}
          {report.closedAt && (
            <p className="text-[11px] text-ardoise">
              {t("closedOn", { date: formatDate(report.closedAt) })}
            </p>
          )}
        </div>
      )}

      {writable && open && (
        <form
          action={closeReportAction}
          className="flex flex-col gap-3 border-t border-brume pt-3.5"
        >
          <h3 className="text-[15px] font-semibold">{t("decide.title")}</h3>
          <input type="hidden" name="report" value={report.id} />
          <input type="hidden" name="back" value={selfHref} />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-[13px] font-semibold">{t("decide.legend")}</legend>
            {available.map((decision) => (
              <Checkbox
                key={decision}
                id={`report-decision-${decision}`}
                type="radio"
                name="decision"
                value={decision}
                required
                label={t(`action.${decision}`)}
                hint={t(`decide.${decision}Hint`)}
                className="[&_label]:text-[13px]"
              />
            ))}
          </fieldset>
          <ReasonField id="report-reason" />
          <p className="text-[11.5px] leading-4 text-ardoise">{t("decide.hint")}</p>
          <Button type="submit" className="self-start">
            {t("decide.submit")}
          </Button>
        </form>
      )}
    </section>
  );
}
