import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AuditHistory } from "@/components/admin/audit";
import {
  AdminDone,
  AdminPageHeader,
  adminCard,
  adminLabel,
  adminTitle,
} from "@/components/admin/kit";
import { Alert, Button, Select, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { saveCostsAction } from "@/server/actions/admin-insights";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  COST_CATEGORIES,
  costHistory,
  monthOf,
  parseMonth,
} from "@/server/services/admin-insights";

/** Cents → « 120,50 » for an input (empty when zero). */
function inputValue(cents: number) {
  return cents ? (cents / 100).toFixed(2).replace(".", ",") : "";
}

/**
 * Coûts mensuels (Admin v2, étape 2): the running costs an administrator enters each month, from
 * which the dashboard derives the acquisition cost, the cost per active user and the gross margin.
 * Support agents read them.
 */
export default async function AdminCosts({ searchParams }: PageProps<"/admin/indicateurs/couts">) {
  await connection();
  const admin = await requireAdmin();
  if (!admin) notFound();
  const params = await searchParams;
  const t = await getTranslations("admin");
  const writable = canWriteAdmin(admin);
  const now = new Date();
  const history = await costHistory(db, now);
  const chosen = (typeof params.mois === "string" ? parseMonth(params.mois) : null) ?? monthOf(now);
  const current = history.find((row) => row.month.getTime() === chosen.getTime()) ?? history[0];
  const monthName = (date: Date) =>
    new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
      date,
    );

  return (
    <>
      <AdminPageHeader title={t("costs.title")} subtitle={t("costs.subtitle")} />
      <Link
        href="/admin"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold underline underline-offset-2"
      >
        <Icon name="chev-l" className="size-3.5" />
        {t("costs.back")}
      </Link>
      {params.ok && <AdminDone title={t("costs.saved")} journal="/admin/journal?action=cost" />}
      {params.erreur && <Alert tone="error" title={t("costs.error")} />}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section
          aria-labelledby="costs-history"
          className={cx(adminCard, "flex min-w-0 flex-col gap-3")}
        >
          <h2 id="costs-history" className={adminTitle}>
            {t("costs.history.title")}
          </h2>
          <ul className="flex flex-col">
            {history.map((row) => (
              <li key={row.key} className="border-brume not-first:border-t">
                <Link
                  href={`/admin/indicateurs/couts?mois=${row.key}#couts-saisie`}
                  aria-current={row.key === current.key ? "true" : undefined}
                  className={cx(
                    "flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-creme",
                    row.key === current.key && "bg-creme/70",
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[13.5px] font-semibold first-letter:uppercase">
                      {monthName(row.month)}
                    </span>
                    {row.entered && (
                      <span className="truncate text-[11.5px] text-ardoise">
                        {COST_CATEGORIES.filter((category) => row.amounts[category] > 0)
                          .map((category) =>
                            t("costs.history.line", {
                              category: t(`costs.category.${category}`),
                              amount: formatUsd(row.amounts[category]),
                            }),
                          )
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                  <span
                    className={cx(
                      "text-right text-[14px] font-semibold",
                      !row.entered && "text-[12px] font-medium text-ardoise",
                    )}
                  >
                    {row.entered
                      ? t("dashboard.kpi.value.currency", {
                          amount: formatUsd(row.total),
                          currency: "USD",
                        })
                      : t("costs.history.none")}
                  </span>
                  <Icon name="chev-r" aria-hidden className="size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-4">
          <section
            id="couts-saisie"
            aria-labelledby="costs-form"
            className={cx(adminCard, "flex scroll-mt-6 flex-col gap-3.5")}
          >
            <h2 id="costs-form" className={adminTitle}>
              {t("costs.form.title")}
            </h2>
            <form key={current.key} action={saveCostsAction} className="flex flex-col gap-3.5">
              <fieldset disabled={!writable} className="flex flex-col gap-3.5">
                <Select
                  id="costs-month"
                  name="month"
                  required
                  label={t("costs.form.month")}
                  defaultValue={current.key}
                  options={history.map((row) => ({
                    value: row.key,
                    label: monthName(row.month),
                  }))}
                />
                <p className={adminLabel}>{t("costs.form.amountHint")}</p>
                {COST_CATEGORIES.map((category) => (
                  <TextField
                    key={category}
                    id={`costs-${category}`}
                    name={category}
                    label={t(`costs.category.${category}`)}
                    inputMode="decimal"
                    autoComplete="off"
                    pattern="[0-9]{1,9}([.,][0-9]{1,2})?"
                    defaultValue={inputValue(current.amounts[category])}
                  />
                ))}
                <TextArea
                  id="costs-note"
                  name="note"
                  label={t("costs.form.note")}
                  rows={2}
                  maxLength={500}
                  defaultValue={current.note ?? ""}
                />
                {writable && <Button type="submit">{t("costs.form.save")}</Button>}
              </fieldset>
            </form>
          </section>
          <p className="flex items-start gap-2.5 rounded-[16px] bg-brume/70 px-4 py-3 text-[11.5px] leading-4">
            <Icon name="intelligence" className="size-4 shrink-0" />
            {t("costs.aiNote")}
          </p>
          <p className="flex items-start gap-2.5 rounded-[16px] bg-blanc px-4 py-3 text-[11.5px] leading-4">
            <Icon name="info" className="size-4 shrink-0" />
            {t("costs.formula")}
          </p>
          <AuditHistory targetType="platform" targetId={current.key} />
        </div>
      </div>
    </>
  );
}
