import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { FaqSearch } from "@/components/site/faq-search";
import { CtaBand, PageHero } from "@/components/site/sections";
import { ButtonLink } from "@/components/ui";
import { childKeys, dynamic } from "@/i18n/dynamic";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("faq.seo");
  return pageMetadata({ path: "/faq", title: t("title"), description: t("description") });
}

const themes = [
  "general",
  "talents",
  "learn",
  "ai",
  "privacy",
  "billing",
  "recruiters",
  "partners",
] as const;

export default async function FaqPage() {
  const t = await getTranslations("faq");
  const tx = dynamic(t);
  const messages = await getMessages();
  // Questions are numbered in the texts (q1, a1, q2, a2…): adding one there adds it here.
  const groups = themes.map((theme) => ({
    theme,
    items: childKeys(messages, `faq.${theme}`)
      .filter((key) => key.startsWith("q"))
      .map((key) => ({
        id: `${theme}-${key}`,
        question: tx(`${theme}.${key}`),
        answer: tx(`${theme}.a${key.slice(1)}`),
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <PageHero title={t("hero.title")} text={t("hero.text")} />
      <section className="bg-creme">
        <div className="mx-auto grid max-w-7xl gap-8 page-x pb-16 lg:grid-cols-[1fr_3fr]">
          <nav aria-label={t("themes.label")} className="self-start lg:sticky lg:top-24">
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {themes.map((theme) => (
                <li key={theme}>
                  <a
                    href={`#${theme}`}
                    className="block rounded-pill bg-blanc px-4 py-2 text-sm font-medium hover:bg-lime lg:rounded-sm lg:bg-transparent"
                  >
                    {t(`theme.${theme}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col gap-10">
            <FaqSearch
              label={t("search.label")}
              placeholder={t("search.placeholder")}
              empty={t("search.empty")}
            />
            {groups.map((group) => (
              <section
                key={group.theme}
                id={group.theme}
                data-faq-theme
                className="flex scroll-mt-24 flex-col gap-3"
              >
                <h2 className="text-h2">{t(`theme.${group.theme}`)}</h2>
                {group.items.map((item) => (
                  <details key={item.id} data-faq className="group rounded-md bg-blanc p-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold">
                      {item.question}
                      <Icon
                        name="ajouter"
                        className="size-5 shrink-0 transition-transform group-open:rotate-45"
                      />
                    </summary>
                    <p className="mt-3 text-[15px] leading-7 text-ardoise">{item.answer}</p>
                  </details>
                ))}
              </section>
            ))}
          </div>
        </div>
      </section>
      <CtaBand
        title={t("cta.title")}
        text={t("cta.text")}
        actions={
          <ButtonLink href="/contact" size="lg">
            {t("cta.button")}
          </ButtonLink>
        }
      />
    </>
  );
}
