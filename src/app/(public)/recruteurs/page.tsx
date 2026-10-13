import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { FamilyPlans } from "@/components/site/pricing";
import {
  Band,
  CheckList,
  CtaBand,
  FeatureGrid,
  PageHero,
  Section,
} from "@/components/site/sections";
import { Badge, ButtonLink } from "@/components/ui";
import { formatUsd } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";
import { getPublicPlans } from "@/server/queries/public";
import { lowestPaidPrice } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("recruiters.seo");
  const from = lowestPaidPrice(await getPublicPlans(), "rh");
  return pageMetadata({
    path: "/recruteurs",
    title: t("title"),
    description: t("description", { price: from === null ? "" : formatUsd(from) }),
  });
}

export default async function RecruitersPage() {
  const t = await getTranslations("recruiters");
  const plans = await getPublicPlans();
  const companyFrom = lowestPaidPrice(plans, "company");
  return (
    <>
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        text={t("hero.text")}
        badge={<Badge tone="lime">{t("hero.badge")}</Badge>}
        actions={
          <>
            <ButtonLink href={signupHref({ profil: "rh" })} size="lg">
              {t("hero.cta")}
            </ButtonLink>
            <ButtonLink href="/tarifs#rh" variant="tertiary" size="lg">
              {t("hero.secondary")}
            </ButtonLink>
          </>
        }
        aside={<Character name="nadia" pose="montre" height={340} />}
      />
      <Section title={t("benefits.title")} subtitle={t("intro.text")} tone="blanc">
        <FeatureGrid
          columns={4}
          tone="creme"
          items={(
            [
              ["pipeline", "hire"],
              ["cv", "cv"],
              ["matching", "intelligence"],
              ["messaging", "message"],
            ] as const
          ).map(([key, icon]) => ({
            icon,
            title: t(`benefits.${key}.title`),
            text: t(`benefits.${key}.text`),
          }))}
        />
      </Section>
      <Section>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-card bg-gradient-ai p-6 text-blanc">
            <h2 className="text-h2">{t("matching.title")}</h2>
            <p className="text-[15px] leading-7">{t("matching.text")}</p>
            <CheckList
              items={(["point1", "point2", "point3"] as const).map((key) => t(`matching.${key}`))}
            />
          </div>
          <div className="flex flex-col gap-4 rounded-card bg-blanc p-6">
            <h2 className="text-h2">{t("guarantees.title")}</h2>
            <CheckList
              items={(["item1", "item2", "item3", "item4"] as const).map((key) =>
                t(`guarantees.${key}`),
              )}
            />
          </div>
        </div>
      </Section>
      <Section title={t("plans.title")} subtitle={t("plans.text")} tone="blanc">
        <FamilyPlans plans={plans} family="rh" />
        <div>
          <ButtonLink href="/tarifs#rh" variant="secondary">
            {t("plans.cta")}
          </ButtonLink>
        </div>
        <Band
          title={t("upsell.title")}
          text={t("upsell.text", { price: companyFrom === null ? "" : formatUsd(companyFrom) })}
          action={
            <ButtonLink href="/entreprises" variant="secondary">
              {t("upsell.cta")}
            </ButtonLink>
          }
        />
      </Section>
      <CtaBand
        title={t("finalCta.title")}
        text={t("finalCta.text")}
        actions={
          <ButtonLink href={signupHref({ profil: "rh" })} size="lg">
            {t("finalCta.primary")}
          </ButtonLink>
        }
      />
    </>
  );
}
