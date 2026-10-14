import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Alert, Button, Checkbox, TextField } from "@/components/ui";
import { inputClasses } from "@/components/ui/field";
import { cx } from "@/lib/cx";
import { updatePlan } from "@/server/actions/admin";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";

/** One plan: displayed fields and every entitlement value, editable without redeploy. */
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
  const errorKey = typeof query.cle === "string" ? query.cle : "";
  return (
    <>
      <Link href="/admin/forfaits" className="text-sm underline">
        {t("back")}
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{plan.name}</h1>
        <p className="font-mono text-sm text-ardoise">{plan.code}</p>
        <p className="text-ardoise">{t("subtitle")}</p>
      </header>
      {query.ok && <Alert tone="success" title={t("saved")} />}
      {query.erreur === "prix" && <Alert tone="error" title={t("error.price")} />}
      {query.erreur === "valeur" && (
        <Alert tone="error" title={t("error.value", { key: errorKey })} />
      )}
      <form action={updatePlan} className="flex flex-col gap-6">
        <input type="hidden" name="code" value={plan.code} />
        <fieldset disabled={!writable} className="flex flex-col gap-4 rounded-card bg-blanc p-6">
          <legend className="sr-only">{t("edit")}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="name"
              name="name"
              label={t("field.name")}
              defaultValue={plan.name}
              required
            />
            <TextField
              id="price"
              name="price"
              label={t("field.price")}
              hint={t("field.priceHelp")}
              inputMode="decimal"
              defaultValue={plan.priceCents === null ? "" : (plan.priceCents / 100).toString()}
            />
            <TextField
              id="tagline"
              name="tagline"
              label={t("field.tagline")}
              defaultValue={plan.tagline}
              className="sm:col-span-2"
            />
            <TextField
              id="sortOrder"
              name="sortOrder"
              type="number"
              label={t("field.order")}
              defaultValue={String(plan.sortOrder)}
            />
          </div>
          <p className="text-sm text-ardoise">{t("priceChange.notice")}</p>
          <Checkbox
            id="isPublic"
            name="isPublic"
            value="on"
            defaultChecked={plan.isPublic}
            label={t("field.public")}
          />
          <Checkbox
            id="isPurchasable"
            name="isPurchasable"
            value="on"
            defaultChecked={plan.isPurchasable}
            label={t("field.purchasable")}
          />
          <Checkbox
            id="recommended"
            name="recommended"
            value="on"
            defaultChecked={plan.recommended}
            label={t("field.recommended")}
          />
        </fieldset>
        <fieldset disabled={!writable} className="flex flex-col gap-4 rounded-card bg-blanc p-6">
          <legend className="text-h2">{t("entitlements.title")}</legend>
          <p className="text-sm text-ardoise">{t("guard.applyFree")}</p>
          <p id="limit-help" className="text-sm text-ardoise">
            {t("entitlements.value.unlimited")}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-ardoise">
                  <th className="py-2 pr-4 font-medium">{t("entitlements.key")}</th>
                  <th className="py-2 pr-4 font-medium">{t("entitlements.type.text")}</th>
                  <th className="py-2 font-medium">{t("entitlements.value.text")}</th>
                </tr>
              </thead>
              <tbody>
                {plan.entitlements.map((entitlement) => {
                  const id = `e-${entitlement.key.replaceAll(".", "-")}`;
                  const name = `e:${entitlement.key}`;
                  const locked = entitlement.key === "jobs.apply";
                  return (
                    <tr key={entitlement.id} className="border-t border-brume align-top">
                      <td className="py-2 pr-4 font-mono">
                        <label htmlFor={id}>{entitlement.key}</label>
                      </td>
                      <td className="py-2 pr-4">
                        {entitlement.type === "boolean"
                          ? t("entitlements.type.feature")
                          : entitlement.type === "level"
                            ? t("entitlements.type.level")
                            : t("entitlements.type.quota")}
                      </td>
                      <td className="py-2">
                        {entitlement.type === "boolean" ? (
                          <select
                            id={id}
                            name={name}
                            defaultValue={entitlement.value}
                            disabled={locked}
                            className={cx(inputClasses, "h-10")}
                          >
                            <option value="true">{t("entitlements.value.on")}</option>
                            <option value="false">{t("entitlements.value.off")}</option>
                          </select>
                        ) : (
                          <input
                            id={id}
                            name={name}
                            defaultValue={entitlement.value}
                            aria-describedby={
                              entitlement.type === "limit" ? "limit-help" : undefined
                            }
                            className={cx(inputClasses, "h-10")}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </fieldset>
        {writable && (
          <div>
            <Button type="submit" size="lg">
              {t("save.confirm")}
            </Button>
          </div>
        )}
      </form>
    </>
  );
}
