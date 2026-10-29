import { getTranslations } from "next-intl/server";
import { ReasonField, SectionRule, SensitivePanel } from "@/components/admin/kit";
import { rightLabel, rightValue } from "@/components/admin/user-rights";
import { Alert, Button, ButtonLink, Select, TextField } from "@/components/ui";
import { formatShortDate } from "@/lib/dates";
import {
  addCreditsAction,
  deleteUserAction,
  eraseUserAction,
  grantPlanAction,
  removeOverrideAction,
  resetTwoFactorAction,
  revokePlanAction,
  verifyEmailAction,
} from "@/server/actions/admin-users";
import { db } from "@/server/db";
import { parseLimit } from "@/server/entitlements";
import {
  deletionCheck,
  ERASE_WORD,
  grantablePlans,
  type userRights,
} from "@/server/services/admin-users";

const DAY = 86_400_000;
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

/**
 * The open panel of a user card (Admin v2, étape 3), from `?action=`: mark the e-mail as verified,
 * give a plan, add credits, withdraw a gift or an extra, delete the account in two steps. Each one
 * asks for a reason, recorded in the journal.
 */
export async function UserPanels({
  user,
  action,
  params,
  ficheHref,
  actorId,
  rights,
  granted,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
  };
  action: string;
  params: Record<string, string | string[] | undefined>;
  ficheHref: string;
  actorId: string;
  rights: Awaited<ReturnType<typeof userRights>>;
  granted: { id: string; currentPeriodEnd: Date; plan: { name: string } }[];
}) {
  const [t, tc] = await Promise.all([getTranslations("admin"), getTranslations("common")]);
  const now = new Date();
  const back = `${ficheHref}&action=${action}`;
  const hidden = (
    <>
      <input type="hidden" name="userId" value={user.id} />
      <input type="hidden" name="back" value={back} />
    </>
  );
  const cancel = (
    <ButtonLink href={ficheHref} scroll={false} variant="tertiary">
      {tc("cancel")}
    </ButtonLink>
  );
  const until = (id: string, value: Date) => (
    <TextField
      id={id}
      name="until"
      type="date"
      required
      label={t("users.action.until")}
      min={isoDay(new Date(now.getTime() + DAY))}
      max={isoDay(new Date(now.getTime() + 730 * DAY))}
      defaultValue={isoDay(value)}
    />
  );

  let panel: React.ReactNode = null;

  if (action === "verifier" && !user.emailVerified) {
    panel = (
      <SensitivePanel
        title={t("users.action.verifyEmail.text")}
        text={t("users.action.verifyEmail.confirm", { email: user.email })}
        closeHref={ficheHref}
        icon="valider"
        tone="neutral"
      >
        <form action={verifyEmailAction} className="flex flex-col gap-3.5">
          {hidden}
          <ReasonField
            id="utilisateurs-verify-reason"
            label={t("users.action.verifyEmail.reason")}
          />
          <div className="flex flex-wrap justify-end gap-2">
            {cancel}
            <Button type="submit">{t("users.action.verifyEmail.submit")}</Button>
          </div>
        </form>
      </SensitivePanel>
    );
  }

  if (action === "2fa" && user.twoFactorEnabled) {
    panel = (
      <SensitivePanel
        title={t("users.overview.twoFactorReset")}
        text={t("users.overview.twoFactorConfirm", { userName: user.name })}
        closeHref={ficheHref}
      >
        <form action={resetTwoFactorAction} className="flex flex-col gap-3.5">
          {hidden}
          <ReasonField id="utilisateurs-2fa-reason" maxLength={500} />
          <div className="flex flex-wrap justify-end gap-2">
            {cancel}
            <Button type="submit" variant="danger">
              {t("users.overview.twoFactorSubmit")}
            </Button>
          </div>
        </form>
      </SensitivePanel>
    );
  }

  if (action === "forfait") {
    const plans = await grantablePlans(db);
    panel = (
      <SensitivePanel
        title={t("users.action.grantPlan.text")}
        text={t("users.action.grantPlan.confirm")}
        closeHref={ficheHref}
        icon="portefeuille"
        tone="neutral"
      >
        <form action={grantPlanAction} className="flex flex-col gap-3.5">
          {hidden}
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Select
              id="utilisateurs-grant-plan"
              name="planCode"
              required
              label={t("users.action.grantPlan.plan")}
              options={plans.map((plan) => ({ value: plan.code, label: plan.name }))}
            />
            {until("utilisateurs-grant-until", new Date(now.getTime() + 30 * DAY))}
          </div>
          <ReasonField id="utilisateurs-grant-reason" />
          <div className="flex flex-wrap justify-end gap-2">
            {cancel}
            <Button type="submit">{t("users.action.grantPlan.submit")}</Button>
          </div>
        </form>
      </SensitivePanel>
    );
  }

  if (action === "credits" && rights) {
    const quotas = rights.rows.filter(
      (row) => row.type === "limit" && row.key.endsWith(".monthly") && parseLimit(row.value) >= 0,
    );
    panel = (
      <SensitivePanel
        title={t("users.action.credits.text")}
        text={t("users.action.credits.confirm")}
        closeHref={ficheHref}
        icon="intelligence"
        tone="neutral"
      >
        {quotas.length === 0 ? (
          <Alert tone="info" title={t("users.action.credits.none")} />
        ) : (
          <form action={addCreditsAction} className="flex flex-col gap-3.5">
            {hidden}
            <Select
              id="utilisateurs-credits-key"
              name="key"
              required
              label={t("users.action.credits.quota")}
              options={quotas.map((row) => ({
                value: row.key,
                label: `${rightLabel(t, row.key)} · ${t("users.rights.usedOf", {
                  used: row.used ?? 0,
                  limit: rightValue(t, row.type, row.value),
                })}`,
              }))}
            />
            <div className="grid gap-3.5 sm:grid-cols-2">
              <TextField
                id="utilisateurs-credits-amount"
                name="amount"
                type="number"
                required
                min={1}
                max={10_000}
                inputMode="numeric"
                label={t("users.action.credits.amount")}
              />
              {until(
                "utilisateurs-credits-until",
                rights.plan.periodEnd.getTime() > now.getTime() + DAY
                  ? rights.plan.periodEnd
                  : new Date(now.getTime() + 30 * DAY),
              )}
            </div>
            <ReasonField id="utilisateurs-credits-reason" />
            <div className="flex flex-wrap justify-end gap-2">
              {cancel}
              <Button type="submit">{t("users.action.credits.submit")}</Button>
            </div>
          </form>
        )}
      </SensitivePanel>
    );
  }

  if (action === "retirer-forfait") {
    const grant = granted.find((row) => row.id === one(params.abonnement));
    if (grant)
      panel = (
        <SensitivePanel
          title={t("users.action.grantPlan.revokeTitle")}
          text={t("users.action.grantPlan.revokeConfirm", {
            plan: grant.plan.name,
            date: formatShortDate(grant.currentPeriodEnd),
          })}
          closeHref={ficheHref}
        >
          <form action={revokePlanAction} className="flex flex-col gap-3.5">
            {hidden}
            <input type="hidden" name="subscriptionId" value={grant.id} />
            <ReasonField id="utilisateurs-revoke-reason" />
            <div className="flex flex-wrap justify-end gap-2">
              {cancel}
              <Button type="submit" variant="danger">
                {t("users.action.grantPlan.revoke")}
              </Button>
            </div>
          </form>
        </SensitivePanel>
      );
  }

  if (action === "retirer-ajout" && rights) {
    const row = rights.rows.find((entry) => entry.override?.id === one(params.ajout));
    if (row?.override)
      panel = (
        <SensitivePanel
          title={t("users.action.override.removeTitle")}
          text={t("users.action.override.removeConfirm", { right: rightLabel(t, row.key) })}
          closeHref={ficheHref}
        >
          <form action={removeOverrideAction} className="flex flex-col gap-3.5">
            {hidden}
            <input type="hidden" name="overrideId" value={row.override.id} />
            <ReasonField id="utilisateurs-override-reason" />
            <div className="flex flex-wrap justify-end gap-2">
              {cancel}
              <Button type="submit" variant="danger">
                {t("users.action.override.removeTitle")}
              </Button>
            </div>
          </form>
        </SensitivePanel>
      );
  }

  if (action === "supprimer") {
    const block = await deletionCheck(db, actorId, user.id);
    const reason = one(params.motif).trim().slice(0, 500);
    const second = one(params.etape) === "2" && reason.length >= 3;
    panel = (
      <SensitivePanel
        title={t("users.action.delete.text")}
        text={t("users.action.delete.confirm", { userName: user.name })}
        closeHref={ficheHref}
      >
        <p className="rounded-[14px] bg-creme px-3.5 py-2.5 text-[12.5px] leading-[18px]">
          {t("users.action.delete.intro")}
        </p>
        {block && block !== "notFound" ? (
          <Alert tone="warning" title={t(`users.block.${block}`)} />
        ) : !second ? (
          // Step 1: the reason, carried to step 2 in the address (the page is admin only).
          <form method="get" action="/admin/utilisateurs" className="flex flex-col gap-3.5">
            <p className="text-[12px] font-semibold text-ardoise">
              {t("users.action.delete.step1")}
            </p>
            {[...new URLSearchParams(ficheHref.split("?")[1] ?? "")].map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
            <input type="hidden" name="action" value="supprimer" />
            <input type="hidden" name="etape" value="2" />
            <ReasonField id="utilisateurs-delete-reason" name="motif" maxLength={500} />
            <div className="flex flex-wrap justify-end gap-2">
              {cancel}
              <Button type="submit" variant="secondary">
                {t("users.action.delete.continue")}
              </Button>
            </div>
          </form>
        ) : (
          <form action={deleteUserAction} className="flex flex-col gap-3.5">
            <p className="text-[12px] font-semibold text-ardoise">
              {t("users.action.delete.step2")}
            </p>
            {hidden}
            <input type="hidden" name="reason" value={reason} />
            <p className="rounded-[10px] bg-creme px-3 py-1.5 text-[12.5px] leading-[18px] break-words">
              {t("users.action.delete.reasonShown", { reason })}
            </p>
            <TextField
              id="utilisateurs-delete-email"
              name="confirmEmail"
              type="email"
              required
              autoComplete="off"
              label={t("users.action.delete.typeEmail", { email: user.email })}
            />
            <div className="flex flex-wrap justify-end gap-2">
              {cancel}
              <Button type="submit" variant="danger">
                {t("users.action.delete.submit")}
              </Button>
            </div>
          </form>
        )}
      </SensitivePanel>
    );
  }

  if (action === "effacer") {
    const block = await deletionCheck(db, actorId, user.id);
    panel = (
      <SensitivePanel
        title={t("users.action.erase.text")}
        text={t("users.action.erase.confirm", { userName: user.name })}
        closeHref={ficheHref}
      >
        <p className="rounded-[14px] bg-creme px-3.5 py-2.5 text-[12.5px] leading-[18px]">
          {t("users.action.erase.intro")}
        </p>
        {block === "self" || block === "lastAdmin" ? (
          <Alert tone="warning" title={t(`users.block.${block}`)} />
        ) : (
          <form action={eraseUserAction} className="flex flex-col gap-3.5">
            {hidden}
            <ReasonField
              id="utilisateurs-erase-reason"
              label={t("users.erase.justification")}
              rows={4}
              maxLength={500}
            />
            <TextField
              id="utilisateurs-erase-word"
              name="confirmWord"
              required
              autoComplete="off"
              placeholder={ERASE_WORD}
              label={t("users.action.erase.typeWord")}
            />
            <div className="flex flex-wrap justify-end gap-2">
              {cancel}
              <Button type="submit" variant="danger">
                {t("users.action.erase.submit")}
              </Button>
            </div>
          </form>
        )}
      </SensitivePanel>
    );
  }

  if (!panel) return null;
  return (
    <div id="utilisateurs-panneau" className="flex scroll-mt-6 flex-col gap-2">
      <SectionRule>{t("sensitive.label")}</SectionRule>
      {panel}
    </div>
  );
}
