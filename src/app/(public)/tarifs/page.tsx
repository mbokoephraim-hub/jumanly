import Link from "next/link";
import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { CompareTable, FamilyPlans } from "@/components/site/pricing";
import { Band, CheckList, CtaBand, FaqList, Section } from "@/components/site/sections";
import { Tabs } from "@/components/ui/tabs";
import { Badge, ButtonLink } from "@/components/ui";
import { formatUsd } from "@/lib/money";
import { withoutPlaceholders } from "@/lib/placeholders";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";
import { getContentOverrides, getPublicPlans } from "@/server/queries/public";
import { faqItems } from "@/server/services/contents";
import { limitOf, lowestPaidPrice, plansOf } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing.seo");
  return pageMetadata({ path: "/tarifs", title: t("title"), description: t("description") });
}

export default async function PricingPage() {
  const t = await getTranslations();
  const [plans, messages, overrides] = await Promise.all([
    getPublicPlans(),
    getMessages(),
    getContentOverrides(),
  ]);
  const companyFrom = lowestPaidPrice(plans, "company");
  // Largest RH team before Companies: the seats of the last RH plan, read from the database.
  const rhMaxSeats = Math.max(
    0,
    ...plansOf(plans, "rh").map((plan) => limitOf(plan, "org.seats") ?? 0),
  );

  const faq = faqItems(messages, overrides, "pricing.faq")
    .map((item) => {
      const answer = withoutPlaceholders(item.answer);
      return answer ? { question: item.question, answer } : null;
    })
    .filter((item) => item !== null);

  const talents = (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-h1">{t("pricing.talent.title")}</h2>
        <p className="max-w-3xl text-ardoise">{t("pricing.talent.subtitle")}</p>
      </header>
      <FamilyPlans plans={plans} family="talent" />
      <Band
        title={t("pricing.talent.partnersBand.title")}
        text={t("pricing.talent.partnersBand.text")}
        action={
          <ButtonLink href="/activer" variant="secondary">
            {t("pricing.talent.partnersBand.cta")}
          </ButtonLink>
        }
      />
      <CompareTable plans={plans} family="talent" />
      <p className="text-sm text-ardoise">{t("pricing.talent.compare.note")}</p>
    </div>
  );

  const rh = (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-h1">{t("pricing.rh.title")}</h2>
        <p className="max-w-3xl text-ardoise">{t("pricing.rh.subtitle")}</p>
      </header>
      <FamilyPlans plans={plans} family="rh" />
      <p className="text-sm text-ardoise">{t("pricing.rh.privacyNote")}</p>
      <Band
        tone="blanc"
        title={t("pricing.rh.upsell.title", { seats: rhMaxSeats })}
        text={t("pricing.rh.upsell.text", {
          price: companyFrom === null ? "" : formatUsd(companyFrom),
        })}
        action={
          <ButtonLink href="#companies" variant="secondary">
            {t("pricing.rh.upsell.cta")}
          </ButtonLink>
        }
      />
      <CompareTable plans={plans} family="rh" />
    </div>
  );

  const companies = (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-h1">{t("pricing.company.title")}</h2>
        <p className="max-w-3xl text-ardoise">{t("pricing.company.subtitle")}</p>
      </header>
      <div className="flex flex-col items-start gap-3 rounded-card bg-blanc p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px]">{t("pricing.company.startFree.text")}</p>
        <ButtonLink href={signupHref({ profil: "company" })} variant="tertiary">
          {t("pricing.company.startFree.cta")}
        </ButtonLink>
      </div>
      <FamilyPlans plans={plans} family="company" />
      <p className="text-sm text-ardoise">{t("pricing.company.premium.note")}</p>
      <Band
        title={t("pricing.company.partnersBand.title")}
        text={t("pricing.company.partnersBand.text")}
        action={
          <ButtonLink href="/partenaires" variant="secondary">
            {t("pricing.company.partnersBand.cta")}
          </ButtonLink>
        }
      />
      <CompareTable plans={plans} family="company" />
    </div>
  );

  const partners = (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col gap-5 rounded-card bg-blanc p-6 md:p-8">
        <h2 className="text-h1">{t("pricing.partners.title")}</h2>
        <p className="text-ardoise">{t("pricing.partners.subtitle")}</p>
        <p className="text-h2">{t("pricing.partners.price")}</p>
        <CheckList
          items={(["f1", "f2", "f3", "f4", "f5", "f6"] as const).map((key) =>
            t(`pricing.partners.${key}`),
          )}
        />
        <p className="text-sm text-ardoise">{t("pricing.partners.noOnline")}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/partenaires#contact">{t("pricing.partners.cta")}</ButtonLink>
          <ButtonLink href="/partenaires" variant="tertiary">
            {t("pricing.partners.ctaSecondary")}
          </ButtonLink>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-card bg-lime p-6 text-sapin">
          <h3 className="text-h2">{t("pricing.partners.example.title")}</h3>
          <p>{t("pricing.partners.example.text")}</p>
          <p className="text-lg font-semibold">{t("pricing.partners.example.formula")}</p>
          <p className="text-caption">{t("pricing.partners.example.note")}</p>
        </div>
        <Link
          href="/activer"
          className="flex items-center gap-2 rounded-card bg-blanc p-5 font-semibold hover:underline"
        >
          <Icon name="valider" className="size-5 text-feuille" />
          {t("pricing.partners.beneficiary")}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <section className="bg-creme">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 page-x pt-12 pb-6 md:pt-16">
          <p className="text-eyebrow text-feuille-fonce">{t("pricing.hero.eyebrow")}</p>
          <h1 className="max-w-3xl text-display">{t("pricing.hero.title")}</h1>
          <p className="max-w-2xl text-lg leading-8 text-ardoise">{t("pricing.hero.subtitle")}</p>
          <Badge tone="lime" icon={<Icon name="valider" className="size-4" />}>
            {t("pricing.hero.badge")}
          </Badge>
          <ul className="flex flex-col gap-1 text-sm text-ardoise">
            <li>{t("pricing.payment.methods")}</li>
            <li>{t("pricing.payment.prepaid")}</li>
            <li>{t("pricing.payment.localCurrency")}</li>
          </ul>
        </div>
      </section>
      <section className="bg-creme" aria-label={t("pricing.tabs.label")}>
        <div className="mx-auto max-w-7xl page-x pb-12">
          <Tabs
            syncHash
            tabs={[
              { id: "talents", label: t("pricing.tabs.talents"), content: talents },
              { id: "rh", label: t("pricing.tabs.rh"), content: rh },
              { id: "companies", label: t("pricing.tabs.companies"), content: companies },
              { id: "partners", label: t("pricing.tabs.partners"), content: partners },
            ]}
          />
          <p className="mt-6 text-sm text-ardoise">{t("pricing.card.provisional")}</p>
        </div>
      </section>
      <Section title={t("pricing.guarantees.title")} tone="blanc">
        <CheckList
          className="md:columns-2 md:gap-8 md:[&>li]:mb-3"
          items={(["apply", "equal", "ai", "data", "quotas"] as const).map((key) =>
            t(`pricing.guarantees.${key}`),
          )}
        />
      </Section>
      <Section title={t("pricing.faq.title")}>
        <FaqList items={faq} />
        <p className="text-ardoise">{t("pricing.faq.more")}</p>
      </Section>
      <CtaBand
        title={t("pricing.finalCta.title")}
        text={t("pricing.finalCta.text")}
        actions={
          <>
            <ButtonLink href={signupHref()} size="lg">
              {t("pricing.finalCta.primary")}
            </ButtonLink>
            <ButtonLink href="/contact?sujet=devis" size="lg" variant="inverse">
              {t("pricing.finalCta.secondary")}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
