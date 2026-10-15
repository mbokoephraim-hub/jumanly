import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { PlanFamily } from "@/generated/prisma/client";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { db } from "@/server/db";
import { adminLabel, Tag } from "./kit";

/** Families of plans, in the order of the segments (mockup 07-04). */
export const planFamilies = [
  { family: "talent", key: "talents" },
  { family: "rh", key: "rh" },
  { family: "company", key: "companies" },
  { family: "partner", key: "partners" },
] as const satisfies readonly { family: PlanFamily; key: string }[];

export function isPlanFamily(value: unknown): value is PlanFamily {
  return planFamilies.some((item) => item.family === value);
}

/** Plans of one family with their live subscribers (active, trialing, grace, sponsored). */
export async function plansOfFamily(family: PlanFamily) {
  const now = new Date();
  return db.plan.findMany({
    where: { family },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          subscriptions: {
            where: {
              status: { in: ["active", "trialing", "past_due", "sponsored"] },
              currentPeriodEnd: { gt: now },
            },
          },
        },
      },
    },
  });
}
export type FamilyPlan = Awaited<ReturnType<typeof plansOfFamily>>[number];

/** « Jumanly for Talents · RH · Companies · Partners »: links on a white pill. */
/** « Forfait : Pro » on phones, where the column titles are hidden. */
const colon = " : ";

export async function PlanFamilySegments({ current }: { current: PlanFamily }) {
  const t = await getTranslations("admin.plans");
  return (
    <nav aria-label={t("families")} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-2 lg:inline-flex lg:gap-1 lg:rounded-pill lg:bg-blanc lg:p-[5px]">
        {planFamilies.map(({ family, key }) => {
          const on = family === current;
          return (
            <li key={family} className="shrink-0">
              <Link
                href={`/admin/forfaits?famille=${family}`}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "inline-flex h-[34px] items-center rounded-pill px-3.5 text-[12.5px] font-medium lg:h-9 lg:px-[18px] lg:text-[12px] lg:font-semibold",
                  on
                    ? "bg-sapin text-blanc"
                    : "bg-blanc ring-[1.5px] ring-brume ring-inset hover:bg-creme lg:ring-0",
                )}
              >
                <span className="lg:hidden">{t(`familyShort.${key}`)}</span>
                <span className="max-lg:hidden">{t(`family.${key}`)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const grid = "lg:grid lg:grid-cols-[1.3fr_1fr_100px_90px_80px_90px] lg:gap-3 lg:px-[18px]";

/** Table of the plans of a family; the chosen plan's name is underlined in Lime. */
export async function PlanTable({
  plans,
  currentCode,
}: {
  plans: FamilyPlan[];
  currentCode?: string;
}) {
  const t = await getTranslations("admin.plans");
  const tc = await getTranslations("common");
  const price = (plan: FamilyPlan) =>
    plan.priceCents === null
      ? t("status.quote")
      : plan.priceCents === 0
        ? tc("free")
        : `${formatUsd(plan.priceCents)} ${tc("currency")}`;
  const interval = (plan: FamilyPlan) =>
    ["month", "quarter", "year"].includes(plan.interval)
      ? t(`field.interval.${plan.interval as "month" | "quarter" | "year"}`)
      : plan.interval;
  if (plans.length === 0) {
    return <p className="rounded-[24px] bg-blanc p-5 text-[13px] text-ardoise">{t("empty")}</p>;
  }
  return (
    <div className="rounded-[24px] bg-blanc px-4 py-1.5 lg:px-0">
      <div role="table" aria-label={t("title")} className="flex flex-col">
        <div role="row" className={cx(grid, "hidden py-2.5", adminLabel)}>
          <span role="columnheader">{t("col.code")}</span>
          <span role="columnheader">{t("col.name")}</span>
          <span role="columnheader">{t("col.price")}</span>
          <span role="columnheader">{t("col.interval")}</span>
          <span role="columnheader">{t("col.subscribers")}</span>
          <span role="columnheader">{t("col.status")}</span>
        </div>
        {plans.map((plan, index) => {
          const on = plan.code === currentCode;
          return (
            <div
              key={plan.id}
              role="row"
              aria-current={on ? "true" : undefined}
              className={cx(
                grid,
                "grid grid-cols-[1fr_auto_auto] items-center gap-x-3 py-3 text-[13px] lg:items-center lg:py-3.5",
                "border-brume lg:border-t",
                index > 0 && "border-t",
                on && "max-lg:-mx-2 max-lg:rounded-[14px] max-lg:bg-lime-clair/60 max-lg:px-2",
              )}
            >
              <span role="cell" className="col-start-1 row-start-2 min-w-0 lg:row-start-1">
                <code className="text-[11px] text-ardoise lg:text-sapin">{plan.code}</code>
              </span>
              <span role="cell" className="col-start-1 row-start-1 min-w-0 lg:col-start-2">
                <Link
                  href={`/admin/forfaits/${plan.code}`}
                  className={cx(
                    "font-semibold hover:underline",
                    on && "shadow-[0_2px_0_var(--color-lime)]",
                  )}
                >
                  {plan.name}
                </Link>
              </span>
              <span
                role="cell"
                className="col-start-2 row-span-2 row-start-1 font-semibold lg:col-start-3 lg:row-span-1 lg:font-normal"
              >
                {price(plan)}
              </span>
              <span role="cell" className="hidden lg:col-start-4 lg:row-start-1 lg:block">
                {interval(plan)}
              </span>
              <span role="cell" className="hidden lg:col-start-5 lg:row-start-1 lg:block">
                <span className="sr-only">
                  {t("col.subscribers")}
                  {colon}
                </span>
                {plan._count.subscriptions.toLocaleString("fr-FR")}
              </span>
              <span
                role="cell"
                className="col-start-3 row-span-2 row-start-1 lg:col-start-6 lg:row-span-1"
              >
                <Tag tone={plan.isPublic ? "success" : "neutral"}>
                  {plan.isPublic ? t("status.public") : t("status.hidden")}
                </Tag>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
