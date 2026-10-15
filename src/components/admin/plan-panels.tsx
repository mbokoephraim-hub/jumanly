import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { PlanFamily } from "@/generated/prisma/client";
import { Icon } from "@/components/brand/icon";
import { adminCard, adminTitle, ReasonField, SensitivePanel } from "@/components/admin/kit";
import { planFamilies } from "@/components/admin/forfaits-table";
import { Alert, Button, ButtonLink, Select, TextField } from "@/components/ui";
import { formatDateTime } from "@/lib/dates";
import { cx } from "@/lib/cx";
import {
  createPlanAction,
  deletePlanAction,
  duplicatePlanAction,
  withdrawPlanAction,
} from "@/server/actions/admin-billing";
import { db } from "@/server/db";
import { planVersions } from "@/server/services/admin-billing";

/**
 * Forfaits (Admin v2, étape 5): the « Nouveau forfait » panel of the list, the « Dupliquer »,
 * « Retirer de la vente » and « Supprimer » panels of a plan, and the versions of a plan with
 * what changed in each.
 */

type Translate = Awaited<ReturnType<typeof getTranslations<"admin">>>;

/** A refusal of a plan action, from `?erreur=`. */
export function PlanError({ t, code }: { t: Translate; code: string }) {
  const known = ["motif", "champs", "taken", "used", "free", "notFound"] as const;
  const key = known.find((item) => item === code);
  if (!key) return null;
  return <Alert tone="error" title={t(`plans.v2.error.${key}`)} />;
}

function CodeField({ id, defaultValue }: { id: string; defaultValue?: string }) {
  return <TextFieldWithHint id={id} name="code" defaultValue={defaultValue} labelKey="code" />;
}

async function TextFieldWithHint({
  id,
  name,
  defaultValue,
  labelKey,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  labelKey: "code" | "name";
}) {
  const t = await getTranslations("admin.plans.v2.field");
  return (
    <TextField
      id={id}
      name={name}
      required
      label={t(`${labelKey}.label`)}
      hint={t(`${labelKey}.hint`)}
      defaultValue={defaultValue}
      maxLength={labelKey === "code" ? 40 : 60}
      pattern={labelKey === "code" ? "[a-z][a-z0-9_]{2,39}" : undefined}
      autoComplete="off"
    />
  );
}

/** « Nouveau forfait » on the list (`?action=nouveau`). */
export async function NewPlanPanel({
  family,
  closeHref,
}: {
  family: PlanFamily;
  closeHref: string;
}) {
  const [t, tc] = await Promise.all([getTranslations("admin"), getTranslations("common")]);
  return (
    <SensitivePanel
      title={t("plans.new")}
      text={t("plans.v2.new.confirm")}
      closeHref={closeHref}
      icon="portefeuille"
      tone="neutral"
    >
      <form action={createPlanAction} className="flex flex-col gap-3.5">
        <input type="hidden" name="back" value={`${closeHref}&action=nouveau`} />
        <Select
          id="forfaits-new-family"
          name="family"
          required
          label={t("plans.v2.field.family")}
          defaultValue={family}
          options={planFamilies.map((item) => ({
            value: item.family,
            label: t(`plans.family.${item.key}`),
          }))}
        />
        <div className="grid gap-3.5 sm:grid-cols-2">
          <CodeField id="forfaits-new-code" />
          <TextFieldWithHint id="forfaits-new-name" name="name" labelKey="name" />
        </div>
        <ReasonField id="forfaits-new-reason" />
        <div className="flex flex-wrap justify-end gap-2">
          <ButtonLink href={closeHref} scroll={false} variant="tertiary">
            {tc("cancel")}
          </ButtonLink>
          <Button type="submit">{t("plans.v2.new.submit")}</Button>
        </div>
      </form>
    </SensitivePanel>
  );
}

/** The open panel of a plan card, from `?action=` (dupliquer, retirer, supprimer). */
export async function PlanPanels({
  plan,
  action,
  usage,
  cardHref,
}: {
  plan: { code: string; name: string; isPublic: boolean; isPurchasable: boolean };
  action: string;
  usage: { used: boolean; isFree: boolean; subscriptions: number };
  cardHref: string;
}) {
  const [t, tc] = await Promise.all([getTranslations("admin"), getTranslations("common")]);
  const back = `${cardHref}?action=${action}`;
  const hidden = <input type="hidden" name="back" value={back} />;
  const cancel = (
    <ButtonLink href={cardHref} scroll={false} variant="tertiary">
      {tc("cancel")}
    </ButtonLink>
  );

  if (action === "dupliquer")
    return (
      <SensitivePanel
        title={t("plans.duplicate")}
        text={t("plans.v2.duplicate.confirm", { plan: plan.name })}
        closeHref={cardHref}
        icon="portefeuille"
        tone="neutral"
      >
        <form action={duplicatePlanAction} className="flex flex-col gap-3.5">
          {hidden}
          <input type="hidden" name="source" value={plan.code} />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <CodeField id="forfaits-copy-code" defaultValue={`${plan.code}_copie`.slice(0, 40)} />
            <TextFieldWithHint
              id="forfaits-copy-name"
              name="name"
              labelKey="name"
              defaultValue={t("plans.v2.duplicate.name", { plan: plan.name }).slice(0, 60)}
            />
          </div>
          <ReasonField id="forfaits-copy-reason" />
          <div className="flex flex-wrap justify-end gap-2">
            {cancel}
            <Button type="submit">{t("plans.v2.duplicate.submit")}</Button>
          </div>
        </form>
      </SensitivePanel>
    );

  if (action === "retirer" && !usage.isFree && (plan.isPublic || plan.isPurchasable))
    return (
      <SensitivePanel
        title={t("plans.v2.withdraw.text")}
        text={t("plans.v2.withdraw.confirm", { plan: plan.name, count: usage.subscriptions })}
        closeHref={cardHref}
        icon="eye"
      >
        <form action={withdrawPlanAction} className="flex flex-col gap-3.5">
          {hidden}
          <input type="hidden" name="code" value={plan.code} />
          <ReasonField id="forfaits-withdraw-reason" />
          <div className="flex flex-wrap justify-end gap-2">
            {cancel}
            <Button type="submit" variant="danger">
              {t("plans.v2.withdraw.text")}
            </Button>
          </div>
        </form>
      </SensitivePanel>
    );

  if (action === "supprimer" && !usage.used && !usage.isFree)
    return (
      <SensitivePanel
        title={t("plans.v2.delete.text")}
        text={t("plans.v2.delete.confirm", { plan: plan.name })}
        closeHref={cardHref}
      >
        <form action={deletePlanAction} className="flex flex-col gap-3.5">
          {hidden}
          <input type="hidden" name="code" value={plan.code} />
          <ReasonField id="forfaits-delete-reason" />
          <div className="flex flex-wrap justify-end gap-2">
            {cancel}
            <Button type="submit" variant="danger">
              {t("plans.v2.delete.text")}
            </Button>
          </div>
        </form>
      </SensitivePanel>
    );

  return null;
}

/** The actions of a plan card: duplicate, withdraw from sale, delete (only if never used). */
export async function PlanActions({
  plan,
  usage,
  cardHref,
}: {
  plan: { name: string; isPublic: boolean; isPurchasable: boolean };
  usage: { used: boolean; isFree: boolean };
  cardHref: string;
}) {
  const t = await getTranslations("admin");
  const link =
    "inline-flex h-9 items-center gap-1.5 rounded-pill bg-blanc px-3.5 text-[12.5px] font-semibold ring-[1.5px] ring-brume ring-inset hover:bg-creme";
  const onSale = plan.isPublic || plan.isPurchasable;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`${cardHref}?action=dupliquer#forfaits-panneau`} scroll={false} className={link}>
        <Icon name="doc" aria-hidden className="size-3.5" />
        {t("plans.duplicate")}
      </Link>
      {!usage.isFree && onSale && (
        <Link href={`${cardHref}?action=retirer#forfaits-panneau`} scroll={false} className={link}>
          <Icon name="eye" aria-hidden className="size-3.5" />
          {t("plans.v2.withdraw.text")}
        </Link>
      )}
      {!usage.used && !usage.isFree ? (
        <Link
          href={`${cardHref}?action=supprimer#forfaits-panneau`}
          scroll={false}
          className={cx(link, "text-corail-fonce")}
        >
          <Icon name="fermer" aria-hidden className="size-3.5" />
          {t("plans.v2.delete.text")}
        </Link>
      ) : (
        <p className="text-[11.5px] leading-4 text-ardoise">
          {t(usage.isFree ? "plans.v2.delete.free" : "plans.v2.delete.used")}
        </p>
      )}
    </div>
  );
}

const fieldKeys = {
  name: "plans.field.name",
  tagline: "plans.field.tagline",
  priceCents: "plans.v2.history.price",
  sortOrder: "plans.field.order",
  isPublic: "plans.field.public",
  isPurchasable: "plans.field.purchasable",
  recommended: "plans.field.recommended",
} as const;

/** « Versions du forfait »: who changed what, when and why. */
export async function PlanVersions({ planId }: { planId: string }) {
  const [t, versions] = await Promise.all([getTranslations("admin"), planVersions(db, planId)]);
  const label = (field: string) =>
    field in fieldKeys ? t(fieldKeys[field as keyof typeof fieldKeys]) : field;
  const value = (field: string, raw: string) => {
    if (raw === "true") return t("plans.entitlements.value.on");
    if (raw === "false") return t("plans.entitlements.value.off");
    if (field === "priceCents")
      return raw === "" ? t("plans.status.quote") : `${(Number(raw) / 100).toFixed(2)} USD`;
    return raw === "" ? "·" : raw;
  };
  const action = (code: string) => {
    const key = `journal.action.${code.replaceAll(".", "_")}`;
    return t.has(key as never) ? t(key as never) : code;
  };
  return (
    <section aria-labelledby="forfaits-versions" className={cx(adminCard, "flex flex-col gap-3.5")}>
      <h2 id="forfaits-versions" className={cx(adminTitle, "!text-[16px] !leading-[22px]")}>
        {t("plans.v2.history.title")}
      </h2>
      {versions.length === 0 ? (
        <p className="text-[13px] leading-5 text-ardoise">{t("plans.v2.history.empty")}</p>
      ) : (
        <ol className="flex flex-col">
          {versions.map((version) => (
            <li
              key={version.id}
              className="flex flex-col gap-1.5 border-b border-brume py-3 first:pt-0 last:border-b-0 last:pb-0"
            >
              <p className="text-[13.5px] leading-5">
                <span className="font-semibold">{version.actor ?? t("journal.system")}</span>{" "}
                {action(version.action)}
                <span className="text-ardoise">
                  {" · "}
                  <time dateTime={version.createdAt.toISOString()}>
                    {formatDateTime(version.createdAt)}
                  </time>
                </span>
              </p>
              {version.changes.length > 0 && (
                <ul className="flex flex-col gap-1 rounded-[12px] bg-creme px-3 py-2">
                  {version.changes.map((change) => (
                    <li
                      key={change.field}
                      className="flex flex-wrap items-baseline justify-between gap-x-3 text-[12.5px] leading-[18px]"
                    >
                      <span className="min-w-0 font-mono text-[11.5px] break-all">
                        {label(change.field)}
                      </span>
                      <span className="font-semibold">
                        {t("plans.v2.history.change", {
                          from: value(change.field, change.from),
                          to: value(change.field, change.to),
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {version.reason && (
                <p className="text-[12.5px] leading-[18px] break-words">
                  {t("journal.reasonLabel", { reason: version.reason })}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
