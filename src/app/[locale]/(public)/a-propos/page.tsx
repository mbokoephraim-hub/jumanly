/* eslint-disable @next/next/no-img-element -- brand symbol is a static SVG */
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  Eyebrow,
  Glow,
  IconTile,
  ImmersiveBackdrop,
  LimeCtaBand,
  MarketingSection,
  PathLine,
  Pattern,
  PoseCycle,
  SectionHead,
  Shape,
  iaFlow,
  lead,
  outlineOnLime,
  signatureLight,
  stagger,
} from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({ params }: PageProps<"/[locale]/a-propos">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("about.seo");
  return pageMetadata({ path: "/a-propos", title: t("title"), description: t("description") });
}

const universes = [
  {
    key: "edtech",
    icon: "learn",
    circle: "bg-lime",
    tile: "bg-lime text-sapin",
    x: 0,
    y: 0,
    tx: 20,
    ty: 80,
  },
  {
    key: "careertech",
    icon: "career",
    circle: "bg-neon",
    tile: "bg-neon text-sapin",
    x: 300,
    y: 0,
    tx: 400,
    ty: 80,
  },
  {
    key: "hrtech",
    icon: "hire",
    circle: "bg-brume",
    tile: "bg-brume text-sapin",
    x: 150,
    y: 250,
    tx: 210,
    ty: 420,
  },
] as const;

const values = [
  { key: "access", icon: "competence", span: "lg:col-span-2" },
  { key: "fairness", icon: "check", span: "lg:col-span-2" },
  { key: "transparency", icon: "eye", span: "lg:col-span-2" },
  { key: "humanDecision", icon: "profil", span: "lg:col-span-3" },
  { key: "privacy", icon: "lock", span: "lg:col-span-3" },
] as const;

const launchSteps = ["step1", "step2", "step3"] as const;

const chips: { key: "learn" | "exchange" | "recruit"; icon: IconName; position: string }[] = [
  { key: "learn", icon: "learn", position: "top-9 left-8" },
  { key: "exchange", icon: "connect", position: "top-24 left-[236px]" },
  { key: "recruit", icon: "hire", position: "top-9 right-8" },
];

export default async function AboutPage({ params }: PageProps<"/[locale]/a-propos">) {
  await applySiteLocale(params);
  const t = await getTranslations("about");
  const cardTitle =
    "text-[28px] leading-[34px] font-semibold tracking-[-0.025em] lg:text-[32px] lg:leading-[42px]";
  return (
    <>
      <MotionRoot />

      {/* Hero, on the depth gradient */}
      <MarketingSection
        tone="profondeur"
        scene
        spotlight
        className="pt-12 pb-16 lg:pt-[72px] lg:pb-24"
        background={<ImmersiveBackdrop />}
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:gap-14">
          <div className="relative z-10 flex flex-col gap-6 xl:w-[560px] xl:shrink-0">
            <div className="jm-rise" style={stagger(0)}>
              <Eyebrow dark>{t("hero.eyebrow")}</Eyebrow>
            </div>
            <h1
              className="jm-word text-[36px] leading-10 font-semibold tracking-[-0.035em] lg:text-[56px] lg:leading-[60px]"
              style={stagger(1)}
            >
              {t("hero.title")}
            </h1>
            <p className={cx(lead, "jm-rise text-blanc/80")} style={stagger(3)}>
              {t("hero.text")}
            </p>
          </div>
          <div
            role="img"
            aria-label={t("hero.imageAlt")}
            className="jm-rise relative h-[360px] overflow-hidden rounded-card bg-blanc/6 ring-1 ring-blanc/12 ring-inset xl:h-[600px] xl:min-w-0 xl:flex-1 xl:rounded-[40px]"
            style={stagger(4)}
          >
            <Shape
              name="forme-orbites-lime"
              className="jm-drift -top-[50px] -left-10 w-[220px] opacity-35 xl:w-[380px]"
            />
            <Shape
              name="forme-halo-couleur"
              className="jm-drift -right-40 -bottom-40 w-[520px] opacity-50"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-1.5">
              <span className="xl:hidden">
                <PoseCycle name="nadia" poses={["salut", "joie"]} height={220} />
              </span>
              <span className="xl:hidden">
                <PoseCycle name="kofi" poses={["joie", "salut"]} height={240} />
              </span>
              <span className="hidden xl:block">
                <PoseCycle name="nadia" poses={["salut", "joie"]} height={360} />
              </span>
              <span className="hidden xl:block">
                <PoseCycle name="kofi" poses={["joie", "salut"]} height={390} />
              </span>
              <span className="hidden xl:block">
                <PoseCycle name="diallo" poses={["montre", "salut"]} height={360} />
              </span>
            </div>
            {chips.map((chip, index) => (
              <div
                key={chip.key}
                aria-hidden
                className={cx(
                  "jm-pop absolute z-10 hidden items-center gap-2.5 rounded-md bg-blanc px-4 py-3 text-sapin shadow-[0_18px_40px_rgba(11,26,31,0.35)] xl:flex",
                  chip.position,
                )}
                style={stagger(index)}
              >
                <IconTile icon={chip.icon} size={34} className="bg-lime text-sapin" />
                <span className="text-[13px] font-semibold">{t(`hero.chips.${chip.key}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </MarketingSection>

      {/* Vision and mission: two cards whose gradient flows */}
      <MarketingSection
        scene
        background={
          <>
            <Glow className="-top-40 -left-32 size-[460px] bg-lime/35" />
            <Glow className="-right-40 -bottom-40 size-[520px] bg-menthe/25" delay={-8} />
          </>
        }
      >
        <div className="grid gap-3.5 lg:grid-cols-2 lg:gap-5">
          {(
            [
              {
                key: "vision",
                icon: "objectif",
                card: "text-blanc",
                gradient: iaFlow,
                tile: "bg-lime text-sapin",
                arc: "forme-trajectoire-lime",
              },
              {
                key: "mission",
                icon: "career",
                card: "text-sapin",
                gradient: signatureLight,
                tile: "bg-sapin text-lime",
                arc: "forme-trajectoire-sapin",
              },
            ] as const
          ).map((item, index) => (
            <div
              key={item.key}
              data-reveal
              className={cx(
                "jm-flow jm-lift relative flex flex-col gap-[18px] overflow-hidden rounded-box p-7 lg:rounded-card lg:p-11",
                item.card,
              )}
              style={{ ...stagger(index), backgroundImage: item.gradient }}
            >
              <Shape
                name={item.arc}
                className="jm-drift -right-10 -bottom-10 w-[220px] opacity-18"
              />
              <IconTile icon={item.icon} size={56} className={item.tile} />
              <h2 className={cardTitle}>{t(`${item.key}.title`)}</h2>
              <p className="relative text-[17px] leading-7 opacity-88 lg:text-[19px] lg:leading-[30px]">
                {t(`${item.key}.text`)}
              </p>
            </div>
          ))}
        </div>
      </MarketingSection>

      {/* Positioning */}
      <MarketingSection
        tone="lime"
        scene
        innerClassName="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-20"
      >
        <div data-reveal className="flex min-w-0 flex-1 flex-col gap-6">
          <SectionHead
            eyebrow={t("positioning.eyebrow")}
            title={t("positioning.title")}
            text={t("positioning.intro")}
          />
          <div className="mt-2 flex flex-col gap-2.5 rounded-box bg-blanc p-5 lg:rounded-card lg:p-7">
            <h3 className="flex items-center gap-2.5 text-xl leading-[26px] font-semibold tracking-[-0.015em]">
              <Icon name="connect" className="size-5 shrink-0 text-feuille-fonce" />
              {t("continuity.title")}
            </h3>
            <p className="text-[15px] leading-6 text-ardoise">{t("continuity.text")}</p>
          </div>
        </div>
        {/* Three universes: overlapping discs on desktop, a list of cards on mobile. */}
        <ul
          data-reveal="zoom"
          className="flex flex-col gap-3 lg:relative lg:block lg:h-[590px] lg:w-[640px] lg:shrink-0"
        >
          {universes.map((universe, index) => (
            <li key={universe.key} className="contents">
              <span
                aria-hidden
                className={cx(
                  "jm-float-slow absolute hidden size-[340px] rounded-full opacity-92 mix-blend-multiply lg:block",
                  universe.circle,
                )}
                style={{ left: universe.x, top: universe.y, animationDelay: `${index * -3}s` }}
              />
              <div
                className="flex gap-4 rounded-box bg-blanc p-5 lg:absolute lg:top-[var(--ty)] lg:left-[var(--tx)] lg:w-[220px] lg:flex-col lg:items-center lg:gap-2 lg:bg-transparent lg:p-0 lg:text-center"
                style={{ "--tx": `${universe.tx}px`, "--ty": `${universe.ty}px` } as CSSProperties}
              >
                <IconTile
                  icon={universe.icon}
                  size={48}
                  className={cx(universe.tile, "lg:hidden")}
                />
                <IconTile
                  icon={universe.icon}
                  size={44}
                  className="hidden bg-sapin text-lime lg:flex"
                />
                <div className="flex flex-col gap-1 lg:items-center lg:gap-2">
                  <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
                    {t(`positioning.${universe.key}.title`)}
                  </h3>
                  <p className="text-sm leading-[22px] text-ardoise lg:text-[13px] lg:leading-[19px] lg:text-sapin/85">
                    {t(`positioning.${universe.key}.text`)}
                  </p>
                </div>
              </div>
            </li>
          ))}
          <li
            aria-hidden
            className="absolute top-[215px] left-[265px] hidden size-[110px] items-center justify-center rounded-full bg-sapin shadow-[0_0_0_8px_rgba(228,250,208,0.9),0_0_40px_rgba(166,242,107,0.6)] lg:flex"
          >
            <img
              src="/marque/jumanly-symbole-lime.svg"
              alt=""
              width={56}
              height={56}
              className="jm-pulse"
            />
          </li>
        </ul>
      </MarketingSection>

      {/* Values */}
      <MarketingSection
        tone="profondeur"
        scene
        background={
          <>
            <Pattern name="motif-points-sombre" opacity={0.25} />
            <Glow className="-top-40 left-1/4 size-[520px] bg-feuille/30" />
            <Glow className="-right-32 -bottom-48 size-[460px] bg-menthe/20" delay={-9} />
          </>
        }
        innerClassName="flex flex-col gap-12"
      >
        <div data-reveal>
          <SectionHead center dark eyebrow={t("values.eyebrow")} title={t("values.title")} />
        </div>
        <ol className="grid gap-3.5 lg:grid-cols-6 lg:gap-5">
          {values.map((value, index) => (
            <li
              key={value.key}
              data-reveal
              className={cx(
                "jm-lift flex flex-col gap-3 rounded-box bg-blanc/7 p-5 ring-1 ring-blanc/12 backdrop-blur-sm ring-inset lg:rounded-card lg:p-7",
                value.span,
              )}
              style={stagger(index % 3)}
            >
              <div className="flex items-start justify-between">
                <IconTile icon={value.icon} className="bg-lime text-sapin" />
                <span aria-hidden className="text-[40px] leading-10 font-semibold text-blanc/14">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-[21px] lg:leading-[30px]">
                {t(`values.${value.key}.title`)}
              </h3>
              <p className="text-[15px] leading-[23px] text-blanc/70">
                {t(`values.${value.key}.text`)}
              </p>
            </li>
          ))}
        </ol>
      </MarketingSection>

      {/* The Growth Lab and launch */}
      <MarketingSection
        scene
        background={<Glow className="-top-32 right-1/4 size-[420px] bg-lime/40" delay={-11} />}
      >
        <div className="grid gap-3.5 lg:grid-cols-2 lg:gap-6">
          <div
            data-reveal
            className="jm-lift flex flex-col gap-[18px] rounded-box bg-lime-clair p-7 lg:rounded-card lg:p-11"
          >
            <div className="flex items-center gap-4">
              <img src="/marque/jumanly-symbole-lime.svg" alt="" width={56} height={56} />
              <span className="text-lab text-ardoise">{t("growthlab.eyebrow")}</span>
            </div>
            <h2 className={cardTitle}>{t("growthlab.title")}</h2>
            <p className="text-[15px] leading-[26px] text-ardoise lg:text-base">
              {t("growthlab.text")}
            </p>
            <p className="flex items-center gap-2 text-[15px] font-semibold text-feuille-fonce">
              <Icon name="check" className="size-4 shrink-0" />
              {t("growthlab.signature")}
            </p>
          </div>
          <div
            data-reveal
            className="jm-lift relative flex flex-col gap-[18px] overflow-hidden rounded-box bg-gradient-depth p-7 text-blanc lg:rounded-card lg:p-11"
            style={stagger(1)}
          >
            <Glow className="-top-24 -right-24 size-[300px] bg-feuille/40" />
            <Eyebrow dark>{t("launch.eyebrow")}</Eyebrow>
            <h2 className={cardTitle}>{t("launch.title")}</h2>
            <p className="text-[15px] leading-[26px] text-blanc/78 lg:text-base">
              {t("launch.text")}
            </p>
            {/* The launch path draws itself, each step lighting up in turn. */}
            <ol data-reveal className="relative mt-1 flex flex-col gap-4">
              <li aria-hidden className="absolute top-[22px] bottom-[22px] left-[21px] w-0.5">
                <PathLine id="jm-launch" vertical />
              </li>
              {launchSteps.map((step, index) => (
                <li key={step} className="relative flex items-center gap-3">
                  <span
                    aria-hidden
                    className="jm-glow flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-signature text-[17px] font-semibold text-sapin"
                    style={stagger(index)}
                  >
                    {index + 1}
                  </span>
                  <span className="text-[15px] font-semibold">{t(`launch.${step}`)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </MarketingSection>

      <LimeCtaBand
        animated
        title={t("cta.title")}
        character={{ name: "amani", pose: "joie", height: 330, mobileHeight: 240 }}
        actions={
          <>
            <ButtonLink
              href={signupHref()}
              variant="secondary"
              size="lg"
              iconAfter={<Icon name="chev-r" />}
            >
              {t("cta.primary")}
            </ButtonLink>
            <ButtonLink
              href="/contact"
              variant="tertiary"
              size="lg"
              icon={<Icon name="message" />}
              className={outlineOnLime}
            >
              {t("cta.secondary")}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
