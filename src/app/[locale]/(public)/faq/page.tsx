import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { FaqSearch, FaqThemes } from "@/components/site/faq-search";
import {
  IconTile,
  LimeCtaBand,
  MarketingSection,
  SiteButton,
  SiteHero,
} from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { jsonLdScript, pageMetadata } from "@/lib/seo";
import { getContentOverrides } from "@/server/queries/public";
import { faqItems } from "@/server/services/contents";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({ params }: PageProps<"/[locale]/faq">): Promise<Metadata> {
  await applySiteLocale(params);
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

export default async function FaqPage({ params }: PageProps<"/[locale]/faq">) {
  await applySiteLocale(params);
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

      <SiteHero
        compact
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        text={t("hero.text")}
        extra={
          <div className="max-w-[620px]">
            <FaqSearch
              label={t("search.label")}
              placeholder={t("search.placeholder")}
              empty={t("search.empty")}
            />
          </div>
        }
      />

      {/* Themes and questions */}
      <MarketingSection
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
          <div className="hidden flex-col gap-2.5 rounded-[28px] bg-blanc p-6 lg:flex">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Icon name="message" className="size-4 shrink-0 text-feuille-fonce" />
              {t("cta.title")}
            </p>
            <p className="text-[13px] leading-5 text-ardoise">{t("cta.text")}</p>
            <SiteButton href="/contact" size="md" className="self-start">
              {t("cta.button")}
            </SiteButton>
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
                  className="group scroll-mt-24 rounded-[24px] bg-blanc px-5 py-[18px] lg:px-6 lg:py-5"
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
        spacedTop
        title={t("cta.title")}
        text={t("cta.text")}
        actions={
          <SiteButton href="/contact" icon="message">
            {t("cta.button")}
          </SiteButton>
        }
      />
    </>
  );
}
