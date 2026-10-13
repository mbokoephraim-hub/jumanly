import { getTranslations } from "next-intl/server";
import { Alert, ButtonLink, Card, CardText, EmptyState, ProgressRing } from "@/components/ui";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { billingSubject } from "@/server/services/accounts";
import { readSignupFlow } from "@/server/signup-flow";

/** Temporary dashboard: the real one comes with step E3. */
export default async function DashboardPage() {
  const t = await getTranslations();
  const user = await requireUser("/app");
  const plan = await resolvePlan(db, { type: "user", id: user.id });
  // « Payer plus tard » at sign-up: remind the plan that was chosen (partie 06 § 6.2).
  const flow = await readSignupFlow();
  const chosen = flow.plan
    ? await db.plan.findUnique({
        where: { code: flow.plan },
        select: { name: true, code: true, priceCents: true, family: true },
      })
    : null;
  const payer = chosen?.priceCents ? await billingSubject(db, user.id, chosen.family) : null;
  const payerPlan = payer ? await resolvePlan(db, payer) : null;
  const showFinalize = chosen && payerPlan?.status === "free";
  const percent = 0;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-eyebrow text-ardoise">{t("talent.dashboard.title")}</p>
        <h1 className="mt-1 text-h1">
          {t("talent.dashboard.greeting.neutral", { firstName: user.firstName ?? user.name })}
        </h1>
      </div>
      {showFinalize && (
        <Alert
          tone="warning"
          title={t("billing.finalize.text", { plan: chosen.name, freePlan: payerPlan.planName })}
          action={
            <ButtonLink href={`/app/abonnement/payer?forfait=${chosen.code}`} size="sm">
              {t("billing.finalize.cta")}
            </ButtonLink>
          }
        />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex items-center gap-5">
          <ProgressRing value={percent} label={t("a11y.progress", { percent })} size={88} />
          <div className="flex flex-col items-start gap-3">
            <CardText className="mt-0">{t("talent.dashboard.nextStep.completeProfile")}</CardText>
            <ButtonLink href="/app/bienvenue" size="sm">
              {t("talent.dashboard.nextStep.cta")}
            </ButtonLink>
          </div>
        </Card>
        <EmptyState
          title={t("billing.current.title")}
          description={plan?.planName ?? ""}
          action={
            <ButtonLink href="/app/abonnement" variant="tertiary" size="sm">
              {t("account.menu.subscription")}
            </ButtonLink>
          }
        />
      </div>
    </div>
  );
}
