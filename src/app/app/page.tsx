import { useTranslations } from "next-intl";
import { ButtonLink, Card, CardText, EmptyState, ProgressRing } from "@/components/ui";

/** Temporary dashboard, to show the signed-in layout. The real one comes with step E3. */
export default function DashboardPage() {
  const t = useTranslations();
  const percent = 0;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-eyebrow text-ardoise">{t("talent.dashboard.title")}</p>
        <h1 className="mt-1 text-h1">
          {t("talent.dashboard.greeting.neutral", { firstName: t("foundation.sampleFirstName") })}
        </h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex items-center gap-5">
          <ProgressRing value={percent} label={t("a11y.progress", { percent })} size={88} />
          <div className="flex flex-col items-start gap-3">
            <CardText className="mt-0">{t("talent.dashboard.nextStep.completeProfile")}</CardText>
            <ButtonLink href="/app/profil" size="sm">
              {t("talent.dashboard.nextStep.cta")}
            </ButtonLink>
          </div>
        </Card>
        <EmptyState
          title={t("foundation.emptyTitle")}
          description={t("foundation.emptyText")}
          action={
            <ButtonLink href="/dev/composants" variant="tertiary" size="sm">
              {t("foundation.seeComponents")}
            </ButtonLink>
          }
        />
      </div>
    </div>
  );
}
