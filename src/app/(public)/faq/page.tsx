import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import { FaqSearch, FaqThemes } from "@/components/site/faq-search";
import {
  Eyebrow,
  Glow,
  IconTile,
  LimeCtaBand,
  MarketingSection,
  lead,
  stagger,
} from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { jsonLdScript, pageMetadata } from "@/lib/seo";
import { getContentOverrides } from "@/server/queries/public";
import { faqItems } from "@/server/services/contents";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("faq.seo");
  return pageMetadata({ path: "/faq", title: t("title"), description: t("description") });
}

/** Themes in the order of the texts, with the icon and tile color of mockup 01-07. */
const themes = [
  { theme: "general", icon: "accueil", tile: "bg-lime text-sapin" },
  { theme: "talents", icon: "profil", tile: "bg-neon text-sapin" },
  { theme: "learn", icon: "learn", tile: "bg-menthe-claire text-sapin" },
  { theme: "ai", icon: "intelligence", tile: "bg-gradient-ai text-lime" },
  { theme: "privacy", icon: "confidentialite", tile: "bg-brume text-sapin" },
  { theme: "billing", icon: "mobile-money", tile: "bg-lime text-sapin" },
  { theme: "recruiters", icon: "hire", tile: "bg-neon text-sapin" },
  { theme: "partners", icon: "certificat", tile: "bg-menthe-claire text-sapin" },
] as const satisfies { theme: string; icon: IconName; tile: string }[];

export default async function FaqPage() {
  const t = await getTranslations("faq");
  const [messages, overrides] = await Promise.all([getMessages(), getContentOverrides()]);
  // Questions are numbered in the texts (q1, a1, q2, a2…); /admin/contenus can change, hide or
  // add some.
  const groups = themes.map((entry) => ({
    ...entry,
    items: faqItems(messages, overrides, `faq.${entry.theme}`).map((item) => ({
      id: `${entry.theme}-q${item.n}`,
      question: item.question,
      answer: item.answer,
    })),
  }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />
      <MotionRoot />

      {/* Hero with the search */}
      <MarketingSection
        scene
        className="pt-10 pb-10 lg:pt-[72px] lg:pb-16"
        background={
          <>
            <Glow className="-top-48 -left-40 size-[520px] bg-lime/40" />
            <Glow className="-right-40 -bottom-56 size-[560px] bg-menthe/30" delay={-8} />
          </>
        }
        innerClassName="flex items-end gap-12"
      >
        <div className="relative z-1 flex min-w-0 flex-1 flex-col gap-5">
          <div className="jm-rise" style={stagger(0)}>
            <Eyebrow>{t("hero.eyebrow")}</Eyebrow>
          </div>
          <h1
            className="jm-word text-[36px] leading-10 font-semibold tracking-[-0.035em] lg:text-[56px] lg:leading-[60px]"
            style={stagger(1)}
          >
            {t("hero.title")}
          </h1>
          <p className={cx(lead, "jm-rise text-sapin/85")} style={stagger(2)}>
            {t("hero.text")}
          </p>
          <div className="jm-rise" style={stagger(3)}>
            <FaqSearch
              label={t("search.label")}
              placeholder={t("search.placeholder")}
              empty={t("search.empty")}
            />
          </div>
        </div>
        <div className="jm-breathe -mb-10 hidden shrink-0 lg:-mb-16 lg:block">
          <Character name="fatou" pose="montre" height={330} />
        </div>
      </MarketingSection>

      {/* Themes and questions */}
      <MarketingSection
        tone="blanc"
        className="overflow-clip! pt-8 lg:pt-[72px]"
        innerClassName="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16"
      >
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:w-[300px] lg:shrink-0">
          <FaqThemes
            label={t("themes.label")}
            themes={groups.map((group) => ({
              id: group.theme,
              label: t(`theme.${group.theme}`),
              count: group.items.length,
              icon: group.icon,
            }))}
          />
          <div className="hidden flex-col gap-2.5 rounded-card bg-creme p-6 lg:flex">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Icon name="message" className="size-4 shrink-0 text-feuille-fonce" />
              {t("cta.title")}
            </p>
            <p className="text-[13px] leading-5 text-ardoise">{t("cta.text")}</p>
            <ButtonLink href="/contact" variant="secondary" className="self-start">
              {t("cta.button")}
            </ButtonLink>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-10">
          {groups.map((group) => (
            <section
              key={group.theme}
              id={group.theme}
              data-faq-theme
              data-reveal
              className="flex scroll-mt-24 flex-col gap-3"
            >
              <h2 className="flex items-center gap-3 pb-1 text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
                <IconTile icon={group.icon} size={44} className={group.tile} />
                {t(`theme.${group.theme}`)}
              </h2>
              {group.items.map((item, index) => (
                <details
                  key={item.id}
                  id={item.id}
                  data-faq
                  name={`faq-${group.theme}`}
                  open={index === 0}
                  className="group scroll-mt-24 rounded-[20px] bg-creme px-5 py-[18px] lg:px-6 lg:py-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base leading-[23px] font-semibold [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blanc text-sapin transition-colors group-open:bg-sapin group-open:text-lime"
                    >
                      <Icon
                        name="chev-d"
                        className="size-4 transition-transform group-open:rotate-180"
                      />
                    </span>
                  </summary>
                  <p className="mt-2 max-w-[820px] text-[15px] leading-6 text-ardoise">
                    {item.answer}
                  </p>
                </details>
              ))}
            </section>
          ))}
        </div>
      </MarketingSection>

      <LimeCtaBand
        animated
        spacedTop
        title={t("cta.title")}
        text={t("cta.text")}
        character={{ name: "kofi", pose: "joie", height: 330, mobileHeight: 250 }}
        actions={
          <ButtonLink href="/contact" variant="secondary" size="lg" icon={<Icon name="message" />}>
            {t("cta.button")}
          </ButtonLink>
        }
      />
    </>
  );
}
