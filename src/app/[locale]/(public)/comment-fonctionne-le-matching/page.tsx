import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  Eyebrow,
  FaqAccordion,
  IconTile,
  MarketingSection,
  SiteButton,
  SiteHero,
  lead,
  sectionTitle,
  stagger,
} from "@/components/site/marketing";
import { CountUp, MotionRoot } from "@/components/site/motion";
import { cx } from "@/lib/cx";
import { pageMetadata } from "@/lib/seo";
import { joinHref } from "@/lib/signup";
import { getMatchingWeights } from "@/server/queries/public";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/comment-fonctionne-le-matching">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("matchingPage.meta");
  return pageMetadata({
    path: "/comment-fonctionne-le-matching",
    title: t("title"),
    description: t("description"),
  });
}

/** The eight criteria of the texts (s2.list.1 to 8), with their icons. */
const criteria: { n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; icon: IconName }[] = [
  { n: 1, icon: "competence" },
  { n: 2, icon: "ajouter" },
  { n: 3, icon: "career" },
  { n: 4, icon: "localisation" },
  { n: 5, icon: "doc" },
  { n: 6, icon: "langue" },
  { n: 7, icon: "diplome" },
  { n: 8, icon: "calendrier" },
];

/** Weights shown in section 3: four criteria, read from the active MatchingWeights. */
const weightRows = [
  { key: "skills_required", label: "requiredSkills" },
  { key: "experience", label: "experience" },
  { key: "skills_preferred", label: "preferredSkills" },
  { key: "languages", label: "languages" },
] as const;

/** Bands (partie 08): AI gradient, AI green, Menthe claire, Brume. Never coral. */
const bands = [
  { band: "veryHigh", className: "bg-gradient-ai text-blanc" },
  { band: "high", className: "bg-ia text-[#0b1a1f]" },
  { band: "partial", className: "bg-menthe-claire text-sapin" },
  { band: "low", className: "bg-brume text-sapin" },
] as const;

const never = [1, 2, 3, 4, 5, 6, 7] as const;

const sectionNav = [
  { key: "s1", target: "score" },
  { key: "s2", target: "criteres" },
  { key: "s6", target: "jamais" },
  { key: "s8", target: "controle" },
] as const;

/** The matching explained to everyone (partie 08 § 8.6), linked from every « Pourquoi ? ». */
export default async function MatchingPage({
  params,
}: PageProps<"/[locale]/comment-fonctionne-le-matching">) {
  await applySiteLocale(params);
  const t = await getTranslations();
  const weights = await getMatchingWeights();
  const score = 87;

  return (
    <>
      <MotionRoot />

      <SiteHero
        tone="nuit"
        eyebrow={t("matchingPage.eyebrow")}
        title={t("matchingPage.title")}
        text={t("matchingPage.lead")}
        extra={
          <nav aria-label={t("matchingPage.nav.label")}>
            <ul className="flex flex-wrap gap-2">
              {sectionNav.map((item) => (
                <li key={item.key}>
                  <a
                    href={`#${item.target}`}
                    className="inline-flex h-[30px] items-center rounded-pill bg-blanc/10 px-3 text-[11px] font-semibold ring-1 ring-blanc/20 transition-colors ring-inset hover:bg-blanc/20"
                  >
                    {t(`matchingPage.nav.${item.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        }
        visual={
          <ScoreRing
            score={score}
            band={t("match.band.veryHigh.text")}
            why={t("common.why")}
            alt={t("matchingPage.hero.imageAlt")}
          />
        }
      />

      {/* 1 to 3: score, criteria, weights */}
      <MarketingSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <article
            id="score"
            data-reveal
            className="flex scroll-mt-24 flex-col gap-3.5 rounded-[28px] bg-blanc p-6 lg:p-7"
          >
            <h2 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
              {t("matchingPage.s1.title")}
            </h2>
            <p className="text-[15px] leading-6 text-ardoise">{t("matchingPage.s1.body")}</p>
            <div aria-hidden className="flex flex-col gap-2">
              <div
                className="jm-fill h-3.5 rounded-pill"
                style={{
                  background: "linear-gradient(90deg,#DCE5E1,#BFEFDF 50%,#14745F 70%,#0F3F37)",
                }}
              />
              <div className="flex justify-between text-[11px] leading-[15px] text-ardoise">
                {[0, 50, 70, 85, 100].map((mark) => (
                  <span key={mark}>{mark}</span>
                ))}
              </div>
            </div>
          </article>

          <article
            id="criteres"
            data-reveal
            className="flex scroll-mt-24 flex-col gap-3.5 rounded-[28px] bg-blanc p-6 lg:row-span-2 lg:p-7"
            style={stagger(1)}
          >
            <h2 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
              {t("matchingPage.s2.title")}
            </h2>
            <p className="text-[15px] leading-6 text-ardoise">{t("matchingPage.s2.body")}</p>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {criteria.map((criterion, index) => (
                <li
                  key={criterion.n}
                  data-reveal
                  className="jm-lift flex items-center gap-3 rounded-[16px] bg-blanc px-4 py-3.5"
                  style={stagger(index)}
                >
                  <IconTile
                    icon={criterion.icon}
                    size={34}
                    className="rounded-[12px] bg-lime-clair text-sapin"
                  />
                  <span className="text-[14.5px] leading-5 font-medium">
                    {t(`matchingPage.s2.list.${criterion.n}`)}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article
            data-reveal
            className="flex flex-col gap-3.5 rounded-[28px] bg-blanc p-6 lg:p-7"
            style={stagger(2)}
          >
            <h2 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
              {t("matchingPage.s3.title")}
            </h2>
            <p className="text-[15px] leading-6 text-ardoise">{t("matchingPage.s3.body")}</p>
            <div className="flex flex-col gap-3 rounded-[18px] bg-blanc p-4">
              {weightRows.map((row, index) => {
                const weight = weights.values[row.key];
                return (
                  <div key={row.key} className="flex flex-col gap-1.5">
                    <span className="flex justify-between gap-2 text-xs leading-[17px]">
                      {t(`match.criterion.${row.label}.text`)}
                      <span className="font-semibold">
                        {t("match.criterion.weight", { weight })}
                      </span>
                    </span>
                    <span aria-hidden className="block h-2 overflow-hidden rounded-pill bg-brume">
                      <span
                        className="jm-fill block h-full rounded-pill bg-gradient-ai"
                        style={{
                          width: `${Math.min(100, weight * 2.4)}%`,
                          animationDelay: `${1.2 + index * 0.2}s`,
                        }}
                      />
                    </span>
                  </div>
                );
              })}
              <span className="text-[11px] leading-[15px] text-ardoise">
                {t("matchingPage.s3.example")}
              </span>
            </div>
          </article>
        </div>
      </MarketingSection>

      {/* 4: bands */}
      <MarketingSection innerClassName="flex flex-col gap-8">
        <h2 data-reveal className={sectionTitle}>
          {t("matchingPage.s4.title")}
        </h2>
        <ul className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-5">
          {bands.map((item, index) => (
            <li
              key={item.band}
              data-reveal
              className={cx(
                "jm-lift flex min-h-[140px] flex-col gap-2.5 rounded-box p-5 lg:min-h-[170px] lg:p-[22px]",
                item.className,
              )}
              style={stagger(index)}
            >
              <span className="text-[22px] leading-7 font-semibold tracking-[-0.03em] lg:text-[30px] lg:leading-[34px]">
                {t(`match.band.${item.band}.range`)}
              </span>
              <span className="flex-1" />
              <span className="text-[15px] font-semibold">{t(`match.band.${item.band}.text`)}</span>
            </li>
          ))}
        </ul>
        <p
          data-reveal
          className="flex items-center gap-3 rounded-[20px] bg-blanc px-5 py-4 text-[15px] font-medium"
        >
          <Icon name="check" className="size-5 shrink-0 text-feuille-fonce" />
          {t("matchingPage.s4.note")}
        </p>
      </MarketingSection>

      {/* 5: the « Pourquoi ? » */}
      <MarketingSection
        tone="blanc"
        scene
        innerClassName="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-20"
      >
        <div data-reveal className="flex flex-col gap-5 lg:flex-1">
          <h2 className={sectionTitle}>{t("matchingPage.s5.title")}</h2>
          <p className={cx(lead, "text-ardoise")}>{t("matchingPage.s5.body")}</p>
          <p className="text-[11px] leading-[15px] text-ardoise">{t("matchingPage.s5.example")}</p>
        </div>
        <WhyCard score={score} />
      </MarketingSection>

      {/* 6: what we never use */}
      <MarketingSection
        id="jamais"
        tone="sapin"
        scene
        className="scroll-mt-20"
        innerClassName="flex flex-col gap-8"
      >
        <div data-reveal className="flex max-w-[780px] flex-col gap-4">
          <h2 className={sectionTitle}>{t("matchingPage.s6.title")}</h2>
          <p className={cx(lead, "text-blanc/75")}>{t("matchingPage.s6.body")}</p>
        </div>
        <ul className="flex flex-wrap gap-3">
          {never.map((n, index) => (
            <li
              key={n}
              data-reveal
              className="inline-flex h-[52px] items-center gap-2 rounded-pill bg-blanc/7 px-5 text-base font-medium ring-1 ring-blanc/18 ring-inset"
              style={stagger(index)}
            >
              <span
                aria-hidden
                className="flex size-6 items-center justify-center rounded-full bg-blanc/12"
              >
                <Icon name="fermer" className="size-3.5" />
              </span>
              {t(`matchingPage.s6.list.${n}`)}
            </li>
          ))}
        </ul>
        <p
          data-reveal
          className="flex items-center gap-4 rounded-box bg-lime px-5 py-5 text-base leading-6 font-medium text-sapin shadow-[0_0_40px_rgba(166,242,107,0.35)] lg:px-7"
        >
          <IconTile icon="portefeuille" size={48} className="bg-sapin text-lime" />
          {t("matchingPage.s6.plan")}
        </p>
      </MarketingSection>

      {/* 7 to 9: human control */}
      <MarketingSection id="controle" className="scroll-mt-20">
        <ul className="grid gap-5 lg:grid-cols-3">
          <ControlCard
            index={0}
            icon="profil"
            tile="bg-lime"
            title={t("matchingPage.s7.title")}
            body={t("matchingPage.s7.body")}
          />
          <ControlCard
            index={1}
            icon="edit"
            tile="bg-neon"
            title={t("matchingPage.s8.title")}
            body={t("matchingPage.s8.body")}
          >
            <span
              aria-hidden
              className="inline-flex h-8 items-center self-start rounded-pill px-[13px] text-xs font-semibold ring-[1.5px] ring-brume ring-inset"
            >
              {t("ai.dispute.cta")}
            </span>
          </ControlCard>
          <ControlCard
            index={2}
            icon="reglages"
            tile="bg-menthe-claire"
            title={t("matchingPage.s9.title")}
            body={t("matchingPage.s9.body")}
          >
            <span
              aria-hidden
              className="flex items-center gap-3 rounded-[18px] bg-blanc px-3.5 py-3"
            >
              <span className="flex-1 text-[13px]">{t("settings.privacy.ai.matching.text")}</span>
              <span className="relative inline-block h-[26px] w-11 shrink-0 rounded-pill bg-sapin">
                <span className="absolute top-[3px] right-[3px] size-5 rounded-full bg-lime" />
              </span>
            </span>
          </ControlCard>
        </ul>
      </MarketingSection>

      {/* FAQ */}
      <MarketingSection
        tone="blanc"
        innerClassName="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-20"
      >
        <div data-reveal className="flex flex-col gap-5 lg:w-[380px] lg:shrink-0">
          <Eyebrow>{t("matchingPage.faq.eyebrow")}</Eyebrow>
          <h2 className={sectionTitle}>{t("matchingPage.faq.title")}</h2>
          <p className="text-[15px] leading-6 text-ardoise">{t("matchingPage.contact")}</p>
        </div>
        <div data-reveal className="min-w-0 lg:flex-1" style={stagger(1)}>
          <FaqAccordion
            onWhite
            items={([1, 2, 3, 4] as const).map((n) => ({
              question: t(`matchingPage.faq.q${n}`),
              answer: t(`matchingPage.faq.a${n}`),
            }))}
          />
        </div>
      </MarketingSection>

      {/* Closing band on the AI gradient */}
      <section className="bg-papier py-14 lg:py-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 xl:px-0">
          <div
            data-reveal
            className="jm-flow relative flex flex-col items-start gap-6 overflow-hidden rounded-[32px] bg-sapin px-6 py-8 text-blanc lg:flex-row lg:items-center lg:rounded-[48px] lg:px-12 lg:py-10"
          >
            <AiOrb size={56} className="jm-pulse relative" />
            <h2 className="relative flex-1 text-[26px] leading-8 font-semibold tracking-[-0.025em] lg:text-[32px] lg:leading-[38px]">
              {t("matchingPage.finalCta.title")}
            </h2>
            <SiteButton href={joinHref({ profil: "talent" })} tone="lime" className="relative">
              {t("matchingPage.cta")}
            </SiteButton>
          </div>
        </div>
      </section>
    </>
  );
}

/** Score ring of the hero: the arc fills, the number counts up, the orb pulses. */
function ScoreRing({
  score,
  band,
  why,
  alt,
}: {
  score: number;
  band: string;
  why: string;
  alt: string;
}) {
  const radius = 116;
  return (
    <div className="flex flex-col items-center gap-4 lg:w-[480px] lg:shrink-0">
      <div
        role="img"
        aria-label={alt}
        className="jm-rise relative size-[260px] lg:size-[320px]"
        style={stagger(3)}
      >
        <span
          aria-hidden
          className="jm-pulse absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(166,242,107,0.25), transparent 65%)" }}
        />
        <svg viewBox="0 0 260 260" aria-hidden className="absolute inset-[8%] -rotate-90">
          <defs>
            <linearGradient id="matching-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#D9FA72" />
              <stop offset="0.5" stopColor="#A6F26B" />
              <stop offset="1" stopColor="#7DE36B" />
            </linearGradient>
          </defs>
          <circle
            cx="130"
            cy="130"
            r={radius}
            fill="none"
            strokeWidth="16"
            stroke="rgb(255 255 255 / 0.14)"
          />
          <circle
            cx="130"
            cy="130"
            r={radius}
            fill="none"
            strokeWidth="16"
            strokeLinecap="round"
            stroke="url(#matching-ring)"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - score / 100}
            className="jm-ring-arc"
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <AiOrb size={36} className="jm-float" />
          <span className="mt-2 text-[52px] leading-[56px] font-semibold tracking-[-0.04em] lg:text-[64px] lg:leading-[68px]">
            <CountUp text={`${score} %`} />
          </span>
          <span className="text-sm text-neon">{band}</span>
        </span>
      </div>
      <a
        href="#score"
        className="inline-flex items-center gap-2 text-sm font-semibold text-neon hover:underline"
      >
        <Icon name="eye" className="size-4" />
        {why}
      </a>
    </div>
  );
}

function ControlCard({
  index,
  icon,
  tile,
  title,
  body,
  children,
}: {
  index: number;
  icon: IconName;
  tile: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <li
      data-reveal
      className="jm-lift flex flex-col gap-3.5 rounded-card bg-blanc p-6 lg:p-7"
      style={stagger(index)}
    >
      <IconTile icon={icon} className={cx(tile, "text-sapin")} />
      <h2 className="text-[21px] leading-[27px] font-semibold tracking-[-0.015em]">{title}</h2>
      <p className="text-[15px] leading-6 text-ardoise">{body}</p>
      <span className="flex-1" />
      {children}
    </li>
  );
}

/**
 * Fictional explanation of a score (mockup 01-09), built from the texts of the « Pourquoi ? »
 * panel. It keeps the human control: see the course or ignore it, and report an error.
 */
async function WhyCard({ score }: { score: number }) {
  const t = await getTranslations();
  const e = (key: string) => t(`matchingPage.example.${key}` as "matchingPage.example.job");
  const met = [
    t("match.why.talent.met.item.skillVerified", { skill: e("skill") }),
    t("match.why.talent.met.item.experience", { years: 2, min: 1 }),
    t("match.why.talent.met.item.language", { language: e("language"), level: e("languageLevel") }),
    t("match.why.talent.met.item.location", { city: e("city"), workMode: e("workMode") }),
  ];
  return (
    <figure
      data-reveal="zoom"
      aria-label={t("matchingPage.s5.imageAlt")}
      className="jm-ring flex flex-col gap-3.5 rounded-card bg-blanc p-5 shadow-[0_30px_60px_rgba(11,26,31,0.14)] lg:w-[540px] lg:shrink-0 lg:p-[26px]"
    >
      <div className="flex items-center gap-3">
        <AiOrb size={32} className="jm-pulse" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-base font-semibold">{t("match.why.talent.title", { score })}</span>
          <span className="text-[11px] leading-[15px] text-ardoise">
            {e("job")} · {e("company")}
          </span>
        </span>
        <span className="inline-flex h-[26px] shrink-0 items-center gap-1.5 rounded-pill bg-gradient-ai px-2.5 text-[11px] font-semibold text-blanc">
          <Icon name="intelligence" className="size-3" />
          {t("match.score.compact", { score })}
        </span>
      </div>
      <p className="text-[13px] leading-5 text-ardoise">
        {t("match.why.talent.intro", { jobTitle: e("job") })}
      </p>
      <div className="flex flex-col gap-2">
        <p className="text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-feuille-fonce uppercase">
          {t("match.why.talent.met.title")}
        </p>
        <ul className="flex flex-col gap-1.5">
          {met.map((line) => (
            <li key={line} className="flex items-center gap-2 text-[13px] leading-5">
              <Icon name="check" className="size-4 shrink-0 text-feuille-fonce" />
              {line}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-ambre-texte uppercase">
          {t("match.why.talent.partial.title")}
        </p>
        <p className="flex items-center gap-2 text-[13px] leading-5">
          <Icon name="chev-r" className="size-4 shrink-0 text-ambre-texte" />
          {t("match.why.talent.partial.item.language", {
            language: e("partialLanguage"),
            expected: e("partialExpected"),
            actual: e("partialActual"),
          })}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-ardoise uppercase">
          {t("match.why.talent.missing.title")}
        </p>
        <p className="flex items-center gap-2 text-[13px] leading-5">
          <Icon name="ajouter" className="size-4 shrink-0" />
          {t("match.why.talent.missing.preferred", { skill: e("missingSkill") })}
        </p>
      </div>
      <div className="flex flex-col gap-2 rounded-[16px] bg-lime-clair px-3.5 py-3">
        <span className="text-[11px] leading-[15px] font-semibold">
          {t("match.why.talent.courses.title")}
        </span>
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px]">
            {t("match.why.talent.courses.item", { courseTitle: e("course"), hours: 6 })}
          </span>
          <span className="inline-flex h-6 items-center rounded-pill bg-lime px-2.5 text-[11px] font-semibold">
            {t("match.why.talent.courses.included")}
          </span>
        </span>
        <span className="text-[11px] leading-[15px] text-ardoise">
          {t("match.why.talent.courses.impact", { newScore: 91 })}
        </span>
      </div>
      <div aria-hidden className="flex gap-2">
        <span className="inline-flex h-8 items-center rounded-pill bg-sapin px-[13px] text-xs font-semibold text-blanc">
          {t("match.why.talent.courses.cta")}
        </span>
        <span className="inline-flex h-8 items-center rounded-pill px-[13px] text-xs font-semibold ring-[1.5px] ring-brume ring-inset">
          {t("ai.card.ignore")}
        </span>
      </div>
      <p className="flex items-center gap-1.5 text-[11px] leading-[15px] text-ardoise">
        <Icon name="edit" className="size-3.5 shrink-0" />
        {t("match.why.talent.reportError")}
      </p>
    </figure>
  );
}
