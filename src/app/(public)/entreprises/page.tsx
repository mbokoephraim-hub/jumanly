/* eslint-disable @next/next/no-img-element -- product previews are static WebP files already sized */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  ArrowLink,
  Glow,
  IconTile,
  LimeCtaBand,
  MarketingSection,
  Pattern,
  SectionHead,
  Shape,
  lead,
  outlineOnLime,
  stagger,
} from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { PublicPlanCards } from "@/components/site/pricing";
import { ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";
import { getPublicPlans } from "@/server/queries/public";
import { lowestPaidPrice, plansOf } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("companies.seo");
  const from = lowestPaidPrice(await getPublicPlans(), "company");
  return pageMetadata({
    path: "/entreprises",
    title: t("title"),
    description: t("description", { price: from === null ? "" : formatUsd(from) }),
  });
}

const chevron = <Icon name="chev-r" />;
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
  "bg-feuille-fonce text-blanc",
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function CompaniesPage() {
  const t = await getTranslations();
  const plans = await getPublicPlans();
  const signup = signupHref({ profil: "company" });
  // The plan tag of the members illustration: the recommended Company plan, read from the database.
  const featuredPlan = plansOf(plans, "company").find((plan) => plan.recommended);

  return (
    <>
      <MotionRoot />

      {/* Hero, on Crème lit by drifting brand lights */}
      <MarketingSection
        scene
        className="pt-10 pb-14 lg:pt-[72px] lg:pb-24"
        background={
          <>
            <Glow className="-top-48 -left-40 size-[560px] bg-lime/45" />
            <Glow className="top-1/3 -right-48 size-[620px] bg-menthe/30" delay={-7} />
            <Glow className="-bottom-56 left-1/3 size-[480px] bg-neon/50" delay={-14} />
          </>
        }
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:gap-14">
          <div className="relative z-1 flex flex-col gap-6 xl:w-[540px] xl:shrink-0">
            <p
              className="jm-rise text-[13px] leading-[18px] font-medium tracking-[0.12em] text-feuille-fonce uppercase"
              style={stagger(0)}
            >
              {t("companies.hero.eyebrow")}
            </p>
            <h1
              className="jm-word text-[36px] leading-10 font-semibold tracking-[-0.035em] lg:text-[56px] lg:leading-[60px]"
              style={stagger(1)}
            >
              {t("companies.hero.title")}
            </h1>
            <p className={cx(lead, "jm-rise text-sapin/85")} style={stagger(3)}>
              {t("companies.hero.text")}
            </p>
            <div className="jm-rise flex flex-col gap-3 sm:flex-row" style={stagger(4)}>
              <ButtonLink
                href={signup}
                size="lg"
                iconAfter={chevron}
                className="shadow-[0_0_32px_rgba(166,242,107,0.55)]"
              >
                {t("companies.hero.cta")}
              </ButtonLink>
              <ButtonLink href={quoteHref} variant="tertiary" size="lg">
                {t("companies.hero.secondary")}
              </ButtonLink>
            </div>
            <p
              className="jm-rise inline-flex items-center gap-2 self-start rounded-pill bg-blanc py-2 pr-4 pl-2.5 text-[13.5px] leading-5 font-semibold"
              style={stagger(5)}
            >
              <Icon name="check" className="size-[18px] text-feuille-fonce" />
              {t("companies.hero.badge")}
            </p>
          </div>
          <HeroVisual
            alt={t("companies.hero.imageAlt")}
            orgInitials={t("companies.hero.visual.orgInitials")}
            orgName={t("companies.hero.visual.orgName")}
            verified={t("common.verifiedCompany")}
            team={t("companies.hero.visual.team")}
            initials={t("companies.hero.visual.initials").split(",")}
          />
        </div>
      </MarketingSection>

      {/* Why Company */}
      <MarketingSection className="pt-0 lg:pt-6" innerClassName="flex flex-col gap-10 lg:gap-12">
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
                  "jm-lift relative flex flex-col gap-3 overflow-hidden rounded-card p-6 lg:min-h-[280px] lg:p-7",
                  first ? "jm-flow bg-sapin text-blanc" : "bg-blanc",
                )}
                style={{
                  ...stagger(index),
                  ...(first
                    ? {
                        backgroundImage:
                          "linear-gradient(135deg, #0F3F37 0%, #14745F 45%, #0F3F37 75%, #14745F 100%)",
                      }
                    : {}),
                }}
              >
                <IconTile
                  icon={benefit.icon}
                  className={first ? "bg-lime text-sapin" : "bg-creme text-sapin"}
                />
                <span className="flex-1" />
                <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em]">
                  {t(`companies.benefits.${benefit.key}.title`)}
                </h3>
                <p className="text-[15px] leading-[23px] opacity-78">
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
        background={<Glow className="top-1/4 -right-40 size-[480px] bg-lime/25" delay={-5} />}
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
                className="inline-flex h-[34px] items-center gap-1.5 rounded-pill bg-blanc px-3.5 text-[12.5px] font-medium ring-[1.5px] ring-brume ring-inset"
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
          className="jm-ring rounded-card bg-blanc px-[18px] py-4 shadow-[0_30px_60px_rgba(11,26,31,0.12)] lg:w-[540px] lg:shrink-0 lg:px-7 lg:py-6"
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
      <MarketingSection
        tone="profondeur"
        scene
        background={
          <>
            <Pattern name="motif-reseau-sombre" opacity={0.25} />
            <Glow className="-top-40 left-1/4 size-[520px] bg-feuille/30" />
            <Glow className="-right-32 -bottom-48 size-[460px] bg-menthe/20" delay={-9} />
          </>
        }
        innerClassName="flex flex-col gap-10"
      >
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
              className="jm-lift flex flex-col gap-3.5 rounded-card bg-blanc/7 p-6 ring-1 ring-blanc/12 backdrop-blur-sm ring-inset lg:p-7"
              style={stagger(index)}
            >
              <IconTile icon={item.icon} size={48} className="bg-lime text-sapin" />
              <p className="text-[15.5px] leading-6">{t(`companies.guarantees.${item.key}`)}</p>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {/* Company plans */}
      <MarketingSection
        tone="lime"
        scene
        background={<Glow className="-top-32 right-1/4 size-[420px] bg-lime/50" delay={-11} />}
        innerClassName="flex flex-col gap-10"
      >
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
          className="flex flex-col gap-4 rounded-box bg-blanc px-6 py-[18px] sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-center gap-3 text-sm font-medium">
            <Icon name="mobile-money" className="size-[22px] shrink-0" />
            {t("companies.plans.payment")}
          </p>
          <ButtonLink
            href="/tarifs#companies"
            variant="secondary"
            iconAfter={chevron}
            className="self-start sm:self-auto"
          >
            {t("companies.plans.cta")}
          </ButtonLink>
        </div>
      </MarketingSection>

      {/* Quote and partners */}
      <section data-scene className="bg-creme pt-14 lg:pt-24">
        <div className="mx-auto grid w-full max-w-[1200px] gap-3.5 px-4 lg:grid-cols-2 lg:gap-5 xl:px-0">
          <div
            data-reveal
            className="jm-flow jm-lift relative flex flex-col gap-4 overflow-hidden rounded-card bg-neon p-6 text-sapin lg:p-10"
            style={{
              backgroundImage:
                "linear-gradient(120deg, #E3F67C 0%, #D9FA72 35%, #BFEFDF 70%, #E3F67C 100%)",
            }}
          >
            <Pattern name="motif-pastilles-lime" opacity={0.12} />
            <span className="jm-float relative self-start">
              <IconTile icon="entreprise" size={56} className="bg-sapin text-lime" />
            </span>
            <h2 className="relative text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
              {t("companies.quote.title")}
            </h2>
            <p className="relative text-[15px] leading-6">{t("companies.quote.text")}</p>
            <ButtonLink
              href={quoteHref}
              variant="secondary"
              size="lg"
              iconAfter={chevron}
              className="relative self-start"
            >
              {t("companies.quote.cta")}
            </ButtonLink>
          </div>
          <div
            data-reveal
            className="jm-lift relative flex flex-col gap-4 overflow-hidden rounded-card bg-blanc p-6 lg:p-10"
            style={stagger(1)}
          >
            <Glow className="-right-24 -bottom-24 size-[280px] bg-lime/35" delay={-4} />
            <span className="jm-float relative self-start" style={{ animationDelay: "-3s" }}>
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

      <LimeCtaBand
        animated
        spacedTop
        title={t("companies.finalCta.title")}
        text={t("companies.finalCta.text")}
        character={{ name: "diallo", pose: "joie", height: 330, mobileHeight: 250 }}
        actions={
          <>
            <ButtonLink href={signup} variant="secondary" size="lg" iconAfter={chevron}>
              {t("companies.finalCta.primary")}
            </ButtonLink>
            <ButtonLink href={quoteHref} variant="tertiary" size="lg" className={outlineOnLime}>
              {t("companies.finalCta.secondary")}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}

/**
 * Hero visual (mockup 01-05): the shared pipeline on a Sapin panel, M. Diallo with his phone,
 * the verified company card and the team on the job. Decorative labels are part of the
 * illustration, described by its alternative text.
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
  const shadow = "shadow-[0_30px_60px_rgba(0,0,0,0.32)]";
  const card =
    "absolute z-2 flex items-center gap-2.5 rounded-[18px] bg-blanc px-4 py-3 text-sapin shadow-[0_18px_40px_rgba(11,26,31,0.22)]";
  return (
    <>
      {/* Desktop: 620 px stage */}
      <div
        className="jm-rise jm-flow relative hidden h-[620px] min-w-0 flex-1 overflow-hidden rounded-[40px] bg-sapin xl:block"
        style={{
          ...stagger(4),
          backgroundImage:
            "linear-gradient(135deg, #0F3F37 0%, #14745F 40%, #0F3F37 70%, #1C8A72 100%)",
        }}
      >
        <Pattern name="motif-trajectoires-sombre" size={420} opacity={0.4} />
        <Shape
          name="forme-halo-couleur"
          className="jm-drift -right-40 -bottom-40 w-[520px] opacity-40"
        />
        <div className="jm-float-slow absolute top-20 left-[70px]">
          <img
            src="/apercus/recruteurs-pipeline.webp"
            alt={alt}
            width={760}
            height={540}
            fetchPriority="high"
            className={cx("w-[760px] max-w-none rounded-[18px]", shadow)}
          />
        </div>
        <div className="jm-breathe absolute right-0 bottom-0">
          <Character name="diallo" pose="telephone" height={330} />
        </div>
        <div aria-hidden className={cx(card, "jm-pop top-6 left-6")} style={stagger(0)}>
          <span className="flex size-9 items-center justify-center rounded-[11px] bg-sapin text-xs font-bold text-lime">
            {orgInitials}
          </span>
          <span className="flex flex-col">
            <span className="text-xs leading-[17px] font-semibold">{orgName}</span>
            <span className="flex items-center gap-1 text-[11px] leading-[15px] text-feuille-fonce">
              <Icon name="valider" className="size-3" />
              {verified}
            </span>
          </span>
        </div>
        <div aria-hidden className={cx(card, "jm-pop bottom-10 left-10")} style={stagger(1)}>
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
        </div>
      </div>

      {/* Mobile and tablet: 360 px panel */}
      <div
        className="jm-rise relative h-[360px] overflow-hidden rounded-[28px] bg-gradient-depth xl:hidden"
        style={stagger(6)}
      >
        <Pattern name="motif-trajectoires-sombre" size={300} opacity={0.4} />
        <div className="jm-float absolute top-9 left-5">
          <img
            src="/apercus/recruteurs-pipeline.webp"
            alt={alt}
            width={560}
            height={398}
            className={cx("w-[560px] max-w-none rounded-[18px]", shadow)}
          />
        </div>
        <div className="jm-breathe absolute -right-1.5 -bottom-1">
          <Character name="diallo" pose="telephone" height={230} />
        </div>
      </div>
    </>
  );
}
