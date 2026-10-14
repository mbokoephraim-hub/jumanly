import Link from "next/link";
import { useTranslations } from "next-intl";
import { Alert, Badge, Button, Checkbox, RadioGroup, TextArea } from "@/components/ui";
import { disputeAction } from "@/server/actions/matching";
import { disputeReasons } from "@/server/matching/service";

/** Business days announced to the talent for the human review (decision E6, to confirm). */
export const DISPUTE_REPLY_DAYS = 5;

const statusKey = {
  open: "open",
  in_review: "inReview",
  corrected: "corrected",
  confirmed: "confirmed",
} as const;

/**
 * « Le score vous semble faux ? » (§ 8.1 rule 5): the talent asks for a human review. The last
 * request and its outcome are shown in place of the form while it is pending.
 */
export function DisputePanel({
  jobSlug,
  company,
  hasApplication,
  outcome,
  dispute,
}: {
  jobSlug: string;
  company: string;
  hasApplication: boolean;
  outcome?: string;
  dispute: {
    status: keyof typeof statusKey;
    scoreBefore: number;
    scoreAfter: number | null;
    resolution: string | null;
  } | null;
}) {
  const t = useTranslations();
  const pending = dispute && (dispute.status === "open" || dispute.status === "in_review");
  return (
    <section
      id="revision"
      aria-labelledby="revision-title"
      className="flex scroll-mt-24 flex-col gap-3 rounded-card bg-blanc p-6"
    >
      <h2 id="revision-title" className="font-semibold text-h3">
        {t("ai.dispute.title")}
      </h2>
      {outcome === "created" && (
        <Alert tone="success" title={t("ai.dispute.sent", { days: DISPUTE_REPLY_DAYS })}>
          {hasApplication ? t("ai.dispute.applicationUnaffected") : null}
        </Alert>
      )}
      {outcome === "already" && <Alert tone="info" title={t("ai.dispute.already")} />}
      {outcome === "invalide" && <Alert tone="error" title={t("ai.dispute.invalid")} />}
      {outcome === "noScore" && <Alert tone="error" title={t("ai.dispute.noScore")} />}
      {dispute && (
        <div className="flex flex-col gap-2 text-[15px]">
          <Badge tone={pending ? "warning" : "success"}>
            {t(`ai.dispute.status.${statusKey[dispute.status]}`)}
          </Badge>
          {dispute.status === "corrected" && dispute.scoreAfter !== null && (
            <p>
              {t("ai.dispute.result.corrected", {
                oldScore: dispute.scoreBefore,
                newScore: dispute.scoreAfter,
              })}
            </p>
          )}
          {dispute.status === "confirmed" && (
            <p>{t("ai.dispute.result.confirmed", { reason: dispute.resolution ?? "" })}</p>
          )}
        </div>
      )}
      {!pending && (
        <details open={outcome === "invalide"}>
          <summary className="cursor-pointer text-sm font-medium underline">
            {t("match.why.talent.reportError")}
          </summary>
          <form action={disputeAction} className="mt-4 flex flex-col gap-4">
            <input type="hidden" name="job" value={jobSlug} />
            <p className="text-sm">{t("ai.dispute.intro")}</p>
            <Alert tone="info" title={t("ai.dispute.fixFirst.text")}>
              <Link href="/app/profil" className="font-medium underline">
                {t("ai.dispute.fixFirst.cta")}
              </Link>
            </Alert>
            <RadioGroup
              legend={t("ai.dispute.what.text")}
              name="reason"
              required
              options={disputeReasons.map((reason) => ({
                value: reason,
                label: t(`ai.dispute.what.${reason}`),
              }))}
            />
            <TextArea
              id="dispute-details"
              name="details"
              label={t("ai.dispute.details.text")}
              placeholder={t("ai.dispute.details.placeholder", { company })}
              rows={4}
              minLength={10}
              maxLength={2000}
              required
            />
            {hasApplication && (
              <Checkbox
                id="dispute-notify"
                name="notifyRecruiter"
                value="on"
                label={t("ai.dispute.notifyRecruiter")}
              />
            )}
            <div>
              <Button type="submit" variant="secondary">
                {t("ai.dispute.humanReview")}
              </Button>
            </div>
            <p className="text-sm text-ardoise">{t("ai.dispute.contact")}</p>
          </form>
        </details>
      )}
    </section>
  );
}
