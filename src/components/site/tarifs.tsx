import { getTranslations } from "next-intl/server";
import type { PlanFamily } from "@/generated/prisma/client";
import { Icon, type IconName } from "@/components/brand/icon";
import { stagger } from "@/components/site/marketing";
import { comparePrefix, planValues } from "@/components/site/pricing";
import { ButtonLink } from "@/components/ui";
import { compareRows, type CompareCell } from "@/config/pricing-compare";
import { dynamic, numbered } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { planCtaHref, plansOf, type PublicPlan } from "@/server/services/plans";

/*
 * Building blocks of /tarifs (maquette 05-01). Plans, prices and capacities come from the database
 * (CLAUDE.md § 2): nothing here names a plan.
 */

type CardTone = "blanc" | "sapin" | "lime" | "nuit";

/**
 * Card color, from the plan's data only: the recommended plan in Sapin, the plan sold on quote in
 * Nuit, the top plan of a four-plan family in Lime, the others in Blanc.
 */
function cardTone(plan: PublicPlan, index: number, count: number): CardTone {
  if (plan.recommended) return "sapin";
  if (plan.priceCents === null && !plan.isPurchasable) return "nuit";
  if (count >= 4 && index === count - 1) return "lime";
  return "blanc";
}

/** Icon of each card, by family and position. */
const familyIcons: Partial<Record<PlanFamily, IconName[]>> = {
  talent: ["diplome", "objectif", "career", "etoile"],
  rh: ["hire", "equipe", "statistiques"],
  company: ["entreprise", "equipe", "reglages"],
};

type ToneStyle = {
  card: string;
  tile: string;
  badge: string;
  button: "primary" | "secondary" | "tertiary";
  sep: string;
  disc: string;
  ideal: string;
  idealIcon: string;
};

// Modèle B site (docs/modele-b-recruteur/web/captures/002-Web-Site-tarifs.jpg): Surface cards with
// a hairline, the recommended one outlined in Lime with the only Lime button.
const plainTone: ToneStyle = {
  card: "bg-blanc text-sapin ring-1 ring-sapin/10 ring-inset",
  tile: "bg-[#1c3a2c] text-lime",
  badge: "bg-neon text-sapin",
  button: "tertiary",
  sep: "bg-sapin/10",
  disc: "bg-[#1c3a2c] text-lime",
  ideal: "bg-papier",
  idealIcon: "text-lime",
};

const tones: Record<CardTone, ToneStyle> = {
  blanc: plainTone,
  sapin: {
    ...plainTone,
    card: "bg-blanc text-sapin ring-[1.5px] ring-lime ring-inset",
    badge: "bg-lime text-sapin",
    button: "primary",
    disc: "bg-lime text-sapin",
  },
  lime: plainTone,
  nuit: { ...plainTone, card: "bg-nuit text-blanc ring-1 ring-blanc/10 ring-inset" },
};

/** « Idéal pour : {audience} » with its label in bold, cut from the one text of the card. */
function IdealFor({ text, audience }: { text: string; audience: string }) {
  const at = text.lastIndexOf(audience);
  if (at <= 0) return <>{text}</>;
  return (
    <>
      <b className="font-semibold">{text.slice(0, at).trimEnd()}</b> {text.slice(at)}
    </>
  );
}

/**
 * Plan cards: icon tile, badge, price, button, « Tout X, plus : », features on discs, note and
 * « Idéal pour ». `current` holds the codes of the signed-in visitor's plans: that card shows
 * « Votre formule actuelle » instead of its button.
 */
export async function TarifPlanCards({
  plans,
  family,
  current = [],
}: {
  plans: PublicPlan[];
  family: PlanFamily;
  current?: string[];
}) {
  const t = dynamic(await getTranslations());
  const list = plansOf(plans, family);
  const icons = familyIcons[family] ?? [];
  return (
    <ul
      className={cx(
        "grid items-stretch gap-3.5 md:grid-cols-2 lg:gap-5",
        list.length >= 4 ? "xl:grid-cols-4" : "lg:grid-cols-3",
      )}
    >
      {list.map((plan, index) => {
        const key = plan.contentKey;
        const values = planValues(plan);
        const tone = tones[cardTone(plan, index, list.length)];
        const previous = index > 0 && t.has(`${key}.includes`) ? list[index - 1] : undefined;
        const tagline = plan.tagline || (t.has(`${key}.tagline`) ? t(`${key}.tagline`) : "");
        const badge = t.has(`${key}.badge`)
          ? t(`${key}.badge`)
          : plan.recommended
            ? t("common.recommended")
            : undefined;
        const audience = t(`${key}.ideal`);
        return (
          <li
            key={plan.code}
            data-reveal
            style={stagger(index)}
            className={cx(
              "jm-lift relative flex flex-col gap-4 overflow-hidden rounded-[28px] px-6 py-[26px]",
              tone.card,
            )}
          >
            {badge && (
              <span
                className={cx(
                  "absolute top-6 right-[22px] inline-flex h-6 items-center rounded-pill px-2.5 text-[11px] font-semibold whitespace-nowrap",
                  tone.badge,
                )}
              >
                {badge}
              </span>
            )}
            <span
              aria-hidden
              className={cx("flex size-11 items-center justify-center rounded-[14px]", tone.tile)}
            >
              <Icon name={icons[index] ?? "etoile"} className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-[21px] leading-[26px] font-semibold tracking-[-0.015em]">
                {plan.name}
              </h3>
              {tagline && <p className="text-[13px] leading-[18px] opacity-75">{tagline}</p>}
            </div>
            {plan.priceCents === 0 ? (
              <p className="text-[40px] leading-[46px] font-semibold tracking-[-0.035em]">
                {t("pricing.card.free")}
              </p>
            ) : plan.priceCents === null ? (
              <p className="text-[36px] leading-[46px] font-semibold tracking-[-0.03em]">
                {t("pricing.card.quote")}
              </p>
            ) : (
              <p className="flex items-baseline gap-1.5">
                <span className="text-[44px] leading-[46px] font-semibold tracking-[-0.04em]">
                  {formatUsd(plan.priceCents)}
                </span>
                <span className="font-semibold">{t("pricing.card.currency")}</span>
                <span className="text-xs opacity-85">{t("pricing.card.perMonth")}</span>
              </p>
            )}
            {current.includes(plan.code) ? (
              <p
                className={cx(
                  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill text-sm font-semibold",
                  tone.ideal,
                )}
              >
                <Icon name="check" className="size-5" />
                {t("pricing.card.current")}
              </p>
            ) : (
              <ButtonLink href={planCtaHref(plan)} variant={tone.button} size="lg" fullWidth>
                {t(`${key}.cta`)}
              </ButtonLink>
            )}
            <div aria-hidden className={cx("h-px", tone.sep)} />
            {previous && (
              <p className="text-[11px] leading-[14px] font-semibold tracking-[0.09em] uppercase opacity-75">
                {t("pricing.card.includesPrevious", { plan: previous.name })}
              </p>
            )}
            <ul className="flex flex-col gap-2.5">
              {numbered(t, `${key}.f`, values).map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-[14.5px] leading-[21px] xl:text-[13px] xl:leading-[19px]"
                >
                  <span
                    aria-hidden
                    className={cx(
                      "mt-px flex size-5 shrink-0 items-center justify-center rounded-full",
                      tone.disc,
                    )}
                  >
                    <Icon name="check" className="size-3" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            {t.has(`${key}.note`) && (
              <p className="text-xs leading-[17px] opacity-85">{t(`${key}.note`)}</p>
            )}
            <div className="flex-1" />
            <p
              className={cx(
                "flex items-center gap-2.5 rounded-[16px] px-3.5 py-3 text-xs leading-4",
                tone.ideal,
              )}
            >
              <Icon name="objectif" className={cx("size-[18px] shrink-0", tone.idealIcon)} />
              <span>
                <IdealFor text={t("pricing.card.idealFor", { audience })} audience={audience} />
              </span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Comparison: title and an outlined toggle, then the table in a white card; the recommended
 * plan's column has a Sapin head and Lime clair cells. Native <details>, folded by default
 * (`OpenOnWide` unfolds the Talents one on desktop). Checks and dashes have a text alternative.
 */
export async function TarifCompare({
  plans,
  family,
  id,
}: {
  plans: PublicPlan[];
  family: PlanFamily;
  id: string;
}) {
  const t = dynamic(await getTranslations());
  const rows = compareRows[family];
  const prefix = comparePrefix[family];
  if (!rows || !prefix) return null;
  const list = plansOf(plans, family);

  const mark = (on: boolean) =>
    on ? (
      <span
        role="img"
        aria-label={t("common.included")}
        className="mx-auto flex size-[22px] items-center justify-center rounded-full bg-sapin text-lime"
      >
        <Icon name="check" className="size-3" />
      </span>
    ) : (
      <span role="img" aria-label={t("common.notIncluded")} className="inline-flex">
        <span aria-hidden className="mx-auto h-0.5 w-3.5 rounded-pill bg-[#b9c5c1]" />
      </span>
    );
  const cell = (value: CompareCell) => {
    switch (value.kind) {
      case "check":
        return mark(true);
      case "dash":
        return mark(false);
      case "value":
        return value.value;
      case "text":
        return t(value.key.startsWith("ui.") ? value.key : `${prefix}.${value.key}`, value.values);
    }
  };
  const price = (plan: PublicPlan) =>
    plan.priceCents === 0
      ? t("pricing.card.free")
      : plan.priceCents === null
        ? t("pricing.card.quote")
        : t(`${plan.contentKey}.price`, planValues(plan));

  return (
    <details id={id} className="group">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-4 sm:justify-between [&::-webkit-details-marker]:hidden">
        <h3 className="hidden text-[26px] leading-8 font-semibold tracking-[-0.02em] sm:block">
          {t(`${prefix}.title`)}
        </h3>
        <span className="inline-flex h-11 items-center gap-2 rounded-pill bg-blanc px-5 text-[13px] font-semibold whitespace-nowrap ring-[1.5px] ring-brume ring-inset">
          <span className="sr-only">{t(`${prefix}.title`)} · </span>
          <span className="group-open:hidden">{t("pricing.talent.compare.toggleShow")}</span>
          <span className="hidden group-open:inline">{t("pricing.talent.compare.toggleHide")}</span>
          <Icon
            name="chev-d"
            className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          />
        </span>
      </summary>
      <div
        className="mt-6 overflow-x-auto rounded-[24px] bg-blanc px-2 pb-4 ring-[1.5px] ring-brume ring-inset sm:px-[18px]"
        tabIndex={0}
        role="region"
        aria-label={t(`${prefix}.title`)}
      >
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr>
              <th
                scope="col"
                className="px-[18px] pt-7 pb-4 align-bottom text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-ardoise uppercase"
              >
                {t("pricing.talent.compare.colFeature")}
              </th>
              {list.map((plan) => (
                <th
                  key={plan.code}
                  scope="col"
                  className={cx(
                    "w-[17%] px-3 pt-7 pb-4 text-center align-bottom",
                    plan.recommended && "rounded-t-[16px] bg-sapin text-blanc",
                  )}
                >
                  <span className="block text-[15px] leading-5 font-semibold">{plan.name}</span>
                  <span className="mt-1 block text-[11.5px] leading-4 font-normal opacity-75">
                    {price(plan)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.label} className="border-t border-brume">
                <th scope="row" className="px-[18px] py-4 text-sm leading-[22px] font-semibold">
                  {t(`${prefix}.${row.label}`)}
                </th>
                {list.map((plan) => (
                  <td
                    key={plan.code}
                    className={cx(
                      "px-3 py-4 text-center text-[13.5px] leading-5",
                      plan.recommended && "bg-lime-clair",
                      plan.recommended && rowIndex === rows.length - 1 && "rounded-b-[16px]",
                    )}
                  >
                    {cell(row.cell(plan))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Band of a family (partners licence, upsell): tile, title, text and a button, on a Surface card. */
export function TarifBand({
  icon,
  title,
  text,
  cta,
  href,
}: {
  icon: IconName;
  title: string;
  text: string;
  cta: string;
  href: string;
}) {
  return (
    <div
      data-reveal
      className={cx(
        "flex flex-col items-start gap-4 rounded-[24px] p-6 sm:flex-row sm:items-center sm:gap-5 sm:px-7 sm:py-[22px]",
        "jm-card",
      )}
    >
      <span className="jm-float flex size-[52px] shrink-0 items-center justify-center rounded-[14px] bg-lime text-sapin">
        <Icon name={icon} className="size-6" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-[17px] leading-[23px] font-semibold">{title}</h3>
        <p className="text-[13.5px] leading-5 text-ardoise">{text}</p>
      </div>
      <ButtonLink href={href} variant="secondary" iconAfter={<Icon name="chev-r" />}>
        {cta}
      </ButtonLink>
    </div>
  );
}
