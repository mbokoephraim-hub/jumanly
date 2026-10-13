import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { CtaBand, FeatureGrid, PageHero, Section } from "@/components/site/sections";
import { ButtonLink } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about.seo");
  return pageMetadata({ path: "/a-propos", title: t("title"), description: t("description") });
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  return (
    <>
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        text={t("hero.text")}
        aside={<Character name="diallo" pose="salut" height={320} />}
      />
      <Section tone="blanc">
        <FeatureGrid
          columns={2}
          tone="creme"
          items={[
            { icon: "objectif", title: t("vision.title"), text: t("vision.text") },
            { icon: "etoile", title: t("mission.title"), text: t("mission.text") },
          ]}
        />
      </Section>
      <Section title={t("positioning.title")} subtitle={t("positioning.intro")}>
        <FeatureGrid
          items={[
            {
              icon: "learn",
              title: t("positioning.edtech.title"),
              text: t("positioning.edtech.text"),
            },
            {
              icon: "career",
              title: t("positioning.careertech.title"),
              text: t("positioning.careertech.text"),
            },
            {
              icon: "hire",
              title: t("positioning.hrtech.title"),
              text: t("positioning.hrtech.text"),
            },
          ]}
        />
        <div className="flex flex-col gap-3 rounded-card bg-sapin p-6 text-blanc md:p-8">
          <h3 className="text-h2">{t("continuity.title")}</h3>
          <p className="max-w-3xl text-[17px] leading-8 text-blanc/85">{t("continuity.text")}</p>
        </div>
      </Section>
      <Section title={t("values.title")} tone="blanc">
        <FeatureGrid
          tone="creme"
          items={(
            [
              ["access", "valider"],
              ["fairness", "equipe"],
              ["transparency", "transparence"],
              ["humanDecision", "profil"],
              ["privacy", "confidentialite"],
            ] as const
          ).map(([key, icon]) => ({
            icon,
            title: t(`values.${key}.title`),
            text: t(`values.${key}.text`),
          }))}
        />
      </Section>
      <Section>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-card bg-blanc p-6">
            <h2 className="text-h2">{t("growthlab.title")}</h2>
            <p className="text-[15px] leading-7 text-ardoise">{t("growthlab.text")}</p>
            <p className="font-semibold">{t("growthlab.signature")}</p>
          </div>
          <div className="flex flex-col gap-3 rounded-card bg-blanc p-6">
            <h2 className="text-h2">{t("launch.title")}</h2>
            <p className="text-[15px] leading-7 text-ardoise">{t("launch.text")}</p>
          </div>
        </div>
      </Section>
      <CtaBand
        title={t("cta.title")}
        actions={
          <>
            <ButtonLink href={signupHref()} size="lg">
              {t("cta.primary")}
            </ButtonLink>
            <ButtonLink href="/contact" size="lg" variant="inverse">
              {t("cta.secondary")}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
