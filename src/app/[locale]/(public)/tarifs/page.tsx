import { Suspense, cache } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  Eyebrow,
  FaqAccordion,
  Glow,
  IconTile,
  LimeCtaBand,
  MarketingSection,
  Pattern,
  SectionHead,
  lead,
  outlineOnLime,
  sectionTitle,
  stagger,
} from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { OpenOnWide, PricingFamilyNav } from "@/components/site/pricing-nav";
import { TarifBand, TarifCompare, TarifPlanCards } from "@/components/site/tarifs";
import { ButtonLink } from "@/components/ui";
import type { PlanFamily } from "@/generated/prisma/client";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { withoutPlaceholders } from "@/lib/placeholders";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { getContentOverrides, getPublicPlans } from "@/server/queries/public";
import { ownedOrganization } from "@/server/services/accounts";
import { faqItems } from "@/server/services/contents";
import { limitOf, lowestPaidPrice, plansOf, type PublicPlan } from "@/server/services/plans";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({ params }: PageProps<"/[locale]/tarifs">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("pricing.seo");
  return pageMetadata({ path: "/tarifs", title: t("title"), description: t("description") });
}

const chevron = <Icon name="chev-r" />;

/** Family anchors (maquette 05-01): #talents #rh #companies #partners. */
const families = ["talents", "rh", "companies", "partners"] as const;

/** Section offset under the sticky header and family segments. */
const anchorOffset = "scroll-mt-[136px] xl:scroll-mt-[156px]";

const guarantees = [
  { key: "apply", icon: "check" },
  { key: "equal", icon: "equipe" },
  { key: "ai", icon: "eye" },
  { key: "data", icon: "securite" },
  { key: "quotas", icon: "statistiques" },
] as const satisfies { key: string; icon: IconName }[];

/**
 * Plans of the signed-in visitor (personal plan for a talent, plan of the organization they own),
 * for « Votre formule actuelle ». Empty for a visitor: the page itself stays the same for all.
 */
const visitorPlanCodes = cache(async (): Promise<string[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const [talent, org] = await Promise.all([
    db.talentProfile.findUnique({ where: { userId: user.id }, select: { id: true } }),
    ownedOrganization(db, user.id),
  ]);
  const plans = await Promise.all([
    talent ? resolvePlan(db, { type: "user", id: user.id }) : null,
    org ? resolvePlan(db, { type: "organization", id: org.id }) : null,
  ]);
  return plans.flatMap((plan) => (plan ? [plan.planCode] : []));
});

async function VisitorPlanCards({ plans, family }: { plans: PublicPlan[]; family: PlanFamily }) {
  return <TarifPlanCards plans={plans} family={family} current={await visitorPlanCodes()} />;
}

/** Cards of a family; the visitor's current plan is marked once the session is read. */
function FamilyCards({ plans, family }: { plans: PublicPlan[]; family: PlanFamily }) {
  return (
    <Suspense fallback={<TarifPlanCards plans={plans} family={family} />}>
      <VisitorPlanCards plans={plans} family={family} />
    </Suspense>
  );
}

/** A text with one e-mail address set in bold (« … écrivez-nous à infojumanly@gmail.com. »). */
function WithEmail({ text }: { text: string }) {
  const parts = text.split(/([\w.+-]+@[\w-]+\.[\w.]+[a-z])/i);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <a
            key={index}
            href={`mailto:${part}`}
            className="font-semibold text-sapin hover:underline"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}

export default async function PricingPage({ params }: PageProps<"/[locale]/tarifs">) {
  await applySiteLocale(params);
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

  const familyHead = (title: string, text: string) => (
    <div data-reveal>
      <SectionHead title={title} text={text} />
    </div>
  );

  return (
    <>
      <MotionRoot />

      {/* Hero: Crème lit by brand lights, the family segments and the payment terms */}
      <section
        data-scene
        className="relative overflow-hidden bg-creme pt-10 pb-10 text-sapin lg:pt-[72px] lg:pb-12"
      >
        <Pattern name="motif-trajectoires-clair" opacity={0.35} />
        <Glow className="-top-48 -left-40 size-[520px] bg-lime/20" />
        <Glow className="top-1/4 -right-48 size-[560px] bg-menthe/15" delay={-7} />
        <div className="jm-breathe absolute bottom-[-6px] left-[70px] hidden xl:block">
          <Character name="kofi" pose="salut" height={250} />
        </div>
        <div
          className="jm-breathe absolute right-[70px] bottom-[-6px] hidden xl:block"
          style={{ animationDelay: "-2s" }}
        >
          <Character name="amani" pose="telephone" height={250} />
        </div>
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col items-center gap-6 px-4 text-center xl:px-0">
          <span
            className="jm-rise inline-flex h-8 items-center gap-1.5 rounded-pill bg-lime px-3.5 text-xs font-semibold"
            style={stagger(0)}
          >
            <Icon name="check" className="size-3.5" />
            {t("pricing.hero.badge")}
          </span>
          <div className="jm-rise" style={stagger(1)}>
            <Eyebrow>{t("pricing.hero.eyebrow")}</Eyebrow>
          </div>
          <h1
            className="jm-word max-w-[860px] text-[36px] leading-10 font-semibold tracking-[-0.035em] lg:text-[56px] lg:leading-[60px]"
            style={stagger(2)}
          >
            {t("pricing.hero.title")}
          </h1>
          <p className={cx(lead, "jm-rise max-w-[720px] text-ardoise")} style={stagger(3)}>
            {t("pricing.hero.subtitle")}
          </p>
          <div className="jm-rise mt-2 flex flex-col items-center gap-2" style={stagger(4)}>
            <p className="text-[11px] leading-[15px] text-ardoise">{t("pricing.tabs.label")}</p>
            <PricingFamilyNav
              label={t("pricing.tabs.label")}
              families={families.map((id) => ({ id, label: t(`pricing.tabs.${id}`) }))}
            />
          </div>
          <ul
            className="jm-rise flex flex-col gap-2.5 text-[13px] leading-[18px] font-medium lg:flex-row lg:gap-6"
            style={stagger(5)}
          >
            <li className="flex items-center gap-2 text-left lg:whitespace-nowrap">
              <Icon name="mobile-money" className="size-4 shrink-0 text-feuille-fonce" />
              {t("pricing.payment.methods")}
            </li>
            <li className="flex items-center gap-2 text-left lg:whitespace-nowrap">
              <Icon name="horloge" className="size-4 shrink-0 text-feuille-fonce" />
              {t("pricing.payment.prepaidShort")}
            </li>
          </ul>
        </div>
      </section>

      {/* Talents */}
      <MarketingSection
        id="talents"
        className={cx(anchorOffset, "pt-10 lg:pt-10")}
        innerClassName="flex flex-col gap-9"
      >
        {familyHead(t("pricing.talent.title"), t("pricing.talent.subtitle"))}
        <FamilyCards plans={plans} family="talent" />
        <p className="-mt-3 flex items-start justify-center gap-2 text-center text-xs leading-[17px] text-ardoise">
          <Icon name="horloge" className="mt-px size-3.5 shrink-0" />
          {t("pricing.card.provisional")}
        </p>
        <TarifBand
          icon="certificat"
          title={t("pricing.talent.partnersBand.title")}
          text={t("pricing.talent.partnersBand.text")}
          cta={t("pricing.talent.partnersBand.cta")}
          href="/activer"
        />
        <div className="flex flex-col gap-4">
          <TarifCompare plans={plans} family="talent" id="compare-talents" />
          <OpenOnWide id="compare-talents" />
          <p className="max-w-[880px] text-xs leading-[17px] text-ardoise">
            {t("pricing.talent.compare.note")}
          </p>
        </div>
      </MarketingSection>

      {/* RH */}
      <MarketingSection
        id="rh"
        tone="blanc"
        className={anchorOffset}
        innerClassName="flex flex-col gap-9"
      >
        {familyHead(t("pricing.rh.title"), t("pricing.rh.subtitle"))}
        <FamilyCards plans={plans} family="rh" />
        <p className="flex items-start gap-3 rounded-[18px] bg-creme px-[18px] py-3.5 text-[13px] leading-5">
          <Icon name="lock" className="mt-0.5 size-4 shrink-0" />
          {t("pricing.rh.privacyNote")}
        </p>
        <TarifBand
          tone="lime"
          icon="entreprise"
          title={t("pricing.rh.upsell.title", { seats: rhMaxSeats })}
          text={t("pricing.rh.upsell.text", {
            price: companyFrom === null ? "" : formatUsd(companyFrom),
          })}
          cta={t("pricing.rh.upsell.cta")}
          href="#companies"
        />
        <TarifCompare plans={plans} family="rh" id="compare-rh" />
      </MarketingSection>

      {/* Companies */}
      <MarketingSection
        id="companies"
        className={anchorOffset}
        innerClassName="flex flex-col gap-9"
      >
        {familyHead(t("pricing.company.title"), t("pricing.company.subtitle"))}
        <div
          data-reveal
          className="flex flex-col items-start gap-3 rounded-[20px] bg-blanc px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
        >
          <p className="flex flex-1 items-start gap-3 text-[13.5px] leading-5 font-medium">
            <Icon name="hire" className="mt-px size-[18px] shrink-0" />
            {t("pricing.company.startFree.text")}
          </p>
          <ButtonLink href={signupHref({ profil: "company" })} variant="tertiary" size="sm">
            {t("pricing.company.startFree.cta")}
          </ButtonLink>
        </div>
        <FamilyCards plans={plans} family="company" />
        <TarifBand
          icon="certificat"
          title={t("pricing.company.partnersBand.title")}
          text={t("pricing.company.partnersBand.text")}
          cta={t("pricing.company.partnersBand.cta")}
          href="/partenaires"
        />
        <TarifCompare plans={plans} family="company" id="compare-companies" />
      </MarketingSection>

      {/* Partners, on Sapin */}
      <MarketingSection
        id="partners"
        tone="sapin"
        scene
        className={anchorOffset}
        background={
          <>
            <Pattern name="motif-reseau-sombre" opacity={0.3} />
            <Glow className="-top-40 -left-32 size-[520px] bg-feuille/30" />
          </>
        }
        innerClassName="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16"
      >
        <div data-reveal className="flex flex-col gap-5 lg:flex-1">
          <Eyebrow dark>{t("pricing.tabs.partners")}</Eyebrow>
          <h2 className={sectionTitle}>{t("pricing.partners.title")}</h2>
          <p className={cx(lead, "text-blanc/75")}>{t("pricing.partners.subtitle")}</p>
          <p className="text-[34px] leading-10 font-semibold tracking-[-0.03em] text-lime">
            {t("pricing.partners.price")}
          </p>
          <ul className="flex flex-col gap-3">
            {(["f1", "f2", "f3", "f4", "f5", "f6"] as const).map((key) => (
              <li key={key} className="flex items-start gap-2.5 text-[14.5px] leading-[21px]">
                <span
                  aria-hidden
                  className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-lime text-sapin"
                >
                  <Icon name="check" className="size-3" />
                </span>
                {t(`pricing.partners.${key}`)}
              </li>
            ))}
          </ul>
          <p className="flex items-start gap-2 text-[13px] leading-5 text-blanc/70">
            <Icon name="lock" className="mt-0.5 size-3.5 shrink-0 text-lime" />
            {t("pricing.partners.noOnline")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/partenaires#contact" size="lg" iconAfter={chevron}>
              {t("pricing.partners.cta")}
            </ButtonLink>
            <ButtonLink href="/partenaires" variant="inverse" size="lg">
              {t("pricing.partners.ctaSecondary")}
            </ButtonLink>
          </div>
          <Link
            href="/activer"
            className="inline-flex min-h-11 items-center gap-1.5 self-start text-[15px] font-semibold text-lime hover:underline"
          >
            {t("pricing.partners.beneficiary")}
            <Icon name="chev-r" className="size-4 shrink-0" />
          </Link>
        </div>
        <div className="flex flex-col items-end gap-6 lg:w-[420px] lg:shrink-0">
          <div
            data-reveal="zoom"
            className="flex w-full flex-col gap-3.5 rounded-[28px] bg-blanc p-6 text-sapin"
          >
            <span className="inline-flex h-6 items-center self-start rounded-pill bg-neon px-2.5 text-[11px] font-semibold">
              {t("pricing.partners.example.title")}
            </span>
            <p className="text-base leading-[26px] font-semibold">
              {t("pricing.partners.example.text")}
            </p>
            <p className="rounded-[18px] bg-creme px-4 py-3.5 text-base leading-6 font-semibold">
              {/* Thousands stay on one line (« 15 000 »). */}
              {t("pricing.partners.example.formula").replace(/(\d) (\d)/g, "$1\u00a0$2")}
            </p>
            <p className="text-xs leading-[17px] text-ardoise">
              {t("pricing.partners.example.note")}
            </p>
          </div>
          <div className="jm-breathe hidden lg:block lg:pr-6">
            <Character name="diallo" pose="telephone" height={230} />
          </div>
        </div>
      </MarketingSection>

      {/* What never changes */}
      <MarketingSection tone="blanc" innerClassName="flex flex-col gap-10">
        <div data-reveal>
          <SectionHead center title={t("pricing.guarantees.title")} />
        </div>
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
          {guarantees.map((item, index) => (
            <li
              key={item.key}
              data-reveal
              style={stagger(index)}
              className="jm-lift flex flex-col gap-3.5 rounded-card bg-creme p-[22px]"
            >
              <IconTile icon={item.icon} size={46} className="bg-lime text-sapin" />
              <p className="text-[15px] leading-[22px] font-medium">
                {t(`pricing.guarantees.${item.key}`)}
              </p>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {/* Billing FAQ */}
      {faq.length > 0 && (
        <MarketingSection innerClassName="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-20">
          <div data-reveal className="flex flex-col gap-5 lg:w-[360px] lg:shrink-0">
            <Eyebrow>{t("pricing.faq.eyebrow")}</Eyebrow>
            <h2 className={sectionTitle}>{t("pricing.faq.title")}</h2>
            <p className="text-[14.5px] leading-[23px] text-ardoise">
              <WithEmail text={t("pricing.faq.more")} />
            </p>
            <div className="jm-breathe mt-4 hidden self-start lg:block">
              <Character name="nadia" pose="montre" height={240} />
            </div>
          </div>
          <div data-reveal className="min-w-0 lg:flex-1">
            <FaqAccordion items={faq} />
          </div>
        </MarketingSection>
      )}

      <LimeCtaBand
        animated
        title={t("pricing.finalCta.title")}
        text={t("pricing.finalCta.text")}
        character={{ name: "amani", pose: "joie", height: 300, mobileHeight: 220 }}
        actions={
          <>
            <ButtonLink href={signupHref()} variant="secondary" size="lg" iconAfter={chevron}>
              {t("pricing.finalCta.primary")}
            </ButtonLink>
            <ButtonLink
              href="/contact?sujet=devis"
              variant="tertiary"
              size="lg"
              className={outlineOnLime}
            >
              {t("pricing.finalCta.secondary")}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
