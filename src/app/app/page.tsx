import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { ButtonLink, Card, CardText, CardTitle, EmptyState, ProgressRing } from "@/components/ui";

/** Temporary dashboard, to show the signed-in layout. */
export default function DashboardPage() {
  const t = useTranslations("app.dashboard");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="tracking-wide text-feuille uppercase text-label">{t("eyebrow")}</p>
        <h1 className="mt-1 text-[28px] leading-9 font-semibold md:text-h1">{t("title")}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex items-center gap-5">
          <ProgressRing value={0} label={t("profileLabel")} size={88} />
          <div>
            <CardTitle>{t("profileTitle")}</CardTitle>
            <CardText>{t("profileText")}</CardText>
          </div>
        </Card>
        <EmptyState
          icon={<Sparkles aria-hidden className="size-6" />}
          title={t("emptyTitle")}
          description={t("emptyText")}
          action={
            <ButtonLink href="/dev/composants" variant="outline" size="sm">
              {t("seeComponents")}
            </ButtonLink>
          }
        />
      </div>
    </div>
  );
}
