import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";

const codes = ["consent", "entitlement", "quota", "unavailable"] as const;
export type OrbiLimitCode = (typeof codes)[number];

export function orbiLimitCode(value: unknown): OrbiLimitCode | null {
  return codes.includes(value as OrbiLimitCode) ? (value as OrbiLimitCode) : null;
}

/**
 * Why Orbi did not help (consent, plan, credits, model away), with the way out: never a dead end,
 * and nothing was spent (src/server/ai releases the credits).
 */
export async function OrbiLimit({ code, plan }: { code: OrbiLimitCode; plan?: string | null }) {
  const t = await getTranslations("docs.ai");
  return (
    <p role="status" className="t-gar t-err">
      <TalentIcon name="aide" size="s" />
      <span>
        {code === "entitlement" && plan ? t("entitlementPlan", { plan }) : t(`error.${code}`)}{" "}
        {code !== "unavailable" && (
          <Link
            className="t-lien-d"
            href={code === "consent" ? "/app/parametres#confidentialite" : "/app/abonnement"}
          >
            {code === "consent" ? t("cta.consent") : t("cta.plans")}
          </Link>
        )}
      </span>
    </p>
  );
}
