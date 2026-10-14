import Link from "next/link";
import { useTranslations } from "next-intl";
import { Alert, PlanLock } from "@/components/ui";

export type AiGateState = "ready" | "consent" | "entitlement" | "quota" | "unavailable";

/**
 * What stops an AI feature of Career (E10): the plan lock, the AI consent or the monthly credits.
 * `outcome` is the result of the last attempt (`?ia=` after a redirect).
 */
export function AiGateNotice({
  state,
  plan,
  lockText,
  resetsAt,
  outcome,
}: {
  state: AiGateState;
  plan: string;
  lockText?: string;
  resetsAt: Date | null;
  outcome?: string;
}) {
  const t = useTranslations("ai");
  if (state === "entitlement") return <PlanLock plan={plan} description={lockText} />;
  return (
    <>
      {outcome === "unavailable" && <Alert tone="error" title={t("card.error")} />}
      {state === "consent" && (
        <Alert title={t("consent.declined.state")}>
          <Link href="/app/parametres?onglet=confidentialite" className="font-medium underline">
            {t("consent.declined.cta")}
          </Link>
        </Alert>
      )}
      {state === "quota" && (
        <Alert tone="warning" title={t("credits.reached.title")}>
          {resetsAt ? t("credits.reached.body", { date: resetsAt }) : null}
        </Alert>
      )}
    </>
  );
}
