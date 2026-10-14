import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Badge, ButtonLink, Card, CardText, CardTitle } from "@/components/ui";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.home");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/** Career home (partie 07 § 4): the modules built so far, the others announced without promise of date. */
export default async function CareerPage() {
  const user = await requireUser("/app/career");
  const t = await getTranslations("career.home");
  const lastDiagnostic = await db.careerDiagnostic.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
  const later = ["documents", "linkedin", "interviews", "plan", "portfolio", "tips"] as const;
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-eyebrow text-ardoise">{t("eyebrow")}</p>
        <h1 className="text-h1">{t("title")}</h1>
        <p className="text-ardoise">{t("subtitle")}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Card tone="career" className="flex flex-col items-start gap-3">
          <CardTitle>{t("diagnostic.title")}</CardTitle>
          <CardText>{t("diagnostic.desc")}</CardText>
          {lastDiagnostic && (
            <p className="text-sm">
              {t("diagnostic.lastDone", { date: lastDiagnostic.createdAt })}
            </p>
          )}
          <ButtonLink
            href={
              lastDiagnostic
                ? `/app/career/diagnostic?bilan=${lastDiagnostic.id}`
                : "/app/career/diagnostic"
            }
            size="sm"
          >
            {lastDiagnostic ? t("diagnostic.cta.view") : t("diagnostic.cta.start")}
          </ButtonLink>
        </Card>
        <Card tone="career" className="flex flex-col items-start gap-3">
          <CardTitle>{t("cv.title")}</CardTitle>
          <CardText>{t("cv.desc")}</CardText>
          <ButtonLink href="/app/career/cv" size="sm">
            {t("cv.cta")}
          </ButtonLink>
        </Card>
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {later.map((key) => (
          <li key={key}>
            <Card className="flex h-full flex-col items-start gap-2">
              <Badge tone="neutral">{t("later")}</Badge>
              <CardTitle>{t(`${key}.title`)}</CardTitle>
              <CardText className="text-ardoise">{t(`${key}.desc`)}</CardText>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
