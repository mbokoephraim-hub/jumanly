import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon, type IconName } from "@/components/brand/icon";
import { pillClass } from "@/components/career/kit";
import { ScanScene, type ScanCard } from "@/components/motion/scan";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { discardDiagnosticDraftAction } from "@/server/actions/diagnostic";
import { dimensions } from "@/server/services/diagnostic-scoring";

const hooks: { key: "dimensions" | "steps" | "explained"; icon: IconName }[] = [
  { key: "dimensions", icon: "objectif" },
  { key: "steps", icon: "suivant" },
  { key: "explained", icon: "intelligence" },
];

/**
 * Launch card of the diagnostic (docs/experience-animee § 5.1, made shorter in 2026-10): a short
 * hook, three one-line hooks with an icon, the option to start from the profile and one main
 * button (« Lancer », or « Reprendre… » with a draft); the talent's card floats on the Nuit-orbe
 * scene beside it. Plain links and forms: it works without JavaScript.
 */
export async function DiagnosticWelcome({
  badge,
  withAi,
  resume,
  again,
  upsell,
}: {
  badge: ScanCard;
  withAi: boolean;
  /** Dimension (1 to 6) where the draft in progress stopped. */
  resume: number | null;
  /** The talent already has a result: « Refaites le point ». */
  again: boolean;
  /** Plan that opens the personalized diagnostic, when the talent does not have it. */
  upsell: string | null;
}) {
  const t = await getTranslations("career.diagnostic");
  const d = dynamic(t);
  const prefill = (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-sapin">
      <input
        type="checkbox"
        name="profil"
        value="1"
        defaultChecked
        className="mt-0.5 size-5 shrink-0 accent-sapin"
      />
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold">{t("q.useProfile")}</span>
        <span className="text-[13px] text-ardoise">{t("welcome.prefillHint")}</span>
      </span>
    </label>
  );
  return (
    <section
      aria-labelledby="diagnostic-welcome"
      className="grid grid-cols-1 items-center gap-6 overflow-hidden rounded-[22px] border border-sapin/8 bg-blanc p-4 text-sapin sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-8 lg:p-6"
    >
      <div className="flex flex-col gap-4">
        <p className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span
            className={cx(
              "flex items-center gap-1.5 rounded-pill px-3 py-1.5",
              withAi ? "bg-lime text-sapin" : "bg-creme text-sapin",
            )}
          >
            <Icon name="intelligence" className="size-3.5" />
            {withAi ? t("badge.personalized") : t("badge.simple")}
          </span>
          {upsell && (
            <span className="flex flex-wrap items-center gap-x-2 text-ardoise">
              {t("upsell", { plan: upsell })}
              <Link href="/app/abonnement" className="text-sapin underline underline-offset-2">
                {t("welcome.plans")}
              </Link>
            </span>
          )}
        </p>
        <div className="flex flex-col gap-1">
          <h2
            id="diagnostic-welcome"
            className="text-[24px] leading-tight font-semibold tracking-tight lg:text-[28px]"
          >
            {again ? t("welcome.titleAgain") : t("welcome.title")}
          </h2>
          <p className="text-sm text-ardoise">
            {t("welcome.tagline", { duration: t("welcome.duration") })}
          </p>
        </div>
        <ul className="grid gap-2.5 sm:grid-cols-3">
          {hooks.map((hook) => (
            <li key={hook.key} className="flex flex-col gap-1.5 rounded-[16px] bg-creme p-3">
              <span
                aria-hidden
                className="grid size-8 place-items-center rounded-[10px] bg-sapin text-lime"
              >
                <Icon name={hook.icon} className="size-4" />
              </span>
              <b className="text-[14px] leading-tight font-semibold">
                {d(`welcome.hook.${hook.key}`)}
              </b>
              <span className="text-xs leading-[17px] text-ardoise">
                {d(`welcome.hook.${hook.key}Text`)}
              </span>
            </li>
          ))}
        </ul>
        {resume ? (
          <div className="flex flex-col gap-4">
            <Link
              href="/app/career/diagnostic?etape=reprendre"
              className={pillClass("lime", "md", "self-start")}
            >
              {t("welcome.resume", { current: resume, total: dimensions.length })}
              <Icon name="chev-r" className="size-4" />
            </Link>
            <form action={discardDiagnosticDraftAction} className="flex flex-col gap-4">
              {prefill}
              <button type="submit" className={pillClass("outline", "md", "self-start")}>
                {t("welcome.restart")}
              </button>
            </form>
          </div>
        ) : (
          <form action="/app/career/diagnostic" className="flex flex-col gap-4">
            <input type="hidden" name="etape" value="1" />
            {prefill}
            <button type="submit" className={pillClass("lime", "md", "self-start")}>
              {t("welcome.launch")}
              <Icon name="chev-r" className="size-4" />
            </button>
          </form>
        )}
        <p className="flex items-center gap-2.5 border-t border-brume pt-3.5 text-[15px] leading-snug font-medium">
          <AiOrb size={22} />
          {withAi ? t("welcome.ai.personalized") : t("welcome.ai.simple")}
        </p>
      </div>
      <ScanScene
        card={badge}
        nodesLabel={t("welcome.constellation")}
        nodes={dimensions.map((key) => ({ key, label: d(`dimension.${key}.short`), band: null }))}
      />
    </section>
  );
}
