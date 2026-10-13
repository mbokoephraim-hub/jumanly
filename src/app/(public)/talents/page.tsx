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
  const t = await getTranslations("talents.seo");
  const from = lowestPaidPrice(await getPublicPlans(), "talent");
  return pageMetadata({
    path: "/talents",
    title: t("title"),
    description: t("description", { price: from === null ? "" : formatUsd(from) }),
  });
}

export default async function TalentsPage() {
  const t = await getTranslations("talents");
  const plans = await getPublicPlans();
  return (
    <>
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        text={t("hero.text")}
        badge={<Badge tone="lime">{t("hero.badge")}</Badge>}
        actions={
          <>
            <ButtonLink href={signupHref({ profil: "talent" })} size="lg">
              {t("hero.cta")}
            </ButtonLink>
            <ButtonLink href="/tarifs#talents" variant="tertiary" size="lg">
              {t("hero.secondary")}
            </ButtonLink>
          </>
        }
        aside={<Character name="amani" pose="joie" height={340} />}
      />
      <Section title={t("intro.title")} subtitle={t("intro.text")} tone="blanc">
        <FeatureGrid
          columns={4}
          tone="creme"
          items={(
            [
              ["learn", "learn"],
              ["career", "career"],
              ["jobs", "jobs"],
              ["connect", "connect"],
            ] as const
          ).map(([key, icon]) => ({
            icon,
            label: t(`${key}.label`),
            title: t(`${key}.title`),
            text: t(`${key}.text`),
          }))}
        />
      </Section>
      <Section>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-card bg-blanc p-6">
            <h2 className="text-h2">{t("guarantees.title")}</h2>
            <CheckList
              items={(["item1", "item2", "item3", "item4"] as const).map((key) =>
                t(`guarantees.${key}`),
              )}
            />
          </div>
          <div className="flex flex-col gap-3 rounded-card bg-sapin p-6 text-blanc">
            <h2 className="text-h2">{t("privacy.title")}</h2>
            <p className="text-[15px] leading-7 text-blanc/85">{t("privacy.text")}</p>
          </div>
        </div>
      </Section>
      <Section title={t("plans.title")} subtitle={t("plans.text")} tone="blanc">
        <FamilyPlans plans={plans} family="talent" />
        <div>
          <ButtonLink href="/tarifs#talents" variant="secondary">
            {t("plans.cta")}
          </ButtonLink>
        </div>
        <Band
          title={t("partners.title")}
          text={t("partners.text")}
          action={
            <ButtonLink href="/activer" variant="secondary">
              {t("partners.cta")}
            </ButtonLink>
          }
        />
      </Section>
      <CtaBand
        title={t("finalCta.title")}
        text={t("finalCta.text")}
        actions={
          <ButtonLink href={signupHref({ profil: "talent" })} size="lg">
            {t("finalCta.primary")}
          </ButtonLink>
        }
      />
    </>
  );
}
