import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { PlanImpact, type TrackedField } from "@/components/admin/forfaits-impact";
import { PlanFamilySegments, PlanTable, plansOfFamily } from "@/components/admin/forfaits-table";
import { AdminPageHeader, Tag } from "@/components/admin/kit";
import { Alert } from "@/components/ui";
import { inputClasses } from "@/components/ui/field";
import type { EntitlementType } from "@/generated/prisma/client";
import { cx } from "@/lib/cx";
import { updatePlan } from "@/server/actions/admin";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";

const formId = "forfaits-edit";
/** The tarifs page section that holds the comparison of each family. */
const matrixAnchor = {
  talent: "talents",
  rh: "rh",
  company: "companies",
  partner: "partners",
} as const;

/**
 * Numbers are provisional (partie 05 § 3: « les quotas chiffrés sont des valeurs provisoires »):
 * every positive limit carries the Ambre « Provisoire » badge.
 */
function isProvisional(type: EntitlementType, value: string) {
  return type === "limit" && /^\d+$/.test(value) && Number(value) > 0;
}

/** A limit consumed per period (`….monthly`) is a quota; any other limit is a capacity. */
function typeKey(type: EntitlementType, key: string) {
  if (type === "boolean") return "feature";
  if (type === "level") return "level";
  return key.endsWith(".monthly") ? "quota" : "capacity";
}

/** Does `plan` include at least what `previous` offers (features on, limits as high)? */
function includesAll(
  plan: { key: string; type: EntitlementType; value: string }[],
  previous: { key: string; type: EntitlementType; value: string }[],
) {
  const mine = new Map(plan.map((entitlement) => [entitlement.key, entitlement.value]));
  const amount = (value: string) =>
    value === "-1" || value === "contract" ? Infinity : Number(value);
  return previous.every(({ key, type, value }) => {
    const own = mine.get(key);
    if (own === undefined) return false;
    if (type === "boolean") return value === "false" || own === "true";
    if (type === "limit") return amount(own) >= amount(value);
    return true;
  });
}

/** `jobs.apply` in a text: the backquoted part becomes code. */
function withCode(text: string): ReactNode {
  return text.split("`").map((part, index) => (index % 2 ? <code key={index}>{part}</code> : part));
}

/** CSS-only switch: a checkbox drawn as a 44 × 26 track, Sapin with a Lime knob when on. */
const switchClasses = cx(
  "peer relative h-[26px] w-11 shrink-0 cursor-pointer appearance-none rounded-pill bg-brume transition-colors motion-reduce:transition-none",
  "before:absolute before:top-[3px] before:left-[3px] before:size-5 before:rounded-full before:bg-blanc before:transition-transform motion-reduce:before:transition-none",
  "checked:bg-sapin checked:before:translate-x-[18px] checked:before:bg-lime",
  "focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

const keyClasses =
  "font-mono text-[12.5px] font-semibold break-all lg:text-[11.5px] lg:font-normal";

function PlanField({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon?: IconName;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] leading-[18px] font-semibold">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <Icon
            name={icon}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-sapin"
          />
        )}
        {children}
      </div>
    </div>
  );
}

/** One plan: the family table on top, then the plan fields, its entitlements and the impact. */
export default async function AdminPlan({
  params,
  searchParams,
}: PageProps<"/admin/forfaits/[code]">) {
  const { code } = await params;
  const query = await searchParams;
  const admin = await requireAdmin();
  // Content editors see the admin shell, but only the courses.
  if (!admin) notFound();
  const writable = canWriteAdmin(admin);
  const t = await getTranslations("admin.plans");
  const plan = await db.plan.findUnique({
    where: { code },
    include: { entitlements: { orderBy: { key: "asc" } } },
  });
  if (!plan) notFound();
  const plans = await plansOfFamily(plan.family);
  const subscribers = plans.find((item) => item.id === plan.id)?._count.subscriptions ?? 0;
  const index = plans.findIndex((item) => item.id === plan.id);
  const previous = index > 0 ? plans[index - 1] : undefined;
  const previousEntitlements = previous
    ? await db.planEntitlement.findMany({ where: { planId: previous.id } })
    : [];
  const inherits = previous !== undefined && includesAll(plan.entitlements, previousEntitlements);
  const errorKey = typeof query.cle === "string" ? query.cle : "";
  const interval = ["month", "quarter", "year"].includes(plan.interval)
    ? t(`field.interval.${plan.interval as "month" | "quarter" | "year"}`)
    : plan.interval;
  const priceValue = plan.priceCents === null ? "" : (plan.priceCents / 100).toString();

  const tracked: TrackedField[] = [
    { name: "name", label: t("field.name"), from: plan.name },
    { name: "tagline", label: t("field.tagline"), from: plan.tagline },
    { name: "price", label: t("field.price"), from: priceValue },
    { name: "sortOrder", label: t("field.order"), from: String(plan.sortOrder) },
    { name: "isPublic", label: t("field.public"), from: String(plan.isPublic), checkbox: true },
    {
      name: "isPurchasable",
      label: t("field.purchasable"),
      from: String(plan.isPurchasable),
      checkbox: true,
    },
    {
      name: "recommended",
      label: t("field.recommended"),
      from: String(plan.recommended),
      checkbox: true,
    },
    ...plan.entitlements
      .filter((entitlement) => entitlement.key !== "jobs.apply")
      .map((entitlement) => ({
        name: `e:${entitlement.key}`,
        label: entitlement.key,
        from: entitlement.value,
        checkbox: entitlement.type === "boolean",
        provisional: isProvisional(entitlement.type, entitlement.value),
      })),
  ];
  const anyProvisional = plan.entitlements.some((entitlement) =>
    isProvisional(entitlement.type, entitlement.value),
  );

  return (
    <>
      <AdminPageHeader title={t("title")} subtitle={t("subtitle")} />
      <PlanFamilySegments current={plan.family} />
      <PlanTable plans={plans} currentCode={plan.code} />

      {query.ok && <Alert tone="success" title={t("saved")} />}
      {query.erreur === "prix" && <Alert tone="error" title={t("error.price")} />}
      {query.erreur === "champs" && <Alert tone="error" title={t("error.fields")} />}
      {query.erreur === "valeur" && (
        <Alert tone="error" title={t("error.value", { key: errorKey })} />
      )}

      <form
        id={formId}
        action={updatePlan}
        className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]"
      >
        <input type="hidden" name="code" value={plan.code} />
        <div className="flex min-w-0 flex-col gap-4">
          {/* Plan fields. */}
          <fieldset
            disabled={!writable}
            className="flex min-w-0 flex-col gap-3.5 rounded-[24px] bg-blanc p-5 lg:p-[22px]"
          >
            <legend className="sr-only">{t("edit")}</legend>
            <div className="flex flex-col gap-0.5">
              <h2 className="text-[18px] leading-[24px] font-semibold tracking-[-0.015em] lg:text-[20px] lg:leading-[26px]">
                {t("edit")} <span className="sr-only">{plan.name}</span>
              </h2>
              <p className="text-[11px] leading-[15px] text-ardoise">
                <code>{plan.code}</code> · {t("subscribersCount", { count: subscribers })}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <PlanField id="forfaits-name" label={t("field.name")}>
                <input
                  id="forfaits-name"
                  name="name"
                  required
                  maxLength={60}
                  defaultValue={plan.name}
                  className={cx(inputClasses, "h-12")}
                />
              </PlanField>
              <PlanField id="forfaits-tagline" label={t("field.tagline")}>
                <input
                  id="forfaits-tagline"
                  name="tagline"
                  maxLength={200}
                  defaultValue={plan.tagline}
                  className={cx(inputClasses, "h-12")}
                />
              </PlanField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <PlanField id="forfaits-price" label={t("field.price")} icon="portefeuille">
                <input
                  id="forfaits-price"
                  name="price"
                  inputMode="decimal"
                  defaultValue={priceValue}
                  placeholder={t("status.quote")}
                  aria-describedby="forfaits-price-hint"
                  className={cx(inputClasses, "h-12 pl-11")}
                />
                <span id="forfaits-price-hint" className="sr-only">
                  {t("field.priceHelp")}
                </span>
              </PlanField>
              <PlanField id="forfaits-currency" label={t("field.currency")}>
                <input
                  id="forfaits-currency"
                  readOnly
                  value={plan.currency}
                  className={cx(inputClasses, "h-12 bg-creme/60 text-ardoise")}
                />
              </PlanField>
              <PlanField id="forfaits-interval" label={t("field.interval.text")}>
                <input
                  id="forfaits-interval"
                  readOnly
                  value={interval}
                  className={cx(inputClasses, "h-12 bg-creme/60 text-ardoise")}
                />
              </PlanField>
              <PlanField id="forfaits-order" label={t("field.order")}>
                <input
                  id="forfaits-order"
                  name="sortOrder"
                  type="number"
                  min={0}
                  max={999}
                  defaultValue={String(plan.sortOrder)}
                  className={cx(inputClasses, "h-12")}
                />
              </PlanField>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {(
                [
                  ["recommended", plan.recommended, t("field.recommended")],
                  ["isPurchasable", plan.isPurchasable, t("field.purchasable")],
                  ["isPublic", plan.isPublic, t("field.public")],
                ] as const
              ).map(([name, checked, label]) => (
                <label
                  key={name}
                  className="flex cursor-pointer items-center gap-2.5 text-[12px] leading-[17px] font-medium"
                >
                  <input
                    type="checkbox"
                    role="switch"
                    name={name}
                    value="on"
                    defaultChecked={checked}
                    className={switchClasses}
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="flex items-start gap-2.5 rounded-[12px] bg-creme px-3 py-2.5 text-[11px] leading-[15px]">
              <Icon name="notification" aria-hidden className="mt-px size-3.5 shrink-0" />
              {t("priceChange.notice")}
            </p>
          </fieldset>

          {/* Entitlements. */}
          <fieldset
            disabled={!writable}
            className="flex min-w-0 flex-col gap-3 rounded-[24px] bg-blanc p-5 lg:p-[22px]"
          >
            <legend className="sr-only">{t("entitlements.title")}</legend>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-[18px] leading-[24px] font-semibold tracking-[-0.015em] lg:text-[20px] lg:leading-[26px]">
                  {t("entitlements.title")}
                </h2>
                {inherits && previous && (
                  <p className="text-[11px] leading-[15px] text-ardoise">
                    {t("entitlements.inherit", { plan: previous.name })}
                  </p>
                )}
              </div>
              <Link
                href={`/tarifs#${matrixAnchor[plan.family]}`}
                className="inline-flex items-center gap-1 text-[13px] whitespace-nowrap hover:underline"
              >
                {t("entitlements.matrix")}
                <Icon name="chev-r" aria-hidden className="size-3.5" />
              </Link>
            </div>
            {anyProvisional && (
              <p className="flex items-center gap-2.5 rounded-[12px] bg-ambre-fond px-3 py-2.5 text-[11px] leading-[15px] text-ambre-texte">
                <Tag tone="warning" className="bg-ambre-fond">
                  {t("entitlements.provisional.text")}
                </Tag>
                {t("entitlements.provisional.hint")}
              </p>
            )}
            <div role="table" aria-label={t("entitlements.title")} className="flex flex-col">
              <div
                role="row"
                className="hidden gap-3 px-[18px] py-2.5 text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-ardoise uppercase lg:grid lg:grid-cols-[1.5fr_120px_1.3fr]"
              >
                <span role="columnheader">{t("entitlements.key")}</span>
                <span role="columnheader">{t("entitlements.type.text")}</span>
                <span role="columnheader">{t("entitlements.value.text")}</span>
              </div>
              {plan.entitlements.map((entitlement, rowIndex) => {
                const id = `forfaits-e-${entitlement.key.replaceAll(".", "-")}`;
                const name = `e:${entitlement.key}`;
                const provisional = isProvisional(entitlement.type, entitlement.value);
                return (
                  <div
                    key={entitlement.id}
                    role="row"
                    className={cx(
                      "flex flex-col gap-1.5 border-brume py-3.5 text-[13px] lg:grid lg:grid-cols-[1.5fr_120px_1.3fr] lg:items-center lg:gap-3 lg:border-t lg:px-[18px]",
                      rowIndex > 0 && "border-t",
                    )}
                  >
                    <span role="rowheader" className="min-w-0">
                      {entitlement.key === "jobs.apply" ? (
                        <code className={keyClasses}>{entitlement.key}</code>
                      ) : (
                        <label htmlFor={id} className={keyClasses}>
                          {entitlement.key}
                        </label>
                      )}
                    </span>
                    <span role="cell" className="text-[12px] text-ardoise lg:text-[13px]">
                      {t(`entitlements.type.${typeKey(entitlement.type, entitlement.key)}`)}
                    </span>
                    <span role="cell" className="flex min-w-0 items-center gap-2">
                      {entitlement.key === "jobs.apply" ? (
                        <>
                          <Tag tone="lime" icon="check">
                            {t("entitlements.value.on")}
                          </Tag>
                          <Icon name="lock" aria-hidden className="size-3.5 text-ardoise" />
                          <span className="sr-only">{withCode(t("guard.applyFree"))}</span>
                        </>
                      ) : entitlement.type === "boolean" ? (
                        <>
                          <input
                            id={id}
                            type="checkbox"
                            role="switch"
                            name={name}
                            value="true"
                            defaultChecked={entitlement.value === "true"}
                            className={switchClasses}
                          />
                          <span
                            aria-hidden
                            className="hidden text-[11px] font-semibold peer-checked:inline"
                          >
                            {t("entitlements.value.on")}
                          </span>
                          <span
                            aria-hidden
                            className="text-[11px] text-ardoise peer-checked:hidden"
                          >
                            {t("entitlements.value.off")}
                          </span>
                        </>
                      ) : (
                        <>
                          <input
                            id={id}
                            name={name}
                            defaultValue={entitlement.value}
                            required
                            aria-describedby={
                              entitlement.type === "limit" ? "forfaits-limit-help" : undefined
                            }
                            className={cx(
                              "h-8 w-[min(100%,10rem)] rounded-[10px] bg-blanc px-3 text-[12.5px] font-semibold text-sapin ring-[1.5px] ring-inset",
                              "focus:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus:ring-2 focus:ring-sapin focus:outline-none",
                              "disabled:cursor-not-allowed disabled:bg-creme",
                              provisional ? "ring-ambre" : "ring-brume",
                            )}
                          />
                          {provisional && (
                            <Tag tone="warning" className="h-[22px]">
                              {t("entitlements.provisional.text")}
                            </Tag>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            <p id="forfaits-limit-help" className="sr-only">
              {t("entitlements.value.unlimited")} · {t("entitlements.value.none")}
            </p>
            <div className="flex flex-col gap-2">
              {[t("guard.applyFree"), t("guard.freeRecruitable")].map((text) => (
                <p
                  key={text}
                  className="flex items-start gap-2.5 rounded-[12px] bg-lime-clair px-3 py-2.5 text-[11px] leading-[15px]"
                >
                  <Icon name="lock" aria-hidden className="mt-px size-3.5 shrink-0" />
                  <span>{withCode(text)}</span>
                </p>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="lg:sticky lg:top-6">
          <PlanImpact
            formId={formId}
            fields={tracked}
            writable={writable}
            labels={{
              title: t("save.preview"),
              impact: t("save.impact", { count: subscribers }),
              none: t("save.none"),
              confirm: t("save.confirm"),
              provisional: t("entitlements.provisional.text"),
              on: t("entitlements.value.on"),
              off: t("entitlements.value.off"),
              readOnly: t("save.readOnly"),
            }}
          />
        </div>
      </form>
    </>
  );
}
