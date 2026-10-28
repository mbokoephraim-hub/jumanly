import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { ContactForm } from "@/components/site/contact-form";
import {
  Eyebrow,
  IconTile,
  SiteButton,
  heroTitle,
  lead,
  stagger,
  wrap,
} from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { planValues } from "@/components/site/pricing";
import { QuoteForm, type QuoteDefaults } from "@/components/site/quote-form";
import { Skeleton } from "@/components/ui";
import { countryOptions } from "@/config/countries";
import { dynamic, numbered } from "@/i18n/dynamic";
import { pickMessages } from "@/i18n/client-messages";
import { cx } from "@/lib/cx";
import { keepTogether } from "@/lib/typography";
import { pageMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getPublicPlans } from "@/server/queries/public";
import { ownedOrganization } from "@/server/services/accounts";
import { contactSubjects, type ContactSubject } from "@/server/services/contact-rules";
import { plansOf, type PublicPlan } from "@/server/services/plans";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("contact.seo");
  return pageMetadata({ path: "/contact", title: t("title"), description: t("description") });
}

/** `?sujet=devis` opens the Company Premium quote request (maquette 05-06). */
const subjectAliases: Record<string, ContactSubject> = { devis: "quote", partenaires: "partners" };

function subjectOf(sujet: string | string[] | undefined): ContactSubject | undefined {
  const value = typeof sujet === "string" ? sujet : undefined;
  if (!value) return undefined;
  return (
    subjectAliases[value] ??
    ((contactSubjects as readonly string[]).includes(value) ? (value as ContactSubject) : undefined)
  );
}

export default async function ContactPage({
  params,
  searchParams,
}: PageProps<"/[locale]/contact">) {
  await applySiteLocale(params);
  return (
    <>
      <MotionRoot />
      {/* The subject is read from the address: the plain contact page is the fallback. */}
      <Suspense
        fallback={
          <ContactView
            form={<Skeleton className="h-[640px] rounded-card lg:rounded-[32px]" />}
            aside={<ContactAside />}
          />
        }
      >
        <ContactContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ContactContent({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/contact">["searchParams"];
}) {
  const { sujet } = await searchParams;
  const subject = subjectOf(sujet);
  const messages = await getMessages();
  if (subject === "quote") {
    const plans = await getPublicPlans();
    // The plan sold on quote, found by its data (no price, not purchasable), never by its name.
    const plan = plansOf(plans, "company").find(
      (item) => item.priceCents === null && !item.isPurchasable,
    );
    return (
      <QuoteView
        planName={plan?.name}
        form={
          <NextIntlClientProvider
            messages={pickMessages(messages, ["quote", "contact", "common", "brand"])}
          >
            <QuoteForm countries={countryOptions()} defaults={await quoteDefaults()} />
          </NextIntlClientProvider>
        }
        aside={plan ? <QuotePlanCard plan={plan} /> : <ContactAside />}
      />
    );
  }
  return (
    <ContactView
      form={
        <NextIntlClientProvider messages={pickMessages(messages, ["contact", "common"])}>
          <ContactForm initialSubject={subject} countries={countryOptions()} />
        </NextIntlClientProvider>
      }
      aside={<ContactAside />}
    />
  );
}

/** Organization, name, e-mail and country of a signed-in visitor (maquette 05-06). */
async function quoteDefaults(): Promise<QuoteDefaults> {
  const user = await getCurrentUser();
  if (!user) return {};
  const org = await ownedOrganization(db, user.id);
  return {
    organization: org?.name,
    name: user.name,
    email: user.email,
    // Countries are stored as ISO codes; the form lists them by name.
    country: user.country
      ? new Intl.DisplayNames(["fr-FR"], { type: "region" }).of(user.country)
      : undefined,
  };
}

/** Hero on the Nuit page; the form follows it. */
function Hero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section data-scene className="bg-papier">
      <div className="relative mx-auto max-w-[1400px] px-1 pt-10 pb-[120px] lg:pt-20 lg:pb-[180px]">
        <div className={cx(wrap, "relative flex items-end gap-12")}>
          <div className="flex max-w-[720px] flex-1 flex-col gap-5">
            <div className="jm-rise" style={stagger(0)}>
              <Eyebrow>{eyebrow}</Eyebrow>
            </div>
            <h1 className={cx("jm-word", heroTitle)} style={stagger(1)}>
              {keepTogether(title)}
            </h1>
            <p className={cx(lead, "jm-rise text-ardoise")} style={stagger(2)}>
              {text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Form and aside, raised over the hero. */
function Body({
  form,
  aside,
  asideWidth,
}: {
  form: ReactNode;
  aside: ReactNode;
  asideWidth: string;
}) {
  return (
    <section className="relative z-2 bg-papier pb-14 lg:pb-24">
      <div
        className={cx(
          wrap,
          "relative -mt-[96px] flex flex-col gap-5 lg:-mt-[150px] lg:flex-row lg:items-start lg:gap-7",
        )}
      >
        <div className="jm-rise min-w-0 lg:flex-1" style={stagger(3)}>
          {form}
        </div>
        <aside className={cx("flex flex-col gap-5 lg:shrink-0", asideWidth)}>{aside}</aside>
      </div>
    </section>
  );
}

async function ContactView({ form, aside }: { form: ReactNode; aside: ReactNode }) {
  const t = await getTranslations("contact");
  return (
    <>
      <Hero eyebrow={t("hero.eyebrow")} title={t("hero.title")} text={t("hero.text")} />
      <Body form={form} aside={aside} asideWidth="lg:w-[400px]" />
    </>
  );
}

async function QuoteView({
  planName,
  form,
  aside,
}: {
  planName?: string;
  form: ReactNode;
  aside: ReactNode;
}) {
  const t = await getTranslations();
  return (
    <>
      <Hero
        eyebrow={planName ?? t("contact.hero.eyebrow")}
        title={t("quote.hero.title")}
        text={t("quote.hero.text")}
      />
      <Body form={form} aside={aside} asideWidth="lg:w-[380px]" />
    </>
  );
}

/** Addresses and the FAQ hint, beside the contact form. */
async function ContactAside() {
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
      <div
        className="jm-rise rounded-[28px] bg-blanc px-6 py-6 lg:px-[30px] lg:py-7"
        style={stagger(4)}
      >
        <h2 className="mb-1.5 text-xl leading-[26px] font-semibold tracking-[-0.015em]">
          {t("emails.title")}
        </h2>
        <ul>
          {emails.map((email, index) => (
            <li
              key={email.key}
              className={cx("flex items-center gap-3.5 py-4", index > 0 && "border-t border-brume")}
            >
              <IconTile icon={email.icon} size={46} className={cx(email.tile, "text-sapin")} />
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
        className="jm-rise relative flex flex-col items-start gap-3.5 overflow-hidden rounded-[28px] bg-lime-clair p-6 text-sapin lg:p-7"
        style={stagger(5)}
      >
        <span className="jm-float">
          <IconTile icon="recherche" size={46} className="bg-sapin text-lime" />
        </span>
        <p className="text-base leading-[25px] font-medium">{t("faqHint.text")}</p>
        <SiteButton href="/faq" size="md">
          {t("faqHint.cta")}
        </SiteButton>
      </div>
    </>
  );
}

/**
 * The plan sold on quote, on Nuit (maquette 05-06): tagline as eyebrow, « Sur devis », name,
 * features and the contract note, all from the plan's texts and the database.
 */
async function QuotePlanCard({ plan }: { plan: PublicPlan }) {
  const t = dynamic(await getTranslations());
  const key = plan.contentKey;
  const tagline = plan.tagline || (t.has(`${key}.tagline`) ? t(`${key}.tagline`) : "");
  return (
    <div
      data-scene
      className="jm-rise relative flex flex-col gap-4 overflow-hidden rounded-[28px] bg-nuit p-6 text-blanc lg:p-[26px]"
      style={stagger(4)}
    >
      <div className="relative flex items-center justify-between gap-3">
        {tagline && (
          <p className="text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-neon uppercase">
            {tagline}
          </p>
        )}
        <span className="inline-flex h-6 shrink-0 items-center rounded-pill bg-neon px-2.5 text-[11px] font-semibold text-sapin">
          {t("pricing.card.quote")}
        </span>
      </div>
      <h2 className="relative text-[24px] leading-[30px] font-semibold tracking-[-0.02em]">
        {plan.name}
      </h2>
      <ul className="relative flex flex-col gap-2.5">
        {numbered(t, `${key}.f`, planValues(plan)).map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-[14px] leading-5">
            <span
              aria-hidden
              className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-neon text-sapin"
            >
              <Icon name="check" className="size-3" />
            </span>
            {feature}
          </li>
        ))}
      </ul>
      {t.has(`${key}.note`) && (
        <p className="relative text-xs leading-[17px] text-blanc/70">{t(`${key}.note`)}</p>
      )}
    </div>
  );
}
