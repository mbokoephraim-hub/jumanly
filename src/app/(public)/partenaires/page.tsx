import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { PartnerForm } from "@/components/site/partner-form";
import { Band, CheckList, FeatureGrid, PageHero, Section, Steps } from "@/components/site/sections";
import { ButtonLink } from "@/components/ui";
import { countryOptions } from "@/config/countries";
import { pickMessages } from "@/i18n/client-messages";
import { withoutPlaceholders } from "@/lib/placeholders";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("partners.seo");
  return pageMetadata({ path: "/partenaires", title: t("title"), description: t("description") });
}

export default async function PartnersPage() {
  const t = await getTranslations("partners");
  const messages = await getMessages();
  const references = withoutPlaceholders(t("references.content"));
  return (
    <>
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        text={t("hero.text")}
        actions={
          <ButtonLink href={`#${t("contact.anchor")}`} size="lg">
            {t("hero.cta")}
          </ButtonLink>
        }
        aside={<Character name="fatou" pose="salut" height={320} />}
      />
      <Section title={t("who.title")} tone="blanc">
        <FeatureGrid
          tone="creme"
          items={(
            [
              ["banks", "portefeuille"],
              ["universities", "diplome"],
              ["companies", "entreprise"],
              ["international", "langue"],
              ["foundations", "etoile"],
              ["public", "equipe"],
            ] as const
          ).map(([key, icon]) => ({
            icon,
            title: t(`who.${key}.title`),
            text: t(`who.${key}.text`),
          }))}
        />
      </Section>
      <Section title={t("how.title")}>
        <Steps
          items={(["step1", "step2", "step3", "step4"] as const).map((step, index) => ({
            number: String(index + 1),
            title: t(`how.${step}.title`),
            text: t(`how.${step}.text`),
          }))}
        />
      </Section>
      <Section tone="blanc">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-card bg-lime p-6 text-sapin">
            <h2 className="text-h2">{t("example.title")}</h2>
            <p>{t("example.text")}</p>
            <p className="text-xl font-semibold" aria-label={t("example.formulaAlt")}>
              {t("example.formula")}
            </p>
            <p className="text-caption">{t("example.note")}</p>
          </div>
          <div className="flex flex-col gap-4 rounded-card bg-creme p-6">
            <h2 className="text-h2">{t("privacy.title")}</h2>
            <p className="text-[15px] leading-7 text-ardoise">{t("privacy.text")}</p>
            <CheckList
              items={(["point1", "point2", "point3", "point4"] as const).map((key) =>
                t(`privacy.${key}`),
              )}
            />
          </div>
        </div>
        {references && (
          <div className="flex flex-col gap-3">
            <h2 className="text-h2">{t("references.title")}</h2>
            <p>{references}</p>
          </div>
        )}
      </Section>
      <section id={t("contact.anchor")} className="scroll-mt-20 bg-sapin text-blanc">
        <div className="mx-auto grid max-w-7xl gap-8 page-x py-12 md:py-16 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-4">
            <h2 className="text-h1">{t("contact.title")}</h2>
            <p className="text-lg leading-8 text-blanc/85">{t("contact.text")}</p>
          </div>
          <NextIntlClientProvider
            messages={pickMessages(messages, ["partners", "contact", "common"])}
          >
            <PartnerForm countries={countryOptions()} />
          </NextIntlClientProvider>
        </div>
      </section>
      <Section>
        <Band
          title={t("beneficiary.title")}
          text={t("beneficiary.text")}
          action={
            <ButtonLink href="/activer" variant="secondary">
              {t("beneficiary.cta")}
            </ButtonLink>
          }
        />
      </Section>
    </>
  );
}
