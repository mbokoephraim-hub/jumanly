import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  IconTile,
  MarketingSection,
  NumberDisc,
  PathLine,
  SectionHead,
  SiteButton,
  SiteHero,
  stagger,
} from "@/components/site/marketing";
import { CountUp, MotionRoot } from "@/components/site/motion";
import { PartnerForm } from "@/components/site/partner-form";
import { countryOptions } from "@/config/countries";
import { pickMessages } from "@/i18n/client-messages";
import { cx } from "@/lib/cx";
import { withoutPlaceholders } from "@/lib/placeholders";
import { pageMetadata } from "@/lib/seo";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/partenaires">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("partners.seo");
  return pageMetadata({ path: "/partenaires", title: t("title"), description: t("description") });
}

/** Institutions (mockup 01-06): tiles alternate Lime, Néon and Menthe claire. */
const institutions = [
  { key: "banks", icon: "portefeuille", tile: "bg-lime" },
  { key: "universities", icon: "diplome", tile: "bg-neon" },
  { key: "companies", icon: "entreprise", tile: "bg-menthe-claire" },
  { key: "international", icon: "langue", tile: "bg-lime" },
  { key: "foundations", icon: "favori", tile: "bg-neon" },
  { key: "public", icon: "equipe", tile: "bg-menthe-claire" },
] as const satisfies { key: string; icon: IconName; tile: string }[];

const steps = [
  { key: "step1", icon: "objectif" },
  { key: "step2", icon: "doc" },
  { key: "step3", icon: "lien" },
  { key: "step4", icon: "statistiques" },
] as const satisfies { key: string; icon: IconName }[];

const privacyPoints = [
  { key: "point1", icon: "statistiques" },
  { key: "point2", icon: "lock" },
  { key: "point3", icon: "confidentialite" },
  { key: "point4", icon: "telecharger" },
] as const satisfies { key: string; icon: IconName }[];

export default async function PartnersPage({ params }: PageProps<"/[locale]/partenaires">) {
  await applySiteLocale(params);
  const t = await getTranslations();
  const messages = await getMessages();
  const references = withoutPlaceholders(t("partners.references.content"));
  const anchor = t("partners.contact.anchor");

  return (
    <>
      <MotionRoot />

      <SiteHero
        eyebrow={t("partners.hero.eyebrow")}
        title={t("partners.hero.title")}
        text={t("partners.hero.text")}
        actions={
          <SiteButton href={`#${anchor}`} icon="message">
            {t("partners.hero.cta")}
          </SiteButton>
        }
        visual={<HeroVisual />}
      />

      {/* Institutions */}
      <MarketingSection innerClassName="flex flex-col gap-10">
        <div data-reveal>
          <SectionHead center eyebrow={t("partners.who.eyebrow")} title={t("partners.who.title")} />
        </div>
        <ul className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {institutions.map((item, index) => (
            <li
              key={item.key}
              data-reveal
              className="jm-lift flex items-start gap-[18px] rounded-[28px] bg-blanc p-6 lg:p-7"
              style={stagger(index % 3)}
            >
              <IconTile icon={item.icon} className={cx(item.tile, "text-sapin")} />
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[17px] leading-[23px] font-semibold">
                  {t(`partners.who.${item.key}.title`)}
                </h3>
                <p className="text-[14.5px] leading-[22px] text-ardoise">
                  {t(`partners.who.${item.key}.text`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {/* How it works: the line draws itself from one step to the next */}
      <MarketingSection tone="sapin" scene innerClassName="flex flex-col gap-12">
        <div data-reveal>
          <SectionHead
            center
            dark
            eyebrow={t("partners.how.eyebrow")}
            title={t("partners.how.title")}
          />
        </div>
        <ol data-reveal className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <li
            aria-hidden
            className="pointer-events-none absolute top-[21px] right-[120px] left-11 hidden h-0.5 lg:block"
          >
            <PathLine id="partners-path" vertical={false} />
          </li>
          {steps.map((step, index) => (
            <li key={step.key} className="relative z-1 flex flex-col gap-3.5">
              <div className="flex items-center gap-3">
                <span className="jm-glow flex rounded-full" style={stagger(index)}>
                  <NumberDisc className={cx("text-sapin", index === 3 ? "bg-neon" : "bg-lime")}>
                    {index + 1}
                  </NumberDisc>
                </span>
                <IconTile icon={step.icon} size={44} className="bg-blanc/8 text-lime" />
              </div>
              <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em]">
                {t(`partners.how.${step.key}.title`)}
              </h3>
              <p className="text-[15px] leading-[23px] text-blanc/70">
                {t(`partners.how.${step.key}.text`)}
              </p>
            </li>
          ))}
        </ol>
      </MarketingSection>

      {/* A concrete example, on Lime */}
      <section data-scene className="bg-papier pt-14 lg:pt-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 xl:px-0">
          <div
            data-reveal
            className="relative flex flex-col gap-6 overflow-hidden rounded-[32px] bg-lime-clair px-6 py-8 text-sapin lg:rounded-[48px] lg:px-16 lg:py-14"
          >
            <div className="relative flex flex-col gap-2.5">
              <p className="text-[13px] leading-[18px] font-medium tracking-[0.12em] uppercase">
                {t("partners.example.title")}
              </p>
              <h2 className="max-w-[820px] text-[28px] leading-[34px] font-semibold tracking-[-0.025em] lg:text-[36px] lg:leading-[42px]">
                {t("partners.example.text")}
              </h2>
            </div>
            <p
              role="img"
              aria-label={t("partners.example.formulaAlt")}
              className="relative flex flex-wrap items-center gap-3 lg:gap-4"
            >
              <FormulaBox
                value={t("partners.example.beneficiaries.value")}
                unit={t("partners.example.beneficiaries.unit")}
              />
              <Operator sign="×" />
              <FormulaBox value={t("partners.example.price.value")} />
              <Operator sign="×" />
              <FormulaBox
                value={t("partners.example.months.value")}
                unit={t("partners.example.months.unit")}
              />
              <Operator sign="=" />
              <span className="jm-pop flex flex-col items-center rounded-[22px] bg-sapin px-7 py-[18px] text-lime shadow-[0_0_32px_rgba(15,63,55,0.35)]">
                <span className="text-[32px] leading-[40px] font-semibold tracking-[-0.03em] lg:text-[40px] lg:leading-[44px]">
                  <CountUp text={t("partners.example.total.value")} />
                </span>
              </span>
            </p>
            <p className="relative max-w-[860px] text-[13.5px] leading-[21px] opacity-85">
              {t("partners.example.note")}
            </p>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <MarketingSection
        className="pt-14 lg:pt-24"
        innerClassName="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-20"
      >
        <div data-reveal className="flex flex-col gap-5 lg:flex-1">
          <SectionHead
            eyebrow={t("partners.privacy.eyebrow")}
            title={t("partners.privacy.title")}
            text={t("partners.privacy.text")}
          />
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:w-[560px] lg:shrink-0">
          {privacyPoints.map((point, index) => (
            <li
              key={point.key}
              data-reveal
              className="jm-lift flex items-center gap-3 rounded-[22px] bg-blanc px-4 py-3.5"
              style={stagger(index)}
            >
              <IconTile icon={point.icon} size={44} className="bg-blanc text-sapin" />
              <span className="text-[14.5px] font-medium">
                {t(`partners.privacy.${point.key}`)}
              </span>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {references && (
        <MarketingSection className="pt-0 lg:pt-0">
          <SectionHead title={t("partners.references.title")} text={references} />
        </MarketingSection>
      )}

      {/* Contact form */}
      <MarketingSection
        id={anchor}
        className="scroll-mt-20"
        innerClassName="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16"
      >
        <div data-reveal className="flex flex-col gap-5 lg:w-[400px] lg:shrink-0">
          <SectionHead
            eyebrow={t("partners.contact.eyebrow")}
            title={t("partners.contact.title")}
            text={t("partners.contact.text")}
          />
          <a
            href={`mailto:${t("contact.emails.pro.value")}`}
            className="inline-flex items-center gap-2.5 self-start rounded-[16px] bg-blanc px-4 py-3.5 font-semibold hover:underline"
          >
            <Icon name="message" className="size-5" />
            {t("contact.emails.pro.value")}
          </a>
        </div>
        <div data-reveal="zoom" className="min-w-0 lg:flex-1" style={stagger(1)}>
          <NextIntlClientProvider
            messages={pickMessages(messages, ["partners", "contact", "common"])}
          >
            <PartnerForm countries={countryOptions()} />
          </NextIntlClientProvider>
        </div>
      </MarketingSection>

      {/* Licence code */}
      <section className="bg-papier pb-14 lg:pb-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 xl:px-0">
          <div
            data-reveal
            className="jm-lift relative flex flex-col items-start gap-5 overflow-hidden rounded-[32px] bg-nuit px-6 py-7 text-blanc lg:flex-row lg:items-center lg:px-9"
          >
            <span className="jm-float relative">
              <IconTile icon="certificat" size={56} className="bg-lime text-sapin" />
            </span>
            <div className="relative flex flex-1 flex-col gap-1">
              <h2 className="text-[21px] leading-[28px] font-semibold tracking-[-0.015em]">
                {t("partners.beneficiary.title")}
              </h2>
              <p className="text-[15px] leading-6 text-blanc/75">
                {t("partners.beneficiary.text")}
              </p>
            </div>
            <SiteButton href="/activer" tone="lime" className="relative">
              {t("partners.beneficiary.cta")}
            </SiteButton>
          </div>
        </div>
      </section>
    </>
  );
}

function FormulaBox({ value, unit }: { value: string; unit?: string }) {
  return (
    <span className="jm-pop flex min-w-[96px] flex-col items-center rounded-[22px] bg-blanc px-5 py-4 lg:px-6 lg:py-[18px]">
      <span className="text-[32px] leading-[40px] font-semibold tracking-[-0.03em] lg:text-[40px] lg:leading-[44px]">
        {value}
      </span>
      {unit && <span className="text-xs leading-[17px] text-ardoise">{unit}</span>}
    </span>
  );
}

function Operator({ sign }: { sign: string }) {
  return (
    <span aria-hidden className="text-[28px] font-semibold opacity-60 lg:text-[34px]">
      {sign}
    </span>
  );
}

/**
 * Hero visual (mockup 01-06): a partner's aggregated dashboard on a Sapin panel, with Fatou.
 * Fictional figures, part of the illustration described by its alternative text.
 */
async function HeroVisual() {
  const t = await getTranslations("partners.hero");
  const stats = [
    { key: "licenses", icon: "certificat", tile: "bg-lime" },
    { key: "courses", icon: "learn", tile: "bg-neon" },
    { key: "certificates", icon: "diplome", tile: "bg-menthe-claire" },
    { key: "applications", icon: "jobs", tile: "bg-brume" },
  ] as const satisfies { key: string; icon: IconName; tile: string }[];
  const months = t("visual.chart.months").split(",");
  const bars = [30, 46, 58, 64, 78, 92];

  const dashboard = (
    <div className="flex flex-col gap-3.5 rounded-box bg-blanc p-4 text-sapin shadow-[0_30px_60px_rgba(0,0,0,0.3)] lg:p-[22px]">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-ia text-xs font-bold text-[#0b1a1f]">
            {t("visual.orgInitials")}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold">{t("visual.orgName")}</span>
            <span className="text-[11px] leading-[15px] text-ardoise">{t("visual.program")}</span>
          </span>
        </span>
        <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-pill bg-brume px-2.5 text-[11px] font-semibold">
          <Icon name="lock" className="size-3" />
          {t("visual.aggregated")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((stat) => (
          <div key={stat.key} className="flex flex-col gap-1.5 rounded-[16px] bg-creme p-3.5">
            <span
              className={cx(
                "flex size-8 items-center justify-center rounded-[10px] text-sapin",
                stat.tile,
              )}
            >
              <Icon name={stat.icon} className="size-4" />
            </span>
            <span className="text-[11px] leading-[15px] text-ardoise">
              {t(`visual.${stat.key}.label`)}
            </span>
            <span className="text-xl font-semibold tracking-[-0.02em]">
              <CountUp text={t(`visual.${stat.key}.value`)} />
            </span>
          </div>
        ))}
      </div>
      <div className="hidden flex-col gap-2 sm:flex">
        <span className="text-[11px] leading-[15px] font-semibold">{t("visual.chart.title")}</span>
        <div className="flex h-[110px] items-end gap-2">
          {bars.map((height, index) => (
            <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <i
                className={cx(
                  "jm-grow block w-full rounded-t-[8px] rounded-b-[4px]",
                  index === bars.length - 1 ? "bg-lime" : "bg-brume",
                )}
                style={{ height: `${height}%`, animationDelay: `${1 + index * 0.12}s` }}
              />
              <span className="text-[11px] leading-[15px] text-ardoise">
                {months[index]?.trim()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      role="img"
      aria-label={t("imageAlt")}
      className="relative h-[420px] min-w-0 overflow-hidden rounded-[32px] bg-sapin sm:h-[560px] xl:h-[600px] xl:rounded-[40px]"
    >
      <div className="jm-float-slow absolute top-6 left-4 w-[calc(100%-32px)] max-w-[470px] sm:top-[60px] sm:left-10">
        {dashboard}
      </div>
    </div>
  );
}
