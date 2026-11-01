import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { OffresChecklist } from "@/components/admin/offres-checklist";
import {
  AdminDone,
  AdminFilterBar,
  AdminPageHeader,
  AdminTabs,
  adminLabel,
  AuditNotice,
  FilterMenu,
  ReasonField,
  SectionRule,
  SensitivePanel,
  Tag,
} from "@/components/admin/kit";
import { initialsOf } from "@/components/hire/kit";
import { Alert, Button, ButtonLink, Checkbox } from "@/components/ui";
import type { ContractType } from "@/generated/prisma/client";
import { cx } from "@/lib/cx";
import { formatRelative } from "@/lib/dates";
import { moderateJob } from "@/server/actions/admin";
import { requestJobChangesAction } from "@/server/actions/admin-moderation";
import { AuditHistory } from "@/components/admin/audit";
import { QueueNav } from "@/components/admin/queue-nav";
import { canWriteArea } from "@/server/auth/roles";
import { requireAdminArea } from "@/server/auth/session";
import { db } from "@/server/db";
import { moderationFlags } from "@/server/services/hire";
import {
  changesRequestedJobs,
  correctionPoints,
  jobFlags,
  liveJobs,
  moderationQueue,
} from "@/server/services/moderation";

const flagKeys = ["payment", "discrimination", "contactOutside", "newOrg"] as const;
type FlagKey = (typeof flagKeys)[number];
/** Payment requests and discriminating criteria are the serious ones (Corail); others Ambre. */
const seriousFlags: FlagKey[] = ["payment", "discrimination"];

const tabs = ["a-verifier", "signalees", "corrections", "toutes"] as const;
type Tab = (typeof tabs)[number];
const actions = ["refuser", "correction", "depublier"] as const;
type Action = (typeof actions)[number];

/** Contract types → labels of the job search (`jobs.search.contract.*`). */
const contractLabel = {
  cdi: "cdi",
  cdd: "cdd",
  stage: "internship",
  mission: "mission",
  freelance: "mission",
  alternance: "alternance",
  volontariat: "volunteer",
} as const satisfies Record<ContractType, string>;

const tileTones = [
  "bg-sapin text-lime",
  "bg-neon text-sapin",
  "bg-[#14745f] text-[#fff]",
  "bg-lime text-sapin",
  "bg-nuit text-neon",
];

/** Organization initials on a rounded tile; the tint follows the name. */
function OrgTile({ name, size = 38 }: { name: string; size?: number }) {
  const tone = tileTones[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5];
  return (
    <span
      aria-hidden
      className={cx("grid shrink-0 place-items-center font-bold tracking-[-0.03em]", tone)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        fontSize: Math.round(size * 0.34),
      }}
    >
      {initialsOf(name)}
    </span>
  );
}

function countryName(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  return new Intl.DisplayNames(["fr-FR"], { type: "region" }).of(code) ?? code;
}

/**
 * The excerpt shown to the moderator: the opening of the description, and every sentence or line
 * that triggers the automatic check (partie 10 § 10.7), marked.
 */
function excerpt(job: {
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
}) {
  const flagged = (text: string) =>
    moderationFlags({
      title: "",
      description: text,
      responsibilities: [],
      requirements: [],
      benefits: [],
    }).length > 0;
  const parts: { text: string; marked: boolean }[] = [];
  let length = 0;
  let skipped = false;
  for (const sentence of job.description.split(/(?<=[.!?])\s+/u).filter(Boolean)) {
    const marked = flagged(sentence);
    if (marked || length < 420) {
      if (skipped) parts.push({ text: "…", marked: false });
      parts.push({ text: sentence, marked });
      length += sentence.length;
      skipped = false;
    } else skipped = true;
  }
  if (skipped) parts.push({ text: "…", marked: false });
  for (const line of [...job.responsibilities, ...job.requirements, ...job.benefits]) {
    if (flagged(line)) parts.push({ text: line, marked: true });
  }
  return parts;
}

/** Job moderation (mockup 07-07, partie 10 § 10.7): flagged at publication, reported, or live. */
export default async function AdminJobs({ searchParams }: PageProps<"/admin/offres">) {
  const params = await searchParams;
  const admin = await requireAdminArea("jobs");
  // Content editors see the admin shell, but only the courses.
  if (!admin) notFound();
  const t = await getTranslations("admin.jobs");
  const tContract = await getTranslations("jobs.search.contract");
  const tSensitive = await getTranslations("admin.sensitive");
  const writable = canWriteArea(admin.platformRole, "jobs");
  const one = (value: string | string[] | undefined) =>
    typeof value === "string" && value !== "" ? value : undefined;
  const tab: Tab = tabs.find((item) => item === params.onglet) ?? "a-verifier";
  const q = one(params.q);
  const signal = one(params.signal);
  const country = one(params.pays);
  const contract = one(params.contrat);
  const action: Action | undefined = actions.find((item) => item === params.action);

  const openReports = await db.report.groupBy({
    by: ["targetId"],
    where: { targetType: "job", status: { in: ["open", "in_progress"] } },
    _count: { _all: true },
  });
  const reportCount = new Map(openReports.map((row) => [row.targetId, row._count._all]));
  const [queue, reported, live, corrections] = await Promise.all([
    moderationQueue(db),
    db.job.findMany({
      where: { id: { in: [...reportCount.keys()] } },
      orderBy: { updatedAt: "desc" },
      include: { organization: { select: { name: true, verifiedAt: true, createdAt: true } } },
    }),
    tab === "toutes" ? liveJobs(db) : Promise.resolve([]),
    changesRequestedJobs(db),
  ]);
  const source =
    tab === "toutes"
      ? live
      : tab === "signalees"
        ? reported
        : tab === "corrections"
          ? corrections
          : queue;

  const flagsOf = (job: (typeof source)[number]) =>
    jobFlags(job).filter((flag): flag is FlagKey => (flagKeys as readonly string[]).includes(flag));
  const needle = q?.toLocaleLowerCase("fr");
  const jobs = source.filter((job) => {
    if (
      needle &&
      !job.title.toLocaleLowerCase("fr").includes(needle) &&
      !job.organization.name.toLocaleLowerCase("fr").includes(needle)
    )
      return false;
    if (signal === "aucun" && flagsOf(job).length > 0) return false;
    if (signal && signal !== "aucun" && !flagsOf(job).includes(signal as FlagKey)) return false;
    if (country && job.country !== country) return false;
    if (contract && job.contractType !== contract) return false;
    return true;
  });

  const selectedId = one(params.id) ?? jobs[0]?.id;
  const selected = selectedId
    ? await db.job.findFirst({
        where: { id: selectedId },
        include: {
          organization: { select: { name: true, verifiedAt: true, createdAt: true } },
          createdBy: { select: { name: true } },
        },
      })
    : null;

  const href = (changes: Record<string, string | undefined>) => {
    const next: Record<string, string | undefined> = {
      onglet: tab === "a-verifier" ? undefined : tab,
      q,
      signal,
      pays: country,
      contrat: contract,
      id: one(params.id),
      ...changes,
    };
    const search = new URLSearchParams(
      Object.entries(next).filter((entry): entry is [string, string] => Boolean(entry[1])),
    ).toString();
    return search ? `/admin/offres?${search}` : "/admin/offres";
  };
  const countries = [...new Set(source.map((job) => job.country))].sort();
  const contracts = [...new Set(source.map((job) => job.contractType))];

  const panel =
    writable && selected && action
      ? action === "depublier"
        ? selected.status === "published"
          ? action
          : undefined
        : selected.status === "pending_review"
          ? action
          : undefined
      : undefined;
  const closeHref = href({ action: undefined, id: selected?.id });
  const selectedFlags = selected ? flagsOf(selected) : [];
  const selectedReports = selected ? (reportCount.get(selected.id) ?? 0) : 0;

  const doneId = one(params.id);
  // Position in the queue, « Précédente / Suivante » and the shortcuts J and K.
  const index = selected ? jobs.findIndex((job) => job.id === selected.id) : -1;
  const around = (offset: number) => {
    const job = index >= 0 ? jobs[index + offset] : undefined;
    return job ? href({ id: job.id, action: undefined }) : undefined;
  };
  return (
    <>
      <AdminPageHeader title={t("title")} />
      {params.ok === "approuvee" && (
        <AdminDone
          title={t("approved")}
          journal={doneId ? { type: "job", id: doneId } : undefined}
        />
      )}
      {params.ok === "correction" && (
        <AdminDone
          title={t("changesSent")}
          journal={doneId ? { type: "job", id: doneId } : undefined}
        />
      )}
      {params.erreur === "motif" && <Alert tone="error" title={t("error.motif")} />}
      {params.ok === "refusee" && (
        <AdminDone
          title={t("rejected")}
          journal={doneId ? { type: "job", id: doneId } : undefined}
        />
      )}

      <AdminFilterBar
        action="/admin/offres"
        searchLabel={t("search")}
        q={q}
        hidden={{
          onglet: tab === "a-verifier" ? undefined : tab,
          signal,
          pays: country,
          contrat: contract,
        }}
      >
        <FilterMenu
          label={t("filter.flag")}
          group="offres-signal"
          options={[
            {
              href: href({ signal: undefined, id: undefined }),
              label: t("filter.all"),
              current: !signal,
            },
            ...flagKeys.map((flag) => ({
              href: href({ signal: flag, id: undefined }),
              label: t(`autoFlag.${flag}`),
              current: signal === flag,
            })),
            {
              href: href({ signal: "aucun", id: undefined }),
              label: t("filter.none"),
              current: signal === "aucun",
            },
          ]}
        />
        <FilterMenu
          label={t("filter.country")}
          group="offres-pays"
          options={[
            {
              href: href({ pays: undefined, id: undefined }),
              label: t("filter.all"),
              current: !country,
            },
            ...countries.map((code) => ({
              href: href({ pays: code, id: undefined }),
              label: countryName(code),
              current: country === code,
            })),
          ]}
        />
        <FilterMenu
          label={t("filter.contract")}
          group="offres-contrat"
          options={[
            {
              href: href({ contrat: undefined, id: undefined }),
              label: t("filter.all"),
              current: !contract,
            },
            ...contracts.map((type) => ({
              href: href({ contrat: type, id: undefined }),
              label: tContract(contractLabel[type]),
              current: contract === type,
            })),
          ]}
        />
      </AdminFilterBar>

      <AdminTabs
        label={t("title")}
        items={[
          { id: "a-verifier" as const, label: t("tab.pending", { count: queue.length }) },
          { id: "signalees" as const, label: t("tab.flagged", { count: reported.length }) },
          { id: "corrections" as const, label: t("tab.changes", { count: corrections.length }) },
          { id: "toutes" as const, label: t("tab.all") },
        ].map((item) => ({
          href: item.id === "a-verifier" ? "/admin/offres" : `/admin/offres?onglet=${item.id}`,
          label: item.label,
          current: tab === item.id,
        }))}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
        {/* List of jobs. */}
        {jobs.length === 0 ? (
          <p className="jm-admin-card rounded-[24px] bg-blanc p-5 text-[13px] leading-5 text-ardoise lg:col-span-2">
            {q || signal || country || contract
              ? t("empty.filtered")
              : tab === "toutes"
                ? t("empty.all")
                : tab === "signalees"
                  ? t("empty.flagged")
                  : tab === "corrections"
                    ? t("empty.changes")
                    : t("empty.pending")}
          </p>
        ) : (
          <ul aria-label={t("list")} className="flex flex-col gap-2.5">
            {jobs.map((job) => {
              const flags = flagsOf(job);
              const on = job.id === selected?.id;
              const reports = reportCount.get(job.id) ?? 0;
              return (
                <li key={job.id}>
                  <Link
                    href={href({ id: job.id, action: undefined })}
                    scroll={false}
                    aria-current={on ? "true" : undefined}
                    className={cx(
                      "jm-admin-card flex flex-col gap-2 rounded-[24px] bg-blanc px-4 py-3.5 transition-shadow hover:shadow-[0_0_0_2px_var(--color-brume)] motion-reduce:transition-none",
                      on &&
                        "shadow-[0_0_0_2px_var(--color-sapin)] hover:shadow-[0_0_0_2px_var(--color-sapin)]",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <OrgTile name={job.organization.name} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[13.5px] leading-5 font-semibold">{job.title}</span>
                        <span className="text-[11px] leading-[15px] text-ardoise">
                          {[job.organization.name, job.city, formatRelative(job.updatedAt)].join(
                            " · ",
                          )}
                        </span>
                      </span>
                    </span>
                    {flags.length > 0 ? (
                      flags.map((flag) => (
                        <span
                          key={flag}
                          className={cx(
                            "flex items-start gap-1.5 self-start rounded-[12px] px-2.5 py-1 text-[11px] leading-[15px] font-semibold",
                            seriousFlags.includes(flag)
                              ? "bg-down-fond text-down-texte"
                              : "bg-ambre-fond text-ambre-texte",
                          )}
                        >
                          <Icon name="intelligence" aria-hidden className="mt-px size-3 shrink-0" />
                          {t("autoFlag.text", { reason: t(`autoFlag.${flag}`) })}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] leading-[15px] text-ardoise">{t("noFlag")}</span>
                    )}
                    {reports > 0 && (
                      <Tag tone="error" icon="alerte" className="self-start">
                        {t("reports", { count: reports })}
                      </Tag>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* Detail of the chosen job, then the sensitive action. */}
        {selected && (
          <div className="flex min-w-0 flex-col gap-4">
            {index >= 0 && (
              <QueueNav
                label={t("nav.label")}
                prev={around(-1)}
                next={around(1)}
                prevLabel={t("nav.prev")}
                nextLabel={t("nav.next")}
                position={t("nav.position", { position: index + 1, total: jobs.length })}
                hint={t("nav.hint")}
              />
            )}
            <section
              aria-labelledby="offres-detail-title"
              className="jm-admin-card flex flex-col gap-3.5 rounded-[24px] bg-blanc p-5 lg:p-[22px]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <OrgTile name={selected.organization.name} size={52} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h2
                    id="offres-detail-title"
                    className="text-[18px] leading-[24px] font-semibold tracking-[-0.015em] lg:text-[20px] lg:leading-[26px]"
                  >
                    {selected.title}
                  </h2>
                  <p className="text-[11px] leading-[15px] text-ardoise">
                    {[
                      selected.organization.name,
                      [selected.city, countryName(selected.country)].filter(Boolean).join(", "),
                      tContract(contractLabel[selected.contractType]),
                      selected.createdBy?.name
                        ? t("publishedBy", { name: selected.createdBy.name })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {!selected.organization.verifiedAt && (
                    <Tag tone="warning" className="mt-1 self-start sm:hidden">
                      {t("unverified")}
                    </Tag>
                  )}
                </div>
                {!selected.organization.verifiedAt && (
                  <Tag tone="warning" className="max-sm:hidden">
                    {t("unverified")}
                  </Tag>
                )}
              </div>

              {selected.status === "pending_review" && <AutoCheck flags={selectedFlags} />}
              {selected.status === "changes_requested" && (
                <p className="flex items-start gap-2.5 rounded-[14px] bg-ambre-fond px-3.5 py-3 text-[13px] leading-[19px] font-semibold text-ambre-texte">
                  <Icon name="horloge" aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {t("changesPending")}
                </p>
              )}
              {selected.status !== "pending_review" &&
                selectedFlags.map((flag) => (
                  <p
                    key={flag}
                    className={cx(
                      "flex items-start gap-2.5 rounded-[14px] px-3.5 py-3 text-[13px] leading-[19px] font-semibold",
                      seriousFlags.includes(flag)
                        ? "bg-down-fond text-down-texte"
                        : "bg-ambre-fond text-ambre-texte",
                    )}
                  >
                    <Icon name="securite" aria-hidden className="mt-0.5 size-4 shrink-0" />
                    {t("autoFlag.text", { reason: t(`autoFlag.${flag}`) })}
                  </p>
                ))}
              {selectedReports > 0 && (
                <p className="flex flex-wrap items-center gap-2.5 rounded-[14px] bg-down-fond px-3.5 py-3 text-[13px] leading-[19px] font-semibold text-down-texte">
                  <Icon name="alerte" aria-hidden className="size-4 shrink-0" />
                  {t("reports", { count: selectedReports })}
                  <Link
                    href="/admin/signalements"
                    className="ml-auto font-medium underline underline-offset-2"
                  >
                    {t("seeReports")}
                  </Link>
                </p>
              )}

              <div className="flex flex-col gap-2 rounded-[16px] bg-creme p-4 text-[13px] leading-5">
                <h3 className={adminLabel}>{t("excerpt")}</h3>
                <p className="[overflow-wrap:anywhere]">
                  {excerpt(selected).map((part, index) =>
                    part.marked ? (
                      <mark
                        key={index}
                        className="mx-0.5 rounded-[4px] bg-down-fond px-1 py-px text-down-texte"
                      >
                        {part.text}
                      </mark>
                    ) : (
                      <span key={index}>{part.text} </span>
                    ),
                  )}
                </p>
                {selectedFlags.some((flag) => flag !== "newOrg") && (
                  <p className="text-[11px] leading-[15px] text-ardoise">{t("excerptHint")}</p>
                )}
              </div>

              <OffresChecklist
                title={t("checklist")}
                items={[
                  { id: "real", label: t("check.real") },
                  { id: "noPayment", label: t("check.noPayment") },
                  { id: "noDiscrimination", label: t("check.noDiscrimination") },
                  { id: "knockout", label: t("check.knockout") },
                ]}
                resetKey={selected.id}
              />

              {writable && (
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  {selected.status === "pending_review" && (
                    <>
                      <form action={moderateJob} className="contents">
                        <input type="hidden" name="job" value={selected.id} />
                        <input type="hidden" name="decision" value="approve" />
                        <Button
                          type="submit"
                          icon={<Icon name="check" />}
                          className="max-sm:w-full"
                        >
                          {t("approve")}
                        </Button>
                      </form>
                      <ButtonLink
                        href={href({ id: selected.id, action: "correction" })}
                        scroll={false}
                        variant="tertiary"
                        className="max-sm:w-full"
                      >
                        {t("requestChanges")}
                      </ButtonLink>
                      <ButtonLink
                        href={href({ id: selected.id, action: "refuser" })}
                        scroll={false}
                        variant="tertiary"
                        className="text-corail-fonce max-sm:w-full"
                      >
                        {t("reject.text")}
                      </ButtonLink>
                    </>
                  )}
                  {selected.status === "published" && (
                    <ButtonLink
                      href={href({ id: selected.id, action: "depublier" })}
                      scroll={false}
                      variant="tertiary"
                      className="max-sm:w-full sm:ml-auto"
                    >
                      {t("unpublish.text")}
                    </ButtonLink>
                  )}
                </div>
              )}
            </section>

            {panel && (
              <>
                <SectionRule>{tSensitive("label")}</SectionRule>
                <SensitivePanel
                  title={
                    panel === "depublier"
                      ? t("unpublish.text")
                      : panel === "correction"
                        ? t("requestChanges")
                        : t("reject.text")
                  }
                  text={
                    panel === "depublier"
                      ? t("unpublish.confirm", { jobTitle: selected.title })
                      : panel === "correction"
                        ? t("requestChangesHint")
                        : undefined
                  }
                  tone={panel === "correction" ? "neutral" : "danger"}
                  icon={panel === "correction" ? "edit" : "securite"}
                  closeHref={closeHref}
                >
                  <form
                    action={panel === "correction" ? requestJobChangesAction : moderateJob}
                    className="flex flex-col gap-3.5"
                  >
                    <input type="hidden" name="job" value={selected.id} />
                    <input type="hidden" name="decision" value="refuse" />
                    <input type="hidden" name="panel" value={panel} />
                    {panel === "correction" && (
                      <fieldset className="flex flex-col gap-2.5">
                        <legend className="mb-1 text-[13px] font-semibold">
                          {t("fix.legend")}
                        </legend>
                        <p className="text-[11.5px] leading-4 text-ardoise">{t("fix.hint")}</p>
                        {correctionPoints.map((point) => (
                          <Checkbox
                            key={point}
                            id={`offres-fix-${point}`}
                            name="points"
                            value={point}
                            label={t(`fix.${point}`)}
                            defaultChecked={
                              (point === "noPayment" && selectedFlags.includes("payment")) ||
                              (point === "noDiscrimination" &&
                                selectedFlags.includes("discrimination"))
                            }
                            className="[&_label]:text-[13px]"
                          />
                        ))}
                      </fieldset>
                    )}
                    <ReasonField id="offres-reason" label={t("reject.reason")} />
                    <div className="flex flex-wrap justify-end gap-2">
                      <ButtonLink href={closeHref} scroll={false} variant="tertiary">
                        {t("cancel")}
                      </ButtonLink>
                      <Button
                        type="submit"
                        variant={panel === "correction" ? "secondary" : "danger"}
                      >
                        {panel === "depublier"
                          ? t("unpublish.text")
                          : panel === "correction"
                            ? t("requestChanges")
                            : t("reject.text")}
                      </Button>
                    </div>
                  </form>
                </SensitivePanel>
              </>
            )}
            <AuditHistory targetType="job" targetId={selected.id} />
            <AuditNotice />
          </div>
        )}
      </div>
    </>
  );
}

/**
 * « Avis du contrôle automatique » with its « Pourquoi ? »: which rule matched, in plain words.
 * The automatic check only flags; the moderator decides (CLAUDE.md, règle d'or 3).
 */
async function AutoCheck({ flags }: { flags: FlagKey[] }) {
  const t = await getTranslations("admin.jobs.auto");
  const serious = flags.some((flag) => seriousFlags.includes(flag));
  return (
    <div
      className={cx(
        "flex flex-col gap-2 rounded-[14px] px-3.5 py-3",
        flags.length === 0 ? "bg-lime-clair" : serious ? "bg-down-fond" : "bg-ambre-fond",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Icon name="intelligence" aria-hidden className="size-4 shrink-0" />
        <p className="text-[12px] font-semibold">{t("title")}</p>
        <p
          className={cx(
            "text-[13px] leading-[19px] font-semibold",
            flags.length > 0 && (serious ? "text-down-texte" : "text-ambre-texte"),
          )}
        >
          {flags.length === 0 ? t("clear") : t("review", { count: flags.length })}
        </p>
      </div>
      <details className="group text-[12.5px] leading-[18px]">
        <summary className="inline-flex cursor-pointer items-center gap-1 font-semibold underline underline-offset-2">
          {t("why")}
        </summary>
        <div className="mt-2 flex flex-col gap-1.5">
          <p className="font-semibold">{t("whyTitle")}</p>
          {flags.length === 0 ? (
            <p>{t("rule.none")}</p>
          ) : (
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {flags.map((flag) => (
                <li key={flag}>{t(`rule.${flag}`)}</li>
              ))}
            </ul>
          )}
          <p className="text-ardoise">{t("whyText")}</p>
        </div>
      </details>
    </div>
  );
}
