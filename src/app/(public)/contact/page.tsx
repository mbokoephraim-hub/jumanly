import { Suspense } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { ContactForm } from "@/components/site/contact-form";
import { PageHero } from "@/components/site/sections";
import { ButtonLink, Skeleton } from "@/components/ui";
import { countryOptions } from "@/config/countries";
import { pickMessages } from "@/i18n/client-messages";
import { pageMetadata } from "@/lib/seo";
import { contactSubjects, type ContactSubject } from "@/server/services/contact-rules";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact.seo");
  return pageMetadata({ path: "/contact", title: t("title"), description: t("description") });
}

/** `?sujet=devis` pre-selects the Company Premium quote request (textes, /contact). */
const subjectAliases: Record<string, ContactSubject> = { devis: "quote", partenaires: "partners" };

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const t = await getTranslations("contact");
  const emails = [
    {
      label: t("emails.pro.label"),
      value: t("emails.pro.value"),
      href: `mailto:${t("emails.pro.value")}`,
    },
    {
      label: t("emails.general.label"),
      value: t("emails.general.value"),
      href: `mailto:${t("emails.general.value")}`,
    },
    { label: t("emails.site.label"), value: t("emails.site.value"), href: "/" },
  ];
  return (
    <>
      <PageHero
        title={t("hero.title")}
        text={t("hero.text")}
        aside={<Character name="nadia" pose="salut" height={240} />}
      />
      <section className="bg-creme">
        <div className="mx-auto grid max-w-7xl gap-8 page-x pb-16 lg:grid-cols-[1.6fr_1fr]">
          <Suspense fallback={<Skeleton className="h-[640px] rounded-card" />}>
            <Form searchParams={searchParams} />
          </Suspense>
          <aside className="flex flex-col gap-4 self-start">
            <div className="flex flex-col gap-4 rounded-card bg-blanc p-6">
              <h2 className="text-h2">{t("emails.title")}</h2>
              {emails.map((email) => (
                <div key={email.value} className="flex flex-col">
                  <span className="text-ardoise text-caption">{email.label}</span>
                  <a href={email.href} className="font-semibold underline">
                    {email.value}
                  </a>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-start gap-3 rounded-card bg-lime p-6">
              <p className="text-[15px]">{t("faqHint.text")}</p>
              <ButtonLink href="/faq" variant="secondary">
                {t("faqHint.cta")}
              </ButtonLink>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/contact">["searchParams"] }) {
  const { sujet } = await searchParams;
  const value = typeof sujet === "string" ? sujet : undefined;
  const initialSubject = value
    ? (subjectAliases[value] ??
      ((contactSubjects as readonly string[]).includes(value)
        ? (value as ContactSubject)
        : undefined))
    : undefined;
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["contact", "common"])}>
      <ContactForm initialSubject={initialSubject} countries={countryOptions()} />
    </NextIntlClientProvider>
  );
}
