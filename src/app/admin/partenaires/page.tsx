import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Alert, Badge, Button, EmptyState, Select, TextField } from "@/components/ui";
import { formatUsd } from "@/lib/money";
import {
  createBatchAction,
  createPartnerAction,
  invitePartnerManagerAction,
} from "@/server/actions/admin";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { adminPartners, MIN_GROUP, partnerKinds } from "@/server/services/partners";

/**
 * Partners and licence batches (partie 07 § 6): no online purchase, the admin creates the partner,
 * invites its manager and adds a batch after the contract is signed.
 */
export default async function AdminPartners({ searchParams }: PageProps<"/admin/partenaires">) {
  const params = await searchParams;
  const admin = await requireAdmin();
  if (!admin) notFound();
  const t = await getTranslations("admin.partners");
  const tl = await getTranslations("partner.licenses.batch");
  const writable = canWriteAdmin(admin);
  const [partners, plans] = await Promise.all([
    adminPartners(db),
    db.plan.findMany({
      where: { family: "talent", active: true, priceCents: { gt: 0 } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const kindOptions = partnerKinds.map((kind) => ({ value: kind, label: t(`field.type.${kind}`) }));
  const okText =
    params.ok === "partenaire"
      ? t("created")
      : params.ok === "invitation"
        ? t("invited")
        : params.ok === "lot"
          ? t("batch.created")
          : null;

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{t("title")}</h1>
        <p className="text-ardoise">{t("subtitle")}</p>
      </header>
      <Alert tone="info" title={t("noOnlinePurchase")} />
      {okText && <Alert tone="success" title={okText} />}
      {typeof params.erreur === "string" && <Alert tone="error" title={t("error")} />}

      {writable && (
        <details className="rounded-card bg-blanc p-6">
          <summary className="cursor-pointer font-semibold">{t("new")}</summary>
          <form action={createPartnerAction} className="mt-4 grid gap-4 sm:grid-cols-3">
            <TextField
              id="partner-name"
              name="name"
              label={t("field.org")}
              required
              maxLength={120}
            />
            <Select
              id="partner-kind"
              name="kind"
              label={t("field.type.text")}
              options={kindOptions}
            />
            <TextField
              id="partner-manager"
              name="managerEmail"
              type="email"
              label={t("field.manager")}
              required
            />
            <Button type="submit" className="self-start">
              {t("create")}
            </Button>
          </form>
        </details>
      )}

      {partners.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <ul className="flex flex-col gap-4">
          {partners.map((partner) => {
            const managers = partner.memberships.map((item) => item.user.email);
            const pending = partner.invitations.map((item) => item.email);
            return (
              <li
                key={partner.id}
                id={`partner-${partner.id}`}
                className="flex flex-col gap-4 rounded-card bg-blanc p-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-h3 font-semibold">{partner.name}</h2>
                  {partner.partnerKind && (
                    <Badge>
                      {t(
                        `field.type.${partnerKinds.find((kind) => kind === partner.partnerKind) ?? "company"}`,
                      )}
                    </Badge>
                  )}
                </div>
                <p className="text-sm">
                  {managers.length
                    ? t("managers", { emails: managers.join(", ") })
                    : t("noManager")}
                  {pending.length > 0 && ` · ${t("pending", { emails: pending.join(", ") })}`}
                </p>

                {partner.licenseBatches.length === 0 ? (
                  <p className="text-sm text-ardoise">{t("batch.none")}</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {partner.licenseBatches.map((batch) => (
                      <li key={batch.id} className="flex flex-col gap-1 rounded-md bg-creme p-3">
                        <span className="font-medium">
                          {[
                            batch.name,
                            batch.plan.name,
                            tl("usage", { activated: batch.activated, total: batch.seats }),
                          ].join(" · ")}
                        </span>
                        <span className="text-sm text-ardoise">
                          {[
                            tl("period", { start: batch.startsAt, end: batch.endsAt }),
                            tl("duration", { months: batch.months }),
                            tl(`status.${batch.status}`),
                            batch.contractRef
                              ? t("batch.contract", { reference: batch.contractRef })
                              : null,
                            batch.priceCents !== null ? formatUsd(batch.priceCents) : null,
                            `${t("batch.minGroup")} : ${batch.minGroup}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {writable && (
                  <>
                    <details>
                      <summary className="cursor-pointer font-medium">{t("batch.new")}</summary>
                      <form action={createBatchAction} className="mt-3 grid gap-3 sm:grid-cols-3">
                        <input type="hidden" name="partnerId" value={partner.id} />
                        <TextField
                          id={`batch-name-${partner.id}`}
                          name="name"
                          label={t("batch.name")}
                          required
                          maxLength={80}
                        />
                        <Select
                          id={`batch-plan-${partner.id}`}
                          name="planId"
                          label={t("batch.plan")}
                          options={plans.map((plan) => ({ value: plan.id, label: plan.name }))}
                        />
                        <TextField
                          id={`batch-seats-${partner.id}`}
                          name="seats"
                          type="number"
                          min={1}
                          label={t("batch.quantity")}
                          required
                        />
                        <TextField
                          id={`batch-months-${partner.id}`}
                          name="months"
                          type="number"
                          min={1}
                          max={36}
                          defaultValue={6}
                          label={t("batch.months")}
                          required
                        />
                        <TextField
                          id={`batch-start-${partner.id}`}
                          name="startsAt"
                          type="date"
                          defaultValue={today}
                          label={t("contract.start")}
                          required
                        />
                        <TextField
                          id={`batch-end-${partner.id}`}
                          name="endsAt"
                          type="date"
                          label={t("contract.end")}
                          required
                        />
                        <TextField
                          id={`batch-ref-${partner.id}`}
                          name="contractRef"
                          label={t("contract.reference")}
                          maxLength={80}
                        />
                        <TextField
                          id={`batch-amount-${partner.id}`}
                          name="amount"
                          inputMode="decimal"
                          label={t("contract.amount")}
                          hint={t("batch.amountHelp")}
                        />
                        <TextField
                          id={`batch-min-${partner.id}`}
                          name="minGroup"
                          type="number"
                          min={MIN_GROUP}
                          defaultValue={MIN_GROUP}
                          label={t("batch.minGroup")}
                          required
                        />
                        <Button type="submit" className="self-start">
                          {t("batch.create")}
                        </Button>
                      </form>
                    </details>
                    <form
                      action={invitePartnerManagerAction}
                      className="flex flex-wrap items-end gap-3"
                    >
                      <input type="hidden" name="organization" value={partner.id} />
                      <TextField
                        id={`manager-${partner.id}`}
                        name="email"
                        type="email"
                        label={t("inviteManager")}
                        required
                      />
                      <Button type="submit" size="sm" variant="secondary">
                        {t("invite")}
                      </Button>
                    </form>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
