import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { ButtonLink, Card, CardText, EmptyState, ProgressRing } from "@/components/ui";

/** Temporary dashboard, to show the signed-in layout. The real one comes with step E3. */
export default function DashboardPage() {
  const t = useTranslations();
  const percent = 0;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="tracking-wide text-feuille uppercase text-label">
          {t("talent.dashboard.title")}
        </p>
        <h1 className="mt-1 text-[28px] leading-9 font-semibold md:text-h1">
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
          icon={<Sparkles aria-hidden className="size-6" />}
          title={t("foundation.emptyTitle")}
          description={t("foundation.emptyText")}
          action={
            <ButtonLink href="/dev/composants" variant="outline" size="sm">
              {t("foundation.seeComponents")}
            </ButtonLink>
          }
        />
      </div>
    </div>
  );
}
