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
  const t = await getTranslations("companies.seo");
  const from = lowestPaidPrice(await getPublicPlans(), "company");
  return pageMetadata({
    path: "/entreprises",
    title: t("title"),
    description: t("description", { price: from === null ? "" : formatUsd(from) }),
  });
}

export default async function CompaniesPage() {
  const t = await getTranslations("companies");
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
            <ButtonLink href={signupHref({ profil: "company" })} size="lg">
              {t("hero.cta")}
            </ButtonLink>
            <ButtonLink href="/contact?sujet=devis" variant="tertiary" size="lg">
              {t("hero.secondary")}
            </ButtonLink>
          </>
        }
        aside={<Character name="diallo" pose="montre" height={340} />}
      />
      <Section title={t("benefits.title")} subtitle={t("intro.text")} tone="blanc">
        <FeatureGrid
          columns={4}
          tone="creme"
          items={(
            [
              ["verified", "valider"],
              ["teams", "equipe"],
              ["ats", "hire"],
              ["reports", "statistiques"],
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
          <div className="flex flex-col gap-3 rounded-card bg-sapin p-6 text-blanc">
            <h2 className="text-h2">{t("roles.title")}</h2>
            <p className="text-[15px] leading-7 text-blanc/85">{t("roles.text")}</p>
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
        <FamilyPlans plans={plans} family="company" />
        <div>
          <ButtonLink href="/tarifs#companies" variant="secondary">
            {t("plans.cta")}
          </ButtonLink>
        </div>
        <Band
          title={t("quote.title")}
          text={t("quote.text")}
          action={
            <ButtonLink href="/contact?sujet=devis" variant="secondary">
              {t("quote.cta")}
            </ButtonLink>
          }
        />
        <Band
          tone="blanc"
          title={t("partners.title")}
          text={t("partners.text")}
          action={
            <ButtonLink href="/partenaires" variant="tertiary">
              {t("partners.cta")}
            </ButtonLink>
          }
        />
      </Section>
      <CtaBand
        title={t("finalCta.title")}
        text={t("finalCta.text")}
        actions={
          <>
            <ButtonLink href={signupHref({ profil: "company" })} size="lg">
              {t("finalCta.primary")}
            </ButtonLink>
            <ButtonLink href="/contact?sujet=devis" size="lg" variant="inverse">
              {t("finalCta.secondary")}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
