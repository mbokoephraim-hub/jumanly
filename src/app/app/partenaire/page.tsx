import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { HeaderAction } from "@/components/app/header-action";
import { AppPageHeader } from "@/components/app/page-header";
import { pillClass } from "@/components/career/kit";
import { Kpi, MenuChip, menuItem } from "@/components/hire/kit";
import {
  batchTag,
  Figure,
  hatch,
  MaskedNote,
  MonthBars,
  partnerCard,
  partnerTitle,
} from "@/components/partner/kit";
import { EmptyState } from "@/components/ui";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { requirePartner } from "@/server/partner-context";
import { partnerDashboard, type Cell } from "@/server/services/partners";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("partner.dashboard");
  return { title: t("title"), robots: { index: false } };
}

/**
 * Partner dashboard (partie 07 § 5, mockup 06-01): licence counts and aggregated usage, never a
 * person. Every usage cell is hidden below the anonymity threshold.
 */
export default async function PartnerDashboardPage({ searchParams }: PageProps<"/app/partenaire">) {
  const query = await searchParams;
  const { ctx, organization } = await requirePartner("/app/partenaire");
  const t = await getTranslations();
  const lot = typeof query.lot === "string" ? query.lot.slice(0, 60) : undefined;
  const data = await partnerDashboard(db, ctx, new Date(), lot);
  const number = new Intl.NumberFormat("fr");
  const show = (value: Cell) =>
    value.hidden ? t("partner.hidden") : number.format(value.value ?? 0);
  const monthName = new Intl.DateTimeFormat("fr", { month: "short", timeZone: "UTC" });
  const monthLong = new Intl.DateTimeFormat("fr", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const usage: [
    (
      | "learningHours"
      | "coursesCompleted"
      | "certificates"
      | "cvCreated"
      | "applications"
      | "interviewSims"
    ),
    IconName,
    Cell,
    string?,
  ][] = [
    [
      "learningHours",
      "horloge",
      data.usage.learning.learningHours,
      data.usage.learning.learningHours.hidden
        ? undefined
        : t("partner.dashboard.usage.hoursValue", {
            hours: number.format(data.usage.learning.learningHours.value ?? 0),
          }),
    ],
    ["coursesCompleted", "learn", data.usage.learning.coursesCompleted],
    ["certificates", "certificat", data.usage.learning.certificates],
    ["cvCreated", "cv", data.usage.career.cvs],
    ["applications", "jobs", data.usage.employment.applications],
    ["interviewSims", "mic", data.usage.career.interviewSims],
  ];
  const hires = data.usage.employment.hiresDeclared;
  const anyHidden =
    data.active30.hidden ||
    hires.hidden ||
    usage.some(([, , value]) => value.hidden) ||
    data.months.some((month) => month.active.hidden);
  const current = data.batches.find((batch) => batch.id === data.batchId);
  const lastMonth = data.months.at(-1)?.month ?? new Date();

  return (
    <div className="jm-page flex flex-col gap-4 lg:gap-5">
      <AppPageHeader
        eyebrow={t("partner.dashboard.eyebrow", { org: organization.name })}
        title={t("partner.dashboard.title")}
        subtitle={t("partner.dashboard.subtitle")}
        actions={
          <>
            {data.batches.length > 0 && (
              <HeaderAction
                href="/app/partenaire/rapports"
                icon="statistiques"
                label={t("partner.dashboard.openReport")}
              />
            )}
            <span className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-lime px-3 text-[12px] font-semibold text-sapin">
              <Icon name="certificat" className="size-3.5" />
              {t("partner.nav.badge")}
            </span>
          </>
        }
      />

      <p className="flex items-start gap-3 rounded-[18px] bg-lime-clair px-4 py-3.5 text-[13px] leading-[19px] font-medium lg:items-center lg:px-[18px]">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-sapin text-lime"
        >
          <Icon name="lock" className="size-[18px]" />
        </span>
        <span className="pt-0.5 lg:pt-0">{t("partner.dashboard.privacy")}</span>
      </p>

      {data.batches.length === 0 ? (
        <EmptyState title={t("partner.dashboard.empty")} />
      ) : (
        <>
          <section
            aria-label={t("partner.dashboard.title")}
            className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
          >
            <Kpi
              label={t("partner.dashboard.kpi.purchased")}
              value={String(data.totals.purchased)}
              number={data.totals.purchased}
              icon="certificat"
              disc="bg-lime-clair"
            >
              <span className="text-[12px] leading-4 text-ardoise">
                {t("partner.dashboard.kpi.batches", { count: data.batches.length })}
              </span>
            </Kpi>
            <Kpi
              label={t("partner.dashboard.kpi.distributed")}
              value={String(data.totals.distributed)}
              number={data.totals.distributed}
              icon="partager"
              disc="bg-neon/45"
            >
              <span className="text-[12px] leading-4 text-ardoise">
                {t("partner.dashboard.kpi.available", { count: data.totals.available })}
              </span>
            </Kpi>
            <Kpi
              label={t("partner.dashboard.kpi.activated")}
              value={String(data.totals.activated)}
              number={data.totals.activated}
              icon="check"
              disc="bg-menthe-claire/70"
            >
              <span className="text-[12px] leading-4 text-ardoise">
                {t("partner.dashboard.kpi.activationRate", { percent: data.activationRate })}
              </span>
            </Kpi>
            <Kpi
              label={t("partner.dashboard.kpi.active")}
              value={show(data.active30)}
              number={data.active30.value ?? undefined}
              icon="equipe"
            >
              {data.active30.hidden && (
                <span className="text-[12px] leading-4 text-ardoise">
                  {t("partner.dashboard.smallGroup", { minGroup: data.minGroup })}
                </span>
              )}
            </Kpi>
          </section>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-5">
            <section aria-labelledby="usage" className={cx(partnerCard, "gap-4")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="usage" className={partnerTitle}>
                  {t("partner.dashboard.usage.title")}
                </h2>
                {data.batches.length > 1 && (
                  <MenuChip
                    group="dashboard-batch"
                    align="right"
                    label={t("partner.dashboard.usage.batch")}
                    summaryClassName="inline-flex h-11 items-center gap-1.5 rounded-pill bg-blanc px-4 text-[13px] font-medium ring-[1.5px] ring-brume ring-inset hover:bg-creme lg:h-9"
                    summary={
                      <>
                        <span className="max-w-[180px] truncate">
                          {current?.name ?? t("partner.dashboard.usage.batchAll")}
                        </span>
                        <Icon name="chev-d" className="size-4" />
                      </>
                    }
                  >
                    {[{ id: "", name: t("partner.dashboard.usage.batchAll") }, ...data.batches].map(
                      (batch) => (
                        <Link
                          key={batch.id || "all"}
                          href={batch.id ? `/app/partenaire?lot=${batch.id}` : "/app/partenaire"}
                          aria-current={(data.batchId ?? "") === batch.id ? "true" : undefined}
                          className={cx(
                            menuItem,
                            "min-h-11",
                            (data.batchId ?? "") === batch.id && "font-semibold",
                          )}
                        >
                          {batch.name}
                        </Link>
                      ),
                    )}
                  </MenuChip>
                )}
              </div>
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-2.5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
                {usage.map(([key, icon, value, text]) => (
                  <li
                    key={key}
                    className="flex items-center gap-3 rounded-[16px] bg-creme px-3.5 py-3"
                    style={value.hidden ? hatch : undefined}
                  >
                    <span
                      aria-hidden
                      className="grid size-[38px] shrink-0 place-items-center rounded-[12px] bg-blanc text-sapin"
                    >
                      <Icon name={icon} className="size-[18px]" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[17px] leading-6 font-semibold tracking-[-0.02em]">
                        {text ?? <Figure value={show(value)} number={value.value} />}
                      </span>
                      <span className="text-[12px] leading-4 text-ardoise">
                        {t(`partner.dashboard.usage.${key}`)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-start gap-3.5 rounded-[18px] bg-sapin px-4 py-4 text-blanc lg:items-center">
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-lime text-sapin"
                >
                  <Icon name="hire" className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex flex-wrap items-baseline gap-x-2.5">
                    <span className="text-[22px] leading-7 font-semibold">
                      <Figure value={show(hires)} number={hires.value} />
                    </span>
                    <span className="text-[13px] font-semibold">
                      {t("partner.dashboard.usage.hiresDeclared.text")}
                    </span>
                  </span>
                  <span className="text-[12px] leading-4 text-blanc/80">
                    {t("partner.dashboard.usage.hiresDeclared.hint")}
                  </span>
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <h3 className="text-[14px] leading-5 font-semibold">
                  {t("partner.dashboard.usage.chartAria")}
                </h3>
                <span className="text-[12px] leading-4 text-ardoise">
                  {lastMonth.getUTCFullYear()}
                </span>
              </div>
              <MonthBars
                label={t("partner.dashboard.usage.chartAria")}
                months={data.months.map((row) => ({
                  key: row.month.toISOString(),
                  label: monthName.format(row.month),
                  value: row.active.hidden ? null : (row.active.value ?? 0),
                  text: t("partner.dashboard.months.value", {
                    month: monthLong.format(row.month),
                    value: show(row.active),
                  }),
                }))}
              />
            </section>

            <section aria-labelledby="batches" className={cx(partnerCard, "gap-1")}>
              <div className="flex items-center justify-between gap-3">
                <h2 id="batches" className={partnerTitle}>
                  {t("partner.dashboard.batches.title")}
                </h2>
                <Icon name="certificat" className="size-5" />
              </div>
              <ul className="flex flex-col">
                {data.batches.map((batch, index) => (
                  <li
                    key={batch.id}
                    className={cx(
                      "flex flex-col gap-2.5 py-3.5",
                      index > 0 && "border-t border-brume",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={cx(
                          "grid size-10 shrink-0 place-items-center rounded-[12px]",
                          index % 2 ? "bg-sapin text-lime" : "bg-lime text-sapin",
                        )}
                      >
                        <Icon name="certificat" className="size-[18px]" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[13.5px] leading-[19px] font-semibold">
                          {t("partner.dashboard.batches.row", {
                            batchName: batch.name,
                            plan: batch.plan.name,
                            activated: batch.activated,
                            total: batch.seats,
                          })}
                        </span>
                        <span className="text-[12px] leading-4 text-ardoise">
                          {t("partner.dashboard.batches.period", {
                            start: batch.startsAt,
                            end: batch.endsAt,
                          })}
                        </span>
                      </span>
                      <span
                        className={cx(
                          "inline-flex h-6 shrink-0 items-center rounded-pill px-2.5 text-[11.5px] font-semibold text-sapin",
                          batchTag[batch.status],
                        )}
                      >
                        {t(`partner.licenses.batch.status.${batch.status}`)}
                      </span>
                    </div>
                    <span aria-hidden className="block h-1.5 overflow-hidden rounded-pill bg-brume">
                      <span
                        className="jm-gauge block h-full origin-left rounded-pill bg-feuille"
                        style={{
                          transform: `scaleX(${batch.seats ? Math.min(1, batch.activated / batch.seats) : 0})`,
                        }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/app/partenaire/licences"
                className={pillClass("dark", "md", "mt-2 w-full")}
              >
                {t("partner.dashboard.batches.seeAll")}
                <Icon name="chev-r" className="size-4" />
              </Link>
              {anyHidden && (
                <MaskedNote className="mt-4">
                  {t("partner.dashboard.smallGroup", { minGroup: data.minGroup })}{" "}
                  {t("partner.dashboard.smallGroupWhen", { minGroup: data.minGroup })}
                </MaskedNote>
              )}
              <p className="mt-4 flex items-start gap-3 rounded-[16px] bg-creme px-4 py-3.5 text-[12.5px] leading-[18px]">
                <Icon name="message" className="mt-px size-4 shrink-0" />
                <span>{t("partner.dashboard.contact")}</span>
              </p>
            </section>
          </div>
        </>
      )}
      {data.batches.length === 0 && (
        <p className="text-sm text-ardoise">{t("partner.dashboard.contact")}</p>
      )}
    </div>
  );
}
