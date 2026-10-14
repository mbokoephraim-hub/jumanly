import { Suspense } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import { ContactForm } from "@/components/site/contact-form";
import {
  Eyebrow,
  Glow,
  IconTile,
  ImmersiveBackdrop,
  lead,
  stagger,
  wrap,
} from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { ButtonLink, Skeleton } from "@/components/ui";
import { countryOptions } from "@/config/countries";
import { pickMessages } from "@/i18n/client-messages";
import { cx } from "@/lib/cx";
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
  const emails: {
    key: "pro" | "general" | "site";
    icon: IconName;
    tile: string;
    value: string;
    href: string;
  }[] = [
    {
      key: "pro",
      icon: "entreprise",
      tile: "bg-lime",
      value: t("emails.pro.value"),
      href: `mailto:${t("emails.pro.value")}`,
    },
    {
      key: "general",
      icon: "message",
      tile: "bg-neon",
      value: t("emails.general.value"),
      href: `mailto:${t("emails.general.value")}`,
    },
    {
      key: "site",
      icon: "lien",
      tile: "bg-menthe-claire",
      value: t("emails.site.value"),
      href: "/",
    },
  ];

  return (
    <>
      <MotionRoot />

      {/* Hero, on the depth gradient; the form overlaps its bottom edge */}
      <section
        data-scene
        data-spotlight
        className="relative overflow-hidden bg-gradient-depth pt-10 pb-[120px] text-blanc lg:pt-[72px] lg:pb-[200px]"
      >
        <ImmersiveBackdrop />
        <div className={cx(wrap, "relative flex items-end gap-12")}>
          <div className="flex max-w-[720px] flex-1 flex-col gap-5">
            <div className="jm-rise" style={stagger(0)}>
              <Eyebrow dark>{t("hero.eyebrow")}</Eyebrow>
            </div>
            <h1
              className="jm-word text-[36px] leading-10 font-semibold tracking-[-0.035em] lg:text-[56px] lg:leading-[60px]"
              style={stagger(1)}
            >
              {t("hero.title")}
            </h1>
            <p className={cx(lead, "jm-rise text-blanc/75")} style={stagger(2)}>
              {t("hero.text")}
            </p>
          </div>
          <div className="jm-breathe -mb-6 hidden shrink-0 lg:block">
            <Character name="kofi" pose="joie" height={280} />
          </div>
        </div>
      </section>

      <section className="relative z-2 bg-creme pb-14 lg:pb-24">
        <Glow className="top-40 -left-40 size-[460px] bg-lime/30" delay={-5} />
        <div
          className={cx(
            wrap,
            "relative -mt-[96px] flex flex-col gap-5 lg:-mt-[150px] lg:flex-row lg:items-start lg:gap-7",
          )}
        >
          <div className="jm-rise min-w-0 lg:flex-1" style={stagger(3)}>
            <Suspense fallback={<Skeleton className="h-[640px] rounded-card lg:rounded-[32px]" />}>
              <Form searchParams={searchParams} />
            </Suspense>
          </div>
          <aside className="flex flex-col gap-5 lg:w-[400px] lg:shrink-0">
            <div
              className="jm-rise rounded-card bg-blanc px-6 py-6 lg:px-[30px] lg:py-7"
              style={stagger(4)}
            >
              <h2 className="mb-1.5 text-xl leading-[26px] font-semibold tracking-[-0.015em]">
                {t("emails.title")}
              </h2>
              <ul>
                {emails.map((email, index) => (
                  <li
                    key={email.key}
                    className={cx(
                      "flex items-center gap-3.5 py-4",
                      index > 0 && "border-t border-brume",
                    )}
                  >
                    <IconTile
                      icon={email.icon}
                      size={46}
                      className={cx(email.tile, "text-sapin")}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[11px] leading-[15px] text-ardoise">
                        {t(`emails.${email.key}.label`)}
                      </span>
                      <a
                        href={email.href}
                        className="text-[15.5px] font-semibold break-all hover:underline"
                      >
                        {email.value}
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="jm-rise jm-flow relative flex flex-col items-start gap-3.5 overflow-hidden rounded-card bg-lime p-6 text-sapin lg:p-7"
              style={{
                ...stagger(5),
                backgroundImage:
                  "linear-gradient(120deg, #D9FA72 0%, #A6F26B 35%, #7DE36B 60%, #E3F67C 100%)",
              }}
            >
              <span className="jm-float">
                <IconTile icon="recherche" size={46} className="bg-sapin text-lime" />
              </span>
              <p className="text-base leading-[25px] font-medium">{t("faqHint.text")}</p>
              <ButtonLink href="/faq" variant="secondary" iconAfter={<Icon name="chev-r" />}>
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
