import { getTranslations } from "next-intl/server";
import { Alert, Badge, Button, ButtonLink } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { outcomeConsentAction } from "@/server/actions/partners";
import type { myLicenses } from "@/server/services/partners";

type License = Awaited<ReturnType<typeof myLicenses>>[number];

const DAY_MS = 86_400_000;

/**
 * A licence offered by an institution (textes `sponsored.*`): what it gives, until when, what the
 * sponsor sees, and the optional consent to count a declared hiring in its reports.
 */
export async function SponsoredCard({
  license,
  currentPlan,
  now,
}: {
  license: License;
  currentPlan: string;
  now: Date;
}) {
  const t = await getTranslations("sponsored");
  const values = {
    sponsorName: license.sponsorName,
    plan: license.planName,
    startDate: formatDate(license.startDate),
    endDate: formatDate(license.endDate),
  };
  const days = Math.max(0, Math.ceil((license.endDate.getTime() - now.getTime()) / DAY_MS));
  const consentForm = (
    <form action={outcomeConsentAction} className="flex flex-wrap gap-2">
      <input type="hidden" name="licenseId" value={license.id} />
      <Button type="submit" name="answer" value="accept" size="sm">
        {t("consent.accept")}
      </Button>
      <Button type="submit" name="answer" value="decline" size="sm" variant="secondary">
        {t("consent.decline")}
      </Button>
    </form>
  );

  return (
    <section
      id={`licence-${license.id}`}
      aria-labelledby={`licence-title-${license.id}`}
      className="flex flex-col gap-3 rounded-card bg-blanc p-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id={`licence-title-${license.id}`} className="text-h2">
          {license.pending ? t("pending.title") : t("card.title", values)}
        </h2>
        <Badge tone="lime">{t("card.plan", values)}</Badge>
      </div>
      {license.pending ? (
        <p>{t("pending.text", { ...values, currentPlan })}</p>
      ) : (
        <>
          <p>{t("card.period", values)}</p>
          <p className="font-medium">{t("card.daysLeft", { days })}</p>
          <p className="text-feuille-fonce">{t("card.free")}</p>
          {days <= 14 && (
            <Alert
              tone="warning"
              title={t("ending.banner", values)}
              action={
                <ButtonLink href="/tarifs" size="sm" variant="secondary">
                  {t("ending.cta")}
                </ButtonLink>
              }
            />
          )}
        </>
      )}
      <p className="text-sm text-ardoise">{t("card.privacy", values)}</p>

      <div className="flex flex-col gap-2 rounded-md bg-creme p-4">
        <h3 className="font-semibold">{t("consent.title", values)}</h3>
        <p className="text-sm">
          {t("consent.text", {
            sponsorName: license.sponsorName,
            dataDescription: t("consent.dataDescription"),
            purpose: t("consent.purpose"),
          })}
        </p>
        {license.consentAsked ? (
          <details>
            <summary className="cursor-pointer text-sm font-medium">
              {license.consented ? t("consent.status.accepted") : t("consent.status.declined")}{" "}
              <span className="underline">{t("consent.change")}</span>
            </summary>
            <div className="pt-2">{consentForm}</div>
          </details>
        ) : (
          consentForm
        )}
        <p className="text-sm text-ardoise">{t("consent.withdraw")}</p>
      </div>
    </section>
  );
}
