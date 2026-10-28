import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  ArrowLink,
  CheckChips,
  FloatCard,
  IconTile,
  LimeCtaBand,
  MarketingSection,
  SectionHead,
  SiteButton,
  SiteHero,
  stagger,
} from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { PublicPlanCards } from "@/components/site/pricing";
import { cx } from "@/lib/cx";
import { PipelinePreview } from "@/components/site/previews";
import { formatUsd } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";
import { getPublicPlans } from "@/server/queries/public";
import { lowestPaidPrice, plansOf } from "@/server/services/plans";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/entreprises">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("companies.seo");
  const from = lowestPaidPrice(await getPublicPlans(), "company");
  return pageMetadata({
    path: "/entreprises",
    title: t("title"),
    description: t("description", { price: from === null ? "" : formatUsd(from) }),
  });
}

const quoteHref = "/contact?sujet=devis";

const benefits = [
  { key: "verified", icon: "valider" },
  { key: "teams", icon: "equipe" },
  { key: "ats", icon: "hire" },
  { key: "reports", icon: "statistiques" },
] as const satisfies { key: string; icon: IconName }[];

const roleChips = [
  { key: "owner", icon: "securite" },
  { key: "admin", icon: "reglages" },
  { key: "recruiter", icon: "hire" },
  { key: "manager", icon: "equipe" },
  { key: "viewer", icon: "eye" },
] as const satisfies { key: string; icon: IconName }[];

/** Fictional members of the roles illustration, with the role tag colors of the mockup. */
const members = [
  { avatar: "bg-sapin text-lime", role: "owner", tag: "bg-sapin text-neon" },
  { avatar: "bg-lime text-sapin", role: "admin", tag: "bg-lime text-sapin" },
  { avatar: "bg-neon text-sapin", role: "recruiter", tag: "bg-neon text-sapin" },
  {
    avatar: "bg-menthe-claire text-sapin",
    role: "manager",
    tag: "bg-menthe-claire text-menthe-texte",
  },
  { avatar: "bg-brume text-sapin", role: "viewer", tag: "bg-brume text-sapin" },
] as const;

const guarantees = [
  { key: "item1", icon: "valider" },
  { key: "item2", icon: "doc" },
  { key: "item3", icon: "confidentialite" },
  { key: "item4", icon: "intelligence" },
] as const satisfies { key: string; icon: IconName }[];

const avatarTones = [
  "bg-lime text-sapin",
  "bg-neon text-sapin",
  "bg-menthe-claire text-sapin",
  "bg-[#1c3a2c] text-lime",
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function CompaniesPage({ params }: PageProps<"/[locale]/entreprises">) {
  await applySiteLocale(params);
  const t = await getTranslations();
  const plans = await getPublicPlans();
  const signup = signupHref({ profil: "company" });
  // The plan tag of the members illustration: the recommended Company plan, read from the database.
  const featuredPlan = plansOf(plans, "company").find((plan) => plan.recommended);

  return (
    <>
      <MotionRoot />

      <SiteHero
        eyebrow={t("companies.hero.eyebrow")}
        title={t("companies.hero.title")}
        text={t("companies.hero.text")}
        actions={
          <>
            <SiteButton href={signup}>{t("companies.hero.cta")}</SiteButton>
            <SiteButton href={quoteHref} tone="light">
              {t("companies.hero.secondary")}
            </SiteButton>
          </>
        }
        extra={<CheckChips items={[t("companies.hero.badge")]} />}
        visual={
          <HeroVisual
            alt={t("companies.hero.imageAlt")}
            orgInitials={t("companies.hero.visual.orgInitials")}
            orgName={t("companies.hero.visual.orgName")}
            verified={t("common.verifiedCompany")}
            team={t("companies.hero.visual.team")}
            initials={t("companies.hero.visual.initials").split(",")}
          />
        }
      />

      {/* Why Company */}
      <MarketingSection innerClassName="flex flex-col gap-10 lg:gap-12">
        <div data-reveal>
          <SectionHead
            eyebrow={t("companies.benefits.eyebrow")}
            title={t("companies.benefits.title")}
            text={t("companies.intro.text")}
          />
        </div>
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {benefits.map((benefit, index) => {
            const first = index === 0;
            return (
              <li
                key={benefit.key}
                data-reveal
                className={cx(
                  "jm-lift relative flex flex-col gap-3 overflow-hidden rounded-[28px] p-6 lg:min-h-[280px] lg:p-7",
                  first ? "bg-sapin text-blanc" : "bg-blanc ring-1 ring-sapin/6",
                )}
                style={stagger(index)}
              >
                <IconTile
                  icon={benefit.icon}
                  className={first ? "bg-lime text-sapin" : "bg-lime-clair text-sapin"}
                />
                <span className="flex-1" />
                <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em]">
                  {t(`companies.benefits.${benefit.key}.title`)}
                </h3>
                <p
                  className={cx(
                    "text-[15px] leading-[23px]",
                    first ? "text-blanc/80" : "text-ardoise",
                  )}
                >
                  {t(`companies.benefits.${benefit.key}.text`)}
                </p>
              </li>
            );
          })}
        </ul>
      </MarketingSection>

      {/* Roles */}
      <MarketingSection
        tone="blanc"
        scene
        innerClassName="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-[88px]"
      >
        <div data-reveal className="flex flex-col gap-5 lg:flex-1">
          <SectionHead
            eyebrow={t("companies.roles.eyebrow")}
            title={t("companies.roles.title")}
            text={t("companies.roles.text")}
          />
          <ul className="flex flex-wrap gap-2">
            {roleChips.map((chip, index) => (
              <li
                key={chip.key}
                data-reveal
                className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-papier px-3.5 text-[13px] font-semibold ring-1 ring-sapin/10 ring-inset"
                style={stagger(index)}
              >
                <Icon name={chip.icon} className="size-3.5" />
                {t(`companies.roles.chip.${chip.key}`)}
              </li>
            ))}
          </ul>
        </div>
        <figure
          data-reveal="zoom"
          aria-label={t("companies.roles.imageAlt")}
          className="rounded-[32px] bg-papier px-[18px] py-4 ring-1 ring-sapin/8 lg:w-[540px] lg:shrink-0 lg:px-7 lg:py-6"
        >
          <div aria-hidden>
            <div className="flex items-center justify-between gap-3 pb-2">
              <span className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-sapin text-xs font-bold text-lime">
                  {t("companies.hero.visual.orgInitials")}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">
                    {t("companies.hero.visual.orgName")}
                  </span>
                  <span className="text-[11px] leading-[15px] text-ardoise">
                    {t("companies.roles.example.members")}
                  </span>
                </span>
              </span>
              {featuredPlan && (
                <span className="inline-flex h-6 items-center rounded-pill bg-brume px-2.5 text-[11px] font-semibold">
                  {featuredPlan.name}
                </span>
              )}
            </div>
            <ul>
              {members.map((member, index) => {
                const slot = `member${index + 1}` as `member${1 | 2 | 3 | 4 | 5}`;
                const name = t(`companies.roles.example.${slot}.name`);
                return (
                  <li
                    key={member.role}
                    data-reveal
                    className={cx(
                      "flex items-center gap-3 px-1 py-3.5",
                      index > 0 && "border-t border-brume",
                    )}
                    style={stagger(index)}
                  >
                    <span
                      className={cx(
                        "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        member.avatar,
                      )}
                    >
                      {initialsOf(name)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-semibold">{name}</span>
                      <span className="text-[11px] leading-[15px] text-ardoise">
                        {t(`companies.roles.example.${slot}.team`)}
                      </span>
                    </span>
                    <span
                      className={cx(
                        "inline-flex h-7 items-center rounded-pill px-3 text-[11px] font-semibold",
                        member.tag,
                      )}
                    >
                      {t(`companies.roles.chip.${member.role}`)}
                    </span>
                    <Icon name="chev-d" className="hidden size-4 text-ardoise sm:block" />
                  </li>
                );
              })}
            </ul>
          </div>
        </figure>
      </MarketingSection>

      {/* Commitments */}
      <MarketingSection tone="sapin" innerClassName="flex flex-col gap-10">
        <div data-reveal>
          <SectionHead
            center
            dark
            eyebrow={t("companies.guarantees.eyebrow")}
            title={t("companies.guarantees.title")}
          />
        </div>
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {guarantees.map((item, index) => (
            <li
              key={item.key}
              data-reveal
              className="jm-lift flex flex-col gap-3.5 rounded-[28px] bg-blanc/8 p-6 ring-1 ring-blanc/12 ring-inset lg:p-7"
              style={stagger(index)}
            >
              <IconTile icon={item.icon} size={48} className="bg-lime text-sapin" />
              <p className="text-[15.5px] leading-6">{t(`companies.guarantees.${item.key}`)}</p>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {/* Company plans */}
      <MarketingSection tone="lime" innerClassName="flex flex-col gap-10">
        <div data-reveal>
          <SectionHead
            center
            eyebrow={t("companies.plans.eyebrow")}
            title={t("companies.plans.title")}
            text={t("companies.plans.text")}
          />
        </div>
        <div data-reveal="zoom">
          <PublicPlanCards plans={plans} family="company" />
        </div>
        <div
          data-reveal
          className="flex flex-col gap-4 rounded-[28px] bg-blanc py-3 pr-3 pl-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-center gap-3 text-sm font-medium">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime-clair">
              <Icon name="mobile-money" className="size-5" />
            </span>
            {t("companies.plans.payment")}
          </p>
          <SiteButton href="/tarifs#companies" className="self-start sm:self-auto">
            {t("companies.plans.cta")}
          </SiteButton>
        </div>
      </MarketingSection>

      {/* Quote and partners */}
      <section className="bg-papier pt-14 lg:pt-24">
        <div className="mx-auto grid w-full max-w-[1200px] gap-3.5 px-4 lg:grid-cols-2 lg:gap-5 xl:px-0">
          <div
            data-reveal
            className="jm-lift relative flex flex-col gap-4 overflow-hidden rounded-[32px] bg-lime-clair p-6 text-sapin lg:p-10"
          >
            <span className="relative self-start">
              <IconTile icon="entreprise" size={56} className="bg-nuit text-lime" />
            </span>
            <h2 className="relative text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
              {t("companies.quote.title")}
            </h2>
            <p className="relative text-[15px] leading-6">{t("companies.quote.text")}</p>
            <SiteButton href={quoteHref} className="relative self-start">
              {t("companies.quote.cta")}
            </SiteButton>
          </div>
          <div
            data-reveal
            className="jm-lift relative flex flex-col gap-4 overflow-hidden rounded-[32px] bg-blanc p-6 ring-1 ring-sapin/6 lg:p-10"
            style={stagger(1)}
          >
            <span className="relative self-start">
              <IconTile icon="certificat" size={56} className="bg-lime text-sapin" />
            </span>
            <h2 className="relative text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
              {t("companies.partners.title")}
            </h2>
            <p className="relative text-[15px] leading-6 text-ardoise">
              {t("companies.partners.text")}
            </p>
            <span className="flex-1" />
            <ArrowLink href="/partenaires" className="relative text-feuille-fonce">
              {t("companies.partners.cta")}
            </ArrowLink>
          </div>
        </div>
      </section>

      <section aria-hidden className="h-14 bg-papier lg:h-24" />
      <LimeCtaBand
        title={t("companies.finalCta.title")}
        text={t("companies.finalCta.text")}
        actions={
          <>
            <SiteButton href={signup}>{t("companies.finalCta.primary")}</SiteButton>
            <SiteButton href={quoteHref} tone="light">
              {t("companies.finalCta.secondary")}
            </SiteButton>
          </>
        }
      />
    </>
  );
}

/**
 * Hero picture: the shared pipeline in a Sapin frame, M. Diallo with his phone, the verified
 * company card and the team on the job. Decorative labels are part of the illustration,
 * described by its alternative text.
 */
function HeroVisual({
  alt,
  orgInitials,
  orgName,
  verified,
  team,
  initials,
}: {
  alt: string;
  orgInitials: string;
  orgName: string;
  verified: string;
  team: string;
  initials: string[];
}) {
  return (
    <>
      <div className="relative pt-20 pb-24 lg:py-24 lg:pl-8">
        <PipelinePreview label={alt} className="jm-float-slow" />
      </div>
      <FloatCard
        className="jm-pop top-2 left-3 flex items-center gap-2.5 lg:top-4 lg:-left-2"
        style={stagger(0)}
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-nuit text-xs font-bold text-lime">
          {orgInitials}
        </span>
        <span className="flex flex-col">
          <span className="text-xs leading-[17px] font-semibold">{orgName}</span>
          <span className="flex items-center gap-1 text-[11px] leading-[15px] text-feuille-fonce">
            <Icon name="valider" className="size-3" />
            {verified}
          </span>
        </span>
      </FloatCard>
      <FloatCard
        className="jm-pop bottom-2 left-3 flex items-center gap-2.5 lg:bottom-4 lg:-left-2"
        style={stagger(1)}
      >
        <span className="flex">
          {initials.map((value, index) => (
            <span
              key={value}
              className={cx(
                "flex size-[34px] items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-blanc",
                index > 0 && "-ml-2",
                avatarTones[index % avatarTones.length],
              )}
            >
              {value.trim()}
            </span>
          ))}
        </span>
        <span className="text-xs leading-[17px] font-semibold">{team}</span>
      </FloatCard>
    </>
  );
}
